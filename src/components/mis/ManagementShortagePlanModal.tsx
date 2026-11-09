import React, { useState } from "react";
import { ThreeMonthCashBudgetModel, ManagementShortageAction, CashFlowWeekMeta } from "../../types";
import { X, ShieldAlert, Plus, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";

interface ManagementShortagePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeks: CashFlowWeekMeta[];
  existingAction?: ManagementShortageAction | null;
  onSaveAction: (action: Omit<ManagementShortageAction, "id">, actionId?: string) => void;
  defaultWeekId?: string;
}

export const ManagementShortagePlanModal: React.FC<ManagementShortagePlanModalProps> = ({
  isOpen,
  onClose,
  weeks,
  existingAction,
  onSaveAction,
  defaultWeekId,
}) => {
  const [weekId, setWeekId] = useState(
    existingAction?.weekId || defaultWeekId || weeks[2]?.id || "w3",
  );
  const [title, setTitle] = useState(existingAction?.title || "");
  const [impactAmount, setImpactAmount] = useState(
    existingAction?.impactAmount ? String(existingAction.impactAmount) : "300000",
  );
  const [type, setType] = useState<ManagementShortageAction["type"]>(
    existingAction?.type || "accelerate_receivables",
  );
  const [status, setStatus] = useState<ManagementShortageAction["status"]>(
    existingAction?.status || "approved",
  );
  const [notes, setNotes] = useState(existingAction?.notes || "");

  React.useEffect(() => {
    if (isOpen) {
      setWeekId(existingAction?.weekId || defaultWeekId || weeks[2]?.id || "w3");
      setTitle(existingAction?.title || "");
      setImpactAmount(
        existingAction?.impactAmount ? String(existingAction.impactAmount) : "300000",
      );
      setType(existingAction?.type || "accelerate_receivables");
      setStatus(existingAction?.status || "approved");
      setNotes(existingAction?.notes || "");
    }
  }, [isOpen, existingAction, defaultWeekId, weeks]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !impactAmount || Number(impactAmount) <= 0) return;

    onSaveAction(
      {
        weekId,
        title: title.trim(),
        impactAmount: Number(impactAmount),
        type,
        status,
        notes: notes.trim(),
      },
      existingAction?.id,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {existingAction
                  ? "Edit Shortage Mitigation Action"
                  : "Plan Liquidity Shortage Action"}
              </h3>
              <p className="text-xs text-slate-400">
                Define operational levers to bridge weekly cash deficits or buffer shortfalls
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Week with Deficit / Buffer Risk
            </label>
            <select
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.monthName} — {w.weekLabel} ({w.dateRange})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mitigation Action Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Accelerate collections from Apex Retail & Reliance..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Levers / Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="accelerate_receivables">Accelerate Debtors / Collections</option>
                <option value="draw_od">Drawdown Bank OD / CC Limit</option>
                <option value="defer_capex">Defer Non-Critical Capex</option>
                <option value="supplier_terms">Negotiate 15-Day Vendor Credit</option>
                <option value="other">Other Treasury Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cash Impact / Relief (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={impactAmount}
                  onChange={(e) => setImpactAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Approval & Execution Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("proposed")}
                className={`py-2 px-2.5 rounded-xl font-semibold text-center border cursor-pointer transition-colors ${
                  status === "proposed"
                    ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Proposed
              </button>
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`py-2 px-2.5 rounded-xl font-semibold text-center border cursor-pointer transition-colors ${
                  status === "approved"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setStatus("executed")}
                className={`py-2 px-2.5 rounded-xl font-semibold text-center border cursor-pointer transition-colors ${
                  status === "executed"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Executed
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Operational Plan & Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Discussed with Client Director. ₹3.5L will be released by NEFT on 18th Oct before GST payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{existingAction ? "Save Changes" : "Add Mitigation Action"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
