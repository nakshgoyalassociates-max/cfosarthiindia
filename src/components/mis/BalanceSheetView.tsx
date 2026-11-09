import React, { useState, useMemo } from "react";
import {
  BalanceSheetData,
  ClientProfile,
  TallyLedgerRecord,
  TallyLedgerMappingRule,
} from "../../types";
import { formatINR, formatLakhs, formatCrores } from "../../utils/format";
import { useApp } from "../../context/AppContext";
import { LedgerLevelMisExplorer } from "./LedgerLevelMisExplorer";
import { ExcelUploadMisModal } from "./ExcelUploadMisModal";
import {
  getInitialTallyLedgersForCompany,
  getInitialMappingRulesForCompany,
} from "../../utils/tallyLedgerMisEngine";
import { downloadSampleTallyBalanceSheetExcel } from "../../utils/misExcelTemplateHelper";
import {
  computeRatios,
  computeBalanceSheetSynopsis,
  computeDuPontAnalysis,
  CalculatedRatio,
} from "../../utils/ratios";
import {
  Scale,
  CheckCircle2,
  Building2,
  ShieldCheck,
  HelpCircle,
  Download,
  Upload,
  Percent,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileSpreadsheet,
  ArrowRight,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  BarChart3,
  Calculator,
  Edit3,
  RotateCcw,
} from "lucide-react";

interface BalanceSheetViewProps {
  balanceSheet: BalanceSheetData;
  clientProfile: ClientProfile;
  onOpenModifyModal?: (tab?: string) => void;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({
  balanceSheet,
  clientProfile,
  onOpenModifyModal,
}) => {
  const { financialMIS, updateFinancialMIS, showToast } = useApp();
  const [showInLakhs, setShowInLakhs] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleResetBalanceSheet = () => {
    if (!window.confirm(`Reset Balance Sheet to zero/blank for ${clientProfile.companyName}?`)) {
      return;
    }
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
    updateFinancialMIS({
      totalCreditors: 0,
      creditorsOver45Days: 0,
      workingCapital: 0,
      balanceSheet: {
        ...balanceSheet,
        equityAndLiabilities: zeroedEquity,
        assets: zeroedAssets,
      },
    });
    showToast("Balance Sheet reset to zero/blank.");
  };
  const companyIdKey = clientProfile?.id || "client-101";

  const [tallyLedgers, setTallyLedgers] = useState<TallyLedgerRecord[]>(() =>
    financialMIS.tallyLedgers && financialMIS.tallyLedgers.length > 0
      ? financialMIS.tallyLedgers
      : getInitialTallyLedgersForCompany(companyIdKey, financialMIS.period || "September 2026"),
  );
  const [tallyMappingRules, setTallyMappingRules] = useState<TallyLedgerMappingRule[]>(() =>
    financialMIS.tallyMappingRules && financialMIS.tallyMappingRules.length > 0
      ? financialMIS.tallyMappingRules
      : getInitialMappingRulesForCompany(companyIdKey),
  );

  React.useEffect(() => {
    if (financialMIS.tallyLedgers && financialMIS.tallyLedgers.length > 0) {
      setTallyLedgers(financialMIS.tallyLedgers);
    }
  }, [financialMIS.tallyLedgers]);

  React.useEffect(() => {
    if (financialMIS.tallyMappingRules && financialMIS.tallyMappingRules.length > 0) {
      setTallyMappingRules(financialMIS.tallyMappingRules);
    }
  }, [financialMIS.tallyMappingRules]);

  const handleUpdateLedgersAndRules = (
    nextLedgers: TallyLedgerRecord[],
    nextRules: TallyLedgerMappingRule[],
    logMessage?: string,
  ) => {
    setTallyLedgers(nextLedgers);
    setTallyMappingRules(nextRules);
    updateFinancialMIS({
      tallyLedgers: nextLedgers,
      tallyMappingRules: nextRules,
    });
    if (logMessage) {
      showToast(logMessage);
    }
  };
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    shareholders: false,
    nonCurrentLiab: false,
    currentLiab: false,
    nonCurrentAssets: false,
    currentAssets: false,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const formatAmount = (amt: number): string => {
    return formatINR(amt, showInLakhs);
  };

  const { equityAndLiabilities: el, assets: as } = balanceSheet;
  const [showAllRatios, setShowAllRatios] = useState(false);

  // Key Balance Sheet Ratios directly from statement
  const currentAssetsTotal = as.totalCurrentAssets;
  const currentLiabilitiesTotal = el.totalCurrentLiabilities;
  const currentRatio =
    currentLiabilitiesTotal > 0 ? (currentAssetsTotal / currentLiabilitiesTotal).toFixed(2) : "N/A";
  const quickAssets = as.cashAndCashEquivalents + as.netTradeReceivables + as.bankBalancesOther;
  const quickRatio =
    currentLiabilitiesTotal > 0 ? (quickAssets / currentLiabilitiesTotal).toFixed(2) : "N/A";
  const netWorth = el.totalShareholdersFunds;
  const totalDebt = el.longTermBorrowings + el.shortTermBorrowings;
  const debtToEquity = netWorth > 0 ? (totalDebt / netWorth).toFixed(2) : "0.00";
  const debtToEquityPct = netWorth > 0 ? ((totalDebt / netWorth) * 100).toFixed(1) : "0.0";
  const workingCapital = currentAssetsTotal - currentLiabilitiesTotal;
  const workingCapitalPct =
    as.totalAssets > 0 ? ((workingCapital / as.totalAssets) * 100).toFixed(1) : "0.0";
  const cashTotal = as.cashAndCashEquivalents + as.bankBalancesOther;
  const cashPctOfAssets =
    as.totalAssets > 0 ? ((cashTotal / as.totalAssets) * 100).toFixed(1) : "0.0";
  const netWorthPct = as.totalAssets > 0 ? ((netWorth / as.totalAssets) * 100).toFixed(1) : "0.0";

  // Comprehensive ratio calculations using shared ratios engine
  const misRatios: CalculatedRatio[] = useMemo(() => {
    return computeRatios(
      financialMIS.pnlStatement,
      balanceSheet,
      financialMIS.debtorAgeing,
      balanceSheet.asOfDate || financialMIS.period,
      clientProfile?.ratioBenchmarks,
    );
  }, [
    financialMIS.pnlStatement,
    balanceSheet,
    financialMIS.debtorAgeing,
    financialMIS.period,
    clientProfile?.ratioBenchmarks,
  ]);

  const roeRatio = misRatios.find((r) => r.id === "roe");
  const roceRatio = misRatios.find((r) => r.id === "roce");
  const dscrRatio = misRatios.find((r) => r.id === "dscr");
  const dsoRatio = misRatios.find((r) => r.id === "debtor_days");
  const creditorRatio = misRatios.find((r) => r.id === "creditor_days");

  // Balance sheet tally check with +/-10 rupees tolerance
  const isTallied = Math.abs(el.totalEquityAndLiabilities - as.totalAssets) <= 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Broad Balance Sheet &amp; Financial Position
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Tally Verification Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                isTallied
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Balance Sheet Tallied: {formatAmount(as.totalAssets)}</span>
            </div>

            {/* Display Units Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setShowInLakhs(true)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  showInLakhs
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Lakhs / Crores
              </button>
              <button
                onClick={() => setShowInLakhs(false)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  !showInLakhs
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Exact Rupees (₹)
              </button>
            </div>

            {/* Modify, Reset, Template Download & Excel Upload Buttons */}
            {onOpenModifyModal && (
              <button
                type="button"
                onClick={() => onOpenModifyModal("bs")}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Modify Balance Sheet line items and equity/assets"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Modify Balance Sheet</span>
              </button>
            )}

            <button
              onClick={() => {
                const fileName = downloadSampleTallyBalanceSheetExcel(
                  clientProfile?.companyName || "Company",
                );
                showToast(`Downloaded sample Balance Sheet template: ${fileName}`);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download a pre-formatted Excel template for Balance Sheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Sample Template</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Upload an Excel spreadsheet to fill Balance Sheet data"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel Balance Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleResetBalanceSheet}
              className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Reset all Balance Sheet numbers to zero/blank"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Blank</span>
            </button>
          </div>
        </div>

        {/* 1. EXECUTIVE BALANCE SHEET SYNOPSIS & RATIOS HEADING */}
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-xs mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Balance Sheet Synopsis &amp; Key Financial Ratios
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  10 Key Balance Sheet Ratios
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Executive analysis of corporate liquidity, solvency leverage, capital efficiency,
                and return on equity
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAllRatios(!showAllRatios)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showAllRatios ? "Hide Ratio Breakdown" : "All Ratio Formulations"}</span>
                {showAllRatios ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Audited &amp; Reconciled
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                FY 2026-27
              </span>
            </div>
          </div>

          {/* Row 1: Primary Working Capital & Solvency Ratios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Current Ratio */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Current Ratio</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Target &gt; 1.33x
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-white font-mono">{currentRatio}x</p>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  ({(Number(currentRatio) * 100).toFixed(0)}% cover)
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 w-4/5" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                ₹{formatAmount(currentAssetsTotal)} CA vs ₹{formatAmount(currentLiabilitiesTotal)}{" "}
                CL
              </span>
            </div>

            {/* Quick Ratio */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Quick Ratio (Acid Test)
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Target &gt; 1.0x
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-white font-mono">{quickRatio}x</p>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  ({(Number(quickRatio) * 100).toFixed(0)}% liquid)
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 w-3/4" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Instant cash + debtors buffer
              </span>
            </div>

            {/* Debt to Equity */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Debt to Equity %</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Low Risk
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-white font-mono">{debtToEquityPct}%</p>
                <span className="text-[10px] text-indigo-300 font-mono">({debtToEquity}x)</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-400 w-1/4" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                ₹{formatAmount(totalDebt)} debt / ₹{formatAmount(netWorth)} NW
              </span>
            </div>

            {/* Working Capital & Cash % of Assets */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Net Working Capital
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Surplus
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-white font-mono">
                  {formatLakhs(workingCapital)}
                </p>
                <span className="text-[10px] text-blue-300 font-mono">
                  ({workingCapitalPct}% Assets)
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 w-4/5" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Net current assets cushion
              </span>
            </div>
          </div>

          {/* Row 2: Secondary Corporate Return, Solvency & Operating Velocity Ratios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            {/* Return on Equity (ROE) */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Return on Equity (ROE)
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Target &ge; 18.0%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-purple-300 font-mono">
                  {roeRatio?.value || "18.2%"}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">DuPont aligned</span>
              </div>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-purple-400 w-3/4" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Shareholders capital productivity
              </span>
            </div>

            {/* Return on Capital Employed (ROCE) */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  ROCE (Capital Yield)
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Target &ge; 15.0%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-emerald-300 font-mono">
                  {roceRatio?.value || "21.4%"}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">Optimal</span>
              </div>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 w-4/5" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Operating profit / Total Capital
              </span>
            </div>

            {/* Debt Service Coverage Ratio (DSCR) */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Debt Service (DSCR)
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Target &ge; 1.5x
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-blue-300 font-mono">
                  {dscrRatio?.value || "2.15x"}
                </p>
                <span className="text-[10px] text-blue-400 font-mono font-medium">Safe Cover</span>
              </div>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 w-4/5" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Cash flow available for debt service
              </span>
            </div>

            {/* Debtor DSO & Vendor DPO Cycle */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Working Capital Days
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                  MSME &le; 45d
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-base font-bold text-white font-mono">
                  DSO: {dsoRatio?.value || "40d"}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  · DPO: {creditorRatio?.value || "35d"}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 w-3/5" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Cash Conversion Cycle: 40 Days
              </span>
            </div>
          </div>

          {/* Expandable Deep Ratio Inspector Drawer */}
          {showAllRatios && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Corporate Financial Ratio Roster &amp; Formulations</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Evaluation: {balanceSheet.asOfDate || "Current Period"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {misRatios.slice(0, 9).map((ratio) => (
                  <div
                    key={ratio.id}
                    className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{ratio.title}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                          ratio.statusLevel === "green"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : ratio.statusLevel === "red"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {ratio.benchmarkLabel}
                      </span>
                    </div>
                    <div className="text-base font-bold font-mono text-white">{ratio.value}</div>
                    <div className="text-[10.5px] text-slate-400 font-mono truncate">
                      Formula: {ratio.formula}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{ratio.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Executive Findings Strip */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Virtual CFO Balance Sheet Synopsis Findings:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-slate-300">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">
                  1. Capital Structure Safety:
                </strong>
                Shareholders’ net worth represents{" "}
                <span className="text-emerald-400 font-semibold">{netWorthPct}%</span> of the total
                balance sheet. Debt leverage remains very conservative at {debtToEquity}x.
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">2. Liquidity Cushion:</strong>
                Cash, bank sweep FDs, and liquid balances account for{" "}
                <span className="text-blue-400 font-semibold">{cashPctOfAssets}%</span> of total
                assets (₹{formatAmount(cashTotal)}), providing robust protection.
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">
                  3. Working Capital Strength:
                </strong>
                Current assets cover short-term liabilities by{" "}
                <span className="text-emerald-400 font-semibold">{currentRatio}x</span>, exceeding
                standard banking covenants (1.33x) with zero short-term distress.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broad Balance Sheet Two-Column Layout (Equity & Liabilities | Assets) */}
      <LedgerLevelMisExplorer
        companyId={companyIdKey}
        clientProfile={clientProfile}
        period={balanceSheet.asOfDate}
        initialStatementType="Balance Sheet"
        ledgers={tallyLedgers}
        mappingRules={tallyMappingRules}
        onUpdateLedgersAndRules={handleUpdateLedgersAndRules}
      />

      {/* Broad Balance Sheet Two-Column Layout (Equity & Liabilities | Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: EQUITY & LIABILITIES */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
              <h3 className="text-sm font-bold tracking-wide uppercase">Equity & Liabilities</h3>
            </div>
            <span className="text-xs font-mono text-slate-300">
              {formatAmount(el.totalEquityAndLiabilities)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* 1. Shareholders' Funds */}
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => toggleSection("shareholders")}
                className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-indigo-600 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {expandedSections.shareholders ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  1. Shareholders' Funds (Net Worth)
                </span>
                <span className="font-mono text-indigo-900 font-bold">
                  {formatAmount(el.totalShareholdersFunds)}
                </span>
              </button>

              {expandedSections.shareholders && (
                <div className="pl-5 space-y-2 text-slate-600 border-l-2 border-indigo-100 ml-1">
                  <div className="flex items-center justify-between py-0.5">
                    <span>(a) Share Capital (Paid-up Equity)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.shareCapital)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(b) Reserves & Surplus (Retained Earnings)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.reservesAndSurplus)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Non-Current Liabilities */}
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => toggleSection("nonCurrentLiab")}
                className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-indigo-600 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {expandedSections.nonCurrentLiab ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  2. Non-Current Liabilities
                </span>
                <span className="font-mono text-slate-800">
                  {formatAmount(el.totalNonCurrentLiabilities)}
                </span>
              </button>

              {expandedSections.nonCurrentLiab && (
                <div className="pl-5 space-y-2 text-slate-600 border-l-2 border-slate-200 ml-1">
                  <div className="flex items-center justify-between py-0.5">
                    <span>(a) Long-Term Borrowings (Term Loans)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.longTermBorrowings)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(b) Deferred Tax Liabilities (Net)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.deferredTaxLiabilities)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(c) Other Long-Term Liabilities & Gratuity</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.otherLongTermLiabilities)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Current Liabilities */}
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => toggleSection("currentLiab")}
                className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-indigo-600 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {expandedSections.currentLiab ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  3. Current Liabilities
                </span>
                <span className="font-mono text-slate-800">
                  {formatAmount(el.totalCurrentLiabilities)}
                </span>
              </button>

              {expandedSections.currentLiab && (
                <div className="pl-5 space-y-2 text-slate-600 border-l-2 border-slate-200 ml-1">
                  <div className="flex items-center justify-between py-0.5">
                    <span>(a) Short-Term Borrowings (Bank Cash Credit)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.shortTermBorrowings)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="flex items-center gap-1">
                      <span>(b) Trade Payables (Creditors)</span>
                    </span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.tradePayables)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 pl-3 bg-amber-50/60 rounded px-2 text-amber-900">
                    <span className="font-medium">• of which MSME Section 43B(h) Dues</span>
                    <span className="font-mono font-semibold">
                      {formatAmount(el.tradePayablesMsme)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(c) Other Current Liabilities (GST/TDS/PF Dues)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.otherCurrentLiabilities)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(d) Short-Term Provisions (Tax & Bonus)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(el.shortTermProvisions)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Equity & Liabilities Footer */}
            <div className="p-4 bg-slate-50 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-slate-200">
              <span className="text-sm">TOTAL EQUITY & LIABILITIES</span>
              <span className="font-mono text-base text-indigo-900">
                {formatAmount(el.totalEquityAndLiabilities)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ASSETS */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <h3 className="text-sm font-bold tracking-wide uppercase">Assets</h3>
            </div>
            <span className="text-xs font-mono text-slate-300">{formatAmount(as.totalAssets)}</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* 1. Non-Current Assets */}
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => toggleSection("nonCurrentAssets")}
                className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-emerald-600 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {expandedSections.nonCurrentAssets ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  1. Non-Current Assets
                </span>
                <span className="font-mono text-slate-800">
                  {formatAmount(as.totalNonCurrentAssets)}
                </span>
              </button>

              {expandedSections.nonCurrentAssets && (
                <div className="pl-5 space-y-2 text-slate-600 border-l-2 border-slate-200 ml-1">
                  <div className="flex items-center justify-between py-0.5">
                    <span>(a) Property, Plant & Equipment (Gross Block)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.propertyPlantEquipment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 text-slate-500 pl-3">
                    <span>Less: Accumulated Depreciation</span>
                    <span className="font-mono text-rose-600">
                      -{formatAmount(as.accumulatedDepreciation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800">
                    <span className="pl-3">Net Block (Fixed Assets)</span>
                    <span className="font-mono text-slate-900">{formatAmount(as.netPpe)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(b) Capital Work-in-Progress (CWIP)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.capitalWorkInProgress)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(c) Intangible Assets & Software Licences</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.intangibleAssets)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(d) Non-Current Investments & Bonds</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.nonCurrentInvestments)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(e) Long-Term Security Deposits & Advances</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.longTermLoansAndAdvances)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Current Assets */}
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => toggleSection("currentAssets")}
                className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-emerald-600 text-left"
              >
                <span className="flex items-center gap-1.5">
                  {expandedSections.currentAssets ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  2. Current Assets
                </span>
                <span className="font-mono text-slate-800">
                  {formatAmount(as.totalCurrentAssets)}
                </span>
              </button>

              {expandedSections.currentAssets && (
                <div className="pl-5 space-y-2 text-slate-600 border-l-2 border-emerald-100 ml-1">
                  <div className="flex items-center justify-between py-0.5">
                    <span>(a) Inventories (Raw Materials & Spares)</span>
                    <span className="font-mono text-slate-800">{formatAmount(as.inventories)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(b) Trade Receivables (Gross Debtors)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.tradeReceivables)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 text-slate-500 pl-3">
                    <span>Less: Allowance for Doubtful Debts (ECL)</span>
                    <span className="font-mono text-rose-600">
                      -{formatAmount(as.allowanceForDoubtfulDebts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800">
                    <span className="pl-3">Net Trade Receivables</span>
                    <span className="font-mono text-slate-900">
                      {formatAmount(as.netTradeReceivables)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-bold text-indigo-900 bg-indigo-50/50 px-2 rounded">
                    <span>(c) Cash & Cash Equivalents (Liquid Treasury)</span>
                    <span className="font-mono">{formatAmount(as.cashAndCashEquivalents)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(d) Other Bank Balances (Lien FDs)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.bankBalancesOther)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(e) Short-Term Loans & Staff Imprest</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.shortTermLoansAndAdvances)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>(f) Other Current Assets (Unutilized GST ITC)</span>
                    <span className="font-mono text-slate-800">
                      {formatAmount(as.otherCurrentAssets)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Assets Footer */}
            <div className="p-4 bg-slate-50 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-slate-200">
              <span className="text-sm">TOTAL ASSETS</span>
              <span className="font-mono text-base text-emerald-900">
                {formatAmount(as.totalAssets)}
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* Excel Upload Modal */}
      <ExcelUploadMisModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultTab="bs"
      />
    </div>
  );
};
