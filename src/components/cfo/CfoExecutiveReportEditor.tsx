import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ExpandableParagraph } from "../common/ExpandableParagraph";
import { MonthlyExecutiveReport, ExecutiveObservation } from "../../types";
import { ApproveAndDispatchMisModal } from "../modals/ApproveAndDispatchMisModal";
import { MonthlyMisDispatchLogModal } from "../modals/MonthlyMisDispatchLogModal";
import {
  generateAiFinancialObservationsFromMis,
  fetchAiCfoObservationsFromServer,
  getReportSummaryPoints,
} from "../../utils/aiFinancialObservations";
import {
  FileText,
  Save,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw,
  Edit3,
  ArrowUpRight,
  ListChecks,
  Bot,
  UserCheck,
  Mail,
  History,
} from "lucide-react";

const OBSERVATION_CATEGORIES: ExecutiveObservation["category"][] = [
  "Revenue & Margin",
  "Cash & Treasury",
  "Working Capital & Debtors",
  "Tax & Compliance",
  "Cost & Budget",
  "Legal & Risk",
  "Operational",
];

export const CfoExecutiveReportEditor: React.FC = () => {
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    executiveReports,
    saveExecutiveReport,
    showToast,
    currentUser,
    allMISMap,
    allCompliancesMap,
    financialMIS,
    compliances,
    setRole,
    setActiveTab,
  } = useApp();

  // Active company for the report
  const activeCompanyId =
    selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : "client-101";
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];
  const companyMis = allMISMap?.[activeCompanyId] || financialMIS;
  const companyCompliances = allCompliancesMap?.[activeCompanyId] || compliances || [];

  const companyReports = executiveReports[activeCompanyId] || [];

  // Available months
  const defaultMonths = [
    { label: "September 2026", key: "2026-09" },
    { label: "August 2026", key: "2026-08" },
    { label: "July 2026", key: "2026-07" },
    { label: "October 2026", key: "2026-10" },
  ];

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("2026-09");
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isDispatchLogModalOpen, setIsDispatchLogModalOpen] = useState<boolean>(false);

  // Form State
  const [reportTitle, setReportTitle] = useState("");
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [observations, setObservations] = useState<ExecutiveObservation[]>([]);
  const [cfoDirectives, setCfoDirectives] = useState<string[]>([]);
  const [revenueHighlight, setRevenueHighlight] = useState("");
  const [ebitdaHighlight, setEbitdaHighlight] = useState("");
  const [runwayHighlight, setRunwayHighlight] = useState("");
  const [complianceHighlight, setComplianceHighlight] = useState("");
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string>("");

  // New inputs
  const [newSummaryPointText, setNewSummaryPointText] = useState("");
  const [newDirectiveText, setNewDirectiveText] = useState("");

  //New observation temporary draft state
  const [newObsCategory, setNewObsCategory] =
    useState<ExecutiveObservation["category"]>("Revenue & Margin");
  const [newObsImpact, setNewObsImpact] = useState<ExecutiveObservation["impact"]>("positive");
  const [newObsText, setNewObsText] = useState("");
  const [newObsRec, setNewObsRec] = useState("");
  const [isAddingObs, setIsAddingObs] = useState(false);

  // Load report data when month or company changes (or auto-generate via AI if none exists)
  useEffect(() => {
    const existing = companyReports.find((r) => r.monthKey === selectedMonthKey);
    const monthObj = defaultMonths.find((m) => m.key === selectedMonthKey);
    const monthLabel = monthObj?.label || selectedMonthKey;

    if (existing) {
      setReportTitle(existing.title || `CFO Desk Executive Summary — ${monthLabel}`);
      const pts = getReportSummaryPoints(existing);
      setSummaryPoints(pts);
      setStatus(existing.status || "published");
      setObservations(
        (existing.observations || []).map((o) => ({
          ...o,
          source: o.source || "ai_generated",
        })),
      );
      setCfoDirectives(existing.cfoDirectives || []);
      setRevenueHighlight(existing.financialHighlights?.revenue || "");
      setEbitdaHighlight(existing.financialHighlights?.ebitda || "");
      setRunwayHighlight(existing.financialHighlights?.cashRunway || "");
      setComplianceHighlight(existing.financialHighlights?.complianceScore || "");
      setAiGeneratedAt(existing.aiGeneratedAt || existing.publishedAt || new Date().toISOString());
      setLastSavedTime(existing.cfoSavedAt || existing.updatedAt || existing.publishedAt || "");
      setHasUnsavedChanges(false);
    } else if (activeCompany) {
      // Step 1: Automatically generate pointwise financial observations & executive summary via AI engine
      const generated = generateAiFinancialObservationsFromMis({
        company: activeCompany,
        monthLabel,
        mis: companyMis,
        compliances: companyCompliances,
      });
      setReportTitle(generated.title);
      setSummaryPoints(generated.summaryPoints);
      setStatus("published");
      setObservations(generated.observations);
      setCfoDirectives(generated.cfoDirectives);
      setRevenueHighlight(generated.financialHighlights.revenue);
      setEbitdaHighlight(generated.financialHighlights.ebitda);
      setRunwayHighlight(generated.financialHighlights.cashRunway);
      setComplianceHighlight(generated.financialHighlights.complianceScore);
      setAiGeneratedAt(new Date().toISOString());
      setLastSavedTime("");
      setHasUnsavedChanges(true);
    }
  }, [activeCompanyId, selectedMonthKey]);

  // Trigger AI Financial Observation Generation (Calls Server Gemini API + Live MIS Telemetry)
  const handleGenerateWithAi = async () => {
    if (!activeCompany) return;
    setIsGeneratingAi(true);
    const monthObj = defaultMonths.find((m) => m.key === selectedMonthKey);
    const monthLabel = monthObj?.label || selectedMonthKey;

    try {
      const generated = await fetchAiCfoObservationsFromServer({
        company: activeCompany,
        monthLabel,
        mis: companyMis,
        compliances: companyCompliances,
      });

      setReportTitle(generated.title);
      setSummaryPoints(generated.summaryPoints);
      setObservations(generated.observations);
      setCfoDirectives(generated.cfoDirectives);
      setRevenueHighlight(generated.financialHighlights.revenue);
      setEbitdaHighlight(generated.financialHighlights.ebitda);
      setRunwayHighlight(generated.financialHighlights.cashRunway);
      setComplianceHighlight(generated.financialHighlights.complianceScore);
      setAiGeneratedAt(new Date().toISOString());
      setHasUnsavedChanges(true);
      showToast(
        `AI generated ${generated.summaryPoints.length} pointwise executive summary points & ${generated.observations.length} financial observations for ${activeCompany.companyName}. You can now modify & save to Client Dashboard.`,
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save & Auto-Update to Client Dashboard
  const handleSave = (publishMode: "draft" | "published" = "published") => {
    const monthObj = defaultMonths.find((m) => m.key === selectedMonthKey);
    const monthLabel = monthObj?.label || selectedMonthKey;
    const cleanedPoints = summaryPoints.map((p) => p.trim()).filter(Boolean);
    const nowIso = new Date().toISOString();

    const updatedReport: MonthlyExecutiveReport = {
      id: `rep-${activeCompanyId}-${selectedMonthKey}`,
      companyId: activeCompanyId,
      month: monthLabel,
      monthKey: selectedMonthKey,
      title:
        reportTitle.trim() || `CFO Desk Executive Summary & Financial Observations — ${monthLabel}`,
      summaryPoints: cleanedPoints,
      executiveSummary: cleanedPoints.map((pt, idx) => `${idx + 1}. ${pt}`).join("\n"),
      observations,
      cfoDirectives: cfoDirectives.map((d) => d.trim()).filter(Boolean),
      financialHighlights: {
        revenue: revenueHighlight,
        ebitda: ebitdaHighlight,
        cashRunway: runwayHighlight,
        complianceScore: complianceHighlight,
      },
      aiGeneratedAt: aiGeneratedAt || nowIso,
      cfoSavedAt: nowIso,
      status: publishMode,
      authorName:
        currentUser.name || activeCompany?.assignedCfo || activeCompany?.cfoName || "Virtual CFO",
      authorRole: currentUser.roleTitle || "Virtual CFO & Partner",
      publishedAt: nowIso,
      updatedAt: nowIso,
    };

    saveExecutiveReport(updatedReport);
    setStatus(publishMode);
    setLastSavedTime(nowIso);
    setHasUnsavedChanges(false);

    if (publishMode === "published") {
      showToast(
        `Saved by CFO! Pointwise Executive Summary & Financial Observations automatically updated on ${activeCompany?.companyName || "Client"}'s Dashboard.`,
      );
    } else {
      showToast(`Draft saved for ${monthLabel}.`);
    }
  };

  // Pointwise Summary Point handlers
  const handleUpdateSummaryPoint = (index: number, value: string) => {
    setSummaryPoints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddSummaryPoint = () => {
    if (!newSummaryPointText.trim()) {
      showToast("Please enter a summary point to add.");
      return;
    }
    setSummaryPoints((prev) => [...prev, newSummaryPointText.trim()]);
    setNewSummaryPointText("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveSummaryPoint = (index: number) => {
    setSummaryPoints((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Inline Observation modification handlers (Marks AI observations as CFO-modified when edited)
  const handleUpdateObservation = (id: string, updates: Partial<ExecutiveObservation>) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id !== id) return obs;
        const nextSource = obs.source === "cfo_added" ? "cfo_added" : "cfo_modified";
        return {
          ...obs,
          ...updates,
          source: nextSource,
        };
      }),
    );
    setHasUnsavedChanges(true);
  };

  const handleAddObservation = () => {
    if (!newObsText.trim()) {
      showToast("Please enter observation details.");
      return;
    }

    const newObs: ExecutiveObservation = {
      id: `obs-cfo-${Date.now()}`,
      category: newObsCategory,
      observation: newObsText.trim(),
      impact: newObsImpact,
      recommendation: newObsRec.trim() || undefined,
      source: "cfo_added",
    };

    setObservations((prev) => [...prev, newObs]);
    setNewObsText("");
    setNewObsRec("");
    setIsAddingObs(false);
    setHasUnsavedChanges(true);
  };

  const handleRemoveObservation = (id: string) => {
    setObservations((prev) => prev.filter((o) => o.id !== id));
    setHasUnsavedChanges(true);
  };

  // Directive handlers
  const handleUpdateDirective = (index: number, val: string) => {
    setCfoDirectives((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddDirective = () => {
    if (!newDirectiveText.trim()) return;
    setCfoDirectives((prev) => [...prev, newDirectiveText.trim()]);
    setNewDirectiveText("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveDirective = (index: number) => {
    setCfoDirectives((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const currentMonthObj = defaultMonths.find((m) => m.key === selectedMonthKey);
  const activeReport: MonthlyExecutiveReport =
    companyReports.find((r) => r.monthKey === selectedMonthKey) || {
      id: `rep-${activeCompanyId}-${selectedMonthKey}`,
      companyId: activeCompanyId,
      month: currentMonthObj?.label || "September 2026",
      monthKey: selectedMonthKey,
      title: reportTitle || `CFO Desk Executive Summary — ${currentMonthObj?.label || "September 2026"}`,
      summaryPoints,
      executiveSummary:
        summaryPoints.join(" ") ||
        companyMis?.cfoExecutiveSummary ||
        "Operating margins maintained. Cash runway remains healthy.",
      observations,
      cfoDirectives,
      status,
      authorName: currentUser.name || "Virtual CFO",
      authorRole: "Virtual CFO",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const isMailed = activeReport.isMailedToClient || activeReport.approvalStatus === "approved";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Clean Light Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ListChecks className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            CFO Executive Synopsis &amp; Observations
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-[10.5px] font-semibold flex items-center gap-1 ${
              hasUnsavedChanges ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {hasUnsavedChanges ? "Unsaved" : "Synced to Client"}
          </span>
          {isMailed && (
            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-700" />
              <span>Emailed to Client ✓ ({activeReport.approvalDate || "Verified"})</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Prominent Approve & Email MIS Button */}
          <button
            type="button"
            onClick={() => setIsApproveModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isMailed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40"
            }`}
            title="Approve Monthly Financial MIS & Dispatch Email to Client (CC CFO)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isMailed ? "Monthly MIS Emailed ✓" : "Email Brief MIS to Client"}</span>
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

          <select
            value={activeCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-slate-100/90 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>

          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="bg-slate-100/90 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
          >
            {defaultMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleGenerateWithAi}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
            <span>{isGeneratingAi ? "Analyzing..." : "AI Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !showPreview
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showPreview ? "Edit Points" : "Synopsis View"}</span>
          </button>

          {(!showPreview || hasUnsavedChanges) && (
            <button
              type="button"
              onClick={() => handleSave("published")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Sync</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">


        {showPreview ? (
          /* COMPACT 2-COLUMN SYNOPSIS VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Pointwise Executive Summary + Directives */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Key Executive Takeaways ({summaryPoints.length})
                </h4>
                <div className="bg-slate-50/70 rounded-xl p-3.5 space-y-2">
                  {summaryPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="font-medium flex-1">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {cfoDirectives.length > 0 && (
                <div className="bg-amber-50/60 rounded-xl p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>CFO Action Directives ({cfoDirectives.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {cfoDirectives.map((directive, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed"
                      >
                        <span className="text-amber-700 font-mono font-bold text-[11px] shrink-0">
                          {idx + 1}.
                        </span>
                        <span>{directive}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Financial Observations Synopsis */}
            <div className="lg:col-span-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Financial Observations ({observations.length})
              </h4>
              <div className="space-y-2">
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    className={`p-3 rounded-xl bg-slate-50/80 border-l-3 text-xs space-y-1 ${
                      obs.impact === "positive"
                        ? "border-l-emerald-500"
                        : obs.impact === "critical"
                          ? "border-l-rose-500"
                          : "border-l-amber-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-[11.5px]">{obs.category}</span>
                      <span
                        className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded ${
                          obs.impact === "positive"
                            ? "bg-emerald-50 text-emerald-700"
                            : obs.impact === "critical"
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
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* CFO DESK EDITABLE POINTWISE WORKSPACE */
          <div className="space-y-6">
            {/* SECTION 1: SIMPLE EXECUTIVE SUMMARY FROM CFO DESK (POINTWISE & EDITABLE) */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Pointwise Executive Summary
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Simple Executive Summary from CFO — CFO Desk ({summaryPoints.length} Points)
                    </h3>
                  </div>
                </div>
              </div>

              {/* Editable Pointwise List */}
              <div className="space-y-2">
                {summaryPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-2xs"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={point}
                      onChange={(e) => handleUpdateSummaryPoint(idx, e.target.value)}
                      placeholder={`Enter Executive Summary Point #${idx + 1}...`}
                      className="flex-1 text-xs text-slate-800 font-medium leading-relaxed bg-transparent border border-transparent focus:border-indigo-300 focus:bg-slate-50/50 rounded-lg p-1.5 focus:outline-hidden resize-y"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSummaryPoint(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0 mt-0.5"
                      title="Delete this summary point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Summary Point */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSummaryPointText}
                  onChange={(e) => setNewSummaryPointText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSummaryPoint();
                    }
                  }}
                  placeholder="Add another pointwise CFO Executive Summary observation and press Enter or click Add Point..."
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddSummaryPoint}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: AI-GENERATED FINANCIAL OBSERVATIONS (MODIFIABLE BY CFO POINTWISE) */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      AI + CFO Financial Observations
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Pointwise Financial Observations — Auto-Generated by AI &amp; Editable by CFO
                      ({observations.length})
                    </h3>
                  </div>
                </div>

                {!isAddingObs && (
                  <button
                    type="button"
                    onClick={() => setIsAddingObs(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add CFO Observation Point</span>
                  </button>
                )}
              </div>

              {/* Inline Add Observation Form */}
              {isAddingObs && (
                <div className="p-4 rounded-xl border-2 border-indigo-300 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Add New CFO Financial Observation Point
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingObs(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                        Observation Category
                      </label>
                      <select
                        value={newObsCategory}
                        onChange={(e) =>
                          setNewObsCategory(e.target.value as ExecutiveObservation["category"])
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        {OBSERVATION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                        Impact / Priority Status
                      </label>
                      <select
                        value={newObsImpact}
                        onChange={(e) =>
                          setNewObsImpact(e.target.value as ExecutiveObservation["impact"])
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        <option value="positive">Positive (Strength / On-Track)</option>
                        <option value="watch">Watch (Monitor Variance)</option>
                        <option value="critical">Critical (Immediate Action Required)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                      Financial Observation Point
                    </label>
                    <textarea
                      rows={2}
                      value={newObsText}
                      onChange={(e) => setNewObsText(e.target.value)}
                      placeholder="Enter specific financial observation..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                      CFO Action / Recommendation
                    </label>
                    <input
                      type="text"
                      value={newObsRec}
                      onChange={(e) => setNewObsRec(e.target.value)}
                      placeholder="Enter recommended CFO action or directive..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingObs(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddObservation}
                      className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shadow-2xs"
                    >
                      Add Observation Point
                    </button>
                  </div>
                </div>
              )}

              {/* Editable List of Pointwise Financial Observations */}
              <div className="space-y-3">
                {observations.map((obs, idx) => (
                  <div
                    key={obs.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10.5px]">
                          Point #{idx + 1}
                        </span>

                        {/* Editable Category Dropdown */}
                        <select
                          value={obs.category}
                          onChange={(e) =>
                            handleUpdateObservation(obs.id, {
                              category: e.target.value as ExecutiveObservation["category"],
                            })
                          }
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
                        >
                          {OBSERVATION_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        {/* Editable Impact Dropdown */}
                        <select
                          value={obs.impact}
                          onChange={(e) =>
                            handleUpdateObservation(obs.id, {
                              impact: e.target.value as ExecutiveObservation["impact"],
                            })
                          }
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase cursor-pointer border ${
                            obs.impact === "positive"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : obs.impact === "critical"
                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          <option value="positive">Positive</option>
                          <option value="watch">Watch</option>
                          <option value="critical">Critical</option>
                        </select>

                        {/* Origin Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            obs.source === "cfo_modified"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : obs.source === "cfo_added"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {obs.source === "cfo_modified" ? (
                            <>
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>AI + CFO Modified</span>
                            </>
                          ) : obs.source === "cfo_added" ? (
                            <>
                              <UserCheck className="w-2.5 h-2.5" />
                              <span>Added by CFO</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-2.5 h-2.5" />
                              <span>AI Generated Observation</span>
                            </>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveObservation(obs.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Remove this observation point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Editable Financial Observation Text */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Financial Observation (Editable by CFO):
                      </label>
                      <textarea
                        rows={2}
                        value={obs.observation}
                        onChange={(e) =>
                          handleUpdateObservation(obs.id, { observation: e.target.value })
                        }
                        className="w-full text-xs text-slate-900 font-medium bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-lg p-2 focus:outline-hidden leading-relaxed"
                      />
                    </div>

                    {/* Editable CFO Recommendation / Action */}
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-0.5">
                        CFO Observation / Recommended Action:
                      </label>
                      <input
                        type="text"
                        value={obs.recommendation || ""}
                        onChange={(e) =>
                          handleUpdateObservation(obs.id, { recommendation: e.target.value })
                        }
                        placeholder="Add CFO action recommendation or specific remark..."
                        className="w-full text-xs text-slate-800 bg-indigo-50/30 focus:bg-white border border-indigo-200/80 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: POINTWISE CFO DIRECTIVES & KEY SNAPSHOT METRICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Pointwise Action Directives */}
              <div className="lg:col-span-7 bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Pointwise CFO Action Directives for Client Leadership ({cfoDirectives.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {cfoDirectives.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={d}
                        onChange={(e) => handleUpdateDirective(idx, e.target.value)}
                        className="flex-1 text-xs text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-hidden py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDirectiveText}
                    onChange={(e) => setNewDirectiveText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDirective();
                      }
                    }}
                    placeholder="Add a new pointwise CFO directive..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirective}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Add Directive
                  </button>
                </div>
              </div>

              {/* Snapshot Highlight Badges */}
              <div className="lg:col-span-5 bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Key Month Highlights Strip
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Monthly Revenue
                    </span>
                    <input
                      type="text"
                      value={revenueHighlight}
                      onChange={(e) => {
                        setRevenueHighlight(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      EBITDA / Margin
                    </span>
                    <input
                      type="text"
                      value={ebitdaHighlight}
                      onChange={(e) => {
                        setEbitdaHighlight(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold">Cash Runway</span>
                    <input
                      type="text"
                      value={runwayHighlight}
                      onChange={(e) => {
                        setRunwayHighlight(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Compliance Score
                    </span>
                    <input
                      type="text"
                      value={complianceHighlight}
                      onChange={(e) => {
                        setComplianceHighlight(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Ready to publish changes to Client View?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSave("published")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save &amp; Sync to Client Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Financial MIS Email Dispatch & Approval Modal */}
      <ApproveAndDispatchMisModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        report={activeReport}
        onApprovedAndDispatched={(updatedReport) => {
          saveExecutiveReport(updatedReport);
          showToast(
            `Monthly MIS successfully dispatched to ${updatedReport.clientMailTo || "client"} with copy to ${updatedReport.cfoMailCc || currentUser?.email}!`,
          );
        }}
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
