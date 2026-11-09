import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { ActionFlowTask, ActionFlowTaskPriority } from "../../types";
import { ActionFlowGanttChart } from "./ActionFlowGanttChart";
import { ActionFlowChallengeDrawer } from "./ActionFlowChallengeDrawer";
import { NewActionFlowTaskModal } from "./NewActionFlowTaskModal";
import { ReportChallengeModal } from "./ReportChallengeModal";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckSquare,
  Sparkles,
  BarChart2,
  ListFilter,
  Eye,
  EyeOff,
} from "lucide-react";

export const ActionFlowTab: React.FC = () => {
  const { role, actionFlowTasks, rawActionFlowTasks, toggleItemVisibility, toggleMilestoneStatus } =
    useApp();

  const [showHidden, setShowHidden] = useState<boolean>(false);
  const hiddenTasksCount = useMemo(
    () => (rawActionFlowTasks || []).filter((t) => t.isHidden).length,
    [rawActionFlowTasks],
  );
  const activeTasksSource = useMemo(
    () => (showHidden && role === "cfo" ? rawActionFlowTasks || actionFlowTasks : actionFlowTasks),
    [showHidden, role, rawActionFlowTasks, actionFlowTasks],
  );

  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<ActionFlowTask | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isReportChallengeModalOpen, setIsReportChallengeModalOpen] = useState<boolean>(false);
  const [reportingTaskId, setReportingTaskId] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isGanttCollapsed, setIsGanttCollapsed] = useState<boolean>(false);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  // Distinct assignees
  const distinctAssignees = useMemo(() => {
    const set = new Set<string>();
    actionFlowTasks.forEach((t) => {
      if (t.assignedTo) set.add(t.assignedTo);
    });
    return Array.from(set);
  }, [actionFlowTasks]);

  // Filtered tasks for both Gantt and List
  const filteredTasks = useMemo(() => {
    return activeTasksSource.filter((t) => {
      if (assigneeFilter !== "ALL" && t.assignedTo !== assigneeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          t.taskCode.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeTasksSource, assigneeFilter, searchQuery]);

  // Stuck tasks with open challenges
  const stuckTasks = useMemo(() => {
    return actionFlowTasks.filter((t) => {
      const hasOpen = (t.challenges || []).some((c) => c.status !== "resolved");
      return t.status === "stuck_blocked" || hasOpen;
    });
  }, [actionFlowTasks]);

  // Statistics
  const totalTasks = actionFlowTasks.length;
  const stuckCount = stuckTasks.length;
  const inProgressCount = actionFlowTasks.filter((t) => t.status === "in_progress").length;
  const completedCount = actionFlowTasks.filter((t) => t.status === "completed").length;

  const handleOpenReportModal = (taskId: string) => {
    setReportingTaskId(taskId);
    setIsReportChallengeModalOpen(true);
  };

  const getPriorityBadge = (priority: ActionFlowTaskPriority) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Medium":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const target = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / 86400000);
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    if (diffDays === 0) return { label: "Due today", isOverdue: false };
    return { label: `${diffDays}d left`, isOverdue: false };
  };

  return (
    <div className="space-y-3">
      {/* 1. Sleek Compact Header & Metrics Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title + Inline Counts */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 mr-1">
            <CheckSquare className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Action Flow</h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Total: <strong>{totalTasks}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Active: <strong>{inProgressCount}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-xs border flex items-center gap-1 ${
                stuckCount > 0
                  ? "bg-rose-50 text-rose-700 border-rose-300"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Stuck: {stuckCount}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Done: <strong>{completedCount}</strong>
            </span>
          </div>
        </div>

        {/* Right: Search, Filter & Assign Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="text-xs pl-6 pr-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 w-28 sm:w-36 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="ALL">All Assignees</option>
            {distinctAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {role === "cfo" && (
            <button
              type="button"
              onClick={() => setShowHidden(!showHidden)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showHidden
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
              title="Show or hide archived/hidden action flow tasks"
            >
              {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>
                {showHidden ? "Showing Hidden" : "Hidden"} ({hiddenTasksCount})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {/* Gantt Chart Timeline (On Same Page) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <BarChart2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Gantt Timeline Horizon</span>
          </div>
          <button
            type="button"
            onClick={() => setIsGanttCollapsed(!isGanttCollapsed)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
          >
            {isGanttCollapsed ? (
              <>
                <span>Expand Gantt</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Collapse Gantt</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {!isGanttCollapsed && (
          <ActionFlowGanttChart
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTaskForDrawer(task)}
            onOpenReportChallenge={handleOpenReportModal}
          />
        )}
      </div>

      {/* 4. All Tasks & Milestones List (On Same Page) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ListFilter className="w-3.5 h-3.5 text-slate-600" />
            <span>All Allocated Tasks & Deliverables ({filteredTasks.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click task or chevron to manage sub-milestones
          </span>
        </div>

        <div className="bg-white rounded-xl border border-black overflow-hidden shadow-2xs">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-700">No deliverable tasks found</p>
              <p className="text-slate-400 mt-0.5">Adjust filters or assign a new task.</p>
            </div>
          ) : (
            <div className="divide-y divide-black">
              {filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const isStuck = task.status === "stuck_blocked";
                const isDone = task.status === "completed";
                const milestones = task.milestones || [];
                const completedMs = milestones.filter((m) => m.status === "completed").length;
                const openChallenges = (task.challenges || []).filter(
                  (c) => c.status !== "resolved",
                );
                const daysRemaining = getDaysRemaining(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className={`border-b border-black last:border-b-0 transition-colors ${
                      isStuck ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Compact Primary Row */}
                    <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      {/* Left: Code, Title, Category, Priority */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {task.taskCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getPriorityBadge(
                              task.priority,
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium truncate">
                            {task.category}
                          </span>
                          {task.isHidden && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                              <EyeOff className="w-2.5 h-2.5" />
                              HIDDEN
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(task.id)}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 transition-colors text-left truncate cursor-pointer"
                            title={task.title}
                          >
                            {task.title}
                          </button>
                        </div>
                      </div>

                      {/* Middle: Assignee + Duration Horizon */}
                      <div className="flex items-center gap-4 text-xs shrink-0">
                        {/* Assignee */}
                        <div className="flex items-center gap-1.5 w-36 truncate">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            {task.assignedAvatar || "AS"}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate leading-tight">
                              {task.assignedTo}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate leading-tight">
                              {task.assignedRole || "Assignee"}
                            </span>
                          </div>
                        </div>

                        {/* Duration & Due Date */}
                        <div className="w-32 text-right">
                          <div className="flex items-center justify-end gap-1 font-semibold text-slate-800 leading-tight">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{task.allocatedDurationDays}d duration</span>
                          </div>
                          <span
                            className={`text-[10px] block leading-tight font-medium ${
                              daysRemaining.isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                            }`}
                          >
                            Due {task.dueDate} ({daysRemaining.label})
                          </span>
                        </div>

                        {/* Progress Bar & Milestones */}
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="font-bold text-slate-700">
                              {task.progressPercentage}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {completedMs}/{milestones.length} ms
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isDone ? "bg-emerald-600" : isStuck ? "bg-amber-500" : "bg-blue-600"
                              }`}
                              style={{ width: `${task.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Blocker/CFO Status & Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 justify-end">
                        {isStuck ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForDrawer(task)}
                            className="px-2 py-1 text-[11px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Stuck ({openChallenges.length})</span>
                          </button>
                        ) : openChallenges.length === 0 && (task.cfoDirectives || []).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForDrawer(task)}
                            className="px-2 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>CFO Directive</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(task.id)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
                          >
                            + Blocker
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedTaskForDrawer(task)}
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>CFO Desk</span>
                        </button>

                        {role === "cfo" && (
                          <button
                            type="button"
                            onClick={() => toggleItemVisibility("action_flow", task.id)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                              task.isHidden
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                            }`}
                            title={
                              task.isHidden
                                ? "Unhide Assigned Task"
                                : "Hide Assigned Task (No deletion)"
                            }
                          >
                            {task.isHidden ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Unhide</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hide</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpand(task.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded"
                          title={isExpanded ? "Collapse milestones" : "Expand milestones"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline Expandable Milestones Sub-List */}
                    {isExpanded && (
                      <div className="px-6 py-2.5 bg-slate-50/80 border-t border-black text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <span>Milestones & Deliverable Stages ({milestones.length})</span>
                          <span className="font-normal text-slate-500 lowercase">
                            click checkbox to mark milestone completed
                          </span>
                        </div>

                        <div className="divide-y divide-black bg-white rounded-lg border border-black overflow-hidden">
                          {milestones.length === 0 ? (
                            <div className="p-2 text-center text-slate-400 text-[11px]">
                              No sub-milestones defined for this task.
                            </div>
                          ) : (
                            milestones.map((ms) => {
                              const isMsDone = ms.status === "completed";
                              return (
                                <div
                                  key={ms.id}
                                  className="px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 border-b border-black last:border-b-0"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleMilestoneStatus(task.id, ms.id)}
                                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                                        isMsDone
                                          ? "bg-emerald-600 border-emerald-600 text-white"
                                          : "border-slate-300 bg-white hover:border-slate-400"
                                      }`}
                                    >
                                      {isMsDone && <CheckCircle2 className="w-3 h-3" />}
                                    </button>

                                    <span
                                      className={`truncate text-xs ${
                                        isMsDone
                                          ? "line-through text-slate-400"
                                          : "font-medium text-slate-800"
                                      }`}
                                    >
                                      Stage {ms.milestoneNumber}: {ms.title}
                                    </span>

                                    {ms.deliverableName && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 shrink-0">
                                        📎 {ms.deliverableName}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                                    <span>Target: {ms.dueDate}</span>
                                    {ms.completedDate && (
                                      <span className="text-emerald-600 font-semibold">
                                        Done {ms.completedDate}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Challenge & CFO Support Drawer */}
      <ActionFlowChallengeDrawer
        task={selectedTaskForDrawer}
        isOpen={!!selectedTaskForDrawer}
        onClose={() => setSelectedTaskForDrawer(null)}
        onOpenReportChallenge={handleOpenReportModal}
      />

      {/* Modal to Report a Challenge / Stuck Issue */}
      <ReportChallengeModal
        taskId={reportingTaskId}
        isOpen={isReportChallengeModalOpen}
        onClose={() => {
          setIsReportChallengeModalOpen(false);
          setReportingTaskId(null);
        }}
      />

      {/* Modal to Assign New Task with Duration */}
      <NewActionFlowTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </div>
  );
};
