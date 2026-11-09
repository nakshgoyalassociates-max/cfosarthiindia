import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ReactNode;
  badge?:
    | string
    | {
        text: string;
        variant?: "success" | "warning" | "danger" | "info" | "neutral";
      };
  trend?:
    | string
    | {
        value: string;
        isPositive?: boolean;
        label?: string;
      };
  iconBgColor?: string;
  onClick?: () => void;
  id?: string;
  trendDirection?: string;
  colorScheme?: string;
  theme?: "light" | "dark";
  barColor?: string;
  scorePct?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  trend,
  iconBgColor = "bg-indigo-50 text-indigo-600 border-indigo-100",
  onClick,
  id,
  trendDirection,
  colorScheme = "emerald",
  theme = "light",
  barColor,
  scorePct,
}) => {
  const trendObj = typeof trend === "string" ? { value: trend } : trend;
  const badgeObj = typeof badge === "string" ? { text: badge, variant: "neutral" as const } : badge;

  const isDark = theme === "dark";

  const getBadgeStyle = () => {
    if (isDark) {
      switch (badgeObj?.variant) {
        case "success":
          return "bg-emerald-500/15 text-emerald-300";
        case "warning":
          return "bg-amber-500/15 text-amber-300";
        case "danger":
          return "bg-rose-500/15 text-rose-300";
        case "info":
          return "bg-blue-500/15 text-blue-300";
        default:
          return "bg-slate-700/50 text-slate-300";
      }
    }
    switch (badgeObj?.variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700";
      case "warning":
        return "bg-amber-50 text-amber-700";
      case "danger":
        return "bg-rose-50 text-rose-700";
      case "info":
        return "bg-sky-50 text-sky-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getTrendStyle = () => {
    if (isDark) {
      if (trendObj?.isPositive || trendDirection === "up") {
        return "text-emerald-300";
      }
      if (trendObj?.isPositive === false || trendDirection === "down") {
        return "text-rose-300";
      }
      return "text-slate-300";
    }
    return trendObj?.isPositive || trendDirection === "up" ? "text-emerald-600" : "text-rose-600";
  };

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function" || typeof icon === "object") {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={isDark ? "w-3.5 h-3.5" : "w-5 h-5"} />;
    }
    return null;
  };

  // Resolved bar color for dark mode
  const resolvedBarColor =
    barColor ||
    (colorScheme === "indigo"
      ? "bg-indigo-400"
      : colorScheme === "blue" || colorScheme === "sky"
        ? "bg-blue-400"
        : colorScheme === "amber"
          ? "bg-amber-400"
          : colorScheme === "rose"
            ? "bg-rose-400"
            : "bg-emerald-400");

  if (isDark) {
    return (
      <div
        id={id}
        onClick={onClick}
        className={`bg-slate-800/70 hover:bg-slate-800 rounded-xl p-3 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2 ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        {/* Header: Title + Trend/Badge */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-400 shrink-0">{renderIcon()}</span>
            <span className="text-[11px] font-semibold text-slate-300 truncate" title={title}>
              {title}
            </span>
          </div>
          {(trendObj || badgeObj) && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 font-mono ${
                badgeObj ? getBadgeStyle() : getTrendStyle()
              }`}
            >
              {badgeObj ? badgeObj.text : trendObj?.value}
            </span>
          )}
        </div>

        {/* Value row: Large font-mono value */}
        <div className="flex items-baseline justify-between font-mono tabular-nums pt-0.5">
          <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {value}
          </span>
          {trendObj?.label && (
            <span className="text-[10px] text-slate-400 font-normal truncate ml-1">
              {trendObj.label}
            </span>
          )}
        </div>

        {/* Visual Strength Mini Bar */}
        <div className="w-full bg-slate-700/70 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${resolvedBarColor} transition-all duration-300`}
            style={{ width: `${scorePct !== undefined ? scorePct : 75}%` }}
          />
        </div>

        {/* Footer: Subtitle */}
        {subtitle && (
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate" title={subtitle}>
              {subtitle}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all ${
        onClick ? "cursor-pointer hover:border-indigo-300" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg border ${iconBgColor} flex items-center justify-center`}>
          {renderIcon()}
        </div>
      </div>

      {(subtitle || badgeObj || trendObj) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          {subtitle ? (
            <span className="text-slate-500 font-medium truncate" title={subtitle}>
              {subtitle}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 shrink-0">
            {trendObj && (
              <span
                className={`font-semibold font-mono tabular-nums flex items-center gap-0.5 ${trendObj.isPositive ? "text-emerald-600" : "text-rose-600"}`}
              >
                {trendObj.value}
                {trendObj.label && (
                  <span className="text-slate-400 font-sans font-normal ml-1">
                    {trendObj.label}
                  </span>
                )}
              </span>
            )}
            {badgeObj && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getBadgeStyle()}`}
              >
                {badgeObj.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
