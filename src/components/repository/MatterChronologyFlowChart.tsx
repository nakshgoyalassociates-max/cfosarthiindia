import React, { useState } from "react";
import {
  RepositoryItem,
  CaseChronologyEvent,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
  SopMatter,
  SopStep,
} from "../../types";
import { formatINR as formatCurrency } from "../../utils/format";
import {
  History,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDown,
  ArrowUpDown,
  FileText,
  Scale,
  ShieldAlert,
  Award,
  IndianRupee,
  CheckSquare,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Sparkles,
  GitBranch,
  Shield,
  Layers,
  FileCheck,
  User,
  Building,
} from "lucide-react";

interface MatterChronologyFlowChartProps {
  matter: RepositoryItem;
  onAddEvent?: () => void;
  onOpenDossier?: () => void;
  onUploadDoc?: () => void;
  compact?: boolean;
}

export const MatterChronologyFlowChart: React.FC<MatterChronologyFlowChartProps> = ({
  matter,
  onAddEvent,
  onOpenDossier,
  onUploadDoc,
  compact = false,
}) => {
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  // Track which events are currently extended (empty by default so only short descriptions show)
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [isNextTargetExpanded, setIsNextTargetExpanded] = useState<boolean>(false);

  // Helper for Stage Icon & Color Scheme
  const getStageStyle = (stage: string) => {
    switch (stage) {
      case "Notice / Summons":
        return {
          icon: AlertCircle,
          badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
          nodeBorder: "border-blue-400/60 bg-blue-50/20",
          dotBg: "bg-blue-600 text-white",
          accentColor: "text-blue-700",
        };
      case "Reply / Written Statement":
        return {
          icon: FileCheck,
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          nodeBorder: "border-emerald-400/60 bg-emerald-50/20",
          dotBg: "bg-emerald-600 text-white",
          accentColor: "text-emerald-700",
        };
      case "Statutory Deposit / Payment":
        return {
          icon: IndianRupee,
          badgeBg: "bg-amber-50 text-amber-900 border-amber-300",
          nodeBorder: "border-amber-400/60 bg-amber-50/20",
          dotBg: "bg-amber-600 text-white",
          accentColor: "text-amber-800",
        };
      case "Interim Order / Stay":
        return {
          icon: ShieldAlert,
          badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
          nodeBorder: "border-purple-400/60 bg-purple-50/20",
          dotBg: "bg-purple-600 text-white",
          accentColor: "text-purple-700",
        };
      case "Evidence / Verification":
        return {
          icon: CheckSquare,
          badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
          nodeBorder: "border-teal-400/60 bg-teal-50/20",
          dotBg: "bg-teal-600 text-white",
          accentColor: "text-teal-700",
        };
      case "Hearing / Appearance":
        return {
          icon: Scale,
          badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          nodeBorder: "border-indigo-400/60 bg-indigo-50/20",
          dotBg: "bg-indigo-600 text-white",
          accentColor: "text-indigo-700",
        };
      case "Final Order / Decree":
        return {
          icon: Award,
          badgeBg: "bg-rose-50 text-rose-900 border-rose-300",
          nodeBorder: "border-rose-400/60 bg-rose-50/20",
          dotBg: "bg-rose-600 text-white",
          accentColor: "text-rose-800",
        };
      case "Appeal / Revision":
        return {
          icon: History,
          badgeBg: "bg-violet-50 text-violet-800 border-violet-200",
          nodeBorder: "border-violet-400/60 bg-violet-50/20",
          dotBg: "bg-violet-600 text-white",
          accentColor: "text-violet-700",
        };
      default:
        return {
          icon: FileText,
          badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
          nodeBorder: "border-slate-300 bg-slate-50/50",
          dotBg: "bg-slate-700 text-white",
          accentColor: "text-slate-800",
        };
    }
  };

  // Toggle individual event expansion
  const toggleEventExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Render for SOP matters (Flow chart of standard steps, extendable)
  if (matter.type === "sop") {
    const steps: SopStep[] = matter.keySteps || [];
    const areAllSopExpanded = steps.length > 0 && expandedEventIds.size === steps.length;

    const toggleAllSopSteps = () => {
      if (areAllSopExpanded) {
        setExpandedEventIds(new Set());
      } else {
        setExpandedEventIds(new Set(steps.map((s) => `sop-${s.stepNumber}`)));
      }
    };

    return (
      <div className="bg-white rounded-xl border border-black/20 p-3 sm:p-4 shadow-2xs space-y-2.5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-black/10 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                SOP Flow Chart
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                  {steps.length} Steps
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Click any step to extend full controls • {matter.department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {steps.length > 0 && (
              <button
                onClick={toggleAllSopSteps}
                className="px-2 py-1 rounded text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                title={areAllSopExpanded ? "Collapse all steps" : "Extend all steps"}
              >
                <ChevronsUpDown className="w-3 h-3 text-slate-500" />
                <span>{areAllSopExpanded ? "Collapse All" : "Extend All"}</span>
              </button>
            )}
            {onOpenDossier && (
              <button
                onClick={onOpenDossier}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>Full SOP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Steps Flow Chart */}
        {steps.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No steps defined for this SOP yet.
          </div>
        ) : (
          <div className="space-y-1.5 pt-0.5">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const stepKey = `sop-${step.stepNumber}`;
              const isExpanded = expandedEventIds.has(stepKey);

              return (
                <div key={step.stepNumber} className="relative">
                  {/* Step Box: Compact by default, extendable on click */}
                  <div
                    onClick={() => toggleEventExpand(stepKey)}
                    className={`rounded-lg border border-teal-200/80 bg-teal-50/20 hover:bg-teal-50/40 hover:border-teal-400 transition-all cursor-pointer select-none ${
                      isExpanded ? "p-3 bg-teal-50/40 ring-1 ring-teal-300" : "py-2 px-2.5 sm:px-3"
                    }`}
                  >
                    <div className="flex items-center sm:items-start gap-2.5">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs mt-0.5">
                        {step.stepNumber}
                      </div>

                      <div className="flex-1 min-w-0">
                        {!isExpanded ? (
                          /* Compact 1-line view with short description */
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="font-bold text-xs text-slate-900 shrink-0">
                                {step.title}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate hidden md:inline flex-1 min-w-0">
                                • {step.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <span className="px-1.5 py-0.2 rounded font-semibold text-[9.5px] bg-teal-100 text-teal-800">
                                {step.responsibility}
                              </span>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-100 text-slate-600 border border-slate-200">
                                {step.timelineOrTAT}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => toggleEventExpand(stepKey, e)}
                                className="p-0.5 text-teal-700 hover:text-teal-900"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Extended Full View */
                          <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{step.title}</span>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  TAT: {step.timelineOrTAT}
                                </span>
                                <span className="px-1.5 py-0.5 rounded font-semibold bg-teal-100 text-teal-800">
                                  {step.responsibility}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleEventExpand(stepKey, e)}
                                  className="p-0.5 text-teal-700 hover:text-teal-900"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11.5px] text-slate-600 leading-relaxed pt-0.5">
                              {step.description}
                            </p>

                            {step.controlCheckpoint && (
                              <div className="mt-1.5 pt-1 border-t border-teal-100/80 flex items-center gap-1.5 text-[10.5px] text-teal-900 font-medium">
                                <Shield className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>Internal Control: {step.controlCheckpoint}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flow Arrow to Next Step */}
                  {!isLast && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-1.5 bg-teal-300" />
                        <ArrowDown className="w-3 h-3 text-teal-600 -my-0.5" />
                        <div className="w-0.5 h-1 bg-teal-300" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render for License / Certification matters (Lifecycle Flow Chart, extendable)
  if (matter.type === "license_certification") {
    const isExpired = new Date(matter.expiryDate) < new Date();
    const daysUntilExpiry = Math.ceil(
      (new Date(matter.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    const lifecycleSteps = [
      {
        id: "lic-step-1",
        stage: "License Granted",
        date: matter.issuedDate,
        title: `Issued by ${matter.issuingAuthority}`,
        desc: `Official statutory license ${matter.licenseNumber} issued with annual compliance terms.`,
        status: "completed",
        badge: "Granted",
      },
      {
        id: "lic-step-2",
        stage: "Statutory Renewal Window",
        date: `${matter.renewalWindowDays} Days Prior`,
        title: "Renewal Prep & Application Filing",
        desc: `Target window starts ${matter.renewalWindowDays} days prior to expiration. Officer: ${matter.renewalOfficer}.`,
        status: daysUntilExpiry <= matter.renewalWindowDays ? "active" : "upcoming",
        badge: "Window",
      },
      {
        id: "lic-step-3",
        stage: "Expiration & Mandate",
        date: matter.expiryDate,
        title: isExpired ? "License Expired!" : "Validity Expiry Date",
        desc: isExpired
          ? "Immediate penalty exposure; statutory renewal must be finalized without delay."
          : `Valid for another ${daysUntilExpiry} days. Annual statutory fee: ${formatCurrency(
              matter.annualFeeOrCost,
            )}.`,
        status: isExpired ? "urgent" : daysUntilExpiry <= 30 ? "active" : "upcoming",
        badge: isExpired ? "Expired" : "Target Expiry",
      },
    ];

    const areAllLicExpanded = expandedEventIds.size === lifecycleSteps.length;
    const toggleAllLicSteps = () => {
      if (areAllLicExpanded) {
        setExpandedEventIds(new Set());
      } else {
        setExpandedEventIds(new Set(lifecycleSteps.map((s) => s.id)));
      }
    };

    return (
      <div className="bg-white rounded-xl border border-black/20 p-3 sm:p-4 shadow-2xs space-y-2.5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-black/10 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                License Lifecycle Flow Chart
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                  {matter.status}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Click any stage to extend • {matter.issuingAuthority}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAllLicSteps}
              className="px-2 py-1 rounded text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronsUpDown className="w-3 h-3 text-slate-500" />
              <span>{areAllLicExpanded ? "Collapse All" : "Extend All"}</span>
            </button>
            {onOpenDossier && (
              <button
                onClick={onOpenDossier}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>Full Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Flow Nodes */}
        <div className="space-y-1.5 pt-0.5">
          {lifecycleSteps.map((step, idx) => {
            const isLast = idx === lifecycleSteps.length - 1;
            const isCompleted = step.status === "completed";
            const isActive = step.status === "active";
            const isUrgent = step.status === "urgent";
            const isExpanded = expandedEventIds.has(step.id);

            return (
              <div key={step.id} className="relative">
                <div
                  onClick={() => toggleEventExpand(step.id)}
                  className={`rounded-lg border transition-all cursor-pointer select-none ${
                    isUrgent
                      ? "border-rose-400 bg-rose-50/40"
                      : isActive
                        ? "border-amber-400 bg-amber-50/30 ring-1 ring-amber-300"
                        : isCompleted
                          ? "border-purple-200 bg-purple-50/20 hover:border-purple-300"
                          : "border-slate-200 bg-slate-50/40 opacity-80"
                  } ${isExpanded ? "p-3 shadow-xs" : "py-2 px-2.5 sm:px-3"}`}
                >
                  <div className="flex items-center sm:items-start gap-2.5">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-2xs ${
                        isUrgent
                          ? "bg-rose-600 text-white animate-pulse"
                          : isActive
                            ? "bg-amber-600 text-white ring-2 ring-amber-300"
                            : isCompleted
                              ? "bg-purple-700 text-white"
                              : "bg-slate-400 text-white"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {!isExpanded ? (
                        /* Compact collapsed line */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="font-bold text-xs text-slate-900 shrink-0">
                              {step.stage}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                isUrgent
                                  ? "bg-rose-100 text-rose-800"
                                  : isActive
                                    ? "bg-amber-100 text-amber-900"
                                    : isCompleted
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {step.badge}
                            </span>
                            <span className="text-[11px] text-slate-600 truncate hidden md:inline flex-1 min-w-0">
                              • {step.desc}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <span className="text-[10.5px] font-mono text-slate-500 font-medium">
                              {step.date}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleEventExpand(step.id, e)}
                              className="p-0.5 text-slate-400 hover:text-purple-700"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Extended full view */
                        <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{step.stage}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                  isUrgent
                                    ? "bg-rose-100 text-rose-800"
                                    : isActive
                                      ? "bg-amber-100 text-amber-900"
                                      : isCompleted
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {step.badge}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10.5px] font-mono text-slate-500 font-medium">
                                {step.date}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => toggleEventExpand(step.id, e)}
                                className="p-0.5 text-slate-400 hover:text-purple-700"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] font-semibold text-slate-800">{step.title}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-1.5 bg-purple-300" />
                      <ArrowDown className="w-3 h-3 text-purple-600 -my-0.5" />
                      <div className="w-0.5 h-1 bg-purple-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Tax Assessment & Legal Cases: Chronology Flow Chart (Extendable)
  const rawChronology: CaseChronologyEvent[] = (matter as any).chronology || [];
  const sortedChronology = [...rawChronology].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortAscending ? diff : -diff;
  });

  const nextActionDate =
    matter.type === "tax_assessment"
      ? (matter as TaxAssessmentMatter).nextDueDate
      : (matter as LegalCaseMatter).nextHearingDate;

  const nextActionPurpose =
    matter.type === "tax_assessment"
      ? (matter as TaxAssessmentMatter).dueDateType || "Statutory Compliance Hearing / Submission"
      : (matter as LegalCaseMatter).hearingPurpose || "Court Hearing & Arguments";

  const areAllExpanded =
    sortedChronology.length > 0 && expandedEventIds.size === sortedChronology.length;

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedEventIds(new Set());
    } else {
      setExpandedEventIds(new Set(sortedChronology.map((ev) => ev.id)));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-black/20 p-3 sm:p-4 shadow-2xs space-y-2.5">
      {/* Header bar with counter, Expand/Collapse All, sorting, and +Add Event */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-black/10 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              Chronology Flow Chart
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {rawChronology.length} Milestones
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {expandedEventIds.size === 0
                ? "Compact view • Click any event to extend details"
                : `${expandedEventIds.size} of ${rawChronology.length} events extended`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {rawChronology.length > 0 && (
            <button
              onClick={toggleExpandAll}
              title={
                areAllExpanded
                  ? "Collapse all events to compact short descriptions"
                  : "Extend all events to see full descriptions & outcomes"
              }
              className="px-2 py-1 rounded text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronsUpDown className="w-3 h-3 text-slate-500" />
              <span>{areAllExpanded ? "Collapse All" : "Extend All"}</span>
            </button>
          )}

          {rawChronology.length > 1 && (
            <button
              onClick={() => setSortAscending((prev) => !prev)}
              title="Reverse Chronology Flow Direction"
              className="px-2 py-1 rounded text-[10.5px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <span>{sortAscending ? "Oldest 1st" : "Newest 1st"}</span>
            </button>
          )}

          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Add Milestone</span>
            </button>
          )}

          {onOpenDossier && (
            <button
              onClick={onOpenDossier}
              title="Open full matter dossier"
              className="px-2 py-1 rounded text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>Dossier</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Flow Chart Nodes List */}
      {sortedChronology.length === 0 ? (
        <div className="py-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300 p-4 space-y-2">
          <History className="w-7 h-7 mx-auto text-indigo-400 opacity-60" />
          <div>
            <h5 className="text-xs font-bold text-slate-800">
              No Chronology Milestones Logged Yet
            </h5>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
              Record date-wise notices, replies, deposit challans, and hearing outcomes to construct
              a complete visual case chronology.
            </p>
          </div>
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record First Case Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1 pt-0.5">
          {sortedChronology.map((event, idx) => {
            const isLast = idx === sortedChronology.length - 1;
            const style = getStageStyle(event.stageOrType);
            const StageIcon = style.icon;
            const isExpanded = expandedEventIds.has(event.id);

            return (
              <div key={event.id} className="relative">
                {/* Step Node Card: Ultra-compact when collapsed, extendable on click */}
                <div
                  onClick={() => toggleEventExpand(event.id)}
                  className={`rounded-xl border transition-all cursor-pointer select-none ${
                    isExpanded
                      ? `p-3 ring-2 ring-indigo-500/20 ${style.nodeBorder} shadow-xs`
                      : "py-2 px-2.5 sm:px-3 hover:bg-slate-50/90 hover:border-black/40 border-black/20 bg-white shadow-2xs"
                  }`}
                  title={isExpanded ? "Click to collapse" : "Click to extend full details"}
                >
                  <div className="flex items-center sm:items-start gap-2.5">
                    {/* Flow Circle Node Number */}
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[9.5px] sm:text-[10px] shrink-0 mt-0.5 shadow-2xs ${style.dotBg}`}
                      title={`Milestone Step ${idx + 1}`}
                    >
                      {idx + 1}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      {/* COMPACT COLLAPSED VIEW: only short description shown, taking minimal space */}
                      {!isExpanded ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          {/* Left: Stage, Date, Title, and Short Description */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border shrink-0 flex items-center gap-1 ${style.badgeBg}`}
                            >
                              <StageIcon className="w-2.5 h-2.5" />
                              {event.stageOrType}
                            </span>

                            <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0">
                              {new Date(event.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                              })}
                            </span>

                            <span className="font-bold text-xs text-slate-900 truncate shrink-0 max-w-[140px] sm:max-w-[200px]">
                              {event.title}
                            </span>

                            {/* Short Description snippet - only short text taking minimal space */}
                            <span
                              className="text-[11px] text-slate-500 truncate hidden md:inline flex-1 min-w-0"
                              title={event.description}
                            >
                              • {event.description}
                            </span>
                          </div>

                          {/* Right: Micro tags & Extend Chevron */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {event.financialImpactAmount !== undefined &&
                              event.financialImpactAmount > 0 && (
                                <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9.5px] bg-amber-50 text-amber-900 border border-amber-200">
                                  {formatCurrency(event.financialImpactAmount)}
                                </span>
                              )}
                            {event.nextHearingDate && (
                              <span className="px-1.5 py-0.2 rounded font-semibold text-[9px] bg-indigo-50 text-indigo-800 border border-indigo-200 hidden sm:inline">
                                Next: {event.nextHearingDate}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleEventExpand(event.id, e)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title="Extend details"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* EXTENDED FULL VIEW: complete description, outcome, and all metadata */
                        <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                          {/* Top metadata row */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border flex items-center gap-1 ${style.badgeBg}`}
                              >
                                <StageIcon className="w-2.5 h-2.5" />
                                {event.stageOrType}
                              </span>

                              {event.orderRefNumber && (
                                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                  Ref: {event.orderRefNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>
                                  {new Date(event.date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => toggleEventExpand(event.id, e)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 rounded"
                                title="Collapse"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Event Title */}
                          <h5 className="font-bold text-xs text-slate-900 tracking-tight leading-snug">
                            {event.title}
                          </h5>

                          {/* Authority / Forum */}
                          {event.authorityOrForum && (
                            <p className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{event.authorityOrForum}</span>
                            </p>
                          )}

                          {/* Full Event Description */}
                          <p className="text-[11.5px] text-slate-700 leading-relaxed pt-0.5">
                            {event.description}
                          </p>

                          {/* Outcome / Decision */}
                          {event.outcomeOrNextStep && (
                            <div className="mt-1.5 p-2 rounded-lg bg-white/90 border border-slate-200/80 text-[11px] text-slate-800 space-y-0.5">
                              <span className="font-bold text-[10px] text-indigo-700 block uppercase tracking-wide">
                                Outcome / Decision
                              </span>
                              <p>{event.outcomeOrNextStep}</p>
                            </div>
                          )}

                          {/* Key stats row: Financial Impact, Statutory Deadline, Document Attachment */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10.5px]">
                            {event.financialImpactAmount !== undefined &&
                              event.financialImpactAmount > 0 && (
                                <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                                  <IndianRupee className="w-2.5 h-2.5" />
                                  Demand/Deposit: {formatCurrency(event.financialImpactAmount)}
                                </span>
                              )}

                            {event.statutoryDeadline && (
                              <span className="px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-rose-600" />
                                Deadline: {event.statutoryDeadline}
                              </span>
                            )}

                            {event.nextHearingDate && (
                              <span className="px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                                <Scale className="w-2.5 h-2.5 text-indigo-600" />
                                Next Hearing: {event.nextHearingDate}
                              </span>
                            )}

                            {event.documentRef && (
                              <span className="px-1.5 py-0.5 rounded font-medium bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5 text-sky-600" />
                                {event.documentRef}
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 ml-auto">
                              By: {event.recordedBy}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connecting Arrow between Nodes (sleek and compact) */}
                {!isLast && (
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-1.5 bg-indigo-300" />
                      <ArrowDown className="w-3 h-3 text-indigo-600 -my-0.5" />
                      <div className="w-0.5 h-1 bg-indigo-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Target / Upcoming Scheduled Action Node (also extendable) */}
          {nextActionDate && (
            <div className="relative pt-0.5">
              <div className="flex items-center justify-center pb-0.5">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-1.5 bg-amber-400 border-dashed" />
                  <ArrowDown className="w-3 h-3 text-amber-600 -my-0.5" />
                  <div className="w-0.5 h-1 bg-amber-400" />
                </div>
              </div>

              <div
                onClick={() => setIsNextTargetExpanded((prev) => !prev)}
                className={`rounded-xl border border-dashed border-amber-400 bg-amber-50/40 transition-all cursor-pointer select-none ${
                  isNextTargetExpanded ? "p-3 shadow-xs" : "py-2 px-2.5 sm:px-3"
                }`}
                title={
                  isNextTargetExpanded ? "Click to collapse" : "Click to extend target details"
                }
              >
                <div className="flex items-center sm:items-start gap-2.5">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-2xs animate-pulse">
                    ➜
                  </div>
                  <div className="flex-1 min-w-0">
                    {!isNextTargetExpanded ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                            Upcoming Target
                          </span>
                          <span className="font-bold text-xs text-amber-950 truncate shrink-0 max-w-[180px] sm:max-w-xs">
                            {nextActionPurpose}
                          </span>
                          <span className="text-[11px] text-amber-800 truncate hidden md:inline flex-1 min-w-0">
                            • Pending proceedings before{" "}
                            {matter.type === "tax_assessment"
                              ? (matter as TaxAssessmentMatter).authority
                              : (matter as LegalCaseMatter).forumOrCourt}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <span className="text-[10px] font-bold text-amber-900 flex items-center gap-0.5 font-mono">
                            <Clock className="w-3 h-3 text-amber-700" />
                            {new Date(nextActionDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsNextTargetExpanded((prev) => !prev);
                            }}
                            className="p-0.5 text-amber-800 hover:text-amber-950"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Target Milestone / Next Hearing
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10.5px] font-bold text-amber-900 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-amber-700" />
                              {new Date(nextActionDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNextTargetExpanded(false);
                              }}
                              className="p-0.5 text-amber-800 hover:text-amber-950"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h6 className="font-bold text-xs text-amber-950 mt-1">
                          {nextActionPurpose}
                        </h6>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Pending proceedings before{" "}
                          <strong>
                            {matter.type === "tax_assessment"
                              ? (matter as TaxAssessmentMatter).authority
                              : (matter as LegalCaseMatter).forumOrCourt}
                          </strong>
                          . Legal team preparation in progress.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
