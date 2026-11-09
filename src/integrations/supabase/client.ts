// Client-side Supabase client with real authentication & RLS
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import { CLIENT_COMPANIES, DEFAULT_USERS } from "../../data/mockInitialData";

function cleanUrl(val?: string): string {
  if (!val || val === "1" || val === "•") return "";
  let s = val.trim();
  s = s.replace(/^1+(?=https?:\/\/)/i, "");
  s = s.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
  // Ignore defunct / dead placeholder projects
  if (s.includes("ekssebfiwrphobxinlbt")) return "";
  return s.startsWith("http") ? s : "";
}

function cleanKey(val?: string): string {
  if (!val || val === "1" || val === "•") return "";
  let s = val.trim();
  s = s.replace(/^[1•\s]+(?=(?:sb_|eyJ))/i, "");
  // Ignore dead placeholder key
  if (s.includes("ekssebfiwrphobxinlbt") || s.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3NlYmZpd3JwaG9ieGlubGJ0")) {
    return "";
  }
  return s.length > 20 ? s : "";
}

function getEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== "undefined" && (process as any)?.env?.[key]) {
      return (process as any).env[key];
    }
  } catch {}
  return undefined;
}

const rawUrl =
  cleanUrl(getEnv("VITE_SUPABASE_URL")) ||
  cleanUrl(getEnv("SUPABASE_URL"));

const rawKey =
  cleanKey(getEnv("VITE_SUPABASE_PUBLISHABLE_KEY")) ||
  cleanKey(getEnv("SUPABASE_PUBLISHABLE_KEY"));

export const isSupabaseConfigured = Boolean(rawUrl && rawKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.info(
    "[Supabase] Operating in local workspace governance mode (Supabase backend is not configured).",
  );
}

const effectiveUrl = rawUrl || "https://sandbox-preview.supabase.co";
const effectiveKey = rawKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sandbox-preview-placeholder";

export const supabase = createClient<Database>(effectiveUrl, effectiveKey, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
  },
});

// Demo fallback helpers for UI state when Supabase connection is pending
export function recoverCustomCompaniesFromLocalStorage(): any[] {
  if (typeof window === "undefined") return CLIENT_COMPANIES;
  try {
    const raw = localStorage.getItem("vcfo_companies_list_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return CLIENT_COMPANIES;
}

export function recoverCustomUsersFromLocalStorage(_recoveredCompanies?: any[]): any[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem("vcfo_user_accounts_list_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_USERS;
}
