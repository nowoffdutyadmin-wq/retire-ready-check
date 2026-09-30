import { createFileRoute } from "@tanstack/react-router";
import { colors, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "You're In — Now Off Duty" },
      { name: "description", content: "Welcome to the cohort." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
        <h1
          className="font-serif text-[44px] leading-[1.06] sm:text-[62px]"
          style={{ color: colors.ink }}
        >
          You're in.
        </h1>
        <div
          className="mt-8 grid gap-5 text-[18px] leading-[1.7]"
          style={{ color: colors.inkSoft }}
        >
          <p>
            Welcome to the cohort. Check your inbox — you'll receive everything you need to get
            started, including the date and Zoom link for the first session.
          </p>
          <p>If you have any questions before we begin, just reply to any email we've sent you.</p>
          <p className="italic">I'm genuinely looking forward to this one.</p>
          <p className="mt-2" style={{ color: colors.ink }}>
            — Chris
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
