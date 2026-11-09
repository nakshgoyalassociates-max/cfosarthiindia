-- Seed Script: Virtual CFO Suite Demo / Initial Companies & Data
-- Run this script against your Supabase / PostgreSQL database to populate demo data.

insert into public.companies (id, company_name, legal_entity, gstin, pan, cin, sector, financial_year, cfo_name, cfo_firm, is_active) values
  ('client-101', 'Nexora Innovations Technologies Pvt Ltd', 'Private Limited Company', '27AAACN4921E1ZQ', 'AAACN4921E', 'U72900MH2019PTC123456', 'Technology / SaaS', 'FY 2026-27', 'Virtual CFO Practice', 'Virtual CFO Advisory', true),
  ('client-102', 'Apex Global Logistics Pvt Ltd', 'Private Limited Company', '27AAACA5512D1ZK', 'AAACA5512D', 'U63030MH2017PTC298765', 'Logistics & Transport', 'FY 2026-27', 'Virtual CFO Practice', 'Virtual CFO Advisory', true),
  ('client-103', 'Zenith HealthTech Pvt Ltd', 'Private Limited Company', '27AAACZ7781F1ZM', 'AAACZ7781F', 'U85100MH2020PTC334455', 'Healthcare Technology', 'FY 2026-27', 'Virtual CFO Practice', 'Virtual CFO Advisory', true)
on conflict (id) do update set
  company_name = excluded.company_name,
  legal_entity = excluded.legal_entity,
  gstin = excluded.gstin,
  pan = excluded.pan,
  cin = excluded.cin,
  sector = excluded.sector,
  financial_year = excluded.financial_year;

-- Default security protocols
insert into public.security_protocols (id, mfa_required, session_timeout_minutes, password_min_length, require_special_char, require_number, require_uppercase)
values ('default', false, 30, 8, true, true, true)
on conflict (id) do nothing;
