import { ComplianceItem } from "../types";

/**
 * Parses human dates like "20 Sep 2026" or "31 Oct 2026" to ISO "YYYY-MM-DD"
 */
export function parseDeadlineDateToIso(deadlineStr?: string): string | null {
  if (
    !deadlineStr ||
    deadlineStr === "End of Month" ||
    deadlineStr === "Daily" ||
    deadlineStr === "Weekly"
  ) {
    return null;
  }
  const trimmed = deadlineStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const monthMap: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const month = monthMap[parts[1]];
    const year = parts[2];
    if (month && year && /^\d{4}$/.test(year) && /^\d{2}$/.test(day)) {
      return `${year}-${month}-${day}`;
    }
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

/**
 * Converts any date string (ISO or "20 Sep 2026") to a guaranteed "YYYY-MM-DD" string for <input type="date" />
 */
export function toIsoDateInput(dateStr?: string, fallbackIso?: string): string {
  const parsed = parseDeadlineDateToIso(dateStr);
  if (parsed) return parsed;
  if (fallbackIso) {
    const parsedFallback = parseDeadlineDateToIso(fallbackIso);
    if (parsedFallback) return parsedFallback;
  }
  return new Date().toISOString().split("T")[0];
}

export const toIsoDateString = toIsoDateInput;

/**
 * Checks if a compliance item is completely filed (Subtask 3 completed)
 */
export function isComplianceFiled(item?: ComplianceItem | null): boolean {
  if (!item) return false;
  return Boolean(
    (item.subtasks && item.subtasks[2]?.status === "completed") ||
    item.completionProofDoc ||
    (item.completionProofDocs && item.completionProofDocs.length > 0) ||
    item.status === "Filed" ||
    (item.arnOrChallanNo && item.arnOrChallanNo.trim().length > 0),
  );
}

/**
 * Returns the active or next statutory due date for a compliance item in ISO (YYYY-MM-DD) format
 */
export function nextDueDate(item?: ComplianceItem | null): string | null {
  if (!item) return null;

  if (!item.dueDates || item.dueDates.length === 0) {
    // Fallback: check if item has direct nextDueDate or statutoryDueDate
    if ((item as any).nextDueDate && typeof (item as any).nextDueDate === "string") {
      const parsed = parseDeadlineDateToIso((item as any).nextDueDate);
      if (parsed) return parsed;
      if (/^\d{4}-\d{2}-\d{2}$/.test((item as any).nextDueDate)) return (item as any).nextDueDate;
    }
    if (item.statutoryDueDate && typeof item.statutoryDueDate === "string") {
      const parsed = parseDeadlineDateToIso(item.statutoryDueDate);
      if (parsed) return parsed;
      if (/^\d{4}-\d{2}-\d{2}$/.test(item.statutoryDueDate)) return item.statutoryDueDate;
    }
    // Fallback: try parsing from subtask 3 deadline if present
    const parsedSubtaskDate = parseDeadlineDateToIso(item.subtasks?.[2]?.deadline);
    if (parsedSubtaskDate) return parsedSubtaskDate;
    return null;
  }

  if (item.dueDates.length === 1) {
    return item.dueDates[0];
  }

  // If subtask 3 specifies a deadline that matches one of the due dates, that is the exact cycle date
  const parsedSubtaskDate = parseDeadlineDateToIso(item.subtasks?.[2]?.deadline);
  if (parsedSubtaskDate && item.dueDates.includes(parsedSubtaskDate)) {
    return parsedSubtaskDate;
  }

  // Otherwise evaluate relative to today
  const todayIso = new Date().toISOString().split("T")[0];
  const sortedDates = [...item.dueDates].sort();

  if (isComplianceFiled(item)) {
    // For filed items, pick the latest applicable date that has passed or the parsed date
    const pastDates = sortedDates.filter((d) => d <= todayIso);
    return pastDates.length > 0 ? pastDates[pastDates.length - 1] : sortedDates[0];
  }

  // For unfiled items:
  // First look for upcoming dates (>= today)
  const upcomingDates = sortedDates.filter((d) => d >= todayIso);
  if (upcomingDates.length > 0) {
    return upcomingDates[0];
  }

  // If all dates in dueDates are in the past and item is still unfiled, it is overdue
  return sortedDates[sortedDates.length - 1];
}

/**
 * Returns the integer number of calendar days from reference date (default: now) until the next due date.
 * Positive = future, 0 = today, Negative = overdue.
 */
export function daysUntilDue(item?: ComplianceItem | null, referenceDate?: Date): number | null {
  if (!item) return null;
  const due = nextDueDate(item);
  if (!due) return null;

  const targetParts = due.split("-").map(Number);
  const targetMidnight = new Date(targetParts[0], targetParts[1] - 1, targetParts[2]).getTime();

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();

  const diffMs = targetMidnight - refMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns status:
 * - 'filed': if subtask 3 is marked completed
 * - 'overdue': if past due date and not filed (< 0 days)
 * - 'due-soon': within 7 days (0 to 7 days remaining)
 * - 'upcoming': more than 7 days away
 */
export function dueStatus(
  item?: ComplianceItem | null,
  referenceDate?: Date,
): "overdue" | "due-soon" | "upcoming" | "filed" {
  if (!item) return "upcoming";
  if (isComplianceFiled(item)) {
    return "filed";
  }

  const days = daysUntilDue(item, referenceDate);
  if (days === null) {
    return "upcoming";
  }
  if (days < 0) {
    return "overdue";
  }
  if (days <= 7) {
    return "due-soon";
  }
  return "upcoming";
}

/**
 * Formats an ISO string (YYYY-MM-DD) to "DD Mon YYYY" (e.g., "20 Sep 2026")
 */
export function formatDueDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = [
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
  const monthName = months[monthIdx] || parts[1];

  return `${day} ${monthName} ${year}`;
}

/**
 * Comparator to sort compliance items ascending by their next due date
 */
export function compareDueDates(a?: ComplianceItem | null, b?: ComplianceItem | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const dateA = nextDueDate(a);
  const dateB = nextDueDate(b);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.localeCompare(dateB);
}

/**
 * Normalizes compliance ID by stripping transient carryover/cycle suffixes
 */
export function normalizeComplianceId(id?: string | null): string {
  if (!id) return "";
  return id
    .replace(/-carryover-.*$/, "")
    .replace(/-earlier-pending.*$/, "")
    .replace(/-2026-\d{2}$/, "");
}

/**
 * Robust matching between two compliance items by ID, normalized ID, or exact name
 */
export function isMatchingCompliance(
  idA?: string | null,
  idB?: string | null,
  nameA?: string | null,
  nameB?: string | null,
): boolean {
  if (!idA && !idB && !nameA && !nameB) return false;
  if (idA && idB && idA === idB) return true;
  const normA = normalizeComplianceId(idA);
  const normB = normalizeComplianceId(idB);
  if (normA && normB && normA === normB) return true;
  if (
    nameA &&
    nameB &&
    nameA.trim().toLowerCase() === nameB.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}
