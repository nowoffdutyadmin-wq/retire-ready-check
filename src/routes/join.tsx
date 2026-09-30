import { createFileRoute } from "@tanstack/react-router";
import { colors, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "The Calm Retirement Program — Now Off Duty" },
      {
        name: "description",
        content:
          "Four weeks to build the practice that makes the rest of this chapter feel the way you planned.",
      },
      { property: "og:title", content: "The Calm Retirement Program — Now Off Duty" },
      {
        property: "og:description",
        content: "A small group. Live sessions with Chris. A practice that sticks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

const included = [
  {
    title: "One 90-minute live session with Chris each week",
    body: "Teaching, guided practice, and open Q&A. Four sessions over four weeks.",
  },
  {
    title: "Daily guided audio practice",
    body: "10, 20, or 30 minutes — you choose what fits your day. Available any time, on any device.",
  },
  {
    title: "A mid-week check-in from Chris",
    body: "A short voice note each week from Chris, addressed to what the group is actually experiencing.",
  },
  {
    title: "An accountability partner and the daily unlock system",
    body: "You'll be paired with someone at a similar stage. Both of you confirm your practice each day before the next session unlocks. It's surprisingly hard to let someone else down.",
  },
  {
    title: "Physical rewards through the cohort",
    body: "A handwritten note from Chris in week one. Sealed insight cards for weeks two, three, and four. And for the pair with the highest streak: a practice cushion, chosen and sent by Chris.",
  },
  {
    title: "Access to the Practice Club at cohort end",
    body: "Weekly live sessions and a community of people continuing the practice. $49/month, with first access reserved for cohort graduates.",
  },
];

function JoinPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:pt-16">
        <div
          className="mb-4 text-[16px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          THE CALM RETIREMENT PROGRAM
        </div>
        <h1
          className="font-serif text-[44px] leading-[1.06] sm:text-[62px]"
          style={{ color: colors.ink }}
        >
          Four weeks to build the practice that makes the rest of this chapter feel the way you
          planned.
        </h1>
        <p className="mt-6 max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          A small group. Live sessions with Chris. A practice that sticks.
        </p>
      </section>

      <Section narrow>
        <div className="grid gap-5 text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Over four weeks, Chris works with a small group of people who've recognised the same
            thing: that the retirement they planned doesn't feel the way they expected, and that
            the standard advice has fallen short of the actual transition.
          </p>
          <p>
            The program teaches two specific practices — one that helps the body release tension
            it's been holding for decades, one that quiets the mind. You'll have a structure, an
            accountability partner, and Chris live every week to make sure both stick.
          </p>
          <p>
            Most people notice a difference within the first week. By week four, the practice is
            simply part of their day.
          </p>
        </div>
      </Section>

      <Section narrow>
        <div
          className="mb-4 text-[14px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          WHAT'S INCLUDED
        </div>
        <div className="grid gap-4">
          {included.map((item) => (
            <div
              key={item.title}
              className="rounded-[8px] p-5"
              style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
            >
              <h3 className="font-serif text-[24px] leading-[1.2]" style={{ color: colors.ink }}>
                {item.title}
              </h3>
              <p className="mt-2 text-[17px] leading-[1.65]" style={{ color: colors.inkSoft }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section narrow>
        <div
          className="rounded-[8px] p-6 sm:p-8"
          style={{ backgroundColor: colors.sageSoft, border: `1px solid ${colors.sage}` }}
        >
          <div
            className="mb-4 text-[14px] font-semibold tracking-[0.12em]"
            style={{ color: colors.sageDeep }}
          >
            THE INVESTMENT
          </div>
          <div className="font-serif text-[56px] leading-none" style={{ color: colors.ink }}>
            $499
          </div>
          <p className="mt-3 text-[18px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            Four weeks. Full access. Everything listed above.
          </p>
          <a
            href="#payment-link"
            className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center rounded-[10px] px-7 text-[18px] font-semibold"
            style={{ backgroundColor: colors.cta, color: colors.paper, border: `1px solid ${colors.cta}` }}
          >
            Join the next cohort →
          </a>
          <p className="mt-4 text-[15px]" style={{ color: colors.muted }}>
            Questions? Reply to any email we've sent you.
          </p>
        </div>
      </Section>

      <Section narrow>
        <div
          className="mb-4 text-[14px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          THE GUARANTEES
        </div>
        <div className="grid gap-4">
          <div
            className="rounded-[8px] p-5 text-[17px] leading-[1.65]"
            style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}`, color: colors.inkSoft }}
          >
            If you join and decide within the first 7 days it's not right for you, just let us
            know. Full refund. No questions.
          </div>
          <div
            className="rounded-[8px] p-5 text-[17px] leading-[1.65]"
            style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}`, color: colors.inkSoft }}
          >
            If you attend all four live sessions, complete the daily practice, and notice no shift
            in how you sleep or how your mind settles by week four — tell us. We'll make it right.
          </div>
        </div>
      </Section>

      <Section narrow>
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
            Chris Soll is the co-founder of Mindspo and the guide behind Now Off Duty. He works
            with people who have built full lives and are ready for this chapter to feel steadier,
            calmer, and more like theirs.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
