import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Retirement Reality Check" },
      {
        name: "description",
        content:
          "Are you financially free but emotionally still on duty? A 4-minute, 20-question honest look at where you really stand in retirement.",
      },
      { property: "og:title", content: "The Retirement Reality Check" },
      {
        property: "og:description",
        content:
          "An honest look at where you actually are in retirement — not just financially, but in the day-to-day.",
      },
    ],
  }),
  component: QuizApp,
});

/* ----------------------------- Types & Data ----------------------------- */

type Territory = "FINANCIAL" | "IDENTITY" | "RELATIONSHIPS" | "WELLBEING";

interface ScoredQ {
  kind: "scored";
  id: string;
  text: string;
  territory: Territory;
  reversed: boolean;
  partnerOnly?: boolean;
}
interface OpenQ {
  kind: "open";
  id: string;
  text: string;
  subtext: string;
  placeholder: string;
  cta: string;
  tag?: boolean;
}
interface ChoiceQ {
  kind: "choice";
  id: string;
  label: string;
  text: string;
  subtext?: string;
  options: string[];
  store: "retirementStage" | "partnerStatus";
}

type Question = ScoredQ | OpenQ | ChoiceQ;

const LIKERT = [
  "Strongly agree",
  "Agree",
  "Neutral",
  "Disagree",
  "Strongly disagree",
];

const QUESTIONS: Question[] = [
  {
    kind: "choice",
    id: "stage",
    label: "BEFORE WE START",
    text: "Where are you right now in this chapter of life?",
    subtext: "This adjusts a few of the questions that follow.",
    options: [
      "Still planning — more than 5 years out",
      "Getting close — 1 to 5 years out",
      "Just retired — less than a year in",
      "Early retirement — 1 to 3 years in",
      "Well into it — more than 3 years in",
    ],
    store: "retirementStage",
  },
  {
    kind: "choice",
    id: "partner",
    label: "ONE MORE THING",
    text: "Are you navigating this chapter on your own, or with a partner?",
    subtext:
      "If you have a partner, we'll include a few questions that are specific to your situation. This chapter looks very different depending on the answer.",
    options: ["With a partner or spouse", "On my own"],
    store: "partnerStatus",
  },
  { kind: "scored", id: "q3", text: "My advisor says I'm fine. My body hasn't gotten the memo.", territory: "FINANCIAL", reversed: false },
  { kind: "scored", id: "q4", text: "I find it hard to spend on myself, even on things I can clearly afford.", territory: "FINANCIAL", reversed: false },
  { kind: "scored", id: "q5", text: "I check my accounts more often than I really need to. I know I do. I check anyway.", territory: "FINANCIAL", reversed: false },
  { kind: "scored", id: "q6", text: "I know who I am without the job title.", territory: "IDENTITY", reversed: true },
  { kind: "scored", id: "q7", text: "I miss the structure more than I expected. The rhythm, the routine, knowing what day it is.", territory: "IDENTITY", reversed: false },
  { kind: "scored", id: "q8", text: "If I'm honest, most of my identity was tied up in the job.", territory: "IDENTITY", reversed: false },
  { kind: "scored", id: "q9", text: "My social life is quieter than I expected — and I didn't see that coming.", territory: "RELATIONSHIPS", reversed: false },
  { kind: "scored", id: "q10", text: "I miss the people. The easy daily contact that used to just happen.", territory: "RELATIONSHIPS", reversed: false },
  {
    kind: "open",
    id: "open1",
    text: "In your own words — what's the thing you don't usually say out loud about this chapter?",
    subtext: "Your answer is private. It helps us understand what's actually going on for people like you.",
    placeholder: "Type anything — there's no right answer here...",
    cta: "Continue →",
    tag: true,
  },
  { kind: "scored", id: "q11", text: "My partner and I see eye to eye on how we want to live in retirement.", territory: "RELATIONSHIPS", reversed: true, partnerOnly: true },
  { kind: "scored", id: "q12", text: "We've actually had the conversation — out loud — about what we each want this chapter to look like.", territory: "RELATIONSHIPS", reversed: true, partnerOnly: true },
  { kind: "scored", id: "q13", text: "There's been more tension between us since one or both of us stopped working.", territory: "RELATIONSHIPS", reversed: false, partnerOnly: true },
  { kind: "scored", id: "q14", text: "We spend time together in ways that feel genuinely close — not just sharing the same room.", territory: "RELATIONSHIPS", reversed: true, partnerOnly: true },
  { kind: "scored", id: "q15", text: "I feel as settled and at peace as I thought I would be by now.", territory: "WELLBEING", reversed: true },
  { kind: "scored", id: "q16", text: "I sometimes feel guilty about relaxing — like I haven't quite earned the right yet.", territory: "WELLBEING", reversed: false },
  { kind: "scored", id: "q17", text: "There are days when retirement feels more like unemployment than freedom.", territory: "WELLBEING", reversed: false },
  { kind: "scored", id: "q18", text: "I sleep through the night without money worries pulling me awake.", territory: "FINANCIAL", reversed: true },
  { kind: "scored", id: "q19", text: "There's a restlessness I carry. Quiet, hard to explain.", territory: "WELLBEING", reversed: false },
  { kind: "scored", id: "q20", text: "I have meaningful things to look forward to most weeks, things I actually care about.", territory: "WELLBEING", reversed: true },
  { kind: "scored", id: "q21", text: "I sometimes wonder what I'm working toward — now that work itself is behind me.", territory: "IDENTITY", reversed: false },
  { kind: "scored", id: "q22", text: "I genuinely believe the best of this life is still ahead.", territory: "WELLBEING", reversed: true },
  {
    kind: "open",
    id: "open2",
    text: "In one sentence — how would you describe retirement to a close friend right now?",
    subtext: "No wrong answers. This is the question we find most telling.",
    placeholder: "One honest sentence...",
    cta: "See my results →",
  },
];

const TERRITORY_STYLE: Record<Territory, { bg: string; fg: string }> = {
  FINANCIAL: { bg: "#FEF3EE", fg: "#A0380A" },
  IDENTITY: { bg: "#EEF2FF", fg: "#3730A3" },
  RELATIONSHIPS: { bg: "#F0FDF4", fg: "#166534" },
  WELLBEING: { bg: "#FDF4FF", fg: "#6B21A8" },
};

/* ----------------------------- Helpers ----------------------------- */

function tagOpenAnswer(text: string): string {
  const t = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => t.includes(w));
  if (has(["money", "spend", "savings", "afford", "financial", "account", "run out", "portfolio"])) return "financial";
  if (has(["alone", "lonely", "social", "friends", "people", "isolated", "connection"])) return "social";
  if (has(["purpose", "meaning", "point", "bored", "boring", "direction", "lost", "identity", "who am i"])) return "identity";
  if (has(["health", "sick", "ill", "body", "die", "death", "aging"])) return "health";
  return "general";
}

function analytics(event: string, data?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log("[analytics]", event, data ?? {});
}

/* ----------------------------- Root ----------------------------- */

type Screen = "intro" | "quiz" | "calculating" | "result";

function QuizApp() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [retirementStage, setRetirementStage] = useState<string>("");
  const [partnerStatus, setPartnerStatus] = useState<"partner" | "solo" | "">("");
  const [openAnswer1, setOpenAnswer1] = useState("");
  const [openAnswer2, setOpenAnswer2] = useState("");

  const flow = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (q.kind === "scored" && q.partnerOnly && partnerStatus !== "partner") return false;
      return true;
    });
  }, [partnerStatus]);

  const [idx, setIdx] = useState(0);

  // Progress: map index over flow length to 4%→86% range smoothly
  const progress = useMemo(() => {
    if (flow.length <= 1) return 4;
    const pct = 4 + ((idx) / (flow.length - 1)) * (86 - 4);
    return Math.min(86, Math.round(pct));
  }, [idx, flow.length]);

  function handleChoice(qid: string, value: string, store: "retirementStage" | "partnerStatus") {
    setAnswers((a) => ({ ...a, [qid]: value }));
    if (store === "retirementStage") setRetirementStage(value);
    if (store === "partnerStatus") {
      setPartnerStatus(value.toLowerCase().includes("partner") ? "partner" : "solo");
    }
    analytics("question_answered", { id: qid, value });
    setTimeout(() => goNext(), 300);
  }

  function handleScored(qid: string, raw: number) {
    setAnswers((a) => {
      const next = { ...a };
      if (raw <= 0) delete next[qid];
      else next[qid] = raw;
      return next;
    });
    analytics("question_answered", { id: qid, value: raw });
  }

  function handleOpen(qid: string, text: string, skipped: boolean) {
    if (qid === "open1") setOpenAnswer1(skipped ? "" : text);
    if (qid === "open2") setOpenAnswer2(skipped ? "" : text);
    analytics(skipped ? "open_question_skipped" : "open_question_answered", { id: qid });
    goNext();
  }

  function goNext() {
    setIdx((i) => {
      if (i >= flow.length - 1) {
        analytics("calculating_screen_shown");
        setScreen("calculating");
        return i;
      }
      return i + 1;
    });
  }

  function goBack() {
    setIdx((i) => Math.max(0, i - 1));
  }

  function startQuiz() {
    analytics("quiz_started");
    setScreen("quiz");
    setIdx(0);
  }

  /* ---------- Scoring ---------- */
  const { score, type, fastPath, openAnswer1Tag } = useMemo(() => {
    const scoredQs = flow.filter((q): q is ScoredQ => q.kind === "scored");
    let raw = 0;
    let max = 0;
    for (const q of scoredQs) {
      const v = answers[q.id];
      if (typeof v === "number") {
        raw += q.reversed ? 6 - v : v;
      }
      max += 5;
    }
    const normalised = max ? Math.round((raw / max) * 100) : 0;
    let t: "restless-operator" | "anxious-protector" | "identity-loss" | "grounded-explorer" = "grounded-explorer";
    if (normalised <= 35) t = "restless-operator";
    else if (normalised <= 52) t = "anxious-protector";
    else if (normalised <= 72) t = "identity-loss";
    return {
      score: normalised,
      type: t,
      fastPath: normalised <= 32,
      openAnswer1Tag: openAnswer1 ? tagOpenAnswer(openAnswer1) : "",
    };
  }, [answers, flow, openAnswer1]);

  return (
    <div className="min-h-screen bg-warm-bg text-warm-ink font-sans">
      {screen === "quiz" && <ProgressBar progress={progress} />}

      <AnimatePresence mode="wait">
        {screen === "intro" && <IntroScreen key="intro" onStart={startQuiz} />}

        {screen === "quiz" && (
          <QuizScreen
            key={`q-${idx}`}
            question={flow[idx]}
            qNumber={idx + 1}
            total={flow.length}
            answer={answers[flow[idx].id]}
            onChoice={handleChoice}
            onScored={handleScored}
            onOpen={handleOpen}
            onNext={goNext}
            onBack={idx > 0 ? goBack : undefined}
          />
        )}

        {screen === "calculating" && (
          <CalculatingScreen key="calc" onDone={() => setScreen("result")} />
        )}

        {screen === "result" && (
          <ResultPage
            key="result"
            score={score}
            type={type}
            fastPath={fastPath}
            openAnswer1Tag={openAnswer1Tag}
            retirementStage={retirementStage}
            partnerStatus={partnerStatus as "partner" | "solo"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- Progress Bar ----------------------------- */

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#EFE9E0] z-50">
      <div
        className="h-full bg-terracotta transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ----------------------------- Screen Wrapper ----------------------------- */

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------- Intro ----------------------------- */

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <ScreenWrap>
      <div className="w-full max-w-[480px] text-center">
        <h1 className="font-serif text-[34px] md:text-[44px] leading-tight text-warm-ink">
          The Retirement Reality Check
        </h1>
        <p
          className="font-serif italic text-[18px] mt-4"
          style={{ color: "#A0380A" }}
        >
          Are You Financially Free But Emotionally Still On Duty?
        </p>
        <div className="mt-8 text-[16px] leading-[1.7] text-warm-body space-y-4">
          <p>
            Most people spent 40 years getting the money right. Almost nobody planned
            the other part.
          </p>
          <p>
            This quiz gives you an honest look at where you actually are, not just
            financially but in the day-to-day. 20 questions, 6 real studies, about 4
            minutes.
          </p>
          <p>Your answers stay private.</p>
        </div>
        <div className="mt-10">
          <PrimaryButton onClick={onStart}>
            Find out where you really stand →
          </PrimaryButton>
          <p className="mt-3 text-[13px] text-warm-muted">
            Taken by 2,400 retirees this month
          </p>
        </div>
      </div>
    </ScreenWrap>
  );
}

/* ----------------------------- Buttons ----------------------------- */

function PrimaryButton({
  children,
  onClick,
  disabled,
  tall,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tall?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full max-w-[400px] mx-auto block rounded-[10px] font-sans font-medium text-white bg-terracotta transition-opacity duration-150 ${
        tall ? "h-[56px] text-[17px]" : "h-[52px] text-[16px]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:opacity-80"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-[400px] mx-auto block rounded-[10px] font-sans font-medium text-terracotta border border-terracotta bg-transparent h-[52px] text-[16px] hover:bg-terracotta-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg"
    >
      {children}
    </button>
  );
}

/* ----------------------------- Quiz Screen ----------------------------- */

function QuizScreen({
  question,
  qNumber,
  total,
  answer,
  onChoice,
  onScored,
  onOpen,
  onNext,
  onBack,
}: {
  question: Question;
  qNumber: number;
  total: number;
  answer: number | string | undefined;
  onChoice: (qid: string, value: string, store: "retirementStage" | "partnerStatus") => void;
  onScored: (qid: string, raw: number) => void;
  onOpen: (qid: string, text: string, skipped: boolean) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  return (
    <ScreenWrap>
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-5 left-5 text-[14px] text-warm-muted hover:text-warm-ink z-40"
        >
          ← Back
        </button>
      )}

      <div className="w-full max-w-[560px] mx-auto pt-6">
        {/* Label */}
        {question.kind === "choice" ? (
          <div className="text-[11px] tracking-[0.12em] uppercase text-warm-muted mb-3">
            {question.label}
          </div>
        ) : question.kind === "scored" ? (
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[11px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: TERRITORY_STYLE[question.territory].bg,
                color: TERRITORY_STYLE[question.territory].fg,
              }}
            >
              {question.territory}
            </span>
            <span className="text-[11px] tracking-[0.12em] uppercase text-warm-muted">
              Question {qNumber} of {total}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full font-medium bg-[#E7E5E4] text-warm-body">
              OPEN QUESTION
            </span>
          </div>
        )}

        {/* Question text */}
        <h2 className="font-serif text-[22px] md:text-[26px] leading-[1.45] text-warm-ink">
          {question.text}
        </h2>
        {"subtext" in question && question.subtext && (
          <p className="mt-3 text-[14px] text-warm-muted leading-relaxed">
            {question.subtext}
          </p>
        )}

        {/* Body */}
        <div className="mt-7">
          {question.kind === "choice" && (
            <div className="space-y-2.5">
              {question.options.map((opt) => {
                const selected = answer === opt;
                return (
                  <AnswerOption
                    key={opt}
                    selected={selected}
                    onClick={() =>
                      selected
                        ? null
                        : onChoice(question.id, opt, question.store)
                    }
                  >
                    {opt}
                  </AnswerOption>
                );
              })}
            </div>
          )}

          {question.kind === "scored" && (
            <ScoredOptions
              qid={question.id}
              current={typeof answer === "number" ? answer : null}
              onPick={(v) => onScored(question.id, v)}
              onNext={onNext}
            />
          )}

          {question.kind === "open" && (
            <OpenInput
              qid={question.id}
              cta={question.cta}
              placeholder={question.placeholder}
              onSubmit={(text, skipped) => onOpen(question.id, text, skipped)}
            />
          )}
        </div>
      </div>
    </ScreenWrap>
  );
}

function AnswerOption({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[48px] px-4 py-3 rounded-[10px] text-left text-[14px] font-sans border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1 focus-visible:ring-offset-warm-bg ${
        selected
          ? "border-terracotta bg-terracotta-soft text-terracotta font-medium"
          : "border-[#D6CFC6] bg-white text-warm-ink hover:border-warm-muted"
      }`}
      style={selected ? { borderWidth: 1.5 } : undefined}
    >
      {children}
    </button>
  );
}

function ScoredOptions({
  qid,
  current,
  onPick,
  onNext,
}: {
  qid: string;
  current: number | null;
  onPick: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="space-y-2.5">
        {LIKERT.map((label, i) => {
          const value = 5 - i; // Strongly agree=5 ... Strongly disagree=1
          const selected = current === value;
          return (
            <AnswerOption
              key={label}
              selected={selected}
              onClick={() => (selected ? onPick(0 as unknown as number) : onPick(value))}
            >
              {label}
            </AnswerOption>
          );
        })}
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onNext} disabled={!current}>
          Next →
        </PrimaryButton>
      </div>
      <input type="hidden" data-qid={qid} />
    </div>
  );
}

function OpenInput({
  qid,
  cta,
  placeholder,
  onSubmit,
}: {
  qid: string;
  cta: string;
  placeholder: string;
  onSubmit: (text: string, skipped: boolean) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[120px] p-4 rounded-[10px] bg-white border border-[#D6CFC6] text-[15px] text-warm-ink placeholder:text-warm-muted focus:outline-none focus:border-terracotta resize-none"
        data-qid={qid}
      />
      <div className="mt-5 sticky bottom-4">
        <PrimaryButton onClick={() => onSubmit(text.trim(), false)} disabled={text.trim().length === 0}>
          {cta}
        </PrimaryButton>
        <button
          onClick={() => onSubmit("", true)}
          className="block mx-auto mt-3 text-[14px] text-warm-muted hover:text-warm-ink underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Calculating ----------------------------- */

function CalculatingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 3600);
    const t3 = setTimeout(() => onDone(), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const lines = [
    { text: "Reading your answers...", strong: false },
    { text: "Identifying your pattern...", strong: false },
    { text: "Your result is ready.", strong: true },
  ];

  return (
    <ScreenWrap>
      <div className="text-center">
        <div
          className="mx-auto rounded-full bg-terracotta"
          style={{
            width: 60,
            height: 60,
            animation: "breathe 2s ease-in-out infinite",
          }}
        />
        <style>{`@keyframes breathe { 0%,100% { opacity: 0.3; transform: scale(0.92);} 50% { opacity: 1; transform: scale(1.05);} }`}</style>

        <div className="mt-10 space-y-3 min-h-[80px]">
          {lines.map((l, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= i ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className={
                l.strong
                  ? "text-[15px] text-warm-ink"
                  : "text-[14px] text-warm-muted"
              }
            >
              {l.text}
            </motion.p>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

/* ----------------------------- Result Page ----------------------------- */

type ResultType = "restless-operator" | "anxious-protector" | "identity-loss" | "grounded-explorer";

const TYPE_COPY: Record<
  ResultType,
  {
    name: string;
    tagline: string;
    body: string[];
    note: string;
    share: string;
  }
> = {
  "restless-operator": {
    name: "The Restless Operator",
    tagline: "Your body retired. Your nervous system didn't get the memo.",
    body: [
      "You're the person who knows the numbers are fine and checks them anyway. Who wakes up at 3am running scenarios that don't need running. Who still introduces themselves by what they used to do, because \"retired\" doesn't feel like a complete answer yet.",
      "You're carrying a 40-year pattern that nobody told you how to unwind. The brain that spent decades running on structure, purpose, and forward momentum is still scanning for all three. The money is the surface. Something else has been running underneath it the whole time.",
      "You're still on duty. And there is a way to clock out.",
    ],
    note: "This is one of the four most common retirement patterns. People who spent long careers in high-responsibility roles, managers, business owners, healthcare workers, teachers, land here most often. The bigger the job, the louder the quiet tends to get.",
    share: "I just took The Retirement Reality Check and got The Restless Operator. Retired on paper. Nervous system hasn't gotten the memo yet 😅 Uncomfortably accurate. Which type are you?",
  },
  "anxious-protector": {
    name: "The Anxious Protector",
    tagline: "You have the money. You just can't feel safe spending it.",
    body: [
      "You've done everything right. The plan is solid. The advisor has signed off. And yet every time you open the account, or think about booking something expensive, or watch the balance tick down even slightly, something in you tightens.",
      "Decades of conditioning built this response. You spent forty years in accumulation mode, saving and protecting and building a buffer against uncertainty. That system served you incredibly well. The catch is it has no off switch. The brain that built the nest egg is now guarding it as if there's still something to be afraid of.",
      "The spreadsheet is fine. What needs to change is what's running underneath it.",
    ],
    note: "Careful planners, savers, and people who grew up without financial security carry this pattern longer than they expect. It is far more common than it looks from the outside, and more fixable than it feels.",
    share: "Got The Anxious Protector on the Retirement Reality Check. Have the money. Can't feel safe spending it 😂 This quiz put words to it better than I could. What type are you?",
  },
  "identity-loss": {
    name: "The Identity-Loss Retiree",
    tagline: "You did everything right. That's almost the problem.",
    body: [
      "You planned carefully, looked forward to this, told people you were excited. And you were. But now that you're here, there's something underneath the freedom that feels more like waiting. Waiting for it to click. Waiting to feel like yourself again.",
      "Here's what nobody said on the way out: the job was doing far more than paying the bills. It was the place where your brain collected its daily proof that you mattered, that what you did made a difference. When that structure disappeared, it left a gap that three holidays and a garden project haven't quite filled.",
      "The best days are ahead of you. This transition has a name, and you're inside it. Most people who sit where you're sitting come out the other side with something they couldn't have found any other way.",
    ],
    note: "Former professionals, teachers, and anyone who found deep meaning in their work tend to land here. You're not alone, you're just earlier in the journey than you thought.",
    share: "Turns out I'm The Identity-Loss Retiree. Did everything right and still feel like something's off. This quiz put words to it better than I could. What type are you?",
  },
  "grounded-explorer": {
    name: "The Grounded Explorer",
    tagline: "You've figured something out that most people spend years circling.",
    body: [
      "You're not without worries. But you've found a way to hold them without being held by them. You have a sense of who you are that doesn't need a job title to back it up. Your days have texture, real things to look forward to, real people to look forward to them with.",
      "You built this, deliberately or through experience, and either way it counts. You're in the group researchers would call intentional retirees: people who carried meaning, structure, and connection forward into this chapter rather than leaving them at the office door.",
      "If something in this quiz surprised you, that's worth sitting with. Even grounded people have rooms worth opening.",
    ],
    note: "People who took the emotional side of retirement as seriously as the financial side tend to land here, as do people who had a harder start and came through it deliberately.",
    share: "Got The Grounded Explorer on the Retirement Reality Check. 4 minutes, surprisingly honest. What type does it give you?",
  },
};

const PERSONAL_PARAGRAPH: Record<string, string> = {
  financial:
    "You mentioned money specifically. That's the most common answer we get, and the most misunderstood one. The worry lives in the nervous system, not the balance sheet. Your body spent decades in accumulation mode. The account changed. The wiring didn't.",
  social:
    "You mentioned connection, or the lack of it. Most people don't see this coming. The job was delivering most of their daily human contact, quietly, without anyone flagging it. When it ended, so did the infrastructure. That's a real loss. Most retirement planning doesn't name it.",
  identity:
    "You mentioned purpose or direction. The job was doing more than paying the bills. It was delivering daily proof that you mattered, that what you did made a difference. Without that structure, the question of who you are in this chapter can feel surprisingly loud.",
  health:
    "You mentioned health. That fear tends to sit underneath financial and identity concerns and amplify everything else. The nervous system reads uncertainty about health the same way it reads any other threat. Which is part of why the body keeps score long after the mind has moved on.",
  general:
    "Whatever you wrote, the fact that you wrote something suggests this quiz landed somewhere real. Most people carry this quietly. Few of them name it, even to themselves.",
};

function scoreIntro(score: number) {
  if (score <= 35) return "That's telling us something. Read what it means carefully.";
  if (score <= 52) return "There's more going on beneath the surface than most people around you would guess.";
  if (score <= 72) return "You're managing well most days. Something is still settling.";
  return "You've navigated this better than most. Here's what that means.";
}

function ResultPage({
  score,
  type,
  fastPath,
  openAnswer1Tag,
  retirementStage,
  partnerStatus,
}: {
  score: number;
  type: ResultType;
  fastPath: boolean;
  openAnswer1Tag: string;
  retirementStage: string;
  partnerStatus: "partner" | "solo";
}) {
  const copy = TYPE_COPY[type];

  useEffect(() => {
    analytics("result_page_loaded", { score, type });
  }, [score, type]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-12 pb-20 px-5"
    >
      <div className="max-w-[640px] mx-auto">
        {/* Section 1 — Score */}
        <div className="flex flex-col items-center text-center">
          <ScoreRing score={score} />
          <p className="mt-2 text-[13px] text-warm-muted">out of 100</p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-serif italic text-[20px] mt-8 max-w-[420px] mx-auto"
            style={{ color: "#44403C" }}
          >
            {scoreIntro(score)}
          </motion.p>
        </div>

        {/* Section 2 — Type */}
        <div className="mt-14">
          <h2 className="font-serif text-[32px] text-terracotta leading-tight">
            {copy.name}
          </h2>
          <p className="font-serif italic text-[18px] mt-2 text-warm-body">
            {copy.tagline}
          </p>
          <div className="mt-6 space-y-5 text-[16px] text-warm-body leading-[1.75] max-w-[560px]">
            {copy.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 text-[13px] italic text-warm-muted leading-relaxed max-w-[560px]">
            {copy.note}
          </p>
        </div>

        {/* Section 3 — Personalised */}
        {openAnswer1Tag && (
          <div
            className="mt-10 rounded-[12px] p-6"
            style={{ backgroundColor: "#F0EBE3" }}
          >
            <p className="font-sans italic text-[15px] text-warm-body leading-[1.75]">
              {PERSONAL_PARAGRAPH[openAnswer1Tag]}
            </p>
          </div>
        )}

        {/* Section 4 — Insight cards */}
        <div className="mt-10 space-y-5">
          <InsightCard
            heading="The body keeps score"
            body={[
              "More than 4 in 10 retirees say financial anxiety disrupts their sleep, even people whose own advisors have told them they're completely fine.",
              "Your nervous system didn't read the financial plan. That gap between the numbers and the feeling has a name. And it can be closed.",
            ]}
          />
          <InsightCard
            heading="Purpose and the years ahead"
            body={[
              "Retirees with a strong sense of purpose live, on average, about seven years longer, with significantly less depression, memory loss, and serious illness.",
              "For your nervous system, purpose functions closer to oxygen than inspiration. And it can be built deliberately, at any stage of this chapter.",
            ]}
          />
        </div>

        {/* Section 5 — Video */}
        <div className="mt-12">
          <VideoPlaceholder />
          <p className="mt-3 text-[14px] text-warm-muted text-center">
            2 min 47 sec · No signup required
          </p>
        </div>

        {/* Email capture */}
        <EmailCapture
          score={score}
          type={type}
          openAnswer1Tag={openAnswer1Tag}
          retirementStage={retirementStage}
          partnerStatus={partnerStatus}
        />

        {/* Section 6 — Offer */}
        <div
          className="mt-12 pt-10 border-t"
          style={{ borderColor: "#D6CFC6" }}
        >
          <p className="text-[11px] tracking-[0.12em] uppercase text-warm-muted">
            The next step
          </p>
          <h3 className="font-serif text-[26px] mt-2 text-warm-ink">
            The Off-Duty Reset
          </h3>
          <p className="font-sans italic text-[16px] text-warm-muted mt-2">
            A short bingeable guide to the things this quiz just surfaced
          </p>
          <div className="mt-6 space-y-5 text-[15px] text-warm-body leading-[1.75] max-w-[520px]">
            <p>
              Five short videos. Each one covers a specific pattern that gets in the way
              of actually enjoying this chapter: financial anxiety, the identity gap,
              sleep, the dopamine drop from leaving work, and the social world that
              quietly disappeared.
            </p>
            <p>
              Each video follows the same structure. Here is the problem. Here is how it
              is affecting your day-to-day. Here is what to do about it. Here is why it
              works. The why is what most retirement content never reaches.
            </p>
            <p>
              Also included: a guided wind-down protocol for before bed, built around
              nervous system training. People tend to describe the first night
              differently from anything they've tried before.
            </p>
          </div>

          <p className="font-serif text-[36px] text-terracotta mt-8">$27</p>
          <p className="text-[13px] text-warm-muted mt-1">
            One-time. Instant access. No subscription.
          </p>

          <div className="mt-6">
            <PrimaryButton tall onClick={() => analytics("offer_cta_clicked")}>
              Get instant access →
            </PrimaryButton>
            <p className="mt-3 text-[13px] text-warm-muted text-center">
              Secure checkout · Instant delivery
            </p>
          </div>
        </div>

        {/* Section 6B — Fast path */}
        {fastPath && (
          <div
            className="mt-6 bg-white rounded-[8px] p-5 md:p-6"
            style={{ borderLeft: "3px solid #C2440E" }}
          >
            <p className="text-[15px] text-warm-body leading-[1.7]">
              Your result puts you in the group where a conversation tends to be more
              useful than a guide. If you'd like to talk through what your score means
              for your specific situation, book a call below. We'll bring context. You
              bring questions.
            </p>
            <div className="mt-5">
              <SecondaryButton onClick={() => analytics("fastpath_cta_clicked")}>
                Book a free 20-minute call →
              </SecondaryButton>
            </div>
          </div>
        )}

        {/* Section 7 — Share */}
        <ShareBlock shareText={copy.share} />
      </div>
    </motion.div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const size = 140;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const start = performance.now();
    const dur = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = c - (animated / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EFE9E0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#C2440E"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-serif text-[48px] text-warm-ink">
        {animated}
      </div>
    </div>
  );
}

function InsightCard({ heading, body }: { heading: string; body: string[] }) {
  return (
    <div className="rounded-[12px] p-6" style={{ backgroundColor: "#F0EBE3" }}>
      <p className="text-[11px] tracking-[0.12em] uppercase text-warm-muted">
        What the research shows
      </p>
      <h4 className="font-serif text-[18px] mt-2 text-warm-ink">{heading}</h4>
      <div className="mt-3 space-y-3 text-[15px] text-warm-body leading-[1.7]">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <button
      onClick={() => analytics("video_play_clicked")}
      className="block w-full rounded-[12px] overflow-hidden relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg"
      style={{ aspectRatio: "16/9", backgroundColor: "#1C1917" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-terracotta flex items-center justify-center group-hover:scale-105 transition-transform">
          <svg width="22" height="24" viewBox="0 0 22 24" fill="white">
            <path d="M21 12L0 24V0L21 12Z" />
          </svg>
        </div>
        <p className="text-white text-[15px] font-sans px-6 text-center">
          Watch: Why this happens, and what actually fixes it
        </p>
      </div>
    </button>
  );
}

function EmailCapture({
  score,
  type,
  openAnswer1Tag,
  retirementStage,
  partnerStatus,
}: {
  score: number;
  type: ResultType;
  openAnswer1Tag: string;
  retirementStage: string;
  partnerStatus: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!email.includes("@")) return;
    analytics("email_captured", {
      email,
      score,
      type,
      openAnswer1Tag,
      retirementStage,
      partnerStatus,
    });
    setDone(true);
  }

  return (
    <div
      className="mt-12 bg-white rounded-[12px] p-5 md:p-6"
      style={{ border: "1px solid #D6CFC6" }}
    >
      {done ? (
        <p className="text-[15px] text-warm-ink text-center py-2">
          Done — check your inbox.
        </p>
      ) : (
        <>
          <p className="text-[15px] text-warm-ink">
            Want us to email you your result plus a short summary of what it means?
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="mt-4 w-full h-[48px] px-4 rounded-[10px] border border-[#D6CFC6] bg-warm-bg text-[15px] focus:outline-none focus:border-terracotta"
          />
          <div className="mt-3">
            <PrimaryButton onClick={submit} disabled={!email.includes("@")}>
              Send my result →
            </PrimaryButton>
          </div>
          <p className="mt-3 text-[12px] text-warm-muted text-center">
            No spam. Unsubscribe any time. We use this to send you relevant follow-ups
            based on your result type.
          </p>
        </>
      )}
    </div>
  );
}

function ShareBlock({ shareText }: { shareText: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const fullShare = `${shareText} ${url}`;

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      analytics("share_clicked", { platform: "copy" });
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareFb() {
    analytics("share_clicked", { platform: "facebook" });
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url,
    )}&quote=${encodeURIComponent(fullShare)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="mt-10 rounded-[12px] p-6"
      style={{ backgroundColor: "#F0EBE3" }}
    >
      <h4 className="font-serif text-[18px] text-warm-ink">
        Know someone who should take this?
      </h4>
      <p className="text-[14px] text-warm-muted mt-2">
        Share your result type and let them find out where they land.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={shareFb}
          className="h-[48px] rounded-[10px] bg-[#1877F2] text-white text-[15px] font-medium hover:opacity-90 transition-opacity"
        >
          Share on Facebook
        </button>
        <button
          onClick={copyLink}
          className="h-[48px] rounded-[10px] border border-terracotta text-terracotta text-[15px] font-medium hover:bg-terracotta-soft transition-colors"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
