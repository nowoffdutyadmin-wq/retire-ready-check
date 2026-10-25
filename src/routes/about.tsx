import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Chris — Now Off Duty" },
      {
        name: "description",
        content: "Chris Soll's story and the reason he created Now Off Duty.",
      },
    ],
  }),
  component: AboutPage,
});
