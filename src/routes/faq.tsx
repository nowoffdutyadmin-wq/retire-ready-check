import { createFileRoute } from "@tanstack/react-router";
import { colors, PageIntro, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Now Off Duty" },
      {
        name: "description",
        content:
          "Answers about the Retirement Reality Check, who it is for, what happens after the quiz, cost, program, and refund policy.",
      },
    ],
  }),
  component: FAQ,
});

const faqs = [
  {
    q: "What is this?",
    a: "Now Off Duty is a retirement readiness and education site focused on the emotional and nervous system side of retirement. The quiz helps you see what may be keeping retirement from feeling as safe, calm, and enjoyable as it should.",
  },
  {
    q: "Who is it for?",
    a: "It is for people close to retirement or already retired who have generally handled the financial planning, but still feel tension, guilt, restlessness, identity loss, spending anxiety, or a lack of ease.",
  },
  {
    q: "What is it not?",
    a: "It is not therapy, medical treatment, diagnosis, crisis support, financial advice, investment advice, or a substitute for mental health care or a financial professional.",
  },
  {
    q: "What happens after the quiz?",
    a: "You receive an Off-Duty Score, a result type, and a short breakdown of the patterns behind your score. You can then watch a short video and decide whether the Off-Duty Reset is a useful next step.",
  },
  {
    q: "What is the program?",
    a: "The Off-Duty Reset is a digital education program with five short videos, each addressing something specific behind your score, plus a guided wind-down audio for physical tension.",
  },
  {
    q: "What does it cost?",
    a: "The current price shown on the site is $97 as a one-time purchase.",
  },
  {
    q: "What is the refund policy?",
    a: "If it does not help, email us within 30 days. Full refund, no questions.",
  },
];

function FAQ() {
  return (
    <SiteShell>
      <PageIntro eyebrow="FAQ" title="Plain answers before you share anything.">
        <p>
          The quiz asks for your email only after your answers are complete. These are the basics
          before you decide whether to take it.
        </p>
      </PageIntro>

      <Section narrow>
        <div className="grid gap-5">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-[8px] p-5"
              style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
            >
              <h2 className="font-serif text-[30px] leading-[1.15]" style={{ color: colors.ink }}>
                {item.q}
              </h2>
              <p className="mt-3 text-[18px] leading-[1.65]" style={{ color: colors.inkSoft }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
