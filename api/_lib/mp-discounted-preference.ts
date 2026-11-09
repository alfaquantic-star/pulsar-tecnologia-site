/**
 * Build a Mercado Pago test preference from immutable SERVER-VERIFIED amounts.
 * A Mercado Pago item's quantity is 1, so proportional discounts with fractional
 * cents never cause discrepancies between quantity × unit_price and order total.
 */
export type VerifiedPaymentLine = {
  id: string; name: string; quantity: number; unitPriceCents: number;
};
type PreferenceLine = {
  id: string; title: string; quantity: number; currency_id: 'BRL'; unit_price: number;
};
const validCents = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000;
export function buildDiscountedTestPreference(
  lines: VerifiedPaymentLine[],
  shipping: { service: string; priceCents: number },
  discountCents: number
): { items: PreferenceLine[]; totalCents: number; subtotalCents: number } {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20 ||
      !validCents(discountCents) || !validCents(shipping?.priceCents) ||
      shipping.priceCents <= 0 || typeof shipping.service !== 'string') {
    throw new Error('invalid_verified_payment');
  }
  const totals: number[] = [];
  let subtotalCents = 0;
  for (const line of lines) {
    if (!line || typeof line.id !== 'string' || !line.id || typeof line.name !== 'string' || !line.name ||
        !Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 100 ||
        !validCents(line.unitPriceCents) || line.unitPriceCents <= 0) {
      throw new Error('invalid_verified_line');
    }
    const total = line.unitPriceCents * line.quantity;
    if (!validCents(total)) throw new Error('line_overflow');
    totals.push(total);
    subtotalCents += total;
  }
  if (!validCents(subtotalCents) || discountCents >= subtotalCents) {
    // Do not send a shipping-only preference for 100%-off products.
    throw new Error('discount_exhausts_products');
  }
  // Allocate a proportional discount in cents, deterministically, with a
  // remainder that cannot exceed each line's verified amount.
  const discounts = totals.map(line => Math.floor(discountCents * line / subtotalCents));
  let remainingCents = discountCents - discounts.reduce((sum, n) => sum + n, 0);
  // Largest-remainder style adjustment, never allocating beyond a line total.
  for (let i = 0; i < totals.length && remainingCents > 0; i++) {
    if (discounts[i] < totals[i]) {
      discounts[i]++;
      remainingCents--;
    }
  }
  if (remainingCents !== 0) throw new Error('discount_allocation_failed');
  const items: PreferenceLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const remaining = totals[i] - discounts[i];
    if (remaining < 0) throw new Error('negative_discounted_line');
    if (remaining === 0) continue;
    items.push({
      id: lines[i].id, title: lines[i].name.slice(0, 255) + ' (qtd. ' + lines[i].quantity + ')',
      quantity: 1, currency_id: 'BRL', unit_price: remaining / 100
    });
  }
  items.push({
    id: 'shipping', title: ('Frete ' + shipping.service).slice(0, 255),
    quantity: 1, currency_id: 'BRL', unit_price: shipping.priceCents / 100
  });
  const totalCents = subtotalCents - discountCents + shipping.priceCents;
  if (!validCents(totalCents) || totalCents <= 0 ||
      Math.round(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) * 100) !== totalCents) {
    throw new Error('preference_total_mismatch');
  }
  return { items, totalCents, subtotalCents };
}
