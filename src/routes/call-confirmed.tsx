import { createFileRoute } from "@tanstack/react-router";
import { CallConfirmedPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/call-confirmed")({
  head: () => ({
    meta: [
      { title: "You're Booked — Now Off Duty" },
      { name: "description", content: "Discovery call confirmation for Now Off Duty." },
    ],
  }),
  component: CallConfirmedPage,
});
