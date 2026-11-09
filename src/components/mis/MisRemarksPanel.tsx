// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  CornerDownRight,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { MisRemarkItem } from "../../types";

interface MisRemarksPanelProps {
  defaultCategory?: string;
  currentSectionFilter?:
    | "all"
    | "overview"
    | "balance-sheet"
    | "pnl"
    | "debtor-ageing"
    | "cash-flow"
    | "fund-flow"
    | "budget";
  compact?: boolean;
}

export const MisRemarksPanel: React.FC<MisRemarksPanelProps> = ({
  currentSectionFilter = "all",
  compact = false,
}) => {
  const {
    misRemarks,
    rawMisRemarks,
    toggleItemVisibility,
    addMisRemark,
    updateMisRemarkStatus,
    deleteMisRemark,
    currentUser,
    role,
    clientProfile,
    activeCompanyId,
    showToast,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showHiddenRemarks, setShowHiddenRemarks] = useState(false);
  const [selectedSection, setSelectedSection] = useState<
    "overview" | "balance-sheet" | "pnl" | "debtor-ageing" | "cash-flow" | "fund-flow" | "budget"
  >("pnl");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [varianceNote, setVarianceNote] = useState("");

  const [filterSection, setFilterSection] = useState<string>(currentSectionFilter);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [cfoReplyText, setCfoReplyText] = useState<string>("");

  const sectionTitles: Record<string, string> = {
    overview: "Broad Picture & Overview",
    "balance-sheet": "Balance Sheet & Capital",
    pnl: "Profit & Loss Statement",
    "debtor-ageing": "Debtor Ageing & MSME Payables",
    "cash-flow": "Cash Flow & Funds Movement",
    "fund-flow": "Fund Flow & Cash Runway",
    budget: "Budget vs Actuals",
  };

  const handlePostRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reason.trim()) {
      showToast("Please enter a title and detailed reason/explanation");
      return;
    }

    addMisRemark({
      companyId: activeCompanyId,
      section: selectedSection,
      sectionTitle: sectionTitles[selectedSection] || "Financial MIS",
      title: title.trim(),
      reason: reason.trim(),
      varianceNote: varianceNote.trim() || undefined,
      authorName: `${currentUser.name} (${role === "cfo" ? "Virtual CFO" : "Client Team"})`,
      role: role as any,
    });

    setTitle("");
    setReason("");
    setVarianceNote("");
    setIsFormOpen(false);
  };

  const handleSendCfoReply = (remarkId: string) => {
    if (!cfoReplyText.trim()) return;
    updateMisRemarkStatus(remarkId, "reviewed", cfoReplyText.trim());
    setActiveReplyId(null);
    setCfoReplyText("");
  };

  // Filter remarks for current company and section
  const hiddenRemarksCount = (rawMisRemarks || []).filter(
    (r) => (!r.companyId || r.companyId === activeCompanyId) && r.isHidden,
  ).length;
  const sourceRemarks = showHiddenRemarks ? rawMisRemarks || misRemarks : misRemarks;
  const companyRemarks = sourceRemarks.filter(
    (r) => !r.companyId || r.companyId === activeCompanyId,
  );

  const displayedRemarks = companyRemarks.filter((r) => {
    if (filterSection === "all") return true;
    return r.section === filterSection;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              MIS Operational Remarks & Explanations
            </h3>
            <p className="text-[11px] text-slate-500">
              Facility for Client Team & CFO to record reasons for line-item variances, delayed
              collections, and executive commentary.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === "cfo" && (
            <button
              type="button"
              onClick={() => setShowHiddenRemarks(!showHiddenRemarks)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showHiddenRemarks
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Toggle hidden MIS remarks"
            >
              {showHiddenRemarks ? (
                <Eye className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {showHiddenRemarks
                  ? `Showing Hidden (${hiddenRemarksCount})`
                  : `Hidden (${hiddenRemarksCount})`}
              </span>
            </button>
          )}

          {/* Section Filter */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">All Sections ({companyRemarks.length})</option>
            <option value="pnl">Profit & Loss</option>
            <option value="balance-sheet">Balance Sheet</option>
            <option value="debtor-ageing">Debtor Ageing</option>
            <option value="budget">Budget Variances</option>
            <option value="cash-flow">Cash Flow & Funds Movement</option>
            <option value="fund-flow">Fund Flow</option>
            <option value="overview">Overview</option>
          </select>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFormOpen ? "Cancel" : "Add Remark / Reason"}</span>
          </button>
        </div>
      </div>

      {/* Post Remark Drawer / Form */}
      {isFormOpen && (
        <form
          onSubmit={handlePostRemark}
          className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs"
        >
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-amber-600" />
            <span>Record Operational Remark / Variance Reason</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Target Statement Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="pnl">Profit & Loss Statement</option>
                <option value="balance-sheet">Balance Sheet & Net Assets</option>
                <option value="debtor-ageing">Debtor Ageing & MSME Dues</option>
                <option value="budget">Budget vs Actuals Outlay</option>
                <option value="cash-flow">Cash Flow & Funds Movement</option>
                <option value="fund-flow">Fund Flow & Treasury</option>
                <option value="overview">Executive Overview</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Subject / Variance Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reason for +14% tech cloud expense variance"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Detailed Operational Explanation & Justification *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the background cause, vendor terms, temporary delays, or project scope adjustments..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Variance Note / Financial Impact (Optional)
            </label>
            <input
              type="text"
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              placeholder="e.g. ₹45,000 impact, will normalize in Sep 2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit Remark</span>
            </button>
          </div>
        </form>
      )}

      {/* Remarks Feed */}
      <div className="space-y-3">
        {displayedRemarks.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No remarks logged for this section yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Add Remark / Reason&quot; above to provide management context.
            </p>
          </div>
        ) : (
          displayedRemarks.map((rem) => (
            <div
              key={rem.id}
              className={`rounded-xl border p-4 space-y-3 transition-colors ${
                rem.isHidden
                  ? "bg-amber-50/40 border-amber-200 opacity-75"
                  : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {rem.sectionTitle}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{rem.title}</h4>
                  {rem.isHidden && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <EyeOff className="w-2.5 h-2.5" />
                      Hidden
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rem.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : rem.status === "reviewed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {rem.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{rem.createdAt}</span>
                </div>
              </div>

              {/* Explanation Body */}
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                {rem.reason}
              </p>

              {/* Variance Impact Tag */}
              {rem.varianceNote && (
                <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 font-medium">
                  Financial Impact: {rem.varianceNote}
                </div>
              )}

              {/* Author & Action footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>
                    Logged by:{" "}
                    <strong className="text-slate-800 font-semibold">{rem.authorName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* CFO Review / Reply Button */}
                  {role === "cfo" && (
                    <button
                      onClick={() => {
                        setActiveReplyId(activeReplyId === rem.id ? null : rem.id);
                        setCfoReplyText(rem.cfoFeedback || "");
                      }}
                      className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>{rem.cfoFeedback ? "Edit CFO Note" : "CFO Sign-Off / Reply"}</span>
                    </button>
                  )}

                  {/* Status Toggle */}
                  {role === "cfo" && rem.status !== "resolved" && (
                    <button
                      onClick={() => updateMisRemarkStatus(rem.id, "resolved")}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}

                  {role === "cfo" && (
                    <button
                      type="button"
                      onClick={() => toggleItemVisibility("mis_remark", rem.id)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        rem.isHidden
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                      }`}
                      title={rem.isHidden ? "Unhide remark" : "Hide remark without deleting"}
                    >
                      {rem.isHidden ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Unhide</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => deleteMisRemark(rem.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Permanently Remove Remark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CFO Feedback Box (if exists) */}
              {rem.cfoFeedback && (
                <div className="mt-2 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Virtual CFO Assessment & Sign-Off:</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                    {rem.cfoFeedback}
                  </p>
                </div>
              )}

              {/* CFO Inline Reply Input */}
              {activeReplyId === rem.id && (
                <div className="mt-3 bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    CFO Supervisory Note / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={cfoReplyText}
                    onChange={(e) => setCfoReplyText(e.target.value)}
                    placeholder="Enter CFO recommendation, audit verification note, or action instruction..."
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(null)}
                      className="px-2.5 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendCfoReply(rem.id)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      Save Sign-Off
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
