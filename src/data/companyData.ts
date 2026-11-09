import {
  ComplianceItem,
  ActionItem,
  FinancialMIS,
  ClientProfile,
  CompanyOverviewSummary,
} from "../types";
import { COMPLIANCE_MASTER_LIST } from "./complianceMaster";
import { CLIENT_COMPANIES, INITIAL_ACTION_ITEMS, COMPANY_FINANCIAL_MIS } from "./mockInitialData";

// Generate simulated compliances for Apex Logistics (client-102)
const APEX_COMPLIANCES: ComplianceItem[] = COMPLIANCE_MASTER_LIST.map((c, idx) => {
  const isFiled = idx % 2 === 0; // alternate filed
  const isCfoPending = idx % 5 === 1;

  return {
    ...c,
    id: `apex-${c.id}`,
    companyId: "client-102",
    arnOrChallanNo: isFiled ? `APEX-CHL-${9200 + idx}` : undefined,
    subtasks: [
      {
        ...c.subtasks[0],
        status: isFiled || isCfoPending ? "completed" : "pending",
        completedAt: isFiled || isCfoPending ? "2026-09-12 11:00" : undefined,
        completedBy: isFiled || isCfoPending ? "Apex Accounts Team" : undefined,
      },
      {
        ...c.subtasks[1],
        status: isFiled ? "completed" : "pending",
        completedAt: isFiled ? "2026-09-14 16:30" : undefined,
        completedBy: isFiled ? "Sudhakar (CFO)" : undefined,
      },
      {
        ...c.subtasks[2],
        status: isFiled ? "completed" : "pending",
        completedAt: isFiled ? "2026-09-15 10:45" : undefined,
        completedBy: isFiled ? "Apex Tax Filing Desk" : undefined,
      },
    ] as any,
  };
});

// Generate simulated compliances for Zenith HealthTech (client-103)
const ZENITH_COMPLIANCES: ComplianceItem[] = COMPLIANCE_MASTER_LIST.map((c, idx) => {
  const isFiled = idx % 3 !== 1; // 66% filed

  return {
    ...c,
    id: `zenith-${c.id}`,
    companyId: "client-103",
    arnOrChallanNo: isFiled ? `ZENITH-ARN-${8100 + idx}` : undefined,
    subtasks: [
      {
        ...c.subtasks[0],
        status: isFiled ? "completed" : "pending",
        completedAt: isFiled ? "2026-09-10 14:00" : undefined,
        completedBy: isFiled ? "Zenith Finance Team" : undefined,
      },
      {
        ...c.subtasks[1],
        status: isFiled ? "completed" : "pending",
        completedAt: isFiled ? "2026-09-12 17:00" : undefined,
        completedBy: isFiled ? "Sudhakar (CFO)" : undefined,
      },
      {
        ...c.subtasks[2],
        status: isFiled ? "completed" : "pending",
        completedAt: isFiled ? "2026-09-13 11:15" : undefined,
        completedBy: isFiled ? "Zenith Filing Team" : undefined,
      },
    ] as any,
  };
});

// Action items for Apex Logistics (client-102)
const APEX_ACTIONS: ActionItem[] = [
  {
    id: "apex-act-1",
    companyId: "client-102",
    title: "Axis Bank Working Capital CC Stock & Receivables Statement",
    description:
      "Submission of monthly DP (Drawing Power) statement audited by Sudhakar to Axis Bank SME desk.",
    category: "Banking & Treasury",
    assignedTo: "Vikram Singhania",
    assignedRole: "Finance Controller",
    priority: "Urgent",
    status: "In Progress",
    decidedDate: "2026-09-14",
    durationDays: 6,
    fixedDeadline: "2026-09-20",
    checkInCadenceDays: 2,
    lastProgressUpdateDate: "2026-09-18 15:00",
    progressPercentage: 70,
    progressUpdates: [
      {
        id: "apex-upd-1-1",
        date: "2026-09-16 11:00",
        updatedBy: "Vikram Singhania",
        progressPercentage: 35,
        notes: "Consolidated stock inventory across 4 regional hubs.",
        status: "In Progress",
      },
      {
        id: "apex-upd-1-2",
        date: "2026-09-18 15:00",
        updatedBy: "Vikram Singhania",
        progressPercentage: 70,
        notes:
          "Debtors aging report bifurcated (<90d vs >90d). DP calculation certified by Sudhakar.",
        status: "In Progress",
      },
    ],
    createdAt: "2026-09-14",
    remarks:
      "Stock statements from 4 regional warehouses consolidated; debtors aging report ready for CFO sign-off.",
  },
  {
    id: "apex-act-2",
    companyId: "client-102",
    title: "Fleet Sub-Contractor TDS under Section 194C Lower Deduction Audit",
    description:
      "Verify Form 26Q TDS schedules for 45 transport sub-contractors and cross-check PAN with valid 197 lower deduction orders.",
    category: "Direct/Indirect Tax Ops",
    assignedTo: "Rahul Verma",
    assignedRole: "Tax Associate",
    priority: "High",
    status: "Pending",
    decidedDate: "2026-09-15",
    durationDays: 9,
    fixedDeadline: "2026-09-24",
    checkInCadenceDays: 2,
    lastProgressUpdateDate: "2026-09-17 16:30",
    progressPercentage: 30,
    progressUpdates: [
      {
        id: "apex-upd-2-1",
        date: "2026-09-17 16:30",
        updatedBy: "Rahul Verma",
        progressPercentage: 30,
        notes:
          "Collected transporter 194C(6) declarations. Verifying lower deduction orders on TRACES.",
        status: "Pending",
      },
    ],
    createdAt: "2026-09-15",
    remarks: "TDS liability computed at ₹1.85L. Pending 3 transporter PAN validation on IT portal.",
  },
  {
    id: "apex-act-3",
    companyId: "client-102",
    title: "E-Way Bill vs GSTR-1 Interstate Freight Reconciliation",
    description:
      "Match ₹4.8 Cr interstate consignment notes against generated E-way bills to eliminate GST notice risk.",
    category: "Internal Audit & Controls",
    assignedTo: "Pooja Sharma",
    assignedRole: "Sr. Accountant",
    priority: "Medium",
    status: "Completed",
    decidedDate: "2026-09-10",
    durationDays: 7,
    fixedDeadline: "2026-09-17",
    checkInCadenceDays: 2,
    lastProgressUpdateDate: "2026-09-16 10:00",
    progressPercentage: 100,
    progressUpdates: [
      {
        id: "apex-upd-3-1",
        date: "2026-09-12 14:00",
        updatedBy: "Pooja Sharma",
        progressPercentage: 50,
        notes: "Exported EWB-01 log from NIC portal; matching ₹4.8 Cr freight consignments.",
        status: "In Progress",
      },
      {
        id: "apex-upd-3-2",
        date: "2026-09-16 10:00",
        updatedBy: "Pooja Sharma",
        progressPercentage: 100,
        notes:
          "Automated reconciliation passed with zero discrepancies. CFO signed variance report.",
        status: "Completed",
      },
    ],
    createdAt: "2026-09-10",
    completedAt: "2026-09-16T10:00:00Z",
    remarks:
      "Reconciliation completed. Zero discrepancies found between NIC portal e-way bills and sales register.",
  },
];

// Action items for Zenith HealthTech (client-103)
const ZENITH_ACTIONS: ActionItem[] = [
  {
    id: "zenith-act-1",
    companyId: "client-103",
    title: "MCA LLP Form 8 (Statement of Account & Solvency) Filing Draft",
    description:
      "Preparation of Statement of Solvency, partner contribution disclosures, and audit certification for FY 25-26.",
    category: "Financial Reporting & MIS",
    assignedTo: "CS Alok Mehta",
    assignedRole: "Secretarial Advisor",
    priority: "High",
    status: "In Progress",
    decidedDate: "2026-09-12",
    durationDays: 16,
    fixedDeadline: "2026-09-28",
    checkInCadenceDays: 2,
    lastProgressUpdateDate: "2026-09-18 12:00",
    progressPercentage: 65,
    progressUpdates: [
      {
        id: "zenith-upd-1-1",
        date: "2026-09-15 15:00",
        updatedBy: "CS Alok Mehta",
        progressPercentage: 35,
        notes: "LLP Statement of Assets and Liabilities drafted.",
        status: "In Progress",
      },
      {
        id: "zenith-upd-1-2",
        date: "2026-09-18 12:00",
        updatedBy: "CS Alok Mehta",
        progressPercentage: 65,
        notes: "Designated Partners Solvency Declaration drafted and reviewed by Sudhakar.",
        status: "In Progress",
      },
    ],
    createdAt: "2026-09-12",
    remarks: "Balance sheet extract prepared. Sudhakar certificate scheduled for signature.",
  },
  {
    id: "zenith-act-2",
    companyId: "client-103",
    title: "R&D Bio-Sensor Patent Tax Incentive under Section 35(2AB)",
    description:
      "Documentation of clinical trial R&D expenditures to claim 100% weighted deduction under Income Tax Act.",
    category: "Direct/Indirect Tax Ops",
    assignedTo: "Sudhakar",
    assignedRole: "Virtual CFO",
    priority: "Medium",
    status: "Pending",
    decidedDate: "2026-09-14",
    durationDays: 21,
    fixedDeadline: "2026-10-05",
    checkInCadenceDays: 2,
    lastProgressUpdateDate: "2026-09-16 17:00",
    progressPercentage: 25,
    progressUpdates: [
      {
        id: "zenith-upd-2-1",
        date: "2026-09-16 17:00",
        updatedBy: "Sudhakar",
        progressPercentage: 25,
        notes: "Collating component purchase invoices and lab trial testing fees for DSIR filing.",
        status: "Pending",
      },
    ],
    createdAt: "2026-09-14",
    remarks: "Technical report received from CSIR accredited laboratory.",
  },
];

export const ALL_COMPANIES_COMPLIANCES: Record<string, ComplianceItem[]> = {
  "client-101": COMPLIANCE_MASTER_LIST.map((c) => ({ ...c, companyId: "client-101" })),
  "client-102": APEX_COMPLIANCES,
  "client-103": ZENITH_COMPLIANCES,
};

export const ALL_COMPANIES_ACTIONS: Record<string, ActionItem[]> = {
  "client-101": INITIAL_ACTION_ITEMS.map((a) => ({ ...a, companyId: "client-101" })),
  "client-102": APEX_ACTIONS,
  "client-103": ZENITH_ACTIONS,
};
