import { createFileRoute } from "@tanstack/react-router";
import { colors, PageIntro, Section, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Now Off Duty" },
      {
        name: "description",
        content:
          "Answers about the Retirement Transition Assessment, who it is for, what happens after it, cost, program, and refund policy.",
      },
    ],
  }),
  component: FAQ,
});

const faqs = [
  {
    q: "What is this?",
    a: "Now Off Duty is a retirement transition education site for the part of retirement most people do not prepare for: identity, structure, spending ease, presence, and the shift from doing to being.",
  },
  {
    q: "Who is it for?",
    a: "It is for people within five years of retirement or already in the early years of it who have generally handled the financial planning, but want a clearer way to approach the rest of the transition.",
  },
  {
    q: "What is it not?",
    a: "It is not therapy, medical treatment, diagnosis, crisis support, financial advice, investment advice, or a substitute for mental health care or a financial professional.",
  },
  {
    q: "What happens after the assessment?",
    a: "You receive an Off-Duty Score, a result type, and a short breakdown of the patterns behind your score. You can then watch a short video and decide whether the Off-Duty Reset is a useful next step.",
  },
  {
    q: "What is the program?",
    a: "The Off-Duty Reset is a digital education program with five short videos, each addressing something specific behind your score, plus a guided wind-down audio for ending the day well.",
  },
  {
    q: "What does it cost?",
    a: "The Off-Duty Reset is currently $97 as a one-time purchase. A live Transition Program is planned for the first cohort at $497-$597, with a couples option expected around $997. A $49/month graduate community may be offered after the live program.",
  },
  {
    q: "What is the community?",
    a: "The Practice Community is planned as an ongoing option for cohort graduates: weekly live sits, monthly Q&A, and a peer group for continuing the work after the live program ends.",
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
          The assessment asks for your email only after your answers are complete. These are the
          basics before you decide whether to take it.
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
