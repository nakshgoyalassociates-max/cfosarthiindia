import {
  SecurityProtocolConfig,
  RolePermissionsMap,
  AuditLogItem,
  MisRemarkItem,
  ModulePermission,
  UserModulePermissions,
  UserPermissionPreset,
  PermissionModuleKey,
  Role,
} from "../types";

export const PERMISSION_MODULES_META: Array<{
  key: PermissionModuleKey;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: "mis",
    label: "Financial MIS & Statements",
    shortLabel: "MIS",
    description: "Balance Sheet, P&L Statement, Debtor Ageing, and Broad Picture",
  },
  {
    key: "budget",
    label: "Monthly Budget & Variances",
    shortLabel: "Budget",
    description: "Budget allocation, Actual expenses, and variance monitoring",
  },
  {
    key: "compliances",
    label: "Statutory Compliances Master",
    shortLabel: "Compliances",
    description: "GST, TDS, ROC, Advance Tax, and 3-step filing workflow",
  },
  {
    key: "actions",
    label: "Action Items & Pendencies",
    shortLabel: "Actions",
    description: "Working capital actions, vendor reconciliation, and audit tasks",
  },
  {
    key: "companies",
    label: "Company Profiles & Master Data",
    shortLabel: "Entity/Repo",
    description: "Legal entity info, GSTIN, PAN, and corporate configuration",
  },
];

export const USER_PERMISSION_PRESET_LABELS: Record<
  UserPermissionPreset,
  { label: string; description: string }
> = {
  super_admin: {
    label: "Super Admin & Practice Lead",
    description: "Full access across all companies, modules, approvals, and security settings",
  },
  full_edit: {
    label: "Full Edit & Upload",
    description: "Can view, edit/draft, and upload Excel across MIS, Budget, Compliances & Actions",
  },
  full_edit_upload: {
    label: "Full Edit & Upload",
    description: "Can view, edit/draft, and upload Excel across MIS, Budget, Compliances & Actions",
  },
  view_and_edit: {
    label: "Edit Only (No Excel)",
    description: "Can view and edit/draft records, without bulk Excel upload facility",
  },
  edit_no_upload: {
    label: "Edit Only (No Excel)",
    description: "Can view and edit/draft records, without bulk Excel upload facility",
  },
  compliance_focus: {
    label: "Compliance & Tax Only",
    description: "Can edit/file Compliances & Actions; View-Only on Financial MIS & Budget",
  },
  compliance_only: {
    label: "Compliance & Tax Only",
    description: "Can edit/file Compliances & Actions; View-Only on Financial MIS & Budget",
  },
  mis_and_budget_only: {
    label: "MIS & Budget Only",
    description: "Can edit & upload Excel for MIS & Budget; View-Only on Compliances",
  },
  view_only: {
    label: "View Only (Read-Only)",
    description: "Read-only viewing rights across modules; no editing or uploading",
  },
  custom: {
    label: "Custom Person Rights",
    description: "Tailored per-module viewing, editing, and upload matrix for this individual",
  },
};

export const DEFAULT_SECURITY_PROTOCOLS: SecurityProtocolConfig = {
  mfaEnforced: false,
  sessionTimeoutMinutes: 60,
  ipWhitelistingEnabled: false,
  whitelistedIps: ["192.168.1.0/24", "103.21.244.0/22"],
  lockClosedPeriod: true,
  lockedPeriodName: "July 2026 (Audited & Locked)",
  requireApprovalForExport: false,
  watermarkExports: true,
  clientSingleCompanyIsolation: true,
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  cfo: {
    mis: { canView: true, canEdit: true, canUploadExcel: true, canDelete: true, canApprove: true },
    budget: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: true,
      canApprove: true,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: true,
      canApprove: true,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: true,
      canApprove: true,
    },
    companies: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: true,
      canApprove: true,
    },
  },
  client_team: {
    mis: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
  client: {
    mis: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
};

export function buildPermissionsFromPreset(
  preset: UserPermissionPreset,
  role: Role = "client_team",
): UserModulePermissions {
  if (role === "cfo") {
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS.cfo));
  }
  if (preset === "full_edit" || preset === "full_edit_upload") {
    return {
      mis: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      budget: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      compliances: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      actions: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      companies: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
    };
  }
  if (preset === "view_and_edit" || preset === "edit_no_upload") {
    return {
      mis: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      budget: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      compliances: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      actions: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      companies: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
    };
  }
  if (preset === "compliance_focus" || preset === "compliance_only") {
    return {
      mis: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      budget: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      compliances: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      actions: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      companies: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
    };
  }
  if (preset === "mis_and_budget_only") {
    return {
      mis: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      budget: {
        canView: true,
        canEdit: true,
        canUploadExcel: true,
        canDelete: false,
        canApprove: false,
      },
      compliances: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      actions: {
        canView: true,
        canEdit: true,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
      companies: {
        canView: true,
        canEdit: false,
        canUploadExcel: false,
        canDelete: false,
        canApprove: false,
      },
    };
  }
  if (preset === "view_only") {
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS.client));
  }
  return JSON.parse(
    JSON.stringify(
      DEFAULT_ROLE_PERMISSIONS[role === "admin" ? "cfo" : role] ||
        DEFAULT_ROLE_PERMISSIONS.client_team,
    ),
  );
}

// Specific person-level default permissions for each Client Team / Director member
export const DEFAULT_USER_PERMISSIONS: Record<string, UserModulePermissions> = {
  "user-naksh-goyal": buildPermissionsFromPreset("full_edit", "cfo"),
  "user-cfo": buildPermissionsFromPreset("full_edit", "cfo"),
  "user-client": buildPermissionsFromPreset("view_only", "client"),
  // Pooja Sharma — Sr. Tax Accountant: Full Edit & Excel Upload across MIS, Budget, Compliances, Actions
  "user-pooja": {
    mis: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
  // Rahul Verma — Filing Associate & Treasury Ops: Can edit Compliances & Actions, View-only on MIS & Budget
  "user-rahul": {
    mis: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
  // Amit Patel — Payroll & Labor Compliance Exec: Can edit Compliances, Actions & Budget; View-only on MIS
  "user-amit": {
    mis: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
  // Vikram Singhania — Finance Controller (Apex): Full Edit & Excel Upload
  "user-vikram-apex": buildPermissionsFromPreset("full_edit", "client_team"),
  // Rajesh Malhotra — Whole-Time Director (Apex): View Only
  "user-rajesh-apex": buildPermissionsFromPreset("view_only", "client"),
  // CS Alok Mehta — Secretarial & Accounts Lead (Zenith): View & Edit including Company Profile
  "user-alok-zenith": {
    mis: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    budget: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    compliances: {
      canView: true,
      canEdit: true,
      canUploadExcel: true,
      canDelete: false,
      canApprove: false,
    },
    actions: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
    companies: {
      canView: true,
      canEdit: true,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    },
  },
  // Dr. Meera Krishnan — Designated Partner (Zenith): View Only
  "user-meera-zenith": buildPermissionsFromPreset("view_only", "client"),
};

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-101",
    timestamp: "2026-09-18 14:32:10",
    userId: "user-cfo",
    userName: "Sudhakar",
    role: "cfo",
    companyId: "client-101",
    companyName: "Nexora Innovations Tech Pvt Ltd",
    action: "USER_LOGIN",
    details: "Authenticated via Practice SSO into Virtual CFO Portfolio Dashboard.",
    ipAddress: "103.21.244.18",
    status: "success",
  },
  {
    id: "log-102",
    timestamp: "2026-09-18 11:15:44",
    userId: "user-client-team",
    userName: "Pooja Sharma",
    role: "client_team",
    companyId: "client-101",
    companyName: "Nexora Innovations Tech Pvt Ltd",
    action: "EXCEL_UPLOAD_MIS",
    details:
      "Uploaded August 2026 Trial Balance & MIS data in decided template (32 metric rows parsed).",
    ipAddress: "115.112.89.4",
    status: "success",
  },
  {
    id: "log-103",
    timestamp: "2026-09-17 18:40:02",
    userId: "user-cfo",
    userName: "Sudhakar",
    role: "cfo",
    companyId: "client-101",
    companyName: "Nexora Innovations Tech Pvt Ltd",
    action: "COMPLIANCE_APPROVED",
    details: "Approved Stage 2 (CFO Review) for GSTR-3B monthly filing & payment authorization.",
    ipAddress: "103.21.244.18",
    status: "success",
  },
  {
    id: "log-104",
    timestamp: "2026-09-16 09:20:15",
    userId: "user-cfo",
    userName: "Sudhakar",
    role: "cfo",
    companyId: "client-101",
    companyName: "Nexora Innovations Tech Pvt Ltd",
    action: "SECURITY_PROTOCOL_CHANGED",
    details:
      "Enforced strict single-company client isolation and locked July 2026 historical books.",
    ipAddress: "103.21.244.18",
    status: "success",
  },
  {
    id: "log-105",
    timestamp: "2026-09-15 16:05:30",
    userId: "user-client-team",
    userName: "Pooja Sharma",
    role: "client_team",
    companyId: "client-101",
    companyName: "Nexora Innovations Tech Pvt Ltd",
    action: "REMARK_ADDED",
    details:
      "Logged variance explanation note for Tech & Cloud Infrastructure cost overrun (+14.2%).",
    ipAddress: "115.112.89.4",
    status: "success",
  },
];

export const INITIAL_MIS_REMARKS: MisRemarkItem[] = [
  {
    id: "rem-101",
    companyId: "client-101",
    section: "pnl",
    sectionTitle: "Profit & Loss Account",
    title: "Cloud & Infrastructure Cost Variance (+14.2%)",
    reason:
      "Hosting costs spiked in August due to parallel staging cluster deployment for US enterprise client onboarding. Testing completed; expenses will normalize to ~₹3.2L/month in September.",
    role: "client_team",
    authorName: "Pooja Sharma (Client Finance)",
    createdAt: "15 Sep 2026, 04:05 PM",
    status: "reviewed",
    cfoFeedback:
      "Reviewed and verified with AWS bill breakdown. Recommended opting for 1-year Compute Savings Plan to lock in 28% discount for the new US cluster.",
    varianceNote: "Overspend of ₹45,000 against monthly budget.",
  },
  {
    id: "rem-102",
    companyId: "client-101",
    section: "debtor-ageing",
    sectionTitle: "Debtor Ageing & MSME Payables",
    title: "FabTech Systems Invoice ₹1.65L Delayed Beyond 45 Days",
    reason:
      "Client finance team confirmed their internal SAP ERP migration delayed payment cycles across vendors. Formal assurance received from their VP Finance for disbursement by next Tuesday.",
    role: "client_team",
    authorName: "Pooja Sharma (Client Finance)",
    createdAt: "16 Sep 2026, 11:30 AM",
    status: "open",
    cfoFeedback:
      "Follow up on Monday afternoon. If not credited by Wednesday, issue standard overdue notice.",
  },
  {
    id: "rem-103",
    companyId: "client-101",
    section: "balance-sheet",
    sectionTitle: "Balance Sheet & Capital Deployment",
    title: "Capital Work-in-Progress (₹3.5 Lakhs)",
    reason:
      "Expenditure towards developing in-house automated GST-TDS reconciliation tool. Direct developer hours and external API tokens capitalized under Intangible Assets under Development.",
    role: "client",
    authorName: "Anand Verma (Director)",
    createdAt: "14 Sep 2026, 02:15 PM",
    status: "reviewed",
    cfoFeedback:
      "Capitalization criteria complies with Ind AS 38 / AS 26. Statutory auditor has been briefed.",
  },
  {
    id: "rem-104",
    companyId: "client-101",
    section: "budget",
    sectionTitle: "Monthly Budget & Variances",
    title: "Administrative Expenses Saving (-8.5%)",
    reason:
      "Savings realized from renegotiated lease terms on regional coworking hubs and transitioned hybrid meeting infrastructure.",
    role: "client_team",
    authorName: "Pooja Sharma (Client Finance)",
    createdAt: "17 Sep 2026, 05:20 PM",
    status: "resolved",
    cfoFeedback: "Excellent cost control. Surplus retained in liquid treasury.",
  },
];
