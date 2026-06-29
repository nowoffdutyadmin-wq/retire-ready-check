export type CopyChiefCard = {
  cardType: string;
  id: string;
  title: string;
  detail: string;
  severity?: "blocker" | "high" | "medium" | "low";
  appliesTo: string[];
  avoid?: string[];
  useInstead?: string[];
  agentAction: string;
};

export const copyChiefCards: CopyChiefCard[] = [
  {
    cardType: "Brand Fact",
    id: "brand-identity-001",
    title: "Confirmed brand",
    detail: "Use Now Off Duty as the public brand and nowoffduty.com as the domain.",
    appliesTo: ["all"],
    agentAction:
      "Use Now Off Duty in new assets. Do not use Free Retiree or The Retirement Reality Check except when discussing historical context.",
  },
  {
    cardType: "Brand Fact",
    id: "legal-entity-002",
    title: "Confirmed legal entity",
    detail:
      "The legal entity is Now Off Duty LLC. Registered-agent phone and email are not public customer contact details.",
    appliesTo: ["website", "terms", "privacy", "checkout", "email_footer"],
    agentAction:
      "Use Now Off Duty LLC where a legal business name is required. Mark public email/phone as [NEEDS INPUT] until supplied.",
  },
  {
    cardType: "Brand Fact",
    id: "chris-public-bio-003",
    title: "Chris Soll public-safe bio",
    detail:
      "Chris Soll is a business strategist, entrepreneur, and co-founder of Mindspo with 15 years of online business experience. His background in corporate project management and building education-driven businesses shapes Now Off Duty's practical approach to the retirement transition.",
    appliesTo: ["about_page", "ads", "landing_page", "email", "media_kit"],
    agentAction:
      "Use this public-safe version by default. Do not foreground health/wellness language from the longer Mindspo bio in acquisition copy.",
  },
  {
    cardType: "Compliance Rule",
    id: "public-health-classifier-004",
    title: "Avoid public health/wellness positioning",
    detail:
      "Public acquisition assets must avoid health, wellness, clinical, therapy, anxiety, sleep, and nervous-system positioning.",
    severity: "blocker",
    appliesTo: ["ads", "homepage", "quiz", "results", "product_page", "pre_purchase_email"],
    avoid: [
      "anxiety",
      "stress relief",
      "nervous system",
      "sleep disruption",
      "mental health",
      "therapy",
      "trauma",
      "healing",
      "clinical",
      "diagnosis",
    ],
    useInstead: [
      "retirement transition",
      "finding your footing",
      "spending hesitation",
      "daily rhythm",
      "presence",
      "next chapter",
      "the part the spreadsheets do not cover",
    ],
    agentAction:
      "Reject or rewrite public copy containing avoided language unless the user explicitly marks the asset as private product education.",
  },
  {
    cardType: "Compliance Rule",
    id: "no-sensitive-second-person-005",
    title: "No sensitive second-person assertions in ads",
    detail:
      "Ads must not imply knowledge of the viewer's health, finances, identity, or emotional state.",
    severity: "blocker",
    appliesTo: ["facebook_ads", "instagram_ads", "ad_headline", "ad_primary_text"],
    avoid: [
      "Are you anxious about retirement?",
      "Are you afraid to spend your savings?",
      "Are you losing your identity?",
      "Are you struggling to sleep?",
    ],
    useInstead: [
      "Most people prepare the finances. Almost nobody prepares for the transition itself.",
      "You prepared the finances. Have you prepared for the transition?",
      "What kind of retirement transition are you walking into?",
    ],
    agentAction:
      "Rewrite direct personal-attribute claims into general-market or self-selected assessment framing.",
  },
  {
    cardType: "Compliance Rule",
    id: "no-professional-advice-claims-006",
    title: "No regulated advice or guarantees",
    detail:
      "Do not provide or imply financial, investment, tax, legal, medical, psychological, residency, insurance, or estate-planning advice or guaranteed outcomes.",
    severity: "blocker",
    appliesTo: ["all"],
    avoid: [
      "guaranteed tax savings",
      "guaranteed residency",
      "you will never run out of money",
      "investment recommendation",
      "legal strategy",
      "retirement income advice",
    ],
    useInstead: [
      "educational only",
      "coordinate with qualified professionals",
      "non-financial side of the transition",
      "questions to discuss with your advisor",
    ],
    agentAction:
      "Mark legal, tax, medical, psychological, investment, insurance, residency, or estate-planning claims as [REVIEW REQUIRED].",
  },
  {
    cardType: "Language Rule",
    id: "transition-frame-007",
    title: "Primary public frame",
    detail:
      "Use retirement transition as the primary public frame, not wellness, anxiety, therapy, or nervous-system readiness.",
    appliesTo: ["all_public_assets"],
    useInstead: [
      "Most people prepare the finances. Almost nobody prepares for the transition itself.",
      "A practical assessment for the part of retirement the spreadsheets do not cover.",
      "Prepare for the shift in structure, identity, time, and daily rhythm.",
    ],
    agentAction:
      "Default to transition, readiness, rhythm, presence, identity, and structure language in public copy.",
  },
  {
    cardType: "Language Rule",
    id: "tone-peer-level-008",
    title: "Peer-level tone",
    detail:
      "Write as a peer speaking to capable adults, not as a guru, clinician, financial advisor, or motivational speaker.",
    appliesTo: ["all"],
    avoid: ["old people", "elderly", "seniors", "golden years", "silver tsunami", "frail"],
    useInstead: [
      "people approaching retirement",
      "people in the early years of retirement",
      "capable people",
      "experienced professionals",
      "adults preparing for the transition",
    ],
    agentAction:
      "Revise language that sounds condescending, mystical, clinical, hype-driven, or age-coded.",
  },
  {
    cardType: "Language Rule",
    id: "voc-adaptation-009",
    title: "Adapt VOC safely",
    detail:
      "Use the emotional truth of VOC while removing sensitive personal assertions in public copy.",
    appliesTo: ["ads", "landing_page", "quiz_results", "email"],
    useInstead: [
      "Spending can still feel strangely hard after years of careful saving.",
      "The habit of protecting what you built can be hard to switch off.",
      "The title gets quieter. The question of who you are gets louder.",
      "Free time can feel unfamiliar when your life has run on structure for decades.",
    ],
    agentAction:
      "Preserve self-recognition, but rewrite raw VOC into public-safe transition language.",
  },
  {
    cardType: "Offer Rule",
    id: "launch-ladder-010",
    title: "Launch offer ladder",
    detail:
      "Current launch ladder: $97 Off-Duty Reset, $497-$597 Transition Program, ~$997 couples option, $49/month graduate community after cohort.",
    appliesTo: ["strategy", "sales_copy", "email", "quiz_results", "product_page", "ads"],
    agentAction:
      "Do not sell a cold $1,500 offer unless the user explicitly updates proof, pricing, and launch strategy.",
  },
  {
    cardType: "Offer Rule",
    id: "one-funnel-first-011",
    title: "One funnel first",
    detail:
      "Build around quiz ad -> assessment -> result page -> video/product page -> $97 Off-Duty Reset or qualified call -> cohort/community follow-up.",
    appliesTo: ["growth_loop", "asset_prioritization", "copy_generation"],
    agentAction:
      "Keep assets tied to one product, one avatar, one channel unless the user explicitly changes strategy.",
  },
  {
    cardType: "Launch Gate",
    id: "launch-gate-012",
    title: "Paid traffic gate",
    detail:
      "No paid traffic until public site, quiz, result pages, product page, checkout, and pre-purchase emails pass public-language audit and trust checks.",
    severity: "high",
    appliesTo: ["ads", "launch"],
    agentAction:
      "Flag missing contact details, placeholder content, unsupported proof, risky claims, and incomplete trust pages before recommending ad launch.",
  },
];

export function selectCopyChiefCards(assetType: string) {
  const scopeHints = new Set(["all", "all_public_assets", assetType]);

  if (assetType.includes("ad")) {
    scopeHints.add("ads");
    scopeHints.add("facebook_ads");
    scopeHints.add("instagram_ads");
  }
  if (assetType.includes("landing")) scopeHints.add("landing_page");
  if (assetType.includes("email")) scopeHints.add("email");
  if (assetType.includes("quiz")) scopeHints.add("quiz_results");
  if (assetType.includes("sales") || assetType.includes("vsl")) scopeHints.add("sales_copy");

  const relevant = copyChiefCards.filter((card) =>
    card.appliesTo.some((scope) => scopeHints.has(scope)),
  );

  const required = copyChiefCards.filter(
    (card) => card.severity === "blocker" || card.cardType === "Brand Fact",
  );

  return [...new Map([...required, ...relevant].map((card) => [card.id, card])).values()];
}
