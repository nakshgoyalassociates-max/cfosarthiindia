import React, { useState } from "react";
import { ActionItem, ActionStatus } from "../../types";
import { useApp } from "../../context/AppContext";
import { X, TrendingUp, Calendar, Clock, CheckCircle2, User } from "lucide-react";

interface QuickProgressUpdateModalProps {
  action: ActionItem | null;
  onClose: () => void;
}

export const QuickProgressUpdateModal: React.FC<QuickProgressUpdateModalProps> = ({
  action,
  onClose,
}) => {
  const { updateActionProgress, currentUser } = useApp();
  const [progress, setProgress] = useState<number>(
    action ? (action.progressPercentage ?? (action.status === "Completed" ? 100 : 0)) : 0,
  );
  const [status, setStatus] = useState<ActionStatus>(action ? action.status : "In Progress");
  const [notes, setNotes] = useState<string>("");
  const [updatedBy, setUpdatedBy] = useState<string>(
    currentUser?.name || action?.assignedTo || "Assignee",
  );

  if (!action) return null;

  const duration = action.durationDays || 5;
  const cadence = action.checkInCadenceDays || 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateActionProgress(
      action.id,
      progress,
      notes.trim() || `Progress logged at ${progress}%`,
      status,
      updatedBy,
    );
    onClose();
  };

  const handleQuickAdd = (delta: number) => {
    const nextVal = Math.min(100, Math.max(0, progress + delta));
    setProgress(nextVal);
    if (nextVal === 100) setStatus("Completed");
    else if (nextVal > 0 && status === "Pending") setStatus("In Progress");
  };

  const handleSetPreset = (target: number) => {
    setProgress(target);
    if (target === 100) setStatus("Completed");
    else if (target > 0 && status === "Pending") setStatus("In Progress");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Log Assignee Progress Update</h3>
              <p className="text-[11px] text-slate-500">
                Every {cadence} days progress check-in cadence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Action Task Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {action.category}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Due: {action.fixedDeadline}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">{action.title}</h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Duration: <strong>{duration} Days</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Assignee: <strong>{action.assignedTo}</strong>
              </span>
            </div>
          </div>

          {/* Current Progress & Interactive Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Progress Percentage (%)</label>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black font-mono text-indigo-600">{progress}%</span>
                <span className="text-[11px] text-slate-400">/ 100%</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (val === 100) setStatus("Completed");
                else if (val > 0 && status === "Pending") setStatus("In Progress");
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* Quick preset buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
              >
                +25%
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(50)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
              >
                50% (Halfway)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(75)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
              >
                75% (Final Stretch)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(100)}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                100% Done
              </button>
            </div>
          </div>

          {/* Status Selection & Updated By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Action Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-indigo-500"
              >
                <option value="Pending">Pending (Not Started)</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed (100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Logged By (Assignee / CFO)
              </label>
              <input
                type="text"
                value={updatedBy}
                onChange={(e) => setUpdatedBy(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-indigo-500"
                placeholder="Name of updater"
              />
            </div>
          </div>

          {/* Progress Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Assignee Progress Notes & Next Steps <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reconciled 32 of 45 transactions with bank ledger. Follow-up dispatched for remaining 2 vendor balances."
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Detailing work completed helps the Virtual CFO and Management monitor turnaround time.
            </p>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Progress Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
