import { createFileRoute } from "@tanstack/react-router";
import { WebinarConfirmationPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "You're Registered — Now Off Duty" },
      {
        name: "description",
        content: "Registration confirmation for The Calm Retirement webinar.",
      },
    ],
  }),
  component: WebinarConfirmationPage,
});
