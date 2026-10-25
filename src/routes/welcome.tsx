import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "../components/editorial-funnel";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "You’re In — Retire Regulated" },
      { name: "description", content: "Welcome to the Retire Regulated cohort." },
    ],
  }),
  component: WelcomePage,
});
