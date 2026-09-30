import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/call-confirmed")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
