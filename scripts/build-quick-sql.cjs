const fs = require('fs');

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (let l of lines) {
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (inQuotes && l[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const masterRows = parseCSV(fs.readFileSync('public/exports/compliance_master.csv', 'utf8'));
const masterHeaders = masterRows[0];
const masterData = masterRows.slice(1);

const masterSqlTuples = masterData.map(r => {
  const escaped = r.map((val, idx) => {
    if (masterHeaders[idx] === 'is_active') return val === 'true' ? 'true' : 'false';
    return "'" + val.replace(/'/g, "''") + "'";
  });
  return '  (' + escaped.join(', ') + ')';
}).join(',\n');

const masterSql = `-- ==============================================================================
-- 1. CREATE AND POPULATE public.compliance_master (All 35 Statutory Compliances)
-- ==============================================================================
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
GRANT ALL ON public.compliance_master TO authenticated, service_role, anon;

INSERT INTO public.compliance_master (
  code, compliance_name, category, act_or_law, frequency, statutory_due_date_rule,
  criticality, form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active
) VALUES
${masterSqlTuples}
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
`;

// Now compliance_items
const itemsRows = parseCSV(fs.readFileSync('public/exports/compliance_items.csv', 'utf8'));
const itemHeaders = itemsRows[0];
const itemData = itemsRows.slice(1);

const itemSqlTuples = itemData.map(r => {
  const rowObj = {};
  itemHeaders.forEach((h, i) => { rowObj[h] = r[i]; });
  
  const id = rowObj.id;
  const company_id = rowObj.company_id;
  const category = rowObj.category || 'GST';
  const status = rowObj.status || 'Pending';
  const code = rowObj.code || '';
  const compliance_name = rowObj.compliance_name || '';
  const act_or_law = rowObj.act_or_law || '';
  const frequency = rowObj.frequency || 'Monthly';
  const statutory_due_date_rule = rowObj.statutory_due_date_rule || '';
  const criticality = rowObj.criticality || 'Medium';
  const form_type = rowObj.form_type || 'Return';
  const applicability = rowObj.applicability || '';
  const penalty_clause = rowObj.penalty_clause || '';
  const governing_portal = rowObj.governing_portal || '';
  const stage_1_task = rowObj.stage_1_task || '';
  const stage_2_task = rowObj.stage_2_task || '';
  const stage_3_task = rowObj.stage_3_task || '';
  const is_active = rowObj.is_active === 'false' ? 'false' : 'true';
  const dataJson = rowObj.data ? "'" + rowObj.data.replace(/'/g, "''") + "'::jsonb" : "'{}'::jsonb";

  return `  ('${id}', '${company_id}', '${category}', '${status}', '${code.replace(/'/g, "''")}', '${compliance_name.replace(/'/g, "''")}', '${act_or_law.replace(/'/g, "''")}', '${frequency}', '${statutory_due_date_rule.replace(/'/g, "''")}', '${criticality}', '${form_type}', '${applicability.replace(/'/g, "''")}', '${penalty_clause.replace(/'/g, "''")}', '${governing_portal.replace(/'/g, "''")}', '${stage_1_task.replace(/'/g, "''")}', '${stage_2_task.replace(/'/g, "''")}', '${stage_3_task.replace(/'/g, "''")}', ${is_active}, ${dataJson})`;
}).join(',\n');

const itemsSql = `
-- ==============================================================================
-- 2. CREATE AND POPULATE public.compliance_items (Company Tasks: 105 Rows)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.compliance_items (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  code text,
  compliance_name text,
  act_or_law text DEFAULT '',
  frequency text DEFAULT 'Monthly',
  statutory_due_date_rule text DEFAULT '',
  criticality text DEFAULT 'Medium',
  form_type text DEFAULT 'Return',
  applicability text DEFAULT '',
  penalty_clause text DEFAULT '',
  governing_portal text DEFAULT '',
  stage_1_task text DEFAULT '',
  stage_2_task text DEFAULT '',
  stage_3_task text DEFAULT '',
  is_active boolean DEFAULT true,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'compliance_items_select' AND tablename = 'compliance_items') THEN
    CREATE POLICY compliance_items_select ON public.compliance_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'compliance_items_write' AND tablename = 'compliance_items') THEN
    CREATE POLICY compliance_items_write ON public.compliance_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
GRANT ALL ON public.compliance_items TO authenticated, service_role, anon;

INSERT INTO public.compliance_items (
  id, company_id, category, status, code, compliance_name,
  act_or_law, frequency, statutory_due_date_rule, criticality,
  form_type, applicability, penalty_clause, governing_portal,
  stage_1_task, stage_2_task, stage_3_task, is_active, data
) VALUES
${itemSqlTuples}
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  code = EXCLUDED.code,
  compliance_name = EXCLUDED.compliance_name,
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
  is_active = EXCLUDED.is_active,
  data = EXCLUDED.data,
  updated_at = now();
`;

const combined = masterSql + itemsSql;

fs.writeFileSync('public/migrations/quick_populate_all_compliances.sql', combined);
fs.writeFileSync('supabase/migrations/20261107000200_quick_populate_all_compliances.sql', combined);
console.log('Successfully generated quick_populate_all_compliances.sql with bytes:', combined.length);
