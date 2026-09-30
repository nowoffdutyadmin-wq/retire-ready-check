import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(projectRoot, "config", "webinar-funnel.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const missing = [];

function requireText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    missing.push(label);
  }
}

function requirePositiveNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    missing.push(label);
  }
}

requireText(config.webinar.title, "webinar title");
requireText(config.webinar.format, "free session format");
requirePositiveNumber(config.webinar.durationMinutes, "webinar duration");

requireText(config.cohort.programName, "cohort program name");
requirePositiveNumber(config.cohort.price, "cohort price");
requirePositiveNumber(config.cohort.durationWeeks, "cohort duration");

requireText(config.integrations.emailWebhookUrl, "email platform webhook");
requireText(config.integrations.stripePaymentUrl, "Stripe payment link");
requireText(config.assets.chrisHeadshotUrl, "approved Chris headshot");

if (missing.length > 0) {
  console.error("Webinar funnel launch validation failed.");
  for (const item of missing) {
    console.error(`[NEEDS INPUT] ${item}`);
  }
  process.exitCode = 1;
} else {
  console.log("Webinar funnel launch configuration is complete.");
}
