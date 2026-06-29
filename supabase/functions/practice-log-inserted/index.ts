import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, htmlShell, queueEmail } from "../_shared/supabase.ts";

serve(async (request) => {
  try {
    const payload = await request.json();
    const log = payload.record ?? payload;
    const supabase = adminClient();

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", log.member_id)
      .single();
    if (memberError) throw memberError;

    const { data: pairMember } = await supabase
      .from("buddy_pair_members")
      .select("pair_id")
      .eq("member_id", log.member_id)
      .single();
    if (!pairMember) return Response.json({ ok: true, reason: "unpaired" });

    const pairId = pairMember.pair_id;
    const { data: pairRows, error: pairError } = await supabase
      .from("buddy_pair_members")
      .select("member_id, members(*)")
      .eq("pair_id", pairId);
    if (pairError) throw pairError;

    const { data: content, error: contentError } = await supabase
      .from("daily_content")
      .select("*")
      .eq("id", log.content_id)
      .single();
    if (contentError) throw contentError;

    const memberIds = pairRows.map((row: any) => row.member_id);
    const { data: logs, error: logsError } = await supabase
      .from("practice_logs")
      .select("*")
      .eq("content_id", log.content_id)
      .in("member_id", memberIds);
    if (logsError) throw logsError;

    const allComplete = new Set(logs.map((item: any) => item.member_id)).size === memberIds.length;
    const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
    const siteUrl = Deno.env.get("SITE_URL") ?? "";

    if (allComplete) {
      const { data: streak } = await supabase
        .from("pair_streaks")
        .select("*")
        .eq("pair_id", pairId)
        .single();
      await Promise.all(
        pairRows.map((row: any) =>
          queueEmail(supabase, {
            member_id: row.member_id,
            pair_id: pairId,
            event_type: "joint_completion",
            recipient_email: row.members.email,
            subject: `Day ${content.day_number} done - ${streak?.current_streak ?? 1}-day streak`,
            html_body: htmlShell(
              `Day ${content.day_number} done`,
              `You and your accountability partner both completed today. Your ${streak?.current_streak ?? 1}-day streak is recorded. Day ${content.day_number + 1} is queued for tomorrow morning. <a href="${siteUrl}/dashboard">Open your dashboard</a>.`,
            ),
          }),
        ),
      );
      return Response.json({ ok: true, allComplete: true });
    }

    const incomplete = pairRows.filter((row: any) => !logs.some((item: any) => item.member_id === row.member_id));
    await Promise.all(
      incomplete.map((row: any) =>
        queueEmail(supabase, {
          member_id: row.member_id,
          pair_id: pairId,
          event_type: "buddy_nudge",
          recipient_email: row.members.email,
          subject: `${firstName(member.full_name)} has completed today's practice`,
          html_body: htmlShell(
            `${firstName(member.full_name)} checked in`,
            `${firstName(member.full_name)} has completed today's session. Complete yours to keep the streak going and unlock tomorrow. <a href="${siteUrl}/dashboard">Open your dashboard</a>.`,
          ),
        }),
      ),
    );
    // Twilio SMS hook: add a second notification adapter here for buddy nudges.

    return Response.json({ ok: true, allComplete: false, nudged: incomplete.length });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
