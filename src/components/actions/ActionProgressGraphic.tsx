import React from "react";
import { ActionItem } from "../../types";
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, User, Calendar } from "lucide-react";

interface ActionProgressGraphicProps {
  action: ActionItem;
  compact?: boolean;
  onOpenUpdateModal?: (action: ActionItem) => void;
}

export const ActionProgressGraphic: React.FC<ActionProgressGraphicProps> = ({
  action,
  compact = false,
  onOpenUpdateModal,
}) => {
  const progress = Math.max(
    0,
    Math.min(100, action.progressPercentage ?? (action.status === "Completed" ? 100 : 0)),
  );
  const duration = action.durationDays || 5;
  const cadence = action.checkInCadenceDays || 2;

  // Calculate days elapsed from decidedDate or createdAt
  const startDateStr = action.decidedDate || action.createdAt;
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.max(
    0,
    now.getTime() - (isNaN(startDate.getTime()) ? now.getTime() : startDate.getTime()),
  );
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeElapsedPct = Math.min(100, Math.round((daysElapsed / duration) * 100));

  // Determine cadence / update freshness (e.g. 2 days check-in)
  const lastUpdateDate = action.lastProgressUpdateDate
    ? new Date(action.lastProgressUpdateDate)
    : null;
  const daysSinceLastUpdate =
    lastUpdateDate && !isNaN(lastUpdateDate.getTime())
      ? Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
      : daysElapsed;
  const isCheckInDue = progress < 100 && daysSinceLastUpdate >= cadence;

  // Pace status determination
  const isCompleted = action.status === "Completed" || progress >= 100;
  const isOverdue = !isCompleted && daysElapsed > duration;
  const isAhead = !isCompleted && !isOverdue && progress > timeElapsedPct + 10;
  const isBehind = !isCompleted && !isOverdue && timeElapsedPct > progress + 15;

  let paceColor = "bg-blue-50 text-blue-700 border-blue-200";
  let paceText = "On Track";
  let paceIcon = <TrendingUp className="w-3 h-3 text-blue-600" />;

  if (isCompleted) {
    paceColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    paceText = "100% Completed";
    paceIcon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
  } else if (isOverdue) {
    paceColor = "bg-rose-50 text-rose-700 border-rose-200";
    paceText = `Exceeded Duration (+${daysElapsed - duration}d)`;
    paceIcon = <AlertTriangle className="w-3 h-3 text-rose-600" />;
  } else if (isCheckInDue) {
    paceColor = "bg-amber-50 text-amber-800 border-amber-200";
    paceText = `${cadence}-Day Check-in Due`;
    paceIcon = <Clock className="w-3 h-3 text-amber-600" />;
  } else if (isAhead) {
    paceColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    paceText = "Ahead of Schedule";
    paceIcon = <TrendingUp className="w-3 h-3 text-emerald-600" />;
  } else if (isBehind) {
    paceColor = "bg-amber-50 text-amber-700 border-amber-200";
    paceText = "Pacing Behind Target";
    paceIcon = <Clock className="w-3 h-3 text-amber-600" />;
  }

  // Progress Bar fill color
  let progressFillGradient = "bg-gradient-to-r from-blue-600 to-indigo-600";
  if (isCompleted) {
    progressFillGradient = "bg-gradient-to-r from-emerald-500 to-teal-500";
  } else if (isOverdue) {
    progressFillGradient = "bg-gradient-to-r from-rose-500 to-red-600";
  } else if (isCheckInDue || isBehind) {
    progressFillGradient = "bg-gradient-to-r from-amber-500 to-amber-600";
  }

  const latestUpdate =
    action.progressUpdates && action.progressUpdates.length > 0 ? action.progressUpdates[0] : null;

  if (compact) {
    return (
      <div className="flex flex-col gap-1 w-full min-w-[140px] max-w-[200px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold font-mono text-slate-800 flex items-center gap-1">
            {progress}%
          </span>
          <span
            className={`text-[9.5px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${paceColor}`}
          >
            {paceIcon}
            <span className="truncate max-w-[90px]">{paceText}</span>
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/70 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressFillGradient}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
          <span>
            Day {Math.min(daysElapsed, duration)} of {duration}d
          </span>
          {onOpenUpdateModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenUpdateModal(action);
              }}
              className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-semibold"
            >
              + Log %
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
      {/* Top Header: Percentage & Duration Pace Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold font-mono text-slate-900 tracking-tight">
            {progress}%
          </span>
          <span className="text-[11px] font-medium text-slate-500">completed</span>
        </div>

        <div
          className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 shrink-0 ${paceColor}`}
        >
          {paceIcon}
          <span>{paceText}</span>
        </div>
      </div>

      {/* Visual Progress Bar with milestones */}
      <div className="space-y-1">
        <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden border border-slate-300/40 relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressFillGradient}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Milestone Scale markers */}
        <div className="flex justify-between text-[9px] font-mono text-slate-600 px-0.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Duration & Time Elapsed comparison indicator */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
        <div className="flex items-center gap-1 text-slate-600">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            Duration: <strong className="text-slate-800">{duration} Days</strong>
          </span>
        </div>
        <div className="flex items-center justify-end gap-1 text-slate-600">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            Elapsed:{" "}
            <strong className="text-slate-800">
              {daysElapsed}d ({timeElapsedPct}%)
            </strong>
          </span>
        </div>
      </div>

      {/* Latest Assignee Progress Log Note */}
      {latestUpdate ? (
        <div className="bg-white p-2 rounded-lg border border-slate-200/70 text-[11px] text-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <User className="w-2.5 h-2.5 text-indigo-500" />
              {latestUpdate.updatedBy}
            </span>
            <span className="font-mono text-slate-600">{latestUpdate.date}</span>
          </div>
          <p className="line-clamp-2 text-slate-600 italic">"{latestUpdate.notes}"</p>
        </div>
      ) : (
        <div className="text-[10.5px] text-slate-600 italic flex items-center justify-between">
          <span>Cadence: Assignee updates every {cadence} days</span>
          {onOpenUpdateModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenUpdateModal(action);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              + Log First Update
            </button>
          )}
        </div>
      )}

      {/* Quick Action Button */}
      {onOpenUpdateModal && latestUpdate && (
        <div className="pt-0.5 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenUpdateModal(action);
            }}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Update Progress</span>
            <span className="text-[10px] font-mono">({cadence}d cadence)</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};
