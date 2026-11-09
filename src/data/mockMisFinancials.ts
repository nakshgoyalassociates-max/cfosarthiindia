import { BalanceSheetData, PnlStatementData, DebtorAgeingData, FundFlowData } from "../types";

export const NEXORA_BALANCE_SHEET: BalanceSheetData = {
  asOfDate: "31 August 2026",
  previousDate: "31 March 2026",
  equityAndLiabilities: {
    // 1. Shareholders' Funds
    shareCapital: 25000000, // ₹2.50 Cr (25,00,000 Equity Shares of ₹10 each)
    reservesAndSurplus: 34850000, // ₹3.485 Cr (Retained Earnings & Securities Premium)
    totalShareholdersFunds: 59850000, // ₹5.985 Cr

    // 2. Non-Current Liabilities
    longTermBorrowings: 12000000, // ₹1.20 Cr (HDFC Bank Term Loan for R&D Infrastructure)
    deferredTaxLiabilities: 1850000, // ₹18.5 L
    otherLongTermLiabilities: 1200000, // ₹12.0 L (Security deposits & gratuity provision)
    totalNonCurrentLiabilities: 15050000, // ₹1.505 Cr

    // 3. Current Liabilities
    shortTermBorrowings: 4500000, // ₹45.0 L (Working Capital Cash Credit Line)
    tradePayables: 3130000, // ₹31.3 L (General Vendors)
    tradePayablesMsme: 280000, // ₹2.8 L (MSME Sec 43B(h) Monitored Dues)
    otherCurrentLiabilities: 2450000, // ₹24.5 L (Statutory GST, TDS & PF Payable)
    shortTermProvisions: 1850000, // ₹18.5 L (Income Tax Provision & Staff Bonus)
    totalCurrentLiabilities: 12210000, // ₹1.221 Cr

    // Total: ₹5,98,50,000 + ₹1,50,50,000 + ₹1,22,10,000 = ₹8,71,10,000 (₹8.711 Cr)
    totalEquityAndLiabilities: 87110000,
  },
  assets: {
    // 1. Non-Current Assets
    propertyPlantEquipment: 24500000, // ₹2.45 Cr (Servers, MacBooks, Lab Hardware, Office Fixtures)
    accumulatedDepreciation: 5200000, // -₹52.0 L
    netPpe: 19300000, // ₹1.93 Cr
    capitalWorkInProgress: 2100000, // ₹21.0 L (AI Lab Server Cluster under commissioning)
    intangibleAssets: 8500000, // ₹85.0 L (Patented Core Algorithms & ERP Licences)
    nonCurrentInvestments: 5000000, // ₹50.0 L (Govt Bonds & Debt Mutual Funds)
    longTermLoansAndAdvances: 1650000, // ₹16.5 L (Commercial Lease Security Deposits)
    totalNonCurrentAssets: 36550000, // ₹3.655 Cr

    // 2. Current Assets
    inventories: 1460000, // ₹14.6 L (Proprietary IoT Hardware Spares & Packaging)
    tradeReceivables: 6240000, // ₹62.4 L (Gross Debtors)
    allowanceForDoubtfulDebts: 260000, // -₹2.6 L (ECL Provision under Ind AS 109)
    netTradeReceivables: 5980000, // ₹59.8 L
    cashAndCashEquivalents: 14250000, // ₹1.425 Cr (Liquid Current A/c, Sweep FD, Auto-Sweep)
    bankBalancesOther: 2200000, // ₹22.0 L (Lien Marked Fixed Deposits for Bank Guarantees)
    shortTermLoansAndAdvances: 1870000, // ₹18.7 L (Staff Travel Imprest, Vendor Advances)
    otherCurrentAssets: 2480000, // ₹24.8 L (Unutilized GST ITC & Prepaid Insurance/AWS)
    totalCurrentAssets: 50560000, // ₹5.056 Cr (Less ₹2.6L provision: ₹4,82,40,000 net current working)

    // Total Assets: ₹36,550,000 + (1,460,000 + 5,980,000 + 14,250,000 + 2,200,000 + 1,870,000 + 2,480,000) = ₹87,110,000
    // Math: 36,550,000 + 50,560,000 = 87,110,000 Exactly matches Total Equity & Liabilities!
    totalAssets: 87110000,
  },
  previousYearComparison: {
    totalEquityAndLiabilities: 79200000,
    totalAssets: 79200000,
    workingCapital: 31200000,
    netWorth: 51200000,
  },
};

export const NEXORA_PNL_STATEMENT: PnlStatementData = {
  period: "September 2026",
  comparisonPeriod: "August 2026",
  financialYear: "FY 2026-27 (Apr 2026 – Sep 2026)",
  monthsList: ["April 2026", "May 2026", "June 2026", "July 2026", "August 2026", "September 2026"],
  completedMonths: ["April 2026", "May 2026", "June 2026", "July 2026", "August 2026"],
  currentMonthKey: "September 2026",
  income: {
    revenueFromOperations: 5240000, // ₹52.40 L (September 2026 Current)
    otherIncome: 145000, // ₹1.45 L (Treasury yield, FD interest, forex gain)
    totalIncome: 5385000, // ₹53.85 L
  },
  expenses: {
    costOfMaterialsOrDirectCosts: 1610000, // Direct cloud compute & gateway charges (30.7%)
    employeeBenefitsExpense: 1275000, // Engineering, product & finance team payroll (24.3%)
    cloudAndInfrastructureCosts: 350000, // AWS & GCP enterprise hosting (reduced via reserved nodes)
    salesAndMarketingCosts: 340000, // Lead generation, events & enterprise acquisition
    otherExpenses: 245000, // Office lease, legal, audit & compliance retainership
    financeCosts: 92000, // Bank term loan interest & processing charges
    depreciationAndAmortization: 125000, // Monthly depreciation on assets & software licenses
    totalExpenses: 4037000, // ₹40.37 L
  },
  profitability: {
    grossProfit: 3630000, // ₹36.30 L
    grossMarginPercent: 69.3,
    ebitda: 1420000, // ₹14.20 L
    ebitdaMarginPercent: 27.1,
    pbt: 1348000, // ₹13.48 L (EBITDA + Other Income - D&A - Finance Costs)
    pbtMarginPercent: 25.7,
    currentTax: 242000, // Corporate advance tax monthly accrual
    deferredTax: 0,
    pat: 1106000, // ₹11.06 L Net Profit After Tax
    patMarginPercent: 21.1,
  },
  lineItems: [
    {
      id: "rev-ops",
      particulars: "Revenue from Operations (SaaS Subscriptions & Enterprise Licences)",
      noteRef: "Note 21",
      currentMonth: 5240000,
      previousMonth: 4850000,
      ytdCurrentYear: 27255000,
      momGrowthPct: 8.0,
      pctOfRevenue: 100.0,
      isSubtotal: false,
      monthlyBreakdown: {
        "April 2026": 4120000,
        "May 2026": 4280000,
        "June 2026": 4450000,
        "July 2026": 4315000,
        "August 2026": 4850000,
        "September 2026": 5240000,
      },
      varianceVsPrevious: 390000,
      varianceVsPreviousPct: 8.0,
      varianceVsBase: 1120000,
      varianceVsBasePct: 27.2,
      monthlyAverage: 4542500,
      varianceRemarks:
        "Strong enterprise expansion and ACV uplift; +8.0% MoM and +27.2% vs April kickoff",
    },
    {
      id: "other-inc",
      particulars: "Other Income (Sweep FD Interest, Treasury Yield & Forex Gain)",
      noteRef: "Note 22",
      currentMonth: 145000,
      previousMonth: 135000,
      ytdCurrentYear: 722000,
      momGrowthPct: 7.4,
      pctOfRevenue: 2.8,
      isSubtotal: false,
      monthlyBreakdown: {
        "April 2026": 95000,
        "May 2026": 110000,
        "June 2026": 125000,
        "July 2026": 112000,
        "August 2026": 135000,
        "September 2026": 145000,
      },
      varianceVsPrevious: 10000,
      varianceVsPreviousPct: 7.4,
      varianceVsBase: 50000,
      varianceVsBasePct: 52.6,
      monthlyAverage: 120333,
      varianceRemarks: "Auto-sweep FD interest and treasury returns from higher liquid surplus",
    },
    {
      id: "tot-inc",
      particulars: "I. Total Income (Revenue + Other Income)",
      currentMonth: 5385000,
      previousMonth: 4985000,
      ytdCurrentYear: 27977000,
      momGrowthPct: 8.0,
      pctOfRevenue: 102.8,
      isTotal: true,
      monthlyBreakdown: {
        "April 2026": 4215000,
        "May 2026": 4390000,
        "June 2026": 4575000,
        "July 2026": 4427000,
        "August 2026": 4985000,
        "September 2026": 5385000,
      },
      varianceVsPrevious: 400000,
      varianceVsPreviousPct: 8.0,
      varianceVsBase: 1170000,
      varianceVsBasePct: 27.8,
      monthlyAverage: 4662833,
    },
    {
      id: "exp-cogs",
      particulars: "Direct Operational Costs & Third-Party API Gateway Charges",
      noteRef: "Note 23",
      currentMonth: 1610000,
      previousMonth: 1542300,
      ytdCurrentYear: 8722300,
      momGrowthPct: 4.4,
      pctOfRevenue: 30.7,
      monthlyBreakdown: {
        "April 2026": 1350000,
        "May 2026": 1380000,
        "June 2026": 1430000,
        "July 2026": 1410000,
        "August 2026": 1542300,
        "September 2026": 1610000,
      },
      varianceVsPrevious: 67700,
      varianceVsPreviousPct: 4.4,
      varianceVsBase: 260000,
      varianceVsBasePct: 19.3,
      monthlyAverage: 1453717,
      varianceRemarks:
        "Direct infra scaled with active user volume; gross margin sustained above 69%",
    },
    {
      id: "exp-emp",
      particulars: "Employee Benefit Expenses (Engineering, Finance & Operations Payroll)",
      noteRef: "Note 24",
      currentMonth: 1275000,
      previousMonth: 1240000,
      ytdCurrentYear: 7115000,
      momGrowthPct: 2.8,
      pctOfRevenue: 24.3,
      monthlyBreakdown: {
        "April 2026": 1120000,
        "May 2026": 1140000,
        "June 2026": 1160000,
        "July 2026": 1180000,
        "August 2026": 1240000,
        "September 2026": 1275000,
      },
      varianceVsPrevious: 35000,
      varianceVsPreviousPct: 2.8,
      varianceVsBase: 155000,
      varianceVsBasePct: 13.8,
      monthlyAverage: 1185833,
      varianceRemarks:
        "Increment for 2 senior engineering hires and quarterly PF/ESI re-benchmarking",
    },
    {
      id: "exp-cloud",
      particulars: "Cloud Computing, AI Model Inference & Hosting Infrastructure",
      noteRef: "Note 25",
      currentMonth: 350000,
      previousMonth: 365000,
      ytdCurrentYear: 2295000,
      momGrowthPct: -4.1,
      pctOfRevenue: 6.7,
      monthlyBreakdown: {
        "April 2026": 410000,
        "May 2026": 395000,
        "June 2026": 385000,
        "July 2026": 390000,
        "August 2026": 365000,
        "September 2026": 350000,
      },
      varianceVsPrevious: -15000,
      varianceVsPreviousPct: -4.1,
      varianceVsBase: -60000,
      varianceVsBasePct: -14.6,
      monthlyAverage: 382500,
      varianceRemarks:
        "Favorable variance: 3-year compute savings plan locked on AWS reducing unit egress cost",
    },
    {
      id: "exp-mktg",
      particulars: "Sales Promotion, Digital Marketing & Enterprise Conferences",
      noteRef: "Note 26",
      currentMonth: 340000,
      previousMonth: 322000,
      ytdCurrentYear: 1807000,
      momGrowthPct: 5.6,
      pctOfRevenue: 6.5,
      monthlyBreakdown: {
        "April 2026": 260000,
        "May 2026": 280000,
        "June 2026": 310000,
        "July 2026": 295000,
        "August 2026": 322000,
        "September 2026": 340000,
      },
      varianceVsPrevious: 18000,
      varianceVsPreviousPct: 5.6,
      varianceVsBase: 80000,
      varianceVsBasePct: 30.8,
      monthlyAverage: 301167,
      varianceRemarks: "Q2 end pipeline push for enterprise client conversion",
    },
    {
      id: "exp-admin",
      particulars: "Administrative, Rent, Legal & Virtual CFO Compliance Retainership",
      noteRef: "Note 27",
      currentMonth: 245000,
      previousMonth: 240700,
      ytdCurrentYear: 1405700,
      momGrowthPct: 1.8,
      pctOfRevenue: 4.7,
      monthlyBreakdown: {
        "April 2026": 225000,
        "May 2026": 228000,
        "June 2026": 235000,
        "July 2026": 232000,
        "August 2026": 240700,
        "September 2026": 245000,
      },
      varianceVsPrevious: 4300,
      varianceVsPreviousPct: 1.8,
      varianceVsBase: 20000,
      varianceVsBasePct: 8.9,
      monthlyAverage: 234283,
      varianceRemarks:
        "Includes Virtual CFO retainership, ROC secretarial audits, statutory licenses",
    },
    {
      id: "ebitda-sub",
      particulars: "II. Operating EBITDA (Operational Profitability)",
      currentMonth: 1420000,
      previousMonth: 1140000,
      ytdCurrentYear: 6352000,
      momGrowthPct: 24.6,
      pctOfRevenue: 27.1,
      isSubtotal: true,
      monthlyBreakdown: {
        "April 2026": 850000,
        "May 2026": 967000,
        "June 2026": 1055000,
        "July 2026": 920000,
        "August 2026": 1140000,
        "September 2026": 1420000,
      },
      varianceVsPrevious: 280000,
      varianceVsPreviousPct: 24.6,
      varianceVsBase: 570000,
      varianceVsBasePct: 67.1,
      monthlyAverage: 1058667,
      varianceRemarks:
        "Operating leverage kicking in as top-line rose 8% while opex grew only 2.3%",
    },
    {
      id: "exp-depr",
      particulars: "Depreciation & Amortization Expense (PPE & Intangibles)",
      noteRef: "Note 11",
      currentMonth: 125000,
      previousMonth: 125000,
      ytdCurrentYear: 735000,
      momGrowthPct: 0.0,
      pctOfRevenue: 2.4,
      monthlyBreakdown: {
        "April 2026": 120000,
        "May 2026": 122000,
        "June 2026": 123000,
        "July 2026": 120000,
        "August 2026": 125000,
        "September 2026": 125000,
      },
      varianceVsPrevious: 0,
      varianceVsPreviousPct: 0.0,
      varianceVsBase: 5000,
      varianceVsBasePct: 4.2,
      monthlyAverage: 122500,
    },
    {
      id: "exp-fin",
      particulars: "Finance Costs (Bank Loan Interest & Processing Charges)",
      noteRef: "Note 28",
      currentMonth: 92000,
      previousMonth: 95000,
      ytdCurrentYear: 587000,
      momGrowthPct: -3.2,
      pctOfRevenue: 1.8,
      monthlyBreakdown: {
        "April 2026": 105000,
        "May 2026": 102000,
        "June 2026": 100000,
        "July 2026": 98000,
        "August 2026": 95000,
        "September 2026": 92000,
      },
      varianceVsPrevious: -3000,
      varianceVsPreviousPct: -3.2,
      varianceVsBase: -13000,
      varianceVsBasePct: -12.4,
      monthlyAverage: 97833,
      varianceRemarks:
        "Principal amortization of term loan lowering interest burden month over month",
    },
    {
      id: "pbt-total",
      particulars: "III. Profit Before Tax (PBT)",
      currentMonth: 1348000,
      previousMonth: 1055000,
      ytdCurrentYear: 5747000,
      momGrowthPct: 27.8,
      pctOfRevenue: 25.7,
      isSubtotal: true,
      monthlyBreakdown: {
        "April 2026": 720000,
        "May 2026": 853000,
        "June 2026": 957000,
        "July 2026": 814000,
        "August 2026": 1055000,
        "September 2026": 1348000,
      },
      varianceVsPrevious: 293000,
      varianceVsPreviousPct: 27.8,
      varianceVsBase: 628000,
      varianceVsBasePct: 87.2,
      monthlyAverage: 957833,
    },
    {
      id: "tax-exp",
      particulars: "Current Tax Expense (Corporate Advance Tax Provision)",
      noteRef: "Note 29",
      currentMonth: 242000,
      previousMonth: 190000,
      ytdCurrentYear: 1040000,
      momGrowthPct: 27.4,
      pctOfRevenue: 4.6,
      monthlyBreakdown: {
        "April 2026": 135000,
        "May 2026": 155000,
        "June 2026": 172000,
        "July 2026": 146000,
        "August 2026": 190000,
        "September 2026": 242000,
      },
      varianceVsPrevious: 52000,
      varianceVsPreviousPct: 27.4,
      varianceVsBase: 107000,
      varianceVsBasePct: 79.3,
      monthlyAverage: 173333,
      varianceRemarks:
        "Quarterly advance tax provision matched to Sec 115BAA corporate tax requirements",
    },
    {
      id: "pat-final",
      particulars: "IV. Profit After Tax - PAT (Net Margin Bottom-Line)",
      currentMonth: 1106000,
      previousMonth: 865000,
      ytdCurrentYear: 4707000,
      momGrowthPct: 27.9,
      pctOfRevenue: 21.1,
      isTotal: true,
      monthlyBreakdown: {
        "April 2026": 585000,
        "May 2026": 698000,
        "June 2026": 785000,
        "July 2026": 668000,
        "August 2026": 865000,
        "September 2026": 1106000,
      },
      varianceVsPrevious: 241000,
      varianceVsPreviousPct: 27.9,
      varianceVsBase: 521000,
      varianceVsBasePct: 89.1,
      monthlyAverage: 784500,
      varianceRemarks:
        "Net profit crossed ₹11 Lakhs milestone; net margin of 21.1% vs 14.2% in April",
    },
  ],
};

export const NEXORA_DEBTOR_AGEING: DebtorAgeingData = {
  asOfDate: "31 August 2026",
  totalReceivables: 6240000, // ₹62.4 L
  daysSalesOutstanding: 44, // 44 Days
  overduePercentage: 27.2, // % > 60 days
  provisionForBadDebts: 260000, // ₹2.6 L
  buckets: {
    days0to30: { amount: 3450000, percentage: 55.3, count: 28 }, // Current / On schedule
    days31to60: { amount: 1510000, percentage: 24.2, count: 12 }, // Approaching due
    days61to90: { amount: 300000, percentage: 4.8, count: 3 }, // Active follow-up
    days91to180: { amount: 680000, percentage: 10.9, count: 4 }, // High risk
    daysAbove180: { amount: 300000, percentage: 4.8, count: 1 }, // Critical / Provisioned
  },
  topDebtors: [
    {
      id: "deb-1",
      customerName: "Tata Consultancy Services Ltd (BFS Tech Div)",
      entityType: "Enterprise Client",
      gstin: "27AAACT2727Q1ZW",
      creditPeriodDays: 45,
      totalOutstanding: 1450000,
      bucket0to30: 1200000,
      bucket31to60: 250000,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: "2026-08-22",
      lastPaymentAmount: 850000,
      dsoDays: 32,
      riskRating: "Low",
      status: "Current",
      followUpNotes:
        "Invoice verified by TCS procurement. Milestones cleared, batch payout scheduled for 24th Sep.",
      assignedManager: "Sneha Roy",
    },
    {
      id: "deb-2",
      customerName: "Mindcrest Healthcare Analytics Corp",
      entityType: "Mid-Market Client",
      gstin: "07AABCM8821F1ZX",
      creditPeriodDays: 30,
      totalOutstanding: 880000,
      bucket0to30: 450000,
      bucket31to60: 430000,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: "2026-08-10",
      lastPaymentAmount: 420000,
      dsoDays: 42,
      riskRating: "Low",
      status: "Audit Confirmation Reconciled",
      followUpNotes: "External balance confirmation signed and confirmed via email on 14th Sep.",
      assignedManager: "Pooja Sharma",
    },
    {
      id: "deb-3",
      customerName: "Kalyan Logistics & Port Services Pvt Ltd",
      entityType: "Enterprise Client",
      gstin: "24AAACK1920B1Z7",
      creditPeriodDays: 30,
      totalOutstanding: 740000,
      bucket0to30: 200000,
      bucket31to60: 240000,
      bucket61to90: 300000,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: "2026-07-18",
      lastPaymentAmount: 310000,
      dsoDays: 68,
      riskRating: "Medium",
      status: "Promise to Pay",
      followUpNotes:
        "CFO spoke with finance head Mr. Rawat. Payment of ₹3.0L promised by 22nd Sep.",
      assignedManager: "CA Manish Goyal",
    },
    {
      id: "deb-4",
      customerName: "Verve Dynamic Media Networks LLP",
      entityType: "Agency Partner",
      gstin: "27AAAFV6629M1ZS",
      creditPeriodDays: 30,
      totalOutstanding: 680000,
      bucket0to30: 0,
      bucket31to60: 180000,
      bucket61to90: 0,
      bucket91to180: 500000,
      bucketAbove180: 0,
      lastPaymentDate: "2026-05-30",
      lastPaymentAmount: 150000,
      dsoDays: 115,
      riskRating: "High",
      status: "Escalated to CFO",
      followUpNotes:
        "Billing dispute regarding AWS third-party pass-through mark-up. Formal reconciliation meet on 21st Sep.",
      assignedManager: "CA Manish Goyal",
    },
    {
      id: "deb-5",
      customerName: "Skyward Retail Technologies India Ltd",
      entityType: "Enterprise Client",
      gstin: "29AABCS8810K1ZT",
      creditPeriodDays: 45,
      totalOutstanding: 550000,
      bucket0to30: 550000,
      bucket31to60: 0,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: "2026-08-28",
      lastPaymentAmount: 500000,
      dsoDays: 28,
      riskRating: "Low",
      status: "Current",
      followUpNotes: "Q2 SLA renewal contract approved. Full settlement on 30-day term.",
      assignedManager: "Sneha Roy",
    },
    {
      id: "deb-6",
      customerName: "Orion FinTech Systems Private Limited",
      entityType: "Startup Client",
      gstin: "36AAAC09912A1Z1",
      creditPeriodDays: 30,
      totalOutstanding: 480000,
      bucket0to30: 300000,
      bucket31to60: 0,
      bucket61to90: 0,
      bucket91to180: 180000,
      bucketAbove180: 0,
      lastPaymentDate: "2026-06-15",
      lastPaymentAmount: 200000,
      dsoDays: 92,
      riskRating: "High",
      status: "Reminder Sent",
      followUpNotes:
        "Overdue reminder notice dispatched with GST invoice attachments. Series A funding round pending.",
      assignedManager: "Pooja Sharma",
    },
    {
      id: "deb-7",
      customerName: "Apex Cloud Solutions (Legacy Account)",
      entityType: "SME Client",
      gstin: "27AABCA3310F1ZT",
      creditPeriodDays: 30,
      totalOutstanding: 300000,
      bucket0to30: 0,
      bucket31to60: 0,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 300000,
      lastPaymentDate: "2026-01-20",
      lastPaymentAmount: 100000,
      dsoDays: 220,
      riskRating: "High",
      status: "Legal Notice",
      followUpNotes:
        "Full provision of ₹2.6L created in books under Ind AS ECL model. Legal notice under Section 138 / IBC in review.",
      assignedManager: "CA Manish Goyal",
    },
    {
      id: "deb-8",
      customerName: "Other Small Customers (21 Active Accounts)",
      entityType: "SME Aggregated",
      creditPeriodDays: 30,
      totalOutstanding: 1160000,
      bucket0to30: 750000,
      bucket31to60: 410000,
      bucket61to90: 0,
      bucket91to180: 0,
      bucketAbove180: 0,
      lastPaymentDate: "2026-08-30",
      lastPaymentAmount: 640000,
      dsoDays: 35,
      riskRating: "Low",
      status: "Current",
      followUpNotes: "Regular monthly billing cycle. Automatic payment gateway collection enabled.",
      assignedManager: "Sneha Roy",
    },
  ],
};

export const NEXORA_FUND_FLOW: FundFlowData = {
  period: "August 2026 (Month-End Flow)",
  sources: {
    fundsFromOperations: 1085000, // Net Profit (₹8.65L) + Non-Cash Depreciation (₹1.25L) + Tax Provision (₹0.95L)
    issueOfShareCapital: 0, // No new equity dilution in current month
    longTermBorrowingsRaised: 500000, // ₹5.0 L (Tranche disbursement for GPU hardware lease)
    saleOfFixedAssets: 0, // Zero asset disposals
    decreaseInWorkingCapital: 0, // Working capital increased, so it is an application
    totalSources: 1585000, // ₹15.85 L
  },
  applications: {
    purchaseOfFixedAssets: 480000, // Capex: 4 High-spec Apple M3 Pro MacBooks & Network Firewall
    repaymentOfLongTermBorrowings: 250000, // Monthly term loan principal amortization
    paymentOfTaxAndAdvanceTax: 200000, // Statutory advance tax installment
    paymentOfDividendsOrDrawings: 0, // Zero dividend payout (profit retained)
    increaseInWorkingCapital: 655000, // Net surplus absorption into working capital
    totalApplications: 1585000, // ₹15.85 L (Sources = Applications: Balanced!)
  },
  netMovementOfFunds: 655000, // Net increase in operating liquidity
  openingCashAndBank: 13595000, // ₹1.359 Cr at start of August
  closingCashAndBank: 14250000, // ₹1.425 Cr at end of August (Net Increase: +₹6.55 Lakhs)
  workingCapitalSchedule: {
    totalCurrentAssetsPrevious: 49450000,
    totalCurrentAssetsCurrent: 50560000, // +₹11.10 L change in current assets
    totalCurrentLiabilitiesPrevious: 11755000,
    totalCurrentLiabilitiesCurrent: 12210000, // +₹4.55 L change in current liabilities
    workingCapitalPrevious: 37695000, // ₹3.769 Cr
    workingCapitalCurrent: 38350000, // ₹3.835 Cr
    netChangeInWorkingCapital: 655000, // +₹6.55 Lakhs
    netChangeType: "Increase",
    items: [
      {
        id: "wc-1",
        particulars: "Inventories & Spares",
        category: "Current Asset",
        previousPeriod: 1280000,
        currentPeriod: 1460000,
        effect: "Increase in Working Capital",
        effectAmount: 180000,
      },
      {
        id: "wc-2",
        particulars: "Trade Receivables (Debtors)",
        category: "Current Asset",
        previousPeriod: 5850000,
        currentPeriod: 6240000,
        effect: "Increase in Working Capital",
        effectAmount: 390000,
      },
      {
        id: "wc-3",
        particulars: "Cash & Bank Balances (Liquid Funds)",
        category: "Current Asset",
        previousPeriod: 13595000,
        currentPeriod: 14250000,
        effect: "Increase in Working Capital",
        effectAmount: 655000,
      },
      {
        id: "wc-4",
        particulars: "Short-term Advances & GST ITC Balance",
        category: "Current Asset",
        previousPeriod: 4525000,
        currentPeriod: 4350000,
        effect: "Decrease in Working Capital",
        effectAmount: -175000,
      },
      {
        id: "wc-5",
        particulars: "Trade Payables (Vendor Creditors & MSME)",
        category: "Current Liability",
        previousPeriod: 3120000,
        currentPeriod: 3410000,
        effect: "Decrease in Working Capital",
        effectAmount: -290000,
      },
      {
        id: "wc-6",
        particulars: "Other Current Statutory Liabilities & Provisions",
        category: "Current Liability",
        previousPeriod: 4135000,
        currentPeriod: 4300000,
        effect: "Decrease in Working Capital",
        effectAmount: -165000,
      },
    ],
  },
};

// Company-specific multi-entity dictionary
export const COMPANY_MIS_DETAILED: Record<
  string,
  {
    balanceSheet: BalanceSheetData;
    pnlStatement: PnlStatementData;
    debtorAgeing: DebtorAgeingData;
    fundFlow: FundFlowData;
  }
> = {
  "client-101": {
    balanceSheet: NEXORA_BALANCE_SHEET,
    pnlStatement: NEXORA_PNL_STATEMENT,
    debtorAgeing: NEXORA_DEBTOR_AGEING,
    fundFlow: NEXORA_FUND_FLOW,
  },
  "client-102": {
    balanceSheet: {
      ...NEXORA_BALANCE_SHEET,
      asOfDate: "31 August 2026",
      equityAndLiabilities: {
        shareCapital: 40000000,
        reservesAndSurplus: 48200000,
        totalShareholdersFunds: 88200000,
        longTermBorrowings: 28500000, // Vehicle fleet financing
        deferredTaxLiabilities: 2400000,
        otherLongTermLiabilities: 1800000,
        totalNonCurrentLiabilities: 32700000,
        shortTermBorrowings: 12000000,
        tradePayables: 6350000,
        tradePayablesMsme: 450000,
        otherCurrentLiabilities: 3800000,
        shortTermProvisions: 2100000,
        totalCurrentLiabilities: 24700000,
        totalEquityAndLiabilities: 145600000,
      },
      assets: {
        propertyPlantEquipment: 68500000, // 48 Commercial Trucks & Warehouses
        accumulatedDepreciation: 14200000,
        netPpe: 54300000,
        capitalWorkInProgress: 3200000,
        intangibleAssets: 4100000,
        nonCurrentInvestments: 8000000,
        longTermLoansAndAdvances: 3500000,
        totalNonCurrentAssets: 73100000,
        inventories: 3800000, // Tires, Fuel reserves, Fleet Spares
        tradeReceivables: 11200000,
        allowanceForDoubtfulDebts: 450000,
        netTradeReceivables: 10750000,
        cashAndCashEquivalents: 21500000,
        bankBalancesOther: 3500000,
        shortTermLoansAndAdvances: 2950000,
        otherCurrentAssets: 4200000,
        totalCurrentAssets: 46700000,
        totalAssets: 145600000,
      },
    },
    pnlStatement: {
      ...NEXORA_PNL_STATEMENT,
      income: {
        revenueFromOperations: 8200000,
        otherIncome: 180000,
        totalIncome: 8380000,
      },
      profitability: {
        grossProfit: 3649000,
        grossMarginPercent: 44.5,
        ebitda: 1480000,
        ebitdaMarginPercent: 18.0,
        pbt: 1210000,
        pbtMarginPercent: 14.8,
        currentTax: 230000,
        deferredTax: 0,
        pat: 980000,
        patMarginPercent: 12.0,
      },
    },
    debtorAgeing: {
      ...NEXORA_DEBTOR_AGEING,
      totalReceivables: 11200000,
      daysSalesOutstanding: 51,
      provisionForBadDebts: 450000,
      buckets: {
        days0to30: { amount: 5600000, percentage: 50.0, count: 34 },
        days31to60: { amount: 3100000, percentage: 27.7, count: 18 },
        days61to90: { amount: 1050000, percentage: 9.4, count: 7 },
        days91to180: { amount: 1000000, percentage: 8.9, count: 5 },
        daysAbove180: { amount: 450000, percentage: 4.0, count: 2 },
      },
      topDebtors: [
        {
          id: "deb-102-1",
          customerName: "Adani Ports & Special Economic Zone",
          entityType: "Enterprise Client",
          gstin: "24AABCA1234F1Z8",
          creditPeriodDays: 60,
          totalOutstanding: 2850000,
          bucket0to30: 1950000,
          bucket31to60: 900000,
          bucket61to90: 0,
          bucket91to180: 0,
          bucketAbove180: 0,
          lastPaymentDate: "2026-08-25",
          lastPaymentAmount: 1800000,
          dsoDays: 45,
          riskRating: "Low",
          status: "Current",
          followUpNotes: "Interstate container freight billed on 60-day terms. Payout approved.",
          assignedManager: "Sneha Roy",
        },
        {
          id: "deb-102-2",
          customerName: "Reliance Retail Supply Chain Ltd",
          entityType: "Enterprise Client",
          gstin: "27AAACR1290C1ZP",
          creditPeriodDays: 45,
          totalOutstanding: 2150000,
          bucket0to30: 1600000,
          bucket31to60: 550000,
          bucket61to90: 0,
          bucket91to180: 0,
          bucketAbove180: 0,
          lastPaymentDate: "2026-08-18",
          lastPaymentAmount: 1400000,
          dsoDays: 42,
          riskRating: "Low",
          status: "Current",
          followUpNotes: "Warehousing and fleet cross-dock charges verified.",
          assignedManager: "Pooja Sharma",
        },
      ],
    },
    fundFlow: {
      ...NEXORA_FUND_FLOW,
      sources: {
        fundsFromOperations: 1850000,
        issueOfShareCapital: 0,
        longTermBorrowingsRaised: 2400000,
        saleOfFixedAssets: 350000, // Sale of 2 depreciated cargo vans
        totalSources: 4600000,
      },
      applications: {
        purchaseOfFixedAssets: 3100000, // Procured 3 BharatBenz heavy trucks
        repaymentOfLongTermBorrowings: 650000,
        paymentOfTaxAndAdvanceTax: 320000,
        paymentOfDividendsOrDrawings: 0,
        increaseInWorkingCapital: 530000,
        totalApplications: 4600000,
      },
      netMovementOfFunds: 530000,
      openingCashAndBank: 20970000,
      closingCashAndBank: 21500000,
    },
  },
  "client-103": {
    balanceSheet: {
      ...NEXORA_BALANCE_SHEET,
      asOfDate: "31 August 2026",
      equityAndLiabilities: {
        shareCapital: 15000000,
        reservesAndSurplus: 19800000,
        totalShareholdersFunds: 34800000,
        longTermBorrowings: 0, // Zero long-term debt
        deferredTaxLiabilities: 650000,
        otherLongTermLiabilities: 450000,
        totalNonCurrentLiabilities: 1100000,
        shortTermBorrowings: 0,
        tradePayables: 1840000,
        tradePayablesMsme: 110000,
        otherCurrentLiabilities: 1250000,
        shortTermProvisions: 950000,
        totalCurrentLiabilities: 4150000,
        totalEquityAndLiabilities: 40050000,
      },
      assets: {
        propertyPlantEquipment: 14500000,
        accumulatedDepreciation: 2800000,
        netPpe: 11700000,
        capitalWorkInProgress: 1200000,
        intangibleAssets: 5400000,
        nonCurrentInvestments: 2500000,
        longTermLoansAndAdvances: 950000,
        totalNonCurrentAssets: 21750000,
        inventories: 2100000,
        tradeReceivables: 3800000,
        allowanceForDoubtfulDebts: 120000,
        netTradeReceivables: 3680000,
        cashAndCashEquivalents: 9500000,
        bankBalancesOther: 1100000,
        shortTermLoansAndAdvances: 820000,
        otherCurrentAssets: 1100000,
        totalCurrentAssets: 18300000,
        totalAssets: 40050000,
      },
    },
    pnlStatement: {
      ...NEXORA_PNL_STATEMENT,
      income: {
        revenueFromOperations: 2940000,
        otherIncome: 85000,
        totalIncome: 3025000,
      },
      profitability: {
        grossProfit: 2175600,
        grossMarginPercent: 74.0,
        ebitda: 820000,
        ebitdaMarginPercent: 27.9,
        pbt: 785000,
        pbtMarginPercent: 26.7,
        currentTax: 115000,
        deferredTax: 0,
        pat: 670000,
        patMarginPercent: 22.8,
      },
    },
    debtorAgeing: {
      ...NEXORA_DEBTOR_AGEING,
      totalReceivables: 3800000,
      daysSalesOutstanding: 38,
      provisionForBadDebts: 120000,
      buckets: {
        days0to30: { amount: 2450000, percentage: 64.5, count: 19 },
        days31to60: { amount: 930000, percentage: 24.5, count: 8 },
        days61to90: { amount: 240000, percentage: 6.3, count: 2 },
        days91to180: { amount: 180000, percentage: 4.7, count: 2 },
        daysAbove180: { amount: 0, percentage: 0.0, count: 0 },
      },
      topDebtors: [
        {
          id: "deb-103-1",
          customerName: "Apollo Hospitals Enterprise Ltd",
          entityType: "Hospital Network",
          gstin: "33AAAAP0812F1Z4",
          creditPeriodDays: 30,
          totalOutstanding: 1450000,
          bucket0to30: 1150000,
          bucket31to60: 300000,
          bucket61to90: 0,
          bucket91to180: 0,
          bucketAbove180: 0,
          lastPaymentDate: "2026-08-20",
          lastPaymentAmount: 900000,
          dsoDays: 31,
          riskRating: "Low",
          status: "Current",
          followUpNotes: "Diagnostic assay kits supply on 30-day revolving credit.",
          assignedManager: "Pooja Sharma",
        },
      ],
    },
    fundFlow: {
      ...NEXORA_FUND_FLOW,
      sources: {
        fundsFromOperations: 810000,
        issueOfShareCapital: 0,
        longTermBorrowingsRaised: 0,
        saleOfFixedAssets: 0,
        totalSources: 810000,
      },
      applications: {
        purchaseOfFixedAssets: 210000,
        repaymentOfLongTermBorrowings: 0,
        paymentOfTaxAndAdvanceTax: 120000,
        paymentOfDividendsOrDrawings: 0,
        increaseInWorkingCapital: 480000,
        totalApplications: 810000,
      },
      netMovementOfFunds: 480000,
      openingCashAndBank: 9020000,
      closingCashAndBank: 9500000,
    },
  },
};
