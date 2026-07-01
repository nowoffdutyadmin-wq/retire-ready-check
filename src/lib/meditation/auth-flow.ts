import { supabase } from "@/lib/supabase/client";

export type PortalPath = "/admin" | "/dashboard" | "/login";

export async function exchangeAuthCodeFromUrl() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return;

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function getPortalPathForSession(): Promise<PortalPath> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return "/login";

  const { data: member, error } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (member?.role === "admin") return "/admin";
  return "/dashboard";
}
