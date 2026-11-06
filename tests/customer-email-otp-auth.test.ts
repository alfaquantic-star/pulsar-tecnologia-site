import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const store = read('src/context/StoreContext.tsx');
const modal = read('src/components/AuthModal.tsx');

test('customer identity must use verified Supabase Auth OTP instead of typed email', () => {
  assert.match(store, /auth\.signInWithOtp\(/);
  assert.match(store, /auth\.verifyOtp\(/);
  assert.match(store, /auth\.getUser\(/);
  assert.doesNotMatch(store, /const loginAsCustomer = /);
  assert.doesNotMatch(store, /localStorage\.setItem\('pulsar_user'/);
  assert.match(store, /data\.user\.app_metadata\?\.role === 'admin'/);
});

test('client signup uses email OTP without collecting CPF or simulated identity', () => {
  assert.match(modal, /requestCustomerOtp\(customerEmail\)/);
  assert.match(modal, /verifyCustomerOtp\(customerEmail, customerOtp\)/);
  assert.doesNotMatch(modal, /loginAsCustomer|customerCpf|setCustomerCpf|CPF \(Nota Fiscal\)/);
  assert.match(modal, /Código de verificação/);
});

test('client order ownership cannot be inferred from an email string', () => {
  assert.match(store, /Order ownership mapping is not yet enabled/);
  assert.doesNotMatch(store, /\.from\('orders'\)/);
  assert.match(read('api/admin/orders.ts'), /requireAdmin\(req\)/);
});
