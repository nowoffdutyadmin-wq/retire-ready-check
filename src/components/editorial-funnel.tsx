import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { commonCountryCodes, otherCountryCodes } from "../lib/country-codes";
import { formattedCohortPrice, webinarFunnelConfig } from "../lib/webinar-funnel-config";
import "./editorial-funnel.css";

type PlaceholderVariant = "hero" | "worksheet" | "chris" | "group";

function FunnelAnnouncement() {
  const { primary, secondary } = webinarFunnelConfig.announcement;

  return (
    <div className="editorial-announcement" role="status">
      <strong>{primary}</strong>
      <span>{secondary}</span>
    </div>
  );
}

const homeNavItems = [
  { href: "#program", label: "Program" },
  { href: "#the-week", label: "The Week" },
  { href: "/join#investment", label: "Investment" },
  { href: "/join#join-now", label: "Join Now" },
];

const offerNavItems = [
  { href: "#program", label: "Program" },
  { href: "#the-week", label: "The Week" },
  { href: "#investment", label: "Investment" },
  { href: "#join-now", label: "Join Now" },
];

function FunnelNav({ offer = false }: { offer?: boolean }) {
  const items = offer ? offerNavItems : homeNavItems;

  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const localItems = items.filter((item) => item.href.startsWith("#"));
    const targets = localItems
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((target): target is HTMLElement => Boolean(target));

    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveHref("#" + visible[0].target.id);
      },
      { rootMargin: "-16% 0px -62% 0px", threshold: [0, 0.2, 0.5] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    setActiveHref(href);
    window.history.replaceState(null, "", href);
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <nav className="editorial-sticky-nav" aria-label="Page sections">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          aria-current={activeHref === item.href ? "location" : undefined}
          onClick={(event) => handleClick(event, item.href)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function FunnelFooter() {
  return (
    <footer className="editorial-footer">
      <div className="editorial-container editorial-footer-inner">
        <div>
          <div className="editorial-footer-brand">Now Off Duty</div>
          <p>
            Now Off Duty provides education and practice, not medical or psychological treatment. If
            you are in crisis, please contact a mental health professional or your local crisis line.
          </p>
        </div>
        <nav className="editorial-footer-links" aria-label="Legal links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/refund">Refund Policy</a>
          <a href="/disclaimer">Important Disclaimer</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

function FunnelHeader({ offer = false }: { offer?: boolean }) {
  const trainingHref = "/training";
  const programHref = offer ? "#program" : "/#path";

  return (
    <header className="editorial-header">
      <div className="editorial-container editorial-header-inner">
        <a className="editorial-header-brand" href="/">
          Now Off Duty
        </a>
        <nav className="editorial-header-links" aria-label="Primary navigation">
          <a href="/about">About</a>
          <a href={programHref}>The Program</a>
          <a href={trainingHref}>Free Training</a>
        </nav>
        <a className="editorial-header-cta" href={trainingHref}>
          Join Now
        </a>
      </div>
    </header>
  );
}

export function FunnelShell({
  children,
  offer = false,
  showNav = true,
}: {
  children: ReactNode;
  offer?: boolean;
  showNav?: boolean;
}) {
  return (
    <main className="editorial-funnel">
      <FunnelAnnouncement />
      <FunnelHeader offer={offer} />
      {children}
      <FunnelFooter />
      {showNav && <FunnelNav offer={offer} />}
    </main>
  );
}

export function EditorialLegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <FunnelShell showNav={false}>
      <section className="editorial-legal-page">
        <div className="editorial-container editorial-container--narrow">
          <p className="editorial-kicker">{eyebrow}</p>
          <h1 className="editorial-page-title">{title}</h1>
          <div className="editorial-copy editorial-legal-intro">{intro}</div>
          <div className="editorial-legal-content">{children}</div>
        </div>
      </section>
    </FunnelShell>
  );
}

function PlaceholderFrame({
  label,
  note,
  variant,
}: {
  label: string;
  note: string;
  variant: PlaceholderVariant;
}) {
  return (
    <div
      className={"editorial-placeholder editorial-placeholder--" + variant}
      role="img"
      aria-label={label}
    >
      <div className="editorial-placeholder-copy">
        <span>Approved asset placeholder</span>
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
    </div>
  );
}

function trainingSchedule() {
  const { date, time, timezone } = webinarFunnelConfig.webinar;
  if (date && time) return `${date} · ${time}${timezone ? ` ${timezone}` : ""}`;
  return "Next live training date to be confirmed";
}

function TrainingRegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const endpoint = webinarFunnelConfig.integrations.emailWebhookUrl;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = firstName.trim();
    const value = email.trim();

    if (!name || name.length > 100) {
      setError("Please enter your first name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    const submission = {
      firstName: name,
      email: value,
      tag: "free-training-registration",
      submittedAt: new Date().toISOString(),
    };

    if (!endpoint) {
      try {
        window.localStorage.setItem(
          "now-off-duty:free-training-registration",
          JSON.stringify(submission),
        );
      } catch {
        // Preview mode must still reach the confirmation page if storage is unavailable.
      }
      window.location.assign("/thank-you");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submission,
          tags: ["free-training-registration"],
          source: "now-off-duty-training-page",
        }),
      });

      if (!response.ok) throw new Error("Registration request failed");
      window.location.assign("/thank-you");
    } catch {
      setSubmitting(false);
      setError("We could not save your seat yet. Please try again.");
    }
  }

  return (
    <form
      className="editorial-training-form"
      id="training-registration-form"
      onSubmit={submit}
      noValidate
    >
      <div className="editorial-training-form-heading">
        <p className="editorial-kicker">Live free training</p>
        <h2 className="editorial-card-title">Save your seat.</h2>
      </div>
      <p className="editorial-training-date">
        <strong>Training date</strong>
        <span>{trainingSchedule()}</span>
      </p>
      <label className="editorial-field-label" htmlFor="training-first-name">
        First name
        <input
          id="training-first-name"
          className="editorial-input"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
            setError("");
          }}
          required
        />
      </label>
      <label className="editorial-field-label" htmlFor="training-email">
        Email
        <input
          id="training-email"
          className="editorial-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          required
        />
      </label>
      <button
        className="editorial-button editorial-button--full"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save My Free Seat"}
      </button>
      <p className="editorial-form-note editorial-form-note--dark">
        Watch from any computer, tablet or phone.
      </p>
      {error && (
        <p className="editorial-form-error editorial-form-error--dark" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function ReminderForm() {
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const endpoint = webinarFunnelConfig.integrations.emailWebhookUrl;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneValue = phone.trim();
    const phoneDigits = phoneValue.replace(/\D/g, "");
    if (!countryCode || phoneDigits.length < 7 || phoneValue.length > 40) {
      setError("Please add a valid phone number and country code.");
      return;
    }

    const reminder = {
      phone: `${countryCode} ${phoneValue}`.trim(),
      phoneLocal: phoneValue,
      phoneCountryCode: countryCode,
      tag: "free-training-reminder",
      submittedAt: new Date().toISOString(),
    };

    if (!endpoint) {
      try {
        window.localStorage.setItem(
          "now-off-duty:free-training-reminder",
          JSON.stringify(reminder),
        );
      } catch {
        // Preview mode still confirms the request if storage is unavailable.
      }
      setSaved(true);
      setError("");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reminder, tags: ["free-training-reminder"] }),
      });
      if (!response.ok) throw new Error("Reminder request failed");
      setSaved(true);
      setError("");
    } catch {
      setError("We could not save the reminder yet. Please try again.");
    }
  }

  return (
    <form className="editorial-reminder-form" onSubmit={submit} noValidate>
      <p className="editorial-form-note editorial-form-note--dark">
        If you&apos;d like a reminder from the Now Off Duty team, add your mobile number here.
      </p>
      <div className="editorial-phone-fields">
        <label className="editorial-field-label" htmlFor="reminder-country-code">
          Country code
          <select
            id="reminder-country-code"
            className="editorial-select"
            value={countryCode}
            onChange={(event) => {
              setCountryCode(event.target.value);
              setError("");
            }}
          >
            <option value="">Choose</option>
            <optgroup label="Most common">
              {commonCountryCodes.map(({ country, code }) => (
                <option key={`${country}-${code}`} value={code}>
                  {country} ({code})
                </option>
              ))}
            </optgroup>
            <optgroup label="All countries and territories">
              {otherCountryCodes.map(({ country, code }) => (
                <option key={`${country}-${code}`} value={code}>
                  {country} ({code})
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="editorial-field-label" htmlFor="reminder-phone">
          Mobile number
          <input
            id="reminder-phone"
            className="editorial-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setError("");
            }}
          />
        </label>
      </div>
      <button className="editorial-button" type="submit">
        {saved ? "Reminder saved" : "Save number"}
      </button>
      {error && (
        <p className="editorial-form-error editorial-form-error--dark" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="editorial-section-header">
      {kicker && <p className="editorial-kicker">{kicker}</p>}
      <h2 className="editorial-section-title">{title}</h2>
      {subtitle && <p className="editorial-section-subtitle">{subtitle}</p>}
    </header>
  );
}

function ChrisPanel({ showHeadshot = true }: { showHeadshot?: boolean }) {
  return (
    <div className="editorial-split">
      {showHeadshot ? (
        <img
          className="editorial-placeholder editorial-placeholder--chris"
          src="/assets/chris-headshot.jpg"
          alt="Chris Soll"
        />
      ) : (
        <PlaceholderFrame
          variant="chris"
          label="Chris Soll"
          note="Approved portrait to be provided"
        />
      )}
      <div>
        <p className="editorial-kicker">Meet your guide, Chris</p>
        <h2 className="editorial-section-title">
          Why <em>I do this.</em>
        </h2>
        <div className="editorial-copy" style={{ marginTop: 28 }}>
          <p>
            Life taught me that mental health isn&apos;t optional, losing my father to suicide was
            an early lesson. Years later, my wife&apos;s deep psychological turmoil led us to try
            meditation and it saved her life. That became the reason we founded Mindspo, our mental
            wellness company, where we&apos;ve spent the last 10 years hosting more than 1,000
            people on retreats and teaching thousands more online.
          </p>
          <p>
            Now I want to serve the generation that carried responsibility the longest and was
            taught the least about how to put it down. You&apos;ve earned this chapter. My job is to
            make sure your body lets you enjoy it.
          </p>
          <a className="editorial-story-link" href="/about">
            Read my full story →
          </a>
        </div>
      </div>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <div className="editorial-check-grid">
      {items.map((item) => (
        <div className="editorial-check-item" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  return (
    <FunnelShell showNav={false}>
      <section className="editorial-hero" id="top">
        <div className="editorial-container">
          <div className="editorial-hero-frame">
            <img
              className="editorial-placeholder editorial-hero-image"
              src="/assets/woman-60s-BebQCtf5.jpg"
              alt="Woman in her sixties sitting comfortably at home"
            />
            <div className="editorial-hero-overlay">
              <h1 className="editorial-hero-title">
                For years you stayed
                <br />
                <em>on duty.</em>
                <br />
                Now, ease into living
                <br />
                <em>off duty.</em>
              </h1>
              <p className="editorial-hero-subtitle">
                Unwinding through meditation for people in or entering retirement. So you can live
                the chapter you&apos;ve earned to the fullest.
              </p>
              <a className="editorial-button" href="/training">
                Join Now
              </a>
              <p className="editorial-trust-line">
                From the founders of Mindspo. 1,000+ retreat guests. Thousands taught worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section" id="program">
        <div className="editorial-container editorial-container--narrow">
          <SectionHeader
            title={
              <>
                Retirement was supposed to feel like peace and quiet.
                <br />
                <span className="editorial-muted-line">So why doesn&apos;t it?</span>
              </>
            }
          />
          <div className="editorial-copy">
            <p>
              You sit down to relax and feel restless within minutes. You wake earlier than you need
              to with your mind already running. You are more irritable than you&apos;d like to
              admit. You have everything you worked for and you can&apos;t quite enjoy it.
            </p>
            <p className="editorial-emphasis">
              If any of this sounds familiar, you&apos;re not alone.
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper" id="mechanism">
        <div className="editorial-container">
          <div className="editorial-mechanism-grid">
            <div>
              <p className="editorial-kicker">Why this happens</p>
              <h2 className="editorial-section-title">
                You gave forty years to the alarm.
                <br />
                Nobody told your body it&apos;s <em>off duty.</em>
              </h2>
            </div>
            <div className="editorial-copy">
              <p>
                For four decades, your nervous system did exactly what your life demanded: stay
                alert, stay responsible, keep going. Deadlines, mortgages, children, bosses and your
                body adapted brilliantly to all of it.
              </p>
              <p className="editorial-emphasis">
                The race is over, but your mind hasn&apos;t stopped racing.
              </p>
              <p>
                The job ending doesn&apos;t magically reset the system. A mind trained for alert
                mode stays in alert mode until it&apos;s trained for something else. Deliberate
                practice over a few weeks keeps the regulation for your nerves. That&apos;s what the
                session addresses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper" id="path">
        <div className="editorial-container">
          <div className="editorial-path-header">
            <p className="editorial-kicker">The path</p>
            <h2 className="editorial-section-title">Three steps to a regulated retirement.</h2>
          </div>
          <div className="editorial-path-grid">
            <article className="editorial-path-step">
              <span className="editorial-path-number">01</span>
              <h3>Feel it for yourself</h3>
              <p>
                Join the free training. You won&apos;t just hear about regulation, you&apos;ll be
                guided through it live, and feel your own system settle in real time.
              </p>
            </article>
            <article className="editorial-path-step">
              <span className="editorial-path-number">02</span>
              <h3>Retrain your nervous system</h3>
              <p>
                Join a small group of people in the same chapter of life for a guided 4–6 week
                program of meditation and regulation practice.
              </p>
            </article>
            <article className="editorial-path-step">
              <span className="editorial-path-number">03</span>
              <h3>Enjoy your crowning chapter</h3>
              <p>
                Calm mornings. Real rest. Presence with the people you love. A daily practice you
                own for the rest of your life.
              </p>
            </article>
          </div>
          <div className="editorial-path-cta">
            <a className="editorial-button" href="/training">
              Start with the Free Training
            </a>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper">
        <div className="editorial-container">
          <ChrisPanel />
        </div>
      </section>

      <section className="editorial-section editorial-section--paper">
        <div className="editorial-container editorial-container--narrow">
          <SectionHeader
            kicker="What people say"
            title={
              <>
                Real words from <em>real people.</em>
              </>
            }
          />
          <div className="editorial-testimonials">
            <blockquote className="editorial-testimonial">
              <p>
                &quot;I thought I was just someone who couldn&apos;t relax. For the first time in
                over a decade, I slept through the night.&quot;
              </p>
              <cite>— Margaret H.</cite>
            </blockquote>
            <blockquote className="editorial-testimonial">
              <p>
                &quot;The racing mind is gone. I&apos;m actually present with my grandkids
                now.&quot;
              </p>
              <cite>— David L.</cite>
            </blockquote>
            <blockquote className="editorial-testimonial">
              <p>
                &quot;This made this so accessible. I feel better than I can ever remember, what a
                gift!&quot;
              </p>
              <cite>— Anne R.</cite>
            </blockquote>
          </div>
          <div className="editorial-proof-stats" aria-label="Mindspo experience">
            <span>1,000+ retreat guests</span>
            <span>Thousands taught through programs</span>
            <span>Founded 2016</span>
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-container editorial-message">
          <SectionHeader
            kicker="A message from Chris"
            title="Two minutes on why the best chapter of your life deserves a calm nervous system."
          />
          <div className="editorial-video-placeholder editorial-video-placeholder--message editorial-vimeo">
            <iframe
              src="https://player.vimeo.com/video/1210002646?dnt=1"
              title="A message from Chris Soll"
              loading="lazy"
              allow="fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a className="editorial-button" href="/training">
            Save My Free Seat
          </a>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper" id="faq">
        <div className="editorial-container">
          <SectionHeader kicker="FAQ" title="Common Questions, Simple Answers" />
          <FAQList />
        </div>
      </section>

      <section className="editorial-final-cta" id="join-now">
        <div className="editorial-container">
          <h2 className="editorial-section-title">
            These years are your reward.
            <br />
            <em>Let&apos;s make sure your body lets you receive them.</em>
          </h2>
          <a className="editorial-button" href="/training">
            Save My Free Seat
          </a>
        </div>
      </section>
    </FunnelShell>
  );
}

export function AboutPage() {
  return (
    <FunnelShell showNav={false}>
      <section className="editorial-section editorial-about-intro">
        <div className="editorial-container editorial-container--narrow">
          <p className="editorial-kicker">About</p>
          <h1 className="editorial-page-title" style={{ marginTop: 18 }}>
            Why I do this <em>work.</em>
          </h1>
          <div className="editorial-copy editorial-about-story">
            <p className="editorial-about-opening">
              <em>When I was just a boy, my father took his own life.</em>
            </p>
            <p>
              I don&apos;t mention that for sympathy, but because it explains why I&apos;ve chosen
              this work. From that day something became permanent in me: mental health isn&apos;t a
              luxury, an afterthought, or something you get to later. It&apos;s fundamental to
              living a life we wish to sustain.
            </p>
            <p>
              I wasn&apos;t always awake to this truth though. Like many I built a career in
              corporate, worked hard with an aim to rise up the ladder, until I burnt out
              completely. With terrible sleep, worse mental health and a deep longing for more I
              walked away from formal employment and never looked back.
            </p>
            <p>
              At 30, I met my wife, Rochelle, the love of my life, and in our early years together,
              I nearly lost her. She was struggling deeply, like my father had, eventually to the
              point where I feared that history was going to repeat itself. We tried everything.
              Doctors, books, programs, medications, everything.
            </p>
            <p>
              What finally brought her back was a unique type of meditation that we heard was
              prescribed for Soldiers with PTSD.
            </p>
            <p>
              I choose my words carefully here, because I know how they can sound. But it was
              nothing short of life changing, and it saved her life. That experience changed us
              forever.
            </p>
            <p>
              Five years later, in 2016 we founded Mindspo, our mental wellness company, to bring
              what we&apos;d learned to others. Since then we&apos;ve hosted more than 1,000 people
              on retreats and taught thousands more through our programs who echoed the results. It
              has been the privilege of my life.
            </p>
            <p>So why Now Off Duty?</p>
            <p>
              Because in all those retreats and programs, the people who moved me the most were the
              ones in their sixties. They&apos;d carried responsibility longer than anyone from
              decades of work, family, duty. And when they finally reached the chapter that was
              supposed to be the reward, so many of them couldn&apos;t receive it. Their bodies were
              stuck in high alert, with minds that wouldn&apos;t quiet down.
            </p>
            <p>
              Nobody teaches you how to put down what you carried for 40 years, and that&apos;s a
              gap I want to fill.
            </p>
            <p>
              I&apos;m in my forties now. I won&apos;t pretend to know what it&apos;s like to stand
              where you are. But what I&apos;m certain of is that I can give you a map with
              practices, refined for thousands of years and taught to thousands more, for the road
              between &apos;permanently ON&apos; and finally at peace.
            </p>
            <p>You&apos;ve earned this chapter. Let&apos;s make sure you get to enjoy it.</p>
            <p>— Chris Soll</p>
          </div>
        </div>
      </section>

    </FunnelShell>
  );
}

export function TrainingPage() {
  return (
    <main className="editorial-funnel editorial-standalone-funnel">
      <section className="editorial-training-page">
        <div className="editorial-container editorial-training-grid">
          <div className="editorial-training-copy">
            <p className="editorial-kicker">Free live training</p>
            <h1 className="editorial-page-title">
              Why are so many retired people still living awake at 3am?
            </h1>
            <p className="editorial-training-byline">
              A free live training with Chris Soll
              <span>Founder of Mindspo</span>
            </p>
            <div className="editorial-copy">
              <p>
                Find out why retirement leaves so many people restless, and what to do about it.
              </p>
              <p>Feel the difference live on the call.</p>
            </div>
            <h2 className="editorial-training-list-title">In this free training you will:</h2>
            <ol className="editorial-training-list">
              <li>
                <span>01</span>
                <p>Understand the deep factors that leave so many people restless in retirement.</p>
              </li>
              <li>
                <span>02</span>
                <p>
                  Learn a simple technique to regulate the nervous system from the comfort of home.
                </p>
              </li>
              <li>
                <span>03</span>
                <p>
                  Experience it live. You won&apos;t have to take our word for it, you&apos;ll feel
                  it for yourself.
                </p>
              </li>
            </ol>
          </div>
          <div className="editorial-training-card">
            <TrainingRegistrationForm />
          </div>
        </div>
      </section>

      <section className="editorial-training-host">
        <div className="editorial-container editorial-training-host-grid">
          <img
            className="editorial-training-host-image"
            src="/assets/chris-training-DcQ9PqBG.jpg"
            alt="Chris Soll with his wife"
          />
          <div className="editorial-training-host-copy">
            <p className="editorial-kicker">Your host</p>
            <h2>
              Chris <em>Soll</em>
            </h2>
            <p>
              Co-founder of Mindspo. 1,000+ people hosted on retreats, thousands taught to regulate.
              Meditation saved his wife&apos;s life; sharing it has been his mission since.
            </p>
            <a className="editorial-story-link" href="/about">
              Read his story →
            </a>
          </div>
        </div>
      </section>

      <TrainingTestimonials />
      <FunnelFooter />
    </main>
  );
}

const trainingTestimonials = [
  "/assets/testimonial-3.webp",
  "/assets/testimonial-5.webp",
  "/assets/testimonial-12-d-yavfjy.webp",
  "/assets/testimonial-13-ctmbibsc.webp",
  "/assets/testimonial1.webp",
];

function TrainingTestimonials() {
  const repeatedTestimonials = [...trainingTestimonials, ...trainingTestimonials];

  return (
    <section className="editorial-training-testimonials">
      <div className="editorial-container">
        <div className="editorial-training-testimonials-heading">
          <p className="editorial-kicker">What people say</p>
          <h2>Real words from <em>real people.</em></h2>
        </div>
        <div className="editorial-testimonial-marquee" aria-label="Participant testimonials">
          <div className="editorial-testimonial-marquee-track">
            {repeatedTestimonials.map((src, index) => (
              <figure className="editorial-testimonial-card" key={`${src}-${index}`}>
                <img src={src} alt="Testimonial from a Mindspo participant" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
        <p className="editorial-testimonial-disclaimer">
          For educational purposes only. Not medical or mental health advice or treatment. Results
          vary. Consult your healthcare provider before changing any care or medication.
        </p>
      </div>
    </section>
  );
}

const weekPlan = [
  [
    "Week one",
    "Look at the shape of your week",
    "Start with the days as they are and identify where more intention would help.",
  ],
  [
    "Week two",
    "Choose useful anchors",
    "Test a small set of morning, evening, and weekly anchors that fit your life.",
  ],
  [
    "Week three",
    "Make room for what matters",
    "Review the people, projects, contribution, and open time you want to protect.",
  ],
  [
    "Week four",
    "Keep what works",
    "Turn your observations into a rhythm you can continue reviewing and adjusting.",
  ],
];

const includedItems = [
  "Four live group sessions with Chris",
  "A simple morning practice",
  "A simple evening practice",
  "Weekly reflection and group check-ins",
  "Practical guidance for shaping your own rhythm",
  "An accountability pair; one other person in the cohort whose daily practice connects to yours, with a completion reward for pairs who finish the program together",
  "A follow-up session after the core four weeks",
  "A small group with a clear and thoughtful shared purpose",
];

const outcomeItems = [
  "A clearer picture of the week you want to build",
  "A practical rhythm to experiment with",
  "Short practices you can repeat independently",
  "A way to review what is working and make adjustments",
  "A clearer next step for the chapter you are designing",
  "A more deliberate way to talk about what comes next",
];

const faqItems = [
  [
    "I've never meditated in my life. Can I really learn this in my 60s?",
    "Yes and you may be better placed than a 30-year-old. You have the two things meditation actually requires: time and a valuable reason to keep going. If you can sit in a chair and breathe, you can do this.",
  ],
  [
    "Is this religious or spiritual?",
    "No. These are practical, secular techniques for calming your nervous system and your mind. People of every faith and none practice with us comfortably.",
  ],
  [
    "My mind never stops. I can't sit still.",
    "That's not a reason to skip this, it's the exact pattern we work with. A racing mind is a switched-on nervous system doing its job too well. You're precisely who this is for.",
  ],
  [
    "Is this therapy?",
    "No, and it doesn't replace it. This is education and daily practice. If you're in crisis right now, please reach out to a mental health professional or a crisis line first, this work will be here for you afterwards.",
  ],
  [
    "I'm not good with technology. How does the training work?",
    "One click on a link we email you, from any computer, tablet or phone. We send simple instructions, and if you get stuck, reply to any email and a human will help you.",
  ],
  [
    "Who is Chris Soll?",
    "Co-founder of Mindspo, a mental wellness company that has hosted 1,000+ people on retreats and taught thousands to meditate. Read his full story on the About page.",
  ],
  [
    "What does it cost?",
    "Program details, including investment, are shared at the free training, because we'd rather you experience the work first and decide with a calm nervous system.",
  ],
];

function FAQList() {
  return (
    <div className="editorial-faq">
      {faqItems.map(([question, answer]) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}

function PaymentAction() {
  const paymentUrl = webinarFunnelConfig.integrations.stripePaymentUrl;

  if (!paymentUrl) {
    return (
      <>
        <button className="editorial-button editorial-button--full" type="button" disabled>
          Join the next cohort — {formattedCohortPrice}
        </button>
        <p className="editorial-payment-note">Stripe checkout will be connected before launch.</p>
      </>
    );
  }

  return (
    <a className="editorial-button editorial-button--full" href={paymentUrl}>
      Join the next cohort — {formattedCohortPrice}
    </a>
  );
}

export function JoinPage() {
  return (
    <FunnelShell offer showNav={false}>
      <section className="editorial-section" id="program">
        <div className="editorial-container">
          <div className="editorial-split">
            <div>
              <p className="editorial-kicker">Four-week group program</p>
              <h1 className="editorial-page-title" style={{ marginTop: 18 }}>
                Retire Regulated
              </h1>
              <p className="editorial-lead" style={{ marginTop: 28, textAlign: "left" }}>
                Build a rhythm for the chapter after full-time work.
              </p>
              <div className="editorial-copy" style={{ marginTop: 28 }}>
                <p>
                  A four-week small-group program for people who want more intention, structure, and
                  room to think about what comes next.
                </p>
                <p>
                  The free session gives you a place to begin. Retire Regulated helps you turn that
                  starting point into a rhythm you can actually live.
                </p>
                <p>
                  Maximum 12 participants. A group small enough that you&apos;ll know everyone by
                  the end of the first session.
                </p>
              </div>
            </div>
            <PlaceholderFrame
              variant="group"
              label="A considered group experience"
              note="Program image to be provided"
            />
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper" id="the-week">
        <div className="editorial-container">
          <SectionHeader
            kicker="The four-week arc"
            title="A simple process you can keep using."
            subtitle="Work with Chris and a small group to test what fits, review what is working, and shape a week that reflects the chapter you are designing."
          />
          <div className="editorial-week-grid">
            {weekPlan.map(([week, title, body]) => (
              <article className="editorial-week-card" key={week}>
                <span>{week}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--dark">
        <div className="editorial-container">
          <SectionHeader
            kicker="What happens inside"
            title="Structure, practice, reflection, adjustment."
          />
          <CheckList items={includedItems} />
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-container editorial-container--narrow">
          <SectionHeader
            kicker="What you will leave with"
            title="Something practical to continue."
          />
          <CheckList items={outcomeItems} />
        </div>
      </section>

      <section className="editorial-section editorial-section--paper">
        <div className="editorial-container">
          <SectionHeader kicker="Who it is for" title="A considered room for a real transition." />
          <div className="editorial-audience-grid">
            <div className="editorial-audience-item">
              People approaching retirement or recently out of full-time work
            </div>
            <div className="editorial-audience-item">
              People who have handled much of the practical planning
            </div>
            <div className="editorial-audience-item">
              People who want to think seriously about ordinary days
            </div>
            <div className="editorial-audience-item">
              People willing to try small changes and review what happens
            </div>
          </div>
          <div
            className="editorial-copy"
            style={{ maxWidth: 760, margin: "42px auto 0", textAlign: "center" }}
          >
            <p>
              This is not financial, investment, tax, legal, or estate advice. It is not therapy or
              medical care. It is not a promise of a guaranteed emotional or financial result.
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-section" id="investment">
        <div className="editorial-container editorial-container--narrow">
          <SectionHeader
            kicker="The investment"
            title="Four weeks to give the next chapter a shape."
          />
          <div className="editorial-investment">
            <div>
              <p className="editorial-price-label">Founding cohort</p>
              <p className="editorial-price">{formattedCohortPrice}</p>
              <p className="editorial-price-copy">
                Four weeks. Full access to everything described above.
              </p>
              <p className="editorial-price-copy">
                This first cohort is offered at a founding rate while we refine the program with the
                group. Future cohorts will be priced separately.
              </p>
            </div>
            <div id="join-now">
              <PaymentAction />
              <p className="editorial-payment-note">
                Review the details, then join directly or reply with any questions. If you would
                prefer to speak with someone first, we are happy to arrange a short call.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--paper">
        <div className="editorial-container">
          <ChrisPanel showHeadshot={false} />
        </div>
      </section>

      <section className="editorial-section" id="faq">
        <div className="editorial-container">
          <SectionHeader kicker="Questions" title="Common Questions, Simple Answers" />
          <div className="editorial-faq">
            {faqItems.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-final-cta">
        <div className="editorial-container">
          <h2 className="editorial-section-title">
            Retire Regulated is a practical place to begin.
          </h2>
          <PaymentAction />
        </div>
      </section>
    </FunnelShell>
  );
}

export function ThankYouPage() {
  return (
    <main className="editorial-funnel editorial-standalone-funnel">
      <section className="editorial-centered-page">
        <div className="editorial-container">
          <div className="editorial-centered-card">
            <p className="editorial-kicker">You&apos;re in</p>
            <h1 className="editorial-page-title" style={{ marginTop: 18 }}>
              A short message from <em>Chris.</em>
            </h1>
            <div className="editorial-copy">
              <p>
                Please take two minutes to watch, it explains what to do before we meet.
              </p>
            </div>
            <div className="editorial-video-placeholder editorial-vimeo" id="free-session-video">
              <iframe
                src="https://player.vimeo.com/video/1210003379?dnt=1"
                title="A short message from Chris Soll"
                loading="lazy"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <ReminderForm />
          </div>
          <section className="editorial-next-steps">
            <h2>
              What happens <em>next.</em>
            </h2>
            <ol className="editorial-next-steps-list">
              <li>
                <span>01</span>
                <p>
                  Check your email — your joining link is on its way. If it isn&apos;t there in 5
                  minutes, check spam or promotions.
                </p>
              </li>
              <li>
                <span>02</span>
                <p>
                  Add the training to your calendar so it doesn&apos;t slip by. A reminder will go out
                  an hour before we begin.
                </p>
              </li>
              <li>
                <span>03</span>
                <p>
                  On Sunday, click the link from any computer, tablet or phone. Nothing to download,
                  nothing to install.
                </p>
              </li>
              <li>
                <span>04</span>
                <p>
                  Find a comfortable chair somewhere quiet, with headphones if you have them. Come
                  as you are.
                </p>
              </li>
            </ol>
            <p className="editorial-next-steps-signoff">
              <em>
                See you soon for a very special Sunday.
                <br />
                - Chris
              </em>
            </p>
          </section>
        </div>
      </section>
      <FunnelFooter />
    </main>
  );
}

export function ConfirmedPage() {
  return <ThankYouPage />;
}

function OnboardingForm() {
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState("");
  const [goal, setGoal] = useState("");
  const [profile, setProfile] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      window.localStorage.setItem(
        "now-off-duty:cohort-onboarding",
        JSON.stringify({ stage, goal, profile, submittedAt: new Date().toISOString() }),
      );
    } catch {
      // The form remains useful even when browser storage is unavailable.
    }
    setSaved(true);
  }

  return (
    <form className="editorial-onboarding" onSubmit={submit}>
      <label className="editorial-field-label">
        Where are you in the transition out of full-time work?
        <select
          className="editorial-select"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          required
        >
          <option value="">Choose one</option>
          <option>Approaching the transition</option>
          <option>Recently out of full-time work</option>
          <option>Already in the next chapter</option>
        </select>
      </label>
      <label className="editorial-field-label">
        What would you most like to design over the four weeks?
        <textarea
          className="editorial-textarea"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          required
        />
      </label>
      <label className="editorial-field-label">
        Optional professional profile link
        <input
          className="editorial-input"
          type="url"
          placeholder="LinkedIn or another profile"
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
        />
        <span className="editorial-onboarding-note">
          Optional. This is used only to understand context and support introductions within the
          group.
        </span>
      </label>
      <button className="editorial-button" type="submit">
        Save onboarding details
      </button>
      {saved && (
        <p className="editorial-success" role="status">
          Your onboarding details are saved.
        </p>
      )}
    </form>
  );
}

export function WelcomePage() {
  return (
    <FunnelShell showNav={false}>
      <section className="editorial-centered-page">
        <div className="editorial-container">
          <div className="editorial-centered-card">
            <p className="editorial-kicker">Retire Regulated</p>
            <h1 className="editorial-page-title" style={{ marginTop: 18 }}>
              You’re in.
            </h1>
            <div className="editorial-copy">
              <p>
                The first email will include the cohort dates, session links, practice schedule,
                onboarding details, and everything you need to get started.
              </p>
              <p>Complete the short form below so the group can be prepared with care.</p>
            </div>
            <OnboardingForm />
          </div>
        </div>
      </section>
    </FunnelShell>
  );
}
