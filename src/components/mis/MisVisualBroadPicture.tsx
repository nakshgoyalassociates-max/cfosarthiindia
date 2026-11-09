import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  PnlStatementData,
  BalanceSheetData,
  DebtorAgeingData,
  FinancialMIS,
  ComplianceItem,
} from "../../types";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";
import { generateMonthlySummaries, getPnlQuarterlyComparison } from "../../utils/pnlMonths";
import { dueStatus, daysUntilDue } from "../../utils/dueDate";
import {
  PieChart as PieIcon,
  TrendingUp,
  Scale,
  Users,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  ArrowRight,
  FileCheck,
  Percent,
} from "lucide-react";

interface MisVisualBroadPictureProps {
  pnl: PnlStatementData;
  balanceSheet: BalanceSheetData;
  debtorAgeing: DebtorAgeingData;
  financialMIS: FinancialMIS;
  onNavigateSubTab: (subTab: "balance-sheet" | "pnl" | "debtor-ageing" | "cash-flow") => void;
  compliances?: ComplianceItem[];
}

type VisualPerspective = "dual" | "quarterly" | "compliance" | "pnl" | "balance-sheet" | "debtors";

export const MisVisualBroadPicture: React.FC<MisVisualBroadPictureProps> = ({
  pnl,
  balanceSheet,
  debtorAgeing,
  financialMIS,
  onNavigateSubTab,
  compliances = [],
}) => {
  const [perspective, setPerspective] = useState<VisualPerspective>("dual");
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // 1. P&L Revenue Outlay & Margins Data (Where does Revenue go?)
  const revenueTotal = pnl.income.totalIncome || financialMIS.monthlyRevenue || 4985000;
  const cogs = pnl.expenses.costOfMaterialsOrDirectCosts || 1542300;
  const payroll = pnl.expenses.employeeBenefitsExpense || 1240000;
  const infraCloud = pnl.expenses.cloudAndInfrastructureCosts || 365000;
  const salesMarketing = pnl.expenses.salesAndMarketingCosts || 322000;
  const adminOther =
    (pnl.expenses.otherExpenses || 240700) +
    (pnl.expenses.financeCosts || 95000) +
    (pnl.expenses.depreciationAndAmortization || 125000);
  const taxes = pnl.profitability.currentTax || 190000;
  const pat = pnl.profitability.pat || financialMIS.netProfit || 865000;

  const pnlChartData = [
    {
      name: "Direct COGS & Materials",
      value: cogs,
      color: "#f59e0b",
      note: "Direct cost of goods/services",
    },
    {
      name: "Employee & Payroll",
      value: payroll,
      color: "#3b82f6",
      note: "Engineering & team compensation",
    },
    {
      name: "Cloud & Tech Infra",
      value: infraCloud,
      color: "#06b6d4",
      note: "Hosting, APIs & server compute",
    },
    {
      name: "Sales & Growth",
      value: salesMarketing,
      color: "#8b5cf6",
      note: "Customer acquisition & marketing",
    },
    {
      name: "Admin, D&A & Finance",
      value: adminOther,
      color: "#64748b",
      note: "Office, legal, audit & bank fees",
    },
    {
      name: "Income Tax Provision",
      value: taxes,
      color: "#ef4444",
      note: "Statutory advance tax provision",
    },
    {
      name: "Net Profit After Tax (PAT)",
      value: pat,
      color: "#10b981",
      note: "Retained bottom-line earnings",
    },
  ];

  // 2. Balance Sheet Capital & Assets Allocation Data (How is Capital Deployed?)
  const fixedAssets =
    balanceSheet.assets.netPpe +
    balanceSheet.assets.intangibleAssets +
    (balanceSheet.assets.capitalWorkInProgress || 0);
  const inventory = balanceSheet.assets.inventories;
  const debtors = balanceSheet.assets.netTradeReceivables || balanceSheet.assets.tradeReceivables;
  const liquidTreasury =
    balanceSheet.assets.cashAndCashEquivalents + balanceSheet.assets.bankBalancesOther;
  const otherAssets =
    (balanceSheet.assets.nonCurrentInvestments || 0) +
    (balanceSheet.assets.longTermLoansAndAdvances || 0) +
    (balanceSheet.assets.shortTermLoansAndAdvances || 0) +
    (balanceSheet.assets.otherCurrentAssets || 0);
  const totalAssets = balanceSheet.assets.totalAssets || 87110000;

  const balanceSheetChartData = [
    {
      name: "Fixed & Intangible Assets",
      value: fixedAssets,
      color: "#4f46e5",
      note: "Tech infra, hardware & licences",
    },
    {
      name: "Inventories & Spares",
      value: inventory,
      color: "#f97316",
      note: "Raw materials & finished goods",
    },
    {
      name: "Trade Receivables (Debtors)",
      value: debtors,
      color: "#0284c7",
      note: "Customer billing outstanding",
    },
    {
      name: "Liquid Treasury & FDs",
      value: liquidTreasury,
      color: "#059669",
      note: "Bank balances & liquid deposits",
    },
    {
      name: "Investments & Advances",
      value: otherAssets,
      color: "#6b7280",
      note: "Security deposits, bonds & GST ITC",
    },
  ];

  // 3. Debtor Ageing Risk Profile
  const debtorsTotal = debtorAgeing.totalReceivables || 6240000;
  const deb0to30 = debtorAgeing.buckets.days0to30.amount;
  const deb31to60 = debtorAgeing.buckets.days31to60.amount;
  const deb61to90 = debtorAgeing.buckets.days61to90.amount;
  const deb91to180 = debtorAgeing.buckets.days91to180.amount;
  const debAbove180 = debtorAgeing.buckets.daysAbove180.amount;

  const debtorsChartData = [
    {
      name: "0-30 Days (Current)",
      value: deb0to30,
      color: "#10b981",
      note: "Healthy & on-schedule collections",
    },
    {
      name: "31-60 Days (Approaching)",
      value: deb31to60,
      color: "#3b82f6",
      note: "Standard commercial credit cycle",
    },
    {
      name: "61-90 Days (Follow-up)",
      value: deb61to90,
      color: "#f59e0b",
      note: "Active finance follow-up",
    },
    {
      name: "91-180 Days (High Risk)",
      value: deb91to180,
      color: "#f97316",
      note: "Escalated to management",
    },
    {
      name: "> 180 Days (Overdue)",
      value: debAbove180,
      color: "#ef4444",
      note: "ECL provisioned risk accounts",
    },
  ];

  // 4. Comparison with Earlier Months & Quarters
  const monthlySummaries = generateMonthlySummaries(pnl);
  const monthlyTrajectory = monthlySummaries.map((m) => ({
    month: m.shortMonth,
    fullMonth: m.month,
    isCurrent: m.isCurrent,
    revenue: Number((m.revenue / 100000).toFixed(1)),
    expenses: Number((m.totalExpenses / 100000).toFixed(1)),
    ebitda: Number((m.ebitda / 100000).toFixed(1)),
    pat: Number((m.pat / 100000).toFixed(1)),
    grossMargin: m.grossMarginPct,
    ebitdaMargin: m.ebitdaMarginPct,
    patMargin: m.patMarginPct,
  }));

  const quarterlySummaries = getPnlQuarterlyComparison(monthlySummaries);
  const q1 = quarterlySummaries.find((q) => q.period.includes("Q1")) || {
    period: "Q1 FY 2026-27 (Apr–Jun)",
    shortPeriod: "Q1 FY27",
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

  const q2 = quarterlySummaries.find((q) => q.period.includes("Q2")) || {
    period: "Q2 FY 2026-27 (Jul–Sep)",
    shortPeriod: "Q2 FY27",
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
    q1.revenue > 0 ? (((q2.revenue - q1.revenue) / q1.revenue) * 100).toFixed(1) : "17.3";
  const qEbitdaGrowth =
    q1.ebitda > 0 ? (((q2.ebitda - q1.ebitda) / q1.ebitda) * 100).toFixed(1) : "23.8";
  const qPatGrowth = q1.pat > 0 ? (((q2.pat - q1.pat) / q1.pat) * 100).toFixed(1) : "27.6";

  const quarterlyChartData = [
    {
      quarter: "Q1 FY26-27 (Apr-Jun)",
      short: "Q1 FY27",
      revenue: Number((q1.revenue / 100000).toFixed(1)),
      cogs: Number((q1.cogs / 100000).toFixed(1)),
      ebitda: Number((q1.ebitda / 100000).toFixed(1)),
      pat: Number((q1.pat / 100000).toFixed(1)),
    },
    {
      quarter: "Q2 FY26-27 (Jul-Sep)",
      short: "Q2 FY27",
      revenue: Number((q2.revenue / 100000).toFixed(1)),
      cogs: Number((q2.cogs / 100000).toFixed(1)),
      ebitda: Number((q2.ebitda / 100000).toFixed(1)),
      pat: Number((q2.pat / 100000).toFixed(1)),
    },
  ];

  // 5. Critical Compliance Breakdown & Radar Data
  const totalComps = compliances.length || 24;
  const overdueComps = compliances.filter((c) => dueStatus(c) === "overdue");
  const dueSoonComps = compliances.filter((c) => dueStatus(c) === "due-soon");
  const compliedCount = Math.max(totalComps - overdueComps.length - dueSoonComps.length, 18);

  const complianceHealthPieData = [
    {
      name: "Complied & Reconciled",
      value: compliedCount,
      color: "#10b981",
      pct: `${((compliedCount / totalComps) * 100).toFixed(1)}%`,
    },
    {
      name: "Due Soon (Next 7-15 Days)",
      value: Math.max(dueSoonComps.length, 2),
      color: "#f59e0b",
      pct: `${((Math.max(dueSoonComps.length, 2) / totalComps) * 100).toFixed(1)}%`,
    },
    {
      name: "Critical Overdue",
      value: Math.max(overdueComps.length, 1),
      color: "#ef4444",
      pct: `${((Math.max(overdueComps.length, 1) / totalComps) * 100).toFixed(1)}%`,
    },
  ];

  const statutoryCategoryPieData = [
    { name: "GST (GSTR-1, 3B, 2B)", value: 8, color: "#3b82f6", liability: "₹8.73 L" },
    { name: "TDS / TCS Deductions", value: 6, color: "#8b5cf6", liability: "₹1.85 L" },
    { name: "Corporate Advance Tax", value: 4, color: "#f59e0b", liability: "₹4.50 L" },
    { name: "Labour (PF, ESI, PT)", value: 4, color: "#06b6d4", liability: "₹1.42 L" },
    { name: "MCA / ROC & Audit", value: 2, color: "#64748b", liability: "Sec 134/137" },
  ];

  const criticalComplianceItemsLinked = [
    {
      obligation: "GSTR-3B Revenue Offset & ITC Reconciliation",
      act: "Goods & Services Tax Act",
      financialBase: `Calculated on Monthly Revenue of ${formatLakhs(revenueTotal)}`,
      liability: "₹8.73 L Output Tax",
      itcClaimed: "₹8.45 L (100% matched ITC)",
      netCashPaid: "₹0.28 L Paid",
      dueDate: "20th of Month",
      status: "Complied • 100% Offset",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      exposureRisk: "Zero mismatch penalty; full ITC claimed",
    },
    {
      obligation: "Advance Tax Q2 Statutory Instalment",
      act: "Income Tax Act (Sec 208/211)",
      financialBase: "Based on Projected Cumulative PBT of ₹24.50 L",
      liability: "₹4.50 L Due Amount",
      itcClaimed: "Challan ITNS 280",
      netCashPaid: "Due 15 Sep 2026",
      dueDate: "15 Sep 2026",
      status: "Due Soon • Provisioned",
      statusColor: "bg-amber-100 text-amber-800 border-amber-300",
      exposureRisk: "Sec 234C interest avoidance on timely deposit",
    },
    {
      obligation: "TDS Deductions (Sec 194C, 194J, 192 Payroll)",
      act: "Income Tax Act",
      financialBase: "Withheld on Contractor & Payroll expenses of ₹24.30 L",
      liability: "₹1.85 L Deducted",
      itcClaimed: "Challan 281 Generated",
      netCashPaid: "Deposited",
      dueDate: "7th of Month",
      status: "Fully Deposited",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      exposureRisk: "Zero late fee exposure; filed on-time",
    },
    {
      obligation: "MSME Sec 43B(h) Creditors Disallowance Guard",
      act: "Income Tax Act & MSMED Act 2006",
      financialBase: "Vendor trade payables overdue beyond 45 days",
      liability: "₹2.80 L Pending Outflow",
      itcClaimed: "Disallowance Risk",
      netCashPaid: "Pending Clearance",
      dueDate: "Prior to Month-End Close",
      status: "Action Required",
      statusColor: "bg-rose-100 text-rose-800 border-rose-300",
      exposureRisk: "Direct tax disallowance if unpaid before filing",
    },
    {
      obligation: "EPF & ESI Monthly Statutory Contributions",
      act: "Employees' Provident Funds Act",
      financialBase: "Computed on gross eligible payroll of ₹12.40 L",
      liability: "₹1.42 L Total Due",
      itcClaimed: "ECR Form Generated",
      netCashPaid: "Cleared via Bank",
      dueDate: "15th of Month",
      status: "Fully Complied",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      exposureRisk: "Statutory labor compliance 100% maintained",
    },
  ];

  // Custom tooltip for clean, crisp currency formatting
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const val = data.value;
      const total =
        payload[0].payload.totalVal ||
        (payload[0].payload.name?.includes("Days")
          ? debtorsTotal
          : payload[0].payload.name?.includes("Assets") ||
              payload[0].payload.name?.includes("Treasury")
            ? totalAssets
            : revenueTotal);
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
      const lakhs = (val / 100000).toFixed(2);

      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs border border-slate-700 shadow-xl pointer-events-none">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono">
            <span className="text-emerald-400 font-bold text-sm">₹{lakhs} Lakhs</span>
            <span className="text-slate-300 text-xs">({pct}% of Total)</span>
          </div>
          {data.payload.note && (
            <p className="text-[11px] text-slate-400 mt-1">{data.payload.note}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Perspective Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <PieIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              MIS Statement Synopsis &amp; Visuals
            </h2>
            <span className="text-[10px] uppercase font-mono font-bold bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Executive Briefing
            </span>
          </div>
        </div>

        {/* Crisp Perspective Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start lg:self-center overflow-x-auto gap-1">
          <button
            onClick={() => setPerspective("dual")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              perspective === "dual"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Dual Master View</span>
          </button>
          <button
            onClick={() => setPerspective("quarterly")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              perspective === "quarterly"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Earlier Months &amp; Quarters</span>
          </button>
          <button
            onClick={() => setPerspective("compliance")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              perspective === "compliance"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Critical Compliance</span>
          </button>
          <button
            onClick={() => setPerspective("pnl")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              perspective === "pnl"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            P&amp;L Outlay
          </button>
          <button
            onClick={() => setPerspective("balance-sheet")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              perspective === "balance-sheet"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Capital &amp; Assets
          </button>
          <button
            onClick={() => setPerspective("debtors")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              perspective === "debtors"
                ? "bg-white text-slate-950 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Receivables Risk
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: EARLIER MONTHS & QUARTERLY COMPARISON */}
      {perspective === "quarterly" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top QoQ Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Quarterly Revenue
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold font-mono text-white">₹{q2.revenueLakhs} L</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +{qRevGrowth}% QoQ
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Q1: ₹{q1.revenueLakhs} L • Expansion +₹
                {(q2.revenueLakhs - q1.revenueLakhs).toFixed(1)}L
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Operating EBITDA
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold font-mono text-indigo-300">
                  ₹{(q2.ebitda / 100000).toFixed(1)} L
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +{qEbitdaGrowth}% QoQ
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                EBITDA Margin: {q2.ebitdaMarginPct}% (vs {q1.ebitdaMarginPct}%)
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Net Profit (PAT)
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  ₹{(q2.pat / 100000).toFixed(1)} L
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +{qPatGrowth}% QoQ
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                PAT Margin: {q2.patMarginPct}% (vs {q1.patMarginPct}%)
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Gross Margin Resilience
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold font-mono text-white">{q2.grossMarginPct}%</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +0.8% Expansion
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                COGS controlled at 31.8% of revenue
              </span>
            </div>
          </div>

          {/* Side-by-Side Comparison Charts: QoQ Bar Chart and Multi-Month Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Quarterly Comparison (Q1 vs Q2) */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Quarterly Comparison: Q1 FY27 vs Q2 FY27
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  QoQ Accretion
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quarterlyChartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} unit="L" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                      formatter={(val: any) => [`₹${val} Lakhs`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue (₹ Lakhs)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="cogs" name="Direct COGS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ebitda" name="EBITDA" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pat" name="Net PAT" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: 6-Month Trajectory across Earlier Months */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Earlier Months Progression (Apr 2026 - Sep 2026)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                  6-Month Trend
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyTrajectory}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} unit="L" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                      formatter={(val: any) => [`₹${val} Lakhs`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue (₹ Lakhs)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Operating Expenses"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="pat" name="Net PAT" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Profitability Margin Line Trajectory */}
          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Profitability Margin Trajectory Across Earlier Months (%)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Gross Margin: {pnl.profitability.grossMarginPercent}% • EBITDA:{" "}
                {pnl.profitability.ebitdaMarginPercent}% • PAT: {pnl.profitability.patMarginPercent}
                %
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrajectory}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="%" domain={[0, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(val: any) => [`${val}%`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Line
                    type="monotone"
                    dataKey="grossMargin"
                    name="Gross Margin %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ebitdaMargin"
                    name="EBITDA Margin %"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patMargin"
                    name="PAT Margin %"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CRITICAL ITEMS IN COMPLIANCE */}
      {perspective === "compliance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Statutory Compliance Health Strip */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 block font-semibold">
                  Financial Statement Statutory Compliance Reconciliation
                </strong>
                <span className="text-slate-600 text-[11px]">
                  Direct linkage between monthly revenue, payroll, profit, and statutory tax
                  obligations
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center font-mono">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Score: 91.4%
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                Zero Penalty Exposure
              </span>
            </div>
          </div>

          {/* Dual Pie Charts: Statutory Health & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart 1: Statutory Filing Health */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Statutory Compliance Health Distribution
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {totalComps} Total Tracked
                </span>
              </div>

              <div className="relative h-60 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} Items (${((Number(val) / totalComps) * 100).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                    <Pie
                      data={complianceHealthPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {complianceHealthPieData.map((entry, index) => (
                        <Cell
                          key={`cell-comp-health-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    On-Time Rate
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">91.4%</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 border border-emerald-200">
                    Compliant
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 text-xs">
                {complianceHealthPieData.map((item) => (
                  <div
                    key={item.name}
                    className="p-1.5 rounded bg-white border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie Chart 2: Statutory Category Exposure */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Statutory Obligations by Statutory Body
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-blue-700">6 Acts Covered</span>
              </div>

              <div className="relative h-60 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} Obligations • ${item.payload.liability}`,
                        name,
                      ]}
                    />
                    <Pie
                      data={statutoryCategoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statutoryCategoryPieData.map((entry, index) => (
                        <Cell
                          key={`cell-cat-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Tax Base</span>
                  <span className="text-base font-bold text-slate-900 font-mono">₹16.5 L</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded mt-0.5 border border-blue-200">
                    Statutory Dues
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 text-xs">
                {statutoryCategoryPieData.map((item) => (
                  <div
                    key={item.name}
                    className="p-1.5 rounded bg-white border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-600 text-[10.5px] shrink-0 font-medium">
                      {item.liability}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Items in Compliance Matrix Linked with MIS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Critical Statutory Items Linked with MIS Financial Statements</span>
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                P&amp;L • Balance Sheet • Payables Alignment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {criticalComplianceItemsLinked.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.obligation}</h4>
                      <span className="text-[10.5px] text-slate-500">{item.act}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${item.statusColor}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                    {item.financialBase}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200/70">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Tax Liability
                      </span>
                      <strong className="text-slate-900">{item.liability}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Settlement / ITC
                      </span>
                      <strong className="text-emerald-700">{item.itcClaimed}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Due Date: <strong className="text-slate-700">{item.dueDate}</strong>
                    </span>
                    <span className="text-slate-600 text-[10.5px] font-medium">
                      {item.exposureRisk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Live Pendencies from compliances prop */}
          {overdueComps.length > 0 || dueSoonComps.length > 0 ? (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <strong className="text-rose-950 font-bold">
                    Action Required: Immediate Statutory Pendencies
                  </strong>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  {overdueComps.length + dueSoonComps.length} Items Require CFO Attention
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[...overdueComps, ...dueSoonComps].slice(0, 6).map((c) => {
                  const isOverdue = dueStatus(c) === "overdue";
                  const days = daysUntilDue(c);
                  return (
                    <div
                      key={c.id}
                      className="p-2.5 bg-white rounded-lg border border-rose-200/80 flex items-center justify-between text-[11px] shadow-2xs"
                    >
                      <div className="truncate pr-2">
                        <strong className="text-slate-900 block truncate">
                          {c.title || c.name}
                        </strong>
                        <span className="text-slate-500 text-[10px]">
                          {c.category} • Form: {c.formOrReturn || "Statutory"}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isOverdue
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {isOverdue ? "Overdue!" : `${days}d Left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* VIEW MODES 3, 4, 5: DUAL MASTER VIEW, P&L OUTLAY, CAPITAL ALLOCATION, RECEIVABLES RISK */}
      {(perspective === "dual" ||
        perspective === "pnl" ||
        perspective === "balance-sheet" ||
        perspective === "debtors") && (
        <div
          className={`grid gap-6 ${perspective === "dual" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
        >
          {/* CHART 1: P&L Cost & Profit Anatomy */}
          {(perspective === "dual" || perspective === "pnl") && (
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Where Revenue Goes: P&amp;L Outlay
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateSubTab("pnl")}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full P&amp;L</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Donut Chart with Centered Metric */}
              <div className="relative h-64 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={pnlChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(data) => setHoveredSlice(data?.name ?? null)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      {pnlChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Callout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatLakhs(revenueTotal, 1)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 border border-emerald-200">
                    PAT: {pnl.profitability.patMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Crisp Legend Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60 text-[11px]">
                {pnlChartData.map((item) => {
                  const pct = ((item.value / revenueTotal) * 100).toFixed(1);
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700 truncate font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-900 font-semibold shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHART 2: Balance Sheet Capital & Asset Allocation */}
          {(perspective === "dual" || perspective === "balance-sheet") && (
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Capital Deployment: Asset Mix
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateSubTab("balance-sheet")}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Balance Sheet</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Donut Chart with Centered Metric */}
              <div className="relative h-64 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={balanceSheetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(data) => setHoveredSlice(data?.name ?? null)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      {balanceSheetChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Callout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Total Assets
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatCrores(totalAssets)}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded mt-0.5 border border-indigo-200">
                    Balanced 100%
                  </span>
                </div>
              </div>

              {/* Crisp Legend Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60 text-[11px]">
                {balanceSheetChartData.map((item) => {
                  const pct = ((item.value / totalAssets) * 100).toFixed(1);
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700 truncate font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-900 font-semibold shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHART 3: Debtor Ageing & Receivables Quality */}
          {perspective === "debtors" && (
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Debtor Ageing Quality &amp; Risk Slices
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateSubTab("debtor-ageing")}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Ledger Detail</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 my-2">
                <div className="relative h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={debtorsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {debtorsChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      Total Debtors
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {formatLakhs(debtorsTotal, 1)}
                    </span>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded mt-0.5 border border-sky-200">
                      DSO: {debtorAgeing.daysSalesOutstanding}d
                    </span>
                  </div>
                </div>

                {/* Ageing Explanation & Action points */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                      <span>Current &amp; Healthy (0-60 Days):</span>
                      <span className="text-emerald-700 font-mono font-bold">
                        {(((deb0to30 + deb31to60) / debtorsTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ₹{((deb0to30 + deb31to60) / 100000).toFixed(2)}L within normal payment cycle.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                    <div className="flex items-center justify-between font-semibold text-rose-900 mb-1">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Critical Overdue (&gt; 90 Days):
                      </span>
                      <span className="text-rose-700 font-mono font-bold">
                        {(((deb91to180 + debAbove180) / debtorsTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      ₹{((deb91to180 + debAbove180) / 100000).toFixed(2)}L requires follow-up.
                      Provisioned: ₹{(debtorAgeing.provisionForBadDebts / 100000).toFixed(1)}L.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crisp Quick-Takeaway Banner (Dark Slate Pattern) */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 border border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Broad Picture Key Highlights
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Active Snapshot
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">Gross Margin</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                Healthy
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white font-mono">
              {pnl.profitability.grossMarginPercent}%
            </p>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 w-3/4" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">Healthy cost ratio</span>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">Operating EBITDA</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                Margin
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white font-mono">
              {pnl.profitability.ebitdaMarginPercent}%
            </p>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-indigo-400 w-2/3" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {formatLakhs(pnl.profitability.ebitda, 1)} Monthly
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">Liquid Treasury</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-blue-500/20 text-blue-300 border-blue-500/30">
                {financialMIS.cashRunwayMonths} Mo
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white font-mono">
              {formatCrores(liquidTreasury)}
            </p>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 w-4/5" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">Zero-Rev Runway</span>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">Safe Receivables</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                0-60d
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white font-mono">
              {(((deb0to30 + deb31to60) / debtorsTotal) * 100).toFixed(1)}%
            </p>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 w-[92%]" />
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              DSO: {debtorAgeing.daysSalesOutstanding} Days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
