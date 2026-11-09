import React from "react";
import { ComplianceItem } from "../../types";
import { nextDueDate, formatDueDate, dueStatus, daysUntilDue } from "../../utils/dueDate";
import { CheckCircle2, AlertTriangle, Clock, Calendar } from "lucide-react";

interface DueDateBadgeProps {
  item?: ComplianceItem;
  dueDate?: string;
  className?: string;
  showPrefix?: boolean;
  compact?: boolean;
}

export const DueDateBadge: React.FC<DueDateBadgeProps> = ({
  item,
  dueDate,
  className = "",
  showPrefix = true,
  compact = false,
}) => {
  const dueIso = item ? nextDueDate(item) : dueDate || null;
  const formattedDate = dueIso
    ? formatDueDate(dueIso)
    : item?.statutoryDueDate
      ? item.statutoryDueDate
      : "—";
  const status = item ? dueStatus(item) : dueIso ? "upcoming" : "upcoming";
  const days = item ? daysUntilDue(item) : null;

  const renderBadge = () => {
    switch (status) {
      case "filed":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Filed</span>
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Overdue</span>
          </span>
        );
      case "due-soon":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Due Soon</span>
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-500">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Upcoming</span>
          </span>
        );
    }
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-mono text-slate-700">{formattedDate}</span>
        {renderBadge()}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-slate-600 font-medium">
        {showPrefix && "Due: "}
        <strong className="text-slate-900 font-semibold font-mono">{formattedDate}</strong>
      </span>
      {renderBadge()}
    </div>
  );
};
