import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../supabase/tests/live_anonymous_order_exposure_gate.sql',import.meta.url),'utf8');
test('anonymous order exposure gate is read-only and checks both private data and writes',()=>{
  const commands=sql.replace(/--[^\n]*/g,'').replace(/'(?:''|[^'])*'/g,\"''\").toUpperCase();
  assert.doesNotMatch(commands,/\b(?:UPDATE|DELETE FROM|INSERT INTO|DROP|ALTER|CREATE|GRANT|REVOKE|TRUNCATE)\b/);
  assert.match(sql,/has_table_privilege\('anon',oid,'SELECT'\)/);
  assert.match(sql,/has_table_privilege\('authenticated',oid,'SELECT'\)/);
  assert.match(sql,/has_table_privilege\('anon',oid,'INSERT,UPDATE,DELETE'\)/);
  assert.match(sql,/IN \('orders','site_settings'\)/);
  assert.match(sql,/NO_GO_PUBLIC_ACCESS/);
  assert.match(sql,/READY_FOR_NEXT_REVIEW/);
});
test('operator guidance retains explicit coordinated shared-database release checks',()=>{
  const s=readFileSync(new URL('../docs/rls-anonymous-orders-cutover-proof.md',import.meta.url),'utf8');
  assert.match(s,/ROLE anon/);
  assert.match(s,/backup restaurável/);
  assert.match(s,/Mercado Pago sandbox/);
  assert.match(s,/permission denied/);
  assert.match(s,/cron .*permanece inativo/);
});
