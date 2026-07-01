import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { exchangeAuthCodeFromUrl, getPortalPathForSession } from "@/lib/meditation/auth-flow";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in - Now Off Duty" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      await exchangeAuthCodeFromUrl();
      const target = await getPortalPathForSession();
      if (!active) return;

      if (target === "/admin") {
        await navigate({ to: "/admin", replace: true });
        return;
      }
      if (target === "/dashboard") {
        await navigate({ to: "/dashboard", replace: true });
        return;
      }

      setMessage("This sign-in link did not open a session. Please request a fresh link.");
      await navigate({ to: "/login", replace: true });
    }

    finishSignIn().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-paper px-5 py-12 text-ink">
      <section className="mx-auto max-w-md">
        <a href="/" className="font-serif text-[30px]">
          Now Off Duty
        </a>
        <h1 className="mt-10 font-serif text-[50px] leading-none">Opening your portal</h1>
        <p className="mt-4 text-[18px] text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
