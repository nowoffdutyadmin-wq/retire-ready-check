import { createFileRoute } from "@tanstack/react-router";
import { colors, PageIntro, Section, site, SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Now Off Duty" },
      {
        name: "description",
        content: "Contact details, business name, response hours, and support information.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteShell>
      <PageIntro eyebrow="CONTACT" title="Reach a real person.">
        <p>
          Questions about the quiz, the program, billing, or whether this is the right fit can be
          sent to the contact details below.
        </p>
      </PageIntro>

      <Section narrow>
        <div
          className="grid gap-4 rounded-[8px] p-6 text-[18px] leading-[1.65]"
          style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}`, color: colors.inkSoft }}
        >
          <div>
            <strong style={{ color: colors.ink }}>Business name:</strong> {site.businessName}
          </div>
          <div>
            <strong style={{ color: colors.ink }}>Email:</strong>{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
          <div>
            <strong style={{ color: colors.ink }}>Phone:</strong> {site.phone}
          </div>
          <div>
            <strong style={{ color: colors.ink }}>Response hours:</strong> {site.responseHours}
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
