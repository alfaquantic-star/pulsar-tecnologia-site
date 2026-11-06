import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTestWebhookUrl, isPublicWebhookReachable } from '../api/_lib/mp-test-webhook-url.ts';

const ingress = 'https://srvctqtmlbkmgiazgsrj.supabase.co/functions/v1/pulsar-mp-test-ingress';

test('accepts only the known isolated Supabase test ingress URL', () => {
  assert.equal(parseTestWebhookUrl(ingress)?.toString(), ingress);
  for (const input of [
    undefined,
    'http://srvctqtmlbkmgiazgsrj.supabase.co/functions/v1/pulsar-mp-test-ingress',
    'https://localhost/functions/v1/pulsar-mp-test-ingress',
    'https://pulsar-tecnologia-site.vercel.app/api/mercadopago/webhook',
    ingress + '?x-vercel-protection-bypass=secret',
    'https://user:password@srvctqtmlbkmgiazgsrj.supabase.co/functions/v1/pulsar-mp-test-ingress',
    ingress + '/unexpected',
    ingress + '#fragment'
  ]) assert.equal(parseTestWebhookUrl(input), null);
});

test('requires a healthy, signing-ready test-only receiver', async () => {
  const original = globalThis.fetch;
  const url = new URL(ingress);
  try {
    globalThis.fetch = async () => new Response('<html>login</html>', {
      status: 401, headers: { 'Content-Type': 'text/html' }
    });
    assert.equal(await isPublicWebhookReachable(url), false);
    globalThis.fetch = async () => Response.json({
      service: 'pulsar-mp-test-ingress', environment: 'test',
      signingReady: true, paymentUpdatesEnabled: false
    });
    assert.equal(await isPublicWebhookReachable(url), true);
    globalThis.fetch = async () => Response.json({
      service: 'pulsar-mp-test-ingress', environment: 'test',
      signingReady: true, paymentUpdatesEnabled: true
    });
    assert.equal(await isPublicWebhookReachable(url), false);
  } finally {
    globalThis.fetch = original;
  }
});
