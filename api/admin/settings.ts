import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/admin-auth.js';

const fields = new Set([
  'logo_url', 'hero_title', 'hero_title_highlight', 'hero_subtitle',
  'announcement_bar_text', 'whatsapp_number', 'origin_cep', 'mercado_pago_public_key'
]);
function validObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PATCH'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Admin authentication required' });
    if (req.method === 'GET') {
      const { data, error } = await auth.db.from('site_settings')
        .select([...fields].join(',')).eq('id','default').maybeSingle();
      if (error) return res.status(500).json({ error: 'Settings unavailable' });
      return res.status(200).json({ data });
    }
    if (!validObject(req.body) || Object.keys(req.body).length === 0 ||
       Object.keys(req.body).some(k => !fields.has(k))) {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }
    // Never accept a Melhor Envio token or Mercado Pago Access Token in settings.
    const { data, error } = await auth.db.from('site_settings')
      .update(req.body).eq('id','default').select([...fields].join(',')).maybeSingle();
    if (error) return res.status(400).json({ error: 'Settings update rejected' });
    if (!data) return res.status(404).json({ error: 'Settings not found' });
    return res.status(200).json({ data });
  } catch {
    return res.status(503).json({ error: 'Admin backend not configured' });
  }
}
