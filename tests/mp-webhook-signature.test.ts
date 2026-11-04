import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { validateMercadoPagoSignature } from '../api/_lib/mp-webhook-signature.ts';

const secret = 'webhook-test-only-not-a-real-secret';
function signed(id: string, requestId = 'request-test-123', ts = '1762100000') {
  const digest = createHmac('sha256', secret)
    .update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return { dataId: id, requestId, signature: `ts=${ts},v1=${digest}` };
}
test('accepts signed Mercado Pago payment notification', () => {
  assert.equal(validateMercadoPagoSignature(signed('123456789'), secret), true);
});
test('accepts legitimate webhook retry with older timestamp', () => {
  assert.equal(validateMercadoPagoSignature(signed('123456789', 'old-request', '1750000000'), secret), true);
});
test('rejects altered resource identifier', () => {
  assert.equal(validateMercadoPagoSignature({ ...signed('123'), dataId: '124' }, secret), false);
});
test('rejects modified signature and request id', () => {
  assert.equal(validateMercadoPagoSignature({ ...signed('123'), requestId: 'wrong' }, secret), false);
  assert.equal(validateMercadoPagoSignature({ ...signed('123'), signature: 'ts=1762100000,v1='+'0'.repeat(64) }, secret), false);
});
test('rejects unsigned and malformed webhooks', () => {
  assert.equal(validateMercadoPagoSignature({ dataId:'123', requestId:'x', signature:'' }, secret), false);
  assert.equal(validateMercadoPagoSignature({ dataId:'123', requestId:'x', signature:'ts=invalid,v1=abc' }, secret), false);
  assert.equal(validateMercadoPagoSignature({ ...signed('123'), dataId:'../123' }, secret), false);
  assert.equal(validateMercadoPagoSignature(signed('123'), ''), false);
});
