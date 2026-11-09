import React, { useState, useMemo } from "react";
import {
  X,
  Mail,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  FileText,
  AlertTriangle,
  Send,
  Eye,
  Check,
  ShieldCheck,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MonthlyExecutiveReport } from "../../types";
import {
  buildMonthlyMisEmailPayload,
  dispatchMonthlyMisEmail,
  MonthlyMisEmailPayload,
} from "../../utils/monthlyMisEmailEngine";
import { formatINR } from "../../utils/format";

interface ApproveAndDispatchMisModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MonthlyExecutiveReport;
  onApprovedAndDispatched?: (updatedReport: MonthlyExecutiveReport) => void;
  financialMIS?: any;
  pnl?: any;
  balanceSheet?: any;
  debtorAgeing?: any;
  clientProfile?: any;
  companyName?: string;
  companyId?: string;
}

export const ApproveAndDispatchMisModal: React.FC<ApproveAndDispatchMisModalProps> = ({
  isOpen,
  onClose,
  report,
  onApprovedAndDispatched,
}) => {
  const {
    clientProfile,
    financialMIS,
    currentUser,
    userAccounts,
    saveExecutiveReport,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"configure" | "preview">("configure");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields
  const initialPayload = useMemo(() => {
    return buildMonthlyMisEmailPayload({
      report,
      financialMIS,
      clientProfile,
      currentUser,
      userAccounts,
    });
  }, [report, financialMIS, clientProfile, currentUser, userAccounts]);

  const [approvalDate, setApprovalDate] = useState<string>(
    report.approvalDate ||
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  );
  const [clientEmail, setClientEmail] = useState<string>(
    report.clientMailTo || initialPayload.clientEmail,
  );
  const [cfoEmail, setCfoEmail] = useState<string>(
    report.cfoMailCc || initialPayload.cfoEmail,
  );
  const [cfoRemarks, setCfoRemarks] = useState<string>(
    report.cfoRemarks || initialPayload.cfoRemarks,
  );
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    report.executiveSummary || initialPayload.executiveSummary,
  );

  if (!isOpen) return null;

  const currentPayload: MonthlyMisEmailPayload = {
    ...initialPayload,
    approvalDate,
    clientEmail,
    cfoEmail,
    cfoRemarks,
    executiveSummary,
    subject: `Monthly Financial MIS (${initialPayload.month}) — ${clientProfile.companyName} [Virtual CFO Approved]`,
  };

  const handleApproveAndSend = () => {
    if (!clientEmail || !clientEmail.includes("@")) {
      showToast("Please provide a valid Client email address.");
      return;
    }
    if (!cfoEmail || !cfoEmail.includes("@")) {
      showToast("Please provide a valid CFO copy email address.");
      return;
    }

    setIsSending(true);

    try {
      // 1. Dispatch email and log
      const log = dispatchMonthlyMisEmail(currentPayload);

      // 2. Prepare updated report
      const updatedReport: MonthlyExecutiveReport = {
        ...report,
        approvalStatus: "approved",
        approvedBy: currentPayload.approvedBy,
        approvedByEmail: currentPayload.approvedByEmail,
        approvedAt: new Date().toISOString(),
        approvalDate: currentPayload.approvalDate,
        cfoRemarks: currentPayload.cfoRemarks,
        executiveSummary: currentPayload.executiveSummary,
        isMailedToClient: true,
        clientMailTo: currentPayload.clientEmail,
        cfoMailCc: currentPayload.cfoEmail,
        mailDispatchedAt: new Date().toISOString(),
        status: "published",
        updatedAt: new Date().toISOString(),
      };

      saveExecutiveReport(updatedReport);

      setIsSending(false);
      setIsSuccess(true);

      showToast(
        `Monthly MIS successfully dispatched to ${clientEmail} with copy to ${cfoEmail}!`,
      );

      if (onApprovedAndDispatched) {
        onApprovedAndDispatched(updatedReport);
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (e) {
      console.error(e);
      setIsSending(false);
      showToast("Error dispatching email. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Mail className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Approve &amp; Mail Monthly Financial MIS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
                  {currentPayload.month}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Brief Financial MIS with Executive Summary &amp; Virtual CFO Remarks to Client (CC CFO)
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

        {/* Tab Switcher: Configure Approval vs Live Email Preview */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("configure")}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "configure"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Approval &amp; Remarks Setup</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Dispatched Email</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Triggered immediately on CFO approval</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === "configure" ? (
            <>
              {/* Trigger & Approval Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/90 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-indigo-950">
                      Approval Trigger Policy
                    </div>
                    <div className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                      Mail is automatically triggered on the exact date when the CFO approves through this dashboard.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <label className="text-[11px] font-semibold text-indigo-900 whitespace-nowrap">
                    Approval Trigger Date:
                  </label>
                  <input
                    type="text"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-300 font-mono text-xs font-bold text-indigo-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-32 shadow-2xs"
                    title="Date on which CFO approves and triggers the mail"
                  />
                </div>
              </div>

              {/* Recipient Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Client Recipient */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Client Recipient (TO:)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  </div>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client.promoter@company.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <div className="text-[10px] text-slate-500">
                    Recipient: {clientProfile.contactPerson || clientProfile.companyName}
                  </div>
                </div>

                {/* CFO Copy (CC) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>CFO Copy (CC:)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                      Auto-Copied
                    </span>
                  </div>
                  <input
                    type="email"
                    value={cfoEmail}
                    onChange={(e) => setCfoEmail(e.target.value)}
                    placeholder="cfo.desk@virtualcfopractice.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <div className="text-[10px] text-slate-500">
                    Virtual CFO: {currentPayload.approvedBy}
                  </div>
                </div>
              </div>

              {/* Brief Financial MIS Snapshot (What goes into the email) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Brief Financial MIS Metrics (Included in Email Table)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {clientProfile.companyName}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">Monthly Revenue</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {currentPayload.metrics.monthlyRevenueFormatted}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-semibold">
                      {currentPayload.metrics.revenueGrowthMom} MoM
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">Operating EBITDA</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {currentPayload.metrics.ebitdaFormatted}
                    </div>
                    <div className="text-[9px] text-indigo-600 font-semibold">
                      {currentPayload.metrics.ebitdaMarginPercent}% Margin
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">Closing Cash &amp; Bank</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {currentPayload.metrics.closingCashFormatted}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-semibold">
                      {currentPayload.metrics.cashRunwayMonths} Mo. Runway
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">Trade Receivables</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {currentPayload.metrics.tradeReceivablesFormatted}
                    </div>
                    <div className="text-[9px] text-amber-600 font-semibold">
                      {currentPayload.metrics.receivablesOver60DaysFormatted} &gt;60d
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Executive Summary (Mailed alongwith MIS)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">High-level narrative</span>
                </div>
                <textarea
                  rows={2}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none leading-relaxed"
                  placeholder="Summarize the core financial story..."
                />
              </div>

              {/* Virtual CFO Remarks Input (Key Requirement) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-950 font-bold">
                      Virtual CFO Remarks (Specific Strategic Comments)
                    </span>
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Mailed to Client &amp; Copied to CFO
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={cfoRemarks}
                  onChange={(e) => setCfoRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none leading-relaxed font-medium"
                  placeholder="Add specific remarks, cash flow advisory, collection notices, or margin instructions from the CFO..."
                />
              </div>
            </>
          ) : (
            /* LIVE EMAIL PREVIEW */
            <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
              {/* Email Client Header Bar */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 space-y-1 text-slate-700 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-16 text-right">From:</span>
                  <span className="font-bold text-slate-900">
                    {currentPayload.approvedBy} &lt;{currentPayload.cfoEmail}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-16 text-right">To:</span>
                  <span className="font-bold text-emerald-800">
                    {clientProfile.companyName} Management &lt;{clientEmail}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-16 text-right">CC:</span>
                  <span className="font-bold text-indigo-800">
                    CFO Desk &lt;{cfoEmail}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-16 text-right">Date:</span>
                  <span className="text-slate-800">
                    {approvalDate} (Triggered upon CFO approval)
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 w-16 text-right">Subject:</span>
                  <span className="font-bold text-slate-950 font-sans text-xs">
                    {currentPayload.subject}
                  </span>
                </div>
              </div>

              {/* Styled Email Body as rendered in client inbox */}
              <div className="p-6 space-y-5 bg-white text-slate-800">
                {/* Brand Header */}
                <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-950 tracking-tight">
                      {clientProfile.companyName}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Monthly Financial MIS &amp; Executive Board Memo — {currentPayload.month}
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
                    Virtual CFO Practice
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed">
                  Dear Management Team,
                  <br />
                  <br />
                  Please find below the brief monthly Financial MIS for <strong>{currentPayload.month}</strong>, reviewed and formally approved by the Virtual CFO desk on <strong>{approvalDate}</strong>.
                </div>

                {/* Executive Summary Block */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {executiveSummary}
                  </p>
                  {currentPayload.summaryPoints && currentPayload.summaryPoints.length > 0 && (
                    <ul className="space-y-1 mt-2 pt-2 border-t border-slate-200 text-[11.5px] text-slate-700 list-disc list-inside">
                      {currentPayload.summaryPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Virtual CFO Remarks Block */}
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-2">
                  <div className="font-bold text-xs flex items-center justify-between text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-700" />
                      <span>Virtual CFO Remarks</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 font-bold text-amber-900">
                      Approved on: {approvalDate}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium italic">
                    "{cfoRemarks}"
                  </p>
                </div>

                {/* Brief Financial MIS Table */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs">
                    Key Financial Performance Summary (Brief MIS)
                  </div>
                  <table className="w-full text-xs border border-slate-200 text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-2 border border-slate-200">Financial Indicator</th>
                        <th className="p-2 border border-slate-200">Achieved Value</th>
                        <th className="p-2 border border-slate-200">Benchmark / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Monthly Net Revenue</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.monthlyRevenueFormatted}
                        </td>
                        <td className="p-2 border border-slate-200 text-emerald-700 font-semibold">
                          {currentPayload.metrics.revenueGrowthMom} MoM
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Gross Margin</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.grossProfitFormatted} ({currentPayload.metrics.grossProfitMargin})
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-600">Healthy Margin</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Operating EBITDA</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.ebitdaFormatted} ({currentPayload.metrics.ebitdaMarginPercent}%)
                        </td>
                        <td className="p-2 border border-slate-200 text-emerald-700 font-semibold">
                          Above 15% Target
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Liquid Cash &amp; Bank Reserves</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.closingCashFormatted}
                        </td>
                        <td className="p-2 border border-slate-200 text-emerald-700 font-semibold">
                          {currentPayload.metrics.cashRunwayMonths} Months Runway
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Trade Receivables</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.tradeReceivablesFormatted}
                        </td>
                        <td className="p-2 border border-slate-200 text-amber-700 font-semibold">
                          {currentPayload.metrics.receivablesOver60DaysFormatted} overdue &gt;60d
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 text-slate-800">Current Ratio &amp; Liquidity</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {currentPayload.metrics.currentRatio}
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-600">Comfortable Buffer</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sign-off Signature */}
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                  <div>Sincerely,</div>
                  <div className="font-bold text-slate-950 text-sm">
                    {currentPayload.approvedBy}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Virtual CFO Desk • {clientProfile.cfoFirm || "Virtual CFO Practice"}
                  </div>
                  <div className="text-[10px] text-indigo-700 font-mono mt-1">
                    Digitally Approved &amp; Dispatched: {approvalDate}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Recipient: <strong className="text-slate-800">{clientEmail}</strong> (CC:{" "}
            <strong className="text-slate-800">{cfoEmail}</strong>)
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApproveAndSend}
              disabled={isSending || isSuccess}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                isSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98"
              } disabled:opacity-75`}
            >
              {isSending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Approving &amp; Dispatching Mail...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved &amp; Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Approve Report &amp; Send Monthly Email to Client (CC CFO)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
