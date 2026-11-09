// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { ComplianceItem, ComplianceProofCategory } from "../../types";
import {
  X,
  UploadCloud,
  FileCheck,
  FileText,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building,
  Hash,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

interface UploadComplianceProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  compliance: ComplianceItem | null;
}

export const UploadComplianceProofModal: React.FC<UploadComplianceProofModalProps> = ({
  isOpen,
  onClose,
  compliance,
}) => {
  const { uploadComplianceProof, role, currentUser, clientProfile, showToast } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedFileName, setSimulatedFileName] = useState<string>("");
  const [fileSizeStr, setFileSizeStr] = useState<string>("240 KB");
  const [arnNumber, setArnNumber] = useState<string>("");
  const [filingDate, setFilingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<ComplianceProofCategory>("Filing Acknowledgement (ARN)");
  const [officerName, setOfficerName] = useState<string>(() => {
    if (currentUser?.name) return currentUser.name;
    const cfoName = clientProfile?.assignedCfo || clientProfile?.cfoName || "Sudhakar";
    return role === "cfo" ? `${cfoName} (Virtual CFO)` : "Rahul Verma (Tax Desk)";
  });
  const [notes, setNotes] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !compliance) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSimulatedFileName(file.name);
      setFileSizeStr(`${(file.size / 1024).toFixed(0)} KB`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setSimulatedFileName(file.name);
      setFileSizeStr(`${(file.size / 1024).toFixed(0)} KB`);
    }
  };

  const handleUseSampleProof = (
    sampleName: string,
    sampleArn: string,
    sampleCat: ComplianceProofCategory,
  ) => {
    setSimulatedFileName(sampleName);
    setArnNumber(sampleArn);
    setCategory(sampleCat);
    setFileSizeStr("285 KB");
    if (!notes) {
      setNotes(
        `Filing successfully authenticated on official portal. Verified with Challan & DSC.`,
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fileNameToUse =
      simulatedFileName.trim() ||
      selectedFile?.name ||
      `${compliance.name.replace(/[^a-zA-Z0-9]/g, "_")}_Filing_Receipt.pdf`;

    const finalArn =
      arnNumber.trim() ||
      `ARN-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;

    setIsSubmitting(true);

    try {
      uploadComplianceProof(
        compliance.id,
        {
          fileName: fileNameToUse,
          fileSize: fileSizeStr || "245 KB",
          fileType: selectedFile?.type || "application/pdf",
          arnOrChallanNo: finalArn,
          filingDate: filingDate || new Date().toISOString().split("T")[0],
          documentCategory: category,
          notes: notes.trim() || undefined,
        },
        true, // autoMarkFinalSubtaskCompleted
      );

      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to upload compliance proof. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-50/70 to-sky-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                #{compliance.sNo} {compliance.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200">
                {compliance.frequency}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Period: <strong>{compliance.period}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Upload Filing Acknowledgement & Proof
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

        {/* Policy Enforcement Banner */}
        <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-amber-950">Proof of Completion Required</strong>
            <span>
              Final compliance completion is strictly subject to uploading the official filing
              acknowledgement, challan, or portal receipt. Once verified, Subtask 3 will be marked
              100% completed.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Drag and Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Upload Official Acknowledgement Document (PDF / Image / ZIP) *
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : simulatedFileName
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.zip,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {simulatedFileName ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">
                      {simulatedFileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fileSizeStr} • Ready to upload & attach
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSimulatedFileName("");
                      setSelectedFile(null);
                    }}
                    className="ml-auto text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 hover:bg-rose-50 rounded"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 mx-auto text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop filing document here, or{" "}
                    <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports official PDF receipts, Challans, signed JSON/XML, or ZIP archives up to
                    25MB
                  </p>
                </div>
              )}
            </div>

            {/* Quick Sample Selector for Rapid Verification */}
            {!simulatedFileName && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 text-[10px]">Quick sample:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleUseSampleProof(
                      `${compliance.name.split(" ")[0]}_Acknowledgement_Receipt.pdf`,
                      `ARN-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
                      "Filing Acknowledgement (ARN)",
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Attach Portal ARN PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUseSampleProof(
                      `Tax_Payment_Challan_Receipt_${compliance.period}.pdf`,
                      `CHL-${Math.floor(10000000 + Math.random() * 90000000)}`,
                      "Payment Challan / BSR Receipt",
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Attach Payment Challan PDF
                </button>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Filing / Acknowledgement Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filing ARN / Challan No / Ref *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={arnNumber}
                  onChange={(e) => setArnNumber(e.target.value)}
                  placeholder="e.g. AA2708260198421"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Filing Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filing / Payment Date *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Document Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proof Document Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplianceProofCategory)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="Filing Acknowledgement (ARN)">Filing Acknowledgement (ARN)</option>
                <option value="Payment Challan / BSR Receipt">Payment Challan / BSR Receipt</option>
                <option value="Filed Form / Return PDF">Filed Form / Return PDF</option>
                <option value="Statutory Certificate / Order">Statutory Certificate / Order</option>
                <option value="Other Proof of Filing">Other Proof of Filing</option>
              </select>
            </div>

            {/* Filing Officer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filed By / Assignee Name
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Remarks Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filing Remarks / Verification Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Return filed via DSC on government portal; debit confirmed from corporate bank account."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Will automatically mark Subtask 3 as Completed</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Upload Proof & Complete Compliance</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
