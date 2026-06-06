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
          "A four-minute self-assessment for people who planned the financial side of retirement well but have not quite felt it yet in practice.",
      },
      { property: "og:title", content: "The Retirement Reality Check — Now Off Duty" },
      {
        property: "og:description",
        content:
          "You have enough. So why can't you bring yourself to touch it? A four-minute self-assessment.",
      },
    ],
  }),
  component: OffDutyAssessment,
});

// ---------- Content ----------

type ScoredQuestion = {
  id: string;
  category: string;
  text: string;
  low: string;
  high: string;
  reversed?: boolean;
  partnerOnly?: boolean;
};

type OpenQuestion = {
  id: string;
  text: string;
  subtext?: string;
  placeholder: string;
};

const SCORED_ALL: ScoredQuestion[] = [
  {
    id: "q1",
    category: "FINANCIAL",
    text: "I find it hard to spend on myself, even on things I can clearly afford.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q2",
    category: "FINANCIAL",
    text: "I check my accounts more often than I really need to. I know I do. I check anyway.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q3",
    category: "FINANCIAL",
    text: "I sleep through the night without money worries pulling me awake.",
    low: "Rarely",
    high: "Almost always",
    reversed: true,
  },
  {
    id: "q4",
    category: "WELLBEING",
    text: "I sometimes feel guilty about relaxing, like I haven't quite earned the right yet.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q5",
    category: "WELLBEING",
    text: "My body feels settled and at ease on most days.",
    low: "Not really",
    high: "Yes, mostly",
    reversed: true,
  },
  {
    id: "q6",
    category: "IDENTITY",
    text: "If I'm honest, most of my identity was tied up in the job.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q7",
    category: "IDENTITY",
    text: "There are days when retirement feels more like unemployment than freedom.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q8",
    category: "IDENTITY",
    text: "I sometimes wonder what I'm working toward, now that work itself is behind me.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q9",
    category: "IDENTITY",
    text: "I miss the structure more than I expected. The rhythm, the routine, knowing what day it is.",
    low: "Very true for me",
    high: "Rarely true for me",
  },
  {
    id: "q10",
    category: "RELATIONSHIPS",
    text: "I miss the people. The easy daily contact that used to just happen.",
    low: "I miss it a lot",
    high: "I have found new connection",
  },
  {
    id: "q11",
    category: "RELATIONSHIPS",
    text: "My partner and I see eye to eye on how we want to live in retirement.",
    low: "Not really",
    high: "Yes, mostly",
    reversed: true,
    partnerOnly: true,
  },
  {
    id: "q12",
    category: "WELLBEING",
    text: "I genuinely believe the best of this life is still ahead.",
    low: "I am not sure",
    high: "Yes, strongly",
    reversed: true,
  },
];

const OPEN_QUESTIONS: OpenQuestion[] = [
  {
    id: "openAnswer1",
    text: "In your own words, what is the thing you don't usually say out loud about this chapter?",
    subtext:
      "Your answer is private. It helps us understand what is actually going on for people like you.",
    placeholder: "Type anything. There is no right answer here.",
  },
  {
    id: "openAnswer2",
    text: "In one sentence, how would you describe retirement to a close friend right now?",
    placeholder: "Just one sentence is fine.",
  },
];

// ---------- Onboarding ----------

const STAGES = [
  { value: "planning_5plus", label: "Still planning, more than 5 years out" },
  { value: "close_1_5", label: "Getting close, 1 to 5 years out" },
  { value: "just_retired", label: "Just retired, less than a year in" },
  { value: "early_1_3", label: "Early retirement, 1 to 3 years in" },
  { value: "well_in_3plus", label: "Well into it, more than 3 years in" },
];

const PARTNER_OPTIONS = [
  { value: "partner", label: "With a partner or spouse" },
  { value: "solo", label: "On my own" },
];

// ---------- Scoring ----------

function adjustedScore(q: ScoredQuestion, raw: number) {
  return q.reversed ? 10 - raw : raw;
}

function tagOpenAnswer(text: string): "financial" | "social" | "identity" | "health" | "general" {
  const t = text.toLowerCase();
  const match = (words: string[]) => words.some((w) => t.includes(w));
  if (
    match(["money", "spend", "savings", "afford", "financial", "account", "run out", "portfolio"])
  )
    return "financial";
  if (match(["alone", "lonely", "social", "friends", "people", "isolated", "connection"]))
    return "social";
  if (
    match([
      "purpose",
      "meaning",
      "point",
      "bored",
      "boring",
      "direction",
      "lost",
      "identity",
      "who am i",
    ])
  )
    return "identity";
  if (match(["health", "sick", "ill", "body", "die", "death", "aging"])) return "health";
  return "general";
}

function scoreRangeLabel(score: number) {
  if (score <= 39) return "Retirement Does Not Feel Safe Yet";
  if (score <= 59) return "Still Running on Work Mode";
  if (score <= 79) return "Mostly There, Something Is Holding You Back";
  return "Mostly Ready, With One Pattern Worth Watching";
}

type ResultKey = "restless" | "anxious" | "identity" | "grounded";

const CLUSTERS: Record<Exclude<ResultKey, "grounded">, string[]> & {
  grounded: string[];
} = {
  anxious: ["q1", "q2", "q3"],
  restless: ["q4", "q5"],
  identity: ["q6", "q7", "q8", "q9"],
  grounded: ["q10", "q12"], // q11 added when partner
};

function determineResultType(
  scores: Record<string, number>,
  questions: ScoredQuestion[],
  overallScore: number,
  partnerStatus: string,
): ResultKey {
  if (overallScore >= 75) return "grounded";

  const byId = new Map(questions.map((q) => [q.id, q]));
  const groundedIds =
    partnerStatus === "partner" ? [...CLUSTERS.grounded, "q11"] : CLUSTERS.grounded;
  const clusters: Record<ResultKey, string[]> = {
    anxious: CLUSTERS.anxious,
    restless: CLUSTERS.restless,
    identity: CLUSTERS.identity,
    grounded: groundedIds,
  };

  let bestKey: ResultKey = "anxious";
  let bestAvg = Infinity;
  (Object.keys(clusters) as ResultKey[]).forEach((key) => {
    const ids = clusters[key].filter((id) => byId.has(id));
    const vals = ids.map((id) => adjustedScore(byId.get(id)!, scores[id] ?? 5));
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestKey = key;
    }
  });
  return bestKey;
}

const RESULT_COPY: Record<
  ResultKey,
  { heading: string; body: string[]; note: string; share: string }
> = {
  restless: {
    heading: "Your body retired. Your nervous system did not get the memo.",
    body: [
      "You are the person who knows the numbers are fine and checks them anyway. Who wakes up at 3am running scenarios that do not need running. Who still introduces themselves by what they used to do, because retired does not feel like a complete answer yet.",
      "You are carrying a 40-year pattern that nobody told you how to unwind. The brain that spent decades running on structure, purpose, and forward momentum is still scanning for all three. The money is the surface. Something else has been running underneath it the whole time.",
      "You are still on duty. And there is a way to clock out.",
    ],
    note: "People who spent long careers in high-responsibility roles, managers, business owners, healthcare workers, teachers, land here most often. The bigger the job, the louder the quiet tends to get.",
    share:
      "I just took The Retirement Reality Check and got The Restless Operator. Retired on paper. Nervous system has not gotten the memo yet. Uncomfortably accurate. Which type are you?",
  },
  anxious: {
    heading: "You have the money. You just cannot feel safe spending it.",
    body: [
      "You have done everything right. The plan is solid. The advisor has signed off. And yet every time you open the account, or think about booking something expensive, or watch the balance tick down even slightly, something in you tightens.",
      "Decades of conditioning built this response. You spent forty years in accumulation mode, saving and protecting and building a buffer against uncertainty. That system served you incredibly well. The catch is it has no off switch. The brain that built the nest egg is now guarding it as if there is still something to be afraid of.",
      "The spreadsheet is fine. What needs to change is what is running underneath it.",
    ],
    note: "Careful planners, savers, and people who grew up without financial security carry this pattern longer than they expect. It is far more common than it looks from the outside, and more fixable than it feels.",
    share:
      "Got The Anxious Protector on the Retirement Reality Check. Have the money. Cannot feel safe spending it. This quiz put words to it better than I could. What type are you?",
  },
  identity: {
    heading: "You did everything right. That is almost the problem.",
    body: [
      "You planned carefully, looked forward to this, told people you were excited. And you were. But now that you are here, there is something underneath the freedom that feels more like waiting. Waiting for it to click. Waiting to feel like yourself again.",
      "Here is what nobody said on the way out. The job was doing far more than paying the bills. It was the place where your brain collected its daily proof that you mattered, that what you did made a difference. When that structure disappeared, it left a gap that three holidays and a garden project have not quite filled.",
      "The best days are ahead of you. This transition has a name, and you are inside it. Most people who sit where you are sitting come out the other side with something they could not have found any other way.",
    ],
    note: "Former professionals, teachers, and anyone who found deep meaning in their work tend to land here. You are not alone, you are just earlier in the journey than you thought.",
    share:
      "Turns out I am The Identity-Loss Retiree. Did everything right and still feel like something is off. This quiz put words to it better than I could. What type are you?",
  },
  grounded: {
    heading: "You have figured something out that most people spend years circling.",
    body: [
      "You are not without worries. But you have found a way to hold them without being held by them. You have a sense of who you are that does not need a job title to back it up. Your days have texture, real things to look forward to, real people to look forward to them with.",
      "You built this, deliberately or through experience, and either way it counts. You are in the group researchers would call intentional retirees: people who carried meaning, structure, and connection forward into this chapter rather than leaving them at the office door.",
      "If something in this quiz surprised you, that is worth sitting with. Even grounded people have rooms worth opening.",
    ],
    note: "People who took the emotional side of retirement as seriously as the financial side tend to land here, as do people who had a harder start and came through it deliberately.",
    share:
      "Got The Grounded Explorer on the Retirement Reality Check. Four minutes, surprisingly honest. What type does it give you?",
  },
};

const RESULT_TITLES: Record<ResultKey, string> = {
  restless: "The Restless Operator",
  anxious: "The Anxious Protector",
  identity: "The Identity-Loss Retiree",
  grounded: "The Grounded Explorer",
};

type TagKey = "financial" | "social" | "identity" | "health" | "general";

const PERSONALIZED: Record<TagKey, string> = {
  financial:
    "You mentioned money specifically. That is the most common answer we get, and the most misunderstood one. The worry lives in the nervous system. Your body spent decades in accumulation mode. The account changed. The wiring did not.",
  social:
    "You mentioned connection, or the lack of it. Most people do not see this coming. The job was delivering most of their daily human contact, quietly, without anyone flagging it. When it ended, so did the infrastructure. That is a real loss. Most retirement planning does not name it.",
  identity:
    "You mentioned purpose or direction. The job was doing more than paying the bills. It was delivering daily proof that you mattered, that what you did made a difference. Without that structure, the question of who you are in this chapter can feel surprisingly loud.",
  health:
    "You mentioned health. That fear tends to sit underneath financial and identity concerns and amplify everything else. The nervous system reads uncertainty about health the same way it reads any other threat. Which is part of why the body keeps score long after the mind has moved on.",
  general:
    "Whatever you wrote, the fact that you wrote something suggests this quiz landed somewhere real. Most people carry this quietly. Few of them name it, even to themselves.",
};

type ResultLong = {
  scoreContext: string;
  oldFrame: string[];
  patternInterrupt: string[];
  reframe: string[];
  identityShiftLead: string;
  identityShiftBody: string;
  futurePacingLead: string;
  futurePacingBody: string[];
  ctaContext: string;
  share: string;
  testimonial: { name: string; role: string; quote: string; initials: string };
};

const RESULT_LONG: Record<ResultKey, ResultLong> = {
  restless: {
    scoreContext:
      "Your score puts you in the group carrying the heaviest invisible load in retirement. Here's what that means.",
    oldFrame: [
      "There's a story most people in your position carry quietly.",
      "It goes something like this: I've always been like this. I was the responsible one, the one who stayed on top of everything, the one who didn't let things slip. That's not going to change at 65. Some people are just wired this way.",
      "You've probably said something close to that, at least to yourself.",
    ],
    patternInterrupt: [
      "Here's what that story misses.",
      "The vigilance was never who you are. It was a tool your nervous system learned. A tool your career specifically required across four decades of real professional pressure. The same system that learned to stay on duty in response to demand can learn something else in response to different conditions. You didn't choose to be wired this way. You were trained into it. And training moves in both directions.",
    ],
    reframe: [
      "The restlessness you're carrying is a conditioned physiological response that has outlasted the conditions that created it. Your body is still protecting a career that ended. Still scanning for threats that are no longer there. Still on the clock for a job that has been done.",
      "That's something to address at the level where it actually lives, not with willpower or gratitude journals.",
    ],
    identityShiftLead:
      "Underneath the vigilance is someone who knows how to operate at a very high level. That person never went anywhere.",
    identityShiftBody:
      "They just got stuck in one mode. The version of you that books the trip and feels the anticipation. That sits across from your partner in the evening with your chest actually settled. That wakes up on a Thursday with nowhere to be and feels, for the first time in a long time, like that's exactly right. That person is the same person who built everything you have. They just need the system to stand down.",
    futurePacingLead: "Take a moment with this.",
    futurePacingBody: [
      "Six weeks from now. Thursday morning. No schedule. Coffee ready. Your partner still asleep. And you notice: the first thought is not about the account, not about what you should be doing, not about what happens if something goes sideways.",
      "The first thought is about what you actually want to do with the morning.",
      "You're just there. Present. Off duty for the first time in forty years. That person is not a different version of you. It's you, with the right conditions finally in place.",
    ],
    ctaContext:
      "You spent forty years building this life. This is how you finally get to live inside it.",
    share:
      "I just took The Retirement Reality Check and got The Restless Operator. Retired on paper. Nervous system hasn't gotten the memo yet 😅 Uncomfortably accurate. Which type are you?",
    testimonial: {
      name: "David R.",
      role: "Former regional director, 4 years retired",
      initials: "DR",
      quote:
        "I thought I was just an anxious person. The first video explained exactly what had been running underneath everything for three years. The nighttime audio changed my sleep within the first week. My wife noticed before I did.",
    },
  },
  anxious: {
    scoreContext:
      "Your score tells us something specific about where the discomfort is actually coming from. It's worth understanding.",
    oldFrame: [
      "Most people in your position hold a version of this belief without quite examining it.",
      "I'm just careful with money. That's a virtue. My parents raised me to save, and that's not wrong. Being thoughtful about spending is the responsible thing at this stage. I'd rather have it and not need it.",
      "There's real wisdom in that. And something else is happening alongside it.",
    ],
    patternInterrupt: [
      "Careful people can book the trip and enjoy it.",
      "What you're describing is different. Opening the account after the advisor already told you it was fine. The tightening when the balance moves, even slightly, in the expected direction. The calculation that starts before you've consciously decided to think about money.",
      "That's a nervous system still running protection protocols after the threat has been gone for years. Those are different conditions. They have different solutions.",
    ],
    reframe: [
      "The behavior you've been calling responsibility is a conditioned physiological response. Your body spent four decades in accumulation mode, treating every outgoing dollar as one fewer standing between you and vulnerability. That system was brilliant for building what you have. It was built for a different era of your life, and it never got the memo that the era changed.",
      "The money is fine. Something else is running the anxiety, and that something else has a name.",
    ],
    identityShiftLead:
      "There is a version of you who built everything you have and knows, in their body, that it's there to be used.",
    identityShiftBody:
      "Not reckless. Not indifferent to the future. But settled. The person who looks at a trip your partner has been mentioning for three years and feels anticipation before calculation. Who spends money on something and experiences, somewhere physical, the knowledge that they earned it. That person built the same nest egg you have. They just have a different relationship with the permission to use it.",
    futurePacingLead: "Picture this specifically.",
    futurePacingBody: [
      "You and your partner are sitting with a plan for something you've talked about for years. And the first thing that moves in you is not the math. The protection mode doesn't engage. The quiet voice asking whether this is really responsible stays quiet.",
      "What you feel is the anticipation. Just that. You book it. And it feels like it was always yours to book.",
      "Because it was.",
    ],
    ctaContext: "You built this for a reason. This is how it starts to feel like yours.",
    share:
      "Got The Anxious Protector on the Retirement Reality Check. Have the money. Can't feel safe spending it 😂 This quiz put words to it better than I could. What type are you?",
    testimonial: {
      name: "Margaret S.",
      role: "Former practice manager, 2 years retired",
      initials: "MS",
      quote:
        "My advisor kept telling me I was fine. I knew the number was fine. This was the first thing that explained why fine didn't feel fine. I booked the trip we'd been talking about for six years. Felt different than I expected.",
    },
  },
  identity: {
    scoreContext:
      "Your score sits in the range where the gap between expected and actual is widest. That gap has a name, and it closes.",
    oldFrame: [
      "Here's the story most people in your position tell themselves, usually quietly.",
      "My work was my purpose. That chapter is over. I need to find a hobby or something to fill the time. Maybe this is just what retirement feels like for people who were serious about their careers. Maybe this is just what happens.",
      "It's an understandable story. And it's the wrong diagnosis.",
    ],
    patternInterrupt: [
      "Your identity was never actually your job title.",
      "The job title was an address. A place you agreed to let your sense of self live for forty years because the arrangement worked and nobody questioned it. The person who showed up and did that work every day was always more than the role. The role just got all the credit.",
      "What you're grieving is the container you'd been using to store who you are. The container ended. You didn't.",
    ],
    reframe: [
      "The loss you're feeling points somewhere specific. The job was running identity functions it was never designed to run permanently: daily proof that you mattered, that your presence made a difference, that there was a reason to bring your full self to the morning. Those functions are real. They don't go away. They need a different structure to live inside.",
      "The feeling of waiting, of something not clicking, is the gap between those needs and the new structure that hasn't been built yet. That's a construction problem. Not a character problem.",
    ],
    identityShiftLead:
      "The person you were at your best in that career, the one with the judgment, the experience, the ability to walk into a room and read what was actually happening, that person didn't retire.",
    identityShiftBody:
      "They're just unattached at the moment. Looking for somewhere worth landing. The version of you on the other side of this has a sense of themselves that belongs to them. Fully. Not borrowed from a payroll, not contingent on a title, not dependent on a room of people who needed them. That version already exists. It's closer than it feels.",
    futurePacingLead:
      "Imagine being introduced to someone new. A dinner, a conversation, somewhere you didn't expect.",
    futurePacingBody: [
      "They ask who you are.",
      "And what comes to mind first is not the role you held for thirty-five years. Something else surfaces. Something that's yours, that doesn't require a context to make sense, that the person across from you leans toward because it's genuinely interesting.",
      "You answer. And you mean it.",
      "That moment is available. It's not far from where you are right now.",
    ],
    ctaContext: "The next chapter is yours. This is how it starts to feel that way.",
    share:
      "Turns out I'm The Identity-Loss Retiree. Did everything right and still feel like something's off. This quiz put words to it better than I could. What type are you?",
    testimonial: {
      name: "Robert K.",
      role: "Former school principal, 18 months retired",
      initials: "RK",
      quote:
        "I kept waiting for it to click. The identity video was the first thing that put language to it without making me feel broken. My daughter said I seem more like myself. That was the moment I knew something had actually shifted.",
    },
  },
  grounded: {
    scoreContext:
      "Your score puts you in a group that most people take years to reach. Here's what that tells us, and what's still worth exploring.",
    oldFrame: [
      "People who land where you landed often carry a version of this.",
      "I've done the work. I've figured out the main things. I'm in a good place. There's probably not much left to examine here.",
      "That's mostly accurate. And it has one blind spot.",
    ],
    patternInterrupt: [
      "The retirees who stay grounded over time are not the ones who arrived and stopped. They're the ones who kept examining, kept refining, kept finding the smaller things worth addressing before they became larger ones.",
      "The ones who thought they'd arrived tend to drift, quietly, across the following years. The settling that looks like peace slowly becomes complacency. Your score earned you something real. It didn't earn you a full stop.",
    ],
    reframe: [
      "What your result actually tells us is that you've done the hardest part. The foundational work is there. What remains is refinement, and refinement at this stage compounds. A slightly better night's sleep. One conversation with your partner that's been waiting. One corner of the week that still feels different from the rest.",
      "There's also something else worth sitting with.",
    ],
    identityShiftLead: "Someone close to you didn't get your result today.",
    identityShiftBody:
      "A partner working through something they're not fully naming. A sibling a few years behind you in this chapter, carrying the restlessness or the identity confusion or the spending anxiety that you navigated. A close friend who says they're fine in a way that sounds exactly like not fine. You've figured something out that has real value to the people around you. The Grounded Explorer who passes the right thing to the right person at the right time is doing something that matters.",
    futurePacingLead:
      "Picture a conversation six months from now with someone you care about who's struggling with this transition.",
    futurePacingBody: [
      "You're not just listening. You have something concrete to give them. A framework that names what they're going through, language that makes them feel seen, and something they can do about it tonight.",
      "That's a different kind of conversation than telling them it'll get easier.",
    ],
    ctaContext:
      "Go deeper on what's already working. Or give someone close to you the thing you wish you'd had earlier.",
    share:
      "Got The Grounded Explorer on the Retirement Reality Check. 4 minutes, surprisingly honest. What type does it give you?",
    testimonial: {
      name: "Carol M.",
      role: "Retired, 5 years in",
      initials: "CM",
      quote:
        "I expected to get nothing from it since I thought I'd worked through most of this already. One video surprised me. I sent it to my husband the same day. He watched the whole series.",
    },
  },
};

// ---------- Screen types ----------

type Screen =
  | { kind: "landing" }
  | { kind: "onboard"; i: 0 | 1 }
  | { kind: "scored"; i: number }
  | { kind: "halfway" }
  | { kind: "open"; i: 0 | 1 }
  | { kind: "insight" }
  | { kind: "result" };

function OffDutyAssessment() {
  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [retirementStage, setRetirementStage] = useState<string>("");
  const [partnerStatus, setPartnerStatus] = useState<string>("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const history = useRef<Screen[]>([]);

  const questions = useMemo(
    () => SCORED_ALL.filter((q) => !q.partnerOnly || partnerStatus === "partner"),
    [partnerStatus],
  );
  const totalQuestions = questions.length + OPEN_QUESTIONS.length;

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

  // Overall score 0-100
  const { totalScore, scoredCount } = useMemo(() => {
    let sum = 0;
    let max = 0;
    questions.forEach((q) => {
      const raw = scores[q.id];
      if (raw === undefined) return;
      sum += adjustedScore(q, raw);
      max += 10;
    });
    // Use full possible max so partial states don't inflate
    const fullMax = questions.length * 10;
    const score = fullMax ? Math.round((sum / fullMax) * 100) : 0;
    return { totalScore: score, scoredCount: max / 10 };
  }, [scores, questions]);

  const resultKey = useMemo(
    () => determineResultType(scores, questions, totalScore, partnerStatus),
    [scores, questions, totalScore, partnerStatus],
  );
  const openAnswer1Tag = useMemo(
    () => tagOpenAnswer(openAnswers.openAnswer1 ?? ""),
    [openAnswers.openAnswer1],
  );

  // Progress for top bar
  const progress = (() => {
    if (screen.kind === "scored") return ((screen.i + 1) / totalQuestions) * 100;
    if (screen.kind === "halfway") return (7 / totalQuestions) * 100;
    if (screen.kind === "open") return ((questions.length + screen.i + 1) / totalQuestions) * 100;
    if (screen.kind === "insight") return 100;
    return 0;
  })();

  const showProgress =
    screen.kind === "scored" ||
    screen.kind === "halfway" ||
    screen.kind === "open";
  const isSagePage = screen.kind === "insight" || screen.kind === "result";
  const hideFooter = screen.kind === "insight";

  const currentLabel = (() => {
    if (screen.kind === "scored") return `Question ${screen.i + 1} of ${totalQuestions}`;
    if (screen.kind === "halfway") return "Halfway";
    if (screen.kind === "open")
      return `Question ${questions.length + screen.i + 1} of ${totalQuestions}`;
    if (screen.kind === "insight") return "Almost done";
    return "";
  })();

  const advanceFromScored = (i: number) => {
    // Halfway shows after scored question 7 (index 6)
    if (i === 6) go({ kind: "halfway" });
    else if (i === questions.length - 1) go({ kind: "open", i: 0 });
    else go({ kind: "scored", i: i + 1 });
  };

  return (
    <main
      className="min-h-screen text-[var(--color-ink)]"
      style={{ backgroundColor: isSagePage ? "#F0F5F4" : "var(--color-paper)" }}
    >
      {showProgress && (
        <ProgressBar
          value={progress}
          label={currentLabel}
          onBack={history.current.length ? back : undefined}
        />
      )}

      {screen.kind === "result" ? (
        <Result
          score={totalScore}
          resultKey={resultKey}
          openAnswer1Tag={openAnswer1Tag}
          retirementStage={retirementStage}
          partnerStatus={partnerStatus}
        />
      ) : screen.kind === "insight" ? (
        <Calculating onDone={() => go({ kind: "result" })} />
      ) : (
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
                <Landing onStart={() => go({ kind: "onboard", i: 0 })} />
              )}

              {screen.kind === "onboard" && screen.i === 0 && (
                <OnboardingChoice
                  label="BEFORE WE START"
                  question="Where are you right now in this chapter of life?"
                  subtext="This adjusts a few of the questions that follow."
                  options={STAGES}
                  value={retirementStage}
                  onSelect={(v) => {
                    setRetirementStage(v);
                    window.setTimeout(() => go({ kind: "onboard", i: 1 }), 220);
                  }}
                />
              )}

              {screen.kind === "onboard" && screen.i === 1 && (
                <OnboardingChoice
                  label="ONE MORE THING"
                  question="Are you navigating this chapter on your own, or with a partner?"
                  options={PARTNER_OPTIONS}
                  value={partnerStatus}
                  onSelect={(v) => {
                    setPartnerStatus(v);
                    window.setTimeout(() => go({ kind: "scored", i: 0 }), 220);
                  }}
                />
              )}

              {screen.kind === "scored" && questions[screen.i] && (
                <ScoredScreen
                  q={questions[screen.i]}
                  index={screen.i + 1}
                  total={totalQuestions}
                  value={scores[questions[screen.i].id]}
                  onSelect={(v) => {
                    const id = questions[screen.i].id;
                    setScores((s) => ({ ...s, [id]: v }));
                    const i = screen.i;
                    window.setTimeout(() => advanceFromScored(i), 280);
                  }}
                />
              )}

              {screen.kind === "halfway" && (
                <Halfway onNext={() => go({ kind: "scored", i: 7 })} />
              )}

              {screen.kind === "open" && (
                <OpenScreen
                  q={OPEN_QUESTIONS[screen.i]}
                  index={questions.length + screen.i + 1}
                  total={totalQuestions}
                  value={openAnswers[OPEN_QUESTIONS[screen.i].id] ?? ""}
                  onChange={(v) =>
                    setOpenAnswers((o) => ({
                      ...o,
                      [OPEN_QUESTIONS[screen.i].id]: v,
                    }))
                  }
                  onContinue={() => {
                    if (screen.i === 0) go({ kind: "open", i: 1 });
                    else go({ kind: "insight" });
                  }}
                  onSkip={() => {
                    setOpenAnswers((o) => {
                      const n = { ...o };
                      delete n[OPEN_QUESTIONS[screen.i].id];
                      return n;
                    });
                    if (screen.i === 0) go({ kind: "open", i: 1 });
                    else go({ kind: "insight" });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <span className="hidden">{scoredCount}</span>
        </div>
      )}

      {!hideFooter && screen.kind !== "result" && <Footer />}
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

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
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
      <h1 className="font-serif text-[40px] leading-[1.08] sm:text-[60px] sm:leading-[1.02] tracking-tight text-[var(--color-ink)]">
        You have enough.
        <br />
        <em className="italic text-[var(--color-accent)]">So why don’t you feel safe?</em>
      </h1>
      <p className="mt-8 text-[18px] sm:text-[19px] leading-[1.7] text-[var(--color-ink-soft)] max-w-xl mx-auto">
        A four-minute self-assessment to find the sticking points that may be keeping retirement
        from feeling as safe, calm, and enjoyable as it should.
      </p>
      <p className="mt-4 text-[15px] text-[var(--color-muted-ink)]">
        Twelve questions. Two open ones. Your answers stay private.
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

function OnboardingChoice({
  label,
  question,
  subtext,
  options,
  value,
  onSelect,
}: {
  label: string;
  question: string;
  subtext?: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <section className="pt-6">
      <div className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-5">
        {label}
      </div>
      <h2 className="font-serif text-[30px] leading-[1.2] sm:text-[40px] sm:leading-[1.15] text-[var(--color-ink)]">
        {question}
      </h2>
      {subtext && (
        <p className="mt-4 text-[15px] text-[var(--color-muted-ink)] italic">{subtext}</p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={selected}
              className={`min-h-[60px] text-left px-6 py-4 rounded-xl border text-[17px] leading-snug transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                selected
                  ? "bg-[var(--color-accent)] text-[var(--color-paper)] border-[var(--color-accent)]"
                  : "bg-[var(--color-card)] text-[var(--color-ink)] border-[var(--color-rule)] hover:border-[var(--color-accent)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScoredScreen({
  q,
  index,
  total,
  value,
  onSelect,
}: {
  q: ScoredQuestion;
  index: number;
  total: number;
  value: number | undefined;
  onSelect: (v: number) => void;
}) {
  return (
    <section className="pt-2">
      <div className="flex items-center gap-3 text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)] mb-5">
        <span>
          Question {index} of {total}
        </span>
        <span className="h-1 w-1 rounded-full bg-[var(--color-rule)]" />
        <span className="text-[var(--color-accent)]">{q.category}</span>
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
        Most people spend years planning the financial side of retirement. Almost nobody plans for
        what retirement actually feels like once it arrives. Your answers so far are already telling
        us something.
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onNext}>Keep going</PrimaryButton>
      </div>
    </section>
  );
}

function OpenScreen({
  q,
  index,
  total,
  value,
  onChange,
  onContinue,
  onSkip,
}: {
  q: OpenQuestion;
  index: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="pt-2">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[12px] tracking-[0.22em] uppercase text-[var(--color-muted-ink)]">
          Question {index} of {total}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-[11px] tracking-[0.18em] uppercase font-medium">
          Open Question
        </span>
      </div>
      <h2 className="font-serif text-[26px] leading-[1.25] sm:text-[34px] sm:leading-[1.2] text-[var(--color-ink)]">
        {q.text}
      </h2>
      {q.subtext && (
        <p className="mt-4 text-[15px] text-[var(--color-muted-ink)] italic">{q.subtext}</p>
      )}
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

function Calculating({ onDone }: { onDone: () => void }) {
  const [showStep, setShowStep] = useState(0); // 0,1,2
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowStep(1), 1500);
    const t2 = window.setTimeout(() => setShowStep(2), 3000);
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
        backgroundColor: "#F0F5F4",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 240,
          height: 6,
          borderRadius: 999,
          backgroundColor: "#D4E2E0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#5B8F85",
            borderRadius: 999,
            width: "100%",
            transformOrigin: "left center",
            animation: "calcBarFill 3.5s ease-out forwards",
          }}
        />
      </div>
      <style>{`@keyframes calcBarFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes calcFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div className="mt-8 flex flex-col items-center gap-3 text-center" style={{ minHeight: 110 }}>
        <div
          style={{
            fontSize: 15,
            color: "#5C6B6A",
            opacity: showStep >= 0 ? 1 : 0,
            animation: "calcFadeIn 0.5s ease-out",
          }}
        >
          Reading your answers…
        </div>
        {showStep >= 1 && (
          <div style={{ fontSize: 15, color: "#5C6B6A", animation: "calcFadeIn 0.5s ease-out" }}>
            Matching your pattern…
          </div>
        )}
        {showStep >= 2 && (
          <div
            style={{
              fontSize: 16,
              color: "#1C1917",
              fontWeight: 500,
              animation: "calcFadeIn 0.5s ease-out",
            }}
          >
            Your result is ready.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Results page tokens ----------
const R = {
  bg: "#F0F5F4",
  card: "#FFFFFF",
  cardAlt: "#E8EEF0",
  barFill: "#5B8F85",
  barTrack: "#D4E2E0",
  ink: "#1C1917",
  muted: "#5C6B6A",
  rule: "#D4E2E0",
  cta: "#C2440E",
  body: "#44403C",
  sage: "#5B8F85",
};
const SANS = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: R.muted,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

function Result({
  score,
  resultKey,
  openAnswer1Tag,
  retirementStage,
  partnerStatus,
}: {
  score: number;
  resultKey: ResultKey;
  openAnswer1Tag: TagKey;
  retirementStage: string;
  partnerStatus: string;
}) {
  const title = RESULT_TITLES[resultKey];
  const long = RESULT_LONG[resultKey];
  const showFastPath = score <= 32;
  const showPersonalized = openAnswer1Tag !== "general";

  const [displayScore, setDisplayScore] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [buyerEntered, setBuyerEntered] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * score));
      setBarWidth(eased * score);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const onBuyClick = () => {
    setBuyerEntered(true);
    // CTA placeholder
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const onFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(long.share)}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
  };
  const onCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // analytics: email_capture_submitted; payload includes email, score, type, tag, stage, partner
    void { email, score, resultKey, openAnswer1Tag, retirementStage, partnerStatus };
    setEmailSubmitted(true);
  };

  return (
    <div
      style={{ backgroundColor: R.bg, color: R.ink, fontFamily: SANS, paddingBottom: 96 }}
      className="min-h-screen"
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 560, padding: "24px 20px 28px" }}
      >
        {/* Brand label */}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: R.muted,
            fontWeight: 500,
          }}
        >
          NEW HORIZONS
        </div>

        {/* Type name */}
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 34,
            lineHeight: 1.1,
            color: R.ink,
            marginTop: 12,
            fontWeight: 400,
          }}
          className="sm:!text-[44px]"
        >
          {title}
        </h1>

        {/* Score section */}
        <div style={{ marginTop: 20 }}>
          <div className="flex items-center justify-between">
            <Label>YOUR READINESS SCORE</Label>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 28,
                color: R.ink,
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              {displayScore}
              <span style={{ color: R.muted, fontSize: 18 }}>/100</span>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              width: "100%",
              height: 10,
              backgroundColor: R.barTrack,
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barWidth}%`,
                height: "100%",
                backgroundColor: R.barFill,
                borderRadius: 5,
                transition: "background-color 0.3s",
              }}
            />
          </div>
          <p
            style={{
              marginTop: 12,
              fontFamily: SANS,
              fontSize: 15,
              lineHeight: 1.55,
              color: R.muted,
            }}
          >
            {long.scoreContext}
          </p>
        </div>

        {/* Video thumbnail */}
        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setVideoPlaying(true)}
            aria-label="Play video"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: "#2a3a3a",
              backgroundImage:
                "linear-gradient(135deg, #4a5e5b 0%, #6b8480 40%, #8aa39e 100%)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "block",
            }}
          >
            {!videoPlaying ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="22" height="26" viewBox="0 0 22 26" fill={R.ink}>
                    <path d="M2 2 L20 13 L2 24 Z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontFamily: SANS,
                  fontSize: 14,
                }}
              >
                Video would play here
              </div>
            )}
          </button>
          <div
            style={{
              marginTop: 8,
              textAlign: "center",
              fontFamily: SANS,
              fontSize: 13,
              color: R.muted,
            }}
          >
            3 min · No signup required
          </div>
        </div>

        {/* Section A — Old Frame + Section B — Pattern Interrupt + Reframe */}
        <div style={{ marginTop: 32 }}>
          {long.oldFrame.map((p, i) => (
            <p key={`of${i}`} style={paraStyle()}>
              {p}
            </p>
          ))}
          {long.patternInterrupt.map((p, i) => (
            <p key={`pi${i}`} style={paraStyle()}>
              {p}
            </p>
          ))}
          {long.reframe.map((p, i) => (
            <p key={`rf${i}`} style={paraStyle()}>
              {p}
            </p>
          ))}
        </div>

        {/* Section C — Identity Shift */}
        <div style={{ marginTop: 28 }}>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.45,
              color: R.ink,
              margin: 0,
            }}
          >
            {long.identityShiftLead}
          </p>
          <p style={{ ...paraStyle(), marginTop: 14 }}>{long.identityShiftBody}</p>
        </div>

        {/* Section D — Personalised */}
        {showPersonalized && (
          <div
            style={{
              marginTop: 28,
              backgroundColor: R.card,
              border: `1px solid ${R.rule}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Label>BASED ON WHAT YOU SHARED</Label>
            <p
              style={{
                marginTop: 10,
                fontFamily: SANS,
                fontStyle: "italic",
                fontSize: 16,
                lineHeight: 1.55,
                color: R.body,
              }}
            >
              {PERSONALIZED[openAnswer1Tag]}
            </p>
          </div>
        )}

        {/* Section E — Future Pacing */}
        <div
          style={{
            marginTop: 28,
            backgroundColor: R.card,
            borderRadius: 12,
            padding: "24px 20px",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.45,
              color: R.ink,
              margin: 0,
            }}
          >
            {long.futurePacingLead}
          </p>
          {long.futurePacingBody.map((p, i) => (
            <p
              key={`fp${i}`}
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontFamily: SANS,
                fontSize: 16,
                lineHeight: 1.65,
                color: R.ink,
              }}
            >
              {p}
            </p>
          ))}
        </div>

        {/* Section F — Insight cards */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              h: "The body keeping score",
              b: "More than 4 in 10 retirees say financial anxiety disrupts their sleep, even people whose own advisors have told them they're completely fine. Your nervous system didn't read the financial plan. That gap between the numbers and the feeling has a name. And it can be closed.",
            },
            {
              h: "Purpose and the years ahead",
              b: "Retirees with a strong sense of purpose live, on average, about seven years longer, with significantly less depression, memory loss, and serious illness. For your nervous system, purpose functions closer to oxygen than inspiration. And it can be built deliberately, at any stage of this chapter.",
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                backgroundColor: R.cardAlt,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Label>WHAT THE RESEARCH SHOWS</Label>
              <h3
                style={{
                  marginTop: 8,
                  fontFamily: SERIF,
                  fontSize: 18,
                  lineHeight: 1.25,
                  color: R.ink,
                  fontWeight: 400,
                }}
              >
                {c.h}
              </h3>
              <p
                style={{
                  marginTop: 10,
                  fontFamily: SANS,
                  fontSize: 16,
                  lineHeight: 1.65,
                  color: R.body,
                }}
              >
                {c.b}
              </p>
            </div>
          ))}
        </div>

        {/* Section G — Product offer */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 28,
            borderTop: `1px solid ${R.rule}`,
          }}
        >
          <Label>THE NEXT STEP</Label>
          <h2
            style={{
              marginTop: 8,
              fontFamily: SERIF,
              fontSize: 26,
              lineHeight: 1.2,
              color: R.ink,
              fontWeight: 400,
            }}
          >
            The Off-Duty Reset
          </h2>
          <p
            style={{
              marginTop: 6,
              fontFamily: SANS,
              fontStyle: "italic",
              fontSize: 16,
              color: R.muted,
              lineHeight: 1.5,
            }}
          >
            A short bingeable guide to the things this quiz just surfaced
          </p>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={offerParaStyle()}>
              Five short videos. Each one covers a specific pattern that gets in the way of actually
              enjoying this chapter: financial anxiety, the identity gap, sleep, the dopamine drop
              from leaving work, and the social world that quietly disappeared.
            </p>
            <p style={offerParaStyle()}>
              Each video follows the same structure. Here is the problem. Here is how it is
              affecting your day-to-day. Here is what to do about it. Here is why it works. The why
              is what most retirement content never reaches.
            </p>
            <p style={offerParaStyle()}>
              Also included: a guided wind-down protocol for before bed, built around nervous system
              science. People tend to describe the first night differently from anything they have
              tried before.
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              fontFamily: SERIF,
              fontSize: 38,
              color: R.cta,
              lineHeight: 1,
              fontWeight: 500,
            }}
          >
            $27
          </div>
          <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 14, color: R.muted }}>
            One-time. Instant access. No subscription.
          </div>

          {/* Guarantee badge */}
          <div
            style={{
              marginTop: 16,
              backgroundColor: R.card,
              border: `1px solid ${R.sage}`,
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z"
                stroke={R.sage}
                strokeWidth="1.8"
                fill="none"
              />
              <path d="M8.5 12 L11 14.5 L16 9.5" stroke={R.sage} strokeWidth="1.8" fill="none" />
            </svg>
            <div style={{ fontFamily: SANS, fontSize: 14, color: R.ink, lineHeight: 1.45 }}>
              <div style={{ fontWeight: 500 }}>30-Day Money-Back Guarantee</div>
              <div style={{ color: R.muted, fontWeight: 400 }}>
                If it doesn't help, email us. Full refund, no questions.
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div
            style={{
              marginTop: 20,
              backgroundColor: R.card,
              border: `1px solid ${R.rule}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: R.cardAlt,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 20,
                  color: R.ink,
                  flexShrink: 0,
                }}
              >
                {long.testimonial.initials}
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: R.ink, fontWeight: 500 }}>
                  {long.testimonial.name}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: R.muted }}>
                  {long.testimonial.role}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={R.cta}>
                  <path d="M12 2 L14.6 9 L22 9.5 L16.2 14.2 L18 21.5 L12 17.5 L6 21.5 L7.8 14.2 L2 9.5 L9.4 9 Z" />
                </svg>
              ))}
            </div>
            <p
              style={{
                marginTop: 10,
                fontFamily: SANS,
                fontStyle: "italic",
                fontSize: 16,
                lineHeight: 1.6,
                color: R.body,
              }}
            >
              "{long.testimonial.quote}"
            </p>
          </div>

          <p
            style={{
              marginTop: 16,
              fontFamily: SANS,
              fontSize: 15,
              lineHeight: 1.55,
              color: R.muted,
            }}
          >
            {long.ctaContext}
          </p>

          {/* Inline CTA */}
          <button
            type="button"
            onClick={onBuyClick}
            style={{
              marginTop: 12,
              width: "100%",
              height: 56,
              borderRadius: 10,
              backgroundColor: R.cta,
              color: "#FFFFFF",
              fontFamily: SANS,
              fontSize: 17,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get the Off-Duty Reset — $27 →
          </button>
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: SANS,
              fontSize: 13,
              color: R.muted,
            }}
          >
            Secure checkout · Instant delivery · 30-day guarantee
          </div>
        </div>

        {/* Section K — Email capture (lead magnet) */}
        {!buyerEntered && (
          <div
            style={{
              marginTop: 28,
              backgroundColor: R.card,
              border: `1px solid ${R.rule}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Label>NOT READY YET?</Label>
            <h3
              style={{
                marginTop: 8,
                fontFamily: SERIF,
                fontSize: 22,
                lineHeight: 1.25,
                color: R.ink,
                fontWeight: 400,
              }}
            >
              We'll send you the first video free.
            </h3>
            <p
              style={{
                marginTop: 10,
                fontFamily: SANS,
                fontSize: 16,
                lineHeight: 1.65,
                color: R.body,
              }}
            >
              Tell us where to send it and we'll email you the video from the guide that matches
              your result type. No payment. No catch. Just the part most relevant to where you are
              right now.
            </p>
            {emailSubmitted ? (
              <div
                style={{
                  marginTop: 16,
                  textAlign: "center",
                  fontFamily: SANS,
                  fontSize: 15,
                  color: R.sage,
                }}
              >
                Done. Check your inbox — it'll be there in a few minutes.
              </div>
            ) : (
              <form onSubmit={onEmailSubmit} style={{ marginTop: 16 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 8,
                    border: `1px solid ${R.rule}`,
                    fontFamily: SANS,
                    fontSize: 16,
                    color: R.ink,
                    padding: "0 14px",
                    backgroundColor: "#fff",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    marginTop: 10,
                    width: "100%",
                    height: 52,
                    borderRadius: 8,
                    backgroundColor: R.ink,
                    color: "#fff",
                    border: "none",
                    fontFamily: SANS,
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Send me the free video →
                </button>
              </form>
            )}
            <div
              style={{
                marginTop: 10,
                textAlign: "center",
                fontFamily: SANS,
                fontSize: 12,
                color: R.muted,
              }}
            >
              No spam. Unsubscribe any time.
            </div>
          </div>
        )}

        {/* Section L — Share */}
        <div
          style={{
            marginTop: 28,
            backgroundColor: R.cardAlt,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              color: R.ink,
              fontWeight: 400,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            Know someone who should take this?
          </h3>
          <p
            style={{
              marginTop: 8,
              fontFamily: SANS,
              fontSize: 15,
              color: R.muted,
              lineHeight: 1.55,
            }}
          >
            Share your result type and let them find out where they land.
          </p>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={onFacebook}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 10,
                backgroundColor: "#1877F2",
                color: "#fff",
                border: "none",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Share on Facebook
            </button>
            <button
              type="button"
              onClick={onCopyLink}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 10,
                backgroundColor: "#fff",
                color: R.ink,
                border: `1px solid ${R.rule}`,
                fontFamily: SANS,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </div>

        {/* Section M — Fast path */}
        {showFastPath && (
          <div
            style={{
              marginTop: 24,
              backgroundColor: R.card,
              borderLeft: `3px solid ${R.cta}`,
              borderRadius: 8,
              padding: "20px 20px 20px 24px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: 16,
                color: R.body,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Your result puts you in the group where a conversation tends to be more useful than a
              guide. If you want to talk through what your score means for your specific situation,
              you can book a call below. Bring your questions. We'll bring context.
            </p>
            <button
              type="button"
              style={{
                marginTop: 16,
                width: "100%",
                height: 52,
                borderRadius: 10,
                backgroundColor: "#fff",
                border: `1.5px solid ${R.cta}`,
                color: R.cta,
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Book a free 20-minute call →
            </button>
          </div>
        )}
      </div>

      {/* Sticky CTA bar — mobile only */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: R.cta,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px calc(env(safe-area-inset-bottom, 0px)) 16px",
          zIndex: 50,
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.3,
            flex: 1,
            paddingRight: 12,
          }}
        >
          {title} · {score}/100
        </div>
        <button
          type="button"
          onClick={onBuyClick}
          style={{
            backgroundColor: "#fff",
            color: R.cta,
            borderRadius: 6,
            padding: "10px 18px",
            border: "none",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Get the guide — $27 →
        </button>
      </div>
    </div>
  );
}

function paraStyle(): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 16,
    lineHeight: 1.6,
    color: R.ink,
    marginTop: 14,
    marginBottom: 0,
  };
}
function offerParaStyle(): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 16,
    lineHeight: 1.75,
    color: R.body,
    margin: 0,
  };
}


function Footer() {
  return (
    <footer className="border-t border-[var(--color-rule)] py-10 text-center">
      <div className="font-serif italic text-[18px] text-[var(--color-ink)]">Now Off Duty</div>
      <div className="mt-1 text-[13px] tracking-[0.18em] uppercase text-[var(--color-muted-ink)]">
        nowoffduty.com
      </div>
    </footer>
  );
}
