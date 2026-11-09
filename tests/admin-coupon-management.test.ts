import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCouponPayload } from '../api/_lib/coupons.ts';
const file = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('admin coupon validation accepts bounded discounts and normalized codes', () => {
  assert.deepEqual(validateCouponPayload({ code:' promo10 ', discount_type:'percent', discount_value:10 }, 'create'),
    { code:'PROMO10', discount_type:'percent', discount_value:10 });
  assert.equal(validateCouponPayload({ is_active:true }, 'update').is_active,true);
});
test('admin coupon validation rejects injection, excessive discounts and altered fields', () => {
  for (const payload of [
    {code:'X',discount_type:'percent',discount_value:10},
    {code:'BAD SALE',discount_type:'percent',discount_value:10},
    {code:'PROMO10',discount_type:'percent',discount_value:101},
    {code:'PROMO10',discount_type:'fixed',discount_value:-1},
    {code:'PROMO10',discount_type:'fixed',discount_value:0.001},
    {code:'PROMO10',discount_type:'percent',discount_value:20,admin_id:'fake'},
  ]) assert.throws(() => validateCouponPayload(payload,'create'));
});
test('coupon admin API requires verified admin before any CRUD and uses isolated table', () => {
  const api=file('api/admin/catalog.ts');
  assert.ok(api.indexOf('const auth = await requireAdmin(req)') < api.indexOf("if (table === 'coupons')"));
  assert.match(api,/db\.from\('pulsar_admin_coupons'\)/);
  assert.match(api,/validateCouponPayload/);
  assert.match(api,/payload\.is_active = false/);
  const migration=file('supabase/migrations/20261109_pulsar_admin_coupons.sql');
  assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
  assert.match(migration,/REVOKE ALL ON TABLE public\.pulsar_admin_coupons FROM PUBLIC, anon, authenticated/);
});
test('coupons interface visible only inside admin panel', () => {
  const panel=file('src/components/AdminPanel.tsx');
  assert.match(panel,/adminTab === 'coupons' && <AdminCoupons \/>/);
  assert.match(panel,/Cupons e Promoções/);
  assert.match(file('src/components/AdminCoupons.tsx'), /Authorization: 'Bearer ' \+ session\.access_token/);
  assert.doesNotMatch(file('src/components/CartDrawer.tsx'), /handleApplyCoupon/);
});
