-- Pulsar Tecnologia: prepare safe least-privilege RLS.
-- WARNING: DO NOT EXECUTE UNTIL LEGACY PRODUCTION HAS BEEN MIGRATED.
-- The production branch may still read site_settings or write tables directly.
-- Take a database backup, verify Preview frontend and backend, and schedule a cutover.
--
-- Security model:
--  - anon/authenticated can SELECT active products and active kits only
--  - unit cost is never available through the public catalog
--  - no browser read or write of orders or site_settings
--  - server-side service_role APIs check Supabase Auth + app_metadata.role
BEGIN;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive rules, which would otherwise override restrictive ones.
DROP POLICY IF EXISTS "Gerenciamento completo produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Gerenciamento completo kits" ON public.kits;
DROP POLICY IF EXISTS "Leitura pública de kits" ON public.kits;
DROP POLICY IF EXISTS "Gerenciamento completo pedidos" ON public.orders;
DROP POLICY IF EXISTS "Inserção de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Leitura de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Gerenciamento completo configurações" ON public.site_settings;
DROP POLICY IF EXISTS "Leitura pública de configurações" ON public.site_settings;
DROP POLICY IF EXISTS "catalog_products_public_read" ON public.products;
DROP POLICY IF EXISTS "catalog_kits_public_read" ON public.kits;

-- No public table-wide access, and no direct browser writes.
REVOKE ALL PRIVILEGES ON TABLE
  public.products, public.kits, public.orders, public.site_settings
  FROM PUBLIC, anon, authenticated;

-- Granular public SELECT. Do not expose products.cost.
GRANT SELECT (
  id, name, slug, short_description, detailed_description, sale_price,
  promo_price, stock, track_stock, sku, category, chip_type,
  height_cm, width_cm, length_cm, weight_grams,
  is_active, is_featured, is_best_seller, rating, reviews_count,
  badge, images, created_at, updated_at
) ON public.products TO anon, authenticated;

-- Kits do not contain private credential columns.
GRANT SELECT ON public.kits TO anon, authenticated;

CREATE POLICY catalog_products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

CREATE POLICY catalog_kits_public_read ON public.kits
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

-- No SELECT/INSERT/UPDATE/DELETE policies or grants for orders/site_settings
-- to anon/authenticated. Service-role server functions bypass RLS.
COMMIT;

-- Post-deployment: verify pg_policies + has_table_privilege() for each role,
-- assert public active catalog works and private API writes return 401/403,
-- then test admin catalog and CMS with a dedicated test record.
