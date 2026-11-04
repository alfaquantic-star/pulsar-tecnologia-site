import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase, requireAdmin } from '../_lib/admin-auth.js';

const allowedTables = new Set(['products', 'kits']);
const allowedFields: Record<string, Set<string>> = {
  products: new Set(['id', 'name', 'slug', 'short_description', 'detailed_description',
    'sale_price', 'promo_price', 'cost', 'stock', 'track_stock', 'sku', 'category',
    'chip_type', 'height_cm', 'width_cm', 'length_cm', 'weight_grams', 'is_active',
    'is_featured', 'is_best_seller', 'rating', 'reviews_count', 'badge', 'images']),
  kits: new Set(['id', 'name', 'slug', 'description', 'image', 'kit_price',
    'reference_price', 'savings_amount', 'discount_percentage', 'badge',
    'is_active', 'is_featured', 'items'])
};
const isObject = (x: unknown): x is Record<string, unknown> =>
  Boolean(x && typeof x === 'object' && !Array.isArray(x));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Fail closed when server credentials are not provisioned.
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Administrator authentication required' });

    const table = String(req.query.table || '');
    if (!allowedTables.has(table)) return res.status(400).json({ error: 'Invalid resource' });
    const db = adminDatabase();
    const id = String(req.query.id || '');
    if (id.length > 128) return res.status(400).json({ error: 'Invalid ID' });

    if (req.method === 'GET') {
      const query = db.from(table).select('*').order('created_at', { ascending: false }).limit(100);
      const { data, error } = await (id ? query.eq('id', id) : query);
      if (error) return res.status(500).json({ error: 'Database operation failed' });
      return res.status(200).json({ data });
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await db.from(table).delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Database operation failed' });
      return res.status(200).json({ ok: true });
    }
    if (!isObject(req.body)) return res.status(400).json({ error: 'Invalid JSON body' });
    const keys = Object.keys(req.body);
    if (!keys.length || keys.length > 40 || keys.some((k) => !allowedFields[table].has(k))) {
      return res.status(400).json({ error: 'Invalid fields' });
    }
    if (req.method === 'PATCH') {
      if (!id || 'id' in req.body) return res.status(400).json({ error: 'ID required; ID is immutable' });
      const { data, error } = await db.from(table).update(req.body).eq('id', id).select('*').maybeSingle();
      if (error) return res.status(400).json({ error: 'Update rejected' });
      if (!data) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ data });
    }
    if (!req.body.id || typeof req.body.id !== 'string' || req.body.id.length > 128) {
      return res.status(400).json({ error: 'Valid ID required' });
    }
    const { data, error } = await db.from(table).insert(req.body).select('*').single();
    if (error) return res.status(400).json({ error: 'Insert rejected' });
    return res.status(201).json({ data });
  } catch (error) {
    console.error('Admin API configuration or runtime failure', error instanceof Error ? error.message : 'unknown');
    return res.status(503).json({ error: 'Administration temporarily unavailable' });
  }
}
