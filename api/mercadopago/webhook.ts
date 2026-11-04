import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Read-only Mercado Pago webhook validation.
 * NO order can be approved or modified here until order association,
 * amount/currency/owner validation, idempotent transitions and a durable
 * queue have all been implemented and reviewed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return res.status(503).json({ error: 'Webhook not configured' });

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  const rawId = req.query['data.id'] ?? req.query['data_id'];
  const dataId = typeof rawId === 'string' ? rawId.trim().toLowerCase() : '';
  if (typeof signature !== 'string' || typeof requestId !== 'string' ||
      !requestId || requestId.length > 200 ||
      !/^[a-z0-9_-]{1,128}$/.test(dataId)) {
    return res.status(401).json({ error: 'Invalid signature inputs' });
  }
  const parts = Object.fromEntries(signature.split(',').map(x => {
    const [key, ...value] = x.split('=');
    return [key?.trim() || '', value.join('=').trim()];
  }));
  const timestamp = parts.ts, receivedHash = parts.v1;
  if (!timestamp || !/^\d{10,13}$/.test(timestamp) ||
      !receivedHash || !/^[0-9a-fA-F]{64}$/.test(receivedHash)) {
    return res.status(401).json({ error: 'Malformed signature' });
  }
  const time = Number(timestamp) * (timestamp.length === 10 ? 1000 : 1);
  if (Math.abs(Date.now() - time) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Expired signature' });
  }
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const received = Buffer.from(receivedHash, 'hex');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Signature mismatch' });
  }

  // A signed webhook is merely a signal, never proof that an order is paid.
  const kind = req.body?.type ?? req.query.type;
  if (kind !== 'payment') return res.status(200).json({ received: true, ignored: true });

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
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
    console.info('Mercado Pago signed payment notification validated (read-only)', {
      paymentStatus: payment.status
    });
    return res.status(200).json({ received: true, verified: true, orderUpdated: false });
  } catch {
    return res.status(503).json({ error: 'Payment verification temporarily unavailable' });
  }
}
