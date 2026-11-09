import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateAdminCouponDiscountCents } from '../api/_lib/coupons.ts';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=new Date('2026-11-09T12:00:00.000Z');
const coupon=(discount_type:'percent'|'fixed',discount_value:number)=>({
  discount_type,discount_value,is_active:true,starts_at:null,expires_at:null
});
test('only integer-cent server-authorized discounts with bounded subtotal',()=>{
  assert.equal(calculateAdminCouponDiscountCents(coupon('percent',10),1999,now),200);
  assert.equal(calculateAdminCouponDiscountCents(coupon('fixed',50),1900,now),1900);
  assert.equal(calculateAdminCouponDiscountCents(coupon('percent',100),1955,now),1955);
});
test('inactive, future or expired coupons never authorize discounts',()=>{
  assert.throws(()=>calculateAdminCouponDiscountCents({...coupon('percent',10),is_active:false},1000,now));
  assert.throws(()=>calculateAdminCouponDiscountCents({...coupon('percent',10),starts_at:'2026-11-10T12:00:00Z'},1000,now));
  assert.throws(()=>calculateAdminCouponDiscountCents({...coupon('fixed',5),expires_at:'2026-11-09T12:00:00Z'},1000,now));
  assert.throws(()=>calculateAdminCouponDiscountCents(coupon('percent',101),1000,now));
  assert.throws(()=>calculateAdminCouponDiscountCents(coupon('fixed',0),1000,now));
});
test('authorization requires admin in preview and never enables customer or payment checkout',()=>{
  const endpoint=read('api/mercadopago/create-preference.ts');
  assert.match(endpoint,/const auth = customerStage[\s\S]*?requireAdmin\(req\)/);
  assert.match(endpoint,/adminCouponCode && action !== 'stage_order'/);
  assert.match(endpoint,/\.from\('pulsar_admin_coupons'\)/);
  assert.match(endpoint,/discountCents: adminDiscountCents/);
  assert.match(endpoint,/calculateAdminCouponDiscountCents\(coupon, Math\.round\(quote\.subtotal \* 100\)\)/);
  assert.match(endpoint,/process\.env\.VERCEL_ENV !== 'preview'/);
  const quote=read('api/_lib/verify-checkout.ts');
  assert.match(quote,/attemptedCoupon \|\| attemptedDiscount/);
  assert.match(quote,/canPay:false/);
});
test('test order authorization UI stays within admin tools only',()=>{
  const ui=read('src/components/CheckoutModal.tsx');
  assert.match(ui,/currentUser\?\.role === 'admin' && \(/);
  assert.match(ui,/adminCouponCode/);
  assert.match(ui,/action === 'stage_order' && adminCouponCode/);
  assert.match(ui,/Cupons? ativo/);
  assert.doesNotMatch(read('src/components/CartDrawer.tsx'),/couponInput|handleApplyCoupon/);
});
