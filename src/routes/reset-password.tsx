import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { Lock, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  codeSplitGroupings: [],
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Virtual CFO Suite" },
      { name: "description", content: "Choose a new password for your Virtual CFO Suite account." },
      { property: "og:title", content: "Set a new password — Virtual CFO Suite" },
      {
        property: "og:description",
        content: "Choose a new password for your Virtual CFO Suite account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isStrong = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isStrong) {
      setError("Please ensure your new password satisfies all security criteria below.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => void navigate({ to: "/", replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md">
        <div className="bg-slate-950 text-white rounded-t-2xl px-7 py-6 border border-slate-800 border-b-0 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Account Security
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose a strong password compliant with corporate governance policies.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="w-full bg-white rounded-b-2xl border border-slate-200 p-7 space-y-4 shadow-xl"
        >
          <div>
            <label className="text-xs font-semibold text-slate-700">New Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={72}
                placeholder="New password"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                maxLength={72}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
            <div className="flex items-center gap-1.5">
              {hasLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasLength ? "text-emerald-700 font-medium" : ""}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasUpper ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasUpper ? "text-emerald-700 font-medium" : ""}>
                At least 1 uppercase letter (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasLower ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasLower ? "text-emerald-700 font-medium" : ""}>
                At least 1 lowercase letter (a-z)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasNumber ? "text-emerald-700 font-medium" : ""}>
                At least 1 numeric digit (0-9)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasSpecial ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={hasSpecial ? "text-emerald-700 font-medium" : ""}>
                At least 1 special character (!@#$%^&amp;*)
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {error}
            </p>
          )}
          {done && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              Password updated successfully! Redirecting to workspace…
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !isStrong}
            className="w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
