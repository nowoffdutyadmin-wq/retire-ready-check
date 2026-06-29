import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  async function sendMagicLink() {
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/dashboard` },
    });
    setMessage(error ? error.message : "Check your email for the login link.");
  }

  async function resetPassword() {
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/dashboard`,
    });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-12 text-ink">
      <section className="mx-auto max-w-md">
        <a href="/" className="font-serif text-[30px]">
          Now Off Duty
        </a>
        <h1 className="mt-10 font-serif text-[50px] leading-none">Member login</h1>
        <p className="mt-4 text-[18px] text-muted-foreground">
          Sign in to your cohort dashboard and today&apos;s practice.
        </p>
        {!hasSupabaseConfig() && (
          <div className="mt-6 rounded-[8px] border border-destructive bg-destructive/10 p-4 text-[16px]">
            Add Supabase environment variables before using member login.
          </div>
        )}
        <form onSubmit={signInWithPassword} className="mt-8 grid gap-4">
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
          <Button className="min-h-[48px] text-[16px]" type="button" variant="outline" onClick={sendMagicLink}>
            Send magic link
          </Button>
          <button type="button" className="min-h-[44px] text-[16px] underline" onClick={resetPassword}>
            Reset password
          </button>
        </form>
        {message && <p className="mt-5 text-[16px] text-muted-foreground">{message}</p>}
      </section>
    </main>
  );
}
