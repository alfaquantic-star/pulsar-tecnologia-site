import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyQueuedTestPayment } from '../api/_lib/mp-queue-payment-verification.ts';

const orderNumber = 'PLS-ABCDEF000000000000000000';
const input = () => ({
  paymentId:'123456789',
  sellerId:'1234567890',
  buyerId:'9876543210',
  testToken:'APP_USR-test-only-not-real',
  seller:{id:1234567890},
  payment:{
    id:123456789, status:'approved', currency_id:'BRL',
    live_mode:false, collector_id:1234567890,
    payer:{id:9876543210}, external_reference:orderNumber,
    transaction_amount:315.39, order:{id:9988}
  },
  order:{
    order_number:orderNumber,total_amount:315.39,payment_status:'pending',
    mercado_pago_preference_id:'test-pref-1',mercado_pago_payment_id:null
  },
  merchantOrder:{
    id:9988, preference_id:'test-pref-1',external_reference:orderNumber,
    payments:[{id:123456789,status:'approved',currency_id:'BRL',transaction_amount:315.39}]
  }
});

test('validates a complete test payment without changing order', () => {
  const args = input();
  assert.deepEqual(verifyQueuedTestPayment(args),{verified:true,reason:'eligible_pending'});
  assert.equal(args.order.payment_status,'pending');
});

test('rejects forged or nonapproved payment', () => {
  const args=input();
  assert.equal(verifyQueuedTestPayment({...args,paymentId:'999999999'}).verified,false);
  assert.equal(verifyQueuedTestPayment({...args,payment:{...args.payment,status:'pending'}}).verified,false);
});

test('rejects mismatched merchant order, amount and buyer/seller', () => {
  const args=input();
  assert.equal(verifyQueuedTestPayment({...args,order:{...args.order,total_amount:314.39}}).verified,false);
  assert.equal(verifyQueuedTestPayment({...args,merchantOrder:{...args.merchantOrder,preference_id:'wrong'}}).verified,false);
  assert.equal(verifyQueuedTestPayment({...args,payment:{...args.payment,collector_id:9876543210}}).verified,false);
  assert.equal(verifyQueuedTestPayment({...args,payment:{...args.payment,live_mode:true,payer:{id:333333}}}).verified,false);
});

test('rejects conflicting order state and accepts idempotent already-approved record', () => {
  const args=input();
  assert.equal(verifyQueuedTestPayment({...args,order:{...args.order,payment_status:'cancelled'}}).verified,false);
  assert.equal(verifyQueuedTestPayment({...args,order:{...args.order,payment_status:'approved',mercado_pago_payment_id:'987654321'}}).verified,false);
  assert.deepEqual(verifyQueuedTestPayment({...args,order:{...args.order,payment_status:'approved',mercado_pago_payment_id:args.paymentId}}),{verified:true,reason:'already_approved'});
});
