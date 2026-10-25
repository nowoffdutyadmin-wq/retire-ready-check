import { createFileRoute } from "@tanstack/react-router";
import { EditorialLegalPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Now Off Duty" },
      {
        name: "description",
        content: "Contact Now Off Duty.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <EditorialLegalPage
      eyebrow="Contact"
      title="Reach a real person."
      intro={
        <p>
          Questions about the training, the program, billing, or whether this is the right fit can
          be sent through the support channel included with your registration or purchase.
        </p>
      }
    >
      <section>
        <h2>How we can help</h2>
        <p>
          Tell us what you need and include the email address used to register. We will review your
          message and reply with the next useful step.
        </p>
      </section>
    </EditorialLegalPage>
  );
}
