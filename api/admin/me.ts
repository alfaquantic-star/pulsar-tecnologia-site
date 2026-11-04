import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminIdentity } from '../_lib/admin-auth';

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

    // Login can work independently of privileged database access.
    // Absence of service credentials disables administrative mutations.
    const serviceKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    return res.status(200).json({
      authenticated: true,
      userId: user.id,
      adminApiConfigured: serviceKeyConfigured
    });
  } catch (err) {
    console.error('Pulsar admin auth: identity verification failed', {
      name: err instanceof Error ? err.name : 'Unknown'
    });
    return res.status(503).json({ code: 'server_auth_provider_error' });
  }
}
