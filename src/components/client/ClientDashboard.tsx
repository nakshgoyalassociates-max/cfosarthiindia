// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { MetricCard } from "../common/MetricCard";
import { DueDateBadge } from "../common/DueDateBadge";
import {
  compareDueDates,
  isComplianceFiled,
  dueStatus,
  daysUntilDue,
  formatDueDate,
  nextDueDate,
} from "../../utils/dueDate";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";
import { ComplianceSubtaskProgressIcons } from "../common/ComplianceSubtaskProgressIcons";
import { ExpandableParagraph } from "../common/ExpandableParagraph";
import { ClientHealthVisuals } from "./ClientHealthVisuals";
import { ClientFinancialRatios } from "./ClientFinancialRatios";
import { ClientMisSynopsis } from "./ClientMisSynopsis";
import { ClientCriticalPendenciesRadar } from "./ClientCriticalPendenciesRadar";
import { ClientExecutiveReportView } from "./ClientExecutiveReportView";
import {
  NEXORA_BALANCE_SHEET,
  NEXORA_PNL_STATEMENT,
  NEXORA_DEBTOR_AGEING,
  NEXORA_FUND_FLOW,
  COMPANY_MIS_DETAILED,
} from "../../data/mockMisFinancials";
import {
  ShieldCheck,
  TrendingUp,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Lock,
  Building2,
  CheckSquare,
  BarChart3,
  Layers,
  ArrowRight,
  AlertTriangle,
  ReceiptText,
  Scale,
  ArrowRightLeft,
  Users,
  Calculator,
  Eye,
  ChevronDown,
  ChevronUp,
  Workflow,
  ShieldAlert,
  Mail,
  X,
} from "lucide-react";
import { ComplianceItem, ActionItem } from "../../types";
import { THEME_CONFIGS } from "../../utils/themeStyles";
import { computeRatios } from "../../utils/ratios";

type StatementTab = "balance-sheet" | "pnl" | "debtor-ageing" | "fund-flow" | "budget";

export const ClientDashboard: React.FC = () => {
  const {
    clientProfile,
    financialMIS,
    compliances,
    actions,
    stats,
    setSelectedCompliance,
    colorTheme,
    setActiveTab,
    executiveReports,
  } = useApp();

  const companyReports = (executiveReports && executiveReports[clientProfile.id]) || [];
  const activeReport = companyReports.find((r: any) => r.monthKey === "2026-09") || companyReports[0] || {};
  const isMailed = activeReport.isMailedToClient || activeReport.approvalStatus === "approved";

  const theme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.sapphire;

  const handlePrint = () => {
    window.print();
  };

  // Active detailed statement datasets for selected company
  const detailedCompanyData =
    COMPANY_MIS_DETAILED[clientProfile.id] || COMPANY_MIS_DETAILED["client-101"];
  const activeBalanceSheet =
    financialMIS.balanceSheet || detailedCompanyData.balanceSheet || NEXORA_BALANCE_SHEET;
  const activePnl =
    financialMIS.pnlStatement || detailedCompanyData.pnlStatement || NEXORA_PNL_STATEMENT;
  const activeDebtorAgeing =
    financialMIS.debtorAgeing || detailedCompanyData.debtorAgeing || NEXORA_DEBTOR_AGEING;
  const activeFundFlow = financialMIS.fundFlow || detailedCompanyData.fundFlow || NEXORA_FUND_FLOW;

  // Statement navigation within this single dashboard
  const [activeStatementTab, setActiveStatementTab] = useState<StatementTab>("balance-sheet");
  const [isStatementExpanded, setIsStatementExpanded] = useState<boolean>(true);
  const [drillDownAction, setDrillDownAction] = useState<ActionItem | null>(null);

  // Compute live ratios without hardcoded fallbacks
  const dashboardRatios = useMemo(() => {
    return computeRatios(
      activePnl,
      activeBalanceSheet,
      activeDebtorAgeing,
      financialMIS?.period,
      clientProfile?.ratioBenchmarks,
    );
  }, [
    activePnl,
    activeBalanceSheet,
    activeDebtorAgeing,
    financialMIS?.period,
    clientProfile?.ratioBenchmarks,
  ]);
  const currentRatioObj = dashboardRatios.find((r) => r.id === "current-ratio");
  const currentRatioLabel =
    currentRatioObj && !currentRatioObj.isMissing ? `${currentRatioObj.value} CR` : "n/a";

  // 1. Broad Compliance Statistics & Category Pulse
  const categories = [
    { name: "GST", label: "Goods & Services Tax", code: "GST" },
    { name: "TDS / TCS", label: "Tax Deducted at Source", code: "TDS / TCS" },
    { name: "Income Tax", label: "Corporate Income & Advance Tax", code: "Income Tax" },
    { name: "ROC / MCA", label: "Ministry of Corporate Affairs", code: "ROC / MCA" },
    { name: "PF / ESI", label: "Labor Laws & Employee Benefits", code: "PF / ESI" },
  ];

  const categorySummaries = categories.map((cat) => {
    const items = compliances.filter((c) => c.category === cat.code);
    const completed = items.filter(
      (c) => c.subtasks && c.subtasks[2]?.status === "completed",
    ).length;
    const totalSubtasks = items.length * 3;
    let completedSubtasks = 0;
    items.forEach((c) => {
      completedSubtasks += (c.subtasks || []).filter((s) => s && s.status === "completed").length;
    });
    const pct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return {
      ...cat,
      totalItems: items.length,
      completedItems: completed,
      progressPct: pct,
      status: pct === 100 ? "Fully Filed" : pct >= 66 ? "CFO Verified" : "In Progress",
    };
  });

  // Overall Compliance Rating & Statistics
  const totalCompliances = stats.totalCompliances || compliances.length || 35;
  const completedCompliances = stats.fullyCompletedCompliances || 0;

  // Overdue and Due-Soon critical items
  const overdueCompliances = useMemo(() => {
    return (compliances || []).filter(
      (c) => c && dueStatus(c) === "overdue" && !isComplianceFiled(c),
    );
  }, [compliances]);

  const dueSoonCompliances = useMemo(() => {
    return (compliances || []).filter(
      (c) => c && dueStatus(c) === "due-soon" && !isComplianceFiled(c),
    );
  }, [compliances]);

  // Overall Compliance Rating score (0 - 100)
  const complianceRatingScore = useMemo(() => {
    if (totalCompliances === 0) return 100;
    const basePct =
      stats.overallCompliancePercentage ||
      Math.round((completedCompliances / totalCompliances) * 100);
    const penaltyDeduction = overdueCompliances.length * 7;
    return Math.max(50, Math.min(100, basePct - penaltyDeduction));
  }, [
    totalCompliances,
    completedCompliances,
    stats.overallCompliancePercentage,
    overdueCompliances.length,
  ]);

  const complianceGrade = useMemo(() => {
    if (complianceRatingScore >= 92) {
      return {
        grade: "Grade A+",
        label: "Superior Standing • Audit-Ready",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      };
    }
    if (complianceRatingScore >= 82) {
      return {
        grade: "Grade A",
        label: "Strong Compliance • On-Track",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (complianceRatingScore >= 70) {
      return {
        grade: "Grade B",
        label: "Minor Pendencies • Attention Needed",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      };
    }
    return {
      grade: "Grade C",
      label: "Critical Risk • Penalty Exposure",
      badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    };
  }, [complianceRatingScore]);

  // Critical issues / pendencies for the client synopsis (overdue or next 7 days, max 4 items)
  const criticalComplianceItems = useMemo(() => {
    const list = (compliances || []).filter((c) => {
      if (!c || isComplianceFiled(c)) return false;
      const st = dueStatus(c);
      const days = daysUntilDue(c);
      return st === "overdue" || st === "due-soon" || (days !== null && days <= 7);
    });

    list.sort((a, b) => {
      const isOverdueA = dueStatus(a) === "overdue";
      const isOverdueB = dueStatus(b) === "overdue";
      if (isOverdueA && !isOverdueB) return -1;
      if (isOverdueB && !isOverdueA) return 1;
      return compareDueDates(a, b);
    });

    // Fallback: If no immediate overdue/due-soon, pick top 2 upcoming unfiled items for executive visibility
    if (list.length === 0) {
      return (compliances || [])
        .filter((c) => c && !isComplianceFiled(c))
        .sort(compareDueDates)
        .slice(0, 2);
    }

    return list.slice(0, 4);
  }, [compliances]);

  // 2. Operational Action Flow Synopsis & Critical Issues
  const totalActions = actions?.length || stats.totalActions || 0;
  const completedActions = stats.completedActions || 0;
  const openActionsCount = (actions || []).filter((a) => a && a.status !== "Completed").length;

  const blockedActions = useMemo(() => {
    return (actions || []).filter(
      (a) => a && a.status !== "Completed" && (a.status === "Blocked" || Boolean(a.blockedReason)),
    );
  }, [actions]);

  const urgentActions = useMemo(() => {
    return (actions || []).filter(
      (a) => a && a.status !== "Completed" && (a.priority === "Urgent" || a.priority === "High"),
    );
  }, [actions]);

  const operationalHealthScore = useMemo(() => {
    if (totalActions === 0) return 92;
    const rate = Math.round((completedActions / Math.max(1, totalActions)) * 100);
    return Math.max(70, Math.min(98, 75 + Math.round(rate * 0.23)));
  }, [completedActions, totalActions]);

  // Critical operational issues / pendencies for executive visibility (max 4 items)
  const criticalActionItems = useMemo(() => {
    const criticalList = (actions || []).filter((a) => {
      if (!a || a.status === "Completed") return false;
      const isOverdue =
        a.fixedDeadline &&
        !isNaN(new Date(a.fixedDeadline).getTime()) &&
        new Date(a.fixedDeadline) < new Date();
      return (
        a.priority === "Urgent" ||
        a.priority === "High" ||
        a.status === "Blocked" ||
        Boolean(a.blockedReason) ||
        isOverdue
      );
    });

    criticalList.sort((a, b) => {
      if (a.status === "Blocked" && b.status !== "Blocked") return -1;
      if (b.status === "Blocked" && a.status !== "Blocked") return 1;
      if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
      if (b.priority === "Urgent" && a.priority !== "Urgent") return 1;
      return 0;
    });

    if (criticalList.length === 0) {
      return (actions || []).filter((a) => a && a.status !== "Completed").slice(0, 3);
    }

    return criticalList.slice(0, 4);
  }, [actions]);

  // Handler from Financial Ratios to switch statement tab
  const handleSelectStatementTab = (tab: StatementTab) => {
    setActiveStatementTab(tab);
    setIsStatementExpanded(true);
    const elem = document.getElementById("core-statements");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* 1 & 2. Unified Executive Master Header & Core KPI Strip */}
      <div
        id="overview"
        className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs space-y-2.5 relative overflow-hidden"
      >
        {/* Top Header Glow Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${theme.topNavAccent}`} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10.5px] ${theme.heroTagBg} ${theme.heroTagText}`}
              >
                Executive Briefing
              </span>
              <span>·</span>
              <span className="font-medium text-slate-700">{financialMIS.period}</span>
              <span>·</span>
              <span className="text-[11px]">
                CFO: {clientProfile.cfoName} ({clientProfile.cfoFirm})
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {clientProfile.companyName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { href: "#financial-ratios", label: "Ratios" },
              { href: "#health-charts", label: "Health Charts" },
              { href: "#critical-pendencies", label: "Pendencies" },
              { href: "#executive-report", label: "CFO Summary" },
              { href: "#mis-synopsis", label: "MIS Synopsis" },
            ].map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 font-medium text-[11px] transition-colors"
              >
                {anchor.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => setActiveTab("mis")}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Go to Financial MIS Statements & Client Email Options"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Financial MIS</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Monthly Financial MIS Dispatch Alert Banner */}
        <div className="pt-2">
          {isMailed ? (
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-600 text-white shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-bold text-emerald-950">
                    Monthly Financial MIS Emailed:
                  </span>{" "}
                  <span className="text-emerald-800">
                    Approved on {activeReport.approvalDate || "Verified"} by {activeReport.approvedBy || clientProfile.cfoName} • Mailed to {activeReport.clientMailTo || clientProfile.email} (CC: {activeReport.cfoMailCc || clientProfile.cfoEmail || "CFO Desk"})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("mis")}
                className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px] shrink-0 cursor-pointer"
              >
                View Full MIS
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-600 text-white shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <span className="text-indigo-900 font-medium">
                  <strong>Monthly Financial MIS:</strong> Brief MIS with Executive Summary &amp; CFO Remarks is emailed to client on CFO approval.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("mis")}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Open Financial MIS
              </button>
            </div>
          )}
        </div>

        {/* Core Executive KPI Strip with Compact Boxes */}
        <div id="kpis" className="pt-2.5 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div
              id="metric-revenue"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.revenue.bg} ${theme.kpiCards.revenue.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>Revenue</span>
                <span className="text-emerald-700 font-semibold font-mono text-[9.5px]">
                  {financialMIS.revenueGrowthMoM >= 0 ? "+" : ""}
                  {financialMIS.revenueGrowthMoM}% MoM
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.revenue.statColor}`}
              >
                {formatLakhs(activePnl.income.totalIncome || financialMIS.monthlyRevenue)}
              </div>
              <div className={`text-[10px] ${theme.kpiCards.revenue.subText}`}>
                GP: {activePnl.profitability.grossMarginPercent || financialMIS.grossMarginPercent}%
              </div>
            </div>

            <div
              id="metric-ebitda"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.ebitda.bg} ${theme.kpiCards.ebitda.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>Op. EBITDA</span>
                <span className="text-indigo-600 font-semibold font-mono text-[9.5px]">
                  {activePnl.profitability.ebitdaMarginPercent || financialMIS.ebitdaMarginPercent}%
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.ebitda.statColor}`}
              >
                {formatLakhs(activePnl.profitability.ebitda || financialMIS.ebitda)}
              </div>
              <div className={`text-[10px] ${theme.kpiCards.ebitda.subText}`}>Core cash ops</div>
            </div>

            <div
              id="metric-pat"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.pat.bg} ${theme.kpiCards.pat.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>PAT (Net)</span>
                <span className="text-emerald-700 font-semibold font-mono text-[9.5px]">
                  {activePnl.profitability.patMarginPercent ||
                    ((financialMIS.netProfit / financialMIS.monthlyRevenue) * 100).toFixed(1)}
                  %
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.pat.statColor}`}
              >
                {formatLakhs(activePnl.profitability.pat || financialMIS.netProfit)}
              </div>
              <div className={`text-[10px] ${theme.kpiCards.pat.subText}`}>Bottom-line surplus</div>
            </div>

            <div
              id="metric-treasury"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.treasury.bg} ${theme.kpiCards.treasury.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>Treasury</span>
                <span className="text-sky-700 font-semibold font-mono text-[9.5px]">
                  {financialMIS.cashRunwayMonths.toFixed(1)}m Run
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.treasury.statColor}`}
              >
                {formatCrores(financialMIS.cashAndBankBalance)}
              </div>
              <div className={`text-[10px] ${theme.kpiCards.treasury.subText}`}>Bank &amp; FDs</div>
            </div>

            <div
              id="metric-working-capital"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.workingCapital.bg} ${theme.kpiCards.workingCapital.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>Working Cap</span>
                <span className="text-purple-700 font-semibold font-mono text-[9.5px]">
                  {currentRatioLabel}
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.workingCapital.statColor}`}
              >
                {formatCrores(financialMIS.workingCapital)}
              </div>
              <div className={`text-[10px] ${theme.kpiCards.workingCapital.subText}`}>
                DSO: {financialMIS.debtorDaysDSO}d
              </div>
            </div>

            <div
              id="metric-compliance-pct"
              className={`rounded-lg p-2.5 space-y-1 border shadow-2xs transition-all ${theme.kpiCards.compliance.bg} ${theme.kpiCards.compliance.border}`}
            >
              <div className="flex items-center justify-between text-[10px] text-emerald-800 font-medium">
                <span>Statutory</span>
                <span className="text-emerald-700 font-semibold font-mono text-[9.5px]">
                  {stats.fullyCompletedCompliances}/{stats.totalCompliances}
                </span>
              </div>
              <div
                className={`text-base font-bold font-mono tracking-tight ${theme.kpiCards.compliance.statColor}`}
              >
                {stats.overallCompliancePercentage}%
              </div>
              <div className={`text-[10px] ${theme.kpiCards.compliance.subText}`}>Zero penalty</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Important Financial Ratios & Percentage Graphs Linked with MIS (Placed on Top) */}
      <ClientFinancialRatios
        balanceSheet={activeBalanceSheet}
        pnl={activePnl}
        debtorAgeing={activeDebtorAgeing}
        financialMIS={financialMIS}
        compliances={compliances}
        clientProfile={clientProfile}
        onSelectStatementTab={handleSelectStatementTab}
      />

      {/* 3. Graphical Representation of Company Health (Placed on Top) */}
      <ClientHealthVisuals
        balanceSheet={activeBalanceSheet}
        pnl={activePnl}
        debtorAgeing={activeDebtorAgeing}
        financialMIS={financialMIS}
        compliances={compliances}
      />

      {/* 4. Short Synopsis of Critical Items & Pendencies */}
      <ClientCriticalPendenciesRadar
        criticalCompliances={criticalComplianceItems}
        criticalActions={criticalActionItems}
        onSelectCompliance={(comp) => setSelectedCompliance(comp)}
        onSelectAction={(action) => setDrillDownAction(action)}
      />

      {/* 5. Executive Summary from CFO Desk & Financial Observations */}
      <ClientExecutiveReportView />

      {/* 6. Executive MIS Synopsis (Month-at-a-Glance Summary - Not Detail Ledgers) */}
      <ClientMisSynopsis
        balanceSheet={activeBalanceSheet}
        pnl={activePnl}
        debtorAgeing={activeDebtorAgeing}
        fundFlow={activeFundFlow}
        financialMIS={financialMIS}
        clientProfile={clientProfile}
        compliances={compliances}
      />

      {/* Action Item Drill-Down Dossier Modal */}
      {drillDownAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    drillDownAction.status === "Blocked" || Boolean(drillDownAction.blockedReason)
                      ? "bg-rose-600 text-white"
                      : drillDownAction.priority === "Urgent"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {drillDownAction.status === "Blocked" ? "Blocked" : drillDownAction.priority}{" "}
                  Priority
                </span>
                <span className="text-xs font-mono text-slate-600 font-semibold">
                  {drillDownAction.category}
                </span>
              </div>
              <button
                onClick={() => setDrillDownAction(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {drillDownAction.title}
                </h3>
                {drillDownAction.description && (
                  <div className="mt-1.5">
                    <ExpandableParagraph
                      text={drillDownAction.description}
                      className="text-xs text-slate-600"
                    />
                  </div>
                )}
              </div>

              {drillDownAction.blockedReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Active Blocker Reason
                  </span>
                  <ExpandableParagraph
                    text={drillDownAction.blockedReason}
                    className="text-xs text-rose-700"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[10.5px] block font-medium">
                    Assigned To
                  </span>
                  <span className="font-semibold text-slate-800">{drillDownAction.assignedTo}</span>
                  <span className="text-[10px] text-slate-500 block">
                    ({drillDownAction.assignedRole || "Finance Ops"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px] block font-medium">
                    Target Deadline
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {drillDownAction.fixedDeadline || "End of Month"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px] block font-medium">Status</span>
                  <span className="font-semibold text-slate-800">{drillDownAction.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px] block font-medium">Cadence</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    Check-in every {drillDownAction.checkInCadenceDays || 2}d
                  </span>
                </div>
              </div>

              {drillDownAction.remarks && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-indigo-900 block text-[11px]">
                    CFO Action Directive & Notes
                  </span>
                  <ExpandableParagraph
                    text={drillDownAction.remarks}
                    className="text-slate-600 text-[11.5px]"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Milestone Progress</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {drillDownAction.progressPercentage ||
                      (drillDownAction.status === "Completed" ? 100 : 35)}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      drillDownAction.status === "Blocked" || Boolean(drillDownAction.blockedReason)
                        ? "bg-rose-500"
                        : (drillDownAction.progressPercentage || 35) >= 75
                          ? "bg-emerald-500"
                          : "bg-indigo-500"
                    }`}
                    style={{
                      width: `${drillDownAction.progressPercentage || (drillDownAction.status === "Completed" ? 100 : 35)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDrillDownAction(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
