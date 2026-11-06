import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sandbox queue processing is guarded, provider-verified and idempotent', () => {
  const src=readFileSync(new URL('../api/admin/me.ts',import.meta.url),'utf8');
  const start=src.indexOf("// Read-only verification of ONE queued event");
  const end=src.indexOf("// Preview-only and admin-only inbox health:",start);
  assert.ok(start>=0&&end>start);
  const handler=src.slice(start,end);
  assert.ok(handler.includes("process.env.VERCEL_ENV !== 'preview'"));
  assert.ok(handler.includes("verifyQueuedTestPayment({"));
  assert.ok(handler.includes("!result.verified"));
  assert.ok(handler.includes(".eq('payment_status','pending')"));
  assert.ok(handler.includes(".is('mercado_pago_payment_id',null)"));
  assert.ok(handler.includes("String(current.data?.mercado_pago_payment_id) !== id"));
  assert.ok(handler.includes(".eq('process_status','queued')"));
  assert.ok(handler.includes("result.reason === 'already_approved'"));
  assert.ok(!handler.includes('MERCADO_PAGO_ACCESS_TOKEN'), 'must never use live seller token');
});
