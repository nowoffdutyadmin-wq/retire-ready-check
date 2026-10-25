import { createFileRoute } from "@tanstack/react-router";
import { JoinPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Retire Regulated — Now Off Duty" },
      {
        name: "description",
        content:
          "A four-week meditation and regulation program for people entering or in retirement.",
      },
      { property: "og:title", content: "Retire Regulated — Now Off Duty" },
      {
        property: "og:description",
        content: "Build a rhythm for the chapter after full-time work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});
