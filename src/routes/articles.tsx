import { createFileRoute } from "@tanstack/react-router";
import { ButtonLink, colors, PageIntro, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — Now Off Duty" },
      {
        name: "description",
        content: "Articles about retirement, nervous system regulation, identity, ease, and rest.",
      },
    ],
  }),
  component: Articles,
});

function Articles() {
  return (
    <SiteShell>
      <PageIntro eyebrow="ARTICLES" title="Retirement articles will live here.">
        <p>
          This section is intentionally ready as a placeholder for Phase 4 content. It gives the
          site a real information architecture now, without pretending articles have already been
          written.
        </p>
      </PageIntro>

      <Section narrow>
        <div
          className="rounded-[8px] p-6"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
        >
          <h2 className="font-serif text-[32px] leading-[1.15]" style={{ color: colors.ink }}>
            Coming in Phase 4
          </h2>
          <p className="mt-4 text-[18px] leading-[1.65]" style={{ color: colors.inkSoft }}>
            Planned topics include spending anxiety, sleep after retirement, identity after work,
            purpose without pressure, and how to tell the difference between a financial problem and
            a nervous system problem.
          </p>
          <div className="mt-6">
            <ButtonLink href="/survey">Take the survey first</ButtonLink>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
