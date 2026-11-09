import React, { useState } from "react";
import { FundFlowData, ClientProfile } from "../../types";
import { formatINR } from "../../utils/format";
import {
  ArrowRightLeft,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Download,
  Info,
} from "lucide-react";

interface FundFlowViewProps {
  fundFlow: FundFlowData;
  clientProfile: ClientProfile;
}

export const FundFlowView: React.FC<FundFlowViewProps> = ({ fundFlow, clientProfile }) => {
  const [showInLakhs, setShowInLakhs] = useState(true);

  const formatAmount = (amt: number): string => {
    return formatINR(amt, showInLakhs);
  };

  const { sources, applications, workingCapitalSchedule: wcs } = fundFlow;
  const isBalanced = sources.totalSources === applications.totalApplications;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Fund Flow Statement & Working Capital Analysis</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
                    Cash & Funds Movement
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {clientProfile.companyName} • Period: {fundFlow.period}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Balance Check Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                isBalanced
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Funds Balanced: {formatAmount(sources.totalSources)}</span>
            </div>

            {/* Display Units Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setShowInLakhs(true)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  showInLakhs
                    ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Lakhs / Crores
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
          </div>
        </div>

        {/* 3 Fund Movement Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block font-medium">Opening Cash & Bank Balance</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-slate-900 font-mono">
                {formatAmount(fundFlow.openingCashAndBank)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Liquid funds at period start</p>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block font-medium">Net Increase in Liquid Funds</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-emerald-900 font-mono">
                +{formatAmount(fundFlow.netMovementOfFunds)}
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> Positive Flow
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Operating and treasury surplus</p>
          </div>

          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200">
            <span className="text-indigo-800 block font-medium">Closing Cash & Bank Balance</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-indigo-900 font-mono">
                {formatAmount(fundFlow.closingCashAndBank)}
              </span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Liquid treasury as of period close
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Fund Flow: SOURCES vs APPLICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* SOURCES OF FUNDS */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Sources of Funds (Inflows)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-300">
              {formatAmount(sources.totalSources)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  1. Funds from Operations (FFO)
                </strong>
                <span className="text-[11px] text-slate-400">
                  Net Profit (₹8.65L) + Non-Cash D&A & Tax Provisions
                </span>
              </div>
              <span className="font-mono text-slate-900 font-bold">
                {formatAmount(sources.fundsFromOperations)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  2. Long-Term Borrowings Raised
                </strong>
                <span className="text-[11px] text-slate-400">
                  HDFC Bank Term Loan Tranche for GPU Hardware
                </span>
              </div>
              <span className="font-mono text-slate-900">
                {formatAmount(sources.longTermBorrowingsRaised)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  3. Issue of Share Capital / Equity
                </strong>
                <span className="text-[11px] text-slate-400">
                  No equity dilution in current period
                </span>
              </div>
              <span className="font-mono text-slate-400">
                {sources.issueOfShareCapital > 0 ? formatAmount(sources.issueOfShareCapital) : "—"}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  4. Sale / Disposal of Fixed Assets
                </strong>
                <span className="text-[11px] text-slate-400">Zero asset disposals</span>
              </div>
              <span className="font-mono text-slate-400">
                {sources.saleOfFixedAssets > 0 ? formatAmount(sources.saleOfFixedAssets) : "—"}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  5. Decrease in Working Capital
                </strong>
                <span className="text-[11px] text-slate-400">
                  Not applicable (Working Capital increased)
                </span>
              </div>
              <span className="font-mono text-slate-400">—</span>
            </div>

            {/* Total Sources Footer */}
            <div className="p-4 bg-emerald-50/60 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-emerald-300">
              <span className="text-sm">TOTAL SOURCES OF FUNDS</span>
              <span className="font-mono text-base text-emerald-950">
                {formatAmount(sources.totalSources)}
              </span>
            </div>
          </div>
        </div>

        {/* APPLICATIONS OF FUNDS */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Applications of Funds (Outflows)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-300">
              {formatAmount(applications.totalApplications)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  1. Purchase of Fixed Assets (Capex)
                </strong>
                <span className="text-[11px] text-slate-400">
                  MacBook M3 Hardware & Network Firewalls
                </span>
              </div>
              <span className="font-mono text-slate-900">
                {formatAmount(applications.purchaseOfFixedAssets)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  2. Repayment of Long-Term Borrowings
                </strong>
                <span className="text-[11px] text-slate-400">
                  Monthly Term Loan Principal Amortization
                </span>
              </div>
              <span className="font-mono text-slate-900">
                {formatAmount(applications.repaymentOfLongTermBorrowings)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  3. Payment of Corporate Advance Tax
                </strong>
                <span className="text-[11px] text-slate-400">Discharged on 15th Sep</span>
              </div>
              <span className="font-mono text-slate-900">
                {formatAmount(applications.paymentOfTaxAndAdvanceTax)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
              <div>
                <strong className="text-slate-900 block font-semibold">
                  4. Payment of Dividends / Drawings
                </strong>
                <span className="text-[11px] text-slate-400">
                  Nil (Profits retained in reserves)
                </span>
              </div>
              <span className="font-mono text-slate-400">—</span>
            </div>

            <div className="p-3.5 flex items-center justify-between bg-indigo-50/40 font-bold text-indigo-900">
              <div>
                <strong className="block">5. Increase in Working Capital (Surplus Absorbed)</strong>
                <span className="text-[11px] text-indigo-600 font-normal">
                  Reconciled with Schedule of Working Capital
                </span>
              </div>
              <span className="font-mono">
                {formatAmount(applications.increaseInWorkingCapital || 0)}
              </span>
            </div>

            {/* Total Applications Footer */}
            <div className="p-4 bg-indigo-50/60 flex items-center justify-between font-extrabold text-slate-900 border-t-2 border-indigo-300">
              <span className="text-sm">TOTAL APPLICATIONS OF FUNDS</span>
              <span className="font-mono text-base text-indigo-950">
                {formatAmount(applications.totalApplications)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE OF CHANGES IN WORKING CAPITAL */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Schedule of Changes in Working Capital
            </h3>
            <p className="text-xs text-slate-400">
              Comparative Analysis of Current Assets and Current Liabilities
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded">
            Net Change: +{formatAmount(wcs.netChangeInWorkingCapital)} ({wcs.netChangeType})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/3">Balance Sheet Line Item</th>
                <th className="py-3 px-3 text-center">Category</th>
                <th className="py-3 px-3 text-right">Previous Period</th>
                <th className="py-3 px-3 text-right">Current Period</th>
                <th className="py-3 px-3 text-right">Effect on Working Capital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wcs.items.map((it) => {
                const isIncrease = it.effect.includes("Increase");
                return (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{it.particulars}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          it.category === "Current Asset"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {it.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatAmount(it.previousPeriod)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                      {formatAmount(it.currentPeriod)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span
                        className={`font-semibold ${isIncrease ? "text-emerald-700" : "text-rose-600"}`}
                      >
                        {isIncrease ? "+" : ""}
                        {formatAmount(it.effectAmount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <td colSpan={2} className="py-3 px-4">
                  Working Capital (Current Assets - Current Liabilities)
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatAmount(wcs.workingCapitalPrevious)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-indigo-900">
                  {formatAmount(wcs.workingCapitalCurrent)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm">
                  +{formatAmount(wcs.netChangeInWorkingCapital)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
