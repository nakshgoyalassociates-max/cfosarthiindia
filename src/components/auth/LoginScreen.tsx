import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
}

/**
 * Legacy LoginScreen removed in favor of the unified Supabase Auth route (/auth).
 * Any direct render of LoginScreen immediately redirects to /auth.
 */
export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/auth" });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Supabase Authentication Required</h1>
          <p className="text-xs text-slate-400 mt-1">
            Redirecting to the secure authentication gateway (/auth)...
          </p>
        </div>
        <button
          type="button"
          onClick={() => void navigate({ to: "/auth" })}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
