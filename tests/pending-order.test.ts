import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildPendingOrderDraft } from '../api/_lib/pending-order.ts';

const verified = () => ({
  lines: [
    { id: 'prod-30oe6hn', kind: 'product' as const, name: 'Placa NFC', quantity: 2, unitPriceCents: 1900 }
  ],
  shipping: { id: '1', carrier: 'Correios', service: 'SEDEX', priceCents: 1069 },
  discountCents: 0,
  customer: {
    fullName: 'Comprador de Teste', email: 'test@example.invalid',
    phone: '31999999999', cpf: '00000000000'
  },
  address: {
    zipCode: '35162348', street: 'Rua de teste', number: '1',
    neighborhood: 'Centro', city: 'Ipatinga', state: 'MG'
  }
});

test('builds pending row from server cents without recording payment or charging', () => {
  const row = buildPendingOrderDraft(verified(), randomUUID());
  assert.equal(row.subtotal, 38);
  assert.equal(row.shipping_price, 10.69);
  assert.equal(row.discount_amount, 0);
  assert.equal(row.total_amount, 48.69);
  assert.equal(row.payment_status, 'pending');
  assert.equal(row.mercado_pago_payment_id, null);
  assert.equal(row.mercado_pago_preference_id, null);
  assert.equal(row.payment_verified_at, null);
});

test('retry uses stable order number for the same idempotency key', () => {
  const key = randomUUID();
  const one = buildPendingOrderDraft(verified(), key);
  const two = buildPendingOrderDraft(verified(), key);
  assert.equal(one.order_number, two.order_number);
  assert.equal(one.checkout_idempotency_key, two.checkout_idempotency_key);
  assert.notEqual(one.id, two.id); // Database unique key handles collisions atomically.
});

test('cannot build an order from an absent cart or invalid key', () => {
  assert.throws(() => buildPendingOrderDraft({ ...verified(), lines: [] }, randomUUID()));
  assert.throws(() => buildPendingOrderDraft(verified(), 'customer-controlled'));
});

test('cannot build an order with excessive discount', () => {
  assert.throws(() => buildPendingOrderDraft({ ...verified(), discountCents: 5000 }, randomUUID()));
});

test('cannot build an order with fractional or negative cents', () => {
  assert.throws(() => buildPendingOrderDraft({
    ...verified(), shipping: { ...verified().shipping, priceCents: -1 }
  }, randomUUID()));
  assert.throws(() => buildPendingOrderDraft({
    ...verified(), lines: [{ ...verified().lines[0], unitPriceCents: 100.5 }]
  }, randomUUID()));
});
