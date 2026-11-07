-- Test webhook inbox. Only server-side privileged API access is allowed.
create table if not exists public.pulsar_mp_test_webhook_inbox (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type = 'payment'),
  resource_id text not null,
  received_at timestamptz not null default now(),
  process_status text not null default 'queued',
  unique (event_type, resource_id)
);
alter table public.pulsar_mp_test_webhook_inbox enable row level security;
revoke all on public.pulsar_mp_test_webhook_inbox from public, anon, authenticated;

-- This table has no browser policies; give access only to the server role.
grant select, insert on public.pulsar_mp_test_webhook_inbox to service_role;
grant usage, select on sequence public.pulsar_mp_test_webhook_inbox_id_seq to service_role;
