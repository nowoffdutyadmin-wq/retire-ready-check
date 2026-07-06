import type { ReactNode } from "react";

export const site = {
  brand: "Now Off Duty",
  businessName: "Now Off Duty LLC",
  email: "",
  phone: "",
  responseHours: "Public contact details will be added before launch.",
};

export const colors = {
  bg: "#F1F4EF",
  bgDeep: "#E6ECE5",
  paper: "#FBFAF5",
  ink: "#1F2421",
  inkSoft: "#343B36",
  muted: "#4E5A53",
  rule: "#C8D0C4",
  sage: "#6B8F7E",
  sageDeep: "#405F54",
  sageSoft: "#D9E4DC",
  cta: "#B2553A",
  ctaHover: "#9A4730",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Free Webinar" },
  { href: "/about", label: "About Chris" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login" },
];

const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/disclaimer", label: "Important Disclaimer" },
  { href: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.bg,
        color: colors.ink,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header style={{ borderBottom: `1px solid ${colors.rule}`, backgroundColor: colors.bg }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="font-serif text-[28px] leading-none" style={{ color: colors.ink }}>
            {site.brand}
          </a>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[16px] font-medium underline-offset-4 hover:underline"
                style={{ color: colors.inkSoft }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer style={{ borderTop: `1px solid ${colors.rule}`, backgroundColor: colors.paper }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="font-serif text-[28px]" style={{ color: colors.ink }}>
              {site.brand}
            </div>
            <p
              className="mt-3 max-w-xl text-[17px] leading-[1.65]"
              style={{ color: colors.inkSoft }}
            >
              Practical coaching and education for people preparing for the transition into life
              after full-time work.
            </p>
            <p className="mt-4 text-[16px] leading-[1.6]" style={{ color: colors.muted }}>
              Educational only. Not professional advice for your personal situation. Please read the
              Important Disclaimer.
            </p>
          </div>

          <div>
            <div className="grid gap-3 text-[16px]" style={{ color: colors.inkSoft }}>
              <div>
                <strong style={{ color: colors.ink }}>Legal business name:</strong>{" "}
                {site.businessName}
              </div>
              <div>
                <strong style={{ color: colors.ink }}>Email:</strong>{" "}
                {site.email ? (
                  <a className="underline" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                ) : (
                  "To be added before launch"
                )}
              </div>
              {site.phone && (
                <div>
                  <strong style={{ color: colors.ink }}>Phone:</strong> {site.phone}
                </div>
              )}
              <div>
                <strong style={{ color: colors.ink }}>Response hours:</strong> {site.responseHours}
              </div>
            </div>
            <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-3" aria-label="Footer navigation">
              {footerLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[16px] font-medium underline"
                  style={{ color: colors.sageDeep }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <p className="mt-6 text-[16px]" style={{ color: colors.muted }}>
              © 2026 {site.businessName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-10 pt-12 sm:pt-16">
      {eyebrow && (
        <div
          className="mb-4 text-[16px] font-semibold tracking-[0.12em]"
          style={{ color: colors.sageDeep }}
        >
          {eyebrow}
        </div>
      )}
      <h1
        className="font-serif text-[44px] leading-[1.06] sm:text-[62px]"
        style={{ color: colors.ink }}
      >
        {title}
      </h1>
      <div className="mt-6 max-w-3xl text-[18px] leading-[1.7]" style={{ color: colors.inkSoft }}>
        {children}
      </div>
    </section>
  );
}

export function Section({
  title,
  children,
  narrow = false,
}: {
  title?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <section className={`mx-auto px-5 py-8 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>
      {title && (
        <h2
          className="font-serif text-[34px] leading-[1.12] sm:text-[44px]"
          style={{ color: colors.ink }}
        >
          {title}
        </h2>
      )}
      <div className={title ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[56px] items-center justify-center rounded-[10px] px-7 text-[18px] font-semibold"
      style={{
        backgroundColor: secondary ? "transparent" : colors.cta,
        border: `1px solid ${secondary ? colors.sageDeep : colors.cta}`,
        color: secondary ? colors.sageDeep : colors.paper,
      }}
    >
      {children}
    </a>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-[8px] p-5"
      style={{ backgroundColor: colors.paper, border: `1px solid ${colors.rule}` }}
    >
      <h3 className="font-serif text-[28px] leading-[1.15]" style={{ color: colors.ink }}>
        {title}
      </h3>
      <div className="mt-3 text-[17px] leading-[1.65]" style={{ color: colors.inkSoft }}>
        {children}
      </div>
    </div>
  );
}

export function DisclaimerBox() {
  return (
    <div
      className="rounded-[8px] p-5 text-[17px] leading-[1.65]"
      style={{
        backgroundColor: colors.sageSoft,
        border: `1px solid ${colors.sage}`,
        color: colors.inkSoft,
      }}
    >
      <strong style={{ color: colors.ink }}>Important disclaimer:</strong> Now Off Duty provides
      coaching and education for retirement transition. It is educational only, not professional
      advice for your personal situation. Read the{" "}
      <a className="underline" href="/disclaimer">
        Important Disclaimer
      </a>
      .
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 text-[18px] leading-[1.65]" style={{ color: colors.inkSoft }}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden style={{ color: colors.sageDeep }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
