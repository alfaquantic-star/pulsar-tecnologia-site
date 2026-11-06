// Public TEST-only Mercado Pago receiver. Does not update or acknowledge payments.
// The signature secret must be configured separately in Supabase Functions.
const json = (data: Record<string, unknown>, status = 200) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

Deno.serve(async request => {
  if (request.method === 'GET') return json({
    service: 'pulsar-mp-test-ingress',
    publicRouteReady: true,
    signatureConfigured: Boolean(Deno.env.get('MP_WEBHOOK_SECRET')),
    paymentUpdatesEnabled: false
  });
  if (request.method !== 'POST') return json({error:'method_not_allowed'},405);
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) return json({error:'signature_secret_not_configured'},503);
  // Fail closed until persistent verified-event processing is enabled.
  return json({error:'test_webhook_processing_not_enabled'},503);
});
