import React, { useState } from "react";
import { CompanyOverviewSummary, ComplianceItem } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  IndianRupee,
  FileCheck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  Users,
  AlertCircle,
  FileText,
  Check,
  PieChart,
  BarChart3,
} from "lucide-react";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";
import { isComplianceFiled, nextDueDate, daysUntilDue } from "../../utils/dueDate";

interface CompanySquareWindowProps {
  company: CompanyOverviewSummary;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  defaultExpanded?: boolean;
  onSelectRatioView?: (companyId: string) => void;
}

export const CompanySquareWindow: React.FC<CompanySquareWindowProps> = ({
  company,
  isExpanded: controlledExpanded,
  onToggleExpand,
  defaultExpanded = false,
  onSelectRatioView,
}) => {
  const {
    drillDownToCompany,
    switchCompanyAndTab,
    allCompliancesMap,
    approveCfoComplianceReview,
    getReportsForCompany,
    showToast,
  } = useApp();

  const [internalExpanded, setInternalExpanded] = useState<boolean>(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const [activeSubView, setActiveSubView] = useState<"all" | "compliances" | "mis">("all");

  // Health styling configuration
  const healthConfig = {
    smooth: {
      border: "border-emerald-200/90 hover:border-emerald-400",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      badgeIcon: CheckCircle2,
      badgeText: "Smooth Health",
      avatarBg: "bg-gradient-to-br from-emerald-600 to-teal-700",
      dotColor: "bg-emerald-500",
      accentBg: "bg-emerald-50/40",
    },
    attention: {
      border: "border-amber-200/90 hover:border-amber-400",
      badgeBg: "bg-amber-50 text-amber-900 border-amber-200",
      badgeIcon: Clock,
      badgeText: "Review Required",
      avatarBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      dotColor: "bg-amber-500",
      accentBg: "bg-amber-50/40",
    },
    critical: {
      border: "border-rose-300 hover:border-rose-500 shadow-sm",
      badgeBg: "bg-rose-50 text-rose-900 border-rose-200",
      badgeIcon: AlertOctagon,
      badgeText: "Critical Watch",
      avatarBg: "bg-gradient-to-br from-rose-600 to-red-700",
      dotColor: "bg-rose-500 animate-pulse",
      accentBg: "bg-rose-50/40",
    },
  }[company.overallHealth || "smooth"];

  const BadgeIcon = healthConfig.badgeIcon;
  const mis = company.mis;

  // Retrieve company-specific compliances
  const compliances: ComplianceItem[] = allCompliancesMap[company.companyId] || [];

  // Identify Overdue and Critical Compliances
  const overdueCompliances = compliances.filter((c) => {
    if (isComplianceFiled(c)) return false;
    const days = daysUntilDue(c);
    return days !== null && days < 0;
  });

  const awaitingCfoReview = compliances.filter((c) => {
    if (isComplianceFiled(c)) return false;
    const isDraftDone = c.subtasks?.[0]?.status === "completed";
    const isCfoDone = c.subtasks?.[1]?.status === "completed";
    return isDraftDone && !isCfoDone;
  });

  const upcomingCritical = compliances.filter((c) => {
    if (isComplianceFiled(c)) return false;
    const days = daysUntilDue(c);
    return (
      days !== null &&
      days >= 0 &&
      days <= 5 &&
      (c.criticality === "Critical" || c.criticality === "High")
    );
  });

  // Combine top urgent items (overdue first, then awaiting CFO review, then upcoming critical)
  const priorityCompliances = [
    ...overdueCompliances,
    ...awaitingCfoReview.filter((c) => !overdueCompliances.some((o) => o.id === c.id)),
    ...upcomingCritical.filter(
      (c) =>
        !overdueCompliances.some((o) => o.id === c.id) &&
        !awaitingCfoReview.some((a) => a.id === c.id),
    ),
  ].slice(0, 4);

  // Executive Reports Observations
  const reports = getReportsForCompany ? getReportsForCompany(company.companyId) : [];
  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  return (
    <div
      className={`bg-white rounded-2xl border ${healthConfig.border} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group`}
    >
      {/* 1. TOP HEADER: ENTITY IDENTITY & HEALTH */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center shrink-0 shadow-xs ${healthConfig.avatarBg}`}
            >
              {(company.companyName || "CO").substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  onClick={() => drillDownToCompany(company.companyId)}
                  className="font-bold text-slate-900 text-sm sm:text-base tracking-tight hover:text-indigo-600 cursor-pointer transition-colors truncate"
                  title={company.companyName}
                >
                  {company.companyName}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                  {company.entityType.includes("LLP") ? "LLP" : "Pvt Ltd"}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                <span className="font-mono text-slate-600">{company.gstin}</span>
                <span className="mx-1.5">•</span>
                <span>{company.sector}</span>
              </p>
            </div>
          </div>

          {/* Health Status Pill, Extend/Collapse Toggle & Control Button */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${healthConfig.badgeBg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${healthConfig.dotColor}`} />
                <span>{healthConfig.badgeText}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleExpand}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                  isExpanded
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                }`}
                title={isExpanded ? "Collapse complete card details" : "Extend complete card details"}
              >
                <span>{isExpanded ? "Collapse" : "Extend Details"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => drillDownToCompany(company.companyId)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
              title="Open full dedicated entity workspace"
            >
              <span>Control View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick View Mode Switcher within Company Card (Only when card is expanded) */}
        {isExpanded && (
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100/80 text-[11px]">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveSubView("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeSubView === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Complete Overview
              </button>
              <button
                onClick={() => setActiveSubView("compliances")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeSubView === "compliances"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Compliances</span>
                {overdueCompliances.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-800 font-bold">
                    {overdueCompliances.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveSubView("mis")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeSubView === "mis"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                MIS &amp; Observations
              </button>
            </div>

            {/* Compliance Progress Pill */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-medium">Compliance Rate: </span>
              <span
                className={`font-bold font-mono ${company.compliancePercentage >= 80 ? "text-emerald-700" : "text-amber-700"}`}
              >
                {company.compliancePercentage}%
              </span>
              <span className="text-[10px] text-slate-400 ml-1">
                ({company.fullyCompletedCompliances}/{company.totalCompliances})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. COMPACT SUMMARY DOSSIER (COLLAPSED / EXTENDABLE STATE) */}
      {!isExpanded ? (
        <div className="p-4 sm:p-5 space-y-3.5 bg-white">
          {/* Compliance & Health Summary Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Compliance:</span>
              <span
                className={`font-bold font-mono text-xs px-2 py-0.5 rounded-md ${
                  company.compliancePercentage >= 80
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {company.compliancePercentage}% ({company.fullyCompletedCompliances}/{company.totalCompliances})
              </span>

              {overdueCompliances.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>{overdueCompliances.length} Overdue</span>
                </span>
              ) : awaitingCfoReview.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span>{awaitingCfoReview.length} Awaiting Dual Sign-Off</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>All Filings On Track</span>
                </span>
              )}

              {mis?.creditorsOver45Days && mis.creditorsOver45Days > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>MSME 43B(h): ₹{formatLakhs(mis.creditorsOver45Days)}</span>
                </span>
              ) : null}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Next Due: {company.nextUpcomingDeadline || "All Clear"}
            </span>
          </div>

          {/* 4-Stat Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-500 block">Monthly Revenue</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {mis?.monthlyRevenue ? formatLakhs(mis.monthlyRevenue) : "n/a"}
                </span>
                {mis?.revenueGrowthMoM !== undefined && (
                  <span
                    className={`text-[10px] font-bold ${
                      mis.revenueGrowthMoM >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {mis.revenueGrowthMoM >= 0 ? "+" : ""}
                    {mis.revenueGrowthMoM}%
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-500 block">EBITDA &amp; Margin</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {mis?.ebitda ? formatLakhs(mis.ebitda) : "n/a"}
                </span>
                {mis?.ebitdaMarginPercent !== undefined && (
                  <span className="text-[10px] font-bold text-indigo-700">
                    ({mis.ebitdaMarginPercent}%)
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-500 block">Cash Runway</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-sm font-bold font-mono ${
                    mis?.cashRunwayMonths && mis.cashRunwayMonths < 6
                      ? "text-rose-700"
                      : "text-slate-900"
                  }`}
                >
                  {mis?.cashRunwayMonths ? `${mis.cashRunwayMonths} Mo` : "n/a"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {mis?.cashAndBankBalance ? formatCrores(mis.cashAndBankBalance) : ""}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-medium text-slate-500 block">Trade Debtors</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {mis?.debtorDaysDSO ? `${mis.debtorDaysDSO}d DSO` : "n/a"}
                </span>
                {mis?.debtorsOver90Days && mis.debtorsOver90Days > 0 ? (
                  <span className="text-[10px] font-bold text-amber-700">
                    (₹{formatLakhs(mis.debtorsOver90Days)} &gt;90d)
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* CFO Observation teaser if present */}
          {(mis?.cfoExecutiveSummary || latestReport?.executiveSummary) && (
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs text-slate-700 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="line-clamp-1 italic text-slate-600">
                &ldquo;{mis?.cfoExecutiveSummary || latestReport?.executiveSummary}&rdquo;
              </p>
            </div>
          )}

          {/* Extend Dossier Banner & Quick Actions */}
          <div className="pt-1 flex items-center justify-between text-xs flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleExpand}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer py-1"
            >
              <span>Extend complete details &amp; filing breakdown</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
            </button>

            <div className="flex items-center gap-2">
              {onSelectRatioView && (
                <button
                  type="button"
                  onClick={() => onSelectRatioView(company.companyId)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200/80"
                  title="View Financial Ratios, Pie Charts & Graphs in Portfolio Overview"
                >
                  <PieChart className="w-3 h-3 text-indigo-600" />
                  <span>Ratios &amp; Charts</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => drillDownToCompany(company.companyId)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Workspace</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. BODY CONTENT: OVERDUE COMPLIANCES & SUMMARISED MIS HIGHLIGHTS (EXPANDED) */}
          <div className="p-4 sm:p-5 space-y-4 flex-1">
        {/* --- SECTION A: CRITICAL & OVERDUE COMPLIANCES --- */}
        {(activeSubView === "all" || activeSubView === "compliances") && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Critical &amp; Overdue Compliances
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {overdueCompliances.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                    {overdueCompliances.length} Overdue
                  </span>
                )}
                {awaitingCfoReview.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {awaitingCfoReview.length} Awaiting Sign-Off
                  </span>
                )}
              </div>
            </div>

            {priorityCompliances.length > 0 ? (
              <div className="space-y-2">
                {priorityCompliances.map((item) => {
                  const days = daysUntilDue(item);
                  const isOverdue = days !== null && days < 0;
                  const isAwaitingCfo =
                    item.subtasks?.[0]?.status === "completed" &&
                    item.subtasks?.[1]?.status !== "completed";

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isOverdue
                          ? "bg-rose-50/60 border-rose-200/90 hover:bg-rose-50"
                          : isAwaitingCfo
                            ? "bg-purple-50/60 border-purple-200/90 hover:bg-purple-50"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/90 text-slate-700 border border-slate-200/60">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {item.sectionOrAct || item.applicability} • {item.period}
                          </p>
                        </div>

                        {/* Status Tag */}
                        <div className="shrink-0 text-right">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{Math.abs(days || 0)}d Overdue</span>
                            </span>
                          ) : isAwaitingCfo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600 text-white shadow-2xs">
                              <Clock className="w-3 h-3" />
                              <span>CFO Review</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                              <span>Due {days}d</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overdue/Risk Details Strip */}
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                        <div className="flex items-center gap-3 text-slate-600">
                          {item.taxAmount ? (
                            <span className="font-semibold text-slate-900 font-mono">
                              Tax: {formatINR(item.taxAmount)}
                            </span>
                          ) : null}
                          <span className="text-slate-500 truncate max-w-[170px]">
                            Owner: <strong className="text-slate-700">{item.assignedTo || "Accounts Lead"}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAwaitingCfo ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                approveCfoComplianceReview(company.companyId, item.id);
                                showToast(`Dual CFO Sign-off executed for ${item.name}!`);
                              }}
                              className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                              title="Sign-off and advance this filing to Portal Submission"
                            >
                              <Check className="w-3 h-3" />
                              <span>Sign Off</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => switchCompanyAndTab(company.companyId, "compliances")}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Item</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    No Overdue Filings
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    All statutory returns &amp; challans are operating strictly on schedule. Next upcoming due date:{" "}
                    <strong>{company.nextUpcomingDeadline || "All Clear"}</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SECTION B: SUMMARISED MIS HIGHLIGHTS & KEY METRICS --- */}
        {(activeSubView === "all" || activeSubView === "mis") && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Summarised MIS Highlights &amp; Financial Vital Signs
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {onSelectRatioView && (
                  <button
                    type="button"
                    onClick={() => onSelectRatioView(company.companyId)}
                    className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <PieChart className="w-3 h-3 text-indigo-600" />
                    <span>Ratios &amp; Charts</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => switchCompanyAndTab(company.companyId, "mis")}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full MIS</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 4-Stat Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-medium text-slate-500 block">
                  Monthly Revenue
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {mis?.monthlyRevenue ? formatLakhs(mis.monthlyRevenue) : "n/a"}
                  </span>
                  {mis?.revenueGrowthMoM !== undefined && (
                    <span
                      className={`text-[10px] font-bold ${
                        mis.revenueGrowthMoM >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {mis.revenueGrowthMoM >= 0 ? "+" : ""}
                      {mis.revenueGrowthMoM}%
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-medium text-slate-500 block">
                  EBITDA &amp; Margin
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {mis?.ebitda ? formatLakhs(mis.ebitda) : "n/a"}
                  </span>
                  {mis?.ebitdaMarginPercent !== undefined && (
                    <span className="text-[10px] font-bold text-indigo-700">
                      ({mis.ebitdaMarginPercent}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-medium text-slate-500 block">
                  Cash Runway
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-sm font-bold font-mono ${
                      mis?.cashRunwayMonths && mis.cashRunwayMonths < 6
                        ? "text-rose-700"
                        : "text-slate-900"
                    }`}
                  >
                    {mis?.cashRunwayMonths ? `${mis.cashRunwayMonths} Mo` : "n/a"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {mis?.cashAndBankBalance ? formatCrores(mis.cashAndBankBalance) : ""}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-medium text-slate-500 block">
                  Trade Debtors &amp; DSO
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {mis?.debtorDaysDSO ? `${mis.debtorDaysDSO}d DSO` : "n/a"}
                  </span>
                  {mis?.debtorsOver90Days && mis.debtorsOver90Days > 0 ? (
                    <span className="text-[10px] font-bold text-amber-700">
                      (₹{formatLakhs(mis.debtorsOver90Days)} &gt;90d)
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Sec 43B(h) MSME Alert Pill if applicable */}
            {mis?.creditorsOver45Days && mis.creditorsOver45Days > 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Sec 43B(h) MSME Risk:</strong> ₹{formatLakhs(mis.creditorsOver45Days)} aged &gt; 45 days requiring clearance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => switchCompanyAndTab(company.companyId, "mis", "debtor-ageing")}
                  className="text-[10.5px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                >
                  Payables
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* --- SECTION C: CFO EXECUTIVE OBSERVATIONS & DIRECTIVES OVER MIS --- */}
        {(activeSubView === "all" || activeSubView === "mis") && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>CFO Executive Observations &amp; Directives</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {latestReport?.month || "Active Period"}
              </span>
            </div>

            {/* Observation Card */}
            <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 space-y-2">
              {mis?.cfoExecutiveSummary ? (
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {mis.cfoExecutiveSummary}
                </p>
              ) : latestReport?.executiveSummary ? (
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {latestReport.executiveSummary}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No executive observations recorded yet. Click below to add CFO notes.
                </p>
              )}

              {/* Bulleted Alerts / Observations */}
              {mis?.cfoKeyAlerts && mis.cfoKeyAlerts.length > 0 ? (
                <ul className="space-y-1 pt-1.5 border-t border-slate-200/50">
                  {mis.cfoKeyAlerts.slice(0, 2).map((alert, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-slate-600 flex items-start gap-1.5"
                    >
                      <span className="text-indigo-500 font-bold leading-none mt-0.5">•</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* 3. FOOTER ACTIONS */}
      <div className="px-4 py-3 sm:px-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => switchCompanyAndTab(company.companyId, "compliances")}
            className="text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliances ({company.totalCompliances})</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => switchCompanyAndTab(company.companyId, "mis")}
            className="text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>MIS &amp; Budget</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Collapse this dossier card"
          >
            <span>Collapse</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => drillDownToCompany(company.companyId)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Open Workspace</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </>
  )}
</div>
  );
};
