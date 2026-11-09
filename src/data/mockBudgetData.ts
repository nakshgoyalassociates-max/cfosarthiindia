import { BudgetCategory, BudgetLineItem, BudgetMonthKey, BudgetMonthMeta } from "../types";

export const BUDGET_MONTHS: BudgetMonthMeta[] = [
  {
    key: "apr",
    label: "April 2026",
    shortLabel: "Apr 26",
    quarter: "Q1",
    calendarMonth: 4,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "may",
    label: "May 2026",
    shortLabel: "May 26",
    quarter: "Q1",
    calendarMonth: 5,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "jun",
    label: "June 2026",
    shortLabel: "Jun 26",
    quarter: "Q1",
    calendarMonth: 6,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "jul",
    label: "July 2026",
    shortLabel: "Jul 26",
    quarter: "Q2",
    calendarMonth: 7,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "aug",
    label: "August 2026",
    shortLabel: "Aug 26",
    quarter: "Q2",
    calendarMonth: 8,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "sep",
    label: "September 2026",
    shortLabel: "Sep 26",
    quarter: "Q2",
    calendarMonth: 9,
    year: 2026,
    isActualsUploaded: true,
  },
  {
    key: "oct",
    label: "October 2026",
    shortLabel: "Oct 26",
    quarter: "Q3",
    calendarMonth: 10,
    year: 2026,
    isActualsUploaded: false,
  },
  {
    key: "nov",
    label: "November 2026",
    shortLabel: "Nov 26",
    quarter: "Q3",
    calendarMonth: 11,
    year: 2026,
    isActualsUploaded: false,
  },
  {
    key: "dec",
    label: "December 2026",
    shortLabel: "Dec 26",
    quarter: "Q3",
    calendarMonth: 12,
    year: 2026,
    isActualsUploaded: false,
  },
  {
    key: "jan",
    label: "January 2027",
    shortLabel: "Jan 27",
    quarter: "Q4",
    calendarMonth: 1,
    year: 2027,
    isActualsUploaded: false,
  },
  {
    key: "feb",
    label: "February 2027",
    shortLabel: "Feb 27",
    quarter: "Q4",
    calendarMonth: 2,
    year: 2027,
    isActualsUploaded: false,
  },
  {
    key: "mar",
    label: "March 2027",
    shortLabel: "Mar 27",
    quarter: "Q4",
    calendarMonth: 3,
    year: 2027,
    isActualsUploaded: false,
  },
];

export const CATEGORY_DEFINITIONS: Record<
  BudgetCategory,
  {
    name: string;
    shortName: string;
    description: string;
    badgeColor: string;
    headerBg: string;
  }
> = {
  sales: {
    name: "Sales & Gross Revenue",
    shortName: "Sales",
    description: "Operating revenues, software licenses, recurring SaaS & client contracts",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-900 text-white",
  },
  direct_cost: {
    name: "Direct Cost (COGS)",
    shortName: "Direct Cost",
    description: "Cloud hosting, third-party APIs, direct consumables & technical subcontracting",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    headerBg: "bg-amber-900 text-white",
  },
  fixed_factory: {
    name: "Fixed Factory Expenses",
    shortName: "Fixed Factory",
    description:
      "Plant shed rent, machinery maintenance, commercial insurance, utilities & plant security",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-900 text-white",
  },
  salary_wages: {
    name: "Salary, Wages & HR Ops",
    shortName: "Salary & Wages",
    description:
      "Engineering payroll, technical wages, employee benefits, EPF/ESI & statutory gratuity",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    headerBg: "bg-purple-900 text-white",
  },
  admin_cost: {
    name: "Admin Cost & General Expenses",
    shortName: "Admin Cost",
    description: "Corporate rent, legal & audit retainers, IT SaaS tools, banking fees & travel",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    headerBg: "bg-slate-900 text-white",
  },
};

export const INITIAL_NEXORA_BUDGET_ITEMS: BudgetLineItem[] = [
  // ==========================================
  // 1. SALES / GROSS REVENUE
  // ==========================================
  {
    id: "b-rev-01",
    code: "REV-01",
    name: "Domestic Product Licenses & Enterprise Software",
    category: "sales",
    subCategory: "Product Sales",
    description: "Core software license fees invoiced to Indian corporate clients",
    monthly: {
      apr: { budget: 2000000, actual: 2150000, notes: "Q1 enterprise ramp-up" },
      may: { budget: 2100000, actual: 2080000 },
      jun: { budget: 2200000, actual: 2320000, notes: "Closing 2 major PSU contracts" },
      jul: { budget: 2300000, actual: 2250000 },
      aug: { budget: 2400000, actual: 2480000 },
      sep: { budget: 2500000, actual: 2680000, notes: "Early renewal bonus signed" }, // +7.2% Favorable
      oct: { budget: 2550000, actual: 0 },
      nov: { budget: 2600000, actual: 0 },
      dec: { budget: 2750000, actual: 0 },
      jan: { budget: 2800000, actual: 0 },
      feb: { budget: 2850000, actual: 0 },
      mar: { budget: 3100000, actual: 0 },
    },
  },
  {
    id: "b-rev-02",
    code: "REV-02",
    name: "Monthly Recurring SaaS Subscriptions (ARR)",
    category: "sales",
    subCategory: "SaaS Platform",
    description: "Multi-tenant cloud platform monthly active recurring billings",
    monthly: {
      apr: { budget: 1400000, actual: 1420000 },
      may: { budget: 1450000, actual: 1460000 },
      jun: { budget: 1500000, actual: 1510000 },
      jul: { budget: 1550000, actual: 1580000 },
      aug: { budget: 1600000, actual: 1640000 },
      sep: { budget: 1650000, actual: 1780000, notes: "Upsell to Tier-1 Fintech tier" }, // +7.88% Favorable
      oct: { budget: 1700000, actual: 0 },
      nov: { budget: 1750000, actual: 0 },
      dec: { budget: 1800000, actual: 0 },
      jan: { budget: 1850000, actual: 0 },
      feb: { budget: 1900000, actual: 0 },
      mar: { budget: 2000000, actual: 0 },
    },
  },
  {
    id: "b-rev-03",
    code: "REV-03",
    name: "Implementation & Professional Services Retainers",
    category: "sales",
    subCategory: "Professional Services",
    description: "Milestone-based solution architecture, customization & data migrations",
    monthly: {
      apr: { budget: 500000, actual: 480000 },
      may: { budget: 500000, actual: 520000 },
      jun: { budget: 550000, actual: 540000 },
      jul: { budget: 550000, actual: 490000 },
      aug: { budget: 600000, actual: 580000 },
      sep: { budget: 600000, actual: 510000, notes: "Client milestone signoff pushed to Oct" }, // -15.0% Adverse shortfall
      oct: { budget: 600000, actual: 0 },
      nov: { budget: 650000, actual: 0 },
      dec: { budget: 650000, actual: 0 },
      jan: { budget: 700000, actual: 0 },
      feb: { budget: 700000, actual: 0 },
      mar: { budget: 750000, actual: 0 },
    },
  },
  {
    id: "b-rev-04",
    code: "REV-04",
    name: "Annual Maintenance Contracts (AMC) & SLA Support",
    category: "sales",
    subCategory: "Support Contracts",
    description: "Post-warranty operational SLA and 24/7 technical helpdesk",
    monthly: {
      apr: { budget: 350000, actual: 350000 },
      may: { budget: 350000, actual: 360000 },
      jun: { budget: 360000, actual: 360000 },
      jul: { budget: 360000, actual: 375000 },
      aug: { budget: 370000, actual: 370000 },
      sep: { budget: 380000, actual: 395000 },
      oct: { budget: 380000, actual: 0 },
      nov: { budget: 390000, actual: 0 },
      dec: { budget: 390000, actual: 0 },
      jan: { budget: 400000, actual: 0 },
      feb: { budget: 400000, actual: 0 },
      mar: { budget: 420000, actual: 0 },
    },
  },
  {
    id: "b-rev-05",
    code: "REV-05",
    name: "Overseas Export Software Billing (FIRC Backed)",
    category: "sales",
    subCategory: "Export Earnings",
    description: "Zero-rated LUT-backed services billed in USD to US/APAC entities",
    monthly: {
      apr: { budget: 800000, actual: 760000 },
      may: { budget: 800000, actual: 820000 },
      jun: { budget: 850000, actual: 890000 },
      jul: { budget: 850000, actual: 810000 },
      aug: { budget: 900000, actual: 940000 },
      sep: { budget: 900000, actual: 830000, notes: "Delayed US payment remittance" }, // -7.78% Adverse shortfall
      oct: { budget: 950000, actual: 0 },
      nov: { budget: 950000, actual: 0 },
      dec: { budget: 1000000, actual: 0 },
      jan: { budget: 1000000, actual: 0 },
      feb: { budget: 1050000, actual: 0 },
      mar: { budget: 1100000, actual: 0 },
    },
  },

  // ==========================================
  // 2. DIRECT COST (COGS)
  // ==========================================
  {
    id: "b-dc-01",
    code: "DC-01",
    name: "Cloud Computing, GPU & Server Hosting (AWS / GCP)",
    category: "direct_cost",
    subCategory: "Hosting & Compute",
    description: "Elastic cluster instances, database storage and LLM inference bandwidth",
    monthly: {
      apr: { budget: 650000, actual: 640000 },
      may: { budget: 660000, actual: 675000 },
      jun: { budget: 680000, actual: 690000 },
      jul: { budget: 700000, actual: 710000 },
      aug: { budget: 720000, actual: 740000 },
      sep: { budget: 750000, actual: 845000, notes: "Heavy GPU spike for AI OCR processing" }, // +12.67% Adverse Overspend
      oct: { budget: 760000, actual: 0 },
      nov: { budget: 780000, actual: 0 },
      dec: { budget: 800000, actual: 0 },
      jan: { budget: 820000, actual: 0 },
      feb: { budget: 840000, actual: 0 },
      mar: { budget: 880000, actual: 0 },
    },
  },
  {
    id: "b-dc-02",
    code: "DC-02",
    name: "Third-Party API & SDK Licensing (Per-Transaction)",
    category: "direct_cost",
    subCategory: "API Expenses",
    description: "GST portal APIs, PAN verification, banking rails & SMS OTP gateway fees",
    monthly: {
      apr: { budget: 180000, actual: 175000 },
      may: { budget: 185000, actual: 182000 },
      jun: { budget: 190000, actual: 195000 },
      jul: { budget: 195000, actual: 190000 },
      aug: { budget: 200000, actual: 205000 },
      sep: { budget: 210000, actual: 232000, notes: "Increased invoice verification volumes" }, // +10.48% Adverse Overspend
      oct: { budget: 215000, actual: 0 },
      nov: { budget: 220000, actual: 0 },
      dec: { budget: 230000, actual: 0 },
      jan: { budget: 235000, actual: 0 },
      feb: { budget: 240000, actual: 0 },
      mar: { budget: 250000, actual: 0 },
    },
  },
  {
    id: "b-dc-03",
    code: "DC-03",
    name: "Direct Technical Subcontracting & QA Contractors",
    category: "direct_cost",
    subCategory: "Contract Engineering",
    description: "External specialized security audit engineers and smart-contract auditors",
    monthly: {
      apr: { budget: 350000, actual: 340000 },
      may: { budget: 350000, actual: 360000 },
      jun: { budget: 360000, actual: 375000 },
      jul: { budget: 370000, actual: 355000 },
      aug: { budget: 380000, actual: 370000 },
      sep: { budget: 400000, actual: 365000, notes: "Contractor billed lower hours than budgeted" }, // -8.75% Favorable Saving
      oct: { budget: 400000, actual: 0 },
      nov: { budget: 420000, actual: 0 },
      dec: { budget: 420000, actual: 0 },
      jan: { budget: 440000, actual: 0 },
      feb: { budget: 440000, actual: 0 },
      mar: { budget: 460000, actual: 0 },
    },
  },
  {
    id: "b-dc-04",
    code: "DC-04",
    name: "Hardware Edge Gateway Consumables & Custom Chips",
    category: "direct_cost",
    subCategory: "Materials & Equipment",
    description: "IoT gateway boxes and edge RFID cards delivered to client sites",
    monthly: {
      apr: { budget: 120000, actual: 118000 },
      may: { budget: 120000, actual: 122000 },
      jun: { budget: 130000, actual: 125000 },
      jul: { budget: 130000, actual: 135000 },
      aug: { budget: 140000, actual: 138000 },
      sep: {
        budget: 140000,
        actual: 129000,
        notes: "Bulk discount negotiated on microcontrollers",
      }, // -7.86% Favorable Saving
      oct: { budget: 145000, actual: 0 },
      nov: { budget: 150000, actual: 0 },
      dec: { budget: 150000, actual: 0 },
      jan: { budget: 160000, actual: 0 },
      feb: { budget: 160000, actual: 0 },
      mar: { budget: 170000, actual: 0 },
    },
  },
  {
    id: "b-dc-05",
    code: "DC-05",
    name: "Direct Project Deployment & Field Engineers Travel",
    category: "direct_cost",
    subCategory: "Direct Travel",
    description: "Onsite deployment visits to factory gates for hardware sensors setup",
    monthly: {
      apr: { budget: 90000, actual: 88000 },
      may: { budget: 90000, actual: 95000 },
      jun: { budget: 95000, actual: 92000 },
      jul: { budget: 95000, actual: 98000 },
      aug: { budget: 100000, actual: 104000 },
      sep: { budget: 100000, actual: 112000, notes: "Emergency field visit to Pune plant" }, // +12.0% Adverse Overspend
      oct: { budget: 105000, actual: 0 },
      nov: { budget: 110000, actual: 0 },
      dec: { budget: 115000, actual: 0 },
      jan: { budget: 120000, actual: 0 },
      feb: { budget: 120000, actual: 0 },
      mar: { budget: 130000, actual: 0 },
    },
  },

  // ==========================================
  // 3. FIXED FACTORY EXPENSES
  // ==========================================
  {
    id: "b-ffe-01",
    code: "FFE-01",
    name: "Factory / Tech Park Production Floor Lease Rent",
    category: "fixed_factory",
    subCategory: "Plant Rent",
    description: "Long-term manufacturing / assembly bay leased premises in MIDC",
    monthly: {
      apr: { budget: 320000, actual: 320000 },
      may: { budget: 320000, actual: 320000 },
      jun: { budget: 320000, actual: 320000 },
      jul: { budget: 320000, actual: 320000 },
      aug: { budget: 320000, actual: 320000 },
      sep: { budget: 320000, actual: 320000, notes: "Fixed agreement under 11-month lease" }, // 0% On Track
      oct: { budget: 320000, actual: 0 },
      nov: { budget: 320000, actual: 0 },
      dec: { budget: 320000, actual: 0 },
      jan: { budget: 320000, actual: 0 },
      feb: { budget: 320000, actual: 0 },
      mar: { budget: 320000, actual: 0 },
    },
  },
  {
    id: "b-ffe-02",
    code: "FFE-02",
    name: "Plant & Machinery Preventive Maintenance (AMC)",
    category: "fixed_factory",
    subCategory: "Equipment Maintenance",
    description: "Automated test rigs, SMT pick-and-place and calibrated test sensors AMC",
    monthly: {
      apr: { budget: 75000, actual: 72000 },
      may: { budget: 75000, actual: 78000 },
      jun: { budget: 80000, actual: 76000 },
      jul: { budget: 80000, actual: 82000 },
      aug: { budget: 85000, actual: 84000 },
      sep: { budget: 85000, actual: 104000, notes: "Unscheduled laser calibration repair" }, // +22.35% Adverse Overspend
      oct: { budget: 85000, actual: 0 },
      nov: { budget: 90000, actual: 0 },
      dec: { budget: 90000, actual: 0 },
      jan: { budget: 95000, actual: 0 },
      feb: { budget: 95000, actual: 0 },
      mar: { budget: 100000, actual: 0 },
    },
  },
  {
    id: "b-ffe-03",
    code: "FFE-03",
    name: "Factory Commercial Property & Industrial Fire Insurance",
    category: "fixed_factory",
    subCategory: "Industrial Insurance",
    description: "Plant asset protection, boiler & machinery breakdown cover",
    monthly: {
      apr: { budget: 45000, actual: 45000 },
      may: { budget: 45000, actual: 45000 },
      jun: { budget: 45000, actual: 45000 },
      jul: { budget: 45000, actual: 45000 },
      aug: { budget: 45000, actual: 45000 },
      sep: { budget: 45000, actual: 45000 },
      oct: { budget: 45000, actual: 0 },
      nov: { budget: 45000, actual: 0 },
      dec: { budget: 45000, actual: 0 },
      jan: { budget: 45000, actual: 0 },
      feb: { budget: 45000, actual: 0 },
      mar: { budget: 45000, actual: 0 },
    },
  },
  {
    id: "b-ffe-04",
    code: "FFE-04",
    name: "Factory High-Tension Electricity & DG Power Generation",
    category: "fixed_factory",
    subCategory: "Factory Utilities",
    description: "Fixed demand charges + diesel genset fuel for uninterrupted production",
    monthly: {
      apr: { budget: 140000, actual: 135000 },
      may: { budget: 145000, actual: 152000 },
      jun: { budget: 150000, actual: 148000 },
      jul: { budget: 150000, actual: 155000 },
      aug: { budget: 155000, actual: 158000 },
      sep: { budget: 160000, actual: 172000, notes: "Grid tariff surcharge + extra night shift" }, // +7.5% Adverse Overspend
      oct: { budget: 160000, actual: 0 },
      nov: { budget: 165000, actual: 0 },
      dec: { budget: 165000, actual: 0 },
      jan: { budget: 170000, actual: 0 },
      feb: { budget: 170000, actual: 0 },
      mar: { budget: 180000, actual: 0 },
    },
  },
  {
    id: "b-ffe-05",
    code: "FFE-05",
    name: "Industrial Security, CCTV Surveillance & Housekeeping",
    category: "fixed_factory",
    subCategory: "Security & Sanitation",
    description: "Round-the-clock armed security guard post & industrial waste sanitation",
    monthly: {
      apr: { budget: 85000, actual: 85000 },
      may: { budget: 85000, actual: 85000 },
      jun: { budget: 85000, actual: 85000 },
      jul: { budget: 90000, actual: 88000 },
      aug: { budget: 90000, actual: 89000 },
      sep: { budget: 90000, actual: 91500 },
      oct: { budget: 90000, actual: 0 },
      nov: { budget: 95000, actual: 0 },
      dec: { budget: 95000, actual: 0 },
      jan: { budget: 95000, actual: 0 },
      feb: { budget: 95000, actual: 0 },
      mar: { budget: 100000, actual: 0 },
    },
  },
  {
    id: "b-ffe-06",
    code: "FFE-06",
    name: "Depreciation on Plant, Server Machinery & Heavy Assets",
    category: "fixed_factory",
    subCategory: "Factory Depreciation",
    description: "Straight line amortization under Schedule II Companies Act 2013",
    monthly: {
      apr: { budget: 60000, actual: 60000 },
      may: { budget: 60000, actual: 60000 },
      jun: { budget: 60000, actual: 60000 },
      jul: { budget: 60000, actual: 60000 },
      aug: { budget: 60000, actual: 60000 },
      sep: { budget: 60000, actual: 60000 },
      oct: { budget: 60000, actual: 0 },
      nov: { budget: 60000, actual: 0 },
      dec: { budget: 60000, actual: 0 },
      jan: { budget: 60000, actual: 0 },
      feb: { budget: 60000, actual: 0 },
      mar: { budget: 60000, actual: 0 },
    },
  },

  // ==========================================
  // 4. SALARY, WAGES & HUMAN RESOURCES
  // ==========================================
  {
    id: "b-sal-01",
    code: "SAL-01",
    name: "Core Software Engineering & R&D Development Payroll",
    category: "salary_wages",
    subCategory: "Core Engineering",
    description: "Senior architects, full-stack engineers and DevOps staff CTC",
    monthly: {
      apr: { budget: 1250000, actual: 1240000 },
      may: { budget: 1250000, actual: 1260000 },
      jun: { budget: 1300000, actual: 1290000 },
      jul: { budget: 1300000, actual: 1315000 },
      aug: { budget: 1350000, actual: 1340000 },
      sep: {
        budget: 1350000,
        actual: 1445000,
        notes: "Hired 2 Senior AI Engineers ahead of schedule",
      }, // +7.04% Adverse Overspend
      oct: { budget: 1400000, actual: 0 },
      nov: { budget: 1400000, actual: 0 },
      dec: { budget: 1450000, actual: 0 },
      jan: { budget: 1450000, actual: 0 },
      feb: { budget: 1500000, actual: 0 },
      mar: { budget: 1550000, actual: 0 },
    },
  },
  {
    id: "b-sal-02",
    code: "SAL-02",
    name: "Product Management, UI/UX & Quality Assurance Payroll",
    category: "salary_wages",
    subCategory: "Product & QA",
    description: "Product owners, Figma designers and automation testers",
    monthly: {
      apr: { budget: 420000, actual: 415000 },
      may: { budget: 420000, actual: 425000 },
      jun: { budget: 430000, actual: 428000 },
      jul: { budget: 430000, actual: 435000 },
      aug: { budget: 440000, actual: 438000 },
      sep: { budget: 450000, actual: 452000 },
      oct: { budget: 450000, actual: 0 },
      nov: { budget: 460000, actual: 0 },
      dec: { budget: 460000, actual: 0 },
      jan: { budget: 470000, actual: 0 },
      feb: { budget: 470000, actual: 0 },
      mar: { budget: 480000, actual: 0 },
    },
  },
  {
    id: "b-sal-03",
    code: "SAL-03",
    name: "Sales, Marketing & Strategic Partnerships Team",
    category: "salary_wages",
    subCategory: "Sales & Growth",
    description: "Enterprise account directors, BDM salaries & SDR compensation",
    monthly: {
      apr: { budget: 380000, actual: 375000 },
      may: { budget: 380000, actual: 390000 },
      jun: { budget: 390000, actual: 385000 },
      jul: { budget: 390000, actual: 395000 },
      aug: { budget: 400000, actual: 398000 },
      sep: { budget: 420000, actual: 385000, notes: "Delayed hiring of Delhi enterprise rep" }, // -8.33% Favorable Saving
      oct: { budget: 420000, actual: 0 },
      nov: { budget: 430000, actual: 0 },
      dec: { budget: 430000, actual: 0 },
      jan: { budget: 440000, actual: 0 },
      feb: { budget: 440000, actual: 0 },
      mar: { budget: 450000, actual: 0 },
    },
  },
  {
    id: "b-sal-04",
    code: "SAL-04",
    name: "Factory Assembly Technicians & Shift Floor Wages",
    category: "salary_wages",
    subCategory: "Direct Plant Wages",
    description: "Hardware testing technicians, PCB assemblers & shift overtime",
    monthly: {
      apr: { budget: 240000, actual: 235000 },
      may: { budget: 240000, actual: 245000 },
      jun: { budget: 250000, actual: 248000 },
      jul: { budget: 250000, actual: 255000 },
      aug: { budget: 260000, actual: 262000 },
      sep: { budget: 260000, actual: 284000, notes: "Night shift overtime to fulfill PSU batch" }, // +9.23% Adverse Overspend
      oct: { budget: 265000, actual: 0 },
      nov: { budget: 270000, actual: 0 },
      dec: { budget: 270000, actual: 0 },
      jan: { budget: 280000, actual: 0 },
      feb: { budget: 280000, actual: 0 },
      mar: { budget: 290000, actual: 0 },
    },
  },
  {
    id: "b-sal-05",
    code: "SAL-05",
    name: "Employer Statutory Social Security (EPF, ESIC, EDLI)",
    category: "salary_wages",
    subCategory: "Statutory Payroll Dues",
    description: "12% EPF match, ESIC 3.25%, and admin service inspection charges",
    monthly: {
      apr: { budget: 165000, actual: 163000 },
      may: { budget: 165000, actual: 167000 },
      jun: { budget: 170000, actual: 169000 },
      jul: { budget: 170000, actual: 172000 },
      aug: { budget: 175000, actual: 174000 },
      sep: { budget: 180000, actual: 189000 },
      oct: { budget: 180000, actual: 0 },
      nov: { budget: 185000, actual: 0 },
      dec: { budget: 185000, actual: 0 },
      jan: { budget: 190000, actual: 0 },
      feb: { budget: 190000, actual: 0 },
      mar: { budget: 195000, actual: 0 },
    },
  },
  {
    id: "b-sal-06",
    code: "SAL-06",
    name: "Staff Group Mediclaim, Term Insurance & Employee Welfare",
    category: "salary_wages",
    subCategory: "Health & Welfare",
    description: "Corporate group health cover policy premium and daily pantry subsidies",
    monthly: {
      apr: { budget: 75000, actual: 74000 },
      may: { budget: 75000, actual: 76000 },
      jun: { budget: 75000, actual: 75000 },
      jul: { budget: 80000, actual: 79000 },
      aug: { budget: 80000, actual: 82000 },
      sep: { budget: 80000, actual: 76000, notes: "Favorable claim loss ratio rebate received" }, // -5.0% Favorable
      oct: { budget: 85000, actual: 0 },
      nov: { budget: 85000, actual: 0 },
      dec: { budget: 85000, actual: 0 },
      jan: { budget: 90000, actual: 0 },
      feb: { budget: 90000, actual: 0 },
      mar: { budget: 90000, actual: 0 },
    },
  },
  {
    id: "b-sal-07",
    code: "SAL-07",
    name: "Statutory Gratuity Actuarial Accruals & Performance Bonus",
    category: "salary_wages",
    subCategory: "Retirement Accruals",
    description: "Quarterly actuarial valuation reserve and Diwali performance provision",
    monthly: {
      apr: { budget: 90000, actual: 90000 },
      may: { budget: 90000, actual: 90000 },
      jun: { budget: 90000, actual: 90000 },
      jul: { budget: 95000, actual: 95000 },
      aug: { budget: 95000, actual: 95000 },
      sep: { budget: 95000, actual: 95000 },
      oct: { budget: 150000, actual: 0 }, // Festival bonus provision
      nov: { budget: 100000, actual: 0 },
      dec: { budget: 100000, actual: 0 },
      jan: { budget: 100000, actual: 0 },
      feb: { budget: 100000, actual: 0 },
      mar: { budget: 100000, actual: 0 },
    },
  },

  // ==========================================
  // 5. ADMIN COST & GENERAL EXPENSES
  // ==========================================
  {
    id: "b-adm-01",
    code: "ADM-01",
    name: "Corporate Head Office Rent & Common Maintenance (CAM)",
    category: "admin_cost",
    subCategory: "Office Rent",
    description: "Corporate headquarters commercial premise in BKC Mumbai",
    monthly: {
      apr: { budget: 260000, actual: 260000 },
      may: { budget: 260000, actual: 260000 },
      jun: { budget: 260000, actual: 260000 },
      jul: { budget: 260000, actual: 260000 },
      aug: { budget: 260000, actual: 260000 },
      sep: { budget: 260000, actual: 260000 },
      oct: { budget: 260000, actual: 0 },
      nov: { budget: 260000, actual: 0 },
      dec: { budget: 260000, actual: 0 },
      jan: { budget: 260000, actual: 0 },
      feb: { budget: 260000, actual: 0 },
      mar: { budget: 260000, actual: 0 },
    },
  },
  {
    id: "b-adm-02",
    code: "ADM-02",
    name: "Legal, Secretarial, Trademark & MCA Regulatory Fees",
    category: "admin_cost",
    subCategory: "Legal & Secretarial",
    description: "Company secretary retainers, ESOP trust drafting & filing fees",
    monthly: {
      apr: { budget: 80000, actual: 75000 },
      may: { budget: 80000, actual: 82000 },
      jun: { budget: 85000, actual: 80000 },
      jul: { budget: 85000, actual: 88000 },
      aug: { budget: 90000, actual: 85000 },
      sep: {
        budget: 90000,
        actual: 115000,
        notes: "Urgent trademark objection defense in High Court",
      }, // +27.78% Adverse Overspend
      oct: { budget: 90000, actual: 0 },
      nov: { budget: 95000, actual: 0 },
      dec: { budget: 95000, actual: 0 },
      jan: { budget: 95000, actual: 0 },
      feb: { budget: 100000, actual: 0 },
      mar: { budget: 100000, actual: 0 },
    },
  },
  {
    id: "b-adm-03",
    code: "ADM-03",
    name: "Virtual CFO Practice Retainer & Statutory Audit Fees",
    category: "admin_cost",
    subCategory: "CFO & Audit",
    description: "Goyal & Associates Virtual CFO strategic advisory and concurrent audit",
    monthly: {
      apr: { budget: 150000, actual: 150000 },
      may: { budget: 150000, actual: 150000 },
      jun: { budget: 150000, actual: 150000 },
      jul: { budget: 150000, actual: 150000 },
      aug: { budget: 150000, actual: 150000 },
      sep: { budget: 150000, actual: 150000 },
      oct: { budget: 150000, actual: 0 },
      nov: { budget: 150000, actual: 0 },
      dec: { budget: 150000, actual: 0 },
      jan: { budget: 150000, actual: 0 },
      feb: { budget: 150000, actual: 0 },
      mar: { budget: 150000, actual: 0 },
    },
  },
  {
    id: "b-adm-04",
    code: "ADM-04",
    name: "Internal Software SaaS, Microsoft 365, Slack & Security",
    category: "admin_cost",
    subCategory: "SaaS Subscriptions",
    description: "Enterprise email, Jira, GitHub Enterprise, Zoom and endpoint antivirus",
    monthly: {
      apr: { budget: 110000, actual: 108000 },
      may: { budget: 110000, actual: 112000 },
      jun: { budget: 115000, actual: 114000 },
      jul: { budget: 115000, actual: 118000 },
      aug: { budget: 120000, actual: 122000 },
      sep: { budget: 125000, actual: 136000, notes: "Added 20 seats on Slack & GitHub" }, // +8.8% Adverse Overspend
      oct: { budget: 125000, actual: 0 },
      nov: { budget: 130000, actual: 0 },
      dec: { budget: 130000, actual: 0 },
      jan: { budget: 130000, actual: 0 },
      feb: { budget: 135000, actual: 0 },
      mar: { budget: 140000, actual: 0 },
    },
  },
  {
    id: "b-adm-05",
    code: "ADM-05",
    name: "High-Speed Leased Line Internet, Telecom & Postal Courier",
    category: "admin_cost",
    subCategory: "Connectivity & Telecom",
    description: "1 Gbps dual-fiber redundant internet and staff SIM card plans",
    monthly: {
      apr: { budget: 45000, actual: 44000 },
      may: { budget: 45000, actual: 46000 },
      jun: { budget: 45000, actual: 45000 },
      jul: { budget: 48000, actual: 47000 },
      aug: { budget: 48000, actual: 48000 },
      sep: { budget: 50000, actual: 46500, notes: "Consolidated telecom vendor plan" }, // -7.0% Favorable Saving
      oct: { budget: 50000, actual: 0 },
      nov: { budget: 50000, actual: 0 },
      dec: { budget: 52000, actual: 0 },
      jan: { budget: 52000, actual: 0 },
      feb: { budget: 55000, actual: 0 },
      mar: { budget: 55000, actual: 0 },
    },
  },
  {
    id: "b-adm-06",
    code: "ADM-06",
    name: "Bank Charges, Payment Gateway Fees & Forex Processing",
    category: "admin_cost",
    subCategory: "Banking & Forex",
    description: "Credit card merchant MDR, wire transfers, letter of credit handling charges",
    monthly: {
      apr: { budget: 55000, actual: 52000 },
      may: { budget: 55000, actual: 58000 },
      jun: { budget: 58000, actual: 57000 },
      jul: { budget: 58000, actual: 61000 },
      aug: { budget: 60000, actual: 62000 },
      sep: {
        budget: 65000,
        actual: 73000,
        notes: "Higher forex conversion volume on export collections",
      }, // +12.31% Adverse Overspend
      oct: { budget: 65000, actual: 0 },
      nov: { budget: 68000, actual: 0 },
      dec: { budget: 70000, actual: 0 },
      jan: { budget: 70000, actual: 0 },
      feb: { budget: 72000, actual: 0 },
      mar: { budget: 75000, actual: 0 },
    },
  },
  {
    id: "b-adm-07",
    code: "ADM-07",
    name: "Executive Travel, Client Entertainment & Conferences",
    category: "admin_cost",
    subCategory: "Executive Travel",
    description: "CEO/CFO investor relations travel, industry expo attendance & client dinners",
    monthly: {
      apr: { budget: 120000, actual: 115000 },
      may: { budget: 120000, actual: 128000 },
      jun: { budget: 130000, actual: 122000 },
      jul: { budget: 130000, actual: 136000 },
      aug: { budget: 140000, actual: 135000 },
      sep: {
        budget: 150000,
        actual: 128000,
        notes: "Virtual attendee option used for Bengaluru summit",
      }, // -14.67% Favorable Saving
      oct: { budget: 160000, actual: 0 },
      nov: { budget: 160000, actual: 0 },
      dec: { budget: 170000, actual: 0 },
      jan: { budget: 170000, actual: 0 },
      feb: { budget: 180000, actual: 0 },
      mar: { budget: 190000, actual: 0 },
    },
  },
  {
    id: "b-adm-08",
    code: "ADM-08",
    name: "Office Stationery, Refreshments & Miscellaneous Contingency",
    category: "admin_cost",
    subCategory: "Office Admin",
    description: "Pantry tea/coffee supplies, printing, waste disposal & minor repairs",
    monthly: {
      apr: { budget: 45000, actual: 43000 },
      may: { budget: 45000, actual: 46000 },
      jun: { budget: 48000, actual: 47000 },
      jul: { budget: 48000, actual: 50000 },
      aug: { budget: 50000, actual: 49000 },
      sep: { budget: 52000, actual: 51200 },
      oct: { budget: 52000, actual: 0 },
      nov: { budget: 55000, actual: 0 },
      dec: { budget: 55000, actual: 0 },
      jan: { budget: 58000, actual: 0 },
      feb: { budget: 58000, actual: 0 },
      mar: { budget: 60000, actual: 0 },
    },
  },
];

// Variance calculation helper functions
export function calculateItemVariance(item: BudgetLineItem, monthKey: BudgetMonthKey) {
  const monthData = item.monthly[monthKey] || { budget: 0, actual: 0 };
  const budget = monthData.budget;
  const actual = monthData.actual;
  const varianceAmount = actual - budget;

  const variancePercent = budget > 0 ? ((actual - budget) / budget) * 100 : 0;

  const isExceeding5Percent = Math.abs(variancePercent) > 5;

  let varianceType: "favorable" | "adverse" | "neutral" = "neutral";
  let alertSeverity: "critical_adverse" | "favorable" | "on_track" = "on_track";
  let alertBadgeText = "On Track (±5%)";

  if (item.category === "sales") {
    // For Revenue: higher is favorable, lower is adverse
    if (variancePercent > 5) {
      varianceType = "favorable";
      alertSeverity = "favorable";
      alertBadgeText = `+${variancePercent.toFixed(1)}% Revenue Surplus`;
    } else if (variancePercent < -5) {
      varianceType = "adverse";
      alertSeverity = "critical_adverse";
      alertBadgeText = `${variancePercent.toFixed(1)}% Revenue Shortfall`;
    }
  } else {
    // For Expenses (Direct Cost, Fixed Factory, Salary & Wages, Admin Cost):
    // higher actual than budget is ADVERSE (Overspend!)
    // lower actual than budget is FAVORABLE (Cost Saving!)
    if (variancePercent > 5) {
      varianceType = "adverse";
      alertSeverity = "critical_adverse";
      alertBadgeText = `+${variancePercent.toFixed(1)}% Budget Overrun`;
    } else if (variancePercent < -5) {
      varianceType = "favorable";
      alertSeverity = "favorable";
      alertBadgeText = `${variancePercent.toFixed(1)}% Cost Saving`;
    }
  }

  return {
    item,
    budget,
    actual,
    varianceAmount,
    variancePercent,
    isExceeding5Percent,
    varianceType,
    alertSeverity,
    alertBadgeText,
  };
}

export function computeCategoryVariance(
  items: BudgetLineItem[],
  category: BudgetCategory,
  monthKey: BudgetMonthKey,
) {
  const catItems = items.filter((it) => it.category === category);
  let totalBudget = 0;
  let totalActual = 0;
  let exceeding5Count = 0;
  let adverseCount = 0;
  let favorableCount = 0;

  catItems.forEach((it) => {
    const vr = calculateItemVariance(it, monthKey);
    totalBudget += vr.budget;
    totalActual += vr.actual;
    if (vr.isExceeding5Percent) {
      exceeding5Count++;
      if (vr.varianceType === "adverse") adverseCount++;
      if (vr.varianceType === "favorable") favorableCount++;
    }
  });

  const varianceAmount = totalActual - totalBudget;
  const variancePercent = totalBudget > 0 ? (varianceAmount / totalBudget) * 100 : 0;

  return {
    category,
    categoryTitle: CATEGORY_DEFINITIONS[category].name,
    budget: totalBudget,
    actual: totalActual,
    varianceAmount,
    variancePercent,
    itemsCount: catItems.length,
    exceeding5PercentCount: exceeding5Count,
    adverse5PercentCount: adverseCount,
    favorable5PercentCount: favorableCount,
  };
}

export function computeMonthGrandSummary(items: BudgetLineItem[], monthKey: BudgetMonthKey) {
  const monthMeta = BUDGET_MONTHS.find((m) => m.key === monthKey) || BUDGET_MONTHS[5]; // Default Sep 2026

  const sales = computeCategoryVariance(items, "sales", monthKey);
  const directCost = computeCategoryVariance(items, "direct_cost", monthKey);
  const fixedFactory = computeCategoryVariance(items, "fixed_factory", monthKey);
  const salaryWages = computeCategoryVariance(items, "salary_wages", monthKey);
  const adminCost = computeCategoryVariance(items, "admin_cost", monthKey);

  const grossProfitBudget = sales.budget - directCost.budget;
  const grossProfitActual = sales.actual - directCost.actual;
  const grossProfitVariance = grossProfitActual - grossProfitBudget;
  const grossProfitMarginBudget = sales.budget > 0 ? (grossProfitBudget / sales.budget) * 100 : 0;
  const grossProfitMarginActual = sales.actual > 0 ? (grossProfitActual / sales.actual) * 100 : 0;

  const totalExpensesBudget =
    directCost.budget + fixedFactory.budget + salaryWages.budget + adminCost.budget;
  const totalExpensesActual =
    directCost.actual + fixedFactory.actual + salaryWages.actual + adminCost.actual;
  const totalExpensesVariance = totalExpensesActual - totalExpensesBudget;

  const ebitdaBudget = sales.budget - totalExpensesBudget;
  const ebitdaActual = sales.actual - totalExpensesActual;
  const ebitdaVariance = ebitdaActual - ebitdaBudget;
  const ebitdaMarginBudget = sales.budget > 0 ? (ebitdaBudget / sales.budget) * 100 : 0;
  const ebitdaMarginActual = sales.actual > 0 ? (ebitdaActual / sales.actual) * 100 : 0;

  const totalItemsBreaching5Percent =
    sales.exceeding5PercentCount +
    directCost.exceeding5PercentCount +
    fixedFactory.exceeding5PercentCount +
    salaryWages.exceeding5PercentCount +
    adminCost.exceeding5PercentCount;

  const totalAdverseBreaches =
    sales.adverse5PercentCount +
    directCost.adverse5PercentCount +
    fixedFactory.adverse5PercentCount +
    salaryWages.adverse5PercentCount +
    adminCost.adverse5PercentCount;

  return {
    monthKey,
    monthLabel: monthMeta.label,
    sales,
    directCost,
    grossProfitBudget,
    grossProfitActual,
    grossProfitVariance,
    grossProfitMarginBudget,
    grossProfitMarginActual,
    fixedFactory,
    salaryWages,
    adminCost,
    totalExpensesBudget,
    totalExpensesActual,
    totalExpensesVariance,
    ebitdaBudget,
    ebitdaActual,
    ebitdaVariance,
    ebitdaMarginBudget,
    ebitdaMarginActual,
    totalItemsBreaching5Percent,
    totalAdverseBreaches,
  };
}
