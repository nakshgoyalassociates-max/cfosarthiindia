import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { ExpandableParagraph } from "../common/ExpandableParagraph";
import {
  generateAiFinancialObservationsFromMis,
  getReportSummaryPoints,
} from "../../utils/aiFinancialObservations";
import { ApproveAndDispatchMisModal } from "../modals/ApproveAndDispatchMisModal";
import { MonthlyMisDispatchLogModal } from "../modals/MonthlyMisDispatchLogModal";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Edit3,
  Bot,
  ListChecks,
  ArrowUpRight,
  Mail,
  Eye,
  History,
} from "lucide-react";

export const ClientExecutiveReportView: React.FC = () => {
  const {
    clientProfile,
    getReportsForCompany,
    selectedCompanyId,
    financialMIS,
    compliances,
    role,
    setRole,
    setCfoViewMode,
    setActiveTab,
  } = useApp();

  const activeCompanyId =
    selectedCompanyId && selectedCompanyId !== "all"
      ? selectedCompanyId
      : clientProfile.id || "client-101";
  const savedReports = getReportsForCompany(activeCompanyId);

  // If no saved report exists yet for this company, auto-generate the initial AI financial observation report
  const reports = useMemo(() => {
    if (savedReports.length > 0) return savedReports;
    const aiGenerated = generateAiFinancialObservationsFromMis({
      company: clientProfile,
      monthLabel: financialMIS.period || "September 2026",
      mis: financialMIS,
      compliances,
    });
    return [
      {
        id: `auto-rep-${activeCompanyId}`,
        companyId: activeCompanyId,
        month: financialMIS.period || "September 2026",
        monthKey: "2026-09",
        title: aiGenerated.title,
        summaryPoints: aiGenerated.summaryPoints,
        executiveSummary: aiGenerated.executiveSummary,
        observations: aiGenerated.observations,
        cfoDirectives: aiGenerated.cfoDirectives,
        financialHighlights: aiGenerated.financialHighlights,
        status: "published" as const,
        authorName: clientProfile.assignedCfo || clientProfile.cfoName || "Virtual CFO",
        authorRole: `Virtual CFO • ${clientProfile.cfoFirm || "Virtual CFO Practice"}`,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [savedReports, activeCompanyId, clientProfile, financialMIS, compliances]);

  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports.length > 0 ? reports[0].id : "",
  );
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isDispatchLogModalOpen, setIsDispatchLogModalOpen] = useState<boolean>(false);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const summaryPoints = useMemo(() => getReportSummaryPoints(activeReport), [activeReport]);
  const isMailed = activeReport.isMailedToClient || activeReport.approvalStatus === "approved";

  const handleOpenInCfoDesk = () => {
    setRole("cfo");
    setCfoViewMode("single_company");
    setActiveTab("dashboard");
    setTimeout(() => {
      const el = document.getElementById("executive-report");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      id="executive-report"
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
    >
      {/* Header with Period Switcher & Edit in CFO Desk Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ListChecks className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            CFO Executive Summary &amp; Observations
          </h2>
          <span className="text-xs text-slate-500">
            · By {activeReport.authorName || clientProfile.cfoName}
          </span>
          {isMailed && (
            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-700" />
              <span>Emailed to Client ✓ ({activeReport.approvalDate || "Verified"})</span>
            </span>
          )}
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Prominent View Sent Email / Email MIS Button */}
          <button
            type="button"
            onClick={() => setIsApproveModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isMailed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
            title="View or Trigger Monthly Financial MIS Email to Client"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isMailed ? "View Sent MIS Email" : "Email Brief MIS"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDispatchLogModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="View Monthly MIS Email Dispatch Audit Logs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dispatch Logs</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={activeReport.id}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.month} {r.status === "published" ? "✓" : "(Draft)"}
                </option>
              ))}
            </select>
          </div>

          {role === "cfo" && (
            <button
              type="button"
              onClick={handleOpenInCfoDesk}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open report in CFO Command Desk editor"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>CFO Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Financial MIS Email Dispatch Banner */}
      {isMailed ? (
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-2 flex-wrap">
                <span>Monthly Financial MIS Emailed to Client</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Triggered on CFO Approval: {activeReport.approvalDate || "Verified"}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                TO: <strong>{activeReport.clientMailTo || clientProfile.email}</strong> • CC:{" "}
                <strong>{activeReport.cfoMailCc || clientProfile.cfoEmail || "CFO Desk"}</strong> • Authorized by{" "}
                <strong>{activeReport.approvedBy || activeReport.authorName || "Virtual CFO"}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Dispatched Email</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDispatchLogModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Audit Logs
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-2 flex-wrap">
                <span>Monthly MIS Email Dispatch Workflow</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Automated
                </span>
              </div>
              <div className="text-[11px] text-indigo-800 mt-0.5">
                Brief Financial MIS alongwith Executive Summary &amp; Virtual CFO Remarks is dispatched to client email (with copy to CFO email) on the date when the CFO approves.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsApproveModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs active:scale-98"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Brief MIS to Client</span>
          </button>
        </div>
      )}

      {/* 2-Column Executive Briefing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (7 cols): Pointwise Executive Summary + Directives */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Key Executive Takeaways ({summaryPoints.length})
            </h3>
            <div className="bg-slate-50/70 rounded-xl p-3.5 space-y-2.5">
              {summaryPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <ExpandableParagraph text={point} className="font-medium text-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CFO Action Directives */}
          {activeReport.cfoDirectives && activeReport.cfoDirectives.length > 0 && (
            <div id="cfo-alerts" className="bg-amber-50/60 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Action Directives for Leadership</span>
              </h4>
              <div className="space-y-1.5">
                {activeReport.cfoDirectives.map((directive, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed"
                  >
                    <span className="text-amber-700 font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <ExpandableParagraph text={directive} className="text-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Key Financial Observations */}
        {activeReport.observations && activeReport.observations.length > 0 && (
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Financial Observations ({activeReport.observations.length})
            </h3>
            <div className="space-y-2.5">
              {activeReport.observations.map((obs) => {
                const isPositive = obs.impact === "positive";
                const isCritical = obs.impact === "critical";

                return (
                  <div
                    key={obs.id}
                    className={`p-3 rounded-xl bg-slate-50/80 border-l-3 text-xs space-y-1 ${
                      isPositive
                        ? "border-l-emerald-500"
                        : isCritical
                          ? "border-l-rose-500"
                          : "border-l-amber-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-[11.5px]">{obs.category}</span>
                      <span
                        className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded ${
                          isPositive
                            ? "bg-emerald-50 text-emerald-700"
                            : isCritical
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {obs.impact}
                      </span>
                    </div>
                    <ExpandableParagraph
                      text={obs.observation}
                      className="text-slate-700 text-[11.5px]"
                    />
                    {obs.recommendation && (
                      <ExpandableParagraph
                        text={obs.recommendation}
                        prefix={<span className="font-semibold text-indigo-800">Action: </span>}
                        className="text-[11px] text-indigo-700 font-medium pt-0.5"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Financial MIS Email Dispatch & Approval Modal */}
      <ApproveAndDispatchMisModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        report={activeReport}
      />

      {/* Monthly MIS Email Dispatch Audit History Drawer */}
      <MonthlyMisDispatchLogModal
        isOpen={isDispatchLogModalOpen}
        onClose={() => setIsDispatchLogModalOpen(false)}
        companyId={activeCompanyId}
      />
    </div>
  );
};
