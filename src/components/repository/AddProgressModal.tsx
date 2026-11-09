import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { RepositoryItem } from "../../types";
import { Clock, X, MessageSquarePlus, CheckCircle, ArrowRight } from "lucide-react";

interface AddProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: RepositoryItem;
}

export const AddProgressModal: React.FC<AddProgressModalProps> = ({ isOpen, onClose, matter }) => {
  const { addRepositoryProgressUpdate, currentUser } = useApp();

  const [status, setStatus] = useState<string>(matter.status);
  const [notes, setNotes] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [documentRef, setDocumentRef] = useState("");

  if (!isOpen) return null;

  const getStatusOptions = () => {
    if (matter.type === "tax_assessment") {
      return [
        "Notice Received",
        "Response Filed",
        "Hearing Scheduled",
        "Under Appeal",
        "Order Passed",
        "Stay Granted",
        "Closed / Dropped",
      ];
    }
    if (matter.type === "legal_case") {
      return [
        "Summons Issued",
        "Written Statement Filed",
        "Evidence Stage",
        "Arguments Concluded",
        "Interim Stay Active",
        "Decreed in Favor",
        "Settlement in Progress",
        "Disposed",
      ];
    }
    if (matter.type === "sop") {
      return [
        "Approved & Active",
        "Under Review",
        "Revision Proposed",
        "Draft",
        "Superseded",
        "Archived",
      ];
    }
    return [
      "Active & Valid",
      "Renewal Due Soon",
      "Renewal In Progress",
      "Expired - Urgent",
      "Surrendered / Dormant",
    ];
  };

  const getMatterTitle = () => {
    if (matter.type === "tax_assessment") return matter.matterTitle;
    if (matter.type === "legal_case") return matter.matterTitle;
    return matter.title;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    addRepositoryProgressUpdate(matter.id, matter.type, {
      status,
      notes: notes.trim(),
      nextSteps: nextSteps.trim() || undefined,
      documentRef: documentRef.trim() || undefined,
    });

    onClose();
    setNotes("");
    setNextSteps("");
    setDocumentRef("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Status & Progress Update</h3>
              <p className="text-xs text-slate-300 truncate max-w-xs">{getMatterTitle()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Matter Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white font-medium text-slate-800"
            >
              {getStatusOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Progress Update Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what was done, discussions with tax officer/advocate, hearings attended, or submissions filed..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Next Steps / Immediate Milestones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Action Milestone / Due Date Focus (Optional)
            </label>
            <input
              type="text"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="e.g. CA to draft rejoinder affidavit by 10th Oct; Next hearing on 24th Oct"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Document Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Related Document Reference / Filing Acknowledgement (Optional)
            </label>
            <input
              type="text"
              value={documentRef}
              onChange={(e) => setDocumentRef(e.target.value)}
              placeholder="e.g. Ack No. ITBA/1940291 or Order dated 12-Sep-2026"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Author Tag */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span>
              Logged by: <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
            <span className="text-slate-400">{new Date().toLocaleDateString("en-GB")}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save Progress Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
