import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyPaymentSignature } from '../supabase/functions/pulsar-mp-test-ingress/signature.ts';

const key = 'example-not-a-real-provider-secret';
const sign = (manifest: string, ts = '1762000000') =>
  'ts=' + ts + ',v1=' + createHmac('sha256',key).update(manifest).digest('hex');

test('valid signature verifies for payment resource', async () => {
  const ts = '1762000000';
  const id = '186905016881', rid = 'request-test-1';
  assert.equal(await verifyPaymentSignature(key,sign('id:' + id + ';request-id:' + rid + ';ts:' + ts + ';',ts),rid,id),true);
});
test('wrong payment id and request id reject', async () => {
  const sig=sign('id:186905016881;request-id:request-test-1;ts:1762000000;');
  assert.equal(await verifyPaymentSignature(key,sig,'request-test-1','186905016882'),false);
  assert.equal(await verifyPaymentSignature(key,sig,'request-test-2','186905016881'),false);
});
test('missing optional fields are omitted from manifest', async () => {
  const sig=sign('ts:1762000000;');
  assert.equal(await verifyPaymentSignature(key,sig,null,''),true);
});
test('no signature or tampered hash rejects', async () => {
  assert.equal(await verifyPaymentSignature(key,null,'r','1'),false);
  assert.equal(await verifyPaymentSignature(key,'ts=1762000000,v1='+'0'.repeat(64),'r','1'),false);
});
