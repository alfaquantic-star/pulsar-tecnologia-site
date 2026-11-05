/**
 * Mercado Pago Checkout Pro test user payments use the regular MP API.
 * live_mode alone is not an identity check for a test user purchase.
 * This function FAILS CLOSED unless buyer & seller identities explicitly
 * configured on the server match the authenticated payment record.
 */
export function isConfirmedTestUserPayment(args: {
  liveMode: unknown;
  payerId: unknown;
  collectorId: unknown;
  authenticatedSellerId: unknown;
  configuredSellerId: string | undefined;
  configuredBuyerId: string | undefined;
  accessToken: string | undefined;
}): boolean {
  const { liveMode, payerId, collectorId, authenticatedSellerId,
    configuredSellerId, configuredBuyerId, accessToken } = args;
  if (liveMode === false) return true;
  if (!/^[0-9]{6,24}$/.test(configuredBuyerId || '') ||
      !/^[0-9]{6,24}$/.test(configuredSellerId || '') ||
      !accessToken?.startsWith('APP_USR-') ||
      configuredBuyerId === configuredSellerId) return false;
  return String(payerId) === configuredBuyerId &&
    String(collectorId) === configuredSellerId &&
    String(authenticatedSellerId) === configuredSellerId;
}
