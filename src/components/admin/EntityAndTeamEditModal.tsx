import React, { useState, useEffect } from "react";
import {
  ClientProfile,
  Role,
  UserAccount,
  UserModulePermissions,
  UserPermissionPreset,
  PermissionModuleKey,
  ModulePermission,
} from "../../types";
import {
  DEFAULT_ROLE_PERMISSIONS,
  buildPermissionsFromPreset,
} from "../../data/mockAdminSecurityData";
import { CompanyRatioBenchmarks, DEFAULT_RATIO_BENCHMARKS } from "../../utils/ratios";
import {
  Building2,
  Users,
  X,
  Check,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  ShieldCheck,
  Sliders,
  Eye,
  FileSpreadsheet,
  Lock,
} from "lucide-react";

const PERMISSION_MODULES: Array<{
  key: PermissionModuleKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "mis", label: "Financial MIS & Statements", shortLabel: "MIS" },
  { key: "budget", label: "Monthly Budget & Variances", shortLabel: "Budget" },
  { key: "compliances", label: "Statutory Compliances", shortLabel: "Compliances" },
  { key: "actions", label: "Action Tasks & Flow", shortLabel: "Actions" },
  { key: "companies", label: "Company & Repository Info", shortLabel: "Entity/Repo" },
];

export function summarizeUserPermissions(perms?: UserModulePermissions): {
  label: string;
  badgeClass: string;
  moduleBadges: Array<{ mod: string; status: string; color: string }>;
} {
  if (!perms) {
    return {
      label: "Standard View & Edit",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
      moduleBadges: [],
    };
  }
  const modules: PermissionModuleKey[] = ["mis", "budget", "compliances", "actions", "companies"];
  const editCount = modules.filter((m) => perms[m]?.canEdit).length;
  const uploadCount = modules.filter((m) => perms[m]?.canUploadExcel).length;
  const viewCount = modules.filter((m) => perms[m]?.canView).length;

  let label = "Custom Access Rights";
  let badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";

  if (viewCount === 0) {
    label = "No Access";
    badgeClass = "bg-rose-100 text-rose-800 border-rose-200";
  } else if (editCount === 0) {
    label = "View Only (Read-Only)";
    badgeClass = "bg-slate-100 text-slate-700 border-slate-300";
  } else if (editCount >= 4 && uploadCount >= 2) {
    label = "Full View, Edit & Excel Upload";
    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (perms.compliances?.canEdit && perms.actions?.canEdit && !perms.mis?.canEdit) {
    label = "Compliances & Actions Edit • MIS View-Only";
    badgeClass = "bg-amber-100 text-amber-800 border-amber-200";
  } else {
    label = `View (${viewCount}/5) • Edit (${editCount}/5)${uploadCount > 0 ? ` • Excel (${uploadCount})` : ""}`;
    badgeClass = "bg-sky-100 text-sky-800 border-sky-200";
  }

  const moduleBadges = PERMISSION_MODULES.map((m) => {
    const p = perms[m.key];
    if (!p?.canView) {
      return {
        mod: m.shortLabel,
        status: "Hidden",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    if (p.canEdit && p.canUploadExcel) {
      return {
        mod: m.shortLabel,
        status: "Edit+Excel",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (p.canEdit) {
      return {
        mod: m.shortLabel,
        status: "View+Edit",
        color: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }
    return {
      mod: m.shortLabel,
      status: "View Only",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  });

  return { label, badgeClass, moduleBadges };
}

interface PersonPermissionsEditorProps {
  personName: string;
  role: Role;
  permissions: UserModulePermissions;
  preset?: UserPermissionPreset;
  onChangePermissions: (next: UserModulePermissions, nextPreset?: UserPermissionPreset) => void;
  compact?: boolean;
}

export const PersonPermissionsEditor: React.FC<PersonPermissionsEditorProps> = ({
  personName,
  role,
  permissions,
  preset = "custom",
  onChangePermissions,
  compact = false,
}) => {
  const handleToggle = (
    modKey: PermissionModuleKey,
    field: keyof ModulePermission,
    checked: boolean,
  ) => {
    const currMod = permissions[modKey] || {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    };
    const nextMod: ModulePermission = {
      ...currMod,
      [field]: checked,
      ...(checked && field !== "canView" ? { canView: true } : {}),
      ...(!checked && field === "canView"
        ? { canEdit: false, canUploadExcel: false, canDelete: false, canApprove: false }
        : {}),
    };
    onChangePermissions(
      {
        ...permissions,
        [modKey]: nextMod,
      },
      "custom",
    );
  };

  const handleApplyPreset = (targetPreset: UserPermissionPreset) => {
    const built = buildPermissionsFromPreset(targetPreset, role);
    onChangePermissions(built, targetPreset);
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-200/70">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-indigo-950">
              Specific Person Viewing & Editing Rights — {personName || "Team Member"}
            </div>
            <div className="text-[10px] text-slate-600">
              Grant granular View, Edit/Draft, Excel Upload, or Delete rights specifically for this
              person.
            </div>
          </div>
        </div>

        {/* Preset Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "full_edit", label: "Full Edit + Excel" },
            { id: "view_and_edit", label: "View & Edit" },
            { id: "compliance_focus", label: "Compliance Edit / MIS View" },
            { id: "view_only", label: "View Only" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id as UserPermissionPreset)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                preset === p.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-indigo-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-2 px-3">Module</th>
              <th className="py-2 px-2 text-center">Can View</th>
              <th className="py-2 px-2 text-center">Can Edit / Draft</th>
              <th className="py-2 px-2 text-center">Upload Excel</th>
              <th className="py-2 px-2 text-center">Can Delete</th>
              {!compact && <th className="py-2 px-2 text-center">Can Approve</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSION_MODULES.map((m) => {
              const modPerm = permissions[m.key] || {
                canView: true,
                canEdit: false,
                canUploadExcel: false,
                canDelete: false,
                canApprove: false,
              };
              return (
                <tr key={m.key} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-semibold text-slate-800">{m.label}</td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!modPerm.canView}
                      onChange={(e) => handleToggle(m.key, "canView", e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!modPerm.canEdit}
                      onChange={(e) => handleToggle(m.key, "canEdit", e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!modPerm.canUploadExcel}
                      onChange={(e) => handleToggle(m.key, "canUploadExcel", e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!modPerm.canDelete}
                      onChange={(e) => handleToggle(m.key, "canDelete", e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  {!compact && (
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!modPerm.canApprove}
                        onChange={(e) => handleToggle(m.key, "canApprove", e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface EntityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: ClientProfile | null;
  companies: ClientProfile[];
  userAccounts: UserAccount[];
  onSaveCompany: (updated: ClientProfile) => void;
  onAddUser: (user: Omit<UserAccount, "id">) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  initialSubTab?: "details" | "team" | "benchmarks";
}

export const EntityEditModal: React.FC<EntityEditModalProps> = ({
  isOpen,
  onClose,
  company,
  userAccounts,
  onSaveCompany,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  initialSubTab = "details",
}) => {
  const [subTab, setSubTab] = useState<"details" | "team" | "benchmarks">(initialSubTab);

  // Entity profile form state
  const [companyName, setCompanyName] = useState("");
  const [legalEntity, setLegalEntity] = useState("Private Limited Company (India)");
  const [sector, setSector] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [cin, setCin] = useState("");
  const [city, setCity] = useState("");
  const [financialYear, setFinancialYear] = useState("FY 2026-27 (AY 2027-28)");
  const [turnoverBracket, setTurnoverBracket] = useState("₹25 Cr - ₹50 Cr");
  const [incorporationYear, setIncorporationYear] = useState<number>(2021);
  const [assignedCfo, setAssignedCfo] = useState("");
  const [cfoFirm, setCfoFirm] = useState("");

  // Company Ratio Benchmarks State
  const [benchmarks, setBenchmarks] = useState<CompanyRatioBenchmarks>(() => ({
    ...DEFAULT_RATIO_BENCHMARKS,
    ...(company?.ratioBenchmarks || {}),
  }));

  // Inline team member editing state inside the Entity modal
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [permissionsExpandedId, setPermissionsExpandedId] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<{
    name: string;
    email: string;
    phone: string;
    role: Role;
    roleTitle: string;
    permissions: UserModulePermissions;
    permissionPreset: UserPermissionPreset;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "client_team",
    roleTitle: "",
    permissions: buildPermissionsFromPreset("view_and_edit", "client_team"),
    permissionPreset: "view_and_edit",
  });

  // Add new team member to this entity
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState<{
    name: string;
    email: string;
    phone: string;
    role: Role;
    roleTitle: string;
    permissions: UserModulePermissions;
    permissionPreset: UserPermissionPreset;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "client_team",
    roleTitle: "Accounts Executive",
    permissions: buildPermissionsFromPreset("view_and_edit", "client_team"),
    permissionPreset: "view_and_edit",
  });

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab, company?.id]);

  useEffect(() => {
    if (company) {
      setCompanyName(company.companyName || "");
      setLegalEntity(company.legalEntity || "Private Limited Company (India)");
      setSector(company.sector || "Technology & SaaS");
      setGstin(company.gstin || "");
      setPan(company.pan || "");
      setCin(company.cin || "");
      setCity(company.city || "Bengaluru");
      setFinancialYear(company.financialYear || "FY 2026-27 (AY 2027-28)");
      setTurnoverBracket(company.turnoverBracket || "₹25 Cr - ₹50 Cr");
      setIncorporationYear(company.incorporationYear || 2021);
      const cfoFallback = userAccounts.find((u) => u.role === "cfo")?.name || "Sudhakar";
      setAssignedCfo(company.assignedCfo || company.cfoName || cfoFallback);
      setCfoFirm(company.cfoFirm || "Virtual CFO Practice");
      setBenchmarks({
        ...DEFAULT_RATIO_BENCHMARKS,
        ...(company.ratioBenchmarks || {}),
      });
      setEditingMemberId(null);
      setPermissionsExpandedId(null);
      setShowAddMemberForm(false);
    }
  }, [company, userAccounts]);

  if (!isOpen || !company) return null;

  const entityMembers = userAccounts.filter(
    (u) => u.companyId === company.id || (u.assignedCompanyIds || []).includes(company.id),
  );

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    onSaveCompany({
      ...company,
      companyName: companyName.trim(),
      legalEntity: legalEntity.trim(),
      sector: sector.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      cin: cin.trim().toUpperCase(),
      city: city.trim(),
      financialYear: financialYear.trim(),
      turnoverBracket: turnoverBracket.trim(),
      incorporationYear: Number(incorporationYear) || 2021,
      assignedCfo: assignedCfo.trim(),
      cfoName: assignedCfo.trim(),
      cfoFirm: cfoFirm.trim(),
      ratioBenchmarks: benchmarks,
    });
    onClose();
  };

  const handleSaveBenchmarks = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveCompany({
      ...company,
      ratioBenchmarks: benchmarks,
    });
    onClose();
  };

  const startEditMember = (member: UserAccount) => {
    setEditingMemberId(member.id);
    setPermissionsExpandedId(null);
    const defaultPerms =
      member.permissions ||
      buildPermissionsFromPreset(
        member.permissionPreset || (member.role === "client" ? "view_only" : "view_and_edit"),
        member.role,
      );
    setMemberDraft({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "client_team",
      roleTitle:
        member.roleTitle ||
        (member as any).title ||
        (member.role === "client" ? "Managing Director" : "Accounts Executive"),
      permissions: JSON.parse(JSON.stringify(defaultPerms)),
      permissionPreset:
        member.permissionPreset || (member.role === "client" ? "view_only" : "view_and_edit"),
    });
  };

  const saveMemberEdit = (member: UserAccount) => {
    if (!memberDraft.name.trim() || !memberDraft.email.trim()) return;
    onUpdateUser({
      ...member,
      name: memberDraft.name.trim(),
      email: memberDraft.email.trim().toLowerCase(),
      phone: memberDraft.phone.trim(),
      role: memberDraft.role,
      roleTitle:
        memberDraft.roleTitle.trim() ||
        (memberDraft.role === "client" ? "Director" : "Finance Executive"),
      companyId: company.id,
      companyName: companyName.trim() || company.companyName,
      permissions: memberDraft.permissions,
      permissionPreset: memberDraft.permissionPreset,
    });
    setEditingMemberId(null);
  };

  const handleDirectPermissionChange = (
    member: UserAccount,
    nextPerms: UserModulePermissions,
    nextPreset?: UserPermissionPreset,
  ) => {
    onUpdateUser({
      ...member,
      permissions: nextPerms,
      permissionPreset: nextPreset || "custom",
    });
  };

  const handleAddEntityMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    const initials =
      newMember.name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "TM";

    onAddUser({
      name: newMember.name.trim(),
      email: newMember.email.trim().toLowerCase(),
      phone: newMember.phone.trim() || "+91 98000 00000",
      role: newMember.role,
      roleTitle:
        newMember.roleTitle.trim() ||
        (newMember.role === "client" ? "Director & Promoter" : "Accounts Executive"),
      companyId: company.id,
      companyName: companyName.trim() || company.companyName,
      avatar: initials,
      permissions: newMember.permissions,
      permissionPreset: newMember.permissionPreset,
    });
    setNewMember({
      name: "",
      email: "",
      phone: "",
      role: "client_team",
      roleTitle: "Accounts Executive",
      permissions: buildPermissionsFromPreset("view_and_edit", "client_team"),
      permissionPreset: "view_and_edit",
    });
    setShowAddMemberForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Edit Entity Profile & Specific Client Team Member Rights
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {company.companyName} • Manage statutory details and assign individual viewing,
                editing &amp; Excel upload rights per person
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab("details")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "details"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Entity Corporate Profile & Statutory Info</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("team")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "team"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Client Team Members & Specific Person Rights ({entityMembers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("benchmarks")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "benchmarks"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Financial Ratio Benchmarks &amp; Targets</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {subTab === "details" ? (
            <form id="edit-entity-form" onSubmit={handleSaveDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal Entity Constitution
                  </label>
                  <select
                    value={legalEntity}
                    onChange={(e) => setLegalEntity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Private Limited Company (India)">
                      Private Limited Company (India)
                    </option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Limited Liability Partnership (LLP)">
                      Limited Liability Partnership (LLP)
                    </option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g. Information Technology & SaaS"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AAACN4921E1ZQ"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate PAN</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="AAACN4921E"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CIN / LLPIN Registration No.
                  </label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="U72900MH2021PTC358912"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Active Financial Year
                  </label>
                  <input
                    type="text"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    placeholder="FY 2026-27 (AY 2027-28)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Turnover Bracket
                  </label>
                  <select
                    value={turnoverBracket}
                    onChange={(e) => setTurnoverBracket(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="Below ₹5 Cr">Below ₹5 Cr</option>
                    <option value="₹5 Cr - ₹10 Cr">₹5 Cr - ₹10 Cr</option>
                    <option value="₹10 Cr - ₹25 Cr">₹10 Cr - ₹25 Cr</option>
                    <option value="₹25 Cr - ₹50 Cr">₹25 Cr - ₹50 Cr</option>
                    <option value="₹50 Cr - ₹100 Cr">₹50 Cr - ₹100 Cr</option>
                    <option value="Above ₹100 Cr">Above ₹100 Cr</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Incorporation Year
                  </label>
                  <input
                    type="number"
                    value={incorporationYear}
                    onChange={(e) => setIncorporationYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Virtual CFO Lead
                  </label>
                  <input
                    type="text"
                    value={assignedCfo}
                    onChange={(e) => setAssignedCfo(e.target.value)}
                    placeholder="e.g. Sudhakar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Virtual CFO Practice Firm
                  </label>
                  <input
                    type="text"
                    value={cfoFirm}
                    onChange={(e) => setCfoFirm(e.target.value)}
                    placeholder="Goyal & Associates, Virtual CFO Practice"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Assigned Client Team Members & Specific Person Permissions (
                    {entityMembers.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Configure Viewing, Editing, Excel Upload, and Deletion permissions for each
                    specific person in the Client Team independently.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddMemberForm ? "Close Form" : "+ Add Team Member to Entity"}</span>
                </button>
              </div>

              {/* Add Member Inline Form */}
              {showAddMemberForm && (
                <form
                  onSubmit={handleAddEntityMember}
                  className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3"
                >
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>
                      Add New Client Team Member / Director for {company.companyName} (With Specific
                      Person Viewing &amp; Editing Rights)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="e.g. Karthik Nair"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="karthik@company.com"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        placeholder="+91 98450 00000"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Access Role
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as Role;
                          const nextPreset: UserPermissionPreset =
                            nextRole === "client" ? "view_only" : "view_and_edit";
                          setNewMember({
                            ...newMember,
                            role: nextRole,
                            permissionPreset: nextPreset,
                            permissions: buildPermissionsFromPreset(nextPreset, nextRole),
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                      >
                        <option value="client_team">Client Finance Team</option>
                        <option value="client">Client Director / Promoter</option>
                        <option value="cfo">Virtual CFO Team</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Designation / Role Title
                      </label>
                      <input
                        type="text"
                        value={newMember.roleTitle}
                        onChange={(e) => setNewMember({ ...newMember, roleTitle: e.target.value })}
                        placeholder="e.g. Sr. Accountant / Tax Lead"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        className="w-full px-3 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Add Member with Rights</span>
                      </button>
                    </div>
                  </div>

                  {/* Specific Person Permissions Configurator for New Member */}
                  <PersonPermissionsEditor
                    personName={newMember.name || "New Team Member"}
                    role={newMember.role}
                    permissions={newMember.permissions}
                    preset={newMember.permissionPreset}
                    onChangePermissions={(nextPerms, nextPreset) =>
                      setNewMember({
                        ...newMember,
                        permissions: nextPerms,
                        permissionPreset: nextPreset || "custom",
                      })
                    }
                    compact
                  />
                </form>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {entityMembers.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                    No client team members assigned to this entity yet. Click &ldquo;+ Add Team
                    Member to Entity&rdquo; above.
                  </div>
                ) : (
                  entityMembers.map((member) => {
                    const isEditing = editingMemberId === member.id;
                    const isPermsOpen = permissionsExpandedId === member.id;
                    const resolvedPerms =
                      member.permissions ||
                      DEFAULT_ROLE_PERMISSIONS[
                        member.role === "admin" ? "cfo" : member.role || "client_team"
                      ];
                    const permSummary = summarizeUserPermissions(resolvedPerms);

                    return (
                      <div
                        key={member.id}
                        className={`rounded-xl border p-3.5 transition-all space-y-3 ${
                          isEditing
                            ? "bg-amber-50/50 border-amber-300 shadow-xs"
                            : isPermsOpen
                              ? "bg-indigo-50/30 border-indigo-300 shadow-xs"
                              : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-900 uppercase">
                                Editing Member &amp; Specific Rights: {member.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingMemberId(null)}
                                className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Full Name *
                                </label>
                                <input
                                  type="text"
                                  value={memberDraft.name}
                                  onChange={(e) =>
                                    setMemberDraft({ ...memberDraft, name: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Email *
                                </label>
                                <input
                                  type="email"
                                  value={memberDraft.email}
                                  onChange={(e) =>
                                    setMemberDraft({ ...memberDraft, email: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Phone
                                </label>
                                <input
                                  type="text"
                                  value={memberDraft.phone}
                                  onChange={(e) =>
                                    setMemberDraft({ ...memberDraft, phone: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Role
                                </label>
                                <select
                                  value={memberDraft.role}
                                  onChange={(e) =>
                                    setMemberDraft({
                                      ...memberDraft,
                                      role: e.target.value as Role,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                                >
                                  <option value="client_team">Client Finance Team</option>
                                  <option value="client">Client Director / Promoter</option>
                                  <option value="cfo">Virtual CFO</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Designation / Role Title
                                </label>
                                <input
                                  type="text"
                                  value={memberDraft.roleTitle}
                                  onChange={(e) =>
                                    setMemberDraft({ ...memberDraft, roleTitle: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveMemberEdit(member)}
                                  className="w-full px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save Member &amp; Rights</span>
                                </button>
                              </div>
                            </div>

                            <PersonPermissionsEditor
                              personName={memberDraft.name || member.name}
                              role={memberDraft.role}
                              permissions={memberDraft.permissions}
                              preset={memberDraft.permissionPreset}
                              onChangePermissions={(nextPerms, nextPreset) =>
                                setMemberDraft({
                                  ...memberDraft,
                                  permissions: nextPerms,
                                  permissionPreset: nextPreset || "custom",
                                })
                              }
                              compact
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {member.avatar || member.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs">
                                      {member.name}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        member.role === "client_team"
                                          ? "bg-sky-100 text-sky-800 border border-sky-200"
                                          : member.role === "client"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {member.role === "client_team"
                                        ? "Client Team"
                                        : member.role === "client"
                                          ? "Client Director"
                                          : "Virtual CFO"}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${permSummary.badgeClass}`}
                                    >
                                      {permSummary.label}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                    <span className="font-medium text-slate-800">
                                      {member.roleTitle || (member as any).title || "Finance Team"}
                                    </span>
                                    <span>•</span>
                                    <span>{member.email}</span>
                                    {member.phone && (
                                      <>
                                        <span>•</span>
                                        <span>{member.phone}</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Module-by-module permission pills for this specific person */}
                                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                    {permSummary.moduleBadges.map((b) => (
                                      <span
                                        key={b.mod}
                                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${b.color}`}
                                      >
                                        {b.mod}: {b.status}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPermissionsExpandedId(isPermsOpen ? null : member.id)
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                                    isPermsOpen
                                      ? "bg-indigo-600 text-white border-indigo-600"
                                      : "bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                                  }`}
                                  title={`Configure Viewing & Editing Rights for ${member.name}`}
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>
                                    {isPermsOpen ? "Hide Rights" : "Viewing / Editing Rights"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditMember(member)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteUser(member.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isPermsOpen && (
                              <PersonPermissionsEditor
                                personName={member.name}
                                role={member.role}
                                permissions={resolvedPerms}
                                preset={member.permissionPreset}
                                onChangePermissions={(nextPerms, nextPreset) =>
                                  handleDirectPermissionChange(member, nextPerms, nextPreset)
                                }
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {subTab === "benchmarks" && (
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Company-Specific Financial Ratio Benchmarks</span>
                  </h4>
                  <p className="text-xs text-indigo-700/80 mt-0.5">
                    Configure tailored threshold benchmarks for {company.companyName}. These targets
                    drive health indicators and exceptions across all MIS dashboards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBenchmarks({ ...DEFAULT_RATIO_BENCHMARKS })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                >
                  Reset All to Defaults
                </button>
              </div>

              {/* Benchmark Input Groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Profitability Benchmarks */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      1. Profitability Ratios (%)
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Higher is Better
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          EBITDA Margin Benchmark (%)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.ebitdaMargin}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.ebitdaMargin}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            ebitdaMargin: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Net Profit Margin Benchmark (%)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.netProfitMargin}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.netProfitMargin}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            netProfitMargin: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Gross Margin Benchmark (%)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.grossMargin}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.grossMargin}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            grossMargin: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Operating (EBIT) Margin Benchmark (%)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.operatingMargin}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.operatingMargin}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            operatingMargin: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">ROCE Benchmark (%)</label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.roce}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.roce}
                        onChange={(e) =>
                          setBenchmarks({ ...benchmarks, roce: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">ROE Benchmark (%)</label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.roe}%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.roe}
                        onChange={(e) =>
                          setBenchmarks({ ...benchmarks, roe: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Liquidity Benchmarks */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      2. Liquidity Ratios (x)
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                      Minimum Safe Cover
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Current Ratio Benchmark (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.currentRatio}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.currentRatio}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            currentRatio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Quick Ratio (Acid-Test) Benchmark (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.quickRatio}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.quickRatio}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            quickRatio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Cash Ratio Benchmark (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.cashRatio}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.cashRatio}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            cashRatio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Efficiency Turnover */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Fixed Asset Turnover (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.fixedAssetTurnover}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.fixedAssetTurnover}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            fixedAssetTurnover: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Solvency & Debt Leverage */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      3. Solvency &amp; Debt Gearing
                    </span>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                      Gearing / Coverage
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Debt–Equity Ratio Ceiling (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.debtEquityRatio}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.debtEquityRatio}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            debtEquityRatio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Net Debt / EBITDA Maximum (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.netDebtToEbitda}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.netDebtToEbitda}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            netDebtToEbitda: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Interest Coverage Ratio Minimum (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &gt; {DEFAULT_RATIO_BENCHMARKS.interestCoverageRatio}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={benchmarks.interestCoverageRatio}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            interestCoverageRatio: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          DSCR Banking Benchmark (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &gt; {DEFAULT_RATIO_BENCHMARKS.dscr}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.dscr}
                        onChange={(e) =>
                          setBenchmarks({ ...benchmarks, dscr: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          TOL / Tangible Net Worth Ceiling (x)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.tolToTnw}x
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        value={benchmarks.tolToTnw}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            tolToTnw: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Working Capital Cycle */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      4. Working Capital Days
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      Operating Velocity
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Debtor Days (DSO) Target (Days)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.debtorDays} Days
                        </span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={benchmarks.debtorDays}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            debtorDays: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Inventory Holding Days Target (Days)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.inventoryDays} Days
                        </span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={benchmarks.inventoryDays}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            inventoryDays: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Creditor Supplier Credit Target (Days)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: {DEFAULT_RATIO_BENCHMARKS.creditorDays} Days
                        </span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={benchmarks.creditorDays}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            creditorDays: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">
                          Cash Conversion Cycle (CCC) Target (Days)
                        </label>
                        <span className="text-[10.5px] text-slate-400">
                          Default: &lt; {DEFAULT_RATIO_BENCHMARKS.cashConversionCycle} Days
                        </span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={benchmarks.cashConversionCycle}
                        onChange={(e) =>
                          setBenchmarks({
                            ...benchmarks,
                            cashConversionCycle: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {subTab === "benchmarks"
              ? "Custom benchmarks take effect immediately for this company across all financial ratio and KPI reports."
              : "Changes to specific person viewing & editing rights sync immediately across all dashboards and modules."}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
            >
              Close
            </button>
            {subTab === "details" && (
              <button
                type="submit"
                form="edit-entity-form"
                className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-amber-400" />
                <span>Save Entity Profile</span>
              </button>
            )}
            {subTab === "benchmarks" && (
              <button
                type="button"
                onClick={handleSaveBenchmarks}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Save Ratio Benchmarks</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  companies: ClientProfile[];
  onSave: (updated: UserAccount) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  companies,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("client_team");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [permissions, setPermissions] = useState<UserModulePermissions>(() =>
    buildPermissionsFromPreset("view_and_edit", "client_team"),
  );
  const [permissionPreset, setPermissionPreset] = useState<UserPermissionPreset>("view_and_edit");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "client_team");
      setRoleTitle(user.roleTitle || (user as any).title || "Finance Executive");
      setCompanyId(user.companyId || companies[0]?.id || "client-101");
      const defaultPerms =
        user.permissions ||
        buildPermissionsFromPreset(
          user.permissionPreset || (user.role === "client" ? "view_only" : "view_and_edit"),
          user.role,
        );
      setPermissions(JSON.parse(JSON.stringify(defaultPerms)));
      setPermissionPreset(
        user.permissionPreset || (user.role === "client" ? "view_only" : "view_and_edit"),
      );
    }
  }, [user, companies]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const assignedComp = companies.find((c) => c.id === companyId);
    const companyName =
      companyId === "all"
        ? "All Companies (Virtual CFO Practice)"
        : assignedComp
          ? assignedComp.companyName
          : user.companyName;

    onSave({
      ...user,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      roleTitle:
        roleTitle.trim() ||
        (role === "cfo"
          ? "Virtual CFO"
          : role === "client"
            ? "Managing Director"
            : "Accounts Executive"),
      companyId,
      companyName,
      permissions,
      permissionPreset,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Team Member &amp; Specific Viewing / Editing Rights
              </h3>
              <p className="text-xs text-slate-500">
                Update profile details, entity assignment, and person-specific module permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Designation / Role Title *
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Sr. Tax Accountant / Accounts Executive"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98201 00000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value as Role;
                  setRole(nextRole);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
              >
                <option value="client_team">Client Finance Team</option>
                <option value="client">Client Executive / Director</option>
                <option value="cfo">Virtual CFO</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Entity</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
              >
                <option value="all">All Entities (CFO Practice)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Person-Specific Viewing & Editing Permissions */}
          <PersonPermissionsEditor
            personName={name || user.name}
            role={role}
            permissions={permissions}
            preset={permissionPreset}
            onChangePermissions={(nextPerms, nextPreset) => {
              setPermissions(nextPerms);
              if (nextPreset) setPermissionPreset(nextPreset);
            }}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Member &amp; Rights</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
