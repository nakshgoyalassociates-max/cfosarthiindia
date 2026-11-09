// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ActionFlowTaskPriority, ActionFlowMilestone } from "../../types";
import { X, Calendar, User, Clock, CheckSquare, Plus, Trash2, ShieldCheck } from "lucide-react";

interface NewActionFlowTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Statutory Compliance & Filings",
  "Accounts Payable & Vendor Disallowance",
  "Working Capital & Debtors Realization",
  "Audit, Internal Controls & CARO",
  "Treasury, Banking & BG Renewals",
  "Financial MIS & Board Reporting",
  "Tax Assessments & Dispute Appeals",
  "Corporate Secretarial & MCA Governance",
];

const PRESET_DURATIONS = [5, 7, 10, 14, 21, 30, 45];

export const NewActionFlowTaskModal: React.FC<NewActionFlowTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addActionFlowTask, companies, clientProfile } = useApp();

  const todayStr = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState(clientProfile.id);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<ActionFlowTaskPriority>("High");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedRole, setAssignedRole] = useState("Finance Executive");
  const [startDate, setStartDate] = useState(todayStr);
  const [allocatedDurationDays, setAllocatedDurationDays] = useState<number>(14);
  const [checkInCadence, setCheckInCadence] = useState("Daily Standup (Every 24h)");

  // Computed target due date based on startDate and allocatedDurationDays
  const computedDueDate = (() => {
    try {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + allocatedDurationDays);
        return d.toISOString().split("T")[0];
      }
    } catch {}
    return todayStr;
  })();

  // Milestone list state
  const [milestones, setMilestones] = useState<Array<{ title: string; dayOffset: number }>>([
    { title: "Collation of preliminary working papers & ledger dump", dayOffset: 3 },
    { title: "Discrepancy review & cross-verification with counterparty", dayOffset: 7 },
    { title: "Draft compilation & internal CFO preliminary sign-off", dayOffset: 11 },
    { title: "Final release, statutory upload & permanent documentation archiving", dayOffset: 14 },
  ]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: `Milestone Stage ${prev.length + 1}`,
        dayOffset: Math.min(allocatedDurationDays, (prev[prev.length - 1]?.dayOffset || 0) + 3),
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMilestone = (
    index: number,
    field: "title" | "dayOffset",
    val: string | number,
  ) => {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: val } : m)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo.trim()) return;

    const selectedCompany = companies.find((c) => c.id === companyId) || clientProfile;

    // Convert drafted milestones to ActionFlowMilestone objects
    const formattedMilestones: ActionFlowMilestone[] = milestones.map((m, idx) => {
      const msDue = new Date(startDate);
      msDue.setDate(msDue.getDate() + Number(m.dayOffset));
      return {
        id: `ms-new-${Date.now()}-${idx}`,
        milestoneNumber: idx + 1,
        title: m.title.trim(),
        startDate,
        dueDate: msDue.toISOString().split("T")[0],
        status: "pending",
        progressPercentage: 0,
        weightPercentage: Math.round(100 / milestones.length),
        signOffRequired: true,
      };
    });

    const nameParts = assignedTo.trim().split(" ");
    const avatar =
      nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : assignedTo.trim().slice(0, 2).toUpperCase();

    addActionFlowTask({
      title: title.trim(),
      description: description.trim(),
      companyId,
      companyName: selectedCompany.companyName,
      category,
      priority,
      status: "not_started",
      assignedTo: assignedTo.trim(),
      assignedRole: assignedRole.trim(),
      assignedAvatar: avatar,
      startDate,
      dueDate: computedDueDate,
      allocatedDurationDays,
      progressPercentage: 0,
      checkInCadence,
      milestones: formattedMilestones,
      challenges: [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Assign Time-Bound Deliverable Task</h3>
            <p className="text-xs text-slate-300">
              Set task duration, define person accountability, and establish key milestones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Company & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Workspace *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Task Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Section 43B(h) MSME Vendor Audit & Priority Payment Clearance"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            />
          </div>

          {/* Assignee & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Person (Name) *
              </label>
              <input
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="E.g., Pooja Sharma / Rahul Verma"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assignee Designation / Role *
              </label>
              <input
                type="text"
                required
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                placeholder="E.g., Senior Accounts Lead / Tax Executive"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Time Duration & Dates Allocation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-slate-700" />
                Time Duration & Target Horizon Allocation
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Deadline: {computedDueDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Allocated Days
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={allocatedDurationDays}
                    onChange={(e) => setAllocatedDurationDays(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold"
                  />
                  <span className="text-xs text-slate-500 font-medium">Days</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Quick Preset
                </label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_DURATIONS.slice(0, 4).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAllocatedDurationDays(d)}
                      className={`px-1.5 py-1 text-[10px] font-semibold rounded border cursor-pointer ${
                        allocatedDurationDays === d
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ActionFlowTaskPriority)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold"
                >
                  <option value="Urgent">Urgent (Statutory Risk)</option>
                  <option value="High">High (Deliverable Priority)</option>
                  <option value="Medium">Medium (Regular Operations)</option>
                  <option value="Low">Low (Discretionary)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Check-in Cadence
                </label>
                <select
                  value={checkInCadence}
                  onChange={(e) => setCheckInCadence(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  <option value="Daily Standup (Every 24h)">Daily Standup (Every 24h)</option>
                  <option value="Bi-Weekly Check-in (Every 3 Days)">
                    Bi-Weekly Check-in (Every 3 Days)
                  </option>
                  <option value="Weekly CFO Review">Weekly CFO Review</option>
                  <option value="On Milestone Completion Only">On Milestone Completion Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Scope Expectation
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the objective, expected deliverable files, and any statutory boundary conditions..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Milestones Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Progress Milestones ({milestones.length})
              </label>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((ms, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    required
                    value={ms.title}
                    onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                    placeholder="Milestone description"
                    className="flex-1 text-xs p-1.5 rounded border border-slate-300 bg-white text-slate-900"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">Day:</span>
                    <input
                      type="number"
                      min={1}
                      max={allocatedDurationDays}
                      value={ms.dayOffset}
                      onChange={(e) =>
                        handleUpdateMilestone(idx, "dayOffset", Number(e.target.value))
                      }
                      className="w-14 text-xs p-1.5 rounded border border-slate-300 bg-white text-slate-900 text-center font-bold"
                    />
                  </div>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Confirm Task Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
