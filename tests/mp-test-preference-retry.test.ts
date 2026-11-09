import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../api/mercadopago/create-preference.ts',import.meta.url),'utf8');

test('test preference response reports the discounted verified order total, not full quote', () => {
  assert.match(src, /checkoutUrl: pref\.init_point, total: draft\.total_amount/);
  assert.match(src, /discount: adminDiscountCents \/ 100, paymentStatus: 'pending'/);
  assert.match(src, /paymentPayload\.totalCents !== Math\.round\(draft\.total_amount \* 100\)/);
  assert.doesNotMatch(src, /checkoutUrl: pref\.init_point, total: quote\.total/);
});

test('preference retries never query a temporary creating placeholder', () => {
  assert.match(src, /mercado_pago_preference_id\.startsWith\('creating:'\)/);
  assert.ok(src.indexOf("mercado_pago_preference_id.startsWith('creating:')") <
    src.indexOf('const get = await fetch('));
});

test('configuration checks occur before order claim to avoid stranded locks', () => {
  const host = src.indexOf('const host = process.env.VERCEL_URL;');
  const validate = src.indexOf('if (!paymentPayload) return res.status(503)');
  const claim = src.indexOf("const claim = await auth.db.from('orders')");
  assert.ok(host !== -1 && validate !== -1 && claim !== -1);
  assert.ok(host < claim);
  assert.ok(validate < claim);
  assert.match(src,/process\.env\.VERCEL_ENV !== 'preview'/);
  assert.match(src,/MERCADO_PAGO_TEST_ACCESS_TOKEN/);
});
