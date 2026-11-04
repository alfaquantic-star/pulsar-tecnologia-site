-- Pulsar: prepared order lifecycle and idempotency schema.
-- DO NOT APPLY TO SHARED PRODUCTION YET.
-- This migration is intentionally separate from the pending RLS cutover.
-- Create an approved backup and coordinate frontend/backend rollout first.
BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS checkout_idempotency_key text,
  ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text,
  ADD COLUMN IF NOT EXISTS shipping_service_id text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;

-- Existing production rows are retained and do not require backfill now.
CREATE UNIQUE INDEX IF NOT EXISTS pulsar_orders_order_number_uniq
  ON public.orders (order_number) WHERE order_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pulsar_orders_idempotency_uniq
  ON public.orders (checkout_idempotency_key) WHERE checkout_idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pulsar_orders_mp_preference_uniq
  ON public.orders (mercado_pago_preference_id) WHERE mercado_pago_preference_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pulsar_orders_mp_payment_uniq
  ON public.orders (mercado_pago_payment_id) WHERE mercado_pago_payment_id IS NOT NULL;

-- Protection against accidental approval is enforced at the API boundary.
-- A later verified webhook must use an atomic conditional update of a
-- pending order after checking payment owner, amount, currency and status.
COMMIT;
