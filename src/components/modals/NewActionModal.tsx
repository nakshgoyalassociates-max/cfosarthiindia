import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { ActionPriority, ActionCategory } from "../../types";
import { X, PlusCircle, Clock, Calendar, TrendingUp } from "lucide-react";

export const NewActionModal: React.FC = () => {
  const {
    isNewActionModalOpen,
    setIsNewActionModalOpen,
    addAction,
    userAccounts,
    activeCompanyId,
    clientProfile,
  } = useApp();

  const availableMembers = useMemo(() => {
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
          role:
            u.roleTitle ||
            (u.role === "cfo"
              ? "Virtual CFO"
              : u.role === "client"
                ? "Client Director"
                : "Client Finance Team"),
        });
      }
    });
    const cfoName = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (cfoName && !map.has(cfoName.toLowerCase())) {
      map.set(cfoName.toLowerCase(), { name: cfoName, role: "Virtual CFO" });
    }
    return Array.from(map.values());
  }, [userAccounts, activeCompanyId, clientProfile]);

  const todayStr = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ActionCategory>("Banking & Treasury");
  const [assignedTo, setAssignedTo] = useState(availableMembers[0]?.name || "");
  const [priority, setPriority] = useState<ActionPriority>("High");

  useEffect(() => {
    if (
      availableMembers.length > 0 &&
      (!assignedTo || !availableMembers.some((m) => m.name === assignedTo))
    ) {
      setAssignedTo(availableMembers[0].name);
    }
  }, [availableMembers, assignedTo]);

  // Decided Timeline & Duration parameters
  const [decidedDate, setDecidedDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState<number>(5);
  const [checkInCadenceDays, setCheckInCadenceDays] = useState<number>(2);
  const [fixedDeadline, setFixedDeadline] = useState("");
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [remarks, setRemarks] = useState("");

  // Automatically recalculate target deadline when decidedDate or durationDays changes
  useEffect(() => {
    if (decidedDate && durationDays > 0) {
      const d = new Date(decidedDate);
      d.setDate(d.getDate() + Number(durationDays));
      setFixedDeadline(d.toISOString().split("T")[0]);
    }
  }, [decidedDate, durationDays]);

  if (!isNewActionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedMember = availableMembers.find((m) => m.name === assignedTo);

    addAction({
      title: title.trim(),
      description: description.trim(),
      category,
      assignedTo,
      assignedRole: matchedMember?.role || "Client Team",
      priority,
      status:
        initialProgress === 100 ? "Completed" : initialProgress > 0 ? "In Progress" : "Pending",
      decidedDate,
      durationDays: Number(durationDays) || 5,
      checkInCadenceDays: Number(checkInCadenceDays) || 2,
      fixedDeadline: fixedDeadline || decidedDate,
      progressPercentage: initialProgress,
      estimatedHours: Number(estimatedHours) || 0,
      remarks: remarks.trim(),
    });

    // Reset form and close
    setTitle("");
    setDescription("");
    setRemarks("");
    setDurationDays(5);
    setInitialProgress(0);
    setIsNewActionModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                Action Decision Flow
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                2-Day Cadence Progress Track
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Decide New Action & Duration of Completion
            </h2>
            <p className="text-xs text-slate-500">
              Set planned duration for completion. The assignee will submit progress updates every 2
              days.
            </p>
          </div>
          <button
            onClick={() => setIsNewActionModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Task Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Action Title / Task Scope *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Axis Bank Working Capital CC Stock & Debtors Statement Submission"
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detailed Scope & Context
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, requirements, and deliverables for the assignee..."
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs"
            />
          </div>

          {/* Category & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionCategory)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              >
                <option value="Banking & Treasury">Banking & Treasury</option>
                <option value="Accounts Payable">Accounts Payable (Vendor)</option>
                <option value="Accounts Receivable">Accounts Receivable (Debtors)</option>
                <option value="Financial Reporting & MIS">Financial Reporting & MIS</option>
                <option value="General Ledger & Fixed Assets">General Ledger & Fixed Assets</option>
                <option value="Payroll & HR Ops">Payroll & HR Ops</option>
                <option value="Internal Audit & Controls">Internal Audit & Controls</option>
                <option value="Direct/Indirect Tax Ops">Direct/Indirect Tax Ops</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              >
                {availableMembers.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DECIDED DURATION & TIMELINE SECTION — Both Options: Fix Duration OR Particular Date */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Timeline: Option A (Fix Duration) OR Option B (Particular Date)
              </span>
              <span className="text-[10.5px] text-indigo-700 font-medium">
                {durationDays} Days • Due {fixedDeadline}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Start / Decided Date
                </label>
                <input
                  type="date"
                  value={decidedDate}
                  onChange={(e) => setDecidedDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Option A: Fix Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 rounded-lg border border-amber-300 bg-white text-xs font-bold font-mono text-amber-950"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-900 mb-1">
                  Option B: Particular Date *
                </label>
                <input
                  type="date"
                  value={fixedDeadline}
                  onChange={(e) => {
                    const newDue = e.target.value;
                    setFixedDeadline(newDue);
                    const startObj = new Date(decidedDate || todayStr);
                    const dueObj = new Date(newDue);
                    if (!isNaN(startObj.getTime()) && !isNaN(dueObj.getTime())) {
                      const diff = Math.max(
                        1,
                        Math.round((dueObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)),
                      );
                      setDurationDays(diff);
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-indigo-300 bg-white text-xs font-bold font-mono text-indigo-950"
                />
              </div>
            </div>

            {/* Quick Duration Preset Pills */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-medium mr-1">Presets:</span>
              {[2, 3, 5, 7, 14, 21].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    durationDays === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            {/* Cadence info */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-indigo-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Assignee Progress Cadence: <strong>Every {checkInCadenceDays} Days</strong>
              </span>
              <span className="text-slate-400">
                Graphical progress bar tracks pace vs elapsed time
              </span>
            </div>
          </div>

          {/* Priority, Hours, and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              >
                <option value="Urgent">Urgent (Immediate turnaround)</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Internal Pre-requisites / Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Ledger extracts downloaded from SAP portal..."
                className="w-full p-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewActionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Decide Action Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
