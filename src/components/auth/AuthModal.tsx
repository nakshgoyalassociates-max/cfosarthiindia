import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "../../context/AppContext";
import { USER_PERMISSION_PRESET_LABELS } from "../../data/mockAdminSecurityData";
import {
  ShieldCheck,
  X,
  LogOut,
  Users,
  Sliders,
  KeyRound,
  Building2,
  UserPlus,
} from "lucide-react";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    setIsInviteModalOpen,
    currentUser,
    role,
    logout,
    userAccounts,
    getUserPermissions,
    effectivePermissions,
  } = useApp();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const clientTeamUsers = userAccounts.filter((u) => u.role === "client_team");

  const handleSignOut = () => {
    logout();
    void navigate({ to: "/auth" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Supabase Authenticated Session
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Account Session &amp; Role Access Profile
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your workspace role is verified from Supabase{" "}
              <code className="text-indigo-300">user_roles</code> &amp;{" "}
              <code className="text-indigo-300">user_company_access</code>.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Bar */}
        <div className="bg-indigo-50/60 border-b border-indigo-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                  Role: {role === "client_team" ? "Client Team" : role.toUpperCase()}
                </span>
                {currentUser.permissionPreset && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                    {USER_PERMISSION_PRESET_LABELS[currentUser.permissionPreset]?.label ||
                      "Custom Rights"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentUser.roleTitle} • {currentUser.email}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-indigo-600" />
                <span>
                  Scope:{" "}
                  {currentUser.companyName ||
                    (currentUser.companyId === "all"
                      ? "All Portfolio Companies"
                      : currentUser.companyId)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Session</span>
          </button>
        </div>

        {/* Active Permissions Summary */}
        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Effective Module Permissions
              </span>
              <span className="text-[11px] text-slate-500">
                Enforced by Supabase RLS &amp; Role Guard
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Financial MIS
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {effectivePermissions.mis.canEdit
                    ? effectivePermissions.mis.canUploadExcel
                      ? "Edit + Upload"
                      : "Edit"
                    : effectivePermissions.mis.canView
                      ? "View Only"
                      : "No Access"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Budget &amp; Actuals
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {effectivePermissions.budget.canEdit
                    ? effectivePermissions.budget.canUploadExcel
                      ? "Edit + Upload"
                      : "Edit"
                    : effectivePermissions.budget.canView
                      ? "View Only"
                      : "No Access"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Compliances
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {effectivePermissions.compliances.canApprove
                    ? "Approve & File"
                    : effectivePermissions.compliances.canEdit
                      ? "Edit & File"
                      : effectivePermissions.compliances.canView
                        ? "View Only"
                        : "No Access"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Action Plans
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {effectivePermissions.actions.canEdit
                    ? "Create & Edit"
                    : effectivePermissions.actions.canView
                      ? "View Only"
                      : "No Access"}
                </div>
              </div>
            </div>
          </div>

          {/* Client Team Member Permission Preview (for CFO Admin / Client Team) */}
          {(role === "cfo" || role === "client_team") && clientTeamUsers.length > 0 && (
            <div className="border border-sky-200 rounded-xl p-4 bg-sky-50/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Client Finance Team Directory
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    {clientTeamUsers.length} Members
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {clientTeamUsers.map((person) => {
                  const perms = getUserPermissions(person.id);
                  const isCurrent = currentUser.id === person.id;
                  return (
                    <div
                      key={person.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors ${
                        isCurrent
                          ? "bg-sky-50 border-sky-300 text-sky-950 font-medium"
                          : "bg-white text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">
                          {person.name} ({person.roleTitle})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          MIS:{" "}
                          {perms.mis.canEdit
                            ? perms.mis.canUploadExcel
                              ? "Edit+Excel"
                              : "Edit"
                            : "View"}{" "}
                          • Budget: {perms.budget.canEdit ? "Edit" : "View"} • Compliances:{" "}
                          {perms.compliances.canEdit ? "Edit" : "View"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                          isCurrent
                            ? "bg-sky-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isCurrent ? "Active Account" : "Registered"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>To switch to a different Supabase account, sign out and log in at /auth.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 rounded hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
