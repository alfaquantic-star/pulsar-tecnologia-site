import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTestWebhookUrl, isPublicWebhookReachable } from '../api/_lib/mp-test-webhook-url.ts';

test('accepts only an https webhook URL without credentials or query bypass tokens', () => {
  assert.equal(parseTestWebhookUrl('https://example.com/api/mercadopago/webhook')?.hostname, 'example.com');
  for (const input of [
    undefined,
    'http://example.com/api/mercadopago/webhook',
    'https://localhost/api/mercadopago/webhook',
    'https://example.com/api/mercadopago/webhook?x-vercel-protection-bypass=secret',
    'https://alice:password@example.com/api/mercadopago/webhook',
    'https://example.com/other',
    'https://example.com/api/mercadopago/webhook#fragment'
  ]) assert.equal(parseTestWebhookUrl(input), null);
});

test('rejects Vercel-authenticated preview responses and accepts public handler', async () => {
  const original = globalThis.fetch;
  const url = new URL('https://example.com/api/mercadopago/webhook');
  try {
    globalThis.fetch = async () => new Response('<html>login</html>', {
      status: 401, headers: { 'Content-Type': 'text/html' }
    });
    assert.equal(await isPublicWebhookReachable(url), false);

    globalThis.fetch = async () => Response.json({ error: 'Method not allowed' }, { status: 405 });
    assert.equal(await isPublicWebhookReachable(url), true);
  } finally {
    globalThis.fetch = original;
  }
});
