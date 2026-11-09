// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  isSupabaseConfigured,
  recoverCustomCompaniesFromLocalStorage,
  recoverCustomUsersFromLocalStorage,
} from "@/integrations/supabase/client";
import {
  Role,
  ComplianceItem,
  ActionItem,
  FinancialMIS,
  ClientProfile,
  FilterOptions,
  SubTask,
  UserAccount,
  CompanyOverviewSummary,
  CriticalDelayedItem,
  BudgetLineItem,
  BudgetMonthKey,
  MisSubTab,
  MisRemarkItem,
  MisUploadRecord,
  SecurityProtocolConfig,
  RolePermissionsMap,
  AuditLogItem,
  ModulePermission,
  PermissionModuleKey,
  UserModulePermissions,
  UserPermissionPreset,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
  SopMatter,
  RepositoryItem,
  RepositoryItemType,
  RepositoryDocument,
  RepositoryProgressUpdate,
  CaseChronologyEvent,
  MonthlyExecutiveReport,
  ExecutiveObservation,
  ManagementShortageAction,
  ThreeMonthCashBudgetModel,
  ActionFlowTask,
  ActionFlowMilestone,
  TaskChallenge,
  ChallengeComment,
  ActionFlowTaskStatus,
  ChallengeStatus,
  TaskDiscussionEntry,
  ComplianceProofDocument,
  ActionStatus,
  ActionProgressUpdate,
  HideableEntityType,
  FinanceDepartmentConfig,
  FinanceTeamMemberKpi,
  TeamKpiItem,
  PerformanceIndicator,
  PerformanceEvaluationMode,
  ColorTheme,
  CfoSupportQuery,
  SupportQueryStatus,
  SupportQueryCategory,
  SupportQueryMessage,
  CfoSeparateArrangement,
  RequestType,
  FinanceHiringDetails,
  SpecialAssignmentDetails,
} from "../types";
import { MOCK_SUPPORT_QUERIES } from "../data/mockSupportQueries";
import { ALL_COMPANIES_COMPLIANCES } from "../data/companyData";
import {
  INITIAL_FINANCE_DEPARTMENTS,
  INITIAL_TEXTILE_TEAM_KPI_KRA,
} from "../data/mockTextileKpiKraData";

export interface HiddenItemRecord {
  id: string;
  entityType: HideableEntityType;
  entityTypeLabel: string;
  subType?: string;
  title: string;
  subtitle: string;
  companyId?: string;
  companyName?: string;
  hiddenAt?: string;
  hiddenBy?: string;
}
import { INITIAL_THREE_MONTH_CASH_BUDGET } from "../data/mockThreeMonthCashBudget";
import {
  INITIAL_CLIENT_PROFILE,
  INITIAL_FINANCIAL_MIS,
  CLIENT_COMPANIES,
  DEFAULT_USERS,
  COMPANY_FINANCIAL_MIS,
} from "../data/mockInitialData";
import {
  DEFAULT_SECURITY_PROTOCOLS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
  buildPermissionsFromPreset,
} from "../data/mockAdminSecurityData";
import {
  MOCK_TAX_ASSESSMENTS,
  MOCK_LEGAL_CASES,
  MOCK_LICENSES,
  MOCK_SOPS,
} from "../data/mockRepositoryData";
import {
  nextDueDate,
  daysUntilDue,
  formatDueDate,
  compareDueDates,
  normalizeComplianceId,
  isMatchingCompliance,
} from "../utils/dueDate";
import {
  getCurrentMonthKey,
  buildRolledComplianceList,
  isComplianceInMonth,
} from "../utils/complianceCalendarEngine";
import {
  extractAllReminderItems,
  ReminderItem,
  ReminderSource,
} from "../utils/reminderEngine";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toUuid(rawId: string, scope = ""): string {
  if (rawId && UUID_REGEX.test(rawId)) return rawId.toLowerCase();
  const input = `${scope}:${rawId || "default"}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x85ebca6b ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const full = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-4${full.slice(13, 16)}-a${full.slice(17, 20)}-${full.slice(20, 32)}`;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setIsAuthenticated: (val: boolean) => void;
  executiveReports: Record<string, MonthlyExecutiveReport[]>;
  saveExecutiveReport: (report: MonthlyExecutiveReport) => void;
  deleteExecutiveReport: (companyId: string, reportId: string) => void;
  getReportsForCompany: (companyId: string) => MonthlyExecutiveReport[];
  switchActiveUser: (userOrId: string | UserAccount) => void;
  logout: () => void;
  misUploads: MisUploadRecord[];
  createMisUpload: (payload: {
    companyId?: string;
    period: string;
    statementType: string;
    fileName: string;
    rows: any;
    rowCount?: number;
    status?: "pending_review" | "approved" | "rejected";
    overridePrevious?: boolean;
  }) => Promise<MisUploadRecord | null>;
  reviewMisUpload: (
    uploadId: string,
    status: "approved" | "rejected",
    reviewNote?: string,
  ) => Promise<void>;
  deleteMisUpload: (uploadId: string) => Promise<boolean>;
  deleteCompanyFinancialMIS: (companyId: string) => Promise<void>;
  overrideFinancialMIS: (
    companyId: string,
    newMIS: Partial<FinancialMIS>,
    meta?: {
      fileName?: string;
      period?: string;
      autoApprove?: boolean;
      overridePrevious?: boolean;
    },
  ) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  companies: ClientProfile[];
  selectedCompanyId: string;
  activeCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  cfoViewMode: "portfolio" | "single_company";
  setCfoViewMode: (mode: "portfolio" | "single_company") => void;
  drillDownToCompany: (companyId: string) => void;
  returnToPortfolio: () => void;
  allCompaniesOverview: CompanyOverviewSummary[];
  criticalDelayedItems: CriticalDelayedItem[];
  approveCfoComplianceReview: (companyId: string, complianceId: string) => void;
  switchCompanyAndTab: (
    companyId: string,
    tab:
      | "dashboard"
      | "compliances"
      | "actions"
      | "action_flow"
      | "mis"
      | "repository"
      | "admin",
    subTab?: MisSubTab,
  ) => void;
  activeTab:
    | "dashboard"
    | "compliances"
    | "actions"
    | "action_flow"
    | "mis"
    | "repository"
    | "admin";
  setActiveTab: (
    tab:
      | "dashboard"
      | "compliances"
      | "actions"
      | "action_flow"
      | "mis"
      | "repository"
      | "admin",
  ) => void;
  supportQueries: CfoSupportQuery[];
  createSupportQuery: (
    query: Omit<CfoSupportQuery, "id" | "ticketNumber" | "createdAt" | "updatedAt" | "messages">,
    initialMessage?: string,
  ) => CfoSupportQuery;
  replyToSupportQuery: (
    queryId: string,
    content: string,
    isInternalNote?: boolean,
    newStatus?: SupportQueryStatus,
  ) => void;
  updateSupportQueryStatus: (
    queryId: string,
    status: SupportQueryStatus,
    resolutionSummary?: string,
  ) => void;
  deleteSupportQuery: (queryId: string) => void;
  updateCfoArrangement: (
    queryId: string,
    arrangement: Partial<CfoSeparateArrangement>,
  ) => void;
  approveCfoArrangement: (
    queryId: string,
    clientRemarks?: string,
    poRef?: string,
  ) => void;
  updateArrangementMilestoneStatus: (
    queryId: string,
    milestoneId: string,
    status: "pending" | "in_progress" | "completed",
  ) => void;
  misSubTab: MisSubTab;
  setMisSubTab: (subTab: MisSubTab) => void;
  openMisWithSubTab: (subTab: MisSubTab) => void;
  isCfoAdmin: boolean;
  setIsCfoAdmin: (val: boolean) => void;
  securityProtocols: SecurityProtocolConfig;
  updateSecurityProtocols: (partial: Partial<SecurityProtocolConfig>) => void;
  rolePermissions: RolePermissionsMap;
  updateRolePermission: (
    targetRole: "cfo" | "client" | "client_team",
    module: "mis" | "budget" | "compliances" | "actions" | "companies",
    field: keyof ModulePermission,
    value: boolean,
  ) => void;
  userPermissions: Record<string, UserModulePermissions>;
  getUserPermissions: (userOrId: string | UserAccount) => UserModulePermissions;
  updateUserPermission: (
    userId: string,
    module: PermissionModuleKey,
    field: keyof ModulePermission,
    value: boolean,
  ) => void;
  applyUserPermissionPreset: (userId: string, preset: UserPermissionPreset) => void;
  effectivePermissions: UserModulePermissions;
  auditLogs: AuditLogItem[];
  logAuditEvent: (
    action: string,
    entity: string,
    entityId: string,
    companyId?: string | null,
    details?: Record<string, any> | string,
  ) => Promise<void>;
  addAuditLog: (
    action: AuditLogItem["action"],
    details: string,
    status?: "success" | "warning" | "blocked",
  ) => void;
  misRemarks: MisRemarkItem[];
  addMisRemark: (item: Omit<MisRemarkItem, "id" | "createdAt" | "status">) => void;
  updateMisRemarkStatus: (
    id: string,
    status: MisRemarkItem["status"],
    cfoFeedback?: string,
  ) => void;
  deleteMisRemark: (id: string) => void;
  addCompany: (company: Omit<ClientProfile, "id">) => void;
  updateCompany: (company: ClientProfile) => void;
  deleteCompany: (companyId: string) => void;
  addComplianceMasterItem: (item: Omit<ComplianceItem, "id" | "sNo">) => void;
  deleteComplianceMasterItem: (id: string) => void;
  userAccounts: UserAccount[];
  addUserAccount: (user: Omit<UserAccount, "id">) => void;
  updateUserAccount: (user: UserAccount) => void;
  deleteUserAccount: (id: string) => void;
  budgetItems: BudgetLineItem[];
  selectedBudgetMonth: BudgetMonthKey;
  setSelectedBudgetMonth: (month: BudgetMonthKey) => void;
  updateLineItemActual: (
    itemId: string,
    monthKey: BudgetMonthKey,
    actual: number,
    notes?: string,
  ) => void;
  updateLineItemBudget: (itemId: string, monthKey: BudgetMonthKey, budget: number) => void;
  bulkUpdateActualsFromExcel: (
    monthKey: BudgetMonthKey,
    parsedRows: Array<{ code?: string; name?: string; actual: number; notes?: string }>,
    fileName?: string,
  ) => { updatedCount: number; notFoundCount: number };
  resetBudgetData: () => void;
  compliances: ComplianceItem[];
  selectedComplianceMonth: string;
  setSelectedComplianceMonth: (monthKey: string) => void;
  hideCompletedCompliances: boolean;
  setHideCompletedCompliances: (hide: boolean) => void;
  toggleHideCompletedCompliances: () => void;
  autoHideEarlierCompleted: boolean;
  setAutoHideEarlierCompleted: (hide: boolean) => void;
  toggleAutoHideEarlierCompleted: () => void;
  toggleSubtask: (
    complianceId: string,
    subtaskNumber: 1 | 2 | 3,
    notes?: string,
    docRef?: string,
  ) => void;
  updateCompliance: (item: ComplianceItem) => void;
  assignComplianceOwner: (
    complianceId: string,
    assignedTo: string,
    assignedRole?: string,
    cascadeToSubtasks?: boolean,
  ) => void;
  updateComplianceSubtaskAssignment: (
    complianceId: string,
    subtaskNumber: 1 | 2 | 3,
    updates: {
      assignedTo?: string;
      assignedRole?: string;
      durationDays?: number;
      deadline?: string;
      title?: string;
    },
  ) => void;
  updateComplianceRemarks: (
    complianceId: string,
    remarksType: "cfo" | "client",
    text: string,
  ) => void;
  uploadComplianceProof: (
    complianceId: string,
    proof: Omit<ComplianceProofDocument, "id" | "uploadedAt" | "uploadedBy">,
    autoMarkFinalSubtaskCompleted?: boolean,
  ) => void;
  deleteComplianceProof: (complianceId: string, proofId: string) => void;
  complianceProofModalTarget: ComplianceItem | null;
  openComplianceProofModal: (compliance: ComplianceItem) => void;
  closeComplianceProofModal: () => void;
  complianceProofViewTarget: { compliance: ComplianceItem; proof: ComplianceProofDocument } | null;
  openComplianceProofView: (compliance: ComplianceItem, proof?: ComplianceProofDocument) => void;
  closeComplianceProofView: () => void;
  actions: ActionItem[];
  addAction: (item: Omit<ActionItem, "id" | "createdAt">) => void;
  updateAction: (item: ActionItem) => void;
  deleteAction: (id: string) => void;
  updateActionProgress: (
    actionId: string,
    progressPercentage: number,
    notes: string,
    updatedStatus?: ActionStatus,
    updatedBy?: string,
  ) => void;
  toggleActionSubtask: (actionId: string, subtaskNumber: number, notes?: string) => void;
  addActionSubtask: (actionId: string, title: string) => void;
  financialMIS: FinancialMIS;
  updateFinancialMIS: (data: Partial<FinancialMIS>) => void;
  clearFinancialMisDummyData: () => void;
  loadSampleFinancialMisData: () => void;
  threeMonthCashBudget: ThreeMonthCashBudgetModel;
  updateWeeklyCashActuals: (
    weekId: string,
    updates: Array<{ itemId: string; actual: number; notes?: string }>,
    isClosed: boolean,
  ) => void;
  addShortageAction: (action: Omit<ManagementShortageAction, "id">) => void;
  updateShortageActionStatus: (
    actionId: string,
    status: ManagementShortageAction["status"],
  ) => void;
  deleteShortageAction: (actionId: string) => void;
  updateCashBudgetConfig: (config: {
    startingCashBalance?: number;
    minimumSafeBuffer?: number;
    sanctionedODLimit?: number;
  }) => void;
  clientProfile: ClientProfile;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  stats: {
    totalCompliances: number;
    fullyCompletedCompliances: number;
    inProgressCompliances: number;
    notStartedCompliances: number;
    overallCompliancePercentage: number;
    cfoReviewPendingCount: number;
    totalActions: number;
    pendingActions: number;
    inProgressActions: number;
    underReviewActions: number;
    completedActions: number;
    overdueActions: number;
    totalTaxPaid: number;
    totalTaxPending: number;
  };
  selectedCompliance: ComplianceItem | null;
  setSelectedCompliance: (item: ComplianceItem | null) => void;
  isNewActionModalOpen: boolean;
  setIsNewActionModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  resetToDefaultData: () => void;
  allCompliancesMap: Record<string, ComplianceItem[]>;
  allActionsMap: Record<string, ActionItem[]>;
  allMISMap: Record<string, FinancialMIS>;
  allBudgetMap: Record<string, BudgetLineItem[]>;

  // Corporate Repository (Tax Assessments, Legal Cases, Licenses & Renewals, SOPs)
  taxAssessments: TaxAssessmentMatter[];
  legalCases: LegalCaseMatter[];
  licenses: LicenseCertificationMatter[];
  sops: SopMatter[];
  allTaxAssessments: TaxAssessmentMatter[];
  allLegalCases: LegalCaseMatter[];
  allLicenses: LicenseCertificationMatter[];
  allSops: SopMatter[];
  resetRepositorySampleData: () => void;
  addTaxAssessment: (
    matter: Omit<TaxAssessmentMatter, "id" | "progressUpdates" | "documents">,
  ) => void;
  updateTaxAssessment: (matter: TaxAssessmentMatter) => void;
  deleteTaxAssessment: (id: string) => void;
  addLegalCase: (matter: Omit<LegalCaseMatter, "id" | "progressUpdates" | "documents">) => void;
  updateLegalCase: (matter: LegalCaseMatter) => void;
  deleteLegalCase: (id: string) => void;
  addLicense: (
    matter: Omit<LicenseCertificationMatter, "id" | "progressUpdates" | "documents">,
  ) => void;
  updateLicense: (matter: LicenseCertificationMatter) => void;
  deleteLicense: (id: string) => void;
  addSop: (matter: Omit<SopMatter, "id" | "progressUpdates" | "documents">) => void;
  updateSop: (matter: SopMatter) => void;
  deleteSop: (id: string) => void;
  addRepositoryProgressUpdate: (
    matterId: string,
    itemType: RepositoryItemType,
    update: { status: string; notes: string; documentRef?: string; nextSteps?: string },
  ) => void;
  uploadRepositoryDocument: (
    matterId: string,
    itemType: RepositoryItemType,
    doc: {
      title: string;
      category: RepositoryDocument["category"];
      fileName: string;
      fileType: string;
      fileSize: string;
      notes?: string;
    },
  ) => void;
  deleteRepositoryDocument: (matterId: string, itemType: RepositoryItemType, docId: string) => void;
  addCaseChronologyEvent: (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    event: Omit<CaseChronologyEvent, "id">,
  ) => void;
  updateCaseChronologyEvent: (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    event: CaseChronologyEvent,
  ) => void;
  deleteCaseChronologyEvent: (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    eventId: string,
  ) => void;

  // Interactive Action Flow & Gantt Studio
  actionFlowTasks: ActionFlowTask[];
  allActionFlowTasks: ActionFlowTask[];
  addActionFlowTask: (task: Omit<ActionFlowTask, "id" | "taskCode" | "createdAt">) => void;
  updateActionFlowTask: (id: string, updates: Partial<ActionFlowTask>) => void;
  deleteActionFlowTask: (id: string) => void;
  addMilestone: (taskId: string, milestone: Omit<ActionFlowMilestone, "id">) => void;
  updateMilestone: (
    taskId: string,
    milestoneId: string,
    updates: Partial<ActionFlowMilestone>,
  ) => void;
  toggleMilestoneStatus: (taskId: string, milestoneId: string) => void;
  reportTaskChallenge: (
    taskId: string,
    challenge: Omit<TaskChallenge, "id" | "reportedAt" | "comments" | "status">,
  ) => void;
  addChallengeComment: (
    taskId: string,
    challengeId: string,
    comment: Omit<ChallengeComment, "id" | "timestamp">,
  ) => void;
  resolveTaskChallenge: (taskId: string, challengeId: string, resolutionSummary: string) => void;
  provideCfoGuidance: (
    taskId: string,
    challengeId: string,
    guidanceText: string,
    actionPrescribed?: string,
    extendDays?: number,
  ) => void;
  addTaskDiscussion: (
    taskId: string,
    entry: Omit<TaskDiscussionEntry, "id" | "timestamp">,
    newProgress?: number,
    newStatus?: ActionFlowTaskStatus,
  ) => void;

  // Visibility & Non-Destructive Hide/Unhide Management
  rawCompanies: ClientProfile[];
  rawCompliances: ComplianceItem[];
  rawActions: ActionItem[];
  rawActionFlowTasks: ActionFlowTask[];
  rawTaxAssessments: TaxAssessmentMatter[];
  rawLegalCases: LegalCaseMatter[];
  rawLicenses: LicenseCertificationMatter[];
  rawSops: SopMatter[];
  rawBudgetItems: BudgetLineItem[];
  rawUserAccounts: UserAccount[];
  rawMisRemarks: MisRemarkItem[];
  hiddenItemsRegistry: HiddenItemRecord[];
  toggleItemVisibility: (
    entityType: HideableEntityType,
    id: string,
    targetCompanyId?: string,
    forceState?: boolean,
  ) => void;
  unhideAllItems: (entityType?: HideableEntityType) => void;

  // Textile Export Garment Accounts & Finance Team KPI & KRA
  financeDepartments: FinanceDepartmentConfig[];
  updateFinanceDepartment: (dept: FinanceDepartmentConfig) => void;
  financeTeamMembers: FinanceTeamMemberKpi[];
  addFinanceTeamMember: (member: Omit<FinanceTeamMemberKpi, "id">) => void;
  updateFinanceTeamMember: (member: FinanceTeamMemberKpi) => void;
  deleteFinanceTeamMember: (memberId: string) => void;
  markMemberPerformance: (
    memberId: string,
    rating: PerformanceIndicator,
    mode?: PerformanceEvaluationMode,
    notes?: string,
  ) => void;
  addMemberKpi: (memberId: string, kpi: Omit<TeamKpiItem, "id">) => void;
  updateMemberKpi: (memberId: string, kpi: TeamKpiItem) => void;
  deleteMemberKpi: (memberId: string, kpiId: string) => void;
  resetFinanceTeamKpiToDefault: () => void;

  // Visual Color Theme (Sapphire, Emerald, Amethyst, Oceanic)
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;

  // Automated Reminder & Escalation Center (Mail & WhatsApp)
  isReminderCenterOpen: boolean;
  setIsReminderCenterOpen: (open: boolean) => void;
  reminderCenterDefaultSource: ReminderSource | "all";
  openReminderCenter: (source?: ReminderSource | "all") => void;
  reminderPreviewItem: ReminderItem | null;
  setReminderPreviewItem: (item: ReminderItem | null) => void;
  openReminderPreviewForItem: (rawItem: any, source: ReminderSource) => void;
}

// Keep one context instance across hot reloads so the provider and consumers stay matched.
const ctxStore = globalThis as { __vcfoAppContext?: React.Context<AppContextType | undefined> };
const AppContext =
  ctxStore.__vcfoAppContext ??
  (ctxStore.__vcfoAppContext = createContext<AppContextType | undefined>(undefined));

const COMPLIANCES_KEY = "vcfo_compliances_v1";
const ACTIONS_KEY = "vcfo_actions_v1";
const MIS_KEY = "vcfo_mis_v1";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Dynamic Companies list with localStorage recovery & Supabase database sync
  const [rawCompanies, setCompanies] = useState<ClientProfile[]>(() => {
    return recoverCustomCompaniesFromLocalStorage() as ClientProfile[];
  });

  const companies = useMemo(() => {
    const visible = rawCompanies.filter((c) => !c.isHidden);
    return visible.length > 0 ? visible : rawCompanies;
  }, [rawCompanies]);

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_companies_list_v2", JSON.stringify(rawCompanies));
    } catch {}
  }, [rawCompanies]);

  // User Accounts list with localStorage (strictly respects deletions & user customizations)
  const [rawUserAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    return recoverCustomUsersFromLocalStorage(rawCompanies) as UserAccount[];
  });

  const userAccounts = useMemo(() => {
    return rawUserAccounts.filter((u) => !u.isHidden);
  }, [rawUserAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_user_accounts_list_v1", JSON.stringify(rawUserAccounts));
    } catch {}
  }, [rawUserAccounts]);

  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem("vcfo_user_account_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          const matchInList = rawUserAccounts.find(
            (u) =>
              u.id === parsed.id ||
              (u.email && parsed.email && u.email.toLowerCase() === parsed.email.toLowerCase()),
          );
          if (matchInList) return matchInList;
        }
      }
    } catch {}
    return rawUserAccounts[0] || DEFAULT_USERS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [role, setRoleState] = useState<Role>(() => currentUser?.role || "cfo");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<
    | "dashboard"
    | "compliances"
    | "actions"
    | "action_flow"
    | "mis"
    | "repository"
    | "admin"
  >("dashboard");
  const [misSubTab, setMisSubTab] = useState<MisSubTab>("balance-sheet");
  const [misUploads, setMisUploads] = useState<MisUploadRecord[]>([]);

  // Map Supabase DB row to application ClientProfile
  const mapDbCompanyToProfile = useCallback((row: any): ClientProfile => {
    return {
      id: row.id,
      companyName: row.company_name,
      legalEntity: row.legal_entity || "Private Limited Company",
      gstin: row.gstin || "",
      pan: row.pan || "",
      cin: row.cin || "",
      financialYear: row.financial_year || "FY 2026-27",
      cfoName: row.cfo_name || "Sudhakar",
      assignedCfo: row.cfo_name || "Sudhakar",
      cfoFirm: row.cfo_firm || "Goyal & Associates",
      sector: row.sector || "General",
    };
  }, []);

  // Synchronization with Supabase Database & Auth Session
  const syncSupabase = useCallback(async () => {
    try {
      // 1. Sync User Profile & Role from Supabase Auth (or local stored session)
      const authRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const user = authRes?.data?.session?.user;
      if (!user) {
        const isLocallyAuth =
          typeof window !== "undefined" &&
          (localStorage.getItem("vcfo_is_authenticated") === "true" ||
            localStorage.getItem("vcfo_preview_role") !== null);

        if (isLocallyAuth || !isSupabaseConfigured) {
          const previewRole =
            typeof window !== "undefined"
              ? (localStorage.getItem("vcfo_preview_role") as Role) || "cfo"
              : "cfo";

          let matchedUser: UserAccount | undefined;
          try {
            const rawSaved = typeof window !== "undefined" ? localStorage.getItem("vcfo_user_account_v2") : null;
            if (rawSaved) {
              matchedUser = JSON.parse(rawSaved);
            }
          } catch {}

          if (!matchedUser) {
            matchedUser =
              rawUserAccounts.find((u) => u.role === previewRole) || rawUserAccounts[0];
          }

          if (matchedUser) {
            setCurrentUser(matchedUser);
            setRoleState(matchedUser.role);
            setIsCfoAdmin(matchedUser.role === "cfo");
          }
          setIsAuthenticated(true);
          setIsAuthLoading(false);
          return;
        }
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return;
      }

      const [profRes, rolesRes, userAccessRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("user_company_access")
          .select("company_id, access_level")
          .eq("user_id", user.id),
      ]);

      const userRoles = ((rolesRes.data ?? []) as { role: string }[]).map((r) => r.role);
      const metaRole = user.user_metadata?.role;
      const isUserAdmin =
        userRoles.includes("admin") ||
        userRoles.includes("cfo") ||
        (userRoles.length === 0 && (metaRole === "cfo" || metaRole === "admin" || !metaRole));
      const derivedRole: Role = isUserAdmin
        ? "cfo"
        : userRoles.includes("client_team") || metaRole === "client_team"
          ? "client_team"
          : "client";

      const recoveredComps = recoverCustomCompaniesFromLocalStorage() as ClientProfile[];
      const firstValidCompId = recoveredComps[0]?.id || "client-101";

      const assignedCompIds = ((userAccessRes.data ?? []) as { company_id: string }[]).map(
        (a) => a.company_id,
      );

      // Match against user's existing customized accounts in vcfo_user_accounts_list_v1
      let matchedExistingUser: UserAccount | undefined;
      try {
        const savedUsersRaw = localStorage.getItem("vcfo_user_accounts_list_v1");
        const savedUsersList: UserAccount[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
        matchedExistingUser =
          savedUsersList.find(
            (u) =>
              u.email &&
              user.email &&
              u.email.toLowerCase() === user.email.toLowerCase() &&
              !UUID_REGEX.test(String(u.id || "")),
          ) ||
          savedUsersList.find(
            (u) => u.role === derivedRole && !UUID_REGEX.test(String(u.id || "")),
          ) ||
          savedUsersList.find((u) => u.role === derivedRole);
      } catch {}

      const primaryCompanyId = isUserAdmin
        ? "all"
        : matchedExistingUser?.companyId && matchedExistingUser.companyId !== "all"
          ? matchedExistingUser.companyId
          : assignedCompIds[0] || firstValidCompId;

      const fullName =
        matchedExistingUser?.name ||
        profRes.data?.full_name ||
        user.user_metadata?.full_name ||
        (user.email ?? "").split("@")[0] ||
        "Authenticated User";
      const initials =
        matchedExistingUser?.avatar ||
        fullName
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() ||
        "AU";

      const matchedCompObj =
        recoveredComps.find((c) => c.id === primaryCompanyId) || recoveredComps[0];

      const authenticatedAccount: UserAccount = {
        ...(matchedExistingUser || {}),
        id: matchedExistingUser?.id || user.id,
        name: fullName,
        email: matchedExistingUser?.email || user.email || "",
        role: derivedRole,
        avatar: initials,
        roleTitle:
          matchedExistingUser?.roleTitle ||
          profRes.data?.designation ||
          (derivedRole === "cfo"
            ? "Virtual CFO & Practice Partner"
            : derivedRole === "client_team"
              ? "Client Finance Team"
              : "Client Director"),
        companyId: primaryCompanyId,
        companyName:
          derivedRole === "cfo"
            ? matchedExistingUser?.companyName || "Virtual CFO Practice"
            : matchedCompObj?.companyName || matchedExistingUser?.companyName || "Client Entity",
        assignedCompanyIds: matchedExistingUser?.assignedCompanyIds || assignedCompIds,
        isAdmin: isUserAdmin,
      };

      setCurrentUser(authenticatedAccount);
      setRoleState(derivedRole);
      setIsCfoAdmin(isUserAdmin);
      setIsAuthenticated(true);
      if (!isUserAdmin && primaryCompanyId !== "all") {
        setSelectedCompanyIdState(primaryCompanyId);
        setCfoViewMode("single_company");
      } else if (isUserAdmin) {
        setCfoViewMode("portfolio");
      }

      // 2. Fetch Companies from Supabase Database (preserving user customizations & deletions)
      const { data: dbCompanies, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .order("company_name");

      if (!compErr && dbCompanies && dbCompanies.length > 0) {
        const mapped = dbCompanies.map(mapDbCompanyToProfile);
        const recovered = recoverCustomCompaniesFromLocalStorage() as ClientProfile[];
        const recoveredIds = new Set(recovered.map((r) => r.id));

        setCompanies((prev) => {
          const map = new Map<string, ClientProfile>();
          const base = recovered.length > 0 ? recovered : prev;
          base.forEach((c) => map.set(c.id, c));

          mapped.forEach((c) => {
            const existing = map.get(c.id);
            const isDefaultSeedId =
              c.id === "client-101" || c.id === "client-102" || c.id === "client-103";
            // Do not re-insert a default mock company if the user previously deleted it
            if (!existing && isDefaultSeedId && !recoveredIds.has(c.id)) {
              return;
            }
            if (existing) {
              // Preserve user-customized companyName & fields over un-customized seed rows
              const dbIsMockDefault =
                c.companyName.startsWith("Nexora Innovations") ||
                c.companyName.startsWith("Apex Global Logistics") ||
                c.companyName.startsWith("Zenith HealthTech");
              map.set(c.id, {
                ...c,
                ...existing,
                companyName: dbIsMockDefault
                  ? existing.companyName
                  : c.companyName || existing.companyName,
                cfoName:
                  existing.cfoName && !existing.cfoName.toLowerCase().includes("manish goyal")
                    ? existing.cfoName
                    : c.cfoName,
                assignedCfo:
                  existing.assignedCfo &&
                  !existing.assignedCfo.toLowerCase().includes("manish goyal")
                    ? existing.assignedCfo
                    : c.assignedCfo,
              });
            } else {
              map.set(c.id, c);
            }
          });
          return Array.from(map.values());
        });
      }

      // 3. Sync User Directory / Profiles from Supabase Database without overwriting custom local users
      const [allProfilesRes, allRolesRes, allAccessRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("is_active", true),
        supabase.from("user_roles").select("*"),
        supabase.from("user_company_access").select("*"),
      ]);

      if (!allProfilesRes.error && allProfilesRes.data && allProfilesRes.data.length > 0) {
        const rolesByUser = new Map<string, string[]>();
        (allRolesRes.data || []).forEach((r: any) => {
          const list = rolesByUser.get(r.user_id) || [];
          list.push(r.role);
          rolesByUser.set(r.user_id, list);
        });

        const accessByUser = new Map<string, string[]>();
        (allAccessRes.data || []).forEach((a: any) => {
          const list = accessByUser.get(a.user_id) || [];
          list.push(a.company_id);
          accessByUser.set(a.user_id, list);
        });

        const dbUsers: UserAccount[] = allProfilesRes.data.map((p: any) => {
          const uRoles = rolesByUser.get(p.id) || [];
          const isCfoOrAdmin = uRoles.includes("admin") || uRoles.includes("cfo");
          const mappedRole: Role = isCfoOrAdmin
            ? "cfo"
            : uRoles.includes("client")
              ? "client"
              : "client_team";
          const compIds = accessByUser.get(p.id) || [];
          const nameStr = (p.full_name || (p.email || "").split("@")[0] || "Team Member").trim();
          const uInitials =
            nameStr
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "TM";

          const targetCompId = isCfoOrAdmin ? "all" : compIds[0] || firstValidCompId;
          const compObj = recoveredComps.find((c) => c.id === targetCompId);

          return {
            id: p.id,
            name: nameStr,
            email: p.email || "",
            role: mappedRole,
            roleTitle:
              p.designation ||
              (mappedRole === "cfo"
                ? "Virtual CFO"
                : mappedRole === "client"
                  ? "Client Director"
                  : "Finance Team Member"),
            companyId: targetCompId,
            companyName: isCfoOrAdmin
              ? "Virtual CFO Practice"
              : compObj?.companyName || "Client Entity",
            assignedCompanyIds: compIds,
            avatar: uInitials,
            isAdmin: isCfoOrAdmin,
          };
        });

        setUserAccounts((prev) => {
          // Keep all user-customized accounts in prev; only append truly new DB users that don't duplicate an existing role/email
          const existingEmails = new Set(
            prev.map((u) => (u.email || "").toLowerCase()).filter(Boolean),
          );
          const existingIds = new Set(prev.map((u) => u.id));
          const hasCustomCfo = prev.some((u) => u.role === "cfo");

          const newDbUsers = dbUsers.filter((d) => {
            if (existingIds.has(d.id)) return false;
            if (d.email && existingEmails.has(d.email.toLowerCase())) return false;
            if (hasCustomCfo && d.role === "cfo" && UUID_REGEX.test(d.id)) return false;
            return true;
          });

          return [...prev, ...newDbUsers];
        });
      }

      // Trigger React Query refetches for all domain tables
      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
      void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_log"] });
      void queryClient.invalidateQueries({ queryKey: ["compliance_items"] });
      void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      void queryClient.invalidateQueries({ queryKey: ["budget_items"] });
      void queryClient.invalidateQueries({ queryKey: ["executive_reports"] });
      void queryClient.invalidateQueries({ queryKey: ["repository_matters"] });
    } catch (err) {
      console.warn("[AppContext] Supabase sync warning:", err);
    } finally {
      setIsAuthLoading(false);
    }
  }, [mapDbCompanyToProfile, queryClient]);

  useEffect(() => {
    void syncSupabase();

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void syncSupabase();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
      }
    });

    const compChannel = supabase
      .channel("supabase-core-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        void syncSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mis_uploads" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mis_remarks" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["audit_log"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "compliance_items" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["compliance_items"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "action_items" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_items" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["budget_items"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "executive_reports" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["executive_reports"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "repository_matters" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["repository_matters"] });
      })
      .subscribe();

    return () => {
      authSub.subscription.unsubscribe();
      void supabase.removeChannel(compChannel);
    };
  }, [syncSupabase, queryClient]);

  // CFO Admin Mode state (derived from server user_roles permissions)
  const [isCfoAdmin, setIsCfoAdmin] = useState<boolean>(true);

  // Security Protocols configuration (backed by database)
  const [securityProtocols, setSecurityProtocols] = useState<SecurityProtocolConfig>(
    DEFAULT_SECURITY_PROTOCOLS,
  );

  // Role Permissions Matrix (backed by database)
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissionsMap>(DEFAULT_ROLE_PERMISSIONS);

  // Specific Person Permissions Map (backed by database)
  const [userPermissions, setUserPermissions] =
    useState<Record<string, UserModulePermissions>>(DEFAULT_USER_PERMISSIONS);

  // Real-time Audit Logs backed by Supabase audit_log table & localStorage
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_audit_logs_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // MIS Operational Remarks & Explanations backed by Supabase mis_remarks table & localStorage
  const [rawMisRemarks, setMisRemarks] = useState<MisRemarkItem[]>(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_mis_remarks_v2") || localStorage.getItem("vcfo_mis_remarks_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const misRemarks = useMemo(() => {
    return rawMisRemarks.filter((r) => !r.isHidden);
  }, [rawMisRemarks]);

  // Selected company ID (strictly enforced for non-CFO roles)
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>(() => {
    const firstId = companies[0]?.id || "client-101";
    if (currentUser.role !== "cfo") {
      return currentUser.companyId && currentUser.companyId !== "all"
        ? currentUser.companyId
        : firstId;
    }
    try {
      const saved = localStorage.getItem("vcfo_active_company_v2");
      if (saved && companies.some((c) => c.id === saved)) return saved;
    } catch {}
    return firstId;
  });

  // CFO view mode: 'portfolio' (All Companies Overview) or 'single_company'
  const [cfoViewMode, setCfoViewMode] = useState<"portfolio" | "single_company">(() => {
    return currentUser.role === "cfo" ? "portfolio" : "single_company";
  });

  // Active company ID (locked to user's assigned company for client and client_team)
  const activeCompanyId = useMemo(() => {
    const firstId = companies[0]?.id || "client-101";
    if (currentUser.role !== "cfo") {
      return currentUser.companyId && currentUser.companyId !== "all"
        ? currentUser.companyId
        : firstId;
    }
    return companies.some((c) => c.id === selectedCompanyId) ? selectedCompanyId : firstId;
  }, [currentUser.role, currentUser.companyId, selectedCompanyId, companies]);

  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceItem | null>(null);
  const [complianceProofModalTarget, setComplianceProofModalTarget] =
    useState<ComplianceItem | null>(null);
  const [complianceProofViewTarget, setComplianceProofViewTarget] = useState<{
    compliance: ComplianceItem;
    proof: ComplianceProofDocument;
  } | null>(null);

  const openComplianceProofModal = (comp: ComplianceItem) => {
    setComplianceProofModalTarget(comp);
  };

  const closeComplianceProofModal = () => {
    setComplianceProofModalTarget(null);
  };

  const openComplianceProofView = (comp: ComplianceItem, proof?: ComplianceProofDocument) => {
    const docToView =
      proof || comp.completionProofDoc || (comp.completionProofDocs && comp.completionProofDocs[0]);
    if (docToView) {
      setComplianceProofViewTarget({ compliance: comp, proof: docToView });
    } else {
      setComplianceProofModalTarget(comp);
    }
  };

  const closeComplianceProofView = () => {
    setComplianceProofViewTarget(null);
  };

  const [isNewActionModalOpen, setIsNewActionModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: "ALL",
    status: "ALL",
    assignee: "ALL",
    searchQuery: "",
    frequency: "ALL",
  });

  const resetFilters = () => {
    setFilterOptions({
      category: "ALL",
      status: "ALL",
      assignee: "ALL",
      searchQuery: "",
      frequency: "ALL",
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Statutory Compliance Calendar cycle selection (defaults dynamically to current month from system Date)
  const [selectedComplianceMonth, setSelectedComplianceMonthState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("vcfo_selected_compliance_month_v1");
      if (
        saved &&
        (saved === "ALL" ||
          saved === "EARLIER_PENDING" ||
          saved === "PROSPECTIVE_FY" ||
          /^\d{4}-\d{2}$/.test(saved))
      ) {
        return saved;
      }
    } catch {}
    return getCurrentMonthKey();
  });

  const setSelectedComplianceMonth = useCallback((monthKey: string) => {
    setSelectedComplianceMonthState(monthKey);
    try {
      localStorage.setItem("vcfo_selected_compliance_month_v1", monthKey);
    } catch {}
  }, []);

  // Quick-hide completed compliances toggle
  const [hideCompletedCompliances, setHideCompletedCompliancesState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vcfo_hide_completed_compliances_v1");
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  const setHideCompletedCompliances = useCallback((hide: boolean) => {
    setHideCompletedCompliancesState(hide);
    try {
      localStorage.setItem("vcfo_hide_completed_compliances_v1", String(hide));
    } catch {}
  }, []);

  const toggleHideCompletedCompliances = useCallback(() => {
    setHideCompletedCompliancesState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("vcfo_hide_completed_compliances_v1", String(next));
      } catch {}
      showToast(
        next
          ? "Completed compliances are now hidden from view."
          : "Showing all compliances including completed filings.",
      );
      return next;
    });
  }, [showToast]);

  // Auto-hide previous months completed compliances (defaults to true)
  const [autoHideEarlierCompleted, setAutoHideEarlierCompletedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vcfo_auto_hide_earlier_completed_v1");
      if (saved !== null) return saved === "true";
    } catch {}
    return true; // Default to true: automatic regular monthly comes in, completed previous months auto-hidden
  });

  const setAutoHideEarlierCompleted = useCallback((hide: boolean) => {
    setAutoHideEarlierCompletedState(hide);
    try {
      localStorage.setItem("vcfo_auto_hide_earlier_completed_v1", String(hide));
    } catch {}
  }, []);

  const toggleAutoHideEarlierCompleted = useCallback(() => {
    setAutoHideEarlierCompletedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("vcfo_auto_hide_earlier_completed_v1", String(next));
      } catch {}
      showToast(
        next
          ? "Previous months completed filings auto-hidden. Showing existing month + earlier pending."
          : "Showing previous months completed compliance filings.",
      );
      return next;
    });
  }, [showToast]);

  // Multi-company compliances state hydrated from localStorage & Supabase compliance_items
  const [allCompliancesMap, setAllCompliancesMap] = useState<Record<string, ComplianceItem[]>>(
    () => {
      try {
        const saved =
          localStorage.getItem("vcfo_compliances_all_v4") ||
          localStorage.getItem("vcfo_compliances_all_v3") ||
          localStorage.getItem("vcfo_compliances_all_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed) &&
            Object.keys(parsed).length > 0
          ) {
            return parsed;
          }
        }
      } catch {}
      return ALL_COMPANIES_COMPLIANCES;
    },
  );

  useEffect(() => {
    if (Object.keys(allCompliancesMap).length > 0) {
      try {
        localStorage.setItem("vcfo_compliances_all_v4", JSON.stringify(allCompliancesMap));
      } catch {}
    }
  }, [allCompliancesMap]);

  // Multi-company action items state hydrated from localStorage & Supabase action_items
  const [allActionsMap, setAllActionsMap] = useState<Record<string, ActionItem[]>>(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_actions_all_v3") || localStorage.getItem("vcfo_actions_all_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    if (Object.keys(allActionsMap).length > 0) {
      try {
        localStorage.setItem("vcfo_actions_all_v3", JSON.stringify(allActionsMap));
      } catch {}
    }
  }, [allActionsMap]);

  // Multi-company MIS state hydrated from localStorage & Supabase mis_uploads
  const [allMISMap, setAllMISMap] = useState<Record<string, FinancialMIS>>(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_mis_all_v2") || localStorage.getItem("vcfo_mis_all_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { ...COMPANY_FINANCIAL_MIS, ...parsed };
        }
      }
    } catch {}
    return COMPANY_FINANCIAL_MIS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_mis_all_v2", JSON.stringify(allMISMap));
    } catch {}
  }, [allMISMap]);

  // Multi-company Budget & Variance state hydrated from localStorage & Supabase budget_items
  const [allBudgetMap, setAllBudgetMap] = useState<Record<string, BudgetLineItem[]>>(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_budgets_all_v2") || localStorage.getItem("vcfo_budgets_all_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    if (Object.keys(allBudgetMap).length > 0) {
      try {
        localStorage.setItem("vcfo_budgets_all_v2", JSON.stringify(allBudgetMap));
      } catch {}
    }
  }, [allBudgetMap]);

  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState<BudgetMonthKey>("sep");

  // Multi-company CFO Monthly Executive Reports hydrated from localStorage & Supabase executive_reports
  const [executiveReports, setExecutiveReports] = useState<
    Record<string, MonthlyExecutiveReport[]>
  >(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_executive_reports_v3") ||
        localStorage.getItem("vcfo_executive_reports_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    if (Object.keys(executiveReports).length > 0) {
      try {
        localStorage.setItem("vcfo_executive_reports_v3", JSON.stringify(executiveReports));
      } catch {}
    }
  }, [executiveReports]);

  // Corporate Repository hydrated from localStorage & Supabase repository_matters
  const [allTaxAssessments, setAllTaxAssessments] = useState<TaxAssessmentMatter[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_repository_tax_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_TAX_ASSESSMENTS;
  });

  const [allLegalCases, setAllLegalCases] = useState<LegalCaseMatter[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_repository_legal_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_LEGAL_CASES;
  });

  const [allLicenses, setAllLicenses] = useState<LicenseCertificationMatter[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_repository_licenses_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_LICENSES;
  });

  const [allSops, setAllSops] = useState<SopMatter[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_repository_sops_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_SOPS;
  });

  useEffect(() => {
    if (allTaxAssessments.length > 0) {
      try {
        localStorage.setItem("vcfo_repository_tax_v2", JSON.stringify(allTaxAssessments));
      } catch {}
    }
  }, [allTaxAssessments]);

  useEffect(() => {
    if (allLegalCases.length > 0) {
      try {
        localStorage.setItem("vcfo_repository_legal_v2", JSON.stringify(allLegalCases));
      } catch {}
    }
  }, [allLegalCases]);

  useEffect(() => {
    if (allLicenses.length > 0) {
      try {
        localStorage.setItem("vcfo_repository_licenses_v2", JSON.stringify(allLicenses));
      } catch {}
    }
  }, [allLicenses]);

  useEffect(() => {
    if (allSops.length > 0) {
      try {
        localStorage.setItem("vcfo_repository_sops_v2", JSON.stringify(allSops));
      } catch {}
    }
  }, [allSops]);

  const [allActionFlowTasks, setAllActionFlowTasks] = useState<ActionFlowTask[]>([]);

  // Live @tanstack/react-query hooks for Supabase tables
  useQuery({
    queryKey: ["mis_uploads", isAuthenticated, activeCompanyId, role, cfoViewMode],
    enabled: isAuthenticated,
    queryFn: async () => {
      let q = supabase.from("mis_uploads").select("*").order("created_at", { ascending: false });
      if (role !== "cfo" || cfoViewMode === "single_company") {
        if (activeCompanyId && activeCompanyId !== "all") {
          q = q.eq("company_id", activeCompanyId);
        }
      }
      const { data: dbUploads, error } = await q;
      if (error || !dbUploads) return [];

      const mappedUploads: MisUploadRecord[] = dbUploads.map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        period: row.period,
        statementType: row.statement_type,
        fileName: row.file_name,
        rowCount: row.row_count,
        rows: row.rows,
        status: row.status,
        uploadedBy: row.uploaded_by,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        reviewNote: row.review_note,
        createdAt: row.created_at,
      }));
      setMisUploads(mappedUploads);

      const chronological = [...mappedUploads].filter((u) => u.status !== "rejected").reverse();
      if (chronological.length > 0) {
        setAllMISMap((prevMisMap) => {
          const nextMisMap = { ...prevMisMap };
          chronological.forEach((u) => {
            if (
              (u.statementType === "full_mis" ||
                u.statementType === "financial_mis" ||
                u.statementType === "erp_mis" ||
                u.statementType === "overview") &&
              u.rows &&
              typeof u.rows === "object" &&
              !Array.isArray(u.rows)
            ) {
              const base = nextMisMap[u.companyId] || INITIAL_FINANCIAL_MIS;
              nextMisMap[u.companyId] = {
                ...base,
                ...(u.rows as Partial<FinancialMIS>),
                period: u.period || (u.rows as any).period || base.period,
              };
            }
          });
          return nextMisMap;
        });

        setAllBudgetMap((prevBgtMap) => {
          const nextBgtMap = { ...prevBgtMap };
          chronological.forEach((u) => {
            if (
              (u.statementType === "budget" || u.statementType.startsWith("budget_")) &&
              Array.isArray(u.rows)
            ) {
              const rawMonth = u.statementType.startsWith("budget_")
                ? u.statementType.replace("budget_", "")
                : String(u.period || "sep")
                    .slice(0, 3)
                    .toLowerCase();
              const monthKey = (rawMonth || "sep") as BudgetMonthKey;
              const currentList = nextBgtMap[u.companyId] || [];
              if (currentList.length > 0) {
                nextBgtMap[u.companyId] = currentList.map((item) => {
                  const match = (u.rows as any[]).find(
                    (r) =>
                      (r.code &&
                        String(r.code).trim().toUpperCase() === item.code.trim().toUpperCase()) ||
                      (r.name &&
                        String(r.name).trim().toLowerCase() === item.name.trim().toLowerCase()),
                  );
                  if (match && typeof match.actual === "number" && !isNaN(match.actual)) {
                    return {
                      ...item,
                      monthly: {
                        ...item.monthly,
                        [monthKey]: {
                          ...item.monthly[monthKey],
                          actual: match.actual,
                          notes: match.notes || item.monthly[monthKey]?.notes,
                        },
                      },
                    };
                  }
                  return item;
                });
              }
            }
          });
          return nextBgtMap;
        });
      }
      return mappedUploads;
    },
  });

  useQuery({
    queryKey: ["mis_remarks", isAuthenticated, activeCompanyId, role, cfoViewMode],
    enabled: isAuthenticated,
    queryFn: async () => {
      let q = supabase.from("mis_remarks").select("*").order("created_at", { ascending: false });
      if (role !== "cfo" || cfoViewMode === "single_company") {
        if (activeCompanyId && activeCompanyId !== "all") {
          q = q.eq("company_id", activeCompanyId);
        }
      }
      const { data: dbRemarks, error } = await q;
      if (error || !dbRemarks) return [];

      const sectionTitleMap: Record<string, string> = {
        overview: "Executive Financial Overview",
        "balance-sheet": "Balance Sheet & Working Capital",
        pnl: "Profit & Loss Statement",
        "debtor-ageing": "Debtor & MSME Creditor Ageing",
        "cash-flow": "3-Month Cash Flow & Treasury",
        "fund-flow": "Fund Flow Statement",
        budget: "Budget vs Actuals Variance",
      };
      const mappedRemarks: MisRemarkItem[] = dbRemarks.map((row: any) => {
        const sec = (row.page_key || row.section || "overview") as MisRemarkItem["section"];
        const rawBody = String(row.remark ?? row.body ?? "");
        const parsedTitle =
          row.line_ref ||
          (rawBody.includes(" — ")
            ? rawBody.split(" — ")[0]
            : `${sectionTitleMap[sec] || "MIS"} Remark`);
        const parsedReason =
          !row.line_ref && rawBody.includes(" — ")
            ? rawBody.split(" — ").slice(1).join(" — ")
            : rawBody;
        return {
          id: row.id,
          companyId: row.company_id,
          section: sec,
          sectionTitle: row.reason_category || sectionTitleMap[sec] || "Financial MIS",
          title: parsedTitle,
          reason: parsedReason,
          role: (row.author_role === "admin" ? "cfo" : row.author_role || "client") as Role,
          authorName: row.author_name || "Workspace User",
          createdAt: new Date(row.created_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: row.cfo_response ? "resolved" : "open",
          cfoFeedback: row.cfo_response || undefined,
        };
      });
      setMisRemarks(mappedRemarks);
      return mappedRemarks;
    },
  });

  useQuery({
    queryKey: ["audit_log", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data: dbAudit, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error || !dbAudit) return [];

      const mappedAudit: AuditLogItem[] = dbAudit.map((row: any) => {
        const detailsObj = row.details && typeof row.details === "object" ? row.details : {};
        const compId = row.company_id || detailsObj.companyId || "all";
        const compName =
          detailsObj.companyName ||
          rawCompanies.find((c) => c.id === compId)?.companyName ||
          "Global System";
        return {
          id: row.id,
          timestamp: new Date(row.created_at).toISOString().replace("T", " ").substring(0, 19),
          userId: row.actor_id || "system",
          userName: detailsObj.actorName || row.actor_email || "Authenticated User",
          role: (detailsObj.actorRole || "cfo") as Role,
          companyId: compId,
          companyName: compName,
          action: (row.action || "MIS_METRIC_UPDATE") as AuditLogItem["action"],
          details:
            typeof detailsObj.message === "string"
              ? detailsObj.message
              : JSON.stringify(row.details || {}),
          ipAddress: detailsObj.ipAddress || "Supabase RLS Session",
          status: (detailsObj.status || "success") as "success" | "warning" | "blocked",
        };
      });
      setAuditLogs(mappedAudit);
      return mappedAudit;
    },
  });

  useQuery({
    queryKey: ["compliance_items", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_items")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error || !data || data.length === 0) return {};
      const byCompany: Record<string, ComplianceItem[]> = {};
      data.forEach((row: any) => {
        const compId = row.company_id;
        if (!compId) return;
        if (!byCompany[compId]) byCompany[compId] = [];
        const itemData = (
          row.data && typeof row.data === "object" ? row.data : {}
        ) as ComplianceItem;
        byCompany[compId].push({
          ...itemData,
          id: itemData.id || row.id,
          name: itemData.name || row.compliance_name || row.code || "Compliance Task",
          category: (row.category || itemData.category || "GST") as any,
          status: (row.status || itemData.status || "Pending") as any,
          frequency: (row.frequency || itemData.frequency || "Monthly") as any,
          criticality: (row.criticality || itemData.criticality || "Medium") as any,
          statutoryDueDate: row.statutory_due_date_rule || itemData.statutoryDueDate || "",
          applicability: row.applicability || itemData.applicability || "",
          type: (row.form_type || itemData.type || "Return") as any,
        });
      });
      if (Object.keys(byCompany).length > 0) {
        setAllCompliancesMap(byCompany);
      }
      return byCompany;
    },
  });

  useQuery({
    queryKey: ["action_items", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error || !data) return { byCompany: {}, flowTasks: [] };
      const byCompany: Record<string, ActionItem[]> = {};
      const flowTasks: ActionFlowTask[] = [];
      data.forEach((row: any) => {
        const compId = row.company_id;
        const payload = (row.data && typeof row.data === "object" ? row.data : {}) as any;
        if (payload.__kind === "action_flow" || Array.isArray(payload.milestones)) {
          const { __kind, ...taskObj } = payload;
          flowTasks.push({
            ...taskObj,
            id: taskObj.id || row.id,
            companyId: taskObj.companyId || compId,
            status: row.status || taskObj.status || "pending",
          });
        } else {
          if (!byCompany[compId]) byCompany[compId] = [];
          byCompany[compId].push({
            ...payload,
            id: payload.id || row.id,
            companyId: payload.companyId || compId,
            status: (row.status || payload.status || "Pending") as ActionStatus,
          });
        }
      });
      setAllActionsMap(byCompany);
      setAllActionFlowTasks(flowTasks);
      return { byCompany, flowTasks };
    },
  });

  useQuery({
    queryKey: ["budget_items", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error || !data) return {};
      const byCompany: Record<string, BudgetLineItem[]> = {};
      data.forEach((row: any) => {
        const compId = row.company_id;
        if (!byCompany[compId]) byCompany[compId] = [];
        const itemData = (
          row.data && typeof row.data === "object" ? row.data : {}
        ) as BudgetLineItem;
        byCompany[compId].push({
          ...itemData,
          id: itemData.id || row.id,
        });
      });
      setAllBudgetMap(byCompany);
      return byCompany;
    },
  });

  useQuery({
    queryKey: ["executive_reports", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executive_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error || !data) return {};
      const byCompany: Record<string, MonthlyExecutiveReport[]> = {};
      data.forEach((row: any) => {
        const compId = row.company_id;
        if (!byCompany[compId]) byCompany[compId] = [];
        const repData = (
          row.data && typeof row.data === "object" ? row.data : {}
        ) as MonthlyExecutiveReport;
        byCompany[compId].push({
          ...repData,
          id: repData.id || row.id,
          companyId: repData.companyId || compId,
          monthKey: row.month_key || repData.monthKey || "",
          status: (row.status || repData.status || "published") as any,
        });
      });
      setExecutiveReports(byCompany);
      return byCompany;
    },
  });

  useQuery({
    queryKey: ["repository_matters", isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repository_matters")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error || !data) return [];
      const tax: TaxAssessmentMatter[] = [];
      const legal: LegalCaseMatter[] = [];
      const lic: LicenseCertificationMatter[] = [];
      const sopList: SopMatter[] = [];
      data.forEach((row: any) => {
        const itemData = (row.data && typeof row.data === "object" ? row.data : {}) as any;
        const normalized = {
          ...itemData,
          id: itemData.id || row.id,
          companyId: itemData.companyId || row.company_id,
          progressUpdates: Array.isArray(itemData.progressUpdates) ? itemData.progressUpdates : [],
          documents: Array.isArray(itemData.documents) ? itemData.documents : [],
        };
        if (row.matter_type === "tax_assessment") tax.push(normalized);
        else if (row.matter_type === "legal_case") legal.push(normalized);
        else if (row.matter_type === "license_certification") lic.push(normalized);
        else if (row.matter_type === "sop") sopList.push(normalized);
      });
      setAllTaxAssessments(tax);
      setAllLegalCases(legal);
      setAllLicenses(lic);
      setAllSops(sopList);
      return data;
    },
  });

  const saveExecutiveReport = (report: MonthlyExecutiveReport) => {
    const reportId = report.id || makeUuid();
    const updatedReport: MonthlyExecutiveReport = {
      ...report,
      id: reportId,
      updatedAt: new Date().toISOString(),
    };
    setExecutiveReports((prev) => {
      const currentList = prev[report.companyId] || [];
      const existingIdx = currentList.findIndex(
        (r) =>
          r.id === reportId ||
          r.monthKey === report.monthKey ||
          r.month.toLowerCase() === report.month.toLowerCase(),
      );
      let updatedList: MonthlyExecutiveReport[];
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = updatedReport;
      } else {
        updatedList = [updatedReport, ...currentList];
      }
      return {
        ...prev,
        [report.companyId]: updatedList,
      };
    });

    setAllMISMap((prev) => {
      const currentMis = prev[report.companyId] || INITIAL_FINANCIAL_MIS;
      const pointwiseText =
        Array.isArray(report.summaryPoints) && report.summaryPoints.length > 0
          ? report.summaryPoints.map((pt, idx) => `${idx + 1}. ${pt}`).join("\n")
          : report.executiveSummary;
      return {
        ...prev,
        [report.companyId]: {
          ...currentMis,
          cfoExecutiveSummary: pointwiseText || currentMis.cfoExecutiveSummary,
          cfoKeyAlerts:
            Array.isArray(report.cfoDirectives) && report.cfoDirectives.length > 0
              ? report.cfoDirectives
              : currentMis.cfoKeyAlerts,
        },
      };
    });

    void (async () => {
      const dbId = toUuid(reportId, report.companyId);
      const { error } = await supabase.from("executive_reports").upsert({
        id: dbId,
        company_id: report.companyId || activeCompanyId,
        month_key: report.monthKey || report.month || "",
        status: (report as any).status || "published",
        updated_at: new Date().toISOString(),
        data: updatedReport as any,
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["executive_reports"] });
        void logAuditEvent(
          "EXECUTIVE_REPORT_SAVED",
          "executive_reports",
          dbId,
          report.companyId || activeCompanyId,
          { message: `Saved executive report "${report.title || report.month}"` },
        );
      }
    })();
  };

  const deleteExecutiveReport = (companyId: string, reportId: string) => {
    setExecutiveReports((prev) => {
      const currentList = prev[companyId] || [];
      return {
        ...prev,
        [companyId]: currentList.filter((r) => r.id !== reportId),
      };
    });
    showToast("Report removed.");

    void (async () => {
      const dbId = toUuid(reportId, companyId);
      const { error } = await supabase.from("executive_reports").delete().eq("id", dbId);
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["executive_reports"] });
        void logAuditEvent("EXECUTIVE_REPORT_DELETED", "executive_reports", dbId, companyId, {
          message: `Deleted executive report (${reportId})`,
        });
      }
    })();
  };

  const getReportsForCompany = (companyId: string) => {
    return (executiveReports[companyId] || [])
      .filter((r) => !r.isHidden)
      .map((r) => ({
        ...r,
        authorName: resolveMasterPersonName(r.authorName, "cfo", companyId),
      }));
  };

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_user_account_v2", JSON.stringify(currentUser));
    } catch (err) {
      console.error("Failed saving user account:", err);
    }
  }, [currentUser]);

  // Derived active repository items (and raw company-scoped items including hidden)
  const rawTaxAssessments = useMemo(() => {
    if (currentUser.role === "cfo" && cfoViewMode === "portfolio") {
      return allTaxAssessments;
    }
    return allTaxAssessments.filter(
      (item) => !item.companyId || item.companyId === activeCompanyId,
    );
  }, [allTaxAssessments, currentUser.role, cfoViewMode, activeCompanyId]);

  const taxAssessments = useMemo(() => {
    return rawTaxAssessments.filter((item) => !item.isHidden);
  }, [rawTaxAssessments]);

  const rawLegalCases = useMemo(() => {
    if (currentUser.role === "cfo" && cfoViewMode === "portfolio") {
      return allLegalCases;
    }
    return allLegalCases.filter((item) => !item.companyId || item.companyId === activeCompanyId);
  }, [allLegalCases, currentUser.role, cfoViewMode, activeCompanyId]);

  const legalCases = useMemo(() => {
    return rawLegalCases.filter((item) => !item.isHidden);
  }, [rawLegalCases]);

  const rawLicenses = useMemo(() => {
    if (currentUser.role === "cfo" && cfoViewMode === "portfolio") {
      return allLicenses;
    }
    return allLicenses.filter((item) => !item.companyId || item.companyId === activeCompanyId);
  }, [allLicenses, currentUser.role, cfoViewMode, activeCompanyId]);

  const licenses = useMemo(() => {
    return rawLicenses.filter((item) => !item.isHidden);
  }, [rawLicenses]);

  const rawSops = useMemo(() => {
    if (currentUser.role === "cfo" && cfoViewMode === "portfolio") {
      return allSops;
    }
    return allSops.filter((item) => !item.companyId || item.companyId === activeCompanyId);
  }, [allSops, currentUser.role, cfoViewMode, activeCompanyId]);

  const sops = useMemo(() => {
    return rawSops.filter((item) => !item.isHidden);
  }, [rawSops]);

  const logAuditEvent = useCallback(
    async (
      action: string,
      entity: string,
      entityId: string,
      companyId?: string | null,
      details?: Record<string, any> | string,
    ) => {
      const targetCompId =
        companyId !== undefined
          ? companyId
          : activeCompanyId && activeCompanyId !== "all"
            ? activeCompanyId
            : null;
      const compName =
        (targetCompId && rawCompanies.find((c) => c.id === targetCompId)?.companyName) ||
        rawCompanies[0]?.companyName ||
        "Global System";
      const messageStr =
        typeof details === "string"
          ? details
          : details?.message || `${action} on ${entity} (${entityId})`;
      const statusVal = (typeof details === "object" && details?.status) || "success";

      const newLog: AuditLogItem = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        companyId: targetCompId || "all",
        companyName: compName,
        action: action as AuditLogItem["action"],
        details: messageStr,
        ipAddress: "Supabase RLS Session",
        status: statusVal,
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const actorUuid = sessionData?.session?.user?.id || null;
        const actorEmail = sessionData?.session?.user?.email || currentUser.email || null;
        const detailsPayload =
          typeof details === "string"
            ? {
                message: details,
                status: statusVal,
                actorName: currentUser.name,
                actorRole: currentUser.role,
                companyId: targetCompId || "all",
                companyName: compName,
              }
            : {
                ...details,
                message: messageStr,
                status: statusVal,
                actorName: currentUser.name,
                actorRole: currentUser.role,
                companyId: targetCompId || "all",
                companyName: compName,
              };

        const token = sessionData?.session?.access_token;
        if (token) {
          const res = await fetch("/api/admin/log-audit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action,
              entity,
              entityId,
              companyId: targetCompId,
              details: detailsPayload,
            }),
          });
          if (res.ok) {
            void queryClient.invalidateQueries({ queryKey: ["audit_log"] });
          }
        }
      } catch (err) {
        console.error("[Supabase] logAuditEvent error:", err);
      }
    },
    [activeCompanyId, rawCompanies, currentUser, queryClient],
  );

  const persistRepositoryMatter = (
    matterType: RepositoryItemType,
    matter: any,
    actionVerb: "CREATED" | "UPDATED" = "UPDATED",
  ) => {
    const compId = matter.companyId || activeCompanyId || "client-101";
    const dbId = toUuid(matter.id, compId);
    void (async () => {
      const { error } = await supabase.from("repository_matters").upsert({
        id: dbId,
        company_id: compId,
        matter_type: matterType,
        updated_at: new Date().toISOString(),
        data: { ...matter, id: dbId, companyId: compId },
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["repository_matters"] });
      }
      void logAuditEvent(`REPOSITORY_${actionVerb}`, "repository_matters", dbId, compId, {
        matterType,
        message: `${actionVerb === "CREATED" ? "Added" : "Updated"} ${matterType}: ${matter.matterTitle || matter.title || dbId}`,
      });
    })();
  };

  const removeRepositoryMatter = (
    matterType: RepositoryItemType,
    id: string,
    title?: string,
    compId?: string,
  ) => {
    const targetCompId = compId || activeCompanyId || "client-101";
    const dbId = toUuid(id, targetCompId);
    void (async () => {
      const { error } = await supabase.from("repository_matters").delete().eq("id", dbId);
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["repository_matters"] });
      }
      void logAuditEvent("REPOSITORY_DELETED", "repository_matters", dbId, targetCompId, {
        matterType,
        message: `Deleted ${matterType}: ${title || id}`,
        status: "warning",
      });
    })();
  };

  const persistActionFlowTask = (
    task: ActionFlowTask,
    actionVerb: "CREATED" | "UPDATED" = "UPDATED",
    customMessage?: string,
  ) => {
    const compId = task.companyId || activeCompanyId || "client-101";
    const dbId = toUuid(task.id, compId);
    void (async () => {
      const { error } = await supabase.from("action_items").upsert({
        id: dbId,
        company_id: compId,
        status: task.status || "pending",
        assigned_to: null,
        updated_at: new Date().toISOString(),
        data: { ...task, id: dbId, companyId: compId, __kind: "action_flow" },
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      }
      void logAuditEvent(`ACTION_FLOW_${actionVerb}`, "action_items", dbId, compId, {
        message:
          customMessage ||
          `${actionVerb === "CREATED" ? "Created" : "Updated"} action flow task "${task.title}"`,
      });
    })();
  };

  const persistActionItem = (
    item: ActionItem,
    actionVerb: "CREATED" | "UPDATED" = "UPDATED",
    customMessage?: string,
  ) => {
    const compId = item.companyId || activeCompanyId || "client-101";
    const dbId = toUuid(item.id, compId);
    void (async () => {
      const { error } = await supabase.from("action_items").upsert({
        id: dbId,
        company_id: compId,
        status: item.status || "Pending",
        assigned_to: null,
        updated_at: new Date().toISOString(),
        data: { ...item, id: dbId, companyId: compId },
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      }
      void logAuditEvent(`ACTION_ITEM_${actionVerb}`, "action_items", dbId, compId, {
        message:
          customMessage ||
          `${actionVerb === "CREATED" ? "Created" : "Updated"} action item "${item.title}"`,
      });
    })();
  };

  const persistComplianceItem = (
    item: ComplianceItem,
    compId?: string,
    actionVerb: "CREATED" | "UPDATED" = "UPDATED",
    customMessage?: string,
  ) => {
    const targetCompId = compId || activeCompanyId || "client-101";
    const dbId = toUuid(item.id, targetCompId);
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const createdBy = sessionData?.session?.user?.id || null;
      const { error } = await supabase.from("compliance_items").upsert({
        id: dbId,
        company_id: targetCompId,
        category: item.category || "GST",
        status: item.status || "Pending",
        created_by: createdBy,
        updated_at: new Date().toISOString(),
        data: { ...item, id: dbId },
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["compliance_items"] });
      }
      void logAuditEvent(`COMPLIANCE_${actionVerb}`, "compliance_items", dbId, targetCompId, {
        message:
          customMessage ||
          `${actionVerb === "CREATED" ? "Added" : "Updated"} compliance "${item.name}"`,
      });
    })();
  };

  const persistBudgetItem = (item: BudgetLineItem, compId?: string, customMessage?: string) => {
    const targetCompId = compId || activeCompanyId || "client-101";
    const dbId = toUuid(item.id, targetCompId);
    void (async () => {
      const { error } = await supabase.from("budget_items").upsert({
        id: dbId,
        company_id: targetCompId,
        updated_at: new Date().toISOString(),
        data: { ...item, id: dbId },
      });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["budget_items"] });
      }
      void logAuditEvent("BUDGET_ITEM_UPDATED", "budget_items", dbId, targetCompId, {
        message: customMessage || `Updated budget line item "${item.code} - ${item.name}"`,
      });
    })();
  };

  const addTaxAssessment = (
    matter: Omit<TaxAssessmentMatter, "id" | "progressUpdates" | "documents">,
  ) => {
    const comp = companies.find((c) => c.id === (matter.companyId || activeCompanyId));
    const newId = makeUuid();
    const newMatter: TaxAssessmentMatter = {
      ...matter,
      id: newId,
      companyId: matter.companyId || activeCompanyId,
      companyName: matter.companyName || comp?.companyName || "Client Entity",
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          author: currentUser.name,
          authorRole: currentUser.role,
          status: matter.status,
          notes: `Matter registered in repository by ${currentUser.name} (${currentUser.roleTitle}).`,
        },
      ],
      documents: [],
    };
    setAllTaxAssessments((prev) => [newMatter, ...prev]);
    persistRepositoryMatter("tax_assessment", newMatter, "CREATED");
    showToast(`Tax Assessment "${matter.matterTitle}" added to repository.`);
  };

  const updateTaxAssessment = (matter: TaxAssessmentMatter) => {
    setAllTaxAssessments((prev) => prev.map((m) => (m.id === matter.id ? matter : m)));
    persistRepositoryMatter("tax_assessment", matter, "UPDATED");
    showToast(`Tax assessment updated: ${matter.matterTitle}`);
  };

  const deleteTaxAssessment = (id: string) => {
    const existing = allTaxAssessments.find((m) => m.id === id);
    setAllTaxAssessments((prev) => prev.filter((m) => m.id !== id));
    removeRepositoryMatter("tax_assessment", id, existing?.matterTitle, existing?.companyId);
    showToast("Tax assessment deleted from repository.");
  };

  const addLegalCase = (matter: Omit<LegalCaseMatter, "id" | "progressUpdates" | "documents">) => {
    const comp = companies.find((c) => c.id === (matter.companyId || activeCompanyId));
    const newId = makeUuid();
    const newMatter: LegalCaseMatter = {
      ...matter,
      id: newId,
      companyId: matter.companyId || activeCompanyId,
      companyName: matter.companyName || comp?.companyName || "Client Entity",
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          author: currentUser.name,
          authorRole: currentUser.role,
          status: matter.status,
          notes: `Case docket initiated by ${currentUser.name} (${currentUser.roleTitle}).`,
        },
      ],
      documents: [],
    };
    setAllLegalCases((prev) => [newMatter, ...prev]);
    persistRepositoryMatter("legal_case", newMatter, "CREATED");
    showToast(`Legal Case "${matter.matterTitle}" added to repository.`);
  };

  const updateLegalCase = (matter: LegalCaseMatter) => {
    setAllLegalCases((prev) => prev.map((m) => (m.id === matter.id ? matter : m)));
    persistRepositoryMatter("legal_case", matter, "UPDATED");
    showToast(`Legal matter updated: ${matter.matterTitle}`);
  };

  const deleteLegalCase = (id: string) => {
    const existing = allLegalCases.find((m) => m.id === id);
    setAllLegalCases((prev) => prev.filter((m) => m.id !== id));
    removeRepositoryMatter("legal_case", id, existing?.matterTitle, existing?.companyId);
    showToast("Legal case deleted from repository.");
  };

  const addLicense = (
    matter: Omit<LicenseCertificationMatter, "id" | "progressUpdates" | "documents">,
  ) => {
    const comp = companies.find((c) => c.id === (matter.companyId || activeCompanyId));
    const newId = makeUuid();
    const newMatter: LicenseCertificationMatter = {
      ...matter,
      id: newId,
      companyId: matter.companyId || activeCompanyId,
      companyName: matter.companyName || comp?.companyName || "Client Entity",
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          author: currentUser.name,
          authorRole: currentUser.role,
          status: matter.status,
          notes: `License record logged by ${currentUser.name} (${currentUser.roleTitle}).`,
        },
      ],
      documents: [],
    };
    setAllLicenses((prev) => [newMatter, ...prev]);
    persistRepositoryMatter("license_certification", newMatter, "CREATED");
    showToast(`License/Certification "${matter.title}" added to repository.`);
  };

  const updateLicense = (matter: LicenseCertificationMatter) => {
    setAllLicenses((prev) => prev.map((m) => (m.id === matter.id ? matter : m)));
    persistRepositoryMatter("license_certification", matter, "UPDATED");
    showToast(`License record updated: ${matter.title}`);
  };

  const deleteLicense = (id: string) => {
    const existing = allLicenses.find((m) => m.id === id);
    setAllLicenses((prev) => prev.filter((m) => m.id !== id));
    removeRepositoryMatter("license_certification", id, existing?.title, existing?.companyId);
    showToast("License record deleted from repository.");
  };

  const addSop = (matter: Omit<SopMatter, "id" | "progressUpdates" | "documents">) => {
    const comp = companies.find((c) => c.id === (matter.companyId || activeCompanyId));
    const newId = makeUuid();
    const newMatter: SopMatter = {
      ...matter,
      id: newId,
      companyId: matter.companyId || activeCompanyId,
      companyName: matter.companyName || comp?.companyName || "Client Entity",
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          author: currentUser.name,
          authorRole: currentUser.role,
          status: matter.status,
          notes: `Standard Operating Procedure "${matter.title}" (${matter.sopCode}) registered by ${currentUser.name}.`,
        },
      ],
      documents: [],
    };
    setAllSops((prev) => [newMatter, ...prev]);
    persistRepositoryMatter("sop", newMatter, "CREATED");
    showToast(`SOP "${matter.sopCode}: ${matter.title}" added to repository.`);
  };

  const updateSop = (matter: SopMatter) => {
    setAllSops((prev) => prev.map((m) => (m.id === matter.id ? matter : m)));
    persistRepositoryMatter("sop", matter, "UPDATED");
    showToast(`SOP updated: ${matter.sopCode}`);
  };

  const deleteSop = (id: string) => {
    const existing = allSops.find((m) => m.id === id);
    setAllSops((prev) => prev.filter((m) => m.id !== id));
    removeRepositoryMatter("sop", id, existing?.sopCode, existing?.companyId);
    showToast("SOP deleted from repository.");
  };

  const addRepositoryProgressUpdate = (
    matterId: string,
    itemType: RepositoryItemType,
    update: { status: string; notes: string; documentRef?: string; nextSteps?: string },
  ) => {
    const newUpdate: RepositoryProgressUpdate = {
      id: `prog-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      author: currentUser.name,
      authorRole: currentUser.role,
      status: update.status,
      notes: update.notes,
      documentRef: update.documentRef,
      nextSteps: update.nextSteps,
    };

    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            status: (update.status as any) || m.status,
            progressUpdates: [newUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            status: (update.status as any) || m.status,
            progressUpdates: [newUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "license_certification") {
      setAllLicenses((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            status: (update.status as any) || m.status,
            progressUpdates: [newUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("license_certification", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "sop") {
      setAllSops((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            status: (update.status as any) || m.status,
            progressUpdates: [newUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("sop", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast("Progress & status update logged successfully.");
  };

  const uploadRepositoryDocument = (
    matterId: string,
    itemType: RepositoryItemType,
    doc: {
      title: string;
      category: RepositoryDocument["category"];
      fileName: string;
      fileType: string;
      fileSize: string;
      notes?: string;
    },
  ) => {
    const newDoc: RepositoryDocument = {
      id: `doc-${Date.now()}`,
      matterId,
      title: doc.title,
      category: doc.category,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedBy: currentUser.name,
      uploadedByRole: currentUser.role,
      uploadedAt: new Date().toISOString().split("T")[0],
      notes: doc.notes,
      downloadUrl: "#",
    };

    const logUpdate: RepositoryProgressUpdate = {
      id: `prog-doc-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      author: currentUser.name,
      authorRole: currentUser.role,
      status: "Document Uploaded",
      notes: `Uploaded ${doc.category}: "${doc.fileName}" (${doc.fileSize}). Notes: ${doc.notes || "None"}`,
      documentRef: doc.fileName,
    };

    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: [newDoc, ...m.documents],
            progressUpdates: [logUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: [newDoc, ...m.documents],
            progressUpdates: [logUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "license_certification") {
      setAllLicenses((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: [newDoc, ...m.documents],
            progressUpdates: [logUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("license_certification", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "sop") {
      setAllSops((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: [newDoc, ...m.documents],
            progressUpdates: [logUpdate, ...m.progressUpdates],
          };
          persistRepositoryMatter("sop", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast(`Document "${doc.fileName}" uploaded to matter repository.`);
  };

  const deleteRepositoryDocument = (
    matterId: string,
    itemType: RepositoryItemType,
    docId: string,
  ) => {
    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: m.documents.filter((d) => d.id !== docId),
          };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: m.documents.filter((d) => d.id !== docId),
          };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "license_certification") {
      setAllLicenses((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: m.documents.filter((d) => d.id !== docId),
          };
          persistRepositoryMatter("license_certification", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "sop") {
      setAllSops((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const next = {
            ...m,
            documents: m.documents.filter((d) => d.id !== docId),
          };
          persistRepositoryMatter("sop", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast("Document removed from repository.");
  };

  const addCaseChronologyEvent = (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    event: Omit<CaseChronologyEvent, "id">,
  ) => {
    const newEvent: CaseChronologyEvent = {
      ...event,
      id: `chrono-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recordedBy: event.recordedBy || currentUser.name,
      recordedByRole: event.recordedByRole || currentUser.role,
    };

    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = [newEvent, ...currentList].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          const next = {
            ...m,
            chronology: updated,
          };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = [newEvent, ...currentList].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          const next = {
            ...m,
            chronology: updated,
          };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast(`Chronological event "${event.title}" logged in repository.`);
  };

  const updateCaseChronologyEvent = (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    event: CaseChronologyEvent,
  ) => {
    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = currentList.map((e) => (e.id === event.id ? event : e));
          const next = { ...m, chronology: updated };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = currentList.map((e) => (e.id === event.id ? event : e));
          const next = { ...m, chronology: updated };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast(`Chronology event updated.`);
  };

  const deleteCaseChronologyEvent = (
    matterId: string,
    itemType: "tax_assessment" | "legal_case",
    eventId: string,
  ) => {
    if (itemType === "tax_assessment") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = currentList.filter((e) => e.id !== eventId);
          const next = { ...m, chronology: updated };
          persistRepositoryMatter("tax_assessment", next, "UPDATED");
          return next;
        }),
      );
    } else if (itemType === "legal_case") {
      setAllLegalCases((prev) =>
        prev.map((m) => {
          if (m.id !== matterId) return m;
          const currentList = Array.isArray(m.chronology) ? m.chronology : [];
          const updated = currentList.filter((e) => e.id !== eventId);
          const next = { ...m, chronology: updated };
          persistRepositoryMatter("legal_case", next, "UPDATED");
          return next;
        }),
      );
    }
    showToast("Event removed from case chronology.");
  };

  const resetRepositorySampleData = () => {
    setAllTaxAssessments(MOCK_TAX_ASSESSMENTS);
    setAllLegalCases(MOCK_LEGAL_CASES);
    setAllLicenses(MOCK_LICENSES);
    setAllSops(MOCK_SOPS);
    try {
      localStorage.setItem("vcfo_repository_tax_v2", JSON.stringify(MOCK_TAX_ASSESSMENTS));
      localStorage.setItem("vcfo_repository_legal_v2", JSON.stringify(MOCK_LEGAL_CASES));
      localStorage.setItem("vcfo_repository_licenses_v2", JSON.stringify(MOCK_LICENSES));
      localStorage.setItem("vcfo_repository_sops_v2", JSON.stringify(MOCK_SOPS));
    } catch {}
    showToast("Corporate repository sample test data successfully loaded for all companies!");
  };

  // -------------------------------------------------------------
  // Interactive Action Flow & Gantt Studio State & Handlers
  // -------------------------------------------------------------
  // Master Name Resolution Helpers: Ensures only names present in User Master (userAccounts) or Entity Master (companies) appear
  const getPrimaryCfoForCompany = useCallback(
    (compId?: string): string => {
      const targetCompId = compId || activeCompanyId;
      const comp = companies.find((c) => c.id === targetCompId) || companies[0];
      const hasManishInMaster = userAccounts.some((u) =>
        (u.name || "").toLowerCase().includes("manish goyal"),
      );
      const compCfo = (comp?.assignedCfo || comp?.cfoName || "").trim();
      if (compCfo && (hasManishInMaster || !compCfo.toLowerCase().includes("manish goyal"))) {
        return compCfo;
      }
      const masterCfo = userAccounts.find((u) => u.role === "cfo");
      if (masterCfo?.name) return masterCfo.name.trim();
      if (currentUser?.role === "cfo" && currentUser?.name) return currentUser.name.trim();
      if (compCfo) return compCfo;
      return userAccounts[0]?.name || "Virtual CFO";
    },
    [companies, activeCompanyId, userAccounts, currentUser],
  );

  const getPrimaryTeamMemberForCompany = useCallback(
    (compId?: string): string => {
      const targetCompId = compId || activeCompanyId;
      const companyTeamUser = userAccounts.find(
        (u) =>
          u.role === "client_team" &&
          (u.companyId === targetCompId ||
            u.companyId === "all" ||
            (u.assignedCompanyIds || []).includes(targetCompId)),
      );
      if (companyTeamUser?.name) return companyTeamUser.name.trim();
      const anyTeamUser = userAccounts.find((u) => u.role === "client_team");
      if (anyTeamUser?.name) return anyTeamUser.name.trim();
      const companyClientUser = userAccounts.find(
        (u) =>
          u.role === "client" &&
          (u.companyId === targetCompId || (u.assignedCompanyIds || []).includes(targetCompId)),
      );
      if (companyClientUser?.name) return companyClientUser.name.trim();
      if (userAccounts[0]?.name) return userAccounts[0].name.trim();
      return getPrimaryCfoForCompany(targetCompId);
    },
    [activeCompanyId, userAccounts, getPrimaryCfoForCompany],
  );

  const resolveMasterPersonName = useCallback(
    (rawName: string | undefined, roleHint: "cfo" | "team" = "team", compId?: string): string => {
      const targetCompId = compId || activeCompanyId;
      const cfoName = getPrimaryCfoForCompany(targetCompId);
      const teamName = getPrimaryTeamMemberForCompany(targetCompId);

      if (!rawName || !rawName.trim()) {
        return roleHint === "cfo" ? cfoName : teamName;
      }

      const trimmed = rawName.trim();
      const baseClean = trimmed
        .replace(/\s*\([^)]*\)\s*/g, "")
        .replace(/,\s*FCA.*$/i, "")
        .trim()
        .toLowerCase();

      // Check if this person exists in User Master (userAccounts)
      const matchedUser = userAccounts.find((u) => {
        const uClean = (u.name || "")
          .replace(/\s*\([^)]*\)\s*/g, "")
          .replace(/,\s*FCA.*$/i, "")
          .trim()
          .toLowerCase();
        return (
          uClean &&
          (uClean === baseClean || uClean.includes(baseClean) || baseClean.includes(uClean))
        );
      });

      if (matchedUser) {
        return matchedUser.name.trim();
      }

      // Check if this person matches the Entity's configured CFO
      const comp = companies.find((c) => c.id === targetCompId) || companies[0];
      const entityCfoClean = (comp?.assignedCfo || comp?.cfoName || "")
        .replace(/\s*\([^)]*\)\s*/g, "")
        .replace(/,\s*FCA.*$/i, "")
        .trim()
        .toLowerCase();

      if (
        entityCfoClean &&
        !entityCfoClean.includes("manish goyal") &&
        (entityCfoClean === baseClean || baseClean.includes(entityCfoClean))
      ) {
        return (comp?.assignedCfo || comp?.cfoName || cfoName).trim();
      }

      // Not in User Master or Entity Master! Map to the appropriate active master person:
      if (
        roleHint === "cfo" ||
        baseClean.includes("manish") ||
        trimmed.toLowerCase().includes("cfo")
      ) {
        return cfoName;
      }
      return teamName;
    },
    [
      activeCompanyId,
      userAccounts,
      companies,
      getPrimaryCfoForCompany,
      getPrimaryTeamMemberForCompany,
    ],
  );

  const rawActionFlowTasks = useMemo(() => {
    const source =
      currentUser.role === "cfo" && cfoViewMode === "portfolio"
        ? allActionFlowTasks
        : allActionFlowTasks.filter(
            (task) => !task.companyId || task.companyId === activeCompanyId,
          );
    return source.map((t) => {
      const cId = t.companyId || activeCompanyId;
      const resolvedAssignee = resolveMasterPersonName(t.assignedTo, "team", cId);
      const initials = resolvedAssignee
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return {
        ...t,
        assignedTo: resolvedAssignee,
        assignedAvatar: initials || t.assignedAvatar,
        stuckRemarksAuthor: t.stuckRemarksAuthor
          ? resolveMasterPersonName(t.stuckRemarksAuthor, "team", cId)
          : t.stuckRemarksAuthor,
        cfoRemarksAuthor: t.cfoRemarksAuthor
          ? resolveMasterPersonName(t.cfoRemarksAuthor, "cfo", cId)
          : t.cfoRemarksAuthor,
        challenges: (t.challenges || []).map((ch) => ({
          ...ch,
          reportedBy: ch.reportedBy
            ? resolveMasterPersonName(ch.reportedBy, "team", cId)
            : ch.reportedBy,
          comments: (ch.comments || []).map((cm) => ({
            ...cm,
            authorName: resolveMasterPersonName(
              cm.authorName,
              cm.authorRole === "cfo" || cm.isCfoDirective ? "cfo" : "team",
              cId,
            ),
          })),
        })),
        discussions: (t.discussions || []).map((d) => ({
          ...d,
          authorName: resolveMasterPersonName(
            d.authorName,
            d.authorRole === "cfo" ? "cfo" : "team",
            cId,
          ),
        })),
      };
    });
  }, [allActionFlowTasks, currentUser.role, cfoViewMode, activeCompanyId, resolveMasterPersonName]);

  const actionFlowTasks = useMemo(() => {
    return rawActionFlowTasks.filter((task) => !task.isHidden);
  }, [rawActionFlowTasks]);

  const addActionFlowTask = (task: Omit<ActionFlowTask, "id" | "taskCode" | "createdAt">) => {
    const nextSeq = allActionFlowTasks.length + 101;
    const taskCode = `ACT-${(task.category || "GEN").slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(nextSeq).padStart(3, "0")}`;
    const newId = makeUuid();
    const newTask: ActionFlowTask = {
      ...task,
      id: newId,
      companyId: task.companyId || activeCompanyId,
      taskCode,
      createdAt: new Date().toISOString().split("T")[0],
      milestones: task.milestones || [],
      challenges: task.challenges || [],
      progressPercentage: task.progressPercentage ?? 0,
    };
    setAllActionFlowTasks((prev) => [newTask, ...prev]);
    persistActionFlowTask(
      newTask,
      "CREATED",
      `Assigned task "${newTask.title}" to ${newTask.assignedTo} (${newTask.allocatedDurationDays} days duration)`,
    );
    showToast(
      `Task assigned to ${newTask.assignedTo} with ${newTask.allocatedDurationDays} days duration.`,
    );
  };

  const updateActionFlowTask = (id: string, updates: Partial<ActionFlowTask>) => {
    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...updates };
        persistActionFlowTask(next, "UPDATED");
        return next;
      }),
    );
    showToast("Action flow task updated.");
  };

  const deleteActionFlowTask = (id: string) => {
    const existing = allActionFlowTasks.find((t) => t.id === id);
    setAllActionFlowTasks((prev) => prev.filter((t) => t.id !== id));
    const compId = existing?.companyId || activeCompanyId || "client-101";
    const dbId = toUuid(id, compId);
    void (async () => {
      const { error } = await supabase.from("action_items").delete().eq("id", dbId);
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      }
      void logAuditEvent("ACTION_FLOW_DELETED", "action_items", dbId, compId, {
        message: `Deleted action flow task "${existing?.title || id}"`,
        status: "warning",
      });
    })();
    showToast(`Task "${existing?.title || id}" deleted.`);
  };

  const addMilestone = (taskId: string, milestone: Omit<ActionFlowMilestone, "id">) => {
    const newMs: ActionFlowMilestone = {
      ...milestone,
      id: `ms-${Date.now()}`,
    };
    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newMilestones = [...t.milestones, newMs];
        const completedCount = newMilestones.filter((m) => m.status === "completed").length;
        const autoProgress = Math.round((completedCount / newMilestones.length) * 100);
        const next = {
          ...t,
          milestones: newMilestones,
          progressPercentage: autoProgress,
        };
        persistActionFlowTask(
          next,
          "UPDATED",
          `Added milestone "${newMs.title}" to task "${t.title}"`,
        );
        return next;
      }),
    );
    showToast(`Milestone "${newMs.title}" added.`);
  };

  const updateMilestone = (
    taskId: string,
    milestoneId: string,
    updates: Partial<ActionFlowMilestone>,
  ) => {
    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedMilestones = t.milestones.map((m) =>
          m.id === milestoneId ? { ...m, ...updates } : m,
        );
        const completedCount = updatedMilestones.filter((m) => m.status === "completed").length;
        const autoProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        const next = {
          ...t,
          milestones: updatedMilestones,
          progressPercentage: autoProgress,
        };
        persistActionFlowTask(next, "UPDATED");
        return next;
      }),
    );
    showToast("Milestone updated.");
  };

  const toggleMilestoneStatus = (taskId: string, milestoneId: string) => {
    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedMilestones = t.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          const isDone = m.status === "completed";
          return {
            ...m,
            status: (isDone ? "in_progress" : "completed") as ActionFlowMilestone["status"],
            progressPercentage: isDone ? 50 : 100,
            completedDate: isDone ? undefined : new Date().toISOString().split("T")[0],
            signedOffBy: isDone ? undefined : currentUser.name,
          };
        });
        const completedCount = updatedMilestones.filter((m) => m.status === "completed").length;
        const autoProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        const allCompleted = completedCount === updatedMilestones.length;
        const next = {
          ...t,
          milestones: updatedMilestones,
          progressPercentage: autoProgress,
          status: allCompleted ? "completed" : t.status === "completed" ? "in_progress" : t.status,
          completedAt: allCompleted ? new Date().toISOString().split("T")[0] : undefined,
        };
        persistActionFlowTask(next, "UPDATED");
        return next;
      }),
    );
    showToast("Milestone progress toggled.");
  };

  const reportTaskChallenge = (
    taskId: string,
    challenge: Omit<TaskChallenge, "id" | "reportedAt" | "comments" | "status">,
  ) => {
    const newChallenge: TaskChallenge = {
      ...challenge,
      id: `ch-${Date.now()}`,
      taskId,
      reportedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "open",
      comments: [
        {
          id: `cmt-${Date.now()}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          authorRoleTitle: currentUser.roleTitle,
          authorAvatar: currentUser.avatar,
          timestamp: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          message: challenge.description,
        },
      ],
    };

    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const next = {
          ...t,
          status: "stuck_blocked" as ActionFlowTaskStatus,
          challenges: [newChallenge, ...t.challenges],
        };
        persistActionFlowTask(
          next,
          "UPDATED",
          `Challenge reported on task ${taskId}: "${challenge.title}" (${challenge.severity})`,
        );
        return next;
      }),
    );
    showToast("Challenge reported to CFO. Task status marked as Stuck / Blocked.");
  };

  const addChallengeComment = (
    taskId: string,
    challengeId: string,
    comment: Omit<ChallengeComment, "id" | "timestamp">,
  ) => {
    const newCmt: ChallengeComment = {
      ...comment,
      id: `cmt-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const next = {
          ...t,
          challenges: t.challenges.map((c) => {
            if (c.id !== challengeId) return c;
            return {
              ...c,
              comments: [...c.comments, newCmt],
              status: comment.isCfoDirective ? "cfo_guidance_provided" : c.status,
            };
          }),
        };
        persistActionFlowTask(next, "UPDATED");
        return next;
      }),
    );
    showToast("Comment posted.");
  };

  const resolveTaskChallenge = (taskId: string, challengeId: string, resolutionSummary: string) => {
    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedChallenges = t.challenges.map((c) => {
          if (c.id !== challengeId) return c;
          return {
            ...c,
            status: "resolved" as ChallengeStatus,
            resolvedAt: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            resolvedBy: currentUser.name,
            resolutionSummary,
          };
        });

        const hasRemainingOpen = updatedChallenges.some(
          (c) => c.status === "open" || c.status === "cfo_guidance_provided",
        );

        const next = {
          ...t,
          challenges: updatedChallenges,
          status: hasRemainingOpen ? t.status : "in_progress",
        };
        persistActionFlowTask(
          next,
          "UPDATED",
          `Challenge ${challengeId} on task ${taskId} resolved by ${currentUser.name}: ${resolutionSummary}`,
        );
        return next;
      }),
    );
    showToast("Challenge resolved! Task unblocked.");
  };

  const provideCfoGuidance = (
    taskId: string,
    challengeId: string,
    guidanceText: string,
    actionPrescribed?: string,
    extendDays?: number,
  ) => {
    const newCmt: ChallengeComment = {
      id: `cmt-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: "cfo",
      authorRoleTitle: currentUser.roleTitle || "Virtual CFO",
      authorAvatar: currentUser.avatar || "MG",
      timestamp: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      message: guidanceText,
      isCfoDirective: true,
      actionPrescribed,
    };

    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        let newAllocatedDays = t.allocatedDurationDays;
        let newDueDate = t.dueDate;

        if (extendDays && extendDays > 0) {
          newAllocatedDays += extendDays;
          const currDue = new Date(t.dueDate);
          if (!isNaN(currDue.getTime())) {
            currDue.setDate(currDue.getDate() + extendDays);
            newDueDate = currDue.toISOString().split("T")[0];
          }
        }

        const updatedChallenges = t.challenges.map((c) => {
          if (c.id !== challengeId) return c;
          return {
            ...c,
            status: "cfo_guidance_provided" as ChallengeStatus,
            cfoAdvisorySummary: guidanceText,
            comments: [...c.comments, newCmt],
          };
        });

        const next = {
          ...t,
          allocatedDurationDays: newAllocatedDays,
          dueDate: newDueDate,
          challenges: updatedChallenges,
          cfoDirectives: [...(t.cfoDirectives || []), guidanceText],
        };
        persistActionFlowTask(
          next,
          "UPDATED",
          `CFO guidance provided on challenge ${challengeId}: ${guidanceText}`,
        );
        return next;
      }),
    );
    showToast("CFO Guidance and directive issued to assignee.");
  };

  const addTaskDiscussion = (
    taskId: string,
    entry: Omit<TaskDiscussionEntry, "id" | "timestamp">,
    newProgress?: number,
    newStatus?: ActionFlowTaskStatus,
  ) => {
    const newEntry: TaskDiscussionEntry = {
      ...entry,
      id: `disc-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      progressPercentage: newProgress,
      statusChange: newStatus,
    };

    setAllActionFlowTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentDiscussions = t.discussions || [];
        const updatedProgress = newProgress !== undefined ? newProgress : t.progressPercentage;
        const updatedStatus =
          newStatus !== undefined ? newStatus : updatedProgress === 100 ? "completed" : t.status;

        const next = {
          ...t,
          progressPercentage: updatedProgress,
          status: updatedStatus,
          completedAt:
            updatedStatus === "completed" ? new Date().toISOString().split("T")[0] : t.completedAt,
          discussions: [...currentDiscussions, newEntry],
        };
        persistActionFlowTask(
          next,
          "UPDATED",
          `Discussion update posted on task ${taskId} by ${entry.authorName}`,
        );
        return next;
      }),
    );
    showToast("Work progress discussion update posted.");
  };

  // Derived active items for current company workspace (and raw items including hidden)
  const rawCompliances = useMemo(() => {
    const list =
      allCompliancesMap[activeCompanyId] ||
      allCompliancesMap["client-101"] ||
      ALL_COMPANIES_COMPLIANCES[activeCompanyId] ||
      ALL_COMPANIES_COMPLIANCES["client-101"] ||
      [];
    const activeCycle = selectedComplianceMonth || getCurrentMonthKey();
    const activeList = buildRolledComplianceList(list, activeCycle, {
      includeEarlierCompleted: !autoHideEarlierCompleted,
    });

    return activeList.map((c) => {
      const st0 = c.subtasks?.[0];
      const st1 = c.subtasks?.[1];
      const st2 = c.subtasks?.[2];
      const d1 = st0?.durationDays ?? 3;
      const d2 = st1?.durationDays ?? 2;
      const d3 = st2?.durationDays ?? 2;
      const resolvedOwner = resolveMasterPersonName(
        c.assignedTo || st0?.assignedTo,
        "team",
        activeCompanyId,
      );
      return {
        ...c,
        assignedTo: resolvedOwner,
        assignedRole: c.assignedRole || st0?.assignedRole || "Accounts Executive",
        cfoRemarksAuthor: c.cfoRemarksAuthor
          ? resolveMasterPersonName(c.cfoRemarksAuthor, "cfo", activeCompanyId)
          : c.cfoRemarksAuthor,
        durationDays: c.durationDays ?? d1 + d2 + d3,
        subtasks: c.subtasks
          ? ([
              st0
                ? {
                    ...st0,
                    durationDays: d1,
                    assignedTo: resolveMasterPersonName(
                      st0.assignedTo || resolvedOwner,
                      "team",
                      activeCompanyId,
                    ),
                    completedBy: st0.completedBy
                      ? resolveMasterPersonName(st0.completedBy, "team", activeCompanyId)
                      : st0.completedBy,
                  }
                : st0,
              st1
                ? {
                    ...st1,
                    durationDays: d2,
                    assignedTo: resolveMasterPersonName(st1.assignedTo, "cfo", activeCompanyId),
                    completedBy: st1.completedBy
                      ? resolveMasterPersonName(st1.completedBy, "cfo", activeCompanyId)
                      : st1.completedBy,
                  }
                : st1,
              st2
                ? {
                    ...st2,
                    durationDays: d3,
                    assignedTo: resolveMasterPersonName(st2.assignedTo, "team", activeCompanyId),
                    completedBy: st2.completedBy
                      ? resolveMasterPersonName(st2.completedBy, "team", activeCompanyId)
                      : st2.completedBy,
                  }
                : st2,
            ] as [SubTask, SubTask, SubTask])
          : c.subtasks,
      };
    });
  }, [
    allCompliancesMap,
    activeCompanyId,
    resolveMasterPersonName,
    selectedComplianceMonth,
    autoHideEarlierCompleted,
  ]);

  const compliances = useMemo(() => {
    return rawCompliances.filter((c) => !c.isHidden);
  }, [rawCompliances]);

  const rawActions = useMemo(() => {
    const list = allActionsMap[activeCompanyId] || allActionsMap["client-101"] || [];
    return list.map((a) => {
      const isCfoOwner = (a.assignedRole || "").toLowerCase().includes("cfo");
      const resolvedOwner = resolveMasterPersonName(
        a.assignedTo,
        isCfoOwner ? "cfo" : "team",
        activeCompanyId,
      );
      return {
        ...a,
        assignedTo: resolvedOwner,
        subtasks: a.subtasks
          ? a.subtasks.map((st, idx) => ({
              ...st,
              assignedTo: resolveMasterPersonName(
                st.assignedTo,
                idx === 1 ? "cfo" : "team",
                activeCompanyId,
              ),
            }))
          : a.subtasks,
        progressUpdates: (a.progressUpdates || []).map((u) => ({
          ...u,
          updatedBy: resolveMasterPersonName(u.updatedBy, "team", activeCompanyId),
        })),
      };
    });
  }, [allActionsMap, activeCompanyId, resolveMasterPersonName]);

  const actions = useMemo(() => {
    return rawActions.filter((a) => !a.isHidden);
  }, [rawActions]);

  const financialMIS = useMemo(() => {
    return allMISMap[activeCompanyId] || allMISMap["client-101"] || INITIAL_FINANCIAL_MIS;
  }, [allMISMap, activeCompanyId]);

  const threeMonthCashBudget = useMemo<ThreeMonthCashBudgetModel>(() => {
    return (
      financialMIS.threeMonthCashBudget ||
      INITIAL_FINANCIAL_MIS.threeMonthCashBudget ||
      INITIAL_THREE_MONTH_CASH_BUDGET
    );
  }, [financialMIS]);

  const rawBudgetItems = useMemo(() => {
    return allBudgetMap[activeCompanyId] || allBudgetMap["client-101"] || [];
  }, [allBudgetMap, activeCompanyId]);

  const budgetItems = useMemo(() => {
    return rawBudgetItems.filter((b) => !b.isHidden);
  }, [rawBudgetItems]);

  const updateLineItemActual = (
    itemId: string,
    monthKey: BudgetMonthKey,
    actual: number,
    notes?: string,
  ) => {
    setAllBudgetMap((prev) => {
      const currentList = prev[activeCompanyId] || prev["client-101"] || [];
      const updated = currentList.map((item) => {
        if (item.id === itemId) {
          const next = {
            ...item,
            monthly: {
              ...item.monthly,
              [monthKey]: {
                ...item.monthly[monthKey],
                actual,
                ...(notes !== undefined ? { notes } : {}),
              },
            },
          };
          persistBudgetItem(
            next,
            activeCompanyId,
            `Updated ${monthKey.toUpperCase()} actual for ${item.code} - ${item.name} to ${actual}`,
          );
          return next;
        }
        return item;
      });
      return { ...prev, [activeCompanyId]: updated };
    });
    showToast(`Updated actual figure for ${monthKey.toUpperCase()}`);
  };

  const updateLineItemBudget = (itemId: string, monthKey: BudgetMonthKey, budget: number) => {
    setAllBudgetMap((prev) => {
      const currentList = prev[activeCompanyId] || prev["client-101"] || [];
      const updated = currentList.map((item) => {
        if (item.id === itemId) {
          const next = {
            ...item,
            monthly: {
              ...item.monthly,
              [monthKey]: {
                ...item.monthly[monthKey],
                budget,
              },
            },
          };
          persistBudgetItem(
            next,
            activeCompanyId,
            `Updated ${monthKey.toUpperCase()} budget for ${item.code} - ${item.name} to ${budget}`,
          );
          return next;
        }
        return item;
      });
      return { ...prev, [activeCompanyId]: updated };
    });
    showToast(`Updated budget figure for ${monthKey.toUpperCase()}`);
  };

  const bulkUpdateActualsFromExcel = (
    monthKey: BudgetMonthKey,
    parsedRows: Array<{ code?: string; name?: string; actual: number; notes?: string }>,
    fileName?: string,
  ) => {
    let updatedCount = 0;

    setAllBudgetMap((prev) => {
      const currentList = prev[activeCompanyId] || prev["client-101"] || [];
      const updated = currentList.map((item) => {
        const match = parsedRows.find((r) => {
          if (r.code && r.code.trim().toUpperCase() === item.code.trim().toUpperCase()) {
            return true;
          }
          if (r.name && r.name.trim().toLowerCase() === item.name.trim().toLowerCase()) {
            return true;
          }
          if (r.name && item.name.toLowerCase().includes(r.name.trim().toLowerCase())) {
            return true;
          }
          return false;
        });

        if (match && typeof match.actual === "number" && !isNaN(match.actual)) {
          updatedCount++;
          const next = {
            ...item,
            monthly: {
              ...item.monthly,
              [monthKey]: {
                ...item.monthly[monthKey],
                actual: match.actual,
                notes: match.notes || item.monthly[monthKey]?.notes,
              },
            },
          };
          persistBudgetItem(
            next,
            activeCompanyId,
            `Bulk Excel update (${monthKey.toUpperCase()}) for ${item.code} - ${item.name}`,
          );
          return next;
        }
        return item;
      });

      return { ...prev, [activeCompanyId]: updated };
    });

    const notFoundCount = Math.max(0, parsedRows.length - updatedCount);
    void createMisUpload({
      companyId: activeCompanyId,
      period: `${monthKey.toUpperCase()} FY 2026-27`,
      statementType: `budget_${monthKey}`,
      fileName: fileName || `Budget_Actuals_${monthKey.toUpperCase()}.xlsx`,
      rows: parsedRows,
      rowCount: parsedRows.length,
    });
    showToast(`Excel uploaded: ${updatedCount} actuals updated for ${monthKey.toUpperCase()}`);
    return { updatedCount, notFoundCount };
  };

  const resetBudgetData = () => {
    void queryClient.invalidateQueries({ queryKey: ["budget_items"] });
    showToast("Refreshed budget & actual numbers from database");
  };

  const clientProfile = useMemo(() => {
    return companies.find((c) => c.id === activeCompanyId) || companies[0];
  }, [companies, activeCompanyId]);

  // Resolve specific person permissions (with fallback to role permissions)
  const getUserPermissions = useCallback(
    (userOrId: string | UserAccount): UserModulePermissions => {
      const targetUser =
        typeof userOrId === "string"
          ? rawUserAccounts.find((u) => u.id === userOrId) ||
            DEFAULT_USERS.find((u) => u.id === userOrId)
          : userOrId;
      const uId = typeof userOrId === "string" ? userOrId : userOrId?.id;
      if (uId && userPermissions[uId]) {
        return userPermissions[uId];
      }
      if (targetUser?.permissions) {
        return targetUser.permissions;
      }
      if (uId && DEFAULT_USER_PERMISSIONS[uId]) {
        return DEFAULT_USER_PERMISSIONS[uId];
      }
      const fallbackRole =
        targetUser?.role === "cfo" || targetUser?.role === "admin"
          ? "cfo"
          : targetUser?.role === "client"
            ? "client"
            : "client_team";
      return rolePermissions[fallbackRole] || DEFAULT_ROLE_PERMISSIONS[fallbackRole];
    },
    [rawUserAccounts, userPermissions, rolePermissions],
  );

  const effectivePermissions = useMemo<UserModulePermissions>(() => {
    return getUserPermissions(currentUser);
  }, [getUserPermissions, currentUser]);

  // Safe role & user switcher
  const setRole = (newRole: Role) => {
    if (isSupabaseConfigured && isAuthenticated && currentUser.role !== newRole) {
      showToast("Role switching is disabled for authenticated sessions. Access is strictly governed by your verified Supabase credentials.");
      return;
    }
    setRoleState(newRole);
    const targetUser =
      (currentUser.role === newRole ? currentUser : undefined) ||
      userAccounts.find((u) => u.role === newRole) ||
      userAccounts[0] ||
      DEFAULT_USERS.find((u) => u.role === newRole) ||
      DEFAULT_USERS[0];
    setCurrentUser(targetUser);
    if (newRole === "client_team") {
      setSelectedCompanyIdState(
        targetUser?.companyId && targetUser.companyId !== "all"
          ? targetUser.companyId
          : "client-101",
      );
      setCfoViewMode("single_company");
      setActiveTabState("compliances");
    } else if (newRole === "client") {
      setSelectedCompanyIdState(
        targetUser?.companyId && targetUser.companyId !== "all"
          ? targetUser.companyId
          : "client-101",
      );
      setCfoViewMode("single_company");
      setActiveTabState("dashboard");
    } else {
      setCfoViewMode("portfolio");
      setActiveTabState("dashboard");
    }
  };

  // Switch directly to a specific user / team member account
  const switchActiveUser = (userOrId: string | UserAccount) => {
    if (isSupabaseConfigured && isAuthenticated) {
      showToast("Role switching is restricted in authenticated sessions. To switch to a different account, sign out and sign in with that user's credentials.");
      return;
    }
    const targetUser =
      typeof userOrId === "string"
        ? rawUserAccounts.find((u) => u.id === userOrId) ||
          userAccounts.find((u) => u.id === userOrId) ||
          DEFAULT_USERS.find((u) => u.id === userOrId)
        : userOrId;

    if (!targetUser) {
      showToast("Selected user account could not be found.");
      return;
    }

    const resolvedPerms = getUserPermissions(targetUser);
    const nowFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedUser: UserAccount = {
      ...targetUser,
      permissions: resolvedPerms,
      lastLoginAt: nowFormatted,
    };

    setCurrentUser(updatedUser);
    setRoleState(updatedUser.role);

    if (updatedUser.role === "cfo") {
      setCfoViewMode("portfolio");
    } else if (updatedUser.role === "client_team") {
      const targetCompId =
        updatedUser.companyId && updatedUser.companyId !== "all"
          ? updatedUser.companyId
          : "client-101";
      setSelectedCompanyIdState(targetCompId);
      setCfoViewMode("single_company");
      if (activeTab === "admin") {
        setActiveTabState(resolvedPerms.compliances.canView ? "compliances" : "dashboard");
      } else if (activeTab === "mis" && !resolvedPerms.mis.canView) {
        setActiveTabState(resolvedPerms.compliances.canView ? "compliances" : "dashboard");
      } else if (activeTab === "compliances" && !resolvedPerms.compliances.canView) {
        setActiveTabState(resolvedPerms.mis.canView ? "mis" : "dashboard");
      }
    } else {
      const targetCompId =
        updatedUser.companyId && updatedUser.companyId !== "all"
          ? updatedUser.companyId
          : "client-101";
      setSelectedCompanyIdState(targetCompId);
      setCfoViewMode("single_company");
      if (activeTab === "admin") {
        setActiveTabState("dashboard");
      }
    }

    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem("vcfo_is_authenticated", "true");
      localStorage.setItem("vcfo_user_account_v2", JSON.stringify(updatedUser));
    } catch {}

    addAuditLog(
      "USER_LOGIN",
      `Switched active session to ${updatedUser.name} (${updatedUser.roleTitle || updatedUser.role})`,
      "success",
    );
    showToast(
      `Active user switched to ${updatedUser.name} (${updatedUser.roleTitle || "Team Member"})`,
    );
  };

  const setActiveTab = (
    tab: "dashboard" | "compliances" | "actions" | "action_flow" | "mis" | "repository" | "admin",
  ) => {
    if (tab === "admin" && role !== "cfo" && (role as string) !== "admin") {
      showToast("Access Restricted: Only Virtual CFO and Admins can access the Admin Panel.");
      return;
    }
    if (role === "client_team" && tab === "mis" && !effectivePermissions.mis.canView) {
      showToast(
        `Permission Denied: ${currentUser.name} does not have MIS View rights enabled in Admin.`,
      );
      return;
    }
    if (
      role === "client_team" &&
      tab === "compliances" &&
      !effectivePermissions.compliances.canView
    ) {
      showToast(
        `Permission Denied: ${currentUser.name} does not have Compliances View rights enabled in Admin.`,
      );
      return;
    }
    setActiveTabState(tab);
  };

  const openMisWithSubTab = (subTab: MisSubTab) => {
    if (role === "client_team" && !effectivePermissions.mis.canView) {
      showToast(
        `Permission Denied: ${currentUser.name} does not have MIS View rights enabled in Admin.`,
      );
      return;
    }
    setMisSubTab(subTab);
    setActiveTabState("mis");
  };

  const setSelectedCompanyId = (companyId: string) => {
    if (currentUser.role !== "cfo") {
      setSelectedCompanyIdState("client-101");
      showToast(
        "Notice: Client & Client Team views are strictly restricted to own company workspace.",
      );
      return;
    }
    setSelectedCompanyIdState(companyId);
    try {
      localStorage.setItem("vcfo_active_company_v2", companyId);
    } catch {}
  };

  const drillDownToCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setCfoViewMode("single_company");
    setActiveTabState("dashboard");
    const comp = companies.find((c) => c.id === companyId);
    showToast(`Viewing workspace: ${comp?.companyName || "Company"}`);
  };

  const returnToPortfolio = () => {
    setCfoViewMode("portfolio");
    setActiveTabState("dashboard");
  };

  const switchCompanyAndTab = (
    companyId: string,
    tab: "dashboard" | "compliances" | "actions" | "action_flow" | "mis" | "repository" | "admin",
    subTab?: MisSubTab,
  ) => {
    setSelectedCompanyId(companyId);
    setCfoViewMode("single_company");
    if (subTab) {
      setMisSubTab(subTab);
    }
    setActiveTabState(tab);
    const comp = companies.find((c) => c.id === companyId);
    showToast(
      `Workspace switched to ${comp?.companyName || "Company"}: viewing ${tab.toUpperCase()}`,
    );
  };

  // -------------------------------------------------------------
  // Admin, Security Protocols, RBAC & Remarks Handlers
  // -------------------------------------------------------------

  const addAuditLog = (
    action: AuditLogItem["action"],
    details: string,
    status: "success" | "warning" | "blocked" = "success",
  ) => {
    void logAuditEvent(action, action.toLowerCase(), activeCompanyId || "system", activeCompanyId, {
      message: details,
      status,
    });
  };

  const createMisUpload = async (payload: {
    companyId?: string;
    period: string;
    statementType: string;
    fileName: string;
    rows: any;
    rowCount?: number;
    status?: "pending_review" | "approved" | "rejected";
    overridePrevious?: boolean;
  }): Promise<MisUploadRecord | null> => {
    const targetCompId = payload.companyId || activeCompanyId || "client-101";
    const rowCount =
      payload.rowCount !== undefined
        ? payload.rowCount
        : Array.isArray(payload.rows)
          ? payload.rows.length
          : Object.keys(payload.rows || {}).length;

    const initialStatus = payload.status || (role === "cfo" ? "approved" : "pending_review");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uploaderUuid = sessionData?.session?.user?.id || currentUser.id;

      // If overridePrevious is requested, mark existing uploads for the same period as superseded
      if (payload.overridePrevious) {
        try {
          await supabase
            .from("mis_uploads")
            .update({
              status: "superseded",
              review_note: `Superseded by fresh upload "${payload.fileName}"`,
            })
            .eq("company_id", targetCompId)
            .eq("period", payload.period);
        } catch (suppErr) {
          console.warn("[Supabase] supersede previous uploads warning:", suppErr);
        }
      }

      const { data, error } = await supabase
        .from("mis_uploads")
        .insert({
          company_id: targetCompId,
          period: payload.period || "September 2026",
          statement_type: payload.statementType || "financial_mis",
          file_name: payload.fileName || "MIS_Upload.xlsx",
          row_count: rowCount,
          rows: payload.rows ?? {},
          status: initialStatus,
          uploaded_by: uploaderUuid,
          reviewed_by: initialStatus === "approved" ? uploaderUuid : null,
          reviewed_at: initialStatus === "approved" ? new Date().toISOString() : null,
          review_note: initialStatus === "approved" ? "Approved by Virtual CFO upon upload" : null,
        })
        .select("*")
        .single();

      if (error) {
        console.error("[Supabase] mis_uploads insert error:", error);
        showToast(`Database error saving MIS upload: ${error.message}`);
        return null;
      }

      const createdRecord: MisUploadRecord = {
        id: data.id,
        companyId: data.company_id,
        period: data.period,
        statementType: data.statement_type,
        fileName: data.file_name,
        rowCount: data.row_count,
        rows: data.rows,
        status: data.status,
        uploadedBy: data.uploaded_by,
        reviewedBy: data.reviewed_by,
        reviewedAt: data.reviewed_at,
        reviewNote: data.review_note,
        createdAt: data.created_at,
      };

      setMisUploads((prev) => [createdRecord, ...prev.filter((u) => u.id !== createdRecord.id)]);

      // If approved immediately (e.g. uploaded by CFO or override), immediately update allMISMap
      if (initialStatus === "approved" && payload.rows && typeof payload.rows === "object") {
        setAllMISMap((prev) => ({
          ...prev,
          [targetCompId]: {
            ...(prev[targetCompId] || INITIAL_FINANCIAL_MIS),
            ...(payload.rows as Partial<FinancialMIS>),
            period: payload.period || (payload.rows as any).period || "September 2026",
          },
        }));
      }

      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
      void logAuditEvent("EXCEL_UPLOAD_MIS", "mis_uploads", data.id, targetCompId, {
        fileName: createdRecord.fileName,
        statementType: createdRecord.statementType,
        period: createdRecord.period,
        rowCount: createdRecord.rowCount,
        status: initialStatus,
        message: `Uploaded MIS sheet "${createdRecord.fileName}" (${createdRecord.statementType}) for ${createdRecord.period} [${initialStatus.toUpperCase()}]`,
      });
      return createdRecord;
    } catch (err: any) {
      console.error("[Supabase] createMisUpload exception:", err);
      return null;
    }
  };

  const reviewMisUpload = async (
    uploadId: string,
    status: "approved" | "rejected",
    reviewNote?: string,
  ) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const reviewerUuid = sessionData?.session?.user?.id || currentUser.id;
      const reviewedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from("mis_uploads")
        .update({
          status,
          reviewed_by: reviewerUuid,
          reviewed_at: reviewedAt,
          review_note:
            reviewNote ||
            (status === "approved" ? "Approved by Virtual CFO" : "Rejected by Virtual CFO"),
        })
        .eq("id", uploadId)
        .select("*")
        .single();

      if (error) {
        console.error("[Supabase] mis_uploads review update error:", error);
        showToast(`Failed to update MIS upload status: ${error.message}`);
        return;
      }

      setMisUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                status: data.status,
                reviewedBy: data.reviewed_by,
                reviewedAt: data.reviewed_at,
                reviewNote: data.review_note,
              }
            : u,
        ),
      );

      if (
        status === "approved" &&
        data.rows &&
        typeof data.rows === "object" &&
        !Array.isArray(data.rows)
      ) {
        setAllMISMap((prev) => ({
          ...prev,
          [data.company_id]: {
            ...(prev[data.company_id] || INITIAL_FINANCIAL_MIS),
            ...(data.rows as Partial<FinancialMIS>),
          },
        }));
      }

      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
      void logAuditEvent("MIS_UPLOAD_REVIEWED", "mis_uploads", uploadId, data.company_id, {
        status,
        reviewNote,
        message: `MIS Upload "${data.file_name}" (${data.period}) marked as ${status.toUpperCase()} by ${currentUser.name}${reviewNote ? `: ${reviewNote}` : ""}`,
      });
      showToast(`MIS upload "${data.file_name}" marked as ${status.toUpperCase()}.`);
    } catch (err: any) {
      console.error("[Supabase] reviewMisUpload error:", err);
    }
  };

  const deleteMisUpload = async (uploadId: string): Promise<boolean> => {
    try {
      const targetUpload = misUploads.find((u) => u.id === uploadId);
      const companyId = targetUpload?.companyId || activeCompanyId;

      const { error } = await supabase.from("mis_uploads").delete().eq("id", uploadId);
      if (error) {
        console.error("[Supabase] mis_uploads delete error:", error);
        showToast(`Failed to delete MIS upload from database: ${error.message}`);
        return false;
      }

      setMisUploads((prev) => prev.filter((u) => u.id !== uploadId));
      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });

      // Recalculate remaining company MIS from latest approved uploads if available
      const remainingUploads = misUploads
        .filter((u) => u.id !== uploadId && u.companyId === companyId && u.status === "approved")
        .reverse();

      if (remainingUploads.length > 0) {
        const latest = remainingUploads[remainingUploads.length - 1];
        if (latest.rows && typeof latest.rows === "object" && !Array.isArray(latest.rows)) {
          setAllMISMap((prev) => ({
            ...prev,
            [companyId]: {
              ...(COMPANY_MIS_DETAILED[companyId] || INITIAL_FINANCIAL_MIS),
              ...(latest.rows as Partial<FinancialMIS>),
            },
          }));
        }
      } else {
        // Reset back to base company default
        setAllMISMap((prev) => ({
          ...prev,
          [companyId]: COMPANY_MIS_DETAILED[companyId] || INITIAL_FINANCIAL_MIS,
        }));
      }

      void logAuditEvent("MIS_UPLOAD_DELETED", "mis_uploads", uploadId, companyId, {
        fileName: targetUpload?.fileName || "Unknown file",
        period: targetUpload?.period,
        message: `MIS Upload record "${targetUpload?.fileName || uploadId}" was deleted by ${currentUser.name}`,
      });

      showToast(`MIS upload "${targetUpload?.fileName || uploadId}" deleted successfully.`);
      return true;
    } catch (err: any) {
      console.error("[Supabase] deleteMisUpload exception:", err);
      showToast(`Error deleting MIS upload: ${err?.message || "Unknown error"}`);
      return false;
    }
  };

  const deleteCompanyFinancialMIS = async (companyId: string): Promise<void> => {
    try {
      const targetId = companyId || activeCompanyId;
      const { error } = await supabase.from("mis_uploads").delete().eq("company_id", targetId);
      if (error) {
        console.warn("[Supabase] purge mis_uploads warning:", error);
      }

      setMisUploads((prev) => prev.filter((u) => u.companyId !== targetId));
      clearFinancialMisDummyData();
      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });

      void logAuditEvent("MIS_DATA_PURGED", "financial_mis", targetId, targetId, {
        message: `Financial MIS dataset for company ${targetId} was completely deleted and reset by CFO ${currentUser.name}`,
      });

      showToast("Financial MIS data for this company was deleted and reset.");
    } catch (err: any) {
      console.error("[Supabase] deleteCompanyFinancialMIS error:", err);
      showToast("Error resetting Financial MIS data");
    }
  };

  const overrideFinancialMIS = async (
    companyId: string,
    newMIS: Partial<FinancialMIS>,
    meta?: {
      fileName?: string;
      period?: string;
      autoApprove?: boolean;
      overridePrevious?: boolean;
    },
  ): Promise<void> => {
    const targetCompId = companyId || activeCompanyId || "client-101";
    const period = meta?.period || newMIS.period || "September 2026";
    const fileName = meta?.fileName || "CFO_MIS_Override.xlsx";

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uploaderUuid = sessionData?.session?.user?.id || currentUser.id;

      if (meta?.overridePrevious) {
        try {
          await supabase
            .from("mis_uploads")
            .update({
              status: "superseded",
              review_note: `Superseded by fresh override upload "${fileName}"`,
            })
            .eq("company_id", targetCompId)
            .eq("period", period);
        } catch (suppErr) {
          console.warn("[Supabase] supersede error:", suppErr);
        }
      }

      const { data, error } = await supabase
        .from("mis_uploads")
        .insert({
          company_id: targetCompId,
          period,
          statement_type: "full_mis_override",
          file_name: fileName,
          row_count: Object.keys(newMIS).length,
          rows: newMIS,
          status: "approved",
          uploaded_by: uploaderUuid,
          reviewed_by: uploaderUuid,
          reviewed_at: new Date().toISOString(),
          review_note: "Authoritative fresh upload / CFO override",
        })
        .select("*")
        .single();

      if (error) {
        console.error("[Supabase] overrideFinancialMIS insert error:", error);
      } else if (data) {
        const createdRecord: MisUploadRecord = {
          id: data.id,
          companyId: data.company_id,
          period: data.period,
          statementType: data.statement_type,
          fileName: data.file_name,
          rowCount: data.row_count,
          rows: data.rows,
          status: data.status,
          uploadedBy: data.uploaded_by,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          reviewNote: data.review_note,
          createdAt: data.created_at,
        };
        setMisUploads((prev) => [createdRecord, ...prev.filter((u) => u.id !== createdRecord.id)]);
      }

      setAllMISMap((prev) => {
        const base = prev[targetCompId] || INITIAL_FINANCIAL_MIS;
        const overridden = {
          ...base,
          ...newMIS,
          period,
        };
        return {
          ...prev,
          [targetCompId]: overridden,
        };
      });

      void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
      void logAuditEvent("MIS_DATA_OVERRIDDEN", "mis_uploads", data?.id || "override", targetCompId, {
        fileName,
        period,
        message: `Financial MIS for ${period} completely overridden with fresh upload "${fileName}" by CFO ${currentUser.name}`,
      });

      showToast(`Financial MIS for ${period} successfully overridden with fresh dataset!`);
    } catch (err: any) {
      console.error("[Supabase] overrideFinancialMIS exception:", err);
      setAllMISMap((prev) => ({
        ...prev,
        [targetCompId]: {
          ...(prev[targetCompId] || INITIAL_FINANCIAL_MIS),
          ...newMIS,
          period,
        },
      }));
      showToast(`Financial MIS updated with fresh data.`);
    }
  };

  const updateSecurityProtocols = (partial: Partial<SecurityProtocolConfig>) => {
    setSecurityProtocols((prev) => {
      const updated = { ...prev, ...partial };
      void (async () => {
        try {
          const { data: sess } = await supabase.auth.getSession();
          const token = sess.session?.access_token;
          if (token) {
            await fetch("/api/admin/security-protocols", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                mfaRequired: updated.mfaEnforced,
                sessionTimeoutMinutes: updated.sessionTimeoutMinutes,
                ipWhitelistingEnabled: updated.ipWhitelistingEnabled,
                whitelistedIps: updated.whitelistedIps,
              }),
            });
          }
        } catch {}
      })();
      void logAuditEvent(
        "SECURITY_PROTOCOL_CHANGED",
        "security_protocols",
        "global",
        activeCompanyId,
        {
          changes: partial,
          message: `Security protocols updated: ${Object.keys(partial).join(", ")}`,
        },
      );
      return updated;
    });
    showToast("Security protocols updated and saved successfully");
  };

  const updateRolePermission = (
    targetRole: "cfo" | "client" | "client_team",
    module: "mis" | "budget" | "compliances" | "actions" | "companies",
    field: keyof ModulePermission,
    value: boolean,
  ) => {
    setRolePermissions((prev) => {
      const currentRolePerms = prev[targetRole] || DEFAULT_ROLE_PERMISSIONS[targetRole];
      const currentModulePerms = currentRolePerms[module];
      const updated = {
        ...prev,
        [targetRole]: {
          ...currentRolePerms,
          [module]: {
            ...currentModulePerms,
            [field]: value,
          },
        },
      };
      void (async () => {
        try {
          await supabase.from("role_permissions").upsert({
            role: targetRole,
            permissions: updated[targetRole] as any,
          });
        } catch {}
      })();
      void logAuditEvent(
        "RIGHTS_MODIFIED",
        "role_permissions",
        `${targetRole}.${module}.${String(field)}`,
        activeCompanyId,
        {
          targetRole,
          module,
          field,
          value,
          message: `Changed ${targetRole.toUpperCase()} permission for ${module}.${String(field)} to ${value}`,
        },
      );
      return updated;
    });
    showToast(`Updated ${targetRole.replace("_", " ")} rights for ${module}`);
  };

  const updateUserPermission = (
    userId: string,
    module: PermissionModuleKey,
    field: keyof ModulePermission,
    value: boolean,
  ) => {
    const targetUser =
      rawUserAccounts.find((u) => u.id === userId) || DEFAULT_USERS.find((u) => u.id === userId);
    const currentPerms = getUserPermissions(targetUser || userId);
    const currentMod = currentPerms[module] || {
      canView: true,
      canEdit: false,
      canUploadExcel: false,
      canDelete: false,
      canApprove: false,
    };

    const nextMod: ModulePermission = {
      ...currentMod,
      [field]: value,
      ...(value && field !== "canView" ? { canView: true } : {}),
      ...(!value && field === "canView"
        ? { canEdit: false, canUploadExcel: false, canDelete: false, canApprove: false }
        : {}),
    };

    const nextUserPerms: UserModulePermissions = {
      ...currentPerms,
      [module]: nextMod,
    };

    setUserPermissions((prev) => ({
      ...prev,
      [userId]: nextUserPerms,
    }));

    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              permissions: nextUserPerms,
              permissionPreset: "custom",
            }
          : u,
      ),
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        permissions: nextUserPerms,
        permissionPreset: "custom",
      }));
    }

    void (async () => {
      try {
        await supabase.from("user_module_permissions").upsert({
          user_id: userId,
          preset: "custom",
          permissions: nextUserPerms as any,
        });
      } catch {}
    })();

    const userName = targetUser?.name || userId;
    void logAuditEvent("RIGHTS_MODIFIED", "user_permissions", userId, activeCompanyId, {
      userId,
      userName,
      module,
      field,
      value,
      message: `Updated specific person permission for ${userName}: ${module}.${String(field)} = ${value}`,
    });
    showToast(
      `Updated ${userName}'s ${module.toUpperCase()} rights (${String(field)}: ${value ? "Enabled" : "Disabled"})`,
    );
  };

  const applyUserPermissionPreset = (userId: string, preset: UserPermissionPreset) => {
    const targetUser =
      rawUserAccounts.find((u) => u.id === userId) || DEFAULT_USERS.find((u) => u.id === userId);
    const nextPerms = buildPermissionsFromPreset(preset, targetUser?.role || "client_team");

    setUserPermissions((prev) => ({
      ...prev,
      [userId]: nextPerms,
    }));

    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              permissions: nextPerms,
              permissionPreset: preset,
            }
          : u,
      ),
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        permissions: nextPerms,
        permissionPreset: preset,
      }));
    }

    const userName = targetUser?.name || userId;
    const presetLabels: Record<string, string> = {
      full_edit: "Full Edit & Excel Upload",
      view_and_edit: "Standard View & Edit",
      compliance_focus: "Compliances & Actions Edit (MIS View-Only)",
      view_only: "Strict Read-Only / View Only",
      custom: "Custom Permissions",
    };
    void logAuditEvent("RIGHTS_MODIFIED", "user_permissions", userId, activeCompanyId, {
      userId,
      userName,
      preset,
      message: `Applied permission preset "${presetLabels[preset] || preset}" to specific user ${userName}`,
    });
    showToast(`Applied "${presetLabels[preset] || preset}" rights to ${userName}`);
  };

  const addMisRemark = (item: Omit<MisRemarkItem, "id" | "createdAt" | "status">) => {
    const tempId = `rem-${Date.now()}`;
    const targetCompId = item.companyId || activeCompanyId || "client-101";
    const newRemark: MisRemarkItem = {
      ...item,
      companyId: targetCompId,
      id: tempId,
      createdAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "open",
    };
    setMisRemarks((prev) => [newRemark, ...prev]);
    showToast(`Remark posted to ${item.sectionTitle}`);

    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authorUuid = sessionData?.session?.user?.id || currentUser.id;
        const pageKey = (item as any).pageKey || item.section || "overview";
        const lineRef = (item as any).lineRef || item.title || null;
        const periodVal = (item as any).period || financialMIS?.period || "September 2026";
        const reasonCategory = (item as any).reasonCategory || item.sectionTitle || null;
        const remarkText = item.reason || "";
        const combinedBody = item.title ? `${item.title} — ${item.reason}` : item.reason;
        const { data, error } = await supabase
          .from("mis_remarks")
          .insert({
            company_id: targetCompId,
            period: periodVal,
            section: pageKey,
            page_key: pageKey,
            line_ref: lineRef,
            reason_category: reasonCategory,
            remark: remarkText,
            body: combinedBody,
            author_id: authorUuid,
            author_name: item.authorName || currentUser.name,
            author_role: item.role || currentUser.role,
          })
          .select("*")
          .single();

        if (error) {
          console.error("[Supabase] mis_remarks insert error:", error);
        } else if (data) {
          setMisRemarks((prev) => prev.map((r) => (r.id === tempId ? { ...r, id: data.id } : r)));
          void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
          void logAuditEvent("REMARK_ADDED", "mis_remarks", data.id, targetCompId, {
            section: pageKey,
            lineRef,
            message: `Operational explanation added for ${item.sectionTitle}: "${item.title}"`,
          });
        }
      } catch (err) {
        console.error("[Supabase] mis_remarks insert network error:", err);
      }
    })();
  };

  const updateMisRemarkStatus = (
    id: string,
    status: MisRemarkItem["status"],
    cfoFeedback?: string,
  ) => {
    setMisRemarks((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, ...(cfoFeedback ? { cfoFeedback } : {}) } : r,
      ),
    );
    showToast(`Remark updated: ${status}`);

    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const responderUuid = sessionData?.session?.user?.id || currentUser.id;
        const nowIso = new Date().toISOString();
        const responseText =
          cfoFeedback !== undefined ? cfoFeedback : `Marked as ${status.toUpperCase()} by CFO`;
        const { error } = await supabase
          .from("mis_remarks")
          .update({
            cfo_response: responseText,
            cfo_response_at: nowIso,
            cfo_responded_by: responderUuid,
            cfo_responded_at: nowIso,
          })
          .eq("id", id);

        if (error) {
          console.error("[Supabase] mis_remarks update error:", error);
        } else {
          void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
          void logAuditEvent("REMARK_STATUS_UPDATED", "mis_remarks", id, activeCompanyId, {
            status,
            cfoFeedback: responseText,
            message: `Remark (${id}) marked as ${status.toUpperCase()}`,
          });
        }
      } catch (err) {
        console.error("[Supabase] mis_remarks update network error:", err);
      }
    })();
  };

  const deleteMisRemark = (id: string) => {
    setMisRemarks((prev) => prev.filter((r) => r.id !== id));
    showToast("Remark removed");

    void (async () => {
      try {
        const { error } = await supabase.from("mis_remarks").delete().eq("id", id);
        if (!error) {
          void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
        }
      } catch (err) {
        console.error("[Supabase] mis_remarks delete network error:", err);
      }
    })();
  };

  const addCompany = (company: Omit<ClientProfile, "id">) => {
    const newId = `client-${Date.now()}`;
    const newCompany: ClientProfile = {
      ...company,
      id: newId,
    };
    setCompanies((prev) => [...prev, newCompany]);
    setAllCompliancesMap((prev) => ({
      ...prev,
      [newId]: [],
    }));
    setAllActionsMap((prev) => ({
      ...prev,
      [newId]: [],
    }));
    setAllMISMap((prev) => ({
      ...prev,
      [newId]: { ...INITIAL_FINANCIAL_MIS },
    }));
    showToast(`Company "${newCompany.companyName}" created successfully!`);

    void (async () => {
      try {
        const { error } = await supabase.from("companies").insert({
          id: newId,
          company_name: newCompany.companyName,
          legal_entity: newCompany.legalEntity || "Private Limited Company",
          gstin: newCompany.gstin || "",
          pan: newCompany.pan || "",
          cin: newCompany.cin || "",
          sector: newCompany.sector || "General",
          financial_year: newCompany.financialYear || "FY 2026-27",
          cfo_name: newCompany.cfoName || currentUser.name || "Sudhakar",
          cfo_firm: newCompany.cfoFirm || "Goyal & Associates",
          is_active: true,
        });
        if (error) {
          console.error("[Supabase] Failed to persist new company to database:", error);
        }
        void logAuditEvent("COMPANY_ADDED", "companies", newId, newId, {
          companyName: newCompany.companyName,
          legalEntity: newCompany.legalEntity,
          message: `Created new client company profile "${newCompany.companyName}" (${newCompany.legalEntity})`,
        });
      } catch (err) {
        console.error("[Supabase] Company insert network error:", err);
      }
    })();
  };

  const updateCompany = (company: ClientProfile) => {
    const fallbackCfo = getPrimaryCfoForCompany(company.id);
    const normalized: ClientProfile = {
      ...company,
      cfoName: company.cfoName || company.assignedCfo || fallbackCfo,
      assignedCfo: company.assignedCfo || company.cfoName || fallbackCfo,
      cfoFirm: company.cfoFirm || "Goyal & Associates, Virtual CFO Practice",
    };
    setCompanies((prev) => prev.map((c) => (c.id === normalized.id ? normalized : c)));
    setUserAccounts((prev) =>
      prev.map((u) =>
        u.companyId === normalized.id ? { ...u, companyName: normalized.companyName } : u,
      ),
    );
    showToast(`Updated entity profile: "${normalized.companyName}"`);

    void (async () => {
      try {
        const { error } = await supabase
          .from("companies")
          .update({
            company_name: normalized.companyName,
            legal_entity: normalized.legalEntity,
            gstin: normalized.gstin,
            pan: normalized.pan,
            cin: normalized.cin,
            sector: normalized.sector,
            financial_year: normalized.financialYear,
            cfo_name: normalized.cfoName,
            cfo_firm: normalized.cfoFirm,
          })
          .eq("id", normalized.id);
        if (error) {
          console.error("[Supabase] Failed to update company in database:", error);
        }
        void logAuditEvent("COMPANY_EDITED", "companies", normalized.id, normalized.id, {
          companyName: normalized.companyName,
          message: `Updated profile data for "${normalized.companyName}"`,
        });
      } catch (err) {
        console.error("[Supabase] Company update network error:", err);
      }
    })();
  };

  const deleteCompany = (companyId: string) => {
    const comp = companies.find((c) => c.id === companyId);
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    if (selectedCompanyId === companyId) {
      setSelectedCompanyIdState("client-101");
    }
    showToast(`Company removed successfully`);

    void (async () => {
      try {
        const { error } = await supabase.from("companies").delete().eq("id", companyId);
        if (error) {
          console.error("[Supabase] Failed to delete company from database:", error);
        }
        void logAuditEvent("COMPANY_DELETED", "companies", companyId, companyId, {
          companyName: comp?.companyName || companyId,
          status: "warning",
          message: `Archived/deleted company "${comp?.companyName || companyId}"`,
        });
      } catch (err) {
        console.error("[Supabase] Company delete network error:", err);
      }
    })();
  };

  const addComplianceMasterItem = (item: Omit<ComplianceItem, "id" | "sNo">) => {
    const newId = makeUuid();
    const currentList = compliances;
    const customSubtasks = item.subtasks || [];
    const st1Custom = customSubtasks[0];
    const st2Custom = customSubtasks[1];
    const st3Custom = customSubtasks[2];

    const d1 = Number(st1Custom?.durationDays) || 3;
    const d2 = Number(st2Custom?.durationDays) || 2;
    const d3 = Number(st3Custom?.durationDays) || 2;

    const defaultTeamOwner = getPrimaryTeamMemberForCompany(activeCompanyId);
    const defaultCfoOwner = getPrimaryCfoForCompany(activeCompanyId);
    const leadAssignee = item.assignedTo || st1Custom?.assignedTo || defaultTeamOwner;
    const leadRole = item.assignedRole || st1Custom?.assignedRole || "Accounts Executive";

    const newItem: ComplianceItem = {
      ...item,
      id: newId,
      sNo: currentList.length + 1,
      assignedTo: leadAssignee,
      assignedRole: leadRole,
      durationDays: item.durationDays || d1 + d2 + d3,
      subtasks: [
        {
          id: `st-1-${newId}`,
          subtaskNumber: 1,
          title: st1Custom?.title || "Collate calculation & draft return",
          stageName: "Team Draft",
          assignedTo: st1Custom?.assignedTo || leadAssignee || defaultTeamOwner,
          assignedRole: st1Custom?.assignedRole || leadRole || "Accounts Executive",
          durationDays: d1,
          deadline: st1Custom?.deadline || item.statutoryDueDate,
          status: "pending",
        },
        {
          id: `st-2-${newId}`,
          subtaskNumber: 2,
          title: st2Custom?.title || "CFO statutory review & validation",
          stageName: "CFO Review",
          assignedTo: st2Custom?.assignedTo || defaultCfoOwner,
          assignedRole: st2Custom?.assignedRole || "Virtual CFO",
          durationDays: d2,
          deadline: st2Custom?.deadline || item.statutoryDueDate,
          status: "pending",
        },
        {
          id: `st-3-${newId}`,
          subtaskNumber: 3,
          title: st3Custom?.title || "Payment challan & final filing",
          stageName: "Filing & Payment",
          assignedTo: st3Custom?.assignedTo || leadAssignee || defaultTeamOwner,
          assignedRole: st3Custom?.assignedRole || "Tax Associate",
          durationDays: d3,
          deadline: st3Custom?.deadline || item.statutoryDueDate,
          status: "pending",
        },
      ],
    };

    setAllCompliancesMap((prev) => {
      const list = prev[activeCompanyId] || [];
      return {
        ...prev,
        [activeCompanyId]: [newItem, ...list],
      };
    });
    persistComplianceItem(
      newItem,
      activeCompanyId,
      "CREATED",
      `Added custom compliance "${item.name}" assigned to ${leadAssignee} (${d1 + d2 + d3}d total subtask duration)`,
    );
    showToast(`New compliance added: ${item.name} (Assigned to ${leadAssignee})`);
  };

  const deleteComplianceMasterItem = (id: string) => {
    setAllCompliancesMap((prev) => {
      const list = prev[activeCompanyId] || [];
      return {
        ...prev,
        [activeCompanyId]: list.filter((c) => c.id !== id),
      };
    });
    const dbId = toUuid(id, activeCompanyId);
    void (async () => {
      const { error } = await supabase.from("compliance_items").delete().eq("id", dbId);
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["compliance_items"] });
      }
      void logAuditEvent("COMPLIANCE_DELETED", "compliance_items", dbId, activeCompanyId, {
        message: `Deleted compliance record (ID: ${id})`,
        status: "warning",
      });
    })();
    showToast("Compliance item deleted");
  };

  const addUserAccount = (user: Omit<UserAccount, "id">) => {
    const newId = `user-${Date.now()}`;
    const defaultPerms =
      user.permissions ||
      buildPermissionsFromPreset(
        user.permissionPreset || (user.role === "client" ? "view_only" : "view_and_edit"),
        user.role,
      );
    const newUser: UserAccount = {
      ...user,
      id: newId,
      permissions: defaultPerms,
      permissionPreset:
        user.permissionPreset || (user.role === "client" ? "view_only" : "view_and_edit"),
    };
    setUserPermissions((prev) => ({
      ...prev,
      [newId]: defaultPerms,
    }));
    setUserAccounts((prev) => [...prev, newUser]);
    void (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token && user.email) {
          await fetch("/api/admin/invite-user", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              email: user.email,
              fullName: user.name,
              role: user.role,
              companyIds:
                user.assignedCompanyIds || (user.companyId !== "all" ? [user.companyId] : []),
              canEditCompanies: user.role !== "client",
            }),
          });
        }
      } catch (e) {
        console.error("Failed to call invite-user:", e);
      }
    })();
    void logAuditEvent("RIGHTS_MODIFIED", "user_accounts", newId, activeCompanyId, {
      message: `Created user account for ${newUser.name} (${newUser.role})`,
    });
    showToast(`User account "${newUser.name}" added with specific access rights`);
  };

  const updateUserAccount = (user: UserAccount) => {
    const existingUser = userAccounts.find((u) => u.id === user.id);
    const oldName = existingUser?.name?.trim();
    const newName = user.name.trim();
    const initials =
      newName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() ||
      user.avatar ||
      "US";
    const resolvedPerms =
      user.permissions || existingUser?.permissions || getUserPermissions(user.id);
    const normalized: UserAccount = {
      ...user,
      name: newName,
      avatar: initials,
      permissions: resolvedPerms,
    };
    setUserPermissions((prev) => ({
      ...prev,
      [normalized.id]: resolvedPerms,
    }));
    setUserAccounts((prev) => prev.map((u) => (u.id === normalized.id ? normalized : u)));
    if (currentUser.id === normalized.id) {
      setCurrentUser(normalized);
    }
    if (oldName && oldName.toLowerCase() !== newName.toLowerCase()) {
      setAllCompliancesMap((prevMap) => {
        const next: Record<string, ComplianceItem[]> = {};
        Object.keys(prevMap).forEach((cId) => {
          next[cId] = (prevMap[cId] || []).map((c) => ({
            ...c,
            assignedTo:
              (c.assignedTo || "").trim().toLowerCase() === oldName.toLowerCase()
                ? newName
                : c.assignedTo,
            subtasks: c.subtasks
              ? (c.subtasks.map((st) =>
                  st && (st.assignedTo || "").trim().toLowerCase() === oldName.toLowerCase()
                    ? { ...st, assignedTo: newName }
                    : st,
                ) as [SubTask, SubTask, SubTask])
              : c.subtasks,
          }));
        });
        return next;
      });
      setAllActionsMap((prevMap) => {
        const next: Record<string, ActionItem[]> = {};
        Object.keys(prevMap).forEach((cId) => {
          next[cId] = (prevMap[cId] || []).map((a) => ({
            ...a,
            assignedTo:
              (a.assignedTo || "").trim().toLowerCase() === oldName.toLowerCase()
                ? newName
                : a.assignedTo,
          }));
        });
        return next;
      });
      setAllActionFlowTasks((prev) =>
        prev.map((t) =>
          (t.assignedTo || "").trim().toLowerCase() === oldName.toLowerCase()
            ? { ...t, assignedTo: newName }
            : t,
        ),
      );
    }
    void logAuditEvent("RIGHTS_MODIFIED", "user_accounts", normalized.id, activeCompanyId, {
      message: `Updated user & team member profile for ${normalized.name} (${normalized.roleTitle})`,
    });
    void (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token) {
          await fetch("/api/admin/change-role", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              targetUserId: normalized.id,
              targetEmail: normalized.email,
              newRole: normalized.role,
            }),
          });
          if (normalized.companyId && normalized.companyId !== "all") {
            await fetch("/api/admin/set-company-access", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                targetUserId: normalized.id,
                companyId: normalized.companyId,
                canEdit: normalized.role !== "client",
              }),
            });
          }
        }
      } catch (e) {
        console.error("Failed to update user on server:", e);
      }
    })();
    showToast(`Updated team member "${normalized.name}"`);
  };

  const deleteUserAccount = (id: string) => {
    const target = userAccounts.find((u) => u.id === id);
    const remaining = userAccounts.filter((u) => u.id !== id);
    setUserAccounts((prev) => prev.filter((u) => u.id !== id));
    if (target) {
      const removedName = target.name.trim().toLowerCase();
      const replacementTeam =
        remaining.find((u) => u.role === "client_team")?.name ||
        remaining[0]?.name ||
        getPrimaryCfoForCompany(activeCompanyId);
      const replacementCfo =
        remaining.find((u) => u.role === "cfo")?.name || getPrimaryCfoForCompany(activeCompanyId);
      const fallbackName = target.role === "cfo" ? replacementCfo : replacementTeam;

      setAllCompliancesMap((prevMap) => {
        const next: Record<string, ComplianceItem[]> = {};
        Object.keys(prevMap).forEach((cId) => {
          next[cId] = (prevMap[cId] || []).map((c) => ({
            ...c,
            assignedTo:
              (c.assignedTo || "").trim().toLowerCase() === removedName
                ? fallbackName
                : c.assignedTo,
            subtasks: c.subtasks
              ? (c.subtasks.map((st) =>
                  st && (st.assignedTo || "").trim().toLowerCase() === removedName
                    ? {
                        ...st,
                        assignedTo: st.subtaskNumber === 2 ? replacementCfo : fallbackName,
                      }
                    : st,
                ) as [SubTask, SubTask, SubTask])
              : c.subtasks,
          }));
        });
        return next;
      });
      setAllActionsMap((prevMap) => {
        const next: Record<string, ActionItem[]> = {};
        Object.keys(prevMap).forEach((cId) => {
          next[cId] = (prevMap[cId] || []).map((a) => ({
            ...a,
            assignedTo:
              (a.assignedTo || "").trim().toLowerCase() === removedName
                ? fallbackName
                : a.assignedTo,
          }));
        });
        return next;
      });
      setAllActionFlowTasks((prev) =>
        prev.map((t) =>
          (t.assignedTo || "").trim().toLowerCase() === removedName
            ? { ...t, assignedTo: fallbackName }
            : t,
        ),
      );

      void logAuditEvent("RIGHTS_MODIFIED", "user_accounts", id, activeCompanyId, {
        status: "warning",
        message: `Removed user / team member account "${target.name}" (${target.email})`,
      });
    }
    showToast("Team member / user account removed");
  };

  const approveCfoComplianceReview = (companyId: string, complianceId: string) => {
    setAllCompliancesMap((prevMap) => {
      const list = prevMap[companyId] || [];
      const updated = list.map((comp) => {
        if (comp.id !== complianceId) return comp;
        const nowFormatted = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const updatedSubtasks = comp.subtasks.map((st) => {
          if (st.subtaskNumber === 2) {
            return {
              ...st,
              status: "completed",
              completedAt: nowFormatted,
              completedBy: `${getPrimaryCfoForCompany(companyId)} (CFO)`,
            } as SubTask;
          }
          return st;
        }) as [SubTask, SubTask, SubTask];

        const next = {
          ...comp,
          subtasks: updatedSubtasks,
        };
        persistComplianceItem(
          next,
          companyId,
          "UPDATED",
          `CFO approved compliance review for "${comp.name}"`,
        );
        return next;
      });
      return {
        ...prevMap,
        [companyId]: updated,
      };
    });
    showToast("CFO Sign-Off Approved: Compliance moved to Portal Filing queue.");
  };

  const logout = () => {
    addAuditLog(
      "USER_LOGOUT",
      `User ${currentUser.name} signed out securely from session`,
      "success",
    );
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vcfo_is_authenticated");
        localStorage.removeItem("vcfo_preview_role");
        localStorage.removeItem("vcfo_user_account_v2");
      }
    } catch {}
    setIsAuthenticated(false);
    setIsAuthModalOpen(false);
    void supabase.auth.signOut().catch(() => {});
    showToast("Signed out securely. Please sign in to access your workspace.");
  };

  const resetToDefaultData = () => {
    void queryClient.invalidateQueries({ queryKey: ["compliance_items"] });
    void queryClient.invalidateQueries({ queryKey: ["action_items"] });
    void queryClient.invalidateQueries({ queryKey: ["budget_items"] });
    void queryClient.invalidateQueries({ queryKey: ["executive_reports"] });
    void queryClient.invalidateQueries({ queryKey: ["repository_matters"] });
    void queryClient.invalidateQueries({ queryKey: ["mis_uploads"] });
    void queryClient.invalidateQueries({ queryKey: ["mis_remarks"] });
    showToast("Synchronized workspace data with Supabase database.");
  };

  // Cross-company portfolio summary for CFO All Companies Overview
  const allCompaniesOverview = useMemo<CompanyOverviewSummary[]>(() => {
    return companies.map((company) => {
      const rawCompList =
        allCompliancesMap[company.id] || ALL_COMPANIES_COMPLIANCES[company.id] || [];
      const activeCycle = selectedComplianceMonth || getCurrentMonthKey();
      const compList = buildRolledComplianceList(rawCompList, activeCycle, {
        includeEarlierCompleted: !autoHideEarlierCompleted,
      }).filter((c) => !c?.isHidden);
      const actList = (allActionsMap[company.id] || []).filter((a) => !a?.isHidden);
      const mis =
        allMISMap[company.id] || COMPANY_FINANCIAL_MIS[company.id] || INITIAL_FINANCIAL_MIS;

      let fullyCompleted = 0;
      let totalSubtasksDone = 0;
      let cfoReviewPending = 0;
      let taxPaid = 0;
      let taxPending = 0;

      compList.forEach((comp) => {
        const subtasks = comp?.subtasks || [];
        const doneCount = subtasks.filter((s) => s && s.status === "completed").length;
        totalSubtasksDone += doneCount;
        if (doneCount === 3) fullyCompleted++;
        if (subtasks[0]?.status === "completed" && subtasks[1]?.status === "pending") {
          cfoReviewPending++;
        }
        if (comp.taxAmount) {
          if (subtasks[2]?.status === "completed") taxPaid += comp.taxAmount;
          else taxPending += comp.taxAmount;
        }
      });

      const totalSubtasks = compList.length * 3;
      const overallPct =
        totalSubtasks > 0 ? Math.round((totalSubtasksDone / totalSubtasks) * 100) : 0;
      const openActions = (actList || []).filter((a) => a && a.status !== "Completed").length;
      const now = new Date();
      const overdueActions = (actList || []).filter((a) => {
        if (!a || a.status === "Completed") return false;
        const d = new Date(a.fixedDeadline);
        return !isNaN(d.getTime()) && d < now;
      }).length;

      const pendingCompliances = (compList || [])
        .filter((c) => c && (!c.subtasks || !c.subtasks[2] || c.subtasks[2].status !== "completed"))
        .sort(compareDueDates);
      const earliestPending = pendingCompliances[0];
      const nextUpcomingDeadline = earliestPending
        ? `${earliestPending.name} (${formatDueDate(nextDueDate(earliestPending))})`
        : "All filings up to date";

      let complianceHealth: "smooth" | "attention" | "critical" = "smooth";
      let complianceStatusSummary = "Smooth • Filings On Track";
      const hasOverdueFiling = compList.some((c) => {
        if (!c || !c.dueDates || !c.dueDates[0]) return false;
        const isFiled = c.subtasks && c.subtasks[2]?.status === "completed";
        const d = new Date(c.dueDates[0]);
        return !isFiled && !isNaN(d.getTime()) && d < now;
      });

      if (hasOverdueFiling) {
        complianceHealth = "critical";
        complianceStatusSummary = "Statutory Deadline Overdue";
      } else if (cfoReviewPending > 0) {
        complianceHealth = "attention";
        complianceStatusSummary = `${cfoReviewPending} Sign-Off${cfoReviewPending > 1 ? "s" : ""} Awaiting CFO`;
      } else {
        complianceStatusSummary = `Smooth • ${fullyCompleted}/${compList.length} Closed (${overallPct}%)`;
      }

      let actionHealth: "smooth" | "attention" | "critical" = "smooth";
      let actionStatusSummary = "Smooth • All On Track";
      if (overdueActions > 0) {
        actionHealth = "critical";
        actionStatusSummary = `${overdueActions} Action${overdueActions > 1 ? "s" : ""} Overdue`;
      } else if (openActions > 4) {
        actionHealth = "attention";
        actionStatusSummary = `${openActions} Actions Active (Review Load)`;
      } else if (openActions > 0) {
        actionHealth = "smooth";
        actionStatusSummary = `${openActions} Open • On Schedule`;
      } else {
        actionStatusSummary = "Smooth • All Actions Done";
      }

      const bgtItems = (allBudgetMap[company.id] || []).filter((b) => !b?.isHidden);
      const majorVarianceItems: string[] = [];
      bgtItems.forEach((item) => {
        const m = item.monthly?.["sep"] || item.monthly?.["aug"];
        if (m && m.budget > 0 && m.actual > 0) {
          const varPct = ((m.actual - m.budget) / m.budget) * 100;
          if ((item as any).type === "expense" && varPct > 8) {
            majorVarianceItems.push(`${item.name} (+${varPct.toFixed(1)}%)`);
          } else if ((item as any).type === "income" && varPct < -8) {
            majorVarianceItems.push(`${item.name} (${varPct.toFixed(1)}% dip)`);
          }
        }
      });

      if (company.id === "client-102" && majorVarianceItems.length === 0) {
        majorVarianceItems.push("Fleet Fuel & Maintenance (+12.2%)");
      }

      let misVarianceStatus: "smooth" | "moderate" | "critical" = "smooth";
      let misHealth: "smooth" | "attention" | "critical" = "smooth";
      let misStatusSummary = "Smooth • No Major Deviation";

      if (
        majorVarianceItems.length > 0 ||
        (mis.creditorsOver45Days && mis.creditorsOver45Days > 300000)
      ) {
        if (
          majorVarianceItems.some((v) => v.includes("+18") || v.includes("+12")) ||
          (mis.creditorsOver45Days && mis.creditorsOver45Days > 400000)
        ) {
          misVarianceStatus = "critical";
          misHealth = "critical";
          misStatusSummary = `Major Deviation: ${majorVarianceItems[0] || "MSME > 45d"}`;
        } else {
          misVarianceStatus = "moderate";
          misHealth = "attention";
          misStatusSummary = `Moderate Deviation: ${majorVarianceItems[0] || "MSME Alert"}`;
        }
      } else if (mis.debtorDaysDSO > 50) {
        misVarianceStatus = "moderate";
        misHealth = "attention";
        misStatusSummary = `DSO Elevated (${mis.debtorDaysDSO} days)`;
      } else {
        misStatusSummary = `Smooth • On Budget (Runway ${mis.cashRunwayMonths} Mo)`;
      }

      const criticalPoints: string[] = [];
      if (overdueActions > 0) {
        criticalPoints.push(
          `${overdueActions} overdue action item${overdueActions > 1 ? "s" : ""} breaching SLA`,
        );
      }
      if (cfoReviewPending > 0) {
        criticalPoints.push(
          `${cfoReviewPending} compliance filing${cfoReviewPending > 1 ? "s" : ""} awaiting CFO review sign-off`,
        );
      }
      if (majorVarianceItems.length > 0) {
        criticalPoints.push(`Budget variance breach: ${majorVarianceItems.join(", ")}`);
      }
      if (mis.creditorsOver45Days && mis.creditorsOver45Days > 0) {
        criticalPoints.push(
          `MSME Sec 43B(h): ₹${(mis.creditorsOver45Days / 100000).toFixed(1)}L payable > 45 days`,
        );
      }
      if (mis.cashRunwayMonths < 8) {
        criticalPoints.push(`Cash runway monitor: ${mis.cashRunwayMonths} months`);
      }

      let overallHealth: "smooth" | "attention" | "critical" = "smooth";
      if (
        complianceHealth === "critical" ||
        actionHealth === "critical" ||
        misHealth === "critical"
      ) {
        overallHealth = "critical";
      } else if (
        complianceHealth === "attention" ||
        actionHealth === "attention" ||
        misHealth === "attention"
      ) {
        overallHealth = "attention";
      }

      return {
        companyId: company.id,
        companyName: company.companyName || "Corporate Entity",
        entityType: company.legalEntity || "Private Limited Company",
        gstin: company.gstin || "27AAACN4921E1ZQ",
        sector: company.sector || "Enterprise Services",
        compliancePercentage: overallPct,
        fullyCompletedCompliances: fullyCompleted,
        totalCompliances: compList.length,
        pendingCfoReviews: cfoReviewPending,
        pendingActions: openActions,
        overdueActions,
        monthlyRevenue: mis.monthlyRevenue || 0,
        cashRunwayMonths: mis.cashRunwayMonths || 0,
        taxPaid,
        taxPending,
        nextUpcomingDeadline,
        company,
        complianceStats: {
          overallCompliancePercentage: overallPct,
          fullyCompletedCompliances: fullyCompleted,
          totalCompliances: compList.length,
          cfoReviewPendingCount: cfoReviewPending,
          openActionsCount: openActions,
          overdueActionsCount: overdueActions,
          taxPaid,
          taxPending,
        },
        mis,
        overallHealth,
        complianceHealth,
        actionHealth,
        misHealth,
        complianceStatusSummary,
        actionStatusSummary,
        misStatusSummary,
        misVarianceStatus,
        criticalPoints,
      };
    });
  }, [
    companies,
    allCompliancesMap,
    allActionsMap,
    allMISMap,
    allBudgetMap,
    selectedComplianceMonth,
    autoHideEarlierCompleted,
  ]);

  // Consolidated critical or delayed items across all companies
  const criticalDelayedItems = useMemo<CriticalDelayedItem[]>(() => {
    const list: CriticalDelayedItem[] = [];
    const now = new Date();

    // 1. Statutory compliances across all companies
    companies.forEach((company) => {
      const compList = (allCompliancesMap[company.id] || []).filter((c) => !c?.isHidden);
      compList.forEach((comp) => {
        const subtasks = comp?.subtasks || [];
        const isFiled = subtasks[2]?.status === "completed";
        const isCfoReviewPending =
          subtasks[0]?.status === "completed" && subtasks[1]?.status === "pending";

        if (!isFiled && (comp.criticality === "Critical" || isCfoReviewPending)) {
          const dueIso = nextDueDate(comp);
          const formatted = dueIso ? formatDueDate(dueIso) : comp.statutoryDueDate.split(";")[0];
          const days = daysUntilDue(comp);

          list.push({
            id: `crit-comp-${company.id}-${comp.id}`,
            type: "compliance",
            companyId: company.id,
            companyName: company.companyName,
            title: `${comp.name} (${comp.category})`,
            category: comp.category,
            severity:
              days !== null && days < 0 ? "Overdue" : isCfoReviewPending ? "Critical" : "Delayed",
            deadlineOrAge: `Due: ${formatted}`,
            assigneeOrDept: isCfoReviewPending
              ? "CFO Review Pending"
              : subtasks[0]?.status === "pending"
                ? "Team Collation"
                : "Filing Desk",
            penaltyOrRisk:
              comp.penaltyClause ||
              "Statutory late fees, penalty notice, and interest under relevant Act",
            financialAmount: comp.taxAmount,
            stageInfo: isCfoReviewPending
              ? "Subtask 2 awaiting CFO Sign-Off"
              : "Draft collation in progress",
            cfoReviewPending: isCfoReviewPending,
            rawDueDate: dueIso || "9999-12-31",
          });
        }
      });
    });

    // 2. Action items across all companies
    companies.forEach((company) => {
      const actList = (allActionsMap[company.id] || []).filter((a) => !a?.isHidden);
      actList.forEach((act) => {
        if (act && act.status !== "Completed") {
          const d = new Date(act.fixedDeadline);
          const isOverdue = !isNaN(d.getTime()) && d < now;
          const isUrgent = act.priority === "Urgent";

          if (isOverdue || isUrgent) {
            const iso = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "9999-12-31";
            list.push({
              id: `crit-act-${company.id}-${act.id}`,
              type: "action",
              companyId: company.id,
              companyName: company.companyName,
              title: act.title,
              category: act.category,
              severity: isOverdue ? "Overdue" : "Critical",
              deadlineOrAge: `Target: ${act.fixedDeadline.split(" ")[0]}`,
              assigneeOrDept: `${act.assignedTo} (${act.assignedRole || "Finance Team"})`,
              penaltyOrRisk: act.remarks || act.description,
              stageInfo: `${act.status} • Priority: ${act.priority}`,
              cfoReviewPending: false,
              rawDueDate: iso,
            });
          }
        }
      });
    });

    return list.sort((a, b) => {
      const dateA = a.rawDueDate || "9999-12-31";
      const dateB = b.rawDueDate || "9999-12-31";
      return dateA.localeCompare(dateB);
    });
  }, [companies, allCompliancesMap, allActionsMap, clientProfile]);

  const toggleSubtask = (
    complianceId: string,
    subtaskNumber: 1 | 2 | 3,
    notes?: string,
    docRef?: string,
  ) => {
    const currentList = allCompliancesMap[activeCompanyId] || [];
    const comp = currentList.find(
      (c) => isMatchingCompliance(c.id, complianceId, c.name),
    );
    if (!comp) return;

    const currentSubtask = comp.subtasks.find((s) => s.subtaskNumber === subtaskNumber);
    const isAttemptingToComplete = currentSubtask && currentSubtask.status !== "completed";

    if (isAttemptingToComplete) {
      if (subtaskNumber === 2) {
        const isSt1Done = comp.subtasks[0]?.status === "completed";
        if (!isSt1Done) {
          showToast(
            "⚠️ Sequential Workflow: Subtask 1 (Team Draft) must be completed before Subtask 2 (CFO Review) can be initiated or marked completed.",
            "warning",
          );
          return;
        }
      } else if (subtaskNumber === 3) {
        const isSt2Done = comp.subtasks[1]?.status === "completed";
        if (!isSt2Done) {
          showToast(
            "⚠️ Sequential Workflow: Subtask 2 (CFO Review) must be completed before Subtask 3 (Filing & Payment) can be initiated or filed.",
            "warning",
          );
          return;
        }

        const hasProof =
          !!comp?.completionProofDoc ||
          !!(comp?.completionProofDocs && comp.completionProofDocs.length > 0);

        if (!hasProof) {
          showToast(
            "⚠️ Proof Required: Filing acknowledgement / challan must be uploaded before completing Subtask 3 and finalizing compliance.",
            "error",
          );
          setComplianceProofModalTarget(comp);
          return;
        }
      }
    }

    setAllCompliancesMap((prevMap) => {
      const list = prevMap[activeCompanyId] || [];
      const updatedList = list.map((item) => {
        if (!isMatchingCompliance(item.id, complianceId, item.name)) return item;

        const nowFormatted = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const updatedSubtasks = item.subtasks.map((st) => {
          if (st.subtaskNumber !== subtaskNumber) return st;

          const isNowCompleted = st.status !== "completed";

          return {
            ...st,
            status: isNowCompleted ? "completed" : "pending",
            completedAt: isNowCompleted ? st.completedAt || nowFormatted : undefined,
            completedBy: isNowCompleted
              ? role === "cfo"
                ? `${getPrimaryCfoForCompany(activeCompanyId)} (CFO)`
                : currentUser?.name || getPrimaryTeamMemberForCompany(activeCompanyId)
              : undefined,
            notes: notes !== undefined ? notes : st.notes,
            documentRef: docRef !== undefined ? docRef : st.documentRef,
          } as SubTask;
        }) as [SubTask, SubTask, SubTask];

        if (subtaskNumber === 1 && updatedSubtasks[0].status === "pending") {
          if (
            updatedSubtasks[1].status === "completed" ||
            updatedSubtasks[2].status === "completed"
          ) {
            updatedSubtasks[1] = {
              ...updatedSubtasks[1],
              status: "pending",
              completedAt: undefined,
              completedBy: undefined,
            };
            updatedSubtasks[2] = {
              ...updatedSubtasks[2],
              status: "pending",
              completedAt: undefined,
              completedBy: undefined,
            };
            showToast(
              "Subtask 1 reopened. Subsequent dependent subtasks reset to pending.",
              "info",
            );
          }
        } else if (subtaskNumber === 2 && updatedSubtasks[1].status === "pending") {
          if (updatedSubtasks[2].status === "completed") {
            updatedSubtasks[2] = {
              ...updatedSubtasks[2],
              status: "pending",
              completedAt: undefined,
              completedBy: undefined,
            };
            showToast("Subtask 2 reopened. Subtask 3 reset to pending.", "info");
          }
        }

        const isFinalSubtaskDone = updatedSubtasks[2].status === "completed";
        const newComplianceStatus = isFinalSubtaskDone
          ? "Filed"
          : updatedSubtasks[0].status === "completed"
            ? "In Progress"
            : "Pending";

        if (isFinalSubtaskDone && item.subtasks[2].status !== "completed") {
          showToast(`Compliance "${item.name}" is 100% completed & filed!`);
        } else if (!isFinalSubtaskDone) {
          const subtaskNames = ["Team Draft", "CFO Review", "Filing & Payment"];
          showToast(
            `Updated Sub-task ${subtaskNumber} (${subtaskNames[subtaskNumber - 1]}) for "${item.name}"`,
          );
        }

        const next = {
          ...item,
          status: newComplianceStatus,
          subtasks: updatedSubtasks,
        };
        persistComplianceItem(
          next,
          activeCompanyId,
          "UPDATED",
          `Toggled Subtask ${subtaskNumber} for compliance "${item.name}"`,
        );
        return next;
      });

      return {
        ...prevMap,
        [activeCompanyId]: updatedList,
      };
    });
  };

  const uploadComplianceProof = (
    complianceId: string,
    proofData: Omit<ComplianceProofDocument, "id" | "uploadedAt" | "uploadedBy">,
    autoMarkFinalSubtaskCompleted = true,
  ) => {
    const now = new Date();
    const nowFormatted = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const uploaderName =
      role === "cfo"
        ? `${getPrimaryCfoForCompany(activeCompanyId)} (Virtual CFO)`
        : currentUser?.name
          ? `${currentUser.name} (${role === "client_team" ? "Client Team" : "Client"})`
          : getPrimaryTeamMemberForCompany(activeCompanyId);

    const newDoc: ComplianceProofDocument = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...proofData,
      uploadedAt: nowFormatted,
      uploadedBy: uploaderName,
    };

    const baseTargetId = normalizeComplianceId(complianceId);
    let targetCompName = "Compliance";

    setAllCompliancesMap((prevMap) => {
      // Find company containing this compliance item
      let targetCompId = activeCompanyId;
      const hasInActive = prevMap[targetCompId]?.some(
        (c) =>
          isMatchingCompliance(c.id, complianceId, c.name) ||
          normalizeComplianceId(c.id) === baseTargetId,
      );
      if (!hasInActive) {
        const found = Object.entries(prevMap).find(([, list]) =>
          list.some(
            (c) =>
              isMatchingCompliance(c.id, complianceId, c.name) ||
              normalizeComplianceId(c.id) === baseTargetId,
          ),
        );
        if (found) targetCompId = found[0];
      }

      const currentList = prevMap[targetCompId] || ALL_COMPANIES_COMPLIANCES[targetCompId] || [];
      let foundMatch = false;

      const updatedList = currentList.map((comp) => {
        const isMatch =
          isMatchingCompliance(comp.id, complianceId, comp.name) ||
          normalizeComplianceId(comp.id) === baseTargetId;
        if (!isMatch) return comp;
        foundMatch = true;
        targetCompName = comp.name;

        // When filing acknowledgement / proof is uploaded, mark all prior and final subtasks as completed
        const updatedSubtasks = comp.subtasks.map((st) => {
          if (autoMarkFinalSubtaskCompleted) {
            return {
              ...st,
              status: "completed",
              completedAt: st.completedAt || nowFormatted,
              completedBy: st.completedBy || uploaderName,
              documentRef:
                st.subtaskNumber === 3
                  ? `ARN: ${proofData.arnOrChallanNo}`
                  : (st.documentRef || `Verified via ${proofData.documentCategory}`),
              notes: st.subtaskNumber === 3 ? (proofData.notes || st.notes) : st.notes,
            } as SubTask;
          }
          return st;
        }) as [SubTask, SubTask, SubTask];

        const next: ComplianceItem = {
          ...comp,
          status: "Filed",
          arnOrChallanNo: proofData.arnOrChallanNo,
          completionProofDoc: newDoc,
          completionProofDocs: [...(comp.completionProofDocs || []), newDoc],
          subtasks: updatedSubtasks,
          _userModifiedInCycle: true,
        };
        persistComplianceItem(
          next,
          targetCompId,
          "UPDATED",
          `Filing proof uploaded for "${comp.name}" - File: ${newDoc.fileName}, ARN: ${proofData.arnOrChallanNo}`,
        );
        return next;
      });

      // If item was not yet in currentList but in rawCompliances, seed it
      if (!foundMatch) {
        const fallbackItem = rawCompliances.find(
          (c) =>
            isMatchingCompliance(c.id, complianceId, c.name) ||
            normalizeComplianceId(c.id) === baseTargetId,
        );
        if (fallbackItem) {
          targetCompName = fallbackItem.name;
          const next: ComplianceItem = {
            ...fallbackItem,
            id: baseTargetId || fallbackItem.id,
            status: "Filed",
            arnOrChallanNo: proofData.arnOrChallanNo,
            completionProofDoc: newDoc,
            completionProofDocs: [...(fallbackItem.completionProofDocs || []), newDoc],
            _userModifiedInCycle: true,
            subtasks: fallbackItem.subtasks.map((st) => ({
              ...st,
              status: "completed",
              completedAt: st.completedAt || nowFormatted,
              completedBy: st.completedBy || uploaderName,
              documentRef:
                st.subtaskNumber === 3
                  ? `ARN: ${proofData.arnOrChallanNo}`
                  : (st.documentRef || `Verified via ${proofData.documentCategory}`),
            })) as [SubTask, SubTask, SubTask],
          };
          updatedList.push(next);
          persistComplianceItem(
            next,
            targetCompId,
            "UPDATED",
            `Filing proof uploaded for "${next.name}"`,
          );
        }
      }

      return {
        ...prevMap,
        [targetCompId]: updatedList,
      };
    });

    // Also update selectedCompliance in modal if currently open
    setSelectedCompliance((prev) => {
      if (!prev) return prev;
      const isMatch =
        isMatchingCompliance(prev.id, complianceId, prev.name) ||
        normalizeComplianceId(prev.id) === baseTargetId;
      if (!isMatch) return prev;
      return {
        ...prev,
        status: "Filed",
        arnOrChallanNo: proofData.arnOrChallanNo,
        completionProofDoc: newDoc,
        completionProofDocs: [...(prev.completionProofDocs || []), newDoc],
        _userModifiedInCycle: true,
        subtasks: prev.subtasks.map((st) => ({
          ...st,
          status: "completed",
          completedAt: st.completedAt || nowFormatted,
          completedBy: st.completedBy || uploaderName,
          documentRef:
            st.subtaskNumber === 3
              ? `ARN: ${proofData.arnOrChallanNo}`
              : (st.documentRef || `Verified via ${proofData.documentCategory}`),
        })) as [SubTask, SubTask, SubTask],
      };
    });

    // Also update allActionFlowTasks
    setAllActionFlowTasks((prevTasks) =>
      prevTasks.map((t) => {
        const isMatch =
          t.status !== "completed" &&
          ((targetCompName &&
            (t.title.toLowerCase().includes(targetCompName.toLowerCase()) ||
              targetCompName.toLowerCase().includes(t.title.toLowerCase()))) ||
            (t.complianceId &&
              (isMatchingCompliance(t.complianceId, complianceId) ||
                normalizeComplianceId(t.complianceId) === baseTargetId)));
        if (!isMatch) return t;
        const next: ActionFlowTask = {
          ...t,
          status: "completed",
          remarks: t.remarks
            ? `${t.remarks} • Proof uploaded (${newDoc.fileName}, ARN: ${proofData.arnOrChallanNo})`
            : `Proof uploaded (${newDoc.fileName}, ARN: ${proofData.arnOrChallanNo})`,
        };
        persistActionFlowTask(next, "UPDATED");
        return next;
      }),
    );

    // Also update any matching Action Task in allActionsMap that tracks this compliance
    setAllActionsMap((prevMap) => {
      let compId = activeCompanyId;
      if (!prevMap[compId]) {
        compId = Object.keys(prevMap)[0] || activeCompanyId;
      }
      const actions = prevMap[compId] || [];
      const hasMatch = actions.some(
        (a) =>
          a.status !== "completed" &&
          targetCompName &&
          (a.title.toLowerCase().includes(targetCompName.toLowerCase()) ||
            targetCompName.toLowerCase().includes(a.title.toLowerCase())),
      );
      if (!hasMatch) return prevMap;

      return {
        ...prevMap,
        [compId]: actions.map((a) => {
          if (
            a.status !== "completed" &&
            targetCompName &&
            (a.title.toLowerCase().includes(targetCompName.toLowerCase()) ||
              targetCompName.toLowerCase().includes(a.title.toLowerCase()))
          ) {
            return {
              ...a,
              status: "completed" as const,
              completedAt: nowFormatted,
              progressPercentage: 100,
              remarks: a.remarks
                ? `${a.remarks} • Proof uploaded (${newDoc.fileName}, ARN: ${proofData.arnOrChallanNo})`
                : `Proof uploaded (${newDoc.fileName}, ARN: ${proofData.arnOrChallanNo})`,
            };
          }
          return a;
        }),
      };
    });

    showToast(`✅ Proof uploaded! "${targetCompName || "Compliance"}" marked 100% completed & filed.`);
  };

  const deleteComplianceProof = (complianceId: string, proofId: string) => {
    let targetCompName = "Compliance";
    const baseTargetId = normalizeComplianceId(complianceId);

    setAllCompliancesMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      const updatedList = currentList.map((comp) => {
        const isMatch =
          isMatchingCompliance(comp.id, complianceId, comp.name) ||
          normalizeComplianceId(comp.id) === baseTargetId;
        if (!isMatch) return comp;
        targetCompName = comp.name;

        const remainingDocs = (comp.completionProofDocs || []).filter((d) => d.id !== proofId);
        const newActiveDoc =
          remainingDocs.length > 0 ? remainingDocs[remainingDocs.length - 1] : undefined;

        const updatedSubtasks = comp.subtasks.map((st) => {
          if (!newActiveDoc && st.subtaskNumber === 3) {
            return {
              ...st,
              status: "pending",
              completedAt: undefined,
              completedBy: undefined,
            } as SubTask;
          }
          return st;
        }) as [SubTask, SubTask, SubTask];

        const next = {
          ...comp,
          completionProofDoc: newActiveDoc,
          completionProofDocs: remainingDocs,
          arnOrChallanNo: newActiveDoc ? newActiveDoc.arnOrChallanNo : undefined,
          status: newActiveDoc ? "Filed" : "In Progress",
          subtasks: updatedSubtasks,
        };
        persistComplianceItem(
          next,
          activeCompanyId,
          "UPDATED",
          `Filing acknowledgement proof removed for "${comp.name}". Subtask 3 set back to pending.`,
        );
        return next;
      });

      return {
        ...prevMap,
        [activeCompanyId]: updatedList,
      };
    });

    showToast(`Filing proof removed. Subtask 3 set back to pending.`, "info");
  };

  const updateCompliance = (item: ComplianceItem) => {
    setAllCompliancesMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((c) => (c.id === item.id ? item : c)),
      };
    });
    persistComplianceItem(item, activeCompanyId, "UPDATED");
    showToast(`Compliance updated: ${item.name}`);
  };

  const assignComplianceOwner = (
    complianceId: string,
    assignedTo: string,
    assignedRole?: string,
    cascadeToSubtasks = false,
  ) => {
    let compName = "Compliance";
    setAllCompliancesMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((c) => {
          if (c.id !== complianceId) return c;
          compName = c.name;
          const nextRole = assignedRole || c.assignedRole || "Compliance Lead";
          const nextSubtasks = cascadeToSubtasks
            ? (c.subtasks.map((st) => ({
                ...st,
                assignedTo,
                assignedRole: nextRole,
              })) as [SubTask, SubTask, SubTask])
            : c.subtasks;
          const next = {
            ...c,
            assignedTo,
            assignedRole: nextRole,
            subtasks: nextSubtasks,
          };
          persistComplianceItem(
            next,
            activeCompanyId,
            "UPDATED",
            `Assigned compliance "${c.name}" to ${assignedTo}${assignedRole ? ` (${assignedRole})` : ""}${cascadeToSubtasks ? " [Cascaded to all subtasks]" : ""}`,
          );
          return next;
        }),
      };
    });
    showToast(
      `Assigned "${compName}" to ${assignedTo}${cascadeToSubtasks ? " (and all subtasks)" : ""}.`,
    );
  };

  const updateComplianceSubtaskAssignment = (
    complianceId: string,
    subtaskNumber: 1 | 2 | 3,
    updates: {
      assignedTo?: string;
      assignedRole?: string;
      durationDays?: number;
      deadline?: string;
      title?: string;
    },
  ) => {
    let compName = "Compliance";
    const detailParts: string[] = [];
    if (updates.assignedTo) detailParts.push(`Assigned to ${updates.assignedTo}`);
    if (updates.durationDays !== undefined)
      detailParts.push(`Duration fixed at ${updates.durationDays}d`);
    if (updates.deadline) detailParts.push(`Particular Date fixed: ${updates.deadline}`);

    setAllCompliancesMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((c) => {
          if (c.id !== complianceId) return c;
          compName = c.name;

          const prelimSubtasks = c.subtasks.map((st) => {
            if (st.subtaskNumber !== subtaskNumber) return st;
            return {
              ...st,
              ...(updates.title !== undefined && updates.title.trim()
                ? { title: updates.title.trim() }
                : {}),
              ...(updates.assignedTo !== undefined && updates.assignedTo.trim()
                ? { assignedTo: updates.assignedTo.trim() }
                : {}),
              ...(updates.assignedRole !== undefined && updates.assignedRole.trim()
                ? { assignedRole: updates.assignedRole.trim() }
                : {}),
              ...(updates.durationDays !== undefined
                ? { durationDays: Math.max(1, Number(updates.durationDays) || 1) }
                : {}),
              ...(updates.deadline !== undefined && updates.deadline.trim()
                ? { deadline: updates.deadline.trim() }
                : {}),
            };
          }) as [SubTask, SubTask, SubTask];

          if (updates.durationDays !== undefined && updates.deadline === undefined) {
            const baseIso = /^\d{4}-\d{2}-\d{2}$/.test(c.statutoryDueDate || "")
              ? c.statutoryDueDate
              : c.dueDates?.[0];
            if (baseIso) {
              const due = new Date(baseIso);
              if (!isNaN(due.getTime())) {
                const d3 = prelimSubtasks[2]?.durationDays ?? 2;
                const d2 = prelimSubtasks[1]?.durationDays ?? 2;
                const targetDate = new Date(due);
                if (subtaskNumber === 1) {
                  targetDate.setDate(targetDate.getDate() - (d3 + d2));
                } else if (subtaskNumber === 2) {
                  targetDate.setDate(targetDate.getDate() - d3);
                }
                const yyyy = targetDate.getFullYear();
                const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
                const dd = String(targetDate.getDate()).padStart(2, "0");
                prelimSubtasks[subtaskNumber - 1] = {
                  ...prelimSubtasks[subtaskNumber - 1],
                  deadline: `${yyyy}-${mm}-${dd}`,
                };
              }
            }
          }

          const totalDuration = prelimSubtasks.reduce((acc, st) => acc + (st.durationDays ?? 2), 0);

          const next = {
            ...c,
            durationDays: totalDuration,
            subtasks: prelimSubtasks,
          };
          persistComplianceItem(
            next,
            activeCompanyId,
            "UPDATED",
            `Updated Subtask ${subtaskNumber} of "${c.name}": ${detailParts.join(", ")}`,
          );
          return next;
        }),
      };
    });
    showToast(`Subtask ${subtaskNumber} updated (${detailParts.join(" • ") || "Saved"}).`);
  };

  const updateComplianceRemarks = (
    complianceId: string,
    remarksType: "cfo" | "client",
    text: string,
  ) => {
    const nowFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setAllCompliancesMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((c) => {
          if (c.id !== complianceId) return c;
          const next =
            remarksType === "cfo"
              ? {
                  ...c,
                  cfoRemarks: text,
                  cfoRemarksAuthor: `${getPrimaryCfoForCompany(activeCompanyId)} (Virtual CFO)`,
                  cfoRemarksUpdatedAt: nowFormatted,
                }
              : {
                  ...c,
                  clientRemarks: text,
                  clientRemarksAuthor: "Client Accounts & Finance Team",
                  clientRemarksUpdatedAt: nowFormatted,
                };
          persistComplianceItem(
            next,
            activeCompanyId,
            "UPDATED",
            `Updated ${remarksType} remarks for compliance "${c.name}"`,
          );
          return next;
        }),
      };
    });

    showToast(`Saved ${remarksType === "cfo" ? "CFO review remarks" : "Client team remarks"}`);
  };

  const addAction = (item: Omit<ActionItem, "id" | "createdAt">) => {
    const newId = makeUuid();
    const today = new Date().toISOString().split("T")[0];
    const duration = item.durationDays && item.durationDays > 0 ? item.durationDays : 5;
    const decided = item.decidedDate || today;

    let deadline = item.fixedDeadline;
    if (!deadline) {
      const d = new Date(decided);
      d.setDate(d.getDate() + duration);
      deadline = d.toISOString().split("T")[0];
    }

    const initialProgress = item.progressPercentage || 0;
    const initialStatus =
      initialProgress === 100
        ? "Completed"
        : item.status || (initialProgress > 0 ? "In Progress" : "Pending");

    const newAction: ActionItem = {
      ...item,
      id: newId,
      companyId: activeCompanyId,
      createdAt: today,
      decidedDate: decided,
      durationDays: duration,
      fixedDeadline: deadline,
      checkInCadenceDays: item.checkInCadenceDays || 2,
      progressPercentage: initialProgress,
      status: initialStatus,
      lastProgressUpdateDate: initialProgress > 0 ? today : undefined,
      progressUpdates:
        item.progressUpdates && item.progressUpdates.length > 0
          ? item.progressUpdates
          : initialProgress > 0
            ? [
                {
                  id: `upd-${Date.now()}`,
                  date: today,
                  updatedBy: item.assignedTo || currentUser?.name || "Assignee",
                  progressPercentage: initialProgress,
                  notes:
                    item.remarks ||
                    `Action decided with ${duration}-day duration. Initial progress at ${initialProgress}%.`,
                  status: initialStatus,
                },
              ]
            : [],
    };

    setAllActionsMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: [newAction, ...currentList],
      };
    });
    persistActionItem(
      newAction,
      "CREATED",
      `Action "${newAction.title}" decided with ${duration}-day duration for ${newAction.assignedTo}.`,
    );
    showToast(`New action decided: "${newAction.title}" (${duration} days duration)`);
  };

  const updateAction = (item: ActionItem) => {
    if (item.status === "Completed" && !item.completedAt) {
      item.completedAt = new Date().toISOString();
    }
    setAllActionsMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((a) => (a.id === item.id ? item : a)),
      };
    });
    persistActionItem(item, "UPDATED");
    showToast(`Action task updated: "${item.title}"`);
  };

  const updateActionProgress = (
    actionId: string,
    progressPercentage: number,
    notes: string,
    updatedStatus?: ActionStatus,
    updatedBy?: string,
  ) => {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progressPercentage)));
    const author = updatedBy || currentUser?.name || "Assignee";
    const nowFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let actionTitle = "Action task";

    setAllActionsMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      const updatedList = currentList.map((act) => {
        if (act.id !== actionId) return act;
        actionTitle = act.title;

        let newStatus: ActionStatus = updatedStatus || act.status;
        if (clampedProgress === 100) {
          newStatus = "Completed";
        } else if (clampedProgress > 0 && newStatus === "Pending") {
          newStatus = "In Progress";
        }

        const newUpdate: ActionProgressUpdate = {
          id: `upd-${Date.now()}`,
          date: nowFormatted,
          updatedBy: author,
          progressPercentage: clampedProgress,
          notes: notes.trim() || `Progress logged at ${clampedProgress}% by ${author}`,
          status: newStatus,
        };

        const next = {
          ...act,
          progressPercentage: clampedProgress,
          status: newStatus,
          completedAt: clampedProgress === 100 ? new Date().toISOString() : act.completedAt,
          lastProgressUpdateDate: nowFormatted,
          remarks: notes.trim() || act.remarks,
          progressUpdates: [newUpdate, ...(act.progressUpdates || [])],
        };
        persistActionItem(
          next,
          "UPDATED",
          `Assignee update for "${act.title}": ${clampedProgress}% reached. Note: "${notes}"`,
        );
        return next;
      });

      return {
        ...prevMap,
        [activeCompanyId]: updatedList,
      };
    });

    showToast(`Progress for "${actionTitle}" updated to ${clampedProgress}%.`);
  };

  const deleteAction = (id: string) => {
    const existing = (allActionsMap[activeCompanyId] || []).find((a) => a.id === id);
    setAllActionsMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.filter((a) => a.id !== id),
      };
    });
    const dbId = toUuid(id, activeCompanyId);
    void (async () => {
      const { error } = await supabase.from("action_items").delete().eq("id", dbId);
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["action_items"] });
      }
      void logAuditEvent("ACTION_ITEM_DELETED", "action_items", dbId, activeCompanyId, {
        message: `Deleted action item "${existing?.title || id}"`,
        status: "warning",
      });
    })();
    showToast("Action item removed.");
  };

  const toggleActionSubtask = (actionId: string, subtaskNumber: number, notes?: string) => {
    const currentList = allActionsMap[activeCompanyId] || [];
    const act = currentList.find((a) => a.id === actionId);
    if (!act) return;

    const currentSubtasks = act.subtasks || [
      {
        id: `${act.id}-s1`,
        subtaskNumber: 1,
        title: "Data collation & ledger extraction",
        status: "pending",
      },
      {
        id: `${act.id}-s2`,
        subtaskNumber: 2,
        title: "Reconciliation & computation verification",
        status: "pending",
      },
      {
        id: `${act.id}-s3`,
        subtaskNumber: 3,
        title: "Final execution & management sign-off",
        status: "pending",
      },
    ];

    const targetSubtask = currentSubtasks.find((s) => s.subtaskNumber === subtaskNumber);
    const isAttemptingToComplete = targetSubtask && targetSubtask.status !== "completed";

    if (isAttemptingToComplete && subtaskNumber > 1) {
      const priorPending = currentSubtasks.find(
        (s) => s.subtaskNumber < subtaskNumber && s.status !== "completed",
      );
      if (priorPending) {
        showToast(
          `⚠️ Sequential Workflow: Subtask ${priorPending.subtaskNumber} ("${priorPending.title}") must be completed before Subtask ${subtaskNumber} can be initiated or completed.`,
          "warning",
        );
        return;
      }
    }

    setAllActionsMap((prevMap) => {
      const list = prevMap[activeCompanyId] || [];
      const updatedList = list.map((item) => {
        if (item.id !== actionId) return item;
        const subtasks = item.subtasks || currentSubtasks;

        let willBeDone = false;
        let updatedSubtasks = subtasks.map((st) => {
          if (st.subtaskNumber !== subtaskNumber) return st;
          willBeDone = st.status !== "completed";
          return {
            ...st,
            status: (willBeDone ? "completed" : "pending") as "completed" | "pending",
            completedAt: willBeDone ? new Date().toISOString() : undefined,
            notes: notes !== undefined ? notes : st.notes,
          };
        });

        if (!willBeDone) {
          updatedSubtasks = updatedSubtasks.map((st) => {
            if (st.subtaskNumber > subtaskNumber && st.status === "completed") {
              return {
                ...st,
                status: "pending" as const,
                completedAt: undefined,
              };
            }
            return st;
          });
          showToast(
            `Subtask ${subtaskNumber} reopened. Dependent subsequent subtasks reset to pending.`,
            "info",
          );
        } else {
          showToast(`Subtask ${subtaskNumber} marked completed.`);
        }

        const allCompleted =
          updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.status === "completed");
        const anyCompleted = updatedSubtasks.some((s) => s.status === "completed");

        let newStatus: ActionStatus = item.status;
        if (allCompleted) {
          newStatus = "Completed";
        } else if (anyCompleted) {
          newStatus = "In Progress";
        } else if (item.status === "Completed") {
          newStatus = "In Progress";
        }

        const next = {
          ...item,
          status: newStatus,
          completedAt: allCompleted ? new Date().toISOString() : undefined,
          subtasks: updatedSubtasks,
        };
        persistActionItem(next, "UPDATED");
        return next;
      });

      return {
        ...prevMap,
        [activeCompanyId]: updatedList,
      };
    });
  };

  const addActionSubtask = (actionId: string, title: string) => {
    if (!title.trim()) return;
    setAllActionsMap((prevMap) => {
      const currentList = prevMap[activeCompanyId] || [];
      return {
        ...prevMap,
        [activeCompanyId]: currentList.map((act) => {
          if (act.id !== actionId) return act;
          const existing = act.subtasks || [];
          const newSubtask = {
            id: `${act.id}-s${Date.now()}`,
            subtaskNumber: existing.length + 1,
            title: title.trim(),
            status: "pending" as const,
          };
          const next = {
            ...act,
            subtasks: [...existing, newSubtask],
          };
          persistActionItem(next, "UPDATED");
          return next;
        }),
      };
    });
    showToast("New subtask milestone added");
  };

  const updateFinancialMIS = (data: Partial<FinancialMIS>) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const merged = { ...currentMIS, ...data };
      void createMisUpload({
        companyId: activeCompanyId,
        period: merged.period || "September 2026",
        statementType: "financial_mis",
        fileName: "MIS_Metrics_Update.json",
        rows: merged,
        rowCount: Object.keys(data).length,
      });
      return {
        ...prevMap,
        [activeCompanyId]: merged,
      };
    });
    showToast("Financial MIS metrics updated and persisted to database.");
  };

  const clearFinancialMisDummyData = useCallback(() => {
    setAllMISMap((prevMap) => {
      const blankPnl: PnlStatementData = {
        companyId: activeCompanyId,
        period: "Testing Actuals",
        income: {
          domesticApparelSales: 0,
          exportSalesGarments: 0,
          fabricJobWorkIncome: 0,
          dutyDrawbackRoDTEP: 0,
          scrapSalesYarnFabric: 0,
          otherOperatingRevenue: 0,
          totalRevenueFromOperations: 0,
          interestIncomeBankFD: 0,
          foreignExchangeGain: 0,
          otherNonOperatingIncome: 0,
          totalOtherIncome: 0,
          totalIncome: 0,
        },
        expenses: {
          costOfMaterialsConsumed: 0,
          purchaseOfStockInTrade: 0,
          changesInInventories: 0,
          directManufacturingWages: 0,
          processingJobWorkCharges: 0,
          powerFuelWaterCharges: 0,
          freightCartageInward: 0,
          totalDirectExpenses: 0,
          salariesAndWagesStaff: 0,
          contributionToPFESI: 0,
          staffWelfareBonus: 0,
          totalEmployeeBenefitExpenses: 0,
          interestOnWorkingCapitalCC: 0,
          interestOnTermLoans: 0,
          bankChargesProcessingFees: 0,
          totalFinanceCosts: 0,
          depreciationPlantMachinery: 0,
          depreciationFactoryBuilding: 0,
          totalDepreciationAmortisation: 0,
          rentFactoryOffice: 0,
          repairsMaintenancePlant: 0,
          insurancePlantTransit: 0,
          legalProfessionalAuditorFees: 0,
          sellingMarketingCommission: 0,
          travellingConveyance: 0,
          ratesTaxesLicences: 0,
          miscellaneousAdministrativeExpenses: 0,
          totalOtherExpenses: 0,
          totalExpenses: 0,
        },
        profitability: {
          grossProfit: 0,
          grossProfitMarginPct: 0,
          operatingEbitda: 0,
          ebitdaMarginPct: 0,
          operatingEbit: 0,
          ebitMarginPct: 0,
          profitBeforeTaxPBT: 0,
          pbtMarginPct: 0,
          currentTaxExpense: 0,
          deferredTaxCreditExpense: 0,
          totalTaxExpense: 0,
          profitAfterTaxPAT: 0,
          patMarginPct: 0,
        },
        multiMonthTrends: [],
        varianceAnalysis: [],
      };

      const blankBalanceSheet: BalanceSheetData = {
        companyId: activeCompanyId,
        asOnDate: "Testing Period",
        equityAndLiabilities: {
          equityShareCapital: 0,
          reservesAndSurplus: 0,
          totalShareholdersFunds: 0,
          longTermBorrowings: 0,
          deferredTaxLiabilitiesNet: 0,
          otherLongTermLiabilities: 0,
          longTermProvisions: 0,
          totalNonCurrentLiabilities: 0,
          shortTermBorrowings: 0,
          tradePayablesMsme: 0,
          tradePayables: 0,
          otherCurrentLiabilities: 0,
          shortTermProvisions: 0,
          totalCurrentLiabilities: 0,
          totalEquityAndLiabilities: 0,
        },
        assets: {
          tangibleFixedAssetsGross: 0,
          accumulatedDepreciation: 0,
          tangibleFixedAssetsNet: 0,
          capitalWorkInProgress: 0,
          intangibleAssets: 0,
          nonCurrentInvestments: 0,
          longTermLoansAndAdvances: 0,
          otherNonCurrentAssets: 0,
          totalNonCurrentAssets: 0,
          inventoriesRawMaterials: 0,
          inventoriesWorkInProgress: 0,
          inventoriesFinishedGoods: 0,
          inventoriesStoresSpares: 0,
          totalInventories: 0,
          tradeReceivablesOverSixMonths: 0,
          tradeReceivablesUnderSixMonths: 0,
          totalTradeReceivables: 0,
          cashAndCashEquivalents: 0,
          bankBalancesOther: 0,
          totalCashAndBank: 0,
          shortTermLoansAndAdvances: 0,
          otherCurrentAssets: 0,
          totalCurrentAssets: 0,
          totalAssets: 0,
        },
      };

      const blankDebtorAgeing: DebtorAgeingData = {
        companyId: activeCompanyId,
        asOnDate: "Testing Period",
        totalReceivables: 0,
        ageingBuckets: {
          zeroToThirtyDays: 0,
          thirtyOneToSixtyDays: 0,
          sixtyOneToNinetyDays: 0,
          ninetyOneToOneEightyDays: 0,
          aboveOneEightyDays: 0,
        },
        debtorsList: [],
      };

      const blankMIS: FinancialMIS = {
        period: "Clean Slate (Ready for Real Data)",
        monthlyRevenue: 0,
        ebitda: 0,
        ebitdaPercentage: 0,
        netProfit: 0,
        netProfitPercentage: 0,
        cashAndBankBalance: 0,
        workingCapital: 0,
        monthlyBurnRate: 0,
        cashRunwayMonths: 0,
        totalDebtors: 0,
        totalCreditors: 0,
        totalInventory: 0,
        revenueGrowthMoM: 0,
        pnlStatement: blankPnl,
        balanceSheet: blankBalanceSheet,
        debtorAgeing: blankDebtorAgeing,
        tallyLedgers: [],
        tallyMappingRules: [],
      };

      return {
        ...prevMap,
        [activeCompanyId]: blankMIS,
      };
    });
    showToast("All dummy data cleared from Financial MIS. Ready for real data testing!");
  }, [activeCompanyId, showToast]);

  const loadSampleFinancialMisData = useCallback(() => {
    setAllMISMap((prevMap) => {
      return {
        ...prevMap,
        [activeCompanyId]: INITIAL_FINANCIAL_MIS,
      };
    });
    showToast("Sample demo data reloaded for Financial MIS.");
  }, [activeCompanyId, showToast]);

  const updateWeeklyCashActuals = (
    weekId: string,
    updates: Array<{ itemId: string; actual: number; notes?: string }>,
    isClosed: boolean,
  ) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const budget = currentMIS.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;

      const updateMap = new Map(updates.map((u) => [u.itemId, u]));

      const updatedItems = budget.items.map((item) => {
        const u = updateMap.get(item.id);
        if (!u) return item;
        return {
          ...item,
          weekly: {
            ...item.weekly,
            [weekId]: {
              ...(item.weekly[weekId] || { budget: 0 }),
              actual: u.actual,
              notes: u.notes !== undefined ? u.notes : item.weekly[weekId]?.notes,
            },
          },
        };
      });

      const updatedWeeks = budget.weeks.map((w) =>
        w.id === weekId ? { ...w, isActualsClosed: isClosed } : w,
      );

      const updatedCashBudget: ThreeMonthCashBudgetModel = {
        ...budget,
        items: updatedItems,
        weeks: updatedWeeks,
      };

      return {
        ...prevMap,
        [activeCompanyId]: {
          ...currentMIS,
          threeMonthCashBudget: updatedCashBudget,
        },
      };
    });
  };

  const addShortageAction = (action: Omit<ManagementShortageAction, "id">) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const budget = currentMIS.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
      const newAction: ManagementShortageAction = {
        ...action,
        id: `act-plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      return {
        ...prevMap,
        [activeCompanyId]: {
          ...currentMIS,
          threeMonthCashBudget: {
            ...budget,
            shortageActions: [newAction, ...budget.shortageActions],
          },
        },
      };
    });
  };

  const updateShortageActionStatus = (
    actionId: string,
    status: ManagementShortageAction["status"],
  ) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const budget = currentMIS.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
      return {
        ...prevMap,
        [activeCompanyId]: {
          ...currentMIS,
          threeMonthCashBudget: {
            ...budget,
            shortageActions: budget.shortageActions.map((a) =>
              a.id === actionId ? { ...a, status } : a,
            ),
          },
        },
      };
    });
  };

  const deleteShortageAction = (actionId: string) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const budget = currentMIS.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
      return {
        ...prevMap,
        [activeCompanyId]: {
          ...currentMIS,
          threeMonthCashBudget: {
            ...budget,
            shortageActions: budget.shortageActions.filter((a) => a.id !== actionId),
          },
        },
      };
    });
  };

  const updateCashBudgetConfig = (config: {
    startingCashBalance?: number;
    minimumSafeBuffer?: number;
    sanctionedODLimit?: number;
  }) => {
    setAllMISMap((prevMap) => {
      const currentMIS = prevMap[activeCompanyId] || INITIAL_FINANCIAL_MIS;
      const budget = currentMIS.threeMonthCashBudget || INITIAL_THREE_MONTH_CASH_BUDGET;
      return {
        ...prevMap,
        [activeCompanyId]: {
          ...currentMIS,
          threeMonthCashBudget: {
            ...budget,
            startingCashBalance:
              config.startingCashBalance !== undefined
                ? config.startingCashBalance
                : budget.startingCashBalance,
            minimumSafeBuffer:
              config.minimumSafeBuffer !== undefined
                ? config.minimumSafeBuffer
                : budget.minimumSafeBuffer,
            sanctionedODLimit:
              config.sanctionedODLimit !== undefined
                ? config.sanctionedODLimit
                : budget.sanctionedODLimit,
          },
        },
      };
    });
  };

  // -------------------------------------------------------------
  // Centralized Non-Destructive Hide / Unhide Registry & Handlers
  // -------------------------------------------------------------
  const hiddenItemsRegistry = useMemo<HiddenItemRecord[]>(() => {
    const records: HiddenItemRecord[] = [];
    const compNameMap = new Map<string, string>();
    rawCompanies.forEach((c) => compNameMap.set(c.id, c.companyName));

    // 1. Hidden Companies
    rawCompanies.forEach((c) => {
      if (c.isHidden) {
        records.push({
          id: c.id,
          entityType: "company",
          entityTypeLabel: "Client Entity",
          subType: c.legalEntity,
          title: c.companyName,
          subtitle: `GSTIN: ${c.gstin || "N/A"} • Sector: ${c.sector || "General"}`,
          companyId: c.id,
          companyName: c.companyName,
          hiddenAt: c.hiddenAt,
          hiddenBy: c.hiddenBy,
        });
      }
    });

    // 2. Hidden Compliances across all companies
    Object.entries(allCompliancesMap).forEach(([compId, list]) => {
      (list || []).forEach((comp) => {
        if (comp?.isHidden) {
          records.push({
            id: comp.id,
            entityType: "compliance",
            entityTypeLabel: "Statutory Compliance",
            subType: comp.category,
            title: comp.name,
            subtitle: `${comp.frequency} • Due: ${comp.statutoryDueDate}`,
            companyId: compId,
            companyName: compNameMap.get(compId) || compId,
            hiddenAt: comp.hiddenAt,
            hiddenBy: comp.hiddenBy,
          });
        }
      });
    });

    // 3. Hidden Action Items across all companies
    Object.entries(allActionsMap).forEach(([compId, list]) => {
      (list || []).forEach((act) => {
        if (act?.isHidden) {
          records.push({
            id: act.id,
            entityType: "action",
            entityTypeLabel: "Action Tracker Item",
            subType: act.category,
            title: act.title,
            subtitle: `Assigned to: ${act.assignedTo} • Priority: ${act.priority}`,
            companyId: compId,
            companyName: compNameMap.get(compId) || compId,
            hiddenAt: act.hiddenAt,
            hiddenBy: act.hiddenBy,
          });
        }
      });
    });

    // 4. Hidden Action Flow / Gantt Tasks
    allActionFlowTasks.forEach((task) => {
      if (task?.isHidden) {
        records.push({
          id: task.id,
          entityType: "action_flow",
          entityTypeLabel: "Assigned Task (Action Flow)",
          subType: task.category,
          title: `${task.taskCode}: ${task.title}`,
          subtitle: `Assignee: ${task.assignedTo} • Due: ${task.dueDate}`,
          companyId: task.companyId,
          companyName: task.companyName || compNameMap.get(task.companyId || "") || "Portfolio",
          hiddenAt: task.hiddenAt,
          hiddenBy: task.hiddenBy,
        });
      }
    });

    // 5. Hidden Repository Items (Tax, Legal, License, SOP)
    allTaxAssessments.forEach((m) => {
      if (m?.isHidden) {
        records.push({
          id: m.id,
          entityType: "repository",
          entityTypeLabel: "Corporate Repository",
          subType: `Tax Assessment (${m.taxCategory})`,
          title: m.matterTitle,
          subtitle: `Notice/Case: ${m.caseOrNoticeNumber} • FY ${m.financialYear}`,
          companyId: m.companyId,
          companyName: m.companyName,
          hiddenAt: m.hiddenAt,
          hiddenBy: m.hiddenBy,
        });
      }
    });

    allLegalCases.forEach((m) => {
      if (m?.isHidden) {
        records.push({
          id: m.id,
          entityType: "repository",
          entityTypeLabel: "Corporate Repository",
          subType: `Legal Case (${m.legalCategory})`,
          title: m.matterTitle,
          subtitle: `Court: ${m.forumOrCourt} • Case: ${m.caseNumber}`,
          companyId: m.companyId,
          companyName: m.companyName,
          hiddenAt: m.hiddenAt,
          hiddenBy: m.hiddenBy,
        });
      }
    });

    allLicenses.forEach((m) => {
      if (m?.isHidden) {
        records.push({
          id: m.id,
          entityType: "repository",
          entityTypeLabel: "Corporate Repository",
          subType: `License / Cert (${m.licenseCategory})`,
          title: m.title,
          subtitle: `License #: ${m.licenseNumber} • Authority: ${m.issuingAuthority}`,
          companyId: m.companyId,
          companyName: m.companyName,
          hiddenAt: m.hiddenAt,
          hiddenBy: m.hiddenBy,
        });
      }
    });

    allSops.forEach((m) => {
      if (m?.isHidden) {
        records.push({
          id: m.id,
          entityType: "repository",
          entityTypeLabel: "Corporate Repository",
          subType: `SOP (${m.sopCategory})`,
          title: `${m.sopCode}: ${m.title}`,
          subtitle: `Dept: ${m.department} • Owner: ${m.owner}`,
          companyId: m.companyId,
          companyName: m.companyName,
          hiddenAt: m.hiddenAt,
          hiddenBy: m.hiddenBy,
        });
      }
    });

    // 6. Hidden User Accounts / Team Members
    rawUserAccounts.forEach((u) => {
      if (u?.isHidden) {
        records.push({
          id: u.id,
          entityType: "user",
          entityTypeLabel: "User / Team Member",
          subType: u.roleTitle,
          title: u.name,
          subtitle: `${u.email} • Role: ${u.role.toUpperCase()}`,
          companyId: u.companyId,
          companyName: u.companyName || "All Entities",
          hiddenAt: u.hiddenAt,
          hiddenBy: u.hiddenBy,
        });
      }
    });

    // 7. Hidden Budget / Variance Line Items
    Object.entries(allBudgetMap).forEach(([compId, list]) => {
      (list || []).forEach((item) => {
        if (item?.isHidden) {
          records.push({
            id: item.id,
            entityType: "budget_item",
            entityTypeLabel: "Budget / MIS Line Item",
            subType: item.category,
            title: `${item.code} - ${item.name}`,
            subtitle: item.description || `Budget Category: ${item.category}`,
            companyId: compId,
            companyName: compNameMap.get(compId) || compId,
            hiddenAt: item.hiddenAt,
            hiddenBy: item.hiddenBy,
          });
        }
      });
    });

    // 8. Hidden Executive Reports
    Object.entries(executiveReports).forEach(([compId, list]) => {
      (list || []).forEach((rep) => {
        if (rep?.isHidden) {
          records.push({
            id: rep.id,
            entityType: "executive_report",
            entityTypeLabel: "CFO Executive Report",
            subType: rep.month,
            title: rep.title,
            subtitle: `Period: ${rep.month} • Author: ${rep.authorName}`,
            companyId: compId,
            companyName: compNameMap.get(compId) || compId,
            hiddenAt: rep.hiddenAt,
            hiddenBy: rep.hiddenBy,
          });
        }
      });
    });

    // 9. Hidden MIS Operational Remarks
    rawMisRemarks.forEach((rem) => {
      if (rem?.isHidden) {
        records.push({
          id: rem.id,
          entityType: "mis_remark",
          entityTypeLabel: "MIS Variance Remark",
          subType: rem.sectionTitle,
          title: rem.title,
          subtitle: `By ${rem.addedBy} • ${rem.createdAt}`,
          companyId: rem.companyId,
          companyName: rem.companyName,
          hiddenAt: rem.hiddenAt,
          hiddenBy: rem.hiddenBy,
        });
      }
    });

    return records;
  }, [
    rawCompanies,
    allCompliancesMap,
    allActionsMap,
    allActionFlowTasks,
    allTaxAssessments,
    allLegalCases,
    allLicenses,
    allSops,
    rawUserAccounts,
    allBudgetMap,
    executiveReports,
    rawMisRemarks,
  ]);

  const toggleItemVisibility = (
    entityType: HideableEntityType,
    id: string,
    targetCompanyId?: string,
    forceState?: boolean,
  ) => {
    const nowFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const actor = currentUser?.name || "Admin";
    const compId = targetCompanyId || activeCompanyId;
    let itemName = id;
    let willHide = true;

    if (entityType === "company") {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          itemName = c.companyName;
          willHide = forceState !== undefined ? forceState : !c.isHidden;
          return {
            ...c,
            isHidden: willHide,
            hiddenAt: willHide ? nowFormatted : undefined,
            hiddenBy: willHide ? actor : undefined,
          };
        }),
      );
      if (selectedCompanyId === id) {
        const nextVisible = rawCompanies.find((c) => c.id !== id && !c.isHidden);
        if (nextVisible) setSelectedCompanyIdState(nextVisible.id);
      }
    } else if (entityType === "compliance") {
      setAllCompliancesMap((prev) => {
        const nextMap = { ...prev };
        const keysToSearch = targetCompanyId
          ? [targetCompanyId]
          : [compId, ...Object.keys(nextMap)];
        for (const k of keysToSearch) {
          const list = nextMap[k];
          if (list && list.some((c) => c.id === id)) {
            nextMap[k] = list.map((c) => {
              if (c.id !== id) return c;
              itemName = c.name;
              willHide = forceState !== undefined ? forceState : !c.isHidden;
              return {
                ...c,
                isHidden: willHide,
                hiddenAt: willHide ? nowFormatted : undefined,
                hiddenBy: willHide ? actor : undefined,
              };
            });
            break;
          }
        }
        return nextMap;
      });
    } else if (entityType === "action") {
      setAllActionsMap((prev) => {
        const nextMap = { ...prev };
        const keysToSearch = targetCompanyId
          ? [targetCompanyId]
          : [compId, ...Object.keys(nextMap)];
        for (const k of keysToSearch) {
          const list = nextMap[k];
          if (list && list.some((a) => a.id === id)) {
            nextMap[k] = list.map((a) => {
              if (a.id !== id) return a;
              itemName = a.title;
              willHide = forceState !== undefined ? forceState : !a.isHidden;
              return {
                ...a,
                isHidden: willHide,
                hiddenAt: willHide ? nowFormatted : undefined,
                hiddenBy: willHide ? actor : undefined,
              };
            });
            break;
          }
        }
        return nextMap;
      });
    } else if (entityType === "action_flow") {
      setAllActionFlowTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          itemName = t.title;
          willHide = forceState !== undefined ? forceState : !t.isHidden;
          return {
            ...t,
            isHidden: willHide,
            hiddenAt: willHide ? nowFormatted : undefined,
            hiddenBy: willHide ? actor : undefined,
          };
        }),
      );
    } else if (entityType === "repository") {
      if (allTaxAssessments.some((m) => m.id === id)) {
        setAllTaxAssessments((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            itemName = m.matterTitle;
            willHide = forceState !== undefined ? forceState : !m.isHidden;
            return {
              ...m,
              isHidden: willHide,
              hiddenAt: willHide ? nowFormatted : undefined,
              hiddenBy: willHide ? actor : undefined,
            };
          }),
        );
      } else if (allLegalCases.some((m) => m.id === id)) {
        setAllLegalCases((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            itemName = m.matterTitle;
            willHide = forceState !== undefined ? forceState : !m.isHidden;
            return {
              ...m,
              isHidden: willHide,
              hiddenAt: willHide ? nowFormatted : undefined,
              hiddenBy: willHide ? actor : undefined,
            };
          }),
        );
      } else if (allLicenses.some((m) => m.id === id)) {
        setAllLicenses((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            itemName = m.title;
            willHide = forceState !== undefined ? forceState : !m.isHidden;
            return {
              ...m,
              isHidden: willHide,
              hiddenAt: willHide ? nowFormatted : undefined,
              hiddenBy: willHide ? actor : undefined,
            };
          }),
        );
      } else if (allSops.some((m) => m.id === id)) {
        setAllSops((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            itemName = `${m.sopCode}: ${m.title}`;
            willHide = forceState !== undefined ? forceState : !m.isHidden;
            return {
              ...m,
              isHidden: willHide,
              hiddenAt: willHide ? nowFormatted : undefined,
              hiddenBy: willHide ? actor : undefined,
            };
          }),
        );
      }
    } else if (entityType === "user") {
      setUserAccounts((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          itemName = u.name;
          willHide = forceState !== undefined ? forceState : !u.isHidden;
          return {
            ...u,
            isHidden: willHide,
            hiddenAt: willHide ? nowFormatted : undefined,
            hiddenBy: willHide ? actor : undefined,
          };
        }),
      );
    } else if (entityType === "budget_item") {
      setAllBudgetMap((prev) => {
        const nextMap = { ...prev };
        const keysToSearch = targetCompanyId
          ? [targetCompanyId]
          : [compId, ...Object.keys(nextMap)];
        for (const k of keysToSearch) {
          const list = nextMap[k];
          if (list && list.some((b) => b.id === id)) {
            nextMap[k] = list.map((b) => {
              if (b.id !== id) return b;
              itemName = `${b.code} - ${b.name}`;
              willHide = forceState !== undefined ? forceState : !b.isHidden;
              return {
                ...b,
                isHidden: willHide,
                hiddenAt: willHide ? nowFormatted : undefined,
                hiddenBy: willHide ? actor : undefined,
              };
            });
            break;
          }
        }
        return nextMap;
      });
    } else if (entityType === "executive_report") {
      setExecutiveReports((prev) => {
        const nextMap = { ...prev };
        for (const k of Object.keys(nextMap)) {
          const list = nextMap[k];
          if (list && list.some((r) => r.id === id)) {
            nextMap[k] = list.map((r) => {
              if (r.id !== id) return r;
              itemName = r.title;
              willHide = forceState !== undefined ? forceState : !r.isHidden;
              return {
                ...r,
                isHidden: willHide,
                hiddenAt: willHide ? nowFormatted : undefined,
                hiddenBy: willHide ? actor : undefined,
              };
            });
            break;
          }
        }
        return nextMap;
      });
    } else if (entityType === "mis_remark") {
      setMisRemarks((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          itemName = r.title;
          willHide = forceState !== undefined ? forceState : !r.isHidden;
          return {
            ...r,
            isHidden: willHide,
            hiddenAt: willHide ? nowFormatted : undefined,
            hiddenBy: willHide ? actor : undefined,
          };
        }),
      );
    }

    addAuditLog(
      "ITEM_VISIBILITY_CHANGED",
      `${willHide ? "Hidden" : "Unhidden"} ${entityType.replace("_", " ")} item "${itemName}" (ID: ${id})`,
      "success",
    );
    showToast(
      willHide
        ? `Hidden "${itemName}" from active views. You can unhide it anytime.`
        : `Restored "${itemName}" back to active workspace views.`,
    );
  };

  const unhideAllItems = (entityType?: HideableEntityType) => {
    if (!entityType || entityType === "company") {
      setCompanies((prev) =>
        prev.map((c) => ({ ...c, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
    }
    if (!entityType || entityType === "compliance") {
      setAllCompliancesMap((prev) => {
        const next: Record<string, ComplianceItem[]> = {};
        Object.entries(prev).forEach(([k, list]) => {
          next[k] = (list || []).map((c) => ({
            ...c,
            isHidden: false,
            hiddenAt: undefined,
            hiddenBy: undefined,
          }));
        });
        return next;
      });
    }
    if (!entityType || entityType === "action") {
      setAllActionsMap((prev) => {
        const next: Record<string, ActionItem[]> = {};
        Object.entries(prev).forEach(([k, list]) => {
          next[k] = (list || []).map((a) => ({
            ...a,
            isHidden: false,
            hiddenAt: undefined,
            hiddenBy: undefined,
          }));
        });
        return next;
      });
    }
    if (!entityType || entityType === "action_flow") {
      setAllActionFlowTasks((prev) =>
        prev.map((t) => ({ ...t, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
    }
    if (!entityType || entityType === "repository") {
      setAllTaxAssessments((prev) =>
        prev.map((m) => ({ ...m, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
      setAllLegalCases((prev) =>
        prev.map((m) => ({ ...m, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
      setAllLicenses((prev) =>
        prev.map((m) => ({ ...m, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
      setAllSops((prev) =>
        prev.map((m) => ({ ...m, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
    }
    if (!entityType || entityType === "user") {
      setUserAccounts((prev) =>
        prev.map((u) => ({ ...u, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
    }
    if (!entityType || entityType === "budget_item") {
      setAllBudgetMap((prev) => {
        const next: Record<string, BudgetLineItem[]> = {};
        Object.entries(prev).forEach(([k, list]) => {
          next[k] = (list || []).map((b) => ({
            ...b,
            isHidden: false,
            hiddenAt: undefined,
            hiddenBy: undefined,
          }));
        });
        return next;
      });
    }
    if (!entityType || entityType === "executive_report") {
      setExecutiveReports((prev) => {
        const next: Record<string, MonthlyExecutiveReport[]> = {};
        Object.entries(prev).forEach(([k, list]) => {
          next[k] = (list || []).map((r) => ({
            ...r,
            isHidden: false,
            hiddenAt: undefined,
            hiddenBy: undefined,
          }));
        });
        return next;
      });
    }
    if (!entityType || entityType === "mis_remark") {
      setMisRemarks((prev) =>
        prev.map((r) => ({ ...r, isHidden: false, hiddenAt: undefined, hiddenBy: undefined })),
      );
    }

    addAuditLog(
      "ITEM_VISIBILITY_CHANGED",
      `Unhid all ${entityType ? entityType.replace("_", " ") : "workspace"} items back to active state`,
      "success",
    );
    showToast("All selected hidden items have been unhidden and restored.");
  };

  // Computed statistics for active company
  const stats = useMemo(() => {
    let fullyCompleted = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalSubtasksDone = 0;
    let cfoReviewPending = 0;
    let taxPaid = 0;
    let taxPending = 0;

    compliances.forEach((comp) => {
      const subtasks = comp?.subtasks || [];
      const doneCount = subtasks.filter((s) => s && s.status === "completed").length;
      totalSubtasksDone += doneCount;

      if (doneCount === 3) fullyCompleted++;
      else if (doneCount > 0) inProgress++;
      else notStarted++;

      if (subtasks[0]?.status === "completed" && subtasks[1]?.status === "pending") {
        cfoReviewPending++;
      }

      if (comp.taxAmount) {
        if (subtasks[2]?.status === "completed") {
          taxPaid += comp.taxAmount;
        } else {
          taxPending += comp.taxAmount;
        }
      }
    });

    const totalSubtasks = compliances.length * 3;
    const overallPct =
      totalSubtasks > 0 ? Math.round((totalSubtasksDone / totalSubtasks) * 100) : 0;

    const safeActions = actions || [];
    const totalActions = safeActions.length;
    const pendingActions = safeActions.filter((a) => a && a.status === "Pending").length;
    const inProgressActions = safeActions.filter((a) => a && a.status === "In Progress").length;
    const underReviewActions = safeActions.filter((a) => a && a.status === "Under Review").length;
    const completedActions = safeActions.filter((a) => a && a.status === "Completed").length;

    const now = new Date();
    const overdueActions = safeActions.filter((a) => {
      if (!a || a.status === "Completed") return false;
      const deadlineDate = new Date(a.fixedDeadline);
      return !isNaN(deadlineDate.getTime()) && deadlineDate < now;
    }).length;

    return {
      totalCompliances: compliances.length,
      fullyCompletedCompliances: fullyCompleted,
      inProgressCompliances: inProgress,
      notStartedCompliances: notStarted,
      overallCompliancePercentage: overallPct,
      cfoReviewPendingCount: cfoReviewPending,
      totalActions,
      pendingActions,
      inProgressActions,
      underReviewActions,
      completedActions,
      overdueActions,
      totalTaxPaid: taxPaid,
      totalTaxPending: taxPending,
    };
  }, [compliances, actions]);

  // =========================================================================
  // TEXTILE EXPORT GARMENT ACCOUNTS & FINANCE TEAM KPI & KRA STATE
  // =========================================================================
  const [financeDepartments, setFinanceDepartments] = useState<FinanceDepartmentConfig[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_textile_finance_depts_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_FINANCE_DEPARTMENTS;
  });

  const [financeTeamMembers, setFinanceTeamMembers] = useState<FinanceTeamMemberKpi[]>(() => {
    try {
      const saved =
        localStorage.getItem("vcfo_actual_finance_team_kpis_v2") ||
        localStorage.getItem("vcfo_textile_finance_team_kpis_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        // If parsed data contains the old dummy textile names (e.g. Sneha Roy or Harish Kumar), discard and load actual admin panel people
        const hasDummyPeople =
          Array.isArray(parsed) &&
          parsed.some((m) =>
            ["Sneha Roy", "Harish Kumar", "Karthik Iyer", "Priya Nair", "Suresh Menon"].includes(
              m.name,
            ),
          );
        if (!hasDummyPeople && Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_TEXTILE_TEAM_KPI_KRA;
  });

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_actual_finance_team_kpis_v2", JSON.stringify(financeTeamMembers));
    } catch {
      // ignore
    }
  }, [financeTeamMembers]);

  const updateFinanceDepartment = useCallback(
    (dept: FinanceDepartmentConfig) => {
      setFinanceDepartments((prev) => prev.map((d) => (d.key === dept.key ? dept : d)));
      showToast(`Updated department "${dept.shortName}"`);
    },
    [showToast],
  );

  const addFinanceTeamMember = useCallback(
    (member: Omit<FinanceTeamMemberKpi, "id">) => {
      const newMember: FinanceTeamMemberKpi = {
        ...member,
        id: `tm-${Date.now()}`,
      };
      setFinanceTeamMembers((prev) => [...prev, newMember]);
      showToast(`Added ${member.name} (${member.designation}) to Finance Team`);
    },
    [showToast],
  );

  const updateFinanceTeamMember = useCallback(
    (member: FinanceTeamMemberKpi) => {
      setFinanceTeamMembers((prev) =>
        prev.map((m) => {
          if (m.id === member.id) return member;
          if (m.reportsToId === member.id) {
            return { ...m, reportsToName: `${member.name} (${member.designation})` };
          }
          return m;
        }),
      );
      showToast(`Saved profile & KPIs for ${member.name}`);
    },
    [showToast],
  );

  const deleteFinanceTeamMember = useCallback(
    (memberId: string) => {
      const target = financeTeamMembers.find((m) => m.id === memberId);
      setFinanceTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (target) {
        showToast(`Removed ${target.name} from team structure`);
      }
    },
    [financeTeamMembers, showToast],
  );

  const markMemberPerformance = useCallback(
    (
      memberId: string,
      rating: PerformanceIndicator,
      mode: PerformanceEvaluationMode = "cfo_marked",
      notes?: string,
    ) => {
      const todayIso = new Date().toISOString().slice(0, 10);
      setFinanceTeamMembers((prev) =>
        prev.map((m) => {
          if (m.id !== memberId) return m;
          return {
            ...m,
            cfoMarkedRating: rating,
            evaluationMode: mode,
            cfoAppraisalNotes: notes !== undefined ? notes : m.cfoAppraisalNotes,
            lastEvaluatedBy: `${currentUser?.name || "Sudhakar"} (CFO)`,
            lastEvaluatedAt: todayIso,
          };
        }),
      );
      const target = financeTeamMembers.find((m) => m.id === memberId);
      const ratingLabel =
        rating === "excellent"
          ? "Excellent"
          : rating === "good"
            ? "Good"
            : rating === "satisfactory"
              ? "Satisfactory"
              : "Below Average";
      showToast(
        mode === "auto_linked"
          ? `${target?.name || "Member"} switched to Auto-Linked App Function Evaluation`
          : `Marked ${target?.name || "Member"} performance as ${ratingLabel}`,
      );
    },
    [currentUser, financeTeamMembers, showToast],
  );

  const addMemberKpi = useCallback(
    (memberId: string, kpi: Omit<TeamKpiItem, "id">) => {
      const newKpi: TeamKpiItem = {
        ...kpi,
        id: `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setFinanceTeamMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, kpis: [...m.kpis, newKpi] } : m)),
      );
      showToast(`Added KPI "${kpi.kraTitle}"`);
    },
    [showToast],
  );

  const updateMemberKpi = useCallback(
    (memberId: string, kpi: TeamKpiItem) => {
      setFinanceTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, kpis: m.kpis.map((k) => (k.id === kpi.id ? kpi : k)) } : m,
        ),
      );
      showToast(`Updated KPI "${kpi.kraTitle}"`);
    },
    [showToast],
  );

  const deleteMemberKpi = useCallback(
    (memberId: string, kpiId: string) => {
      setFinanceTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, kpis: m.kpis.filter((k) => k.id !== kpiId) } : m,
        ),
      );
      showToast("Removed KPI item");
    },
    [showToast],
  );

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    try {
      const saved = localStorage.getItem("vcfo_color_theme_v1");
      if (
        saved === "sapphire" ||
        saved === "emerald" ||
        saved === "amethyst" ||
        saved === "oceanic"
      ) {
        return saved;
      }
    } catch {}
    return "sapphire";
  });

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    try {
      localStorage.setItem("vcfo_color_theme_v1", theme);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-color-theme", colorTheme);
    } catch {}
  }, [colorTheme]);

  const resetFinanceTeamKpiToDefault = useCallback(() => {
    setFinanceDepartments(INITIAL_FINANCE_DEPARTMENTS);
    setFinanceTeamMembers(INITIAL_TEXTILE_TEAM_KPI_KRA);
    try {
      localStorage.removeItem("vcfo_textile_finance_depts_v1");
      localStorage.removeItem("vcfo_textile_finance_team_kpis_v1");
    } catch {
      // ignore
    }
    showToast("Reset Textile Export Garment Team & KPI/KRA structure to standard template");
  }, [showToast]);

  // Automated Reminder & Escalation Center State
  const [isReminderCenterOpen, setIsReminderCenterOpen] = useState<boolean>(false);
  const [reminderCenterDefaultSource, setReminderCenterDefaultSource] = useState<
    ReminderSource | "all"
  >("all");
  const [reminderPreviewItem, setReminderPreviewItem] = useState<ReminderItem | null>(null);

  const openReminderCenter = useCallback(
    (source: ReminderSource | "all" = "all") => {
      setReminderCenterDefaultSource(source);
      setIsReminderCenterOpen(true);
    },
    [],
  );

  const openReminderPreviewForItem = useCallback(
    (rawItem: any, source: ReminderSource) => {
      const extracted = extractAllReminderItems({
        compliances: source === "compliance" ? [rawItem] : [],
        taxAssessments: source === "tax_assessment" ? [rawItem] : [],
        legalCases: source === "legal_case" ? [rawItem] : [],
        licenses: source === "license_certification" ? [rawItem] : [],
        sops: source === "sop" ? [rawItem] : [],
        companies,
        userAccounts,
        clientProfile,
        dueWindowDays: 365,
      });

      if (extracted.length > 0) {
        setReminderPreviewItem(extracted[0]);
      }
    },
    [companies, userAccounts, clientProfile],
  );

  // =========================================================================
  // CLIENT QUERY & ASSIGNMENT HUB (Accounts, Hiring, Audit, Tax, MCA, CFO Mandates)
  // =========================================================================
  const [supportQueries, setSupportQueries] = useState<CfoSupportQuery[]>(() => {
    try {
      const saved = localStorage.getItem("vcfo_support_queries_v4");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to read support queries from storage", e);
    }
    return MOCK_SUPPORT_QUERIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("vcfo_support_queries_v4", JSON.stringify(supportQueries));
    } catch (e) {
      console.warn("Failed to save support queries to storage", e);
    }
  }, [supportQueries]);

  const createSupportQuery = useCallback(
    (
      queryData: Omit<CfoSupportQuery, "id" | "ticketNumber" | "createdAt" | "updatedAt" | "messages">,
      initialMessage?: string,
    ): CfoSupportQuery => {
      const id = `query-${Date.now()}`;
      const prefix =
        queryData.requestType === "hiring_requirement"
          ? "HIR"
          : queryData.requestType === "mca_statutory_assignment"
          ? "MCA"
          : queryData.requestType === "audit_assignment"
          ? "AUD"
          : queryData.requestType === "taxation_assignment"
          ? "TAX"
          : queryData.requestType === "accounting_assignment"
          ? "ACC"
          : "QRY";
      const ticketNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const messages: SupportQueryMessage[] = [];
      if (initialMessage || queryData.description) {
        messages.push({
          id: `msg-${Date.now()}-1`,
          senderName: queryData.postedBy?.name || "Client Team",
          senderRole: queryData.postedBy?.role || "client_team",
          senderEmail: queryData.postedBy?.email || "",
          content: initialMessage || queryData.description,
          createdAt: now,
        });
      }

      const newQuery: CfoSupportQuery = {
        ...queryData,
        id,
        ticketNumber,
        status: queryData.status || "open",
        createdAt: now,
        updatedAt: now,
        messages,
      };

      setSupportQueries((prev) => [newQuery, ...prev]);
      logAuditEvent(
        `Created ${queryData.requestType || "query"}: ${queryData.title}`,
        "support_query",
        id,
        queryData.companyId,
      );
      showToast(`Request #${ticketNumber} submitted successfully!`);
      return newQuery;
    },
    [logAuditEvent, showToast],
  );

  const replyToSupportQuery = useCallback(
    (
      queryId: string,
      content: string,
      isInternalNote: boolean = false,
      newStatus?: SupportQueryStatus,
    ) => {
      const now = new Date().toISOString();
      const currentSender = currentUser || {
        name: role === "cfo" ? "CA Sudhakar Rao" : "Client Team",
        role: role,
        email: role === "cfo" ? "cfo.desk@virtualcfopractice.com" : "team@nexoratech.com",
      };

      setSupportQueries((prev) =>
        prev.map((q) => {
          if (q.id !== queryId) return q;

          const updatedMessages = [
            ...q.messages,
            {
              id: `msg-${Date.now()}`,
              senderName: currentSender.name,
              senderRole: currentSender.role,
              senderEmail: (currentSender as any).email || "",
              content,
              createdAt: now,
              isInternalNote,
            },
          ];

          let updatedStatus = newStatus || q.status;
          if (!newStatus) {
            if (role === "cfo" && !isInternalNote && q.status === "open") {
              updatedStatus = "in_review";
            }
          }

          return {
            ...q,
            messages: updatedMessages,
            status: updatedStatus,
            updatedAt: now,
          };
        }),
      );
      showToast(isInternalNote ? "Internal note added" : "Reply sent successfully");
    },
    [currentUser, role, showToast],
  );

  const updateSupportQueryStatus = useCallback(
    (queryId: string, status: SupportQueryStatus, resolutionSummary?: string) => {
      const now = new Date().toISOString();
      setSupportQueries((prev) =>
        prev.map((q) => {
          if (q.id !== queryId) return q;
          return {
            ...q,
            status,
            resolutionSummary: resolutionSummary || q.resolutionSummary,
            resolvedAt: status === "resolved" || status === "closed" ? now : q.resolvedAt,
            resolvedBy: status === "resolved" || status === "closed" ? currentUser?.name || "CFO Team" : q.resolvedBy,
            updatedAt: now,
          };
        }),
      );
      showToast(`Status updated to ${status.replace("_", " ").toUpperCase()}`);
    },
    [currentUser, showToast],
  );

  const deleteSupportQuery = useCallback(
    (queryId: string) => {
      setSupportQueries((prev) => prev.filter((q) => q.id !== queryId));
      showToast("Query deleted");
    },
    [showToast],
  );

  const updateCfoArrangement = useCallback(
    (queryId: string, arrangement: Partial<CfoSeparateArrangement>) => {
      const now = new Date().toISOString();
      setSupportQueries((prev) =>
        prev.map((q) => {
          if (q.id !== queryId) return q;
          const currentArrangement: CfoSeparateArrangement = q.cfoArrangement || {
            isSeparateArrangement: true,
            executionMode: "unassigned",
            engagementModel: "separate_sow_fixed",
            proposalStatus: "draft_proposal",
          };
          const nextArrangement: CfoSeparateArrangement = {
            ...currentArrangement,
            ...arrangement,
            isSeparateArrangement: true,
          };
          let nextStatus = q.status;
          if (arrangement.proposalStatus === "proposed_to_client" && q.status === "open") {
            nextStatus = "proposal_sent";
          } else if (arrangement.proposalStatus === "client_approved") {
            nextStatus = "client_approved";
          } else if (arrangement.proposalStatus === "in_execution") {
            nextStatus = "in_progress";
          }

          return {
            ...q,
            cfoArrangement: nextArrangement,
            status: nextStatus,
            updatedAt: now,
          };
        }),
      );
      showToast("CFO separate arrangement updated");
    },
    [showToast],
  );

  const approveCfoArrangement = useCallback(
    (queryId: string, clientRemarks?: string, poRef?: string) => {
      const now = new Date().toISOString();
      const approverName = currentUser?.name || "Client Management";
      setSupportQueries((prev) =>
        prev.map((q) => {
          if (q.id !== queryId) return q;
          const currentArrangement = q.cfoArrangement || {
            isSeparateArrangement: true,
            executionMode: "unassigned",
            engagementModel: "separate_sow_fixed",
            proposalStatus: "draft_proposal",
          };

          return {
            ...q,
            status: "client_approved",
            cfoArrangement: {
              ...currentArrangement,
              proposalStatus: "client_approved",
              clientSignOff: {
                approvedBy: approverName,
                approvedAt: now,
                clientRemarks: clientRemarks || "Approved by Client Management",
                poOrWorkOrderRef: poRef || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              },
            },
            updatedAt: now,
          };
        }),
      );
      showToast("Separate arrangement proposal approved!");
    },
    [currentUser, showToast],
  );

  const updateArrangementMilestoneStatus = useCallback(
    (queryId: string, milestoneId: string, status: "pending" | "in_progress" | "completed") => {
      const now = new Date().toISOString();
      setSupportQueries((prev) =>
        prev.map((q) => {
          if (q.id !== queryId || !q.cfoArrangement || !q.cfoArrangement.milestones) return q;
          const updatedMilestones = q.cfoArrangement.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status } : m,
          );
          return {
            ...q,
            cfoArrangement: {
              ...q.cfoArrangement,
              milestones: updatedMilestones,
            },
            updatedAt: now,
          };
        }),
      );
      showToast("Milestone status updated");
    },
    [showToast],
  );

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        isAuthLoading,
        setIsAuthenticated,
        switchActiveUser,
        logout,
        misUploads,
        createMisUpload,
        reviewMisUpload,
        deleteMisUpload,
        deleteCompanyFinancialMIS,
        overrideFinancialMIS,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        companies,
        selectedCompanyId,
        activeCompanyId,
        setSelectedCompanyId,
        cfoViewMode,
        setCfoViewMode,
        drillDownToCompany,
        returnToPortfolio,
        allCompaniesOverview,
        criticalDelayedItems,
        approveCfoComplianceReview,
        switchCompanyAndTab,
        activeTab,
        setActiveTab,
        misSubTab,
        setMisSubTab,
        openMisWithSubTab,
        compliances,
        selectedComplianceMonth,
        setSelectedComplianceMonth,
        hideCompletedCompliances,
        setHideCompletedCompliances,
        toggleHideCompletedCompliances,
        autoHideEarlierCompleted,
        setAutoHideEarlierCompleted,
        toggleAutoHideEarlierCompleted,
        toggleSubtask,
        updateCompliance,
        assignComplianceOwner,
        updateComplianceSubtaskAssignment,
        updateComplianceRemarks,
        uploadComplianceProof,
        deleteComplianceProof,
        complianceProofModalTarget,
        openComplianceProofModal,
        closeComplianceProofModal,
        complianceProofViewTarget,
        openComplianceProofView,
        closeComplianceProofView,
        actions,
        addAction,
        updateAction,
        deleteAction,
        updateActionProgress,
        toggleActionSubtask,
        addActionSubtask,
        financialMIS,
        updateFinancialMIS,
        clearFinancialMisDummyData,
        loadSampleFinancialMisData,
        threeMonthCashBudget,
        updateWeeklyCashActuals,
        addShortageAction,
        updateShortageActionStatus,
        deleteShortageAction,
        updateCashBudgetConfig,
        budgetItems,
        selectedBudgetMonth,
        setSelectedBudgetMonth,
        updateLineItemActual,
        updateLineItemBudget,
        bulkUpdateActualsFromExcel,
        resetBudgetData,
        clientProfile,
        filterOptions,
        setFilterOptions,
        resetFilters,
        stats,
        selectedCompliance,
        setSelectedCompliance,
        isNewActionModalOpen,
        setIsNewActionModalOpen,
        toastMessage,
        showToast,
        resetToDefaultData,
        allCompliancesMap,
        allActionsMap,
        allMISMap,
        allBudgetMap,
        isCfoAdmin,
        setIsCfoAdmin,
        securityProtocols,
        updateSecurityProtocols,
        rolePermissions,
        updateRolePermission,
        userPermissions,
        getUserPermissions,
        updateUserPermission,
        applyUserPermissionPreset,
        effectivePermissions,
        auditLogs,
        logAuditEvent,
        addAuditLog,
        misRemarks,
        addMisRemark,
        updateMisRemarkStatus,
        deleteMisRemark,
        addCompany,
        updateCompany,
        deleteCompany,
        addComplianceMasterItem,
        deleteComplianceMasterItem,
        userAccounts,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        taxAssessments,
        legalCases,
        licenses,
        sops,
        allTaxAssessments,
        allLegalCases,
        allLicenses,
        allSops,
        resetRepositorySampleData,
        addTaxAssessment,
        updateTaxAssessment,
        deleteTaxAssessment,
        addLegalCase,
        updateLegalCase,
        deleteLegalCase,
        addLicense,
        updateLicense,
        deleteLicense,
        addSop,
        updateSop,
        deleteSop,
        addRepositoryProgressUpdate,
        uploadRepositoryDocument,
        deleteRepositoryDocument,
        addCaseChronologyEvent,
        updateCaseChronologyEvent,
        deleteCaseChronologyEvent,
        actionFlowTasks,
        allActionFlowTasks,
        addActionFlowTask,
        updateActionFlowTask,
        deleteActionFlowTask,
        addMilestone,
        updateMilestone,
        toggleMilestoneStatus,
        reportTaskChallenge,
        addChallengeComment,
        resolveTaskChallenge,
        provideCfoGuidance,
        addTaskDiscussion,
        executiveReports,
        saveExecutiveReport,
        deleteExecutiveReport,
        getReportsForCompany,
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
        hiddenItemsRegistry,
        toggleItemVisibility,
        unhideAllItems,
        financeDepartments,
        updateFinanceDepartment,
        financeTeamMembers,
        addFinanceTeamMember,
        updateFinanceTeamMember,
        deleteFinanceTeamMember,
        markMemberPerformance,
        addMemberKpi,
        updateMemberKpi,
        deleteMemberKpi,
        resetFinanceTeamKpiToDefault,
        colorTheme,
        setColorTheme,
        isReminderCenterOpen,
        setIsReminderCenterOpen,
        reminderCenterDefaultSource,
        openReminderCenter,
        reminderPreviewItem,
        setReminderPreviewItem,
        openReminderPreviewForItem,
        supportQueries,
        createSupportQuery,
        replyToSupportQuery,
        updateSupportQueryStatus,
        deleteSupportQuery,
        updateCfoArrangement,
        approveCfoArrangement,
        updateArrangementMilestoneStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
