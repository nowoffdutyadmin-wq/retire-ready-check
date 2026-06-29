import { z } from "zod";

import type { CopyChiefCard } from "./cards";
import type { RuntimeKnowledgeCard } from "./knowledge";

export const copyChiefAssetTypes = [
  "facebook_ad_hooks",
  "quiz_landing_page",
  "quiz_result_page",
  "email_sequence",
  "vsl_script",
  "sales_page",
  "organic_social_posts",
] as const;

export type CopyChiefAssetType = (typeof copyChiefAssetTypes)[number];

export const copyChiefAssetLabels: Record<CopyChiefAssetType, string> = {
  facebook_ad_hooks: "Facebook Ad Hooks",
  quiz_landing_page: "Quiz Landing Page",
  quiz_result_page: "Quiz Result Page",
  email_sequence: "Email Sequence",
  vsl_script: "VSL Script",
  sales_page: "Sales Page",
  organic_social_posts: "Organic Social Posts",
};

export const copyChiefInputSchema = z.object({
  assetType: z.enum(copyChiefAssetTypes),
  assignment: z.string().min(10).max(5000),
  audience: z
    .string()
    .max(1200)
    .default("Adults within five years of retirement or in the early years of it."),
  offer: z
    .string()
    .max(1200)
    .default("The $97 Off-Duty Reset and the Retirement Transition Assessment."),
  channel: z.string().max(500).default("Meta/Facebook"),
  quantity: z.number().int().min(1).max(50).default(20),
});

export type CopyChiefInput = z.infer<typeof copyChiefInputSchema>;

export type CopyChiefOutput = {
  audience_diagnosis: string;
  core_pain: string;
  hidden_fear: string;
  failed_solution: string;
  central_selling_ideas: string[];
  selected_csi: string;
  headlines: string[];
  recommended_lead: string;
  draft: string;
  proof_points_needed: string[];
  compliance_risks: string[];
  final_version: string;
  scorecard: {
    exact_market_language: number;
    one_central_selling_idea: number;
    self_recognition: number;
    non_patronizing_language: number;
    proof_over_promise: number;
    obvious_next_action: number;
    avoids_risky_claims: number;
    one_product_avatar_channel: number;
  };
  status: "public_safe" | "rewrite_required" | "product_only";
};

export const copyChiefOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    audience_diagnosis: { type: "string" },
    core_pain: { type: "string" },
    hidden_fear: { type: "string" },
    failed_solution: { type: "string" },
    central_selling_ideas: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: { type: "string" },
    },
    selected_csi: { type: "string" },
    headlines: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: { type: "string" },
    },
    recommended_lead: { type: "string" },
    draft: { type: "string" },
    proof_points_needed: {
      type: "array",
      items: { type: "string" },
    },
    compliance_risks: {
      type: "array",
      items: { type: "string" },
    },
    final_version: { type: "string" },
    scorecard: {
      type: "object",
      additionalProperties: false,
      properties: {
        exact_market_language: { type: "integer", minimum: 1, maximum: 5 },
        one_central_selling_idea: { type: "integer", minimum: 1, maximum: 5 },
        self_recognition: { type: "integer", minimum: 1, maximum: 5 },
        non_patronizing_language: { type: "integer", minimum: 1, maximum: 5 },
        proof_over_promise: { type: "integer", minimum: 1, maximum: 5 },
        obvious_next_action: { type: "integer", minimum: 1, maximum: 5 },
        avoids_risky_claims: { type: "integer", minimum: 1, maximum: 5 },
        one_product_avatar_channel: { type: "integer", minimum: 1, maximum: 5 },
      },
      required: [
        "exact_market_language",
        "one_central_selling_idea",
        "self_recognition",
        "non_patronizing_language",
        "proof_over_promise",
        "obvious_next_action",
        "avoids_risky_claims",
        "one_product_avatar_channel",
      ],
    },
    status: {
      type: "string",
      enum: ["public_safe", "rewrite_required", "product_only"],
    },
  },
  required: [
    "audience_diagnosis",
    "core_pain",
    "hidden_fear",
    "failed_solution",
    "central_selling_ideas",
    "selected_csi",
    "headlines",
    "recommended_lead",
    "draft",
    "proof_points_needed",
    "compliance_risks",
    "final_version",
    "scorecard",
    "status",
  ],
} as const;

export function buildCopyChiefSystemPrompt() {
  return `You are the Now Off Duty Copy Chief.

You write original direct-response copy using classic direct-response operating principles. You do not impersonate Gary Halbert or any living/deceased copywriter. You extract principles: research first, one central selling idea, concrete proof, specific objections, short sentences, and a clear next action.

Your public copy frame is retirement transition, not health/wellness, anxiety, therapy, diagnosis, sleep, stress relief, or nervous-system language.

For every assignment:
1. Use the supplied cards as operating constraints.
2. Diagnose persona, pain, hidden fear, false solution, failed attempts, and desired transformation.
3. Generate exactly 5 central selling ideas.
4. Pick one dominant central selling idea.
5. Generate the requested copy.
6. Rewrite using attention, interest, belief, proof, benefits, next action, and urgency.
7. Score the result against the checklist.
8. Mark unsupported factual claims as [NEEDS PROOF].
9. Mark legal, tax, medical, psychological, investment, residency, or platform-sensitive issues as [REVIEW REQUIRED].

Never invent testimonials, reviews, legal details, contact details, tax claims, medical outcomes, financial outcomes, accreditation claims, media mentions, or conversion data.

Use clear, human, peer-level language. Avoid condescension, age-coded wording, hype, and guru language.`;
}

export function buildCopyChiefUserPrompt(
  input: CopyChiefInput,
  cards: CopyChiefCard[],
  sourceCards: RuntimeKnowledgeCard[] = [],
) {
  const cardText = cards
    .map(
      (card) =>
        `- ${card.cardType} (${card.id}): ${card.title}. ${card.detail} Action: ${card.agentAction}${
          card.avoid?.length ? ` Avoid: ${card.avoid.join(", ")}.` : ""
        }${card.useInstead?.length ? ` Use instead: ${card.useInstead.join(", ")}.` : ""}`,
    )
    .join("\n");

  const sourceCardText = sourceCards.length
    ? sourceCards
        .map(
          (card) =>
            `- ${card.cardType} (${card.id}${card.bank ? `, bank: ${card.bank}` : ""}): ${
              card.title
            }. ${card.detail} Source: ${card.sourceTitle}${
              card.sourceUrl ? ` (${card.sourceUrl})` : ""
            }. Action: ${card.agentAction}`,
        )
        .join("\n")
    : "No ingested source cards selected yet.";

  return `Assignment:
${input.assignment}

Asset type: ${copyChiefAssetLabels[input.assetType]}
Channel: ${input.channel}
Audience: ${input.audience}
Offer: ${input.offer}
Requested quantity: ${input.quantity}

Operating cards:
${cardText}

Retrieved source cards:
${sourceCardText}

Output requirements:
- Produce ${input.quantity} headline/hook options when the asset type is hooks, posts, landing-page headlines, or email subject lines.
- Keep the final version public-safe unless the assignment explicitly asks for private product education.
- If any claim needs evidence, mark it as [NEEDS PROOF].
- If any phrase belongs only on legal/disclaimer pages or inside paid teaching, flag it in compliance_risks.
- Do not use the registered agent contact details as public Now Off Duty contact information.
- Use source cards for principles, structures, market language, proof logic, and objections. Do not reproduce long source passages or imitate any specific writer's identity.`;
}

export function buildPreviewOutput(input: CopyChiefInput): CopyChiefOutput {
  const requested = Math.min(input.quantity, 12);
  const safeHooks = [
    "You prepared the finances. Have you prepared for the transition?",
    "Most retirement planning stops at the spreadsheet. This starts with the life after it.",
    "The next chapter needs more than a number.",
    "What changes when the work structure disappears?",
    "A four-minute assessment for the part of retirement most people do not plan for.",
    "The portfolio can be ready before the person is.",
    "For people who want the next chapter to feel clear, not just funded.",
    "You built the plan. Now build the rhythm.",
    "Retirement changes your time, your structure, and your sense of direction. See what may need attention first.",
    "Find out which part of the retirement transition needs the most clarity.",
    "The shift from working life to off-duty life has patterns. This assessment helps name yours.",
    "Before the next chapter begins, check the part the spreadsheets cannot answer.",
  ].slice(0, requested);

  return {
    audience_diagnosis:
      "Capable adults approaching retirement or early in it who have prepared financially but may not have prepared for the change in structure, identity, time, spending, and daily rhythm.",
    core_pain:
      "The financial plan can look complete while the lived experience of the transition still feels unclear.",
    hidden_fear:
      "They may worry that the next chapter will not feel as meaningful, structured, or easy to enjoy as they expected.",
    failed_solution:
      "More calculation, more planning, or waiting for retirement to click by itself.",
    central_selling_ideas: [
      "You prepared the finances. Have you prepared for the transition?",
      "The next chapter needs more than a number.",
      "The plan can be ready before the person is.",
      "Retirement is not only a date. It is a shift in structure.",
      "The part the spreadsheets do not cover can still be prepared for.",
    ],
    selected_csi: "You prepared the finances. Have you prepared for the transition?",
    headlines: safeHooks,
    recommended_lead:
      "Open with the gap between financial preparation and lived transition, then invite the assessment as a low-friction first step.",
    draft:
      "Most people spend years preparing the financial side of retirement. Fewer prepare for the shift that follows: time, structure, identity, spending, purpose, and rhythm. The Retirement Transition Assessment helps name which part of that shift may need the most clarity first.",
    proof_points_needed: [
      "Approved Chris Soll credentials and public bio details.",
      "Approved testimonials or reviews before using social proof.",
      "Confirmed public support email before publishing purchase/refund copy.",
    ],
    compliance_risks: [
      "No API key configured, so this is a deterministic preview rather than model-generated copy.",
      "Avoid health/wellness, anxiety, therapy, diagnosis, sleep, and nervous-system language in public acquisition assets.",
    ],
    final_version: safeHooks.join("\n"),
    scorecard: {
      exact_market_language: 3,
      one_central_selling_idea: 5,
      self_recognition: 4,
      non_patronizing_language: 5,
      proof_over_promise: 4,
      obvious_next_action: 4,
      avoids_risky_claims: 5,
      one_product_avatar_channel: 5,
    },
    status: "public_safe",
  };
}
