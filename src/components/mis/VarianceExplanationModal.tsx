import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Building,
  Sparkles,
  Trash2,
  Save,
  Info,
  Calendar,
  IndianRupee,
  Check,
} from "lucide-react";
import { BudgetLineItem, BudgetMonthKey, Role } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatINR, formatVariance } from "../../utils/format";
import { calculateItemVariance, CATEGORY_DEFINITIONS } from "../../data/mockBudgetData";

interface VarianceExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BudgetLineItem | null;
  monthKey: BudgetMonthKey;
  monthLabel: string;
  onSave: (notes: string) => void;
  role: Role;
}

const EXPENSE_REASON_SUGGESTIONS = [
  "Unplanned server & GPU capacity scale-up due to peak user concurrent traffic",
  "Volume-based tier rebate availed; lower effective unit cost negotiated",
  "Annual software subscription / enterprise license renewed upfront",
  "New specialized engineering talent onboarded ahead of original hiring schedule",
  "Supplier invoice delayed; expense accrued to match delivery cycle",
  "Statutory tax advisory and internal audit assessment retainer fee",
  "Raw material price increase due to market commodity fluctuations",
  "One-time office infra overhaul & compliance equipment purchase",
];

const SALES_REASON_SUGGESTIONS = [
  "Enterprise SaaS deal closed ahead of projected cycle schedule",
  "Seasonal uptick in overseas customer onboarding contracts",
  "Pilot contract delayed by client legal approval; pushed to next month",
  "Significant expansion and upsell realized on tier-1 accounts",
];

export const VarianceExplanationModal: React.FC<VarianceExplanationModalProps> = ({
  isOpen,
  onClose,
  item,
  monthKey,
  monthLabel,
  onSave,
  role,
}) => {
  const { addMisRemark, activeCompanyId, currentUser } = useApp();
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (item) {
      setNotes(item.monthly[monthKey]?.notes || "");
    }
  }, [item, monthKey]);

  if (!isOpen || !item) return null;

  const monthData = item.monthly[monthKey] || { budget: 0, actual: 0 };
  const variance = calculateItemVariance(item, monthKey);
  const isBreach = variance.isExceeding5Percent;
  const isSales = item.category === "sales";
  const categoryMeta = CATEGORY_DEFINITIONS[item.category];

  const handleApplySuggestion = (text: string) => {
    setNotes(text);
  };

  const handleSave = () => {
    const trimmed = notes.trim();
    onSave(trimmed);
    if (trimmed) {
      addMisRemark({
        companyId: activeCompanyId,
        section: "budget",
        sectionTitle: "Budget vs Actuals Variance",
        title: `${item.code}: ${item.name} (${monthLabel})`,
        reason: trimmed,
        role: currentUser.role,
        authorName: currentUser.name,
        pageKey: "budget",
        lineRef: `${item.code} - ${item.name}`,
        period: monthLabel,
        reasonCategory: categoryMeta?.name || item.category,
      } as any);
    }
    onClose();
  };

  const handleClear = () => {
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {item.code}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Variance Explanation & Justification
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record operational reasons for monthly budget vs. actual deviations for MIS
                sign-off.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Line Item & Variance Highlights */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Line Item Description
                </span>
                <span className="text-sm font-bold text-slate-900">{item.name}</span>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>
                    Category: <strong>{categoryMeta.name}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Sub-category: <strong>{item.subCategory}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Period: <strong>{monthLabel}</strong>
                  </span>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div className="shrink-0">
                {isBreach ? (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs border ${
                      variance.varianceType === "adverse"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {variance.varianceType === "adverse" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>{variance.alertBadgeText}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    On Track (Within ±5%)
                  </span>
                )}
              </div>
            </div>

            {/* Financial Numbers Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 font-mono text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Budget</span>
                <span className="font-bold text-slate-900">{formatINR(monthData.budget)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Actual</span>
                <span className="font-bold text-slate-900">{formatINR(monthData.actual)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Variance (₹)</span>
                <span
                  className={`font-bold ${variance.varianceAmount >= 0 ? (isSales ? "text-emerald-700" : "text-rose-700") : isSales ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {formatVariance(variance.varianceAmount)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Variance %</span>
                <span
                  className={`font-bold ${variance.variancePercent >= 0 ? (isSales ? "text-emerald-700" : "text-rose-700") : isSales ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {variance.variancePercent > 0 ? "+" : ""}
                  {variance.variancePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Pre-set Operational Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick Operational Reason Presets (Click to autofill):</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Clicking replaces the explanation below
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(isSales ? SALES_REASON_SUGGESTIONS : EXPENSE_REASON_SUGGESTIONS).map(
                (suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 text-[11px] transition-all text-left cursor-pointer shadow-2xs leading-snug"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Explanation Textarea Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="variance-notes-input" className="font-bold text-slate-900">
                Operational Explanation / Audit Note:
              </label>
              <span className="text-[10px] text-slate-400">{notes.length} characters</span>
            </div>

            <textarea
              id="variance-notes-input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Cost overrun caused by unexpected server traffic surge during festive promotion. Reviewed and approved by VP Engineering."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-800 outline-hidden bg-white shadow-2xs transition-all"
              autoFocus
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Author:{" "}
                  <strong className="text-slate-700">
                    {role === "client_team"
                      ? "Client Finance Team (Accounts Operations Desk)"
                      : "Virtual CFO Office"}
                  </strong>
                </span>
              </span>

              {notes && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear note</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Variance Explanation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
