import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Circle, Flame, LockKeyhole, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AudioPlayer } from "@/components/meditation/audio-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { friendlyMeditationError } from "@/lib/meditation/error-messages";
import { DailyContent, Member, PairStreak, PracticeLog } from "@/lib/meditation/types";
import {
  firstName,
  formatDuration,
  greetingFor,
  localCompletionDate,
  timezoneLabel,
} from "@/lib/meditation/time";
import { allTimezoneOptions, defaultTimezone } from "@/lib/meditation/timezones";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Now Off Duty" }] }),
  component: Dashboard,
});

type DashboardState = {
  member: Member;
  buddies: Member[];
  content: DailyContent[];
  unlockedContentIds: Set<string>;
  logs: PracticeLog[];
  streak: PairStreak | null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DashboardState | null>(null);
  const [message, setMessage] = useState("");
  const [missingProfileEmail, setMissingProfileEmail] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }

    setMissingProfileEmail("");
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (memberError) throw memberError;
    if (!member) {
      setMissingProfileEmail(user.email ?? "this email");
      setState(null);
      setLoading(false);
      return;
    }

    if (member.role === "admin") {
      await navigate({ to: "/admin", replace: true });
      return;
    }

    if (!member.cohort_id) {
      setState({
        member: member as Member,
        buddies: [],
        content: [],
        unlockedContentIds: new Set(),
        logs: [],
        streak: null,
      });
      setLoading(false);
      return;
    }

    const { data: pairRows } = await supabase
      .from("buddy_pair_members")
      .select("pair_id, member_id, members(*)")
      .eq("member_id", user.id);
    const pairId = pairRows?.[0]?.pair_id as string | undefined;

    const [allPairMembers, content, progress, streak] = await Promise.all([
      pairId
        ? supabase.from("buddy_pair_members").select("member_id, members(*)").eq("pair_id", pairId)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("daily_content")
        .select("*")
        .eq("cohort_id", member.cohort_id)
        .order("day_number", { ascending: true }),
      pairId
        ? supabase.from("pair_content_progress").select("content_id").eq("pair_id", pairId)
        : Promise.resolve({ data: [], error: null }),
      pairId
        ? supabase.from("pair_streaks").select("*").eq("pair_id", pairId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const pairMemberIds = ((allPairMembers.data ?? []) as Array<{ member_id: string }>).map(
      (row) => row.member_id,
    );
    const logs = pairMemberIds.length
      ? await supabase.from("practice_logs").select("*").in("member_id", pairMemberIds)
      : await supabase.from("practice_logs").select("*").eq("member_id", user.id);

    const loadError =
      content.error || progress.error || streak.error || logs.error || allPairMembers.error;
    if (loadError) throw loadError;

    const buddies = ((allPairMembers.data ?? []) as Array<{ member_id: string; members: Member }>)
      .filter((row) => row.member_id !== user.id)
      .map((row) => row.members);

    setState({
      member: member as Member,
      buddies,
      content: (content.data ?? []) as DailyContent[],
      unlockedContentIds: new Set(
        (progress.data ?? []).map((row: { content_id: string }) => row.content_id),
      ),
      logs: (logs.data ?? []) as PracticeLog[],
      streak: streak.data as PairStreak | null,
    });
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadDashboard().catch((error) => {
      setMessage(
        friendlyMeditationError(
          error,
          "Dashboard could not load. Refresh the page and sign in again if needed.",
        ),
      );
      setLoading(false);
    });
  }, [loadDashboard]);

  const current = useMemo(() => {
    if (!state) return null;
    return (
      state.content.find(
        (item) => state.unlockedContentIds.has(item.id) && !jointCompleted(state, item.id),
      ) ??
      state.content.find((item) => state.unlockedContentIds.has(item.id)) ??
      state.content[0] ??
      null
    );
  }, [state]);

  async function saveOnboarding(fullName: string, timezone: string, password: string) {
    if (!state) return;
    if (password.trim().length >= 8) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;
    }
    const { error } = await supabase
      .from("members")
      .update({ full_name: fullName, timezone, onboarded: true })
      .eq("id", state.member.id);
    if (error) throw error;
    await loadDashboard();
  }

  async function completeCurrent() {
    if (!state || !current || hasCompleted(state, state.member.id, current.id)) return;
    const { error } = await supabase.rpc("complete_practice", {
      content_uuid: current.id,
      percent: 90,
      completed_when: new Date().toISOString(),
    });
    if (error) {
      setMessage(
        friendlyMeditationError(error, "Completion did not save. Refresh the page and try again."),
      );
      return;
    }
    setMessage("Practice complete. Checking your pair status now.");
    await loadDashboard();
  }

  if (loading)
    return (
      <PortalFrame>
        <p>Loading your dashboard...</p>
      </PortalFrame>
    );
  if (!hasSupabaseConfig())
    return (
      <PortalFrame>
        <p>Supabase is not configured yet.</p>
      </PortalFrame>
    );
  if (missingProfileEmail) return <MissingMemberProfile email={missingProfileEmail} />;
  if (!state)
    return (
      <PortalFrame>
        <p>{message || "Dashboard unavailable."}</p>
      </PortalFrame>
    );
  if (!state.member.cohort_id) {
    return (
      <PortalFrame>
        <section className="mx-auto max-w-3xl rounded-[8px] border bg-card p-6">
          <h1 className="font-serif text-[48px] leading-none">
            Your member profile is being set up.
          </h1>
          <p className="mt-4 text-[18px] text-muted-foreground">
            Your account exists, but it has not been assigned to a cohort yet. Chris needs to add
            you to a cohort before today&apos;s practice appears here.
          </p>
        </section>
      </PortalFrame>
    );
  }
  if (!state.member.onboarded) return <Onboarding member={state.member} onSave={saveOnboarding} />;
  if (state.buddies.length === 0) {
    return (
      <PortalFrame>
        <section className="mx-auto max-w-3xl rounded-[8px] border bg-card p-6">
          <h1 className="font-serif text-[48px] leading-none">Your partner is being set up.</h1>
          <p className="mt-4 text-[18px] text-muted-foreground">
            You are in the cohort, but your accountability pair is not assigned yet. Once Chris runs
            auto-pairing, today&apos;s practice will appear here.
          </p>
        </section>
      </PortalFrame>
    );
  }
  if (state.content.length === 0) {
    return (
      <PortalFrame>
        <section className="mx-auto max-w-3xl rounded-[8px] border bg-card p-6">
          <h1 className="font-serif text-[48px] leading-none">Content is being prepared.</h1>
          <p className="mt-4 text-[18px] text-muted-foreground">
            Your cohort is ready, but daily audio has not been loaded yet. Once Day 1 content is
            added, your practice dashboard will open here.
          </p>
        </section>
      </PortalFrame>
    );
  }

  const today = localCompletionDate(state.member.timezone);
  const buddyDone = state.buddies.every(
    (buddy) => current && hasCompleted(state, buddy.id, current.id),
  );
  const memberDone = current ? hasCompleted(state, state.member.id, current.id) : false;
  const unlocked = current ? state.unlockedContentIds.has(current.id) : false;
  const completedDays = state.logs.filter((log) => log.member_id === state.member.id).length;
  const week = current?.week_number ?? 1;

  return (
    <PortalFrame>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-[17px] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-2 font-serif text-[48px] leading-none sm:text-[62px]">
            Good {greetingFor()}, {firstName(state.member.full_name)}.
          </h1>
          <p className="mt-4 text-[20px] text-muted-foreground">
            {current
              ? `Day ${current.day_number} - Week ${current.week_number}`
              : "Content is being prepared"}
          </p>
        </div>
        <div className="rounded-[8px] border bg-card p-6">
          <div className="flex items-center gap-3 text-primary">
            <Flame className="size-8" aria-hidden="true" />
            <div>
              <div className="text-[44px] font-semibold leading-none">
                {state.streak?.current_streak ?? 0}
              </div>
              <div className="text-[17px] text-muted-foreground">day pair streak</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[8px] border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[16px] font-semibold uppercase tracking-[0.12em] text-primary">
              Today's audio
            </p>
            <h2 className="mt-2 font-serif text-[40px] leading-tight">
              {current?.title ?? "Waiting for audio"}
            </h2>
            {current && (
              <p className="mt-1 text-[17px] text-muted-foreground">
                {formatDuration(current.duration_seconds)}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => loadDashboard()} className="min-h-[44px]">
            <RefreshCw aria-hidden="true" /> Refresh
          </Button>
        </div>

        <div className="mt-6">
          {current && unlocked ? (
            <AudioPlayer
              src={current.audio_url}
              durationSeconds={current.duration_seconds}
              completed={memberDone}
              onComplete={completeCurrent}
            />
          ) : (
            <div className="rounded-[8px] bg-secondary p-5 text-[18px]">
              <LockKeyhole className="mb-3" aria-hidden="true" />
              Waiting for {state.buddies.map((buddy) => firstName(buddy.full_name)).join(" and ")}.
              Your next session opens when your pair finishes together.
            </div>
          )}
          {current && memberDone && !buddyDone && (
            <p className="mt-4 text-[17px] text-muted-foreground">
              You are complete for today. Waiting for{" "}
              {state.buddies.map((buddy) => firstName(buddy.full_name)).join(" and ")}.
            </p>
          )}
          {current && !memberDone && buddyDone && (
            <p className="mt-4 text-[17px] text-primary">
              {state.buddies.map((buddy) => firstName(buddy.full_name)).join(" and ")} already
              completed. Your session is ready.
            </p>
          )}
          {message && <p className="mt-4 text-[16px] text-muted-foreground">{message}</p>}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[8px] border bg-card p-6">
          <h2 className="font-serif text-[34px]">Buddy status</h2>
          <div className="mt-5 grid gap-4">
            {state.buddies.map((buddy) => (
              <div key={buddy.id} className="flex items-center justify-between gap-3 text-[17px]">
                <div>
                  <strong>{firstName(buddy.full_name)}</strong>
                  <div className="text-muted-foreground">
                    {buddy.timezone} - {timezoneLabel(buddy.timezone)}
                  </div>
                </div>
                {current && hasCompleted(state, buddy.id, current.id) ? (
                  <Check className="size-7 text-primary" aria-label="Completed" />
                ) : (
                  <Circle className="size-7 text-muted-foreground" aria-label="Not yet complete" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Pair streak history">
            {Array.from({ length: 28 }, (_, index) => (
              <span
                key={index}
                className={`block size-3 rounded-full ${index < (state.streak?.current_streak ?? 0) ? "bg-primary" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border bg-card p-6">
          <h2 className="font-serif text-[34px]">Week {week}</h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            {completedDays} of 28 sessions completed by you.
          </p>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (completedDays / 28) * 100)}%` }}
            />
          </div>
          <p className="mt-4 text-[16px] text-muted-foreground">
            Completion date for today: {today}. The 3am grace period is included.
          </p>
        </div>
      </section>
    </PortalFrame>
  );
}

function hasCompleted(state: DashboardState, memberId: string, contentId: string) {
  return state.logs.some((log) => log.member_id === memberId && log.content_id === contentId);
}

function jointCompleted(state: DashboardState, contentId: string) {
  return [state.member, ...state.buddies].every((member) =>
    hasCompleted(state, member.id, contentId),
  );
}

function PortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="font-serif text-[30px]">
            Now Off Duty
          </a>
          <div className="flex gap-3">
            <button
              className="min-h-[44px] rounded-md border px-4 py-2 text-[16px]"
              onClick={() => supabase.auth.signOut()}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function MissingMemberProfile({ email }: { email: string }) {
  return (
    <PortalFrame>
      <section className="mx-auto max-w-3xl rounded-[8px] border bg-card p-6">
        <h1 className="font-serif text-[48px] leading-none">
          Chris still needs to add this member.
        </h1>
        <p className="mt-4 text-[18px] text-muted-foreground">
          You are signed in as {email}, but this email does not have a member profile in the
          meditation cohort yet. Accounts are created by the program host only, so ask Chris to add
          this email from the admin dashboard before using the member portal.
        </p>
      </section>
    </PortalFrame>
  );
}

function Onboarding({
  member,
  onSave,
}: {
  member: Member;
  onSave: (fullName: string, timezone: string, password: string) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(member.full_name);
  const [timezone, setTimezone] = useState(member.timezone || defaultTimezone);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const timezoneOptions = useMemo(() => allTimezoneOptions(), []);

  return (
    <PortalFrame>
      <section className="mx-auto max-w-xl rounded-[8px] border bg-card p-6">
        <h1 className="font-serif text-[48px] leading-none">Welcome in.</h1>
        <p className="mt-4 text-[18px] text-muted-foreground">
          Confirm your name and timezone before opening your dashboard.
        </p>
        <form
          className="mt-7 grid min-w-0 gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const cleanName = fullName.trim();
            if (cleanName.length < 2) {
              setFormMessage("Please enter your name before continuing.");
              return;
            }
            if (password.length < 8) {
              setFormMessage("Please enter a password with at least 8 characters.");
              return;
            }

            setFormMessage("");
            setSaving(true);
            try {
              await onSave(cleanName, timezone, password);
            } catch (error) {
              setFormMessage(
                friendlyMeditationError(
                  error,
                  "Your profile could not be saved. Check the fields and try again.",
                ),
              );
            } finally {
              setSaving(false);
            }
          }}
          noValidate
        >
          <label className="grid gap-2 text-[16px] font-medium">
            Name
            <Input
              className="min-h-[44px] min-w-0 text-[16px]"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-[16px] font-medium">
            Timezone
            <select
              className="min-h-[44px] w-full min-w-0 max-w-full truncate rounded-md border border-input bg-background px-3 text-[16px] shadow-sm"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              <optgroup label="Common cohort timezones">
                {timezoneOptions.preferred.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All IANA timezones">
                {timezoneOptions.other.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="grid gap-2 text-[16px] font-medium">
            Password
            <Input
              className="min-h-[44px] min-w-0 text-[16px]"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <Button className="min-h-[48px] text-[16px]" type="submit" disabled={saving}>
            Continue
          </Button>
          {formMessage && (
            <p className="text-[16px] text-muted-foreground" role="alert">
              {formMessage}
            </p>
          )}
        </form>
      </section>
    </PortalFrame>
  );
}
