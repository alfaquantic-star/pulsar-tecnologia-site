-- READ-ONLY SECURITY GATE: do not expose any order/customer fields.
-- Confirms the exact database privileges used by public browser credentials.
-- This query is SAFE to run before/after a coordinated migration.
WITH target AS (
  SELECT c.oid,c.relname,c.relrowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND c.relname IN ('orders','products','kits','site_settings')
), permissions AS (
  SELECT relname AS table_name, relrowsecurity AS rls_enabled,
    has_table_privilege('anon',oid,'SELECT') AS anon_select,
    has_table_privilege('anon',oid,'INSERT,UPDATE,DELETE') AS anon_write,
    has_table_privilege('authenticated',oid,'SELECT') AS authenticated_select,
    has_table_privilege('authenticated',oid,'INSERT,UPDATE,DELETE') AS authenticated_write,
    EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public' AND p.tablename=relname
        AND p.permissive='PERMISSIVE' AND p.cmd='ALL'
        AND ('public'=ANY(p.roles) OR 'anon'=ANY(p.roles)
          OR 'authenticated'=ANY(p.roles))
        AND lower(trim(coalesce(p.qual,''))) IN ('true','(true)')
    ) AS unrestricted_policy
  FROM target
)
SELECT table_name, rls_enabled, anon_select, anon_write,
  authenticated_select, authenticated_write, unrestricted_policy,
  CASE
    WHEN NOT rls_enabled OR unrestricted_policy OR anon_write OR authenticated_write
      THEN 'BLOCKED'
    WHEN table_name IN ('orders','site_settings')
      AND (anon_select OR authenticated_select) THEN 'BLOCKED'
    ELSE 'PASS'
  END AS security_check
FROM permissions ORDER BY table_name;

-- One machine-readable verdict. This is not a substitute for session E2E.
WITH target AS (
  SELECT c.oid,c.relname,c.relrowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND c.relname IN ('orders','products','kits','site_settings')
)
SELECT CASE WHEN count(*)=4
  AND bool_and(relrowsecurity)
  AND bool_and(NOT has_table_privilege('anon',oid,'INSERT,UPDATE,DELETE'))
  AND bool_and(NOT has_table_privilege('authenticated',oid,'INSERT,UPDATE,DELETE'))
  AND bool_and(CASE WHEN relname IN ('orders','site_settings')
    THEN NOT has_table_privilege('anon',oid,'SELECT')
     AND NOT has_table_privilege('authenticated',oid,'SELECT')
    ELSE true END)
  AND NOT EXISTS (SELECT 1 FROM pg_policies p
    WHERE p.schemaname='public' AND p.tablename IN ('orders','products','kits','site_settings')
    AND p.permissive='PERMISSIVE' AND p.cmd='ALL'
    AND ('public'=ANY(p.roles) OR 'anon'=ANY(p.roles) OR 'authenticated'=ANY(p.roles))
    AND lower(trim(coalesce(p.qual,''))) IN ('true','(true)'))
  THEN 'READY_FOR_NEXT_REVIEW' ELSE 'NO_GO_PUBLIC_ACCESS' END AS checkout_rls_gate
FROM target;

-- Optional explicit authorization smoke test, from an isolated SQL session:
-- BEGIN READ ONLY;
-- SET LOCAL ROLE anon;
-- SELECT count(*) AS exposed_order_count FROM public.orders;
-- ROLLBACK;
-- The SELECT MUST fail with permission denied after migration.
-- Do not inspect individual order rows or customer data.
