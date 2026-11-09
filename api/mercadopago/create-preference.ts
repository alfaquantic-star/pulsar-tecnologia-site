import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAdmin, verifyCustomerIdentity, adminDatabase } from '../_lib/admin-auth.js';
import { verifyCheckout, CheckoutError } from '../_lib/verify-checkout.js';
import { calculateAdminCouponDiscountCents } from '../_lib/coupons.js';
import { buildPendingOrderDraft } from '../_lib/pending-order.js';
import { merchantOrderMatchesPayment } from '../_lib/mp-merchant-order.js';
import { isConfirmedTestUserPayment } from '../_lib/mp-test-user-identity.js';
import { parseTestWebhookUrl, isPublicWebhookReachable } from '../_lib/mp-test-webhook-url.js';

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
    const body = req.body;
    const action = body?.action;
    const customerStage = action === 'stage_customer_test_order';
    // This action cannot run until manually opted in for Preview testing.
    // It NEVER creates a payment preference or charges a customer.
    if (customerStage && process.env.PULSAR_ENABLE_CUSTOMER_TEST_STAGING !== 'true') {
      return res.status(503).json({ error: 'Vinculação de pedidos de teste ainda desativada.' });
    }
    const verifiedCustomer = customerStage ? await verifyCustomerIdentity(req) : null;
    if (customerStage && !verifiedCustomer) {
      return res.status(403).json({ error: 'Conta de cliente verificada necessária.' });
    }
    const auth = customerStage
      ? { db: adminDatabase() }
      : await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Acesso administrativo necessário.' });
    // Recover an already completed TEST payment when notifications are
    // unavailable. Admin authentication and seller-only test credentials
    // are mandatory; this never relies on a browser's success URL.
    if (action === 'verify_test_payment') {
      if (process.env.PULSAR_ENABLE_MP_TEST_CHECKOUT !== 'true' ||
          !process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim() ||
          !/^\d+$/.test(process.env.PULSAR_MP_TEST_SELLER_ID || '')) {
        return res.status(503).json({ error: 'Conta de teste não configurada.' });
      }
      const paymentId = String(body?.paymentId ?? '').trim();
      const orderNumber = String(body?.orderNumber ?? '').trim();
      if (!/^\d{7,24}$/.test(paymentId) ||
          !/^PLS-[0-9A-F]{24}$/.test(orderNumber)) {
        return res.status(400).json({ error: 'Informe o número do pedido e o ID numérico do pagamento de teste.' });
      }
      const db = auth.db;
      const result = await db.from('orders')
        .select('id,order_number,total_amount,payment_status,mercado_pago_preference_id,mercado_pago_payment_id')
        .eq('order_number', orderNumber).maybeSingle();
      if (result.error || !result.data) {
        return res.status(404).json({ error: 'Pedido de teste não encontrado.' });
      }
      const order = result.data;
      if (!order.mercado_pago_preference_id ||
          order.mercado_pago_preference_id.startsWith('creating:')) {
        return res.status(409).json({ error: 'O pedido não possui uma preferência válida.' });
      }
      const token = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN!.trim();
      const sellerId = process.env.PULSAR_MP_TEST_SELLER_ID!.trim();
      const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
      const [sellerResponse, paymentResponse] = await Promise.all([
        fetch('https://api.mercadolibre.com/users/me', {
          headers, signal: AbortSignal.timeout(10000), cache: 'no-store'
        }),
        fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
          headers, signal: AbortSignal.timeout(10000), cache: 'no-store'
        })
      ]);
      if (!sellerResponse.ok || !paymentResponse.ok) {
        return res.status(502).json({ error: 'Mercado Pago não disponibilizou os dados do vendedor ou do pagamento.' });
      }
      const seller = await sellerResponse.json();
      const payment = await paymentResponse.json();
      // Give the ADMIN a safe, specific failure reason without exposing
      // token, personal details, provider response or secret credentials.
      const checks = {
        testSellerTokenMatchesConfiguredId: String(seller.id) === sellerId,
        paymentBelongsToTestSeller: String(payment.collector_id) === sellerId,
        paymentIdMatches: String(payment.id) === paymentId,
        paymentIsSafeTestTransaction: isConfirmedTestUserPayment({
          liveMode: payment.live_mode,
          payerId: payment.payer?.id,
          collectorId: payment.collector_id,
          authenticatedSellerId: seller.id,
          configuredSellerId: sellerId,
          configuredBuyerId: process.env.PULSAR_MP_TEST_BUYER_ID,
          accessToken: token
        }),
        currencyIsBRL: payment.currency_id === 'BRL',
        paymentReferencesOrder: payment.external_reference === orderNumber,
        paymentApproved: payment.status === 'approved',
        amountMatchesOrder: Number.isFinite(Number(payment.transaction_amount)) &&
          Math.round(Number(payment.transaction_amount) * 100) ===
            Math.round(Number(order.total_amount) * 100)
      };
      if (Object.values(checks).some(ok => !ok)) {
        return res.status(422).json({
          error: 'O Mercado Pago não confirmou todos os requisitos. Nenhuma alteração foi feita no pedido.',
          checks,
          testBuyerIdConfigured: /^\d{6,24}$/.test(process.env.PULSAR_MP_TEST_BUYER_ID || ''),
          testBuyerIdentityMatched: String(payment.payer?.id) === String(process.env.PULSAR_MP_TEST_BUYER_ID || ''),
          statusCategory: payment.status === 'approved' ? 'approved' : 'not_approved'
        });
      }
      const merchantOrderId = String(payment.order?.id ?? '');
      if (!/^\d{1,24}$/.test(merchantOrderId)) {
        return res.status(422).json({ error: 'Pagamento sem referência ao pedido comercial do Mercado Pago.' });
      }
      const merchantResponse = await fetch('https://api.mercadopago.com/merchant_orders/' + merchantOrderId, {
        headers, signal: AbortSignal.timeout(10000), cache: 'no-store'
      });
      if (!merchantResponse.ok) {
        return res.status(503).json({ error: 'Não foi possível consultar o pedido comercial do Mercado Pago.' });
      }
      const merchant = await merchantResponse.json();
      if (!merchantOrderMatchesPayment(
        merchant, merchantOrderId, paymentId, Number(payment.transaction_amount),
        order.mercado_pago_preference_id, orderNumber
      )) {
        return res.status(422).json({ error: 'A preferência ou o pedido comercial não corresponde ao pagamento.' });
      }
      if (order.payment_status === 'approved') {
        if (String(order.mercado_pago_payment_id) !== paymentId) {
          return res.status(409).json({ error: 'Este pedido já possui outro pagamento aprovado.' });
        }
        return res.status(200).json({ success: true, alreadyVerified: true,
          paymentStatus: 'approved', orderNumber,
          message: 'Pagamento de teste já confirmado anteriormente.' });
      }
      if (order.payment_status !== 'pending') {
        return res.status(409).json({ error: 'Pedido já não está pendente.' });
      }
      const change = await db.from('orders').update({
        payment_status: 'approved', mercado_pago_payment_id: paymentId,
        payment_verified_at: new Date().toISOString()
      }).eq('id',order.id).eq('payment_status','pending')
        .is('mercado_pago_payment_id',null)
        .eq('total_amount',Number(order.total_amount))
        .select('id').maybeSingle();
      if (change.error) {
        return res.status(503).json({ error: 'Não foi possível registrar a verificação no Supabase.' });
      }
      if (!change.data) {
        return res.status(409).json({ error: 'O pedido mudou de status durante a verificação. Consulte novamente.' });
      }
      return res.status(200).json({ success: true, testOnly: true,
        paymentStatus: 'approved', orderNumber,
        message: 'Pagamento conferido diretamente no Mercado Pago e registrado no Supabase.' });
    }

    if (action !== 'stage_order' && action !== 'create_test_preference' && !customerStage) {
      return res.status(400).json({ error: 'Ação de teste inválida.' });
    }
    // Fail closed BEFORE writing any pending order if the preference test
    // is not explicitly enabled for a dedicated test seller.
    if (action === 'create_test_preference' &&
        (process.env.PULSAR_ENABLE_MP_TEST_CHECKOUT !== 'true' ||
         !process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim() ||
         !/^\d+$/.test(process.env.PULSAR_MP_TEST_SELLER_ID || ''))) {
      return res.status(503).json({ error: 'Conta vendedora de teste ainda não habilitada na Vercel. Nenhum pedido foi criado.' });
    }
    // Verify a PUBLIC notification URL before staging any order. Provider
    // requests cannot carry Vercel's private Preview automation bypass.
    let verifiedTestWebhookUrl: URL | null = null;
    if (action === 'create_test_preference') {
      verifiedTestWebhookUrl = parseTestWebhookUrl(process.env.PULSAR_MP_TEST_WEBHOOK_URL);
      if (!verifiedTestWebhookUrl ||
          !await isPublicWebhookReachable(verifiedTestWebhookUrl)) {
        return res.status(503).json({
          error: 'Webhook de teste Supabase indisponível. Configure PULSAR_MP_TEST_WEBHOOK_URL para a Edge Function pública de testes e confirme que ela valida assinaturas antes de criar outra preferência.'
        });
      }
    }
    if (body.coupon && String(body.coupon).trim()) {
      return res.status(422).json({ error: 'Cupons ainda não autorizados pelo backend. Retire o cupom para testar.' });
    }
    // Only an authenticated Admin can authorize a coupon for a staged,
    // UNPAID Preview order. Never apply one to customer staging or payments.
    const rawAdminCouponCode = body.adminCouponCode;
    if (rawAdminCouponCode !== undefined && rawAdminCouponCode !== null &&
        (typeof rawAdminCouponCode !== 'string' || !/^[A-Z0-9_-]{4,24}$/.test(rawAdminCouponCode))) {
      return res.status(400).json({ error: 'Código administrativo de cupom inválido.' });
    }
    const adminCouponCode: string = typeof rawAdminCouponCode === 'string' ? rawAdminCouponCode : '';
    if (adminCouponCode && action !== 'stage_order') {
      return res.status(403).json({ error: 'Desconto administrativo só pode ser usado em pedido pendente de TESTE, sem pagamento.' });
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
    // Only a verified Supabase Auth session can own a customer order.
    // Never accept a customer UUID from request body or a typed email alone.
    if (customerStage &&
        String(body.customer.email || '').trim().toLowerCase() !==
          verifiedCustomer!.email?.trim().toLowerCase()) {
      return res.status(403).json({ error: 'O e-mail do pedido precisa corresponder à conta verificada.' });
    }
    // Admin-selected coupon is fetched and checked using privileged server DB.
    // Its discount never comes from a client-entered amount.
    let adminDiscountCents = 0;
    if (adminCouponCode) {
      const { data: coupon, error: couponError } = await auth.db
        .from('pulsar_admin_coupons')
        .select('discount_type,discount_value,is_active,starts_at,expires_at')
        .eq('code', adminCouponCode)
        .maybeSingle();
      if (couponError) return res.status(503).json({ error: 'Regras de cupons indisponíveis.' });
      if (!coupon) return res.status(422).json({ error: 'Cupom administrativo não encontrado.' });
      try {
        adminDiscountCents = calculateAdminCouponDiscountCents(coupon, Math.round(quote.subtotal * 100));
      } catch {
        return res.status(422).json({ error: 'Cupom inativo, expirado ou com desconto inválido.' });
      }
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
      discountCents: adminDiscountCents,
      customer: body.customer,
      address: body.address
    };
    const draft = buildPendingOrderDraft(verified, key, customerStage ? verifiedCustomer!.id : undefined);
    const { data: inserted, error: insertError } = await auth.db.from('orders')
      .insert(draft).select('id,order_number,customer_id,checkout_payload_hash,payment_status,mercado_pago_preference_id')
      .single();
    let row = inserted;
    let wasReused = false;
    if (insertError) {
      if (insertError.code !== '23505') {
        console.error('Checkout staging insert rejected', insertError.code);
        return res.status(503).json({ error: 'Não foi possível registrar o pedido pendente.' });
      }
      const existing = await auth.db.from('orders')
        .select('id,order_number,customer_id,checkout_payload_hash,payment_status,mercado_pago_preference_id')
        .eq('checkout_idempotency_key', key).maybeSingle();
      if (existing.error || !existing.data) {
        return res.status(409).json({ error: 'Já existe uma tentativa com este identificador.' });
      }
      if (existing.data.checkout_payload_hash !== draft.checkout_payload_hash ||
          existing.data.customer_id !== draft.customer_id) {
        return res.status(409).json({ error: 'Esta tentativa já foi usada com outro carrinho, frete ou cliente.' });
      }
      row = existing.data;
      wasReused = true;
    }
    if (!row) return res.status(503).json({ error: 'Pedido indisponível.' });

    // Stage-only is safe: does not create a Mercado Pago preference or reserve stock.
    if (action === 'stage_order' || customerStage) {
      return res.status(200).json({
        success: true, testOnly: true, paymentCreated: false,
        id: row.id, orderNumber: row.order_number, reused: wasReused,
        subtotal: quote.subtotal, shipping: quote.shipping,
        discount: adminDiscountCents / 100,
        total: (Math.round(quote.total * 100) - adminDiscountCents) / 100,
        paymentStatus: row.payment_status,
        message: 'Pedido pendente de teste registrado. Nenhuma cobrança criada.'
      });
    }

    // The dedicated seller test credentials have already been checked
    // before any database write.
    const token = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN!.trim();
    const sellerId = process.env.PULSAR_MP_TEST_SELLER_ID!.trim();
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
          notification_url: verifiedTestWebhookUrl!.toString()
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
