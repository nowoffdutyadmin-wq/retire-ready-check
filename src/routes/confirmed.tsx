import { createFileRoute } from "@tanstack/react-router";
import { colors, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/confirmed")({
  head: () => ({
    meta: [
      { title: "Check Your Inbox — Now Off Duty" },
      { name: "description", content: "Your free session is on its way." },
    ],
  }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
        <h1
          className="font-serif text-[44px] leading-[1.06] sm:text-[62px]"
          style={{ color: colors.ink }}
        >
          Check your inbox.
        </h1>
        <div
          className="mt-8 grid gap-5 text-[18px] leading-[1.7]"
          style={{ color: colors.inkSoft }}
        >
          <p>
            The session is on its way to you now. Give it a minute to arrive — and check your spam
            folder if you don't see it.
          </p>
          <p>Set aside 35 minutes when you find it. Somewhere quiet. Headphones if you have them.</p>
          <p className="italic">I'm looking forward to hearing what you notice.</p>
          <p className="mt-2" style={{ color: colors.ink }}>
            — Chris
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
