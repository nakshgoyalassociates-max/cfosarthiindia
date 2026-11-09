import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { BudgetCategory, BudgetMonthKey, BudgetLineItem } from "../../types";
import {
  BUDGET_MONTHS,
  CATEGORY_DEFINITIONS,
  calculateItemVariance,
  computeMonthGrandSummary,
} from "../../data/mockBudgetData";
import { ExcelUploadBudgetModal } from "./ExcelUploadBudgetModal";
import { VarianceExplanationModal } from "./VarianceExplanationModal";
import {
  exportVarianceReportExcel,
  generateBudgetTemplateExcel,
} from "../../utils/excelBudgetHelper";
import { formatINR, formatVariance, formatPercent } from "../../utils/format";
import {
  Calculator,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  DollarSign,
  RotateCcw,
  Edit3,
  Layers,
  HelpCircle,
  ChevronDown,
  Info,
  Building,
  Check,
  X,
  MessageSquare,
  Eye,
  EyeOff,
} from "lucide-react";

export const BudgetTab: React.FC = () => {
  const {
    budgetItems,
    rawBudgetItems,
    toggleItemVisibility,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    updateLineItemActual,
    updateLineItemBudget,
    bulkUpdateActualsFromExcel,
    resetBudgetData,
    clientProfile,
    role,
    showToast,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<"ALL" | BudgetCategory>("ALL");
  const [varianceFilter, setVarianceFilter] = useState<
    "ALL" | "EXCEEDING_5" | "ADVERSE_ONLY" | "EXPLANATION_NEEDED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showHiddenBudget, setShowHiddenBudget] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  const hiddenBudgetCount = useMemo(
    () => rawBudgetItems.filter((b) => b.isHidden).length,
    [rawBudgetItems],
  );
  const sourceBudgetItems = showHiddenBudget ? rawBudgetItems : budgetItems;
  const [selectedItemForExplanation, setSelectedItemForExplanation] = useState<{
    item: BudgetLineItem;
    monthKey: BudgetMonthKey;
  } | null>(null);

  // Inline editing state for fast manual adjustments
  const [editingCell, setEditingCell] = useState<{
    itemId: string;
    field: "budget" | "actual";
    value: string;
  } | null>(null);

  const activeMonthMeta = useMemo(() => {
    return BUDGET_MONTHS.find((m) => m.key === selectedBudgetMonth) || BUDGET_MONTHS[5]; // Default Sep 26
  }, [selectedBudgetMonth]);

  // Grand summary for selected month
  const monthSummary = useMemo(() => {
    return computeMonthGrandSummary(budgetItems, selectedBudgetMonth);
  }, [budgetItems, selectedBudgetMonth]);

  // Breaches requiring variance explanations
  const unexplainedBreachesCount = useMemo(() => {
    return budgetItems.filter((item) => {
      const vr = calculateItemVariance(item, selectedBudgetMonth);
      const hasNote = Boolean(
        item.monthly[selectedBudgetMonth]?.notes &&
        item.monthly[selectedBudgetMonth]?.notes?.trim() !== "",
      );
      return vr.isExceeding5Percent && !hasNote;
    }).length;
  }, [budgetItems, selectedBudgetMonth]);

  // Filtered line items
  const filteredItems = useMemo(() => {
    return sourceBudgetItems.filter((item) => {
      // 1. Category Filter
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesSub = (item.subCategory || "").toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesSub) return false;
      }

      // 3. Variance Filter (Threshold > 5%)
      const vr = calculateItemVariance(item, selectedBudgetMonth);
      if (varianceFilter === "EXCEEDING_5") {
        if (!vr.isExceeding5Percent) return false;
      } else if (varianceFilter === "ADVERSE_ONLY") {
        if (!vr.isExceeding5Percent || vr.varianceType !== "adverse") return false;
      } else if (varianceFilter === "EXPLANATION_NEEDED") {
        const hasNote = Boolean(
          item.monthly[selectedBudgetMonth]?.notes &&
          item.monthly[selectedBudgetMonth]?.notes?.trim() !== "",
        );
        if (!vr.isExceeding5Percent || hasNote) return false;
      }

      return true;
    });
  }, [sourceBudgetItems, categoryFilter, varianceFilter, searchQuery, selectedBudgetMonth]);

  // Handle inline cell edit submission
  const handleSaveInlineEdit = () => {
    if (!editingCell) return;
    const num = parseFloat(editingCell.value.replace(/[^0-9.-]+/g, ""));
    if (!isNaN(num)) {
      if (editingCell.field === "actual") {
        updateLineItemActual(editingCell.itemId, selectedBudgetMonth, num);
      } else {
        updateLineItemBudget(editingCell.itemId, selectedBudgetMonth, num);
      }
    }
    setEditingCell(null);
  };

  const categoriesOrder: BudgetCategory[] = [
    "sales",
    "direct_cost",
    "fixed_factory",
    "salary_wages",
    "admin_cost",
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 tracking-wide uppercase">
                Financial Planning & Analysis (FP&A)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Automatic &gt; 5% Variance Alerts
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Comprehensive Budget & Monthly Variance Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Track month-wise budgetary allocation across{" "}
              <strong className="text-slate-700">
                Sales, Direct Cost, Fixed Factory Expenses, Salary & Wages, and Admin Cost
              </strong>
              . Upload monthly actuals from Excel to immediately compute deviations and highlight
              accounts breaching the 5% threshold.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Download Template */}
            <button
              onClick={() =>
                generateBudgetTemplateExcel(
                  budgetItems,
                  selectedBudgetMonth,
                  activeMonthMeta.label,
                  clientProfile.companyName,
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="Download pre-formatted Excel template for entering monthly actual figures"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Excel Template</span>
            </button>

            {/* Export Variance Report */}
            <button
              onClick={() =>
                exportVarianceReportExcel(
                  budgetItems,
                  selectedBudgetMonth,
                  activeMonthMeta.label,
                  clientProfile.companyName,
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
              title="Export complete monthly variance report with breaches to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Variance (.xlsx)</span>
            </button>

            {/* Upload Excel Button */}
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Monthly Actuals</span>
            </button>
          </div>
        </div>

        {/* 2. Month Selector Navigation Strip */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              FY 26-27:
            </span>
            {BUDGET_MONTHS.map((m) => {
              const isSelected = selectedBudgetMonth === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedBudgetMonth(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  <span>{m.shortLabel}</span>
                  {m.isActualsUploaded ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-emerald-500"}`}
                      title="Actuals Realized & Uploaded"
                    />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-400" : "bg-slate-300"}`}
                      title="Actuals Pending"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Cards for Selected Month */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 border border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Budget Performance Snapshot • {activeMonthMeta.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Actual vs Budget
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Tolerance Benchmark ±5%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Sales Card */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">1. Sales (Revenue)</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  monthSummary.sales.variancePercent >= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {monthSummary.sales.variancePercent >= 0 ? "+" : ""}
                {monthSummary.sales.variancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{(monthSummary.sales.actual / 100000).toFixed(2)}L
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.sales.variancePercent >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                style={{
                  width: `${Math.min(100, Math.round((monthSummary.sales.actual / Math.max(1, monthSummary.sales.budget)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Bud: ₹{(monthSummary.sales.budget / 100000).toFixed(1)}L</span>
              <span
                className={
                  monthSummary.sales.varianceAmount >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {monthSummary.sales.varianceAmount >= 0 ? "+" : ""}₹
                {(monthSummary.sales.varianceAmount / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Direct Cost Card */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">
                2. Direct Cost (COGS)
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  monthSummary.directCost.varianceAmount <= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {monthSummary.directCost.variancePercent >= 0 ? "+" : ""}
                {monthSummary.directCost.variancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{(monthSummary.directCost.actual / 100000).toFixed(2)}L
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.directCost.varianceAmount <= 0 ? "bg-emerald-400" : "bg-amber-400"}`}
                style={{
                  width: `${Math.min(100, Math.round((monthSummary.directCost.actual / Math.max(1, monthSummary.directCost.budget)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Bud: ₹{(monthSummary.directCost.budget / 100000).toFixed(1)}L</span>
              <span
                className={
                  monthSummary.directCost.varianceAmount <= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {monthSummary.directCost.varianceAmount > 0 ? "+" : ""}₹
                {(monthSummary.directCost.varianceAmount / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Fixed Factory Expenses Card */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">3. Factory Overhead</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  monthSummary.fixedFactory.varianceAmount <= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {monthSummary.fixedFactory.variancePercent >= 0 ? "+" : ""}
                {monthSummary.fixedFactory.variancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{(monthSummary.fixedFactory.actual / 100000).toFixed(2)}L
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.fixedFactory.varianceAmount <= 0 ? "bg-emerald-400" : "bg-amber-400"}`}
                style={{
                  width: `${Math.min(100, Math.round((monthSummary.fixedFactory.actual / Math.max(1, monthSummary.fixedFactory.budget)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Bud: ₹{(monthSummary.fixedFactory.budget / 100000).toFixed(1)}L</span>
              <span
                className={
                  monthSummary.fixedFactory.varianceAmount <= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }
              >
                {monthSummary.fixedFactory.varianceAmount > 0 ? "+" : ""}₹
                {(monthSummary.fixedFactory.varianceAmount / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Salary & Wages Card */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">4. Salary & Wages</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  monthSummary.salaryWages.varianceAmount <= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {monthSummary.salaryWages.variancePercent >= 0 ? "+" : ""}
                {monthSummary.salaryWages.variancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{(monthSummary.salaryWages.actual / 100000).toFixed(2)}L
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.salaryWages.varianceAmount <= 0 ? "bg-emerald-400" : "bg-purple-400"}`}
                style={{
                  width: `${Math.min(100, Math.round((monthSummary.salaryWages.actual / Math.max(1, monthSummary.salaryWages.budget)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Bud: ₹{(monthSummary.salaryWages.budget / 100000).toFixed(1)}L</span>
              <span
                className={
                  monthSummary.salaryWages.varianceAmount <= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }
              >
                {monthSummary.salaryWages.varianceAmount > 0 ? "+" : ""}₹
                {(monthSummary.salaryWages.varianceAmount / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Admin Cost Card */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">5. Admin & Overheads</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  monthSummary.adminCost.varianceAmount <= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {monthSummary.adminCost.variancePercent >= 0 ? "+" : ""}
                {monthSummary.adminCost.variancePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{(monthSummary.adminCost.actual / 100000).toFixed(2)}L
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.adminCost.varianceAmount <= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                style={{
                  width: `${Math.min(100, Math.round((monthSummary.adminCost.actual / Math.max(1, monthSummary.adminCost.budget)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Bud: ₹{(monthSummary.adminCost.budget / 100000).toFixed(1)}L</span>
              <span
                className={
                  monthSummary.adminCost.varianceAmount <= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {monthSummary.adminCost.varianceAmount > 0 ? "+" : ""}₹
                {(monthSummary.adminCost.varianceAmount / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Highlight Alert: > 5% Breaches Card */}
          <div
            className={`rounded-lg p-2.5 sm:p-3 border space-y-1.5 ${
              monthSummary.totalItemsBreaching5Percent > 0
                ? "bg-slate-800/90 border-amber-500/50 text-amber-200"
                : "bg-slate-800/80 border-slate-700/60 text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${monthSummary.totalItemsBreaching5Percent > 0 ? "text-amber-400" : "text-emerald-400"}`}
                />
                &gt; 5% Breaches
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                ±5% Limit
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              {monthSummary.totalItemsBreaching5Percent} Lines
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${monthSummary.totalItemsBreaching5Percent > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{
                  width: `${Math.min(100, Math.max(10, monthSummary.totalItemsBreaching5Percent * 15))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{monthSummary.totalAdverseBreaches} Adverse Overruns</span>
              <button
                onClick={() =>
                  setVarianceFilter(varianceFilter === "EXCEEDING_5" ? "ALL" : "EXCEEDING_5")
                }
                className="text-[10px] font-bold text-amber-300 underline hover:text-amber-200 cursor-pointer"
              >
                {varianceFilter === "EXCEEDING_5" ? "Show All" : "Filter"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search code, line item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                categoryFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              All Categories ({budgetItems.length})
            </button>

            {categoriesOrder.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {CATEGORY_DEFINITIONS[cat].shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Variance Breach Toggle Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Variance Filter:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setVarianceFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                varianceFilter === "ALL"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({budgetItems.length})
            </button>
            <button
              onClick={() => setVarianceFilter("EXCEEDING_5")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer flex items-center gap-1 ${
                varianceFilter === "EXCEEDING_5"
                  ? "bg-amber-500 text-white font-bold shadow-2xs"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>&gt; 5% Breaches ({monthSummary.totalItemsBreaching5Percent})</span>
            </button>
            <button
              onClick={() => setVarianceFilter("ADVERSE_ONLY")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer flex items-center gap-1 ${
                varianceFilter === "ADVERSE_ONLY"
                  ? "bg-rose-600 text-white font-bold shadow-2xs"
                  : "text-rose-700 hover:text-rose-900"
              }`}
            >
              <span>Adverse Only ({monthSummary.totalAdverseBreaches})</span>
            </button>
            <button
              onClick={() => setVarianceFilter("EXPLANATION_NEEDED")}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer flex items-center gap-1 ${
                varianceFilter === "EXPLANATION_NEEDED"
                  ? "bg-indigo-600 text-white font-bold shadow-2xs"
                  : "text-indigo-700 hover:text-indigo-900"
              }`}
              title="Filter items with >5% variance that still require operational explanations"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Explanation Needed ({unexplainedBreachesCount})</span>
            </button>
          </div>

          {role === "cfo" && (
            <button
              type="button"
              onClick={() => setShowHiddenBudget(!showHiddenBudget)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                showHiddenBudget
                  ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Toggle hidden budget line items"
            >
              {showHiddenBudget ? (
                <Eye className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {showHiddenBudget
                  ? `Showing Hidden (${hiddenBudgetCount})`
                  : `Hidden (${hiddenBudgetCount})`}
              </span>
            </button>
          )}

          <button
            onClick={resetBudgetData}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Reset to default baseline financial model"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: 12-Month Annual Financial Budget & Actuals Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <span>12-Month Annual Financial Budget & Actuals Matrix</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-white/10 text-white">
                FY 2026-27 (All Months)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Horizontal month-by-month trajectory showing Budget (B) vs Actual (A) vs Variance %
              (V%) across all 5 financial categories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              Cells with &gt; 5% variance highlighted in amber/rose
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-20 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  Code
                </th>
                <th className="py-2.5 px-3 min-w-[200px] sticky left-20 bg-slate-50 z-10 border-r border-slate-200">
                  Line Item
                </th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">Category</th>
                {BUDGET_MONTHS.map((m) => (
                  <th
                    key={m.key}
                    className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[120px]"
                  >
                    <div>{m.shortLabel}</div>
                    <div className="text-[10px] font-normal text-slate-400 flex items-center justify-around mt-0.5">
                      <span>Bgt</span>
                      <span>Act</span>
                      <span>Var%</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 ${
                      item.isHidden ? "bg-amber-50/40 opacity-75" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>{item.code}</span>
                        {role === "cfo" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemVisibility("budget_item", item.id);
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              item.isHidden
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                            title={
                              item.isHidden
                                ? "Unhide budget line item"
                                : "Hide budget line item (keep data without deleting)"
                            }
                          >
                            {item.isHidden ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[220px] sticky left-20 bg-white z-10 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.name}</span>
                        {item.isHidden && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${CATEGORY_DEFINITIONS[item.category].badgeColor}`}
                      >
                        {CATEGORY_DEFINITIONS[item.category].shortName}
                      </span>
                    </td>

                    {/* 12 Month columns */}
                    {BUDGET_MONTHS.map((m) => {
                      const mData = item.monthly[m.key] || { budget: 0, actual: 0 };
                      const bgt = mData.budget;
                      const act = mData.actual;
                      const varPct = bgt > 0 && act > 0 ? ((act - bgt) / bgt) * 100 : 0;
                      const isBreach = act > 0 && Math.abs(varPct) > 5;

                      const hasNote = Boolean(mData.notes && mData.notes.trim() !== "");

                      return (
                        <td
                          key={m.key}
                          onClick={() => {
                            setSelectedItemForExplanation({ item, monthKey: m.key });
                          }}
                          title={`Click to view/edit variance explanation for ${m.shortLabel}${mData.notes ? `: "${mData.notes}"` : ""}`}
                          className={`py-2 px-2 text-right font-mono text-[11px] border-r border-slate-200 cursor-pointer hover:ring-1 hover:ring-indigo-400 transition-all ${
                            isBreach
                              ? item.category === "sales"
                                ? varPct > 0
                                  ? "bg-emerald-50/70 text-emerald-900 font-bold"
                                  : "bg-rose-50/70 text-rose-900 font-bold"
                                : varPct > 0
                                  ? "bg-rose-50/70 text-rose-900 font-bold"
                                  : "bg-emerald-50/70 text-emerald-900 font-bold"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500">{(bgt / 1000).toFixed(0)}k</span>
                            <span className="font-semibold text-slate-800">
                              {act > 0 ? `${(act / 1000).toFixed(0)}k` : "-"}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span
                                className={`font-bold ${
                                  isBreach
                                    ? item.category === "sales"
                                      ? varPct > 0
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                      : varPct > 0
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {act > 0 ? `${varPct > 0 ? "+" : ""}${varPct.toFixed(0)}%` : "-"}
                              </span>
                              {hasNote && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"
                                  title="Explanation logged"
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Excel Upload Modal */}
      <ExcelUploadBudgetModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        targetMonthKey={selectedBudgetMonth}
        onMonthChange={(m) => setSelectedBudgetMonth(m)}
        budgetItems={budgetItems}
        companyName={clientProfile.companyName}
        onApplyActuals={(monthKey, rows) => {
          bulkUpdateActualsFromExcel(monthKey, rows);
        }}
      />

      {/* 9. Variance Explanation & Operational Reason Modal */}
      <VarianceExplanationModal
        isOpen={Boolean(selectedItemForExplanation)}
        onClose={() => setSelectedItemForExplanation(null)}
        item={selectedItemForExplanation?.item || null}
        monthKey={selectedItemForExplanation?.monthKey || selectedBudgetMonth}
        monthLabel={activeMonthMeta.label}
        role={role}
        onSave={(notes) => {
          if (!selectedItemForExplanation) return;
          const { item, monthKey } = selectedItemForExplanation;
          const curActual = item.monthly[monthKey]?.actual || 0;
          updateLineItemActual(item.id, monthKey, curActual, notes);
          showToast(`Variance explanation updated for ${item.code}`);
        }}
      />
    </div>
  );
};
