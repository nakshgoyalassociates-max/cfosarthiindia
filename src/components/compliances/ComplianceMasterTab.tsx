import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ProgressBar } from "../common/ProgressBar";
import { DueDateBadge } from "../common/DueDateBadge";
import { ComplianceInlineDetail } from "../common/ComplianceInlineDetail";
import { ComplianceSubtaskProgressIcons } from "../common/ComplianceSubtaskProgressIcons";
import {
  getComplianceFourColorStatus,
  getLineItemRowClasses,
  getComplianceLineItemBorder,
} from "../../utils/statusColors";
import {
  PeriodicityFilter,
  PeriodicityGroup,
  classifyCompliancePeriodicity,
  getCompliancePeriodicityBadge,
  segregateCompliances,
  calculateGroupStats,
  PERIODICITY_GROUPS_META,
} from "../../utils/compliancePeriodicity";
import { ComplianceItem } from "../../types";
import { ComplianceAssignedTasksView } from "./ComplianceAssignedTasksView";
import { ComplianceEditModal } from "../admin/ComplianceEditModal";
import { ComplianceCalendarBar } from "./ComplianceCalendarBar";
import {
  isComplianceInMonth,
  sortCompliancesByUrgencyAndPastMonths,
  getCurrentMonthKey,
  isComplianceDueOrInPipeline,
} from "../../utils/complianceCalendarEngine";
import { isComplianceFiled, daysUntilDue, dueStatus } from "../../utils/dueDate";
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ShieldCheck,
  Building,
  Maximize2,
  Minimize2,
  FileCheck,
  UploadCloud,
  CornerDownRight,
  Clock,
  ShieldAlert,
  RotateCcw,
  Repeat,
  CalendarRange,
  Layers,
  Sparkles,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Eye,
  EyeOff,
  UserCheck,
  Edit2,
  AlertCircle,
  Archive,
  Bell,
} from "lucide-react";

interface ComplianceMasterTabProps {
  initialCategory?: string;
}

export const ComplianceMasterTab: React.FC<ComplianceMasterTabProps> = ({ initialCategory }) => {
  const {
    role,
    isCfoAdmin,
    compliances,
    rawCompliances,
    updateCompliance,
    userAccounts,
    clientProfile,
    showToast,
    toggleItemVisibility,
    actionFlowTasks,
    setSelectedCompliance,
    stats,
    openComplianceProofModal,
    openComplianceProofView,
    selectedComplianceMonth,
    setSelectedComplianceMonth,
    hideCompletedCompliances,
    setHideCompletedCompliances,
    toggleHideCompletedCompliances,
    autoHideEarlierCompleted,
    setAutoHideEarlierCompleted,
    toggleAutoHideEarlierCompleted,
    openReminderCenter,
    openReminderPreviewForItem,
  } = useApp();

  const complianceRemindersCount = useMemo(() => {
    return (compliances || []).filter((c) => {
      if (c.isHidden || isComplianceFiled(c)) return false;
      const days = daysUntilDue(c);
      return days !== null && days <= 7;
    }).length;
  }, [compliances]);

  const isAdmin = role === "cfo" || isCfoAdmin;
  const [editingComplianceItem, setEditingComplianceItem] = useState<ComplianceItem | null>(null);
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("ALL");

  const assignablePersons = useMemo(() => {
    const names = new Set<string>();
    (userAccounts || []).forEach((u) => {
      if (u.name) names.add(u.name.trim());
    });
    const entityCfo = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (entityCfo) names.add(entityCfo);
    (compliances || []).forEach((c) => {
      if (c.assignedTo) names.add(c.assignedTo.trim());
      (c.subtasks || []).forEach((st) => {
        if (st.assignedTo) names.add(st.assignedTo.trim());
      });
    });
    return Array.from(names);
  }, [userAccounts, clientProfile, compliances]);

  const [showHidden, setShowHidden] = useState<boolean>(false);
  const hiddenCompliancesCount = useMemo(
    () => (rawCompliances || []).filter((c) => c.isHidden).length,
    [rawCompliances],
  );
  const activeCompliancesSource = useMemo(
    () => (showHidden && role === "cfo" ? rawCompliances || compliances : compliances),
    [showHidden, role, rawCompliances, compliances],
  );

  const [selectedPeriodicity, setSelectedPeriodicity] = useState<PeriodicityFilter>("ALL");
  const [viewLayout, setViewLayout] = useState<"grouped" | "unified">("grouped");
  const [rowDensity, setRowDensity] = useState<"compact" | "standard">("compact");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Compliances which are not due within 1-2 months and not in active pipeline are hidden by default
  const [hideFarFutureCompliances, setHideFarFutureCompliances] = useState<boolean>(true);

  // Sync initialCategory if passed
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Set of expanded compliance IDs for inline subtasks
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set((compliances || []).map((c) => c.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Count of compliances that are currently distant (not due within 1-2 months & not in pipeline)
  const distantFutureCount = useMemo(() => {
    const allBase = (activeCompliancesSource || []).filter((c) =>
      selectedComplianceMonth === "ALL"
        ? true
        : isComplianceInMonth(c, selectedComplianceMonth, {
            showEarlierCompleted: !autoHideEarlierCompleted,
            showEarlierPending: true,
          }),
    );
    return allBase.filter((c) => !isComplianceDueOrInPipeline(c, 60)).length;
  }, [activeCompliancesSource, selectedComplianceMonth, autoHideEarlierCompleted]);

  // Scoped compliances respecting selected calendar cycle, 1-2 month pipeline rule, and earlier completed auto-hide
  const monthScopedCompliances = useMemo(() => {
    const raw = (activeCompliancesSource || []).filter((c) =>
      selectedComplianceMonth === "ALL"
        ? true
        : isComplianceInMonth(c, selectedComplianceMonth, {
            showEarlierCompleted: !autoHideEarlierCompleted,
            showEarlierPending: true,
          }),
    );

    // If 1-2 month filter is disabled or user selected NOT_DUE status explicitly, keep all
    if (!hideFarFutureCompliances || selectedStatus === "NOT_DUE") {
      return raw;
    }

    // By default, hide obligations that are not due within 1-2 months and not yet in active pipeline.
    // If the user has typed an explicit search query, allow matching distant items to appear!
    const hasSearch = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase().trim();

    return raw.filter((c) => {
      if (isComplianceDueOrInPipeline(c, 60)) return true;
      if (
        hasSearch &&
        (c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.period && c.period.toLowerCase().includes(q)))
      ) {
        return true;
      }
      return false;
    });
  }, [
    activeCompliancesSource,
    selectedComplianceMonth,
    autoHideEarlierCompleted,
    hideFarFutureCompliances,
    selectedStatus,
    searchQuery,
  ]);

  // Segregate compliances into Monthly, Yearly, Others scoped to calendar cycle
  const segregatedAll = useMemo(
    () => segregateCompliances(monthScopedCompliances || []),
    [monthScopedCompliances],
  );
  const monthlyStats = useMemo(
    () => calculateGroupStats(segregatedAll.monthly),
    [segregatedAll.monthly],
  );
  const yearlyStats = useMemo(
    () => calculateGroupStats(segregatedAll.yearly),
    [segregatedAll.yearly],
  );
  const othersStats = useMemo(
    () => calculateGroupStats(segregatedAll.others),
    [segregatedAll.others],
  );

  // 4-Color Status Stats across active month scope
  const totalCount = monthScopedCompliances.length;
  const completedCount = monthScopedCompliances.filter(
    (c) => getComplianceFourColorStatus(c) === "completed" || isComplianceFiled(c),
  ).length;
  const inProcessCount = monthScopedCompliances.filter(
    (c) => getComplianceFourColorStatus(c) === "in_process",
  ).length;
  const overdueCount = monthScopedCompliances.filter(
    (c) => getComplianceFourColorStatus(c) === "overdue",
  ).length;
  const notDueCount = monthScopedCompliances.filter(
    (c) => getComplianceFourColorStatus(c) === "not_due",
  ).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter single compliance item against active query, category, status, and calendar
  const matchesBaseFilters = useCallback(
    (c: ComplianceItem): boolean => {
      if (!c) return false;
      const subtasks = c.subtasks || [];

      // 1. Calendar cycle filter (e.g. "2026-10" vs "2026-09" vs "ALL")
      if (
        selectedComplianceMonth !== "ALL" &&
        !isComplianceInMonth(c, selectedComplianceMonth, {
          showEarlierCompleted: !autoHideEarlierCompleted,
          showEarlierPending: true,
        })
      ) {
        return false;
      }

      // 2. Hide completed filings filter (unless user explicitly filtered by COMPLETED)
      const itemStatus = getComplianceFourColorStatus(c);
      const isFiled = isComplianceFiled(c) || itemStatus === "completed";
      if (hideCompletedCompliances && selectedStatus !== "COMPLETED" && isFiled) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.applicability.toLowerCase().includes(q) ||
          c.penaltyClause.toLowerCase().includes(q) ||
          (c.cfoRemarks && c.cfoRemarks.toLowerCase().includes(q)) ||
          (c.clientRemarks && c.clientRemarks.toLowerCase().includes(q)) ||
          (c.assignedTo && c.assignedTo.toLowerCase().includes(q)) ||
          subtasks.some(
            (s) =>
              s && (s.title.toLowerCase().includes(q) || s.assignedTo.toLowerCase().includes(q)),
          );
        if (!match) return false;
      }

      if (selectedCategory !== "ALL" && c.category !== selectedCategory) return false;

      if (selectedPersonFilter !== "ALL") {
        const isOwner = c.assignedTo === selectedPersonFilter;
        const isSubtaskAssignee = subtasks.some((s) => s && s.assignedTo === selectedPersonFilter);
        if (!isOwner && !isSubtaskAssignee) return false;
      }

      if (selectedStatus === "COMPLETED" && itemStatus !== "completed") return false;
      if (selectedStatus === "IN_PROGRESS" && itemStatus !== "in_process") return false;
      if (selectedStatus === "OVERDUE" && itemStatus !== "overdue") return false;
      if (selectedStatus === "NOT_DUE" && itemStatus !== "not_due") return false;
      if (selectedStatus === "CFO_PENDING") {
        const s = c.subtasks || [];
        const isCfoPending = s[0]?.status === "completed" && s[1]?.status === "pending";
        if (!isCfoPending) return false;
      }

      // 3. Hide far-future compliances not in active pipeline (visible only 1-2 months before)
      if (
        hideFarFutureCompliances &&
        selectedStatus !== "NOT_DUE" &&
        !searchQuery.trim()
      ) {
        if (!isComplianceDueOrInPipeline(c, 60)) {
          return false;
        }
      }

      return true;
    },
    [
      searchQuery,
      selectedCategory,
      selectedPersonFilter,
      selectedStatus,
      selectedComplianceMonth,
      hideCompletedCompliances,
      autoHideEarlierCompleted,
      hideFarFutureCompliances,
    ],
  );

  // Full filtered list respecting selectedPeriodicity tab (Priority sorted so Critical/Overdue/Past Months remain on top)
  const filtered = useMemo(() => {
    const raw = (monthScopedCompliances || []).filter((c) => {
      if (!matchesBaseFilters(c)) return false;

      if (
        selectedPeriodicity === "MONTHLY" &&
        classifyCompliancePeriodicity(c.frequency) !== "monthly"
      ) {
        return false;
      }
      if (
        selectedPeriodicity === "YEARLY" &&
        classifyCompliancePeriodicity(c.frequency) !== "yearly"
      ) {
        return false;
      }
      if (
        selectedPeriodicity === "OTHERS" &&
        classifyCompliancePeriodicity(c.frequency) !== "others"
      ) {
        return false;
      }

      return true;
    });
    return sortCompliancesByUrgencyAndPastMonths(raw);
  }, [monthScopedCompliances, matchesBaseFilters, selectedPeriodicity]);

  // Filtered lists for each segregated group (for grouped view) - Priority sorted so Critical, Overdue & Past Months remain on top
  const monthlyFiltered = useMemo(
    () => sortCompliancesByUrgencyAndPastMonths(segregatedAll.monthly.filter(matchesBaseFilters)),
    [segregatedAll.monthly, matchesBaseFilters],
  );
  const yearlyFiltered = useMemo(
    () => sortCompliancesByUrgencyAndPastMonths(segregatedAll.yearly.filter(matchesBaseFilters)),
    [segregatedAll.yearly, matchesBaseFilters],
  );
  const othersFiltered = useMemo(
    () => sortCompliancesByUrgencyAndPastMonths(segregatedAll.others.filter(matchesBaseFilters)),
    [segregatedAll.others, matchesBaseFilters],
  );

  // Check if an item is Critical, Delayed/Overdue, or a Past Month Pendency
  const isUrgentOrPastMonth = useCallback((c: ComplianceItem): boolean => {
    const status = getComplianceFourColorStatus(c);
    const isFiled = isComplianceFiled(c) || status === "completed";
    if (isFiled) return false;
    const days = daysUntilDue(c);
    const isOverdue =
      status === "overdue" ||
      (days !== null && days < 0) ||
      Boolean(c.delayDays && c.delayDays > 0);
    const currentKey = getCurrentMonthKey();
    const isPastMonth = Boolean(
      c.isEarlierPending ||
      c.timelineSection === "earlier_pending" ||
      (c.cycleMonth && c.cycleMonth < currentKey),
    );
    return isOverdue || isPastMonth || c.criticality === "Critical" || c.criticality === "High";
  }, []);

  const monthlyUrgentCount = useMemo(
    () => monthlyFiltered.filter(isUrgentOrPastMonth).length,
    [monthlyFiltered, isUrgentOrPastMonth],
  );
  const yearlyUrgentCount = useMemo(
    () => yearlyFiltered.filter(isUrgentOrPastMonth).length,
    [yearlyFiltered, isUrgentOrPastMonth],
  );
  const othersUrgentCount = useMemo(
    () => othersFiltered.filter(isUrgentOrPastMonth).length,
    [othersFiltered, isUrgentOrPastMonth],
  );
  const filteredUrgentCount = useMemo(
    () => filtered.filter(isUrgentOrPastMonth).length,
    [filtered, isUrgentOrPastMonth],
  );

  const exportCSV = () => {
    const headers = [
      "No",
      "Compliance / Form",
      "Periodicity Group",
      "Frequency",
      "Category",
      "Compliance Owner",
      "Statutory Due Date",
      "Status",
      "Stage 1 (Assignee / Duration)",
      "Stage 2 (Assignee / Duration)",
      "Stage 3 (Assignee / Duration)",
      "Proof Document",
      "CFO Remarks",
      "Client Remarks",
    ];

    const rows = filtered.map((c, index) => {
      const sub = c.subtasks || [];
      const itemStatus = getComplianceFourColorStatus(c);
      const proofDoc = c.completionProofDoc?.fileName || c.completionProofDocs?.[0]?.fileName || "";
      const pBadge = getCompliancePeriodicityBadge(c.frequency);
      return [
        index + 1,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${pBadge.text}"`,
        `"${c.frequency}"`,
        `"${c.category}"`,
        `"${c.assignedTo || sub[0]?.assignedTo || "Unassigned"}"`,
        `"${c.statutoryDueDate}"`,
        itemStatus,
        `"${sub[0]?.status || "pending"} - ${sub[0]?.assignedTo || ""} (${sub[0]?.durationDays ?? 3}d)"`,
        `"${sub[1]?.status || "pending"} - ${sub[1]?.assignedTo || ""} (${sub[1]?.durationDays ?? 2}d)"`,
        `"${sub[2]?.status || "pending"} - ${sub[2]?.assignedTo || ""} (${sub[2]?.durationDays ?? 2}d)"`,
        `"${proofDoc}"`,
        `"${(c.cfoRemarks || "").replace(/"/g, '""')}"`,
        `"${(c.clientRemarks || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `virtual_cfo_compliance_master_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable table rendering helper
  const renderComplianceTable = (items: ComplianceItem[], emptyMessage: string) => {
    const sortedItems = sortCompliancesByUrgencyAndPastMonths(items);
    if (sortedItems.length === 0) {
      return (
        <div className="py-12 px-4 text-center text-xs text-slate-500 bg-slate-50/50 rounded-b-xl border-t border-slate-200 space-y-2">
          <p className="font-medium text-slate-600">{emptyMessage}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHideFarFutureCompliances(false);
                if (hideCompletedCompliances) toggleHideCompletedCompliances();
                setSelectedComplianceMonth("ALL");
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
                setSelectedPeriodicity("ALL");
                setSelectedPersonFilter("ALL");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Show All Compliance Items (Clear Filters &amp; Distant Hide)</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
        {/* Border Status Guide Strip */}
        <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-700">Line Item Border:</span>
            <span className="flex items-center gap-1.5 font-medium text-rose-700">
              <span className="w-3.5 h-2.5 rounded-2xs border-2 border-rose-500 bg-rose-50 inline-block" />
              <span>Red = Overdue or Due</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-3.5 h-2.5 rounded-2xs border-2 border-emerald-500 bg-emerald-50 inline-block" />
              <span>Green = Completed</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="w-3.5 h-2.5 rounded-2xs border border-slate-200 bg-white inline-block" />
              <span>No Colour = Not Due</span>
            </span>
          </div>
          <span className="text-[10.5px] text-slate-500 font-mono">
            {sortedItems.length} {sortedItems.length === 1 ? "compliance item" : "compliance items"}
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-blue-800 text-white border-b-2 border-blue-950 uppercase tracking-wider text-[10.5px] font-bold shadow-xs">
            <tr>
              <th
                className={`px-2 ${rowDensity === "compact" ? "py-2" : "py-2.5"} w-12 text-center border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                No
              </th>
              <th
                className={`px-2.5 ${rowDensity === "compact" ? "py-2" : "py-2.5"} min-w-[220px] border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                Compliance / Form
              </th>
              <th
                className={`px-2.5 ${rowDensity === "compact" ? "py-2" : "py-2.5"} min-w-[125px] border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                Statutory Due Date
              </th>
              <th
                className={`px-2.5 ${rowDensity === "compact" ? "py-2" : "py-2.5"} min-w-[200px] border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                Subtasks &amp; Bottleneck
              </th>
              <th
                className={`px-2.5 ${rowDensity === "compact" ? "py-2" : "py-2.5"} min-w-[110px] border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                Proof of Filing
              </th>
              <th
                className={`px-2.5 ${rowDensity === "compact" ? "py-2" : "py-2.5"} min-w-[85px] border-b-2 border-blue-950 font-bold text-white tracking-wider`}
              >
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((comp, index) => {
              const isExpanded = expandedIds.has(comp.id);
              const borderItem = getComplianceLineItemBorder(comp, isExpanded);
              const hasProof =
                !!comp.completionProofDoc ||
                !!(comp.completionProofDocs && comp.completionProofDocs.length > 0);
              const activeProof =
                comp.completionProofDoc ||
                (comp.completionProofDocs && comp.completionProofDocs[0]);

              const isCompactRow = rowDensity === "compact";

              return (
                <React.Fragment key={comp.id}>
                  {/* Primary Line Item Row - Border colored according to status */}
                  <tr
                    onClick={() => toggleExpand(comp.id)}
                    className={`${borderItem.trClasses} transition-colors cursor-pointer group`}
                  >
                    {/* No - intact and in serial */}
                    <td
                      className={`px-2 ${isCompactRow ? "py-1" : "py-2.5"} text-center font-mono font-bold text-slate-700 text-xs ${borderItem.tdLeftClasses}`}
                    >
                      {index + 1}
                    </td>

                    {/* Compliance / Form Name */}
                    <td className={`px-2.5 ${isCompactRow ? "py-1" : "py-2.5"} ${borderItem.tdMiddleClasses}`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight text-xs">
                            {comp.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                            {comp.category}
                          </span>
                          {comp.period && (
                            <span className="text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded leading-none">
                              {comp.period}
                            </span>
                          )}
                          {comp.arnOrChallanNo && (
                            <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold leading-none">
                              Filed ✓
                            </span>
                          )}
                          {comp.isHidden && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5 leading-none">
                              <EyeOff className="w-2.5 h-2.5" />
                              HIDDEN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Statutory Due Date */}
                    <td className={`px-2.5 ${isCompactRow ? "py-1" : "py-2.5"} whitespace-nowrap ${borderItem.tdMiddleClasses}`}>
                      <DueDateBadge item={comp} compact={true} showPrefix={false} />
                    </td>

                    {/* Small icons of each subtask indicating where task is stuck */}
                    <td
                      className={`px-2.5 ${isCompactRow ? "py-1" : "py-2.5"} ${borderItem.tdMiddleClasses}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ComplianceSubtaskProgressIcons compliance={comp} compact={isCompactRow} />
                    </td>

                    {/* Proof of Filing Column */}
                    <td
                      className={`px-2.5 ${isCompactRow ? "py-1" : "py-2.5"} whitespace-nowrap ${borderItem.tdMiddleClasses}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasProof && activeProof ? (
                        <button
                          type="button"
                          onClick={() => openComplianceProofView(comp, activeProof)}
                          className="group/proof flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold transition-all cursor-pointer"
                          title={`Click to view filing proof: ${activeProof.fileName} (Ref: ${activeProof.arnOrChallanNo})`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-[9.5px] truncate max-w-[85px]">
                            {activeProof.arnOrChallanNo}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openComplianceProofModal(comp)}
                          className="group/upload flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-[9.5px] font-medium transition-all cursor-pointer"
                          title="Upload filing acknowledgement / ARN to complete compliance"
                        >
                          <UploadCloud className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>Upload Proof</span>
                        </button>
                      )}
                    </td>

                    {/* Remarks & Admin Visibility Control */}
                    <td
                      className={`px-2.5 ${isCompactRow ? "py-1" : "py-2.5"} whitespace-nowrap ${borderItem.tdRightClasses}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {comp.cfoRemarks && (
                            <span
                              title={`CFO: ${comp.cfoRemarks}`}
                              className="px-1 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-0.5"
                            >
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>CFO</span>
                            </span>
                          )}
                          {comp.clientRemarks && (
                            <span
                              title={`Client: ${comp.clientRemarks}`}
                              className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-0.5"
                            >
                              <Building className="w-2.5 h-2.5" />
                              <span>Client</span>
                            </span>
                          )}
                          {!comp.cfoRemarks && !comp.clientRemarks && (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => openReminderPreviewForItem(comp, "compliance")}
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-0.5"
                              title="Send / Preview Mail & WhatsApp Reminder (with CC to CFO & Client)"
                            >
                              <Bell className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Remind</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingComplianceItem(comp)}
                              className="px-1 py-0.2 rounded text-[9px] font-semibold bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-0.5"
                              title="Admin: Assign compliance owner, assign subtasks to different persons & fix subtask durations"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Assign</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleItemVisibility("compliance", comp.id)}
                              className={`px-1 py-0.2 rounded text-[9px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5 ${
                                comp.isHidden
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-slate-100/80 text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                              }`}
                              title={
                                comp.isHidden
                                  ? "Unhide Compliance Item"
                                  : "Hide Compliance Item (Keep for future without deleting)"
                              }
                            >
                              {comp.isHidden ? (
                                <>
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Unhide</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>Hide</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* INLINE EXPANDED SUBTASK WINDOW */}
                  {isExpanded && (
                    <tr className={`${borderItem.expandedTrClasses} transition-colors`}>
                      <td colSpan={6} className={`py-2.5 px-3 sm:px-5 ${borderItem.expandedTdClasses}`}>
                        <div className="ml-4 sm:ml-10 lg:ml-14 mr-2 sm:mr-6 lg:mr-8 max-w-5xl">
                          <ComplianceInlineDetail
                            compliance={comp}
                            onClose={() => toggleExpand(comp.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 0. Automated Statutory Calendar Engine & Historical Switcher */}
      <ComplianceCalendarBar
        totalCompletedCount={completedCount}
        totalActiveCount={totalCount - completedCount}
        earlierPendingCount={monthScopedCompliances.filter((c) => c.isEarlierPending).length}
        earlierCompletedCount={rawCompliances.filter((c) => c.isEarlierCompleted).length}
      />

      {/* Executive KPI Header */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Statutory Compliance Master
            </h1>
            <span className="text-xs text-slate-400 font-mono">({totalCount})</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => openReminderCenter("compliance")}
              className="text-xs text-indigo-200 hover:text-white font-bold px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Automated Statutory Reminders (Mail & WhatsApp with CC to CFO and Client)"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Due / Overdue Reminders</span>
              {complianceRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold">
                  {complianceRemindersCount}
                </span>
              )}
            </button>
            <button
              onClick={expandAll}
              className="text-xs text-slate-300 hover:text-white font-medium px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Maximize2 className="w-3 h-3 text-slate-400" />
              <span>Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-slate-300 hover:text-white font-medium px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Minimize2 className="w-3 h-3 text-slate-400" />
              <span>Collapse</span>
            </button>
            <a
              href="/exports/compliance_master.csv"
              download="compliance_master.csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/50 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-2xs"
              title="Download Compliance Master CSV (35 statutory rules, 15 columns) for public.compliance_master"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Master CSV (35)</span>
            </a>
            <a
              href="/exports/compliance_items.csv"
              download="compliance_items.csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-400/50 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer shadow-2xs"
              title="Download Active Compliance Items CSV (105 items across all 3 companies) for public.compliance_items"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>Compliance Items CSV (105)</span>
            </a>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Export currently filtered company compliances"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Current View CSV</span>
            </button>
          </div>
        </div>

        {/* 4-Color Status Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Completed */}
          <div
            onClick={() =>
              setSelectedStatus((prev) => (prev === "COMPLETED" ? "ALL" : "COMPLETED"))
            }
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
              selectedStatus === "COMPLETED"
                ? "bg-slate-800 ring-2 ring-emerald-400/80 border-emerald-400"
                : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Completed
              </span>
              <span className="text-xs font-bold font-mono text-emerald-300">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{completionPercentage}%</div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 2: In Process */}
          <div
            onClick={() =>
              setSelectedStatus((prev) => (prev === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS"))
            }
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
              selectedStatus === "IN_PROGRESS"
                ? "bg-slate-800 ring-2 ring-amber-400/80 border-amber-400"
                : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                In Process
              </span>
              <span className="text-[10px] text-amber-400 font-medium">Active</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{inProcessCount}</div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? Math.min(100, Math.round((inProcessCount / totalCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Card 3: Overdue */}
          <div
            onClick={() => setSelectedStatus((prev) => (prev === "OVERDUE" ? "ALL" : "OVERDUE"))}
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
              selectedStatus === "OVERDUE"
                ? "bg-slate-800 ring-2 ring-rose-400/80 border-rose-400"
                : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Overdue
              </span>
              <span className="text-[10px] text-rose-400 font-medium">Attention</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{overdueCount}</div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-400 transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? Math.min(100, Math.round((overdueCount / totalCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Card 4: Scheduled / Ahead */}
          <div
            onClick={() => setSelectedStatus((prev) => (prev === "NOT_DUE" ? "ALL" : "NOT_DUE"))}
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
              selectedStatus === "NOT_DUE"
                ? "bg-slate-800 ring-2 ring-sky-400/80 border-sky-400"
                : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Scheduled
              </span>
              <span className="text-[10px] text-sky-400 font-medium">Upcoming</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{notDueCount}</div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? Math.min(100, Math.round((notDueCount / totalCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Periodicity & Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1">
          {/* Segment 1: All Compliances */}
          <div
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedPeriodicity("ALL");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedPeriodicity === "ALL" && selectedCategory !== "ASSIGNED_TASKS"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">All Obligations</span>
              <span className="text-sm font-bold font-mono">{totalCount}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-80">
              <span>
                {completedCount}/{totalCount} Done
              </span>
              <span className="font-mono font-semibold">{completionPercentage}%</span>
            </div>
          </div>

          {/* Segment 2: Regular Monthly Compliances */}
          <div
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedPeriodicity("MONTHLY");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedPeriodicity === "MONTHLY" && selectedCategory !== "ASSIGNED_TASKS"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-800 border-slate-200/90 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Monthly</span>
              <span className="text-sm font-bold font-mono">{monthlyStats.total}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-80">
              <span>
                {monthlyStats.completed}/{monthlyStats.total} Done
              </span>
              <span className="font-mono font-semibold">{monthlyStats.completionPercentage}%</span>
            </div>
          </div>

          {/* Segment 3: Yearly Compliances */}
          <div
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedPeriodicity("YEARLY");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedPeriodicity === "YEARLY" && selectedCategory !== "ASSIGNED_TASKS"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-800 border-slate-200/90 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Yearly / Annual</span>
              <span className="text-sm font-bold font-mono">{yearlyStats.total}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-80">
              <span>
                {yearlyStats.completed}/{yearlyStats.total} Filed
              </span>
              <span className="font-mono font-semibold">{yearlyStats.completionPercentage}%</span>
            </div>
          </div>

          {/* Segment 4: Other Compliances */}
          <div
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedPeriodicity("OTHERS");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedPeriodicity === "OTHERS" && selectedCategory !== "ASSIGNED_TASKS"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-800 border-slate-200/90 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Quarterly / Other</span>
              <span className="text-sm font-bold font-mono">{othersStats.total}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-80">
              <span>
                {othersStats.completed}/{othersStats.total} Done
              </span>
              <span className="font-mono font-semibold">{othersStats.completionPercentage}%</span>
            </div>
          </div>

          {/* Segment 5: Assigned Tasks */}
          <div
            onClick={() => {
              setSelectedCategory("ASSIGNED_TASKS");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategory === "ASSIGNED_TASKS"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-800 border-slate-200/90 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Assigned Tasks</span>
              <span className="text-sm font-bold font-mono">{(actionFlowTasks || []).length}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] opacity-80">
              <span>
                {(actionFlowTasks || []).filter((t) => t.status === "completed").length} Done
              </span>
              <span>Action Tracker</span>
            </div>
          </div>
        </div>

        {/* View Layout Toggle: Grouped Sections vs Unified Table */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto shrink-0">
          <button
            onClick={() => setViewLayout("grouped")}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewLayout === "grouped"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Grouped</span>
          </button>
          <button
            onClick={() => setViewLayout("unified")}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewLayout === "unified"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Unified</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by form name, category, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Category & Status Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="ASSIGNED_TASKS">
                ⚡ Assigned Tasks (Status Updates & Assignee Remarks)
              </option>
              <option value="GST">GST</option>
              <option value="TDS / TCS">TDS / TCS</option>
              <option value="Income Tax">Income Tax</option>
              <option value="ROC / MCA">ROC / MCA</option>
              <option value="PF / ESI">PF / ESI</option>
              <option value="Professional Tax & State">PT & State</option>
            </select>

            <select
              value={selectedPersonFilter}
              onChange={(e) => setSelectedPersonFilter(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs bg-white text-slate-700 font-medium cursor-pointer"
              title="Filter by Compliance Owner or Subtask Assignee"
            >
              <option value="ALL">All Assigned Persons</option>
              {assignablePersons.map((person) => (
                <option key={person} value={person}>
                  👤 {person}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">🟢 Completed (Filed & Proof Attached)</option>
              <option value="IN_PROGRESS">🟠 In Process</option>
              <option value="OVERDUE">🔴 Overdue</option>
              <option value="NOT_DUE">⚪ Scheduled / Ahead</option>
              <option value="CFO_PENDING">Awaiting CFO Review</option>
            </select>

            {/* Auto-Hide Earlier Completed Compliances Toggle */}
            <button
              type="button"
              onClick={toggleAutoHideEarlierCompleted}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                autoHideEarlierCompleted
                  ? "bg-indigo-50 text-indigo-900 border-indigo-200 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title={
                autoHideEarlierCompleted
                  ? "Earlier completed filings (e.g. Sep GSTR-1, TDS 281) are auto-hidden. Click to show all earlier completed."
                  : "Showing earlier completed compliances. Click to auto-hide earlier completed."
              }
            >
              {autoHideEarlierCompleted ? (
                <>
                  <Archive className="w-3 h-3 text-indigo-600" />
                  <span>Earlier Completed Hidden</span>
                </>
              ) : (
                <>
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Show Earlier Completed</span>
                </>
              )}
            </button>

            {/* Quick Hide Completed Toggle */}
            <button
              type="button"
              onClick={toggleHideCompletedCompliances}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                hideCompletedCompliances
                  ? "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title={
                hideCompletedCompliances
                  ? "Click to show completed compliances"
                  : "Click to hide completed compliances"
              }
            >
              {hideCompletedCompliances ? (
                <>
                  <EyeOff className="w-3 h-3 text-amber-700" />
                  <span>Completed Hidden ({completedCount})</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>Hide Completed</span>
                </>
              )}
            </button>

            {/* Pipeline 1-2 Month Visibility Toggle */}
            <button
              type="button"
              onClick={() => setHideFarFutureCompliances((prev) => !prev)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                hideFarFutureCompliances
                  ? "bg-indigo-50 text-indigo-900 border-indigo-300 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title={
                hideFarFutureCompliances
                  ? "Only showing compliances due within 1-2 months or in active pipeline. Click to show all distant obligations."
                  : "Showing all statutory obligations including far future. Click to hide compliances not due within 1-2 months."
              }
            >
              {hideFarFutureCompliances ? (
                <>
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>Pipeline (1–2 Mo.) · {distantFutureCount} Far Hidden</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Showing All ({distantFutureCount} Far Visible)</span>
                </>
              )}
            </button>

            {role === "cfo" && (
              <button
                type="button"
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  showHidden
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                title="Show or hide archived/hidden compliance items"
              >
                {showHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>
                  {showHidden ? "Showing Hidden" : "Hidden"} ({hiddenCompliancesCount})
                </span>
              </button>
            )}

            {(selectedCategory !== "ALL" ||
              selectedPersonFilter !== "ALL" ||
              selectedStatus !== "ALL" ||
              selectedPeriodicity !== "ALL" ||
              searchQuery.trim()) && (
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedPersonFilter("ALL");
                  setSelectedStatus("ALL");
                  setSelectedPeriodicity("ALL");
                  setSearchQuery("");
                }}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                title="Reset active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informative banner when distant future compliances not in pipeline are hidden */}
      {hideFarFutureCompliances && distantFutureCount > 0 && selectedStatus !== "NOT_DUE" && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50/70 border border-indigo-200/90 rounded-lg text-xs text-indigo-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              <strong>
                {distantFutureCount} distant statutory {distantFutureCount === 1 ? "obligation is" : "obligations are"} hidden:
              </strong>{" "}
              Not due within next 1–2 months and not yet in pipeline. They will automatically become visible 1–2 months before their statutory due date.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHideFarFutureCompliances(false)}
            className="font-semibold underline text-indigo-700 hover:text-indigo-900 cursor-pointer text-xs shrink-0 ml-3"
          >
            Show All Distant Obligations
          </button>
        </div>
      )}

      {/* Informative banner when completed items are hidden */}
      {hideCompletedCompliances && completedCount > 0 && selectedStatus !== "COMPLETED" && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50/80 border border-amber-200/90 rounded-lg text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>
                {completedCount} completed {completedCount === 1 ? "filing is" : "filings are"}{" "}
                hidden
              </strong>{" "}
              from this active view to focus on pending workflows.
            </span>
          </div>
          <button
            type="button"
            onClick={toggleHideCompletedCompliances}
            className="font-semibold underline text-amber-950 hover:text-amber-800 cursor-pointer text-xs"
          >
            Show All Completed Filings
          </button>
        </div>
      )}

      {/* CONTENT PRESENTATION: ASSIGNED TASKS OR GROUPED SECTIONS OR UNIFIED TABLE */}
      {selectedCategory === "ASSIGNED_TASKS" ? (
        <ComplianceAssignedTasksView />
      ) : viewLayout === "grouped" && selectedPeriodicity === "ALL" ? (
        <div className="space-y-5">
          {/* SECTION 1: REGULAR MONTHLY COMPLIANCES */}
          <div className="bg-white rounded-xl border border-black/20 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-black/20 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  1. Regular Monthly Compliances
                </h3>
                <span className="text-xs text-slate-500 font-mono">({monthlyFiltered.length})</span>
                {monthlyUrgentCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{monthlyUrgentCount} Critical / Overdue on Top</span>
                  </span>
                )}
              </div>

              <span className="text-xs font-mono font-semibold text-slate-700">
                {monthlyStats.completed}/{monthlyStats.total} Completed (
                {monthlyStats.completionPercentage}%)
              </span>
            </div>

            {renderComplianceTable(
              monthlyFiltered,
              "No Regular Monthly compliance obligations match the active filters.",
            )}
          </div>

          {/* SECTION 2: YEARLY COMPLIANCES */}
          <div className="bg-white rounded-xl border border-black/20 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-black/20 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  2. Yearly / Annual Compliances
                </h3>
                <span className="text-xs text-slate-500 font-mono">({yearlyFiltered.length})</span>
                {yearlyUrgentCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{yearlyUrgentCount} Critical / Overdue on Top</span>
                  </span>
                )}
              </div>

              <span className="text-xs font-mono font-semibold text-slate-700">
                {yearlyStats.completed}/{yearlyStats.total} Filed (
                {yearlyStats.completionPercentage}%)
              </span>
            </div>

            {renderComplianceTable(
              yearlyFiltered,
              "No Yearly compliance obligations match the active filters.",
            )}
          </div>

          {/* SECTION 3: OTHER COMPLIANCES */}
          <div className="bg-white rounded-xl border border-black/20 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-black/20 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  3. Quarterly &amp; Event-Based Compliances
                </h3>
                <span className="text-xs text-slate-500 font-mono">({othersFiltered.length})</span>
                {othersUrgentCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{othersUrgentCount} Critical / Overdue on Top</span>
                  </span>
                )}
              </div>

              <span className="text-xs font-mono font-semibold text-slate-700">
                {othersStats.completed}/{othersStats.total} Completed (
                {othersStats.completionPercentage}%)
              </span>
            </div>

            {renderComplianceTable(
              othersFiltered,
              "No Other compliance obligations match the active filters.",
            )}
          </div>
        </div>
      ) : (
        /* SINGLE UNIFIED TABLE OR TARGETED SEGREGATED TAB TABLE */
        <div className="bg-white rounded-xl border border-black/20 shadow-xs overflow-hidden">
          {selectedPeriodicity !== "ALL" && (
            <div
              className={`px-4 py-3 border-b border-black/20 flex items-center justify-between flex-wrap gap-2 ${
                selectedPeriodicity === "MONTHLY"
                  ? "bg-blue-50/70 text-blue-950"
                  : selectedPeriodicity === "YEARLY"
                    ? "bg-purple-50/70 text-purple-950"
                    : "bg-amber-50/70 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm">
                  {selectedPeriodicity === "MONTHLY"
                    ? "Regular Monthly Statutory Compliances"
                    : selectedPeriodicity === "YEARLY"
                      ? "Yearly & Annual Statutory Compliances"
                      : "Other Periodic & Event-Based Compliances"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border border-slate-300">
                  {filtered.length} items displayed
                </span>
                {filteredUrgentCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{filteredUrgentCount} Critical / Overdue on Top</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPeriodicity("ALL")}
                className="text-[11px] font-semibold underline hover:opacity-80 cursor-pointer"
              >
                View All Compliances
              </button>
            </div>
          )}

          {renderComplianceTable(
            filtered,
            "No compliance obligations found matching the active search and filter criteria.",
          )}
        </div>
      )}

      {/* Admin Compliance Edit & Assignment Modal */}
      {editingComplianceItem && (
        <ComplianceEditModal
          compliance={editingComplianceItem}
          isOpen={!!editingComplianceItem}
          onClose={() => setEditingComplianceItem(null)}
          onSave={(updated) => {
            updateCompliance(updated);
            showToast(`Updated compliance "${updated.name}" assignments & subtask durations.`);
            setEditingComplianceItem(null);
          }}
        />
      )}
    </div>
  );
};
