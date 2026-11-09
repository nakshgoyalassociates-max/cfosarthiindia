import React, { useState, useMemo } from "react";
import { ComplianceItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatDueDate, toIsoDateString } from "../../utils/dueDate";
import {
  CheckCircle2,
  ShieldCheck,
  Building,
  ChevronDown,
  ChevronUp,
  Save,
  Edit3,
  Clock,
  Calendar,
  AlertTriangle,
  Layers,
  FileCheck,
  UploadCloud,
  ExternalLink,
  Lock,
  UserCheck,
  Users,
  Sliders,
} from "lucide-react";

interface ComplianceInlineDetailProps {
  compliance: ComplianceItem;
  onClose?: () => void;
  className?: string;
}

export const ComplianceInlineDetail: React.FC<ComplianceInlineDetailProps> = ({
  compliance,
  onClose,
  className = "",
}) => {
  const {
    toggleSubtask,
    updateComplianceRemarks,
    assignComplianceOwner,
    updateComplianceSubtaskAssignment,
    openComplianceProofModal,
    openComplianceProofView,
    userAccounts,
    clientProfile,
    role,
    isCfoAdmin,
  } = useApp();

  const canAdminAssign = role === "cfo" || isCfoAdmin;

  // Directory of people strictly from User Master (userAccounts) + Entity Master (clientProfile)
  const availablePeople = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    (userAccounts || []).forEach((u) => {
      if (u.name) {
        map.set(u.name.toLowerCase(), {
          name: u.name,
          role:
            u.roleTitle ||
            (u.role === "cfo"
              ? "Virtual CFO"
              : u.role === "client"
                ? "Client Director"
                : "Accounts Executive"),
        });
      }
    });
    const entityCfo = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (entityCfo && !map.has(entityCfo.toLowerCase())) {
      map.set(entityCfo.toLowerCase(), { name: entityCfo, role: "Virtual CFO" });
    }
    return Array.from(map.values());
  }, [userAccounts, clientProfile]);

  const defaultLeadPerson =
    availablePeople.find((p) => !p.role.toLowerCase().includes("cfo"))?.name ||
    availablePeople[0]?.name ||
    "Finance Team";

  // Active drilled-down subtask (1, 2, or 3, or null if none drilled down)
  const [drilledSubtaskId, setDrilledSubtaskId] = useState<1 | 2 | 3 | null>(null);

  // Quick Admin Assignment & Duration Panel state
  const [isAdminAssignPanelOpen, setIsAdminAssignPanelOpen] = useState(false);
  const [leadPersonInput, setLeadPersonInput] = useState(
    compliance.assignedTo || compliance.subtasks?.[0]?.assignedTo || defaultLeadPerson,
  );
  const [leadRoleInput, setLeadRoleInput] = useState(
    compliance.assignedRole || compliance.subtasks?.[0]?.assignedRole || "Accounts Executive",
  );

  // Subtask edit state (Notes, ARN, Assignee, Role, Fixed Duration, Deadline)
  const [subtaskNoteInput, setSubtaskNoteInput] = useState("");
  const [subtaskDocInput, setSubtaskDocInput] = useState("");
  const [subtaskAssigneeInput, setSubtaskAssigneeInput] = useState("");
  const [subtaskRoleInput, setSubtaskRoleInput] = useState("");
  const [subtaskDurationInput, setSubtaskDurationInput] = useState<number>(3);
  const [subtaskDeadlineInput, setSubtaskDeadlineInput] = useState("");
  const [isEditingSubtaskDetails, setIsEditingSubtaskDetails] = useState(false);

  // CFO Remarks local state
  const [cfoText, setCfoText] = useState(compliance.cfoRemarks || "");
  const [isEditingCfo, setIsEditingCfo] = useState(false);

  // Client Remarks local state
  const [clientText, setClientText] = useState(compliance.clientRemarks || "");
  const [isEditingClient, setIsEditingClient] = useState(false);

  const hasProof =
    !!compliance.completionProofDoc ||
    !!(compliance.completionProofDocs && compliance.completionProofDocs.length > 0);
  const activeProof =
    compliance.completionProofDoc ||
    (compliance.completionProofDocs && compliance.completionProofDocs[0]);

  const completedCount = (compliance?.subtasks || []).filter(
    (s) => s && s.status === "completed",
  ).length;
  const isAllDone = completedCount === 3;

  const now = new Date();
  const deadlineDate = new Date(compliance.dueDate || compliance.dueDates?.[0] || "");
  const isOverdue =
    compliance.status !== "Filed" && !isNaN(deadlineDate.getTime()) && deadlineDate < now;

  const totalDurationDays =
    compliance.durationDays ??
    (compliance.subtasks || []).reduce(
      (sum, s) => sum + (s?.durationDays ?? (s?.subtaskNumber === 1 ? 3 : 2)),
      0,
    );

  const primaryOwner =
    compliance.assignedTo || compliance.subtasks?.[0]?.assignedTo || defaultLeadPerson;
  const primaryRole =
    compliance.assignedRole || compliance.subtasks?.[0]?.assignedRole || "Accounts Executive";

  const handleSubtaskButtonClick = (num: 1 | 2 | 3, isCurrentDone: boolean) => {
    if (num === 3 && !isCurrentDone && !hasProof) {
      openComplianceProofModal(compliance);
      return;
    }
    toggleSubtask(compliance.id, num);
  };

  // Open drill-down for a specific subtask
  const handleToggleDrillDown = (num: 1 | 2 | 3, openInEditMode = false) => {
    if (drilledSubtaskId === num && !openInEditMode) {
      setDrilledSubtaskId(null);
      setIsEditingSubtaskDetails(false);
    } else {
      setDrilledSubtaskId(num);
      const st = compliance.subtasks.find((s) => s.subtaskNumber === num);
      setSubtaskNoteInput(st?.notes || "");
      setSubtaskDocInput(st?.documentRef || "");
      setSubtaskAssigneeInput(st?.assignedTo || defaultLeadPerson);
      setSubtaskRoleInput(st?.assignedRole || "Accounts Executive");
      setSubtaskDurationInput(st?.durationDays ?? (num === 1 ? 3 : 2));
      setSubtaskDeadlineInput(
        toIsoDateString(st?.deadline || compliance.dueDate || compliance.statutoryDueDate),
      );
      setIsEditingSubtaskDetails(openInEditMode);
    }
  };

  const handleSaveSubtaskDetails = (num: 1 | 2 | 3) => {
    const st = compliance.subtasks.find((s) => s.subtaskNumber === num);
    // Save notes/ARN without toggling status if only notes changed, or update assignment & duration
    if (canAdminAssign) {
      updateComplianceSubtaskAssignment(compliance.id, num, {
        assignedTo: subtaskAssigneeInput.trim() || st?.assignedTo,
        assignedRole: subtaskRoleInput.trim() || st?.assignedRole,
        deadline: subtaskDeadlineInput.trim() || st?.deadline,
      });
    }
    if (
      subtaskNoteInput.trim() !== (st?.notes || "") ||
      subtaskDocInput.trim() !== (st?.documentRef || "")
    ) {
      // Update notes/docRef via toggleSubtask only if we want to preserve status; let's use updateCompliance directly or keep notes
      toggleSubtask(
        compliance.id,
        num,
        subtaskNoteInput.trim() || undefined,
        subtaskDocInput.trim() || undefined,
      );
      // Note: toggleSubtask toggles status, so let's only call toggleSubtask if user clicked toggle, or let's update notes cleanly
    }
    setIsEditingSubtaskDetails(false);
  };

  const handleSaveCfoRemarks = (e: React.FormEvent) => {
    e.preventDefault();
    updateComplianceRemarks(compliance.id, "cfo", cfoText.trim());
    setIsEditingCfo(false);
  };

  const handleSaveClientRemarks = (e: React.FormEvent) => {
    e.preventDefault();
    updateComplianceRemarks(compliance.id, "client", clientText.trim());
    setIsEditingClient(false);
  };

  const [showRemarks, setShowRemarks] = useState(
    Boolean(compliance.cfoRemarks || compliance.clientRemarks),
  );

  return (
    <div
      className={`bg-indigo-50/50 rounded-lg p-2 sm:p-2.5 border border-indigo-200/90 shadow-2xs space-y-2 text-[11px] relative ${className}`}
    >
      <datalist id={`inline-people-list-${compliance.id}`}>
        {availablePeople.map((p) => (
          <option key={p.name} value={p.name}>
            {p.role}
          </option>
        ))}
      </datalist>

      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-indigo-200/60 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <Layers className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
          <span className="font-bold text-indigo-950 text-xs tracking-tight shrink-0">
            Subtask Window
          </span>
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            {compliance.type}
          </span>
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono text-slate-500 bg-white border border-slate-200 truncate max-w-[180px] hidden sm:inline">
            #{compliance.sNo} {compliance.name}
          </span>

          {/* Compliance Assigned Person Badge */}
          <span
            onClick={() => canAdminAssign && setIsAdminAssignPanelOpen(!isAdminAssignPanelOpen)}
            className={`text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1 ${
              canAdminAssign ? "cursor-pointer hover:bg-emerald-100" : ""
            }`}
            title={
              canAdminAssign
                ? "Click to change Compliance Owner or Subtask Assignees & Target Dates"
                : `Compliance assigned to ${primaryOwner} (${primaryRole})`
            }
          >
            <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>
              Compliance Owner: <strong>{primaryOwner}</strong>
            </span>
          </span>

          {/* Statutory Due Date Badge (Read-Only Statutory Info) */}
          <span
            className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-white text-slate-700 border border-slate-200 flex items-center gap-1"
            title="Statutory Due Date (Fixed by Law)"
          >
            <Lock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            <span>
              Statutory Due:{" "}
              {formatDueDate(compliance.statutoryDueDate || compliance.dueDate || "")}
            </span>
          </span>
        </div>

        {/* Compact Right Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {canAdminAssign && (
            <button
              type="button"
              onClick={() => {
                setLeadPersonInput(primaryOwner);
                setLeadRoleInput(primaryRole);
                setIsAdminAssignPanelOpen(!isAdminAssignPanelOpen);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                isAdminAssignPanelOpen
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
              }`}
              title="Admin: Assign compliance to specific person, assign subtasks to different persons & fix subtask target dates"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>Assign &amp; Subtask Dates</span>
            </button>
          )}

          <span
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-1 ${
              isAllDone
                ? "bg-green-100 text-green-800 border border-green-200"
                : isOverdue
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {isAllDone ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
            ) : isOverdue ? (
              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
            ) : (
              <Clock className="w-2.5 h-2.5 text-amber-600" />
            )}
            <span>{completedCount}/3 Done</span>
          </span>

          {/* Quick proof button */}
          {hasProof && activeProof ? (
            <button
              type="button"
              onClick={() => openComplianceProofView(compliance, activeProof)}
              className="px-1.5 py-0.5 text-[9.5px] font-medium rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="View attached filing proof"
            >
              <FileCheck className="w-2.5 h-2.5 text-emerald-700" />
              <span className="hidden sm:inline">Proof</span>
              <ExternalLink className="w-2 h-2 text-emerald-600" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openComplianceProofModal(compliance)}
              className="px-1.5 py-0.5 text-[9.5px] font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Upload filing proof"
            >
              <UploadCloud className="w-2.5 h-2.5" />
              <span>Upload Proof</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              title="Close subtasks"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ADMIN QUICK ASSIGNMENT & SUBTASK DURATION CONTROL PANEL */}
      {canAdminAssign && isAdminAssignPanelOpen && (
        <div className="bg-white rounded-lg p-3 border border-indigo-300 shadow-xs space-y-3 text-[11px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Admin Control: Assign Compliance Owner, Subtask Assignees &amp; Fix Subtask Target
                Dates
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdminAssignPanelOpen(false)}
              className="text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer self-end sm:self-auto"
            >
              Done ✕
            </button>
          </div>

          {/* 1. Primary Compliance Person Assignment */}
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-emerald-950 mb-0.5">
                  Assign Compliance to Specific Person (Lead Owner)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    list={`inline-people-list-${compliance.id}`}
                    value={leadPersonInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLeadPersonInput(val);
                      const matched = availablePeople.find(
                        (p) => p.name.toLowerCase() === val.trim().toLowerCase(),
                      );
                      if (matched) setLeadRoleInput(matched.role);
                    }}
                    placeholder="Type or select person..."
                    className="flex-1 px-2 py-1 rounded border border-emerald-300 bg-white font-semibold text-slate-900 text-[11px]"
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const matched = availablePeople.find((p) => p.name === e.target.value);
                        if (matched) {
                          setLeadPersonInput(matched.name);
                          setLeadRoleInput(matched.role);
                        }
                      }
                    }}
                    className="px-2 py-1 rounded border border-emerald-300 bg-white text-slate-700 text-[10.5px] max-w-[130px] cursor-pointer"
                  >
                    <option value="">Pick Person...</option>
                    {availablePeople.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-950 mb-0.5">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={leadRoleInput}
                  onChange={(e) => setLeadRoleInput(e.target.value)}
                  placeholder="e.g. Accounts Executive"
                  className="w-full px-2 py-1 rounded border border-emerald-300 bg-white text-slate-800 text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  assignComplianceOwner(
                    compliance.id,
                    leadPersonInput.trim() || defaultLeadPerson,
                    leadRoleInput.trim() || "Accounts Executive",
                    false,
                  )
                }
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10.5px] cursor-pointer transition-colors"
              >
                Assign Lead Only
              </button>
              <button
                type="button"
                onClick={() =>
                  assignComplianceOwner(
                    compliance.id,
                    leadPersonInput.trim() || defaultLeadPerson,
                    leadRoleInput.trim() || "Accounts Executive",
                    true,
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[10.5px] cursor-pointer transition-colors"
                title="Assign this person to the compliance AND all 3 subtasks"
              >
                Assign to All Subtasks
              </button>
            </div>
          </div>

          {/* 2. Individual Subtask Person & Target Date Matrix (No Duration Required) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {compliance.subtasks.map((st) => {
              const currIsoDate = toIsoDateString(
                st.deadline || st.dueDate || compliance.dueDate || compliance.statutoryDueDate,
              );
              return (
                <div
                  key={st.id}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-[10.5px]">
                      Subtask {st.subtaskNumber}: {st.stageName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[9.5px]">
                      {currIsoDate}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-semibold text-slate-500 mb-0.5">
                      Assigned Person (Subtask {st.subtaskNumber})
                    </label>
                    <select
                      value={
                        availablePeople.some((p) => p.name === st.assignedTo)
                          ? st.assignedTo
                          : "__custom__"
                      }
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== "__custom__") {
                          const matched = availablePeople.find((p) => p.name === e.target.value);
                          updateComplianceSubtaskAssignment(compliance.id, st.subtaskNumber, {
                            assignedTo: matched ? matched.name : e.target.value,
                            assignedRole: matched ? matched.role : st.assignedRole,
                          });
                        }
                      }}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-900 font-semibold text-[10.5px] cursor-pointer"
                    >
                      {!availablePeople.some((p) => p.name === st.assignedTo) && (
                        <option value="__custom__">
                          {st.assignedTo} ({st.assignedRole})
                        </option>
                      )}
                      {availablePeople.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fix Subtask Target Date */}
                  <div>
                    <label className="block text-[9.5px] font-semibold text-indigo-800 mb-0.5">
                      Fix Subtask Target Date
                    </label>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                      <input
                        type="date"
                        value={currIsoDate}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateComplianceSubtaskAssignment(compliance.id, st.subtaskNumber, {
                              deadline: e.target.value,
                            });
                          }
                        }}
                        className="w-full px-1.5 py-0.5 rounded border border-indigo-300 bg-white font-mono font-bold text-indigo-950 text-[10.5px] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtasks List - Slim Compact Rows */}
      <div className="space-y-1">
        {compliance.subtasks.map((st) => {
          const isDone = st.status === "completed";
          const isDrilled = drilledSubtaskId === st.subtaskNumber;
          const isPriorCompleted =
            st.subtaskNumber === 1 ||
            compliance.subtasks.find((s) => s.subtaskNumber === st.subtaskNumber - 1)?.status ===
              "completed";
          const isBlockedByPrior = !isDone && !isPriorCompleted;
          const isStuckHere = !isDone && isPriorCompleted;
          const stDuration = st.durationDays ?? (st.subtaskNumber === 1 ? 3 : 2);

          const cardStyle = isDone
            ? "bg-green-50/60 border-green-200/90"
            : isBlockedByPrior
              ? "bg-slate-50/80 border-slate-200/80 opacity-80"
              : isStuckHere
                ? isOverdue
                  ? "bg-red-50/70 border-red-200"
                  : "bg-orange-50/70 border-orange-200"
                : "bg-white border-slate-200";

          const badgeStyle = isDone
            ? "bg-green-600 text-white border-green-600"
            : isBlockedByPrior
              ? "bg-slate-100 text-slate-400 border-slate-300"
              : isStuckHere
                ? isOverdue
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-orange-500 text-white border-orange-500"
                : "bg-slate-200 text-slate-700 border-slate-300";

          const buttonStyle = isDone
            ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
            : isBlockedByPrior
              ? "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
              : isStuckHere
                ? isOverdue
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";

          return (
            <div
              key={st.id}
              className={`rounded-lg border transition-all ${cardStyle} overflow-hidden`}
            >
              <div
                onClick={() => handleToggleDrillDown(st.subtaskNumber)}
                className="px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtask(compliance.id, st.subtaskNumber);
                    }}
                    title="Toggle status"
                    className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 cursor-pointer ${badgeStyle}`}
                  >
                    {st.subtaskNumber}
                  </span>

                  <span className="font-semibold text-slate-900 truncate text-[11px]">
                    {st.title}
                  </span>

                  {/* Subtask Assigned Person */}
                  <span
                    onClick={(e) => {
                      if (canAdminAssign) {
                        e.stopPropagation();
                        handleToggleDrillDown(st.subtaskNumber, true);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100/80 text-slate-700 ${
                      canAdminAssign ? "hover:text-indigo-700" : ""
                    }`}
                    title={
                      canAdminAssign
                        ? `Assigned to ${st.assignedTo} (${st.assignedRole || "Team"}) — Click to assign to a different person`
                        : `Assigned to ${st.assignedTo}`
                    }
                  >
                    <UserCheck className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                    <span>{st.assignedTo}</span>
                  </span>

                  {/* Subtask Target Date */}
                  <span
                    onClick={(e) => {
                      if (canAdminAssign) {
                        e.stopPropagation();
                        handleToggleDrillDown(st.subtaskNumber, true);
                      }
                    }}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-indigo-50/80 text-indigo-800 ${
                      canAdminAssign ? "hover:bg-indigo-100" : ""
                    }`}
                    title={
                      canAdminAssign
                        ? `Subtask Target Date: ${st.deadline ? formatDueDate(st.deadline) : "Not set"} — Click to change subtask target date`
                        : `Subtask Target Date: ${st.deadline ? formatDueDate(st.deadline) : "Not set"}`
                    }
                  >
                    <Calendar className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                    <span>
                      {st.deadline
                        ? formatDueDate(st.deadline)
                        : formatDueDate(compliance.statutoryDueDate || "")}
                    </span>
                  </span>

                  {st.documentRef && (
                    <span className="text-[9.5px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded hidden md:inline truncate">
                      {st.documentRef}
                    </span>
                  )}
                  {st.notes && (
                    <span className="text-[9.5px] text-slate-500 italic hidden lg:inline max-w-[130px] truncate">
                      "{st.notes}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubtaskButtonClick(st.subtaskNumber, isDone);
                    }}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-medium cursor-pointer transition-colors ${buttonStyle}`}
                    title={
                      isBlockedByPrior
                        ? `Subtask ${st.subtaskNumber - 1} must be completed first (Serial condition)`
                        : st.subtaskNumber === 3 && !isDone && !hasProof
                          ? "Filing proof required"
                          : "Click to toggle"
                    }
                  >
                    {isDone
                      ? "✓ Done"
                      : isBlockedByPrior
                        ? `Waiting on Step ${st.subtaskNumber - 1} 🔒`
                        : st.subtaskNumber === 3 && !hasProof
                          ? "Proof Needed 🔒"
                          : isStuckHere
                            ? isOverdue
                              ? "Overdue ⚠"
                              : "In Process"
                            : "Pending"}
                  </button>

                  <span className="text-slate-400 p-0.5">
                    {isDrilled ? (
                      <ChevronUp className="w-3 h-3 text-slate-700" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    )}
                  </span>
                </div>
              </div>

              {/* Compact Subtask drill down (Only when opened) */}
              {isDrilled && (
                <div className="bg-white/95 px-2.5 py-2 border-t border-slate-200/80 space-y-1.5 text-[10.5px]">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                      <span>
                        Assigned to:{" "}
                        <strong className="text-slate-900">
                          {st.assignedTo} ({st.assignedRole || "Team"})
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Target Date:{" "}
                        <strong className="text-indigo-800 font-mono">
                          {st.deadline ? formatDueDate(st.deadline) : "N/A"}
                        </strong>
                      </span>
                      {st.completedAt && (
                        <span className="text-green-700">• Done: {st.completedAt}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {st.subtaskNumber === 3 && !isDone && !hasProof ? (
                        <button
                          type="button"
                          onClick={() => openComplianceProofModal(compliance)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <UploadCloud className="w-2.5 h-2.5" />
                          <span>Upload Proof to Complete</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSubtaskButtonClick(st.subtaskNumber, isDone)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer flex items-center gap-1 ${
                            isDone
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{isDone ? "Reopen" : "Mark Done"}</span>
                        </button>
                      )}

                      {!isEditingSubtaskDetails && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSubtaskDetails(true)}
                          className="px-1.5 py-0.5 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded cursor-pointer flex items-center gap-0.5 font-semibold"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>
                            {canAdminAssign ? "Assign Person / Fix Date / Notes" : "Edit Notes/ARN"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingSubtaskDetails ? (
                    <div className="bg-indigo-50/50 p-2.5 rounded border border-indigo-200 space-y-2">
                      {canAdminAssign && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-indigo-200/70">
                          <div>
                            <label className="text-[9.5px] font-bold text-indigo-950 block mb-0.5">
                              Assign Subtask {st.subtaskNumber} to Person:
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                list={`inline-people-list-${compliance.id}`}
                                value={subtaskAssigneeInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSubtaskAssigneeInput(val);
                                  const matched = availablePeople.find(
                                    (p) => p.name.toLowerCase() === val.trim().toLowerCase(),
                                  );
                                  if (matched) setSubtaskRoleInput(matched.role);
                                }}
                                placeholder="Assignee Name"
                                className="w-full p-1 border border-indigo-300 rounded text-[10px] bg-white font-semibold"
                              />
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const matched = availablePeople.find(
                                      (p) => p.name === e.target.value,
                                    );
                                    if (matched) {
                                      setSubtaskAssigneeInput(matched.name);
                                      setSubtaskRoleInput(matched.role);
                                    }
                                  }
                                }}
                                className="p-1 border border-indigo-300 rounded text-[10px] bg-white max-w-[95px]"
                              >
                                <option value="">Pick...</option>
                                {availablePeople.map((p) => (
                                  <option key={p.name} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9.5px] font-bold text-indigo-950 block mb-0.5">
                              Fix Subtask Target Date:
                            </label>
                            <input
                              type="date"
                              value={toIsoDateString(subtaskDeadlineInput)}
                              onChange={(e) => {
                                const iso = e.target.value;
                                setSubtaskDeadlineInput(iso);
                              }}
                              className="w-full p-1 border border-indigo-300 rounded text-[10px] font-mono font-bold text-indigo-950 bg-white cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9.5px] font-bold text-indigo-900 block mb-0.5">
                            Execution Notes:
                          </label>
                          <input
                            type="text"
                            value={subtaskNoteInput}
                            onChange={(e) => setSubtaskNoteInput(e.target.value)}
                            placeholder="e.g. Verified with bank ledger..."
                            className="w-full p-1 border border-indigo-200 rounded text-[10px] bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] font-bold text-indigo-900 block mb-0.5">
                            ARN / Reference:
                          </label>
                          <input
                            type="text"
                            value={subtaskDocInput}
                            onChange={(e) => setSubtaskDocInput(e.target.value)}
                            placeholder="e.g. ARN: AA0708240019208"
                            className="w-full p-1 border border-indigo-200 rounded text-[10px] font-mono bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingSubtaskDetails(false)}
                          className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSubtaskDetails(st.subtaskNumber)}
                          className="px-2.5 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-2.5 h-2.5" />
                          <span>Save Subtask</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    (st.notes || st.documentRef) && (
                      <div className="flex flex-wrap items-center gap-3 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200/80">
                        {st.notes && (
                          <span className="text-slate-700 italic truncate max-w-sm">
                            "{st.notes}"
                          </span>
                        )}
                        {st.documentRef && (
                          <span className="font-mono text-emerald-800 font-semibold flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span>Ref: {st.documentRef}</span>
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Slim Footer: Proof details + Remarks Toggle */}
      <div className="pt-0.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Proof summary strip */}
          {hasProof && activeProof ? (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
              <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="font-medium truncate max-w-[160px]">{activeProof.fileName}</span>
              <span className="text-slate-400 font-mono">({activeProof.fileSize})</span>
              <button
                type="button"
                onClick={() => openComplianceProofView(compliance, activeProof)}
                className="text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
              >
                View
              </button>
            </div>
          ) : (
            <span className="text-slate-500 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-600" />
              <span>Proof required for final sign-off</span>
            </span>
          )}

          {/* Remarks Toggle Button */}
          <button
            type="button"
            onClick={() => setShowRemarks(!showRemarks)}
            className="px-1.5 py-0.5 rounded text-indigo-700 hover:text-indigo-950 font-medium hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>
              Remarks ({compliance.cfoRemarks || compliance.clientRemarks ? "Active" : "+ Note"})
            </span>
            {showRemarks ? (
              <ChevronUp className="w-2.5 h-2.5" />
            ) : (
              <ChevronDown className="w-2.5 h-2.5" />
            )}
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-medium cursor-pointer"
          >
            Close ▲
          </button>
        )}
      </div>

      {/* Collapsible Micro Remarks Area (Only shown if toggled) */}
      {showRemarks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-indigo-100 text-[10px]">
          {/* CFO Note */}
          <div className="bg-white p-1.5 rounded border border-indigo-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> CFO Note
              </span>
              {!isEditingCfo && (
                <button
                  type="button"
                  onClick={() => setIsEditingCfo(true)}
                  className="text-[9.5px] text-indigo-700 hover:underline cursor-pointer"
                >
                  {compliance.cfoRemarks ? "Edit" : "+ Add"}
                </button>
              )}
            </div>
            {isEditingCfo ? (
              <form onSubmit={handleSaveCfoRemarks} className="space-y-1">
                <input
                  type="text"
                  value={cfoText}
                  onChange={(e) => setCfoText(e.target.value)}
                  placeholder="Enter CFO note..."
                  className="w-full p-1 text-[10px] rounded border border-indigo-200 bg-white"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingCfo(false)}
                    className="px-1 text-slate-400 text-[9px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-1.5 py-0.2 bg-indigo-700 text-white rounded text-[9.5px]"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-600 italic truncate">
                {compliance.cfoRemarks ? `"${compliance.cfoRemarks}"` : "No note added."}
              </p>
            )}
          </div>

          {/* Client Note */}
          <div className="bg-white p-1.5 rounded border border-teal-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-950 flex items-center gap-1">
                <Building className="w-3 h-3 text-teal-600" /> Client Note
              </span>
              {!isEditingClient && (
                <button
                  type="button"
                  onClick={() => setIsEditingClient(true)}
                  className="text-[9.5px] text-teal-700 hover:underline cursor-pointer"
                >
                  {compliance.clientRemarks ? "Edit" : "+ Add"}
                </button>
              )}
            </div>
            {isEditingClient ? (
              <form onSubmit={handleSaveClientRemarks} className="space-y-1">
                <input
                  type="text"
                  value={clientText}
                  onChange={(e) => setClientText(e.target.value)}
                  placeholder="Enter client team note..."
                  className="w-full p-1 text-[10px] rounded border border-teal-200 bg-white"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingClient(false)}
                    className="px-1 text-slate-400 text-[9px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-1.5 py-0.2 bg-teal-700 text-white rounded text-[9.5px]"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-600 italic truncate">
                {compliance.clientRemarks ? `"${compliance.clientRemarks}"` : "No note added."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
