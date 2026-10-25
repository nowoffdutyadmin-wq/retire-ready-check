import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  readFileSync(path.join(projectRoot, "config", "webinar-funnel.json"), "utf8"),
);
const component = readFileSync(
  path.join(projectRoot, "src", "components", "editorial-funnel.tsx"),
  "utf8",
);
const countryCodes = readFileSync(path.join(projectRoot, "src", "lib", "country-codes.ts"), "utf8");
const routeCopy = [
  "about.tsx",
  "index.tsx",
  "confirmed.tsx",
  "join.tsx",
  "thank-you.tsx",
  "training.tsx",
  "welcome.tsx",
]
  .map((file) => readFileSync(path.join(projectRoot, "src", "routes", file), "utf8"))
  .join("\n");
const activeFunnelCopy = `${component}\n${routeCopy}`;

test("working funnel configuration matches the training and cohort flow", () => {
  assert.equal(config.webinar.title, "Free Retire Regulated Training");
  assert.equal(config.webinar.durationMinutes, 35);
  assert.equal(config.cohort.programName, "Retire Regulated");
  assert.equal(config.cohort.price, 600);
  assert.equal(config.cohort.capacity, 12);
  assert.equal(config.cohort.durationWeeks, 4);
  assert.deepEqual(config.cohort.dailyPracticeOptions, ["Morning practice", "Evening practice"]);
  assert.equal(config.integrations.emailWebhookUrl, "");
  assert.equal(config.integrations.stripePaymentUrl, "");
});

test("active funnel contains the requested four-page copy", () => {
  const searchableCopy = activeFunnelCopy.replace(/\s+/g, " ");
  const expected = [
    "For years you stayed",
    "Unwinding through meditation for people in or entering retirement.",
    "Retirement was supposed to feel like peace and quiet.",
    "If any of this sounds familiar",
    "Why this happens",
    "You gave forty years to the alarm.",
    "Nobody told your body it",
    "The path",
    "Three steps to a regulated retirement.",
    "A message from Chris",
    "Real words from",
    "Common Questions, Simple Answers",
    "training-registration-form",
    "Save My Free Seat",
    "A short message from",
    "Free live training",
    "Meet your guide, Chris",
    "Read my full story",
    "Retire Regulated",
    "Build a rhythm for the chapter after full-time work.",
    "Join the next cohort",
    "You’re in.",
  ];

  for (const phrase of expected) {
    assert.equal(searchableCopy.includes(phrase), true, `Missing copy: ${phrase}`);
  }
});

test("training registration stores a tagged local preview submission and redirects to thank-you", () => {
  assert.match(component, /now-off-duty:free-training-registration/);
  assert.match(component, /tag: "free-training-registration"/);
  assert.match(component, /TrainingRegistrationForm/);
  assert.match(component, /First name/);
  assert.match(component, /Email/);
  assert.match(component, /window\.location\.assign\("\/thank-you"\)/);
  assert.match(component, /ReminderForm/);
  assert.match(component, /free-training-reminder/);
  assert.match(component, /Country code/);
  assert.match(component, /All countries and territories/);
  assert.match(component, /emailWebhookUrl/);
  assert.match(component, /player\.vimeo\.com\/video\/1210002646/);
  assert.match(component, /player\.vimeo\.com\/video\/1210003379/);
  assert.match(component, /Save number/);
  assert.match(component, /What happens <em>next\.<\/em>/);
  assert.match(component, /woman-60s-BebQCtf5\.jpg/);
  assert.equal(existsSync(path.join(projectRoot, "src", "routes", "thank-you.tsx")), true);
});

test("common phone markets appear before the full country-code list", () => {
  const commonStart = countryCodes.indexOf('"United States"');
  const commonEnd = countryCodes.indexOf('"Ireland"');
  const fullListStart = countryCodes.indexOf("export const otherCountryCodes");

  assert.equal(commonStart >= 0, true);
  assert.equal(commonEnd > commonStart, true);
  assert.equal(fullListStart > commonEnd, true);
  assert.equal(countryCodes.includes('"United Kingdom", code: "+44"'), true);
  assert.equal(countryCodes.includes('"Australia", code: "+61"'), true);
  assert.equal(countryCodes.includes('"Canada", code: "+1"'), true);
  assert.equal(countryCodes.includes('"New Zealand", code: "+64"'), true);
  assert.equal(countryCodes.includes('"Ireland", code: "+353"'), true);
});

test("legacy funnel and assessment routes redirect home", () => {
  for (const route of ["register", "confirmation", "offer", "call-confirmed", "survey", "quiz"]) {
    const source = readFileSync(path.join(projectRoot, "src", "routes", `${route}.tsx`), "utf8");
    assert.match(source, /redirect\(\{ to: "\/", statusCode: 301 \}\)/, route);
  }
});

test("legacy duplicate static HTML fallbacks are absent", () => {
  for (const route of ["register", "confirmation", "offer", "call-confirmed"]) {
    assert.equal(existsSync(path.join(projectRoot, "public", route, "index.html")), false);
  }
});

test("active funnel does not expose the previous assessment or Calendly entry points", () => {
  assert.equal(activeFunnelCopy.includes("/survey"), false);
  assert.equal(activeFunnelCopy.includes("calendlyUrl"), false);
  assert.equal(activeFunnelCopy.includes("$1,200"), false);
  assert.equal(activeFunnelCopy.includes("$1,199"), false);
  assert.equal(activeFunnelCopy.includes("The Calm Retirement Program"), false);
  assert.equal(activeFunnelCopy.includes("#payment-link"), false);
});
