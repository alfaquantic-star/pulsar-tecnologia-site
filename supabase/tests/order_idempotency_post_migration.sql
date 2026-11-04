-- Pulsar Tecnologia: read-only order-schema verification after staging migration.
-- Intended for an isolated Supabase development branch after migration
-- 20261104_prepare_order_idempotency.sql has been applied there.
-- Do NOT execute the migration on the shared production database.
DO $$
DECLARE
  col text;
  idx text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'order_number','checkout_idempotency_key','mercado_pago_preference_id',
    'shipping_service_id','payment_verified_at'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='orders' AND column_name=col
    ) THEN
      RAISE EXCEPTION 'Missing checkout order column: %', col;
    END IF;
  END LOOP;

  FOREACH idx IN ARRAY ARRAY[
    'pulsar_orders_order_number_uniq',
    'pulsar_orders_idempotency_uniq',
    'pulsar_orders_mp_preference_uniq',
    'pulsar_orders_mp_payment_uniq'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname='public' AND tablename='orders'
        AND indexname=idx AND indexdef ILIKE '%UNIQUE INDEX%'
    ) THEN
      RAISE EXCEPTION 'Missing unique checkout index: %', idx;
    END IF;
  END LOOP;
END $$;

-- This read-only query helps reviewers confirm that the existing order
-- population is unchanged after the migration.
SELECT count(*) AS order_count,
  count(*) FILTER (WHERE payment_status='approved') AS approved_order_count
FROM public.orders;
