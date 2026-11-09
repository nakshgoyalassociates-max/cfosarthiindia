import {
  ThreeMonthCashBudgetModel,
  CashFlowWeekMeta,
  WeeklyCashFlowLineItem,
  ManagementShortageAction,
} from "../types";

export interface WeekCalculatedSummary {
  week: CashFlowWeekMeta;
  openingBudgetCash: number;
  openingActualCash: number;
  budgetInflows: number;
  actualInflows: number;
  budgetOutflows: number;
  actualOutflows: number;
  budgetNetMovement: number;
  actualNetMovement: number;
  closingBudgetCash: number;
  closingActualCash: number;
  hasActuals: boolean;
  varianceInflow: number;
  varianceOutflow: number;
  varianceNet: number;
  isDeficit: boolean;
  deficitAmount: number;
  isBufferBreached: boolean;
  bufferShortfall: number;
  shortageRisk: "none" | "low_buffer" | "critical_deficit";
  applicableActions: ManagementShortageAction[];
  actionsCashRelief: number;
  closingCashWithActions: number;
  isProtectedWithActions: boolean;
}

export interface MonthCalculatedSummary {
  monthIndex: number;
  monthName: string;
  weeks: WeekCalculatedSummary[];
  budgetInflows: number;
  actualInflows: number;
  budgetOutflows: number;
  actualOutflows: number;
  budgetNetMovement: number;
  actualNetMovement: number;
  closingCash: number;
  hasDeficit: boolean;
  hasBufferBreach: boolean;
}

export interface GrandCashBudgetSummary {
  startingCashBalance: number;
  minimumSafeBuffer: number;
  sanctionedODLimit: number;
  total3MBudgetInflow: number;
  total3MActualInflow: number;
  total3MBudgetOutflow: number;
  total3MActualOutflow: number;
  total3MBudgetNet: number;
  total3MActualNet: number;
  finalProjectedCash: number;
  lowestCashWeek: WeekCalculatedSummary;
  criticalDeficitWeeksCount: number;
  bufferBreachedWeeksCount: number;
  months: MonthCalculatedSummary[];
  weeklySummaries: WeekCalculatedSummary[];
  totalActionsRelief: number;
}

export function computeWeeklyCashFlowSummary(
  model: ThreeMonthCashBudgetModel,
): GrandCashBudgetSummary {
  const { startingCashBalance, minimumSafeBuffer, weeks, items, shortageActions } = model;

  const weeklySummaries: WeekCalculatedSummary[] = [];

  let prevBudgetClosing = startingCashBalance;
  let prevActualClosing = startingCashBalance;

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const weekId = week.id;

    let bInflows = 0;
    let aInflows = 0;
    let bOutflows = 0;
    let aOutflows = 0;
    let hasActualsForWeek = false;

    items.forEach((item) => {
      const data = item.weekly[weekId];
      const bgt = data ? Number(data.budget) || 0 : 0;
      const act = data && typeof data.actual === "number" ? Number(data.actual) : undefined;

      if (act !== undefined) {
        hasActualsForWeek = true;
      }

      if (item.category === "inflow") {
        bInflows += bgt;
        aInflows += act !== undefined ? act : bgt;
      } else {
        bOutflows += bgt;
        aOutflows += act !== undefined ? act : bgt;
      }
    });

    const bNet = bInflows - bOutflows;
    const aNet = aInflows - aOutflows;

    const openBudget = prevBudgetClosing;
    const closeBudget = openBudget + bNet;

    // Rolling actual cash: Week 1 starts with startingCashBalance. Subsequent weeks start with previous week's closing actual/hybrid cash
    const openActual = prevActualClosing;
    const closeActual = openActual + aNet;

    // Management shortage actions for this week
    const weekActions = shortageActions.filter((a) => a.weekId === weekId);
    const approvedActionsRelief = weekActions
      .filter((a) => a.status === "approved" || a.status === "executed")
      .reduce((sum, a) => sum + (Number(a.impactAmount) || 0), 0);

    const closeWithActions = closeActual + approvedActionsRelief;

    const isDeficit = closeActual < 0;
    const deficitAmount = isDeficit ? Math.abs(closeActual) : 0;
    const isBufferBreached = closeActual < minimumSafeBuffer;
    const bufferShortfall = isBufferBreached ? Math.max(0, minimumSafeBuffer - closeActual) : 0;

    let shortageRisk: "none" | "low_buffer" | "critical_deficit" = "none";
    if (isDeficit) {
      shortageRisk = "critical_deficit";
    } else if (isBufferBreached) {
      shortageRisk = "low_buffer";
    }

    const isProtectedWithActions = closeWithActions >= minimumSafeBuffer;

    const summary: WeekCalculatedSummary = {
      week,
      openingBudgetCash: openBudget,
      openingActualCash: openActual,
      budgetInflows: bInflows,
      actualInflows: aInflows,
      budgetOutflows: bOutflows,
      actualOutflows: aOutflows,
      budgetNetMovement: bNet,
      actualNetMovement: aNet,
      closingBudgetCash: closeBudget,
      closingActualCash: closeActual,
      hasActuals: hasActualsForWeek,
      varianceInflow: aInflows - bInflows,
      varianceOutflow: aOutflows - bOutflows,
      varianceNet: aNet - bNet,
      isDeficit,
      deficitAmount,
      isBufferBreached,
      bufferShortfall,
      shortageRisk,
      applicableActions: weekActions,
      actionsCashRelief: approvedActionsRelief,
      closingCashWithActions: closeWithActions,
      isProtectedWithActions,
    };

    weeklySummaries.push(summary);

    // Roll forward for next week
    prevBudgetClosing = closeBudget;
    prevActualClosing = closeActual;
  }

  // Monthly Rollups
  const monthNames = model.months;
  const monthSummaries: MonthCalculatedSummary[] = [0, 1, 2].map((mIdx) => {
    const monthWeeks = weeklySummaries.filter((w) => w.week.monthIndex === mIdx);
    const mBudgetInflow = monthWeeks.reduce((acc, w) => acc + w.budgetInflows, 0);
    const mActualInflow = monthWeeks.reduce((acc, w) => acc + w.actualInflows, 0);
    const mBudgetOutflow = monthWeeks.reduce((acc, w) => acc + w.budgetOutflows, 0);
    const mActualOutflow = monthWeeks.reduce((acc, w) => acc + w.actualOutflows, 0);
    const mBudgetNet = mBudgetInflow - mBudgetOutflow;
    const mActualNet = mActualInflow - mActualOutflow;
    const lastWeek = monthWeeks[monthWeeks.length - 1];

    return {
      monthIndex: mIdx,
      monthName: monthNames[mIdx] || `Month ${mIdx + 1}`,
      weeks: monthWeeks,
      budgetInflows: mBudgetInflow,
      actualInflows: mActualInflow,
      budgetOutflows: mBudgetOutflow,
      actualOutflows: mActualOutflow,
      budgetNetMovement: mBudgetNet,
      actualNetMovement: mActualNet,
      closingCash: lastWeek ? lastWeek.closingActualCash : 0,
      hasDeficit: monthWeeks.some((w) => w.isDeficit),
      hasBufferBreach: monthWeeks.some((w) => w.isBufferBreached),
    };
  });

  // Grand Totals
  const total3MBudgetInflow = weeklySummaries.reduce((sum, w) => sum + w.budgetInflows, 0);
  const total3MActualInflow = weeklySummaries.reduce((sum, w) => sum + w.actualInflows, 0);
  const total3MBudgetOutflow = weeklySummaries.reduce((sum, w) => sum + w.budgetOutflows, 0);
  const total3MActualOutflow = weeklySummaries.reduce((sum, w) => sum + w.actualOutflows, 0);
  const total3MBudgetNet = total3MBudgetInflow - total3MBudgetOutflow;
  const total3MActualNet = total3MActualInflow - total3MActualOutflow;

  const finalProjectedCash =
    weeklySummaries.length > 0 ? weeklySummaries[weeklySummaries.length - 1].closingActualCash : 0;

  // Find lowest cash week (the valley)
  let lowestCashWeek = weeklySummaries[0];
  weeklySummaries.forEach((w) => {
    if (w.closingActualCash < lowestCashWeek.closingActualCash) {
      lowestCashWeek = w;
    }
  });

  const criticalDeficitWeeksCount = weeklySummaries.filter((w) => w.isDeficit).length;
  const bufferBreachedWeeksCount = weeklySummaries.filter((w) => w.isBufferBreached).length;

  const totalActionsRelief = shortageActions
    .filter((a) => a.status === "approved" || a.status === "executed")
    .reduce((sum, a) => sum + (Number(a.impactAmount) || 0), 0);

  return {
    startingCashBalance,
    minimumSafeBuffer,
    sanctionedODLimit: model.sanctionedODLimit,
    total3MBudgetInflow,
    total3MActualInflow,
    total3MBudgetOutflow,
    total3MActualOutflow,
    total3MBudgetNet,
    total3MActualNet,
    finalProjectedCash,
    lowestCashWeek,
    criticalDeficitWeeksCount,
    bufferBreachedWeeksCount,
    months: monthSummaries,
    weeklySummaries,
    totalActionsRelief,
  };
}
