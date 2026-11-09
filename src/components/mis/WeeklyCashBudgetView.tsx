import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { INITIAL_THREE_MONTH_CASH_BUDGET } from "../../data/mockThreeMonthCashBudget";
import {
  ThreeMonthCashBudgetModel,
  CashFlowWeekMeta,
  WeeklyCashFlowLineItem,
  ManagementShortageAction,
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
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  Edit3,
  Sliders,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

export interface WeeklyCashBudgetViewProps {
  cashBudget?: ThreeMonthCashBudgetModel;
  clientProfile?: ClientProfile;
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

export const WeeklyCashBudgetView: React.FC<WeeklyCashBudgetViewProps> = ({
  cashBudget: propCashBudget,
  clientProfile: propClientProfile,
  onUpdateWeeklyActuals: propOnUpdateWeeklyActuals,
  onAddShortageAction: propOnAddShortageAction,
  onUpdateShortageActionStatus: propOnUpdateShortageActionStatus,
  onDeleteShortageAction: propOnDeleteShortageAction,
  onUpdateConfig: propOnUpdateConfig,
  showToast: propShowToast,
}) => {
  const app = useApp();
  const cashBudget = propCashBudget || app.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
  const clientProfile = propClientProfile || app.clientProfile;
  const onUpdateWeeklyActuals = propOnUpdateWeeklyActuals || app.updateWeeklyCashActuals;
  const onAddShortageAction = propOnAddShortageAction || app.addShortageAction;
  const onUpdateShortageActionStatus =
    propOnUpdateShortageActionStatus || app.updateShortageActionStatus;
  const onDeleteShortageAction = propOnDeleteShortageAction || app.deleteShortageAction;
  const onUpdateConfig = propOnUpdateConfig || app.updateCashBudgetConfig;
  const showToast = propShowToast || app.showToast;

  const [showInLakhs, setShowInLakhs] = useState(true);
  const [activeMonthFilter, setActiveMonthFilter] = useState<"all" | "0" | "1" | "2">("all");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "inflow" | "outflow">(
    "all",
  );
  const [activeViewTab, setActiveViewTab] = useState<"matrix" | "planner" | "runway">("matrix");

  // Modal states
  const [selectedWeekForActuals, setSelectedWeekForActuals] = useState<CashFlowWeekMeta | null>(
    null,
  );
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedActionForEdit, setSelectedActionForEdit] =
    useState<ManagementShortageAction | null>(null);
  const [actionModalDefaultWeek, setActionModalDefaultWeek] = useState<string>("w3");

  // Config settings modal
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

  // Filtered weeks to display
  const displayedWeeks = useMemo(() => {
    if (activeMonthFilter === "all") return cashBudget.weeks;
    const mIdx = parseInt(activeMonthFilter, 10);
    return cashBudget.weeks.filter((w) => w.monthIndex === mIdx);
  }, [cashBudget.weeks, activeMonthFilter]);

  // Filtered items to display
  const displayedItems = useMemo(() => {
    if (activeCategoryFilter === "all") return cashBudget.items;
    return cashBudget.items.filter((it) => it.category === activeCategoryFilter);
  }, [cashBudget.items, activeCategoryFilter]);

  // Handle Excel download
  const handleDownloadExcel = () => {
    try {
      const fileName = generate13WeekCashFlowExcel(
        cashBudget,
        clientProfile?.companyName || "Company",
      );
      showToast(`Downloaded 12-Week Cash Flow Budget: ${fileName}`);
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

      // Group updates by weekId
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
      showToast("Failed to parse Excel file. Please use standard 12-week template.");
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

  // Identify lowest cash point and critical deficit weeks
  const criticalDeficitWeeks = summary.weeklySummaries.filter((w) => w.isDeficit);
  const bufferBreachWeeks = summary.weeklySummaries.filter(
    (w) => w.isBufferBreached && !w.isDeficit,
  );
  const lowestWeek = summary.lowestCashWeek;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Navigation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>3-Month Weekly Cash Flow Budget & Shortage Planner</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    12 Weeks Active Horizon
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {clientProfile?.companyName || "Nexora BioTech Solutions"} • Months:{" "}
                  {cashBudget.months.join(" • ")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                Exact (₹)
              </button>
            </div>

            {/* Threshold Config */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Configure starting liquid cash, minimum safe buffer and bank OD limit"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Treasury Buffer</span>
            </button>

            {/* Excel Download */}
            <button
              onClick={handleDownloadExcel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download 12-week cash budget spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Download Excel</span>
            </button>

            {/* Excel Upload */}
            <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Actuals</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Shortage Action Button */}
            <button
              onClick={() => {
                setSelectedActionForEdit(null);
                setActionModalDefaultWeek(lowestWeek.week.id);
                setIsActionModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plan Shortage Action</span>
            </button>
          </div>
        </div>

        {/* 2. Shortage / Liquidity Alert Banner */}
        {criticalDeficitWeeks.length > 0 ? (
          <div className="mt-5 p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <span>
                    Critical Cash Deficit Alert: {criticalDeficitWeeks.length} Week(s) Projected
                    Negative
                  </span>
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Deepest deficit occurs in <strong>{lowestWeek.week.weekLabel}</strong> (
                  {lowestWeek.week.dateRange}) with projected cash balance of{" "}
                  <strong className="font-mono font-bold">
                    {formatAmount(lowestWeek.closingActualCash)}
                  </strong>
                  . Mandatory statutory & supplier payouts exceed receipts.
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
                        cashBudget.sanctionedODLimit - Math.max(0, -lowestWeek.closingActualCash),
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveViewTab("planner")}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-900 hover:bg-rose-950 text-white shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>View Mitigation Levers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : bufferBreachWeeks.length > 0 ? (
          <div className="mt-5 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Buffer Reserve Alert: {bufferBreachWeeks.length} Week(s) Fall Below Safety Buffer
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Cash dips below your minimum threshold of{" "}
                  <strong>{formatAmount(cashBudget.minimumSafeBuffer)}</strong> in{" "}
                  <strong>{lowestWeek.week.weekLabel}</strong> (projected{" "}
                  <span className="font-mono font-bold">
                    {formatAmount(lowestWeek.closingActualCash)}
                  </span>
                  ). Accelerating customer collections is advised.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveViewTab("planner")}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>Plan Mitigation Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-900">
                <strong>Healthy Liquidity Runway:</strong> All 12 weeks maintain closing cash
                balances above your safety buffer of {formatAmount(cashBudget.minimumSafeBuffer)}.
                Lowest projected point: {lowestWeek.week.weekLabel} (
                {formatAmount(lowestWeek.closingActualCash)}).
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              0 Deficit Weeks
            </span>
          </div>
        )}

        {/* 3. Four Treasury KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">Opening Liquid Treasury</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-slate-900 font-mono">
                {formatAmount(cashBudget.startingCashBalance)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Week 1 Starting Cash & Bank balance
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              lowestWeek.isDeficit
                ? "bg-rose-50/50 border-rose-200"
                : lowestWeek.isBufferBreached
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-emerald-50/50 border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 block">Lowest Cash Valley Point</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  lowestWeek.isDeficit
                    ? "bg-rose-600 text-white"
                    : lowestWeek.isBufferBreached
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                }`}
              >
                {lowestWeek.week.weekLabel}
              </span>
            </div>
            <div className="mt-1">
              <span
                className={`text-lg font-bold font-mono ${
                  lowestWeek.isDeficit
                    ? "text-rose-700"
                    : lowestWeek.isBufferBreached
                      ? "text-amber-800"
                      : "text-emerald-800"
                }`}
              >
                {formatAmount(lowestWeek.closingActualCash)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{lowestWeek.week.dateRange}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">3-Month Inflows vs Outflows</span>
            <div className="mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  +{formatAmount(summary.total3MActualInflow)}
                </span>
                <span className="text-xs text-slate-400">vs</span>
                <span className="text-sm font-bold text-rose-700 font-mono">
                  -{formatAmount(summary.total3MActualOutflow)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Net 3M Flow:{" "}
                <strong className="font-mono">
                  {summary.total3MActualNet >= 0 ? "+" : ""}
                  {formatAmount(summary.total3MActualNet)}
                </strong>
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200">
            <span className="text-indigo-800 block font-medium">Bank OD / CC Sanctioned Limit</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-indigo-900 font-mono">
                {formatAmount(cashBudget.sanctionedODLimit)}
              </span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Emergency credit facility on standby
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewTab("matrix")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewTab === "matrix"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>12-Week Cash Matrix</span>
          </button>

          <button
            onClick={() => setActiveViewTab("planner")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewTab === "planner"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-slate-700 hover:text-amber-800 hover:bg-amber-50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Shortage Mitigation Planner</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeViewTab === "planner"
                  ? "bg-amber-500/30 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {cashBudget.shortageActions.length} Actions
            </span>
          </button>
        </div>

        {/* Matrix View Filter Controls */}
        {activeViewTab === "matrix" && (
          <div className="flex items-center flex-wrap gap-2">
            {/* Month Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setActiveMonthFilter("all")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeMonthFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All 12 Weeks
              </button>
              <button
                onClick={() => setActiveMonthFilter("0")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeMonthFilter === "0"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cashBudget.months[0]} (W1-W4)
              </button>
              <button
                onClick={() => setActiveMonthFilter("1")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeMonthFilter === "1"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cashBudget.months[1]} (W5-W8)
              </button>
              <button
                onClick={() => setActiveMonthFilter("2")}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeMonthFilter === "2"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cashBudget.months[2]} (W9-W12)
              </button>
            </div>

            {/* Category Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setActiveCategoryFilter("all")}
                className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                  activeCategoryFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500"
                }`}
              >
                All Rows
              </button>
              <button
                onClick={() => setActiveCategoryFilter("inflow")}
                className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                  activeCategoryFilter === "inflow"
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-500"
                }`}
              >
                Inflows
              </button>
              <button
                onClick={() => setActiveCategoryFilter("outflow")}
                className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                  activeCategoryFilter === "outflow"
                    ? "bg-white text-rose-800 shadow-2xs font-semibold"
                    : "text-slate-500"
                }`}
              >
                Outflows
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. VIEW TAB 1: 12-WEEK CASH MATRIX (Account Manager & Management Core Grid) */}
      {activeViewTab === "matrix" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Scroll Area */}
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-xs text-left border-collapse">
                {/* Column Headers */}
                <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-xs">
                  <tr>
                    <th className="py-3 px-4 w-72 sticky left-0 z-30 bg-slate-900 border-r border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      Cash Flow Heads & Particulars
                    </th>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const isDeficit = weekSummary?.isDeficit;
                      const isBreach = weekSummary?.isBufferBreached;

                      return (
                        <th
                          key={week.id}
                          className={`py-2.5 px-3 min-w-44 text-right border-r border-slate-800 font-medium ${
                            isDeficit
                              ? "bg-rose-950/80 text-rose-100"
                              : isBreach
                                ? "bg-amber-950/60 text-amber-100"
                                : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-white text-xs">{week.weekLabel}</span>
                            <div className="flex items-center gap-1">
                              {week.isActualsClosed ? (
                                <span
                                  className="p-0.5 bg-emerald-500/30 text-emerald-300 rounded"
                                  title="Actuals Closed by Account Manager"
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              ) : (
                                <span
                                  className="p-0.5 bg-slate-700 text-slate-400 rounded"
                                  title="Week in progress / forecast"
                                >
                                  <Unlock className="w-3 h-3" />
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedWeekForActuals(week)}
                                className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Update weekly actuals for this week"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {week.dateRange}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 mt-1 border-t border-slate-800 font-mono">
                            <span>Bud</span>
                            <span>Act</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* --- SECTION 1: CASH INFLOWS --- */}
                  <tr className="bg-emerald-50/50 font-bold text-emerald-950">
                    <td
                      colSpan={displayedWeeks.length + 1}
                      className="py-2 px-4 uppercase text-[11px] tracking-wider sticky left-0 bg-emerald-50/90 z-10 border-b border-emerald-100"
                    >
                      1. Cash Inflows & Collections
                    </td>
                  </tr>

                  {displayedItems
                    .filter((it) => it.category === "inflow")
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                          <span className="font-semibold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.section.replace(/_/g, " ")}
                          </span>
                        </td>
                        {displayedWeeks.map((week) => {
                          const data = item.weekly[week.id];
                          const bgt = data?.budget || 0;
                          const act = data?.actual;
                          const hasAct = typeof act === "number";

                          return (
                            <td
                              key={week.id}
                              className="py-2.5 px-3 text-right border-r border-slate-100 font-mono"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-400 text-[11px]">
                                  {formatAmount(bgt)}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    hasAct
                                      ? act >= bgt
                                        ? "text-emerald-800"
                                        : "text-amber-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {hasAct ? formatAmount(act) : "—"}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  {/* TOTAL INFLOWS ROW */}
                  <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-200">
                    <td className="py-2.5 px-4 sticky left-0 bg-emerald-50 z-10 border-r border-emerald-200">
                      TOTAL CASH INFLOWS (A)
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const bIn = weekSummary?.budgetInflows || 0;
                      const aIn = weekSummary?.actualInflows || 0;

                      return (
                        <td
                          key={week.id}
                          className="py-2.5 px-3 text-right border-r border-emerald-200 font-mono"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-emerald-700 text-[11px]">
                              {formatAmount(bIn)}
                            </span>
                            <span className="text-emerald-900 font-bold">{formatAmount(aIn)}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* --- SECTION 2: CASH OUTFLOWS --- */}
                  <tr className="bg-rose-50/50 font-bold text-rose-950">
                    <td
                      colSpan={displayedWeeks.length + 1}
                      className="py-2 px-4 uppercase text-[11px] tracking-wider sticky left-0 bg-rose-50/90 z-10 border-b border-rose-100"
                    >
                      2. Cash Outflows & Disbursements
                    </td>
                  </tr>

                  {displayedItems
                    .filter((it) => it.category === "outflow")
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                          <span className="font-semibold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.section.replace(/_/g, " ")}
                          </span>
                        </td>
                        {displayedWeeks.map((week) => {
                          const data = item.weekly[week.id];
                          const bgt = data?.budget || 0;
                          const act = data?.actual;
                          const hasAct = typeof act === "number";

                          return (
                            <td
                              key={week.id}
                              className="py-2.5 px-3 text-right border-r border-slate-100 font-mono"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-400 text-[11px]">
                                  {formatAmount(bgt)}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    hasAct
                                      ? act > bgt
                                        ? "text-rose-700"
                                        : "text-slate-800"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {hasAct ? formatAmount(act) : "—"}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  {/* TOTAL OUTFLOWS ROW */}
                  <tr className="bg-rose-50 font-bold text-rose-950 border-t-2 border-rose-200">
                    <td className="py-2.5 px-4 sticky left-0 bg-rose-50 z-10 border-r border-rose-200">
                      TOTAL CASH OUTFLOWS (B)
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const bOut = weekSummary?.budgetOutflows || 0;
                      const aOut = weekSummary?.actualOutflows || 0;

                      return (
                        <td
                          key={week.id}
                          className="py-2.5 px-3 text-right border-r border-rose-200 font-mono"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-rose-700 text-[11px]">{formatAmount(bOut)}</span>
                            <span className="text-rose-950 font-bold">{formatAmount(aOut)}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* --- SECTION 3: NET MOVEMENT & TREASURY BALANCES --- */}
                  {/* Net Weekly Movement */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                    <td className="py-2.5 px-4 sticky left-0 bg-slate-100 z-10 border-r border-slate-300">
                      NET WEEKLY MOVEMENT (A - B)
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const aNet = weekSummary?.actualNetMovement || 0;

                      return (
                        <td
                          key={week.id}
                          className="py-2.5 px-3 text-right border-r border-slate-300 font-mono"
                        >
                          <span
                            className={`font-bold ${
                              aNet >= 0 ? "text-emerald-800" : "text-rose-700"
                            }`}
                          >
                            {aNet >= 0 ? "+" : ""}
                            {formatAmount(aNet)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Opening Cash Balance (Rolling) */}
                  <tr className="bg-slate-50 text-slate-700">
                    <td className="py-2.5 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 font-semibold">
                      Opening Cash & Bank Balance
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      return (
                        <td
                          key={week.id}
                          className="py-2.5 px-3 text-right border-r border-slate-200 font-mono text-slate-600 font-medium"
                        >
                          {formatAmount(weekSummary?.openingActualCash || 0)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Closing Cash Balance (Rolling) */}
                  <tr className="bg-white font-extrabold text-slate-900 border-t border-b-2 border-slate-300">
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-300">
                      <div>
                        <span className="text-sm block">CLOSING CASH & BANK BALANCE</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Safety Buffer: {formatAmount(cashBudget.minimumSafeBuffer)}
                        </span>
                      </div>
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const closeCash = weekSummary?.closingActualCash || 0;
                      const isDeficit = weekSummary?.isDeficit;
                      const isBreach = weekSummary?.isBufferBreached;

                      return (
                        <td
                          key={week.id}
                          className={`py-3 px-3 text-right border-r border-slate-300 font-mono ${
                            isDeficit
                              ? "bg-rose-50 text-rose-800"
                              : isBreach
                                ? "bg-amber-50 text-amber-800"
                                : "text-slate-900"
                          }`}
                        >
                          <span className="text-sm font-bold block">{formatAmount(closeCash)}</span>
                          <div className="mt-1">
                            {isDeficit ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-bold inline-flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" /> Deficit
                              </span>
                            ) : isBreach ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-semibold inline-flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Below Buffer
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Safe
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Projected Cash with Approved Mitigations */}
                  <tr className="bg-indigo-50/40 text-indigo-950 font-bold">
                    <td className="py-2.5 px-4 sticky left-0 bg-indigo-50/90 z-10 border-r border-indigo-200">
                      <div>
                        <span className="block text-indigo-900">
                          Projected Balance with Management Actions
                        </span>
                        <span className="text-[10px] text-indigo-600 font-normal">
                          Includes planned OD draws, collections, deferrals
                        </span>
                      </div>
                    </td>
                    {displayedWeeks.map((week) => {
                      const weekSummary = summary.weeklySummaries.find(
                        (s) => s.week.id === week.id,
                      );
                      const withActions = weekSummary?.closingCashWithActions || 0;
                      const hasActions = (weekSummary?.actionsCashRelief || 0) > 0;

                      return (
                        <td
                          key={week.id}
                          className="py-2.5 px-3 text-right border-r border-indigo-200 font-mono text-indigo-950"
                        >
                          <span className="font-bold">{formatAmount(withActions)}</span>
                          {hasActions && (
                            <span className="block text-[10px] text-emerald-700 font-normal">
                              +{formatAmount(weekSummary?.actionsCashRelief || 0)} relief
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Guidance Footer */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Account Manager Workflow:</strong> Click the edit icon on any week header to
                record actual bank collections and disbursements. Real-time variances automatically
                roll forward into future weeks.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Safe
                Reserve
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Low Buffer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Shortage
                Deficit
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW TAB 2: SHORTAGE MITIGATION PLANNER */}
      {activeViewTab === "planner" && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Management Shortage Action Center</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {cashBudget.shortageActions.length} Planned Levers
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Strategic liquidity interventions designed to bridge cash deficits during heavy
                statutory (GST/TDS) and vendor payout weeks.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedActionForEdit(null);
                setActionModalDefaultWeek(lowestWeek.week.id);
                setIsActionModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Mitigation Action</span>
            </button>
          </div>

          {/* Action Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashBudget.shortageActions.map((act) => {
              const targetWeek = cashBudget.weeks.find((w) => w.id === act.weekId);

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {targetWeek
                          ? `${targetWeek.weekLabel} (${targetWeek.dateRange})`
                          : act.weekId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          act.status === "executed"
                            ? "bg-indigo-100 text-indigo-800"
                            : act.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{act.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{act.notes}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Cash Relief
                      </span>
                      <span className="text-base font-bold text-emerald-800 font-mono">
                        +{formatAmount(act.impactAmount)}
                      </span>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1">
                      {act.status !== "approved" && (
                        <button
                          onClick={() => onUpdateShortageActionStatus(act.id, "approved")}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer border border-emerald-200"
                        >
                          Approve
                        </button>
                      )}
                      {act.status !== "executed" && (
                        <button
                          onClick={() => onUpdateShortageActionStatus(act.id, "executed")}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 cursor-pointer border border-indigo-200"
                        >
                          Execute
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteShortageAction(act.id)}
                        className="px-2 py-1 text-[11px] font-semibold rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Delete action"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standard CFO Recommended Playbooks */}
          <div className="bg-slate-900 text-white rounded-2xl p-6">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Virtual CFO Shortage Mitigation Playbook</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Recommended procedures for managing cash flow crunches before they impact vendor
              relationships or statutory status:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <strong className="text-amber-400 block font-semibold">
                  1. Debtor Acceleration
                </strong>
                <p className="text-slate-300 text-[11px] mt-1">
                  Offer 1.5% quick-settlement cash discounts to top 5 corporate clients for payments
                  received within 48 hours.
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <strong className="text-sky-400 block font-semibold">2. Capex Rescheduling</strong>
                <p className="text-slate-300 text-[11px] mt-1">
                  Shift equipment and server acquisitions to months where seasonal collection inflow
                  peaks (e.g. Month 2 or Month 3).
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <strong className="text-emerald-400 block font-semibold">
                  3. Overdraft Facility Tranche
                </strong>
                <p className="text-slate-300 text-[11px] mt-1">
                  Draw down on approved Bank CC/OD line only for 3–5 days to cover the GST 20th
                  statutory hurdle, then repay once receipts land.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Weekly Actuals Updating for Account Manager */}
      {selectedWeekForActuals && (
        <WeeklyActualsModal
          isOpen={Boolean(selectedWeekForActuals)}
          onClose={() => setSelectedWeekForActuals(null)}
          week={selectedWeekForActuals}
          model={cashBudget}
          onSaveActuals={(weekId, updates, isClosed) => {
            onUpdateWeeklyActuals(weekId, updates, isClosed);
            showToast(`Saved actuals for ${selectedWeekForActuals.weekLabel}`);
          }}
        />
      )}

      {/* 8. Modal: Shortage Action Planning */}
      {isActionModalOpen && (
        <ManagementShortagePlanModal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setSelectedActionForEdit(null);
          }}
          weeks={cashBudget.weeks}
          existingAction={selectedActionForEdit}
          defaultWeekId={actionModalDefaultWeek}
          onSaveAction={(act, actionId) => {
            if (actionId) {
              // Edit
              showToast("Updated mitigation action");
            } else {
              onAddShortageAction(act);
              showToast("Added new shortage mitigation action");
            }
          }}
        />
      )}

      {/* 9. Modal: Treasury Parameters Configuration */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Configure Treasury Parameters</span>
              </h3>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Starting Cash & Bank Balance (Week 1 Opening)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={configStartingCash}
                    onChange={(e) => setConfigStartingCash(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Safe Operating Buffer Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={configBuffer}
                    onChange={(e) => setConfigBuffer(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Weeks closing below this amount trigger a safety warning.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sanctioned Bank OD / CC Credit Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={configOD}
                    onChange={(e) => setConfigOD(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
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
