import React, { useState, useMemo, useRef } from "react";
import {
  TallyLedgerRecord,
  TallyLedgerMappingRule,
  CfoPnlViewMode,
  TallyStatementType,
  ClientProfile,
} from "../../types";
import {
  buildHierarchicalMisTree,
  formatMisUnit,
  CFOSARTHI_PNL_SECTIONS,
  CFOSARTHI_BS_SECTIONS,
  processTallyLedgerImport,
  downloadTallyLedgerExcelTemplate,
  parseTallyLedgerExcelUpload,
  getInitialTallyLedgersForCompany,
  getInitialMappingRulesForCompany,
  IncomingTallyLedgerRow,
} from "../../utils/tallyLedgerMisEngine";
import { parseStandardMisExcel } from "../../utils/misExcelTemplateHelper";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  FileText,
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  X,
  Check,
  Database,
  GitBranch,
} from "lucide-react";

interface LedgerLevelMisExplorerProps {
  companyId: string;
  clientProfile: ClientProfile;
  period: string;
  initialStatementType?: TallyStatementType;
  ledgers: TallyLedgerRecord[];
  mappingRules: TallyLedgerMappingRule[];
  onUpdateLedgersAndRules: (
    nextLedgers: TallyLedgerRecord[],
    nextRules: TallyLedgerMappingRule[],
    logMessage?: string,
  ) => void;
}

export const LedgerLevelMisExplorer: React.FC<LedgerLevelMisExplorerProps> = ({
  companyId,
  clientProfile,
  period,
  initialStatementType = "P&L",
  ledgers,
  mappingRules,
  onUpdateLedgersAndRules,
}) => {
  // 1. CFO 3-View Switcher:
  //    "summary" (1. Summary P&L)
  //    "group"   (2. Group-level P&L)
  //    "ledger"  (3. Ledger-level P&L)
  const [cfoViewMode, setCfoViewMode] = useState<CfoPnlViewMode>("ledger");
  const [statementType, setStatementType] = useState<TallyStatementType>(initialStatementType);
  const [unitMode, setUnitMode] = useState<"crores" | "lakhs" | "rupees">("crores");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFlaggedFilter, setOnlyFlaggedFilter] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Expand/Collapse state for Collapsible Reporting Hierarchy (opens collapsed by default)
  // Level 1: Major Reporting Groups (e.g. "Manufacturing Cost", "Administrative, Selling & Distribution")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Level 2: Standard Accounts / Reporting Heads (e.g. "Raw Material", "Direct Labour", "Power & Fuel")
  const [expandedStandardAccounts, setExpandedStandardAccounts] = useState<Record<string, boolean>>(
    {},
  );

  // Modals for Mapping Editor, Add New Ledger, and Import Diagnostics
  const [editingLedger, setEditingLedger] = useState<TallyLedgerRecord | null>(null);
  const [isAddLedgerModalOpen, setIsAddLedgerModalOpen] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState<{
    title: string;
    autoMappedCount: number;
    flaggedParentChangedCount: number;
    newUnmappedCount: number;
    flaggedLedgers: Array<{
      tallyLedgerName: string;
      previousParentGroup: string;
      newParentGroup: string;
      standardAccount: string;
    }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pure bottom-up calculation from underlying child Tally Ledgers
  const hierarchy = useMemo(() => buildHierarchicalMisTree(ledgers), [ledgers]);

  const activeGroups = statementType === "P&L" ? hierarchy.pnlGroups : hierarchy.balanceSheetGroups;

  const fmt = (amt: number) => formatMisUnit(amt, unitMode);

  // Toggle helpers for Drill-Down (default is true / expanded when undefined)
  const toggleGroup = (pnlSection: string) => {
    setExpandedGroups((prev) => ({ ...prev, [pnlSection]: !(prev[pnlSection] ?? true) }));
  };

  const toggleStandardAccount = (pnlSection: string, standardAccount: string) => {
    const key = `${pnlSection}::${standardAccount}`;
    setExpandedStandardAccounts((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  // Preset Collapse / Expand Modes
  const handleCollapseAllToDefault = () => {
    // Default collapsed view: shows Major Reporting Groups (e.g., Manufacturing Cost ₹8.50 Cr)
    const collapsedGroups: Record<string, boolean> = {};
    const collapsedStd: Record<string, boolean> = {};
    for (const g of activeGroups) {
      collapsedGroups[g.pnlSection] = false;
      for (const s of g.standardAccounts) {
        collapsedStd[`${g.pnlSection}::${s.standardAccount}`] = false;
      }
    }
    setExpandedGroups(collapsedGroups);
    setExpandedStandardAccounts(collapsedStd);
  };

  const handleExpandManufacturingExample = () => {
    setCfoViewMode("ledger");
    setStatementType("P&L");
    setSearchQuery("");
    setOnlyFlaggedFilter(false);
    const nextGroups: Record<string, boolean> = {
      ...expandedGroups,
      "Manufacturing Cost": true,
    };
    const nextStd: Record<string, boolean> = { ...expandedStandardAccounts };
    for (const g of hierarchy.pnlGroups) {
      if (g.pnlSection === "Manufacturing Cost") {
        nextGroups[g.pnlSection] = true;
        for (const s of g.standardAccounts) {
          nextStd[`${g.pnlSection}::${s.standardAccount}`] = true;
        }
      }
    }
    setExpandedGroups(nextGroups);
    setExpandedStandardAccounts(nextStd);
    setTimeout(() => {
      const el = document.getElementById("tally-group-manufacturing");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const handleExpandIndirectAdminExample = () => {
    setCfoViewMode("ledger");
    setStatementType("P&L");
    setSearchQuery("");
    setOnlyFlaggedFilter(false);
    const nextGroups: Record<string, boolean> = {
      ...expandedGroups,
      "Administrative, Selling & Distribution": true,
    };
    const nextStd: Record<string, boolean> = { ...expandedStandardAccounts };
    for (const g of hierarchy.pnlGroups) {
      if (g.pnlSection === "Administrative, Selling & Distribution") {
        nextGroups[g.pnlSection] = true;
        for (const s of g.standardAccounts) {
          nextStd[`${g.pnlSection}::${s.standardAccount}`] = true;
        }
      }
    }
    setExpandedGroups(nextGroups);
    setExpandedStandardAccounts(nextStd);
    setTimeout(() => {
      const el = document.getElementById("tally-group-indirect-admin");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const handleExpandSellingAndPayrollExample = () => {
    setCfoViewMode("ledger");
    setStatementType("P&L");
    setSearchQuery("");
    setOnlyFlaggedFilter(false);
    const nextGroups: Record<string, boolean> = {
      ...expandedGroups,
      "Administrative, Selling & Distribution": true,
      "Employee Benefit Expenses": true,
    };
    const nextStd: Record<string, boolean> = { ...expandedStandardAccounts };
    for (const g of hierarchy.pnlGroups) {
      if (
        g.pnlSection === "Administrative, Selling & Distribution" ||
        g.pnlSection === "Employee Benefit Expenses"
      ) {
        nextGroups[g.pnlSection] = true;
        for (const s of g.standardAccounts) {
          nextStd[`${g.pnlSection}::${s.standardAccount}`] = true;
        }
      }
    }
    setExpandedGroups(nextGroups);
    setExpandedStandardAccounts(nextStd);
    setTimeout(() => {
      const el =
        document.getElementById("tally-group-employee-benefit") ||
        document.getElementById("tally-group-indirect-admin");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const handleExpandAllHierarchy = () => {
    const nextGroups: Record<string, boolean> = {};
    const nextStd: Record<string, boolean> = {};

    for (const g of activeGroups) {
      nextGroups[g.pnlSection] = true;
      for (const s of g.standardAccounts) {
        nextStd[`${g.pnlSection}::${s.standardAccount}`] = true;
      }
    }
    setExpandedGroups(nextGroups);
    setExpandedStandardAccounts(nextStd);
  };

  // Drill-down from Summary View or Group View directly into child level
  const handleDrillDownFromSummary = (pnlSection: string) => {
    setCfoViewMode("group");
    setExpandedGroups((prev) => ({ ...prev, [pnlSection]: true }));
  };

  const handleDrillDownFromGroupToLedgers = (pnlSection: string, standardAccount: string) => {
    setCfoViewMode("ledger");
    setExpandedGroups((prev) => ({ ...prev, [pnlSection]: true }));
    setExpandedStandardAccounts((prev) => ({
      ...prev,
      [`${pnlSection}::${standardAccount}`]: true,
    }));
  };

  // Handle Excel Upload of Tally Ledgers (or Native Tally Prime P&L / Summary P&L)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const incomingRows = await parseTallyLedgerExcelUpload(file);

      // Check if the uploaded file is explicitly a 10-column Tally_Ledgers_Master template
      const isExplicitMasterTemplate = incomingRows.some(
        (r) => Boolean(r.pnlSection) && Boolean(r.standardAccount),
      );

      // Check if it is a Summary P&L or a Native Tally Prime P&L Export (Horizontal T-Format or Vertical)
      const isSummaryPnlSheet = incomingRows.some((r) =>
        /revenue from operations|gross sales|cost of materials/i.test(r.tallyLedgerName),
      );
      const isSummaryBsSheet = incomingRows.some((r) =>
        /share capital|borrowings|liabilities|current assets|sundry debtors|bank accounts/i.test(r.tallyLedgerName),
      );

      if (!isExplicitMasterTemplate || isSummaryPnlSheet || isSummaryBsSheet) {
        try {
          const stdResult = await parseStandardMisExcel(file);
          if (
            stdResult.pnlStatement?.tallyLedgers &&
            stdResult.pnlStatement.tallyLedgers.length > 0
          ) {
            const pnlCount = stdResult.pnlStatement.tallyLedgers.filter(
              (l) => l.statementType === "P&L",
            ).length;
            onUpdateLedgersAndRules(
              stdResult.pnlStatement.tallyLedgers,
              mappingRules,
              `Synced Tally P&L from ${file.name} (${pnlCount} P&L ledgers, Revenue: ${formatMisUnit(stdResult.summaryKPIs.monthlyRevenue, "crores")})`,
            );
            setLastImportSummary({
              title: `Synced Tally P&L Statement: ${file.name}`,
              autoMappedCount: pnlCount,
              flaggedParentChangedCount: 0,
              newUnmappedCount: 0,
              flaggedLedgers: [],
            });
            return;
          } else if (
            stdResult.balanceSheet?.tallyLedgers &&
            stdResult.balanceSheet.tallyLedgers.length > 0
          ) {
            const bsCount = stdResult.balanceSheet.tallyLedgers.filter(
              (l) => l.statementType === "Balance Sheet",
            ).length;
            onUpdateLedgersAndRules(
              stdResult.balanceSheet.tallyLedgers,
              mappingRules,
              `Synced Tally Balance Sheet from ${file.name} (${bsCount} Balance Sheet ledgers, Total Assets: ${formatMisUnit(stdResult.summaryKPIs.totalAssets, "crores")})`,
            );
            setLastImportSummary({
              title: `Synced Tally Balance Sheet: ${file.name}`,
              autoMappedCount: bsCount,
              flaggedParentChangedCount: 0,
              newUnmappedCount: 0,
              flaggedLedgers: [],
            });
            return;
          }
        } catch {
          // Fall back to standard ledger row import below
        }
      }

      if (incomingRows.length === 0) {
        return;
      }
      const result = processTallyLedgerImport(
        companyId,
        period,
        ledgers,
        mappingRules,
        incomingRows,
      );
      onUpdateLedgersAndRules(
        result.mergedLedgers,
        mappingRules,
        `Imported ${incomingRows.length} Tally ledgers from ${file.name} (${result.autoMappedCount} auto-mapped, ${result.flaggedParentChangedCount} flagged for parent group change)`,
      );
      setLastImportSummary({
        title: `Imported Tally File: ${file.name}`,
        autoMappedCount: result.autoMappedCount,
        flaggedParentChangedCount: result.flaggedParentChangedCount,
        newUnmappedCount: result.newUnmappedCount,
        flaggedLedgers: result.flaggedLedgers,
      });
    } catch (err) {
      console.error("Error parsing Tally Ledger upload:", err);
    } finally {
      e.target.value = "";
    }
  };

  // Simulate Subsequent Tally Import to demonstrate:
  // 1) Recognition via Company ID + Tally Ledger Name + Tally Parent Group -> Auto-apply mapping
  // 2) Detection of changed Tally Parent Group -> Flag ledger for review!
  // 3) Bottom-up recalculation of Power & Fuel and Manufacturing Cost
  const handleSimulateSubsequentTallyImport = () => {
    const simulatedIncoming: IncomingTallyLedgerRow[] = [
      {
        // Case 1: Same Company ID + Same Tally Ledger Name + Same Tally Parent Group ("Indirect Expenses")
        // -> Recognized & automatically mapped to "Power & Fuel"
        tallyLedgerName: "Factory Electricity – Unit 1",
        tallyParentGroup: "Indirect Expenses",
        currentMonth: 5500000, // ₹0.55 Cr
      },
      {
        // Case 2: Same Company ID + Same Tally Ledger Name ("Generator Diesel"),
        // BUT Tally Parent Group changed in Tally from "Indirect Expenses" to "Direct Expenses"!
        // -> Must be FLAGGED FOR REVIEW!
        tallyLedgerName: "Generator Diesel",
        tallyParentGroup: "Direct Expenses",
        currentMonth: 1000000, // ₹0.10 Cr
      },
      {
        // Case 3: Same Company ID + Same Tally Ledger Name ("Accessories Purchase"),
        // BUT Tally Parent Group changed in Tally from "Purchase Accounts" to "Direct Expenses"!
        // -> Must be FLAGGED FOR REVIEW!
        tallyLedgerName: "Accessories Purchase",
        tallyParentGroup: "Direct Expenses",
        currentMonth: 10000000, // ₹1.00 Cr
      },
    ];

    const result = processTallyLedgerImport(
      companyId,
      period,
      ledgers,
      mappingRules,
      simulatedIncoming,
    );

    onUpdateLedgersAndRules(
      result.mergedLedgers,
      mappingRules,
      `Subsequent Tally Import processed: ${result.autoMappedCount} auto-mapped via (Company ID + Ledger Name + Parent Group), ${result.flaggedParentChangedCount} flagged due to Tally Parent Group change.`,
    );

    setLastImportSummary({
      title: "Subsequent Tally Import Recognition Diagnostics",
      autoMappedCount: result.autoMappedCount,
      flaggedParentChangedCount: result.flaggedParentChangedCount,
      newUnmappedCount: result.newUnmappedCount,
      flaggedLedgers: result.flaggedLedgers,
    });

    // Ensure Manufacturing Cost & Power & Fuel are expanded so user sees the flagged badges immediately
    setCfoViewMode("ledger");
    setStatementType("P&L");
    setExpandedGroups((prev) => ({ ...prev, "Manufacturing Cost": true }));
    setExpandedStandardAccounts((prev) => ({
      ...prev,
      "Manufacturing Cost::Raw Material": true,
      "Manufacturing Cost::Power & Fuel": true,
    }));
  };

  // Reset to clean baseline
  const handleResetBaseline = () => {
    const defaultLedgers = getInitialTallyLedgersForCompany(companyId, period);
    const defaultRules = getInitialMappingRulesForCompany(companyId);
    onUpdateLedgersAndRules(
      defaultLedgers,
      defaultRules,
      "Reset Tally Ledger-Level MIS to audited baseline (Manufacturing Cost ₹8.50 Cr)",
    );
    setLastImportSummary(null);
    setOnlyFlaggedFilter(false);
  };

  // Approve a Flagged Ledger's new Tally Parent Group or save updated CFOSARTHI Mapping
  const handleSaveLedgerMapping = (
    ledgerId: string,
    updates: {
      displayName?: string;
      pnlSection: string;
      reportingGroup: string;
      standardAccount: string;
      currentMonth: number;
      approveParentGroup: boolean;
    },
  ) => {
    const targetLedger = ledgers.find((l) => l.id === ledgerId);
    if (!targetLedger) return;

    const secMeta = [...CFOSARTHI_PNL_SECTIONS, ...CFOSARTHI_BS_SECTIONS].find(
      (s) => s.pnlSection === updates.pnlSection,
    );

    const nextLedgers: TallyLedgerRecord[] = ledgers.map((l) => {
      if (l.id !== ledgerId) return l;
      return {
        ...l,
        // Strictly preserve original l.tallyLedgerName!
        displayName: updates.displayName?.trim() || undefined,
        pnlSection: updates.pnlSection,
        reportingGroup: updates.reportingGroup,
        standardAccount: updates.standardAccount,
        sectionOrder: secMeta?.sectionOrder || l.sectionOrder,
        isIncome: secMeta ? secMeta.isIncome : l.isIncome,
        currentMonth: updates.currentMonth,
        mappingStatus: updates.approveParentGroup ? "approved" : l.mappingStatus,
        previousTallyParentGroup: updates.approveParentGroup
          ? undefined
          : l.previousTallyParentGroup,
      };
    });

    // Update persistent Mapping Rule for (Company ID + Tally Ledger Name + Tally Parent Group)
    const existingRuleIdx = mappingRules.findIndex(
      (r) =>
        r.companyId === companyId &&
        r.tallyLedgerName.toLowerCase() === targetLedger.tallyLedgerName.toLowerCase(),
    );

    const updatedRule: TallyLedgerMappingRule = {
      id: existingRuleIdx >= 0 ? mappingRules[existingRuleIdx].id : `map-${Date.now()}`,
      companyId,
      tallyLedgerName: targetLedger.tallyLedgerName,
      tallyParentGroup: targetLedger.tallyParentGroup,
      statementType: targetLedger.statementType,
      pnlSection: updates.pnlSection,
      reportingGroup: updates.reportingGroup,
      standardAccount: updates.standardAccount,
      displayName: updates.displayName?.trim() || undefined,
      approvedBy: "Virtual CFO",
      approvedAt: new Date().toISOString().split("T")[0],
    };

    const nextRules =
      existingRuleIdx >= 0
        ? mappingRules.map((r, i) => (i === existingRuleIdx ? updatedRule : r))
        : [...mappingRules, updatedRule];

    onUpdateLedgersAndRules(
      nextLedgers,
      nextRules,
      `Approved mapping for Tally Ledger "${targetLedger.tallyLedgerName}" → ${updates.standardAccount} (${updates.pnlSection})`,
    );
    setEditingLedger(null);
  };

  // Add a brand new Tally Ledger to demonstrate bottom-up rollup & multi-ledger mapping
  const handleCreateNewTallyLedger = (newLedgerData: {
    tallyLedgerName: string;
    tallyParentGroup: string;
    displayName?: string;
    statementType: TallyStatementType;
    pnlSection: string;
    reportingGroup: string;
    standardAccount: string;
    currentMonth: number;
  }) => {
    const secMeta = [...CFOSARTHI_PNL_SECTIONS, ...CFOSARTHI_BS_SECTIONS].find(
      (s) => s.pnlSection === newLedgerData.pnlSection,
    );

    const createdId = `${companyId}-tl-custom-${Date.now()}`;
    const newRecord: TallyLedgerRecord = {
      id: createdId,
      companyId,
      period,
      statementType: newLedgerData.statementType,
      tallyLedgerName: newLedgerData.tallyLedgerName.trim(),
      tallyParentGroup: newLedgerData.tallyParentGroup.trim(),
      displayName: newLedgerData.displayName?.trim() || undefined,
      pnlSection: newLedgerData.pnlSection,
      reportingGroup: newLedgerData.reportingGroup,
      standardAccount: newLedgerData.standardAccount,
      sectionOrder: secMeta?.sectionOrder || 3,
      isIncome: Boolean(secMeta?.isIncome),
      currentMonth: newLedgerData.currentMonth,
      previousMonth: Math.round(newLedgerData.currentMonth * 0.9),
      ytdAmount: newLedgerData.currentMonth * 5,
      mappingStatus: "approved",
      lastImportedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      vouchers: [],
    };

    const newRule: TallyLedgerMappingRule = {
      id: `map-${Date.now()}`,
      companyId,
      tallyLedgerName: newRecord.tallyLedgerName,
      tallyParentGroup: newRecord.tallyParentGroup,
      statementType: newRecord.statementType,
      pnlSection: newRecord.pnlSection,
      reportingGroup: newRecord.reportingGroup,
      standardAccount: newRecord.standardAccount,
      displayName: newRecord.displayName,
      approvedBy: "Virtual CFO",
      approvedAt: new Date().toISOString().split("T")[0],
    };

    onUpdateLedgersAndRules(
      [...ledgers, newRecord],
      [...mappingRules, newRule],
      `Added Tally Ledger "${newRecord.tallyLedgerName}" (Parent: ${newRecord.tallyParentGroup}) mapped to ${newRecord.standardAccount}`,
    );

    setExpandedGroups((prev) => ({ ...prev, [newRecord.pnlSection]: true }));
    setExpandedStandardAccounts((prev) => ({
      ...prev,
      [`${newRecord.pnlSection}::${newRecord.standardAccount}`]: true,
    }));
    setIsAddLedgerModalOpen(false);
  };

  // Filtered groups for search / flagged filter
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && !onlyFlaggedFilter) return activeGroups;

    return activeGroups
      .map((group) => {
        const groupMatches = group.pnlSection.toLowerCase().includes(q);
        const filteredStd = group.standardAccounts
          .map((std) => {
            const stdMatches =
              std.standardAccount.toLowerCase().includes(q) ||
              std.reportingGroup.toLowerCase().includes(q);
            const filteredLedgers = std.ledgers.filter((l) => {
              if (onlyFlaggedFilter && l.mappingStatus !== "flagged_parent_changed") {
                return false;
              }
              if (!q) return true;
              const ledgerMatch =
                l.tallyLedgerName.toLowerCase().includes(q) ||
                (l.displayName && l.displayName.toLowerCase().includes(q)) ||
                l.tallyParentGroup.toLowerCase().includes(q) ||
                l.standardAccount.toLowerCase().includes(q) ||
                l.reportingGroup.toLowerCase().includes(q);
              return groupMatches || stdMatches || ledgerMatch;
            });
            return {
              ...std,
              ledgers: filteredLedgers,
            };
          })
          .filter((std) => std.ledgers.length > 0);

        return {
          ...group,
          standardAccounts: filteredStd,
        };
      })
      .filter((g) => g.standardAccounts.length > 0);
  }, [activeGroups, searchQuery, onlyFlaggedFilter]);

  const handleExpandAll = () => {
    const allGroups: Record<string, boolean> = {};
    const allStd: Record<string, boolean> = {};
    filteredGroups.forEach((group) => {
      allGroups[group.pnlSection] = true;
      group.standardAccounts.forEach((std) => {
        allStd[`${group.pnlSection}::${std.standardAccount}`] = true;
      });
    });
    setExpandedGroups(allGroups);
    setExpandedStandardAccounts(allStd);
  };

  const handleCollapseAll = () => {
    setExpandedGroups({});
    setExpandedStandardAccounts({});
  };

  const { pnlSummary, stats } = hierarchy;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900/15 shadow-sm overflow-hidden space-y-0">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP EXECUTIVE HEADER: TALLY LEDGER-LEVEL MIS ENGINE & VIEW SWITCHER */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2.5">
            <FolderTree className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
              Ledger-Level MIS &amp; Tally Drill-Down
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ({stats.totalLedgers} Ledgers • {stats.totalStandardAccounts} Heads)
            </span>
            {stats.flaggedParentChangedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOnlyFlaggedFilter(!onlyFlaggedFilter);
                  setCfoViewMode("ledger");
                }}
                className="text-[11px] font-bold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-amber-400 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.flaggedParentChangedCount} Flagged — Review</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsAddLedgerModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Map Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Tally Excel</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadTallyLedgerExcelTemplate(clientProfile.companyName, period, ledgers)
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Template</span>
            </button>

            <button
              type="button"
              onClick={handleResetBaseline}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* CFO 4-VIEW SWITCHER BAR + STATEMENT & UNIT SELECTORS */}
        <div className="pt-3 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 4 CFO Views Powered by the Same Accounting Data */}
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
              CFO View:
            </span>
            <button
              type="button"
              onClick={() => setCfoViewMode("summary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                cfoViewMode === "summary"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>1. Summary {statementType}</span>
            </button>

            <button
              type="button"
              onClick={() => setCfoViewMode("group")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                cfoViewMode === "group"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>2. Group-Level {statementType}</span>
            </button>

            <button
              type="button"
              onClick={() => setCfoViewMode("ledger")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                cfoViewMode === "ledger"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>3. Ledger-Level {statementType} (Collapsible)</span>
            </button>
          </div>

          {/* Right Controls: Statement Type (P&L vs Balance Sheet) & Units (Crores / Lakhs / Exact ₹) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Financial Statement Switcher */}
            <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatementType("P&L")}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  statementType === "P&L"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                P&amp;L Hierarchy ({stats.pnlLedgersCount} Ledgers)
              </button>
              <button
                type="button"
                onClick={() => setStatementType("Balance Sheet")}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  statementType === "Balance Sheet"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Balance Sheet Hierarchy ({stats.bsLedgersCount} Ledgers)
              </button>
            </div>

            {/* Unit Switcher */}
            <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setUnitMode("crores")}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  unitMode === "crores"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ₹ Crores
              </button>
              <button
                type="button"
                onClick={() => setUnitMode("lakhs")}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  unitMode === "lakhs"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ₹ Lakhs
              </button>
              <button
                type="button"
                onClick={() => setUnitMode("rupees")}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  unitMode === "rupees"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Exact ₹
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUBSEQUENT IMPORT / PARENT GROUP CHANGE DIAGNOSTIC BANNER */}
      {lastImportSummary && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-700" />
                <span>{lastImportSummary.title}</span>
              </span>
              <span className="text-emerald-800 font-semibold">
                • {lastImportSummary.autoMappedCount} Auto-Mapped (Matched Company ID + Tally Ledger
                Name + Tally Parent Group)
              </span>
              {lastImportSummary.flaggedParentChangedCount > 0 && (
                <span className="text-rose-800 font-bold">
                  • {lastImportSummary.flaggedParentChangedCount} Flagged for Review (Tally Parent
                  Group Changed!)
                </span>
              )}
            </div>
            {lastImportSummary.flaggedLedgers.length > 0 && (
              <div className="text-[11px] text-amber-900 space-y-0.5">
                {lastImportSummary.flaggedLedgers.map((fl) => (
                  <div key={fl.tallyLedgerName}>
                    ⚠️ Tally Ledger <strong>&ldquo;{fl.tallyLedgerName}&rdquo;</strong> changed
                    Tally Parent Group from{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
                      {fl.previousParentGroup}
                    </code>{" "}
                    →{" "}
                    <code className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded font-mono font-bold">
                      {fl.newParentGroup}
                    </code>{" "}
                    (Currently mapped to Standard Account: <strong>{fl.standardAccount}</strong>).
                    Click <strong>Review / Map</strong> on the ledger row to approve or re-map.
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastImportSummary.flaggedParentChangedCount > 0 && (
              <button
                type="button"
                onClick={() => setOnlyFlaggedFilter(!onlyFlaggedFilter)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                {onlyFlaggedFilter ? "Show All Ledgers" : "Filter Flagged Only"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLastImportSummary(null)}
              className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECOND BAR: COLLAPSIBLE HIERARCHY CONTROLS, SEARCH & BOTTOM-UP ACCOUNTING RULE PROOF */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Hierarchy Controls:
          </span>
          <button
            type="button"
            onClick={handleCollapseAllToDefault}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer transition-colors"
            title="Default collapsed view showing Major Reporting Groups (e.g. Manufacturing Cost ₹8.50 Cr)"
          >
            Default View (Collapsed)
          </button>
          <button
            type="button"
            onClick={handleExpandManufacturingExample}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-semibold cursor-pointer transition-colors"
            title="Expand Manufacturing Cost (Raw Material, Direct Labour, Power & Fuel, Factory Overheads)"
          >
            Expand Manufacturing Cost ({fmt(pnlSummary.manufacturingCost.currentMonth)})
          </button>
          <button
            type="button"
            onClick={handleExpandIndirectAdminExample}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors shadow-2xs"
            title="Expand Indirect Administrative, Selling & Office Overheads (Rent, Legal, Audit, Printing, Travelling, Cloud/IT & Selling)"
          >
            Expand Indirect Administrative Expenses (
            {fmt(pnlSummary.adminAndSellingOverheads.currentMonth)})
          </button>
          <button
            type="button"
            onClick={handleExpandAllHierarchy}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer transition-colors"
          >
            Expand All Ledgers
          </button>
        </div>


        <div className="relative w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tally ledger, parent, account..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>



      {/* ========================================================================
          VIEW 1: SUMMARY P&L / BALANCE SHEET (Powered by Bottom-Up Ledger Data)
         ======================================================================== */}
      {cfoViewMode === "summary" && statementType === "P&L" && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                1. Summary P&amp;L View (Calculated Bottom-Up from {stats.pnlLedgersCount} Tally
                Ledgers)
              </h4>
              <p className="text-xs text-slate-500">
                Click any Major Reporting Group row below to drill down into its underlying Standard
                Accounts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">P&amp;L Major Reporting Group / Profitability Line</th>
                  <th className="py-3 px-3 text-center">Underlying Accounts &amp; Ledgers</th>
                  <th className="py-3 px-4 text-right">Current Period ({period})</th>
                  <th className="py-3 px-4 text-right">Previous Month</th>
                  <th className="py-3 px-4 text-right">YTD FY 2026-27</th>
                  <th className="py-3 px-4 text-right">% of Revenue</th>
                  <th className="py-3 px-3 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  {
                    label: "Revenue from Operations",
                    data: pnlSummary.revenueFromOperations,
                    isGroup: true,
                    pnlSection: "Revenue from Operations",
                  },
                  {
                    label: "Other Income",
                    data: pnlSummary.otherIncome,
                    isGroup: true,
                    pnlSection: "Other Income",
                  },
                  {
                    label: "I. Total Income (Revenue + Other Income)",
                    data: pnlSummary.totalIncome,
                    isTotal: true,
                  },
                  {
                    label:
                      "Manufacturing Cost (Raw Material + Direct Labour + Power & Fuel + Factory Overheads)",
                    data: pnlSummary.manufacturingCost,
                    isGroup: true,
                    pnlSection: "Manufacturing Cost",
                    highlight: true,
                  },
                  {
                    label: "II. Gross Profit (Revenue from Operations − Manufacturing Cost)",
                    data: pnlSummary.grossProfit,
                    isSubtotal: true,
                  },
                  {
                    label: "Employee Benefit Expenses",
                    data: pnlSummary.employeeBenefitExpenses,
                    isGroup: true,
                    pnlSection: "Employee Benefit Expenses",
                  },
                  {
                    label:
                      "Administrative, Selling & Distribution (Includes Indirect Administrative & Office Overheads)",
                    data: pnlSummary.adminAndSellingOverheads,
                    isGroup: true,
                    pnlSection: "Administrative, Selling & Distribution",
                    highlight: true,
                  },
                  {
                    label: "III. Operating EBITDA",
                    data: pnlSummary.operatingEbitda,
                    isSubtotal: true,
                  },
                  {
                    label: "Depreciation & Amortization",
                    data: pnlSummary.depreciationAndAmortization,
                    isGroup: true,
                    pnlSection: "Depreciation & Amortization",
                  },
                  {
                    label: "Finance Costs",
                    data: pnlSummary.financeCosts,
                    isGroup: true,
                    pnlSection: "Finance Costs",
                  },
                  {
                    label: "IV. Profit Before Tax (PBT)",
                    data: pnlSummary.pbt,
                    isSubtotal: true,
                  },
                  {
                    label: "Tax Expense",
                    data: pnlSummary.taxExpense,
                    isGroup: true,
                    pnlSection: "Tax Expense",
                  },
                  {
                    label: "V. Profit After Tax — PAT (Net Profit)",
                    data: pnlSummary.pat,
                    isTotal: true,
                  },
                ].map((row) => {
                  const groupNode = row.pnlSection
                    ? hierarchy.pnlGroups.find((g) => g.pnlSection === row.pnlSection)
                    : undefined;
                  const pctRev =
                    pnlSummary.revenueFromOperations.currentMonth > 0
                      ? (
                          (row.data.currentMonth / pnlSummary.revenueFromOperations.currentMonth) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={row.label}
                      onClick={() => row.pnlSection && handleDrillDownFromSummary(row.pnlSection)}
                      className={`transition-colors ${
                        row.isTotal
                          ? "bg-emerald-50/90 font-bold text-slate-950"
                          : row.isSubtotal
                            ? "bg-indigo-50/60 font-bold text-indigo-950"
                            : row.highlight
                              ? "bg-amber-50/40 hover:bg-amber-50/80 cursor-pointer font-semibold text-slate-900"
                              : "hover:bg-slate-50 cursor-pointer text-slate-800"
                      }`}
                    >
                      <td className="py-3 px-4">{row.label}</td>
                      <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                        {groupNode
                          ? `${groupNode.standardAccounts.length} Standard Accounts · ${groupNode.ledgerCount} Tally Ledgers`
                          : "Computed Subtotal"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {fmt(row.data.currentMonth)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {fmt(row.data.previousMonth)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {fmt(row.data.ytdAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{pctRev}%</td>
                      <td className="py-3 px-3 text-right">
                        {row.pnlSection ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900">
                            <span>View Accounts</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cfoViewMode === "summary" && statementType === "Balance Sheet" && (
        <div className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">
            1. Summary Balance Sheet View (Calculated Bottom-Up from {stats.bsLedgersCount} Tally
            Ledgers)
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Balance Sheet Major Reporting Group</th>
                  <th className="py-3 px-3 text-center">Underlying Accounts &amp; Ledgers</th>
                  <th className="py-3 px-4 text-right">Current Period</th>
                  <th className="py-3 px-4 text-right">Previous Period</th>
                  <th className="py-3 px-3 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {hierarchy.balanceSheetGroups.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => handleDrillDownFromSummary(g.pnlSection)}
                    className="hover:bg-slate-50 cursor-pointer font-semibold text-slate-900"
                  >
                    <td className="py-3 px-4">{g.pnlSection}</td>
                    <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                      {g.standardAccounts.length} Standard Accounts · {g.ledgerCount} Tally Ledgers
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {fmt(g.currentMonth)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {fmt(g.previousMonth)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 text-[11px] font-semibold">
                      Drill Down →
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          VIEW 2: GROUP-LEVEL P&L / BALANCE SHEET (Major Group -> Subledgers)
         ======================================================================== */}
      {cfoViewMode === "group" && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                2. Group-Level {statementType} (Major Group → Subledger)
              </h4>
              <p className="text-xs text-slate-500">
                Click any Subledger (e.g. <strong>Power &amp; Fuel</strong> or{" "}
                <strong>Raw Material</strong>) to drill down to its individual ledgers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Major Group / Subledger</th>
                  {showTechnicalDetails && <th className="py-3 px-3">Reporting Group</th>}
                  <th className="py-3 px-3 text-center">Ledgers</th>
                  <th className="py-3 px-4 text-right">Current Period ({period})</th>
                  <th className="py-3 px-4 text-right">Previous Period</th>
                  <th className="py-3 px-4 text-right">YTD FY 2026-27</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredGroups.map((group) => {
                  const isGroupOpen = Boolean(expandedGroups[group.pnlSection]);
                  return (
                    <React.Fragment key={group.id}>
                      {/* Level 1: Major Reporting Group Row */}
                      <tr
                        onClick={() => toggleGroup(group.pnlSection)}
                        className="bg-slate-100/90 hover:bg-slate-200/70 font-bold text-slate-900 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 flex items-center gap-2">
                          {isGroupOpen ? (
                            <ChevronDown className="w-4 h-4 text-slate-700 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                          )}
                          <span>{group.pnlSection}</span>
                        </td>
                        {showTechnicalDetails && (
                          <td className="py-3 px-3 text-[11px] text-slate-500 font-normal">
                            Major Group ({group.standardAccounts.length} Subledgers)
                          </td>
                        )}
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-700">
                          {group.ledgerCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-950 font-bold">
                          {fmt(group.currentMonth)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {fmt(group.previousMonth)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800">
                          {fmt(group.ytdAmount)}
                        </td>
                        <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                          {isGroupOpen ? "Collapse" : "Expand"}
                        </td>
                      </tr>

                      {/* Level 2: Subledgers under Major Group */}
                      {isGroupOpen &&
                        group.standardAccounts.map((std) => (
                          <tr
                            key={std.id}
                            onClick={() =>
                              handleDrillDownFromGroupToLedgers(
                                group.pnlSection,
                                std.standardAccount,
                              )
                            }
                            className="bg-white hover:bg-emerald-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 pl-10 pr-4 font-semibold text-slate-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span>{std.standardAccount}</span>
                            </td>
                            {showTechnicalDetails && (
                              <td className="py-2.5 px-3 text-[11px] text-slate-600">
                                {std.reportingGroup}
                              </td>
                            )}
                            <td className="py-2.5 px-3 text-center text-[11px] font-mono text-indigo-700 font-semibold">
                              {std.ledgers.length}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {fmt(std.currentMonth)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                              {fmt(std.previousMonth)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                              {fmt(std.ytdAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                                <span>Show Ledgers</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          VIEW 3: LEDGER-LEVEL P&L / BALANCE SHEET (Full Collapsible Hierarchy)
          Major Group -> Subledger -> Individual Ledger
         ======================================================================== */}
      {cfoViewMode === "ledger" && (
        <div className="p-5 space-y-4">
          {/* Header Controls & View Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Collapsible {statementType} Drill-Down</span>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Main Hierarchical Tree Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 min-w-[280px]">
                    Particulars (Major Group → Subledger → Ledger)
                  </th>
                  {showTechnicalDetails && (
                    <>
                      <th className="py-3 px-3">Tally Parent Group</th>
                      <th className="py-3 px-3">Reporting Classification</th>
                      <th className="py-3 px-3 text-center">Mapping Status</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right">Current ({period})</th>
                  <th className="py-3 px-4 text-right">Previous Period</th>
                  <th className="py-3 px-4 text-right">YTD FY 26-27</th>
                  {showTechnicalDetails && <th className="py-3 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredGroups.map((group) => {
                  const isGroupExpanded = Boolean(expandedGroups[group.pnlSection]);
                  const isHighlightedSection =
                    group.pnlSection === "Manufacturing Cost" ||
                    group.pnlSection === "Administrative, Selling & Distribution";

                  return (
                    <React.Fragment key={group.id}>
                      {/* LEVEL 1: MAJOR REPORTING GROUP */}
                      <tr
                        id={
                          group.pnlSection === "Manufacturing Cost"
                            ? "tally-group-manufacturing"
                            : group.pnlSection === "Administrative, Selling & Distribution"
                              ? "tally-group-indirect-admin"
                              : group.pnlSection === "Employee Benefit Expenses"
                                ? "tally-group-employee-benefit"
                                : undefined
                        }
                        onClick={() => toggleGroup(group.pnlSection)}
                        className={`cursor-pointer transition-colors ${
                          group.pnlSection === "Manufacturing Cost"
                            ? "bg-slate-900 text-white hover:bg-slate-800 font-bold"
                            : group.pnlSection === "Administrative, Selling & Distribution"
                              ? "bg-indigo-950 text-white hover:bg-indigo-900 font-bold"
                              : "bg-slate-100 hover:bg-slate-200/80 text-slate-950 font-bold"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center flex-wrap gap-2">
                            {isGroupExpanded ? (
                              <ChevronDown className="w-4 h-4 shrink-0 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 shrink-0 text-emerald-400" />
                            )}
                            <span className="text-xs tracking-wide">{group.pnlSection}</span>
                            <span
                              className={`text-[10px] font-mono font-normal ${
                                isHighlightedSection ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              ({group.standardAccounts.length} Subledgers · {group.ledgerCount}{" "}
                              Ledgers)
                            </span>
                          </div>
                        </td>

                        {showTechnicalDetails && (
                          <>
                            <td
                              className={`py-3 px-3 text-[11px] font-normal ${
                                isHighlightedSection ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              Major Group
                            </td>
                            <td
                              className={`py-3 px-3 text-[11px] font-normal ${
                                isHighlightedSection ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              ∑ of{" "}
                              {group.standardAccounts.map((s) => s.standardAccount).join(" + ")}
                            </td>
                            <td className="py-3 px-3 text-center text-[11px] font-mono">
                              ∑ {group.ledgerCount} Ledgers
                            </td>
                          </>
                        )}

                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold">
                          {fmt(group.currentMonth)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono ${
                            isHighlightedSection ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {fmt(group.previousMonth)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {fmt(group.ytdAmount)}
                        </td>

                        {showTechnicalDetails && (
                          <td className="py-3 px-3 text-right text-[11px]">
                            <span
                              className={
                                isHighlightedSection ? "text-emerald-300" : "text-slate-600"
                              }
                            >
                              {isGroupExpanded ? "Collapse ▲" : "Drill Down ▼"}
                            </span>
                          </td>
                        )}
                      </tr>

                      {/* LEVEL 2: SUBLEDGERS / STANDARD ACCOUNTS */}
                      {isGroupExpanded &&
                        group.standardAccounts.map((std) => {
                          const stdKey = `${group.pnlSection}::${std.standardAccount}`;
                          const isStdExpanded = Boolean(expandedStandardAccounts[stdKey]);

                          return (
                            <React.Fragment key={std.id}>
                              <tr
                                onClick={() =>
                                  toggleStandardAccount(group.pnlSection, std.standardAccount)
                                }
                                className="bg-indigo-50/55 hover:bg-indigo-100/60 text-slate-900 font-bold cursor-pointer transition-colors border-t border-indigo-100"
                              >
                                <td className="py-2.5 pl-8 pr-4">
                                  <div className="flex items-center gap-2">
                                    {isStdExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                    )}
                                    <span className="text-indigo-950 font-semibold">
                                      {std.standardAccount}
                                    </span>
                                    <span className="text-[10px] font-normal text-indigo-700 font-mono">
                                      ({std.ledgers.length}{" "}
                                      {std.ledgers.length === 1 ? "Ledger" : "Ledgers"})
                                    </span>
                                  </div>
                                </td>

                                {showTechnicalDetails && (
                                  <>
                                    <td className="py-2.5 px-3 text-[11px] font-normal text-slate-500">
                                      Subledger Rollup
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] font-medium text-indigo-900">
                                      {std.reportingGroup}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-[11px] font-mono text-indigo-700">
                                      ∑ {std.ledgers.length} Ledgers
                                    </td>
                                  </>
                                )}

                                <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-950">
                                  {fmt(std.currentMonth)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono text-slate-600 font-normal">
                                  {fmt(std.previousMonth)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono text-indigo-900">
                                  {fmt(std.ytdAmount)}
                                </td>

                                {showTechnicalDetails && (
                                  <td className="py-2.5 px-3 text-right text-[11px] text-indigo-700 font-semibold">
                                    {isStdExpanded ? "Hide Ledgers ▲" : "Show Ledgers ▼"}
                                  </td>
                                )}
                              </tr>

                              {/* LEVEL 3: INDIVIDUAL TALLY LEDGERS */}
                              {isStdExpanded &&
                                std.ledgers.map((ledger) => {
                                  const isFlagged =
                                    ledger.mappingStatus === "flagged_parent_changed";

                                  return (
                                    <tr
                                      key={ledger.id}
                                      className={`transition-colors ${
                                        isFlagged
                                          ? "bg-amber-50/90 hover:bg-amber-100/80 text-slate-900"
                                          : "bg-white hover:bg-slate-50 text-slate-800"
                                      }`}
                                    >
                                      {/* Clean Ledger Name */}
                                      <td className="py-2 pl-14 pr-4">
                                        <div className="flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                          <span className="font-medium text-slate-900 text-xs">
                                            {ledger.displayName || ledger.tallyLedgerName}
                                          </span>
                                        </div>
                                      </td>

                                      {showTechnicalDetails && (
                                        <>
                                          <td className="py-2 px-3 font-mono text-[11px]">
                                            <div className="text-slate-800 font-medium">
                                              {ledger.tallyParentGroup}
                                            </div>
                                            {ledger.previousTallyParentGroup && (
                                              <div className="text-[10px] text-rose-700 font-sans font-semibold">
                                                Prev: {ledger.previousTallyParentGroup}
                                              </div>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-[11px] text-slate-600">
                                            <div>
                                              <strong className="text-slate-800">
                                                {ledger.standardAccount}
                                              </strong>{" "}
                                              · {ledger.reportingGroup}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center text-[11px]">
                                            {isFlagged ? (
                                              <span className="text-amber-900 font-bold flex items-center justify-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                <span>Flagged</span>
                                              </span>
                                            ) : ledger.mappingStatus === "auto_mapped" ? (
                                              <span className="text-emerald-700 font-semibold">
                                                ✓ Auto-Mapped
                                              </span>
                                            ) : ledger.mappingStatus === "approved" ? (
                                              <span className="text-slate-600">✓ Approved</span>
                                            ) : (
                                              <span className="text-indigo-700 font-semibold">
                                                Needs Review
                                              </span>
                                            )}
                                          </td>
                                        </>
                                      )}

                                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                                        {fmt(ledger.currentMonth)}
                                      </td>
                                      <td className="py-2 px-4 text-right font-mono text-slate-500 text-xs">
                                        {fmt(ledger.previousMonth)}
                                      </td>
                                      <td className="py-2 px-4 text-right font-mono text-slate-700 text-xs font-medium">
                                        {fmt(ledger.ytdAmount)}
                                      </td>

                                      {showTechnicalDetails && (
                                        <td className="py-2 px-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() => setEditingLedger(ledger)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                                              isFlagged
                                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                            }`}
                                          >
                                            {isFlagged ? "Review" : "Map"}
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 1: EDIT / REVIEW TALLY LEDGER MAPPING (Retaining All 4 Values)
         ======================================================================== */}
      {editingLedger && (
        <LedgerMappingModal
          ledger={editingLedger}
          unitMode={unitMode}
          onClose={() => setEditingLedger(null)}
          onSave={handleSaveLedgerMapping}
        />
      )}

      {/* ========================================================================
          MODAL 2: ADD / MAP NEW TALLY LEDGER
         ======================================================================== */}
      {isAddLedgerModalOpen && (
        <AddTallyLedgerModal
          defaultStatementType={statementType}
          onClose={() => setIsAddLedgerModalOpen(false)}
          onCreate={handleCreateNewTallyLedger}
        />
      )}
    </div>
  );
};

/* ============================================================================
   SUB-MODAL 1: TALLY LEDGER MAPPING & PARENT GROUP REVIEW MODAL
   ============================================================================ */
const LedgerMappingModal: React.FC<{
  ledger: TallyLedgerRecord;
  unitMode: "crores" | "lakhs" | "rupees";
  onClose: () => void;
  onSave: (
    ledgerId: string,
    updates: {
      displayName?: string;
      pnlSection: string;
      reportingGroup: string;
      standardAccount: string;
      currentMonth: number;
      approveParentGroup: boolean;
    },
  ) => void;
}> = ({ ledger, onClose, onSave }) => {
  const sectionsList =
    ledger.statementType === "Balance Sheet" ? CFOSARTHI_BS_SECTIONS : CFOSARTHI_PNL_SECTIONS;

  const [displayName, setDisplayName] = useState(ledger.displayName || "");
  const [pnlSection, setPnlSection] = useState(ledger.pnlSection);
  const [reportingGroup, setReportingGroup] = useState(ledger.reportingGroup);
  const [standardAccount, setStandardAccount] = useState(ledger.standardAccount);
  const [currentMonth, setCurrentMonth] = useState(ledger.currentMonth);

  const selectedSecObj = sectionsList.find((s) => s.pnlSection === pnlSection) || sectionsList[0];

  const handleSectionChange = (newSec: string) => {
    setPnlSection(newSec);
    const found = sectionsList.find((s) => s.pnlSection === newSec);
    if (found) {
      setReportingGroup(found.reportingGroups[0] || "");
      setStandardAccount(found.standardAccounts[0] || "");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">
              Tally Ledger Mapping &amp; Classification Inspector
            </h3>
            <p className="text-[11px] text-slate-400">
              Original Tally Ledger Name and Tally Parent Group are strictly retained
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {ledger.mappingStatus === "flagged_parent_changed" && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Flagged for Review: Tally Parent Group Changed in Subsequent Import</span>
              </div>
              <p className="text-[11px]">
                In previous imports for Company ID <strong>{ledger.companyId}</strong>, this ledger
                had Tally Parent Group{" "}
                <strong className="underline">{ledger.previousTallyParentGroup}</strong>. In the
                latest import, Tally reported Parent Group{" "}
                <strong className="text-rose-700 underline">{ledger.tallyParentGroup}</strong>.
                Verify the CFOSARTHI Standard Account below and click{" "}
                <strong>Approve Mapping &amp; Parent Group</strong>.
              </p>
            </div>
          )}

          {/* Read-only Original Tally Attributes (No Loss of Information) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              1. Original Tally ERP Attributes (Read-Only · Never Overwritten)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Original Tally Ledger Name (Immutable)
                </label>
                <input
                  type="text"
                  value={ledger.tallyLedgerName}
                  disabled
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-200/70 border border-slate-300 text-slate-900 font-mono font-bold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Tally Parent Group (From Tally)
                </label>
                <input
                  type="text"
                  value={ledger.tallyParentGroup}
                  disabled
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-200/70 border border-slate-300 text-slate-900 font-mono font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Editable Classification */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              2. Financial Reporting Classification (Subledger &amp; Major Section)
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Optional Display Name (Leaves original Tally Ledger Name preserved)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={ledger.tallyLedgerName}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {ledger.statementType} Major Section
                </label>
                <select
                  value={pnlSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-semibold"
                >
                  {sectionsList.map((s) => (
                    <option key={s.pnlSection} value={s.pnlSection}>
                      {s.pnlSection}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reporting Group
                </label>
                <input
                  type="text"
                  value={reportingGroup}
                  onChange={(e) => setReportingGroup(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Standard Account / Subledger Head
                </label>
                <select
                  value={standardAccount}
                  onChange={(e) => setStandardAccount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50/40 text-indigo-950 font-bold"
                >
                  {selectedSecObj.standardAccounts.map((sa) => (
                    <option key={sa} value={sa}>
                      {sa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Current Period Balance (₹ Rupees)
                </label>
                <input
                  type="number"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(ledger.id, {
                displayName,
                pnlSection,
                reportingGroup,
                standardAccount,
                currentMonth,
                approveParentGroup: true,
              })
            }
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            Approve Mapping &amp; Recalculate Parent Totals
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   SUB-MODAL 2: ADD / MAP NEW TALLY LEDGER
   ============================================================================ */
const AddTallyLedgerModal: React.FC<{
  defaultStatementType: TallyStatementType;
  onClose: () => void;
  onCreate: (data: {
    tallyLedgerName: string;
    tallyParentGroup: string;
    displayName?: string;
    statementType: TallyStatementType;
    pnlSection: string;
    reportingGroup: string;
    standardAccount: string;
    currentMonth: number;
  }) => void;
}> = ({ defaultStatementType, onClose, onCreate }) => {
  const [statementType, setStatementType] = useState<TallyStatementType>(defaultStatementType);
  const sectionsList =
    statementType === "Balance Sheet" ? CFOSARTHI_BS_SECTIONS : CFOSARTHI_PNL_SECTIONS;

  const [tallyLedgerName, setTallyLedgerName] = useState("Solar Rooftop Power – Unit 1");
  const [tallyParentGroup, setTallyParentGroup] = useState("Indirect Expenses");
  const [displayName, setDisplayName] = useState("");
  const [pnlSection, setPnlSection] = useState("Manufacturing Cost");
  const [reportingGroup, setReportingGroup] = useState("Manufacturing Overheads");
  const [standardAccount, setStandardAccount] = useState("Power & Fuel");
  const [currentMonth, setCurrentMonth] = useState(1500000); // ₹0.15 Cr

  const selectedSecObj = sectionsList.find((s) => s.pnlSection === pnlSection) || sectionsList[0];

  const handleSectionChange = (newSec: string) => {
    setPnlSection(newSec);
    const found = sectionsList.find((s) => s.pnlSection === newSec);
    if (found) {
      setReportingGroup(found.reportingGroups[0] || "");
      setStandardAccount(found.standardAccounts[0] || "");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Map &amp; Add New Individual Tally Ledger</h3>
            <p className="text-[11px] text-slate-400">
              Retains original Tally Ledger Name &amp; Parent Group while mapping to reporting head
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tally Ledger Name (Exact from Tally) *
              </label>
              <input
                type="text"
                value={tallyLedgerName}
                onChange={(e) => setTallyLedgerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tally Parent Group (From Tally) *
              </label>
              <input
                type="text"
                value={tallyParentGroup}
                onChange={(e) => setTallyParentGroup(e.target.value)}
                placeholder="e.g. Indirect Expenses, Direct Expenses, Purchase Accounts"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Financial Statement
              </label>
              <select
                value={statementType}
                onChange={(e) => {
                  const st = e.target.value as TallyStatementType;
                  setStatementType(st);
                  const list =
                    st === "Balance Sheet" ? CFOSARTHI_BS_SECTIONS : CFOSARTHI_PNL_SECTIONS;
                  setPnlSection(list[0].pnlSection);
                  setReportingGroup(list[0].reportingGroups[0]);
                  setStandardAccount(list[0].standardAccounts[0]);
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
              >
                <option value="P&L">Profit &amp; Loss (P&amp;L)</option>
                <option value="Balance Sheet">Balance Sheet</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Major Reporting Group / Section
              </label>
              <select
                value={pnlSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-semibold"
              >
                {sectionsList.map((s) => (
                  <option key={s.pnlSection} value={s.pnlSection}>
                    {s.pnlSection}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Standard Account / Subledger Head
              </label>
              <select
                value={standardAccount}
                onChange={(e) => setStandardAccount(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50/40 text-indigo-950 font-bold"
              >
                {selectedSecObj.standardAccounts.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Reporting Group
              </label>
              <input
                type="text"
                value={reportingGroup}
                onChange={(e) => setReportingGroup(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ledger Balance (₹ Rupees)
              </label>
              <input
                type="number"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Optional Display Alias
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Leaves original Tally name untouched"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!tallyLedgerName.trim()) return;
              onCreate({
                tallyLedgerName,
                tallyParentGroup,
                displayName,
                statementType,
                pnlSection,
                reportingGroup,
                standardAccount,
                currentMonth,
              });
            }}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            Preserve Tally Ledger &amp; Save Mapping Rule
          </button>
        </div>
      </div>
    </div>
  );
};
