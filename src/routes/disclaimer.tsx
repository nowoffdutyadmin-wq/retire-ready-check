import { createFileRoute } from "@tanstack/react-router";
import { colors, PageIntro, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Medical & Financial Disclaimer — Now Off Duty" },
      {
        name: "description",
        content:
          "Medical and financial disclaimer for Now Off Duty coaching and education materials.",
      },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <SiteShell>
      <PageIntro eyebrow="MEDICAL & FINANCIAL DISCLAIMER" title="Coaching and education only.">
        <p>
          Now Off Duty is designed to help you understand patterns around retirement, stress,
          identity, rest, spending, and ease. It is not a clinical or financial service.
        </p>
      </PageIntro>

      <Section narrow>
        <div className="grid gap-6 text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            This is coaching and education. It is not therapy, not medical treatment, not diagnosis,
            and not a substitute for mental health care.
          </p>
          <p>
            If you have a mental health condition, trauma history, medical concern, severe anxiety,
            depression, suicidal thoughts, or any urgent symptoms, speak with a licensed health
            professional or emergency service in your area.
          </p>
          <p>
            This site also does not provide financial advice. Nothing here should be treated as
            investment advice, retirement income advice, tax advice, legal advice, or a replacement
            for your financial planner, accountant, attorney, or other qualified professional.
          </p>
          <p>
            The quiz and program may help you reflect on your internal experience. They do not tell
            you what to do with your money, health care, medication, relationships, or legal
            affairs.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
