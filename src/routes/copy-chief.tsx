import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Database,
  FileText,
  Link,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  generateCopyChiefAsset,
  getCopyChiefSetupStatus,
  ingestCopyChiefKnowledgeSource,
  syncCopyChiefKnowledge,
  type CopyChiefIngestResult,
  type CopyChiefKnowledgeStatus,
  type CopyChiefServerResult,
  type CopyChiefSyncResult,
} from "../lib/api/copy-chief.functions";
import {
  copyChiefKnowledgeSourceLabels,
  copyChiefKnowledgeSourceTypes,
  type CopyChiefKnowledgeSourceType,
} from "../lib/copy-chief/knowledge";
import {
  copyChiefAssetLabels,
  copyChiefAssetTypes,
  type CopyChiefAssetType,
  type CopyChiefOutput,
} from "../lib/copy-chief/prompt";
import { colors, PageIntro, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/copy-chief")({
  head: () => ({
    meta: [
      { title: "Copy Chief — Now Off Duty" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "Internal Now Off Duty copy generation and compliance review console.",
      },
    ],
  }),
  component: CopyChiefRoute,
});

const defaultAssignment =
  'Write 20 Facebook ad hooks for the Retirement Transition Assessment using the core idea: "You prepared the finances. Have you prepared for the transition?"';

function CopyChiefRoute() {
  const [assetType, setAssetType] = useState<CopyChiefAssetType>("facebook_ad_hooks");
  const [assignment, setAssignment] = useState(defaultAssignment);
  const [audience, setAudience] = useState(
    "Adults within five years of retirement or in the early years of it who have generally handled the financial plan.",
  );
  const [offer, setOffer] = useState(
    "The Retirement Transition Assessment leading to the $97 Off-Duty Reset.",
  );
  const [channel, setChannel] = useState("Meta/Facebook");
  const [quantity, setQuantity] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CopyChiefServerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeStatus, setKnowledgeStatus] = useState<CopyChiefKnowledgeStatus | null>(null);
  const [sourceType, setSourceType] = useState<CopyChiefKnowledgeSourceType>("url_archive");
  const [sourceTitle, setSourceTitle] = useState("Gary Halbert letter archive");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [crawlSameHost, setCrawlSameHost] = useState(true);
  const [maxPages, setMaxPages] = useState(12);
  const [uploadToVectorStore, setUploadToVectorStore] = useState(true);
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState(false);
  const [ingestResult, setIngestResult] = useState<CopyChiefIngestResult | null>(null);
  const [syncResult, setSyncResult] = useState<CopyChiefSyncResult | null>(null);

  const selectedLabel = copyChiefAssetLabels[assetType];

  const outputText = useMemo(() => {
    if (!result) return "";
    return result.output.final_version || result.output.headlines.join("\n");
  }, [result]);

  useEffect(() => {
    void refreshKnowledgeStatus();
  }, []);

  async function refreshKnowledgeStatus() {
    setIsRefreshingStatus(true);

    try {
      const status = await getCopyChiefSetupStatus({ data: {} });
      setKnowledgeStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read Copy Chief setup.");
    } finally {
      setIsRefreshingStatus(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const next = await generateCopyChiefAsset({
        data: {
          assetType,
          assignment,
          audience,
          offer,
          channel,
          quantity,
        },
      });
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy Chief failed to run.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleIngest() {
    setIsIngesting(true);
    setError(null);
    setIngestResult(null);

    try {
      const next = await ingestCopyChiefKnowledgeSource({
        data: {
          sourceType,
          title: sourceTitle,
          url: sourceUrl,
          text: sourceText,
          crawlSameHost,
          maxPages,
          uploadToVectorStore,
          permissionConfirmed,
        },
      });
      setIngestResult(next);
      setKnowledgeStatus(next.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Source ingestion failed.");
    } finally {
      setIsIngesting(false);
    }
  }

  async function handleSyncKnowledge() {
    setIsSyncingKnowledge(true);
    setError(null);

    try {
      const next = await syncCopyChiefKnowledge({ data: {} });
      setSyncResult(next);
      setKnowledgeStatus(next.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File Search sync failed.");
    } finally {
      setIsSyncingKnowledge(false);
    }
  }

  async function handleTranscriptFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setSourceType("transcript");
    setSourceTitle(file.name.replace(/\.[^.]+$/, ""));
    setSourceText(await file.text());
  }

  async function copyFinalVersion() {
    if (!outputText || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(outputText);
  }

  return (
    <SiteShell>
      <PageIntro eyebrow="COPY CHIEF" title="Now Off Duty copy console.">
        <p>
          Generate public-safe direct-response assets using the Now Off Duty rule bank, offer
          ladder, and transition-language guardrails.
        </p>
      </PageIntro>

      <Section>
        <KnowledgeStatusPanel
          status={knowledgeStatus}
          isRefreshing={isRefreshingStatus}
          isSyncing={isSyncingKnowledge}
          syncResult={syncResult}
          onRefresh={() => void refreshKnowledgeStatus()}
          onSync={() => void handleSyncKnowledge()}
        />
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-6">
            <KnowledgeIntakePanel
              sourceType={sourceType}
              setSourceType={setSourceType}
              sourceTitle={sourceTitle}
              setSourceTitle={setSourceTitle}
              sourceUrl={sourceUrl}
              setSourceUrl={setSourceUrl}
              sourceText={sourceText}
              setSourceText={setSourceText}
              crawlSameHost={crawlSameHost}
              setCrawlSameHost={setCrawlSameHost}
              maxPages={maxPages}
              setMaxPages={setMaxPages}
              uploadToVectorStore={uploadToVectorStore}
              setUploadToVectorStore={setUploadToVectorStore}
              permissionConfirmed={permissionConfirmed}
              setPermissionConfirmed={setPermissionConfirmed}
              isIngesting={isIngesting}
              ingestResult={ingestResult}
              onIngest={() => void handleIngest()}
              onFile={handleTranscriptFile}
            />

            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleGenerate();
              }}
            >
              <Field label="Asset Type">
                <div className="grid grid-cols-2 gap-2">
                  {copyChiefAssetTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAssetType(type)}
                      className="min-h-[48px] rounded-[8px] border px-3 text-left text-[15px] font-semibold"
                      style={{
                        backgroundColor: assetType === type ? colors.sageSoft : colors.paper,
                        borderColor: assetType === type ? colors.sageDeep : colors.rule,
                        color: colors.ink,
                      }}
                    >
                      {copyChiefAssetLabels[type]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Assignment">
                <textarea
                  value={assignment}
                  onChange={(event) => setAssignment(event.target.value)}
                  rows={6}
                  className="w-full rounded-[8px] border p-4 text-[16px] leading-[1.55]"
                  style={{
                    backgroundColor: colors.paper,
                    borderColor: colors.rule,
                    color: colors.ink,
                  }}
                />
              </Field>

              <Field label="Audience">
                <textarea
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  rows={3}
                  className="w-full rounded-[8px] border p-4 text-[16px] leading-[1.55]"
                  style={{
                    backgroundColor: colors.paper,
                    borderColor: colors.rule,
                    color: colors.ink,
                  }}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <Field label="Channel">
                  <input
                    value={channel}
                    onChange={(event) => setChannel(event.target.value)}
                    className="h-[48px] w-full rounded-[8px] border px-4 text-[16px]"
                    style={{
                      backgroundColor: colors.paper,
                      borderColor: colors.rule,
                      color: colors.ink,
                    }}
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="h-[48px] w-full rounded-[8px] border px-4 text-[16px]"
                    style={{
                      backgroundColor: colors.paper,
                      borderColor: colors.rule,
                      color: colors.ink,
                    }}
                  />
                </Field>
              </div>

              <Field label="Offer">
                <textarea
                  value={offer}
                  onChange={(event) => setOffer(event.target.value)}
                  rows={3}
                  className="w-full rounded-[8px] border p-4 text-[16px] leading-[1.55]"
                  style={{
                    backgroundColor: colors.paper,
                    borderColor: colors.rule,
                    color: colors.ink,
                  }}
                />
              </Field>

              <button
                type="submit"
                disabled={isGenerating || assignment.trim().length < 10}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[8px] px-6 text-[18px] font-semibold"
                style={{
                  backgroundColor: isGenerating ? colors.rule : colors.cta,
                  color: colors.paper,
                  cursor: isGenerating ? "wait" : "pointer",
                }}
              >
                {isGenerating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {isGenerating ? "Generating" : `Generate ${selectedLabel}`}
              </button>

              {error && (
                <div
                  className="rounded-[8px] border p-4 text-[16px]"
                  style={{ borderColor: colors.cta, color: colors.ink }}
                >
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="grid gap-5">
            {result ? (
              <CopyChiefResult result={result} onCopy={copyFinalVersion} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span
        className="text-[15px] font-semibold tracking-[0.08em]"
        style={{ color: colors.sageDeep }}
      >
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

function KnowledgeStatusPanel({
  status,
  isRefreshing,
  isSyncing,
  syncResult,
  onRefresh,
  onSync,
}: {
  status: CopyChiefKnowledgeStatus | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  syncResult: CopyChiefSyncResult | null;
  onRefresh: () => void;
  onSync: () => void;
}) {
  const modeLabel =
    status?.generationMode === "model_and_file_search"
      ? "Model + File Search"
      : status?.generationMode === "model_with_local_cards"
        ? "Model + Local Cards"
        : "Preview Only";
  const vectorStoreLabel = status?.vectorStoreId
    ? "Connected"
    : status?.apiKeyConfigured
      ? "Will Auto-Create"
      : "Pending API Key";

  return (
    <section
      className="rounded-[8px] border p-5"
      style={{ backgroundColor: colors.paper, borderColor: colors.rule }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database size={24} color={colors.sageDeep} />
          <div>
            <h2 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              Knowledge bank
            </h2>
            <p className="text-[16px]" style={{ color: colors.inkSoft }}>
              {status
                ? `${status.sourceCount} sources, ${status.localCardCount} source cards, ${status.bankCardCount} bank cards`
                : "Checking setup"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border px-4 text-[15px] font-semibold"
          style={{ borderColor: colors.sageDeep, color: colors.sageDeep }}
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <SetupMetric
          label="API Key"
          value={status?.apiKeyConfigured ? "Ready" : "Missing"}
          warning={!status?.apiKeyConfigured}
        />
        <SetupMetric
          label="Mode"
          value={modeLabel}
          warning={status?.generationMode === "preview_only"}
        />
        <SetupMetric
          label="Vector Store"
          value={vectorStoreLabel}
          warning={!status?.apiKeyConfigured}
        />
        <SetupMetric label="Last Update" value={status?.lastUpdatedAt?.slice(0, 10) || "None"} />
      </div>

      {status?.missing.length ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-[8px] border p-3 text-[15px]"
          style={{ borderColor: colors.cta, color: colors.inkSoft }}
        >
          <AlertTriangle size={18} color={colors.cta} />
          <p>
            Missing: {status.missing.join(", ")}. Start the server with `OPENAI_API_KEY` to unlock
            live generation. File Search can auto-create a vector store once the key is available.
          </p>
        </div>
      ) : null}

      {status?.apiKeyConfigured && status.sourceCount > 0 && !status.vectorStoreId ? (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-[8px] px-4 text-[15px] font-semibold"
          style={{
            backgroundColor: isSyncing ? colors.rule : colors.sageDeep,
            color: colors.paper,
            cursor: isSyncing ? "wait" : "pointer",
          }}
        >
          {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {isSyncing ? "Syncing" : "Sync Local Sources To File Search"}
        </button>
      ) : null}

      {syncResult ? <SyncResultPanel result={syncResult} /> : null}
    </section>
  );
}

function SyncResultPanel({ result }: { result: CopyChiefSyncResult }) {
  const ok = result.mode === "synced" || result.mode === "nothing_to_sync";

  return (
    <div
      className="mt-4 rounded-[8px] border p-4 text-[15px]"
      style={{
        backgroundColor: ok ? colors.sageSoft : "#fff7ed",
        borderColor: ok ? colors.sage : colors.cta,
        color: colors.ink,
      }}
    >
      <div className="flex items-center gap-2 font-semibold">
        {ok ? (
          <CheckCircle2 size={18} color={colors.sageDeep} />
        ) : (
          <AlertTriangle size={18} color={colors.cta} />
        )}
        {result.mode.replaceAll("_", " ")}
      </div>
      <p className="mt-2 leading-[1.55]">{result.message}</p>
      <p className="mt-2" style={{ color: colors.inkSoft }}>
        {result.syncedSources} sources synced, {result.uploadedFileIds.length} files uploaded.
      </p>
      {result.errors.length ? (
        <ul className="mt-2 grid gap-1" style={{ color: colors.inkSoft }}>
          {result.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SetupMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className="rounded-[8px] border p-3"
      style={{ backgroundColor: warning ? "#fff7ed" : colors.bg, borderColor: colors.rule }}
    >
      <div
        className="text-[13px] font-semibold tracking-[0.08em]"
        style={{ color: colors.sageDeep }}
      >
        {label.toUpperCase()}
      </div>
      <div className="mt-1 text-[16px] font-semibold" style={{ color: colors.ink }}>
        {value}
      </div>
    </div>
  );
}

function KnowledgeIntakePanel({
  sourceType,
  setSourceType,
  sourceTitle,
  setSourceTitle,
  sourceUrl,
  setSourceUrl,
  sourceText,
  setSourceText,
  crawlSameHost,
  setCrawlSameHost,
  maxPages,
  setMaxPages,
  uploadToVectorStore,
  setUploadToVectorStore,
  permissionConfirmed,
  setPermissionConfirmed,
  isIngesting,
  ingestResult,
  onIngest,
  onFile,
}: {
  sourceType: CopyChiefKnowledgeSourceType;
  setSourceType: React.Dispatch<React.SetStateAction<CopyChiefKnowledgeSourceType>>;
  sourceTitle: string;
  setSourceTitle: React.Dispatch<React.SetStateAction<string>>;
  sourceUrl: string;
  setSourceUrl: React.Dispatch<React.SetStateAction<string>>;
  sourceText: string;
  setSourceText: React.Dispatch<React.SetStateAction<string>>;
  crawlSameHost: boolean;
  setCrawlSameHost: React.Dispatch<React.SetStateAction<boolean>>;
  maxPages: number;
  setMaxPages: React.Dispatch<React.SetStateAction<number>>;
  uploadToVectorStore: boolean;
  setUploadToVectorStore: React.Dispatch<React.SetStateAction<boolean>>;
  permissionConfirmed: boolean;
  setPermissionConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  isIngesting: boolean;
  ingestResult: CopyChiefIngestResult | null;
  onIngest: () => void;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}) {
  const hasSource =
    sourceType === "url_archive" ? sourceUrl.trim().length > 8 : sourceText.trim().length > 40;

  return (
    <section
      className="rounded-[8px] border p-5"
      style={{ backgroundColor: colors.paper, borderColor: colors.rule }}
    >
      <div className="flex items-center gap-3">
        <UploadCloud size={22} color={colors.sageDeep} />
        <h2 className="font-serif text-[30px]" style={{ color: colors.ink }}>
          Knowledge intake
        </h2>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Source Type">
          <div className="grid grid-cols-2 gap-2">
            {copyChiefKnowledgeSourceTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSourceType(type)}
                className="min-h-[44px] rounded-[8px] border px-3 text-left text-[15px] font-semibold"
                style={{
                  backgroundColor: sourceType === type ? colors.sageSoft : colors.paper,
                  borderColor: sourceType === type ? colors.sageDeep : colors.rule,
                  color: colors.ink,
                }}
              >
                {copyChiefKnowledgeSourceLabels[type]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Source Title">
          <input
            value={sourceTitle}
            onChange={(event) => setSourceTitle(event.target.value)}
            className="h-[48px] w-full rounded-[8px] border px-4 text-[16px]"
            style={{ backgroundColor: colors.paper, borderColor: colors.rule, color: colors.ink }}
          />
        </Field>

        {sourceType === "url_archive" ? (
          <>
            <Field label="Archive URL">
              <div className="relative">
                <Link
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  color={colors.sageDeep}
                />
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://example.com/archive"
                  className="h-[48px] w-full rounded-[8px] border py-0 pl-11 pr-4 text-[16px]"
                  style={{
                    backgroundColor: colors.paper,
                    borderColor: colors.rule,
                    color: colors.ink,
                  }}
                />
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-[1fr_130px]">
              <CheckboxRow
                label="Crawl same host links"
                checked={crawlSameHost}
                onChange={setCrawlSameHost}
              />
              <Field label="Max Pages">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxPages}
                  onChange={(event) => setMaxPages(Number(event.target.value))}
                  className="h-[44px] w-full rounded-[8px] border px-3 text-[16px]"
                  style={{
                    backgroundColor: colors.paper,
                    borderColor: colors.rule,
                    color: colors.ink,
                  }}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <Field label="Upload Transcript">
              <input
                type="file"
                accept=".txt,.md,.vtt,.srt,.csv"
                onChange={(event) => void onFile(event)}
                className="w-full rounded-[8px] border p-3 text-[15px]"
                style={{
                  backgroundColor: colors.paper,
                  borderColor: colors.rule,
                  color: colors.ink,
                }}
              />
            </Field>

            <Field label="Source Text">
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                rows={8}
                className="w-full rounded-[8px] border p-4 text-[16px] leading-[1.55]"
                style={{
                  backgroundColor: colors.paper,
                  borderColor: colors.rule,
                  color: colors.ink,
                }}
              />
            </Field>
          </>
        )}

        <CheckboxRow
          label="Upload to File Search when API key is available"
          checked={uploadToVectorStore}
          onChange={setUploadToVectorStore}
        />
        <CheckboxRow
          label="I have permission to store and use this source"
          checked={permissionConfirmed}
          onChange={setPermissionConfirmed}
        />

        <button
          type="button"
          disabled={
            isIngesting || !hasSource || !permissionConfirmed || sourceTitle.trim().length < 2
          }
          onClick={onIngest}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[8px] px-5 text-[17px] font-semibold"
          style={{
            backgroundColor:
              isIngesting || !hasSource || !permissionConfirmed ? colors.rule : colors.sageDeep,
            color: colors.paper,
            cursor: isIngesting ? "wait" : "pointer",
          }}
        >
          {isIngesting ? <Loader2 size={19} className="animate-spin" /> : <Database size={19} />}
          {isIngesting ? "Ingesting" : "Add to Knowledge Bank"}
        </button>

        {ingestResult ? <IngestResultPanel result={ingestResult} /> : null}
      </div>
    </section>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <label
      className="flex min-h-[44px] items-center gap-3 text-[16px]"
      style={{ color: colors.ink }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
      {label}
    </label>
  );
}

function IngestResultPanel({ result }: { result: CopyChiefIngestResult }) {
  const ok = ["stored", "stored_and_uploaded", "already_present"].includes(result.mode);

  return (
    <div
      className="rounded-[8px] border p-4 text-[15px]"
      style={{
        backgroundColor: ok ? colors.sageSoft : "#fff7ed",
        borderColor: ok ? colors.sage : colors.cta,
        color: colors.ink,
      }}
    >
      <div className="flex items-center gap-2 font-semibold">
        {ok ? (
          <CheckCircle2 size={18} color={colors.sageDeep} />
        ) : (
          <AlertTriangle size={18} color={colors.cta} />
        )}
        {result.mode.replaceAll("_", " ")}
      </div>
      <p className="mt-2 leading-[1.55]">{result.message}</p>
      <p className="mt-2" style={{ color: colors.inkSoft }}>
        {result.pagesFetched} pages, {result.addedCards.length} cards,{" "}
        {result.uploadedFileIds.length} uploaded files.
      </p>
      {result.errors.length ? (
        <ul className="mt-2 grid gap-1" style={{ color: colors.inkSoft }}>
          {result.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[8px] border p-6"
      style={{ backgroundColor: colors.paper, borderColor: colors.rule }}
    >
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} color={colors.sageDeep} />
        <h2 className="font-serif text-[32px]" style={{ color: colors.ink }}>
          Rule bank ready.
        </h2>
      </div>
      <p className="mt-4 text-[17px] leading-[1.65]" style={{ color: colors.inkSoft }}>
        The first run will select relevant cards, build the Copy Chief request, and return either
        generated copy or the setup-ready preview if the OpenAI key is not configured.
      </p>
    </div>
  );
}

function CopyChiefResult({
  result,
  onCopy,
}: {
  result: CopyChiefServerResult;
  onCopy: () => void;
}) {
  const output = result.output;

  return (
    <>
      <StatusPanel result={result} />
      {result.selectedKnowledgeCards.length ? (
        <OutputSection title="Source Cards" icon={<Database size={20} />}>
          <ul className="grid gap-2">
            {result.selectedKnowledgeCards.map((card) => (
              <li key={card.id}>
                <strong>{card.cardType}:</strong> {card.title}
              </li>
            ))}
          </ul>
        </OutputSection>
      ) : null}
      <OutputSection title="Diagnosis" icon={<FileText size={20} />}>
        <p>{output.audience_diagnosis}</p>
        <p>
          <strong>Core pain:</strong> {output.core_pain}
        </p>
        <p>
          <strong>Hidden fear:</strong> {output.hidden_fear}
        </p>
        <p>
          <strong>Failed solution:</strong> {output.failed_solution}
        </p>
      </OutputSection>

      <OutputSection title="Central Selling Ideas" icon={<Sparkles size={20} />}>
        <ol className="grid gap-2">
          {output.central_selling_ideas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ol>
        <p>
          <strong>Selected:</strong> {output.selected_csi}
        </p>
      </OutputSection>

      <OutputSection title="Headlines / Hooks" icon={<FileText size={20} />}>
        <ol className="grid gap-2">
          {output.headlines.map((headline) => (
            <li key={headline}>{headline}</li>
          ))}
        </ol>
      </OutputSection>

      <OutputSection
        title="Final Version"
        icon={<CheckCircle2 size={20} />}
        action={
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[15px] font-semibold"
            style={{ borderColor: colors.sageDeep, color: colors.sageDeep }}
          >
            <Clipboard size={16} />
            Copy
          </button>
        }
      >
        <pre
          className="whitespace-pre-wrap text-[16px] leading-[1.65]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {output.final_version}
        </pre>
      </OutputSection>

      <OutputSection title="Proof / Compliance" icon={<ShieldCheck size={20} />}>
        <List title="Proof needed" items={output.proof_points_needed} />
        <List title="Risks" items={output.compliance_risks} />
      </OutputSection>

      <Scorecard output={output} />
    </>
  );
}

function StatusPanel({ result }: { result: CopyChiefServerResult }) {
  const statusText =
    result.mode === "generated"
      ? "Generated"
      : result.mode === "setup_needed"
        ? "Setup Needed"
        : "API Error";

  return (
    <div
      className="rounded-[8px] border p-5"
      style={{ backgroundColor: colors.sageSoft, borderColor: colors.sage }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div
            className="text-[15px] font-semibold tracking-[0.12em]"
            style={{ color: colors.sageDeep }}
          >
            {statusText.toUpperCase()}
          </div>
          <div className="mt-1 text-[17px]" style={{ color: colors.ink }}>
            {result.selectedCards.length} operating cards and {result.selectedKnowledgeCards.length}{" "}
            source cards applied.
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[15px] font-semibold"
          style={{ backgroundColor: colors.paper }}
        >
          {result.output.status}
        </div>
      </div>
      {result.mode === "setup_needed" && (
        <p className="mt-4 text-[16px] leading-[1.6]" style={{ color: colors.inkSoft }}>
          {result.setupMessage}
        </p>
      )}
      {result.mode === "api_error" && (
        <p className="mt-4 text-[16px] leading-[1.6]" style={{ color: colors.inkSoft }}>
          {result.error}
        </p>
      )}
    </div>
  );
}

function OutputSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[8px] border p-5"
      style={{ backgroundColor: colors.paper, borderColor: colors.rule }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          className="flex items-center gap-2 font-serif text-[30px]"
          style={{ color: colors.ink }}
        >
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4 grid gap-3 text-[17px] leading-[1.65]" style={{ color: colors.inkSoft }}>
        {children}
      </div>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold" style={{ color: colors.ink }}>
        {title}
      </h3>
      <ul className="mt-2 grid gap-2">
        {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>None flagged.</li>}
      </ul>
    </div>
  );
}

function Scorecard({ output }: { output: CopyChiefOutput }) {
  const entries = Object.entries(output.scorecard);

  return (
    <section
      className="rounded-[8px] border p-5"
      style={{ backgroundColor: colors.paper, borderColor: colors.rule }}
    >
      <h2 className="font-serif text-[30px]" style={{ color: colors.ink }}>
        Scorecard
      </h2>
      <div className="mt-4 grid gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="grid gap-2 sm:grid-cols-[220px_1fr_40px] sm:items-center">
            <div className="text-[15px] font-semibold" style={{ color: colors.inkSoft }}>
              {key.replaceAll("_", " ")}
            </div>
            <div className="h-[8px] rounded-full" style={{ backgroundColor: colors.bgDeep }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(value / 5) * 100}%`, backgroundColor: colors.sageDeep }}
              />
            </div>
            <div className="text-[16px] font-semibold" style={{ color: colors.ink }}>
              {value}/5
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
