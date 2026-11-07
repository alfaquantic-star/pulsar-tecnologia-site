import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('customer orders API requires verified user and server-owned UUID match', () => {
  const api = read('api/admin/orders.ts');
  const auth = read('api/_lib/admin-auth.ts');
  const query = read('api/_lib/customer-order-history.ts');
  assert.match(api, /verifyCustomerIdentity\(req\)/);
  assert.match(api, /req\.query\.scope === 'customer'/);
  assert.match(auth, /auth\.getUser\(token\)/);
  assert.match(auth, /email_confirmed_at/);
  assert.match(auth, /app_metadata\?\.role === 'admin'/);
  assert.match(api, /getCustomerOrdersByVerifiedId\(adminDatabase\(\), user\.id\)/);
  assert.match(query, /\.eq\('customer_id', verifiedAuthUserId\)/);
  assert.doesNotMatch(api, /\.eq\('customer_email'/);
  assert.doesNotMatch(api, /req\.query\.(?:email|customerId|customer_id)/);
  assert.match(api, /'Cache-Control', 'private, no-store, max-age=0'/);
  assert.match(api, /res\.status\(401\)/);
  assert.match(api, /res\.status\(403\)/);
});

test('customer orders read-only and excludes payment tokens, CPF and private identifiers', () => {
  const api = read('api/admin/orders.ts');
  const select = read('api/_lib/customer-order-history.ts').match(/export const CUSTOMER_ORDER_COLUMNS =\s*'([^']+)'/)?.[1] ?? '';
  assert.ok(select.includes('customer_id'));
  for (const privateColumn of ['customer_cpf', 'mercado_pago_payment_id', 'checkout_payload_hash','mercado_pago_preference_id', 'pix_qr_code']) {
    assert.ok(!select.split(',').includes(privateColumn), privateColumn + ' must not be returned');
  }
  assert.match(api, /req\.method === 'GET' && req\.query\.scope === 'customer'/);
  assert.match(api, /requireAdmin\(req\)/);
});

test('client never grants order access merely by matching typed email', () => {
  const ui = read('src/components/CustomerArea.tsx');
  const db = read('src/lib/supabase.ts');
  assert.match(ui, /fetchCustomerOrdersFromSupabase\(\)/);
  assert.doesNotMatch(ui, /customerEmail\.toLowerCase\(\) === currentUser\.email/);
  assert.match(db, /fetch\('\/api\/admin\/orders\?scope=customer'/);
  assert.match(db, /Authorization: 'Bearer ' \+ token/);
  assert.doesNotMatch(db.slice(db.indexOf('export async function fetchCustomerOrdersFromSupabase'), db.indexOf('export async function createOrderInSupabase')), /\.from\('orders'\)/);
});
