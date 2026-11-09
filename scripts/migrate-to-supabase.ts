import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { CLIENT_COMPANIES, DEFAULT_USERS, COMPANY_FINANCIAL_MIS } from '../src/data/mockInitialData';
import { ALL_COMPANIES_COMPLIANCES, ALL_COMPANIES_ACTIONS } from '../src/data/companyData';
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
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

interface TableResult {
  table: string;
  identified: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function runSupabaseMigration() {
  console.log('================================================================');
  console.log('SUPABASE DATA MIGRATION ENGINE');
  console.log('================================================================\n');

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const sqlFilePath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261105000000_schema_and_dummy_data_migration.sql'
  );

  const hasCredentials = Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('sandbox-preview')
  );

  console.log(`Supabase Endpoint: ${supabaseUrl ? supabaseUrl : '(Not set in environment)'}`);
  console.log(`API Key configured: ${supabaseKey ? 'YES' : 'NO'}`);
  console.log(`Migration SQL file ready: ${fs.existsSync(sqlFilePath) ? 'YES' : 'NO'}\n`);

  // Prepare records for migration
  const userUuidMap: Record<string, string> = {};
  DEFAULT_USERS.forEach((u) => {
    userUuidMap[u.id] = deterministicUuid(`user:${u.id}`);
  });

  const companiesData = CLIENT_COMPANIES.map((c) => ({
    id: c.id,
    company_name: c.companyName,
    legal_entity: c.legalEntity,
    gstin: c.gstin,
    pan: c.pan,
    cin: c.cin,
    sector: c.sector,
    financial_year: c.financialYear,
    cfo_name: c.cfoName || 'Virtual CFO',
    cfo_firm: c.cfoFirm || 'Virtual CFO Practice',
    is_active: true,
  }));

  const profilesData = DEFAULT_USERS.map((u) => ({
    id: userUuidMap[u.id],
    email: u.email,
    full_name: u.name,
    designation: u.roleTitle || u.role,
    is_active: true,
  }));

  const userRolesData = DEFAULT_USERS.map((u) => ({
    id: deterministicUuid(`role:${userUuidMap[u.id]}:${u.role}`),
    user_id: userUuidMap[u.id],
    role: u.role,
  }));

  const accessData: Array<{ id: string; user_id: string; company_id: string; can_edit: boolean }> = [];
  DEFAULT_USERS.forEach((u) => {
    const uuid = userUuidMap[u.id];
    if (u.companyId && u.companyId !== 'all') {
      accessData.push({
        id: deterministicUuid(`access:${uuid}:${u.companyId}`),
        user_id: uuid,
        company_id: u.companyId,
        can_edit: true,
      });
    } else if (u.companyId === 'all') {
      CLIENT_COMPANIES.forEach((comp) => {
        accessData.push({
          id: deterministicUuid(`access:${uuid}:${comp.id}`),
          user_id: uuid,
          company_id: comp.id,
          can_edit: true,
        });
      });
    }
  });

  const complianceData: Array<{
    id: string;
    company_id: string;
    category: string;
    status: string;
    data: any;
  }> = [];
  Object.entries(ALL_COMPANIES_COMPLIANCES).forEach(([companyId, items]) => {
    items.forEach((item) => {
      complianceData.push({
        id: deterministicUuid(`compliance:${companyId}:${item.id}`),
        company_id: companyId,
        category: item.category || 'Statutory',
        status: item.status || 'Pending',
        data: item,
      });
    });
  });

  const actionData: Array<{
    id: string;
    company_id: string;
    status: string;
    data: any;
  }> = [];
  Object.entries(ALL_COMPANIES_ACTIONS).forEach(([companyId, actions]) => {
    actions.forEach((act) => {
      actionData.push({
        id: deterministicUuid(`action:${companyId}:${act.id}`),
        company_id: companyId,
        status: act.status || 'Pending',
        data: act,
      });
    });
  });

  const repoMattersData: Array<{
    id: string;
    company_id: string;
    matter_type: string;
    data: any;
  }> = [];
  MOCK_TAX_ASSESSMENTS.forEach((i) =>
    repoMattersData.push({
      id: deterministicUuid(`repo:${i.companyId || 'client-101'}:${i.id}`),
      company_id: i.companyId || 'client-101',
      matter_type: 'tax_assessment',
      data: i,
    })
  );
  MOCK_LEGAL_CASES.forEach((i) =>
    repoMattersData.push({
      id: deterministicUuid(`repo:${i.companyId || 'client-101'}:${i.id}`),
      company_id: i.companyId || 'client-101',
      matter_type: 'legal_case',
      data: i,
    })
  );
  MOCK_LICENSES.forEach((i) =>
    repoMattersData.push({
      id: deterministicUuid(`repo:${i.companyId || 'client-101'}:${i.id}`),
      company_id: i.companyId || 'client-101',
      matter_type: 'license_certification',
      data: i,
    })
  );
  MOCK_SOPS.forEach((i) =>
    repoMattersData.push({
      id: deterministicUuid(`repo:${i.companyId || 'client-101'}:${i.id}`),
      company_id: i.companyId || 'client-101',
      matter_type: 'sop',
      data: i,
    })
  );

  const budgetData = INITIAL_NEXORA_BUDGET_ITEMS.map((b) => ({
    id: deterministicUuid(`budget:client-101:${b.id}`),
    company_id: 'client-101',
    data: b,
  }));

  const reportsData: Array<{
    id: string;
    company_id: string;
    month_key: string;
    status: string;
    data: any;
  }> = [];
  Object.entries(INITIAL_EXECUTIVE_REPORTS).forEach(([companyId, reports]) => {
    reports.forEach((r) => {
      reportsData.push({
        id: deterministicUuid(`report:${companyId}:${r.id || r.monthKey}`),
        company_id: companyId,
        month_key: r.monthKey || '2026-08',
        status: r.status || 'published',
        data: r,
      });
    });
  });

  const defaultUploaderUuid = userUuidMap['user-naksh-goyal'] || userUuidMap['user-cfo'] || 'ad384b5d-7461-44fe-8625-a68affc52c04';
  const misUploadsData = Object.entries(COMPANY_FINANCIAL_MIS).map(([companyId, finMis]) => ({
    id: deterministicUuid(`mis:pnl:${companyId}`),
    company_id: companyId,
    statement_type: 'pnl',
    period: finMis.period,
    file_name: 'Tally_PnL_Consolidated_Aug2026.xlsx',
    row_count: (finMis.pnlStatement as any)?.rows?.length || 18,
    rows: finMis,
    status: 'approved',
    uploaded_by: defaultUploaderUuid,
  }));

  const misRemarksData = INITIAL_MIS_REMARKS.map((rem) => ({
    id: deterministicUuid(`remark:${rem.id}`),
    company_id: rem.companyId || 'client-101',
    page_key: rem.pageKey,
    line_ref: rem.lineRef || '',
    period: rem.period || 'August 2026',
    reason_category: rem.reasonCategory || 'General',
    remark: rem.remark,
    author_id: userUuidMap[rem.authorId] || deterministicUuid(`user:${rem.authorId}`),
    author_name: rem.authorName,
    author_role: rem.authorRole,
    cfo_response: rem.cfoResponse,
  }));

  const auditLogsData = INITIAL_AUDIT_LOGS.map((log) => ({
    id: deterministicUuid(`audit:${log.id}`),
    actor_id: log.actorId ? (userUuidMap[log.actorId] || deterministicUuid(`user:${log.actorId}`)) : null,
    actor_email: log.actorEmail,
    action: log.action,
    entity: log.entity,
    entity_id: log.entityId,
    company_id: log.companyId,
    details: log.details,
  }));

  const securityData = [
    {
      id: 'default',
      mfa_required: DEFAULT_SECURITY_PROTOCOLS.mfaRequired || false,
      session_timeout_minutes: DEFAULT_SECURITY_PROTOCOLS.sessionTimeoutMinutes || 30,
      password_min_length: DEFAULT_SECURITY_PROTOCOLS.passwordMinLength || 8,
      require_special_char: DEFAULT_SECURITY_PROTOCOLS.requireSpecialChar || true,
      require_number: DEFAULT_SECURITY_PROTOCOLS.requireNumber || true,
      require_uppercase: DEFAULT_SECURITY_PROTOCOLS.requireUppercase || true,
      password_rotation_days: DEFAULT_SECURITY_PROTOCOLS.passwordRotationDays || 90,
      ip_whitelisting_enabled: DEFAULT_SECURITY_PROTOCOLS.ipWhitelistingEnabled || false,
      whitelisted_ips: DEFAULT_SECURITY_PROTOCOLS.whitelistedIps || [],
    },
  ];

  const rolePermissionsData = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role, permissions]) => ({
    role,
    permissions,
  }));

  const migrationDatasets: Record<string, any[]> = {
    companies: companiesData,
    profiles: profilesData,
    user_roles: userRolesData,
    user_company_access: accessData,
    compliance_items: complianceData,
    action_items: actionData,
    repository_matters: repoMattersData,
    budget_items: budgetData,
    executive_reports: reportsData,
    mis_uploads: misUploadsData,
    mis_remarks: misRemarksData,
    audit_log: auditLogsData,
    security_protocols: securityData,
    role_permissions: rolePermissionsData,
  };

  const results: TableResult[] = [];

  if (hasCredentials) {
    console.log('Connecting to live Supabase project...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const [table, records] of Object.entries(migrationDatasets)) {
      const result: TableResult = {
        table,
        identified: records.length,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      try {
        // Upsert in batches of 50
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const { error } = await supabase.from(table).upsert(batch);
          if (error) {
            result.failed += batch.length;
            result.errors.push(error.message);
          } else {
            result.inserted += batch.length;
          }
        }
      } catch (err: any) {
        result.failed = records.length;
        result.errors.push(err.message || String(err));
      }

      results.push(result);
    }
  } else {
    // Report identified status and SQL migration readiness
    for (const [table, records] of Object.entries(migrationDatasets)) {
      results.push({
        table,
        identified: records.length,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      });
    }
  }

  console.log('\n================================================================');
  console.log('MIGRATION REPORT SUMMARY');
  console.log('================================================================');
  console.table(
    results.map((r) => ({
      Table: r.table,
      Identified: r.identified,
      'Live Inserted': r.inserted,
      'Live Failed': r.failed,
      Status: hasCredentials
        ? r.failed === 0
          ? 'SUCCESS'
          : 'PARTIAL / FAILED'
        : 'READY (SQL Migration File Prepared)',
    }))
  );

  const totalIdentified = results.reduce((acc, r) => acc + r.identified, 0);
  console.log(`\nTotal Records Extracted & Mapped: ${totalIdentified}`);
  console.log(`Migration SQL: ${sqlFilePath}`);
  console.log('================================================================\n');

  return { results, hasCredentials, sqlFilePath, totalIdentified };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSupabaseMigration().catch(console.error);
}
