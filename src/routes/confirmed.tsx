import { createFileRoute } from "@tanstack/react-router";
import { ConfirmedPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/confirmed")({
  head: () => ({
    meta: [
      { title: "Check Your Inbox — Now Off Duty" },
      { name: "description", content: "Confirmation for the free Now Off Duty session." },
    ],
  }),
  component: ConfirmedPage,
});
