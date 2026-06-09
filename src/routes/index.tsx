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
      { title: "Now Off Duty — Retirement Can Feel Safe Again" },
      {
        name: "description",
        content:
          "A practical retirement readiness site and self-assessment for people who have planned the financial side, but still do not feel fully settled.",
      },
      { property: "og:title", content: "Now Off Duty — Retirement Can Feel Safe Again" },
      {
        property: "og:description",
        content:
          "Take the Retirement Reality Check and see what may be keeping retirement from feeling safe, calm, and enjoyable.",
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
            RETIREMENT REALITY CHECK
          </div>
          <h1
            className="font-serif text-[48px] leading-[1.04] sm:text-[72px]"
            style={{ color: colors.ink }}
          >
            You planned the money. Now help retirement feel safe.
          </h1>
          <p className="mt-6 max-w-2xl text-[20px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            Now Off Duty helps capable, successful retirees understand the emotional and nervous
            system side of retirement: the part spreadsheets cannot settle on their own.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/survey">Take the four-minute survey</ButtonLink>
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
            What the quiz shows you
          </h2>
          <div className="mt-5">
            <BulletList
              items={[
                "Whether spending still feels unsafe, even when the numbers say otherwise.",
                "Whether your body is still carrying work-mode tension.",
                "Whether identity, purpose, structure, or connection need attention.",
                "Which next step fits your score instead of giving you generic advice.",
              ]}
            />
          </div>
        </div>
      </section>

      <Section title="This is not another retirement calculator.">
        <InfoGrid>
          <InfoCard title="Financially prepared can still feel unsettled.">
            A portfolio can be healthy while your nervous system still treats spending, rest, or
            open time as a problem to solve.
          </InfoCard>
          <InfoCard title="The work is practical.">
            The assessment points to specific patterns: spending safety, rest and sleep, purpose,
            ease, identity, and daily structure.
          </InfoCard>
          <InfoCard title="Chris keeps it grounded.">
            Chris Soll brings the Mindspo background in meditation, regulation, retreats, and
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
                  "People close to retirement or already retired who have done the financial planning.",
                  "People who expected more ease than they currently feel.",
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
                  "People looking for therapy, medical treatment, or crisis support.",
                  "People looking for financial advice, portfolio guidance, or investment recommendations.",
                  "People who need urgent mental health care or emergency support.",
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Start with the Retirement Reality Check">
        <div
          className="rounded-[8px] p-6 sm:p-8"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
        >
          <p className="max-w-3xl text-[20px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            The quiz takes about four minutes. It gives you a score, a result type, and a clearer
            sense of what may be keeping retirement from feeling as safe, calm, and enjoyable as it
            should.
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
