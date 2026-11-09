import React from "react";
import { SubTask } from "../../types";

interface ProgressBarProps {
  subtasks?: [SubTask, SubTask, SubTask] | SubTask[];
  percentage?: number;
  color?: string;
  height?: string;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onToggleSubtask?: (subtaskNumber: 1 | 2 | 3) => void;
  disabled?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  subtasks,
  percentage: customPercentage,
  color: customColor,
  height: customHeight,
  size = "sm",
}) => {
  const completedCount =
    subtasks && Array.isArray(subtasks)
      ? subtasks.filter((s) => s && s.status === "completed").length
      : 0;

  const percentage =
    customPercentage !== undefined
      ? Math.min(100, Math.max(0, customPercentage))
      : subtasks && subtasks.length > 0
        ? Math.round((completedCount / subtasks.length) * 100)
        : 0;

  // Progressive color theme indication
  const getBarColor = () => {
    if (customColor) return customColor;
    if (customPercentage !== undefined) {
      if (customPercentage >= 80) return "bg-emerald-500";
      if (customPercentage >= 50) return "bg-indigo-600";
      if (customPercentage > 0) return "bg-amber-500";
      return "bg-slate-300";
    }
    switch (completedCount) {
      case 3:
        return "bg-emerald-500";
      case 2:
        return "bg-indigo-600";
      case 1:
        return "bg-amber-500";
      default:
        return "bg-slate-200";
    }
  };

  const heightClass = customHeight || (size === "sm" ? "h-2" : size === "lg" ? "h-3" : "h-2.5");

  return (
    <div className="w-full py-0.5">
      {/* Progressive graph line with colour indication only */}
      <div className={`w-full ${heightClass} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
