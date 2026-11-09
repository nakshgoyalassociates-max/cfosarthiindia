import React, { useState, useEffect } from "react";
import {
  FinancialMIS,
  ClientProfile,
  PnlStatementData,
  BalanceSheetData,
  DebtorAgeingData,
  DebtorRecord,
  FundFlowData,
  PnlLineItem,
} from "../../types";
import { formatINR, formatLakhs, formatCrores } from "../../utils/format";
import {
  NEXORA_BALANCE_SHEET,
  NEXORA_PNL_STATEMENT,
  NEXORA_DEBTOR_AGEING,
  NEXORA_FUND_FLOW,
} from "../../data/mockMisFinancials";
import {
  X,
  Save,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  Wallet,
  Scale,
  Calendar,
  FileSpreadsheet,
  Layers,
  RotateCcw,
  Sparkles,
  Info,
  Plus,
  ArrowRight,
  ShieldAlert,
  Percent,
  Check,
  Building,
} from "lucide-react";

export type ModifyMisTabKey =
  | "kpis"
  | "pnl"
  | "bs"
  | "debtors"
  | "fundflow"
  | "commentary"
  | "data-management";

interface ModifyFinancialMisModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialMIS: FinancialMIS;
  clientProfile: ClientProfile;
  initialTab?: ModifyMisTabKey;
  onSave: (updated: Partial<FinancialMIS>) => void;
  onDeleteCompanyMIS: () => void;
  onOpenUploadModal: () => void;
}

export const ModifyFinancialMisModal: React.FC<ModifyFinancialMisModalProps> = ({
  isOpen,
  onClose,
  financialMIS,
  clientProfile,
  initialTab = "kpis",
  onSave,
  onDeleteCompanyMIS,
  onOpenUploadModal,
}) => {
  const [formData, setFormData] = useState<FinancialMIS>(financialMIS);
  const [activeTab, setActiveTab] = useState<ModifyMisTabKey>(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New P&L Line Item Form State
  const [showAddPnlLine, setShowAddPnlLine] = useState(false);
  const [newPnlParticulars, setNewPnlParticulars] = useState("");
  const [newPnlNoteRef, setNewPnlNoteRef] = useState("");
  const [newPnlCurrentMonth, setNewPnlCurrentMonth] = useState(0);
  const [newPnlPreviousMonth, setNewPnlPreviousMonth] = useState(0);
  const [newPnlYtd, setNewPnlYtd] = useState(0);

  // New Debtor Record Form State
  const [showAddDebtor, setShowAddDebtor] = useState(false);
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorTerms, setNewDebtorTerms] = useState(30);
  const [newDebtorTotal, setNewDebtorTotal] = useState(0);
  const [newDebtorRisk, setNewDebtorRisk] = useState<"Low" | "Medium" | "High">("Low");
  const [newDebtorStatus, setNewDebtorStatus] = useState<DebtorRecord["status"]>("Current");
  const [newDebtorNotes, setNewDebtorNotes] = useState("");

  // Hydrate state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Ensure embedded objects exist with safe fallback structures
      const hydrated: FinancialMIS = {
        ...financialMIS,
        pnlStatement: financialMIS.pnlStatement || NEXORA_PNL_STATEMENT,
        balanceSheet: financialMIS.balanceSheet || NEXORA_BALANCE_SHEET,
        debtorAgeing: financialMIS.debtorAgeing || NEXORA_DEBTOR_AGEING,
        fundFlow: financialMIS.fundFlow || NEXORA_FUND_FLOW,
      };
      setFormData(hydrated);
      setActiveTab(initialTab);
      setShowDeleteConfirm(false);
      setConfirmText("");
      setSaveSuccessMsg(null);
      setShowAddPnlLine(false);
      setShowAddDebtor(false);
    }
  }, [isOpen, financialMIS, initialTab]);

  if (!isOpen) return null;

  // Active sub-statements
  const pnl = formData.pnlStatement || NEXORA_PNL_STATEMENT;
  const bs = formData.balanceSheet || NEXORA_BALANCE_SHEET;
  const debtors = formData.debtorAgeing || NEXORA_DEBTOR_AGEING;
  const fundFlow = formData.fundFlow || NEXORA_FUND_FLOW;

  // Real-time Balance Sheet Calculations
  const shareFunds =
    (bs.equityAndLiabilities.shareCapital || 0) + (bs.equityAndLiabilities.reservesAndSurplus || 0);
  const nonCurrentLiab =
    (bs.equityAndLiabilities.longTermBorrowings || 0) +
    (bs.equityAndLiabilities.deferredTaxLiabilities || 0) +
    (bs.equityAndLiabilities.otherLongTermLiabilities || 0);
  const currentLiab =
    (bs.equityAndLiabilities.shortTermBorrowings || 0) +
    (bs.equityAndLiabilities.tradePayables || 0) +
    (bs.equityAndLiabilities.tradePayablesMsme || 0) +
    (bs.equityAndLiabilities.otherCurrentLiabilities || 0) +
    (bs.equityAndLiabilities.shortTermProvisions || 0);
  const totalEquityAndLiabilities = shareFunds + nonCurrentLiab + currentLiab;

  const netPpe =
    (bs.assets.propertyPlantEquipment || 0) - (bs.assets.accumulatedDepreciation || 0);
  const nonCurrentAssets =
    netPpe +
    (bs.assets.capitalWorkInProgress || 0) +
    (bs.assets.intangibleAssets || 0) +
    (bs.assets.nonCurrentInvestments || 0) +
    (bs.assets.longTermLoansAndAdvances || 0);
  const netReceivables =
    (bs.assets.tradeReceivables || 0) - (bs.assets.allowanceForDoubtfulDebts || 0);
  const currentAssets =
    (bs.assets.inventories || 0) +
    netReceivables +
    (bs.assets.cashAndCashEquivalents || 0) +
    (bs.assets.bankBalancesOther || 0) +
    (bs.assets.shortTermLoansAndAdvances || 0) +
    (bs.assets.otherCurrentAssets || 0);
  const totalAssets = nonCurrentAssets + currentAssets;
  const bsDifference = totalEquityAndLiabilities - totalAssets;
  const isBsBalanced = Math.abs(bsDifference) <= 10;

  // Real-time P&L Calculations
  const totalIncome = (pnl.income.revenueFromOperations || 0) + (pnl.income.otherIncome || 0);
  const totalExpenses =
    (pnl.expenses.costOfMaterialsOrDirectCosts || 0) +
    (pnl.expenses.employeeBenefitsExpense || 0) +
    (pnl.expenses.cloudAndInfrastructureCosts || 0) +
    (pnl.expenses.salesAndMarketingCosts || 0) +
    (pnl.expenses.otherExpenses || 0) +
    (pnl.expenses.financeCosts || 0) +
    (pnl.expenses.depreciationAndAmortization || 0);
  const grossProfit =
    (pnl.income.revenueFromOperations || 0) - (pnl.expenses.costOfMaterialsOrDirectCosts || 0);
  const grossMarginPct =
    pnl.income.revenueFromOperations > 0
      ? Number(((grossProfit / pnl.income.revenueFromOperations) * 100).toFixed(1))
      : 0;
  const ebitda =
    totalIncome -
    (totalExpenses -
      (pnl.expenses.depreciationAndAmortization || 0) -
      (pnl.expenses.financeCosts || 0));
  const ebitdaMarginPct =
    pnl.income.revenueFromOperations > 0
      ? Number(((ebitda / pnl.income.revenueFromOperations) * 100).toFixed(1))
      : 0;
  const pbt = ebitda - (pnl.expenses.depreciationAndAmortization || 0) - (pnl.expenses.financeCosts || 0);
  const totalTaxes = (pnl.profitability.currentTax || 0) + (pnl.profitability.deferredTax || 0);
  const pat = pbt - totalTaxes;
  const patMarginPct =
    pnl.income.revenueFromOperations > 0
      ? Number(((pat / pnl.income.revenueFromOperations) * 100).toFixed(1))
      : 0;

  // Handlers for modifying P&L
  const handlePnlIncomeChange = (field: keyof PnlStatementData["income"], val: number) => {
    const updatedIncome = { ...pnl.income, [field]: val };
    const nextTotalIncome = (updatedIncome.revenueFromOperations || 0) + (updatedIncome.otherIncome || 0);
    updatedIncome.totalIncome = nextTotalIncome;

    setFormData((prev) => ({
      ...prev,
      monthlyRevenue: updatedIncome.revenueFromOperations,
      pnlStatement: {
        ...pnl,
        income: updatedIncome,
      },
    }));
  };

  const handlePnlExpenseChange = (field: keyof PnlStatementData["expenses"], val: number) => {
    const updatedExpenses = { ...pnl.expenses, [field]: val };
    const nextTotal =
      (updatedExpenses.costOfMaterialsOrDirectCosts || 0) +
      (updatedExpenses.employeeBenefitsExpense || 0) +
      (updatedExpenses.cloudAndInfrastructureCosts || 0) +
      (updatedExpenses.salesAndMarketingCosts || 0) +
      (updatedExpenses.otherExpenses || 0) +
      (updatedExpenses.financeCosts || 0) +
      (updatedExpenses.depreciationAndAmortization || 0);
    updatedExpenses.totalExpenses = nextTotal;

    setFormData((prev) => ({
      ...prev,
      pnlStatement: {
        ...pnl,
        expenses: updatedExpenses,
      },
    }));
  };

  const handlePnlTaxChange = (field: "currentTax" | "deferredTax", val: number) => {
    const updatedProf = { ...pnl.profitability, [field]: val };
    setFormData((prev) => ({
      ...prev,
      pnlStatement: {
        ...pnl,
        profitability: updatedProf,
      },
    }));
  };

  const handleAddCustomPnlLine = () => {
    if (!newPnlParticulars.trim()) return;
    const newLine: PnlLineItem = {
      id: `pnl-line-${Date.now()}`,
      particulars: newPnlParticulars.trim(),
      noteRef: newPnlNoteRef.trim() || undefined,
      currentMonth: newPnlCurrentMonth,
      previousMonth: newPnlPreviousMonth,
      ytdCurrentYear: newPnlYtd,
      pctOfRevenue:
        pnl.income.revenueFromOperations > 0
          ? Number(((newPnlCurrentMonth / pnl.income.revenueFromOperations) * 100).toFixed(1))
          : 0,
    };

    const updatedLines = [...(pnl.lineItems || []), newLine];
    setFormData((prev) => ({
      ...prev,
      pnlStatement: {
        ...pnl,
        lineItems: updatedLines,
      },
    }));
    setShowAddPnlLine(false);
    setNewPnlParticulars("");
    setNewPnlNoteRef("");
    setNewPnlCurrentMonth(0);
    setNewPnlPreviousMonth(0);
    setNewPnlYtd(0);
  };

  const handleDeletePnlLine = (id: string) => {
    const updatedLines = (pnl.lineItems || []).filter((item) => item.id !== id);
    setFormData((prev) => ({
      ...prev,
      pnlStatement: {
        ...pnl,
        lineItems: updatedLines,
      },
    }));
  };

  const handleUpdatePnlLine = (
    id: string,
    field: "currentMonth" | "previousMonth" | "ytdCurrentYear" | "particulars",
    val: any,
  ) => {
    const updatedLines = (pnl.lineItems || []).map((item) => {
      if (item.id === id) {
        const next = { ...item, [field]: val };
        if (field === "currentMonth" && pnl.income.revenueFromOperations > 0) {
          next.pctOfRevenue = Number(((val / pnl.income.revenueFromOperations) * 100).toFixed(1));
        }
        return next;
      }
      return item;
    });

    setFormData((prev) => ({
      ...prev,
      pnlStatement: {
        ...pnl,
        lineItems: updatedLines,
      },
    }));
  };

  // Handlers for modifying Balance Sheet
  const handleBsEquityChange = (field: keyof BalanceSheetData["equityAndLiabilities"], val: number) => {
    const nextEquity = { ...bs.equityAndLiabilities, [field]: val };
    const nextShareFunds = (nextEquity.shareCapital || 0) + (nextEquity.reservesAndSurplus || 0);
    nextEquity.totalShareholdersFunds = nextShareFunds;

    const nextNonCurrent =
      (nextEquity.longTermBorrowings || 0) +
      (nextEquity.deferredTaxLiabilities || 0) +
      (nextEquity.otherLongTermLiabilities || 0);
    nextEquity.totalNonCurrentLiabilities = nextNonCurrent;

    const nextCurrent =
      (nextEquity.shortTermBorrowings || 0) +
      (nextEquity.tradePayables || 0) +
      (nextEquity.tradePayablesMsme || 0) +
      (nextEquity.otherCurrentLiabilities || 0) +
      (nextEquity.shortTermProvisions || 0);
    nextEquity.totalCurrentLiabilities = nextCurrent;

    nextEquity.totalEquityAndLiabilities = nextShareFunds + nextNonCurrent + nextCurrent;

    setFormData((prev) => ({
      ...prev,
      totalCreditors: nextEquity.tradePayables + (nextEquity.tradePayablesMsme || 0),
      creditorsOver45Days: nextEquity.tradePayablesMsme || prev.creditorsOver45Days,
      balanceSheet: {
        ...bs,
        equityAndLiabilities: nextEquity,
      },
    }));
  };

  const handleBsAssetChange = (field: keyof BalanceSheetData["assets"], val: number) => {
    const nextAssets = { ...bs.assets, [field]: val };

    const nextNetPpe = (nextAssets.propertyPlantEquipment || 0) - (nextAssets.accumulatedDepreciation || 0);
    nextAssets.netPpe = nextNetPpe;

    const nextNonCurrent =
      nextNetPpe +
      (nextAssets.capitalWorkInProgress || 0) +
      (nextAssets.intangibleAssets || 0) +
      (nextAssets.nonCurrentInvestments || 0) +
      (nextAssets.longTermLoansAndAdvances || 0);
    nextAssets.totalNonCurrentAssets = nextNonCurrent;

    const nextNetReceivables =
      (nextAssets.tradeReceivables || 0) - (nextAssets.allowanceForDoubtfulDebts || 0);
    nextAssets.netTradeReceivables = nextNetReceivables;

    const nextCurrent =
      (nextAssets.inventories || 0) +
      nextNetReceivables +
      (nextAssets.cashAndCashEquivalents || 0) +
      (nextAssets.bankBalancesOther || 0) +
      (nextAssets.shortTermLoansAndAdvances || 0) +
      (nextAssets.otherCurrentAssets || 0);
    nextAssets.totalCurrentAssets = nextCurrent;

    nextAssets.totalAssets = nextNonCurrent + nextCurrent;

    setFormData((prev) => ({
      ...prev,
      cashAndBankBalance: nextAssets.cashAndCashEquivalents + (nextAssets.bankBalancesOther || 0),
      totalDebtors: nextAssets.tradeReceivables,
      balanceSheet: {
        ...bs,
        assets: nextAssets,
      },
    }));
  };

  // Auto-Balance into Reserves & Surplus
  const handleAutoBalance = () => {
    const diff = totalAssets - (totalEquityAndLiabilities - (bs.equityAndLiabilities.reservesAndSurplus || 0));
    handleBsEquityChange("reservesAndSurplus", diff);
  };

  // Handlers for Debtors
  const handleAddDebtor = () => {
    if (!newDebtorName.trim() || newDebtorTotal <= 0) return;
    const newRecord: DebtorRecord = {
      id: `deb-${Date.now()}`,
      customerName: newDebtorName.trim(),
      creditPeriodDays: newDebtorTerms,
      totalOutstanding: newDebtorTotal,
      bucket0to30: newDebtorTotal,
      bucket31to60: 0,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: new Date().toISOString().split("T")[0],
      dsoDays: newDebtorTerms,
      riskRating: newDebtorRisk,
      status: newDebtorStatus,
      followUpNotes: newDebtorNotes.trim() || "Added by CFO workstation",
      assignedManager: clientProfile.cfoName || "Finance Team",
    };

    const updatedDebtors = [newRecord, ...(debtors.topDebtors || [])];
    const newTotalReceivables = updatedDebtors.reduce((acc, d) => acc + d.totalOutstanding, 0);

    setFormData((prev) => ({
      ...prev,
      totalDebtors: newTotalReceivables,
      debtorAgeing: {
        ...debtors,
        totalReceivables: newTotalReceivables,
        topDebtors: updatedDebtors,
      },
    }));

    setShowAddDebtor(false);
    setNewDebtorName("");
    setNewDebtorTerms(30);
    setNewDebtorTotal(0);
    setNewDebtorNotes("");
  };

  const handleDeleteDebtor = (id: string) => {
    const updatedDebtors = (debtors.topDebtors || []).filter((d) => d.id !== id);
    const newTotal = updatedDebtors.reduce((acc, d) => acc + d.totalOutstanding, 0);
    setFormData((prev) => ({
      ...prev,
      totalDebtors: newTotal,
      debtorAgeing: {
        ...debtors,
        totalReceivables: newTotal,
        topDebtors: updatedDebtors,
      },
    }));
  };

  const handleUpdateDebtorField = (id: string, field: keyof DebtorRecord, val: any) => {
    const updatedDebtors = (debtors.topDebtors || []).map((d) => {
      if (d.id === id) {
        return { ...d, [field]: val };
      }
      return d;
    });
    const newTotal = updatedDebtors.reduce((acc, d) => acc + d.totalOutstanding, 0);
    setFormData((prev) => ({
      ...prev,
      totalDebtors: newTotal,
      debtorAgeing: {
        ...debtors,
        totalReceivables: newTotal,
        topDebtors: updatedDebtors,
      },
    }));
  };

  // Statement-Level Resets
  const handleResetPnlToZero = () => {
    const zeroedIncome = {
      revenueFromOperations: 0,
      otherIncome: 0,
      totalIncome: 0,
    };
    const zeroedExpenses = {
      costOfMaterialsOrDirectCosts: 0,
      employeeBenefitsExpense: 0,
      cloudAndInfrastructureCosts: 0,
      salesAndMarketingCosts: 0,
      otherExpenses: 0,
      financeCosts: 0,
      depreciationAndAmortization: 0,
      totalExpenses: 0,
    };
    const zeroedProf = {
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
    };
    setFormData((prev) => ({
      ...prev,
      monthlyRevenue: 0,
      ebitda: 0,
      ebitdaMarginPercent: 0,
      netProfit: 0,
      grossMarginPercent: 0,
      pnlStatement: {
        ...pnl,
        income: zeroedIncome,
        expenses: zeroedExpenses,
        profitability: zeroedProf,
        lineItems: [],
      },
    }));
    setSaveSuccessMsg("P&L statement reset to zero in form. Click 'Save Modifications' to apply.");
  };

  const handleResetBsToZero = () => {
    const zeroedEquity: BalanceSheetData["equityAndLiabilities"] = {
      shareCapital: 0,
      reservesAndSurplus: 0,
      totalShareholdersFunds: 0,
      longTermBorrowings: 0,
      deferredTaxLiabilities: 0,
      otherLongTermLiabilities: 0,
      totalNonCurrentLiabilities: 0,
      shortTermBorrowings: 0,
      tradePayables: 0,
      tradePayablesMsme: 0,
      otherCurrentLiabilities: 0,
      shortTermProvisions: 0,
      totalCurrentLiabilities: 0,
      totalEquityAndLiabilities: 0,
    };
    const zeroedAssets: BalanceSheetData["assets"] = {
      propertyPlantEquipment: 0,
      accumulatedDepreciation: 0,
      netPpe: 0,
      capitalWorkInProgress: 0,
      intangibleAssets: 0,
      nonCurrentInvestments: 0,
      longTermLoansAndAdvances: 0,
      totalNonCurrentAssets: 0,
      inventories: 0,
      tradeReceivables: 0,
      allowanceForDoubtfulDebts: 0,
      netTradeReceivables: 0,
      cashAndCashEquivalents: 0,
      bankBalancesOther: 0,
      shortTermLoansAndAdvances: 0,
      otherCurrentAssets: 0,
      totalCurrentAssets: 0,
      totalAssets: 0,
    };

    setFormData((prev) => ({
      ...prev,
      totalCreditors: 0,
      creditorsOver45Days: 0,
      workingCapital: 0,
      balanceSheet: {
        ...bs,
        equityAndLiabilities: zeroedEquity,
        assets: zeroedAssets,
      },
    }));
    setSaveSuccessMsg("Balance Sheet reset to zero in form. Click 'Save Modifications' to apply.");
  };

  const handleClearAllDebtors = () => {
    setFormData((prev) => ({
      ...prev,
      totalDebtors: 0,
      debtorsOver90Days: 0,
      debtorAgeing: {
        ...debtors,
        totalReceivables: 0,
        daysSalesOutstanding: 0,
        overduePercentage: 0,
        provisionForBadDebts: 0,
        topDebtors: [],
        buckets: {
          days0to30: { amount: 0, percentage: 0, count: 0 },
          days31to60: { amount: 0, percentage: 0, count: 0 },
          days61to90: { amount: 0, percentage: 0, count: 0 },
          days91to180: { amount: 0, percentage: 0, count: 0 },
          daysAbove180: { amount: 0, percentage: 0, count: 0 },
        },
      },
    }));
    setSaveSuccessMsg("Customer debtors cleared in form. Click 'Save Modifications' to apply.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare complete consolidated payload
    const finalPayload: Partial<FinancialMIS> = {
      ...formData,
      monthlyRevenue: pnl.income.revenueFromOperations || formData.monthlyRevenue,
      grossMarginPercent: grossMarginPct || formData.grossMarginPercent,
      ebitda: ebitda || formData.ebitda,
      ebitdaMarginPercent: ebitdaMarginPct || formData.ebitdaMarginPercent,
      netProfit: pat || formData.netProfit,
      totalDebtors: debtors.totalReceivables || formData.totalDebtors,
      cashAndBankBalance:
        (bs.assets.cashAndCashEquivalents || 0) + (bs.assets.bankBalancesOther || 0) ||
        formData.cashAndBankBalance,
      totalCreditors:
        (bs.equityAndLiabilities.tradePayables || 0) +
          (bs.equityAndLiabilities.tradePayablesMsme || 0) || formData.totalCreditors,
      workingCapital: currentAssets - currentLiab,
      pnlStatement: {
        ...pnl,
        income: {
          ...pnl.income,
          totalIncome,
        },
        expenses: {
          ...pnl.expenses,
          totalExpenses,
        },
        profitability: {
          ...pnl.profitability,
          grossProfit,
          grossMarginPercent: grossMarginPct,
          ebitda,
          ebitdaMarginPercent,
          pbt,
          pbtMarginPercent:
            pnl.income.revenueFromOperations > 0
              ? Number(((pbt / pnl.income.revenueFromOperations) * 100).toFixed(1))
              : 0,
          pat,
          patMarginPercent,
        },
      },
      balanceSheet: {
        ...bs,
        equityAndLiabilities: {
          ...bs.equityAndLiabilities,
          totalShareholdersFunds: shareFunds,
          totalNonCurrentLiabilities: nonCurrentLiab,
          totalCurrentLiabilities: currentLiab,
          totalEquityAndLiabilities,
        },
        assets: {
          ...bs.assets,
          netPpe,
          totalNonCurrentAssets: nonCurrentAssets,
          netTradeReceivables: netReceivables,
          totalCurrentAssets: currentAssets,
          totalAssets,
        },
      },
      debtorAgeing: {
        ...debtors,
      },
      fundFlow: {
        ...fundFlow,
      },
    };

    onSave(finalPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Financial MIS &amp; Statements Workstation
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                  CFO Full CRUD &amp; Override
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {clientProfile.companyName} · {formData.period || "Current MIS"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher - Horizontal Scroll on small screens */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("kpis")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "kpis"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              1. Performance KPIs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pnl")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "pnl"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              2. Profit &amp; Loss (P&amp;L)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "bs"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              3. Balance Sheet
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("debtors")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "debtors"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              4. Customer Debtors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fundflow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "fundflow"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              5. Fund Flow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("commentary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "commentary"
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              6. CFO Commentary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("data-management")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "data-management"
                  ? "bg-rose-700 text-white shadow-2xs font-bold"
                  : "text-rose-700 hover:bg-rose-100/70"
              }`}
            >
              7. Delete / Override
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenUploadModal();
            }}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-md hover:bg-indigo-50 border border-indigo-200 whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Override via Fresh Excel</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Core Performance KPIs & Treasury */}
          {activeTab === "kpis" && (
            <div className="space-y-5 animate-in fade-in duration-150 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Reporting MIS Period
                  </label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="e.g. September 2026 (Month-End MIS)"
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white w-64 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="text-[11px] text-slate-500 max-w-sm">
                  Updating figures here immediately reflects across the Executive Summary, Financial
                  Ratio analysis, and client dashboard metrics.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Monthly Gross Revenue (₹)</label>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">
                      {formatCrores(formData.monthlyRevenue)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={formData.monthlyRevenue}
                    onChange={(e) => {
                      const rev = Number(e.target.value);
                      const ebitda = formData.ebitda || 0;
                      const margin = rev > 0 ? Number(((ebitda / rev) * 100).toFixed(1)) : 0;
                      setFormData({
                        ...formData,
                        monthlyRevenue: rev,
                        ebitdaMarginPercent: margin,
                        pnlStatement: {
                          ...pnl,
                          income: { ...pnl.income, revenueFromOperations: rev },
                        },
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Total revenue from operations</p>
                </div>

                {/* MoM Growth */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Revenue Growth MoM (%)</label>
                    <span
                      className={`text-[10px] font-bold ${
                        formData.revenueGrowthMoM >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formData.revenueGrowthMoM >= 0 ? "+" : ""}
                      {formData.revenueGrowthMoM}%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.revenueGrowthMoM}
                    onChange={(e) =>
                      setFormData({ ...formData, revenueGrowthMoM: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Month-over-month growth rate</p>
                </div>

                {/* Gross Margin */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Gross Margin (%)</label>
                    <span className="text-[10px] font-bold text-slate-600">
                      {formData.grossMarginPercent}%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grossMarginPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, grossMarginPercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">(Revenue - Direct Cost) / Revenue</p>
                </div>

                {/* EBITDA */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Operating EBITDA (₹)</label>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">
                      {formatLakhs(formData.ebitda)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={formData.ebitda}
                    onChange={(e) => {
                      const eb = Number(e.target.value);
                      const rev = formData.monthlyRevenue || 1;
                      const margin = Number(((eb / rev) * 100).toFixed(1));
                      setFormData({
                        ...formData,
                        ebitda: eb,
                        ebitdaMarginPercent: margin,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Margin: {formData.ebitdaMarginPercent}%</p>
                </div>

                {/* Net Profit */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Net Profit / PAT (₹)</label>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">
                      {formatLakhs(formData.netProfit)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={formData.netProfit}
                    onChange={(e) =>
                      setFormData({ ...formData, netProfit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Bottom-line profit after taxes</p>
                </div>

                {/* Cash in Bank */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Cash &amp; Bank Treasury (₹)</label>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">
                      {formatCrores(formData.cashAndBankBalance)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={formData.cashAndBankBalance}
                    onChange={(e) => {
                      const cash = Number(e.target.value);
                      const burn = formData.monthlyBurnRate || 0;
                      const runway = burn > 0 ? Number((cash / burn).toFixed(1)) : 0;
                      setFormData({
                        ...formData,
                        cashAndBankBalance: cash,
                        cashRunwayMonths: runway,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Bank accounts + fixed deposits</p>
                </div>

                {/* Monthly Burn Rate */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Monthly Cash Burn (₹)</label>
                    <span className="text-[10px] text-rose-600 font-mono font-bold">
                      {formatLakhs(formData.monthlyBurnRate)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={formData.monthlyBurnRate}
                    onChange={(e) => {
                      const burn = Number(e.target.value);
                      const cash = formData.cashAndBankBalance || 0;
                      const runway = burn > 0 ? Number((cash / burn).toFixed(1)) : 0;
                      setFormData({
                        ...formData,
                        monthlyBurnRate: burn,
                        cashRunwayMonths: runway,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Net operating cash outflow / month</p>
                </div>

                {/* Cash Runway */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Cash Runway (Months)</label>
                    <span className="text-[10px] font-bold text-indigo-700">
                      {formData.cashRunwayMonths}m
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.cashRunwayMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, cashRunwayMonths: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Calculated: Cash ÷ Monthly Burn Rate</p>
                </div>

                {/* Quick Ratio */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Quick Liquidity Ratio (x)</label>
                    <span className="text-[10px] font-bold text-slate-600">
                      {formData.quickRatio}x
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quickRatio}
                    onChange={(e) =>
                      setFormData({ ...formData, quickRatio: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">Liquid assets / Current liabilities</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Profit & Loss Statement (P&L) */}
          {activeTab === "pnl" && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Profit &amp; Loss Statement Account Heads
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Direct control over revenue, cost heads, depreciation, finance charges and line items.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPnlToZero}
                    className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset P&amp;L to Zero</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPnlLine(true)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>
              </div>

              {/* Core P&L Heads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section A: Income */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-emerald-950 uppercase tracking-wide text-[10px] block">
                    I. Income Heads
                  </span>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-slate-700">Revenue from Operations (₹)</label>
                        <span className="font-mono text-emerald-700 font-bold">
                          {formatINR(pnl.income.revenueFromOperations)}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={pnl.income.revenueFromOperations}
                        onChange={(e) =>
                          handlePnlIncomeChange("revenueFromOperations", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-slate-700">Other Operating &amp; Non-Op Income (₹)</label>
                        <span className="font-mono text-emerald-700 font-bold">
                          {formatINR(pnl.income.otherIncome)}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={pnl.income.otherIncome}
                        onChange={(e) =>
                          handlePnlIncomeChange("otherIncome", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                      <span>Total Income (A)</span>
                      <span className="font-mono">{formatINR(totalIncome)}</span>
                    </div>
                  </div>
                </div>

                {/* Section B: Operating & Direct Expenses */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">
                    II. Cost &amp; Expense Heads
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Materials / Direct COGS (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.costOfMaterialsOrDirectCosts}
                        onChange={(e) =>
                          handlePnlExpenseChange(
                            "costOfMaterialsOrDirectCosts",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Employee Benefits / Payroll (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.employeeBenefitsExpense}
                        onChange={(e) =>
                          handlePnlExpenseChange("employeeBenefitsExpense", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Cloud / IT Hosting Costs (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.cloudAndInfrastructureCosts || 0}
                        onChange={(e) =>
                          handlePnlExpenseChange(
                            "cloudAndInfrastructureCosts",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Sales &amp; Marketing (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.salesAndMarketingCosts || 0}
                        onChange={(e) =>
                          handlePnlExpenseChange("salesAndMarketingCosts", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Other Admin &amp; Rent (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.otherExpenses}
                        onChange={(e) =>
                          handlePnlExpenseChange("otherExpenses", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Depreciation &amp; Amortization (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.depreciationAndAmortization}
                        onChange={(e) =>
                          handlePnlExpenseChange(
                            "depreciationAndAmortization",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Finance Costs &amp; Loan Interest (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.expenses.financeCosts}
                        onChange={(e) =>
                          handlePnlExpenseChange("financeCosts", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Current Tax Provision (₹)
                      </label>
                      <input
                        type="number"
                        value={pnl.profitability.currentTax || 0}
                        onChange={(e) => handlePnlTaxChange("currentTax", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Total Expenses (B)</span>
                    <span className="font-mono">{formatINR(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Calculated Margins Bar */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-around flex-wrap gap-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Gross Profit
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatINR(grossProfit)} ({grossMarginPct}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Operating EBITDA
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatINR(ebitda)} ({ebitdaMarginPct}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Profit Before Tax (PBT)
                  </span>
                  <span className="font-mono font-bold text-sm text-sky-400">{formatINR(pbt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Net Profit / PAT
                  </span>
                  <span className="font-mono font-bold text-sm text-indigo-300">
                    {formatINR(pat)} ({patMarginPct}%)
                  </span>
                </div>
              </div>

              {/* Add Custom P&L Line Drawer */}
              {showAddPnlLine && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                    <span>Add New P&amp;L Line Item</span>
                    <button
                      type="button"
                      onClick={() => setShowAddPnlLine(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Account Particulars Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Inward Freight &amp; Forwarding"
                        value={newPnlParticulars}
                        onChange={(e) => setNewPnlParticulars(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Current Month (₹)
                      </label>
                      <input
                        type="number"
                        value={newPnlCurrentMonth}
                        onChange={(e) => setNewPnlCurrentMonth(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        YTD Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={newPnlYtd}
                        onChange={(e) => setNewPnlYtd(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPnlLine(false)}
                      className="px-3 py-1 rounded-md text-slate-600 hover:bg-slate-200 cursor-pointer font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomPnlLine}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      Insert Line Item
                    </button>
                  </div>
                </div>
              )}

              {/* Detailed P&L Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Detailed Statement Line Items</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {pnl.lineItems?.length || 0} active line items
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Particulars</th>
                        <th className="px-3 py-2 text-right">Current Month (₹)</th>
                        <th className="px-3 py-2 text-right">Previous Month (₹)</th>
                        <th className="px-3 py-2 text-right">YTD (₹)</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(pnl.lineItems || []).map((li) => (
                        <tr key={li.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-1.5 max-w-[220px]">
                            <input
                              type="text"
                              value={li.particulars}
                              onChange={(e) =>
                                handleUpdatePnlLine(li.id, "particulars", e.target.value)
                              }
                              className="w-full px-1.5 py-0.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded text-xs font-medium"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            <input
                              type="number"
                              value={li.currentMonth}
                              onChange={(e) =>
                                handleUpdatePnlLine(li.id, "currentMonth", Number(e.target.value))
                              }
                              className="w-24 px-1.5 py-0.5 border border-slate-200 rounded text-right text-xs font-mono"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            <input
                              type="number"
                              value={li.previousMonth}
                              onChange={(e) =>
                                handleUpdatePnlLine(li.id, "previousMonth", Number(e.target.value))
                              }
                              className="w-24 px-1.5 py-0.5 border border-slate-200 rounded text-right text-xs font-mono"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            <input
                              type="number"
                              value={li.ytdCurrentYear}
                              onChange={(e) =>
                                handleUpdatePnlLine(li.id, "ytdCurrentYear", Number(e.target.value))
                              }
                              className="w-28 px-1.5 py-0.5 border border-slate-200 rounded text-right text-xs font-mono"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePnlLine(li.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete this line item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Detailed Balance Sheet */}
          {activeTab === "bs" && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Detailed Balance Sheet Schedule
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Direct control over Equity, Liabilities, PPE, Trade Receivables, and Treasury Assets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBsToZero}
                    className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Balance Sheet to Zero</span>
                  </button>
                  {!isBsBalanced && (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Balance into Reserves</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tally Verification Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
                  isBsBalanced
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isBsBalanced ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-bold">
                    {isBsBalanced
                      ? `Balance Sheet Tallied: Total Assets ₹${formatINR(totalAssets)} = Total Equity & Liabilities ₹${formatINR(totalEquityAndLiabilities)}`
                      : `Out of Balance by ₹${formatINR(Math.abs(bsDifference))}. Assets: ₹${formatINR(totalAssets)} vs Liab: ₹${formatINR(totalEquityAndLiabilities)}`}
                  </span>
                </div>
                {!isBsBalanced && (
                  <span className="text-[11px] font-semibold text-rose-700">
                    Tip: Click "Auto-Balance into Reserves" above to reconcile automatically.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Equity & Liabilities */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
                      Equity &amp; Liabilities
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(totalEquityAndLiabilities)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="font-semibold text-indigo-900 text-[11px] block">
                      1. Shareholders' Funds
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Share Capital (₹)</label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.shareCapital}
                          onChange={(e) =>
                            handleBsEquityChange("shareCapital", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Reserves &amp; Surplus (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.reservesAndSurplus}
                          onChange={(e) =>
                            handleBsEquityChange("reservesAndSurplus", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <span className="font-semibold text-indigo-900 text-[11px] block pt-1">
                      2. Non-Current Liabilities
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Long-Term Borrowings (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.longTermBorrowings}
                          onChange={(e) =>
                            handleBsEquityChange("longTermBorrowings", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Deferred Tax Liab (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.deferredTaxLiabilities}
                          onChange={(e) =>
                            handleBsEquityChange("deferredTaxLiabilities", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <span className="font-semibold text-indigo-900 text-[11px] block pt-1">
                      3. Current Liabilities &amp; Payables
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Short-Term Borrowings / CC (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.shortTermBorrowings}
                          onChange={(e) =>
                            handleBsEquityChange("shortTermBorrowings", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Trade Payables Regular (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.tradePayables}
                          onChange={(e) =>
                            handleBsEquityChange("tradePayables", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-amber-900 font-bold mb-0.5">
                          MSME Payables Sec 43B(h) (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.tradePayablesMsme}
                          onChange={(e) =>
                            handleBsEquityChange("tradePayablesMsme", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Short-Term Provisions (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.equityAndLiabilities.shortTermProvisions}
                          onChange={(e) =>
                            handleBsEquityChange("shortTermProvisions", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Assets */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
                      Assets (Non-Current &amp; Current)
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(totalAssets)}</span>
                  </div>

                  <div className="space-y-3">
                    <span className="font-semibold text-emerald-900 text-[11px] block">
                      1. Non-Current Assets &amp; PPE
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Gross Fixed Assets / PPE (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.propertyPlantEquipment}
                          onChange={(e) =>
                            handleBsAssetChange("propertyPlantEquipment", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Accumulated Depreciation (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.accumulatedDepreciation}
                          onChange={(e) =>
                            handleBsAssetChange("accumulatedDepreciation", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Capital WIP / AI Lab (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.capitalWorkInProgress}
                          onChange={(e) =>
                            handleBsAssetChange("capitalWorkInProgress", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Intangible Assets (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.intangibleAssets}
                          onChange={(e) =>
                            handleBsAssetChange("intangibleAssets", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <span className="font-semibold text-emerald-900 text-[11px] block pt-1">
                      2. Current Assets &amp; Treasury
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Inventories / Stock (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.inventories}
                          onChange={(e) =>
                            handleBsAssetChange("inventories", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Trade Receivables / Debtors (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.tradeReceivables}
                          onChange={(e) =>
                            handleBsAssetChange("tradeReceivables", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Cash &amp; Bank Balances (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.cashAndCashEquivalents}
                          onChange={(e) =>
                            handleBsAssetChange("cashAndCashEquivalents", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">
                          Other Bank Balances / FD (₹)
                        </label>
                        <input
                          type="number"
                          value={bs.assets.bankBalancesOther}
                          onChange={(e) =>
                            handleBsAssetChange("bankBalancesOther", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Customer Debtors & Receivables Ageing */}
          {activeTab === "debtors" && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Customer-Wise Receivables &amp; Ageing Schedule
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Add, edit amounts, update risk ratings, or delete debtor accounts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllDebtors}
                    className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All Debtors</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDebtor(true)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Customer Debtor</span>
                  </button>
                </div>
              </div>

              {/* Debtors Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Total Outstanding Receivables</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatINR(debtors.totalReceivables)}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">DSO (Days Sales Outstanding)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={debtors.daysSalesOutstanding}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          debtorDaysDSO: Number(e.target.value),
                          debtorAgeing: {
                            ...debtors,
                            daysSalesOutstanding: Number(e.target.value),
                          },
                        })
                      }
                      className="w-20 px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-xs"
                    />
                    <span className="text-slate-400">Days</span>
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Bad Debts Provision (₹)</span>
                  <input
                    type="number"
                    value={debtors.provisionForBadDebts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        debtorAgeing: {
                          ...debtors,
                          provisionForBadDebts: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-xs mt-0.5"
                  />
                </div>
              </div>

              {/* Add Debtor Drawer */}
              {showAddDebtor && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                    <span>Add New Customer Debtor Record</span>
                    <button
                      type="button"
                      onClick={() => setShowAddDebtor(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Customer Entity Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Infosys Ltd (Digital Services)"
                        value={newDebtorName}
                        onChange={(e) => setNewDebtorName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Total Outstanding (₹)
                      </label>
                      <input
                        type="number"
                        value={newDebtorTotal}
                        onChange={(e) => setNewDebtorTotal(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Credit Terms (Days)
                      </label>
                      <input
                        type="number"
                        value={newDebtorTerms}
                        onChange={(e) => setNewDebtorTerms(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Risk Rating
                      </label>
                      <select
                        value={newDebtorRisk}
                        onChange={(e) => setNewDebtorRisk(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Recovery &amp; Follow-up Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cleared by audit; payout scheduled 15th Oct"
                        value={newDebtorNotes}
                        onChange={(e) => setNewDebtorNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddDebtor(false)}
                      className="px-3 py-1 rounded-md text-slate-600 hover:bg-slate-200 cursor-pointer font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDebtor}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      Insert Debtor Account
                    </button>
                  </div>
                </div>
              )}

              {/* Debtors List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Customer Account</th>
                        <th className="px-3 py-2 text-right">Total Balance (₹)</th>
                        <th className="px-3 py-2 text-center">DSO</th>
                        <th className="px-3 py-2 text-center">Risk</th>
                        <th className="px-3 py-2">Recovery Notes</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(debtors.topDebtors || []).map((deb) => (
                        <tr key={deb.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-1.5 font-medium text-slate-900 max-w-[200px] truncate">
                            <input
                              type="text"
                              value={deb.customerName}
                              onChange={(e) =>
                                handleUpdateDebtorField(deb.id, "customerName", e.target.value)
                              }
                              className="w-full px-1.5 py-0.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded text-xs"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            <input
                              type="number"
                              value={deb.totalOutstanding}
                              onChange={(e) =>
                                handleUpdateDebtorField(
                                  deb.id,
                                  "totalOutstanding",
                                  Number(e.target.value),
                                )
                              }
                              className="w-28 px-1.5 py-0.5 border border-slate-200 rounded text-right text-xs font-mono font-bold text-indigo-700"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center font-mono">
                            <input
                              type="number"
                              value={deb.dsoDays}
                              onChange={(e) =>
                                handleUpdateDebtorField(deb.id, "dsoDays", Number(e.target.value))
                              }
                              className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-mono"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <select
                              value={deb.riskRating}
                              onChange={(e) =>
                                handleUpdateDebtorField(deb.id, "riskRating", e.target.value)
                              }
                              className="px-1.5 py-0.5 border border-slate-200 rounded text-[10px]"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={deb.followUpNotes || ""}
                              onChange={(e) =>
                                handleUpdateDebtorField(deb.id, "followUpNotes", e.target.value)
                              }
                              className="w-full px-1.5 py-0.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded text-[11px] text-slate-600"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteDebtor(deb.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete debtor account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Fund Flow Statement */}
          {activeTab === "fundflow" && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Fund Flow &amp; Treasury Movement</h3>
                  <p className="text-slate-500 text-[11px]">
                    Track sources and applications of corporate working capital.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sources */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-emerald-800 uppercase tracking-wide text-[10px] block">
                    Sources of Funds (Inflows)
                  </span>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        Funds from Operations (₹)
                      </label>
                      <input
                        type="number"
                        value={fundFlow.sources?.fundsFromOperations || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fundFlow: {
                              ...fundFlow,
                              sources: {
                                ...fundFlow.sources,
                                fundsFromOperations: Number(e.target.value),
                                totalSources:
                                  Number(e.target.value) +
                                  (fundFlow.sources?.issueOfShareCapital || 0) +
                                  (fundFlow.sources?.longTermBorrowingsRaised || 0),
                              },
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        Long-Term Borrowings Raised (₹)
                      </label>
                      <input
                        type="number"
                        value={fundFlow.sources?.longTermBorrowingsRaised || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fundFlow: {
                              ...fundFlow,
                              sources: {
                                ...fundFlow.sources,
                                longTermBorrowingsRaised: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Applications */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-rose-800 uppercase tracking-wide text-[10px] block">
                    Applications of Funds (Capex &amp; Outflows)
                  </span>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        Purchase of Fixed Assets / Capex (₹)
                      </label>
                      <input
                        type="number"
                        value={fundFlow.applications?.purchaseOfFixedAssets || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fundFlow: {
                              ...fundFlow,
                              applications: {
                                ...fundFlow.applications,
                                purchaseOfFixedAssets: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        Repayment of Borrowings (₹)
                      </label>
                      <input
                        type="number"
                        value={fundFlow.applications?.repaymentOfLongTermBorrowings || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fundFlow: {
                              ...fundFlow,
                              applications: {
                                ...fundFlow.applications,
                                repaymentOfLongTermBorrowings: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CFO Strategic Commentary */}
          {activeTab === "commentary" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Virtual CFO Executive Summary &amp; Strategic Observations
                </label>
                <textarea
                  rows={4}
                  value={formData.cfoExecutiveSummary || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cfoExecutiveSummary: e.target.value })
                  }
                  placeholder="Summarise month-end financial highlights, margin drivers, tax obligations, and working capital strategy for the management and board..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Priority Alerts / Directives for Management
                </label>
                <div className="space-y-2">
                  {(formData.cfoKeyAlerts || []).map((alert, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={alert}
                        onChange={(e) => {
                          const updated = [...(formData.cfoKeyAlerts || [])];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, cfoKeyAlerts: updated });
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.cfoKeyAlerts || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, cfoKeyAlerts: updated });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        cfoKeyAlerts: [...(formData.cfoKeyAlerts || []), "New priority CFO action directive"],
                      });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer pt-1"
                  >
                    + Add Strategic Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Data Management, Delete & Override */}
          {activeTab === "data-management" && (
            <div className="space-y-5 animate-in fade-in duration-150 text-xs">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-indigo-950 text-sm">
                    Clean Replacement / Fresh Excel Upload Override
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Upload a fresh ERP Excel sheet to completely supersede existing financial data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Launch Fresh Excel Upload</span>
                </button>
              </div>

              {/* Statement-Specific Reset Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-800">Profit &amp; Loss Statement</h5>
                  <p className="text-[10px] text-slate-500">
                    Clears all revenue, direct costs, overheads, and P&amp;L line items to zero.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPnlToZero}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Reset P&amp;L to Blank
                  </button>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-800">Balance Sheet</h5>
                  <p className="text-[10px] text-slate-500">
                    Clears all equity, borrowings, creditors, PPE, and assets to zero.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetBsToZero}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Reset Balance Sheet to Blank
                  </button>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                  <h5 className="font-bold text-slate-800">Customer Debtors</h5>
                  <p className="text-[10px] text-slate-500">
                    Removes all individual customer records and empties overdue buckets.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAllDebtors}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Clear All Debtors
                  </button>
                </div>
              </div>

              {/* Permanent Full Company Data Purge */}
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Purge: Delete Entire Company Financial MIS</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  This action permanently deletes all upload history in Supabase, resets the P&amp;L,
                  Balance Sheet, and Debtors for <strong>{clientProfile.companyName}</strong> to zero.
                  You can immediately upload a fresh Excel file afterwards.
                </p>

                {showDeleteConfirm ? (
                  <div className="space-y-3 pt-2 border-t border-rose-200">
                    <p className="text-xs text-rose-900 font-semibold">
                      Type <strong>DELETE</strong> below to confirm:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="px-3 py-1.5 border border-rose-400 rounded-lg text-xs font-bold uppercase w-48 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        disabled={confirmText.trim() !== "DELETE"}
                        onClick={() => {
                          onDeleteCompanyMIS();
                          onClose();
                        }}
                        className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                          confirmText.trim() === "DELETE"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-rose-300 cursor-not-allowed"
                        }`}
                      >
                        Confirm &amp; Delete All Data
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setConfirmText("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Financial MIS Data</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="text-[11px] text-slate-400">
              Editing: <span className="text-slate-700 font-semibold">{clientProfile.companyName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Modifications</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
