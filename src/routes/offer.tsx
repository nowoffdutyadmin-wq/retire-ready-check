import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/offer")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
