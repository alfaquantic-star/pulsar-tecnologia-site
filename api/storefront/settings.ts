import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase } from '../_lib/admin-auth.js';

// Explicit allowlist: the public response must never expose integration secrets.
const publicFields = [
  'logo_url', 'hero_title', 'hero_title_highlight', 'hero_subtitle',
  'announcement_bar_text', 'whatsapp_number', 'origin_cep',
  'mercado_pago_public_key'
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
  try {
    const db = adminDatabase();
    const { data, error } = await db.from('site_settings')
      .select([...publicFields].join(',')).eq('id','default').maybeSingle();
    if (error) return res.status(503).json({ error: 'Settings unavailable' });
    return res.status(200).json({ data: data || null });
  } catch {
    return res.status(503).json({ error: 'Storefront configuration unavailable' });
  }
}
