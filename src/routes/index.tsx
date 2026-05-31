import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Off-Duty Reset — Now Off Duty" },
      {
        name: "description",
        content:
          "A four-minute self-assessment for people who built a good retirement on paper but have not quite felt it yet in practice.",
      },
      { property: "og:title", content: "The Off-Duty Reset — Now Off Duty" },
      {
        property: "og:description",
        content:
          "You have enough money. So why does spending it still feel wrong? Take the four-minute self-assessment.",
      },
    ],
  }),
  component: OffDutyAssessment,
});

// ---------- Content ----------

type ScoredQuestion = {
  id: string;
  index: number;
  text: string;
  low: string;
  high: string;
};

type OpenQuestion = {
  id: string;
  index: number;
  label: string;
  text: string;
  placeholder: string;
};

const SCORED: ScoredQuestion[] = [
  {
    id: "q1",
    index: 1,
    text: "When you spend money on yourself — a trip, a restaurant, something you want but do not strictly need — how safe does that feel?",
    low: "It usually feels wrong or risky",
    high: "Easy, I have earned it",
  },
  {
    id: "q2",
    index: 2,
    text: "When someone asks what you do these days, how comfortable are you with your answer?",
    low: "I still stumble or feel uncertain",
    high: "I have a clear answer I feel good about",
  },
  {
    id: "q3",
    index: 3,
    text: "How well are you sleeping most nights?",
    low: "Poorly, often awake or worrying",
    high: "Well, consistently and without anxiety",
  },
  {
    id: "q4",
    index: 4,
    text: "When you have a completely free day with nothing urgent on the list, how easy is it to genuinely enjoy it?",
    low: "Hard. I feel restless or like I should be doing something",
    high: "Easy. I know how to be present in it",
  },
  {
    id: "q5",
    index: 5,
    text: "How connected do you feel to other people in a typical week since work ended?",
    low: "Quite isolated, more than I expected",
    high: "Well connected and genuinely engaged",
  },
  {
    id: "q6",
    index: 6,
    text: "How clear and motivating does your sense of purpose feel right now?",
    low: "Vague or hollow",
    high: "Clear and genuinely pulling me forward",
  },
  {
    id: "q7",
    index: 7,
    text: "How free from financial worry is your mind on a typical day, even when you know your situation is stable?",
    low: "There is usually a low hum of worry in the background",
    high: "I trust the situation and rarely think about it",
  },
  {
    id: "q8",
    index: 8,
    text: "How free from guilt do you feel when you rest, spend on yourself, or do something purely for your own enjoyment?",
    low: "Guilty most of the time",
    high: "No guilt. I know I have earned this",
  },
  {
    id: "q9",
    index: 9,
    text: "How settled does your body feel on a typical day — free from unexplained tension, low-grade restlessness, or a background sense that something needs your attention?",
    low: "Usually tense or on edge",
    high: "Calm and genuinely at ease",
  },
  {
    id: "q10",
    index: 10,
    text: "How strongly do you believe the most rewarding years of your life are still ahead of you?",
    low: "Honestly, I am not sure they are",
    high: "Strongly. I am looking forward to what comes next",
  },
];

const OPEN: OpenQuestion[] = [
  {
    id: "q11",
    index: 11,
    label: "This does not affect your score. It helps us understand you better.",
    text: "What keeps coming back to you most? The thought you cannot quite shake about this chapter of life.",
    placeholder:
      "Running out of money, losing my health, not sleeping well, feeling restless, not knowing who I am without the job…",
  },
  {
    id: "q12",
    index: 12,
    label: "One last question. Optional.",
    text: "If retirement felt the way you imagined it would, what would be different about your daily life right now?",
    placeholder:
      "I would feel more relaxed, more clear about what comes next, less guilty about resting…",
  },
];

const PATTERNS = {
  saving: {
    name: "Saving Mode",
    desc: "Your plan is solid. The discomfort comes when spending that money on yourself actually feels wrong. Decades of building financial protection leaves a mark. Your brain learned to treat spending as a threat, and it has not been told the situation has changed.",
    ids: ["q1", "q7", "q8"],
  },
  oncall: {
    name: "Still On Call",
    desc: "Work gave you a role, a rhythm, and a reason. When that ended, a large part of your daily sense of self went with it. The days feel less defined. The question of what comes next does not have a clean answer yet.",
    ids: ["q2", "q6"],
  },
  guilty: {
    name: "Guilty Rester",
    desc: "You have earned the right to rest, but rest rarely feels earned in practice. There is a pull toward doing something useful even when there is nothing urgent. Relaxation triggers guilt rather than relief.",
    ids: ["q4", "q8"],
  },
  empty: {
    name: "Running on Empty",
    desc: "Sleep, social connection, and physical calm have all shifted since retirement ended. The body is still carrying something the calendar no longer justifies. The tension does not have an obvious cause, which makes it harder to address.",
    ids: ["q3", "q5", "q9"],
  },
} as const;

type PatternKey = keyof typeof PATTERNS;

function scoreRangeLabel(score: number) {
  if (score <= 39) return "Retirement Does Not Feel Safe Yet";
  if (score <= 59) return "Still Running on Work Mode";
  if (score <= 79) return "Mostly There, Something Is Holding You Back";
  return "Mostly Ready, With One Pattern Worth Watching";
}

function determinePattern(scores: Record<string, number>): PatternKey {
  let bestKey: PatternKey = "saving";
  let bestAvg = Infinity;
  let bestMin = Infinity;
  (Object.keys(PATTERNS) as PatternKey[]).forEach((key) => {
    const ids = PATTERNS[key].ids;
    const vals = ids.map((id) => scores[id] ?? 5);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const min = Math.min(...vals);
    if (avg < bestAvg || (avg === bestAvg && min < bestMin)) {
      bestAvg = avg;
      bestMin = min;
      bestKey = key;
    }
  });
  return bestKey;
}

// ---------- Screens ----------

type Screen =
  | { kind: "landing" }
  | { kind: "scored"; i: number } // 0..9
  | { kind: "halfway" }
  | { kind: "open"; i: number } // 0..1
  | { kind: "insight" }
  | { kind: "result" }
  | { kind: "permission" }
  | { kind: "offer" };

function OffDutyAssessment() {
  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [scores, setScores] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const history = useRef<Screen[]>([]);

  const go = (next: Screen) => {
    history.current.push(screen);
    setScreen(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const back = () => {
    const prev = history.current.pop();
    if (prev) {
      setScreen(prev);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    }
  };

  const totalScore = useMemo(
    () => SCORED.reduce((sum, q) => sum + (scores[q.id] ?? 0), 0),
    [scores],
  );
  const patternKey = useMemo(() => determinePattern(scores), [scores]);

  // Quiz progress (for top bar)
  const progress = (() => {
    if (screen.kind === "scored") return ((screen.i + 1) / 12) * 100;
    if (screen.kind === "halfway") return (5 / 12) * 100;
    if (screen.kind === "open") return ((10 + screen.i + 1) / 12) * 100;
    if (screen.kind === "insight") return 100;
    return 0;
  })();
  const showProgress =
    screen.kind === "scored" ||
    screen.kind === "halfway" ||
    screen.kind === "open" ||
    screen.kind === "insight";

  const currentLabel = (() => {
    if (screen.kind === "scored") return `Question ${screen.i + 1} of 12`;
    if (screen.kind === "halfway") return "Halfway";
    if (screen.kind === "open") return `Question ${10 + screen.i + 1} of 12`;
    if (screen.kind === "insight") return "Almost done";
    return "";
  })();

  return (
    <main className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      {showProgress && (
        <ProgressBar value={progress} label={currentLabel} onBack={history.current.length ? back : undefined} />
      )}

      <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-24 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(screen)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen.kind === "landing" && (
              <Landing onStart={() => go({ kind: "scored", i: 0 })} />
            )}

            {screen.kind === "scored" && (
              <ScoredScreen
                q={SCORED[screen.i]}
                value={scores[SCORED[screen.i].id]}
                onSelect={(v) => {
                  setScores((s) => ({ ...s, [SCORED[screen.i].id]: v }));
                  // small delay so the user sees the selection register
                  window.setTimeout(() => {
                    if (screen.i === 4) go({ kind: "halfway" });
                    else if (screen.i === 9) go({ kind: "open", i: 0 });
                    else go({ kind: "scored", i: screen.i + 1 });
                  }, 280);
                }}
              />
            )}

            {screen.kind === "halfway" && (
              <Halfway onNext={() => go({ kind: "scored", i: 5 })} />
            )}

            {screen.kind === "open" && (
              <OpenScreen
                q={OPEN[screen.i]}
                value={open[OPEN[screen.i].id] ?? ""}
                onChange={(v) => setOpen((o) => ({ ...o, [OPEN[screen.i].id]: v }))}
                onContinue={() => {
                  if (screen.i === 0) go({ kind: "open", i: 1 });
                  else go({ kind: "insight" });
                }}
                onSkip={() => {
                  setOpen((o) => {
                    const n = { ...o };
                    delete n[OPEN[screen.i].id];
                    return n;
                  });
                  if (screen.i === 0) go({ kind: "open", i: 1 });
                  else go({ kind: "insight" });
                }}
              />
            )}

            {screen.kind === "insight" && (
              <Insight onNext={() => go({ kind: "result" })} />
            )}

            {screen.kind === "result" && (
              <Result
                score={totalScore}
                patternKey={patternKey}
                onNext={() => go({ kind: "permission" })}
              />
            )}

            {screen.kind === "permission" && (
              <Permission onNext={() => go({ kind: "offer" })} />
            )}

            {screen.kind === "offer" && <Offer />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}

// ---------- Components ----------

function ProgressBar({
  value,
  label,
  onBack,
}: {
  value: number;
  label: string;
  onBack?: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-paper)]/95 backdrop-blur border-b border-[var(--color-rule)]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8 py-3">
        <div className="flex items-center justify-between text-[13px] text-[var(--color-muted-ink)]">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="min-h-[44px] -ml-2 px-2 py-2 rounded-md hover:bg-[var(--color-paper-deep)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Go back"
          >
            ← Back
          </button>
          <span className="font-medium tracking-wide">{label}</span>
          <span className="w-[60px]" />
        </div>
        <div className="mt-2 h-[3px] w-full bg-[var(--color-paper-deep)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-accent)]"
            initial={false}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 min-h-[56px] px-7 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] font-medium text-[17px] tracking-tight hover:bg-[var(--color-accent-deep)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] focus-visible:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center min-h-[44px] px-4 text-[15px] text-[var(--color-muted-ink)] hover:text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-rule)] hover:decoration-[var(--color-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md"
    >
      {children}
    </button>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="text-center pt-6 sm:pt-16">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-8">
        Now Off Duty
      </div>
      <h1 className="font-serif text-[44px] leading-[1.05] sm:text-[64px] sm:leading-[1.02] tracking-tight text-[var(--color-ink)]">
        You have enough money.
        <br />
        <em className="italic text-[var(--color-accent)]">So why does spending it still feel wrong?</em>
      </h1>
      <p className="mt-8 text-[18px] sm:text-[19px] leading-[1.7] text-[var(--color-ink-soft)] max-w-xl mx-auto">
        A four-minute self-assessment for people who built a good retirement on paper
        but have not quite felt it yet in practice.
      </p>
      <p className="mt-4 text-[15px] text-[var(--color-muted-ink)]">
        Ten questions. Two open ones. Your answers stay private.
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onStart}>Find out where you stand →</PrimaryButton>
      </div>
      <div className="mt-12 mx-auto h-px w-16 bg-[var(--color-rule)]" />
      <p className="mt-6 font-serif italic text-[var(--color-muted-ink)] text-[17px]">
        An assessment, not a verdict.
      </p>
    </section>
  );
}

function ScoredScreen({
  q,
  value,
  onSelect,
}: {
  q: ScoredQuestion;
  value: number | undefined;
  onSelect: (v: number) => void;
}) {
  return (
    <section className="pt-2">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-5">
        Question {q.index} of 12
      </div>
      <h2 className="font-serif text-[28px] leading-[1.2] sm:text-[36px] sm:leading-[1.15] text-[var(--color-ink)]">
        {q.text}
      </h2>

      <div className="mt-10">
        <div className="grid grid-cols-11 gap-1.5 sm:gap-2">
          {Array.from({ length: 11 }).map((_, n) => {
            const selected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onSelect(n)}
                aria-label={`Rate ${n}`}
                aria-pressed={selected}
                className={`aspect-square min-h-[44px] rounded-full border text-[15px] sm:text-[16px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                  selected
                    ? "bg-[var(--color-accent)] text-[var(--color-paper)] border-[var(--color-accent)] shadow-sm scale-105"
                    : "bg-[var(--color-card)] text-[var(--color-ink)] border-[var(--color-rule)] hover:border-[var(--color-accent)]"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between gap-4 text-[13px] sm:text-[14px] text-[var(--color-muted-ink)] leading-snug">
          <span className="max-w-[45%]">{q.low}</span>
          <span className="max-w-[45%] text-right">{q.high}</span>
        </div>
      </div>
    </section>
  );
}

function Halfway({ onNext }: { onNext: () => void }) {
  return (
    <section className="text-center pt-10">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-8">
        A brief pause
      </div>
      <h2 className="font-serif text-[40px] leading-[1.1] sm:text-[52px] text-[var(--color-ink)]">
        You are <em className="italic text-[var(--color-accent)]">halfway</em> through.
      </h2>
      <p className="mt-8 text-[18px] leading-[1.7] text-[var(--color-ink-soft)] max-w-xl mx-auto">
        Most people spend years planning the financial side of retirement. Almost
        nobody plans for what retirement actually feels like once it arrives. Your
        answers so far are already telling us something.
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onNext}>Keep going</PrimaryButton>
      </div>
    </section>
  );
}

function OpenScreen({
  q,
  value,
  onChange,
  onContinue,
  onSkip,
}: {
  q: OpenQuestion;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="pt-2">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-5">
        Question {q.index} of 12
      </div>
      <p className="text-[14px] text-[var(--color-muted-ink)] italic mb-3">{q.label}</p>
      <h2 className="font-serif text-[26px] leading-[1.25] sm:text-[34px] sm:leading-[1.2] text-[var(--color-ink)]">
        {q.text}
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={6}
        className="mt-8 w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] p-5 text-[17px] leading-[1.7] text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)]/70 focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 resize-none"
      />
      <div className="mt-8 flex items-center justify-between gap-4">
        <GhostButton onClick={onSkip}>Skip</GhostButton>
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </div>
    </section>
  );
}

function Insight({ onNext }: { onNext: () => void }) {
  return (
    <section className="text-center pt-10">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-8">
        One moment
      </div>
      <h2 className="font-serif text-[40px] leading-[1.1] sm:text-[52px] text-[var(--color-ink)]">
        Your results are <em className="italic text-[var(--color-accent)]">ready</em>.
      </h2>
      <p className="mt-8 text-[18px] leading-[1.7] text-[var(--color-ink-soft)] max-w-xl mx-auto">
        More than four in ten retirees say they lose sleep over money worries, even
        when their own financial advisor says they are doing fine. If your score is
        lower than you expected, you are not alone. The gap between the numbers and
        how retirement actually feels is real, and it can be closed.
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onNext}>Show me my score</PrimaryButton>
      </div>
    </section>
  );
}

function Result({
  score,
  patternKey,
  onNext,
}: {
  score: number;
  patternKey: PatternKey;
  onNext: () => void;
}) {
  const pattern = PATTERNS[patternKey];
  const range = scoreRangeLabel(score);
  return (
    <section className="pt-6">
      <div className="text-center">
        <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)]">
          Your Off-Duty Score
        </div>
        <div className="mt-6 font-serif text-[96px] sm:text-[128px] leading-none text-[var(--color-ink)]">
          {score}
          <span className="text-[var(--color-muted-ink)] text-[40px] sm:text-[52px] align-top ml-1">
            /100
          </span>
        </div>
        <div className="mt-3 font-serif italic text-[22px] sm:text-[26px] text-[var(--color-accent)]">
          {range}
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card)] p-7 sm:p-9">
        <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)]">
          Primary Pattern
        </div>
        <h3 className="mt-3 font-serif text-[32px] sm:text-[40px] leading-[1.1] text-[var(--color-ink)]">
          {pattern.name}
        </h3>
        <p className="mt-5 text-[18px] leading-[1.75] text-[var(--color-ink-soft)]">
          {pattern.desc}
        </p>
      </div>

      <p className="mt-10 text-center text-[15px] text-[var(--color-muted-ink)] italic max-w-md mx-auto">
        This is not a judgment. It shows where retirement may still feel heavier than
        expected. Most people never look at it this clearly.
      </p>

      <div className="mt-10 flex justify-center">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </section>
  );
}

function Permission({ onNext }: { onNext: () => void }) {
  return (
    <section className="text-center pt-10">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-8">
        A next step
      </div>
      <h2 className="font-serif text-[36px] leading-[1.1] sm:text-[48px] text-[var(--color-ink)]">
        Want to do something about your score?
      </h2>
      <p className="mt-8 text-[18px] leading-[1.7] text-[var(--color-ink-soft)] max-w-xl mx-auto">
        There is a short explanation of what is actually driving this, and a
        practical first step you can take this week.
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onNext}>Show me the next step →</PrimaryButton>
      </div>
    </section>
  );
}

function Offer() {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="pt-4">
      {/* Section A: Video */}
      <div className="text-center">
        <h2 className="font-serif text-[34px] leading-[1.15] sm:text-[44px] text-[var(--color-ink)]">
          There is <em className="italic text-[var(--color-accent)]">one thing</em> at
          the core of all of this.
        </h2>
        <p className="mt-4 text-[16px] text-[var(--color-muted-ink)]">
          Watch this first. About three minutes.
        </p>
      </div>

      <div className="mt-10 mx-auto max-w-sm">
        <div className="relative w-full overflow-hidden rounded-2xl bg-[var(--color-ink)] aspect-[9/16] shadow-[0_20px_60px_-20px_rgba(26,26,26,0.35)]">
          {!playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-paper)] bg-gradient-to-b from-[#1a1a1a] via-[#2C3E5D]/40 to-[#1a1a1a] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-paper)]"
              aria-label="Play video"
            >
              <span className="flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-paper)]/95 text-[var(--color-accent)] transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="w-8 h-8 ml-1" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="mt-5 font-serif italic text-[20px]">A message from Chris</span>
              <span className="mt-1 text-[13px] tracking-[0.18em] uppercase opacity-70">
                3 minutes
              </span>
            </button>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--color-paper)] text-[14px] opacity-70">
              Video player placeholder
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mt-16 mx-auto h-px w-24 bg-[var(--color-rule)]" />

      {/* Section B: Offer */}
      <div className="mt-16 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card)] p-7 sm:p-10">
        <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)]">
          The Off-Duty Reset
        </div>
        <h3 className="mt-3 font-serif text-[36px] sm:text-[44px] leading-[1.08] text-[var(--color-ink)]">
          A short, practical reset for the part of you that is still on call.
        </h3>
        <p className="mt-6 text-[18px] leading-[1.75] text-[var(--color-ink-soft)]">
          A short bingeable video series that explains exactly what is keeping
          retirement from feeling the way you planned it. Concise, practical, and
          grounded in how people actually work. Includes a nighttime audio and a
          daytime reset practice.
        </p>

        <div className="mt-8 flex items-baseline gap-3">
          <span className="font-serif text-[56px] leading-none text-[var(--color-ink)]">
            $27
          </span>
          <span className="text-[14px] text-[var(--color-muted-ink)]">one-time</span>
        </div>

        <div className="mt-8">
          <PrimaryButton onClick={() => {}}>Get the Off-Duty Reset</PrimaryButton>
        </div>
        <p className="mt-4 text-[14px] text-[var(--color-muted-ink)]">
          Instant access. No subscription.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-rule)] py-10 text-center">
      <div className="font-serif italic text-[18px] text-[var(--color-ink)]">
        Now Off Duty
      </div>
      <div className="mt-1 text-[13px] tracking-[0.18em] uppercase text-[var(--color-muted-ink)]">
        nowoffduty.com
      </div>
    </footer>
  );
}
