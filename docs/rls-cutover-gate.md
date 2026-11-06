# Pulsar Tecnologia — RLS cutover gate (2026-11-06)

## Verified blocker

The shared Supabase project `srvctqtmlbkmgiazgsrj` still has permissive
`FOR ALL TO public USING (true) WITH CHECK (true)` policies for `products`, `kits`, and
`orders`. The old `main` branch (`src/lib/supabase.ts`) directly reads
`site_settings`, `products`, `kits`, and `orders` and performs direct browser
upserts/deletes/updates. This is incompatible with the least-privilege RLS
migration. **Do not apply that migration while the legacy `main` deployment is serving users.**

## Target architecture already in Preview

- `src/lib/supabase.ts` reads only allowlisted active product columns and active kits.
- Admin catalog, orders and settings use authenticated `/api/admin/*` endpoints.
- Public site settings come from `/api/storefront/settings` with a strict allowlist.
- Checkout and payment updates are server-owned; the browser must not approve orders.
- `supabase/migrations/20261103_prepare_pulsar_rls.sql` defines the candidate RLS cutover.
- `supabase/tests/` and CI test RLS in isolated PostgreSQL, not in the shared database.

## Required release procedure (two-person review)

1. Freeze new code changes to the live branch, check `main` traffic and user-impact window.
2. Verify the Preview catalog, checkout, public settings, login, admin inventory/order editing,
   and customer flows with real browser sessions against the intended project.
3. Ensure `main` is updated to the server-only architecture **before revoking its direct DB
   access**; otherwise the old site will fail. Coordinate deployment and database cutover.
4. Take a restorable database backup and rehearse rollback in a disposable database.
5. Make the public store read-only/maintenance during the brief coordinated cutover
   where old direct browser writes could be rejected.
6. Run the reviewed RLS migration exactly once on the shared project with explicit approval.
7. Verify as `anon` and `authenticated` that private orders and site settings cannot be
   read or written, product cost cannot be selected, only active products/kits are visible,
   and users cannot mutate catalog rows. Verify `service_role` continues required backend
   operations. Do not test with the privileged postgres connection alone.
8. Smoke-test the real site URL, signed admin API, catalog, checkout sandbox and public
   settings; inspect logs, compare order counts and monitor errors.
9. If verification fails, immediately put the storefront into maintenance; restore the
   *reviewed* previous policies/privileges together with the previous app deployment.
   Never restore permissive policies while keeping an unreviewed public checkout open.

## SQL audit queries (read-only)

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename in ('orders','products','kits','site_settings')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name in ('orders','products','kits','site_settings')
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;
```

## Explicit GO / NO-GO criteria

**NO-GO** if any live branch still makes direct public writes to orders/products/kits/settings,
if the production deployment is not confirmed, if app/DB rollback is untested, or if RLS
smoke tests fail. Checkout authorization and payment processor tests do not override this gate.

The sandbox queue cron job `pulsar_test_queue_worker` is currently **inactive**.
Never enable it as a substitute for correcting the public RLS rules.
