import React, { useState, useEffect, useMemo } from "react";
import {
  ActionItem,
  ActionCategory,
  ActionPriority,
  ActionStatus,
  ActionSubtask,
} from "../../types";
import { useApp } from "../../context/AppContext";
import { X, Calendar, CheckSquare, Check, Layers, Plus, Trash2, Clock } from "lucide-react";
import { toIsoDateString } from "../../utils/dueDate";

interface ActionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: ActionItem | null;
  actionItem?: ActionItem | null;
  onSave: (updated: ActionItem) => void;
}

const ACTION_CATEGORIES: ActionCategory[] = [
  "Accounts Payable",
  "Accounts Receivable",
  "Banking & Treasury",
  "Financial Reporting & MIS",
  "General Ledger & Fixed Assets",
  "Payroll & HR Ops",
  "Internal Audit & Controls",
  "Direct/Indirect Tax Ops",
];

export const ActionEditModal: React.FC<ActionEditModalProps> = ({
  isOpen,
  onClose,
  action,
  actionItem,
  onSave,
}) => {
  const { userAccounts, activeCompanyId, clientProfile } = useApp();
  const targetAction = action || actionItem || null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ActionCategory>("Financial Reporting & MIS");
  const [priority, setPriority] = useState<ActionPriority>("High");
  const [status, setStatus] = useState<ActionStatus>("In Progress");
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedRole, setAssignedRole] = useState("");
  const [fixedDeadline, setFixedDeadline] = useState("");
  const [durationDays, setDurationDays] = useState<number>(7);
  const [checkInCadenceDays, setCheckInCadenceDays] = useState<number>(2);
  const [remarks, setRemarks] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [subtasks, setSubtasks] = useState<ActionSubtask[]>([]);

  // Build assignee dropdown from active userAccounts and entity CFO
  const availableTeamMembers = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    const entityUsers = (userAccounts || []).filter(
      (u) =>
        u.role === "cfo" ||
        u.companyId === "all" ||
        u.companyId === activeCompanyId ||
        (u.assignedCompanyIds || []).includes(activeCompanyId),
    );
    const sourceList = entityUsers.length > 0 ? entityUsers : userAccounts || [];
    sourceList.forEach((u) => {
      if (u.name) {
        map.set(u.name.trim().toLowerCase(), {
          name: u.name.trim(),
          role: u.roleTitle || (u.role === "cfo" ? "Virtual CFO" : "Client Team"),
        });
      }
    });
    const cfoName = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (cfoName && !map.has(cfoName.toLowerCase())) {
      map.set(cfoName.toLowerCase(), { name: cfoName, role: "Virtual CFO" });
    }
    return Array.from(map.values());
  }, [userAccounts, activeCompanyId, clientProfile]);

  useEffect(() => {
    if (targetAction) {
      setTitle(targetAction.title || "");
      setDescription(targetAction.description || "");
      setCategory(targetAction.category || "Financial Reporting & MIS");
      setPriority(targetAction.priority || "High");
      setStatus(targetAction.status || "In Progress");
      setProgressPercentage(targetAction.progressPercentage ?? 0);
      const defaultTeamMember =
        availableTeamMembers.find((m) => !m.role.toLowerCase().includes("cfo"))?.name ||
        availableTeamMembers[0]?.name ||
        "Pooja Sharma";
      const defaultCfo =
        clientProfile?.assignedCfo ||
        clientProfile?.cfoName ||
        availableTeamMembers.find((m) => m.role.toLowerCase().includes("cfo"))?.name ||
        "Sudhakar";
      setAssignedTo(targetAction.assignedTo || defaultTeamMember);
      setAssignedRole(targetAction.assignedRole || "Accountant");
      const rawDate = toIsoDateString((targetAction.fixedDeadline || "").split(" ")[0]);
      setFixedDeadline(rawDate);
      setDurationDays(targetAction.durationDays || 7);
      setCheckInCadenceDays(targetAction.checkInCadenceDays || 2);
      setRemarks(targetAction.remarks || "");
      setBlockedReason(targetAction.blockedReason || "");
      if (targetAction.subtasks && targetAction.subtasks.length > 0) {
        setSubtasks(
          targetAction.subtasks.map((st) => ({
            ...st,
            durationDays: st.durationDays || 2,
            dueDate: toIsoDateString(st.dueDate || rawDate),
          })),
        );
      } else {
        setSubtasks([
          {
            id: `ast-1-${targetAction.id}`,
            title: "Data Gathering & Initial Reconciliation",
            assignedTo: targetAction.assignedTo || defaultTeamMember,
            durationDays: Math.max(1, Math.floor((targetAction.durationDays || 6) / 3)),
            dueDate: rawDate,
            status: "Pending",
          },
          {
            id: `ast-2-${targetAction.id}`,
            title: "CFO Verification & Exception Review",
            assignedTo: defaultCfo,
            durationDays: Math.max(1, Math.floor((targetAction.durationDays || 6) / 3)),
            dueDate: rawDate,
            status: "Pending",
          },
          {
            id: `ast-3-${targetAction.id}`,
            title: "Final Execution & Closure Sign-off",
            assignedTo: targetAction.assignedTo || defaultTeamMember,
            durationDays: Math.max(1, Math.ceil((targetAction.durationDays || 6) / 3)),
            dueDate: rawDate,
            status: "Pending",
          },
        ]);
      }
    }
  }, [targetAction, availableTeamMembers, clientProfile]);

  if (!isOpen || !targetAction) return null;

  // Extend Deadline Helper
  const extendDeadline = (days: number) => {
    const baseDate = fixedDeadline ? new Date(fixedDeadline) : new Date();
    if (isNaN(baseDate.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + days);
      setFixedDeadline(fallback.toISOString().split("T")[0]);
      return;
    }
    baseDate.setDate(baseDate.getDate() + days);
    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
    const dd = String(baseDate.getDate()).padStart(2, "0");
    setFixedDeadline(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: ActionItem = {
      ...targetAction,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      progressPercentage: Math.min(100, Math.max(0, Number(progressPercentage))),
      assignedTo: assignedTo.trim(),
      assignedRole: assignedRole.trim(),
      fixedDeadline: fixedDeadline.trim(),
      durationDays: Number(durationDays) || 7,
      checkInCadenceDays: Number(checkInCadenceDays) || 2,
      remarks: remarks.trim(),
      blockedReason: blockedReason.trim() || undefined,
      subtasks,
      completedAt:
        status === "Completed" && !targetAction.completedAt
          ? new Date().toISOString()
          : targetAction.completedAt,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Admin: Modify Action Item & Completion Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Adjust priorities, client team assignees, execution deadlines, and progress.
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
          {/* Action Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Action Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
            />
          </div>

          {/* Category, Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operational Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
              >
                {ACTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!ACTION_CATEGORIES.includes(category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
              >
                <option value="Urgent">🔴 Urgent</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review (CFO)</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Timeline & Deadline Override Card — Both Options: Fix Duration OR Particular Date */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Timeline Control — Option A: Fix Duration OR Option B: Particular Date</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 mr-1">Quick Extend:</span>
                <button
                  type="button"
                  onClick={() => {
                    extendDeadline(3);
                    setDurationDays((prev) => (Number(prev) || 7) + 3);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    extendDeadline(7);
                    setDurationDays((prev) => (Number(prev) || 7) + 7);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    extendDeadline(14);
                    setDurationDays((prev) => (Number(prev) || 7) + 14);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  +14 Days
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Option A: Fix Duration (Days)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={durationDays}
                    onChange={(e) => {
                      const d = Math.max(1, Math.min(365, Number(e.target.value) || 1));
                      setDurationDays(d);
                      const dt = new Date();
                      dt.setDate(dt.getDate() + d);
                      setFixedDeadline(dt.toISOString().split("T")[0]);
                    }}
                    className="w-20 px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono font-bold text-amber-950"
                  />
                  <span className="text-xs font-semibold text-amber-900">Days</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-indigo-900 mb-1">
                  Option B: Particular Date *
                </label>
                <input
                  type="date"
                  required
                  value={fixedDeadline}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setFixedDeadline(iso);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(iso);
                    if (!isNaN(target.getTime())) {
                      const diff = Math.max(
                        1,
                        Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                      );
                      setDurationDays(diff);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white font-mono font-bold text-indigo-950"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Progress ({progressPercentage}%)
                </label>
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="font-mono font-bold text-slate-800 w-9 text-right">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Client Team Member
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. Pooja Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const member = availableTeamMembers.find((m) => m.name === e.target.value);
                      if (member) {
                        setAssignedTo(member.name);
                        setAssignedRole(member.role);
                      }
                    }
                  }}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-slate-700 bg-slate-50 max-w-[130px]"
                  value=""
                >
                  <option value="">Pick Member</option>
                  {availableTeamMembers.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
              <input
                type="text"
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                placeholder="e.g. Senior Accountant"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Subtasks Person Assignment & Target Date */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Subtask Assignments — Assign Person &amp; Target Date</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSubtasks((prev) => [
                    ...prev,
                    {
                      id: `ast-${Date.now()}`,
                      subtaskNumber: prev.length + 1,
                      title: `Subtask Stage ${prev.length + 1}`,
                      assignedTo: availableTeamMembers[0]?.name || assignedTo || "Pooja Sharma",
                      dueDate: fixedDeadline,
                      status: "Pending",
                    },
                  ])
                }
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Subtask</span>
              </button>
            </div>

            <div className="space-y-2">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="p-2.5 rounded-lg bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Subtask {idx + 1} Title
                    </label>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const next = [...subtasks];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setSubtasks(next);
                      }}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Assigned Person
                    </label>
                    <select
                      value={st.assignedTo}
                      onChange={(e) => {
                        const next = [...subtasks];
                        next[idx] = { ...next[idx], assignedTo: e.target.value };
                        setSubtasks(next);
                      }}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-900"
                    >
                      {!availableTeamMembers.some((m) => m.name === st.assignedTo) && (
                        <option value={st.assignedTo}>{st.assignedTo}</option>
                      )}
                      {availableTeamMembers.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end justify-between gap-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-0.5">
                        Subtask Target Date
                      </label>
                      <input
                        type="date"
                        value={toIsoDateString(st.dueDate || fixedDeadline)}
                        onChange={(e) => {
                          const iso = e.target.value;
                          const next = [...subtasks];
                          next[idx] = { ...next[idx], dueDate: iso };
                          setSubtasks(next);
                        }}
                        className="w-full px-2 py-1.5 rounded border border-indigo-200 bg-indigo-50/60 font-mono font-semibold text-indigo-950 text-[11px] cursor-pointer"
                      />
                    </div>
                    {subtasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSubtasks((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remove Subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Task Scope & Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Action instructions, documents needed, or milestones..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
            />
          </div>

          {/* Remarks & Blocked Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Internal guidance notes..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Blocked Reason (if any)
              </label>
              <input
                type="text"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="e.g. Awaiting bank statement confirmation"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-rose-700"
              />
            </div>
          </div>

          {/* Footer Buttons */}
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
              className="px-5 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Action & Timeline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
