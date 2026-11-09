// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  RepositoryItem,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
  SopMatter,
  CaseChronologyEvent,
} from "../../types";
import { formatINR as formatCurrency } from "../../utils/format";
import {
  X,
  Calendar,
  AlertTriangle,
  Building,
  Scale,
  ShieldAlert,
  Award,
  FileText,
  Clock,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  MessageSquarePlus,
  IndianRupee,
  User,
  Tag,
  AlertCircle,
  Layers,
  BookOpen,
  CheckSquare,
  ShieldCheck,
  ListOrdered,
  CalendarRange,
  History,
  Printer,
  ArrowUpDown,
  PlusCircle,
  Filter,
  GitBranch,
} from "lucide-react";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { AddProgressModal } from "./AddProgressModal";
import { classifyRepositoryItem } from "../../utils/repositoryCategory";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";
import { MatterChronologyFlowChart } from "./MatterChronologyFlowChart";

interface MatterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter: RepositoryItem | null;
}

export const MatterDetailModal: React.FC<MatterDetailModalProps> = ({
  isOpen,
  onClose,
  matter,
}) => {
  const {
    role,
    deleteRepositoryDocument,
    deleteTaxAssessment,
    deleteLegalCase,
    deleteLicense,
    deleteSop,
    addCaseChronologyEvent,
    deleteCaseChronologyEvent,
    currentUser,
    showToast,
  } = useApp();

  const isTaxOrLegal = matter?.type === "tax_assessment" || matter?.type === "legal_case";

  const [activeSubTab, setActiveSubTab] = useState<
    "chronology" | "workflow" | "timeline" | "documents"
  >(isTaxOrLegal ? "chronology" : matter?.type === "sop" ? "workflow" : "timeline");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [showDeleteMatterConfirm, setShowDeleteMatterConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; fileName: string } | null>(null);

  // Chronology State
  const [chronologyViewMode, setChronologyViewMode] = useState<"flowchart" | "timeline">(
    "flowchart",
  );
  const [chronologySortOrder, setChronologySortOrder] = useState<"asc" | "desc">("desc");
  const [chronologyStageFilter, setChronologyStageFilter] = useState<string>("all");
  const [isAddChronologyModalOpen, setIsAddChronologyModalOpen] = useState(false);
  const [isPrintDocketOpen, setIsPrintDocketOpen] = useState(false);

  // Add Chronology Event Form State
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStage, setNewEventStage] =
    useState<CaseChronologyEvent["stageOrType"]>("Hearing / Appearance");
  const [newEventAuthority, setNewEventAuthority] = useState("");
  const [newEventRefNumber, setNewEventRefNumber] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventOutcome, setNewEventOutcome] = useState("");
  const [newEventNextDate, setNewEventNextDate] = useState("");
  const [newEventImpact, setNewEventImpact] = useState("");
  const [newEventDocRef, setNewEventDocRef] = useState("");

  const rawChronology: CaseChronologyEvent[] = useMemo(() => {
    return (matter as any)?.chronology || [];
  }, [matter]);

  const filteredChronology = useMemo(() => {
    let list = [...rawChronology];
    if (chronologyStageFilter !== "all") {
      list = list.filter((e) => e.stageOrType === chronologyStageFilter);
    }
    list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return chronologySortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
    return list;
  }, [rawChronology, chronologyStageFilter, chronologySortOrder]);

  if (!isOpen || !matter) return null;

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(targetDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDueDateInfo = () => {
    if (matter.type === "tax_assessment") {
      const days = getDaysRemaining(matter.nextDueDate);
      return {
        label: "Next Hearing / Submission Due",
        date: matter.nextDueDate,
        days,
        purpose: matter.dueDateType,
      };
    }
    if (matter.type === "legal_case") {
      const days = getDaysRemaining(matter.nextHearingDate);
      return {
        label: "Next Court Hearing Date",
        date: matter.nextHearingDate,
        days,
        purpose: matter.hearingPurpose,
      };
    }
    if (matter.type === "sop") {
      const days = getDaysRemaining(matter.nextReviewDate);
      return {
        label: "Next Scheduled SOP Review",
        date: matter.nextReviewDate,
        days,
        purpose: `${matter.reviewFrequency} Governance Review Cycle`,
      };
    }
    const days = getDaysRemaining(matter.expiryDate);
    return {
      label: "License Expiry Date",
      date: matter.expiryDate,
      days,
      purpose: `Renewal Window: ${matter.renewalWindowDays} Days`,
    };
  };

  const dueInfo = getDueDateInfo();

  const getDueBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {Math.abs(days)} Days Overdue!
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Due Today!
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Due in {days} Days (Urgent)
        </span>
      );
    }
    if (days <= 60) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          Due in {days} Days
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Valid ({days} Days remaining)
      </span>
    );
  };

  const handleDeleteMatter = () => {
    setShowDeleteMatterConfirm(true);
  };

  const matterDisplayTitle =
    matter.type === "tax_assessment"
      ? matter.matterTitle
      : matter.type === "legal_case"
        ? matter.matterTitle
        : matter.title;

  const confirmDeleteMatter = () => {
    if (matter.type === "tax_assessment") deleteTaxAssessment(matter.id);
    else if (matter.type === "legal_case") deleteLegalCase(matter.id);
    else if (matter.type === "sop") deleteSop(matter.id);
    else deleteLicense(matter.id);
    showToast(`Deleted matter "${matterDisplayTitle}" from corporate repository`);
    setShowDeleteMatterConfirm(false);
    onClose();
  };

  const handleAddChronologySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) {
      showToast("Please enter an event title and date.");
      return;
    }
    const eventPayload: Omit<CaseChronologyEvent, "id"> = {
      date: newEventDate,
      title: newEventTitle.trim(),
      stageOrType: newEventStage,
      authorityOrForum: newEventAuthority.trim() || undefined,
      orderRefNumber: newEventRefNumber.trim() || undefined,
      description: newEventDescription.trim() || "Event recorded in case chronology.",
      outcomeOrNextStep: newEventOutcome.trim() || undefined,
      nextHearingDate: newEventNextDate || undefined,
      statutoryDeadline: newEventNextDate || undefined,
      financialImpactAmount: newEventImpact ? Number(newEventImpact) : undefined,
      documentRef: newEventDocRef.trim() || undefined,
      recordedBy: currentUser?.name || (role === "cfo" ? "Virtual CFO" : "Client Team"),
      recordedByRole: role === "cfo" ? "cfo" : "client_team",
    };
    addCaseChronologyEvent(matter.id, matter.type as "tax_assessment" | "legal_case", eventPayload);
    showToast("Chronology event successfully recorded.");
    setIsAddChronologyModalOpen(false);
    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventAuthority("");
    setNewEventRefNumber("");
    setNewEventOutcome("");
    setNewEventNextDate("");
    setNewEventImpact("");
    setNewEventDocRef("");
  };

  const handleDeleteChronologyEvent = (eventId: string) => {
    deleteCaseChronologyEvent(matter.id, matter.type as "tax_assessment" | "legal_case", eventId);
    showToast("Event removed from case chronology.");
  };

  const getStageBadge = (stage: CaseChronologyEvent["stageOrType"]) => {
    switch (stage) {
      case "Notice / Summons":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Reply / Written Statement":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Statutory Deposit / Payment":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Interim Order / Stay":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Evidence / Verification":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Final Order / Decree":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "Appeal / Revision":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "Hearing / Appearance":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleDownloadSimulated = (doc: any) => {
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", doc.fileName);
    showToast(`Downloading "${doc.fileName}" (${doc.fileSize || "PDF"})...`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {matter.type === "tax_assessment" && classifyRepositoryItem(matter) === "gst" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    GST / Indirect Tax • {matter.taxCategory}
                  </span>
                )}
                {matter.type === "tax_assessment" &&
                  classifyRepositoryItem(matter) === "income_tax" && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      Income Tax (Direct) • {matter.taxCategory}
                    </span>
                  )}
                {matter.type === "legal_case" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Legal Dispute • {matter.legalCategory}
                  </span>
                )}
                {matter.type === "license_certification" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    License & Renewal • {matter.licenseCategory}
                  </span>
                )}
                {matter.type === "sop" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Standard Operating Procedure • {matter.sopCategory}
                  </span>
                )}
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {matter.companyName || "Client Entity"}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {matterDisplayTitle}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {matter.type === "tax_assessment" && (
                  <>
                    <span>
                      Ref / Notice:{" "}
                      <strong className="text-slate-100">{matter.caseOrNoticeNumber}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Period: <strong className="text-slate-100">{matter.financialYear}</strong>
                    </span>
                  </>
                )}
                {matter.type === "legal_case" && (
                  <>
                    <span>
                      Forum: <strong className="text-slate-100">{matter.forumOrCourt}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Case No: <strong className="text-slate-100">{matter.caseNumber}</strong>
                    </span>
                  </>
                )}
                {matter.type === "license_certification" && (
                  <>
                    <span>
                      Issuing Body:{" "}
                      <strong className="text-slate-100">{matter.issuingAuthority}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      License No: <strong className="text-slate-100">{matter.licenseNumber}</strong>
                    </span>
                  </>
                )}
                {matter.type === "sop" && (
                  <>
                    <span>
                      SOP Code: <strong className="text-slate-100">{matter.sopCode}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Version: <strong className="text-slate-100">{matter.version}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Dept: <strong className="text-slate-100">{matter.department}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {role === "cfo" && (
                <button
                  onClick={handleDeleteMatter}
                  title="Delete matter from repository (CFO Admin)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Highlighting Due Date Alert Banner */}
          <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-amber-950">
                  {dueInfo.label}:{" "}
                  <strong className="font-bold underline text-amber-900">
                    {new Date(dueInfo.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                </span>
                {dueInfo.purpose && (
                  <span className="text-xs text-amber-800 ml-2 font-normal hidden md:inline">
                    ({dueInfo.purpose})
                  </span>
                )}
              </div>
            </div>
            <div>{getDueBadge(dueInfo.days)}</div>
          </div>

          {/* Metrics & Context Bar */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {matter.type === "tax_assessment" && (
              <>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Disputed Demand</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(matter.demandAmount)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Stay Deposit Paid</span>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(matter.depositPaid || 0)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Matter Status</span>
                  <p className="text-xs font-semibold text-indigo-700 mt-1 truncate">
                    {matter.status}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Counsel / CA</span>
                  <p
                    className="text-[11px] font-semibold text-slate-800 mt-1 truncate"
                    title={matter.counselName}
                  >
                    {matter.counselName}
                  </p>
                </div>
              </>
            )}

            {matter.type === "legal_case" && (
              <>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Claim / Exposure</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(matter.claimOrExposureAmount)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Company Role</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">{matter.companyRole}</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Case Stage</span>
                  <p className="text-xs font-semibold text-amber-700 mt-1 truncate">
                    {matter.status}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Law Firm / Advocate
                  </span>
                  <p
                    className="text-[11px] font-semibold text-slate-800 mt-1 truncate"
                    title={matter.advocateLegalFirm}
                  >
                    {matter.advocateLegalFirm}
                  </p>
                </div>
              </>
            )}

            {matter.type === "license_certification" && (
              <>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Annual Statutory Fee
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(matter.annualFeeOrCost)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Issued Date</span>
                  <p className="text-xs font-semibold text-slate-900 mt-1">{matter.issuedDate}</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Status</span>
                  <p className="text-xs font-semibold text-emerald-700 mt-1 truncate">
                    {matter.status}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Renewal Officer</span>
                  <p
                    className="text-[11px] font-semibold text-slate-800 mt-1 truncate"
                    title={matter.renewalOfficer}
                  >
                    {matter.renewalOfficer}
                  </p>
                </div>
              </>
            )}

            {matter.type === "sop" && (
              <>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Process Owner</span>
                  <p
                    className="text-xs font-bold text-slate-900 mt-1 truncate"
                    title={matter.owner}
                  >
                    {matter.owner}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Approver Authority</span>
                  <p
                    className="text-xs font-bold text-teal-700 mt-1 truncate"
                    title={matter.approver}
                  >
                    {matter.approver}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Review Cadence</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {matter.reviewFrequency} Cycle
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Prescribed Steps</span>
                  <p className="text-xs font-semibold text-teal-700 mt-1">
                    {matter.keySteps?.length || 0} Key Workflow Steps
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Matter Summary Card */}
          <div className="px-6 py-3 bg-white border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {matter.type === "sop"
                ? "SOP Objective & Process Summary"
                : "Case Summary & Strategic Context"}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{matter.summary}</p>
          </div>

          {/* Dossier Tabs & Quick Action Controls */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              {isTaxOrLegal && (
                <button
                  id="tab-chronology"
                  onClick={() => setActiveSubTab("chronology")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === "chronology"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Chronology of Events</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeSubTab === "chronology"
                        ? "bg-indigo-700 text-white"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {rawChronology.length}
                  </span>
                </button>
              )}

              {matter.type === "sop" && (
                <button
                  onClick={() => setActiveSubTab("workflow")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === "workflow"
                      ? "bg-teal-700 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Standard Operating Workflow</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                    {matter.keySteps?.length || 0} Steps
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveSubTab("timeline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeSubTab === "timeline"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Status & Audit History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/50">
                  {matter.progressUpdates.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab("documents")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeSubTab === "documents"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents & Templates</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/50">
                  {matter.documents.length}
                </span>
              </button>
            </div>

            {/* Actions for Client Team and CFO */}
            <div className="flex items-center gap-2">
              {isTaxOrLegal && (
                <button
                  onClick={() => setIsAddChronologyModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Add Chronology Event</span>
                </button>
              )}

              <button
                onClick={() => setIsProgressModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Update Progress</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* SubTab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {activeSubTab === "chronology" && isTaxOrLegal ? (
              <div className="space-y-4">
                {/* Chronology Filter & Action Header */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-indigo-600" />
                      Statutory Chronology of Events ({rawChronology.length})
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">
                      Forum:{" "}
                      <strong className="text-slate-700">
                        {matter.type === "tax_assessment" ? matter.authority : matter.forumOrCourt}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter by Stage */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={chronologyStageFilter}
                        onChange={(e) => setChronologyStageFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:outline-indigo-500"
                      >
                        <option value="all">All Stages ({rawChronology.length})</option>
                        <option value="Notice / Summons">Notice / Summons</option>
                        <option value="Reply / Written Statement">Reply / Written Statement</option>
                        <option value="Statutory Deposit / Payment">
                          Statutory Deposit / Payment
                        </option>
                        <option value="Interim Order / Stay">Interim Order / Stay</option>
                        <option value="Evidence / Verification">Evidence / Verification</option>
                        <option value="Hearing / Appearance">Hearing / Appearance</option>
                        <option value="Final Order / Decree">Final Order / Decree</option>
                        <option value="Appeal / Revision">Appeal / Revision</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Flow Chart vs Detailed Timeline View Toggle */}
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                      <button
                        onClick={() => setChronologyViewMode("flowchart")}
                        className={`px-2 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          chronologyViewMode === "flowchart"
                            ? "bg-white text-indigo-700 shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Display Chronology as an interconnected visual Flow Chart"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Flow Chart</span>
                      </button>
                      <button
                        onClick={() => setChronologyViewMode("timeline")}
                        className={`px-2 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          chronologyViewMode === "timeline"
                            ? "bg-white text-indigo-700 shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Display Chronology as detailed event cards"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </div>

                    {/* Sort Order Toggle */}
                    <button
                      onClick={() =>
                        setChronologySortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title={
                        chronologySortOrder === "asc"
                          ? "Sorted Oldest First (Click for Newest)"
                          : "Sorted Newest First (Click for Oldest)"
                      }
                    >
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      <span>{chronologySortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
                    </button>

                    {/* Print Docket Button */}
                    <button
                      onClick={() => setIsPrintDocketOpen(true)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Chronology</span>
                    </button>
                  </div>
                </div>

                {/* Flow Chart Mode vs Detailed Cards Mode */}
                {chronologyViewMode === "flowchart" ? (
                  <MatterChronologyFlowChart
                    matter={matter}
                    onAddEvent={() => setIsAddChronologyModalOpen(true)}
                    onUploadDoc={() => setIsUploadModalOpen(true)}
                  />
                ) : filteredChronology.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-3">
                    <History className="w-10 h-10 mx-auto text-indigo-300" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No Chronology Events Found
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        {chronologyStageFilter !== "all"
                          ? `No events match the selected stage filter "${chronologyStageFilter}".`
                          : "Maintain a legally compliant, date-wise chronology of all notices, replies, stays, deposits, and orders for statutory hearings and audits."}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddChronologyModalOpen(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      + Add First Chronology Event
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                    {filteredChronology.map((event, idx) => (
                      <div key={event.id} className="relative group">
                        {/* Timeline Step Pin */}
                        <div className="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs flex items-center justify-center text-[8px] font-bold text-white">
                          •
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-2.5">
                          {/* Top Badges Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {new Date(event.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${getStageBadge(
                                  event.stageOrType,
                                )}`}
                              >
                                {event.stageOrType}
                              </span>

                              {event.orderRefNumber && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                  Ref: {event.orderRefNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {event.authorityOrForum && (
                                <span
                                  className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 truncate max-w-[220px]"
                                  title={event.authorityOrForum}
                                >
                                  {event.authorityOrForum}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteChronologyEvent(event.id)}
                                className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete chronology event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Event Title & Narrative */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug">
                              {event.title}
                            </h5>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                              {event.description}
                            </p>
                          </div>

                          {/* Outcome / Next Step Banner */}
                          {event.outcomeOrNextStep && (
                            <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-950 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                              <div className="leading-relaxed">
                                <strong className="font-semibold text-sky-900">
                                  Outcome / Next Legal Action:
                                </strong>{" "}
                                {event.outcomeOrNextStep}
                              </div>
                            </div>
                          )}

                          {/* Highlights: Financial Impact, Statutory Deadline, Document Attachment */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3 flex-wrap">
                              {event.financialImpactAmount !== undefined && (
                                <span className="font-bold text-slate-900 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900">
                                  <IndianRupee className="w-3 h-3 text-amber-700" />
                                  Financial Impact: {formatCurrency(event.financialImpactAmount)}
                                </span>
                              )}

                              {event.nextHearingDate && (
                                <span className="font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <Calendar className="w-3 h-3 text-rose-600" />
                                  Next Due:{" "}
                                  {new Date(event.nextHearingDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}

                              {event.documentRef && (
                                <span className="text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                                  <FileText className="w-3 h-3 text-indigo-600" />
                                  Doc: {event.documentRef}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Logged by:{" "}
                              <span className="text-slate-600 font-medium">
                                {event.recordedBy || "Legal Team"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeSubTab === "workflow" && matter.type === "sop" ? (
              <div className="space-y-5">
                {/* SOP Scope & Governance Banner */}
                <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                        {matter.sopCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Version {matter.version} • Effective: {matter.effectiveDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Governance Cadence:{" "}
                      <strong className="text-slate-800">{matter.reviewFrequency}</strong>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Process Scope & Organizational Coverage
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">{matter.scope}</p>
                  </div>

                  {matter.applicableRegulations && matter.applicableRegulations.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Statutory Mandates & Internal Controls Framework
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {matter.applicableRegulations.map((reg, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {reg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Numbered Workflow Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-teal-600" />
                      Prescribed Operating Procedures & Control Gates (
                      {matter.keySteps?.length || 0})
                    </h4>
                    <span className="text-[11px] text-slate-500">Execute in sequential order</span>
                  </div>

                  <div className="space-y-3">
                    {matter.keySteps?.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {step.stepNumber}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Role: {step.responsibleRole}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pl-8">
                          {step.description}
                        </p>

                        {step.controlCheck && (
                          <div className="ml-8 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Mandatory Internal Control:</strong> {step.controlCheck}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeSubTab === "timeline" ? (
              <div className="space-y-4">
                {matter.progressUpdates.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No progress updates recorded yet.</p>
                    <button
                      onClick={() => setIsProgressModalOpen(true)}
                      className="mt-3 text-xs text-sky-600 font-semibold hover:underline"
                    >
                      + Log First Progress Update
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {matter.progressUpdates.map((update, index) => (
                      <div key={update.id} className="relative group">
                        {/* Timeline Pin */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-2xs" />

                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {update.status}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {update.author}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {update.authorRole === "cfo"
                                  ? "Virtual CFO"
                                  : update.authorRole === "client_team"
                                    ? "Client Team"
                                    : "Executive"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {update.date}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">{update.notes}</p>

                          {update.nextSteps && (
                            <div className="mt-2.5 p-2 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 flex items-start gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Next Step / Milestone:</strong> {update.nextSteps}
                              </span>
                            </div>
                          )}

                          {update.documentRef && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-700">
                              <FileText className="w-3 h-3" />
                              <span>Ref: {update.documentRef}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {matter.documents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No documents attached to this matter yet.</p>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      + Upload First Specific Document
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matter.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                                  {doc.title}
                                </h5>
                                <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                  {doc.fileName}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                              {doc.category}
                            </span>
                          </div>

                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div>
                            <span>{doc.fileSize}</span> •{" "}
                            <span title={`Uploaded by ${doc.uploadedBy}`}>
                              {doc.uploadedBy.split(" ")[0]}
                            </span>{" "}
                            • <span>{doc.uploadedAt}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownloadSimulated(doc)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Download document copy"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {(role === "cfo" || currentUser.name === doc.uploadedBy) && (
                              <button
                                onClick={() => {
                                  setDocToDelete({ id: doc.id, fileName: doc.fileName });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Close */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Corporate Repository Dossier • Virtual CFO Governance Suite</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        matter={matter}
      />

      <AddProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        matter={matter}
      />

      <ConfirmDestructiveDialog
        open={showDeleteMatterConfirm}
        onOpenChange={setShowDeleteMatterConfirm}
        title="Delete Matter"
        description={`Are you sure you want to delete "${matter.title}" from the corporate repository? This action cannot be undone.`}
        confirmLabel="Delete Matter"
        onConfirm={confirmDeleteMatter}
      />

      <ConfirmDestructiveDialog
        open={!!docToDelete}
        onOpenChange={(open) => !open && setDocToDelete(null)}
        title="Delete Document"
        description={
          docToDelete
            ? `Are you sure you want to delete the document "${docToDelete.fileName}"?`
            : ""
        }
        confirmLabel="Delete Document"
        onConfirm={() => {
          if (docToDelete) {
            deleteRepositoryDocument(matter.id, matter.type, docToDelete.id);
            showToast(`Document "${docToDelete.fileName}" deleted.`);
            setDocToDelete(null);
          }
        }}
      />

      {/* Add Chronology Event Modal */}
      {isAddChronologyModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 bg-indigo-900 text-white flex items-center justify-between border-b border-indigo-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">Log Statutory Chronology Event</h3>
                  <p className="text-[11px] text-indigo-200">
                    Record notice, reply, hearing, interim stay, or court order in statutory case
                    record
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChronologyModalOpen(false)}
                className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAddChronologySubmit}
              className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stage / Event Type *
                  </label>
                  <select
                    value={newEventStage}
                    onChange={(e) => setNewEventStage(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs font-medium"
                  >
                    <option value="Notice / Summons">Notice / Summons</option>
                    <option value="Reply / Written Statement">Reply / Written Statement</option>
                    <option value="Statutory Deposit / Payment">Statutory Deposit / Payment</option>
                    <option value="Interim Order / Stay">Interim Order / Stay</option>
                    <option value="Evidence / Verification">Evidence / Verification</option>
                    <option value="Hearing / Appearance">Hearing / Appearance</option>
                    <option value="Final Order / Decree">Final Order / Decree</option>
                    <option value="Appeal / Revision">Appeal / Revision</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Court Ad-Interim Injunction Order Granted / Written Submissions Filed"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Forum / Authority
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ITAT Bengaluru Bench / Commercial Court"
                    value={newEventAuthority}
                    onChange={(e) => setNewEventAuthority(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Order / Notice Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DRC-01/DIV4/2024/7821 / I.A. 1/2024"
                    value={newEventRefNumber}
                    onChange={(e) => setNewEventRefNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Description & Facts of Proceeding *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide precise chronological record of arguments, directions passed by the bench/officer, compliance submitted, or reasons given in the order."
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Outcome / Next Legal Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Directed to submit paperbook before 15-Nov / Injunction made absolute"
                  value={newEventOutcome}
                  onChange={(e) => setNewEventOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Next Due / Hearing Date
                  </label>
                  <input
                    type="date"
                    value={newEventNextDate}
                    onChange={(e) => setNewEventNextDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Financial Impact (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500000"
                    value={newEventImpact}
                    onChange={(e) => setNewEventImpact(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attached Document Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Order_Copy_05_Sep.pdf"
                    value={newEventDocRef}
                    onChange={(e) => setNewEventDocRef(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-indigo-600 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddChronologyModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Record Chronology Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Chronology Docket Modal */}
      {isPrintDocketOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Chronology of Events - Case Hearing Docket</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintDocketOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Docket Sheet */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-900 font-sans print:p-0">
              {/* Caption Banner */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Statutory &amp; Judicial Proceedings Record
                </span>
                <h2 className="text-base font-extrabold uppercase text-slate-950">
                  Chronology of Events &amp; Summary of Proceedings
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  {matter.companyName} • {matterDisplayTitle}
                </p>
              </div>

              {/* Case Particulars Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Matter / Case Ref
                  </span>
                  <span className="font-bold text-slate-800">
                    {"caseOrNoticeNumber" in matter
                      ? matter.caseOrNoticeNumber
                      : "caseNumber" in matter
                        ? matter.caseNumber
                        : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Forum / Authority
                  </span>
                  <span className="font-bold text-slate-800">
                    {"authority" in matter
                      ? matter.authority
                      : "forumOrCourt" in matter
                        ? matter.forumOrCourt
                        : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Next Hearing / Due Date
                  </span>
                  <span className="font-bold text-rose-700">
                    {dueInfo.date} (
                    {dueInfo.days >= 0
                      ? `${dueInfo.days} days remaining`
                      : `${Math.abs(dueInfo.days)} days overdue`}
                    )
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Dispute / Demand Value
                  </span>
                  <span className="font-bold text-slate-900">
                    {"demandAmount" in matter
                      ? formatCurrency(matter.demandAmount)
                      : "claimOrExposureAmount" in matter
                        ? formatCurrency(matter.claimOrExposureAmount)
                        : "N/A"}
                  </span>
                </div>
              </div>

              {/* Case Summary */}
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  Brief Facts of Matter:
                </span>
                <p className="text-slate-600 leading-relaxed">{matter.summary}</p>
              </div>

              {/* Chronological Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px]">
                      <th className="py-2 px-3 font-semibold w-12 text-center">Sr.</th>
                      <th className="py-2 px-3 font-semibold w-24">Date</th>
                      <th className="py-2 px-3 font-semibold w-36">Stage / Order Ref</th>
                      <th className="py-2 px-3 font-semibold">Events &amp; Proceedings Summary</th>
                      <th className="py-2 px-3 font-semibold w-32">Outcome / Next Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rawChronology.map((event, idx) => (
                      <tr key={event.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {event.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold block text-slate-900">
                            {event.stageOrType}
                          </span>
                          {event.orderRefNumber && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {event.orderRefNumber}
                            </span>
                          )}
                          {event.authorityOrForum && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {event.authorityOrForum}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <strong className="block text-slate-900 mb-0.5">{event.title}</strong>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {event.description}
                          </p>
                          {event.financialImpactAmount !== undefined && (
                            <span className="inline-block mt-1 font-bold text-slate-800 text-[10.5px] bg-slate-100 px-1.5 py-0.5 rounded">
                              Impact: {formatCurrency(event.financialImpactAmount)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-700">
                          {event.outcomeOrNextStep || "Proceeding concluded"}
                          {event.nextHearingDate && (
                            <span className="block font-bold text-rose-700 mt-1 text-[10px]">
                              Due: {event.nextHearingDate}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Docket Signoff */}
              <div className="pt-4 text-xs text-slate-400 flex items-center justify-between border-t border-slate-200">
                <span>Certified Case Chronology Generated from Virtual CFO Repository</span>
                <span>Counsel / Authorized Signatory: ________________________</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
