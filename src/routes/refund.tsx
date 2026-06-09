import { createFileRoute } from "@tanstack/react-router";
import { colors, PageIntro, Section, site, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Guarantee Policy — Now Off Duty" },
      {
        name: "description",
        content: "Short, plain-language refund and guarantee policy.",
      },
    ],
  }),
  component: Refund,
});

function Refund() {
  return (
    <SiteShell>
      <PageIntro eyebrow="REFUND & GUARANTEE POLICY" title="Simple 30-day refund.">
        <p>If it does not help, email us within 30 days. Full refund, no questions.</p>
      </PageIntro>

      <Section narrow>
        <div
          className="rounded-[8px] p-6 text-[18px] leading-[1.7]"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}`, color: colors.inkSoft }}
        >
          <p>
            To request a refund, email{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            within 30 days of purchase using the email address you purchased with.
          </p>
          <p className="mt-5">
            Refunds are intended for the Off-Duty Reset digital program. If a different product or
            service is sold later, its checkout page should state whether this same policy applies.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
