import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/survey")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
