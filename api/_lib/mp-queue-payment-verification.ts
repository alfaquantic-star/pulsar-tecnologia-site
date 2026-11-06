import { merchantOrderMatchesPayment } from './mp-merchant-order.js';
import { isConfirmedTestUserPayment } from './mp-test-user-identity.js';

/** Pure validation of untrusted provider responses. NEVER approves orders. */
export function verifyQueuedTestPayment(input: {
  paymentId: string;
  payment: any;
  seller: any;
  merchantOrder: any;
  order: any;
  sellerId: string | undefined;
  buyerId: string | undefined;
  testToken: string | undefined;
}): { verified: boolean; reason: string } {
  const { paymentId, payment, seller, merchantOrder, order, sellerId, buyerId, testToken } = input;
  if (!/^\d{1,24}$/.test(paymentId) || !/^\d{6,24}$/.test(sellerId || '') ||
      !/^\d{6,24}$/.test(buyerId || '') || !testToken || !order) {
    return { verified: false, reason: 'invalid_test_context' };
  }
  if (!payment || String(payment.id) !== paymentId || payment.status !== 'approved' ||
      payment.currency_id !== 'BRL' || String(payment.collector_id) !== sellerId ||
      String(seller?.id) !== sellerId ||
      !isConfirmedTestUserPayment({
        liveMode: payment.live_mode,
        payerId: payment.payer?.id, collectorId: payment.collector_id,
        authenticatedSellerId: seller?.id, configuredSellerId: sellerId,
        configuredBuyerId: buyerId, accessToken: testToken
      })) return { verified: false, reason: 'payment_or_test_identity_mismatch' };
  const reference = payment.external_reference;
  const amount = Number(payment.transaction_amount);
  if (typeof reference !== 'string' || !/^PLS-[0-9A-F]{24}$/.test(reference) ||
      order.order_number !== reference || payment.currency_id !== 'BRL' ||
      !Number.isFinite(amount) || amount <= 0 ||
      Math.round(amount * 100) !== Math.round(Number(order.total_amount) * 100) ||
      typeof order.mercado_pago_preference_id !== 'string' ||
      order.mercado_pago_preference_id.startsWith('creating:')) {
    return { verified: false, reason: 'order_or_amount_mismatch' };
  }
  const merchantOrderId = String(payment.order?.id ?? '');
  if (!/^\d{1,24}$/.test(merchantOrderId) ||
      !merchantOrderMatchesPayment(
        merchantOrder, merchantOrderId, paymentId, amount,
        order.mercado_pago_preference_id, reference
      )) return { verified: false, reason: 'merchant_order_mismatch' };
  if (order.payment_status !== 'pending' && !(
    order.payment_status === 'approved' && String(order.mercado_pago_payment_id) === paymentId
  )) return { verified: false, reason: 'order_state_mismatch' };
  return { verified: true, reason: order.payment_status === 'approved' ? 'already_approved' : 'eligible_pending' };
}
