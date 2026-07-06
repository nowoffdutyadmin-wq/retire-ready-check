import { useState } from "react";

const C = {
  bg: "#F7F3ED",
  card: "#FFFFFF",
  ink: "#1C1917",
  body: "#44403C",
  muted: "#5C6B6A",
  sage: "#5B8F85",
  sageSoft: "#E8EEF0",
  rule: "#D4E2E0",
  cta: "#C2440E",
};

const fontSans = "DM Sans, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const fontSerif = "Playfair Display, Georgia, serif";
const calendlyUrl = "https://calendly.com/nowoffduty/30-minute-call";

function pageStyle(center = false): React.CSSProperties {
  return {
    minHeight: "100vh",
    background: C.bg,
    color: C.ink,
    fontFamily: fontSans,
    padding: center ? "48px 24px 28px" : "26px 20px 28px",
    display: center ? "grid" : undefined,
    alignContent: center ? "center" : undefined,
  };
}

function wrapStyle(max = 640): React.CSSProperties {
  return { width: "min(100%, " + max + "px)", margin: "0 auto" };
}

function BrandMark() {
  return (
    <p
      style={{
        margin: "0 0 22px",
        color: C.muted,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 2,
        lineHeight: 1.2,
        textTransform: "uppercase",
      }}
    >
      Now Off Duty
    </p>
  );
}

function Label({ children, sage = false }: { children: React.ReactNode; sage?: boolean }) {
  return (
    <p
      style={{
        margin: "0 0 10px",
        color: sage ? C.sage : C.muted,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.6,
        lineHeight: 1.3,
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function Headline({ children, offer = false }: { children: React.ReactNode; offer?: boolean }) {
  return (
    <h1
      style={{
        margin: 0,
        color: C.ink,
        fontFamily: fontSerif,
        fontSize: offer ? "clamp(32px, 8vw, 42px)" : "clamp(34px, 8vw, 44px)",
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.08,
      }}
    >
      {children}
    </h1>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "16px 0 0", color: C.muted, fontSize: 18, lineHeight: 1.6 }}>{children}</p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.card,
        border: "1px solid " + C.rule,
        borderRadius: 12,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PhotoPlaceholder({ circle = false }: { circle?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Chris Soll photo placeholder"
      style={{
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        width: circle ? 80 : "100%",
        height: circle ? 80 : undefined,
        minHeight: circle ? undefined : 280,
        borderRadius: circle ? 999 : 8,
        background: "linear-gradient(145deg, #E8EEF0, #D4E2E0)",
        color: C.muted,
        fontSize: circle ? 18 : 20,
        fontWeight: 600,
      }}
    >
      {circle ? "CS" : "Chris photo"}
    </div>
  );
}

function ChrisCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card>
      {/* DYNAMIC: replace this placeholder with Chris Soll's approved photo before going live */}
      <PhotoPlaceholder />
      <h2 style={{ margin: "18px 0 0", color: C.ink, fontFamily: fontSerif, fontSize: 20 }}>
        Chris Soll
      </h2>
      <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 14, lineHeight: 1.45 }}>
        Practice Teacher · Co-founder, Mindspo
      </p>
      <p style={{ margin: "16px 0 0", color: C.body, fontSize: 15, lineHeight: 1.65 }}>
        {compact
          ? "Chris Soll is the co-founder of Mindspo and the guide behind Now Off Duty. He works with people who have built full lives and are ready for this chapter to feel steadier, calmer, and more like theirs."
          : "I've spent ten years helping people understand what's happening on their inside — and teaching them one practice that changes it. This session is built around something I've watched work more times than I can count. I'm looking forward to sharing it with you."}
      </p>
    </Card>
  );
}

function MinimalFooter({ contact = false }: { contact?: boolean }) {
  return (
    <footer
      style={{ marginTop: 42, color: C.muted, fontSize: 12, lineHeight: 1.7, textAlign: "center" }}
    >
      <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
        Privacy Policy
      </a>{" "}
      ·{" "}
      <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>
        Terms
      </a>
      {contact ? (
        <>
          {" "}
          ·{" "}
          <a href="/contact" style={{ color: "inherit", textDecoration: "none" }}>
            Contact
          </a>
        </>
      ) : (
        <> · Unsubscribe</>
      )}
      <br />© Now Off Duty {new Date().getFullYear()}
    </footer>
  );
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        width: "100%",
        minHeight: 56,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: C.cta,
        color: "#fff",
        fontSize: 17,
        fontWeight: 500,
        lineHeight: 1.2,
        padding: "15px 20px",
        textAlign: "center",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

export function WebinarRegistrationPage() {
  const [registered, setRegistered] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: formData.get("firstName"),
      email: formData.get("email"),
      source: "now-off-duty-webinar-registration",
    };
    const emailPlatformEndpoint = "";
    // TODO: replace with actual email platform API endpoint and required list/tag payload.
    // DYNAMIC: replace with Zoom/webinar automation that sends the attendee link after registration.
    if (emailPlatformEndpoint) {
      await fetch(emailPlatformEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setRegistered(true);
    window.setTimeout(() => {
      window.location.href = "/confirmation";
    }, 900);
  }

  return (
    <main style={pageStyle()}>
      <div style={wrapStyle()}>
        <BrandMark />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px minmax(0, 1fr)",
            gap: 14,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {/* DYNAMIC: replace this placeholder with Chris Soll's approved headshot before going live */}
          <PhotoPlaceholder circle />
          <div>
            <p style={{ margin: 0, color: C.ink, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
              Chris Soll
            </p>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13, lineHeight: 1.45 }}>
              Practice Teacher &amp; Retirement Transition Coach
            </p>
          </div>
        </div>

        <Headline>
          What your financial advisor never covered — and why retirement still doesn't feel the way
          you planned.
        </Headline>
        <Subhead>
          A free 60-minute online training where you'll discover the one missing piece — and feel
          the difference yourself before the hour is up.
        </Subhead>

        <section style={{ marginTop: 34 }}>
          <Card style={{ padding: 20 }}>
            <Label sage>Free Online Training</Label>
            <p
              style={{
                margin: 0,
                color: C.ink,
                fontFamily: fontSerif,
                fontSize: 20,
                lineHeight: 1.25,
              }}
            >
              {/* DYNAMIC: replace with confirmed webinar date before going live */}
              Date to be announced
            </p>
            <p style={{ margin: "8px 0 0", color: C.ink, fontSize: 16, lineHeight: 1.45 }}>
              {/* DYNAMIC: replace with confirmed webinar time before going live */}
              Time to be announced
            </p>
            <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 14, lineHeight: 1.45 }}>
              <a href="https://www.timeanddate.com/worldclock/" target="_blank" rel="noreferrer">
                Check your timezone →
              </a>
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 34 }}>
          {!registered ? (
            <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
              <input
                name="firstName"
                autoComplete="given-name"
                placeholder="Your first name"
                style={fieldStyle()}
              />
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                style={fieldStyle()}
              />
              <button type="submit" style={buttonStyle()}>
                Save my free spot →
              </button>
              <p style={underButtonStyle()}>
                Free. No credit card. Replay available for 7 days to registered attendees.
              </p>
            </form>
          ) : (
            <Card>
              <h2 style={{ margin: 0, color: C.ink, fontFamily: fontSerif, fontSize: 20 }}>
                You're registered.
              </h2>
              <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
                Check your inbox for your Zoom link and everything you need for the session.
              </p>
              <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 14 }}>
                Add it to your calendar so you don't miss it.
              </p>
            </Card>
          )}
        </section>

        <section style={{ marginTop: 34 }}>
          <Label>In 60 Minutes You'll Learn</Label>
          <CheckList
            items={[
              "Why the calm you expected hasn't arrived — and why that's not your fault",
              "The one thing that's actually in the way — and what to do about it",
              "A simple practice you can try in the session itself — most people feel a shift before we finish",
            ]}
          />
        </section>

        <section style={{ marginTop: 34 }}>
          <ChrisCard />
        </section>

        <MinimalFooter />
      </div>
    </main>
  );
}

export function WebinarConfirmationPage() {
  return (
    <main style={pageStyle(true)}>
      <section style={{ ...wrapStyle(480), textAlign: "center" }}>
        <BrandMark />
        <Headline>You're registered.</Headline>
        <Subhead>
          Check your inbox for your Zoom link and everything you need for the session.
        </Subhead>
        <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
          Add it to your calendar so you don't miss it.
        </p>
        <div style={dividerStyle()} />
        <p
          style={{ margin: 0, color: C.body, fontSize: 16, fontStyle: "italic", lineHeight: 1.65 }}
        >
          I'm looking forward to having you there. Set aside the full hour, and come as you are.
        </p>
        <p style={{ margin: "12px 0 0", color: C.ink, fontSize: 16 }}>— Chris</p>
        <MinimalFooter />
      </section>
    </main>
  );
}

export function OfferPage() {
  return (
    <main style={pageStyle()}>
      <div style={wrapStyle(760)}>
        <BrandMark />
        <Label>The Calm Retirement Program</Label>
        <Headline offer>
          Four weeks to build the practice that makes the rest of this chapter feel the way you
          planned.
        </Headline>
        <Subhead>
          A small-group program for people who are done waiting for the calm to arrive on its own.
        </Subhead>

        <section style={{ marginTop: 34 }}>
          <Card>
            <p style={bodyStyle()}>
              Over four weeks, Chris works with a small group of people who've recognised the same
              thing: that the retirement they planned doesn't feel the way they expected, and that
              the standard advice hasn't helped. The program teaches two specific practices — one
              that helps you come off duty, one that quiets the mind — and gives you a structure and
              an accountability partner to make sure they stick. Most people notice a difference
              within the first week. By week four, the practice is simply part of their day.
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 34 }}>
          <Label>What's Included</Label>
          <div style={{ display: "grid", gap: 12 }}>
            <Included title="One 90-minute live session with Chris each week">
              Teaching, guided practice, and open Q&amp;A. Four sessions over four weeks.
            </Included>
            <Included title="Daily guided audio practice">
              10, 20, or 30 minutes — you choose what fits your day. Available any time, on any
              device.
            </Included>
            <Included title="A mid-week check-in from Chris">
              A short voice note each week addressing what the group is noticing. Personal, not
              automated.
            </Included>
            <Included title="An accountability partner and the daily unlock system">
              You'll be paired with someone at a similar stage. Both of you confirm your practice
              each day before the next session unlocks. It's surprisingly hard to let someone else
              down.
            </Included>
            <Included title="Physical rewards through the cohort">
              A handwritten note from Chris in week one. Sealed insight cards for weeks two, three,
              and four. And for the pair with the highest streak at the end: a practice cushion, and
              something even better.
            </Included>
            <Included title="Access to the Practice Club at cohort end">
              Weekly live sessions and a community of people continuing the practice. $49/month —
              and cohort graduates always get first access.
            </Included>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <Card>
            <Label>The Investment</Label>
            <p
              style={{
                margin: 0,
                color: C.cta,
                fontFamily: fontSerif,
                fontSize: 38,
                lineHeight: 1.05,
              }}
            >
              $1,199
            </p>
            <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 14, lineHeight: 1.5 }}>
              Founding cohort pricing. Four weeks. Full access. Everything listed above.
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 34 }}>
          <Card style={{ border: 0, borderLeft: "3px solid " + C.sage }}>
            <p style={{ margin: 0, color: C.body, fontSize: 16, lineHeight: 1.65 }}>
              If you attend all four live sessions and complete the daily practice and notice no
              difference, tell us. We'll make it right. No complicated process.
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 34 }}>
          <h2
            style={{
              margin: 0,
              color: C.ink,
              fontFamily: fontSerif,
              fontSize: 24,
              fontWeight: 400,
            }}
          >
            Find out if this is right for you.
          </h2>
          <p style={{ margin: "12px 0 0", color: C.muted, fontSize: 16, lineHeight: 1.6 }}>
            The next step is a 30-minute call. It's a conversation — not a pitch. We'll figure out
            together whether this program makes sense for where you are.
          </p>
          <p style={{ margin: "18px 0 0" }}>
            {/* DYNAMIC: replace with live Calendly booking URL before going live */}
            {/* TODO: plug in the live Calendly URL for the Now Off Duty — 30 Minute Call event */}
            <CtaLink href={calendlyUrl}>Book your 30-minute call →</CtaLink>
          </p>
          <p style={underButtonStyle()}>
            Spots are limited. Founding cohort pricing won't be available after the first two
            intakes.
          </p>
        </section>

        <section style={{ marginTop: 34 }}>
          <ChrisCard compact />
        </section>

        <MinimalFooter contact />
      </div>
    </main>
  );
}

export function CallConfirmedPage() {
  return (
    <main style={pageStyle(true)}>
      <section style={{ ...wrapStyle(480), textAlign: "center" }}>
        <BrandMark />
        <Headline>You're booked.</Headline>
        <Subhead>
          Check your inbox — you'll get a confirmation with everything you need for the call.
        </Subhead>
        <div style={dividerStyle()} />
        <p
          style={{ margin: 0, color: C.body, fontSize: 16, fontStyle: "italic", lineHeight: 1.65 }}
        >
          "I'm looking forward to the conversation. Come with whatever's on your mind — there's no
          agenda from my side other than figuring out if this is actually right for you."
        </p>
        <p style={{ margin: "12px 0 0", color: C.ink, fontSize: 16 }}>— Chris</p>
        <div
          style={{
            marginTop: 28,
            borderRadius: 10,
            background: C.sageSoft,
            padding: 20,
            textAlign: "left",
          }}
        >
          <Label>Before The Call</Label>
          <ul
            style={{
              display: "grid",
              gap: 10,
              margin: 0,
              paddingLeft: 18,
              color: C.body,
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            <li>You'll receive a confirmation email with your Zoom link shortly.</li>
            <li>The call is 30 minutes. Come as you are — no preparation needed.</li>
            <li>If you need to reschedule, use the link in your confirmation email.</li>
          </ul>
        </div>
        <footer
          style={{
            marginTop: 42,
            color: C.muted,
            fontSize: 12,
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          © Now Off Duty {new Date().getFullYear()} ·{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
            Privacy Policy
          </a>
        </footer>
      </section>
    </main>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul style={{ display: "grid", gap: 14, margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            display: "grid",
            gridTemplateColumns: "22px minmax(0, 1fr)",
            gap: 10,
            color: C.ink,
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          <span style={{ color: C.sage }} aria-hidden>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Included({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "28px minmax(0, 1fr)",
        gap: 12,
        border: "1px solid " + C.rule,
        borderRadius: 10,
        background: C.card,
        padding: 18,
      }}
    >
      <span style={{ color: C.sage, fontSize: 22, lineHeight: 1 }} aria-hidden>
        •
      </span>
      <div>
        <h3 style={{ margin: 0, color: C.ink, fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>
          {title}
        </h3>
        <p style={{ margin: "7px 0 0", color: C.muted, fontSize: 15, lineHeight: 1.55 }}>
          {children}
        </p>
      </div>
    </article>
  );
}

function fieldStyle(): React.CSSProperties {
  return {
    width: "100%",
    height: 52,
    border: "1px solid " + C.rule,
    borderRadius: 8,
    background: "#fff",
    color: C.ink,
    fontSize: 16,
    padding: "0 14px",
  };
}

function buttonStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 56,
    border: 0,
    borderRadius: 8,
    background: C.cta,
    color: "#fff",
    cursor: "pointer",
    fontSize: 17,
    fontWeight: 500,
  };
}

function underButtonStyle(): React.CSSProperties {
  return {
    margin: "10px 0 0",
    color: C.muted,
    fontSize: 13,
    lineHeight: 1.45,
    textAlign: "center",
  };
}

function bodyStyle(): React.CSSProperties {
  return { margin: 0, color: C.body, fontSize: 16, lineHeight: 1.75 };
}

function dividerStyle(): React.CSSProperties {
  return { width: "100%", height: 1, margin: "28px 0", background: C.rule };
}
