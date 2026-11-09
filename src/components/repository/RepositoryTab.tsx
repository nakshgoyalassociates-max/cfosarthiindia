// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import {
  RepositoryItem,
  RepositoryItemType,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
} from "../../types";
import {
  classifyRepositoryItem,
  getRepositoryCategoryBadge,
  REPOSITORY_CATEGORY_METAS,
  RepositoryCategory,
} from "../../utils/repositoryCategory";
import { formatINR as formatCurrency } from "../../utils/format";
import {
  Scale,
  ShieldAlert,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  PlusCircle,
  Upload,
  FileText,
  Building,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Download,
  Trash2,
  MessageSquarePlus,
  Eye,
  EyeOff,
  IndianRupee,
  Layers,
  Sparkles,
  AlertCircle,
  FileCheck,
  Shield,
  ArrowUpDown,
  LayoutGrid,
  ListFilter,
  BookOpen,
  History,
} from "lucide-react";
import { MatterDetailModal } from "./MatterDetailModal";
import { NewMatterModal } from "./NewMatterModal";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { AddProgressModal } from "./AddProgressModal";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";
import { MatterChronologyFlowChart } from "./MatterChronologyFlowChart";

export const RepositoryTab: React.FC = () => {
  const {
    role,
    currentUser,
    taxAssessments,
    legalCases,
    licenses,
    sops,
    rawTaxAssessments,
    rawLegalCases,
    rawLicenses,
    rawSops,
    toggleItemVisibility,
    companies,
    selectedCompanyId,
    deleteTaxAssessment,
    deleteLegalCase,
    deleteLicense,
    deleteSop,
    resetRepositorySampleData,
    showToast,
  } = useApp();

  const [showHidden, setShowHidden] = useState<boolean>(false);
  const hiddenRepositoryCount = useMemo(() => {
    return (
      (rawTaxAssessments || []).filter((m) => m.isHidden).length +
      (rawLegalCases || []).filter((m) => m.isHidden).length +
      (rawLicenses || []).filter((m) => m.isHidden).length +
      (rawSops || []).filter((m) => m.isHidden).length
    );
  }, [rawTaxAssessments, rawLegalCases, rawLicenses, rawSops]);

  const [matterToDelete, setMatterToDelete] = useState<{
    id: string;
    type: string;
    title: string;
  } | null>(null);

  // Category navigation state: "all" | "income_tax" | "gst" | "legal" | "renewals" | "sop"
  const [activeCategory, setActiveCategory] = useState<RepositoryCategory>("all");
  const [viewLayout, setViewLayout] = useState<"grouped" | "unified">("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [onlyUpcomingDue, setOnlyUpcomingDue] = useState<boolean>(false);

  // Collapsed sections in grouped view
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    income_tax: false,
    gst: false,
    legal: false,
    renewals: false,
    sop: false,
  });

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Drilldown expanded matters
  const [expandedMatterIds, setExpandedMatterIds] = useState<Set<string>>(new Set());

  const toggleMatterExpand = (id: string) => {
    setExpandedMatterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Modals state
  const [selectedMatter, setSelectedMatter] = useState<RepositoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isNewMatterModalOpen, setIsNewMatterModalOpen] = useState<boolean>(false);
  const [newMatterDefaultType, setNewMatterDefaultType] = useState<
    RepositoryItemType | "income_tax" | "gst" | "legal" | "renewals" | "sop"
  >("income_tax");
  const [uploadTargetMatter, setUploadTargetMatter] = useState<RepositoryItem | null>(null);
  const [progressTargetMatter, setProgressTargetMatter] = useState<RepositoryItem | null>(null);

  // Calculate days remaining helper
  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(targetDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMatterDueDate = (item: RepositoryItem) => {
    if (item.type === "tax_assessment") return item.nextDueDate;
    if (item.type === "legal_case") return item.nextHearingDate;
    if (item.type === "sop") return item.nextReviewDate;
    return item.expiryDate;
  };

  // Combine all items for unified queries
  const allItems: RepositoryItem[] = useMemo(() => {
    if (showHidden && role === "cfo") {
      return [
        ...(rawTaxAssessments || taxAssessments),
        ...(rawLegalCases || legalCases),
        ...(rawLicenses || licenses),
        ...(rawSops || sops),
      ];
    }
    return [...taxAssessments, ...legalCases, ...licenses, ...sops];
  }, [
    showHidden,
    role,
    rawTaxAssessments,
    rawLegalCases,
    rawLicenses,
    rawSops,
    taxAssessments,
    legalCases,
    licenses,
    sops,
  ]);

  // Classified items
  const classifiedItems = useMemo(() => {
    const incomeTax: RepositoryItem[] = [];
    const gst: RepositoryItem[] = [];
    const legal: RepositoryItem[] = [];
    const renewals: RepositoryItem[] = [];
    const sop: RepositoryItem[] = [];

    allItems.forEach((item) => {
      const cat = classifyRepositoryItem(item);
      if (cat === "income_tax") incomeTax.push(item);
      else if (cat === "gst") gst.push(item);
      else if (cat === "legal") legal.push(item);
      else if (cat === "sop") sop.push(item);
      else renewals.push(item);
    });

    return { incomeTax, gst, legal, renewals, sop };
  }, [allItems]);

  // Find all urgent & coming due dates (<= 60 days or overdue)
  const comingDueItems = useMemo(() => {
    return allItems
      .map((item) => ({
        item,
        days: getDaysRemaining(getMatterDueDate(item)),
        dueDate: getMatterDueDate(item),
      }))
      .filter((x) => x.days <= 60)
      .sort((a, b) => a.days - b.days);
  }, [allItems]);

  // Comprehensive Category Statistics
  const stats = useMemo(() => {
    // 1. Income Tax
    const incomeTaxDemand = classifiedItems.incomeTax.reduce(
      (acc, curr) => acc + ("demandAmount" in curr ? curr.demandAmount : 0),
      0,
    );
    const incomeTaxDeposit = classifiedItems.incomeTax.reduce(
      (acc, curr) => acc + ("depositPaid" in curr ? curr.depositPaid || 0 : 0),
      0,
    );
    const incomeTaxUrgent = classifiedItems.incomeTax.filter(
      (i) => getDaysRemaining(getMatterDueDate(i)) <= 60,
    ).length;

    // 2. GST
    const gstDemand = classifiedItems.gst.reduce(
      (acc, curr) => acc + ("demandAmount" in curr ? curr.demandAmount : 0),
      0,
    );
    const gstDeposit = classifiedItems.gst.reduce(
      (acc, curr) => acc + ("depositPaid" in curr ? curr.depositPaid || 0 : 0),
      0,
    );
    const gstUrgent = classifiedItems.gst.filter(
      (i) => getDaysRemaining(getMatterDueDate(i)) <= 60,
    ).length;

    // 3. Legal
    const legalExposure = classifiedItems.legal.reduce(
      (acc, curr) => acc + ("claimOrExposureAmount" in curr ? curr.claimOrExposureAmount : 0),
      0,
    );
    const legalUrgent = classifiedItems.legal.filter(
      (i) => getDaysRemaining(getMatterDueDate(i)) <= 60,
    ).length;

    // 4. Renewals
    const renewalFees = classifiedItems.renewals.reduce(
      (acc, curr) => acc + ("annualFeeOrCost" in curr ? curr.annualFeeOrCost || 0 : 0),
      0,
    );
    const expiringRenewals = classifiedItems.renewals.filter(
      (l) => "expiryDate" in l && getDaysRemaining(l.expiryDate) <= 60,
    ).length;

    // 5. SOPs
    const sopCount = classifiedItems.sop.length;
    const sopReviewDue = classifiedItems.sop.filter(
      (s) => "nextReviewDate" in s && getDaysRemaining(s.nextReviewDate) <= 60,
    ).length;
    const sopStepsTotal = classifiedItems.sop.reduce(
      (acc, curr) =>
        acc + ("keySteps" in curr && Array.isArray(curr.keySteps) ? curr.keySteps.length : 0),
      0,
    );

    const totalDocs = allItems.reduce((acc, curr) => acc + curr.documents.length, 0);

    return {
      incomeTaxCount: classifiedItems.incomeTax.length,
      incomeTaxDemand,
      incomeTaxDeposit,
      incomeTaxUrgent,

      gstCount: classifiedItems.gst.length,
      gstDemand,
      gstDeposit,
      gstUrgent,

      legalCount: classifiedItems.legal.length,
      legalExposure,
      legalUrgent,

      renewalCount: classifiedItems.renewals.length,
      expiringRenewals,
      renewalFees,

      sopCount,
      sopReviewDue,
      sopStepsTotal,

      totalDocs,
      urgentCount: comingDueItems.filter((i) => i.days <= 30).length,
    };
  }, [classifiedItems, allItems, comingDueItems]);

  // Base matcher for filtering an individual item
  const itemMatchesFilters = (item: RepositoryItem): boolean => {
    // Company filter
    if (filterCompany !== "all" && item.companyId !== filterCompany) return false;

    // Risk filter
    if (filterRisk !== "all") {
      if ("riskLevel" in item && item.riskLevel !== filterRisk) return false;
    }

    // Upcoming due dates filter
    if (onlyUpcomingDue) {
      const days = getDaysRemaining(getMatterDueDate(item));
      if (days > 60) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      let matches = false;

      if (item.type === "tax_assessment") {
        matches =
          item.matterTitle.toLowerCase().includes(q) ||
          item.caseOrNoticeNumber.toLowerCase().includes(q) ||
          item.taxCategory.toLowerCase().includes(q) ||
          item.financialYear.toLowerCase().includes(q) ||
          item.assessingAuthority.toLowerCase().includes(q) ||
          item.counselName.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q);
      } else if (item.type === "legal_case") {
        matches =
          item.matterTitle.toLowerCase().includes(q) ||
          item.caseNumber.toLowerCase().includes(q) ||
          item.forumOrCourt.toLowerCase().includes(q) ||
          item.oppositeParty.toLowerCase().includes(q) ||
          item.legalCategory.toLowerCase().includes(q) ||
          item.advocateLegalFirm.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q);
      } else if (item.type === "sop") {
        matches =
          item.title.toLowerCase().includes(q) ||
          item.sopCode.toLowerCase().includes(q) ||
          item.sopCategory.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          item.approver.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.scope.toLowerCase().includes(q);
      } else {
        matches =
          item.title.toLowerCase().includes(q) ||
          item.licenseNumber.toLowerCase().includes(q) ||
          item.issuingAuthority.toLowerCase().includes(q) ||
          item.licenseCategory.toLowerCase().includes(q) ||
          item.renewalOfficer.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q);
      }

      if (!matches && item.companyName?.toLowerCase().includes(q)) {
        matches = true;
      }

      return matches;
    }

    return true;
  };

  // Filtered matters
  // Helper to sort matters with overdue items on top in each category
  const sortMatterWithOverdueOnTop = useCallback((items: RepositoryItem[]): RepositoryItem[] => {
    return [...items].sort((a, b) => {
      const daysA = getDaysRemaining(getMatterDueDate(a));
      const daysB = getDaysRemaining(getMatterDueDate(b));
      const isOverdueA = daysA < 0 ? 1 : 0;
      const isOverdueB = daysB < 0 ? 1 : 0;

      // 1. Overdue matters shown on top
      if (isOverdueA !== isOverdueB) {
        return isOverdueB - isOverdueA;
      }

      // If both are overdue, most overdue first (most negative days)
      if (isOverdueA === 1) {
        return daysA - daysB;
      }

      // If neither is overdue, sort by nearest deadline first
      return daysA - daysB;
    });
  }, []);

  const filteredItems = useMemo(() => {
    let list: RepositoryItem[] = [];
    if (activeCategory === "all") list = allItems;
    else if (activeCategory === "income_tax") list = classifiedItems.incomeTax;
    else if (activeCategory === "gst") list = classifiedItems.gst;
    else if (activeCategory === "legal") list = classifiedItems.legal;
    else if (activeCategory === "sop") list = classifiedItems.sop;
    else list = classifiedItems.renewals;

    return sortMatterWithOverdueOnTop(list.filter(itemMatchesFilters));
  }, [
    activeCategory,
    allItems,
    classifiedItems,
    filterCompany,
    filterRisk,
    itemMatchesFilters,
    onlyUpcomingDue,
    searchQuery,
    sortMatterWithOverdueOnTop,
  ]);

  // Grouped lists with active filters applied - overdue items shown on top in each category
  const groupedFilteredItems = useMemo(() => {
    return {
      income_tax: sortMatterWithOverdueOnTop(classifiedItems.incomeTax.filter(itemMatchesFilters)),
      gst: sortMatterWithOverdueOnTop(classifiedItems.gst.filter(itemMatchesFilters)),
      legal: sortMatterWithOverdueOnTop(classifiedItems.legal.filter(itemMatchesFilters)),
      renewals: sortMatterWithOverdueOnTop(classifiedItems.renewals.filter(itemMatchesFilters)),
      sop: classifiedItems.sop.filter(itemMatchesFilters),
    };
  }, [
    classifiedItems,
    filterCompany,
    filterRisk,
    itemMatchesFilters,
    onlyUpcomingDue,
    searchQuery,
    sortMatterWithOverdueOnTop,
  ]);

  const openMatterDossier = (matter: RepositoryItem) => {
    setSelectedMatter(matter);
    setIsDetailModalOpen(true);
  };

  const handleOpenNewMatter = (
    type: RepositoryItemType | "income_tax" | "gst" | "legal" | "renewals" | "sop",
  ) => {
    setNewMatterDefaultType(type);
    setIsNewMatterModalOpen(true);
  };

  const handleDeleteMatter = (item: RepositoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const title =
      item.type === "license_certification" || item.type === "sop" ? item.title : item.matterTitle;
    setMatterToDelete({ id: item.id, type: item.type, title });
  };

  // Reusable Matter Item Card Component - Compact ~30% height with inline drill down capability
  const renderMatterItem = (item: RepositoryItem) => {
    const days = getDaysRemaining(getMatterDueDate(item));
    const isUrgent = days <= 30;
    const isOverdue = days < 0;
    const catBadge = getRepositoryCategoryBadge(item);
    const isExpanded = expandedMatterIds.has(item.id);

    return (
      <div
        key={item.id}
        className={`my-2 mx-1 sm:mx-2 rounded-xl border border-black/20 hover:border-black/50 transition-all bg-white overflow-hidden ${
          isExpanded ? "ring-2 ring-indigo-500/25 border-black/45 shadow-sm" : "shadow-2xs"
        }`}
      >
        {/* Compact Single-Line Row (~30% of original height) - Clicking anywhere toggles expand */}
        <div
          onClick={() => toggleMatterExpand(item.id)}
          className="py-2.5 px-3 sm:px-4 hover:bg-slate-50/90 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer select-none"
        >
          {/* Left: Drilldown Chevron, Badge, Title, Ref */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMatterExpand(item.id);
              }}
              className="p-1 -ml-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
              title={isExpanded ? "Collapse details" : "Drill down details"}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {/* Category Tag */}
            <span
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold shrink-0 flex items-center gap-1 ${catBadge.badgeClasses}`}
            >
              {catBadge.label}
            </span>

            {item.isHidden && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0 flex items-center gap-0.5">
                <EyeOff className="w-2.5 h-2.5" />
                HIDDEN
              </span>
            )}

            {/* Title & Ref */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleMatterExpand(item.id);
              }}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate max-w-[240px] sm:max-w-xs md:max-w-md"
              title={
                item.type === "license_certification" || item.type === "sop"
                  ? item.title
                  : item.matterTitle
              }
            >
              {item.type === "license_certification" || item.type === "sop"
                ? item.title
                : item.matterTitle}
            </span>

            <span className="text-[10.5px] text-slate-400 font-mono hidden sm:inline shrink-0">
              [Ref:{" "}
              {item.type === "tax_assessment"
                ? item.caseOrNoticeNumber
                : item.type === "legal_case"
                  ? item.caseNumber
                  : item.type === "sop"
                    ? item.sopCode
                    : item.licenseNumber}
              ]
            </span>

            <span className="text-[10px] text-slate-400 hidden md:inline shrink-0">
              • {item.companyName}
            </span>
          </div>

          {/* Right: Exposure/Cost, Due Date, Quick Dossier Button */}
          <div
            className="flex items-center gap-2 sm:gap-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Amount / Steps badge */}
            <div className="text-right">
              {item.type === "sop" ? (
                <span className="font-bold text-teal-800 font-mono text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {item.version} • {item.keySteps?.length || 0} Steps
                </span>
              ) : (
                <span className="font-bold text-slate-900 font-mono tabular-nums text-xs sm:text-[13px]">
                  {item.type === "tax_assessment"
                    ? formatCurrency(item.demandAmount)
                    : item.type === "legal_case"
                      ? formatCurrency(item.claimOrExposureAmount)
                      : formatCurrency(item.annualFeeOrCost)}
                </span>
              )}
            </div>

            {/* Due Date Badge */}
            <div className="hidden sm:flex items-center">
              {isOverdue ? (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {Math.abs(days)}d Overdue
                </span>
              ) : isUrgent ? (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  {days}d left
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] text-slate-600 bg-slate-100">
                  {getMatterDueDate(item)}
                </span>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1">
              {role === "cfo" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItemVisibility("repository", item.id);
                  }}
                  title={
                    item.isHidden
                      ? "Unhide repository item"
                      : "Hide repository item (Keep for future without deleting)"
                  }
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer flex items-center gap-0.5 ${
                    item.isHidden
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                      : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border-slate-200"
                  }`}
                >
                  {item.isHidden ? (
                    <>
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">Unhide</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span className="hidden sm:inline">Hide</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProgressTargetMatter(item);
                }}
                title="Log update"
                className="p-1 rounded text-sky-700 hover:bg-sky-100 cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openMatterDossier(item);
                }}
                title="Open full matter dossier"
                className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <span>Dossier</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Inline Drilldown Panel (when expanded): LEFT SIDE: OTHER DETAILS, RIGHT SIDE: CHRONOLOGY FLOW CHART */}
        {isExpanded && (
          <div className="p-3.5 sm:p-5 bg-slate-50/70 border-t border-black/20 text-xs animate-in slide-in-from-top-1 duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LEFT SIDE: OTHER DETAILS (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-3">
                {/* 1. Authority, Reference & Identification Card */}
                <div className="p-3 bg-white rounded-xl border border-black/20 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Matter Specifications
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {item.companyName}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block font-medium">
                        {item.type === "tax_assessment"
                          ? "Assessing Authority & Jurisdiction"
                          : item.type === "legal_case"
                            ? "Forum & Adjudicating Court"
                            : item.type === "sop"
                              ? "Process Owner & Department"
                              : "Issuing Authority & Department"}
                      </span>
                      <p className="font-bold text-xs text-slate-900">
                        {item.type === "tax_assessment" &&
                          `${item.authority} (FY ${item.financialYear} / AY ${item.assessmentYear})`}
                        {item.type === "legal_case" && `${item.forumOrCourt} (${item.companyRole})`}
                        {item.type === "license_certification" && item.issuingAuthority}
                        {item.type === "sop" && `${item.owner} • ${item.department} Department`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {item.type === "sop" ? "SOP Code" : "Reference / DIN / Suit #"}
                        </span>
                        <p className="font-mono font-bold text-[11px] text-indigo-900 truncate">
                          {item.type === "tax_assessment"
                            ? item.caseOrNoticeNumber
                            : item.type === "legal_case"
                              ? item.caseNumber
                              : item.type === "sop"
                                ? item.sopCode
                                : item.licenseNumber}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Status & Risk Level
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-800 truncate">
                            {item.status}
                          </span>
                          {"riskLevel" in item && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                item.riskLevel === "Critical"
                                  ? "bg-rose-100 text-rose-800"
                                  : item.riskLevel === "High"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.riskLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Financial Overview & Deposits */}
                <div className="p-3 bg-white rounded-xl border border-black/20 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Financial Exposure & Capital At Risk
                  </span>

                  {item.type === "tax_assessment" ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-rose-50/50 rounded-lg border border-rose-200/70">
                        <span className="text-[10px] text-rose-700 font-semibold block">
                          Disputed Tax Demand
                        </span>
                        <p className="font-black text-sm font-mono text-rose-950 mt-0.5">
                          {formatCurrency(item.demandAmount)}
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-200/70">
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Stay Deposit Remitted
                        </span>
                        <p className="font-black text-sm font-mono text-emerald-950 mt-0.5">
                          {formatCurrency(item.depositPaid || 0)}
                        </p>
                        {item.demandAmount > 0 && item.depositPaid && (
                          <span className="text-[9.5px] font-bold text-emerald-700 block">
                            {Math.round((item.depositPaid / item.demandAmount) * 100)}% Deposited
                          </span>
                        )}
                      </div>
                    </div>
                  ) : item.type === "legal_case" ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-200/70">
                        <span className="text-[10px] text-amber-800 font-semibold block">
                          Claimed Exposure
                        </span>
                        <p className="font-black text-sm font-mono text-amber-950 mt-0.5">
                          {formatCurrency(item.claimOrExposureAmount)}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-600 font-semibold block">
                          Contingency Liability
                        </span>
                        <p className="font-bold text-xs text-slate-800 mt-1">
                          {item.contingentLiabilityStatus || "Probable"} Risk
                        </p>
                      </div>
                    </div>
                  ) : item.type === "license_certification" ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-purple-50/50 rounded-lg border border-purple-200/70">
                        <span className="text-[10px] text-purple-700 font-semibold block">
                          Annual Statutory Fee
                        </span>
                        <p className="font-black text-sm font-mono text-purple-950 mt-0.5">
                          {formatCurrency(item.annualFeeOrCost)}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-600 font-semibold block">
                          Renewal Window
                        </span>
                        <p className="font-bold text-xs text-slate-800 mt-1">
                          {item.renewalWindowDays} Days Prior
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-teal-50/50 rounded-lg border border-teal-200/70">
                        <span className="text-[10px] text-teal-700 font-semibold block">
                          Control Steps
                        </span>
                        <p className="font-black text-sm font-mono text-teal-950 mt-0.5">
                          {item.keySteps?.length || 0} Steps
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-600 font-semibold block">
                          Governance Cadence
                        </span>
                        <p className="font-bold text-xs text-slate-800 mt-1">
                          {item.reviewFrequency} Cycle
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Representation & Critical Next Date */}
                <div className="p-3 bg-white rounded-xl border border-black/20 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Legal Counsel & Critical Dates
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-900">
                      {getMatterDueDate(item)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {item.type === "tax_assessment"
                          ? "Assigned Counsel / CA:"
                          : item.type === "legal_case"
                            ? "Advocate / Legal Firm:"
                            : item.type === "license_certification"
                              ? "Renewal Officer:"
                              : "Approver Authority:"}
                      </span>
                      <strong className="text-slate-900 text-right truncate max-w-[200px]">
                        {item.type === "tax_assessment" && item.counselName}
                        {item.type === "legal_case" && item.advocateLegalFirm}
                        {item.type === "license_certification" && item.renewalOfficer}
                        {item.type === "sop" && item.approver}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-950 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          {item.type === "tax_assessment"
                            ? item.dueDateType || "Statutory Due Date"
                            : item.type === "legal_case"
                              ? item.hearingPurpose || "Court Hearing Date"
                              : "Expiry / Review Date"}
                        </span>
                      </div>
                      <span className="font-bold text-amber-900 font-mono text-[11px]">
                        {days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Strategic Summary */}
                <div className="p-3 bg-white rounded-xl border border-black/20 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Strategic Context & Defense Stance
                  </span>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                {/* 5. Attached Repository Documents Snippet */}
                {item.documents && item.documents.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-black/20 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Attached Documents ({item.documents.length})
                      </span>
                      <button
                        onClick={() => setUploadTargetMatter(item)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      {item.documents.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/80 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className="truncate font-medium text-slate-800"
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </span>
                            <span className="text-[9.5px] text-slate-400 shrink-0">
                              ({doc.fileSize})
                            </span>
                          </div>
                          <a
                            href={doc.fileUrl || "#"}
                            download={doc.fileName}
                            onClick={(e) => {
                              if (!doc.fileUrl) {
                                e.preventDefault();
                                showToast(`Downloading archived document: ${doc.fileName}`);
                              }
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer shrink-0"
                            title="Download document"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                      {item.documents.length > 3 && (
                        <p className="text-[10px] text-slate-400 text-center pt-0.5">
                          + {item.documents.length - 3} more files in full dossier
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => setProgressTargetMatter(item)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Log Progress</span>
                  </button>

                  <button
                    onClick={() => setUploadTargetMatter(item)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Doc</span>
                  </button>

                  <button
                    onClick={() => openMatterDossier(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs ml-auto"
                  >
                    <span>Full Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {role === "cfo" && (
                    <button
                      onClick={(e) => handleDeleteMatter(item, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Delete or Hide matter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: CHRONOLOGY FLOW CHART (lg:col-span-7) */}
              <div className="lg:col-span-7">
                <MatterChronologyFlowChart
                  matter={item}
                  onAddEvent={() => openMatterDossier(item)}
                  onOpenDossier={() => openMatterDossier(item)}
                  onUploadDoc={() => setUploadTargetMatter(item)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Corporate Repository &amp; Matter Tracker
            </h1>
            {stats.urgentCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {stats.urgentCount} Urgent
              </span>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setOnlyUpcomingDue(!onlyUpcomingDue)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                onlyUpcomingDue
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {onlyUpcomingDue
                  ? "Showing Due Dates Only"
                  : `Due Dates Alert (${comingDueItems.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => resetRepositorySampleData()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reload comprehensive repository sample test data across Tax, Legal, Licenses & SOPs for all entities"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sample Test Data</span>
            </button>

            {role === "cfo" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHidden(!showHidden)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    showHidden
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                  title="Show or hide archived/hidden repository items"
                >
                  {showHidden ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showHidden ? "Showing Hidden" : "Hidden"} ({hiddenRepositoryCount})
                  </span>
                </button>
                <button
                  id="cfo-add-matter-btn"
                  onClick={() =>
                    handleOpenNewMatter(activeCategory !== "all" ? activeCategory : "income_tax")
                  }
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Register Matter</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-700 text-[9px] text-amber-300 uppercase font-bold">
                    CFO Admin
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Highlight Coming Due Dates Alert Strip - Compact Small Boxes with Dark Theme */}
        <div className="mt-4 pt-3.5 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Upcoming Hearing & Renewal Deadlines (Next 60 Days)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                • Click card to review dossier
              </span>
            </div>
            <button
              onClick={() => setOnlyUpcomingDue(!onlyUpcomingDue)}
              className="text-[11px] text-amber-300 hover:text-amber-200 hover:underline font-bold cursor-pointer self-start sm:self-auto"
            >
              {onlyUpcomingDue ? "✕ Clear Filter" : "Filter List Below →"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {comingDueItems.slice(0, 4).map(({ item, days, dueDate }) => {
              const isUrgent = days <= 30;
              const isOverdue = days < 0;
              const catBadge = getRepositoryCategoryBadge(item);

              return (
                <div
                  key={item.id}
                  onClick={() => openMatterDossier(item)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer group ${
                    isOverdue
                      ? "bg-rose-950/40 border-rose-500/60 hover:bg-rose-950/60"
                      : isUrgent
                        ? "bg-amber-950/40 border-amber-500/60 hover:bg-amber-950/60"
                        : "bg-slate-800/80 border-slate-700/70 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-700 bg-slate-900/80 text-slate-300">
                      {catBadge.label}
                    </span>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isOverdue
                          ? "bg-rose-500/30 text-rose-300 border-rose-500/40"
                          : isUrgent
                            ? "bg-amber-500/30 text-amber-300 border-amber-500/40"
                            : "bg-sky-500/30 text-sky-300 border-sky-500/40"
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(days)}d Overdue!`
                        : days === 0
                          ? "Due Today!"
                          : `${days}d Left`}
                    </span>
                  </div>

                  <h4 className="text-[11.5px] font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {item.type === "license_certification" || item.type === "sop"
                      ? item.title
                      : item.matterTitle}
                  </h4>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px] font-mono text-[9.5px]">
                      {item.type === "tax_assessment"
                        ? item.caseOrNoticeNumber
                        : item.type === "legal_case"
                          ? item.caseNumber
                          : item.type === "sop"
                            ? item.sopCode
                            : item.licenseNumber}
                    </span>
                    <span className="font-bold text-slate-200">{dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 Dedicated Category Metric Overview Cards - Compact Small Boxes with Statutory Compliance Master Dark Background Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {/* Category 1: Income Tax Assessments */}
        <div
          onClick={() => setActiveCategory(activeCategory === "income_tax" ? "all" : "income_tax")}
          className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
            activeCategory === "income_tax"
              ? "bg-slate-800 ring-2 ring-indigo-400/80 border-indigo-400 shadow-xs"
              : "bg-slate-900 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-6 h-6 rounded border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              {stats.incomeTaxUrgent > 0 && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {stats.incomeTaxUrgent} due
                </span>
              )}
              <span className="text-[9.5px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                {stats.incomeTaxCount} Matters
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[10.5px] text-slate-400 font-medium block truncate">
              Income Tax Assessments
            </span>
            <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(stats.incomeTaxDemand)}
            </h3>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Stay Deposit:</span>
              <strong className="text-emerald-400 font-bold font-mono">
                {formatCurrency(stats.incomeTaxDeposit)}
              </strong>
            </div>
          </div>
          {activeCategory === "income_tax" && (
            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-400" />
          )}
        </div>

        {/* Category 2: GST & Indirect Taxes */}
        <div
          onClick={() => setActiveCategory(activeCategory === "gst" ? "all" : "gst")}
          className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
            activeCategory === "gst"
              ? "bg-slate-800 ring-2 ring-emerald-400/80 border-emerald-400 shadow-xs"
              : "bg-slate-900 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-6 h-6 rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              {stats.gstUrgent > 0 && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {stats.gstUrgent} due
                </span>
              )}
              <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {stats.gstCount} Audits
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[10.5px] text-slate-400 font-medium block truncate">
              GST & Indirect Taxes
            </span>
            <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(stats.gstDemand)}
            </h3>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Deposit / Protest:</span>
              <strong className="text-emerald-400 font-bold font-mono">
                {formatCurrency(stats.gstDeposit)}
              </strong>
            </div>
          </div>
          {activeCategory === "gst" && (
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-400" />
          )}
        </div>

        {/* Category 3: Legal Cases & Litigation */}
        <div
          onClick={() => setActiveCategory(activeCategory === "legal" ? "all" : "legal")}
          className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
            activeCategory === "legal"
              ? "bg-slate-800 ring-2 ring-amber-400/80 border-amber-400 shadow-xs"
              : "bg-slate-900 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-6 h-6 rounded border border-amber-500/30 bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              {stats.legalUrgent > 0 && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {stats.legalUrgent} hearings
                </span>
              )}
              <span className="text-[9.5px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                {stats.legalCount} Cases
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[10.5px] text-slate-400 font-medium block truncate">
              Contingent Claims / Suits
            </span>
            <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(stats.legalExposure)}
            </h3>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Court Dockets:</span>
              <strong className="text-slate-200 font-bold">{stats.legalCount} Suits</strong>
            </div>
          </div>
          {activeCategory === "legal" && (
            <div className="absolute top-0 right-0 w-1 h-full bg-amber-400" />
          )}
        </div>

        {/* Category 4: Licenses & Renewal Items */}
        <div
          onClick={() => setActiveCategory(activeCategory === "renewals" ? "all" : "renewals")}
          className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
            activeCategory === "renewals"
              ? "bg-slate-800 ring-2 ring-purple-400/80 border-purple-400 shadow-xs"
              : "bg-slate-900 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-6 h-6 rounded border border-purple-500/30 bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              {stats.expiringRenewals > 0 && (
                <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                  {stats.expiringRenewals} expiring
                </span>
              )}
              <span className="text-[9.5px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                {stats.renewalCount} Licenses
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[10.5px] text-slate-400 font-medium block truncate">
              Licenses & Renewals
            </span>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5 truncate">
              {stats.expiringRenewals} Due Soon
            </h3>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Statutory Fees:</span>
              <strong className="text-slate-200 font-bold font-mono">
                {formatCurrency(stats.renewalFees)}
              </strong>
            </div>
          </div>
          {activeCategory === "renewals" && (
            <div className="absolute top-0 right-0 w-1 h-full bg-purple-400" />
          )}
        </div>

        {/* Category 5: Standard Operating Procedures (SOPs) */}
        <div
          onClick={() => setActiveCategory(activeCategory === "sop" ? "all" : "sop")}
          className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
            activeCategory === "sop"
              ? "bg-slate-800 ring-2 ring-teal-400/80 border-teal-400 shadow-xs"
              : "bg-slate-900 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="w-6 h-6 rounded border border-teal-500/30 bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1">
              {stats.sopReviewDue > 0 && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {stats.sopReviewDue} review
                </span>
              )}
              <span className="text-[9.5px] font-bold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded border border-teal-500/30">
                {stats.sopCount} SOPs
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[10.5px] text-slate-400 font-medium block truncate">
              Standard Operating Procedures
            </span>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5 truncate">
              {stats.sopCount} Active SOPs
            </h3>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Internal Controls:</span>
              <strong className="text-teal-300 font-bold">{stats.sopStepsTotal} Key Steps</strong>
            </div>
          </div>
          {activeCategory === "sop" && (
            <div className="absolute top-0 right-0 w-1 h-full bg-teal-400" />
          )}
        </div>
      </div>

      {/* Main Matter List Section */}
      <div className="bg-white rounded-2xl border border-black/20 shadow-xs overflow-hidden">
        {/* Navigation Sub-Tabs & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-black/20 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Sub tabs for categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Categories ({allItems.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory("income_tax")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "income_tax"
                  ? "bg-indigo-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/50"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Income Tax ({stats.incomeTaxCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory("gst")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "gst"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GST & Indirect ({stats.gstCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory("legal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "legal"
                  ? "bg-amber-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-amber-700 hover:bg-amber-50/50"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Legal Cases ({stats.legalCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory("renewals")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "renewals"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-purple-700 hover:bg-purple-50/50"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Renewal Items ({stats.renewalCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory("sop")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === "sop"
                  ? "bg-teal-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-teal-700 hover:bg-teal-50/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>SOPs ({stats.sopCount})</span>
            </button>
          </div>

          {/* Search, Filters and Layout View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Layout Toggle */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setViewLayout("grouped")}
                title="Grouped by Category Sections"
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewLayout === "grouped"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grouped</span>
              </button>
              <button
                onClick={() => setViewLayout("unified")}
                title="Unified Dossier Table"
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewLayout === "unified"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unified</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search matter, notice #, court..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Entity Filter (If CFO) */}
            {role === "cfo" && (
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}

            {/* Risk filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
            >
              <option value="all">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>
        </div>

        {/* Matter Items Rendering: Grouped Sections vs Unified Table */}
        {viewLayout === "grouped" && activeCategory === "all" ? (
          <div className="divide-y divide-black/10">
            {/* 1. Income Tax Section */}
            <div className="bg-white">
              <div
                onClick={() => toggleCategoryCollapse("income_tax")}
                className="px-5 py-3.5 bg-blue-900 hover:bg-blue-950 border-b border-blue-950 text-white flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-800 text-blue-200 border border-blue-700 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        Income Tax Assessments & Appeals
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-800 text-blue-100 border border-blue-700">
                        {groupedFilteredItems.income_tax.length} Items
                      </span>
                      {groupedFilteredItems.income_tax.filter(
                        (i) => getDaysRemaining(getMatterDueDate(i)) < 0,
                      ).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 shadow-2xs">
                          <AlertCircle className="w-2.5 h-2.5" />
                          {
                            groupedFilteredItems.income_tax.filter(
                              (i) => getDaysRemaining(getMatterDueDate(i)) < 0,
                            ).length
                          }{" "}
                          Overdue (On Top)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-blue-300 font-semibold uppercase">
                      Exposure
                    </span>
                    <p className="text-xs font-bold text-white font-mono">
                      {formatCurrency(stats.incomeTaxDemand)}
                    </p>
                  </div>
                  {role === "cfo" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewMatter("income_tax");
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-800 hover:bg-blue-700 text-white border border-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add Income Tax</span>
                    </button>
                  )}
                  {collapsedCategories.income_tax ? (
                    <ChevronRight className="w-4 h-4 text-blue-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-300" />
                  )}
                </div>
              </div>

              {!collapsedCategories.income_tax && (
                <div className="divide-y divide-black/10 border-t border-black/15">
                  {groupedFilteredItems.income_tax.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching Income Tax items found for the current filters.
                    </div>
                  ) : (
                    groupedFilteredItems.income_tax.map(renderMatterItem)
                  )}
                </div>
              )}
            </div>

            {/* 2. GST Section */}
            <div className="bg-white">
              <div
                onClick={() => toggleCategoryCollapse("gst")}
                className="px-5 py-3.5 bg-emerald-50/40 hover:bg-emerald-50/70 border-b border-black/15 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wider">
                        GST & Indirect Tax Audits / Notices
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {groupedFilteredItems.gst.length} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Exposure
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(stats.gstDemand)}
                    </p>
                  </div>
                  {role === "cfo" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewMatter("gst");
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add GST Matter</span>
                    </button>
                  )}
                  {collapsedCategories.gst ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedCategories.gst && (
                <div className="divide-y divide-black/10 border-t border-black/15">
                  {groupedFilteredItems.gst.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching GST items found for the current filters.
                    </div>
                  ) : (
                    groupedFilteredItems.gst.map(renderMatterItem)
                  )}
                </div>
              )}
            </div>

            {/* 3. Legal Section */}
            <div className="bg-white">
              <div
                onClick={() => toggleCategoryCollapse("legal")}
                className="px-5 py-3.5 bg-amber-50/40 hover:bg-amber-50/70 border-b border-black/15 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wider">
                        Legal Cases & Commercial Litigations
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {groupedFilteredItems.legal.length} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Contingent
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(stats.legalExposure)}
                    </p>
                  </div>
                  {role === "cfo" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewMatter("legal");
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add Legal Case</span>
                    </button>
                  )}
                  {collapsedCategories.legal ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedCategories.legal && (
                <div className="divide-y divide-black/10 border-t border-black/15">
                  {groupedFilteredItems.legal.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching Legal cases found for the current filters.
                    </div>
                  ) : (
                    groupedFilteredItems.legal.map(renderMatterItem)
                  )}
                </div>
              )}
            </div>

            {/* 4. Renewal Items & Licenses Section */}
            <div className="bg-white">
              <div
                onClick={() => toggleCategoryCollapse("renewals")}
                className="px-5 py-3.5 bg-purple-50/40 hover:bg-purple-50/70 border-b border-black/15 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-purple-950 uppercase tracking-wider">
                        Licenses & Statutory Renewal Items
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {groupedFilteredItems.renewals.length} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Annual Fees
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(stats.renewalFees)}
                    </p>
                  </div>
                  {role === "cfo" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewMatter("renewals");
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add Renewal Item</span>
                    </button>
                  )}
                  {collapsedCategories.renewals ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedCategories.renewals && (
                <div className="divide-y divide-black/10 border-t border-black/15">
                  {groupedFilteredItems.renewals.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching Renewal items found for the current filters.
                    </div>
                  ) : (
                    groupedFilteredItems.renewals.map(renderMatterItem)
                  )}
                </div>
              )}
            </div>

            {/* 5. Standard Operating Procedures (SOPs) Section */}
            <div className="bg-white">
              <div
                onClick={() => toggleCategoryCollapse("sop")}
                className="px-5 py-3.5 bg-teal-50/40 hover:bg-teal-50/70 border-b border-black/15 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-teal-950 uppercase tracking-wider">
                        Standard Operating Procedures (SOPs) & Internal Controls
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        {groupedFilteredItems.sop.length} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Governance
                    </span>
                    <p className="text-xs font-bold text-teal-900">
                      {stats.sopStepsTotal} Control Steps
                    </p>
                  </div>
                  {role === "cfo" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewMatter("sop");
                      }}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add SOP</span>
                    </button>
                  )}
                  {collapsedCategories.sop ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedCategories.sop && (
                <div className="divide-y divide-black/10 border-t border-black/15">
                  {groupedFilteredItems.sop.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching Standard Operating Procedures found for the current filters.
                    </div>
                  ) : (
                    groupedFilteredItems.sop.map(renderMatterItem)
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Unified Table / List View */
          <div>
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <h3 className="text-sm font-semibold text-slate-700">
                  No matching repository items found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search criteria or switch category tab.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  {onlyUpcomingDue && (
                    <button
                      onClick={() => setOnlyUpcomingDue(false)}
                      className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                      Clear "Upcoming Due Dates" Filter
                    </button>
                  )}
                  <button
                    onClick={() => resetRepositorySampleData()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Load Sample Test Data</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-black/10 border-y border-black/15">
                {filteredItems.map(renderMatterItem)}
              </div>
            )}
          </div>
        )}

        {/* Footer summary bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing{" "}
            <strong>
              {viewLayout === "grouped" && activeCategory === "all"
                ? groupedFilteredItems.income_tax.length +
                  groupedFilteredItems.gst.length +
                  groupedFilteredItems.legal.length +
                  groupedFilteredItems.renewals.length +
                  groupedFilteredItems.sop.length
                : filteredItems.length}
            </strong>{" "}
            of <strong>{allItems.length}</strong> corporate repository dockets
          </div>
          <div className="flex items-center gap-4">
            <span>
              Role Authority:{" "}
              <strong className="text-slate-700 capitalize">
                {role === "cfo"
                  ? "Virtual CFO (Full Admin & Edit Access)"
                  : role === "client_team"
                    ? "Client Team (Update Progress & Upload Documents)"
                    : "Client Executive (Dossier Review)"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Dossier Detail Modal */}
      <MatterDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMatter(null);
        }}
        matter={selectedMatter}
      />

      {/* CFO Register New Matter Modal */}
      <NewMatterModal
        isOpen={isNewMatterModalOpen}
        onClose={() => setIsNewMatterModalOpen(false)}
        defaultType={newMatterDefaultType}
      />

      {/* Upload Document Modal (From List quick action) */}
      {uploadTargetMatter && (
        <UploadDocumentModal
          isOpen={!!uploadTargetMatter}
          onClose={() => setUploadTargetMatter(null)}
          matter={uploadTargetMatter}
        />
      )}

      {/* Progress Update Modal (From List quick action) */}
      {progressTargetMatter && (
        <AddProgressModal
          isOpen={!!progressTargetMatter}
          onClose={() => setProgressTargetMatter(null)}
          matter={progressTargetMatter}
        />
      )}

      <ConfirmDestructiveDialog
        open={!!matterToDelete}
        onOpenChange={(open) => !open && setMatterToDelete(null)}
        title="Delete or Hide Repository Matter"
        description={
          matterToDelete
            ? `Instead of permanently deleting "${matterToDelete.title}" from the corporate repository, you can click "Hide Instead" so it remains archived and can be unhidden whenever needed in the future.`
            : ""
        }
        confirmLabel="Remove Permanently"
        onHideInstead={
          matterToDelete
            ? () => {
                toggleItemVisibility("repository", matterToDelete.id, undefined, true);
                setMatterToDelete(null);
              }
            : undefined
        }
        onConfirm={() => {
          if (matterToDelete) {
            if (matterToDelete.type === "tax_assessment") deleteTaxAssessment(matterToDelete.id);
            else if (matterToDelete.type === "legal_case") deleteLegalCase(matterToDelete.id);
            else if (matterToDelete.type === "sop") deleteSop(matterToDelete.id);
            else deleteLicense(matterToDelete.id);
            showToast(`Removed "${matterToDelete.title}" from repository.`);
            setMatterToDelete(null);
          }
        }}
      />
    </div>
  );
};
