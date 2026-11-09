import React, { useState, useMemo } from "react";
import { ActionFlowTask, ActionFlowMilestone } from "../../types";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";

interface ActionFlowGanttChartProps {
  tasks: ActionFlowTask[];
  onSelectTask: (task: ActionFlowTask) => void;
  onOpenReportChallenge?: (taskId: string) => void;
}

export const ActionFlowGanttChart: React.FC<ActionFlowGanttChartProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [scaleMode, setScaleMode] = useState<"14d" | "30d" | "60d">("30d");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split("T")[0], [today]);

  const { minDate, totalDays, datesList } = useMemo(() => {
    let minMs = today.getTime() - 3 * 86400000;
    const spanDays = scaleMode === "14d" ? 16 : scaleMode === "30d" ? 32 : 62;

    tasks.forEach((t) => {
      const s = new Date(t.startDate).getTime();
      if (!isNaN(s) && s < minMs) minMs = s;
    });

    const startDateObj = new Date(minMs);
    startDateObj.setHours(0, 0, 0, 0);

    const list: string[] = [];
    for (let i = 0; i < spanDays; i++) {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().split("T")[0]);
    }

    return {
      minDate: list[0],
      totalDays: spanDays,
      datesList: list,
    };
  }, [tasks, today, scaleMode]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          t.taskCode.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const getTimelinePosition = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    const startMs = new Date(minDate).getTime();
    const totalMs = totalDays * 86400000;
    const diff = d - startMs;
    const pct = (diff / totalMs) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const getTaskBarCoords = (task: ActionFlowTask) => {
    const left = getTimelinePosition(task.startDate);
    const right = getTimelinePosition(task.dueDate);
    const width = Math.max(3, right - left);
    return { left, width };
  };

  const todayPosition = getTimelinePosition(todayStr);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col text-xs">
      {/* Compact Controls Toolbar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-700" />
          <span className="font-bold text-slate-900">Timeline</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
            {filteredTasks.length} tasks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="text-xs pl-6 pr-2 py-0.5 rounded border border-slate-300 bg-white text-slate-800 w-28 sm:w-36 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-0.5 px-1.5 rounded border border-slate-300 bg-white text-slate-800"
          >
            <option value="ALL">All</option>
            <option value="stuck_blocked">⚠️ Stuck</option>
            <option value="in_progress">Active</option>
            <option value="completed">Done</option>
          </select>

          <div className="flex items-center bg-slate-200 rounded p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setScaleMode("14d")}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                scaleMode === "14d" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
              }`}
            >
              14d
            </button>
            <button
              type="button"
              onClick={() => setScaleMode("30d")}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                scaleMode === "30d" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
              }`}
            >
              30d
            </button>
            <button
              type="button"
              onClick={() => setScaleMode("60d")}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                scaleMode === "60d" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
              }`}
            >
              60d
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-600 select-none">
            <div className="w-60 shrink-0 px-3 py-1.5 border-r border-slate-200 font-bold text-slate-800 flex items-center justify-between">
              <span>Task / Assignee</span>
              <span className="text-[10px] text-slate-500 font-normal">Allocated</span>
            </div>

            <div className="flex-1 relative flex">
              {datesList.map((dStr, idx) => {
                const dateObj = new Date(dStr);
                const isToday = dStr === todayStr;
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                const dayNum = dateObj.getDate();
                const monthShort = dateObj.toLocaleDateString("en-GB", { month: "short" });

                return (
                  <div
                    key={dStr}
                    style={{ width: `${100 / totalDays}%` }}
                    className={`text-center py-1 border-r border-slate-200 text-[10px] shrink-0 ${
                      isToday
                        ? "bg-rose-100/90 text-rose-900 font-bold ring-1 ring-rose-400"
                        : isWeekend
                          ? "bg-slate-200/40 text-slate-400"
                          : "text-slate-600"
                    }`}
                  >
                    <span className="block font-bold leading-tight">{dayNum}</span>
                    <span className="block text-[8px] uppercase tracking-tighter leading-tight">
                      {idx === 0 || dayNum === 1
                        ? monthShort
                        : dateObj.toLocaleDateString("en-GB", { weekday: "narrow" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-black relative">
            {todayPosition >= 0 && todayPosition <= 100 && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: `calc(15rem + (100% - 15rem) * ${todayPosition / 100})` }}
              >
                <div className="px-1 py-0.2 rounded-b text-[8px] font-bold bg-rose-600 text-white shadow-2xs">
                  TODAY
                </div>
                <div className="w-0.5 flex-1 bg-rose-500/80 border-r border-rose-300 border-dashed" />
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No tasks found.</div>
            ) : (
              filteredTasks.map((task) => {
                const coords = getTaskBarCoords(task);
                const isStuck = task.status === "stuck_blocked";
                const isDone = task.status === "completed";

                return (
                  <div
                    key={task.id}
                    className="flex hover:bg-slate-50/80 transition-colors group relative border-b border-black last:border-b-0"
                  >
                    {/* Left meta */}
                    <div className="w-60 shrink-0 px-3 py-1.5 border-r border-slate-200 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {task.taskCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className="font-bold text-xs text-slate-900 hover:text-indigo-600 truncate text-left transition-colors cursor-pointer flex-1"
                          title={task.title}
                        >
                          {task.title}
                        </button>
                        {isStuck ? (
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0 animate-pulse">
                            Stuck
                          </span>
                        ) : (
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                              isDone
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {task.progressPercentage}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1 truncate">
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                            {task.assignedAvatar || "AS"}
                          </div>
                          <span className="truncate">{task.assignedTo}</span>
                        </div>
                        <span className="font-semibold text-slate-700 shrink-0">
                          {task.allocatedDurationDays}d
                        </span>
                      </div>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative flex items-center h-9 overflow-hidden">
                      <div className="absolute inset-0 flex pointer-events-none">
                        {datesList.map((dStr) => {
                          const dateObj = new Date(dStr);
                          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                          return (
                            <div
                              key={dStr}
                              style={{ width: `${100 / totalDays}%` }}
                              className={`h-full border-r border-slate-100 shrink-0 ${
                                isWeekend ? "bg-slate-50/50" : ""
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div
                        onClick={() => onSelectTask(task)}
                        style={{
                          left: `${coords.left}%`,
                          width: `${coords.width}%`,
                        }}
                        className={`absolute h-5 rounded shadow-2xs cursor-pointer transition-all hover:scale-y-110 flex items-center overflow-hidden border ${
                          isDone
                            ? "bg-emerald-600/90 border-emerald-700 text-white"
                            : isStuck
                              ? "bg-amber-500 border-amber-600 text-white animate-pulse"
                              : "bg-slate-800 border-slate-900 text-white"
                        }`}
                      >
                        <div
                          className={`h-full absolute top-0 left-0 transition-all ${
                            isDone ? "bg-emerald-500" : isStuck ? "bg-amber-600" : "bg-indigo-600"
                          }`}
                          style={{ width: `${task.progressPercentage}%` }}
                        />

                        <div className="relative z-10 px-1.5 flex items-center justify-between w-full text-[9px] font-bold truncate">
                          <span className="truncate flex items-center gap-1">
                            {isStuck ? (
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-100 shrink-0" />
                            ) : isDone ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-100 shrink-0" />
                            ) : null}
                            <span className="truncate">{task.title}</span>
                          </span>
                          <span className="shrink-0 opacity-90 pl-1 font-mono">
                            {task.allocatedDurationDays}d
                          </span>
                        </div>
                      </div>

                      {/* Milestone points */}
                      {(task.milestones || []).map((ms, msIdx) => {
                        const msPos = getTimelinePosition(ms.dueDate);
                        const isMsDone = ms.status === "completed";
                        return (
                          <div
                            key={ms.id || msIdx}
                            style={{ left: `${msPos}%` }}
                            className="absolute z-10 -ml-1 flex flex-col items-center group/ms pointer-events-auto"
                            title={`${ms.title} (Due: ${ms.dueDate})`}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTask(task);
                              }}
                              className={`w-2.5 h-2.5 rotate-45 border shadow-2xs cursor-pointer transition-transform hover:scale-125 ${
                                isMsDone
                                  ? "bg-emerald-500 border-white"
                                  : ms.status === "blocked"
                                    ? "bg-rose-500 border-white"
                                    : "bg-white border-slate-800"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-slate-800 inline-block" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-500 inline-block" /> Stuck
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-600 inline-block" /> Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rotate-45 bg-emerald-500 border border-slate-700 inline-block" />{" "}
            Milestone
          </span>
        </div>
        <span>Click task to open CFO discussion</span>
      </div>
    </div>
  );
};
