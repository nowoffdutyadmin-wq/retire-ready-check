import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPortalPathForSession } from "@/lib/meditation/auth-flow";
import { friendlyMeditationError } from "@/lib/meditation/error-messages";
import { hasSupabaseConfig, siteUrl, supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Member Login - Now Off Duty" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function hasValidEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  const routeSignedInUser = useCallback(async () => {
    const target = await getPortalPathForSession();
    if (target === "/admin") {
      await navigate({ to: "/admin", replace: true });
      return;
    }
    if (target === "/dashboard") {
      await navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    routeSignedInUser().catch(() => {
      // Stay on login if the current browser session cannot be resolved.
    });
  }, [routeSignedInUser]);

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() && !password) {
      setMessage("Please enter your email and password.");
      return;
    }
    if (!hasValidEmail()) {
      setMessage("Please enter the email Chris added for you.");
      return;
    }
    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setMessage(
        friendlyMeditationError(
          error,
          "Sign-in did not work. Check your email and password, then try again.",
        ),
      );
      return;
    }
    await routeSignedInUser();
  }

  async function sendMagicLink() {
    setMessage("");
    if (!email.trim()) {
      setMessage("Enter the email Chris added for you first.");
      return;
    }
    if (!hasValidEmail()) {
      setMessage("Please enter a valid email address before requesting a magic link.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: false,
      },
    });
    setMessage(
      error
        ? friendlyMeditationError(
            error,
            "Magic link could not be sent. Check the email and try again.",
          )
        : "Check your email for the login link.",
    );
  }

  async function resetPassword() {
    setMessage("");
    if (!email.trim()) {
      setMessage("Enter the email Chris added for you before resetting your password.");
      return;
    }
    if (!hasValidEmail()) {
      setMessage("Please enter a valid email address before resetting your password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${siteUrl}/auth/callback`,
    });
    setMessage(
      error
        ? friendlyMeditationError(
            error,
            "Password reset email could not be sent. Check the email and try again.",
          )
        : "Password reset email sent.",
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-12 text-ink">
      <section className="mx-auto max-w-md">
        <a href="/" className="font-serif text-[30px]">
          Now Off Duty
        </a>
        <h1 className="mt-10 font-serif text-[50px] leading-none">Member login</h1>
        <p className="mt-4 text-[18px] text-muted-foreground">
          Sign in with the email Chris added for your cohort. This page does not create new
          accounts.
        </p>
        {!hasSupabaseConfig() && (
          <div className="mt-6 rounded-[8px] border border-destructive bg-destructive/10 p-4 text-[16px]">
            Add Supabase environment variables before using member login.
          </div>
        )}
        <form onSubmit={signInWithPassword} noValidate className="mt-8 grid gap-4">
          <label className="grid gap-2 text-[16px] font-medium">
            Email
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label className="grid gap-2 text-[16px] font-medium">
            Password
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>
          <Button className="min-h-[48px] text-[16px]" type="submit">
            Sign in
          </Button>
          <Button
            className="min-h-[48px] text-[16px]"
            type="button"
            variant="outline"
            onClick={sendMagicLink}
          >
            Send magic link
          </Button>
          <button
            type="button"
            className="min-h-[44px] text-[16px] underline"
            onClick={resetPassword}
          >
            Reset password
          </button>
        </form>
        {message && <p className="mt-5 text-[16px] text-muted-foreground">{message}</p>}
      </section>
    </main>
  );
}
