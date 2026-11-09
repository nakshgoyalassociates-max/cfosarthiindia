// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ArrowRight,
  Info,
  Check,
  Scale,
  TrendingUp,
  Users,
  Wallet,
  Building,
  HelpCircle,
  Layers,
} from "lucide-react";
import { FinancialMIS } from "../../types";
import { formatINR, formatLakhs } from "../../utils/format";
import {
  downloadStandardMisExcelTemplate,
  downloadSampleTallyPnlExcel,
  downloadSampleTallyBalanceSheetExcel,
  parseStandardMisExcel,
  MisParsedResult,
} from "../../utils/misExcelTemplateHelper";

interface ExcelUploadMisModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "kpis" | "pnl" | "bs" | "debtors" | "cashflow" | "guide";
}

export const ExcelUploadMisModal: React.FC<ExcelUploadMisModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "kpis",
}) => {
  const {
    financialMIS,
    updateFinancialMIS,
    createMisUpload,
    overrideFinancialMIS,
    clientProfile,
    role,
    currentUser,
    addAuditLog,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [isOverrideMode, setIsOverrideMode] = useState(true);
  const [parsedResult, setParsedResult] = useState<MisParsedResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<
    "kpis" | "pnl" | "bs" | "debtors" | "cashflow" | "guide"
  >(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActivePreviewTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    try {
      const companyName = clientProfile?.companyName || "Company";
      const fileName = downloadStandardMisExcelTemplate(
        companyName,
        financialMIS.period || "September 2026",
      );
      showToast(`Downloaded ERP standard template: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Error generating Excel template");
    }
  };

  const handleDownloadSampleTallyPnl = () => {
    try {
      const companyName = clientProfile?.companyName || "Company";
      const fileName = downloadSampleTallyPnlExcel(companyName);
      showToast(`Downloaded Sample Tally P&L: ${fileName} — Upload it below to test!`);
    } catch (err) {
      console.error(err);
      showToast("Error generating Sample Tally P&L");
    }
  };

  const handleDownloadSampleTallyBalanceSheet = () => {
    try {
      const companyName = clientProfile?.companyName || "Company";
      const fileName = downloadSampleTallyBalanceSheetExcel(companyName);
      showToast(
        `Downloaded Sample Balance Sheet: ${fileName} — Upload it below to fill Balance Sheet!`,
      );
    } catch (err) {
      console.error(err);
      showToast("Error generating Sample Balance Sheet");
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError("Please upload a valid Excel or CSV spreadsheet (.xlsx, .xls, .csv).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setParsedResult(null);
      setParseError(
        `File rejected: "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB, which exceeds the 5 MB maximum file size limit.`,
      );
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseStandardMisExcel(file);
      if (result.detectedSheets.length === 0) {
        throw new Error(
          "Could not detect recognized MIS statements. Please use the standard template or ensure sheet names include 'Profit & Loss', 'Balance Sheet', 'Debtors', or 'Cash Flow'.",
        );
      }
      setParsedResult(result);

      // Auto-switch preview tab if Balance Sheet was uploaded
      if (result.balanceSheet && (!result.pnlStatement || defaultTab === "bs")) {
        setActivePreviewTab("bs");
      } else if (result.pnlStatement && !result.balanceSheet) {
        setActivePreviewTab("pnl");
      }

      showToast(`Parsed ${result.detectedSheets.length} statement(s) from ${file.name}`);
    } catch (err: unknown) {
      console.error("Excel parse error:", err);
      setParseError(
        err instanceof Error
          ? err.message
          : "Failed to parse the uploaded Excel file. Please verify structure.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (!parsedResult) return;

    const { summaryKPIs, pnlStatement, balanceSheet, debtorAgeing, fundFlow, period } =
      parsedResult;

    const updatedPayload: Partial<FinancialMIS> = {
      period: period || financialMIS.period || "September 2026",
    };

    if (summaryKPIs.monthlyRevenue > 0) {
      updatedPayload.monthlyRevenue = summaryKPIs.monthlyRevenue;
      updatedPayload.grossMarginPercent = summaryKPIs.grossMarginPercent;
      updatedPayload.ebitda = summaryKPIs.ebitda;
      updatedPayload.ebitdaMarginPercent = summaryKPIs.ebitdaMarginPercent;
      updatedPayload.netProfit = summaryKPIs.pat;
    }

    if (summaryKPIs.cashAndBankBalance > 0) {
      updatedPayload.cashAndBankBalance = summaryKPIs.cashAndBankBalance;
    }

    if (summaryKPIs.totalDebtors > 0) {
      updatedPayload.totalDebtors = summaryKPIs.totalDebtors;
      updatedPayload.debtorsOver90Days = summaryKPIs.debtorsOver90Days;
    }

    if (summaryKPIs.totalCreditors > 0) {
      updatedPayload.totalCreditors = summaryKPIs.totalCreditors;
    }

    if (summaryKPIs.workingCapital !== 0) {
      updatedPayload.workingCapital = summaryKPIs.workingCapital;
    }

    // Attach complete rich statement data
    if (pnlStatement) updatedPayload.pnlStatement = pnlStatement;
    if (balanceSheet) {
      updatedPayload.balanceSheet = balanceSheet;
      if (summaryKPIs.totalAssets > 0) {
        if (summaryKPIs.cashAndBankBalance > 0) {
          updatedPayload.cashAndBankBalance = summaryKPIs.cashAndBankBalance;
        }
        if (summaryKPIs.workingCapital !== 0) {
          updatedPayload.workingCapital = summaryKPIs.workingCapital;
        }
        if (summaryKPIs.totalCreditors > 0) {
          updatedPayload.totalCreditors = summaryKPIs.totalCreditors;
        }
        if (summaryKPIs.totalDebtors > 0) {
          updatedPayload.totalDebtors = summaryKPIs.totalDebtors;
        }
      }
      if (parsedResult.tallyLedgers && parsedResult.tallyLedgers.length > 0) {
        const existingNonBs = (financialMIS.tallyLedgers || []).filter(
          (l) => l.statementType !== "Balance Sheet",
        );
        const incomingBs = parsedResult.tallyLedgers.filter(
          (l) => l.statementType === "Balance Sheet",
        );
        updatedPayload.tallyLedgers = [...existingNonBs, ...incomingBs];
      }
    }
    if (debtorAgeing) updatedPayload.debtorAgeing = debtorAgeing;
    if (fundFlow) updatedPayload.fundFlow = fundFlow;

    if (isOverrideMode) {
      void overrideFinancialMIS(
        clientProfile?.id || "client-101",
        updatedPayload,
        {
          fileName: parsedResult.fileName || "ERP_MIS_Upload.xlsx",
          period: updatedPayload.period || "September 2026",
          autoApprove: role === "cfo",
          overridePrevious: true,
        },
      );
    } else {
      void createMisUpload({
        companyId: clientProfile?.id || "client-101",
        period: updatedPayload.period || "September 2026",
        statementType: "erp_mis",
        fileName: parsedResult.fileName || "ERP_MIS_Upload.xlsx",
        rows: updatedPayload,
        rowCount: parsedResult.detectedSheets.length,
        status: role === "cfo" ? "approved" : "pending_review",
      });
      updateFinancialMIS(updatedPayload);
    }

    addAuditLog(
      "EXCEL_UPLOAD_MIS",
      `Statements ${isOverrideMode ? "OVERRIDDEN" : "imported"} from ${parsedResult.fileName}: ${parsedResult.detectedSheets.join(", ")}. Uploaded by ${currentUser?.name || "Account Manager"}. Note: ${uploadNote || "Automated sync from Accounting ERP"}`,
    );

    const isOnlyBs = Boolean(balanceSheet && !pnlStatement);
    showToast(
      isOverrideMode
        ? `Financial MIS successfully overridden with fresh data from ${parsedResult.fileName}!`
        : isOnlyBs
          ? `Balance Sheet successfully updated from ${parsedResult.fileName}!`
          : `Financial MIS statements updated from ${parsedResult.fileName}!`,
    );
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  Standard MIS Excel Import & Central ERP Source
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Tally / ERP Compatible
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly upload your Accounting ERP export (P&L, Balance Sheet, Debtors Ageing &
                Cash Flow) as the single source of truth for all MIS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Action Row: Download Template Banner */}
          <div className="bg-linear-to-r from-emerald-950/90 via-slate-900 to-slate-900 rounded-xl p-4 text-white border border-emerald-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Zero Effort for Account Managers
                </span>
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded">
                  Schedule III & Tally Compatible
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Download pre-formatted Excel templates for Balance Sheet or P&L, or copy-paste directly
                from Tally Prime / Zoho Books / SAP exports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadSampleTallyBalanceSheet}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample Balance Sheet (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadSampleTallyPnl}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample P&L (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Full MIS Template (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* File Upload Dropzone */}
          {!parsedResult ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60"
                    : "border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Click to browse or drag & drop your ERP MIS spreadsheet
                  </h4>
                  <p className="text-xs text-slate-500">
                    Supports <strong>.xlsx, .xls, .csv</strong> (Standard Template, Tally Prime P&L,
                    Balance Sheet, Debtors Ageing, Cash Flow)
                  </p>
                </div>

                {isParsing && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing multi-sheet ERP financial data...</span>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Upload Error:</strong> {parseError}
                  </div>
                </div>
              )}

              {/* Quick ERP Instruction Guide */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>How to export directly from Tally Prime in 2 minutes:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">1. Profit & Loss</span>
                    <p className="text-slate-600">
                      Gateway of Tally &gt; P&L A/c &gt; Alt+E &gt; Export as Excel Spreadsheet.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">2. Balance Sheet</span>
                    <p className="text-slate-600">
                      Gateway of Tally &gt; Balance Sheet &gt; Alt+F1 (Detailed) &gt; Alt+E &gt;
                      Excel.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">3. Debtors Ageing</span>
                    <p className="text-slate-600">
                      Statement of Accounts &gt; Outstandings &gt; Receivables &gt; F6 (Age-wise)
                      &gt; Alt+E.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">4. Cash Flow</span>
                    <p className="text-slate-600">
                      Gateway of Tally &gt; Cash/Funds Flow &gt; Cash Flow &gt; Alt+E.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Parsed Review Dashboard */
            <div className="space-y-5">
              {/* File Info & Diagnostics Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{parsedResult.fileName}</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {parsedResult.detectedSheets.length} Statements Detected
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Detected: {parsedResult.detectedSheets.join(", ")}</span>
                      <span>•</span>
                      <span>Period: {parsedResult.period}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>

              {/* 4 Statements Health Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* P&L */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    parsedResult.validation.hasPnl
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Profit & Loss</span>
                    </span>
                    {parsedResult.validation.hasPnl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not in file</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Revenue:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.monthlyRevenue)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>PAT (Net Profit):</span>
                      <strong className="text-emerald-700">
                        {formatINR(parsedResult.summaryKPIs.pat)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    parsedResult.validation.hasBs
                      ? parsedResult.validation.isBsBalanced
                        ? "bg-blue-50/50 border-blue-200 text-blue-950"
                        : "bg-amber-50/70 border-amber-300 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      <span>Balance Sheet</span>
                    </span>
                    {parsedResult.validation.hasBs ? (
                      parsedResult.validation.isBsBalanced ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          ✓ Balanced
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          ⚠️ Discrepancy
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400">Not in file</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Assets:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.totalAssets)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Liabilities:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.totalLiabilities)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Debtors Ageing */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    parsedResult.validation.hasDebtors
                      ? "bg-purple-50/50 border-purple-200 text-purple-950"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      <span>Debtors Ageing</span>
                    </span>
                    {parsedResult.validation.hasDebtors ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                        ✓ {parsedResult.validation.debtorsCount} Parties
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not in file</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Receivables:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.totalDebtors)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Overdue &gt;90d:</span>
                      <strong className="text-rose-700">
                        {formatINR(parsedResult.summaryKPIs.debtorsOver90Days)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Cash Flow */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    parsedResult.validation.hasCashFlow
                      ? "bg-amber-50/50 border-amber-200 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                      <Wallet className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cash / Fund Flow</span>
                    </span>
                    {parsedResult.validation.hasCashFlow ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        ✓ Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not in file</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Closing Cash & Bank:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.cashAndBankBalance)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Working Capital:</span>
                      <strong className="text-slate-900">
                        {formatINR(parsedResult.summaryKPIs.workingCapital)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Notice if any */}
              {parsedResult.validation.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Audit Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800">
                    {parsedResult.validation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tab Navigation for Detailed Preview */}
              <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { key: "kpis", label: "Executive KPIs" },
                  { key: "pnl", label: "Profit & Loss Lines" },
                  { key: "bs", label: "Balance Sheet Preview" },
                  { key: "debtors", label: `Debtors (${parsedResult.validation.debtorsCount})` },
                  { key: "cashflow", label: "Cash Flow Preview" },
                  { key: "guide", label: "Tally Prime ERP Guide" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActivePreviewTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      activePreviewTab === tab.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[160px] text-xs">
                {activePreviewTab === "kpis" && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900">
                      Key Performance Metrics to be Applied
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">Monthly Revenue</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.monthlyRevenue)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">Operating EBITDA</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.ebitda)} (
                          {parsedResult.summaryKPIs.ebitdaMarginPercent}%)
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">PAT (Net Profit)</span>
                        <span className="text-sm font-bold text-emerald-700">
                          {formatINR(parsedResult.summaryKPIs.pat)} (
                          {parsedResult.summaryKPIs.patMarginPercent}%)
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">
                          Cash & Bank Balance
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.cashAndBankBalance)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">Total Debtors</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.totalDebtors)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">
                          Overdue &gt; 90 Days
                        </span>
                        <span className="text-sm font-bold text-rose-700">
                          {formatINR(parsedResult.summaryKPIs.debtorsOver90Days)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">Total Assets</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.totalAssets)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10.5px]">Working Capital</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parsedResult.summaryKPIs.workingCapital)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "pnl" && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900">
                      P&L Statement Lines ({parsedResult.pnlStatement?.lineItems.length || 0} parsed
                      lines)
                    </h5>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Particulars</th>
                            <th className="py-2 px-3 text-right">Current Month (₹)</th>
                            <th className="py-2 px-3 text-right">Previous Month (₹)</th>
                            <th className="py-2 px-3 text-right">YTD (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedResult.pnlStatement?.lineItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-medium text-slate-800">
                                {item.particulars}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                                {item.currentMonth.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                {item.previousMonth.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                {item.ytdCurrentYear.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activePreviewTab === "bs" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">Balance Sheet Statement</h5>
                        <p className="text-[11px] text-slate-500">
                          As of {parsedResult.balanceSheet?.asOfDate || parsedResult.period} (Comparative with {parsedResult.balanceSheet?.previousDate || "31 March 2026"})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            parsedResult.validation.isBsBalanced
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {parsedResult.validation.isBsBalanced
                            ? "✓ Balance Sheet Tallied"
                            : `Discrepancy: ₹${parsedResult.validation.bsDifference.toLocaleString("en-IN")}`}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                          Working Capital: ₹{parsedResult.summaryKPIs.workingCapital.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Liabilities Side */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between border-b pb-1.5 font-bold text-slate-900">
                          <span>I. Equity & Liabilities</span>
                          <span className="font-mono text-indigo-700">
                            ₹{parsedResult.summaryKPIs.totalLiabilities.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-slate-600 text-[11.5px]">
                          <div className="flex justify-between font-semibold text-slate-800 pt-1">
                            <span>1. Shareholders' Funds (Net Worth):</span>
                            <span className="font-mono">
                              ₹
                              {(
                                (parsedResult.balanceSheet?.equityAndLiabilities.shareCapital || 0) +
                                (parsedResult.balanceSheet?.equityAndLiabilities.reservesAndSurplus || 0)
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Equity Share Capital:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.shareCapital.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Reserves & Surplus:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.reservesAndSurplus.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex justify-between font-semibold text-slate-800 pt-1">
                            <span>2. Non-Current Liabilities:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.longTermBorrowings.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Long-Term Bank Term Loans:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.longTermBorrowings.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex justify-between font-semibold text-slate-800 pt-1">
                            <span>3. Current Liabilities:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.totalCurrentLiabilities.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Short-Term Borrowings (CC/OD):</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.shortTermBorrowings.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {Boolean(parsedResult.balanceSheet?.equityAndLiabilities.currentMaturitiesOfLongTermDebt) && (
                            <div className="flex justify-between pl-3 text-slate-500">
                              <span>• Current Maturities (CMLTD):</span>
                              <span className="font-mono">
                                ₹
                                {parsedResult.balanceSheet?.equityAndLiabilities.currentMaturitiesOfLongTermDebt?.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Trade Payables (Sundry Creditors):</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.tradePayables.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• MSME Payables (Sec 43B(h)):</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.tradePayablesMsme.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Statutory Dues & Other Current Liab:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.otherCurrentLiabilities.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Short-Term Provisions:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.equityAndLiabilities.shortTermProvisions.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Assets Side */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between border-b pb-1.5 font-bold text-slate-900">
                          <span>II. Assets</span>
                          <span className="font-mono text-emerald-700">
                            ₹{parsedResult.summaryKPIs.totalAssets.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-slate-600 text-[11.5px]">
                          <div className="flex justify-between font-semibold text-slate-800 pt-1">
                            <span>1. Non-Current Assets:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.assets.totalNonCurrentAssets.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Net Property, Plant & Equipment:</span>
                            <span className="font-mono">
                              ₹{parsedResult.balanceSheet?.assets.netPpe.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {Boolean(parsedResult.balanceSheet?.assets.capitalWorkInProgress) && (
                            <div className="flex justify-between pl-3 text-slate-500">
                              <span>• Capital Work-in-Progress (CWIP):</span>
                              <span className="font-mono">
                                ₹{parsedResult.balanceSheet?.assets.capitalWorkInProgress.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          {Boolean(parsedResult.balanceSheet?.assets.nonCurrentInvestments) && (
                            <div className="flex justify-between pl-3 text-slate-500">
                              <span>• Non-Current Investments:</span>
                              <span className="font-mono">
                                ₹{parsedResult.balanceSheet?.assets.nonCurrentInvestments.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          {Boolean(parsedResult.balanceSheet?.assets.longTermLoansAndAdvances) && (
                            <div className="flex justify-between pl-3 text-slate-500">
                              <span>• Long-Term Loans & Advances:</span>
                              <span className="font-mono">
                                ₹{parsedResult.balanceSheet?.assets.longTermLoansAndAdvances.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between font-semibold text-slate-800 pt-1">
                            <span>2. Current Assets:</span>
                            <span className="font-mono">
                              ₹
                              {parsedResult.balanceSheet?.assets.totalCurrentAssets.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Inventories (Stock-in-Hand):</span>
                            <span className="font-mono">
                              ₹{parsedResult.balanceSheet?.assets.inventories.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Trade Receivables (Sundry Debtors):</span>
                            <span className="font-mono">
                              ₹{parsedResult.balanceSheet?.assets.tradeReceivables.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Cash & Bank Operating Balances:</span>
                            <span className="font-mono">
                              ₹{parsedResult.balanceSheet?.assets.cashAndCashEquivalents.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Other Bank Balances (FDs / Deposits):</span>
                            <span className="font-mono">
                              ₹{parsedResult.balanceSheet?.assets.bankBalancesOther.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between pl-3 text-slate-500">
                            <span>• Short-Term Loans, Advances & Other:</span>
                            <span className="font-mono">
                              ₹
                              {(
                                (parsedResult.balanceSheet?.assets.shortTermLoansAndAdvances || 0) +
                                (parsedResult.balanceSheet?.assets.otherCurrentAssets || 0)
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "debtors" && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900">
                      Debtors Register ({parsedResult.debtorAgeing?.topDebtors.length || 0}{" "}
                      Accounts)
                    </h5>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Customer Party</th>
                            <th className="py-2 px-3 text-right">Total Outstanding</th>
                            <th className="py-2 px-3 text-right">0-30d</th>
                            <th className="py-2 px-3 text-right">31-60d</th>
                            <th className="py-2 px-3 text-right">61-90d</th>
                            <th className="py-2 px-3 text-right">&gt;90d</th>
                            <th className="py-2 px-3">Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedResult.debtorAgeing?.topDebtors.map((d, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-medium text-slate-900 truncate max-w-xs">
                                {d.customerName}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                {d.totalOutstanding.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                {d.bucket0to30.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                {d.bucket31to60.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                {d.bucket61to90.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-rose-700 font-bold">
                                {(d.bucket91to180 + d.bucketAbove180).toLocaleString("en-IN")}
                              </td>
                              <td className="py-1.5 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    d.riskRating === "High"
                                      ? "bg-rose-100 text-rose-800"
                                      : d.riskRating === "Medium"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {d.riskRating}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activePreviewTab === "cashflow" && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900">Cash & Fund Flow Summary</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 block text-[10px] font-bold uppercase">
                          Operating Inflows (Sources)
                        </span>
                        <span className="text-base font-bold text-slate-900">
                          ₹{parsedResult.fundFlow?.sources.totalSources.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                        <span className="text-rose-700 block text-[10px] font-bold uppercase">
                          Capex & Repayments (Applications)
                        </span>
                        <span className="text-base font-bold text-slate-900">
                          ₹
                          {parsedResult.fundFlow?.applications.totalApplications.toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-700 block text-[10px] font-bold uppercase">
                          Closing Liquid Cash & Bank
                        </span>
                        <span className="text-base font-bold text-slate-900">
                          ₹{parsedResult.fundFlow?.closingCashAndBank.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "guide" && (
                  <div className="space-y-3 text-slate-700">
                    <h5 className="font-bold text-slate-900">
                      Tally Prime Direct Export & Upload Guide
                    </h5>
                    <p className="text-xs">
                      The account manager can export reports in Excel format directly from Tally
                      Prime:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-xs">
                      <li>
                        <strong>P&L:</strong> Open <em>Profit & Loss A/c</em> &gt; Press{" "}
                        <strong>Alt+F1</strong> (detailed) &gt; Press <strong>Alt+E</strong> &gt;
                        Select <em>Excel (Spreadsheet)</em>.
                      </li>
                      <li>
                        <strong>Balance Sheet:</strong> Open <em>Balance Sheet</em> &gt; Press{" "}
                        <strong>Alt+F1</strong> &gt; Press <strong>Alt+E</strong>.
                      </li>
                      <li>
                        <strong>Debtors Ageing:</strong> Go to{" "}
                        <em>
                          Display More Reports &gt; Statement of Accounts &gt; Outstandings &gt;
                          Receivables
                        </em>{" "}
                        &gt; Press <strong>F6 (Age-wise)</strong> &gt; Press <strong>Alt+E</strong>.
                      </li>
                      <li>
                        <strong>Cash Flow:</strong> Go to{" "}
                        <em>Display More Reports &gt; Cash/Funds Flow &gt; Cash Flow</em> &gt; Press{" "}
                        <strong>Alt+E</strong>.
                      </li>
                      <li>
                        Upload the exported workbook here. The system will automatically ingest all
                        figures into the unified executive view.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Override Existing Data Toggle */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/90 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="overrideMisCheckbox"
                  checked={isOverrideMode}
                  onChange={(e) => setIsOverrideMode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="overrideMisCheckbox" className="text-xs text-indigo-950 cursor-pointer select-none">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>Override existing Financial MIS data for this period</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900">
                      Recommended
                    </span>
                  </span>
                  <span className="text-[11px] text-indigo-700 block mt-0.5 leading-relaxed">
                    When enabled, figures from this upload will cleanly supersede and replace existing statements for{" "}
                    <strong>{parsedResult?.period || financialMIS.period || "this period"}</strong>. Previous uploads will be archived as superseded.
                  </span>
                </label>
              </div>

              {/* Upload note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Account Manager's Note / ERP Audit Reference (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reconciled with Tally Prime trial balance as on 31 August 2026"
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Updates Balance Sheet, P&L, Debtors Ageing & Cash Flow across all dashboards
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {parsedResult && (
              <button
                onClick={handleApplyImport}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Apply & Update All MIS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
