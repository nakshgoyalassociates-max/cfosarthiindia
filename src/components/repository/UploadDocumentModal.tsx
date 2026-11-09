import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { RepositoryItem, RepositoryItemType, RepositoryDocument } from "../../types";
import { Upload, X, FileText, CheckCircle2, AlertCircle, FileCheck } from "lucide-react";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: RepositoryItem;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  matter,
}) => {
  const { uploadRepositoryDocument, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RepositoryDocument["category"]>("Notice / Summons");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("application/pdf");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);
      setFileType(file.type || "application/pdf");
      if (!title) {
        // Auto populate title from file name without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName);
      }
      setError(null);
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
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);
      setFileType(file.type || "application/pdf");
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName);
      }
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      setError("Please select or drop a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title for the document.");
      return;
    }

    uploadRepositoryDocument(matter.id, matter.type, {
      title: title.trim(),
      category,
      fileName,
      fileType,
      fileSize: fileSize || "1.2 MB",
      notes: notes.trim() || undefined,
    });

    onClose();
    // Reset form
    setTitle("");
    setFileName("");
    setNotes("");
    setError(null);
  };

  const getMatterTitle = () => {
    if (matter.type === "tax_assessment") return matter.matterTitle;
    if (matter.type === "legal_case") return matter.matterTitle;
    return matter.title;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Matter Document</h3>
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
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Document File <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : fileName
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                className="hidden"
              />

              {fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                      {fileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fileSize} • Click or drag another file to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-700">
                    Drag and drop file here, or{" "}
                    <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, Word, Excel, or Scanned Image (Max 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Display Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scrutiny Notice u/s 143(2) or Fire NOC Clearance 2026"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Classification Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Notice / Summons">Notice / Summons (Departmental / Court)</option>
              <option value="Petition / Reply">Petition / Written Submission / Reply</option>
              <option value="Challan / Payment Receipt">
                Challan / Payment Receipt (Tax / Fees)
              </option>
              <option value="Hearing Record">Hearing Record / Minutes / Order Sheet</option>
              <option value="Assessment Order">Assessment Order / Judicial Ruling / Award</option>
              <option value="License Certificate">
                License Certificate / Official Registration
              </option>
              <option value="SOP Manual / Policy">
                SOP Manual / Standard Operating Procedure Document
              </option>
              <option value="Checklist / Template">
                Operational Checklist / Form / Calculation Template
              </option>
              <option value="Approval Note / Circular">
                Internal Approval Note / Committee Minutes / Circular
              </option>
              <option value="Agreement / Evidence">
                Agreement / Contract / Supporting Evidence
              </option>
              <option value="Other">Other Miscellaneous Record</option>
            </select>
          </div>

          {/* Notes / Context */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Context Notes & Reference (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Filed online on Income Tax e-Portal with acknowledgement no. 91024982..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Uploader Info Tag */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span>
              Uploading as: <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
            <span className="text-slate-400">{new Date().toLocaleDateString("en-GB")}</span>
          </div>

          {/* Action Buttons */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Save & Upload Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
