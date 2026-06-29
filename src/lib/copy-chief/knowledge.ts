import { z } from "zod";

export const copyChiefKnowledgeSourceTypes = [
  "url_archive",
  "transcript",
  "research_note",
  "swipe_file",
] as const;

export type CopyChiefKnowledgeSourceType = (typeof copyChiefKnowledgeSourceTypes)[number];

export const copyChiefKnowledgeSourceLabels: Record<CopyChiefKnowledgeSourceType, string> = {
  url_archive: "URL Archive",
  transcript: "Transcript",
  research_note: "Research Note",
  swipe_file: "Swipe File",
};

export const ingestCopyChiefSourceInputSchema = z.object({
  sourceType: z.enum(copyChiefKnowledgeSourceTypes),
  title: z.string().min(2).max(180),
  url: z.string().max(2000).default(""),
  text: z.string().max(160000).default(""),
  crawlSameHost: z.boolean().default(true),
  maxPages: z.number().int().min(1).max(50).default(12),
  uploadToVectorStore: z.boolean().default(true),
  permissionConfirmed: z.boolean().default(false),
});

export const copyChiefKnowledgeStatusInputSchema = z.object({}).default({});

export type IngestCopyChiefSourceInput = z.infer<typeof ingestCopyChiefSourceInputSchema>;

export type RuntimeKnowledgeCard = {
  id: string;
  bank?: string;
  cardType: string;
  title: string;
  detail: string;
  sourceType: CopyChiefKnowledgeSourceType;
  sourceTitle: string;
  sourceUrl?: string;
  tags: string[];
  agentAction: string;
  createdAt: string;
};

export type CopyChiefKnowledgeStatus = {
  apiKeyConfigured: boolean;
  vectorStoreId: string | null;
  vectorStoreSource: "env" | "local" | "none";
  localCardCount: number;
  bankCount: number;
  bankCardCount: number;
  sourceCount: number;
  lastUpdatedAt: string | null;
  knowledgePath: string;
  generationMode: "model_and_file_search" | "model_with_local_cards" | "preview_only";
  missing: string[];
};

export type CopyChiefIngestResult = {
  mode:
    | "stored"
    | "stored_and_uploaded"
    | "already_present"
    | "permission_required"
    | "input_error"
    | "api_error";
  message: string;
  addedCards: RuntimeKnowledgeCard[];
  pagesFetched: number;
  sourceUrls: string[];
  uploadedFileIds: string[];
  vectorStoreId: string | null;
  status: CopyChiefKnowledgeStatus;
  errors: string[];
};

export type CopyChiefSyncResult = {
  mode: "synced" | "nothing_to_sync" | "setup_needed" | "api_error";
  message: string;
  syncedSources: number;
  uploadedFileIds: string[];
  vectorStoreId: string | null;
  status: CopyChiefKnowledgeStatus;
  errors: string[];
};
