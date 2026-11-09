import React from "react";
import { ActionItem } from "../../types";
import { getActionFourColorStatus, getActionStuckInfo } from "../../utils/statusColors";
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ActionSubtaskProgressIconsProps {
  action: ActionItem;
  compact?: boolean;
}

export const ActionSubtaskProgressIcons: React.FC<ActionSubtaskProgressIconsProps> = ({
  action,
  compact = false,
}) => {
  const status = getActionFourColorStatus(action);
  const stuckInfo = getActionStuckInfo(action);

  const progress = Math.max(
    0,
    Math.min(100, action.progressPercentage ?? (action.status === "Completed" ? 100 : 0)),
  );
  const duration = action.durationDays || 5;
  const cadence = action.checkInCadenceDays || 2;

  // Calculate elapsed time from decidedDate or createdAt
  const startDate = new Date(action.decidedDate || action.createdAt);
  const now = new Date();
  const diffTime = Math.max(
    0,
    now.getTime() - (isNaN(startDate.getTime()) ? now.getTime() : startDate.getTime()),
  );
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeElapsedPct = Math.min(100, Math.round((daysElapsed / duration) * 100));

  // Determine check-in freshness (e.g. 2 days check-in)
  const lastUpdateDate = action.lastProgressUpdateDate
    ? new Date(action.lastProgressUpdateDate)
    : null;
  const daysSinceLastUpdate =
    lastUpdateDate && !isNaN(lastUpdateDate.getTime())
      ? Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
      : daysElapsed;
  const isCheckInDue = progress < 100 && daysSinceLastUpdate >= cadence;

  const isCompleted = status === "completed" || progress >= 100;
  const isOverdue = status === "overdue" || (!isCompleted && daysElapsed > duration);

  let progressColor = "bg-gradient-to-r from-blue-600 to-indigo-600";
  let paceBadge = (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium flex items-center gap-0.5">
      <TrendingUp className="w-2.5 h-2.5" />
      <span>On Track</span>
    </span>
  );

  if (isCompleted) {
    progressColor = "bg-gradient-to-r from-emerald-500 to-teal-500";
    paceBadge = (
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium flex items-center gap-0.5">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>100% Done</span>
      </span>
    );
  } else if (isOverdue) {
    progressColor = "bg-gradient-to-r from-rose-500 to-red-600";
    paceBadge = (
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium flex items-center gap-0.5">
        <AlertTriangle className="w-2.5 h-2.5" />
        <span>Overdue</span>
      </span>
    );
  } else if (isCheckInDue) {
    progressColor = "bg-gradient-to-r from-amber-500 to-amber-600";
    paceBadge = (
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium flex items-center gap-0.5">
        <Clock className="w-2.5 h-2.5" />
        <span>{cadence}d Update Due</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full max-w-[280px]" onClick={(e) => e.stopPropagation()}>
      {/* Top Header: Progress percentage + Duration Pace Badge */}
      <div className="flex items-center justify-between gap-1.5 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="font-extrabold font-mono text-slate-900 text-xs">{progress}%</span>
          <span className="text-[9px] text-slate-600">
            ({daysElapsed}d of {duration}d)
          </span>
        </div>
        {paceBadge}
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Operational Bottleneck / Assignee Note */}
      <div className="text-[10px] leading-tight font-normal text-slate-600 flex items-center gap-1 truncate">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isCompleted
              ? "bg-emerald-600"
              : isOverdue
                ? "bg-rose-600"
                : isCheckInDue
                  ? "bg-amber-500"
                  : "bg-blue-600"
          }`}
        />
        <span className="truncate max-w-[240px]">
          {action.progressUpdates && action.progressUpdates.length > 0
            ? action.progressUpdates[0].notes
            : stuckInfo.label}
        </span>
      </div>
    </div>
  );
};
