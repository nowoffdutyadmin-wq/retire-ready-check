import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "../components/webinar-funnel";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "You're In — Now Off Duty" },
      { name: "description", content: "Confirmation for the Now Off Duty cohort." },
    ],
  }),
  component: WelcomePage,
});
