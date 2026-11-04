import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminIdentity, adminDatabase } from '../_lib/admin-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: 'method_not_allowed' });
  }
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'missing_session' });
  }
  try {
    const user = await verifyAdminIdentity(req);
    if (!user) return res.status(403).json({ code: 'not_authorized_admin' });

    // A successful login is separate from privileged catalog/database access.
    // Verify server credentials without exposing the key or any table rows.
    let adminApiReady = false;
    let adminApiDiagnostic = 'not_configured';
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { error } = await adminDatabase().from('products').select('id').limit(1);
        adminApiReady = !error;
        adminApiDiagnostic = error ? 'database_access_rejected' : 'ok';
      } catch {
        adminApiDiagnostic = 'server_credentials_invalid';
      }
    }
    return res.status(200).json({
      authenticated: true,
      userId: user.id,
      adminApiReady,
      adminApiDiagnostic
    });
  } catch (err) {
    console.error('Pulsar admin auth: identity verification failed', {
      name: err instanceof Error ? err.name : 'Unknown'
    });
    return res.status(503).json({ code: 'server_auth_provider_error' });
  }
}
