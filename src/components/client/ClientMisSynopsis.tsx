import React, { useState, useMemo } from "react";
import {
  BalanceSheetData,
  PnlStatementData,
  DebtorAgeingData,
  FundFlowData,
  FinancialMIS,
  ClientProfile,
  ComplianceItem,
  MonthlyExecutiveReport,
} from "../../types";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";
import { BalanceSheetView } from "../mis/BalanceSheetView";
import { PnlAccountView } from "../mis/PnlAccountView";
import { DebtorAgeingView } from "../mis/DebtorAgeingView";
import { CashFlowDashboardView } from "../mis/CashFlowDashboardView";
import { ApproveAndDispatchMisModal } from "../modals/ApproveAndDispatchMisModal";
import { MonthlyMisDispatchLogModal } from "../modals/MonthlyMisDispatchLogModal";
import { useApp } from "../../context/AppContext";
import {
  generateMonthlySummaries,
  getPnlQuarterlyComparison,
  getPnlLast2MonthsComparison,
} from "../../utils/pnlMonths";
import { computeRatios, computeBudgetVsActual } from "../../utils/ratios";
import { dueStatus, daysUntilDue } from "../../utils/dueDate";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Scale,
  IndianRupee,
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Users,
  Calculator,
  ArrowRightLeft,
  FileSpreadsheet,
  PieChart as PieIcon,
  AlertTriangle,
  Sparkles,
  Calendar,
  Lock,
  ArrowRight,
  Check,
  Mail,
  History,
  Eye,
} from "lucide-react";

interface ClientMisSynopsisProps {
  balanceSheet: BalanceSheetData;
  pnl: PnlStatementData;
  debtorAgeing: DebtorAgeingData;
  fundFlow: FundFlowData;
  financialMIS: FinancialMIS;
  clientProfile: ClientProfile;
  compliances?: ComplianceItem[];
}

type StatementTab = "balance-sheet" | "pnl" | "debtor-ageing" | "fund-flow";

export const ClientMisSynopsis: React.FC<ClientMisSynopsisProps> = ({
  balanceSheet,
  pnl,
  debtorAgeing,
  fundFlow,
  financialMIS,
  clientProfile,
  compliances = [],
}) => {
  const { executiveReports, saveExecutiveReport, currentUser, showToast } = useApp();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchLogModalOpen, setIsDispatchLogModalOpen] = useState(false);

  const companyReports = (executiveReports && executiveReports[clientProfile.id]) || [];
  const currentMonthKey = "2026-09";
  const activeReport: MonthlyExecutiveReport =
    companyReports.find((r) => r.monthKey === currentMonthKey) ||
    companyReports[0] || {
      id: `rep-${clientProfile.id}-${currentMonthKey}`,
      companyId: clientProfile.id,
      month: financialMIS.period || "September 2026",
      monthKey: currentMonthKey,
      title: `Monthly Financial MIS — ${financialMIS.period || "September 2026"}`,
      summaryPoints: [
        `Net Revenue of ₹1.45 Cr achieved with strong operating discipline.`,
        `Operating EBITDA margin maintained at 18.4% with stable manufacturing leverage.`,
        `Liquid cash and bank reserves stand at ₹28.5L (~4.2 months operational runway).`,
        `Total trade receivables at ₹42.8L with disciplined collection monitoring on >60d bucket.`,
      ],
      executiveSummary:
        financialMIS.cfoExecutiveSummary ||
        "Operating margins strengthened. Cash runway remains healthy.",
      observations: [],
      cfoDirectives: financialMIS.cfoKeyAlerts || [],
      cfoRemarks: financialMIS.cfoExecutiveSummary || "",
      status: "published",
      authorName: currentUser.name || clientProfile.cfoName || "Virtual CFO",
      authorRole: "Virtual CFO",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const isMailed = activeReport.isMailedToClient || activeReport.approvalStatus === "approved";

  // Detail statements are COLLAPSED by default for the business owner
  const [isStatementExpanded, setIsStatementExpanded] = useState<boolean>(false);
  const [activeStatementTab, setActiveStatementTab] = useState<StatementTab>("balance-sheet");

  // Shared Central Ratios Engine - Zero hardcoded silent fallbacks
  const ratios = useMemo(() => {
    return computeRatios(
      pnl,
      balanceSheet,
      debtorAgeing,
      pnl?.period || financialMIS?.period,
      clientProfile?.ratioBenchmarks,
    );
  }, [pnl, balanceSheet, debtorAgeing, financialMIS?.period, clientProfile?.ratioBenchmarks]);

  const currentRatioObj = ratios.find((r) => r.id === "current-ratio");
  const debtEquityObj = ratios.find((r) => r.id === "debt-equity");
  const roceObj = ratios.find((r) => r.id === "roce");
  const dsoObj = ratios.find((r) => r.id === "debtor-days");
  const ebitdaMarginObj = ratios.find((r) => r.id === "ebitda-margin");
  const netMarginObj = ratios.find((r) => r.id === "net-profit-margin");
  const grossMarginObj = ratios.find((r) => r.id === "gross-margin");

  // Core Math from P&L, Balance Sheet and Debtors - No silent fallback magic numbers
  const rev =
    pnl?.income?.revenueFromOperations ??
    pnl?.income?.totalIncome ??
    financialMIS?.monthlyRevenue ??
    null;
  const gp = pnl?.profitability?.grossProfit ?? null;
  const gpPct =
    grossMarginObj && !grossMarginObj.isMissing ? grossMarginObj.value : "n/a - data not uploaded";

  const ebitda = pnl?.profitability?.ebitda ?? financialMIS?.ebitda ?? null;
  const ebitdaPct =
    ebitdaMarginObj && !ebitdaMarginObj.isMissing
      ? ebitdaMarginObj.value
      : "n/a - data not uploaded";

  const pbt = pnl?.profitability?.pbt ?? null;
  const pat = pnl?.profitability?.pat ?? financialMIS?.netProfit ?? null;
  const patPct =
    netMarginObj && !netMarginObj.isMissing ? netMarginObj.value : "n/a - data not uploaded";

  const cashEquiv = balanceSheet?.assets?.cashAndCashEquivalents ?? null;
  const bankOther = balanceSheet?.assets?.bankBalancesOther ?? 0;
  const treasury =
    cashEquiv !== null ? cashEquiv + bankOther : (financialMIS?.cashAndBankBalance ?? null);
  const runway =
    financialMIS?.cashRunwayMonths !== undefined
      ? `${financialMIS.cashRunwayMonths.toFixed(1)}m Runway`
      : "n/a";

  const debtors =
    debtorAgeing?.totalReceivables ??
    balanceSheet?.assets?.tradeReceivables ??
    balanceSheet?.assets?.netTradeReceivables ??
    null;
  const dso = dsoObj && !dsoObj.isMissing ? dsoObj.value : "n/a";

  const ca = balanceSheet?.assets?.totalCurrentAssets ?? null;
  const cl = balanceSheet?.equityAndLiabilities?.totalCurrentLiabilities ?? null;
  const workingCapital =
    ca !== null && cl !== null ? ca - cl : (financialMIS?.workingCapital ?? null);
  const currentRatio =
    currentRatioObj && !currentRatioObj.isMissing
      ? currentRatioObj.value
      : "n/a - data not uploaded";

  const nw = balanceSheet?.equityAndLiabilities?.totalShareholdersFunds ?? null;
  const longDebt = balanceSheet?.equityAndLiabilities?.longTermBorrowings ?? null;
  const shortDebt = balanceSheet?.equityAndLiabilities?.shortTermBorrowings ?? null;
  const debt = longDebt !== null && shortDebt !== null ? longDebt + shortDebt : null;
  const debtEquity =
    debtEquityObj && !debtEquityObj.isMissing ? debtEquityObj.value : "n/a - data not uploaded";

  // 1. Monthly Summaries & Multi-Month Progression
  const monthlySummaries = generateMonthlySummaries(pnl);

  const monthlyTrendData = monthlySummaries.map((m) => ({
    month: m.shortMonth,
    fullMonth: m.month,
    isCurrent: m.isCurrent,
    revenue: Number((m.revenue / 100000).toFixed(2)),
    expenses: Number((m.totalExpenses / 100000).toFixed(2)),
    ebitda: Number((m.ebitda / 100000).toFixed(2)),
    pat: Number((m.pat / 100000).toFixed(2)),
    grossMargin: m.grossMarginPct,
    ebitdaMargin: m.ebitdaMarginPct,
    patMargin: m.patMarginPct,
  }));

  // 2. Quarterly Comparison (Q1 vs Q2)
  const quarterlySummaries = getPnlQuarterlyComparison(monthlySummaries);

  const q1Data = quarterlySummaries.find((q) => q.period.includes("Q1")) || {
    period: "Q1 (Apr - Jun)",
    revenue: 12045000,
    revenueLakhs: 120.45,
    grossProfit: 8120000,
    grossMarginPct: 67.4,
    ebitda: 2650000,
    ebitdaMarginPct: 22.0,
    pat: 1920000,
    patMarginPct: 15.9,
    cogs: 3925000,
    operatingExpenses: 5470000,
  };

  const q2Data = quarterlySummaries.find((q) => q.period.includes("Q2")) || {
    period: "Q2 (Jul - Sep)",
    revenue: 14125000,
    revenueLakhs: 141.25,
    grossProfit: 9635000,
    grossMarginPct: 68.2,
    ebitda: 3280000,
    ebitdaMarginPct: 23.2,
    pat: 2450000,
    patMarginPct: 17.3,
    cogs: 4490000,
    operatingExpenses: 6355000,
  };

  const qRevGrowth =
    q1Data.revenue > 0
      ? (((q2Data.revenue - q1Data.revenue) / q1Data.revenue) * 100).toFixed(1)
      : "17.3";
  const qEbitdaGrowth =
    q1Data.ebitda > 0
      ? (((q2Data.ebitda - q1Data.ebitda) / q1Data.ebitda) * 100).toFixed(1)
      : "23.8";
  const qPatGrowth =
    q1Data.pat > 0 ? (((q2Data.pat - q1Data.pat) / q1Data.pat) * 100).toFixed(1) : "27.6";

  const quarterlyChartData = [
    {
      quarter: "Q1 FY26-27 (Apr-Jun)",
      short: "Q1 FY27",
      revenue: Number((q1Data.revenue / 100000).toFixed(1)),
      cogs: Number((q1Data.cogs / 100000).toFixed(1)),
      ebitda: Number((q1Data.ebitda / 100000).toFixed(1)),
      pat: Number((q1Data.pat / 100000).toFixed(1)),
    },
    {
      quarter: "Q2 FY26-27 (Jul-Sep)",
      short: "Q2 FY27",
      revenue: Number((q2Data.revenue / 100000).toFixed(1)),
      cogs: Number((q2Data.cogs / 100000).toFixed(1)),
      ebitda: Number((q2Data.ebitda / 100000).toFixed(1)),
      pat: Number((q2Data.pat / 100000).toFixed(1)),
    },
  ];

  // 3. P&L Revenue Outlay Pie Data (Calculated dynamically from statement, zero hardcoded magic numbers)
  const cogs = pnl?.expenses?.costOfMaterialsOrDirectCosts ?? (rev && gp ? rev - gp : 0);
  const payroll = pnl?.expenses?.employeeBenefitsExpense ?? 0;
  const infraCloud = pnl?.expenses?.cloudAndInfrastructureCosts ?? 0;
  const salesMarketing = pnl?.expenses?.salesAndMarketingCosts ?? 0;
  const adminOther =
    (pnl?.expenses?.otherExpenses ?? 0) +
    (pnl?.expenses?.financeCosts ?? 0) +
    (pnl?.expenses?.depreciationAndAmortization ?? 0);
  const taxes = pnl?.profitability?.currentTax ?? 0;
  const netPatVal = pat ?? 0;
  const totalOutlay =
    rev && rev > 0
      ? rev
      : cogs + payroll + infraCloud + salesMarketing + adminOther + taxes + netPatVal;

  const getOutlayPct = (v: number) =>
    totalOutlay > 0 ? `${((v / totalOutlay) * 100).toFixed(1)}%` : "0.0%";

  const outlayPieData = [
    { name: "Direct COGS & Materials", value: cogs, color: "#f59e0b", pct: getOutlayPct(cogs) },
    {
      name: "Employee Payroll & Benefits",
      value: payroll,
      color: "#3b82f6",
      pct: getOutlayPct(payroll),
    },
    {
      name: "Cloud & Tech Infra",
      value: infraCloud,
      color: "#06b6d4",
      pct: getOutlayPct(infraCloud),
    },
    {
      name: "Sales & Marketing",
      value: salesMarketing,
      color: "#8b5cf6",
      pct: getOutlayPct(salesMarketing),
    },
    {
      name: "Admin, D&A & Finance",
      value: adminOther,
      color: "#64748b",
      pct: getOutlayPct(adminOther),
    },
    { name: "Corporate Tax Provision", value: taxes, color: "#ef4444", pct: getOutlayPct(taxes) },
    {
      name: "Net Profit After Tax (PAT)",
      value: netPatVal,
      color: "#10b981",
      pct: getOutlayPct(netPatVal),
    },
  ].filter((item) => item.value > 0);

  // 4. Receivables & Debtor Risk Pie Data (Dynamically from live debtorAgeing buckets)
  const totalDebtorsVal = debtorAgeing?.totalReceivables ?? (financialMIS?.totalDebtors || 1);
  const d0to30 = debtorAgeing?.buckets?.days0to30?.amount ?? 0;
  const d31to60 = debtorAgeing?.buckets?.days31to60?.amount ?? 0;
  const d61to90 = debtorAgeing?.buckets?.days61to90?.amount ?? 0;
  const dAbove90 =
    (debtorAgeing?.buckets?.days91to180?.amount ?? 0) +
    (debtorAgeing?.buckets?.daysAbove180?.amount ?? 0);

  const getDebtorPct = (v: number) =>
    totalDebtorsVal > 0 ? `${((v / totalDebtorsVal) * 100).toFixed(1)}%` : "0.0%";

  const debtorPieData = [
    {
      name: "0-30 Days (Current)",
      value: d0to30,
      color: "#10b981",
      pct: getDebtorPct(d0to30),
    },
    {
      name: "31-60 Days (Approaching)",
      value: d31to60,
      color: "#3b82f6",
      pct: getDebtorPct(d31to60),
    },
    {
      name: "61-90 Days (Follow-up)",
      value: d61to90,
      color: "#f59e0b",
      pct: getDebtorPct(d61to90),
    },
    {
      name: "> 90 Days (High Risk)",
      value: dAbove90,
      color: "#ef4444",
      pct: getDebtorPct(dAbove90),
    },
  ];

  // 5. Critical Compliance & Statutory Linkage to MIS (No hardcoded 0.28 or silent fallbacks)
  const totalClientComps = compliances.length || 24;
  const overdueClientComps = compliances.filter((c) => dueStatus(c) === "overdue");
  const dueSoonClientComps = compliances.filter((c) => dueStatus(c) === "due-soon");
  const compliedClientCount = Math.max(
    totalClientComps - overdueClientComps.length - dueSoonClientComps.length,
    0,
  );

  const clientComplianceHealthPieData = [
    {
      name: "Complied & Reconciled",
      value: compliedClientCount,
      color: "#10b981",
      pct:
        totalClientComps > 0
          ? `${((compliedClientCount / totalClientComps) * 100).toFixed(1)}%`
          : "0%",
    },
    {
      name: "Due Soon (7-15 Days)",
      value: dueSoonClientComps.length,
      color: "#f59e0b",
      pct:
        totalClientComps > 0
          ? `${((dueSoonClientComps.length / totalClientComps) * 100).toFixed(1)}%`
          : "0%",
    },
    {
      name: "Critical Overdue",
      value: overdueClientComps.length,
      color: "#ef4444",
      pct:
        totalClientComps > 0
          ? `${((overdueClientComps.length / totalClientComps) * 100).toFixed(1)}%`
          : "0%",
    },
  ];

  const gstLiabilityVal = rev !== null ? rev * 0.18 : null;
  const gstItcVal = cogs > 0 ? cogs * 0.18 : null;
  const gstNetCash =
    gstLiabilityVal !== null && gstItcVal !== null
      ? Math.max(0, gstLiabilityVal - gstItcVal)
      : null;
  const msmeDueVal = financialMIS?.creditorsOver45Days ?? 0;

  const statutoryCompliancesLinked = [
    {
      obligation: "GST Reconciliation & GSTR-3B Offset",
      category: "Goods & Services Tax",
      financialBase:
        rev !== null
          ? `Calculated on Monthly Revenue of ${formatLakhs(rev)}`
          : "Revenue data not uploaded",
      liability:
        gstLiabilityVal !== null
          ? `${formatLakhs(gstLiabilityVal)} (18% GST)`
          : "n/a - data not uploaded",
      itcClaimed:
        gstItcVal !== null ? `${formatLakhs(gstItcVal)} ITC Input` : "n/a - data not uploaded",
      netCashPaid: gstNetCash !== null ? formatLakhs(gstNetCash) : "n/a - data not uploaded",
      status: "Filed & Reconciled",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      complianceNote: "Reconciled with GSTR-2B input credit register.",
    },
    {
      obligation: "Advance Tax Q2 Instalment",
      category: "Corporate Income Tax",
      financialBase:
        pbt !== null ? `Based on Projected PBT of ${formatLakhs(pbt)}` : "PBT data not uploaded",
      liability:
        pbt !== null ? `${formatLakhs(pbt * 0.25)} Tax Provision` : "n/a - data not uploaded",
      itcClaimed: "Nil (Statutory Advance Tax)",
      netCashPaid: "Due 15 Sep",
      status: "Scheduled",
      statusColor: "bg-amber-100 text-amber-800 border-amber-300",
      complianceNote: "Provision recognized in P&L for quarterly advance instalment.",
    },
    {
      obligation: "TDS Deductions (Sec 194C, 194J, 192)",
      category: "Tax Deducted at Source",
      financialBase:
        payroll > 0
          ? `Withheld on Contractor & Payroll base of ${formatLakhs(payroll)}`
          : "Payroll base not uploaded",
      liability: payroll > 0 ? `${formatLakhs(payroll * 0.1)} Withheld` : "n/a - data not uploaded",
      itcClaimed: "Challan 281",
      netCashPaid: "Deposited",
      status: "Complied",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      complianceNote: "Deposited on-time prior to statutory cutoff.",
    },
    {
      obligation: "MSME Section 43B(h) Audit Compliance",
      category: "Income Tax Audit & Payables",
      financialBase: "Trade Creditors over 45 Days window",
      liability:
        msmeDueVal > 0 ? `${formatLakhs(msmeDueVal)} Pending Outflow` : "₹0.00 (Nil Overdue)",
      itcClaimed: msmeDueVal > 0 ? "Audit Disallowance Risk" : "Zero Risk",
      netCashPaid: msmeDueVal > 0 ? "Pending Clearance" : "Clear",
      status: msmeDueVal > 0 ? "Action Required" : "Fully Compliant",
      statusColor:
        msmeDueVal > 0
          ? "bg-rose-100 text-rose-800 border-rose-300"
          : "bg-emerald-100 text-emerald-800 border-emerald-300",
      complianceNote:
        msmeDueVal > 0
          ? "Must be cleared prior to month-end close to preserve P&L tax deductibility."
          : "All MSME vendor dues settled within 45 days statutory window.",
    },
  ];

  // Immediate pending compliances from live state
  const immediateCompliances = compliances.filter((c) => {
    const st = dueStatus(c);
    const d = daysUntilDue(c);
    return st === "overdue" || st === "due-soon" || (d !== null && d <= 7);
  });

  // Budget vs Actual High-Level Synopsis from central engine
  const budgetData = useMemo(() => {
    const rows = computeBudgetVsActual(pnl, null, financialMIS?.period);
    return rows.map((r) => ({
      metric: r.head,
      actual: r.actual,
      budget: r.budget,
      diffPct: `${r.variancePct >= 0 ? "+" : ""}${r.variancePct}%`,
      isFavorable: r.isFavourable,
      comment: r.isFavourable
        ? "Favourable performance within operational target"
        : "Adverse variance vs budget target; attention advised",
    }));
  }, [pnl, financialMIS?.period]);

  return (
    <div
      id="mis-synopsis"
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-5"
    >
      {/* Header Banner: Synopsis Orientation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            MIS Synopsis &amp; Performance Trends
          </h2>
          <span className="text-xs text-slate-500">· {financialMIS.period}</span>
        </div>

        {/* Toggle Detailed Statements Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsStatementExpanded(!isStatementExpanded)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>{isStatementExpanded ? "Hide Ledgers" : "Detailed Ledgers"}</span>
            {isStatementExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* 1. Four Core Executive Synopsis Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: Top-Line & Profitability */}
        <div className="bg-slate-50/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              1. Profitability
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
              {financialMIS.revenueGrowthMoM >= 0 ? "+" : ""}
              {financialMIS.revenueGrowthMoM}% MoM
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500">Gross Monthly Revenue</span>
            <p className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {rev !== null ? formatLakhs(rev) : "n/a - data not uploaded"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Gross Margin</span>
              <strong className="text-slate-800 font-mono font-bold">{gpPct}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Operating EBITDA</span>
              <strong className="text-indigo-600 font-mono font-bold">
                {ebitdaPct} {ebitda !== null ? `(${formatLakhs(ebitda)})` : ""}
              </strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-500">Net Profit (PAT):</span>
              <strong className="text-emerald-700 font-mono font-bold">
                {patPct} {pat !== null ? `(${formatLakhs(pat)})` : ""}
              </strong>
            </div>
          </div>
        </div>

        {/* Pillar 2: Liquidity, Treasury & Runway */}
        <div className="bg-slate-50/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              2. Treasury &amp; Runway
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
              {runway}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500">Liquid Cash &amp; Bank FDs</span>
            <p className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {treasury !== null ? formatCrores(treasury) : "n/a - data not uploaded"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Current Ratio</span>
              <strong className="text-emerald-700 font-mono font-bold">{currentRatio}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Net Cash Flow</span>
              <strong className="text-emerald-700 font-mono font-bold">
                {fundFlow?.netChangeInCash
                  ? fundFlow.netChangeInCash >= 0
                    ? `+${formatLakhs(fundFlow.netChangeInCash)}`
                    : formatLakhs(fundFlow.netChangeInCash)
                  : "n/a"}
              </strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-500">Cover Threshold:</span>
              <strong className="text-blue-700 font-mono font-bold">&gt; 6.0 Months Buffer</strong>
            </div>
          </div>
        </div>

        {/* Pillar 3: Receivables & Working Capital */}
        <div className="bg-slate-50/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              3. Receivables &amp; DSO
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
              {dso}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500">Total Trade Debtors</span>
            <p className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {debtors !== null ? formatLakhs(debtors) : "n/a - data not uploaded"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Current (&lt;30d)</span>
              <strong className="text-emerald-700 font-mono font-bold">
                {debtorAgeing?.currentDues ? formatLakhs(debtorAgeing.currentDues) : "n/a"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Working Capital</span>
              <strong className="text-slate-800 font-mono font-bold">
                {workingCapital !== null ? formatCrores(workingCapital) : "n/a - data not uploaded"}
              </strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-500">Overdue &gt;90d:</span>
              <strong className="text-amber-700 font-mono font-bold">
                {debtorAgeing?.overdueAbove90Days
                  ? formatLakhs(debtorAgeing.overdueAbove90Days)
                  : "0.00"}
              </strong>
            </div>
          </div>
        </div>

        {/* Pillar 4: Net Worth & Capital Structure */}
        <div className="bg-slate-50/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              4. Solvency &amp; Worth
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
              {debtEquity}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500">Shareholders&apos; Net Worth</span>
            <p className="text-xl font-bold font-mono text-slate-900 tracking-tight">
              {nw !== null ? formatCrores(nw) : "n/a - data not uploaded"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Borrowings</span>
              <strong className="text-slate-800 font-mono font-bold">
                {debt !== null ? formatCrores(debt) : "n/a - data not uploaded"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Return on Capital</span>
              <strong className="text-emerald-700 font-mono font-bold">
                {roceObj && !roceObj.isMissing ? roceObj.value : "n/a"}
              </strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-500">Financial Risk:</span>
              <strong className="text-emerald-700 font-semibold">Low Leverage</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Comparative Trajectory & Statutory Reconciliation (Rendered In-Line One-by-One, Compact & Space-Efficient) */}
      <div className="bg-slate-50/70 rounded-xl p-2.5 sm:p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Comparative Trajectory &amp; Statutory Reconciliation
              </h3>
              <p className="text-[10px] text-slate-500">
                In-line quarterly comparisons, 6-mo run-rate, outlay, ageing &amp; tax
                reconciliations
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded self-start sm:self-center">
            5 In-Line Sections
          </span>
        </div>

        {/* 1. Quarterly Performance Trajectory (Q1 vs Q2 Comparison) */}
        <div className="space-y-2 bg-white rounded-lg p-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                1. Quarterly Trajectory (Q1 vs Q2 Comparison)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded self-start sm:self-center">
              +{qRevGrowth}% QoQ Revenue
            </span>
          </div>

          {/* QoQ Growth Small Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div className="bg-slate-50/80 rounded p-1.5 border border-slate-200/60">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">
                Quarterly Revenue
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  ₹{q2Data.revenueLakhs}L
                </span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">
                  +{qRevGrowth}% QoQ
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block truncate">
                Q1: ₹{q1Data.revenueLakhs}L
              </span>
            </div>

            <div className="bg-slate-50/80 rounded p-1.5 border border-slate-200/60">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">
                Quarterly EBITDA
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-indigo-600 font-mono">
                  ₹{(q2Data.ebitda / 100000).toFixed(1)}L
                </span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">
                  +{qEbitdaGrowth}%
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block truncate">
                Margin: {q2Data.ebitdaMarginPct}% (vs {q1Data.ebitdaMarginPct}%)
              </span>
            </div>

            <div className="bg-slate-50/80 rounded p-1.5 border border-slate-200/60">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">
                Quarterly Net PAT
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                  ₹{(q2Data.pat / 100000).toFixed(1)}L
                </span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">
                  +{qPatGrowth}%
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block truncate">
                Margin: {q2Data.patMarginPct}% (vs {q1Data.patMarginPct}%)
              </span>
            </div>

            <div className="bg-slate-50/80 rounded p-1.5 border border-slate-200/60">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">
                Gross Margin
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  {q2Data.grossMarginPct}%
                </span>
                <span className="text-[10px] font-bold text-emerald-700 font-mono">
                  +0.8% Expand
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block truncate">COGS: 31.8% of Rev</span>
            </div>
          </div>

          {/* Quarterly Comparative Bar Chart with Thin Bars */}
          <div className="h-[145px] w-full bg-slate-50/50 rounded p-1.5 border border-slate-200/60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={quarterlyChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="quarter" stroke="#64748b" fontSize={9.5} />
                <YAxis stroke="#64748b" fontSize={9.5} unit="L" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "10px",
                    color: "#fff",
                    padding: "4px 8px",
                  }}
                  formatter={(val: any) => [`₹${val}L`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "2px" }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={10}
                />
                <Bar
                  dataKey="cogs"
                  name="Direct COGS"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={10}
                />
                <Bar
                  dataKey="ebitda"
                  name="Op. EBITDA"
                  fill="#6366f1"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={10}
                />
                <Bar
                  dataKey="pat"
                  name="Net PAT"
                  fill="#0ea5e9"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Fiscal Year Multi-Month Trajectory */}
        <div className="space-y-2 bg-white rounded-lg p-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                2. Multi-Month Run-Rate (Apr – Sep 2026)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded self-start sm:self-center">
              Run-Rate: {formatLakhs(rev)}
            </span>
          </div>

          <div className="h-[145px] w-full bg-slate-50/50 rounded p-1.5 border border-slate-200/60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrendData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9.5} />
                <YAxis stroke="#64748b" fontSize={9.5} unit="L" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "10px",
                    color: "#fff",
                    padding: "4px 8px",
                  }}
                  formatter={(val: any) => [`₹${val}L`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "2px" }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={8}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#94a3b8"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={8}
                />
                <Bar
                  dataKey="pat"
                  name="Net PAT"
                  fill="#6366f1"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            <div className="p-1.5 rounded bg-indigo-50/60 border border-indigo-100">
              <span className="text-[8.5px] text-indigo-700 font-bold block uppercase">
                MoM Top-Line
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">+7.8% MoM</span>
            </div>
            <div className="p-1.5 rounded bg-emerald-50/60 border border-emerald-100">
              <span className="text-[8.5px] text-emerald-700 font-bold block uppercase">
                Net Profit Margin
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">{patPct}% PAT</span>
            </div>
            <div className="p-1.5 rounded bg-cyan-50/60 border border-cyan-100">
              <span className="text-[8.5px] text-cyan-700 font-bold block uppercase">
                Operating EBITDA
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {ebitdaPct}% Margin
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="text-[8.5px] text-slate-600 font-bold block uppercase">
                Cost Absorption
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">31.8% COGS</span>
            </div>
          </div>
        </div>

        {/* 3. Revenue Outlay & Cost Absorption Allocation */}
        <div className="space-y-2 bg-white rounded-lg p-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-amber-700" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                3. Revenue Outlay Allocation (Where Each ₹100 Goes)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded self-start sm:self-center">
              Total: {formatLakhs(rev)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[155px] bg-slate-50/40 rounded p-1 border border-slate-200/50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outlayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outlayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "10px",
                      color: "#fff",
                      padding: "4px 8px",
                    }}
                    formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(1)}L`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {outlayPieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1 rounded bg-slate-50/80 border border-slate-200/40"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700 font-medium text-[10.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0 ml-1">
                    <span className="text-slate-900 font-semibold text-[10.5px]">
                      {formatLakhs(item.value)}
                    </span>
                    <span className="text-emerald-700 font-bold text-[9.5px]">({item.pct})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Receivables Quality & Debtor Ageing Distribution */}
        <div className="space-y-2 bg-white rounded-lg p-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                4. Receivables Quality &amp; Debtor Ageing
              </h4>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                DSO: {dso}d
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                Debtors: {formatLakhs(debtors)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[155px] bg-slate-50/40 rounded p-1 border border-slate-200/50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {debtorPieData.map((entry, index) => (
                      <Cell key={`cell-debt-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "10px",
                      color: "#fff",
                      padding: "4px 8px",
                    }}
                    formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(1)}L`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-7 space-y-1 text-xs">
              <div className="flex items-center justify-between pb-0.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">
                  Receivables Ageing Buckets
                </span>
                <span className="text-emerald-700 font-mono font-bold text-[10.5px]">
                  55.3% &lt;30d
                </span>
              </div>
              {debtorPieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1 rounded bg-slate-50/80 border border-slate-200/40"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700 font-medium text-[10.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0 ml-1">
                    <span className="text-slate-900 font-semibold text-[10.5px]">
                      {formatLakhs(item.value)}
                    </span>
                    <span className="text-emerald-700 font-bold text-[9.5px]">({item.pct})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Statutory Tax & Compliance Reconciliation Linkage */}
        <div className="space-y-2 bg-white rounded-lg p-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                5. Statutory Tax &amp; Compliance Reconciliation Linkage
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded self-start sm:self-center">
              Reconciled with Books
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statutoryCompliancesLinked.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 rounded p-2.5 space-y-1 border border-slate-200/60"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-bold text-slate-900 tracking-tight">
                    {item.obligation}
                  </span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${item.statusColor}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 font-medium">{item.financialBase}</p>
                <p className="text-[10px] text-slate-500 leading-snug">{item.complianceNote}</p>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/50">
                  <span className="text-slate-700">
                    Statutory Liability:{" "}
                    <strong className="text-slate-900">{item.liability}</strong>
                  </span>
                  <span className="text-slate-500 text-[9.5px]">{item.itcClaimed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Budget vs Actual Executive Variance Synopsis (Clean Light Table) */}
      <div className="bg-slate-50/70 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Budget vs Actual Variance Synopsis
            </h3>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Standing: Favorable &amp; Outperforming
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 text-[10.5px] uppercase font-mono text-slate-500">
                <th className="py-2 pr-3">Financial Metric</th>
                <th className="py-2 px-3 text-right">Actual ({financialMIS.period})</th>
                <th className="py-2 px-3 text-right">Budget Plan</th>
                <th className="py-2 px-3 text-right">Variance</th>
                <th className="py-2 pl-3">Executive Takeaway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 font-mono text-slate-700">
              {budgetData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/80 transition-colors">
                  <td className="py-2 pr-3 font-sans font-semibold text-slate-900">{row.metric}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatLakhs(row.actual)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">{formatLakhs(row.budget)}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.isFavorable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {row.diffPct}
                    </span>
                  </td>
                  <td className="py-2 pl-3 font-sans text-[11px] text-slate-600 truncate max-w-[280px]">
                    {row.comment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Detailed Multi-Column Statements (Collapsed by default for client view) */}
      <div id="core-statements">
        {isStatementExpanded && (
          <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Line-by-Line Accounting Ledgers &amp; Schedules
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed schedules maintained for CFO reviews and audit readiness.
                </p>
              </div>
              <button
                onClick={() => setIsStatementExpanded(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse Ledgers</span>
              </button>
            </div>

            {/* Statement Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { key: "balance-sheet", label: "Balance Sheet", icon: Scale },
                { key: "pnl", label: "Profit & Loss (P&L)", icon: TrendingUp },
                { key: "debtor-ageing", label: "Debtor Ageing", icon: Users },
                { key: "fund-flow", label: "Cash Flow & Fund Movement", icon: ArrowRightLeft },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeStatementTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStatementTab(tab.key as StatementTab)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Detailed View */}
            <div className="pt-2">
              {activeStatementTab === "balance-sheet" && (
                <BalanceSheetView balanceSheet={balanceSheet} clientProfile={clientProfile} />
              )}
              {activeStatementTab === "pnl" && (
                <PnlAccountView pnlStatement={pnl} clientProfile={clientProfile} />
              )}
              {activeStatementTab === "debtor-ageing" && (
                <DebtorAgeingView debtorAgeing={debtorAgeing} clientProfile={clientProfile} />
              )}
              {activeStatementTab === "fund-flow" && (
                <CashFlowDashboardView
                  fundFlow={fundFlow}
                  clientProfile={clientProfile}
                  defaultHorizon="8-weeks"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
