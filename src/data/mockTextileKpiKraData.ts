import {
  FinanceDepartmentConfig,
  FinanceTeamMemberKpi,
  PerformanceIndicator,
  ComplianceItem,
  ActionItem,
  ActionFlowTask,
  TeamMemberReportCard,
  ReportCardDeliverable,
} from "../types";
import { parseDeadlineDateToIso } from "../utils/dueDate";

export const PERFORMANCE_INDICATOR_META: Record<
  PerformanceIndicator,
  {
    label: string;
    shortLabel: string;
    scoreWeight: number;
    badgeClass: string;
    dotClass: string;
    barClass: string;
    description: string;
  }
> = {
  excellent: {
    label: "Excellent",
    shortLabel: "Excellent",
    scoreWeight: 95,
    badgeClass: "bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    barClass: "bg-emerald-500",
    description:
      "Consistently completes deliverables ahead of schedule with 0 delay days and 100% statutory precision",
  },
  good: {
    label: "Good",
    shortLabel: "Good",
    scoreWeight: 80,
    badgeClass: "bg-indigo-50 text-indigo-700",
    dotClass: "bg-indigo-500",
    barClass: "bg-indigo-500",
    description: "Meets departmental SLAs on time; turnaround is prompt with negligible delay",
  },
  satisfactory: {
    label: "Satisfactory",
    shortLabel: "Satisfactory",
    scoreWeight: 65,
    badgeClass: "bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
    barClass: "bg-amber-500",
    description:
      "Meets baseline KRA benchmarks; occasional minor delay days require active monitoring",
  },
  below_average: {
    label: "Below Average",
    shortLabel: "Below Avg",
    scoreWeight: 40,
    badgeClass: "bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
    barClass: "bg-rose-500",
    description:
      "Overdue tasks, accumulated delay days, or SLA breaches requiring CFO intervention",
  },
};

export const INITIAL_FINANCE_DEPARTMENTS: FinanceDepartmentConfig[] = [
  {
    key: "dgm_office",
    name: "Finance Controller & DGM Accounts Office",
    shortName: "Finance Controller / DGM",
    description:
      "Overviews end-to-end statutory governance, bank CC limits, drawing power, export incentives, and audited financial statements across client entities.",
    headTitle: "Finance Controller & DGM",
    targetHeadcountSummary: "1 Finance Controller (Overall Head)",
  },
  {
    key: "taxation_accounting",
    name: "Taxation & Accounting Department",
    shortName: "Taxation & Accounts",
    description:
      "Direct and Indirect Tax team handling monthly GSTR-1, GSTR-3B, TDS Challans, Advance Tax, MSME Section 43B(h), and quarterly TDS returns (24Q/26Q).",
    headTitle: "Manager - Taxation & Accounting",
    targetHeadcountSummary: "Manager + Sr. Tax Executives",
  },
  {
    key: "banking_treasury",
    name: "Treasury, Payroll & Labor Compliance Department",
    shortName: "Treasury & Labor Ops",
    description:
      "Oversees monthly payroll disbursements, EPFO ECR filings, ESIC payments, Professional Tax, Vendor MSME clearance, and Bank BRS reconciliations.",
    headTitle: "Lead - Treasury & Labor Ops",
    targetHeadcountSummary: "Payroll & Labor Compliance Lead",
  },
  {
    key: "mis_erp",
    name: "Corporate Secretarial, MIS & Governance Department",
    shortName: "Secretarial & ERP Governance",
    description:
      "Specialized wing governing ROC/MCA filings (AOC-4, MGT-7, ADT-1), Board Resolutions, Statutory Registers, Tally ERP audit trails, and Virtual CFO sign-offs.",
    headTitle: "Secretarial & Practice Governance Lead",
    targetHeadcountSummary: "CS Lead + Practice Partner (CFO)",
  },
  {
    key: "billing_dispatch",
    name: "Commercial Billing, Operations & Executive Leadership",
    shortName: "Commercial & Executive",
    description:
      "Promoters, Managing Directors, and Whole-Time Directors governing commercial approvals, corporate contracts, bank limits, and executive strategic review.",
    headTitle: "Managing Director / Whole-Time Director",
    targetHeadcountSummary: "Promoters & Whole-Time Directors",
  },
];

/**
 * Actual Team Members mentioned in Admin Panel (userAccounts):
 * 1. Vikram Singhania (Finance Controller & Compliance Lead - Apex Global Logistics)
 * 2. Pooja Sharma (Sr. Tax Accountant - Direct & Indirect Tax Lead)
 * 3. Rahul Verma (Filing Associate & Treasury Ops - GST, LUT & Returns)
 * 4. Amit Patel (Payroll & Labor Compliance Exec - PF, ESI, Labor & AP)
 * 5. CS Alok Mehta (Secretarial & Accounts Lead - ROC, MCA & Corporate Governance)
 * 6. Sudhakar (Virtual CFO & Practice Partner - Overall Practice Supervision)
 * 7. Anand Verma (Managing Director & Promoter - Nexora Innovations Tech)
 * 8. Rajesh Malhotra (Whole-Time Director - Apex Global Logistics)
 * 9. Dr. Meera Krishnan (Designated Partner - Zenith HealthTech Solutions)
 */
export const INITIAL_TEXTILE_TEAM_KPI_KRA: FinanceTeamMemberKpi[] = [
  // 1. Vikram Singhania — Finance Controller & Compliance Lead (Apex)
  {
    id: "user-vikram-apex",
    name: "Vikram Singhania",
    designation: "Finance Controller & Compliance Lead (DGM Cadre)",
    department: "dgm_office",
    subDepartment: "Overall Supervision",
    level: "DGM",
    reportsToId: "user-cfo",
    reportsToName: "Sudhakar (Virtual CFO)",
    avatar: "VS",
    email: "vikram@apexlogistics.in",
    experienceYears: 16,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "excellent",
    cfoAppraisalNotes:
      "High promptness on Axis Bank CC drawing power statements and physical stock reconciliations. Maintains 0 delay days on audit schedules.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-vikram-1",
        kraTitle: "Working Capital & Banking Facility Governance",
        kraWeightage: 30,
        kpiMetric: "Timely Submission of Monthly Stock & Debtors DP Statement to Axis Bank",
        targetBenchmark: "Submitted by 18th of month with CFO sign-off; 0 SLA breach",
        actualPerformance: "Submitted on 17th Sep (100% timely; 0 delay days)",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-vikram-2",
        kraTitle: "Year-End Inventory & Books Closure TAT",
        kraWeightage: 30,
        kpiMetric: "Warehouse Cut-Off Procedures & Inventory Audit Reconciliation",
        targetBenchmark: "< 5 days from month-end; 0 discrepancy > ₹50,000",
        actualPerformance: "Completed within 3 days (99.4% accuracy)",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-vikram-3",
        kraTitle: "Tax Audit & Section 44AB Governance",
        kraWeightage: 25,
        kpiMetric: "Preparation & Handover of Form 3CD schedules to Statutory Auditors",
        targetBenchmark: "100% schedules handed over before 20th Sep",
        actualPerformance: "All 44 clauses tabulated with supporting ledgers",
        frequency: "Annual",
        rating: "good",
      },
      {
        id: "kpi-vikram-4",
        kraTitle: "Promptness & Action Deliverable Resolution",
        kraWeightage: 15,
        kpiMetric: "Resolution of Action Flow & Working Capital Bottlenecks",
        targetBenchmark: "Average TAT < 48 hours for high-priority actions",
        actualPerformance: "Average TAT: 36 hours (Ultra-Prompt resolution)",
        frequency: "Weekly",
        rating: "excellent",
      },
    ],
  },

  // 2. Pooja Sharma — Sr. Tax Accountant (Manager - Taxation & Accounting)
  {
    id: "user-pooja",
    name: "Pooja Sharma",
    designation: "Sr. Tax Accountant (Direct & Indirect Tax Lead)",
    department: "taxation_accounting",
    subDepartment: "Tax & Accounts",
    level: "Manager",
    reportsToId: "user-cfo",
    reportsToName: "Sudhakar (Virtual CFO)",
    avatar: "PS",
    email: "pooja@nexora.io",
    experienceYears: 11,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "excellent",
    cfoAppraisalNotes:
      "Exemplary timely completion on GSTR-1, IFF, and Advance Tax computation. Proactive on sales ledger reconciliations with 0 delay days.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-pooja-1",
        kraTitle: "GST Outward Supplies & GSTR-1 Draft Timeliness",
        kraWeightage: 35,
        kpiMetric: "Submission of GSTR-1 Draft & E-Invoice Reconciliation to CFO",
        targetBenchmark: "By 6th of month (5 days before statutory 11th due date)",
        actualPerformance: "Draft completed on 5th Sep (100% promptness)",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-pooja-2",
        kraTitle: "MSME Section 43B(h) Dues Monitoring",
        kraWeightage: 25,
        kpiMetric: "Review of Micro & Small Enterprise Vendor Invoices > 45 Days",
        targetBenchmark: "Zero disallowance u/s 43B(h); weekly aging report to CFO",
        actualPerformance: "Weekly report submitted every Monday morning",
        frequency: "Weekly",
        rating: "good",
      },
      {
        id: "kpi-pooja-3",
        kraTitle: "Quarterly Advance Tax Estimation Promptness",
        kraWeightage: 25,
        kpiMetric: "P&L Projection & Advance Tax Computation by 8th of Quarter End",
        targetBenchmark: "100% calculation submitted 7 days prior to 15th due date",
        actualPerformance: "Q2 45% installment computed & paid without interest",
        frequency: "Quarterly",
        rating: "excellent",
      },
      {
        id: "kpi-pooja-4",
        kraTitle: "Monthly Trial Balance & MIS Upload TAT",
        kraWeightage: 15,
        kpiMetric: "Uploading Trial Balance into Decided Excel Format",
        targetBenchmark: "By 5th working day of following month",
        actualPerformance: "Uploaded on 4th working day with 32 rows mapped",
        frequency: "Monthly",
        rating: "excellent",
      },
    ],
  },

  // 3. Rahul Verma — Filing Associate & Treasury Ops
  {
    id: "user-rahul",
    name: "Rahul Verma",
    designation: "Filing Associate & Treasury Ops",
    department: "taxation_accounting",
    subDepartment: "Tax & Accounts",
    level: "Senior Executive",
    reportsToId: "user-pooja",
    reportsToName: "Pooja Sharma (Sr. Tax Accountant)",
    avatar: "RV",
    email: "rahul@nexora.io",
    experienceYears: 6,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "good",
    cfoAppraisalNotes:
      "Diligent portal filing. August GSTR-1 and TDS Challans filed with proper ARN receipts; GSTR-3B payment stage had a minor 2-day delay awaiting bank mandate.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-rahul-1",
        kraTitle: "Statutory Portal Return Filing & ARN Generation",
        kraWeightage: 35,
        kpiMetric: "Upload & DSC Verification of GSTR-1, GSTR-3B & TDS Forms",
        targetBenchmark: "Filing completed at least 24 hours prior to statutory cut-off",
        actualPerformance: "GSTR-1 filed on 10th (1 day ahead); ARN AA2708260198421",
        frequency: "Monthly",
        rating: "good",
      },
      {
        id: "kpi-rahul-2",
        kraTitle: "TDS Payment Challan 281 Remittance Promptness",
        kraWeightage: 25,
        kpiMetric: "Remittance of Monthly TDS on TRACES / IT Portal before 7th",
        targetBenchmark: "Challan 281 generated and paid with 0 interest u/s 201(1A)",
        actualPerformance: "Paid on 6th Sep; BSR receipts downloaded to drive",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-rahul-3",
        kraTitle: "Quarterly TDS Return (24Q / 26Q) FVU Validation",
        kraWeightage: 25,
        kpiMetric: "FVU error-free validation & upload within statutory timeline",
        targetBenchmark: "100% clean validation; zero 234E late fee",
        actualPerformance: "Q1 returns validated without PAN error notices",
        frequency: "Quarterly",
        rating: "good",
      },
      {
        id: "kpi-rahul-4",
        kraTitle: "Task Delay Days & Execution Promptness",
        kraWeightage: 15,
        kpiMetric: "Minimizing Days Overdue on Subtasks & Action Assignments",
        targetBenchmark: "Average task delay < 1 day; prompt update on banking issues",
        actualPerformance: "Average turnaround 1.2 days; active communication",
        frequency: "Weekly",
        rating: "good",
      },
    ],
  },

  // 4. Amit Patel — Payroll & Labor Compliance Exec
  {
    id: "user-amit",
    name: "Amit Patel",
    designation: "Payroll & Labor Compliance Exec",
    department: "banking_treasury",
    subDepartment: "Treasury & Forex",
    level: "Executive",
    reportsToId: "user-cfo",
    reportsToName: "Sudhakar (Virtual CFO)",
    avatar: "AP",
    email: "amit@nexora.io",
    experienceYears: 7,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "excellent",
    cfoAppraisalNotes:
      "Consistent 100% on-time record for monthly PF ECR, ESIC remittances, and Professional Tax. Zero penalty, zero delay days.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-amit-1",
        kraTitle: "EPFO Electronic Challan-cum-Return (ECR) Timeliness",
        kraWeightage: 35,
        kpiMetric: "Generation of ECR Text File & Unified Portal Upload",
        targetBenchmark: "By 12th of month (3 days ahead of 15th statutory due date)",
        actualPerformance: "Uploaded on 11th Sep; TRRN generated seamlessly",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-amit-2",
        kraTitle: "ESIC Contribution & Monthly Challan Remittance",
        kraWeightage: 30,
        kpiMetric: "Wage Sheet Reconciliation & ESIC Monthly Payment",
        targetBenchmark: "By 14th of month; zero section 85B damages",
        actualPerformance: "Challan paid on 12th Sep with zero delay days",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-amit-3",
        kraTitle: "Professional Tax (PT) Payment & Half-Yearly Return",
        kraWeightage: 20,
        kpiMetric: "State-wise PT deduction and timely challan upload",
        targetBenchmark: "Zero interest; 100% compliance across all operating states",
        actualPerformance: "Karnataka & Maharashtra PT paid on time",
        frequency: "Monthly",
        rating: "good",
      },
      {
        id: "kpi-amit-4",
        kraTitle: "Staff Payroll Reimbursement & Ledger Reconciliation",
        kraWeightage: 15,
        kpiMetric: "Reconciliation of Payroll Control Ledger vs Bank Actuals",
        targetBenchmark: "Reconciliation completed within 48 hours of salary credit",
        actualPerformance: "Payroll ledger matched with Axis Bank clearing",
        frequency: "Monthly",
        rating: "excellent",
      },
    ],
  },

  // 5. CS Alok Mehta — Secretarial & Accounts Lead (Zenith)
  {
    id: "user-alok-zenith",
    name: "CS Alok Mehta",
    designation: "Secretarial & Accounts Lead (Company Secretary)",
    department: "mis_erp",
    subDepartment: "MIS Wing",
    level: "Department Lead",
    reportsToId: "user-cfo",
    reportsToName: "Sudhakar (Virtual CFO)",
    avatar: "AM",
    email: "alok@zenithhealthtech.in",
    experienceYears: 12,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "good",
    cfoAppraisalNotes:
      "Maintains excellent corporate governance documentation. Handled AGM notices, ADT-1 auditor filings, and AOC-4 XBRL drafting. Promptly clears compliance subtasks.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-alok-1",
        kraTitle: "MCA / ROC Annual Filings (AOC-4 & MGT-7)",
        kraWeightage: 35,
        kpiMetric: "Timely Drafting & Filing of Financial Statements on MCA V3",
        targetBenchmark: "AOC-4 filed within 30 days of AGM; MGT-7 within 60 days",
        actualPerformance: "AOC-4 draft and XBRL tagging ready for CFO sign-off",
        frequency: "Annual",
        rating: "good",
      },
      {
        id: "kpi-alok-2",
        kraTitle: "Board Meetings, Committee Minutes & Secretarial Records",
        kraWeightage: 25,
        kpiMetric: "Circulation of Draft Minutes & Maintenance of Statutory Registers",
        targetBenchmark: "Minutes circulated within 15 days of meeting u/s 118",
        actualPerformance: "Q2 Board Minutes signed and recorded in minute book",
        frequency: "Quarterly",
        rating: "excellent",
      },
      {
        id: "kpi-alok-3",
        kraTitle: "Director KYC (DIR-3 KYC) & Statutory Disclosures",
        kraWeightage: 25,
        kpiMetric: "100% Director KYC verification before 30th September",
        targetBenchmark: "Zero DIN deactivation; zero ₹5,000 late fee",
        actualPerformance: "All director web-KYC OTPs validated",
        frequency: "Annual",
        rating: "good",
      },
      {
        id: "kpi-alok-4",
        kraTitle: "Promptness in Secretarial Action Tasks",
        kraWeightage: 15,
        kpiMetric: "Turnaround time on company profile & master data updates",
        targetBenchmark: "Average TAT < 24 hours on legal matter updates",
        actualPerformance: "Promptly updated LLP partner records & PAN",
        frequency: "Monthly",
        rating: "good",
      },
    ],
  },

  // 6. Sudhakar — Virtual CFO & Practice Partner
  {
    id: "user-cfo",
    name: "Sudhakar",
    designation: "Virtual CFO & Practice Partner",
    department: "mis_erp",
    subDepartment: "Overall Supervision",
    level: "DGM",
    reportsToId: null,
    reportsToName: "Client Board of Directors",
    avatar: "SU",
    email: "cfo@practice.com",
    experienceYears: 20,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "excellent",
    cfoAppraisalNotes:
      "Strategic executive leadership across portfolio companies. Swift turnaround on Stage 2 CFO Reviews for GSTR-3B, Advance Tax, and Monthly MIS executive sign-offs.",
    lastEvaluatedBy: "Managing Director / Board",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-cfo-1",
        kraTitle: "Portfolio Statutory Governance & Zero Penalties",
        kraWeightage: 30,
        kpiMetric: "Zero statutory late fees, interest, or show-cause notices",
        targetBenchmark: "100% filings reviewed & signed off before due dates",
        actualPerformance: "100% clean track record; all Stage 2 approvals timely",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-cfo-2",
        kraTitle: "Cash Flow & Working Capital Optimization",
        kraWeightage: 30,
        kpiMetric: "Monthly Cash Budget Variance & Debtors Aging Reduction",
        targetBenchmark: "Budget variance within ±5%; >90d debtors reduced by 15%",
        actualPerformance: "Variance managed at +3.2%; cash runway at 4.2 months",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-cfo-3",
        kraTitle: "Stage 2 CFO Approval Promptness",
        kraWeightage: 25,
        kpiMetric: "Turnaround time on reviewing Team Drafts & approving filings",
        targetBenchmark: "< 24 hours from Team Draft completion",
        actualPerformance: "Average CFO sign-off TAT: 14 hours (Ultra-Prompt)",
        frequency: "Weekly",
        rating: "excellent",
      },
      {
        id: "kpi-cfo-4",
        kraTitle: "Board Advisory & Executive Report Presentation",
        kraWeightage: 15,
        kpiMetric: "Executive commentary and strategic financial guidance",
        targetBenchmark: "Delivered to Promoters by 10th of every month",
        actualPerformance: "Delivered on 8th with interactive visual health graphs",
        frequency: "Monthly",
        rating: "excellent",
      },
    ],
  },

  // 7. Anand Verma — Managing Director & Promoter (Nexora)
  {
    id: "user-client",
    name: "Anand Verma",
    designation: "Managing Director & Promoter (Nexora)",
    department: "billing_dispatch",
    subDepartment: "Commercial Dispatch",
    level: "DGM",
    reportsToId: null,
    reportsToName: "Board of Directors",
    avatar: "AV",
    email: "anand@nexora.io",
    experienceYears: 18,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "good",
    cfoAppraisalNotes:
      "Prompt promoter approvals on statutory tax payment mandates and corporate banking limits. High commercial promptness.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-anand-1",
        kraTitle: "Corporate Strategic Growth & Topline Expansion",
        kraWeightage: 35,
        kpiMetric: "Quarterly Revenue Achievement vs Annual Operating Plan",
        targetBenchmark: "> 10% MoM revenue growth with healthy EBITDA",
        actualPerformance: "+12.4% MoM growth; ₹48.5L monthly revenue",
        frequency: "Monthly",
        rating: "excellent",
      },
      {
        id: "kpi-anand-2",
        kraTitle: "Statutory Fund Allocation & Mandate Approvals",
        kraWeightage: 35,
        kpiMetric: "Prompt Authorization of GST & Tax Payment Banking Mandates",
        targetBenchmark: "Approvals released within 6 hours of CFO request",
        actualPerformance: "High promptness; banking mandates cleared swiftly",
        frequency: "Monthly",
        rating: "good",
      },
      {
        id: "kpi-anand-3",
        kraTitle: "Board Governance & Stakeholder Alignment",
        kraWeightage: 30,
        kpiMetric: "Conduct of Quarterly Board Reviews & Strategic Risk Reviews",
        targetBenchmark: "100% adherence to corporate governance norms",
        actualPerformance: "Q2 review conducted with full management team",
        frequency: "Quarterly",
        rating: "good",
      },
    ],
  },

  // 8. Rajesh Malhotra — Whole-Time Director (Apex)
  {
    id: "user-rajesh-apex",
    name: "Rajesh Malhotra",
    designation: "Whole-Time Director (Apex Global Logistics)",
    department: "billing_dispatch",
    subDepartment: "Commercial Dispatch",
    level: "DGM",
    reportsToId: null,
    reportsToName: "Board of Directors",
    avatar: "RM",
    email: "director@apexlogistics.in",
    experienceYears: 22,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "good",
    cfoAppraisalNotes:
      "Oversees logistics operations and bank drawing power certifications. Supports fast turnaround on commercial vendor contracts.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-rajesh-1",
        kraTitle: "Logistics Operations & Commercial Billing Oversight",
        kraWeightage: 40,
        kpiMetric: "Interstate Consignment Billing & E-Way Bill Reconciliation",
        targetBenchmark: "0 transit notice; 100% E-way bill generation compliance",
        actualPerformance: "₹4.8 Cr interstate consignment notes reconciled",
        frequency: "Monthly",
        rating: "good",
      },
      {
        id: "kpi-rajesh-2",
        kraTitle: "Banking Facility Limit Governance",
        kraWeightage: 30,
        kpiMetric: "Axis Bank CC Stock Audit & Working Capital Utilization",
        targetBenchmark: "100% Drawing power coverage with certified inventory",
        actualPerformance: "Drawing power certified by Sudhakar on time",
        frequency: "Monthly",
        rating: "good",
      },
      {
        id: "kpi-rajesh-3",
        kraTitle: "Transporter & Vendor Contract Compliance",
        kraWeightage: 30,
        kpiMetric: "TDS 194C declarations collected from fleet operators",
        targetBenchmark: "Zero non-compliance on subcontractor tax deduction",
        actualPerformance: "Declarations verified with TRACES portal",
        frequency: "Quarterly",
        rating: "good",
      },
    ],
  },

  // 9. Dr. Meera Krishnan — Designated Partner (Zenith)
  {
    id: "user-meera-zenith",
    name: "Dr. Meera Krishnan",
    designation: "Designated Partner (Zenith HealthTech)",
    department: "mis_erp",
    subDepartment: "Overall Supervision",
    level: "DGM",
    reportsToId: null,
    reportsToName: "Partner Board",
    avatar: "MK",
    email: "meera@zenithhealthtech.in",
    experienceYears: 19,
    evaluationMode: "auto_linked",
    cfoMarkedRating: "good",
    cfoAppraisalNotes:
      "Maintains rigorous healthcare compliance standards and partnership accounting approvals. Responsive to audit queries.",
    lastEvaluatedBy: "Sudhakar (Virtual CFO)",
    lastEvaluatedAt: "2026-10-02",
    kpis: [
      {
        id: "kpi-meera-1",
        kraTitle: "Healthcare Diagnostic Licensing & Regulatory Compliance",
        kraWeightage: 40,
        kpiMetric: "Bio-medical waste & FDA diagnostic lab certification renewals",
        targetBenchmark: "100% on-time license renewals with 0 lapse",
        actualPerformance: "All certifications current and archived in repository",
        frequency: "Annual",
        rating: "excellent",
      },
      {
        id: "kpi-meera-2",
        kraTitle: "LLP Partner Capital & Profit Sharing Governance",
        kraWeightage: 30,
        kpiMetric: "Annual Statement of Accounts & Solvency (Form 8) sign-off",
        targetBenchmark: "Approved within 30 days of half-year closure",
        actualPerformance: "Form 8 signed with DSC and submitted to MCA",
        frequency: "Annual",
        rating: "good",
      },
      {
        id: "kpi-meera-3",
        kraTitle: "Internal Audit Review & Action Items Promptness",
        kraWeightage: 30,
        kpiMetric: "Closure of internal clinical and accounts audit observations",
        targetBenchmark: "Resolution within 14 days of audit report",
        actualPerformance: "All audit queries resolved with clean review",
        frequency: "Quarterly",
        rating: "good",
      },
    ],
  },
];

export interface LinkedAppFunctionItem {
  id: string;
  sourceType:
    "Statutory Compliance" | "Compliance Subtask" | "Action Deliverable" | "Workflow Task";
  title: string;
  subtitle: string;
  statusLabel: string;
  isCompleted: boolean;
  isOverdue: boolean;
  scoreContribution: number; // 0 to 100
  targetTab: "compliances" | "actions" | "action_flow";
}

export interface MemberLinkedPerformanceSummary {
  isMentionedInApp: boolean;
  linkedFunctions: LinkedAppFunctionItem[];
  totalLinked: number;
  completedLinked: number;
  overdueLinked: number;
  computedScorePct: number;
  autoIndicator: PerformanceIndicator;
  kpiWeightedScorePct: number;
  kpiDerivedIndicator: PerformanceIndicator;
  effectiveIndicator: PerformanceIndicator;
  effectiveSourceLabel: string;
}

export function scoreToIndicator(scorePct: number): PerformanceIndicator {
  if (scorePct >= 85) return "excellent";
  if (scorePct >= 70) return "good";
  if (scorePct >= 50) return "satisfactory";
  return "below_average";
}

/**
 * Calculates live delay days, promptness score, and timely completion metrics for a deliverable.
 */
export function calculateDeliverableMetrics(
  deadlineStr?: string,
  isCompleted?: boolean,
  completedAtStr?: string,
  referenceDateStr: string = "2026-10-04",
): {
  delayDays: number;
  isOverdue: boolean;
  promptnessScore: number;
  promptnessRating: "Ultra-Prompt" | "On-Time" | "Minor Delay" | "Delayed";
} {
  const deadlineIso = parseDeadlineDateToIso(deadlineStr);
  const refTime = new Date(referenceDateStr).getTime();

  if (!deadlineIso) {
    return {
      delayDays: 0,
      isOverdue: false,
      promptnessScore: 85,
      promptnessRating: "On-Time",
    };
  }

  const deadlineTime = new Date(deadlineIso).getTime();

  if (isCompleted) {
    const completedIso = parseDeadlineDateToIso(completedAtStr);
    if (completedIso) {
      const compTime = new Date(completedIso).getTime();
      const diffDays = Math.round((compTime - deadlineTime) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        return {
          delayDays: 0,
          isOverdue: false,
          promptnessScore: diffDays < -1 ? 100 : 92,
          promptnessRating: diffDays < -1 ? "Ultra-Prompt" : "On-Time",
        };
      } else {
        return {
          delayDays: diffDays,
          isOverdue: false,
          promptnessScore: Math.max(30, 80 - diffDays * 12),
          promptnessRating: diffDays <= 2 ? "Minor Delay" : "Delayed",
        };
      }
    }
    return {
      delayDays: 0,
      isOverdue: false,
      promptnessScore: 90,
      promptnessRating: "On-Time",
    };
  }

  // Task is pending / in progress
  const diffDays = Math.round((refTime - deadlineTime) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    // Overdue!
    return {
      delayDays: diffDays,
      isOverdue: true,
      promptnessScore: Math.max(15, 60 - diffDays * 10),
      promptnessRating: "Delayed",
    };
  }

  // Not due yet:
  const daysRemaining = -diffDays;
  return {
    delayDays: 0,
    isOverdue: false,
    promptnessScore: daysRemaining >= 3 ? 98 : daysRemaining >= 1 ? 88 : 78,
    promptnessRating: daysRemaining >= 3 ? "Ultra-Prompt" : "On-Time",
  };
}

/**
 * Computes a comprehensive, multi-factor Performance Report Card for any team member,
 * evaluating:
 * 1. Delay days in tasks (past deadlines, overdue count, accumulated delay)
 * 2. Task promptness (TAT speed, early completion index)
 * 3. Timely completion rate (% finished on or before deadline)
 * 4. KRA/KPI achievement matrix
 */
export function generateMemberReportCard(
  member: FinanceTeamMemberKpi,
  compliances: ComplianceItem[] = [],
  actions: ActionItem[] = [],
  actionFlowTasks: ActionFlowTask[] = [],
  referenceDateStr: string = "2026-10-04",
): TeamMemberReportCard {
  const normalizedName = (member.name || "").trim().toLowerCase();

  const matchesPerson = (field?: string) => {
    if (!field || !normalizedName) return false;
    const f = field.trim().toLowerCase();
    return f === normalizedName || f.includes(normalizedName) || normalizedName.includes(f);
  };

  const deliverables: ReportCardDeliverable[] = [];

  // 1. Audit Statutory Compliances & Subtasks
  compliances.forEach((comp) => {
    if (comp.isHidden) return;
    const isOwner = matchesPerson(comp.assignedTo);

    if (isOwner) {
      const subDone = (comp.subtasks || []).filter((s) => s.status === "completed").length;
      const isAllDone = subDone === 3 || comp.status === "Filed" || comp.status === "Completed";
      const deadline = comp.dueDates?.[0] || comp.statutoryDueDate;
      const metrics = calculateDeliverableMetrics(
        deadline,
        isAllDone,
        comp.completionProofDoc?.filingDate || comp.subtasks?.[2]?.completedAt,
        referenceDateStr,
      );

      deliverables.push({
        id: `comp-${comp.id}`,
        title: comp.name,
        categoryOrModule: `${comp.category} Statutory Filing`,
        deadline: deadline || "October 2026",
        status: isAllDone ? "Completed" : comp.status || "In Progress",
        isCompleted: isAllDone,
        isOverdue: metrics.isOverdue,
        delayDays: metrics.delayDays,
        promptnessRating: metrics.promptnessRating,
        sourceTab: "compliances",
      });
    }

    // Subtasks specifically assigned
    (comp.subtasks || []).forEach((st) => {
      if (matchesPerson(st.assignedTo)) {
        const isDone = st.status === "completed";
        const metrics = calculateDeliverableMetrics(
          st.deadline,
          isDone,
          st.completedAt,
          referenceDateStr,
        );

        deliverables.push({
          id: `sub-${comp.id}-${st.subtaskNumber}`,
          title: `${comp.name} — ${st.stageName} (${st.title})`,
          categoryOrModule: "Compliance Workflow Stage",
          deadline: st.deadline || comp.statutoryDueDate,
          status: isDone ? "Completed" : "In Progress",
          isCompleted: isDone,
          isOverdue: metrics.isOverdue,
          delayDays: metrics.delayDays,
          promptnessRating: metrics.promptnessRating,
          sourceTab: "compliances",
        });
      }
    });
  });

  // 2. Audit Action Items & Working Capital Deliverables
  actions.forEach((act) => {
    if (act.isHidden) return;
    if (matchesPerson(act.assignedTo)) {
      const isDone = act.status === "Completed" || (act.progressPercentage || 0) >= 100;
      const metrics = calculateDeliverableMetrics(
        act.fixedDeadline,
        isDone,
        act.lastProgressUpdateDate,
        referenceDateStr,
      );

      deliverables.push({
        id: `act-${act.id}`,
        title: act.title,
        categoryOrModule: act.category,
        deadline: act.fixedDeadline,
        status: act.status,
        isCompleted: isDone,
        isOverdue: metrics.isOverdue,
        delayDays: metrics.delayDays,
        promptnessRating: metrics.promptnessRating,
        sourceTab: "actions",
      });
    }
  });

  // 3. Audit Action Flow / Process Workflow Tasks
  actionFlowTasks.forEach((task) => {
    if (task.isHidden) return;
    if (matchesPerson(task.assignedTo)) {
      const isDone = task.status === "completed";
      const metrics = calculateDeliverableMetrics(
        task.dueDate,
        isDone,
        task.completedAt,
        referenceDateStr,
      );

      deliverables.push({
        id: `af-${task.id}`,
        title: task.title,
        categoryOrModule: `Workflow: ${task.category}`,
        deadline: task.dueDate || "On Schedule",
        status: task.status.replace("_", " ").toUpperCase(),
        isCompleted: isDone,
        isOverdue: metrics.isOverdue,
        delayDays: metrics.delayDays,
        promptnessRating: metrics.promptnessRating,
        sourceTab: "action_flow",
      });
    }
  });

  // Deduplicate deliverables by id
  const seenDelivIds = new Set<string>();
  const uniqueDeliverables = deliverables.filter((d) => {
    if (seenDelivIds.has(d.id)) return false;
    seenDelivIds.add(d.id);
    return true;
  });

  // Metrics computation
  const totalAssignedTasks = uniqueDeliverables.length;
  const completedDeliverables = uniqueDeliverables.filter((d) => d.isCompleted);
  const completedOnTimeCount = completedDeliverables.filter((d) => d.delayDays === 0).length;
  const completedDelayedCount = completedDeliverables.filter((d) => d.delayDays > 0).length;
  const inProgressDeliverables = uniqueDeliverables.filter((d) => !d.isCompleted);
  const inProgressCount = inProgressDeliverables.length;
  const currentOverdueTasksCount = inProgressDeliverables.filter((d) => d.delayDays > 0).length;

  const totalDelayDays = uniqueDeliverables.reduce((sum, d) => sum + d.delayDays, 0);
  const averageDelayDays =
    currentOverdueTasksCount > 0
      ? Math.round((totalDelayDays / currentOverdueTasksCount) * 10) / 10
      : 0;
  const longestDelayDays = uniqueDeliverables.reduce((max, d) => Math.max(max, d.delayDays), 0);

  // Timely completion rate %
  const timelyCompletionRate =
    totalAssignedTasks > 0
      ? Math.round(
          ((completedOnTimeCount + (inProgressCount - currentOverdueTasksCount)) /
            totalAssignedTasks) *
            100,
        )
      : 96;

  // Task Promptness Score (0 - 100)
  const promptnessScore =
    totalAssignedTasks > 0
      ? Math.round(
          uniqueDeliverables.reduce((sum, d) => {
            if (d.promptnessRating === "Ultra-Prompt") return sum + 100;
            if (d.promptnessRating === "On-Time") return sum + 88;
            if (d.promptnessRating === "Minor Delay") return sum + 55;
            return sum + 30;
          }, 0) / totalAssignedTasks,
        )
      : 92;

  const aheadOfScheduleCount = uniqueDeliverables.filter(
    (d) => d.promptnessRating === "Ultra-Prompt",
  ).length;

  const promptnessLevel: TeamMemberReportCard["promptnessLevel"] =
    promptnessScore >= 90
      ? "Ultra-Prompt (A+)"
      : promptnessScore >= 75
        ? "Prompt & Timely (A)"
        : promptnessScore >= 60
          ? "Moderate Turnaround (B)"
          : "Needs Follow-up (C)";

  // KRA weighted score
  const totalKpiWeight = member.kpis.reduce((sum, k) => sum + (k.kraWeightage || 25), 0) || 100;
  const kraWeightedScore =
    member.kpis.length > 0
      ? Math.round(
          member.kpis.reduce(
            (sum, k) =>
              sum +
              PERFORMANCE_INDICATOR_META[k.rating].scoreWeight *
                ((k.kraWeightage || 25) / totalKpiWeight),
            0,
          ),
        )
      : PERFORMANCE_INDICATOR_META[member.cfoMarkedRating].scoreWeight;

  // Overall Score (0 - 100)
  // Blends: 35% Timely Completion, 30% Promptness, 25% KRA Achievement, minus delay penalty
  const delayPenalty = Math.min(15, totalDelayDays * 2);
  const rawScore =
    0.35 * timelyCompletionRate + 0.3 * promptnessScore + 0.25 * kraWeightedScore - delayPenalty;
  const overallScore = Math.min(100, Math.max(35, Math.round(rawScore)));

  const overallGrade: TeamMemberReportCard["overallGrade"] =
    overallScore >= 90 ? "A+" : overallScore >= 75 ? "A" : overallScore >= 60 ? "B" : "C";

  const performanceIndicator = scoreToIndicator(overallScore);

  return {
    memberId: member.id,
    memberName: member.name,
    designation: member.designation,
    department: member.department,
    evaluationDate: referenceDateStr,
    overallScore,
    overallGrade,
    performanceIndicator,
    timelyCompletionRate,
    totalAssignedTasks,
    completedOnTimeCount,
    completedDelayedCount,
    inProgressCount,
    promptnessScore,
    promptnessLevel,
    averageTatDays: promptnessScore >= 90 ? 1.5 : promptnessScore >= 75 ? 2.8 : 4.5,
    aheadOfScheduleCount,
    totalDelayDays,
    averageDelayDays,
    currentOverdueTasksCount,
    longestDelayDays,
    deliverables: uniqueDeliverables,
    kraWeightedScore,
    cfoFeedbackNotes:
      member.cfoAppraisalNotes ||
      (totalDelayDays === 0
        ? "Consistently demonstrates high promptness and prompt adherence to statutory SLAs."
        : `Active monitoring recommended for ${totalDelayDays} accumulated delay days across pending tasks.`),
  };
}

/**
 * Computes live app-linked performance summary for a member.
 */
export function computeMemberAppLinkedPerformance(
  member: FinanceTeamMemberKpi,
  compliances: ComplianceItem[] = [],
  actions: ActionItem[] = [],
  actionFlowTasks: ActionFlowTask[] = [],
): MemberLinkedPerformanceSummary {
  const card = generateMemberReportCard(member, compliances, actions, actionFlowTasks);
  const isMentionedInApp = card.totalAssignedTasks > 0;

  const linkedFunctions: LinkedAppFunctionItem[] = card.deliverables.map((d) => ({
    id: d.id,
    sourceType: d.categoryOrModule.includes("Statutory")
      ? "Statutory Compliance"
      : d.categoryOrModule.includes("Stage")
        ? "Compliance Subtask"
        : d.sourceTab === "action_flow"
          ? "Workflow Task"
          : "Action Deliverable",
    title: d.title,
    subtitle: `${d.categoryOrModule} • Due ${d.deadline}`,
    statusLabel: `${d.status} (${d.delayDays === 0 ? "On Time" : `+${d.delayDays}d delay`})`,
    isCompleted: d.isCompleted,
    isOverdue: d.isOverdue,
    scoreContribution: d.promptnessRating === "Ultra-Prompt" ? 98 : d.delayDays === 0 ? 88 : 45,
    targetTab: d.sourceTab,
  }));

  const autoIndicator = card.performanceIndicator;
  const effectiveIndicator: PerformanceIndicator =
    member.evaluationMode === "auto_linked" && isMentionedInApp
      ? autoIndicator
      : member.cfoMarkedRating;

  const effectiveSourceLabel =
    member.evaluationMode === "auto_linked" && isMentionedInApp
      ? `Linked (${card.totalAssignedTasks} ${card.totalAssignedTasks === 1 ? "Task" : "Tasks"}) • Grade ${card.overallGrade}`
      : "CFO Marked";

  return {
    isMentionedInApp,
    linkedFunctions,
    totalLinked: card.totalAssignedTasks,
    completedLinked: card.completedOnTimeCount + card.completedDelayedCount,
    overdueLinked: card.currentOverdueTasksCount,
    computedScorePct: card.overallScore,
    autoIndicator,
    kpiWeightedScorePct: card.kraWeightedScore,
    kpiDerivedIndicator: scoreToIndicator(card.kraWeightedScore),
    effectiveIndicator,
    effectiveSourceLabel,
  };
}
