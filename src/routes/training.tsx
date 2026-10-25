import { createFileRoute } from "@tanstack/react-router";
import { TrainingPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Free Live Training — Now Off Duty" },
      {
        name: "description",
        content:
          "Join a free live meditation and regulation training for people in or entering retirement.",
      },
    ],
  }),
  component: TrainingPage,
});
