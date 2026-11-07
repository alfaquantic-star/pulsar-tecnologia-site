import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merchantOrderMatchesPayment } from '../api/_lib/mp-merchant-order.ts';

const sample = () => ({
  id: 9988,
  preference_id: 'test-pref-1',
  external_reference: 'PLS-ABCDEF000000000000000000',
  payments: [{ id: 422, status: 'approved', currency_id: 'BRL', transaction_amount: 48.69 }]
});
const valid = (order: unknown) => merchantOrderMatchesPayment(
  order, '9988', '422', 48.69, 'test-pref-1', 'PLS-ABCDEF000000000000000000'
);

test('accepts the verified merchant order for the same payment and preference', () => {
  assert.equal(valid(sample()), true);
});
test('rejects spoofed external reference with different preference', () => {
  assert.equal(valid({ ...sample(), preference_id: 'other-preference' }), false);
});
test('rejects wrong merchant order, reference, payment id or missing payment', () => {
  assert.equal(valid({ ...sample(), id: 9989 }), false);
  assert.equal(valid({ ...sample(), external_reference: 'different' }), false);
  assert.equal(valid({ ...sample(), payments: [] }), false);
  assert.equal(valid({ ...sample(), payments: [{...sample().payments[0], id: 423}] }), false);
});
test('rejects pending, wrong currency and mismatched amount', () => {
  assert.equal(valid({ ...sample(), payments: [{...sample().payments[0], status:'pending'}] }), false);
  assert.equal(valid({ ...sample(), payments: [{...sample().payments[0], currency_id:'USD'}] }), false);
  assert.equal(valid({ ...sample(), payments: [{...sample().payments[0], transaction_amount: 10}] }), false);
});
