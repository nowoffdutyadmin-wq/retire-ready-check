import { createFileRoute } from "@tanstack/react-router";
import { ConfirmedPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/confirmed")({
  head: () => ({
    meta: [
      { title: "Your Training Is Ready — Now Off Duty" },
      { name: "description", content: "Access your free Retire Regulated training." },
    ],
  }),
  component: ConfirmedPage,
});
