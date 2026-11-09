import fs from 'node:fs';
import path from 'node:path';
import { COMPLIANCE_MASTER_LIST } from '../src/data/complianceMaster';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeSqlString(str: any): string {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "''")}'`;
}

export function generateGeneralComplianceArtifacts() {
  const headers = [
    'code',
    'compliance_name',
    'category',
    'act_or_law',
    'frequency',
    'statutory_due_date_rule',
    'criticality',
    'form_type',
    'applicability',
    'penalty_clause',
    'governing_portal',
    'stage_1_task',
    'stage_2_task',
    'stage_3_task',
    'is_active',
  ];

  const getActByCode = (id: string, category: string): string => {
    const lower = id.toLowerCase();
    if (lower.startsWith('gst-')) return 'Central Goods & Services Tax (CGST) Act, 2017 & Rules';
    if (lower.startsWith('tds-') || lower.startsWith('it-')) return 'Income Tax Act, 1961 & Rules';
    if (lower.startsWith('roc-')) return 'Companies Act, 2013 & MCA Rules';
    if (lower.startsWith('pf-')) {
      if (lower.includes('esi')) return 'Employees State Insurance (ESI) Act, 1948';
      return 'Employees Provident Funds & Miscellaneous Provisions Act, 1952';
    }
    if (lower.startsWith('pt-')) {
      if (lower.includes('shop')) return 'State Shops & Commercial Establishments Act';
      if (lower.includes('lwf')) return 'State Labour Welfare Fund Act';
      return 'State Professional Tax (PT) Act';
    }
    return category;
  };

  const getPortalByCode = (id: string): string => {
    const lower = id.toLowerCase();
    if (lower.startsWith('gst-')) return 'services.gst.gov.in';
    if (lower.startsWith('tds-')) return 'tdscpc.gov.in (TRACES) & eportal.incometax.gov.in';
    if (lower.startsWith('it-')) return 'eportal.incometax.gov.in';
    if (lower.startsWith('roc-')) return 'mca.gov.in (V3 Portal)';
    if (lower.startsWith('pf-')) {
      if (lower.includes('esi')) return 'esic.gov.in';
      return 'unifiedportal-emp.epfindia.gov.in';
    }
    if (lower.startsWith('pt-')) return 'State Commercial Tax / Labour Portal';
    return 'Statutory Regulatory Portal';
  };

  const masterRows: {
    code: string;
    compliance_name: string;
    category: string;
    act_or_law: string;
    frequency: string;
    statutory_due_date_rule: string;
    criticality: string;
    form_type: string;
    applicability: string;
    penalty_clause: string;
    governing_portal: string;
    stage_1_task: string;
    stage_2_task: string;
    stage_3_task: string;
    is_active: boolean;
  }[] = [];

  COMPLIANCE_MASTER_LIST.forEach((c) => {
    const sub = c.subtasks || [];
    const stage1 = sub[0]?.title || 'Prepare basic records & sub-ledger reconciliation';
    const stage2 = sub[1]?.title || 'Virtual CFO / Senior Manager compliance audit and sign-off';
    const stage3 = sub[2]?.title || 'File statutory form on government portal & archive acknowledgement/challan';

    masterRows.push({
      code: c.id.toUpperCase(),
      compliance_name: c.name,
      category: c.category,
      act_or_law: getActByCode(c.id, c.category),
      frequency: c.frequency,
      statutory_due_date_rule: c.statutoryDueDate || 'Statutory Schedule',
      criticality: c.criticality || 'Medium',
      form_type: c.type || 'Return',
      applicability: c.applicability || 'All Registered Entities',
      penalty_clause: c.penaltyClause || 'Statutory late fees, penal interest, or prosecution provisions as per Act',
      governing_portal: getPortalByCode(c.id),
      stage_1_task: stage1,
      stage_2_task: stage2,
      stage_3_task: stage3,
      is_active: true,
    });
  });

  // CSV 1: general_statutory_compliance_master.csv (Friendly Master Schema)
  const csv1Rows = masterRows.map((r) => [
    r.code,
    r.compliance_name,
    r.category,
    r.act_or_law,
    r.frequency,
    r.statutory_due_date_rule,
    r.criticality,
    r.form_type,
    r.applicability,
    r.penalty_clause,
    r.governing_portal,
    r.stage_1_task,
    r.stage_2_task,
    r.stage_3_task,
    r.is_active ? 'true' : 'false',
  ]);

  const csv1Content = [
    headers.join(','),
    ...csv1Rows.map((r) => r.map(escapeCsvField).join(',')),
  ].join('\r\n');

  // CSV 2: compliance_items_table_format.csv (Compatible with public.compliance_items headers: id, company_id, category, status, data)
  const csv2Headers = ['id', 'company_id', 'category', 'status', 'data'];
  const csv2Rows = COMPLIANCE_MASTER_LIST.map((c, idx) => {
    // Generate a stable dummy UUID for general template
    const paddedIdx = String(idx + 1).padStart(4, '0');
    const dummyUuid = `00000000-0000-4000-8000-${paddedIdx}00000000`;
    const cleanData = JSON.stringify({
      code: c.id.toUpperCase(),
      name: c.name,
      category: c.category,
      frequency: c.frequency,
      statutoryDueDate: c.statutoryDueDate,
      dueDates: c.dueDates || [],
      type: c.type,
      applicability: c.applicability,
      penaltyClause: c.penaltyClause,
      criticality: c.criticality,
      subtasks: c.subtasks || [],
    });
    return [
      dummyUuid,
      'client-101', // defaults to primary client so it links to valid company_id
      c.category,
      'Pending',
      cleanData,
    ];
  });

  const csv2Content = [
    csv2Headers.join(','),
    ...csv2Rows.map((r) => r.map(escapeCsvField).join(',')),
  ].join('\r\n');

  // Generate SQL file with:
  // 1. ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS (so importing CSV into existing table works seamlessly)
  // 2. CREATE TABLE compliance_master
  // 3. Ready INSERTs for all 35 records directly in SQL
  const sqlInsertStatements = masterRows.map((r) => {
    return `INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  ${escapeSqlString(r.code)},
  ${escapeSqlString(r.compliance_name)},
  ${escapeSqlString(r.category)},
  ${escapeSqlString(r.act_or_law)},
  ${escapeSqlString(r.frequency)},
  ${escapeSqlString(r.statutory_due_date_rule)},
  ${escapeSqlString(r.criticality)},
  ${escapeSqlString(r.form_type)},
  ${escapeSqlString(r.applicability)},
  ${escapeSqlString(r.penalty_clause)},
  ${escapeSqlString(r.governing_portal)},
  ${escapeSqlString(r.stage_1_task)},
  ${escapeSqlString(r.stage_2_task)},
  ${escapeSqlString(r.stage_3_task)},
  true
)
ON CONFLICT (code) DO UPDATE SET
  compliance_name = EXCLUDED.compliance_name,
  category = EXCLUDED.category,
  act_or_law = EXCLUDED.act_or_law,
  frequency = EXCLUDED.frequency,
  statutory_due_date_rule = EXCLUDED.statutory_due_date_rule,
  criticality = EXCLUDED.criticality,
  form_type = EXCLUDED.form_type,
  applicability = EXCLUDED.applicability,
  penalty_clause = EXCLUDED.penalty_clause,
  governing_portal = EXCLUDED.governing_portal,
  stage_1_task = EXCLUDED.stage_1_task,
  stage_2_task = EXCLUDED.stage_2_task,
  stage_3_task = EXCLUDED.stage_3_task,
  is_active = EXCLUDED.is_active;`;
  }).join('\n\n');

  const sqlDdl = `-- ==============================================================================
-- COMPLIANCE MASTER & TABLE FIX FOR SUPABASE
-- Solves "incompatible headers: columns not present in your table"
--
-- This script performs TWO actions:
-- 1. Adds the missing columns to public.compliance_items and public.compliances (if existing)
--    so that importing CSV directly into your existing table will NEVER throw header errors.
-- 2. Creates the dedicated public.compliance_master table and directly seeds all 35
--    statutory Indian compliance records into Supabase (GST, TDS/TCS, Income Tax, ROC/MCA, PF/ESI, PT).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Add missing columns to existing compliance tables
-- ------------------------------------------------------------------------------
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
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- ------------------------------------------------------------------------------
-- STEP 2: Create dedicated public.compliance_master table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_master (
  code text PRIMARY KEY,
  compliance_name text NOT NULL,
  category text NOT NULL,
  act_or_law text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'Monthly',
  statutory_due_date_rule text NOT NULL DEFAULT '',
  criticality text NOT NULL DEFAULT 'Medium',
  form_type text NOT NULL DEFAULT 'Return',
  applicability text NOT NULL DEFAULT '',
  penalty_clause text NOT NULL DEFAULT '',
  governing_portal text NOT NULL DEFAULT '',
  stage_1_task text NOT NULL DEFAULT '',
  stage_2_task text NOT NULL DEFAULT '',
  stage_3_task text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_master ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'compliance_master_select' AND tablename = 'compliance_master') THEN
    CREATE POLICY compliance_master_select ON public.compliance_master FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'compliance_master_write' AND tablename = 'compliance_master') THEN
    CREATE POLICY compliance_master_write ON public.compliance_master FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_master TO authenticated;
GRANT ALL ON public.compliance_master TO service_role;

-- ------------------------------------------------------------------------------
-- STEP 3: Seed all 35 statutory compliance master records directly
-- ------------------------------------------------------------------------------
${sqlInsertStatements}

-- Verify record count
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.compliance_master;
  RAISE NOTICE 'Successfully seeded compliance_master: % rows ready.', v_count;
END $$;
`;

  // Write outputs
  const publicExportsDir = path.resolve(process.cwd(), 'public/exports');
  const publicMigrationsDir = path.resolve(process.cwd(), 'public/migrations');
  const supabaseDir = path.resolve(process.cwd(), 'supabase');
  const supabaseMigrationsDir = path.resolve(process.cwd(), 'supabase/migrations');

  [publicExportsDir, publicMigrationsDir, supabaseDir, supabaseMigrationsDir].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // CSV 1: general master
  fs.writeFileSync(path.join(publicExportsDir, 'general_statutory_compliance_master.csv'), csv1Content, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'general_statutory_compliance_master.csv'), csv1Content, 'utf-8');

  // CSV 2: compliance_items format
  fs.writeFileSync(path.join(publicExportsDir, 'compliance_items_table_format.csv'), csv2Content, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'compliance_items_table_format.csv'), csv2Content, 'utf-8');

  // SQL Migration file
  const sqlFileName = '20261107000000_compliance_master_table.sql';
  fs.writeFileSync(path.join(supabaseMigrationsDir, sqlFileName), sqlDdl, 'utf-8');
  fs.writeFileSync(path.join(publicMigrationsDir, sqlFileName), sqlDdl, 'utf-8');

  console.log(`Generated all compliance artifacts successfully:`);
  console.log(`- general_statutory_compliance_master.csv (15 columns, 35 rows)`);
  console.log(`- compliance_items_table_format.csv (5 columns matching compliance_items)`);
  console.log(`- ${sqlFileName} (creates table, alters existing tables, seeds 35 rows)`);

  return { rowsCount: masterRows.length, sqlDdl };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateGeneralComplianceArtifacts();
}

