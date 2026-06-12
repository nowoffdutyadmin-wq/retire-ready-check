import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { colors, DisclaimerBox, PageIntro, Section, site, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Now Off Duty" },
      {
        name: "description",
        content: "Terms of Service for Now Off Duty and the Off-Duty Reset.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteShell>
      <PageIntro eyebrow="TERMS OF SERVICE" title="What you are buying and how it works.">
        <p>
          These terms apply to the Now Off Duty site, the Retirement Transition Assessment, and
          purchases from {site.businessName}.
        </p>
      </PageIntro>

      <Section narrow>
        <div className="grid gap-7 text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <TermBlock title="What the buyer is purchasing">
            The Off-Duty Reset is a digital coaching and education program. The current product
            description is five short videos, each addressing something specific behind your score,
            plus a guided wind-down audio for ending the day well.
            Future purchases may include a live Transition Program or a graduate community if those
            offers are separately presented at checkout.
          </TermBlock>
          <TermBlock title="What it includes">
            It includes the digital materials described at checkout or on the sales section at the
            time of purchase. It does not include private therapy, medical treatment, crisis
            support, financial planning, investment recommendations, or one-on-one advice unless
            those services are separately offered in writing.
          </TermBlock>
          <TermBlock title="Delivery method">
            The program is delivered digitally. Access details are provided after purchase by the
            checkout flow, email, or an online access page.
          </TermBlock>
          <TermBlock title="Use of materials">
            The materials are for personal use only. Do not copy, resell, share, publish, or teach
            the materials as your own.
          </TermBlock>
          <TermBlock title="Results">
            No specific result is guaranteed. The program is educational and depends on your
            situation, consistency, and whether the material is appropriate for you.
          </TermBlock>
        </div>
        <div className="mt-8">
          <DisclaimerBox />
        </div>
      </Section>
    </SiteShell>
  );
}

function TermBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-[30px] leading-[1.15]" style={{ color: colors.ink }}>
        {title}
      </h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}
