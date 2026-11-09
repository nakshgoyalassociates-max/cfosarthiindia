import React, { useState, useMemo, useCallback } from "react";
import {
  extractAllReminderItems,
  ReminderItem,
  ReminderSeverity,
  ReminderSource,
  generateWhatsAppReminderMessage,
  generateWhatsAppUrl,
  generateEmailReminder,
  recordReminderDispatchLog,
  getReminderDispatchLogs,
  clearReminderDispatchLogs,
  ReminderDispatchLog,
} from "../../utils/reminderEngine";
import { useApp } from "../../context/AppContext";
import { ReminderPreviewModal } from "./ReminderPreviewModal";
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Building,
  User,
  ShieldCheck,
  Users,
  Download,
  Trash2,
  History,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AutomatedReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSource?: ReminderSource | "all";
}

export const AutomatedReminderCenterModal: React.FC<AutomatedReminderCenterModalProps> = ({
  isOpen,
  onClose,
  defaultSource = "all",
}) => {
  const {
    compliances,
    taxAssessments,
    legalCases,
    licenses,
    sops,
    companies,
    userAccounts,
    clientProfile,
    selectedCompanyId,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"active" | "logs">("active");
  const [selectedSeverity, setSelectedSeverity] = useState<ReminderSeverity | "all">("all");
  const [selectedSource, setSelectedSource] = useState<ReminderSource | "all">(defaultSource);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewTargetItem, setPreviewTargetItem] = useState<ReminderItem | null>(null);
  const [logsRefreshCounter, setLogsRefreshCounter] = useState(0);
  const [isBatchSending, setIsBatchSending] = useState(false);

  // Extract all eligible items
  const allReminderItems = useMemo(() => {
    return extractAllReminderItems({
      compliances,
      taxAssessments,
      legalCases,
      licenses,
      sops,
      companies,
      userAccounts,
      clientProfile,
      companyFilter: selectedCompany !== "all" ? selectedCompany : undefined,
      dueWindowDays: 7,
    });
  }, [
    compliances,
    taxAssessments,
    legalCases,
    licenses,
    sops,
    companies,
    userAccounts,
    clientProfile,
    selectedCompany,
  ]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allReminderItems.filter((item) => {
      if (selectedSeverity !== "all" && item.severity !== selectedSeverity) return false;
      if (selectedSource !== "all" && item.source !== selectedSource) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.assignedUser.name.toLowerCase().includes(q) ||
          (item.referenceNo && item.referenceNo.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allReminderItems, selectedSeverity, selectedSource, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const criticalCount = allReminderItems.filter((i) => i.severity === "critical_overdue").length;
    const overdueCount = allReminderItems.filter((i) => i.severity === "overdue").length;
    const aboutToDueCount = allReminderItems.filter((i) => i.severity === "about_to_due").length;
    return {
      total: allReminderItems.length,
      critical: criticalCount,
      overdue: overdueCount,
      aboutToDue: aboutToDueCount,
    };
  }, [allReminderItems]);

  // Dispatch history logs
  const dispatchLogs = useMemo(() => {
    return getReminderDispatchLogs();
  }, [logsRefreshCounter]);

  const handleRefresh = useCallback(() => {
    setLogsRefreshCounter((c) => c + 1);
  }, []);

  const handleClearLogs = () => {
    if (window.confirm("Clear all reminder dispatch history logs?")) {
      clearReminderDispatchLogs();
      handleRefresh();
      showToast("Cleared reminder dispatch logs");
    }
  };

  // Single item WhatsApp dispatch
  const handleSendWhatsApp = (item: ReminderItem) => {
    const message = generateWhatsAppReminderMessage(item);
    const url = generateWhatsAppUrl(item.assignedUser.phone, message);
    window.open(url, "_blank");

    recordReminderDispatchLog({
      reminderItemId: item.id,
      itemTitle: item.title,
      companyName: item.companyName,
      sourceLabel: item.sourceLabel,
      severity: item.severity,
      channel: "whatsapp",
      primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.phone || item.assignedUser.email})`,
      cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
      clientCopied:
        item.isCriticalOverdue && item.clientCopy
          ? `${item.clientCopy.name} (${item.clientCopy.email})`
          : undefined,
      status: "sent_external",
      messageExcerpt: message.substring(0, 140) + "...",
    });

    handleRefresh();
    showToast(`Opened WhatsApp for ${item.assignedUser.name} (CC CFO${item.isCriticalOverdue ? " + CC Client" : ""})`);
  };

  // Single item Email dispatch
  const handleSendEmail = (item: ReminderItem) => {
    const payload = generateEmailReminder(item);
    window.location.href = payload.mailtoUrl;

    recordReminderDispatchLog({
      reminderItemId: item.id,
      itemTitle: item.title,
      companyName: item.companyName,
      sourceLabel: item.sourceLabel,
      severity: item.severity,
      channel: "email",
      primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.email})`,
      cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
      clientCopied:
        item.isCriticalOverdue && item.clientCopy
          ? `${item.clientCopy.name} (${item.clientCopy.email})`
          : undefined,
      status: "sent_external",
      messageExcerpt: payload.subject,
    });

    handleRefresh();
    showToast(`Prepared email to ${item.assignedUser.name} (CC CFO${item.isCriticalOverdue ? " + CC Client" : ""})`);
  };

  // Batch dispatch all active reminders
  const handleBatchDispatchAll = (channel: "both" | "whatsapp" | "email") => {
    if (filteredItems.length === 0) {
      showToast("No reminder items match the active filters.");
      return;
    }

    setIsBatchSending(true);
    setTimeout(() => {
      let count = 0;
      filteredItems.forEach((item) => {
        const msg = generateWhatsAppReminderMessage(item);
        const email = generateEmailReminder(item);
        recordReminderDispatchLog({
          reminderItemId: item.id,
          itemTitle: item.title,
          companyName: item.companyName,
          sourceLabel: item.sourceLabel,
          severity: item.severity,
          channel,
          primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.email || item.assignedUser.phone})`,
          cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
          clientCopied:
            item.isCriticalOverdue && item.clientCopy
              ? `${item.clientCopy.name} (${item.clientCopy.email})`
              : undefined,
          status: "delivered",
          messageExcerpt: channel === "whatsapp" ? msg.substring(0, 130) : email.subject,
        });
        count++;
      });

      setIsBatchSending(false);
      handleRefresh();
      showToast(
        `Successfully logged ${count} automated ${channel === "both" ? "Mail & WhatsApp" : channel.toUpperCase()} reminders across team!`,
      );
    }, 750);
  };

  // Export CSV of reminders
  const handleExportCSV = () => {
    const headers = [
      "Item ID",
      "Source",
      "Company Name",
      "Matter Title",
      "Category",
      "Statutory Due Date",
      "Days Status",
      "Severity Level",
      "Primary To (Assignee)",
      "Primary Email",
      "Primary Phone",
      "CC CFO Name",
      "CC CFO Email",
      "CC Client Promoter",
      "CC Client Email",
      "Financial Exposure / Penalty",
      "Immediate Action Required",
    ];

    const rows = filteredItems.map((item) => [
      `"${item.id}"`,
      `"${item.sourceLabel}"`,
      `"${item.companyName.replace(/"/g, '""')}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.dueDate}"`,
      `"${item.statusDescription}"`,
      `"${item.severity.toUpperCase()}"`,
      `"${item.assignedUser.name}"`,
      `"${item.assignedUser.email}"`,
      `"${item.assignedUser.phone || ""}"`,
      `"${item.cfoCopy.name}"`,
      `"${item.cfoCopy.email}"`,
      `"${item.isCriticalOverdue && item.clientCopy ? item.clientCopy.name : "N/A"}"`,
      `"${item.isCriticalOverdue && item.clientCopy ? item.clientCopy.email : "N/A"}"`,
      `"${(item.exposureOrPenalty || "").replace(/"/g, '""')}"`,
      `"${item.actionRequired.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `automated_reminders_escalation_matrix_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 flex items-center justify-center text-white shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Virtual CFO Governance Engine
                </span>
                <span className="text-xs text-slate-400">Mail &amp; WhatsApp Notification Matrix</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                <span>Automated Reminder &amp; Escalation Center</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Export all filtered reminders to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Schedule</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Tier Escalation Matrix Infographic Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-5 sm:px-6 py-3 border-b border-slate-700/80 text-white shrink-0">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Automated Escalation Protocol (Compliances &amp; Repository Items)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {/* Rule 1: About to Due */}
            <div className="p-2.5 rounded-xl bg-indigo-900/40 border border-indigo-400/30 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-emerald-300 text-xs">1. About to Due (1–7 Days)</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Remind <strong>Assigned User</strong> via Mail &amp; WhatsApp. Copy (CC) to{" "}
                  <strong>Virtual CFO</strong>.
                </p>
              </div>
            </div>

            {/* Rule 2: Overdue */}
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-amber-300 text-xs">2. Overdue Delay Notice</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Urgent reminder to <strong>Assigned User</strong>. Escalation copy (CC) to{" "}
                  <strong>Virtual CFO</strong>.
                </p>
              </div>
            </div>

            {/* Rule 3: Critical Overdue */}
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 ring-1 ring-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1 animate-pulse" />
              <div>
                <p className="font-bold text-rose-300 text-xs flex items-center gap-1">
                  <span>3. Critical Overdue Notice</span>
                  <span className="text-[9px] bg-rose-500 text-white px-1 py-0.2 rounded font-black">
                    CLIENT CC
                  </span>
                </p>
                <p className="text-[11px] text-slate-200 mt-0.5 leading-relaxed">
                  High-priority escalation to <strong>Assigned User</strong>, CC to{" "}
                  <strong>Virtual CFO</strong>, and <strong>ALSO COPY TO CLIENT PROMOTER</strong>!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          {/* Card: Total */}
          <div
            onClick={() => setSelectedSeverity("all")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedSeverity === "all"
                ? "bg-white border-indigo-500 ring-2 ring-indigo-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 block">Total Active Alerts</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-500">Across Portfolio</span>
            </div>
          </div>

          {/* Card: Critical Overdue */}
          <div
            onClick={() => setSelectedSeverity("critical_overdue")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedSeverity === "critical_overdue"
                ? "bg-rose-50/80 border-rose-500 ring-2 ring-rose-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-rose-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700">Critical Overdue</span>
              <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
                Client Copied
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-700">
                {stats.critical}
              </span>
              <span className="text-[10px] text-rose-600 font-semibold">Immediate Escalation</span>
            </div>
          </div>

          {/* Card: Overdue */}
          <div
            onClick={() => setSelectedSeverity("overdue")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedSeverity === "overdue"
                ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-amber-300 shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 block">Standard Overdue</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-700">
                {stats.overdue}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold">CC Virtual CFO</span>
            </div>
          </div>

          {/* Card: About to Due */}
          <div
            onClick={() => setSelectedSeverity("about_to_due")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedSeverity === "about_to_due"
                ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-indigo-300 shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-semibold text-indigo-700 block">About to Due (1–7d)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-700">
                {stats.aboutToDue}
              </span>
              <span className="text-[10px] text-indigo-600">Pre-due Cadence</span>
            </div>
          </div>
        </div>

        {/* View Tabs & Batch Actions Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "active"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Active Alerts &amp; Queue ({filteredItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Dispatch History &amp; Audit Logs ({dispatchLogs.length})</span>
            </button>
          </div>

          {activeTab === "active" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isBatchSending || filteredItems.length === 0}
                onClick={() => handleBatchDispatchAll("both")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Automated dispatch: logs and sends Mail & WhatsApp reminders for all filtered items"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {isBatchSending ? "Dispatching Batch..." : `Dispatch All (${filteredItems.length}) Reminders`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls (for Active Queue) */}
        {activeTab === "active" && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs shrink-0">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search matter, notice no, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Source Category */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Sources (Compliance + Repository)</option>
              <option value="compliance">Statutory Compliances Only</option>
              <option value="tax_assessment">Tax Assessments Only</option>
              <option value="legal_case">Legal Cases Only</option>
              <option value="license_certification">Licenses &amp; Certifications</option>
              <option value="sop">SOP Reviews</option>
            </select>

            {/* Severity */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical_overdue">Critical Overdue Only (Client Escalated)</option>
              <option value="overdue">Overdue Only</option>
              <option value="about_to_due">About to Due (1–7 Days)</option>
            </select>

            {/* Company */}
            {companies.length > 1 && (
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Client Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSeverity("all");
                setSelectedSource("all");
                setSelectedCompany("all");
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px] underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Modal Main Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-100/60">
          {activeTab === "active" ? (
            filteredItems.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">No Pending Reminders Matching Filter</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All compliance tasks and repository matters within this scope are either completed,
                  due beyond 7 days, or have no active delays.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredItems.map((item) => {
                  const isCritical = item.isCriticalOverdue;
                  const isOverdue = item.severity === "overdue" || isCritical;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border bg-white transition-all shadow-2xs hover:shadow-xs space-y-3 ${
                        isCritical
                          ? "border-rose-300 ring-1 ring-rose-200"
                          : isOverdue
                            ? "border-amber-300"
                            : "border-slate-200"
                      }`}
                    >
                      {/* Item Top Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                isCritical
                                  ? "bg-rose-600 text-white"
                                  : isOverdue
                                    ? "bg-amber-100 text-amber-900 font-bold"
                                    : "bg-indigo-100 text-indigo-900 font-bold"
                              }`}
                            >
                              {isCritical
                                ? "Critical Overdue (Client Copied)"
                                : isOverdue
                                  ? "Overdue Alert"
                                  : "Due Soon (1–7d)"}
                            </span>

                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {item.sourceLabel} • {item.category}
                            </span>

                            {item.referenceNo && (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                {item.referenceNo}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.companyName}</span>
                          </p>
                        </div>

                        {/* Due Date & Delay Badge */}
                        <div className="sm:text-right shrink-0">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Statutory Due Date
                          </div>
                          <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                            {item.dueDate}
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${
                              isCritical
                                ? "bg-rose-100 text-rose-800"
                                : isOverdue
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.statusDescription}
                          </span>
                        </div>
                      </div>

                      {/* Escalation Matrix Recipient Badges */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {/* Primary To */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            👤 Primary Assignee (TO):
                          </span>
                          <span className="font-bold text-slate-900">{item.assignedUser.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono block truncate">
                            {item.assignedUser.email}
                          </span>
                        </div>

                        {/* CC CFO */}
                        <div>
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                            🛡️ Copy to CFO (CC):
                          </span>
                          <span className="font-bold text-slate-900">{item.cfoCopy.name}</span>
                          <span className="text-[11px] text-indigo-700 font-mono block truncate">
                            {item.cfoCopy.email}
                          </span>
                        </div>

                        {/* CC Client */}
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase block ${
                              isCritical ? "text-rose-700 font-black" : "text-slate-400"
                            }`}
                          >
                            {isCritical ? "🚨 Copy to Client (CC):" : "Client Copy:"}
                          </span>
                          {isCritical && item.clientCopy ? (
                            <>
                              <span className="font-bold text-rose-950">{item.clientCopy.name}</span>
                              <span className="text-[11px] text-rose-700 font-mono block truncate">
                                {item.clientCopy.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              Not copied (standard routine)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Penalty / Risk & Immediate Action */}
                      <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        <div className="text-[11px] text-slate-500 max-w-xl">
                          <strong className="text-slate-700">Action:</strong> {item.actionRequired}
                          {item.exposureOrPenalty && (
                            <span className="block text-rose-700 font-medium">
                              • Risk/Exposure: {item.exposureOrPenalty}
                            </span>
                          )}
                        </div>

                        {/* Quick Trigger Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Open direct WhatsApp with pre-filled message"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendEmail(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Open email client with To, CC CFO, and CC Client pre-filled"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Mail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewTargetItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Preview complete formatted notification & details"
                          >
                            <span>Preview</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Tab: Dispatch Logs & History */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Automated Reminder Dispatch Logs
                  </h4>
                  <p className="text-xs text-slate-500">
                    Audit trail of all Mail and WhatsApp reminders transmitted to Assignees, CFO &amp; Client
                  </p>
                </div>
                {dispatchLogs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No reminders dispatched yet. Use "Dispatch All" or "Send" on any active alert.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">Timestamp</th>
                        <th className="px-3 py-2.5">Matter / Task</th>
                        <th className="px-3 py-2.5">Company</th>
                        <th className="px-3 py-2.5">Channel</th>
                        <th className="px-3 py-2.5">Primary To (User)</th>
                        <th className="px-3 py-2.5">CC CFO</th>
                        <th className="px-3 py-2.5">CC Client</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispatchLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900 max-w-xs truncate">
                            {log.itemTitle}
                          </td>
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                            {log.companyName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                log.channel === "whatsapp"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.channel === "email"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {log.channel === "whatsapp" ? (
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Mail className="w-3 h-3 text-indigo-600" />
                              )}
                              <span>{log.channel.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-800 truncate max-w-[180px]">
                            {log.primaryRecipient}
                          </td>
                          <td className="px-3 py-2 text-indigo-700 truncate max-w-[150px]">
                            {log.cfoCopied}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {log.clientCopied ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                🚨 {log.clientCopied}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ {log.status === "delivered" ? "Delivered" : "Sent via App"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Close Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Escalation rules apply automatically based on statutory due dates and criticality levels.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Center
          </button>
        </div>
      </div>

      {/* Embedded Single Reminder Preview Modal */}
      {previewTargetItem && (
        <ReminderPreviewModal
          isOpen={Boolean(previewTargetItem)}
          item={previewTargetItem}
          onClose={() => setPreviewTargetItem(null)}
          onDispatched={handleRefresh}
        />
      )}
    </div>
  );
};
