import { createFileRoute } from "@tanstack/react-router";
import {
  BulletList,
  colors,
  DisclaimerBox,
  PageIntro,
  Section,
  SiteShell,
} from "../components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Chris — Now Off Duty" },
      {
        name: "description",
        content:
          "Learn about Chris Soll, his background with Mindspo, and what Now Off Duty is and is not.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <PageIntro eyebrow="ABOUT CHRIS" title="A practical guide for the part of retirement no one plans for.">
        <p>
          Chris Soll is the co-founder of Mindspo, a global mental wellness brand built from lived
          experience. Before building Mindspo, he spent his twenties in corporate project
          management, including work for the Australian Department of Education, where he saw how
          high-pressure environments can keep capable people in a constant state of tension.
        </p>
      </PageIntro>

      <Section title="Before this work">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Chris brought structure, strategy, and operational discipline to Mindspo. With 15 years
            of online business experience and multiple ventures behind him, he helped turn a deeply
            personal practice into courses, retreats, app experiences, podcasts, and teacher
            training used by people around the world.
          </p>
          <p className="mt-5">
            His background matters here because Now Off Duty is built for people who know how to
            achieve, lead, solve, and carry responsibility. It does not assume the reader is fragile.
            It assumes they may have spent decades being competent, and that competence has a cost
            when the body does not know how to stand down.
          </p>
        </div>
      </Section>

      <Section title="What happened">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Mindspo began after Chris and Rochelle Fox went through an intense period of anxiety,
            panic, night terrors, and nervous system chaos in their early twenties. They tried
            doctors, therapists, supplements, routines, and every late-night answer they could find.
            Chris was often the one holding things together while also feeling the helplessness of
            not knowing what would actually help.
          </p>
          <p className="mt-5">
            Meditation was the practice that changed the direction of their lives. Not as magic, and
            not as a substitute for care, but as a practical way to help the nervous system regulate.
            Within weeks, they saw enough change to make the work impossible to ignore. What started
            in a tiny studio apartment in Sydney became a decade of teaching, retreats, courses, and
            community.
          </p>
        </div>
      </Section>

      <Section title="What he learned">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Chris learned that people can look fine from the outside while their body is still
            bracing. He learned that practical, secular tools can help people notice what is
            happening inside them without turning the work into a performance or a personality
            project.
          </p>
          <p className="mt-5">
            Now Off Duty brings that same lens to retirement. A person can have enough money, a
            good plan, and a life they worked hard to create, while still feeling restless, guilty,
            unsafe spending, or unsure who they are without the old structure.
          </p>
        </div>
      </Section>

      <Section title="Credentials and training">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            The source material for this build identifies Chris as co-founder of Mindspo, co-host of
            the Mindspo podcast, the operational and strategic force behind the brand, and the lead
            for the Business Fundamentals track of the Mindspo Teacher Certification.
          </p>
          <p className="mt-5">
            Chris's formal meditation teaching certifications and specific nervous system training:
            xxx.
          </p>
        </div>
      </Section>

      <Section title="What this is, and what it is not">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              This is
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "Coaching and education for the emotional and nervous system side of retirement.",
                  "A practical way to understand patterns like spending anxiety, work-mode tension, identity loss, and lack of ease.",
                  "A grounded program for capable adults who want to feel more settled in the chapter they worked hard to reach.",
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              This is not
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "Therapy, diagnosis, medical treatment, or a substitute for mental health care.",
                  "Financial advice, investment advice, or a replacement for your financial planner.",
                  "A crisis service or emergency mental health resource.",
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Who the program is designed for">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              Designed for
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "People who are near retirement or already retired.",
                  "People who planned the financial side and still feel unsettled, tense, guilty, restless, or cautious.",
                  "People who want practical tools without being talked down to.",
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[30px]" style={{ color: colors.ink }}>
              Not designed for
            </h3>
            <div className="mt-4">
              <BulletList
                items={[
                  "People seeking clinical treatment, diagnosis, or crisis care.",
                  "People seeking financial planning, investment advice, or retirement income strategy.",
                  "People who want a miracle claim instead of steady practice.",
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <DisclaimerBox />
      </Section>
    </SiteShell>
  );
}
