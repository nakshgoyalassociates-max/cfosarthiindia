import { RepositoryItem } from "../types";

export type RepositoryCategory = "all" | "income_tax" | "gst" | "legal" | "renewals" | "sop";

export interface RepositoryCategoryMeta {
  id: RepositoryCategory;
  label: string;
  shortLabel: string;
  badgeLabel: string;
  description: string;
  theme: "indigo" | "emerald" | "amber" | "purple" | "teal" | "slate";
  badgeClasses: string;
  borderClasses: string;
  bgLightClasses: string;
  textClasses: string;
  kpiLabel: string;
}

/**
 * Classifies any repository item into one of the 5 categories:
 * 1. Income Tax (Direct Tax, Scrutiny u/s 143(3), ITAT, TDS, Reopening u/s 148)
 * 2. GST (GST Audits u/s 65, DRC-01/DRC-07 SCNs, ITC reconciliations, Customs/VAT)
 * 3. Legal (Civil/Commercial disputes, NCLT, Sec 138, Labor, High Court, Trademark)
 * 4. Renewals & Licenses (Factory licenses, Environmental consents, Fire NOCs, ISO, Trade licenses)
 * 5. SOPs (Standard Operating Procedures: AP 3-Way Match, Statutory Calendars, Payroll, MIS Fast-Close, Internal Controls)
 */
export function classifyRepositoryItem(
  item: RepositoryItem,
): "income_tax" | "gst" | "legal" | "renewals" | "sop" {
  if (item.type === "sop") {
    return "sop";
  }
  if (item.type === "legal_case") {
    return "legal";
  }
  if (item.type === "license_certification") {
    return "renewals";
  }
  if (item.type === "tax_assessment") {
    const cat = (item.taxCategory || "").toLowerCase();
    if (
      cat.includes("gst") ||
      cat.includes("customs") ||
      cat.includes("excise") ||
      cat.includes("vat") ||
      cat.includes("indirect")
    ) {
      return "gst";
    }
    return "income_tax";
  }
  return "income_tax";
}

export const REPOSITORY_CATEGORY_METAS: Record<RepositoryCategory, RepositoryCategoryMeta> = {
  all: {
    id: "all",
    label: "All Repository Matters",
    shortLabel: "All Items",
    badgeLabel: "Corporate Docket",
    description:
      "Consolidated archive of Direct Tax, GST Audits, Legal Litigations, Statutory Renewals, and Standard Operating Procedures (SOPs).",
    theme: "slate",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-200",
    borderClasses: "border-slate-300",
    bgLightClasses: "bg-slate-50",
    textClasses: "text-slate-900",
    kpiLabel: "Total Matters",
  },
  income_tax: {
    id: "income_tax",
    label: "Income Tax Assessments",
    shortLabel: "Income Tax",
    badgeLabel: "Income Tax",
    description:
      "Scrutiny u/s 143(3), ITAT Tribunal Appeals, Reopening u/s 148, TDS/TCS & Transfer Pricing.",
    theme: "indigo",
    badgeClasses: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderClasses: "border-indigo-300 hover:border-indigo-400",
    bgLightClasses: "bg-indigo-50/70",
    textClasses: "text-indigo-900",
    kpiLabel: "Direct Tax Demand Exposure",
  },
  gst: {
    id: "gst",
    label: "GST & Indirect Taxes",
    shortLabel: "GST",
    badgeLabel: "GST",
    description:
      "Departmental Audits u/s 65, DRC-01/DRC-07 SCNs, Input Tax Credit queries, and GST Appeals.",
    theme: "emerald",
    badgeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClasses: "border-emerald-300 hover:border-emerald-400",
    bgLightClasses: "bg-emerald-50/70",
    textClasses: "text-emerald-900",
    kpiLabel: "GST Notice & Audit Exposure",
  },
  legal: {
    id: "legal",
    label: "Legal Cases & Litigations",
    shortLabel: "Legal",
    badgeLabel: "Legal Case",
    description:
      "Commercial disputes, NCLT insolvency, Section 138 recovery, Labor suits & Court proceedings.",
    theme: "amber",
    badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
    borderClasses: "border-amber-300 hover:border-amber-400",
    bgLightClasses: "bg-amber-50/70",
    textClasses: "text-amber-900",
    kpiLabel: "Contingent Exposure",
  },
  renewals: {
    id: "renewals",
    label: "Licenses & Renewal Items",
    shortLabel: "Renewal Items",
    badgeLabel: "License / Renewal",
    description:
      "Operating licenses, Environmental consents, Fire NOCs, ISO certifications & expiry renewals.",
    theme: "purple",
    badgeClasses: "bg-purple-50 text-purple-700 border-purple-200",
    borderClasses: "border-purple-300 hover:border-purple-400",
    bgLightClasses: "bg-purple-50/70",
    textClasses: "text-purple-900",
    kpiLabel: "Annual Fees & Upcoming Renewals",
  },
  sop: {
    id: "sop",
    label: "Standard Operating Procedures (SOPs)",
    shortLabel: "SOPs",
    badgeLabel: "SOP / Control",
    description:
      "Internal accounting controls, statutory workflows, 3-way matching, payroll runs, MIS cadence, and CFO governance policies.",
    theme: "teal",
    badgeClasses: "bg-teal-50 text-teal-800 border-teal-200",
    borderClasses: "border-teal-300 hover:border-teal-400",
    bgLightClasses: "bg-teal-50/70",
    textClasses: "text-teal-900",
    kpiLabel: "Active SOPs & Internal Controls",
  },
};

export function getRepositoryCategoryBadge(item: RepositoryItem): {
  category: "income_tax" | "gst" | "legal" | "renewals" | "sop";
  label: string;
  badgeClasses: string;
} {
  const cat = classifyRepositoryItem(item);
  const meta = REPOSITORY_CATEGORY_METAS[cat];
  return {
    category: cat,
    label: meta.badgeLabel,
    badgeClasses: meta.badgeClasses,
  };
}
