-- Restricted diagnostic state for the latest Mercado Pago TEST webhook attempt.
-- Records only booleans and timestamps; never tokens, signatures, body or IDs.
-- One-row limit; requires service-role access from the server.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pulsar_webhook_diagnostics (
  id text PRIMARY KEY CHECK (id = 'mp_preview'),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  signature_header_present boolean NOT NULL DEFAULT false,
  request_id_header_present boolean NOT NULL DEFAULT false,
  query_data_id_present boolean NOT NULL DEFAULT false,
  body_data_id_present boolean NOT NULL DEFAULT false,
  signature_format_valid boolean NOT NULL DEFAULT false,
  signature_verified boolean NOT NULL DEFAULT false
);
ALTER TABLE public.pulsar_webhook_diagnostics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pulsar_webhook_diagnostics FROM PUBLIC, anon, authenticated;
-- No policies: only trusted server-side service_role may read or update.
COMMIT;
