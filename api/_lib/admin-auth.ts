import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

function serverConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase server credentials are not configured');
  return { url, serviceKey };
}

/** Never export service-role credentials to browser code or VITE_ variables. */
export function adminDatabase() {
  const { url, serviceKey } = serverConfig();
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * User identity is verified with Supabase Auth on each request.
 * Authorization uses only server-managed app_metadata, never user_metadata,
 * request body, localStorage, or a client-supplied role.
 */
export async function requireAdmin(req: VercelRequest) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const db = adminDatabase();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const user = data.user;
  const role = user.app_metadata?.role;
  const allowedId = process.env.PULSAR_ADMIN_USER_ID;
  if (role !== 'admin' || (allowedId && user.id !== allowedId)) return null;
  return { user, db };
}
