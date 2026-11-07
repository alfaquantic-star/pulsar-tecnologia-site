import { createHash, randomUUID } from 'node:crypto';

/**
 * Server-only building block for a FUTURE pending-order API.
 *
 * This module never calls a provider or writes to Supabase. Its caller MUST
 * first re-read catalog and inventory, re-quote shipping, validate customer
 * address, enforce an authenticated/rate-limited checkout flow, and apply
 * any server-side coupon policy. Do not use data straight from req.body.
 */
export type VerifiedCheckout = {
  lines: Array<{
    id: string;
    kind: 'product' | 'kit';
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  shipping: {
    id: string;
    carrier: string;
    service: string;
    priceCents: number;
  };
  discountCents: number; // Must be computed using server-owned rules.
  customer: {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
  };
  address: {
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
  };
};

const nonempty = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const validCents = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 100000000;
const fail = (message: string): never => { throw new Error(message); };

export function buildPendingOrderDraft(
  verified: VerifiedCheckout, idempotencyKey: string, verifiedCustomerId?: string
) {
  // Only server-verified Supabase Auth UUIDs can be passed in this third argument.
  // The HTTP caller must never be permitted to supply it as a request body field.
  if (verifiedCustomerId !== undefined &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedCustomerId)) {
    fail('Invalid authenticated customer UUID');
  }
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idempotencyKey)) fail('Invalid idempotency key');
  if (!verified || !Array.isArray(verified.lines) || !verified.lines.length || verified.lines.length > 20) {
    fail('Verified cart required');
  }
  const customer = verified.customer, address = verified.address;
  if (!customer || !nonempty(customer.fullName, 160) ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email) ||
      !nonempty(customer.phone, 40) || !nonempty(customer.cpf, 24)) fail('Invalid customer data');
  if (!address || !/^\d{8}$/.test(address.zipCode.replace(/\D/g, '')) ||
      !nonempty(address.street, 200) || !nonempty(address.number, 30) ||
      !nonempty(address.neighborhood, 120) || !nonempty(address.city, 120) ||
      !/^[A-Z]{2}$/.test(address.state)) fail('Invalid validated address');
  let subtotalCents = 0;
  const items = verified.lines.map((line) => {
    if (!nonempty(line.id, 128) || !nonempty(line.name, 255) ||
        !['product','kit'].includes(line.kind) ||
        !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100 ||
        !validCents(line.unitPriceCents) || line.unitPriceCents === 0) {
      return fail('Invalid verified product line');
    }
    const totalPriceCents = line.unitPriceCents * line.quantity;
    if (!Number.isSafeInteger(totalPriceCents)) fail('Line total overflow');
    subtotalCents += totalPriceCents;
    return {
      id: line.id,
      kind: line.kind,
      name: line.name,
      quantity: line.quantity,
      unit_price: line.unitPriceCents / 100,
      total_price: totalPriceCents / 100
    };
  });
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 100000000) fail('Invalid subtotal');
  if (!verified.shipping || !nonempty(verified.shipping.id, 80) ||
      !nonempty(verified.shipping.carrier, 120) || !nonempty(verified.shipping.service, 120) ||
      !validCents(verified.shipping.priceCents) || !validCents(verified.discountCents)) {
    fail('Verified freight and discount required');
  }
  if (verified.discountCents > subtotalCents + verified.shipping.priceCents) fail('Discount exceeds total');
  const finalCents = subtotalCents + verified.shipping.priceCents - verified.discountCents;
  if (!Number.isSafeInteger(finalCents) || finalCents <= 0) fail('Invalid final total');

  // Stable reference for repeated submissions using this key.
  // The same idempotency key must NEVER be allowed to refer to a
  // different verified cart, shipping choice, discount or customer.
  // A future atomic DB insert/retry must compare this fingerprint.
  const checkoutPayloadHash = createHash('sha256').update(JSON.stringify({
    items, customer: { name: customer.fullName.trim(), email: customer.email.trim().toLowerCase(),
      phone: customer.phone.trim(), cpf: customer.cpf.trim() },
    address: { ...address, zipCode: address.zipCode.replace(/\D/g,'') },
    shipping: verified.shipping,
    discountCents: verified.discountCents,
    subtotalCents,
    finalCents,
    ...(verifiedCustomerId ? { authenticatedCustomerId: verifiedCustomerId } : {})
  })).digest('hex');
  const hash = createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 24);
  return {
    id: 'ord-' + randomUUID(),
    order_number: 'PLS-' + hash.toUpperCase(),
    checkout_idempotency_key: idempotencyKey,
    checkout_payload_hash: checkoutPayloadHash,
    customer_name: customer.fullName.trim(),
    customer_email: customer.email.trim().toLowerCase(),
    customer_id: verifiedCustomerId ?? null,
    customer_phone: customer.phone.trim(),
    customer_cpf: customer.cpf.trim(),
    shipping_address: { ...address, zipCode: address.zipCode.replace(/\D/g,'') },
    items,
    subtotal: subtotalCents / 100,
    discount_amount: verified.discountCents / 100,
    shipping_price: verified.shipping.priceCents / 100,
    total_amount: finalCents / 100,
    payment_method: 'mercadopago' as const,
    payment_status: 'pending' as const,
    shipping_carrier: verified.shipping.carrier,
    shipping_service: verified.shipping.service,
    shipping_service_id: verified.shipping.id,
    mercado_pago_preference_id: null,
    mercado_pago_payment_id: null,
    payment_verified_at: null
  };
}
