import { createServerFn } from "@tanstack/react-start";

import { selectCopyChiefCards } from "../copy-chief/cards";
import {
  buildCopyChiefSystemPrompt,
  buildCopyChiefUserPrompt,
  buildPreviewOutput,
  copyChiefInputSchema,
  copyChiefOutputJsonSchema,
  type CopyChiefInput,
  type CopyChiefOutput,
} from "../copy-chief/prompt";
import {
  copyChiefKnowledgeStatusInputSchema,
  ingestCopyChiefSourceInputSchema,
  type CopyChiefIngestResult,
  type CopyChiefKnowledgeStatus,
  type CopyChiefSyncResult,
  type RuntimeKnowledgeCard,
} from "../copy-chief/knowledge";

type ResponsesRequestBody = {
  model: string;
  input: Array<{ role: "system" | "user"; content: string }>;
  text: {
    format: {
      type: "json_schema";
      name: string;
      strict: boolean;
      schema: typeof copyChiefOutputJsonSchema;
    };
  };
  tools?: Array<{ type: "file_search"; vector_store_ids: string[]; max_num_results: number }>;
  include?: string[];
};

export type CopyChiefServerResult =
  | {
      mode: "setup_needed";
      output: CopyChiefOutput;
      selectedCards: ReturnType<typeof selectCopyChiefCards>;
      selectedKnowledgeCards: RuntimeKnowledgeCard[];
      knowledgeStatus: CopyChiefKnowledgeStatus;
      requestPreview: ResponsesRequestBody;
      setupMessage: string;
    }
  | {
      mode: "generated";
      output: CopyChiefOutput;
      selectedCards: ReturnType<typeof selectCopyChiefCards>;
      selectedKnowledgeCards: RuntimeKnowledgeCard[];
      knowledgeStatus: CopyChiefKnowledgeStatus;
      retrievedResultsIncluded: boolean;
    }
  | {
      mode: "api_error";
      output: CopyChiefOutput;
      selectedCards: ReturnType<typeof selectCopyChiefCards>;
      selectedKnowledgeCards: RuntimeKnowledgeCard[];
      knowledgeStatus: CopyChiefKnowledgeStatus;
      error: string;
    };

function createResponsesBody(
  input: CopyChiefInput,
  vectorStoreId: string | null,
  selectedKnowledgeCards: RuntimeKnowledgeCard[],
): {
  body: ResponsesRequestBody;
  selectedCards: ReturnType<typeof selectCopyChiefCards>;
} {
  const selectedCards = selectCopyChiefCards(input.assetType);
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  const body: ResponsesRequestBody = {
    model,
    input: [
      { role: "system", content: buildCopyChiefSystemPrompt() },
      {
        role: "user",
        content: buildCopyChiefUserPrompt(input, selectedCards, selectedKnowledgeCards),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "now_off_duty_copy_chief_output",
        strict: true,
        schema: copyChiefOutputJsonSchema,
      },
    },
  };

  if (vectorStoreId) {
    body.tools = [
      {
        type: "file_search",
        vector_store_ids: [vectorStoreId],
        max_num_results: 15,
      },
    ];
    body.include = ["file_search_call.results"];
  }

  return { body, selectedCards };
}

function extractOutputText(responseBody: unknown) {
  if (responseBody && typeof responseBody === "object" && "output_text" in responseBody) {
    const outputText = (responseBody as { output_text?: unknown }).output_text;
    if (typeof outputText === "string") return outputText;
  }

  const output = (responseBody as { output?: unknown })?.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    const content = (item as { content?: unknown })?.content;
    if (!Array.isArray(content)) continue;

    for (const contentItem of content) {
      const text = (contentItem as { text?: unknown })?.text;
      if (typeof text === "string") return text;
    }
  }

  return null;
}

function parseOutput(text: string): CopyChiefOutput {
  return JSON.parse(text) as CopyChiefOutput;
}

export const generateCopyChiefAsset = createServerFn({ method: "POST" })
  .inputValidator(copyChiefInputSchema)
  .handler(async ({ data }): Promise<CopyChiefServerResult> => {
    const input = data as CopyChiefInput;
    const { getCopyChiefKnowledgeStatus, resolveVectorStoreId, selectRelevantKnowledgeCards } =
      await import("../copy-chief/knowledge.server");
    const selectedKnowledgeCards = await selectRelevantKnowledgeCards(
      `${input.assignment} ${input.assetType} ${input.audience} ${input.offer} ${input.channel}`,
    );
    const vectorStore = await resolveVectorStoreId();
    const knowledgeStatus = await getCopyChiefKnowledgeStatus();
    const { body, selectedCards } = createResponsesBody(
      input,
      vectorStore.id,
      selectedKnowledgeCards,
    );
    const fallback = buildPreviewOutput(input);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        mode: "setup_needed",
        output: fallback,
        selectedCards,
        selectedKnowledgeCards,
        knowledgeStatus,
        requestPreview: body,
        setupMessage:
          "Set OPENAI_API_KEY on the server to generate model-written copy. Local source cards can be ingested now; File Search will activate after an API key and vector store are available.",
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          mode: "api_error",
          output: fallback,
          selectedCards,
          selectedKnowledgeCards,
          knowledgeStatus,
          error: `OpenAI API returned ${response.status}: ${errorText}`,
        };
      }

      const responseBody = await response.json();
      const outputText = extractOutputText(responseBody);

      if (!outputText) {
        return {
          mode: "api_error",
          output: fallback,
          selectedCards,
          selectedKnowledgeCards,
          knowledgeStatus,
          error: "OpenAI API response did not include parseable output text.",
        };
      }

      return {
        mode: "generated",
        output: parseOutput(outputText),
        selectedCards,
        selectedKnowledgeCards,
        knowledgeStatus: await getCopyChiefKnowledgeStatus(),
        retrievedResultsIncluded: Boolean(body.include?.length),
      };
    } catch (error) {
      return {
        mode: "api_error",
        output: fallback,
        selectedCards,
        selectedKnowledgeCards,
        knowledgeStatus,
        error: error instanceof Error ? error.message : "Unknown Copy Chief generation error.",
      };
    }
  });

export const getCopyChiefSetupStatus = createServerFn({ method: "POST" })
  .inputValidator(copyChiefKnowledgeStatusInputSchema)
  .handler(async (): Promise<CopyChiefKnowledgeStatus> => {
    const { getCopyChiefKnowledgeStatus } = await import("../copy-chief/knowledge.server");
    return getCopyChiefKnowledgeStatus();
  });

export const ingestCopyChiefKnowledgeSource = createServerFn({ method: "POST" })
  .inputValidator(ingestCopyChiefSourceInputSchema)
  .handler(async ({ data }): Promise<CopyChiefIngestResult> => {
    const { ingestCopyChiefSource } = await import("../copy-chief/knowledge.server");
    return ingestCopyChiefSource(data);
  });

export const syncCopyChiefKnowledge = createServerFn({ method: "POST" })
  .inputValidator(copyChiefKnowledgeStatusInputSchema)
  .handler(async (): Promise<CopyChiefSyncResult> => {
    const { syncCopyChiefKnowledgeToFileSearch } = await import("../copy-chief/knowledge.server");
    return syncCopyChiefKnowledgeToFileSearch();
  });
