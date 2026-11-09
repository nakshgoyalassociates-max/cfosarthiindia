import React, { useState, useEffect } from "react";
import {
  Database,
  Copy,
  Check,
  Download,
  ExternalLink,
  X,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  CalendarClock,
  Layers,
  HelpCircle,
  AlertTriangle,
  Table,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedComplianceSql, setCopiedComplianceSql] = useState(false);
  const [copiedAlterSql, setCopiedAlterSql] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>("");
  const [complianceSqlContent, setComplianceSqlContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "compliance_fix" | "sql_preview">("compliance_fix");

  const migrationFilePath = "supabase/migrations/20261105000000_schema_and_dummy_data_migration.sql";
  const migrationPublicUrl = "/migrations/20261105000000_schema_and_dummy_data_migration.sql";
  const complianceSqlPublicUrl = "/migrations/20261107000000_compliance_master_table.sql";

  const alterTableSqlSnippet = `-- Run this in Supabase SQL Editor if importing CSV into your existing table:
ALTER TABLE IF EXISTS public.compliance_items
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS compliance_name text,
  ADD COLUMN IF NOT EXISTS act_or_law text DEFAULT '',
  ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS statutory_due_date_rule text DEFAULT '',
  ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'Return',
  ADD COLUMN IF NOT EXISTS applicability text DEFAULT '',
  ADD COLUMN IF NOT EXISTS penalty_clause text DEFAULT '',
  ADD COLUMN IF NOT EXISTS governing_portal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_1_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_2_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_3_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE IF EXISTS public.compliances
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS compliance_name text,
  ADD COLUMN IF NOT EXISTS act_or_law text DEFAULT '',
  ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS statutory_due_date_rule text DEFAULT '',
  ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'Return',
  ADD COLUMN IF NOT EXISTS applicability text DEFAULT '',
  ADD COLUMN IF NOT EXISTS penalty_clause text DEFAULT '',
  ADD COLUMN IF NOT EXISTS governing_portal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_1_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_2_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_3_task text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`;

  useEffect(() => {
    if (isOpen) {
      if (!sqlContent) {
        setLoading(true);
        fetch(migrationPublicUrl)
          .then((res) => (res.ok ? res.text() : ""))
          .then((text) => {
            setSqlContent(text);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
      if (!complianceSqlContent) {
        fetch(complianceSqlPublicUrl)
          .then((res) => (res.ok ? res.text() : ""))
          .then((text) => setComplianceSqlContent(text))
          .catch(() => {});
      }
    }
  }, [isOpen, sqlContent, complianceSqlContent]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const text = sqlContent || (await (await fetch(migrationPublicUrl)).text());
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyComplianceSql = async () => {
    try {
      const text = complianceSqlContent || (await (await fetch(complianceSqlPublicUrl)).text());
      await navigator.clipboard.writeText(text);
      setCopiedComplianceSql(true);
      setTimeout(() => setCopiedComplianceSql(false), 2500);
    } catch (err) {
      console.error("Failed to copy compliance SQL:", err);
    }
  };

  const handleCopyAlterSql = async () => {
    try {
      await navigator.clipboard.writeText(alterTableSqlSnippet);
      setCopiedAlterSql(true);
      setTimeout(() => setCopiedAlterSql(false), 2500);
    } catch (err) {
      console.error("Failed to copy ALTER SQL:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 border border-indigo-400/40 flex items-center justify-center text-white shadow-inner">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Supabase Database &amp; Data Migration
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ready · 254 Records
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">
                {migrationFilePath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyComplianceSql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
              title="Copy 1-click SQL that creates compliance_master and seeds all 35 records directly into Supabase without CSV header errors"
            >
              {copiedComplianceSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Copied Compliance SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Compliance SQL Seed</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied Full SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Migration SQL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("compliance_fix")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "compliance_fix"
                  ? "bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              CSV Header Fix &amp; Compliance Options
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-indigo-900 border border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Migration Overview &amp; Instructions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sql_preview")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "sql_preview"
                  ? "bg-white text-indigo-900 border border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Full SQL Script Preview
            </button>
          </div>

          <a
            href={migrationPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Open raw .sql in new tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "compliance_fix" ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Dual CSV Download Cards Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        CSV Exports for Supabase Table Editor
                      </h4>
                      <p className="text-xs text-slate-400">
                        Two separate CSV files ready to import directly into your respective Supabase tables:
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready for Supabase Import
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* File 1: Master CSV */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 font-mono text-xs">
                          compliance_master.csv
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          35 Rows · 15 Columns
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Statutory compliance rules (GST, TDS, Income Tax, ROC/MCA, PF/ESI, PT). Not company-specific.
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Target table: <strong className="text-slate-300">public.compliance_master</strong>
                      </p>
                    </div>
                    <a
                      href="/exports/compliance_master.csv"
                      download="compliance_master.csv"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download compliance_master.csv</span>
                    </a>
                  </div>

                  {/* File 2: Active Items CSV */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400 font-mono text-xs">
                          compliance_items.csv
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          105 Rows · 3 Companies
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Active company compliance items with deadlines, assigned owners, subtasks &amp; ARNs (Nexora, Apex, Zenith).
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Target table: <strong className="text-slate-300">public.compliance_items</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="/exports/compliance_items.csv"
                        download="compliance_items.csv"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download compliance_items.csv</span>
                      </a>
                      <a
                        href="/exports/compliance_items_core.csv"
                        download="compliance_items_core.csv"
                        className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-all cursor-pointer border border-slate-700"
                        title="Minimal 5-column version (id, company_id, category, status, data)"
                      >
                        5-Col Core
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How to Import Each File in Supabase Table Editor</span>
                </div>
                <p className="text-amber-900 text-xs leading-relaxed">
                  • Import <strong className="font-mono">compliance_master.csv</strong> into <strong className="font-mono">compliance_master</strong>.<br />
                  • Import <strong className="font-mono">compliance_items.csv</strong> into <strong className="font-mono">compliance_items</strong>.
                </p>
              </div>

              {/* Solution 1: 1-Click SQL Seed (Fastest & Zero Errors) */}
              <div className="border-2 border-emerald-500/60 bg-emerald-50/40 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <span>Method 1 (Recommended): Run 1-Click SQL Seed</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-emerald-900">
                        Zero CSV Errors · Instant
                      </span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyComplianceSql}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
                    >
                      {copiedComplianceSql ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied SQL Seed!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Compliance SQL Seed</span>
                        </>
                      )}
                    </button>
                    <a
                      href="/migrations/20261107000000_compliance_master_table.sql"
                      download="20261107000000_compliance_master_table.sql"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .sql</span>
                    </a>
                  </div>
                </div>

                <p className="text-xs text-emerald-900 leading-relaxed">
                  Simply open <strong>Supabase SQL Editor &gt; New Query</strong>, paste this script, and click <strong>Run</strong>.
                  It creates <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">public.compliance_master</code> and seeds all 35 statutory Indian compliance items (GST, TDS/TCS, Income Tax, ROC, PF, ESI, PT) directly into Supabase without needing any spreadsheet upload.
                </p>
              </div>

              {/* Solution 2: Add Missing Columns to Existing Table */}
              <div className="border border-indigo-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Method 2: If Importing into Your Existing Table
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAlterSql}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer"
                    >
                      {copiedAlterSql ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied ALTER SQL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy ALTER TABLE SQL</span>
                        </>
                      )}
                    </button>
                    <a
                      href="/exports/compliance_items_table_format.csv"
                      download="compliance_items_table_format.csv"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all cursor-pointer"
                      title="CSV with id, company_id, category, status, data headers matching compliance_items"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Table-Format CSV</span>
                    </a>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  If you want to keep importing into your existing{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">
                    compliance_items
                  </code>{" "}
                  table:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="font-bold text-slate-800">Option A: Add Missing Columns</span>
                    <p className="text-slate-500 text-[11px]">
                      Copy and run the ALTER TABLE SQL above in Supabase SQL Editor. It adds the 14 columns to your table so your 15-column master CSV imports with zero header errors.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="font-bold text-slate-800">Option B: Use Table-Format CSV</span>
                    <p className="text-slate-500 text-[11px]">
                      Download the Table-Format CSV above, which already has the exact 5 headers (
                      <code className="font-mono">id, company_id, category, status, data</code>) of your current table.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solution 3: Create NEW Table via Table Editor Spreadsheet Import */}
              <div className="border border-slate-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Method 3: Create a NEW Table from Spreadsheet in Table Editor
                    </h4>
                  </div>

                  <a
                    href="/exports/general_statutory_compliance_master.csv"
                    download="general_statutory_compliance_master.csv"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Master CSV (15 Columns)</span>
                  </a>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5">
                  <p>In Supabase Studio (Table Editor):</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
                    <li>
                      Do <strong>NOT</strong> open an existing table. In the left Table Editor sidebar, click the green <strong>+ New table</strong> button.
                    </li>
                    <li>
                      In the right sliding panel, turn ON <strong>&quot;Import data via spreadsheet&quot;</strong> (or CSV).
                    </li>
                    <li>
                      Drop <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">general_statutory_compliance_master.csv</code>.
                    </li>
                    <li>
                      Name the table <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">compliance_master</code> and click <strong>Save</strong>. Supabase will automatically create all 15 columns!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          ) : activeTab === "overview" ? (
            <>
              {/* How to Open and Execute Card */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>How to Open &amp; Execute This Migration</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Copy or Download</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Click <strong>Copy SQL</strong> at the top right, or click{" "}
                      <strong>Download</strong> to save the file locally to open in VS Code, Cursor, or Notepad.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Open Supabase SQL Editor</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Go to your Supabase Dashboard (<span className="font-mono text-[10px]">project_id: dbxkcksjvnpwhsgsduzd</span>) and navigate to <strong>SQL Editor &gt; New Query</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                        3
                      </span>
                      <span>Paste &amp; Run</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Paste the SQL script and hit <strong>Run</strong>. All 14 tables and 243 records will be created idempotently without duplicates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Migrated Data Breakdown by Table</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Total 243 sample records mapped
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Compliance Card */}
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>compliance_items</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white font-mono">
                        105 Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Full GST, Income Tax, ROC/MCA, PF/ESIC statutory records with subtasks &amp; due dates across all companies.
                    </p>
                  </div>

                  {/* Companies Card */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">companies</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white font-mono">
                        3 Entities
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Nexora Tech, Apex Logistics, and Zenith HealthTech with CIN, PAN, and GSTIN.
                    </p>
                  </div>

                  {/* Profiles & Roles Card */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">profiles &amp; roles</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white font-mono">
                        34 Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      10 profiles, 10 user_roles, and 14 company access mappings.
                    </p>
                  </div>

                  {/* Action Items */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">action_items</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white font-mono">
                        17 Items
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Banking reconciliations, MSME 43B(h) clearings, and tax audits.
                    </p>
                  </div>

                  {/* Repository */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">repository_matters</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white font-mono">
                        33 Matters
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      9 Tax Scrutinies, 5 Legal Cases, 9 Licenses, and 10 SOPs.
                    </p>
                  </div>

                  {/* Financial MIS */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">financial_mis &amp; budgets</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white font-mono">
                        38 Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      31 budget line items, 3 MIS uploads, and 4 monthly executive reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terminal Execution Option */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-300 font-semibold">
                    CLI Direct Runner Option:
                  </span>
                  <span className="text-[10px] text-slate-400">Node / tsx</span>
                </div>
                <pre className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg overflow-x-auto text-emerald-400 select-all">
                  npx tsx scripts/migrate-to-supabase.ts
                </pre>
                <p className="text-[11px] text-slate-400">
                  When <span className="font-mono text-slate-300">SUPABASE_URL</span> and <span className="font-mono text-slate-300">SUPABASE_SERVICE_ROLE_KEY</span> are provided in your environment, this script connects and upserts all tables automatically.
                </p>
              </div>
            </>
          ) : (
            /* SQL Script Preview Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-mono">
                  Showing SQL migration script content ({sqlContent ? sqlContent.length.toLocaleString() : "..."} characters):
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied!" : "Copy Full Script"}</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                  Loading migration SQL script...
                </div>
              ) : (
                <textarea
                  readOnly
                  value={sqlContent}
                  className="w-full h-[450px] p-4 font-mono text-[11px] bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 resize-none focus:outline-hidden"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Idempotent script: Safe to run multiple times without duplicating data.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
