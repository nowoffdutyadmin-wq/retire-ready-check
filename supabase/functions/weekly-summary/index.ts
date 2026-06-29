import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, htmlShell, queueEmail } from "../_shared/supabase.ts";

serve(async (request) => {
  try {
    const { cohortId, weekNumber } = await request.json();
    const supabase = adminClient();
    const week = Number(weekNumber || 1);

    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .eq("cohort_id", cohortId)
      .eq("role", "member");
    if (error) throw error;

    const { data: pairRows } = await supabase
      .from("buddy_pair_members")
      .select("pair_id, member_id")
      .in("member_id", members.map((member: any) => member.id));
    const pairIds = [...new Set((pairRows ?? []).map((row: any) => row.pair_id))];
    const { data: streaks } = await supabase.from("pair_streaks").select("*").in("pair_id", pairIds);

    await Promise.all(
      members.map((member: any) => {
        const pairId = (pairRows ?? []).find((row: any) => row.member_id === member.id)?.pair_id;
        const streak = (streaks ?? []).find((item: any) => item.pair_id === pairId);
        return queueEmail(supabase, {
          member_id: member.id,
          pair_id: pairId,
          event_type: "weekly_summary",
          recipient_email: member.email,
          subject: `Week ${week} complete - here's your pair's progress`,
          html_body: htmlShell(
            `Week ${week} complete`,
            `Your current pair streak is ${streak?.current_streak ?? 0}. Week ${week + 1} starts tomorrow with the next queued session in your dashboard.`,
          ),
        });
      }),
    );

    return Response.json({ queued: members.length });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
