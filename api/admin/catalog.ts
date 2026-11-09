import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase, requireAdmin } from '../_lib/admin-auth.js';
import { validateCouponPayload } from '../_lib/coupons.js';

const allowedTables = new Set(['products', 'kits', 'coupons']);
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
    if (!auth) return res.status(403).json({ code: 'admin_not_authorized', error: 'Administrator authentication required' });

    const table = String(req.query.table || '');
    if (!allowedTables.has(table)) return res.status(400).json({ code: 'invalid_table', error: 'Invalid resource' });
    const db = adminDatabase();
    if (table === 'coupons') {
      const id = String(req.query.id || '');
      if (id && !/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'ID de cupom inválido.' });
      const coupons = db.from('pulsar_admin_coupons');
      if (req.method === 'GET') {
        const { data, error } = await coupons.select('*').order('created_at', { ascending: false }).limit(100);
        if (error) return res.status(503).json({ code: 'coupon_storage_unavailable', error: 'Gestão de cupons ainda não disponível no servidor.' });
        return res.status(200).json({ data });
      }
      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'Selecione o cupom.' });
        const { error } = await coupons.delete().eq('id', id);
        return error ? res.status(503).json({ error: 'Não foi possível excluir o cupom.' }) : res.status(200).json({ ok: true });
      }
      let payload;
      try { payload = validateCouponPayload(req.body, req.method === 'POST' ? 'create' : 'update'); }
      catch { return res.status(400).json({ code: 'invalid_coupon', error: 'Confira código, desconto, tipo e validade do cupom.' }); }
      if (req.method === 'POST') {
        if (payload.is_active !== false) {
          // Promotion activation remains opt-in and admin-authorized.
          payload.is_active = false;
        }
        const { data, error } = await coupons.insert(payload).select('*').single();
        return error ? res.status(409).json({ error: 'Cupom duplicado ou dados inválidos.' }) : res.status(201).json({ data });
      }
      if (!id) return res.status(400).json({ error: 'Selecione o cupom.' });
      const { data: existing, error: existingError } = await coupons.select('discount_type,discount_value,starts_at,expires_at').eq('id',id).maybeSingle();
      if (existingError || !existing) return res.status(404).json({ error: 'Cupom não encontrado.' });
      try {
        validateCouponPayload({ ...existing, discount_value: Number(existing.discount_value), ...payload }, 'create');
      } catch {
        return res.status(400).json({ error: 'Valor percentual ou datas incompatíveis.' });
      }
      const { data, error } = await coupons.update(payload).eq('id',id).select('*').maybeSingle();
      return error || !data ? res.status(409).json({ error: 'Não foi possível atualizar o cupom.' }) : res.status(200).json({ data });
    }
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
    if (!isObject(req.body)) return res.status(400).json({ code: 'invalid_json', error: 'Invalid JSON body' });
    const keys = Object.keys(req.body);
    if (!keys.length || keys.length > 40 || keys.some((k) => !allowedFields[table].has(k))) {
      return res.status(400).json({ code: 'invalid_fields', error: 'Invalid fields' });
    }
    if (req.method === 'PATCH') {
      if (!id || 'id' in req.body) return res.status(400).json({ code: 'invalid_id', error: 'ID required; ID is immutable' });
      const { data, error } = await db.from(table).update(req.body).eq('id', id).select('*').maybeSingle();
      if (error) {
        const dbCode = error.code || 'unknown';
        const m = String(error.message || '').toLowerCase();
        const reason = /invalid api key|invalid jwt|jwt expired|api key|apikey/.test(m)
          ? 'invalid_backend_key'
          : /permission denied|row-level security|forbidden|unauthorized/.test(m)
          ? 'database_permission_denied'
          : /fetch failed|network|timeout|failed to fetch/.test(m)
          ? 'database_connection_failed'
          : /column|schema cache|unknown field/.test(m)
          ? 'invalid_database_column'
          : 'database_rejected_update';
        console.error('Catalog PATCH rejected', { dbCode, reason, detailsAvailable: !!error.details });
        return res.status(400).json({ code: 'database_update_rejected', dbCode, reason, error: 'Update rejected' });
      }
      if (!data) return res.status(404).json({ code: 'row_not_found', error: 'Not found' });
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
    return res.status(503).json({ code: 'server_admin_unavailable', error: 'Administration temporarily unavailable' });
  }
}
