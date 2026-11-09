/**
 * Indian Financial & Currency Formatting Utility
 * Standardizes currency, Lakhs/Crores notations, percentages, and variances
 * according to Indian statutory and accounting conventions (en-IN).
 */

export interface CurrencyFormatOptions {
  compact?: boolean;
  showSymbol?: boolean;
  decimals?: number;
  showSign?: boolean;
}

/**
 * Formats a number in Indian Rupee format (e.g. ₹1,23,45,678 or ₹1.23 Cr)
 */
export function formatINR(amount?: number | null, compact = false, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "—";
  }

  if (compact) {
    return formatCompactINR(amount, decimals);
  }

  const hasDecimals = decimals > 0 && Math.abs(amount) % 1 !== 0;
  const formatted = Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  });

  const sign = amount < 0 ? "-" : "";
  return `${sign}₹${formatted}`;
}

/**
 * Compact Indian currency formatting (Cr for Crores, L for Lakhs, K for Thousands)
 */
export function formatCompactINR(amount?: number | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "—";
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const inCrores = abs / 10000000;
    return `${sign}₹${inCrores.toFixed(decimals)} Cr`;
  }

  if (abs >= 100000) {
    // 1 Lakh = 100,000
    const inLakhs = abs / 100000;
    return `${sign}₹${inLakhs.toFixed(decimals)} L`;
  }

  if (abs >= 1000) {
    // Thousands
    const inThousands = abs / 1000;
    return `${sign}₹${inThousands.toFixed(decimals > 0 ? 1 : 0)} K`;
  }

  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

/**
 * Formats amount explicitly in Lakhs (e.g., 1200000 -> "₹12.00L")
 */
export function formatLakhs(amount?: number | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "—";
  }
  if (Math.abs(amount) >= 10000000) {
    const inCrores = amount / 10000000;
    return `₹${inCrores.toFixed(decimals)} Cr`;
  }
  const inLakhs = amount / 100000;
  return `₹${inLakhs.toFixed(decimals)}L`;
}

/**
 * Formats amount explicitly in Crores (e.g., 15000000 -> "₹1.50 Cr")
 */
export function formatCrores(amount?: number | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "—";
  }
  const inCrores = amount / 10000000;
  return `₹${inCrores.toFixed(decimals)} Cr`;
}

export const formatLakh = formatLakhs;
export const formatCrore = formatCrores;
export const formatPct = formatPercent;

export type NumberDisplayUnit = "full" | "lakh" | "crore";

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatWithUnit(
  amount?: number | null,
  unit: NumberDisplayUnit = "full",
  decimals = 2,
): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "—";
  if (unit === "crore") return formatCrores(amount, decimals);
  if (unit === "lakh") return formatLakhs(amount, decimals);
  return formatINR(amount, false, decimals);
}

/**
 * Generic currency formatter with flexible options
 */
export function formatCurrency(amount?: number | null, options?: CurrencyFormatOptions): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "—";
  }

  const { compact = false, showSymbol = true, decimals = 2, showSign = false } = options || {};

  if (compact) {
    const compactStr = formatCompactINR(amount, decimals);
    return showSymbol ? compactStr : compactStr.replace("₹", "");
  }

  const hasDecimals = decimals > 0 && Math.abs(amount) % 1 !== 0;
  const numStr = Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  });

  const sign = amount < 0 ? "-" : showSign && amount > 0 ? "+" : "";
  const symbol = showSymbol ? "₹" : "";
  return `${sign}${symbol}${numStr}`;
}

/**
 * Formats a percentage value (e.g. 14.5 -> "14.5%")
 */
export function formatPercent(value?: number | null, decimals = 1, showSign = false): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "—";
  }
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formats variance with sign, currency and percentage (e.g. "+₹45,000 (+3.2%)")
 */
export function formatVariance(varianceAmount: number, variancePercent?: number): string {
  const sign = varianceAmount > 0 ? "+" : varianceAmount < 0 ? "-" : "";
  const absAmount = Math.abs(varianceAmount).toLocaleString("en-IN");
  const amountStr = `${sign}₹${absAmount}`;

  if (variancePercent !== undefined && !isNaN(variancePercent)) {
    const pctSign = variancePercent > 0 ? "+" : "";
    return `${amountStr} (${pctSign}${variancePercent.toFixed(1)}%)`;
  }

  return amountStr;
}
