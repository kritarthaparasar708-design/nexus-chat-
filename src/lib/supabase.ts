import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"]?.trim() ?? "";
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"]?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.",
    );
  }
  return supabase;
}
