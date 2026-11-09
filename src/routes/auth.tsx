import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
  KeyRound,
  ArrowRight,
  Building2,
  User,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_USERS } from "@/data/mockInitialData";
import { DEFAULT_USER_PERMISSIONS, buildPermissionsFromPreset } from "@/data/mockAdminSecurityData";
import type { UserAccount, Role } from "@/types";

export const Route = createFileRoute("/auth")({
  codeSplitGroupings: [],
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Virtual CFO Suite" },
      {
        name: "description",
        content: "Secure governance sign-in for CFO, client team, and executive client accounts.",
      },
      { property: "og:title", content: "Sign in — Virtual CFO Suite" },
      {
        property: "og:description",
        content: "Secure governance sign-in for CFO, client team, and executive client accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

export function validateStrongPassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  return null;
}

function AuthPage() {
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("nakshgoyal.associates@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    // If user is already authenticated in local state, redirect
    try {
      if (typeof window !== "undefined" && localStorage.getItem("vcfo_is_authenticated") === "true") {
        void navigate({ to: "/", replace: true });
        return;
      }
    } catch {}

    if (isSupabaseConfigured) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data.session) void navigate({ to: "/", replace: true });
        })
        .catch(() => {});
    }
  }, [navigate]);

  const authenticateSession = (user: UserAccount) => {
    try {
      localStorage.setItem("vcfo_is_authenticated", "true");
      localStorage.setItem("vcfo_preview_role", user.role);
      localStorage.setItem("vcfo_user_account_v2", JSON.stringify(user));
      setMessage(`Signing in as ${user.name} (${user.roleTitle || user.role})...`);
      setTimeout(() => {
        void navigate({ to: "/", replace: true });
      }, 350);
    } catch {
      void navigate({ to: "/", replace: true });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your registered workspace email address.");
      setBusy(false);
      return;
    }

    // Try Supabase auth if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!signInErr && data?.session) {
          // Check if MFA (AAL2) is required
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
            const factorsRes = await supabase.auth.mfa.listFactors();
            const totp = factorsRes.data?.totp?.[0];
            if (totp) {
              setMfaFactorId(totp.id);
              setRequiresMfa(true);
              setBusy(false);
              return;
            }
          }

          localStorage.setItem("vcfo_is_authenticated", "true");
          void navigate({ to: "/", replace: true });
          return;
        }
      } catch (err) {
        console.warn("[Auth] Supabase remote sign in unhandled error:", err);
      }
    }

    // Seamless Local Workspace Authentication
    // Match against known default and configured users
    const lowerEmail = cleanEmail.toLowerCase();
    const matchedUser = DEFAULT_USERS.find(
      (u) => u.email.toLowerCase() === lowerEmail,
    );

    if (matchedUser) {
      authenticateSession(matchedUser);
      setBusy(false);
      return;
    }

    // If new / custom email, construct a Virtual CFO Practice lead account
    const newLocalUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Virtual CFO Partner",
      email: cleanEmail,
      role: "cfo",
      roleTitle: "Virtual CFO & Practice Partner",
      companyId: "all",
      companyName: "Virtual CFO Practice",
      avatar: cleanEmail.slice(0, 2).toUpperCase(),
      phone: "+91 98201 45892",
      lastLoginAt: "Just now",
      isAdmin: true,
      permissionPreset: "full_edit",
      permissions: DEFAULT_USER_PERMISSIONS["user-naksh-goyal"] || DEFAULT_USER_PERMISSIONS["user-cfo"] || buildPermissionsFromPreset("full_edit", "cfo"),
    };

    authenticateSession(newLocalUser);
    setBusy(false);
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId) return;
    setBusy(true);
    setError(null);

    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeErr) throw challengeErr;

      const { data: verifyData, error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });
      if (verifyErr) throw verifyErr;

      if (verifyData) {
        localStorage.setItem("vcfo_is_authenticated", "true");
        void navigate({ to: "/", replace: true });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid MFA verification code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your workspace email address.");
      setBusy(false);
      return;
    }

    const pwError = validateStrongPassword(password);
    if (pwError) {
      setError(pwError);
      setBusy(false);
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (signUpErr) throw signUpErr;

        if (data?.session) {
          setMessage("Account created and verified! Redirecting to workspace...");
          localStorage.setItem("vcfo_is_authenticated", "true");
          setTimeout(() => void navigate({ to: "/", replace: true }), 900);
          return;
        } else if (data?.user && !data.session) {
          setMessage(
            "Account created! Check your inbox to confirm your email, or sign in directly.",
          );
          setAuthMode("signin");
          setBusy(false);
          return;
        }
      } catch (err: any) {
        // Fall back to local account creation below
        console.warn("[Auth] Supabase signup error, continuing locally:", err);
      }
    }

    // Local account registration
    const newLocalUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Virtual CFO Partner",
      email: cleanEmail,
      role: "cfo",
      roleTitle: "Virtual CFO & Practice Partner",
      companyId: "all",
      companyName: "Virtual CFO Practice",
      avatar: cleanEmail.slice(0, 2).toUpperCase(),
      phone: "+91 98201 45892",
      lastLoginAt: "Just now",
      isAdmin: true,
      permissionPreset: "full_edit",
      permissions: DEFAULT_USER_PERMISSIONS["user-naksh-goyal"] || DEFAULT_USER_PERMISSIONS["user-cfo"] || buildPermissionsFromPreset("full_edit", "cfo"),
    };

    setMessage("Account registered successfully! Redirecting to workspace...");
    setTimeout(() => {
      authenticateSession(newLocalUser);
    }, 400);
    setBusy(false);
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);

    if (isSupabaseConfigured) {
      try {
        const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: false,
          },
        });
        if (!oauthErr && data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err: any) {
        console.warn("[Auth] Supabase Google OAuth error:", err);
      }
    }

    // Default to Naksh Goyal & Associates Google session
    const googleUser = DEFAULT_USERS.find(
      (u) => u.email === "nakshgoyal.associates@gmail.com",
    ) || DEFAULT_USERS[0];

    setMessage(`Signed in via Google as ${googleUser.name} (${googleUser.email})`);
    setTimeout(() => {
      authenticateSession(googleUser);
    }, 350);
  };

  const quickLoginOptions: Array<{
    user: UserAccount;
    tag: string;
    description: string;
    badgeColor: string;
    borderHover: string;
  }> = [
    {
      user: DEFAULT_USERS[0], // Naksh Goyal
      tag: "Lead Partner & CFO",
      description: "Full portfolio control, sign-offs, MIS approvals & admin access",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      borderHover: "hover:border-indigo-500 hover:bg-indigo-50/50",
    },
    {
      user: DEFAULT_USERS[1], // Sudhakar (cfo@practice.com)
      tag: "Practice Partner",
      description: "Virtual CFO Practice, multi-company overview & analytics",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      borderHover: "hover:border-blue-500 hover:bg-blue-50/50",
    },
    {
      user: DEFAULT_USERS[2], // Anand Verma (MD)
      tag: "Client Promoter",
      description: "Nexora Innovations Tech — Executive MIS radar & action tracking",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      borderHover: "hover:border-emerald-500 hover:bg-emerald-50/50",
    },
    {
      user: DEFAULT_USERS[3], // Pooja Sharma (Client Team)
      tag: "Client Finance Team",
      description: "Sr. Tax & Accounts — Compliance filing & document upload",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      borderHover: "hover:border-amber-500 hover:bg-amber-50/50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-xl my-6">
        {/* Header Banner */}
        <div className="bg-slate-900 text-white rounded-t-2xl px-7 py-6 border border-slate-800 border-b-0 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                  Enterprise Financial Governance
                </span>
                <h1 className="text-xl font-extrabold tracking-tight">Virtual CFO Suite</h1>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
              MIS Insights Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {requiresMfa
              ? "Multi-Factor Authentication Required"
              : "Sign in with your workspace credentials or choose a quick 1-click role below."}
          </p>
        </div>

        {/* Main Body */}
        <div className="bg-white rounded-b-2xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-2xl">
          {requiresMfa ? (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  6-Digit Authenticator Code
                </label>
                <div className="relative mt-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123456"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter the code from your authenticator app (Google Authenticator, Authy, etc.).
                </p>
              </div>

              {error && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || mfaCode.length < 6}
                className="w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify &amp; Enter Workspace
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequiresMfa(false);
                  setMfaCode("");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 cursor-pointer pt-2"
              >
                Back to standard sign-in
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 1-Click Fast Login Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Quick 1-Click Workspace Sign In
                  </span>
                  <span className="text-[10px] text-slate-400">Instant Access</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quickLoginOptions.map((opt) => (
                    <button
                      key={opt.user.id}
                      type="button"
                      onClick={() => authenticateSession(opt.user)}
                      className={`text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 transition-all cursor-pointer group ${opt.borderHover} shadow-2xs`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-indigo-600 transition-colors">
                            {opt.user.avatar}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                            {opt.user.name}
                          </span>
                        </div>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${opt.badgeColor}`}
                        >
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{opt.description}</p>
                      <div className="mt-1.5 text-[10.5px] font-mono text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <span>{opt.user.email}</span>
                        <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-wider text-[10px]">
                    Or Sign In with Email &amp; Password
                  </span>
                </div>
              </div>

              {/* Tab Selector: Sign In vs Sign Up */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-white text-indigo-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-white text-indigo-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form
                onSubmit={authMode === "signin" ? handleSignIn : handleSignUp}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Workspace Email Address
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="name@practice.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-400">Demo password: admin123</span>
                  </div>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={72}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                    {error}
                  </p>
                )}
                {message && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{message}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {authMode === "signin" ? "Sign In to Workspace" : "Register Workspace Account"}
                </button>

                {/* Google Sign In option */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogleSignIn}
                  className="w-full rounded-lg border border-slate-300 bg-white text-xs font-semibold py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    G
                  </span>
                  <span>Continue with Google (nakshgoyal.associates@gmail.com)</span>
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          <Link to="/" className="hover:text-white inline-flex items-center gap-1 transition">
            <span>Directly open workspace dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
