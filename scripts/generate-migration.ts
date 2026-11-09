import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Import all mock data sources
import { CLIENT_COMPANIES, DEFAULT_USERS, COMPANY_FINANCIAL_MIS } from '../src/data/mockInitialData';
import { ALL_COMPANIES_COMPLIANCES, ALL_COMPANIES_ACTIONS } from '../src/data/companyData';
import { COMPLIANCE_MASTER_LIST } from '../src/data/complianceMaster';
import {
  MOCK_TAX_ASSESSMENTS,
  MOCK_LEGAL_CASES,
  MOCK_LICENSES,
  MOCK_SOPS,
} from '../src/data/mockRepositoryData';
import { INITIAL_NEXORA_BUDGET_ITEMS } from '../src/data/mockBudgetData';
import { INITIAL_EXECUTIVE_REPORTS } from '../src/data/mockExecutiveReports';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MIS_REMARKS,
  DEFAULT_SECURITY_PROTOCOLS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../src/data/mockAdminSecurityData';

function deterministicUuid(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  // Format as UUID v4-compliant string: 8-4-4-4-12
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

function escapeSqlString(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  if (typeof str === 'number') return isNaN(str) ? '0' : String(str);
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlJson(obj: any): string {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(obj).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

export function generateMigrationArtifacts() {
  console.log('Generating Supabase SQL migration and migration dataset...');

  // User ID to UUID mapping
  const userUuidMap: Record<string, string> = {};
  DEFAULT_USERS.forEach((u) => {
    userUuidMap[u.id] = deterministicUuid(`user:${u.id}`);
  });

  const sqlLines: string[] = [];

  sqlLines.push(`-- ==============================================================================`);
  sqlLines.push(`-- SUPABASE COMPREHENSIVE SCHEMA & DUMMY DATA MIGRATION SCRIPT`);
  sqlLines.push(`-- Project: Virtual CFO Suite / MIS Insights Hub`);
  sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
  sqlLines.push(`-- Safety: Safe to execute multiple times (Idempotent: ON CONFLICT DO UPDATE)`);
  sqlLines.push(`-- ==============================================================================\n`);

  sqlLines.push(`BEGIN;\n`);

  sqlLines.push(`-- 1. Ensure Required Enums and Extensions`);
  sqlLines.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  sqlLines.push(`DO $$ BEGIN`);
  sqlLines.push(`  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN`);
  sqlLines.push(`    CREATE TYPE public.app_role AS ENUM ('admin', 'cfo', 'client_team', 'client');`);
  sqlLines.push(`  END IF;`);
  sqlLines.push(`END $$;\n`);

  sqlLines.push(`-- 2. Core Tables Setup`);
  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.companies (
  id text PRIMARY KEY,
  company_name text NOT NULL,
  legal_entity text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  pan text NOT NULL DEFAULT '',
  cin text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  financial_year text NOT NULL DEFAULT 'FY 2026-27',
  cfo_name text NOT NULL DEFAULT '',
  cfo_firm text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Relax foreign key constraints and not-null constraints on profiles, uploads and remarks so demo/mock records insert cleanly
DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
  ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
  ALTER TABLE public.user_company_access DROP CONSTRAINT IF EXISTS user_company_access_user_id_fkey;
  ALTER TABLE public.mis_uploads ALTER COLUMN uploaded_by DROP NOT NULL;
  ALTER TABLE public.mis_remarks ALTER COLUMN author_id DROP NOT NULL;
  -- Temporarily disable triggers during migration so audit/rules triggers do not override seeded values
  ALTER TABLE public.mis_remarks DISABLE TRIGGER ALL;
  ALTER TABLE public.mis_uploads DISABLE TRIGGER ALL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.user_company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending',
  code text,
  compliance_name text,
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
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

-- If compliance_items or compliances already exists without the expanded columns, add them safely
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
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending',
  assigned_to uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.executive_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published',
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.repository_matters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  matter_type text NOT NULL DEFAULT 'tax_assessment',
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.repository_matters ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.mis_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  statement_type text NOT NULL,
  period text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  row_count integer NOT NULL DEFAULT 0,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  uploaded_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mis_uploads ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.mis_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  line_ref text NOT NULL DEFAULT '',
  period text NOT NULL DEFAULT '',
  reason_category text NOT NULL DEFAULT 'General',
  remark text NOT NULL,
  author_id uuid,
  author_name text NOT NULL DEFAULT '',
  author_role public.app_role NOT NULL DEFAULT 'client_team',
  cfo_response text,
  cfo_response_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mis_remarks ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  company_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.security_protocols (
  id text PRIMARY KEY DEFAULT 'default',
  mfa_required boolean NOT NULL DEFAULT false,
  session_timeout_minutes integer NOT NULL DEFAULT 30,
  password_min_length integer NOT NULL DEFAULT 8,
  require_special_char boolean NOT NULL DEFAULT true,
  require_number boolean NOT NULL DEFAULT true,
  require_uppercase boolean NOT NULL DEFAULT true,
  password_rotation_days integer NOT NULL DEFAULT 90,
  ip_whitelisting_enabled boolean NOT NULL DEFAULT false,
  whitelisted_ips text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.security_protocols ENABLE ROW LEVEL SECURITY;
`);

  sqlLines.push(`CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.app_role PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
`);

  // Grants
  sqlLines.push(`-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
`);

  // Helper functions
  sqlLines.push(`-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT exists (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','cfo'));
$$;

CREATE OR REPLACE FUNCTION public.can_view_company(_user_id uuid, _company_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id)
      OR exists (SELECT 1 FROM public.user_company_access WHERE user_id = _user_id AND company_id = _company_id);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_company(_user_id uuid, _company_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id)
      OR exists (SELECT 1 FROM public.user_company_access WHERE user_id = _user_id AND company_id = _company_id AND can_edit);
$$;
`);

  // Baseline RLS Policies (permissive for authenticated & fallback)
  sqlLines.push(`-- RLS Policies (Safe & Non-Destructive)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'companies_select_policy' AND tablename = 'companies') THEN
    CREATE POLICY companies_select_policy ON public.companies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'companies_write_policy' AND tablename = 'companies') THEN
    CREATE POLICY companies_write_policy ON public.companies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_policy' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_select_policy ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_write_policy' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_write_policy ON public.profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_roles_select_policy' AND tablename = 'user_roles') THEN
    CREATE POLICY user_roles_select_policy ON public.user_roles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_roles_write_policy' AND tablename = 'user_roles') THEN
    CREATE POLICY user_roles_write_policy ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_company_access_all_policy' AND tablename = 'user_company_access') THEN
    CREATE POLICY user_company_access_all_policy ON public.user_company_access FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'compliance_items_all_policy' AND tablename = 'compliance_items') THEN
    CREATE POLICY compliance_items_all_policy ON public.compliance_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'action_items_all_policy' AND tablename = 'action_items') THEN
    CREATE POLICY action_items_all_policy ON public.action_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'budget_items_all_policy' AND tablename = 'budget_items') THEN
    CREATE POLICY budget_items_all_policy ON public.budget_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'executive_reports_all_policy' AND tablename = 'executive_reports') THEN
    CREATE POLICY executive_reports_all_policy ON public.executive_reports FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'repository_matters_all_policy' AND tablename = 'repository_matters') THEN
    CREATE POLICY repository_matters_all_policy ON public.repository_matters FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mis_uploads_all_policy' AND tablename = 'mis_uploads') THEN
    CREATE POLICY mis_uploads_all_policy ON public.mis_uploads FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mis_remarks_all_policy' AND tablename = 'mis_remarks') THEN
    CREATE POLICY mis_remarks_all_policy ON public.mis_remarks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_all_policy' AND tablename = 'audit_log') THEN
    CREATE POLICY audit_log_all_policy ON public.audit_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'security_protocols_all_policy' AND tablename = 'security_protocols') THEN
    CREATE POLICY security_protocols_all_policy ON public.security_protocols FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_permissions_all_policy' AND tablename = 'role_permissions') THEN
    CREATE POLICY role_permissions_all_policy ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;\n`);

  // ---------------------------------------------------------
  // DATA MIGRATION: 1. Companies
  // ---------------------------------------------------------
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 1. Companies (${CLIENT_COMPANIES.length} records)`);
  sqlLines.push(`-- =========================================================`);
  for (const c of CLIENT_COMPANIES) {
    sqlLines.push(`INSERT INTO public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, financial_year, cfo_name, cfo_firm, is_active)
VALUES (
  ${escapeSqlString(c.id)},
  ${escapeSqlString(c.companyName)},
  ${escapeSqlString(c.legalEntity)},
  ${escapeSqlString(c.gstin)},
  ${escapeSqlString(c.pan)},
  ${escapeSqlString(c.cin)},
  ${escapeSqlString(c.sector)},
  ${escapeSqlString(c.financialYear)},
  ${escapeSqlString(c.cfoName || 'Virtual CFO')},
  ${escapeSqlString(c.cfoFirm || 'Virtual CFO Practice')},
  true
)
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  legal_entity = EXCLUDED.legal_entity,
  gstin = EXCLUDED.gstin,
  pan = EXCLUDED.pan,
  cin = EXCLUDED.cin,
  sector = EXCLUDED.sector,
  financial_year = EXCLUDED.financial_year;
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 2. Profiles & Roles (${DEFAULT_USERS.length} records)
  // ---------------------------------------------------------
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 2. Profiles (${DEFAULT_USERS.length} records) & Roles`);
  sqlLines.push(`-- =========================================================`);
  for (const u of DEFAULT_USERS) {
    const uuid = userUuidMap[u.id];
    sqlLines.push(`INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '${uuid}',
  ${escapeSqlString(u.email)},
  ${escapeSqlString(u.name)},
  ${escapeSqlString(u.roleTitle || u.role)},
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '${deterministicUuid(`role:${uuid}:${u.role}`)}',
  '${uuid}',
  '${u.role}'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;
`);

    if (u.companyId && u.companyId !== 'all') {
      sqlLines.push(`INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '${deterministicUuid(`access:${uuid}:${u.companyId}`)}',
  '${uuid}',
  ${escapeSqlString(u.companyId)},
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;
`);
    } else if (u.companyId === 'all') {
      // Admin/CFO has access to all companies
      for (const comp of CLIENT_COMPANIES) {
        sqlLines.push(`INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '${deterministicUuid(`access:${uuid}:${comp.id}`)}',
  '${uuid}',
  ${escapeSqlString(comp.id)},
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;
`);
      }
    }
  }

  // Automatically sync profiles and roles with any user accounts already created in auth.users:
  sqlLines.push(`DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, email FROM auth.users LOOP
    UPDATE public.profiles SET id = r.id WHERE lower(email) = lower(r.email) AND id != r.id;
    UPDATE public.user_roles SET user_id = r.id WHERE user_id IN (
      SELECT id FROM public.profiles WHERE lower(email) = lower(r.email)
    ) AND user_id != r.id;
    UPDATE public.user_company_access SET user_id = r.id WHERE user_id IN (
      SELECT id FROM public.profiles WHERE lower(email) = lower(r.email)
    ) AND user_id != r.id;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`);

  // ---------------------------------------------------------
  // DATA MIGRATION: 3. Compliance Items
  // ---------------------------------------------------------
  let complianceCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 3. Compliance Items`);
  sqlLines.push(`-- =========================================================`);
  for (const [companyId, items] of Object.entries(ALL_COMPANIES_COMPLIANCES)) {
    for (const item of items) {
      complianceCount++;
      const itemUuid = deterministicUuid(`compliance:${companyId}:${item.id}`);
      sqlLines.push(`INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '${itemUuid}',
  ${escapeSqlString(companyId)},
  ${escapeSqlString(item.category || 'Statutory')},
  ${escapeSqlString(item.status || 'Pending')},
  ${escapeSqlJson(item)}
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();
`);
    }
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 3b. Compliance Master (35 General Statutory Templates)
  // ---------------------------------------------------------
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 3b. Compliance Master (General Statutory Standards)`);
  sqlLines.push(`-- =========================================================`);
  COMPLIANCE_MASTER_LIST.forEach((c) => {
    const sub = c.subtasks || [];
    const stage1 = sub[0]?.title || 'Prepare basic records & sub-ledger reconciliation';
    const stage2 = sub[1]?.title || 'Virtual CFO / Senior Manager compliance audit and sign-off';
    const stage3 = sub[2]?.title || 'File statutory form on government portal & archive acknowledgement/challan';
    const code = c.id.toUpperCase();
    const act = code.startsWith('GST')
      ? 'Central Goods & Services Tax (CGST) Act, 2017 & Rules'
      : code.startsWith('TDS') || code.startsWith('IT')
      ? 'Income Tax Act, 1961 & Rules'
      : code.startsWith('ROC')
      ? 'Companies Act, 2013 & MCA Rules'
      : code.startsWith('PF')
      ? (code.includes('ESI') ? 'Employees State Insurance (ESI) Act, 1948' : 'Employees Provident Funds Act, 1952')
      : 'State Professional Tax / Labour Laws';
    const portal = code.startsWith('GST')
      ? 'services.gst.gov.in'
      : code.startsWith('TDS')
      ? 'tdscpc.gov.in (TRACES)'
      : code.startsWith('IT')
      ? 'eportal.incometax.gov.in'
      : code.startsWith('ROC')
      ? 'mca.gov.in (V3 Portal)'
      : code.startsWith('PF')
      ? (code.includes('ESI') ? 'esic.gov.in' : 'unifiedportal-emp.epfindia.gov.in')
      : 'State Commercial Tax Portal';

    sqlLines.push(`INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  ${escapeSqlString(code)},
  ${escapeSqlString(c.name)},
  ${escapeSqlString(c.category)},
  ${escapeSqlString(act)},
  ${escapeSqlString(c.frequency)},
  ${escapeSqlString(c.statutoryDueDate || 'Statutory Schedule')},
  ${escapeSqlString(c.criticality || 'Medium')},
  ${escapeSqlString(c.type || 'Return')},
  ${escapeSqlString(c.applicability || 'All Registered Entities')},
  ${escapeSqlString(c.penaltyClause || 'Statutory late fees & interest as per Act')},
  ${escapeSqlString(portal)},
  ${escapeSqlString(stage1)},
  ${escapeSqlString(stage2)},
  ${escapeSqlString(stage3)},
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
  is_active = EXCLUDED.is_active;
`);
  });

  // ---------------------------------------------------------
  // DATA MIGRATION: 4. Action Items
  // ---------------------------------------------------------
  let actionCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 4. Action Items`);
  sqlLines.push(`-- =========================================================`);
  for (const [companyId, actions] of Object.entries(ALL_COMPANIES_ACTIONS)) {
    for (const act of actions) {
      actionCount++;
      const actUuid = deterministicUuid(`action:${companyId}:${act.id}`);
      sqlLines.push(`INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '${actUuid}',
  ${escapeSqlString(companyId)},
  ${escapeSqlString(act.status || 'Pending')},
  ${escapeSqlJson(act)}
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();
`);
    }
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 5. Repository Matters
  // ---------------------------------------------------------
  let repoCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 5. Repository Matters (Tax, Legal, Licenses, SOPs)`);
  sqlLines.push(`-- =========================================================`);
  const allRepoMatters: Array<{ item: any; matterType: string }> = [
    ...MOCK_TAX_ASSESSMENTS.map((i) => ({ item: i, matterType: 'tax_assessment' })),
    ...MOCK_LEGAL_CASES.map((i) => ({ item: i, matterType: 'legal_case' })),
    ...MOCK_LICENSES.map((i) => ({ item: i, matterType: 'license_certification' })),
    ...MOCK_SOPS.map((i) => ({ item: i, matterType: 'sop' })),
  ];
  for (const { item, matterType } of allRepoMatters) {
    repoCount++;
    const repoUuid = deterministicUuid(`repo:${item.companyId || 'client-101'}:${item.id}`);
    sqlLines.push(`INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '${repoUuid}',
  ${escapeSqlString(item.companyId || 'client-101')},
  ${escapeSqlString(matterType)},
  ${escapeSqlJson(item)}
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 6. Budget Items
  // ---------------------------------------------------------
  let budgetCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 6. Budget Items (${INITIAL_NEXORA_BUDGET_ITEMS.length} lines)`);
  sqlLines.push(`-- =========================================================`);
  for (const bItem of INITIAL_NEXORA_BUDGET_ITEMS) {
    budgetCount++;
    const budgetUuid = deterministicUuid(`budget:client-101:${bItem.id}`);
    sqlLines.push(`INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '${budgetUuid}',
  'client-101',
  ${escapeSqlJson(bItem)}
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 7. Executive Reports
  // ---------------------------------------------------------
  let reportCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 7. Executive Reports`);
  sqlLines.push(`-- =========================================================`);
  for (const [companyId, reports] of Object.entries(INITIAL_EXECUTIVE_REPORTS)) {
    for (const r of reports) {
      reportCount++;
      const repUuid = deterministicUuid(`report:${companyId}:${r.id || r.monthKey}`);
      sqlLines.push(`INSERT INTO public.executive_reports (id, company_id, month_key, status, data)
VALUES (
  '${repUuid}',
  ${escapeSqlString(companyId)},
  ${escapeSqlString(r.monthKey || '2026-08')},
  ${escapeSqlString(r.status || 'published')},
  ${escapeSqlJson(r)}
)
ON CONFLICT (id) DO UPDATE SET
  month_key = EXCLUDED.month_key,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();
`);
    }
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 8. Financial MIS Statements (MIS Uploads & Snapshots)
  // ---------------------------------------------------------
  let misUploadCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 8. Financial MIS Records & Statements`);
  sqlLines.push(`-- =========================================================`);
  for (const [companyId, finMis] of Object.entries(COMPANY_FINANCIAL_MIS)) {
    misUploadCount++;
    const misUuid = deterministicUuid(`mis:pnl:${companyId}`);
    const defaultUploaderUuid = userUuidMap['user-naksh-goyal'] || userUuidMap['user-cfo'] || 'ad384b5d-7461-44fe-8625-a68affc52c04';
    sqlLines.push(`INSERT INTO public.mis_uploads (id, company_id, statement_type, period, file_name, row_count, rows, status, uploaded_by)
VALUES (
  '${misUuid}',
  ${escapeSqlString(companyId)},
  'pnl',
  ${escapeSqlString(finMis.period)},
  'Tally_PnL_Consolidated_Aug2026.xlsx',
  ${(finMis.pnlStatement as any)?.rows?.length || 18},
  ${escapeSqlJson(finMis)},
  'approved',
  '${defaultUploaderUuid}'
)
ON CONFLICT (id) DO UPDATE SET
  rows = EXCLUDED.rows,
  status = EXCLUDED.status,
  uploaded_by = EXCLUDED.uploaded_by;
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 9. MIS Remarks & Annotations
  // ---------------------------------------------------------
  let remarkCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 9. MIS Remarks & Annotations`);
  sqlLines.push(`-- =========================================================`);
  for (const rem of INITIAL_MIS_REMARKS) {
    remarkCount++;
    const remUuid = deterministicUuid(`remark:${rem.id}`);
    const authorUuid = userUuidMap[rem.authorId] || deterministicUuid(`user:${rem.authorId}`);
    sqlLines.push(`INSERT INTO public.mis_remarks (id, company_id, page_key, line_ref, period, reason_category, remark, author_id, author_name, author_role, cfo_response, cfo_response_at)
VALUES (
  '${remUuid}',
  ${escapeSqlString(rem.companyId || 'client-101')},
  ${escapeSqlString(rem.pageKey)},
  ${escapeSqlString(rem.lineRef || '')},
  ${escapeSqlString(rem.period || 'August 2026')},
  ${escapeSqlString(rem.reasonCategory || 'General')},
  ${escapeSqlString(rem.remark)},
  '${authorUuid}',
  ${escapeSqlString(rem.authorName)},
  '${rem.authorRole}'::public.app_role,
  ${escapeSqlString(rem.cfoResponse)},
  ${rem.cfoResponseAt ? `'${rem.cfoResponseAt}'::timestamptz` : 'NULL'}
)
ON CONFLICT (id) DO UPDATE SET
  remark = EXCLUDED.remark,
  cfo_response = EXCLUDED.cfo_response;
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 10. Audit Logs
  // ---------------------------------------------------------
  let auditCount = 0;
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 10. Audit Logs`);
  sqlLines.push(`-- =========================================================`);
  for (const log of INITIAL_AUDIT_LOGS) {
    auditCount++;
    const logUuid = deterministicUuid(`audit:${log.id}`);
    const actorUuid = log.actorId ? (userUuidMap[log.actorId] || deterministicUuid(`user:${log.actorId}`)) : null;
    sqlLines.push(`INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  '${logUuid}',
  ${actorUuid ? `'${actorUuid}'` : 'NULL'},
  ${escapeSqlString(log.actorEmail)},
  ${escapeSqlString(log.action)},
  ${escapeSqlString(log.entity)},
  ${escapeSqlString(log.entityId)},
  ${escapeSqlString(log.companyId)},
  ${escapeSqlJson(log.details)}
)
ON CONFLICT (id) DO NOTHING;
`);
  }

  // ---------------------------------------------------------
  // DATA MIGRATION: 11. Security Protocols & Role Permissions
  // ---------------------------------------------------------
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`-- DATA MIGRATION: 11. Security Protocols & Role Permissions`);
  sqlLines.push(`-- =========================================================`);
  sqlLines.push(`INSERT INTO public.security_protocols (id, mfa_required, session_timeout_minutes, password_min_length, require_special_char, require_number, require_uppercase, password_rotation_days, ip_whitelisting_enabled, whitelisted_ips)
VALUES (
  'default',
  ${DEFAULT_SECURITY_PROTOCOLS.mfaRequired ? 'TRUE' : 'FALSE'},
  ${DEFAULT_SECURITY_PROTOCOLS.sessionTimeoutMinutes || 30},
  ${DEFAULT_SECURITY_PROTOCOLS.passwordMinLength || 8},
  ${DEFAULT_SECURITY_PROTOCOLS.requireSpecialChar ? 'TRUE' : 'FALSE'},
  ${DEFAULT_SECURITY_PROTOCOLS.requireNumber ? 'TRUE' : 'FALSE'},
  ${DEFAULT_SECURITY_PROTOCOLS.requireUppercase ? 'TRUE' : 'FALSE'},
  ${DEFAULT_SECURITY_PROTOCOLS.passwordRotationDays || 90},
  ${DEFAULT_SECURITY_PROTOCOLS.ipWhitelistingEnabled ? 'TRUE' : 'FALSE'},
  ARRAY[${(DEFAULT_SECURITY_PROTOCOLS.whitelistedIps || []).map((ip) => escapeSqlString(ip)).join(', ')}]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  mfa_required = EXCLUDED.mfa_required,
  session_timeout_minutes = EXCLUDED.session_timeout_minutes,
  password_min_length = EXCLUDED.password_min_length;
`);

  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    sqlLines.push(`INSERT INTO public.role_permissions (role, permissions)
VALUES (
  '${role}'::public.app_role,
  ${escapeSqlJson(perms)}
)
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();
`);
  }

  sqlLines.push(`-- Re-enable triggers
DO $$ BEGIN
  ALTER TABLE public.mis_remarks ENABLE TRIGGER ALL;
  ALTER TABLE public.mis_uploads ENABLE TRIGGER ALL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`);

  sqlLines.push(`COMMIT;\n`);

  const fullSql = sqlLines.join('\n');
  const targetSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261105000000_schema_and_dummy_data_migration.sql');
  fs.mkdirSync(path.dirname(targetSqlPath), { recursive: true });
  fs.writeFileSync(targetSqlPath, fullSql, 'utf-8');
  console.log(`Successfully generated SQL migration script at: ${targetSqlPath}`);

  const report = {
    companies: CLIENT_COMPANIES.length,
    usersAndProfiles: DEFAULT_USERS.length,
    complianceItems: complianceCount,
    actionItems: actionCount,
    repositoryMatters: repoCount,
    budgetItems: budgetCount,
    executiveReports: reportCount,
    financialMisStatements: misUploadCount,
    misRemarks: remarkCount,
    auditLogs: auditCount,
    securityProtocols: 1,
    rolePermissions: Object.keys(DEFAULT_ROLE_PERMISSIONS).length,
    totalRecords:
      CLIENT_COMPANIES.length +
      DEFAULT_USERS.length +
      complianceCount +
      actionCount +
      repoCount +
      budgetCount +
      reportCount +
      misUploadCount +
      remarkCount +
      auditCount +
      1 +
      Object.keys(DEFAULT_ROLE_PERMISSIONS).length,
  };

  console.log('Migration Records Summary:', report);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateMigrationArtifacts();
}
