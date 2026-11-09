import { ComplianceItem, ActionItem, SubTask, ActionSubtask } from "../types";
import { isComplianceFiled, daysUntilDue, dueStatus } from "./dueDate";

export type FourColorStatus = "completed" | "in_process" | "overdue" | "not_due";

export interface StuckInfo {
  isStuck: boolean;
  status: FourColorStatus;
  label: string;
  stepNumber?: number | null;
  stepName?: string | null;
  stepTitle?: string | null;
  assignee?: string | null;
  deadline?: string | null;
  totalSteps?: number;
  completedSteps?: number;
}

/**
 * Evaluates the 4-color status for a Statutory Compliance Item:
 * - 'completed': All 3 subtasks completed or filed (Green)
 * - 'overdue': Deadline passed and not completed (Red)
 * - 'in_process': Work started / in draft / in CFO review (Orange)
 * - 'not_due': Not due or applicable currently / upcoming with no work started (Without colour)
 */
export function getComplianceFourColorStatus(item: ComplianceItem): FourColorStatus {
  const isFiled =
    isComplianceFiled(item) ||
    Boolean(item.completionProofDoc) ||
    Boolean(item.completionProofDocs && item.completionProofDocs.length > 0) ||
    item.status === "Filed" ||
    Boolean(item.arnOrChallanNo && item.arnOrChallanNo.trim().length > 0) ||
    (item.subtasks && item.subtasks.every((s) => s && s.status === "completed"));
  if (isFiled) {
    return "completed";
  }

  const days = daysUntilDue(item);
  const isOverdue = days !== null && days < 0;
  if (isOverdue) {
    return "overdue";
  }

  const subtasksList: SubTask[] = item.subtasks ? [...item.subtasks] : [];
  const completedCount = subtasksList.filter((s) => s && s.status === "completed").length;
  const hasNotes = subtasksList.some((s) => Boolean(s?.notes && s.notes.trim().length > 0));
  const hasRemarks = Boolean(
    (item.cfoRemarks && item.cfoRemarks.trim().length > 0) ||
    (item.clientRemarks && item.clientRemarks.trim().length > 0),
  );

  if (completedCount > 0 || hasNotes || hasRemarks) {
    return "in_process";
  }

  return "not_due";
}

/**
 * Returns detailed bottleneck info indicating where the compliance task is stuck
 */
export function getComplianceStuckInfo(item: ComplianceItem): StuckInfo {
  const status = getComplianceFourColorStatus(item);
  const subtasksList: SubTask[] = item.subtasks ? [...item.subtasks] : [];
  const completedCount = subtasksList.filter((s) => s && s.status === "completed").length;

  if (status === "completed") {
    return {
      isStuck: false,
      status: "completed",
      label: "All subtasks completed",
      stepNumber: null,
      stepName: "Completed",
      stepTitle: item.arnOrChallanNo ? `ARN: ${item.arnOrChallanNo}` : "Completed",
      assignee: null,
      totalSteps: 3,
      completedSteps: 3,
    };
  }

  // Find the first pending subtask (this is where the item is actively blocked/stuck)
  const pendingStep = subtasksList.find((s) => s && s.status === "pending") || subtasksList[0];
  const stepNum = pendingStep?.subtaskNumber || 1;

  if (status === "overdue") {
    return {
      isStuck: true,
      status: "overdue",
      label: `Overdue at Subtask ${stepNum}`,
      stepNumber: stepNum,
      stepName: `Subtask ${stepNum}`,
      stepTitle: `Subtask ${stepNum}`,
      assignee: pendingStep?.assignedTo || "",
      deadline: pendingStep?.deadline || "",
      totalSteps: 3,
      completedSteps: completedCount,
    };
  }

  if (status === "in_process") {
    return {
      isStuck: true,
      status: "in_process",
      label: `Stuck at Subtask ${stepNum}${pendingStep?.assignedTo ? ` • ${pendingStep.assignedTo}` : ""}`,
      stepNumber: stepNum,
      stepName: `Subtask ${stepNum}`,
      stepTitle: `Subtask ${stepNum}`,
      assignee: pendingStep?.assignedTo || "",
      deadline: pendingStep?.deadline || "",
      totalSteps: 3,
      completedSteps: completedCount,
    };
  }

  // Not due or applicable currently
  return {
    isStuck: false,
    status: "not_due",
    label: `Not due currently • Subtask ${stepNum}`,
    stepNumber: stepNum,
    stepName: `Subtask ${stepNum}`,
    stepTitle: `Subtask ${stepNum}`,
    assignee: pendingStep?.assignedTo || "",
    deadline: pendingStep?.deadline || "",
    totalSteps: 3,
    completedSteps: 0,
  };
}

/**
 * Evaluates the 4-color status for an Operational Action Task Item:
 * - 'completed': Task status is Completed or all milestones done (Light Green)
 * - 'overdue': Deadline passed and not completed (Red)
 * - 'in_process': Status is In Progress / Under Review or milestones completed (Light Orange)
 * - 'not_due': Pending, deadline in future, no work started (Without colour)
 */
export function getActionFourColorStatus(item: ActionItem): FourColorStatus {
  const subtasks = item.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s && s.status === "completed").length;
  const progress =
    item.progressPercentage ??
    (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0);

  if (
    item.status === "Completed" ||
    progress >= 100 ||
    (totalSubtasks > 0 && completedSubtasks === totalSubtasks)
  ) {
    return "completed";
  }

  const now = new Date();
  const d = new Date(item.fixedDeadline);
  const isOverdue = !isNaN(d.getTime()) && d < now;
  if (isOverdue) {
    return "overdue";
  }

  if (
    item.status === "In Progress" ||
    item.status === "Under Review" ||
    progress > 0 ||
    completedSubtasks > 0 ||
    (item.progressUpdates && item.progressUpdates.length > 0) ||
    Boolean(item.remarks && item.remarks.trim().length > 0)
  ) {
    return "in_process";
  }

  return "not_due";
}

/**
 * Returns detailed progress & duration pacing info for an action task
 */
export function getActionStuckInfo(item: ActionItem): StuckInfo {
  const status = getActionFourColorStatus(item);
  const subtasks = item.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedCount = subtasks.filter((s) => s && s.status === "completed").length;
  const progress =
    item.progressPercentage ??
    (totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0);
  const duration = item.durationDays || 5;

  if (status === "completed") {
    return {
      isStuck: false,
      status: "completed",
      label: "100% Completed",
      stepNumber: null,
      stepName: "Completed",
      assignee: item.assignedTo,
      totalSteps: 100,
      completedSteps: 100,
    };
  }

  if (status === "overdue") {
    return {
      isStuck: true,
      status: "overdue",
      label: `Overdue: ${progress}% progress • Duration ${duration}d exceeded (${item.assignedTo})`,
      stepNumber: null,
      stepName: item.status,
      stepTitle: item.title,
      assignee: item.assignedTo,
      deadline: item.fixedDeadline,
      totalSteps: 100,
      completedSteps: progress,
    };
  }

  if (status === "in_process") {
    return {
      isStuck: true,
      status: "in_process",
      label: `${progress}% progress • ${duration} days allocated • ${item.assignedTo}`,
      stepNumber: null,
      stepName: item.status,
      stepTitle: item.title,
      assignee: item.assignedTo,
      deadline: item.fixedDeadline,
      totalSteps: 100,
      completedSteps: progress,
    };
  }

  return {
    isStuck: false,
    status: "not_due",
    label: `Not started (0%) • ${duration} days duration • ${item.assignedTo}`,
    stepNumber: null,
    stepName: "Pending",
    stepTitle: item.title,
    assignee: item.assignedTo,
    deadline: item.fixedDeadline,
    totalSteps: 100,
    completedSteps: 0,
  };
}

/**
 * Returns CSS class names for row background and border based on status:
 * - not due: no colour (clean neutral)
 * - subtask started: strong orange
 * - complete: strong green
 * - overdue: strong red
 * - subtask window should be as it is
 */
export function getLineItemRowClasses(
  status?: FourColorStatus,
  isExpanded: boolean = false,
): string {
  if (status === "completed") {
    return isExpanded
      ? "bg-emerald-100/70 text-emerald-950 font-medium"
      : "bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 font-medium";
  }

  if (status === "in_process") {
    return isExpanded
      ? "bg-amber-100/70 text-amber-950 font-medium"
      : "bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 font-medium";
  }

  if (status === "overdue") {
    return isExpanded
      ? "bg-rose-100/70 text-rose-950 font-medium"
      : "bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 font-medium";
  }

  // "not_due" or default: no colour
  return isExpanded
    ? "bg-slate-50 text-slate-900"
    : "bg-white hover:bg-slate-50/80 text-slate-900";
}

/**
 * Line item border styling for the Statutory Compliance Master:
 * - Red colour border: overdue or due (unfiled & deadline <= 7 days or overdue)
 * - Green colour border: completed items (all subtasks done, filed, or ARN proof present)
 * - No colour border: not due items (future/scheduled obligations)
 */
export interface ComplianceItemBorderClasses {
  category: "overdue_or_due" | "completed" | "not_due";
  trClasses: string;
  tdLeftClasses: string;
  tdRightClasses: string;
  tdMiddleClasses: string;
  expandedTrClasses: string;
  expandedTdClasses: string;
}

export function getComplianceLineItemBorder(
  item: ComplianceItem,
  isExpanded: boolean = false,
): ComplianceItemBorderClasses {
  const isFiled =
    isComplianceFiled(item) ||
    Boolean(item.completionProofDoc) ||
    Boolean(item.completionProofDocs && item.completionProofDocs.length > 0) ||
    item.status === "Filed" ||
    Boolean(item.arnOrChallanNo && item.arnOrChallanNo.trim().length > 0) ||
    (item.subtasks && item.subtasks.every((s) => s && s.status === "completed"));

  if (isFiled) {
    return {
      category: "completed",
      trClasses: isExpanded
        ? "border-t-2 border-emerald-500 bg-emerald-50/90 text-emerald-950 font-medium shadow-2xs"
        : "border-y-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 font-medium shadow-2xs",
      tdLeftClasses:
        "border-l-4 border-l-emerald-500 border-t-2 border-emerald-500" +
        (isExpanded ? "" : " border-b-2 border-b-emerald-500"),
      tdRightClasses:
        "border-r-2 border-r-emerald-500 border-t-2 border-emerald-500" +
        (isExpanded ? "" : " border-b-2 border-b-emerald-500"),
      tdMiddleClasses:
        "border-t-2 border-emerald-500" + (isExpanded ? "" : " border-b-2 border-b-emerald-500"),
      expandedTrClasses: "border-b-2 border-emerald-500 bg-emerald-50/30",
      expandedTdClasses:
        "border-b-2 border-emerald-500 border-l-4 border-l-emerald-500 border-r-2 border-r-emerald-500",
    };
  }

  const days = daysUntilDue(item);
  const status = dueStatus(item);
  const fourStatus = getComplianceFourColorStatus(item);
  const isOverdueOrDue =
    fourStatus === "overdue" ||
    status === "overdue" ||
    status === "due-soon" ||
    (days !== null && days <= 7);

  if (isOverdueOrDue) {
    return {
      category: "overdue_or_due",
      trClasses: isExpanded
        ? "border-t-2 border-rose-500 bg-rose-50/90 text-rose-950 font-medium shadow-2xs"
        : "border-y-2 border-rose-500 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 font-medium shadow-2xs",
      tdLeftClasses:
        "border-l-4 border-l-rose-500 border-t-2 border-rose-500" +
        (isExpanded ? "" : " border-b-2 border-b-rose-500"),
      tdRightClasses:
        "border-r-2 border-r-rose-500 border-t-2 border-rose-500" +
        (isExpanded ? "" : " border-b-2 border-b-rose-500"),
      tdMiddleClasses:
        "border-t-2 border-rose-500" + (isExpanded ? "" : " border-b-2 border-b-rose-500"),
      expandedTrClasses: "border-b-2 border-rose-500 bg-rose-50/30",
      expandedTdClasses:
        "border-b-2 border-rose-500 border-l-4 border-l-rose-500 border-r-2 border-r-rose-500",
    };
  }

  // Not due: no colour border (clean neutral border)
  const isSubtaskStarted = fourStatus === "in_process";
  const bgClass = isSubtaskStarted
    ? isExpanded
      ? "bg-amber-50/80 text-amber-950 font-medium"
      : "bg-amber-50/50 hover:bg-amber-100/50 text-amber-950 font-medium"
    : isExpanded
      ? "bg-slate-50 text-slate-900"
      : "bg-white hover:bg-slate-50/80 text-slate-900";

  return {
    category: "not_due",
    trClasses: isExpanded
      ? `border-t border-slate-200 ${bgClass}`
      : `border-y border-slate-200 ${bgClass}`,
    tdLeftClasses:
      "border-l-4 border-l-transparent border-t border-slate-200" +
      (isExpanded ? "" : " border-b border-slate-200"),
    tdRightClasses:
      "border-r border-slate-200 border-t border-slate-200" +
      (isExpanded ? "" : " border-b border-slate-200"),
    tdMiddleClasses:
      "border-t border-slate-200" + (isExpanded ? "" : " border-b border-slate-200"),
    expandedTrClasses: "border-b border-slate-200 bg-slate-50/70",
    expandedTdClasses:
      "border-b border-slate-200 border-l-4 border-l-transparent border-r border-slate-200",
  };
}

export type SemanticStatus = "success" | "info" | "warning" | "danger" | "muted";

/**
 * Maps application statuses to semantic tokens:
 * - Filed / Approved / Completed = success
 * - In review / Submitted / In Progress = info
 * - Pending / Due soon / Critical / Delayed = warning
 * - Overdue / Returned / Breached = danger
 * - Not applicable / Other = muted
 */
export function getSemanticStatus(status: string): SemanticStatus {
  const s = status.toLowerCase();
  if (s.includes("filed") || s.includes("approved") || s.includes("completed")) {
    return "success";
  }
  if (
    s.includes("review") ||
    s.includes("submitted") ||
    s.includes("in progress") ||
    s.includes("in_process")
  ) {
    return "info";
  }
  if (
    s.includes("due soon") ||
    s.includes("pending") ||
    s.includes("critical") ||
    s.includes("delayed")
  ) {
    return "warning";
  }
  if (
    s.includes("overdue") ||
    s.includes("returned") ||
    s.includes("rejected") ||
    s.includes("breached")
  ) {
    return "danger";
  }
  return "muted";
}

export function getSemanticBadgeClasses(status: SemanticStatus | string): string {
  const sem =
    typeof status === "string" && ["success", "info", "warning", "danger", "muted"].includes(status)
      ? (status as SemanticStatus)
      : getSemanticStatus(status);

  switch (sem) {
    case "success":
      return "bg-success/15 text-success font-medium";
    case "info":
      return "bg-info/15 text-info font-medium";
    case "warning":
      return "bg-warning/20 text-warning-foreground font-medium";
    case "danger":
      return "bg-danger/15 text-danger font-medium";
    case "muted":
    default:
      return "bg-muted text-muted-foreground font-medium";
  }
}
