import React, { useState, useMemo, useEffect } from "react";
import {
  PnlStatementData,
  ClientProfile,
  PnlLineItem,
  ExpenseProvisionItem,
  TallyLedgerRecord,
  TallyLedgerMappingRule,
} from "../../types";
import { formatINR } from "../../utils/format";
import { useApp } from "../../context/AppContext";
import {
  INITIAL_EXPENSE_PROVISIONS,
  calculateAdjustedPnlStatement,
  PROVISION_CATEGORY_CONFIG,
  ensureDefaultExpenseHeadProvisions,
  downloadProvisionsExcelTemplate,
} from "../../utils/pnlProvisionsHelper";
import { PnlProvisionsModal } from "./PnlProvisionsModal";
import { LedgerLevelMisExplorer } from "./LedgerLevelMisExplorer";
import {
  getInitialTallyLedgersForCompany,
  getInitialMappingRulesForCompany,
  buildHierarchicalMisTree,
  sanitizeAndRepairTallyLedgers,
} from "../../utils/tallyLedgerMisEngine";
import {
  enrichPnlStatement,
  exportPnlToCSV,
  computeMonthPairVariance,
  formatVariancePct,
  FISCAL_YEAR_MONTHS,
  getPnlLast2MonthsComparison,
  getPnlQuarterlyComparison,
  PnlComparisonMetric,
} from "../../utils/pnlMonths";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  BarChart3,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Check,
  PieChart,
  Sparkles,
  Edit3,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface PnlAccountViewProps {
  pnlStatement: PnlStatementData;
  clientProfile: ClientProfile;
  onOpenModifyModal?: (tab?: string) => void;
}

type PnlDisplayTab = "multi-month" | "variance-deep" | "monthly-trends";

export const PnlAccountView: React.FC<PnlAccountViewProps> = ({
  pnlStatement,
  clientProfile,
  onOpenModifyModal,
}) => {
  const { showToast, updateFinancialMIS } = useApp();
  const [showInLakhs, setShowInLakhs] = useState(true);

  const handleResetPnl = () => {
    if (
      !window.confirm(
        `Reset Profit & Loss (P&L) statement to blank/zero for ${clientProfile.companyName}?`,
      )
    ) {
      return;
    }
    updateFinancialMIS({
      monthlyRevenue: 0,
      ebitda: 0,
      ebitdaMarginPercent: 0,
      netProfit: 0,
      grossMarginPercent: 0,
      pnlStatement: {
        ...pnlStatement,
        income: {
          revenueFromOperations: 0,
          otherIncome: 0,
          totalIncome: 0,
        },
        expenses: {
          costOfMaterialsOrDirectCosts: 0,
          employeeBenefitsExpense: 0,
          cloudAndInfrastructureCosts: 0,
          salesAndMarketingCosts: 0,
          otherExpenses: 0,
          financeCosts: 0,
          depreciationAndAmortization: 0,
          totalExpenses: 0,
        },
        profitability: {
          grossProfit: 0,
          grossMarginPercent: 0,
          ebitda: 0,
          ebitdaMarginPercent: 0,
          pbt: 0,
          pbtMarginPercent: 0,
          currentTax: 0,
          deferredTax: 0,
          pat: 0,
          patMarginPercent: 0,
        },
        lineItems: [],
      },
    });
    showToast("Profit & Loss (P&L) statement reset to blank/zero.");
  };
  const [activeTab, setActiveTab] = useState<PnlDisplayTab>("multi-month");
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [pnlComparisonMode, setPnlComparisonMode] = useState<
    "last2months" | "quarterly" | "all6months"
  >("last2months");
  const [selectedExpenseCard, setSelectedExpenseCard] = useState<"mfg" | "admin" | "selling">(
    "admin",
  );

  // Expense Provisions Feature: Option to add provisions manually or upload provision sheet
  const [includeProvisions, setIncludeProvisions] = useState(true);
  const [provisionsList, setProvisionsList] = useState<ExpenseProvisionItem[]>(() =>
    ensureDefaultExpenseHeadProvisions(
      pnlStatement.expenseProvisions || INITIAL_EXPENSE_PROVISIONS,
    ),
  );
  const [isProvisionsModalOpen, setIsProvisionsModalOpen] = useState(false);
  const [provisionsModalTab, setProvisionsModalTab] = useState<"list" | "add" | "upload">("list");
  const [showProvisionsBreakdown, setShowProvisionsBreakdown] = useState(true);

  // Tally Ledger-Level MIS & Mapping Rules State (Preserves every individual Tally Ledger & Parent Group)
  const companyIdKey = clientProfile?.id || "client-101";
  const [tallyLedgers, setTallyLedgers] = useState<TallyLedgerRecord[]>(() =>
    sanitizeAndRepairTallyLedgers(
      pnlStatement.tallyLedgers && pnlStatement.tallyLedgers.length > 0
        ? pnlStatement.tallyLedgers
        : getInitialTallyLedgersForCompany(companyIdKey, pnlStatement.period || "September 2026"),
    ),
  );
  const [tallyMappingRules, setTallyMappingRules] = useState<TallyLedgerMappingRule[]>(() =>
    pnlStatement.tallyMappingRules && pnlStatement.tallyMappingRules.length > 0
      ? pnlStatement.tallyMappingRules
      : getInitialMappingRulesForCompany(companyIdKey),
  );

  // Sync local tallyLedgers state whenever pnlStatement.tallyLedgers updates (e.g. from ERP Excel Import)
  useEffect(() => {
    if (pnlStatement.tallyLedgers && pnlStatement.tallyLedgers.length > 0) {
      setTallyLedgers(sanitizeAndRepairTallyLedgers(pnlStatement.tallyLedgers));
    }
  }, [pnlStatement.tallyLedgers, pnlStatement.income?.revenueFromOperations]);

  // Self-heal pnlStatement if tallyLedgers had Indirect Expenses previously misclassified into Manufacturing Cost
  const repairedPnlStatement = useMemo((): PnlStatementData => {
    const pnlLedgers = tallyLedgers.filter((l) => l.statementType === "P&L");
    if (pnlLedgers.length === 0) return pnlStatement;

    const adminLedgers = pnlLedgers.filter(
      (l) =>
        l.pnlSection === "Administrative, Selling & Distribution" &&
        (l.reportingGroup.toLowerCase().includes("admin") ||
          l.standardAccount.toLowerCase().includes("office") ||
          l.standardAccount.toLowerCase().includes("legal") ||
          l.standardAccount.toLowerCase().includes("admin")),
    );
    const adminSum = adminLedgers.reduce((acc, l) => acc + l.currentMonth, 0);
    const adminPrevSum = adminLedgers.reduce((acc, l) => acc + l.previousMonth, 0);
    const adminYtdSum = adminLedgers.reduce((acc, l) => acc + l.ytdAmount, 0);

    // If pnlStatement.expenses.otherExpenses was 0 (due to prior substring bug) while adminSum > 0, sync from repaired ledgers
    if (pnlStatement.expenses.otherExpenses === 0 && adminSum > 0) {
      const mfgLedgers = pnlLedgers.filter((l) => l.pnlSection === "Manufacturing Cost");
      const mfgSum = mfgLedgers.reduce((acc, l) => acc + l.currentMonth, 0);
      const mfgPrevSum = mfgLedgers.reduce((acc, l) => acc + l.previousMonth, 0);
      const mfgYtdSum = mfgLedgers.reduce((acc, l) => acc + l.ytdAmount, 0);

      const empLedgers = pnlLedgers.filter((l) => l.pnlSection === "Employee Benefit Expenses");
      const empSum = empLedgers.reduce((acc, l) => acc + l.currentMonth, 0);

      const sellingLedgers = pnlLedgers.filter(
        (l) =>
          l.pnlSection === "Administrative, Selling & Distribution" &&
          !adminLedgers.includes(l) &&
          !l.standardAccount.toLowerCase().includes("cloud"),
      );
      const sellingSum = sellingLedgers.reduce((acc, l) => acc + l.currentMonth, 0);

      const rev = pnlStatement.income.revenueFromOperations || 1;
      const repairedLines = pnlStatement.lineItems.map((li) => {
        if (li.id === "exp-cogs" && mfgSum > 0) {
          return {
            ...li,
            currentMonth: mfgSum,
            previousMonth: mfgPrevSum || li.previousMonth,
            ytdCurrentYear: mfgYtdSum || li.ytdCurrentYear,
            pctOfRevenue: Number(((mfgSum / rev) * 100).toFixed(1)),
          };
        }
        if (li.id === "exp-admin") {
          return {
            ...li,
            particulars:
              "Indirect Administrative, Legal & Office Overheads (Tally Indirect Expenses)",
            currentMonth: adminSum,
            previousMonth: adminPrevSum || li.previousMonth,
            ytdCurrentYear: adminYtdSum || li.ytdCurrentYear,
            pctOfRevenue: Number(((adminSum / rev) * 100).toFixed(1)),
          };
        }
        return li;
      });

      return {
        ...pnlStatement,
        expenses: {
          ...pnlStatement.expenses,
          costOfMaterialsOrDirectCosts:
            mfgSum || pnlStatement.expenses.costOfMaterialsOrDirectCosts,
          employeeBenefitsExpense: empSum || pnlStatement.expenses.employeeBenefitsExpense,
          salesAndMarketingCosts: sellingSum || pnlStatement.expenses.salesAndMarketingCosts,
          otherExpenses: adminSum,
        },
        lineItems: repairedLines,
        tallyLedgers,
      };
    }

    return {
      ...pnlStatement,
      lineItems: pnlStatement.lineItems.map((li) =>
        li.id === "exp-admin"
          ? {
              ...li,
              particulars:
                "Indirect Administrative, Legal & Office Overheads (Tally Indirect Expenses)",
            }
          : li,
      ),
      tallyLedgers,
    };
  }, [pnlStatement, tallyLedgers]);

  const handleUpdateLedgersAndRules = (
    nextLedgers: TallyLedgerRecord[],
    nextRules: TallyLedgerMappingRule[],
    logMessage?: string,
  ) => {
    setTallyLedgers(nextLedgers);
    setTallyMappingRules(nextRules);

    const tree = buildHierarchicalMisTree(nextLedgers);
    const s = tree.pnlSummary;
    const rev = s.revenueFromOperations.currentMonth;

    updateFinancialMIS({
      tallyLedgers: nextLedgers,
      tallyMappingRules: nextRules,
      ...(rev > 0
        ? {
            monthlyRevenue: rev,
            grossMarginPercent: s.grossMarginPct,
            ebitda: s.operatingEbitda.currentMonth,
            ebitdaMarginPercent: s.ebitdaMarginPct,
            netProfit: s.pat.currentMonth,
          }
        : {}),
      pnlStatement: {
        ...pnlStatement,
        ...(rev > 0
          ? {
              income: {
                revenueFromOperations: rev,
                otherIncome: s.otherIncome.currentMonth,
                totalIncome: s.totalIncome.currentMonth,
              },
              profitability: {
                ...pnlStatement.profitability,
                grossProfit: s.grossProfit.currentMonth,
                grossMarginPercent: s.grossMarginPct,
                ebitda: s.operatingEbitda.currentMonth,
                ebitdaMarginPercent: s.ebitdaMarginPct,
                pbt: s.pbt.currentMonth,
                pbtMarginPercent: s.pbtMarginPct,
                currentTax: s.taxExpense.currentMonth,
                pat: s.pat.currentMonth,
                patMarginPercent: s.patMarginPct,
              },
            }
          : {}),
        tallyLedgers: nextLedgers,
        tallyMappingRules: nextRules,
        expenseProvisions: provisionsList,
      },
    });
    if (logMessage) {
      showToast(logMessage);
    }
  };

  // Recalculate statement dynamically based on active provisions and toggle
  const {
    adjustedPnl,
    totalProvisionsAmount,
    provisionsByCategory,
    provisionsByMonth,
    activeProvisionsList,
  } = useMemo(() => {
    return calculateAdjustedPnlStatement(repairedPnlStatement, provisionsList, includeProvisions);
  }, [repairedPnlStatement, provisionsList, includeProvisions]);

  // Handlers for managing provisions
  const handleAddProvision = (newProv: Omit<ExpenseProvisionItem, "id" | "addedAt">) => {
    const item: ExpenseProvisionItem = {
      ...newProv,
      id: `prov-${Date.now()}`,
      addedAt: new Date().toISOString().split("T")[0],
    };
    const updated = [item, ...provisionsList];
    setProvisionsList(updated);
    updateFinancialMIS({
      pnlStatement: {
        ...pnlStatement,
        expenseProvisions: updated,
      },
    });
  };

  const handleUpdateProvision = (id: string, updates: Partial<ExpenseProvisionItem>) => {
    const updated = provisionsList.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProvisionsList(updated);
    updateFinancialMIS({
      pnlStatement: {
        ...pnlStatement,
        expenseProvisions: updated,
      },
    });
  };

  const handleDeleteProvision = (id: string) => {
    const updated = provisionsList.filter((p) => p.id !== id);
    setProvisionsList(updated);
    updateFinancialMIS({
      pnlStatement: {
        ...pnlStatement,
        expenseProvisions: updated,
      },
    });
  };

  const handleBulkUploadProvisions = (
    items: ExpenseProvisionItem[],
    mode: "append" | "replace",
  ) => {
    let updated: ExpenseProvisionItem[];
    if (mode === "replace") {
      updated = ensureDefaultExpenseHeadProvisions(items);
    } else {
      const merged = [...provisionsList];
      items.forEach((incoming) => {
        const matchIdx = merged.findIndex(
          (existing) =>
            existing.expenseHead.trim().toLowerCase() === incoming.expenseHead.trim().toLowerCase(),
        );
        if (matchIdx >= 0) {
          merged[matchIdx] = {
            ...merged[matchIdx],
            amount: incoming.amount,
            remarks: incoming.remarks || merged[matchIdx].remarks,
            category: incoming.category || merged[matchIdx].category,
            status: "active",
          };
        } else {
          merged.push(incoming);
        }
      });
      updated = merged;
    }
    setProvisionsList(updated);
    updateFinancialMIS({
      pnlStatement: {
        ...pnlStatement,
        expenseProvisions: updated,
      },
    });
  };

  // Month selection for variance drill-down using adjusted P&L
  const enrichedPnl = useMemo(() => enrichPnlStatement(adjustedPnl), [adjustedPnl]);
  const months = enrichedPnl.monthsList || FISCAL_YEAR_MONTHS;
  const currentMonthKey = enrichedPnl.currentMonthKey || months[months.length - 1];

  const [selectedTargetMonth, setSelectedTargetMonth] = useState<string>(currentMonthKey);
  const [selectedBaseMonth, setSelectedBaseMonth] = useState<string>(
    months.length > 1 ? months[months.length - 2] : months[0],
  );

  const formatAmount = (amt: number): string => {
    return formatINR(amt, showInLakhs);
  };

  const formatRupee = (amt: number): string => {
    if (showInLakhs) {
      const lakhs = amt / 100000;
      return `₹${lakhs.toLocaleString("en-IN", {
        minimumFractionDigits: Math.abs(lakhs) < 10 ? 2 : 1,
        maximumFractionDigits: 2,
      })} L`;
    }
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const { income, expenses, profitability, lineItems, monthlySummaries } = enrichedPnl;

  // Comparison metrics for graphs
  const last2MonthsMetrics = useMemo(
    () => getPnlLast2MonthsComparison(monthlySummaries || [], currentMonthKey),
    [monthlySummaries, currentMonthKey],
  );
  const quarterlyMetrics = useMemo(
    () => getPnlQuarterlyComparison(monthlySummaries || []),
    [monthlySummaries],
  );
  const allMonthsMetrics = useMemo(() => {
    return (monthlySummaries || []).map((m) => {
      const rev = m.revenue || 1;
      return {
        period: m.month,
        shortPeriod: m.shortMonth,
        periodType: "month" as const,
        revenue: m.revenue,
        revenueLakhs: Number((m.revenue / 100000).toFixed(2)),
        grossProfit: m.grossProfit,
        grossMarginPct: m.grossMarginPct,
        ebitda: m.ebitda,
        ebitdaMarginPct: m.ebitdaMarginPct,
        pat: m.pat,
        patMarginPct: m.patMarginPct,
        cogs: m.cogs,
        cogsPctOfRevenue: Number(((m.cogs / rev) * 100).toFixed(1)),
        employeeExpense: m.employeeExpense,
        employeePctOfRevenue: Number(((m.employeeExpense / rev) * 100).toFixed(1)),
        operatingExpenses: m.operatingExpenses,
        opexPctOfRevenue: Number(((m.operatingExpenses / rev) * 100).toFixed(1)),
        totalExpenses: m.totalExpenses,
        expenseRatioPct: Number(((m.totalExpenses / rev) * 100).toFixed(1)),
      };
    });
  }, [monthlySummaries]);

  const activePnlMetrics =
    pnlComparisonMode === "last2months"
      ? last2MonthsMetrics
      : pnlComparisonMode === "quarterly"
        ? quarterlyMetrics
        : allMonthsMetrics;

  // Filtered line items for table
  const filteredLineItems = useMemo(() => {
    return lineItems.filter((item) => {
      if (summaryOnly && !item.isTotal && !item.isSubtotal) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.particulars.toLowerCase().includes(q) ||
        (item.noteRef && item.noteRef.toLowerCase().includes(q))
      );
    });
  }, [lineItems, searchQuery, summaryOnly]);

  // Dynamic variance analysis between the two selected months
  const varianceRows = useMemo(() => {
    return computeMonthPairVariance(lineItems, selectedBaseMonth, selectedTargetMonth);
  }, [lineItems, selectedBaseMonth, selectedTargetMonth]);

  // Overall financial highlights for current vs previous month
  const revOps = lineItems.find((i) => i.id === "rev-ops");
  const ebitdaItem = lineItems.find((i) => i.id === "ebitda-sub");
  const patItem = lineItems.find((i) => i.id === "pat-final");

  const revCurrent =
    revOps?.monthlyBreakdown?.[selectedTargetMonth] ?? income.revenueFromOperations;
  const revBase = revOps?.monthlyBreakdown?.[selectedBaseMonth] ?? revOps?.previousMonth ?? 0;
  const revVariance = revCurrent - revBase;
  const revVariancePct = revBase > 0 ? (revVariance / revBase) * 100 : 0;

  const ebitdaCurrent = ebitdaItem?.monthlyBreakdown?.[selectedTargetMonth] ?? profitability.ebitda;
  const ebitdaBase =
    ebitdaItem?.monthlyBreakdown?.[selectedBaseMonth] ?? ebitdaItem?.previousMonth ?? 0;
  const ebitdaVariance = ebitdaCurrent - ebitdaBase;
  const ebitdaVariancePct = ebitdaBase > 0 ? (ebitdaVariance / ebitdaBase) * 100 : 0;

  const patCurrent = patItem?.monthlyBreakdown?.[selectedTargetMonth] ?? profitability.pat;
  const patBase = patItem?.monthlyBreakdown?.[selectedBaseMonth] ?? patItem?.previousMonth ?? 0;
  const patVariance = patCurrent - patBase;
  const patVariancePct = patBase > 0 ? (patVariance / patBase) * 100 : 0;

  // Chart data formatted in Lakhs for clean charts
  const chartData = useMemo(() => {
    if (!monthlySummaries) return [];
    return monthlySummaries.map((m) => ({
      name: m.shortMonth,
      fullName: m.month,
      revenueLakhs: Number((m.revenue / 100000).toFixed(2)),
      expenseLakhs: Number((m.totalExpenses / 100000).toFixed(2)),
      cogsLakhs: Number((m.cogs / 100000).toFixed(2)),
      ebitdaLakhs: Number((m.ebitda / 100000).toFixed(2)),
      patLakhs: Number((m.pat / 100000).toFixed(2)),
      ebitdaMargin: m.ebitdaMarginPct,
      grossMargin: m.grossMarginPct,
      patMargin: m.patMarginPct,
      isCurrent: m.isCurrent,
    }));
  }, [monthlySummaries]);

  // CSV Export handler
  const handleExportCSV = () => {
    const csvContent = exportPnlToCSV(enrichedPnl, clientProfile.companyName);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `PnL_Statement_${clientProfile.companyName.replace(/\s+/g, "_")}_Apr_to_${currentMonthKey.replace(/\s+/g, "_")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Executive Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Profit &amp; Loss Account (P&amp;L)
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                • {clientProfile.companyName} ({currentMonthKey})
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setActiveTab("multi-month")}
                className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "multi-month"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Multi-Month</span>
              </button>
              <button
                onClick={() => setActiveTab("variance-deep")}
                className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "variance-deep"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Variance</span>
              </button>
              <button
                onClick={() => setActiveTab("monthly-trends")}
                className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "monthly-trends"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Trends</span>
              </button>
            </div>

            {/* Display Units Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setShowInLakhs(true)}
                className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                  showInLakhs
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ₹ Lakhs
              </button>
              <button
                onClick={() => setShowInLakhs(false)}
                className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                  !showInLakhs
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Exact ₹
              </button>
            </div>

            {/* Expense Provisions Toggle */}
            <button
              onClick={() => {
                setIncludeProvisions(!includeProvisions);
                showToast(
                  !includeProvisions
                    ? "Expense provisions included - P&L recalculated with accrued expenses"
                    : "Expense provisions excluded - showing raw Tally books only",
                );
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                includeProvisions
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${includeProvisions ? "bg-amber-500" : "bg-slate-300"}`}
              />
              <span>Provisions ({includeProvisions ? "On" : "Off"})</span>
            </button>

            {/* Manage Provisions */}
            <button
              onClick={() => {
                setProvisionsModalTab("list");
                setIsProvisionsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Manage Provisions</span>
            </button>

            {/* Modify P&L, Reset & Export CSV */}
            {onOpenModifyModal && (
              <button
                type="button"
                onClick={() => onOpenModifyModal("pnl")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                title="Directly modify P&L revenue, cost heads, and line items"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Modify P&amp;L</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleResetPnl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Reset all P&L figures to blank/zero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset P&amp;L</span>
            </button>
          </div>
        </div>

        {/* 2. EXECUTIVE P&L SYNOPSIS & OPERATING MARGINS */}
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Operating Margins &amp; Profitability
            </span>
            <span className="text-xs font-mono text-slate-400">FY 2026-27</span>
          </div>

          {/* 4 Core Profitability % Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Box 1: Gross Profit Margin */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Gross Profit Margin %
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Target &gt; 65%
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <p className="text-lg font-bold text-white font-mono">
                  {profitability.grossMarginPercent}%
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {formatAmount(profitability.grossProfit)}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(profitability.grossMarginPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Direct Cost:{" "}
                {(
                  (expenses.costOfMaterialsOrDirectCosts / (income.revenueFromOperations || 1)) *
                  100
                ).toFixed(1)}
                % of Revenue
              </span>
            </div>

            {/* Box 2: Operating EBITDA Margin */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Operating EBITDA Margin %
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Target &gt; 25%
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <p className="text-lg font-bold text-white font-mono">
                  {profitability.ebitdaMarginPercent}%
                </p>
                <span className="text-[10px] text-indigo-300 font-mono">
                  {formatAmount(ebitdaCurrent)}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${Math.min(profitability.ebitdaMarginPercent * 2.5, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                MoM: {formatVariancePct(ebitdaVariancePct)} (+{formatRupee(ebitdaVariance)})
              </span>
            </div>

            {/* Box 3: Net Profit (PAT) Margin */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Net Profit (PAT) Margin %
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Target &gt; 18%
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <p className="text-lg font-bold text-white font-mono">
                  {profitability.patMarginPercent}%
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {formatAmount(patCurrent)}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(profitability.patMarginPercent * 3.5, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                YTD Net PAT: {formatRupee(patItem?.ytdCurrentYear || 4707000)}
              </span>
            </div>

            {/* Box 4: Total Cost Efficiency Ratio */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Total Expense Ratio %
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Disciplined
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <p className="text-lg font-bold text-white font-mono">
                  {((expenses.totalExpenses / (income.revenueFromOperations || 1)) * 100).toFixed(
                    1,
                  )}
                  %
                </p>
                <span className="text-[10px] text-blue-300 font-mono">of Revenue</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{
                    width: `${Math.min((expenses.totalExpenses / (income.revenueFromOperations || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Payroll{" "}
                {(
                  (expenses.employeeBenefitsExpense / (income.revenueFromOperations || 1)) *
                  100
                ).toFixed(1)}
                % • Opex{" "}
                {((expenses.otherExpenses / (income.revenueFromOperations || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Virtual CFO Findings Strip */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Virtual CFO P&amp;L Synopsis Findings:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-slate-300">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">1. Gross Margin Resilience:</strong>
                Gross margins have held above{" "}
                <span className="text-emerald-400 font-semibold">
                  {profitability.grossMarginPercent}%
                </span>{" "}
                continuously, reflecting strong SaaS pricing power with controlled hosting COGS.
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">2. Operating Leverage:</strong>
                Operating EBITDA margin stands at{" "}
                <span className="text-indigo-400 font-semibold">
                  {profitability.ebitdaMarginPercent}%
                </span>
                , showing fixed-cost leverage as revenue expanded +
                {formatVariancePct(revVariancePct)} MoM.
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">3. Bottom-Line Conversion:</strong>
                Net PAT margin of{" "}
                <span className="text-emerald-400 font-semibold">
                  {profitability.patMarginPercent}%
                </span>{" "}
                delivers ₹{formatAmount(patCurrent)} net profit for the month, accumulating ₹
                {formatRupee(patItem?.ytdCurrentYear || 4707000)} YTD.
              </div>
            </div>
          </div>
        </div>



        {/* 3. GRAPHICAL REPRESENTATION OF IMPORTANT % OF P&L (COMPARISON WITH LAST 2 MONTHS & QUARTERLY) */}
        <div className="mt-5 pt-4 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Profit &amp; Loss Percentage Metrics &amp; Comparative Trajectory
                </h3>
              </div>
            </div>

            {/* Timeframe Mode Selector: Last 2 Months vs Quarterly vs All 6 Months */}
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs shadow-2xs self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setPnlComparisonMode("last2months")}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  pnlComparisonMode === "last2months"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last 2 Months Comparison (Jul vs Aug vs Sep)</span>
              </button>
              <button
                onClick={() => setPnlComparisonMode("quarterly")}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  pnlComparisonMode === "quarterly"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Quarterly Comparison (Q1 FY27 vs Q2 FY27)</span>
              </button>
              <button
                onClick={() => setPnlComparisonMode("all6months")}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  pnlComparisonMode === "all6months"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>6-Month Trajectory (Apr–Sep)</span>
              </button>
            </div>
          </div>

          {/* Quick Comparative Highlight Cards for Selected Timeframe */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activePnlMetrics.map((item, idx) => {
              const isLatest = idx === activePnlMetrics.length - 1;
              return (
                <div
                  key={item.period}
                  className={`p-3 rounded-xl border transition-all ${
                    isLatest
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-900"
                      : "bg-slate-50/70 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-900">{item.shortPeriod}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ₹{item.revenueLakhs} L Rev
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Gross Margin %:</span>
                      <span className="font-bold font-mono text-emerald-700">
                        {item.grossMarginPct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">EBITDA Margin %:</span>
                      <span className="font-bold font-mono text-indigo-700">
                        {item.ebitdaMarginPct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">PAT Margin %:</span>
                      <span className="font-bold font-mono text-emerald-700">
                        {item.patMarginPct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">COGS % of Rev:</span>
                      <span className="font-bold font-mono text-amber-700">
                        {item.cogsPctOfRevenue}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Trajectory Summary Badge */}
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                  {pnlComparisonMode === "quarterly"
                    ? "QoQ Margin Evolution"
                    : "MoM Margin Evolution"}
                </span>
                <p className="text-[11px] text-indigo-950 font-medium mt-1 leading-snug">
                  EBITDA margins expanded from {activePnlMetrics[0]?.ebitdaMarginPct}% to{" "}
                  {activePnlMetrics[activePnlMetrics.length - 1]?.ebitdaMarginPct}% with COGS held
                  strictly at {activePnlMetrics[activePnlMetrics.length - 1]?.cogsPctOfRevenue}%.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 mt-2">
                <span>Healthy Operational Leverage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Two Responsive Comparison Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
            {/* Graph 1: Profitability Margins % (Gross, EBITDA, PAT) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Operating Profitability Margins (%)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Gross Margin %, EBITDA Margin %, and PAT (Net Profit) Margin %
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {pnlComparisonMode === "last2months"
                    ? "Last 2 Months"
                    : pnlComparisonMode === "quarterly"
                      ? "Quarterly"
                      : "6-Month"}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activePnlMetrics}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shortPeriod" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      domain={[0, 80]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                      labelFormatter={(label) => `Period: ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Bar
                      dataKey="grossMarginPct"
                      name="Gross Margin %"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ebitdaMarginPct"
                      name="EBITDA Margin %"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="patMarginPct"
                      name="PAT (Net Profit) %"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2: Cost Structure % of Revenue (COGS %, Payroll %, Opex %) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cost Structure Proportions (% of Revenue)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Direct Costs (COGS) %, Employee Payroll %, and Operating Expenses %
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {pnlComparisonMode === "last2months"
                    ? "Last 2 Months"
                    : pnlComparisonMode === "quarterly"
                      ? "Quarterly"
                      : "6-Month"}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activePnlMetrics}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shortPeriod" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      domain={[0, 45]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                      labelFormatter={(label) => `Period: ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Bar
                      dataKey="cogsPctOfRevenue"
                      name="COGS / Direct Costs %"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="employeePctOfRevenue"
                      name="Payroll & Staff %"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="opexPctOfRevenue"
                      name="Operating Expenses %"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TALLY LEDGER-LEVEL MIS & 4-VIEW CFO HIERARCHY EXPLORER */}
      <div id="ledger-level-mis-explorer-section">
        <LedgerLevelMisExplorer
          companyId={companyIdKey}
          clientProfile={clientProfile}
          period={currentMonthKey}
          initialStatementType="P&L"
          ledgers={tallyLedgers}
          mappingRules={tallyMappingRules}
          onUpdateLedgersAndRules={handleUpdateLedgersAndRules}
        />
      </div>

      {/* SIMPLE MIS EXPENSE PROVISIONING CARD (MANUAL BY EXPENSE HEAD + FIXED UTILITY DEFAULT + EXCEL UPLOAD) */}
      <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/60 px-5 py-3.5 border-b border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  MIS Expense Provisioning (Against Each Expense Head)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                  Total Provision: ₹{(totalProvisionsAmount / 100000).toFixed(2)} L (
                  {formatINR(totalProvisionsAmount)})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Fixed Utility Expense Included &amp; Editable
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const name = downloadProvisionsExcelTemplate(
                  clientProfile.companyName,
                  currentMonthKey,
                  provisionsList,
                );
                showToast(`Downloaded Excel provision template: ${name}`);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Template</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProvisionsModalTab("upload");
                setIsProvisionsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload Excel</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProvisionsModalTab("list");
                setIsProvisionsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Full Provisioning Modal</span>
            </button>
            <button
              type="button"
              onClick={() => setShowProvisionsBreakdown(!showProvisionsBreakdown)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-100/80 hover:bg-amber-200/70 text-amber-900 cursor-pointer"
            >
              {showProvisionsBreakdown ? "Hide Table ▲" : "Show Table ▼"}
            </button>
          </div>
        </div>

        {showProvisionsBreakdown && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Expense Head</th>
                  <th className="py-2.5 px-3">P&amp;L Category</th>
                  <th className="py-2.5 px-3 w-48">Manual Provision (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28">In Lakhs</th>
                  <th className="py-2.5 px-3">Remarks / Accrual Basis (Editable)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {provisionsList.map((prov) => {
                  const catInfo = PROVISION_CATEGORY_CONFIG[prov.category];
                  return (
                    <tr
                      key={prov.id}
                      className={
                        prov.isDefaultFixedUtility
                          ? "bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors"
                          : "hover:bg-slate-50/80 transition-colors"
                      }
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{prov.expenseHead}</span>
                          {prov.isDefaultFixedUtility && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Fixed Utility (Default • Editable)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {catInfo?.shortLabel || prov.category}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 font-mono text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={prov.amount === 0 ? "" : prov.amount}
                            placeholder="0"
                            onChange={(e) => {
                              const val =
                                e.target.value === "" ? 0 : Math.max(0, Number(e.target.value));
                              handleUpdateProvision(prov.id, {
                                amount: val,
                                status: "active",
                              });
                            }}
                            className={`w-full pl-6 pr-2.5 py-1 rounded-lg border font-mono text-xs font-bold focus:outline-none focus:ring-2 ${
                              prov.isDefaultFixedUtility
                                ? "border-emerald-300 bg-white text-emerald-950 focus:ring-emerald-500/30"
                                : prov.amount > 0
                                  ? "border-amber-300 bg-amber-50/40 text-slate-900 focus:ring-amber-500/30"
                                  : "border-slate-200 bg-white text-slate-700 focus:ring-indigo-500/20"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        ₹{((prov.amount || 0) / 100000).toFixed(2)} L
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={prov.remarks || ""}
                          placeholder="Add provision note..."
                          onChange={(e) =>
                            handleUpdateProvision(prov.id, { remarks: e.target.value })
                          }
                          className="w-full px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-slate-300 bg-transparent focus:bg-white text-xs text-slate-700 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW 1: FULL MULTI-MONTH STATEMENT (APRIL TILL CURRENT MONTH) */}
      {activeTab === "multi-month" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Table Header Bar with Search & Filters */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                <span>Multi-Month Statement of Profit & Loss</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono lowercase">
                  all completed months (apr – current)
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter heads / notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-800 text-white placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Summary Heads Only Toggle */}
              <button
                onClick={() => setSummaryOnly(!summaryOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  summaryOnly
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {summaryOnly ? "Summary Only ✓" : "All Line Items"}
              </button>
            </div>
          </div>

          {/* Multi-Month Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 min-w-[260px] sticky left-0 bg-slate-50 z-10 shadow-xs border-r border-slate-200/60">
                    Particulars & Operational Head
                  </th>
                  <th className="py-3 px-2 text-center w-14">Note</th>
                  {/* Previous Completed Months from April */}
                  {months.map((m) => {
                    const isCurrent = m === currentMonthKey;
                    const shortName = m.split(" ")[0].slice(0, 3);
                    return (
                      <th
                        key={m}
                        className={`py-3 px-3 text-right font-mono min-w-[90px] ${
                          isCurrent
                            ? "bg-emerald-50/80 text-emerald-900 border-x border-emerald-200 font-bold"
                            : "text-slate-600"
                        }`}
                      >
                        <div className="flex flex-col items-end">
                          <span>{shortName} '26</span>
                          <span
                            className={`text-[9px] lowercase font-sans font-normal ${
                              isCurrent ? "text-emerald-700 font-semibold" : "text-slate-400"
                            }`}
                          >
                            {isCurrent ? "● current" : "completed"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-right text-slate-700 font-bold min-w-[95px] bg-slate-100/50">
                    MoM Var (₹)
                  </th>
                  <th className="py-3 px-3 text-right text-slate-700 font-bold min-w-[85px] bg-slate-100/50">
                    MoM Var (%)
                  </th>
                  <th className="py-3 px-3 text-right text-slate-600 font-semibold min-w-[95px]">
                    Monthly Avg
                  </th>
                  <th className="py-3 px-4 text-right text-slate-900 font-bold min-w-[110px] bg-slate-100/80 border-l border-slate-200">
                    YTD (FY 26-27)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLineItems.map((item) => {
                  const isHeading = item.isTotal || item.isSubtotal;
                  const isPat = item.id === "pat-final";
                  const isEbitda = item.id === "ebitda-sub";
                  const isTotInc = item.id === "tot-inc";

                  let rowClass = "hover:bg-slate-50/60";
                  if (isPat) {
                    rowClass =
                      "bg-emerald-50/90 font-extrabold text-emerald-950 border-y-2 border-emerald-300";
                  } else if (isEbitda) {
                    rowClass =
                      "bg-indigo-50/70 font-bold text-indigo-950 border-y border-indigo-200";
                  } else if (isTotInc) {
                    rowClass = "bg-slate-100 font-bold text-slate-900 border-y border-slate-200";
                  } else if (item.isTotal) {
                    rowClass = "bg-slate-100/70 font-bold text-slate-900";
                  } else if (item.isSubtotal) {
                    rowClass = "bg-slate-50 font-bold text-slate-800";
                  }

                  const momVariance =
                    item.varianceVsPrevious ?? item.currentMonth - item.previousMonth;
                  const momVariancePct = item.varianceVsPreviousPct ?? item.momGrowthPct ?? 0;
                  const avgMonthly =
                    item.monthlyAverage ?? Math.round(item.ytdCurrentYear / months.length);

                  return (
                    <tr key={item.id} className={`${rowClass} transition-colors text-xs`}>
                      {/* Line Item Particulars (Sticky Column) */}
                      <td
                        className={`py-2.5 px-4 sticky left-0 z-10 border-r border-slate-200/60 ${
                          isPat
                            ? "bg-emerald-50 text-emerald-950 font-bold"
                            : isEbitda
                              ? "bg-indigo-50 text-indigo-950 font-bold"
                              : isHeading
                                ? "bg-slate-50 text-slate-900 font-bold"
                                : "bg-white text-slate-700 pl-6"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate" title={item.particulars}>
                            {item.particulars}
                          </span>
                          {item.varianceRemarks && !isHeading && (
                            <span
                              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-help"
                              title={item.varianceRemarks}
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Note Ref */}
                      <td className="py-2.5 px-2 text-center text-[10px] text-slate-400 font-mono">
                        {item.noteRef || "—"}
                      </td>

                      {/* Month Columns (April to Current Month) */}
                      {months.map((m) => {
                        const isCurrent = m === currentMonthKey;
                        const val = item.monthlyBreakdown?.[m] ?? 0;
                        return (
                          <td
                            key={m}
                            className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                              isCurrent
                                ? "bg-emerald-50/40 text-emerald-950 font-semibold border-x border-emerald-200/50"
                                : isHeading
                                  ? "font-bold text-slate-900"
                                  : "text-slate-700"
                            }`}
                          >
                            {formatAmount(val)}
                          </td>
                        );
                      })}

                      {/* MoM Variance (₹) */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums bg-slate-50/50 ${
                          isHeading ? "font-bold" : ""
                        }`}
                      >
                        <span
                          className={
                            momVariance > 0
                              ? item.id.startsWith("exp-")
                                ? "text-amber-700 font-medium"
                                : "text-emerald-700 font-semibold"
                              : momVariance < 0
                                ? item.id.startsWith("exp-")
                                  ? "text-emerald-700 font-semibold"
                                  : "text-rose-600 font-medium"
                                : "text-slate-500"
                          }
                        >
                          {momVariance > 0 ? "+" : ""}
                          {formatAmount(momVariance)}
                        </span>
                      </td>

                      {/* MoM Variance (%) */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums bg-slate-50/50 ${
                          isHeading ? "font-bold" : ""
                        }`}
                      >
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] ${
                            momVariancePct > 0
                              ? item.id.startsWith("exp-")
                                ? "text-amber-700 font-medium"
                                : "text-emerald-700 font-semibold"
                              : momVariancePct < 0
                                ? item.id.startsWith("exp-")
                                  ? "text-emerald-700 font-semibold"
                                  : "text-rose-600 font-medium"
                                : "text-slate-400"
                          }`}
                        >
                          {momVariancePct > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : momVariancePct < 0 ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : null}
                          {formatVariancePct(momVariancePct)}
                        </span>
                      </td>

                      {/* Monthly Average */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 ${
                          isHeading ? "font-semibold text-slate-800" : ""
                        }`}
                      >
                        {formatAmount(avgMonthly)}
                      </td>

                      {/* Cumulative YTD */}
                      <td
                        className={`py-2.5 px-4 text-right font-mono tabular-nums bg-slate-50 border-l border-slate-200 ${
                          isHeading ? "font-bold text-slate-900" : "text-slate-800 font-medium"
                        }`}
                      >
                        {formatAmount(item.ytdCurrentYear)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quarter Breakdown and Legend */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center flex-wrap gap-4">
              <span className="font-semibold text-slate-700">Financial Year Timeline:</span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Q1 FY27 Completed (Apr, May, Jun)</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Q2 Jul & Aug Completed</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-emerald-900">
                  September (Active / Current Month)
                </span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              *Figures audited in accordance with ICAI Accounting Standards & Ind AS 1
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAILED MONTH-ON-MONTH VARIANCE ANALYSIS */}
      {activeTab === "variance-deep" && (
        <div className="space-y-6">
          {/* Comparison Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Month-on-Month Variance & Operational Commentary</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                    Detailed Line Item Audit
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any completed month from April to compare against the current reporting
                  month
                </p>
              </div>

              {/* Month Pair Selectors */}
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Target Month:</span>
                  <select
                    value={selectedTargetMonth}
                    onChange={(e) => setSelectedTargetMonth(e.target.value)}
                    className="text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === currentMonthKey ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-medium text-xs">vs</span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Base / Completed Month:
                  </span>
                  <select
                    value={selectedBaseMonth}
                    onChange={(e) => setSelectedBaseMonth(e.target.value)}
                    className="text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === "April 2026" ? "(FY Kickoff)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Top Variance Cards Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
                  <span>Revenue Expansion</span>
                  <span>{formatVariancePct(revVariancePct)}</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-950 mt-1">
                  {formatRupee(revVariance)}
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {selectedTargetMonth.split(" ")[0]} vs {selectedBaseMonth.split(" ")[0]} top-line
                  variance
                </p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
                  <span>EBITDA Differential</span>
                  <span>{formatVariancePct(ebitdaVariancePct)}</span>
                </div>
                <div className="text-lg font-bold font-mono text-indigo-950 mt-1">
                  {formatRupee(ebitdaVariance)}
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Operating profit trajectory between chosen periods
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                  <span>Net Profit (PAT) Shift</span>
                  <span>{formatVariancePct(patVariancePct)}</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatRupee(patVariance)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bottom-line earnings delta after all statutory taxes
                </p>
              </div>
            </div>
          </div>

          {/* Variance Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Variance Schedule: {selectedTargetMonth} vs {selectedBaseMonth}
              </h4>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Favorable Variance
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Adverse Variance / Cost Overrun
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-4 w-1/3">Particulars</th>
                    <th className="py-2.5 px-3 text-right">{selectedBaseMonth}</th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50/50 text-emerald-900 font-bold">
                      {selectedTargetMonth}
                    </th>
                    <th className="py-2.5 px-3 text-right">Variance (₹)</th>
                    <th className="py-2.5 px-3 text-right">Variance (%)</th>
                    <th className="py-2.5 px-3 text-center">Impact</th>
                    <th className="py-2.5 px-4 text-left">Virtual CFO Remarks & Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {varianceRows.map((row) => {
                    return (
                      <tr
                        key={row.id}
                        className={`${
                          row.isHeading
                            ? "bg-slate-50 font-bold text-slate-900"
                            : "hover:bg-slate-50/60 text-slate-700"
                        }`}
                      >
                        <td
                          className={`py-2.5 px-4 ${
                            row.isHeading ? "font-bold text-slate-900" : "pl-6 text-slate-800"
                          }`}
                        >
                          {row.particulars}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatAmount(row.baseMonthValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums bg-emerald-50/30 font-semibold text-emerald-950">
                          {formatAmount(row.targetMonthValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          <span
                            className={
                              row.status === "Favorable"
                                ? "text-emerald-700 font-semibold"
                                : row.status === "Adverse"
                                  ? "text-amber-700 font-medium"
                                  : "text-slate-500"
                            }
                          >
                            {row.varianceAmount > 0 ? "+" : ""}
                            {formatAmount(row.varianceAmount)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              row.status === "Favorable"
                                ? "text-emerald-700 font-semibold"
                                : row.status === "Adverse"
                                  ? "text-amber-700 font-medium"
                                  : "text-slate-500"
                            }`}
                          >
                            {formatVariancePct(row.variancePct)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.status === "Favorable" && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Favorable
                            </span>
                          )}
                          {row.status === "Adverse" && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              Adverse
                            </span>
                          )}
                          {row.status === "Neutral" && (
                            <span className="text-slate-400 text-[10px]">Neutral</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">
                          {row.varianceRemarks ? (
                            <span className="text-slate-600">{row.varianceRemarks}</span>
                          ) : row.isHeading ? (
                            <span className="text-slate-400 italic font-normal">
                              Aggregated category total
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORICAL CHARTS & MULTI-MONTH TRENDS */}
      {activeTab === "monthly-trends" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Total Expenses Bar & Line */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Monthly Revenue & Expense Trajectory (Apr – Current)
                  </h3>
                  <p className="text-xs text-slate-500">Monthly figures in INR Lakhs (₹L)</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  {months.length} Months Time-Series
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `₹${Number(val).toFixed(2)} Lakhs`,
                        name === "revenueLakhs" ? "Revenue" : "Total Expenses",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload[0]?.payload;
                        return item?.fullName || label;
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar
                      dataKey="revenueLakhs"
                      name="Revenue"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="expenseLakhs"
                      name="Total Expenses"
                      fill="#64748b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Operating EBITDA & Net Profit (PAT) Trajectory */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Operating EBITDA & PAT Progression (Apr – Current)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Profitability surge and operating leverage
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  Margin Expansion
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `₹${Number(val).toFixed(2)} Lakhs`,
                        name === "ebitdaLakhs" ? "EBITDA" : "PAT (Net Profit)",
                      ]}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="ebitdaLakhs"
                      name="EBITDA"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ebitdaGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="patLakhs"
                      name="PAT (Net Profit)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#patGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Margin Percentages Line Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Margin Percentage Evolution (%) — April till Current Month
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking Gross Profit Margin %, EBITDA Margin % and Net Profit Margin %
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}%`, name]}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="grossMargin"
                    name="Gross Margin %"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ebitdaMargin"
                    name="EBITDA Margin %"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patMargin"
                    name="PAT Margin %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}



      {/* Expense Provisions Manager Modal */}
      <PnlProvisionsModal
        isOpen={isProvisionsModalOpen}
        onClose={() => setIsProvisionsModalOpen(false)}
        provisions={provisionsList}
        onAddProvision={handleAddProvision}
        onUpdateProvision={handleUpdateProvision}
        onDeleteProvision={handleDeleteProvision}
        onBulkUploadProvisions={handleBulkUploadProvisions}
        clientProfile={clientProfile}
        availableMonths={months}
        currentMonth={currentMonthKey}
        showToast={showToast}
        initialTab={provisionsModalTab}
      />
    </div>
  );
};
