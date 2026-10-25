import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EditorialLegalPage } from "../components/editorial-funnel";

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
  return (
    <EditorialLegalPage
      eyebrow="Privacy Policy"
      title="What we collect and why."
      intro={<p>This policy is written in plain language.</p>}
    >
      <PolicyBlock title="What data is collected">
        We may collect your assessment answers, open-text responses, email address, result type,
        score, purchase details, and basic website analytics such as pages visited, device type,
        and browser information.
      </PolicyBlock>
      <PolicyBlock title="How it is used">
        We use this information to show your assessment result, send your result or program access,
        respond to support questions, improve the site, understand what people are looking for, and
        process purchases or refunds.
      </PolicyBlock>
      <PolicyBlock title="Who it is shared with">
        We do not sell your personal information. We may share data with service providers that
        help run the site, send email, host data, process payments, provide analytics, or deliver
        the program. These providers are only used to operate the service.
      </PolicyBlock>
      <PolicyBlock title="How long it is kept">
        We keep information as long as needed to provide the service, handle support, meet legal
        obligations, and understand program performance. You can contact us to ask about access or
        deletion.
      </PolicyBlock>
      <PolicyBlock title="Sensitive information">
        The assessment may ask about spending habits, daily rhythm, identity, purpose, work
        history, and retirement experience. Do not enter medical emergencies, crisis details,
        financial account numbers, or anything you would not want stored digitally.
      </PolicyBlock>
    </EditorialLegalPage>
  );
}

function PolicyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
