import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui = readFileSync(new URL('../src/components/CheckoutModal.tsx',import.meta.url),'utf8');
test('Admin test receipt uses exclusively server-returned monetary fields',()=>{
  assert.match(ui,/subtotal: typeof result\.subtotal === 'number' \? result\.subtotal/);
  assert.match(ui,/discount: typeof result\.discount === 'number' \? result\.discount/);
  assert.match(ui,/total: typeof result\.total === 'number' \? result\.total/);
  assert.match(ui,/Frete verificado: R\$/);
  assert.match(ui,/Total confirmado para teste: R\$/);
  assert.match(ui,/Apenas ambiente de teste/);
  assert.match(ui,/currentUser\?\.role === 'admin' && \(/);
});
