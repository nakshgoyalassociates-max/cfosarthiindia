import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { COMPLIANCE_MASTER_LIST } from '../src/data/complianceMaster';
import { ALL_COMPANIES_COMPLIANCES } from '../src/data/companyData';

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

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const getActByCode = (id: string, category: string): string => {
  const lower = id.toLowerCase();
  if (lower.startsWith('gst-') || lower.startsWith('gst')) return 'Central Goods & Services Tax (CGST) Act, 2017 & Rules';
  if (lower.startsWith('tds-') || lower.startsWith('tds') || lower.startsWith('it-') || lower.startsWith('it')) {
    return 'Income Tax Act, 1961 & Rules';
  }
  if (lower.startsWith('roc-') || lower.startsWith('roc')) return 'Companies Act, 2013 & MCA Rules';
  if (lower.startsWith('pf-') || lower.startsWith('pf')) {
    if (lower.includes('esi')) return 'Employees State Insurance (ESI) Act, 1948';
    return 'Employees Provident Funds & Miscellaneous Provisions Act, 1952';
  }
  if (lower.startsWith('pt-') || lower.startsWith('pt')) {
    if (lower.includes('shop')) return 'State Shops & Commercial Establishments Act';
    if (lower.includes('lwf')) return 'State Labour Welfare Fund Act';
    return 'State Professional Tax (PT) Act';
  }
  return category;
};

const getPortalByCode = (id: string): string => {
  const lower = id.toLowerCase();
  if (lower.startsWith('gst')) return 'services.gst.gov.in';
  if (lower.startsWith('tds')) return 'tdscpc.gov.in (TRACES) & eportal.incometax.gov.in';
  if (lower.startsWith('it')) return 'eportal.incometax.gov.in';
  if (lower.startsWith('roc')) return 'mca.gov.in (V3 Portal)';
  if (lower.startsWith('pf')) {
    if (lower.includes('esi')) return 'esic.gov.in';
    return 'unifiedportal-emp.epfindia.gov.in';
  }
  if (lower.startsWith('pt')) return 'State Commercial Tax / Labour Portal';
  return 'Statutory Regulatory Portal';
};

export function generateAllComplianceCsvs() {
  const publicDir = path.resolve(process.cwd(), 'public/exports');
  const supabaseDir = path.resolve(process.cwd(), 'supabase');

  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(supabaseDir, { recursive: true });

  // =========================================================================
  // 1. COMPLIANCE MASTER CSV (for public.compliance_master) - 35 rows
  // =========================================================================
  const masterHeaders = [
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

  const masterRows: string[][] = COMPLIANCE_MASTER_LIST.map((c) => {
    const sub = c.subtasks || [];
    const stage1 = sub[0]?.title || 'Prepare basic records & sub-ledger reconciliation';
    const stage2 = sub[1]?.title || 'Virtual CFO / Senior Manager compliance audit and sign-off';
    const stage3 = sub[2]?.title || 'File statutory form on government portal & archive acknowledgement/challan';
    const code = c.id.toUpperCase();

    return [
      code,
      c.name,
      c.category,
      getActByCode(c.id, c.category),
      c.frequency,
      c.statutoryDueDate || 'Statutory Schedule',
      c.criticality || 'Medium',
      c.type || 'Return',
      c.applicability || 'All Registered Entities',
      c.penaltyClause || 'Statutory late fees & interest as per Act',
      getPortalByCode(c.id),
      stage1,
      stage2,
      stage3,
      'true',
    ];
  });

  const masterCsvContent = [
    masterHeaders.join(','),
    ...masterRows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  fs.writeFileSync(path.join(publicDir, 'compliance_master.csv'), masterCsvContent, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'compliance_master.csv'), masterCsvContent, 'utf-8');
  // Also keep general_statutory_compliance_master.csv as alias
  fs.writeFileSync(path.join(publicDir, 'general_statutory_compliance_master.csv'), masterCsvContent, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'general_statutory_compliance_master.csv'), masterCsvContent, 'utf-8');

  // =========================================================================
  // 2. COMPLIANCE ITEMS CSV (for public.compliance_items) - 105 rows
  // Matches expanded schema: id, company_id, category, status, code, compliance_name,
  // act_or_law, frequency, statutory_due_date_rule, criticality, form_type,
  // applicability, penalty_clause, governing_portal, stage_1_task, stage_2_task, stage_3_task, is_active, data
  // =========================================================================
  const itemsHeaders = [
    'id',
    'company_id',
    'category',
    'status',
    'code',
    'compliance_name',
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
    'data',
  ];

  const itemsRows: string[][] = [];

  for (const [companyId, items] of Object.entries(ALL_COMPANIES_COMPLIANCES)) {
    for (const item of items) {
      const itemUuid = deterministicUuid(`compliance:${companyId}:${item.id}`);
      const code = item.id.toUpperCase();
      const sub = item.subtasks || [];
      const stage1 = sub[0]?.title || '';
      const stage2 = sub[1]?.title || '';
      const stage3 = sub[2]?.title || '';

      itemsRows.push([
        itemUuid,
        companyId,
        item.category || 'Statutory',
        item.status || 'Pending',
        code,
        item.name || '',
        getActByCode(item.id, item.category),
        item.frequency || 'Monthly',
        item.statutoryDueDate || '',
        item.criticality || 'Medium',
        item.type || 'Return',
        item.applicability || '',
        item.penaltyClause || '',
        getPortalByCode(item.id),
        stage1,
        stage2,
        stage3,
        'true',
        JSON.stringify(item),
      ]);
    }
  }

  const itemsCsvContent = [
    itemsHeaders.join(','),
    ...itemsRows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  fs.writeFileSync(path.join(publicDir, 'compliance_items.csv'), itemsCsvContent, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'compliance_items.csv'), itemsCsvContent, 'utf-8');

  // =========================================================================
  // 3. COMPLIANCE ITEMS (5 Core Columns Format: id, company_id, category, status, data)
  // For standard/minimal compliance_items table
  // =========================================================================
  const coreHeaders = ['id', 'company_id', 'category', 'status', 'data'];
  const coreRows = itemsRows.map((r) => [r[0], r[1], r[2], r[3], r[18]]);
  const coreCsvContent = [
    coreHeaders.join(','),
    ...coreRows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  fs.writeFileSync(path.join(publicDir, 'compliance_items_core.csv'), coreCsvContent, 'utf-8');
  fs.writeFileSync(path.join(supabaseDir, 'compliance_items_core.csv'), coreCsvContent, 'utf-8');

  console.log('Successfully generated all compliance CSVs:');
  console.log(`1. compliance_master.csv (${masterRows.length} statutory template rows, 15 columns)`);
  console.log(`2. compliance_items.csv (${itemsRows.length} company rows across Nexora, Apex, Zenith, 19 columns)`);
  console.log(`3. compliance_items_core.csv (${coreRows.length} company rows, 5 core columns)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllComplianceCsvs();
}
