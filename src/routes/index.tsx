import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../components/editorial-funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Now Off Duty — Free Retire Regulated Training" },
      {
        name: "description",
        content:
          "Unwinding through meditation for people in or entering retirement. So you can live the chapter you've earned to the fullest.",
      },
      { property: "og:title", content: "Now Off Duty — Free Retire Regulated Training" },
      {
        property: "og:description",
        content: "For years you stayed on duty. Now, ease into living off duty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});
