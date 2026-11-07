/**
 * Pure, provider-response validation for the TEST payment queue.
 * A signed webhook alone is NEVER evidence of an approved payment.
 */
export interface QueuedPaymentInput {
  paymentId: string;
  sellerId: string;
  buyerId: string;
  payment: Record<string, any>;
  seller: Record<string, any>;
  merchantOrder: Record<string, any>;
  order: Record<string, any> | null;
}
export function validateQueuedSandboxPayment(i: QueuedPaymentInput):
  'pending' | 'already_approved' | 'not_approved' | 'invalid' {
  const { paymentId, sellerId, buyerId, payment, seller, merchantOrder, order } = i;
  if (!/^\d{1,24}$/.test(paymentId) ||
      !/^\d{6,24}$/.test(sellerId) || !/^\d{6,24}$/.test(buyerId) ||
      sellerId === buyerId || !payment || !seller || !merchantOrder || !order)
    return 'invalid';
  if (String(payment.id) !== paymentId ||
      String(payment.collector_id) !== sellerId ||
      String(seller.id) !== sellerId ||
      String(payment.payer?.id) !== buyerId ||
      payment.currency_id !== 'BRL' ||
      (typeof payment.live_mode !== 'boolean'))
    return 'invalid';
  if (payment.status !== 'approved') return 'not_approved';
  const reference = payment.external_reference;
  if (typeof reference !== 'string' || !/^PLS-[A-F0-9]{24}$/.test(reference) ||
      reference !== order.order_number ||
      typeof order.mercado_pago_preference_id !== 'string' ||
      !order.mercado_pago_preference_id ||
      order.mercado_pago_preference_id.startsWith('creating:'))
    return 'invalid';
  const amount = Number(payment.transaction_amount);
  const expected = Number(order.total_amount);
  if (!Number.isFinite(amount) || !Number.isFinite(expected) ||
      amount <= 0 || expected <= 0 ||
      Math.round(amount * 100) !== Math.round(expected * 100)) return 'invalid';
  const merchantId = String(payment.order?.id ?? '');
  if (!/^\d{1,24}$/.test(merchantId) ||
      String(merchantOrder.id) !== merchantId ||
      merchantOrder.external_reference !== reference ||
      String(merchantOrder.preference_id) !== order.mercado_pago_preference_id ||
      !Array.isArray(merchantOrder.payments) ||
      !merchantOrder.payments.some((p: any) =>
        String(p?.id) === paymentId && p.status === 'approved' &&
        p.currency_id === 'BRL' &&
        Math.round(Number(p.transaction_amount) * 100) === Math.round(amount * 100)))
    return 'invalid';
  if (order.payment_status === 'approved' &&
      String(order.mercado_pago_payment_id) === paymentId) return 'already_approved';
  if (order.payment_status === 'pending' &&
      order.mercado_pago_payment_id == null) return 'pending';
  return 'invalid';
}
