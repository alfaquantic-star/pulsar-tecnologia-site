-- Pulsar post-RLS read-only verification. Do not run on production until
-- migration/cutover; these assertions are expected to FAIL on the current
-- insecure database. Run with an SQL role authorized to inspect privileges.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','kits','orders','site_settings'] LOOP
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.' || t)::regclass) THEN
      RAISE EXCEPTION 'RLS disabled on %', t;
    END IF;
    IF has_table_privilege('anon','public.' || t,'INSERT') OR
       has_table_privilege('anon','public.' || t,'UPDATE') OR
       has_table_privilege('anon','public.' || t,'DELETE') OR
       has_table_privilege('authenticated','public.' || t,'INSERT') OR
       has_table_privilege('authenticated','public.' || t,'UPDATE') OR
       has_table_privilege('authenticated','public.' || t,'DELETE') THEN
      RAISE EXCEPTION 'Public write privilege remains on %', t;
    END IF;
  END LOOP;
  IF has_table_privilege('anon','public.orders','SELECT') OR
     has_table_privilege('authenticated','public.orders','SELECT') OR
     has_table_privilege('anon','public.site_settings','SELECT') OR
     has_table_privilege('authenticated','public.site_settings','SELECT') THEN
    RAISE EXCEPTION 'Private tables remain readable by browser roles';
  END IF;
  IF has_column_privilege('anon','public.products','cost','SELECT') OR
     has_column_privilege('authenticated','public.products','cost','SELECT') THEN
    RAISE EXCEPTION 'Private unit cost remains publicly readable';
  END IF;
  IF NOT has_column_privilege('anon','public.products','sale_price','SELECT') OR
     NOT has_table_privilege('anon','public.kits','SELECT') THEN
    RAISE EXCEPTION 'Public catalog read privilege missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('products','kits','orders','site_settings')
      AND cmd='ALL' AND 'public'=ANY(roles)
  ) THEN
    RAISE EXCEPTION 'Permissive FOR ALL public policy remains';
  END IF;
END $$;

-- Additional functional checks must use actual anon and authenticated API
-- requests, and authenticated admin API requests through Vercel, because
-- database owner/admin SQL sessions bypass ordinary RLS restrictions.
