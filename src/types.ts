export type ColorTheme = "sapphire" | "emerald" | "amethyst" | "oceanic";

export type Role = "cfo" | "client" | "client_team" | "admin";

export type PermissionModuleKey = "mis" | "budget" | "compliances" | "actions" | "companies";

export interface ModulePermission {
  canView: boolean;
  canEdit: boolean;
  canUploadExcel: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export interface UserModulePermissions {
  mis: ModulePermission;
  budget: ModulePermission;
  compliances: ModulePermission;
  actions: ModulePermission;
  companies: ModulePermission;
}

export type UserPermissionPreset =
  | "super_admin"
  | "full_edit"
  | "full_edit_upload"
  | "view_and_edit"
  | "edit_no_upload"
  | "compliance_focus"
  | "compliance_only"
  | "mis_and_budget_only"
  | "view_only"
  | "custom";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleTitle: string;
  companyId: string; // 'all' for CFO, specific company id for client and client team
  companyName: string;
  avatar: string;
  isAdmin?: boolean;
  assignedCompanyIds?: string[];
  phone?: string;
  lastLoginAt?: string;
  permissions?: UserModulePermissions;
  permissionPreset?: UserPermissionPreset;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface MisUploadRecord {
  id: string;
  companyId: string;
  period: string;
  statementType: string;
  fileName: string;
  rowCount: number;
  rows: any;
  status: "pending_review" | "approved" | "rejected" | string;
  uploadedBy: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
}

export interface MisRemarkItem {
  id: string;
  companyId: string;
  section:
    "overview" | "balance-sheet" | "pnl" | "debtor-ageing" | "cash-flow" | "fund-flow" | "budget";
  sectionTitle: string;
  title: string;
  reason: string;
  role: Role;
  authorName: string;
  createdAt: string;
  status: "open" | "reviewed" | "resolved";
  cfoFeedback?: string;
  varianceNote?: string;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface SecurityProtocolConfig {
  mfaEnforced: boolean;
  sessionTimeoutMinutes: number;
  ipWhitelistingEnabled: boolean;
  whitelistedIps: string[];
  lockClosedPeriod: boolean;
  lockedPeriodName: string;
  requireApprovalForExport: boolean;
  watermarkExports: boolean;
  clientSingleCompanyIsolation: boolean;
}

export interface RolePermissionsMap {
  cfo: UserModulePermissions;
  client_team: UserModulePermissions;
  client: UserModulePermissions;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  companyId: string;
  companyName: string;
  action:
    | "USER_LOGIN"
    | "EXCEL_UPLOAD_MIS"
    | "EXCEL_UPLOAD_BUDGET"
    | "MIS_METRIC_UPDATE"
    | "REMARK_ADDED"
    | "COMPLIANCE_APPROVED"
    | "SECURITY_PROTOCOL_CHANGED"
    | "RIGHTS_MODIFIED"
    | "COMPANY_ADDED"
    | "COMPANY_EDITED"
    | "COMPANY_DELETED"
    | "COMPLIANCE_ADDED"
    | "COMPLIANCE_DELETED"
    | "REPOSITORY_MATTER_ADDED"
    | "REPOSITORY_MATTER_UPDATED"
    | "REPOSITORY_MATTER_DELETED"
    | "REPOSITORY_DOC_UPLOADED"
    | "COMPLIANCE_PROOF_UPLOADED"
    | "COMPLIANCE_PROOF_DELETED"
    | "ACTION_FLOW_CREATED"
    | "ACTION_FLOW_UPDATED"
    | "ACTION_FLOW_CHALLENGE_REPORTED"
    | "ACTION_FLOW_CHALLENGE_RESOLVED"
    | "ACTION_FLOW_CFO_GUIDANCE"
    | "ITEM_VISIBILITY_CHANGED"
    | "COMPLIANCE_ASSIGNED"
    | "SUBTASK_ASSIGNED"
    | "COMPLIANCE_TASK_MODIFIED"
    | "MIS_UPLOAD_REVIEWED"
    | "REMARK_STATUS_UPDATED"
    | "USER_LOGOUT";
  details: string;
  ipAddress?: string;
  status: "success" | "warning" | "blocked";
}

export type ComplianceCategory =
  | "GST"
  | "TDS / TCS"
  | "Income Tax"
  | "ROC / MCA"
  | "PF / ESI"
  | "Professional Tax & State"
  | "Corporate Governance"
  | string;

export type SubtaskStatus =
  | "pending"
  | "completed"
  | "in_progress"
  | "Pending"
  | "Completed"
  | "In Progress"
  | string;

export interface SubTask {
  id: string;
  subtaskNumber: 1 | 2 | 3;
  title: string;
  stageName?: "Team Draft" | "CFO Review" | "Filing & Payment" | "Preparation" | "Review" | "Filing" | string;
  assignedTo: string;
  assignedRole?: string;
  durationDays?: number; // Fixed duration in days allocated for this subtask
  startDate?: string;
  deadline: string;
  dueDate?: string;
  status: SubtaskStatus;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  documentRef?: string;
}

export type ComplianceProofCategory =
  | "Filing Acknowledgement (ARN)"
  | "Payment Challan / BSR Receipt"
  | "Filed Form / Return PDF"
  | "Statutory Certificate / Order"
  | "Other Proof of Filing";

export interface ComplianceProofDocument {
  id: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt: string;
  uploadedBy: string;
  arnOrChallanNo: string;
  filingDate: string;
  documentCategory: ComplianceProofCategory;
  notes?: string;
  fileDataUrl?: string;
}

export interface ComplianceItem {
  id: string;
  companyId?: string;
  sNo: number;
  category: ComplianceCategory;
  name: string;
  applicability: string;
  frequency:
    | "Monthly"
    | "Quarterly"
    | "Half-yearly"
    | "Annual"
    | "Event-based"
    | "Ongoing / Transaction-based";
  statutoryDueDate: string;
  dueDates: string[]; // ISO YYYY-MM-DD, one entry per applicable due date
  type:
    | "Return"
    | "Payment"
    | "Return + Payment"
    | "Payment + Return"
    | "Filing"
    | "Certification"
    | "Application"
    | "Audit Report"
    | "Certificate"
    | "Governance"
    | "Ongoing Monitoring"
    | "Renewal"
    | "Other";
  penaltyClause: string;
  assignedTo?: string; // Specific person assigned as primary compliance owner
  assignedRole?: string; // Role/designation of primary compliance owner
  assignedToRole?: string;
  assignedEmail?: string;
  durationDays?: number; // Total planned duration in days across subtasks
  subtasks: SubTask[];
  period: string; // e.g. "August 2026", "Q2 FY 24-25"
  arnOrChallanNo?: string;
  completionProofDoc?: ComplianceProofDocument;
  completionProofDocs?: ComplianceProofDocument[];
  taxAmount?: number;
  interestOrPenalty?: number;
  criticality: "High" | "Critical" | "Medium" | "Low";
  cfoRemarks?: string;
  cfoRemarksAuthor?: string;
  cfoRemarksUpdatedAt?: string;
  clientRemarks?: string;
  clientRemarksAuthor?: string;
  clientRemarksUpdatedAt?: string;
  // Optional display aliases used by some dashboards
  title?: string;
  description?: string;
  formOrReturn?: string;
  estimatedTaxAmount?: number;
  dueDate?: string;
  status?: string;
  sectionOrAct?: string;
  cycleMonth?: string; // e.g. "2026-10"
  isEarlierPending?: boolean;
  isEarlierCompleted?: boolean;
  _userModifiedInCycle?: boolean;
  timelineSection?: "earlier_pending" | "current_month" | "prospective_fy";
  delayDays?: number;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export type ActionCategory =
  | "Accounts Payable"
  | "Accounts Receivable"
  | "Banking & Treasury"
  | "Financial Reporting & MIS"
  | "General Ledger & Fixed Assets"
  | "Payroll & HR Ops"
  | "Internal Audit & Controls"
  | "Direct/Indirect Tax Ops";

export type ActionPriority = "Urgent" | "High" | "Medium" | "Low";
export type ActionStatus = "Pending" | "In Progress" | "Under Review" | "Completed";

export interface ActionProgressUpdate {
  id: string;
  date: string; // ISO string e.g. "2026-09-17 14:15"
  updatedBy: string; // Name of assignee or updater e.g. "Sneha Roy"
  progressPercentage: number; // 0 - 100
  notes: string;
  status?: ActionStatus;
  daysElapsed?: number;
}

export interface ActionSubtask {
  id: string;
  subtaskNumber?: number;
  title: string;
  assignedTo?: string;
  assignedRole?: string;
  durationDays?: number;
  dueDate?: string;
  status: SubtaskStatus;
  notes?: string;
  documentRef?: string;
  completedAt?: string;
  deadline?: string;
}

export interface ActionItem {
  id: string;
  companyId?: string;
  title: string;
  description: string;
  category: ActionCategory;
  assignedTo: string;
  assignedToEmail?: string;
  assignedRole: string;
  priority: ActionPriority;
  status: ActionStatus;

  // Decided timeline & duration of completion
  decidedDate?: string; // Date action was decided (defaults to createdAt date)
  durationDays?: number; // Decided target completion duration in days (e.g. 2, 5, 7, 14 days)
  fixedDeadline: string; // Target completion deadline date/time
  checkInCadenceDays?: number; // Cadence for assignee to update progress in days (e.g. 2 days)
  lastProgressUpdateDate?: string; // Date/time of most recent progress update

  // Progress tracking (0 - 100%)
  progressPercentage?: number;
  progressUpdates?: ActionProgressUpdate[];

  estimatedHours?: number;
  timeSpentHours?: number;
  createdAt: string;
  completedAt?: string;
  remarks: string;
  blockedReason?: string;
  subtasks?: ActionSubtask[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface CompanyRatioBenchmarks {
  ebitdaMargin: number; // e.g. 18.0 (%)
  netProfitMargin: number; // e.g. 12.0 (%)
  grossMargin: number; // e.g. 60.0 (%)
  operatingMargin: number; // e.g. 15.0 (%)
  roce: number; // e.g. 15.0 (%)
  roe: number; // e.g. 18.0 (%)
  currentRatio: number; // e.g. 2.0 (x)
  quickRatio: number; // e.g. 1.2 (x)
  cashRatio: number; // e.g. 0.5 (x)
  debtEquityRatio: number; // e.g. 1.0 (x)
  netDebtToEbitda: number; // e.g. 2.5 (x)
  interestCoverageRatio: number; // e.g. 3.0 (x)
  dscr: number; // e.g. 1.5 (x)
  tolToTnw: number; // e.g. 1.5 (x)
  fixedAssetTurnover: number; // e.g. 2.5 (x)
  debtorDays: number; // e.g. 45 (days)
  inventoryDays: number; // e.g. 40 (days)
  creditorDays: number; // e.g. 45 (days)
  cashConversionCycle: number; // e.g. 40 (days)
}

export interface ClientProfile {
  id: string;
  companyName: string;
  legalEntity: string;
  gstin: string;
  pan: string;
  cin: string;
  financialYear: string;
  cfoName: string;
  cfoFirm: string;
  cfoLead?: string;
  sector?: string;
  city?: string;
  assignedCfo?: string;
  turnoverBracket?: string;
  incorporationYear?: number;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
  ratioBenchmarks?: Partial<CompanyRatioBenchmarks>;
  industryPreset?: "Textile/Manufacturing" | "Trading" | "Services/Healthcare" | "IT/SaaS";
  isServiceCompany?: boolean;
  email?: string;
  contactPerson?: string;
  cfoEmail?: string;
}

export interface BalanceSheetData {
  asOfDate: string;
  previousDate: string;
  equityAndLiabilities: {
    // 1. Shareholders' Funds
    shareCapital: number;
    reservesAndSurplus: number;
    totalShareholdersFunds: number;
    // 2. Non-Current Liabilities
    longTermBorrowings: number;
    deferredTaxLiabilities: number;
    otherLongTermLiabilities: number;
    totalNonCurrentLiabilities: number;
    // 3. Current Liabilities
    shortTermBorrowings: number;
    currentMaturitiesOfLongTermDebt?: number;
    tradePayables: number;
    tradePayablesMsme: number;
    otherCurrentLiabilities: number;
    shortTermProvisions: number;
    totalCurrentLiabilities: number;
    // Total Equity & Liabilities
    totalEquityAndLiabilities: number;
  };
  assets: {
    // 1. Non-Current Assets
    propertyPlantEquipment: number;
    accumulatedDepreciation: number;
    netPpe: number;
    capitalWorkInProgress: number;
    intangibleAssets: number;
    nonCurrentInvestments: number;
    longTermLoansAndAdvances: number;
    totalNonCurrentAssets: number;
    // 2. Current Assets
    inventories: number;
    tradeReceivables: number;
    allowanceForDoubtfulDebts: number;
    netTradeReceivables: number;
    cashAndCashEquivalents: number;
    bankBalancesOther: number;
    shortTermLoansAndAdvances: number;
    otherCurrentAssets: number;
    totalCurrentAssets: number;
    // Total Assets
    totalAssets: number;
  };
  previousYearComparison?: {
    totalEquityAndLiabilities: number;
    totalAssets: number;
    workingCapital: number;
    netWorth: number;
    totalShareholdersFunds?: number;
    totalDebt?: number;
    inventories?: number;
    tradeReceivables?: number;
    tradePayables?: number;
    cashAndCashEquivalents?: number;
  };
  monthlySnapshots?: BalanceSheetSnapshot[];
  quarterlySnapshots?: BalanceSheetSnapshot[];
  snapshots?: BalanceSheetSnapshot[];
  tallyLedgers?: TallyLedgerRecord[];
}

export interface BalanceSheetSnapshot {
  period: string;
  shortPeriod: string;
  periodType?: "month" | "quarter";
  asOfDate?: string;
  equityAndLiabilities?: BalanceSheetData["equityAndLiabilities"];
  assets?: BalanceSheetData["assets"];
  totalAssets?: number;
  currentAssets?: number;
  nonCurrentAssets?: number;
  cashAndBank?: number;
  tradeReceivables?: number;
  netWorth?: number;
  totalDebt?: number;
  currentLiabilities?: number;
}

export interface PnlMonthSummary {
  month: string; // e.g. "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"
  shortMonth: string; // "Apr", "May", "Jun", "Jul", "Aug", "Sep"
  monthKey: string; // "apr-26", "may-26", etc.
  isCompleted: boolean;
  isCurrent: boolean;
  revenue: number;
  otherIncome: number;
  totalIncome: number;
  cogs: number;
  employeeExpense: number;
  operatingExpenses: number;
  totalExpenses: number;
  grossProfit: number;
  grossMarginPct: number;
  ebitda: number;
  ebitdaMarginPct: number;
  pbt: number;
  taxes: number;
  pat: number;
  patMarginPct: number;
  financeCosts?: number;
  depreciation?: number;
  patDerived?: boolean;
}

export interface PnlLineItem {
  id: string;
  particulars: string;
  noteRef?: string;
  currentMonth: number;
  previousMonth: number;
  ytdCurrentYear: number;
  momGrowthPct?: number;
  pctOfRevenue: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  // Previous completed months breakdown from April till current month
  monthlyBreakdown?: Record<string, number>;
  varianceVsPrevious?: number; // Absolute change: currentMonth - previousMonth
  varianceVsPreviousPct?: number;
  varianceVsBase?: number; // Absolute change vs April baseline
  varianceVsBasePct?: number;
  monthlyAverage?: number; // Average across completed months
  varianceRemarks?: string;
}

export type ExpenseProvisionCategory =
  | "cost_of_materials"
  | "employee_benefits"
  | "cloud_infrastructure"
  | "sales_marketing"
  | "other_expenses"
  | "finance_costs"
  | "tax_provision";

export interface ExpenseProvisionItem {
  id: string;
  expenseHead: string; // e.g. "Statutory Audit Fee Accrual", "BESCOM Electricity Bill Provision"
  category: ExpenseProvisionCategory;
  month: string; // e.g. "September 2026"
  amount: number; // in Rupees
  remarks?: string;
  vendorOrPayee?: string;
  voucherRef?: string;
  addedBy?: string;
  addedAt?: string;
  status: "active" | "inactive";
  isDefaultFixedUtility?: boolean;
  isCoreExpenseHead?: boolean;
}

export interface PnlStatementData {
  period: string;
  comparisonPeriod: string;
  financialYear: string;
  monthsList?: string[]; // e.g. ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"]
  completedMonths?: string[]; // e.g. ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"]
  currentMonthKey?: string; // e.g. "Sep 2026"
  monthlySummaries?: PnlMonthSummary[];
  expenseProvisions?: ExpenseProvisionItem[];
  tallyLedgers?: TallyLedgerRecord[];
  tallyMappingRules?: TallyLedgerMappingRule[];
  income: {
    revenueFromOperations: number;
    otherIncome: number;
    totalIncome: number;
  };
  expenses: {
    costOfMaterialsOrDirectCosts: number;
    purchases?: number;
    employeeBenefitsExpense: number;
    financeCosts: number;
    depreciationAndAmortization: number;
    cloudAndInfrastructureCosts?: number;
    salesAndMarketingCosts?: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  profitability: {
    grossProfit: number;
    grossMarginPercent: number;
    ebitda: number;
    ebitdaMarginPercent: number;
    pbt: number;
    pbtMarginPercent: number;
    currentTax: number;
    deferredTax: number;
    pat: number;
    patMarginPercent: number;
  };
  lineItems: PnlLineItem[];
}

export interface DebtorRecord {
  id: string;
  customerName: string;
  entityType?: string;
  gstin?: string;
  creditPeriodDays: number;
  totalOutstanding: number;
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket91to180: number;
  bucketAbove180: number;
  lastPaymentDate: string;
  lastPaymentAmount?: number;
  dsoDays: number;
  riskRating: "Low" | "Medium" | "High";
  status:
    | "Current"
    | "Reminder Sent"
    | "Escalated to CFO"
    | "Promise to Pay"
    | "Legal Notice"
    | "Audit Confirmation Reconciled";
  followUpNotes?: string;
  assignedManager?: string;
}

export interface DebtorAgeingData {
  asOfDate: string;
  totalReceivables: number;
  daysSalesOutstanding: number;
  overduePercentage: number;
  provisionForBadDebts: number;
  currentDues?: number;
  overdueAbove90Days?: number;
  buckets: {
    days0to30: { amount: number; percentage: number; count: number };
    days31to60: { amount: number; percentage: number; count: number };
    days61to90: { amount: number; percentage: number; count: number };
    days91to180: { amount: number; percentage: number; count: number };
    daysAbove180: { amount: number; percentage: number; count: number };
  };
  topDebtors: DebtorRecord[];
}

export interface WorkingCapitalChangeItem {
  id: string;
  particulars: string;
  category: "Current Asset" | "Current Liability";
  previousPeriod: number;
  currentPeriod: number;
  effect: "Increase in Working Capital" | "Decrease in Working Capital";
  effectAmount: number;
}

export interface OperationalFundItem {
  id: string;
  head: string;
  category:
    | "Operating Inflow"
    | "Procurement & Direct"
    | "Payroll & Personnel"
    | "Statutory & Taxes"
    | "Operating Overheads"
    | "Finance & Banking";
  flowType: "inflow" | "outflow";
  amount: number;
  description: string;
  channel?: string;
}

export interface FundFlowData {
  period: string;
  netChangeInCash?: number;
  sources: {
    fundsFromOperations: number; // Net Profit + Non cash adjustments
    issueOfShareCapital: number;
    longTermBorrowingsRaised: number;
    saleOfFixedAssets: number;
    decreaseInWorkingCapital?: number;
    totalSources: number;
  };
  applications: {
    purchaseOfFixedAssets: number; // Capex
    repaymentOfLongTermBorrowings: number;
    paymentOfTaxAndAdvanceTax: number;
    paymentOfDividendsOrDrawings: number;
    increaseInWorkingCapital?: number;
    totalApplications: number;
  };
  netMovementOfFunds: number;
  openingCashAndBank: number;
  closingCashAndBank: number;
  operationalItems?: OperationalFundItem[];
  workingCapitalSchedule: {
    totalCurrentAssetsPrevious: number;
    totalCurrentAssetsCurrent: number;
    totalCurrentLiabilitiesPrevious: number;
    totalCurrentLiabilitiesCurrent: number;
    workingCapitalPrevious: number;
    workingCapitalCurrent: number;
    netChangeInWorkingCapital: number;
    netChangeType: "Increase" | "Decrease";
    items: WorkingCapitalChangeItem[];
  };
}

export interface WeeklyCashFlowLineItem {
  id: string;
  category: "inflow" | "outflow";
  section:
    | "collections"
    | "direct_sales"
    | "statutory_refunds"
    | "financing_inflow"
    | "other_inflows"
    | "supplier_payments"
    | "payroll"
    | "statutory_dues"
    | "operating_overheads"
    | "finance_costs"
    | "capex"
    | "other_outflows";
  name: string;
  isSystemDefault?: boolean;
  weekly: Record<
    string,
    {
      budget: number;
      actual?: number;
      notes?: string;
    }
  >;
}

export interface CashFlowWeekMeta {
  id: string; // e.g. "w1", "w2", ..., "w12"
  weekNumber: number; // 1 to 12
  monthIndex: number; // 0, 1, 2
  monthName: string; // "October 2026"
  weekLabel: string; // "Week 1"
  dateRange: string; // "Oct 01 - Oct 07"
  isActualsClosed: boolean;
  closedAt?: string;
  closedBy?: string;
}

export interface ManagementShortageAction {
  id: string;
  weekId: string;
  title: string;
  impactAmount: number; // Positive cash relief (e.g. +₹3,00,000)
  type: "accelerate_receivables" | "draw_od" | "defer_capex" | "supplier_terms" | "other";
  status: "proposed" | "approved" | "executed";
  notes: string;
}

export interface ThreeMonthCashBudgetModel {
  companyId?: string;
  months: [string, string, string]; // e.g. ["October 2026", "November 2026", "December 2026"]
  startingCashBalance: number;
  minimumSafeBuffer: number;
  sanctionedODLimit: number;
  weeks: CashFlowWeekMeta[];
  items: WeeklyCashFlowLineItem[];
  shortageActions: ManagementShortageAction[];
  lastUpdated?: string;
  updatedBy?: string;
}

export interface FinancialMIS {
  period: string;
  monthlyRevenue: number;
  revenueGrowthMoM: number;
  grossMarginPercent: number;
  ebitda: number;
  ebitdaMarginPercent: number;
  netProfit: number;
  cashAndBankBalance: number;
  monthlyBurnRate: number;
  cashRunwayMonths: number;
  totalDebtors: number;
  debtorsOver90Days: number;
  debtorDaysDSO: number;
  totalCreditors: number;
  creditorsOver45Days: number; // MSME warning
  workingCapital: number;
  quickRatio: number;
  cfoExecutiveSummary: string;
  cfoKeyAlerts: string[];
  // Broad Balance Sheet, PnL, Debtor Ageing, and Fund Flow
  balanceSheet?: BalanceSheetData;
  pnlStatement?: PnlStatementData;
  debtorAgeing?: DebtorAgeingData;
  fundFlow?: FundFlowData;
  threeMonthCashBudget?: ThreeMonthCashBudgetModel;
  expenseProvisions?: ExpenseProvisionItem[];
  tallyLedgers?: TallyLedgerRecord[];
  tallyMappingRules?: TallyLedgerMappingRule[];
}

export type MisSubTab = "overview" | "balance-sheet" | "pnl" | "debtor-ageing" | "cash-flow";

export interface FilterOptions {
  category: string;
  status: string;
  assignee: string;
  searchQuery: string;
  frequency: string;
}

export interface CompanyOverviewSummary {
  companyId: string;
  companyName: string;
  entityType: string;
  gstin: string;
  sector: string;
  compliancePercentage: number;
  fullyCompletedCompliances: number;
  totalCompliances: number;
  pendingCfoReviews: number;
  pendingActions: number;
  overdueActions: number;
  monthlyRevenue: number;
  cashRunwayMonths: number;
  taxPaid: number;
  taxPending: number;
  nextUpcomingDeadline: string;
  company: ClientProfile;
  complianceStats: {
    overallCompliancePercentage: number;
    fullyCompletedCompliances: number;
    totalCompliances: number;
    cfoReviewPendingCount: number;
    openActionsCount: number;
    overdueActionsCount: number;
    taxPaid: number;
    taxPending: number;
  };
  mis: FinancialMIS;
  overallHealth: "smooth" | "attention" | "critical";
  complianceHealth: "smooth" | "attention" | "critical";
  actionHealth: "smooth" | "attention" | "critical";
  misHealth: "smooth" | "attention" | "critical";
  complianceStatusSummary: string;
  actionStatusSummary: string;
  misStatusSummary: string;
  misVarianceStatus: "smooth" | "moderate" | "critical";
  criticalPoints: string[];
}

export interface CriticalDelayedItem {
  id: string;
  type: "compliance" | "action";
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  severity: "Critical" | "Delayed" | "Overdue" | "critical" | "delayed" | "overdue";
  reason?: string;
  cfoActionRequired?: string;
  deadlineOrAge: string;
  assigneeOrDept: string;
  penaltyOrRisk: string;
  financialAmount?: number;
  stageInfo?: string;
  cfoReviewPending?: boolean;
  rawDueDate?: string;
}

// ==========================================
// MONTHWISE BUDGET & VARIANCE ANALYSIS TYPES
// ==========================================

export type BudgetCategory =
  "sales" | "direct_cost" | "fixed_factory" | "salary_wages" | "admin_cost";

export type BudgetMonthKey =
  | "apr"
  | "may"
  | "jun"
  | "jul"
  | "aug"
  | "sep"
  | "oct"
  | "nov"
  | "dec"
  | "jan"
  | "feb"
  | "mar"
  | "apr-26"
  | "may-26"
  | "jun-26"
  | "jul-26"
  | "aug-26"
  | "sep-26"
  | "oct-26"
  | "nov-26"
  | "dec-26"
  | "jan-27"
  | "feb-27"
  | "mar-27"
  | string;

export interface BudgetMonthMeta {
  key: BudgetMonthKey;
  label: string;
  shortLabel: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  calendarMonth: number; // 4 for April, 1 for Jan
  year: number; // 2026 or 2027
  isActualsUploaded: boolean;
}

export interface MonthBudgetValue {
  budget: number;
  actual: number;
  notes?: string;
}

export interface BudgetLineItem {
  id: string;
  code: string;
  name: string;
  category: BudgetCategory;
  subCategory?: string;
  description?: string;
  monthly: Record<string, MonthBudgetValue>;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export type VarianceType = "favorable" | "adverse" | "neutral";

export type RepositoryItemType = "tax_assessment" | "legal_case" | "license_certification" | "sop";

export interface RepositoryDocument {
  id: string;
  matterId: string;
  title: string;
  category:
    | "Notice / Summons"
    | "Petition / Reply"
    | "Challan / Payment Receipt"
    | "Hearing Record"
    | "Assessment Order"
    | "Order / Judgment"
    | "License Certificate"
    | "Agreement / Evidence"
    | "SOP / Process Manual"
    | "Checklist / Template"
    | "Other";
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedByRole: Role;
  uploadedAt: string;
  notes?: string;
  downloadUrl?: string;
}

export interface CaseChronologyEvent {
  id: string;
  date: string;
  title: string;
  stageOrType:
    | "Notice / Summons"
    | "Reply / Written Statement"
    | "Hearing / Appearance"
    | "Interim Order / Stay"
    | "Statutory Deposit / Payment"
    | "Evidence / Verification"
    | "Final Order / Decree"
    | "Appeal / Revision"
    | "Other";
  authorityOrForum?: string;
  orderRefNumber?: string;
  description: string;
  outcomeOrNextStep?: string;
  statutoryDeadline?: string;
  nextHearingDate?: string;
  documentRef?: string;
  documentId?: string;
  financialImpactAmount?: number;
  recordedBy: string;
  recordedByRole?: Role;
}

export interface RepositoryProgressUpdate {
  id: string;
  date: string;
  author: string;
  authorRole: Role;
  status: string;
  notes: string;
  documentRef?: string;
  nextSteps?: string;
}

export interface TaxAssessmentMatter {
  id: string;
  companyId: string;
  companyName: string;
  type: "tax_assessment";
  taxCategory:
    "Income Tax" | "GST" | "TDS / TCS" | "Transfer Pricing" | "Customs / Excise" | "Legacy VAT";
  financialYear: string;
  assessmentYear: string;
  matterTitle: string;
  assessmentType: string;
  authority: string;
  caseOrNoticeNumber: string;
  demandAmount: number;
  refundAmount?: number;
  depositPaid?: number;
  nextDueDate: string;
  dueDateType: string;
  status:
    | "Notice Received"
    | "Response Filed"
    | "Hearing Scheduled"
    | "Under Appeal"
    | "Order Passed"
    | "Closed / Dropped"
    | "Stay Granted"
    | "Reply Filed - Under Scrutiny"
    | string;
  riskLevel: "High" | "Medium" | "Low";
  counselName: string;
  summary: string;
  chronology?: CaseChronologyEvent[];
  progressUpdates: RepositoryProgressUpdate[];
  documents: RepositoryDocument[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface LegalCaseMatter {
  id: string;
  companyId: string;
  companyName: string;
  type: "legal_case";
  legalCategory:
    | "Commercial / Contractual"
    | "NCLT / Corporate"
    | "Labor & Employment"
    | "Arbitration"
    | "High Court / Appellate"
    | "IP & Trademark Infringement"
    | "Recovery / Sec 138";
  matterTitle: string;
  forumOrCourt: string;
  caseNumber: string;
  plaintiffOrApplicant: string;
  defendantOrRespondent: string;
  companyRole: "Plaintiff / Petitioner" | "Defendant / Respondent";
  claimOrExposureAmount: number;
  contingentLiabilityStatus: "Probable" | "Possible" | "Remote";
  nextHearingDate: string;
  hearingPurpose: string;
  status:
    | "Summons Issued"
    | "Written Statement Filed"
    | "Pleadings Stage"
    | "Evidence Stage"
    | "Arguments Concluded"
    | "Interim Stay Active"
    | "Decreed in Favor"
    | "Settlement in Progress"
    | "Disposed"
    | string;
  riskLevel: "High" | "Medium" | "Low";
  advocateLegalFirm?: string;
  counselName?: string;
  summary: string;
  chronology?: CaseChronologyEvent[];
  progressUpdates: RepositoryProgressUpdate[];
  documents: RepositoryDocument[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface LicenseCertificationMatter {
  id: string;
  companyId: string;
  companyName: string;
  type: "license_certification";
  licenseCategory:
    | "Statutory & Operating"
    | "Regulatory & Operating"
    | "Environmental & Safety"
    | "Quality & Security Certification"
    | "Quality & Industry Certifications"
    | "Municipal & Local"
    | "IP & Brand Registration"
    | "Trade & Export";
  title: string;
  issuingAuthority: string;
  licenseNumber: string;
  issuedDate: string;
  expiryDate: string;
  renewalWindowDays: number;
  annualFeeOrCost: number;
  status:
    | "Active & Valid"
    | "Renewal Due Soon"
    | "Renewal In Progress"
    | "Expired - Urgent"
    | "Surrendered / Dormant"
    | string;
  renewalOfficer: string;
  applicableRegulations?: string | string[];
  summary: string;
  progressUpdates: RepositoryProgressUpdate[];
  documents: RepositoryDocument[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export interface SopStep {
  stepNumber: number;
  title: string;
  responsibility: string;
  timelineOrTAT: string;
  description: string;
  controlCheckpoint?: string;
}

export interface SopMatter {
  id: string;
  companyId: string;
  companyName: string;
  type: "sop";
  sopCategory:
    | "Accounts Payable & Vendor Processing"
    | "Statutory & Tax Compliance"
    | "Payroll, PF & ESIC Management"
    | "Financial Reporting & MIS"
    | "Internal Controls & Cash Management"
    | "Secretarial & ROC Governance"
    | "Data Governance & Privacy"
    | "Logistics & Transport Operations"
    | "Fixed Assets & Capex";
  sopCode: string; // e.g. "SOP-AP-001", "SOP-TAX-002"
  title: string;
  version: string;
  effectiveDate: string;
  nextReviewDate: string;
  reviewFrequency: "Monthly" | "Quarterly" | "Bi-Annual" | "Annual";
  department:
    | "Finance & Accounts"
    | "Taxation & Compliance"
    | "HR & Payroll"
    | "Secretarial & Legal"
    | "Data Security & Legal"
    | "Fleet Operations & Dispatch"
    | "Operations & Procurement";
  owner: string;
  approver: string;
  status:
    | "Active & Operational"
    | "Under Annual Review"
    | "Revision in Progress"
    | "Draft Pending Approval";
  riskLevel: "High" | "Medium" | "Low";
  summary: string;
  scope: string;
  keySteps: SopStep[];
  applicableRegulations?: string[];
  progressUpdates: RepositoryProgressUpdate[];
  documents: RepositoryDocument[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export type RepositoryItem =
  TaxAssessmentMatter | LegalCaseMatter | LicenseCertificationMatter | SopMatter;

export interface LineItemVarianceResult {
  item: BudgetLineItem;
  budget: number;
  actual: number;
  varianceAmount: number; // actual - budget
  variancePercent: number; // ((actual - budget) / budget) * 100
  isExceeding5Percent: boolean;
  varianceType: VarianceType; // adverse if overspending/shortfall, favorable if saving/surplus
  alertSeverity: "critical_adverse" | "favorable" | "on_track";
  alertBadgeText: string;
}

export interface CategoryVarianceSummary {
  category: BudgetCategory;
  categoryTitle: string;
  budget: number;
  actual: number;
  varianceAmount: number;
  variancePercent: number;
  itemsCount: number;
  exceeding5PercentCount: number;
  adverse5PercentCount: number;
  favorable5PercentCount: number;
}

export interface MonthVarianceGrandSummary {
  monthKey: BudgetMonthKey;
  monthLabel: string;
  sales: CategoryVarianceSummary;
  directCost: CategoryVarianceSummary;
  grossProfitBudget: number;
  grossProfitActual: number;
  grossProfitVariance: number;
  grossProfitMarginBudget: number;
  grossProfitMarginActual: number;
  fixedFactory: CategoryVarianceSummary;
  salaryWages: CategoryVarianceSummary;
  adminCost: CategoryVarianceSummary;
  totalExpensesBudget: number;
  totalExpensesActual: number;
  totalExpensesVariance: number;
  ebitdaBudget: number;
  ebitdaActual: number;
  ebitdaVariance: number;
  ebitdaMarginBudget: number;
  ebitdaMarginActual: number;
  totalItemsBreaching5Percent: number;
  totalAdverseBreaches: number;
}

export interface ExecutiveObservation {
  id: string;
  category:
    | "Revenue & Margin"
    | "Cash & Treasury"
    | "Working Capital & Debtors"
    | "Tax & Compliance"
    | "Cost & Budget"
    | "Legal & Risk"
    | "Operational";
  observation: string;
  cfoNote?: string;
  impact: "positive" | "watch" | "critical";
  recommendation?: string;
  source?: "ai_generated" | "cfo_modified" | "cfo_added";
}

export interface MonthlyExecutiveReport {
  id: string;
  companyId: string;
  month: string; // e.g. "Sep 2026", "Aug 2026"
  monthKey: string; // e.g. "2026-09"
  title: string;
  executiveSummary: string;
  summaryPoints?: string[];
  observations: ExecutiveObservation[];
  cfoDirectives: string[];
  financialHighlights?: {
    revenue?: string;
    ebitda?: string;
    cashRunway?: string;
    complianceScore?: string;
  };
  aiGeneratedAt?: string;
  cfoSavedAt?: string;
  status: "published" | "draft";
  authorName: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
  // CFO Monthly Approval & Mail Dispatch
  approvalStatus?: "pending_approval" | "approved";
  approvedBy?: string;
  approvedByEmail?: string;
  approvedAt?: string;
  approvalDate?: string;
  cfoRemarks?: string;
  isMailedToClient?: boolean;
  clientMailTo?: string;
  cfoMailCc?: string;
  mailDispatchedAt?: string;
}

// ==========================================
// INTERACTIVE ACTION FLOW & GANTT MODEL
// ==========================================

export type ActionFlowTaskStatus =
  | "not_started"
  | "in_process"
  | "in_progress"
  | "in_time"
  | "completed"
  | "stuck"
  | "stuck_blocked"
  | "cfo_review";

export type ActionFlowTaskPriority = "Urgent" | "High" | "Medium" | "Low";

export type TaskChallengeCategory =
  | "Vendor / Counterparty Dependency"
  | "Missing Invoices / Raw Data"
  | "ERP / Portal Technical Glitch"
  | "Legal & Statutory Ambiguity"
  | "Banking / Fund Liquidity Constraint"
  | "Client Internal Approval Delay";

export type TaskChallengeSeverity =
  "Critical Blocker" | "High Impediment" | "Moderate Delay" | "Low Query";

export type ChallengeStatus = "open" | "cfo_guidance_provided" | "resolved" | "escalated";

export interface ChallengeComment {
  id: string;
  authorName: string;
  authorRole: "cfo" | "client_team" | "client";
  authorRoleTitle?: string;
  authorAvatar: string;
  timestamp: string;
  message: string;
  attachmentName?: string;
  isCfoDirective?: boolean;
  actionPrescribed?: string;
}

export interface TaskChallenge {
  id: string;
  taskId: string;
  title: string;
  description: string;
  category: TaskChallengeCategory;
  severity: TaskChallengeSeverity;
  reportedBy: string;
  reportedByRole: string;
  reportedAt: string;
  status: ChallengeStatus;
  isCfoInterventionRequested: boolean;
  comments: ChallengeComment[];
  cfoAdvisorySummary?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionSummary?: string;
}

export interface TaskDiscussionEntry {
  id: string;
  authorName: string;
  authorRole: Role | string;
  authorRoleTitle?: string;
  authorAvatar: string;
  timestamp: string;
  message: string;
  attachmentName?: string;
  isCfoDirective?: boolean;
  progressPercentage?: number;
  statusChange?: ActionFlowTaskStatus;
  actionPrescribed?: string;
}

export interface ActionFlowMilestone {
  id: string;
  milestoneNumber: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  progressPercentage: number;
  weightPercentage: number;
  deliverableName?: string;
  signOffRequired?: boolean;
  signedOffBy?: string;
}

export interface ActionFlowTask {
  id: string;
  taskCode: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  category: string;
  priority: ActionFlowTaskPriority;
  status: ActionFlowTaskStatus;

  // Person assigned
  assignedTo: string;
  assignedRole: string;
  assignedEmail: string;
  assignedAvatar: string;

  // Duration & Timeline given
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  allocatedDurationDays: number;
  estimatedHours: number;
  timeSpentHours: number;
  checkInCadence: string;
  lastCheckInDate?: string;

  // Progress & Milestones
  progressPercentage: number;
  milestones: ActionFlowMilestone[];

  // Dedicated space for discussion over the progress of work
  discussions?: TaskDiscussionEntry[];

  // Challenges, issues & CFO support
  challenges: TaskChallenge[];
  cfoDirectives?: string[];

  // Assignee remarks especially when status is stuck
  stuckRemarks?: string;
  stuckRemarksAuthor?: string;
  stuckRemarksDate?: string;

  // CFO remarks and directives
  cfoRemarks?: string;
  cfoRemarksAuthor?: string;
  cfoRemarksDate?: string;

  createdAt: string;
  completedAt?: string;
  tags?: string[];
  isHidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

export type HideableEntityType =
  | "company"
  | "compliance"
  | "action"
  | "action_flow"
  | "repository"
  | "user"
  | "budget_item"
  | "executive_report"
  | "mis_remark";

// ==========================================
// LEDGER-LEVEL MIS & TALLY HIERARCHY TYPES
// ==========================================

export type CfoPnlViewMode = "summary" | "group" | "ledger";

export type TallyStatementType = "P&L" | "Balance Sheet";

export type TallyMappingStatus =
  "approved" | "auto_mapped" | "flagged_parent_changed" | "unmapped_review";

export interface TallyVoucherTransaction {
  id: string;
  voucherDate: string; // YYYY-MM-DD
  voucherNumber: string; // e.g. "PUR/26-27/0842"
  voucherType:
    | "Purchase"
    | "Journal"
    | "Payment"
    | "Sales"
    | "Credit Note"
    | "Debit Note"
    | "Receipt"
    | "Contra";
  tallyLedgerName: string; // Exact original Tally Ledger Name
  partyOrVendorName: string;
  narration: string;
  costCentre?: string; // e.g. "Unit 1 - Tiruppur", "Unit 2 - Surat", "HO - Gurugram"
  amount: number; // in Rupees
  drCr: "Dr" | "Cr";
}

export interface TallyLedgerRecord {
  id: string;
  companyId: string;
  period: string;
  statementType: TallyStatementType;

  // 1. Original Tally attributes (Strictly preserved as received from Tally — never overwritten)
  tallyLedgerName: string;
  tallyParentGroup: string;

  // 2. CFOSARTHI Reporting Classification (Stored separately from Tally attributes)
  displayName?: string; // Optional presentation alias; original tallyLedgerName always preserved
  standardAccount: string; // Level 3: Standard Account / Reporting Head (e.g. "Power & Fuel", "Raw Material")
  reportingGroup: string; // CFOSARTHI Reporting Group (e.g. "Manufacturing Overheads", "Direct Material Cost")
  pnlSection: string; // Level 2: Major Reporting Group / P&L or BS Section (e.g. "Manufacturing Cost")
  sectionOrder: number;
  isIncome?: boolean;

  // 3. Accounting Balances (in Rupees)
  currentMonth: number;
  previousMonth: number;
  ytdAmount: number;
  monthlyBreakdown?: Record<string, number>;

  // 4. Level 5: Underlying Tally Vouchers / Transactions
  vouchers: TallyVoucherTransaction[];

  // 5. Future Import Recognition & Mapping Governance
  mappingStatus: TallyMappingStatus;
  previousTallyParentGroup?: string; // Populated if Tally Parent Group changed in subsequent import
  lastImportedAt?: string;
}

export interface TallyLedgerMappingRule {
  id: string;
  companyId: string;
  tallyLedgerName: string; // Exact Tally Ledger Name key
  tallyParentGroup: string; // Approved Tally Parent Group key
  statementType: TallyStatementType;
  pnlSection: string;
  reportingGroup: string;
  standardAccount: string;
  displayName?: string;
  approvedBy: string;
  approvedAt: string;
}

// ==========================================
// TEXTILE EXPORT GARMENT ACCOUNTS & FINANCE TEAM KPI & KRA TYPES
// ==========================================

export type PerformanceIndicator = "below_average" | "satisfactory" | "good" | "excellent";

export type PerformanceEvaluationMode = "auto_linked" | "cfo_marked";

export type FinanceDepartmentKey =
  "dgm_office" | "taxation_accounting" | "billing_dispatch" | "mis_erp" | "banking_treasury";

export type TeamHierarchyLevel =
  "DGM" | "Manager" | "Department Lead" | "Senior Executive" | "Executive" | "Subordinate";

export type KpiDirection = "higher_is_better" | "lower_is_better" | "higher" | "lower";

export interface TeamKpiItem {
  id: string;
  kraTitle: string; // Key Result Area (e.g., "GST, LUT & Export Incentive Refunds")
  kraWeightage: number; // Weightage % (must sum to 100% per member)
  kpiMetric: string; // Specific measurable KPI
  targetValue?: number; // Numeric target
  actualValue?: number; // Numeric actual
  targetNumeric?: number; // Numeric target (alias)
  actualNumeric?: number; // Numeric actual (alias)
  unit?: string; // e.g. "%", "Days", "INR", "Count", "Ratio"
  direction?: KpiDirection; // "higher" | "lower" | "higher_is_better" | "lower_is_better"
  achievementPct?: number; // Calculated: (actual/target) or (target/actual), capped at 100%
  weightedScore?: number; // (achievementPct * kraWeightage) / 100
  targetBenchmark?: string; // Standard target notes
  actualPerformance?: string; // Current actual notes
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Shipment-wise" | "Annual";
  rating: PerformanceIndicator;
  cfoOverrideScore?: number;
  cfoOverrideReason?: string;
}

export interface KpiScoreSnapshot {
  period: string; // e.g. "Q1 FY26", "Sep 2026"
  date: string;
  overallScore: number;
  rank: number;
  kraScore: number;
  onTimeScore: number;
}

export interface CfoScoreOverrideHistory {
  date: string;
  previousScore: number;
  newScore: number;
  reason: string;
  cfoName: string;
}

export interface FinanceTeamMemberKpi {
  id: string;
  name: string;
  designation: string;
  department: FinanceDepartmentKey;
  subDepartment?:
    | "MIS Wing"
    | "ERP Wing"
    | "Tax & Accounts"
    | "Commercial Dispatch"
    | "Treasury & Forex"
    | "Overall Supervision";
  level: TeamHierarchyLevel;
  reportsToId: string | null; // ID of reporting manager (e.g. DGM or Manager)
  reportsToName: string; // Name/Title of reporting manager
  avatar: string;
  email: string;
  experienceYears?: number;
  evaluationMode: PerformanceEvaluationMode; // 'auto_linked' (if name mentioned in app functions) or 'cfo_marked'
  cfoMarkedRating: PerformanceIndicator; // Rating marked by CFO
  qualityScore?: number; // Quality & audit precision (0 - 100)
  cfoRatingScore?: number; // CFO qualitative appraisal rating (0 - 100)
  cfoAppraisalNotes?: string;
  cfoOverrideReason?: string;
  overrideHistory?: CfoScoreOverrideHistory[];
  snapshots?: KpiScoreSnapshot[];
  lastEvaluatedBy?: string;
  lastEvaluatedAt?: string;
  kpis: TeamKpiItem[];
}

export interface FinanceDepartmentConfig {
  key: FinanceDepartmentKey;
  name: string;
  shortName: string;
  description: string;
  headTitle: string;
  targetHeadcountSummary: string;
}

export interface ReportCardDeliverable {
  id: string;
  title: string;
  categoryOrModule: string;
  deadline: string;
  status: string;
  isCompleted: boolean;
  isOverdue: boolean;
  delayDays: number; // 0 if on-time, >0 if delayed/overdue
  promptnessRating: "Ultra-Prompt" | "On-Time" | "Minor Delay" | "Delayed";
  sourceTab: "compliances" | "actions" | "action_flow";
}

export interface TeamMemberReportCard {
  memberId: string;
  memberName: string;
  designation: string;
  department: string;
  evaluationDate: string;
  overallScore: number; // 0 - 100
  overallGrade: "A+" | "A" | "B" | "C";
  performanceIndicator: PerformanceIndicator;

  // Metric 1: Timely Completion
  timelyCompletionRate: number; // 0 - 100 %
  totalAssignedTasks: number;
  completedOnTimeCount: number;
  completedDelayedCount: number;
  inProgressCount: number;

  // Metric 2: Task Promptness
  promptnessScore: number; // 0 - 100
  promptnessLevel:
    "Ultra-Prompt (A+)" | "Prompt & Timely (A)" | "Moderate Turnaround (B)" | "Needs Follow-up (C)";
  averageTatDays: number;
  aheadOfScheduleCount: number;

  // Metric 3: Delay Days in Task
  totalDelayDays: number;
  averageDelayDays: number;
  currentOverdueTasksCount: number;
  longestDelayDays: number;

  // Itemized deliverables
  deliverables: ReportCardDeliverable[];

  // KRA matrix summary
  kraWeightedScore: number;
  cfoFeedbackNotes?: string;
}

// ==========================================
// CFO SUPPORT & QUERY DESK & SEPARATE ASSIGNMENTS MODEL
// ==========================================

export type RequestType =
  | "accounts_query"
  | "hiring_requirement"
  | "audit_assignment"
  | "taxation_assignment"
  | "accounting_assignment"
  | "mca_statutory_assignment";

export type SupportQueryCategory =
  | "Tax & GST"
  | "Compliance & ROC"
  | "Accounting & Tally"
  | "MIS & Budget"
  | "Banking & Working Capital"
  | "Vendor & Debtors"
  | "General CFO Advisory"
  | "Hiring - Accounts & Finance"
  | "Audit - Statutory & Internal"
  | "Taxation - Direct & GST"
  | "Accounting & Bookkeeping"
  | "Statutory MCA & RoC";

export type SupportQueryPriority = "Urgent" | "High" | "Medium" | "Low";

export type SupportQueryStatus =
  | "open"
  | "in_review"
  | "proposal_sent"
  | "client_approved"
  | "in_progress"
  | "answered"
  | "resolved"
  | "closed";

export interface SupportQueryMessage {
  id: string;
  senderName: string;
  senderRole: Role;
  senderEmail?: string;
  content: string;
  createdAt: string;
  isInternalNote?: boolean;
  attachmentName?: string;
}

export interface FinanceHiringDetails {
  roleTitle: string; // e.g. "Senior Accounts Executive", "Tally Operator", "Accounts Manager"
  department: string; // e.g. "Accounts & Taxation", "Receivables & Billing", "Finance & Cash Flow"
  employmentType: "full_time" | "part_time" | "contract" | "remote" | "hybrid" | "on_premise";
  experienceYears: string; // e.g. "3 - 5 Years"
  targetCtcRange: string; // e.g. "₹4,50,000 - ₹6,00,000 P.A."
  softwareStack: string[]; // e.g. ["Tally Prime", "Zoho Books", "Advanced Excel", "GST Portal"]
  jobDescription: string;
  targetJoiningDate?: string;
  openingsCount: number;
  urgency: "Immediate (15 Days)" | "Standard (30 Days)" | "Strategic (45-60 Days)";
  interviewStatusSummary?: string;
}

export interface SpecialAssignmentDetails {
  assignmentType:
    | "Statutory Audit Facilitation"
    | "Internal Audit & Internal Financial Controls"
    | "Tax Audit (Sec 44AB)"
    | "Stock & Physical Inventory Audit"
    | "Concurrent & Bank Audit"
    | "Direct Tax Scrutiny / Sec 148 / 144 Notice"
    | "Transfer Pricing Documentation"
    | "GST Annual Return (9/9C) & Reconciliation"
    | "GST Department Audit (Sec 65) & Show Cause"
    | "GST Refund Application & Processing"
    | "Backlog Bookkeeping & Books Clean-up"
    | "Chart of Accounts Restructuring"
    | "ERP / Tally to Zoho / SAP Migration"
    | "Year-End Balance Sheet Finalization"
    | "MCA Annual Filing (AOC-4 & MGT-7)"
    | "Director e-KYC (DIR-3 KYC)"
    | "Charge Creation / Satisfaction (CHG-1 / CHG-4)"
    | "Share Allotment (PAS-3) & Capital Alteration"
    | "Secretarial Audit & RoC Compounding"
    | "Company Incorporation / Restructuring";
  scopeSummary: string;
  financialYearOrPeriod?: string;
  statutoryDeadline?: string;
  keyDeliverables: string[];
  applicableActOrSection?: string;
}

export interface CfoSeparateArrangement {
  isSeparateArrangement: boolean; // Set to true: clearly distinct from regular CFO retainership
  executionMode: "self_cfo_team" | "empanelled_professional" | "unassigned";
  engagementModel:
    | "separate_sow_fixed"
    | "milestone_billing"
    | "success_fee_recruitment"
    | "direct_professional_billing"
    | "retainer_addendum";
  proposalStatus:
    | "not_initiated"
    | "draft_proposal"
    | "proposed_to_client"
    | "client_approved"
    | "in_execution"
    | "under_quality_review"
    | "delivered_and_billed"
    | "closed";
  professionalPartner?: {
    partnerType:
      | "practicing_ca"
      | "practicing_cs"
      | "cost_accountant_cma"
      | "corporate_lawyer"
      | "recruitment_headhunter"
      | "specialist_tax_firm";
    firmName: string;
    contactPerson: string;
    email: string;
    phone: string;
    registrationNumber?: string; // e.g. ICAI Firm Reg No. / ICSI FCS No.
    partnerFee?: number; // Cost payable to external professional partner (₹)
  };
  commercials?: {
    clientQuotedFee: number; // Total fee billed to client (₹)
    internalCostOrPartnerFee: number; // Cost of external specialist or internal team allocation (₹)
    cfoOversightMargin: number; // CFO advisory coordination / margin (₹)
    feeStructure: "fixed_lumpsum" | "percentage_of_ctc" | "monthly_retainer" | "per_deliverable";
    paymentTerms: string; // e.g. "40% Advance upon approval, 60% upon final sign-off & MCA filing"
    currency: "INR";
  };
  clientSignOff?: {
    approvedBy: string;
    approvedAt: string;
    clientRemarks?: string;
    poOrWorkOrderRef?: string;
  };
  milestones?: {
    id: string;
    title: string;
    targetDate: string;
    status: "pending" | "in_progress" | "completed";
    deliveredDocument?: string;
  }[];
  cfoSupervisionNotes?: string;
}

export interface CfoSupportQuery {
  id: string;
  ticketNumber: string;
  companyId: string;
  companyName: string;
  requestType: RequestType;
  title: string;
  description: string;
  category: SupportQueryCategory;
  priority: SupportQueryPriority;
  status: SupportQueryStatus;
  postedBy: {
    name: string;
    email: string;
    role: Role;
    designation?: string;
  };
  assignedCfo: string;
  assignedCfoEmail: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportQueryMessage[];
  hiringDetails?: FinanceHiringDetails;
  assignmentDetails?: SpecialAssignmentDetails;
  cfoArrangement?: CfoSeparateArrangement;
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  tags?: string[];
  attachedDocNote?: string;
}

