import React, { useState } from "react";
import { DebtorAgeingData, DebtorRecord, ClientProfile } from "../../types";
import { formatINR } from "../../utils/format";
import {
  Building,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  PhoneCall,
  Mail,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  MessageSquare,
  FileCheck,
  UserCheck,
  Plus,
  X,
  Send,
  Trash2,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface DebtorAgeingViewProps {
  debtorAgeing: DebtorAgeingData;
  clientProfile: ClientProfile;
  onOpenModifyModal?: (tab?: string) => void;
}

export const DebtorAgeingView: React.FC<DebtorAgeingViewProps> = ({
  debtorAgeing,
  clientProfile,
  onOpenModifyModal,
}) => {
  const { updateFinancialMIS, financialMIS, showToast, addAuditLog, role } = useApp();
  const [selectedBucket, setSelectedBucket] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDebtorForNote, setActiveDebtorForNote] = useState<DebtorRecord | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [newStatus, setNewStatus] = useState<DebtorRecord["status"]>("Reminder Sent");
  const [records, setRecords] = useState<DebtorRecord[]>(debtorAgeing.topDebtors || []);
  const [showInLakhs, setShowInLakhs] = useState(true);

  React.useEffect(() => {
    if (debtorAgeing.topDebtors) {
      setRecords(debtorAgeing.topDebtors);
    }
  }, [debtorAgeing.topDebtors]);

  const formatAmount = (amt: number): string => {
    return formatINR(amt, showInLakhs);
  };

  const { buckets } = debtorAgeing;

  // Filter records
  const filteredRecords = records.filter((item) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName.toLowerCase().includes(q);
      const matchGstin = item.gstin?.toLowerCase().includes(q);
      const matchManager = item.assignedManager?.toLowerCase().includes(q);
      if (!matchName && !matchGstin && !matchManager) return false;
    }

    // Risk filter
    if (selectedRisk !== "all" && item.riskRating !== selectedRisk) {
      return false;
    }

    // Bucket filter
    if (selectedBucket === "0-30" && item.bucket0to30 === 0) return false;
    if (selectedBucket === "31-60" && item.bucket31to60 === 0) return false;
    if (selectedBucket === "61-90" && item.bucket61to90 === 0) return false;
    if (selectedBucket === "91-180" && item.bucket91to180 === 0) return false;
    if (selectedBucket === "above180" && item.bucketAbove180 === 0) return false;

    return true;
  });

  const handleDeleteDebtorRow = (id: string, name: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    const newTotal = updated.reduce((acc, d) => acc + d.totalOutstanding, 0);

    updateFinancialMIS({
      totalDebtors: newTotal,
      debtorAgeing: {
        ...debtorAgeing,
        totalReceivables: newTotal,
        topDebtors: updated,
      },
    });

    addAuditLog(
      "MIS_METRIC_UPDATE",
      `Deleted debtor account "${name}" from company receivables ledger`,
    );
    showToast(`Deleted debtor "${name}". Total receivables updated.`);
  };

  const handleClearAllDebtors = () => {
    if (!window.confirm(`Clear all ${records.length} debtor customer accounts for ${clientProfile.companyName}?`)) {
      return;
    }
    setRecords([]);
    updateFinancialMIS({
      totalDebtors: 0,
      debtorsOver90Days: 0,
      debtorAgeing: {
        ...debtorAgeing,
        totalReceivables: 0,
        daysSalesOutstanding: 0,
        overduePercentage: 0,
        provisionForBadDebts: 0,
        topDebtors: [],
        buckets: {
          days0to30: { amount: 0, percentage: 0, count: 0 },
          days31to60: { amount: 0, percentage: 0, count: 0 },
          days61to90: { amount: 0, percentage: 0, count: 0 },
          days91to180: { amount: 0, percentage: 0, count: 0 },
          daysAbove180: { amount: 0, percentage: 0, count: 0 },
        },
      },
    });
    addAuditLog("MIS_METRIC_UPDATE", `Cleared all debtor records for ${clientProfile.companyName}`);
    showToast("Cleared all customer debtor accounts.");
  };

  const handleSaveNote = () => {
    if (!activeDebtorForNote) return;
    const updated = records.map((rec) => {
      if (rec.id === activeDebtorForNote.id) {
        return {
          ...rec,
          status: newStatus,
          followUpNotes: newNoteText
            ? `${newNoteText} (Updated by ${clientProfile.cfoName} on ${new Date().toLocaleDateString("en-IN")})`
            : rec.followUpNotes,
        };
      }
      return rec;
    });
    setRecords(updated);
    updateFinancialMIS({
      debtorAgeing: {
        ...debtorAgeing,
        topDebtors: updated,
      },
    });
    setActiveDebtorForNote(null);
    setNewNoteText("");
    showToast(`Updated follow-up status for ${activeDebtorForNote.customerName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Executive Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Building className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Debtor Ageing & Receivables Radar</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    DSO: {debtorAgeing.daysSalesOutstanding} Days
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {clientProfile.companyName} • As of {debtorAgeing.asOfDate} • Total Trade
                  Receivables: {formatAmount(debtorAgeing.totalReceivables)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setShowInLakhs(true)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  showInLakhs
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Lakhs (₹)
              </button>
              <button
                onClick={() => setShowInLakhs(false)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  !showInLakhs
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Exact Rupees (₹)
              </button>
            </div>

            {onOpenModifyModal && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenModifyModal("debtors")}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Modify debtor list or add new customers"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Modify Debtors</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModifyModal("debtors")}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Add a new customer debtor record"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Debtor</span>
                </button>
              </>
            )}

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllDebtors}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Clear all debtor records"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Macro Ageing Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">Total Trade Receivables</span>
            <div className="mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatAmount(debtorAgeing.totalReceivables)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Across 48 customer ledgers</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">Days Sales Outstanding (DSO)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-indigo-700 font-mono">
                {debtorAgeing.daysSalesOutstanding} Days
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                Industry Benchmark &lt; 45d
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-amber-800 block font-medium">Overdue &gt; 60 Days</span>
            <div className="mt-0.5">
              <span className="text-base font-bold text-amber-900 font-mono">
                {formatAmount(
                  buckets.days61to90.amount +
                    buckets.days91to180.amount +
                    buckets.daysAbove180.amount,
                )}
              </span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {debtorAgeing.overduePercentage}% of book requiring recovery
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
            <span className="text-rose-800 block font-medium">ECL Doubtful Debts Provision</span>
            <div className="mt-0.5">
              <span className="text-base font-bold text-rose-900 font-mono">
                {formatAmount(debtorAgeing.provisionForBadDebts)}
              </span>
              <p className="text-[11px] text-rose-700 mt-0.5">Ind AS 109 Expected Loss</p>
            </div>
          </div>
        </div>

        {/* Interactive Ageing Distribution Stack */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Receivables Ageing Buckets (Click to Filter):
            </span>
            <span className="text-slate-400 text-[11px]">100% of Ledger Balances</span>
          </div>

          <div className="h-4 rounded-xl bg-slate-100 flex overflow-hidden border border-slate-200">
            <div
              style={{ width: `${buckets.days0to30.percentage}%` }}
              className="bg-emerald-500 hover:opacity-90 transition-opacity cursor-pointer"
              title={`0-30 Days: ${formatAmount(buckets.days0to30.amount)} (${buckets.days0to30.percentage}%)`}
              onClick={() => setSelectedBucket(selectedBucket === "0-30" ? "all" : "0-30")}
            />
            <div
              style={{ width: `${buckets.days31to60.percentage}%` }}
              className="bg-sky-500 hover:opacity-90 transition-opacity cursor-pointer"
              title={`31-60 Days: ${formatAmount(buckets.days31to60.amount)} (${buckets.days31to60.percentage}%)`}
              onClick={() => setSelectedBucket(selectedBucket === "31-60" ? "all" : "31-60")}
            />
            <div
              style={{ width: `${buckets.days61to90.percentage}%` }}
              className="bg-amber-500 hover:opacity-90 transition-opacity cursor-pointer"
              title={`61-90 Days: ${formatAmount(buckets.days61to90.amount)} (${buckets.days61to90.percentage}%)`}
              onClick={() => setSelectedBucket(selectedBucket === "61-90" ? "all" : "61-90")}
            />
            <div
              style={{ width: `${buckets.days91to180.percentage}%` }}
              className="bg-orange-500 hover:opacity-90 transition-opacity cursor-pointer"
              title={`91-180 Days: ${formatAmount(buckets.days91to180.amount)} (${buckets.days91to180.percentage}%)`}
              onClick={() => setSelectedBucket(selectedBucket === "91-180" ? "all" : "91-180")}
            />
            <div
              style={{ width: `${buckets.daysAbove180.percentage}%` }}
              className="bg-rose-500 hover:opacity-90 transition-opacity cursor-pointer"
              title={`>180 Days: ${formatAmount(buckets.daysAbove180.amount)} (${buckets.daysAbove180.percentage}%)`}
              onClick={() => setSelectedBucket(selectedBucket === "above180" ? "all" : "above180")}
            />
          </div>

          {/* Bucket Legend with Clickable Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            <button
              onClick={() => setSelectedBucket(selectedBucket === "0-30" ? "all" : "0-30")}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                selectedBucket === "0-30"
                  ? "bg-emerald-50 border-emerald-400 font-bold"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-700 font-medium">0 - 30 Days</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-1">
                {formatAmount(buckets.days0to30.amount)}
              </p>
              <span className="text-[10px] text-slate-500">
                {buckets.days0to30.percentage}% • {buckets.days0to30.count} parties
              </span>
            </button>

            <button
              onClick={() => setSelectedBucket(selectedBucket === "31-60" ? "all" : "31-60")}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                selectedBucket === "31-60"
                  ? "bg-sky-50 border-sky-400 font-bold"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <span className="text-slate-700 font-medium">31 - 60 Days</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-1">
                {formatAmount(buckets.days31to60.amount)}
              </p>
              <span className="text-[10px] text-slate-500">
                {buckets.days31to60.percentage}% • {buckets.days31to60.count} parties
              </span>
            </button>

            <button
              onClick={() => setSelectedBucket(selectedBucket === "61-90" ? "all" : "61-90")}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                selectedBucket === "61-90"
                  ? "bg-amber-50 border-amber-400 font-bold"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-700 font-medium">61 - 90 Days</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-1">
                {formatAmount(buckets.days61to90.amount)}
              </p>
              <span className="text-[10px] text-slate-500">
                {buckets.days61to90.percentage}% • {buckets.days61to90.count} parties
              </span>
            </button>

            <button
              onClick={() => setSelectedBucket(selectedBucket === "91-180" ? "all" : "91-180")}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                selectedBucket === "91-180"
                  ? "bg-orange-50 border-orange-400 font-bold"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="text-slate-700 font-medium">91 - 180 Days</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-1">
                {formatAmount(buckets.days91to180.amount)}
              </p>
              <span className="text-[10px] text-slate-500">
                {buckets.days91to180.percentage}% • {buckets.days91to180.count} parties
              </span>
            </button>

            <button
              onClick={() => setSelectedBucket(selectedBucket === "above180" ? "all" : "above180")}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                selectedBucket === "above180"
                  ? "bg-rose-50 border-rose-400 font-bold"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-700 font-medium">&gt; 180 Days</span>
              </div>
              <p className="font-mono font-bold text-slate-900 mt-1">
                {formatAmount(buckets.daysAbove180.amount)}
              </p>
              <span className="text-[10px] text-slate-500">
                {buckets.daysAbove180.percentage}% • {buckets.daysAbove180.count} parties
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debtor name, GSTIN, or collection manager..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk / Overdue</option>
            </select>
          </div>

          {(selectedBucket !== "all" || selectedRisk !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBucket("all");
                setSelectedRisk("all");
                setSearchQuery("");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Detailed Customer Debtors Ageing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wide uppercase">
            Customer-Wise Debtor Ageing & Recovery Schedule
          </h3>
          <span className="text-xs text-slate-300 font-mono">
            Showing {filteredRecords.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-1.5 px-3">Debtor / Customer Entity</th>
                <th className="py-1.5 px-2.5 text-right">Total Due</th>
                <th className="py-1.5 px-2 text-right">0-30d</th>
                <th className="py-1.5 px-2 text-right">31-60d</th>
                <th className="py-1.5 px-2 text-right">61-90d</th>
                <th className="py-1.5 px-2 text-right">91-180d</th>
                <th className="py-1.5 px-2 text-right">&gt;180d</th>
                <th className="py-1.5 px-2 text-center">DSO</th>
                <th className="py-1.5 px-2 text-center">Risk</th>
                <th className="py-1.5 px-2.5">Follow-up & Remarks</th>
                <th className="py-1.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((deb) => {
                let riskBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                if (deb.riskRating === "Medium")
                  riskBadge = "bg-amber-50 text-amber-800 border-amber-200";
                else if (deb.riskRating === "High")
                  riskBadge = "bg-rose-50 text-rose-800 border-rose-200 font-bold";

                return (
                  <tr key={deb.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-slate-900 font-semibold text-xs truncate max-w-[200px]"
                          title={deb.customerName}
                        >
                          {deb.customerName}
                        </span>
                        <span
                          className="text-[10px] text-slate-400 font-mono"
                          title={`Terms: ${deb.creditPeriodDays}d | Mgr: ${deb.assignedManager} | GSTIN: ${deb.gstin || "N/A"}`}
                        >
                          ({deb.creditPeriodDays}d)
                        </span>
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatAmount(deb.totalOutstanding)}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {deb.bucket0to30 > 0 ? formatAmount(deb.bucket0to30) : "—"}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {deb.bucket31to60 > 0 ? (
                        <span className="text-sky-700 font-medium">
                          {formatAmount(deb.bucket31to60)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {deb.bucket61to90 > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          {formatAmount(deb.bucket61to90)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {deb.bucket91to180 > 0 ? (
                        <span className="text-orange-700 font-bold">
                          {formatAmount(deb.bucket91to180)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {deb.bucketAbove180 > 0 ? (
                        <span className="text-rose-700 font-extrabold">
                          {formatAmount(deb.bucketAbove180)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-1.5 px-2 text-center font-mono text-slate-700 tabular-nums text-[11px] whitespace-nowrap">
                      {deb.dsoDays}d
                    </td>

                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] border ${riskBadge}`}>
                        {deb.riskRating}
                      </span>
                    </td>

                    <td className="py-1.5 px-2.5 text-slate-600 max-w-[200px] truncate">
                      <span
                        className="text-[10.5px] text-slate-700"
                        title={`${deb.status}: ${deb.followUpNotes || "No notes"}`}
                      >
                        <strong className="text-slate-800">{deb.status}</strong>
                        {deb.followUpNotes ? ` — ${deb.followUpNotes}` : ""}
                      </span>
                    </td>

                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveDebtorForNote(deb);
                            setNewStatus(deb.status);
                            setNewNoteText("");
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer border border-indigo-200 transition-colors"
                        >
                          Follow-up
                        </button>
                        <button
                          onClick={() => handleDeleteDebtorRow(deb.id, deb.customerName)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title={`Delete ${deb.customerName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Note Modal */}
      {activeDebtorForNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Record Debtor Follow-up & Action
                </h3>
                <p className="text-xs text-slate-500">{activeDebtorForNote.customerName}</p>
              </div>
              <button
                onClick={() => setActiveDebtorForNote(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Outstanding</label>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-slate-900 font-bold">
                  {formatAmount(activeDebtorForNote.totalOutstanding)} (DSO:{" "}
                  {activeDebtorForNote.dsoDays} days)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DebtorRecord["status"])}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Current">Current / Not Due</option>
                  <option value="Reminder Sent">Reminder Sent (Email/Call)</option>
                  <option value="Promise to Pay">Promise to Pay (PTP)</option>
                  <option value="Escalated to CFO">Escalated to CFO</option>
                  <option value="Legal Notice">Legal Notice under Sec 138/IBC</option>
                  <option value="Audit Confirmation Reconciled">
                    Audit Confirmation Reconciled
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Add Note / Remarks
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="e.g. Spoke with client accounts head. Cheque promised by 22nd Sep..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveDebtorForNote(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Follow-up</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
