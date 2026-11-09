import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ProgressBar } from "../common/ProgressBar";
import { getCompliancePeriodicityBadge } from "../../utils/compliancePeriodicity";
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  User,
  FileCheck,
  UploadCloud,
  ExternalLink,
  Lock,
} from "lucide-react";

export const ComplianceDetailModal: React.FC = () => {
  const {
    selectedCompliance,
    setSelectedCompliance,
    toggleSubtask,
    role,
    openComplianceProofModal,
    openComplianceProofView,
  } = useApp();

  const [activeSubtaskNote, setActiveSubtaskNote] = useState<string>("");
  const [activeSubtaskDoc, setActiveSubtaskDoc] = useState<string>("");
  const [editingSubtaskNum, setEditingSubtaskNum] = useState<1 | 2 | 3 | null>(null);

  if (!selectedCompliance) return null;

  const hasProof =
    !!selectedCompliance.completionProofDoc ||
    !!(selectedCompliance.completionProofDocs && selectedCompliance.completionProofDocs.length > 0);
  const activeProof =
    selectedCompliance.completionProofDoc ||
    (selectedCompliance.completionProofDocs && selectedCompliance.completionProofDocs[0]);

  const completedCount = (selectedCompliance.subtasks || []).filter(
    (s) => s && s.status === "completed",
  ).length;
  const pct = Math.round((completedCount / 3) * 100);
  const periodicityBadge = getCompliancePeriodicityBadge(selectedCompliance.frequency);

  const handleSaveNote = (subtaskNum: 1 | 2 | 3) => {
    toggleSubtask(
      selectedCompliance.id,
      subtaskNum,
      activeSubtaskNote || undefined,
      activeSubtaskDoc || undefined,
    );
    setEditingSubtaskNum(null);
    setActiveSubtaskNote("");
    setActiveSubtaskDoc("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                #{selectedCompliance.sNo} {selectedCompliance.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${periodicityBadge.classes} flex items-center gap-1 shadow-2xs`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${periodicityBadge.dotColor}`} />
                <span>
                  {periodicityBadge.text}
                  {periodicityBadge.subLabel ? ` • ${periodicityBadge.subLabel}` : ""}
                </span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Period: {selectedCompliance.period}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {selectedCompliance.name}
            </h2>
            <p className="text-xs text-slate-600">
              <strong>Applicability:</strong> {selectedCompliance.applicability}
            </p>
          </div>

          <button
            onClick={() => setSelectedCompliance(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progressive Bar Status */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Progressive Milestone Completion:</span>
            <span className="font-mono font-bold text-slate-900">
              {pct}% ({completedCount}/3)
            </span>
          </div>
          <ProgressBar
            subtasks={selectedCompliance.subtasks}
            size="lg"
            showLabels={true}
            interactive={true}
            onToggleSubtask={(num) => toggleSubtask(selectedCompliance.id, num)}
          />
        </div>

        {/* Statutory Details Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Statutory Due Date
            </span>
            <p className="font-bold text-slate-900">{selectedCompliance.statutoryDueDate}</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Type of Filing
            </span>
            <p className="font-bold text-slate-900">{selectedCompliance.type}</p>
          </div>
        </div>

        {/* Indicative Penalty Clause */}
        <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Statutory Penalty for Delay (Indicative):</span>
          </div>
          <p className="text-rose-900 leading-relaxed pl-5">{selectedCompliance.penaltyClause}</p>
        </div>

        {/* 3 Detailed Subtask Stages */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            3-Step Subtask Progression & Accountability
          </h3>

          <div className="space-y-3">
            {selectedCompliance.subtasks.map((st) => {
              const isDone = st.status === "completed";
              const isEditing = editingSubtaskNum === st.subtaskNumber;
              const isPriorDone =
                st.subtaskNumber === 1 ||
                selectedCompliance.subtasks[st.subtaskNumber - 2]?.status === "completed";
              const isBlockedByPrior = !isDone && !isPriorDone;

              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-200"
                      : isBlockedByPrior
                        ? "bg-slate-50/60 border-slate-200 opacity-80"
                        : st.subtaskNumber === 2
                          ? "bg-indigo-50/40 border-indigo-200"
                          : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.subtaskNumber === 1
                              ? "bg-amber-100 text-amber-800"
                              : st.subtaskNumber === 2
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Sub-task {st.subtaskNumber}: {st.stageName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800"
                              : isBlockedByPrior
                                ? "bg-slate-200 text-slate-600"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isDone
                            ? "Completed ✓"
                            : isBlockedByPrior
                              ? `Waiting on Step ${st.subtaskNumber - 1} 🔒`
                              : "Pending"}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{st.title}</h4>
                    </div>

                    {isBlockedByPrior ? (
                      <button
                        onClick={() => toggleSubtask(selectedCompliance.id, st.subtaskNumber)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 shadow-2xs"
                        title={`Serial Workflow: Subtask ${st.subtaskNumber - 1} must be completed first`}
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Waiting on Step {st.subtaskNumber - 1} 🔒</span>
                      </button>
                    ) : st.subtaskNumber === 3 && !isDone && !hasProof ? (
                      <button
                        onClick={() => openComplianceProofModal(selectedCompliance)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Proof to Complete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (st.subtaskNumber === 3 && !isDone && !hasProof) {
                            openComplianceProofModal(selectedCompliance);
                            return;
                          }
                          toggleSubtask(selectedCompliance.id, st.subtaskNumber);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 ${
                          isDone
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? "Mark Pending" : "Mark Completed"}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Assigned Person:
                      </span>
                      <strong className="text-slate-800">
                        {st.assignedTo} ({st.assignedRole})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Target Deadline:
                      </span>
                      <strong className="text-slate-800 font-mono">{st.deadline}</strong>
                    </div>
                    {st.completedAt && (
                      <div className="col-span-2 text-emerald-700 font-medium">
                        Completed: {st.completedAt} {st.completedBy ? `by ${st.completedBy}` : ""}
                      </div>
                    )}
                  </div>

                  {st.notes && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                      <strong>Audit Note:</strong> "{st.notes}"
                    </div>
                  )}

                  {st.documentRef && (
                    <div className="text-indigo-700 font-mono font-bold bg-indigo-50/60 p-2 rounded border border-indigo-100">
                      Acknowledgment / ARN: {st.documentRef}
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing ? (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <input
                        type="text"
                        value={activeSubtaskNote}
                        onChange={(e) => setActiveSubtaskNote(e.target.value)}
                        placeholder="Add verification notes or remarks..."
                        className="w-full p-2 border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={activeSubtaskDoc}
                        onChange={(e) => setActiveSubtaskDoc(e.target.value)}
                        placeholder="ARN / Challan No / Ref..."
                        className="w-full p-2 border rounded-lg text-xs font-mono"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingSubtaskNum(null)}
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(st.subtaskNumber)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded font-semibold"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubtaskNum(st.subtaskNumber);
                          setActiveSubtaskNote(st.notes || "");
                          setActiveSubtaskDoc(st.documentRef || "");
                        }}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        + Add / Edit Note & Reference
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Proof of Compliance Filing Card */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                <FileCheck className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Proof of Statutory Filing
                  </span>
                  {hasProof ? (
                    <span className="text-[10px] px-2 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Uploaded & Verified ✓
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      Mandatory For Sign-off
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Acknowledgement receipt / Challan copy required before client team can finalize
                  compliance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasProof && activeProof ? (
                <>
                  <button
                    type="button"
                    onClick={() => openComplianceProofView(selectedCompliance, activeProof)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Filing Proof</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openComplianceProofModal(selectedCompliance)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3 h-3 text-slate-600" />
                    <span>Replace Document</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => openComplianceProofModal(selectedCompliance)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Filing Proof</span>
                </button>
              )}
            </div>
          </div>

          {hasProof && activeProof ? (
            <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-900 truncate">
                  {activeProof.fileName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({activeProof.fileSize})
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {activeProof.arnOrChallanNo}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                Uploaded {activeProof.uploadedAt} by {activeProof.uploadedBy}
              </span>
            </div>
          ) : (
            <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Unless an official filing acknowledgement or challan is uploaded, the final task
                cannot be marked completed.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={() => setSelectedCompliance(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
