import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { MetricCard } from "../common/MetricCard";
import { DueDateBadge } from "../common/DueDateBadge";
import { compareDueDates, isComplianceFiled, daysUntilDue } from "../../utils/dueDate";
import { formatINR, formatLakhs, formatCrores } from "../../utils/format";
import { ProgressBar } from "../common/ProgressBar";
import { ComplianceInlineDetail } from "../common/ComplianceInlineDetail";
import { AdminPanel, AdminTab } from "../admin/AdminPanel";
import { ApproveAndDispatchMisModal } from "../modals/ApproveAndDispatchMisModal";
import { MonthlyMisDispatchLogModal } from "../modals/MonthlyMisDispatchLogModal";
import { MonthlyExecutiveReport } from "../../types";
import { ClientFinancialRatios } from "../client/ClientFinancialRatios";
import { CfoExecutiveInsightsPanel } from "./CfoExecutiveInsightsPanel";
import { CfoExecutiveReportEditor } from "./CfoExecutiveReportEditor";
import {
  NEXORA_BALANCE_SHEET,
  NEXORA_PNL_STATEMENT,
  NEXORA_DEBTOR_AGEING,
  COMPANY_MIS_DETAILED,
} from "../../data/mockMisFinancials";
import { INITIAL_EXECUTIVE_REPORTS } from "../../data/mockExecutiveReports";
import { computeRatios, CalculatedRatio } from "../../utils/ratios";
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Clock,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Building,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Calendar,
  Building2,
  Layers,
  ArrowLeft,
  CornerDownRight,
  Lock,
  Sliders,
  Edit2,
  Users,
  Settings2,
  FastForward,
  UserPlus,
  Mail,
  History,
  Eye,
  Send,
  LayoutDashboard,
  Scale,
  Sparkles,
  PieChart,
  BarChart3,
  FileText,
  Target,
  ExternalLink,
} from "lucide-react";

export const CfoDashboard: React.FC = () => {
  const {
    compliances,
    toggleSubtask,
    financialMIS,
    stats,
    actions,
    setActiveTab,
    clientProfile,
    cfoViewMode,
    setCfoViewMode,
    returnToPortfolio,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    isCfoAdmin,
    setIsCfoAdmin,
    setIsInviteModalOpen,
    executiveReports,
    saveExecutiveReport,
    showToast,
    currentUser,
    allCompliancesMap,
    allActionsMap,
    allMISMap,
  } = useApp();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchLogModalOpen, setIsDispatchLogModalOpen] = useState(false);
  const [isReportEditorOpen, setIsReportEditorOpen] = useState(false);
  const [expandedSummaryCompanyId, setExpandedSummaryCompanyId] = useState<string | null>(null);

  const activeCompanyId =
    selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : clientProfile.id;
  const detailedCompanyData =
    COMPANY_MIS_DETAILED[activeCompanyId] || COMPANY_MIS_DETAILED["client-101"];
  const activeBalanceSheet =
    financialMIS.balanceSheet || detailedCompanyData?.balanceSheet || NEXORA_BALANCE_SHEET;
  const activePnl =
    financialMIS.pnlStatement || detailedCompanyData?.pnlStatement || NEXORA_PNL_STATEMENT;
  const activeDebtorAgeing =
    financialMIS.debtorAgeing || detailedCompanyData?.debtorAgeing || NEXORA_DEBTOR_AGEING;
  const companyReports =
    (executiveReports && executiveReports[activeCompanyId]) ||
    INITIAL_EXECUTIVE_REPORTS[activeCompanyId] ||
    [];
  const currentMonthKey = "2026-09";
  const activeReport: MonthlyExecutiveReport =
    companyReports.find((r) => r.monthKey === currentMonthKey) ||
    companyReports[0] ||
    INITIAL_EXECUTIVE_REPORTS[activeCompanyId]?.[0] || {
      id: `rep-${activeCompanyId}-${currentMonthKey}`,
      companyId: activeCompanyId,
      month: financialMIS.period || "September 2026",
      monthKey: currentMonthKey,
      title: `Monthly Financial MIS — ${financialMIS.period || "September 2026"}`,
      summaryPoints: [
        `Net Revenue of ₹1.45 Cr achieved in line with operating plan.`,
        `Operating EBITDA margin maintained at 18.4% reflecting healthy cost discipline.`,
        `Liquid cash and treasury reserves stand at ₹28.5L (~4.2 months operational runway).`,
        `Total trade receivables at ₹42.8L with continuous recovery focus on >60-day accounts.`,
      ],
      executiveSummary:
        financialMIS.cfoExecutiveSummary ||
        "Operating margins strengthened. Cash runway remains healthy.",
      observations: [],
      cfoDirectives: financialMIS.cfoKeyAlerts || [],
      cfoRemarks:
        financialMIS.cfoExecutiveSummary ||
        "Monthly financial figures approved. Cash runway is stable. Follow up on receivables >60 days.",
      status: "published",
      authorName: currentUser?.name || clientProfile?.cfoName || "Virtual CFO",
      authorRole: "Virtual CFO",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const isMailed = activeReport.isMailedToClient || activeReport.approvalStatus === "approved";

  const [cfoSubView, setCfoSubView] = useState<"operations" | "admin">("operations");
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>("permissions");

  const openAdminTab = (tab: AdminTab) => {
    setAdminInitialTab(tab);
    setCfoSubView("admin");
    if (!isCfoAdmin) setIsCfoAdmin(true);
  };

  // Live Signals for Individual Company Heading Cards: non-compliances, overdues, unfavourable ratios
  const companyCards = useMemo(() => {
    return companies.map((comp) => {
      const detailed = COMPANY_MIS_DETAILED[comp.id];
      const bs = detailed?.balanceSheet || (comp.id === "client-101" ? NEXORA_BALANCE_SHEET : undefined);
      const pnl = detailed?.pnlStatement || (comp.id === "client-101" ? NEXORA_PNL_STATEMENT : undefined);
      const debtors = detailed?.debtorAgeing || (comp.id === "client-101" ? NEXORA_DEBTOR_AGEING : undefined);
      const mis = (allMISMap && allMISMap[comp.id]) || (comp.id === activeCompanyId ? financialMIS : undefined);
      const compList = ((allCompliancesMap && allCompliancesMap[comp.id]) || []).filter((item) => !item?.isHidden);
      const actionList = ((allActionsMap && allActionsMap[comp.id]) || []).filter((a) => !a?.isHidden);

      // Compute all 19 financial ratios using central benchmark engine
      const ratios: CalculatedRatio[] = computeRatios(
        pnl,
        bs,
        debtors,
        pnl?.period || mis?.period,
        comp.ratioBenchmarks,
      );

      // Filter unfavourable (red) and caution (amber) ratios
      const redRatios = ratios.filter((r) => r.status === "red");
      const alertRatios = ratios.filter((r) => r.status === "red" || r.status === "amber");

      // Critical & Overdue Compliances
      const overdueCompliances = compList.filter((item) => {
        if (isComplianceFiled(item)) return false;
        const d = daysUntilDue(item);
        return d !== null && d < 0;
      });

      const criticalUnfiledCompliances = compList.filter((item) => {
        if (isComplianceFiled(item)) return false;
        return item.criticality === "Critical";
      });

      // Subtask 2 awaiting CFO review
      const cfoPendingReviews = compList.filter((item) => {
        return (
          item.subtasks?.[0]?.status === "completed" &&
          item.subtasks?.[1]?.status === "pending"
        );
      });

      const filedCount = compList.filter(isComplianceFiled).length;
      const totalCount = compList.length;
      const filingRate = totalCount > 0 ? Math.round((filedCount / totalCount) * 100) : 100;

      // Revenue and EBITDA
      const revenue = mis?.monthlyRevenue || pnl?.income?.revenueFromOperations || 0;
      const ebitdaMargin = mis?.ebitdaMarginPercent || pnl?.profitability?.ebitdaMarginPercent || 0;

      // Overall triage health
      let health: "smooth" | "attention" | "critical" = "smooth";
      if (overdueCompliances.length > 0 || redRatios.length > 1) {
        health = "critical";
      } else if (criticalUnfiledCompliances.length > 0 || alertRatios.length > 0 || cfoPendingReviews.length > 0) {
        health = "attention";
      }

      return {
        company: comp,
        detailed,
        bs,
        pnl,
        debtors,
        mis,
        compList,
        actionList,
        ratios,
        redRatios,
        alertRatios,
        overdueCompliances,
        criticalUnfiledCompliances,
        cfoPendingReviews,
        filedCount,
        totalCount,
        filingRate,
        revenue,
        ebitdaMargin,
        health,
      };
    });
  }, [companies, allCompliancesMap, allActionsMap, allMISMap, activeCompanyId, financialMIS]);

  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);
  const [expandedCriticalId, setExpandedCriticalId] = useState<string | null>(null);
  const [synopsisTab, setSynopsisTab] = useState<"all" | "signoffs" | "critical" | "actions">(
    "all",
  );


  // Compliances requiring Sub-task 2 (CFO Review)
  const cfoReviewQueue = (compliances || []).filter(
    (c) =>
      c?.subtasks && c.subtasks[0]?.status === "completed" && c.subtasks[1]?.status === "pending",
  );

  // Critical items approaching deadline (sorted by nextDueDate ascending)
  const criticalUpcoming = (compliances || [])
    .filter(
      (c) => c?.criticality === "Critical" && c.subtasks && c.subtasks[2]?.status !== "completed",
    )
    .sort(compareDueDates);

  const openActions = (actions || []).filter((a) => a && a.status !== "Completed");
  const totalSynopsisCount =
    cfoReviewQueue.length + Math.min(4, criticalUpcoming.length) + Math.min(4, openActions.length);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADING AREA: INDIVIDUAL COMPANY CARDS (Company-Wise Focus & Surveillance) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                Managed Client Entities
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Virtual CFO Company Command Desk
            </h1>
          </div>
        </div>

        {/* 3-Column Small Company Heading Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {companyCards.map((card) => {
            const isSelected = activeCompanyId === card.company.id;
            const isExpanded = expandedSummaryCompanyId === card.company.id;
            const totalAlerts = card.overdueCompliances.length + card.alertRatios.length + card.cfoPendingReviews.length;

            return (
              <div
                key={card.company.id}
                onClick={() => {
                  setSelectedCompanyId(card.company.id);
                  setCfoViewMode("single_company");
                }}
                className={`relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-indigo-50/70 via-white to-white border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  {/* Top Row: Company Name, Entity & Health Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-slate-900 text-sm tracking-tight truncate" title={card.company.companyName}>
                          {card.company.companyName}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">{card.company.legalEntity.split("(")[0].trim()}</span>
                        <span>·</span>
                        <span>{card.company.sector.split("/")[0].trim()}</span>
                      </div>
                    </div>

                    {/* Active Focus Pill or Health Indicator */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Active Desk</span>
                        </span>
                      ) : card.health === "critical" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          <span>Critical</span>
                        </span>
                      ) : card.health === "attention" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>Attention</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Smooth</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Vital Signals: Revenue & Filing Rate */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100">
                    <div className="bg-slate-50/80 rounded-lg p-2">
                      <div className="text-[10px] text-slate-500 font-medium">Revenue / EBITDA</div>
                      <div className="font-bold text-slate-900 font-mono mt-0.5 text-xs truncate">
                        {formatCrores(card.revenue)} <span className="text-[10px] text-emerald-700 font-semibold">({card.ebitdaMargin.toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-lg p-2">
                      <div className="text-[10px] text-slate-500 font-medium">Compliances Filed</div>
                      <div className="font-bold text-slate-900 font-mono mt-0.5 text-xs">
                        {card.filingRate}% <span className="text-[10px] text-slate-500 font-normal">({card.filedCount}/{card.totalCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Core Warning Triggers (Non-Compliances & Unfavourable Ratios) */}
                  <div className="mt-2.5 space-y-1.5 text-xs">
                    {/* Compliance Alert Line */}
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Statutory Compliances:</span>
                      {card.overdueCompliances.length > 0 ? (
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>{card.overdueCompliances.length} Overdue</span>
                        </span>
                      ) : card.criticalUnfiledCompliances.length > 0 ? (
                        <span className="font-semibold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{card.criticalUnfiledCompliances.length} Critical Due</span>
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>0 Overdue (Clean)</span>
                        </span>
                      )}
                    </div>

                    {/* Ratios Alert Line */}
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Financial Ratios:</span>
                      {card.redRatios.length > 0 ? (
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{card.redRatios.length} Unfavourable</span>
                        </span>
                      ) : card.alertRatios.length > 0 ? (
                        <span className="font-semibold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{card.alertRatios.length} Watch / Caution</span>
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>All In Benchmark</span>
                        </span>
                      )}
                    </div>

                    {/* CFO Review Queue Line */}
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Dual Sign-Off:</span>
                      {card.cfoPendingReviews.length > 0 ? (
                        <span className="font-bold text-indigo-700 flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-indigo-600" />
                          <span>{card.cfoPendingReviews.length} Awaiting CFO</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">All Signed Off</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extendable Summary Toggle Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSummaryCompanyId(isExpanded ? null : card.company.id);
                    }}
                    className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      isExpanded
                        ? "bg-slate-900 text-white"
                        : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    }`}
                  >
                    <span>{isExpanded ? "Collapse Summary" : "Expand Summary & Alerts"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {totalAlerts > 0 && !isExpanded && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {isSelected ? "Active Focus" : "Click to view data"}
                  </span>
                </div>

                {/* Extendable Summary Drawer / Details Panel */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-3 border-t border-slate-200/90 text-xs space-y-3 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl border-b border-x border-slate-200"
                  >
                    {/* 1. Critical & Overdue Compliances */}
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] mb-1.5 uppercase tracking-wider">
                        <AlertOctagon className="w-3 h-3 text-rose-600" />
                        <span>Critical &amp; Overdue Compliances</span>
                      </div>
                      {card.overdueCompliances.length > 0 || card.criticalUnfiledCompliances.length > 0 ? (
                        <div className="space-y-1.5">
                          {card.overdueCompliances.map((item) => (
                            <div key={item.id} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-0.5">
                              <div className="font-bold flex items-center justify-between">
                                <span>{item.name}</span>
                                <span className="text-rose-700 font-mono text-[10px] uppercase font-bold">OVERDUE</span>
                              </div>
                              <div className="text-rose-800 text-[10px]">
                                Due: {item.statutoryDueDate.split(";")[0]} · Category: {item.category}
                              </div>
                              <div className="text-rose-700 text-[10px] font-medium">
                                Bottleneck: {item.subtasks[1]?.status === "pending" ? "Subtask 2 (CFO Review) Pending" : item.subtasks[0]?.status === "pending" ? "Subtask 1 (Team Draft) Delayed" : "Subtask 3 (Payment & Filing)"}
                              </div>
                            </div>
                          ))}

                          {card.criticalUnfiledCompliances
                            .filter((item) => !card.overdueCompliances.includes(item))
                            .map((item) => (
                              <div key={item.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-0.5">
                                <div className="font-bold flex items-center justify-between">
                                  <span>{item.name}</span>
                                  <span className="text-amber-800 font-mono text-[10px] font-bold">CRITICAL DUE</span>
                                </div>
                                <div className="text-amber-800 text-[10px]">
                                  Due: {item.statutoryDueDate.split(";")[0]} · Category: {item.category}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>No overdue statutory filings. All compliances are up to date.</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Unfavourable & Alert Financial Ratios */}
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] mb-1.5 uppercase tracking-wider">
                        <Scale className="w-3 h-3 text-amber-600" />
                        <span>Unfavourable &amp; Alert Ratios</span>
                      </div>
                      {card.alertRatios.length > 0 ? (
                        <div className="space-y-1.5">
                          {card.alertRatios.slice(0, 3).map((r) => (
                            <div
                              key={r.id}
                              className={`p-2 rounded-lg text-[11px] border space-y-0.5 ${
                                r.status === "red"
                                  ? "bg-rose-50 border-rose-200 text-rose-900"
                                  : "bg-amber-50 border-amber-200 text-amber-900"
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{r.name}</span>
                                <span className="font-mono text-[10px]">
                                  {r.valueFormatted} <span className="font-normal opacity-70">(Target: {r.benchmarkFormatted})</span>
                                </span>
                              </div>
                              <p className="text-[10px] opacity-90 line-clamp-2">
                                {r.cfoObservation || r.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>All 19 financial ratios within optimal industry benchmarks.</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Button to Focus this company */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyId(card.company.id);
                        setCfoViewMode("single_company");
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Focus on {card.company.companyName.split(" ")[0]} Data Below</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Render Embedded Admin Panel if CFO selected Admin View, otherwise Company Workspace */}
      {cfoSubView === "admin" ? (
        <AdminPanel
          embedded={true}
          initialTab={adminInitialTab}
          onCloseEmbedded={() => setCfoSubView("operations")}
        />
      ) : (
        <>
          {/* 1. Unified Executive Master Header & Core KPI Strip (Clean Light Theme) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                    CFO Command Desk
                  </span>
                  <span>·</span>
                  <span className="font-medium text-slate-700">{financialMIS.period}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {clientProfile.companyName}
                </h1>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Prominent Monthly MIS Email to Client Button */}
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isMailed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40"
                  }`}
                  title="Approve Monthly Financial MIS & Dispatch Email to Client (CC CFO)"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isMailed ? "Monthly MIS Emailed ✓" : "Email Brief MIS to Client"}</span>
                </button>

                <a
                  href="#cfo-critical-synopsis"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 hover:text-slate-900 font-medium text-xs transition-colors"
                >
                  Pendencies
                </a>

                <button
                  onClick={() => setActiveTab("compliances")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Compliances</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("mis")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                >
                  Financial MIS
                </button>
              </div>
            </div>

            {/* Core CFO KPI Strip */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                onClick={() => setActiveTab("compliances")}
                className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors rounded-xl p-3.5 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Compliance Rate</span>
                  <span className="text-emerald-700 font-semibold font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                    {stats.overallCompliancePercentage >= 80 ? "Optimal" : "Active"}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {stats.overallCompliancePercentage}%
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats.fullyCompletedCompliances}/{stats.totalCompliances} statutory filings
                  closed
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>CFO Sign-Off Queue</span>
                  <span
                    className={`font-semibold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      cfoReviewQueue.length > 0
                        ? "bg-amber-50 text-amber-800"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {cfoReviewQueue.length > 0 ? "Pending" : "All Clear"}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {cfoReviewQueue.length}
                </div>
                <div className="text-[11px] text-slate-500">Subtask-2 drafts awaiting sign-off</div>
              </div>

              <div
                onClick={() => setActiveTab("mis")}
                className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors rounded-xl p-3.5 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Cash &amp; Runway</span>
                  <span className="text-indigo-700 font-semibold font-mono text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded">
                    {financialMIS.cashRunwayMonths}m Runway
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {formatCrores(financialMIS.cashAndBankBalance)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Burn: {formatLakhs(financialMIS.monthlyBurnRate, 1)}/mo
                </div>
              </div>

              <div
                onClick={() => setActiveTab("compliances")}
                className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors rounded-xl p-3.5 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Action Pendencies</span>
                  <span
                    className={`font-semibold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      stats.overdueActions > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {stats.overdueActions > 0 ? `${stats.overdueActions} Overdue` : "On Track"}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {stats.pendingActions + stats.inProgressActions}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stats.completedActions} closed · {stats.overdueActions} overdue
                </div>
              </div>
            </div>


          </div>

          {/* 2. Important Observations & Strategic Recommendations (Virtual CFO Directives) */}
          <CfoExecutiveInsightsPanel
            onOpenReportEditor={() => setIsReportEditorOpen(true)}
            onOpenApproveModal={() => setIsApproveModalOpen(true)}
          />

          {/* 3. All Important Financial Ratios & Visual Charts (Pie & Graph Presentation) */}
          <ClientFinancialRatios
            balanceSheet={activeBalanceSheet}
            pnl={activePnl}
            debtorAgeing={activeDebtorAgeing}
            financialMIS={financialMIS}
            compliances={compliances}
            clientProfile={clientProfile}
            onSelectStatementTab={() => setActiveTab("mis")}
          />

          {/* 3. Short 3-Column CFO Critical & Pending Synopsis */}
          <div
            id="cfo-critical-synopsis"
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Critical &amp; Pending Synopsis
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  · {totalSynopsisCount} priority items
                </span>
              </div>

              {/* Clean Segmented Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-lg self-start sm:self-center">
                {[
                  { key: "all", label: `All (${totalSynopsisCount})` },
                  { key: "signoffs", label: `CFO Sign-Offs (${cfoReviewQueue.length})` },
                  {
                    key: "critical",
                    label: `Critical Filings (${Math.min(4, criticalUpcoming.length)})`,
                  },
                  { key: "actions", label: `Actions (${Math.min(4, openActions.length)})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSynopsisTab(tab.key as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      synopsisTab === tab.key
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* At-a-Glance Synopsis Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
                <span className="text-slate-600 font-medium">1. CFO Sign-Off Queue</span>
                <span
                  className={`font-mono font-semibold text-[11px] ${
                    cfoReviewQueue.length > 0 ? "text-amber-800" : "text-emerald-700"
                  }`}
                >
                  {cfoReviewQueue.length > 0
                    ? `${cfoReviewQueue.length} Awaiting Approval`
                    : "All Signed Off"}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
                <span className="text-slate-600 font-medium">2. Critical Deadlines</span>
                <span className="font-mono font-semibold text-[11px] text-indigo-700">
                  {criticalUpcoming.length} Unfiled Critical
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
                <span className="text-slate-600 font-medium">3. Operational Actions</span>
                <span
                  className={`font-mono font-semibold text-[11px] ${
                    stats.overdueActions > 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {openActions.length} Open · {stats.overdueActions} Overdue
                </span>
              </div>
            </div>

            {/* 3-Column Synopsis Grid */}
            <div
              className={`grid grid-cols-1 ${
                synopsisTab === "all" ? "lg:grid-cols-3" : "lg:grid-cols-1"
              } gap-4`}
            >
              {/* Column 1: CFO Review & Sign-Off Synopsis */}
              {(synopsisTab === "all" || synopsisTab === "signoffs") && (
                <div className="bg-slate-50/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/60">
                    <span className="font-bold text-slate-800">1. CFO Sign-Off Queue</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {cfoReviewQueue.length} Pending
                    </span>
                  </div>

                  {cfoReviewQueue.length === 0 ? (
                    <div className="py-4 text-center text-xs text-emerald-700 font-medium flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All drafted filings signed off</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/50">
                      {cfoReviewQueue.map((comp) => {
                        const isExpanded = expandedQueueId === comp.id;
                        return (
                          <div key={comp.id} className="py-2 first:pt-0.5 last:pb-0.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={() => setExpandedQueueId(isExpanded ? null : comp.id)}
                                className="min-w-0 cursor-pointer group flex-1"
                              >
                                <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {comp.name}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {comp.category} · By {comp.subtasks[0].assignedTo}
                                  {comp.taxAmount ? ` · ${formatINR(comp.taxAmount)}` : ""}
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  toggleSubtask(
                                    comp.id,
                                    2,
                                    `Approved by ${clientProfile?.cfoName || "CFO"} post verification.`,
                                  )
                                }
                                className="px-2 py-1 rounded-md text-[10.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Sign Off</span>
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="pt-1.5">
                                <ComplianceInlineDetail
                                  compliance={comp}
                                  onClose={() => setExpandedQueueId(null)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Column 2: Critical Statutory Deadlines Synopsis */}
              {(synopsisTab === "all" || synopsisTab === "critical") && (
                <div className="bg-slate-50/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/60">
                    <span className="font-bold text-slate-800">2. Critical Deadlines</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Top {Math.min(4, criticalUpcoming.length)}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/50">
                    {criticalUpcoming.slice(0, 4).map((item) => {
                      const isCritExpanded = expandedCriticalId === item.id;
                      const doneCount = (item.subtasks || []).filter(
                        (s) => s && s.status === "completed",
                      ).length;
                      return (
                        <div key={item.id} className="py-2 first:pt-0.5 last:pb-0.5 space-y-1.5">
                          <div
                            onClick={() => setExpandedCriticalId(isCritExpanded ? null : item.id)}
                            className="flex items-center justify-between gap-2 cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.category} · Stage {doneCount}/3
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <DueDateBadge item={item} compact={true} />
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                            </div>
                          </div>

                          {isCritExpanded && (
                            <div className="pt-1.5">
                              <ComplianceInlineDetail
                                compliance={item}
                                onClose={() => setExpandedCriticalId(null)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Column 3: Operational Action Pendencies Synopsis */}
              {(synopsisTab === "all" || synopsisTab === "actions") && (
                <div className="bg-slate-50/70 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/60">
                    <span className="font-bold text-slate-800">3. Action Pendencies</span>
                    <button
                      onClick={() => setActiveTab("compliances")}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      View All ({openActions.length})
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200/50">
                    {openActions.slice(0, 4).map((act) => (
                      <div
                        key={act.id}
                        onClick={() => setActiveTab("compliances")}
                        className="py-2 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {act.assignedTo} · Due {act.fixedDeadline}
                          </p>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono shrink-0 ${
                            act.priority === "Urgent"
                              ? "bg-rose-50 text-rose-700"
                              : act.priority === "High"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-200/70 text-slate-700"
                          }`}
                        >
                          {act.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Monthly Financial MIS Email Dispatch & Approval Modal */}
      <ApproveAndDispatchMisModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        report={activeReport}
        onApprovedAndDispatched={(updatedReport) => {
          saveExecutiveReport(updatedReport);
          showToast(
            `Monthly MIS successfully dispatched to ${updatedReport.clientMailTo || clientProfile.email} with copy to ${updatedReport.cfoMailCc || currentUser?.email}!`,
          );
        }}
      />

      {/* Monthly MIS Email Dispatch Audit History Drawer */}
      <MonthlyMisDispatchLogModal
        isOpen={isDispatchLogModalOpen}
        onClose={() => setIsDispatchLogModalOpen(false)}
        companyId={activeCompanyId}
      />

      {/* CFO Executive Report & Observations Editor Modal */}
      {isReportEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  CFO Observations &amp; Executive Recommendations Editor — {clientProfile.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportEditorOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <CfoExecutiveReportEditor />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
