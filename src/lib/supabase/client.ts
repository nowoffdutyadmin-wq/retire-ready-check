import { createClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

export const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? "";
export const siteUrl = env.VITE_SITE_URL ?? env.SITE_URL ?? "http://localhost:5173";

export const supabase = createClient(
  supabaseUrl || "http://localhost",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
