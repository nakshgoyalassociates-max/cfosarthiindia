import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { BudgetLineItem, BudgetMonthKey } from "../../types";
import { BUDGET_MONTHS } from "../../data/mockBudgetData";
import {
  parseActualsFromExcel,
  generateBudgetTemplateExcel,
  ParsedExcelRow,
  MAX_EXCEL_FILE_SIZE_BYTES,
} from "../../utils/excelBudgetHelper";
import { formatINR } from "../../utils/format";

interface ExcelUploadBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonthKey: BudgetMonthKey;
  onMonthChange: (month: BudgetMonthKey) => void;
  budgetItems: BudgetLineItem[];
  companyName: string;
  onApplyActuals: (
    monthKey: BudgetMonthKey,
    rows: Array<{ code?: string; name?: string; actual: number; notes?: string }>,
    fileName?: string,
  ) => void;
}

export const ExcelUploadBudgetModal: React.FC<ExcelUploadBudgetModalProps> = ({
  isOpen,
  onClose,
  targetMonthKey,
  onMonthChange,
  budgetItems,
  companyName,
  onApplyActuals,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<{
    rows: ParsedExcelRow[];
    totalRows: number;
    matchedCount: number;
    unmatchedCount: number;
    breachCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeMonthMeta = BUDGET_MONTHS.find((m) => m.key === targetMonthKey) || BUDGET_MONTHS[5];

  const handleDownloadTemplate = () => {
    generateBudgetTemplateExcel(budgetItems, targetMonthKey, activeMonthMeta.label, companyName);
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setSelectedFile(null);
      setParsedResults(null);
      setParseError("Please upload a valid spreadsheet file (.xlsx, .xls, or .csv).");
      return;
    }

    if (file.size > MAX_EXCEL_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setParsedResults(null);
      setParseError(
        `File rejected: "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB, which exceeds the 5 MB maximum file size limit.`,
      );
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      const results = await parseActualsFromExcel(file, targetMonthKey, budgetItems);
      if (results.totalRows === 0 || results.matchedCount === 0) {
        setParseError(
          `No matching budget line items found in "${file.name}". Ensure the sheet includes valid "Line Item Code" (e.g., REV-01, SAL-01) and "Actual Amount" columns matching the template.`,
        );
      }
      setParsedResults(results);
    } catch (err: any) {
      setParseError(
        err?.message || "Failed to parse Excel file. Please ensure it follows the template format.",
      );
      setParsedResults(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleApply = () => {
    if (!parsedResults || parsedResults.rows.length === 0) return;

    const validRows = parsedResults.rows
      .filter((r) => r.matchStatus === "matched")
      .map((r) => ({
        code: r.code,
        name: r.name,
        actual: r.actual,
        notes: r.notes,
      }));

    onApplyActuals(targetMonthKey, validRows, selectedFile?.name);
    onClose();
    // Reset state
    setSelectedFile(null);
    setParsedResults(null);
    setParseError(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResults(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Upload Monthly Actuals Spreadsheet
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload real monthly accounting data to automatically compute variance against budget
                & trigger &gt;5% variance flags.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Controls: Select Target Month & Download Template */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Select Target Month:
              </label>
              <select
                value={targetMonthKey}
                onChange={(e) => {
                  const newMonth = e.target.value as BudgetMonthKey;
                  onMonthChange(newMonth);
                  if (selectedFile) {
                    // re-process with new month
                    processFile(selectedFile);
                  }
                }}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {BUDGET_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.quarter}) {m.isActualsUploaded ? "• Realized" : "• Pending"}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template for {activeMonthMeta.shortLabel}</span>
            </button>
          </div>

          {/* Error Message when file is rejected before staging (e.g., >5MB or invalid extension) */}
          {!selectedFile && parseError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">File Validation Error</h5>
                <p>{parseError}</p>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Drag and drop your monthly Excel sheet here
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Supports Microsoft Excel (.xlsx, .xls) and standard comma-separated (.csv) files
                with Code, Item Name and Actual Amount.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Browse Files from Device
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {selectedFile.name}
                      <span className="text-[11px] font-normal text-slate-500">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Target Period:{" "}
                      <strong className="text-slate-700">{activeMonthMeta.label}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Parsing State */}
              {isParsing && (
                <div className="p-8 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs">
                    Parsing spreadsheet rows and cross-referencing with budget line items...
                  </p>
                </div>
              )}

              {/* Error Message */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">File Parsing Error</h5>
                    <p>{parseError}</p>
                  </div>
                </div>
              )}

              {/* Parsed Summary Pills */}
              {parsedResults && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Total Rows In File</span>
                      <span className="text-base font-bold text-slate-800">
                        {parsedResults.totalRows}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 font-medium block">
                        Matched Line Items
                      </span>
                      <span className="text-base font-bold text-emerald-900">
                        {parsedResults.matchedCount} / {budgetItems.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] text-amber-700 font-medium block">
                        Variances &gt; 5% Detected
                      </span>
                      <span className="text-base font-bold text-amber-900">
                        {parsedResults.breachCount} Items
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Unmatched Rows</span>
                      <span className="text-base font-bold text-slate-700">
                        {parsedResults.unmatchedCount}
                      </span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Parsed Data Preview (First 8 Rows)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Ready to apply to {activeMonthMeta.label}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Code</th>
                            <th className="py-2 px-3">Line Item</th>
                            <th className="py-2 px-3 text-right">Budget (₹)</th>
                            <th className="py-2 px-3 text-right">Actual (₹)</th>
                            <th className="py-2 px-3 text-right">Variance %</th>
                            <th className="py-2 px-3">Flag (&gt;5%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {parsedResults.rows.slice(0, 12).map((r, idx) => {
                            const isBreach = r.isBreach;
                            const varPct = r.calculatedVariancePercent || 0;
                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-50/70 transition-colors ${
                                  isBreach ? "bg-amber-50/30" : ""
                                }`}
                              >
                                <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                                  {r.code}
                                </td>
                                <td className="py-2 px-3 truncate max-w-[220px]">{r.name}</td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {r.budget !== undefined ? formatINR(r.budget) : "-"}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                  {formatINR(r.actual)}
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-mono font-bold ${
                                    isBreach
                                      ? varPct > 0
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {varPct !== 0
                                    ? `${varPct > 0 ? "+" : ""}${varPct.toFixed(1)}%`
                                    : "0.0%"}
                                </td>
                                <td className="py-2 px-3">
                                  {isBreach ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-max">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      &gt; 5% Breach
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                      On Track (±5%)
                                    </span>
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
            </div>
          )}

          {/* Helpful Instructions */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">
                Automated Variance Engine Guidelines:
              </span>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                The engine matches records using the unique Code (e.g.{" "}
                <span className="font-mono font-bold">REV-01</span>,{" "}
                <span className="font-mono font-bold">DC-01</span>,{" "}
                <span className="font-mono font-bold">FFE-01</span>,{" "}
                <span className="font-mono font-bold">SAL-01</span>,{" "}
                <span className="font-mono font-bold">ADM-01</span>) or item name. Any variance
                exceeding <strong>5.0%</strong> will automatically trigger alerts on both the Budget
                & Variance tab and the CFO executive dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={!parsedResults || parsedResults.matchedCount === 0}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                parsedResults && parsedResults.matchedCount > 0
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>Apply Actuals to {activeMonthMeta.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
