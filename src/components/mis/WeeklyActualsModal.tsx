import React, { useState, useEffect } from "react";
import { ThreeMonthCashBudgetModel, CashFlowWeekMeta, WeeklyCashFlowLineItem } from "../../types";
import { formatINR } from "../../utils/format";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Save,
  Calendar,
  Lock,
  Unlock,
  Building2,
  FileText,
} from "lucide-react";

interface WeeklyActualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: CashFlowWeekMeta;
  model: ThreeMonthCashBudgetModel;
  onSaveActuals: (
    weekId: string,
    updates: Array<{ itemId: string; actual: number; notes?: string }>,
    isClosed: boolean,
  ) => void;
}

export const WeeklyActualsModal: React.FC<WeeklyActualsModalProps> = ({
  isOpen,
  onClose,
  week,
  model,
  onSaveActuals,
}) => {
  const [formState, setFormState] = useState<Record<string, { actual: string; notes: string }>>({});
  const [isClosed, setIsClosed] = useState<boolean>(week.isActualsClosed);
  const [activeCategory, setActiveCategory] = useState<"all" | "inflow" | "outflow">("all");

  useEffect(() => {
    if (isOpen) {
      const state: Record<string, { actual: string; notes: string }> = {};
      model.items.forEach((it) => {
        const data = it.weekly[week.id];
        state[it.id] = {
          actual: data && typeof data.actual === "number" ? String(data.actual) : "",
          notes: data?.notes || "",
        };
      });
      setFormState(state);
      setIsClosed(week.isActualsClosed);
      setActiveCategory("all");
    }
  }, [isOpen, week.id, week.isActualsClosed, model.items]);

  if (!isOpen) return null;

  const handleInputChange = (itemId: string, field: "actual" | "notes", val: string) => {
    setFormState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val,
      },
    }));
  };

  const copyBudgetToActuals = () => {
    const nextState: Record<string, { actual: string; notes: string }> = {};
    model.items.forEach((it) => {
      const data = it.weekly[week.id];
      const bgt = data?.budget || 0;
      nextState[it.id] = {
        actual: String(bgt),
        notes: formState[it.id]?.notes || "Copied from budget baseline",
      };
    });
    setFormState(nextState);
  };

  // Live Calculations
  let totalBudgetInflow = 0;
  let totalActualInflow = 0;
  let totalBudgetOutflow = 0;
  let totalActualOutflow = 0;

  model.items.forEach((it) => {
    const bgt = it.weekly[week.id]?.budget || 0;
    const actStr = formState[it.id]?.actual;
    const act = actStr !== "" && !isNaN(Number(actStr)) ? Number(actStr) : bgt;

    if (it.category === "inflow") {
      totalBudgetInflow += bgt;
      totalActualInflow += act;
    } else {
      totalBudgetOutflow += bgt;
      totalActualOutflow += act;
    }
  });

  const budgetNet = totalBudgetInflow - totalBudgetOutflow;
  const actualNet = totalActualInflow - totalActualOutflow;
  const netVariance = actualNet - budgetNet;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Array<{ itemId: string; actual: number; notes?: string }> = [];

    model.items.forEach((it) => {
      const actStr = formState[it.id]?.actual;
      if (actStr !== undefined && actStr.trim() !== "") {
        const num = Number(actStr);
        if (!isNaN(num)) {
          updates.push({
            itemId: it.id,
            actual: Math.max(0, num),
            notes: formState[it.id]?.notes?.trim() || undefined,
          });
        }
      }
    });

    onSaveActuals(week.id, updates, isClosed);
    onClose();
  };

  const filteredItems = model.items.filter((it) => {
    if (activeCategory === "all") return true;
    return it.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Update Weekly Actuals: {week.weekLabel} ({week.dateRange})
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {week.monthName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Record actual bank receipts and disbursements to calculate true cash runway
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

        {/* Live KPI Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Total Cash Inflow</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-bold text-emerald-800 font-mono text-sm">
                ₹{totalActualInflow.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">
                Bud: ₹{totalBudgetInflow.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Total Cash Outflow</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-bold text-rose-800 font-mono text-sm">
                ₹{totalActualOutflow.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">
                Bud: ₹{totalBudgetOutflow.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Net Cash Movement</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span
                className={`font-bold font-mono text-sm ${
                  actualNet >= 0 ? "text-emerald-800" : "text-rose-700"
                }`}
              >
                {actualNet >= 0 ? "+" : ""}₹{actualNet.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">
                Bud: {budgetNet >= 0 ? "+" : ""}₹{budgetNet.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border shadow-2xs ${
              netVariance >= 0
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-rose-50/70 border-rose-200 text-rose-900"
            }`}
          >
            <span className="block text-[11px] font-medium">Variance vs Budget</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-bold font-mono text-sm">
                {netVariance >= 0 ? "+" : ""}₹{netVariance.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-semibold">
                {netVariance >= 0 ? "(Favorable)" : "(Unfavorable)"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Sub-bar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeCategory === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                }`}
              >
                All Items ({model.items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("inflow")}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeCategory === "inflow"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                Inflows Only
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("outflow")}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeCategory === "outflow"
                    ? "bg-white text-rose-800 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                Outflows Only
              </button>
            </div>

            <button
              type="button"
              onClick={copyBudgetToActuals}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Auto-fill actuals with budgeted amounts as baseline"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Budget to Actuals</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => setIsClosed(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                {isClosed ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <strong className="text-emerald-800">Week Reconciled & Closed</strong>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open (In-Progress)</span>
                  </>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3.5 w-2/5">Line Item Particulars</th>
                  <th className="py-2.5 px-3 text-right">Budget (₹)</th>
                  <th className="py-2.5 px-3 w-40 text-right">Actual Figure (₹)</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                  <th className="py-2.5 px-3 w-1/4">Operational Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const bgt = item.weekly[week.id]?.budget || 0;
                  const currentVal = formState[item.id]?.actual ?? "";
                  const currentNotes = formState[item.id]?.notes ?? "";
                  const numVal =
                    currentVal !== "" && !isNaN(Number(currentVal))
                      ? Number(currentVal)
                      : undefined;

                  const variance =
                    numVal !== undefined
                      ? item.category === "inflow"
                        ? numVal - bgt
                        : bgt - numVal
                      : 0;

                  const isFavorable = variance >= 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        item.category === "inflow" ? "bg-white" : "bg-slate-50/20"
                      }`}
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.category === "inflow" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.category} • {item.section.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-medium">
                        ₹{bgt.toLocaleString("en-IN")}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder={String(bgt)}
                            value={currentVal}
                            onChange={(e) => handleInputChange(item.id, "actual", e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-300 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                        {numVal !== undefined ? (
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded ${
                              isFavorable
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-rose-50 text-rose-800"
                            }`}
                          >
                            {variance >= 0 ? "+" : ""}₹{variance.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. Invoice delayed, tax deducted..."
                          value={currentNotes}
                          onChange={(e) => handleInputChange(item.id, "notes", e.target.value)}
                          className="w-full px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Changes dynamically re-calculate rolling closing cash balances across future weeks.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Weekly Actuals</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
