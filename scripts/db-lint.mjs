/**
 * db-lint — verificaciones de esquema para Casa Lumen.
 *
 * Corre sin base de datos: valida convenciones de seguridad sobre los
 * archivos de supabase/migrations/*.sql:
 *   1. Toda tabla en public tiene ENABLE ROW LEVEL SECURITY.
 *   2. Toda policy declara roles con TO (nada de "to public" implícito).
 *   3. Funciones SECURITY DEFINER fijan search_path.
 *   4. Sin GRANT ALL sobre tablas public.
 *   5. Tablas sensibles (orders, payments, invoices, order_items, carts,
 *      cart_items, audit_logs) sin policies permisivas (using (true),
 *      with check (true) o FOR ALL) que el cliente pueda cumplir.
 *
 * Uso: npm run db:lint
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = resolve(ROOT, 'supabase/migrations');

const SENSITIVE = new Set([
  'orders',
  'order_items',
  'payments',
  'invoices',
  'carts',
  'cart_items',
  'audit_logs',
]);

const errors = [];
const warnings = [];

function withoutComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function tableNames(sql) {
  const names = new Set();
  const re = /create table (?:if not exists )?public\.([a-z_]+)/g;
  let m;
  while ((m = re.exec(sql)) !== null) names.add(m[1]);
  return names;
}

function rlsEnabled(sql) {
  const enabled = new Set();
  const re = /alter table (?:if exists )?public\.([a-z_]+)\s+enable row level security/gi;
  let m;
  while ((m = re.exec(sql)) !== null) enabled.add(m[1].toLowerCase());
  return enabled;
}

function checkPolicies(sql, file) {
  const policyRe = /create policy\s+"([^"]+)"\s+on\s+public\.([a-z_]+)([^;]+);/gis;
  let m;
  while ((m = policyRe.exec(sql)) !== null) {
    const [, name, table, rest] = m;
    if (!/\bto\b/i.test(rest)) {
      errors.push(`${file}: policy "${name}" sobre ${table} no declara roles con TO.`);
    }
    const sensitive = SENSITIVE.has(table);
    if (sensitive && /\bfor all\b/i.test(rest)) {
      errors.push(`${file}: policy "${name}" usa FOR ALL sobre tabla sensible ${table}.`);
    }
    if (sensitive && /using\s*\(\s*true\s*\)/i.test(rest)) {
      errors.push(`${file}: policy "${name}" usa USING (true) sobre tabla sensible ${table}.`);
    }
    if (sensitive && /with check\s*\(\s*true\s*\)/i.test(rest)) {
      errors.push(`${file}: policy "${name}" usa WITH CHECK (true) sobre tabla sensible ${table}.`);
    }
  }
}

function checkDefiner(sql, file) {
  const fnRe = /create (?:or replace )?function\s+([a-z_.]+)\s*\([^)]*\)\s*([\s\S]*?)(?=\$\$|\bas\b)/gis;
  let m;
  while ((m = fnRe.exec(sql)) !== null) {
    const [, name, attrs] = m;
    if (/security definer/i.test(attrs) && !/set search_path/i.test(attrs)) {
      errors.push(`${file}: función ${name} es SECURITY DEFINER sin search_path fijo.`);
    }
  }
}

let files;
try {
  files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
} catch {
  console.error('db-lint: no existe supabase/migrations/');
  process.exit(1);
}

if (files.length === 0) {
  console.error('db-lint: no hay migraciones que revisar.');
  process.exit(1);
}

for (const file of files) {
  const raw = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
  const sql = withoutComments(raw);

  const tables = tableNames(sql);
  const rls = rlsEnabled(sql);

  for (const t of tables) {
    if (!rls.has(t)) {
      errors.push(`${file}: tabla public.${t} sin ENABLE ROW LEVEL SECURITY.`);
    }
  }

  checkPolicies(sql, file);
  checkDefiner(sql, file);

  if (/grant all on public\./i.test(sql)) {
    errors.push(`${file}: GRANT ALL sobre tablas public. Usa grants por columna.`);
  }

  if (/\bdisable row level security\b/i.test(raw)) {
    errors.push(`${file}: se intenta desactivar RLS.`);
  }
}

for (const e of errors) console.error(`  ✗ ${e}`);
for (const w of warnings) console.warn(`  ⚠ ${w}`);

if (errors.length > 0) {
  console.error(`\ndb-lint: ${errors.length} problema(s). Corrígelos antes de aplicar.`);
  process.exit(1);
}

console.log(`db-lint: ${files.length} migración(es) sin problemas de esquema.`);
