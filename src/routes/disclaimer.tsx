import { createFileRoute } from "@tanstack/react-router";
import { EditorialLegalPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Important Disclaimer — Now Off Duty" },
      {
        name: "description",
        content: "Important disclaimer for Now Off Duty coaching and education materials.",
      },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <EditorialLegalPage
      eyebrow="Important Disclaimer"
      title="Coaching and education only."
      intro={
        <p>
          Now Off Duty is designed to help you reflect on retirement transition patterns around
          identity, spending, structure, daily rhythm, and ease. It is not a clinical or financial
          service.
        </p>
      }
    >
      <section>
        <h2>What this work is</h2>
        <p>
          This is coaching and education. It is not therapy, not medical treatment, not diagnosis,
          and not a substitute for mental health care.
        </p>
        <p>
          If you have a medical emergency, thoughts of self-harm, or any urgent concern, contact a
          licensed professional or emergency service in your area.
        </p>
        <p>
          This site also does not provide financial advice. Nothing here should be treated as
          investment advice, retirement income advice, tax advice, legal advice, or a replacement
          for your financial planner, accountant, attorney, or other qualified professional.
        </p>
        <p>
          The assessment and program may help you reflect on your own experience. They do not tell
          you what to do with your money, care decisions, medication, relationships, or legal
          affairs.
        </p>
      </section>
    </EditorialLegalPage>
  );
}
