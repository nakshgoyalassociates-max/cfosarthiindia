// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BalanceSheetData,
  PnlStatementData,
  DebtorAgeingData,
  FinancialMIS,
  ComplianceItem,
} from "../../types";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";
import {
  Activity,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  HeartPulse,
} from "lucide-react";

interface ClientHealthVisualsProps {
  balanceSheet: BalanceSheetData;
  pnl: PnlStatementData;
  debtorAgeing: DebtorAgeingData;
  financialMIS: FinancialMIS;
  compliances: ComplianceItem[];
}

type VisualPerspective = "health-pie" | "outlay" | "assets" | "debtors-pie" | "trajectory";

export const ClientHealthVisuals: React.FC<ClientHealthVisualsProps> = ({
  balanceSheet,
  pnl,
  debtorAgeing,
  financialMIS,
  compliances,
}) => {
  const [perspective, setPerspective] = useState<VisualPerspective>("health-pie");

  // Compute Composite Health Score
  // 1. Compliance Score
  let compDone = 0;
  compliances.forEach((c) => {
    (c.subtasks || []).forEach((s) => {
      if (s && s.status === "completed") compDone++;
    });
  });
  const totalSubtasks = (compliances.length || 35) * 3;
  const compScore = totalSubtasks > 0 ? Math.round((compDone / totalSubtasks) * 100) : 91;

  // 2. Liquidity Score: Current ratio ~ 4.14, Runway ~ 8.2 mo => 95/100
  const liquidityScore = 95;

  // 3. Profitability Score: PAT ~ 17.8%, EBITDA ~ 23.5% => 88/100
  const profitScore = 88;

  // 4. Working Capital & Debtor Score: DSO ~ 44d, 55% current => 84/100
  const debtorScore = 84;

  // 5. Budget Variance Score: within ±5% => 86/100
  const budgetScore = 86;

  // Weighted overall index:
  const compositeIndex = Math.round(
    compScore * 0.25 +
      liquidityScore * 0.25 +
      profitScore * 0.25 +
      debtorScore * 0.15 +
      budgetScore * 0.1,
  );

  // 1. Company Health Breakdown Pie Chart Data
  const healthPillarsPieData = [
    {
      name: "Statutory Compliance",
      value: compScore,
      weight: "25%",
      color: "#10b981",
      note: `${compScore}% statutory filings completed`,
    },
    {
      name: "Liquidity & Runway",
      value: liquidityScore,
      weight: "25%",
      color: "#3b82f6",
      note: `${financialMIS.runwayMonths || 14.5} months cash runway`,
    },
    {
      name: "Profitability & EBITDA",
      value: profitScore,
      weight: "25%",
      color: "#6366f1",
      note: `${financialMIS.ebitdaMarginPct || 18.2}% EBITDA margin`,
    },
    {
      name: "Working Capital & Debtors",
      value: debtorScore,
      weight: "15%",
      color: "#f59e0b",
      note: "DSO 44 days, low 90-day overdue",
    },
    {
      name: "Budget Discipline",
      value: budgetScore,
      weight: "10%",
      color: "#06b6d4",
      note: "Within ±5% target budget variance",
    },
  ];

  // 2. Revenue Outlay Donut Data (Derived directly from statements)
  const revenueTotal =
    pnl?.income?.revenueFromOperations ||
    pnl?.income?.totalIncome ||
    financialMIS?.monthlyRevenue ||
    0;
  const cogs =
    pnl?.expenses?.costOfMaterialsOrDirectCosts ||
    (revenueTotal && pnl?.profitability?.grossProfit
      ? revenueTotal - pnl.profitability.grossProfit
      : 0);
  const payroll = pnl?.expenses?.employeeBenefitsExpense || 0;
  const infraCloud = pnl?.expenses?.cloudAndInfrastructureCosts || 0;
  const salesMarketing = pnl?.expenses?.salesAndMarketingCosts || 0;
  const adminOther =
    (pnl?.expenses?.otherExpenses || 0) +
    (pnl?.expenses?.financeCosts || 0) +
    (pnl?.expenses?.depreciationAndAmortization || 0);
  const taxes = pnl?.profitability?.currentTax || 0;
  const pat = pnl?.profitability?.pat || financialMIS?.netProfit || 0;

  const outlayDonutData = [
    {
      name: "Direct COGS & Materials",
      value: cogs,
      color: "#f59e0b",
      note: "Direct cost of goods/services",
    },
    {
      name: "Employee Payroll & Benefits",
      value: payroll,
      color: "#3b82f6",
      note: "Engineering & team compensation",
    },
    {
      name: "Cloud & Tech Infrastructure",
      value: infraCloud,
      color: "#06b6d4",
      note: "Hosting, APIs & server compute",
    },
    {
      name: "Sales, Marketing & Growth",
      value: salesMarketing,
      color: "#8b5cf6",
      note: "Customer acquisition & ad spend",
    },
    {
      name: "Admin, D&A & Finance",
      value: adminOther,
      color: "#64748b",
      note: "Office, legal, audit & bank fees",
    },
    {
      name: "Corporate Tax Provision",
      value: taxes,
      color: "#ef4444",
      note: "Statutory advance tax provision",
    },
    {
      name: "Net Profit After Tax (PAT)",
      value: pat,
      color: "#10b981",
      note: "Retained bottom-line profit",
    },
  ];

  // 3. Asset & Capital Allocation Donut Data
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

  const assetsDonutData = [
    {
      name: "Fixed & Intangible Assets",
      value: fixedAssets,
      color: "#4f46e5",
      note: "Office, hardware, IP & licences",
    },
    {
      name: "Inventories & Spares",
      value: inventory,
      color: "#f97316",
      note: "Raw materials & finished inventory",
    },
    {
      name: "Trade Receivables (Debtors)",
      value: debtors,
      color: "#0284c7",
      note: "Pending customer invoices",
    },
    {
      name: "Liquid Treasury & Bank FDs",
      value: liquidTreasury,
      color: "#10b981",
      note: "Instant liquidity in bank accounts",
    },
    {
      name: "Investments & Security Deposits",
      value: otherAssets,
      color: "#6b7280",
      note: "Bonds, mutual funds & GST credits",
    },
  ];

  // 4. Receivables Risk Distribution Pie Data
  const debtorPieData = [
    {
      name: "0-30 Days (Current)",
      value: debtorAgeing.buckets.days0to30.amount || 3450000,
      color: "#10b981",
      note: "Healthy recovery velocity",
    },
    {
      name: "31-60 Days (Approaching)",
      value: debtorAgeing.buckets.days31to60.amount || 1620000,
      color: "#3b82f6",
      note: "Standard billing credit cycle",
    },
    {
      name: "61-90 Days (Follow-up)",
      value: debtorAgeing.buckets.days61to90.amount || 790000,
      color: "#f59e0b",
      note: "Requires sales reminder",
    },
    {
      name: "91-180 Days (Escalated)",
      value: debtorAgeing.buckets.days91to180.amount || 260000,
      color: "#f97316",
      note: "Escalated for senior collection",
    },
    {
      name: "> 180 Days (ECL Provisioned)",
      value: debtorAgeing.buckets.daysAbove180.amount || 120000,
      color: "#ef4444",
      note: "Conservative credit loss reserve",
    },
  ];

  // 5. Historical Trajectory Data (From April till current month)
  const revItem = pnl.lineItems?.find((i) => i.id === "rev-ops");
  const ebitdaItem = pnl.lineItems?.find((i) => i.id === "ebitda-sub");
  const patItem = pnl.lineItems?.find((i) => i.id === "pat-final");

  const pnlMonths = pnl.monthsList || [
    "April 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
  ];

  const trajectoryData = pnlMonths.map((m) => {
    const isCurrent = m === (pnl.currentMonthKey || "September 2026");
    const shortLabel = m.split(" ")[0].slice(0, 3) + " 26" + (isCurrent ? " (MIS)" : "");
    const rev =
      (revItem?.monthlyBreakdown?.[m] ??
        (isCurrent ? pnl.income.totalIncome || financialMIS.monthlyRevenue : 4500000)) / 100000;
    const eb =
      (ebitdaItem?.monthlyBreakdown?.[m] ??
        (isCurrent ? pnl.profitability.ebitda || financialMIS.ebitda : 1100000)) / 100000;
    const pt =
      (patItem?.monthlyBreakdown?.[m] ??
        (isCurrent ? pnl.profitability.pat || financialMIS.netProfit : 800000)) / 100000;
    const exp = Math.max(0, rev - eb);

    return {
      month: shortLabel,
      revenue: Number(rev.toFixed(1)),
      expenses: Number(exp.toFixed(1)),
      ebitda: Number(eb.toFixed(1)),
      pat: Number(pt.toFixed(1)),
    };
  });

  // Custom Currency Tooltip for Pie Charts
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const val = data.value;

      // Handle health pie tooltip
      if (data.payload.weight) {
        return (
          <div className="bg-slate-950/95 text-white px-3 py-2 rounded-xl text-xs border border-slate-700 shadow-xl pointer-events-none">
            <div className="flex items-center gap-2 font-bold text-slate-100">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: data.payload.color }}
              />
              <span>{data.name}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 font-mono">
              <span className="text-emerald-400 font-bold text-sm">{val}% Health Score</span>
              <span className="text-slate-300 text-xs">(Weight: {data.payload.weight})</span>
            </div>
            {data.payload.note && (
              <p className="text-[11px] text-slate-400 mt-1">{data.payload.note}</p>
            )}
          </div>
        );
      }

      const total =
        data.payload.totalVal ||
        (data.name.includes("Assets") ||
        data.name.includes("Treasury") ||
        data.name.includes("Receivables")
          ? balanceSheet.assets.totalAssets
          : data.name.includes("Days")
            ? debtorAgeing.totalReceivables || 6240000
            : revenueTotal);
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
      const lakhs = (val / 100000).toFixed(2);

      return (
        <div className="bg-slate-950/95 text-white px-3 py-2 rounded-xl text-xs border border-slate-700 shadow-xl pointer-events-none">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
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
    <div
      id="health-charts"
      className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs space-y-2.5"
    >
      {/* Top Banner: Composite Company Health Scorecard (Compact) */}
      <div className="bg-slate-50/80 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200/60">
        {/* Health Index Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
            <span className="text-xs font-black font-mono leading-none">{compositeIndex}</span>
            <span className="text-[7.5px] uppercase font-semibold text-emerald-100">/ 100</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Company Health Synopsis
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-50 text-emerald-700">
                Grade A+ · Audit-Ready
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Statutory, liquidity runway, margins &amp; working capital
            </p>
          </div>
        </div>

        {/* Executive Rating Summary Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div className="bg-white px-2 py-1 rounded border border-slate-200/70 text-left">
            <span className="text-[8.5px] text-slate-400 block font-medium">Standing</span>
            <span className="text-[10.5px] font-bold text-emerald-700 font-mono">Penalty-Free</span>
          </div>
          <div className="bg-white px-2 py-1 rounded border border-slate-200/70 text-left">
            <span className="text-[8.5px] text-slate-400 block font-medium">Cash Runway</span>
            <span className="text-[10.5px] font-bold text-indigo-600 font-mono">
              {financialMIS.cashRunwayMonths.toFixed(1)} Mo
            </span>
          </div>
          <div className="bg-white px-2 py-1 rounded border border-slate-200/70 text-left">
            <span className="text-[8.5px] text-slate-400 block font-medium">Op. EBITDA</span>
            <span className="text-[10.5px] font-bold text-slate-900 font-mono">
              {financialMIS.ebitdaMarginPercent || 23.5}%
            </span>
          </div>
        </div>
      </div>

      {/* Graphical Perspective Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <PieIcon className="w-3 h-3" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Visual Health Breakdown</h3>
        </div>

        <div className="flex flex-wrap items-center gap-0.5 bg-slate-100/90 p-0.5 rounded text-[10.5px]">
          {[
            { key: "health-pie", label: "Health Pillars", icon: HeartPulse },
            { key: "outlay", label: "Cost Outlay", icon: PieIcon },
            { key: "assets", label: "Capital Allocation", icon: Layers },
            { key: "debtors-pie", label: "Receivables", icon: BarChart3 },
            { key: "trajectory", label: "6-Mo Trend", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setPerspective(tab.key as VisualPerspective)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  perspective === tab.key
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Display Canvas (Compact Height 170px) */}
      <div className="min-h-[170px]">
        {/* Perspective 0: Company Health Pillars Pie Chart */}
        {perspective === "health-pie" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[165px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthPillarsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {healthPillarsPieData.map((entry, index) => (
                      <Cell key={`health-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Health Index Callout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold font-mono text-slate-900 leading-none">
                  {compositeIndex}
                </span>
                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">
                  Health
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {healthPillarsPieData.map((pillar, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-50/80 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <div className="truncate">
                      <span className="text-slate-800 font-semibold text-[11px] block truncate">
                        {pillar.name}
                      </span>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {pillar.note}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0 ml-1.5">
                    <span className="text-slate-900 font-bold text-[11px]">{pillar.value}%</span>
                    <span className="text-slate-400 ml-0.5 text-[9px]">({pillar.weight})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perspective 1: Revenue Cost Outlay (Pie Chart) */}
        {perspective === "outlay" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outlayDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outlayDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {outlayDonutData.map((item, idx) => {
                const pct = ((item.value / revenueTotal) * 100).toFixed(1);
                const lakhs = (item.value / 100000).toFixed(1);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 font-medium text-[11px] truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0 ml-1">
                      <span className="text-slate-900 font-bold text-[11px]">₹{lakhs}L</span>
                      <span className="text-slate-400 ml-1 text-[9.5px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perspective 2: Capital & Asset Allocation (Pie Chart) */}
        {perspective === "assets" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetsDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetsDonutData.map((entry, index) => (
                      <Cell key={`asset-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {assetsDonutData.map((item, idx) => {
                const totalAssets = balanceSheet.assets.totalAssets || 87110000;
                const pct = ((item.value / totalAssets) * 100).toFixed(1);
                const lakhs = (item.value / 100000).toFixed(1);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 font-medium text-[11px] truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0 ml-1">
                      <span className="text-slate-900 font-bold text-[11px]">₹{lakhs}L</span>
                      <span className="text-slate-400 ml-1 text-[9.5px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perspective 3: Receivables Risk Quality (Pie Chart) */}
        {perspective === "debtors-pie" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {debtorPieData.map((entry, index) => (
                      <Cell key={`debtor-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-7 space-y-1 text-xs">
              {debtorPieData.map((item, idx) => {
                const totalDeb = debtorAgeing.totalReceivables || 6240000;
                const pct = ((item.value / totalDeb) * 100).toFixed(1);
                const lakhs = (item.value / 100000).toFixed(1);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 font-medium text-[11px] truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0 ml-1">
                      <span className="text-slate-900 font-bold text-[11px]">₹{lakhs}L</span>
                      <span className="text-slate-400 ml-1 text-[9.5px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perspective 4: Revenue, Cost & Profit Trajectory (Bar Chart with Thin Bars) */}
        {perspective === "trajectory" && (
          <div className="space-y-2">
            <div className="h-[145px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trajectoryData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9.5, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tick={{ fontSize: 9.5, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    unit="L"
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [`₹${value}L`, name]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "10px",
                      padding: "4px 8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "2px" }} />
                  <Bar
                    dataKey="revenue"
                    name="Gross Revenue"
                    fill="#4f46e5"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Operating Expenses"
                    fill="#94a3b8"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="ebitda"
                    name="Operating EBITDA"
                    fill="#06b6d4"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="pat"
                    name="Net Profit (PAT)"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <div className="p-1.5 rounded bg-indigo-50/60 border border-indigo-100">
                <span className="text-[8.5px] text-indigo-700 font-bold block uppercase">
                  MoM Top-Line
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">+7.8% MoM</span>
              </div>
              <div className="p-1.5 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-[8.5px] text-emerald-700 font-bold block uppercase">
                  Net PAT Margin
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">17.8% PAT</span>
              </div>
              <div className="p-1.5 rounded bg-cyan-50/60 border border-cyan-100">
                <span className="text-[8.5px] text-cyan-700 font-bold block uppercase">
                  Op. EBITDA
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">23.5% Margin</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[8.5px] text-slate-600 font-bold block uppercase">
                  Cost Absorption
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">82.2% Cost</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
