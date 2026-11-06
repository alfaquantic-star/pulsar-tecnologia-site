import { validateMercadoPagoSignature } from '../_lib/mp-webhook-signature.js';
import { merchantOrderMatchesPayment } from '../_lib/mp-merchant-order.js';
import { isConfirmedTestUserPayment } from '../_lib/mp-test-user-identity.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Signed Mercado Pago notification verification. Order updates are restricted
 * to explicitly configured PREVIEW test sellers. Production stays read-only.
 * Durable notification processing and production reconciliation are pending.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return res.status(503).json({ error: 'Webhook not configured' });

  const rawId = req.query['data.id'] ?? req.query['data_id'];
  const queryDataId = typeof rawId === 'string' ? rawId.trim().toLowerCase() : '';
  const bodyId = req.body?.data?.id;
  if (!validateMercadoPagoSignature({
    signature: req.headers['x-signature'],
    requestId: req.headers['x-request-id'],
    dataId: queryDataId
  }, secret)) {
    // Preview-only single-row diagnostics. Persist only presence booleans,
    // never secrets, signatures, resource IDs, request IDs or the raw body.
    if (process.env.VERCEL_ENV === 'preview') {
      try {
        const { adminDatabase } = await import('../_lib/admin-auth.js');
        const signatureHeader = req.headers['x-signature'];
        const signatureFormatValid = typeof signatureHeader === 'string' &&
          /(?:^|,)\\s*ts=\\d{10,13}(?:,|$)/.test(signatureHeader) &&
          /(?:^|,)\\s*v1=[a-fA-F0-9]{64}(?:,|$)/.test(signatureHeader);
        await adminDatabase().from('pulsar_webhook_diagnostics').upsert({
          id: 'mp_preview',
          last_attempt_at: new Date().toISOString(),
          signature_header_present: typeof signatureHeader === 'string',
          request_id_header_present: typeof req.headers['x-request-id'] === 'string',
          query_data_id_present: Boolean(queryDataId),
          body_data_id_present: bodyId != null,
          signature_format_valid: signatureFormatValid,
          signature_verified: false
        }, { onConflict: 'id' }).abortSignal(AbortSignal.timeout(2500));
      } catch {
        // Diagnostics can never weaken signature validation or change payment state.
      }
    }
    // Only log presence booleans: never log HMAC, secret, headers or customer data.
    console.warn('Mercado Pago webhook signature rejected', {
      hasSignature: typeof req.headers['x-signature'] === 'string',
      hasRequestId: typeof req.headers['x-request-id'] === 'string',
      hasQueryDataId: Boolean(queryDataId),
      hasBodyDataId: bodyId != null
    });
    return res.status(401).json({
      error: 'Invalid webhook signature',
      diagnostic: {
        signatureHeaderPresent: typeof req.headers['x-signature'] === 'string',
        requestIdHeaderPresent: typeof req.headers['x-request-id'] === 'string',
        dataIdQueryPresent: Boolean(queryDataId)
      }
    });
  }
  // When Mercado Pago omits data.id in the URL, its official HMAC manifest
  // omits the id pair. The body identifier is then only a lookup hint:
  // we still fetch the payment from MP and validate seller, preference,
  // currency and amount before any order update.
  if (bodyId != null && queryDataId &&
      String(bodyId).trim().toLowerCase() !== queryDataId) {
    return res.status(400).json({ error: 'Webhook resource ID mismatch' });
  }
  const dataId = queryDataId || (typeof bodyId === 'string' || typeof bodyId === 'number'
    ? String(bodyId).trim().toLowerCase() : '');
  if (!/^[a-z0-9_-]{1,128}$/.test(dataId)) {
    return res.status(400).json({ error: 'Webhook payment identifier missing' });
  }
  if (typeof req.body?.type === 'string' &&
      typeof req.query.type === 'string' && req.body.type !== req.query.type) {
    return res.status(400).json({ error: 'Webhook event type mismatch' });
  }

  // A signed webhook is merely a signal, never proof that an order is paid.
  const kind = req.body?.type ?? req.query.type;
  if (kind !== 'payment') return res.status(200).json({ received: true, ignored: true });

  // Only the explicitly opted-in TEST seller may change order status.
  // All other signed notifications remain read-only.
  const updateSandboxOrder =
    process.env.VERCEL_ENV === 'preview' &&
    process.env.PULSAR_ENABLE_MP_TEST_CHECKOUT === 'true' &&
    Boolean(process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim()) &&
    /^\d+$/.test(process.env.PULSAR_MP_TEST_SELLER_ID || '');
  const token = updateSandboxOrder
    ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim()
    : process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) return res.status(503).json({ error: 'Payment verification unavailable' });
  try {
    const upstream = await fetch('https://api.mercadopago.com/v1/payments/' + encodeURIComponent(dataId), {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!upstream.ok) return res.status(503).json({ error: 'Payment lookup failed' });
    const payment = await upstream.json();
    if (String(payment.id) !== dataId || typeof payment.status !== 'string') {
      return res.status(503).json({ error: 'Unexpected payment response' });
    }
    // This route is deliberately read-only until pending orders can be linked
    // to an authenticated payment by external_reference, merchant account,
    // exact total, BRL currency and verified state.
    if (!updateSandboxOrder) {
      return res.status(200).json({ received: true, verified: true, orderUpdated: false });
    }
    // Do not approve anything but provider-confirmed approved payments.
    // Live-mode alone is not conclusive for Checkout Pro test-user sessions.
    if (payment.status !== 'approved') {
      return res.status(200).json({ received: true, verified: true, orderUpdated: false });
    }
    const sellerId = process.env.PULSAR_MP_TEST_SELLER_ID!;
    const identity = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!identity.ok) return res.status(503).json({ error: 'Seller identity unavailable' });
    const seller = await identity.json();
    if (!isConfirmedTestUserPayment({
      liveMode: payment.live_mode,
      payerId: payment.payer?.id,
      collectorId: payment.collector_id,
      authenticatedSellerId: seller.id,
      configuredSellerId: sellerId,
      configuredBuyerId: process.env.PULSAR_MP_TEST_BUYER_ID,
      accessToken: token
    })) {
      return res.status(403).json({ error: 'Test buyer identity could not be verified' });
    }
    if (String(seller.id) !== sellerId || String(payment.collector_id) !== sellerId ||
        payment.currency_id !== 'BRL' || !Number.isFinite(Number(payment.transaction_amount))) {
      return res.status(403).json({ error: 'Wrong seller, amount or currency' });
    }
    const reference = payment.external_reference;
    if (typeof reference !== 'string' || !/^PLS-[0-9A-F]{24}$/.test(reference)) {
      return res.status(422).json({ error: 'Payment does not match a checkout reference' });
    }
    const { adminDatabase } = await import('../_lib/admin-auth.js');
    const db = adminDatabase();
    const found = await db.from('orders').select(
      'id,payment_status,total_amount,mercado_pago_payment_id,mercado_pago_preference_id'
    ).eq('order_number', reference).maybeSingle();
    if (found.error) return res.status(503).json({ error: 'Order lookup unavailable' });
    const order = found.data;
    if (!order || !order.mercado_pago_preference_id ||
        order.mercado_pago_preference_id.startsWith('creating:') ||
        Number(order.total_amount) !== Number(payment.transaction_amount)) {
      return res.status(422).json({ error: 'Order association or payment amount mismatch' });
    }
    // A payment external_reference alone does not prove which Checkout Pro
    // preference was used. Confirm the merchant order directly with MP and
    // require that its preference belongs to this pending Pulsar order.
    const merchantOrderId = payment.order?.id;
    if (!/^[0-9]{1,24}$/.test(String(merchantOrderId || ''))) {
      return res.status(422).json({ error: 'Merchant order link unavailable' });
    }
    const merchantResponse = await fetch(
      'https://api.mercadopago.com/merchant_orders/' + encodeURIComponent(String(merchantOrderId)), {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000), cache: 'no-store'
      }
    );
    if (!merchantResponse.ok) {
      return res.status(503).json({ error: 'Merchant order verification unavailable' });
    }
    const merchantOrder = await merchantResponse.json();
    if (!merchantOrderMatchesPayment(
      merchantOrder, String(merchantOrderId), dataId,
      Number(payment.transaction_amount), order.mercado_pago_preference_id, reference
    )) {
      return res.status(422).json({ error: 'Payment preference association mismatch' });
    }
    if (order.payment_status === 'approved') {
      return res.status(200).json({
        received: true, verified: true,
        orderUpdated: false, duplicate: String(order.mercado_pago_payment_id) === dataId
      });
    }
    if (order.payment_status !== 'pending') {
      return res.status(409).json({ error: 'Order payment state is no longer pending' });
    }
    // Atomic compare-and-set; duplicate notifications cannot approve twice.
    const changed = await db.from('orders').update({
      payment_status: 'approved',
      mercado_pago_payment_id: dataId,
      payment_verified_at: new Date().toISOString()
    }).eq('id', order.id).eq('payment_status', 'pending')
      .is('mercado_pago_payment_id', null)
      .eq('total_amount', Number(payment.transaction_amount))
      .select('id').maybeSingle();
    if (changed.error) {
      console.error('Payment update rejected',changed.error.code);
      return res.status(503).json({ error: 'Payment state update rejected' });
    }
    return res.status(200).json({ received: true, verified: true,
      orderUpdated: Boolean(changed.data) });
  } catch {
    return res.status(503).json({ error: 'Payment verification temporarily unavailable' });
  }
}
