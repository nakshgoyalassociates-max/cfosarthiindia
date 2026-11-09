// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  RefreshCw,
  Clock,
  Globe,
  FileSpreadsheet,
  Check,
  X,
  UserPlus,
  Layers,
  Calendar,
  CheckSquare,
  ArrowLeft,
  AlertCircle,
  FastForward,
} from "lucide-react";
import {
  ClientProfile,
  ComplianceItem,
  ComplianceCategory,
  Role,
  UserAccount,
  ModulePermission,
  AuditLogItem,
  ActionItem,
  ActionPriority,
  ActionStatus,
  ActionCategory,
  HideableEntityType,
  PermissionModuleKey,
  UserModulePermissions,
  UserPermissionPreset,
} from "../../types";
import {
  buildPermissionsFromPreset,
  USER_PERMISSION_PRESET_LABELS,
  PERMISSION_MODULES_META,
} from "../../data/mockAdminSecurityData";
import { formatLakhs } from "../../utils/format";
import { toIsoDateString } from "../../utils/dueDate";
import { ConfirmDestructiveDialog } from "../common/ConfirmDestructiveDialog";
import { ComplianceEditModal } from "./ComplianceEditModal";
import { ActionEditModal } from "./ActionEditModal";
import { EntityEditModal, UserEditModal } from "./EntityAndTeamEditModal";
import { NewActionModal } from "../modals/NewActionModal";

export type AdminTab =
  | "permissions"
  | "security"
  | "compliances"
  | "actions"
  | "companies"
  | "users"
  | "visibility"
  | "audit";

export interface AdminPanelProps {
  initialTab?: AdminTab;
  embedded?: boolean;
  onCloseEmbedded?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialTab,
  embedded,
  onCloseEmbedded,
}) => {
  const {
    role,
    currentUser,
    isCfoAdmin,
    setIsCfoAdmin,
    rolePermissions,
    updateRolePermission,
    getUserPermissions,
    updateUserPermission,
    applyUserPermissionPreset,
    switchActiveUser,
    setIsInviteModalOpen,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    activeCompanyId,
    clientProfile,
    showToast,
    securityProtocols,
    updateSecurityProtocols,
    compliances,
    addComplianceMasterItem,
    updateCompliance,
    assignComplianceOwner,
    updateComplianceSubtaskAssignment,
    deleteComplianceMasterItem,
    actions,
    addAction,
    updateAction,
    deleteAction,
    setIsNewActionModalOpen,
    userAccounts,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    auditLogs,
    addAuditLog,
    rawCompanies,
    rawCompliances,
    rawActions,
    rawActionFlowTasks,
    rawTaxAssessments,
    rawLegalCases,
    rawLicenses,
    rawSops,
    rawBudgetItems,
    rawUserAccounts,
    rawMisRemarks,
    executiveReports,
    hiddenItemsRegistry,
    toggleItemVisibility,
    unhideAllItems,
  } = useApp();

  const [showHiddenInTabs, setShowHiddenInTabs] = useState<boolean>(true);
  const [vaultMode, setVaultMode] = useState<"hidden" | "manage_all">("hidden");
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<"ALL" | HideableEntityType>("ALL");
  const [vaultSearch, setVaultSearch] = useState<string>("");

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || "permissions");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [itemToDelete, setItemToDelete] = useState<{
    type: "company" | "compliance" | "action" | "user";
    id: string;
    name: string;
  } | null>(null);

  // Modals for editing
  const [editingCompliance, setEditingCompliance] = useState<ComplianceItem | null>(null);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [editingCompany, setEditingCompany] = useState<ClientProfile | null>(null);
  const [editingCompanySubTab, setEditingCompanySubTab] = useState<
    "details" | "team" | "benchmarks"
  >("details");
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userCompanyFilter, setUserCompanyFilter] = useState<string>("ALL");

  // Compliances Search & Filter
  const [complianceSearch, setComplianceSearch] = useState("");
  const [complianceCatFilter, setComplianceCatFilter] = useState("ALL");
  const [complianceCriticalityFilter, setComplianceCriticalityFilter] = useState("ALL");
  const [complianceAssigneeFilter, setComplianceAssigneeFilter] = useState("ALL");

  // Combined directory of assignable persons for Compliances & Subtasks
  const assignableDirectory = useMemo(() => {
    const map = new Map<string, { name: string; roleTitle: string }>();
    const entityUsers = (userAccounts || []).filter(
      (u) =>
        u.role === "cfo" ||
        u.companyId === "all" ||
        u.companyId === activeCompanyId ||
        (u.assignedCompanyIds || []).includes(activeCompanyId),
    );
    const sourceList = entityUsers.length > 0 ? entityUsers : userAccounts || [];
    sourceList.forEach((u) => {
      if (u.name) {
        map.set(u.name.trim(), {
          name: u.name.trim(),
          roleTitle:
            u.roleTitle ||
            (u.role === "cfo"
              ? "Virtual CFO"
              : u.role === "client"
                ? "Client Director"
                : "Client Finance Team"),
        });
      }
    });
    const cfoName = (clientProfile?.assignedCfo || clientProfile?.cfoName || "").trim();
    if (cfoName && !map.has(cfoName)) {
      map.set(cfoName, {
        name: cfoName,
        roleTitle: "Virtual CFO",
      });
    }
    return Array.from(map.values());
  }, [userAccounts, activeCompanyId, clientProfile]);

  const defaultCfoName = useMemo(() => {
    return (
      clientProfile?.assignedCfo ||
      clientProfile?.cfoName ||
      (userAccounts || []).find((u) => u.role === "cfo")?.name ||
      "Sudhakar"
    );
  }, [clientProfile, userAccounts]);

  const defaultTeamAssignee = useMemo(() => {
    return (
      assignableDirectory.find((p) => !p.roleTitle.toLowerCase().includes("cfo"))?.name ||
      assignableDirectory[0]?.name ||
      "Pooja Sharma"
    );
  }, [assignableDirectory]);

  // Bulk Statutory Extension Helper
  const [isBulkExtensionOpen, setIsBulkExtensionOpen] = useState(false);
  const [bulkExtensionDays, setBulkExtensionDays] = useState(15);
  const [bulkExtensionCat, setBulkExtensionCat] = useState("ALL");
  const [bulkExtensionRef, setBulkExtensionRef] = useState("CBDT Notification No. 28/2026");

  // Actions Search & Filter
  const [actionSearch, setActionSearch] = useState("");
  const [actionPriorityFilter, setActionPriorityFilter] = useState("ALL");
  const [actionStatusFilter, setActionStatusFilter] = useState("ALL");

  // State for Add Company Modal
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyName: "",
    legalEntity: "Private Limited",
    sector: "Technology & SaaS",
    gstin: "",
    pan: "",
    cin: "",
    assignedCfo: defaultCfoName,
    incorporationYear: 2021,
    city: "Bengaluru",
    turnoverBracket: "₹10 Cr - ₹25 Cr",
    financialYear: "FY 2026-27",
  });

  // Security Protocols IP Whitelisting state
  const [newIpInput, setNewIpInput] = useState("");

  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    const cleaned = newIpInput.trim();
    if (securityProtocols.whitelistedIps.includes(cleaned)) {
      showToast("IP address is already in whitelist");
      return;
    }
    updateSecurityProtocols({
      whitelistedIps: [...securityProtocols.whitelistedIps, cleaned],
    });
    setNewIpInput("");
    showToast(`IP ${cleaned} added to whitelist.`);
  };

  const handleRemoveIp = (ipToRemove: string) => {
    updateSecurityProtocols({
      whitelistedIps: securityProtocols.whitelistedIps.filter((ip) => ip !== ipToRemove),
    });
    showToast(`IP ${ipToRemove} removed.`);
  };

  // State for Add Compliance Modal
  const [isAddComplianceOpen, setIsAddComplianceOpen] = useState(false);
  const [newCompliance, setNewCompliance] = useState({
    name: "",
    category: "GST" as ComplianceCategory,
    frequency: "Monthly" as ComplianceItem["frequency"],
    statutoryDueDate: "2026-10-20",
    durationDays: 7,
    taxAmount: 0,
    sectionOrAct: "",
    assignedTo: defaultTeamAssignee,
    assignedToRole: "Client Accounts Manager",
    subtasks: [
      {
        subtaskNumber: 1 as const,
        title: "Data Preparation & Reconciliation",
        stageName: "Team Draft",
        assignedTo: defaultTeamAssignee,
        assignedRole: "Client Accounts Manager",
        durationDays: 3,
        deadline: "2026-10-16",
      },
      {
        subtaskNumber: 2 as const,
        title: "Review & Sign-off by CFO",
        stageName: "CFO Review",
        assignedTo: defaultCfoName,
        assignedRole: "Virtual CFO Lead",
        durationDays: 2,
        deadline: "2026-10-18",
      },
      {
        subtaskNumber: 3 as const,
        title: "Portal Challan Payment & Return Filing",
        stageName: "Filing & Payment",
        assignedTo: defaultTeamAssignee,
        assignedRole: "Tax Consultant",
        durationDays: 2,
        deadline: "2026-10-20",
      },
    ],
  });

  const handleCreateCompliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompliance.name.trim()) {
      showToast("Please enter compliance title");
      return;
    }
    const baseDueStr = newCompliance.statutoryDueDate || "2026-10-20";
    const baseDue = new Date(baseDueStr);
    const fmtDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const d1 = Number(newCompliance.subtasks[0]?.durationDays) || 3;
    const d2 = Number(newCompliance.subtasks[1]?.durationDays) || 2;
    const d3 = Number(newCompliance.subtasks[2]?.durationDays) || 2;

    const s3Due = new Date(baseDue);
    const s3Start = new Date(s3Due);
    s3Start.setDate(s3Start.getDate() - d3);
    const s2Due = new Date(s3Start);
    const s2Start = new Date(s2Due);
    s2Start.setDate(s2Start.getDate() - d2);
    const s1Due = new Date(s2Start);
    const s1Start = new Date(s1Due);
    s1Start.setDate(s1Start.getDate() - d1);

    addComplianceMasterItem({
      name: newCompliance.name.trim(),
      category: newCompliance.category as any,
      frequency: newCompliance.frequency,
      statutoryDueDate: baseDueStr,
      dueDate: baseDueStr,
      durationDays: Number(newCompliance.durationDays) || d1 + d2 + d3,
      taxAmount: Number(newCompliance.taxAmount) || 0,
      sectionOrAct: newCompliance.sectionOrAct.trim() || "Statutory Rule",
      applicableTo: "All Corporate Entities",
      formOrReturn: newCompliance.name.trim(),
      consequencesOfDelay: "Late fee & statutory default interest",
      penaltyClause: "Statutory penalties under applicable tax act",
      criticality: "High",
      period: "FY 2026-27",
      assignedTo: newCompliance.assignedTo.trim() || defaultTeamAssignee,
      assignedToRole: newCompliance.assignedToRole.trim() || "Client Accounts Manager",
      subtasks: [
        {
          id: `st-1-${Date.now()}`,
          subtaskNumber: 1,
          title: newCompliance.subtasks[0].title || "Data Preparation & Reconciliation",
          stageName: "Team Draft",
          assignedTo: newCompliance.subtasks[0].assignedTo,
          assignedRole: newCompliance.subtasks[0].assignedRole,
          durationDays: d1,
          startDate: fmtDate(s1Start),
          dueDate: newCompliance.subtasks[0].deadline || fmtDate(s1Due),
          deadline: newCompliance.subtasks[0].deadline || fmtDate(s1Due),
        },
        {
          id: `st-2-${Date.now()}`,
          subtaskNumber: 2,
          title: newCompliance.subtasks[1].title || "Review & Sign-off by CFO",
          stageName: "CFO Review",
          assignedTo: newCompliance.subtasks[1].assignedTo,
          assignedRole: newCompliance.subtasks[1].assignedRole,
          durationDays: d2,
          startDate: fmtDate(s2Start),
          dueDate: newCompliance.subtasks[1].deadline || fmtDate(s2Due),
          deadline: newCompliance.subtasks[1].deadline || fmtDate(s2Due),
        },
        {
          id: `st-3-${Date.now()}`,
          subtaskNumber: 3,
          title: newCompliance.subtasks[2].title || "Portal Challan Payment & Return Filing",
          stageName: "Filing & Payment",
          assignedTo: newCompliance.subtasks[2].assignedTo,
          assignedRole: newCompliance.subtasks[2].assignedRole,
          durationDays: d3,
          startDate: fmtDate(s3Start),
          dueDate: newCompliance.subtasks[2].deadline || fmtDate(s3Due),
          deadline: newCompliance.subtasks[2].deadline || fmtDate(s3Due),
        },
      ],
    });
    setIsAddComplianceOpen(false);
    setNewCompliance({
      name: "",
      category: "GST",
      frequency: "Monthly",
      statutoryDueDate: "2026-10-20",
      durationDays: 7,
      taxAmount: 0,
      sectionOrAct: "",
      assignedTo: defaultTeamAssignee,
      assignedToRole: "Client Accounts Manager",
      subtasks: [
        {
          subtaskNumber: 1,
          title: "Data Preparation & Reconciliation",
          stageName: "Team Draft",
          assignedTo: defaultTeamAssignee,
          assignedRole: "Client Accounts Manager",
          durationDays: 3,
          deadline: "2026-10-16",
        },
        {
          subtaskNumber: 2,
          title: "Review & Sign-off by CFO",
          stageName: "CFO Review",
          assignedTo: defaultCfoName,
          assignedRole: "Virtual CFO Lead",
          durationDays: 2,
          deadline: "2026-10-18",
        },
        {
          subtaskNumber: 3,
          title: "Portal Challan Payment & Return Filing",
          stageName: "Filing & Payment",
          assignedTo: defaultTeamAssignee,
          assignedRole: "Tax Consultant",
          durationDays: 2,
          deadline: "2026-10-20",
        },
      ],
    });
    showToast(
      "Statutory compliance item added with person assignments, subtask durations & dates.",
    );
  };

  // State for Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: Role;
    companyId: string;
    title: string;
    permissionPreset: UserPermissionPreset;
    permissions: UserModulePermissions;
  }>({
    name: "",
    email: "",
    role: "client_team" as Role,
    companyId: activeCompanyId || "client-101",
    title: "",
    permissionPreset: "full_edit_upload",
    permissions: buildPermissionsFromPreset("full_edit_upload", "client_team"),
  });

  // State for Specific Client Team Person Permission Matrix in RBAC tab
  const [selectedRbacTeamUserId, setSelectedRbacTeamUserId] = useState<string>("ROLE_DEFAULT");
  const [rbacEntityFilter, setRbacEntityFilter] = useState<string>("ALL");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      showToast("Please fill in name and email");
      return;
    }
    const assignedCompany = companies.find((c) => c.id === newUser.companyId);
    addUserAccount({
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      roleTitle:
        newUser.title.trim() || (newUser.role === "cfo" ? "Virtual CFO" : "Finance Executive"),
      companyId: newUser.companyId,
      companyName: assignedCompany ? assignedCompany.companyName : "All Companies",
      avatar: newUser.name.trim().charAt(0).toUpperCase(),
      permissionPreset: newUser.permissionPreset,
      permissions: newUser.permissions,
    });
    setIsAddUserOpen(false);
    setNewUser({
      name: "",
      email: "",
      role: "client_team",
      companyId: activeCompanyId || "client-101",
      title: "",
      permissionPreset: "full_edit_upload",
      permissions: buildPermissionsFromPreset("full_edit_upload", "client_team"),
    });
    showToast(`User account for ${newUser.name} created with individualized permissions.`);
  };

  // State for Audit Logs Tab
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("ALL");

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilter !== "ALL" && log.action !== auditFilter) return false;
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        return (
          log.details.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  const exportAuditLogsCsv = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Details", "IP Address", "Status"];
    const rows = filteredAuditLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.userName}"`,
      `"${log.role}"`,
      `"${log.action}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.ipAddress || ""}"`,
      `"${log.status}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Audit logs exported to CSV.");
  };

  // Filtered Compliances for Admin (includes hidden when showHiddenInTabs is true)
  const adminCompliancesSource = showHiddenInTabs ? rawCompliances || compliances : compliances;
  const filteredCompliances = useMemo(() => {
    return adminCompliancesSource.filter((item) => {
      if (complianceCatFilter !== "ALL" && item.category !== complianceCatFilter) return false;
      if (complianceCriticalityFilter !== "ALL" && item.criticality !== complianceCriticalityFilter)
        return false;
      if (complianceAssigneeFilter !== "ALL") {
        const matchesOwner = item.assignedTo === complianceAssigneeFilter;
        const matchesSubtask = (item.subtasks || []).some(
          (st) => st.assignedTo === complianceAssigneeFilter,
        );
        if (!matchesOwner && !matchesSubtask) return false;
      }
      if (complianceSearch.trim()) {
        const q = complianceSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.sectionOrAct && item.sectionOrAct.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.assignedTo && item.assignedTo.toLowerCase().includes(q)) ||
          (item.subtasks || []).some(
            (st) => st.assignedTo && st.assignedTo.toLowerCase().includes(q),
          )
        );
      }
      return true;
    });
  }, [
    adminCompliancesSource,
    complianceCatFilter,
    complianceCriticalityFilter,
    complianceAssigneeFilter,
    complianceSearch,
  ]);

  // Bulk Statutory Extension Handler
  const handleApplyBulkExtension = () => {
    const targets = compliances.filter(
      (c) => bulkExtensionCat === "ALL" || c.category === bulkExtensionCat,
    );
    let count = 0;
    targets.forEach((c) => {
      if (c.statutoryDueDate) {
        const d = new Date(c.statutoryDueDate);
        d.setDate(d.getDate() + Number(bulkExtensionDays));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const newDueDate = `${yyyy}-${mm}-${dd}`;
        updateCompliance({
          ...c,
          statutoryDueDate: newDueDate,
          dueDates: [newDueDate, ...(c.dueDates || []).slice(1)],
        });
        count++;
      }
    });

    if (addAuditLog) {
      addAuditLog(
        "STATUTORY_TIMELINE_EXTENDED",
        `CBDT/CBIC Extension: ${bulkExtensionDays} days added to ${count} ${bulkExtensionCat} statutory compliances ref [${bulkExtensionRef}].`,
        "warning",
      );
    }
    showToast(
      `Statutory timeline extended for ${count} compliances by +${bulkExtensionDays} days.`,
    );
    setIsBulkExtensionOpen(false);
  };

  // Filtered Actions for Admin (includes hidden when showHiddenInTabs is true)
  const adminActionsSource = showHiddenInTabs ? rawActions || actions : actions;
  const filteredActions = useMemo(() => {
    return (adminActionsSource || []).filter((act) => {
      if (actionPriorityFilter !== "ALL" && act.priority !== actionPriorityFilter) return false;
      if (actionStatusFilter !== "ALL" && act.status !== actionStatusFilter) return false;
      if (actionSearch.trim()) {
        const q = actionSearch.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.assignedTo.toLowerCase().includes(q) ||
          act.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adminActionsSource, actionPriorityFilter, actionStatusFilter, actionSearch]);

  // Quick Action Deadline Extension
  const handleQuickExtendAction = (actionItem: ActionItem, days: number) => {
    const base = actionItem.fixedDeadline ? new Date(actionItem.fixedDeadline) : new Date();
    base.setDate(base.getDate() + days);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    const newDeadline = `${yyyy}-${mm}-${dd}`;
    const updated: ActionItem = {
      ...actionItem,
      fixedDeadline: newDeadline,
      durationDays: (actionItem.durationDays || 7) + days,
    };
    updateAction(updated);
    if (addAuditLog) {
      addAuditLog(
        "ACTION_DEADLINE_EXTENDED",
        `Admin extended deadline of "${actionItem.title}" by +${days} days to ${newDeadline}.`,
        "info",
      );
    }
    showToast(`Extended "${actionItem.title}" deadline by +${days} days.`);
  };

  // Save Compliance Edit
  const handleSaveComplianceEdit = (updated: ComplianceItem) => {
    updateCompliance(updated);
    if (addAuditLog) {
      addAuditLog(
        "COMPLIANCE_TASK_MODIFIED",
        `Admin modified compliance "${updated.name}" (Due: ${updated.statutoryDueDate}, Tax: ₹${updated.taxAmount || 0}).`,
        "info",
      );
    }
    showToast(`Compliance task & timeline updated: "${updated.name}"`);
  };

  // Save Action Edit
  const handleSaveActionEdit = (updated: ActionItem) => {
    updateAction(updated);
    if (addAuditLog) {
      addAuditLog(
        "ACTION_TASK_MODIFIED",
        `Admin modified action task "${updated.title}" (Status: ${updated.status}, Deadline: ${updated.fixedDeadline}).`,
        "info",
      );
    }
    showToast(`Action task & timeline updated: "${updated.title}"`);
  };

  // Handle Add Company Submit
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.companyName.trim()) {
      showToast("Please enter a company name");
      return;
    }
    addCompany({
      companyName: newCompany.companyName.trim(),
      legalEntity: newCompany.legalEntity,
      sector: newCompany.sector,
      gstin: newCompany.gstin.trim() || "29AAAAA0000A1Z5",
      pan: newCompany.pan.trim() || "AAAAA0000A",
      cin: newCompany.cin.trim() || "U72200KA2021PTC123456",
      assignedCfo: newCompany.assignedCfo,
      incorporationYear: Number(newCompany.incorporationYear),
      city: newCompany.city,
      turnoverBracket: newCompany.turnoverBracket,
      financialYear: newCompany.financialYear,
    });
    setIsAddCompanyOpen(false);
    setNewCompany({
      companyName: "",
      legalEntity: "Private Limited",
      sector: "Technology & SaaS",
      gstin: "",
      pan: "",
      cin: "",
      assignedCfo: defaultCfoName,
      incorporationYear: 2021,
      city: "Bengaluru",
      turnoverBracket: "₹10 Cr - ₹25 Cr",
      financialYear: "FY 2026-27",
    });
  };

  const modules: Array<{
    key: "mis" | "budget" | "compliances" | "actions" | "companies";
    label: string;
    description: string;
  }> = [
    {
      key: "mis",
      label: "Financial MIS & Statements",
      description: "Balance Sheet, P&L Statement, Debtor Ageing, and Broad Picture",
    },
    {
      key: "budget",
      label: "Monthly Budget & Variances",
      description: "Budget allocation, Actual expenses, and variance monitoring",
    },
    {
      key: "compliances",
      label: "Statutory Compliances Master",
      description: "GST, TDS, ROC, Advance Tax, and 3-step filing workflow",
    },
    {
      key: "actions",
      label: "Action Items & Pendencies",
      description: "Working capital actions, vendor reconciliation, and audit tasks",
    },
    {
      key: "companies",
      label: "Company Profiles & Master Data",
      description: "Legal entity info, GSTIN, PAN, and corporate configuration",
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Embedded Banner when rendered directly inside CFO Dashboard */}
      {embedded && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>CFO Dashboard Embedded Admin & Governance Console</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Direct Cockpit Access
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Admin control for security protocols, user permissions, compliance timelines, and
                action task execution.
              </p>
            </div>
          </div>
          {onCloseEmbedded && (
            <button
              onClick={onCloseEmbedded}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to CFO Radar</span>
            </button>
          )}
        </div>
      )}

      {/* Super-Admin Header & CFO Operating Mode Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Governance &amp; Admin Console
            </h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {currentUser.name} ({currentUser.role.toUpperCase()})
            </span>
          </div>

          {/* CFO Super-Admin Mode Switcher */}
          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 shrink-0">
            <div>
              <div className="text-xs font-semibold text-white">Super-Admin Governance</div>
              <div className="text-[11px] text-slate-400">
                {isCfoAdmin ? "Full control enabled" : "Standard controller mode"}
              </div>
            </div>
            <button
              onClick={() => {
                const next = !isCfoAdmin;
                setIsCfoAdmin(next);
                if (addAuditLog) {
                  addAuditLog(
                    "SECURITY_PROTOCOL_CHANGED",
                    `CFO toggled Super-Admin mode to ${next ? "ACTIVE" : "INACTIVE"}`,
                    "warning",
                  );
                }
                showToast(`CFO Super-Admin mode is now ${next ? "ENABLED" : "DISABLED"}`);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isCfoAdmin ? "bg-amber-500" : "bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isCfoAdmin ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Governance Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Managed Entities</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {companies.length} Active
            </div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Statutory Compliances</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {compliances.length} Filings
            </div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Active Action Tasks</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {(actions || []).length} Actions
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("visibility")}
            className="bg-amber-500/10 hover:bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 text-left transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              <span>Hidden Vault</span>
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {hiddenItemsRegistry.length} Hidden
            </div>
          </button>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Access Control</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1 truncate">
              RBAC Enforced
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          {
            key: "visibility",
            label: `Visibility & Hidden Vault (${hiddenItemsRegistry.length})`,
            icon: EyeOff,
          },
          { key: "permissions", label: "Viewing & Editing Rights (RBAC)", icon: Sliders },
          { key: "security", label: "Security & Governance", icon: ShieldCheck },
          {
            key: "compliances",
            label: `Compliance Tasks & Timelines (${compliances.length})`,
            icon: FileCheck,
          },
          {
            key: "actions",
            label: `Action Tasks & Deadlines (${(actions || []).length})`,
            icon: CheckSquare,
          },
          {
            key: "companies",
            label: `Entity Setup & Profiles (${companies.length})`,
            icon: Building2,
          },
          {
            key: "users",
            label: `User Directory (${userAccounts.length})`,
            icon: Users,
          },
          {
            key: "audit",
            label: "Audit Trail",
            icon: Clock,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VIEWING & EDITING RIGHTS MATRIX (RBAC & SPECIFIC PERSON CONTROL)   */}
      {/* ========================================================================= */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* SECTION A: SPECIFIC CLIENT TEAM PERSON VIEWING, EDITING & UPLOAD RIGHTS */}
          <div className="bg-white rounded-2xl border-2 border-sky-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">
                      Client Team — Specific Person Viewing, Editing &amp; Excel Upload Rights
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Individual Person Control (
                      {userAccounts.filter((u) => u.role === "client_team").length} Team Members)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign viewing, drafting/editing, Excel upload, and deletion rights to each
                    specific person in the Client Finance Team individually rather than treating the
                    Client Team as a single generic persona.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={rbacEntityFilter}
                  onChange={(e) => setRbacEntityFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option value="ALL">
                    All Client Entities (
                    {userAccounts.filter((u) => u.role === "client_team").length} Persons)
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} (
                      {
                        userAccounts.filter(
                          (u) =>
                            u.role === "client_team" &&
                            (u.companyId === c.id || (u.assignedCompanyIds || []).includes(c.id)),
                        ).length
                      }
                      )
                    </option>
                  ))}
                </select>



                <button
                  type="button"
                  onClick={() => {
                    setNewUser({
                      name: "",
                      email: "",
                      role: "client_team",
                      companyId:
                        rbacEntityFilter !== "ALL"
                          ? rbacEntityFilter
                          : activeCompanyId || "client-101",
                      title: "Senior Accounts Executive",
                      permissionPreset: "full_edit_upload",
                      permissions: buildPermissionsFromPreset("full_edit_upload", "client_team"),
                    });
                    setIsAddUserOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Client Team Person</span>
                </button>
              </div>
            </div>

            {/* Per-Person Permission Matrix Cards */}
            <div className="space-y-4">
              {userAccounts
                .filter((u) => {
                  if (u.role !== "client_team") return false;
                  if (
                    rbacEntityFilter !== "ALL" &&
                    u.companyId !== rbacEntityFilter &&
                    !(u.assignedCompanyIds || []).includes(rbacEntityFilter)
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((person) => {
                  const personPerms = getUserPermissions(person.id);
                  const assignedComp = companies.find((c) => c.id === person.companyId);
                  const presetKey = person.permissionPreset || "custom";
                  const presetMeta =
                    USER_PERMISSION_PRESET_LABELS[presetKey] ||
                    USER_PERMISSION_PRESET_LABELS.custom;
                  const isActivePerson = currentUser.id === person.id;

                  return (
                    <div
                      key={person.id}
                      className={`rounded-xl border p-4 transition-all space-y-3.5 ${
                        isActivePerson
                          ? "bg-sky-50/40 border-sky-400 ring-2 ring-sky-500/15"
                          : "bg-slate-50/60 border-slate-200 hover:border-sky-300"
                      }`}
                    >
                      {/* Top bar: Person Identity + Quick Presets + Switch/Edit Actions */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {person.avatar || person.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900">{person.name}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                {person.roleTitle || "Client Finance Team"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {assignedComp?.companyName ||
                                  person.companyName ||
                                  "Assigned Entity"}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Access Mode: {presetMeta.label}
                              </span>
                              {isActivePerson && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-amber-300">
                                  Active Session User
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {person.email} {person.phone ? `• ${person.phone}` : ""} —{" "}
                              {presetMeta.description}
                            </p>
                          </div>
                        </div>

                        {/* Quick Role Presets & Actions for this specific person */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Quick Preset:
                          </span>
                          {(
                            [
                              { key: "full_edit_upload", label: "Full Edit & Excel" },
                              { key: "edit_no_upload", label: "Edit Only" },
                              { key: "compliance_only", label: "Compliance Only" },
                              { key: "mis_and_budget_only", label: "MIS & Budget Only" },
                              { key: "view_only", label: "View Only" },
                            ] as Array<{ key: UserPermissionPreset; label: string }>
                          ).map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => applyUserPermissionPreset(person.id, preset.key)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                person.permissionPreset === preset.key
                                  ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setEditingUser(person)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1 ml-1"
                            title={`Open full profile & permissions modal for ${person.name}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Rights</span>
                          </button>
                        </div>
                      </div>

                      {/* 5-Module Specific Person Checkboxes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {PERMISSION_MODULES_META.map((mod) => {
                          const mPerm = personPerms[mod.key];
                          return (
                            <div
                              key={mod.key}
                              className={`rounded-xl border p-3 space-y-2 transition-colors ${
                                mPerm.canView
                                  ? "bg-white border-slate-200"
                                  : "bg-slate-100/70 border-slate-200 opacity-75"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                                <span className="text-[11px] font-bold text-slate-900 truncate">
                                  {mod.shortLabel}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    mPerm.canEdit && mPerm.canUploadExcel
                                      ? "bg-emerald-100 text-emerald-800"
                                      : mPerm.canEdit
                                        ? "bg-sky-100 text-sky-800"
                                        : mPerm.canView
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {mPerm.canEdit && mPerm.canUploadExcel
                                    ? "Edit + Excel"
                                    : mPerm.canEdit
                                      ? "View + Edit"
                                      : mPerm.canView
                                        ? "View Only"
                                        : "No Access"}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-[11px]">
                                <label className="flex items-center justify-between cursor-pointer hover:text-sky-700">
                                  <span className="text-slate-600 font-medium">Can View</span>
                                  <input
                                    type="checkbox"
                                    checked={mPerm.canView}
                                    onChange={(e) =>
                                      updateUserPermission(
                                        person.id,
                                        mod.key,
                                        "canView",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer hover:text-sky-700">
                                  <span className="text-slate-600 font-medium">
                                    Can Edit / Draft
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={mPerm.canEdit}
                                    onChange={(e) =>
                                      updateUserPermission(
                                        person.id,
                                        mod.key,
                                        "canEdit",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer hover:text-sky-700">
                                  <span className="text-slate-600 font-medium">Upload Excel</span>
                                  <input
                                    type="checkbox"
                                    checked={mPerm.canUploadExcel}
                                    onChange={(e) =>
                                      updateUserPermission(
                                        person.id,
                                        mod.key,
                                        "canUploadExcel",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer hover:text-sky-700">
                                  <span className="text-slate-600 font-medium">Can Delete</span>
                                  <input
                                    type="checkbox"
                                    checked={mPerm.canDelete}
                                    onChange={(e) =>
                                      updateUserPermission(
                                        person.id,
                                        mod.key,
                                        "canDelete",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SECTION B: ROLE-BASED BASELINE MATRIX (WITH PERSON SELECTOR IN CLIENT TEAM COLUMN) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Role-Based Viewing &amp; Editing Rights Matrix (With Specific Person Override)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure baseline permissions by role, or select a specific Client Team member in
                  the middle column to calibrate their personal rights side-by-side.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (selectedRbacTeamUserId !== "ROLE_DEFAULT") {
                      updateUserPermission(selectedRbacTeamUserId, "mis", "canUploadExcel", true);
                      updateUserPermission(
                        selectedRbacTeamUserId,
                        "budget",
                        "canUploadExcel",
                        true,
                      );
                      const u = userAccounts.find((x) => x.id === selectedRbacTeamUserId);
                      showToast(
                        `Enabled Excel upload for ${u?.name || "selected person"} across MIS & Budget`,
                      );
                    } else {
                      updateRolePermission("client_team", "mis", "canUploadExcel", true);
                      updateRolePermission("client_team", "budget", "canUploadExcel", true);
                      showToast(
                        "Enabled Excel upload facility for Client Team role baseline across MIS & Budget",
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  Enable Excel Upload (
                  {selectedRbacTeamUserId === "ROLE_DEFAULT"
                    ? "Client Team Baseline"
                    : userAccounts.find((u) => u.id === selectedRbacTeamUserId)?.name || "Person"}
                  )
                </button>
                <button
                  onClick={() => {
                    updateRolePermission("client", "mis", "canEdit", false);
                    updateRolePermission("client", "budget", "canEdit", false);
                    showToast("Enforced strict read-only policy for Client Executives");
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Strict Read-Only Client
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-1/4">System Module</th>
                    <th className="py-3 px-4 text-center">Virtual CFO (Controller)</th>
                    <th className="py-3 px-4 text-center bg-sky-50/60">
                      <div className="space-y-1.5">
                        <div className="text-sky-950 font-bold">
                          Client Finance Team (Person / Baseline)
                        </div>
                        <select
                          value={selectedRbacTeamUserId}
                          onChange={(e) => setSelectedRbacTeamUserId(e.target.value)}
                          className="w-full max-w-[260px] mx-auto px-2.5 py-1 rounded-lg border border-sky-300 bg-white text-[11px] font-bold text-sky-900 shadow-2xs cursor-pointer"
                        >
                          <option value="ROLE_DEFAULT">
                            👥 All Client Team (Role Default Baseline)
                          </option>
                          <optgroup label="Specific Client Team Persons">
                            {userAccounts
                              .filter((u) => u.role === "client_team")
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  👤 {u.name} — {u.roleTitle} ({u.companyName || "Entity"})
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Client Executive / Director</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((mod) => {
                    const cfoPerms = rolePermissions.cfo[mod.key];
                    const selectedPersonPerms =
                      selectedRbacTeamUserId === "ROLE_DEFAULT"
                        ? rolePermissions.client_team[mod.key]
                        : getUserPermissions(selectedRbacTeamUserId)[mod.key];
                    const clientPerms = rolePermissions.client[mod.key];

                    const handleToggleClientTeamCol = (
                      field: keyof ModulePermission,
                      val: boolean,
                    ) => {
                      if (selectedRbacTeamUserId === "ROLE_DEFAULT") {
                        updateRolePermission("client_team", mod.key, field, val);
                      } else {
                        updateUserPermission(selectedRbacTeamUserId, mod.key, field, val);
                      }
                    };

                    return (
                      <tr key={mod.key} className="hover:bg-slate-50/60 transition-colors">
                        {/* Module Info */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900 text-sm">{mod.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {mod.description}
                          </div>
                        </td>

                        {/* CFO Permissions Column */}
                        <td className="py-4 px-4 align-top bg-amber-50/30">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/80 border border-amber-200/60">
                              <span className="text-slate-700">View Module</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Always Yes
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/80 border border-amber-200/60">
                              <span className="text-slate-700">Edit & Update</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Always Yes
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/80 border border-amber-200/60">
                              <span className="text-slate-700">Excel Upload</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Always Yes
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/80 border border-amber-200/60">
                              <span className="text-slate-700">Sign-Off & Approve</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Always Yes
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Client Team (Specific Person or Baseline) Column */}
                        <td className="py-4 px-4 align-top bg-sky-50/20">
                          <div className="space-y-2">
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-sky-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can View</span>
                              <input
                                type="checkbox"
                                checked={selectedPersonPerms.canView}
                                onChange={(e) =>
                                  handleToggleClientTeamCol("canView", e.target.checked)
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-sky-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can Edit / Draft</span>
                              <input
                                type="checkbox"
                                checked={selectedPersonPerms.canEdit}
                                onChange={(e) =>
                                  handleToggleClientTeamCol("canEdit", e.target.checked)
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-sky-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Upload Excel</span>
                              <input
                                type="checkbox"
                                checked={selectedPersonPerms.canUploadExcel}
                                onChange={(e) =>
                                  handleToggleClientTeamCol("canUploadExcel", e.target.checked)
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-sky-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can Delete</span>
                              <input
                                type="checkbox"
                                checked={selectedPersonPerms.canDelete}
                                onChange={(e) =>
                                  handleToggleClientTeamCol("canDelete", e.target.checked)
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </label>
                          </div>
                        </td>

                        {/* Client Executive Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-2">
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can View</span>
                              <input
                                type="checkbox"
                                checked={clientPerms.canView}
                                onChange={(e) =>
                                  updateRolePermission(
                                    "client",
                                    mod.key,
                                    "canView",
                                    e.target.checked,
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can Edit</span>
                              <input
                                type="checkbox"
                                checked={clientPerms.canEdit}
                                onChange={(e) =>
                                  updateRolePermission(
                                    "client",
                                    mod.key,
                                    "canEdit",
                                    e.target.checked,
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Upload Excel</span>
                              <input
                                type="checkbox"
                                checked={clientPerms.canUploadExcel}
                                onChange={(e) =>
                                  updateRolePermission(
                                    "client",
                                    mod.key,
                                    "canUploadExcel",
                                    e.target.checked,
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </label>
                            <label className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer">
                              <span className="text-slate-700 font-medium">Can Delete</span>
                              <input
                                type="checkbox"
                                checked={clientPerms.canDelete}
                                onChange={(e) =>
                                  updateRolePermission(
                                    "client",
                                    mod.key,
                                    "canDelete",
                                    e.target.checked,
                                  )
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY PROTOCOLS & DATA ISOLATION */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Security Protocols & Governance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure tenant isolation, session thresholds, IP bounds, and historical period
                lockouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Protocol 1: Historical Closed Period Lockdown */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Historical Financial Period Lockdown
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Prevent any modifications to audited and finalized periods
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityProtocols.lockClosedPeriod}
                    onChange={(e) =>
                      updateSecurityProtocols({ lockClosedPeriod: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                {securityProtocols.lockClosedPeriod && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Locked Period Label
                    </label>
                    <input
                      type="text"
                      value={securityProtocols.lockedPeriodName}
                      onChange={(e) =>
                        updateSecurityProtocols({ lockedPeriodName: e.target.value })
                      }
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g. July 2026 (Audited)"
                    />
                  </div>
                )}
              </div>

              {/* Protocol 2: Client Single-Company Isolation */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Strict Single-Company Client Isolation
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Client roles cannot switch or view peer client workspaces
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityProtocols.clientSingleCompanyIsolation}
                    onChange={(e) =>
                      updateSecurityProtocols({
                        clientSingleCompanyIsolation: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/70">
                  Status: <span className="font-semibold text-emerald-700">Enforced</span>{" "}
                  (Cross-tenant leaks blocked via router isolation)
                </div>
              </div>

              {/* Protocol 3: MFA / 2FA Enforcement */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Multi-Factor Authentication (MFA / 2FA)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Require TOTP code or mobile push on user sign-in
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityProtocols.mfaEnforced}
                    onChange={(e) => updateSecurityProtocols({ mfaEnforced: e.target.checked })}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  {securityProtocols.mfaEnforced
                    ? "Mandatory for all CFO and Client accounts."
                    : "Optional (Password / SSO authentication active)."}
                </div>
              </div>

              {/* Protocol 4: Session Inactivity Timeout */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Session Inactivity Timeout
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Automatically lock workspace on idle timeout
                      </div>
                    </div>
                  </div>
                  <select
                    value={securityProtocols.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateSecurityProtocols({ sessionTimeoutMinutes: Number(e.target.value) })
                    }
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={240}>4 Hours</option>
                    <option value={480}>8 Hours</option>
                  </select>
                </div>
                <div className="text-[11px] text-slate-500">
                  Current policy: Auto-expire sessions after{" "}
                  {securityProtocols.sessionTimeoutMinutes} minutes of inactivity.
                </div>
              </div>

              {/* Protocol 5: Data Watermarking on Exports */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Confidential Watermarking on Exports
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Stamp user email and timestamp onto exported reports
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityProtocols.watermarkExports}
                    onChange={(e) =>
                      updateSecurityProtocols({ watermarkExports: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Protocol 6: Approval Required for Bulk Data Exports */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        CFO Approval for Ledger Downloads
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Client team downloads must receive CFO electronic sign-off
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityProtocols.requireApprovalForExport}
                    onChange={(e) =>
                      updateSecurityProtocols({
                        requireApprovalForExport: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* IP Whitelisting Section */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    IP Whitelisting & Network Perimeter
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Restrict workspace administrative operations to approved corporate IP subnets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Enforce IP Filter:</span>
                  <input
                    type="checkbox"
                    checked={securityProtocols.ipWhitelistingEnabled}
                    onChange={(e) =>
                      updateSecurityProtocols({ ipWhitelistingEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  placeholder="e.g. 103.21.244.0/24 or 192.168.1.50"
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300 flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddIp}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add IP</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {securityProtocols.whitelistedIps.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    <span>{ip}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(ip)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPANY ENTITIES (ADD, EDIT, DELETE) */}
      {/* ========================================================================= */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">
                    Client Company Master ({companies.length} Active
                    {rawCompanies.filter((c) => c.isHidden).length > 0
                      ? ` • ${rawCompanies.filter((c) => c.isHidden).length} Hidden`
                      : ""}
                    )
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  CFO controllership view for all onboarded corporate entities. Hide dormant
                  entities without deleting historical data, or unhide anytime.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHiddenInTabs(!showHiddenInTabs)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showHiddenInTabs
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {showHiddenInTabs ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showHiddenInTabs ? "Showing Hidden Entities" : "Show Hidden Entities"} (
                    {rawCompanies.filter((c) => c.isHidden).length})
                  </span>
                </button>
                <button
                  onClick={() => setIsAddCompanyOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Client Company</span>
                </button>
              </div>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {(showHiddenInTabs ? rawCompanies : companies).map((comp) => {
                const entityUsers = userAccounts.filter(
                  (u) => u.companyId === comp.id || (u.assignedCompanyIds || []).includes(comp.id),
                );
                const teamMembers = entityUsers.filter((u) => u.role === "client_team");
                const directors = entityUsers.filter((u) => u.role === "client");
                return (
                  <div
                    key={comp.id}
                    className={`rounded-xl border p-5 space-y-4 transition-colors flex flex-col justify-between ${
                      comp.isHidden
                        ? "bg-amber-50/40 border-amber-300/80 opacity-85"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {comp.legalEntity}
                            </span>
                            {comp.isHidden && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <EyeOff className="w-2.5 h-2.5" />
                                HIDDEN
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                            {comp.companyName}
                          </h3>
                          <p className="text-[11px] text-slate-500">{comp.sector}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleItemVisibility("company", comp.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                              comp.isHidden
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                            }`}
                            title={
                              comp.isHidden
                                ? "Unhide Entity (Restore to active views)"
                                : "Hide Entity (Keep data without deleting)"
                            }
                          >
                            {comp.isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Unhide</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany(comp);
                              setEditingCompanySubTab("benchmarks");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition-colors cursor-pointer flex items-center gap-1"
                            title="Configure Financial Ratio Benchmarks for this Entity"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Benchmarks</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany(comp);
                              setEditingCompanySubTab("details");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Entity Profile & Team Members"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {rawCompanies.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: "company",
                                  id: comp.id,
                                  name: comp.companyName,
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Company"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] pt-3 border-t border-slate-200/70 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">GSTIN:</span>
                          <span className="text-slate-800 font-semibold">{comp.gstin || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">PAN:</span>
                          <span className="text-slate-800 font-semibold">{comp.pan || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">CIN:</span>
                          <span className="text-slate-800 font-semibold">{comp.cin || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">City / Bracket:</span>
                          <span className="text-slate-800 font-sans">
                            {comp.city || "Bengaluru"}{" "}
                            {comp.turnoverBracket ? `• ${comp.turnoverBracket}` : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Assigned CFO:</span>
                          <span className="text-slate-800 font-sans font-medium">
                            {comp.assignedCfo || comp.cfoName || defaultCfoName}
                          </span>
                        </div>
                      </div>

                      {/* Entity Client Team & Directors Preview */}
                      <div className="pt-3 border-t border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Client Team & Directors ({entityUsers.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany(comp);
                              setEditingCompanySubTab("team");
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Manage Team</span>
                          </button>
                        </div>

                        {entityUsers.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            No client team members assigned yet.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {[...directors, ...teamMembers].map((member) => {
                              const mPerms = getUserPermissions(member.id);
                              const presetLabel =
                                USER_PERMISSION_PRESET_LABELS[member.permissionPreset || "custom"]
                                  ?.label || "Custom Rights";
                              return (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800 truncate">
                                        {member.name}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                        {presetLabel}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                      {member.roleTitle || (member as any).title || "Finance Team"}{" "}
                                      • MIS:{" "}
                                      {mPerms.mis.canEdit
                                        ? mPerms.mis.canUploadExcel
                                          ? "Edit+Excel"
                                          : "Edit"
                                        : mPerms.mis.canView
                                          ? "View"
                                          : "Off"}{" "}
                                      • Comp: {mPerms.compliances.canEdit ? "Edit" : "View"}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingUser(member)}
                                    className="px-2 py-1 rounded text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                                    title={`Edit ${member.name}'s Specific Viewing & Editing Rights`}
                                  >
                                    <Sliders className="w-3 h-3" />
                                    <span>Rights</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCompany(comp);
                          setEditingCompanySubTab("details");
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-indigo-600" />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCompany(comp);
                          setEditingCompanySubTab("team");
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        <span>Team ({entityUsers.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCompany(comp);
                          setEditingCompanySubTab("benchmarks");
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Sliders className="w-3 h-3 text-emerald-600" />
                        <span>Benchmarks</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPLIANCE MASTER (ADD, EDIT, TIMELINES, BULK EXTENSION, DELETE) */}
      {/* ========================================================================= */}
      {activeTab === "compliances" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-white">
                      Statutory Compliance Tasks & Timelines Control
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {compliances.length} Managed Filings
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Control statutory due dates, tax liabilities, penalty clauses, and 3-stage
                    preparation/CFO review/filing workflows for {clientProfile?.companyName}.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHiddenInTabs(!showHiddenInTabs)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showHiddenInTabs
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {showHiddenInTabs ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showHiddenInTabs ? "Hidden Included" : "Show Hidden"} (
                    {(rawCompliances || []).filter((c) => c.isHidden).length})
                  </span>
                </button>
                <button
                  onClick={() => setIsBulkExtensionOpen(!isBulkExtensionOpen)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>
                    {isBulkExtensionOpen ? "Close Extension Panel" : "Statutory Due Date Extension"}
                  </span>
                </button>
                <button
                  onClick={() => setIsAddComplianceOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Compliance Task</span>
                </button>
              </div>
            </div>

            {/* Statutory Due Date Bulk Extension Helper Box */}
            {isBulkExtensionOpen && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Statutory Circular / Notification Bulk Due Date Extender</span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    (Applies official CBDT/CBIC gazette extensions across batch items)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Category
                    </label>
                    <select
                      value={bulkExtensionCat}
                      onChange={(e) => setBulkExtensionCat(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="GST">GST Only</option>
                      <option value="TDS / TCS">TDS / TCS Only</option>
                      <option value="Income Tax">Income Tax Only</option>
                      <option value="ROC / MCA">ROC / MCA Only</option>
                      <option value="PF / ESI">PF / ESI Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Timeline Push</label>
                    <select
                      value={bulkExtensionDays}
                      onChange={(e) => setBulkExtensionDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                    >
                      <option value={7}>+7 Days (Extension)</option>
                      <option value={15}>+15 Days (Notification)</option>
                      <option value={30}>+30 Days (Quarterly Shift)</option>
                      <option value={45}>+45 Days (Disaster/Special Relief)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Notification / Circular Ref
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bulkExtensionRef}
                        onChange={(e) => setBulkExtensionRef(e.target.value)}
                        placeholder="e.g. CBIC Notification No. 18/2026-Central Tax"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <button
                        onClick={handleApplyBulkExtension}
                        className="px-4 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Extension</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search compliance name, section, category..."
                  value={complianceSearch}
                  onChange={(e) => setComplianceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={complianceAssigneeFilter}
                  onChange={(e) => setComplianceAssigneeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Assigned Persons</option>
                  {assignableDirectory.map((person) => (
                    <option key={person.name} value={person.name}>
                      👤 {person.name}
                    </option>
                  ))}
                </select>

                <select
                  value={complianceCatFilter}
                  onChange={(e) => setComplianceCatFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="GST">GST</option>
                  <option value="TDS / TCS">TDS / TCS</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="ROC / MCA">ROC / MCA</option>
                  <option value="PF / ESI">PF / ESI</option>
                  <option value="Professional Tax & State">Professional Tax</option>
                </select>

                <select
                  value={complianceCriticalityFilter}
                  onChange={(e) => setComplianceCriticalityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Criticalities</option>
                  <option value="Critical">Critical (🔴)</option>
                  <option value="High">High (🟠)</option>
                  <option value="Medium">Medium (🟡)</option>
                  <option value="Low">Low (🟢)</option>
                </select>
              </div>
            </div>

            {/* Compliances Master Table */}
            <div className="overflow-x-auto bg-white text-slate-900 rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-3">Criticality & Category</th>
                    <th className="py-3 px-3">Compliance Title & Act</th>
                    <th className="py-3 px-3">Compliance Owner</th>
                    <th className="py-3 px-3">Statutory Due Date (Locked)</th>
                    <th className="py-3 px-3">Tax Liability</th>
                    <th className="py-3 px-3">Subtasks (Assigned Person &amp; Target Date)</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredCompliances.map((item) => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isOverdue = item.statutoryDueDate && item.statutoryDueDate < todayStr;
                    const currentOwner =
                      item.assignedTo || item.subtasks?.[0]?.assignedTo || defaultTeamAssignee;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors border-b border-black"
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.criticality === "Critical"
                                  ? "bg-rose-500"
                                  : item.criticality === "High"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                            />
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">{item.frequency}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                            {item.isHidden && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <EyeOff className="w-2.5 h-2.5" />
                                HIDDEN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.sectionOrAct || "Standard Statutory Rule"}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={currentOwner}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const found = assignableDirectory.find(
                                (p) => p.name === selectedName,
                              );
                              assignComplianceOwner(
                                item.id,
                                selectedName,
                                found?.roleTitle || "Client Finance Team",
                                false,
                              );
                            }}
                            className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 text-[11px] font-bold text-indigo-900 hover:bg-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[165px] truncate"
                            title="Assign Primary Compliance Owner"
                          >
                            {!assignableDirectory.some((p) => p.name === currentOwner) && (
                              <option value={currentOwner}>{currentOwner}</option>
                            )}
                            {assignableDirectory.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <div className="text-[10px] text-slate-500 truncate max-w-[165px] mt-0.5">
                            {item.assignedToRole || "Compliance Lead"}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-800 font-mono font-bold text-[11px]"
                              title="Statutory due date is fixed by law and cannot be edited manually"
                            >
                              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{item.statutoryDueDate || item.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                                Statutory Fixed
                              </span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {item.taxAmount ? `₹${(item.taxAmount / 100000).toFixed(2)}L` : "Nil"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 min-w-[250px]">
                            {item.subtasks?.map((st, idx) => {
                              const stNum = (st.subtaskNumber || idx + 1) as 1 | 2 | 3;
                              const stDateIso = toIsoDateString(
                                st.deadline || item.dueDate || item.statutoryDueDate,
                              );
                              return (
                                <div
                                  key={st.id || idx}
                                  className="flex items-center justify-between gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80"
                                >
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                                      st.status === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-white text-slate-700 border-slate-300"
                                    }`}
                                    title={st.title}
                                  >
                                    S{stNum}
                                  </span>
                                  <select
                                    value={st.assignedTo || "Unassigned"}
                                    onChange={(e) => {
                                      const sel = e.target.value;
                                      const found = assignableDirectory.find((p) => p.name === sel);
                                      updateComplianceSubtaskAssignment(item.id, stNum, {
                                        assignedTo: sel,
                                        assignedRole:
                                          found?.roleTitle || st.assignedRole || "Team Member",
                                      });
                                    }}
                                    className="text-[10px] font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none cursor-pointer truncate max-w-[115px]"
                                    title={`Subtask ${stNum}: ${st.title} — Assign Person`}
                                  >
                                    {!assignableDirectory.some((p) => p.name === st.assignedTo) && (
                                      <option value={st.assignedTo || "Unassigned"}>
                                        {st.assignedTo || "Unassigned"}
                                      </option>
                                    )}
                                    {assignableDirectory.map((p) => (
                                      <option key={p.name} value={p.name}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={stDateIso}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        updateComplianceSubtaskAssignment(item.id, stNum, {
                                          deadline: e.target.value,
                                        });
                                      }
                                    }}
                                    className="px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50/60 font-mono text-[10px] font-semibold text-indigo-950 w-[110px] shrink-0 cursor-pointer"
                                    title={`Subtask ${stNum} Target Date`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleItemVisibility("compliance", item.id)}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                                item.isHidden
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                              }`}
                              title={
                                item.isHidden
                                  ? "Unhide Compliance Item"
                                  : "Hide Compliance Item (No deletion)"
                              }
                            >
                              {item.isHidden ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Unhide</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCompliance(item)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit Compliance Task, Assignments & Subtask Durations"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Assign / Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({
                                  type: "compliance",
                                  id: item.id,
                                  name: item.name,
                                });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCompliances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No statutory compliances matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACTION TASKS & DEADLINES CONTROL (ADD, EDIT, TIMELINES, DELETE) */}
      {/* ========================================================================= */}
      {activeTab === "actions" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-white">
                      Action Tasks & Execution Deadlines Control
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {(actions || []).length} Total Actions
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Virtual CFO administrative control for setting fixed completion deadlines,
                    assignees, priorities, and extending project timelines.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowHiddenInTabs(!showHiddenInTabs)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showHiddenInTabs
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {showHiddenInTabs ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showHiddenInTabs ? "Hidden Included" : "Show Hidden"} (
                    {(rawActions || []).filter((a) => a.isHidden).length})
                  </span>
                </button>
                <button
                  onClick={() => setIsNewActionModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Action Task</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview Cards in Black Theme */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Overdue Deadlines</div>
                <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                  {
                    (actions || []).filter((a) => {
                      const today = new Date().toISOString().split("T")[0];
                      return a.status !== "Completed" && a.fixedDeadline && a.fixedDeadline < today;
                    }).length
                  }
                </div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Urgent Priority</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                  {(actions || []).filter((a) => a.priority === "Urgent").length}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">In Execution</div>
                <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                  {(actions || []).filter((a) => a.status === "In Progress").length}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Completed / Verified</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {(actions || []).filter((a) => a.status === "Completed").length}
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search task title, assignee, category..."
                  value={actionSearch}
                  onChange={(e) => setActionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={actionPriorityFilter}
                  onChange={(e) => setActionPriorityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>

                <select
                  value={actionStatusFilter}
                  onChange={(e) => setActionStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Actions Master Table */}
            <div className="overflow-x-auto bg-white text-slate-900 rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Action Task & Category</th>
                    <th className="py-3 px-3">Assigned Lead & Role</th>
                    <th className="py-3 px-3">Execution Deadline & Timeline</th>
                    <th className="py-3 px-3">Progress</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Timeline & Admin Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredActions.map((item) => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isOverdue =
                      item.status !== "Completed" &&
                      item.fixedDeadline &&
                      item.fixedDeadline < todayStr;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors border-b border-black"
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.priority === "Urgent"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : item.priority === "High"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">{item.title}</span>
                            {item.isHidden && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <EyeOff className="w-2.5 h-2.5" />
                                HIDDEN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.category}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{item.assignedTo}</div>
                          <div className="text-[10px] text-slate-500">{item.assignedRole}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {/* Option B: Particular Date Picker */}
                            <div
                              className="flex items-center gap-1"
                              title="Option 2: Fix Particular Completion Date"
                            >
                              <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                              <input
                                type="date"
                                value={toIsoDateString(item.fixedDeadline)}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  if (!newDate) return;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const target = new Date(newDate);
                                  const diffDays = !isNaN(target.getTime())
                                    ? Math.max(
                                        1,
                                        Math.round(
                                          (target.getTime() - today.getTime()) /
                                            (1000 * 60 * 60 * 24),
                                        ),
                                      )
                                    : item.durationDays || 7;
                                  updateAction({
                                    ...item,
                                    fixedDeadline: newDate,
                                    durationDays: diffDays,
                                  });
                                  showToast(
                                    `Action "${item.title}" deadline set to ${newDate} (${diffDays}d)`,
                                  );
                                }}
                                className="px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono font-bold text-[11px] text-slate-900 cursor-pointer"
                              />
                            </div>
                            {/* Option A: Fix Duration (Days) */}
                            <div
                              className="flex items-center gap-1"
                              title="Option 1: Fix Duration in Days from Today"
                            >
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={item.durationDays || 7}
                                onChange={(e) => {
                                  const d = Math.max(1, Math.min(365, Number(e.target.value) || 1));
                                  const target = new Date();
                                  target.setDate(target.getDate() + d);
                                  const iso = target.toISOString().split("T")[0];
                                  updateAction({
                                    ...item,
                                    durationDays: d,
                                    fixedDeadline: iso,
                                  });
                                }}
                                className="w-12 px-1 py-0.5 rounded border border-amber-300 bg-amber-50/70 font-mono font-bold text-[10.5px] text-amber-950 text-center"
                              />
                              <span className="text-[10px] font-semibold text-amber-900">Days</span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] font-mono text-slate-600 mb-0.5">
                              <span>{item.progressPercentage || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (item.progressPercentage || 0) === 100
                                    ? "bg-emerald-500"
                                    : (item.progressPercentage || 0) > 50
                                      ? "bg-indigo-500"
                                      : "bg-amber-500"
                                }`}
                                style={{ width: `${item.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "Completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "In Progress"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : item.status === "Under Review"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Extend Buttons */}
                            <div className="flex items-center gap-0.5 mr-1 bg-slate-100 p-0.5 rounded-lg">
                              <button
                                onClick={() => handleQuickExtendAction(item, 3)}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                                title="Extend deadline by 3 days"
                              >
                                +3d
                              </button>
                              <button
                                onClick={() => handleQuickExtendAction(item, 7)}
                                className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                                title="Extend deadline by 7 days"
                              >
                                +7d
                              </button>
                            </div>

                            {/* Hide / Unhide Action Button */}
                            <button
                              type="button"
                              onClick={() => toggleItemVisibility("action", item.id)}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                                item.isHidden
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                              }`}
                              title={
                                item.isHidden
                                  ? "Unhide Action Item"
                                  : "Hide Action Item (No deletion)"
                              }
                            >
                              {item.isHidden ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Unhide</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </>
                              )}
                            </button>

                            {/* Edit Action Button */}
                            <button
                              onClick={() => setEditingAction(item)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                              title="Edit Action Task & Timeline"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Action Button */}
                            <button
                              onClick={() => {
                                setItemToDelete({
                                  type: "action",
                                  id: item.id,
                                  name: item.title,
                                });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Action Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No action tasks matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  User Accounts & Client Team Directory ({userAccounts.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage accounts, designations, and entity assignments for CFO partners, client
                  directors, and client finance team members.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add User / Team Member</span>
                </button>
              </div>
            </div>

            {/* Filter by Role & Entity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: `All Users (${userAccounts.length})` },
                  {
                    id: "client_team",
                    label: `Client Team Members (${userAccounts.filter((u) => u.role === "client_team").length})`,
                  },
                  {
                    id: "client",
                    label: `Client Directors (${userAccounts.filter((u) => u.role === "client").length})`,
                  },
                  {
                    id: "cfo",
                    label: `Virtual CFOs (${userAccounts.filter((u) => u.role === "cfo").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserRoleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      userRoleFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Entity:</span>
                <select
                  value={userCompanyFilter}
                  onChange={(e) => setUserCompanyFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="ALL">All Entities</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {(showHiddenInTabs ? rawUserAccounts : userAccounts)
                .filter((u) => {
                  if (userRoleFilter !== "ALL" && u.role !== userRoleFilter) return false;
                  if (
                    userCompanyFilter !== "ALL" &&
                    u.companyId !== userCompanyFilter &&
                    u.companyId !== "all"
                  )
                    return false;
                  return true;
                })
                .map((user) => {
                  const assignedComp = rawCompanies.find((c) => c.id === user.companyId);
                  return (
                    <div
                      key={user.id}
                      className={`rounded-xl border p-4 space-y-3 transition-colors flex flex-col justify-between ${
                        user.isHidden
                          ? "bg-amber-50/40 border-amber-300 opacity-85"
                          : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {user.avatar || user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {user.name}
                                </h4>
                                {user.isHidden && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                    <EyeOff className="w-2.5 h-2.5" />
                                    HIDDEN
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                              {user.phone && (
                                <p className="text-[10px] text-slate-400 font-mono">{user.phone}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              user.role === "cfo"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : user.role === "client_team"
                                  ? "bg-sky-100 text-sky-800 border border-sky-200"
                                  : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            }`}
                          >
                            {user.role === "client_team"
                              ? "Client Team"
                              : user.role === "client"
                                ? "Director"
                                : "Virtual CFO"}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200/70 space-y-1">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Designation:</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {user.roleTitle || (user as any).title || "Finance Executive"}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Assigned Entity:</span>
                            <span className="font-medium text-indigo-700 text-right truncate max-w-[180px]">
                              {user.companyId === "all"
                                ? "All Entities (CFO Practice)"
                                : assignedComp?.companyName || user.companyName || "Unassigned"}
                            </span>
                          </div>
                        </div>

                        {/* Specific Person Module Viewing & Editing Rights Summary */}
                        {(() => {
                          const uPerms = getUserPermissions(user.id);
                          const presetInfo =
                            USER_PERMISSION_PRESET_LABELS[user.permissionPreset || "custom"] ||
                            USER_PERMISSION_PRESET_LABELS.custom;
                          return (
                            <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <Sliders className="w-3 h-3 text-sky-600" />
                                  <span>Person Rights</span>
                                </span>
                                {user.role === "cfo" ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                    Full Super-Admin
                                  </span>
                                ) : (
                                  <select
                                    value={user.permissionPreset || "custom"}
                                    onChange={(e) => {
                                      const val = e.target.value as UserPermissionPreset;
                                      if (val !== "custom") {
                                        applyUserPermissionPreset(user.id, val);
                                      }
                                    }}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded border border-sky-300 bg-white text-sky-900 cursor-pointer"
                                    title="Quick-change this specific person's viewing & editing preset"
                                  >
                                    <option value="full_edit_upload">Full Edit &amp; Upload</option>
                                    <option value="edit_no_upload">Edit Only (No Excel)</option>
                                    <option value="compliance_only">Compliance Only</option>
                                    <option value="mis_and_budget_only">
                                      MIS &amp; Budget Only
                                    </option>
                                    <option value="view_only">View Only (Read-Only)</option>
                                    <option value="custom">
                                      Custom Matrix ({presetInfo.label})
                                    </option>
                                  </select>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                {PERMISSION_MODULES_META.slice(0, 4).map((m) => {
                                  const mp = uPerms[m.key];
                                  return (
                                    <div
                                      key={m.key}
                                      className="flex items-center justify-between px-2 py-1 rounded bg-white border border-slate-200/80"
                                    >
                                      <span className="text-slate-600 truncate">
                                        {m.shortLabel}:
                                      </span>
                                      <span
                                        className={`font-bold ${
                                          mp.canEdit && mp.canUploadExcel
                                            ? "text-emerald-700"
                                            : mp.canEdit
                                              ? "text-sky-700"
                                              : mp.canView
                                                ? "text-amber-700"
                                                : "text-rose-600"
                                        }`}
                                      >
                                        {mp.canEdit && mp.canUploadExcel
                                          ? "Edit+XLS"
                                          : mp.canEdit
                                            ? "Edit"
                                            : mp.canView
                                              ? "View"
                                              : "None"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                          title={`Edit profile, role & access permissions for ${user.name}`}
                        >
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          <span>Edit Rights</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleItemVisibility("user", user.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                              user.isHidden
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                            }`}
                            title={
                              user.isHidden
                                ? "Unhide User / Team Member"
                                : "Hide User / Team Member (Preserve history without deleting)"
                            }
                          >
                            {user.isHidden ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Unhide</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hide</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit User Account & Specific Viewing/Editing Rights"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit &amp; Rights</span>
                          </button>
                          {rawUserAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setItemToDelete({
                                  type: "user",
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5.5: VISIBILITY & HIDDEN VAULT (HIDE / UNHIDE WITHOUT DELETION)      */}
      {/* ========================================================================= */}
      {activeTab === "visibility" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <EyeOff className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-bold text-white">
                      Visibility Control & Non-Destructive Hidden Vault
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {hiddenItemsRegistry.length} Currently Hidden
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Hide any Compliance, Client Entity, Action Task, Assigned Action Flow Task,
                    Corporate Repository Matter (Tax, Legal, Licenses, SOPs), Team Member, Budget
                    Line Item, Executive Report, or MIS Remark so permanent deletion is never
                    required. Unhide any item with one click whenever needed in the future.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setVaultMode("hidden")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      vaultMode === "hidden"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden Items ({hiddenItemsRegistry.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultMode("manage_all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      vaultMode === "manage_all"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Browse & Hide Active Items</span>
                  </button>
                </div>

                {hiddenItemsRegistry.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      unhideAllItems(
                        vaultCategoryFilter === "ALL" ? undefined : vaultCategoryFilter,
                      )
                    }
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {vaultCategoryFilter === "ALL"
                        ? "Unhide All Items"
                        : "Unhide All in Category"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: "All Categories", count: hiddenItemsRegistry.length },
                  {
                    id: "compliance",
                    label: "Compliances",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "compliance").length,
                  },
                  {
                    id: "company",
                    label: "Entities",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "company").length,
                  },
                  {
                    id: "action",
                    label: "Action Tracker",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "action").length,
                  },
                  {
                    id: "action_flow",
                    label: "Assigned Tasks (Flow)",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "action_flow").length,
                  },
                  {
                    id: "repository",
                    label: "Repository (Tax/Legal/Lic/SOP)",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "repository").length,
                  },
                  {
                    id: "user",
                    label: "Team / Users",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "user").length,
                  },
                  {
                    id: "budget_item",
                    label: "Budget Line Items",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "budget_item").length,
                  },
                  {
                    id: "executive_report",
                    label: "Executive Reports",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "executive_report")
                      .length,
                  },
                  {
                    id: "mis_remark",
                    label: "MIS Remarks",
                    count: hiddenItemsRegistry.filter((i) => i.entityType === "mis_remark").length,
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setVaultCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      vaultCategoryFilter === cat.id
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                        : "bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        vaultCategoryFilter === cat.id
                          ? "bg-slate-950/20 text-slate-950"
                          : cat.count > 0
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder="Search hidden or active items..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {vaultMode === "hidden" ? (
              <div className="bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden">
                {(() => {
                  const filteredHidden = hiddenItemsRegistry.filter((item) => {
                    if (vaultCategoryFilter !== "ALL" && item.entityType !== vaultCategoryFilter) {
                      return false;
                    }
                    if (vaultSearch.trim()) {
                      const q = vaultSearch.toLowerCase();
                      return (
                        item.title.toLowerCase().includes(q) ||
                        item.subtitle.toLowerCase().includes(q) ||
                        item.entityTypeLabel.toLowerCase().includes(q) ||
                        (item.companyName && item.companyName.toLowerCase().includes(q)) ||
                        (item.subType && item.subType.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  });

                  if (filteredHidden.length === 0) {
                    return (
                      <div className="p-10 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                          <Eye className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          No Hidden Items in This View
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          All items in this category are currently visible across the workspace. To
                          hide any item without deleting it, switch to{" "}
                          <button
                            type="button"
                            onClick={() => setVaultMode("manage_all")}
                            className="text-indigo-600 font-bold underline cursor-pointer"
                          >
                            Browse & Hide Active Items
                          </button>{" "}
                          or click the Hide button directly inside any module.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-3 px-4">Module / Type</th>
                            <th className="py-3 px-4">Hidden Item Title & Details</th>
                            <th className="py-3 px-4">Entity / Scope</th>
                            <th className="py-3 px-4">Hidden By & Timestamp</th>
                            <th className="py-3 px-4 text-right">Restore Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredHidden.map((item) => (
                            <tr
                              key={`${item.entityType}-${item.id}`}
                              className="hover:bg-amber-50/40 transition-colors"
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  {item.entityTypeLabel}
                                </span>
                                {item.subType && (
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    {item.subType}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{item.title}</div>
                                <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                                {item.companyName || "All Entities"}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500">
                                <div>{item.hiddenBy || "Admin"}</div>
                                <div className="font-mono text-[10px]">
                                  {item.hiddenAt || "Recently"}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleItemVisibility(
                                      item.entityType,
                                      item.id,
                                      item.companyId,
                                      false,
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Unhide & Restore</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Browse & Hide/Unhide All Items Across All 9 Modules */
              <div className="bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden">
                {(() => {
                  const allManageableItems: Array<{
                    id: string;
                    entityType: HideableEntityType;
                    entityTypeLabel: string;
                    subType: string;
                    title: string;
                    subtitle: string;
                    companyId?: string;
                    companyName?: string;
                    isHidden: boolean;
                  }> = [];

                  // 1. Companies
                  rawCompanies.forEach((c) => {
                    allManageableItems.push({
                      id: c.id,
                      entityType: "company",
                      entityTypeLabel: "Client Entity",
                      subType: c.legalEntity,
                      title: c.companyName,
                      subtitle: `GSTIN: ${c.gstin || "N/A"} • ${c.sector}`,
                      companyId: c.id,
                      companyName: c.companyName,
                      isHidden: !!c.isHidden,
                    });
                  });

                  // 2. Compliances (active company)
                  (rawCompliances || []).forEach((c) => {
                    allManageableItems.push({
                      id: c.id,
                      entityType: "compliance",
                      entityTypeLabel: "Statutory Compliance",
                      subType: c.category,
                      title: c.name,
                      subtitle: `${c.frequency} • Due: ${c.statutoryDueDate}`,
                      companyId: activeCompanyId,
                      companyName: clientProfile?.companyName,
                      isHidden: !!c.isHidden,
                    });
                  });

                  // 3. Action Tracker (active company)
                  (rawActions || []).forEach((a) => {
                    allManageableItems.push({
                      id: a.id,
                      entityType: "action",
                      entityTypeLabel: "Action Tracker",
                      subType: a.category,
                      title: a.title,
                      subtitle: `Assignee: ${a.assignedTo} • Due: ${a.fixedDeadline}`,
                      companyId: activeCompanyId,
                      companyName: clientProfile?.companyName,
                      isHidden: !!a.isHidden,
                    });
                  });

                  // 4. Action Flow Tasks
                  (rawActionFlowTasks || []).forEach((t) => {
                    allManageableItems.push({
                      id: t.id,
                      entityType: "action_flow",
                      entityTypeLabel: "Assigned Task (Flow)",
                      subType: t.category,
                      title: `${t.taskCode}: ${t.title}`,
                      subtitle: `Assignee: ${t.assignedTo} • Due: ${t.dueDate}`,
                      companyId: t.companyId,
                      companyName: t.companyName,
                      isHidden: !!t.isHidden,
                    });
                  });

                  // 5. Repository Items (Tax, Legal, License, SOP)
                  (rawTaxAssessments || []).forEach((m) => {
                    allManageableItems.push({
                      id: m.id,
                      entityType: "repository",
                      entityTypeLabel: "Repository • Tax Assessment",
                      subType: m.taxCategory,
                      title: m.matterTitle,
                      subtitle: `Notice: ${m.caseOrNoticeNumber} • FY ${m.financialYear}`,
                      companyId: m.companyId,
                      companyName: m.companyName,
                      isHidden: !!m.isHidden,
                    });
                  });
                  (rawLegalCases || []).forEach((m) => {
                    allManageableItems.push({
                      id: m.id,
                      entityType: "repository",
                      entityTypeLabel: "Repository • Legal Case",
                      subType: m.legalCategory,
                      title: m.matterTitle,
                      subtitle: `${m.forumOrCourt} • ${m.caseNumber}`,
                      companyId: m.companyId,
                      companyName: m.companyName,
                      isHidden: !!m.isHidden,
                    });
                  });
                  (rawLicenses || []).forEach((m) => {
                    allManageableItems.push({
                      id: m.id,
                      entityType: "repository",
                      entityTypeLabel: "Repository • License/Cert",
                      subType: m.licenseCategory,
                      title: m.title,
                      subtitle: `Lic #: ${m.licenseNumber} • Exp: ${m.expiryDate}`,
                      companyId: m.companyId,
                      companyName: m.companyName,
                      isHidden: !!m.isHidden,
                    });
                  });
                  (rawSops || []).forEach((m) => {
                    allManageableItems.push({
                      id: m.id,
                      entityType: "repository",
                      entityTypeLabel: "Repository • SOP",
                      subType: m.sopCategory,
                      title: `${m.sopCode}: ${m.title}`,
                      subtitle: `Dept: ${m.department} • Owner: ${m.owner}`,
                      companyId: m.companyId,
                      companyName: m.companyName,
                      isHidden: !!m.isHidden,
                    });
                  });

                  // 6. Users
                  (rawUserAccounts || []).forEach((u) => {
                    allManageableItems.push({
                      id: u.id,
                      entityType: "user",
                      entityTypeLabel: "User / Team Member",
                      subType: u.roleTitle,
                      title: u.name,
                      subtitle: `${u.email} (${u.role.toUpperCase()})`,
                      companyId: u.companyId,
                      companyName: u.companyName || "All Entities",
                      isHidden: !!u.isHidden,
                    });
                  });

                  // 7. Budget Line Items
                  (rawBudgetItems || []).forEach((b) => {
                    allManageableItems.push({
                      id: b.id,
                      entityType: "budget_item",
                      entityTypeLabel: "Budget / MIS Line Item",
                      subType: b.category,
                      title: `${b.code} - ${b.name}`,
                      subtitle: b.description || b.category,
                      companyId: activeCompanyId,
                      companyName: clientProfile?.companyName,
                      isHidden: !!b.isHidden,
                    });
                  });

                  // 8. Executive Reports
                  Object.entries(executiveReports || {}).forEach(([cId, list]) => {
                    (list || []).forEach((r) => {
                      allManageableItems.push({
                        id: r.id,
                        entityType: "executive_report",
                        entityTypeLabel: "CFO Executive Report",
                        subType: r.month,
                        title: r.title,
                        subtitle: `Period: ${r.month} • By ${r.authorName}`,
                        companyId: cId,
                        companyName: rawCompanies.find((c) => c.id === cId)?.companyName || cId,
                        isHidden: !!r.isHidden,
                      });
                    });
                  });

                  // 9. MIS Remarks
                  (rawMisRemarks || []).forEach((r) => {
                    allManageableItems.push({
                      id: r.id,
                      entityType: "mis_remark",
                      entityTypeLabel: "MIS Variance Remark",
                      subType: r.sectionTitle,
                      title: r.title,
                      subtitle: `By ${r.addedBy} • ${r.createdAt}`,
                      companyId: r.companyId,
                      companyName: r.companyName,
                      isHidden: !!r.isHidden,
                    });
                  });

                  const filteredAll = allManageableItems.filter((item) => {
                    if (vaultCategoryFilter !== "ALL" && item.entityType !== vaultCategoryFilter) {
                      return false;
                    }
                    if (vaultSearch.trim()) {
                      const q = vaultSearch.toLowerCase();
                      return (
                        item.title.toLowerCase().includes(q) ||
                        item.subtitle.toLowerCase().includes(q) ||
                        item.entityTypeLabel.toLowerCase().includes(q) ||
                        item.subType.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  return (
                    <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                          <tr>
                            <th className="py-3 px-4">Module / Category</th>
                            <th className="py-3 px-4">Item Title & Reference</th>
                            <th className="py-3 px-4">Entity</th>
                            <th className="py-3 px-4">Current Visibility</th>
                            <th className="py-3 px-4 text-right">Toggle Visibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredAll.map((item) => (
                            <tr
                              key={`${item.entityType}-${item.id}`}
                              className={
                                item.isHidden
                                  ? "bg-amber-50/50 hover:bg-amber-50 transition-colors"
                                  : "hover:bg-slate-50 transition-colors"
                              }
                            >
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.entityTypeLabel}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {item.subType}
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-slate-900">{item.title}</div>
                                <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                                {item.companyName || "Global"}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {item.isHidden ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <EyeOff className="w-3 h-3" />
                                    <span>Hidden (Archived)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Eye className="w-3 h-3" />
                                    <span>Active & Visible</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleItemVisibility(item.entityType, item.id, item.companyId)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                                    item.isHidden
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                  }`}
                                >
                                  {item.isHidden ? (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Unhide</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Hide Item</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SECURITY AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Real-time Security & Governance Audit Trail
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable event log recording logins, Excel uploads, metric modifications, and
                  permission shifts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 w-44"
                  />
                </div>

                {/* Filter */}
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ALL">All Actions</option>
                  <option value="USER_LOGIN">User Logins</option>
                  <option value="EXCEL_UPLOAD_MIS">Excel Uploads</option>
                  <option value="SECURITY_PROTOCOL_CHANGED">Security Policy Changes</option>
                  <option value="RIGHTS_MODIFIED">Permissions Modified</option>
                  <option value="COMPLIANCE_APPROVED">Compliance Sign-offs</option>
                  <option value="REMARK_ADDED">MIS Remarks Added</option>
                  <option value="COMPANY_ADDED">Company Additions</option>
                </select>

                <button
                  onClick={exportAuditLogsCsv}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User / Role</th>
                    <th className="py-2.5 px-3">Action Event</th>
                    <th className="py-2.5 px-3">Details & Audit Remarks</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                        No audit records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-900">{log.userName}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{log.role}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 max-w-md">
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {log.ipAddress || "Internal"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.status === "success"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.status === "warning"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CLIENT COMPANY */}
      {/* ========================================================================= */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Client Company</h3>
              </div>
              <button
                onClick={() => setIsAddCompanyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompany.companyName}
                  onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                  placeholder="e.g. Apex Dynamics Private Limited"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal Entity Type
                  </label>
                  <select
                    value={newCompany.legalEntity}
                    onChange={(e) => setNewCompany({ ...newCompany, legalEntity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={newCompany.sector}
                    onChange={(e) => setNewCompany({ ...newCompany, sector: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={newCompany.gstin}
                    onChange={(e) => setNewCompany({ ...newCompany, gstin: e.target.value })}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN</label>
                  <input
                    type="text"
                    value={newCompany.pan}
                    onChange={(e) => setNewCompany({ ...newCompany, pan: e.target.value })}
                    placeholder="AAAAA0000A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered City</label>
                  <input
                    type="text"
                    value={newCompany.city}
                    onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Virtual CFO
                  </label>
                  <input
                    type="text"
                    value={newCompany.assignedCfo}
                    onChange={(e) => setNewCompany({ ...newCompany, assignedCfo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COMPLIANCE */}
      {/* ========================================================================= */}
      {isAddComplianceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Statutory Compliance Item
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure statutory compliance details, assign a primary owner, and set subtask
                    assignees &amp; target dates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddComplianceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompliance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Compliance Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCompliance.name}
                  onChange={(e) => setNewCompliance({ ...newCompliance, name: e.target.value })}
                  placeholder="e.g. GSTR-1 Return Filing (Monthly Inward/Outward)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCompliance.category}
                    onChange={(e) =>
                      setNewCompliance({
                        ...newCompliance,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="GST">GST</option>
                    <option value="TDS">TDS / TCS</option>
                    <option value="Income Tax">Income Tax</option>
                    <option value="ROC / MCA">ROC / MCA</option>
                    <option value="PF & ESI">PF & ESI</option>
                    <option value="Audit & Secretarial">Audit & Secretarial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={newCompliance.frequency}
                    onChange={(e) =>
                      setNewCompliance({
                        ...newCompliance,
                        frequency: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                    <option value="Event-based">Event-based</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Statutory Due Date (As per Act / Rule)
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold text-slate-700 flex items-center justify-between">
                    <span>{newCompliance.statutoryDueDate}</span>
                    <span className="text-[10px] font-sans font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Statutory Fixed
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Tax / Challan (₹)
                  </label>
                  <input
                    type="number"
                    value={newCompliance.taxAmount}
                    onChange={(e) =>
                      setNewCompliance({ ...newCompliance, taxAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicable Section / Rule
                  </label>
                  <input
                    type="text"
                    value={newCompliance.sectionOrAct}
                    onChange={(e) =>
                      setNewCompliance({ ...newCompliance, sectionOrAct: e.target.value })
                    }
                    placeholder="e.g. Section 194C / Section 39"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-indigo-900 mb-1">
                    Assign Compliance To (Primary Owner)
                  </label>
                  <select
                    value={newCompliance.assignedTo}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const found = assignableDirectory.find((p) => p.name === sel);
                      setNewCompliance({
                        ...newCompliance,
                        assignedTo: sel,
                        assignedToRole: found?.roleTitle || "Client Finance Team",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-indigo-50/50 font-semibold text-indigo-950"
                  >
                    {assignableDirectory.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtask Assignment & Target Date */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>3-Stage Subtasks — Assign Person &amp; Fix Target Date</span>
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Target Date per Subtask
                  </span>
                </div>

                <div className="space-y-2.5">
                  {newCompliance.subtasks.map((st, idx) => (
                    <div
                      key={st.subtaskNumber}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Subtask {st.subtaskNumber} ({st.stageName})
                        </label>
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => {
                            const updated = [...newCompliance.subtasks];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setNewCompliance({ ...newCompliance, subtasks: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Assigned Person
                        </label>
                        <select
                          value={st.assignedTo}
                          onChange={(e) => {
                            const sel = e.target.value;
                            const found = assignableDirectory.find((p) => p.name === sel);
                            const updated = [...newCompliance.subtasks];
                            updated[idx] = {
                              ...updated[idx],
                              assignedTo: sel,
                              assignedRole: found?.roleTitle || updated[idx].assignedRole,
                            };
                            setNewCompliance({ ...newCompliance, subtasks: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                        >
                          {assignableDirectory.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-0.5">
                          Subtask Target Date
                        </label>
                        <input
                          type="date"
                          value={st.deadline || newCompliance.statutoryDueDate}
                          onChange={(e) => {
                            const iso = e.target.value;
                            const updated = [...newCompliance.subtasks];
                            updated[idx] = {
                              ...updated[idx],
                              deadline: iso,
                            };
                            setNewCompliance({ ...newCompliance, subtasks: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded border border-indigo-200 bg-indigo-50/50 font-mono text-[11px] font-semibold text-indigo-950 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddComplianceOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Save Compliance & Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD USER */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add User / Client Team Person &amp; Viewing/Editing Rights
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create a specific person account and assign their individual module viewing,
                    editing, and Excel upload rights
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. rajesh@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as Role;
                      const defaultPreset: UserPermissionPreset =
                        nextRole === "client" ? "view_only" : "full_edit_upload";
                      setNewUser({
                        ...newUser,
                        role: nextRole,
                        permissionPreset: defaultPreset,
                        permissions: buildPermissionsFromPreset(defaultPreset, nextRole),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="client_team">Client Finance Team (Person)</option>
                    <option value="client">Client Executive / Director</option>
                    <option value="cfo">Virtual CFO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Company
                  </label>
                  <select
                    value={newUser.companyId}
                    onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation Title
                  </label>
                  <input
                    type="text"
                    value={newUser.title}
                    onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                    placeholder="e.g. Senior Accountant / GST Lead"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Specific Person Viewing & Editing Rights Selector */}
              {newUser.role !== "cfo" && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-sky-600" />
                        <span>Specific Person Viewing, Editing &amp; Excel Upload Rights</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Choose a quick preset or customize module-by-module access for this person
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        "full_edit_upload",
                        "edit_no_upload",
                        "compliance_only",
                        "mis_and_budget_only",
                        "view_only",
                      ] as UserPermissionPreset[]
                    ).map((presetKey) => (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() =>
                          setNewUser({
                            ...newUser,
                            permissionPreset: presetKey,
                            permissions: buildPermissionsFromPreset(presetKey, newUser.role),
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          newUser.permissionPreset === presetKey
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"
                        }`}
                      >
                        {USER_PERMISSION_PRESET_LABELS[presetKey].label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2 px-3">Module</th>
                          <th className="py-2 px-2 text-center">Can View</th>
                          <th className="py-2 px-2 text-center">Can Edit / Draft</th>
                          <th className="py-2 px-2 text-center">Upload Excel</th>
                          <th className="py-2 px-2 text-center">Can Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {PERMISSION_MODULES_META.map((m) => {
                          const mp = newUser.permissions[m.key];
                          const toggleNewUserPerm = (
                            field: keyof ModulePermission,
                            checked: boolean,
                          ) => {
                            const updatedMod = { ...mp, [field]: checked };
                            if (field !== "canView" && checked && !updatedMod.canView) {
                              updatedMod.canView = true;
                            }
                            if (field === "canView" && !checked) {
                              updatedMod.canEdit = false;
                              updatedMod.canUploadExcel = false;
                              updatedMod.canDelete = false;
                            }
                            setNewUser({
                              ...newUser,
                              permissionPreset: "custom",
                              permissions: {
                                ...newUser.permissions,
                                [m.key]: updatedMod,
                              },
                            });
                          };
                          return (
                            <tr key={m.key}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{m.label}</td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={mp.canView}
                                  onChange={(e) => toggleNewUserPerm("canView", e.target.checked)}
                                  className="rounded text-sky-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={mp.canEdit}
                                  onChange={(e) => toggleNewUserPerm("canEdit", e.target.checked)}
                                  className="rounded text-sky-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={mp.canUploadExcel}
                                  onChange={(e) =>
                                    toggleNewUserPerm("canUploadExcel", e.target.checked)
                                  }
                                  className="rounded text-sky-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={mp.canDelete}
                                  onChange={(e) => toggleNewUserPerm("canDelete", e.target.checked)}
                                  className="rounded text-sky-600 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Add Person &amp; Save Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDestructiveDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === "company"
            ? "Delete or Hide Entity"
            : itemToDelete?.type === "action"
              ? "Delete or Hide Action Task"
              : itemToDelete?.type === "user"
                ? "Delete or Hide User Account"
                : "Delete or Hide Compliance"
        }
        description={
          itemToDelete
            ? `Instead of permanently deleting "${itemToDelete.name}", you can click "Hide Instead" to remove it from active views while preserving all history so you can unhide it anytime in the future.`
            : ""
        }
        confirmLabel="Delete Permanently"
        onHideInstead={
          itemToDelete
            ? () => {
                toggleItemVisibility(itemToDelete.type, itemToDelete.id, activeCompanyId, true);
                setItemToDelete(null);
              }
            : undefined
        }
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === "company") {
              deleteCompany(itemToDelete.id);
              showToast(`Entity "${itemToDelete.name}" deleted.`);
            } else if (itemToDelete.type === "action") {
              deleteAction(itemToDelete.id);
              if (addAuditLog) {
                addAuditLog(
                  "ACTION_TASK_DELETED",
                  `Admin deleted action task "${itemToDelete.name}".`,
                  "warning",
                );
              }
              showToast(`Action task "${itemToDelete.name}" deleted.`);
            } else if (itemToDelete.type === "user") {
              deleteUserAccount(itemToDelete.id);
              showToast(`User account "${itemToDelete.name}" removed.`);
            } else {
              deleteComplianceMasterItem(itemToDelete.id);
              showToast(`Compliance "${itemToDelete.name}" deleted.`);
            }
            setItemToDelete(null);
          }
        }}
      />

      {/* Entity & Client Team Edit Modal */}
      {editingCompany && (
        <EntityEditModal
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={companies.find((c) => c.id === editingCompany.id) || editingCompany}
          companies={companies}
          userAccounts={userAccounts}
          initialSubTab={editingCompanySubTab}
          onSaveCompany={(updated) => {
            updateCompany(updated);
            showToast(`Entity profile "${updated.companyName}" updated.`);
          }}
          onAddUser={(newUserObj) => {
            addUserAccount(newUserObj);
            showToast(`Team member "${newUserObj.name}" added to entity.`);
          }}
          onUpdateUser={(updatedUserObj) => {
            updateUserAccount(updatedUserObj);
            showToast(`Team member "${updatedUserObj.name}" updated.`);
          }}
          onDeleteUser={(userId) => {
            deleteUserAccount(userId);
            showToast("Team member removed from entity.");
          }}
        />
      )}

      {/* User Account / Team Member Edit Modal */}
      {editingUser && (
        <UserEditModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          companies={companies}
          onSave={(updatedUser) => {
            updateUserAccount(updatedUser);
            showToast(`User account "${updatedUser.name}" updated.`);
          }}
        />
      )}

      {/* Compliance Task & Timeline Edit Modal */}
      {editingCompliance && (
        <ComplianceEditModal
          compliance={editingCompliance}
          isOpen={!!editingCompliance}
          onClose={() => setEditingCompliance(null)}
          onSave={handleSaveComplianceEdit}
        />
      )}

      {/* Action Task & Deadline Edit Modal */}
      {editingAction && (
        <ActionEditModal
          actionItem={editingAction}
          isOpen={!!editingAction}
          onClose={() => setEditingAction(null)}
          onSave={handleSaveActionEdit}
        />
      )}

      {/* New Action Task Modal */}
      <NewActionModal />
    </div>
  );
};
