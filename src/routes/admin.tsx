import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, LogOut, Mail, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addMeditationMember,
  autoPairMeditationCohort,
  createMeditationCohort,
  getMeditationAdminData,
  sendMeditationReminders,
  upsertDailyMeditationContent,
} from "@/lib/api/meditation.functions";
import { friendlyMeditationError } from "@/lib/meditation/error-messages";
import { isPastLocalMidday } from "@/lib/meditation/time";
import {
  allTimezoneOptions,
  defaultTimezone,
  getBrowserTimezone,
} from "@/lib/meditation/timezones";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin - Now Off Duty" }] }),
  component: Admin,
});

type AdminData = Awaited<ReturnType<typeof getMeditationAdminData>>;
type AdminMember = {
  id: string;
  cohort_id: string | null;
  full_name: string;
  timezone: string;
};
type AdminPairMember = {
  pair_id: string;
  member_id: string;
  members?: { full_name?: string | null } | null;
};
type AdminPracticeLog = {
  member_id: string;
  content_id: string;
  completed_at?: string | null;
};
type AdminStreak = {
  pair_id: string;
  current_streak?: number | null;
};
type AdminNotificationEvent = {
  id: string;
  subject: string;
  recipient_email: string;
  status: string;
  provider: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function Admin() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [activeCohortId, setActiveCohortId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      await navigate({ to: "/login" });
      return;
    }
    setAccessToken(token);
    const adminData = await getMeditationAdminData({ data: { accessToken: token } });
    setData(adminData);
    setActiveCohortId((current) => current || adminData.cohorts[0]?.id || "");
  }, [navigate]);

  useEffect(() => {
    load().catch((error) =>
      setMessage(
        friendlyMeditationError(
          error,
          "Admin dashboard could not load. Refresh the page and sign in again if needed.",
        ),
      ),
    );
  }, [load]);

  const activeCohort = data?.cohorts.find((cohort) => cohort.id === activeCohortId);
  const cohortMembers = useMemo(
    () =>
      ((data?.members ?? []) as AdminMember[]).filter(
        (member) => member.cohort_id === activeCohortId,
      ),
    [data, activeCohortId],
  );

  async function action<T>(run: () => Promise<T>, success: string | ((result: T) => string)) {
    try {
      const result = await run();
      setMessage(typeof success === "function" ? success(result) : success);
      await load();
    } catch (error) {
      setMessage(
        friendlyMeditationError(
          error,
          "The action did not complete. Check the form and try again.",
        ),
      );
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a href="/" className="font-serif text-[30px]">
              Now Off Duty
            </a>
            <h1 className="mt-4 font-serif text-[52px] leading-none">Cohort admin</h1>
            <p className="mt-3 max-w-2xl text-[18px] text-muted-foreground">
              Add members manually, load content, pair cohorts, and monitor live practice status.
            </p>
          </div>
          <Button
            className="min-h-[44px]"
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              await navigate({ to: "/login" });
            }}
          >
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        </header>

        {!hasSupabaseConfig() && (
          <div className="mt-8 rounded-[8px] border bg-card p-6 text-[18px] text-muted-foreground">
            Supabase is not configured yet. Add the Supabase environment variables before using the
            admin dashboard.
          </div>
        )}

        {hasSupabaseConfig() && (
          <>
            {message && (
              <div className="mt-6 rounded-[8px] border bg-card p-4 text-[16px] text-muted-foreground">
                {message}
              </div>
            )}

            <section className="mt-8 grid min-w-0 gap-6 xl:grid-cols-3">
              <Panel title="Create cohort">
                <CohortForm
                  onSubmit={(form) =>
                    action(
                      () => createMeditationCohort({ data: { accessToken, ...form } }),
                      "Cohort created.",
                    )
                  }
                />
              </Panel>

              <Panel title="Add member">
                <MemberForm
                  cohortId={activeCohortId}
                  cohortName={activeCohort?.name}
                  onSubmit={(form) =>
                    action(
                      () => addMeditationMember({ data: { accessToken, ...form } }),
                      "Member invited and profile created.",
                    )
                  }
                />
              </Panel>

              <Panel title="Daily content">
                <ContentForm
                  cohortId={activeCohortId}
                  onSubmit={(form) =>
                    action(
                      () => upsertDailyMeditationContent({ data: { accessToken, ...form } }),
                      "Daily content saved.",
                    )
                  }
                />
              </Panel>
            </section>

            <section className="mt-8 rounded-[8px] border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[38px]">Cohorts</h2>
                  <p className="text-[16px] text-muted-foreground">
                    Select a cohort to manage members, pairs, content, and reminders.
                  </p>
                </div>
                <select
                  className="min-h-[44px] rounded-md border bg-background px-3 text-[16px]"
                  value={activeCohortId}
                  onChange={(event) => setActiveCohortId(event.target.value)}
                >
                  {(data?.cohorts ?? []).map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
              {activeCohort && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    className="min-h-[44px]"
                    onClick={() =>
                      action(
                        () =>
                          autoPairMeditationCohort({
                            data: { accessToken, cohortId: activeCohort.id },
                          }),
                        "Auto-pairing complete.",
                      )
                    }
                  >
                    <Users aria-hidden="true" /> Auto-pair cohort
                  </Button>
                  <Button
                    className="min-h-[44px]"
                    variant="outline"
                    onClick={() =>
                      action(
                        () =>
                          sendMeditationReminders({
                            data: { accessToken, cohortId: activeCohort.id },
                          }),
                        (result) =>
                          `Queued ${result.queued} reminder${result.queued === 1 ? "" : "s"}. ${result.skippedBeforeWindow} member${result.skippedBeforeWindow === 1 ? "" : "s"} are not at 8pm local yet, ${result.skippedStarted} are in pairs already started, and ${result.skippedDuplicate} already had a reminder queued for this local day.`,
                      )
                    }
                  >
                    <Mail aria-hidden="true" /> Send reminders
                  </Button>
                </div>
              )}
            </section>

            <LiveCohortTable data={data} members={cohortMembers} cohortId={activeCohortId} />
            <ContentSchedule data={data} cohortId={activeCohortId} />
            <NotificationLog data={data} />
          </>
        )}
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[8px] border bg-card p-5">
      <h2 className="font-serif text-[32px] leading-tight">{title}</h2>
      <div className="mt-5 min-w-0">{children}</div>
    </div>
  );
}

function CohortForm({
  onSubmit,
}: {
  onSubmit: (data: { name: string; startDate: string }) => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [formMessage, setFormMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName && !startDate) {
      setFormMessage("Please enter a cohort name and start date.");
      return;
    }
    if (cleanName.length < 2) {
      setFormMessage("Please enter a cohort name.");
      return;
    }
    if (!startDate) {
      setFormMessage("Please choose a cohort start date.");
      return;
    }

    setFormMessage("");
    onSubmit({ name: cleanName, startDate });
  }

  return (
    <form className="grid min-w-0 gap-4" noValidate onSubmit={handleSubmit}>
      <label className="grid gap-2 text-[16px] font-medium">
        Cohort name
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          placeholder="July meditation cohort"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-[16px] font-medium">
        Start date
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>
      {formMessage && (
        <p className="text-[15px] text-muted-foreground" role="alert">
          {formMessage}
        </p>
      )}
      <Button className="min-h-[44px] w-full text-[16px]" type="submit">
        <CalendarPlus aria-hidden="true" /> Create
      </Button>
    </form>
  );
}

function MemberForm({
  cohortId,
  cohortName,
  onSubmit,
}: {
  cohortId: string;
  cohortName?: string;
  onSubmit: (data: { cohortId: string; fullName: string; email: string; timezone: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [formMessage, setFormMessage] = useState("");
  const timezoneOptions = useMemo(() => allTimezoneOptions(), []);

  useEffect(() => {
    setTimezone(getBrowserTimezone());
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cohortId) {
      setFormMessage("Create or select a cohort before adding a member.");
      return;
    }
    if (cleanName.length < 2 && !cleanEmail) {
      setFormMessage("Please enter the member's full name and email address.");
      return;
    }
    if (cleanName.length < 2) {
      setFormMessage("Please enter the member's full name.");
      return;
    }
    if (!isEmail(cleanEmail)) {
      setFormMessage("Please enter a valid email address.");
      return;
    }

    setFormMessage("");
    onSubmit({ cohortId, fullName: cleanName, email: cleanEmail, timezone });
  }

  return (
    <form className="grid min-w-0 gap-4" noValidate onSubmit={handleSubmit}>
      <p className="min-w-0 truncate text-[15px] text-muted-foreground">
        {cohortName
          ? `Adding to: ${cohortName}`
          : "Create or select a cohort before adding members."}
      </p>
      <label className="grid gap-2 text-[16px] font-medium">
        Full name
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          placeholder="Chris Soll"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-[16px] font-medium">
        Email
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          placeholder="member@example.com"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
      <p className="min-w-0 text-[14px] leading-snug text-muted-foreground">
        Used for 8pm reminders and the 3am grace period.
      </p>
      {formMessage && (
        <p className="text-[15px] text-muted-foreground" role="alert">
          {formMessage}
        </p>
      )}
      <Button className="min-h-[44px] w-full text-[16px]" type="submit" disabled={!cohortId}>
        <Plus aria-hidden="true" /> {cohortId ? "Add member" : "Create/select cohort first"}
      </Button>
    </form>
  );
}

function ContentForm({
  cohortId,
  onSubmit,
}: {
  cohortId: string;
  onSubmit: (data: {
    cohortId: string;
    weekNumber: number;
    dayNumber: number;
    title: string;
    audioUrl: string;
    durationSeconds: number;
  }) => void;
}) {
  const [dayNumber, setDayNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(600);
  const [formMessage, setFormMessage] = useState("");
  const weekNumber = Math.ceil(dayNumber / 7);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanAudioUrl = audioUrl.trim();

    if (!cohortId) {
      setFormMessage("Create or select a cohort before saving daily content.");
      return;
    }
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 28) {
      setFormMessage("Please choose a day number from 1 to 28.");
      return;
    }
    if (cleanTitle.length < 2 && !cleanAudioUrl) {
      setFormMessage("Please enter a session title and audio URL before saving this day.");
      return;
    }
    if (cleanTitle.length < 2) {
      setFormMessage("Please enter a session title before saving this day.");
      return;
    }
    if (!cleanAudioUrl) {
      setFormMessage("Please enter an audio URL before saving this day.");
      return;
    }
    if (!isHttpUrl(cleanAudioUrl)) {
      setFormMessage("Please enter a full audio URL that starts with https:// or http://.");
      return;
    }
    if (!Number.isInteger(durationSeconds) || durationSeconds <= 0) {
      setFormMessage("Please enter the audio duration in seconds. For 10 minutes, use 600.");
      return;
    }

    setFormMessage("");
    onSubmit({
      cohortId,
      weekNumber,
      dayNumber,
      title: cleanTitle,
      audioUrl: cleanAudioUrl,
      durationSeconds,
    });
  }

  return (
    <form className="grid min-w-0 gap-4" noValidate onSubmit={handleSubmit}>
      <label className="grid gap-2 text-[16px] font-medium">
        Program day
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          min={1}
          max={28}
          type="number"
          value={dayNumber}
          onChange={(event) => setDayNumber(Number(event.target.value))}
        />
      </label>
      <label className="grid gap-2 text-[16px] font-medium">
        Session title
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          placeholder="Day 1 meditation"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-[16px] font-medium">
        Audio URL
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          placeholder="https://..."
          type="url"
          value={audioUrl}
          onChange={(event) => setAudioUrl(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-[16px] font-medium">
        Duration in seconds
        <Input
          className="min-h-[44px] min-w-0 text-[16px]"
          min={1}
          type="number"
          value={durationSeconds}
          onChange={(event) => setDurationSeconds(Number(event.target.value))}
        />
      </label>
      <p className="text-[14px] leading-snug text-muted-foreground">
        This is the audio length. 600 seconds equals 10 minutes.
      </p>
      {formMessage && (
        <p className="text-[15px] text-muted-foreground" role="alert">
          {formMessage}
        </p>
      )}
      <Button className="min-h-[44px] w-full text-[16px]" type="submit" disabled={!cohortId}>
        Save day {dayNumber}
      </Button>
    </form>
  );
}

function LiveCohortTable({
  data,
  members,
  cohortId,
}: {
  data: AdminData | null;
  members: AdminMember[];
  cohortId: string;
}) {
  const logs = (data?.logs ?? []) as AdminPracticeLog[];
  const pairMembers = (data?.pairMembers ?? []) as AdminPairMember[];
  const streaks = (data?.streaks ?? []) as AdminStreak[];
  const content = (data?.content ?? []).filter((item) => item.cohort_id === cohortId);
  const current = content[0];

  return (
    <section className="mt-8 rounded-[8px] border bg-card p-6">
      <h2 className="font-serif text-[38px]">Live cohort dashboard</h2>
      <Table className="mt-5 text-[16px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Buddy</TableHead>
            <TableHead>Today's status</TableHead>
            <TableHead>Current streak</TableHead>
            <TableHead>Days total</TableHead>
            <TableHead>Last active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const pair = pairMembers.find((row) => row.member_id === member.id);
            const buddyRows = pairMembers.filter(
              (row) => row.pair_id === pair?.pair_id && row.member_id !== member.id,
            );
            const memberLogs = logs.filter((log) => log.member_id === member.id);
            const completed = current && memberLogs.some((log) => log.content_id === current.id);
            const pairDone = buddyRows.every((row) =>
              logs.some(
                (log) =>
                  log.member_id === row.member_id && current && log.content_id === current.id,
              ),
            );
            const neither = !completed && !pairDone;
            const rowTone =
              completed && pairDone
                ? "bg-emerald-50"
                : neither && isPastLocalMidday(member.timezone)
                  ? "bg-red-50"
                  : "bg-yellow-50";
            const streak = streaks.find((item) => item.pair_id === pair?.pair_id);
            return (
              <TableRow key={member.id} className={rowTone}>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>
                  {buddyRows.map((row) => row.members?.full_name).join(", ") || "Unpaired"}
                </TableCell>
                <TableCell>{completed ? "completed" : "not yet"}</TableCell>
                <TableCell>{streak?.current_streak ?? 0}</TableCell>
                <TableCell>{memberLogs.length}</TableCell>
                <TableCell>
                  {memberLogs[0]?.completed_at
                    ? new Date(memberLogs[0].completed_at).toLocaleString()
                    : "None"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function ContentSchedule({ data, cohortId }: { data: AdminData | null; cohortId: string }) {
  const content = (data?.content ?? []).filter((item) => item.cohort_id === cohortId);
  return (
    <section className="mt-8 rounded-[8px] border bg-card p-6">
      <h2 className="font-serif text-[38px]">Unlock schedule</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {content.map((item) => (
          <div key={item.id} className="rounded-[8px] border bg-background p-3 text-[16px]">
            <strong>Day {item.day_number}</strong>
            <div>{item.title}</div>
            <div className="text-muted-foreground">{item.unlock_date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationLog({ data }: { data: AdminData | null }) {
  const notifications = (data?.notifications ?? []) as AdminNotificationEvent[];

  return (
    <section className="mt-8 rounded-[8px] border bg-card p-6">
      <h2 className="font-serif text-[38px]">Notification log</h2>
      <div className="mt-4 grid gap-3">
        {notifications.map((event) => (
          <div key={event.id} className="rounded-[8px] border bg-background p-3 text-[16px]">
            <strong>{event.subject}</strong>
            <div className="text-muted-foreground">
              {event.recipient_email} - {event.status} - {event.provider}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
