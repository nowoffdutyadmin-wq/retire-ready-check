import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, LogOut, Mail, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  addMeditationMember,
  autoPairMeditationCohort,
  createMeditationCohort,
  getMeditationAdminData,
  sendMeditationReminders,
  upsertDailyMeditationContent,
} from "@/lib/api/meditation.functions";
import { isPastLocalMidday } from "@/lib/meditation/time";
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

function Admin() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [activeCohortId, setActiveCohortId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
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
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Admin failed to load."));
  }, []);

  const activeCohort = data?.cohorts.find((cohort) => cohort.id === activeCohortId);
  const cohortMembers = useMemo(
    () => (data?.members ?? []).filter((member) => member.cohort_id === activeCohortId),
    [data, activeCohortId],
  );

  async function action<T>(run: () => Promise<T>, success: string) {
    try {
      await run();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a href="/" className="font-serif text-[30px]">Now Off Duty</a>
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
            Supabase is not configured yet. Add the Supabase environment variables before using
            the admin dashboard.
          </div>
        )}

        {hasSupabaseConfig() && (
          <>

        {message && (
          <div className="mt-6 rounded-[8px] border bg-card p-4 text-[16px] text-muted-foreground">
            {message}
          </div>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
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
                    () => autoPairMeditationCohort({ data: { accessToken, cohortId: activeCohort.id } }),
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
                    () => sendMeditationReminders({ data: { accessToken, cohortId: activeCohort.id } }),
                    "Reminder queue updated.",
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
    <div className="rounded-[8px] border bg-card p-5">
      <h2 className="font-serif text-[32px]">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function CohortForm({ onSubmit }: { onSubmit: (data: { name: string; startDate: string }) => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit({ name, startDate }); }}>
      <Input placeholder="Cohort name" value={name} onChange={(event) => setName(event.target.value)} />
      <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
      <Button className="min-h-[44px]" type="submit"><CalendarPlus aria-hidden="true" /> Create</Button>
    </form>
  );
}

function MemberForm({ cohortId, onSubmit }: { cohortId: string; onSubmit: (data: { cohortId: string; fullName: string; email: string; timezone: string }) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit({ cohortId, fullName, email, timezone }); }}>
      <Input placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
      <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input placeholder="IANA timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
      <Button className="min-h-[44px]" type="submit" disabled={!cohortId}><Plus aria-hidden="true" /> Add member</Button>
    </form>
  );
}

function ContentForm({ cohortId, onSubmit }: { cohortId: string; onSubmit: (data: { cohortId: string; weekNumber: number; dayNumber: number; title: string; audioUrl: string; durationSeconds: number }) => void }) {
  const [dayNumber, setDayNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(600);
  const weekNumber = Math.ceil(dayNumber / 7);
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit({ cohortId, weekNumber, dayNumber, title, audioUrl, durationSeconds }); }}>
      <Input min={1} max={28} type="number" value={dayNumber} onChange={(event) => setDayNumber(Number(event.target.value))} />
      <Input placeholder="Session title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input placeholder="Audio URL" value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} />
      <Input min={1} type="number" value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} />
      <Button className="min-h-[44px]" type="submit" disabled={!cohortId}>Save day {dayNumber}</Button>
    </form>
  );
}

function LiveCohortTable({ data, members, cohortId }: { data: AdminData | null; members: Array<Record<string, any>>; cohortId: string }) {
  const logs = data?.logs ?? [];
  const pairMembers = data?.pairMembers ?? [];
  const streaks = data?.streaks ?? [];
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
            const pair = pairMembers.find((row: any) => row.member_id === member.id);
            const buddyRows = pairMembers.filter((row: any) => row.pair_id === pair?.pair_id && row.member_id !== member.id);
            const memberLogs = logs.filter((log: any) => log.member_id === member.id);
            const completed = current && memberLogs.some((log: any) => log.content_id === current.id);
            const pairDone = buddyRows.every((row: any) => logs.some((log: any) => log.member_id === row.member_id && current && log.content_id === current.id));
            const neither = !completed && !pairDone;
            const rowTone = completed && pairDone ? "bg-emerald-50" : neither && isPastLocalMidday(member.timezone) ? "bg-red-50" : "bg-yellow-50";
            const streak = streaks.find((item: any) => item.pair_id === pair?.pair_id);
            return (
              <TableRow key={member.id} className={rowTone}>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{buddyRows.map((row: any) => row.members?.full_name).join(", ") || "Unpaired"}</TableCell>
                <TableCell>{completed ? "completed" : "not yet"}</TableCell>
                <TableCell>{streak?.current_streak ?? 0}</TableCell>
                <TableCell>{memberLogs.length}</TableCell>
                <TableCell>{memberLogs[0]?.completed_at ? new Date(memberLogs[0].completed_at).toLocaleString() : "None"}</TableCell>
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
  return (
    <section className="mt-8 rounded-[8px] border bg-card p-6">
      <h2 className="font-serif text-[38px]">Notification log</h2>
      <div className="mt-4 grid gap-3">
        {(data?.notifications ?? []).map((event: any) => (
          <div key={event.id} className="rounded-[8px] border bg-background p-3 text-[16px]">
            <strong>{event.subject}</strong>
            <div className="text-muted-foreground">{event.recipient_email} - {event.status} - {event.provider}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
