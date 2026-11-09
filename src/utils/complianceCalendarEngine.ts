import { ComplianceItem, SubTask } from "../types";
import { isComplianceFiled, parseDeadlineDateToIso, daysUntilDue } from "./dueDate";
import { getComplianceFourColorStatus } from "./statusColors";

export interface ComplianceMonthOption {
  key: string; // e.g. "2026-10"
  label: string; // e.g. "October 2026"
  shortLabel: string; // e.g. "Oct 2026"
  periodLabel: string; // e.g. "Sep 2026 Filings"
  year: number;
  month: number; // 1-12
  isCurrent: boolean;
  filingCount?: number;
}

/**
 * Returns current month in "YYYY-MM" format.
 * Defaults to current system date (e.g. "2026-10")
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Standard list of compliance months available for calendar selection.
 * Automatically dynamically advances with real-time calendar date,
 * ensuring current month is highlighted, past cycles are archived, and
 * future rolling statutory months (at least 12-18 months) are accessible.
 */
export function getAvailableComplianceMonths(): ComplianceMonthOption[] {
  const currentKey = getCurrentMonthKey();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-12

  // Start from Sep 2026 to ensure historical filing records (Aug business filed in Sep) are accessible
  const startYear = Math.min(2026, curYear);
  const startMonth = 9;

  // Extend window at least 12-18 months into the future
  const maxYear = curYear + 1;
  const maxMonth = 3; // Through at least March of next year (Financial Year End)

  const months: ComplianceMonthOption[] = [];
  let y = startYear;
  let m = startMonth;

  while (y < maxYear || (y === maxYear && m <= maxMonth)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const shortM = MONTH_NAMES_SHORT[m - 1];
    const fullM = MONTH_NAMES_FULL[m - 1];
    const prevM = MONTH_NAMES_SHORT[(m - 2 + 12) % 12];
    const prevYear = m === 1 ? y - 1 : y;

    const isCurrent = key === currentKey;
    const isPast = key < currentKey;

    months.push({
      key,
      label: `${fullM} ${y}`,
      shortLabel: `${shortM} ${y}`,
      periodLabel: `${prevM} ${prevYear} Business Filings${isPast ? " (Archive)" : isCurrent ? " (Active Cycle)" : " (Upcoming)"}`,
      year: y,
      month: m,
      isCurrent,
    });

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  // Safety fallback if empty
  if (months.length === 0) {
    months.push({
      key: currentKey,
      label: `${MONTH_NAMES_FULL[curMonth - 1]} ${curYear}`,
      shortLabel: `${MONTH_NAMES_SHORT[curMonth - 1]} ${curYear}`,
      periodLabel: "Current Filings",
      year: curYear,
      month: curMonth,
      isCurrent: true,
    });
  }

  return months;
}

/**
 * Checks whether a compliance item is completed.
 * True if all subtasks done, or subtask 3 done, or has official ARN/challan and filing proof.
 */
export function isComplianceItemCompleted(item: ComplianceItem): boolean {
  if (!item) return false;
  if (isComplianceFiled(item)) return true;
  const statusLower = (item.status || "").toLowerCase();
  if (statusLower === "filed" || statusLower === "completed" || statusLower === "complied") return true;

  const sub = item.subtasks || [];
  if (sub.length > 0 && sub[sub.length - 1]?.status === "completed") return true;
  if (sub.length > 0 && sub.every((s) => s && s.status === "completed")) return true;
  if (
    item.arnOrChallanNo ||
    item.completionProofDoc ||
    Boolean((item as any).completionProofDocs && (item as any).completionProofDocs.length > 0)
  ) {
    return true;
  }

  return false;
}

/**
 * Derives the statutory cycle month key (e.g. "2026-10") for a compliance item.
 */
export function getItemCycleMonth(item: ComplianceItem): string {
  if (item.cycleMonth) return item.cycleMonth;

  // Check dueDates array
  if (item.dueDates && item.dueDates.length > 0 && item.dueDates[0]) {
    const parts = item.dueDates[0].split("-");
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  }

  // Check subtask 3 deadline
  const sub3Deadline = item.subtasks?.[2]?.deadline;
  if (sub3Deadline) {
    const iso = parseDeadlineDateToIso(sub3Deadline);
    if (iso) return iso.slice(0, 7);
  }

  // Check statutoryDueDate string for month name + year
  if (item.statutoryDueDate) {
    const text = item.statutoryDueDate.toLowerCase();
    for (let i = 0; i < 12; i++) {
      const shortM = MONTH_NAMES_SHORT[i].toLowerCase();
      const fullM = MONTH_NAMES_FULL[i].toLowerCase();
      if (text.includes(shortM) || text.includes(fullM)) {
        const yearMatch = item.statutoryDueDate.match(/20\d{2}/);
        const y = yearMatch ? yearMatch[0] : "2026";
        return `${y}-${String(i + 1).padStart(2, "0")}`;
      }
    }
  }

  return getCurrentMonthKey();
}

/**
 * Checks if a compliance item belongs to or should be displayed in a specific month cycle.
 * System rules:
 * - If targetMonthKey === "ALL", return true.
 * - Items belonging to the target month: always shown.
 * - Items from an EARLIER month (e.g. Sep 2026 when Oct 2026 is active):
 *   * Only PENDING earlier compliances are shown in the list.
 *   * COMPLETED earlier compliances are AUTO-HIDDEN by default.
 */
export function isComplianceInMonth(
  item: ComplianceItem,
  targetMonthKey: string,
  options?: { showEarlierCompleted?: boolean; showEarlierPending?: boolean },
): boolean {
  if (!item) return false;
  if (
    !targetMonthKey ||
    targetMonthKey === "ALL" ||
    targetMonthKey === "FY_ALL" ||
    targetMonthKey === "FY_2026_27"
  ) {
    if (item.isEarlierCompleted && options?.showEarlierCompleted !== true) {
      return false;
    }
    return true;
  }

  const currentKey = getCurrentMonthKey();
  let resolvedKey = targetMonthKey;
  if (targetMonthKey === "CURRENT_MONTH") {
    resolvedKey = currentKey;
  }

  if (targetMonthKey === "EARLIER_PENDING") {
    return Boolean(
      item.isEarlierPending ||
        item.timelineSection === "earlier_pending" ||
        (getItemCycleMonth(item) < currentKey && !isComplianceItemCompleted(item)),
    );
  }

  if (targetMonthKey === "PROSPECTIVE_FY") {
    return Boolean(
      item.timelineSection === "prospective_fy" ||
        getItemCycleMonth(item) > currentKey,
    );
  }

  const itemCycle = getItemCycleMonth(item);

  // 1. Direct match for target month
  if (itemCycle === resolvedKey) {
    return true;
  }

  // 2. Item is from an earlier cycle month (e.g. "2026-09" when target is "2026-10")
  if (itemCycle < resolvedKey) {
    const completed = isComplianceItemCompleted(item);
    if (!completed) {
      // Automatic rule: Only pending compliances of earlier months are shown
      return options?.showEarlierPending !== false; // default true
    } else {
      // Automatic rule: Completed compliances of previous months are auto-hidden
      return options?.showEarlierCompleted === true; // default false (hidden!)
    }
  }

  // 3. Item is from a future cycle: hide unless explicitly selected
  return false;
}

/**
 * Evaluates whether a statutory compliance is due within 1-2 months or is actively in the pipeline.
 * User requirement: "compliance which are not due or not in pipeline may be hidden . will be visible only 1-2 month before."
 *
 * Rules:
 * 1. Completed / Filed: Visible (subject to user's "hide completed" toggle).
 * 2. Overdue or Delayed: ALWAYS visible (urgent remediation required).
 * 3. In Active Pipeline:
 *    - Status is in_process
 *    - Any subtask is completed or in draft with notes
 *    - Progress > 0%
 *    - CFO Remarks or Client Remarks recorded
 * 4. Due within 1-2 months window:
 *    - Statutory due date is within 60 days (approx. 2 months) of reference date
 *    - Or cycle month is within 2 calendar months ahead of current month
 * 5. Event/continuous obligations:
 *    - "Daily", "Weekly", invoice/movement event-based
 *
 * All other items (> 60 days ahead, 0% progress, unstarted) are considered distant future
 * obligations and hidden until 1-2 months before their statutory due date.
 */
export function isComplianceDueOrInPipeline(
  item?: ComplianceItem | null,
  leadWindowDays: number = 60,
  referenceDate?: Date,
): boolean {
  if (!item) return false;

  // 1. Completed / Filed obligations
  if (isComplianceFiled(item) || isComplianceItemCompleted(item)) {
    return true;
  }
  const fourStatus = getComplianceFourColorStatus(item);
  if (fourStatus === "completed") {
    return true;
  }

  // 2. Overdue or carried-forward items from previous cycles
  if (item.isEarlierPending || item.timelineSection === "earlier_pending") {
    return true;
  }
  if (fourStatus === "overdue") {
    return true;
  }
  const days = daysUntilDue(item, referenceDate);
  if (days !== null && days < 0) {
    return true;
  }

  // 3. Actively in the pipeline (team draft begun, notes added, remarks present)
  if (fourStatus === "in_process") {
    return true;
  }
  if (item.progressPercentage && item.progressPercentage > 0) {
    return true;
  }
  const sub = item.subtasks || [];
  const hasStartedSubtask = sub.some(
    (s) => s && (s.status === "completed" || Boolean(s.notes && s.notes.trim().length > 0)),
  );
  if (hasStartedSubtask) {
    return true;
  }
  if (
    (item.cfoRemarks && item.cfoRemarks.trim().length > 0) ||
    (item.clientRemarks && item.clientRemarks.trim().length > 0)
  ) {
    return true;
  }

  // Continuous or operational items (e.g., E-Way bills, daily/weekly routines)
  const freqLower = (item.frequency || "").toLowerCase();
  if (
    freqLower.includes("daily") ||
    freqLower.includes("weekly") ||
    freqLower.includes("event") ||
    (item.statutoryDueDate &&
      (item.statutoryDueDate.toLowerCase().includes("invoice") ||
        item.statutoryDueDate.toLowerCase().includes("movement")))
  ) {
    return true;
  }

  // 4. Due within 1-2 months (~60 days) window
  if (days !== null) {
    return days <= leadWindowDays;
  }

  // Fallback: cycle month within 2 calendar months
  const cycleMonth = getItemCycleMonth(item);
  const currentKey = getCurrentMonthKey();
  if (!cycleMonth || cycleMonth <= currentKey) {
    return true;
  }

  const [curY, curM] = currentKey.split("-").map(Number);
  const [cycY, cycM] = cycleMonth.split("-").map(Number);
  const diffMonths = (cycY - curY) * 12 + (cycM - curM);

  return diffMonths <= 2;
}

/**
 * Dynamically builds the compliance list for the active month workspace.
 * Fulfills Virtual CFO compliance requirements:
 * 1. Automatic monthly regular compliances of existing month come in (Oct 2026 regular cycle).
 * 2. Only pending compliances of earlier months are carried forward and shown in the list.
 * 3. All other previous months completed compliances (e.g. Sep GSTR-1) are auto-hidden.
 * 4. Switching to Sep 2026 shows historical filing records with verified ARNs.
 * 5. Strict deduplication ensures no duplicate forms ever appear.
 */
export function buildRolledComplianceList(
  baseCompliances: ComplianceItem[],
  activeMonthKey: string = getCurrentMonthKey(),
  options?: { includeEarlierCompleted?: boolean },
): ComplianceItem[] {
  if (!baseCompliances || baseCompliances.length === 0) return [];

  if (activeMonthKey === "CURRENT_MONTH") {
    activeMonthKey = getCurrentMonthKey();
  }

  // When viewing historical September 2026:
  // Retain original base compliances with completed ARNs, deduplicated by ID
  if (activeMonthKey === "2026-09") {
    const seenIds = new Set<string>();
    const sepList: ComplianceItem[] = [];
    for (const item of baseCompliances) {
      if (!item) continue;
      const baseKey = (item.id || item.name).toLowerCase().replace(/-2026-\d{2}$/, "");
      if (seenIds.has(baseKey)) continue;
      seenIds.add(baseKey);

      sepList.push({
        ...item,
        cycleMonth: "2026-09",
      });
    }
    return sepList;
  }

  // When viewing ALL cycles or Full Financial Year pipeline:
  if (activeMonthKey === "ALL" || activeMonthKey === "FY_ALL" || activeMonthKey === "FY_2026_27") {
    return buildFinancialYearCompliancePipeline(baseCompliances, {
      includeEarlierCompleted: options?.includeEarlierCompleted,
    });
  }

  // Parse active target month (e.g. "2026-10" or "2026-11" or "2027-01")
  const [yearStr, monthStr] = activeMonthKey.split("-");
  const targetYear = parseInt(yearStr || "2026", 10);
  const targetMonth = parseInt(monthStr || "10", 10); // 1-12

  const prevMonthName = MONTH_NAMES_SHORT[(targetMonth - 2 + 12) % 12]; // "Sep" when target is Oct
  const prevMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const targetMonthName = MONTH_NAMES_SHORT[targetMonth - 1]; // "Oct"

  // 1. Separate baseCompliances: find any earlier-month PENDING compliances to carry forward
  const earlierPendingItems: ComplianceItem[] = [];
  const earlierCompletedItems: ComplianceItem[] = [];

  baseCompliances.forEach((item) => {
    const itemCycle = getItemCycleMonth(item);
    if (itemCycle < activeMonthKey) {
      const completed = isComplianceItemCompleted(item);
      if (!completed) {
        // Carry forward as pending compliance from earlier month
        earlierPendingItems.push({
          ...item,
          id: `${item.id}-carryover-${itemCycle}`,
          cycleMonth: itemCycle,
          isEarlierPending: true,
          status: "Pending",
          cfoRemarks:
            item.cfoRemarks ||
            `Pending carryover from ${itemCycle} cycle. Priority clearance required.`,
        });
      } else {
        earlierCompletedItems.push({
          ...item,
          cycleMonth: itemCycle,
          isEarlierCompleted: true,
        });
      }
    }
  });

  // 2. Generate active existing month regular compliances + statutory filings for activeMonthKey
  const rolledActiveItems: ComplianceItem[] = [];
  const processedKeys = new Set<string>();

  baseCompliances.forEach((item) => {
    const baseKey = (item.id || item.name)
      .toLowerCase()
      .replace(/-2026-\d{2}$/, "")
      .replace(/-carryover-.*$/, "");
    if (processedKeys.has(baseKey)) return;
    processedKeys.add(baseKey);

    const nameLower = (item.name || "").toLowerCase();
    const idLower = (item.id || "").toLowerCase();
    const freq = (item.frequency || "").toLowerCase();
    const isMonthly =
      freq.includes("month") ||
      idLower.startsWith("gst-1") ||
      idLower.startsWith("gst-2") ||
      idLower.startsWith("gst-3") ||
      idLower.startsWith("tds-11") ||
      idLower.startsWith("pf-29") ||
      idLower.startsWith("pf-30") ||
      idLower.startsWith("pf-31") ||
      idLower.startsWith("pt-33") ||
      nameLower.includes("gstr-1") ||
      nameLower.includes("gstr-3b") ||
      nameLower.includes("challan 281");

    const isUserModifiedThisCycle =
      Boolean((item as any)._userModifiedInCycle === activeMonthKey) ||
      (item.cycleMonth === activeMonthKey && Boolean((item as any)._userModified));

    // If item has been actively modified by user in this active cycle, preserve their changes
    if (isUserModifiedThisCycle) {
      rolledActiveItems.push({
        ...item,
        cycleMonth: activeMonthKey,
      });
      return;
    }

    // For non-monthly items (annual, quarterly, event-based): preserve if already filed/completed for this FY
    if (!isMonthly) {
      const isAlreadyDone =
        isComplianceItemCompleted(item) ||
        isComplianceFiled(item) ||
        Boolean((item as any).completionProofDoc) ||
        Boolean((item as any).arnOrChallanNo) ||
        item.status === "Filed" ||
        item.status === "Completed" ||
        item.status === "complied";

      if (isAlreadyDone) {
        rolledActiveItems.push({
          ...item,
          cycleMonth: item.cycleMonth || activeMonthKey,
        });
        return;
      }
    }

    // Case 1: GSTR-1 (Outward Supplies) - Guaranteed active regular monthly compliance
    if (idLower.includes("gst-1") || nameLower.startsWith("gstr-1")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-11`;
      rolledActiveItems.push({
        ...item,
        id: "gst-1",
        name: "GSTR-1 (Outward supplies)",
        category: "GST",
        frequency: "Monthly",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `11th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined, // Fresh for active month
        completionProofDoc: undefined, // Fresh for active month
        status: "In Progress",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `gst-1-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Compile sales register & invoice-wise data; upload to GST tool",
            stageName: "Team Draft",
            assignedTo: item.subtasks?.[0]?.assignedTo || "Pooja Sharma",
            assignedRole: item.subtasks?.[0]?.assignedRole || "Accounts Executive",
            deadline: `06 ${targetMonthName} ${targetYear}`,
            status: "in_progress",
            completedAt: undefined,
            completedBy: undefined,
            notes: `Extracting ${prevMonthName} ${prevMonthYear} sales vouchers and IRN e-invoices from ERP.`,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `gst-1-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "Reconcile with sales ledger & e-invoice/e-way bill data; CFO sign-off on draft",
            stageName: "CFO Review",
            assignedTo: item.subtasks?.[1]?.assignedTo || "Sudhakar",
            assignedRole: item.subtasks?.[1]?.assignedRole || "Virtual CFO",
            deadline: `09 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
            notes: "Pending final invoice extraction for CFO sign-off.",
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `gst-1-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "File GSTR-1 on GST portal; save ARN/acknowledgment",
            stageName: "Filing & Payment",
            assignedTo: item.subtasks?.[2]?.assignedTo || "Rahul Verma",
            assignedRole: item.subtasks?.[2]?.assignedRole || "Tax Associate",
            deadline: `11 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
            notes: "Scheduled for portal filing on approval.",
          },
        ] as any,
        cfoRemarks: `${prevMonthName} ${prevMonthYear} sales register matching in progress. Target filing date: 11 ${targetMonthName} ${targetYear}.`,
        clientRemarks: "Dispatches and e-way bill reconciliation in progress with billing team.",
      });
      return;
    }

    // Case 2: GSTR-3B (Summary return & tax payment)
    if (idLower.includes("gst-3") || nameLower.startsWith("gstr-3b")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-20`;
      rolledActiveItems.push({
        ...item,
        id: "gst-3",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `20th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `gst-3-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Compute output tax & reconcile ITC with GSTR-2B",
            stageName: "Team Draft",
            assignedTo: item.subtasks?.[0]?.assignedTo || "Rahul Verma",
            assignedRole: item.subtasks?.[0]?.assignedRole || "Tax Associate",
            deadline: `14 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
            notes: `Auto-drafted GSTR-2B download scheduled post 14th ${targetMonthName}.`,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `gst-3-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "CFO review of tax liability, ITC eligibility & cash/credit ledger utilisation",
            stageName: "CFO Review",
            assignedTo: item.subtasks?.[1]?.assignedTo || "Sudhakar",
            assignedRole: item.subtasks?.[1]?.assignedRole || "Virtual CFO",
            deadline: `17 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `gst-3-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "File return & pay tax via challan",
            stageName: "Filing & Payment",
            assignedTo: item.subtasks?.[2]?.assignedTo || "Rahul Verma",
            assignedRole: item.subtasks?.[2]?.assignedRole || "Tax Associate",
            deadline: `20 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
        ] as any,
        cfoRemarks: `Input tax credit matching scheduled after GSTR-2B generation. Payment planned for 19 ${targetMonthName}.`,
      });
      return;
    }

    // Case 3: TDS Payment (Challan 281)
    if (idLower.includes("tds-11") || nameLower.includes("challan 281")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-07`;
      rolledActiveItems.push({
        ...item,
        id: "tds-11",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `07th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "In Progress",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `tds-11-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Compute TDS from vouchers/salary/vendor payments",
            stageName: "Team Draft",
            assignedTo: item.subtasks?.[0]?.assignedTo || "Pooja Sharma",
            assignedRole: item.subtasks?.[0]?.assignedRole || "Sr. Accountant",
            deadline: `03 ${targetMonthName} ${targetYear}`,
            status: "in_process",
            completedAt: undefined,
            completedBy: undefined,
            notes: `${prevMonthName} ${prevMonthYear} salary and vendor TDS computations compiled.`,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `tds-11-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "CFO review of computation & rate applicability",
            stageName: "CFO Review",
            assignedTo: item.subtasks?.[1]?.assignedTo || "Sudhakar",
            assignedRole: item.subtasks?.[1]?.assignedRole || "Virtual CFO",
            deadline: `05 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `tds-11-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "Pay TDS challan & save receipt",
            stageName: "Filing & Payment",
            assignedTo: item.subtasks?.[2]?.assignedTo || "Rahul Verma",
            assignedRole: item.subtasks?.[2]?.assignedRole || "Tax Associate",
            deadline: `07 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
        ] as any,
        cfoRemarks: `TDS Challan 281 payment deadline: 07 ${targetMonthName} ${targetYear}. Liability verification pending.`,
      });
      return;
    }

    // Case 4: PF Payment
    if (idLower.includes("pf-29") || nameLower.includes("pf payment")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-15`;
      rolledActiveItems.push({
        ...item,
        id: "pf-29",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `15th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "In Progress",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `pf-29-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Compute PF contribution from payroll",
            stageName: "Team Draft",
            assignedTo: "Amit Patel",
            assignedRole: "Payroll Specialist",
            deadline: `08 ${targetMonthName} ${targetYear}`,
            status: "in_process",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `pf-29-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "CFO review of salary vs PF deduction",
            stageName: "CFO Review",
            assignedTo: "Sudhakar",
            assignedRole: "Virtual CFO",
            deadline: `12 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `pf-29-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "Pay via ECR portal",
            stageName: "Filing & Payment",
            assignedTo: "Amit Patel",
            assignedRole: "Payroll Specialist",
            deadline: `15 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
        ] as any,
      });
      return;
    }

    // Case 5: ESI Payment
    if (idLower.includes("pf-31") || nameLower.includes("esi payment")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-15`;
      rolledActiveItems.push({
        ...item,
        id: "pf-31",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `15th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "In Progress",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `pf-31-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Compute ESI contribution from payroll",
            stageName: "Team Draft",
            assignedTo: "Amit Patel",
            assignedRole: "Payroll Specialist",
            deadline: `08 ${targetMonthName} ${targetYear}`,
            status: "in_process",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `pf-31-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "CFO review",
            stageName: "CFO Review",
            assignedTo: "Sudhakar",
            assignedRole: "Virtual CFO",
            deadline: `12 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `pf-31-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "Pay via ESIC portal",
            stageName: "Filing & Payment",
            assignedTo: "Amit Patel",
            assignedRole: "Payroll Specialist",
            deadline: `15 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
            completedBy: undefined,
          },
        ] as any,
      });
      return;
    }

    // Case 6: IFF – Invoice Furnishing Facility
    if (idLower.includes("gst-2") || nameLower.startsWith("iff")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-13`;
      rolledActiveItems.push({
        ...item,
        id: "gst-2",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `13th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            deadline: `10 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[1] || {}),
            deadline: `12 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            deadline: `13 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
        ] as any,
      });
      return;
    }

    // Case 6B: PF Return (ECR)
    if (idLower.includes("pf-30") || nameLower.includes("pf return") || nameLower.includes("ecr")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-15`;
      rolledActiveItems.push({
        ...item,
        id: "pf-30",
        name: "PF Return (ECR)",
        category: "Labour & Payroll",
        frequency: "Monthly",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `15th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `pf-30-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Generate ECR text file from payroll register",
            stageName: "Team Draft",
            deadline: `10 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `pf-30-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "Validate ECR on EPFO Unified Portal",
            stageName: "CFO Review",
            deadline: `12 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `pf-30-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "Upload ECR and generate TRRN challan",
            stageName: "Filing & Payment",
            deadline: `15 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
        ] as any,
      });
      return;
    }

    // Case 6C: Professional Tax Payment & Return
    if (idLower.includes("pt-33") || nameLower.includes("professional tax")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-20`;
      rolledActiveItems.push({
        ...item,
        id: "pt-33",
        name: "Professional Tax Payment & Return",
        category: "Labour & Payroll",
        frequency: "Monthly",
        period: `${prevMonthName} ${prevMonthYear}`,
        statutoryDueDate: `20th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
        subtasks: [
          {
            ...(item.subtasks?.[0] || {}),
            id: `pt-33-st1-${activeMonthKey}`,
            subtaskNumber: 1,
            title: "Prepare PT liability schedule from state-wise employee headcount",
            stageName: "Team Draft",
            deadline: `15 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[1] || {}),
            id: `pt-33-st2-${activeMonthKey}`,
            subtaskNumber: 2,
            title: "CFO approval for state PT challan payment",
            stageName: "CFO Review",
            deadline: `18 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
          {
            ...(item.subtasks?.[2] || {}),
            id: `pt-33-st3-${activeMonthKey}`,
            subtaskNumber: 3,
            title: "Pay PT challan & file monthly PT return on state portal",
            stageName: "Filing & Payment",
            deadline: `20 ${targetMonthName} ${targetYear}`,
            status: "pending",
            completedAt: undefined,
          },
        ] as any,
      });
      return;
    }

    // Case 7: CMP-08 (Composition statement, Q2 due 18 Oct)
    if (idLower.includes("gst-4") || nameLower.includes("cmp-08")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-18`;
      rolledActiveItems.push({
        ...item,
        id: "gst-4",
        period: `Q2 (Jul - Sep ${targetYear})`,
        statutoryDueDate: `18th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
      });
      return;
    }

    // Case 8: ITC-04 (Half-yearly Job work statement due 25 Oct)
    if (idLower.includes("gst-7") || nameLower.includes("itc-04")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-25`;
      rolledActiveItems.push({
        ...item,
        id: "gst-7",
        period: `H1 (Apr - Sep ${targetYear})`,
        statutoryDueDate: `25th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
      });
      return;
    }

    // Case 9: Quarterly TDS Returns Form 24Q, 26Q, 27Q, 27EQ (due 31 Oct)
    if (
      nameLower.includes("form 24q") ||
      nameLower.includes("form 26q") ||
      nameLower.includes("form 27q") ||
      nameLower.includes("form 27eq")
    ) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-31`;
      rolledActiveItems.push({
        ...item,
        period: `Q2 (Jul - Sep ${targetYear})`,
        statutoryDueDate: `31st of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
      });
      return;
    }

    // Case 10: MCA AOC-4 (Financial Statements filing due 29/30 Oct)
    if (idLower.includes("roc-24") || nameLower.includes("aoc-4")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-29`;
      rolledActiveItems.push({
        ...item,
        id: "roc-24",
        period: `FY ${targetYear - 1}-${String(targetYear).slice(2)}`,
        statutoryDueDate: `29th of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "In Progress",
      });
      return;
    }

    // Case 11: MCA MSME-1 (Half-yearly MSME return due 31 Oct)
    if (idLower.includes("roc-27") || nameLower.includes("msme-1")) {
      const dueDateIso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-31`;
      rolledActiveItems.push({
        ...item,
        id: "roc-27",
        period: `Apr - Sep ${targetYear}`,
        statutoryDueDate: `31st of ${targetMonthName} ${targetYear}`,
        dueDates: [dueDateIso],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: "Pending",
      });
      return;
    }

    // Default for other monthly items: advance deadlines to current cycle month
    if (isMonthly) {
      const updatedDueDates = (item.dueDates || []).map((d) => {
        const parts = d.split("-");
        if (parts.length === 3) {
          return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${parts[2]}`;
        }
        return d;
      });

      rolledActiveItems.push({
        ...item,
        period: `${prevMonthName} ${prevMonthYear}`,
        dueDates:
          updatedDueDates.length > 0
            ? updatedDueDates
            : [`${targetYear}-${String(targetMonth).padStart(2, "0")}-20`],
        cycleMonth: activeMonthKey,
        arnOrChallanNo: undefined,
        completionProofDoc: undefined,
        status: item.status === "Filed" || item.status === "Completed" ? "Pending" : item.status || "Pending",
        subtasks: (item.subtasks || []).map((st) => ({
          ...st,
          id: `${st.id}-${activeMonthKey}`,
          status: "pending",
          completedAt: undefined,
          completedBy: undefined,
        })) as any,
      });
      return;
    }

    // For other yearly/quarterly compliances, retain with cycleMonth tag
    rolledActiveItems.push({
      ...item,
      cycleMonth: activeMonthKey,
    });
  });

  // Combine:
  // 1. Earlier pending items (carried forward so team doesn't miss them)
  // 2. Active month rolled compliances
  // 3. (Optional) Earlier completed items only if explicitly requested
  const resultList = [
    ...earlierPendingItems,
    ...rolledActiveItems,
    ...(options?.includeEarlierCompleted ? earlierCompletedItems : []),
  ];

  // Final deduplication pass by unique ID
  const finalSeen = new Set<string>();
  const finalUniqueList: ComplianceItem[] = [];
  for (const c of resultList) {
    if (!c) continue;
    if (finalSeen.has(c.id)) continue;
    finalSeen.add(c.id);
    finalUniqueList.push(c);
  }

  return finalUniqueList;
}

/**
 * Builds the complete Financial Year Statutory Compliance Pipeline.
 * Complies with user requirements:
 * 1. No monthwise segregation restricting view: shows the full annual continuum.
 * 2. TOP SECTION: Compliances pending from earlier months (pinned first with delay days and alert status).
 * 3. CURRENT MONTH SECTION: All active statutory compliances for the current active month.
 * 4. PROSPECTIVE FY SECTION: All upcoming compliances for remainder of the financial year.
 */
export function buildFinancialYearCompliancePipeline(
  baseCompliances: ComplianceItem[],
  options?: {
    includeEarlierCompleted?: boolean;
    currentDateIso?: string;
  },
): ComplianceItem[] {
  const currentKey = getCurrentMonthKey();
  const referenceDate = options?.currentDateIso || new Date().toISOString().slice(0, 10);
  const refTime = new Date(referenceDate).getTime();

  // 1. TOP SECTION: Earlier Months Pending Compliances (< current active month)
  const earlierPendingItems: ComplianceItem[] = [];
  const earlierCompletedItems: ComplianceItem[] = [];

  baseCompliances.forEach((c) => {
    const itemCycle = getItemCycleMonth(c);
    if (itemCycle < currentKey) {
      const isCompleted = isComplianceItemCompleted(c);
      if (!isCompleted) {
        // Calculate delay days
        let delayDays = 0;
        const dueIso = c.dueDates?.[0] || parseDeadlineDateToIso(c.statutoryDueDate);
        if (dueIso) {
          const dueTime = new Date(dueIso).getTime();
          if (refTime > dueTime) {
            delayDays = Math.max(1, Math.round((refTime - dueTime) / (1000 * 60 * 60 * 24)));
          }
        }
        earlierPendingItems.push({
          ...c,
          id: `${c.id}-earlier-pending`,
          cycleMonth: itemCycle,
          timelineSection: "earlier_pending",
          isEarlierPending: true,
          delayDays,
          status: "Overdue",
          criticality: "Critical",
          cfoRemarks:
            c.cfoRemarks ||
            `🚨 Statutory filing pending from ${itemCycle} (${delayDays} days delayed). Priority clearance required.`,
        });
      } else {
        earlierCompletedItems.push({
          ...c,
          cycleMonth: itemCycle,
          timelineSection: "earlier_pending",
          isEarlierCompleted: true,
          delayDays: 0,
        });
      }
    }
  });

  // 2. CURRENT MONTH SECTION: Active compliances for current month
  const currentMonthRolled = buildRolledComplianceList(baseCompliances, currentKey, {
    includeEarlierCompleted: false,
  }).map((c) => ({
    ...c,
    timelineSection: "current_month" as const,
    delayDays: 0,
  }));

  // 3. PROSPECTIVE COMPLIANCES OF FINANCIAL YEAR (Nov 2026 to Mar 2027)
  const prospectiveFyItems: ComplianceItem[] = [
    // --- NOVEMBER 2026 ---
    {
      id: "tds-281-nov2026",
      sNo: 101,
      category: "TDS / TCS",
      name: "TDS Payment (Challan 281) – October Month",
      applicability: "All deductors with TDS deducted in October",
      frequency: "Monthly",
      statutoryDueDate: "7th of November 2026",
      dueDates: ["2026-11-07"],
      type: "Payment",
      penaltyClause: "Interest @ 1.5% per month u/s 201(1A)",
      period: "Oct 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-11",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tds-nov-st1",
          subtaskNumber: 1,
          title: "Compile October payroll & vendor TDS deduction schedule",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "04 Nov 2026",
          status: "pending",
        },
        {
          id: "tds-nov-st2",
          subtaskNumber: 2,
          title: "CFO review & payment challan creation on e-filing portal",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "06 Nov 2026",
          status: "pending",
        },
        {
          id: "tds-nov-st3",
          subtaskNumber: 3,
          title: "Authorize net-banking payment & download BSR challan",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "07 Nov 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-1-nov2026",
      sNo: 102,
      category: "GST",
      name: "GSTR-1 (Outward Supplies) – October Month",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "11th of November 2026",
      dueDates: ["2026-11-11"],
      type: "Return",
      penaltyClause: "Late fee ₹50/day + interest",
      period: "Oct 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-11",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Accounts Executive",
      subtasks: [
        {
          id: "gst-1-nov-st1",
          subtaskNumber: 1,
          title: "Compile October sales invoices & credit notes from ERP",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "06 Nov 2026",
          status: "pending",
        },
        {
          id: "gst-1-nov-st2",
          subtaskNumber: 2,
          title: "Reconcile with IRN e-invoices & e-way bills; CFO sign-off",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "09 Nov 2026",
          status: "pending",
        },
        {
          id: "gst-1-nov-st3",
          subtaskNumber: 3,
          title: "File GSTR-1 on GST portal with DSC",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "11 Nov 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "pf-nov2026",
      sNo: 103,
      category: "PF / ESI",
      name: "PF & ESI Monthly Payment & ECR Filing – October",
      applicability: "Establishments with >= 20 employees",
      frequency: "Monthly",
      statutoryDueDate: "15th of November 2026",
      dueDates: ["2026-11-15"],
      type: "Return + Payment",
      penaltyClause: "Damages u/s 14B (up to 25%) + 12% interest u/s 7Q",
      period: "Oct 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-11",
      delayDays: 0,
      assignedTo: "Amit Patel",
      assignedRole: "Payroll Executive",
      subtasks: [
        {
          id: "pf-nov-st1",
          subtaskNumber: 1,
          title: "Prepare October wage register & ECR electronic text file",
          stageName: "Team Draft",
          assignedTo: "Amit Patel",
          deadline: "10 Nov 2026",
          status: "pending",
        },
        {
          id: "pf-nov-st2",
          subtaskNumber: 2,
          title: "CFO review of PF wage ceiling & employer contribution",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "13 Nov 2026",
          status: "pending",
        },
        {
          id: "pf-nov-st3",
          subtaskNumber: 3,
          title: "Upload ECR on EPFO portal & remit challan via net banking",
          stageName: "Filing & Payment",
          assignedTo: "Amit Patel",
          deadline: "15 Nov 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-3b-nov2026",
      sNo: 104,
      category: "GST",
      name: "GSTR-3B (Summary Return & Tax Payment) – October",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "20th of November 2026",
      dueDates: ["2026-11-20"],
      type: "Return + Payment",
      penaltyClause: "Late fee ₹50/day + 18% p.a. interest",
      period: "Oct 2026",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-11",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "gst-3b-nov-st1",
          subtaskNumber: 1,
          title: "Match input tax credit with auto-drafted GSTR-2B",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "14 Nov 2026",
          status: "pending",
        },
        {
          id: "gst-3b-nov-st2",
          subtaskNumber: 2,
          title: "CFO review of net cash liability & cash ledger allocation",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "18 Nov 2026",
          status: "pending",
        },
        {
          id: "gst-3b-nov-st3",
          subtaskNumber: 3,
          title: "Pay GST challan & submit GSTR-3B on GST portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "20 Nov 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "roc-mgt7-nov2026",
      sNo: 105,
      category: "ROC / MCA",
      name: "MGT-7 / MGT-7A (MCA Annual Return) – FY 2025-26",
      applicability: "All companies registered under Companies Act, 2013",
      frequency: "Annual",
      statutoryDueDate: "27th of November 2026 (60 days from AGM)",
      dueDates: ["2026-11-27"],
      type: "Return",
      penaltyClause: "₹100/day late fee + company & officer penalty",
      period: "FY 2025-26",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-11",
      delayDays: 0,
      assignedTo: "CS Alok Mehta",
      assignedRole: "Company Secretary",
      subtasks: [
        {
          id: "mgt7-st1",
          subtaskNumber: 1,
          title: "Prepare shareholder list, board meetings & indebtedness extract",
          stageName: "Team Draft",
          assignedTo: "CS Alok Mehta",
          deadline: "15 Nov 2026",
          status: "pending",
        },
        {
          id: "mgt7-st2",
          subtaskNumber: 2,
          title: "CFO & PCS review of draft MGT-7 e-form and disclosures",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "22 Nov 2026",
          status: "pending",
        },
        {
          id: "mgt7-st3",
          subtaskNumber: 3,
          title: "Attach UDIN / DSC & upload on MCA V3 portal",
          stageName: "Filing & Payment",
          assignedTo: "CS Alok Mehta",
          deadline: "27 Nov 2026",
          status: "pending",
        },
      ],
    },

    // --- DECEMBER 2026 ---
    {
      id: "tds-281-dec2026",
      sNo: 106,
      category: "TDS / TCS",
      name: "TDS Payment (Challan 281) – November Month",
      applicability: "All deductors with TDS deducted in November",
      frequency: "Monthly",
      statutoryDueDate: "7th of December 2026",
      dueDates: ["2026-12-07"],
      type: "Payment",
      penaltyClause: "Interest @ 1.5% per month u/s 201(1A)",
      period: "Nov 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tds-dec-st1",
          subtaskNumber: 1,
          title: "Compile November vendor & payroll TDS schedule",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "04 Dec 2026",
          status: "pending",
        },
        {
          id: "tds-dec-st2",
          subtaskNumber: 2,
          title: "CFO review & payment challan creation on e-filing portal",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "06 Dec 2026",
          status: "pending",
        },
        {
          id: "tds-dec-st3",
          subtaskNumber: 3,
          title: "Authorize net-banking payment & download BSR challan",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "07 Dec 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-1-dec2026",
      sNo: 107,
      category: "GST",
      name: "GSTR-1 (Outward Supplies) – November Month",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "11th of December 2026",
      dueDates: ["2026-12-11"],
      type: "Return",
      penaltyClause: "Late fee ₹50/day + interest",
      period: "Nov 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Accounts Executive",
      subtasks: [
        {
          id: "gst-1-dec-st1",
          subtaskNumber: 1,
          title: "Compile November sales register & invoice-wise data",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "06 Dec 2026",
          status: "pending",
        },
        {
          id: "gst-1-dec-st2",
          subtaskNumber: 2,
          title: "Reconcile with IRN e-invoices; CFO approval",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "09 Dec 2026",
          status: "pending",
        },
        {
          id: "gst-1-dec-st3",
          subtaskNumber: 3,
          title: "File GSTR-1 return on GST portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "11 Dec 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "it-advtax3-dec2026",
      sNo: 108,
      category: "Income Tax",
      name: "Advance Tax Payment – 3rd Installment (75% Cumulative)",
      applicability: "All corporate & individual taxpayers with tax liability > ₹10,000",
      frequency: "Quarterly",
      statutoryDueDate: "15th of December 2026",
      dueDates: ["2026-12-15"],
      type: "Payment",
      penaltyClause: "Interest u/s 234C @ 1% per month for deferment",
      period: "Q3 FY 2026-27",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Sr. Accountant",
      subtasks: [
        {
          id: "advtax3-st1",
          subtaskNumber: 1,
          title: "Estimate 9-month P&L, projected full-year taxable income & MAT",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "08 Dec 2026",
          status: "pending",
        },
        {
          id: "advtax3-st2",
          subtaskNumber: 2,
          title: "CFO review of 75% cumulative advance tax liability and cash flow",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "12 Dec 2026",
          status: "pending",
        },
        {
          id: "advtax3-st3",
          subtaskNumber: 3,
          title: "Pay Challan 280 via net-banking & record in books",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "15 Dec 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "pf-dec2026",
      sNo: 109,
      category: "PF / ESI",
      name: "PF & ESI Monthly Payment & ECR Filing – November",
      applicability: "Establishments with >= 20 employees",
      frequency: "Monthly",
      statutoryDueDate: "15th of December 2026",
      dueDates: ["2026-12-15"],
      type: "Return + Payment",
      penaltyClause: "Interest @ 12% u/s 7Q + damages u/s 14B",
      period: "Nov 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Amit Patel",
      assignedRole: "Payroll Executive",
      subtasks: [
        {
          id: "pf-dec-st1",
          subtaskNumber: 1,
          title: "Compute November PF/ESI contribution from wage register",
          stageName: "Team Draft",
          assignedTo: "Amit Patel",
          deadline: "10 Dec 2026",
          status: "pending",
        },
        {
          id: "pf-dec-st2",
          subtaskNumber: 2,
          title: "CFO review & approval of PF remittance challan",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "13 Dec 2026",
          status: "pending",
        },
        {
          id: "pf-dec-st3",
          subtaskNumber: 3,
          title: "Remit challan on EPFO/ESIC unified portals",
          stageName: "Filing & Payment",
          assignedTo: "Amit Patel",
          deadline: "15 Dec 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-3b-dec2026",
      sNo: 110,
      category: "GST",
      name: "GSTR-3B (Summary Return & Tax Payment) – November",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "20th of December 2026",
      dueDates: ["2026-12-20"],
      type: "Return + Payment",
      penaltyClause: "Late fee ₹50/day + 18% p.a. interest",
      period: "Nov 2026",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "gst-3b-dec-st1",
          subtaskNumber: 1,
          title: "Reconcile November ITC with GSTR-2B; identify blocked credits",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "14 Dec 2026",
          status: "pending",
        },
        {
          id: "gst-3b-dec-st2",
          subtaskNumber: 2,
          title: "CFO sign-off on net tax payable & electronic cash ledger",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "18 Dec 2026",
          status: "pending",
        },
        {
          id: "gst-3b-dec-st3",
          subtaskNumber: 3,
          title: "File GSTR-3B & pay cash liability via corporate net banking",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "20 Dec 2026",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-9-annual-dec2026",
      sNo: 111,
      category: "GST",
      name: "GSTR-9 & GSTR-9C (Annual GST Return & Reconciliation) – FY 2025-26",
      applicability: "Regular taxpayers with annual turnover exceeding statutory threshold",
      frequency: "Annual",
      statutoryDueDate: "31st of December 2026",
      dueDates: ["2026-12-31"],
      type: "Return",
      penaltyClause: "Late fee ₹200/day capped at 0.25% of turnover each",
      period: "FY 2025-26",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2026-12",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Sr. Accountant",
      subtasks: [
        {
          id: "gst9-st1",
          subtaskNumber: 1,
          title: "Compile full FY 25-26 GSTR-1 vs GSTR-3B vs Audited Financials",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "15 Dec 2026",
          status: "pending",
        },
        {
          id: "gst9-st2",
          subtaskNumber: 2,
          title: "CFO & GST Auditor review of Table 4, 5, 6, 7 & 9 reconciliations",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "24 Dec 2026",
          status: "pending",
        },
        {
          id: "gst9-st3",
          subtaskNumber: 3,
          title: "File GSTR-9 & GSTR-9C on GST portal with DSC",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "31 Dec 2026",
          status: "pending",
        },
      ],
    },

    // --- JANUARY 2027 ---
    {
      id: "tds-281-jan2027",
      sNo: 112,
      category: "TDS / TCS",
      name: "TDS Payment (Challan 281) – December Month",
      applicability: "All deductors with TDS deducted in December",
      frequency: "Monthly",
      statutoryDueDate: "7th of January 2027",
      dueDates: ["2027-01-07"],
      type: "Payment",
      penaltyClause: "Interest @ 1.5% per month u/s 201(1A)",
      period: "Dec 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-01",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tds-jan-st1",
          subtaskNumber: 1,
          title: "Extract December TDS deduction schedules across all sections",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "04 Jan 2027",
          status: "pending",
        },
        {
          id: "tds-jan-st2",
          subtaskNumber: 2,
          title: "CFO review & payment authorization on IT portal",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "06 Jan 2027",
          status: "pending",
        },
        {
          id: "tds-jan-st3",
          subtaskNumber: 3,
          title: "Pay challan 281 & record BSR details",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "07 Jan 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-1-jan2027",
      sNo: 113,
      category: "GST",
      name: "GSTR-1 (Outward Supplies) – December / Q3",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "11th of January 2027",
      dueDates: ["2027-01-11"],
      type: "Return",
      penaltyClause: "Late fee ₹50/day + interest",
      period: "Dec 2026",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-01",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Accounts Executive",
      subtasks: [
        {
          id: "gst1-jan-st1",
          subtaskNumber: 1,
          title: "Compile December B2B & export sales invoices",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "06 Jan 2027",
          status: "pending",
        },
        {
          id: "gst1-jan-st2",
          subtaskNumber: 2,
          title: "Reconcile with ERP sales ledger; CFO approval",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "09 Jan 2027",
          status: "pending",
        },
        {
          id: "gst1-jan-st3",
          subtaskNumber: 3,
          title: "File return with DSC on GST portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "11 Jan 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "tcs-27eq-jan2027",
      sNo: 114,
      category: "TDS / TCS",
      name: "TCS Return (Form 27EQ) – Q3 FY 2026-27",
      applicability: "All corporate collectors of TCS (Sec 206C)",
      frequency: "Quarterly",
      statutoryDueDate: "15th of January 2027",
      dueDates: ["2027-01-15"],
      type: "Return",
      penaltyClause: "Late fee ₹200/day u/s 234E",
      period: "Q3 FY 2026-27",
      criticality: "Medium",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-01",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tcs-jan-st1",
          subtaskNumber: 1,
          title: "Prepare Q3 TCS text file via NSDL RPU utility",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "10 Jan 2027",
          status: "pending",
        },
        {
          id: "tcs-jan-st2",
          subtaskNumber: 2,
          title: "CFO validation using FVU utility; review challans",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "13 Jan 2027",
          status: "pending",
        },
        {
          id: "tcs-jan-st3",
          subtaskNumber: 3,
          title: "Upload validated FVU file on income tax e-filing portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "15 Jan 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-3b-jan2027",
      sNo: 115,
      category: "GST",
      name: "GSTR-3B (Summary Return & Tax Payment) – December",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "20th of January 2027",
      dueDates: ["2027-01-20"],
      type: "Return + Payment",
      penaltyClause: "Late fee ₹50/day + 18% p.a. interest",
      period: "Dec 2026",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-01",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "gst3b-jan-st1",
          subtaskNumber: 1,
          title: "Reconcile December ITC with GSTR-2B",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "14 Jan 2027",
          status: "pending",
        },
        {
          id: "gst3b-jan-st2",
          subtaskNumber: 2,
          title: "CFO review of net cash liability & cash ledger allocation",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "18 Jan 2027",
          status: "pending",
        },
        {
          id: "gst3b-jan-st3",
          subtaskNumber: 3,
          title: "Pay GST challan & submit return",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "20 Jan 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "tds-returns-q3-jan2027",
      sNo: 116,
      category: "TDS / TCS",
      name: "TDS Quarterly Returns (Form 24Q & 26Q) – Q3 FY 2026-27",
      applicability: "All corporate deductors (Salary & Non-Salary TDS)",
      frequency: "Quarterly",
      statutoryDueDate: "31st of January 2027",
      dueDates: ["2027-01-31"],
      type: "Return",
      penaltyClause: "Late fee ₹200/day u/s 234E",
      period: "Q3 FY 2026-27",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-01",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tdsq3-st1",
          subtaskNumber: 1,
          title: "Compile Q3 BSR challans & deductee PAN master in RPU",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "22 Jan 2027",
          status: "pending",
        },
        {
          id: "tdsq3-st2",
          subtaskNumber: 2,
          title: "Run FVU validation; CFO sign-off on 24Q & 26Q",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "28 Jan 2027",
          status: "pending",
        },
        {
          id: "tdsq3-st3",
          subtaskNumber: 3,
          title: "Upload validated return files on TRACES / e-filing portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "31 Jan 2027",
          status: "pending",
        },
      ],
    },

    // --- FEBRUARY 2027 ---
    {
      id: "tds-281-feb2027",
      sNo: 117,
      category: "TDS / TCS",
      name: "TDS Payment (Challan 281) – January Month",
      applicability: "All deductors with TDS deducted in January",
      frequency: "Monthly",
      statutoryDueDate: "7th of February 2027",
      dueDates: ["2027-02-07"],
      type: "Payment",
      penaltyClause: "Interest @ 1.5% per month u/s 201(1A)",
      period: "Jan 2027",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-02",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tds-feb-st1",
          subtaskNumber: 1,
          title: "Prepare January TDS liability statement",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "04 Feb 2027",
          status: "pending",
        },
        {
          id: "tds-feb-st2",
          subtaskNumber: 2,
          title: "CFO approval of tax remittance challan",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "06 Feb 2027",
          status: "pending",
        },
        {
          id: "tds-feb-st3",
          subtaskNumber: 3,
          title: "Remit TDS on portal & download BSR receipt",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "07 Feb 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-1-feb2027",
      sNo: 118,
      category: "GST",
      name: "GSTR-1 (Outward Supplies) – January Month",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "11th of February 2027",
      dueDates: ["2027-02-11"],
      type: "Return",
      penaltyClause: "Late fee ₹50/day + interest",
      period: "Jan 2027",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-02",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Accounts Executive",
      subtasks: [
        {
          id: "gst1-feb-st1",
          subtaskNumber: 1,
          title: "Extract January sales register from ERP",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "06 Feb 2027",
          status: "pending",
        },
        {
          id: "gst1-feb-st2",
          subtaskNumber: 2,
          title: "Reconcile with IRN e-invoices; CFO review",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "09 Feb 2027",
          status: "pending",
        },
        {
          id: "gst1-feb-st3",
          subtaskNumber: 3,
          title: "File return with DSC on GST portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "11 Feb 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-3b-feb2027",
      sNo: 119,
      category: "GST",
      name: "GSTR-3B (Summary Return & Tax Payment) – January",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "20th of February 2027",
      dueDates: ["2027-02-20"],
      type: "Return + Payment",
      penaltyClause: "Late fee ₹50/day + 18% p.a. interest",
      period: "Jan 2027",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-02",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "gst3b-feb-st1",
          subtaskNumber: 1,
          title: "Reconcile January ITC with GSTR-2B",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "14 Feb 2027",
          status: "pending",
        },
        {
          id: "gst3b-feb-st2",
          subtaskNumber: 2,
          title: "CFO review of net tax liability & cash ledger allocation",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "18 Feb 2027",
          status: "pending",
        },
        {
          id: "gst3b-feb-st3",
          subtaskNumber: 3,
          title: "Pay tax & submit return",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "20 Feb 2027",
          status: "pending",
        },
      ],
    },

    // --- MARCH 2027 (Financial Year End Close) ---
    {
      id: "tds-281-mar2027",
      sNo: 120,
      category: "TDS / TCS",
      name: "TDS Payment (Challan 281) – February Month",
      applicability: "All deductors with TDS deducted in February",
      frequency: "Monthly",
      statutoryDueDate: "7th of March 2027",
      dueDates: ["2027-03-07"],
      type: "Payment",
      penaltyClause: "Interest @ 1.5% per month u/s 201(1A)",
      period: "Feb 2027",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "tds-mar-st1",
          subtaskNumber: 1,
          title: "Prepare February TDS liability statement",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "04 Mar 2027",
          status: "pending",
        },
        {
          id: "tds-mar-st2",
          subtaskNumber: 2,
          title: "CFO review & payment authorization on IT portal",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "06 Mar 2027",
          status: "pending",
        },
        {
          id: "tds-mar-st3",
          subtaskNumber: 3,
          title: "Remit TDS on portal & download BSR receipt",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "07 Mar 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-1-mar2027",
      sNo: 121,
      category: "GST",
      name: "GSTR-1 (Outward Supplies) – February Month",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "11th of March 2027",
      dueDates: ["2027-03-11"],
      type: "Return",
      penaltyClause: "Late fee ₹50/day + interest",
      period: "Feb 2027",
      criticality: "High",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Accounts Executive",
      subtasks: [
        {
          id: "gst1-mar-st1",
          subtaskNumber: 1,
          title: "Compile February sales register from ERP",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "06 Mar 2027",
          status: "pending",
        },
        {
          id: "gst1-mar-st2",
          subtaskNumber: 2,
          title: "Reconcile with IRN e-invoices; CFO approval",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "09 Mar 2027",
          status: "pending",
        },
        {
          id: "gst1-mar-st3",
          subtaskNumber: 3,
          title: "File return with DSC on GST portal",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "11 Mar 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "it-advtax4-mar2027",
      sNo: 122,
      category: "Income Tax",
      name: "Advance Tax Payment – 4th Installment (100% Cumulative)",
      applicability: "All corporate & individual taxpayers with tax liability > ₹10,000",
      frequency: "Quarterly",
      statutoryDueDate: "15th of March 2027",
      dueDates: ["2027-03-15"],
      type: "Payment",
      penaltyClause: "Interest u/s 234B & 234C for advance tax shortfall",
      period: "Q4 FY 2026-27",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Pooja Sharma",
      assignedRole: "Sr. Accountant",
      subtasks: [
        {
          id: "advtax4-st1",
          subtaskNumber: 1,
          title: "Finalize FY 2026-27 annual taxable income & full advance tax computation",
          stageName: "Team Draft",
          assignedTo: "Pooja Sharma",
          deadline: "08 Mar 2027",
          status: "pending",
        },
        {
          id: "advtax4-st2",
          subtaskNumber: 2,
          title: "CFO review of 100% cumulative payment; ensure zero shortfall interest",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "12 Mar 2027",
          status: "pending",
        },
        {
          id: "advtax4-st3",
          subtaskNumber: 3,
          title: "Remit Challan 280 via corporate net banking",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "15 Mar 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-3b-mar2027",
      sNo: 123,
      category: "GST",
      name: "GSTR-3B (Summary Return & Tax Payment) – February",
      applicability: "All regular registered dealers",
      frequency: "Monthly",
      statutoryDueDate: "20th of March 2027",
      dueDates: ["2027-03-20"],
      type: "Return + Payment",
      penaltyClause: "Late fee ₹50/day + 18% p.a. interest",
      period: "Feb 2027",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "gst3b-mar-st1",
          subtaskNumber: 1,
          title: "Reconcile February ITC with GSTR-2B",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "14 Mar 2027",
          status: "pending",
        },
        {
          id: "gst3b-mar-st2",
          subtaskNumber: 2,
          title: "CFO sign-off on net cash payout",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "18 Mar 2027",
          status: "pending",
        },
        {
          id: "gst3b-mar-st3",
          subtaskNumber: 3,
          title: "Remit tax & submit return",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "20 Mar 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "gst-lut-renewal-mar2027",
      sNo: 124,
      category: "GST",
      name: "Export Letter of Undertaking (LUT) Renewal – FY 2027-28",
      applicability: "Exporters supplying goods/services without payment of IGST",
      frequency: "Annual",
      statutoryDueDate: "31st of March 2027",
      dueDates: ["2027-03-31"],
      type: "Other",
      penaltyClause: "Mandatory IGST payment on exports if LUT not renewed prior to 1st April",
      period: "FY 2027-28",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Rahul Verma",
      assignedRole: "Tax Associate",
      subtasks: [
        {
          id: "lut-st1",
          subtaskNumber: 1,
          title: "Prepare Form GST RFD-11 with two witness details and self-declarations",
          stageName: "Team Draft",
          assignedTo: "Rahul Verma",
          deadline: "20 Mar 2027",
          status: "pending",
        },
        {
          id: "lut-st2",
          subtaskNumber: 2,
          title: "CFO review of export compliance eligibility & witness KYC",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "26 Mar 2027",
          status: "pending",
        },
        {
          id: "lut-st3",
          subtaskNumber: 3,
          title: "Submit LUT on GST portal with Director DSC & download ARN",
          stageName: "Filing & Payment",
          assignedTo: "Rahul Verma",
          deadline: "31 Mar 2027",
          status: "pending",
        },
      ],
    },
    {
      id: "fy-yearend-close-mar2027",
      sNo: 125,
      category: "Corporate Governance",
      name: "Financial Year End Physical Inventory & Books Provisional Closing",
      applicability: "Mandatory year-end accounts & statutory audit closure",
      frequency: "Annual",
      statutoryDueDate: "31st of March 2027",
      dueDates: ["2027-03-31"],
      type: "Other",
      penaltyClause: "Statutory audit qualifications and inventory valuation discrepancies",
      period: "FY 2026-27",
      criticality: "Critical",
      status: "Not Due",
      timelineSection: "prospective_fy",
      cycleMonth: "2027-03",
      delayDays: 0,
      assignedTo: "Vikram Singhania",
      assignedRole: "Finance Controller",
      subtasks: [
        {
          id: "yearend-st1",
          subtaskNumber: 1,
          title: "Conduct physical stock-taking across all warehouses and reconcile with ERP",
          stageName: "Team Draft",
          assignedTo: "Vikram Singhania",
          deadline: "28 Mar 2027",
          status: "pending",
        },
        {
          id: "yearend-st2",
          subtaskNumber: 2,
          title: "CFO review of cut-off procedures, revenue recognition & expense provisions",
          stageName: "CFO Review",
          assignedTo: "Sudhakar",
          deadline: "30 Mar 2027",
          status: "pending",
        },
        {
          id: "yearend-st3",
          subtaskNumber: 3,
          title: "Lock provisional trial balance & hand over schedules to Statutory Auditors",
          stageName: "Filing & Payment",
          assignedTo: "Vikram Singhania",
          deadline: "31 Mar 2027",
          status: "pending",
        },
      ],
    },
  ];

  // Combine strictly in order:
  // 1. Earlier Pending items (at the very top)
  // 2. Current Month (October 2026) items
  // 3. Prospective Financial Year items (Nov 2026 - Mar 2027)
  const fullPipeline = [
    ...earlierPendingItems,
    ...currentMonthRolled,
    ...prospectiveFyItems,
    ...(options?.includeEarlierCompleted ? earlierCompletedItems : []),
  ];

  // Deduplicate by item ID
  const seenIds = new Set<string>();
  const uniquePipeline: ComplianceItem[] = [];
  for (const item of fullPipeline) {
    if (!item) continue;
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    uniquePipeline.push(item);
  }

  return uniquePipeline;
}

/**
 * Priority sorting for compliance lists:
 * 1. Critical or Delayed / Overdue items and Past Months Pending remain on top in each category.
 * 2. Uncompleted / pending items with high statutory criticality or active progress follow.
 * 3. Upcoming not-due items sorted by statutory due date (earliest due first).
 * 4. Completed / filed items always stay at the bottom of the category.
 */
export function sortCompliancesByUrgencyAndPastMonths(items: ComplianceItem[]): ComplianceItem[] {
  if (!items || items.length === 0) return [];

  return [...items].sort((a, b) => {
    const statusA = getComplianceFourColorStatus(a);
    const statusB = getComplianceFourColorStatus(b);

    const isFiledA = isComplianceFiled(a) || statusA === "completed";
    const isFiledB = isComplianceFiled(b) || statusB === "completed";

    // Completed items always go to the bottom
    if (isFiledA !== isFiledB) {
      return isFiledA ? 1 : -1;
    }

    // Both completed: sort by statutory due date descending (most recently filed first)
    if (isFiledA && isFiledB) {
      const dateA = a.dueDates?.[0] || parseDeadlineDateToIso(a.statutoryDueDate) || "";
      const dateB = b.dueDates?.[0] || parseDeadlineDateToIso(b.statutoryDueDate) || "";
      return dateB.localeCompare(dateA) || a.sNo - b.sNo;
    }

    // Uncompleted items:
    const daysA = daysUntilDue(a);
    const daysB = daysUntilDue(b);

    const isOverdueA =
      statusA === "overdue" ||
      (daysA !== null && daysA < 0) ||
      Boolean(a.delayDays && a.delayDays > 0);
    const isOverdueB =
      statusB === "overdue" ||
      (daysB !== null && daysB < 0) ||
      Boolean(b.delayDays && b.delayDays > 0);

    const currentMonthKey = getCurrentMonthKey();
    const isPastMonthA = Boolean(
      a.isEarlierPending ||
      a.timelineSection === "earlier_pending" ||
      (a.cycleMonth && a.cycleMonth < currentMonthKey),
    );
    const isPastMonthB = Boolean(
      b.isEarlierPending ||
      b.timelineSection === "earlier_pending" ||
      (b.cycleMonth && b.cycleMonth < currentMonthKey),
    );

    const isCriticalA = a.criticality === "Critical";
    const isCriticalB = b.criticality === "Critical";

    const isHighA = a.criticality === "High";
    const isHighB = b.criticality === "High";

    // TIER SCORING (lower tier = placed higher on top):
    // Tier 1: Overdue/Delayed + Critical OR Past Month Pending + Critical
    // Tier 2: Overdue / Delayed OR Past Month Pending
    // Tier 3: Critical upcoming (due soon)
    // Tier 4: High upcoming (due soon)
    // Tier 5: In process (work underway)
    // Tier 6: Not due (upcoming)
    const getTier = (
      isOverdue: boolean,
      isPastMonth: boolean,
      isCrit: boolean,
      isHigh: boolean,
      status: string,
    ) => {
      if ((isOverdue || isPastMonth) && (isCrit || isHigh)) return 1;
      if (isOverdue || isPastMonth) return 2;
      if (isCrit) return 3;
      if (isHigh) return 4;
      if (status === "in_process") return 5;
      return 6;
    };

    const tierA = getTier(isOverdueA, isPastMonthA, isCriticalA, isHighA, statusA);
    const tierB = getTier(isOverdueB, isPastMonthB, isCriticalB, isHighB, statusB);

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Within Tier 1 or Tier 2 (Overdue & Past Months):
    // Highest delay on top (delayDays or negative daysUntilDue)
    if (tierA === 1 || tierA === 2) {
      const delayA = a.delayDays || (daysA !== null && daysA < 0 ? Math.abs(daysA) : 0);
      const delayB = b.delayDays || (daysB !== null && daysB < 0 ? Math.abs(daysB) : 0);
      if (delayA !== delayB) {
        return delayB - delayA; // Higher delay first
      }
      // If delay is equal, Critical before High before others
      if (isCriticalA !== isCriticalB) return isCriticalA ? -1 : 1;
      if (isHighA !== isHighB) return isHighA ? -1 : 1;
    }

    // For upcoming / not due items (Tier 3, 4, 5, 6):
    // Soonest statutory due date first (ascending order)
    const dateA = a.dueDates?.[0] || parseDeadlineDateToIso(a.statutoryDueDate) || "9999-99-99";
    const dateB = b.dueDates?.[0] || parseDeadlineDateToIso(b.statutoryDueDate) || "9999-99-99";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return a.sNo - b.sNo;
  });
}
