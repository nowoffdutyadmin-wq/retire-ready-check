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
  path.join(projectRoot, "src", "components", "webinar-funnel.tsx"),
  "utf8",
);
const routeCopy = ["index.tsx", "confirmed.tsx", "join.tsx", "welcome.tsx"]
  .map((file) => readFileSync(path.join(projectRoot, "src", "routes", file), "utf8"))
  .join("\n");
const activeFunnelCopy = `${component}\n${routeCopy}`;

test("working funnel configuration matches the four-page opt-in and cohort flow", () => {
  assert.equal(config.webinar.title, "Free 35-Minute Session");
  assert.equal(config.webinar.durationMinutes, 35);
  assert.equal(config.cohort.programName, "The Calm Retirement Program");
  assert.equal(config.cohort.price, 499);
  assert.equal(config.cohort.durationWeeks, 4);
  assert.equal(config.integrations.emailWebhookUrl, "");
  assert.equal(config.integrations.stripePaymentUrl, "");
});

test("active funnel contains the requested four-page copy", () => {
  const searchableCopy = activeFunnelCopy.replace(/\s+/g, " ");
  const expected = [
    "You prepared the finances. Here is the part almost nobody prepares for.",
    "A free 35-minute session. Watch it once. Most people notice something shift before it ends.",
    "Send me the free session →",
    "Check your inbox.",
    "The Calm Retirement Program",
    "Four weeks to build the practice that makes the rest of this chapter feel the way you planned.",
    "Join the next cohort →",
    "You're in.",
  ];

  for (const phrase of expected) {
    assert.equal(searchableCopy.includes(phrase), true, `Missing copy: ${phrase}`);
  }
});

test("opt-in form stores a tagged local preview submission and redirects to confirmation", () => {
  assert.match(component, /now-off-duty:free-video-optin/);
  assert.match(component, /tag: "free-video-optin"/);
  assert.match(component, /window\.location\.assign\("\/confirmed"\)/);
  assert.match(component, /emailWebhookUrl/);
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
});
