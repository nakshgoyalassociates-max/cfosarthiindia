import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  Building2,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  Calendar,
  AlertOctagon,
  Check,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
  Sparkles,
  UserPlus,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3,
  Scale,
  Layers,
  ArrowUpRight,
  Activity,
  Percent,
  Sliders,
  Target,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { ProgressBar } from "../common/ProgressBar";
import { formatINR, formatLakhs, formatCrores } from "../../utils/format";
import { isComplianceFiled, daysUntilDue } from "../../utils/dueDate";
import { CompanySquareWindow } from "./CompanySquareWindow";
import { CfoExecutiveReportEditor } from "./CfoExecutiveReportEditor";
import { ComplianceItem } from "../../types";
import { ClientFinancialRatios } from "../client/ClientFinancialRatios";
import {
  COMPANY_MIS_DETAILED,
  NEXORA_BALANCE_SHEET,
  NEXORA_PNL_STATEMENT,
  NEXORA_DEBTOR_AGEING,
  NEXORA_FUND_FLOW,
} from "../../data/mockMisFinancials";
import { computeRatios, CalculatedRatio, DEFAULT_RATIO_BENCHMARKS } from "../../utils/ratios";

export const PortfolioOverview: React.FC = () => {
  const {
    allCompaniesOverview,
    drillDownToCompany,
    clientProfile,
    selectedCompanyId,
    setSelectedCompanyId,
    switchCompanyAndTab,
    allCompliancesMap,
    allActionsMap,
    allMISMap,
    allBudgetMap,
    getReportsForCompany,
    approveCfoComplianceReview,
    showToast,
    setIsInviteModalOpen,
  } = useApp();

  // Company Triage Filter
  const [healthFilter, setHealthFilter] = useState<"ALL" | "critical" | "attention" | "smooth">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [companyViewMode, setCompanyViewMode] = useState<"grid" | "table">("grid");

  // Aggregate stats across all companies
  const totalCompanies = allCompaniesOverview.length;
  const totalPendingCfoSignoffs = allCompaniesOverview.reduce(
    (acc, c) => acc + (c.pendingCfoReviews || 0),
    0,
  );
  const totalCompliancesAll = allCompaniesOverview.reduce(
    (acc, c) => acc + (c.totalCompliances || 0),
    0,
  );
  const totalCompletedAll = allCompaniesOverview.reduce(
    (acc, c) => acc + (c.fullyCompletedCompliances || 0),
    0,
  );
  const avgComplianceRate =
    totalCompliancesAll > 0 ? Math.round((totalCompletedAll / totalCompliancesAll) * 100) : 0;
  const totalRevenue = allCompaniesOverview.reduce((acc, c) => acc + (c.monthlyRevenue || 0), 0);
  const totalTaxQueued = allCompaniesOverview.reduce((acc, c) => acc + (c.taxPending || 0), 0);

  // Health counts for quick triage buttons
  const criticalCompaniesCount = allCompaniesOverview.filter(
    (c) => c.overallHealth === "critical",
  ).length;
  const attentionCompaniesCount = allCompaniesOverview.filter(
    (c) => c.overallHealth === "attention",
  ).length;
  const smoothCompaniesCount = allCompaniesOverview.filter(
    (c) => c.overallHealth === "smooth",
  ).length;

  // Master Company-Wise Portfolio View Scope: "all" or specific company ID
  const [portfolioScope, setPortfolioScope] = useState<string>("all");

  // Filtered companies (supporting both healthFilter and company-wise portfolioScope)
  const filteredCompanies = allCompaniesOverview.filter((c) => {
    if (portfolioScope !== "all" && c.companyId !== portfolioScope) return false;
    if (healthFilter === "critical" && c.overallHealth !== "critical") return false;
    if (healthFilter === "attention" && c.overallHealth !== "attention") return false;
    if (healthFilter === "smooth" && c.overallHealth !== "smooth") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.companyName.toLowerCase().includes(q);
      const matchGstin = c.gstin.toLowerCase().includes(q);
      const matchSector = c.sector.toLowerCase().includes(q);
      const matchEntity = c.entityType.toLowerCase().includes(q);
      if (!matchName && !matchGstin && !matchSector && !matchEntity) return false;
    }
    return true;
  });

  const activeScopeCompany =
    portfolioScope !== "all"
      ? allCompaniesOverview.find((c) => c.companyId === portfolioScope)
      : null;

  // Track extended company dossier cards (default is compact / collapsed)
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const toggleCardExpanded = (companyId: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const areAllExpanded =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((c) => !!expandedCardIds[c.companyId]);

  const toggleAllExpanded = () => {
    if (areAllExpanded) {
      setExpandedCardIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredCompanies.forEach((c) => {
        next[c.companyId] = true;
      });
      setExpandedCardIds(next);
    }
  };

  // Financial Ratios, Pie Charts & Visual Indications State
  const [selectedRatioEntityId, setSelectedRatioEntityId] = useState<string>("all");
  const [isRatioSectionExpanded, setIsRatioSectionExpanded] = useState<boolean>(true);
  const [comparativeMetricTab, setComparativeMetricTab] = useState<
    "all" | "margins" | "liquidity" | "working_capital" | "pie_mix"
  >("all");

  // Computed ratios map per company using shared central calculation engine
  const companyRatiosMap = useMemo(() => {
    const map: Record<string, CalculatedRatio[]> = {};
    allCompaniesOverview.forEach((comp) => {
      const detailed = COMPANY_MIS_DETAILED[comp.companyId];
      const bs =
        detailed?.balanceSheet ||
        (comp.companyId === "client-101" ? NEXORA_BALANCE_SHEET : undefined);
      const pnl =
        detailed?.pnlStatement ||
        (comp.companyId === "client-101" ? NEXORA_PNL_STATEMENT : undefined);
      const debtors =
        detailed?.debtorAgeing ||
        (comp.companyId === "client-101" ? NEXORA_DEBTOR_AGEING : undefined);
      map[comp.companyId] = computeRatios(
        pnl,
        bs,
        debtors,
        pnl?.period || comp.mis?.period,
        comp.company?.ratioBenchmarks || DEFAULT_RATIO_BENCHMARKS,
      );
    });
    return map;
  }, [allCompaniesOverview]);

  // Comparative Margins Data (EBITDA % & Net Profit %)
  const comparativeMarginsData = useMemo(() => {
    return allCompaniesOverview.map((comp) => {
      const ratios = companyRatiosMap[comp.companyId] || [];
      const ebitdaRatio = ratios.find((r) => r.id === "ebitda-margin");
      const patRatio = ratios.find((r) => r.id === "net-profit-margin");
      return {
        entity: comp.companyName.split(" ")[0],
        fullName: comp.companyName,
        companyId: comp.companyId,
        ebitda: ebitdaRatio
          ? Math.round(ebitdaRatio.currentValue * 10) / 10
          : comp.mis?.ebitdaMarginPercent || 0,
        pat: patRatio
          ? Math.round(patRatio.currentValue * 10) / 10
          : comp.mis?.netProfitMarginPercent || 0,
        benchmarkEbitda: 18.0,
        benchmarkPat: 12.0,
      };
    });
  }, [allCompaniesOverview, companyRatiosMap]);

  // Comparative Liquidity & Leverage Data (Current Ratio & Debt/Equity)
  const comparativeLiquidityData = useMemo(() => {
    return allCompaniesOverview.map((comp) => {
      const ratios = companyRatiosMap[comp.companyId] || [];
      const cr = ratios.find((r) => r.id === "current-ratio");
      const de = ratios.find((r) => r.id === "debt-equity");
      return {
        entity: comp.companyName.split(" ")[0],
        fullName: comp.companyName,
        companyId: comp.companyId,
        currentRatio: cr ? Math.round(cr.currentValue * 100) / 100 : 2.0,
        debtEquity: de ? Math.round(de.currentValue * 100) / 100 : 0.5,
        benchmarkCR: 2.0,
        benchmarkDE: 1.0,
      };
    });
  }, [allCompaniesOverview, companyRatiosMap]);

  // Comparative Working Capital Data (Cash Conversion Cycle, DSO, Creditor Days)
  const comparativeWorkingCapitalData = useMemo(() => {
    return allCompaniesOverview.map((comp) => {
      const ratios = companyRatiosMap[comp.companyId] || [];
      const ccc = ratios.find((r) => r.id === "cash-conversion-cycle");
      const dso = ratios.find((r) => r.id === "debtor-days");
      const dpo = ratios.find((r) => r.id === "creditor-days");
      return {
        entity: comp.companyName.split(" ")[0],
        fullName: comp.companyName,
        companyId: comp.companyId,
        ccc: ccc ? Math.round(ccc.currentValue) : 40,
        dso: dso ? Math.round(dso.currentValue) : 45,
        dpo: dpo ? Math.round(dpo.currentValue) : 30,
        benchmarkCCC: 40,
      };
    });
  }, [allCompaniesOverview, companyRatiosMap]);

  // Portfolio Aggregated Cost Structure Pie Data
  const portfolioCostPieData = [
    { name: "Direct Costs / COGS / Fleet", value: 1622000, color: "#6366f1" },
    { name: "Employee Payroll & Benefits", value: 2350000, color: "#10b981" },
    { name: "Tech, Cloud & Infrastructure", value: 395000, color: "#06b6d4" },
    { name: "Depreciation & Amortization", value: 340000, color: "#f59e0b" },
    { name: "Finance Costs & Borrowing", value: 133000, color: "#8b5cf6" },
    { name: "SG&A, Legal & Admin Overhead", value: 876000, color: "#ec4899" },
  ];
  const totalPortfolioCost = portfolioCostPieData.reduce((acc, i) => acc + i.value, 0);

  // Portfolio Aggregated Capital Structure Pie Data
  const portfolioCapitalPieData = [
    { name: "Shareholders' Equity (Net Worth)", value: 136650000, color: "#10b981" },
    { name: "Long-Term Bank Borrowings", value: 36050000, color: "#6366f1" },
    { name: "Current Working Capital Liabilities", value: 18410000, color: "#f59e0b" },
  ];
  const totalPortfolioCapital = portfolioCapitalPieData.reduce((acc, i) => acc + i.value, 0);

  // Resolve single-company active datasets when a specific company is selected in ratios
  const selectedDetailed = COMPANY_MIS_DETAILED[selectedRatioEntityId];
  const selectedBS =
    selectedDetailed?.balanceSheet ||
    (selectedRatioEntityId === "client-101" ? NEXORA_BALANCE_SHEET : undefined);
  const selectedPnl =
    selectedDetailed?.pnlStatement ||
    (selectedRatioEntityId === "client-101" ? NEXORA_PNL_STATEMENT : undefined);
  const selectedDebtors =
    selectedDetailed?.debtorAgeing ||
    (selectedRatioEntityId === "client-101" ? NEXORA_DEBTOR_AGEING : undefined);
  const selectedMIS = allMISMap[selectedRatioEntityId] || undefined;
  const selectedCompliances = allCompliancesMap[selectedRatioEntityId] || [];
  const selectedCompanyProfile =
    allCompaniesOverview.find((c) => c.companyId === selectedRatioEntityId)?.company ||
    clientProfile;

  const handleSelectRatioEntity = (companyId: string) => {
    setSelectedRatioEntityId(companyId);
    setPortfolioScope(companyId);
    setIsRatioSectionExpanded(true);
    const el = document.getElementById("portfolio-financial-ratios-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE PORTFOLIO HEADER & MACRO KPI STRIP */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                {portfolioScope === "all" ? "Multi-Entity Practice Overview" : "Company-Wise Surveillance Focus"}
              </span>
              <span className="text-xs font-medium text-slate-500">{clientProfile.cfoFirm}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeScopeCompany
                ? `${activeScopeCompany.companyName} — Surveillance &amp; Ratios`
                : "CFO Portfolio Surveillance & Company-Wise Command Center"}
            </h1>
            <p className="text-xs text-slate-500">
              {activeScopeCompany
                ? `Company-wise surveillance dossier for ${activeScopeCompany.companyName} (${activeScopeCompany.legalEntity}) · Sector: ${activeScopeCompany.sector} · GSTIN: ${activeScopeCompany.gstin}`
                : "Company-wise surveillance of critical overdue compliances, financial MIS highlights, and executive observations across all client entities."}
            </p>
          </div>
        </div>

        {/* Company-Wise Focus Scope Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-200/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Company-Wise Focus:</span>
            </span>
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
              <button
                type="button"
                id="portfolio-scope-all"
                onClick={() => {
                  setPortfolioScope("all");
                  setSelectedRatioEntityId("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  portfolioScope === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>All Entities (Consolidated)</span>
              </button>

              {allCompaniesOverview.map((c) => {
                const isSelected = portfolioScope === c.companyId;
                return (
                  <button
                    key={c.companyId}
                    type="button"
                    id={`portfolio-scope-${c.companyId}`}
                    onClick={() => {
                      setPortfolioScope(c.companyId);
                      setSelectedRatioEntityId(c.companyId);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{c.companyName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? "bg-indigo-700 text-indigo-100"
                          : c.overallHealth === "smooth"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.overallHealth === "critical"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.complianceRate}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {portfolioScope !== "all" && activeScopeCompany && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => drillDownToCompany(activeScopeCompany.companyId)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Open full company workspace on this same dashboard"
              >
                <span>Open In-Dashboard Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortfolioScope("all");
                  setSelectedRatioEntityId("all");
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          )}
        </div>

        {/* Dynamic 4-Column Macro KPI Strip (Consolidated vs Company-Wise) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 border-t border-slate-100">
          <div className="p-4 sm:px-6 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/30">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700">
              <span>{activeScopeCompany ? "Entity & Sector" : "Managed Entities"}</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {activeScopeCompany ? activeScopeCompany.companyName : totalCompanies}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {activeScopeCompany
                  ? `${activeScopeCompany.legalEntity} · ${activeScopeCompany.sector}`
                  : `${smoothCompaniesCount} Smooth • ${criticalCompaniesCount + attentionCompaniesCount} Watch`}
              </span>
            </div>
          </div>

          <div className="p-4 sm:px-6 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>{activeScopeCompany ? "Statutory Filing Rate" : "Portfolio Compliance"}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {activeScopeCompany ? activeScopeCompany.complianceRate : avgComplianceRate}%
              </span>
              <span className="text-[11px] text-emerald-700">
                {activeScopeCompany
                  ? `(${activeScopeCompany.fullyCompletedCompliances}/${activeScopeCompany.totalCompliances} closed)`
                  : `(${totalCompletedAll}/${totalCompliancesAll} closed)`}
              </span>
            </div>
          </div>

          <div className="p-4 sm:px-6 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/30">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-800">
              <span>CFO Sign-Off Queue</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-purple-700 font-mono">
                {activeScopeCompany
                  ? activeScopeCompany.pendingCfoReviews
                  : totalPendingCfoSignoffs}
              </span>
              <span className="text-[11px] text-purple-700 font-medium">
                {activeScopeCompany
                  ? activeScopeCompany.pendingCfoReviews > 0
                    ? "Pending CFO approval"
                    : "All approvals cleared"
                  : "Awaiting authorization"}
              </span>
            </div>
          </div>

          <div className="p-4 sm:px-6 bg-gradient-to-br from-cyan-50/70 via-white to-sky-50/30">
            <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-800">
              <span>{activeScopeCompany ? "Monthly Revenue & Tax" : "Combined Monthly Revenue"}</span>
              <IndianRupee className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {formatCrores(activeScopeCompany ? activeScopeCompany.monthlyRevenue : totalRevenue)}
              </span>
              <span className="text-[11px] text-cyan-700">
                Tax queued: {formatLakhs(activeScopeCompany ? activeScopeCompany.taxPending : totalTaxQueued)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PORTFOLIO FINANCIAL RATIOS, PIE CHARTS & VISUAL INDICATIONS (MAIN HIGHLIGHT) */}
      <div
        id="portfolio-financial-ratios-section"
        className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs"
      >
        {/* Header Bar: Section Identity + Multi-Entity Switcher + Expand/Collapse */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Portfolio Financial Ratios &amp; Visual Analytics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  {selectedRatioEntityId === "all" ? "Comparative Practice Radar" : "Entity Deep-Dive"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive financial ratios, operating cost &amp; capital mix pie charts, margin dynamics, and side-by-side benchmarks
              </p>
            </div>
          </div>

          {/* Entity Selector Tabs: All Entities Radar vs Individual Company */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedRatioEntityId("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedRatioEntityId === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>All Entities Radar</span>
              </button>

              {allCompaniesOverview.map((c) => {
                const isSelected = selectedRatioEntityId === c.companyId;
                const companyRatios = companyRatiosMap[c.companyId] || [];
                const ebitda = companyRatios.find((r) => r.id === "ebitda-margin");
                return (
                  <button
                    key={c.companyId}
                    type="button"
                    onClick={() => setSelectedRatioEntityId(c.companyId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title={`${c.companyName} — EBITDA: ${ebitda?.valueFormatted || "n/a"}`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{c.companyName.split(" ")[0]}</span>
                    {ebitda && (
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                          isSelected
                            ? "bg-indigo-700 text-indigo-100"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ebitda.valueFormatted}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsRatioSectionExpanded((prev) => !prev)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title={
                isRatioSectionExpanded
                  ? "Collapse Financial Ratios Section"
                  : "Expand Financial Ratios Section"
              }
            >
              {isRatioSectionExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isRatioSectionExpanded &&
          (selectedRatioEntityId === "all" ? (
            /* ALL ENTITIES COMPARATIVE RADAR */
            <div className="space-y-5">
              {/* Sub-view Filter Pills for Comparative Radar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-indigo-600" />
                    <span>Focus View:</span>
                  </span>
                  {[
                    { id: "all", label: "Complete Radar (Charts & Pies)" },
                    { id: "margins", label: "Profitability Margins" },
                    { id: "liquidity", label: "Liquidity & Leverage" },
                    { id: "working_capital", label: "Cash Conversion Cycle" },
                    { id: "pie_mix", label: "Cost & Capital Pie Charts" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setComparativeMetricTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        comparativeMetricTab === tab.id
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-500">
                  Comparing <strong>{allCompaniesOverview.length} Entities</strong> against standard CFO benchmarks
                </div>
              </div>

              {/* SECTION: 3 RECHARTS COMPARATIVE GRAPHS */}
              {(comparativeMetricTab === "all" ||
                comparativeMetricTab === "margins" ||
                comparativeMetricTab === "liquidity" ||
                comparativeMetricTab === "working_capital") && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chart 1: Profitability Margins */}
                  {(comparativeMetricTab === "all" || comparativeMetricTab === "margins") && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Profitability Margins (%)
                            </h3>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Benchmark: 18% / 12%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          EBITDA Margin % vs Net Profit Margin (PAT %) across client entities
                        </p>
                        <div className="h-56 mt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparativeMarginsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="entity" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} />
                              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit="%" domain={[0, 35]} />
                              <Tooltip
                                formatter={(val: any, name: any) => [
                                  `${val}%`,
                                  name === "ebitda" ? "EBITDA Margin" : "Net Profit Margin",
                                ]}
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "10px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  border: "none",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                              <Bar dataKey="ebitda" name="EBITDA %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="pat" name="PAT %" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Top Margin: <strong>Nexora (27.9%)</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectRatioEntity("client-101")}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Chart 2: Liquidity & Solvency */}
                  {(comparativeMetricTab === "all" || comparativeMetricTab === "liquidity") && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Liquidity &amp; Solvency Multiples
                            </h3>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            CR &gt; 1.5x • D/E &lt; 1.0x
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Current Ratio (working capital cover) vs Debt-to-Equity (leverage)
                        </p>
                        <div className="h-56 mt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparativeLiquidityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="entity" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} />
                              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit="x" domain={[0, 5]} />
                              <Tooltip
                                formatter={(val: any, name: any) => [
                                  `${val}x`,
                                  name === "currentRatio" ? "Current Ratio" : "Debt / Equity",
                                ]}
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "10px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  border: "none",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                              <Bar dataKey="currentRatio" name="Current Ratio (x)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="debtEquity" name="Debt / Equity (x)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Solvency: <strong>Zero Debt (Zenith)</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectRatioEntity("client-103")}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Chart 3: Cash Conversion Cycle */}
                  {(comparativeMetricTab === "all" || comparativeMetricTab === "working_capital") && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Working Capital Velocity (Days)
                            </h3>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Target CCC &lt; 45d
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Cash Conversion Cycle (CCC), Debtor Collection (DSO), &amp; Creditor Days
                        </p>
                        <div className="h-56 mt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparativeWorkingCapitalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="entity" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} />
                              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit="d" domain={[0, 60]} />
                              <Tooltip
                                formatter={(val: any, name: any) => [
                                  `${val} Days`,
                                  name === "ccc"
                                    ? "Cash Conversion Cycle"
                                    : name === "dso"
                                    ? "Debtor DSO"
                                    : "Creditor DPO",
                                ]}
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "10px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  border: "none",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                              <Bar dataKey="ccc" name="CCC (Days)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="dso" name="DSO (Days)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Fastest Cycle: <strong>Zenith (28d)</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectRatioEntity("client-102")}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 2 PRACTICE-WIDE AGGREGATED PIE CHARTS */}
              {(comparativeMetricTab === "all" || comparativeMetricTab === "pie_mix") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Pie 1: Portfolio Aggregated Cost Structure */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-indigo-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Portfolio Operating Cost Structure Pie Chart
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          Total: ₹{formatLakhs(totalPortfolioCost)}/mo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Consolidated expense allocation across raw materials, team payroll, infrastructure, depreciation, and overhead
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 mt-4">
                        <div className="h-52 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={portfolioCostPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={78}
                                paddingAngle={3}
                              >
                                {portfolioCostPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val: any) => [`₹${formatLakhs(Number(val))}`, "Expense"]}
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "10px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  border: "none",
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend breakdown list */}
                        <div className="space-y-1.5 text-xs">
                          {portfolioCostPieData.map((item, idx) => {
                            const pct = Math.round((item.value / totalPortfolioCost) * 100);
                            return (
                              <div key={idx} className="flex items-center justify-between text-slate-700">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="truncate text-[11px]">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                  <span className="font-semibold">₹{formatLakhs(item.value)}</span>
                                  <span className="text-slate-400 w-8 text-right">({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Primary Cost Driver: <strong>Payroll (41.1%)</strong>
                      </span>
                      <span className="text-indigo-600 font-medium">Practice-Wide Aggregation</span>
                    </div>
                  </div>

                  {/* Pie 2: Portfolio Aggregated Capital Structure Mix */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Portfolio Capital Structure Mix Pie Chart
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          Total: ₹{formatCrores(totalPortfolioCapital)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Practice-wide leverage profile: Shareholders&apos; Net Worth vs Long-Term Debt vs Current Working Liabilities
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 mt-4">
                        <div className="h-52 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={portfolioCapitalPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={78}
                                paddingAngle={3}
                              >
                                {portfolioCapitalPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val: any) => [`₹${formatCrores(Number(val))}`, "Capital"]}
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "10px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  border: "none",
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legend breakdown list */}
                        <div className="space-y-2 text-xs">
                          {portfolioCapitalPieData.map((item, idx) => {
                            const pct = Math.round((item.value / totalPortfolioCapital) * 100);
                            return (
                              <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="font-semibold text-slate-800 text-[11px] truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 text-[11px]">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono pl-4">
                                  <span>Amount</span>
                                  <span className="font-semibold text-slate-700">
                                    ₹{formatCrores(item.value)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Equity Cushion: <strong>71.5% Net Worth</strong>
                      </span>
                      <span className="text-emerald-700 font-semibold">Low Practice Leverage</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: PRACTICE-WIDE COMPARATIVE RATIO SCORECARD TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Executive Financial Ratios Matrix (Cross-Portfolio)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Side-by-side surveillance of all key profitability, liquidity, and solvency ratios
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    All ratios computed as of latest September 2026 books
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-blue-600 text-white font-semibold border-b border-blue-700 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Entity &amp; Sector</th>
                        <th className="py-3 px-4">EBITDA Margin</th>
                        <th className="py-3 px-4">Net Profit (PAT)</th>
                        <th className="py-3 px-4">Current Ratio</th>
                        <th className="py-3 px-4">Debt / Equity</th>
                        <th className="py-3 px-4">Cash Conv. Cycle</th>
                        <th className="py-3 px-4">Health Status</th>
                        <th className="py-3 px-4 text-right">Interactive Deep-Dive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allCompaniesOverview.map((comp) => {
                        const ratios = companyRatiosMap[comp.companyId] || [];
                        const ebitda = ratios.find((r) => r.id === "ebitda-margin");
                        const pat = ratios.find((r) => r.id === "net-profit-margin");
                        const cr = ratios.find((r) => r.id === "current-ratio");
                        const de = ratios.find((r) => r.id === "debt-equity");
                        const ccc = ratios.find((r) => r.id === "cash-conversion-cycle");

                        return (
                          <tr key={comp.companyId} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {comp.companyName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div
                                    className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer"
                                    onClick={() => handleSelectRatioEntity(comp.companyId)}
                                  >
                                    {comp.companyName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {comp.sector} • {comp.gstin}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-slate-900">
                                {ebitda
                                  ? ebitda.valueFormatted
                                  : `${comp.mis?.ebitdaMarginPercent || 0}%`}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Target: ≥18%
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-slate-900">
                                {pat
                                  ? pat.valueFormatted
                                  : `${comp.mis?.netProfitMarginPercent || 0}%`}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Target: ≥12%
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-emerald-700">
                                {cr ? cr.valueFormatted : "2.0x"}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Target: ≥1.5x
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-slate-900">
                                {de ? de.valueFormatted : "0.5x"}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Target: ≤1.0x
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-purple-700">
                                {ccc ? ccc.valueFormatted : `${comp.mis?.debtorDaysDSO || 40}d`}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Target: ≤45d
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  comp.overallHealth === "critical"
                                    ? "bg-rose-100 text-rose-800"
                                    : comp.overallHealth === "attention"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    comp.overallHealth === "critical"
                                      ? "bg-rose-500 animate-pulse"
                                      : comp.overallHealth === "attention"
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                />
                                <span>
                                  {comp.overallHealth === "critical"
                                    ? "Critical Watch"
                                    : comp.overallHealth === "attention"
                                    ? "Review Pending"
                                    : "Healthy"}
                                </span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectRatioEntity(comp.companyId)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-indigo-200/80"
                                title={`Inspect detailed financial ratios and charts for ${comp.companyName}`}
                              >
                                <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>View Charts &amp; Ratios</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* INDIVIDUAL ENTITY DEEP DIVE WITH CLIENT FINANCIAL RATIOS (PIE CHARTS & GRAPHS) */
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedCompanyProfile?.companyName?.substring(0, 2).toUpperCase() || "CO"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedCompanyProfile?.companyName || "Client Entity"} — Financial Ratios &amp; Visual Intelligence
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200">
                        {selectedCompanyProfile?.entityType || "Pvt Ltd"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Interactive cost structure pie chart, working capital pie chart, profitability margins, and formula drilldowns
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRatioEntityId("all")}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>← Back to All Entities Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchCompanyAndTab(selectedRatioEntityId, "mis")}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>Open Company Workspace</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Render the full ClientFinancialRatios component */}
              <ClientFinancialRatios
                balanceSheet={selectedBS}
                pnl={selectedPnl}
                debtorAgeing={selectedDebtors}
                financialMIS={selectedMIS}
                compliances={selectedCompliances}
                clientProfile={selectedCompanyProfile}
                onSelectStatementTab={(tab) => switchCompanyAndTab(selectedRatioEntityId, "mis", tab)}
              />
            </div>
          ))}
      </div>

      {/* 3. CFO DESK: EXECUTIVE OBSERVATIONS, TAKEAWAYS & DIRECTIVES */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                CFO Desk — Executive Observations &amp; Directives
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative commentary, strategic advisories, and management directives per client
                company
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allCompaniesOverview.map((comp) => {
              const isSelected = comp.companyId === selectedCompanyId;
              return (
                <button
                  key={comp.companyId}
                  onClick={() => setSelectedCompanyId(comp.companyId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{comp.companyName.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <CfoExecutiveReportEditor />
      </div>

      {/* 4. COMPANY WISE SURVEILLANCE & COMMAND SECTION */}
      <div className="space-y-4">
        {/* Toolbar & Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Company-Wise Executive Surveillance
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                  {filteredCompanies.length} Entities
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed view per company: critical overdue compliances, financial vital signs, and
                summarized MIS observations
              </p>
            </div>
          </div>

          {/* Search & Layout View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entity, GSTIN, sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Table + Extend All */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setCompanyViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    companyViewMode === "grid"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cards Dossier</span>
                </button>
                <button
                  onClick={() => setCompanyViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    companyViewMode === "table"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Executive Matrix</span>
                </button>
              </div>

              {companyViewMode === "grid" && filteredCompanies.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllExpanded}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 transition-all cursor-pointer shadow-2xs"
                  title={
                    areAllExpanded
                      ? "Collapse all company cards"
                      : "Extend all company cards to view complete details"
                  }
                >
                  {areAllExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Extend All</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Triage Health Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter Status:</span>
          </span>

          <button
            onClick={() => setHealthFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              healthFilter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>All Companies</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                healthFilter === "ALL"
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-100 text-slate-700 font-bold"
              }`}
            >
              {allCompaniesOverview.length}
            </span>
          </button>

          <button
            onClick={() => setHealthFilter("critical")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              healthFilter === "critical"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
            }`}
            title="Show only companies with critical overdue filings or high financial risk"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical Watch</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                healthFilter === "critical"
                  ? "bg-rose-700 text-white"
                  : "bg-rose-100 text-rose-800 font-bold"
              }`}
            >
              {criticalCompaniesCount}
            </span>
          </button>

          <button
            onClick={() => setHealthFilter("attention")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              healthFilter === "attention"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
            title="Show companies awaiting Virtual CFO dual sign-off"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Review Sign-Off Queue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                healthFilter === "attention"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-100 text-amber-900 font-bold"
              }`}
            >
              {attentionCompaniesCount}
            </span>
          </button>

          <button
            onClick={() => setHealthFilter("smooth")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              healthFilter === "smooth"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
            }`}
            title="Show companies operating smoothly on schedule"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Smooth Running</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                healthFilter === "smooth"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-100 text-emerald-800 font-bold"
              }`}
            >
              {smoothCompaniesCount}
            </span>
          </button>

          {healthFilter !== "ALL" && (
            <button
              onClick={() => setHealthFilter("ALL")}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2 cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Focused Company Surveillance Indicator Banner */}
        {portfolioScope !== "all" && activeScopeCompany && (
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Focused Company Surveillance: <strong>{activeScopeCompany.companyName}</strong> ({activeScopeCompany.legalEntity} · {activeScopeCompany.sector})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => drillDownToCompany(activeScopeCompany.companyId)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Go to In-Dashboard Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortfolioScope("all");
                  setSelectedRatioEntityId("all");
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors cursor-pointer"
              >
                Show All Entities
              </button>
            </div>
          </div>
        )}

        {/* 5. DISPLAY: ONE DETAILED DOSSIER CARD PER COMPANY */}
        {companyViewMode === "grid" ? (
          filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredCompanies.map((company) => (
                <CompanySquareWindow
                  key={company.companyId}
                  company={company}
                  isExpanded={!!expandedCardIds[company.companyId]}
                  onToggleExpand={() => toggleCardExpanded(company.companyId)}
                  onSelectRatioView={handleSelectRatioEntity}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800">No entities found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No company matched the current filter ({healthFilter}) or search query &quot;
                {searchQuery}&quot;.
              </p>
              <button
                onClick={() => {
                  setHealthFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )
        ) : (
          /* 6. COMPARATIVE ENTITY STATUS MATRIX (TABLE VIEW) */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  Comparative Entity Status Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredCompanies.length} of {allCompaniesOverview.length} managed client
                  companies
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Company &amp; Legal Entity</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Critical Overdue Compliances</th>
                    <th className="py-3.5 px-4 min-w-[190px]">Financial MIS Highlights</th>
                    <th className="py-3.5 px-4 min-w-[220px]">CFO Observations over MIS</th>
                    <th className="py-3.5 px-4 text-center">Filing Rate</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((company) => {
                    const compList: ComplianceItem[] = allCompliancesMap[company.companyId] || [];
                    const overdues = compList.filter((c) => {
                      if (isComplianceFiled(c)) return false;
                      const d = daysUntilDue(c);
                      return d !== null && d < 0;
                    });
                    const awaitingSignoff = compList.filter((c) => {
                      if (isComplianceFiled(c)) return false;
                      return (
                        c.subtasks?.[0]?.status === "completed" &&
                        c.subtasks?.[1]?.status !== "completed"
                      );
                    });
                    const mis = company.mis;

                    return (
                      <tr
                        key={company.companyId}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Company info */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl font-bold text-xs text-white flex items-center justify-center shrink-0 shadow-2xs ${
                                company.overallHealth === "critical"
                                  ? "bg-rose-600"
                                  : company.overallHealth === "attention"
                                    ? "bg-amber-600"
                                    : "bg-slate-900"
                              }`}
                            >
                              {(company.companyName || "CO").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs">
                                  {company.companyName}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                                  {company.entityType.includes("LLP") ? "LLP" : "Pvt Ltd"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-mono text-slate-700">{company.gstin}</span>
                                <span>•</span>
                                <span>{company.sector}</span>
                              </div>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    company.overallHealth === "critical"
                                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                                      : company.overallHealth === "attention"
                                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {company.overallHealth === "critical"
                                    ? "Critical Watch"
                                    : company.overallHealth === "attention"
                                      ? "Review Required"
                                      : "Smooth Health"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Critical Overdue Compliances */}
                        <td className="py-4 px-4 align-top">
                          {overdues.length > 0 || awaitingSignoff.length > 0 ? (
                            <div className="space-y-1.5">
                              {overdues.slice(0, 2).map((item) => {
                                const days = Math.abs(daysUntilDue(item) || 0);
                                return (
                                  <div
                                    key={item.id}
                                    className="p-1.5 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start justify-between gap-1 text-[11px]"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-bold text-rose-950 truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-rose-700">
                                        {item.taxAmount
                                          ? `Tax: ${formatINR(item.taxAmount)}`
                                          : item.category}
                                      </p>
                                    </div>
                                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[9px] shrink-0">
                                      {days}d Overdue
                                    </span>
                                  </div>
                                );
                              })}
                              {awaitingSignoff.slice(0, 1).map((item) => (
                                <div
                                  key={item.id}
                                  className="p-1.5 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-between gap-1 text-[11px]"
                                >
                                  <span className="font-semibold text-purple-950 truncate">
                                    {item.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-purple-600 text-white font-bold text-[9px] shrink-0">
                                    CFO Sign-Off
                                  </span>
                                </div>
                              ))}
                              {overdues.length > 2 && (
                                <span className="text-[10px] text-slate-500 font-semibold block">
                                  +{overdues.length - 2} more overdue filings
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>0 Overdue • On Schedule</span>
                            </div>
                          )}
                        </td>

                        {/* Financial MIS Highlights */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Revenue:</span>
                              <strong className="font-mono text-slate-900">
                                {mis?.monthlyRevenue ? formatLakhs(mis.monthlyRevenue) : "n/a"}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">EBITDA:</span>
                              <span className="font-mono font-semibold text-indigo-700">
                                {mis?.ebitda ? formatLakhs(mis.ebitda) : "n/a"} (
                                {mis?.ebitdaMarginPercent}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Runway:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {mis?.cashRunwayMonths ? `${mis.cashRunwayMonths} Mo` : "n/a"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">DSO:</span>
                              <span className="font-mono text-slate-700">
                                {mis?.debtorDaysDSO ? `${mis.debtorDaysDSO} days` : "n/a"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CFO Observations over MIS */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1 max-w-xs">
                            <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                              {mis?.cfoExecutiveSummary ||
                                "No strategic observation recorded for this cycle."}
                            </p>
                            {mis?.cfoKeyAlerts && mis.cfoKeyAlerts.length > 0 && (
                              <p className="text-[10px] text-indigo-700 font-medium line-clamp-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>{mis.cfoKeyAlerts[0]}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Filing Rate */}
                        <td className="py-4 px-4 align-top text-center">
                          <div className="space-y-1">
                            <span className="font-bold font-mono text-slate-900 text-xs">
                              {company.compliancePercentage}%
                            </span>
                            <div className="w-16 mx-auto">
                              <ProgressBar
                                percentage={company.compliancePercentage}
                                height="h-1.5"
                                color={
                                  company.compliancePercentage >= 80
                                    ? "bg-emerald-600"
                                    : "bg-indigo-600"
                                }
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {company.fullyCompletedCompliances}/{company.totalCompliances}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              onClick={() => drillDownToCompany(company.companyId)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Open full company workspace"
                            >
                              <span>Workspace</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                onClick={() => handleSelectRatioEntity(company.companyId)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer flex items-center gap-0.5"
                                title="View Ratios & Charts in Portfolio Overview"
                              >
                                <PieChartIcon className="w-2.5 h-2.5" />
                                <span>Ratios</span>
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                onClick={() =>
                                  switchCompanyAndTab(company.companyId, "compliances")
                                }
                                className="text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer underline"
                              >
                                Compliances
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                onClick={() => switchCompanyAndTab(company.companyId, "mis")}
                                className="text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer underline"
                              >
                                MIS
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
