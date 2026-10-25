import { createFileRoute } from "@tanstack/react-router";
import { ThankYouPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "You're In — Now Off Duty" },
      {
        name: "description",
        content: "Access your free Now Off Duty training and request a reminder.",
      },
    ],
  }),
  component: ThankYouPage,
});
