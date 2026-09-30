import { ClipboardCheck, Clock3, MessageCircle, Repeat2, Users, Video } from "lucide-react";
import { useState } from "react";
import { formattedCohortPrice, webinarFunnelConfig } from "../lib/webinar-funnel-config";
import "./webinar-funnel.css";

type FormErrors = {
  email?: string;
  form?: string;
};

function Brand() {
  return (
    <a className="funnel-brand" href="/" aria-label="Now Off Duty home">
      Now Off Duty
    </a>
  );
}

function ChrisHeadshot({ loading = "lazy" }: { loading?: "eager" | "lazy" }) {
  const headshotUrl = webinarFunnelConfig.assets.chrisHeadshotUrl;

  if (headshotUrl) {
    return (
      <img
        className="funnel-headshot"
        src={headshotUrl}
        alt="Chris Soll"
        width="112"
        height="112"
        loading={loading}
        decoding="async"
      />
    );
  }

  {
    /* TODO: add Chris Soll's approved, compressed headshot URL in config/webinar-funnel.json. */
  }
  return (
    <div className="funnel-monogram" aria-label="Chris Soll">
      CS
    </div>
  );
}

function PresenterIdentity() {
  return (
    <div className="funnel-presenter-line">
      <ChrisHeadshot loading="eager" />
      <div>
        <p className="funnel-presenter-name">Chris Soll</p>
        <p className="funnel-presenter-role">Practice Teacher &amp; Retirement Transition Coach</p>
      </div>
    </div>
  );
}

function PresenterTrust({ compact = false }: { compact?: boolean }) {
  return (
    <section className="funnel-section funnel-trust" aria-labelledby="presenter-trust-heading">
      <ChrisHeadshot />
      <div>
        <p id="presenter-trust-heading" className="funnel-presenter-name">
          Chris Soll
        </p>
        <p className="funnel-presenter-role">Practice Teacher · Co-founder, Mindspo</p>
        <p className="funnel-trust-copy">
          {compact
            ? "Chris Soll is the co-founder of Mindspo and the guide behind Now Off Duty. He works with people who have built full lives and are ready for this chapter to feel steadier, calmer, and more like theirs."
            : "I've spent ten years helping people understand what's happening on their inside — and teaching them one practice that changes it. This session is built around something I've watched work more times than I can count. I'm looking forward to sharing it with you."}
        </p>
      </div>
    </section>
  );
}

function FunnelFooter() {
  return (
    <footer className="funnel-footer">
      <nav className="funnel-footer-links" aria-label="Legal links">
        <a href="/privacy">Privacy Policy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/contact">Contact</a>
        <span aria-hidden="true">·</span>
        <a href="/disclaimer">Important Disclaimer</a>
      </nav>
      <p className="funnel-footer-disclaimer">
        Now Off Duty provides educational and informational content for the retirement transition.
        It is not a substitute for professional financial, medical, psychological, legal, tax, or
        investment advice.
      </p>
      <p className="funnel-footer-copyright">© Now Off Duty 2026</p>
    </footer>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p className="funnel-field-error" id={id}>
      {children}
    </p>
  );
}

function ConfigurationNote({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.DEV) return null;
  return (
    <p className="funnel-config-note" role="note">
      Configuration needed: {children}
    </p>
  );
}

function OptInForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const endpoint = webinarFunnelConfig.integrations.emailWebhookUrl;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setErrors({ email: "Enter your email address." });
      return;
    }

    if (!emailInput.validity.valid) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    if (!endpoint) {
      try {
        window.localStorage.setItem(
          "now-off-duty:free-video-optin",
          JSON.stringify({
            email,
            tag: "free-video-optin",
            submittedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Local storage may be unavailable in private browsing. The confirmation redirect still works.
      }
      window.location.assign("/confirmed");
      return;
    }

    try {
      // TODO: replace emailWebhookUrl with the approved ConvertKit or ActiveCampaign form endpoint.
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tags: ["free-video-optin"],
          source: "now-off-duty-free-video-optin",
        }),
      });

      if (!response.ok) throw new Error(`Opt-in request failed with ${response.status}`);
      window.location.assign("/confirmed");
    } catch {
      setSubmitting(false);
      setErrors({ form: "We could not send the session yet. Please try again." });
    }
  }

  return (
    <form className="funnel-form funnel-card funnel-form-card" onSubmit={submit} noValidate>
      <div className="funnel-field-group">
        <label className="funnel-label" htmlFor="free-session-email">
          Email address
        </label>
        <input
          className="funnel-input"
          id="free-session-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your@email.com"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "free-session-email-error" : undefined}
        />
        <FieldError id="free-session-email-error">{errors.email}</FieldError>
      </div>
      {errors.form && (
        <p className="funnel-form-error" role="alert">
          {errors.form}
        </p>
      )}
      <button className="funnel-button" type="submit" disabled={submitting}>
        {submitting ? "SENDING..." : "Send me the free session →"}
      </button>
      <p className="funnel-reassurance">Free. No credit card. Unsubscribe any time.</p>
      {!endpoint && (
        <ConfigurationNote>
          connect the approved email platform webhook before publishing. Preview submissions are
          stored locally and redirected to confirmation.
        </ConfigurationNote>
      )}
    </form>
  );
}

export function OptInPage() {
  return (
    <main className="funnel-page">
      <div className="funnel-shell">
        <Brand />
        <PresenterIdentity />

        <header className="funnel-hero funnel-section">
          <h1 className="funnel-headline">
            You prepared the finances. Here is the part almost nobody prepares for.
          </h1>
          <p className="funnel-subhead">
            A free 35-minute session. Watch it once. Most people notice something shift before it
            ends.
          </p>
          <section
            className="funnel-section funnel-section--tight"
            aria-label="Free session signup"
          >
            <OptInForm />
          </section>
        </header>

        <section className="funnel-section" aria-labelledby="session-covers-heading">
          <p id="session-covers-heading" className="funnel-section-kicker">
            What the session covers
          </p>
          <div className="funnel-objections">
            <article className="funnel-objection">
              <h2>Why the calm you expected hasn't arrived, and what's actually behind it</h2>
            </article>
            <article className="funnel-objection">
              <h2>The one thing that's in the way, and what to do about it</h2>
            </article>
            <article className="funnel-objection">
              <h2>
                A practice you can use in the session itself. Most people notice a shift before the
                hour is up.
              </h2>
            </article>
          </div>
        </section>

        <PresenterTrust />
        <FunnelFooter />
      </div>
    </main>
  );
}

export function ConfirmedPage() {
  return (
    <main className="funnel-page">
      <section className="funnel-shell funnel-shell--centered">
        <div style={{ textAlign: "center" }}>
          <Brand />
          <h1 className="funnel-headline funnel-headline--compact">Check your inbox.</h1>
          <p className="funnel-subhead">
            The session is on its way to you now. Give it a minute to arrive — and check your spam
            folder if you don't see it.
          </p>
          <p className="funnel-body-copy">
            Set aside 35 minutes when you find it. Somewhere quiet. Headphones if you have them.
          </p>
          <p className="funnel-note">I'm looking forward to hearing what you notice.</p>
          <p className="funnel-signature">— Chris</p>
        </div>
        <FunnelFooter />
      </section>
    </main>
  );
}

type IncludedItemProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function IncludedItem({ icon, title, children }: IncludedItemProps) {
  return (
    <article className="funnel-included">
      <span className="funnel-included-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </article>
  );
}

function PaymentAction() {
  const paymentUrl = webinarFunnelConfig.integrations.stripePaymentUrl || "#payment-link";

  return (
    <>
      {/* TODO: replace #payment-link with the approved Stripe payment link before publishing. */}
      <a className="funnel-button" href={paymentUrl}>
        Join the next cohort →
      </a>
      {!webinarFunnelConfig.integrations.stripePaymentUrl && (
        <ConfigurationNote>
          connect the approved Stripe payment link before publishing.
        </ConfigurationNote>
      )}
    </>
  );
}

export function JoinPage() {
  return (
    <main className="funnel-page">
      <div className="funnel-shell funnel-shell--wide">
        <Brand />

        <header className="funnel-hero funnel-section">
          <p className="funnel-eyebrow">The Calm Retirement Program</p>
          <h1 className="funnel-headline funnel-headline--offer">
            Four weeks to build the practice that makes the rest of this chapter feel the way you
            planned.
          </h1>
          <p className="funnel-subhead">
            A small group. Live sessions with Chris. A practice that sticks.
          </p>
        </header>

        <section
          className="funnel-section funnel-card"
          aria-labelledby="program-description-heading"
        >
          <h2 id="program-description-heading" className="funnel-intro-lead">
            The program in four weeks
          </h2>
          <p className="funnel-body-copy">
            Over four weeks, Chris works with a small group of people who've recognised the same
            thing: that the retirement they planned doesn't feel the way they expected, and that the
            standard advice has fallen short of the actual transition.
          </p>
          <p className="funnel-body-copy">
            The program teaches two specific practices — one that helps the body release tension
            it's been holding for decades, one that quiets the mind. You'll have a structure, an
            accountability partner, and Chris live every week to make sure both stick.
          </p>
          <p className="funnel-body-copy">
            Most people notice a difference within the first week. By week four, the practice is
            simply part of their day.
          </p>
        </section>

        <section className="funnel-section" aria-labelledby="included-heading">
          <p className="funnel-section-kicker">What's included</p>
          <div className="funnel-card funnel-included-list">
            <IncludedItem
              icon={<Video size={20} />}
              title="One 90-minute live session with Chris each week"
            >
              Teaching, guided practice, and open Q&amp;A. Four sessions over four weeks.
            </IncludedItem>
            <IncludedItem icon={<Clock3 size={20} />} title="Daily guided audio practice">
              10, 20, or 30 minutes — you choose what fits your day. Available any time, on any
              device.
            </IncludedItem>
            <IncludedItem icon={<MessageCircle size={20} />} title="A mid-week check-in from Chris">
              A short voice note each week from Chris, addressed to what the group is actually
              experiencing.
            </IncludedItem>
            <IncludedItem
              icon={<Users size={20} />}
              title="An accountability partner and the daily unlock system"
            >
              You'll be paired with someone at a similar stage. Both of you confirm your practice
              each day before the next session unlocks. It's surprisingly hard to let someone else
              down.
            </IncludedItem>
            <IncludedItem
              icon={<ClipboardCheck size={20} />}
              title="Physical rewards through the cohort"
            >
              A handwritten note from Chris in week one. Sealed insight cards for weeks two, three,
              and four. And for the pair with the highest streak: a practice cushion, chosen and
              sent by Chris.
            </IncludedItem>
            <IncludedItem
              icon={<Repeat2 size={20} />}
              title="Access to the Practice Club at cohort end"
            >
              Weekly live sessions and a community of people continuing the practice. $49/month,
              with first access reserved for cohort graduates.
            </IncludedItem>
          </div>
        </section>

        <section
          className="funnel-section funnel-card funnel-founding-box"
          aria-labelledby="investment-heading"
        >
          <p className="funnel-section-kicker">The investment</p>
          <h2 id="investment-heading" className="funnel-price">
            {formattedCohortPrice}
          </h2>
          <p className="funnel-price-note">Four weeks. Full access. Everything listed above.</p>
          <div className="funnel-section funnel-section--tight">
            <PaymentAction />
            <p className="funnel-under-button">Questions? Reply to any email we've sent you.</p>
          </div>
        </section>

        <section className="funnel-section" aria-labelledby="guarantees-heading">
          <p id="guarantees-heading" className="funnel-section-kicker">
            The guarantees
          </p>
          <div className="funnel-offer-reasons">
            <article className="funnel-offer-reason">
              <h2>7-day refund</h2>
              <p>
                If you join and decide within the first 7 days it's not right for you, just let us
                know. Full refund. No questions.
              </p>
            </article>
            <article className="funnel-offer-reason">
              <h2>Four-week practice promise</h2>
              <p>
                If you attend all four live sessions, complete the daily practice, and notice no
                shift in how you sleep or how your mind settles by week four — tell us. We'll make
                it right.
              </p>
            </article>
          </div>
        </section>

        <PresenterTrust compact />
        <FunnelFooter />
      </div>
    </main>
  );
}

export function WelcomePage() {
  return (
    <main className="funnel-page">
      <section className="funnel-shell funnel-shell--centered">
        <div style={{ textAlign: "center" }}>
          <Brand />
          <h1 className="funnel-headline funnel-headline--compact">You're in.</h1>
          <p className="funnel-subhead">
            Welcome to the cohort. Check your inbox — you'll receive everything you need to get
            started, including the date and Zoom link for the first session.
          </p>
          <p className="funnel-body-copy">
            If you have any questions before we begin, just reply to any email we've sent you.
          </p>
          <p className="funnel-note">I'm genuinely looking forward to this one.</p>
          <p className="funnel-signature">— Chris</p>
        </div>
        <FunnelFooter />
      </section>
    </main>
  );
}
