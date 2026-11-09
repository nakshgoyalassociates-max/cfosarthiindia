-- ===== enums =====
create type public.app_role as enum ('admin','cfo','client_team','client');

-- ===== profiles =====
create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text not null default '',
  designation text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ===== roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','cfo'));
$$;

-- ===== companies =====
create table public.companies (
  id text primary key,
  company_name text not null,
  legal_entity text not null default '',
  gstin text not null default '',
  pan text not null default '',
  cin text not null default '',
  sector text not null default '',
  financial_year text not null default 'FY 2026-27',
  cfo_name text not null default '',
  cfo_firm text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

-- ===== access rights =====
create table public.user_company_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id text not null references public.companies(id) on delete cascade,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);
grant select, insert, update, delete on public.user_company_access to authenticated;
grant all on public.user_company_access to service_role;
alter table public.user_company_access enable row level security;

create or replace function public.can_view_company(_user_id uuid, _company_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(_user_id)
      or exists (select 1 from public.user_company_access where user_id = _user_id and company_id = _company_id);
$$;

create or replace function public.can_edit_company(_user_id uuid, _company_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(_user_id)
      or exists (select 1 from public.user_company_access
                 where user_id = _user_id and company_id = _company_id and can_edit);
$$;

-- ===== MIS uploads =====
create table public.mis_uploads (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  statement_type text not null check (statement_type in ('pnl','balance_sheet','debtor_ageing','fund_flow','budget_actuals')),
  period text not null,
  file_name text not null default '',
  row_count integer not null default 0,
  rows jsonb not null default '[]'::jsonb,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  uploaded_by uuid not null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mis_uploads to authenticated;
grant all on public.mis_uploads to service_role;
alter table public.mis_uploads enable row level security;

-- ===== MIS remarks =====
create table public.mis_remarks (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  page_key text not null,
  line_ref text not null default '',
  period text not null default '',
  reason_category text not null default 'General',
  remark text not null,
  author_id uuid not null,
  author_name text not null default '',
  author_role public.app_role not null default 'client_team',
  cfo_response text,
  cfo_response_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mis_remarks to authenticated;
grant all on public.mis_remarks to service_role;
alter table public.mis_remarks enable row level security;

-- ===== audit log =====
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text not null default '',
  company_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

-- ===== policies =====
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "admin insert profile" on public.profiles for insert to authenticated
  with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "companies viewable" on public.companies for select to authenticated
  using (public.can_view_company(auth.uid(), id));
create policy "companies admin insert" on public.companies for insert to authenticated
  with check (public.is_admin(auth.uid()));
create policy "companies admin update" on public.companies for update to authenticated
  using (public.is_admin(auth.uid()));
create policy "companies admin delete" on public.companies for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "access self read" on public.user_company_access for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "access admin write" on public.user_company_access for insert to authenticated
  with check (public.is_admin(auth.uid()));
create policy "access admin update" on public.user_company_access for update to authenticated
  using (public.is_admin(auth.uid()));
create policy "access admin delete" on public.user_company_access for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "uploads read" on public.mis_uploads for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "uploads insert" on public.mis_uploads for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) and uploaded_by = auth.uid());
create policy "uploads update" on public.mis_uploads for update to authenticated
  using (public.is_admin(auth.uid()) or (uploaded_by = auth.uid() and status = 'submitted'));
create policy "uploads delete" on public.mis_uploads for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "remarks read" on public.mis_remarks for select to authenticated
  using (public.can_view_company(auth.uid(), company_id));
create policy "remarks insert" on public.mis_remarks for insert to authenticated
  with check (public.can_edit_company(auth.uid(), company_id) and author_id = auth.uid());
create policy "remarks update" on public.mis_remarks for update to authenticated
  using (public.is_admin(auth.uid()) or author_id = auth.uid());
create policy "remarks delete" on public.mis_remarks for delete to authenticated
  using (public.is_admin(auth.uid()) or author_id = auth.uid());

create policy "audit read admin" on public.audit_log for select to authenticated
  using (public.is_admin(auth.uid()));
create policy "audit insert" on public.audit_log for insert to authenticated
  with check (actor_id = auth.uid());

-- ===== new user handling: first user becomes admin+cfo =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  first_user boolean;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;

  select not exists (select 1 from public.user_roles) into first_user;
  if first_user then
    insert into public.user_roles (user_id, role) values (new.id,'admin'), (new.id,'cfo')
      on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id,'client')
      on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== seed companies matching the app data =====
insert into public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, cfo_name, cfo_firm) values
  ('client-101','Nexora Innovations Technologies Pvt Ltd','Private Limited Company','27AAACN4921E1ZQ','AAACN4921E','U72900MH2019PTC123456','Technology / SaaS','CA Manish Goyal, FCA, DISA','Goyal & Associates'),
  ('client-102','Apex Global Logistics Pvt Ltd','Private Limited Company','27AAACA5512D1ZK','AAACA5512D','U63030MH2017PTC298765','Logistics & Transport','CA Manish Goyal, FCA, DISA','Goyal & Associates'),
  ('client-103','Zenith HealthTech Pvt Ltd','Private Limited Company','27AAACZ7781F1ZM','AAACZ7781F','U85100MH2020PTC334455','Healthcare Technology','CA Manish Goyal, FCA, DISA','Goyal & Associates')
on conflict (id) do nothing;