import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('customer cart cannot enter, apply, change or remove coupons', () => {
  const cart = read('src/components/CartDrawer.tsx');
  assert.doesNotMatch(cart, /handleApplyCoupon|couponInput|onClick=\{removeCoupon\}|placeholder="Cupom/);
  assert.match(cart, /Promoções e cupons são administrados exclusivamente pela loja/);
});

test('browser cannot calculate a coupon discount even after state manipulation', () => {
  const context = read('src/context/StoreContext.tsx');
  assert.match(context, /const discountAmount = 0;/);
  assert.match(context, /const applyCoupon = \(_code: string\): boolean =>/);
  assert.match(context, /return false;/);
  assert.doesNotMatch(context, /cartSubtotal \* 0\.10/);
  assert.doesNotMatch(context, /cartSubtotal \* 0\.05/);
  assert.doesNotMatch(context, /setAppliedCoupon\('PULSAR10'\)/);
});
