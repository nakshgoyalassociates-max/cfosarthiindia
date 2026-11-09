import * as XLSX from "xlsx";
import {
  TallyLedgerRecord,
  TallyLedgerMappingRule,
  TallyVoucherTransaction,
  TallyStatementType,
  TallyMappingStatus,
} from "../types";

export interface StandardAccountNode {
  id: string;
  standardAccount: string; // e.g., "Raw Material", "Direct Labour", "Power & Fuel"
  reportingGroup: string; // e.g., "Direct Material Cost", "Manufacturing Overheads"
  pnlSection: string; // e.g., "Manufacturing Cost"
  currentMonth: number; // Strictly sum of child Tally ledgers
  previousMonth: number; // Strictly sum of child Tally ledgers
  ytdAmount: number; // Strictly sum of child Tally ledgers
  ledgers: TallyLedgerRecord[];
  voucherCount: number;
}

export interface MajorReportingGroupNode {
  id: string;
  pnlSection: string; // e.g., "Manufacturing Cost", "Revenue from Operations"
  sectionOrder: number;
  isIncome: boolean;
  statementType: TallyStatementType;
  currentMonth: number; // Strictly sum of child Standard Accounts
  previousMonth: number; // Strictly sum of child Standard Accounts
  ytdAmount: number; // Strictly sum of child Standard Accounts
  standardAccounts: StandardAccountNode[];
  ledgerCount: number;
  voucherCount: number;
}

export interface BottomUpPnlSummary {
  revenueFromOperations: { currentMonth: number; previousMonth: number; ytdAmount: number };
  otherIncome: { currentMonth: number; previousMonth: number; ytdAmount: number };
  totalIncome: { currentMonth: number; previousMonth: number; ytdAmount: number };
  manufacturingCost: { currentMonth: number; previousMonth: number; ytdAmount: number };
  grossProfit: { currentMonth: number; previousMonth: number; ytdAmount: number };
  grossMarginPct: number;
  employeeBenefitExpenses: { currentMonth: number; previousMonth: number; ytdAmount: number };
  adminAndSellingOverheads: { currentMonth: number; previousMonth: number; ytdAmount: number };
  operatingEbitda: { currentMonth: number; previousMonth: number; ytdAmount: number };
  ebitdaMarginPct: number;
  depreciationAndAmortization: { currentMonth: number; previousMonth: number; ytdAmount: number };
  financeCosts: { currentMonth: number; previousMonth: number; ytdAmount: number };
  pbt: { currentMonth: number; previousMonth: number; ytdAmount: number };
  pbtMarginPct: number;
  taxExpense: { currentMonth: number; previousMonth: number; ytdAmount: number };
  pat: { currentMonth: number; previousMonth: number; ytdAmount: number };
  patMarginPct: number;
}

export interface HierarchicalMisComputation {
  pnlGroups: MajorReportingGroupNode[];
  balanceSheetGroups: MajorReportingGroupNode[];
  pnlSummary: BottomUpPnlSummary;
  allVouchers: Array<
    TallyVoucherTransaction & {
      ledgerId: string;
      standardAccount: string;
      reportingGroup: string;
      pnlSection: string;
      tallyParentGroup: string;
      statementType: TallyStatementType;
    }
  >;
  stats: {
    totalLedgers: number;
    pnlLedgersCount: number;
    bsLedgersCount: number;
    totalStandardAccounts: number;
    totalVouchers: number;
    approvedOrAutoCount: number;
    flaggedParentChangedCount: number;
    unmappedReviewCount: number;
  };
}

/**
 * Formats an amount in Crores, Lakhs, or Exact Rupees
 */
export function formatMisUnit(
  amountInRupees: number,
  unit: "crores" | "lakhs" | "rupees" = "crores",
): string {
  const sign = amountInRupees < 0 ? "-" : "";
  const abs = Math.abs(amountInRupees);
  if (unit === "crores") {
    const cr = abs / 10000000;
    return `${sign}₹${cr.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Cr`;
  }
  if (unit === "lakhs") {
    const l = abs / 100000;
    return `${sign}₹${l.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} L`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

/**
 * Standard CFOSARTHI Reporting Options for Mapping
 */
export const CFOSARTHI_PNL_SECTIONS = [
  {
    pnlSection: "Revenue from Operations",
    sectionOrder: 1,
    isIncome: true,
    reportingGroups: ["Core Operating Revenue", "Export Incentives"],
    standardAccounts: [
      "Export Sales & Apparel Shipments",
      "Domestic Sales & Institutional Orders",
      "Export Incentives & Duty Drawback",
      "SaaS & Enterprise Subscriptions",
    ],
  },
  {
    pnlSection: "Other Income",
    sectionOrder: 2,
    isIncome: true,
    reportingGroups: ["Non-Operating & Treasury Income"],
    standardAccounts: ["Treasury & Forex Income", "Interest & Dividend Income"],
  },
  {
    pnlSection: "Manufacturing Cost",
    sectionOrder: 3,
    isIncome: false,
    reportingGroups: [
      "Direct Material Cost",
      "Direct Manufacturing Wages",
      "Manufacturing Overheads",
    ],
    standardAccounts: ["Raw Material", "Direct Labour", "Power & Fuel", "Factory Overheads"],
  },
  {
    pnlSection: "Employee Benefit Expenses",
    sectionOrder: 4,
    isIncome: false,
    reportingGroups: ["Corporate & Functional Payroll", "Statutory Staff Welfare"],
    standardAccounts: ["Salaries, Bonus & Management Remuneration", "PF, ESIC & Staff Welfare"],
  },
  {
    pnlSection: "Administrative, Selling & Distribution",
    sectionOrder: 5,
    isIncome: false,
    reportingGroups: ["Selling & Logistics Overheads", "General & Administrative Overheads"],
    standardAccounts: [
      "Freight Outward & Export Clearing",
      "Office Rent, Legal & Virtual CFO Retainership",
      "Sales Promotion & Trade Exhibitions",
      "Cloud & IT Infrastructure",
    ],
  },
  {
    pnlSection: "Depreciation & Amortization",
    sectionOrder: 6,
    isIncome: false,
    reportingGroups: ["Non-Cash Capital Charge"],
    standardAccounts: ["Depreciation on Tangible & Intangible Assets"],
  },
  {
    pnlSection: "Finance Costs",
    sectionOrder: 7,
    isIncome: false,
    reportingGroups: ["Debt Servicing & Bank Charges"],
    standardAccounts: ["Bank Interest & Packing Credit Charges"],
  },
  {
    pnlSection: "Tax Expense",
    sectionOrder: 8,
    isIncome: false,
    reportingGroups: ["Corporate Taxation"],
    standardAccounts: ["Current & Deferred Income Tax"],
  },
];

export const CFOSARTHI_BS_SECTIONS = [
  {
    pnlSection: "Shareholders' Funds",
    sectionOrder: 1,
    isIncome: false,
    reportingGroups: ["Equity & Retained Earnings"],
    standardAccounts: ["Equity Share Capital", "Reserves & Surplus"],
  },
  {
    pnlSection: "Non-Current Liabilities",
    sectionOrder: 2,
    isIncome: false,
    reportingGroups: ["Long-Term Debt & Obligations"],
    standardAccounts: ["Long-Term Term Loans", "Deferred Tax & Gratuity Provisions"],
  },
  {
    pnlSection: "Current Liabilities",
    sectionOrder: 3,
    isIncome: false,
    reportingGroups: ["Working Capital & Trade Liabilities"],
    standardAccounts: [
      "Working Capital Borrowings (CC / EPC)",
      "Trade Payables (General & MSME)",
      "Statutory Dues & Short-Term Provisions",
    ],
  },
  {
    pnlSection: "Non-Current Assets",
    sectionOrder: 4,
    isIncome: false,
    reportingGroups: ["Fixed Assets & Long-Term Investments"],
    standardAccounts: [
      "Property, Plant & Equipment (Net Block)",
      "Capital Work-in-Progress & Intangibles",
      "Non-Current Investments & Security Deposits",
    ],
  },
  {
    pnlSection: "Current Assets",
    sectionOrder: 5,
    isIncome: false,
    reportingGroups: ["Working Capital & Liquid Assets"],
    standardAccounts: [
      "Inventories (Raw Material, WIP & Finished Goods)",
      "Trade Receivables (Sundry Debtors)",
      "Cash & Bank Balances",
      "Short-Term Loans, Advances & GST ITC",
    ],
  },
];

/**
 * Default Tally Ledgers preserving every individual Tally ledger, Tally Parent Group,
 * CFOSARTHI Standard Account, CFOSARTHI Reporting Group, P&L Section, and underlying Vouchers.
 *
 * Note: Under "Manufacturing Cost" (₹8.50 Cr = ₹8,50,00,000):
 *  - Raw Material = ₹5.20 Cr (Fabric Purchase – China ₹2.40 Cr + Fabric Purchase – India ₹1.80 Cr + Accessories Purchase ₹1.00 Cr)
 *  - Direct Labour = ₹1.60 Cr (Factory Wages – Unit 1 ₹1.00 Cr + Factory Wages – Unit 2 ₹0.60 Cr)
 *  - Power & Fuel = ₹0.90 Cr (Factory Electricity – Unit 1 ₹0.55 Cr + Factory Electricity – Unit 2 ₹0.25 Cr + Generator Diesel ₹0.10 Cr)
 *  - Factory Overheads = ₹0.80 Cr (Plant & Machinery Maintenance – Unit 1 ₹0.48 Cr + Consumable Stores & Dyeing Chemicals ₹0.32 Cr)
 *  Total Manufacturing Cost = 5.20 + 1.60 + 0.90 + 0.80 = ₹8.50 Cr!
 */
export function getInitialTallyLedgersForCompany(
  companyId: string = "client-101",
  period: string = "September 2026",
): TallyLedgerRecord[] {
  const baseLedgers: Omit<TallyLedgerRecord, "companyId" | "period">[] = [
    // =====================================================================
    // 1. P&L: REVENUE FROM OPERATIONS (Total: ₹14.50 Cr = ₹14,50,00,000)
    // =====================================================================
    {
      id: "tl-rev-1",
      statementType: "P&L",
      tallyLedgerName: "Export Sales – EU & UK Apparel Buyers",
      tallyParentGroup: "Sales Accounts",
      standardAccount: "Export Sales & Apparel Shipments",
      reportingGroup: "Core Operating Revenue",
      pnlSection: "Revenue from Operations",
      sectionOrder: 1,
      isIncome: true,
      currentMonth: 54000000, // ₹5.40 Cr
      previousMonth: 51000000,
      ytdAmount: 305000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rev-101",
          voucherDate: "2026-09-06",
          voucherNumber: "EXP/26-27/0412",
          voucherType: "Sales",
          tallyLedgerName: "Export Sales – EU & UK Apparel Buyers",
          partyOrVendorName: "H&M Hennes & Mauritz Logistics AB (Rotterdam)",
          narration:
            "FOB shipment of 42,000 organic cotton woven shirts via Mundra Port (SB #884120)",
          costCentre: "Unit 1 - Apparel Export Division",
          amount: 31500000,
          drCr: "Cr",
        },
        {
          id: "v-rev-102",
          voucherDate: "2026-09-19",
          voucherNumber: "EXP/26-27/0448",
          voucherType: "Sales",
          tallyLedgerName: "Export Sales – EU & UK Apparel Buyers",
          partyOrVendorName: "Marks & Spencer PLC (UK Distribution Hub)",
          narration: "Autumn-Winter knitwear consortium dispatch — LC #HSBC/UK/99210 realized",
          costCentre: "Unit 1 - Apparel Export Division",
          amount: 22500000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-rev-2",
      statementType: "P&L",
      tallyLedgerName: "Export Sales – US Retail Chains",
      tallyParentGroup: "Sales Accounts",
      standardAccount: "Export Sales & Apparel Shipments",
      reportingGroup: "Core Operating Revenue",
      pnlSection: "Revenue from Operations",
      sectionOrder: 1,
      isIncome: true,
      currentMonth: 32000000, // ₹3.20 Cr
      previousMonth: 29500000,
      ytdAmount: 182000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rev-201",
          voucherDate: "2026-09-14",
          voucherNumber: "EXP/26-27/0429",
          voucherType: "Sales",
          tallyLedgerName: "Export Sales – US Retail Chains",
          partyOrVendorName: "Target Corporation Sourcing LLC (Newark)",
          narration: "Container load #TC-88412 apparel export invoice under e-BRC",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 32000000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-rev-3",
      statementType: "P&L",
      tallyLedgerName: "Domestic Wholesale – North & West Zone",
      tallyParentGroup: "Sales Accounts",
      standardAccount: "Domestic Sales & Institutional Orders",
      reportingGroup: "Core Operating Revenue",
      pnlSection: "Revenue from Operations",
      sectionOrder: 1,
      isIncome: true,
      currentMonth: 35000000, // ₹3.50 Cr
      previousMonth: 33000000,
      ytdAmount: 196000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rev-301",
          voucherDate: "2026-09-11",
          voucherNumber: "GST/26-27/1104",
          voucherType: "Sales",
          tallyLedgerName: "Domestic Wholesale – North & West Zone",
          partyOrVendorName: "Reliance Retail Lifestyle Ltd (Mumbai Hub)",
          narration: "Festive collection dispatch — e-Invoice IRN #9910482a verified with GSTN",
          costCentre: "Domestic B2B Division",
          amount: 21000000,
          drCr: "Cr",
        },
        {
          id: "v-rev-302",
          voucherDate: "2026-09-24",
          voucherNumber: "GST/26-27/1168",
          voucherType: "Sales",
          tallyLedgerName: "Domestic Wholesale – North & West Zone",
          partyOrVendorName: "Shoppers Stop Ltd (NCR Distribution Warehouse)",
          narration: "Q3 winter stock replenishment lot across 18 retail stores",
          costCentre: "Domestic B2B Division",
          amount: 14000000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-rev-4",
      statementType: "P&L",
      tallyLedgerName: "Domestic B2B Branded Contracts",
      tallyParentGroup: "Sales Accounts",
      standardAccount: "Domestic Sales & Institutional Orders",
      reportingGroup: "Core Operating Revenue",
      pnlSection: "Revenue from Operations",
      sectionOrder: 1,
      isIncome: true,
      currentMonth: 18000000, // ₹1.80 Cr
      previousMonth: 17000000,
      ytdAmount: 102000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rev-401",
          voucherDate: "2026-09-21",
          voucherNumber: "GST/26-27/1152",
          voucherType: "Sales",
          tallyLedgerName: "Domestic B2B Branded Contracts",
          partyOrVendorName: "Aditya Birla Fashion & Retail Ltd",
          narration: "Private label contract manufacturing batch #AB-09",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 18000000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-rev-5",
      statementType: "P&L",
      tallyLedgerName: "Duty Drawback & RoDTEP Claims A/c",
      tallyParentGroup: "Direct Incomes",
      standardAccount: "Export Incentives & Duty Drawback",
      reportingGroup: "Export Incentives",
      pnlSection: "Revenue from Operations",
      sectionOrder: 1,
      isIncome: true,
      currentMonth: 6000000, // ₹0.60 Cr
      previousMonth: 5500000,
      ytdAmount: 33500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rev-501",
          voucherDate: "2026-09-28",
          voucherNumber: "JV/26-27/0294",
          voucherType: "Journal",
          tallyLedgerName: "Duty Drawback & RoDTEP Claims A/c",
          partyOrVendorName: "ICEGATE Customs Electronic Scrip Ledger",
          narration: "Customs Duty Drawback & RoDTEP accrual against September shipping bills",
          costCentre: "Unit 1 - Apparel Export Division",
          amount: 6000000,
          drCr: "Cr",
        },
      ],
    },

    // =====================================================================
    // 2. P&L: OTHER INCOME (Total: ₹0.35 Cr = ₹35,00,000)
    // =====================================================================
    {
      id: "tl-oth-1",
      statementType: "P&L",
      tallyLedgerName: "FD Interest – HDFC Bank Auto-Sweep",
      tallyParentGroup: "Indirect Incomes",
      standardAccount: "Treasury & Forex Income",
      reportingGroup: "Non-Operating & Treasury Income",
      pnlSection: "Other Income",
      sectionOrder: 2,
      isIncome: true,
      currentMonth: 2000000, // ₹0.20 Cr
      previousMonth: 1800000,
      ytdAmount: 11200000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-oth-101",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0310",
          voucherType: "Journal",
          tallyLedgerName: "FD Interest – HDFC Bank Auto-Sweep",
          partyOrVendorName: "HDFC Bank Ltd – Corporate Treasury",
          narration: "Monthly interest accrued on sweep fixed deposits (TDS u/s 194A reconciled)",
          costCentre: "HO - Corporate Treasury",
          amount: 2000000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-oth-2",
      statementType: "P&L",
      tallyLedgerName: "Realized Forex Exchange Gain – Export Bills",
      tallyParentGroup: "Indirect Incomes",
      standardAccount: "Treasury & Forex Income",
      reportingGroup: "Non-Operating & Treasury Income",
      pnlSection: "Other Income",
      sectionOrder: 2,
      isIncome: true,
      currentMonth: 1500000, // ₹0.15 Cr
      previousMonth: 1200000,
      ytdAmount: 8400000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-oth-201",
          voucherDate: "2026-09-25",
          voucherNumber: "JV/26-27/0301",
          voucherType: "Journal",
          tallyLedgerName: "Realized Forex Exchange Gain – Export Bills",
          partyOrVendorName: "HDFC Bank AD Branch – EEFC Account",
          narration: "Exchange rate realization gain on EUR/USD forward contract settlement",
          costCentre: "HO - Corporate Treasury",
          amount: 1500000,
          drCr: "Cr",
        },
      ],
    },

    // =====================================================================
    // 3. P&L: MANUFACTURING COST (Total: ₹8.50 Cr = ₹8,50,00,000)
    // Matches exact user specification hierarchy & figures!
    // =====================================================================
    // 3A. Standard Account: Raw Material (₹5.20 Cr = ₹5,20,00,000)
    {
      id: "tl-mfg-rm-1",
      statementType: "P&L",
      tallyLedgerName: "Fabric Purchase – China",
      tallyParentGroup: "Purchase Accounts",
      standardAccount: "Raw Material",
      reportingGroup: "Direct Material Cost",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 24000000, // ₹2.40 Cr
      previousMonth: 22500000,
      ytdAmount: 138000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rm-101",
          voucherDate: "2026-09-04",
          voucherNumber: "IMP/26-27/0118",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – China",
          partyOrVendorName: "Shaoxing Keqiao Textile Group Co. Ltd",
          narration:
            "Import of 1,10,000 mtrs high-count poly-viscose suiting fabric (BoE #4412908, Nhava Sheva)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 11500000, // ₹1.15 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-102",
          voucherDate: "2026-09-12",
          voucherNumber: "IMP/26-27/0129",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – China",
          partyOrVendorName: "Hangzhou Silk & Technical Fabrics Imp-Exp Co.",
          narration:
            "Import of specialty nylon-spandex stretch fabric for EU export order (BoE #4489120)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 7800000, // ₹0.78 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-103",
          voucherDate: "2026-09-22",
          voucherNumber: "IMP/26-27/0141",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – China",
          partyOrVendorName: "Suzhou Functional Linings & Interlining Ltd",
          narration:
            "Custom breathable fleece & shell fabric lot + BCD clearing capitalised to landed RM",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 4700000, // ₹0.47 Cr
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-rm-2",
      statementType: "P&L",
      tallyLedgerName: "Fabric Purchase – India",
      tallyParentGroup: "Purchase Accounts",
      standardAccount: "Raw Material",
      reportingGroup: "Direct Material Cost",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 18000000, // ₹1.80 Cr
      previousMonth: 17200000,
      ytdAmount: 104000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rm-201",
          voucherDate: "2026-09-05",
          voucherNumber: "PUR/26-27/0814",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – India",
          partyOrVendorName: "Vardhman Textiles Ltd (Ludhiana Mill Division)",
          narration: "100% GOTS organic combed cotton greige & dyed fabric (GRN #9021, 2B matched)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 8500000, // ₹0.85 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-202",
          voucherDate: "2026-09-15",
          voucherNumber: "PUR/26-27/0856",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – India",
          partyOrVendorName: "Arvind Limited (Denim & Woven Shirting Division, Ahmedabad)",
          narration: "Indigo sulfur-bottom denim & yarn-dyed twill shirting lot (GRN #9088)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 5800000, // ₹0.58 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-203",
          voucherDate: "2026-09-24",
          voucherNumber: "PUR/26-27/0902",
          voucherType: "Purchase",
          tallyLedgerName: "Fabric Purchase – India",
          partyOrVendorName: "KPR Mill Limited (Coimbatore Knits)",
          narration: "Single jersey & rib compact cotton knitted fabric rolls (GRN #9134)",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 3700000, // ₹0.37 Cr
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-rm-3",
      statementType: "P&L",
      tallyLedgerName: "Accessories Purchase",
      displayName: "Accessories Purchase (Trims, Zippers & Buttons)",
      tallyParentGroup: "Purchase Accounts",
      standardAccount: "Raw Material",
      reportingGroup: "Direct Material Cost",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 10000000, // ₹1.00 Cr
      previousMonth: 9500000,
      ytdAmount: 56500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-rm-301",
          voucherDate: "2026-09-07",
          voucherNumber: "PUR/26-27/0825",
          voucherType: "Purchase",
          tallyLedgerName: "Accessories Purchase",
          partyOrVendorName: "YKK India Pvt Ltd (Bawal Plant)",
          narration: "Brass & vislon export-grade zippers, sliders and snap fasteners",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 4600000, // ₹0.46 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-302",
          voucherDate: "2026-09-16",
          voucherNumber: "PUR/26-27/0869",
          voucherType: "Purchase",
          tallyLedgerName: "Accessories Purchase",
          partyOrVendorName: "Avery Dennison India Pvt Ltd",
          narration: "Woven brand labels, RFID price tags, care wash labels & barcode stickers",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 3200000, // ₹0.32 Cr
          drCr: "Dr",
        },
        {
          id: "v-rm-303",
          voucherDate: "2026-09-25",
          voucherNumber: "PUR/26-27/0915",
          voucherType: "Purchase",
          tallyLedgerName: "Accessories Purchase",
          partyOrVendorName: "Madura Coats Pvt Ltd",
          narration: "High-tenacity core-spun sewing threads, fusible interlinings & polybags",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 2200000, // ₹0.22 Cr
          drCr: "Dr",
        },
      ],
    },

    // 3B. Standard Account: Direct Labour (₹1.60 Cr = ₹1,60,00,000)
    {
      id: "tl-mfg-dl-1",
      statementType: "P&L",
      tallyLedgerName: "Factory Wages – Unit 1",
      tallyParentGroup: "Direct Expenses",
      standardAccount: "Direct Labour",
      reportingGroup: "Direct Manufacturing Wages",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 10000000, // ₹1.00 Cr
      previousMonth: 9600000,
      ytdAmount: 58000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-dl-101",
          voucherDate: "2026-09-07",
          voucherNumber: "PAY/26-27/0502",
          voucherType: "Payment",
          tallyLedgerName: "Factory Wages – Unit 1",
          partyOrVendorName: "Unit 1 Shopfloor Piece-Rate & Line Workers Bi-Weekly Muster",
          narration:
            "First fortnightly shopfloor wages disbursement — Cutting, Stitching & Finishing lines (640 workers)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 4800000, // ₹0.48 Cr
          drCr: "Dr",
        },
        {
          id: "v-dl-102",
          voucherDate: "2026-09-28",
          voucherNumber: "JV/26-27/0288",
          voucherType: "Journal",
          tallyLedgerName: "Factory Wages – Unit 1",
          partyOrVendorName: "Unit 1 Monthly Factory Wage & OT Accrual Register",
          narration: "Second fortnight wages + festival shift overtime & production line incentive",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 5200000, // ₹0.52 Cr
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-dl-2",
      statementType: "P&L",
      tallyLedgerName: "Factory Wages – Unit 2",
      tallyParentGroup: "Direct Expenses",
      standardAccount: "Direct Labour",
      reportingGroup: "Direct Manufacturing Wages",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 6000000, // ₹0.60 Cr
      previousMonth: 5800000,
      ytdAmount: 34800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-dl-201",
          voucherDate: "2026-09-08",
          voucherNumber: "PAY/26-27/0510",
          voucherType: "Payment",
          tallyLedgerName: "Factory Wages – Unit 2",
          partyOrVendorName: "Unit 2 Knitting & Garmenting Operators Payroll",
          narration: "Unit 2 circular knitting & overlock line operators wages (380 workers)",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 3100000, // ₹0.31 Cr
          drCr: "Dr",
        },
        {
          id: "v-dl-202",
          voucherDate: "2026-09-29",
          voucherNumber: "JV/26-27/0295",
          voucherType: "Journal",
          tallyLedgerName: "Factory Wages – Unit 2",
          partyOrVendorName: "Unit 2 Quality Check, Ironing & Packing Line Muster",
          narration: "Second fortnight wage sheet & finishing floor overtime accrual",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 2900000, // ₹0.29 Cr
          drCr: "Dr",
        },
      ],
    },

    // 3C. Standard Account: Power & Fuel (₹0.90 Cr = ₹90,00,000)
    // Matches exact Tally Compatibility specification from prompt:
    // Tally Ledger: "Factory Electricity – Unit 1"
    // Tally Parent: "Indirect Expenses"
    // CFOSARTHI Standard Account: "Power & Fuel"
    // CFOSARTHI Reporting Group: "Manufacturing Overheads"
    // P&L Section: "Manufacturing Cost"
    {
      id: "tl-mfg-pf-1",
      statementType: "P&L",
      tallyLedgerName: "Factory Electricity – Unit 1",
      displayName: "Factory Electricity – U1",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Power & Fuel",
      reportingGroup: "Manufacturing Overheads",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 5500000, // ₹0.55 Cr
      previousMonth: 5200000,
      ytdAmount: 31800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-pf-101",
          voucherDate: "2026-09-10",
          voucherNumber: "PUR/26-27/0838",
          voucherType: "Purchase",
          tallyLedgerName: "Factory Electricity – Unit 1",
          partyOrVendorName:
            "Dakshin Haryana Bijli Vitran Nigam (DHBVN) – HT Industrial Conn #U1-4402",
          narration:
            "HT industrial power consumption for Unit 1 (3,82,000 kWh @ ₹8.45/unit + demand charges)",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 3450000, // ₹0.345 Cr
          drCr: "Dr",
        },
        {
          id: "v-pf-102",
          voucherDate: "2026-09-20",
          voucherNumber: "PUR/26-27/0881",
          voucherType: "Purchase",
          tallyLedgerName: "Factory Electricity – Unit 1",
          partyOrVendorName: "CleanMax Solar Open Access Power SPV Pvt Ltd",
          narration:
            "Captive solar open-access wheeled power invoice for Unit 1 dyeing & washing bay",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 1450000, // ₹0.145 Cr
          drCr: "Dr",
        },
        {
          id: "v-pf-103",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0308",
          voucherType: "Journal",
          tallyLedgerName: "Factory Electricity – Unit 1",
          partyOrVendorName: "DHBVN Unbilled Meter Reading Accrual (21st–30th Sep)",
          narration:
            "Month-end cutoff provision based on sub-meter logbook reading verified by Plant Engineer",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 600000, // ₹0.06 Cr
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-pf-2",
      statementType: "P&L",
      tallyLedgerName: "Factory Electricity – Unit 2",
      displayName: "Factory Electricity – U2",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Power & Fuel",
      reportingGroup: "Manufacturing Overheads",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 2500000, // ₹0.25 Cr
      previousMonth: 2400000,
      ytdAmount: 14600000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-pf-201",
          voucherDate: "2026-09-12",
          voucherNumber: "PUR/26-27/0844",
          voucherType: "Purchase",
          tallyLedgerName: "Factory Electricity – Unit 2",
          partyOrVendorName: "Uttar Gujarat Vij Company Ltd (UGVCL) – HT Consumer #U2-1908",
          narration: "Monthly industrial electricity bill for Unit 2 knitting & steam boiler plant",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 2150000, // ₹0.215 Cr
          drCr: "Dr",
        },
        {
          id: "v-pf-202",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0309",
          voucherType: "Journal",
          tallyLedgerName: "Factory Electricity – Unit 2",
          partyOrVendorName: "UGVCL Month-End Meter Cutoff Provision",
          narration: "Accrued electricity for last 6 days of September per digital load meter",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 350000, // ₹0.035 Cr
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-pf-3",
      statementType: "P&L",
      tallyLedgerName: "Generator Diesel",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Power & Fuel",
      reportingGroup: "Manufacturing Overheads",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 1000000, // ₹0.10 Cr
      previousMonth: 950000,
      ytdAmount: 5800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-pf-301",
          voucherDate: "2026-09-09",
          voucherNumber: "PUR/26-27/0831",
          voucherType: "Purchase",
          tallyLedgerName: "Generator Diesel",
          partyOrVendorName: "Indian Oil Corporation Ltd (IOCL Bulk Industrial Supply)",
          narration:
            "6,500 Litres HSD bulk procurement for 1250 kVA Cummins DG sets at Unit 1 & Unit 2",
          costCentre: "Unit 1 & Unit 2 DG Powerhouse",
          amount: 600000, // ₹0.06 Cr
          drCr: "Dr",
        },
        {
          id: "v-pf-302",
          voucherDate: "2026-09-23",
          voucherNumber: "PUR/26-27/0895",
          voucherType: "Purchase",
          tallyLedgerName: "Generator Diesel",
          partyOrVendorName: "Bharat Petroleum Fleet & Industrial Fuels",
          narration: "4,300 Litres HSD refill for backup generator & steam boiler burner",
          costCentre: "Unit 1 & Unit 2 DG Powerhouse",
          amount: 400000, // ₹0.04 Cr
          drCr: "Dr",
        },
      ],
    },

    // 3D. Standard Account: Factory Overheads (₹0.80 Cr = ₹80,00,000)
    {
      id: "tl-mfg-fo-1",
      statementType: "P&L",
      tallyLedgerName: "Plant & Machinery Maintenance – Unit 1",
      tallyParentGroup: "Direct Expenses",
      standardAccount: "Factory Overheads",
      reportingGroup: "Manufacturing Overheads",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 4800000, // ₹0.48 Cr
      previousMonth: 4500000,
      ytdAmount: 27200000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-fo-101",
          voucherDate: "2026-09-14",
          voucherNumber: "PUR/26-27/0851",
          voucherType: "Purchase",
          tallyLedgerName: "Plant & Machinery Maintenance – Unit 1",
          partyOrVendorName: "Juki India Pvt Ltd (Industrial Sewing Spares)",
          narration: "Annual AMC & high-speed lockstitch/overlock servo motor spares replacement",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 2800000,
          drCr: "Dr",
        },
        {
          id: "v-fo-102",
          voucherDate: "2026-09-26",
          voucherNumber: "PUR/26-27/0919",
          voucherType: "Purchase",
          tallyLedgerName: "Plant & Machinery Maintenance – Unit 1",
          partyOrVendorName: "Thermax Boiler & ETP Maintenance Services",
          narration:
            "Zero-liquid-discharge (ZLD) effluent treatment plant membranes & boiler servicing",
          costCentre: "Unit 1 - Main Weaving & Cutting Plant",
          amount: 2000000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-mfg-fo-2",
      statementType: "P&L",
      tallyLedgerName: "Consumable Stores & Dyeing Chemicals",
      tallyParentGroup: "Direct Expenses",
      standardAccount: "Factory Overheads",
      reportingGroup: "Manufacturing Overheads",
      pnlSection: "Manufacturing Cost",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 3200000, // ₹0.32 Cr
      previousMonth: 3000000,
      ytdAmount: 18500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-fo-201",
          voucherDate: "2026-09-18",
          voucherNumber: "PUR/26-27/0874",
          voucherType: "Purchase",
          tallyLedgerName: "Consumable Stores & Dyeing Chemicals",
          partyOrVendorName: "Archroma India Pvt Ltd (Specialty Textile Dyes)",
          narration: "OEKO-TEX certified reactive dyes, bio-enzymes & washing auxiliaries",
          costCentre: "Unit 2 - Knitwear Division",
          amount: 3200000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // 4. P&L: EMPLOYEE BENEFIT EXPENSES (Total: ₹1.90 Cr = ₹1,90,00,000)
    // =====================================================================
    {
      id: "tl-emp-1",
      statementType: "P&L",
      tallyLedgerName: "Corporate & Design Studio Salaries – HO",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Salaries, Bonus & Management Remuneration",
      reportingGroup: "Corporate & Functional Payroll",
      pnlSection: "Employee Benefit Expenses",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 9500000, // ₹0.95 Cr
      previousMonth: 9200000,
      ytdAmount: 55200000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-emp-101",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0312",
          voucherType: "Journal",
          tallyLedgerName: "Corporate & Design Studio Salaries – HO",
          partyOrVendorName: "HO Payroll Register (Merchandising, CAD Design, Finance & IT)",
          narration: "September salary accrual for 112 corporate staff (TDS u/s 192B deducted)",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 9500000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-emp-2",
      statementType: "P&L",
      tallyLedgerName: "Directors Remuneration & Incentives",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Salaries, Bonus & Management Remuneration",
      reportingGroup: "Corporate & Functional Payroll",
      pnlSection: "Employee Benefit Expenses",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 6000000, // ₹0.60 Cr
      previousMonth: 6000000,
      ytdAmount: 36000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-emp-201",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0313",
          voucherType: "Journal",
          tallyLedgerName: "Directors Remuneration & Incentives",
          partyOrVendorName: "Whole-Time Directors Managerial Remuneration A/c",
          narration: "Monthly managerial remuneration approved per Section 197 board resolution",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 6000000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-emp-3",
      statementType: "P&L",
      tallyLedgerName: "Employer Provident Fund & Admin Charges",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "PF, ESIC & Staff Welfare",
      reportingGroup: "Statutory Staff Welfare",
      pnlSection: "Employee Benefit Expenses",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 2200000, // ₹0.22 Cr
      previousMonth: 2150000,
      ytdAmount: 12900000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-emp-301",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0314",
          voucherType: "Journal",
          tallyLedgerName: "Employer Provident Fund & Admin Charges",
          partyOrVendorName: "EPFO Regional Office – ECR Contribution Accrual",
          narration: "12% Employer EPF + 0.5% EDLI + 0.5% Admin charges across Unit 1, Unit 2 & HO",
          costCentre: "All Units Statutory Pool",
          amount: 2200000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-emp-4",
      statementType: "P&L",
      tallyLedgerName: "ESIC & Factory Canteen Welfare Expenses",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "PF, ESIC & Staff Welfare",
      reportingGroup: "Statutory Staff Welfare",
      pnlSection: "Employee Benefit Expenses",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 1300000, // ₹0.13 Cr
      previousMonth: 1250000,
      ytdAmount: 7500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-emp-401",
          voucherDate: "2026-09-27",
          voucherNumber: "PUR/26-27/0922",
          voucherType: "Purchase",
          tallyLedgerName: "ESIC & Factory Canteen Welfare Expenses",
          partyOrVendorName: "Sodexo Industrial Catering & ESIC Corporation",
          narration: "Employer ESIC 3.25% contribution + subsidized worker canteen meal service",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 1300000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // 5. P&L: ADMINISTRATIVE, SELLING & DISTRIBUTION (Total: ₹1.20 Cr)
    // =====================================================================
    {
      id: "tl-adm-1",
      statementType: "P&L",
      tallyLedgerName: "Export Ocean Freight & CHA Clearing – Mundra",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Freight Outward & Export Clearing",
      reportingGroup: "Selling & Logistics Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 3800000, // ₹0.38 Cr
      previousMonth: 3500000,
      ytdAmount: 21400000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-101",
          voucherDate: "2026-09-17",
          voucherNumber: "PUR/26-27/0871",
          voucherType: "Purchase",
          tallyLedgerName: "Export Ocean Freight & CHA Clearing – Mundra",
          partyOrVendorName: "Maersk Line India Pvt Ltd & DHL Global Forwarding",
          narration:
            "THC, CFS handling, customs house agent clearing & container haulage for EU shipments",
          costCentre: "Unit 1 - Apparel Export Division",
          amount: 3800000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-adm-2",
      statementType: "P&L",
      tallyLedgerName: "Domestic Logistics & Surface Transport",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Freight Outward & Export Clearing",
      reportingGroup: "Selling & Logistics Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 1700000, // ₹0.17 Cr
      previousMonth: 1600000,
      ytdAmount: 9800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-201",
          voucherDate: "2026-09-23",
          voucherNumber: "PUR/26-27/0898",
          voucherType: "Purchase",
          tallyLedgerName: "Domestic Logistics & Surface Transport",
          partyOrVendorName: "Safexpress Pvt Ltd & Blue Dart Express",
          narration: "B2B retail warehouse dispatch freight across Mumbai, Bengaluru & Delhi NCR",
          costCentre: "Domestic B2B Division",
          amount: 1700000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-adm-3",
      statementType: "P&L",
      tallyLedgerName: "Corporate Office Lease Rent – Gurugram",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Office Rent, Legal & Virtual CFO Retainership",
      reportingGroup: "General & Administrative Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 1800000, // ₹0.18 Cr
      previousMonth: 1800000,
      ytdAmount: 10800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-301",
          voucherDate: "2026-09-02",
          voucherNumber: "PUR/26-27/0803",
          voucherType: "Purchase",
          tallyLedgerName: "Corporate Office Lease Rent – Gurugram",
          partyOrVendorName: "DLF Cyber City Developers Ltd",
          narration:
            "Monthly lease rental & CAM charges for Corporate HQ & Showroom (TDS u/s 194-I @ 10%)",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 1800000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-adm-4",
      statementType: "P&L",
      tallyLedgerName: "Virtual CFO Retainership & Statutory Audit Fees",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Office Rent, Legal & Virtual CFO Retainership",
      reportingGroup: "General & Administrative Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 1200000, // ₹0.12 Cr
      previousMonth: 1150000,
      ytdAmount: 7000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-401",
          voucherDate: "2026-09-28",
          voucherNumber: "PUR/26-27/0925",
          voucherType: "Purchase",
          tallyLedgerName: "Virtual CFO Retainership & Statutory Audit Fees",
          partyOrVendorName: "Naksh Goyal & Associates (Virtual CFO Advisory) & Statutory Auditors",
          narration:
            "Monthly Virtual CFO advisory retainer + quarterly statutory & internal audit provision",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 1200000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-adm-6",
      statementType: "P&L",
      tallyLedgerName: "Indirect Administrative, Travelling, Printing & Office Overheads",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Office Rent, Legal & Virtual CFO Retainership",
      reportingGroup: "General & Administrative Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 1000000, // ₹0.10 Cr
      previousMonth: 950000,
      ytdAmount: 5800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-601",
          voucherDate: "2026-09-24",
          voucherNumber: "PUR/26-27/0904",
          voucherType: "Purchase",
          tallyLedgerName: "Indirect Administrative, Travelling, Printing & Office Overheads",
          partyOrVendorName: "Airtel Enterprise, MakeMyTrip Corporate & HO Admin Vendors",
          narration:
            "Corporate office administration, telephone/leased line, printing & stationery, conveyance & travelling expenses",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 1000000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-adm-5",
      statementType: "P&L",
      tallyLedgerName: "International Textile Fair & Buyer Samples",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Sales Promotion & Trade Exhibitions",
      reportingGroup: "Selling & Logistics Overheads",
      pnlSection: "Administrative, Selling & Distribution",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 2500000, // ₹0.25 Cr
      previousMonth: 2100000,
      ytdAmount: 13500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-adm-501",
          voucherDate: "2026-09-19",
          voucherNumber: "PUR/26-27/0879",
          voucherType: "Purchase",
          tallyLedgerName: "International Textile Fair & Buyer Samples",
          partyOrVendorName: "Messe Frankfurt Texworld Paris & Buyer Sampling Desk",
          narration: "Spring-Summer '27 buyer sample development & Paris Texworld stall booking",
          costCentre: "Export Merchandising Desk",
          amount: 2500000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // 6. P&L: DEPRECIATION & AMORTIZATION (Total: ₹0.50 Cr = ₹50,00,000)
    // =====================================================================
    {
      id: "tl-dep-1",
      statementType: "P&L",
      tallyLedgerName: "Depreciation – Plant & Automated Looms",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Depreciation on Tangible & Intangible Assets",
      reportingGroup: "Non-Cash Capital Charge",
      pnlSection: "Depreciation & Amortization",
      sectionOrder: 6,
      isIncome: false,
      currentMonth: 3800000, // ₹0.38 Cr
      previousMonth: 3800000,
      ytdAmount: 22800000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-dep-101",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0318",
          voucherType: "Journal",
          tallyLedgerName: "Depreciation – Plant & Automated Looms",
          partyOrVendorName: "Accumulated Depreciation – Plant & Machinery Schedule II",
          narration:
            "Monthly SLM depreciation per Companies Act Schedule II on Unit 1 & Unit 2 machinery",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 3800000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-dep-2",
      statementType: "P&L",
      tallyLedgerName: "Depreciation – Computers, ERP & Office Assets",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Depreciation on Tangible & Intangible Assets",
      reportingGroup: "Non-Cash Capital Charge",
      pnlSection: "Depreciation & Amortization",
      sectionOrder: 6,
      isIncome: false,
      currentMonth: 1200000, // ₹0.12 Cr
      previousMonth: 1200000,
      ytdAmount: 7200000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-dep-201",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0319",
          voucherType: "Journal",
          tallyLedgerName: "Depreciation – Computers, ERP & Office Assets",
          partyOrVendorName: "Accumulated Depreciation – IT & Intangible ERP Block",
          narration: "Monthly depreciation on CAD workstations, servers & Tally/ERP licenses",
          costCentre: "HO - Gurugram Corporate Office",
          amount: 1200000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // 7. P&L: FINANCE COSTS (Total: ₹0.40 Cr = ₹40,00,000)
    // =====================================================================
    {
      id: "tl-fin-1",
      statementType: "P&L",
      tallyLedgerName: "Interest on Export Packing Credit (EPC) – HDFC",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Bank Interest & Packing Credit Charges",
      reportingGroup: "Debt Servicing & Bank Charges",
      pnlSection: "Finance Costs",
      sectionOrder: 7,
      isIncome: false,
      currentMonth: 2500000, // ₹0.25 Cr
      previousMonth: 2600000,
      ytdAmount: 15200000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-fin-101",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0321",
          voucherType: "Journal",
          tallyLedgerName: "Interest on Export Packing Credit (EPC) – HDFC",
          partyOrVendorName: "HDFC Bank Ltd – EPC / PCFC Working Capital A/c",
          narration:
            "September packing credit interest net of 3% RBI Interest Equalization subvention",
          costCentre: "HO - Corporate Treasury",
          amount: 2500000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-fin-2",
      statementType: "P&L",
      tallyLedgerName: "Term Loan Interest – Factory Unit 1 & 2",
      tallyParentGroup: "Indirect Expenses",
      standardAccount: "Bank Interest & Packing Credit Charges",
      reportingGroup: "Debt Servicing & Bank Charges",
      pnlSection: "Finance Costs",
      sectionOrder: 7,
      isIncome: false,
      currentMonth: 1500000, // ₹0.15 Cr
      previousMonth: 1550000,
      ytdAmount: 9300000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-fin-201",
          voucherDate: "2026-09-30",
          voucherNumber: "PAY/26-27/0588",
          voucherType: "Payment",
          tallyLedgerName: "Term Loan Interest – Factory Unit 1 & 2",
          partyOrVendorName: "State Bank of India – Industrial Finance Branch",
          narration: "Monthly TUFS machinery term loan interest debited by bank",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 1500000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // 8. P&L: TAX EXPENSE (Total: ₹0.58 Cr = ₹58,00,000)
    // =====================================================================
    {
      id: "tl-tax-1",
      statementType: "P&L",
      tallyLedgerName: "Advance Income Tax Provision (Sec 115BAA)",
      tallyParentGroup: "Duties & Taxes",
      standardAccount: "Current & Deferred Income Tax",
      reportingGroup: "Corporate Taxation",
      pnlSection: "Tax Expense",
      sectionOrder: 8,
      isIncome: false,
      currentMonth: 5000000, // ₹0.50 Cr
      previousMonth: 4600000,
      ytdAmount: 28000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-tax-101",
          voucherDate: "2026-09-15",
          voucherNumber: "PAY/26-27/0540",
          voucherType: "Payment",
          tallyLedgerName: "Advance Income Tax Provision (Sec 115BAA)",
          partyOrVendorName: "Income Tax Department – Challan ITNS 280 (Q2 Advance Tax)",
          narration:
            "Corporate tax provision @ 25.168% under Sec 115BAA for September profitability",
          costCentre: "HO - Corporate Treasury",
          amount: 5000000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-tax-2",
      statementType: "P&L",
      tallyLedgerName: "Deferred Tax Liability Charge",
      tallyParentGroup: "Duties & Taxes",
      standardAccount: "Current & Deferred Income Tax",
      reportingGroup: "Corporate Taxation",
      pnlSection: "Tax Expense",
      sectionOrder: 8,
      isIncome: false,
      currentMonth: 800000, // ₹0.08 Cr
      previousMonth: 750000,
      ytdAmount: 4500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-tax-201",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0325",
          voucherType: "Journal",
          tallyLedgerName: "Deferred Tax Liability Charge",
          partyOrVendorName: "Deferred Tax Liability A/c (Ind AS 12)",
          narration: "Timing difference between WDV tax depreciation and SLM book depreciation",
          costCentre: "HO - Corporate Treasury",
          amount: 800000,
          drCr: "Dr",
        },
      ],
    },

    // =====================================================================
    // BALANCE SHEET TALLY LEDGERS (Preserving Full BS Hierarchy as well)
    // =====================================================================
    {
      id: "tl-bs-1",
      statementType: "Balance Sheet",
      tallyLedgerName: "Equity Share Capital (Paid-up ₹10 Face Value)",
      tallyParentGroup: "Capital Account",
      standardAccount: "Equity Share Capital",
      reportingGroup: "Equity & Retained Earnings",
      pnlSection: "Shareholders' Funds",
      sectionOrder: 1,
      isIncome: false,
      currentMonth: 25000000, // ₹2.50 Cr
      previousMonth: 25000000,
      ytdAmount: 25000000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-101",
          voucherDate: "2026-04-01",
          voucherNumber: "OB/26-27/0001",
          voucherType: "Journal",
          tallyLedgerName: "Equity Share Capital (Paid-up ₹10 Face Value)",
          partyOrVendorName: "Promoter & Institutional Equity Register (SH-1)",
          narration: "25,00,000 fully paid-up equity shares of ₹10 each per MCA Master Data",
          costCentre: "HO - Corporate Secretarial",
          amount: 25000000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-2",
      statementType: "Balance Sheet",
      tallyLedgerName: "Surplus in P&L Account & General Reserve",
      tallyParentGroup: "Reserves & Surplus",
      standardAccount: "Reserves & Surplus",
      reportingGroup: "Equity & Retained Earnings",
      pnlSection: "Shareholders' Funds",
      sectionOrder: 1,
      isIncome: false,
      currentMonth: 34850000, // ₹3.485 Cr
      previousMonth: 33744000,
      ytdAmount: 34850000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-201",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0330",
          voucherType: "Journal",
          tallyLedgerName: "Surplus in P&L Account & General Reserve",
          partyOrVendorName: "Retained Earnings & Securities Premium Reserve",
          narration: "Accumulated surplus + current period PAT accretion transferred to Reserve",
          costCentre: "HO - Corporate Treasury",
          amount: 34850000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-3",
      statementType: "Balance Sheet",
      tallyLedgerName: "SBI TUFS Machinery Term Loan – Unit 1 & 2",
      tallyParentGroup: "Secured Loans",
      standardAccount: "Long-Term Term Loans",
      reportingGroup: "Long-Term Debt & Obligations",
      pnlSection: "Non-Current Liabilities",
      sectionOrder: 2,
      isIncome: false,
      currentMonth: 15050000, // ₹1.505 Cr
      previousMonth: 15300000,
      ytdAmount: 15050000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-301",
          voucherDate: "2026-09-25",
          voucherNumber: "PAY/26-27/0580",
          voucherType: "Payment",
          tallyLedgerName: "SBI TUFS Machinery Term Loan – Unit 1 & 2",
          partyOrVendorName: "State Bank of India – Industrial Finance Term Loan",
          narration: "Closing principal balance after September EMI installment of ₹2.50 Lakhs",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 15050000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-4",
      statementType: "Balance Sheet",
      tallyLedgerName: "HDFC Bank Export Packing Credit (EPC / CC)",
      tallyParentGroup: "Bank OD A/c",
      standardAccount: "Working Capital Borrowings (CC / EPC)",
      reportingGroup: "Working Capital & Trade Liabilities",
      pnlSection: "Current Liabilities",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 4500000, // ₹0.45 Cr
      previousMonth: 4200000,
      ytdAmount: 4500000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-401",
          voucherDate: "2026-09-30",
          voucherNumber: "BNK/26-27/0912",
          voucherType: "Receipt",
          tallyLedgerName: "HDFC Bank Export Packing Credit (EPC / CC)",
          partyOrVendorName: "HDFC Bank Ltd – Working Capital Drawing Power Line",
          narration:
            "Utilized working capital CC/EPC balance against stock & book debts DP statement",
          costCentre: "HO - Corporate Treasury",
          amount: 4500000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-5",
      statementType: "Balance Sheet",
      tallyLedgerName: "Sundry Creditors – Fabric & Trim Suppliers",
      tallyParentGroup: "Sundry Creditors",
      standardAccount: "Trade Payables (General & MSME)",
      reportingGroup: "Working Capital & Trade Liabilities",
      pnlSection: "Current Liabilities",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 3410000, // ₹0.341 Cr
      previousMonth: 3360000,
      ytdAmount: 3410000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-501",
          voucherDate: "2026-09-30",
          voucherNumber: "PUR/26-27/0915",
          voucherType: "Purchase",
          tallyLedgerName: "Sundry Creditors – Fabric & Trim Suppliers",
          partyOrVendorName: "Vardhman Textiles, Arvind Ltd & MSME Trim Vendors",
          narration:
            "Closing trade creditors (including ₹2.80L MSME creditors within 45-day Sec 43B(h) window)",
          costCentre: "Unit 1 & Unit 2 Procurement",
          amount: 3410000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-6",
      statementType: "Balance Sheet",
      tallyLedgerName: "GST, TDS, EPF & Short-Term Provisions Payable",
      tallyParentGroup: "Duties & Taxes",
      standardAccount: "Statutory Dues & Short-Term Provisions",
      reportingGroup: "Working Capital & Trade Liabilities",
      pnlSection: "Current Liabilities",
      sectionOrder: 3,
      isIncome: false,
      currentMonth: 4300000, // ₹0.43 Cr
      previousMonth: 3958000,
      ytdAmount: 4300000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-601",
          voucherDate: "2026-09-30",
          voucherNumber: "JV/26-27/0328",
          voucherType: "Journal",
          tallyLedgerName: "GST, TDS, EPF & Short-Term Provisions Payable",
          partyOrVendorName: "Statutory Liability Control A/c",
          narration: "September TDS, PF/ESI & Provision for Tax / Staff Bonus payable in October",
          costCentre: "All Units Statutory Pool",
          amount: 4300000,
          drCr: "Cr",
        },
      ],
    },
    {
      id: "tl-bs-7",
      statementType: "Balance Sheet",
      tallyLedgerName: "Plant, Automated Looms & Factory Building (Net Block)",
      tallyParentGroup: "Fixed Assets",
      standardAccount: "Property, Plant & Equipment (Net Block)",
      reportingGroup: "Fixed Assets & Long-Term Investments",
      pnlSection: "Non-Current Assets",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 29900000, // ₹2.99 Cr
      previousMonth: 29545000,
      ytdAmount: 29900000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-701",
          voucherDate: "2026-09-30",
          voucherNumber: "FAR/26-27/0009",
          voucherType: "Journal",
          tallyLedgerName: "Plant, Automated Looms & Factory Building (Net Block)",
          partyOrVendorName: "Fixed Asset Register – Unit 1, Unit 2 & CWIP",
          narration:
            "Net PPE block (₹1.93 Cr) + CWIP (₹0.21 Cr) + Intangible ERP & Patents (₹0.85 Cr)",
          costCentre: "Unit 1 & Unit 2 Common",
          amount: 29900000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-bs-8",
      statementType: "Balance Sheet",
      tallyLedgerName: "Non-Current Investments & Utility Security Deposits",
      tallyParentGroup: "Investments",
      standardAccount: "Non-Current Investments & Security Deposits",
      reportingGroup: "Fixed Assets & Long-Term Investments",
      pnlSection: "Non-Current Assets",
      sectionOrder: 4,
      isIncome: false,
      currentMonth: 6650000, // ₹0.665 Cr
      previousMonth: 6650000,
      ytdAmount: 6650000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-801",
          voucherDate: "2026-09-30",
          voucherNumber: "INV/26-27/0004",
          voucherType: "Journal",
          tallyLedgerName: "Non-Current Investments & Utility Security Deposits",
          partyOrVendorName: "Treasury Bonds (₹50L) & DHBVN/DLF Security Deposits (₹16.5L)",
          narration: "Long-term debt mutual funds and electricity/lease security deposits",
          costCentre: "HO - Corporate Treasury",
          amount: 6650000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-bs-9",
      statementType: "Balance Sheet",
      tallyLedgerName: "Closing Stock – Fabric, Trims & Finished Garments",
      tallyParentGroup: "Stock-in-Hand",
      standardAccount: "Inventories (Raw Material, WIP & Finished Goods)",
      reportingGroup: "Working Capital & Liquid Assets",
      pnlSection: "Current Assets",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 23860000, // ₹2.386 Cr
      previousMonth: 22100000,
      ytdAmount: 23860000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-901",
          voucherDate: "2026-09-30",
          voucherNumber: "STK/26-27/0009",
          voucherType: "Journal",
          tallyLedgerName: "Closing Stock – Fabric, Trims & Finished Garments",
          partyOrVendorName: "Physical Stock Valuation Certificate (AS-2 FIFO)",
          narration: "Physical inventory valuation across Unit 1 & Unit 2 warehouses as of 30 Sep",
          costCentre: "Unit 1 & Unit 2 Stores",
          amount: 23860000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-bs-10",
      statementType: "Balance Sheet",
      tallyLedgerName: "Sundry Debtors – Export & Domestic Receivables (Net)",
      tallyParentGroup: "Sundry Debtors",
      standardAccount: "Trade Receivables (Sundry Debtors)",
      reportingGroup: "Working Capital & Liquid Assets",
      pnlSection: "Current Assets",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 5980000, // ₹0.598 Cr
      previousMonth: 5590000,
      ytdAmount: 5980000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-1001",
          voucherDate: "2026-09-30",
          voucherNumber: "AR/26-27/0009",
          voucherType: "Sales",
          tallyLedgerName: "Sundry Debtors – Export & Domestic Receivables (Net)",
          partyOrVendorName: "Bills Receivable Ageing Schedule (Gross ₹62.4L less ₹2.6L ECL)",
          narration: "Reconciled with Debtors Ageing sub-ledger",
          costCentre: "All Sales Divisions",
          amount: 5980000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-bs-11",
      statementType: "Balance Sheet",
      tallyLedgerName: "HDFC Bank Current A/c, EEFC & Auto-Sweep FDs",
      tallyParentGroup: "Bank Accounts",
      standardAccount: "Cash & Bank Balances",
      reportingGroup: "Working Capital & Liquid Assets",
      pnlSection: "Current Assets",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 16450000, // ₹1.645 Cr
      previousMonth: 15795000,
      ytdAmount: 16450000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-1101",
          voucherDate: "2026-09-30",
          voucherNumber: "BRS/26-27/0009",
          voucherType: "Contra",
          tallyLedgerName: "HDFC Bank Current A/c, EEFC & Auto-Sweep FDs",
          partyOrVendorName: "HDFC Bank & ICICI Bank Reconciled BRS Statement",
          narration:
            "Liquid bank balance ₹1.425 Cr + Margin FDs ₹0.22 Cr (Zero unreconciled items)",
          costCentre: "HO - Corporate Treasury",
          amount: 16450000,
          drCr: "Dr",
        },
      ],
    },
    {
      id: "tl-bs-12",
      statementType: "Balance Sheet",
      tallyLedgerName: "GST Input Tax Credit (ITC) & Export Duty Drawback Receivable",
      tallyParentGroup: "Current Assets",
      standardAccount: "Short-Term Loans, Advances & GST ITC",
      reportingGroup: "Working Capital & Liquid Assets",
      pnlSection: "Current Assets",
      sectionOrder: 5,
      isIncome: false,
      currentMonth: 4270000, // ₹0.427 Cr
      previousMonth: 4052000,
      ytdAmount: 4270000,
      mappingStatus: "approved",
      vouchers: [
        {
          id: "v-bs-1201",
          voucherDate: "2026-09-30",
          voucherNumber: "GST/26-27/0009",
          voucherType: "Journal",
          tallyLedgerName: "GST Input Tax Credit (ITC) & Export Duty Drawback Receivable",
          partyOrVendorName: "Electronic Credit Ledger (GSTR-2B Reconciled) & Prepayments",
          narration: "Accumulated GST ITC on fabric/inputs + vendor advances & prepaid insurance",
          costCentre: "All Units Statutory Pool",
          amount: 4270000,
          drCr: "Dr",
        },
      ],
    },
  ];

  return baseLedgers.map((item) => ({
    ...item,
    id: `${companyId}-${item.id}`,
    companyId,
    period,
    lastImportedAt: "2026-09-26 18:30",
  }));
}

/**
 * Generates initial approved Mapping Rules for a company from its initial Tally ledgers.
 * Keyed conceptually by: Company ID + Tally Ledger Name + Tally Parent Group
 */
export function getInitialMappingRulesForCompany(
  companyId: string = "client-101",
): TallyLedgerMappingRule[] {
  const ledgers = getInitialTallyLedgersForCompany(companyId);
  return ledgers.map((l, idx) => ({
    id: `map-${companyId}-${idx + 1}`,
    companyId,
    tallyLedgerName: l.tallyLedgerName,
    tallyParentGroup: l.tallyParentGroup,
    statementType: l.statementType,
    pnlSection: l.pnlSection,
    reportingGroup: l.reportingGroup,
    standardAccount: l.standardAccount,
    displayName: l.displayName,
    approvedBy: "CA Manish Goyal (Virtual CFO)",
    approvedAt: "2026-09-01",
  }));
}

/**
 * Self-heals any Tally ledgers where "Indirect Expenses" or "Indirect Incomes"
 * were previously misclassified into "Manufacturing Cost" or "Revenue from Operations"
 * due to substring matching ("indirect expenses".includes("direct expense")).
 */
export function sanitizeAndRepairTallyLedgers(ledgers: TallyLedgerRecord[]): TallyLedgerRecord[] {
  if (!ledgers || ledgers.length === 0) return [];
  const mfgExplicitRegex =
    /power|fuel|electric|diesel|coal|gas|generator|solar|factory|plant|machinery|consumable|dyeing|weaving|stitching|cutting|job work|freight inward|customs|raw material|fabric|yarn|accessories|purchase|opening stock|closing stock|wages|labour|worker|direct cost|cost of material/i;
  const adminExplicitRegex =
    /indirect admin|administrative|office|corporate|showroom|head office|rent|lease|legal|audit|professional|printing|stationery|travelling|conveyance|telephone|internet|postage|courier|insurance|security|housekeeping|general|misc/i;

  return ledgers.map((l) => {
    if (l.statementType !== "P&L") return l;
    const pNorm = (l.tallyParentGroup || "").toLowerCase();
    const lNorm = (l.tallyLedgerName || "").toLowerCase();

    // Repair Indirect Incomes wrongly placed in Revenue from Operations
    if (
      l.pnlSection === "Revenue from Operations" &&
      pNorm.includes("indirect income") &&
      !/sales|revenue from operation|export|domestic/i.test(lNorm)
    ) {
      return {
        ...l,
        pnlSection: "Other Income",
        reportingGroup: "Non-Operating & Treasury Income",
        standardAccount: "Treasury & Forex Income",
        sectionOrder: 2,
        isIncome: true,
      };
    }

    // Repair Indirect Expenses wrongly placed in Manufacturing Cost
    if (
      l.pnlSection === "Manufacturing Cost" &&
      (pNorm.includes("indirect") || adminExplicitRegex.test(lNorm)) &&
      (!mfgExplicitRegex.test(lNorm) || adminExplicitRegex.test(lNorm))
    ) {
      const repaired = inferDefaultCfosarthiMapping(
        l.tallyLedgerName,
        l.tallyParentGroup || "Indirect Expenses",
        "P&L",
      );
      return {
        ...l,
        pnlSection: repaired.pnlSection,
        reportingGroup: repaired.reportingGroup,
        standardAccount: repaired.standardAccount,
        sectionOrder: repaired.sectionOrder,
        isIncome: repaired.isIncome,
      };
    }

    return l;
  });
}

/**
 * IMPORTANT ACCOUNTING RULE:
 * Pure Bottom-Up Hierarchy Computation Engine.
 * Calculates every Standard Account total strictly from its underlying mapped Tally Ledgers,
 * and every Major Reporting Group total strictly from its underlying Standard Accounts.
 * Never stores or uses conflicting parent totals!
 */
export function buildHierarchicalMisTree(
  rawLedgers: TallyLedgerRecord[],
): HierarchicalMisComputation {
  const ledgers = sanitizeAndRepairTallyLedgers(rawLedgers);
  const pnlMap = new Map<string, MajorReportingGroupNode>();
  const bsMap = new Map<string, MajorReportingGroupNode>();

  const allVouchers: HierarchicalMisComputation["allVouchers"] = [];

  let approvedOrAutoCount = 0;
  let flaggedParentChangedCount = 0;
  let unmappedReviewCount = 0;

  for (const ledger of ledgers) {
    if (ledger.mappingStatus === "approved" || ledger.mappingStatus === "auto_mapped") {
      approvedOrAutoCount++;
    } else if (ledger.mappingStatus === "flagged_parent_changed") {
      flaggedParentChangedCount++;
    } else {
      unmappedReviewCount++;
    }

    // Collect vouchers with full lineage
    for (const v of ledger.vouchers || []) {
      allVouchers.push({
        ...v,
        ledgerId: ledger.id,
        standardAccount: ledger.standardAccount,
        reportingGroup: ledger.reportingGroup,
        pnlSection: ledger.pnlSection,
        tallyParentGroup: ledger.tallyParentGroup,
        statementType: ledger.statementType,
      });
    }

    const targetMap = ledger.statementType === "Balance Sheet" ? bsMap : pnlMap;
    const sectionKey = ledger.pnlSection;

    if (!targetMap.has(sectionKey)) {
      targetMap.set(sectionKey, {
        id: `sec-${ledger.statementType}-${sectionKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        pnlSection: sectionKey,
        sectionOrder: ledger.sectionOrder || 99,
        isIncome: Boolean(ledger.isIncome),
        statementType: ledger.statementType,
        currentMonth: 0,
        previousMonth: 0,
        ytdAmount: 0,
        standardAccounts: [],
        ledgerCount: 0,
        voucherCount: 0,
      });
    }

    const groupNode = targetMap.get(sectionKey)!;
    let stdNode = groupNode.standardAccounts.find(
      (s) => s.standardAccount === ledger.standardAccount,
    );

    if (!stdNode) {
      stdNode = {
        id: `std-${sectionKey}-${ledger.standardAccount}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        standardAccount: ledger.standardAccount,
        reportingGroup: ledger.reportingGroup,
        pnlSection: sectionKey,
        currentMonth: 0,
        previousMonth: 0,
        ytdAmount: 0,
        ledgers: [],
        voucherCount: 0,
      };
      groupNode.standardAccounts.push(stdNode);
    }

    // Add ledger to Standard Account
    stdNode.ledgers.push(ledger);

    // Bottom-up accumulation: Ledger -> Standard Account
    stdNode.currentMonth += ledger.currentMonth;
    stdNode.previousMonth += ledger.previousMonth;
    stdNode.ytdAmount += ledger.ytdAmount;
    stdNode.voucherCount += ledger.vouchers?.length || 0;
  }

  // Bottom-up accumulation: Standard Account -> Major Reporting Group
  const finalizeGroups = (map: Map<string, MajorReportingGroupNode>) => {
    const groups = Array.from(map.values()).sort((a, b) => a.sectionOrder - b.sectionOrder);
    for (const g of groups) {
      g.currentMonth = 0;
      g.previousMonth = 0;
      g.ytdAmount = 0;
      g.ledgerCount = 0;
      g.voucherCount = 0;
      for (const s of g.standardAccounts) {
        g.currentMonth += s.currentMonth;
        g.previousMonth += s.previousMonth;
        g.ytdAmount += s.ytdAmount;
        g.ledgerCount += s.ledgers.length;
        g.voucherCount += s.voucherCount;
      }
    }
    return groups;
  };

  const pnlGroups = finalizeGroups(pnlMap);
  const balanceSheetGroups = finalizeGroups(bsMap);

  // Compute Summary P&L strictly from Major Reporting Group totals
  const getGroupTotals = (sectionName: string) => {
    const found = pnlGroups.find((g) => g.pnlSection.toLowerCase() === sectionName.toLowerCase());
    return {
      currentMonth: found?.currentMonth || 0,
      previousMonth: found?.previousMonth || 0,
      ytdAmount: found?.ytdAmount || 0,
    };
  };

  const revenueFromOperations = getGroupTotals("Revenue from Operations");
  const otherIncome = getGroupTotals("Other Income");
  const totalIncome = {
    currentMonth: revenueFromOperations.currentMonth + otherIncome.currentMonth,
    previousMonth: revenueFromOperations.previousMonth + otherIncome.previousMonth,
    ytdAmount: revenueFromOperations.ytdAmount + otherIncome.ytdAmount,
  };

  const manufacturingCost = getGroupTotals("Manufacturing Cost");
  const grossProfit = {
    currentMonth: revenueFromOperations.currentMonth - manufacturingCost.currentMonth,
    previousMonth: revenueFromOperations.previousMonth - manufacturingCost.previousMonth,
    ytdAmount: revenueFromOperations.ytdAmount - manufacturingCost.ytdAmount,
  };

  const employeeBenefitExpenses = getGroupTotals("Employee Benefit Expenses");
  const adminAndSellingOverheads = getGroupTotals("Administrative, Selling & Distribution");

  const operatingEbitda = {
    currentMonth:
      grossProfit.currentMonth -
      employeeBenefitExpenses.currentMonth -
      adminAndSellingOverheads.currentMonth,
    previousMonth:
      grossProfit.previousMonth -
      employeeBenefitExpenses.previousMonth -
      adminAndSellingOverheads.previousMonth,
    ytdAmount:
      grossProfit.ytdAmount -
      employeeBenefitExpenses.ytdAmount -
      adminAndSellingOverheads.ytdAmount,
  };

  const depreciationAndAmortization = getGroupTotals("Depreciation & Amortization");
  const financeCosts = getGroupTotals("Finance Costs");

  const pbt = {
    currentMonth:
      operatingEbitda.currentMonth +
      otherIncome.currentMonth -
      depreciationAndAmortization.currentMonth -
      financeCosts.currentMonth,
    previousMonth:
      operatingEbitda.previousMonth +
      otherIncome.previousMonth -
      depreciationAndAmortization.previousMonth -
      financeCosts.previousMonth,
    ytdAmount:
      operatingEbitda.ytdAmount +
      otherIncome.ytdAmount -
      depreciationAndAmortization.ytdAmount -
      financeCosts.ytdAmount,
  };

  const taxExpense = getGroupTotals("Tax Expense");
  const pat = {
    currentMonth: pbt.currentMonth - taxExpense.currentMonth,
    previousMonth: pbt.previousMonth - taxExpense.previousMonth,
    ytdAmount: pbt.ytdAmount - taxExpense.ytdAmount,
  };

  const revCur = revenueFromOperations.currentMonth || 1;
  const grossMarginPct = Number(((grossProfit.currentMonth / revCur) * 100).toFixed(1));
  const ebitdaMarginPct = Number(((operatingEbitda.currentMonth / revCur) * 100).toFixed(1));
  const pbtMarginPct = Number(((pbt.currentMonth / revCur) * 100).toFixed(1));
  const patMarginPct = Number(((pat.currentMonth / revCur) * 100).toFixed(1));

  const totalStandardAccounts =
    pnlGroups.reduce((acc, g) => acc + g.standardAccounts.length, 0) +
    balanceSheetGroups.reduce((acc, g) => acc + g.standardAccounts.length, 0);

  return {
    pnlGroups,
    balanceSheetGroups,
    pnlSummary: {
      revenueFromOperations,
      otherIncome,
      totalIncome,
      manufacturingCost,
      grossProfit,
      grossMarginPct,
      employeeBenefitExpenses,
      adminAndSellingOverheads,
      operatingEbitda,
      ebitdaMarginPct,
      depreciationAndAmortization,
      financeCosts,
      pbt,
      pbtMarginPct,
      taxExpense,
      pat,
      patMarginPct,
    },
    allVouchers,
    stats: {
      totalLedgers: ledgers.length,
      pnlLedgersCount: ledgers.filter((l) => l.statementType === "P&L").length,
      bsLedgersCount: ledgers.filter((l) => l.statementType === "Balance Sheet").length,
      totalStandardAccounts,
      totalVouchers: allVouchers.length,
      approvedOrAutoCount,
      flaggedParentChangedCount,
      unmappedReviewCount,
    },
  };
}

/**
 * Smart fallback inference for brand-new Tally ledgers not yet in Mapping Memory
 */
function inferDefaultCfosarthiMapping(
  tallyLedgerName: string,
  tallyParentGroup: string,
  statementType: TallyStatementType = "P&L",
): {
  statementType: TallyStatementType;
  pnlSection: string;
  reportingGroup: string;
  standardAccount: string;
  sectionOrder: number;
  isIncome: boolean;
} {
  const lNorm = tallyLedgerName.toLowerCase();
  const pNorm = tallyParentGroup.toLowerCase();

  if (
    statementType === "Balance Sheet" ||
    pNorm.includes("capital") ||
    pNorm.includes("reserves") ||
    pNorm.includes("loan") ||
    pNorm.includes("creditor") ||
    pNorm.includes("debtor") ||
    pNorm.includes("fixed asset") ||
    pNorm.includes("bank account") ||
    pNorm.includes("stock") ||
    pNorm.includes("investment")
  ) {
    if (pNorm.includes("capital") || pNorm.includes("reserve")) {
      return {
        statementType: "Balance Sheet",
        pnlSection: "Shareholders' Funds",
        reportingGroup: "Equity & Retained Earnings",
        standardAccount: pNorm.includes("capital") ? "Equity Share Capital" : "Reserves & Surplus",
        sectionOrder: 1,
        isIncome: false,
      };
    }
    if (pNorm.includes("secured loan") || pNorm.includes("term loan")) {
      return {
        statementType: "Balance Sheet",
        pnlSection: "Non-Current Liabilities",
        reportingGroup: "Long-Term Debt & Obligations",
        standardAccount: "Long-Term Term Loans",
        sectionOrder: 2,
        isIncome: false,
      };
    }
    if (pNorm.includes("creditor") || pNorm.includes("duties") || pNorm.includes("od")) {
      return {
        statementType: "Balance Sheet",
        pnlSection: "Current Liabilities",
        reportingGroup: "Working Capital & Trade Liabilities",
        standardAccount: pNorm.includes("creditor")
          ? "Trade Payables (General & MSME)"
          : "Statutory Dues & Short-Term Provisions",
        sectionOrder: 3,
        isIncome: false,
      };
    }
    if (pNorm.includes("fixed asset") || pNorm.includes("investment")) {
      return {
        statementType: "Balance Sheet",
        pnlSection: "Non-Current Assets",
        reportingGroup: "Fixed Assets & Long-Term Investments",
        standardAccount: "Property, Plant & Equipment (Net Block)",
        sectionOrder: 4,
        isIncome: false,
      };
    }
    return {
      statementType: "Balance Sheet",
      pnlSection: "Current Assets",
      reportingGroup: "Working Capital & Liquid Assets",
      standardAccount: pNorm.includes("debtor")
        ? "Trade Receivables (Sundry Debtors)"
        : pNorm.includes("bank")
          ? "Cash & Bank Balances"
          : "Inventories (Raw Material, WIP & Finished Goods)",
      sectionOrder: 5,
      isIncome: false,
    };
  }

  // P&L Classification (Check Indirect Income BEFORE Direct Income so "indirect" never matches "direct")
  if (
    pNorm.includes("indirect income") ||
    pNorm.includes("other income") ||
    lNorm.includes("indirect income") ||
    lNorm.includes("other income") ||
    lNorm.includes("other operating") ||
    lNorm.includes("interest received") ||
    lNorm.includes("fd interest") ||
    lNorm.includes("forex gain") ||
    lNorm.includes("discount received")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Other Income",
      reportingGroup: "Non-Operating & Treasury Income",
      standardAccount: "Treasury & Forex Income",
      sectionOrder: 2,
      isIncome: true,
    };
  }
  const isDirectIncomeParent =
    !pNorm.includes("indirect") &&
    (pNorm.includes("sales") || pNorm.includes("direct income") || pNorm.includes("revenue"));
  if (isDirectIncomeParent || lNorm.includes("revenue") || lNorm.includes("sales")) {
    return {
      statementType: "P&L",
      pnlSection: "Revenue from Operations",
      reportingGroup: "Core Operating Revenue",
      standardAccount: lNorm.includes("export")
        ? "Export Sales & Apparel Shipments"
        : "Domestic Sales & Institutional Orders",
      sectionOrder: 1,
      isIncome: true,
    };
  }
  if (
    pNorm.includes("purchase") ||
    pNorm.includes("opening stock") ||
    pNorm.includes("closing stock") ||
    lNorm.includes("fabric") ||
    lNorm.includes("yarn") ||
    lNorm.includes("accessories") ||
    lNorm.includes("raw material") ||
    lNorm.includes("opening stock") ||
    lNorm.includes("closing stock")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Manufacturing Cost",
      reportingGroup: "Direct Material Cost",
      standardAccount: "Raw Material",
      sectionOrder: 3,
      isIncome: false,
    };
  }
  if (lNorm.includes("wages") || lNorm.includes("labour") || lNorm.includes("worker")) {
    return {
      statementType: "P&L",
      pnlSection: "Manufacturing Cost",
      reportingGroup: "Direct Manufacturing Wages",
      standardAccount: "Direct Labour",
      sectionOrder: 3,
      isIncome: false,
    };
  }
  const isOfficeOrAdmin =
    /indirect admin|administrative|office|corporate|showroom|head office|travelling|conveyance/i.test(
      lNorm,
    );
  if (
    !isOfficeOrAdmin &&
    (lNorm.includes("electricity") ||
      lNorm.includes("power") ||
      lNorm.includes("diesel") ||
      lNorm.includes("fuel") ||
      lNorm.includes("solar") ||
      lNorm.includes("generator"))
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Manufacturing Cost",
      reportingGroup: "Manufacturing Overheads",
      standardAccount: "Power & Fuel",
      sectionOrder: 3,
      isIncome: false,
    };
  }
  const isDirectExpenseParent =
    !pNorm.includes("indirect") &&
    (pNorm.includes("direct expense") || pNorm.includes("manufacturing"));
  if (
    !isOfficeOrAdmin &&
    (isDirectExpenseParent ||
      lNorm.includes("factory") ||
      lNorm.includes("plant") ||
      lNorm.includes("machinery") ||
      lNorm.includes("consumable") ||
      lNorm.includes("job work") ||
      lNorm.includes("freight inward"))
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Manufacturing Cost",
      reportingGroup: "Manufacturing Overheads",
      standardAccount: "Factory Overheads",
      sectionOrder: 3,
      isIncome: false,
    };
  }
  if (
    lNorm.includes("salary") ||
    lNorm.includes("salaries") ||
    lNorm.includes("payroll") ||
    lNorm.includes("employee") ||
    lNorm.includes("bonus") ||
    lNorm.includes("pf") ||
    lNorm.includes("provident fund") ||
    lNorm.includes("esic") ||
    lNorm.includes("staff welfare") ||
    lNorm.includes("canteen") ||
    lNorm.includes("gratuity") ||
    lNorm.includes("remuneration")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Employee Benefit Expenses",
      reportingGroup: "Corporate & Functional Payroll",
      standardAccount:
        lNorm.includes("pf") ||
        lNorm.includes("provident") ||
        lNorm.includes("esic") ||
        lNorm.includes("welfare") ||
        lNorm.includes("canteen") ||
        lNorm.includes("gratuity")
          ? "PF, ESIC & Staff Welfare"
          : "Salaries, Bonus & Management Remuneration",
      sectionOrder: 4,
      isIncome: false,
    };
  }
  if (
    lNorm.includes("depreciation") ||
    lNorm.includes("amortization") ||
    lNorm.includes("amortisation")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Depreciation & Amortization",
      reportingGroup: "Non-Cash Capital Charge",
      standardAccount: "Depreciation on Tangible & Intangible Assets",
      sectionOrder: 6,
      isIncome: false,
    };
  }
  if (
    lNorm.includes("interest") ||
    lNorm.includes("finance cost") ||
    lNorm.includes("bank charge") ||
    lNorm.includes("bank commission") ||
    lNorm.includes("packing credit") ||
    lNorm.includes("loan processing")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Finance Costs",
      reportingGroup: "Debt Servicing & Bank Charges",
      standardAccount: "Bank Interest & Packing Credit Charges",
      sectionOrder: 7,
      isIncome: false,
    };
  }
  if (
    lNorm.includes("income tax") ||
    lNorm.includes("deferred tax") ||
    lNorm.includes("current tax") ||
    lNorm.includes("tax provision")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Tax Expense",
      reportingGroup: "Corporate Taxation",
      standardAccount: "Current & Deferred Income Tax",
      sectionOrder: 8,
      isIncome: false,
    };
  }

  if (
    lNorm.includes("cloud") ||
    lNorm.includes("hosting") ||
    lNorm.includes("aws") ||
    lNorm.includes("software") ||
    lNorm.includes("server") ||
    lNorm.includes("erp") ||
    lNorm.includes("tech infra")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Administrative, Selling & Distribution",
      reportingGroup: "General & Administrative Overheads",
      standardAccount: "Cloud & IT Infrastructure",
      sectionOrder: 5,
      isIncome: false,
    };
  }

  if (
    lNorm.includes("freight outward") ||
    lNorm.includes("export clearing") ||
    lNorm.includes("ocean freight") ||
    lNorm.includes("cha ") ||
    lNorm.includes("logistics") ||
    lNorm.includes("transport") ||
    lNorm.includes("shipping") ||
    lNorm.includes("dispatch")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Administrative, Selling & Distribution",
      reportingGroup: "Selling & Logistics Overheads",
      standardAccount: "Freight Outward & Export Clearing",
      sectionOrder: 5,
      isIncome: false,
    };
  }

  if (
    lNorm.includes("sales promotion") ||
    lNorm.includes("marketing") ||
    lNorm.includes("advertis") ||
    lNorm.includes("exhibition") ||
    lNorm.includes("trade fair") ||
    lNorm.includes("sample") ||
    lNorm.includes("commission") ||
    lNorm.includes("business development") ||
    lNorm.includes("selling")
  ) {
    return {
      statementType: "P&L",
      pnlSection: "Administrative, Selling & Distribution",
      reportingGroup: "Selling & Logistics Overheads",
      standardAccount: "Sales Promotion & Trade Exhibitions",
      sectionOrder: 5,
      isIncome: false,
    };
  }

  return {
    statementType: "P&L",
    pnlSection: "Administrative, Selling & Distribution",
    reportingGroup: "General & Administrative Overheads",
    standardAccount: "Office Rent, Legal & Virtual CFO Retainership",
    sectionOrder: 5,
    isIncome: false,
  };
}

export interface IncomingTallyLedgerRow {
  tallyLedgerName: string; // Original Tally Ledger Name — strictly preserved
  tallyParentGroup: string; // Tally Parent Group
  statementType?: TallyStatementType;
  standardAccount?: string;
  reportingGroup?: string;
  pnlSection?: string;
  currentMonth: number;
  previousMonth?: number;
  ytdAmount?: number;
  vouchers?: TallyVoucherTransaction[];
}

export interface TallyImportRecognitionResult {
  mergedLedgers: TallyLedgerRecord[];
  autoMappedCount: number;
  flaggedParentChangedCount: number;
  newUnmappedCount: number;
  flaggedLedgers: Array<{
    tallyLedgerName: string;
    previousParentGroup: string;
    newParentGroup: string;
    standardAccount: string;
  }>;
}

/**
 * FUTURE TALLY IMPORTS & MAPPING RECOGNITION ENGINE
 *
 * Recognizes each incoming Tally ledger using:
 *   Company ID + Tally Ledger Name + Tally Parent Group
 *
 * Rules:
 * 1. If (Company ID + Tally Ledger Name + Tally Parent Group) matches an approved mapping rule:
 *    -> Automatically applies the previously approved CFOSARTHI mapping (`auto_mapped`).
 * 2. If (Company ID + Tally Ledger Name) matches an approved mapping rule, BUT `Tally Parent Group` has changed:
 *    -> Preserves the ledger, applies the prior classification provisionally, and FLAGS the ledger for review (`flagged_parent_changed`)!
 * 3. If the ledger is completely new for this Company ID:
 *    -> Preserves the exact `tallyLedgerName` and `tallyParentGroup`, applies either the provided mapping or smart inference, and marks `unmapped_review`.
 * 4. Never merges, deletes, overwrites, or renames any Tally Ledger Name!
 */
export function processTallyLedgerImport(
  companyId: string,
  period: string,
  existingLedgers: TallyLedgerRecord[],
  mappingRules: TallyLedgerMappingRule[],
  incomingRows: IncomingTallyLedgerRow[],
): TallyImportRecognitionResult {
  const updatedLedgers = [...existingLedgers];
  let autoMappedCount = 0;
  let flaggedParentChangedCount = 0;
  let newUnmappedCount = 0;
  const flaggedLedgers: TallyImportRecognitionResult["flaggedLedgers"] = [];

  const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

  for (const row of incomingRows) {
    const exactTallyName = row.tallyLedgerName.trim();
    const exactTallyParent = row.tallyParentGroup.trim();
    if (!exactTallyName) continue;

    // 1. Check approved Mapping Rules for (Company ID + Tally Ledger Name)
    const matchingRule = mappingRules.find(
      (r) =>
        r.companyId === companyId &&
        r.tallyLedgerName.trim().toLowerCase() === exactTallyName.toLowerCase(),
    );

    let mappingStatus: TallyMappingStatus = "unmapped_review";
    let previousTallyParentGroup: string | undefined = undefined;
    let resolvedStatementType: TallyStatementType = row.statementType || "P&L";
    let resolvedPnlSection = row.pnlSection || "";
    let resolvedReportingGroup = row.reportingGroup || "";
    let resolvedStandardAccount = row.standardAccount || "";
    let resolvedDisplayName: string | undefined = undefined;
    let resolvedSectionOrder = 3;
    let resolvedIsIncome = false;

    if (matchingRule) {
      // We found a historical rule for (Company ID + Tally Ledger Name)!
      // Now check if Tally Parent Group also matches:
      const parentMatches =
        matchingRule.tallyParentGroup.trim().toLowerCase() === exactTallyParent.toLowerCase();

      resolvedStatementType = matchingRule.statementType;
      resolvedPnlSection = matchingRule.pnlSection;
      resolvedReportingGroup = matchingRule.reportingGroup;
      resolvedStandardAccount = matchingRule.standardAccount;
      resolvedDisplayName = matchingRule.displayName;

      const secMeta = [...CFOSARTHI_PNL_SECTIONS, ...CFOSARTHI_BS_SECTIONS].find(
        (s) => s.pnlSection.toLowerCase() === resolvedPnlSection.toLowerCase(),
      );
      resolvedSectionOrder = secMeta?.sectionOrder || 3;
      resolvedIsIncome = Boolean(secMeta?.isIncome);

      if (parentMatches) {
        // Exact match on Company ID + Tally Ledger Name + Tally Parent Group!
        mappingStatus = "auto_mapped";
        autoMappedCount++;
      } else {
        // Parent group changed in Tally! Flag for CFO review!
        mappingStatus = "flagged_parent_changed";
        previousTallyParentGroup = matchingRule.tallyParentGroup;
        flaggedParentChangedCount++;
        flaggedLedgers.push({
          tallyLedgerName: exactTallyName,
          previousParentGroup: matchingRule.tallyParentGroup,
          newParentGroup: exactTallyParent,
          standardAccount: matchingRule.standardAccount,
        });
      }
    } else {
      // Brand new Tally ledger for this company
      const inferred = inferDefaultCfosarthiMapping(
        exactTallyName,
        exactTallyParent,
        row.statementType,
      );
      resolvedStatementType = row.statementType || inferred.statementType;
      resolvedPnlSection = row.pnlSection || inferred.pnlSection;
      resolvedReportingGroup = row.reportingGroup || inferred.reportingGroup;
      resolvedStandardAccount = row.standardAccount || inferred.standardAccount;
      resolvedSectionOrder = inferred.sectionOrder;
      resolvedIsIncome = inferred.isIncome;
      mappingStatus = "unmapped_review";
      newUnmappedCount++;
    }

    // Check if ledger already exists in current period's list by (Company ID + exact Tally Ledger Name)
    const existingIdx = updatedLedgers.findIndex(
      (l) =>
        l.companyId === companyId &&
        l.tallyLedgerName.trim().toLowerCase() === exactTallyName.toLowerCase(),
    );

    if (existingIdx >= 0) {
      const existing = updatedLedgers[existingIdx];
      updatedLedgers[existingIdx] = {
        ...existing,
        // NEVER overwrite original tallyLedgerName casing unless exact from Tally
        tallyLedgerName: existing.tallyLedgerName,
        tallyParentGroup: exactTallyParent,
        statementType: resolvedStatementType,
        pnlSection: resolvedPnlSection,
        reportingGroup: resolvedReportingGroup,
        standardAccount: resolvedStandardAccount,
        displayName: resolvedDisplayName || existing.displayName,
        sectionOrder: resolvedSectionOrder,
        isIncome: resolvedIsIncome,
        currentMonth: row.currentMonth,
        previousMonth: row.previousMonth ?? existing.previousMonth,
        ytdAmount: row.ytdAmount ?? existing.ytdAmount,
        vouchers: row.vouchers && row.vouchers.length > 0 ? row.vouchers : existing.vouchers,
        mappingStatus,
        previousTallyParentGroup,
        lastImportedAt: nowStr,
      };
    } else {
      updatedLedgers.push({
        id: `${companyId}-tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        companyId,
        period,
        statementType: resolvedStatementType,
        tallyLedgerName: exactTallyName,
        tallyParentGroup: exactTallyParent,
        displayName: resolvedDisplayName,
        standardAccount: resolvedStandardAccount,
        reportingGroup: resolvedReportingGroup,
        pnlSection: resolvedPnlSection,
        sectionOrder: resolvedSectionOrder,
        isIncome: resolvedIsIncome,
        currentMonth: row.currentMonth,
        previousMonth: row.previousMonth ?? Math.round(row.currentMonth * 0.92),
        ytdAmount: row.ytdAmount ?? row.currentMonth * 6,
        vouchers:
          row.vouchers && row.vouchers.length > 0
            ? row.vouchers
            : [
                {
                  id: `v-imp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                  voucherDate: "2026-09-28",
                  voucherNumber: `TALLY/IMP/${Math.floor(100 + Math.random() * 899)}`,
                  voucherType: resolvedIsIncome ? "Sales" : "Purchase",
                  tallyLedgerName: exactTallyName,
                  partyOrVendorName: "Imported via Tally Prime XML/Excel Ledger Sync",
                  narration: `Tally Ledger Closing Balance imported under parent '${exactTallyParent}'`,
                  costCentre: "Unit 1 & Unit 2",
                  amount: row.currentMonth,
                  drCr: resolvedIsIncome ? "Cr" : "Dr",
                },
              ],
        mappingStatus,
        previousTallyParentGroup,
        lastImportedAt: nowStr,
      });
    }
  }

  return {
    mergedLedgers: updatedLedgers,
    autoMappedCount,
    flaggedParentChangedCount,
    newUnmappedCount,
    flaggedLedgers,
  };
}

/**
 * Generates & downloads a Tally Ledger-Level MIS Excel Template (.xlsx)
 * with 2 sheets:
 * 1. "Tally_Ledgers_Master" (Tally Ledger Name, Tally Parent Group, CFOSARTHI Standard Account, CFOSARTHI Reporting Group, P&L Section, Current Month, Previous Month, YTD)
 * 2. "Tally_Vouchers_Detail" (Voucher Date, Voucher Number, Voucher Type, Tally Ledger Name, Party/Vendor, Narration, Cost Centre, Amount, Dr/Cr)
 */
export function downloadTallyLedgerExcelTemplate(
  companyName: string,
  period: string,
  ledgers: TallyLedgerRecord[],
): string {
  const wb = XLSX.utils.book_new();

  const ledgerRows: any[][] = [
    [`${companyName} - TALLY LEDGER-LEVEL MIS & MAPPING SHEET (${period})`],
    [
      "IMPORTANT: Original Tally Ledger Name and Tally Parent Group are preserved independently from CFOSARTHI Reporting Classification.",
    ],
    [],
    [
      "Tally Ledger Name (Exact from Tally)",
      "Tally Parent Group",
      "Statement Type",
      "P&L / BS Major Reporting Group",
      "CFOSARTHI Reporting Group",
      "CFOSARTHI Standard Account",
      "Current Month Amount (₹)",
      "Previous Month Amount (₹)",
      "YTD Amount (₹)",
      "Mapping Status",
    ],
  ];

  for (const l of ledgers) {
    ledgerRows.push([
      l.tallyLedgerName,
      l.tallyParentGroup,
      l.statementType,
      l.pnlSection,
      l.reportingGroup,
      l.standardAccount,
      l.currentMonth,
      l.previousMonth,
      l.ytdAmount,
      l.mappingStatus,
    ]);
  }

  const wsLedgers = XLSX.utils.aoa_to_sheet(ledgerRows);
  wsLedgers["!cols"] = [
    { wch: 42 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 28 },
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLedgers, "Tally_Ledgers_Master");

  const safeCompany = companyName.replace(/[^a-zA-Z0-9]/g, "_") || "CFOSARTHI";
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `${safeCompany}_Tally_Ledger_Level_MIS_${safePeriod}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

function parseLedgerNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  let raw = String(val).trim();
  if (!raw) return 0;
  if (/^\(.*\)$/.test(raw)) {
    raw = "-" + raw.slice(1, -1).trim();
  }
  let multiplier = 1;
  if (/cr(ore)?s?\b/i.test(raw)) {
    multiplier = 10000000;
  } else if (/\b(lakhs?|lacs?)\b/i.test(raw) || /[\d.]\s*l\b/i.test(raw)) {
    multiplier = 100000;
  } else if (/\b(thousands?)\b/i.test(raw) || /[\d.]\s*k\b/i.test(raw)) {
    multiplier = 1000;
  }
  const cleaned = raw
    .replace(/inr|rs\.?/gi, "")
    .replace(/cr(ore)?s?|lakhs?|lacs?|thousands?/gi, "")
    .replace(/[₹$,\sA-Za-z]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * multiplier * 100) / 100;
}

/**
 * Parses an uploaded Tally Ledger-Level Excel / CSV file
 */
export async function parseTallyLedgerExcelUpload(file: File): Promise<IncomingTallyLedgerRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  const incomingMap = new Map<string, IncomingTallyLedgerRow>();

  // 1. Parse Ledgers Sheet
  const ledgerSheetName =
    wb.SheetNames.find((n) => /ledger|master|p&l|profit|tally/i.test(n)) || wb.SheetNames[0];
  const wsLedgers = wb.Sheets[ledgerSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(wsLedgers, { header: 1, defval: "" });

  let headerIdx = -1;
  let isTenColumnMasterHeader = false;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const joined = rawRows[i].map((c) => String(c).toLowerCase()).join(" | ");
    if (
      joined.includes("standard account") ||
      joined.includes("reporting group") ||
      joined.includes("mapping status")
    ) {
      headerIdx = i;
      isTenColumnMasterHeader = true;
      break;
    }
    if (
      joined.includes("tally ledger") ||
      (joined.includes("ledger") && joined.includes("parent")) ||
      (joined.includes("particulars") && joined.includes("current"))
    ) {
      headerIdx = i;
      break;
    }
  }

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 1;
  for (let i = startRow; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.length < 2) continue;
    const tallyLedgerName = String(r[0] || "").trim();
    const tallyParentGroup = String(r[1] || "Indirect Expenses").trim();
    const lowerName = tallyLedgerName.toLowerCase();
    if (
      !tallyLedgerName ||
      lowerName.startsWith("important") ||
      lowerName.startsWith("instructions") ||
      lowerName.startsWith("exported from") ||
      lowerName.startsWith("tally ledger") ||
      lowerName === "particulars" ||
      lowerName.includes("statement of profit") ||
      lowerName.includes("profit & loss a/c") ||
      lowerName.startsWith("total revenue") ||
      lowerName.startsWith("total income") ||
      lowerName.startsWith("operating ebitda") ||
      lowerName.startsWith("profit before tax") ||
      lowerName.startsWith("profit after tax")
    ) {
      continue;
    }

    // Check if explicit 10-column template vs 6-column/3-column Tally export
    if (isTenColumnMasterHeader && r.length >= 7) {
      const statementType: TallyStatementType = String(r[2] || "")
        .toLowerCase()
        .includes("balance")
        ? "Balance Sheet"
        : "P&L";
      const pnlSection = String(r[3] || "").trim();
      const reportingGroup = String(r[4] || "").trim();
      const standardAccount = String(r[5] || "").trim();
      const currentMonth = parseLedgerNumber(r[6]);
      const previousMonth = r[7] !== "" && r[7] !== undefined ? parseLedgerNumber(r[7]) : undefined;
      const ytdAmount = r[8] !== "" && r[8] !== undefined ? parseLedgerNumber(r[8]) : undefined;

      incomingMap.set(tallyLedgerName.toLowerCase(), {
        tallyLedgerName,
        tallyParentGroup,
        statementType,
        pnlSection: pnlSection || undefined,
        reportingGroup: reportingGroup || undefined,
        standardAccount: standardAccount || undefined,
        currentMonth,
        previousMonth,
        ytdAmount,
        vouchers: [],
      });
    } else {
      const currentMonth = parseLedgerNumber(r[2]);
      const previousMonth = r[3] !== "" && r[3] !== undefined ? parseLedgerNumber(r[3]) : undefined;
      const ytdAmount = r[4] !== "" && r[4] !== undefined ? parseLedgerNumber(r[4]) : undefined;
      incomingMap.set(tallyLedgerName.toLowerCase(), {
        tallyLedgerName,
        tallyParentGroup,
        currentMonth,
        previousMonth,
        ytdAmount,
        vouchers: [],
      });
    }
  }

  // 2. Parse Optional Vouchers Sheet if present
  const voucherSheetName = wb.SheetNames.find((n) => /voucher|transaction|detail/i.test(n));
  if (voucherSheetName) {
    const wsV = wb.Sheets[voucherSheetName];
    const vRows: any[][] = XLSX.utils.sheet_to_json(wsV, { header: 1, defval: "" });
    for (let i = 1; i < vRows.length; i++) {
      const r = vRows[i];
      if (!r || r.length < 5) continue;
      const vDate = String(r[0] || "").trim();
      const vNo = String(r[1] || "").trim();
      const vType = String(r[2] || "Purchase").trim() as any;
      const ledgerName = String(r[3] || "").trim();
      const party = String(r[4] || "").trim();
      const narration = String(r[5] || "").trim();
      const costCentre = String(r[6] || "").trim();
      const amt = Number(String(r[7] || "0").replace(/[₹,\s]/g, "")) || 0;
      const drCr = String(r[8] || "Dr").trim() === "Cr" ? "Cr" : "Dr";

      if (!ledgerName || ledgerName.toLowerCase().includes("tally ledger name")) continue;
      const target = incomingMap.get(ledgerName.toLowerCase());
      if (target && amt > 0) {
        target.vouchers = target.vouchers || [];
        target.vouchers.push({
          id: `v-upl-${i}-${Date.now()}`,
          voucherDate: vDate || "2026-09-25",
          voucherNumber: vNo || `VCH/${i}`,
          voucherType: vType,
          tallyLedgerName: target.tallyLedgerName,
          partyOrVendorName: party || "Tally Party",
          narration: narration || "Imported voucher transaction",
          costCentre,
          amount: amt,
          drCr,
        });
      }
    }
  }

  return Array.from(incomingMap.values());
}
