/** No network or database access. Authenticated upstream responses only. */
export function merchantOrderMatchesPayment(
  merchantOrder: any,
  merchantOrderId: string,
  paymentId: string,
  paymentAmount: number,
  preferenceId: string,
  externalReference: string
): boolean {
  if (!merchantOrder || typeof merchantOrder !== 'object' ||
      !Number.isFinite(paymentAmount) || paymentAmount <= 0 ||
      !preferenceId || !externalReference ||
      String(merchantOrder.id) !== merchantOrderId ||
      String(merchantOrder.preference_id) !== preferenceId ||
      merchantOrder.external_reference !== externalReference ||
      !Array.isArray(merchantOrder.payments)) return false;
  return merchantOrder.payments.some((entry: any) =>
    entry != null && String(entry.id) === paymentId &&
    entry.status === 'approved' &&
    entry.currency_id === 'BRL' &&
    Number(entry.transaction_amount) === paymentAmount
  );
}
