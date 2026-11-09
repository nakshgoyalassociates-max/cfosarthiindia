import { ComplianceItem } from "../types";

export type PeriodicityGroup = "monthly" | "yearly" | "others";

export type PeriodicityFilter = "ALL" | "MONTHLY" | "YEARLY" | "OTHERS";

/**
 * Classifies a compliance item or frequency string into one of three primary groups:
 * 1. "monthly": Regular Monthly statutory obligations (GSTR-1, GSTR-3B, TDS Challan 281, PF, ESI, Professional Tax)
 * 2. "yearly": Yearly / Annual filings and audits (ITR, Tax Audit, AOC-4, MGT-7, GSTR-9/9C, DPT-3, DIR-3 KYC, FLA, ADT-1)
 * 3. "others": Other periodicities including Quarterly (TDS 24Q/26Q, Advance Tax), Half-Yearly (MSME-1, ITC-04), Event-based & Ongoing
 */
export function classifyCompliancePeriodicity(frequency: string): PeriodicityGroup {
  const f = (frequency || "").toLowerCase().trim();

  // Regular Monthly
  if (f.includes("month")) {
    return "monthly";
  }

  // Yearly / Annual (exclude half-yearly)
  if ((f.includes("annual") || f.includes("year")) && !f.includes("half")) {
    return "yearly";
  }

  // Others: Quarterly, Half-Yearly, Event-Based, Ongoing / Transaction-Based
  return "others";
}

export interface PeriodicityGroupMeta {
  id: PeriodicityGroup;
  title: string;
  shortTitle: string;
  badgeLabel: string;
  tagline: string;
  description: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  badgeClasses: string;
  dotColor: string;
}

export const PERIODICITY_GROUPS_META: Record<PeriodicityGroup, PeriodicityGroupMeta> = {
  monthly: {
    id: "monthly",
    title: "Regular Monthly Compliances",
    shortTitle: "Regular Monthly",
    badgeLabel: "Regular Monthly",
    tagline: "Routine 30-Day Operational Statutory Cycle",
    description:
      "Routine operational filings, payroll deductions, and tax payments due every 30 days (GSTR-1, GSTR-3B, TDS Challan 281, PF, ESIC, Professional Tax).",
    bgLight: "bg-blue-50/70",
    borderLight: "border-blue-200",
    textColor: "text-blue-950",
    badgeClasses: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-600",
  },
  yearly: {
    id: "yearly",
    title: "Yearly Compliances",
    shortTitle: "Yearly",
    badgeLabel: "Yearly",
    tagline: "Annual Governance, Financial Statements & Statutory Audits",
    description:
      "Annual corporate governance filings, corporate income tax returns, statutory audits, and financial year-end disclosures (ITR-6, Tax Audit 3CD, AOC-4, MGT-7, GSTR-9/9C, DPT-3, DIR-3 KYC, FLA Return).",
    bgLight: "bg-purple-50/70",
    borderLight: "border-purple-200",
    textColor: "text-purple-950",
    badgeClasses: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-600",
  },
  others: {
    id: "others",
    title: "Other Compliances",
    shortTitle: "Others",
    badgeLabel: "Others",
    tagline: "Quarterly Withholding Returns, Half-Yearly Statements & Event-Driven Filings",
    description:
      "Quarterly TDS returns (Form 24Q, 26Q, 27Q), Advance Tax quarterly instalments, Half-yearly returns (MSME-1, ITC-04), and event-based statutory filings (DIR-12, INC-22, etc.).",
    bgLight: "bg-amber-50/70",
    borderLight: "border-amber-200",
    textColor: "text-amber-950",
    badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-600",
  },
};

/**
 * Returns badge styling and text for a compliance's specific frequency
 */
export function getCompliancePeriodicityBadge(frequency: string): {
  group: PeriodicityGroup;
  text: string;
  subLabel?: string;
  classes: string;
  dotColor: string;
} {
  const group = classifyCompliancePeriodicity(frequency);
  const f = (frequency || "").trim();

  if (group === "monthly") {
    return {
      group,
      text: "Regular Monthly",
      classes: "bg-blue-50 text-blue-700",
      dotColor: "bg-blue-500",
    };
  }

  if (group === "yearly") {
    return {
      group,
      text: "Yearly",
      subLabel: f.toLowerCase().includes("annual") ? "Annual" : undefined,
      classes: "bg-purple-50 text-purple-700",
      dotColor: "bg-purple-500",
    };
  }

  // Others group - provide helpful sub-indicator
  if (f.toLowerCase().includes("quarter")) {
    return {
      group,
      text: "Others",
      subLabel: "Quarterly",
      classes: "bg-indigo-50 text-indigo-700",
      dotColor: "bg-indigo-500",
    };
  }

  if (f.toLowerCase().includes("half")) {
    return {
      group,
      text: "Others",
      subLabel: "Half-Yearly",
      classes: "bg-amber-50 text-amber-700",
      dotColor: "bg-amber-500",
    };
  }

  if (f.toLowerCase().includes("event")) {
    return {
      group,
      text: "Others",
      subLabel: "Event-Based",
      classes: "bg-teal-50 text-teal-700",
      dotColor: "bg-teal-500",
    };
  }

  return {
    group,
    text: "Others",
    subLabel: f || "Ongoing",
    classes: "bg-slate-100 text-slate-700",
    dotColor: "bg-slate-400",
  };
}

/**
 * Splits a list of compliances into the three segregated groups:
 * 1. monthly (Regular Monthly)
 * 2. yearly (Yearly / Annual)
 * 3. others (Quarterly, Half-yearly, Event-based, Ongoing)
 */
export function segregateCompliances(items: ComplianceItem[]): {
  monthly: ComplianceItem[];
  yearly: ComplianceItem[];
  others: ComplianceItem[];
} {
  const monthly: ComplianceItem[] = [];
  const yearly: ComplianceItem[] = [];
  const others: ComplianceItem[] = [];

  for (const item of items) {
    if (!item) continue;
    const group = classifyCompliancePeriodicity(item.frequency);
    if (group === "monthly") {
      monthly.push(item);
    } else if (group === "yearly") {
      yearly.push(item);
    } else {
      others.push(item);
    }
  }

  return {
    monthly,
    yearly,
    others,
  };
}

export interface GroupStats {
  total: number;
  completed: number;
  inProcess: number;
  overdue: number;
  notDue: number;
  completionPercentage: number;
}

export function calculateGroupStats(items: ComplianceItem[]): GroupStats {
  const total = items.length;
  let completed = 0;
  let inProcess = 0;
  let overdue = 0;
  let notDue = 0;

  for (const item of items) {
    if (!item) continue;
    const sub = item.subtasks || [];
    const isCompleted = sub[2]?.status === "completed";
    const hasStarted = sub[0]?.status === "completed" || sub[1]?.status === "completed";

    // Check overdue
    let isOverdue = false;
    if (!isCompleted && item.dueDates && item.dueDates.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(item.dueDates[0]);
      if (target < now) {
        isOverdue = true;
      }
    }

    if (isCompleted) {
      completed++;
    } else if (isOverdue) {
      overdue++;
    } else if (hasStarted) {
      inProcess++;
    } else {
      notDue++;
    }
  }

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProcess,
    overdue,
    notDue,
    completionPercentage,
  };
}
