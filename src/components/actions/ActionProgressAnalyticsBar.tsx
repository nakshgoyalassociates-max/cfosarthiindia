import React from "react";
import { ActionItem } from "../../types";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface ActionProgressAnalyticsBarProps {
  actions: ActionItem[];
  theme?: "light" | "dark";
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export const ActionProgressAnalyticsBar: React.FC<ActionProgressAnalyticsBarProps> = ({
  actions,
  theme = "light",
  selectedStatus,
  onSelectStatus,
}) => {
  const isDark = theme === "dark";
  const safeActions = actions || [];
  const totalActions = safeActions.length;

  if (totalActions === 0) return null;

  const now = new Date();

  // Metrics calculation
  let totalProgressSum = 0;
  let onTrackCount = 0;
  let checkInDueCount = 0;
  let overdueOrBreachedCount = 0;
  let completedCount = 0;

  // Distribution bins
  let binNotStarted = 0; // 0%
  let binEarly = 0; // 1-35%
  let binMid = 0; // 36-75%
  let binLate = 0; // 76-99%
  let binDone = 0; // 100%

  safeActions.forEach((act) => {
    const progress = Math.max(
      0,
      Math.min(100, act.progressPercentage ?? (act.status === "Completed" ? 100 : 0)),
    );
    totalProgressSum += progress;

    const duration = act.durationDays || 5;
    const cadence = act.checkInCadenceDays || 2;
    const startDate = new Date(act.decidedDate || act.createdAt);
    const diffTime = Math.max(
      0,
      now.getTime() - (isNaN(startDate.getTime()) ? now.getTime() : startDate.getTime()),
    );
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const lastUpdateDate = act.lastProgressUpdateDate ? new Date(act.lastProgressUpdateDate) : null;
    const daysSinceLastUpdate =
      lastUpdateDate && !isNaN(lastUpdateDate.getTime())
        ? Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
        : daysElapsed;

    const isCompleted = act.status === "Completed" || progress >= 100;
    const isOverdue =
      !isCompleted &&
      (daysElapsed > duration || new Date(act.fixedDeadline).getTime() < now.getTime());
    const isCheckInDue = !isCompleted && !isOverdue && daysSinceLastUpdate >= cadence;

    if (isCompleted) {
      completedCount++;
      binDone++;
    } else {
      if (progress === 0) binNotStarted++;
      else if (progress <= 35) binEarly++;
      else if (progress <= 75) binMid++;
      else binLate++;

      if (isOverdue) {
        overdueOrBreachedCount++;
      } else if (isCheckInDue) {
        checkInDueCount++;
      } else {
        onTrackCount++;
      }
    }
  });

  const avgProgress = Math.round(totalProgressSum / totalActions);

  // SVG circular gauge math
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgProgress / 100) * circumference;

  return (
    <div
      className={
        isDark
          ? "w-full space-y-4"
          : "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs mb-5 space-y-4"
      }
    >
      {/* Top Banner: Graphical Metrics & Circular Gauge */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Circular Overall Progress Gauge */}
        <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={isDark ? "#818cf8" : "#4f46e5"}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span
              className={`absolute text-sm font-extrabold font-mono ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {avgProgress}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Action Turnaround & Progress Flow
              </h3>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isDark
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-indigo-50 text-indigo-700"
                }`}
              >
                Live Pace
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Target completion durations decided with 2-day assignee check-in cadence
            </p>
          </div>
        </div>

        {/* Right: 4 Pacing & Status Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
          {/* On Track */}
          <div
            onClick={() => onSelectStatus?.("NOT_DUE")}
            className={`p-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              onSelectStatus ? "cursor-pointer" : ""
            } ${
              isDark
                ? selectedStatus === "NOT_DUE"
                  ? "bg-slate-800 ring-2 ring-emerald-400/80 border-emerald-400 shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60"
                : "bg-emerald-50/70 border-emerald-200/80"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDark
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`text-base font-extrabold font-mono block leading-tight ${
                  isDark ? "text-white" : "text-emerald-900"
                }`}
              >
                {onTrackCount}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                On Track
              </span>
            </div>
          </div>

          {/* 2-Day Check-in Due */}
          <div
            onClick={() => onSelectStatus?.("IN_PROGRESS")}
            className={`p-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              onSelectStatus ? "cursor-pointer" : ""
            } ${
              isDark
                ? selectedStatus === "IN_PROGRESS"
                  ? "bg-slate-800 ring-2 ring-amber-400/80 border-amber-400 shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60"
                : "bg-amber-50/70 border-amber-200/80"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDark
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`text-base font-extrabold font-mono block leading-tight ${
                  isDark ? "text-white" : "text-amber-900"
                }`}
              >
                {checkInDueCount}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isDark ? "text-amber-300" : "text-amber-800"
                }`}
              >
                Update Due (2d)
              </span>
            </div>
          </div>

          {/* Breached / Overdue */}
          <div
            onClick={() => onSelectStatus?.("OVERDUE")}
            className={`p-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              onSelectStatus ? "cursor-pointer" : ""
            } ${
              isDark
                ? selectedStatus === "OVERDUE"
                  ? "bg-slate-800 ring-2 ring-rose-400/80 border-rose-400 shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60"
                : "bg-rose-50/70 border-rose-200/80"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDark
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`text-base font-extrabold font-mono block leading-tight ${
                  isDark ? "text-rose-400" : "text-rose-900"
                }`}
              >
                {overdueOrBreachedCount}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isDark ? "text-rose-300" : "text-rose-700"
                }`}
              >
                Overdue / Breached
              </span>
            </div>
          </div>

          {/* Fully Completed */}
          <div
            onClick={() => onSelectStatus?.("COMPLETED")}
            className={`p-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              onSelectStatus ? "cursor-pointer" : ""
            } ${
              isDark
                ? selectedStatus === "COMPLETED"
                  ? "bg-slate-800 ring-2 ring-slate-400/80 border-slate-400 shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60"
                : "bg-slate-100/80 border-slate-200/90"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDark
                  ? "bg-slate-700/60 text-slate-300 border border-slate-600/60"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span
                className={`text-base font-extrabold font-mono block leading-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {completedCount}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Completed (100%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Stepped Progress Distribution Bar */}
      <div
        className={`pt-3 border-t space-y-1.5 ${isDark ? "border-slate-800" : "border-slate-100"}`}
      >
        <div
          className={`flex items-center justify-between text-[11px] ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            Action Progress Distribution
          </span>
          <span className={`font-mono text-[10px] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            {totalActions} Total Decided Actions
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div
          className={`w-full h-3 rounded-full overflow-hidden flex p-0.5 gap-0.5 border ${
            isDark ? "bg-slate-800 border-slate-700/80" : "bg-slate-100 border-slate-200/60"
          }`}
        >
          {binNotStarted > 0 && (
            <div
              style={{ width: `${(binNotStarted / totalActions) * 100}%` }}
              className={`${isDark ? "bg-slate-600" : "bg-slate-300"} rounded-full h-full`}
              title={`Not Started (0%): ${binNotStarted} actions`}
            />
          )}
          {binEarly > 0 && (
            <div
              style={{ width: `${(binEarly / totalActions) * 100}%` }}
              className="bg-amber-400 rounded-full h-full"
              title={`Early Stage (1-35%): ${binEarly} actions`}
            />
          )}
          {binMid > 0 && (
            <div
              style={{ width: `${(binMid / totalActions) * 100}%` }}
              className="bg-blue-500 rounded-full h-full"
              title={`Underway (36-75%): ${binMid} actions`}
            />
          )}
          {binLate > 0 && (
            <div
              style={{ width: `${(binLate / totalActions) * 100}%` }}
              className="bg-indigo-500 rounded-full h-full"
              title={`Final Stretch (76-99%): ${binLate} actions`}
            />
          )}
          {binDone > 0 && (
            <div
              style={{ width: `${(binDone / totalActions) * 100}%` }}
              className="bg-emerald-500 rounded-full h-full"
              title={`Completed (100%): ${binDone} actions`}
            />
          )}
        </div>

        {/* Legend */}
        <div
          className={`flex flex-wrap items-center gap-4 text-[10px] pt-0.5 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-600" : "bg-slate-300"}`} />
            <span>0% Not Started ({binNotStarted})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>1-35% Early Stage ({binEarly})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>36-75% Underway ({binMid})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>76-99% Final Stage ({binLate})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>100% Completed ({binDone})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
