import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://fslozcvbdxumcfpshlxr.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_kwzrACYOKzh4l_XPqCTjLQ_ZUngp-dW";

const STORAGE_KEY_URL = "zeyva_supabase_url";
const STORAGE_KEY_ANON = "zeyva_supabase_anon_key";

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = envObj.VITE_SUPABASE_URL || "";
  const envKey = envObj.VITE_SUPABASE_ANON_KEY || "";

  let localUrl = "";
  let localKey = "";

  if (typeof window !== "undefined") {
    try {
      localUrl = localStorage.getItem(STORAGE_KEY_URL) || "";
      localKey = localStorage.getItem(STORAGE_KEY_ANON) || "";
    } catch {
      // ignore
    }
  }

  const finalUrl = envUrl.trim() || localUrl.trim() || DEFAULT_SUPABASE_URL;
  const finalKey = envKey.trim() || localKey.trim() || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: finalUrl,
    anonKey: finalKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === "undefined") return;
  try {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (anonKey.trim()) {
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }

    // re-create client
    _supabase = null;
  } catch (err) {
    console.error("Failed to save supabase credentials:", err);
  }
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const { url, anonKey } = getSupabaseCredentials();

  if (url && anonKey && url.startsWith("http")) {
    try {
      _supabase = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
      });
      return _supabase;
    } catch (err) {
      console.error("Supabase client init failed:", err);
      return null;
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith("http"));
}
