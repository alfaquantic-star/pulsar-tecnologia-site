-- Negative RLS/GRANT regression tests, running only in disposable PostgreSQL CI.
-- Execute AFTER the candidate migration, never on the live shared Supabase.
-- Permission checks must actually attempt the SQL as ordinary browser roles.

SET ROLE anon;
DO $$
DECLARE
  denied boolean;
  statement text;
BEGIN
  FOREACH statement IN ARRAY ARRAY[
    'SELECT id FROM public.orders',
    'SELECT id FROM public.site_settings',
    'SELECT cost FROM public.products',
    'INSERT INTO public.orders (id) VALUES (''injected-anon'')',
    'UPDATE public.products SET sale_price = 0 WHERE id = ''p-active''',
    'DELETE FROM public.kits WHERE id = ''k-active'''
  ] LOOP
    denied := false;
    BEGIN
      EXECUTE statement;
    EXCEPTION WHEN insufficient_privilege THEN
      denied := true;
    END;
    IF NOT denied THEN
      RAISE EXCEPTION 'anon must not execute forbidden statement: %', statement;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.products) <> 1 OR
     (SELECT count(*) FROM public.kits) <> 1 THEN
    RAISE EXCEPTION 'anon active-only catalog visibility failed';
  END IF;
END $$;
RESET ROLE;

SET ROLE authenticated;
DO $$
DECLARE
  denied boolean;
  statement text;
BEGIN
  FOREACH statement IN ARRAY ARRAY[
    'SELECT id FROM public.orders',
    'SELECT id FROM public.site_settings',
    'SELECT cost FROM public.products',
    'INSERT INTO public.orders (id) VALUES (''injected-authenticated'')',
    'UPDATE public.orders SET payment_status = ''approved'' WHERE id = ''order-test''',
    'UPDATE public.kits SET kit_price = 0 WHERE id = ''k-active''',
    'DELETE FROM public.products WHERE id = ''p-active'''
  ] LOOP
    denied := false;
    BEGIN
      EXECUTE statement;
    EXCEPTION WHEN insufficient_privilege THEN
      denied := true;
    END;
    IF NOT denied THEN
      RAISE EXCEPTION 'authenticated role must not execute forbidden statement: %', statement;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.products) <> 1 OR
     (SELECT count(*) FROM public.kits) <> 1 THEN
    RAISE EXCEPTION 'authenticated active-only catalog visibility failed';
  END IF;
END $$;
RESET ROLE;
