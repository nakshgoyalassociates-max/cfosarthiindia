import React, { useState } from "react";
import {
  X,
  Mail,
  CheckCircle2,
  Calendar,
  Eye,
  User,
  Copy,
  Clock,
  Send,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getMonthlyMisEmailLogs,
  MonthlyMisEmailLog,
} from "../../utils/monthlyMisEmailEngine";
import { useApp } from "../../context/AppContext";

interface MonthlyMisDispatchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  companyName?: string;
}

export const MonthlyMisDispatchLogModal: React.FC<MonthlyMisDispatchLogModalProps> = ({
  isOpen,
  onClose,
  companyId,
}) => {
  const { clientProfile, showToast } = useApp();
  const [selectedLog, setSelectedLog] = useState<MonthlyMisEmailLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const logs = getMonthlyMisEmailLogs(companyId);

  const handleCopyMemo = (log: MonthlyMisEmailLog) => {
    const text = `MONTHLY FINANCIAL MIS MEMO (${log.month})
Company: ${log.companyName}
Approval Date: ${log.approvalDate}
Virtual CFO: ${log.approvedBy} (${log.cfoEmail})
Client Recipient: ${log.clientEmail}

EXECUTIVE SUMMARY:
${log.executiveSummary}

VIRTUAL CFO REMARKS:
${log.cfoRemarks}

BRIEF FINANCIAL MIS METRICS:
Revenue: ${log.metrics.monthlyRevenueFormatted} (${log.metrics.revenueGrowthMom} MoM)
EBITDA: ${log.metrics.ebitdaFormatted} (${log.metrics.ebitdaMarginPercent}%)
Cash & Bank: ${log.metrics.closingCashFormatted} (${log.metrics.cashRunwayMonths} Mo. Runway)
Trade Receivables: ${log.metrics.tradeReceivablesFormatted} (${log.metrics.receivablesOver60DaysFormatted} >60d)
`;
    void navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    showToast("Dispatched MIS memo copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/80 border border-emerald-400/40 flex items-center justify-center text-white shrink-0">
              <Mail className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Monthly MIS Email Dispatch Audit Logs
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {logs.length} Sent
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Audit history of client emails triggered upon CFO approval with copy to CFO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {logs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Mail className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No Email Dispatches Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When the Virtual CFO approves the monthly report through the dashboard, the brief financial MIS, executive summary, and CFO remarks are mailed to the client and copied to the CFO.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* List Column */}
              <div className="md:col-span-5 space-y-2">
                <div className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Sent Transmissions ({logs.length})
                </div>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-200"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{log.month}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Dispatched
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          To: <strong>{log.clientEmail}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Trigger Date: {log.approvalDate}</span>
                          <span className="text-indigo-600 font-medium">By {log.approvedBy}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details Column */}
              <div className="md:col-span-7">
                {selectedLog ? (
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs space-y-3 p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {selectedLog.month} Monthly MIS Transmission
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Dispatched: {new Date(selectedLog.dispatchedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMemo(selectedLog)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedId === selectedLog.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Memo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Routing Details */}
                    <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] space-y-1 font-mono text-slate-700 border border-slate-200/80">
                      <div>
                        <strong>TO:</strong> {selectedLog.clientEmail} (Client Management)
                      </div>
                      <div>
                        <strong>CC:</strong> {selectedLog.cfoEmail} (Virtual CFO Copy)
                      </div>
                      <div>
                        <strong>APPROVAL TRIGGER:</strong> {selectedLog.approvalDate} by {selectedLog.approvedBy}
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                      <div className="font-bold text-indigo-950 text-xs">Executive Summary:</div>
                      <p className="text-[11.5px] text-indigo-900 leading-relaxed">
                        {selectedLog.executiveSummary}
                      </p>
                    </div>

                    {/* CFO Remarks */}
                    <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-300 text-amber-950 space-y-1">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Virtual CFO Remarks:</span>
                        <span className="text-[10px] font-mono font-bold text-amber-800">
                          Approved Date: {selectedLog.approvalDate}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-amber-900 leading-relaxed italic">
                        "{selectedLog.cfoRemarks}"
                      </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                        <div className="text-[10px] text-slate-500">Revenue Achieved</div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedLog.metrics.monthlyRevenueFormatted}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                        <div className="text-[10px] text-slate-500">Operating EBITDA</div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedLog.metrics.ebitdaFormatted} ({selectedLog.metrics.ebitdaMarginPercent}%)
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                        <div className="text-[10px] text-slate-500">Liquid Cash Runway</div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedLog.metrics.closingCashFormatted} ({selectedLog.metrics.cashRunwayMonths} Mo.)
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                        <div className="text-[10px] text-slate-500">Trade Receivables</div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedLog.metrics.tradeReceivablesFormatted}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    Select a dispatched transmission on the left to view the complete email audit memo and details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
};
