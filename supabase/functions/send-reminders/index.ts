import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, htmlShell, queueEmail } from "../_shared/supabase.ts";

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

    const { data: content } = await supabase
      .from("daily_content")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("day_number", { ascending: true });
    const current = content?.[0];
    if (!current) return Response.json({ queued: 0 });

    const { data: logs } = await supabase
      .from("practice_logs")
      .select("member_id")
      .eq("content_id", current.id)
      .in("member_id", members.map((member: any) => member.id));
    const completed = new Set((logs ?? []).map((log: any) => log.member_id));

    const incomplete = members.filter((member: any) => !completed.has(member.id));
    await Promise.all(
      incomplete.map((member: any) =>
        queueEmail(supabase, {
          member_id: member.id,
          event_type: "missed_day_alert",
          recipient_email: member.email,
          subject: "Today's session is still waiting for you",
          html_body: htmlShell(
            "Today's session is still waiting",
            `Your session is available until 3am in your local timezone. Open your dashboard when you are ready.`,
          ),
        }),
      ),
    );
    // Twilio SMS hook: add the SMS adapter here for missed-day alerts.

    return Response.json({ queued: incomplete.length });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
