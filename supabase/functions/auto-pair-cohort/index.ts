import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, htmlShell, queueEmail } from "../_shared/supabase.ts";

function offsetMinutes(timezone: string) {
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

serve(async (request) => {
  try {
    const { cohortId } = await request.json();
    const supabase = adminClient();
    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .eq("cohort_id", cohortId)
      .eq("role", "member");
    if (error) throw error;

    const { data: assigned } = await supabase
      .from("buddy_pair_members")
      .select("member_id, buddy_pairs!inner(cohort_id)")
      .eq("buddy_pairs.cohort_id", cohortId);
    const assignedIds = new Set((assigned ?? []).map((row: any) => row.member_id));
    const unmatched = members.filter((member: any) => !assignedIds.has(member.id));
    unmatched.sort((a: any, b: any) => offsetMinutes(a.timezone) - offsetMinutes(b.timezone));

    const groups: any[][] = [];
    for (let index = 0; index < unmatched.length; index += 2) {
      if (index === unmatched.length - 3) {
        groups.push(unmatched.slice(index, index + 3));
        break;
      }
      groups.push(unmatched.slice(index, index + 2));
    }

    for (const group of groups.filter((item) => item.length >= 2)) {
      const { data: pair, error: pairError } = await supabase
        .from("buddy_pairs")
        .insert({ cohort_id: cohortId, member_a_id: group[0].id, member_b_id: group[1].id })
        .select("*")
        .single();
      if (pairError) throw pairError;

      await supabase.from("buddy_pair_members").insert(group.map((member) => ({ pair_id: pair.id, member_id: member.id })));
      await supabase.from("pair_streaks").insert({ pair_id: pair.id });

      const { data: firstContent } = await supabase
        .from("daily_content")
        .select("id")
        .eq("cohort_id", cohortId)
        .eq("day_number", 1)
        .maybeSingle();
      if (firstContent) {
        await supabase.from("pair_content_progress").insert({ pair_id: pair.id, content_id: firstContent.id });
      }

      await Promise.all(
        group.map((member) => {
          const buddies = group.filter((item) => item.id !== member.id);
          return queueEmail(supabase, {
            member_id: member.id,
            pair_id: pair.id,
            event_type: "welcome_pairing",
            recipient_email: member.email,
            subject: "You're in - here's everything you need to get started",
            html_body: htmlShell(
              "Your accountability partner is ready",
              `You have been paired with ${buddies.map((buddy) => `${buddy.full_name} (${buddy.timezone})`).join(" and ")}. Open your dashboard to begin.`,
            ),
          });
        }),
      );
    }

    return Response.json({ paired: groups.flat().length, groups: groups.map((group) => group.map((member) => member.id)) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
