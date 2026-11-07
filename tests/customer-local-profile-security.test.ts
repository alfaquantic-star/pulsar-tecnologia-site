import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('legacy unverified customer label is gone and account requires email verification', () => {
  const area = read('src/components/CustomerArea.tsx');
  const modal = read('src/components/AuthModal.tsx');
  const store = read('src/context/StoreContext.tsx');

  assert.doesNotMatch(area, /Cliente Verificado/);
  assert.match(area, /Cadastro local — não verificado/);
  assert.match(modal, /Receba um link de confirmação/);
  assert.match(modal, /requestCustomerOtp/);
  assert.match(store, /auth\.verifyOtp\(/);
  assert.doesNotMatch(modal, /CPF \(Nota Fiscal\)|setCustomerCpf|customerCpf/);
  assert.doesNotMatch(store, /Conta de cliente criada com sucesso/);
});

test('private order access remains admin-only until verified customer auth exists', () => {
  const data = read('src/lib/supabase.ts');
  const api = read('api/admin/orders.ts');
  assert.match(data, /adminApi\('\/api\/admin\/orders', 'GET'\)/);
  assert.match(api, /requireAdmin\(req\)/);
  assert.doesNotMatch(data, /\.from\('orders'\)/);
});
