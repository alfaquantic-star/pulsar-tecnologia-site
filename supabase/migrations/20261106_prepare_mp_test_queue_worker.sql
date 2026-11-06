-- STAGED ONLY. Apply only to the shared Supabase project after review.
-- Adds durable leases and retry state to the existing TEST payment inbox.
-- This does NOT enable any scheduled job or authorize real payments.
begin;
alter table public.pulsar_mp_test_webhook_inbox
  add column if not exists attempts integer not null default 0,
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_token uuid;
alter table public.pulsar_mp_test_webhook_inbox
  add constraint pulsar_mp_test_inbox_attempts_nonnegative
  check (attempts >= 0 and attempts <= 100);
alter table public.pulsar_mp_test_webhook_inbox
  add constraint pulsar_mp_test_inbox_status_allowed
  check (process_status in ('queued', 'processing', 'processed', 'rejected', 'needs_review'));
create index if not exists pulsar_mp_test_inbox_status_received_idx
  on public.pulsar_mp_test_webhook_inbox (process_status, received_at);
alter table public.pulsar_mp_test_webhook_inbox enable row level security;
revoke all on public.pulsar_mp_test_webhook_inbox from public, anon, authenticated;
grant select, insert, update on public.pulsar_mp_test_webhook_inbox to service_role;
commit;
