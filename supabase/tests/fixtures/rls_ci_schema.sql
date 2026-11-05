-- Isolated CI-only fixture. DO NOT run against the live Supabase project.
-- This creates a minimal approximation of public tables required by the
-- staged RLS migration. It intentionally includes private product cost.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

CREATE TABLE public.products (
  id text PRIMARY KEY, name text, slug text, short_description text,
  detailed_description text, sale_price numeric, promo_price numeric,
  stock integer, track_stock boolean, sku text, category text, chip_type text,
  height_cm numeric, width_cm numeric, length_cm numeric, weight_grams numeric,
  is_active boolean NOT NULL DEFAULT true, is_featured boolean,
  is_best_seller boolean, rating numeric, reviews_count integer, badge text,
  images jsonb, created_at timestamptz, updated_at timestamptz,
  cost numeric
);
CREATE TABLE public.kits (
  id text PRIMARY KEY, is_active boolean NOT NULL DEFAULT true,
  kit_price numeric, name text, items jsonb
);
CREATE TABLE public.orders (
  id text PRIMARY KEY, payment_status text, total_amount numeric,
  customer_email text
);
CREATE TABLE public.site_settings (
  id text PRIMARY KEY, value jsonb
);

-- Reproduce the unsafe legacy environment in isolation.
GRANT ALL ON public.products, public.kits, public.orders, public.site_settings TO PUBLIC;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gerenciamento completo produtos" ON public.products
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo kits" ON public.kits
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo pedidos" ON public.orders
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo configurações" ON public.site_settings
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
INSERT INTO public.products (id,name,sale_price,is_active,cost) VALUES
 ('p-active','Active',19.00,true,8.00),
 ('p-private','Inactive',25.00,false,15.00);
INSERT INTO public.kits (id,is_active,kit_price) VALUES
 ('k-active',true,40.00),('k-inactive',false,50.00);
INSERT INTO public.orders (id,payment_status,total_amount,customer_email)
 VALUES ('order-test','pending',19.00,'secret@example.invalid');
INSERT INTO public.site_settings (id,value)
 VALUES ('private','{"payment_key":"sensitive"}');
