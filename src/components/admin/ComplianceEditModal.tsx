import React, { useState, useEffect, useMemo } from "react";
import { ComplianceItem, ComplianceCategory, SubTask } from "../../types";
import { useApp } from "../../context/AppContext";
import { toIsoDateInput, formatDueDate } from "../../utils/dueDate";
import { X, Calendar, FileCheck, Check, UserCheck, Layers, Users, Lock } from "lucide-react";

interface ComplianceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  compliance: ComplianceItem | null;
  onSave: (updated: ComplianceItem) => void;
}

const COMPLIANCE_CATEGORIES: ComplianceCategory[] = [
  "GST",
  "TDS",
  "Income Tax",
  "ROC / MCA",
  "PF & ESI",
  "Audit & Secretarial",
];

export const ComplianceEditModal: React.FC<ComplianceEditModalProps> = ({
  isOpen,
  onClose,
  compliance,
  onSave,
}) => {
  const { userAccounts, activeCompanyId, clientProfile } = useApp();

  // Combined assignable team directory from active userAccounts + entity CFO
  const assignablePeople = useMemo(() => {
    const map = new Map<string, { name: string; roleTitle: string }>();
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
        map.set(u.name.trim(), {
          name: u.name.trim(),
          roleTitle:
            u.roleTitle ||
            (u.role === "cfo"
              ? "Virtual CFO"
              : u.role === "client"
                ? "Client Executive / Director"
                : "Client Finance Team"),
        });
      }
    });
    const cfoName = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (cfoName && !map.has(cfoName)) {
      map.set(cfoName, {
        name: cfoName,
        roleTitle: "Virtual CFO",
      });
    }
    return Array.from(map.values());
  }, [userAccounts, activeCompanyId, clientProfile]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ComplianceCategory>("GST");
  const [frequency, setFrequency] = useState<ComplianceItem["frequency"]>("Monthly");
  const [sectionOrAct, setSectionOrAct] = useState("");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [interestOrPenalty, setInterestOrPenalty] = useState<number>(0);
  const [criticality, setCriticality] = useState<ComplianceItem["criticality"]>("High");
  const [status, setStatus] = useState<ComplianceItem["status"]>("In Progress");
  const [cfoRemarks, setCfoRemarks] = useState("");
  const [clientRemarks, setClientRemarks] = useState("");

  // Primary Compliance Assigned Person & Role
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToRole, setAssignedToRole] = useState("");

  // Subtasks state (Person & Particular Target Date)
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);

  useEffect(() => {
    if (compliance) {
      setName(compliance.name || "");
      setCategory(compliance.category || "GST");
      setFrequency(compliance.frequency || "Monthly");
      setSectionOrAct(compliance.sectionOrAct || compliance.applicability || "");
      setTaxAmount(compliance.taxAmount || 0);
      setInterestOrPenalty(compliance.interestOrPenalty || 0);
      setCriticality(compliance.criticality || "High");
      setStatus(compliance.status || "In Progress");
      setCfoRemarks(compliance.cfoRemarks || "");
      setClientRemarks(compliance.clientRemarks || "");

      const fallbackTeamOwner =
        assignablePeople.find((p) => !p.roleTitle.toLowerCase().includes("cfo"))?.name ||
        assignablePeople[0]?.name ||
        "Pooja Sharma";
      const fallbackCfoOwner =
        clientProfile?.assignedCfo ||
        clientProfile?.cfoName ||
        assignablePeople.find((p) => p.roleTitle.toLowerCase().includes("cfo"))?.name ||
        "Sudhakar";

      const defaultOwner =
        compliance.assignedTo || compliance.subtasks?.[0]?.assignedTo || fallbackTeamOwner;
      const defaultRole =
        compliance.assignedToRole ||
        compliance.assignedRole ||
        compliance.subtasks?.[0]?.assignedRole ||
        "Client Accounts Manager";
      setAssignedTo(defaultOwner);
      setAssignedToRole(defaultRole);

      const fallbackDate = toIsoDateInput(compliance.dueDate || compliance.statutoryDueDate);

      if (compliance.subtasks && compliance.subtasks.length > 0) {
        setSubtasks(
          compliance.subtasks.map((st) => ({
            ...st,
            deadline: toIsoDateInput(st.deadline || st.dueDate, fallbackDate),
            dueDate: toIsoDateInput(st.dueDate || st.deadline, fallbackDate),
          })),
        );
      } else {
        setSubtasks([
          {
            id: `st-1-${compliance.id}`,
            subtaskNumber: 1,
            stageName: "Preparation",
            title: "Data Gathering & Reconciliation",
            assignedTo: defaultOwner,
            assignedRole: defaultRole,
            deadline: fallbackDate,
            dueDate: fallbackDate,
            status: "pending",
          },
          {
            id: `st-2-${compliance.id}`,
            subtaskNumber: 2,
            stageName: "Review",
            title: "CFO Verification & Sign-Off",
            assignedTo: fallbackCfoOwner,
            assignedRole: "Virtual CFO",
            deadline: fallbackDate,
            dueDate: fallbackDate,
            status: "pending",
          },
          {
            id: `st-3-${compliance.id}`,
            subtaskNumber: 3,
            stageName: "Filing",
            title: "Portal Filing & Challan Upload",
            assignedTo: defaultOwner,
            assignedRole: defaultRole,
            deadline: fallbackDate,
            dueDate: fallbackDate,
            status: "pending",
          },
        ]);
      }
    }
  }, [compliance, assignablePeople, clientProfile]);

  if (!isOpen || !compliance) return null;

  const statutoryIsoDate = toIsoDateInput(compliance.dueDate || compliance.statutoryDueDate);

  // Cascade Primary Compliance Owner to all 3 subtasks
  const handleApplyOwnerToAllSubtasks = () => {
    if (!assignedTo.trim()) return;
    setSubtasks((prev) =>
      prev.map((st) => ({
        ...st,
        assignedTo: assignedTo.trim(),
        assignedRole: assignedToRole.trim() || st.assignedRole,
      })),
    );
  };

  // Update a specific subtask's field
  const updateSubtaskField = (index: number, patch: Partial<SubTask>) => {
    setSubtasks((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  // Quick helper to set a subtask's target date relative to the statutory due date
  const setSubtaskDateBeforeStatutory = (index: number, daysBefore: number) => {
    const base = new Date(statutoryIsoDate);
    if (isNaN(base.getTime())) return;
    base.setDate(base.getDate() - daysBefore);
    const iso = base.toISOString().split("T")[0];
    updateSubtaskField(index, {
      deadline: iso,
      dueDate: iso,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: ComplianceItem = {
      ...compliance,
      name: name.trim(),
      category,
      frequency,
      sectionOrAct: sectionOrAct.trim(),
      applicability: sectionOrAct.trim() || compliance.applicability,
      taxAmount: Number(taxAmount) || 0,
      interestOrPenalty: Number(interestOrPenalty) || 0,
      criticality,
      status,
      assignedTo: assignedTo.trim() || "Unassigned",
      assignedToRole: assignedToRole.trim() || "Client Finance Team",
      assignedRole: assignedToRole.trim() || "Client Finance Team",
      subtasks,
      cfoRemarks: cfoRemarks.trim(),
      clientRemarks: clientRemarks.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Admin: Assign Compliance Owner, Subtask Persons &amp; Subtask Target Dates
              </h3>
              <p className="text-xs text-slate-500">
                Statutory due date is fixed by law. Assign compliance owner, assign subtasks (S1,
                S2, S3) to different persons, and fix each subtask&apos;s target date.
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
          {/* Datalist for custom or existing people */}
          <datalist id="compliance-assignable-people">
            {assignablePeople.map((p) => (
              <option key={p.name} value={p.name}>
                {p.roleTitle}
              </option>
            ))}
          </datalist>

          {/* Compliance Title & Statutory Due Date Banner (Read-Only Statutory Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Statutory Compliance Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                  <span>Statutory Due Date</span>
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {formatDueDate(
                    compliance.statutoryDueDate || compliance.dueDate || statutoryIsoDate,
                  )}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-200 text-slate-700">
                Fixed by Law
              </span>
            </div>
          </div>

          {/* 1. ASSIGN COMPLIANCE TO SPECIFIC PERSON (PRIMARY OWNER) */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>1. Assign Compliance to Specific Person (Primary Owner)</span>
              </div>
              <button
                type="button"
                onClick={handleApplyOwnerToAllSubtasks}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                title="Copy this primary assignee to all 3 subtasks below"
              >
                <Users className="w-3 h-3" />
                <span>Cascade Owner to All 3 Subtasks</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select from Team Directory
                </label>
                <select
                  value={
                    assignablePeople.some((p) => p.name === assignedTo) ? assignedTo : "__custom__"
                  }
                  onChange={(e) => {
                    if (e.target.value !== "__custom__") {
                      const found = assignablePeople.find((p) => p.name === e.target.value);
                      setAssignedTo(e.target.value);
                      if (found) setAssignedToRole(found.roleTitle);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  {assignablePeople.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.roleTitle})
                    </option>
                  ))}
                  <option value="__custom__">-- Custom / Type Name --</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Person Name *
                </label>
                <input
                  type="text"
                  required
                  list="compliance-assignable-people"
                  value={assignedTo}
                  onChange={(e) => {
                    setAssignedTo(e.target.value);
                    const match = assignablePeople.find(
                      (p) => p.name.toLowerCase() === e.target.value.trim().toLowerCase(),
                    );
                    if (match) setAssignedToRole(match.roleTitle);
                  }}
                  placeholder="Enter person name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={assignedToRole}
                  onChange={(e) => setAssignedToRole(e.target.value)}
                  placeholder="e.g., Accounts Manager / Tax Lead"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 2. SUBTASKS: ASSIGN TO DIFFERENT PERSONS & FIX SUBTASK TARGET DATE */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>
                  2. Subtask Assignments (Different Persons) &amp; Fix Subtask Target Date
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Assign person &amp; fix target date for each stage
              </span>
            </div>

            <div className="space-y-2.5">
              {subtasks.map((st, idx) => {
                const currentIsoDate = toIsoDateInput(st.deadline || st.dueDate, statutoryIsoDate);
                return (
                  <div
                    key={st.id || idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {st.subtaskNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          Stage {st.subtaskNumber}: {st.stageName || `Subtask ${st.subtaskNumber}`}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : st.status === "in_progress"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {st.status === "completed"
                          ? "Completed"
                          : st.status === "in_progress"
                            ? "In Progress"
                            : "Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Subtask Title */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                          Subtask Action Title
                        </label>
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => updateSubtaskField(idx, { title: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-medium"
                        />
                      </div>

                      {/* Assigned Person Selector + Custom Input */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                          Assigned Person
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            value={
                              assignablePeople.some((p) => p.name === st.assignedTo)
                                ? st.assignedTo
                                : "__custom__"
                            }
                            onChange={(e) => {
                              if (e.target.value !== "__custom__") {
                                const found = assignablePeople.find(
                                  (p) => p.name === e.target.value,
                                );
                                updateSubtaskField(idx, {
                                  assignedTo: e.target.value,
                                  assignedRole: found ? found.roleTitle : st.assignedRole,
                                });
                              }
                            }}
                            className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                          >
                            {assignablePeople.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                            <option value="__custom__">Custom...</option>
                          </select>
                          <input
                            type="text"
                            list="compliance-assignable-people"
                            value={st.assignedTo}
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = assignablePeople.find(
                                (p) => p.name.toLowerCase() === val.trim().toLowerCase(),
                              );
                              updateSubtaskField(idx, {
                                assignedTo: val,
                                assignedRole: match ? match.roleTitle : st.assignedRole,
                              });
                            }}
                            placeholder="Person name"
                            className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Assigned Role */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          value={st.assignedRole}
                          onChange={(e) =>
                            updateSubtaskField(idx, { assignedRole: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700"
                        />
                      </div>

                      {/* Fix Subtask Target Date (No Duration Required) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-indigo-900 mb-1">
                          Subtask Target Date
                        </label>
                        <input
                          type="date"
                          value={currentIsoDate}
                          onChange={(e) => {
                            const newIso = e.target.value;
                            if (!newIso) return;
                            updateSubtaskField(idx, {
                              deadline: newIso,
                              dueDate: newIso,
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50/50 font-mono font-bold text-indigo-950 text-[11px] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Quick Subtask Date Presets relative to Statutory Due Date */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-[10.5px]">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500 mr-1">
                          Quick Set Target Date:
                        </span>
                        {[
                          { label: "5d before Statutory", days: 5 },
                          { label: "3d before Statutory", days: 3 },
                          { label: "2d before Statutory", days: 2 },
                          { label: "1d before Statutory", days: 1 },
                          { label: "On Statutory Date", days: 0 },
                        ].map((preset) => (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => setSubtaskDateBeforeStatutory(idx, preset.days)}
                            className="px-2 py-0.5 rounded font-semibold text-[9.5px] border bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>Target: {formatDueDate(currentIsoDate)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category, Frequency & Criticality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplianceCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
              >
                {COMPLIANCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Filing Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ComplianceItem["frequency"])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annual">Annual</option>
                <option value="Event-Based">Event-Based</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as ComplianceItem["criticality"])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Status & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplianceItem["status"])}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Filed">Filed / Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimated Tax Liability (₹)
              </label>
              <input
                type="number"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Interest / Late Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={interestOrPenalty}
                onChange={(e) => setInterestOrPenalty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-rose-700"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Virtual CFO Remarks</label>
              <textarea
                rows={2}
                value={cfoRemarks}
                onChange={(e) => setCfoRemarks(e.target.value)}
                placeholder="Guidance or audit notes from Virtual CFO..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client Team Remarks</label>
              <textarea
                rows={2}
                value={clientRemarks}
                onChange={(e) => setClientRemarks(e.target.value)}
                placeholder="Notes from client finance team..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
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
              className="px-5 py-2 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>Save Assignments &amp; Subtask Dates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
