import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { validateQueuedSandboxPayment } from '../supabase/functions/pulsar-mp-test-queue-worker/validation.ts';

const make = () => {
  const ref = 'PLS-ABCDEF000000000000000000';
  return {
    paymentId: '187148967281',
    sellerId: '1234567890', buyerId: '9876543210',
    seller: { id: '1234567890' },
    payment: {
      id: '187148967281', collector_id: '1234567890',
      payer: { id: '9876543210' }, live_mode: false,
      status: 'approved', currency_id: 'BRL', transaction_amount: 315.39,
      external_reference: ref, order: { id: '776655' }
    },
    merchantOrder: {
      id: '776655', preference_id: 'pref_test_1', external_reference: ref,
      payments: [{ id: '187148967281', status: 'approved', currency_id: 'BRL',
        transaction_amount: 315.39 }]
    },
    order: {
      order_number: ref, mercado_pago_preference_id: 'pref_test_1',
      total_amount: '315.39', payment_status: 'pending',
      mercado_pago_payment_id: null
    }
  };
};

test('only a full independent match can approve a pending test order', () => {
  const i=make();
  assert.equal(validateQueuedSandboxPayment(i), 'pending');
  assert.equal(i.order.payment_status,'pending');
});

test('already-approved with matching payment ID is idempotent', () => {
  const i=make();
  i.order.payment_status='approved';
  i.order.mercado_pago_payment_id=i.paymentId;
  assert.equal(validateQueuedSandboxPayment(i),'already_approved');
  i.order.mercado_pago_payment_id='999';
  assert.equal(validateQueuedSandboxPayment(i),'invalid');
});

test('payer seller amount and preference mismatches fail closed', () => {
  const x=make();
  assert.equal(validateQueuedSandboxPayment({...x, buyerId:'1234567890'}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x, payment:{...x.payment,payer:{id:'999'}}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x, payment:{...x.payment,collector_id:'999'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x, order:{...x.order,total_amount:'310'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x,merchantOrder:{...x.merchantOrder,preference_id:'wrong'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x,payment:{...x.payment,external_reference:'PLS-FFFFFFFFFFFFFFFFFFFFFFFF'}}),'invalid');
});

test('non-approved and unusable events never approve', () => {
  const x=make();
  assert.equal(validateQueuedSandboxPayment({...x,payment:{...x.payment,status:'pending'}}),'not_approved');
  assert.equal(validateQueuedSandboxPayment({...x,payment:{...x.payment,currency_id:'USD'}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x,payment:{...x.payment,live_mode:true}}),'invalid');
  assert.equal(validateQueuedSandboxPayment({...x,order:null}),'invalid');
});

test('lease-gated worker is disabled without opt-in and never uses live token', () => {
  const src = readFileSync(new URL('../supabase/functions/pulsar-mp-test-queue-worker/index.ts', import.meta.url), 'utf8');
  assert.ok(src.includes("Deno.env.get('PULSAR_ENABLE_TEST_QUEUE_WORKER') !== 'true'"));
  assert.ok(src.includes("claim_token=eq."));
  assert.ok(src.includes("process_status=eq.queued"));
  assert.equal(src.includes("Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')"),false);
});
