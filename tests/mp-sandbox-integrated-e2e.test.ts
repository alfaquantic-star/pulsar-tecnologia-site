import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { calculateAdminCouponDiscountCents } from '../api/_lib/coupons.ts';
import { buildDiscountedTestPreference } from '../api/_lib/mp-discounted-preference.ts';
import { buildPendingOrderDraft } from '../api/_lib/pending-order.ts';
import { verifyPaymentSignature } from '../supabase/functions/pulsar-mp-test-ingress/signature.ts';
import { validateQueuedSandboxPayment } from '../supabase/functions/pulsar-mp-test-queue-worker/validation.ts';

// Fully synthetic sandbox integration: no payment API call, no DB writes,
// no secrets and no authorization of live purchases.
const date = new Date('2026-11-09T12:00:00.000Z');
const sellerId='1000022211',buyerId='1000033311';
const paymentId='997771234',merchantId='88990111',preferenceId='TEST-PREFERENCE-ONLY';
const coupon={discount_type:'percent' as const,discount_value:12.5,is_active:true,
  starts_at:'2026-11-01T00:00:00.000Z',expires_at:'2026-12-01T00:00:00.000Z'};
const makeScenario=()=>{
  const lines=[
    {id:'plaque-black',kind:'product' as const,name:'Placa Google Preta',quantity:3,unitPriceCents:1999},
    {id:'plaque-blue',kind:'product' as const,name:'Placa Google Azul',quantity:2,unitPriceCents:1750}
  ];
  const subtotal=lines.reduce((n,l)=>n+l.quantity*l.unitPriceCents,0);
  const discount=calculateAdminCouponDiscountCents(coupon,subtotal,date);
  const shipping={id:'sandbox-pac',carrier:'PAC Teste',service:'PAC',priceCents:1299};
  const order=buildPendingOrderDraft({
    lines,shipping,discountCents:discount,
    customer:{fullName:'Comprador Teste',email:'buyer@example.invalid',phone:'11999999999',cpf:'00000000000'},
    address:{zipCode:'01001000',street:'Rua Teste',number:'100',neighborhood:'Centro',city:'São Paulo',state:'SP'}
  },'12345678-1234-4123-8123-123456789abc');
  const preference=buildDiscountedTestPreference(lines,shipping,discount);
  const payment={
    id:paymentId,collector_id:sellerId,payer:{id:buyerId},live_mode:false,
    status:'approved',currency_id:'BRL',transaction_amount:order.total_amount,
    external_reference:order.order_number,order:{id:merchantId}
  };
  const merchantOrder={
    id:merchantId,preference_id:preferenceId,external_reference:order.order_number,
    payments:[{id:paymentId,status:'approved',currency_id:'BRL',transaction_amount:order.total_amount}]
  };
  const dbOrder={...order,mercado_pago_preference_id:preferenceId};
  const input={paymentId,sellerId,buyerId,seller:{id:sellerId},payment,
    merchantOrder,order:dbOrder};
  return {subtotal,discount,order,preference,input};
};
test('synthetic E2E: Admin coupon -> canonical pending order -> exact Mercado Pago total -> confirmed sandbox payment',()=>{
  const x=makeScenario();
  assert.equal(x.order.payment_status,'pending');
  assert.equal(x.order.mercado_pago_payment_id,null);
  assert.equal(x.order.discount_amount,x.discount/100);
  assert.equal(x.preference.totalCents,Math.round(x.order.total_amount*100));
  assert.equal(x.preference.items.reduce((s,p)=>s+Math.round(p.unit_price*100)*p.quantity,0),x.preference.totalCents);
  assert.equal(validateQueuedSandboxPayment(x.input),'pending');
  // Verify the pure classifier does NOT update DB state.
  assert.equal(x.input.order.payment_status,'pending');
});
test('synthetic E2E: signed webhook ID is independently matched',async()=>{
  const x=makeScenario();
  const secret='fixture-only-never-a-real-secret';
  const requestId='synthetic-request-1',timestamp='1794225600';
  const manifest='id:'+paymentId+';request-id:'+requestId+';ts:'+timestamp+';';
  const signature='ts='+timestamp+',v1='+createHmac('sha256',secret).update(manifest).digest('hex');
  assert.equal(await verifyPaymentSignature(secret,signature,requestId,paymentId),true);
  assert.equal(await verifyPaymentSignature(secret,signature,requestId,paymentId+'1'),false);
  assert.equal(validateQueuedSandboxPayment(x.input),'pending');
});
test('synthetic E2E: duplicate payment is idempotent but wrong payment conflicts',()=>{
  const x=makeScenario();
  assert.equal(validateQueuedSandboxPayment({...x.input,order:{...x.input.order,
    payment_status:'approved',mercado_pago_payment_id:paymentId}}),'already_approved');
  assert.equal(validateQueuedSandboxPayment({...x.input,order:{...x.input.order,
    payment_status:'approved',mercado_pago_payment_id:'111'}}),'invalid');
});
test('synthetic E2E: mismatched amount, reference, buyer and merchant preference fail closed',()=>{
  const x=makeScenario(),i=x.input;
  assert.equal(validateQueuedSandboxPayment({...i,payment:{...i.payment,transaction_amount:i.payment.transaction_amount+0.01}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...i,merchantOrder:{...i.merchantOrder,preference_id:'bad'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...i,payment:{...i.payment,external_reference:'PLS-AAAAAAAAAAAAAAAAAAAAAAAA'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...i,payment:{...i.payment,payer:{id:'9999999999'}}}),'invalid');
});
test('synthetic E2E: LIVE payment, not-approved or expired coupon is never eligible',()=>{
  const x=makeScenario(),i=x.input;
  assert.equal(validateQueuedSandboxPayment({...i,payment:{...i.payment,live_mode:true}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...i,payment:{...i.payment,status:'pending'}}),'not_approved');
  assert.throws(()=>calculateAdminCouponDiscountCents(coupon,x.subtotal,new Date('2026-12-02T00:00:00Z')));
});
