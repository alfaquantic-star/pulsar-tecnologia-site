# Pulsar Tecnologia — secure backend rollout (draft)

**Branch:** security/server-api-phase1. This is an integration phase, NOT a ready-to-merge release.
No database migration has been applied to the existing Supabase project.

## Findings
The production Supabase project has RLS enabled but public `FOR ALL USING (true)`
policies on products, kits, orders, and site_settings. Anon/authenticated roles
currently hold table-wide read and write grants. It contains two products, six kits,
zero orders, and one site_settings record. Do not expose order customer details.

## Implemented in this branch
- Supabase Auth email/password sign-in wired in the existing admin modal; role is rechecked by `/api/admin/me` using a real bearer token before showing the admin UI. A stored localStorage admin role alone no longer restores admin on reload. Role switching from the browser was disabled.
- `api/_lib/admin-auth.ts`: verify Supabase Auth bearer JWT via `auth.getUser`.
  Only `app_metadata.role=admin` (controlled by Supabase server admin), optionally
  restricted to `PULSAR_ADMIN_USER_ID`, receives admin access.
- `api/admin/catalog.ts`: allowlisted products/kits CRUD with the server-only
  service-role client, denied without a verified admin token.
- `supabase/migrations/20261103_prepare_pulsar_rls.sql`: unexecuted migration
  that revokes public writes and limits public reads to active catalog.
  Product cost is NOT public in the proposal.

## Required before deploying or applying SQL
1. Configure a genuine Supabase Auth user with `app_metadata.role=admin` via trusted server/admin tooling, and set `PULSAR_ADMIN_USER_ID` in Vercel to pin that account. The sign-in UI is now wired, but session restoration and revalidation on navigation need further review. Validate that all admin mutations use the server-side API, not the old browser Supabase CRUD.
2. Change product catalog fetching from `select('*')` to explicit public columns.
3. Replace direct browser CRUD (products/kits/settings/orders) with authenticated
   backend calls. Implement an authenticated settings API and a public, sanitized
   settings endpoint for hero/header content. Never publish melhor_envio_token.
4. Add server-side order creation with product lookup, real quantities, stock,
   coupon rules, and server-verified shipping costs; refuse browser-derived prices.
5. Keep Mercado Pago payment endpoint returning 503 and never treat client
   redirects or local payment status as proof of payment. Implement x-signature
   verification and fetch payment status from Mercado Pago before changing orders.
6. The customer login shown in the current client is not identity verification;
   build Supabase Auth before exposing real customer orders/addresses.
7. Test API unauthorized (401/403), authorized (200), catalog visibility,
   denied anonymous writes, payment webhooks, and shipping quotes in staging.
8. Back up Supabase before migration; audit any other app depending on its public
   tables. Apply migration only once all browser consumers have been adapted.

## Known staging blockers
- There is no reliable preview build result yet; no production deployment was requested.
- The legacy AdminPanel actions still call browser Supabase helpers. Never apply the proposed RLS migration or deploy to production before replacing and verifying those writes.
- Existing customer sign-in is a local UI flow, not verified identity. Never use it to authorize access to protected data.
- The currently shared project's RLS remains open until a separately authorized migration; treat that as an urgent security risk.

## Vercel server-side variables
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optionally
`PULSAR_ADMIN_USER_ID`. Never prefix a service-role key with `VITE_`.
For browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable).

## Important
This code does not activate payment processing. The existing Checkout Pro
endpoint is intentionally disabled. Do not merge before integrating the
frontend and performing staging validation.
