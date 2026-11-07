import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const store = read('src/context/StoreContext.tsx');
const modal = read('src/components/AuthModal.tsx');

test('customer identity requires verified Supabase Auth redirect instead of typed email', () => {
  assert.match(store, /auth\.signInWithOtp\(/);
  assert.match(store, /auth\.verifyOtp\(/);
  assert.match(store, /auth\.getUser\(/);
  assert.doesNotMatch(store, /const loginAsCustomer = /);
  assert.doesNotMatch(store, /localStorage\.setItem\('pulsar_user'/);
  assert.match(store, /data\.user\.app_metadata\?\.role === 'admin'/);
});

test('customer login uses default magic link without collecting CPF or fake code', () => {
  assert.match(modal, /requestCustomerOtp\(customerEmail\)/);
  assert.match(modal, /Enviar link de acesso/);
  assert.match(store, /emailRedirectTo: 'https:\/\/pulsar-tecnologia-site-git-security-server-api-phase1-qr-flow\.vercel\.app\/'/);
  assert.doesNotMatch(modal, /loginAsCustomer|customerCpf|setCustomerCpf|CPF \(Nota Fiscal\)/);
  assert.doesNotMatch(modal, /Código de verificação recebido por e-mail/);
});

test('client order ownership cannot be inferred from an email string', () => {
  assert.match(store, /Order ownership mapping is not yet enabled/);
  assert.doesNotMatch(store, /\.from\('orders'\)/);
  assert.match(read('api/admin/orders.ts'), /requireAdmin\(req\)/);
});
