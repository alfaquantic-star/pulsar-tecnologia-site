# Staged Mercado Pago TEST Queue Worker (NOT ENABLED)

This is a **test-only** independent Supabase Edge Function, not a production checkout service.

## Architecture

1. Public `pulsar-mp-test-ingress` validates Mercado Pago HMAC and enqueues a payment ID.
2. A separately authenticated `pulsar-mp-test-queue-worker` claims **one** item at a time.
3. It independently fetches the payment, seller and merchant order from Mercado Pago using only TEST seller credentials.
4. It validates test buyer and seller IDs, currency, exact amount, Checkout Pro preference, external reference and order.
5. It conditionally updates a `pending` test order, or recognizes an already-`approved` order only if the payment ID matches.
6. It marks an inbox item `processed` only after verification; failed and incomplete events never approve anything.

## Activation gates — mandatory

- Apply and validate `20261106_prepare_mp_test_queue_worker.sql` after reviewing the shared database. This migration adds leases and retry status **only** to the test inbox; it is not the separate production RLS cutover.
- Deploy `pulsar-mp-test-queue-worker` with `verify_jwt=false`. The function requires its own long, unpredictable bearer secret and fails closed when it is absent.
- Set **Supabase Edge Function secrets** (never client or VITE_ variables):
  - `PULSAR_TEST_QUEUE_WORKER_SECRET` — random 32+ character bearer secret known only to a trusted scheduler
  - `MERCADO_PAGO_TEST_ACCESS_TOKEN` — credential of the specifically designated TEST seller
  - `PULSAR_MP_TEST_SELLER_ID`, `PULSAR_MP_TEST_BUYER_ID` — explicit test IDs
  - `PULSAR_ENABLE_TEST_QUEUE_WORKER=true` only after the manual isolated endpoint test
- Function can also use the built-in Supabase service credentials (`SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEYS`).
- The runtime is **disabled by default**. A deployment is not equivalent to activation.
- Verify HTTP 401 without the bearer token, HTTP 503 when disabled, no live-token access, and no order updates for invalid or nonapproved payments.
- Test a verified test payment already approved with the same ID to confirm idempotent consumption. Then test a fresh sandbox `pending` -> `approved` transition.
- Only after those checks, install a Supabase Cron / pg_net schedule using a secret held in Supabase Vault. **No schedule is included in this change.** Never put a bearer token in a URL, frontend bundle or Git repository.

## Concurrency and recovery

A conditional database update claims one queued event with a unique lease token. Only the current lease can finalize or release it. Expired leases are returned to the queue after five minutes. Failure attempts are capped at five before manual review. This protects against duplicate deliveries and retries, but does not replace operational monitoring.

## Production remains blocked

The shared project's legacy broad RLS grants and client-side admin flows have not completed their production security cutover. Do **not** enable real payments, publish this worker to production, or merge the `security/server-api-phase1` branch into `main` until those gates are resolved.
