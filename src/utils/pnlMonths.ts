import { PnlStatementData, PnlLineItem, PnlMonthSummary } from "../types";

export const FISCAL_YEAR_MONTHS = [
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
];

export const COMPLETED_FISCAL_MONTHS = [
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
];

export const CURRENT_REPORTING_MONTH = "September 2026";
export const PREVIOUS_COMPLETED_MONTH = "August 2026";
export const BASELINE_MONTH = "April 2026";

export interface MonthVarianceDetail {
  id: string;
  particulars: string;
  baseMonthValue: number;
  targetMonthValue: number;
  varianceAmount: number;
  variancePct: number;
  isFavorable: boolean;
  status: "Favorable" | "Adverse" | "Neutral";
  isHeading: boolean;
  varianceRemarks?: string;
}

/**
 * Checks if a positive variance is favorable for a given line item
 */
export function isVarianceFavorable(itemId: string, diff: number): boolean {
  if (Math.abs(diff) < 0.001) return true;
  // For revenue and profit items, increase is favorable
  const isIncomeOrProfit =
    itemId.startsWith("rev") ||
    itemId.startsWith("tot-inc") ||
    itemId.startsWith("other-inc") ||
    itemId.includes("ebitda") ||
    itemId.includes("pbt") ||
    itemId.includes("pat") ||
    itemId.includes("gross");

  if (isIncomeOrProfit) {
    return diff > 0;
  }
  // For expenses, decrease is favorable
  return diff < 0;
}

/**
 * Format variance percentage with sign
 */
export function formatVariancePct(pct: number): string {
  if (isNaN(pct) || !isFinite(pct)) return "0.0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Calculates month-by-month financial summary metrics (Revenue, COGS, EBITDA, PAT, Margins)
 */
export function generateMonthlySummaries(statement?: PnlStatementData | null): PnlMonthSummary[] {
  if (!statement) return [];
  const months = statement.monthsList || FISCAL_YEAR_MONTHS;
  const currentMonth = statement.currentMonthKey || CURRENT_REPORTING_MONTH;
  const lineItems = statement.lineItems || [];

  const revItem = lineItems.find((i) => i.id === "rev-ops");
  const otherIncItem = lineItems.find((i) => i.id === "other-inc");
  const totIncItem = lineItems.find((i) => i.id === "tot-inc");
  const cogsItem = lineItems.find((i) => i.id === "exp-cogs");
  const empItem = lineItems.find((i) => i.id === "exp-emp");
  const ebitdaItem = lineItems.find((i) => i.id === "ebitda-sub");
  const pbtItem = lineItems.find((i) => i.id === "pbt-total");
  const taxItem = lineItems.find((i) => i.id === "tax-exp");
  const patItem = lineItems.find((i) => i.id === "pat-final");
  const finItem = lineItems.find((li) => li.id === "exp-fin");
  const deprItem = lineItems.find((li) => li.id === "exp-depr");

  return months.map((m, idx) => {
    const isCurrent = m === currentMonth || idx === months.length - 1;
    const isCompleted = !isCurrent;
    const shortMonth = m.split(" ")[0].slice(0, 3);
    const monthKey = shortMonth.toLowerCase() + "-26";

    const revenue =
      revItem?.monthlyBreakdown?.[m] ??
      (isCurrent ? revItem?.currentMonth : revItem?.previousMonth) ??
      0;
    const otherIncome = otherIncItem?.monthlyBreakdown?.[m] ?? 0;
    const totalIncome = totIncItem?.monthlyBreakdown?.[m] ?? revenue + otherIncome;
    const cogs = cogsItem?.monthlyBreakdown?.[m] ?? 0;
    const employeeExpense = empItem?.monthlyBreakdown?.[m] ?? 0;
    const grossProfit = revenue - cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Calculate sum of operating expenses
    let operatingExpenses = 0;
    lineItems.forEach((li) => {
      if (
        li.id.startsWith("exp-") &&
        li.id !== "exp-cogs" &&
        li.id !== "exp-depr" &&
        li.id !== "exp-fin"
      ) {
        operatingExpenses += li.monthlyBreakdown?.[m] ?? 0;
      }
    });

    const ebitda = ebitdaItem?.monthlyBreakdown?.[m] ?? grossProfit - operatingExpenses;
    const ebitdaMarginPct = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    let totalExpenses = 0;
    lineItems.forEach((li) => {
      if (li.id.startsWith("exp-") && !li.isSubtotal && !li.isTotal) {
        totalExpenses += li.monthlyBreakdown?.[m] ?? 0;
      }
    });

    const pbt = pbtItem?.monthlyBreakdown?.[m] ?? totalIncome - totalExpenses;
    const taxValue =
      taxItem?.monthlyBreakdown?.[m] ??
      (isCurrent ? taxItem?.currentMonth : taxItem?.previousMonth);
    const hasTax = taxValue !== undefined && taxValue !== null;
    const taxes = hasTax ? taxValue : 0;
    const patDerived = !hasTax;
    const pat =
      patItem?.monthlyBreakdown?.[m] ??
      (isCurrent ? patItem?.currentMonth : patItem?.previousMonth) ??
      pbt - taxes;
    const patMarginPct = revenue > 0 ? (pat / revenue) * 100 : 0;

    const monthFinanceCosts =
      finItem?.monthlyBreakdown?.[m] ??
      (isCurrent ? finItem?.currentMonth : finItem?.previousMonth) ??
      statement.expenses?.financeCosts ??
      0;
    const monthDepreciation =
      deprItem?.monthlyBreakdown?.[m] ??
      (isCurrent ? deprItem?.currentMonth : deprItem?.previousMonth) ??
      statement.expenses?.depreciationAndAmortization ??
      0;

    return {
      month: m,
      shortMonth,
      monthKey,
      isCompleted,
      isCurrent,
      revenue,
      otherIncome,
      totalIncome,
      cogs,
      employeeExpense,
      operatingExpenses,
      totalExpenses,
      grossProfit,
      grossMarginPct: Number(grossMarginPct.toFixed(1)),
      ebitda,
      ebitdaMarginPct: Number(ebitdaMarginPct.toFixed(1)),
      pbt,
      taxes,
      pat,
      patMarginPct: Number(patMarginPct.toFixed(1)),
      financeCosts: monthFinanceCosts,
      depreciation: monthDepreciation,
      patDerived,
    };
  });
}

/**
 * Computes comparative variance between any two given months
 */
export function computeMonthPairVariance(
  lineItems: PnlLineItem[],
  baseMonth: string,
  targetMonth: string,
): MonthVarianceDetail[] {
  return lineItems.map((item) => {
    const isHeading = !!(item.isTotal || item.isSubtotal);
    const baseMonthValue = item.monthlyBreakdown?.[baseMonth] ?? item.previousMonth ?? 0;
    const targetMonthValue = item.monthlyBreakdown?.[targetMonth] ?? item.currentMonth ?? 0;
    const varianceAmount = targetMonthValue - baseMonthValue;
    const variancePct =
      baseMonthValue !== 0 ? (varianceAmount / Math.abs(baseMonthValue)) * 100 : 0;

    const isFavorable = isVarianceFavorable(item.id, varianceAmount);
    const status = Math.abs(varianceAmount) < 1 ? "Neutral" : isFavorable ? "Favorable" : "Adverse";

    return {
      id: item.id,
      particulars: item.particulars,
      baseMonthValue,
      targetMonthValue,
      varianceAmount,
      variancePct: Number(variancePct.toFixed(1)),
      isFavorable,
      status,
      isHeading,
      varianceRemarks: item.varianceRemarks,
    };
  });
}

/**
 * Ensures any PnlStatement has complete multi-month breakdown starting from April
 */
export function enrichPnlStatement(statement: PnlStatementData): PnlStatementData {
  if (!statement) return statement;
  const months = statement.monthsList || FISCAL_YEAR_MONTHS;
  const completed = statement.completedMonths || COMPLETED_FISCAL_MONTHS;
  const currentKey = statement.currentMonthKey || CURRENT_REPORTING_MONTH;
  const rawLineItems = statement.lineItems || [];

  // Check if line items already have full monthlyBreakdown
  const needsSynthesis = rawLineItems.some(
    (item) => !item.monthlyBreakdown || Object.keys(item.monthlyBreakdown).length < 6,
  );

  let updatedLineItems = rawLineItems;

  if (needsSynthesis) {
    // Proportional multipliers from April (month 1) to September (month 6)
    // April (0.85), May (0.88), June (0.92), July (0.89), August (1.0 - prev), September (1.08 - curr)
    const monthMultipliers: Record<string, number> = {
      "April 2026": 0.85,
      "May 2026": 0.88,
      "June 2026": 0.92,
      "July 2026": 0.89,
      "August 2026": 1.0,
      "September 2026": 1.08,
    };

    updatedLineItems = statement.lineItems.map((item) => {
      const basePrev = item.previousMonth || item.currentMonth * 0.92;
      const breakdown: Record<string, number> = { ...(item.monthlyBreakdown || {}) };

      months.forEach((m) => {
        if (!breakdown[m]) {
          if (m === "September 2026") {
            breakdown[m] = item.currentMonth;
          } else if (m === "August 2026") {
            breakdown[m] = item.previousMonth;
          } else {
            const mult = monthMultipliers[m] || 0.9;
            breakdown[m] = Math.round(basePrev * mult);
          }
        }
      });

      const sepVal = breakdown["September 2026"] ?? item.currentMonth;
      const augVal = breakdown["August 2026"] ?? item.previousMonth;
      const aprVal = breakdown["April 2026"] ?? Math.round(augVal * 0.85);

      const varianceVsPrev = sepVal - augVal;
      const varianceVsPrevPct = augVal !== 0 ? (varianceVsPrev / Math.abs(augVal)) * 100 : 0;
      const varianceVsBase = sepVal - aprVal;
      const varianceVsBasePct = aprVal !== 0 ? (varianceVsBase / Math.abs(aprVal)) * 100 : 0;

      const sumAll = months.reduce((acc, m) => acc + (breakdown[m] || 0), 0);
      const avgMonthly = Math.round(sumAll / months.length);

      return {
        ...item,
        currentMonth: sepVal,
        previousMonth: augVal,
        ytdCurrentYear: sumAll,
        monthlyBreakdown: breakdown,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: Number(varianceVsPrevPct.toFixed(1)),
        varianceVsBase,
        varianceVsBasePct: Number(varianceVsBasePct.toFixed(1)),
        monthlyAverage: avgMonthly,
        momGrowthPct: Number(varianceVsPrevPct.toFixed(1)),
      };
    });
  }

  const enriched: PnlStatementData = {
    ...statement,
    period: CURRENT_REPORTING_MONTH,
    comparisonPeriod: PREVIOUS_COMPLETED_MONTH,
    financialYear: "FY 2026-27 (Apr 2026 – Sep 2026)",
    monthsList: months,
    completedMonths: completed,
    currentMonthKey: currentKey,
    lineItems: updatedLineItems,
  };

  enriched.monthlySummaries = generateMonthlySummaries(enriched);
  return enriched;
}

/**
 * Generates downloadable CSV content for the multi-month PnL table
 */
export function exportPnlToCSV(statement: PnlStatementData, companyName: string): string {
  if (!statement) return "";
  const months = statement.monthsList || FISCAL_YEAR_MONTHS;
  const headers = [
    "Particulars",
    "Note Ref",
    ...months,
    "MoM Variance (₹)",
    "MoM Variance (%)",
    "Monthly Average (₹)",
    "YTD Cumulative (₹)",
  ];

  const lineItems = statement.lineItems || [];
  const rows = lineItems.map((item) => {
    const monthCols = months.map((m) => item.monthlyBreakdown?.[m] ?? 0);
    const variance = (item.varianceVsPrevious ?? item.currentMonth - item.previousMonth).toString();
    const variancePct = `${(item.varianceVsPreviousPct ?? item.momGrowthPct ?? 0).toFixed(1)}%`;
    const avg = (item.monthlyAverage ?? Math.round(item.ytdCurrentYear / months.length)).toString();
    const ytd = item.ytdCurrentYear.toString();

    return [
      `"${item.particulars.replace(/"/g, '""')}"`,
      item.noteRef || "",
      ...monthCols,
      variance,
      variancePct,
      avg,
      ytd,
    ].join(",");
  });

  return [
    `"Statement of Profit and Loss (P&L) - ${companyName}"`,
    `"Financial Year: ${statement.financialYear} | Period: April to Current Month"`,
    "",
    headers.join(","),
    ...rows,
  ].join("\n");
}

export interface PnlComparisonMetric {
  period: string;
  shortPeriod: string;
  periodType: "month" | "quarter";
  revenue: number;
  revenueLakhs: number;
  grossProfit: number;
  grossMarginPct: number;
  ebitda: number;
  ebitdaMarginPct: number;
  pat: number;
  patMarginPct: number;
  cogs: number;
  cogsPctOfRevenue: number;
  employeeExpense: number;
  employeePctOfRevenue: number;
  operatingExpenses: number;
  opexPctOfRevenue: number;
  totalExpenses: number;
  expenseRatioPct: number;
}

/**
 * Generates last 2 months + current month P&L comparison metrics (Jul vs Aug vs Sep)
 */
export function getPnlLast2MonthsComparison(
  monthlySummaries: PnlMonthSummary[],
  currentMonthKey?: string,
): PnlComparisonMetric[] {
  if (!monthlySummaries || monthlySummaries.length === 0) return [];

  // Take the last 3 months (i.e. 2 previous months + current month)
  const targetMonths = monthlySummaries.slice(-3);

  return targetMonths.map((m) => {
    const rev = m.revenue || 1;
    return {
      period: m.month,
      shortPeriod: m.shortMonth + (m.isCurrent ? " (Cur)" : ""),
      periodType: "month" as const,
      revenue: m.revenue,
      revenueLakhs: Number((m.revenue / 100000).toFixed(2)),
      grossProfit: m.grossProfit,
      grossMarginPct: m.grossMarginPct,
      ebitda: m.ebitda,
      ebitdaMarginPct: m.ebitdaMarginPct,
      pat: m.pat,
      patMarginPct: m.patMarginPct,
      cogs: m.cogs,
      cogsPctOfRevenue: Number(((m.cogs / rev) * 100).toFixed(1)),
      employeeExpense: m.employeeExpense,
      employeePctOfRevenue: Number(((m.employeeExpense / rev) * 100).toFixed(1)),
      operatingExpenses: m.operatingExpenses,
      opexPctOfRevenue: Number(((m.operatingExpenses / rev) * 100).toFixed(1)),
      totalExpenses: m.totalExpenses,
      expenseRatioPct: Number(((m.totalExpenses / rev) * 100).toFixed(1)),
    };
  });
}

/**
 * Generates Quarterly comparison for P&L (Q1 FY26-27 vs Q2 FY26-27)
 */
export function getPnlQuarterlyComparison(
  monthlySummaries: PnlMonthSummary[],
): PnlComparisonMetric[] {
  if (!monthlySummaries || monthlySummaries.length === 0) return [];

  // Q1: Apr, May, Jun (indexes 0, 1, 2)
  const q1Months = monthlySummaries.filter((m) =>
    ["April", "May", "June"].some((q) => m.month.includes(q)),
  );
  // Q2: Jul, Aug, Sep (indexes 3, 4, 5)
  const q2Months = monthlySummaries.filter((m) =>
    ["July", "August", "September"].some((q) => m.month.includes(q)),
  );

  const aggregateQuarter = (
    months: PnlMonthSummary[],
    quarterName: string,
    shortName: string,
  ): PnlComparisonMetric => {
    const rev = months.reduce((acc, m) => acc + m.revenue, 0);
    const cogs = months.reduce((acc, m) => acc + m.cogs, 0);
    const emp = months.reduce((acc, m) => acc + m.employeeExpense, 0);
    const opex = months.reduce((acc, m) => acc + m.operatingExpenses, 0);
    const totalExp = months.reduce((acc, m) => acc + m.totalExpenses, 0);
    const ebitda = months.reduce((acc, m) => acc + m.ebitda, 0);
    const pat = months.reduce((acc, m) => acc + m.pat, 0);
    const gp = rev - cogs;

    const safeRev = rev || 1;
    return {
      period: quarterName,
      shortPeriod: shortName,
      periodType: "quarter" as const,
      revenue: rev,
      revenueLakhs: Number((rev / 100000).toFixed(2)),
      grossProfit: gp,
      grossMarginPct: Number(((gp / safeRev) * 100).toFixed(1)),
      ebitda: ebitda,
      ebitdaMarginPct: Number(((ebitda / safeRev) * 100).toFixed(1)),
      pat: pat,
      patMarginPct: Number(((pat / safeRev) * 100).toFixed(1)),
      cogs: cogs,
      cogsPctOfRevenue: Number(((cogs / safeRev) * 100).toFixed(1)),
      employeeExpense: emp,
      employeePctOfRevenue: Number(((emp / safeRev) * 100).toFixed(1)),
      operatingExpenses: opex,
      opexPctOfRevenue: Number(((opex / safeRev) * 100).toFixed(1)),
      totalExpenses: totalExp,
      expenseRatioPct: Number(((totalExp / safeRev) * 100).toFixed(1)),
    };
  };

  const q1 = aggregateQuarter(q1Months, "Q1 FY 2026-27 (Apr–Jun)", "Q1 FY27");
  const q2 = aggregateQuarter(q2Months, "Q2 FY 2026-27 (Jul–Sep)", "Q2 FY27");

  return [q1, q2];
}
