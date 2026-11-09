import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { useApp } from "../../context/AppContext";
import { formatINR, formatLakhs, formatCrores } from "../../utils/format";
import { FinancialMIS, MisSubTab, MonthlyExecutiveReport } from "../../types";
import { BalanceSheetView } from "./BalanceSheetView";
import { PnlAccountView } from "./PnlAccountView";
import { DebtorAgeingView } from "./DebtorAgeingView";
import { CashFlowDashboardView } from "./CashFlowDashboardView";
import { ExcelUploadMisModal } from "./ExcelUploadMisModal";
import { ModifyFinancialMisModal, ModifyMisTabKey } from "./ModifyFinancialMisModal";
import { ApproveAndDispatchMisModal } from "../modals/ApproveAndDispatchMisModal";
import { MonthlyMisDispatchLogModal } from "../modals/MonthlyMisDispatchLogModal";
import {
  downloadStandardMisExcelTemplate,
  parseStandardMisExcel,
  cleanNumber,
} from "../../utils/misExcelTemplateHelper";
import {
  NEXORA_BALANCE_SHEET,
  NEXORA_PNL_STATEMENT,
  NEXORA_DEBTOR_AGEING,
  NEXORA_FUND_FLOW,
  COMPANY_MIS_DETAILED,
} from "../../data/mockMisFinancials";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  ChevronRight,
  Edit3,
  Save,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  FileCheck,
  Check,
  X,
  Sparkles,
  Info,
  Scale,
  ArrowRightLeft,
  ArrowRight,
  Users,
  LayoutDashboard,
  Calculator,
  PieChart,
  MessageCircle,
  Layers,
  Mail,
  History,
  Eye,
  Trash2,
} from "lucide-react";

interface ParsedMetricRow {
  code: string;
  name: string;
  currentValue: string | number;
  newValue: string | number;
  isChanged: boolean;
  unit: string;
}

export const FinancialMisTab: React.FC = () => {
  const {
    financialMIS,
    updateFinancialMIS,
    clearFinancialMisDummyData,
    loadSampleFinancialMisData,
    deleteMisUpload,
    deleteCompanyFinancialMIS,
    overrideFinancialMIS,
    role,
    clientProfile,
    showToast,
    misSubTab,
    setMisSubTab,
    misRemarks,
    compliances,
    threeMonthCashBudget,
    currentUser,
    effectivePermissions,
    misUploads,
    reviewMisUpload,
    budgetItems,
    executiveReports,
    saveExecutiveReport,
  } = useApp();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchLogModalOpen, setIsDispatchLogModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [modifyModalInitialTab, setModifyModalInitialTab] = useState<ModifyMisTabKey>("kpis");

  const handleOpenModifyModal = (tab: ModifyMisTabKey = "kpis") => {
    setModifyModalInitialTab(tab);
    setIsModifyModalOpen(true);
  };

  const companyReports = (executiveReports && executiveReports[clientProfile.id]) || [];
  const currentMonthKey = "2026-09";
  const activeReport: MonthlyExecutiveReport = companyReports.find(
    (r) => r.monthKey === currentMonthKey,
  ) ||
    companyReports[0] || {
      id: `rep-${clientProfile.id}-${currentMonthKey}`,
      companyId: clientProfile.id,
      month: financialMIS.period || "September 2026",
      monthKey: currentMonthKey,
      title: `Monthly Financial MIS — ${financialMIS.period || "September 2026"}`,
      summaryPoints: [
        `Net Revenue of ₹1.45 Cr achieved in line with operating plan.`,
        `Operating EBITDA margin maintained at 18.4% reflecting healthy cost discipline.`,
        `Liquid cash and treasury reserves stand at ₹28.5L (~4.2 months operational runway).`,
        `Total trade receivables at ₹42.8L with continuous recovery focus on >60-day accounts.`,
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

  const companyMisUploads = useMemo(
    () => misUploads.filter((u) => u.companyId === clientProfile.id),
    [misUploads, clientProfile.id],
  );
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const canEditMis = role === "cfo" || effectivePermissions.mis.canEdit;
  const canUploadMisExcel = role === "cfo" || effectivePermissions.mis.canUploadExcel;

  const activeSubTab = misSubTab === "overview" ? "balance-sheet" : misSubTab;
  const setActiveSubTab = setMisSubTab;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FinancialMIS>(financialMIS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
  const activeCashBudget = threeMonthCashBudget;

  // Excel upload & template manager states
  const [isExcelPanelOpen, setIsExcelPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMetricRow[] | null>(null);
  const [stagedMIS, setStagedMIS] = useState<Partial<FinancialMIS> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form submit for direct edits
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateFinancialMIS(formData);
    setIsEditing(false);
  };

  // Fixed template definitions
  const TEMPLATE_SCHEMA = [
    {
      "Metric Code": "PERIOD",
      "Metric Name": "Reporting MIS Period",
      Value: "September 2026 (Month-End MIS)",
      Unit: "Text",
      Guidance: "Format: Month YYYY (e.g., September 2026)",
    },
    {
      "Metric Code": "REVENUE",
      "Metric Name": "Gross Monthly Revenue (INR)",
      Value: 5450000,
      Unit: "INR (₹)",
      Guidance: "Gross revenue from operations during the month",
    },
    {
      "Metric Code": "REVENUE_GROWTH_MOM",
      "Metric Name": "Revenue Growth MoM (%)",
      Value: 14.8,
      Unit: "Percentage (%)",
      Guidance: "Month on month top-line revenue growth rate",
    },
    {
      "Metric Code": "GROSS_MARGIN_PCT",
      "Metric Name": "Gross Profit Margin (%)",
      Value: 70.4,
      Unit: "Percentage (%)",
      Guidance: "(Revenue - Direct Costs) / Revenue * 100",
    },
    {
      "Metric Code": "EBITDA",
      "Metric Name": "Operating EBITDA (INR)",
      Value: 1320000,
      Unit: "INR (₹)",
      Guidance: "Earnings before interest, taxes, depreciation and amortization",
    },
    {
      "Metric Code": "EBITDA_MARGIN_PCT",
      "Metric Name": "EBITDA Margin (%)",
      Value: 24.2,
      Unit: "Percentage (%)",
      Guidance: "EBITDA / Revenue * 100",
    },
    {
      "Metric Code": "NET_PROFIT",
      "Metric Name": "Net Profit After Tax - PAT (INR)",
      Value: 985000,
      Unit: "INR (₹)",
      Guidance: "Final bottom-line net profit after all taxes and finance costs",
    },
    {
      "Metric Code": "CASH_BANK_BALANCE",
      "Metric Name": "Cash & Bank Liquid Treasury (INR)",
      Value: 16200000,
      Unit: "INR (₹)",
      Guidance: "Total cash in bank current accounts, sweep accounts and fixed deposits",
    },
    {
      "Metric Code": "MONTHLY_BURN_RATE",
      "Metric Name": "Monthly Cash Burn Rate (INR)",
      Value: 1950000,
      Unit: "INR (₹)",
      Guidance: "Average net operating cash outflow per month",
    },
    {
      "Metric Code": "TOTAL_DEBTORS",
      "Metric Name": "Total Trade Receivables / Debtors (INR)",
      Value: 5850000,
      Unit: "INR (₹)",
      Guidance: "Gross outstanding customer invoices",
    },
    {
      "Metric Code": "DEBTORS_OVER_90_DAYS",
      "Metric Name": "Debtors Overdue > 90 Days (INR)",
      Value: 680000,
      Unit: "INR (₹)",
      Guidance: "High risk receivables requiring immediate virtual CFO recovery follow-up",
    },
    {
      "Metric Code": "DEBTOR_DAYS_DSO",
      "Metric Name": "Days Sales Outstanding - DSO",
      Value: 40,
      Unit: "Days",
      Guidance: "Average days taken by customers to settle invoices",
    },
    {
      "Metric Code": "TOTAL_CREDITORS",
      "Metric Name": "Total Trade Payables / Creditors (INR)",
      Value: 2950000,
      Unit: "INR (₹)",
      Guidance: "Total vendor balances outstanding",
    },
    {
      "Metric Code": "CREDITORS_MSME_OVER_45",
      "Metric Name": "MSME Payables Due > 45 Days (Sec 43B(h)) (INR)",
      Value: 165000,
      Unit: "INR (₹)",
      Guidance: "CRITICAL: Must clear within 45 days to avoid income tax disallowance",
    },
    {
      "Metric Code": "WORKING_CAPITAL",
      "Metric Name": "Net Working Capital (INR)",
      Value: 12400000,
      Unit: "INR (₹)",
      Guidance: "Current Assets minus Current Liabilities",
    },
    {
      "Metric Code": "QUICK_RATIO",
      "Metric Name": "Quick Liquidity Ratio (x)",
      Value: 2.72,
      Unit: "Ratio",
      Guidance: "(Current Assets - Inventory) / Current Liabilities",
    },
    {
      "Metric Code": "CFO_SUMMARY",
      "Metric Name": "Virtual CFO Strategic Commentary",
      Value:
        "Operating margins strengthened by 70 bps. Cash runway remains healthy at 8.3 months. Advance Tax 2nd installment provision cleared. MSME Sec 43B(h) overdue was reduced to ₹1.65L and queued for release.",
      Unit: "Text",
      Guidance: "CFO monthly executive summary for promoter and board",
    },
    {
      "Metric Code": "CFO_ALERT_1",
      "Metric Name": "CFO Key Alert 1",
      Value: "MSME Section 43B(h): FabTech bill ₹1.65L due in 3 days; release approved.",
      Unit: "Text",
      Guidance: "Priority operational or tax alert",
    },
    {
      "Metric Code": "CFO_ALERT_2",
      "Metric Name": "CFO Key Alert 2",
      Value: "Debtor collections improved; ₹14.2L realized from enterprise clients.",
      Unit: "Text",
      Guidance: "Working capital or liquidity alert",
    },
    {
      "Metric Code": "CFO_ALERT_3",
      "Metric Name": "CFO Key Alert 3",
      Value: "GSTR-3B tax payment queued and reconciled with GSTR-2B input credit.",
      Unit: "Text",
      Guidance: "Compliance or audit milestone alert",
    },
    {
      "Metric Code": "BS_SHARE_CAPITAL",
      "Metric Name": "Equity Share Capital (INR)",
      Value: 25000000,
      Unit: "INR (₹)",
      Guidance: "Paid-up equity share capital from Balance Sheet",
    },
    {
      "Metric Code": "BS_RESERVES_SURPLUS",
      "Metric Name": "Reserves and Surplus (INR)",
      Value: 34850000,
      Unit: "INR (₹)",
      Guidance: "Retained earnings and accumulated surplus",
    },
    {
      "Metric Code": "BS_LONG_TERM_BORROWINGS",
      "Metric Name": "Long-Term Borrowings / Term Loans (INR)",
      Value: 12000000,
      Unit: "INR (₹)",
      Guidance: "Non-current term loans and bank debt",
    },
    {
      "Metric Code": "BS_SHORT_TERM_BORROWINGS",
      "Metric Name": "Short-Term Borrowings / CC OD Limits (INR)",
      Value: 4500000,
      Unit: "INR (₹)",
      Guidance: "Cash Credit and bank overdraft facilities",
    },
    {
      "Metric Code": "BS_TRADE_PAYABLES",
      "Metric Name": "Trade Payables / Creditors (INR)",
      Value: 5130000,
      Unit: "INR (₹)",
      Guidance: "Total sundry creditors and vendor payables",
    },
    {
      "Metric Code": "BS_TOTAL_EQUITY_LIABILITIES",
      "Metric Name": "Total Equity & Liabilities (INR)",
      Value: 85560000,
      Unit: "INR (₹)",
      Guidance: "Total Liabilities (tallies with Total Assets)",
    },
    {
      "Metric Code": "BS_FIXED_ASSETS",
      "Metric Name": "Property, Plant & Equipment / Net Fixed Assets (INR)",
      Value: 23000000,
      Unit: "INR (₹)",
      Guidance: "Net block of PPE after accumulated depreciation",
    },
    {
      "Metric Code": "BS_INVENTORIES",
      "Metric Name": "Inventories / Stock-in-Hand (INR)",
      Value: 18200000,
      Unit: "INR (₹)",
      Guidance: "Raw materials, WIP and finished goods stock",
    },
    {
      "Metric Code": "BS_TRADE_RECEIVABLES",
      "Metric Name": "Trade Receivables / Debtors (INR)",
      Value: 14860000,
      Unit: "INR (₹)",
      Guidance: "Gross customer trade receivables",
    },
    {
      "Metric Code": "BS_TOTAL_ASSETS",
      "Metric Name": "Total Assets (INR)",
      Value: 85560000,
      Unit: "INR (₹)",
      Guidance: "Total Assets (tallies with Total Equity & Liabilities)",
    },
  ];

  // 1. Download Standard ERP / Fixed Template
  const downloadFixedTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    try {
      if (format === "xlsx") {
        const fileName = downloadStandardMisExcelTemplate(
          clientProfile?.companyName || "Company",
          financialMIS.period || "September 2026",
        );
        showToast(`Downloaded Standard ERP MIS template: ${fileName}`);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(TEMPLATE_SCHEMA);
      ws["!cols"] = [
        { wch: 28 }, // Metric Code
        { wch: 45 }, // Metric Name
        { wch: 22 }, // Value
        { wch: 18 }, // Unit
        { wch: 55 }, // Guidance
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fixed_MIS_Template");

      const fileName = `Virtual_CFO_Financial_MIS_Fixed_Template.${format}`;
      XLSX.writeFile(wb, fileName, { bookType: "csv" });
      showToast(`Downloaded fixed template: ${fileName}`);
    } catch (err) {
      console.error("Template generation error:", err);
      showToast("Error downloading template");
    }
  };

  // Helper to map parsed JSON rows to FinancialMIS state
  const processExcelRows = (rows: any[], sourceName: string) => {
    try {
      setUploadError(null);
      const partialMIS: Partial<FinancialMIS> = {};
      const alerts: string[] = [];

      let bsShareCapital: number | undefined;
      let bsReserves: number | undefined;
      let bsTermLoans: number | undefined;
      let bsShortLoans: number | undefined;
      let bsTradePayables: number | undefined;
      let bsTotalLiab: number | undefined;
      let bsFixedAssets: number | undefined;
      let bsInventories: number | undefined;
      let bsTradeReceivables: number | undefined;
      let bsTotalAssets: number | undefined;
      let hasBsMetrics = false;

      // Loop through rows and extract by Metric Code or Metric Name
      rows.forEach((row: any) => {
        const rawCode = (
          row["Metric Code"] ||
          row["metric_code"] ||
          row["Code"] ||
          row["code"] ||
          ""
        )
          .toString()
          .trim()
          .toUpperCase();
        const rawName = (
          row["Metric Name"] ||
          row["metric_name"] ||
          row["Name"] ||
          row["Metric"] ||
          ""
        )
          .toString()
          .trim()
          .toLowerCase();
        const rawVal =
          row["Value"] !== undefined
            ? row["Value"]
            : row["value"] !== undefined
              ? row["value"]
              : row["Amount"];

        if (rawVal === undefined || rawVal === null || rawVal === "") return;

        const numVal = cleanNumber(rawVal);
        const strVal = String(rawVal).trim();

        if (
          rawCode === "PERIOD" ||
          rawName.includes("reporting mis") ||
          rawName.includes("period")
        ) {
          partialMIS.period = strVal;
        } else if (
          rawCode === "REVENUE" ||
          rawName.includes("monthly revenue") ||
          rawName.includes("gross revenue")
        ) {
          partialMIS.monthlyRevenue = !isNaN(numVal) ? numVal : partialMIS.monthlyRevenue;
        } else if (rawCode === "REVENUE_GROWTH_MOM" || rawName.includes("revenue growth")) {
          partialMIS.revenueGrowthMoM = !isNaN(numVal) ? numVal : partialMIS.revenueGrowthMoM;
        } else if (
          rawCode === "GROSS_MARGIN_PCT" ||
          rawName.includes("gross profit margin") ||
          rawName.includes("gross margin")
        ) {
          partialMIS.grossMarginPercent = !isNaN(numVal) ? numVal : partialMIS.grossMarginPercent;
        } else if (
          rawCode === "EBITDA" ||
          rawName === "operating ebitda (inr)" ||
          rawName === "ebitda"
        ) {
          partialMIS.ebitda = !isNaN(numVal) ? numVal : partialMIS.ebitda;
        } else if (rawCode === "EBITDA_MARGIN_PCT" || rawName.includes("ebitda margin")) {
          partialMIS.ebitdaMarginPercent = !isNaN(numVal) ? numVal : partialMIS.ebitdaMarginPercent;
        } else if (
          rawCode === "NET_PROFIT" ||
          rawName.includes("net profit") ||
          rawName.includes("pat")
        ) {
          partialMIS.netProfit = !isNaN(numVal) ? numVal : partialMIS.netProfit;
        } else if (
          rawCode === "CASH_BANK_BALANCE" ||
          rawName.includes("cash & bank") ||
          rawName.includes("treasury")
        ) {
          partialMIS.cashAndBankBalance = !isNaN(numVal) ? numVal : partialMIS.cashAndBankBalance;
        } else if (
          rawCode === "MONTHLY_BURN_RATE" ||
          rawName.includes("burn rate") ||
          rawName.includes("burn")
        ) {
          partialMIS.monthlyBurnRate = !isNaN(numVal) ? numVal : partialMIS.monthlyBurnRate;
        } else if (
          rawCode === "TOTAL_DEBTORS" ||
          rawName.includes("total trade receivables") ||
          rawName.includes("total debtors")
        ) {
          partialMIS.totalDebtors = !isNaN(numVal) ? numVal : partialMIS.totalDebtors;
        } else if (
          rawCode === "DEBTORS_OVER_90_DAYS" ||
          rawName.includes("debtors overdue > 90") ||
          rawName.includes("> 90 days")
        ) {
          partialMIS.debtorsOver90Days = !isNaN(numVal) ? numVal : partialMIS.debtorsOver90Days;
        } else if (
          rawCode === "DEBTOR_DAYS_DSO" ||
          rawName.includes("dso") ||
          rawName.includes("days sales outstanding")
        ) {
          partialMIS.debtorDaysDSO = !isNaN(numVal) ? numVal : partialMIS.debtorDaysDSO;
        } else if (
          rawCode === "TOTAL_CREDITORS" ||
          rawName.includes("total trade payables") ||
          rawName.includes("total creditors")
        ) {
          partialMIS.totalCreditors = !isNaN(numVal) ? numVal : partialMIS.totalCreditors;
        } else if (
          rawCode === "CREDITORS_MSME_OVER_45" ||
          rawName.includes("msme") ||
          rawName.includes("43b(h)")
        ) {
          partialMIS.creditorsOver45Days = !isNaN(numVal) ? numVal : partialMIS.creditorsOver45Days;
        } else if (rawCode === "WORKING_CAPITAL" || rawName.includes("working capital")) {
          partialMIS.workingCapital = !isNaN(numVal) ? numVal : partialMIS.workingCapital;
        } else if (
          rawCode === "QUICK_RATIO" ||
          rawName.includes("quick liquidity") ||
          rawName.includes("quick ratio")
        ) {
          partialMIS.quickRatio = !isNaN(numVal) ? numVal : partialMIS.quickRatio;
        } else if (
          rawCode === "CFO_SUMMARY" ||
          rawName.includes("cfo strategic") ||
          rawName.includes("executive summary")
        ) {
          partialMIS.cfoExecutiveSummary = strVal;
        } else if (rawCode.startsWith("CFO_ALERT") || rawName.includes("alert")) {
          alerts.push(strVal);
        } else if (
          rawCode === "BS_SHARE_CAPITAL" ||
          rawCode === "SHARE_CAPITAL" ||
          rawName.includes("share capital") ||
          rawName.includes("equity share")
        ) {
          bsShareCapital = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_RESERVES_SURPLUS" ||
          rawCode === "RESERVES_SURPLUS" ||
          rawName.includes("reserves and surplus") ||
          rawName.includes("reserves & surplus") ||
          rawName.includes("retained earnings")
        ) {
          bsReserves = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_LONG_TERM_BORROWINGS" ||
          rawCode === "LONG_TERM_BORROWINGS" ||
          rawName.includes("long-term borrowings") ||
          rawName.includes("term loan") ||
          rawName.includes("term debt")
        ) {
          bsTermLoans = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_SHORT_TERM_BORROWINGS" ||
          rawCode === "SHORT_TERM_BORROWINGS" ||
          rawName.includes("short-term borrowings") ||
          rawName.includes("cc limit") ||
          rawName.includes("cash credit")
        ) {
          bsShortLoans = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_TRADE_PAYABLES" ||
          rawCode === "TRADE_PAYABLES" ||
          rawName.includes("trade payables") ||
          rawName.includes("sundry creditors")
        ) {
          bsTradePayables = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_TOTAL_EQUITY_LIABILITIES" ||
          rawCode === "TOTAL_EQUITY_LIABILITIES" ||
          rawName.includes("total equity & liabilities") ||
          rawName.includes("total liabilities")
        ) {
          bsTotalLiab = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_FIXED_ASSETS" ||
          rawCode === "FIXED_ASSETS" ||
          rawCode === "NET_PPE" ||
          rawName.includes("fixed assets") ||
          rawName.includes("property, plant") ||
          rawName.includes("net block")
        ) {
          bsFixedAssets = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_INVENTORIES" ||
          rawCode === "INVENTORIES" ||
          rawName.includes("inventories") ||
          rawName.includes("stock-in-hand") ||
          rawName.includes("closing stock")
        ) {
          bsInventories = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_TRADE_RECEIVABLES" ||
          rawCode === "TRADE_RECEIVABLES" ||
          rawName.includes("trade receivables") ||
          rawName.includes("sundry debtors")
        ) {
          bsTradeReceivables = numVal;
          hasBsMetrics = true;
        } else if (
          rawCode === "BS_TOTAL_ASSETS" ||
          rawCode === "TOTAL_ASSETS" ||
          rawName.includes("total assets")
        ) {
          bsTotalAssets = numVal;
          hasBsMetrics = true;
        }
      });

      if (alerts.length > 0) {
        partialMIS.cfoKeyAlerts = alerts;
      }

      // If Balance Sheet metrics were present in rows, construct full BalanceSheetData
      if (hasBsMetrics) {
        const baseEl = activeBalanceSheet.equityAndLiabilities;
        const baseAs = activeBalanceSheet.assets;

        const shareCapital = bsShareCapital ?? baseEl.shareCapital;
        const reservesAndSurplus = bsReserves ?? baseEl.reservesAndSurplus;
        const totalShareholdersFunds = shareCapital + reservesAndSurplus;
        const longTermBorrowings = bsTermLoans ?? baseEl.longTermBorrowings;
        const totalNonCurrentLiabilities = longTermBorrowings;
        const shortTermBorrowings = bsShortLoans ?? baseEl.shortTermBorrowings;
        const tradePayables = bsTradePayables ?? baseEl.tradePayables;
        const tradePayablesMsme = baseEl.tradePayablesMsme;
        const otherCurrentLiabilities = baseEl.otherCurrentLiabilities;
        const shortTermProvisions = baseEl.shortTermProvisions;
        const totalCurrentLiabilities =
          shortTermBorrowings +
          tradePayables +
          tradePayablesMsme +
          otherCurrentLiabilities +
          shortTermProvisions;
        const totalEquityAndLiabilities =
          bsTotalLiab ??
          totalShareholdersFunds + totalNonCurrentLiabilities + totalCurrentLiabilities;

        const netPpe = bsFixedAssets ?? baseAs.netPpe;
        const totalNonCurrentAssets =
          netPpe +
          baseAs.capitalWorkInProgress +
          baseAs.nonCurrentInvestments +
          baseAs.longTermLoansAndAdvances;
        const inventories = bsInventories ?? baseAs.inventories;
        const netTradeReceivables = bsTradeReceivables ?? baseAs.netTradeReceivables;
        const cashAndCashEquivalents =
          partialMIS.cashAndBankBalance ?? baseAs.cashAndCashEquivalents;
        const bankBalancesOther = baseAs.bankBalancesOther;
        const totalCurrentAssets =
          inventories +
          netTradeReceivables +
          cashAndCashEquivalents +
          bankBalancesOther +
          baseAs.shortTermLoansAndAdvances +
          baseAs.otherCurrentAssets;
        const totalAssets = bsTotalAssets ?? totalNonCurrentAssets + totalCurrentAssets;

        partialMIS.balanceSheet = {
          asOfDate: partialMIS.period || activeBalanceSheet.asOfDate,
          previousDate: activeBalanceSheet.previousDate,
          equityAndLiabilities: {
            ...baseEl,
            shareCapital,
            reservesAndSurplus,
            totalShareholdersFunds,
            longTermBorrowings,
            totalNonCurrentLiabilities,
            shortTermBorrowings,
            tradePayables,
            totalCurrentLiabilities,
            totalEquityAndLiabilities,
          },
          assets: {
            ...baseAs,
            netPpe,
            propertyPlantEquipment: netPpe,
            totalNonCurrentAssets,
            inventories,
            tradeReceivables: netTradeReceivables,
            netTradeReceivables,
            cashAndCashEquivalents,
            totalCurrentAssets,
            totalAssets,
          },
        };

        if (totalAssets > 0) {
          partialMIS.workingCapital = totalCurrentAssets - totalCurrentLiabilities;
          partialMIS.cashAndBankBalance = cashAndCashEquivalents + bankBalancesOther;
          if (netTradeReceivables > 0) partialMIS.totalDebtors = netTradeReceivables;
          if (tradePayables > 0) partialMIS.totalCreditors = tradePayables + tradePayablesMsme;
        }
      }

      // Auto-compute runway if cash and burn rate provided
      const cash = partialMIS.cashAndBankBalance ?? financialMIS.cashAndBankBalance;
      const burn = partialMIS.monthlyBurnRate ?? financialMIS.monthlyBurnRate;
      if (burn > 0) {
        partialMIS.cashRunwayMonths = Number((cash / burn).toFixed(1));
      }

      // Prepare comparison rows for UI preview
      const preview: ParsedMetricRow[] = [
        {
          code: "PERIOD",
          name: "Reporting MIS Period",
          currentValue: financialMIS.period,
          newValue: partialMIS.period ?? financialMIS.period,
          isChanged: partialMIS.period !== undefined && partialMIS.period !== financialMIS.period,
          unit: "Text",
        },
        {
          code: "REVENUE",
          name: "Monthly Revenue",
          currentValue: formatLakhs(financialMIS.monthlyRevenue),
          newValue: formatLakhs(partialMIS.monthlyRevenue ?? financialMIS.monthlyRevenue),
          isChanged:
            partialMIS.monthlyRevenue !== undefined &&
            partialMIS.monthlyRevenue !== financialMIS.monthlyRevenue,
          unit: "INR",
        },
        {
          code: "EBITDA",
          name: "Operating EBITDA",
          currentValue: formatLakhs(financialMIS.ebitda),
          newValue: formatLakhs(partialMIS.ebitda ?? financialMIS.ebitda),
          isChanged: partialMIS.ebitda !== undefined && partialMIS.ebitda !== financialMIS.ebitda,
          unit: "INR",
        },
        {
          code: "NET_PROFIT",
          name: "Net Profit PAT",
          currentValue: formatLakhs(financialMIS.netProfit),
          newValue: formatLakhs(partialMIS.netProfit ?? financialMIS.netProfit),
          isChanged:
            partialMIS.netProfit !== undefined && partialMIS.netProfit !== financialMIS.netProfit,
          unit: "INR",
        },
        ...(partialMIS.balanceSheet
          ? [
              {
                code: "TOTAL_ASSETS",
                name: "Total Assets (Balance Sheet)",
                currentValue: formatLakhs(activeBalanceSheet.assets.totalAssets),
                newValue: formatLakhs(partialMIS.balanceSheet.assets.totalAssets),
                isChanged:
                  partialMIS.balanceSheet.assets.totalAssets !==
                  activeBalanceSheet.assets.totalAssets,
                unit: "INR",
              },
              {
                code: "NET_WORTH",
                name: "Shareholders' Funds / Net Worth",
                currentValue: formatLakhs(
                  activeBalanceSheet.equityAndLiabilities.totalShareholdersFunds,
                ),
                newValue: formatLakhs(
                  partialMIS.balanceSheet.equityAndLiabilities.totalShareholdersFunds,
                ),
                isChanged:
                  partialMIS.balanceSheet.equityAndLiabilities.totalShareholdersFunds !==
                  activeBalanceSheet.equityAndLiabilities.totalShareholdersFunds,
                unit: "INR",
              },
              {
                code: "TOTAL_DEBT",
                name: "Total Borrowings (Term Loan + CC/OD)",
                currentValue: formatLakhs(
                  activeBalanceSheet.equityAndLiabilities.longTermBorrowings +
                    activeBalanceSheet.equityAndLiabilities.shortTermBorrowings,
                ),
                newValue: formatLakhs(
                  partialMIS.balanceSheet.equityAndLiabilities.longTermBorrowings +
                    partialMIS.balanceSheet.equityAndLiabilities.shortTermBorrowings,
                ),
                isChanged: true,
                unit: "INR",
              },
            ]
          : []),
        {
          code: "CASH_BANK_BALANCE",
          name: "Cash & Bank Liquid Treasury",
          currentValue: formatCrores(financialMIS.cashAndBankBalance),
          newValue: formatCrores(partialMIS.cashAndBankBalance ?? financialMIS.cashAndBankBalance),
          isChanged:
            partialMIS.cashAndBankBalance !== undefined &&
            partialMIS.cashAndBankBalance !== financialMIS.cashAndBankBalance,
          unit: "INR",
        },
        {
          code: "CASH_RUNWAY",
          name: "Cash Runway",
          currentValue: `${financialMIS.cashRunwayMonths} Months`,
          newValue: `${partialMIS.cashRunwayMonths ?? financialMIS.cashRunwayMonths} Months`,
          isChanged:
            partialMIS.cashRunwayMonths !== undefined &&
            partialMIS.cashRunwayMonths !== financialMIS.cashRunwayMonths,
          unit: "Months",
        },
        {
          code: "TOTAL_DEBTORS",
          name: "Total Debtors",
          currentValue: formatLakhs(financialMIS.totalDebtors),
          newValue: formatLakhs(partialMIS.totalDebtors ?? financialMIS.totalDebtors),
          isChanged:
            partialMIS.totalDebtors !== undefined &&
            partialMIS.totalDebtors !== financialMIS.totalDebtors,
          unit: "INR",
        },
        {
          code: "CREDITORS_MSME_OVER_45",
          name: "MSME > 45 Days (Sec 43B(h))",
          currentValue: formatLakhs(financialMIS.creditorsOver45Days),
          newValue: formatLakhs(partialMIS.creditorsOver45Days ?? financialMIS.creditorsOver45Days),
          isChanged:
            partialMIS.creditorsOver45Days !== undefined &&
            partialMIS.creditorsOver45Days !== financialMIS.creditorsOver45Days,
          unit: "INR",
        },
      ];

      setUploadFileName(sourceName);
      setParsedRows(preview);
      setStagedMIS(partialMIS);
      setIsExcelPanelOpen(true);
      showToast(`Parsed ${rows.length} rows from ${sourceName}`);
    } catch (err: any) {
      console.error("Excel processing error:", err);
      setUploadError(
        err?.message || "Failed to parse Excel file. Please ensure it follows the fixed template.",
      );
    }
  };

  // 2. Read and parse any Excel / CSV file (supports both ERP Multi-Sheet & Fixed Metric templates)
  const readAndProcessFile = async (file: File) => {
    try {
      setUploadError(null);
      const stdResult = await parseStandardMisExcel(file);
      if (stdResult.detectedSheets.length > 0) {
        const { summaryKPIs, pnlStatement, balanceSheet, debtorAgeing, fundFlow, period } =
          stdResult;
        const partialMIS: Partial<FinancialMIS> = {
          period: period || financialMIS.period,
        };
        if (summaryKPIs.monthlyRevenue > 0) {
          partialMIS.monthlyRevenue = summaryKPIs.monthlyRevenue;
          partialMIS.grossMarginPercent = summaryKPIs.grossMarginPercent;
          partialMIS.ebitda = summaryKPIs.ebitda;
          partialMIS.ebitdaMarginPercent = summaryKPIs.ebitdaMarginPercent;
          partialMIS.netProfit = summaryKPIs.pat;
        }
        if (summaryKPIs.cashAndBankBalance > 0) {
          partialMIS.cashAndBankBalance = summaryKPIs.cashAndBankBalance;
        }
        if (summaryKPIs.totalDebtors > 0) {
          partialMIS.totalDebtors = summaryKPIs.totalDebtors;
          partialMIS.debtorsOver90Days = summaryKPIs.debtorsOver90Days;
        }
        if (summaryKPIs.totalCreditors > 0) {
          partialMIS.totalCreditors = summaryKPIs.totalCreditors;
        }
        if (summaryKPIs.workingCapital !== 0) {
          partialMIS.workingCapital = summaryKPIs.workingCapital;
        }
        if (pnlStatement) partialMIS.pnlStatement = pnlStatement;
        if (balanceSheet) {
          partialMIS.balanceSheet = balanceSheet;
          if (summaryKPIs.totalAssets > 0) {
            if (summaryKPIs.cashAndBankBalance > 0) {
              partialMIS.cashAndBankBalance = summaryKPIs.cashAndBankBalance;
            }
            if (summaryKPIs.workingCapital !== 0) {
              partialMIS.workingCapital = summaryKPIs.workingCapital;
            }
            if (summaryKPIs.totalCreditors > 0) {
              partialMIS.totalCreditors = summaryKPIs.totalCreditors;
            }
            if (summaryKPIs.totalDebtors > 0) {
              partialMIS.totalDebtors = summaryKPIs.totalDebtors;
            }
          }
          if (stdResult.tallyLedgers && stdResult.tallyLedgers.length > 0) {
            const existingNonBs = (financialMIS.tallyLedgers || []).filter(
              (l) => l.statementType !== "Balance Sheet",
            );
            const incomingBs = stdResult.tallyLedgers.filter(
              (l) => l.statementType === "Balance Sheet",
            );
            partialMIS.tallyLedgers = [...existingNonBs, ...incomingBs];
          }
        }
        if (debtorAgeing) partialMIS.debtorAgeing = debtorAgeing;
        if (fundFlow) partialMIS.fundFlow = fundFlow;

        const hasPnl = Boolean(pnlStatement && summaryKPIs.monthlyRevenue > 0);
        const preview: ParsedMetricRow[] = [
          {
            code: "PERIOD",
            name: "Reporting MIS Period",
            currentValue: financialMIS.period,
            newValue: partialMIS.period ?? financialMIS.period,
            isChanged: partialMIS.period !== undefined && partialMIS.period !== financialMIS.period,
            unit: "Text",
          },
          ...(hasPnl
            ? [
                {
                  code: "REVENUE",
                  name: "Monthly Revenue",
                  currentValue: formatLakhs(financialMIS.monthlyRevenue),
                  newValue: formatLakhs(partialMIS.monthlyRevenue ?? financialMIS.monthlyRevenue),
                  isChanged:
                    partialMIS.monthlyRevenue !== undefined &&
                    partialMIS.monthlyRevenue !== financialMIS.monthlyRevenue,
                  unit: "INR",
                },
                {
                  code: "EBITDA",
                  name: "Operating EBITDA",
                  currentValue: formatLakhs(financialMIS.ebitda),
                  newValue: formatLakhs(partialMIS.ebitda ?? financialMIS.ebitda),
                  isChanged:
                    partialMIS.ebitda !== undefined && partialMIS.ebitda !== financialMIS.ebitda,
                  unit: "INR",
                },
                {
                  code: "NET_PROFIT",
                  name: "Net Profit PAT",
                  currentValue: formatLakhs(financialMIS.netProfit),
                  newValue: formatLakhs(partialMIS.netProfit ?? financialMIS.netProfit),
                  isChanged:
                    partialMIS.netProfit !== undefined &&
                    partialMIS.netProfit !== financialMIS.netProfit,
                  unit: "INR",
                },
              ]
            : []),
          ...(balanceSheet
            ? [
                {
                  code: "TOTAL_ASSETS",
                  name: "Total Assets (Balance Sheet)",
                  currentValue: formatLakhs(activeBalanceSheet.assets.totalAssets),
                  newValue: formatLakhs(balanceSheet.assets.totalAssets),
                  isChanged:
                    balanceSheet.assets.totalAssets !== activeBalanceSheet.assets.totalAssets,
                  unit: "INR",
                },
                {
                  code: "NET_WORTH",
                  name: "Shareholders' Funds / Net Worth",
                  currentValue: formatLakhs(
                    activeBalanceSheet.equityAndLiabilities.totalShareholdersFunds,
                  ),
                  newValue: formatLakhs(balanceSheet.equityAndLiabilities.totalShareholdersFunds),
                  isChanged:
                    balanceSheet.equityAndLiabilities.totalShareholdersFunds !==
                    activeBalanceSheet.equityAndLiabilities.totalShareholdersFunds,
                  unit: "INR",
                },
                {
                  code: "TOTAL_DEBT",
                  name: "Total Borrowings (Term Loan + CC/OD)",
                  currentValue: formatLakhs(
                    activeBalanceSheet.equityAndLiabilities.longTermBorrowings +
                      activeBalanceSheet.equityAndLiabilities.shortTermBorrowings,
                  ),
                  newValue: formatLakhs(
                    balanceSheet.equityAndLiabilities.longTermBorrowings +
                      balanceSheet.equityAndLiabilities.shortTermBorrowings,
                  ),
                  isChanged: true,
                  unit: "INR",
                },
                {
                  code: "CURRENT_ASSETS",
                  name: "Total Current Assets",
                  currentValue: formatLakhs(activeBalanceSheet.assets.totalCurrentAssets),
                  newValue: formatLakhs(balanceSheet.assets.totalCurrentAssets),
                  isChanged:
                    balanceSheet.assets.totalCurrentAssets !==
                    activeBalanceSheet.assets.totalCurrentAssets,
                  unit: "INR",
                },
                {
                  code: "CURRENT_LIABILITIES",
                  name: "Total Current Liabilities",
                  currentValue: formatLakhs(
                    activeBalanceSheet.equityAndLiabilities.totalCurrentLiabilities,
                  ),
                  newValue: formatLakhs(balanceSheet.equityAndLiabilities.totalCurrentLiabilities),
                  isChanged:
                    balanceSheet.equityAndLiabilities.totalCurrentLiabilities !==
                    activeBalanceSheet.equityAndLiabilities.totalCurrentLiabilities,
                  unit: "INR",
                },
              ]
            : []),
          {
            code: "CASH_BANK_BALANCE",
            name: "Cash & Bank Liquid Treasury",
            currentValue: formatCrores(financialMIS.cashAndBankBalance),
            newValue: formatCrores(
              partialMIS.cashAndBankBalance ?? financialMIS.cashAndBankBalance,
            ),
            isChanged:
              partialMIS.cashAndBankBalance !== undefined &&
              partialMIS.cashAndBankBalance !== financialMIS.cashAndBankBalance,
            unit: "INR",
          },
          {
            code: "TOTAL_DEBTORS",
            name: "Total Debtors",
            currentValue: formatLakhs(financialMIS.totalDebtors),
            newValue: formatLakhs(partialMIS.totalDebtors ?? financialMIS.totalDebtors),
            isChanged:
              partialMIS.totalDebtors !== undefined &&
              partialMIS.totalDebtors !== financialMIS.totalDebtors,
            unit: "INR",
          },
        ];

        setUploadFileName(file.name);
        setParsedRows(preview);
        setStagedMIS(partialMIS);
        setIsExcelPanelOpen(true);
        showToast(`Parsed ${stdResult.detectedSheets.join(", ")} from ${file.name}`);
        return;
      }
    } catch {
      // Fallback to single-sheet Fixed Metric Code parser below
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          setUploadError(
            "The uploaded sheet is empty. Please use the fixed template with populated rows.",
          );
          return;
        }

        processExcelRows(rows, file.name);
      } catch (err: any) {
        setUploadError(`Failed to read file: ${err?.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndProcessFile(file);
    // reset input so the same file can be re-uploaded if modified
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 3. One-click Demo Sample Loader
  const loadDemoExcelData = () => {
    processExcelRows(TEMPLATE_SCHEMA, "Demo_Fixed_Template_Sample.xlsx");
  };

  // 4. Apply parsed Excel data to Application State
  const applyExcelData = () => {
    if (!stagedMIS) return;
    updateFinancialMIS(stagedMIS);
    setParsedRows(null);
    setStagedMIS(null);
    setUploadFileName(null);
    setIsExcelPanelOpen(false);

    showToast("Financial MIS updated successfully from fixed Excel template!");
  };

  const cancelExcelStaging = () => {
    setParsedRows(null);
    setStagedMIS(null);
    setUploadFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Formal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Financial MIS</h1>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
            {financialMIS.period}
          </span>
        </div>

        {/* Action Buttons: Email to Client, Modify, Delete/Reset, Template & Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent Monthly MIS Email to Client Button */}
          <button
            type="button"
            onClick={() => setIsApproveModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              isMailed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40"
            }`}
            title="Approve Monthly Financial MIS & Dispatch Email to Client (CC CFO)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isMailed ? "Monthly MIS Emailed ✓" : "Email Brief MIS to Client"}</span>
          </button>

          {/* Modify Financial MIS Button (CFO or authorized editor) */}
          {(role === "cfo" || canEditMis) && (
            <button
              type="button"
              onClick={() =>
                handleOpenModifyModal(
                  activeSubTab === "pnl"
                    ? "pnl"
                    : activeSubTab === "balance-sheet"
                      ? "bs"
                      : activeSubTab === "debtor-ageing"
                        ? "debtors"
                        : "kpis",
                )
              }
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Directly modify Financial MIS numbers, revenue, EBITDA, cash runway, and CFO commentary"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Modify MIS</span>
            </button>
          )}

          {/* Delete / Reset Company MIS (CFO only) */}
          {role === "cfo" && (
            <button
              type="button"
              onClick={() => handleOpenModifyModal("data-management")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Delete or reset company Financial MIS figures"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete / Reset</span>
            </button>
          )}

          <button
            onClick={() => downloadFixedTemplate("xlsx")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template (.xlsx)</span>
          </button>

          {canUploadMisExcel && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload / Override Excel</span>
            </button>
          )}
        </div>
      </div>



      {/* Operational Role Banner for Specific Client Team Member */}
      {role === "client_team" && (
        <div
          className={`rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs border ${
            canEditMis
              ? "bg-sky-50 border-sky-200 text-sky-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 font-bold ${
                canEditMis ? "bg-sky-600" : "bg-amber-600"
              }`}
            >
              {currentUser.avatar || <Upload className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold flex items-center gap-2 flex-wrap">
                <span>
                  {currentUser.name} ({currentUser.roleTitle}) — Specific Person MIS Rights
                </span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                    canEditMis && canUploadMisExcel
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : canEditMis
                        ? "bg-sky-200 text-sky-800"
                        : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {canEditMis && canUploadMisExcel
                    ? "Can View, Edit & Upload Excel"
                    : canEditMis
                      ? "Can View & Edit (Excel Upload Disabled)"
                      : "View-Only Access (Editing Restricted by Admin)"}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${canEditMis ? "text-sky-700" : "text-amber-800"}`}>
                {canEditMis
                  ? "Your personal Client Team profile is authorized by Admin to update MIS figures and sync statements."
                  : "Your personal Client Team profile has View-Only permissions for Financial MIS. Contact Virtual CFO Admin to enable editing or Excel upload."}
              </p>
            </div>
          </div>
          {canUploadMisExcel && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Sync via ERP Excel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input for Excel */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* DEDICATED EXCEL INTEGRATION PANEL (Fixed template updater) */}
      {isExcelPanelOpen && (
        <div className="bg-white rounded-2xl border-2 border-emerald-400/80 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Excel MIS Upload & Fixed Template Synchronizer</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Fixed Template Supported
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update entire Financial MIS dashboard in 1 step using standard spreadsheet format
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadDemoExcelData}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer flex items-center gap-1"
                title="Load sample data from the fixed template to test without uploading"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Test with Sample Data</span>
              </button>

              <button
                onClick={() => setIsExcelPanelOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3-Step Simple Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-900 block">Download Template</strong>
                <span className="text-slate-500 text-[11px]">
                  Get the standardized{" "}
                  <button
                    onClick={() => downloadFixedTemplate("xlsx")}
                    className="text-emerald-700 font-semibold underline"
                  >
                    .xlsx
                  </button>{" "}
                  or{" "}
                  <button
                    onClick={() => downloadFixedTemplate("csv")}
                    className="text-emerald-700 font-semibold underline"
                  >
                    .csv
                  </button>{" "}
                  file.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-900 block">Enter / Paste Figures</strong>
                <span className="text-slate-500 text-[11px]">
                  Input numbers in the <strong>Value</strong> column (Revenue, EBITDA, Bank Cash,
                  Debtors).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-900 block">Upload & Apply</strong>
                <span className="text-slate-500 text-[11px]">
                  Drop file below, review the side-by-side comparison table, and click Apply.
                </span>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 ${
              isDragging
                ? "border-emerald-500 bg-emerald-100/60 scale-[1.01]"
                : "border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isDragging
                  ? "Drop your Excel file here..."
                  : "Click to browse or drag and drop your completed Excel file (.xlsx, .xls, .csv)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically maps: <strong>Metric Code</strong>, <strong>Metric Name</strong>, and{" "}
                <strong>Value</strong>
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px]">
              <span
                className="text-emerald-700 font-semibold underline"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFixedTemplate("xlsx");
                }}
              >
                Download .xlsx Template
              </span>
              <span>•</span>
              <span
                className="text-emerald-700 font-semibold underline"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFixedTemplate("csv");
                }}
              >
                Download .csv Template
              </span>
            </div>
          </div>

          {/* Error display */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Preview Table & Confirmation */}
          {parsedRows && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    File Parsed:{" "}
                    <strong className="text-emerald-700 font-mono">{uploadFileName}</strong>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Review values extracted from the fixed template before applying to the executive
                    dashboard
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelExcelStaging}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={applyExcelData}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Financial MIS</span>
                  </button>
                </div>
              </div>

              {/* Table preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Metric Code</th>
                      <th className="px-3 py-2">Metric Name</th>
                      <th className="px-3 py-2">Current MIS Value</th>
                      <th className="px-3 py-2">Uploaded Excel Value</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedRows.map((row) => (
                      <tr key={row.code} className={row.isChanged ? "bg-emerald-50/40" : ""}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-700 text-[11px]">
                          {row.code}
                        </td>
                        <td className="px-3 py-2 text-slate-900 font-medium">{row.name}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono">
                          {String(row.currentValue)}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">
                          {String(row.newValue)}
                        </td>
                        <td className="px-3 py-2">
                          {row.isChanged ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Updated ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Unchanged
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Quick Edit Form Modal for CFO */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-md space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Update Client Financial MIS Parameters (CFO Workstation)
            </h3>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Revenue (₹)</label>
              <input
                type="number"
                value={formData.monthlyRevenue}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyRevenue: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">EBITDA (₹)</label>
              <input
                type="number"
                value={formData.ebitda}
                onChange={(e) => setFormData({ ...formData, ebitda: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cash in Bank (₹)</label>
              <input
                type="number"
                value={formData.cashAndBankBalance}
                onChange={(e) =>
                  setFormData({ ...formData, cashAndBankBalance: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Monthly Burn Rate (₹)
              </label>
              <input
                type="number"
                value={formData.monthlyBurnRate}
                onChange={(e) => {
                  const burn = Number(e.target.value);
                  const runway =
                    burn > 0 ? Number((formData.cashAndBankBalance / burn).toFixed(1)) : 0;
                  setFormData({ ...formData, monthlyBurnRate: burn, cashRunwayMonths: runway });
                }}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Debtors (₹)</label>
              <input
                type="number"
                value={formData.totalDebtors}
                onChange={(e) => setFormData({ ...formData, totalDebtors: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Debtors &gt; 90 Days (₹)
              </label>
              <input
                type="number"
                value={formData.debtorsOver90Days}
                onChange={(e) =>
                  setFormData({ ...formData, debtorsOver90Days: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Creditors (₹)</label>
              <input
                type="number"
                value={formData.totalCreditors}
                onChange={(e) =>
                  setFormData({ ...formData, totalCreditors: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                MSME Dues &gt; 45 Days (₹)
              </label>
              <input
                type="number"
                value={formData.creditorsOver45Days}
                onChange={(e) =>
                  setFormData({ ...formData, creditorsOver45Days: Number(e.target.value) })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              CFO Executive Summary & Guidance
            </label>
            <textarea
              rows={3}
              value={formData.cfoExecutiveSummary}
              onChange={(e) => setFormData({ ...formData, cfoExecutiveSummary: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </form>
      )}

      {/* Sub-Navigation Tabs for Detailed Financial Statements */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto gap-2 py-1">
        <div className="flex items-center gap-1 flex-nowrap">
          <button
            onClick={() => setActiveSubTab("balance-sheet")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "balance-sheet"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Balance Sheet</span>
          </button>

          <button
            onClick={() => setActiveSubTab("pnl")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "pnl"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit &amp; Loss (P&amp;L)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("debtor-ageing")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "debtor-ageing"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Debtor Ageing</span>
          </button>

          <button
            id="mis-subtab-cash-flow"
            onClick={() => setActiveSubTab("cash-flow")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === "cash-flow"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash Flow &amp; Budget</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: BROAD BALANCE SHEET */}
      {activeSubTab === "balance-sheet" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <BalanceSheetView
            balanceSheet={activeBalanceSheet}
            clientProfile={clientProfile}
            onOpenModifyModal={handleOpenModifyModal}
          />
        </div>
      )}

      {/* SUB-VIEW 3: PROFIT & LOSS ACCOUNT */}
      {activeSubTab === "pnl" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <PnlAccountView
            pnlStatement={activePnl}
            clientProfile={clientProfile}
            onOpenModifyModal={handleOpenModifyModal}
          />
        </div>
      )}

      {/* SUB-VIEW 4: DEBTOR AGEING */}
      {activeSubTab === "debtor-ageing" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <DebtorAgeingView
            debtorAgeing={activeDebtorAgeing}
            clientProfile={clientProfile}
            onOpenModifyModal={handleOpenModifyModal}
          />
        </div>
      )}

      {/* SUB-VIEW 5: MERGED CASH FLOW & FUND MOVEMENT DASHBOARD */}
      {activeSubTab === "cash-flow" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <CashFlowDashboardView
            fundFlow={activeFundFlow}
            cashBudget={activeCashBudget}
            clientProfile={clientProfile}
            defaultHorizon="8-weeks"
          />
        </div>
      )}

      {/* Global Excel Ingestion Modal for Client Team and CFO */}
      <ExcelUploadMisModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* MIS Uploads & CFO Sign-Off Queue */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              MIS Upload History &amp; Sign-Off Queue
            </h3>
            <span className="text-xs text-slate-500 font-mono">({companyMisUploads.length})</span>
          </div>
          {canUploadMisExcel && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel</span>
            </button>
          )}
        </div>

        {companyMisUploads.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No MIS uploads recorded for {clientProfile.companyName} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">File Name</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Statement Type</th>
                  <th className="py-2.5 px-4 text-right">Rows</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Uploaded At</th>
                  <th className="py-2.5 px-4">Review Note / CFO Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {companyMisUploads.map((up) => (
                  <tr key={up.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{up.fileName}</td>
                    <td className="py-2.5 px-4">{up.period}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] uppercase text-slate-600">
                      {up.statementType}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">{up.rowCount}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          up.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : up.status === "rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : up.status === "superseded"
                                ? "bg-slate-100 text-slate-600 border border-slate-300"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {up.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-500">
                      {new Date(up.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-between gap-2">
                        {role === "cfo" && up.status === "pending_review" ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                              type="text"
                              value={reviewNotes[up.id] || ""}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({ ...prev, [up.id]: e.target.value }))
                              }
                              placeholder="Optional review note..."
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white w-36 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                void reviewMisUpload(up.id, "approved", reviewNotes[up.id])
                              }
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void reviewMisUpload(up.id, "rejected", reviewNotes[up.id])
                              }
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600">
                            {up.reviewNote ||
                              (up.status === "pending_review"
                                ? "Awaiting CFO review"
                                : up.status === "superseded"
                                  ? "Superseded by fresh upload"
                                  : "Approved")}
                          </span>
                        )}

                        {role === "cfo" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete upload record "${up.fileName}" (${up.period})? This will remove it from the audit log and database.`)) {
                                void deleteMisUpload(up.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Delete this upload record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Financial MIS Email Dispatch & Approval Modal */}
      <ApproveAndDispatchMisModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        report={activeReport}
        onApprovedAndDispatched={(updatedReport) => {
          saveExecutiveReport(updatedReport);
          showToast(
            `Monthly MIS successfully dispatched to ${updatedReport.clientMailTo || clientProfile.email} with copy to ${updatedReport.cfoMailCc || currentUser.email}!`,
          );
        }}
        financialMIS={financialMIS}
        pnl={activePnl}
        balanceSheet={activeBalanceSheet}
        debtorAgeing={activeDebtorAgeing}
        clientProfile={clientProfile}
        companyName={clientProfile.companyName}
        companyId={clientProfile.id}
      />

      {/* Monthly MIS Email Dispatch Audit Logs Modal */}
      <MonthlyMisDispatchLogModal
        isOpen={isDispatchLogModalOpen}
        onClose={() => setIsDispatchLogModalOpen(false)}
        companyId={clientProfile.id}
        companyName={clientProfile.companyName}
      />

      {/* CFO Financial MIS Direct Modification & Purge Modal */}
      <ModifyFinancialMisModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        financialMIS={financialMIS}
        clientProfile={clientProfile}
        initialTab={modifyModalInitialTab}
        onSave={(updated) => updateFinancialMIS(updated)}
        onDeleteCompanyMIS={() => void deleteCompanyFinancialMIS(clientProfile.id)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />
    </div>
  );
};
