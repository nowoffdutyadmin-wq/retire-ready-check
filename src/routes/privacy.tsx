import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { colors, PageIntro, Section, site, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Now Off Duty" },
      {
        name: "description",
        content: "Plain-language privacy policy for Now Off Duty.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const hasEmail = site.email.trim().length > 0;

  return (
    <SiteShell>
      <PageIntro eyebrow="PRIVACY POLICY" title="What we collect and why.">
        <p>
          This policy is written in plain language. If you have questions, use the public contact
          details listed on the Contact page{hasEmail ? " or email us directly." : "."}
          {hasEmail && (
            <>
              {" "}
              <a className="underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              .
            </>
          )}
        </p>
      </PageIntro>

      <Section narrow>
        <div className="grid gap-7 text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <PolicyBlock title="What data is collected">
            We may collect your assessment answers, open-text responses, email address, result type,
            score, purchase details, and basic website analytics such as pages visited, device type,
            and browser information.
          </PolicyBlock>
          <PolicyBlock title="How it is used">
            We use this information to show your assessment result, send your result or program
            access, respond to support questions, improve the site, understand what people are
            looking for, and process purchases or refunds.
          </PolicyBlock>
          <PolicyBlock title="Who it is shared with">
            We do not sell your personal information. We may share data with service providers that
            help run the site, send email, host data, process payments, provide analytics, or
            deliver the program. These providers are only used to operate the service.
          </PolicyBlock>
          <PolicyBlock title="How long it is kept">
            We keep information as long as needed to provide the service, handle support, meet legal
            obligations, and understand program performance. You can contact us to ask about access
            or deletion.
          </PolicyBlock>
          <PolicyBlock title="Sensitive information">
            The assessment may ask about spending habits, daily rhythm, identity, purpose, work
            history, and retirement experience. Do not enter medical emergencies, crisis details,
            financial account numbers, or anything you would not want stored digitally.
          </PolicyBlock>
        </div>
      </Section>
    </SiteShell>
  );
}

function PolicyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-[30px] leading-[1.15]" style={{ color: colors.ink }}>
        {title}
      </h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}
