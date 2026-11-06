import { verifyPaymentSignature } from './signature.ts';

// Dedicated TEST webhook receiver. It never modifies orders or payment status.
const respond = (data: Record<string, unknown>, status = 200) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

Deno.serve(async request => {
  if (request.method === 'GET') return respond({
    service: 'pulsar-mp-test-ingress', environment: 'test',
    signingReady: Boolean(Deno.env.get('MP_WEBHOOK_SECRET')),
    paymentUpdatesEnabled: false
  });
  if (request.method !== 'POST') return respond({error:'method_not_allowed'},405);
  const secret = Deno.env.get('MP_WEBHOOK_SECRET')?.trim();
  if (!secret) return respond({error:'signature_secret_not_configured'},503);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength > 16384) {
    return respond({error:'invalid_request_length'},413);
  }
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 16384) return respond({error:'payload_too_large'},413);
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return respond({error:'invalid_body'},400);
    body = value as Record<string,unknown>;
  } catch { return respond({error:'invalid_json'},400); }

  const url = new URL(request.url);
  const idQuery = (url.searchParams.get('data.id') ||
    url.searchParams.get('data_id') || '').trim().toLowerCase();
  const data = body.data;
  const idBody = data && typeof data === 'object' && !Array.isArray(data)
    ? String((data as Record<string, unknown>).id ?? '').trim().toLowerCase() : '';
  if (idQuery && idBody && idQuery !== idBody)
    return respond({error:'resource_id_mismatch'},400);
  const signed = await verifyPaymentSignature(
    secret, request.headers.get('x-signature'),
    request.headers.get('x-request-id'), idQuery
  );
  if (!signed) return respond({error:'invalid_signature'},401);

  const kind = body.type || url.searchParams.get('type');
  if (body.type && url.searchParams.get('type') &&
    body.type !== url.searchParams.get('type'))
    return respond({error:'event_type_mismatch'},400);
  if (kind !== 'payment') return respond({received:true,ignored:true});
  const resourceId = idQuery || idBody;
  if (!/^\d{1,24}$/.test(resourceId))
    return respond({error:'invalid_resource_id'},400);

  const endpoint = Deno.env.get('SUPABASE_URL');
  const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  let key = legacyServiceKey;
  if (!key) {
    try {
      const parsed: unknown = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const defaultSecret = (parsed as Record<string, unknown>).default;
        if (typeof defaultSecret === 'string' && defaultSecret.startsWith('sb_secret_'))
          key = defaultSecret;
      }
    } catch { /* fail closed */ }
  }
  if (!endpoint || !key) return respond({error:'database_unavailable'},503);

  try {
    const stored = await fetch(endpoint + '/rest/v1/pulsar_mp_test_webhook_inbox?on_conflict=event_type,resource_id', {
      method:'POST', cache:'no-store', signal: AbortSignal.timeout(6000),
      headers: {
        'apikey':key,
        ...(legacyServiceKey ? { 'Authorization':'Bearer ' + legacyServiceKey } : {}),
        'Content-Type':'application/json',
        'Prefer':'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({event_type:'payment',resource_id:resourceId})
    });
    if (!stored.ok) return respond({error:'queue_unavailable'},503);
    return respond({received:true,queued:true,paymentUpdatesEnabled:false});
  } catch { return respond({error:'queue_unavailable'},503); }
});
