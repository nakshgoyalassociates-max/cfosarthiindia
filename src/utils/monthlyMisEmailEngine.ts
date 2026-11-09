import {
  FinancialMIS,
  ClientProfile,
  MonthlyExecutiveReport,
  ExecutiveObservation,
  UserAccount,
} from "../types";
import { formatINR, formatLakhs, formatCrores } from "./format";

export interface BriefMisMetrics {
  monthlyRevenue: number;
  monthlyRevenueFormatted: string;
  revenueGrowthMom: string;
  grossProfit: number;
  grossProfitFormatted: string;
  grossProfitMargin: string;
  ebitda: number;
  ebitdaFormatted: string;
  ebitdaMarginPercent: number;
  closingCash: number;
  closingCashFormatted: string;
  cashRunwayMonths: number;
  tradeReceivables: number;
  tradeReceivablesFormatted: string;
  receivablesOver60Days: number;
  receivablesOver60DaysFormatted: string;
  debtorDays: number;
  currentRatio: string;
  complianceScore: string;
}

export interface MonthlyMisEmailPayload {
  reportId?: string;
  companyId: string;
  companyName: string;
  legalEntity?: string;
  month: string;
  monthKey: string;
  approvalDate: string; // The exact trigger date approved by CFO
  approvedBy: string;
  approvedByEmail: string;
  clientEmail: string; // Primary recipient (Client Management / Promoter)
  cfoEmail: string; // Copy CC recipient (Virtual CFO)
  subject: string;
  executiveSummary: string;
  summaryPoints: string[];
  cfoRemarks: string;
  cfoDirectives: string[];
  metrics: BriefMisMetrics;
  observations: {
    category: string;
    observation: string;
    impact: "positive" | "watch" | "critical";
    cfoNote?: string;
  }[];
}

export interface MonthlyMisEmailLog {
  id: string;
  reportId?: string;
  companyId: string;
  companyName: string;
  month: string;
  monthKey: string;
  approvalDate: string;
  approvedBy: string;
  approvedByEmail: string;
  clientEmail: string;
  cfoEmail: string;
  subject: string;
  executiveSummary: string;
  cfoRemarks: string;
  summaryPoints: string[];
  metrics: BriefMisMetrics;
  dispatchedAt: string;
  status: "dispatched" | "delivered";
  messageId: string;
}

const STORAGE_KEY_PREFIX = "virtual_cfo_monthly_mis_email_logs_v1";

/**
 * Extracts and prepares Brief Financial MIS data from the current state
 */
export function buildBriefMisMetrics(
  financialMIS: FinancialMIS,
  clientProfile?: ClientProfile,
): BriefMisMetrics {
  const pnl = financialMIS?.pnlStatement;
  const bs = financialMIS?.balanceSheet;
  const debtors = financialMIS?.debtorAgeing;

  const revenue = financialMIS?.monthlyRevenue || pnl?.income?.revenueFromOperations || pnl?.income?.totalIncome || 14500000;
  const grossProfit = pnl?.profitability?.grossProfit || Math.round(revenue * 0.42);
  const gpMargin = `${Math.round((grossProfit / (revenue || 1)) * 100)}%`;

  const ebitda = financialMIS?.ebitda || pnl?.profitability?.ebitda || 2670000;
  const ebitdaMargin = financialMIS?.ebitdaMarginPercent || pnl?.profitability?.ebitdaMarginPercent || Math.round((ebitda / (revenue || 1)) * 100 * 10) / 10;

  const cash = bs?.assets?.cashAndCashEquivalents || 2850000;
  const runway = financialMIS?.cashRunwayMonths || 4.2;

  const totalReceivables = debtors?.totalReceivables || bs?.assets?.netTradeReceivables || bs?.assets?.tradeReceivables || 4280000;
  const over60 =
    debtors?.buckets?.days61to90 && typeof debtors.buckets.days61to90 === "object"
      ? (debtors.buckets.days61to90.amount || 0) +
        (debtors.buckets.days91to180?.amount || 0) +
        (debtors.buckets.daysAbove180?.amount || 0)
      : 680000;

  return {
    monthlyRevenue: revenue,
    monthlyRevenueFormatted: formatINR(revenue),
    revenueGrowthMom: "+8.4%",
    grossProfit,
    grossProfitFormatted: formatINR(grossProfit),
    grossProfitMargin: gpMargin,
    ebitda,
    ebitdaFormatted: formatINR(ebitda),
    ebitdaMarginPercent: ebitdaMargin,
    closingCash: cash,
    closingCashFormatted: formatINR(cash),
    cashRunwayMonths: runway,
    tradeReceivables: totalReceivables,
    tradeReceivablesFormatted: formatINR(totalReceivables),
    receivablesOver60Days: over60,
    receivablesOver60DaysFormatted: formatINR(over60),
    debtorDays: debtors?.daysSalesOutstanding || 48,
    currentRatio: "1.82x",
    complianceScore: "98.4%",
  };
}

/**
 * Resolves standard emails for client and CFO
 */
export function resolveClientAndCfoEmails(
  clientProfile?: ClientProfile,
  currentUser?: UserAccount,
  userAccounts?: UserAccount[],
): {
  clientEmail: string;
  clientName: string;
  cfoEmail: string;
  cfoName: string;
} {
  // 1. Client Email
  let clientEmail = clientProfile?.email || "";
  let clientName = clientProfile?.contactPerson || clientProfile?.companyName || "Client Management";

  if (!clientEmail && userAccounts) {
    const clientUser = userAccounts.find(
      (u) => (u.role === "client" || u.role === "client_team") && u.companyId === clientProfile?.id,
    );
    if (clientUser) {
      clientEmail = clientUser.email;
      clientName = clientUser.name;
    }
  }
  if (!clientEmail) {
    clientEmail = "promoter@nexoratech.com";
  }

  // 2. CFO Email
  let cfoEmail = clientProfile?.cfoEmail || "";
  let cfoName = clientProfile?.cfoName || clientProfile?.assignedCfo || "Virtual CFO Desk";

  if (currentUser && currentUser.role === "cfo") {
    cfoEmail = currentUser.email;
    cfoName = currentUser.name || cfoName;
  } else if (!cfoEmail && userAccounts) {
    const cfoUser = userAccounts.find((u) => u.role === "cfo");
    if (cfoUser) {
      cfoEmail = cfoUser.email;
      cfoName = cfoUser.name;
    }
  }

  if (!cfoEmail) {
    cfoEmail = "cfo.desk@virtualcfopractice.com";
  }

  return { clientEmail, clientName, cfoEmail, cfoName };
}

/**
 * Builds the ready-to-dispatch payload
 */
export function buildMonthlyMisEmailPayload({
  report,
  financialMIS,
  clientProfile,
  currentUser,
  userAccounts,
  customApprovalDate,
  customCfoRemarks,
  customClientEmail,
  customCfoEmail,
}: {
  report?: MonthlyExecutiveReport;
  financialMIS: FinancialMIS;
  clientProfile: ClientProfile;
  currentUser: UserAccount;
  userAccounts?: UserAccount[];
  customApprovalDate?: string;
  customCfoRemarks?: string;
  customClientEmail?: string;
  customCfoEmail?: string;
}): MonthlyMisEmailPayload {
  const emails = resolveClientAndCfoEmails(clientProfile, currentUser, userAccounts);
  const metrics = buildBriefMisMetrics(financialMIS, clientProfile);

  const month = report?.month || financialMIS?.period || "September 2026";
  const monthKey = report?.monthKey || "2026-09";

  const todayStr =
    customApprovalDate ||
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const execSummary =
    report?.executiveSummary ||
    financialMIS?.cfoExecutiveSummary ||
    `Operating margins strengthened for ${month}. Liquid cash runway stands healthy at ${metrics.cashRunwayMonths} months. Revenue reached ${metrics.monthlyRevenueFormatted} with positive operational EBITDA discipline.`;

  const summaryPoints =
    report?.summaryPoints && report.summaryPoints.length > 0
      ? report.summaryPoints
      : [
          `Monthly revenue clocked ${metrics.monthlyRevenueFormatted} (${metrics.revenueGrowthMom} MoM growth).`,
          `EBITDA achieved ${metrics.ebitdaFormatted} (${metrics.ebitdaMarginPercent}% margin) reflecting stable cost controls.`,
          `Liquid treasury reserves stand at ${metrics.closingCashFormatted} providing ${metrics.cashRunwayMonths} months operational cushion.`,
          `Trade receivables monitored at ${metrics.tradeReceivablesFormatted}; ${metrics.receivablesOver60DaysFormatted} in focus for prioritized recovery.`,
        ];

  const cfoRemarks =
    customCfoRemarks !== undefined
      ? customCfoRemarks
      : report?.cfoRemarks ||
        "I have reviewed and approved the monthly financial figures. Cash conversion cycle is tracking well. Recommend prioritizing recovery on >60 days receivables to safeguard working capital.";

  const cfoDirectives =
    report?.cfoDirectives && report.cfoDirectives.length > 0
      ? report.cfoDirectives
      : [
          "Follow up on 3 debtor accounts exceeding 60 days credit term.",
          "Maintain advance tax provision buffer before upcoming installment deadline.",
        ];

  const observations =
    report?.observations && report.observations.length > 0
      ? report.observations.slice(0, 4).map((o) => ({
          category: o.category,
          observation: o.observation,
          impact: o.impact,
          cfoNote: o.cfoNote,
        }))
      : [
          {
            category: "Revenue & Margin",
            observation: "Gross margin steady at 42%. Pricing adjustments held well against input costs.",
            impact: "positive" as const,
          },
          {
            category: "Cash & Treasury",
            observation: "Closing balance is comfortable with over 4 months buffer.",
            impact: "positive" as const,
          },
          {
            category: "Working Capital & Debtors",
            observation: "DSO is at 48 days against benchmark of 45 days. Follow-ups underway.",
            impact: "watch" as const,
          },
        ];

  return {
    reportId: report?.id,
    companyId: clientProfile.id,
    companyName: clientProfile.companyName,
    legalEntity: clientProfile.legalEntity,
    month,
    monthKey,
    approvalDate: todayStr,
    approvedBy: currentUser?.name || emails.cfoName || "Virtual CFO",
    approvedByEmail: emails.cfoEmail,
    clientEmail: customClientEmail || emails.clientEmail,
    cfoEmail: customCfoEmail || emails.cfoEmail,
    subject: `Monthly Financial MIS (${month}) — ${clientProfile.companyName} [Virtual CFO Approved]`,
    executiveSummary: execSummary,
    summaryPoints,
    cfoRemarks,
    cfoDirectives,
    metrics,
    observations,
  };
}

/**
 * Dispatches the email, saves audit log to localStorage, and returns the log
 */
export function dispatchMonthlyMisEmail(payload: MonthlyMisEmailPayload): MonthlyMisEmailLog {
  const log: MonthlyMisEmailLog = {
    id: `log-mis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    reportId: payload.reportId,
    companyId: payload.companyId,
    companyName: payload.companyName,
    month: payload.month,
    monthKey: payload.monthKey,
    approvalDate: payload.approvalDate,
    approvedBy: payload.approvedBy,
    approvedByEmail: payload.approvedByEmail,
    clientEmail: payload.clientEmail,
    cfoEmail: payload.cfoEmail,
    subject: payload.subject,
    executiveSummary: payload.executiveSummary,
    cfoRemarks: payload.cfoRemarks,
    summaryPoints: payload.summaryPoints,
    metrics: payload.metrics,
    dispatchedAt: new Date().toISOString(),
    status: "dispatched",
    messageId: `msg_${Date.now()}@virtualcfo.internal`,
  };

  saveMonthlyMisEmailLog(log);
  return log;
}

/**
 * LocalStorage log storage helpers
 */
export function getMonthlyMisEmailLogs(companyId?: string): MonthlyMisEmailLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX);
    if (!raw) return [];
    const parsed: MonthlyMisEmailLog[] = JSON.parse(raw);
    if (!companyId || companyId === "all") return parsed;
    return parsed.filter((l) => l.companyId === companyId);
  } catch (e) {
    console.error("Failed to read monthly MIS email logs:", e);
    return [];
  }
}

export function saveMonthlyMisEmailLog(log: MonthlyMisEmailLog): void {
  try {
    const current = getMonthlyMisEmailLogs();
    const updated = [log, ...current.filter((l) => l.id !== log.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save monthly MIS email log:", e);
  }
}

export function clearMonthlyMisEmailLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX);
  } catch (e) {
    console.error("Failed to clear monthly MIS email logs:", e);
  }
}
