import { BalanceSheetData, BalanceSheetSnapshot } from "../types";

export interface BalanceSheetPeriodMetrics {
  period: string;
  shortPeriod: string;
  periodType: "month" | "quarter";
  totalAssets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  cashAndBank: number;
  tradeReceivables: number;
  netWorth: number;
  totalDebt: number;
  currentLiabilities: number;
  workingCapital: number;
  // Key Financial Percentages & Ratios
  currentRatio: number; // e.g. 4.14x
  currentRatioPct: number; // e.g. 414%
  quickRatio: number; // e.g. 2.99x
  quickRatioPct: number; // e.g. 299%
  debtToEquityPct: number; // e.g. 27.6%
  workingCapitalPctOfAssets: number; // e.g. 44.0%
  currentAssetsPctOfAssets: number; // e.g. 58.0%
  nonCurrentAssetsPctOfAssets: number; // e.g. 42.0%
  cashPctOfAssets: number; // e.g. 18.9%
  receivablesPctOfCurrentAssets: number; // e.g. 11.8%
  netWorthPctOfLiabilities: number; // e.g. 68.7%
}

/**
 * Shared Quick Ratio definition across ratios.ts and balanceSheetMetrics.ts:
 * (Cash + Bank + Receivables + Short-term investments) / Current Liabilities
 */
export function computeQuickRatio(
  cashAndBank: number | null | undefined,
  receivables: number | null | undefined,
  shortTermInvestments: number | null | undefined,
  currentLiabilities: number | null | undefined,
): number | null {
  if (currentLiabilities === null || currentLiabilities === undefined || currentLiabilities <= 0) {
    return null;
  }
  const cash = cashAndBank ?? 0;
  const rec = receivables ?? 0;
  const stInv = shortTermInvestments ?? 0;
  const quickAssets = cash + rec + stInv;
  return Number((quickAssets / currentLiabilities).toFixed(2));
}

/**
 * Computes balance sheet key percentage metrics for a given snapshot
 */
export function computeBalanceSheetRatios(
  totalAssets: number,
  currentAssets: number,
  nonCurrentAssets: number,
  cashAndBank: number,
  tradeReceivables: number,
  netWorth: number,
  totalDebt: number,
  currentLiabilities: number,
  shortTermInvestments: number = 0,
): Omit<BalanceSheetPeriodMetrics, "period" | "shortPeriod" | "periodType"> {
  const workingCapital = currentAssets - currentLiabilities;
  const currentRatio =
    currentLiabilities > 0 ? Number((currentAssets / currentLiabilities).toFixed(2)) : 0;
  const currentRatioPct =
    currentLiabilities > 0 ? Number(((currentAssets / currentLiabilities) * 100).toFixed(1)) : 0;

  const quickRatioVal = computeQuickRatio(
    cashAndBank,
    tradeReceivables,
    shortTermInvestments,
    currentLiabilities,
  );
  const quickRatio = quickRatioVal ?? 0;
  const quickRatioPct = quickRatioVal !== null ? Number((quickRatioVal * 100).toFixed(1)) : 0;

  const debtToEquityPct = netWorth > 0 ? Number(((totalDebt / netWorth) * 100).toFixed(1)) : 0;
  const workingCapitalPctOfAssets =
    totalAssets > 0 ? Number(((workingCapital / totalAssets) * 100).toFixed(1)) : 0;
  const currentAssetsPctOfAssets =
    totalAssets > 0 ? Number(((currentAssets / totalAssets) * 100).toFixed(1)) : 0;
  const nonCurrentAssetsPctOfAssets =
    totalAssets > 0 ? Number(((nonCurrentAssets / totalAssets) * 100).toFixed(1)) : 0;
  const cashPctOfAssets =
    totalAssets > 0 ? Number(((cashAndBank / totalAssets) * 100).toFixed(1)) : 0;
  const receivablesPctOfCurrentAssets =
    currentAssets > 0 ? Number(((tradeReceivables / currentAssets) * 100).toFixed(1)) : 0;
  const netWorthPctOfLiabilities =
    totalAssets > 0 ? Number(((netWorth / totalAssets) * 100).toFixed(1)) : 0;

  return {
    totalAssets,
    currentAssets,
    nonCurrentAssets,
    cashAndBank,
    tradeReceivables,
    netWorth,
    totalDebt,
    currentLiabilities,
    workingCapital,
    currentRatio,
    currentRatioPct,
    quickRatio,
    quickRatioPct,
    debtToEquityPct,
    workingCapitalPctOfAssets,
    currentAssetsPctOfAssets,
    nonCurrentAssetsPctOfAssets,
    cashPctOfAssets,
    receivablesPctOfCurrentAssets,
    netWorthPctOfLiabilities,
  };
}

/**
 * Generates monthly comparative balance sheet metrics from real stored snapshots only.
 * If absent or fewer than 2 snapshots, returns an empty array.
 */
export function getBalanceSheetMonthlyComparison(
  activeBs: BalanceSheetData,
): BalanceSheetPeriodMetrics[] {
  const snapshots: BalanceSheetSnapshot[] = activeBs?.monthlySnapshots || activeBs?.snapshots || [];

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  return snapshots.map((snap) => {
    const totalAssets = snap.totalAssets ?? snap.assets?.totalAssets ?? 0;
    const currentAssets = snap.currentAssets ?? snap.assets?.totalCurrentAssets ?? 0;
    const nonCurrentAssets = snap.nonCurrentAssets ?? snap.assets?.totalNonCurrentAssets ?? 0;
    const cashAndBank =
      snap.cashAndBank ??
      (snap.assets
        ? (snap.assets.cashAndCashEquivalents ?? 0) + (snap.assets.bankBalancesOther ?? 0)
        : 0);
    const tradeReceivables =
      snap.tradeReceivables ??
      snap.assets?.netTradeReceivables ??
      snap.assets?.tradeReceivables ??
      0;
    const netWorth = snap.netWorth ?? snap.equityAndLiabilities?.totalShareholdersFunds ?? 0;
    const totalDebt =
      snap.totalDebt ??
      (snap.equityAndLiabilities
        ? (snap.equityAndLiabilities.longTermBorrowings ?? 0) +
          (snap.equityAndLiabilities.shortTermBorrowings ?? 0)
        : 0);
    const currentLiabilities =
      snap.currentLiabilities ?? snap.equityAndLiabilities?.totalCurrentLiabilities ?? 0;
    const shortTermInvestments = (snap.assets as any)?.shortTermInvestments ?? 0;

    return {
      period: snap.period,
      shortPeriod: snap.shortPeriod || snap.period,
      periodType: "month" as const,
      ...computeBalanceSheetRatios(
        totalAssets,
        currentAssets,
        nonCurrentAssets,
        cashAndBank,
        tradeReceivables,
        netWorth,
        totalDebt,
        currentLiabilities,
        shortTermInvestments,
      ),
    };
  });
}

/**
 * Generates quarterly comparative balance sheet metrics from real stored snapshots only.
 * If absent, returns an empty array.
 */
export function getBalanceSheetQuarterlyComparison(
  activeBs: BalanceSheetData,
): BalanceSheetPeriodMetrics[] {
  const snapshots: BalanceSheetSnapshot[] = activeBs?.quarterlySnapshots || [];

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  return snapshots.map((snap) => {
    const totalAssets = snap.totalAssets ?? snap.assets?.totalAssets ?? 0;
    const currentAssets = snap.currentAssets ?? snap.assets?.totalCurrentAssets ?? 0;
    const nonCurrentAssets = snap.nonCurrentAssets ?? snap.assets?.totalNonCurrentAssets ?? 0;
    const cashAndBank =
      snap.cashAndBank ??
      (snap.assets
        ? (snap.assets.cashAndCashEquivalents ?? 0) + (snap.assets.bankBalancesOther ?? 0)
        : 0);
    const tradeReceivables =
      snap.tradeReceivables ??
      snap.assets?.netTradeReceivables ??
      snap.assets?.tradeReceivables ??
      0;
    const netWorth = snap.netWorth ?? snap.equityAndLiabilities?.totalShareholdersFunds ?? 0;
    const totalDebt =
      snap.totalDebt ??
      (snap.equityAndLiabilities
        ? (snap.equityAndLiabilities.longTermBorrowings ?? 0) +
          (snap.equityAndLiabilities.shortTermBorrowings ?? 0)
        : 0);
    const currentLiabilities =
      snap.currentLiabilities ?? snap.equityAndLiabilities?.totalCurrentLiabilities ?? 0;
    const shortTermInvestments = (snap.assets as any)?.shortTermInvestments ?? 0;

    return {
      period: snap.period,
      shortPeriod: snap.shortPeriod || snap.period,
      periodType: "quarter" as const,
      ...computeBalanceSheetRatios(
        totalAssets,
        currentAssets,
        nonCurrentAssets,
        cashAndBank,
        tradeReceivables,
        netWorth,
        totalDebt,
        currentLiabilities,
        shortTermInvestments,
      ),
    };
  });
}
