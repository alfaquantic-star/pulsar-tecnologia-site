import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Preview diagnostics: never echo tokens, keys, user metadata, or Supabase errors.
 * Responses reveal only the class of problem and help locate its source.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: 'method_not_allowed' });
  }

  const bearer = req.headers.authorization || '';
  if (!bearer.startsWith('Bearer ') || bearer.length <= 'Bearer '.length) {
    return res.status(401).json({ code: 'missing_session' });
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Pulsar admin auth: missing server credentials', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey
    });
    return res.status(503).json({
      code: 'missing_server_env',
      message: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para Preview.'
    });
  }
  if (url !== 'https://srvctqtmlbkmgiazgsrj.supabase.co') {
    console.error('Pulsar admin auth: unexpected Supabase project URL');
    return res.status(503).json({ code: 'wrong_supabase_project' });
  }
  try {
    const client = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await client.auth.getUser(bearer.slice('Bearer '.length).trim());
    if (error || !data.user) {
      // Do not include raw provider error; it may contain sensitive internals.
      console.error('Pulsar admin auth: Supabase could not verify bearer token', {
        status: error?.status || null,
        name: error?.name || null
      });
      if (error?.status === 401 || error?.status === 403) {
        return res.status(401).json({ code: 'invalid_or_expired_session' });
      }
      return res.status(503).json({ code: 'server_auth_provider_error' });
    }
    const user = data.user;
    const authorizedId = process.env.PULSAR_ADMIN_USER_ID;
    if (user.app_metadata?.role !== 'admin' || (authorizedId && user.id !== authorizedId)) {
      return res.status(403).json({ code: 'not_authorized_admin' });
    }
    return res.status(200).json({ authenticated: true, userId: user.id });
  } catch (err) {
    console.error('Pulsar admin auth: runtime failure', {
      name: err instanceof Error ? err.name : 'Unknown'
    });
    return res.status(503).json({ code: 'server_auth_runtime_failure' });
  }
}
