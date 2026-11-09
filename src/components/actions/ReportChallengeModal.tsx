// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ActionFlowTask, TaskChallengeSeverity, TaskChallengeCategory } from "../../types";
import { AlertTriangle, X, ShieldAlert, Sparkles, Send, HelpCircle } from "lucide-react";

interface ReportChallengeModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CHALLENGE_CATEGORIES: TaskChallengeCategory[] = [
  "Vendor / Counterparty Dependency",
  "Statutory Portal / Server Technical Glitch",
  "Legal / Tax Interpretation Ambiguity",
  "Missing Source Documents / Bank Statements",
  "Internal Client Approval Pending",
  "Commercial / Pricing Dispute",
  "Cash Flow / Liquidity Constraint",
  "Other Operational Bottleneck",
];

const SEVERITY_LEVELS: {
  level: TaskChallengeSeverity;
  label: string;
  desc: string;
  badge: string;
}[] = [
  {
    level: "Critical Blocker",
    label: "Critical Blocker",
    desc: "Completely halts task completion; statutory due date at imminent risk without CFO escalation.",
    badge: "border-rose-400 bg-rose-50 text-rose-800",
  },
  {
    level: "Moderate Roadblock",
    label: "Moderate Roadblock",
    desc: "Significant friction or slowdown; can progress on other milestones while waiting for support.",
    badge: "border-amber-400 bg-amber-50 text-amber-800",
  },
  {
    level: "Query / Advisory Needed",
    label: "Query / Advisory Needed",
    desc: "Seeking technical/accounting advice or validation from CFO before finalizing deliverable.",
    badge: "border-sky-400 bg-sky-50 text-sky-800",
  },
];

export const ReportChallengeModal: React.FC<ReportChallengeModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const { actionFlowTasks, currentUser, reportTaskChallenge } = useApp();

  const task = actionFlowTasks.find((t) => t.id === taskId);

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<TaskChallengeCategory>(CHALLENGE_CATEGORIES[0]);
  const [severity, setSeverity] = useState<TaskChallengeSeverity>("Critical Blocker");
  const [description, setDescription] = useState<string>("");
  const [isCfoInterventionRequested, setIsCfoInterventionRequested] = useState<boolean>(true);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    reportTaskChallenge(task.id, {
      title: title.trim(),
      category,
      severity,
      description: description.trim(),
      reportedBy: currentUser.name,
      reportedByRole: currentUser.roleTitle || currentUser.role,
      isCfoInterventionRequested,
    });

    onClose();
    setTitle("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-800/80 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">Report Task Blocker / Escalation</h3>
              <p className="text-xs text-rose-100">
                Trigger interactive support from Virtual CFO & team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Header Summary */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Task:</span>{" "}
            <strong className="text-slate-900">{task.title}</strong>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 text-slate-700">
            {task.taskCode}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Blocker Headline / Issue Summary *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Bank statement password mismatch / Portal OTP not received"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskChallengeCategory)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {CHALLENGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as TaskChallengeSeverity)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
              >
                {SEVERITY_LEVELS.map((s) => (
                  <option key={s.level} value={s.level}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity guidance box */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            {SEVERITY_LEVELS.find((s) => s.level === severity)?.desc}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description & What Is Blocking You *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain exactly where you are stuck, who you have contacted, what response was received, and what advice or decision you need from the Virtual CFO..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
            />
          </div>

          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="cfoInterventionCheckbox"
              checked={isCfoInterventionRequested}
              onChange={(e) => setIsCfoInterventionRequested(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="cfoInterventionCheckbox"
              className="text-xs text-indigo-950 font-medium cursor-pointer"
            >
              <strong className="block font-bold">Request Virtual CFO Priority Support</strong>
              Flag this issue directly in the CFO's Escalation Queue to trigger strategic advice or
              a formal management directive.
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim()}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Blocker to CFO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
