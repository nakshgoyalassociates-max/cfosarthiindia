// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { ActionFlowTask, ActionFlowTaskStatus, ActionFlowTaskPriority } from "../../types";
import { toIsoDateString } from "../../utils/dueDate";
import { sortCompliancesByUrgencyAndPastMonths } from "../../utils/complianceCalendarEngine";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  CheckSquare,
  X,
  RotateCcw,
  Edit3,
  Check,
  PlayCircle,
  Timer,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Layers,
  Calendar,
} from "lucide-react";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";

export const ComplianceAssignedTasksView: React.FC = () => {
  const {
    actionFlowTasks,
    rawActionFlowTasks,
    compliances,
    updateComplianceMasterItem,
    assignComplianceOwner,
    updateComplianceSubtaskAssignment,
    userAccounts,
    clientProfile,
    toggleItemVisibility,
    addActionFlowTask,
    updateActionFlowTask,
    deleteActionFlowTask,
    currentUser,
    role,
    isCfoAdmin,
    showToast,
  } = useApp();

  const isAdmin = role === "cfo" || isCfoAdmin;

  // Sub-view mode: "all" (both sections), "compliance_assignments" (Compliance & Subtask Assignments), "action_tasks" (Assigned Action Flow Tasks)
  const [subViewMode, setSubViewMode] = useState<"all" | "compliance_assignments" | "action_tasks">(
    "all",
  );

  // Assignable directory strictly from User Master (userAccounts) and Entity Master (clientProfile)
  const assignableDirectory = useMemo(() => {
    const map = new Map<string, { name: string; roleTitle: string }>();
    (userAccounts || []).forEach((u) => {
      if (u.name) {
        map.set(u.name.trim(), {
          name: u.name.trim(),
          roleTitle:
            u.roleTitle ||
            (u.role === "cfo"
              ? "Virtual CFO"
              : u.role === "client"
                ? "Client Director"
                : "Client Finance Team"),
        });
      }
    });
    const entityCfo = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (entityCfo && !map.has(entityCfo)) {
      map.set(entityCfo, { name: entityCfo, roleTitle: "Virtual CFO" });
    }
    return Array.from(map.values());
  }, [userAccounts, clientProfile]);

  const defaultAssigneeName =
    assignableDirectory.find((p) => !p.roleTitle.toLowerCase().includes("cfo"))?.name ||
    assignableDirectory[0]?.name ||
    currentUser?.name ||
    "Finance Team";
  const activeCfoDisplayName =
    clientProfile?.assignedCfo ||
    clientProfile?.cfoName ||
    assignableDirectory.find((p) => p.roleTitle.toLowerCase().includes("cfo"))?.name ||
    currentUser?.name ||
    "Virtual CFO";

  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<ActionFlowTask | null>(null);
  const hiddenTasksCount = useMemo(
    () => (rawActionFlowTasks || []).filter((t) => t.isHidden).length,
    [rawActionFlowTasks],
  );
  const activeTasksSource = useMemo(
    () => (showHidden && isAdmin ? rawActionFlowTasks || actionFlowTasks : actionFlowTasks),
    [showHidden, isAdmin, rawActionFlowTasks, actionFlowTasks],
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>("ALL");

  // Inline Assignee remarks editing state
  const [editingRemarksTaskId, setEditingRemarksTaskId] = useState<string | null>(null);
  const [remarksDrafts, setRemarksDrafts] = useState<Record<string, string>>({});

  // Inline CFO remarks editing state
  const [editingCfoRemarksTaskId, setEditingCfoRemarksTaskId] = useState<string | null>(null);
  const [cfoRemarksDrafts, setCfoRemarksDrafts] = useState<Record<string, string>>({});

  // Modal to Assign New Task
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState(defaultAssigneeName);
  const [newAssignedRole, setNewAssignedRole] = useState("Client Accounts Manager");
  const [newDurationDays, setNewDurationDays] = useState(10);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  });
  const [newPriority, setNewPriority] = useState<ActionFlowTaskPriority>("High");
  const [newInitialStatus, setNewInitialStatus] = useState<ActionFlowTaskStatus>("in_process");
  const [newInitialRemarks, setNewInitialRemarks] = useState("");
  const [newInitialCfoRemarks, setNewInitialCfoRemarks] = useState("");

  // Distinct assignees across tasks and compliances
  const allAssignees = useMemo(() => {
    const names = new Set<string>();
    assignableDirectory.forEach((p) => names.add(p.name));
    (actionFlowTasks || []).forEach((t) => {
      if (t.assignedTo) names.add(t.assignedTo);
    });
    (compliances || []).forEach((c) => {
      if (c.assignedTo) names.add(c.assignedTo);
      (c.subtasks || []).forEach((st) => {
        if (st.assignedTo) names.add(st.assignedTo);
      });
    });
    return Array.from(names);
  }, [assignableDirectory, actionFlowTasks, compliances]);

  // Helper to normalize status for clean categorization
  const normalizeStatus = (
    status: ActionFlowTaskStatus,
  ): "in_process" | "in_time" | "completed" | "stuck" | "not_started" => {
    if (status === "stuck" || status === "stuck_blocked") return "stuck";
    if (status === "in_time") return "in_time";
    if (status === "completed") return "completed";
    if (status === "not_started") return "not_started";
    return "in_process";
  };

  // Filtered compliances for the Statutory Compliance & Subtask Assignment Matrix
  const filteredCompliances = useMemo(() => {
    const raw = (compliances || []).filter((c) => {
      if (selectedAssigneeFilter !== "ALL") {
        const isOwner = c.assignedTo === selectedAssigneeFilter;
        const isSub = (c.subtasks || []).some((s) => s.assignedTo === selectedAssigneeFilter);
        if (!isOwner && !isSub) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.assignedTo && c.assignedTo.toLowerCase().includes(q)) ||
          (c.subtasks || []).some(
            (s) => s.title.toLowerCase().includes(q) || s.assignedTo.toLowerCase().includes(q),
          );
        if (!match) return false;
      }
      return true;
    });
    return sortCompliancesByUrgencyAndPastMonths(raw);
  }, [compliances, selectedAssigneeFilter, searchQuery]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return (activeTasksSource || []).filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          t.taskCode?.toLowerCase().includes(q) ||
          t.assignedTo?.toLowerCase().includes(q) ||
          t.stuckRemarks?.toLowerCase().includes(q) ||
          t.cfoRemarks?.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (selectedStatusFilter !== "ALL") {
        const normalized = normalizeStatus(t.status);
        if (selectedStatusFilter !== normalized) return false;
      }

      if (selectedAssigneeFilter !== "ALL" && t.assignedTo !== selectedAssigneeFilter) return false;
      return true;
    });
  }, [activeTasksSource, searchQuery, selectedStatusFilter, selectedAssigneeFilter]);

  // Status configuration helper
  const getStatusConfig = (rawStatus: ActionFlowTaskStatus) => {
    const normalized = normalizeStatus(rawStatus);
    switch (normalized) {
      case "in_process":
        return {
          normalized: "in_process",
          label: "In Process",
          badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
          dotCls: "bg-blue-500",
          icon: PlayCircle,
        };
      case "in_time":
        return {
          normalized: "in_time",
          label: "In Time",
          badgeCls: "bg-teal-50 text-teal-700 border-teal-200",
          dotCls: "bg-teal-500",
          icon: Timer,
        };
      case "completed":
        return {
          normalized: "completed",
          label: "Completed",
          badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotCls: "bg-emerald-500",
          icon: CheckCircle2,
        };
      case "stuck":
        return {
          normalized: "stuck",
          label: "Stuck",
          badgeCls: "bg-rose-50 text-rose-700 border-rose-300 font-bold",
          dotCls: "bg-rose-500 animate-pulse",
          icon: AlertTriangle,
        };
      case "not_started":
      default:
        return {
          normalized: "not_started",
          label: "Not Started",
          badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
          dotCls: "bg-slate-400",
          icon: Clock,
        };
    }
  };

  // Status Change handler
  const handleStatusChange = (taskId: string, newStatus: ActionFlowTaskStatus) => {
    const normalized = normalizeStatus(newStatus);
    updateActionFlowTask(taskId, { status: newStatus });

    if (normalized === "stuck") {
      const task = (actionFlowTasks || []).find((t) => t.id === taskId);
      setEditingRemarksTaskId(taskId);
      setRemarksDrafts((prev) => ({
        ...prev,
        [taskId]: task?.stuckRemarks || "",
      }));
      showToast("Task marked as Stuck. Please mention remarks.");
    } else {
      showToast(`Task status updated to ${getStatusConfig(newStatus).label}.`);
    }
  };

  // --- Assignee Remarks Handlers ---
  const handleStartEditRemarks = (task: ActionFlowTask) => {
    setEditingRemarksTaskId(task.id);
    setRemarksDrafts((prev) => ({
      ...prev,
      [task.id]: task.stuckRemarks || "",
    }));
  };

  const handleSaveRemarks = (taskId: string) => {
    const text = (remarksDrafts[taskId] ?? "").trim();
    const nowStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    updateActionFlowTask(taskId, {
      stuckRemarks: text || undefined,
      stuckRemarksAuthor: text ? currentUser.name : undefined,
      stuckRemarksDate: text ? nowStr : undefined,
    });

    setEditingRemarksTaskId(null);
    showToast(text ? "Assignee remarks updated." : "Remarks cleared.");
  };

  const handleCancelRemarks = () => {
    setEditingRemarksTaskId(null);
  };

  // --- CFO Remarks Handlers ---
  const handleStartEditCfoRemarks = (task: ActionFlowTask) => {
    setEditingCfoRemarksTaskId(task.id);
    setCfoRemarksDrafts((prev) => ({
      ...prev,
      [task.id]: task.cfoRemarks || "",
    }));
  };

  const handleSaveCfoRemarks = (taskId: string) => {
    const text = (cfoRemarksDrafts[taskId] ?? "").trim();
    const nowStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    updateActionFlowTask(taskId, {
      cfoRemarks: text || undefined,
      cfoRemarksAuthor: text
        ? role === "cfo"
          ? `${activeCfoDisplayName} (Virtual CFO)`
          : currentUser.name
        : undefined,
      cfoRemarksDate: text ? nowStr : undefined,
    });

    setEditingCfoRemarksTaskId(null);
    showToast(text ? "CFO remarks updated." : "CFO remarks cleared.");
  };

  const handleCancelCfoRemarks = () => {
    setEditingCfoRemarksTaskId(null);
  };

  // Create new task submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const start = new Date(newStartDate);
    const dueIso =
      newDueDate ||
      (() => {
        const due = new Date(start);
        due.setDate(due.getDate() + (newDurationDays || 7));
        return due.toISOString().split("T")[0];
      })();

    const initials = newAssignedTo
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const normalizedInitStatus = normalizeStatus(newInitialStatus);
    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    addActionFlowTask({
      taskCode: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: `Assigned to ${newAssignedTo} for duration of ${newDurationDays} days.`,
      companyId: "client-101",
      companyName: "Nexora Innovations Tech Pvt Ltd",
      category: "Operations & Compliance",
      priority: newPriority,
      status: newInitialStatus,
      assignedTo: newAssignedTo,
      assignedRole: newAssignedRole,
      assignedEmail: "team@company.in",
      assignedAvatar: initials,
      startDate: newStartDate,
      dueDate: dueIso,
      allocatedDurationDays: newDurationDays,
      estimatedHours: newDurationDays * 2,
      timeSpentHours: 0,
      checkInCadence: "Every 2 Days",
      progressPercentage: normalizedInitStatus === "completed" ? 100 : 0,
      stuckRemarks:
        normalizedInitStatus === "stuck" && newInitialRemarks.trim()
          ? newInitialRemarks.trim()
          : undefined,
      stuckRemarksAuthor:
        normalizedInitStatus === "stuck" && newInitialRemarks.trim() ? currentUser.name : undefined,
      stuckRemarksDate:
        normalizedInitStatus === "stuck" && newInitialRemarks.trim() ? todayStr : undefined,
      cfoRemarks: newInitialCfoRemarks.trim() ? newInitialCfoRemarks.trim() : undefined,
      cfoRemarksAuthor: newInitialCfoRemarks.trim()
        ? role === "cfo"
          ? `${activeCfoDisplayName} (Virtual CFO)`
          : currentUser.name
        : undefined,
      cfoRemarksDate: newInitialCfoRemarks.trim() ? todayStr : undefined,
      milestones: [],
      challenges: [],
      createdAt: new Date().toISOString(),
    });

    setIsNewTaskModalOpen(false);
    setNewTitle("");
    setNewInitialRemarks("");
    setNewInitialCfoRemarks("");
    showToast("New task assigned successfully!");
  };

  // KPI Counts
  const totalTasks = (actionFlowTasks || []).length;
  const inProcessCount = (actionFlowTasks || []).filter(
    (t) => normalizeStatus(t.status) === "in_process",
  ).length;
  const inTimeCount = (actionFlowTasks || []).filter(
    (t) => normalizeStatus(t.status) === "in_time",
  ).length;
  const completedCount = (actionFlowTasks || []).filter(
    (t) => normalizeStatus(t.status) === "completed",
  ).length;
  const stuckCount = (actionFlowTasks || []).filter(
    (t) => normalizeStatus(t.status) === "stuck",
  ).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Quick Status Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Assigned Compliances, Subtasks &amp; Action Tasks
              </h2>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {(compliances || []).length} Compliances
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {totalTasks} Action Tasks
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {inProcessCount} In Process
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {completedCount} Completed
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  stuckCount > 0
                    ? "text-rose-700 bg-rose-50 border-rose-300 font-bold animate-pulse"
                    : "text-slate-600 bg-slate-50 border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${stuckCount > 0 ? "bg-rose-500" : "bg-slate-400"}`}
                ></span>
                {stuckCount} Stuck
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assign primary compliance owners and assign individual subtasks (S1, S2, S3) to
              different persons with a specific <strong>Subtask Target Date</strong> (Statutory
              compliance due dates are fixed by law).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setSubViewMode("all")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                  subViewMode === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Views
              </button>
              <button
                type="button"
                onClick={() => setSubViewMode("compliance_assignments")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                  subViewMode === "compliance_assignments"
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Compliance &amp; Subtask Assignments
              </button>
              <button
                type="button"
                onClick={() => setSubViewMode("action_tasks")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                  subViewMode === "action_tasks"
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Action Flow Tasks ({totalTasks})
              </button>
            </div>

            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search compliance, subtask, person, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedAssigneeFilter}
              onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Assigned Persons</option>
              {allAssignees.map((name) => (
                <option key={name} value={name}>
                  👤 {name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Task Statuses</option>
              <option value="in_process">In Process</option>
              <option value="in_time">In Time</option>
              <option value="completed">Completed</option>
              <option value="stuck">Stuck</option>
              <option value="not_started">Not Started</option>
            </select>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showHidden
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                title="Show or hide archived/hidden assigned tasks"
              >
                {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>
                  {showHidden ? "Showing Hidden" : "Hidden"} ({hiddenTasksCount})
                </span>
              </button>
            )}

            {(searchQuery ||
              selectedStatusFilter !== "ALL" ||
              selectedAssigneeFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatusFilter("ALL");
                  setSelectedAssigneeFilter("ALL");
                }}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION A: STATUTORY COMPLIANCE & SUBTASK PERSON ASSIGNMENT + TARGET DATE MATRIX */}
      {(subViewMode === "all" || subViewMode === "compliance_assignments") && (
        <div className="bg-white rounded-xl border border-black/20 shadow-2xs overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    Statutory Compliance &amp; Subtask Person Assignments — Target Date per Subtask
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {filteredCompliances.length} Compliances
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {isAdmin
                    ? "Admin Control: Statutory compliance due dates are fixed by Act. Assign each compliance to a specific owner, and fix the Assigned Person & Target Date for Subtasks 1, 2 & 3."
                    : "View assigned compliance owners, individual subtask assignees, and subtask target dates."}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border-t border-black/15">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-black/20 text-[10px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 min-w-[215px] border-b border-black/20">
                    Compliance &amp; Category
                  </th>
                  <th className="py-2.5 px-3 min-w-[165px] border-b border-black/20">
                    Assigned Compliance Owner
                  </th>
                  <th className="py-2.5 px-3 min-w-[205px] border-b border-black/20">
                    Subtask 1 (Prep) — Person &amp; Target Date
                  </th>
                  <th className="py-2.5 px-3 min-w-[205px] border-b border-black/20">
                    Subtask 2 (Review) — Person &amp; Target Date
                  </th>
                  <th className="py-2.5 px-3 min-w-[205px] border-b border-black/20">
                    Subtask 3 (Filing) — Person &amp; Target Date
                  </th>
                  <th className="py-2.5 px-3 min-w-[130px] text-right border-b border-black/20">
                    Statutory Due Date (Fixed)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/15">
                {filteredCompliances.map((comp) => {
                  const currentOwner =
                    comp.assignedTo || comp.subtasks?.[0]?.assignedTo || defaultAssigneeName;

                  return (
                    <tr
                      key={comp.id}
                      className="hover:bg-slate-50/80 transition-colors border-b border-black/15"
                    >
                      {/* Compliance Name + Category */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="font-bold text-slate-900 leading-snug">{comp.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {comp.category}
                          </span>
                          <span>• {comp.frequency}</span>
                        </div>
                      </td>

                      {/* Primary Compliance Owner */}
                      <td className="py-2.5 px-3 align-middle">
                        {isAdmin ? (
                          <div className="space-y-0.5">
                            <select
                              value={currentOwner}
                              onChange={(e) => {
                                const sel = e.target.value;
                                const found = assignableDirectory.find((p) => p.name === sel);
                                assignComplianceOwner(
                                  comp.id,
                                  sel,
                                  found?.roleTitle || "Client Finance Team",
                                  false,
                                );
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 text-[11px] font-bold text-indigo-950 hover:bg-indigo-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {!assignableDirectory.some((p) => p.name === currentOwner) && (
                                <option value={currentOwner}>{currentOwner}</option>
                              )}
                              {assignableDirectory.map((p) => (
                                <option key={p.name} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <div className="text-[9.5px] text-slate-500 truncate">
                              {comp.assignedToRole || "Primary Owner"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-indigo-950 text-xs">{currentOwner}</div>
                            <div className="text-[10px] text-slate-500">
                              {comp.assignedToRole || "Primary Owner"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Subtasks 1, 2, 3 */}
                      {[0, 1, 2].map((idx) => {
                        const st = comp.subtasks?.[idx];
                        const stNum = (idx + 1) as 1 | 2 | 3;
                        const stAssignee = st?.assignedTo || "Unassigned";
                        const isDone = st?.status === "completed";

                        return (
                          <td key={stNum} className="py-2.5 px-3 align-middle">
                            <div
                              className={`p-2 rounded-lg border space-y-1.5 ${
                                isDone
                                  ? "bg-emerald-50/40 border-emerald-200"
                                  : "bg-slate-50/70 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-slate-700 truncate">
                                  S{stNum}: {st?.stageName || `Stage ${stNum}`}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isDone
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isDone ? "Done" : "Pending"}
                                </span>
                              </div>

                              {isAdmin ? (
                                <div className="space-y-1">
                                  <select
                                    value={stAssignee}
                                    onChange={(e) => {
                                      const sel = e.target.value;
                                      const found = assignableDirectory.find((p) => p.name === sel);
                                      updateComplianceSubtaskAssignment(comp.id, stNum, {
                                        assignedTo: sel,
                                        assignedRole:
                                          found?.roleTitle || st?.assignedRole || "Team Member",
                                      });
                                    }}
                                    className="w-full px-1.5 py-1 rounded border border-slate-300 bg-white text-[10.5px] font-semibold text-slate-900 cursor-pointer"
                                    title={`Assign Subtask ${stNum} to a specific person`}
                                  >
                                    {!assignableDirectory.some((p) => p.name === stAssignee) && (
                                      <option value={stAssignee}>{stAssignee}</option>
                                    )}
                                    {assignableDirectory.map((p) => (
                                      <option key={p.name} value={p.name}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9.5px] font-semibold text-slate-500 shrink-0">
                                      Target Date:
                                    </span>
                                    <input
                                      type="date"
                                      value={toIsoDateString(
                                        st?.deadline || comp.dueDate || comp.statutoryDueDate,
                                      )}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          updateComplianceSubtaskAssignment(comp.id, stNum, {
                                            deadline: e.target.value,
                                          });
                                        }
                                      }}
                                      className="flex-1 min-w-0 px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50/70 font-mono text-[10px] font-bold text-indigo-950 cursor-pointer"
                                      title={`Fix Target Date for Subtask ${stNum}`}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[11px] gap-1">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {stAssignee}
                                  </span>
                                  {st?.deadline && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono text-[9.5px] shrink-0">
                                      {st.deadline}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Statutory Due Date (Locked) */}
                      <td className="py-2.5 px-3 align-middle text-right">
                        <div className="inline-flex flex-col items-end">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold text-[11px]"
                            title="Statutory due date is fixed by law and cannot be manually changed"
                          >
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{comp.statutoryDueDate || comp.dueDate}</span>
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">
                            Statutory Fixed
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B: ASSIGNED ACTION FLOW TASKS TABLE */}
      {(subViewMode === "all" || subViewMode === "action_tasks") && (
        <div className="bg-white rounded-xl border border-black/20 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Assigned Action Flow Tasks ({filteredTasks.length})
              </h3>
            </div>
            {isAdmin && (
              <span className="text-[11px] text-indigo-700 font-medium">
                Tip: Admin can directly change Assignee and Fixed Duration (Days) inline below
              </span>
            )}
          </div>
          <div className="overflow-x-auto border-t border-black/15">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-black/20 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 min-w-[240px] border-b border-black/20">
                    Task &amp; Code
                  </th>
                  <th className="py-3 px-3 min-w-[175px] border-b border-black/20">Assignee</th>
                  <th className="py-3 px-3 min-w-[180px] border-b border-black/20">
                    Duration (Days) OR Particular Date
                  </th>
                  <th className="py-3 px-3 min-w-[140px] border-b border-black/20">
                    Status Update
                  </th>
                  <th className="py-3 px-3.5 min-w-[240px] border-b border-black/20">
                    Assignee Remarks
                  </th>
                  <th className="py-3 px-3.5 min-w-[240px] border-b border-black/20">
                    CFO Remarks
                  </th>
                  <th className="py-3 px-3 text-right w-16 border-b border-black/20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/15">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">
                        No assigned tasks match the criteria
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Adjust your filters or assign a new task.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const normalizedStatus = normalizeStatus(task.status);
                    const statusCfg = getStatusConfig(task.status);
                    const isStuck = normalizedStatus === "stuck";

                    // Assignee remarks state
                    const isEditingRemarks = editingRemarksTaskId === task.id;
                    const currentDraft =
                      remarksDrafts[task.id] !== undefined
                        ? remarksDrafts[task.id]
                        : task.stuckRemarks || "";

                    // CFO remarks state
                    const isEditingCfoRemarks = editingCfoRemarksTaskId === task.id;
                    const currentCfoDraft =
                      cfoRemarksDrafts[task.id] !== undefined
                        ? cfoRemarksDrafts[task.id]
                        : task.cfoRemarks || "";

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isStuck ? "bg-rose-50/30" : ""
                        }`}
                      >
                        {/* Column 1: Task Title & Code */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {task.taskCode || "TSK"}
                              </span>
                              {task.priority === "Urgent" && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                  Urgent
                                </span>
                              )}
                              {task.priority === "High" && (
                                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  High
                                </span>
                              )}
                              {task.isHidden && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                  <EyeOff className="w-2.5 h-2.5" />
                                  HIDDEN
                                </span>
                              )}
                            </div>
                            <div
                              className="font-bold text-slate-900 text-xs sm:text-[12.5px] leading-snug line-clamp-2"
                              title={task.title}
                            >
                              {task.title}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Assignee (Editable by Admin) */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                              {task.assignedAvatar ||
                                (task.assignedTo || "AS")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              {isAdmin ? (
                                <select
                                  value={task.assignedTo || "Unassigned"}
                                  onChange={(e) => {
                                    const sel = e.target.value;
                                    const found = assignableDirectory.find((p) => p.name === sel);
                                    const initials = sel
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase();
                                    updateActionFlowTask(task.id, {
                                      assignedTo: sel,
                                      assignedRole:
                                        found?.roleTitle || task.assignedRole || "Team Member",
                                      assignedAvatar: initials,
                                    });
                                    showToast(`Reassigned "${task.title}" to ${sel}`);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-slate-300 bg-white font-bold text-slate-900 text-xs cursor-pointer"
                                >
                                  {!assignableDirectory.some((p) => p.name === task.assignedTo) && (
                                    <option value={task.assignedTo || "Unassigned"}>
                                      {task.assignedTo || "Unassigned"}
                                    </option>
                                  )}
                                  {assignableDirectory.map((p) => (
                                    <option key={p.name} value={p.name}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="font-bold text-slate-900 truncate text-xs">
                                  {task.assignedTo || "Unassigned"}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {task.assignedRole || "Assignee"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Duration OR Particular Date (Both Editable by Admin) */}
                        <td className="py-3 px-3 align-middle">
                          <div className="space-y-1">
                            {isAdmin ? (
                              <>
                                {/* Option 1: Fix Duration (Days) */}
                                <div
                                  className="flex items-center gap-1"
                                  title="Option 1: Fix Duration in Days"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <input
                                    type="number"
                                    min={1}
                                    max={180}
                                    value={task.allocatedDurationDays || 7}
                                    onChange={(e) => {
                                      const d = Math.max(
                                        1,
                                        Math.min(180, Number(e.target.value) || 1),
                                      );
                                      const start = task.startDate
                                        ? new Date(task.startDate)
                                        : new Date();
                                      const due = new Date(start);
                                      due.setDate(due.getDate() + d);
                                      updateActionFlowTask(task.id, {
                                        allocatedDurationDays: d,
                                        dueDate: due.toISOString().split("T")[0],
                                      });
                                    }}
                                    className="w-12 px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50/70 font-mono font-bold text-amber-950 text-xs text-center"
                                  />
                                  <span className="text-[11px] font-semibold text-amber-900">
                                    Days
                                  </span>
                                </div>
                                {/* Option 2: Fix Particular Due Date */}
                                <div
                                  className="flex items-center gap-1"
                                  title="Option 2: Fix Particular Due Date"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <input
                                    type="date"
                                    value={toIsoDateString(task.dueDate)}
                                    onChange={(e) => {
                                      const newDate = e.target.value;
                                      if (!newDate) return;
                                      const start = task.startDate
                                        ? new Date(task.startDate)
                                        : new Date();
                                      start.setHours(0, 0, 0, 0);
                                      const target = new Date(newDate);
                                      const diffDays = !isNaN(target.getTime())
                                        ? Math.max(
                                            1,
                                            Math.round(
                                              (target.getTime() - start.getTime()) /
                                                (1000 * 60 * 60 * 24),
                                            ),
                                          )
                                        : task.allocatedDurationDays || 7;
                                      updateActionFlowTask(task.id, {
                                        dueDate: newDate,
                                        allocatedDurationDays: diffDays,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50/60 font-mono font-bold text-[10.5px] text-indigo-950 cursor-pointer"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>{task.allocatedDurationDays || 7} Days</span>
                                </div>
                                <div className="text-[10.5px] text-slate-500 font-mono">
                                  {task.startDate
                                    ? task.startDate.split("-").slice(1).join("/")
                                    : "Start"}{" "}
                                  →{" "}
                                  {task.dueDate
                                    ? task.dueDate.split("-").slice(1).join("/")
                                    : "Due"}
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Column 4: Status Update (Interactive select) */}
                        <td className="py-3 px-3 align-middle">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <select
                              value={normalizedStatus}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value as ActionFlowTaskStatus)
                              }
                              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-hidden ${statusCfg.badgeCls}`}
                            >
                              <option
                                value="in_process"
                                className="bg-white text-slate-800 font-medium"
                              >
                                In Process
                              </option>
                              <option
                                value="in_time"
                                className="bg-white text-slate-800 font-medium"
                              >
                                In Time
                              </option>
                              <option
                                value="completed"
                                className="bg-white text-slate-800 font-medium"
                              >
                                Completed
                              </option>
                              <option value="stuck" className="bg-white text-slate-800 font-medium">
                                Stuck
                              </option>
                              <option
                                value="not_started"
                                className="bg-white text-slate-800 font-medium"
                              >
                                Not Started
                              </option>
                            </select>
                          </div>
                        </td>

                        {/* Column 5: Assignee Remarks */}
                        <td className="py-3 px-3.5 align-middle">
                          {isEditingRemarks ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                autoFocus
                                value={currentDraft}
                                onChange={(e) =>
                                  setRemarksDrafts((prev) => ({
                                    ...prev,
                                    [task.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveRemarks(task.id);
                                  } else if (e.key === "Escape") {
                                    handleCancelRemarks();
                                  }
                                }}
                                placeholder={
                                  isStuck
                                    ? "Assignee: Mention why task is stuck..."
                                    : "Add remarks or update notes..."
                                }
                                className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border bg-white focus:outline-hidden ${
                                  isStuck
                                    ? "border-rose-400 focus:ring-1 focus:ring-rose-500"
                                    : "border-slate-300 focus:ring-1 focus:ring-indigo-500"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRemarks(task.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs cursor-pointer transition-colors"
                                title="Save Remarks"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelRemarks}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isStuck ? (
                            <div
                              onClick={() => handleStartEditRemarks(task)}
                              className="group flex items-start justify-between gap-2 p-2 rounded-lg bg-rose-50/80 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
                              title="Click to update assignee remarks"
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  {task.stuckRemarks ? (
                                    <>
                                      <p className="text-xs font-semibold text-rose-950 leading-snug break-words">
                                        {task.stuckRemarks}
                                      </p>
                                      <div className="text-[10px] text-rose-600/80 mt-0.5">
                                        Assignee: {task.stuckRemarksAuthor || task.assignedTo}
                                        {task.stuckRemarksDate ? ` • ${task.stuckRemarksDate}` : ""}
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-xs italic text-rose-600 font-medium">
                                      Assignee: Click to mention why stuck...
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="text-rose-500 group-hover:text-rose-700 p-0.5 shrink-0"
                                title="Edit Assignee Remarks"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : task.stuckRemarks ? (
                            <div
                              onClick={() => handleStartEditRemarks(task)}
                              className="group flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Click to edit remarks"
                            >
                              <span className="text-slate-700 text-xs truncate max-w-xs">
                                {task.stuckRemarks}
                              </span>
                              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditRemarks(task)}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add remark</span>
                            </button>
                          )}
                        </td>

                        {/* Column 6: CFO Remarks */}
                        <td className="py-3 px-3.5 align-middle">
                          {isEditingCfoRemarks ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                autoFocus
                                value={currentCfoDraft}
                                onChange={(e) =>
                                  setCfoRemarksDrafts((prev) => ({
                                    ...prev,
                                    [task.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveCfoRemarks(task.id);
                                  } else if (e.key === "Escape") {
                                    handleCancelCfoRemarks();
                                  }
                                }}
                                placeholder="CFO: Directive, guidance or remarks..."
                                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-400 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCfoRemarks(task.id)}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs cursor-pointer transition-colors"
                                title="Save CFO Remarks"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelCfoRemarks}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : task.cfoRemarks ? (
                            <div
                              onClick={() => handleStartEditCfoRemarks(task)}
                              className="group flex items-start justify-between gap-2 p-2 rounded-lg bg-indigo-50/70 border border-indigo-200 hover:border-indigo-300 transition-all cursor-pointer"
                              title="Click to update CFO remarks"
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-indigo-950 leading-snug break-words">
                                    {task.cfoRemarks}
                                  </p>
                                  <div className="text-[10px] text-indigo-600/90 font-medium mt-0.5">
                                    {task.cfoRemarksAuthor || "Virtual CFO"}
                                    {task.cfoRemarksDate ? ` • ${task.cfoRemarksDate}` : ""}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="text-indigo-400 group-hover:text-indigo-600 p-0.5 shrink-0"
                                title="Edit CFO Remarks"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isStuck ? (
                            <button
                              type="button"
                              onClick={() => handleStartEditCfoRemarks(task)}
                              className="text-[11px] text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors font-medium"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>Add CFO guidance</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditCfoRemarks(task)}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add CFO remark</span>
                            </button>
                          )}
                        </td>

                        {/* Column 7: Actions */}
                        <td className="py-3 px-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            {normalizedStatus !== "completed" ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(task.id, "completed")}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(task.id, "in_process")}
                                className="p-1.5 text-emerald-600 hover:text-slate-500 rounded-lg transition-colors cursor-pointer"
                                title="Re-open Task"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleItemVisibility("action_flow", task.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    task.isHidden
                                      ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                      : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                                  }`}
                                  title={
                                    task.isHidden
                                      ? "Unhide Task (Restore to active view)"
                                      : "Hide Task (Keep for future without deleting)"
                                  }
                                >
                                  {task.isHidden ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTaskToDelete(task)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete or Hide Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Assign New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign New Task</h3>
                  <p className="text-[11px] text-slate-500">
                    Create task, set assignee, fixed duration, status &amp; remarks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reconciliation of GSTR-2B with Purchase Register"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee Person</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const found = assignableDirectory.find((p) => p.name === sel);
                      setNewAssignedTo(sel);
                      if (found) setNewAssignedRole(found.roleTitle);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    {assignableDirectory.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee Role</label>
                  <input
                    type="text"
                    value={newAssignedRole}
                    onChange={(e) => setNewAssignedRole(e.target.value)}
                    placeholder="e.g. Accounts Executive"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-[11px]">
                    Timeline: Fix Duration (Days) OR Particular Due Date
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">Auto-synced</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setNewStartDate(s);
                        const startObj = new Date(s);
                        if (!isNaN(startObj.getTime())) {
                          startObj.setDate(startObj.getDate() + (newDurationDays || 7));
                          setNewDueDate(startObj.toISOString().split("T")[0]);
                        }
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-[10.5px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 text-[10px] mb-1">
                      Option A: Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      required
                      value={newDurationDays}
                      onChange={(e) => {
                        const d = Math.max(1, Number(e.target.value) || 1);
                        setNewDurationDays(d);
                        const startObj = new Date(newStartDate);
                        if (!isNaN(startObj.getTime())) {
                          startObj.setDate(startObj.getDate() + d);
                          setNewDueDate(startObj.toISOString().split("T")[0]);
                        }
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-indigo-900 text-[10px] mb-1">
                      Option B: Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => {
                        const dueStr = e.target.value;
                        setNewDueDate(dueStr);
                        const startObj = new Date(newStartDate);
                        const dueObj = new Date(dueStr);
                        if (!isNaN(startObj.getTime()) && !isNaN(dueObj.getTime())) {
                          const diff = Math.max(
                            1,
                            Math.round(
                              (dueObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24),
                            ),
                          );
                          setNewDurationDays(diff);
                        }
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-indigo-300 bg-white font-mono text-[10.5px] font-bold text-indigo-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newInitialStatus}
                    onChange={(e) => setNewInitialStatus(e.target.value as ActionFlowTaskStatus)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="in_process">In Process</option>
                    <option value="in_time">In Time</option>
                    <option value="completed">Completed</option>
                    <option value="stuck">Stuck</option>
                    <option value="not_started">Not Started</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ActionFlowTaskPriority)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Urgent">Urgent Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              {normalizeStatus(newInitialStatus) === "stuck" && (
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <label className="block font-bold text-rose-800 mb-1">
                    Assignee Stuck Remarks
                  </label>
                  <input
                    type="text"
                    value={newInitialRemarks}
                    onChange={(e) => setNewInitialRemarks(e.target.value)}
                    placeholder="Mention reasons/impediments why task is stuck..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs"
                  />
                </div>
              )}

              <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200">
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>CFO Remarks / Directive (Optional)</span>
                </label>
                <input
                  type="text"
                  value={newInitialCfoRemarks}
                  onChange={(e) => setNewInitialCfoRemarks(e.target.value)}
                  placeholder="e.g. Prioritize MSME vendors with active 45-day window..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDestructiveDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Delete or Hide Assigned Task"
        description={
          taskToDelete
            ? `Instead of permanently deleting "${taskToDelete.title}", you can click "Hide Instead" to keep it archived for future use.`
            : ""
        }
        confirmLabel="Delete Permanently"
        onHideInstead={
          taskToDelete
            ? () => {
                toggleItemVisibility("action_flow", taskToDelete.id, taskToDelete.companyId, true);
                setTaskToDelete(null);
              }
            : undefined
        }
        onConfirm={() => {
          if (taskToDelete) {
            deleteActionFlowTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
};
