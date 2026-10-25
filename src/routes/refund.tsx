import { createFileRoute } from "@tanstack/react-router";
import { EditorialLegalPage } from "../components/editorial-funnel";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Guarantee Policy — Now Off Duty" },
      {
        name: "description",
        content: "Short, plain-language refund and guarantee policy.",
      },
    ],
  }),
  component: Refund,
});

function Refund() {
  return (
    <EditorialLegalPage
      eyebrow="Refund & Guarantee Policy"
      title="Simple 30-day refund."
      intro={<p>If it does not help, contact us within 30 days. Full refund, no questions.</p>}
    >
      <section>
        <h2>How to request a refund</h2>
        <p>
          Contact support within 30 days of purchase using the purchase email address or the support
          channel shown at checkout.
        </p>
        <p>
          Refunds are intended for the Off-Duty Reset digital program. If a different product or
          service is sold later, its checkout page should state whether this same policy applies.
        </p>
      </section>
    </EditorialLegalPage>
  );
}
