import { createFileRoute } from "@tanstack/react-router";
import { JoinPage } from "../components/webinar-funnel";
import { formattedCohortPrice } from "../lib/webinar-funnel-config";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "The Calm Retirement Program — Now Off Duty" },
      {
        name: "description",
        content: `A four-week program with Chris Soll. Join the next cohort for ${formattedCohortPrice}.`,
      },
      { property: "og:title", content: "The Calm Retirement Program — Now Off Duty" },
      {
        property: "og:description",
        content:
          "Four weeks to build the practice that makes the rest of this chapter feel the way you planned.",
      },
    ],
  }),
  component: JoinPage,
});
