-- REVIEW REQUIRED. Not automatically applied. Existing clients relying on direct
-- writes to public tables will stop working. Run in a planned maintenance window
-- only after server routes are integrated and smoke-tested.
BEGIN;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gerenciamento completo produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Gerenciamento completo kits" ON public.kits;
DROP POLICY IF EXISTS "Leitura pública de kits" ON public.kits;
DROP POLICY IF EXISTS "Gerenciamento completo pedidos" ON public.orders;
DROP POLICY IF EXISTS "Inserção de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Leitura de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Gerenciamento completo configurações" ON public.site_settings;
DROP POLICY IF EXISTS "Leitura pública de configurações" ON public.site_settings;

REVOKE ALL ON public.products, public.kits, public.orders, public.site_settings FROM PUBLIC, anon, authenticated;
-- Public catalog columns ONLY; prices and stock can be read, never written.
-- Internal cost is deliberately excluded.
GRANT SELECT (id, name, slug, short_description, detailed_description,
 sale_price, promo_price, stock, track_stock, sku, category, chip_type,
 height_cm, width_cm, length_cm, weight_grams, is_active, is_featured,
 is_best_seller, rating, reviews_count, badge, images, created_at,
 updated_at) ON public.products TO anon, authenticated;
GRANT SELECT ON public.kits TO anon, authenticated;

CREATE POLICY catalog_products_public_read ON public.products
 FOR SELECT TO anon, authenticated USING (is_active IS TRUE);
CREATE POLICY catalog_kits_public_read ON public.kits
 FOR SELECT TO anon, authenticated USING (is_active IS TRUE);
-- Orders and site_settings have no anonymous or authenticated access.
-- Server code uses service-role credentials with explicit authorization.
COMMIT;
-- IMPORTANT: Current frontend .select('*') on products may fail because cost
-- is not granted. Migrate the UI to explicit public fields before applying.
