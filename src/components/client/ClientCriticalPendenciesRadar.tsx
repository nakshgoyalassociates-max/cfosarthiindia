// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { THEME_CONFIGS } from "../../utils/themeStyles";
import { ComplianceItem, ActionItem } from "../../types";
import { dueStatus, daysUntilDue } from "../../utils/dueDate";
import { ComplianceSubtaskProgressIcons } from "../common/ComplianceSubtaskProgressIcons";
import { ExpandableParagraph } from "../common/ExpandableParagraph";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  IndianRupee,
  Calendar,
  AlertCircle,
  Users,
} from "lucide-react";

interface ClientCriticalPendenciesRadarProps {
  criticalCompliances: ComplianceItem[];
  criticalActions: ActionItem[];
  onSelectCompliance: (item: ComplianceItem) => void;
  onSelectAction: (action: ActionItem) => void;
}

type PendencyTab = "all" | "statutory" | "operational" | "financial";

export const ClientCriticalPendenciesRadar: React.FC<ClientCriticalPendenciesRadarProps> = ({
  criticalCompliances,
  criticalActions,
  onSelectCompliance,
  onSelectAction,
}) => {
  const { colorTheme } = useApp();
  const theme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.sapphire;
  const [activeTab, setActiveTab] = useState<PendencyTab>("all");

  // Financial pendencies (e.g. MSME payment deadlines, high debtor overdues)
  const financialPendencies = [
    {
      id: "fin-msme-43bh",
      title: "MSME Section 43B(h) Vendor Payment Mandate",
      category: "MSME Compliance & Income Tax",
      urgency: "Urgent",
      dueInDays: 5,
      deadline: "Within 45 Days Rule",
      amount: "₹2.80 Lakhs",
      impact: "Disallowance of expense in Tax Assessment if unpaid",
      actionRequired: "Clear verified MSME supplier balance prior to month-end close",
      status: "Payment Approaching",
    },
    {
      id: "fin-debtor-90d",
      title: "Debtors Exceeding 90+ Days Credit Window",
      category: "Accounts Receivable",
      urgency: "Attention",
      dueInDays: 0,
      deadline: "Immediate Follow-up",
      amount: "₹3.80 Lakhs",
      impact: "Working capital drag & potential credit loss provision",
      actionRequired: "CFO recovery notice sent to client accounts department",
      status: "Recovery Escalation",
    },
    {
      id: "fin-corp-tax-q2",
      title: "Corporate Tax Return & Tax Audit Cash Allocation",
      category: "Direct Tax Provision",
      urgency: "Scheduled",
      dueInDays: 28,
      deadline: "31 October 2026",
      amount: "₹4.50 Lakhs",
      impact: "Mandatory corporate tax return & audit certification",
      actionRequired: "Review audit computations and Form 3CD with statutory auditor",
      status: "Treasury Scheduled",
    },
  ];

  const totalPendencies =
    criticalCompliances.length + criticalActions.length + financialPendencies.length;

  const overdueCount = criticalCompliances.filter((c) => dueStatus(c) === "overdue").length;
  const blockedCount = criticalActions.filter(
    (a) => a.status === "Blocked" || Boolean(a.blockedReason),
  ).length;
  const [selectedFinId, setSelectedFinId] = useState<string | null>(null);

  return (
    <div
      id="critical-pendencies"
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
    >
      {/* Compact Synopsis Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Critical &amp; Pending Synopsis
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            · {totalPendencies} items monitored
          </span>
        </div>

        {/* Clean Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-lg self-start sm:self-center">
          {[
            { key: "all", label: `All (${totalPendencies})` },
            { key: "statutory", label: `Statutory (${criticalCompliances.length})` },
            { key: "operational", label: `Workflows (${criticalActions.length})` },
            { key: "financial", label: `Financial (${financialPendencies.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as PendencyTab)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive At-a-Glance Synopsis Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
          <span className="text-slate-600 font-medium">Statutory Filings</span>
          <span
            className={`font-mono font-semibold text-[11px] ${
              overdueCount > 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {overdueCount > 0 ? `${overdueCount} Overdue` : "0 Overdue"} ·{" "}
            {criticalCompliances.length} Upcoming
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
          <span className="text-slate-600 font-medium">Operational Workflows</span>
          <span
            className={`font-mono font-semibold text-[11px] ${
              blockedCount > 0 ? "text-rose-700" : "text-amber-800"
            }`}
          >
            {blockedCount > 0 ? `${blockedCount} Blocked` : "All Moving"} · {criticalActions.length}{" "}
            Priority
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/90">
          <span className="text-slate-600 font-medium">MSME &amp; Tax Exposure</span>
          <span className="font-mono font-semibold text-[11px] text-indigo-700">
            ₹11.10L Monitored (3 Items)
          </span>
        </div>
      </div>

      {/* Short 3-Column Executive Synopsis */}
      <div
        className={`grid grid-cols-1 ${
          activeTab === "all" ? "lg:grid-cols-3" : "lg:grid-cols-1"
        } gap-4`}
      >
        {/* 1. Statutory Filings Synopsis */}
        {(activeTab === "all" || activeTab === "statutory") && (
          <div
            className={`rounded-xl p-3.5 space-y-2.5 border shadow-2xs ${theme.synopsisColumns.statutory.bg} ${theme.synopsisColumns.statutory.border}`}
          >
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-indigo-100/80">
              <span
                className={`font-bold flex items-center gap-1.5 ${theme.synopsisColumns.statutory.titleClass}`}
              >
                <span className={`w-2 h-2 rounded-full bg-indigo-600`} />
                1. Statutory Filings
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${theme.synopsisColumns.statutory.badgeClass}`}
              >
                {criticalCompliances.length} Due
              </span>
            </div>

            <div className="divide-y divide-indigo-100/50">
              {criticalCompliances.map((compliance) => {
                const isOverdue = dueStatus(compliance) === "overdue";
                const days = daysUntilDue(compliance);
                return (
                  <div
                    key={compliance.id}
                    onClick={() => onSelectCompliance(compliance)}
                    className="py-2 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-2 cursor-pointer group hover:bg-white/60 px-1 rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {compliance.title || compliance.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {compliance.category}
                        {compliance.estimatedTaxAmount
                          ? ` · ₹${(compliance.estimatedTaxAmount / 1000).toFixed(0)}k`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10.5px] font-semibold font-mono px-1.5 py-0.5 rounded ${
                          isOverdue
                            ? "bg-rose-100 text-rose-800"
                            : days !== null && days <= 7
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOverdue
                          ? `${Math.abs(days)}d Overdue`
                          : days === 0
                            ? "Due Today"
                            : `${days}d Left`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Operational Workflows Synopsis */}
        {(activeTab === "all" || activeTab === "operational") && (
          <div
            className={`rounded-xl p-3.5 space-y-2.5 border shadow-2xs ${theme.synopsisColumns.workflows.bg} ${theme.synopsisColumns.workflows.border}`}
          >
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-amber-100/80">
              <span
                className={`font-bold flex items-center gap-1.5 ${theme.synopsisColumns.workflows.titleClass}`}
              >
                <span className={`w-2 h-2 rounded-full bg-amber-600`} />
                2. Operational Workflows
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${theme.synopsisColumns.workflows.badgeClass}`}
              >
                {criticalActions.length} Open
              </span>
            </div>

            <div className="divide-y divide-amber-100/50">
              {criticalActions.map((action) => {
                const isBlocked = action.status === "Blocked" || Boolean(action.blockedReason);
                const progress = action.progressPercentage || 35;
                return (
                  <div
                    key={action.id}
                    onClick={() => onSelectAction(action)}
                    className="py-2 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-2 cursor-pointer group hover:bg-white/60 px-1 rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {action.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {action.assignedTo} · Due {action.fixedDeadline || "Month-end"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10.5px] font-semibold font-mono px-1.5 py-0.5 rounded ${
                          isBlocked ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {isBlocked ? "Blocked" : `${progress}%`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Financial & MSME Watch Synopsis */}
        {(activeTab === "all" || activeTab === "financial") && (
          <div
            className={`rounded-xl p-3.5 space-y-2.5 border shadow-2xs ${theme.synopsisColumns.financial.bg} ${theme.synopsisColumns.financial.border}`}
          >
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-rose-100/80">
              <span
                className={`font-bold flex items-center gap-1.5 ${theme.synopsisColumns.financial.titleClass}`}
              >
                <span className={`w-2 h-2 rounded-full bg-rose-600`} />
                3. Financial &amp; MSME Watch
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${theme.synopsisColumns.financial.badgeClass}`}
              >
                {financialPendencies.length} Items
              </span>
            </div>

            <div className="divide-y divide-rose-100/50">
              {financialPendencies.map((item) => {
                const isOpen = selectedFinId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFinId(isOpen ? null : item.id)}
                    className="py-2 first:pt-0.5 last:pb-0.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.deadline} · {item.status}
                        </p>
                      </div>

                      <span
                        className={`text-[10.5px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          item.urgency === "Urgent"
                            ? "bg-rose-50 text-rose-700"
                            : item.urgency === "Attention"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-slate-200/70 text-slate-700"
                        }`}
                      >
                        {item.amount.replace(" Lakhs", "L")}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-600 space-y-1">
                        <ExpandableParagraph
                          text={item.impact}
                          prefix={<strong className="text-slate-800">Impact: </strong>}
                          className="text-[11px] text-slate-600"
                        />
                        <ExpandableParagraph
                          text={item.actionRequired}
                          prefix={<strong className="text-indigo-800">Action: </strong>}
                          className="text-[11px] text-indigo-700 font-medium"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
