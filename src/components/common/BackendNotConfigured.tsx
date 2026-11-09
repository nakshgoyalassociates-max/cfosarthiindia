import React from "react";
import { ShieldAlert, KeyRound, Database, Cpu, ExternalLink } from "lucide-react";

export const BackendNotConfigured: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-2xl bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Backend Not Configured</h1>
            <p className="text-sm text-slate-400">
              Virtual CFO Suite requires active Supabase environment credentials.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-sm space-y-2">
            <p className="text-slate-300">
              In accordance with security hardening protocols, mock auth and in-browser fallback
              databases have been disabled. Production RLS, role enforcement (Admin, CFO, Client
              Team, Client), and audit logs require a live Supabase connection.
            </p>
          </div>

          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Required Environment Variables
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono font-semibold text-slate-200">SUPABASE_URL</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Your Supabase project URL</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono font-semibold text-slate-200">SUPABASE_PUBLISHABLE_KEY</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Publishable anon/public API key</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono font-semibold text-slate-200">SUPABASE_SERVICE_ROLE_KEY</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Server-side admin operations</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono font-semibold text-slate-200">GEMINI_API_KEY</p>
                <p className="text-slate-400 text-[11px] mt-0.5">CFO executive AI report engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Configure these in your project environment settings or .env file.</p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Open Supabase Dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BackendNotConfigured;
