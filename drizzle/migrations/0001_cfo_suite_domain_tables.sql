-- ===== 1. compliance_items =====
create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  category text not null default '',
  status text not null default 'Pending',
  created_by uuid,
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
grant select, insert, update, delete on public.compliance_items to authenticated;
grant all on public.compliance_items to service_role;
alter table public.compliance_items enable row level security;

create policy "compliance_items read" on public.compliance_items for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "compliance_items insert" on public.compliance_items for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "compliance_items update" on public.compliance_items for update to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "compliance_items delete" on public.compliance_items for delete to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));

-- ===== 2. action_items =====
create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  status text not null default 'Pending',
  assigned_to uuid,
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
grant select, insert, update, delete on public.action_items to authenticated;
grant all on public.action_items to service_role;
alter table public.action_items enable row level security;

create policy "action_items read" on public.action_items for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "action_items insert" on public.action_items for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "action_items update" on public.action_items for update to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "action_items delete" on public.action_items for delete to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));

-- ===== 3. budget_items =====
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
grant select, insert, update, delete on public.budget_items to authenticated;
grant all on public.budget_items to service_role;
alter table public.budget_items enable row level security;

create policy "budget_items read" on public.budget_items for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "budget_items insert" on public.budget_items for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "budget_items update" on public.budget_items for update to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "budget_items delete" on public.budget_items for delete to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));

-- ===== 4. executive_reports =====
create table public.executive_reports (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  month_key text not null default '',
  status text not null default 'published',
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
grant select, insert, update, delete on public.executive_reports to authenticated;
grant all on public.executive_reports to service_role;
alter table public.executive_reports enable row level security;

create policy "executive_reports read" on public.executive_reports for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "executive_reports insert" on public.executive_reports for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "executive_reports update" on public.executive_reports for update to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "executive_reports delete" on public.executive_reports for delete to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));

-- ===== 5. repository_matters =====
create table public.repository_matters (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  matter_type text not null default 'tax_assessment' check (matter_type in ('tax_assessment','legal_case','license_certification','sop')),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);
grant select, insert, update, delete on public.repository_matters to authenticated;
grant all on public.repository_matters to service_role;
alter table public.repository_matters enable row level security;

create policy "repository_matters read" on public.repository_matters for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "repository_matters insert" on public.repository_matters for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "repository_matters update" on public.repository_matters for update to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
create policy "repository_matters delete" on public.repository_matters for delete to authenticated
  using (public.can_edit_company(auth.uid(), company_id) or public.is_admin(auth.uid()));
