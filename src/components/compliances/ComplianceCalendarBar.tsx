import React, { useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Archive,
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  getAvailableComplianceMonths,
  getCurrentMonthKey,
} from "../../utils/complianceCalendarEngine";

interface ComplianceCalendarBarProps {
  totalCompletedCount: number;
  totalActiveCount: number;
  earlierPendingCount?: number;
  currentMonthCount?: number;
  prospectiveFyCount?: number;
  earlierCompletedCount?: number;
  activeTimelineView?: "ALL" | "EARLIER_PENDING" | "CURRENT_MONTH" | "PROSPECTIVE_FY" | string;
  onSelectTimelineView?: (
    view: "ALL" | "EARLIER_PENDING" | "CURRENT_MONTH" | "PROSPECTIVE_FY" | string,
  ) => void;
}

export const ComplianceCalendarBar: React.FC<ComplianceCalendarBarProps> = ({
  totalCompletedCount,
  totalActiveCount,
  earlierPendingCount = 0,
  currentMonthCount = 0,
  prospectiveFyCount = 0,
  earlierCompletedCount = 0,
  activeTimelineView = "ALL",
  onSelectTimelineView,
}) => {
  const {
    selectedComplianceMonth,
    setSelectedComplianceMonth,
    hideCompletedCompliances,
    toggleHideCompletedCompliances,
    autoHideEarlierCompleted,
    toggleAutoHideEarlierCompleted,
  } = useApp();

  const currentKey = getCurrentMonthKey();
  const availableMonths = useMemo(() => getAvailableComplianceMonths(), []);
  const currentMonthObj = useMemo(
    () => availableMonths.find((m) => m.key === currentKey) || availableMonths[0],
    [availableMonths, currentKey],
  );

  const handleSelectView = (viewKey: string) => {
    if (onSelectTimelineView) {
      onSelectTimelineView(viewKey as any);
    }
    setSelectedComplianceMonth(viewKey);
  };

  const isFullFy =
    selectedComplianceMonth === "ALL" ||
    selectedComplianceMonth === "FY_ALL" ||
    activeTimelineView === "ALL";

  const isCurrentMonthActive =
    selectedComplianceMonth === currentKey ||
    selectedComplianceMonth === "CURRENT_MONTH" ||
    (!isFullFy &&
      selectedComplianceMonth !== "EARLIER_PENDING" &&
      selectedComplianceMonth !== "PROSPECTIVE_FY" &&
      selectedComplianceMonth === currentKey);

  // Month index for stepper buttons
  const activeMonthIndex = availableMonths.findIndex(
    (m) => m.key === selectedComplianceMonth,
  );

  const handlePrevMonth = () => {
    if (activeMonthIndex > 0) {
      handleSelectView(availableMonths[activeMonthIndex - 1].key);
    } else if (activeMonthIndex === -1) {
      const curIdx = availableMonths.findIndex((m) => m.key === currentKey);
      if (curIdx > 0) handleSelectView(availableMonths[curIdx - 1].key);
    }
  };

  const handleNextMonth = () => {
    if (activeMonthIndex >= 0 && activeMonthIndex < availableMonths.length - 1) {
      handleSelectView(availableMonths[activeMonthIndex + 1].key);
    } else if (activeMonthIndex === -1) {
      const curIdx = availableMonths.findIndex((m) => m.key === currentKey);
      if (curIdx >= 0 && curIdx < availableMonths.length - 1) {
        handleSelectView(availableMonths[curIdx + 1].key);
      }
    }
  };

  const activeMonthLabel = useMemo(() => {
    if (selectedComplianceMonth === "ALL") return "Full Financial Year";
    if (selectedComplianceMonth === "EARLIER_PENDING") return "Earlier Months Pending";
    if (selectedComplianceMonth === "PROSPECTIVE_FY") return "Prospective FY Pipeline";
    const found = availableMonths.find((m) => m.key === selectedComplianceMonth);
    return found ? found.label : selectedComplianceMonth;
  }, [selectedComplianceMonth, availableMonths]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Top Header: Financial Year Timeline Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Continuous Financial Year Timeline Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarRange className="w-4 h-4" />
            </div>
            <span>Statutory Timeline:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-lg">
            {/* View 1: Entire Financial Year */}
            <button
              type="button"
              onClick={() => handleSelectView("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isFullFy
                  ? "bg-white text-indigo-950 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Financial Year</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800">
                All Months
              </span>
            </button>

            {/* View 2: Pending from Earlier Months */}
            <button
              type="button"
              onClick={() => handleSelectView("EARLIER_PENDING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedComplianceMonth === "EARLIER_PENDING"
                  ? "bg-rose-50 text-rose-900 shadow-2xs font-bold border border-rose-200"
                  : "text-slate-600 hover:text-rose-700 hover:bg-slate-200/60"
              }`}
              title="Show only compliances carried forward as pending from earlier months"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Earlier Pending</span>
              {earlierPendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-600 text-white animate-pulse">
                  {earlierPendingCount}
                </span>
              )}
            </button>

            {/* View 3: Dynamic Current Month */}
            <button
              type="button"
              onClick={() => handleSelectView(currentKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isCurrentMonthActive
                  ? "bg-white text-indigo-950 shadow-2xs font-bold border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="View current active month statutory filings"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Current Month ({currentMonthObj?.shortLabel || currentKey})</span>
              {currentMonthCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {currentMonthCount}
                </span>
              )}
            </button>

            {/* View 4: Prospective Financial Year Pipeline */}
            <button
              type="button"
              onClick={() => handleSelectView("PROSPECTIVE_FY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedComplianceMonth === "PROSPECTIVE_FY"
                  ? "bg-white text-purple-950 shadow-2xs font-bold border border-purple-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="View upcoming prospective statutory filings for subsequent months"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Prospective FY Pipeline</span>
              {prospectiveFyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-100 text-purple-800">
                  {prospectiveFyCount}
                </span>
              )}
            </button>
          </div>

          {/* Dynamic Month Selector & Stepper */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={activeMonthIndex === 0}
              className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Previous Month Cycle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <select
                value={selectedComplianceMonth}
                onChange={(e) => handleSelectView(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer py-0.5"
                title="Select statutory filing month cycle"
              >
                <option value="ALL">Full Financial Year (All)</option>
                <option value="EARLIER_PENDING">Earlier Pending Filings</option>
                <option value="PROSPECTIVE_FY">Upcoming Prospective Pipeline</option>
                <optgroup label="Monthly Statutory Return Cycles">
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} {m.isCurrent ? "★ Active Current" : m.key < currentKey ? "(Archive)" : "(Upcoming)"}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={activeMonthIndex >= availableMonths.length - 1}
              className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Next Month Cycle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dual Visibility Toggles: Earlier Completed Auto-Hide & Current Completed Hide */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Toggle 1: Auto-Hide Earlier Completed Compliances */}
          <button
            type="button"
            onClick={toggleAutoHideEarlierCompleted}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              autoHideEarlierCompleted
                ? "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100/80 shadow-2xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80"
            }`}
            title={
              autoHideEarlierCompleted
                ? "Earlier months' completed filings are auto-hidden from view to prevent clutter. Click to show all earlier completed filings."
                : "Showing completed filings from earlier months. Click to auto-hide earlier completed."
            }
          >
            {autoHideEarlierCompleted ? (
              <>
                <Archive className="w-3.5 h-3.5 text-indigo-600" />
                <span>Earlier Completed Auto-Hidden</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Showing All Earlier Filings</span>
              </>
            )}
          </button>

          {/* Toggle 2: Hide Current Month Completed Filings */}
          <button
            type="button"
            onClick={toggleHideCompletedCompliances}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              hideCompletedCompliances
                ? "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80"
            }`}
            title={
              hideCompletedCompliances
                ? "Current month completed returns are hidden. Click to show all filings."
                : "Showing all returns. Click to focus only on pending/in-progress filings."
            }
          >
            {hideCompletedCompliances ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Hide Completed (Active)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Show All (Completed &amp; Pending)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Year Progress & Priority Notice */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500">Timeline Structure:</span>
          <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            1. 🚨 Earlier Months Pending (Top Priority)
          </span>
          <span className="text-slate-300">→</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            2. 📌 Current Active Month ({currentMonthObj?.shortLabel || currentKey})
          </span>
          <span className="text-slate-300">→</span>
          <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            3. 🔮 Prospective FY Pipeline (Upcoming Months)
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-200">
            Active Scope: {activeMonthLabel}
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Status:{" "}
          <strong className="text-emerald-700">{totalCompletedCount} Completed</strong> •{" "}
          <strong className="text-amber-700">{totalActiveCount} Pending/Scheduled</strong>
        </div>
      </div>
    </div>
  );
};
