-- Pulsar-only coupon configuration. Does not alter legacy shared tables.
-- Never grant direct client access: all CRUD requires verifyAdminIdentity + service role.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pulsar_admin_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{4,24}$'),
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0 AND discount_value <= 10000),
  is_active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pulsar_admin_coupons_percent_chk CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CONSTRAINT pulsar_admin_coupons_period_chk CHECK (starts_at IS NULL OR expires_at IS NULL OR expires_at > starts_at)
);
ALTER TABLE public.pulsar_admin_coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pulsar_admin_coupons FROM PUBLIC, anon, authenticated;
-- Service role has bypassrls and is only used by the server-side admin API.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pulsar_admin_coupons TO service_role;
COMMIT;
