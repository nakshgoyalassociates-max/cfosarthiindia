// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  ActionFlowTask,
  TaskChallenge,
  ChallengeComment,
  TaskChallengeSeverity,
  TaskChallengeCategory,
} from "../../types";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  Lock,
  CalendarPlus,
} from "lucide-react";

interface ActionFlowChallengeDrawerProps {
  task: ActionFlowTask | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReportChallenge?: (taskId: string) => void;
}

export const ActionFlowChallengeDrawer: React.FC<ActionFlowChallengeDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onOpenReportChallenge,
}) => {
  const { currentUser, role, addChallengeComment, resolveTaskChallenge, provideCfoGuidance } =
    useApp();

  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [isCfoDirectiveChecked, setIsCfoDirectiveChecked] = useState<boolean>(role === "cfo");
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState<string>("");
  const [resolvingChallengeId, setResolvingChallengeId] = useState<string | null>(null);
  const [extensionDaysInput, setExtensionDaysInput] = useState<number>(3);
  const [isExtendingTime, setIsExtendingTime] = useState<boolean>(false);

  if (!isOpen || !task) return null;

  // Selected challenge or default to first open challenge
  const challenges = task.challenges || [];
  const selectedChallenge =
    challenges.find((c) => c.id === activeChallengeId) ||
    challenges.find((c) => c.status !== "resolved") ||
    challenges[0];

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChallenge || !newCommentText.trim()) return;

    if (role === "cfo" && isCfoDirectiveChecked) {
      provideCfoGuidance(
        task.id,
        selectedChallenge.id,
        newCommentText.trim(),
        undefined,
        isExtendingTime ? extensionDaysInput : undefined,
      );
    } else {
      addChallengeComment(task.id, selectedChallenge.id, {
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorRoleTitle: currentUser.roleTitle,
        authorAvatar: currentUser.avatar,
        message: newCommentText.trim(),
        isCfoDirective: false,
      });
    }

    setNewCommentText("");
    setIsExtendingTime(false);
  };

  const handleResolve = (challengeId: string) => {
    if (!resolutionSummaryInput.trim()) return;
    resolveTaskChallenge(task.id, challengeId, resolutionSummaryInput.trim());
    setResolvingChallengeId(null);
    setResolutionSummaryInput("");
  };

  const getSeverityBadge = (severity: TaskChallengeSeverity) => {
    switch (severity) {
      case "Critical Blocker":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Moderate Roadblock":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Query / Advisory Needed":
        return "bg-sky-100 text-sky-800 border-sky-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusBadge = (status: TaskChallenge["status"]) => {
    switch (status) {
      case "open":
        return {
          label: "Awaiting CFO Advice",
          classes: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "cfo_guidance_provided":
        return {
          label: "CFO Directive Prescribed",
          classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "resolved":
        return {
          label: "Resolved & Unblocked",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return { label: status, classes: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                {task.taskCode}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                {task.category}
              </span>
              {task.status === "stuck_blocked" && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600/90 text-white flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Stuck / Blocked
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-1 line-clamp-1">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Context Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Assigned Assignee</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
              <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                {task.assignedAvatar || "AS"}
              </div>
              <span className="truncate">{task.assignedTo}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Time Duration</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {task.allocatedDurationDays} Days ({task.startDate} to {task.dueDate})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Task Progress</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    task.progressPercentage >= 100
                      ? "bg-emerald-600"
                      : task.status === "stuck_blocked"
                        ? "bg-amber-500"
                        : "bg-blue-600"
                  }`}
                  style={{ width: `${task.progressPercentage}%` }}
                />
              </div>
              <span className="font-bold text-slate-800">{task.progressPercentage}%</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Check-in Cadence</span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate">
              {task.checkInCadence || "Daily Standup"}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Challenges List / Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive Blocker & Challenge Threads ({challenges.length})
                </h3>
              </div>
              {onOpenReportChallenge && (
                <button
                  type="button"
                  onClick={() => onOpenReportChallenge(task.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Report Stuck / Issue
                </button>
              )}
            </div>

            {challenges.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No Blockers Escalated</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  This task is running smoothly according to plan. If you or the assignee encounter
                  any operational bottleneck, click "Report Stuck / Issue" above to involve the CFO.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {challenges.map((ch, idx) => {
                  const isSelected = selectedChallenge?.id === ch.id;
                  const statusInfo = getStatusBadge(ch.status);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setActiveChallengeId(ch.id)}
                      className={`px-3 py-2 text-left rounded-lg border text-xs min-w-[200px] shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isSelected
                              ? "bg-slate-800 text-amber-300 border-slate-700"
                              : getSeverityBadge(ch.severity)
                          }`}
                        >
                          {ch.severity === "Critical Blocker" ? "Critical" : "Roadblock"}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          Issue #{idx + 1}
                        </span>
                      </div>
                      <p
                        className={`font-semibold line-clamp-1 ${
                          isSelected ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {ch.title}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span
                          className={
                            ch.status === "resolved"
                              ? "text-emerald-400 font-medium"
                              : isSelected
                                ? "text-amber-300 font-medium"
                                : "text-rose-600 font-medium"
                          }
                        >
                          {statusInfo.label}
                        </span>
                        <span className={isSelected ? "text-slate-400" : "text-slate-400"}>
                          {ch.comments.length} msgs
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Challenge Card */}
          {selectedChallenge && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(
                        selectedChallenge.severity,
                      )}`}
                    >
                      {selectedChallenge.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                      {selectedChallenge.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                        getStatusBadge(selectedChallenge.status).classes
                      }`}
                    >
                      {getStatusBadge(selectedChallenge.status).label}
                    </span>
                  </div>

                  {selectedChallenge.status !== "resolved" && (
                    <button
                      type="button"
                      onClick={() => setResolvingChallengeId(selectedChallenge.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Resolved / Unblock
                    </button>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">{selectedChallenge.title}</h4>
                <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                  {selectedChallenge.description}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Reported by:{" "}
                    <strong className="text-slate-700">{selectedChallenge.reportedBy}</strong> (
                    {selectedChallenge.reportedByRole || "Assignee"})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {selectedChallenge.reportedAt}
                  </span>
                </div>
              </div>

              {/* Resolution Form if Triggered */}
              {resolvingChallengeId === selectedChallenge.id && (
                <div className="p-4 bg-emerald-50/80 border-b border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Confirm Blocker Resolution & Resume Deliverable
                    </span>
                    <button
                      type="button"
                      onClick={() => setResolvingChallengeId(null)}
                      className="text-xs text-emerald-700 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resolutionSummaryInput}
                    onChange={(e) => setResolutionSummaryInput(e.target.value)}
                    placeholder="E.g., 14 UDYAM declarations retrieved; bank authorization completed; cleared for release."
                    className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleResolve(selectedChallenge.id)}
                      disabled={!resolutionSummaryInput.trim()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Save Resolution & Mark Unblocked
                    </button>
                  </div>
                </div>
              )}

              {/* Resolved Note if already resolved */}
              {selectedChallenge.status === "resolved" && (
                <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Resolved on {selectedChallenge.resolvedAt} by {selectedChallenge.resolvedBy}:
                    </span>
                    <p className="mt-0.5 text-emerald-800">
                      {selectedChallenge.resolutionSummary || "Blocker removed successfully."}
                    </p>
                  </div>
                </div>
              )}

              {/* CFO Advisory Directive Callout (if present) */}
              {selectedChallenge.cfoAdvisorySummary && (
                <div className="p-3.5 bg-indigo-50/90 border-b border-indigo-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    CFO
                  </div>
                  <div className="text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Virtual CFO Official Advisory & Directive
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                        Prescribed Action
                      </span>
                    </div>
                    <p className="text-indigo-900 mt-1 leading-relaxed font-medium">
                      "{selectedChallenge.cfoAdvisorySummary}"
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Thread Comments Stream */}
              <div className="p-4 space-y-3 bg-slate-50/50 min-h-[160px] max-h-[320px] overflow-y-auto">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Collaboration & Advice Stream
                </div>

                {selectedChallenge.comments.map((comment) => {
                  const isCfo = comment.authorRole === "cfo" || comment.isCfoDirective;
                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-2.5 text-xs ${isCfo ? "pl-4" : "pr-4"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCfo
                            ? "bg-indigo-700 text-white ring-2 ring-indigo-200"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {comment.authorAvatar || (isCfo ? "CFO" : "TM")}
                      </div>

                      <div
                        className={`flex-1 p-3 rounded-xl border ${
                          isCfo
                            ? "bg-indigo-50/80 border-indigo-200 text-slate-800"
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{comment.authorName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded ${
                                isCfo
                                  ? "bg-indigo-100 text-indigo-800 font-semibold"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {comment.authorRoleTitle ||
                                (comment.authorRole === "cfo" ? "Virtual CFO" : "Team Member")}
                            </span>
                            {comment.isCfoDirective && (
                              <span className="text-[10px] px-1 py-0.2 bg-amber-100 text-amber-900 font-bold rounded flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3 text-amber-700" /> Directive
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                        </div>

                        <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                          {comment.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment Input & CFO Action Bar */}
              <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                {role === "cfo" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isCfoDirectiveChecked}
                        onChange={(e) => setIsCfoDirectiveChecked(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Mark as Official CFO Strategic Directive</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsExtendingTime(!isExtendingTime)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        isExtendingTime
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Grant Timeline Extension
                    </button>
                  </div>
                )}

                {isExtendingTime && role === "cfo" && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-amber-900 block">
                        CFO Timeline Relief Protocol
                      </span>
                      <span className="text-amber-800 text-[11px]">
                        Add extra days to task allocated duration to compensate for vendor/portal
                        delays.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700">Days:</label>
                      <select
                        value={extensionDaysInput}
                        onChange={(e) => setExtensionDaysInput(Number(e.target.value))}
                        className="text-xs font-bold p-1 bg-white border border-amber-300 rounded shadow-xs"
                      >
                        <option value={2}>+2 Days</option>
                        <option value={3}>+3 Days</option>
                        <option value={5}>+5 Days</option>
                        <option value={7}>+7 Days (1 Week)</option>
                        <option value={14}>+14 Days (2 Weeks)</option>
                      </select>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={
                      role === "cfo"
                        ? "Provide guidance, strategic resolution steps, or regulatory advice..."
                        : "Describe the update, what advice is needed, or mention next steps..."
                    }
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className={`px-4 py-2 font-semibold text-xs rounded-lg text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                      role === "cfo" && isCfoDirectiveChecked
                        ? "bg-indigo-700 hover:bg-indigo-800"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {role === "cfo" && isCfoDirectiveChecked ? "Issue Directive" : "Reply"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Task ID: <strong className="text-slate-700">{task.id}</strong> • Assigned to{" "}
            <strong className="text-slate-700">{task.assignedTo}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
