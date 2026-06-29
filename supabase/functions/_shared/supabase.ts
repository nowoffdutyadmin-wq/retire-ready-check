import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function htmlShell(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a"><h1>${title}</h1><p>${body}</p></div>`;
}

export async function queueEmail(
  supabase: ReturnType<typeof adminClient>,
  event: {
    member_id?: string;
    pair_id?: string;
    event_type: string;
    recipient_email: string;
    subject: string;
    html_body: string;
  },
) {
  const { error } = await supabase.from("notification_events").insert({
    ...event,
    status: "queued",
    provider: "supabase_edge",
  });
  if (error) throw error;
}
