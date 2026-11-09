/** Coupon configuration for the Pulsar admin only. No public checkout uses these records yet. */
export type CouponType = 'percent' | 'fixed';
export type CouponRecord = {
  id: string; code: string; discount_type: CouponType; discount_value: number;
  is_active: boolean; starts_at: string | null; expires_at: string | null;
  created_at?: string;
};
export function validateCouponPayload(input: unknown, mode: 'create' | 'update'): Partial<CouponRecord> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_payload');
  const data = input as Record<string, unknown>;
  const fields = ['code', 'discount_type', 'discount_value', 'is_active', 'starts_at', 'expires_at'];
  if (!Object.keys(data).length || Object.keys(data).some(k => !fields.includes(k))) throw new Error('invalid_fields');
  if (mode === 'create' && !['code','discount_type','discount_value'].every(k => k in data)) throw new Error('missing_required');
  const clean: Partial<CouponRecord> = {};
  if ('code' in data) {
    if (typeof data.code !== 'string') throw new Error('invalid_code');
    const code = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{4,24}$/.test(code)) throw new Error('invalid_code');
    clean.code = code;
  }
  if ('discount_type' in data) {
    if (data.discount_type !== 'percent' && data.discount_type !== 'fixed') throw new Error('invalid_type');
    clean.discount_type = data.discount_type;
  }
  if ('discount_value' in data) {
    if (typeof data.discount_value !== 'number' || !Number.isFinite(data.discount_value) || data.discount_value <= 0 ||
      data.discount_value > 10000 || Math.round(data.discount_value * 100) !== data.discount_value * 100) {
      throw new Error('invalid_value');
    }
    clean.discount_value = data.discount_value;
  }
  if ('is_active' in data) {
    if (typeof data.is_active !== 'boolean') throw new Error('invalid_active');
    clean.is_active = data.is_active;
  }
  for (const key of ['starts_at', 'expires_at'] as const) {
    if (key in data) {
      const value = data[key];
      if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value) ||
        !Number.isFinite(Date.parse(value)))) throw new Error('invalid_date');
      clean[key] = value as string | null;
    }
  }
  if (clean.discount_type === 'percent' && clean.discount_value !== undefined && clean.discount_value > 100) throw new Error('percent_over_100');
  if (clean.starts_at && clean.expires_at && clean.expires_at <= clean.starts_at) throw new Error('invalid_period');
  return clean;
}

/**
 * A server-validated promotion for one admin-created PREVIEW pending order.
 * Prices and subtotal MUST come from verifyCheckout, not the browser.
 * This does not activate customer coupons or payment collection.
 */
export function calculateAdminCouponDiscountCents(
  coupon: Pick<CouponRecord, 'discount_type' | 'discount_value' | 'is_active' | 'starts_at' | 'expires_at'>,
  subtotalCents: number,
  now: Date = new Date()
): number {
  if (!coupon.is_active) throw new Error('coupon_inactive');
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) throw new Error('invalid_subtotal');
  if (!Number.isFinite(now.getTime())) throw new Error('invalid_clock');
  if (coupon.starts_at !== null && (!Number.isFinite(Date.parse(coupon.starts_at)) ||
      now.getTime() < Date.parse(coupon.starts_at))) throw new Error('coupon_not_started');
  if (coupon.expires_at !== null && (!Number.isFinite(Date.parse(coupon.expires_at)) ||
      now.getTime() >= Date.parse(coupon.expires_at))) throw new Error('coupon_expired');
  const value = Number(coupon.discount_value);
  if (!Number.isFinite(value) || value <= 0 || Math.round(value * 100) !== value * 100) throw new Error('coupon_invalid_value');
  if (coupon.discount_type === 'percent' && value > 0 && value <= 100) {
    // Round only after using integer cents so the payment total stays exact.
    return Math.min(subtotalCents, Math.round(subtotalCents * value / 100));
  }
  if (coupon.discount_type === 'fixed' && value > 0 && value <= 10000) {
    return Math.min(subtotalCents, Math.round(value * 100));
  }
  throw new Error('coupon_invalid_type');
}
