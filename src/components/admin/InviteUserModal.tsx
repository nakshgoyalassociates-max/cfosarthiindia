import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { supabase } from "../../integrations/supabase/client";
import {
  X,
  Mail,
  User,
  ShieldCheck,
  Building2,
  UserPlus,
  Check,
  Copy,
  Loader2,
  Sliders,
  Users,
  UserCheck,
} from "lucide-react";
import { Role, UserPermissionPreset } from "../../types";
import { buildPermissionsFromPreset } from "../../data/mockAdminSecurityData";

export const InviteUserModal: React.FC = () => {
  const {
    isInviteModalOpen,
    setIsInviteModalOpen,
    companies,
    activeCompanyId,
    addUserAccount,
    userAccounts,
    showToast,
  } = useApp();

  const [modalTab, setModalTab] = useState<"invite" | "directory">("invite");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client_team");
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState<string>(activeCompanyId || "client-101");
  const [permissionPreset, setPermissionPreset] =
    useState<UserPermissionPreset>("full_edit_upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    email: string;
    name: string;
    role: Role;
    directLink: string;
    serverInvited: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isInviteModalOpen) return null;

  const handleClose = () => {
    setIsInviteModalOpen(false);
    setSuccessInfo(null);
    setErrorMsg(null);
    setFullName("");
    setEmail("");
    setRole("client_team");
    setTitle("");
    setModalTab("invite");
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === "cfo") {
      setCompanyId("all");
      setTitle("Virtual CFO & Practice Partner");
      setPermissionPreset("super_admin");
    } else if (newRole === "client") {
      if (companyId === "all") setCompanyId(companies[0]?.id || "client-101");
      setTitle("Managing Director / Executive Client");
      setPermissionPreset("view_only");
    } else {
      if (companyId === "all") setCompanyId(companies[0]?.id || "client-101");
      setTitle("Finance Manager / Accounts Lead");
      setPermissionPreset("full_edit_upload");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    if (!cleanEmail || !cleanName) {
      setErrorMsg("Please provide both a full name and a valid email address.");
      return;
    }

    setIsSubmitting(true);
    let serverInvited = false;

    // 1. Call server-side invite API if user has active session
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (token) {
        const res = await fetch("/api/admin/invite-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: cleanEmail,
            fullName: cleanName,
            role,
            companyIds: role === "cfo" || companyId === "all" ? ["all"] : [companyId],
            canEditCompanies: role !== "client",
          }),
        });

        if (res.ok) {
          serverInvited = true;
        } else {
          const resJson = await res.json().catch(() => ({}));
          console.warn("Server invite returned:", resJson);
        }
      }
    } catch (err) {
      console.warn("Server invite call error:", err);
    }

    // 2. Add to workspace user directory & permissions registry
    const defaultTitle =
      title.trim() ||
      (role === "cfo"
        ? "Virtual CFO"
        : role === "client"
          ? "Client Executive"
          : "Client Finance Team");

    const matchedComp = companies.find((c) => c.id === companyId);
    addUserAccount({
      name: cleanName,
      email: cleanEmail,
      role,
      roleTitle: defaultTitle,
      companyId: role === "cfo" ? "all" : companyId,
      companyName:
        role === "cfo"
          ? "All Managed Entities"
          : matchedComp?.companyName || "Client Entity",
      assignedCompanyIds: role === "cfo" ? ["all"] : [companyId],
      isAdmin: role === "cfo",
      permissionPreset,
      permissions: buildPermissionsFromPreset(permissionPreset, role),
      avatar:
        cleanName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "US",
    });

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const directLink = `${origin}/auth`;

    setSuccessInfo({
      email: cleanEmail,
      name: cleanName,
      role,
      directLink,
      serverInvited,
    });

    setIsSubmitting(false);
    showToast(`Access configured for ${cleanName} (${role.toUpperCase()})`);
  };

  const handleCopyLink = () => {
    if (!successInfo) return;
    void navigator.clipboard.writeText(successInfo.directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite User to Workspace</h2>
              <p className="text-xs text-slate-400">
                Grant access to client executives, team members, or CFO associates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setModalTab("invite")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              modalTab === "invite"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Send Invitation</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab("directory")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              modalTab === "directory"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workspace Members ({userAccounts.length})</span>
          </button>
        </div>

        {/* Content */}
        {modalTab === "directory" ? (
          <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Enrolled Members &amp; Invitations
                </h3>
                <p className="text-[11px] text-slate-500">
                  All active team members, executives, and CFO associates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTab("invite")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3 h-3" />
                <span>Invite New</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {userAccounts.map((member) => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const memberLoginLink = `${origin}/auth`;
                const isCopied = copiedMemberId === member.id;
                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 truncate">{member.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              member.role === "cfo"
                                ? "bg-indigo-100 text-indigo-800"
                                : member.role === "client"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {member.role === "client_team" ? "Finance Team" : member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {member.roleTitle} • {member.companyName || "All Entities"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(memberLoginLink);
                        setCopiedMemberId(member.id);
                        setTimeout(() => setCopiedMemberId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
                      title="Copy workspace sign-in link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Login Link</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : successInfo ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">
                User Added &amp; Permissions Configured!
              </h3>
              <p className="text-xs text-emerald-800">
                <strong>{successInfo.name}</strong> ({successInfo.email}) has been enrolled as a{" "}
                <span className="font-semibold uppercase tracking-wider">
                  {successInfo.role === "client_team"
                    ? "Client Team Member"
                    : successInfo.role === "client"
                      ? "Client Executive"
                      : "Virtual CFO"}
                </span>
                .
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">How they access the workspace:</div>
              <p className="text-slate-600">
                {successInfo.serverInvited
                  ? "An automated invitation email has been sent by Supabase. They can also navigate directly to the workspace login URL below:"
                  : "Share the workspace URL below with them. They can register or sign in at this link using their email address to access their assigned companies and permissions:"}
              </p>

              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-2 font-mono text-[11px] text-slate-800">
                <span className="flex-1 truncate">{successInfo.directLink}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessInfo(null);
                  setFullName("");
                  setEmail("");
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Invite Another User
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Role Selection Tabs */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Assign Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("client_team")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === "client_team"
                      ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Client Team</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Tasks, MIS, compliances &amp; repository
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("client")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === "client"
                      ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Client Exec</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Executive dashboard &amp; MIS synopsis
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("cfo")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === "cfo"
                      ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>CFO Associate</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Portfolio control, admin &amp; filings
                  </p>
                </button>
              </div>
            </div>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Designation / Role Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Designation / Workspace Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  role === "cfo"
                    ? "Virtual CFO / Senior Partner"
                    : role === "client"
                      ? "Managing Director / Promoter"
                      : "Finance Manager / Senior Accountant"
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Entity / Company Assignment */}
            {role !== "cfo" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assigned Client Company
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.legalEntity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Permission Rights Preset */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Permissions Level
              </label>
              <div className="relative">
                <Sliders className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={permissionPreset}
                  onChange={(e) => setPermissionPreset(e.target.value as UserPermissionPreset)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="full_edit_upload">Full Edit &amp; Excel Upload (Standard)</option>
                  <option value="view_and_edit">View &amp; Edit (No File Upload)</option>
                  <option value="view_only">View Only (Audit / Read-Only Access)</option>
                  {role === "cfo" && (
                    <option value="super_admin">Super-Admin (Unrestricted Master Rights)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Quick How It Works & Instant URL Sharing */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-900">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Invitation Delivery Details
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                  Supabase Auth &amp; RLS
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When you click <strong>Send Invitation</strong>, an automated Supabase invite email will be sent to the recipient's address. Their entity access and module permissions will be configured immediately. You can also share the direct workspace URL below:
              </p>
              <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg p-2 font-mono text-[11px] text-slate-800">
                <span className="flex-1 truncate">
                  {typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    void navigator.clipboard.writeText(`${origin}/auth`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Invitation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
