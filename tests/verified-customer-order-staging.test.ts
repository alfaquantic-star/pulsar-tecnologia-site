import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildPendingOrderDraft } from '../api/_lib/pending-order.ts';

const sample = () => ({
  lines: [{ id: 'prod-test', kind: 'product' as const, name: 'NFC', quantity: 1, unitPriceCents: 2590 }],
  shipping: { id: 'sedex', carrier: 'Correios', service: 'SEDEX', priceCents: 990 },
  discountCents: 0,
  customer: { fullName: 'Cliente', email: 'client@example.invalid', phone: '11988887777', cpf: '00000000000' },
  address: { zipCode: '35162348', street: 'Rua Teste', number: '1', neighborhood: 'Centro', city: 'Ipatinga', state: 'MG' }
});
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('a verified UUID determines customer ownership, not request body or email', () => {
  const key = randomUUID(), one = randomUUID(), two = randomUUID();
  const first = buildPendingOrderDraft(sample(), key, one);
  const second = buildPendingOrderDraft(sample(), key, two);
  const guest = buildPendingOrderDraft(sample(), key);
  assert.equal(first.customer_id, one);
  assert.equal(second.customer_id, two);
  assert.equal(guest.customer_id, null);
  assert.notEqual(first.checkout_payload_hash, second.checkout_payload_hash);
  assert.notEqual(first.checkout_payload_hash, guest.checkout_payload_hash);
  assert.equal(first.order_number, second.order_number); // same idempotency key; DB collision must reject
  assert.throws(() => buildPendingOrderDraft(sample(), key, 'someone@example.invalid'));
});

test('customer staging cannot create a payment or be enabled by default', () => {
  const handler = read('api/mercadopago/create-preference.ts');
  assert.match(handler, /PULSAR_ENABLE_CUSTOMER_TEST_STAGING !== 'true'/);
  assert.match(handler, /verifyCustomerIdentity\(req\)/);
  assert.match(handler, /customerStage \? verifiedCustomer!\.id : undefined/);
  assert.match(handler, /action === 'stage_order' \|\| customerStage/);
  assert.match(handler, /verifiedCustomer!\.email/);
  assert.match(handler, /existing\.data\.customer_id !== draft\.customer_id/);
  assert.doesNotMatch(handler, /customerStage \? body\.(?:customerId|customer_id)/);
});
