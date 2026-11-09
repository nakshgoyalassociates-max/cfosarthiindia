// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { INITIAL_THREE_MONTH_CASH_BUDGET } from "../../data/mockThreeMonthCashBudget";
import { NEXORA_FUND_FLOW } from "../../data/mockMisFinancials";
import {
  ThreeMonthCashBudgetModel,
  CashFlowWeekMeta,
  WeeklyCashFlowLineItem,
  ManagementShortageAction,
  FundFlowData,
  ClientProfile,
} from "../../types";
import { formatINR } from "../../utils/format";
import {
  computeWeeklyCashFlowSummary,
  GrandCashBudgetSummary,
  WeekCalculatedSummary,
} from "../../utils/cashBudgetCalculations";
import {
  generate13WeekCashFlowExcel,
  parseWeeklyActualsFromExcel,
} from "../../utils/cashBudgetExcelHelper";
import { WeeklyActualsModal } from "./WeeklyActualsModal";
import { ManagementShortagePlanModal } from "./ManagementShortagePlanModal";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  Wallet,
  ArrowRightLeft,
  Calendar,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  Edit3,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Building2,
  DollarSign,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Scale,
} from "lucide-react";

export interface CashFlowDashboardViewProps {
  fundFlow?: FundFlowData;
  cashBudget?: ThreeMonthCashBudgetModel;
  clientProfile?: ClientProfile;
  defaultHorizon?: "8-weeks" | "12-weeks" | "month-1" | "month-2";
  defaultViewMode?: "proper-cash-flow" | "movement-runway" | "fund-flow" | "shortage-planner";
  onUpdateWeeklyActuals?: (
    weekId: string,
    updates: Array<{ itemId: string; actual: number; notes?: string }>,
    isClosed: boolean,
  ) => void;
  onAddShortageAction?: (action: Omit<ManagementShortageAction, "id">) => void;
  onUpdateShortageActionStatus?: (
    actionId: string,
    status: ManagementShortageAction["status"],
  ) => void;
  onDeleteShortageAction?: (actionId: string) => void;
  onUpdateConfig?: (config: {
    startingCashBalance?: number;
    minimumSafeBuffer?: number;
    sanctionedODLimit?: number;
  }) => void;
  showToast?: (msg: string) => void;
}

// Helper to get effective value for an item in a week (actual if present, else budget)
function getItemValue(item: WeeklyCashFlowLineItem, weekId: string): number {
  const data = item.weekly[weekId];
  if (!data) return 0;
  if (typeof data.actual === "number") return data.actual;
  return Number(data.budget) || 0;
}

// Helper to sum multiple items for a specific week
function sumItemsForWeek(items: WeeklyCashFlowLineItem[], weekId: string): number {
  return items.reduce((acc, it) => acc + getItemValue(it, weekId), 0);
}

export const CashFlowDashboardView: React.FC<CashFlowDashboardViewProps> = ({
  fundFlow: propFundFlow,
  cashBudget: propCashBudget,
  clientProfile: propClientProfile,
  defaultHorizon = "8-weeks",
  defaultViewMode = "proper-cash-flow",
  onUpdateWeeklyActuals: propOnUpdateWeeklyActuals,
  onAddShortageAction: propOnAddShortageAction,
  onUpdateShortageActionStatus: propOnUpdateShortageActionStatus,
  onDeleteShortageAction: propOnDeleteShortageAction,
  onUpdateConfig: propOnUpdateConfig,
  showToast: propShowToast,
}) => {
  const app = useApp();
  const cashBudget = propCashBudget || app.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
  const fundFlow = propFundFlow || app.financialMIS.fundFlow || NEXORA_FUND_FLOW;
  const clientProfile = propClientProfile || app.clientProfile;
  const onUpdateWeeklyActuals = propOnUpdateWeeklyActuals || app.updateWeeklyCashActuals;
  const onAddShortageAction = propOnAddShortageAction || app.addShortageAction;
  const onUpdateShortageActionStatus =
    propOnUpdateShortageActionStatus || app.updateShortageActionStatus;
  const onDeleteShortageAction = propOnDeleteShortageAction || app.deleteShortageAction;
  const onUpdateConfig = propOnUpdateConfig || app.updateCashBudgetConfig;
  const showToast = propShowToast || app.showToast;

  // View States
  const [showInLakhs, setShowInLakhs] = useState(true);
  const [viewMode, setViewMode] = useState<
    "proper-cash-flow" | "movement-runway" | "fund-flow" | "shortage-planner"
  >(defaultViewMode);
  const [horizon, setHorizon] = useState<"8-weeks" | "12-weeks" | "month-1" | "month-2">(
    defaultHorizon,
  );

  // Expanded sections in Proper Cash Flow Statement
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operating_inflows: true,
    operating_outflows: true,
    statutory_dues: true,
    investing_activities: true,
    financing_activities: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Modal states
  const [selectedWeekForActuals, setSelectedWeekForActuals] = useState<CashFlowWeekMeta | null>(
    null,
  );
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedActionForEdit, setSelectedActionForEdit] =
    useState<ManagementShortageAction | null>(null);
  const [actionModalDefaultWeek, setActionModalDefaultWeek] = useState<string>("w3");

  // Config parameters modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configStartingCash, setConfigStartingCash] = useState(
    String(cashBudget?.startingCashBalance ?? 2850000),
  );
  const [configBuffer, setConfigBuffer] = useState(
    String(cashBudget?.minimumSafeBuffer ?? 1500000),
  );
  const [configOD, setConfigOD] = useState(String(cashBudget?.sanctionedODLimit ?? 2500000));

  useEffect(() => {
    if (cashBudget) {
      setConfigStartingCash(String(cashBudget.startingCashBalance ?? 2850000));
      setConfigBuffer(String(cashBudget.minimumSafeBuffer ?? 1500000));
      setConfigOD(String(cashBudget.sanctionedODLimit ?? 2500000));
    }
  }, [cashBudget]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live 12-week cash summary & rolling balances
  const summary: GrandCashBudgetSummary = useMemo(() => {
    return computeWeeklyCashFlowSummary(cashBudget);
  }, [cashBudget]);

  const formatAmount = (amt: number): string => {
    return formatINR(amt, showInLakhs);
  };

  // Weeks displayed based on selected horizon:
  // "8-weeks": Weeks 1 to 8 (First two months: October + November)
  // "12-weeks": All 12 weeks
  // "month-1": Weeks 1 to 4 (October)
  // "month-2": Weeks 5 to 8 (November)
  const displayedWeeks = useMemo(() => {
    if (horizon === "8-weeks") {
      return cashBudget.weeks.slice(0, 8);
    }
    if (horizon === "12-weeks") {
      return cashBudget.weeks;
    }
    if (horizon === "month-1") {
      return cashBudget.weeks.filter((w) => w.monthIndex === 0);
    }
    if (horizon === "month-2") {
      return cashBudget.weeks.filter((w) => w.monthIndex === 1);
    }
    return cashBudget.weeks.slice(0, 8);
  }, [cashBudget.weeks, horizon]);

  const displayedWeekSummaries = useMemo(() => {
    const weekIds = new Set(displayedWeeks.map((w) => w.id));
    return summary.weeklySummaries.filter((ws) => weekIds.has(ws.week.id));
  }, [summary.weeklySummaries, displayedWeeks]);

  // Calculations for the active Horizon (e.g. Next 2 Months / 8 Weeks)
  const horizonStats = useMemo(() => {
    let totalInflows = 0;
    let totalOutflows = 0;
    displayedWeekSummaries.forEach((ws) => {
      totalInflows += ws.actualInflows;
      totalOutflows += ws.actualOutflows;
    });
    const netMovement = totalInflows - totalOutflows;
    const startBalance =
      displayedWeekSummaries[0]?.openingActualCash || cashBudget.startingCashBalance;
    const endBalance =
      displayedWeekSummaries[displayedWeekSummaries.length - 1]?.closingActualCash ||
      startBalance + netMovement;

    let lowestWs = displayedWeekSummaries[0] || summary.lowestCashWeek;
    displayedWeekSummaries.forEach((ws) => {
      if (ws.closingActualCash < lowestWs.closingActualCash) {
        lowestWs = ws;
      }
    });

    const deficitWeeks = displayedWeekSummaries.filter((w) => w.isDeficit);
    const bufferBreachWeeks = displayedWeekSummaries.filter(
      (w) => w.isBufferBreached && !w.isDeficit,
    );

    return {
      totalInflows,
      totalOutflows,
      netMovement,
      startBalance,
      endBalance,
      lowestWeek: lowestWs,
      deficitWeeks,
      bufferBreachWeeks,
    };
  }, [displayedWeekSummaries, cashBudget.startingCashBalance, summary.lowestCashWeek]);

  // Group line items into Proper Cash Flow Format (Ind AS 7 / AS-3)
  const cashFlowSections = useMemo(() => {
    // 1. Operating Activities
    const operatingInflows = cashBudget.items.filter(
      (it) =>
        it.category === "inflow" &&
        (it.section === "collections" ||
          it.section === "direct_sales" ||
          it.section === "statutory_refunds"),
    );

    const operatingOutflows = cashBudget.items.filter(
      (it) =>
        it.category === "outflow" &&
        (it.section === "supplier_payments" ||
          it.section === "payroll" ||
          it.section === "operating_overheads"),
    );

    const statutoryDues = cashBudget.items.filter(
      (it) => it.category === "outflow" && it.section === "statutory_dues",
    );

    // 2. Investing Activities
    const investingActivities = cashBudget.items.filter(
      (it) =>
        it.section === "capex" ||
        (it.category === "outflow" && it.name.toLowerCase().includes("capex")),
    );

    // 3. Financing Activities
    const financingActivities = cashBudget.items.filter(
      (it) =>
        it.section === "financing_inflow" ||
        it.section === "finance_costs" ||
        it.name.toLowerCase().includes("loan") ||
        it.name.toLowerCase().includes("od draw"),
    );

    // Any other items not captured
    const capturedIds = new Set([
      ...operatingInflows.map((i) => i.id),
      ...operatingOutflows.map((i) => i.id),
      ...statutoryDues.map((i) => i.id),
      ...investingActivities.map((i) => i.id),
      ...financingActivities.map((i) => i.id),
    ]);

    const otherItems = cashBudget.items.filter((it) => !capturedIds.has(it.id));

    return {
      operatingInflows,
      operatingOutflows,
      statutoryDues,
      investingActivities,
      financingActivities,
      otherItems,
    };
  }, [cashBudget.items]);

  // Helper to sum multiple items across the displayed weeks
  const sumItemsForHorizon = (items: WeeklyCashFlowLineItem[]): number => {
    return items.reduce((acc, it) => {
      let itemSum = 0;
      displayedWeeks.forEach((w) => {
        itemSum += getItemValue(it, w.id);
      });
      return acc + itemSum;
    }, 0);
  };

  // Calculate Net Totals per week for proper cash flow statement
  const weeklyCashFlowStatement = useMemo(() => {
    return displayedWeeks.map((week) => {
      const opInflows = sumItemsForWeek(cashFlowSections.operatingInflows, week.id);
      const opOutflows = sumItemsForWeek(cashFlowSections.operatingOutflows, week.id);
      const statOutflows = sumItemsForWeek(cashFlowSections.statutoryDues, week.id);
      const totalOpOutflows = opOutflows + statOutflows;
      const netCFO = opInflows - totalOpOutflows;

      const invOutflows = sumItemsForWeek(cashFlowSections.investingActivities, week.id);
      const netCFI = -invOutflows;

      const finInflows = cashFlowSections.financingActivities
        .filter((it) => it.category === "inflow")
        .reduce((sum, it) => sum + getItemValue(it, week.id), 0);
      const finOutflows = cashFlowSections.financingActivities
        .filter((it) => it.category === "outflow")
        .reduce((sum, it) => sum + getItemValue(it, week.id), 0);
      const netCFF = finInflows - finOutflows;

      const netCashChange = netCFO + netCFI + netCFF;

      const ws = summary.weeklySummaries.find((s) => s.week.id === week.id);
      const opening = ws?.openingActualCash || 0;
      const closing = ws?.closingActualCash || opening + netCashChange;

      return {
        week,
        opInflows,
        opOutflows,
        statOutflows,
        netCFO,
        invOutflows,
        netCFI,
        finInflows,
        finOutflows,
        netCFF,
        netCashChange,
        opening,
        closing,
        isDeficit: closing < 0,
        isBufferBreached: closing < cashBudget.minimumSafeBuffer && closing >= 0,
      };
    });
  }, [displayedWeeks, cashFlowSections, summary.weeklySummaries, cashBudget.minimumSafeBuffer]);

  // Horizon grand totals for Proper Cash Flow Statement
  const statementGrandTotals = useMemo(() => {
    let opInflows = 0;
    let opOutflows = 0;
    let statOutflows = 0;
    let invOutflows = 0;
    let finInflows = 0;
    let finOutflows = 0;

    weeklyCashFlowStatement.forEach((w) => {
      opInflows += w.opInflows;
      opOutflows += w.opOutflows;
      statOutflows += w.statOutflows;
      invOutflows += w.invOutflows;
      finInflows += w.finInflows;
      finOutflows += w.finOutflows;
    });

    const netCFO = opInflows - (opOutflows + statOutflows);
    const netCFI = -invOutflows;
    const netCFF = finInflows - finOutflows;
    const netCashChange = netCFO + netCFI + netCFF;
    const opening = weeklyCashFlowStatement[0]?.opening || cashBudget.startingCashBalance;
    const closing =
      weeklyCashFlowStatement[weeklyCashFlowStatement.length - 1]?.closing ||
      opening + netCashChange;

    return {
      opInflows,
      opOutflows,
      statOutflows,
      netCFO,
      invOutflows,
      netCFI,
      finInflows,
      finOutflows,
      netCFF,
      netCashChange,
      opening,
      closing,
    };
  }, [weeklyCashFlowStatement, cashBudget.startingCashBalance]);

  // Recharts Chart Data for 8-Week / Horizon Movement
  const chartData = useMemo(() => {
    return weeklyCashFlowStatement.map((w) => ({
      week: w.week.weekLabel,
      dateRange: w.week.dateRange,
      inflows: Math.round(w.opInflows + w.finInflows),
      outflows: Math.round(w.opOutflows + w.statOutflows + w.invOutflows + w.finOutflows),
      netChange: Math.round(w.netCashChange),
      closingCash: Math.round(w.closing),
      safeBuffer: Math.round(cashBudget.minimumSafeBuffer),
    }));
  }, [weeklyCashFlowStatement, cashBudget.minimumSafeBuffer]);

  // Handle Excel download
  const handleDownloadExcel = () => {
    try {
      const fileName = generate13WeekCashFlowExcel(
        cashBudget,
        clientProfile?.companyName || "Company",
      );
      showToast(`Downloaded Cash Flow & Fund Movement Spreadsheet: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Error generating Excel template.");
    }
  };

  // Handle Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseWeeklyActualsFromExcel(file, cashBudget);
      if (result.updates.length === 0) {
        showToast("No weekly actuals found in spreadsheet. Check template format.");
        return;
      }

      const weekGroups: Record<string, Array<{ itemId: string; actual: number }>> = {};
      result.updates.forEach((u) => {
        if (!weekGroups[u.weekId]) weekGroups[u.weekId] = [];
        weekGroups[u.weekId].push({ itemId: u.itemId, actual: u.actual });
      });

      Object.entries(weekGroups).forEach(([weekId, updates]) => {
        onUpdateWeeklyActuals(weekId, updates, true);
      });

      showToast(`Updated ${result.updatedCount} weekly actuals across statements.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to parse Excel file. Please use standard cash flow template.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Config Save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateConfig) {
      onUpdateConfig({
        startingCashBalance: Number(configStartingCash) || cashBudget.startingCashBalance,
        minimumSafeBuffer: Number(configBuffer) || cashBudget.minimumSafeBuffer,
        sanctionedODLimit: Number(configOD) || cashBudget.sanctionedODLimit,
      });
      showToast("Updated liquidity parameters & safety buffer.");
    }
    setIsConfigOpen(false);
  };

  // Fund Flow variables
  const { sources, applications, workingCapitalSchedule: wcs } = fundFlow;
  const isFundFlowBalanced = sources.totalSources === applications.totalApplications;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & EXECUTIVE CONTROLS BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs">
                <Wallet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center flex-wrap gap-2">
                  <span>Cash Flow & Funds Movement Dashboard</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    Proper AS-3 / Ind AS 7 Format
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    {horizon === "8-weeks"
                      ? "Next 2 Months (8 Weeks Active)"
                      : horizon === "12-weeks"
                        ? "Full 12-Week Horizon"
                        : horizon === "month-1"
                          ? "October 2026 (Month 1)"
                          : "November 2026 (Month 2)"}
                  </span>
                </h2>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Units Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setShowInLakhs(true)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  showInLakhs
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Lakhs
              </button>
              <button
                onClick={() => setShowInLakhs(false)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  !showInLakhs
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Exact ₹
              </button>
            </div>

            {/* Liquidity Parameters Modal */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Configure starting liquid cash, safe buffer, and bank OD limit"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Buffer & Limits</span>
            </button>

            {/* Excel Download */}
            <button
              onClick={handleDownloadExcel}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Excel Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Actuals</span>
            </button>

            {/* Shortage Mitigation Action Trigger */}
            <button
              onClick={() => {
                setSelectedActionForEdit(null);
                setActionModalDefaultWeek(horizonStats.lowestWeek.week.id);
                setIsActionModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Shortage Mitigation</span>
            </button>
          </div>
        </div>

        {/* 2. LIQUIDITY STATUS ALERT BANNER */}
        {horizonStats.deficitWeeks.length > 0 ? (
          <div className="mt-5 p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <span>
                    Deficit Warning: {horizonStats.deficitWeeks.length} Week(s) in Next 2 Months
                    Projected Negative
                  </span>
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Deepest cash valley occurs in{" "}
                  <strong>{horizonStats.lowestWeek.week.weekLabel}</strong> (
                  {horizonStats.lowestWeek.week.dateRange}) with projected cash balance of{" "}
                  <strong className="font-mono font-bold">
                    {formatAmount(horizonStats.lowestWeek.closingActualCash)}
                  </strong>
                  . Mandatory statutory & vendor discharges peak during this window.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-rose-700">
                  <span>
                    Active Mitigations: <strong>{cashBudget.shortageActions.length} planned</strong>{" "}
                    (+{formatAmount(summary.totalActionsRelief)} relief)
                  </span>
                  <span>•</span>
                  <span>
                    OD Cushion Remaining:{" "}
                    <strong className="font-mono">
                      {formatAmount(
                        cashBudget.sanctionedODLimit -
                          Math.max(0, -horizonStats.lowestWeek.closingActualCash),
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewMode("shortage-planner")}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-900 hover:bg-rose-950 text-white shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>Manage Mitigations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : horizonStats.bufferBreachWeeks.length > 0 ? (
          <div className="mt-5 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Safety Buffer Alert: Cash dips below minimum threshold (
                  {formatAmount(cashBudget.minimumSafeBuffer)})
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Valley point reaches{" "}
                  <strong>{formatAmount(horizonStats.lowestWeek.closingActualCash)}</strong> in{" "}
                  <strong>{horizonStats.lowestWeek.week.weekLabel}</strong> (
                  {horizonStats.lowestWeek.week.dateRange}). Early debtor collections or deferring
                  capex recommended.
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewMode("shortage-planner")}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>Review Mitigation Levers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-900">
                <strong>Strong Liquidity & Solvency Runway:</strong> Cash balances stay safely above
                your buffer floor ({formatAmount(cashBudget.minimumSafeBuffer)}) throughout the{" "}
                {horizon === "8-weeks" ? "8-week (2-month)" : "12-week"} window. Lowest projected
                point: {horizonStats.lowestWeek.week.weekLabel} (
                {formatAmount(horizonStats.lowestWeek.closingActualCash)}).
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              0 Deficit Weeks
            </span>
          </div>
        )}

        {/* 3. FOUR EXECUTIVE TREASURY & MOVEMENT KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          {/* Card 1: Opening Liquid Treasury */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">Opening Liquid Treasury</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-slate-900 font-mono">
                {formatAmount(horizonStats.startBalance)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Liquid cash & bank as of {displayedWeeks[0]?.dateRange.split(" - ")[0]}
              </p>
            </div>
          </div>

          {/* Card 2: 8-Week Inflows vs Outflows */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">
              {horizon === "8-weeks" ? "Next 2 Months (8-Wk) Movement" : "Horizon Movement"}
            </span>
            <div className="mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  +{formatAmount(horizonStats.totalInflows)}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-sm font-bold text-rose-700 font-mono">
                  -{formatAmount(horizonStats.totalOutflows)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Net Movement:{" "}
                <strong
                  className={`font-mono font-bold ${
                    horizonStats.netMovement >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {horizonStats.netMovement >= 0 ? "+" : ""}
                  {formatAmount(horizonStats.netMovement)}
                </strong>
              </p>
            </div>
          </div>

          {/* Card 3: Valley Cash Point */}
          <div
            className={`p-3.5 rounded-xl border ${
              horizonStats.lowestWeek.isDeficit
                ? "bg-rose-50/50 border-rose-200"
                : horizonStats.lowestWeek.isBufferBreached
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-emerald-50/50 border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 block">Lowest Projected Valley</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  horizonStats.lowestWeek.isDeficit
                    ? "bg-rose-600 text-white"
                    : horizonStats.lowestWeek.isBufferBreached
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                }`}
              >
                {horizonStats.lowestWeek.week.weekLabel}
              </span>
            </div>
            <div className="mt-1">
              <span
                className={`text-lg font-bold font-mono ${
                  horizonStats.lowestWeek.isDeficit
                    ? "text-rose-700"
                    : horizonStats.lowestWeek.isBufferBreached
                      ? "text-amber-800"
                      : "text-emerald-800"
                }`}
              >
                {formatAmount(horizonStats.lowestWeek.closingActualCash)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {horizonStats.lowestWeek.week.dateRange} • Buffer:{" "}
                {formatAmount(cashBudget.minimumSafeBuffer)}
              </p>
            </div>
          </div>

          {/* Card 4: Fund Flow & Working Capital Cushion */}
          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200">
            <span className="text-indigo-800 block font-medium">Funds from Operations (FFO)</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-indigo-900 font-mono">
                {formatAmount(fundFlow.sources.fundsFromOperations)}
              </span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Net working capital change: +{formatAmount(wcs.netChangeInWorkingCapital)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRIMARY NAVIGATION TABS & HORIZON SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* View Mode Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={() => setViewMode("proper-cash-flow")}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "proper-cash-flow"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Proper Cash Flow Statement & 8-Week Budget</span>
          </button>

          <button
            onClick={() => setViewMode("movement-runway")}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "movement-runway"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>8-Week Movement & Runway Charts</span>
          </button>

          <button
            onClick={() => setViewMode("fund-flow")}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "fund-flow"
                ? "bg-sky-700 text-white shadow-xs"
                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Fund Flow & Working Capital Schedule</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === "fund-flow" ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-800"
              }`}
            >
              Balanced
            </span>
          </button>

          <button
            onClick={() => setViewMode("shortage-planner")}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "shortage-planner"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-amber-800 hover:bg-amber-50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Shortage Mitigation Planner</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                viewMode === "shortage-planner"
                  ? "bg-amber-500/30 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {cashBudget.shortageActions.length} Actions
            </span>
          </button>
        </div>

        {/* Horizon Filter Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Horizon:</span>
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setHorizon("8-weeks")}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                horizon === "8-weeks"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Next 2 Months (8 Weeks)
            </button>
            <button
              onClick={() => setHorizon("12-weeks")}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                horizon === "12-weeks"
                  ? "bg-emerald-700 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Full Quarter (12 Weeks)
            </button>
            <button
              onClick={() => setHorizon("month-1")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                horizon === "month-1"
                  ? "bg-emerald-700 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Oct
            </button>
            <button
              onClick={() => setHorizon("month-2")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                horizon === "month-2"
                  ? "bg-emerald-700 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nov
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PROPER CASH FLOW STATEMENT (Ind AS 7 / AS-3) & 8-WEEK BUDGET */}
      {/* ========================================================================= */}
      {viewMode === "proper-cash-flow" && (
        <div className="space-y-6">


          {/* Main Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                {/* Column Headers */}
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 text-[11px]">
                    <th className="py-3 px-4 w-[280px] sticky left-0 bg-slate-900 z-10 shadow-r">
                      Cash Flow Activity / Line Item
                    </th>
                    {displayedWeeks.map((week) => (
                      <th
                        key={week.id}
                        className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                        onClick={() => setSelectedWeekForActuals(week)}
                        title="Click to view/enter actuals for this week"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-bold text-white font-mono">{week.weekLabel}</span>
                          {week.isActualsClosed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : week.id === "w3" ? (
                            <Clock className="w-3 h-3 text-amber-400" />
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {week.dateRange}
                        </div>
                        <div className="mt-0.5">
                          {week.isActualsClosed ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                              Actuals
                            </span>
                          ) : week.id === "w3" ? (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700 text-slate-300">
                              Budget
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right bg-slate-950 font-bold text-emerald-400 font-mono">
                      <div>Total Movement</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {horizon === "8-weeks" ? "8 Weeks (2 Mos)" : "Selected Horizon"}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* ============================================================== */}
                  {/* SECTION A: CASH FLOWS FROM OPERATING ACTIVITIES (CFO) */}
                  {/* ============================================================== */}
                  <tr className="bg-emerald-50/70 border-y border-emerald-200 font-bold text-emerald-950">
                    <td
                      colSpan={displayedWeeks.length + 2}
                      className="py-2 px-4 sticky left-0 bg-emerald-50/70 z-10 cursor-pointer"
                      onClick={() => toggleSection("operating_inflows")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedSections.operating_inflows ? (
                            <ChevronDown className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-700" />
                          )}
                          <span className="uppercase tracking-wider text-[11px]">
                            A. CASH FLOWS FROM OPERATING ACTIVITIES (CFO)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-900 font-extrabold">
                          Net CFO: {formatAmount(statementGrandTotals.netCFO)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* 1. Operating Inflows Subhead */}
                  {expandedSections.operating_inflows && (
                    <>
                      <tr className="bg-slate-50/60 text-slate-700 font-semibold text-[11px]">
                        <td className="py-1.5 px-6 sticky left-0 bg-slate-50/60 z-10 italic">
                          1. Operating Cash Receipts / Customer Collections
                        </td>
                        {displayedWeeks.map((w) => (
                          <td
                            key={w.id}
                            className="py-1.5 px-3 text-right font-mono font-medium text-emerald-800"
                          >
                            +
                            {formatAmount(sumItemsForWeek(cashFlowSections.operatingInflows, w.id))}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800 bg-slate-50">
                          +{formatAmount(statementGrandTotals.opInflows)}
                        </td>
                      </tr>

                      {/* Operating Inflow Line Items */}
                      {cashFlowSections.operatingInflows.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-8 text-slate-800 sticky left-0 bg-white z-10">
                            <span className="font-medium">{item.name}</span>
                          </td>
                          {displayedWeeks.map((w) => {
                            const val = getItemValue(item, w.id);
                            return (
                              <td
                                key={w.id}
                                className="py-1.5 px-3 text-right font-mono text-slate-700"
                              >
                                {val > 0 ? formatAmount(val) : "—"}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                            {formatAmount(sumItemsForHorizon([item]))}
                          </td>
                        </tr>
                      ))}

                      {/* 2. Operating Outflows Subhead */}
                      <tr className="bg-slate-50/60 text-slate-700 font-semibold text-[11px]">
                        <td className="py-1.5 px-6 sticky left-0 bg-slate-50/60 z-10 italic">
                          2. Operating Cash Payments (Suppliers, Payroll & Overheads)
                        </td>
                        {displayedWeeks.map((w) => (
                          <td
                            key={w.id}
                            className="py-1.5 px-3 text-right font-mono font-medium text-rose-700"
                          >
                            -
                            {formatAmount(
                              sumItemsForWeek(cashFlowSections.operatingOutflows, w.id),
                            )}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700 bg-slate-50">
                          -{formatAmount(statementGrandTotals.opOutflows)}
                        </td>
                      </tr>

                      {/* Operating Outflow Line Items */}
                      {cashFlowSections.operatingOutflows.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-8 text-slate-800 sticky left-0 bg-white z-10">
                            <span className="font-medium">{item.name}</span>
                          </td>
                          {displayedWeeks.map((w) => {
                            const val = getItemValue(item, w.id);
                            return (
                              <td
                                key={w.id}
                                className="py-1.5 px-3 text-right font-mono text-slate-700"
                              >
                                {val > 0 ? formatAmount(val) : "—"}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                            {formatAmount(sumItemsForHorizon([item]))}
                          </td>
                        </tr>
                      ))}

                      {/* 3. Statutory Cash Taxes & Dues Subhead */}
                      <tr className="bg-slate-50/60 text-slate-700 font-semibold text-[11px]">
                        <td className="py-1.5 px-6 sticky left-0 bg-slate-50/60 z-10 italic">
                          3. Direct Taxes & Statutory Remittances (GST, TDS, PF, Advance Tax)
                        </td>
                        {displayedWeeks.map((w) => (
                          <td
                            key={w.id}
                            className="py-1.5 px-3 text-right font-mono font-medium text-rose-700"
                          >
                            -{formatAmount(sumItemsForWeek(cashFlowSections.statutoryDues, w.id))}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700 bg-slate-50">
                          -{formatAmount(statementGrandTotals.statOutflows)}
                        </td>
                      </tr>

                      {/* Statutory Line Items */}
                      {cashFlowSections.statutoryDues.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-8 text-slate-800 sticky left-0 bg-white z-10">
                            <span className="font-medium">{item.name}</span>
                          </td>
                          {displayedWeeks.map((w) => {
                            const val = getItemValue(item, w.id);
                            return (
                              <td
                                key={w.id}
                                className="py-1.5 px-3 text-right font-mono text-slate-700"
                              >
                                {val > 0 ? formatAmount(val) : "—"}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                            {formatAmount(sumItemsForHorizon([item]))}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Net CFO Row */}
                  <tr className="bg-emerald-100/60 font-bold text-slate-900 border-t border-emerald-300">
                    <td className="py-2 px-4 sticky left-0 bg-emerald-100/60 z-10">
                      <span>NET CASH FLOW FROM OPERATING ACTIVITIES (A)</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td
                        key={w.week.id}
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          w.netCFO >= 0 ? "text-emerald-900" : "text-rose-700"
                        }`}
                      >
                        {w.netCFO >= 0 ? "+" : ""}
                        {formatAmount(w.netCFO)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100">
                      {statementGrandTotals.netCFO >= 0 ? "+" : ""}
                      {formatAmount(statementGrandTotals.netCFO)}
                    </td>
                  </tr>

                  {/* ============================================================== */}
                  {/* SECTION B: CASH FLOWS FROM INVESTING ACTIVITIES (CFI) */}
                  {/* ============================================================== */}
                  <tr className="bg-indigo-50/70 border-y border-indigo-200 font-bold text-indigo-950">
                    <td
                      colSpan={displayedWeeks.length + 2}
                      className="py-2 px-4 sticky left-0 bg-indigo-50/70 z-10 cursor-pointer"
                      onClick={() => toggleSection("investing_activities")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedSections.investing_activities ? (
                            <ChevronDown className="w-4 h-4 text-indigo-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-indigo-700" />
                          )}
                          <span className="uppercase tracking-wider text-[11px]">
                            B. CASH FLOWS FROM INVESTING ACTIVITIES (CFI)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-indigo-900 font-extrabold">
                          Net CFI: {formatAmount(statementGrandTotals.netCFI)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {expandedSections.investing_activities && (
                    <>
                      {cashFlowSections.investingActivities.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-8 text-slate-800 sticky left-0 bg-white z-10">
                            <span className="font-medium">{item.name}</span>
                          </td>
                          {displayedWeeks.map((w) => {
                            const val = getItemValue(item, w.id);
                            return (
                              <td
                                key={w.id}
                                className="py-1.5 px-3 text-right font-mono text-slate-700"
                              >
                                {val > 0 ? formatAmount(val) : "—"}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                            {formatAmount(sumItemsForHorizon([item]))}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Net CFI Row */}
                  <tr className="bg-indigo-100/60 font-bold text-slate-900 border-t border-indigo-300">
                    <td className="py-2 px-4 sticky left-0 bg-indigo-100/60 z-10">
                      <span>NET CASH FLOW FROM / (USED IN) INVESTING ACTIVITIES (B)</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td
                        key={w.week.id}
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          w.netCFI >= 0 ? "text-emerald-900" : "text-slate-700"
                        }`}
                      >
                        {w.netCFI !== 0 ? formatAmount(w.netCFI) : "—"}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-indigo-950 bg-indigo-100">
                      {statementGrandTotals.netCFI !== 0
                        ? formatAmount(statementGrandTotals.netCFI)
                        : "—"}
                    </td>
                  </tr>

                  {/* ============================================================== */}
                  {/* SECTION C: CASH FLOWS FROM FINANCING ACTIVITIES (CFF) */}
                  {/* ============================================================== */}
                  <tr className="bg-amber-50/70 border-y border-amber-200 font-bold text-amber-950">
                    <td
                      colSpan={displayedWeeks.length + 2}
                      className="py-2 px-4 sticky left-0 bg-amber-50/70 z-10 cursor-pointer"
                      onClick={() => toggleSection("financing_activities")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedSections.financing_activities ? (
                            <ChevronDown className="w-4 h-4 text-amber-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-amber-700" />
                          )}
                          <span className="uppercase tracking-wider text-[11px]">
                            C. CASH FLOWS FROM FINANCING ACTIVITIES (CFF)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-900 font-extrabold">
                          Net CFF: {formatAmount(statementGrandTotals.netCFF)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {expandedSections.financing_activities && (
                    <>
                      {cashFlowSections.financingActivities.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-8 text-slate-800 sticky left-0 bg-white z-10">
                            <span className="font-medium">{item.name}</span>
                          </td>
                          {displayedWeeks.map((w) => {
                            const val = getItemValue(item, w.id);
                            return (
                              <td
                                key={w.id}
                                className="py-1.5 px-3 text-right font-mono text-slate-700"
                              >
                                {val > 0 ? formatAmount(val) : "—"}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/40">
                            {formatAmount(sumItemsForHorizon([item]))}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Net CFF Row */}
                  <tr className="bg-amber-100/60 font-bold text-slate-900 border-t border-amber-300">
                    <td className="py-2 px-4 sticky left-0 bg-amber-100/60 z-10">
                      <span>NET CASH FLOW FROM / (USED IN) FINANCING ACTIVITIES (C)</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td
                        key={w.week.id}
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          w.netCFF >= 0 ? "text-emerald-900" : "text-slate-700"
                        }`}
                      >
                        {w.netCFF !== 0 ? formatAmount(w.netCFF) : "—"}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-100">
                      {statementGrandTotals.netCFF !== 0
                        ? formatAmount(statementGrandTotals.netCFF)
                        : "—"}
                    </td>
                  </tr>

                  {/* ============================================================== */}
                  {/* SECTION D: NET CASH MOVEMENT & LIQUID RECONCILIATION */}
                  {/* ============================================================== */}
                  <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-900">
                    <td className="py-2.5 px-4 sticky left-0 bg-slate-900 z-10">
                      <span className="text-emerald-400">NET CHANGE IN CASH (A + B + C)</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td
                        key={w.week.id}
                        className={`py-2.5 px-3 text-right font-mono font-extrabold ${
                          w.netCashChange >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {w.netCashChange >= 0 ? "+" : ""}
                        {formatAmount(w.netCashChange)}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400 bg-slate-950">
                      {statementGrandTotals.netCashChange >= 0 ? "+" : ""}
                      {formatAmount(statementGrandTotals.netCashChange)}
                    </td>
                  </tr>

                  {/* Opening Cash & Bank Balance */}
                  <tr className="bg-slate-100/70 font-semibold text-slate-800">
                    <td className="py-2 px-4 sticky left-0 bg-slate-100/70 z-10">
                      <span>Add: Opening Cash & Bank Balance</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td key={w.week.id} className="py-2 px-3 text-right font-mono text-slate-800">
                        {formatAmount(w.opening)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-200/70">
                      {formatAmount(statementGrandTotals.opening)}
                    </td>
                  </tr>

                  {/* Closing Cash & Bank Balance */}
                  <tr className="bg-emerald-50/90 font-extrabold text-slate-900 border-t border-emerald-300">
                    <td className="py-3 px-4 sticky left-0 bg-emerald-50/90 z-10">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-700" />
                        <span className="text-emerald-950 text-xs uppercase tracking-wide">
                          CLOSING CASH & BANK BALANCE
                        </span>
                      </div>
                    </td>
                    {weeklyCashFlowStatement.map((w) => (
                      <td
                        key={w.week.id}
                        className={`py-3 px-3 text-right font-mono font-extrabold text-sm ${
                          w.isDeficit
                            ? "text-rose-700 bg-rose-100/50"
                            : w.isBufferBreached
                              ? "text-amber-800 bg-amber-100/40"
                              : "text-emerald-950"
                        }`}
                      >
                        {formatAmount(w.closing)}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-950 bg-emerald-100">
                      {formatAmount(statementGrandTotals.closing)}
                    </td>
                  </tr>

                  {/* Minimum Safe Buffer & Runway */}
                  <tr className="bg-slate-50 text-[11px] text-slate-500">
                    <td className="py-1.5 px-4 sticky left-0 bg-slate-50 z-10 italic">
                      Minimum Safe Buffer Requirement
                    </td>
                    {displayedWeeks.map((w) => (
                      <td key={w.id} className="py-1.5 px-3 text-right font-mono text-slate-500">
                        {formatAmount(cashBudget.minimumSafeBuffer)}
                      </td>
                    ))}
                    <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-700 bg-slate-100">
                      {formatAmount(cashBudget.minimumSafeBuffer)}
                    </td>
                  </tr>

                  {/* Surplus / (Deficit) after Buffer */}
                  <tr className="bg-slate-50 text-[11px] font-semibold">
                    <td className="py-1.5 px-4 sticky left-0 bg-slate-50 z-10">
                      <span>Surplus / (Deficit) over Safe Buffer</span>
                    </td>
                    {weeklyCashFlowStatement.map((w) => {
                      const diff = w.closing - cashBudget.minimumSafeBuffer;
                      return (
                        <td
                          key={w.week.id}
                          className={`py-1.5 px-3 text-right font-mono ${
                            diff >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {diff >= 0 ? "+" : ""}
                          {formatAmount(diff)}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-3 text-right font-mono font-bold bg-slate-100">
                      {statementGrandTotals.closing - cashBudget.minimumSafeBuffer >= 0 ? "+" : ""}
                      {formatAmount(statementGrandTotals.closing - cashBudget.minimumSafeBuffer)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: 8-WEEK MOVEMENT & RUNWAY CHARTS */}
      {/* ========================================================================= */}
      {viewMode === "movement-runway" && (
        <div className="space-y-6">
          {/* Chart 1: Rolling Cash Balance & Safety Buffer Runway */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>8-Week Rolling Cash Balance & Safety Buffer Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual projection of closing liquid cash versus the ₹
                  {(cashBudget.minimumSafeBuffer / 100000).toFixed(1)}L minimum threshold
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-600 rounded"></span>
                  <span className="text-slate-600">Projected Cash</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 border-dashed border-b border-rose-500"></span>
                  <span className="text-rose-600 font-semibold">Safe Buffer Floor</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={{ stroke: "#CBD5E1" }}
                  />
                  <YAxis
                    tickFormatter={(v) => (showInLakhs ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`)}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={{ stroke: "#CBD5E1" }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatAmount(Number(val)), "Cash Balance"]}
                    labelFormatter={(label) => `Week: ${label}`}
                  />
                  <ReferenceLine
                    y={cashBudget.minimumSafeBuffer}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Safe Buffer ₹${(cashBudget.minimumSafeBuffer / 100000).toFixed(1)}L`,
                      fill: "#EF4444",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="closingCash"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cashFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Weekly Inflows vs Outflows Comparative Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Weekly Inflows vs Total Outflows</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of cash collections against operating & statutory commitments
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) =>
                        showInLakhs ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`
                      }
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />
                    <Tooltip formatter={(val: any) => [formatAmount(Number(val))]} />
                    <Legend />
                    <Bar
                      dataKey="inflows"
                      fill="#10B981"
                      name="Cash Inflow"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="outflows"
                      fill="#F43F5E"
                      name="Total Outflow"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Weekly Net Cash Flow (Surplus vs Burn) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Weekly Net Cash Flow (Surplus / Burn)</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Net liquidity generation or drain week-by-week
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) =>
                        showInLakhs ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`
                      }
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />
                    <Tooltip formatter={(val: any) => [formatAmount(Number(val)), "Net Flow"]} />
                    <ReferenceLine y={0} stroke="#64748B" />
                    <Bar dataKey="netChange" name="Net Flow" radius={[4, 4, 0, 0]} fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Week-by-Week 8-Week Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyCashFlowStatement.map((w) => (
              <div
                key={w.week.id}
                onClick={() => setSelectedWeekForActuals(w.week)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  w.isDeficit
                    ? "bg-rose-50/60 border-rose-300"
                    : w.isBufferBreached
                      ? "bg-amber-50/60 border-amber-300"
                      : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-mono">
                    {w.week.weekLabel}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      w.week.isActualsClosed
                        ? "bg-emerald-100 text-emerald-800"
                        : w.week.id === "w3"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {w.week.isActualsClosed ? "Actual" : w.week.id === "w3" ? "Active" : "Forecast"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{w.week.dateRange}</div>

                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opening:</span>
                    <span className="font-mono text-slate-700">{formatAmount(w.opening)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Inflows:</span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      +{formatAmount(w.opInflows + w.finInflows)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-700 font-medium">Outflows:</span>
                    <span className="font-mono text-rose-800 font-semibold">
                      -{formatAmount(w.opOutflows + w.statOutflows + w.invOutflows + w.finOutflows)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span className="text-slate-900">Closing Cash:</span>
                    <span
                      className={`font-mono ${
                        w.isDeficit
                          ? "text-rose-700"
                          : w.isBufferBreached
                            ? "text-amber-800"
                            : "text-emerald-800"
                      }`}
                    >
                      {formatAmount(w.closing)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: FUND FLOW STATEMENT & WORKING CAPITAL SCHEDULE */}
      {/* ========================================================================= */}
      {viewMode === "fund-flow" && (
        <div className="space-y-6">
          {/* Header & Balance Check Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-sky-600" />
                  <span>Fund Flow Statement (Sources & Applications)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Period: {fundFlow.period} • Reconciled against Balance Sheet & P&L reserves
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                  isFundFlowBalanced
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Funds Balanced: {formatAmount(sources.totalSources)}</span>
              </div>
            </div>

            {/* 3 Fund Movement Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block font-medium">
                  Opening Cash & Bank Balance
                </span>
                <div className="mt-1">
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {formatAmount(fundFlow.openingCashAndBank)}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Liquid funds at period start</p>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block font-medium">
                  Net Increase in Liquid Funds
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-emerald-900 font-mono">
                    +{formatAmount(fundFlow.netMovementOfFunds)}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Positive Flow
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Operating and treasury surplus
                </p>
              </div>

              <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200">
                <span className="text-indigo-800 block font-medium">
                  Closing Cash & Bank Balance
                </span>
                <div className="mt-1">
                  <span className="text-lg font-bold text-indigo-900 font-mono">
                    {formatAmount(fundFlow.closingCashAndBank)}
                  </span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Liquid treasury as of period close
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Fund Flow: SOURCES vs APPLICATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* SOURCES OF FUNDS */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    Sources of Funds (Inflows)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-300">
                  {formatAmount(sources.totalSources)}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      1. Funds from Operations (FFO)
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      Net Profit (₹8.65L) + Non-Cash D&A & Provisions
                    </span>
                  </div>
                  <span className="font-mono text-slate-900 font-bold">
                    {formatAmount(sources.fundsFromOperations)}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      2. Long-Term Borrowings Raised
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      Bank Term Loan Tranche for Infrastructure
                    </span>
                  </div>
                  <span className="font-mono text-slate-900">
                    {formatAmount(sources.longTermBorrowingsRaised)}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      3. Issue of Share Capital / Equity
                    </strong>
                    <span className="text-[11px] text-slate-400">No equity dilution in period</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    {sources.issueOfShareCapital > 0
                      ? formatAmount(sources.issueOfShareCapital)
                      : "—"}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      4. Sale / Disposal of Fixed Assets
                    </strong>
                    <span className="text-[11px] text-slate-400">Zero asset disposals</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    {sources.saleOfFixedAssets > 0 ? formatAmount(sources.saleOfFixedAssets) : "—"}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      5. Decrease in Working Capital
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      Not applicable (Working Capital increased)
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">—</span>
                </div>

                {/* Total Sources Footer */}
                <div className="p-4 bg-emerald-50/60 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-emerald-300">
                  <span className="text-sm">TOTAL SOURCES OF FUNDS</span>
                  <span className="font-mono text-base text-emerald-950">
                    {formatAmount(sources.totalSources)}
                  </span>
                </div>
              </div>
            </div>

            {/* APPLICATIONS OF FUNDS */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    Applications of Funds (Outflows)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-300">
                  {formatAmount(applications.totalApplications)}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      1. Purchase of Fixed Assets (Capex)
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      MacBook Hardware & Network Firewalls
                    </span>
                  </div>
                  <span className="font-mono text-slate-900">
                    {formatAmount(applications.purchaseOfFixedAssets)}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      2. Repayment of Long-Term Borrowings
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      Term Loan Principal Amortization
                    </span>
                  </div>
                  <span className="font-mono text-slate-900">
                    {formatAmount(applications.repaymentOfLongTermBorrowings)}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      3. Payment of Corporate Advance Tax
                    </strong>
                    <span className="text-[11px] text-slate-400">Direct Tax compliance</span>
                  </div>
                  <span className="font-mono text-slate-900">
                    {formatAmount(applications.paymentOfTaxAndAdvanceTax)}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <strong className="text-slate-900 block font-semibold">
                      4. Payment of Dividends / Drawings
                    </strong>
                    <span className="text-[11px] text-slate-400">Nil (Profits retained)</span>
                  </div>
                  <span className="font-mono text-slate-400">—</span>
                </div>

                <div className="p-3.5 flex items-center justify-between bg-indigo-50/40 font-bold text-indigo-900">
                  <div>
                    <strong className="block">
                      5. Increase in Working Capital (Surplus Absorbed)
                    </strong>
                    <span className="text-[11px] text-indigo-600 font-normal">
                      Reconciled with Schedule of Working Capital
                    </span>
                  </div>
                  <span className="font-mono">
                    {formatAmount(applications.increaseInWorkingCapital || 0)}
                  </span>
                </div>

                {/* Total Applications Footer */}
                <div className="p-4 bg-indigo-50/60 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-indigo-300">
                  <span className="text-sm">TOTAL APPLICATIONS OF FUNDS</span>
                  <span className="font-mono text-base text-indigo-950">
                    {formatAmount(applications.totalApplications)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULE OF CHANGES IN WORKING CAPITAL */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide uppercase">
                  Schedule of Changes in Working Capital
                </h3>
                <p className="text-xs text-slate-400">
                  Comparative Analysis of Current Assets (CA) vs Current Liabilities (CL)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded">
                Net Change: +{formatAmount(wcs.netChangeInWorkingCapital)} ({wcs.netChangeType})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-1/3">Balance Sheet Line Item</th>
                    <th className="py-3 px-3 text-center">Category</th>
                    <th className="py-3 px-3 text-right">Previous Period</th>
                    <th className="py-3 px-3 text-right">Current Period</th>
                    <th className="py-3 px-3 text-right">Effect on Working Capital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wcs.items.map((it) => {
                    const isIncrease = it.effect.includes("Increase");
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {it.particulars}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              it.type === "current_asset"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            {it.type === "current_asset" ? "Current Asset" : "Current Liability"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatAmount(it.previousAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                          {formatAmount(it.currentAmount)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isIncrease ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {it.effect}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 font-bold border-t border-slate-200">
                    <td colSpan={4} className="py-3 px-4 text-slate-900">
                      NET WORKING CAPITAL CHANGE (CA - CL)
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                      +{formatAmount(wcs.netChangeInWorkingCapital)} ({wcs.netChangeType})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SHORTAGE MITIGATION & LIQUIDITY PLANNER */}
      {/* ========================================================================= */}
      {viewMode === "shortage-planner" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>Management Shortage Mitigation Levers</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-planned treasury actions to protect safety buffer and prevent overdraft
                  breaches
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedActionForEdit(null);
                  setActionModalDefaultWeek(horizonStats.lowestWeek.week.id);
                  setIsActionModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Plan Mitigation Action</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cashBudget.shortageActions.map((act) => {
                const targetWeek = cashBudget.weeks.find((w) => w.id === act.weekId);
                return (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          act.status === "implemented"
                            ? "bg-emerald-100 text-emerald-800"
                            : act.status === "approved"
                              ? "bg-amber-100 text-amber-800"
                              : act.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>
                        Target: <strong>{targetWeek?.weekLabel || act.weekId}</strong> (
                        {targetWeek?.dateRange})
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        +{formatAmount(act.impactAmount)}
                      </span>
                    </div>

                    {act.notes && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                        "{act.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      {act.status !== "implemented" && (
                        <button
                          onClick={() => onUpdateShortageActionStatus(act.id, "implemented")}
                          className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                        >
                          Mark Implemented
                        </button>
                      )}
                      {act.status === "implemented" && (
                        <button
                          onClick={() => onUpdateShortageActionStatus(act.id, "approved")}
                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                        >
                          Revert to Approved
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedActionForEdit(act);
                          setIsActionModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                        title="Edit Action"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* 1. Weekly Actuals Modal */}
      {selectedWeekForActuals && (
        <WeeklyActualsModal
          isOpen={!!selectedWeekForActuals}
          onClose={() => setSelectedWeekForActuals(null)}
          week={selectedWeekForActuals}
          model={cashBudget}
          onSaveActuals={(weekId, updates, isClosed) => {
            onUpdateWeeklyActuals(weekId, updates, isClosed);
            setSelectedWeekForActuals(null);
            showToast(`Saved actuals for ${selectedWeekForActuals.weekLabel}`);
          }}
        />
      )}

      {/* 2. Management Shortage Mitigation Modal */}
      {isActionModalOpen && (
        <ManagementShortagePlanModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          weeks={cashBudget.weeks}
          existingAction={selectedActionForEdit}
          defaultWeekId={actionModalDefaultWeek}
          onSaveAction={(actionData, actionId) => {
            if (actionId && selectedActionForEdit) {
              onUpdateShortageActionStatus(actionId, actionData.status);
            } else {
              onAddShortageAction(actionData);
            }
            setIsActionModalOpen(false);
            showToast("Saved shortage mitigation lever.");
          }}
        />
      )}

      {/* 3. Liquidity Parameters Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              <span>Liquidity Parameters & Safe Buffer</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust starting liquid treasury, minimum buffer floor, and bank credit facilities.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Starting Cash & Bank Balance (₹)
                </label>
                <input
                  type="number"
                  value={configStartingCash}
                  onChange={(e) => setConfigStartingCash(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Safe Buffer Threshold (₹)
                </label>
                <input
                  type="number"
                  value={configBuffer}
                  onChange={(e) => setConfigBuffer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Alerts trigger when closing cash dips below this line.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sanctioned Bank OD / CC Limit (₹)
                </label>
                <input
                  type="number"
                  value={configOD}
                  onChange={(e) => setConfigOD(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
