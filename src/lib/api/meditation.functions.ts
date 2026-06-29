import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  timezone: z.string().min(3),
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
    const { data: authUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${getSiteUrl()}/dashboard`,
        data: { full_name: data.fullName, timezone: data.timezone, cohort_id: data.cohortId },
      },
    );
    if (inviteError) throw inviteError;

    const userId = authUser.user?.id;
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
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .eq("cohort_id", data.cohortId)
      .eq("role", "member");
    if (membersError) throw membersError;

    const { data: firstContent, error: contentError } = await supabase
      .from("daily_content")
      .select("*")
      .eq("cohort_id", data.cohortId)
      .order("day_number", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (contentError) throw contentError;
    if (!firstContent || !members?.length) return { queued: 0 };

    const { data: logs, error: logsError } = await supabase
      .from("practice_logs")
      .select("member_id")
      .eq("content_id", firstContent.id)
      .in(
        "member_id",
        members.map((member) => member.id),
      );
    if (logsError) throw logsError;

    const completedIds = new Set((logs ?? []).map((log: { member_id: string }) => log.member_id));
    const incomplete = members.filter((member) => !completedIds.has(member.id));
    if (!incomplete.length) return { queued: 0 };

    const { error } = await supabase.from("notification_events").insert(
      incomplete.map((member) => ({
        member_id: member.id,
        event_type: "missed_day_alert",
        recipient_email: member.email,
        subject: "Today's session is still waiting for you",
        html_body: htmlEmail(
          "Today's session is still waiting",
          `Your session is available until 3am in your local timezone. Open ${getSiteUrl()}/dashboard when you are ready.`,
        ),
        status: "queued",
        provider: "app_server",
      })),
    );
    if (error) throw error;

    return { queued: incomplete.length };
  });
