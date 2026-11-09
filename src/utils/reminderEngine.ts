/**
 * Automated Statutory & Repository Reminder Engine
 * Handles multi-channel reminders (Email & WhatsApp) with a 3-tier escalation matrix:
 * 1. About to Due (1–7 days): Mail + WhatsApp to Assigned User, CC to CFO.
 * 2. Overdue: Urgent Mail + WhatsApp to Assigned User, CC to CFO.
 * 3. Critical Overdue: Escalation Mail + WhatsApp to Assigned User, CC to CFO, and CC to Client Promoter.
 *
 * Applicable to Statutory Compliances and Repository Items (Tax Assessments, Legal Cases, Licenses, SOPs).
 */

import {
  ComplianceItem,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
  SopMatter,
  RepositoryItem,
  UserAccount,
  ClientProfile,
} from "../types";
import { isComplianceFiled, daysUntilDue, nextDueDate } from "./dueDate";
import { formatINR } from "./format";

export type ReminderSeverity = "about_to_due" | "overdue" | "critical_overdue";

export type ReminderSource =
  | "compliance"
  | "tax_assessment"
  | "legal_case"
  | "license_certification"
  | "sop";

export interface ReminderRecipient {
  name: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  type: "assigned_user" | "cfo" | "client";
}

export interface ReminderItem {
  id: string;
  source: ReminderSource;
  sourceLabel: string;
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  referenceNo?: string;
  dueDate: string; // ISO date YYYY-MM-DD or formatted
  daysDiff: number; // Negative = overdue, 0 = due today, positive = days left
  severity: ReminderSeverity;
  isCriticalOverdue: boolean;

  // Metadata
  criticalityOrRisk: "Critical" | "High" | "Medium" | "Low";
  statusDescription: string;
  exposureOrPenalty?: string;
  actionRequired: string;

  // Escalation Matrix
  assignedUser: ReminderRecipient; // Primary TO
  cfoCopy: ReminderRecipient; // CC CFO (Always)
  clientCopy?: ReminderRecipient; // CC Client (Only when isCriticalOverdue, or manual)

  // Tracking
  lastRemindedAt?: string;
  remindersCount?: number;
  rawItem: ComplianceItem | RepositoryItem;
}

export interface ReminderDispatchLog {
  id: string;
  timestamp: string;
  reminderItemId: string;
  itemTitle: string;
  companyName: string;
  sourceLabel: string;
  severity: ReminderSeverity;
  channel: "email" | "whatsapp" | "both";
  primaryRecipient: string;
  cfoCopied: string;
  clientCopied?: string;
  status: "delivered" | "sent_external";
  messageExcerpt: string;
}

const STORAGE_KEY_REMINDER_LOGS = "cfosarthi_reminder_dispatch_logs_v1";

/**
 * Format raw phone number into standard WhatsApp international phone format
 */
export function cleanWhatsAppPhone(phone?: string): string {
  if (!phone) return "";
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Parses any date string into days difference from today (midnight to midnight)
 */
export function getDaysDiffFromToday(dateStr?: string): number | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  let targetDate: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split("-").map(Number);
    targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      targetDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  if (!targetDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = targetDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Find default CFO recipient for a company
 */
function resolveCfoRecipient(
  clientProfile?: ClientProfile,
  userAccounts: UserAccount[] = [],
): ReminderRecipient {
  const cfoUser = userAccounts.find((u) => u.role === "cfo" && !u.isHidden);
  const cfoName = clientProfile?.assignedCfo || clientProfile?.cfoName || cfoUser?.name || "Sudhakar";
  const cfoEmail = cfoUser?.email || "cfo@practice.com";
  const cfoPhone = cfoUser?.phone || "+91 98201 45892";

  return {
    name: cfoName,
    email: cfoEmail,
    phone: cfoPhone,
    roleTitle: "Virtual CFO & Practice Partner",
    type: "cfo",
  };
}

/**
 * Find default Client Promoter recipient for a company
 */
function resolveClientRecipient(
  companyId: string,
  clientProfile?: ClientProfile,
  userAccounts: UserAccount[] = [],
): ReminderRecipient {
  const clientUser = userAccounts.find(
    (u) =>
      u.role === "client" &&
      !u.isHidden &&
      (u.companyId === companyId || u.companyId === clientProfile?.id),
  );

  const clientName = clientUser?.name || "Anand Verma";
  const clientEmail = clientUser?.email || "anand@nexora.io";
  const clientPhone = clientUser?.phone || "+91 98112 33490";

  return {
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
    roleTitle: "Managing Director / Client Promoter",
    type: "client",
  };
}

/**
 * Match assigned person name to known user account
 */
function resolveAssignedUser(
  assignedName?: string,
  assignedEmail?: string,
  companyId?: string,
  userAccounts: UserAccount[] = [],
): ReminderRecipient {
  if (assignedName) {
    const trimmed = assignedName.trim().toLowerCase();
    const matched = userAccounts.find(
      (u) =>
        u.name.toLowerCase().includes(trimmed) ||
        trimmed.includes(u.name.toLowerCase()) ||
        (assignedEmail && u.email.toLowerCase() === assignedEmail.toLowerCase()),
    );
    if (matched) {
      return {
        name: matched.name,
        email: matched.email,
        phone: matched.phone || "+91 98450 12890",
        roleTitle: matched.roleTitle,
        type: "assigned_user",
      };
    }
  }

  // Fallback to first team member of the company or general finance accountant
  const teamMember = userAccounts.find(
    (u) => u.role === "client_team" && !u.isHidden && (!companyId || u.companyId === companyId),
  );

  return {
    name: assignedName || teamMember?.name || "Pooja Sharma",
    email: assignedEmail || teamMember?.email || "pooja@nexora.io",
    phone: teamMember?.phone || "+91 98450 12890",
    roleTitle: teamMember?.roleTitle || "Compliance & Accounts Lead",
    type: "assigned_user",
  };
}

export interface ExtractRemindersOptions {
  compliances?: ComplianceItem[];
  taxAssessments?: TaxAssessmentMatter[];
  legalCases?: LegalCaseMatter[];
  licenses?: LicenseCertificationMatter[];
  sops?: SopMatter[];
  companies?: ClientProfile[];
  userAccounts?: UserAccount[];
  clientProfile?: ClientProfile;
  companyFilter?: string; // "all" or specific company ID
  dueWindowDays?: number; // Default 7 days
}

/**
 * Scans all compliances and repository matters and returns all items that are
 * "about to due" (within window), "overdue", or "critical overdue".
 */
export function extractAllReminderItems(options: ExtractRemindersOptions): ReminderItem[] {
  const {
    compliances = [],
    taxAssessments = [],
    legalCases = [],
    licenses = [],
    sops = [],
    companies = [],
    userAccounts = [],
    clientProfile,
    companyFilter = "all",
    dueWindowDays = 7,
  } = options;

  const results: ReminderItem[] = [];

  const getCompanyName = (compCandidateId?: string) => {
    if (!compCandidateId) return clientProfile?.companyName || "Company";
    const found = companies.find((c) => c.id === compCandidateId);
    return found ? found.companyName : clientProfile?.companyName || "Company";
  };

  const cfoRecipient = resolveCfoRecipient(clientProfile, userAccounts);

  // ==========================================
  // 1. STATUTORY COMPLIANCES
  // ==========================================
  compliances.forEach((comp) => {
    if (comp.isHidden) return;
    if (companyFilter !== "all" && comp.companyId && comp.companyId !== companyFilter) return;

    // Check if filed / completed
    if (isComplianceFiled(comp)) return;
    if (comp.status === "completed" || comp.status === "Completed") return;

    const days = daysUntilDue(comp);
    if (days === null) return;

    // Condition: About to due (<= dueWindowDays) OR Overdue (< 0)
    if (days > dueWindowDays) return;

    const isOverdue = days < 0;
    const isCriticalOverdue =
      isOverdue &&
      (comp.criticality === "Critical" ||
        comp.criticality === "High" ||
        days <= -7 ||
        (comp.taxAmount !== undefined && comp.taxAmount >= 100000));

    const severity: ReminderSeverity = isCriticalOverdue
      ? "critical_overdue"
      : isOverdue
        ? "overdue"
        : "about_to_due";

    const compId = comp.companyId || clientProfile?.id || "client-101";
    const compName = getCompanyName(compId);
    const assignedUser = resolveAssignedUser(
      comp.assignedTo || comp.subtasks?.[0]?.assignedTo,
      comp.assignedEmail,
      compId,
      userAccounts,
    );

    const clientCopy = resolveClientRecipient(compId, clientProfile, userAccounts);

    const activeDueDate = nextDueDate(comp) || comp.statutoryDueDate || "Statutory Due Date";

    results.push({
      id: `rem-comp-${comp.id}`,
      source: "compliance",
      sourceLabel: "Statutory Compliance",
      companyId: compId,
      companyName: compName,
      title: comp.name,
      category: comp.category,
      referenceNo: comp.period || comp.arnOrChallanNo || comp.frequency,
      dueDate: activeDueDate,
      daysDiff: days,
      severity,
      isCriticalOverdue,
      criticalityOrRisk: comp.criticality || "High",
      statusDescription: isOverdue
        ? `Delayed by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
        : days === 0
          ? "Due Today"
          : `Due in ${days} day${days === 1 ? "" : "s"}`,
      exposureOrPenalty:
        comp.penaltyClause ||
        (comp.taxAmount ? `Tax Dues: ${formatINR(comp.taxAmount)}` : "Statutory late fee & interest under Act"),
      actionRequired:
        comp.subtasks?.[1]?.status === "pending"
          ? "Complete CFO Review & approve draft return"
          : comp.subtasks?.[2]?.status === "pending"
            ? "File return on portal, remit challan payment, and upload ARN acknowledgement"
            : "Prepare draft reconciliation and compile source data",
      assignedUser,
      cfoCopy: cfoRecipient,
      clientCopy,
      rawItem: comp,
    });
  });

  // ==========================================
  // 2. REPOSITORY: TAX ASSESSMENTS
  // ==========================================
  taxAssessments.forEach((matter) => {
    if (matter.isHidden) return;
    if (matter.status === "Closed / Dropped") return;
    if (companyFilter !== "all" && matter.companyId && matter.companyId !== companyFilter) return;

    const days = getDaysDiffFromToday(matter.nextDueDate);
    if (days === null) return;
    if (days > dueWindowDays) return;

    const isOverdue = days < 0;
    const isCriticalOverdue =
      isOverdue &&
      (matter.riskLevel === "High" ||
        (matter.demandAmount && matter.demandAmount >= 500000) ||
        days <= -7);

    const severity: ReminderSeverity = isCriticalOverdue
      ? "critical_overdue"
      : isOverdue
        ? "overdue"
        : "about_to_due";

    const compId = matter.companyId || clientProfile?.id || "client-101";
    const compName = matter.companyName || getCompanyName(compId);
    const assignedUser = resolveAssignedUser(matter.counselName, undefined, compId, userAccounts);
    const clientCopy = resolveClientRecipient(compId, clientProfile, userAccounts);

    results.push({
      id: `rem-tax-${matter.id}`,
      source: "tax_assessment",
      sourceLabel: "Tax Assessment",
      companyId: compId,
      companyName: compName,
      title: matter.matterTitle,
      category: matter.taxCategory,
      referenceNo: matter.caseOrNoticeNumber || matter.authority,
      dueDate: matter.nextDueDate,
      daysDiff: days,
      severity,
      isCriticalOverdue,
      criticalityOrRisk: matter.riskLevel || "High",
      statusDescription: isOverdue
        ? `Response delayed by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
        : days === 0
          ? "Hearing / Submission Due Today"
          : `Due in ${days} day${days === 1 ? "" : "s"}`,
      exposureOrPenalty: `Disputed Demand: ${formatINR(matter.demandAmount)} (Authority: ${matter.authority})`,
      actionRequired:
        matter.dueDateType || "Submit reply to notice / Attend statutory hearing / File appeal",
      assignedUser,
      cfoCopy: cfoRecipient,
      clientCopy,
      rawItem: matter,
    });
  });

  // ==========================================
  // 3. REPOSITORY: LEGAL CASES
  // ==========================================
  legalCases.forEach((matter) => {
    if (matter.isHidden) return;
    if (matter.status === "Disposed" || matter.status === "Decreed in Favor") return;
    if (companyFilter !== "all" && matter.companyId && matter.companyId !== companyFilter) return;

    const days = getDaysDiffFromToday(matter.nextHearingDate);
    if (days === null) return;
    if (days > dueWindowDays) return;

    const isOverdue = days < 0;
    const isCriticalOverdue =
      isOverdue &&
      (matter.riskLevel === "High" ||
        (matter.claimOrExposureAmount && matter.claimOrExposureAmount >= 1000000) ||
        days <= -7);

    const severity: ReminderSeverity = isCriticalOverdue
      ? "critical_overdue"
      : isOverdue
        ? "overdue"
        : "about_to_due";

    const compId = matter.companyId || clientProfile?.id || "client-101";
    const compName = matter.companyName || getCompanyName(compId);
    const assignedUser = resolveAssignedUser(
      matter.advocateLegalFirm,
      undefined,
      compId,
      userAccounts,
    );
    const clientCopy = resolveClientRecipient(compId, clientProfile, userAccounts);

    results.push({
      id: `rem-legal-${matter.id}`,
      source: "legal_case",
      sourceLabel: "Legal Matter",
      companyId: compId,
      companyName: compName,
      title: matter.matterTitle,
      category: matter.legalCategory,
      referenceNo: matter.caseNumber || matter.forumOrCourt,
      dueDate: matter.nextHearingDate,
      daysDiff: days,
      severity,
      isCriticalOverdue,
      criticalityOrRisk: matter.riskLevel || "High",
      statusDescription: isOverdue
        ? `Hearing date passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
        : days === 0
          ? "Court Hearing Today"
          : `Court Hearing in ${days} day${days === 1 ? "" : "s"}`,
      exposureOrPenalty: `Claim Amount: ${formatINR(matter.claimOrExposureAmount)} (Court: ${matter.forumOrCourt})`,
      actionRequired:
        matter.hearingPurpose || "Brief counsel, finalize affidavit / evidence, and appear before forum",
      assignedUser,
      cfoCopy: cfoRecipient,
      clientCopy,
      rawItem: matter,
    });
  });

  // ==========================================
  // 4. REPOSITORY: LICENSES & CERTIFICATIONS
  // ==========================================
  licenses.forEach((matter) => {
    if (matter.isHidden) return;
    if (matter.status === "Surrendered / Dormant") return;
    if (companyFilter !== "all" && matter.companyId && matter.companyId !== companyFilter) return;

    const days = getDaysDiffFromToday(matter.expiryDate);
    if (days === null) return;
    if (days > dueWindowDays && days > (matter.renewalWindowDays || 15)) return;

    const isOverdue = days < 0 || matter.status === "Expired - Urgent";
    // Operating with expired license is critical statutory non-compliance!
    const isCriticalOverdue = isOverdue;

    const severity: ReminderSeverity = isCriticalOverdue
      ? "critical_overdue"
      : isOverdue
        ? "overdue"
        : "about_to_due";

    const compId = matter.companyId || clientProfile?.id || "client-101";
    const compName = matter.companyName || getCompanyName(compId);
    const assignedUser = resolveAssignedUser(matter.renewalOfficer, undefined, compId, userAccounts);
    const clientCopy = resolveClientRecipient(compId, clientProfile, userAccounts);

    results.push({
      id: `rem-lic-${matter.id}`,
      source: "license_certification",
      sourceLabel: "License / Certification",
      companyId: compId,
      companyName: compName,
      title: matter.title,
      category: matter.licenseCategory,
      referenceNo: matter.licenseNumber || matter.issuingAuthority,
      dueDate: matter.expiryDate,
      daysDiff: days,
      severity,
      isCriticalOverdue,
      criticalityOrRisk: "Critical",
      statusDescription: isOverdue
        ? `EXPIRED by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} — URGENT RENEWAL`
        : days === 0
          ? "Expires Today"
          : `Expires in ${days} day${days === 1 ? "" : "s"}`,
      exposureOrPenalty: `Statutory Non-compliance / Business Disruption Risk (Annual Fee: ${formatINR(matter.annualFeeOrCost)})`,
      actionRequired: "Submit renewal application to authority and remit statutory renewal fees",
      assignedUser,
      cfoCopy: cfoRecipient,
      clientCopy,
      rawItem: matter,
    });
  });

  // ==========================================
  // 5. REPOSITORY: SOPS
  // ==========================================
  sops.forEach((matter) => {
    if (matter.isHidden) return;
    if (companyFilter !== "all" && matter.companyId && matter.companyId !== companyFilter) return;

    const days = getDaysDiffFromToday(matter.nextReviewDate);
    if (days === null) return;
    if (days > dueWindowDays) return;

    const isOverdue = days < 0;
    const isCriticalOverdue = isOverdue && matter.riskLevel === "High" && days <= -14;

    const severity: ReminderSeverity = isCriticalOverdue
      ? "critical_overdue"
      : isOverdue
        ? "overdue"
        : "about_to_due";

    const compId = matter.companyId || clientProfile?.id || "client-101";
    const compName = matter.companyName || getCompanyName(compId);
    const assignedUser = resolveAssignedUser(matter.owner, undefined, compId, userAccounts);
    const clientCopy = resolveClientRecipient(compId, clientProfile, userAccounts);

    results.push({
      id: `rem-sop-${matter.id}`,
      source: "sop",
      sourceLabel: "SOP Review",
      companyId: compId,
      companyName: compName,
      title: matter.title,
      category: matter.sopCategory,
      referenceNo: matter.sopCode || matter.department,
      dueDate: matter.nextReviewDate,
      daysDiff: days,
      severity,
      isCriticalOverdue,
      criticalityOrRisk: matter.riskLevel || "Medium",
      statusDescription: isOverdue
        ? `Review overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
        : days === 0
          ? "SOP Review Due Today"
          : `Review due in ${days} day${days === 1 ? "" : "s"}`,
      exposureOrPenalty: "Internal audit & statutory governance control breach",
      actionRequired: "Conduct periodic review of SOP controls, update amendments, and secure CFO sign-off",
      assignedUser,
      cfoCopy: cfoRecipient,
      clientCopy,
      rawItem: matter,
    });
  });

  // Sort by priority: Critical Overdue first, then Overdue, then About to Due (by days asc)
  return results.sort((a, b) => {
    const sevOrder = { critical_overdue: 0, overdue: 1, about_to_due: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    return a.daysDiff - b.daysDiff;
  });
}

/**
 * Generate formatted text for WhatsApp reminder with emojis, clear hierarchy, and escalation routing.
 */
export function generateWhatsAppReminderMessage(item: ReminderItem): string {
  const isCritical = item.isCriticalOverdue;
  const isOverdue = item.severity === "overdue" || isCritical;

  let headerBadge = "⏰ *STATUTORY REMINDER - DUE SOON*";
  if (isCritical) {
    headerBadge = "🚨 *CRITICAL OVERDUE ESCALATION NOTICE*";
  } else if (isOverdue) {
    headerBadge = "⚠️ *STATUTORY OVERDUE NOTICE*";
  }

  const timingText =
    item.daysDiff < 0
      ? `OVERDUE by ${Math.abs(item.daysDiff)} day(s) (Due: ${item.dueDate})`
      : item.daysDiff === 0
        ? `DUE TODAY (${item.dueDate})`
        : `Due in ${item.daysDiff} day(s) (${item.dueDate})`;

  const lines = [
    headerBadge,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `🏢 *Company:* ${item.companyName}`,
    `📌 *Item:* ${item.title}`,
    `📑 *Type / Ref:* ${item.sourceLabel} • ${item.category}${item.referenceNo ? ` (${item.referenceNo})` : ""}`,
    `⚡ *Status:* ${timingText}`,
    "",
    "👤 *PRIMARY ASSIGNEE (TO):*",
    `• ${item.assignedUser.name} (${item.assignedUser.email || item.assignedUser.phone || "Assignee"})`,
    "",
    "👥 *ESCALATION COPIES (CC):*",
    `• *CC CFO:* ${item.cfoCopy.name} (${item.cfoCopy.email})`,
  ];

  if (isCritical && item.clientCopy) {
    lines.push(
      `• *CC CLIENT PROMOTER:* 🚨 ${item.clientCopy.name} (${item.clientCopy.email}) [CRITICAL ESCALATION]`,
    );
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `⚠️ *Penalty / Risk:* ${item.exposureOrPenalty || "Statutory non-compliance penalties & late fee under Act."}`,
    `👉 *Immediate Action Required:* ${item.actionRequired}`,
    "",
    "_Virtual CFO Practice • Automated Governance Engine_",
  );

  return lines.join("\n");
}

/**
 * Generate click-to-chat WhatsApp URL
 */
export function generateWhatsAppUrl(phone?: string, text?: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encoded = encodeURIComponent(text || "");
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export interface GeneratedEmailReminder {
  to: string[];
  cc: string[];
  subject: string;
  plainText: string;
  htmlBody: string;
  mailtoUrl: string;
}

/**
 * Generate full Email reminder payload with To, CC (CFO + Client if critical), Subject, and Body
 */
export function generateEmailReminder(item: ReminderItem): GeneratedEmailReminder {
  const isCritical = item.isCriticalOverdue;
  const isOverdue = item.severity === "overdue" || isCritical;

  const to = [item.assignedUser.email];
  const cc: string[] = [item.cfoCopy.email];

  if (isCritical && item.clientCopy?.email) {
    cc.push(item.clientCopy.email);
  }

  let subjectTag = "[DUE SOON REMINDER]";
  if (isCritical) {
    subjectTag = "🚨 [CRITICAL OVERDUE ESCALATION - CC CLIENT & CFO]";
  } else if (isOverdue) {
    subjectTag = "⚠️ [OVERDUE REMINDER - CC CFO]";
  }

  const subject = `${subjectTag} ${item.title} | ${item.companyName}`;

  const timingText =
    item.daysDiff < 0
      ? `OVERDUE BY ${Math.abs(item.daysDiff)} DAY(S) (Due Date: ${item.dueDate})`
      : item.daysDiff === 0
        ? `DUE TODAY (${item.dueDate})`
        : `DUE IN ${item.daysDiff} DAY(S) (${item.dueDate})`;

  const plainText = `
${subject}
Company: ${item.companyName}
Matter: ${item.title} (${item.sourceLabel} - ${item.category})
Reference / Form: ${item.referenceNo || "N/A"}
Status: ${timingText}

PRIMARY ASSIGNEE (TO):
- ${item.assignedUser.name} <${item.assignedUser.email}>

ESCALATION COPIES (CC):
- Virtual CFO: ${item.cfoCopy.name} <${item.cfoCopy.email}>
${
  isCritical && item.clientCopy
    ? `- Client Promoter / Director: ${item.clientCopy.name} <${item.clientCopy.email}> [CRITICAL ESCALATION COPY]`
    : ""
}

RISK & PENALTY:
${item.exposureOrPenalty || "Statutory non-compliance fees and interest under relevant act."}

IMMEDIATE ACTION REQUIRED:
${item.actionRequired}

Please complete the task and upload filing proof / acknowledgement into the Virtual CFO Portal immediately.

Regards,
Virtual CFO Governance Office
`.trim();

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
  <div style="border-bottom: 2px solid ${isCritical ? "#e11d48" : isOverdue ? "#f59e0b" : "#4f46e5"}; padding-bottom: 16px; margin-bottom: 20px;">
    <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${isCritical ? "#ffe4e6" : isOverdue ? "#fef3c7" : "#e0e7ff"}; color: ${isCritical ? "#9f1239" : isOverdue ? "#92400e" : "#3730a3"}; margin-bottom: 8px;">
      ${isCritical ? "CRITICAL OVERDUE ESCALATION" : isOverdue ? "STATUTORY OVERDUE ALERT" : "DUE DATE REMINDER"}
    </div>
    <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a;">${item.title}</h2>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">${item.companyName} • ${item.sourceLabel}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
    <tr>
      <td style="padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 35%;">Category / Act:</td>
      <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${item.category}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Statutory Due Date:</td>
      <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: ${isOverdue ? "#e11d48" : "#0f172a"};">${item.dueDate} (${timingText})</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Penalty / Exposure:</td>
      <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #b91c1c; font-weight: 600;">${item.exposureOrPenalty || "Late fees & interest under relevant statutory Act"}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Action Required:</td>
      <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${item.actionRequired}</td>
    </tr>
  </table>

  <!-- Escalation Matrix Box -->
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
    <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">Recipient & Escalation Routing</h4>
    <div style="font-size: 13px; line-height: 1.6;">
      <div><strong>To (Primary Assignee):</strong> ${item.assignedUser.name} &lt;${item.assignedUser.email}&gt;</div>
      <div><strong>CC (Virtual CFO):</strong> ${item.cfoCopy.name} &lt;${item.cfoCopy.email}&gt;</div>
      ${
        isCritical && item.clientCopy
          ? `<div style="margin-top: 4px; padding: 4px 8px; background-color: #ffe4e6; border-left: 3px solid #e11d48; border-radius: 4px; color: #9f1239;"><strong>CC (Client Promoter - Critical Escalation):</strong> ${item.clientCopy.name} &lt;${item.clientCopy.email}&gt;</div>`
          : ""
      }
    </div>
  </div>

  <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
    Please complete the statutory submission, remit any applicable tax challan, and upload the official Filing Acknowledgement (ARN / Receipt) to the portal immediately.
  </p>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
    This automated statutory reminder was generated by CFOSARTHI • Virtual CFO Practice Hub
  </div>
</div>
`.trim();

  const toStr = to.join(",");
  const ccStr = cc.join(",");
  const mailtoUrl = `mailto:${encodeURIComponent(toStr)}?cc=${encodeURIComponent(ccStr)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;

  return {
    to,
    cc,
    subject,
    plainText,
    htmlBody,
    mailtoUrl,
  };
}

/**
 * Persist a reminder dispatch log entry to LocalStorage
 */
export function recordReminderDispatchLog(log: Omit<ReminderDispatchLog, "id" | "timestamp">): ReminderDispatchLog {
  const completeLog: ReminderDispatchLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = getReminderDispatchLogs();
    const nextLogs = [completeLog, ...existing].slice(0, 100); // keep latest 100
    localStorage.setItem(STORAGE_KEY_REMINDER_LOGS, JSON.stringify(nextLogs));
  } catch (err) {
    console.error("Failed to save reminder dispatch log:", err);
  }

  return completeLog;
}

/**
 * Retrieve saved reminder logs from LocalStorage
 */
export function getReminderDispatchLogs(): ReminderDispatchLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDER_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Clear reminder dispatch logs
 */
export function clearReminderDispatchLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_REMINDER_LOGS);
  } catch (err) {
    console.error("Failed to clear reminder logs:", err);
  }
}
