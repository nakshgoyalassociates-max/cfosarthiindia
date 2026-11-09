import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { CLIENT_COMPANIES } from "../data/mockInitialData";
import type { Role } from "../types";

export type AppRole = "admin" | "cfo" | "client_team" | "client";

export interface CompanyAccess {
  company_id: string;
  can_edit: boolean;
}

export interface CompanyRow {
  id: string;
  company_name: string;
  legal_entity: string;
  gstin: string;
  pan: string;
  cin: string;
  sector: string;
  financial_year: string;
  cfo_name: string;
  cfo_firm: string;
  is_active: boolean;
}

interface SessionContextValue {
  loading: boolean;
  session: Session | null;
  userId: string | null;
  email: string;
  fullName: string;
  roles: AppRole[];
  isAdmin: boolean;
  effectiveRole: Role;
  access: CompanyAccess[];
  companies: CompanyRow[];
  allowedCompanyIds: string[];
  canEdit: (companyId: string) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [access, setAccess] = useState<CompanyAccess[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [fullName, setFullName] = useState("");

  const load = useCallback(async (uid: string) => {
    try {
      const [rolesRes, accessRes, companiesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("user_company_access").select("company_id, can_edit").eq("user_id", uid),
        supabase.from("companies").select("*").order("company_name"),
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      ]);
      setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role));
      setAccess((accessRes.data ?? []) as CompanyAccess[]);
      setCompanies((companiesRes.data ?? []) as CompanyRow[]);
      setFullName(profileRes.data?.full_name ?? "");
    } catch (e) {
      console.warn("[SessionProvider] Error loading user session details:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (!isSupabaseConfigured || !data?.session) {
          let savedName = "Naksh Goyal (Virtual CFO Lead)";
          let savedRole: AppRole = "cfo";
          try {
            const rawUser = typeof window !== "undefined" ? localStorage.getItem("vcfo_user_account_v2") : null;
            if (rawUser) {
              const u = JSON.parse(rawUser);
              if (u.name) savedName = u.name;
              if (u.role) savedRole = u.role === "admin" ? "admin" : u.role === "cfo" ? "cfo" : u.role === "client_team" ? "client_team" : "client";
            }
          } catch {}
          setRoles([savedRole, "admin"]);
          setCompanies(CLIENT_COMPANIES as any);
          setFullName(savedName);
          setLoading(false);
          return;
        }
        setSession(data.session);
        if (data.session?.user) await load(data.session.user.id);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("[SessionProvider] Failed to fetch session, running local governance mode:", err);
        if (mounted) {
          setRoles(["cfo", "admin"]);
          setCompanies(CLIENT_COMPANIES as any);
          setFullName("Naksh Goyal (Virtual CFO Lead)");
          setLoading(false);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(s);
      if (s?.user) void load(s.user.id);
      else {
        setRoles([]);
        setAccess([]);
        setCompanies([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  // 30-minute governance idle timeout
  useEffect(() => {
    if (!session || typeof window === "undefined") return;
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.warn("[SessionProvider] Session expired due to 30 minutes of inactivity.");
        void supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [session]);

  const isAdmin = roles.includes("admin") || roles.includes("cfo");

  const effectiveRole: Role = useMemo(() => {
    if (roles.includes("admin") || roles.includes("cfo")) return "cfo";
    if (roles.includes("client_team")) return "client_team";
    return "client";
  }, [roles]);

  const allowedCompanyIds = useMemo(
    () => (isAdmin ? companies.map((c) => c.id) : access.map((a) => a.company_id)),
    [isAdmin, companies, access],
  );

  const canEdit = useCallback(
    (companyId: string) => isAdmin || access.some((a) => a.company_id === companyId && a.can_edit),
    [isAdmin, access],
  );

  const value: SessionContextValue = {
    loading,
    session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? "",
    fullName: fullName || (session?.user?.email ?? "").split("@")[0] || "",
    roles,
    isAdmin,
    effectiveRole,
    access,
    companies,
    allowedCompanyIds,
    canEdit,
    refresh: async () => {
      if (session?.user) await load(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
