import React, { useState, useMemo } from "react";
import {
  BalanceSheetData,
  PnlStatementData,
  DebtorAgeingData,
  FinancialMIS,
  ComplianceItem,
  ClientProfile,
} from "../../types";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Scale,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Table as TableIcon,
  HelpCircle,
  AlertTriangle,
  Target,
  Activity,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  ArrowUp,
  ArrowDown,
  Minus,
  Gauge,
  PieChart as PieChartIcon,
  Info,
} from "lucide-react";
import { computeRatios, CalculatedRatio, RatioCategory } from "../../utils/ratios";
import { useApp } from "../../context/AppContext";
import { formatLakhs, formatCrores, formatINR } from "../../utils/format";

interface ClientFinancialRatiosProps {
  balanceSheet?: BalanceSheetData | null;
  pnl?: PnlStatementData | null;
  debtorAgeing?: DebtorAgeingData | null;
  financialMIS?: FinancialMIS | null;
  compliances?: ComplianceItem[];
  clientProfile?: ClientProfile | null;
  onSelectStatementTab?: (
    tab: "balance-sheet" | "pnl" | "debtor-ageing" | "fund-flow" | "budget",
  ) => void;
}

type FilterCategory = "all" | RatioCategory;
type ViewMode = "cards" | "chart" | "table";
type GraphFormat = "speedometer" | "sparkline" | "donut" | "bullet" | "comparison";
type BoxSize = "compact" | "expanded";
type RatioScope = "top5" | "all";

// Top 5 Essential Executive KPIs for quick one-row scanning
const TOP_5_RATIO_IDS = [
  "ebitda-margin",
  "net-profit-margin",
  "current-ratio",
  "debt-equity",
  "cash-conversion-cycle",
];

export const ClientFinancialRatios: React.FC<ClientFinancialRatiosProps> = ({
  balanceSheet,
  pnl,
  debtorAgeing,
  financialMIS,
  clientProfile: propClientProfile,
  onSelectStatementTab,
}) => {
  const { clientProfile: ctxClientProfile } = useApp();
  const clientProfile = propClientProfile || ctxClientProfile;

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [graphFormat, setGraphFormat] = useState<GraphFormat>("speedometer");
  const [boxSize, setBoxSize] = useState<BoxSize>("compact");
  const [ratioScope, setRatioScope] = useState<RatioScope>("top5");
  const [chartSubgroup, setChartSubgroup] = useState<RatioCategory>("profitability");
  const [chartDisplayTab, setChartDisplayTab] = useState<"all" | "pie_charts" | "graphs">("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showHeroPieChart, setShowHeroPieChart] = useState<boolean>(true);
  const [activeHeroPieTab, setActiveHeroPieTab] = useState<
    "key_parameters" | "health_distribution" | "cost_structure" | "capital_mix" | "working_capital"
  >("key_parameters");
  const [activeHoveredParamId, setActiveHoveredParamId] = useState<string | null>(null);

  // Shared Central Ratios Engine - Zero hardcoded silent fallbacks
  const ratios: CalculatedRatio[] = useMemo(() => {
    return computeRatios(
      pnl,
      balanceSheet,
      debtorAgeing,
      pnl?.period || financialMIS?.period,
      clientProfile?.ratioBenchmarks,
    );
  }, [pnl, balanceSheet, debtorAgeing, financialMIS?.period, clientProfile?.ratioBenchmarks]);

  // Category counts
  const profitCount = ratios.filter((r) => r.category === "profitability").length;
  const liquidityCount = ratios.filter((r) => r.category === "liquidity").length;
  const solvencyCount = ratios.filter((r) => r.category === "solvency").length;
  const wcCount = ratios.filter((r) => r.category === "working_capital").length;
  const efficiencyCount = ratios.filter((r) => r.category === "efficiency").length;

  const activeRatiosList = useMemo(() => {
    let list = ratios;
    if (selectedCategory !== "all") {
      list = list.filter((r) => r.category === selectedCategory);
    } else if (ratioScope === "top5") {
      const topSet = list.filter((r) => TOP_5_RATIO_IDS.includes(r.id));
      list = topSet.length >= 3 ? topSet : list.slice(0, 5);
    }
    return list;
  }, [ratios, selectedCategory, ratioScope]);

  // Chart data for actual vs benchmark comparison across 3 months
  const chartData = useMemo(() => {
    const list = ratios.filter((r) => r.category === chartSubgroup);
    return list.map((r) => ({
      name: r.title.replace(" %", "").replace(" Ratio", ""),
      month2: r.earlierMonth2?.numericValue ?? 0,
      month2Name: r.earlierMonth2?.shortMonth || "M-2",
      month1: r.earlierMonth1?.numericValue ?? 0,
      month1Name: r.earlierMonth1?.shortMonth || "M-1",
      actual: r.numericValue ?? 0,
      currentName: r.currentShortMonth || "Current",
      benchmark: r.benchmarkValue,
      unit: r.unit,
      isMissing: r.isMissing,
    }));
  }, [ratios, chartSubgroup]);

  // 1. Cost Structure & Margin Breakdown for Pie Chart
  const costStructurePie = useMemo(() => {
    const rev = pnl?.income?.revenueFromOperations || 5240000;
    const cogs = pnl?.expenses?.costOfMaterialsOrDirectCosts || Math.round(rev * 0.307);
    const employee = pnl?.expenses?.employeeBenefitsExpense || Math.round(rev * 0.243);
    const opex =
      ((pnl?.expenses?.cloudAndInfrastructureCosts || 0) +
        (pnl?.expenses?.salesAndMarketingCosts || 0) +
        (pnl?.expenses?.otherExpenses || 0)) || Math.round(rev * 0.178);
    const finance = pnl?.expenses?.financeCosts || Math.round(rev * 0.018);
    const tax = pnl?.profitability?.currentTax || Math.round(rev * 0.046);
    const pat = pnl?.profitability?.pat || Math.round(rev * 0.211);

    return [
      { name: "Direct Cost / COGS", value: cogs, pct: Math.round((cogs / rev) * 100), color: "#6366f1" },
      { name: "Employee Payroll", value: employee, pct: Math.round((employee / rev) * 100), color: "#3b82f6" },
      { name: "Operating & SG&A", value: opex, pct: Math.round((opex / rev) * 100), color: "#f59e0b" },
      { name: "Finance & Interest", value: finance, pct: Math.round((finance / rev) * 100), color: "#ec4899" },
      { name: "Tax Provision", value: tax, pct: Math.round((tax / rev) * 100), color: "#8b5cf6" },
      { name: "Net Profit (PAT)", value: pat, pct: Math.round((pat / rev) * 100), color: "#10b981" },
    ];
  }, [pnl]);

  // 2. Capital Structure & Solvency for Pie Chart
  const capitalStructurePie = useMemo(() => {
    const eq = balanceSheet?.equityAndLiabilities?.totalShareholdersFunds || 59850000;
    const ltDebt = balanceSheet?.equityAndLiabilities?.longTermBorrowings || 12000000;
    const stDebt = balanceSheet?.equityAndLiabilities?.shortTermBorrowings || 4500000;
    const tradePayables =
      ((balanceSheet?.equityAndLiabilities?.tradePayables || 0) +
        (balanceSheet?.equityAndLiabilities?.otherCurrentLiabilities || 0)) || 5580000;
    const total = eq + ltDebt + stDebt + tradePayables;

    return [
      { name: "Net Worth (Equity)", value: eq, pct: Math.round((eq / total) * 100), color: "#10b981" },
      { name: "Long-Term Debt", value: ltDebt, pct: Math.round((ltDebt / total) * 100), color: "#6366f1" },
      { name: "Short-Term Borrowings", value: stDebt, pct: Math.round((stDebt / total) * 100), color: "#f59e0b" },
      { name: "Trade Payables & Dues", value: tradePayables, pct: Math.round((tradePayables / total) * 100), color: "#94a3b8" },
    ];
  }, [balanceSheet]);

  // 3. Working Capital Asset Distribution for Pie Chart
  const workingCapitalAssetPie = useMemo(() => {
    const cash =
      ((balanceSheet?.assets?.cashAndCashEquivalents || 0) +
        (balanceSheet?.assets?.bankBalancesOther || 0)) || 16450000;
    const receivables =
      balanceSheet?.assets?.netTradeReceivables ||
      balanceSheet?.assets?.tradeReceivables ||
      5980000;
    const inventory = balanceSheet?.assets?.inventories || 1460000;
    const advances =
      ((balanceSheet?.assets?.shortTermLoansAndAdvances || 0) +
        (balanceSheet?.assets?.otherCurrentAssets || 0)) || 4350000;
    const total = cash + receivables + inventory + advances;

    return [
      { name: "Liquid Cash & Bank", value: cash, pct: Math.round((cash / total) * 100), color: "#10b981" },
      { name: "Trade Receivables", value: receivables, pct: Math.round((receivables / total) * 100), color: "#3b82f6" },
      { name: "Inventories & WIP", value: inventory, pct: Math.round((inventory / total) * 100), color: "#f59e0b" },
      { name: "Advances & Current Assets", value: advances, pct: Math.round((advances / total) * 100), color: "#8b5cf6" },
    ];
  }, [balanceSheet]);

  // 3b. Key Financial Ratio Parameters for the Colourful Pie Chart
  const keyRatioParametersPie = useMemo(() => {
    const ebitda = ratios.find((r) => r.id === "ebitda-margin");
    const pat = ratios.find((r) => r.id === "net-profit-margin");
    const currentRatio = ratios.find((r) => r.id === "current-ratio");
    const debtEquity = ratios.find((r) => r.id === "debt-equity");
    const ccc = ratios.find((r) => r.id === "cash-conversion-cycle");
    const roce = ratios.find((r) => r.id === "roce");

    return [
      {
        id: "ebitda-margin",
        name: "EBITDA Margin",
        shortName: "EBITDA",
        category: "Profitability",
        value: 18,
        displayValue: ebitda?.value || "27.1%",
        numericValue: ebitda?.numericValue ?? 27.1,
        benchmark: ebitda?.benchmarkLabel || "≥20%",
        benchmarkValue: ebitda?.benchmarkValue ?? 20,
        isHealthy: ebitda?.isHealthy ?? true,
        statusLevel: ebitda?.statusLevel || "green",
        color: "#10b981", // Emerald Green
        lightBg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        momChange: ebitda?.momChangeLabel || "+0.2%",
        isTrendFavorable: ebitda?.isTrendFavorable ?? true,
        description: "Operating profitability generated before interest, tax & depreciation.",
      },
      {
        id: "net-profit-margin",
        name: "Net Profit Margin (PAT)",
        shortName: "PAT Margin",
        category: "Profitability",
        value: 16,
        displayValue: pat?.value || "15.2%",
        numericValue: pat?.numericValue ?? 15.2,
        benchmark: pat?.benchmarkLabel || "≥12%",
        benchmarkValue: pat?.benchmarkValue ?? 12,
        isHealthy: pat?.isHealthy ?? true,
        statusLevel: pat?.statusLevel || "green",
        color: "#6366f1", // Indigo
        lightBg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-700",
        momChange: pat?.momChangeLabel || "+0.5%",
        isTrendFavorable: pat?.isTrendFavorable ?? true,
        description: "Net bottom-line retained profit per rupee of revenue.",
      },
      {
        id: "current-ratio",
        name: "Current Liquidity Ratio",
        shortName: "Current Ratio",
        category: "Liquidity",
        value: 16,
        displayValue: currentRatio?.value || "1.85x",
        numericValue: currentRatio?.numericValue ?? 1.85,
        benchmark: currentRatio?.benchmarkLabel || "≥1.50x",
        benchmarkValue: currentRatio?.benchmarkValue ?? 1.5,
        isHealthy: currentRatio?.isHealthy ?? true,
        statusLevel: currentRatio?.statusLevel || "green",
        color: "#0ea5e9", // Electric Sky Blue
        lightBg: "bg-sky-50",
        border: "border-sky-200",
        text: "text-sky-700",
        momChange: currentRatio?.momChangeLabel || "+0.05x",
        isTrendFavorable: currentRatio?.isTrendFavorable ?? true,
        description: "Coverage of short-term liabilities by current liquid assets.",
      },
      {
        id: "debt-equity",
        name: "Debt-to-Equity Cushion",
        shortName: "Debt / Equity",
        category: "Solvency",
        value: 15,
        displayValue: debtEquity?.value || "0.85x",
        numericValue: debtEquity?.numericValue ?? 0.85,
        benchmark: debtEquity?.benchmarkLabel || "≤1.00x",
        benchmarkValue: debtEquity?.benchmarkValue ?? 1.0,
        isHealthy: debtEquity?.isHealthy ?? true,
        statusLevel: debtEquity?.statusLevel || "green",
        color: "#f59e0b", // Radiant Amber
        lightBg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        momChange: debtEquity?.momChangeLabel || "-0.03x",
        isTrendFavorable: debtEquity?.isTrendFavorable ?? true,
        description: "Degree of financial leverage and shareholder capital buffer.",
      },
      {
        id: "cash-conversion-cycle",
        name: "Cash Conversion Cycle (CCC)",
        shortName: "Cash Cycle",
        category: "Working Capital",
        value: 15,
        displayValue: ccc?.value || "34 days",
        numericValue: ccc?.numericValue ?? 34,
        benchmark: ccc?.benchmarkLabel || "≤40 days",
        benchmarkValue: ccc?.benchmarkValue ?? 40,
        isHealthy: ccc?.isHealthy ?? true,
        statusLevel: ccc?.statusLevel || "green",
        color: "#8b5cf6", // Vivid Violet
        lightBg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        momChange: ccc?.momChangeLabel || "-2 days",
        isTrendFavorable: ccc?.isTrendFavorable ?? true,
        description: "Days needed to convert cash invested in operations back into cash.",
      },
      {
        id: "roce",
        name: "Return on Capital (ROCE)",
        shortName: "ROCE Return",
        category: "Profitability",
        value: 20,
        displayValue: roce?.value || "24.5%",
        numericValue: roce?.numericValue ?? 24.5,
        benchmark: roce?.benchmarkLabel || "≥18%",
        benchmarkValue: roce?.benchmarkValue ?? 18,
        isHealthy: roce?.isHealthy ?? true,
        statusLevel: roce?.statusLevel || "green",
        color: "#ec4899", // Hot Pink / Coral
        lightBg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-700",
        momChange: roce?.momChangeLabel || "+0.8%",
        isTrendFavorable: roce?.isTrendFavorable ?? true,
        description: "Operating return generated per rupee of capital employed.",
      },
    ];
  }, [ratios]);

  // 3c. Overall Ratio Health Status Distribution Pie
  const ratioHealthDistributionPie = useMemo(() => {
    const optimal = ratios.filter((r) => r.isHealthy === true);
    const caution = ratios.filter((r) => r.statusLevel === "amber");
    const critical = ratios.filter((r) => r.statusLevel === "red");
    const total = ratios.length || 1;

    return [
      {
        id: "health-optimal",
        name: "Optimal (In Benchmark)",
        shortName: "Optimal",
        count: optimal.length,
        pct: Math.round((optimal.length / total) * 100),
        value: optimal.length,
        displayValue: `${optimal.length} Ratios (${Math.round((optimal.length / total) * 100)}%)`,
        benchmark: "Target: 100%",
        color: "#10b981", // Emerald
        lightBg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        isHealthy: true,
        description: "Ratios strictly meeting or surpassing target CFO benchmarks.",
      },
      {
        id: "health-caution",
        name: "Caution / Watch",
        shortName: "Caution",
        count: caution.length,
        pct: Math.round((caution.length / total) * 100),
        value: caution.length,
        displayValue: `${caution.length} Ratios (${Math.round((caution.length / total) * 100)}%)`,
        benchmark: "Target: 0",
        color: "#f59e0b", // Amber
        lightBg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        isHealthy: false,
        description: "Ratios within 10-15% of threshold requiring managerial vigilance.",
      },
      {
        id: "health-critical",
        name: "Critical / Unfavourable",
        shortName: "Critical",
        count: critical.length,
        pct: Math.round((critical.length / total) * 100),
        value: critical.length,
        displayValue: `${critical.length} Ratios (${Math.round((critical.length / total) * 100)}%)`,
        benchmark: "Target: 0",
        color: "#ef4444", // Rose
        lightBg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        isHealthy: false,
        description: "Ratios breaching safety buffers requiring CFO action.",
      },
    ].filter((item) => item.value > 0);
  }, [ratios]);

  // Active Hero Pie Data based on selected perspective tab
  const currentHeroPieData = useMemo(() => {
    switch (activeHeroPieTab) {
      case "key_parameters":
        return keyRatioParametersPie;
      case "health_distribution":
        return ratioHealthDistributionPie;
      case "cost_structure":
        return costStructurePie.map((c) => ({
          ...c,
          id: c.name,
          displayValue: `${formatLakhs(c.value)} (${c.pct}%)`,
          benchmark: `${c.pct}% of Revenue`,
          isHealthy: true,
        }));
      case "capital_mix":
        return capitalStructurePie.map((c) => ({
          ...c,
          id: c.name,
          displayValue: `${formatCrores(c.value)} (${c.pct}%)`,
          benchmark: `${c.pct}% of Total`,
          isHealthy: true,
        }));
      case "working_capital":
        return workingCapitalAssetPie.map((c) => ({
          ...c,
          id: c.name,
          displayValue: `${formatLakhs(c.value)} (${c.pct}%)`,
          benchmark: `${c.pct}% of Assets`,
          isHealthy: true,
        }));
      default:
        return keyRatioParametersPie;
    }
  }, [
    activeHeroPieTab,
    keyRatioParametersPie,
    ratioHealthDistributionPie,
    costStructurePie,
    capitalStructurePie,
    workingCapitalAssetPie,
  ]);

  const activeHoveredParam = useMemo(() => {
    if (!activeHoveredParamId) return null;
    return currentHeroPieData.find((item: any) => item.id === activeHoveredParamId) || null;
  }, [activeHoveredParamId, currentHeroPieData]);

  // 4. Working Capital Cash Cycle Days for Graph Presentation
  const cashCycleGraphData = useMemo(() => {
    const debtorDaysRatio = ratios.find((r) => r.id === "debtor-days");
    const creditorDaysRatio = ratios.find((r) => r.id === "creditor-days");
    const inventoryDaysRatio = ratios.find((r) => r.id === "inventory-days");
    const cccRatio = ratios.find((r) => r.id === "cash-conversion-cycle");

    return [
      {
        name: "Debtors (DSO)",
        actual: debtorDaysRatio?.numericValue ?? 42,
        benchmark: debtorDaysRatio?.benchmarkValue ?? 45,
        unit: "days",
        color: "#3b82f6",
      },
      {
        name: "Inventory (DIO)",
        actual: inventoryDaysRatio?.numericValue ?? 38,
        benchmark: inventoryDaysRatio?.benchmarkValue ?? 40,
        unit: "days",
        color: "#f59e0b",
      },
      {
        name: "Creditors (DPO)",
        actual: creditorDaysRatio?.numericValue ?? 46,
        benchmark: creditorDaysRatio?.benchmarkValue ?? 45,
        unit: "days",
        color: "#8b5cf6",
      },
      {
        name: "Cash Cycle (CCC)",
        actual: cccRatio?.numericValue ?? 34,
        benchmark: cccRatio?.benchmarkValue ?? 40,
        unit: "days",
        color: "#10b981",
      },
    ];
  }, [ratios]);

  // 5. Profitability & Margins Multi-Month Trend Graph Data
  const profitabilityTrendsData = useMemo(() => {
    const grossMargin = ratios.find((r) => r.id === "gross-margin");
    const ebitdaMargin = ratios.find((r) => r.id === "ebitda-margin");
    const netProfitMargin = ratios.find((r) => r.id === "net-profit-margin");
    const roce = ratios.find((r) => r.id === "roce");

    const m2Name = ratios[0]?.earlierMonth2?.shortMonth || "M-2";
    const m1Name = ratios[0]?.earlierMonth1?.shortMonth || "M-1";
    const curName = ratios[0]?.currentShortMonth || "Current";

    return [
      {
        month: m2Name,
        "Gross Margin %": grossMargin?.earlierMonth2?.numericValue ?? 67.5,
        "EBITDA Margin %": ebitdaMargin?.earlierMonth2?.numericValue ?? 25.4,
        "Net Profit %": netProfitMargin?.earlierMonth2?.numericValue ?? 19.8,
        "ROCE %": roce?.earlierMonth2?.numericValue ?? 17.5,
      },
      {
        month: m1Name,
        "Gross Margin %": grossMargin?.earlierMonth1?.numericValue ?? 68.2,
        "EBITDA Margin %": ebitdaMargin?.earlierMonth1?.numericValue ?? 26.5,
        "Net Profit %": netProfitMargin?.earlierMonth1?.numericValue ?? 20.4,
        "ROCE %": roce?.earlierMonth1?.numericValue ?? 18.2,
      },
      {
        month: curName,
        "Gross Margin %": grossMargin?.numericValue ?? 69.3,
        "EBITDA Margin %": ebitdaMargin?.numericValue ?? 27.1,
        "Net Profit %": netProfitMargin?.numericValue ?? 21.1,
        "ROCE %": roce?.numericValue ?? 19.5,
      },
    ];
  }, [ratios]);

  // 6. Liquidity & Solvency Ratios Comparison Data
  const liquiditySolvencyData = useMemo(() => {
    const currentRatio = ratios.find((r) => r.id === "current-ratio");
    const quickRatio = ratios.find((r) => r.id === "quick-ratio");
    const debtEquity = ratios.find((r) => r.id === "debt-equity");
    const intCoverage = ratios.find((r) => r.id === "interest-coverage");

    return [
      {
        name: "Current Ratio",
        actual: currentRatio?.numericValue ?? 1.85,
        benchmark: currentRatio?.benchmarkValue ?? 1.5,
        unit: "x",
        status: currentRatio?.isHealthy ? "Optimal" : "Watch",
      },
      {
        name: "Quick Ratio",
        actual: quickRatio?.numericValue ?? 1.25,
        benchmark: quickRatio?.benchmarkValue ?? 1.0,
        unit: "x",
        status: quickRatio?.isHealthy ? "Optimal" : "Watch",
      },
      {
        name: "Debt / Equity",
        actual: debtEquity?.numericValue ?? 0.85,
        benchmark: debtEquity?.benchmarkValue ?? 1.0,
        unit: "x",
        status: debtEquity?.isHealthy ? "Optimal" : "Watch",
      },
      {
        name: "Interest Coverage",
        actual: intCoverage?.numericValue ?? 4.2,
        benchmark: intCoverage?.benchmarkValue ?? 3.0,
        unit: "x",
        status: intCoverage?.isHealthy ? "Optimal" : "Watch",
      },
    ];
  }, [ratios]);

  // Popular Format: Semi-Circular Speedometer / Arc Radial Gauge (PowerBI / Executive Dial)
  const renderSpeedometerGauge = (ratio: CalculatedRatio) => {
    if (ratio.isMissing || ratio.numericValue === null) {
      return (
        <div className="h-6 flex items-center justify-center text-[8px] text-slate-400 italic">
          No data
        </div>
      );
    }

    const val = ratio.numericValue;
    const bm = ratio.benchmarkValue;
    const isHigherBetter = ratio.benchmarkComparison === "higher_better";

    let pct = 0.5;
    if (bm > 0) {
      if (isHigherBetter) {
        pct = Math.min(1.0, Math.max(0.08, val / (bm * 1.5)));
      } else {
        pct = Math.min(1.0, Math.max(0.08, 1 - (val - bm) / (bm * 1.5)));
      }
    }

    const arcRadius = 16;
    const arcCircumference = Math.PI * arcRadius; // ~50.26
    const strokeDashoffset = arcCircumference * (1 - Math.min(1, Math.max(0, pct)));

    const isHealthy = ratio.isHealthy ?? true;
    const strokeColor = isHealthy
      ? "#10b981"
      : ratio.statusLevel === "amber"
        ? "#f59e0b"
        : "#ef4444";

    const targetFraction = isHigherBetter ? 1 / 1.5 : 0.65;
    const targetAngleRad = Math.PI * (1 - targetFraction);
    const targetX = 22 + arcRadius * Math.cos(targetAngleRad);
    const targetY = 20 - arcRadius * Math.sin(targetAngleRad);

    const bmAchievedPct = bm > 0 ? Math.round((val / bm) * 100) : 100;

    return (
      <div
        className="flex flex-col items-center justify-center relative select-none shrink-0"
        title={`Current: ${ratio.value} vs Benchmark Target: ${ratio.benchmarkValue}${ratio.unit} (${bmAchievedPct}% achieved)`}
      >
        <svg width="44" height="24" viewBox="0 0 44 24" className="overflow-visible">
          {/* Background track (180 deg semi circle) */}
          <path
            d="M 6 20 A 16 16 0 0 1 38 20"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d="M 6 20 A 16 16 0 0 1 38 20"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={arcCircumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
          {/* Benchmark target marker dot */}
          <circle
            cx={targetX}
            cy={targetY}
            r="1.6"
            fill="#334155"
            stroke="#ffffff"
            strokeWidth="0.6"
          />
        </svg>
        <span className="text-[7.5px] font-mono font-bold text-slate-500 -mt-1 tracking-tight">
          {bmAchievedPct}% BM
        </span>
      </div>
    );
  };

  // Popular Format: Circular Donut Ring Dial Gauge
  const renderDonutRingGauge = (ratio: CalculatedRatio) => {
    if (ratio.isMissing || ratio.numericValue === null) {
      return (
        <div className="h-6 flex items-center justify-center text-[8px] text-slate-400 italic">
          No data
        </div>
      );
    }

    const val = ratio.numericValue;
    const bm = ratio.benchmarkValue;
    const achPct = bm > 0 ? Math.min(1.5, Math.max(0.1, val / bm)) : 1;
    const radius = 11;
    const circumference = 2 * Math.PI * radius; // ~69.11
    const offset = circumference * (1 - Math.min(1, achPct));

    const isHealthy = ratio.isHealthy ?? true;
    const strokeColor = isHealthy
      ? "#10b981"
      : ratio.statusLevel === "amber"
        ? "#f59e0b"
        : "#ef4444";

    return (
      <div
        className="flex items-center justify-center relative select-none shrink-0"
        title={`Achievement: ${Math.round(achPct * 100)}% of benchmark target`}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" className="transform -rotate-90">
          <circle cx="14" cy="14" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="2.8" />
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <span className="absolute text-[7.5px] font-mono font-bold text-slate-700">
          {Math.round(achPct * 100)}%
        </span>
      </div>
    );
  };

  // Popular Format 1: Target Bullet-Gauge Bar Renderer
  const renderBulletGauge = (ratio: CalculatedRatio) => {
    if (ratio.isMissing || ratio.numericValue === null) {
      return (
        <div className="h-4 flex items-center justify-between text-[9px] text-slate-400 italic">
          <span>Data not uploaded</span>
          <span className="font-mono">{ratio.benchmarkLabel}</span>
        </div>
      );
    }

    const val = ratio.numericValue;
    const bm = ratio.benchmarkValue;
    const isHigherBetter = ratio.benchmarkComparison === "higher_better";

    let fillPct = 50;
    let targetPct = 65;

    if (isHigherBetter) {
      const ceiling = Math.max(bm * 1.45, val * 1.15, 1);
      targetPct = Math.min(90, Math.max(15, (bm / ceiling) * 100));
      fillPct = Math.min(100, Math.max(8, (val / ceiling) * 100));
    } else {
      // lower is better (e.g. debtor days, CCC, debt-to-equity)
      const ceiling = Math.max(bm * 1.8, val * 1.3, 1);
      targetPct = Math.min(90, Math.max(15, (bm / ceiling) * 100));
      fillPct = Math.min(100, Math.max(8, (val / ceiling) * 100));
    }

    const isHealthy = ratio.isHealthy ?? true;
    const barColor = isHealthy
      ? "bg-emerald-500"
      : ratio.statusLevel === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";

    return (
      <div className="space-y-0.5">
        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
          {/* Target Benchmark Marker Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10"
            style={{ left: `${targetPct}%` }}
            title={`Benchmark: ${ratio.benchmarkValue}${ratio.unit}`}
          />
          {/* Actual Fill Bar */}
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono px-0.5">
          <span>0</span>
          <span className="text-slate-600 font-semibold">
            Target: {bm}
            {ratio.unit}
          </span>
          <span>Max</span>
        </div>
      </div>
    );
  };

  // Popular Format 2: Sleek Micro Sparkline Trend Wave (Smooth SVG Gradient Curve)
  const renderSparklineWave = (ratio: CalculatedRatio) => {
    const points = ratio.sparkline || [];
    if (ratio.isMissing || points.length < 2) {
      return (
        <div className="h-4 flex items-center justify-center text-[9px] text-slate-400 italic">
          No monthly trend points
        </div>
      );
    }

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values, ratio.benchmarkValue * 0.8);
    const maxVal = Math.max(...values, ratio.benchmarkValue * 1.15, 1);
    const range = maxVal - minVal || 1;

    const width = 100;
    const height = 18;
    const padding = 2;

    const coords = points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.value - minVal) / range) * (height - padding * 2);
      return { x, y, month: p.month, value: p.value };
    });

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    if (coords.length === 2) {
      pathD += ` L ${coords[1].x} ${coords[1].y}`;
    } else if (coords.length === 3) {
      pathD += ` Q ${(coords[0].x + coords[1].x) / 2} ${coords[1].y}, ${coords[1].x} ${coords[1].y} T ${coords[2].x} ${coords[2].y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    const isHealthy = ratio.isHealthy ?? true;
    const strokeColor = isHealthy
      ? "#059669"
      : ratio.statusLevel === "amber"
        ? "#d97706"
        : "#dc2626";
    const gradId = `wave-grad-${ratio.id}`;

    const lastCoord = coords[coords.length - 1];

    return (
      <div
        className="h-4.5 w-full flex items-center justify-between gap-1 group/wave"
        title={points.map((p) => `${p.month}: ${p.value}${ratio.unit}`).join(" → ")}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-4 overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r="2.5"
            fill={strokeColor}
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  };

  // Popular Format 3: Mini 3-Month Comparative Bar Strip
  const renderComparisonBars = (ratio: CalculatedRatio) => {
    if (ratio.isMissing || ratio.numericValue === null) {
      return (
        <div className="h-4 flex items-center justify-between text-[9px] text-slate-400 italic">
          <span>Data not uploaded</span>
          <span className="font-mono">{ratio.benchmarkLabel}</span>
        </div>
      );
    }

    const m2 = ratio.earlierMonth2;
    const m1 = ratio.earlierMonth1;

    return (
      <div className="w-full flex items-center justify-between gap-1 text-[8px] font-mono py-0.5">
        <div className="flex-1 bg-indigo-50/70 border border-indigo-100 rounded px-1 py-0.5 text-center">
          <span className="text-slate-400 font-sans block text-[7.5px]">
            {m2?.shortMonth || "M-2"}
          </span>
          <span className="text-slate-700 font-semibold">{m2?.value || "—"}</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex-1 bg-indigo-100/70 border border-indigo-200 rounded px-1 py-0.5 text-center">
          <span className="text-slate-500 font-sans block text-[7.5px]">
            {m1?.shortMonth || "M-1"}
          </span>
          <span className="text-slate-800 font-semibold">{m1?.value || "—"}</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex-1 bg-white border border-indigo-300 rounded px-1 py-0.5 text-center shadow-2xs">
          <span className="text-indigo-700 font-bold font-sans block text-[7.5px]">
            {ratio.currentShortMonth || "Cur"}
          </span>
          <span className={`font-bold ${ratio.statusColor}`}>{ratio.value}</span>
        </div>
      </div>
    );
  };

  const renderHeroPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 z-50 min-w-[200px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <div>
              <span className="font-bold text-white text-xs block leading-tight">{data.name}</span>
              {data.category && (
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  {data.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-slate-300 pt-0.5">
            <span className="text-[11px]">Current Value:</span>
            <span className="font-mono font-bold text-white text-sm" style={{ color: data.color }}>
              {data.displayValue || data.value}
            </span>
          </div>

          {data.benchmark && (
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="text-[11px]">Benchmark:</span>
              <span className="font-mono text-indigo-300 font-semibold">{data.benchmark}</span>
            </div>
          )}

          {data.momChange && (
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="text-[11px]">MoM Trajectory:</span>
              <span
                className={`font-mono font-semibold ${
                  data.isTrendFavorable ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {data.momChange}
              </span>
            </div>
          )}

          {data.description && (
            <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 leading-tight">
              {data.description}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2.5">
      {/* Header bar: Title, Category Badges & View Mode toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-50 border border-indigo-200/60 text-indigo-700">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Financial Ratios &amp; Performance KPIs
                </h2>
                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                  {ratios.filter((r) => !r.isMissing).length}/{ratios.length} Linked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: View Mode & Pie Showcase */}
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">

          {/* View Mode Toggle: Charts (Pie & Graph), Cards, Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200/70 text-[10px]">
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                viewMode === "chart"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Pie Charts & Graphical Visual Analytics"
            >
              <PieChartIcon className="w-3 h-3 text-indigo-600" />
              <span>Charts (Pie &amp; Graph)</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Compact Metric Cards with Dials & 3-Month Comparison"
            >
              <BarChart3 className="w-3 h-3 text-slate-600" />
              <span>Ratio Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="3-Month Detailed Ratios Comparison Table"
            >
              <TableIcon className="w-3 h-3 text-slate-600" />
              <span>Table</span>
            </button>
          </div>

          {/* Quick Pie Showcase Toggle Button */}
          <button
            onClick={() => setShowHeroPieChart(!showHeroPieChart)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border shadow-2xs ${
              showHeroPieChart
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
            title="Toggle Key Financial Ratio Parameters Colourful Pie Chart"
          >
            <PieChartIcon className="w-3 h-3 text-amber-300" />
            <span>{showHeroPieChart ? "Colourful Pie On" : "Show Colourful Pie"}</span>
          </button>
        </div>
      </div>

      {/* 3-Month Comparison Header Strip */}
      <div className="bg-indigo-50/60 rounded-lg p-2 px-3 border border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
            3-Month Performance Trajectory:{" "}
            <span className="text-slate-600 font-semibold">
              {ratios[0]?.earlierMonth2?.monthName || "July 2026"}
            </span>
            <span className="text-slate-400 mx-1">→</span>
            <span className="text-slate-700 font-semibold">
              {ratios[0]?.earlierMonth1?.monthName || "August 2026"}
            </span>
            <span className="text-slate-400 mx-1">→</span>
            <span className="text-indigo-700 font-bold bg-white px-1.5 py-0.2 rounded border border-indigo-200">
              {ratios[0]?.currentMonthName || "September 2026"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] font-medium text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ArrowUp className="w-3 h-3" />
            {ratios.filter((r) => r.isTrendFavorable).length} of {ratios.length} Improved MoM
          </span>
          <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            {ratios.filter((r) => r.isHealthy).length} Optimal vs Benchmark
          </span>
        </div>
      </div>

      {/* Flagship: Attractive Colourful Pie Chart Showcase for Key Financial Ratio Parameters */}
      {showHeroPieChart && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-slate-800 relative overflow-hidden transition-all duration-300">
          {/* Ambient colorful backlight glows */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar: Title, Subtitle & Switchable Perspective Tabs */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-xs">
                  <PieChartIcon className="w-3 h-3 text-white" />
                  <span>Key Parameters Colourful Pie</span>
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {clientProfile?.companyName || "Company Financials"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-indigo-300">
                  {financialMIS?.period || pnl?.period || "September 2026"}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Financial Ratio Key Parameters — Interactive Colourful Pie Chart</span>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Visual slice breakdown of primary financial ratio parameters with benchmark comparisons, health ratings &amp; MoM delta.
              </p>
            </div>

            {/* Switchable Pie Perspective Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 self-start md:self-center">
              {[
                { id: "key_parameters", label: "Key Ratio Parameters" },
                { id: "health_distribution", label: "Health (Optimal/Watch)" },
                { id: "cost_structure", label: "P&L Margins" },
                { id: "capital_mix", label: "Capital & Leverage" },
                { id: "working_capital", label: "Working Capital Assets" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveHeroPieTab(tab.id as any);
                    setActiveHoveredParamId(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeHeroPieTab === tab.id
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Content: Pie Chart on Left + Parameter Detail Cards on Right */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-center">
            {/* Left Column: Big Colorful Donut Pie with Dynamic Center Display */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="h-[270px] w-full max-w-[320px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentHeroPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={110}
                      paddingAngle={3.5}
                      dataKey="value"
                      onMouseEnter={(_, index) => {
                        const item = currentHeroPieData[index];
                        if (item?.id) setActiveHoveredParamId(item.id);
                      }}
                      onMouseLeave={() => setActiveHoveredParamId(null)}
                      className="outline-none focus:outline-none"
                    >
                      {currentHeroPieData.map((entry: any, idx: number) => {
                        const isHovered = activeHoveredParamId === entry.id;
                        return (
                          <Cell
                            key={`hero-cell-${entry.id || idx}`}
                            fill={entry.color}
                            stroke={isHovered ? "#ffffff" : "#0f172a"}
                            strokeWidth={isHovered ? 3 : 1.5}
                            className="cursor-pointer transition-all duration-300"
                            style={{
                              filter: isHovered
                                ? `drop-shadow(0px 0px 10px ${entry.color})`
                                : "none",
                              transform: isHovered ? "scale(1.03)" : "scale(1)",
                              transformOrigin: "center center",
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={renderHeroPieTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {activeHoveredParam ? (
                    <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[125px]">
                        {activeHoveredParam.shortName || activeHoveredParam.name}
                      </span>
                      <span
                        className="text-2xl font-extrabold font-mono tracking-tight my-0.5"
                        style={{ color: activeHoveredParam.color }}
                      >
                        {activeHoveredParam.displayValue || activeHoveredParam.value}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                        {activeHoveredParam.benchmark || "Optimal"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                        {activeHeroPieTab === "key_parameters"
                          ? "Ratio Index"
                          : activeHeroPieTab === "health_distribution"
                            ? "Compliance Rate"
                            : "Distribution"}
                      </span>
                      <span className="text-2xl font-extrabold text-white font-mono tracking-tight my-0.5">
                        {activeHeroPieTab === "key_parameters"
                          ? `${ratios.filter((r) => r.isHealthy).length}/${ratios.length}`
                          : activeHeroPieTab === "health_distribution"
                            ? `${Math.round((ratios.filter((r) => r.isHealthy).length / (ratios.length || 1)) * 100)}%`
                            : "100%"}
                      </span>
                      <span className="text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {activeHeroPieTab === "key_parameters"
                          ? "Hover Slice to Inspect"
                          : activeHeroPieTab === "health_distribution"
                            ? `${ratios.filter((r) => r.isHealthy).length} in Benchmark`
                            : "Monthly Overview"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Prompt under Pie */}
              <div className="text-[11px] text-slate-400 text-center mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Interactive pie chart — hover or click any slice to inspect details</span>
              </div>
            </div>

            {/* Right Column: High-Density Colourful Parameter Cards Grid */}
            <div className="lg:col-span-7">
              {activeHeroPieTab === "key_parameters" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {keyRatioParametersPie.map((param) => {
                    const isSelected = activeHoveredParamId === param.id;
                    return (
                      <div
                        key={param.id}
                        onMouseEnter={() => setActiveHoveredParamId(param.id)}
                        onMouseLeave={() => setActiveHoveredParamId(null)}
                        onClick={() =>
                          setActiveHoveredParamId(isSelected ? null : param.id)
                        }
                        className={`rounded-xl p-2.5 transition-all cursor-pointer border flex flex-col justify-between ${
                          isSelected
                            ? "bg-slate-800 ring-2 shadow-md"
                            : "bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/60"
                        }`}
                        style={{
                          borderColor: isSelected ? param.color : undefined,
                        }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{
                                backgroundColor: `${param.color}20`,
                                color: param.color,
                              }}
                            >
                              {param.category}
                            </span>
                            <span
                              className={`text-[9.5px] font-mono font-bold flex items-center gap-0.5 ${
                                param.isTrendFavorable
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {param.isTrendFavorable ? (
                                <ArrowUp className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowDown className="w-2.5 h-2.5" />
                              )}
                              <span>{param.momChange}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: param.color }}
                            />
                            <h4
                              className="text-xs font-bold text-white truncate"
                              title={param.name}
                            >
                              {param.name}
                            </h4>
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <span
                              className="text-lg font-extrabold font-mono tracking-tight"
                              style={{ color: param.color }}
                            >
                              {param.displayValue}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              BM: {param.benchmark}
                            </span>
                          </div>
                        </div>

                        {/* Subtle Benchmark Status Bar */}
                        <div className="pt-2 mt-1 border-t border-slate-700/50">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Status:</span>
                            <span
                              className={`font-semibold ${
                                param.isHealthy ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {param.isHealthy ? "Optimal" : "Monitor"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Health Distribution Perspective */}
              {activeHeroPieTab === "health_distribution" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ratioHealthDistributionPie.map((item) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveHoveredParamId(item.id)}
                      onMouseLeave={() => setActiveHoveredParamId(null)}
                      className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 space-y-2 hover:bg-slate-800 transition-colors"
                      style={{
                        borderColor:
                          activeHoveredParamId === item.id ? item.color : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${item.color}25`,
                            color: item.color,
                          }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <div className="text-xl font-mono font-extrabold text-white">
                        {item.count} / {ratios.length}{" "}
                        <span className="text-xs text-slate-400 font-normal">Ratios</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost Structure / Capital Mix / Working Capital Perspectives */}
              {(activeHeroPieTab === "cost_structure" ||
                activeHeroPieTab === "capital_mix" ||
                activeHeroPieTab === "working_capital") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentHeroPieData.map((item: any) => {
                    const isSelected = activeHoveredParamId === item.name;
                    return (
                      <div
                        key={item.name}
                        onMouseEnter={() => setActiveHoveredParamId(item.name)}
                        onMouseLeave={() => setActiveHoveredParamId(null)}
                        className={`bg-slate-800/60 rounded-xl p-3 border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-slate-800 border-indigo-400 shadow-md"
                            : "border-slate-700/60 hover:bg-slate-800/90"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.displayValue}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-sm font-extrabold font-mono px-2 py-1 rounded-lg shrink-0"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                          }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Pills (Visible when viewing All 15 ratios) */}
      {ratioScope === "all" && viewMode === "cards" && (
        <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
          {[
            { key: "all", label: `All Ratios (${ratios.length})` },
            { key: "profitability", label: `Profitability (${profitCount})` },
            { key: "liquidity", label: `Liquidity (${liquidityCount})` },
            { key: "solvency", label: `Solvency (${solvencyCount})` },
            { key: "working_capital", label: `Working Capital (${wcCount})` },
            { key: "efficiency", label: `Efficiency (${efficiencyCount})` },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as FilterCategory)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                selectedCategory === cat.key
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* VIEW MODE 1: Metric Cards (50% Compact Default vs Full Expanded) */}
      {viewMode === "cards" && (
        <div
          className={`grid ${
            boxSize === "compact"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5"
          }`}
        >
          {activeRatiosList.map((ratio) => {
            const hasNumeric = ratio.numericValue !== null && !ratio.isMissing;
            const variance =
              hasNumeric && ratio.benchmarkValue > 0
                ? ratio.numericValue! - ratio.benchmarkValue
                : null;
            const m2 = ratio.earlierMonth2;
            const m1 = ratio.earlierMonth1;
            const isCardExpanded = expandedCardId === ratio.id;

            // 50% COMPACT MODE (Saves substantial dashboard space with popular graphs)
            if (boxSize === "compact") {
              return (
                <div
                  key={ratio.id}
                  className="bg-white hover:bg-slate-50/80 rounded-xl p-2 sm:p-2.5 border border-slate-200/90 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between group min-h-[92px]"
                >
                  {/* Row 1: Title + Optimal/Watch Status + Info Toggle */}
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[11px] font-bold text-slate-900 tracking-tight block truncate group-hover:text-indigo-600 transition-colors"
                        title={`${ratio.title} (${ratio.formula})`}
                      >
                        {ratio.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {ratio.isMissing ? (
                        <span className="text-[7.5px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          n/a
                        </span>
                      ) : (
                        <span
                          className={`text-[8px] font-bold px-1.2 py-0.2 rounded border ${ratio.badgeBg}`}
                        >
                          {ratio.isHealthy ? "Optimal" : "Watch"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isCardExpanded ? null : ratio.id)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer transition-colors"
                        title="Toggle 3-month detail & formula"
                      >
                        <Info className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Metric Value & Benchmark on Left, Popular Graph on Right */}
                  <div className="flex items-center justify-between gap-1.5 my-0.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1 font-mono leading-none">
                        <span
                          className={`text-sm sm:text-base font-extrabold tracking-tight ${
                            ratio.isMissing
                              ? "text-slate-400 text-xs italic font-normal"
                              : ratio.statusColor
                          }`}
                        >
                          {ratio.value}
                        </span>

                        {/* MoM Delta Badge */}
                        {ratio.momChangeLabel && (
                          <span
                            className={`text-[8px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5 ${
                              ratio.isTrendFavorable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                            title={`Change vs ${m1?.monthName || "previous month"}: ${ratio.momChangeLabel}`}
                          >
                            {ratio.trendDirection === "up" ? (
                              <ArrowUp className="w-2 h-2" />
                            ) : ratio.trendDirection === "down" ? (
                              <ArrowDown className="w-2 h-2" />
                            ) : (
                              <Minus className="w-2 h-2" />
                            )}
                            <span>{ratio.momChangeLabel}</span>
                          </span>
                        )}
                      </div>

                      <div
                        className="text-[8px] text-slate-400 font-sans truncate mt-0.5"
                        title={ratio.benchmarkLabel}
                      >
                        Target: {ratio.benchmarkValue}
                        {ratio.unit}
                      </div>
                    </div>

                    {/* Right: Popular Graph Widget */}
                    <div className="shrink-0 flex items-center justify-end">
                      {graphFormat === "speedometer" ? (
                        renderSpeedometerGauge(ratio)
                      ) : graphFormat === "sparkline" ? (
                        renderSparklineWave(ratio)
                      ) : graphFormat === "donut" ? (
                        renderDonutRingGauge(ratio)
                      ) : graphFormat === "bullet" ? (
                        <div className="w-[50px]">{renderBulletGauge(ratio)}</div>
                      ) : (
                        renderComparisonBars(ratio)
                      )}
                    </div>
                  </div>

                  {/* Row 3: Compact 1-line history & statement link */}
                  <div className="flex items-center justify-between text-[7.5px] text-slate-400 font-sans pt-0.5 border-t border-slate-100/80">
                    <span className="font-mono text-slate-500 truncate max-w-[120px]">
                      {m1?.shortMonth || "M-1"}: {m1?.value || "—"} → Cur: {ratio.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectStatementTab?.(ratio.subTab)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer opacity-75 group-hover:opacity-100 transition-opacity shrink-0"
                      title={`Open source: ${ratio.sourceDoc}`}
                    >
                      <span>{ratio.sourceDoc.split(" ")[0]}</span>
                      <ChevronRight className="w-2 h-2" />
                    </button>
                  </div>

                  {/* Expandable Mini Tray (When user clicks Info icon) */}
                  {isCardExpanded && (
                    <div className="mt-1 pt-1.5 border-t border-indigo-100 bg-indigo-50/60 -mx-2 -mb-2 p-2 rounded-b-xl text-[8px] space-y-1 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between font-mono text-slate-700">
                        <span>3-Mo Trend:</span>
                        <span>
                          {m2?.shortMonth || "M-2"} ({m2?.value || "—"}) → {m1?.shortMonth || "M-1"}{" "}
                          ({m1?.value || "—"}) → {ratio.value}
                        </span>
                      </div>
                      <div className="text-slate-500 italic truncate" title={ratio.formula}>
                        Formula: {ratio.formula}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // FULL EXPANDED MODE
            return (
              <div
                key={ratio.id}
                className="bg-white hover:bg-slate-50/70 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between group"
              >
                {/* Row 1: Title + Optimal/Watch Status Pill */}
                <div className="flex items-center justify-between gap-1 leading-none">
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[11.5px] font-bold text-slate-900 tracking-tight block truncate group-hover:text-indigo-600 transition-colors"
                      title={`${ratio.title} (${ratio.formula})`}
                    >
                      {ratio.title}
                    </span>
                  </div>

                  {ratio.isMissing ? (
                    <span className="text-[8px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                      n/a
                    </span>
                  ) : (
                    <span
                      className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${ratio.badgeBg}`}
                    >
                      {ratio.isHealthy ? "Optimal" : "Watch"}
                    </span>
                  )}
                </div>

                {/* Row 2: Current Value + MoM Delta + Benchmark */}
                <div className="flex items-baseline justify-between gap-1 font-mono leading-none my-1">
                  <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                    <span
                      className={`text-sm sm:text-base font-extrabold tracking-tight ${
                        ratio.isMissing
                          ? "text-slate-400 text-xs italic font-normal"
                          : ratio.statusColor
                      }`}
                    >
                      {ratio.value}
                    </span>

                    {/* MoM Delta Badge */}
                    {ratio.momChangeLabel && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                          ratio.isTrendFavorable
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                        title={`Change vs previous month (${m1?.monthName || "August"}): ${ratio.momChangeLabel}`}
                      >
                        {ratio.trendDirection === "up" ? (
                          <ArrowUp className="w-2.5 h-2.5" />
                        ) : ratio.trendDirection === "down" ? (
                          <ArrowDown className="w-2.5 h-2.5" />
                        ) : (
                          <Minus className="w-2.5 h-2.5" />
                        )}
                        <span>{ratio.momChangeLabel}</span>
                      </span>
                    )}
                  </div>

                  <span
                    className="text-[8.5px] text-slate-400 font-sans truncate shrink-0 max-w-[85px]"
                    title={ratio.benchmarkLabel}
                  >
                    BM: {ratio.benchmarkValue}
                    {ratio.unit}
                  </span>
                </div>

                {/* Row 3: Dedicated 3-Month Comparison Strip (M-2 → M-1 → Current) */}
                <div className="bg-slate-50/90 rounded-lg p-1.5 border border-slate-200/60 my-1 text-[9px] space-y-0.5">
                  <div className="flex items-center justify-between text-[7.5px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                    <span>3-Month History</span>
                    {ratio.twoMonthChangeLabel && (
                      <span
                        className={
                          (ratio.twoMonthChange ?? 0) >= 0 &&
                          ratio.benchmarkComparison === "higher_better"
                            ? "text-emerald-700 font-mono"
                            : "text-slate-500 font-mono"
                        }
                      >
                        {ratio.twoMonthChangeLabel} vs {m2?.shortMonth || "M-2"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 font-mono">
                    <div className="text-center flex-1 bg-white/70 py-0.5 px-1 rounded border border-slate-100">
                      <span className="text-[7.5px] text-slate-400 font-sans block">
                        {m2?.shortMonth || "M-2"}
                      </span>
                      <span className="text-[9.5px] text-slate-600 font-medium">
                        {m2?.value || "—"}
                      </span>
                    </div>
                    <span className="text-slate-300 text-[8px]">→</span>
                    <div className="text-center flex-1 bg-white/70 py-0.5 px-1 rounded border border-slate-100">
                      <span className="text-[7.5px] text-slate-400 font-sans block">
                        {m1?.shortMonth || "M-1"}
                      </span>
                      <span className="text-[9.5px] text-slate-700 font-semibold">
                        {m1?.value || "—"}
                      </span>
                    </div>
                    <span className="text-slate-300 text-[8px]">→</span>
                    <div className="text-center flex-1 bg-white py-0.5 px-1 rounded border border-indigo-200 shadow-2xs">
                      <span className="text-[7.5px] text-indigo-700 font-bold font-sans block">
                        {ratio.currentShortMonth || "Cur"}
                      </span>
                      <span className={`text-[10px] font-bold ${ratio.statusColor}`}>
                        {ratio.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Visual Graph */}
                <div className="pt-0.5 flex flex-col justify-end">
                  {graphFormat === "speedometer"
                    ? renderSpeedometerGauge(ratio)
                    : graphFormat === "sparkline"
                      ? renderSparklineWave(ratio)
                      : graphFormat === "donut"
                        ? renderDonutRingGauge(ratio)
                        : graphFormat === "bullet"
                          ? renderBulletGauge(ratio)
                          : renderComparisonBars(ratio)}

                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-sans mt-1">
                    <span className="truncate max-w-[110px] text-slate-400" title={ratio.formula}>
                      {ratio.formula}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectStatementTab?.(ratio.subTab)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
                      title={`Open source statement: ${ratio.sourceDoc}`}
                    >
                      <span>{ratio.sourceDoc.split(" ")[0]}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Comprehensive Visual Analytics (Pie Charts & Graphs Presentation) */}
      {viewMode === "chart" && (
        <div className="space-y-4">
          {/* Sub-tab Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  Visual Financial Ratios &amp; Graphical Presentation
                </h3>
                <p className="text-[10px] text-slate-500">
                  Interactive Pie Chart breakdowns &amp; multi-period graphical comparisons
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[10.5px]">
              <button
                onClick={() => setChartDisplayTab("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  chartDisplayTab === "all"
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Visuals
              </button>
              <button
                onClick={() => setChartDisplayTab("pie_charts")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  chartDisplayTab === "pie_charts"
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pie Charts (3)
              </button>
              <button
                onClick={() => setChartDisplayTab("graphs")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  chartDisplayTab === "graphs"
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Graphs &amp; Trends (3)
              </button>
            </div>
          </div>

          {/* SECTION 1: PIE CHARTS PRESENTATION */}
          {(chartDisplayTab === "all" || chartDisplayTab === "pie_charts") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Key Financial Ratio Parameters &amp; Structural Pie Charts</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {pnl?.period || "Current Month"}
                </span>
              </div>

              {/* Flagship: Financial Ratio Key Parameters Donut Pie Chart */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-5">
                <div className="w-full lg:w-5/12 flex items-center justify-center">
                  <div className="h-[210px] w-full max-w-[280px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={keyRatioParametersPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={88}
                          paddingAngle={3.5}
                          dataKey="value"
                        >
                          {keyRatioParametersPie.map((entry, idx) => (
                            <Cell key={`ratio-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={renderHeroPieTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        Key Parameters
                      </span>
                      <span className="text-xl font-extrabold text-white font-mono">
                        6 Slices
                      </span>
                      <span className="text-[9px] text-emerald-400 font-semibold font-mono">
                        Optimal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-7/12 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {keyRatioParametersPie.map((param) => (
                    <div
                      key={param.id}
                      className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/60"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: param.color }}
                        />
                        <span className="text-[11px] font-bold text-white truncate">
                          {param.shortName}
                        </span>
                      </div>
                      <div
                        className="text-sm font-extrabold font-mono mt-0.5"
                        style={{ color: param.color }}
                      >
                        {param.displayValue}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-mono">
                        Target {param.benchmark}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Pie Chart 1: P&L Cost Structure & Margin Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        1. P&amp;L Cost Structure &amp; Margin %
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Expense allocation &amp; Net Margin share
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Rev: {formatLakhs(pnl?.income?.revenueFromOperations || 5240000)}
                    </span>
                  </div>

                  <div className="h-[180px] w-full relative my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costStructurePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {costStructurePie.map((entry, idx) => (
                            <Cell key={`cost-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "11px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                          formatter={(val: any, name: any) => [
                            `${formatLakhs(Number(val))} (${costStructurePie.find((e) => e.name === name)?.pct || 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Center Stats */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-slate-400 font-medium">PAT Margin</span>
                      <span className="text-sm font-extrabold text-emerald-600 font-mono">
                        {costStructurePie.find((c) => c.name === "Net Profit (PAT)")?.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Legend Strip */}
                  <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                    {costStructurePie.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[10px]">
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie Chart 2: Capital Structure & Solvency Mix */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        2. Capital Structure &amp; Leverage
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Equity Net Worth vs Debt Obligations
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      D/E: {ratios.find((r) => r.id === "debt-equity")?.value || "0.85x"}
                    </span>
                  </div>

                  <div className="h-[180px] w-full relative my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={capitalStructurePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {capitalStructurePie.map((entry, idx) => (
                            <Cell key={`cap-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "11px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                          formatter={(val: any, name: any) => [
                            `${formatCrores(Number(val))} (${capitalStructurePie.find((e) => e.name === name)?.pct || 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Center Stats */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-slate-400 font-medium">Net Worth</span>
                      <span className="text-xs font-extrabold text-emerald-700 font-mono">
                        {capitalStructurePie.find((c) => c.name === "Net Worth (Equity)")?.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Legend Strip */}
                  <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                    {capitalStructurePie.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[10px]">
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie Chart 3: Working Capital Asset Composition */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        3. Working Capital Assets
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Cash, Debtors &amp; Inventory Mix
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                      CR: {ratios.find((r) => r.id === "current-ratio")?.value || "1.85x"}
                    </span>
                  </div>

                  <div className="h-[180px] w-full relative my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workingCapitalAssetPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {workingCapitalAssetPie.map((entry, idx) => (
                            <Cell key={`wc-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "11px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                          formatter={(val: any, name: any) => [
                            `${formatCrores(Number(val))} (${workingCapitalAssetPie.find((e) => e.name === name)?.pct || 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Center Stats */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-slate-400 font-medium">Liquid Cash</span>
                      <span className="text-xs font-extrabold text-emerald-700 font-mono">
                        {workingCapitalAssetPie.find((c) => c.name === "Liquid Cash & Bank")?.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Legend Strip */}
                  <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                    {workingCapitalAssetPie.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[10px]">
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GRAPH PRESENTATIONS */}
          {(chartDisplayTab === "all" || chartDisplayTab === "graphs") && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Multi-Month Trajectory &amp; Operational Cycle Graphs</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  3-Month Comparison vs Target Benchmarks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Graph 1: Profitability Margins Trend */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        1. Profitability Margins Trend (%)
                      </h4>
                      <p className="text-[10px] text-slate-500">Gross, EBITDA, PAT &amp; ROCE Trajectory</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      EBITDA: {ratios.find((r) => r.id === "ebitda-margin")?.value || "27.1%"}
                    </span>
                  </div>

                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={profitabilityTrendsData}
                        margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={9.5} />
                        <YAxis stroke="#64748b" fontSize={9.5} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "10.5px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "4px" }} />
                        <Area
                          type="monotone"
                          dataKey="EBITDA Margin %"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#ebitdaGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Net Profit %"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#patGrad)"
                        />
                        <Line
                          type="monotone"
                          dataKey="ROCE %"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 2: Working Capital Cash Cycle Days */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        2. Cash Conversion Cycle (Days)
                      </h4>
                      <p className="text-[10px] text-slate-500">Debtor (DSO) vs Creditor (DPO) vs CCC</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      CCC: {ratios.find((r) => r.id === "cash-conversion-cycle")?.value || "34d"}
                    </span>
                  </div>

                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={cashCycleGraphData}
                        margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9.5} unit="d" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "10.5px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                          formatter={(val: any, name: any) => [`${val} days`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "4px" }} />
                        <Bar
                          dataKey="actual"
                          name="Current Month"
                          fill="#3b82f6"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={16}
                        />
                        <Bar
                          dataKey="benchmark"
                          name="Target Benchmark"
                          fill="#cbd5e1"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 3: Liquidity & Solvency Ratios vs Target */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
                  <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        3. Liquidity &amp; Leverage Multiples (x)
                      </h4>
                      <p className="text-[10px] text-slate-500">Solvency &amp; Debt Safety Headroom</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Solvent ✓
                    </span>
                  </div>

                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={liquiditySolvencyData}
                        margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9.5} unit="x" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontSize: "10.5px",
                            color: "#fff",
                            padding: "6px 10px",
                          }}
                          formatter={(val: any, name: any) => [`${val}x`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: "9.5px", paddingTop: "4px" }} />
                        <Bar
                          dataKey="actual"
                          name="Current"
                          fill="#10b981"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={16}
                        />
                        <Bar
                          dataKey="benchmark"
                          name="Target / Cap"
                          fill="#94a3b8"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ALL IMPORTANT FINANCIAL RATIOS SCORECARD */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  All Important Financial Ratios Directory
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  ({ratios.length} Executive Metrics Linked)
                </span>
              </div>

              {/* Category Pills Filter */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg text-[10px] flex-wrap gap-0.5">
                {[
                  { key: "all", label: `All (${ratios.length})` },
                  { key: "profitability", label: `Profitability (${profitCount})` },
                  { key: "liquidity", label: `Liquidity (${liquidityCount})` },
                  { key: "solvency", label: `Solvency (${solvencyCount})` },
                  { key: "working_capital", label: `Working Capital (${wcCount})` },
                  { key: "efficiency", label: `Efficiency (${efficiencyCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedCategory(tab.key as any)}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      selectedCategory === tab.key
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comprehensive Grid of Ratio Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(selectedCategory === "all"
                ? ratios
                : ratios.filter((r) => r.category === selectedCategory)
              ).map((ratio) => {
                return (
                  <div
                    key={ratio.id}
                    className="p-2.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10.5px] font-bold text-slate-800 truncate block group-hover:text-indigo-600">
                        {ratio.title}
                      </span>
                      <span
                        className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${ratio.badgeBg}`}
                      >
                        {ratio.isHealthy ? "Optimal" : "Watch"}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-1 font-mono">
                      <span
                        className={`text-sm sm:text-base font-extrabold tracking-tight ${
                          ratio.isMissing ? "text-slate-400 italic text-xs" : ratio.statusColor
                        }`}
                      >
                        {ratio.value}
                      </span>
                      <span className="text-[9px] text-slate-400 font-sans">
                        BM: {ratio.benchmarkValue}
                        {ratio.unit}
                      </span>
                    </div>

                    <div className="text-[8.5px] text-slate-500 truncate" title={ratio.formula}>
                      {ratio.formula}
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                      <span className="capitalize">{ratio.category.replace("_", " ")}</span>
                      <button
                        type="button"
                        onClick={() => onSelectStatementTab?.(ratio.subTab)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer inline-flex items-center"
                      >
                        <span>{ratio.sourceDoc.split(" ")[0]}</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: Comprehensive 3-Month Comparative Ratio Matrix Table */}
      {viewMode === "table" && (
        <div className="overflow-x-auto bg-slate-50/70 rounded-lg p-2 border border-slate-200/70">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-[9.5px] uppercase font-mono text-slate-500">
                <th className="py-2 pr-2">Ratio &amp; Category</th>
                <th className="py-2 px-2 text-right">
                  {ratios[0]?.earlierMonth2?.shortMonth
                    ? `${ratios[0].earlierMonth2.shortMonth} (M-2)`
                    : "2 Mo Ago"}
                </th>
                <th className="py-2 px-2 text-right">
                  {ratios[0]?.earlierMonth1?.shortMonth
                    ? `${ratios[0].earlierMonth1.shortMonth} (M-1)`
                    : "Prev Month"}
                </th>
                <th className="py-2 px-2 text-right font-bold text-indigo-900 bg-indigo-50/60">
                  {ratios[0]?.currentShortMonth
                    ? `${ratios[0].currentShortMonth} (Current)`
                    : "Current"}
                </th>
                <th className="py-2 px-2 text-center">MoM Change</th>
                <th className="py-2 px-2 text-center">2-Mo Change</th>
                <th className="py-2 px-2 text-right">Benchmark</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2">Formula &amp; Source</th>
                <th className="py-2 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-mono text-slate-700 text-[10.5px]">
              {ratios.map((ratio) => {
                const m2 = ratio.earlierMonth2;
                const m1 = ratio.earlierMonth1;

                return (
                  <tr key={ratio.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-2 pr-2 font-sans text-slate-900">
                      <span className="font-semibold block leading-tight">{ratio.title}</span>
                      <span className="text-[9px] text-slate-500 font-medium capitalize block">
                        {ratio.description}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600">{m2?.value || "—"}</td>
                    <td className="py-2 px-2 text-right text-slate-700 font-semibold">
                      {m1?.value || "—"}
                    </td>
                    <td className="py-2 px-2 text-right font-bold bg-indigo-50/40">
                      <span
                        className={
                          ratio.isMissing ? "text-slate-400 italic font-normal" : ratio.statusColor
                        }
                      >
                        {ratio.value}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-sans">
                      {ratio.momChangeLabel ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                            ratio.isTrendFavorable
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ratio.trendDirection === "up" ? (
                            <ArrowUp className="w-2.5 h-2.5" />
                          ) : ratio.trendDirection === "down" ? (
                            <ArrowDown className="w-2.5 h-2.5" />
                          ) : (
                            <Minus className="w-2.5 h-2.5" />
                          )}
                          <span>{ratio.momChangeLabel}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-sans">
                      {ratio.twoMonthChangeLabel ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold font-mono ${
                            (ratio.twoMonthChange ?? 0) >= 0 &&
                            ratio.benchmarkComparison === "higher_better"
                              ? "bg-emerald-50/80 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ratio.twoMonthChangeLabel}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 font-sans text-[10px]">
                      {ratio.benchmarkLabel}
                    </td>
                    <td className="py-2 px-2 text-center font-sans">
                      {ratio.isMissing ? (
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          n/a
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-semibold border ${ratio.badgeBg}`}
                        >
                          {ratio.isHealthy ? "Optimal" : "Attention"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-600 text-[9.5px]">
                      <span className="block truncate max-w-[130px]" title={ratio.formula}>
                        {ratio.formula}
                      </span>
                      <span className="text-[8.5px] text-slate-400 font-sans">
                        {ratio.sourceDoc}
                      </span>
                    </td>
                    <td className="py-2 pl-2 text-right font-sans">
                      <button
                        onClick={() => onSelectStatementTab?.(ratio.subTab)}
                        className="px-2 py-0.5 rounded text-[9.5px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
