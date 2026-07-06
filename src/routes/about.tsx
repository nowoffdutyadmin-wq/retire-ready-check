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
      <PageIntro
        eyebrow="ABOUT CHRIS"
        title="A practical guide for the part of retirement no one plans for."
      >
        <p>
          Chris Soll is the co-founder of Mindspo, a global meditation education brand built from
          lived experience. Before building Mindspo, he spent his twenties in corporate project
          management, including work for the Australian Department of Education, where he saw how
          easily capable people can become fused with structure, responsibility, and the next thing
          to solve.
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
            achieve, lead, solve, and carry responsibility. The program is built for people who
            spent decades being competent, and who want the same clear-eyed approach applied to the
            part of retirement that competence alone does not resolve.
          </p>
        </div>
      </Section>

      <Section title="What happened">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Mindspo began after Chris and Rochelle Fox went through a difficult period in their
            early twenties that forced them to look closely at attention, daily practice, and the
            way a person's inner life shapes the way they move through the world. They tried
            conventional support, routines, and every late-night answer they could find. Chris was
            often the one holding things together while also wondering what would actually help.
          </p>
          <p className="mt-5">
            Meditation became the practical doorway. Not as magic, and not as a substitute for care,
            but as a way to build presence, steadiness, and a different relationship with the mind.
            Within weeks, they had enough lived evidence to make the work impossible to ignore. What
            started in a tiny studio apartment in Sydney became a decade of teaching, retreats,
            courses, and community.
          </p>
        </div>
      </Section>

      <Section title="What he learned">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Chris learned that people can look fine from the outside while their inner life is
            louder than they would ever say out loud. He learned that practical, secular tools can
            help people notice what is happening inside them without turning the work into a
            performance or a personality project.
          </p>
          <p className="mt-5">
            Now Off Duty brings that same lens to retirement. A person can have enough money, a good
            plan, and a life they worked hard to create, while still wondering how to spend,
            structure the week, relate to their old role, or enjoy open time without turning it into
            another project.
          </p>
        </div>
      </Section>

      <Section title="Credentials and training">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Chris is the co-founder of Mindspo, co-host of the Mindspo podcast, the operational and
            strategic force behind the brand, and the lead for the Business Fundamentals track of
            the Mindspo Teacher Certification.
          </p>
        </div>
      </Section>

      <Section title="Who the program is designed to serve most">
        <div className="max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
          <p>
            Now Off Duty is for capable people within five years of retirement, or in the early
            years of it, who handled the financial planning and still want a grounded way to meet
            the shift in structure, identity, spending, and daily rhythm.
          </p>
          <div className="mt-5">
            <BulletList
              items={[
                "People who want practical tools without being talked down to.",
                "People who feel the next chapter should be clearer and easier to inhabit.",
                "People who want Chris's direct, grounded guidance in a small-group setting.",
              ]}
            />
          </div>
        </div>
      </Section>

      <Section>
        <DisclaimerBox />
      </Section>
    </SiteShell>
  );
}
