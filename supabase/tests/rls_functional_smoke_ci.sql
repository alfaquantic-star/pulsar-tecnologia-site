-- Functional smoke checks after isolated CI migration. These statements run
-- with ordinary anon/authenticated privileges, NOT as the database owner.
SET ROLE anon;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.products) <> 1 THEN
    RAISE EXCEPTION 'anon must only see active products';
  END IF;
  IF (SELECT count(*) FROM public.kits) <> 1 THEN
    RAISE EXCEPTION 'anon must only see active kits';
  END IF;
  IF has_column_privilege(current_user,'public.products','cost','SELECT') THEN
    RAISE EXCEPTION 'anon can read private product cost';
  END IF;
  IF has_table_privilege(current_user,'public.orders','SELECT') OR
     has_table_privilege(current_user,'public.orders','UPDATE') OR
     has_table_privilege(current_user,'public.site_settings','SELECT') THEN
    RAISE EXCEPTION 'anon still has private table access';
  END IF;
END $$;
RESET ROLE;

SET ROLE authenticated;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.products) <> 1 OR
     (SELECT count(*) FROM public.kits) <> 1 THEN
    RAISE EXCEPTION 'authenticated catalog filtering broken';
  END IF;
  IF has_table_privilege(current_user,'public.orders','SELECT') OR
     has_table_privilege(current_user,'public.orders','INSERT') OR
     has_table_privilege(current_user,'public.orders','UPDATE') OR
     has_table_privilege(current_user,'public.site_settings','SELECT') OR
     has_column_privilege(current_user,'public.products','cost','SELECT') THEN
    RAISE EXCEPTION 'authenticated browser user has privileged data access';
  END IF;
END $$;
RESET ROLE;
