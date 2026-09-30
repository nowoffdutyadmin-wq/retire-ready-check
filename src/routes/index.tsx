import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BulletList,
  colors,
  DisclaimerBox,
  Section,
  SiteShell,
} from "../components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Now Off Duty — Free Session with Chris Soll" },
      {
        name: "description",
        content:
          "A free 35-minute session for people who prepared the financial side of retirement and want the rest of the chapter to feel the way they planned.",
      },
      { property: "og:title", content: "Now Off Duty — Free Session with Chris Soll" },
      {
        property: "og:description",
        content:
          "You prepared the finances. Here is the part almost nobody prepares for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OptInPage,
});

function ChrisBio() {
  return (
    <div
      className="rounded-[8px] p-6"
      style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full text-[18px] font-semibold"
          style={{ backgroundColor: colors.sageSoft, color: colors.sageDeep }}
          role="img"
          aria-label="Chris Soll photo"
        >
          CS
        </div>
        <div>
          <div className="text-[18px] font-semibold" style={{ color: colors.ink }}>
            Chris Soll
          </div>
          <div className="mt-1 text-[16px]" style={{ color: colors.muted }}>
            Practice Teacher · Co-founder, Mindspo
          </div>
        </div>
      </div>
      <p className="mt-5 text-[17px] leading-[1.65]" style={{ color: colors.inkSoft }}>
        I've spent ten years helping people understand what's happening on their inside — and
        teaching them one practice that changes it. This session is built around something I've
        watched work more times than I can count. I'm looking forward to sharing it with you.
      </p>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
      setError("Please enter a valid email address.");
      return;
    }
    // TODO: connect email platform webhook (ConvertKit/ActiveCampaign) here,
    // tagging the subscriber with "free-video-optin". Redirect works regardless.
    try {
      const stored = JSON.parse(localStorage.getItem("nod_optins") ?? "[]");
      stored.push({ email: value, tag: "free-video-optin", at: new Date().toISOString() });
      localStorage.setItem("nod_optins", JSON.stringify(stored));
    } catch {
      // storage unavailable — redirect must still work
    }
    navigate({ to: "/confirmed" });
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-12 sm:pt-16">
        <div
          className="mb-4 text-[16px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          CHRIS SOLL · PRACTICE TEACHER &amp; RETIREMENT TRANSITION COACH
        </div>
        <h1
          className="font-serif text-[44px] leading-[1.06] sm:text-[62px]"
          style={{ color: colors.ink }}
        >
          You prepared the finances. Here is the part almost nobody prepares for.
        </h1>
        <p className="mt-6 max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          A free 35-minute session. Watch it once. Most people notice something shift before it
          ends.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-3" noValidate>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="min-h-[56px] w-full rounded-[10px] px-4 text-[18px]"
            style={{
              backgroundColor: colors.paper,
              border: `1px solid ${colors.rule}`,
              color: colors.ink,
            }}
            aria-label="Email address"
          />
          {error && (
            <p className="text-[15px]" style={{ color: colors.cta }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="inline-flex min-h-[56px] items-center justify-center rounded-[10px] px-7 text-[18px] font-semibold"
            style={{ backgroundColor: colors.cta, color: colors.paper, border: `1px solid ${colors.cta}` }}
          >
            Send me the free session →
          </button>
          <p className="text-[14px]" style={{ color: colors.muted }}>
            Free. No credit card. Unsubscribe any time.
          </p>
        </form>
      </section>

      <Section narrow>
        <div
          className="mb-4 text-[14px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          WHAT THE SESSION COVERS
        </div>
        <BulletList
          items={[
            "Why the calm you expected hasn't arrived, and what's actually behind it",
            "The one thing that's in the way, and what to do about it",
            "A practice you can use in the session itself. Most people notice a shift before the hour is up.",
          ]}
        />
      </Section>

      <Section narrow>
        <ChrisBio />
      </Section>

      <Section narrow>
        <DisclaimerBox />
      </Section>
    </SiteShell>
  );
}
