import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCustomerOrdersByVerifiedId, CUSTOMER_ORDER_COLUMNS } from '../api/_lib/customer-order-history.ts';

const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const rows = [
  { id: 'A', customer_id: userA, customer_email: 'same@example.invalid', payment_status: 'pending' },
  { id: 'B', customer_id: userB, customer_email: 'same@example.invalid', payment_status: 'approved' },
  { id: 'guest', customer_id: null, customer_email: 'same@example.invalid', payment_status: 'approved' }
];

const makeDb = () => {
  const trace: Array<{ name: string; args: unknown[] }> = [];
  const query = (list: typeof rows): any => ({
    select: (columns: string) => {
      trace.push({ name: 'select', args: [columns] });
      return {
        eq: (column: string, value: string) => {
          trace.push({ name: 'eq', args: [column, value] });
          return {
            order: (key: string, options: { ascending: boolean }) => {
              trace.push({ name: 'order', args: [key, options] });
              return {
                limit: async (n: number) => {
                  trace.push({ name: 'limit', args: [n] });
                  return { data: list.filter(r => (r as any)[column] === value).slice(0, n), error: null };
                }
              };
            }
          };
        }
      };
    }
  });
  return {
    trace,
    from: (table: string) => {
      trace.push({ name: 'from', args: [table] });
      return query(rows);
    }
  };
};

test('user A and user B see strictly their own orders even when email is identical', async () => {
  const a = makeDb(), b = makeDb();
  assert.deepEqual((await getCustomerOrdersByVerifiedId(a, userA)).map((r: any) => r.id), ['A']);
  assert.deepEqual((await getCustomerOrdersByVerifiedId(b, userB)).map((r: any) => r.id), ['B']);
  assert.deepEqual(a.trace.find(t => t.name === 'eq')?.args, ['customer_id', userA]);
  assert.deepEqual(b.trace.find(t => t.name === 'eq')?.args, ['customer_id', userB]);
  assert.ok(!a.trace.some(t => t.args.includes('customer_email')));
});

test('guest, arbitrary email and empty identity must fail before touching database', async () => {
  for (const attacker of ['same@example.invalid', 'guest', '', '00000000-0000-0000-0000-000000000000']) {
    const db = makeDb();
    await assert.rejects(() => getCustomerOrdersByVerifiedId(db, attacker));
    assert.deepEqual(db.trace, []);
  }
});

test('order read exposes only explicit allowlisted columns and limits rows', async () => {
  const db = makeDb();
  await getCustomerOrdersByVerifiedId(db, userA);
  assert.deepEqual(db.trace.find(t => t.name === 'from')?.args, ['orders']);
  assert.deepEqual(db.trace.find(t => t.name === 'limit')?.args, [50]);
  const selected = CUSTOMER_ORDER_COLUMNS.split(',');
  for (const forbidden of ['customer_cpf', 'mercado_pago_payment_id', 'checkout_payload_hash', 'mercado_pago_preference_id', 'pix_qr_code']) {
    assert.equal(selected.includes(forbidden), false);
  }
  assert.deepEqual(db.trace.find(t => t.name === 'select')?.args, [CUSTOMER_ORDER_COLUMNS]);
});
