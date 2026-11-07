import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const client = read('src/lib/supabase.ts');
const policies = read('supabase/migrations/20261103_prepare_pulsar_rls.sql');

test('production client must use authenticated admin endpoints for writes', () => {
  assert.match(client, /adminApi\('\/api\/admin\/catalog/);
  assert.match(client, /adminApi\('\/api\/admin\/orders/);
  assert.match(client, /adminApi\('\/api\/admin\/settings/);
  assert.doesNotMatch(client, /client\.from\('(orders|products|kits|site_settings)'\)\s*\.(?:insert|upsert|update|delete)\(/);
});

test('production client may only query active public catalog, not private orders or settings', () => {
  assert.match(client, /\.from\('products'\)\s*\.select\('id,name,slug,/);
  assert.match(client, /\.from\('kits'\)\s*\.select\('\*'\)\s*\.eq\('is_active', true\)/);
  assert.match(client, /fetch\('\/api\/storefront\/settings'/);
  assert.doesNotMatch(client, /\.from\('(orders|site_settings)'\)/);
  const productSelect = client.match(/\.from\('products'\)\s*\.select\('([^']+)'\)/g) ?? [];
  assert.ok(productSelect.every(s => !s.includes('cost')), 'public product select must not expose cost');
});

test('RLS migration revokes browser private-table privileges and confines catalog to active rows', () => {
  for (const table of ['products', 'kits', 'orders', 'site_settings']) {
    assert.match(policies, new RegExp('ALTER TABLE public\\.' + table + ' ENABLE ROW LEVEL SECURITY', 'i'));
  }
  assert.match(policies, /REVOKE ALL PRIVILEGES ON TABLE/);
  assert.match(policies, /FROM PUBLIC, anon, authenticated;/);
  assert.match(policies, /GRANT SELECT \(/);
  assert.doesNotMatch(policies, /GRANT SELECT \([^;]*\bcost\b/);
  assert.match(policies, /USING \(is_active IS TRUE\)/);
  assert.match(policies, /DROP POLICY IF EXISTS "Gerenciamento completo pedidos"/);
});

test('public settings response includes only allowlisted properties', () => {
  const server = read('api/storefront/settings.ts');
  assert.match(server, /const publicFields = \[/);
  assert.doesNotMatch(server, /(?:'|")(?:melhor_envio_token|mercado_pago_access_token|supabase_service_role_key)(?:'|")/i);
  assert.match(server, /\.select\(\[\.\.\.publicFields\]\.join\(','\)\)/);
});
