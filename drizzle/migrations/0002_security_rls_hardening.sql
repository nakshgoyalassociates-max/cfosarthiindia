-- Migration 0002: Security & RLS Hardening for MIS Insights Hub / Virtual CFO Suite

-- 1. Security Protocols table (replaces vcfo_security_protocols_v1 in localStorage)
create table if not exists public.security_protocols (
  id text primary key default 'default',
  mfa_required boolean not null default false,
  session_timeout_minutes integer not null default 30,
  password_min_length integer not null default 8,
  require_special_char boolean not null default true,
  require_number boolean not null default true,
  require_uppercase boolean not null default true,
  password_rotation_days integer not null default 90,
  ip_whitelisting_enabled boolean not null default false,
  whitelisted_ips text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid
);

grant select on public.security_protocols to authenticated;
grant all on public.security_protocols to service_role;
alter table public.security_protocols enable row level security;

create policy "security_protocols read" on public.security_protocols
  for select to authenticated using (true);
create policy "security_protocols admin write" on public.security_protocols
  for all to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Insert initial default security protocols
insert into public.security_protocols (id, mfa_required, session_timeout_minutes, password_min_length, require_special_char, require_number, require_uppercase)
values ('default', false, 30, 8, true, true, true)
on conflict (id) do nothing;

-- 2. Role Permissions table (replaces vcfo_role_permissions_v1 in localStorage)
create table if not exists public.role_permissions (
  role public.app_role primary key,
  permissions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;
alter table public.role_permissions enable row level security;

create policy "role_permissions read" on public.role_permissions
  for select to authenticated using (true);
create policy "role_permissions admin write" on public.role_permissions
  for all to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 3. User Module Permissions table (replaces vcfo_user_permissions_v1 in localStorage)
create table if not exists public.user_module_permissions (
  user_id uuid primary key,
  preset text not null default 'view_and_edit',
  permissions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.user_module_permissions to authenticated;
grant all on public.user_module_permissions to service_role;
alter table public.user_module_permissions enable row level security;

create policy "user_module_permissions read self or admin" on public.user_module_permissions
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "user_module_permissions admin write" on public.user_module_permissions
  for all to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 4. Add deleted_at columns for soft-deletion
alter table public.compliance_items add column if not exists deleted_at timestamptz default null;
alter table public.action_items add column if not exists deleted_at timestamptz default null;
alter table public.budget_items add column if not exists deleted_at timestamptz default null;
alter table public.executive_reports add column if not exists deleted_at timestamptz default null;
alter table public.repository_matters add column if not exists deleted_at timestamptz default null;
alter table public.mis_uploads add column if not exists deleted_at timestamptz default null;

-- 5. Tighten DELETE policies to admin-only; editors soft-delete via update
drop policy if exists "compliance_items delete" on public.compliance_items;
create policy "compliance_items delete" on public.compliance_items
  for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "action_items delete" on public.action_items;
create policy "action_items delete" on public.action_items
  for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "budget_items delete" on public.budget_items;
create policy "budget_items delete" on public.budget_items
  for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "executive_reports delete" on public.executive_reports;
create policy "executive_reports delete" on public.executive_reports
  for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "repository_matters delete" on public.repository_matters;
create policy "repository_matters delete" on public.repository_matters
  for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "uploads delete" on public.mis_uploads;
create policy "uploads delete" on public.mis_uploads
  for delete to authenticated using (public.is_admin(auth.uid()));

-- 6. Update SELECT policies to respect deleted_at
drop policy if exists "compliance_items read" on public.compliance_items;
create policy "compliance_items read" on public.compliance_items
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

drop policy if exists "action_items read" on public.action_items;
create policy "action_items read" on public.action_items
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

drop policy if exists "budget_items read" on public.budget_items;
create policy "budget_items read" on public.budget_items
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

drop policy if exists "executive_reports read" on public.executive_reports;
create policy "executive_reports read" on public.executive_reports
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

drop policy if exists "repository_matters read" on public.repository_matters;
create policy "repository_matters read" on public.repository_matters
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

drop policy if exists "uploads read" on public.mis_uploads;
create policy "uploads read" on public.mis_uploads
  for select to authenticated
  using (public.can_view_company(auth.uid(), company_id) and (deleted_at is null or public.is_admin(auth.uid())));

-- 7. Profiles protection: users cannot change is_active or email, only admins can
create or replace function public.enforce_profile_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    new.email := old.email;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_rules on public.profiles;
create trigger trg_enforce_profile_rules
  before update on public.profiles
  for each row execute function public.enforce_profile_rules();

-- 8. Audit log protection: append-only, insert only via service_role/server functions
revoke insert on public.audit_log from authenticated;
drop policy if exists "audit insert" on public.audit_log;
revoke update, delete on public.audit_log from authenticated, service_role;

-- 9. mis_remarks protection:
-- (a) only admins may set cfo_response and author_role
-- (b) enforce author_role = caller's real role
create or replace function public.enforce_mis_remarks_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  caller_role public.app_role;
  caller_is_admin boolean;
begin
  caller_is_admin := public.is_admin(auth.uid());

  select role into caller_role
  from public.user_roles
  where user_id = auth.uid()
  order by case role when 'admin' then 1 when 'cfo' then 2 when 'client_team' then 3 else 4 end
  limit 1;

  if caller_role is null then
    caller_role := 'client';
  end if;

  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    if not caller_is_admin then
      new.author_role := caller_role;
      new.cfo_response := null;
      new.cfo_response_at := null;
    end if;
  elsif tg_op = 'UPDATE' then
    if not caller_is_admin then
      new.cfo_response := old.cfo_response;
      new.cfo_response_at := old.cfo_response_at;
      new.author_role := old.author_role;
      new.author_id := old.author_id;
    else
      if new.cfo_response is distinct from old.cfo_response and new.cfo_response is not null then
        new.cfo_response_at := now();
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_mis_remarks_rules on public.mis_remarks;
create trigger trg_enforce_mis_remarks_rules
  before insert or update on public.mis_remarks
  for each row execute function public.enforce_mis_remarks_rules();

-- 10. mis_uploads protection: block changes to company_id, reviewed_by, reviewed_at and review_note for non-admins
create or replace function public.enforce_mis_uploads_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    new.company_id := old.company_id;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_mis_uploads_rules on public.mis_uploads;
create trigger trg_enforce_mis_uploads_rules
  before update on public.mis_uploads
  for each row execute function public.enforce_mis_uploads_rules();
