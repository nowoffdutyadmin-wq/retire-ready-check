import { createFileRoute } from "@tanstack/react-router";
import { OfferPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/offer")({
  head: () => ({
    meta: [
      { title: "The Calm Retirement Program — Now Off Duty" },
      {
        name: "description",
        content:
          "A four-week small-group program for people preparing for the retirement transition.",
      },
    ],
  }),
  component: OfferPage,
});
