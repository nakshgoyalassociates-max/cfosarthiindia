-- ==============================================================================
-- SUPABASE COMPREHENSIVE SCHEMA & DUMMY DATA MIGRATION SCRIPT
-- Project: Virtual CFO Suite / MIS Insights Hub
-- Generated: 2026-11-07T08:06:54.554Z
-- Safety: Safe to execute multiple times (Idempotent: ON CONFLICT DO UPDATE)
-- ==============================================================================

BEGIN;

-- 1. Ensure Required Enums and Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'cfo', 'client_team', 'client');
  END IF;
END $$;

-- 2. Core Tables Setup
CREATE TABLE IF NOT EXISTS public.companies (
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

CREATE TABLE IF NOT EXISTS public.profiles (
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

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.compliance_items (
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

CREATE TABLE IF NOT EXISTS public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending',
  assigned_to uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.executive_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published',
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.repository_matters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  matter_type text NOT NULL DEFAULT 'tax_assessment',
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.repository_matters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.mis_uploads (
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

CREATE TABLE IF NOT EXISTS public.mis_remarks (
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

CREATE TABLE IF NOT EXISTS public.audit_log (
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

CREATE TABLE IF NOT EXISTS public.security_protocols (
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

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.app_role PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Helper Functions
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

-- RLS Policies (Safe & Non-Destructive)
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
END $$;

-- =========================================================
-- DATA MIGRATION: 1. Companies (3 records)
-- =========================================================
INSERT INTO public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, financial_year, cfo_name, cfo_firm, is_active)
VALUES (
  'client-101',
  'Nexora Innovations Tech Pvt Ltd',
  'Private Limited Company (India)',
  '27AAACN4921E1ZQ',
  'AAACN4921E',
  'U72900MH2021PTC358912',
  'Information Technology & SaaS',
  'FY 2026-27 (AY 2027-28)',
  'Virtual CFO',
  'Virtual CFO Practice',
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

INSERT INTO public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, financial_year, cfo_name, cfo_firm, is_active)
VALUES (
  'client-102',
  'Apex Global Logistics India Pvt Ltd',
  'Private Limited Company (India)',
  '27AABCA3310F1ZT',
  'AABCA3310F',
  'U63090MH2019PTC319401',
  'Interstate Logistics & Supply Chain',
  'FY 2026-27 (AY 2027-28)',
  'Virtual CFO',
  'Virtual CFO Practice',
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

INSERT INTO public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, financial_year, cfo_name, cfo_firm, is_active)
VALUES (
  'client-103',
  'Zenith HealthTech Solutions LLP',
  'Limited Liability Partnership (LLP)',
  '27AAHFZ9802P1Z5',
  'AAHFZ9802P',
  'AAA-9920',
  'HealthTech & Bio-Diagnostics',
  'FY 2026-27 (AY 2027-28)',
  'Virtual CFO',
  'Virtual CFO Practice',
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

-- =========================================================
-- DATA MIGRATION: 2. Profiles (10 records) & Roles
-- =========================================================
INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  'ad384b5d-7461-44fe-8625-a68affc52c04',
  'nakshgoyal.associates@gmail.com',
  'Naksh Goyal',
  'Lead Partner & Virtual CFO',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '8314006a-0c73-4042-906f-9ccbce7b601d',
  'ad384b5d-7461-44fe-8625-a68affc52c04',
  'cfo'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'c92a92c8-322c-43c1-811b-d5ffa1ba8266',
  'ad384b5d-7461-44fe-8625-a68affc52c04',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'df11b31e-3b9a-41a2-a1eb-1117b660ee01',
  'ad384b5d-7461-44fe-8625-a68affc52c04',
  'client-102',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '75a08c76-5cc8-428d-9dad-d9252717620d',
  'ad384b5d-7461-44fe-8625-a68affc52c04',
  'client-103',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '6cad8648-3169-4d52-8bf0-62288932d854',
  'cfo@practice.com',
  'Sudhakar',
  'Virtual CFO & Practice Partner',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '69ebaef1-79ba-42ff-8cf3-4c2d5b2f0ec3',
  '6cad8648-3169-4d52-8bf0-62288932d854',
  'cfo'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'b013d363-5441-407e-b8f1-f262bd0b36fe',
  '6cad8648-3169-4d52-8bf0-62288932d854',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'c5a1ca42-88ba-44fd-b53d-bbad00570f6e',
  '6cad8648-3169-4d52-8bf0-62288932d854',
  'client-102',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '27dc6700-7859-4d39-861f-581f25348f56',
  '6cad8648-3169-4d52-8bf0-62288932d854',
  'client-103',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '6b2195db-94b2-4553-884f-1032e4ca101e',
  'anand@nexora.io',
  'Anand Verma',
  'Managing Director & Promoter',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '1610b24e-ba7a-4ad4-b640-d23148b3a5bf',
  '6b2195db-94b2-4553-884f-1032e4ca101e',
  'client'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '9bee536c-c128-482b-997a-87d752f1a4b9',
  '6b2195db-94b2-4553-884f-1032e4ca101e',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '422f8b22-ceaa-4b36-858b-edf73aedf38e',
  'pooja@nexora.io',
  'Pooja Sharma',
  'Sr. Tax Accountant (Direct & Indirect Tax)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '2bf3254c-9c02-45d1-978d-de98a933f2f8',
  '422f8b22-ceaa-4b36-858b-edf73aedf38e',
  'client_team'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'd26d397a-d9c1-4a1a-b296-7d0f4bd52ae6',
  '422f8b22-ceaa-4b36-858b-edf73aedf38e',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '89c313f4-90bb-49fa-a687-4e3e579811e2',
  'rahul@nexora.io',
  'Rahul Verma',
  'Filing Associate & Treasury Ops',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  'e1a00056-0369-413f-a7a0-dbba0c92337c',
  '89c313f4-90bb-49fa-a687-4e3e579811e2',
  'client_team'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '592dcd67-407f-44b9-81dd-c3fbbb536bcf',
  '89c313f4-90bb-49fa-a687-4e3e579811e2',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '47b4d0ff-59bb-498a-949b-23a26e8a436c',
  'amit@nexora.io',
  'Amit Patel',
  'Payroll & Labor Compliance Exec',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '9d728004-55b1-4582-bd01-d65a541035aa',
  '47b4d0ff-59bb-498a-949b-23a26e8a436c',
  'client_team'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '9858b54b-7739-4111-aec6-831fc9e80d39',
  '47b4d0ff-59bb-498a-949b-23a26e8a436c',
  'client-101',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '0849b493-e6f4-4690-878f-0c26a15aa1d2',
  'vikram@apexlogistics.in',
  'Vikram Singhania',
  'Finance Controller & Compliance Lead',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '39f0ad50-52ec-4509-8688-1f4fb680581b',
  '0849b493-e6f4-4690-878f-0c26a15aa1d2',
  'client_team'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'ac7e2b87-bf68-4dcc-a0e7-77f22c59d806',
  '0849b493-e6f4-4690-878f-0c26a15aa1d2',
  'client-102',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  'a63509e7-90f7-4054-8d4c-970139953608',
  'director@apexlogistics.in',
  'Rajesh Malhotra',
  'Whole-Time Director',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '2a931a19-1d35-46bc-b717-0e6d3da577da',
  'a63509e7-90f7-4054-8d4c-970139953608',
  'client'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'b2e6628a-2bde-4b6b-8476-12ca3d96b678',
  'a63509e7-90f7-4054-8d4c-970139953608',
  'client-102',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  'c3e40182-ed0f-4fea-ba63-542148bdc8fb',
  'alok@zenithhealthtech.in',
  'CS Alok Mehta',
  'Secretarial & Accounts Lead',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '1c58cedb-2668-4f2f-adf6-78772c6491e1',
  'c3e40182-ed0f-4fea-ba63-542148bdc8fb',
  'client_team'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  'da238ad2-fc7e-456b-9550-57ea562f763d',
  'c3e40182-ed0f-4fea-ba63-542148bdc8fb',
  'client-103',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

INSERT INTO public.profiles (id, email, full_name, designation, is_active)
VALUES (
  '550d9d02-b78f-42cc-901f-6536125a2e88',
  'meera@zenithhealthtech.in',
  'Dr. Meera Krishnan',
  'Designated Partner',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation;

INSERT INTO public.user_roles (id, user_id, role)
VALUES (
  '575391a7-891f-4f76-b805-9c77f23772f7',
  '550d9d02-b78f-42cc-901f-6536125a2e88',
  'client'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_company_access (id, user_id, company_id, can_edit)
VALUES (
  '538c5c77-49b2-46a4-8bf1-5d146c3f6ff8',
  '550d9d02-b78f-42cc-901f-6536125a2e88',
  'client-103',
  true
)
ON CONFLICT (user_id, company_id) DO UPDATE SET can_edit = true;

DO $$
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

-- =========================================================
-- DATA MIGRATION: 3. Compliance Items
-- =========================================================
INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'c3d7779b-8eac-4a16-809d-c1ff11e9119c',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-1","sNo":1,"category":"GST","name":"GSTR-1 (Outward supplies)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"11th of next month (Monthly); 13th of month after quarter (QRMP)","dueDates":["2026-09-11","2026-10-13"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day for nil) + interest","period":"Aug 2026","criticality":"High","subtasks":[{"id":"gst-1-1","subtaskNumber":1,"title":"Compile sales register & invoice-wise data; upload to GST tool","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"06 Sep 2026","status":"completed","completedAt":"05 Sep 2026 16:30","completedBy":"Pooja Sharma","notes":"Sales register matched with ERP sales vouchers. B2B & B2C summaries ready."},{"id":"gst-1-2","subtaskNumber":2,"title":"Reconcile with sales ledger & e-invoice/e-way bill data; CFO sign-off on draft","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"09 Sep 2026","status":"completed","completedAt":"08 Sep 2026 18:15","completedBy":"Sudhakar","notes":"Reconciliation verified against IRN list. Minor credit note adjustment reconciled. Approved."},{"id":"gst-1-3","subtaskNumber":3,"title":"File GSTR-1 on GST portal; save ARN/acknowledgment","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"11 Sep 2026","status":"completed","completedAt":"10 Sep 2026 14:10","completedBy":"Rahul Verma","notes":"Filed with DSC. ARN generated & archived in Google Drive.","documentRef":"ARN: AA2708260198421"}],"arnOrChallanNo":"AA2708260198421","completionProofDoc":{"id":"proof-gst-1","fileName":"GSTR-1_Aug2026_Filing_Acknowledgement_ARN.pdf","fileSize":"245 KB","fileType":"application/pdf","uploadedAt":"10 Sep 2026, 14:15","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260198421","filingDate":"2026-09-10","documentCategory":"Filing Acknowledgement (ARN)","notes":"GSTR-1 outward supplies return filed with DSC on GST portal. Official ARN generated."},"cfoRemarks":"All outward supplies reconciled with e-invoices and e-way bills. B2B invoices tallied perfectly with GSTR-1 ARN.","clientRemarks":"Management verified invoice numbers with dispatch records. Everything accounted for.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f7589c56-fc25-458e-af0f-0108889b8bef',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-2","sNo":2,"category":"GST","name":"IFF – Invoice Furnishing Facility","applicability":"QRMP scheme taxpayers (M1, M2 of quarter)","frequency":"Monthly","statutoryDueDate":"13th of next month","dueDates":["2026-09-13"],"type":"Return","penaltyClause":"No mandatory late fee (optional facility)","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"gst-2-1","subtaskNumber":1,"title":"Compile B2B invoices for the month","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"09 Sep 2026 12:00","completedBy":"Pooja Sharma","notes":"Total 42 B2B invoices compiled with customer GSTINs validated."},{"id":"gst-2-2","subtaskNumber":2,"title":"Review & reconcile with books; CFO approval","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"11 Sep 2026 15:00","completedBy":"Sudhakar","notes":"Books vs e-invoices reconciled. No mismatch."},{"id":"gst-2-3","subtaskNumber":3,"title":"Upload on portal (optional facility)","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"13 Sep 2026","status":"completed","completedAt":"12 Sep 2026 17:45","completedBy":"Rahul Verma","notes":"Submitted on GST portal successfully.","documentRef":"ARN: AA2708260211098"}],"arnOrChallanNo":"AA2708260211098","completionProofDoc":{"id":"proof-gst-2","fileName":"IFF_B2B_Aug2026_Submission_Receipt.pdf","fileSize":"180 KB","fileType":"application/pdf","uploadedAt":"12 Sep 2026, 17:50","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260211098","filingDate":"2026-09-12","documentCategory":"Filing Acknowledgement (ARN)","notes":"Invoice Furnishing Facility submitted on GST portal. Official ARN generated."},"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '79324c0e-070e-42f6-a702-6ae6893610f1',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-3","sNo":3,"category":"GST","name":"GSTR-3B (Summary return & tax payment)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"20th (Monthly); 22nd/24th (QRMP, state-wise)","dueDates":["2026-09-20","2026-09-22","2026-09-24"],"type":"Return + Payment","penaltyClause":"Late fee ₹50/day (₹20/day nil) + 18% p.a. interest on tax","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"gst-3-1","subtaskNumber":1,"title":"Compute output tax & reconcile ITC with GSTR-2B","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"14 Sep 2026","status":"completed","completedAt":"13 Sep 2026 18:00","completedBy":"Rahul Verma","notes":"ITC reconciled with auto-drafted GSTR-2B. ₹1,42,000 ineligible ITC blocked under Sec 17(5)."},{"id":"gst-3-2","subtaskNumber":2,"title":"CFO review of tax liability, ITC eligibility & cash/credit ledger utilisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"17 Sep 2026","status":"completed","completedAt":"15 Sep 2026 11:30","completedBy":"Sudhakar","notes":"Net tax payable after ITC is ₹3,84,500. Cash ledger balance verified. Challan draft cleared."},{"id":"gst-3-3","subtaskNumber":3,"title":"File return & pay tax via challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"20 Sep 2026","status":"pending","notes":"Payment scheduled for 18th Sep via corporate net banking."}],"taxAmount":384500,"cfoRemarks":"Net cash tax payout of ₹3,84,500 finalized after full ITC offset. Payment approved from HDFC current account.","clientRemarks":"Fund transfer mandate of ₹3.85 Lakhs approved by Promoter / Director in banking portal.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '01dfaefa-fb52-4fec-a9e7-c5868fbc5a39',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-4","sNo":4,"category":"GST","name":"CMP-08 (Composition scheme statement-cum-payment)","applicability":"Composition dealers","frequency":"Quarterly","statutoryDueDate":"18th of month following quarter","dueDates":["2026-10-18"],"type":"Return + Payment","penaltyClause":"Interest @18% p.a. + late fee","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-4-1","subtaskNumber":1,"title":"Compile quarterly turnover & tax computation","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"pending","notes":"Awaiting Q2 end turnover summary."},{"id":"gst-4-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Oct 2026","status":"pending"},{"id":"gst-4-3","subtaskNumber":3,"title":"File statement & pay tax","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd822b716-ecfb-4567-91d5-128c60d0159e',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-5","sNo":5,"category":"GST","name":"GSTR-4 (Composition annual return)","applicability":"Composition dealers","frequency":"Annual","statutoryDueDate":"30th April (for preceding FY)","dueDates":["2027-04-30"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day nil), max as prescribed","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"gst-5-1","subtaskNumber":1,"title":"Compile annual turnover & CMP-08 data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Apr 2027","status":"pending"},{"id":"gst-5-2","subtaskNumber":2,"title":"Reconciliation & CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"22 Apr 2027","status":"pending"},{"id":"gst-5-3","subtaskNumber":3,"title":"File annual return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Apr 2027","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '50a5c5d7-8928-4ba3-8063-3f9c8329c8ea',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-6","sNo":6,"category":"GST","name":"GSTR-9 (Annual return)","applicability":"Regular taxpayers (turnover above threshold; optional below)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (₹100+₹100 CGST/SGST), capped at 0.25% of turnover each","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-6-1","subtaskNumber":1,"title":"Compile & reconcile GSTR-1, GSTR-3B and books for the year","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Nov 2026","status":"pending","notes":"Cross-verification of 12 months GSTR-1 vs 3B in progress."},{"id":"gst-6-2","subtaskNumber":2,"title":"CFO review of reconciliation statement and disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Dec 2026","status":"pending"},{"id":"gst-6-3","subtaskNumber":3,"title":"File annual return on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '149d032b-fd5d-44f7-a92f-43a8be1434ea',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-7","sNo":7,"category":"GST","name":"GSTR-9C (Reconciliation Statement)","applicability":"Taxpayers with turnover above prescribed limit (currently >= ₹5 Cr)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Certification","penaltyClause":"Same as GSTR-9 (no separate late fee currently)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-7-1","subtaskNumber":1,"title":"Prepare reconciliation of audited financials with GST returns","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Nov 2026","status":"pending"},{"id":"gst-7-2","subtaskNumber":2,"title":"CFO/auditor review & certification workpapers","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Dec 2026","status":"pending"},{"id":"gst-7-3","subtaskNumber":3,"title":"File along with GSTR-9","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'ed6c8d3e-14fb-4ee9-9c44-1e4946c1e335',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-8","sNo":8,"category":"GST","name":"ITC-04 (Goods sent to job worker)","applicability":"Manufacturers sending goods for job work","frequency":"Half-yearly","statutoryDueDate":"25th of month following half-year","dueDates":["2026-10-25"],"type":"Return","penaltyClause":"Late fee as applicable","period":"H1 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-8-1","subtaskNumber":1,"title":"Compile job-work challans & goods movement data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Oct 2026","status":"pending"},{"id":"gst-8-2","subtaskNumber":2,"title":"CFO review of reconciliation with stock records","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Oct 2026","status":"pending"},{"id":"gst-8-3","subtaskNumber":3,"title":"File ITC-04","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"25 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '1e9f0280-3011-44a3-9457-a8d756be01d7',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-9","sNo":9,"category":"GST","name":"LUT – Letter of Undertaking (for exports without IGST)","applicability":"Exporters","frequency":"Annual","statutoryDueDate":"Before start of FY (31st March)","dueDates":["2026-03-31"],"type":"Application","penaltyClause":"Loss of export-without-tax benefit; IGST payment + refund route instead","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"gst-9-1","subtaskNumber":1,"title":"Prepare export declaration & eligibility check","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Mar 2026","status":"completed","completedAt":"14 Mar 2026","completedBy":"Pooja Sharma"},{"id":"gst-9-2","subtaskNumber":2,"title":"CFO review & authorisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Mar 2026","status":"completed","completedAt":"18 Mar 2026","completedBy":"Sudhakar"},{"id":"gst-9-3","subtaskNumber":3,"title":"File LUT (Form GST RFD-11) on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Mar 2026","status":"completed","completedAt":"22 Mar 2026","completedBy":"Rahul Verma","notes":"Form GST RFD-11 successfully renewed for FY 2026-27.","documentRef":"LUT Ref: AD270326001889"}],"arnOrChallanNo":"AD270326001889","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '58f11988-0899-4e70-9599-0cd56bfc97e7',
  'client-101',
  'GST',
  'Pending',
  '{"id":"gst-10","sNo":10,"category":"GST","name":"E-Way Bill & E-Invoice Compliance Monitoring","applicability":"Applicable dealers based on turnover/threshold","frequency":"Ongoing / Transaction-based","statutoryDueDate":"Before movement of goods / invoice generation","dueDates":["2026-09-30"],"type":"Ongoing Monitoring","penaltyClause":"Detention of goods/penalty on non-generation","period":"Continuous Monitoring","criticality":"High","subtasks":[{"id":"gst-10-1","subtaskNumber":1,"title":"Generate e-way bill/e-invoice for each qualifying transaction","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"Daily","status":"completed","completedAt":"16 Sep 2026","completedBy":"Pooja Sharma","notes":"ERP API integrated with NIC portal. All dispatches accompanied by QR code & e-way bill."},{"id":"gst-10-2","subtaskNumber":2,"title":"CFO spot-review for compliance gaps","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"Weekly","status":"completed","completedAt":"14 Sep 2026","completedBy":"Sudhakar","notes":"Spot audit of 25 shipments conducted. 100% compliance maintained."},{"id":"gst-10-3","subtaskNumber":3,"title":"Periodic compliance confirmation report to client","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"End of Month","status":"completed","completedAt":"31 Aug 2026","completedBy":"Rahul Verma","notes":"Monthly zero-detention certificate issued to client."}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '36c79e90-1319-49fa-a350-1e47d1d5861f',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-11","sNo":11,"category":"TDS / TCS","name":"TDS Payment (Challan 281)","applicability":"All deductors","frequency":"Monthly","statutoryDueDate":"7th of next month (30th April for March)","dueDates":["2026-09-07"],"type":"Payment","penaltyClause":"Interest 1%/1.5% p.m. + disallowance u/s 40(a)(ia)","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"tds-11-1","subtaskNumber":1,"title":"Compute TDS from vouchers/salary/vendor payments","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"03 Sep 2026","status":"completed","completedAt":"03 Sep 2026 17:00","completedBy":"Pooja Sharma","notes":"Sections 192 (Salary), 194C (Contractors), 194J (Professional fees), 194I (Rent) compiled."},{"id":"tds-11-2","subtaskNumber":2,"title":"CFO review of computation & rate applicability","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Sep 2026","status":"completed","completedAt":"05 Sep 2026 14:00","completedBy":"Sudhakar","notes":"Approved net liability of ₹2,15,400. Challan 281 prepared."},{"id":"tds-11-3","subtaskNumber":3,"title":"Pay TDS challan & save receipt","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"07 Sep 2026","status":"completed","completedAt":"06 Sep 2026 11:30","completedBy":"Rahul Verma","notes":"Paid via NSDL/e-filing portal. BSR Code: 0210043, Challan: 10892.","documentRef":"CIN: 02100430609202610892"}],"arnOrChallanNo":"CIN: 02100430609202610892","taxAmount":215400,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e3d4215f-d650-4e74-b871-8f80b73b186d',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-12","sNo":12,"category":"TDS / TCS","name":"TDS Return – Form 24Q (Salary)","applicability":"Employers","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (max = TDS amount) + penalty ₹10k–1L","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-12-1","subtaskNumber":1,"title":"Compile salary & TDS deduction data quarter-wise","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Oct 2026","status":"pending","notes":"Payroll data compilation for Jul-Sep quarter initiated."},{"id":"tds-12-2","subtaskNumber":2,"title":"CFO review of return before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"24 Oct 2026","status":"pending"},{"id":"tds-12-3","subtaskNumber":3,"title":"File e-TDS return on TRACES/portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '30edaa86-116e-425c-a48d-5bb0ec2e16df',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-13","sNo":13,"category":"TDS / TCS","name":"TDS Return – Form 26Q (Non-salary payments)","applicability":"All deductors (non-salary)","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-13-1","subtaskNumber":1,"title":"Compile vendor/contractor TDS data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"18 Oct 2026","status":"pending","notes":"PAN validation and deductee tagging underway in ERP."},{"id":"tds-13-2","subtaskNumber":2,"title":"CFO review & reconciliation with 26AS/AIS","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"pending"},{"id":"tds-13-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'bff435e6-bb0f-4171-9758-9dfa8b201d0f',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-14","sNo":14,"category":"TDS / TCS","name":"TDS Return – Form 27Q (Payments to Non-Residents)","applicability":"Deductors making NR payments","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-14-1","subtaskNumber":1,"title":"Compile NR payment & DTAA/rate data","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"pending"},{"id":"tds-14-2","subtaskNumber":2,"title":"CFO review of applicable rates/treaty benefit","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"pending"},{"id":"tds-14-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd6521dc8-8963-4793-9b18-20cc04f0e07c',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-15","sNo":15,"category":"TDS / TCS","name":"TCS Return – Form 27EQ","applicability":"Collectors of TCS","frequency":"Quarterly","statutoryDueDate":"15 Jul, 15 Oct, 15 Jan, 15 May","dueDates":["2026-07-15","2026-10-15","2027-01-15","2027-05-15"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-15-1","subtaskNumber":1,"title":"Compile TCS collection data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"pending"},{"id":"tds-15-2","subtaskNumber":2,"title":"CFO review before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Oct 2026","status":"pending"},{"id":"tds-15-3","subtaskNumber":3,"title":"File e-TCS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'df777b72-b06e-4177-96db-87d7e4415ded',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-16","sNo":16,"category":"TDS / TCS","name":"Form 16 Issuance (Salary TDS certificate)","applicability":"Employers","frequency":"Annual","statutoryDueDate":"15th June","dueDates":["2026-06-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"tds-16-1","subtaskNumber":1,"title":"Generate Part A/B from TRACES post 24Q filing","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jun 2026","status":"completed","completedAt":"03 Jun 2026","completedBy":"Amit Patel"},{"id":"tds-16-2","subtaskNumber":2,"title":"CFO review for accuracy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jun 2026","status":"completed","completedAt":"08 Jun 2026","completedBy":"Sudhakar"},{"id":"tds-16-3","subtaskNumber":3,"title":"Issue Form 16 to employees","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jun 2026","status":"completed","completedAt":"12 Jun 2026","completedBy":"Amit Patel","notes":"Digitally signed and emailed to all 84 eligible employees."}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '4623d7bb-a0eb-45db-b71c-feeb02c87c66',
  'client-101',
  'TDS / TCS',
  'Pending',
  '{"id":"tds-17","sNo":17,"category":"TDS / TCS","name":"Form 16A Issuance (Non-salary TDS certificate)","applicability":"All deductors","frequency":"Quarterly","statutoryDueDate":"Within 15 days of return due date","dueDates":["2026-08-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"Q1 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-17-1","subtaskNumber":1,"title":"Generate from TRACES post 26Q/27Q filing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Aug 2026","status":"completed","completedAt":"08 Aug 2026","completedBy":"Pooja Sharma"},{"id":"tds-17-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Aug 2026","status":"completed","completedAt":"10 Aug 2026","completedBy":"Sudhakar"},{"id":"tds-17-3","subtaskNumber":3,"title":"Issue to deductees","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Aug 2026","status":"completed","completedAt":"14 Aug 2026","completedBy":"Pooja Sharma","notes":"Issued to all vendors via email portal."}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'a00902ae-606e-4848-8442-2840188199c7',
  'client-101',
  'Income Tax',
  'Pending',
  '{"id":"it-18","sNo":18,"category":"Income Tax","name":"Advance Tax Payment","applicability":"Assessees with tax liability > ₹10,000 p.a.","frequency":"Quarterly","statutoryDueDate":"15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)","dueDates":["2026-06-15","2026-09-15","2026-12-15","2027-03-15"],"type":"Payment","penaltyClause":"Interest u/s 234B/234C","period":"Q2 (45% Cumulative) - Sep 2026","criticality":"Critical","subtasks":[{"id":"it-18-1","subtaskNumber":1,"title":"Estimate annual income & tax liability","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"08 Sep 2026","status":"completed","completedAt":"07 Sep 2026 15:40","completedBy":"Pooja Sharma","notes":"Projected annual PBT at ₹3.2 Cr; estimated total tax ₹80 Lakhs. 45% installment computed at ₹36 Lakhs less ₹12L paid in Q1."},{"id":"it-18-2","subtaskNumber":2,"title":"CFO review of estimate vs actuals","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"11 Sep 2026 17:30","completedBy":"Sudhakar","notes":"Refined model factoring depreciation and R&D credits. Net payable ₹24,00,000 approved."},{"id":"it-18-3","subtaskNumber":3,"title":"Pay advance tax challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Sep 2026","status":"completed","completedAt":"15 Sep 2026 16:15","completedBy":"Rahul Verma","notes":"Paid via OLTAS Challan 280. BSR: 0002198, CRN: 89912049.","documentRef":"BSR: 0002198 Challan: 89912049"}],"arnOrChallanNo":"BSR: 0002198 Challan: 89912049","taxAmount":2400000,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'bcd965e3-3a9b-419d-bc30-b2a52183b7ef',
  'client-101',
  'Income Tax',
  'Pending',
  '{"id":"it-19","sNo":19,"category":"Income Tax","name":"Income Tax Return (ITR) Filing","applicability":"All entities/individuals","frequency":"Annual","statutoryDueDate":"31 Jul (non-audit); 31 Oct (audit cases); 30 Nov (TP cases)","dueDates":["2026-07-31","2026-10-31","2026-11-30"],"type":"Return","penaltyClause":"Late filing fee u/s 234F (₹1,000–5,000) + interest","period":"AY 2026-27 (FY 25-26)","criticality":"Critical","subtasks":[{"id":"it-19-1","subtaskNumber":1,"title":"Finalise books & compile computation data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Sep 2026","status":"completed","completedAt":"15 Sep 2026","completedBy":"Pooja Sharma","notes":"Audited balance sheet schedules and tax computation model draft ready."},{"id":"it-19-2","subtaskNumber":2,"title":"CFO review of computation, deductions & disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Oct 2026","status":"pending","notes":"Under review by CFO team along with statutory auditor remarks."},{"id":"it-19-3","subtaskNumber":3,"title":"File ITR & e-verify","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'b8a33f68-9fdc-4250-b45c-f4b2d28d7cc5',
  'client-101',
  'Income Tax',
  'Pending',
  '{"id":"it-20","sNo":20,"category":"Income Tax","name":"Tax Audit Report (Form 3CA/3CB-3CD)","applicability":"Entities exceeding turnover/receipt thresholds","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Audit Report","penaltyClause":"Lower of 0.5% of turnover or ₹1,50,000","period":"AY 2026-27","criticality":"Critical","subtasks":[{"id":"it-20-1","subtaskNumber":1,"title":"Compile financials & audit schedules","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Sep 2026","status":"completed","completedAt":"10 Sep 2026 19:00","completedBy":"Pooja Sharma","notes":"Clause 44 (GST expenditure breakup) and Clause 34 (TDS compliance) annexures compiled."},{"id":"it-20-2","subtaskNumber":2,"title":"CFO/auditor review of tax audit annexures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Sep 2026","status":"pending","notes":"Review in final stages with statutory auditor M/s Singhal & Co."},{"id":"it-20-3","subtaskNumber":3,"title":"CA uploads Form 3CD; assessee accepts on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Sep 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '15cb9f05-5892-43ed-b7f4-1723b204137a',
  'client-101',
  'Income Tax',
  'Pending',
  '{"id":"it-21","sNo":21,"category":"Income Tax","name":"Transfer Pricing Report (Form 3CEB)","applicability":"Entities with international/specified domestic transactions","frequency":"Annual","statutoryDueDate":"31st October","dueDates":["2026-10-31"],"type":"Audit Report","penaltyClause":"Penalty ₹1,00,000 for non-filing","period":"AY 2026-27","criticality":"High","subtasks":[{"id":"it-21-1","subtaskNumber":1,"title":"Compile related-party transaction data & benchmarking","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"05 Oct 2026","status":"pending","notes":"Intercompany software development services agreements gathered."},{"id":"it-21-2","subtaskNumber":2,"title":"CFO review of TP study & pricing policy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"pending"},{"id":"it-21-3","subtaskNumber":3,"title":"CA uploads Form 3CEB","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '6d1939df-e663-4efc-b217-ac697f92489f',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-22","sNo":22,"category":"ROC / MCA","name":"AOC-4 (Filing of Financial Statements)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 30 days of AGM","dueDates":["2026-10-28"],"type":"Filing","penaltyClause":"Additional fee per day of delay (up to 12x normal fee)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-22-1","subtaskNumber":1,"title":"Finalise audited financials & board report","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"05 Oct 2026","status":"pending","notes":"Awaiting AGM adoption on 28th September 2026."},{"id":"roc-22-2","subtaskNumber":2,"title":"CFO review of attachments & XBRL data","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Oct 2026","status":"pending"},{"id":"roc-22-3","subtaskNumber":3,"title":"File AOC-4 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"28 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '80f93e53-75f4-4f7e-ae6a-783996224070',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-23","sNo":23,"category":"ROC / MCA","name":"MGT-7 / MGT-7A (Annual Return)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 60 days of AGM","dueDates":["2026-11-27"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-23-1","subtaskNumber":1,"title":"Compile shareholding, director & compliance data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Oct 2026","status":"pending"},{"id":"roc-23-2","subtaskNumber":2,"title":"CFO/CS review of annual return draft","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"05 Nov 2026","status":"pending"},{"id":"roc-23-3","subtaskNumber":3,"title":"File MGT-7/7A on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"27 Nov 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'eb4637ec-e7da-417e-8198-e8b74f7bfe42',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-24","sNo":24,"category":"ROC / MCA","name":"DIR-3 KYC (Director KYC)","applicability":"All DIN holders","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Filing","penaltyClause":"₹5,000 penalty + DIN deactivation","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"roc-24-1","subtaskNumber":1,"title":"Collect director KYC documents/OTP details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"08 Sep 2026","completedBy":"Pooja Sharma","notes":"Both directors mobile & email OTP validation test successful."},{"id":"roc-24-2","subtaskNumber":2,"title":"Verification & CFO/CS sign-off","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Sep 2026","status":"completed","completedAt":"14 Sep 2026","completedBy":"Sudhakar","notes":"Director details cross-matched with MCA Master Data."},{"id":"roc-24-3","subtaskNumber":3,"title":"File DIR-3 KYC / web-KYC","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Sep 2026","status":"pending","notes":"Web-KYC pending OTP triggering on client portal."}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '328fc21c-79fc-4b76-b5e6-c72918ab52b6',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-25","sNo":25,"category":"ROC / MCA","name":"ADT-1 (Auditor Appointment/Reappointment)","applicability":"All companies","frequency":"Event-based","statutoryDueDate":"Within 15 days of AGM","dueDates":["2026-10-13"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"AGM FY 25-26","criticality":"Medium","subtasks":[{"id":"roc-25-1","subtaskNumber":1,"title":"Obtain auditor consent & eligibility certificate","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Sep 2026","status":"completed","completedAt":"12 Sep 2026","completedBy":"Pooja Sharma","notes":"Received eligibility letter from M/s Singhal & Co under Sec 139 & 141."},{"id":"roc-25-2","subtaskNumber":2,"title":"CFO/CS review of resolution & form","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"completed","completedAt":"14 Sep 2026","completedBy":"CS Alok Mehta"},{"id":"roc-25-3","subtaskNumber":3,"title":"File ADT-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"13 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'bdf3c2cc-0647-41cb-b635-ff8723165bb1',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-26","sNo":26,"category":"ROC / MCA","name":"DPT-3 (Return of Deposits/Loans)","applicability":"All companies (other than govt. co.)","frequency":"Annual","statutoryDueDate":"30th June","dueDates":["2026-06-30"],"type":"Filing","penaltyClause":"Additional fee + penalty on company & officers","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-26-1","subtaskNumber":1,"title":"Compile outstanding loans/deposits data as on 31 March","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Jun 2026","status":"completed","completedAt":"08 Jun 2026","completedBy":"Pooja Sharma"},{"id":"roc-26-2","subtaskNumber":2,"title":"CFO review of classification (deposit vs exempted)","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Jun 2026","status":"completed","completedAt":"15 Jun 2026","completedBy":"Sudhakar"},{"id":"roc-26-3","subtaskNumber":3,"title":"File DPT-3 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Jun 2026","status":"completed","completedAt":"25 Jun 2026","completedBy":"CS Alok Mehta","documentRef":"SRN: T29841029"}],"arnOrChallanNo":"SRN: T29841029","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '6e5fb2b8-6dd3-4550-989e-53819f726f1a',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-27","sNo":27,"category":"ROC / MCA","name":"MSME-1 (Outstanding payments to MSME > 45 days)","applicability":"Companies with MSME dues","frequency":"Half-yearly","statutoryDueDate":"30 Apr (Oct–Mar); 31 Oct (Apr–Sep)","dueDates":["2026-04-30","2026-10-31"],"type":"Filing","penaltyClause":"Penalty on company & officers for non-filing","period":"Apr - Sep 2026","criticality":"High","subtasks":[{"id":"roc-27-1","subtaskNumber":1,"title":"Compile outstanding MSME vendor ageing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Oct 2026","status":"pending","notes":"Tracking MSME vendor invoices > 45 days under Section 43B(h)."},{"id":"roc-27-2","subtaskNumber":2,"title":"CFO review & reconciliation with payables","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"pending"},{"id":"roc-27-3","subtaskNumber":3,"title":"File MSME-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd1cb7864-a38d-4f5c-a353-ca86ffb30134',
  'client-101',
  'ROC / MCA',
  'Pending',
  '{"id":"roc-28","sNo":28,"category":"ROC / MCA","name":"Board Meetings & Minutes","applicability":"All companies","frequency":"Quarterly","statutoryDueDate":"Gap not exceeding 120 days between meetings","dueDates":["2026-09-25"],"type":"Governance","penaltyClause":"Penalty under Companies Act for non-compliance","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"roc-28-1","subtaskNumber":1,"title":"Prepare agenda, notice & supporting papers","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"05 Sep 2026","status":"completed","completedAt":"04 Sep 2026","completedBy":"Pooja Sharma"},{"id":"roc-28-2","subtaskNumber":2,"title":"CFO briefing note & CFO/CS review of draft minutes","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"10 Sep 2026","completedBy":"Sudhakar","notes":"Financial MIS and expansion budget presentation attached."},{"id":"roc-28-3","subtaskNumber":3,"title":"Circulate & finalise signed minutes","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"pending","notes":"Draft minutes circulated to directors for sign-off."}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd501075b-17a4-4769-8983-efb27748ece6',
  'client-101',
  'PF / ESI',
  'Pending',
  '{"id":"pf-29","sNo":29,"category":"PF / ESI","name":"PF Payment","applicability":"Establishments with 20+ employees (or covered voluntarily)","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages up to 25%","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"pf-29-1","subtaskNumber":1,"title":"Compute PF contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"07 Sep 2026 14:00","completedBy":"Amit Patel","notes":"84 employees, wage ceiling checked. Total liability ₹2,42,800."},{"id":"pf-29-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"10 Sep 2026 16:30","completedBy":"Sudhakar","notes":"Reconciled with salary register."},{"id":"pf-29-3","subtaskNumber":3,"title":"Pay via ECR portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"13 Sep 2026 12:45","completedBy":"Amit Patel","notes":"Paid via EPFO unified portal.","documentRef":"TRRN: 1012609048912"}],"arnOrChallanNo":"TRRN: 1012609048912","taxAmount":242800,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '84d51f1a-b40b-4fed-8a99-883b5fb4c8ac',
  'client-101',
  'PF / ESI',
  'Pending',
  '{"id":"pf-30","sNo":30,"category":"PF / ESI","name":"PF Return (ECR)","applicability":"Covered establishments","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Return","penaltyClause":"Same as PF payment default","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-30-1","subtaskNumber":1,"title":"Prepare Electronic Challan-cum-Return from payroll data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"07 Sep 2026","completedBy":"Amit Patel"},{"id":"pf-30-2","subtaskNumber":2,"title":"CFO review before submission","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"10 Sep 2026","completedBy":"Sudhakar"},{"id":"pf-30-3","subtaskNumber":3,"title":"Submit ECR on EPFO portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"13 Sep 2026","completedBy":"Amit Patel","documentRef":"ECR Challan: 1012609048912"}],"arnOrChallanNo":"ECR Challan: 1012609048912","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '7e81c419-bc5a-4e22-b003-ce05220b6ed5',
  'client-101',
  'PF / ESI',
  'Pending',
  '{"id":"pf-31","sNo":31,"category":"PF / ESI","name":"ESI Payment","applicability":"Establishments with 10+ employees & wage threshold","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-31-1","subtaskNumber":1,"title":"Compute ESI contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"07 Sep 2026","completedBy":"Amit Patel","notes":"Covered wage count verified for 32 employees."},{"id":"pf-31-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"10 Sep 2026","completedBy":"Sudhakar"},{"id":"pf-31-3","subtaskNumber":3,"title":"Pay via ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"13 Sep 2026","completedBy":"Amit Patel","documentRef":"ESIC Challan: 031261099231"}],"arnOrChallanNo":"ESIC Challan: 031261099231","taxAmount":48600,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd7214961-c777-408e-a1ed-6cdf4aae05e5',
  'client-101',
  'PF / ESI',
  'Pending',
  '{"id":"pf-32","sNo":32,"category":"PF / ESI","name":"ESI Return","applicability":"Covered establishments","frequency":"Half-yearly","statutoryDueDate":"11 May (Oct–Mar); 11 Nov (Apr–Sep)","dueDates":["2026-05-11","2026-11-11"],"type":"Return","penaltyClause":"Penalty & prosecution risk on default","period":"Apr - Sep 2026","criticality":"Medium","subtasks":[{"id":"pf-32-1","subtaskNumber":1,"title":"Compile half-yearly contribution data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"25 Oct 2026","status":"pending"},{"id":"pf-32-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Nov 2026","status":"pending"},{"id":"pf-32-3","subtaskNumber":3,"title":"File return on ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"11 Nov 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'b73ae80c-b64e-4369-a255-4939079ac399',
  'client-101',
  'Professional Tax & State',
  'Pending',
  '{"id":"pt-33","sNo":33,"category":"Professional Tax & State","name":"Professional Tax Payment & Return","applicability":"Employers/professionals (state-specific)","frequency":"Monthly","statutoryDueDate":"Varies by state (commonly 15th/20th/30th)","dueDates":["2026-09-20","2026-09-30"],"type":"Payment + Return","penaltyClause":"State-specific interest/penalty","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"pt-33-1","subtaskNumber":1,"title":"Compute PT liability per state slab","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"09 Sep 2026","completedBy":"Pooja Sharma","notes":"Maharashtra & Karnataka PT schedules mapped. ₹16,800 total."},{"id":"pt-33-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Sep 2026","status":"completed","completedAt":"12 Sep 2026","completedBy":"Sudhakar"},{"id":"pt-33-3","subtaskNumber":3,"title":"Pay & file return on state portal","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"20 Sep 2026","status":"pending","notes":"Scheduled for payment on 18th Sep."}],"taxAmount":16800,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9b28b144-e53c-4a4d-80de-a8ce2bd9abef',
  'client-101',
  'Professional Tax & State',
  'Pending',
  '{"id":"pt-34","sNo":34,"category":"Professional Tax & State","name":"Shops & Establishment Registration Renewal","applicability":"Establishments under S&E Act","frequency":"Annual","statutoryDueDate":"Before expiry of registration","dueDates":["2026-11-30"],"type":"Renewal","penaltyClause":"Penalty/fine as per state act","period":"2026-27 Renewal","criticality":"Medium","subtasks":[{"id":"pt-34-1","subtaskNumber":1,"title":"Compile establishment & employee details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"01 Nov 2026","status":"pending"},{"id":"pt-34-2","subtaskNumber":2,"title":"CFO review of documents","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Nov 2026","status":"pending"},{"id":"pt-34-3","subtaskNumber":3,"title":"Submit renewal application","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Nov 2026","status":"pending"}],"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e15cbb75-2885-43da-9e4a-f8c9cca4208c',
  'client-101',
  'Professional Tax & State',
  'Pending',
  '{"id":"pt-35","sNo":35,"category":"Professional Tax & State","name":"Labour Welfare Fund (LWF) Contribution","applicability":"Establishments in applicable states","frequency":"Half-yearly","statutoryDueDate":"Varies by state (15th Jan & 15th July)","dueDates":["2026-01-15","2026-07-15"],"type":"Payment","penaltyClause":"State-specific penalty","period":"H1 2026","criticality":"Low","subtasks":[{"id":"pt-35-1","subtaskNumber":1,"title":"Compute contribution per employee count","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jul 2026","status":"completed","completedAt":"04 Jul 2026","completedBy":"Amit Patel"},{"id":"pt-35-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jul 2026","status":"completed","completedAt":"08 Jul 2026","completedBy":"Sudhakar"},{"id":"pt-35-3","subtaskNumber":3,"title":"Pay to state Labour Welfare Board","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jul 2026","status":"completed","completedAt":"12 Jul 2026","completedBy":"Amit Patel","documentRef":"LWF Receipt: LWF-MH-2026-9042"}],"arnOrChallanNo":"LWF-MH-2026-9042","taxAmount":4200,"companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9b7b6198-27dc-4d90-8998-02a92a34caaf',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-1","sNo":1,"category":"GST","name":"GSTR-1 (Outward supplies)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"11th of next month (Monthly); 13th of month after quarter (QRMP)","dueDates":["2026-09-11","2026-10-13"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day for nil) + interest","period":"Aug 2026","criticality":"High","subtasks":[{"id":"gst-1-1","subtaskNumber":1,"title":"Compile sales register & invoice-wise data; upload to GST tool","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"06 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Sales register matched with ERP sales vouchers. B2B & B2C summaries ready."},{"id":"gst-1-2","subtaskNumber":2,"title":"Reconcile with sales ledger & e-invoice/e-way bill data; CFO sign-off on draft","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"09 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)","notes":"Reconciliation verified against IRN list. Minor credit note adjustment reconciled. Approved."},{"id":"gst-1-3","subtaskNumber":3,"title":"File GSTR-1 on GST portal; save ARN/acknowledgment","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"11 Sep 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","notes":"Filed with DSC. ARN generated & archived in Google Drive.","documentRef":"ARN: AA2708260198421"}],"arnOrChallanNo":"APEX-CHL-9200","completionProofDoc":{"id":"proof-gst-1","fileName":"GSTR-1_Aug2026_Filing_Acknowledgement_ARN.pdf","fileSize":"245 KB","fileType":"application/pdf","uploadedAt":"10 Sep 2026, 14:15","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260198421","filingDate":"2026-09-10","documentCategory":"Filing Acknowledgement (ARN)","notes":"GSTR-1 outward supplies return filed with DSC on GST portal. Official ARN generated."},"cfoRemarks":"All outward supplies reconciled with e-invoices and e-way bills. B2B invoices tallied perfectly with GSTR-1 ARN.","clientRemarks":"Management verified invoice numbers with dispatch records. Everything accounted for.","companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '77b70ac3-74ce-4059-9967-1012b04e568c',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-2","sNo":2,"category":"GST","name":"IFF – Invoice Furnishing Facility","applicability":"QRMP scheme taxpayers (M1, M2 of quarter)","frequency":"Monthly","statutoryDueDate":"13th of next month","dueDates":["2026-09-13"],"type":"Return","penaltyClause":"No mandatory late fee (optional facility)","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"gst-2-1","subtaskNumber":1,"title":"Compile B2B invoices for the month","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Total 42 B2B invoices compiled with customer GSTINs validated."},{"id":"gst-2-2","subtaskNumber":2,"title":"Review & reconcile with books; CFO approval","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending","notes":"Books vs e-invoices reconciled. No mismatch."},{"id":"gst-2-3","subtaskNumber":3,"title":"Upload on portal (optional facility)","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"13 Sep 2026","status":"pending","notes":"Submitted on GST portal successfully.","documentRef":"ARN: AA2708260211098"}],"completionProofDoc":{"id":"proof-gst-2","fileName":"IFF_B2B_Aug2026_Submission_Receipt.pdf","fileSize":"180 KB","fileType":"application/pdf","uploadedAt":"12 Sep 2026, 17:50","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260211098","filingDate":"2026-09-12","documentCategory":"Filing Acknowledgement (ARN)","notes":"Invoice Furnishing Facility submitted on GST portal. Official ARN generated."},"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '328fc7f0-995b-42c8-aa5b-14e7dd1a0f42',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-3","sNo":3,"category":"GST","name":"GSTR-3B (Summary return & tax payment)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"20th (Monthly); 22nd/24th (QRMP, state-wise)","dueDates":["2026-09-20","2026-09-22","2026-09-24"],"type":"Return + Payment","penaltyClause":"Late fee ₹50/day (₹20/day nil) + 18% p.a. interest on tax","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"gst-3-1","subtaskNumber":1,"title":"Compute output tax & reconcile ITC with GSTR-2B","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"14 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"ITC reconciled with auto-drafted GSTR-2B. ₹1,42,000 ineligible ITC blocked under Sec 17(5)."},{"id":"gst-3-2","subtaskNumber":2,"title":"CFO review of tax liability, ITC eligibility & cash/credit ledger utilisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"17 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)","notes":"Net tax payable after ITC is ₹3,84,500. Cash ledger balance verified. Challan draft cleared."},{"id":"gst-3-3","subtaskNumber":3,"title":"File return & pay tax via challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"20 Sep 2026","status":"completed","notes":"Payment scheduled for 18th Sep via corporate net banking.","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"taxAmount":384500,"cfoRemarks":"Net cash tax payout of ₹3,84,500 finalized after full ITC offset. Payment approved from HDFC current account.","clientRemarks":"Fund transfer mandate of ₹3.85 Lakhs approved by Promoter / Director in banking portal.","companyId":"client-102","arnOrChallanNo":"APEX-CHL-9202"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '7e71e5b2-be68-433f-9533-0675463b3569',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-4","sNo":4,"category":"GST","name":"CMP-08 (Composition scheme statement-cum-payment)","applicability":"Composition dealers","frequency":"Quarterly","statutoryDueDate":"18th of month following quarter","dueDates":["2026-10-18"],"type":"Return + Payment","penaltyClause":"Interest @18% p.a. + late fee","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-4-1","subtaskNumber":1,"title":"Compile quarterly turnover & tax computation","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"pending","notes":"Awaiting Q2 end turnover summary."},{"id":"gst-4-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Oct 2026","status":"pending"},{"id":"gst-4-3","subtaskNumber":3,"title":"File statement & pay tax","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '27a2b91a-1184-430f-a546-73ff646256d3',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-5","sNo":5,"category":"GST","name":"GSTR-4 (Composition annual return)","applicability":"Composition dealers","frequency":"Annual","statutoryDueDate":"30th April (for preceding FY)","dueDates":["2027-04-30"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day nil), max as prescribed","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"gst-5-1","subtaskNumber":1,"title":"Compile annual turnover & CMP-08 data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Apr 2027","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"gst-5-2","subtaskNumber":2,"title":"Reconciliation & CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"22 Apr 2027","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"gst-5-3","subtaskNumber":3,"title":"File annual return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Apr 2027","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9204"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '2363ffa8-07ee-41b8-b5db-18463b4de003',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-6","sNo":6,"category":"GST","name":"GSTR-9 (Annual return)","applicability":"Regular taxpayers (turnover above threshold; optional below)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (₹100+₹100 CGST/SGST), capped at 0.25% of turnover each","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-6-1","subtaskNumber":1,"title":"Compile & reconcile GSTR-1, GSTR-3B and books for the year","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Nov 2026","status":"pending","notes":"Cross-verification of 12 months GSTR-1 vs 3B in progress."},{"id":"gst-6-2","subtaskNumber":2,"title":"CFO review of reconciliation statement and disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Dec 2026","status":"pending"},{"id":"gst-6-3","subtaskNumber":3,"title":"File annual return on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'a42712f8-86e3-4eda-bbe2-dc948079c830',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-7","sNo":7,"category":"GST","name":"GSTR-9C (Reconciliation Statement)","applicability":"Taxpayers with turnover above prescribed limit (currently >= ₹5 Cr)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Certification","penaltyClause":"Same as GSTR-9 (no separate late fee currently)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-7-1","subtaskNumber":1,"title":"Prepare reconciliation of audited financials with GST returns","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Nov 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"gst-7-2","subtaskNumber":2,"title":"CFO/auditor review & certification workpapers","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Dec 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"gst-7-3","subtaskNumber":3,"title":"File along with GSTR-9","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9206"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '84d88562-04a4-4dd6-bd65-a35afdf37f51',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-8","sNo":8,"category":"GST","name":"ITC-04 (Goods sent to job worker)","applicability":"Manufacturers sending goods for job work","frequency":"Half-yearly","statutoryDueDate":"25th of month following half-year","dueDates":["2026-10-25"],"type":"Return","penaltyClause":"Late fee as applicable","period":"H1 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-8-1","subtaskNumber":1,"title":"Compile job-work challans & goods movement data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Oct 2026","status":"pending"},{"id":"gst-8-2","subtaskNumber":2,"title":"CFO review of reconciliation with stock records","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Oct 2026","status":"pending"},{"id":"gst-8-3","subtaskNumber":3,"title":"File ITC-04","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"25 Oct 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '27771456-0354-4f91-9c34-9119faf8eb35',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-9","sNo":9,"category":"GST","name":"LUT – Letter of Undertaking (for exports without IGST)","applicability":"Exporters","frequency":"Annual","statutoryDueDate":"Before start of FY (31st March)","dueDates":["2026-03-31"],"type":"Application","penaltyClause":"Loss of export-without-tax benefit; IGST payment + refund route instead","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"gst-9-1","subtaskNumber":1,"title":"Prepare export declaration & eligibility check","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Mar 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"gst-9-2","subtaskNumber":2,"title":"CFO review & authorisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Mar 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"gst-9-3","subtaskNumber":3,"title":"File LUT (Form GST RFD-11) on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Mar 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","notes":"Form GST RFD-11 successfully renewed for FY 2026-27.","documentRef":"LUT Ref: AD270326001889"}],"arnOrChallanNo":"APEX-CHL-9208","companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e9eab74d-10a2-405d-8da6-c2a5c08bc9b8',
  'client-102',
  'GST',
  'Pending',
  '{"id":"apex-gst-10","sNo":10,"category":"GST","name":"E-Way Bill & E-Invoice Compliance Monitoring","applicability":"Applicable dealers based on turnover/threshold","frequency":"Ongoing / Transaction-based","statutoryDueDate":"Before movement of goods / invoice generation","dueDates":["2026-09-30"],"type":"Ongoing Monitoring","penaltyClause":"Detention of goods/penalty on non-generation","period":"Continuous Monitoring","criticality":"High","subtasks":[{"id":"gst-10-1","subtaskNumber":1,"title":"Generate e-way bill/e-invoice for each qualifying transaction","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"Daily","status":"pending","notes":"ERP API integrated with NIC portal. All dispatches accompanied by QR code & e-way bill."},{"id":"gst-10-2","subtaskNumber":2,"title":"CFO spot-review for compliance gaps","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"Weekly","status":"pending","notes":"Spot audit of 25 shipments conducted. 100% compliance maintained."},{"id":"gst-10-3","subtaskNumber":3,"title":"Periodic compliance confirmation report to client","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"End of Month","status":"pending","notes":"Monthly zero-detention certificate issued to client."}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '36abedc5-5e1a-4c6e-8ddf-4200bd6f3807',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-11","sNo":11,"category":"TDS / TCS","name":"TDS Payment (Challan 281)","applicability":"All deductors","frequency":"Monthly","statutoryDueDate":"7th of next month (30th April for March)","dueDates":["2026-09-07"],"type":"Payment","penaltyClause":"Interest 1%/1.5% p.m. + disallowance u/s 40(a)(ia)","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"tds-11-1","subtaskNumber":1,"title":"Compute TDS from vouchers/salary/vendor payments","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"03 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Sections 192 (Salary), 194C (Contractors), 194J (Professional fees), 194I (Rent) compiled."},{"id":"tds-11-2","subtaskNumber":2,"title":"CFO review of computation & rate applicability","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)","notes":"Approved net liability of ₹2,15,400. Challan 281 prepared."},{"id":"tds-11-3","subtaskNumber":3,"title":"Pay TDS challan & save receipt","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"07 Sep 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","notes":"Paid via NSDL/e-filing portal. BSR Code: 0210043, Challan: 10892.","documentRef":"CIN: 02100430609202610892"}],"arnOrChallanNo":"APEX-CHL-9210","taxAmount":215400,"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e45a5276-5c60-4981-80cd-6458afce0cab',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-12","sNo":12,"category":"TDS / TCS","name":"TDS Return – Form 24Q (Salary)","applicability":"Employers","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (max = TDS amount) + penalty ₹10k–1L","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-12-1","subtaskNumber":1,"title":"Compile salary & TDS deduction data quarter-wise","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Oct 2026","status":"completed","notes":"Payroll data compilation for Jul-Sep quarter initiated.","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"tds-12-2","subtaskNumber":2,"title":"CFO review of return before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"24 Oct 2026","status":"pending"},{"id":"tds-12-3","subtaskNumber":3,"title":"File e-TDS return on TRACES/portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '7e9a58c7-66b8-4663-af60-5be380b69a9f',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-13","sNo":13,"category":"TDS / TCS","name":"TDS Return – Form 26Q (Non-salary payments)","applicability":"All deductors (non-salary)","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-13-1","subtaskNumber":1,"title":"Compile vendor/contractor TDS data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"18 Oct 2026","status":"completed","notes":"PAN validation and deductee tagging underway in ERP.","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"tds-13-2","subtaskNumber":2,"title":"CFO review & reconciliation with 26AS/AIS","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"tds-13-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9212"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '1df2d553-e561-4c54-b618-c428d3e63820',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-14","sNo":14,"category":"TDS / TCS","name":"TDS Return – Form 27Q (Payments to Non-Residents)","applicability":"Deductors making NR payments","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-14-1","subtaskNumber":1,"title":"Compile NR payment & DTAA/rate data","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"pending"},{"id":"tds-14-2","subtaskNumber":2,"title":"CFO review of applicable rates/treaty benefit","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"pending"},{"id":"tds-14-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9b87c7c2-a276-4a72-afb9-f195641f08cb',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-15","sNo":15,"category":"TDS / TCS","name":"TCS Return – Form 27EQ","applicability":"Collectors of TCS","frequency":"Quarterly","statutoryDueDate":"15 Jul, 15 Oct, 15 Jan, 15 May","dueDates":["2026-07-15","2026-10-15","2027-01-15","2027-05-15"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-15-1","subtaskNumber":1,"title":"Compile TCS collection data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"tds-15-2","subtaskNumber":2,"title":"CFO review before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Oct 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"tds-15-3","subtaskNumber":3,"title":"File e-TCS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9214"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '4f163d85-3372-415f-ad04-cddeec08effe',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-16","sNo":16,"category":"TDS / TCS","name":"Form 16 Issuance (Salary TDS certificate)","applicability":"Employers","frequency":"Annual","statutoryDueDate":"15th June","dueDates":["2026-06-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"tds-16-1","subtaskNumber":1,"title":"Generate Part A/B from TRACES post 24Q filing","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jun 2026","status":"pending"},{"id":"tds-16-2","subtaskNumber":2,"title":"CFO review for accuracy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jun 2026","status":"pending"},{"id":"tds-16-3","subtaskNumber":3,"title":"Issue Form 16 to employees","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jun 2026","status":"pending","notes":"Digitally signed and emailed to all 84 eligible employees."}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f3a6620b-e02c-4cb3-88e2-d140dc75fb58',
  'client-102',
  'TDS / TCS',
  'Pending',
  '{"id":"apex-tds-17","sNo":17,"category":"TDS / TCS","name":"Form 16A Issuance (Non-salary TDS certificate)","applicability":"All deductors","frequency":"Quarterly","statutoryDueDate":"Within 15 days of return due date","dueDates":["2026-08-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"Q1 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-17-1","subtaskNumber":1,"title":"Generate from TRACES post 26Q/27Q filing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Aug 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"tds-17-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Aug 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"tds-17-3","subtaskNumber":3,"title":"Issue to deductees","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Aug 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","notes":"Issued to all vendors via email portal."}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9216"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e91395bd-2f22-45d0-9fb9-36605166f6cd',
  'client-102',
  'Income Tax',
  'Pending',
  '{"id":"apex-it-18","sNo":18,"category":"Income Tax","name":"Advance Tax Payment","applicability":"Assessees with tax liability > ₹10,000 p.a.","frequency":"Quarterly","statutoryDueDate":"15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)","dueDates":["2026-06-15","2026-09-15","2026-12-15","2027-03-15"],"type":"Payment","penaltyClause":"Interest u/s 234B/234C","period":"Q2 (45% Cumulative) - Sep 2026","criticality":"Critical","subtasks":[{"id":"it-18-1","subtaskNumber":1,"title":"Estimate annual income & tax liability","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"08 Sep 2026","status":"pending","notes":"Projected annual PBT at ₹3.2 Cr; estimated total tax ₹80 Lakhs. 45% installment computed at ₹36 Lakhs less ₹12L paid in Q1."},{"id":"it-18-2","subtaskNumber":2,"title":"CFO review of estimate vs actuals","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending","notes":"Refined model factoring depreciation and R&D credits. Net payable ₹24,00,000 approved."},{"id":"it-18-3","subtaskNumber":3,"title":"Pay advance tax challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Sep 2026","status":"pending","notes":"Paid via OLTAS Challan 280. BSR: 0002198, CRN: 89912049.","documentRef":"BSR: 0002198 Challan: 89912049"}],"taxAmount":2400000,"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '0d42b102-7479-4912-9b26-5708c3d006db',
  'client-102',
  'Income Tax',
  'Pending',
  '{"id":"apex-it-19","sNo":19,"category":"Income Tax","name":"Income Tax Return (ITR) Filing","applicability":"All entities/individuals","frequency":"Annual","statutoryDueDate":"31 Jul (non-audit); 31 Oct (audit cases); 30 Nov (TP cases)","dueDates":["2026-07-31","2026-10-31","2026-11-30"],"type":"Return","penaltyClause":"Late filing fee u/s 234F (₹1,000–5,000) + interest","period":"AY 2026-27 (FY 25-26)","criticality":"Critical","subtasks":[{"id":"it-19-1","subtaskNumber":1,"title":"Finalise books & compile computation data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Audited balance sheet schedules and tax computation model draft ready."},{"id":"it-19-2","subtaskNumber":2,"title":"CFO review of computation, deductions & disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Oct 2026","status":"completed","notes":"Under review by CFO team along with statutory auditor remarks.","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"it-19-3","subtaskNumber":3,"title":"File ITR & e-verify","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9218"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '086bc5e9-707f-4ec8-b857-82f010b30aa1',
  'client-102',
  'Income Tax',
  'Pending',
  '{"id":"apex-it-20","sNo":20,"category":"Income Tax","name":"Tax Audit Report (Form 3CA/3CB-3CD)","applicability":"Entities exceeding turnover/receipt thresholds","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Audit Report","penaltyClause":"Lower of 0.5% of turnover or ₹1,50,000","period":"AY 2026-27","criticality":"Critical","subtasks":[{"id":"it-20-1","subtaskNumber":1,"title":"Compile financials & audit schedules","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Sep 2026","status":"pending","notes":"Clause 44 (GST expenditure breakup) and Clause 34 (TDS compliance) annexures compiled."},{"id":"it-20-2","subtaskNumber":2,"title":"CFO/auditor review of tax audit annexures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Sep 2026","status":"pending","notes":"Review in final stages with statutory auditor M/s Singhal & Co."},{"id":"it-20-3","subtaskNumber":3,"title":"CA uploads Form 3CD; assessee accepts on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Sep 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '657eb96b-12b4-49f4-b6a8-867715fa45a5',
  'client-102',
  'Income Tax',
  'Pending',
  '{"id":"apex-it-21","sNo":21,"category":"Income Tax","name":"Transfer Pricing Report (Form 3CEB)","applicability":"Entities with international/specified domestic transactions","frequency":"Annual","statutoryDueDate":"31st October","dueDates":["2026-10-31"],"type":"Audit Report","penaltyClause":"Penalty ₹1,00,000 for non-filing","period":"AY 2026-27","criticality":"High","subtasks":[{"id":"it-21-1","subtaskNumber":1,"title":"Compile related-party transaction data & benchmarking","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"05 Oct 2026","status":"completed","notes":"Intercompany software development services agreements gathered.","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"it-21-2","subtaskNumber":2,"title":"CFO review of TP study & pricing policy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"it-21-3","subtaskNumber":3,"title":"CA uploads Form 3CEB","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9220"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9e9145c1-2404-4e7e-be68-43046d5b3699',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-22","sNo":22,"category":"ROC / MCA","name":"AOC-4 (Filing of Financial Statements)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 30 days of AGM","dueDates":["2026-10-28"],"type":"Filing","penaltyClause":"Additional fee per day of delay (up to 12x normal fee)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-22-1","subtaskNumber":1,"title":"Finalise audited financials & board report","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"05 Oct 2026","status":"completed","notes":"Awaiting AGM adoption on 28th September 2026.","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"roc-22-2","subtaskNumber":2,"title":"CFO review of attachments & XBRL data","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Oct 2026","status":"pending"},{"id":"roc-22-3","subtaskNumber":3,"title":"File AOC-4 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"28 Oct 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '8f2fd4a1-8d34-457a-98bf-3638cd365bf1',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-23","sNo":23,"category":"ROC / MCA","name":"MGT-7 / MGT-7A (Annual Return)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 60 days of AGM","dueDates":["2026-11-27"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-23-1","subtaskNumber":1,"title":"Compile shareholding, director & compliance data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Oct 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"roc-23-2","subtaskNumber":2,"title":"CFO/CS review of annual return draft","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"05 Nov 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"roc-23-3","subtaskNumber":3,"title":"File MGT-7/7A on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"27 Nov 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9222"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '630f4672-6eac-49bd-96da-42e8e9809b2f',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-24","sNo":24,"category":"ROC / MCA","name":"DIR-3 KYC (Director KYC)","applicability":"All DIN holders","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Filing","penaltyClause":"₹5,000 penalty + DIN deactivation","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"roc-24-1","subtaskNumber":1,"title":"Collect director KYC documents/OTP details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"pending","notes":"Both directors mobile & email OTP validation test successful."},{"id":"roc-24-2","subtaskNumber":2,"title":"Verification & CFO/CS sign-off","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Sep 2026","status":"pending","notes":"Director details cross-matched with MCA Master Data."},{"id":"roc-24-3","subtaskNumber":3,"title":"File DIR-3 KYC / web-KYC","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Sep 2026","status":"pending","notes":"Web-KYC pending OTP triggering on client portal."}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '2626d781-c460-4ecc-bfc4-356bec814662',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-25","sNo":25,"category":"ROC / MCA","name":"ADT-1 (Auditor Appointment/Reappointment)","applicability":"All companies","frequency":"Event-based","statutoryDueDate":"Within 15 days of AGM","dueDates":["2026-10-13"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"AGM FY 25-26","criticality":"Medium","subtasks":[{"id":"roc-25-1","subtaskNumber":1,"title":"Obtain auditor consent & eligibility certificate","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Received eligibility letter from M/s Singhal & Co under Sec 139 & 141."},{"id":"roc-25-2","subtaskNumber":2,"title":"CFO/CS review of resolution & form","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"roc-25-3","subtaskNumber":3,"title":"File ADT-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"13 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9224"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '20c68a56-271a-4f00-91c7-68b83268c1a1',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-26","sNo":26,"category":"ROC / MCA","name":"DPT-3 (Return of Deposits/Loans)","applicability":"All companies (other than govt. co.)","frequency":"Annual","statutoryDueDate":"30th June","dueDates":["2026-06-30"],"type":"Filing","penaltyClause":"Additional fee + penalty on company & officers","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-26-1","subtaskNumber":1,"title":"Compile outstanding loans/deposits data as on 31 March","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Jun 2026","status":"pending"},{"id":"roc-26-2","subtaskNumber":2,"title":"CFO review of classification (deposit vs exempted)","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Jun 2026","status":"pending"},{"id":"roc-26-3","subtaskNumber":3,"title":"File DPT-3 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Jun 2026","status":"pending","documentRef":"SRN: T29841029"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '59c3f980-2a1b-4f95-96f7-9fa099b72244',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-27","sNo":27,"category":"ROC / MCA","name":"MSME-1 (Outstanding payments to MSME > 45 days)","applicability":"Companies with MSME dues","frequency":"Half-yearly","statutoryDueDate":"30 Apr (Oct–Mar); 31 Oct (Apr–Sep)","dueDates":["2026-04-30","2026-10-31"],"type":"Filing","penaltyClause":"Penalty on company & officers for non-filing","period":"Apr - Sep 2026","criticality":"High","subtasks":[{"id":"roc-27-1","subtaskNumber":1,"title":"Compile outstanding MSME vendor ageing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Oct 2026","status":"completed","notes":"Tracking MSME vendor invoices > 45 days under Section 43B(h).","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"roc-27-2","subtaskNumber":2,"title":"CFO review & reconciliation with payables","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"roc-27-3","subtaskNumber":3,"title":"File MSME-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9226"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '3216c502-af5c-418b-a24e-4d3d80ce5009',
  'client-102',
  'ROC / MCA',
  'Pending',
  '{"id":"apex-roc-28","sNo":28,"category":"ROC / MCA","name":"Board Meetings & Minutes","applicability":"All companies","frequency":"Quarterly","statutoryDueDate":"Gap not exceeding 120 days between meetings","dueDates":["2026-09-25"],"type":"Governance","penaltyClause":"Penalty under Companies Act for non-compliance","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"roc-28-1","subtaskNumber":1,"title":"Prepare agenda, notice & supporting papers","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"05 Sep 2026","status":"pending"},{"id":"roc-28-2","subtaskNumber":2,"title":"CFO briefing note & CFO/CS review of draft minutes","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending","notes":"Financial MIS and expansion budget presentation attached."},{"id":"roc-28-3","subtaskNumber":3,"title":"Circulate & finalise signed minutes","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"pending","notes":"Draft minutes circulated to directors for sign-off."}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'c88eef4b-76db-413b-8d09-a1b19a9ee71e',
  'client-102',
  'PF / ESI',
  'Pending',
  '{"id":"apex-pf-29","sNo":29,"category":"PF / ESI","name":"PF Payment","applicability":"Establishments with 20+ employees (or covered voluntarily)","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages up to 25%","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"pf-29-1","subtaskNumber":1,"title":"Compute PF contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"84 employees, wage ceiling checked. Total liability ₹2,42,800."},{"id":"pf-29-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)","notes":"Reconciled with salary register."},{"id":"pf-29-3","subtaskNumber":3,"title":"Pay via ECR portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","notes":"Paid via EPFO unified portal.","documentRef":"TRRN: 1012609048912"}],"arnOrChallanNo":"APEX-CHL-9228","taxAmount":242800,"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '54a077b0-4a26-47f8-ab30-2a9c590ffe93',
  'client-102',
  'PF / ESI',
  'Pending',
  '{"id":"apex-pf-30","sNo":30,"category":"PF / ESI","name":"PF Return (ECR)","applicability":"Covered establishments","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Return","penaltyClause":"Same as PF payment default","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-30-1","subtaskNumber":1,"title":"Prepare Electronic Challan-cum-Return from payroll data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"pending"},{"id":"pf-30-2","subtaskNumber":2,"title":"CFO review before submission","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending"},{"id":"pf-30-3","subtaskNumber":3,"title":"Submit ECR on EPFO portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"pending","documentRef":"ECR Challan: 1012609048912"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'a34e11b9-7658-4bac-8ab6-65d4987575ec',
  'client-102',
  'PF / ESI',
  'Pending',
  '{"id":"apex-pf-31","sNo":31,"category":"PF / ESI","name":"ESI Payment","applicability":"Establishments with 10+ employees & wage threshold","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-31-1","subtaskNumber":1,"title":"Compute ESI contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Covered wage count verified for 32 employees."},{"id":"pf-31-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"pf-31-3","subtaskNumber":3,"title":"Pay via ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","documentRef":"ESIC Challan: 031261099231"}],"arnOrChallanNo":"APEX-CHL-9230","taxAmount":48600,"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '8ba01f98-2f91-4dce-8277-f3489bca8ef2',
  'client-102',
  'PF / ESI',
  'Pending',
  '{"id":"apex-pf-32","sNo":32,"category":"PF / ESI","name":"ESI Return","applicability":"Covered establishments","frequency":"Half-yearly","statutoryDueDate":"11 May (Oct–Mar); 11 Nov (Apr–Sep)","dueDates":["2026-05-11","2026-11-11"],"type":"Return","penaltyClause":"Penalty & prosecution risk on default","period":"Apr - Sep 2026","criticality":"Medium","subtasks":[{"id":"pf-32-1","subtaskNumber":1,"title":"Compile half-yearly contribution data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"25 Oct 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"pf-32-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Nov 2026","status":"pending"},{"id":"pf-32-3","subtaskNumber":3,"title":"File return on ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"11 Nov 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '6b8ec097-1722-454a-9141-02c135ab9a50',
  'client-102',
  'Professional Tax & State',
  'Pending',
  '{"id":"apex-pt-33","sNo":33,"category":"Professional Tax & State","name":"Professional Tax Payment & Return","applicability":"Employers/professionals (state-specific)","frequency":"Monthly","statutoryDueDate":"Varies by state (commonly 15th/20th/30th)","dueDates":["2026-09-20","2026-09-30"],"type":"Payment + Return","penaltyClause":"State-specific interest/penalty","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"pt-33-1","subtaskNumber":1,"title":"Compute PT liability per state slab","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team","notes":"Maharashtra & Karnataka PT schedules mapped. ₹16,800 total."},{"id":"pt-33-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Sep 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"pt-33-3","subtaskNumber":3,"title":"Pay & file return on state portal","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"20 Sep 2026","status":"completed","notes":"Scheduled for payment on 18th Sep.","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk"}],"taxAmount":16800,"companyId":"client-102","arnOrChallanNo":"APEX-CHL-9232"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'ec5e7c72-3e1e-4baa-b5c2-695845ade891',
  'client-102',
  'Professional Tax & State',
  'Pending',
  '{"id":"apex-pt-34","sNo":34,"category":"Professional Tax & State","name":"Shops & Establishment Registration Renewal","applicability":"Establishments under S&E Act","frequency":"Annual","statutoryDueDate":"Before expiry of registration","dueDates":["2026-11-30"],"type":"Renewal","penaltyClause":"Penalty/fine as per state act","period":"2026-27 Renewal","criticality":"Medium","subtasks":[{"id":"pt-34-1","subtaskNumber":1,"title":"Compile establishment & employee details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"01 Nov 2026","status":"pending"},{"id":"pt-34-2","subtaskNumber":2,"title":"CFO review of documents","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Nov 2026","status":"pending"},{"id":"pt-34-3","subtaskNumber":3,"title":"Submit renewal application","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Nov 2026","status":"pending"}],"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '8629452f-5419-47f5-aa07-907f64c7f2cd',
  'client-102',
  'Professional Tax & State',
  'Pending',
  '{"id":"apex-pt-35","sNo":35,"category":"Professional Tax & State","name":"Labour Welfare Fund (LWF) Contribution","applicability":"Establishments in applicable states","frequency":"Half-yearly","statutoryDueDate":"Varies by state (15th Jan & 15th July)","dueDates":["2026-01-15","2026-07-15"],"type":"Payment","penaltyClause":"State-specific penalty","period":"H1 2026","criticality":"Low","subtasks":[{"id":"pt-35-1","subtaskNumber":1,"title":"Compute contribution per employee count","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jul 2026","status":"completed","completedAt":"2026-09-12 11:00","completedBy":"Apex Accounts Team"},{"id":"pt-35-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jul 2026","status":"completed","completedAt":"2026-09-14 16:30","completedBy":"Sudhakar (CFO)"},{"id":"pt-35-3","subtaskNumber":3,"title":"Pay to state Labour Welfare Board","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jul 2026","status":"completed","completedAt":"2026-09-15 10:45","completedBy":"Apex Tax Filing Desk","documentRef":"LWF Receipt: LWF-MH-2026-9042"}],"arnOrChallanNo":"APEX-CHL-9234","taxAmount":4200,"companyId":"client-102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f72b59d9-7c42-4a60-a6ad-7158bfe41201',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-1","sNo":1,"category":"GST","name":"GSTR-1 (Outward supplies)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"11th of next month (Monthly); 13th of month after quarter (QRMP)","dueDates":["2026-09-11","2026-10-13"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day for nil) + interest","period":"Aug 2026","criticality":"High","subtasks":[{"id":"gst-1-1","subtaskNumber":1,"title":"Compile sales register & invoice-wise data; upload to GST tool","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"06 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Sales register matched with ERP sales vouchers. B2B & B2C summaries ready."},{"id":"gst-1-2","subtaskNumber":2,"title":"Reconcile with sales ledger & e-invoice/e-way bill data; CFO sign-off on draft","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"09 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Reconciliation verified against IRN list. Minor credit note adjustment reconciled. Approved."},{"id":"gst-1-3","subtaskNumber":3,"title":"File GSTR-1 on GST portal; save ARN/acknowledgment","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"11 Sep 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","notes":"Filed with DSC. ARN generated & archived in Google Drive.","documentRef":"ARN: AA2708260198421"}],"arnOrChallanNo":"ZENITH-ARN-8100","completionProofDoc":{"id":"proof-gst-1","fileName":"GSTR-1_Aug2026_Filing_Acknowledgement_ARN.pdf","fileSize":"245 KB","fileType":"application/pdf","uploadedAt":"10 Sep 2026, 14:15","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260198421","filingDate":"2026-09-10","documentCategory":"Filing Acknowledgement (ARN)","notes":"GSTR-1 outward supplies return filed with DSC on GST portal. Official ARN generated."},"cfoRemarks":"All outward supplies reconciled with e-invoices and e-way bills. B2B invoices tallied perfectly with GSTR-1 ARN.","clientRemarks":"Management verified invoice numbers with dispatch records. Everything accounted for.","companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '2bf57126-c5f8-4b01-b9db-dcb9e7fe57b4',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-2","sNo":2,"category":"GST","name":"IFF – Invoice Furnishing Facility","applicability":"QRMP scheme taxpayers (M1, M2 of quarter)","frequency":"Monthly","statutoryDueDate":"13th of next month","dueDates":["2026-09-13"],"type":"Return","penaltyClause":"No mandatory late fee (optional facility)","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"gst-2-1","subtaskNumber":1,"title":"Compile B2B invoices for the month","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"pending","notes":"Total 42 B2B invoices compiled with customer GSTINs validated."},{"id":"gst-2-2","subtaskNumber":2,"title":"Review & reconcile with books; CFO approval","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending","notes":"Books vs e-invoices reconciled. No mismatch."},{"id":"gst-2-3","subtaskNumber":3,"title":"Upload on portal (optional facility)","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"13 Sep 2026","status":"pending","notes":"Submitted on GST portal successfully.","documentRef":"ARN: AA2708260211098"}],"completionProofDoc":{"id":"proof-gst-2","fileName":"IFF_B2B_Aug2026_Submission_Receipt.pdf","fileSize":"180 KB","fileType":"application/pdf","uploadedAt":"12 Sep 2026, 17:50","uploadedBy":"Rahul Verma (Tax Associate)","arnOrChallanNo":"AA2708260211098","filingDate":"2026-09-12","documentCategory":"Filing Acknowledgement (ARN)","notes":"Invoice Furnishing Facility submitted on GST portal. Official ARN generated."},"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'b2dceb7e-9d06-41c3-b2c4-649bdf1acf5b',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-3","sNo":3,"category":"GST","name":"GSTR-3B (Summary return & tax payment)","applicability":"All regular registered dealers","frequency":"Monthly","statutoryDueDate":"20th (Monthly); 22nd/24th (QRMP, state-wise)","dueDates":["2026-09-20","2026-09-22","2026-09-24"],"type":"Return + Payment","penaltyClause":"Late fee ₹50/day (₹20/day nil) + 18% p.a. interest on tax","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"gst-3-1","subtaskNumber":1,"title":"Compute output tax & reconcile ITC with GSTR-2B","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"14 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"ITC reconciled with auto-drafted GSTR-2B. ₹1,42,000 ineligible ITC blocked under Sec 17(5)."},{"id":"gst-3-2","subtaskNumber":2,"title":"CFO review of tax liability, ITC eligibility & cash/credit ledger utilisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"17 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Net tax payable after ITC is ₹3,84,500. Cash ledger balance verified. Challan draft cleared."},{"id":"gst-3-3","subtaskNumber":3,"title":"File return & pay tax via challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"20 Sep 2026","status":"completed","notes":"Payment scheduled for 18th Sep via corporate net banking.","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"taxAmount":384500,"cfoRemarks":"Net cash tax payout of ₹3,84,500 finalized after full ITC offset. Payment approved from HDFC current account.","clientRemarks":"Fund transfer mandate of ₹3.85 Lakhs approved by Promoter / Director in banking portal.","companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8102"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd99df0d4-c5f3-4606-9b2b-751d8c163ff8',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-4","sNo":4,"category":"GST","name":"CMP-08 (Composition scheme statement-cum-payment)","applicability":"Composition dealers","frequency":"Quarterly","statutoryDueDate":"18th of month following quarter","dueDates":["2026-10-18"],"type":"Return + Payment","penaltyClause":"Interest @18% p.a. + late fee","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-4-1","subtaskNumber":1,"title":"Compile quarterly turnover & tax computation","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"completed","notes":"Awaiting Q2 end turnover summary.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"gst-4-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"gst-4-3","subtaskNumber":3,"title":"File statement & pay tax","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '31834c36-4e63-4b9f-80a9-7b53925b4939',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-5","sNo":5,"category":"GST","name":"GSTR-4 (Composition annual return)","applicability":"Composition dealers","frequency":"Annual","statutoryDueDate":"30th April (for preceding FY)","dueDates":["2027-04-30"],"type":"Return","penaltyClause":"Late fee ₹50/day (₹20/day nil), max as prescribed","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"gst-5-1","subtaskNumber":1,"title":"Compile annual turnover & CMP-08 data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Apr 2027","status":"pending"},{"id":"gst-5-2","subtaskNumber":2,"title":"Reconciliation & CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"22 Apr 2027","status":"pending"},{"id":"gst-5-3","subtaskNumber":3,"title":"File annual return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Apr 2027","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd675f19f-e3a5-463b-a432-71f035be38e1',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-6","sNo":6,"category":"GST","name":"GSTR-9 (Annual return)","applicability":"Regular taxpayers (turnover above threshold; optional below)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (₹100+₹100 CGST/SGST), capped at 0.25% of turnover each","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-6-1","subtaskNumber":1,"title":"Compile & reconcile GSTR-1, GSTR-3B and books for the year","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Nov 2026","status":"completed","notes":"Cross-verification of 12 months GSTR-1 vs 3B in progress.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"gst-6-2","subtaskNumber":2,"title":"CFO review of reconciliation statement and disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Dec 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"gst-6-3","subtaskNumber":3,"title":"File annual return on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8105"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '56b51a6b-855d-45c2-a948-f0a05cf01b3e',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-7","sNo":7,"category":"GST","name":"GSTR-9C (Reconciliation Statement)","applicability":"Taxpayers with turnover above prescribed limit (currently >= ₹5 Cr)","frequency":"Annual","statutoryDueDate":"31st December following the FY","dueDates":["2026-12-31"],"type":"Certification","penaltyClause":"Same as GSTR-9 (no separate late fee currently)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"gst-7-1","subtaskNumber":1,"title":"Prepare reconciliation of audited financials with GST returns","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Nov 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"gst-7-2","subtaskNumber":2,"title":"CFO/auditor review & certification workpapers","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Dec 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"gst-7-3","subtaskNumber":3,"title":"File along with GSTR-9","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Dec 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8106"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '71a6a27e-d698-496e-ac07-2fccee0ea8dc',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-8","sNo":8,"category":"GST","name":"ITC-04 (Goods sent to job worker)","applicability":"Manufacturers sending goods for job work","frequency":"Half-yearly","statutoryDueDate":"25th of month following half-year","dueDates":["2026-10-25"],"type":"Return","penaltyClause":"Late fee as applicable","period":"H1 FY 26-27","criticality":"Medium","subtasks":[{"id":"gst-8-1","subtaskNumber":1,"title":"Compile job-work challans & goods movement data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Oct 2026","status":"pending"},{"id":"gst-8-2","subtaskNumber":2,"title":"CFO review of reconciliation with stock records","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Oct 2026","status":"pending"},{"id":"gst-8-3","subtaskNumber":3,"title":"File ITC-04","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"25 Oct 2026","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '3e522679-cd98-4e88-ab9a-90b37e0a983a',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-9","sNo":9,"category":"GST","name":"LUT – Letter of Undertaking (for exports without IGST)","applicability":"Exporters","frequency":"Annual","statutoryDueDate":"Before start of FY (31st March)","dueDates":["2026-03-31"],"type":"Application","penaltyClause":"Loss of export-without-tax benefit; IGST payment + refund route instead","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"gst-9-1","subtaskNumber":1,"title":"Prepare export declaration & eligibility check","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Mar 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"gst-9-2","subtaskNumber":2,"title":"CFO review & authorisation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Mar 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"gst-9-3","subtaskNumber":3,"title":"File LUT (Form GST RFD-11) on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Mar 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","notes":"Form GST RFD-11 successfully renewed for FY 2026-27.","documentRef":"LUT Ref: AD270326001889"}],"arnOrChallanNo":"ZENITH-ARN-8108","companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '19ae687f-459a-4055-91f5-e158dbfec6c4',
  'client-103',
  'GST',
  'Pending',
  '{"id":"zenith-gst-10","sNo":10,"category":"GST","name":"E-Way Bill & E-Invoice Compliance Monitoring","applicability":"Applicable dealers based on turnover/threshold","frequency":"Ongoing / Transaction-based","statutoryDueDate":"Before movement of goods / invoice generation","dueDates":["2026-09-30"],"type":"Ongoing Monitoring","penaltyClause":"Detention of goods/penalty on non-generation","period":"Continuous Monitoring","criticality":"High","subtasks":[{"id":"gst-10-1","subtaskNumber":1,"title":"Generate e-way bill/e-invoice for each qualifying transaction","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"Daily","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"ERP API integrated with NIC portal. All dispatches accompanied by QR code & e-way bill."},{"id":"gst-10-2","subtaskNumber":2,"title":"CFO spot-review for compliance gaps","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"Weekly","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Spot audit of 25 shipments conducted. 100% compliance maintained."},{"id":"gst-10-3","subtaskNumber":3,"title":"Periodic compliance confirmation report to client","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"End of Month","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","notes":"Monthly zero-detention certificate issued to client."}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8109"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '1f1f340f-eb71-4bfc-a9f8-d93e61c5cf03',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-11","sNo":11,"category":"TDS / TCS","name":"TDS Payment (Challan 281)","applicability":"All deductors","frequency":"Monthly","statutoryDueDate":"7th of next month (30th April for March)","dueDates":["2026-09-07"],"type":"Payment","penaltyClause":"Interest 1%/1.5% p.m. + disallowance u/s 40(a)(ia)","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"tds-11-1","subtaskNumber":1,"title":"Compute TDS from vouchers/salary/vendor payments","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"03 Sep 2026","status":"pending","notes":"Sections 192 (Salary), 194C (Contractors), 194J (Professional fees), 194I (Rent) compiled."},{"id":"tds-11-2","subtaskNumber":2,"title":"CFO review of computation & rate applicability","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Sep 2026","status":"pending","notes":"Approved net liability of ₹2,15,400. Challan 281 prepared."},{"id":"tds-11-3","subtaskNumber":3,"title":"Pay TDS challan & save receipt","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"07 Sep 2026","status":"pending","notes":"Paid via NSDL/e-filing portal. BSR Code: 0210043, Challan: 10892.","documentRef":"CIN: 02100430609202610892"}],"taxAmount":215400,"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '0c08db23-5da7-4c18-a0ae-27c1afae00af',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-12","sNo":12,"category":"TDS / TCS","name":"TDS Return – Form 24Q (Salary)","applicability":"Employers","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day (max = TDS amount) + penalty ₹10k–1L","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-12-1","subtaskNumber":1,"title":"Compile salary & TDS deduction data quarter-wise","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Oct 2026","status":"completed","notes":"Payroll data compilation for Jul-Sep quarter initiated.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"tds-12-2","subtaskNumber":2,"title":"CFO review of return before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"24 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"tds-12-3","subtaskNumber":3,"title":"File e-TDS return on TRACES/portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8111"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '4d969fa0-d2fe-47a1-997c-7a18a23adb8b',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-13","sNo":13,"category":"TDS / TCS","name":"TDS Return – Form 26Q (Non-salary payments)","applicability":"All deductors (non-salary)","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"High","subtasks":[{"id":"tds-13-1","subtaskNumber":1,"title":"Compile vendor/contractor TDS data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"18 Oct 2026","status":"completed","notes":"PAN validation and deductee tagging underway in ERP.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"tds-13-2","subtaskNumber":2,"title":"CFO review & reconciliation with 26AS/AIS","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"tds-13-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8112"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'c2576aa2-1bcd-4879-8901-601913287dc2',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-14","sNo":14,"category":"TDS / TCS","name":"TDS Return – Form 27Q (Payments to Non-Residents)","applicability":"Deductors making NR payments","frequency":"Quarterly","statutoryDueDate":"31 Jul, 31 Oct, 31 Jan, 31 May","dueDates":["2026-07-31","2026-10-31","2027-01-31","2027-05-31"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-14-1","subtaskNumber":1,"title":"Compile NR payment & DTAA/rate data","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"18 Oct 2026","status":"pending"},{"id":"tds-14-2","subtaskNumber":2,"title":"CFO review of applicable rates/treaty benefit","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"25 Oct 2026","status":"pending"},{"id":"tds-14-3","subtaskNumber":3,"title":"File e-TDS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f0990dbb-b27b-4182-a789-56e4456663eb',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-15","sNo":15,"category":"TDS / TCS","name":"TCS Return – Form 27EQ","applicability":"Collectors of TCS","frequency":"Quarterly","statutoryDueDate":"15 Jul, 15 Oct, 15 Jan, 15 May","dueDates":["2026-07-15","2026-10-15","2027-01-15","2027-05-15"],"type":"Return","penaltyClause":"Late fee ₹200/day + penalty","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-15-1","subtaskNumber":1,"title":"Compile TCS collection data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"08 Oct 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"tds-15-2","subtaskNumber":2,"title":"CFO review before filing","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"tds-15-3","subtaskNumber":3,"title":"File e-TCS return","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8114"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '75dbe6c8-91f8-45a8-acab-67c62dfba0c5',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-16","sNo":16,"category":"TDS / TCS","name":"Form 16 Issuance (Salary TDS certificate)","applicability":"Employers","frequency":"Annual","statutoryDueDate":"15th June","dueDates":["2026-06-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"FY 2025-26","criticality":"Medium","subtasks":[{"id":"tds-16-1","subtaskNumber":1,"title":"Generate Part A/B from TRACES post 24Q filing","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jun 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"tds-16-2","subtaskNumber":2,"title":"CFO review for accuracy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jun 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"tds-16-3","subtaskNumber":3,"title":"Issue Form 16 to employees","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jun 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","notes":"Digitally signed and emailed to all 84 eligible employees."}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8115"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '93a366e4-a3a0-46b4-a416-81bd5e434c2e',
  'client-103',
  'TDS / TCS',
  'Pending',
  '{"id":"zenith-tds-17","sNo":17,"category":"TDS / TCS","name":"Form 16A Issuance (Non-salary TDS certificate)","applicability":"All deductors","frequency":"Quarterly","statutoryDueDate":"Within 15 days of return due date","dueDates":["2026-08-15"],"type":"Certificate","penaltyClause":"Penalty ₹100/day of default","period":"Q1 FY 26-27","criticality":"Medium","subtasks":[{"id":"tds-17-1","subtaskNumber":1,"title":"Generate from TRACES post 26Q/27Q filing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Aug 2026","status":"pending"},{"id":"tds-17-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Aug 2026","status":"pending"},{"id":"tds-17-3","subtaskNumber":3,"title":"Issue to deductees","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Aug 2026","status":"pending","notes":"Issued to all vendors via email portal."}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'b36781ad-ea2f-4cda-95a1-4d27ebf36e83',
  'client-103',
  'Income Tax',
  'Pending',
  '{"id":"zenith-it-18","sNo":18,"category":"Income Tax","name":"Advance Tax Payment","applicability":"Assessees with tax liability > ₹10,000 p.a.","frequency":"Quarterly","statutoryDueDate":"15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)","dueDates":["2026-06-15","2026-09-15","2026-12-15","2027-03-15"],"type":"Payment","penaltyClause":"Interest u/s 234B/234C","period":"Q2 (45% Cumulative) - Sep 2026","criticality":"Critical","subtasks":[{"id":"it-18-1","subtaskNumber":1,"title":"Estimate annual income & tax liability","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"08 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Projected annual PBT at ₹3.2 Cr; estimated total tax ₹80 Lakhs. 45% installment computed at ₹36 Lakhs less ₹12L paid in Q1."},{"id":"it-18-2","subtaskNumber":2,"title":"CFO review of estimate vs actuals","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Refined model factoring depreciation and R&D credits. Net payable ₹24,00,000 approved."},{"id":"it-18-3","subtaskNumber":3,"title":"Pay advance tax challan","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","notes":"Paid via OLTAS Challan 280. BSR: 0002198, CRN: 89912049.","documentRef":"BSR: 0002198 Challan: 89912049"}],"arnOrChallanNo":"ZENITH-ARN-8117","taxAmount":2400000,"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f6d8c29c-340b-4628-baea-634eef7ae764',
  'client-103',
  'Income Tax',
  'Pending',
  '{"id":"zenith-it-19","sNo":19,"category":"Income Tax","name":"Income Tax Return (ITR) Filing","applicability":"All entities/individuals","frequency":"Annual","statutoryDueDate":"31 Jul (non-audit); 31 Oct (audit cases); 30 Nov (TP cases)","dueDates":["2026-07-31","2026-10-31","2026-11-30"],"type":"Return","penaltyClause":"Late filing fee u/s 234F (₹1,000–5,000) + interest","period":"AY 2026-27 (FY 25-26)","criticality":"Critical","subtasks":[{"id":"it-19-1","subtaskNumber":1,"title":"Finalise books & compile computation data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"20 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Audited balance sheet schedules and tax computation model draft ready."},{"id":"it-19-2","subtaskNumber":2,"title":"CFO review of computation, deductions & disclosures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Oct 2026","status":"completed","notes":"Under review by CFO team along with statutory auditor remarks.","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"it-19-3","subtaskNumber":3,"title":"File ITR & e-verify","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8118"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'fd2088bd-16e0-4583-a8b9-481065cb96b5',
  'client-103',
  'Income Tax',
  'Pending',
  '{"id":"zenith-it-20","sNo":20,"category":"Income Tax","name":"Tax Audit Report (Form 3CA/3CB-3CD)","applicability":"Entities exceeding turnover/receipt thresholds","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Audit Report","penaltyClause":"Lower of 0.5% of turnover or ₹1,50,000","period":"AY 2026-27","criticality":"Critical","subtasks":[{"id":"it-20-1","subtaskNumber":1,"title":"Compile financials & audit schedules","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Sep 2026","status":"pending","notes":"Clause 44 (GST expenditure breakup) and Clause 34 (TDS compliance) annexures compiled."},{"id":"it-20-2","subtaskNumber":2,"title":"CFO/auditor review of tax audit annexures","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Sep 2026","status":"pending","notes":"Review in final stages with statutory auditor M/s Singhal & Co."},{"id":"it-20-3","subtaskNumber":3,"title":"CA uploads Form 3CD; assessee accepts on portal","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Sep 2026","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'e0181543-0412-419c-b7f4-7e4f9e0d6aeb',
  'client-103',
  'Income Tax',
  'Pending',
  '{"id":"zenith-it-21","sNo":21,"category":"Income Tax","name":"Transfer Pricing Report (Form 3CEB)","applicability":"Entities with international/specified domestic transactions","frequency":"Annual","statutoryDueDate":"31st October","dueDates":["2026-10-31"],"type":"Audit Report","penaltyClause":"Penalty ₹1,00,000 for non-filing","period":"AY 2026-27","criticality":"High","subtasks":[{"id":"it-21-1","subtaskNumber":1,"title":"Compile related-party transaction data & benchmarking","stageName":"Team Draft","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"05 Oct 2026","status":"completed","notes":"Intercompany software development services agreements gathered.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"it-21-2","subtaskNumber":2,"title":"CFO review of TP study & pricing policy","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"it-21-3","subtaskNumber":3,"title":"CA uploads Form 3CEB","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8120"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9057f16e-91da-44c6-8eb4-beca237a3eeb',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-22","sNo":22,"category":"ROC / MCA","name":"AOC-4 (Filing of Financial Statements)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 30 days of AGM","dueDates":["2026-10-28"],"type":"Filing","penaltyClause":"Additional fee per day of delay (up to 12x normal fee)","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-22-1","subtaskNumber":1,"title":"Finalise audited financials & board report","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"05 Oct 2026","status":"completed","notes":"Awaiting AGM adoption on 28th September 2026.","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"roc-22-2","subtaskNumber":2,"title":"CFO review of attachments & XBRL data","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"roc-22-3","subtaskNumber":3,"title":"File AOC-4 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"28 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8121"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '2a5c9085-a19d-4500-b8e6-b9c0f16c64dc',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-23","sNo":23,"category":"ROC / MCA","name":"MGT-7 / MGT-7A (Annual Return)","applicability":"All companies","frequency":"Annual","statutoryDueDate":"Within 60 days of AGM","dueDates":["2026-11-27"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-23-1","subtaskNumber":1,"title":"Compile shareholding, director & compliance data","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"15 Oct 2026","status":"pending"},{"id":"roc-23-2","subtaskNumber":2,"title":"CFO/CS review of annual return draft","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"05 Nov 2026","status":"pending"},{"id":"roc-23-3","subtaskNumber":3,"title":"File MGT-7/7A on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"27 Nov 2026","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '7cd20800-fa91-4e76-9605-733c35c68940',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-24","sNo":24,"category":"ROC / MCA","name":"DIR-3 KYC (Director KYC)","applicability":"All DIN holders","frequency":"Annual","statutoryDueDate":"30th September","dueDates":["2026-09-30"],"type":"Filing","penaltyClause":"₹5,000 penalty + DIN deactivation","period":"FY 2026-27","criticality":"Critical","subtasks":[{"id":"roc-24-1","subtaskNumber":1,"title":"Collect director KYC documents/OTP details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Both directors mobile & email OTP validation test successful."},{"id":"roc-24-2","subtaskNumber":2,"title":"Verification & CFO/CS sign-off","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Director details cross-matched with MCA Master Data."},{"id":"roc-24-3","subtaskNumber":3,"title":"File DIR-3 KYC / web-KYC","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Sep 2026","status":"completed","notes":"Web-KYC pending OTP triggering on client portal.","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8123"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'd06adce1-47e0-4d9d-988f-fa7699bd2eac',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-25","sNo":25,"category":"ROC / MCA","name":"ADT-1 (Auditor Appointment/Reappointment)","applicability":"All companies","frequency":"Event-based","statutoryDueDate":"Within 15 days of AGM","dueDates":["2026-10-13"],"type":"Filing","penaltyClause":"Additional fee per day of delay","period":"AGM FY 25-26","criticality":"Medium","subtasks":[{"id":"roc-25-1","subtaskNumber":1,"title":"Obtain auditor consent & eligibility certificate","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Received eligibility letter from M/s Singhal & Co under Sec 139 & 141."},{"id":"roc-25-2","subtaskNumber":2,"title":"CFO/CS review of resolution & form","stageName":"CFO Review","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"roc-25-3","subtaskNumber":3,"title":"File ADT-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"13 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8124"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '9c967d53-f8a7-43a4-89bd-798e8c242dba',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-26","sNo":26,"category":"ROC / MCA","name":"DPT-3 (Return of Deposits/Loans)","applicability":"All companies (other than govt. co.)","frequency":"Annual","statutoryDueDate":"30th June","dueDates":["2026-06-30"],"type":"Filing","penaltyClause":"Additional fee + penalty on company & officers","period":"FY 2025-26","criticality":"High","subtasks":[{"id":"roc-26-1","subtaskNumber":1,"title":"Compile outstanding loans/deposits data as on 31 March","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Jun 2026","status":"pending"},{"id":"roc-26-2","subtaskNumber":2,"title":"CFO review of classification (deposit vs exempted)","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"18 Jun 2026","status":"pending"},{"id":"roc-26-3","subtaskNumber":3,"title":"File DPT-3 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"30 Jun 2026","status":"pending","documentRef":"SRN: T29841029"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '86c9f205-88ac-4021-aceb-a6c318db6fe2',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-27","sNo":27,"category":"ROC / MCA","name":"MSME-1 (Outstanding payments to MSME > 45 days)","applicability":"Companies with MSME dues","frequency":"Half-yearly","statutoryDueDate":"30 Apr (Oct–Mar); 31 Oct (Apr–Sep)","dueDates":["2026-04-30","2026-10-31"],"type":"Filing","penaltyClause":"Penalty on company & officers for non-filing","period":"Apr - Sep 2026","criticality":"High","subtasks":[{"id":"roc-27-1","subtaskNumber":1,"title":"Compile outstanding MSME vendor ageing","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","deadline":"10 Oct 2026","status":"completed","notes":"Tracking MSME vendor invoices > 45 days under Section 43B(h).","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"roc-27-2","subtaskNumber":2,"title":"CFO review & reconciliation with payables","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"20 Oct 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"roc-27-3","subtaskNumber":3,"title":"File MSME-1 on MCA portal","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"31 Oct 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8126"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '022b70f8-6242-4ea5-83d9-f9b3287ec274',
  'client-103',
  'ROC / MCA',
  'Pending',
  '{"id":"zenith-roc-28","sNo":28,"category":"ROC / MCA","name":"Board Meetings & Minutes","applicability":"All companies","frequency":"Quarterly","statutoryDueDate":"Gap not exceeding 120 days between meetings","dueDates":["2026-09-25"],"type":"Governance","penaltyClause":"Penalty under Companies Act for non-compliance","period":"Q2 FY 26-27","criticality":"Medium","subtasks":[{"id":"roc-28-1","subtaskNumber":1,"title":"Prepare agenda, notice & supporting papers","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"05 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"roc-28-2","subtaskNumber":2,"title":"CFO briefing note & CFO/CS review of draft minutes","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)","notes":"Financial MIS and expansion budget presentation attached."},{"id":"roc-28-3","subtaskNumber":3,"title":"Circulate & finalise signed minutes","stageName":"Filing & Payment","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","deadline":"25 Sep 2026","status":"completed","notes":"Draft minutes circulated to directors for sign-off.","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8127"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'ec074833-6651-45f3-8473-3e0c44225f88',
  'client-103',
  'PF / ESI',
  'Pending',
  '{"id":"zenith-pf-29","sNo":29,"category":"PF / ESI","name":"PF Payment","applicability":"Establishments with 20+ employees (or covered voluntarily)","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages up to 25%","period":"Aug 2026","criticality":"Critical","subtasks":[{"id":"pf-29-1","subtaskNumber":1,"title":"Compute PF contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"pending","notes":"84 employees, wage ceiling checked. Total liability ₹2,42,800."},{"id":"pf-29-2","subtaskNumber":2,"title":"CFO review of computation","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"pending","notes":"Reconciled with salary register."},{"id":"pf-29-3","subtaskNumber":3,"title":"Pay via ECR portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"pending","notes":"Paid via EPFO unified portal.","documentRef":"TRRN: 1012609048912"}],"taxAmount":242800,"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'a49c1b14-5794-4882-a768-3a35fc27cbf4',
  'client-103',
  'PF / ESI',
  'Pending',
  '{"id":"zenith-pf-30","sNo":30,"category":"PF / ESI","name":"PF Return (ECR)","applicability":"Covered establishments","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Return","penaltyClause":"Same as PF payment default","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-30-1","subtaskNumber":1,"title":"Prepare Electronic Challan-cum-Return from payroll data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"pf-30-2","subtaskNumber":2,"title":"CFO review before submission","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"pf-30-3","subtaskNumber":3,"title":"Submit ECR on EPFO portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","documentRef":"ECR Challan: 1012609048912"}],"arnOrChallanNo":"ZENITH-ARN-8129","companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'a64750ff-e57a-471e-afaa-fd3e8f990278',
  'client-103',
  'PF / ESI',
  'Pending',
  '{"id":"zenith-pf-31","sNo":31,"category":"PF / ESI","name":"ESI Payment","applicability":"Establishments with 10+ employees & wage threshold","frequency":"Monthly","statutoryDueDate":"15th of next month","dueDates":["2026-09-15"],"type":"Payment","penaltyClause":"Interest 12% p.a. + damages","period":"Aug 2026","criticality":"High","subtasks":[{"id":"pf-31-1","subtaskNumber":1,"title":"Compute ESI contribution from payroll","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"08 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Covered wage count verified for 32 employees."},{"id":"pf-31-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"12 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"pf-31-3","subtaskNumber":3,"title":"Pay via ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Sep 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team","documentRef":"ESIC Challan: 031261099231"}],"arnOrChallanNo":"ZENITH-ARN-8130","taxAmount":48600,"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  '315aa986-2ac1-42cf-bcf1-e28dc18ab6e8',
  'client-103',
  'PF / ESI',
  'Pending',
  '{"id":"zenith-pf-32","sNo":32,"category":"PF / ESI","name":"ESI Return","applicability":"Covered establishments","frequency":"Half-yearly","statutoryDueDate":"11 May (Oct–Mar); 11 Nov (Apr–Sep)","dueDates":["2026-05-11","2026-11-11"],"type":"Return","penaltyClause":"Penalty & prosecution risk on default","period":"Apr - Sep 2026","criticality":"Medium","subtasks":[{"id":"pf-32-1","subtaskNumber":1,"title":"Compile half-yearly contribution data","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"25 Oct 2026","status":"pending"},{"id":"pf-32-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"05 Nov 2026","status":"pending"},{"id":"pf-32-3","subtaskNumber":3,"title":"File return on ESIC portal","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"11 Nov 2026","status":"pending"}],"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f9753668-3b34-4740-b893-1c2a86392589',
  'client-103',
  'Professional Tax & State',
  'Pending',
  '{"id":"zenith-pt-33","sNo":33,"category":"Professional Tax & State","name":"Professional Tax Payment & Return","applicability":"Employers/professionals (state-specific)","frequency":"Monthly","statutoryDueDate":"Varies by state (commonly 15th/20th/30th)","dueDates":["2026-09-20","2026-09-30"],"type":"Payment + Return","penaltyClause":"State-specific interest/penalty","period":"Aug 2026","criticality":"Medium","subtasks":[{"id":"pt-33-1","subtaskNumber":1,"title":"Compute PT liability per state slab","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"10 Sep 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team","notes":"Maharashtra & Karnataka PT schedules mapped. ₹16,800 total."},{"id":"pt-33-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"14 Sep 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"pt-33-3","subtaskNumber":3,"title":"Pay & file return on state portal","stageName":"Filing & Payment","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"20 Sep 2026","status":"completed","notes":"Scheduled for payment on 18th Sep.","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"taxAmount":16800,"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8132"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'f1bf0c14-f90d-441d-a118-a4acb4ecfc8d',
  'client-103',
  'Professional Tax & State',
  'Pending',
  '{"id":"zenith-pt-34","sNo":34,"category":"Professional Tax & State","name":"Shops & Establishment Registration Renewal","applicability":"Establishments under S&E Act","frequency":"Annual","statutoryDueDate":"Before expiry of registration","dueDates":["2026-11-30"],"type":"Renewal","penaltyClause":"Penalty/fine as per state act","period":"2026-27 Renewal","criticality":"Medium","subtasks":[{"id":"pt-34-1","subtaskNumber":1,"title":"Compile establishment & employee details","stageName":"Team Draft","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","deadline":"01 Nov 2026","status":"completed","completedAt":"2026-09-10 14:00","completedBy":"Zenith Finance Team"},{"id":"pt-34-2","subtaskNumber":2,"title":"CFO review of documents","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"15 Nov 2026","status":"completed","completedAt":"2026-09-12 17:00","completedBy":"Sudhakar (CFO)"},{"id":"pt-34-3","subtaskNumber":3,"title":"Submit renewal application","stageName":"Filing & Payment","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","deadline":"30 Nov 2026","status":"completed","completedAt":"2026-09-13 11:15","completedBy":"Zenith Filing Team"}],"companyId":"client-103","arnOrChallanNo":"ZENITH-ARN-8133"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.compliance_items (id, company_id, category, status, data)
VALUES (
  'adbe6571-bd3e-42b9-be18-1ac467dd9976',
  'client-103',
  'Professional Tax & State',
  'Pending',
  '{"id":"zenith-pt-35","sNo":35,"category":"Professional Tax & State","name":"Labour Welfare Fund (LWF) Contribution","applicability":"Establishments in applicable states","frequency":"Half-yearly","statutoryDueDate":"Varies by state (15th Jan & 15th July)","dueDates":["2026-01-15","2026-07-15"],"type":"Payment","penaltyClause":"State-specific penalty","period":"H1 2026","criticality":"Low","subtasks":[{"id":"pt-35-1","subtaskNumber":1,"title":"Compute contribution per employee count","stageName":"Team Draft","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"05 Jul 2026","status":"pending"},{"id":"pt-35-2","subtaskNumber":2,"title":"CFO review","stageName":"CFO Review","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","deadline":"10 Jul 2026","status":"pending"},{"id":"pt-35-3","subtaskNumber":3,"title":"Pay to state Labour Welfare Board","stageName":"Filing & Payment","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","deadline":"15 Jul 2026","status":"pending","documentRef":"LWF Receipt: LWF-MH-2026-9042"}],"taxAmount":4200,"companyId":"client-103"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

-- =========================================================
-- DATA MIGRATION: 3b. Compliance Master (General Statutory Standards)
-- =========================================================
INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-1',
  'GSTR-1 (Outward supplies)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Monthly',
  '11th of next month (Monthly); 13th of month after quarter (QRMP)',
  'High',
  'Return',
  'All regular registered dealers',
  'Late fee ₹50/day (₹20/day for nil) + interest',
  'services.gst.gov.in',
  'Compile sales register & invoice-wise data; upload to GST tool',
  'Reconcile with sales ledger & e-invoice/e-way bill data; CFO sign-off on draft',
  'File GSTR-1 on GST portal; save ARN/acknowledgment',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-2',
  'IFF – Invoice Furnishing Facility',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Monthly',
  '13th of next month',
  'Medium',
  'Return',
  'QRMP scheme taxpayers (M1, M2 of quarter)',
  'No mandatory late fee (optional facility)',
  'services.gst.gov.in',
  'Compile B2B invoices for the month',
  'Review & reconcile with books; CFO approval',
  'Upload on portal (optional facility)',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-3',
  'GSTR-3B (Summary return & tax payment)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Monthly',
  '20th (Monthly); 22nd/24th (QRMP, state-wise)',
  'Critical',
  'Return + Payment',
  'All regular registered dealers',
  'Late fee ₹50/day (₹20/day nil) + 18% p.a. interest on tax',
  'services.gst.gov.in',
  'Compute output tax & reconcile ITC with GSTR-2B',
  'CFO review of tax liability, ITC eligibility & cash/credit ledger utilisation',
  'File return & pay tax via challan',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-4',
  'CMP-08 (Composition scheme statement-cum-payment)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Quarterly',
  '18th of month following quarter',
  'Medium',
  'Return + Payment',
  'Composition dealers',
  'Interest @18% p.a. + late fee',
  'services.gst.gov.in',
  'Compile quarterly turnover & tax computation',
  'CFO review of computation',
  'File statement & pay tax',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-5',
  'GSTR-4 (Composition annual return)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Annual',
  '30th April (for preceding FY)',
  'Medium',
  'Return',
  'Composition dealers',
  'Late fee ₹50/day (₹20/day nil), max as prescribed',
  'services.gst.gov.in',
  'Compile annual turnover & CMP-08 data',
  'Reconciliation & CFO review',
  'File annual return',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-6',
  'GSTR-9 (Annual return)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Annual',
  '31st December following the FY',
  'High',
  'Return',
  'Regular taxpayers (turnover above threshold; optional below)',
  'Late fee ₹200/day (₹100+₹100 CGST/SGST), capped at 0.25% of turnover each',
  'services.gst.gov.in',
  'Compile & reconcile GSTR-1, GSTR-3B and books for the year',
  'CFO review of reconciliation statement and disclosures',
  'File annual return on portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-7',
  'GSTR-9C (Reconciliation Statement)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Annual',
  '31st December following the FY',
  'High',
  'Certification',
  'Taxpayers with turnover above prescribed limit (currently >= ₹5 Cr)',
  'Same as GSTR-9 (no separate late fee currently)',
  'services.gst.gov.in',
  'Prepare reconciliation of audited financials with GST returns',
  'CFO/auditor review & certification workpapers',
  'File along with GSTR-9',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-8',
  'ITC-04 (Goods sent to job worker)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Half-yearly',
  '25th of month following half-year',
  'Medium',
  'Return',
  'Manufacturers sending goods for job work',
  'Late fee as applicable',
  'services.gst.gov.in',
  'Compile job-work challans & goods movement data',
  'CFO review of reconciliation with stock records',
  'File ITC-04',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-9',
  'LUT – Letter of Undertaking (for exports without IGST)',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Annual',
  'Before start of FY (31st March)',
  'Critical',
  'Application',
  'Exporters',
  'Loss of export-without-tax benefit; IGST payment + refund route instead',
  'services.gst.gov.in',
  'Prepare export declaration & eligibility check',
  'CFO review & authorisation',
  'File LUT (Form GST RFD-11) on portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'GST-10',
  'E-Way Bill & E-Invoice Compliance Monitoring',
  'GST',
  'Central Goods & Services Tax (CGST) Act, 2017 & Rules',
  'Ongoing / Transaction-based',
  'Before movement of goods / invoice generation',
  'High',
  'Ongoing Monitoring',
  'Applicable dealers based on turnover/threshold',
  'Detention of goods/penalty on non-generation',
  'services.gst.gov.in',
  'Generate e-way bill/e-invoice for each qualifying transaction',
  'CFO spot-review for compliance gaps',
  'Periodic compliance confirmation report to client',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-11',
  'TDS Payment (Challan 281)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Monthly',
  '7th of next month (30th April for March)',
  'Critical',
  'Payment',
  'All deductors',
  'Interest 1%/1.5% p.m. + disallowance u/s 40(a)(ia)',
  'tdscpc.gov.in (TRACES)',
  'Compute TDS from vouchers/salary/vendor payments',
  'CFO review of computation & rate applicability',
  'Pay TDS challan & save receipt',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-12',
  'TDS Return – Form 24Q (Salary)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  '31 Jul, 31 Oct, 31 Jan, 31 May',
  'High',
  'Return',
  'Employers',
  'Late fee ₹200/day (max = TDS amount) + penalty ₹10k–1L',
  'tdscpc.gov.in (TRACES)',
  'Compile salary & TDS deduction data quarter-wise',
  'CFO review of return before filing',
  'File e-TDS return on TRACES/portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-13',
  'TDS Return – Form 26Q (Non-salary payments)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  '31 Jul, 31 Oct, 31 Jan, 31 May',
  'High',
  'Return',
  'All deductors (non-salary)',
  'Late fee ₹200/day + penalty',
  'tdscpc.gov.in (TRACES)',
  'Compile vendor/contractor TDS data',
  'CFO review & reconciliation with 26AS/AIS',
  'File e-TDS return',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-14',
  'TDS Return – Form 27Q (Payments to Non-Residents)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  '31 Jul, 31 Oct, 31 Jan, 31 May',
  'Medium',
  'Return',
  'Deductors making NR payments',
  'Late fee ₹200/day + penalty',
  'tdscpc.gov.in (TRACES)',
  'Compile NR payment & DTAA/rate data',
  'CFO review of applicable rates/treaty benefit',
  'File e-TDS return',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-15',
  'TCS Return – Form 27EQ',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  '15 Jul, 15 Oct, 15 Jan, 15 May',
  'Medium',
  'Return',
  'Collectors of TCS',
  'Late fee ₹200/day + penalty',
  'tdscpc.gov.in (TRACES)',
  'Compile TCS collection data',
  'CFO review before filing',
  'File e-TCS return',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-16',
  'Form 16 Issuance (Salary TDS certificate)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Annual',
  '15th June',
  'Medium',
  'Certificate',
  'Employers',
  'Penalty ₹100/day of default',
  'tdscpc.gov.in (TRACES)',
  'Generate Part A/B from TRACES post 24Q filing',
  'CFO review for accuracy',
  'Issue Form 16 to employees',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'TDS-17',
  'Form 16A Issuance (Non-salary TDS certificate)',
  'TDS / TCS',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  'Within 15 days of return due date',
  'Medium',
  'Certificate',
  'All deductors',
  'Penalty ₹100/day of default',
  'tdscpc.gov.in (TRACES)',
  'Generate from TRACES post 26Q/27Q filing',
  'CFO review',
  'Issue to deductees',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'IT-18',
  'Advance Tax Payment',
  'Income Tax',
  'Income Tax Act, 1961 & Rules',
  'Quarterly',
  '15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)',
  'Critical',
  'Payment',
  'Assessees with tax liability > ₹10,000 p.a.',
  'Interest u/s 234B/234C',
  'eportal.incometax.gov.in',
  'Estimate annual income & tax liability',
  'CFO review of estimate vs actuals',
  'Pay advance tax challan',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'IT-19',
  'Income Tax Return (ITR) Filing',
  'Income Tax',
  'Income Tax Act, 1961 & Rules',
  'Annual',
  '31 Jul (non-audit); 31 Oct (audit cases); 30 Nov (TP cases)',
  'Critical',
  'Return',
  'All entities/individuals',
  'Late filing fee u/s 234F (₹1,000–5,000) + interest',
  'eportal.incometax.gov.in',
  'Finalise books & compile computation data',
  'CFO review of computation, deductions & disclosures',
  'File ITR & e-verify',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'IT-20',
  'Tax Audit Report (Form 3CA/3CB-3CD)',
  'Income Tax',
  'Income Tax Act, 1961 & Rules',
  'Annual',
  '30th September',
  'Critical',
  'Audit Report',
  'Entities exceeding turnover/receipt thresholds',
  'Lower of 0.5% of turnover or ₹1,50,000',
  'eportal.incometax.gov.in',
  'Compile financials & audit schedules',
  'CFO/auditor review of tax audit annexures',
  'CA uploads Form 3CD; assessee accepts on portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'IT-21',
  'Transfer Pricing Report (Form 3CEB)',
  'Income Tax',
  'Income Tax Act, 1961 & Rules',
  'Annual',
  '31st October',
  'High',
  'Audit Report',
  'Entities with international/specified domestic transactions',
  'Penalty ₹1,00,000 for non-filing',
  'eportal.incometax.gov.in',
  'Compile related-party transaction data & benchmarking',
  'CFO review of TP study & pricing policy',
  'CA uploads Form 3CEB',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-22',
  'AOC-4 (Filing of Financial Statements)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Annual',
  'Within 30 days of AGM',
  'High',
  'Filing',
  'All companies',
  'Additional fee per day of delay (up to 12x normal fee)',
  'mca.gov.in (V3 Portal)',
  'Finalise audited financials & board report',
  'CFO review of attachments & XBRL data',
  'File AOC-4 on MCA portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-23',
  'MGT-7 / MGT-7A (Annual Return)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Annual',
  'Within 60 days of AGM',
  'High',
  'Filing',
  'All companies',
  'Additional fee per day of delay',
  'mca.gov.in (V3 Portal)',
  'Compile shareholding, director & compliance data',
  'CFO/CS review of annual return draft',
  'File MGT-7/7A on MCA portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-24',
  'DIR-3 KYC (Director KYC)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Annual',
  '30th September',
  'Critical',
  'Filing',
  'All DIN holders',
  '₹5,000 penalty + DIN deactivation',
  'mca.gov.in (V3 Portal)',
  'Collect director KYC documents/OTP details',
  'Verification & CFO/CS sign-off',
  'File DIR-3 KYC / web-KYC',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-25',
  'ADT-1 (Auditor Appointment/Reappointment)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Event-based',
  'Within 15 days of AGM',
  'Medium',
  'Filing',
  'All companies',
  'Additional fee per day of delay',
  'mca.gov.in (V3 Portal)',
  'Obtain auditor consent & eligibility certificate',
  'CFO/CS review of resolution & form',
  'File ADT-1 on MCA portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-26',
  'DPT-3 (Return of Deposits/Loans)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Annual',
  '30th June',
  'High',
  'Filing',
  'All companies (other than govt. co.)',
  'Additional fee + penalty on company & officers',
  'mca.gov.in (V3 Portal)',
  'Compile outstanding loans/deposits data as on 31 March',
  'CFO review of classification (deposit vs exempted)',
  'File DPT-3 on MCA portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-27',
  'MSME-1 (Outstanding payments to MSME > 45 days)',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Half-yearly',
  '30 Apr (Oct–Mar); 31 Oct (Apr–Sep)',
  'High',
  'Filing',
  'Companies with MSME dues',
  'Penalty on company & officers for non-filing',
  'mca.gov.in (V3 Portal)',
  'Compile outstanding MSME vendor ageing',
  'CFO review & reconciliation with payables',
  'File MSME-1 on MCA portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'ROC-28',
  'Board Meetings & Minutes',
  'ROC / MCA',
  'Companies Act, 2013 & MCA Rules',
  'Quarterly',
  'Gap not exceeding 120 days between meetings',
  'Medium',
  'Governance',
  'All companies',
  'Penalty under Companies Act for non-compliance',
  'mca.gov.in (V3 Portal)',
  'Prepare agenda, notice & supporting papers',
  'CFO briefing note & CFO/CS review of draft minutes',
  'Circulate & finalise signed minutes',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PF-29',
  'PF Payment',
  'PF / ESI',
  'Employees Provident Funds Act, 1952',
  'Monthly',
  '15th of next month',
  'Critical',
  'Payment',
  'Establishments with 20+ employees (or covered voluntarily)',
  'Interest 12% p.a. + damages up to 25%',
  'unifiedportal-emp.epfindia.gov.in',
  'Compute PF contribution from payroll',
  'CFO review of computation',
  'Pay via ECR portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PF-30',
  'PF Return (ECR)',
  'PF / ESI',
  'Employees Provident Funds Act, 1952',
  'Monthly',
  '15th of next month',
  'High',
  'Return',
  'Covered establishments',
  'Same as PF payment default',
  'unifiedportal-emp.epfindia.gov.in',
  'Prepare Electronic Challan-cum-Return from payroll data',
  'CFO review before submission',
  'Submit ECR on EPFO portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PF-31',
  'ESI Payment',
  'PF / ESI',
  'Employees Provident Funds Act, 1952',
  'Monthly',
  '15th of next month',
  'High',
  'Payment',
  'Establishments with 10+ employees & wage threshold',
  'Interest 12% p.a. + damages',
  'unifiedportal-emp.epfindia.gov.in',
  'Compute ESI contribution from payroll',
  'CFO review',
  'Pay via ESIC portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PF-32',
  'ESI Return',
  'PF / ESI',
  'Employees Provident Funds Act, 1952',
  'Half-yearly',
  '11 May (Oct–Mar); 11 Nov (Apr–Sep)',
  'Medium',
  'Return',
  'Covered establishments',
  'Penalty & prosecution risk on default',
  'unifiedportal-emp.epfindia.gov.in',
  'Compile half-yearly contribution data',
  'CFO review',
  'File return on ESIC portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PT-33',
  'Professional Tax Payment & Return',
  'Professional Tax & State',
  'State Professional Tax / Labour Laws',
  'Monthly',
  'Varies by state (commonly 15th/20th/30th)',
  'Medium',
  'Payment + Return',
  'Employers/professionals (state-specific)',
  'State-specific interest/penalty',
  'State Commercial Tax Portal',
  'Compute PT liability per state slab',
  'CFO review',
  'Pay & file return on state portal',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PT-34',
  'Shops & Establishment Registration Renewal',
  'Professional Tax & State',
  'State Professional Tax / Labour Laws',
  'Annual',
  'Before expiry of registration',
  'Medium',
  'Renewal',
  'Establishments under S&E Act',
  'Penalty/fine as per state act',
  'State Commercial Tax Portal',
  'Compile establishment & employee details',
  'CFO review of documents',
  'Submit renewal application',
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

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES (
  'PT-35',
  'Labour Welfare Fund (LWF) Contribution',
  'Professional Tax & State',
  'State Professional Tax / Labour Laws',
  'Half-yearly',
  'Varies by state (15th Jan & 15th July)',
  'Low',
  'Payment',
  'Establishments in applicable states',
  'State-specific penalty',
  'State Commercial Tax Portal',
  'Compute contribution per employee count',
  'CFO review',
  'Pay to state Labour Welfare Board',
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

-- =========================================================
-- DATA MIGRATION: 4. Action Items
-- =========================================================
INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '429418a1-9332-4a2f-ab36-89451aca6742',
  'client-101',
  'In Progress',
  '{"id":"act-1","title":"HDFC & ICICI Current Account Bank Reconciliation (BRS)","description":"Reconcile all uncredited cheques, UPI gateway batch settlements, and direct debit charges for August 2026 books close.","category":"Banking & Treasury","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","priority":"High","status":"In Progress","decidedDate":"2026-09-15","durationDays":4,"fixedDeadline":"2026-09-19 17:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-17 14:15","progressPercentage":65,"progressUpdates":[{"id":"upd-1-1","date":"2026-09-15 14:00","updatedBy":"Pooja Sharma","progressPercentage":30,"notes":"Parsed HDFC Current A/c #502000 & ICICI A/c #0045 statements; matched Razorpay auto-settlements.","status":"In Progress"},{"id":"upd-1-2","date":"2026-09-17 14:15","updatedBy":"Pooja Sharma","progressPercentage":65,"notes":"Matched AWS cloud infra debit (₹1.42L) & Google Workspace. Following up on 2 uncredited client cheques of ₹3.20L.","status":"In Progress"}],"estimatedHours":4,"timeSpentHours":2.5,"createdAt":"2026-09-15","remarks":"ICICI Razorpay settlement ledger reconciled. HDFC auto-debit charges for AWS pending invoice matching.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '5d637af5-c010-4856-98b4-5fdcb2b5346b',
  'client-101',
  'Pending',
  '{"id":"act-2","title":"MSME Vendor > 45 Days Payment Clearing under Sec 43B(h)","description":"Verify 2 MSME vendor bills (FabTech Solutions ₹1.65L and CloudPrint India ₹1.15L) nearing 45-day credit limit to avoid tax disallowance.","category":"Accounts Payable","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","priority":"Urgent","status":"Pending","decidedDate":"2026-09-17","durationDays":3,"fixedDeadline":"2026-09-20 14:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 11:00","progressPercentage":35,"progressUpdates":[{"id":"upd-2-1","date":"2026-09-18 11:00","updatedBy":"Pooja Sharma","progressPercentage":35,"notes":"Extracted MSME vendor aging; verified FabTech UDYAM certificate. Prepared draft RTGS payment queue in corporate net banking.","status":"Pending"}],"estimatedHours":2,"timeSpentHours":0.5,"createdAt":"2026-09-17","remarks":"Bank payout batch draft created in HDFC Corporate Net Banking awaiting CFO dual approval.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '2edf62b3-4823-42a6-8e08-573d542376f3',
  'client-101',
  'In Progress',
  '{"id":"act-3","title":"Customer Ledger Balance Confirmations (> ₹5 Lakhs)","description":"Dispatch external balance confirmation letters to top 10 clients for Q2 statutory audit file readiness.","category":"Accounts Receivable","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","priority":"Medium","status":"In Progress","decidedDate":"2026-09-14","durationDays":8,"fixedDeadline":"2026-09-22 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 16:30","progressPercentage":60,"progressUpdates":[{"id":"upd-3-1","date":"2026-09-14 17:00","updatedBy":"Pooja Sharma","progressPercentage":25,"notes":"Generated customer ledger statements for top 10 enterprise clients.","status":"In Progress"},{"id":"upd-3-2","date":"2026-09-16 12:30","updatedBy":"Pooja Sharma","progressPercentage":45,"notes":"Dispatched digital balance confirmation emails. 4 clients responded with signed confirmation.","status":"In Progress"},{"id":"upd-3-3","date":"2026-09-18 16:30","updatedBy":"Pooja Sharma","progressPercentage":60,"notes":"6 out of 10 clients confirmed. Dispatched WhatsApp & telephone reminders to remaining 4 accounts.","status":"In Progress"}],"estimatedHours":6,"timeSpentHours":3,"createdAt":"2026-09-14","remarks":"6 out of 10 clients have confirmed by email. Follow-up reminder sent to remaining 4 clients.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '593fcd39-84c9-4427-8684-71fe8fddfdf3',
  'client-101',
  'Under Review',
  '{"id":"act-4","title":"Physical Fixed Assets Tagging & Verification (Bengaluru Office)","description":"Tag 45 newly procured Apple M3 MacBooks and conference room equipment with barcode stickers and update Fixed Asset Register (FAR).","category":"General Ledger & Fixed Assets","assignedTo":"Vikram Singhania","assignedRole":"Compliance Lead","priority":"Medium","status":"Under Review","decidedDate":"2026-09-12","durationDays":8,"fixedDeadline":"2026-09-20 16:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 14:00","progressPercentage":85,"progressUpdates":[{"id":"upd-4-1","date":"2026-09-14 18:00","updatedBy":"Vikram Singhania","progressPercentage":40,"notes":"Affixed barcode stickers to 25 MacBooks and 6 monitors.","status":"In Progress"},{"id":"upd-4-2","date":"2026-09-16 15:30","updatedBy":"Vikram Singhania","progressPercentage":70,"notes":"44 hardware devices physically verified; cross-referenced with vendor tax invoices.","status":"In Progress"},{"id":"upd-4-3","date":"2026-09-18 14:00","updatedBy":"Vikram Singhania","progressPercentage":85,"notes":"Updated FAR register with Schedule II depreciation rates. Awaiting 1 replacement laptop delivery.","status":"Under Review"}],"estimatedHours":8,"timeSpentHours":7.5,"createdAt":"2026-09-12","remarks":"Physical count completed. 44 assets tagged, 1 laptop replacement pending from Dell vendor.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '0115b7b4-5ae0-4456-a331-e04fe68aece4',
  'client-101',
  'Completed',
  '{"id":"act-5","title":"Monthly Payroll Variance & Overtime Audit (Aug 2026)","description":"Analyze MoM variance in gross salary vs net disbursal, verifying unpaid leaves, gratuity provision, and employee additions/exits.","category":"Payroll & HR Ops","assignedTo":"Amit Patel","assignedRole":"Payroll Specialist","priority":"High","status":"Completed","decidedDate":"2026-09-02","durationDays":5,"fixedDeadline":"2026-09-07 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-06 17:30","progressPercentage":100,"progressUpdates":[{"id":"upd-5-1","date":"2026-09-03 14:00","updatedBy":"Amit Patel","progressPercentage":30,"notes":"Biometric swipe logs verified for 120 employees; calculated Loss of Pay deductions.","status":"In Progress"},{"id":"upd-5-2","date":"2026-09-05 16:00","updatedBy":"Amit Patel","progressPercentage":75,"notes":"Reconciled statutory PF/ESIC/PT calculations; verified ₹1.12L variance from engineering hires.","status":"In Progress"},{"id":"upd-5-3","date":"2026-09-06 17:30","updatedBy":"Amit Patel","progressPercentage":100,"notes":"Bank salary payout file authorized by CFO and processed. Task fully completed.","status":"Completed"}],"estimatedHours":5,"timeSpentHours":4.5,"createdAt":"2026-09-02","completedAt":"2026-09-06 17:30","remarks":"Variance of ₹1.12L explained due to 3 new hires in engineering and 2 performance incentives.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  'c3a4e877-6361-40f8-a61a-df47cf3cfe5d',
  'client-101',
  'In Progress',
  '{"id":"act-6","title":"GSTR-2B vs Purchase Register ITC Mismatch Notice to Vendors","description":"Identify vendors whose invoices are missing in GSTR-2B resulting in ₹2.40L blocked ITC, and trigger automated follow-up notices.","category":"Direct/Indirect Tax Ops","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","priority":"High","status":"In Progress","decidedDate":"2026-09-16","durationDays":3,"fixedDeadline":"2026-09-19 19:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-17 17:00","progressPercentage":50,"progressUpdates":[{"id":"upd-6-1","date":"2026-09-17 17:00","updatedBy":"Rahul Verma","progressPercentage":50,"notes":"August GSTR-2B reconciled with tally purchase register. Identified 5 defaulting vendors holding ₹2.40L ITC; draft warning letters ready.","status":"In Progress"}],"estimatedHours":3.5,"timeSpentHours":2,"createdAt":"2026-09-16","remarks":"List of 5 defaulting suppliers extracted. Email draft prepared for CFO review.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '8323d93c-2869-4662-9bb6-b838e4857c9e',
  'client-101',
  'Under Review',
  '{"id":"act-7","title":"Monthly Financial MIS Deck & SaaS Unit Economics Presentation","description":"Prepare August 2026 deck containing MRR, CAC, LTV, Burn Multiple, Departmental Opex Budget vs Actuals for Board & Founder.","category":"Financial Reporting & MIS","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","priority":"Urgent","status":"Under Review","decidedDate":"2026-09-12","durationDays":6,"fixedDeadline":"2026-09-18 12:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-17 18:00","progressPercentage":90,"progressUpdates":[{"id":"upd-7-1","date":"2026-09-14 16:00","updatedBy":"Pooja Sharma","progressPercentage":40,"notes":"Trial balance closed with all accruals. Revenue cohorts and departmental opex extracted.","status":"In Progress"},{"id":"upd-7-2","date":"2026-09-16 17:30","updatedBy":"Pooja Sharma","progressPercentage":75,"notes":"Modeled SaaS unit metrics (CAC, LTV, Magic Number, Runway). Burn multiple refined to 1.4x.","status":"In Progress"},{"id":"upd-7-3","date":"2026-09-17 18:00","updatedBy":"Pooja Sharma","progressPercentage":90,"notes":"Executive deck compiled with revenue bridge analysis. Submitted to Sudhakar for CFO sign-off.","status":"Under Review"}],"estimatedHours":6,"timeSpentHours":5.5,"createdAt":"2026-09-12","remarks":"Draft slides compiled with revenue bridge analysis. Sudhakar is performing final review.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '04c214bf-19a2-4332-8cac-928529da5a64',
  'client-101',
  'Pending',
  '{"id":"act-8","title":"Corporate Travel & Entertainment Expense Vouchers Spot Audit","description":"Audit 38 reimbursement claims exceeding ₹10,000 for valid GST tax invoices with client GSTIN to maximize ITC claim.","category":"Internal Audit & Controls","assignedTo":"Pooja Sharma","assignedRole":"Accounts Executive","priority":"Low","status":"Pending","decidedDate":"2026-09-18","durationDays":7,"fixedDeadline":"2026-09-25 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 10:00","progressPercentage":10,"progressUpdates":[{"id":"upd-8-1","date":"2026-09-18 10:00","updatedBy":"Pooja Sharma","progressPercentage":10,"notes":"Drive folder created with 38 scanned travel and hotel vouchers. Checklist drafted for GSTIN verification.","status":"Pending"}],"estimatedHours":4,"timeSpentHours":0,"createdAt":"2026-09-18","remarks":"Vouchers collected in shared drive; audit checklist to be executed next week.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '40d466ef-f7c2-4644-9f54-c1709b9854ba',
  'client-101',
  'Completed',
  '{"id":"act-9","title":"Yarn & Greige Fabric 3-Way Match & MSME UDYAM Supplier Reconciliation","description":"Verify store GRNs and lab GSM test approvals against spinning mill tax invoices before scheduling weekly MSME vendor payment batch.","category":"Accounts Payable","assignedTo":"Sneha Roy","assignedRole":"Executive - Yarn, Fabric & Trim AP","priority":"High","status":"Completed","decidedDate":"2026-09-10","durationDays":5,"fixedDeadline":"2026-09-15 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-15 16:00","progressPercentage":100,"completedAt":"2026-09-15 16:00","estimatedHours":6,"timeSpentHours":5.5,"createdAt":"2026-09-10","remarks":"100% 3-way match completed across 42 fabric & trim invoices; ₹1.4L quality debit notes raised.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '5ffbff4f-98d6-4888-a8e1-215d472f2af3',
  'client-101',
  'Completed',
  '{"id":"act-10","title":"Export Container Commercial Invoice, Packing List & Customs LEO Audit","description":"Audit 12 Europe/US garment export shipping bills for FOB value, HS code, and RoSCTL scrip claim accuracy prior to vessel cut-off.","category":"Accounts Receivable","assignedTo":"Karthik Iyer","assignedRole":"Lead - Billing & Dispatch","priority":"High","status":"Completed","decidedDate":"2026-09-11","durationDays":5,"fixedDeadline":"2026-09-16 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-16 15:00","progressPercentage":100,"completedAt":"2026-09-16 15:00","estimatedHours":5,"timeSpentHours":4.5,"createdAt":"2026-09-11","remarks":"All 12 export containers cleared with zero customs query and 2.4h avg gate-out TAT.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  'ac02219c-912d-49c9-8e54-8f209bea3c5d',
  'client-101',
  'Completed',
  '{"id":"act-11","title":"Garment Style-Wise Pre-Cost vs Post-Shipment BOM Variance Sheet","description":"Compile post-shipment fabric consumption, dyeing shrinkage, and CM cost variance report for 28 Autumn/Winter export styles.","category":"Financial Reporting & MIS","assignedTo":"Ananya Krishnan","assignedRole":"Sr. Executive - MIS","priority":"High","status":"Completed","decidedDate":"2026-09-12","durationDays":6,"fixedDeadline":"2026-09-18 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-17 17:30","progressPercentage":95,"estimatedHours":8,"timeSpentHours":7,"createdAt":"2026-09-12","remarks":"Saved ₹6.4L in excess trim/fabric procurement via real-time BOM lock.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  'e09d00e0-a331-4fe8-b047-34d851358290',
  'client-101',
  'Completed',
  '{"id":"act-12","title":"Export Packing Credit (PCFC) Liquidation & RBI EDPMS / e-BRC Closure","description":"Knock off realized USD/EUR export bills in RBI EDPMS portal, generate DGFT e-BRCs for RoSCTL claims, and liquidate PCFC tranches.","category":"Banking & Treasury","assignedTo":"Rajeev Nambiar","assignedRole":"Bank Handling Lead","priority":"Urgent","status":"Completed","decidedDate":"2026-09-10","durationDays":6,"fixedDeadline":"2026-09-16 18:00","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-16 14:00","progressPercentage":100,"completedAt":"2026-09-16 14:00","estimatedHours":6,"timeSpentHours":5.5,"createdAt":"2026-09-10","remarks":"100% e-BRCs generated within 65 days; PCFC borrowing cost optimized at 5.8% p.a.","companyId":"client-101"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '723e2289-7eb0-4e34-8198-03e13253a761',
  'client-102',
  'In Progress',
  '{"id":"apex-act-1","companyId":"client-102","title":"Axis Bank Working Capital CC Stock & Receivables Statement","description":"Submission of monthly DP (Drawing Power) statement audited by Sudhakar to Axis Bank SME desk.","category":"Banking & Treasury","assignedTo":"Vikram Singhania","assignedRole":"Finance Controller","priority":"Urgent","status":"In Progress","decidedDate":"2026-09-14","durationDays":6,"fixedDeadline":"2026-09-20","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 15:00","progressPercentage":70,"progressUpdates":[{"id":"apex-upd-1-1","date":"2026-09-16 11:00","updatedBy":"Vikram Singhania","progressPercentage":35,"notes":"Consolidated stock inventory across 4 regional hubs.","status":"In Progress"},{"id":"apex-upd-1-2","date":"2026-09-18 15:00","updatedBy":"Vikram Singhania","progressPercentage":70,"notes":"Debtors aging report bifurcated (<90d vs >90d). DP calculation certified by Sudhakar.","status":"In Progress"}],"createdAt":"2026-09-14","remarks":"Stock statements from 4 regional warehouses consolidated; debtors aging report ready for CFO sign-off."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '27ba7bb6-d4bb-40a1-9c14-fd55ef042dd7',
  'client-102',
  'Pending',
  '{"id":"apex-act-2","companyId":"client-102","title":"Fleet Sub-Contractor TDS under Section 194C Lower Deduction Audit","description":"Verify Form 26Q TDS schedules for 45 transport sub-contractors and cross-check PAN with valid 197 lower deduction orders.","category":"Direct/Indirect Tax Ops","assignedTo":"Rahul Verma","assignedRole":"Tax Associate","priority":"High","status":"Pending","decidedDate":"2026-09-15","durationDays":9,"fixedDeadline":"2026-09-24","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-17 16:30","progressPercentage":30,"progressUpdates":[{"id":"apex-upd-2-1","date":"2026-09-17 16:30","updatedBy":"Rahul Verma","progressPercentage":30,"notes":"Collected transporter 194C(6) declarations. Verifying lower deduction orders on TRACES.","status":"Pending"}],"createdAt":"2026-09-15","remarks":"TDS liability computed at ₹1.85L. Pending 3 transporter PAN validation on IT portal."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '38ba7c57-8fba-4d4a-94be-6c243ba51b33',
  'client-102',
  'Completed',
  '{"id":"apex-act-3","companyId":"client-102","title":"E-Way Bill vs GSTR-1 Interstate Freight Reconciliation","description":"Match ₹4.8 Cr interstate consignment notes against generated E-way bills to eliminate GST notice risk.","category":"Internal Audit & Controls","assignedTo":"Pooja Sharma","assignedRole":"Sr. Accountant","priority":"Medium","status":"Completed","decidedDate":"2026-09-10","durationDays":7,"fixedDeadline":"2026-09-17","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-16 10:00","progressPercentage":100,"progressUpdates":[{"id":"apex-upd-3-1","date":"2026-09-12 14:00","updatedBy":"Pooja Sharma","progressPercentage":50,"notes":"Exported EWB-01 log from NIC portal; matching ₹4.8 Cr freight consignments.","status":"In Progress"},{"id":"apex-upd-3-2","date":"2026-09-16 10:00","updatedBy":"Pooja Sharma","progressPercentage":100,"notes":"Automated reconciliation passed with zero discrepancies. CFO signed variance report.","status":"Completed"}],"createdAt":"2026-09-10","completedAt":"2026-09-16T10:00:00Z","remarks":"Reconciliation completed. Zero discrepancies found between NIC portal e-way bills and sales register."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  'bd483afe-cf70-48bb-a468-1cfe3a1b422a',
  'client-103',
  'In Progress',
  '{"id":"zenith-act-1","companyId":"client-103","title":"MCA LLP Form 8 (Statement of Account & Solvency) Filing Draft","description":"Preparation of Statement of Solvency, partner contribution disclosures, and audit certification for FY 25-26.","category":"Financial Reporting & MIS","assignedTo":"CS Alok Mehta","assignedRole":"Secretarial Advisor","priority":"High","status":"In Progress","decidedDate":"2026-09-12","durationDays":16,"fixedDeadline":"2026-09-28","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-18 12:00","progressPercentage":65,"progressUpdates":[{"id":"zenith-upd-1-1","date":"2026-09-15 15:00","updatedBy":"CS Alok Mehta","progressPercentage":35,"notes":"LLP Statement of Assets and Liabilities drafted.","status":"In Progress"},{"id":"zenith-upd-1-2","date":"2026-09-18 12:00","updatedBy":"CS Alok Mehta","progressPercentage":65,"notes":"Designated Partners Solvency Declaration drafted and reviewed by Sudhakar.","status":"In Progress"}],"createdAt":"2026-09-12","remarks":"Balance sheet extract prepared. Sudhakar certificate scheduled for signature."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.action_items (id, company_id, status, data)
VALUES (
  '8f6306a5-57d8-49c1-9084-fdd344109292',
  'client-103',
  'Pending',
  '{"id":"zenith-act-2","companyId":"client-103","title":"R&D Bio-Sensor Patent Tax Incentive under Section 35(2AB)","description":"Documentation of clinical trial R&D expenditures to claim 100% weighted deduction under Income Tax Act.","category":"Direct/Indirect Tax Ops","assignedTo":"Sudhakar","assignedRole":"Virtual CFO","priority":"Medium","status":"Pending","decidedDate":"2026-09-14","durationDays":21,"fixedDeadline":"2026-10-05","checkInCadenceDays":2,"lastProgressUpdateDate":"2026-09-16 17:00","progressPercentage":25,"progressUpdates":[{"id":"zenith-upd-2-1","date":"2026-09-16 17:00","updatedBy":"Sudhakar","progressPercentage":25,"notes":"Collating component purchase invoices and lab trial testing fees for DSIR filing.","status":"Pending"}],"createdAt":"2026-09-14","remarks":"Technical report received from CSIR accredited laboratory."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

-- =========================================================
-- DATA MIGRATION: 5. Repository Matters (Tax, Legal, Licenses, SOPs)
-- =========================================================
INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '062e62c3-0925-4e7b-a975-40dc63f4da41',
  'client-101',
  'tax_assessment',
  '{"id":"tax-1","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"tax_assessment","taxCategory":"Income Tax","financialYear":"FY 2022-23 (AY 2023-24)","assessmentYear":"AY 2023-24","matterTitle":"Income Tax Scrutiny Assessment u/s 143(3) - R&D Capex & 80JJAA Relief","assessmentType":"Faceless Scrutiny Assessment u/s 143(3)","authority":"National Faceless Assessment Centre (NFAC), New Delhi","caseOrNoticeNumber":"ITBA/AST/S/143(3)/2024-25/10492104","demandAmount":3450000,"depositPaid":690000,"nextDueDate":"2026-10-15","dueDateType":"Hearing & Additional Ledger Reconciliations","status":"Hearing Scheduled","riskLevel":"High","counselName":"M/s K.V. Rao & Co., Chartered Accountants & Tax Advocates","summary":"Assessing Officer has queried ESOP cost amortisation and employee wage deductions claimed under Section 80JJAA. Detailed written submissions with Form 10DA filed. Final video-hearing scheduled.","chronology":[{"id":"chrono-tax-1-1","date":"2024-06-28","title":"Notice under Section 143(2) Issued for Limited Scrutiny","stageOrType":"Notice / Summons","authorityOrForum":"National Faceless Assessment Centre (NFAC), Delhi","orderRefNumber":"ITBA/AST/S/143(2)/2024-25/10492104","description":"Case selected for Faceless Scrutiny on grounds of high R&D amortisation and Section 80JJAA wage deductions.","outcomeOrNextStep":"Assessee directed to furnish books of accounts and Form 10DA by 18-Jul-2024.","statutoryDeadline":"2024-07-18","financialImpactAmount":3450000,"documentRef":"Notice_u_s_143_2_AY2023_24.pdf","recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-tax-1-2","date":"2024-07-16","title":"Initial Reply & Adjournment Application u/s 142(1)","stageOrType":"Reply / Written Statement","authorityOrForum":"NFAC Delhi, Assessment Unit","orderRefNumber":"ACK/E-FILING/2024/90124","description":"Part compliance submitted along with audited financials, Form 3CD, and request for extension for DSIR registration certificates.","outcomeOrNextStep":"AO granted extension up to 12-Aug-2024.","statutoryDeadline":"2024-08-12","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-1-3","date":"2024-08-28","title":"Detailed Written Submission with Form 10DA & CA Working","stageOrType":"Evidence / Verification","authorityOrForum":"NFAC Delhi, Assessment Unit","orderRefNumber":"ITBA/REPLY/142(1)/2024/88912","description":"Submitted comprehensive legal paper book explaining ESOP cost amortisation under Ind AS 102 and worker eligibility verification under Section 80JJAA.","outcomeOrNextStep":"Assessment unit scheduled technical verification.","documentRef":"Submission_Reply_Sec142_1.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-1-4","date":"2026-09-02","title":"Statutory 20% Stay Deposit Remitted via Challan 281","stageOrType":"Statutory Deposit / Payment","authorityOrForum":"Reserve Bank of India / NSDL OLTAS","orderRefNumber":"BSR 0002194 Challan No 89104","description":"Deposited ₹6,90,000 (20% of disputed demand) to obtain conditional stay on coercive recovery during pendency of assessment.","outcomeOrNextStep":"Stay granted pending final disposal of personal hearing.","financialImpactAmount":690000,"documentRef":"Challan_Stay_Deposit_20pct.pdf","recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-tax-1-5","date":"2026-10-15","title":"Scheduled Personal Hearing via Video Conference (NFAC)","stageOrType":"Hearing / Appearance","authorityOrForum":"NFAC Delhi, Video Conference Room 4","orderRefNumber":"VC/NOTICE/143(3)/2026/09","description":"Oral arguments by Senior Tax Advocate K.V. Rao on allowance of employee wages in commercial software testing unit.","outcomeOrNextStep":"Awaiting final assessment order u/s 143(3).","nextHearingDate":"2026-10-15","statutoryDeadline":"2026-10-15","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-1-1","date":"2026-08-10","author":"Client Accounting Team","authorRole":"client_team","status":"Notice Received","notes":"Received questionnaire u/s 142(1) seeking itemized trial balance and R&D register."},{"id":"prog-tax-1-2","date":"2026-08-28","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Response Filed","notes":"Uploaded comprehensive reconciliation along with CA Certificate for Section 80JJAA eligibility.","documentRef":"Submission_Reply_Sec142_1.pdf"},{"id":"prog-tax-1-3","date":"2026-09-12","author":"Client Accounting Team","authorRole":"client_team","status":"Hearing Scheduled","notes":"NFAC issued show-cause notice. Video conference scheduled for 15-Oct-2026. Legal team briefed."}],"documents":[{"id":"doc-tax-1-1","matterId":"tax-1","title":"Section 143(2) Scrutiny Notice","category":"Notice / Summons","fileName":"Notice_u_s_143_2_AY2023_24.pdf","fileType":"application/pdf","fileSize":"1.4 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-08-11","notes":"Original notice issued by NFAC on e-filing portal."},{"id":"doc-tax-1-2","matterId":"tax-1","title":"Written Submission & Form 10DA","category":"Petition / Reply","fileName":"Submission_Reply_Sec142_1.pdf","fileType":"application/pdf","fileSize":"3.8 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-29","notes":"Detailed CA verified justification for ESOP amortisation."},{"id":"doc-tax-1-3","matterId":"tax-1","title":"Stay of Demand Challan (20% Deposit)","category":"Challan / Payment Receipt","fileName":"Challan_Stay_Deposit_20pct.pdf","fileType":"application/pdf","fileSize":"420 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-02","notes":"Paid ₹6,90,000 via BSR 0002194 Challan No 89104."}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'c1df0953-246f-4f72-8dda-171fabc92f5a',
  'client-101',
  'tax_assessment',
  '{"id":"tax-2","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"tax_assessment","taxCategory":"GST","financialYear":"FY 2021-22 & FY 2022-23","assessmentYear":"FY 2022-23","matterTitle":"GST Departmental Audit u/s 65 - Input Tax Credit & E-way Bill Variance","assessmentType":"GST Audit by Department Authorities u/s 65","authority":"Office of the Joint Commissioner of Commercial Taxes (Audit-3), Bengaluru","caseOrNoticeNumber":"GSTN/AUDIT/SEC65/2024/0912","demandAmount":1820000,"depositPaid":0,"nextDueDate":"2026-10-28","dueDateType":"Filing Reconciled Vendor GSTR-2B Statement","status":"Response Filed","riskLevel":"Medium","counselName":"Adv. Suresh Singhania, Indirect Tax Counsel","summary":"Audit team raised preliminary audit observation on ITC availed on cloud services billed from overseas entity without RCM declaration, plus GSTR-2B timing differences. Detailed DRC-01A reply submitted.","chronology":[{"id":"chrono-tax-2-1","date":"2026-07-20","title":"Intimation of Audit u/s 65 via Form GST ADT-01","stageOrType":"Notice / Summons","authorityOrForum":"Office of the Joint Commissioner of Commercial Taxes (Audit-3), Bengaluru","orderRefNumber":"GSTN/AUDIT/ADT01/2026/0912","description":"Department initiated comprehensive desk audit of inward supply registers, E-way bill logs, and GSTR-3B filings for FY 2021-22 and FY 2022-23.","outcomeOrNextStep":"Company directed to keep books and invoices ready for desk audit.","statutoryDeadline":"2026-08-05","documentRef":"GST_ADT_01_Notice.pdf","recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-tax-2-2","date":"2026-08-08","title":"Audit Findings & Discrepancies Communicated via DRC-01A","stageOrType":"Notice / Summons","authorityOrForum":"Joint Commissioner (Audit-3)","orderRefNumber":"GST/DRC01A/ADT3/2026/410","description":"Audit team alleged ITC mismatch between GSTR-2A and GSTR-3B of ₹14.2 Lakhs and disputed RCM eligibility on overseas SaaS services of ₹4.0 Lakhs.","outcomeOrNextStep":"Formulation of vendor-wise reconciliation and invoice certificates.","statutoryDeadline":"2026-08-25","financialImpactAmount":1820000,"recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-2-3","date":"2026-08-16","title":"Comprehensive Written Reply & Chartered Accountant Reconciliation Filed","stageOrType":"Reply / Written Statement","authorityOrForum":"Joint Commissioner (Audit-3)","orderRefNumber":"DRC-01A/REPLY/2026/NEXORA","description":"Submitted DRC-01A response with 100% vendor reconciliation certificates under Circular 183/15/2022-GST proving suppliers paid tax in subsequent quarters.","outcomeOrNextStep":"Department reviewing CA certificates; final audit report pending.","documentRef":"DRC_01A_Reply_Submitted.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-2-4","date":"2026-10-28","title":"Statutory Deadline for Final Audit Clearance / Form ADT-02","stageOrType":"Final Order / Decree","authorityOrForum":"Joint Commissioner of Commercial Taxes, Bengaluru","orderRefNumber":"PENDING_ADT_02","description":"Statutory closure of Section 65 audit proceedings through issuance of Final Audit Report Form ADT-02.","outcomeOrNextStep":"Follow up with audit superintendent for dropped demand memo.","statutoryDeadline":"2026-10-28","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-2-1","date":"2026-07-20","author":"Client Accounting Team","authorRole":"client_team","status":"Notice Received","notes":"Audit team initiated desk verification u/s 65."},{"id":"prog-tax-2-2","date":"2026-08-15","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Response Filed","notes":"Submitted certified ledger extracts and proof of payment under RCM."}],"documents":[{"id":"doc-tax-2-1","matterId":"tax-2","title":"GST Form ADT-01 Audit Notice","category":"Notice / Summons","fileName":"GST_ADT_01_Notice.pdf","fileType":"application/pdf","fileSize":"920 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-07-22"},{"id":"doc-tax-2-2","matterId":"tax-2","title":"DRC-01A Submissions & Vendor Certificates","category":"Petition / Reply","fileName":"DRC_01A_Reply_Submitted.pdf","fileType":"application/pdf","fileSize":"2.6 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-08-16"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'e4b26045-9be4-46b1-b6d7-a0fb9a2816e3',
  'client-101',
  'tax_assessment',
  '{"id":"tax-3","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"tax_assessment","taxCategory":"Income Tax","financialYear":"FY 2018-19 (AY 2019-20)","assessmentYear":"AY 2019-20","matterTitle":"ITAT Tribunal Appeal - Angel Tax Valuation Section 56(2)(viib)","assessmentType":"Second Appeal before Appellate Tribunal (ITAT)","authority":"Income Tax Appellate Tribunal (ITAT), Bengaluru Bench ''B''","caseOrNoticeNumber":"ITA No. 892/BANG/2023","demandAmount":8500000,"depositPaid":1700000,"nextDueDate":"2026-11-18","dueDateType":"Oral Hearing of Grounds of Appeal","status":"Under Appeal","riskLevel":"High","counselName":"Fox Mandal & Associates (Senior Counsel Mr. S. Narayanan)","summary":"AO had added premium on Seed/Series A share issue as income u/s 56(2)(viib). CIT(A) upheld AO order without considering DPIIT startup exemption certificate. Appeal filed before ITAT; stay on recovery granted upon 20% deposit.","chronology":[{"id":"chrono-tax-3-1","date":"2023-12-14","title":"Order of First Appellate Authority (CIT Appeals) Passed","stageOrType":"Final Order / Decree","authorityOrForum":"Commissioner of Income Tax (Appeals)-1, Bengaluru","orderRefNumber":"CIT(A)/BLR-1/1092/2023","description":"CIT(A) confirmed addition of ₹8.5 Crore under Section 56(2)(viib) rejecting the DCF Merchant Banker report on grounds of post-investment actual revenue variation.","outcomeOrNextStep":"Advised to prefer statutory second appeal before ITAT within 60 days.","financialImpactAmount":8500000,"recordedBy":"Fox Mandal & Associates","recordedByRole":"cfo"},{"id":"chrono-tax-3-2","date":"2024-02-08","title":"Memorandum of Appeal (Form 36) Filed before ITAT Bengaluru","stageOrType":"Appeal / Revision","authorityOrForum":"Income Tax Appellate Tribunal (ITAT), Bengaluru Bench","orderRefNumber":"ITA No. 892/BANG/2023","description":"Form 36 filed with comprehensive grounds challenging rejection of DCF valuation and non-applicability of Angel Tax to DPIIT recognized startup entities.","outcomeOrNextStep":"Appeal registered and paper book filed.","documentRef":"ITAT_Form_36_Appeal_AY2019_20.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-3-3","date":"2024-03-22","title":"Pre-Deposit of 20% Stay Condition Executed via Challan","stageOrType":"Statutory Deposit / Payment","authorityOrForum":"NSDL OLTAS / Bank of Baroda","orderRefNumber":"CIN 02049182049281 Challan 280","description":"Remitted ₹1,70,0000 (20% of outstanding demand) as mandatory precondition for hearing of stay application.","outcomeOrNextStep":"Stay Petition listed before Division Bench.","financialImpactAmount":1700000,"recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-tax-3-4","date":"2026-09-05","title":"ITAT Stay Order Granted Unconditional Injunction on Recovery","stageOrType":"Interim Order / Stay","authorityOrForum":"ITAT Bengaluru Bench ''B'' (Judicial Member & Accountant Member)","orderRefNumber":"S.A. No. 44/BANG/2026 in ITA 892/BANG/2023","description":"Division Bench observed prima facie case in favor of assessee startup and granted stay on coercive bank attachments till final disposal.","outcomeOrNextStep":"Matter listed for final hearing of appeal on 18-Nov-2026.","documentRef":"ITAT_Stay_Order_Dated_05_Sep.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-3-5","date":"2026-11-18","title":"Scheduled Oral Hearing on Merits before ITAT Division Bench","stageOrType":"Hearing / Appearance","authorityOrForum":"ITAT Bengaluru Bench ''B''","orderRefNumber":"CAUSE_LIST_18_NOV_ITEM_12","description":"Senior Advocate S. Narayanan to argue binding Supreme Court and jurisdictional High Court precedents on startup valuation sanctity.","outcomeOrNextStep":"Awaiting pronouncement of Tribunal judgment.","nextHearingDate":"2026-11-18","statutoryDeadline":"2026-11-18","recordedBy":"Fox Mandal & Associates","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-3-1","date":"2026-06-10","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Under Appeal","notes":"Filed paper book containing DCF valuation report and DPIIT gazette notification."},{"id":"prog-tax-3-2","date":"2026-09-05","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Stay Granted","notes":"ITAT granted unconditional stay till disposal of appeal. Final hearing fixed for 18-Nov-2026."}],"documents":[{"id":"doc-tax-3-1","matterId":"tax-3","title":"ITAT Memorandum of Appeal (Form 36)","category":"Petition / Reply","fileName":"ITAT_Form_36_Appeal_AY2019_20.pdf","fileType":"application/pdf","fileSize":"4.1 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-06-11"},{"id":"doc-tax-3-2","matterId":"tax-3","title":"ITAT Stay Order on Tax Demand","category":"Assessment Order","fileName":"ITAT_Stay_Order_Dated_05_Sep.pdf","fileType":"application/pdf","fileSize":"1.1 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-06"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'a52b470e-1dc9-443e-983b-71b2035e85f6',
  'client-102',
  'tax_assessment',
  '{"id":"tax-4","companyId":"client-102","companyName":"Apex Retail Solutions India Ltd","type":"tax_assessment","taxCategory":"TDS / TCS","financialYear":"FY 2023-24","assessmentYear":"AY 2024-25","matterTitle":"TDS Section 194C vs 194J Software License Demand Rectification","assessmentType":"Intimation & Demand Rectification u/s 154","authority":"TDS CPC, Ghaziabad","caseOrNoticeNumber":"CPC/TDS/2024-25/194J/48190","demandAmount":480000,"depositPaid":0,"nextDueDate":"2026-10-05","dueDateType":"Filing Online Correction Statement & Conso File","status":"Response Filed","riskLevel":"Low","counselName":"In-house Tax & Accounts Team","summary":"TDS CPC generated demand treating IT infrastructure AMC under 10% (194J) instead of 2% (194C). Online correction filed on TRACES portal.","chronology":[{"id":"chrono-tax-4-1","date":"2024-08-14","title":"Intimation u/s 200A Generated by TDS CPC","stageOrType":"Notice / Summons","authorityOrForum":"TDS CPC, Ghaziabad","orderRefNumber":"CPC/TDS/2024-25/194J/48190","description":"Systemic intimation determining short deduction of ₹4.8 Lakhs on vendor payments by recharacterizing IT infrastructure AMC under Section 194J instead of 194C.","outcomeOrNextStep":"Assessee instructed to verify contracts and submit correction statement.","financialImpactAmount":480000,"statutoryDeadline":"2026-10-05","documentRef":"TRACES_Demand_Justification_Report.pdf","recordedBy":"In-house Tax & Accounts Team","recordedByRole":"client_team"},{"id":"chrono-tax-4-2","date":"2026-09-01","title":"Correction Statement & Section 154 Rectification Submitted","stageOrType":"Reply / Written Statement","authorityOrForum":"TRACES Portal / CPC TDS","orderRefNumber":"TOKEN_CORR_89210491","description":"Filed Type C3 correction statement reclassifying vendor contracts with Master Service Agreement supporting 2% TDS under 194C.","outcomeOrNextStep":"Awaiting automatic reprocessing and demand cancellation.","statutoryDeadline":"2026-10-05","recordedBy":"Client Accounting Team","recordedByRole":"client_team"}],"progressUpdates":[{"id":"prog-tax-4-1","date":"2026-09-01","author":"Client Accounting Team","authorRole":"client_team","status":"Response Filed","notes":"Uploaded revised statement on TRACES. Awaiting demand nullification."}],"documents":[{"id":"doc-tax-4-1","matterId":"tax-4","title":"TRACES Demand Intimation","category":"Notice / Summons","fileName":"TRACES_Demand_Justification_Report.pdf","fileType":"application/pdf","fileSize":"680 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-02"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '350f57b1-29fa-421e-8440-37a79c509de4',
  'client-101',
  'tax_assessment',
  '{"id":"tax-5","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"tax_assessment","taxCategory":"GST","financialYear":"FY 2022-23","assessmentYear":"FY 2022-23","matterTitle":"GST SCN in Form DRC-01 - Rule 42 Input Tax Credit Apportionment","assessmentType":"Show Cause Notice u/s 73 (Non-Fraud)","authority":"Assistant Commissioner of Central Tax, Division-IV, South Bengaluru","caseOrNoticeNumber":"GST/DRC01/DIV4/2024/7821","demandAmount":2640000,"depositPaid":528000,"nextDueDate":"2026-10-22","dueDateType":"Form DRC-06 Formal Written Reply & Reconciled Annexures","status":"Notice Received","riskLevel":"Medium","counselName":"M/s Lakshmikumaran & Sridharan (GST Litigation Team)","summary":"Department issued DRC-01 claiming excess ITC availed on common input services between taxable SaaS exports and exempt service components without annual reversal under CGST Rule 42. Legal reply drafting underway.","chronology":[{"id":"chrono-tax-5-1","date":"2026-09-08","title":"Show Cause Notice Issued in Form GST DRC-01","stageOrType":"Notice / Summons","authorityOrForum":"Assistant Commissioner of Central Tax, Division-IV, Bengaluru South","orderRefNumber":"GST/DRC01/DIV4/2024/7821","description":"SCN alleging failure to execute annual credit reversal under Rule 42 in respect of common input services used for zero-rated software exports.","outcomeOrNextStep":"Reply in Form DRC-06 to be filed within 30 days.","statutoryDeadline":"2026-10-22","financialImpactAmount":2640000,"documentRef":"DRC_01_Notice_Rule42_Reversal.pdf","recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-tax-5-2","date":"2026-09-18","title":"Pre-Consultation & Part Deposit Remittance","stageOrType":"Statutory Deposit / Payment","authorityOrForum":"GST Portal Electronic Cash Ledger","orderRefNumber":"CPIN 24092910481028","description":"Paid ₹5,28,000 voluntarily towards undisputed turnover proportion to mitigate interest accrual under Section 50(1).","outcomeOrNextStep":"Challan referenced in formal reply.","financialImpactAmount":528000,"recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-5-1","date":"2026-09-08","author":"Client Accounting Team","authorRole":"client_team","status":"Notice Received","notes":"DRC-01 served on GST portal. Tax liability calculated at ₹26.4 Lakhs plus interest."},{"id":"prog-tax-5-2","date":"2026-09-14","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Notice Received","notes":"Shared monthly turnover and export LUT data with tax counsel for DRC-06 response."}],"documents":[{"id":"doc-tax-5-1","matterId":"tax-5","title":"GST Form DRC-01 Show Cause Notice","category":"Notice / Summons","fileName":"DRC_01_Notice_Rule42_Reversal.pdf","fileType":"application/pdf","fileSize":"2.3 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-09"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '3c6884ec-bb33-4ce3-9a71-0697436726da',
  'client-101',
  'tax_assessment',
  '{"id":"tax-6","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"tax_assessment","taxCategory":"Income Tax","financialYear":"FY 2020-21 (AY 2021-22)","assessmentYear":"AY 2021-22","matterTitle":"Income Tax Reassessment Notice u/s 148A(b) - High Value Foreign Remittances","assessmentType":"Reassessment Proceedings u/s 148A","authority":"Income Tax Officer, Ward 3(1), International Taxation, Bengaluru","caseOrNoticeNumber":"ITBA/AST/F/148A(b)/2024-25/901238","demandAmount":5120000,"depositPaid":0,"nextDueDate":"2026-11-04","dueDateType":"Reply to Show Cause Notice u/s 148A(b) with Form 15CA/CB","status":"Notice Received","riskLevel":"High","counselName":"M/s K.V. Rao & Co., Chartered Accountants","summary":"Assessing officer queried foreign outward remittances for AWS cloud and overseas consultant payouts alleging non-deduction of withholding tax u/s 195. Detailed TRC and 15CA/CB certificates compile initiated.","chronology":[{"id":"chrono-tax-6-1","date":"2026-09-15","title":"Reassessment Show Cause Notice Issued u/s 148A(b)","stageOrType":"Notice / Summons","authorityOrForum":"Income Tax Officer, International Taxation, Bengaluru","orderRefNumber":"ITBA/AST/F/148A(b)/2024-25/901238","description":"Department initiated enquiry on foreign outward remittance of ₹5.12 Crore for cloud hosting and DevOps without 15CA/CB withholding.","outcomeOrNextStep":"Assessee given statutory opportunity to show cause why notice u/s 148 should not be issued.","statutoryDeadline":"2026-11-04","financialImpactAmount":5120000,"documentRef":"Notice_148A_b_AY2021_22.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-6-1","date":"2026-09-15","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Notice Received","notes":"Received notice u/s 148A(b) on e-filing portal. Due date for reply: 04-Nov-2026."}],"documents":[{"id":"doc-tax-6-1","matterId":"tax-6","title":"Notice u/s 148A(b) with Annexed Reasons","category":"Notice / Summons","fileName":"Notice_148A_b_AY2021_22.pdf","fileType":"application/pdf","fileSize":"1.9 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-16"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'cf5e6576-4faf-44f4-8469-b7f5fe97099a',
  'client-103',
  'tax_assessment',
  '{"id":"tax-7","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"tax_assessment","taxCategory":"GST","financialYear":"FY 2024-25","assessmentYear":"AY 2025-26","matterTitle":"GST Scrutiny u/s 65 - Tele-Medicine Diagnostic Platform Fee (18% vs Healthcare Exemption)","assessmentType":"Departmental Audit u/s 65 & Show Cause Notice","authority":"Directorate General of GST Intelligence (DGGI), Hyderabad Zonal Unit","caseOrNoticeNumber":"DGGI/HZU/INV/GST/2025/4412","demandAmount":1840000,"depositPaid":368000,"nextDueDate":"2026-10-22","dueDateType":"Reconciliation Submission & Medical Expert Opinion","status":"Reply Filed - Under Scrutiny","riskLevel":"High","counselName":"M/s Lakshmikumaran & Sridharan Attorneys (Adv. S. Ramanathan)","summary":"Department contends that SaaS subscriptions collected from diagnostic labs and hospitals are taxable at 18% under OIDAR / Information Technology software service, whereas assessee contends medical tele-consultation is exempt healthcare under Notification No. 12/2017-CT(R).","chronology":[{"id":"chrono-tax-7-1","date":"2025-08-14","title":"Summons u/s 70 & Scrutiny of Service Tax Ledger","stageOrType":"Notice / Summons","authorityOrForum":"DGGI Hyderabad Zonal Unit","orderRefNumber":"DGGI/HZU/SCN/2025/1109","description":"Enquiry initiated on hospital billing breakdown and software integration API fees.","outcomeOrNextStep":"Assessee furnished service agreements, medical council affiliations, and sample invoices.","statutoryDeadline":"2025-09-10","financialImpactAmount":1840000,"recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-tax-7-2","date":"2026-02-18","title":"20% Pre-Deposit Remitted under Protest via Form DRC-03","stageOrType":"Statutory Deposit / Payment","authorityOrForum":"GST Common Portal / ICICI Bank","orderRefNumber":"DRC-03 ARN AD3602260019284","description":"Paid ₹3,68,000 (20% voluntary deposit under protest) to avoid attachment of hospital escrow account.","outcomeOrNextStep":"Bank lien vacated.","financialImpactAmount":368000,"documentRef":"DRC03_Challan_Deposit_Zenith.pdf","recordedBy":"Client Finance Team","recordedByRole":"client_team"},{"id":"chrono-tax-7-3","date":"2026-10-22","title":"Final Technical Submissions & Telemedicine Practice Guidelines Citation","stageOrType":"Hearing / Appearance","authorityOrForum":"Joint Commissioner (Appeals), Hyderabad","orderRefNumber":"APL/GST/HYD/2026/89","description":"Advocate argument on clinical diagnostic support qualification under Healthcare Services definition.","outcomeOrNextStep":"Awaiting speaking order.","nextHearingDate":"2026-10-22","statutoryDeadline":"2026-10-22","recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-7-1","date":"2026-08-18","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Reply Filed - Under Scrutiny","notes":"Detailed legal paperbook citing Supreme Court precedents on healthcare diagnostic exemption filed.","documentRef":"Written_Submission_Healthcare_Exemption.pdf"}],"documents":[{"id":"doc-tax-7-1","matterId":"tax-7","title":"DGGI Show Cause Notice & SCN Annexure","category":"Notice / Summons","fileName":"DGGI_SCN_Telemedicine_Classification.pdf","fileType":"application/pdf","fileSize":"2.8 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-10"},{"id":"doc-tax-7-2","matterId":"tax-7","title":"DRC-03 Pre-Deposit Challan Receipt","category":"Order / Judgment","fileName":"DRC03_Challan_Deposit_Zenith.pdf","fileType":"application/pdf","fileSize":"640 KB","uploadedBy":"Client Finance Team","uploadedByRole":"client_team","uploadedAt":"2026-08-11"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '0b507ffe-e616-45e7-927c-c37f77c43f6e',
  'client-103',
  'tax_assessment',
  '{"id":"tax-8","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"tax_assessment","taxCategory":"Income Tax","financialYear":"FY 2024-25 (AY 2025-26)","assessmentYear":"AY 2025-26","matterTitle":"LLP Income Tax Scrutiny u/s 143(3) - Partner Remuneration Ceiling u/s 40(b)","assessmentType":"Faceless Scrutiny Assessment u/s 143(3)","authority":"National Faceless Assessment Centre (NFAC), New Delhi","caseOrNoticeNumber":"ITBA/AST/S/143(3)/2025-26/9021841","demandAmount":1120000,"depositPaid":0,"nextDueDate":"2026-11-10","dueDateType":"Form 3CD Annexure & Partnership Deed Submission","status":"Notice Received","riskLevel":"Medium","counselName":"Sudhakar (Virtual CFO Practice)","summary":"Assessing officer queried partner remuneration claimed in P&L exceeding book profit slabs under Section 40(b) and capitalization of AI diagnostic algorithms as intangible assets.","chronology":[{"id":"chrono-tax-8-1","date":"2026-08-25","title":"Notice u/s 142(1) with Questionnaire on Section 40(b) Limits","stageOrType":"Notice / Summons","authorityOrForum":"NFAC New Delhi","orderRefNumber":"ITBA/AST/F/142(1)/2026-27/1102","description":"Requisitioned audited financial statements, LLP agreement, and partner working hours certification.","outcomeOrNextStep":"Response due by 10-Nov-2026.","statutoryDeadline":"2026-11-10","financialImpactAmount":1120000,"recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-8-1","date":"2026-09-01","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Notice Received","notes":"Drafted reconciliation verifying book profit computation adheres strictly to Explanation 3 to Section 40(b)."}],"documents":[{"id":"doc-tax-8-1","matterId":"tax-8","title":"Notice u/s 142(1) & Itemized Questionnaire","category":"Notice / Summons","fileName":"Notice_142_1_AY2025_26_Zenith.pdf","fileType":"application/pdf","fileSize":"1.2 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-02"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'ab38d42a-8bc7-49f3-b7dd-0cc4ba9a1081',
  'client-102',
  'tax_assessment',
  '{"id":"tax-9","companyId":"client-102","companyName":"Apex Global Logistics India Pvt Ltd","type":"tax_assessment","taxCategory":"GST","financialYear":"FY 2025-26","assessmentYear":"AY 2026-27","matterTitle":"GST Section 129 Vehicle Detention & E-way Bill Expiry Penalty Appeal (NH-48 Flying Squad)","assessmentType":"Appellate Proceedings u/s 107 against MOV-09 Penalty Order","authority":"Appellate Authority & Joint Commissioner (Appeals), Pune","caseOrNoticeNumber":"GST/MOV-09/PUN/2026/8912","demandAmount":850000,"depositPaid":850000,"nextDueDate":"2026-10-28","dueDateType":"Personal Hearing via Video Conference","status":"Hearing Scheduled","riskLevel":"Medium","counselName":"M/s M.R. Shah & Associates, Advocates","summary":"Heavy commercial logistics vehicle intercepted near Pune due to E-Way bill expiry during transit caused by mechanical engine breakdown. Full 200% penalty of ₹8.5L paid under protest for vehicle release in Form MOV-09; appeal filed u/s 107 citing CBIC Circular No. 64/38/2018.","chronology":[{"id":"chrono-tax-9-1","date":"2026-05-12","title":"Interception Order & MOV-06 Detention","stageOrType":"Notice / Summons","authorityOrForum":"State Tax Flying Squad, Pune","orderRefNumber":"MOV-06/PUN/2026/102","description":"E-Way Bill expired by 14 hours during severe cyclone weather and highway breakdown.","outcomeOrNextStep":"Paid security under Section 129(1)(a) to release consignment and container truck.","statutoryDeadline":"2026-05-18","financialImpactAmount":850000,"recordedBy":"Vikram Singhania (Logistics Ops Head)","recordedByRole":"client_team"},{"id":"chrono-tax-9-2","date":"2026-06-04","title":"Statutory Appeal Filed in Form GST APL-01","stageOrType":"Reply / Written Statement","authorityOrForum":"Appellate Authority GST Pune","orderRefNumber":"APL-01/ACK/2026/5129","description":"Appeal filed with GPS log proofs, highway towing invoice, and breakdown evidence proving lack of mens rea / evasion intent.","outcomeOrNextStep":"Hearing notice issued.","financialImpactAmount":850000,"documentRef":"GST_APL01_Appeal_Memo.pdf","recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-tax-9-1","date":"2026-08-20","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Hearing Scheduled","notes":"Hearing confirmed for 28-Oct-2026. High likelihood of 100% refund under CBIC circular."}],"documents":[{"id":"doc-tax-9-1","matterId":"tax-9","title":"Form MOV-09 Penalty Order","category":"Order / Judgment","fileName":"MOV09_Penalty_Order_Pune.pdf","fileType":"application/pdf","fileSize":"1.1 MB","uploadedBy":"Client Finance Team","uploadedByRole":"client_team","uploadedAt":"2026-06-05"},{"id":"doc-tax-9-2","matterId":"tax-9","title":"Form GST APL-01 Appeal Dossier & GPS Logs","category":"Petition / Reply","fileName":"GST_APL01_Appeal_Memo.pdf","fileType":"application/pdf","fileSize":"3.5 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-06-06"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'a5038176-1d68-4a8f-930f-b1db67cb4812',
  'client-101',
  'legal_case',
  '{"id":"legal-1","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"legal_case","legalCategory":"Commercial / Contractual","matterTitle":"Commercial Recovery Suit vs. DataStream Logistics Pvt Ltd","forumOrCourt":"City Civil Court, Bengaluru (Commercial Division)","caseNumber":"Com. O.S. No. 512/2023","plaintiffOrApplicant":"Nexora Innovations Private Limited","defendantOrRespondent":"DataStream Logistics Private Limited","companyRole":"Plaintiff / Petitioner","claimOrExposureAmount":4200000,"contingentLiabilityStatus":"Remote","nextHearingDate":"2026-10-12","hearingPurpose":"Cross-examination of Defendant Witness (DW-1)","status":"Evidence Stage","riskLevel":"Medium","advocateLegalFirm":"Singhania & Partners LLP (Adv. Ananya Mukherjee)","summary":"Recovery of outstanding software development milestones, deployment fees, and accrued delayed interest @18% p.a. Defendant had filed vague defense claiming non-acceptance, which was refuted by signed UAT sign-offs.","chronology":[{"id":"chrono-leg-1-1","date":"2023-04-12","title":"Statutory Legal Notice for Recovery u/s 138 & Contract Covenants","stageOrType":"Notice / Summons","authorityOrForum":"Advocate Notice dispatched via Registered Post A.D.","orderRefNumber":"LEGAL/REC/2023/512","description":"Demanded outstanding principal of ₹42.0 Lakhs plus accrued delayed interest @18% for 4 delivered enterprise cloud integration modules.","outcomeOrNextStep":"Defendant issued evasive reply; suit instituted.","financialImpactAmount":4200000,"recordedBy":"Singhania & Partners LLP","recordedByRole":"cfo"},{"id":"chrono-leg-1-2","date":"2023-07-10","title":"Commercial Plaint Filed & Summons Issued","stageOrType":"Notice / Summons","authorityOrForum":"City Civil Court, Bengaluru (Commercial Division)","orderRefNumber":"Com. O.S. No. 512/2023","description":"Plaint admitted along with electronic evidence certificate under Section 65B of Indian Evidence Act.","outcomeOrNextStep":"Summons served on Defendant Managing Director.","documentRef":"Commercial_Plaint_OS_512_2023.pdf","recordedBy":"Adv. Ananya Mukherjee","recordedByRole":"cfo"},{"id":"chrono-leg-1-3","date":"2024-01-19","title":"Defendant Written Statement & Counterclaim Filed","stageOrType":"Reply / Written Statement","authorityOrForum":"City Civil Court, Bengaluru (Court Hall 14)","orderRefNumber":"WS/DEF/512/2024","description":"Defendant claimed server latency and alleged SLA default, demanding ₹10 Lakhs counterclaim without documentary substantiation.","outcomeOrNextStep":"Issues framed by Court on 15-Mar-2024.","recordedBy":"Singhania & Partners LLP","recordedByRole":"cfo"},{"id":"chrono-leg-1-4","date":"2026-07-15","title":"Plaintiff Evidence (PW-1) Concluded Successfully","stageOrType":"Evidence / Verification","authorityOrForum":"Commercial Court, Bengaluru","orderRefNumber":"DEPOSITION/PW1/2026","description":"VP Engineering marked Exhibit P1 to P18 (signed UAT certificates, milestone sign-offs, email admissions). Cross-examination completed with zero contradictions.","outcomeOrNextStep":"Defendant Witness DW-1 evidence affidavit taken on record.","documentRef":"Signed_UAT_Milestones_Exhibit_P1.pdf","recordedBy":"Client Accounting Team","recordedByRole":"client_team"},{"id":"chrono-leg-1-5","date":"2026-10-12","title":"Scheduled Cross-Examination of Defendant Witness (DW-1)","stageOrType":"Hearing / Appearance","authorityOrForum":"Commercial Division, City Civil Court","orderRefNumber":"CAUSE_LIST_12_OCT_CASE_4","description":"Cross-examination of Defendant Chief Operating Officer on admitted acceptance logs and commercial invoice approvals.","outcomeOrNextStep":"Closure of defense evidence and posting for final arguments.","nextHearingDate":"2026-10-12","statutoryDeadline":"2026-10-12","recordedBy":"Adv. Ananya Mukherjee","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-leg-1-1","date":"2026-07-15","author":"Client Accounting Team","authorRole":"client_team","status":"Evidence Stage","notes":"Our witness (PW-1 VP Engineering) completed cross-examination successfully."},{"id":"prog-leg-1-2","date":"2026-08-30","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Evidence Stage","notes":"Advocate Singhania reviewed DW-1 evidence affidavit. Prepared 18 cross-examination queries."}],"documents":[{"id":"doc-leg-1-1","matterId":"legal-1","title":"Commercial Plaint & Invoices","category":"Petition / Reply","fileName":"Commercial_Plaint_OS_512_2023.pdf","fileType":"application/pdf","fileSize":"5.2 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-07-16"},{"id":"doc-leg-1-2","matterId":"legal-1","title":"Signed UAT Sign-off Certificates","category":"Agreement / Evidence","fileName":"Signed_UAT_Milestones_Exhibit_P1.pdf","fileType":"application/pdf","fileSize":"1.8 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-07-20"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'e84d81e3-2b1a-4805-8398-126e273c5c09',
  'client-101',
  'legal_case',
  '{"id":"legal-2","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"legal_case","legalCategory":"IP & Trademark Infringement","matterTitle":"Trademark Protection - Wordmark & Logo ''NEXORA'' Infringement","forumOrCourt":"High Court of Karnataka, Bengaluru (Commercial Appellate)","caseNumber":"W.P. (IPD) No. 3401/2024","plaintiffOrApplicant":"Nexora Innovations Private Limited","defendantOrRespondent":"Nexora Fintech Labs LLP & Ors.","companyRole":"Plaintiff / Petitioner","claimOrExposureAmount":2500000,"contingentLiabilityStatus":"Remote","nextHearingDate":"2026-10-24","hearingPurpose":"Arguments on Confirmation of Ex-Parte Ad-Interim Injunction","status":"Interim Stay Active","riskLevel":"Medium","advocateLegalFirm":"Lakshmikumaran & Sridharan Attorneys","summary":"Suit filed for deceptive similarity in fintech SaaS brand name. High Court granted ex-parte interim injunction restraining defendant from using the mark ''Nexora'' or domain nexoratech.in. Matter listed for final confirmation.","chronology":[{"id":"chrono-leg-2-1","date":"2024-07-28","title":"Writ Petition (IPD) Filed before High Court of Karnataka","stageOrType":"Notice / Summons","authorityOrForum":"High Court of Karnataka, Principal Bench at Bengaluru","orderRefNumber":"W.P. (IPD) No. 3401/2024","description":"Instituted commercial intellectual property writ petition praying for temporary injunction against domain squatting and trademark passing-off.","outcomeOrNextStep":"Urgent motion moved before Vacation/Commercial Bench.","financialImpactAmount":2500000,"recordedBy":"Lakshmikumaran & Sridharan Attorneys","recordedByRole":"cfo"},{"id":"chrono-leg-2-2","date":"2026-08-04","title":"High Court Granted Ex-Parte Ad-Interim Injunction Order","stageOrType":"Interim Order / Stay","authorityOrForum":"High Court of Karnataka (Commercial Division)","orderRefNumber":"I.A. No. 1/2024 in W.P. 3401/2024","description":"Hon''ble Single Judge restrained respondents from launching product under identical wordmark ''Nexora'' or using impugned domain.","outcomeOrNextStep":"Order communicated to National Internet Exchange of India (NIXI).","documentRef":"High_Court_Injunction_Order_Dated_04_Aug.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-leg-2-3","date":"2026-10-24","title":"Hearing on Vacation / Absolute Confirmation of Injunction","stageOrType":"Hearing / Appearance","authorityOrForum":"High Court of Karnataka, Court Hall 6","orderRefNumber":"CAUSE_LIST_24_OCT_IPD_ITEM_3","description":"Senior Advocate to argue for making the ad-interim injunction order absolute till disposal of main commercial suit.","outcomeOrNextStep":"Awaiting final confirmation decree.","nextHearingDate":"2026-10-24","statutoryDeadline":"2026-10-24","recordedBy":"Lakshmikumaran & Sridharan Attorneys","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-leg-2-1","date":"2026-08-04","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Interim Stay Active","notes":"High Court granted ad-interim injunction order. Served on defendant and NIXI registrar."}],"documents":[{"id":"doc-leg-2-1","matterId":"legal-2","title":"High Court Ad-Interim Injunction Order","category":"Assessment Order","fileName":"High_Court_Injunction_Order_Dated_04_Aug.pdf","fileType":"application/pdf","fileSize":"1.2 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-05"},{"id":"doc-leg-2-2","matterId":"legal-2","title":"Trademark Registration Certificate (Class 9 & 42)","category":"License Certificate","fileName":"TM_Cert_Class9_42_Nexora.pdf","fileType":"application/pdf","fileSize":"750 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-08-05"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '0b32a911-c4b4-4699-883e-b47231055e23',
  'client-101',
  'legal_case',
  '{"id":"legal-3","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"legal_case","legalCategory":"Arbitration","matterTitle":"Arbitration Proceedings - Former Director Non-Compete Breach","forumOrCourt":"Arbitration Centre, Bengaluru (BACC)","caseNumber":"BACC/ARB/2024/77","plaintiffOrApplicant":"Nexora Innovations Private Limited","defendantOrRespondent":"Vikram Malhotra (Former CTO)","companyRole":"Plaintiff / Petitioner","claimOrExposureAmount":1500000,"contingentLiabilityStatus":"Remote","nextHearingDate":"2026-11-10","hearingPurpose":"Final Arguments & Award Formulation","status":"Arguments Concluded","riskLevel":"Low","advocateLegalFirm":"Cyril Amarchand Mangaldas","summary":"Arbitration invoked as per Employment and Shareholder Agreement covenants. Respondent joined direct competitor within 4 months of resignation while holding confidential source code.","chronology":[{"id":"chrono-leg-3-1","date":"2024-04-05","title":"Section 21 Arbitration Notice Issued","stageOrType":"Notice / Summons","authorityOrForum":"Arbitration Centre, Bengaluru (BACC)","orderRefNumber":"BACC/ARB/NOT/2024/77","description":"Invoked Clause 17.2 of Founder Shareholder Agreement for appointment of Sole Arbitrator regarding proprietary source code breach.","outcomeOrNextStep":"BACC appointed Hon''ble Retired High Court Justice as Sole Arbitrator.","financialImpactAmount":1500000,"recordedBy":"Cyril Amarchand Mangaldas","recordedByRole":"cfo"},{"id":"chrono-leg-3-2","date":"2024-06-20","title":"Statement of Claim & Evidence Affidavits Filed","stageOrType":"Evidence / Verification","authorityOrForum":"Sole Arbitral Tribunal, BACC","orderRefNumber":"BACC/ARB/2024/77/CLAIM","description":"Submitted electronic forensic audit log showing code exports from company GitHub repositories prior to resignation.","outcomeOrNextStep":"Respondent filed Statement of Defense.","documentRef":"Arbitration_Statement_of_Claim.pdf","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-leg-3-3","date":"2026-09-02","title":"Oral Arguments Concluded & Award Reserved","stageOrType":"Hearing / Appearance","authorityOrForum":"Sole Arbitral Tribunal, BACC","orderRefNumber":"RECORD_OF_PROCEEDINGS_02_SEP","description":"Final oral arguments concluded by both senior counsels. Learned Arbitrator closed oral hearings and reserved arbitral award.","outcomeOrNextStep":"Written submissions filed; awaiting delivery of Arbitral Award.","nextHearingDate":"2026-11-10","statutoryDeadline":"2026-11-10","recordedBy":"Rajesh Kannan (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-leg-3-1","date":"2026-09-02","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Arguments Concluded","notes":"Sole Arbitrator reserved award. Parties directed to submit written synopses within 10 days."}],"documents":[{"id":"doc-leg-3-1","matterId":"legal-3","title":"Arbitration Claim Statement & Agreement Excerpts","category":"Petition / Reply","fileName":"Arbitration_Statement_of_Claim.pdf","fileType":"application/pdf","fileSize":"3.2 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-03"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '5805194f-7d15-4b42-ac56-9f49a749485e',
  'client-103',
  'legal_case',
  '{"id":"legal-4","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"legal_case","legalCategory":"Commercial / Contractual","matterTitle":"Healthcare Enterprise SaaS SLA & Diagnostic Accuracy Warranty Dispute with CareLife Hospitals","forumOrCourt":"Commercial Arbitration Tribunal, Hyderabad (Sole Arbitrator Justice K. Ramachandra Retd.)","caseNumber":"ARB/HYD/COM/2026/184","plaintiffOrApplicant":"CareLife Healthcare Enterprises Limited","defendantOrRespondent":"Zenith HealthTech Solutions LLP","companyRole":"Defendant / Respondent","claimOrExposureAmount":2800000,"contingentLiabilityStatus":"Possible","nextHearingDate":"2026-11-08","hearingPurpose":"Statement of Defense & Expert Radiologist Testimony","status":"Pleadings Stage","riskLevel":"Medium","advocateLegalFirm":"M/s Krishna & Saurastri Associates LLP","summary":"Hospital partner filed arbitration alleging 4 hours of diagnostic API downtime and disputed ECG algorithm accuracy thresholds. Zenith has countered with signed SLA logs demonstrating 99.85% uptime and user negligence in local network gateway.","chronology":[{"id":"chrono-leg-4-1","date":"2026-06-20","title":"Arbitration Notice Invocation u/s 21 of Arbitration Act","stageOrType":"Notice / Summons","authorityOrForum":"Sole Arbitrator Chambers, Hyderabad","orderRefNumber":"ARB/NT/2026/01","description":"CareLife claimed liquidated damages of ₹28 Lakhs for alleged SLA penalty.","outcomeOrNextStep":"Zenith filed statement denying breach.","statutoryDeadline":"2026-07-30","financialImpactAmount":2800000,"recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-leg-4-2","date":"2026-08-12","title":"Preliminary Hearing & Timeline for Statement of Defense","stageOrType":"Hearing / Appearance","authorityOrForum":"Arbitration Tribunal","orderRefNumber":"ARB/ORD/01/2026","description":"Arbitrator directed Zenith to submit technical logs and defense by 08-Nov-2026.","outcomeOrNextStep":"Technical audit logs compiled.","nextHearingDate":"2026-11-08","statutoryDeadline":"2026-11-08","recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-leg-4-1","date":"2026-08-15","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Pleadings Stage","notes":"Cloud server AWS uptime report exported showing 99.85% SLA was maintained. Risk rated as manageable."}],"documents":[{"id":"doc-leg-4-1","matterId":"legal-4","title":"Arbitration Claim Petition by CareLife","category":"Petition / Reply","fileName":"CareLife_Arbitration_Claim.pdf","fileType":"application/pdf","fileSize":"2.1 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-06-25"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '17cfecfc-495e-4546-8643-052c2405ccff',
  'client-102',
  'legal_case',
  '{"id":"legal-5","companyId":"client-102","companyName":"Apex Global Logistics India Pvt Ltd","type":"legal_case","legalCategory":"Commercial / Contractual","matterTitle":"Consolidated Demurrage & Container Detention Claim by Maersk Line India","forumOrCourt":"High Court of Judicature at Bombay (Commercial Division)","caseNumber":"Comm. Summary Suit No. 1092/2025","plaintiffOrApplicant":"Maersk Line India Private Limited","defendantOrRespondent":"Apex Global Logistics India Pvt Ltd & Consignee TechSol","companyRole":"Defendant / Respondent","claimOrExposureAmount":1950000,"contingentLiabilityStatus":"Remote","nextHearingDate":"2026-10-30","hearingPurpose":"Notice of Motion Hearing on Consignee Indemnity Liability","status":"Pleadings Stage","riskLevel":"Low","counselName":"Adv. Cyrus Bharucha (Bombay High Court)","summary":"Shipping line levied container detention charges for cargo stranded at CFS Nhava Sheva due to customs clearance delay by ultimate importer TechSol. Apex was acting solely as multimodal transport freight intermediary and holds back-to-back written indemnity from the importer.","chronology":[{"id":"chrono-leg-5-1","date":"2025-11-10","title":"Summary Suit Summons Received","stageOrType":"Notice / Summons","authorityOrForum":"Bombay High Court Commercial Division","orderRefNumber":"SS/1092/2025/BOM","description":"Claim for ₹19.5 Lakhs detention charges for 4 x 40ft high cube containers.","outcomeOrNextStep":"Appearance entered by counsel.","statutoryDeadline":"2025-12-15","financialImpactAmount":1950000,"recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"},{"id":"chrono-leg-5-2","date":"2026-03-20","title":"Third Party Notice Issued to Importer TechSol under Order VIII-A CPC","stageOrType":"Reply / Written Statement","authorityOrForum":"Bombay High Court","orderRefNumber":"TPN/1092/2026","description":"Apex impleaded ultimate cargo importer for complete indemnification under contract terms.","outcomeOrNextStep":"Court directed TechSol to file reply by 30-Oct-2026.","nextHearingDate":"2026-10-30","statutoryDeadline":"2026-10-30","recordedBy":"Sudhakar (Virtual CFO)","recordedByRole":"cfo"}],"progressUpdates":[{"id":"prog-leg-5-1","date":"2026-08-10","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Pleadings Stage","notes":"Counsel confirms liability is fully shifted to cargo importer. Remote contingent liability exposure for Apex."}],"documents":[{"id":"doc-leg-5-1","matterId":"legal-5","title":"High Court Commercial Suit Plaint & Bill of Lading Copies","category":"Petition / Reply","fileName":"HighCourt_Plaint_Demurrage_Claim.pdf","fileType":"application/pdf","fileSize":"4.1 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-03-25"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '0eea5791-43ab-476f-a5aa-46ed52d60468',
  'client-101',
  'license_certification',
  '{"id":"lic-1","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"license_certification","licenseCategory":"Environmental & Safety","title":"Consent to Operate (CTO) - Air & Water Pollution Control","issuingAuthority":"Karnataka State Pollution Control Board (KSPCB)","licenseNumber":"KSPCB/BNG/CTO-A&W/2024-26/1842","issuedDate":"2024-11-01","expiryDate":"2026-10-31","renewalWindowDays":60,"annualFeeOrCost":85000,"status":"Renewal Due Soon","renewalOfficer":"Rohan Varma (Operations) & Client Team","summary":"Statutory green category consent required for tech assembly lab and diesel backup generator sets at Electronic City facility. Renewal application must be filed before 15-Oct with acoustic emission test report.","progressUpdates":[{"id":"prog-lic-1-1","date":"2026-09-05","author":"Client Accounting Team","authorRole":"client_team","status":"Renewal Due Soon","notes":"Commissioned environmental testing agency for noise and ambient air quality analysis."},{"id":"prog-lic-1-2","date":"2026-09-15","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Renewal In Progress","notes":"Approved payment voucher for ₹85,000 statutory fee. Online KSPCB portal application drafted."}],"documents":[{"id":"doc-lic-1-1","matterId":"lic-1","title":"Current KSPCB CTO Certificate","category":"License Certificate","fileName":"KSPCB_CTO_Certificate_2024_2026.pdf","fileType":"application/pdf","fileSize":"1.6 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-05"},{"id":"doc-lic-1-2","matterId":"lic-1","title":"Ambient Air & Noise Test Report","category":"Agreement / Evidence","fileName":"Air_Noise_Quality_Report_Sep2026.pdf","fileType":"application/pdf","fileSize":"2.1 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-16"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '4f7751b6-347d-445b-b4da-1188a703cfc4',
  'client-101',
  'license_certification',
  '{"id":"lic-2","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"license_certification","licenseCategory":"Quality & Security Certification","title":"ISO/IEC 27001:2022 Information Security Management (ISMS)","issuingAuthority":"BSI Assurance India Pvt Ltd (Accredited by UKAS)","licenseNumber":"ISMS-IND-2023-74910","issuedDate":"2023-11-15","expiryDate":"2026-11-14","renewalWindowDays":90,"annualFeeOrCost":250000,"status":"Renewal In Progress","renewalOfficer":"Priya Nair (CISO) & Rajesh Kannan (CFO)","summary":"Mandatory security certification required for enterprise SaaS contracts and bank integrations. Stage-1 surveillance audit completed; Stage-2 recertification audit scheduled for first week of November.","progressUpdates":[{"id":"prog-lic-2-1","date":"2026-08-20","author":"Client Accounting Team","authorRole":"client_team","status":"Renewal In Progress","notes":"Internal ISMS audit conducted; zero non-conformities identified. Stage-2 dates locked with BSI."}],"documents":[{"id":"doc-lic-2-1","matterId":"lic-2","title":"ISO 27001 Certificate of Registration","category":"License Certificate","fileName":"ISO_27001_2022_Certificate.pdf","fileType":"application/pdf","fileSize":"890 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-21"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '7033fa98-8607-4b89-86f1-9be17f77c022',
  'client-101',
  'license_certification',
  '{"id":"lic-3","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"license_certification","licenseCategory":"Environmental & Safety","title":"Fire Safety Clearance NOC","issuingAuthority":"Karnataka State Fire & Emergency Services, Bengaluru","licenseNumber":"KSFES/NOC/BNG/2025/3910","issuedDate":"2025-10-10","expiryDate":"2026-10-09","renewalWindowDays":30,"annualFeeOrCost":30000,"status":"Renewal Due Soon","renewalOfficer":"Prem Kumar (Facilities Manager)","summary":"Annual clearance certificate for fire hydrants, smoke detectors, and emergency exits. Fire drill and physical inspection scheduled for 26-Sep.","progressUpdates":[{"id":"prog-lic-3-1","date":"2026-09-10","author":"Client Accounting Team","authorRole":"client_team","status":"Renewal Due Soon","notes":"Inspection request submitted on Seva Sindhu portal. Inspection fee paid."}],"documents":[{"id":"doc-lic-3-1","matterId":"lic-3","title":"Fire Safety Clearance NOC 2025-26","category":"License Certificate","fileName":"Fire_Safety_NOC_2025.pdf","fileType":"application/pdf","fileSize":"1.1 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-11"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '658c7fc4-e3f7-4c0b-b92a-e5a5f9e53fe3',
  'client-101',
  'license_certification',
  '{"id":"lic-4","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"license_certification","licenseCategory":"Statutory & Operating","title":"Karnataka Shops & Commercial Establishments Act Registration","issuingAuthority":"Labour Department, Government of Karnataka","licenseNumber":"KA/BNG/SHOP/2021/89218","issuedDate":"2021-06-01","expiryDate":"2027-05-31","renewalWindowDays":60,"annualFeeOrCost":15000,"status":"Active & Valid","renewalOfficer":"HR & Legal Operations","summary":"Perpetual 5-year registration for commercial workplace and software development center employing 120+ staff.","progressUpdates":[],"documents":[{"id":"doc-lic-4-1","matterId":"lic-4","title":"Form-C Registration Certificate","category":"License Certificate","fileName":"Shops_Establishment_Form_C.pdf","fileType":"application/pdf","fileSize":"720 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-01-10"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '5702a23d-e78d-4cb3-99a4-f51083bf89b0',
  'client-101',
  'license_certification',
  '{"id":"lic-5","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"license_certification","licenseCategory":"Trade & Export","title":"Import Export Code (IEC) & Annual Status Verification","issuingAuthority":"Directorate General of Foreign Trade (DGFT), Ministry of Commerce","licenseNumber":"0719829104","issuedDate":"2021-04-10","expiryDate":"2027-06-30","renewalWindowDays":90,"annualFeeOrCost":0,"status":"Active & Valid","renewalOfficer":"Finance & Accounts","summary":"DGFT electronic IEC mandatory for receiving foreign software export proceeds via EEFC account and customs duty exemption.","progressUpdates":[],"documents":[{"id":"doc-lic-5-1","matterId":"lic-5","title":"DGFT IEC Electronic Certificate","category":"License Certificate","fileName":"DGFT_IEC_Certificate.pdf","fileType":"application/pdf","fileSize":"510 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-04-15"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'b3d38887-c641-4263-9924-1ecc8c252d27',
  'client-102',
  'license_certification',
  '{"id":"lic-6","companyId":"client-102","companyName":"Apex Retail Solutions India Ltd","type":"license_certification","licenseCategory":"Statutory & Operating","title":"FSSAI Central Food Safety & Distribution License","issuingAuthority":"Food Safety and Standards Authority of India (FSSAI)","licenseNumber":"10022043000812","issuedDate":"2024-10-19","expiryDate":"2026-10-18","renewalWindowDays":60,"annualFeeOrCost":120000,"status":"Renewal In Progress","renewalOfficer":"Quality Control Lead","summary":"Central FSSAI license for packaged foods e-commerce and multi-state warehouse fulfillment.","progressUpdates":[{"id":"prog-lic-6-1","date":"2026-09-02","author":"Client Accounting Team","authorRole":"client_team","status":"Renewal In Progress","notes":"Online renewal filed on FoSCoS portal with audited turnover certificate."}],"documents":[{"id":"doc-lic-6-1","matterId":"lic-6","title":"FSSAI Central License Copy","category":"License Certificate","fileName":"FSSAI_Central_License.pdf","fileType":"application/pdf","fileSize":"1.4 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-09-02"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'c2cabd75-e0df-4737-a9d1-1d5e2159bc64',
  'client-103',
  'license_certification',
  '{"id":"lic-7","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"license_certification","licenseCategory":"Regulatory & Operating","title":"CDSCO Software as a Medical Device (SaMD) Class B Regulatory Clearance","issuingAuthority":"Central Drugs Standard Control Organisation (CDSCO), Ministry of Health & Family Welfare","licenseNumber":"CDSCO/MD/SaMD-B/2024/1109","issuedDate":"2024-05-15","expiryDate":"2029-05-14","renewalWindowDays":180,"annualFeeOrCost":150000,"status":"Active & Valid","renewalOfficer":"Dr. Meera Krishnan (Chief Medical Officer)","summary":"Statutory Class B medical device registration permitting commercial deployment of AI diagnostic radiology and ECG triage software in Indian hospitals and clinics under Medical Devices Rules 2017.","applicableRegulations":["Medical Devices Rules 2017 (MDR-2017)","Drugs and Cosmetics Act 1940","Telemedicine Practice Guidelines (Board of Governors in supersession of MCI)"],"progressUpdates":[{"id":"prog-lic-7-1","date":"2026-05-10","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Active & Valid","notes":"Annual post-market clinical surveillance report submitted to CDSCO portal without adverse remarks."}],"documents":[{"id":"doc-lic-7-1","matterId":"lic-7","title":"CDSCO Class B SaMD Registration Certificate","category":"License Certificate","fileName":"CDSCO_SaMD_ClassB_License.pdf","fileType":"application/pdf","fileSize":"2.3 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-05-11"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '2d676456-2468-40db-a4c1-427c5da6bed8',
  'client-103',
  'license_certification',
  '{"id":"lic-8","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"license_certification","licenseCategory":"Quality & Industry Certifications","title":"ISO 13485:2016 Medical Devices QMS & HIPAA Security Compliance Attestation","issuingAuthority":"BSI Assurance UK / Indian Auditor Bureau","licenseNumber":"BSI/MD-QMS/13485/2023/981","issuedDate":"2023-11-20","expiryDate":"2026-11-19","renewalWindowDays":60,"annualFeeOrCost":220000,"status":"Renewal Due Soon","renewalOfficer":"Sudhakar (Virtual CFO) & Lead DevOps Security","summary":"Global medical device quality management standard governing software risk management (ISO 14971) and HIPAA/HITECH patient electronic protected health information (ePHI) encryption benchmarks.","applicableRegulations":["ISO 13485:2016 Medical Devices Quality Management","HIPAA Security Rule 45 CFR Part 160 and Part 164","Digital Personal Data Protection Act (DPDPA 2023)"],"progressUpdates":[{"id":"prog-lic-8-1","date":"2026-09-05","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Renewal Due Soon","notes":"Stage-1 surveillance audit concluded with zero major non-conformities (NC). Stage-2 recertification scheduled for 25-Oct-2026."}],"documents":[{"id":"doc-lic-8-1","matterId":"lic-8","title":"ISO 13485:2016 Certificate & HIPAA SOC2 Attestation","category":"License Certificate","fileName":"ISO13485_HIPAA_Certification.pdf","fileType":"application/pdf","fileSize":"1.9 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-06"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'c5e2ab2f-761b-4af9-9fa9-9ce5654dfb5e',
  'client-102',
  'license_certification',
  '{"id":"lic-9","companyId":"client-102","companyName":"Apex Global Logistics India Pvt Ltd","type":"license_certification","licenseCategory":"Regulatory & Operating","title":"Authorized Economic Operator (AEO-T1) Accreditation & Customs Brokerage","issuingAuthority":"Central Board of Indirect Taxes and Customs (CBIC), Directorate of International Customs","licenseNumber":"INAAACN9102A1F230","issuedDate":"2024-03-01","expiryDate":"2027-02-28","renewalWindowDays":90,"annualFeeOrCost":75000,"status":"Active & Valid","renewalOfficer":"Rajesh Malhotra (Customs Brokerage Head)","summary":"AEO-T1 tier security status providing direct port delivery (DPD), fast-track container clearance, deferred customs duty payments, and reduced physical inspection of shipments at all Indian sea and air cargo terminals.","applicableRegulations":["Customs Act 1962 (Section 146)","CBIC Circular No. 33/2016-Customs (AEO Programme Framework)"],"progressUpdates":[{"id":"prog-lic-9-1","date":"2026-07-15","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Active & Valid","notes":"Annual compliance return filed on AEO portal with clean customs ledger reconciliation."}],"documents":[{"id":"doc-lic-9-1","matterId":"lic-9","title":"CBIC AEO-T1 Certificate of Recognition","category":"License Certificate","fileName":"CBIC_AEO_T1_Certificate.pdf","fileType":"application/pdf","fileSize":"1.3 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-07-16"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '8bd8a9f7-52ec-471a-a803-f3d8baa17c7f',
  'client-101',
  'sop',
  '{"id":"sop-1","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-AP-001","sopCategory":"Accounts Payable & Vendor Processing","title":"Vendor Invoice 3-Way Match, Section 194Q/194C TDS & 45-Day MSME Payment Processing SOP","version":"v2.2","effectiveDate":"2026-04-01","nextReviewDate":"2026-10-25","reviewFrequency":"Bi-Annual","department":"Finance & Accounts","owner":"Rajesh Kannan (Virtual CFO)","approver":"Board of Directors / Managing Director","status":"Active & Operational","riskLevel":"High","summary":"Standard operating procedure governing end-to-end accounts payable: purchase order (PO) generation, goods/service receipt note (GRN/SRN), GSTR-2B 100% ITC matching, statutory withholding (TDS u/s 194C, 194J, 194Q), MSMED Act Section 15 compliance (45-day cycle u/s 43B(h)), and dual-authorization batch disbursements via corporate banking.","scope":"Applicable to all vendor procurements, operating expenditures, capex contracts, and outsourced service retainers across all corporate entities.","applicableRegulations":["MSMED Act 2006 (Section 15, 16)","Income Tax Act 1961 (Section 43B(h), 194C, 194J, 194Q)","CGST Rules 2017 (Rule 36(4) GSTR-2B reconciliation)"],"keySteps":[{"stepNumber":1,"title":"Purchase Order & Contract Validation","responsibility":"Procurement Lead & Department Head","timelineOrTAT":"T+24 Hours from requisition","description":"Verify approved PO exists with agreed unit rates, payment terms, and vendor GSTIN. Confirm MSME registration status (Udyam Certificate).","controlCheckpoint":"No PO No Pay policy enforced in ERP; MSME category tag mandatory."},{"stepNumber":2,"title":"Goods / Service Receipt & GSTR-2B Inward Portal Match","responsibility":"Store / Admin & Junior Accountant","timelineOrTAT":"Within 48 hours of physical receipt","description":"Generate GRN/SRN after physical or milestone verification. Cross-check vendor invoice in GST Portal GSTR-2B; reject or hold if not appearing in 2B.","controlCheckpoint":"Zero ITC claim without corresponding invoice reflection in GSTR-2B."},{"stepNumber":3,"title":"3-Way Match & Withholding Tax Computation","responsibility":"Senior Accounts Executive","timelineOrTAT":"Within 3 business days of invoice receipt","description":"Perform 3-way match: PO vs GRN vs Tax Invoice. Calculate statutory TDS: 0.1% u/s 194Q (goods > ₹50L), 1% or 2% u/s 194C (contractors), or 10% u/s 194J (professional/tech fees).","controlCheckpoint":"Automated TDS deduction in accounting ledger; verification of PAN validity."},{"stepNumber":4,"title":"MSME 45-Day Priority Tagging u/s 43B(h)","responsibility":"Finance Manager","timelineOrTAT":"Immediate upon invoice booking","description":"Tag payment due date strictly within 45 days (if written agreement exists) or 15 days (without agreement) to prevent disallowance u/s 43B(h).","controlCheckpoint":"ERP alert 10 days prior to MSME cutoff date; weekly aging review."},{"stepNumber":5,"title":"Dual Banking Approval & Payment Run","responsibility":"Virtual CFO (Checker) & Managing Director (Authorizer)","timelineOrTAT":"Twice a week (Tuesdays & Fridays)","description":"Consolidated payment batch generated in ERP, verified against bank balance, and released via corporate net banking maker-checker workflow.","controlCheckpoint":"Dual OTP/Token authorization; payment advice emailed to vendor automatically."}],"progressUpdates":[{"id":"prog-sop-1-1","date":"2026-08-15","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Updated Section 43B(h) MSME workflow with automated 15/45-day tracking in accounting system.","documentRef":"SOP_AP_3WayMatch_MSME_v2.2.pdf"}],"documents":[{"id":"doc-sop-1-1","matterId":"sop-1","title":"SOP Manual - AP 3-Way Match & MSME Compliance v2.2","category":"SOP / Process Manual","fileName":"SOP_AP_3WayMatch_MSME_v2.2.pdf","fileType":"application/pdf","fileSize":"1.2 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-15","notes":"Approved procedure manual including MSME Section 43B(h) checklists."},{"id":"doc-sop-1-2","matterId":"sop-1","title":"MSME Vendor Category Declaration Form & Checklist","category":"Checklist / Template","fileName":"MSME_Vendor_Declaration_Template.docx","fileType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","fileSize":"340 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-08-18","notes":"Annual vendor confirmation format for Micro & Small Enterprise classification."},{"id":"doc-sop-1-3","matterId":"sop-1","title":"Corporate Net Banking Maker-Checker Authorization Matrix","category":"Agreement / Evidence","fileName":"Banking_Dual_Authorization_Matrix.pdf","fileType":"application/pdf","fileSize":"450 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-19"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'd976f5c0-8cde-4b8a-92e7-a1ef23fdac2c',
  'client-101',
  'sop',
  '{"id":"sop-2","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-TAX-002","sopCategory":"Statutory & Tax Compliance","title":"Monthly Statutory Tax Calendar, 3-Stage Proof Verification & Return Filing SOP","version":"v3.0","effectiveDate":"2026-04-01","nextReviewDate":"2026-11-15","reviewFrequency":"Quarterly","department":"Taxation & Compliance","owner":"Rajesh Kannan (Virtual CFO)","approver":"Audit Committee / Managing Director","status":"Active & Operational","riskLevel":"High","summary":"Defines the rigorous 30-day statutory cycle across Direct and Indirect taxation: monthly books freeze on 3rd, TDS Challan 281 remittance by 7th, GSTR-1 outward invoice lock by 11th, GSTR-2B ITC verification by 14th, GSTR-3B tax offset by 20th, and 3-stage validation (Preparation by Client Team -> Audit & Approval by Virtual CFO -> ARN / Proof Archival).","scope":"Covers all GSTIN registrations (Karnataka, Maharashtra, Delhi), corporate TDS TANs, and Advance Tax quarterly instalments.","applicableRegulations":["Central Goods and Services Tax Act 2017 & State GST Acts","Income Tax Act 1961 (Chapter XVII-B Withholding & Section 208-211 Advance Tax)"],"keySteps":[{"stepNumber":1,"title":"Monthly Books Cutoff & Tax Liability Freeze","responsibility":"Client Team Lead & Senior Accountant","timelineOrTAT":"By 3rd of each calendar month","description":"Close sales billing and purchase invoice entries for previous month. Run preliminary TDS ledger extract and GST liability dump.","controlCheckpoint":"No backdated invoices allowed without written CFO exception approval."},{"stepNumber":2,"title":"TDS Challan 281 Verification & Online Payment","responsibility":"Client Accountant (Maker) & Virtual CFO (Checker)","timelineOrTAT":"By 6th of month (statutory deadline: 7th)","description":"Cross-verify section-wise deduction (194C, 194J, 194I, 194Q) against vendor ledgers. Generate OLTAS challan on e-filing portal and execute net banking payment.","controlCheckpoint":"BSR code, challan serial number, and CIN verified and logged into portal."},{"stepNumber":3,"title":"GSTR-1 Outward Invoices Audit & Lock","responsibility":"Taxation Executive & Virtual CFO","timelineOrTAT":"By 10th of month (statutory deadline: 11th)","description":"Reconcile ERP sales register with e-invoicing portal and GST portal. Check B2B invoices, credit notes, and export invoices with shipping bills.","controlCheckpoint":"100% match between E-Way Bills, IRN generated, and GSTR-1 summary tables."},{"stepNumber":4,"title":"GSTR-2B Reconciliation & Electronic Credit Ledger Offset","responsibility":"Virtual CFO & Tax Team","timelineOrTAT":"14th to 18th of month","description":"Download auto-drafted GSTR-2B on 14th. Reconcile eligible vs ineligible ITC (Rule 38/42/43). Prepare tax payment offset matrix using available ITC and cash ledger balance.","controlCheckpoint":"Formal CFO tax clearance memo signed off before final OTP filing of GSTR-3B."},{"stepNumber":5,"title":"Return Filing & Statutory Proof Archival","responsibility":"Virtual CFO","timelineOrTAT":"By 20th of month (within 24 hours of filing)","description":"File return using Director DSC / EVC. Download filed PDF return and Acknowledgement Reference Number (ARN) receipt, and upload to Corporate Repository.","controlCheckpoint":"Repository sync check: Status turned green, proof linked, audit trail updated."}],"progressUpdates":[{"id":"prog-sop-2-1","date":"2026-09-01","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Quarterly review completed; added E-Way bill vs GSTR-1 automated reconciliation checkpoint."}],"documents":[{"id":"doc-sop-2-1","matterId":"sop-2","title":"Statutory Monthly Compliance Playbook v3.0","category":"SOP / Process Manual","fileName":"Statutory_Monthly_Playbook_v3.pdf","fileType":"application/pdf","fileSize":"2.1 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-01"},{"id":"doc-sop-2-2","matterId":"sop-2","title":"Monthly Tax Review Sign-Off & Verification Sheet","category":"Checklist / Template","fileName":"Monthly_Tax_Signoff_Template.xlsx","fileType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","fileSize":"410 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-01"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '95a8b28e-a9cd-4a10-986d-5d86cf8e3f62',
  'client-101',
  'sop',
  '{"id":"sop-3","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-PAY-003","sopCategory":"Payroll, PF & ESIC Management","title":"Monthly Payroll Execution, EPF ECR, ESIC Deposit & Form 24Q TDS Withholding SOP","version":"v1.5","effectiveDate":"2026-01-01","nextReviewDate":"2026-10-10","reviewFrequency":"Quarterly","department":"HR & Payroll","owner":"Head of People Operations & Accounts","approver":"Virtual CFO","status":"Active & Operational","riskLevel":"Medium","summary":"Standard operating procedure detailing attendance cutoff (25th of month), compensation structure audit, variable pay sign-off, dual-level net salary disbursement (1st of month), and statutory remittances (EPF 12% + 12% via Unified Portal by 15th, ESIC 0.75% + 3.25% by 15th, PT remittance by 20th).","scope":"All on-roll full-time employees, retainers, and apprentices across India offices.","applicableRegulations":["Employees'' Provident Funds and Miscellaneous Provisions Act 1952","Employees'' State Insurance Act 1948","Payment of Wages Act 1936 & Code on Wages","Income Tax Act 1961 (Section 192 Salary TDS)"],"keySteps":[{"stepNumber":1,"title":"Attendance & Leave Cutoff Freeze","responsibility":"HR Lead","timelineOrTAT":"25th of each month (24:00 hrs)","description":"Extract biometric attendance logs, leave approvals, loss of pay (LOP) days, and maternity/statutory leaves. Freeze HRMS for payroll processing.","controlCheckpoint":"Unapproved leaves automatically defaulted to LOP unless approved by HOD."},{"stepNumber":2,"title":"CTC Variance Analysis & New Joiner / Reliever Settlement","responsibility":"Payroll Specialist & Senior Accountant","timelineOrTAT":"26th to 28th of month","description":"Audit month-over-month salary delta. Check appointments, increments, full & final settlements (F&F), and gratuity/leave encashment calculations.","controlCheckpoint":"Detailed variance report signed off explaining any CTC change > 5%."},{"stepNumber":3,"title":"Salary Banking Batch Encryption & Disbursal","responsibility":"Virtual CFO & Managing Director","timelineOrTAT":"Last day of month or 1st of succeeding month","description":"Upload bank-encrypted salary payment file onto corporate banking portal. Dual OTP authorization for disbursement into employees'' registered salary accounts.","controlCheckpoint":"Pre-disbursal bank total reconciled to exact net pay in payroll register."},{"stepNumber":4,"title":"Electronic Challan cum Return (ECR) Generation & Deposit","responsibility":"Client Team & Virtual CFO","timelineOrTAT":"By 12th of month (statutory deadline: 15th)","description":"Generate ECR file with UAN-linked employee contributions (12% employee + 12% employer + EDLI/Admin charges). Upload to EPFO unified portal and remit funds via net banking.","controlCheckpoint":"ECR confirmation slip and TRRN payment receipt downloaded and archived."},{"stepNumber":5,"title":"ESIC Portal Contribution & Professional Tax (PT) Deposit","responsibility":"Payroll Specialist","timelineOrTAT":"By 14th of month (statutory deadline: 15th / 20th)","description":"Upload monthly contribution statement for covered employees on ESIC portal. Pay state-specific Professional Tax (Karnataka / Maharashtra) online.","controlCheckpoint":"Monthly ESIC challan and PT payment receipt uploaded to compliance folder."}],"progressUpdates":[{"id":"prog-sop-3-1","date":"2026-07-20","author":"Head of People Operations","authorRole":"client_team","status":"Active & Operational","notes":"Integrated automated new tax regime vs old tax regime TDS deduction calculator."}],"documents":[{"id":"doc-sop-3-1","matterId":"sop-3","title":"Payroll & Labor Statutory Remittance Manual v1.5","category":"SOP / Process Manual","fileName":"SOP_Payroll_Labor_Remittance.pdf","fileType":"application/pdf","fileSize":"1.6 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-07-20"},{"id":"doc-sop-3-2","matterId":"sop-3","title":"Payroll Pre-Disbursal Reconciliation Matrix","category":"Checklist / Template","fileName":"Payroll_Audit_Checklist.xlsx","fileType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","fileSize":"320 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-07-22"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '85e469e1-fe10-415e-84b3-75f98f4917b0',
  'client-101',
  'sop',
  '{"id":"sop-4","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-MIS-004","sopCategory":"Financial Reporting & MIS","title":"Fast-Close Books of Accounts, Management Accounts & CFO Executive Pack Reporting SOP","version":"v2.0","effectiveDate":"2026-04-01","nextReviewDate":"2026-12-15","reviewFrequency":"Annual","department":"Finance & Accounts","owner":"Rajesh Kannan (Virtual CFO)","approver":"Managing Director","status":"Active & Operational","riskLevel":"Medium","summary":"Governs the 10-day fast-close financial reporting process: revenue recognition per Ind AS 115, pre-paid expense amortization, fixed asset capitalization, 10%+ budget variance threshold reviews, SaaS metrics calculation (LTV, CAC, Runway), and distribution of the CFO Executive Report Pack.","scope":"All business divisions, corporate departments, and functional cost centers.","applicableRegulations":["Companies (Indian Accounting Standards) Rules 2015 (Ind AS 115, Ind AS 116)","Companies Act 2013 (Section 134 Financial Disclosures)"],"keySteps":[{"stepNumber":1,"title":"Revenue Ledger & Invoicing Reconciliation","responsibility":"Billing & Revenue Specialist","timelineOrTAT":"Day +1 to Day +3 of new month","description":"Reconcile customer subscription MRR, deferred revenue schedule, unbilled revenue, and GST invoice series with ERP revenue accounts.","controlCheckpoint":"Revenue cutoff confirmed; no revenue booked without customer signed SOW / contract."},{"stepNumber":2,"title":"Amortization, Accruals & Fixed Asset Registers","responsibility":"Senior Accountant","timelineOrTAT":"Day +4 to Day +6 of new month","description":"Compute monthly depreciation per Schedule II. Amortize prepaid insurance, software subscriptions, and calculate accruals for unbilled vendor services.","controlCheckpoint":"All balance sheet schedules reconciled to trial balance."},{"stepNumber":3,"title":"Budget vs Actual Variance Threshold Analysis","responsibility":"Virtual CFO & Financial Controller","timelineOrTAT":"Day +7 to Day +8 of new month","description":"Compare actual P&L lines against annual approved operating budget. Trigger mandatory written explanations for any line item exceeding 10% or ₹1,00,000 adverse variance.","controlCheckpoint":"Variance remarks documented with actionable corrective recommendations."},{"stepNumber":4,"title":"Virtual CFO Executive Insights Pack Preparation","responsibility":"Rajesh Kannan (Virtual CFO)","timelineOrTAT":"Day +9 to Day +10 of new month","description":"Synthesize EBITDA margin trends, cash burn rate, runway in months, working capital ratios, statutory compliance status, and strategic financial priorities.","controlCheckpoint":"Interactive CFO Executive Pack published in platform portal."},{"stepNumber":5,"title":"Board & Senior Leadership Presentation","responsibility":"Virtual CFO & Managing Director","timelineOrTAT":"Between 12th and 15th of each month","description":"Conduct monthly financial review meeting with executive committee. Review KPI targets, unit economics, capital allocation, and statutory risk mitigations.","controlCheckpoint":"Meeting action items logged with assigned owners and deadlines."}],"progressUpdates":[{"id":"prog-sop-4-1","date":"2026-08-10","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Aligned revenue recognition milestones strictly with Ind AS 115 multi-element arrangements."}],"documents":[{"id":"doc-sop-4-1","matterId":"sop-4","title":"Financial Fast-Close & Reporting Playbook v2.0","category":"SOP / Process Manual","fileName":"SOP_Financial_Fast_Close_MIS.pdf","fileType":"application/pdf","fileSize":"2.4 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-10"},{"id":"doc-sop-4-2","matterId":"sop-4","title":"CFO Executive Deck & Reporting Template","category":"Checklist / Template","fileName":"CFO_Executive_Report_Template.pptx","fileType":"application/vnd.openxmlformats-officedocument.presentationml.presentation","fileSize":"1.8 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-11"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '589c9b2d-cb2f-435d-b41b-a9fb94e69553',
  'client-101',
  'sop',
  '{"id":"sop-5","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-CTRL-005","sopCategory":"Internal Controls & Cash Management","title":"Petty Cash Imprest, Corporate Card Spends & Bank Reconciliation Statement (BRS) SOP","version":"v1.2","effectiveDate":"2026-03-01","nextReviewDate":"2026-11-30","reviewFrequency":"Annual","department":"Finance & Accounts","owner":"Head of Accounts","approver":"Virtual CFO","status":"Active & Operational","riskLevel":"Low","summary":"Defines the internal control framework for cash handling: maximum imprest ceiling of ₹25,000, mandatory GST invoice backing for expenses above ₹500, corporate credit card monthly reconciliation by 5th, and weekly dual-reviewed Bank Reconciliation Statements (BRS) across all current accounts.","scope":"All operating locations, administrative heads, and corporate cardholders.","applicableRegulations":["Companies Act 2013 (Section 134(5)(e) Internal Financial Controls)","Income Tax Act 1961 (Section 40A(3) Cash Payment Prohibition > ₹10,000)"],"keySteps":[{"stepNumber":1,"title":"Petty Cash Imprest Disbursement & Ceiling Enforcement","responsibility":"Petty Cash Custodian (Admin)","timelineOrTAT":"On-demand as balance drops below ₹5,000","description":"Maintain imprest float of ₹25,000 in fireproof lockbox. Strictly prohibit single cash payments exceeding ₹5,000. Require pre-approved petty cash voucher.","controlCheckpoint":"Zero cash expenditure without valid tax invoice or recipient sign-off; Sec 40A(3) compliance."},{"stepNumber":2,"title":"Corporate Credit Card Expense Submission","responsibility":"Cardholders (Executive Staff)","timelineOrTAT":"By 3rd of each month","description":"Upload GST invoices and business purpose explanation for all corporate card swipes via mobile expense app. Disallow personal charges.","controlCheckpoint":"Unsubstantiated swipes deducted from upcoming monthly salary."},{"stepNumber":3,"title":"Weekly Bank Reconciliation Statement (BRS)","responsibility":"Junior Accountant (Maker) & Accounts Head (Checker)","timelineOrTAT":"Every Friday by 18:00 hrs","description":"Reconcile daily bank feeds with ERP general ledger. Investigate uncredited deposits, unpresented cheques, direct debits, and bank charges.","controlCheckpoint":"No unreconciled bank item allowed to remain open for > 15 days."},{"stepNumber":4,"title":"Quarterly Physical Cash Surprise Audit","responsibility":"Virtual CFO","timelineOrTAT":"Quarterly unannounced inspection","description":"Physically count cash notes and coins in custody. Reconcile with petty cash register balance. Document count certificate.","controlCheckpoint":"Discrepancies reported immediately to Managing Director."}],"progressUpdates":[{"id":"prog-sop-5-1","date":"2026-06-15","author":"Head of Accounts","authorRole":"client_team","status":"Active & Operational","notes":"Lowered single cash transaction limit from ₹10,000 to ₹5,000 to minimize cash exposure."}],"documents":[{"id":"doc-sop-5-1","matterId":"sop-5","title":"Cash & Banking Internal Control Policy v1.2","category":"SOP / Process Manual","fileName":"SOP_Cash_Card_BRS_Controls.pdf","fileType":"application/pdf","fileSize":"980 KB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-06-15"},{"id":"doc-sop-5-2","matterId":"sop-5","title":"Weekly Bank Reconciliation Working Sheet","category":"Checklist / Template","fileName":"Weekly_BRS_Working_Template.xlsx","fileType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","fileSize":"280 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-06-16"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'fc419ed8-84d7-411a-aa47-4c16d444b7ca',
  'client-102',
  'sop',
  '{"id":"sop-6","companyId":"client-102","companyName":"Zephyr Cloud Technologies Pvt Ltd","type":"sop","sopCode":"SOP-ROC-006","sopCategory":"Secretarial & ROC Governance","title":"Board Meetings, Related Party Transactions (RPT) & ROC Compliance Workflow SOP","version":"v1.1","effectiveDate":"2026-02-15","nextReviewDate":"2026-10-30","reviewFrequency":"Bi-Annual","department":"Secretarial & Legal","owner":"Company Secretary & Compliance Counsel","approver":"Board of Directors","status":"Active & Operational","riskLevel":"High","summary":"Establishes institutional governance for corporate secretarial compliance: 7-day statutory notice for Board Meetings under Section 173, circulating draft minutes within 15 days, maintaining statutory registers (MBP-4, MGT-1), prior Audit Committee clearance for arm''s length Related Party Transactions (Section 188), and filing annual forms AOC-4, MGT-7, and DPT-3.","scope":"All holding, subsidiary, and joint-venture corporate entities.","applicableRegulations":["Companies Act 2013 (Section 173, 174, 188, 134, 137, 92)","ICSI Secretarial Standards (SS-1 for Board Meetings, SS-2 for General Meetings)"],"keySteps":[{"stepNumber":1,"title":"Board Meeting Statutory Notice & Agenda Dispatch","responsibility":"Company Secretary","timelineOrTAT":"At least 7 calendar days prior to meeting date","description":"Circulate formal notice, detailed agenda notes, and draft resolutions to all directors at registered email addresses.","controlCheckpoint":"Proof of electronic transmission archived; quorum requirements checked under Section 174."},{"stepNumber":2,"title":"Related Party Transaction Arm''s Length Benchmarking","responsibility":"Virtual CFO & Legal Counsel","timelineOrTAT":"Prior to execution of commercial contract","description":"Perform transfer pricing / third-party market benchmarking for any transaction with related parties. Obtain prior Audit Committee and Board approval.","controlCheckpoint":"Interested directors recused from voting; entries logged in Register of Contracts (Form MBP-4)."},{"stepNumber":3,"title":"Board Minutes Recording & Digital Signing","responsibility":"Company Secretary & Chairman","timelineOrTAT":"Draft within 15 days; signed within 30 days","description":"Draft minutes of proceedings, circulate for director comments, incorporate edits, and obtain Chairman''s digital signature in minutes book.","controlCheckpoint":"Strict adherence to Secretarial Standard-1 (SS-1); consecutive page numbering."},{"stepNumber":4,"title":"MCA-21 ROC e-Form Filing & Fee Payment","responsibility":"Practicing Company Secretary & Virtual CFO","timelineOrTAT":"Within statutory window (e.g. 30 days for MGT-14, AOC-4)","description":"Prepare ROC forms on MCA-21 V3 portal (AOC-4, MGT-7, DIR-12, DPT-3, PAS-3). Attach certified resolutions, balance sheet, and execute with Director DSC.","controlCheckpoint":"Service Request Number (SRN) and payment challan archived in corporate repository."}],"progressUpdates":[{"id":"prog-sop-6-1","date":"2026-08-01","author":"Company Secretary","authorRole":"client_team","status":"Active & Operational","notes":"Updated MCA-21 V3 portal filing guidelines and Director KYC digital signature validation."}],"documents":[{"id":"doc-sop-6-1","matterId":"sop-6","title":"Corporate Secretarial & ROC Governance SOP v1.1","category":"SOP / Process Manual","fileName":"SOP_Secretarial_ROC_Governance.pdf","fileType":"application/pdf","fileSize":"1.5 MB","uploadedBy":"Client Accounting Team","uploadedByRole":"client_team","uploadedAt":"2026-08-01"},{"id":"doc-sop-6-2","matterId":"sop-6","title":"RPT Arm''s Length Justification Checklist","category":"Checklist / Template","fileName":"RPT_Approval_Checklist.docx","fileType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","fileSize":"390 KB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-02"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '31167732-87c8-4318-a6c7-4e5f5e2dd62b',
  'client-101',
  'sop',
  '{"id":"sop-7","companyId":"client-101","companyName":"Nexora Innovations Private Limited","type":"sop","sopCode":"SOP-CAP-007","sopCategory":"Fixed Assets & Capex","title":"Capital Expenditure Approval, Asset Tagging & Depreciation Amortization SOP","version":"v1.0","effectiveDate":"2026-05-01","nextReviewDate":"2026-11-20","reviewFrequency":"Annual","department":"Finance & Accounts","owner":"Rajesh Kannan (Virtual CFO)","approver":"Board of Directors","status":"Active & Operational","riskLevel":"Medium","summary":"Capex proposal threshold authorizations (₹50k+ CFO approval, ₹5L+ Board approval), barcode asset tagging within 48h of installation, physical verification cadence, and straight-line depreciation per Schedule II of Companies Act 2013.","scope":"IT hardware, server infrastructure, lab testing equipment, leasehold improvements, and software licenses.","applicableRegulations":["Companies Act 2013 (Schedule II Depreciation)","Income Tax Act 1961 (Section 32 Block of Assets Depreciation)"],"keySteps":[{"stepNumber":1,"title":"Capital Expenditure Proposal & ROI Evaluation","responsibility":"Department Head & Virtual CFO","timelineOrTAT":"Prior to purchase order issuance","description":"Submit Capex Request Form with vendor quotes, technical specifications, and payback/ROI analysis. Secure approval: < ₹50k (HOD), ₹50k-₹5L (CFO), > ₹5L (MD/Board).","controlCheckpoint":"Budget allocation verified against approved Annual Capex Budget."},{"stepNumber":2,"title":"Asset Delivery, Barcode Tagging & Fixed Asset Register (FAR) Entry","responsibility":"IT Admin / Facilities & Accounts Executive","timelineOrTAT":"Within 48 hours of physical receipt","description":"Apply tamper-evident barcode label with unique Asset ID. Record serial number, make, model, custodian, and cost in Fixed Asset Register (FAR).","controlCheckpoint":"No invoice passed for payment without verified Asset ID tagged in ERP."},{"stepNumber":3,"title":"Monthly Depreciation Run & Dual Accounting Reconciliation","responsibility":"Senior Accountant","timelineOrTAT":"Monthly during books close (Day +5)","description":"Compute monthly depreciation using Useful Lives prescribed under Schedule II (Companies Act) and Section 32 block depreciation for tax computations.","controlCheckpoint":"FAR net block strictly reconciled to General Ledger fixed asset control accounts."},{"stepNumber":4,"title":"Annual Physical Asset Verification & Impairment Review","responsibility":"Internal Auditor & Virtual CFO","timelineOrTAT":"Annually in March before balance sheet audit","description":"Physically scan all tagged assets across all locations. Identify missing, damaged, or decommissioned assets. Write off or recognize impairment as needed.","controlCheckpoint":"Physical verification report signed by Statutory Auditors."}],"progressUpdates":[{"id":"prog-sop-7-1","date":"2026-05-10","author":"Rajesh Kannan (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Rolled out barcode scanner tagging for all server room & laptop assets."}],"documents":[{"id":"doc-sop-7-1","matterId":"sop-7","title":"Fixed Assets & Capex Governance Policy v1.0","category":"SOP / Process Manual","fileName":"SOP_Fixed_Assets_Governance.pdf","fileType":"application/pdf","fileSize":"1.1 MB","uploadedBy":"Rajesh Kannan (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-05-10"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  'e775d036-3194-4716-b4cb-640b77dd1853',
  'client-103',
  'sop',
  '{"id":"sop-8","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"sop","sopCode":"SOP-HLT-008","sopCategory":"Data Governance & Privacy","title":"Digital Health Records Security, HIPAA Privacy & DPDP Act Patient Consent SOP","version":"v2.1","effectiveDate":"2026-04-01","nextReviewDate":"2026-11-15","reviewFrequency":"Annual","department":"Data Security & Legal","owner":"Dr. Meera Krishnan (CMO) & Sudhakar (Virtual CFO)","approver":"Partner Committee","status":"Active & Operational","riskLevel":"High","summary":"Defines encryption standards (AES-256 in transit and at rest) for Indian diagnostic imaging files (DICOM/PACS), mandatory dual-factor biometric access for radiologists, immutable audit access logs, and explicit patient consent protocols under Digital Personal Data Protection Act 2023.","scope":"All tele-diagnostic software portals, hospital API connectors, and cloud database instances.","applicableRegulations":["Digital Personal Data Protection Act 2023 (DPDPA)","Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011","National Digital Health Mission (ABDM) Guidelines"],"keySteps":[{"stepNumber":1,"title":"Patient Tele-Consent & Data Anonymization","responsibility":"Hospital Front Desk & Telemedicine Intake Module","timelineOrTAT":"Real-time at time of patient scan intake","description":"Obtain bilingual digital OTP consent before routing CT/ECG scans to AI inference servers. Strip direct patient identifiers (Name, Aadhaar, Phone) into cryptographic pseudonyms.","controlCheckpoint":"Zero raw identifiable medical records stored in AI training pipelines."},{"stepNumber":2,"title":"Encrypted Cloud Pipeline & Access Control","responsibility":"Lead DevOps Architect","timelineOrTAT":"Continuous 24/7 enforcement","description":"Enforce TLS 1.3 protocol and role-based access for attending radiologists. Session timeout locked to 15 minutes of idle time.","controlCheckpoint":"Unauthorized access attempts trigger automatic SOC alerts."},{"stepNumber":3,"title":"Quarterly Data Privacy Compliance Audit","responsibility":"Virtual CFO & Data Protection Officer","timelineOrTAT":"Quarterly audit by 15th of month following quarter end","description":"Review consent logs, breach response preparedness, and third-party hospital vendor B2B data processing addendums (DPA).","controlCheckpoint":"Audit certificate signed and archived in Corporate Repository."}],"progressUpdates":[{"id":"prog-sop-8-1","date":"2026-08-14","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Aligned consent collection with DPDPA 2023 consent manager framework guidelines."}],"documents":[{"id":"doc-sop-8-1","matterId":"sop-8","title":"Digital Health Records Security SOP Manual v2.1","category":"SOP / Process Manual","fileName":"SOP_Health_Records_DPDPA_HIPAA.pdf","fileType":"application/pdf","fileSize":"1.7 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-08-15"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '82bb8819-ee5f-4b46-8684-38c70ef2a494',
  'client-103',
  'sop',
  '{"id":"sop-9","companyId":"client-103","companyName":"Zenith HealthTech Solutions LLP","type":"sop","sopCode":"SOP-LLP-009","sopCategory":"Secretarial & ROC Governance","title":"LLP Statutory Filings (Form 8 & Form 11) & Partner Capital Drawdowns SOP","version":"v1.2","effectiveDate":"2026-01-10","nextReviewDate":"2026-10-25","reviewFrequency":"Annual","department":"Finance & Accounts","owner":"Sudhakar (Virtual CFO)","approver":"Designated Partners","status":"Active & Operational","riskLevel":"Medium","summary":"Standard operating procedure for Limited Liability Partnership governance: preparation and dual-partner digital signing of Form 11 (Annual Return within 60 days of FY closure) and Form 8 (Statement of Account & Solvency within 30 days of half-year ended September 30), statutory ceiling for monthly partner drawings against approved profit budgets.","scope":"All designated partners, practicing company secretaries, and finance team members.","applicableRegulations":["Limited Liability Partnership Act 2008 (Section 34 & 35)","LLP Rules 2009 (Rule 24 Form 8 & Rule 25 Form 11)"],"keySteps":[{"stepNumber":1,"title":"Half-Yearly Books Close & Solvency Statement Draft","responsibility":"Finance Manager (Maker) & Virtual CFO (Checker)","timelineOrTAT":"By 10th October each year","description":"Reconcile half-yearly trial balance as on 30th September. Prepare statement of assets and liabilities and statement of income and expenditure in MCA V3 format.","controlCheckpoint":"Partner capital accounts strictly reconciled with bank drawdowns."},{"stepNumber":2,"title":"Designated Partner DSC Affixation & Form 8 Filing","responsibility":"Practicing Company Secretary & Virtual CFO","timelineOrTAT":"On or before 30th October statutory deadline","description":"Obtain digital signature certificates (DSC) of two designated partners. Upload Form 8 on MCA-21 V3 portal and download payment challan.","controlCheckpoint":"Service Request Number (SRN) generated without additional MCA late fees (₹100/day)."},{"stepNumber":3,"title":"Partner Drawing Disbursement Protocol","responsibility":"Virtual CFO","timelineOrTAT":"1st week of each calendar month","description":"Verify quarterly cash flow surplus before approving partner drawings. Ensure cumulative drawings do not exceed 70% of budgeted partner share of profit.","controlCheckpoint":"Zero drawings permitted if statutory tax reserve (GST/TDS) is unmet."}],"progressUpdates":[{"id":"prog-sop-9-1","date":"2026-09-10","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Form 8 preparation initiated for half-year ended 30-Sep-2026. Review scheduled for 15-Oct-2026."}],"documents":[{"id":"doc-sop-9-1","matterId":"sop-9","title":"LLP Governance & Partner Drawing SOP v1.2","category":"SOP / Process Manual","fileName":"SOP_LLP_Filings_Partner_Drawings.pdf","fileType":"application/pdf","fileSize":"1.2 MB","uploadedBy":"Sudhakar (Virtual CFO)","uploadedByRole":"cfo","uploadedAt":"2026-09-11"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.repository_matters (id, company_id, matter_type, data)
VALUES (
  '2097cc19-8c25-4038-be80-a5e8e8315c30',
  'client-102',
  'sop',
  '{"id":"sop-10","companyId":"client-102","companyName":"Apex Global Logistics India Pvt Ltd","type":"sop","sopCode":"SOP-LOG-010","sopCategory":"Logistics & Transport Operations","title":"Consignment Note (Lorry Receipt), E-way Bill Validation & Transshipment Audit SOP","version":"v2.0","effectiveDate":"2026-02-01","nextReviewDate":"2026-11-25","reviewFrequency":"Annual","department":"Fleet Operations & Dispatch","owner":"Vikram Singhania (Logistics Head)","approver":"Sudhakar (Virtual CFO)","status":"Active & Operational","riskLevel":"High","summary":"Mandatory dual-step dispatch procedure across all logistics hubs: auto-generation of electronic Lorry Receipt (e-LR) mapped to consignor GSTIN, real-time GST portal API validation of E-Way Bill Part A and Part B vehicle number matching, 8-hour pre-expiry automated alert trigger to operations desk for extension of validity, and transshipment endorsement logging.","scope":"All regional logistics booking hubs, fleet coordinators, and highway transit managers.","applicableRegulations":["Central Goods and Services Tax Act 2017 (Section 68 read with Rule 138)","Carriage by Road Act 2007 (Section 9 Consignment Note)"],"keySteps":[{"stepNumber":1,"title":"Cargo Inwarding & e-LR Generation","responsibility":"Hub Dispatch Officer","timelineOrTAT":"Prior to physical loading of vehicle","description":"Inspect goods package count, verify invoice value and GSTIN, issue standardized electronic Lorry Receipt (e-LR).","controlCheckpoint":"Zero truck dispatch without confirmed e-LR in ERP."},{"stepNumber":2,"title":"E-Way Bill Part B Vehicle Number Sync","responsibility":"Compliance Desk Specialist","timelineOrTAT":"At time of container seal and driver handoff","description":"Update truck registration number in E-Way bill Part-B via GST GSP API connector. Print tripartite copy for driver pouch.","controlCheckpoint":"QR code verified via handheld NIC scanner app before departure."},{"stepNumber":3,"title":"Transit Monitoring & Extension Protocol","responsibility":"24/7 Control Room Watcher","timelineOrTAT":"Triggered 8 hours prior to midnight expiry","description":"GPS geofence tracking. In event of vehicle accident or route detour, initiate official E-Way bill validity extension under Rule 138(10) with transshipment reason.","controlCheckpoint":"Zero highway interception penalties under Section 129."}],"progressUpdates":[{"id":"prog-sop-10-1","date":"2026-07-20","author":"Sudhakar (Virtual CFO)","authorRole":"cfo","status":"Active & Operational","notes":"Automated GPS alert integration completed. E-Way bill expiry incidents reduced to zero."}],"documents":[{"id":"doc-sop-10-1","matterId":"sop-10","title":"Fleet Consignment & E-Way Bill Operating Playbook v2.0","category":"SOP / Process Manual","fileName":"SOP_Logistics_EWayBill_Transit.pdf","fileType":"application/pdf","fileSize":"2.5 MB","uploadedBy":"Client Finance Team","uploadedByRole":"client_team","uploadedAt":"2026-07-21"}]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  matter_type = EXCLUDED.matter_type,
  data = EXCLUDED.data,
  updated_at = now();

-- =========================================================
-- DATA MIGRATION: 6. Budget Items (31 lines)
-- =========================================================
INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '647df64d-63ed-45da-93e1-2ed10c30da04',
  'client-101',
  '{"id":"b-rev-01","code":"REV-01","name":"Domestic Product Licenses & Enterprise Software","category":"sales","subCategory":"Product Sales","description":"Core software license fees invoiced to Indian corporate clients","monthly":{"apr":{"budget":2000000,"actual":2150000,"notes":"Q1 enterprise ramp-up"},"may":{"budget":2100000,"actual":2080000},"jun":{"budget":2200000,"actual":2320000,"notes":"Closing 2 major PSU contracts"},"jul":{"budget":2300000,"actual":2250000},"aug":{"budget":2400000,"actual":2480000},"sep":{"budget":2500000,"actual":2680000,"notes":"Early renewal bonus signed"},"oct":{"budget":2550000,"actual":0},"nov":{"budget":2600000,"actual":0},"dec":{"budget":2750000,"actual":0},"jan":{"budget":2800000,"actual":0},"feb":{"budget":2850000,"actual":0},"mar":{"budget":3100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'e922f2df-c666-40c2-86fe-dec3445acc9f',
  'client-101',
  '{"id":"b-rev-02","code":"REV-02","name":"Monthly Recurring SaaS Subscriptions (ARR)","category":"sales","subCategory":"SaaS Platform","description":"Multi-tenant cloud platform monthly active recurring billings","monthly":{"apr":{"budget":1400000,"actual":1420000},"may":{"budget":1450000,"actual":1460000},"jun":{"budget":1500000,"actual":1510000},"jul":{"budget":1550000,"actual":1580000},"aug":{"budget":1600000,"actual":1640000},"sep":{"budget":1650000,"actual":1780000,"notes":"Upsell to Tier-1 Fintech tier"},"oct":{"budget":1700000,"actual":0},"nov":{"budget":1750000,"actual":0},"dec":{"budget":1800000,"actual":0},"jan":{"budget":1850000,"actual":0},"feb":{"budget":1900000,"actual":0},"mar":{"budget":2000000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'a54bb0e9-ed75-45b9-bd56-fb48b404c639',
  'client-101',
  '{"id":"b-rev-03","code":"REV-03","name":"Implementation & Professional Services Retainers","category":"sales","subCategory":"Professional Services","description":"Milestone-based solution architecture, customization & data migrations","monthly":{"apr":{"budget":500000,"actual":480000},"may":{"budget":500000,"actual":520000},"jun":{"budget":550000,"actual":540000},"jul":{"budget":550000,"actual":490000},"aug":{"budget":600000,"actual":580000},"sep":{"budget":600000,"actual":510000,"notes":"Client milestone signoff pushed to Oct"},"oct":{"budget":600000,"actual":0},"nov":{"budget":650000,"actual":0},"dec":{"budget":650000,"actual":0},"jan":{"budget":700000,"actual":0},"feb":{"budget":700000,"actual":0},"mar":{"budget":750000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '5f1db3cb-6c73-4220-8ff3-f733561fe036',
  'client-101',
  '{"id":"b-rev-04","code":"REV-04","name":"Annual Maintenance Contracts (AMC) & SLA Support","category":"sales","subCategory":"Support Contracts","description":"Post-warranty operational SLA and 24/7 technical helpdesk","monthly":{"apr":{"budget":350000,"actual":350000},"may":{"budget":350000,"actual":360000},"jun":{"budget":360000,"actual":360000},"jul":{"budget":360000,"actual":375000},"aug":{"budget":370000,"actual":370000},"sep":{"budget":380000,"actual":395000},"oct":{"budget":380000,"actual":0},"nov":{"budget":390000,"actual":0},"dec":{"budget":390000,"actual":0},"jan":{"budget":400000,"actual":0},"feb":{"budget":400000,"actual":0},"mar":{"budget":420000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'b061ee88-7191-4e34-a880-cb15cfd55a76',
  'client-101',
  '{"id":"b-rev-05","code":"REV-05","name":"Overseas Export Software Billing (FIRC Backed)","category":"sales","subCategory":"Export Earnings","description":"Zero-rated LUT-backed services billed in USD to US/APAC entities","monthly":{"apr":{"budget":800000,"actual":760000},"may":{"budget":800000,"actual":820000},"jun":{"budget":850000,"actual":890000},"jul":{"budget":850000,"actual":810000},"aug":{"budget":900000,"actual":940000},"sep":{"budget":900000,"actual":830000,"notes":"Delayed US payment remittance"},"oct":{"budget":950000,"actual":0},"nov":{"budget":950000,"actual":0},"dec":{"budget":1000000,"actual":0},"jan":{"budget":1000000,"actual":0},"feb":{"budget":1050000,"actual":0},"mar":{"budget":1100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '74db607c-f4ff-4dff-a256-e0c0cb5ae7c3',
  'client-101',
  '{"id":"b-dc-01","code":"DC-01","name":"Cloud Computing, GPU & Server Hosting (AWS / GCP)","category":"direct_cost","subCategory":"Hosting & Compute","description":"Elastic cluster instances, database storage and LLM inference bandwidth","monthly":{"apr":{"budget":650000,"actual":640000},"may":{"budget":660000,"actual":675000},"jun":{"budget":680000,"actual":690000},"jul":{"budget":700000,"actual":710000},"aug":{"budget":720000,"actual":740000},"sep":{"budget":750000,"actual":845000,"notes":"Heavy GPU spike for AI OCR processing"},"oct":{"budget":760000,"actual":0},"nov":{"budget":780000,"actual":0},"dec":{"budget":800000,"actual":0},"jan":{"budget":820000,"actual":0},"feb":{"budget":840000,"actual":0},"mar":{"budget":880000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '182792ec-8819-44d5-8487-e08ed55fbd6d',
  'client-101',
  '{"id":"b-dc-02","code":"DC-02","name":"Third-Party API & SDK Licensing (Per-Transaction)","category":"direct_cost","subCategory":"API Expenses","description":"GST portal APIs, PAN verification, banking rails & SMS OTP gateway fees","monthly":{"apr":{"budget":180000,"actual":175000},"may":{"budget":185000,"actual":182000},"jun":{"budget":190000,"actual":195000},"jul":{"budget":195000,"actual":190000},"aug":{"budget":200000,"actual":205000},"sep":{"budget":210000,"actual":232000,"notes":"Increased invoice verification volumes"},"oct":{"budget":215000,"actual":0},"nov":{"budget":220000,"actual":0},"dec":{"budget":230000,"actual":0},"jan":{"budget":235000,"actual":0},"feb":{"budget":240000,"actual":0},"mar":{"budget":250000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '32519d9e-e44f-408d-a2c3-14f038e4f4ce',
  'client-101',
  '{"id":"b-dc-03","code":"DC-03","name":"Direct Technical Subcontracting & QA Contractors","category":"direct_cost","subCategory":"Contract Engineering","description":"External specialized security audit engineers and smart-contract auditors","monthly":{"apr":{"budget":350000,"actual":340000},"may":{"budget":350000,"actual":360000},"jun":{"budget":360000,"actual":375000},"jul":{"budget":370000,"actual":355000},"aug":{"budget":380000,"actual":370000},"sep":{"budget":400000,"actual":365000,"notes":"Contractor billed lower hours than budgeted"},"oct":{"budget":400000,"actual":0},"nov":{"budget":420000,"actual":0},"dec":{"budget":420000,"actual":0},"jan":{"budget":440000,"actual":0},"feb":{"budget":440000,"actual":0},"mar":{"budget":460000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'da39e2a7-8e2b-43c5-8bf1-a9ba5eedf45a',
  'client-101',
  '{"id":"b-dc-04","code":"DC-04","name":"Hardware Edge Gateway Consumables & Custom Chips","category":"direct_cost","subCategory":"Materials & Equipment","description":"IoT gateway boxes and edge RFID cards delivered to client sites","monthly":{"apr":{"budget":120000,"actual":118000},"may":{"budget":120000,"actual":122000},"jun":{"budget":130000,"actual":125000},"jul":{"budget":130000,"actual":135000},"aug":{"budget":140000,"actual":138000},"sep":{"budget":140000,"actual":129000,"notes":"Bulk discount negotiated on microcontrollers"},"oct":{"budget":145000,"actual":0},"nov":{"budget":150000,"actual":0},"dec":{"budget":150000,"actual":0},"jan":{"budget":160000,"actual":0},"feb":{"budget":160000,"actual":0},"mar":{"budget":170000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '20238066-8e7c-47e2-a331-c7f36824fafd',
  'client-101',
  '{"id":"b-dc-05","code":"DC-05","name":"Direct Project Deployment & Field Engineers Travel","category":"direct_cost","subCategory":"Direct Travel","description":"Onsite deployment visits to factory gates for hardware sensors setup","monthly":{"apr":{"budget":90000,"actual":88000},"may":{"budget":90000,"actual":95000},"jun":{"budget":95000,"actual":92000},"jul":{"budget":95000,"actual":98000},"aug":{"budget":100000,"actual":104000},"sep":{"budget":100000,"actual":112000,"notes":"Emergency field visit to Pune plant"},"oct":{"budget":105000,"actual":0},"nov":{"budget":110000,"actual":0},"dec":{"budget":115000,"actual":0},"jan":{"budget":120000,"actual":0},"feb":{"budget":120000,"actual":0},"mar":{"budget":130000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '8e11a24d-02d4-4547-8b87-b05f1a57d557',
  'client-101',
  '{"id":"b-ffe-01","code":"FFE-01","name":"Factory / Tech Park Production Floor Lease Rent","category":"fixed_factory","subCategory":"Plant Rent","description":"Long-term manufacturing / assembly bay leased premises in MIDC","monthly":{"apr":{"budget":320000,"actual":320000},"may":{"budget":320000,"actual":320000},"jun":{"budget":320000,"actual":320000},"jul":{"budget":320000,"actual":320000},"aug":{"budget":320000,"actual":320000},"sep":{"budget":320000,"actual":320000,"notes":"Fixed agreement under 11-month lease"},"oct":{"budget":320000,"actual":0},"nov":{"budget":320000,"actual":0},"dec":{"budget":320000,"actual":0},"jan":{"budget":320000,"actual":0},"feb":{"budget":320000,"actual":0},"mar":{"budget":320000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'c2007fdf-c043-42fd-a896-0297279b694f',
  'client-101',
  '{"id":"b-ffe-02","code":"FFE-02","name":"Plant & Machinery Preventive Maintenance (AMC)","category":"fixed_factory","subCategory":"Equipment Maintenance","description":"Automated test rigs, SMT pick-and-place and calibrated test sensors AMC","monthly":{"apr":{"budget":75000,"actual":72000},"may":{"budget":75000,"actual":78000},"jun":{"budget":80000,"actual":76000},"jul":{"budget":80000,"actual":82000},"aug":{"budget":85000,"actual":84000},"sep":{"budget":85000,"actual":104000,"notes":"Unscheduled laser calibration repair"},"oct":{"budget":85000,"actual":0},"nov":{"budget":90000,"actual":0},"dec":{"budget":90000,"actual":0},"jan":{"budget":95000,"actual":0},"feb":{"budget":95000,"actual":0},"mar":{"budget":100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '23e1d2ac-1979-4e59-9c0a-3477b4efcce9',
  'client-101',
  '{"id":"b-ffe-03","code":"FFE-03","name":"Factory Commercial Property & Industrial Fire Insurance","category":"fixed_factory","subCategory":"Industrial Insurance","description":"Plant asset protection, boiler & machinery breakdown cover","monthly":{"apr":{"budget":45000,"actual":45000},"may":{"budget":45000,"actual":45000},"jun":{"budget":45000,"actual":45000},"jul":{"budget":45000,"actual":45000},"aug":{"budget":45000,"actual":45000},"sep":{"budget":45000,"actual":45000},"oct":{"budget":45000,"actual":0},"nov":{"budget":45000,"actual":0},"dec":{"budget":45000,"actual":0},"jan":{"budget":45000,"actual":0},"feb":{"budget":45000,"actual":0},"mar":{"budget":45000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '3dbd6d7f-ad3e-414e-8754-797a44d23c0b',
  'client-101',
  '{"id":"b-ffe-04","code":"FFE-04","name":"Factory High-Tension Electricity & DG Power Generation","category":"fixed_factory","subCategory":"Factory Utilities","description":"Fixed demand charges + diesel genset fuel for uninterrupted production","monthly":{"apr":{"budget":140000,"actual":135000},"may":{"budget":145000,"actual":152000},"jun":{"budget":150000,"actual":148000},"jul":{"budget":150000,"actual":155000},"aug":{"budget":155000,"actual":158000},"sep":{"budget":160000,"actual":172000,"notes":"Grid tariff surcharge + extra night shift"},"oct":{"budget":160000,"actual":0},"nov":{"budget":165000,"actual":0},"dec":{"budget":165000,"actual":0},"jan":{"budget":170000,"actual":0},"feb":{"budget":170000,"actual":0},"mar":{"budget":180000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'f4d907ee-1eac-42ed-b4de-4c285f445859',
  'client-101',
  '{"id":"b-ffe-05","code":"FFE-05","name":"Industrial Security, CCTV Surveillance & Housekeeping","category":"fixed_factory","subCategory":"Security & Sanitation","description":"Round-the-clock armed security guard post & industrial waste sanitation","monthly":{"apr":{"budget":85000,"actual":85000},"may":{"budget":85000,"actual":85000},"jun":{"budget":85000,"actual":85000},"jul":{"budget":90000,"actual":88000},"aug":{"budget":90000,"actual":89000},"sep":{"budget":90000,"actual":91500},"oct":{"budget":90000,"actual":0},"nov":{"budget":95000,"actual":0},"dec":{"budget":95000,"actual":0},"jan":{"budget":95000,"actual":0},"feb":{"budget":95000,"actual":0},"mar":{"budget":100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '0478b816-ef17-4acc-b64e-c54f08e79da0',
  'client-101',
  '{"id":"b-ffe-06","code":"FFE-06","name":"Depreciation on Plant, Server Machinery & Heavy Assets","category":"fixed_factory","subCategory":"Factory Depreciation","description":"Straight line amortization under Schedule II Companies Act 2013","monthly":{"apr":{"budget":60000,"actual":60000},"may":{"budget":60000,"actual":60000},"jun":{"budget":60000,"actual":60000},"jul":{"budget":60000,"actual":60000},"aug":{"budget":60000,"actual":60000},"sep":{"budget":60000,"actual":60000},"oct":{"budget":60000,"actual":0},"nov":{"budget":60000,"actual":0},"dec":{"budget":60000,"actual":0},"jan":{"budget":60000,"actual":0},"feb":{"budget":60000,"actual":0},"mar":{"budget":60000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '907d928a-be93-47ff-a63f-b47386b1d5c7',
  'client-101',
  '{"id":"b-sal-01","code":"SAL-01","name":"Core Software Engineering & R&D Development Payroll","category":"salary_wages","subCategory":"Core Engineering","description":"Senior architects, full-stack engineers and DevOps staff CTC","monthly":{"apr":{"budget":1250000,"actual":1240000},"may":{"budget":1250000,"actual":1260000},"jun":{"budget":1300000,"actual":1290000},"jul":{"budget":1300000,"actual":1315000},"aug":{"budget":1350000,"actual":1340000},"sep":{"budget":1350000,"actual":1445000,"notes":"Hired 2 Senior AI Engineers ahead of schedule"},"oct":{"budget":1400000,"actual":0},"nov":{"budget":1400000,"actual":0},"dec":{"budget":1450000,"actual":0},"jan":{"budget":1450000,"actual":0},"feb":{"budget":1500000,"actual":0},"mar":{"budget":1550000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '86870599-b3b6-486a-9c52-d644c1a622a5',
  'client-101',
  '{"id":"b-sal-02","code":"SAL-02","name":"Product Management, UI/UX & Quality Assurance Payroll","category":"salary_wages","subCategory":"Product & QA","description":"Product owners, Figma designers and automation testers","monthly":{"apr":{"budget":420000,"actual":415000},"may":{"budget":420000,"actual":425000},"jun":{"budget":430000,"actual":428000},"jul":{"budget":430000,"actual":435000},"aug":{"budget":440000,"actual":438000},"sep":{"budget":450000,"actual":452000},"oct":{"budget":450000,"actual":0},"nov":{"budget":460000,"actual":0},"dec":{"budget":460000,"actual":0},"jan":{"budget":470000,"actual":0},"feb":{"budget":470000,"actual":0},"mar":{"budget":480000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '62e048dd-fd58-4ae4-bc46-f30f77cadf88',
  'client-101',
  '{"id":"b-sal-03","code":"SAL-03","name":"Sales, Marketing & Strategic Partnerships Team","category":"salary_wages","subCategory":"Sales & Growth","description":"Enterprise account directors, BDM salaries & SDR compensation","monthly":{"apr":{"budget":380000,"actual":375000},"may":{"budget":380000,"actual":390000},"jun":{"budget":390000,"actual":385000},"jul":{"budget":390000,"actual":395000},"aug":{"budget":400000,"actual":398000},"sep":{"budget":420000,"actual":385000,"notes":"Delayed hiring of Delhi enterprise rep"},"oct":{"budget":420000,"actual":0},"nov":{"budget":430000,"actual":0},"dec":{"budget":430000,"actual":0},"jan":{"budget":440000,"actual":0},"feb":{"budget":440000,"actual":0},"mar":{"budget":450000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '02e3ffbf-5c93-4938-95f3-8add09067c2b',
  'client-101',
  '{"id":"b-sal-04","code":"SAL-04","name":"Factory Assembly Technicians & Shift Floor Wages","category":"salary_wages","subCategory":"Direct Plant Wages","description":"Hardware testing technicians, PCB assemblers & shift overtime","monthly":{"apr":{"budget":240000,"actual":235000},"may":{"budget":240000,"actual":245000},"jun":{"budget":250000,"actual":248000},"jul":{"budget":250000,"actual":255000},"aug":{"budget":260000,"actual":262000},"sep":{"budget":260000,"actual":284000,"notes":"Night shift overtime to fulfill PSU batch"},"oct":{"budget":265000,"actual":0},"nov":{"budget":270000,"actual":0},"dec":{"budget":270000,"actual":0},"jan":{"budget":280000,"actual":0},"feb":{"budget":280000,"actual":0},"mar":{"budget":290000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'd034a413-d7ec-4a2a-a26a-3ccfd0a64b1c',
  'client-101',
  '{"id":"b-sal-05","code":"SAL-05","name":"Employer Statutory Social Security (EPF, ESIC, EDLI)","category":"salary_wages","subCategory":"Statutory Payroll Dues","description":"12% EPF match, ESIC 3.25%, and admin service inspection charges","monthly":{"apr":{"budget":165000,"actual":163000},"may":{"budget":165000,"actual":167000},"jun":{"budget":170000,"actual":169000},"jul":{"budget":170000,"actual":172000},"aug":{"budget":175000,"actual":174000},"sep":{"budget":180000,"actual":189000},"oct":{"budget":180000,"actual":0},"nov":{"budget":185000,"actual":0},"dec":{"budget":185000,"actual":0},"jan":{"budget":190000,"actual":0},"feb":{"budget":190000,"actual":0},"mar":{"budget":195000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '269bd5cf-1b31-4880-8627-a0b8d0018ef2',
  'client-101',
  '{"id":"b-sal-06","code":"SAL-06","name":"Staff Group Mediclaim, Term Insurance & Employee Welfare","category":"salary_wages","subCategory":"Health & Welfare","description":"Corporate group health cover policy premium and daily pantry subsidies","monthly":{"apr":{"budget":75000,"actual":74000},"may":{"budget":75000,"actual":76000},"jun":{"budget":75000,"actual":75000},"jul":{"budget":80000,"actual":79000},"aug":{"budget":80000,"actual":82000},"sep":{"budget":80000,"actual":76000,"notes":"Favorable claim loss ratio rebate received"},"oct":{"budget":85000,"actual":0},"nov":{"budget":85000,"actual":0},"dec":{"budget":85000,"actual":0},"jan":{"budget":90000,"actual":0},"feb":{"budget":90000,"actual":0},"mar":{"budget":90000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'b3bc301c-0377-45bd-aa2f-d95ae97738b3',
  'client-101',
  '{"id":"b-sal-07","code":"SAL-07","name":"Statutory Gratuity Actuarial Accruals & Performance Bonus","category":"salary_wages","subCategory":"Retirement Accruals","description":"Quarterly actuarial valuation reserve and Diwali performance provision","monthly":{"apr":{"budget":90000,"actual":90000},"may":{"budget":90000,"actual":90000},"jun":{"budget":90000,"actual":90000},"jul":{"budget":95000,"actual":95000},"aug":{"budget":95000,"actual":95000},"sep":{"budget":95000,"actual":95000},"oct":{"budget":150000,"actual":0},"nov":{"budget":100000,"actual":0},"dec":{"budget":100000,"actual":0},"jan":{"budget":100000,"actual":0},"feb":{"budget":100000,"actual":0},"mar":{"budget":100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '245bb5f8-e94c-444a-bdc7-5d8357bc052e',
  'client-101',
  '{"id":"b-adm-01","code":"ADM-01","name":"Corporate Head Office Rent & Common Maintenance (CAM)","category":"admin_cost","subCategory":"Office Rent","description":"Corporate headquarters commercial premise in BKC Mumbai","monthly":{"apr":{"budget":260000,"actual":260000},"may":{"budget":260000,"actual":260000},"jun":{"budget":260000,"actual":260000},"jul":{"budget":260000,"actual":260000},"aug":{"budget":260000,"actual":260000},"sep":{"budget":260000,"actual":260000},"oct":{"budget":260000,"actual":0},"nov":{"budget":260000,"actual":0},"dec":{"budget":260000,"actual":0},"jan":{"budget":260000,"actual":0},"feb":{"budget":260000,"actual":0},"mar":{"budget":260000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'f2167a71-9292-4c23-a75d-b5705be352af',
  'client-101',
  '{"id":"b-adm-02","code":"ADM-02","name":"Legal, Secretarial, Trademark & MCA Regulatory Fees","category":"admin_cost","subCategory":"Legal & Secretarial","description":"Company secretary retainers, ESOP trust drafting & filing fees","monthly":{"apr":{"budget":80000,"actual":75000},"may":{"budget":80000,"actual":82000},"jun":{"budget":85000,"actual":80000},"jul":{"budget":85000,"actual":88000},"aug":{"budget":90000,"actual":85000},"sep":{"budget":90000,"actual":115000,"notes":"Urgent trademark objection defense in High Court"},"oct":{"budget":90000,"actual":0},"nov":{"budget":95000,"actual":0},"dec":{"budget":95000,"actual":0},"jan":{"budget":95000,"actual":0},"feb":{"budget":100000,"actual":0},"mar":{"budget":100000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '323599e9-3e55-4f1b-806f-2f3a0399ae2a',
  'client-101',
  '{"id":"b-adm-03","code":"ADM-03","name":"Virtual CFO Practice Retainer & Statutory Audit Fees","category":"admin_cost","subCategory":"CFO & Audit","description":"Goyal & Associates Virtual CFO strategic advisory and concurrent audit","monthly":{"apr":{"budget":150000,"actual":150000},"may":{"budget":150000,"actual":150000},"jun":{"budget":150000,"actual":150000},"jul":{"budget":150000,"actual":150000},"aug":{"budget":150000,"actual":150000},"sep":{"budget":150000,"actual":150000},"oct":{"budget":150000,"actual":0},"nov":{"budget":150000,"actual":0},"dec":{"budget":150000,"actual":0},"jan":{"budget":150000,"actual":0},"feb":{"budget":150000,"actual":0},"mar":{"budget":150000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  'e5662cdc-07a3-4a02-ad87-41429d101b50',
  'client-101',
  '{"id":"b-adm-04","code":"ADM-04","name":"Internal Software SaaS, Microsoft 365, Slack & Security","category":"admin_cost","subCategory":"SaaS Subscriptions","description":"Enterprise email, Jira, GitHub Enterprise, Zoom and endpoint antivirus","monthly":{"apr":{"budget":110000,"actual":108000},"may":{"budget":110000,"actual":112000},"jun":{"budget":115000,"actual":114000},"jul":{"budget":115000,"actual":118000},"aug":{"budget":120000,"actual":122000},"sep":{"budget":125000,"actual":136000,"notes":"Added 20 seats on Slack & GitHub"},"oct":{"budget":125000,"actual":0},"nov":{"budget":130000,"actual":0},"dec":{"budget":130000,"actual":0},"jan":{"budget":130000,"actual":0},"feb":{"budget":135000,"actual":0},"mar":{"budget":140000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '7d15099e-3929-49cd-80f6-e907dec3c0dd',
  'client-101',
  '{"id":"b-adm-05","code":"ADM-05","name":"High-Speed Leased Line Internet, Telecom & Postal Courier","category":"admin_cost","subCategory":"Connectivity & Telecom","description":"1 Gbps dual-fiber redundant internet and staff SIM card plans","monthly":{"apr":{"budget":45000,"actual":44000},"may":{"budget":45000,"actual":46000},"jun":{"budget":45000,"actual":45000},"jul":{"budget":48000,"actual":47000},"aug":{"budget":48000,"actual":48000},"sep":{"budget":50000,"actual":46500,"notes":"Consolidated telecom vendor plan"},"oct":{"budget":50000,"actual":0},"nov":{"budget":50000,"actual":0},"dec":{"budget":52000,"actual":0},"jan":{"budget":52000,"actual":0},"feb":{"budget":55000,"actual":0},"mar":{"budget":55000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '312ad46a-571f-4ed6-afc6-7c7a5ad5fd0d',
  'client-101',
  '{"id":"b-adm-06","code":"ADM-06","name":"Bank Charges, Payment Gateway Fees & Forex Processing","category":"admin_cost","subCategory":"Banking & Forex","description":"Credit card merchant MDR, wire transfers, letter of credit handling charges","monthly":{"apr":{"budget":55000,"actual":52000},"may":{"budget":55000,"actual":58000},"jun":{"budget":58000,"actual":57000},"jul":{"budget":58000,"actual":61000},"aug":{"budget":60000,"actual":62000},"sep":{"budget":65000,"actual":73000,"notes":"Higher forex conversion volume on export collections"},"oct":{"budget":65000,"actual":0},"nov":{"budget":68000,"actual":0},"dec":{"budget":70000,"actual":0},"jan":{"budget":70000,"actual":0},"feb":{"budget":72000,"actual":0},"mar":{"budget":75000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '8c3e34fd-ef0c-4fdf-82ce-9f30685616d6',
  'client-101',
  '{"id":"b-adm-07","code":"ADM-07","name":"Executive Travel, Client Entertainment & Conferences","category":"admin_cost","subCategory":"Executive Travel","description":"CEO/CFO investor relations travel, industry expo attendance & client dinners","monthly":{"apr":{"budget":120000,"actual":115000},"may":{"budget":120000,"actual":128000},"jun":{"budget":130000,"actual":122000},"jul":{"budget":130000,"actual":136000},"aug":{"budget":140000,"actual":135000},"sep":{"budget":150000,"actual":128000,"notes":"Virtual attendee option used for Bengaluru summit"},"oct":{"budget":160000,"actual":0},"nov":{"budget":160000,"actual":0},"dec":{"budget":170000,"actual":0},"jan":{"budget":170000,"actual":0},"feb":{"budget":180000,"actual":0},"mar":{"budget":190000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.budget_items (id, company_id, data)
VALUES (
  '74df2acd-2cbd-4d83-bf8f-b949d6368e06',
  'client-101',
  '{"id":"b-adm-08","code":"ADM-08","name":"Office Stationery, Refreshments & Miscellaneous Contingency","category":"admin_cost","subCategory":"Office Admin","description":"Pantry tea/coffee supplies, printing, waste disposal & minor repairs","monthly":{"apr":{"budget":45000,"actual":43000},"may":{"budget":45000,"actual":46000},"jun":{"budget":48000,"actual":47000},"jul":{"budget":48000,"actual":50000},"aug":{"budget":50000,"actual":49000},"sep":{"budget":52000,"actual":51200},"oct":{"budget":52000,"actual":0},"nov":{"budget":55000,"actual":0},"dec":{"budget":55000,"actual":0},"jan":{"budget":58000,"actual":0},"feb":{"budget":58000,"actual":0},"mar":{"budget":60000,"actual":0}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

-- =========================================================
-- DATA MIGRATION: 7. Executive Reports
-- =========================================================
INSERT INTO public.executive_reports (id, company_id, month_key, status, data)
VALUES (
  '5d2b20ee-369d-4575-ab83-42b29ea2623b',
  'client-101',
  '2026-09',
  'published',
  '{"id":"rep-101-2026-09","companyId":"client-101","month":"September 2026","monthKey":"2026-09","title":"CFO Desk Executive Summary & Financial Observations — September 2026","summaryPoints":["Top-Line Revenue & Growth: Gross monthly revenue reached ₹58.40 Lakhs in September 2026 (+7.2% MoM growth), supported by enterprise SaaS renewals and strong USD-INR realization.","Operating Profitability: Operating EBITDA expanded to ₹14.07 Lakhs (24.1% EBITDA margin) with Net Profit (PAT) at ₹8.90 Lakhs, driven by cloud infrastructure optimization.","Treasury & Cash Runway: Liquid cash and bank reserves stand at ₹1.45 Crores against a net monthly burn of ₹17.60 Lakhs, ensuring 8.2 months of comfortable operational runway.","Working Capital & Receivables (DSO): Net working capital stands at ₹1.85 Crores with trade receivables DSO improving to 41 days; ₹4.60 Lakhs aged beyond 60 days is under active CFO collection follow-up.","Statutory Compliance & Section 43B(h) Alert: 91.4% of statutory filings are completed on schedule with 100% GSTR-2B ITC match; MSME vendor balances of ₹2.80 Lakhs require clearance before 28th September."],"executiveSummary":"1. Top-Line Revenue & Growth: Gross monthly revenue reached ₹58.40 Lakhs in September 2026 (+7.2% MoM growth), supported by enterprise SaaS renewals and strong USD-INR realization.\n2. Operating Profitability: Operating EBITDA expanded to ₹14.07 Lakhs (24.1% EBITDA margin) with Net Profit (PAT) at ₹8.90 Lakhs, driven by cloud infrastructure optimization.\n3. Treasury & Cash Runway: Liquid cash and bank reserves stand at ₹1.45 Crores against a net monthly burn of ₹17.60 Lakhs, ensuring 8.2 months of comfortable operational runway.\n4. Working Capital & Receivables (DSO): Net working capital stands at ₹1.85 Crores with trade receivables DSO improving to 41 days; ₹4.60 Lakhs aged beyond 60 days is under active CFO collection follow-up.\n5. Statutory Compliance & Section 43B(h) Alert: 91.4% of statutory filings are completed on schedule with 100% GSTR-2B ITC match; MSME vendor balances of ₹2.80 Lakhs require clearance before 28th September.","observations":[{"id":"obs-1","category":"Cash & Treasury","observation":"Liquid cash reserves of ₹1.45 Cr provide an 8.2-month runway. Debt-service coverage remains optimal with zero external long-term debt.","impact":"positive","recommendation":"Park surplus operating liquidity (₹35L) in overnight / liquid sweep mutual funds yielding 6.8% annualized.","source":"cfo_modified"},{"id":"obs-2","category":"Tax & Compliance","observation":"MSME vendor balances of ₹2.80L are approaching the statutory 45-day threshold under Section 43B(h) of the Income Tax Act.","impact":"critical","recommendation":"Ensure banking release of ₹2.80L prior to 28th September to prevent statutory disallowance in taxable profit computation.","source":"ai_generated"},{"id":"obs-3","category":"Revenue & Margin","observation":"Gross profit margin stabilized at 58.2% vs 55.0% annual budgeted target due to favorable USD-INR exchange realization on export contracts.","impact":"positive","recommendation":"Lock in forward forex hedges on upcoming Q3 recurring SaaS billings ($42,000 receivable in October).","source":"ai_generated"},{"id":"obs-4","category":"Cost & Budget","observation":"GPU cluster hosting expenses exceeded budget by 8.4% (₹2.45L vs ₹2.26L budget) following unexpected LLM training load during client POCs.","impact":"watch","recommendation":"Transition development workloads to reserved compute instances to recover the 8% cost variance in October.","source":"cfo_modified"},{"id":"obs-5","category":"Working Capital & Debtors","observation":"Debtor DSO stands at 41 days with ₹4.60L outstanding past 60 days across 3 enterprise accounts.","impact":"watch","recommendation":"Issue CFO balance confirmation and payment reminder notices to the 3 enterprise accounts before 25th September.","source":"ai_generated"}],"cfoDirectives":["Release Section 43B(h) MSME payments of ₹2.80L through automated NEFT batch by September 28th.","Authorize CFO sign-off on GSTR-3B draft return before the 20th September statutory deadline.","Initiate debtor collection drive for 3 enterprise accounts aging past 60 days (₹4.60L total outstanding)."],"financialHighlights":{"revenue":"₹58.40 Lakhs","ebitda":"₹14.07 Lakhs (24.1%)","cashRunway":"8.2 Months","complianceScore":"91.4% Filed"},"aiGeneratedAt":"2026-09-18T09:15:00.000Z","cfoSavedAt":"2026-09-18T10:30:00.000Z","status":"published","authorName":"Virtual CFO","authorRole":"Virtual CFO & Partner, Goyal & Associates","publishedAt":"2026-09-18T10:30:00.000Z","updatedAt":"2026-09-18T10:30:00.000Z"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  month_key = EXCLUDED.month_key,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.executive_reports (id, company_id, month_key, status, data)
VALUES (
  'eaf7a78b-b81e-4071-bd12-2413403fb500',
  'client-101',
  '2026-08',
  'published',
  '{"id":"rep-101-2026-08","companyId":"client-101","month":"August 2026","monthKey":"2026-08","title":"CFO Desk Executive Summary & Financial Observations — August 2026","summaryPoints":["Top-Line Revenue: August 2026 closed with gross revenue of ₹54.50 Lakhs (+6.5% MoM) and Net Profit (PAT) of ₹7.80 Lakhs.","Working Capital Cycle: Core receivable DSO shortened from 48 days to 41 days following accelerated collections from top domestic IT clients.","Statutory Filings: 100% of Q1 ROC, GST, and TDS statutory dues were filed on schedule with zero unmatched GSTR-2B input credits.","Cash Runway: Liquid reserves of ₹1.38 Crores maintained 7.9 months of operational runway."],"executiveSummary":"1. Top-Line Revenue: August 2026 closed with gross revenue of ₹54.50 Lakhs (+6.5% MoM) and Net Profit (PAT) of ₹7.80 Lakhs.\n2. Working Capital Cycle: Core receivable DSO shortened from 48 days to 41 days following accelerated collections from top domestic IT clients.\n3. Statutory Filings: 100% of Q1 ROC, GST, and TDS statutory dues were filed on schedule with zero unmatched GSTR-2B input credits.\n4. Cash Runway: Liquid reserves of ₹1.38 Crores maintained 7.9 months of operational runway.","observations":[{"id":"obs-101-aug-1","category":"Revenue & Margin","observation":"Revenue expanded 6.5% MoM driven by new enterprise annual licensing renewals.","impact":"positive","recommendation":"Continue up-selling multi-year contract renewals with upfront annual billing.","source":"ai_generated"},{"id":"obs-101-aug-2","category":"Tax & Compliance","observation":"100% matched GSTR-2B input tax credits utilized against August outward liabilities.","impact":"positive","recommendation":"Maintain the 10th of every month automated vendor ITC reconciliation protocol.","source":"ai_generated"},{"id":"obs-101-aug-3","category":"Working Capital & Debtors","observation":"Debtor DSO dropped to 41 days, outperforming the company benchmark of 45 days.","impact":"positive","recommendation":"Sustain structured 7-day payment reminder cadences for key accounts.","source":"cfo_modified"}],"cfoDirectives":["Reconcile advance tax instalment payment challan (Q2) with Form 26AS.","Finalize statutory audit draft schedules for FY 2025-26 board presentation."],"financialHighlights":{"revenue":"₹54.50 Lakhs","ebitda":"₹12.80 Lakhs (23.5%)","cashRunway":"7.9 Months","complianceScore":"100% Filed"},"aiGeneratedAt":"2026-08-20T10:00:00.000Z","cfoSavedAt":"2026-08-20T11:00:00.000Z","status":"published","authorName":"Virtual CFO","authorRole":"Virtual CFO & Partner, Goyal & Associates","publishedAt":"2026-08-20T11:00:00.000Z","updatedAt":"2026-08-20T11:00:00.000Z"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  month_key = EXCLUDED.month_key,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.executive_reports (id, company_id, month_key, status, data)
VALUES (
  '7b13a23e-781e-4ea3-8c5a-c7b801d996cc',
  'client-102',
  '2026-09',
  'published',
  '{"id":"rep-102-2026-09","companyId":"client-102","month":"September 2026","monthKey":"2026-09","title":"CFO Desk Executive Summary & Financial Observations — September 2026","summaryPoints":["Revenue & Freight Volumes: Apex Global Logistics generated ₹92.10 Lakhs in monthly freight revenue with operating EBITDA at ₹16.50 Lakhs (17.9% margin).","Working Capital & Bank Limits: Cash Credit (CC) limits utilized at 62% with ₹45 Lakhs unutilized headroom ahead of Q3 festive freight demand.","Receivables & DSO Watch: Trade receivables DSO stands at 51 days with ₹14.50 Lakhs aged beyond 90 days requiring escalated collection.","MSME & TDS Compliance: Transporter PAN verification under Sec 194C and ₹4.50 Lakhs MSME payables > 45 days require urgent clearance."],"executiveSummary":"1. Revenue & Freight Volumes: Apex Global Logistics generated ₹92.10 Lakhs in monthly freight revenue with operating EBITDA at ₹16.50 Lakhs (17.9% margin).\n2. Working Capital & Bank Limits: Cash Credit (CC) limits utilized at 62% with ₹45 Lakhs unutilized headroom ahead of Q3 festive freight demand.\n3. Receivables & DSO Watch: Trade receivables DSO stands at 51 days with ₹14.50 Lakhs aged beyond 90 days requiring escalated collection.\n4. MSME & TDS Compliance: Transporter PAN verification under Sec 194C and ₹4.50 Lakhs MSME payables > 45 days require urgent clearance.","observations":[{"id":"obs-102-1","category":"Cash & Treasury","observation":"Working capital overdraft headroom stands at ₹45 Lakhs with 6.9 months cash runway.","impact":"positive","recommendation":"Secure additional temporary festival line of ₹20L for Q3 peak freight demand.","source":"ai_generated"},{"id":"obs-102-2","category":"Tax & Compliance","observation":"Transporter payables of ₹4.50L are nearing the 45-day MSME Section 43B(h) limit; 3 fleet sub-contractor PANs require Sec 194C validation.","impact":"critical","recommendation":"Clear ₹4.50L MSME dues and validate sub-contractor PANs before filing 26Q.","source":"cfo_modified"},{"id":"obs-102-3","category":"Working Capital & Debtors","observation":"DSO stands at 51 days with ₹14.5L tied up in container freight debtors over 90 days.","impact":"watch","recommendation":"Submit monthly debtor ageing certificate and initiate recovery notices for >90d accounts.","source":"ai_generated"}],"cfoDirectives":["Complete fleet commercial insurance renewals before 30th September.","Submit monthly Stock & Book Debts Drawing Power statement to Axis Bank SME desk by 20th September.","Clear ₹4.50L overdue MSME transporter bills to protect Section 43B(h) deduction."],"financialHighlights":{"revenue":"₹92.10 Lakhs","ebitda":"₹16.50 Lakhs (17.9%)","cashRunway":"6.9 Months","complianceScore":"88.9% Filed"},"aiGeneratedAt":"2026-09-17T08:30:00.000Z","cfoSavedAt":"2026-09-17T09:00:00.000Z","status":"published","authorName":"Virtual CFO","authorRole":"Virtual CFO & Partner, Goyal & Associates","publishedAt":"2026-09-17T09:00:00.000Z","updatedAt":"2026-09-17T09:00:00.000Z"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  month_key = EXCLUDED.month_key,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

INSERT INTO public.executive_reports (id, company_id, month_key, status, data)
VALUES (
  'e8e7a837-1e84-4d12-b21b-469e1b62d2dc',
  'client-103',
  '2026-09',
  'published',
  '{"id":"rep-103-2026-09","companyId":"client-103","month":"September 2026","monthKey":"2026-09","title":"CFO Desk Executive Summary & Financial Observations — September 2026","summaryPoints":["Revenue & Diagnostics Margin: Zenith HealthTech achieved ₹38.50 Lakhs monthly revenue (+9.4% MoM) with a strong 26.8% EBITDA margin.","Cash Runway & Liquidity: Liquid cash reserves of ₹95.00 Lakhs provide 8.2 months of comfortable runway at ₹11.60 Lakhs monthly burn.","Clean Receivables Cycle: Hospital & B2B lab collections are operating at a 31-day DSO with zero receivables overdue beyond 90 days.","Statutory & LLP Governance: 94.3% compliances filed on time; LLP Form 8 Statement of Account & Solvency is scheduled for dual sign-off before 28th September."],"executiveSummary":"1. Revenue & Diagnostics Margin: Zenith HealthTech achieved ₹38.50 Lakhs monthly revenue (+9.4% MoM) with a strong 26.8% EBITDA margin.\n2. Cash Runway & Liquidity: Liquid cash reserves of ₹95.00 Lakhs provide 8.2 months of comfortable runway at ₹11.60 Lakhs monthly burn.\n3. Clean Receivables Cycle: Hospital & B2B lab collections are operating at a 31-day DSO with zero receivables overdue beyond 90 days.\n4. Statutory & LLP Governance: 94.3% compliances filed on time; LLP Form 8 Statement of Account & Solvency is scheduled for dual sign-off before 28th September.","observations":[{"id":"obs-103-1","category":"Revenue & Margin","observation":"Diagnostic reagent procurement optimization improved gross margin by 180 bps to 64.5%.","impact":"positive","recommendation":"Lock in annual rate contracts with top 3 reagent suppliers for Q3-Q4.","source":"ai_generated"},{"id":"obs-103-2","category":"Tax & Compliance","observation":"LLP Form 8 Statement of Account & Solvency draft is ready for designated partner and CFO sign-off.","impact":"watch","recommendation":"Complete DSC verification and file Form 8 prior to 28th September.","source":"cfo_modified"}],"cfoDirectives":["Complete dual signature on LLP Form 8 Statement of Account & Solvency by 28th September.","Compile R&D patent documentation for Section 35(2AB) tax deduction schedule."],"financialHighlights":{"revenue":"₹38.50 Lakhs","ebitda":"₹10.32 Lakhs (26.8%)","cashRunway":"8.2 Months","complianceScore":"94.3% Filed"},"aiGeneratedAt":"2026-09-18T08:00:00.000Z","cfoSavedAt":"2026-09-18T09:10:00.000Z","status":"published","authorName":"Virtual CFO","authorRole":"Virtual CFO & Partner, Goyal & Associates","publishedAt":"2026-09-18T09:10:00.000Z","updatedAt":"2026-09-18T09:10:00.000Z"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  month_key = EXCLUDED.month_key,
  status = EXCLUDED.status,
  data = EXCLUDED.data,
  updated_at = now();

-- =========================================================
-- DATA MIGRATION: 8. Financial MIS Records & Statements
-- =========================================================
INSERT INTO public.mis_uploads (id, company_id, statement_type, period, file_name, row_count, rows, status, uploaded_by)
VALUES (
  '7a0ec563-ae3d-44c3-b38e-f6101e578986',
  'client-101',
  'pnl',
  'August 2026 (Month-End MIS)',
  'Tally_PnL_Consolidated_Aug2026.xlsx',
  18,
  '{"period":"August 2026 (Month-End MIS)","monthlyRevenue":4850000,"revenueGrowthMoM":12.4,"grossMarginPercent":68.2,"ebitda":1140000,"ebitdaMarginPercent":23.5,"netProfit":865000,"cashAndBankBalance":14250000,"monthlyBurnRate":1850000,"cashRunwayMonths":7.7,"totalDebtors":6240000,"debtorsOver90Days":980000,"debtorDaysDSO":44,"totalCreditors":3410000,"creditorsOver45Days":280000,"workingCapital":10840000,"quickRatio":2.45,"cfoExecutiveSummary":"Operating margins improved by 210 bps this month driven by lower cloud infrastructure unit costs. Advance tax 2nd installment of ₹24 Lakhs was successfully discharged on 15th Sep. Priority action is recovering ₹9.8L overdue receivables from Enterprise Tier clients and clearing 2 MSME vendor bills to prevent Section 43B(h) tax disallowances.","cfoKeyAlerts":["MSME 45-day threshold: 2 vendor balances totaling ₹2.80L are due in 4 days.","GSTR-3B tax payment of ₹3.84L due on 20th Sep is pre-approved and queued.","Form 3CD Tax Audit schedules final review scheduled with CA Singhal & Co on 20th Sep."],"balanceSheet":{"asOfDate":"31 August 2026","previousDate":"31 March 2026","equityAndLiabilities":{"shareCapital":25000000,"reservesAndSurplus":34850000,"totalShareholdersFunds":59850000,"longTermBorrowings":12000000,"deferredTaxLiabilities":1850000,"otherLongTermLiabilities":1200000,"totalNonCurrentLiabilities":15050000,"shortTermBorrowings":4500000,"tradePayables":3130000,"tradePayablesMsme":280000,"otherCurrentLiabilities":2450000,"shortTermProvisions":1850000,"totalCurrentLiabilities":12210000,"totalEquityAndLiabilities":87110000},"assets":{"propertyPlantEquipment":24500000,"accumulatedDepreciation":5200000,"netPpe":19300000,"capitalWorkInProgress":2100000,"intangibleAssets":8500000,"nonCurrentInvestments":5000000,"longTermLoansAndAdvances":1650000,"totalNonCurrentAssets":36550000,"inventories":1460000,"tradeReceivables":6240000,"allowanceForDoubtfulDebts":260000,"netTradeReceivables":5980000,"cashAndCashEquivalents":14250000,"bankBalancesOther":2200000,"shortTermLoansAndAdvances":1870000,"otherCurrentAssets":2480000,"totalCurrentAssets":50560000,"totalAssets":87110000},"previousYearComparison":{"totalEquityAndLiabilities":79200000,"totalAssets":79200000,"workingCapital":31200000,"netWorth":51200000}},"pnlStatement":{"period":"September 2026","comparisonPeriod":"August 2026","financialYear":"FY 2026-27 (Apr 2026 – Sep 2026)","monthsList":["April 2026","May 2026","June 2026","July 2026","August 2026","September 2026"],"completedMonths":["April 2026","May 2026","June 2026","July 2026","August 2026"],"currentMonthKey":"September 2026","income":{"revenueFromOperations":5240000,"otherIncome":145000,"totalIncome":5385000},"expenses":{"costOfMaterialsOrDirectCosts":1610000,"employeeBenefitsExpense":1275000,"cloudAndInfrastructureCosts":350000,"salesAndMarketingCosts":340000,"otherExpenses":245000,"financeCosts":92000,"depreciationAndAmortization":125000,"totalExpenses":4037000},"profitability":{"grossProfit":3630000,"grossMarginPercent":69.3,"ebitda":1420000,"ebitdaMarginPercent":27.1,"pbt":1348000,"pbtMarginPercent":25.7,"currentTax":242000,"deferredTax":0,"pat":1106000,"patMarginPercent":21.1},"lineItems":[{"id":"rev-ops","particulars":"Revenue from Operations (SaaS Subscriptions & Enterprise Licences)","noteRef":"Note 21","currentMonth":5240000,"previousMonth":4850000,"ytdCurrentYear":27255000,"momGrowthPct":8,"pctOfRevenue":100,"isSubtotal":false,"monthlyBreakdown":{"April 2026":4120000,"May 2026":4280000,"June 2026":4450000,"July 2026":4315000,"August 2026":4850000,"September 2026":5240000},"varianceVsPrevious":390000,"varianceVsPreviousPct":8,"varianceVsBase":1120000,"varianceVsBasePct":27.2,"monthlyAverage":4542500,"varianceRemarks":"Strong enterprise expansion and ACV uplift; +8.0% MoM and +27.2% vs April kickoff"},{"id":"other-inc","particulars":"Other Income (Sweep FD Interest, Treasury Yield & Forex Gain)","noteRef":"Note 22","currentMonth":145000,"previousMonth":135000,"ytdCurrentYear":722000,"momGrowthPct":7.4,"pctOfRevenue":2.8,"isSubtotal":false,"monthlyBreakdown":{"April 2026":95000,"May 2026":110000,"June 2026":125000,"July 2026":112000,"August 2026":135000,"September 2026":145000},"varianceVsPrevious":10000,"varianceVsPreviousPct":7.4,"varianceVsBase":50000,"varianceVsBasePct":52.6,"monthlyAverage":120333,"varianceRemarks":"Auto-sweep FD interest and treasury returns from higher liquid surplus"},{"id":"tot-inc","particulars":"I. Total Income (Revenue + Other Income)","currentMonth":5385000,"previousMonth":4985000,"ytdCurrentYear":27977000,"momGrowthPct":8,"pctOfRevenue":102.8,"isTotal":true,"monthlyBreakdown":{"April 2026":4215000,"May 2026":4390000,"June 2026":4575000,"July 2026":4427000,"August 2026":4985000,"September 2026":5385000},"varianceVsPrevious":400000,"varianceVsPreviousPct":8,"varianceVsBase":1170000,"varianceVsBasePct":27.8,"monthlyAverage":4662833},{"id":"exp-cogs","particulars":"Direct Operational Costs & Third-Party API Gateway Charges","noteRef":"Note 23","currentMonth":1610000,"previousMonth":1542300,"ytdCurrentYear":8722300,"momGrowthPct":4.4,"pctOfRevenue":30.7,"monthlyBreakdown":{"April 2026":1350000,"May 2026":1380000,"June 2026":1430000,"July 2026":1410000,"August 2026":1542300,"September 2026":1610000},"varianceVsPrevious":67700,"varianceVsPreviousPct":4.4,"varianceVsBase":260000,"varianceVsBasePct":19.3,"monthlyAverage":1453717,"varianceRemarks":"Direct infra scaled with active user volume; gross margin sustained above 69%"},{"id":"exp-emp","particulars":"Employee Benefit Expenses (Engineering, Finance & Operations Payroll)","noteRef":"Note 24","currentMonth":1275000,"previousMonth":1240000,"ytdCurrentYear":7115000,"momGrowthPct":2.8,"pctOfRevenue":24.3,"monthlyBreakdown":{"April 2026":1120000,"May 2026":1140000,"June 2026":1160000,"July 2026":1180000,"August 2026":1240000,"September 2026":1275000},"varianceVsPrevious":35000,"varianceVsPreviousPct":2.8,"varianceVsBase":155000,"varianceVsBasePct":13.8,"monthlyAverage":1185833,"varianceRemarks":"Increment for 2 senior engineering hires and quarterly PF/ESI re-benchmarking"},{"id":"exp-cloud","particulars":"Cloud Computing, AI Model Inference & Hosting Infrastructure","noteRef":"Note 25","currentMonth":350000,"previousMonth":365000,"ytdCurrentYear":2295000,"momGrowthPct":-4.1,"pctOfRevenue":6.7,"monthlyBreakdown":{"April 2026":410000,"May 2026":395000,"June 2026":385000,"July 2026":390000,"August 2026":365000,"September 2026":350000},"varianceVsPrevious":-15000,"varianceVsPreviousPct":-4.1,"varianceVsBase":-60000,"varianceVsBasePct":-14.6,"monthlyAverage":382500,"varianceRemarks":"Favorable variance: 3-year compute savings plan locked on AWS reducing unit egress cost"},{"id":"exp-mktg","particulars":"Sales Promotion, Digital Marketing & Enterprise Conferences","noteRef":"Note 26","currentMonth":340000,"previousMonth":322000,"ytdCurrentYear":1807000,"momGrowthPct":5.6,"pctOfRevenue":6.5,"monthlyBreakdown":{"April 2026":260000,"May 2026":280000,"June 2026":310000,"July 2026":295000,"August 2026":322000,"September 2026":340000},"varianceVsPrevious":18000,"varianceVsPreviousPct":5.6,"varianceVsBase":80000,"varianceVsBasePct":30.8,"monthlyAverage":301167,"varianceRemarks":"Q2 end pipeline push for enterprise client conversion"},{"id":"exp-admin","particulars":"Administrative, Rent, Legal & Virtual CFO Compliance Retainership","noteRef":"Note 27","currentMonth":245000,"previousMonth":240700,"ytdCurrentYear":1405700,"momGrowthPct":1.8,"pctOfRevenue":4.7,"monthlyBreakdown":{"April 2026":225000,"May 2026":228000,"June 2026":235000,"July 2026":232000,"August 2026":240700,"September 2026":245000},"varianceVsPrevious":4300,"varianceVsPreviousPct":1.8,"varianceVsBase":20000,"varianceVsBasePct":8.9,"monthlyAverage":234283,"varianceRemarks":"Includes Virtual CFO retainership, ROC secretarial audits, statutory licenses"},{"id":"ebitda-sub","particulars":"II. Operating EBITDA (Operational Profitability)","currentMonth":1420000,"previousMonth":1140000,"ytdCurrentYear":6352000,"momGrowthPct":24.6,"pctOfRevenue":27.1,"isSubtotal":true,"monthlyBreakdown":{"April 2026":850000,"May 2026":967000,"June 2026":1055000,"July 2026":920000,"August 2026":1140000,"September 2026":1420000},"varianceVsPrevious":280000,"varianceVsPreviousPct":24.6,"varianceVsBase":570000,"varianceVsBasePct":67.1,"monthlyAverage":1058667,"varianceRemarks":"Operating leverage kicking in as top-line rose 8% while opex grew only 2.3%"},{"id":"exp-depr","particulars":"Depreciation & Amortization Expense (PPE & Intangibles)","noteRef":"Note 11","currentMonth":125000,"previousMonth":125000,"ytdCurrentYear":735000,"momGrowthPct":0,"pctOfRevenue":2.4,"monthlyBreakdown":{"April 2026":120000,"May 2026":122000,"June 2026":123000,"July 2026":120000,"August 2026":125000,"September 2026":125000},"varianceVsPrevious":0,"varianceVsPreviousPct":0,"varianceVsBase":5000,"varianceVsBasePct":4.2,"monthlyAverage":122500},{"id":"exp-fin","particulars":"Finance Costs (Bank Loan Interest & Processing Charges)","noteRef":"Note 28","currentMonth":92000,"previousMonth":95000,"ytdCurrentYear":587000,"momGrowthPct":-3.2,"pctOfRevenue":1.8,"monthlyBreakdown":{"April 2026":105000,"May 2026":102000,"June 2026":100000,"July 2026":98000,"August 2026":95000,"September 2026":92000},"varianceVsPrevious":-3000,"varianceVsPreviousPct":-3.2,"varianceVsBase":-13000,"varianceVsBasePct":-12.4,"monthlyAverage":97833,"varianceRemarks":"Principal amortization of term loan lowering interest burden month over month"},{"id":"pbt-total","particulars":"III. Profit Before Tax (PBT)","currentMonth":1348000,"previousMonth":1055000,"ytdCurrentYear":5747000,"momGrowthPct":27.8,"pctOfRevenue":25.7,"isSubtotal":true,"monthlyBreakdown":{"April 2026":720000,"May 2026":853000,"June 2026":957000,"July 2026":814000,"August 2026":1055000,"September 2026":1348000},"varianceVsPrevious":293000,"varianceVsPreviousPct":27.8,"varianceVsBase":628000,"varianceVsBasePct":87.2,"monthlyAverage":957833},{"id":"tax-exp","particulars":"Current Tax Expense (Corporate Advance Tax Provision)","noteRef":"Note 29","currentMonth":242000,"previousMonth":190000,"ytdCurrentYear":1040000,"momGrowthPct":27.4,"pctOfRevenue":4.6,"monthlyBreakdown":{"April 2026":135000,"May 2026":155000,"June 2026":172000,"July 2026":146000,"August 2026":190000,"September 2026":242000},"varianceVsPrevious":52000,"varianceVsPreviousPct":27.4,"varianceVsBase":107000,"varianceVsBasePct":79.3,"monthlyAverage":173333,"varianceRemarks":"Quarterly advance tax provision matched to Sec 115BAA corporate tax requirements"},{"id":"pat-final","particulars":"IV. Profit After Tax - PAT (Net Margin Bottom-Line)","currentMonth":1106000,"previousMonth":865000,"ytdCurrentYear":4707000,"momGrowthPct":27.9,"pctOfRevenue":21.1,"isTotal":true,"monthlyBreakdown":{"April 2026":585000,"May 2026":698000,"June 2026":785000,"July 2026":668000,"August 2026":865000,"September 2026":1106000},"varianceVsPrevious":241000,"varianceVsPreviousPct":27.9,"varianceVsBase":521000,"varianceVsBasePct":89.1,"monthlyAverage":784500,"varianceRemarks":"Net profit crossed ₹11 Lakhs milestone; net margin of 21.1% vs 14.2% in April"}]},"debtorAgeing":{"asOfDate":"31 August 2026","totalReceivables":6240000,"daysSalesOutstanding":44,"overduePercentage":27.2,"provisionForBadDebts":260000,"buckets":{"days0to30":{"amount":3450000,"percentage":55.3,"count":28},"days31to60":{"amount":1510000,"percentage":24.2,"count":12},"days61to90":{"amount":300000,"percentage":4.8,"count":3},"days91to180":{"amount":680000,"percentage":10.9,"count":4},"daysAbove180":{"amount":300000,"percentage":4.8,"count":1}},"topDebtors":[{"id":"deb-1","customerName":"Tata Consultancy Services Ltd (BFS Tech Div)","entityType":"Enterprise Client","gstin":"27AAACT2727Q1ZW","creditPeriodDays":45,"totalOutstanding":1450000,"bucket0to30":1200000,"bucket31to60":250000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-22","lastPaymentAmount":850000,"dsoDays":32,"riskRating":"Low","status":"Current","followUpNotes":"Invoice verified by TCS procurement. Milestones cleared, batch payout scheduled for 24th Sep.","assignedManager":"Sneha Roy"},{"id":"deb-2","customerName":"Mindcrest Healthcare Analytics Corp","entityType":"Mid-Market Client","gstin":"07AABCM8821F1ZX","creditPeriodDays":30,"totalOutstanding":880000,"bucket0to30":450000,"bucket31to60":430000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-10","lastPaymentAmount":420000,"dsoDays":42,"riskRating":"Low","status":"Audit Confirmation Reconciled","followUpNotes":"External balance confirmation signed and confirmed via email on 14th Sep.","assignedManager":"Pooja Sharma"},{"id":"deb-3","customerName":"Kalyan Logistics & Port Services Pvt Ltd","entityType":"Enterprise Client","gstin":"24AAACK1920B1Z7","creditPeriodDays":30,"totalOutstanding":740000,"bucket0to30":200000,"bucket31to60":240000,"bucket61to90":300000,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-07-18","lastPaymentAmount":310000,"dsoDays":68,"riskRating":"Medium","status":"Promise to Pay","followUpNotes":"CFO spoke with finance head Mr. Rawat. Payment of ₹3.0L promised by 22nd Sep.","assignedManager":"CA Manish Goyal"},{"id":"deb-4","customerName":"Verve Dynamic Media Networks LLP","entityType":"Agency Partner","gstin":"27AAAFV6629M1ZS","creditPeriodDays":30,"totalOutstanding":680000,"bucket0to30":0,"bucket31to60":180000,"bucket61to90":0,"bucket91to180":500000,"bucketAbove180":0,"lastPaymentDate":"2026-05-30","lastPaymentAmount":150000,"dsoDays":115,"riskRating":"High","status":"Escalated to CFO","followUpNotes":"Billing dispute regarding AWS third-party pass-through mark-up. Formal reconciliation meet on 21st Sep.","assignedManager":"CA Manish Goyal"},{"id":"deb-5","customerName":"Skyward Retail Technologies India Ltd","entityType":"Enterprise Client","gstin":"29AABCS8810K1ZT","creditPeriodDays":45,"totalOutstanding":550000,"bucket0to30":550000,"bucket31to60":0,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-28","lastPaymentAmount":500000,"dsoDays":28,"riskRating":"Low","status":"Current","followUpNotes":"Q2 SLA renewal contract approved. Full settlement on 30-day term.","assignedManager":"Sneha Roy"},{"id":"deb-6","customerName":"Orion FinTech Systems Private Limited","entityType":"Startup Client","gstin":"36AAAC09912A1Z1","creditPeriodDays":30,"totalOutstanding":480000,"bucket0to30":300000,"bucket31to60":0,"bucket61to90":0,"bucket91to180":180000,"bucketAbove180":0,"lastPaymentDate":"2026-06-15","lastPaymentAmount":200000,"dsoDays":92,"riskRating":"High","status":"Reminder Sent","followUpNotes":"Overdue reminder notice dispatched with GST invoice attachments. Series A funding round pending.","assignedManager":"Pooja Sharma"},{"id":"deb-7","customerName":"Apex Cloud Solutions (Legacy Account)","entityType":"SME Client","gstin":"27AABCA3310F1ZT","creditPeriodDays":30,"totalOutstanding":300000,"bucket0to30":0,"bucket31to60":0,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":300000,"lastPaymentDate":"2026-01-20","lastPaymentAmount":100000,"dsoDays":220,"riskRating":"High","status":"Legal Notice","followUpNotes":"Full provision of ₹2.6L created in books under Ind AS ECL model. Legal notice under Section 138 / IBC in review.","assignedManager":"CA Manish Goyal"},{"id":"deb-8","customerName":"Other Small Customers (21 Active Accounts)","entityType":"SME Aggregated","creditPeriodDays":30,"totalOutstanding":1160000,"bucket0to30":750000,"bucket31to60":410000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-30","lastPaymentAmount":640000,"dsoDays":35,"riskRating":"Low","status":"Current","followUpNotes":"Regular monthly billing cycle. Automatic payment gateway collection enabled.","assignedManager":"Sneha Roy"}]},"fundFlow":{"period":"August 2026 (Month-End Flow)","sources":{"fundsFromOperations":1085000,"issueOfShareCapital":0,"longTermBorrowingsRaised":500000,"saleOfFixedAssets":0,"decreaseInWorkingCapital":0,"totalSources":1585000},"applications":{"purchaseOfFixedAssets":480000,"repaymentOfLongTermBorrowings":250000,"paymentOfTaxAndAdvanceTax":200000,"paymentOfDividendsOrDrawings":0,"increaseInWorkingCapital":655000,"totalApplications":1585000},"netMovementOfFunds":655000,"openingCashAndBank":13595000,"closingCashAndBank":14250000,"workingCapitalSchedule":{"totalCurrentAssetsPrevious":49450000,"totalCurrentAssetsCurrent":50560000,"totalCurrentLiabilitiesPrevious":11755000,"totalCurrentLiabilitiesCurrent":12210000,"workingCapitalPrevious":37695000,"workingCapitalCurrent":38350000,"netChangeInWorkingCapital":655000,"netChangeType":"Increase","items":[{"id":"wc-1","particulars":"Inventories & Spares","category":"Current Asset","previousPeriod":1280000,"currentPeriod":1460000,"effect":"Increase in Working Capital","effectAmount":180000},{"id":"wc-2","particulars":"Trade Receivables (Debtors)","category":"Current Asset","previousPeriod":5850000,"currentPeriod":6240000,"effect":"Increase in Working Capital","effectAmount":390000},{"id":"wc-3","particulars":"Cash & Bank Balances (Liquid Funds)","category":"Current Asset","previousPeriod":13595000,"currentPeriod":14250000,"effect":"Increase in Working Capital","effectAmount":655000},{"id":"wc-4","particulars":"Short-term Advances & GST ITC Balance","category":"Current Asset","previousPeriod":4525000,"currentPeriod":4350000,"effect":"Decrease in Working Capital","effectAmount":-175000},{"id":"wc-5","particulars":"Trade Payables (Vendor Creditors & MSME)","category":"Current Liability","previousPeriod":3120000,"currentPeriod":3410000,"effect":"Decrease in Working Capital","effectAmount":-290000},{"id":"wc-6","particulars":"Other Current Statutory Liabilities & Provisions","category":"Current Liability","previousPeriod":4135000,"currentPeriod":4300000,"effect":"Decrease in Working Capital","effectAmount":-165000}]}},"threeMonthCashBudget":{"companyId":"client-101","months":["October 2026","November 2026","December 2026"],"startingCashBalance":1650000,"minimumSafeBuffer":500000,"sanctionedODLimit":2500000,"weeks":[{"id":"w1","weekNumber":1,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 1","dateRange":"Oct 01 - Oct 07","isActualsClosed":true,"closedAt":"2026-10-07T18:00:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w2","weekNumber":2,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 2","dateRange":"Oct 08 - Oct 14","isActualsClosed":true,"closedAt":"2026-10-14T17:30:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w3","weekNumber":3,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 3","dateRange":"Oct 15 - Oct 21","isActualsClosed":false},{"id":"w4","weekNumber":4,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 4","dateRange":"Oct 22 - Oct 31","isActualsClosed":false},{"id":"w5","weekNumber":5,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 5","dateRange":"Nov 01 - Nov 07","isActualsClosed":false},{"id":"w6","weekNumber":6,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 6","dateRange":"Nov 08 - Nov 14","isActualsClosed":false},{"id":"w7","weekNumber":7,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 7","dateRange":"Nov 15 - Nov 21","isActualsClosed":false},{"id":"w8","weekNumber":8,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 8","dateRange":"Nov 22 - Nov 30","isActualsClosed":false},{"id":"w9","weekNumber":9,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 9","dateRange":"Dec 01 - Dec 07","isActualsClosed":false},{"id":"w10","weekNumber":10,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 10","dateRange":"Dec 08 - Dec 14","isActualsClosed":false},{"id":"w11","weekNumber":11,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 11","dateRange":"Dec 15 - Dec 21","isActualsClosed":false},{"id":"w12","weekNumber":12,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 12","dateRange":"Dec 22 - Dec 31","isActualsClosed":false}],"items":[{"id":"cf-in-01","category":"inflow","section":"collections","name":"Collections: Domestic Enterprise Clients","weekly":{"w1":{"budget":1350000,"actual":1280000,"notes":"Apex Retail paid ₹4.8L; ₹70k delayed to W2"},"w2":{"budget":1450000,"actual":1520000,"notes":"Received delayed invoice + regular cycle"},"w3":{"budget":1200000,"actual":950000,"notes":"Pending collection from Reliance Retail ₹2.5L"},"w4":{"budget":1600000},"w5":{"budget":1400000},"w6":{"budget":1500000},"w7":{"budget":1350000},"w8":{"budget":1650000},"w9":{"budget":1450000},"w10":{"budget":1550000},"w11":{"budget":1400000},"w12":{"budget":1750000}}},{"id":"cf-in-02","category":"inflow","section":"collections","name":"Collections: Export Clients & USD Remittances","weekly":{"w1":{"budget":300000,"actual":310000,"notes":"USD 3,700 received via Citi EEFC"},"w2":{"budget":250000,"actual":265000},"w3":{"budget":350000,"actual":350000},"w4":{"budget":300000},"w5":{"budget":320000},"w6":{"budget":280000},"w7":{"budget":350000},"w8":{"budget":300000},"w9":{"budget":330000},"w10":{"budget":290000},"w11":{"budget":360000},"w12":{"budget":320000}}},{"id":"cf-in-03","category":"inflow","section":"direct_sales","name":"Direct SaaS Subscriptions & Self-Serve Gateway","weekly":{"w1":{"budget":120000,"actual":128000},"w2":{"budget":110000,"actual":115000},"w3":{"budget":130000,"actual":130000},"w4":{"budget":140000},"w5":{"budget":125000},"w6":{"budget":115000},"w7":{"budget":135000},"w8":{"budget":145000},"w9":{"budget":130000},"w10":{"budget":120000},"w11":{"budget":140000},"w12":{"budget":150000}}},{"id":"cf-in-04","category":"inflow","section":"statutory_refunds","name":"Statutory Refunds & RoDTEP Export Incentives","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":120000,"actual":0,"notes":"GST refund credited to bank delayed by Dept"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":180000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-in-05","category":"inflow","section":"financing_inflow","name":"Bank OD Draw / Inter-Corporate Deposit Payout","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-01","category":"outflow","section":"supplier_payments","name":"MSME Priority Vendor Payments (Sec 43B(h) <45d)","weekly":{"w1":{"budget":320000,"actual":325000,"notes":"Paid 3 MSME suppliers before due date"},"w2":{"budget":280000,"actual":290000},"w3":{"budget":420000,"actual":420000,"notes":"Critical micro suppliers invoice due on Oct 19"},"w4":{"budget":350000},"w5":{"budget":310000},"w6":{"budget":270000},"w7":{"budget":410000},"w8":{"budget":340000},"w9":{"budget":330000},"w10":{"budget":280000},"w11":{"budget":430000},"w12":{"budget":360000}}},{"id":"cf-out-02","category":"outflow","section":"supplier_payments","name":"General Trade Creditors & Material Suppliers","weekly":{"w1":{"budget":450000,"actual":420000,"notes":"Negotiated 7-day payment extension"},"w2":{"budget":520000,"actual":540000},"w3":{"budget":480000,"actual":480000},"w4":{"budget":510000},"w5":{"budget":460000},"w6":{"budget":500000},"w7":{"budget":490000},"w8":{"budget":530000},"w9":{"budget":470000},"w10":{"budget":510000},"w11":{"budget":500000},"w12":{"budget":550000}}},{"id":"cf-out-03","category":"outflow","section":"payroll","name":"Employee Salaries, Wages & Health Insurance","weekly":{"w1":{"budget":2350000,"actual":2340000,"notes":"Disbursed on Oct 03 via ICICI batch"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":2400000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":2420000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-04","category":"outflow","section":"payroll","name":"Contractor Retainers & Freelance Developers","weekly":{"w1":{"budget":180000,"actual":175000},"w2":{"budget":120000,"actual":130000},"w3":{"budget":90000,"actual":90000},"w4":{"budget":80000},"w5":{"budget":190000},"w6":{"budget":110000},"w7":{"budget":85000},"w8":{"budget":80000},"w9":{"budget":195000},"w10":{"budget":115000},"w11":{"budget":90000},"w12":{"budget":85000}}},{"id":"cf-out-05","category":"outflow","section":"statutory_dues","name":"GST Monthly Discharge (GSTR-3B by 20th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":680000,"actual":680000,"notes":"Statutory mandatory GST cash ledger payment"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":710000},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":730000},"w12":{"budget":0}}},{"id":"cf-out-06","category":"outflow","section":"statutory_dues","name":"TDS / TCS Challan Payment (by 7th)","weekly":{"w1":{"budget":195000,"actual":195000,"notes":"Challan 281 cleared on Oct 06"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":205000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":210000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-07","category":"outflow","section":"statutory_dues","name":"PF & ESIC Statutory Remittance (by 15th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":145000,"actual":142000,"notes":"EPFO electronic challan paid"},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":155000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-08","category":"outflow","section":"statutory_dues","name":"Advance Corporate Income Tax (Q3 Due 15th Dec)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":450000},"w12":{"budget":0}}},{"id":"cf-out-09","category":"outflow","section":"operating_overheads","name":"Cloud Infrastructure (AWS / Azure) & Software","weekly":{"w1":{"budget":80000,"actual":82000},"w2":{"budget":60000,"actual":58000},"w3":{"budget":240000,"actual":240000,"notes":"Monthly AWS billing debit on Oct 18"},"w4":{"budget":50000},"w5":{"budget":80000},"w6":{"budget":60000},"w7":{"budget":250000},"w8":{"budget":50000},"w9":{"budget":85000},"w10":{"budget":65000},"w11":{"budget":260000},"w12":{"budget":55000}}},{"id":"cf-out-10","category":"outflow","section":"operating_overheads","name":"Office Rent, Utilities & Administrative Overheads","weekly":{"w1":{"budget":210000,"actual":210000,"notes":"Office lease rent cleared"},"w2":{"budget":70000,"actual":68000},"w3":{"budget":65000,"actual":65000},"w4":{"budget":90000},"w5":{"budget":215000},"w6":{"budget":70000},"w7":{"budget":65000},"w8":{"budget":95000},"w9":{"budget":220000},"w10":{"budget":75000},"w11":{"budget":70000},"w12":{"budget":100000}}},{"id":"cf-out-11","category":"outflow","section":"finance_costs","name":"Bank Term Loan EMI & Working Capital Interest","weekly":{"w1":{"budget":125000,"actual":125000,"notes":"HDFC Term Loan auto-debit on 5th"},"w2":{"budget":0,"actual":0},"w3":{"budget":45000,"actual":45000,"notes":"OD limit interest charge"},"w4":{"budget":0},"w5":{"budget":125000},"w6":{"budget":0},"w7":{"budget":45000},"w8":{"budget":0},"w9":{"budget":125000},"w10":{"budget":0},"w11":{"budget":50000},"w12":{"budget":0}}},{"id":"cf-out-12","category":"outflow","section":"capex","name":"Capital Expenditure (IT Equipment & Servers)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":180000,"actual":0,"notes":"Management deferring server acquisition"},"w4":{"budget":120000},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":120000},"w11":{"budget":0},"w12":{"budget":0}}}],"shortageActions":[{"id":"act-01","weekId":"w3","title":"Accelerate collections from Apex Retail & Reliance Infocomm","impactAmount":350000,"type":"accelerate_receivables","status":"approved","notes":"Account manager confirmed client will clear ₹3.5L by Oct 18 before GST run."},{"id":"act-02","weekId":"w3","title":"Defer GPU Server Capex to Week 6","impactAmount":180000,"type":"defer_capex","status":"executed","notes":"Approved by CFO to conserve liquid liquidity during statutory GST week."},{"id":"act-03","weekId":"w7","title":"Pre-arranged drawdown of HDFC CC/OD limit (₹5L cushion)","impactAmount":400000,"type":"draw_od","status":"proposed","notes":"Standby buffer if November mid-month export collection experiences banking delay."}],"lastUpdated":"2026-10-16T10:45:00Z","updatedBy":"Kavita Sharma (Account Manager)"}}'::jsonb,
  'approved',
  'ad384b5d-7461-44fe-8625-a68affc52c04'
)
ON CONFLICT (id) DO UPDATE SET
  rows = EXCLUDED.rows,
  status = EXCLUDED.status,
  uploaded_by = EXCLUDED.uploaded_by;

INSERT INTO public.mis_uploads (id, company_id, statement_type, period, file_name, row_count, rows, status, uploaded_by)
VALUES (
  '7871602b-fddf-4300-af7b-e610ff3f8a62',
  'client-102',
  'pnl',
  'August 2026 (Month-End MIS)',
  'Tally_PnL_Consolidated_Aug2026.xlsx',
  18,
  '{"period":"August 2026 (Month-End MIS)","monthlyRevenue":8200000,"revenueGrowthMoM":8.6,"grossMarginPercent":44.5,"ebitda":1480000,"ebitdaMarginPercent":18,"netProfit":980000,"cashAndBankBalance":21500000,"monthlyBurnRate":3100000,"cashRunwayMonths":6.9,"totalDebtors":11200000,"debtorsOver90Days":1450000,"debtorDaysDSO":51,"totalCreditors":6800000,"creditorsOver45Days":450000,"workingCapital":14700000,"quickRatio":1.82,"cfoExecutiveSummary":"Freight volume up 14% on Western corridor. GSTR-1 and E-way bill reconciliation completed without variances. Working capital utilization at 68% of sanction limit with Axis Bank. Focus area: recovery from 3 container freight stations.","cfoKeyAlerts":["TDS payment under Sec 194C (Transporters) of ₹1.85L cleared on 7th Sep.","Quarterly stock and receivables statement submission due for Axis Bank CC review.","Vehicle tax and interstate permit renewals scheduled for 18 fleet units."],"balanceSheet":{"asOfDate":"31 August 2026","previousDate":"31 March 2026","equityAndLiabilities":{"shareCapital":40000000,"reservesAndSurplus":48200000,"totalShareholdersFunds":88200000,"longTermBorrowings":28500000,"deferredTaxLiabilities":2400000,"otherLongTermLiabilities":1800000,"totalNonCurrentLiabilities":32700000,"shortTermBorrowings":12000000,"tradePayables":6350000,"tradePayablesMsme":450000,"otherCurrentLiabilities":3800000,"shortTermProvisions":2100000,"totalCurrentLiabilities":24700000,"totalEquityAndLiabilities":145600000},"assets":{"propertyPlantEquipment":68500000,"accumulatedDepreciation":14200000,"netPpe":54300000,"capitalWorkInProgress":3200000,"intangibleAssets":4100000,"nonCurrentInvestments":8000000,"longTermLoansAndAdvances":3500000,"totalNonCurrentAssets":73100000,"inventories":3800000,"tradeReceivables":11200000,"allowanceForDoubtfulDebts":450000,"netTradeReceivables":10750000,"cashAndCashEquivalents":21500000,"bankBalancesOther":3500000,"shortTermLoansAndAdvances":2950000,"otherCurrentAssets":4200000,"totalCurrentAssets":46700000,"totalAssets":145600000},"previousYearComparison":{"totalEquityAndLiabilities":79200000,"totalAssets":79200000,"workingCapital":31200000,"netWorth":51200000}},"pnlStatement":{"period":"September 2026","comparisonPeriod":"August 2026","financialYear":"FY 2026-27 (Apr 2026 – Sep 2026)","monthsList":["April 2026","May 2026","June 2026","July 2026","August 2026","September 2026"],"completedMonths":["April 2026","May 2026","June 2026","July 2026","August 2026"],"currentMonthKey":"September 2026","income":{"revenueFromOperations":8200000,"otherIncome":180000,"totalIncome":8380000},"expenses":{"costOfMaterialsOrDirectCosts":1610000,"employeeBenefitsExpense":1275000,"cloudAndInfrastructureCosts":350000,"salesAndMarketingCosts":340000,"otherExpenses":245000,"financeCosts":92000,"depreciationAndAmortization":125000,"totalExpenses":4037000},"profitability":{"grossProfit":3649000,"grossMarginPercent":44.5,"ebitda":1480000,"ebitdaMarginPercent":18,"pbt":1210000,"pbtMarginPercent":14.8,"currentTax":230000,"deferredTax":0,"pat":980000,"patMarginPercent":12},"lineItems":[{"id":"rev-ops","particulars":"Revenue from Operations (SaaS Subscriptions & Enterprise Licences)","noteRef":"Note 21","currentMonth":5240000,"previousMonth":4850000,"ytdCurrentYear":27255000,"momGrowthPct":8,"pctOfRevenue":100,"isSubtotal":false,"monthlyBreakdown":{"April 2026":4120000,"May 2026":4280000,"June 2026":4450000,"July 2026":4315000,"August 2026":4850000,"September 2026":5240000},"varianceVsPrevious":390000,"varianceVsPreviousPct":8,"varianceVsBase":1120000,"varianceVsBasePct":27.2,"monthlyAverage":4542500,"varianceRemarks":"Strong enterprise expansion and ACV uplift; +8.0% MoM and +27.2% vs April kickoff"},{"id":"other-inc","particulars":"Other Income (Sweep FD Interest, Treasury Yield & Forex Gain)","noteRef":"Note 22","currentMonth":145000,"previousMonth":135000,"ytdCurrentYear":722000,"momGrowthPct":7.4,"pctOfRevenue":2.8,"isSubtotal":false,"monthlyBreakdown":{"April 2026":95000,"May 2026":110000,"June 2026":125000,"July 2026":112000,"August 2026":135000,"September 2026":145000},"varianceVsPrevious":10000,"varianceVsPreviousPct":7.4,"varianceVsBase":50000,"varianceVsBasePct":52.6,"monthlyAverage":120333,"varianceRemarks":"Auto-sweep FD interest and treasury returns from higher liquid surplus"},{"id":"tot-inc","particulars":"I. Total Income (Revenue + Other Income)","currentMonth":5385000,"previousMonth":4985000,"ytdCurrentYear":27977000,"momGrowthPct":8,"pctOfRevenue":102.8,"isTotal":true,"monthlyBreakdown":{"April 2026":4215000,"May 2026":4390000,"June 2026":4575000,"July 2026":4427000,"August 2026":4985000,"September 2026":5385000},"varianceVsPrevious":400000,"varianceVsPreviousPct":8,"varianceVsBase":1170000,"varianceVsBasePct":27.8,"monthlyAverage":4662833},{"id":"exp-cogs","particulars":"Direct Operational Costs & Third-Party API Gateway Charges","noteRef":"Note 23","currentMonth":1610000,"previousMonth":1542300,"ytdCurrentYear":8722300,"momGrowthPct":4.4,"pctOfRevenue":30.7,"monthlyBreakdown":{"April 2026":1350000,"May 2026":1380000,"June 2026":1430000,"July 2026":1410000,"August 2026":1542300,"September 2026":1610000},"varianceVsPrevious":67700,"varianceVsPreviousPct":4.4,"varianceVsBase":260000,"varianceVsBasePct":19.3,"monthlyAverage":1453717,"varianceRemarks":"Direct infra scaled with active user volume; gross margin sustained above 69%"},{"id":"exp-emp","particulars":"Employee Benefit Expenses (Engineering, Finance & Operations Payroll)","noteRef":"Note 24","currentMonth":1275000,"previousMonth":1240000,"ytdCurrentYear":7115000,"momGrowthPct":2.8,"pctOfRevenue":24.3,"monthlyBreakdown":{"April 2026":1120000,"May 2026":1140000,"June 2026":1160000,"July 2026":1180000,"August 2026":1240000,"September 2026":1275000},"varianceVsPrevious":35000,"varianceVsPreviousPct":2.8,"varianceVsBase":155000,"varianceVsBasePct":13.8,"monthlyAverage":1185833,"varianceRemarks":"Increment for 2 senior engineering hires and quarterly PF/ESI re-benchmarking"},{"id":"exp-cloud","particulars":"Cloud Computing, AI Model Inference & Hosting Infrastructure","noteRef":"Note 25","currentMonth":350000,"previousMonth":365000,"ytdCurrentYear":2295000,"momGrowthPct":-4.1,"pctOfRevenue":6.7,"monthlyBreakdown":{"April 2026":410000,"May 2026":395000,"June 2026":385000,"July 2026":390000,"August 2026":365000,"September 2026":350000},"varianceVsPrevious":-15000,"varianceVsPreviousPct":-4.1,"varianceVsBase":-60000,"varianceVsBasePct":-14.6,"monthlyAverage":382500,"varianceRemarks":"Favorable variance: 3-year compute savings plan locked on AWS reducing unit egress cost"},{"id":"exp-mktg","particulars":"Sales Promotion, Digital Marketing & Enterprise Conferences","noteRef":"Note 26","currentMonth":340000,"previousMonth":322000,"ytdCurrentYear":1807000,"momGrowthPct":5.6,"pctOfRevenue":6.5,"monthlyBreakdown":{"April 2026":260000,"May 2026":280000,"June 2026":310000,"July 2026":295000,"August 2026":322000,"September 2026":340000},"varianceVsPrevious":18000,"varianceVsPreviousPct":5.6,"varianceVsBase":80000,"varianceVsBasePct":30.8,"monthlyAverage":301167,"varianceRemarks":"Q2 end pipeline push for enterprise client conversion"},{"id":"exp-admin","particulars":"Administrative, Rent, Legal & Virtual CFO Compliance Retainership","noteRef":"Note 27","currentMonth":245000,"previousMonth":240700,"ytdCurrentYear":1405700,"momGrowthPct":1.8,"pctOfRevenue":4.7,"monthlyBreakdown":{"April 2026":225000,"May 2026":228000,"June 2026":235000,"July 2026":232000,"August 2026":240700,"September 2026":245000},"varianceVsPrevious":4300,"varianceVsPreviousPct":1.8,"varianceVsBase":20000,"varianceVsBasePct":8.9,"monthlyAverage":234283,"varianceRemarks":"Includes Virtual CFO retainership, ROC secretarial audits, statutory licenses"},{"id":"ebitda-sub","particulars":"II. Operating EBITDA (Operational Profitability)","currentMonth":1420000,"previousMonth":1140000,"ytdCurrentYear":6352000,"momGrowthPct":24.6,"pctOfRevenue":27.1,"isSubtotal":true,"monthlyBreakdown":{"April 2026":850000,"May 2026":967000,"June 2026":1055000,"July 2026":920000,"August 2026":1140000,"September 2026":1420000},"varianceVsPrevious":280000,"varianceVsPreviousPct":24.6,"varianceVsBase":570000,"varianceVsBasePct":67.1,"monthlyAverage":1058667,"varianceRemarks":"Operating leverage kicking in as top-line rose 8% while opex grew only 2.3%"},{"id":"exp-depr","particulars":"Depreciation & Amortization Expense (PPE & Intangibles)","noteRef":"Note 11","currentMonth":125000,"previousMonth":125000,"ytdCurrentYear":735000,"momGrowthPct":0,"pctOfRevenue":2.4,"monthlyBreakdown":{"April 2026":120000,"May 2026":122000,"June 2026":123000,"July 2026":120000,"August 2026":125000,"September 2026":125000},"varianceVsPrevious":0,"varianceVsPreviousPct":0,"varianceVsBase":5000,"varianceVsBasePct":4.2,"monthlyAverage":122500},{"id":"exp-fin","particulars":"Finance Costs (Bank Loan Interest & Processing Charges)","noteRef":"Note 28","currentMonth":92000,"previousMonth":95000,"ytdCurrentYear":587000,"momGrowthPct":-3.2,"pctOfRevenue":1.8,"monthlyBreakdown":{"April 2026":105000,"May 2026":102000,"June 2026":100000,"July 2026":98000,"August 2026":95000,"September 2026":92000},"varianceVsPrevious":-3000,"varianceVsPreviousPct":-3.2,"varianceVsBase":-13000,"varianceVsBasePct":-12.4,"monthlyAverage":97833,"varianceRemarks":"Principal amortization of term loan lowering interest burden month over month"},{"id":"pbt-total","particulars":"III. Profit Before Tax (PBT)","currentMonth":1348000,"previousMonth":1055000,"ytdCurrentYear":5747000,"momGrowthPct":27.8,"pctOfRevenue":25.7,"isSubtotal":true,"monthlyBreakdown":{"April 2026":720000,"May 2026":853000,"June 2026":957000,"July 2026":814000,"August 2026":1055000,"September 2026":1348000},"varianceVsPrevious":293000,"varianceVsPreviousPct":27.8,"varianceVsBase":628000,"varianceVsBasePct":87.2,"monthlyAverage":957833},{"id":"tax-exp","particulars":"Current Tax Expense (Corporate Advance Tax Provision)","noteRef":"Note 29","currentMonth":242000,"previousMonth":190000,"ytdCurrentYear":1040000,"momGrowthPct":27.4,"pctOfRevenue":4.6,"monthlyBreakdown":{"April 2026":135000,"May 2026":155000,"June 2026":172000,"July 2026":146000,"August 2026":190000,"September 2026":242000},"varianceVsPrevious":52000,"varianceVsPreviousPct":27.4,"varianceVsBase":107000,"varianceVsBasePct":79.3,"monthlyAverage":173333,"varianceRemarks":"Quarterly advance tax provision matched to Sec 115BAA corporate tax requirements"},{"id":"pat-final","particulars":"IV. Profit After Tax - PAT (Net Margin Bottom-Line)","currentMonth":1106000,"previousMonth":865000,"ytdCurrentYear":4707000,"momGrowthPct":27.9,"pctOfRevenue":21.1,"isTotal":true,"monthlyBreakdown":{"April 2026":585000,"May 2026":698000,"June 2026":785000,"July 2026":668000,"August 2026":865000,"September 2026":1106000},"varianceVsPrevious":241000,"varianceVsPreviousPct":27.9,"varianceVsBase":521000,"varianceVsBasePct":89.1,"monthlyAverage":784500,"varianceRemarks":"Net profit crossed ₹11 Lakhs milestone; net margin of 21.1% vs 14.2% in April"}]},"debtorAgeing":{"asOfDate":"31 August 2026","totalReceivables":11200000,"daysSalesOutstanding":51,"overduePercentage":27.2,"provisionForBadDebts":450000,"buckets":{"days0to30":{"amount":5600000,"percentage":50,"count":34},"days31to60":{"amount":3100000,"percentage":27.7,"count":18},"days61to90":{"amount":1050000,"percentage":9.4,"count":7},"days91to180":{"amount":1000000,"percentage":8.9,"count":5},"daysAbove180":{"amount":450000,"percentage":4,"count":2}},"topDebtors":[{"id":"deb-102-1","customerName":"Adani Ports & Special Economic Zone","entityType":"Enterprise Client","gstin":"24AABCA1234F1Z8","creditPeriodDays":60,"totalOutstanding":2850000,"bucket0to30":1950000,"bucket31to60":900000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-25","lastPaymentAmount":1800000,"dsoDays":45,"riskRating":"Low","status":"Current","followUpNotes":"Interstate container freight billed on 60-day terms. Payout approved.","assignedManager":"Sneha Roy"},{"id":"deb-102-2","customerName":"Reliance Retail Supply Chain Ltd","entityType":"Enterprise Client","gstin":"27AAACR1290C1ZP","creditPeriodDays":45,"totalOutstanding":2150000,"bucket0to30":1600000,"bucket31to60":550000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-18","lastPaymentAmount":1400000,"dsoDays":42,"riskRating":"Low","status":"Current","followUpNotes":"Warehousing and fleet cross-dock charges verified.","assignedManager":"Pooja Sharma"}]},"fundFlow":{"period":"August 2026 (Month-End Flow)","sources":{"fundsFromOperations":1850000,"issueOfShareCapital":0,"longTermBorrowingsRaised":2400000,"saleOfFixedAssets":350000,"totalSources":4600000},"applications":{"purchaseOfFixedAssets":3100000,"repaymentOfLongTermBorrowings":650000,"paymentOfTaxAndAdvanceTax":320000,"paymentOfDividendsOrDrawings":0,"increaseInWorkingCapital":530000,"totalApplications":4600000},"netMovementOfFunds":530000,"openingCashAndBank":20970000,"closingCashAndBank":21500000,"workingCapitalSchedule":{"totalCurrentAssetsPrevious":49450000,"totalCurrentAssetsCurrent":50560000,"totalCurrentLiabilitiesPrevious":11755000,"totalCurrentLiabilitiesCurrent":12210000,"workingCapitalPrevious":37695000,"workingCapitalCurrent":38350000,"netChangeInWorkingCapital":655000,"netChangeType":"Increase","items":[{"id":"wc-1","particulars":"Inventories & Spares","category":"Current Asset","previousPeriod":1280000,"currentPeriod":1460000,"effect":"Increase in Working Capital","effectAmount":180000},{"id":"wc-2","particulars":"Trade Receivables (Debtors)","category":"Current Asset","previousPeriod":5850000,"currentPeriod":6240000,"effect":"Increase in Working Capital","effectAmount":390000},{"id":"wc-3","particulars":"Cash & Bank Balances (Liquid Funds)","category":"Current Asset","previousPeriod":13595000,"currentPeriod":14250000,"effect":"Increase in Working Capital","effectAmount":655000},{"id":"wc-4","particulars":"Short-term Advances & GST ITC Balance","category":"Current Asset","previousPeriod":4525000,"currentPeriod":4350000,"effect":"Decrease in Working Capital","effectAmount":-175000},{"id":"wc-5","particulars":"Trade Payables (Vendor Creditors & MSME)","category":"Current Liability","previousPeriod":3120000,"currentPeriod":3410000,"effect":"Decrease in Working Capital","effectAmount":-290000},{"id":"wc-6","particulars":"Other Current Statutory Liabilities & Provisions","category":"Current Liability","previousPeriod":4135000,"currentPeriod":4300000,"effect":"Decrease in Working Capital","effectAmount":-165000}]}},"threeMonthCashBudget":{"companyId":"client-101","months":["October 2026","November 2026","December 2026"],"startingCashBalance":2150000,"minimumSafeBuffer":500000,"sanctionedODLimit":3500000,"weeks":[{"id":"w1","weekNumber":1,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 1","dateRange":"Oct 01 - Oct 07","isActualsClosed":true,"closedAt":"2026-10-07T18:00:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w2","weekNumber":2,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 2","dateRange":"Oct 08 - Oct 14","isActualsClosed":true,"closedAt":"2026-10-14T17:30:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w3","weekNumber":3,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 3","dateRange":"Oct 15 - Oct 21","isActualsClosed":false},{"id":"w4","weekNumber":4,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 4","dateRange":"Oct 22 - Oct 31","isActualsClosed":false},{"id":"w5","weekNumber":5,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 5","dateRange":"Nov 01 - Nov 07","isActualsClosed":false},{"id":"w6","weekNumber":6,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 6","dateRange":"Nov 08 - Nov 14","isActualsClosed":false},{"id":"w7","weekNumber":7,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 7","dateRange":"Nov 15 - Nov 21","isActualsClosed":false},{"id":"w8","weekNumber":8,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 8","dateRange":"Nov 22 - Nov 30","isActualsClosed":false},{"id":"w9","weekNumber":9,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 9","dateRange":"Dec 01 - Dec 07","isActualsClosed":false},{"id":"w10","weekNumber":10,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 10","dateRange":"Dec 08 - Dec 14","isActualsClosed":false},{"id":"w11","weekNumber":11,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 11","dateRange":"Dec 15 - Dec 21","isActualsClosed":false},{"id":"w12","weekNumber":12,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 12","dateRange":"Dec 22 - Dec 31","isActualsClosed":false}],"items":[{"id":"cf-in-01","category":"inflow","section":"collections","name":"Collections: Domestic Enterprise Clients","weekly":{"w1":{"budget":1350000,"actual":1280000,"notes":"Apex Retail paid ₹4.8L; ₹70k delayed to W2"},"w2":{"budget":1450000,"actual":1520000,"notes":"Received delayed invoice + regular cycle"},"w3":{"budget":1200000,"actual":950000,"notes":"Pending collection from Reliance Retail ₹2.5L"},"w4":{"budget":1600000},"w5":{"budget":1400000},"w6":{"budget":1500000},"w7":{"budget":1350000},"w8":{"budget":1650000},"w9":{"budget":1450000},"w10":{"budget":1550000},"w11":{"budget":1400000},"w12":{"budget":1750000}}},{"id":"cf-in-02","category":"inflow","section":"collections","name":"Collections: Export Clients & USD Remittances","weekly":{"w1":{"budget":300000,"actual":310000,"notes":"USD 3,700 received via Citi EEFC"},"w2":{"budget":250000,"actual":265000},"w3":{"budget":350000,"actual":350000},"w4":{"budget":300000},"w5":{"budget":320000},"w6":{"budget":280000},"w7":{"budget":350000},"w8":{"budget":300000},"w9":{"budget":330000},"w10":{"budget":290000},"w11":{"budget":360000},"w12":{"budget":320000}}},{"id":"cf-in-03","category":"inflow","section":"direct_sales","name":"Direct SaaS Subscriptions & Self-Serve Gateway","weekly":{"w1":{"budget":120000,"actual":128000},"w2":{"budget":110000,"actual":115000},"w3":{"budget":130000,"actual":130000},"w4":{"budget":140000},"w5":{"budget":125000},"w6":{"budget":115000},"w7":{"budget":135000},"w8":{"budget":145000},"w9":{"budget":130000},"w10":{"budget":120000},"w11":{"budget":140000},"w12":{"budget":150000}}},{"id":"cf-in-04","category":"inflow","section":"statutory_refunds","name":"Statutory Refunds & RoDTEP Export Incentives","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":120000,"actual":0,"notes":"GST refund credited to bank delayed by Dept"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":180000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-in-05","category":"inflow","section":"financing_inflow","name":"Bank OD Draw / Inter-Corporate Deposit Payout","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-01","category":"outflow","section":"supplier_payments","name":"MSME Priority Vendor Payments (Sec 43B(h) <45d)","weekly":{"w1":{"budget":320000,"actual":325000,"notes":"Paid 3 MSME suppliers before due date"},"w2":{"budget":280000,"actual":290000},"w3":{"budget":420000,"actual":420000,"notes":"Critical micro suppliers invoice due on Oct 19"},"w4":{"budget":350000},"w5":{"budget":310000},"w6":{"budget":270000},"w7":{"budget":410000},"w8":{"budget":340000},"w9":{"budget":330000},"w10":{"budget":280000},"w11":{"budget":430000},"w12":{"budget":360000}}},{"id":"cf-out-02","category":"outflow","section":"supplier_payments","name":"General Trade Creditors & Material Suppliers","weekly":{"w1":{"budget":450000,"actual":420000,"notes":"Negotiated 7-day payment extension"},"w2":{"budget":520000,"actual":540000},"w3":{"budget":480000,"actual":480000},"w4":{"budget":510000},"w5":{"budget":460000},"w6":{"budget":500000},"w7":{"budget":490000},"w8":{"budget":530000},"w9":{"budget":470000},"w10":{"budget":510000},"w11":{"budget":500000},"w12":{"budget":550000}}},{"id":"cf-out-03","category":"outflow","section":"payroll","name":"Employee Salaries, Wages & Health Insurance","weekly":{"w1":{"budget":2350000,"actual":2340000,"notes":"Disbursed on Oct 03 via ICICI batch"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":2400000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":2420000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-04","category":"outflow","section":"payroll","name":"Contractor Retainers & Freelance Developers","weekly":{"w1":{"budget":180000,"actual":175000},"w2":{"budget":120000,"actual":130000},"w3":{"budget":90000,"actual":90000},"w4":{"budget":80000},"w5":{"budget":190000},"w6":{"budget":110000},"w7":{"budget":85000},"w8":{"budget":80000},"w9":{"budget":195000},"w10":{"budget":115000},"w11":{"budget":90000},"w12":{"budget":85000}}},{"id":"cf-out-05","category":"outflow","section":"statutory_dues","name":"GST Monthly Discharge (GSTR-3B by 20th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":680000,"actual":680000,"notes":"Statutory mandatory GST cash ledger payment"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":710000},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":730000},"w12":{"budget":0}}},{"id":"cf-out-06","category":"outflow","section":"statutory_dues","name":"TDS / TCS Challan Payment (by 7th)","weekly":{"w1":{"budget":195000,"actual":195000,"notes":"Challan 281 cleared on Oct 06"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":205000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":210000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-07","category":"outflow","section":"statutory_dues","name":"PF & ESIC Statutory Remittance (by 15th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":145000,"actual":142000,"notes":"EPFO electronic challan paid"},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":155000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-08","category":"outflow","section":"statutory_dues","name":"Advance Corporate Income Tax (Q3 Due 15th Dec)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":450000},"w12":{"budget":0}}},{"id":"cf-out-09","category":"outflow","section":"operating_overheads","name":"Cloud Infrastructure (AWS / Azure) & Software","weekly":{"w1":{"budget":80000,"actual":82000},"w2":{"budget":60000,"actual":58000},"w3":{"budget":240000,"actual":240000,"notes":"Monthly AWS billing debit on Oct 18"},"w4":{"budget":50000},"w5":{"budget":80000},"w6":{"budget":60000},"w7":{"budget":250000},"w8":{"budget":50000},"w9":{"budget":85000},"w10":{"budget":65000},"w11":{"budget":260000},"w12":{"budget":55000}}},{"id":"cf-out-10","category":"outflow","section":"operating_overheads","name":"Office Rent, Utilities & Administrative Overheads","weekly":{"w1":{"budget":210000,"actual":210000,"notes":"Office lease rent cleared"},"w2":{"budget":70000,"actual":68000},"w3":{"budget":65000,"actual":65000},"w4":{"budget":90000},"w5":{"budget":215000},"w6":{"budget":70000},"w7":{"budget":65000},"w8":{"budget":95000},"w9":{"budget":220000},"w10":{"budget":75000},"w11":{"budget":70000},"w12":{"budget":100000}}},{"id":"cf-out-11","category":"outflow","section":"finance_costs","name":"Bank Term Loan EMI & Working Capital Interest","weekly":{"w1":{"budget":125000,"actual":125000,"notes":"HDFC Term Loan auto-debit on 5th"},"w2":{"budget":0,"actual":0},"w3":{"budget":45000,"actual":45000,"notes":"OD limit interest charge"},"w4":{"budget":0},"w5":{"budget":125000},"w6":{"budget":0},"w7":{"budget":45000},"w8":{"budget":0},"w9":{"budget":125000},"w10":{"budget":0},"w11":{"budget":50000},"w12":{"budget":0}}},{"id":"cf-out-12","category":"outflow","section":"capex","name":"Capital Expenditure (IT Equipment & Servers)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":180000,"actual":0,"notes":"Management deferring server acquisition"},"w4":{"budget":120000},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":120000},"w11":{"budget":0},"w12":{"budget":0}}}],"shortageActions":[{"id":"act-01","weekId":"w3","title":"Accelerate collections from Apex Retail & Reliance Infocomm","impactAmount":350000,"type":"accelerate_receivables","status":"approved","notes":"Account manager confirmed client will clear ₹3.5L by Oct 18 before GST run."},{"id":"act-02","weekId":"w3","title":"Defer GPU Server Capex to Week 6","impactAmount":180000,"type":"defer_capex","status":"executed","notes":"Approved by CFO to conserve liquid liquidity during statutory GST week."},{"id":"act-03","weekId":"w7","title":"Pre-arranged drawdown of HDFC CC/OD limit (₹5L cushion)","impactAmount":400000,"type":"draw_od","status":"proposed","notes":"Standby buffer if November mid-month export collection experiences banking delay."}],"lastUpdated":"2026-10-16T10:45:00Z","updatedBy":"Kavita Sharma (Account Manager)"}}'::jsonb,
  'approved',
  'ad384b5d-7461-44fe-8625-a68affc52c04'
)
ON CONFLICT (id) DO UPDATE SET
  rows = EXCLUDED.rows,
  status = EXCLUDED.status,
  uploaded_by = EXCLUDED.uploaded_by;

INSERT INTO public.mis_uploads (id, company_id, statement_type, period, file_name, row_count, rows, status, uploaded_by)
VALUES (
  '01d7b4d5-2398-4311-ba8a-a352b479fa43',
  'client-103',
  'pnl',
  'August 2026 (Month-End MIS)',
  'Tally_PnL_Consolidated_Aug2026.xlsx',
  18,
  '{"period":"August 2026 (Month-End MIS)","monthlyRevenue":2940000,"revenueGrowthMoM":18.2,"grossMarginPercent":74,"ebitda":820000,"ebitdaMarginPercent":27.9,"netProfit":670000,"cashAndBankBalance":9500000,"monthlyBurnRate":1120000,"cashRunwayMonths":8.5,"totalDebtors":3800000,"debtorsOver90Days":420000,"debtorDaysDSO":38,"totalCreditors":1950000,"creditorsOver45Days":110000,"workingCapital":7550000,"quickRatio":2.92,"cfoExecutiveSummary":"Diagnostic sensor kit sales gross margin maintained at 74%. LLP Form 11 annual return filed with MCA. Zero debt company with strong cash buffer of 8.5 months runway.","cfoKeyAlerts":["Form 8 (Statement of Account & Solvency) documentation drafting in progress.","Advance tax 2nd installment of ₹8.5L paid on 15th Sep.","R&D tax incentive certificate application under Section 35(2AB) in preparation."],"balanceSheet":{"asOfDate":"31 August 2026","previousDate":"31 March 2026","equityAndLiabilities":{"shareCapital":15000000,"reservesAndSurplus":19800000,"totalShareholdersFunds":34800000,"longTermBorrowings":0,"deferredTaxLiabilities":650000,"otherLongTermLiabilities":450000,"totalNonCurrentLiabilities":1100000,"shortTermBorrowings":0,"tradePayables":1840000,"tradePayablesMsme":110000,"otherCurrentLiabilities":1250000,"shortTermProvisions":950000,"totalCurrentLiabilities":4150000,"totalEquityAndLiabilities":40050000},"assets":{"propertyPlantEquipment":14500000,"accumulatedDepreciation":2800000,"netPpe":11700000,"capitalWorkInProgress":1200000,"intangibleAssets":5400000,"nonCurrentInvestments":2500000,"longTermLoansAndAdvances":950000,"totalNonCurrentAssets":21750000,"inventories":2100000,"tradeReceivables":3800000,"allowanceForDoubtfulDebts":120000,"netTradeReceivables":3680000,"cashAndCashEquivalents":9500000,"bankBalancesOther":1100000,"shortTermLoansAndAdvances":820000,"otherCurrentAssets":1100000,"totalCurrentAssets":18300000,"totalAssets":40050000},"previousYearComparison":{"totalEquityAndLiabilities":79200000,"totalAssets":79200000,"workingCapital":31200000,"netWorth":51200000}},"pnlStatement":{"period":"September 2026","comparisonPeriod":"August 2026","financialYear":"FY 2026-27 (Apr 2026 – Sep 2026)","monthsList":["April 2026","May 2026","June 2026","July 2026","August 2026","September 2026"],"completedMonths":["April 2026","May 2026","June 2026","July 2026","August 2026"],"currentMonthKey":"September 2026","income":{"revenueFromOperations":2940000,"otherIncome":85000,"totalIncome":3025000},"expenses":{"costOfMaterialsOrDirectCosts":1610000,"employeeBenefitsExpense":1275000,"cloudAndInfrastructureCosts":350000,"salesAndMarketingCosts":340000,"otherExpenses":245000,"financeCosts":92000,"depreciationAndAmortization":125000,"totalExpenses":4037000},"profitability":{"grossProfit":2175600,"grossMarginPercent":74,"ebitda":820000,"ebitdaMarginPercent":27.9,"pbt":785000,"pbtMarginPercent":26.7,"currentTax":115000,"deferredTax":0,"pat":670000,"patMarginPercent":22.8},"lineItems":[{"id":"rev-ops","particulars":"Revenue from Operations (SaaS Subscriptions & Enterprise Licences)","noteRef":"Note 21","currentMonth":5240000,"previousMonth":4850000,"ytdCurrentYear":27255000,"momGrowthPct":8,"pctOfRevenue":100,"isSubtotal":false,"monthlyBreakdown":{"April 2026":4120000,"May 2026":4280000,"June 2026":4450000,"July 2026":4315000,"August 2026":4850000,"September 2026":5240000},"varianceVsPrevious":390000,"varianceVsPreviousPct":8,"varianceVsBase":1120000,"varianceVsBasePct":27.2,"monthlyAverage":4542500,"varianceRemarks":"Strong enterprise expansion and ACV uplift; +8.0% MoM and +27.2% vs April kickoff"},{"id":"other-inc","particulars":"Other Income (Sweep FD Interest, Treasury Yield & Forex Gain)","noteRef":"Note 22","currentMonth":145000,"previousMonth":135000,"ytdCurrentYear":722000,"momGrowthPct":7.4,"pctOfRevenue":2.8,"isSubtotal":false,"monthlyBreakdown":{"April 2026":95000,"May 2026":110000,"June 2026":125000,"July 2026":112000,"August 2026":135000,"September 2026":145000},"varianceVsPrevious":10000,"varianceVsPreviousPct":7.4,"varianceVsBase":50000,"varianceVsBasePct":52.6,"monthlyAverage":120333,"varianceRemarks":"Auto-sweep FD interest and treasury returns from higher liquid surplus"},{"id":"tot-inc","particulars":"I. Total Income (Revenue + Other Income)","currentMonth":5385000,"previousMonth":4985000,"ytdCurrentYear":27977000,"momGrowthPct":8,"pctOfRevenue":102.8,"isTotal":true,"monthlyBreakdown":{"April 2026":4215000,"May 2026":4390000,"June 2026":4575000,"July 2026":4427000,"August 2026":4985000,"September 2026":5385000},"varianceVsPrevious":400000,"varianceVsPreviousPct":8,"varianceVsBase":1170000,"varianceVsBasePct":27.8,"monthlyAverage":4662833},{"id":"exp-cogs","particulars":"Direct Operational Costs & Third-Party API Gateway Charges","noteRef":"Note 23","currentMonth":1610000,"previousMonth":1542300,"ytdCurrentYear":8722300,"momGrowthPct":4.4,"pctOfRevenue":30.7,"monthlyBreakdown":{"April 2026":1350000,"May 2026":1380000,"June 2026":1430000,"July 2026":1410000,"August 2026":1542300,"September 2026":1610000},"varianceVsPrevious":67700,"varianceVsPreviousPct":4.4,"varianceVsBase":260000,"varianceVsBasePct":19.3,"monthlyAverage":1453717,"varianceRemarks":"Direct infra scaled with active user volume; gross margin sustained above 69%"},{"id":"exp-emp","particulars":"Employee Benefit Expenses (Engineering, Finance & Operations Payroll)","noteRef":"Note 24","currentMonth":1275000,"previousMonth":1240000,"ytdCurrentYear":7115000,"momGrowthPct":2.8,"pctOfRevenue":24.3,"monthlyBreakdown":{"April 2026":1120000,"May 2026":1140000,"June 2026":1160000,"July 2026":1180000,"August 2026":1240000,"September 2026":1275000},"varianceVsPrevious":35000,"varianceVsPreviousPct":2.8,"varianceVsBase":155000,"varianceVsBasePct":13.8,"monthlyAverage":1185833,"varianceRemarks":"Increment for 2 senior engineering hires and quarterly PF/ESI re-benchmarking"},{"id":"exp-cloud","particulars":"Cloud Computing, AI Model Inference & Hosting Infrastructure","noteRef":"Note 25","currentMonth":350000,"previousMonth":365000,"ytdCurrentYear":2295000,"momGrowthPct":-4.1,"pctOfRevenue":6.7,"monthlyBreakdown":{"April 2026":410000,"May 2026":395000,"June 2026":385000,"July 2026":390000,"August 2026":365000,"September 2026":350000},"varianceVsPrevious":-15000,"varianceVsPreviousPct":-4.1,"varianceVsBase":-60000,"varianceVsBasePct":-14.6,"monthlyAverage":382500,"varianceRemarks":"Favorable variance: 3-year compute savings plan locked on AWS reducing unit egress cost"},{"id":"exp-mktg","particulars":"Sales Promotion, Digital Marketing & Enterprise Conferences","noteRef":"Note 26","currentMonth":340000,"previousMonth":322000,"ytdCurrentYear":1807000,"momGrowthPct":5.6,"pctOfRevenue":6.5,"monthlyBreakdown":{"April 2026":260000,"May 2026":280000,"June 2026":310000,"July 2026":295000,"August 2026":322000,"September 2026":340000},"varianceVsPrevious":18000,"varianceVsPreviousPct":5.6,"varianceVsBase":80000,"varianceVsBasePct":30.8,"monthlyAverage":301167,"varianceRemarks":"Q2 end pipeline push for enterprise client conversion"},{"id":"exp-admin","particulars":"Administrative, Rent, Legal & Virtual CFO Compliance Retainership","noteRef":"Note 27","currentMonth":245000,"previousMonth":240700,"ytdCurrentYear":1405700,"momGrowthPct":1.8,"pctOfRevenue":4.7,"monthlyBreakdown":{"April 2026":225000,"May 2026":228000,"June 2026":235000,"July 2026":232000,"August 2026":240700,"September 2026":245000},"varianceVsPrevious":4300,"varianceVsPreviousPct":1.8,"varianceVsBase":20000,"varianceVsBasePct":8.9,"monthlyAverage":234283,"varianceRemarks":"Includes Virtual CFO retainership, ROC secretarial audits, statutory licenses"},{"id":"ebitda-sub","particulars":"II. Operating EBITDA (Operational Profitability)","currentMonth":1420000,"previousMonth":1140000,"ytdCurrentYear":6352000,"momGrowthPct":24.6,"pctOfRevenue":27.1,"isSubtotal":true,"monthlyBreakdown":{"April 2026":850000,"May 2026":967000,"June 2026":1055000,"July 2026":920000,"August 2026":1140000,"September 2026":1420000},"varianceVsPrevious":280000,"varianceVsPreviousPct":24.6,"varianceVsBase":570000,"varianceVsBasePct":67.1,"monthlyAverage":1058667,"varianceRemarks":"Operating leverage kicking in as top-line rose 8% while opex grew only 2.3%"},{"id":"exp-depr","particulars":"Depreciation & Amortization Expense (PPE & Intangibles)","noteRef":"Note 11","currentMonth":125000,"previousMonth":125000,"ytdCurrentYear":735000,"momGrowthPct":0,"pctOfRevenue":2.4,"monthlyBreakdown":{"April 2026":120000,"May 2026":122000,"June 2026":123000,"July 2026":120000,"August 2026":125000,"September 2026":125000},"varianceVsPrevious":0,"varianceVsPreviousPct":0,"varianceVsBase":5000,"varianceVsBasePct":4.2,"monthlyAverage":122500},{"id":"exp-fin","particulars":"Finance Costs (Bank Loan Interest & Processing Charges)","noteRef":"Note 28","currentMonth":92000,"previousMonth":95000,"ytdCurrentYear":587000,"momGrowthPct":-3.2,"pctOfRevenue":1.8,"monthlyBreakdown":{"April 2026":105000,"May 2026":102000,"June 2026":100000,"July 2026":98000,"August 2026":95000,"September 2026":92000},"varianceVsPrevious":-3000,"varianceVsPreviousPct":-3.2,"varianceVsBase":-13000,"varianceVsBasePct":-12.4,"monthlyAverage":97833,"varianceRemarks":"Principal amortization of term loan lowering interest burden month over month"},{"id":"pbt-total","particulars":"III. Profit Before Tax (PBT)","currentMonth":1348000,"previousMonth":1055000,"ytdCurrentYear":5747000,"momGrowthPct":27.8,"pctOfRevenue":25.7,"isSubtotal":true,"monthlyBreakdown":{"April 2026":720000,"May 2026":853000,"June 2026":957000,"July 2026":814000,"August 2026":1055000,"September 2026":1348000},"varianceVsPrevious":293000,"varianceVsPreviousPct":27.8,"varianceVsBase":628000,"varianceVsBasePct":87.2,"monthlyAverage":957833},{"id":"tax-exp","particulars":"Current Tax Expense (Corporate Advance Tax Provision)","noteRef":"Note 29","currentMonth":242000,"previousMonth":190000,"ytdCurrentYear":1040000,"momGrowthPct":27.4,"pctOfRevenue":4.6,"monthlyBreakdown":{"April 2026":135000,"May 2026":155000,"June 2026":172000,"July 2026":146000,"August 2026":190000,"September 2026":242000},"varianceVsPrevious":52000,"varianceVsPreviousPct":27.4,"varianceVsBase":107000,"varianceVsBasePct":79.3,"monthlyAverage":173333,"varianceRemarks":"Quarterly advance tax provision matched to Sec 115BAA corporate tax requirements"},{"id":"pat-final","particulars":"IV. Profit After Tax - PAT (Net Margin Bottom-Line)","currentMonth":1106000,"previousMonth":865000,"ytdCurrentYear":4707000,"momGrowthPct":27.9,"pctOfRevenue":21.1,"isTotal":true,"monthlyBreakdown":{"April 2026":585000,"May 2026":698000,"June 2026":785000,"July 2026":668000,"August 2026":865000,"September 2026":1106000},"varianceVsPrevious":241000,"varianceVsPreviousPct":27.9,"varianceVsBase":521000,"varianceVsBasePct":89.1,"monthlyAverage":784500,"varianceRemarks":"Net profit crossed ₹11 Lakhs milestone; net margin of 21.1% vs 14.2% in April"}]},"debtorAgeing":{"asOfDate":"31 August 2026","totalReceivables":3800000,"daysSalesOutstanding":38,"overduePercentage":27.2,"provisionForBadDebts":120000,"buckets":{"days0to30":{"amount":2450000,"percentage":64.5,"count":19},"days31to60":{"amount":930000,"percentage":24.5,"count":8},"days61to90":{"amount":240000,"percentage":6.3,"count":2},"days91to180":{"amount":180000,"percentage":4.7,"count":2},"daysAbove180":{"amount":0,"percentage":0,"count":0}},"topDebtors":[{"id":"deb-103-1","customerName":"Apollo Hospitals Enterprise Ltd","entityType":"Hospital Network","gstin":"33AAAAP0812F1Z4","creditPeriodDays":30,"totalOutstanding":1450000,"bucket0to30":1150000,"bucket31to60":300000,"bucket61to90":0,"bucket91to180":0,"bucketAbove180":0,"lastPaymentDate":"2026-08-20","lastPaymentAmount":900000,"dsoDays":31,"riskRating":"Low","status":"Current","followUpNotes":"Diagnostic assay kits supply on 30-day revolving credit.","assignedManager":"Pooja Sharma"}]},"fundFlow":{"period":"August 2026 (Month-End Flow)","sources":{"fundsFromOperations":810000,"issueOfShareCapital":0,"longTermBorrowingsRaised":0,"saleOfFixedAssets":0,"totalSources":810000},"applications":{"purchaseOfFixedAssets":210000,"repaymentOfLongTermBorrowings":0,"paymentOfTaxAndAdvanceTax":120000,"paymentOfDividendsOrDrawings":0,"increaseInWorkingCapital":480000,"totalApplications":810000},"netMovementOfFunds":480000,"openingCashAndBank":9020000,"closingCashAndBank":9500000,"workingCapitalSchedule":{"totalCurrentAssetsPrevious":49450000,"totalCurrentAssetsCurrent":50560000,"totalCurrentLiabilitiesPrevious":11755000,"totalCurrentLiabilitiesCurrent":12210000,"workingCapitalPrevious":37695000,"workingCapitalCurrent":38350000,"netChangeInWorkingCapital":655000,"netChangeType":"Increase","items":[{"id":"wc-1","particulars":"Inventories & Spares","category":"Current Asset","previousPeriod":1280000,"currentPeriod":1460000,"effect":"Increase in Working Capital","effectAmount":180000},{"id":"wc-2","particulars":"Trade Receivables (Debtors)","category":"Current Asset","previousPeriod":5850000,"currentPeriod":6240000,"effect":"Increase in Working Capital","effectAmount":390000},{"id":"wc-3","particulars":"Cash & Bank Balances (Liquid Funds)","category":"Current Asset","previousPeriod":13595000,"currentPeriod":14250000,"effect":"Increase in Working Capital","effectAmount":655000},{"id":"wc-4","particulars":"Short-term Advances & GST ITC Balance","category":"Current Asset","previousPeriod":4525000,"currentPeriod":4350000,"effect":"Decrease in Working Capital","effectAmount":-175000},{"id":"wc-5","particulars":"Trade Payables (Vendor Creditors & MSME)","category":"Current Liability","previousPeriod":3120000,"currentPeriod":3410000,"effect":"Decrease in Working Capital","effectAmount":-290000},{"id":"wc-6","particulars":"Other Current Statutory Liabilities & Provisions","category":"Current Liability","previousPeriod":4135000,"currentPeriod":4300000,"effect":"Decrease in Working Capital","effectAmount":-165000}]}},"threeMonthCashBudget":{"companyId":"client-101","months":["October 2026","November 2026","December 2026"],"startingCashBalance":950000,"minimumSafeBuffer":500000,"sanctionedODLimit":1500000,"weeks":[{"id":"w1","weekNumber":1,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 1","dateRange":"Oct 01 - Oct 07","isActualsClosed":true,"closedAt":"2026-10-07T18:00:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w2","weekNumber":2,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 2","dateRange":"Oct 08 - Oct 14","isActualsClosed":true,"closedAt":"2026-10-14T17:30:00Z","closedBy":"Kavita Sharma (Account Manager)"},{"id":"w3","weekNumber":3,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 3","dateRange":"Oct 15 - Oct 21","isActualsClosed":false},{"id":"w4","weekNumber":4,"monthIndex":0,"monthName":"October 2026","weekLabel":"Week 4","dateRange":"Oct 22 - Oct 31","isActualsClosed":false},{"id":"w5","weekNumber":5,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 5","dateRange":"Nov 01 - Nov 07","isActualsClosed":false},{"id":"w6","weekNumber":6,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 6","dateRange":"Nov 08 - Nov 14","isActualsClosed":false},{"id":"w7","weekNumber":7,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 7","dateRange":"Nov 15 - Nov 21","isActualsClosed":false},{"id":"w8","weekNumber":8,"monthIndex":1,"monthName":"November 2026","weekLabel":"Week 8","dateRange":"Nov 22 - Nov 30","isActualsClosed":false},{"id":"w9","weekNumber":9,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 9","dateRange":"Dec 01 - Dec 07","isActualsClosed":false},{"id":"w10","weekNumber":10,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 10","dateRange":"Dec 08 - Dec 14","isActualsClosed":false},{"id":"w11","weekNumber":11,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 11","dateRange":"Dec 15 - Dec 21","isActualsClosed":false},{"id":"w12","weekNumber":12,"monthIndex":2,"monthName":"December 2026","weekLabel":"Week 12","dateRange":"Dec 22 - Dec 31","isActualsClosed":false}],"items":[{"id":"cf-in-01","category":"inflow","section":"collections","name":"Collections: Domestic Enterprise Clients","weekly":{"w1":{"budget":1350000,"actual":1280000,"notes":"Apex Retail paid ₹4.8L; ₹70k delayed to W2"},"w2":{"budget":1450000,"actual":1520000,"notes":"Received delayed invoice + regular cycle"},"w3":{"budget":1200000,"actual":950000,"notes":"Pending collection from Reliance Retail ₹2.5L"},"w4":{"budget":1600000},"w5":{"budget":1400000},"w6":{"budget":1500000},"w7":{"budget":1350000},"w8":{"budget":1650000},"w9":{"budget":1450000},"w10":{"budget":1550000},"w11":{"budget":1400000},"w12":{"budget":1750000}}},{"id":"cf-in-02","category":"inflow","section":"collections","name":"Collections: Export Clients & USD Remittances","weekly":{"w1":{"budget":300000,"actual":310000,"notes":"USD 3,700 received via Citi EEFC"},"w2":{"budget":250000,"actual":265000},"w3":{"budget":350000,"actual":350000},"w4":{"budget":300000},"w5":{"budget":320000},"w6":{"budget":280000},"w7":{"budget":350000},"w8":{"budget":300000},"w9":{"budget":330000},"w10":{"budget":290000},"w11":{"budget":360000},"w12":{"budget":320000}}},{"id":"cf-in-03","category":"inflow","section":"direct_sales","name":"Direct SaaS Subscriptions & Self-Serve Gateway","weekly":{"w1":{"budget":120000,"actual":128000},"w2":{"budget":110000,"actual":115000},"w3":{"budget":130000,"actual":130000},"w4":{"budget":140000},"w5":{"budget":125000},"w6":{"budget":115000},"w7":{"budget":135000},"w8":{"budget":145000},"w9":{"budget":130000},"w10":{"budget":120000},"w11":{"budget":140000},"w12":{"budget":150000}}},{"id":"cf-in-04","category":"inflow","section":"statutory_refunds","name":"Statutory Refunds & RoDTEP Export Incentives","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":120000,"actual":0,"notes":"GST refund credited to bank delayed by Dept"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":180000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-in-05","category":"inflow","section":"financing_inflow","name":"Bank OD Draw / Inter-Corporate Deposit Payout","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-01","category":"outflow","section":"supplier_payments","name":"MSME Priority Vendor Payments (Sec 43B(h) <45d)","weekly":{"w1":{"budget":320000,"actual":325000,"notes":"Paid 3 MSME suppliers before due date"},"w2":{"budget":280000,"actual":290000},"w3":{"budget":420000,"actual":420000,"notes":"Critical micro suppliers invoice due on Oct 19"},"w4":{"budget":350000},"w5":{"budget":310000},"w6":{"budget":270000},"w7":{"budget":410000},"w8":{"budget":340000},"w9":{"budget":330000},"w10":{"budget":280000},"w11":{"budget":430000},"w12":{"budget":360000}}},{"id":"cf-out-02","category":"outflow","section":"supplier_payments","name":"General Trade Creditors & Material Suppliers","weekly":{"w1":{"budget":450000,"actual":420000,"notes":"Negotiated 7-day payment extension"},"w2":{"budget":520000,"actual":540000},"w3":{"budget":480000,"actual":480000},"w4":{"budget":510000},"w5":{"budget":460000},"w6":{"budget":500000},"w7":{"budget":490000},"w8":{"budget":530000},"w9":{"budget":470000},"w10":{"budget":510000},"w11":{"budget":500000},"w12":{"budget":550000}}},{"id":"cf-out-03","category":"outflow","section":"payroll","name":"Employee Salaries, Wages & Health Insurance","weekly":{"w1":{"budget":2350000,"actual":2340000,"notes":"Disbursed on Oct 03 via ICICI batch"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":2400000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":2420000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-04","category":"outflow","section":"payroll","name":"Contractor Retainers & Freelance Developers","weekly":{"w1":{"budget":180000,"actual":175000},"w2":{"budget":120000,"actual":130000},"w3":{"budget":90000,"actual":90000},"w4":{"budget":80000},"w5":{"budget":190000},"w6":{"budget":110000},"w7":{"budget":85000},"w8":{"budget":80000},"w9":{"budget":195000},"w10":{"budget":115000},"w11":{"budget":90000},"w12":{"budget":85000}}},{"id":"cf-out-05","category":"outflow","section":"statutory_dues","name":"GST Monthly Discharge (GSTR-3B by 20th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":680000,"actual":680000,"notes":"Statutory mandatory GST cash ledger payment"},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":710000},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":730000},"w12":{"budget":0}}},{"id":"cf-out-06","category":"outflow","section":"statutory_dues","name":"TDS / TCS Challan Payment (by 7th)","weekly":{"w1":{"budget":195000,"actual":195000,"notes":"Challan 281 cleared on Oct 06"},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":205000},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":210000},"w10":{"budget":0},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-07","category":"outflow","section":"statutory_dues","name":"PF & ESIC Statutory Remittance (by 15th)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":145000,"actual":142000,"notes":"EPFO electronic challan paid"},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":155000},"w11":{"budget":0},"w12":{"budget":0}}},{"id":"cf-out-08","category":"outflow","section":"statutory_dues","name":"Advance Corporate Income Tax (Q3 Due 15th Dec)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":0,"actual":0},"w4":{"budget":0},"w5":{"budget":0},"w6":{"budget":0},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":0},"w11":{"budget":450000},"w12":{"budget":0}}},{"id":"cf-out-09","category":"outflow","section":"operating_overheads","name":"Cloud Infrastructure (AWS / Azure) & Software","weekly":{"w1":{"budget":80000,"actual":82000},"w2":{"budget":60000,"actual":58000},"w3":{"budget":240000,"actual":240000,"notes":"Monthly AWS billing debit on Oct 18"},"w4":{"budget":50000},"w5":{"budget":80000},"w6":{"budget":60000},"w7":{"budget":250000},"w8":{"budget":50000},"w9":{"budget":85000},"w10":{"budget":65000},"w11":{"budget":260000},"w12":{"budget":55000}}},{"id":"cf-out-10","category":"outflow","section":"operating_overheads","name":"Office Rent, Utilities & Administrative Overheads","weekly":{"w1":{"budget":210000,"actual":210000,"notes":"Office lease rent cleared"},"w2":{"budget":70000,"actual":68000},"w3":{"budget":65000,"actual":65000},"w4":{"budget":90000},"w5":{"budget":215000},"w6":{"budget":70000},"w7":{"budget":65000},"w8":{"budget":95000},"w9":{"budget":220000},"w10":{"budget":75000},"w11":{"budget":70000},"w12":{"budget":100000}}},{"id":"cf-out-11","category":"outflow","section":"finance_costs","name":"Bank Term Loan EMI & Working Capital Interest","weekly":{"w1":{"budget":125000,"actual":125000,"notes":"HDFC Term Loan auto-debit on 5th"},"w2":{"budget":0,"actual":0},"w3":{"budget":45000,"actual":45000,"notes":"OD limit interest charge"},"w4":{"budget":0},"w5":{"budget":125000},"w6":{"budget":0},"w7":{"budget":45000},"w8":{"budget":0},"w9":{"budget":125000},"w10":{"budget":0},"w11":{"budget":50000},"w12":{"budget":0}}},{"id":"cf-out-12","category":"outflow","section":"capex","name":"Capital Expenditure (IT Equipment & Servers)","weekly":{"w1":{"budget":0,"actual":0},"w2":{"budget":0,"actual":0},"w3":{"budget":180000,"actual":0,"notes":"Management deferring server acquisition"},"w4":{"budget":120000},"w5":{"budget":0},"w6":{"budget":150000},"w7":{"budget":0},"w8":{"budget":0},"w9":{"budget":0},"w10":{"budget":120000},"w11":{"budget":0},"w12":{"budget":0}}}],"shortageActions":[{"id":"act-01","weekId":"w3","title":"Accelerate collections from Apex Retail & Reliance Infocomm","impactAmount":350000,"type":"accelerate_receivables","status":"approved","notes":"Account manager confirmed client will clear ₹3.5L by Oct 18 before GST run."},{"id":"act-02","weekId":"w3","title":"Defer GPU Server Capex to Week 6","impactAmount":180000,"type":"defer_capex","status":"executed","notes":"Approved by CFO to conserve liquid liquidity during statutory GST week."},{"id":"act-03","weekId":"w7","title":"Pre-arranged drawdown of HDFC CC/OD limit (₹5L cushion)","impactAmount":400000,"type":"draw_od","status":"proposed","notes":"Standby buffer if November mid-month export collection experiences banking delay."}],"lastUpdated":"2026-10-16T10:45:00Z","updatedBy":"Kavita Sharma (Account Manager)"}}'::jsonb,
  'approved',
  'ad384b5d-7461-44fe-8625-a68affc52c04'
)
ON CONFLICT (id) DO UPDATE SET
  rows = EXCLUDED.rows,
  status = EXCLUDED.status,
  uploaded_by = EXCLUDED.uploaded_by;

-- =========================================================
-- DATA MIGRATION: 9. MIS Remarks & Annotations
-- =========================================================
INSERT INTO public.mis_remarks (id, company_id, page_key, line_ref, period, reason_category, remark, author_id, author_name, author_role, cfo_response, cfo_response_at)
VALUES (
  '82645b8f-0667-40f1-8e86-3224a506689b',
  'client-101',
  NULL,
  '',
  'August 2026',
  'General',
  NULL,
  '5f4f62a6-62fa-419b-8abb-e24cbffd2bcf',
  'Pooja Sharma (Client Finance)',
  'undefined'::public.app_role,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  remark = EXCLUDED.remark,
  cfo_response = EXCLUDED.cfo_response;

INSERT INTO public.mis_remarks (id, company_id, page_key, line_ref, period, reason_category, remark, author_id, author_name, author_role, cfo_response, cfo_response_at)
VALUES (
  '81b54b9f-2091-4323-8532-298e343229e6',
  'client-101',
  NULL,
  '',
  'August 2026',
  'General',
  NULL,
  '5f4f62a6-62fa-419b-8abb-e24cbffd2bcf',
  'Pooja Sharma (Client Finance)',
  'undefined'::public.app_role,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  remark = EXCLUDED.remark,
  cfo_response = EXCLUDED.cfo_response;

INSERT INTO public.mis_remarks (id, company_id, page_key, line_ref, period, reason_category, remark, author_id, author_name, author_role, cfo_response, cfo_response_at)
VALUES (
  '02eafd72-f9f4-491c-9cb6-9c00708e2bbf',
  'client-101',
  NULL,
  '',
  'August 2026',
  'General',
  NULL,
  '5f4f62a6-62fa-419b-8abb-e24cbffd2bcf',
  'Anand Verma (Director)',
  'undefined'::public.app_role,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  remark = EXCLUDED.remark,
  cfo_response = EXCLUDED.cfo_response;

INSERT INTO public.mis_remarks (id, company_id, page_key, line_ref, period, reason_category, remark, author_id, author_name, author_role, cfo_response, cfo_response_at)
VALUES (
  '21d0341b-b210-4213-a366-b9c13f8523b5',
  'client-101',
  NULL,
  '',
  'August 2026',
  'General',
  NULL,
  '5f4f62a6-62fa-419b-8abb-e24cbffd2bcf',
  'Pooja Sharma (Client Finance)',
  'undefined'::public.app_role,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  remark = EXCLUDED.remark,
  cfo_response = EXCLUDED.cfo_response;

-- =========================================================
-- DATA MIGRATION: 10. Audit Logs
-- =========================================================
INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  '95d3a53d-e36d-4978-af2e-f717bb17d957',
  NULL,
  NULL,
  'USER_LOGIN',
  NULL,
  NULL,
  'client-101',
  '"Authenticated via Practice SSO into Virtual CFO Portfolio Dashboard."'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  '270e6596-a26c-4939-b94c-748d7701a462',
  NULL,
  NULL,
  'EXCEL_UPLOAD_MIS',
  NULL,
  NULL,
  'client-101',
  '"Uploaded August 2026 Trial Balance & MIS data in decided template (32 metric rows parsed)."'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  '039ada9e-f9d1-4999-8964-22bd07af58a5',
  NULL,
  NULL,
  'COMPLIANCE_APPROVED',
  NULL,
  NULL,
  'client-101',
  '"Approved Stage 2 (CFO Review) for GSTR-3B monthly filing & payment authorization."'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  '62cd66a5-ac64-4d76-8ebf-7f2f50e08ca6',
  NULL,
  NULL,
  'SECURITY_PROTOCOL_CHANGED',
  NULL,
  NULL,
  'client-101',
  '"Enforced strict single-company client isolation and locked July 2026 historical books."'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_log (id, actor_id, actor_email, action, entity, entity_id, company_id, details)
VALUES (
  'a4a1e2a2-2ade-418d-880d-8567a3565da6',
  NULL,
  NULL,
  'REMARK_ADDED',
  NULL,
  NULL,
  'client-101',
  '"Logged variance explanation note for Tech & Cloud Infrastructure cost overrun (+14.2%)."'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- DATA MIGRATION: 11. Security Protocols & Role Permissions
-- =========================================================
INSERT INTO public.security_protocols (id, mfa_required, session_timeout_minutes, password_min_length, require_special_char, require_number, require_uppercase, password_rotation_days, ip_whitelisting_enabled, whitelisted_ips)
VALUES (
  'default',
  FALSE,
  60,
  8,
  FALSE,
  FALSE,
  FALSE,
  90,
  FALSE,
  ARRAY['192.168.1.0/24', '103.21.244.0/22']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  mfa_required = EXCLUDED.mfa_required,
  session_timeout_minutes = EXCLUDED.session_timeout_minutes,
  password_min_length = EXCLUDED.password_min_length;

INSERT INTO public.role_permissions (role, permissions)
VALUES (
  'cfo'::public.app_role,
  '{"mis":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":true,"canApprove":true},"budget":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":true,"canApprove":true},"compliances":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":true,"canApprove":true},"actions":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":true,"canApprove":true},"companies":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":true,"canApprove":true}}'::jsonb
)
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();

INSERT INTO public.role_permissions (role, permissions)
VALUES (
  'client_team'::public.app_role,
  '{"mis":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":false,"canApprove":false},"budget":{"canView":true,"canEdit":true,"canUploadExcel":true,"canDelete":false,"canApprove":false},"compliances":{"canView":true,"canEdit":true,"canUploadExcel":false,"canDelete":false,"canApprove":false},"actions":{"canView":true,"canEdit":true,"canUploadExcel":false,"canDelete":false,"canApprove":false},"companies":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false}}'::jsonb
)
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();

INSERT INTO public.role_permissions (role, permissions)
VALUES (
  'client'::public.app_role,
  '{"mis":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false},"budget":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false},"compliances":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false},"actions":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false},"companies":{"canView":true,"canEdit":false,"canUploadExcel":false,"canDelete":false,"canApprove":false}}'::jsonb
)
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Re-enable triggers
DO $$ BEGIN
  ALTER TABLE public.mis_remarks ENABLE TRIGGER ALL;
  ALTER TABLE public.mis_uploads ENABLE TRIGGER ALL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMIT;
