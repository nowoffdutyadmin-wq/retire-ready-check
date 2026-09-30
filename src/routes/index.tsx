import { createFileRoute } from "@tanstack/react-router";
import { OptInPage } from "../components/webinar-funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Now Off Duty — Free Session" },
      {
        name: "description",
        content:
          "A free 35-minute session from Chris Soll about the part of retirement almost nobody prepares for.",
      },
      { property: "og:title", content: "Now Off Duty — Free Session" },
      {
        property: "og:description",
        content: "Watch a free 35-minute session about the transition beyond the financial plan.",
      },
      { name: "twitter:title", content: "Now Off Duty — Free Session" },
      {
        name: "twitter:description",
        content: "Watch a free 35-minute session about the transition beyond the financial plan.",
      },
    ],
  }),
  component: OptInPage,
});
