import { createFileRoute } from "@tanstack/react-router";
import {
  BulletList,
  ButtonLink,
  colors,
  DisclaimerBox,
  InfoCard,
  InfoGrid,
  Section,
  SiteShell,
} from "../components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Now Off Duty — Retirement Transition Assessment" },
      {
        name: "description",
        content:
          "A practical retirement transition site and self-assessment for people who have prepared the financial side and want to prepare for the rest of the chapter.",
      },
      { property: "og:title", content: "Now Off Duty — Retirement Transition Assessment" },
      {
        property: "og:description",
        content:
          "Take the Retirement Transition Assessment and see what this next chapter may ask of you beyond the numbers.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-5 text-[16px] font-semibold tracking-[0.12em]" style={{ color: colors.sageDeep }}>
            RETIREMENT TRANSITION ASSESSMENT
          </div>
          <h1
            className="font-serif text-[48px] leading-[1.04] sm:text-[72px]"
            style={{ color: colors.ink }}
          >
            You prepared the finances. Have you prepared for the transition?
          </h1>
          <p className="mt-6 max-w-2xl text-[20px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            For 40 years, you built toward this chapter. Now Off Duty helps capable people prepare
            for the part spreadsheets do not cover: who you are when the structure changes, how you
            spend your time, and how to be present in the life you built.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/survey">Take the four-minute assessment</ButtonLink>
            <ButtonLink href="/about" secondary>
              Learn about Chris
            </ButtonLink>
          </div>
          <p className="mt-4 text-[17px]" style={{ color: colors.muted }}>
            Your answers stay private.
          </p>
        </div>

        <div
          className="rounded-[8px] p-6"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
        >
          <h2 className="font-serif text-[34px] leading-[1.12]" style={{ color: colors.ink }}>
            What the assessment shows you
          </h2>
          <div className="mt-5">
            <BulletList
              items={[
                "Whether spending still brings hesitation, even when the numbers are solid.",
                "Whether work-mode momentum is still shaping your days.",
                "Whether identity, purpose, structure, or connection need a clearer plan.",
                "Which next step fits your score instead of giving you generic advice.",
              ]}
            />
          </div>
        </div>
      </section>

      <Section title="This is not another retirement calculator.">
        <InfoGrid>
          <InfoCard title="Financially prepared can still feel unfinished.">
            A portfolio can be in good shape while spending, open time, and the shift away from
            work still feel harder to enjoy than expected.
          </InfoCard>
          <InfoCard title="The work is practical.">
            The assessment points to specific transition patterns: spending ease, daily rhythm,
            purpose, identity, connection, and open time.
          </InfoCard>
          <InfoCard title="Chris keeps it grounded.">
            Chris Soll brings the Mindspo background in meditation education, retreats, and
            practical transformation into a retirement-specific format.
          </InfoCard>
        </InfoGrid>
      </Section>

      <Section title="Who this is for">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              Designed for
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "People within five years of retirement or already in the early years of it.",
                  "People who handled the financial planning and want the next chapter to feel clear, present, and enjoyable.",
                  "People who want grounded coaching and education, not hype or diagnosis.",
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              Not designed for
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "People looking for therapy, clinical treatment, or crisis support.",
                  "People looking for financial advice, portfolio guidance, or investment recommendations.",
                  "People who need urgent support or emergency help.",
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Start with the Retirement Transition Assessment">
        <div
          className="rounded-[8px] p-6 sm:p-8"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
        >
          <p className="max-w-3xl text-[20px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            The assessment takes about four minutes. It gives you a score, a result type, and a
            clearer view of the transition patterns that may shape this next chapter: spending,
            structure, identity, connection, and daily rhythm.
          </p>
          <div className="mt-6">
            <ButtonLink href="/survey">Start the assessment</ButtonLink>
          </div>
        </div>
      </Section>

      <Section>
        <DisclaimerBox />
      </Section>
    </SiteShell>
  );
}
