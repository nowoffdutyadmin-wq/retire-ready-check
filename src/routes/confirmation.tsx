import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/confirmation")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
