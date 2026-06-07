import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Retirement Reality Check — Now Off Duty" },
      {
        name: "description",
        content:
          "A four-minute self-assessment to find the sticking points that may be keeping retirement from feeling as safe, calm, and enjoyable as it should.",
      },
      { property: "og:title", content: "The Retirement Reality Check — Now Off Duty" },
      {
        property: "og:description",
        content:
          "You have enough. So why don't you feel safe? A four-minute self-assessment.",
      },
    ],
  }),
  component: OffDutyAssessment,
});

// ---------------- Design tokens ----------------
const T = {
  bg: "#F1F4EF", // pale sage / warm off-white
  bgDeep: "#E6ECE5",
  paper: "#FBFAF5",
  ink: "#1F2421", // dark charcoal
  inkSoft: "#3A3F3B",
  muted: "#5C6660",
  rule: "#D2D7CE",
  sage: "#6B8F7E", // mid sage accent
  sageDeep: "#4F7466",
  sageSoft: "#D9E4DC",
  cta: "#B2553A", // muted terracotta / deep rust
  ctaHover: "#9A4730",
};

// ---------------- Questions ----------------
type ScoredQ = {
  id: string;
  text: string;
  /** true = high agreement is GOOD (positive question, reverse-scored for risk) */
  positive?: boolean;
};

const SCORED: ScoredQ[] = [
  { id: "q1", text: "I find it hard to spend on myself, even on things I can clearly afford." },
  { id: "q2", text: "I check my accounts more often than I really need to." },
  { id: "q3", text: "Health worries make it harder for me to fully rest at night." },
  { id: "q4", text: "I sometimes feel guilty about relaxing." },
  { id: "q5", text: "My body feels settled and at ease most days.", positive: true },
  { id: "q6", text: "If I'm honest, most of my identity was tied up in my career." },
  { id: "q7", text: "There are days when retirement feels more like unemployment than freedom." },
  // q8 partner status (not scored)
  // q9 partner alignment (conditional, positive)
  {
    id: "q9",
    text: "My partner and I see eye to eye on how we want to live in retirement.",
    positive: true,
  },
  { id: "q10", text: "I sometimes wonder, \"What's the point?\" now that I'm not working anymore." },
  {
    id: "q11",
    text: "I miss the structure more than I expected — the rhythm, the routine, knowing what day it is.",
  },
  { id: "q12", text: "I miss the people — the easy daily contact that used to just happen." },
  { id: "q13", text: "I genuinely believe the best of this life is still ahead.", positive: true },
];

const SCORED_BY_ID = new Map(SCORED.map((q) => [q.id, q]));

const PARTNER_OPTIONS = [
  { value: "solo", label: "On my own" },
  { value: "partner", label: "With a partner/spouse" },
];

const STAGE_OPTIONS = [
  { value: "planning_5plus", label: "Still planning — 5+ years out" },
  { value: "close_1_5", label: "Getting close — 1–5 years out" },
  { value: "just_retired", label: "Just retired — less than 1 year in" },
  { value: "early_1_3", label: "Early retirement — 1–3 years in" },
  { value: "well_in_3plus", label: "Well into it — 3+ years in" },
];

// ---------------- Scoring ----------------
function positivity(q: ScoredQ, raw: number) {
  // Returns 1..10 where 10 = best (most ease)
  return q.positive ? raw : 11 - raw;
}

function clusterPct(ids: string[], scores: Record<string, number>) {
  const vals = ids
    .filter((id) => scores[id] != null && SCORED_BY_ID.has(id))
    .map((id) => positivity(SCORED_BY_ID.get(id)!, scores[id]));
  if (!vals.length) return 50;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.round(avg * 10); // 10..100
}

type Archetype =
  | "saving_mode"
  | "restless_protector"
  | "grounded_explorer"
  | "almost_off_duty"
  | "ready_adjusting";

const ARCHETYPE_TITLE: Record<Archetype, string> = {
  saving_mode: "The Anxious Protector",
  restless_protector: "The Restless Operator",
  grounded_explorer: "The Grounded Explorer",
  almost_off_duty: "The Almost-Ready",
  ready_adjusting: "The Quiet Settler",
};

const ARCHETYPE_LINE: Record<Archetype, string> = {
  saving_mode:
    "The money is there. Your nervous system hasn't accepted that yet.",
  restless_protector:
    "You left the job. The tension in your body didn't get the memo.",
  grounded_explorer:
    "You've figured out something most people spend years circling.",
  almost_off_duty:
    "You're closer than your score suggests. A few things are still running underneath.",
  ready_adjusting:
    "Most of this chapter is working. One or two corners are still settling.",
};

function computeResult(scores: Record<string, number>) {
  const spending = clusterPct(["q1", "q2"], scores);
  const rest = clusterPct(["q3", "q4", "q5"], scores);
  const purpose = clusterPct(["q6", "q7", "q10", "q11", "q12", "q13"], scores);

  // Overall: average of all scored answers (incl q9 if answered)
  const allIds = Object.keys(scores).filter((id) => SCORED_BY_ID.has(id));
  const overallVals = allIds.map((id) =>
    positivity(SCORED_BY_ID.get(id)!, scores[id]),
  );
  const overall = overallVals.length
    ? Math.round((overallVals.reduce((s, v) => s + v, 0) / overallVals.length) * 10)
    : 50;

  const bars = { spending, rest, purpose };
  const min = Math.min(spending, rest, purpose);
  const max = Math.max(spending, rest, purpose);
  const spread = max - min;

  let archetype: Archetype;
  if (overall >= 80 && min >= 70) archetype = "ready_adjusting";
  else if (overall >= 55 && spread <= 12) archetype = "almost_off_duty";
  else if (spending === min) archetype = "saving_mode";
  else if (rest === min) archetype = "restless_protector";
  else archetype = "grounded_explorer";

  return { overall, bars, archetype };
}

// ---------------- Screen flow ----------------
type Screen =
  | { kind: "landing" }
  | { kind: "scored"; i: number } // index into ordered list below
  | { kind: "halfway" }
  | { kind: "partner" }
  | { kind: "stage" }
  | { kind: "open"; i: 0 | 1 }
  | { kind: "calculating" }
  | { kind: "email" }
  | { kind: "results" };

// Ordered sequence of scored question ids actually shown (q9 inserted conditionally)
function buildScoredOrder(partner: string | null): string[] {
  const base = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"]; // pre-halfway
  const post = ["q10", "q11", "q12", "q13"];
  return partner === "partner" ? [...base, "q9", ...post] : [...base, ...post];
}

// ---------------- Root component ----------------
function OffDutyAssessment() {
  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [scores, setScores] = useState<Record<string, number>>({});
  const [partner, setPartner] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [open1, setOpen1] = useState("");
  const [open2, setOpen2] = useState("");
  const [email, setEmail] = useState("");
  const [stress, setStress] = useState<number | null>(null);
  const historyRef = useRef<Screen[]>([]);

  const scoredOrder = useMemo(() => buildScoredOrder(partner), [partner]);
  const result = useMemo(() => computeResult(scores), [scores]);

  const go = (next: Screen) => {
    historyRef.current.push(screen);
    setScreen(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  const back = () => {
    const prev = historyRef.current.pop();
    if (prev) setScreen(prev);
  };

  // Progress total: 7 + halfway + partner + (q9?) + 4 + stage + 2 open = 15 or 16
  const totalSteps = 1 /*landing*/ + scoredOrder.length + 1 /*halfway*/ + 1 /*partner*/ + 1 /*stage*/ + 2 /*open*/;
  const currentStep = (() => {
    switch (screen.kind) {
      case "landing":
        return 0;
      case "scored": {
        // Pre-halfway: scored.i 0..6 -> 1..7
        // Halfway between i=6 and i=7
        // Post-halfway: scored.i 7.. -> shift by halfway+partner depending on order
        const i = screen.i;
        if (i < 7) return 1 + i;
        // after halfway (which is step 8). Then partner is step 9. Then q9 etc.
        return 1 + i + 2; // shift by halfway(1) + partner(1)
      }
      case "halfway":
        return 8;
      case "partner":
        return 9;
      case "stage":
        return totalSteps - 1;
      case "open":
        return totalSteps - 1 + screen.i; // not exact but visual
      default:
        return totalSteps;
    }
  })();

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: T.bg, color: T.ink, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes barFill { from { width: 0%; } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
        .focus-ring:focus-visible { outline: 3px solid ${T.sage}; outline-offset: 2px; }
      `}</style>

      {/* Top progress (hidden on landing/calculating/email/results) */}
      {!["landing", "calculating", "email", "results"].includes(screen.kind) && (
        <div className="sticky top-0 z-30" style={{ backgroundColor: T.bg }}>
          <div className="mx-auto max-w-2xl px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={back}
                className="focus-ring text-[14px] underline-offset-4 hover:underline"
                style={{ color: T.muted, minHeight: 44, paddingRight: 8 }}
              >
                ← Back
              </button>
              <div className="text-[12px] tracking-[0.18em]" style={{ color: T.muted }}>
                NOW OFF DUTY
              </div>
            </div>
            <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: T.rule }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (currentStep / totalSteps) * 100)}%`,
                  backgroundColor: T.sage,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={`${screen.kind}-${"i" in screen ? screen.i : ""}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-2xl px-5 pb-24 pt-6"
        >
          {screen.kind === "landing" && <Landing onStart={() => go({ kind: "scored", i: 0 })} />}

          {screen.kind === "scored" && (
            <ScoredQuestion
              q={SCORED_BY_ID.get(scoredOrder[screen.i])!}
              index={screen.i}
              total={scoredOrder.length}
              value={scores[scoredOrder[screen.i]] ?? null}
              onAnswer={(v) => {
                const id = scoredOrder[screen.i];
                setScores((s) => ({ ...s, [id]: v }));
                if (screen.i === 6) {
                  go({ kind: "halfway" });
                } else if (screen.i === scoredOrder.length - 1) {
                  go({ kind: "stage" });
                } else {
                  go({ kind: "scored", i: screen.i + 1 });
                }
              }}
            />
          )}

          {screen.kind === "halfway" && (
            <Halfway onNext={() => go({ kind: "partner" })} />
          )}

          {screen.kind === "partner" && (
            <PartnerQuestion
              value={partner}
              onSelect={(v) => {
                setPartner(v);
                // After partner: if partner, next scored is q9 at index 7; otherwise q10 at index 7
                go({ kind: "scored", i: 7 });
              }}
            />
          )}

          {screen.kind === "stage" && (
            <StageQuestion
              value={stage}
              onSelect={(v) => {
                setStage(v);
                go({ kind: "open", i: 0 });
              }}
            />
          )}

          {screen.kind === "open" && (
            <OpenQuestion
              index={screen.i}
              initial={screen.i === 0 ? open1 : open2}
              onContinue={(val) => {
                if (screen.i === 0) {
                  setOpen1(val);
                  go({ kind: "open", i: 1 });
                } else {
                  setOpen2(val);
                  go({ kind: "calculating" });
                }
              }}
              onSkip={() => {
                if (screen.i === 0) go({ kind: "open", i: 1 });
                else go({ kind: "calculating" });
              }}
            />
          )}

          {screen.kind === "calculating" && (
            <Calculating onDone={() => go({ kind: "email" })} />
          )}

          {screen.kind === "email" && (
            <EmailGate
              email={email}
              onChange={setEmail}
              onSubmit={() => {
                // Persist locally; integrate to backend later.
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      "off_duty_lead",
                      JSON.stringify({
                        email,
                        overall: result.overall,
                        archetype: result.archetype,
                        bars: result.bars,
                        partner,
                        stage,
                        open1,
                        open2,
                      }),
                    );
                  }
                } catch {}
                go({ kind: "results" });
              }}
            />
          )}

          {screen.kind === "results" && (
            <Results
              result={result}
              stress={stress}
              onStress={setStress}
            />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

// ---------------- Landing ----------------
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="pt-10 sm:pt-16">
      <div
        className="text-[12px] tracking-[0.22em] mb-6"
        style={{ color: T.muted }}
      >
        NOW OFF DUTY · THE RETIREMENT REALITY CHECK
      </div>
      <h1
        className="text-[40px] leading-[1.05] sm:text-[56px] sm:leading-[1.02] tracking-[-0.01em]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        You have <em className="italic">enough</em>.
        <br />
        So why don’t you feel <em className="italic">safe</em>?
      </h1>
      <p
        className="mt-6 text-[18px] sm:text-[20px] leading-[1.55]"
        style={{ color: T.inkSoft, maxWidth: 560 }}
      >
        A four-minute self-assessment to find the sticking points that may be keeping retirement
        from feeling as safe, calm, and enjoyable as it should.
      </p>

      <div className="mt-10">
        <button
          onClick={onStart}
          className="focus-ring inline-flex items-center justify-center w-full sm:w-auto px-8 rounded-[10px] text-[18px] font-medium"
          style={{
            backgroundColor: T.cta,
            color: "#FBFAF5",
            minHeight: 56,
            letterSpacing: "0.01em",
            boxShadow: "0 1px 0 rgba(0,0,0,.08), 0 8px 18px -10px rgba(178,85,58,.55)",
          }}
        >
          Start the assessment
        </button>
      </div>
    </section>
  );
}

// ---------------- Scored question ----------------
function ScoredQuestion({
  q,
  index,
  total,
  value,
  onAnswer,
}: {
  q: ScoredQ;
  index: number;
  total: number;
  value: number | null;
  onAnswer: (v: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(value);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    setSelected(value);
    if (advanceTimer.current != null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, [q.id, value]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const pick = (next: number) => {
    setSelected(next);
    if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => onAnswer(next), 220);
  };

  return (
    <section className="pt-4">
      <div className="text-[12px] tracking-[0.18em] mb-4" style={{ color: T.muted }}>
        QUESTION {index + 1} OF {total}
      </div>
      <h2
        className="text-[28px] leading-[1.2] sm:text-[34px] sm:leading-[1.18] tracking-[-0.005em]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        {q.text}
      </h2>

      <div className="mt-10">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const isSelected = selected === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => pick(n)}
                aria-label={`Rate ${n} out of 10`}
                aria-pressed={isSelected}
                className="focus-ring aspect-square min-h-[48px] rounded-full border text-[16px] font-medium transition-all"
                style={{
                  backgroundColor: isSelected ? T.sageDeep : T.paper,
                  borderColor: isSelected ? T.sageDeep : T.rule,
                  color: isSelected ? T.paper : T.ink,
                  boxShadow: isSelected ? "0 6px 16px -12px rgba(31,36,33,.55)" : "none",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between text-[13px] sm:text-[14px]" style={{ color: T.inkSoft }}>
          <span>Strongly disagree</span>
          <span>Strongly agree</span>
        </div>
      </div>
    </section>
  );
}

// ---------------- Halfway ----------------
function Halfway({ onNext }: { onNext: () => void }) {
  return (
    <section className="pt-10">
      <div className="text-[12px] tracking-[0.22em] mb-5" style={{ color: T.sageDeep }}>
        PAUSE
      </div>
      <h2
        className="text-[36px] leading-[1.08] sm:text-[44px]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        You're halfway through.
      </h2>
      <p
        className="mt-6 text-[18px] leading-[1.6]"
        style={{ color: T.inkSoft, maxWidth: 560 }}
      >
        Most people spend years planning the financial side of retirement. Almost nobody plans for
        what retirement actually feels like once it arrives. Your answers so far are already
        telling us something. Keep going.
      </p>
      <button
        onClick={onNext}
        className="focus-ring mt-10 w-full sm:w-auto px-8 rounded-[10px] text-[18px] font-medium"
        style={{ backgroundColor: T.cta, color: "#FBFAF5", minHeight: 56 }}
      >
        Keep going
      </button>
    </section>
  );
}

// ---------------- Partner / Stage (choice questions) ----------------
function ChoiceList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className="focus-ring text-left rounded-xl px-5 py-4 text-[17px] transition-colors"
            style={{
              backgroundColor: selected ? T.sageSoft : T.paper,
              border: `1px solid ${selected ? T.sage : T.rule}`,
              color: T.ink,
              minHeight: 56,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PartnerQuestion({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <section className="pt-4">
      <div className="text-[12px] tracking-[0.18em] mb-4" style={{ color: T.muted }}>
        A QUICK ONE
      </div>
      <h2
        className="text-[28px] leading-[1.2] sm:text-[34px]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        Are you navigating this chapter on your own or with a partner?
      </h2>
      <ChoiceList options={PARTNER_OPTIONS} value={value} onSelect={onSelect} />
    </section>
  );
}

function StageQuestion({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <section className="pt-4">
      <div className="text-[12px] tracking-[0.18em] mb-4" style={{ color: T.muted }}>
        ALMOST DONE
      </div>
      <h2
        className="text-[28px] leading-[1.2] sm:text-[34px]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        Where are you right now in this chapter of life?
      </h2>
      <ChoiceList options={STAGE_OPTIONS} value={value} onSelect={onSelect} />
    </section>
  );
}

// ---------------- Open questions ----------------
function OpenQuestion({
  index,
  initial,
  onContinue,
  onSkip,
}: {
  index: 0 | 1;
  initial: string;
  onContinue: (v: string) => void;
  onSkip: () => void;
}) {
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [index, initial]);

  const first = index === 0;
  const heading = first
    ? "In your own words, what is the thing you don't usually say out loud about this chapter?"
    : "In one sentence, how would you describe retirement to a close friend right now?";
  const sub = first
    ? "Your answer is private. It helps us understand what is actually going on for people like you. Type anything. There is no right answer here."
    : null;
  const placeholder = first
    ? "Take your time. A line or two is plenty."
    : "Just one sentence is fine.";

  return (
    <section className="pt-4">
      <div className="text-[12px] tracking-[0.18em] mb-4" style={{ color: T.muted }}>
        OPEN QUESTION {index + 1} OF 2
      </div>
      <h2
        className="text-[26px] leading-[1.22] sm:text-[32px]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        {heading}
      </h2>
      {sub && (
        <p className="mt-4 text-[16px] leading-[1.55]" style={{ color: T.inkSoft }}>
          {sub}
        </p>
      )}

      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="focus-ring mt-6 w-full rounded-xl p-4 text-[17px] leading-[1.55]"
        rows={6}
        style={{
          backgroundColor: T.paper,
          border: `1px solid ${T.rule}`,
          color: T.ink,
          minHeight: 160,
          resize: "vertical",
        }}
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onContinue(val.trim())}
          className="focus-ring rounded-[10px] text-[17px] font-medium px-8"
          style={{
            backgroundColor: T.cta,
            color: "#FBFAF5",
            minHeight: 52,
          }}
        >
          Continue
        </button>
        <button
          onClick={onSkip}
          className="focus-ring rounded-[10px] text-[16px] px-6"
          style={{
            backgroundColor: "transparent",
            color: T.muted,
            minHeight: 52,
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          Skip this one
        </button>
      </div>
    </section>
  );
}

// ---------------- Calculating ----------------
function Calculating({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    const t1 = window.setTimeout(() => setStep(1), 1500);
    const t2 = window.setTimeout(() => setStep(2), 3000);
    const t3 = window.setTimeout(() => setFadeOut(true), 3700);
    const t4 = window.setTimeout(() => onDone(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: T.bg,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 240,
          height: 6,
          borderRadius: 999,
          backgroundColor: T.rule,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: T.sage,
            borderRadius: 999,
            width: "100%",
            transformOrigin: "left center",
            animation: "calcBarFill 3.5s ease-out forwards",
          }}
        />
      </div>
      <style>{`@keyframes calcBarFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      <div className="mt-8 flex flex-col items-center gap-3 text-center" style={{ minHeight: 110 }}>
        <div style={{ fontSize: 15, color: T.muted }}>Reading your answers…</div>
        {step >= 1 && <div style={{ fontSize: 15, color: T.muted }}>Matching your pattern…</div>}
        {step >= 2 && (
          <div style={{ fontSize: 16, color: T.ink, fontWeight: 500 }}>Your result is ready.</div>
        )}
      </div>
    </div>
  );
}

// ---------------- Email gate ----------------
function EmailGate({
  email,
  onChange,
  onSubmit,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <section className="pt-10 sm:pt-16">
      <div className="text-[12px] tracking-[0.22em] mb-5" style={{ color: T.sageDeep }}>
        READY
      </div>
      <h2
        className="text-[36px] leading-[1.08] sm:text-[44px]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
      >
        Your results are ready.
      </h2>
      <p className="mt-5 text-[18px] leading-[1.55]" style={{ color: T.inkSoft, maxWidth: 520 }}>
        Enter your email to see your score and get your personalized breakdown.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit();
        }}
        className="mt-8 flex flex-col gap-3"
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          className="focus-ring rounded-[10px] px-4 text-[17px]"
          style={{
            backgroundColor: T.paper,
            border: `1px solid ${T.rule}`,
            color: T.ink,
            minHeight: 56,
          }}
        />
        <button
          type="submit"
          disabled={!valid}
          className="focus-ring rounded-[10px] text-[18px] font-medium"
          style={{
            backgroundColor: valid ? T.cta : T.rule,
            color: "#FBFAF5",
            minHeight: 56,
            cursor: valid ? "pointer" : "not-allowed",
          }}
        >
          Show me my results
        </button>
        <p className="text-[14px] mt-1" style={{ color: T.muted }}>
          Your breakdown goes to this inbox.
        </p>
      </form>
    </section>
  );
}

// ---------------- Results ----------------
type ResultData = ReturnType<typeof computeResult>;

function Results({
  result,
  stress,
  onStress,
}: {
  result: ResultData;
  stress: number | null;
  onStress: (v: number) => void;
}) {
  const { overall, bars, archetype } = result;
  const [scoreShown, setScoreShown] = useState(0);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Count up score
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setScoreShown(Math.round(overall * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const barT = window.setTimeout(() => setBarsAnimated(true), 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(barT);
    };
  }, [overall]);

  return (
    <section className="pt-2 pb-16">
      {/* Score */}
      <div className="text-center pt-6">
        <div className="text-[12px] tracking-[0.22em]" style={{ color: T.sageDeep }}>
          YOUR OFF-DUTY SCORE
        </div>
        <div
          className="mt-3 leading-none"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            color: T.ink,
            fontSize: 96,
          }}
        >
          {scoreShown}
          <span style={{ fontSize: 36, color: T.muted }}> / 100</span>
        </div>
      </div>

      {/* Archetype */}
      <div className="mt-8 text-center">
        <h1
          className="text-[32px] leading-[1.1] sm:text-[40px]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
        >
          {ARCHETYPE_TITLE[archetype]}
        </h1>
      </div>

      {/* Bars */}
      <div
        className="mt-10 rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: T.paper, border: `1px solid ${T.rule}` }}
      >
        <Bar label="Spending Safety" value={bars.spending} animate={barsAnimated} />
        <Bar label="Rest and Sleep" value={bars.rest} animate={barsAnimated} />
        <Bar label="Purpose and Ease" value={bars.purpose} animate={barsAnimated} />
      </div>

      {/* Two short sentences */}
      <div className="mt-8" style={{ maxWidth: 580 }}>
        <p className="text-[18px] leading-[1.6]" style={{ color: T.ink }}>
          {ARCHETYPE_LINE[archetype]}
        </p>
        <p className="mt-4 text-[18px] leading-[1.6]" style={{ color: T.inkSoft }}>
          The video below explains what's driving your score, and what shifts it.
        </p>
      </div>

      {/* Before-stress rating */}
      <div
        className="mt-12 rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: T.sageSoft, border: `1px solid ${T.sage}` }}
      >
        <h3
          className="text-[22px] sm:text-[26px] leading-[1.2]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
        >
          Before you watch, check in for a moment.
        </h3>
        <p className="mt-3 text-[16px] leading-[1.55]" style={{ color: T.inkSoft }}>
          From 0 to 10, how much stress, worry, or tension do you feel right now?
        </p>

        <div className="mt-6 grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }).map((_, i) => {
            const selected = stress === i;
            return (
              <button
                key={i}
                onClick={() => onStress(i)}
                className="focus-ring rounded-md text-[15px] font-medium"
                style={{
                  minHeight: 44,
                  backgroundColor: selected ? T.sageDeep : T.paper,
                  color: selected ? "#FBFAF5" : T.ink,
                  border: `1px solid ${selected ? T.sageDeep : T.rule}`,
                }}
                aria-label={`Stress ${i}`}
              >
                {i}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[13px]" style={{ color: T.muted }}>
          <span>None</span>
          <span>Very high</span>
        </div>
        <p className="mt-4 text-[14px]" style={{ color: T.muted }}>
          Chris will ask you to check this number again after the guided section.
        </p>
      </div>

      {/* Video section */}
      <div className="mt-12">
        <h3
          className="text-[26px] sm:text-[32px] leading-[1.18]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
        >
          If you're ready for change, watch this video.
        </h3>
        <p className="mt-3 text-[16px] leading-[1.55]" style={{ color: T.inkSoft }}>
          Chris will explain what your score means, then guide you through a short experience so
          you can feel the difference for yourself.
        </p>

        <div
          className="mt-6 relative overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "#1F2421",
            border: `1px solid ${T.rule}`,
            aspectRatio: "16 / 9",
          }}
        >
          {!videoPlaying ? (
            <button
              onClick={() => setVideoPlaying(true)}
              className="focus-ring absolute inset-0 flex items-center justify-center group"
              style={{
                background:
                  "linear-gradient(135deg, rgba(31,36,33,0.55) 0%, rgba(31,36,33,0.85) 100%)",
              }}
              aria-label="Play video"
            >
              <div
                className="flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
                style={{
                  width: 84,
                  height: 84,
                  backgroundColor: T.cta,
                  boxShadow: "0 10px 30px -8px rgba(0,0,0,.5)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#FBFAF5" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div
                className="absolute bottom-4 left-5 right-5 text-left text-[14px]"
                style={{ color: "#FBFAF5", opacity: 0.85 }}
              >
                Chris — a short message about your score
              </div>
            </button>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-center px-6"
              style={{ color: "#FBFAF5" }}
            >
              <div>
                <div className="text-[14px]" style={{ opacity: 0.7 }}>
                  Video player
                </div>
                <div className="mt-2 text-[16px]" style={{ opacity: 0.9 }}>
                  Your video will play here.
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-[14px]" style={{ color: T.muted }}>
          Or skip ahead. The button is below.
        </p>
      </div>

      {/* CTA */}
      <div
        className="mt-12 rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: T.paper, border: `1px solid ${T.rule}` }}
      >
        <div className="text-[12px] tracking-[0.22em]" style={{ color: T.sageDeep }}>
          THE OFF-DUTY RESET
        </div>
        <h3
          className="mt-3 text-[28px] sm:text-[34px] leading-[1.15]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.ink }}
        >
          Start the Off-Duty Reset
        </h3>
        <p className="mt-4 text-[16px] leading-[1.6]" style={{ color: T.inkSoft }}>
          Five short videos, each one addressing something specific sitting behind your score. A
          guided wind-down audio for the physical tension most people don't realise they're still
          carrying. Everything ships immediately.
        </p>

        <div
          className="mt-6 flex items-baseline gap-3"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          <div style={{ fontSize: 48, color: T.ink, lineHeight: 1 }}>$97</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "Inter, sans-serif" }}>
            one-time
          </div>
        </div>

        <button
          className="focus-ring mt-6 w-full rounded-[10px] text-[18px] font-medium"
          style={{
            backgroundColor: T.cta,
            color: "#FBFAF5",
            minHeight: 56,
            boxShadow: "0 1px 0 rgba(0,0,0,.08), 0 8px 18px -10px rgba(178,85,58,.55)",
          }}
          onClick={() => {
            // Hook up checkout here.
          }}
        >
          Get the Off-Duty Reset
        </button>

        {/* Guarantee */}
        <div
          className="mt-5 flex items-start gap-3 rounded-xl p-4"
          style={{ border: `1px solid ${T.sage}`, backgroundColor: T.sageSoft }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 36,
              height: 36,
              backgroundColor: T.sageDeep,
              color: "#FBFAF5",
              fontSize: 14,
              fontWeight: 600,
            }}
            aria-hidden
          >
            30
          </div>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: T.ink }}>
              30-day money-back guarantee.
            </div>
            <div className="text-[14px] mt-1 leading-[1.5]" style={{ color: T.inkSoft }}>
              If it doesn't help, email us within 30 days. Full refund, no questions.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bar({ label, value, animate }: { label: string; value: number; animate: boolean }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[15px] font-medium" style={{ color: T.ink }}>
          {label}
        </div>
        <div
          className="text-[16px]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: T.sageDeep }}
        >
          {value}
        </div>
      </div>
      <div className="h-[10px] w-full rounded-full" style={{ backgroundColor: T.bgDeep }}>
        <div
          className="h-full rounded-full"
          style={{
            width: animate ? `${value}%` : "0%",
            backgroundColor: T.sage,
            transition: "width 1.2s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </div>
    </div>
  );
}
