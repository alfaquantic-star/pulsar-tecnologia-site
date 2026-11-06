import { validateQueuedSandboxPayment } from './validation.ts';
import { workerBearerAuthorized } from './auth.ts';

/**
 * STAGED — deliberately NOT deployed or scheduled until the isolated
 * migration, secrets and rollback procedure have been reviewed.
 * Only sandbox orders can be updated, and ONLY after independent MP lookup.
 */
const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function dbCredentials(): { url: string; key: string; legacy: boolean } | null {
  const url = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  let key = legacyKey;
  if (!key) {
    try {
      const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
      if (typeof keys.default === 'string' && keys.default.startsWith('sb_secret_')) {
        key = keys.default;
      }
    } catch { /* no credentials */ }
  }
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key) return null;
  return { url, key, legacy: Boolean(legacyKey) };
}
Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secret = Deno.env.get('PULSAR_TEST_QUEUE_WORKER_SECRET')?.trim();
  if (!await workerBearerAuthorized(request.headers.get('Authorization'), secret))
    return json({ error: 'unauthorized' }, 401);
  if (Deno.env.get('PULSAR_ENABLE_TEST_QUEUE_WORKER') !== 'true')
    return json({ error: 'test_worker_disabled' }, 503);

  const token = Deno.env.get('MERCADO_PAGO_TEST_ACCESS_TOKEN')?.trim();
  const sellerId = Deno.env.get('PULSAR_MP_TEST_SELLER_ID')?.trim() ?? '';
  const buyerId = Deno.env.get('PULSAR_MP_TEST_BUYER_ID')?.trim() ?? '';
  const credentials = dbCredentials();
  if (!credentials || !token?.startsWith('APP_USR-') ||
      !/^\d{6,24}$/.test(sellerId) || !/^\d{6,24}$/.test(buyerId) ||
      sellerId === buyerId) return json({ error: 'test_environment_incomplete' }, 503);
  const { url, key, legacy } = credentials;
  const dbHeaders = {
    apikey: key,
    ...(legacy ? { Authorization: 'Bearer ' + key } : {}),
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
  const read = async (path: string) => {
    const response = await fetch(url + '/rest/v1/' + path, {
      headers: dbHeaders, cache: 'no-store', signal: AbortSignal.timeout(7500)
    });
    if (!response.ok) throw new Error('database_read_unavailable');
    return response.json();
  };
  const update = async (table: string, filter: string, payload: Record<string, unknown>) => {
    const response = await fetch(url + '/rest/v1/' + table + '?' + filter, {
      method: 'PATCH', headers: dbHeaders, cache: 'no-store',
      body: JSON.stringify(payload), signal: AbortSignal.timeout(7500)
    });
    if (!response.ok) throw new Error('database_update_unavailable');
    return response.json();
  };
  let claimed: { id: number; resource_id: string; attempts: number; claim_token: string } | null = null;
  try {
    // Recover only claims whose processing lease expired. Active workers use a
    // different token and cannot release or complete somebody else's claim.
    const expired = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await update('pulsar_mp_test_webhook_inbox',
      'process_status=eq.processing&claimed_at=lt.' + encodeURIComponent(expired),
      { process_status: 'queued', claimed_at: null, claim_token: null });
    const list = await read('pulsar_mp_test_webhook_inbox?process_status=eq.queued&event_type=eq.payment&order=received_at.asc&limit=1&select=id,resource_id,attempts');
    if (!list.length) return json({ checked: true, result: 'queue_empty' });
    const row = list[0];
    if (!/^\d{1,24}$/.test(String(row.resource_id)) ||
        !Number.isInteger(row.attempts) || row.attempts < 0) return json({ error: 'invalid_queued_row' }, 503);
    // Conditional atomic claim. Concurrent workers cannot claim the same event.
    const claimToken = crypto.randomUUID();
    const claimedRows = await update('pulsar_mp_test_webhook_inbox',
      'id=eq.' + row.id + '&process_status=eq.queued&select=id,resource_id,attempts,claim_token',
      { process_status: 'processing', claimed_at: new Date().toISOString(),
        claim_token: claimToken, attempts: row.attempts + 1 });
    if (!claimedRows.length) return json({ checked: true, result: 'already_claimed' });
    claimed = claimedRows[0];
    if (claimed.claim_token !== claimToken) throw new Error('claim_lost');
    const paymentId = String(claimed.resource_id);
    const upstreamHeaders = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
    const mpGet = async (path: string) => {
      const response = await fetch('https://api.mercadopago.com/' + path, {
        headers: upstreamHeaders, cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('provider_unavailable');
      return response.json();
    };
    const [payment, seller] = await Promise.all([
      mpGet('v1/payments/' + paymentId),
      fetch('https://api.mercadolibre.com/users/me', {
        headers: upstreamHeaders, cache: 'no-store', signal: AbortSignal.timeout(8000)
      }).then(async r => {
        if (!r.ok) throw new Error('seller_identity_unavailable');
        return r.json();
      })
    ]);
    const reference = payment?.external_reference;
    const merchantId = String(payment?.order?.id ?? '');
    if (typeof reference !== 'string' || !/^PLS-[A-F0-9]{24}$/.test(reference) ||
        !/^\d{1,24}$/.test(merchantId)) {
      await update('pulsar_mp_test_webhook_inbox',
        'id=eq.' + claimed.id + '&process_status=eq.processing&claim_token=eq.' + claimed.claim_token,
        { process_status: 'rejected', claimed_at: null, claim_token: null });
      return json({ checked: true, result: 'invalid_reference' });
    }
    const orders = await read('orders?order_number=eq.' +
      encodeURIComponent(reference) +
      '&select=order_number,total_amount,payment_status,mercado_pago_preference_id,mercado_pago_payment_id');
    const merchantOrder = await mpGet('merchant_orders/' + merchantId);
    const outcome = validateQueuedSandboxPayment({
      paymentId, sellerId, buyerId, seller, payment,
      merchantOrder, order: orders[0] ?? null
    });
    if (outcome === 'not_approved') {
      await update('pulsar_mp_test_webhook_inbox',
        'id=eq.' + claimed.id + '&process_status=eq.processing&claim_token=eq.' + claimed.claim_token,
        { process_status: claimed.attempts >= 5 ? 'needs_review' : 'queued',
          claimed_at: null, claim_token: null });
      return json({ checked: true, result: 'not_approved' });
    }
    if (outcome === 'invalid') {
      await update('pulsar_mp_test_webhook_inbox',
        'id=eq.' + claimed.id + '&process_status=eq.processing&claim_token=eq.' + claimed.claim_token,
        { process_status: 'rejected', claimed_at: null, claim_token: null });
      return json({ checked: true, result: 'verification_rejected' });
    }
    let orderUpdated = false;
    if (outcome === 'pending') {
      const matching = await update('orders',
        'order_number=eq.' + encodeURIComponent(reference) +
        '&payment_status=eq.pending&mercado_pago_payment_id=is.null&total_amount=eq.' +
        Number(payment.transaction_amount) + '&select=order_number',
        { payment_status: 'approved', mercado_pago_payment_id: paymentId,
          payment_verified_at: new Date().toISOString() });
      orderUpdated = matching.length === 1;
      if (!orderUpdated) {
        const current = await read('orders?order_number=eq.' +
          encodeURIComponent(reference) +
          '&select=payment_status,mercado_pago_payment_id');
        if (current[0]?.payment_status !== 'approved' ||
            String(current[0]?.mercado_pago_payment_id) !== paymentId)
          throw new Error('concurrent_order_conflict');
      }
    }
    const finished = await update('pulsar_mp_test_webhook_inbox',
      'id=eq.' + claimed.id + '&process_status=eq.processing&claim_token=eq.' + claimed.claim_token,
      { process_status: 'processed', claimed_at: null, claim_token: null });
    if (finished.length !== 1) throw new Error('claim_lost');
    return json({ checked: true, result: 'processed', orderUpdated });
  } catch {
    // A timed-out external operation cannot be assumed to have failed.
    // Reset only our own claim; subsequent validation is idempotent.
    if (claimed) {
      try {
        await update('pulsar_mp_test_webhook_inbox',
          'id=eq.' + claimed.id + '&process_status=eq.processing&claim_token=eq.' + claimed.claim_token,
          { process_status: claimed.attempts >= 5 ? 'needs_review' : 'queued',
            claimed_at: null, claim_token: null });
      } catch { /* stale leases require operational review */ }
    }
    return json({ error: 'retryable_processing_failure' }, 503);
  }
});
