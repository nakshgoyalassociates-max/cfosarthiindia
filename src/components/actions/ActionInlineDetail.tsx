import React, { useState } from "react";
import { ActionItem, ActionStatus } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatDueDate } from "../../utils/dueDate";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";
import {
  TrendingUp,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Edit3,
  PlusCircle,
  History,
  Send,
} from "lucide-react";

interface ActionInlineDetailProps {
  action: ActionItem;
  onClose?: () => void;
}

export const ActionInlineDetail: React.FC<ActionInlineDetailProps> = ({ action, onClose }) => {
  const { updateAction, deleteAction, updateActionProgress, currentUser } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Duration & Decided Date Editing State
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [decidedDate, setDecidedDate] = useState(action.decidedDate || action.createdAt);
  const [durationDays, setDurationDays] = useState(action.durationDays || 5);
  const [cadenceDays, setCadenceDays] = useState(action.checkInCadenceDays || 2);
  const [targetDeadline, setTargetDeadline] = useState(action.fixedDeadline || "");

  // Assignee Update Form State
  const [newProgress, setNewProgress] = useState<number>(
    action.progressPercentage ?? (action.status === "Completed" ? 100 : 0),
  );
  const [newStatus, setNewStatus] = useState<ActionStatus>(action.status);
  const [updateNotes, setUpdateNotes] = useState("");
  const [updaterName, setUpdaterName] = useState(
    currentUser?.name || action.assignedTo || "Assignee",
  );
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const duration = action.durationDays || 5;
  const cadence = action.checkInCadenceDays || 2;
  const currentProgress = Math.max(
    0,
    Math.min(100, action.progressPercentage ?? (action.status === "Completed" ? 100 : 0)),
  );

  // Pacing calculations
  const startDate = new Date(action.decidedDate || action.createdAt);
  const now = new Date();
  const diffTime = Math.max(
    0,
    now.getTime() - (isNaN(startDate.getTime()) ? now.getTime() : startDate.getTime()),
  );
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeElapsedPct = Math.min(100, Math.round((daysElapsed / duration) * 100));

  const lastUpdateDate = action.lastProgressUpdateDate
    ? new Date(action.lastProgressUpdateDate)
    : null;
  const daysSinceLastUpdate =
    lastUpdateDate && !isNaN(lastUpdateDate.getTime())
      ? Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
      : daysElapsed;
  const isCheckInDue = currentProgress < 100 && daysSinceLastUpdate >= cadence;

  const isCompleted = action.status === "Completed" || currentProgress >= 100;
  const isOverdue = !isCompleted && daysElapsed > duration;
  const isAhead = !isCompleted && !isOverdue && currentProgress > timeElapsedPct + 10;
  const isBehind = !isCompleted && !isOverdue && timeElapsedPct > currentProgress + 15;

  const handleSaveDecisionParams = (e: React.FormEvent) => {
    e.preventDefault();
    // Recompute deadline if duration or decided date changed
    let deadline = targetDeadline;
    if (!deadline || deadline === action.fixedDeadline) {
      const d = new Date(decidedDate);
      d.setDate(d.getDate() + Number(durationDays));
      deadline = d.toISOString().split("T")[0];
    }

    updateAction({
      ...action,
      decidedDate,
      durationDays: Number(durationDays),
      checkInCadenceDays: Number(cadenceDays),
      fixedDeadline: deadline,
    });
    setIsEditingParams(false);
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateNotes.trim()) return;

    updateActionProgress(action.id, newProgress, updateNotes.trim(), newStatus, updaterName);
    setUpdateNotes("");
    setIsAddingUpdate(false);
  };

  const handleQuickAdd = (delta: number) => {
    const nextVal = Math.min(100, Math.max(0, newProgress + delta));
    setNewProgress(nextVal);
    if (nextVal === 100) setNewStatus("Completed");
    else if (nextVal > 0 && newStatus === "Pending") setNewStatus("In Progress");
  };

  const handleSetPreset = (target: number) => {
    setNewProgress(target);
    if (target === 100) setNewStatus("Completed");
    else if (target > 0 && newStatus === "Pending") setNewStatus("In Progress");
  };

  const progressUpdates = action.progressUpdates || [];

  return (
    <div className="bg-indigo-50/40 rounded-xl p-3 sm:p-4 border border-indigo-200/90 shadow-2xs space-y-3.5 text-xs relative">
      {/* Top Header: Decision Spec & Cadence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-200/60">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-indigo-950 text-sm tracking-tight">
              Action Decision & Progress Track
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {action.category || "Action Item"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingParams(!isEditingParams)}
            className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 text-indigo-900 rounded-md border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Edit3 className="w-3 h-3 text-indigo-600" />
            <span>{isEditingParams ? "Cancel Edit" : "Edit Duration"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingUpdate(!isAddingUpdate)}
            className="px-2.5 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Log Check-in</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm px-1.5 cursor-pointer"
              title="Close detail"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Decision Parameter Editor Form */}
      {isEditingParams && (
        <form
          onSubmit={handleSaveDecisionParams}
          className="p-3 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Decided Completion Timeline
            </span>
            <span className="text-[10px] text-slate-400">
              Adjust duration when timelines are re-negotiated with CFO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Decided Date
              </label>
              <input
                type="date"
                value={decidedDate}
                onChange={(e) => setDecidedDate(e.target.value)}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Check-in Cadence
              </label>
              <select
                value={cadenceDays}
                onChange={(e) => setCadenceDays(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value={1}>Every 1 Day (Daily)</option>
                <option value={2}>Every 2 Days (Standard)</option>
                <option value={3}>Every 3 Days</option>
                <option value={5}>Every 5 Days (Weekly)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingParams(false)}
              className="px-2.5 py-1 rounded text-slate-600 hover:bg-slate-100 text-[11px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold"
            >
              Save Timeline
            </button>
          </div>
        </form>
      )}

      {/* Graphical Presentation Card: Visual Progress Bar & Duration Comparison */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-indigo-100/90 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono text-slate-900">{currentProgress}%</span>
            <div className="leading-tight">
              <span className="font-bold text-slate-800 block text-xs">Completion Progress</span>
              <span className="text-[10.5px] text-slate-500">
                Target: 100% within {duration} Days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pacing pill */}
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isOverdue
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isCheckInDue
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : isAhead
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : isOverdue ? (
                <AlertTriangle className="w-3 h-3 text-rose-600" />
              ) : isCheckInDue ? (
                <Clock className="w-3 h-3 text-amber-600" />
              ) : (
                <TrendingUp className="w-3 h-3 text-blue-600" />
              )}
              <span>
                {isCompleted
                  ? "Completed"
                  : isOverdue
                    ? `Overdue (+${daysElapsed - duration}d)`
                    : isCheckInDue
                      ? `${cadence}-Day Check-in Due`
                      : isAhead
                        ? "Ahead of Pace"
                        : isBehind
                          ? "Behind Pace"
                          : "On Track"}
              </span>
            </span>

            {/* Cadence badge */}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-medium border border-slate-200 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>{cadence}d Update Cadence</span>
            </span>
          </div>
        </div>

        {/* Graphical Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : isOverdue
                    ? "bg-gradient-to-r from-rose-500 to-red-600"
                    : isCheckInDue
                      ? "bg-gradient-to-r from-amber-500 to-amber-600"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Time scale & Milestone markers */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
            <span>Decided: {action.decidedDate || action.createdAt}</span>
            <span>
              Elapsed: {daysElapsed}d of {duration}d ({timeElapsedPct}%)
            </span>
            <span>
              Target: {action.fixedDeadline ? formatDueDate(action.fixedDeadline) : "TBD"}
            </span>
          </div>
        </div>
      </div>

      {/* Assignee Check-in Form (Expandable) */}
      {isAddingUpdate && (
        <form
          onSubmit={handleProgressSubmit}
          className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              Log Assignee Progress Check-in (Every {cadence} Days)
            </span>
            <span className="text-[10px] text-slate-400">
              Assignee reports percentage completed and notes
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">New Progress Percentage:</span>
              <span className="text-base font-extrabold font-mono text-indigo-600">
                {newProgress}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={newProgress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setNewProgress(val);
                if (val === 100) setNewStatus("Completed");
                else if (val > 0 && newStatus === "Pending") setNewStatus("In Progress");
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* Quick preset buttons */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-medium"
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-medium"
              >
                +25%
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(50)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-medium"
              >
                50% (Halfway)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(75)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-medium"
              >
                75% (Final Stretch)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(100)}
                className="px-2.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10.5px] font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                100% Done
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Updated Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ActionStatus)}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
                Assignee Name
              </label>
              <input
                type="text"
                value={updaterName}
                onChange={(e) => setUpdaterName(e.target.value)}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold text-slate-700 mb-1">
              Progress Notes & Work Executed <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="e.g. Scanned 38 invoices, matched 32 GST tax receipts. Sent confirmation request to transporter."
              required
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingUpdate(false)}
              className="px-3 py-1 rounded text-slate-600 hover:bg-slate-100 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Progress Check-in
            </button>
          </div>
        </form>
      )}

      {/* Assignee Progress Update Feed (Chronological / Timeline) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            Assignee 2-Day Progress Check-in Feed ({progressUpdates.length})
          </span>
          <span className="text-[10px] text-slate-400">Cadence: Regular progress logs</span>
        </div>

        {progressUpdates.length === 0 ? (
          <div className="bg-white/80 p-3.5 rounded-xl border border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs text-slate-500">
              No progress check-ins recorded yet for this action.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingUpdate(true)}
              className="text-indigo-600 hover:underline text-xs font-semibold cursor-pointer"
            >
              + Log initial progress check-in
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {progressUpdates.map((upd, idx) => (
              <div
                key={upd.id || idx}
                className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-500" />
                      {upd.updatedBy}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{upd.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10.5px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {upd.progressPercentage}%
                    </span>
                    {upd.status && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
                        {upd.status}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-700 text-xs pl-4 border-l-2 border-indigo-200 leading-relaxed">
                  {upd.notes}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Bar: Status & Delete Confirmation */}
      <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-700">Assigned:</span>
          <span>
            {action.assignedTo} ({action.assignedRole})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
            title="Delete Action Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer text-xs"
            >
              Close Window ▲
            </button>
          )}
        </div>
      </div>

      <ConfirmDestructiveDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Action Item"
        description={`Are you sure you want to delete the action item "${action.title}"?`}
        confirmLabel="Delete Item"
        onConfirm={() => {
          deleteAction(action.id);
          setShowDeleteConfirm(false);
          if (onClose) onClose();
        }}
      />
    </div>
  );
};
