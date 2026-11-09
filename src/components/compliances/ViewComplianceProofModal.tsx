// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ComplianceItem, ComplianceProofDocument } from "../../types";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";
import {
  X,
  FileCheck,
  Download,
  Copy,
  Check,
  Calendar,
  User,
  ShieldCheck,
  Building,
  AlertTriangle,
  Trash2,
  UploadCloud,
  FileText,
  ExternalLink,
} from "lucide-react";

interface ViewComplianceProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  compliance: ComplianceItem | null;
  proof: ComplianceProofDocument | null;
  onReplaceProof?: () => void;
}

export const ViewComplianceProofModal: React.FC<ViewComplianceProofModalProps> = ({
  isOpen,
  onClose,
  compliance,
  proof,
  onReplaceProof,
}) => {
  const { deleteComplianceProof, role, showToast } = useApp();
  const [copiedArn, setCopiedArn] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !compliance || !proof) return null;

  const handleCopyArn = () => {
    navigator.clipboard.writeText(proof.arnOrChallanNo);
    setCopiedArn(true);
    showToast("ARN / Challan number copied to clipboard.", "success");
    setTimeout(() => setCopiedArn(false), 2000);
  };

  const handleDownloadSimulatedDoc = () => {
    const fileHeader = `======================================================
OFFICIAL STATUTORY FILING ACKNOWLEDGEMENT & PROOF
======================================================
Compliance: ${compliance.name}
Category: ${compliance.category}
Frequency: ${compliance.frequency}
Period: ${compliance.period}
Statutory Due Date: ${compliance.statutoryDueDate}

Filing Details:
ARN / Challan No: ${proof.arnOrChallanNo}
Filing Date: ${proof.filingDate}
Document Category: ${proof.documentCategory}
Uploaded By: ${proof.uploadedBy}
Uploaded At: ${proof.uploadedAt}
File Name: ${proof.fileName}

Verification Remarks:
${proof.notes || "Verified by Virtual CFO & Client Compliance Desk."}

Status: OFFICIALLY COMPLETED & ARCHIVED
======================================================`;

    const blob = new Blob([fileHeader], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = proof.fileName.endsWith(".pdf") ? proof.fileName : `${proof.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloading proof document: ${proof.fileName}`, "info");
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteComplianceProof(compliance.id, proof.id);
    showToast(`Removed filing proof "${proof.fileName}" for ${compliance.name}`);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-emerald-50/70 to-teal-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                Proof of Completion ✓
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                {compliance.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Period: {compliance.period}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Statutory Filing Acknowledgement
            </h2>
            <p className="text-xs text-slate-600">{compliance.name}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Main Document Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 break-all line-clamp-1">
                  {proof.fileName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {proof.fileSize || "245 KB"} • {proof.documentCategory}
                </p>
                <p className="text-[10.5px] text-emerald-700 font-medium">
                  Uploaded {proof.uploadedAt}
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadSimulatedDoc}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Key Reference Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* ARN / Challan Reference */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Filing ARN / Challan No
                </span>
                <button
                  onClick={handleCopyArn}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedArn ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ARN</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold font-mono text-indigo-700 tracking-wide bg-indigo-50/70 px-2.5 py-1 rounded border border-indigo-100">
                {proof.arnOrChallanNo}
              </p>
            </div>

            {/* Filing Date */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Filing Date
              </span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{proof.filingDate}</span>
              </p>
            </div>

            {/* Uploaded By */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Uploaded By / Officer
              </span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5 line-clamp-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{proof.uploadedBy}</span>
              </p>
            </div>
          </div>

          {/* Notes / Remarks */}
          {proof.notes && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Verification Remarks
              </span>
              <p className="text-slate-700 italic">"{proof.notes}"</p>
            </div>
          )}

          {/* Actions & Replace */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {onReplaceProof && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReplaceProof();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>Replace Proof</span>
                </button>
              )}

              {role === "cfo" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Proof</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ConfirmDestructiveDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove Filing Proof"
        description={`Are you sure you want to remove the filing proof "${proof.fileName}" for "${compliance.name}"? Compliance subtask 3 will return to pending status.`}
        confirmLabel="Remove Proof"
        onConfirm={confirmDelete}
      />
    </div>
  );
};
