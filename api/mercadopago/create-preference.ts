import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../_lib/admin-auth.js';
import { verifyCheckout, CheckoutError } from '../_lib/verify-checkout.js';
import { buildPendingOrderDraft } from '../_lib/pending-order.js';

/**
 * Admin-only PREVIEW test flow. Customers cannot call this endpoint.
 * Never use the ordinary MERCADO_PAGO_ACCESS_TOKEN to create a preference.
 * Test checkout requires a separate seller TEST credential and explicit opt-in.
 * Real customer checkout stays disabled until RLS and auth cutover is verified.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (process.env.VERCEL_ENV !== 'preview') {
    return res.status(403).json({ error: 'Somente no Preview da Vercel.' });
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Acesso administrativo necessário.' });
    const body = req.body;
    const action = body?.action;
    if (action !== 'stage_order' && action !== 'create_test_preference') {
      return res.status(400).json({ error: 'Ação de teste inválida.' });
    }
    if (body.coupon && String(body.coupon).trim()) {
      return res.status(422).json({ error: 'Cupons ainda não autorizados pelo backend. Retire o cupom para testar.' });
    }
    const key = body.idempotencyKey;
    if (typeof key !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key)) {
      return res.status(400).json({ error: 'Identificador de tentativa inválido.' });
    }
    // This re-reads live product/kit price, consolidated stock AND re-quotes
    // the selected shipping service. Ignore any caller-supplied total.
    const quote = await verifyCheckout(body);
    if (!quote.shipping || !Array.isArray(quote.lines)) {
      return res.status(422).json({ error: 'Recalcule e selecione uma opção de frete.' });
    }
    if (!body.customer || !body.address ||
        String(body.address.zipCode || '').replace(/\D/g,'') !==
          String(body.cep || '').replace(/\D/g,'')) {
      return res.status(400).json({ error: 'Endereço não corresponde ao CEP de frete.' });
    }
    // The browser never determines monetary amounts.
    const verified = {
      lines: quote.lines.map(line => ({
        id: line.id, name: line.name, kind: line.kind,
        quantity: line.quantity, unitPriceCents: Math.round(line.unitPrice * 100)
      })),
      shipping: {
        id: quote.shipping.id, carrier: quote.shipping.carrier,
        service: quote.shipping.service,
        priceCents: Math.round(quote.shipping.price * 100)
      },
      discountCents: 0,
      customer: body.customer,
      address: body.address
    };
    const draft = buildPendingOrderDraft(verified, key);
    const { data: inserted, error: insertError } = await auth.db.from('orders')
      .insert(draft).select('id,order_number,checkout_payload_hash,payment_status,mercado_pago_preference_id')
      .single();
    let row = inserted;
    let wasReused = false;
    if (insertError) {
      if (insertError.code !== '23505') {
        console.error('Checkout staging insert rejected', insertError.code);
        return res.status(503).json({ error: 'Não foi possível registrar o pedido pendente.' });
      }
      const existing = await auth.db.from('orders')
        .select('id,order_number,checkout_payload_hash,payment_status,mercado_pago_preference_id')
        .eq('checkout_idempotency_key', key).maybeSingle();
      if (existing.error || !existing.data) {
        return res.status(409).json({ error: 'Já existe uma tentativa com este identificador.' });
      }
      if (existing.data.checkout_payload_hash !== draft.checkout_payload_hash) {
        return res.status(409).json({ error: 'Esta tentativa já foi usada com outro carrinho, frete ou cliente.' });
      }
      row = existing.data;
      wasReused = true;
    }
    if (!row) return res.status(503).json({ error: 'Pedido indisponível.' });

    // Stage-only is safe: does not create a Mercado Pago preference or reserve stock.
    if (action === 'stage_order') {
      return res.status(200).json({
        success: true, testOnly: true, paymentCreated: false,
        id: row.id, orderNumber: row.order_number, reused: wasReused,
        subtotal: quote.subtotal, shipping: quote.shipping, total: quote.total,
        paymentStatus: row.payment_status,
        message: 'Pedido pendente de teste registrado. Nenhuma cobrança criada.'
      });
    }

    // Explicit separate opt-in; never fall back to the live token.
    if (process.env.PULSAR_ENABLE_MP_TEST_CHECKOUT !== 'true') {
      return res.status(503).json({ error: 'Criação de pagamentos de teste ainda não habilitada na Vercel.' });
    }
    const token = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim();
    const sellerId = process.env.PULSAR_MP_TEST_SELLER_ID?.trim();
    if (!token || !sellerId || !/^\d+$/.test(sellerId)) {
      return res.status(503).json({ error: 'Credenciais da conta vendedora de TESTE incompletas.' });
    }
    if (row.payment_status !== 'pending') {
      return res.status(409).json({ error: 'Pedido já não está pendente.' });
    }
    const identity = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!identity.ok) return res.status(502).json({ error: 'Token do vendedor de teste foi recusado.' });
    const seller = await identity.json();
    if (String(seller.id) !== sellerId) {
      return res.status(403).json({ error: 'Token não pertence ao vendedor de teste esperado.' });
    }
    // Retry of an already-created preference is read-only.
    if (row.mercado_pago_preference_id) {
      const get = await fetch('https://api.mercadopago.com/checkout/preferences/' +
        encodeURIComponent(row.mercado_pago_preference_id), {
        headers: { Authorization: 'Bearer ' + token },
        signal: AbortSignal.timeout(8000), cache: 'no-store'
      });
      if (!get.ok) return res.status(503).json({ error: 'Preferência existente não pode ser consultada.' });
      const pref = await get.json();
      return res.status(200).json({ success: true, testOnly: true, reused: true,
        id: row.id, preferenceId: pref.id, checkoutUrl: pref.init_point });
    }
    // Prevent parallel attempts: one request claims a row before calling MP.
    const claim = await auth.db.from('orders')
      .update({ mercado_pago_preference_id: 'creating:' + randomUUID() })
      .eq('id', row.id).is('mercado_pago_preference_id', null)
      .eq('payment_status', 'pending')
      .select('id,mercado_pago_preference_id').maybeSingle();
    if (claim.error || !claim.data) {
      return res.status(409).json({ error: 'Uma preferência já está sendo preparada. Tente consultar novamente.' });
    }
    const claimId = claim.data.mercado_pago_preference_id;
    const host = process.env.VERCEL_URL;
    if (!host || !/^[a-z0-9.-]+\.vercel\.app$/.test(host)) {
      return res.status(503).json({ error: 'URL de Preview indisponível.' });
    }
    // The Mercado Pago API still returns init_point for test preferences;
    // do not use obsolete sandbox_init_point links.
    const items = quote.lines.map(line => ({
      id: line.id, title: line.name.slice(0, 255),
      quantity: line.quantity, currency_id: 'BRL', unit_price: line.unitPrice
    }));
    items.push({ id: 'shipping', title: 'Frete ' + quote.shipping.service,
      quantity: 1, currency_id: 'BRL', unit_price: quote.shipping.price });
    try {
      const mp = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items, external_reference: row.order_number,
          back_urls: {
            success: 'https://' + host + '/?payment=success',
            pending: 'https://' + host + '/?payment=pending',
            failure: 'https://' + host + '/?payment=failure'
          },
          notification_url: 'https://' + host + '/api/mercadopago/webhook'
        }),
        signal: AbortSignal.timeout(10000),
        cache: 'no-store'
      });
      if (!mp.ok) {
        await auth.db.from('orders').update({ mercado_pago_preference_id: null })
          .eq('id',row.id).eq('mercado_pago_preference_id',claimId);
        return res.status(502).json({ error: 'Mercado Pago recusou a preferência de teste.' });
      }
      const pref = await mp.json();
      if (typeof pref.id !== 'string' || typeof pref.init_point !== 'string' ||
          !/^https:\/\/(www\.)?mercadopago\.com(\.br)?\//.test(pref.init_point)) {
        return res.status(502).json({ error: 'Resposta inválida do Mercado Pago.' });
      }
      const updated = await auth.db.from('orders')
        .update({ mercado_pago_preference_id: pref.id })
        .eq('id',row.id).eq('mercado_pago_preference_id',claimId)
        .select('id').maybeSingle();
      if (updated.error || !updated.data) {
        return res.status(503).json({ error: 'Preferência criada, mas associação do pedido falhou. Não reutilize a tentativa.' });
      }
      return res.status(200).json({
        success: true, testOnly: true, id: row.id,
        orderNumber: row.order_number, preferenceId: pref.id,
        checkoutUrl: pref.init_point, total: quote.total, paymentStatus: 'pending'
      });
    } catch {
      // Do not clear the claim if the upstream call outcome is uncertain.
      return res.status(503).json({ error: 'Não foi possível confirmar a criação da preferência. Não repita o pagamento.' });
    }
  } catch (error) {
    console.error('Checkout test flow failure', error instanceof Error ? error.name : 'unknown');
    return res.status(error instanceof CheckoutError ? error.status : 503)
      .json({ error: error instanceof CheckoutError ? error.message :
        error instanceof Error && /^(Invalid|Verified|Discount|Line)/.test(error.message)
          ? 'Dados de pedido inválidos.' : 'Checkout de teste temporariamente indisponível.' });
  }
}
