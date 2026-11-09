import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDiscountedTestPreference } from '../api/_lib/mp-discounted-preference.ts';

const sum = result => Math.round(result.items.reduce((n, x) => n + x.quantity * x.unit_price, 0) * 100);
const shipping = { service: 'SEDEX', priceCents: 1099 };

test('discounted provider preference matches order cents exactly for several quantities', () => {
  const p = buildDiscountedTestPreference([
    { id:'a', name:'Placa Azul', quantity:3, unitPriceCents:1999 },
    { id:'b', name:'Placa Preta', quantity:2, unitPriceCents:1499 }
  ], shipping, 897);
  assert.equal(p.subtotalCents, 8995);
  assert.equal(p.totalCents, 8995 - 897 + 1099);
  assert.equal(sum(p), p.totalCents);
  assert.equal(p.items[0].quantity, 1);
  assert.equal(p.items.at(-1).id, 'shipping');
});

test('cent rounding across many low-cost items never loses discount or creates negative unit_price', () => {
  for (let discount = 1; discount <= 19; discount++) {
    const p = buildDiscountedTestPreference(
      Array.from({length:20}, (_, i) => ({id:'p'+i,name:'P'+i,quantity:1,unitPriceCents:1})),
      { service:'PAC',priceCents:300 },discount
    );
    assert.equal(sum(p),p.totalCents);
    assert.equal(p.totalCents,320-discount);
    assert.ok(p.items.every(item => item.unit_price > 0));
  }
});

test('full discount and oversized monetary inputs fail closed',()=>{
  const lines=[{id:'p',name:'Placa',quantity:1,unitPriceCents:2000}];
  assert.throws(()=>buildDiscountedTestPreference(lines,shipping,2000));
  assert.throws(()=>buildDiscountedTestPreference(lines,shipping,3000));
  assert.throws(()=>buildDiscountedTestPreference(lines,shipping,-1));
  assert.throws(()=>buildDiscountedTestPreference(lines,shipping,0.5));
  assert.throws(()=>buildDiscountedTestPreference([{...lines[0],quantity:0}],shipping,0));
});

test('provider call uses only server-verified monetary amounts and test-only authorization',()=>{
  const src=readFileSync(new URL('../api/mercadopago/create-preference.ts',import.meta.url),'utf8');
  assert.match(src,/process\.env\.VERCEL_ENV !== 'preview'/);
  assert.match(src,/requireAdmin\(req\)/);
  assert.match(src,/PULSAR_ENABLE_MP_TEST_CHECKOUT/);
  assert.match(src,/MERCADO_PAGO_TEST_ACCESS_TOKEN/);
  assert.match(src,/buildDiscountedTestPreference/);
  assert.match(src,/paymentPayload\.totalCents !== Math\.round\(draft\.total_amount \* 100\)/);
  assert.match(src,/const items = paymentPayload\.items;/);
  assert.doesNotMatch(src,/const items = quote\.lines\.map/);
  assert.match(src,/adminCouponCode && action !== 'stage_order' && action !== 'create_test_preference'/);
});
