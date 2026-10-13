import { createClient } from "@supabase/supabase-js";

const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const profileFromSession = async (sessionUser) => {
  if (!sessionUser) return null;
  const fallback = {
    id: sessionUser.id,
    email: sessionUser.email,
    name:
      sessionUser.user_metadata?.name ||
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split("@")[0] ||
      "REVO member",
    role: "customer",
  };
  if (!supabase) return fallback;
  const { data } = await supabase
    .from("profiles")
    .select("name, role, phone")
    .eq("id", sessionUser.id)
    .maybeSingle();
  return { ...fallback, ...(data || {}) };
};
