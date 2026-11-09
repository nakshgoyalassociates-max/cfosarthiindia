import React, { useState, useRef, useEffect } from "react";
import { ExpenseProvisionCategory, ExpenseProvisionItem, ClientProfile } from "../../types";
import {
  PROVISION_CATEGORY_CONFIG,
  downloadProvisionsExcelTemplate,
  parseProvisionsExcel,
  INITIAL_EXPENSE_PROVISIONS,
} from "../../utils/pnlProvisionsHelper";
import { formatINR } from "../../utils/format";
import {
  X,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
} from "lucide-react";

interface PnlProvisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provisions: ExpenseProvisionItem[];
  onAddProvision: (prov: Omit<ExpenseProvisionItem, "id" | "addedAt">) => void;
  onUpdateProvision: (id: string, updates: Partial<ExpenseProvisionItem>) => void;
  onDeleteProvision: (id: string) => void;
  onBulkUploadProvisions: (items: ExpenseProvisionItem[], mode: "append" | "replace") => void;
  clientProfile?: ClientProfile;
  availableMonths?: string[];
  currentMonth?: string;
  showToast: (msg: string) => void;
  initialTab?: "add" | "upload" | "list";
}

export const PnlProvisionsModal: React.FC<PnlProvisionsModalProps> = ({
  isOpen,
  onClose,
  provisions,
  onAddProvision,
  onUpdateProvision,
  onDeleteProvision,
  onBulkUploadProvisions,
  clientProfile,
  currentMonth = "September 2026",
  showToast,
  initialTab = "list",
}) => {
  const [showUploadPanel, setShowUploadPanel] = useState(initialTab === "upload");

  useEffect(() => {
    if (isOpen) {
      setShowUploadPanel(initialTab === "upload");
    }
  }, [isOpen, initialTab]);

  // Quick Add Row State (bottom of table)
  const [newHeadName, setNewHeadName] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseProvisionCategory>("other_expenses");
  const [newAmount, setNewAmount] = useState<string>("");
  const [newRemarks, setNewRemarks] = useState("");
  const [newIsUtility, setNewIsUtility] = useState(false);

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedUploadItems, setParsedUploadItems] = useState<ExpenseProvisionItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    try {
      const company = clientProfile?.companyName || "Company";
      const name = downloadProvisionsExcelTemplate(company, currentMonth, provisions);
      showToast(`Downloaded Excel provision template: ${name}`);
    } catch (err) {
      console.error(err);
      showToast("Error generating provision template");
    }
  };

  const handleResetDefaults = () => {
    onBulkUploadProvisions(
      INITIAL_EXPENSE_PROVISIONS.map((p) => ({ ...p, month: currentMonth })),
      "replace",
    );
    showToast("Reset to default Expense Heads & Fixed Utility Expenses");
  };

  const handleQuickAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName.trim()) {
      showToast("Please enter an expense head name");
      return;
    }
    const numAmt = Math.max(0, Number(newAmount) || 0);
    onAddProvision({
      expenseHead: newHeadName.trim(),
      category: newCategory,
      month: currentMonth,
      amount: numAmt,
      remarks:
        newRemarks.trim() ||
        (newIsUtility ? "Fixed utility provision (editable)" : "Manual expense provision"),
      addedBy: newIsUtility ? "Fixed Utility" : "Manual Entry",
      status: "active",
      isDefaultFixedUtility: newIsUtility,
      isCoreExpenseHead: true,
    });
    setNewHeadName("");
    setNewAmount("");
    setNewRemarks("");
    setNewIsUtility(false);
    showToast(`Added "${newHeadName.trim()}" to Expense Provisioning`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadError("Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)");
      setShowUploadPanel(true);
      return;
    }

    setShowUploadPanel(true);
    setUploadFile(file);
    setIsParsing(true);
    setUploadError(null);

    try {
      const parsed = await parseProvisionsExcel(file);
      setParsedUploadItems(parsed);
      showToast(`Parsed ${parsed.length} expense head provisions from ${file.name}`);
    } catch (err: unknown) {
      console.error("Parse error:", err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to parse provisions Excel sheet.",
      );
      setParsedUploadItems([]);
    } finally {
      setIsParsing(false);
      e.target.value = "";
    }
  };

  const handleConfirmUpload = () => {
    if (parsedUploadItems.length === 0) return;
    onBulkUploadProvisions(parsedUploadItems, uploadMode);
    setUploadFile(null);
    setParsedUploadItems([]);
    setShowUploadPanel(false);
    showToast(`Updated ${parsedUploadItems.length} expense provisions from Excel template.`);
  };

  const totalActiveAmount = provisions
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const fixedUtilityTotal = provisions
    .filter((p) => p.status === "active" && p.isDefaultFixedUtility)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-base font-bold text-white">
                  MIS Expense Provisioning — Manual &amp; Excel Template
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                  Total Provision: ₹{(totalActiveAmount / 100000).toFixed(2)} L
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  Fixed Utility: ₹{(fixedUtilityTotal / 100000).toFixed(2)} L
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Download Excel template with all Expense Heads and Fixed Utility Expenses"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel Template</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Upload filled Provision Excel template (.xlsx, .csv)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Provision Excel</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: Mode Switch & Quick Info */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUploadPanel(false)}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                !showUploadPanel
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Manual Provision by Expense Head ({provisions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUploadPanel(true)}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                showUploadPanel
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload via Excel Template</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Period: <strong className="text-slate-800">{currentMonth}</strong>
            </span>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-200/60 cursor-pointer"
              title="Restore default Fixed Utility Expenses and standard P&L Expense Heads"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          {/* EXCEL UPLOAD PANEL (when toggled or file selected) */}
          {showUploadPanel && (
            <div className="bg-white rounded-xl border-2 border-amber-300 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Upload Expense Provisions via Excel Template (.xlsx / .csv)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download the pre-filled Excel template (includes Fixed Utility Expenses &amp;
                    all Expense Heads), enter your provision figures, and upload it back.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>1. Download Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>2. Select Excel File</span>
                  </button>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-6 bg-amber-50/30 hover:bg-amber-50/60 text-center cursor-pointer transition-colors space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Click to browse or drop your completed Expense Provision Excel file (.xlsx,
                    .xls, .csv)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Matches each Expense Head &amp; Fixed Utility row automatically and updates
                    P&amp;L provisions.
                  </p>
                </div>
                {uploadFile && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{uploadFile.name}</span>
                  </div>
                )}
              </div>

              {isParsing && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-600 animate-pulse">
                  Reading Excel template rows...
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {parsedUploadItems.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">
                        Preview ({parsedUploadItems.length} Expense Heads Parsed)
                      </span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-slate-600">
                        Total Provision:{" "}
                        <strong className="text-amber-800 font-mono">
                          ₹
                          {(parsedUploadItems.reduce((s, p) => s + p.amount, 0) / 100000).toFixed(
                            2,
                          )}{" "}
                          Lakhs
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="provUploadMode"
                          checked={uploadMode === "append"}
                          onChange={() => setUploadMode("append")}
                          className="text-amber-600"
                        />
                        <span className="font-medium text-slate-700">Update matching heads</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="provUploadMode"
                          checked={uploadMode === "replace"}
                          onChange={() => setUploadMode("replace")}
                          className="text-amber-600"
                        />
                        <span className="font-medium text-slate-700">Replace all provisions</span>
                      </label>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Expense Head</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Provision Amount (₹)</th>
                          <th className="py-2 px-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedUploadItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.expenseHead}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {PROVISION_CATEGORY_CONFIG[item.category]?.shortLabel ||
                                item.category}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                              {formatINR(item.amount, false)}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                              {item.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setParsedUploadItems([]);
                      }}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUpload}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply Uploaded Provisions to P&amp;L</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN SIMPLE TABLE: MANUAL PROVISION AGAINST EACH EXPENSE HEAD + FIXED UTILITY BY DEFAULT */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">
                  Direct Manual Provision Entry by Expense Head (Type amount directly in ₹)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                <strong className="text-emerald-700">Fixed Utility Expenses</strong> are pre-filled
                by default &amp; editable inline • Changes apply immediately to P&amp;L
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 min-w-[260px]">
                      Expense Head &amp; Fixed Utility Default
                    </th>
                    <th className="py-2.5 px-3 min-w-[150px]">P&amp;L Category</th>
                    <th className="py-2.5 px-3 text-right min-w-[175px] bg-amber-50/60 text-amber-950 border-x border-amber-200/70">
                      Manual Provision (₹)
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[100px]">In Lakhs</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Remarks / Basis (Editable)</th>
                    <th className="py-2.5 px-3 text-center w-20">Include</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {provisions.map((item) => {
                    const catCfg =
                      PROVISION_CATEGORY_CONFIG[item.category] ||
                      PROVISION_CATEGORY_CONFIG.other_expenses;
                    const isFixedUtility = !!item.isDefaultFixedUtility;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          item.status !== "active"
                            ? "opacity-55 bg-slate-50"
                            : isFixedUtility
                              ? "bg-emerald-50/35 hover:bg-emerald-50/60"
                              : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Expense Head Name (Editable for Fixed Utility or Custom rows) */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isFixedUtility ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                  Fixed Utility (Default • Editable)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  Expense Head
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.expenseHead}
                              onChange={(e) =>
                                onUpdateProvision(item.id, {
                                  expenseHead: e.target.value,
                                })
                              }
                              className="w-full font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-1.5 py-0.5 text-xs focus:outline-none transition-colors"
                              title="Click to edit expense head name"
                            />
                          </div>
                        </td>

                        {/* 2. P&L Category Selector */}
                        <td className="py-2.5 px-3">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              onUpdateProvision(item.id, {
                                category: e.target.value as ExpenseProvisionCategory,
                              })
                            }
                            className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${catCfg.badgeCls}`}
                          >
                            <option value="cost_of_materials">Direct Costs / COGS</option>
                            <option value="employee_benefits">Employee &amp; Payroll</option>
                            <option value="cloud_infrastructure">Cloud &amp; Tech Infra</option>
                            <option value="sales_marketing">Sales &amp; Marketing</option>
                            <option value="other_expenses">Admin &amp; Fixed Utility</option>
                            <option value="finance_costs">Finance Costs</option>
                            <option value="tax_provision">Tax Provision</option>
                          </select>
                        </td>

                        {/* 3. Direct Manual Provision Input (₹) */}
                        <td className="py-2.5 px-3 bg-amber-50/30 border-x border-amber-100">
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-slate-400 font-mono text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={item.amount === 0 ? "" : item.amount}
                              placeholder="0"
                              onChange={(e) => {
                                const val =
                                  e.target.value === "" ? 0 : Math.max(0, Number(e.target.value));
                                onUpdateProvision(item.id, { amount: val });
                              }}
                              className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded-lg text-right font-mono font-bold text-slate-900 text-xs tabular-nums focus:outline-none shadow-2xs"
                            />
                          </div>
                        </td>

                        {/* 4. In Lakhs Readout */}
                        <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums">
                          {item.amount > 0 ? (
                            <span className="font-bold text-amber-800">
                              ₹{(item.amount / 100000).toFixed(2)} L
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0.00 L</span>
                          )}
                        </td>

                        {/* 5. Editable Remarks / Note */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.remarks || ""}
                            placeholder="Add note / basis..."
                            onChange={(e) =>
                              onUpdateProvision(item.id, {
                                remarks: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded text-xs text-slate-700 focus:outline-none transition-colors"
                          />
                        </td>

                        {/* 6. Active Toggle & Delete (for custom rows) */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={item.status === "active"}
                              onChange={() =>
                                onUpdateProvision(item.id, {
                                  status: item.status === "active" ? "inactive" : "active",
                                })
                              }
                              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                              title={
                                item.status === "active"
                                  ? "Included in P&L (Click to exclude)"
                                  : "Excluded from P&L (Click to include)"
                              }
                            />
                            {!item.isCoreExpenseHead && (
                              <button
                                type="button"
                                onClick={() => onDeleteProvision(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Remove custom row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Quick Inline Row to Add Another Expense / Utility Head */}
                  <tr className="bg-slate-50/90 border-t-2 border-slate-200">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newHeadName}
                          onChange={(e) => setNewHeadName(e.target.value)}
                          placeholder="+ Add another expense or utility head..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                        <label className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newIsUtility}
                            onChange={(e) => setNewIsUtility(e.target.checked)}
                            className="accent-emerald-600"
                          />
                          <span>Utility</span>
                        </label>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as ExpenseProvisionCategory)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        <option value="other_expenses">Admin &amp; Fixed Utility</option>
                        <option value="cost_of_materials">Direct Costs / COGS</option>
                        <option value="employee_benefits">Employee &amp; Payroll</option>
                        <option value="cloud_infrastructure">Cloud &amp; Tech Infra</option>
                        <option value="sales_marketing">Sales &amp; Marketing</option>
                        <option value="finance_costs">Finance Costs</option>
                        <option value="tax_provision">Tax Provision</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 bg-amber-50/30 border-x border-amber-100">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-slate-400 font-mono text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          placeholder="Amount (₹)"
                          className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-mono text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                      {Number(newAmount) > 0
                        ? `₹${(Number(newAmount) / 100000).toFixed(2)} L`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={newRemarks}
                        onChange={(e) => setNewRemarks(e.target.value)}
                        placeholder="Remarks (optional)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={handleQuickAddRow}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                        title="Add new expense head row"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-4 text-slate-600">
            <span>
              Total Active Provisions:{" "}
              <strong className="text-slate-900 font-mono">
                {formatINR(totalActiveAmount, false)} (₹
                {(totalActiveAmount / 100000).toFixed(2)} Lakhs)
              </strong>
            </span>
            <span>•</span>
            <span>
              Default Fixed Utility Included:{" "}
              <strong className="text-emerald-700 font-mono">
                {formatINR(fixedUtilityTotal, false)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Done &amp; Apply to P&amp;L</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
