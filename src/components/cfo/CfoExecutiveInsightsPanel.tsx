import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { generateAiFinancialObservationsFromMis } from "../../utils/aiFinancialObservations";
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Edit3,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  Maximize2,
  Minimize2,
  Building2,
  Check,
  Clock,
  Filter,
} from "lucide-react";
import { ExecutiveObservation, ActionItem } from "../../types";

interface CfoExecutiveInsightsPanelProps {
  onOpenReportEditor?: () => void;
  onOpenApproveModal?: () => void;
}

export const CfoExecutiveInsightsPanel: React.FC<CfoExecutiveInsightsPanelProps> = ({
  onOpenReportEditor,
  onOpenApproveModal,
}) => {
  const {
    clientProfile,
    financialMIS,
    compliances,
    actions,
    executiveReports,
    setActiveTab,
    selectedCompanyId,
    companies,
    showToast,
  } = useApp();

  const [activeHeadingFilter, setActiveHeadingFilter] = useState<
    "all" | "observations" | "takeaways" | "suggestions" | "actions"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Set of individually expanded line item IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Master expand/collapse all state
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);

  const activeCompanyId =
    selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : clientProfile.id;
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || clientProfile;

  // Retrieve saved monthly report or generate dynamic live observations
  const companyReports = executiveReports[activeCompanyId] || [];
  const currentMonthKey = "2026-09";
  const savedReport =
    companyReports.find((r) => r.monthKey === currentMonthKey) || companyReports[0];

  // Generated insights from current live data
  const generatedData = useMemo(() => {
    return generateAiFinancialObservationsFromMis({
      company: activeCompany,
      monthLabel: financialMIS.period || "September 2026",
      mis: financialMIS,
      compliances,
    });
  }, [activeCompany, financialMIS, compliances]);

  // Merge saved report data with live generated data
  const summaryPoints = useMemo(() => {
    return savedReport && savedReport.summaryPoints && savedReport.summaryPoints.length > 0
      ? savedReport.summaryPoints
      : generatedData.summaryPoints;
  }, [savedReport, generatedData]);

  const observations: ExecutiveObservation[] = useMemo(() => {
    return savedReport && savedReport.observations && savedReport.observations.length > 0
      ? savedReport.observations
      : generatedData.observations;
  }, [savedReport, generatedData]);

  const cfoDirectives = useMemo(() => {
    return savedReport && savedReport.cfoDirectives && savedReport.cfoDirectives.length > 0
      ? savedReport.cfoDirectives
      : generatedData.cfoDirectives;
  }, [savedReport, generatedData]);

  // Filter pending & critical action items
  const priorityActions: ActionItem[] = useMemo(() => {
    return (actions || []).filter((a) => a && a.status !== "Completed").slice(0, 5);
  }, [actions]);

  // Toggle individual row expansion
  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle master Expand All / Collapse All
  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedIds(new Set());
      setIsAllExpanded(false);
    } else {
      const allIds = new Set<string>();
      observations.forEach((o) => allIds.add(`obs-${o.id}`));
      summaryPoints.forEach((_, idx) => allIds.add(`takeaway-${idx}`));
      cfoDirectives.forEach((_, idx) => allIds.add(`sug-${idx}`));
      priorityActions.forEach((a) => allIds.add(`act-${a.id}`));
      setExpandedIds(allIds);
      setIsAllExpanded(true);
    }
  };

  // Filter items by search query
  const q = searchQuery.trim().toLowerCase();

  const filteredObservations = useMemo(() => {
    if (!q) return observations;
    return observations.filter(
      (o) =>
        o.observation.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        (o.recommendation && o.recommendation.toLowerCase().includes(q)) ||
        o.impact.toLowerCase().includes(q),
    );
  }, [observations, q]);

  const filteredTakeaways = useMemo(() => {
    if (!q) return summaryPoints;
    return summaryPoints.filter((p) => p.toLowerCase().includes(q));
  }, [summaryPoints, q]);

  const filteredDirectives = useMemo(() => {
    if (!q) return cfoDirectives;
    return cfoDirectives.filter((d) => d.toLowerCase().includes(q));
  }, [cfoDirectives, q]);

  const filteredActions = useMemo(() => {
    if (!q) return priorityActions;
    return priorityActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.priority.toLowerCase().includes(q) ||
        (a.assignee && a.assignee.toLowerCase().includes(q)),
    );
  }, [priorityActions, q]);

  const totalFilteredCount =
    filteredObservations.length +
    filteredTakeaways.length +
    filteredDirectives.length +
    filteredActions.length;

  const criticalObsCount = observations.filter((o) => o.impact === "critical").length;
  const watchObsCount = observations.filter((o) => o.impact === "watch").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 1. UNIFIED WINDOW HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-indigo-50/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10.5px] font-bold tracking-wide uppercase shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Executive Briefing Window</span>
              </span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {activeCompany.companyName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {financialMIS.period || "September 2026"}
              </span>
              {criticalObsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {criticalObsCount} Critical Flags
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Executive Briefing: Key Observations, Takeaways &amp; Suggestions
            </h2>
          </div>

          {/* Quick Action & Controls Strip */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <button
              type="button"
              onClick={toggleExpandAll}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={isAllExpanded ? "Collapse all rows to 1 line" : "Extend all rows with details"}
            >
              {isAllExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Collapse All Lines</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Extend All Details</span>
                </>
              )}
            </button>

            {onOpenApproveModal && (
              <button
                type="button"
                onClick={onOpenApproveModal}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Briefing</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onOpenReportEditor) {
                  onOpenReportEditor();
                } else {
                  setActiveCategoryFilter("suggestions");
                  setExpandedCategories((prev) => ({ ...prev, suggestions: true }));
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Directives &amp; Suggestions</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. WINDOW TOOLBAR: HEADINGS FILTER PILLS & INSTANT SEARCH */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Heading Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveHeadingFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeHeadingFilter === "all"
                ? "bg-slate-900 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            All Briefings ({observations.length + summaryPoints.length + cfoDirectives.length + priorityActions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveHeadingFilter("observations")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeHeadingFilter === "observations"
                ? "bg-slate-900 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Key Observations ({observations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHeadingFilter("takeaways")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeHeadingFilter === "takeaways"
                ? "bg-slate-900 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Key Takeaways ({summaryPoints.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHeadingFilter("suggestions")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeHeadingFilter === "suggestions"
                ? "bg-slate-900 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggestions ({cfoDirectives.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHeadingFilter("actions")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeHeadingFilter === "actions"
                ? "bg-slate-900 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
            <span>Actions ({priorityActions.length})</span>
          </button>
        </div>

        {/* Quick Search inside briefing window */}
        <div className="relative min-w-[200px] max-w-xs self-stretch sm:self-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search observations, keywords..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3. LINE-WISE SECTIONS LIST (IN ONE UNIFIED WINDOW) */}
      <div className="p-4 sm:p-5 space-y-6">
        {totalFilteredCount === 0 && (
          <div className="py-12 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No matching briefing lines found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or clear the filter.
            </p>
          </div>
        )}

        {/* HEADING 1: KEY OBSERVATIONS */}
        {(activeHeadingFilter === "all" || activeHeadingFilter === "observations") &&
          filteredObservations.length > 0 && (
            <div className="space-y-2.5">
              {/* Heading Banner */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Key Observations &amp; Financial Red Flags
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {criticalObsCount} Critical
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {watchObsCount} Advisory
                  </span>
                  <span>·</span>
                  <span>{filteredObservations.length} lines</span>
                </div>
              </div>

              {/* Line-wise Observations */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                {filteredObservations.map((obs, idx) => {
                  const lineId = `obs-${obs.id}`;
                  const isExpanded = expandedIds.has(lineId);
                  const isCritical = obs.impact === "critical";
                  const isWatch = obs.impact === "watch";

                  return (
                    <div
                      key={obs.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isExpanded ? "bg-slate-50/40" : ""
                      }`}
                    >
                      {/* Main Line Row */}
                      <div
                        onClick={() => toggleRow(lineId)}
                        className="p-3 sm:px-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                          {/* Number & Category Pill */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-5">
                              {String(idx + 1).padStart(2, "0")}.
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {obs.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                isCritical
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : isWatch
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {isCritical ? "Critical Alert" : isWatch ? "Advisory" : "Positive"}
                            </span>
                          </div>

                          {/* Line Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs text-slate-800 leading-snug font-medium ${
                                isExpanded ? "whitespace-normal" : "line-clamp-1"
                              }`}
                            >
                              {obs.observation}
                            </p>
                          </div>
                        </div>

                        {/* Expandable Indicator & Toggle */}
                        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors">
                          <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                            {isExpanded ? "Collapse" : "Extend"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Extended Detail Drawer (when line is extended) */}
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                          {/* Full expanded observation text */}
                          <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                            <span className="font-semibold text-slate-900">Detailed Context: </span>
                            {obs.observation}
                          </div>

                          {/* CFO Recommendation block if available */}
                          {obs.recommendation && (
                            <div className="flex items-start gap-2 text-xs bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-indigo-950">
                              <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                              <div className="space-y-1 flex-1">
                                <span className="font-bold text-indigo-900 uppercase text-[10.5px] tracking-wider block">
                                  Virtual CFO Action Directives:
                                </span>
                                <p className="leading-relaxed font-medium">{obs.recommendation}</p>
                              </div>
                            </div>
                          )}

                          {/* Deep Link Action */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-400">Impact Level: {obs.impact.toUpperCase()}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("mis");
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>Inspect in Balance Sheet &amp; MIS</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* HEADING 2: KEY TAKEAWAYS */}
        {(activeHeadingFilter === "all" || activeHeadingFilter === "takeaways") &&
          filteredTakeaways.length > 0 && (
            <div className="space-y-2.5">
              {/* Heading Banner */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Key Takeaways &amp; Month-End Synthesis
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="font-mono text-indigo-700 font-semibold">
                    {financialMIS.period || "Current Month"}
                  </span>
                  <span>·</span>
                  <span>{filteredTakeaways.length} lines</span>
                </div>
              </div>

              {/* Line-wise Takeaways */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                {filteredTakeaways.map((point, idx) => {
                  const lineId = `takeaway-${idx}`;
                  const isExpanded = expandedIds.has(lineId);

                  // Extract headline prefix if colon present
                  const colonIndex = point.indexOf(":");
                  const headline = colonIndex !== -1 ? point.substring(0, colonIndex) : `Highlight #${idx + 1}`;
                  const detail = colonIndex !== -1 ? point.substring(colonIndex + 1).trim() : point;

                  return (
                    <div
                      key={idx}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isExpanded ? "bg-slate-50/40" : ""
                      }`}
                    >
                      {/* Main Line Row */}
                      <div
                        onClick={() => toggleRow(lineId)}
                        className="p-3 sm:px-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                          {/* Number & Takeaway Tag */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-[10.5px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {headline}
                            </span>
                          </div>

                          {/* Line Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs text-slate-800 leading-snug font-medium ${
                                isExpanded ? "whitespace-normal" : "line-clamp-1"
                              }`}
                            >
                              {detail}
                            </p>
                          </div>
                        </div>

                        {/* Expandable Indicator */}
                        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors">
                          <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                            {isExpanded ? "Collapse" : "Extend"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Extended Detail Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                            <span className="font-bold text-slate-900">{headline}: </span>
                            <span>{detail}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-400">Virtual CFO Macro Review</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("mis");
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>View Detailed P&amp;L &amp; Ratios</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* HEADING 3: CFO SUGGESTIONS & DIRECTIVES */}
        {(activeHeadingFilter === "all" || activeHeadingFilter === "suggestions") &&
          filteredDirectives.length > 0 && (
            <div className="space-y-2.5">
              {/* Heading Banner */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      CFO Suggestions &amp; Strategic Management Directives
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                  <span className="font-semibold">Leadership Guidance</span>
                  <span>·</span>
                  <span>{filteredDirectives.length} directives</span>
                </div>
              </div>

              {/* Line-wise Suggestions */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                {filteredDirectives.map((directive, idx) => {
                  const lineId = `sug-${idx}`;
                  const isExpanded = expandedIds.has(lineId);

                  const colonIndex = directive.indexOf(":");
                  const topic = colonIndex !== -1 ? directive.substring(0, colonIndex) : `Directive #${idx + 1}`;
                  const instruction = colonIndex !== -1 ? directive.substring(colonIndex + 1).trim() : directive;

                  return (
                    <div
                      key={idx}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isExpanded ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Main Line Row */}
                      <div
                        onClick={() => toggleRow(lineId)}
                        className="p-3 sm:px-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                          {/* Number & Topic Pill */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                              Directive #{idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {topic}
                            </span>
                          </div>

                          {/* Line Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs text-slate-800 leading-snug font-semibold ${
                                isExpanded ? "whitespace-normal" : "line-clamp-1"
                              }`}
                            >
                              {instruction}
                            </p>
                          </div>
                        </div>

                        {/* Expandable Indicator */}
                        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors">
                          <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                            {isExpanded ? "Collapse" : "Extend"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-700" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Extended Detail Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-amber-100/80 bg-amber-50/40 space-y-2">
                          <div className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-200/70 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">
                                Action Mandate: {topic}
                              </span>
                              <span className="text-[10.5px] font-semibold text-indigo-700">
                                Priority Level: High Impact
                              </span>
                            </div>
                            <p className="font-medium text-slate-700">{instruction}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500">Sign-Off: Virtual CFO Desk</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("compliances");
                              }}
                              className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>Assign to Action Workflow</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* HEADING 4: PRIORITY ACTIONS & PENDENCIES */}
        {(activeHeadingFilter === "all" || activeHeadingFilter === "actions") &&
          filteredActions.length > 0 && (
            <div className="space-y-2.5">
              {/* Heading Banner */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <ListChecks className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Immediate Priority Actions &amp; Pendencies
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("compliances")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>View All Actions ({actions.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Line-wise Actions */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                {filteredActions.map((act) => {
                  const lineId = `act-${act.id}`;
                  const isExpanded = expandedIds.has(lineId);

                  return (
                    <div
                      key={act.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isExpanded ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      {/* Main Line Row */}
                      <div
                        onClick={() => toggleRow(lineId)}
                        className="p-3 sm:px-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                          {/* Priority Tag & Due Date */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                act.priority === "Urgent"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : act.priority === "High"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {act.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Due: {act.dueDate}
                            </span>
                          </div>

                          {/* Line Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs text-slate-900 leading-snug font-semibold ${
                                isExpanded ? "whitespace-normal" : "line-clamp-1"
                              }`}
                            >
                              {act.title}
                            </p>
                          </div>
                        </div>

                        {/* Status & Expandable Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {act.status}
                          </span>
                          <div className="text-slate-400 hover:text-indigo-600 transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Extended Detail Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1.5">
                            <span className="font-semibold text-slate-900">Task Scope: </span>
                            <p>{act.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500">
                              Assigned To: <strong>{act.assignee}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("compliances");
                              }}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>Open in Action Workflow</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* 4. WINDOW FOOTER STATUS BAR */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 text-xs text-slate-500 font-medium">
        <span>{observations.length} Observations</span>
        <span>•</span>
        <span>{summaryPoints.length} Takeaways</span>
        <span>•</span>
        <span>{cfoDirectives.length} Suggestions</span>
      </div>
    </div>
  );
};
