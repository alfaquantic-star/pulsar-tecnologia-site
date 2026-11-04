import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

// This is the public, browser-safe publishable key for the Pulsar project.
// It never grants administrative database rights.
const PROJECT_URL = 'https://srvctqtmlbkmgiazgsrj.supabase.co';
const PUBLIC_KEY = 'sb_publishable_cFGIrygvfoAZHLckdq8iLA_rZZApxFz';

function serverConfig() {
  const url = process.env.SUPABASE_URL || PROJECT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  if (url !== PROJECT_URL) throw new Error('Wrong Supabase project');
  return { url, serviceKey };
}

/** Privileged database access is allowed only in Vercel server functions. */
export function adminDatabase() {
  const { url, serviceKey } = serverConfig();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Verify an actual Supabase Auth user using only the publishable key and
 * the user's signed access token. This does not rely on a service-role key.
 * Never use caller-supplied metadata, emails or localStorage as authority.
 */
export async function verifyAdminIdentity(req: VercelRequest) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const authClient = createClient(PROJECT_URL, PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  const user = data.user;
  const authorizedId = process.env.PULSAR_ADMIN_USER_ID;
  if (user.app_metadata?.role !== 'admin' ||
      (authorizedId && user.id !== authorizedId)) return null;
  return user;
}

/** Mutations also need a separate server-only privileged client. */
export async function requireAdmin(req: VercelRequest) {
  const user = await verifyAdminIdentity(req);
  if (!user) return null;
  return { user, db: adminDatabase() };
}
