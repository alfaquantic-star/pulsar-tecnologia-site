-- READ-ONLY RLS deployment gate for the shared Pulsar Supabase project.
-- No DDL/DML, no role switch, no secret values, no rollback operations.
-- Execute after a carefully coordinated migration, OR beforehand to obtain NO-GO.
-- The audit is about browser role privileges and policies, not user-session E2E.
--
-- Output: table-by-table privilege/policy audit, then READY or BLOCKED.
WITH targets AS (
  SELECT c.oid, c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND c.relname IN ('products','kits','orders','site_settings')
), checks AS (
  SELECT table_name, rls_enabled,
    has_table_privilege('anon', oid, 'INSERT,UPDATE,DELETE') AS anon_can_write,
    has_table_privilege('authenticated', oid, 'INSERT,UPDATE,DELETE') AS auth_can_write,
    has_table_privilege('anon', oid, 'SELECT') AS anon_can_read,
    has_table_privilege('authenticated', oid, 'SELECT') AS auth_can_read,
    EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public' AND p.tablename=targets.table_name
        AND p.permissive='PERMISSIVE' AND p.cmd='ALL'
        AND ('public' = ANY(p.roles) OR 'anon' = ANY(p.roles) OR 'authenticated' = ANY(p.roles))
        AND lower(trim(coalesce(p.qual,''))) IN ('true','(true)')
    ) AS broad_write_policy
  FROM targets
)
SELECT table_name, rls_enabled, anon_can_write, auth_can_write,
       anon_can_read, auth_can_read, broad_write_policy,
  CASE WHEN rls_enabled AND NOT anon_can_write AND NOT auth_can_write
    AND NOT broad_write_policy
    AND (table_name IN ('products','kits') OR
      (NOT anon_can_read AND NOT auth_can_read))
    THEN 'PASS' ELSE 'FAIL' END AS check_result
FROM checks
ORDER BY table_name;

-- Single machine-readable verdict. Important: the absence of any target table
-- also blocks release (count must be exactly four).
WITH targets AS (
  SELECT c.oid, c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND c.relname IN ('products','kits','orders','site_settings')
), failures AS (
  SELECT table_name FROM targets t
  WHERE NOT rls_enabled
    OR has_table_privilege('anon', t.oid, 'INSERT,UPDATE,DELETE')
    OR has_table_privilege('authenticated', t.oid, 'INSERT,UPDATE,DELETE')
    OR (table_name IN ('orders','site_settings')
      AND (has_table_privilege('anon', t.oid, 'SELECT')
        OR has_table_privilege('authenticated', t.oid, 'SELECT')))
    OR EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname='public'
      AND p.tablename=t.table_name AND p.permissive='PERMISSIVE'
      AND p.cmd='ALL' AND ('public'=ANY(p.roles)
        OR 'anon'=ANY(p.roles) OR 'authenticated'=ANY(p.roles))
      AND lower(trim(coalesce(p.qual,''))) IN ('true','(true)')
    )
)
SELECT CASE WHEN (SELECT COUNT(*) FROM targets)=4
  AND NOT EXISTS (SELECT 1 FROM failures)
  AND NOT has_column_privilege('anon','public.products','cost','SELECT')
  AND NOT has_column_privilege('authenticated','public.products','cost','SELECT')
  AND has_column_privilege('anon','public.products','sale_price','SELECT')
  AND has_table_privilege('anon','public.kits','SELECT')
  THEN 'READY' ELSE 'BLOCKED' END AS rls_security_verdict;
