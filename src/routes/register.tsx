import { createFileRoute } from "@tanstack/react-router";
import { WebinarRegistrationPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "The Calm Retirement — Now Off Duty" },
      {
        name: "description",
        content: "A free 60-minute online training for the retirement transition.",
      },
    ],
  }),
  component: WebinarRegistrationPage,
});
