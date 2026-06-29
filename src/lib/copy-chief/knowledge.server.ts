import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

import type {
  CopyChiefIngestResult,
  CopyChiefKnowledgeSourceType,
  CopyChiefKnowledgeStatus,
  CopyChiefSyncResult,
  IngestCopyChiefSourceInput,
  RuntimeKnowledgeCard,
} from "./knowledge";

type SourceManifestEntry = {
  hash: string;
  title: string;
  sourceType: CopyChiefKnowledgeSourceType;
  sourceUrls: string[];
  sourcePath: string;
  cardsAdded: number;
  uploadedFileIds: string[];
  createdAt: string;
};

type VectorStoreCache = {
  id: string;
  name: string;
  createdAt: string;
};

type FetchedSource = {
  title: string;
  url?: string;
  text: string;
};

type WordPressRestItem = {
  id?: number;
  link?: string;
  slug?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
};

type OpenAIFileResponse = {
  id?: string;
  error?: { message?: string };
};

type OpenAIVectorStoreResponse = {
  id?: string;
  error?: { message?: string };
};

type OpenAIVectorStoreFileResponse = {
  id?: string;
  status?: string;
  error?: { message?: string };
};

const MAX_TEXT_PER_PAGE = 14000;
const KNOWLEDGE_DIR = resolve(process.cwd(), "../knowledge/copy-chief");
const BANKS_DIR = resolve(process.cwd(), "../knowledge/banks");
const CARDS_PATH = resolve(KNOWLEDGE_DIR, "source-cards.jsonl");
const MANIFEST_PATH = resolve(KNOWLEDGE_DIR, "source-manifest.jsonl");
const VECTOR_STORE_PATH = resolve(KNOWLEDGE_DIR, "vector-store.json");
const SOURCES_DIR = resolve(KNOWLEDGE_DIR, "sources");

function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isMissingFile(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function ensureFileDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}

async function writeJsonl<T>(filePath: string, entries: T[]) {
  await ensureFileDir(filePath);
  const text = entries.map((entry) => JSON.stringify(entry)).join("\n");
  await writeFile(filePath, text ? `${text}\n` : "", "utf8");
}

async function appendJsonl<T>(filePath: string, entries: T[]) {
  const existing = await readJsonl<T>(filePath);
  await writeJsonl(filePath, [...existing, ...entries]);
}

async function readVectorStoreCache(): Promise<VectorStoreCache | null> {
  try {
    return JSON.parse(await readFile(VECTOR_STORE_PATH, "utf8")) as VectorStoreCache;
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

async function writeVectorStoreCache(cache: VectorStoreCache) {
  await ensureFileDir(VECTOR_STORE_PATH);
  await writeFile(VECTOR_STORE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

export async function resolveVectorStoreId() {
  if (process.env.OPENAI_VECTOR_STORE_ID) {
    return {
      id: process.env.OPENAI_VECTOR_STORE_ID,
      source: "env" as const,
    };
  }

  const cache = await readVectorStoreCache();
  if (cache?.id) {
    return {
      id: cache.id,
      source: "local" as const,
    };
  }

  return {
    id: null,
    source: "none" as const,
  };
}

export async function getCopyChiefKnowledgeStatus(): Promise<CopyChiefKnowledgeStatus> {
  const cards = await readJsonl<RuntimeKnowledgeCard>(CARDS_PATH);
  const bankGroups = await readBankCardsByBank();
  const bankCards = bankGroups.flatMap((bank) => bank.cards);
  const manifest = await readJsonl<SourceManifestEntry>(MANIFEST_PATH);
  const vectorStore = await resolveVectorStoreId();
  const apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const lastUpdatedAt =
    manifest
      .map((entry) => entry.createdAt)
      .sort()
      .at(-1) ?? null;

  const missing: string[] = [];
  if (!apiKeyConfigured) missing.push("OPENAI_API_KEY");

  return {
    apiKeyConfigured,
    vectorStoreId: vectorStore.id,
    vectorStoreSource: vectorStore.source,
    localCardCount: cards.length,
    bankCount: bankGroups.length,
    bankCardCount: bankCards.length,
    sourceCount: manifest.length,
    lastUpdatedAt,
    knowledgePath: KNOWLEDGE_DIR,
    generationMode: apiKeyConfigured
      ? vectorStore.id
        ? "model_and_file_search"
        : "model_with_local_cards"
      : "preview_only",
    missing,
  };
}

export async function syncCopyChiefKnowledgeToFileSearch(): Promise<CopyChiefSyncResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      mode: "setup_needed",
      message: "OPENAI_API_KEY is required before local sources can be synced to File Search.",
      syncedSources: 0,
      uploadedFileIds: [],
      vectorStoreId: (await resolveVectorStoreId()).id,
      status: await getCopyChiefKnowledgeStatus(),
      errors: [],
    };
  }

  const manifest = await readJsonl<SourceManifestEntry>(MANIFEST_PATH);
  const unsynced = manifest.filter((entry) => entry.uploadedFileIds.length === 0);

  if (!unsynced.length) {
    return {
      mode: "nothing_to_sync",
      message: "All local sources already have uploaded File Search files.",
      syncedSources: 0,
      uploadedFileIds: [],
      vectorStoreId: (await resolveVectorStoreId()).id,
      status: await getCopyChiefKnowledgeStatus(),
      errors: [],
    };
  }

  const errors: string[] = [];
  const uploadedFileIds: string[] = [];
  let vectorStoreId: string | null = null;
  const updatedManifest = [...manifest];

  try {
    vectorStoreId = await getOrCreateOpenAIVectorStore(apiKey);

    for (const entry of unsynced) {
      try {
        const content = await readFile(entry.sourcePath, "utf8");
        const fileId = await uploadOpenAIFile(
          apiKey,
          content,
          `${slugify(entry.title) || "copy-chief-source"}.md`,
        );
        await attachFileToVectorStore(apiKey, vectorStoreId, fileId, {
          source_type: entry.sourceType,
          source_title: entry.title.slice(0, 120),
        });

        uploadedFileIds.push(fileId);
        const manifestIndex = updatedManifest.findIndex((item) => item.hash === entry.hash);
        if (manifestIndex >= 0) {
          updatedManifest[manifestIndex] = {
            ...updatedManifest[manifestIndex],
            uploadedFileIds: [fileId],
          };
        }
      } catch (error) {
        errors.push(
          `${entry.title}: ${error instanceof Error ? error.message : "Source upload failed."}`,
        );
      }
    }

    await writeJsonl(MANIFEST_PATH, updatedManifest);

    return {
      mode: uploadedFileIds.length ? "synced" : "api_error",
      message: uploadedFileIds.length
        ? "Local sources synced to File Search."
        : "No local sources could be uploaded to File Search.",
      syncedSources: uploadedFileIds.length,
      uploadedFileIds,
      vectorStoreId,
      status: await getCopyChiefKnowledgeStatus(),
      errors,
    };
  } catch (error) {
    return {
      mode: "api_error",
      message: error instanceof Error ? error.message : "File Search sync failed.",
      syncedSources: uploadedFileIds.length,
      uploadedFileIds,
      vectorStoreId,
      status: await getCopyChiefKnowledgeStatus(),
      errors,
    };
  }
}

export async function selectRelevantKnowledgeCards(query: string, limit = 12) {
  const cards = [
    ...(await readJsonl<RuntimeKnowledgeCard>(CARDS_PATH)),
    ...(await readBankCards()),
  ];
  if (!cards.length) return [];

  const tokens = tokenize(query);
  const scored = cards.map((card, index) => ({
    card,
    index,
    score: scoreCard(card, tokens),
  }));

  const sorted = scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.card.createdAt.localeCompare(a.card.createdAt);
  });

  const relevant = sorted.filter((item) => item.score > 0).slice(0, limit);
  if (relevant.length) return relevant.map((item) => item.card);

  return sorted.slice(0, limit).map((item) => item.card);
}

async function readBankCards() {
  const bankGroups = await readBankCardsByBank();
  return bankGroups.flatMap((bank) => bank.cards);
}

async function readBankCardsByBank() {
  try {
    const entries = await readdir(BANKS_DIR, { withFileTypes: true });
    const bankDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const bankGroups: Array<{ bank: string; cards: RuntimeKnowledgeCard[] }> = [];

    for (const bank of bankDirs) {
      const cards = await readJsonl<RuntimeKnowledgeCard>(resolve(BANKS_DIR, bank, "cards.jsonl"));
      if (cards.length) bankGroups.push({ bank, cards: cards.map((card) => ({ ...card, bank })) });
    }

    return bankGroups;
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
}

export async function ingestCopyChiefSource(
  input: IngestCopyChiefSourceInput,
): Promise<CopyChiefIngestResult> {
  const errors: string[] = [];

  if (!input.permissionConfirmed) {
    return {
      mode: "permission_required",
      message: "Confirm permission to store and use this source before ingestion.",
      addedCards: [],
      pagesFetched: 0,
      sourceUrls: [],
      uploadedFileIds: [],
      vectorStoreId: null,
      status: await getCopyChiefKnowledgeStatus(),
      errors: [],
    };
  }

  if (input.sourceType === "url_archive" && !input.url.trim()) {
    return inputError("Add the archive URL before ingesting.");
  }

  if (input.sourceType !== "url_archive" && input.text.trim().length < 40) {
    return inputError("Add transcript, research, or swipe text before ingesting.");
  }

  try {
    const fetchedSources =
      input.sourceType === "url_archive"
        ? await fetchArchiveSources(input)
        : [
            {
              title: input.title,
              text: normalizeWhitespace(input.text),
            },
          ];

    if (!fetchedSources.length) {
      return inputError("No readable source text was found.");
    }

    const markdown = buildSourceMarkdown(input, fetchedSources);
    const sourceHash = hashText(markdown);
    const manifest = await readJsonl<SourceManifestEntry>(MANIFEST_PATH);
    const existing = manifest.find((entry) => entry.hash === sourceHash);

    if (existing) {
      return {
        mode: "already_present",
        message: "This source is already in the Copy Chief knowledge bank.",
        addedCards: [],
        pagesFetched: fetchedSources.length,
        sourceUrls: fetchedSources.flatMap((source) => (source.url ? [source.url] : [])),
        uploadedFileIds: existing.uploadedFileIds,
        vectorStoreId: (await resolveVectorStoreId()).id,
        status: await getCopyChiefKnowledgeStatus(),
        errors,
      };
    }

    const createdAt = new Date().toISOString();
    const cards = buildRuntimeCards(input, fetchedSources, sourceHash, createdAt);
    const sourcePath = resolve(
      SOURCES_DIR,
      `${createdAt.replace(/[:.]/g, "-")}-${slugify(input.title)}.md`,
    );

    await ensureFileDir(sourcePath);
    await writeFile(sourcePath, markdown, "utf8");
    await appendJsonl(CARDS_PATH, cards);

    const uploadedFileIds: string[] = [];
    let vectorStoreId: string | null = null;

    if (input.uploadToVectorStore && process.env.OPENAI_API_KEY) {
      try {
        vectorStoreId = await getOrCreateOpenAIVectorStore(process.env.OPENAI_API_KEY);
        const fileId = await uploadOpenAIFile(
          process.env.OPENAI_API_KEY,
          markdown,
          `${slugify(input.title) || "copy-chief-source"}.md`,
        );
        await attachFileToVectorStore(process.env.OPENAI_API_KEY, vectorStoreId, fileId, {
          source_type: input.sourceType,
          source_title: input.title.slice(0, 120),
        });
        uploadedFileIds.push(fileId);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "OpenAI upload failed.");
      }
    }

    await appendJsonl<SourceManifestEntry>(MANIFEST_PATH, [
      {
        hash: sourceHash,
        title: input.title,
        sourceType: input.sourceType,
        sourceUrls: fetchedSources.flatMap((source) => (source.url ? [source.url] : [])),
        sourcePath,
        cardsAdded: cards.length,
        uploadedFileIds,
        createdAt,
      },
    ]);

    const uploaded = uploadedFileIds.length > 0;

    return {
      mode: uploaded ? "stored_and_uploaded" : "stored",
      message: uploaded
        ? "Source stored locally, converted into cards, and uploaded to File Search."
        : "Source stored locally and converted into cards. Add OPENAI_API_KEY to enable model generation and File Search upload.",
      addedCards: cards,
      pagesFetched: fetchedSources.length,
      sourceUrls: fetchedSources.flatMap((source) => (source.url ? [source.url] : [])),
      uploadedFileIds,
      vectorStoreId,
      status: await getCopyChiefKnowledgeStatus(),
      errors,
    };
  } catch (error) {
    return {
      mode: "api_error",
      message: error instanceof Error ? error.message : "Source ingestion failed.",
      addedCards: [],
      pagesFetched: 0,
      sourceUrls: [],
      uploadedFileIds: [],
      vectorStoreId: (await resolveVectorStoreId()).id,
      status: await getCopyChiefKnowledgeStatus(),
      errors,
    };
  }
}

async function inputError(message: string): Promise<CopyChiefIngestResult> {
  return {
    mode: "input_error",
    message,
    addedCards: [],
    pagesFetched: 0,
    sourceUrls: [],
    uploadedFileIds: [],
    vectorStoreId: (await resolveVectorStoreId()).id,
    status: await getCopyChiefKnowledgeStatus(),
    errors: [],
  };
}

async function fetchArchiveSources(input: IngestCopyChiefSourceInput): Promise<FetchedSource[]> {
  const startUrl = new URL(input.url);
  if (!["http:", "https:"].includes(startUrl.protocol)) {
    throw new Error("Only http and https archive URLs can be ingested.");
  }

  const queue = [startUrl.toString()];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const sources: FetchedSource[] = [];
  const maxPages = Math.max(1, Math.min(input.maxPages, 50));

  while (queue.length && sources.length < maxPages) {
    const nextUrl = queue.shift();
    if (!nextUrl || visited.has(nextUrl)) continue;
    visited.add(nextUrl);

    let html: string;
    try {
      html = await fetchPageHtml(nextUrl);
    } catch (error) {
      if (sources.length === 0 && nextUrl === startUrl.toString()) {
        const restSources = await fetchWordPressRestSources(startUrl, input.title, maxPages);
        if (restSources.length) return restSources;
      }
      if (sources.length === 0 && queue.length === 0) {
        throw error;
      }
      continue;
    }

    const title = extractTitle(html) || input.title;
    const text = htmlToText(html).slice(0, MAX_TEXT_PER_PAGE);

    if (text.length > 250) {
      sources.push({ title, url: nextUrl, text });
    }

    if (!input.crawlSameHost || sources.length >= maxPages) continue;

    for (const link of extractLinks(html, nextUrl)) {
      if (queued.has(link) || visited.has(link)) continue;
      const candidate = new URL(link);
      if (candidate.hostname !== startUrl.hostname) continue;
      if (isLikelyBinary(candidate.pathname)) continue;
      queued.add(link);
      queue.push(link);
    }
  }

  return sources;
}

async function fetchWordPressRestSources(startUrl: URL, sourceTitle: string, maxPages: number) {
  const searchTerm = archiveSearchTerm(startUrl, sourceTitle);
  const endpoints = [
    `${startUrl.origin}/wp-json/wp/v2/pages?per_page=100&search=${encodeURIComponent(searchTerm)}`,
    `${startUrl.origin}/wp-json/wp/v2/posts?per_page=100&search=${encodeURIComponent(searchTerm)}`,
    `${startUrl.origin}/wp-json/wp/v2/pages?per_page=100`,
    `${startUrl.origin}/wp-json/wp/v2/posts?per_page=100`,
  ];

  const collected: Array<FetchedSource & { score: number; dedupeKey: string }> = [];
  const seen = new Set<string>();

  for (const endpoint of endpoints) {
    let items: WordPressRestItem[];
    try {
      items = await fetchWordPressRestItems(endpoint);
    } catch {
      continue;
    }

    for (const item of items) {
      const html = item.content?.rendered || "";
      const text = htmlToText(html).slice(0, MAX_TEXT_PER_PAGE);
      if (text.length < 250) continue;

      const title = decodeHtmlEntities(stripTags(item.title?.rendered || item.slug || sourceTitle))
        .trim()
        .slice(0, 180);
      const url = item.link || `${startUrl.origin}/?p=${item.id || ""}`;
      const dedupeKey = normalizeDedupeKey(title, text);
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      collected.push({
        title,
        url,
        text,
        score: scoreWordPressItem(title, url, text, searchTerm),
        dedupeKey,
      });
    }

    if (collected.length >= maxPages) break;
  }

  return collected
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages)
    .map(({ title, url, text }) => ({ title, url, text }));
}

async function fetchWordPressRestItems(endpoint: string) {
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress REST fetch failed for ${endpoint}: ${response.status}`);
  }

  const body = (await response.json()) as unknown;
  return Array.isArray(body) ? (body as WordPressRestItem[]) : [];
}

function archiveSearchTerm(startUrl: URL, sourceTitle: string) {
  const pathParts = startUrl.pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const lastPathPart = pathParts.at(-1);
  const candidate = lastPathPart || sourceTitle.split(/\s+/).find((part) => part.length > 4) || "";
  return candidate.replace(/s$/i, "") || "newsletter";
}

function normalizeDedupeKey(title: string, text: string) {
  return `${title.replace(/\(dup\)/gi, "").toLowerCase()}::${hashText(text.slice(0, 1200))}`;
}

function scoreWordPressItem(title: string, url: string, text: string, searchTerm: string) {
  const haystack = `${title} ${url}`.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  let score = text.length;
  if (haystack.includes(normalizedSearch)) score += 20000;
  if (haystack.includes("newsletter")) score += 15000;
  if (/\(dup\)/i.test(title)) score -= 25000;
  if (/refund|thank-you|terms|privacy|transaction|subscribe/i.test(haystack)) score -= 30000;
  return score;
}

async function fetchPageHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed for ${url}: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new Error(`Unsupported content type for ${url}: ${contentType || "unknown"}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractTitle(html: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = h1 || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeHtmlEntities(stripTags(title)).trim().slice(0, 180) : "";
}

function extractLinks(html: string, baseUrl: string) {
  const links: string[] = [];
  const linkPattern = /<a\s+[^>]*href=(["'])(.*?)\1/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html))) {
    const href = match[2];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const url = new URL(href, baseUrl);
      url.hash = "";
      links.push(url.toString());
    } catch {
      // Ignore malformed links from source pages.
    }
  }

  return [...new Set(links)];
}

function isLikelyBinary(pathname: string) {
  return /\.(zip|mp3|mp4|mov|avi|jpg|jpeg|png|gif|webp|svg|pdf|docx?|xlsx?|pptx?)$/i.test(pathname);
}

function htmlToText(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&hellip;/gi, "...");
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildSourceMarkdown(input: IngestCopyChiefSourceInput, sources: FetchedSource[]) {
  const intro = [
    `# ${input.title}`,
    "",
    `Source type: ${input.sourceType}`,
    "Use: Now Off Duty Copy Chief internal research.",
    "Instruction: extract principles, patterns, proof logic, objections, and language. Do not reproduce long passages as final copy.",
  ];

  return [
    intro.join("\n"),
    ...sources.map((source, index) =>
      [
        "",
        "---",
        "",
        `## Source ${index + 1}: ${source.title}`,
        source.url ? `URL: ${source.url}` : "",
        "",
        source.text,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n");
}

function buildRuntimeCards(
  input: IngestCopyChiefSourceInput,
  sources: FetchedSource[],
  sourceHash: string,
  createdAt: string,
): RuntimeKnowledgeCard[] {
  return sources.flatMap((source, index) => {
    const baseId = `${slugify(input.title) || "source"}-${sourceHash.slice(0, 10)}-${index + 1}`;
    const tags = extractTags(`${input.title} ${source.title} ${source.text}`);
    const excerpt = firstUsefulExcerpt(source.text);
    const summary =
      input.sourceType === "url_archive" || input.sourceType === "swipe_file"
        ? summarizeSwipeStructure(source.text, tags)
        : summarize(source.text);
    const cards: RuntimeKnowledgeCard[] = [
      {
        id: `${baseId}-summary`,
        cardType: "Source Insight",
        title: source.title || input.title,
        detail: summary,
        sourceType: input.sourceType,
        sourceTitle: input.title,
        sourceUrl: source.url,
        tags,
        agentAction:
          "Use this as research context. Convert the underlying idea into original Now Off Duty copy.",
        createdAt,
      },
    ];

    if (input.sourceType === "url_archive" || input.sourceType === "swipe_file") {
      cards.push({
        id: `${baseId}-swipe-logic`,
        cardType: "Swipe Logic",
        title: `Lead and argument pattern from ${source.title || input.title}`,
        detail: excerpt
          ? `Opening signal: "${excerpt}". Study the curiosity, specificity, proof setup, objection turn, and next-action flow without copying the wording.`
          : "Study the curiosity, specificity, proof setup, objection turn, and next-action flow without copying the wording.",
        sourceType: input.sourceType,
        sourceTitle: input.title,
        sourceUrl: source.url,
        tags: [...new Set([...tags, "swipe", "lead", "proof"])],
        agentAction:
          "Adapt the structure only. Do not imitate a writer's identity, signature phrasing, or long passages.",
        createdAt,
      });
    }

    if (input.sourceType === "transcript" || input.sourceType === "research_note") {
      cards.push({
        id: `${baseId}-voice`,
        cardType: "Voice / Language",
        title: `Useful language from ${source.title || input.title}`,
        detail: excerpt
          ? `Short source phrase: "${excerpt}". Preserve the market insight, then rewrite into public-safe Now Off Duty language.`
          : "Preserve the market insight, then rewrite into public-safe Now Off Duty language.",
        sourceType: input.sourceType,
        sourceTitle: input.title,
        sourceUrl: source.url,
        tags: [...new Set([...tags, "voice", "market-language"])],
        agentAction:
          "Use for self-recognition and specificity. Remove sensitive personal assertions in public ad copy.",
        createdAt,
      });
    }

    return cards;
  });
}

function summarize(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 260);

  const selected = sentences.slice(0, 3).join(" ");
  return selected || text.slice(0, 420);
}

function summarizeSwipeStructure(text: string, tags: string[]) {
  const cues = [
    tags.includes("headline") ? "headline/opening" : null,
    tags.includes("offer") ? "offer framing" : null,
    tags.includes("proof") ? "proof setup" : null,
    tags.includes("objection") ? "objection handling" : null,
    tags.includes("structure") ? "argument sequence" : null,
  ].filter(Boolean);

  const textLength = text.length.toLocaleString("en-US");
  return `Source retained as research material (${textLength} characters). Extract the ${
    cues.join(", ") || "direct-response structure"
  } and adapt the underlying sales logic into original Now Off Duty copy.`;
}

function firstUsefulExcerpt(text: string) {
  const line =
    text
      .split(/\n+/)
      .map((item) => item.trim())
      .find((item) => item.length >= 28 && item.length <= 160) ||
    text
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .find((item) => item.length >= 28 && item.length <= 160);

  if (!line) return "";
  return line.split(/\s+/).slice(0, 24).join(" ");
}

function extractTags(text: string) {
  const normalized = text.toLowerCase();
  const tags = [
    ["headline", /headline|title|subject line|hook/],
    ["offer", /offer|order|buy|price|guarantee|bonus|deadline/],
    ["proof", /proof|case|testimonial|study|example|result/],
    ["objection", /objection|but |however|concern|fear|doubt|skeptic/],
    ["retirement-transition", /retire|retirement|off duty|next chapter/],
    ["spending", /spend|saving|savings|money|portfolio|financial/],
    ["identity", /identity|role|title|purpose|meaning|who am i/],
    ["structure", /structure|routine|rhythm|calendar|time/],
    ["direct-response", /advertis|copy|letter|sales|response|marketing/],
  ]
    .filter(([, pattern]) => (pattern as RegExp).test(normalized))
    .map(([tag]) => tag as string);

  return [...new Set(tags)].slice(0, 8);
}

function tokenize(text: string) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 3)
        .filter(
          (token) =>
            ![
              "with",
              "that",
              "this",
              "from",
              "they",
              "have",
              "what",
              "when",
              "your",
              "copy",
              "write",
            ].includes(token),
        ),
    ),
  ];
}

function scoreCard(card: RuntimeKnowledgeCard, tokens: string[]) {
  const haystack =
    `${card.cardType} ${card.title} ${card.detail} ${card.tags.join(" ")}`.toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

async function getOrCreateOpenAIVectorStore(apiKey: string) {
  const existing = await resolveVectorStoreId();
  if (existing.id) return existing.id;

  const response = await fetch("https://api.openai.com/v1/vector_stores", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: "Now Off Duty Copy Chief Knowledge",
      metadata: {
        app: "now-off-duty-copy-chief",
      },
    }),
  });

  const body = (await response.json()) as OpenAIVectorStoreResponse;
  if (!response.ok || !body.id) {
    throw new Error(body.error?.message || `Vector store create failed: ${response.status}`);
  }

  await writeVectorStoreCache({
    id: body.id,
    name: "Now Off Duty Copy Chief Knowledge",
    createdAt: new Date().toISOString(),
  });

  return body.id;
}

async function uploadOpenAIFile(apiKey: string, content: string, fileName: string) {
  const formData = new FormData();
  formData.append("purpose", "assistants");
  formData.append("file", new Blob([content], { type: "text/markdown" }), fileName);

  const response = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const body = (await response.json()) as OpenAIFileResponse;
  if (!response.ok || !body.id) {
    throw new Error(body.error?.message || `File upload failed: ${response.status}`);
  }

  return body.id;
}

async function attachFileToVectorStore(
  apiKey: string,
  vectorStoreId: string,
  fileId: string,
  attributes: Record<string, string>,
) {
  const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      file_id: fileId,
      attributes,
    }),
  });

  const body = (await response.json()) as OpenAIVectorStoreFileResponse;
  if (!response.ok || !body.id) {
    throw new Error(body.error?.message || `Vector store file attach failed: ${response.status}`);
  }
}
