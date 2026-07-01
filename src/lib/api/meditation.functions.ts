import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isSupportedTimezone, timezoneDisplayName } from "../meditation/timezones";
import { getSiteUrl, getSupabaseAdmin } from "../supabase/admin.server";

const authInput = z.object({ accessToken: z.string().min(10) });
const emptyInput = authInput;
const cohortInput = z.object({
  accessToken: z.string().min(10),
  name: z.string().min(2),
  startDate: z.string().min(10),
});
const memberInput = z.object({
  accessToken: z.string().min(10),
  cohortId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  timezone: z.string().refine(isSupportedTimezone, "Choose a valid IANA timezone."),
});
const contentInput = z.object({
  accessToken: z.string().min(10),
  cohortId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(4),
  dayNumber: z.number().int().min(1).max(28),
  title: z.string().min(2),
  audioUrl: z.string().url(),
  durationSeconds: z.number().int().positive(),
});
const cohortIdInput = z.object({ accessToken: z.string().min(10), cohortId: z.string().uuid() });

async function requireAdmin(accessToken: string) {
  const supabase = getSupabaseAdmin();
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userResult.user) throw new Error("Admin login required.");

  const { data: member, error } = await supabase
    .from("members")
    .select("role")
    .eq("id", userResult.user.id)
    .single();
  if (error) throw error;
  if (member?.role !== "admin") throw new Error("Admin access required.");

  return supabase;
}

function addDays(date: string, offset: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + offset);
  return next.toISOString().slice(0, 10);
}

function htmlEmail(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a"><h1>${title}</h1><p>${body}</p></div>`;
}

function timezoneOffsetMinutes(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const value = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
  const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function localDateParts(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";

  return {
    year: Number(part("year")),
    month: Number(part("month")),
    day: Number(part("day")),
    hour: Number(part("hour")),
    date: `${part("year")}-${part("month")}-${part("day")}`,
  };
}

function previousIsoDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
}

function isInMissedDayReminderWindow(timezone: string, date = new Date()) {
  const { hour } = localDateParts(timezone, date);
  return hour >= 20 || hour < 3;
}

function localReminderDate(timezone: string, date = new Date()) {
  const local = localDateParts(timezone, date);
  return local.hour < 3 ? previousIsoDate(local.date) : local.date;
}

async function findAuthUserByEmail(supabase: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 100;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }

  return null;
}

export const getMeditationAdminData = createServerFn({ method: "POST" })
  .inputValidator(emptyInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    const [cohorts, members, pairs, pairMembers, content, logs, streaks, notifications] =
      await Promise.all([
        supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
        supabase.from("members").select("*").order("created_at", { ascending: false }),
        supabase.from("buddy_pairs").select("*").order("created_at", { ascending: true }),
        supabase.from("buddy_pair_members").select("*, members(*)"),
        supabase.from("daily_content").select("*").order("day_number", { ascending: true }),
        supabase.from("practice_logs").select("*").order("completed_at", { ascending: false }),
        supabase.from("pair_streaks").select("*"),
        supabase.from("notification_events").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

    const error = [
      cohorts.error,
      members.error,
      pairs.error,
      pairMembers.error,
      content.error,
      logs.error,
      streaks.error,
      notifications.error,
    ].find(Boolean);
    if (error) throw error;

    return {
      cohorts: cohorts.data ?? [],
      members: members.data ?? [],
      pairs: pairs.data ?? [],
      pairMembers: pairMembers.data ?? [],
      content: content.data ?? [],
      logs: logs.data ?? [],
      streaks: streaks.data ?? [],
      notifications: notifications.data ?? [],
    };
  });

export const createMeditationCohort = createServerFn({ method: "POST" })
  .inputValidator(cohortInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    const { data: cohort, error } = await supabase
      .from("cohorts")
      .insert({ name: data.name, start_date: data.startDate, status: "upcoming" })
      .select("*")
      .single();
    if (error) throw error;
    return cohort;
  });

export const addMeditationMember = createServerFn({ method: "POST" })
  .inputValidator(memberInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    let authUser = await findAuthUserByEmail(supabase, data.email);

    if (!authUser) {
      const { data: inviteResult, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        data.email,
        {
          redirectTo: `${getSiteUrl()}/auth/callback`,
          data: { full_name: data.fullName, timezone: data.timezone, cohort_id: data.cohortId },
        },
      );
      if (inviteError) throw inviteError;
      authUser = inviteResult.user;
    }

    const userId = authUser?.id;
    if (!userId) throw new Error("Supabase did not return an invited user id.");

    const { data: member, error } = await supabase
      .from("members")
      .upsert({
        id: userId,
        email: data.email,
        full_name: data.fullName,
        timezone: data.timezone,
        cohort_id: data.cohortId,
        role: "member",
      })
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("notification_events").insert({
      member_id: userId,
      event_type: "welcome_invite",
      recipient_email: data.email,
      subject: "You're in - here's everything you need to get started",
      html_body: htmlEmail(
        "You're in",
        `Your Now Off Duty cohort dashboard is ready. Use the Supabase invite link to sign in, then open ${getSiteUrl()}/dashboard.`,
      ),
      status: "sent",
      provider: "supabase_auth_invite",
      sent_at: new Date().toISOString(),
    });

    return member;
  });

export const upsertDailyMeditationContent = createServerFn({ method: "POST" })
  .inputValidator(contentInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    const { data: cohort, error: cohortError } = await supabase
      .from("cohorts")
      .select("start_date")
      .eq("id", data.cohortId)
      .single();
    if (cohortError) throw cohortError;

    const { data: content, error } = await supabase
      .from("daily_content")
      .upsert(
        {
          cohort_id: data.cohortId,
          week_number: data.weekNumber,
          day_number: data.dayNumber,
          title: data.title,
          audio_url: data.audioUrl,
          duration_seconds: data.durationSeconds,
          unlock_date: addDays(cohort.start_date, data.dayNumber - 1),
        },
        { onConflict: "cohort_id,day_number" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return content;
  });

export const autoPairMeditationCohort = createServerFn({ method: "POST" })
  .inputValidator(cohortIdInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .eq("cohort_id", data.cohortId)
      .eq("role", "member");
    if (membersError) throw membersError;

    const { data: assigned, error: assignedError } = await supabase
      .from("buddy_pair_members")
      .select("member_id, buddy_pairs!inner(cohort_id)")
      .eq("buddy_pairs.cohort_id", data.cohortId);
    if (assignedError) throw assignedError;

    const assignedIds = new Set((assigned ?? []).map((row: { member_id: string }) => row.member_id));
    const unmatched = (members ?? [])
      .filter((member) => !assignedIds.has(member.id))
      .sort((a, b) => timezoneOffsetMinutes(a.timezone) - timezoneOffsetMinutes(b.timezone));

    const groups: typeof unmatched[] = [];
    for (let index = 0; index < unmatched.length; index += 2) {
      if (index === unmatched.length - 3) {
        groups.push(unmatched.slice(index, index + 3));
        break;
      }
      groups.push(unmatched.slice(index, index + 2));
    }

    const createdGroups: string[][] = [];
    for (const group of groups.filter((item) => item.length >= 2)) {
      const { data: pair, error: pairError } = await supabase
        .from("buddy_pairs")
        .insert({
          cohort_id: data.cohortId,
          member_a_id: group[0].id,
          member_b_id: group[1].id,
        })
        .select("*")
        .single();
      if (pairError) throw pairError;

      const { error: pairMembersError } = await supabase
        .from("buddy_pair_members")
        .insert(group.map((member) => ({ pair_id: pair.id, member_id: member.id })));
      if (pairMembersError) throw pairMembersError;

      await supabase.from("pair_streaks").insert({ pair_id: pair.id });

      const { data: firstContent } = await supabase
        .from("daily_content")
        .select("id")
        .eq("cohort_id", data.cohortId)
        .eq("day_number", 1)
        .maybeSingle();
      if (firstContent) {
        await supabase.from("pair_content_progress").insert({
          pair_id: pair.id,
          content_id: firstContent.id,
        });
      }

      await supabase.from("notification_events").insert(
        group.map((member) => {
          const buddies = group.filter((buddy) => buddy.id !== member.id);
          return {
            member_id: member.id,
            pair_id: pair.id,
            event_type: "welcome_pairing",
            recipient_email: member.email,
            subject: "You're in - here's everything you need to get started",
            html_body: htmlEmail(
              "Your accountability partner is ready",
              `You have been paired with ${buddies
                .map((buddy) => `${buddy.full_name} (${buddy.timezone})`)
                .join(" and ")}. Open ${getSiteUrl()}/dashboard to begin.`,
            ),
            status: "queued",
            provider: "app_server",
          };
        }),
      );

      createdGroups.push(group.map((member) => member.id));
    }

    return { paired: createdGroups.flat().length, groups: createdGroups };
  });

export const sendMeditationReminders = createServerFn({ method: "POST" })
  .inputValidator(cohortIdInput)
  .handler(async ({ data }) => {
    const supabase = await requireAdmin(data.accessToken);
    const now = new Date();
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .eq("cohort_id", data.cohortId)
      .eq("role", "member");
    if (membersError) throw membersError;
    if (!members?.length) return { queued: 0, skippedBeforeWindow: 0, skippedStarted: 0, skippedDuplicate: 0 };

    const memberIds = members.map((member) => member.id);
    const { data: pairRows, error: pairRowsError } = await supabase
      .from("buddy_pair_members")
      .select("pair_id, member_id")
      .in("member_id", memberIds);
    if (pairRowsError) throw pairRowsError;

    const pairIds = [...new Set((pairRows ?? []).map((row: { pair_id: string }) => row.pair_id))];
    if (!pairIds.length) return { queued: 0, skippedBeforeWindow: 0, skippedStarted: 0, skippedDuplicate: 0 };

    const { data: progressRows, error: progressError } = await supabase
      .from("pair_content_progress")
      .select("pair_id, content_id, unlocked_at, daily_content(day_number, title)")
      .in("pair_id", pairIds)
      .is("joint_completed_at", null);
    if (progressError) throw progressError;

    const activeContentByPair = new Map<string, { content_id: string; title: string; day_number: number }>();
    for (const row of (progressRows ?? []) as Array<{
      pair_id: string;
      content_id: string;
      daily_content?: { day_number?: number; title?: string } | null;
    }>) {
      const current = activeContentByPair.get(row.pair_id);
      const dayNumber = row.daily_content?.day_number ?? 999;
      if (!current || dayNumber < current.day_number) {
        activeContentByPair.set(row.pair_id, {
          content_id: row.content_id,
          day_number: dayNumber,
          title: row.daily_content?.title ?? "today's session",
        });
      }
    }

    const activeContentIds = [...new Set([...activeContentByPair.values()].map((row) => row.content_id))];
    if (!activeContentIds.length) return { queued: 0, skippedBeforeWindow: 0, skippedStarted: 0, skippedDuplicate: 0 };

    const { data: logs, error: logsError } = await supabase
      .from("practice_logs")
      .select("member_id, content_id")
      .in("content_id", activeContentIds)
      .in("member_id", memberIds);
    if (logsError) throw logsError;

    const since = new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString();
    const { data: existingReminders, error: existingError } = await supabase
      .from("notification_events")
      .select("member_id, created_at")
      .eq("event_type", "missed_day_alert")
      .in("member_id", memberIds)
      .gte("created_at", since);
    if (existingError) throw existingError;

    const membersById = new Map(members.map((member) => [member.id, member]));
    const memberIdsByPair = new Map<string, string[]>();
    for (const row of (pairRows ?? []) as Array<{ pair_id: string; member_id: string }>) {
      memberIdsByPair.set(row.pair_id, [...(memberIdsByPair.get(row.pair_id) ?? []), row.member_id]);
    }

    const existingReminderKeys = new Set(
      (existingReminders ?? []).map((event: { member_id: string; created_at: string }) => {
        const member = membersById.get(event.member_id);
        return member ? `${event.member_id}:${localReminderDate(member.timezone, new Date(event.created_at))}` : "";
      }),
    );

    let skippedBeforeWindow = 0;
    let skippedStarted = 0;
    let skippedDuplicate = 0;
    const reminderRows = [];

    for (const [pairId, pairMemberIds] of memberIdsByPair.entries()) {
      const activeContent = activeContentByPair.get(pairId);
      if (!activeContent) continue;

      const pairHasStarted = (logs ?? []).some(
        (log: { member_id: string; content_id: string }) =>
          log.content_id === activeContent.content_id && pairMemberIds.includes(log.member_id),
      );
      if (pairHasStarted) {
        skippedStarted += pairMemberIds.length;
        continue;
      }

      for (const memberId of pairMemberIds) {
        const member = membersById.get(memberId);
        if (!member) continue;

        if (!isInMissedDayReminderWindow(member.timezone, now)) {
          skippedBeforeWindow += 1;
          continue;
        }

        const reminderDate = localReminderDate(member.timezone, now);
        const reminderKey = `${member.id}:${reminderDate}`;
        if (existingReminderKeys.has(reminderKey)) {
          skippedDuplicate += 1;
          continue;
        }

        reminderRows.push({
          member_id: member.id,
          event_type: "missed_day_alert",
          recipient_email: member.email,
          subject: "Today's session is still waiting for you",
          html_body: htmlEmail(
            "Today's session is still waiting",
            `It is after 8pm in ${timezoneDisplayName(member.timezone)} and ${activeContent.title} is still waiting. Your session is available until 3am in your local timezone. Open ${getSiteUrl()}/dashboard when you are ready.`,
          ),
          status: "queued",
          provider: "app_server",
        });
      }
    }

    if (!reminderRows.length) {
      return { queued: 0, skippedBeforeWindow, skippedStarted, skippedDuplicate };
    }

    // Twilio SMS can hook in here later using the same timezone-filtered recipient set.
    const { error } = await supabase.from("notification_events").insert(reminderRows);
    if (error) throw error;

    return { queued: reminderRows.length, skippedBeforeWindow, skippedStarted, skippedDuplicate };
  });
