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
  const hasEmail = site.email.trim().length > 0;

  return (
    <SiteShell>
      <PageIntro eyebrow="REFUND & GUARANTEE POLICY" title="Simple 30-day refund.">
        <p>
          If it does not help, contact us within 30 days using the purchase email address. Full
          refund, no questions.
        </p>
      </PageIntro>

      <Section narrow>
        <div
          className="rounded-[8px] p-6 text-[18px] leading-[1.7]"
          style={{
            backgroundColor: colors.paper,
            border: `1px solid ${colors.rule}`,
            color: colors.inkSoft,
          }}
        >
          <p>
            To request a refund, contact us within 30 days of purchase using the email address you
            purchased with
            {hasEmail ? (
              <>
                {" "}
                at{" "}
                <a className="underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </>
            ) : (
              " through the support contact shown at checkout"
            )}
            .
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
