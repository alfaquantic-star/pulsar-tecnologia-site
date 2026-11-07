import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, verifyCustomerIdentity, adminDatabase } from '../_lib/admin-auth.js';
import { getCustomerOrdersByVerifiedId } from '../_lib/customer-order-history.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET','PATCH'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Narrow customer mode reuses the existing function to remain within the
  // Vercel Hobby 12-function limit. Customer authorization is checked BEFORE
  // any database query. Admin GET/PATCH behavior is unchanged.
  if (req.method === 'GET' && req.query.scope === 'customer') {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Vary', 'Authorization');
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ code: 'missing_session' });
    }
    try {
      const user = await verifyCustomerIdentity(req);
      if (!user) return res.status(403).json({ code: 'customer_identity_required' });
      const data = await getCustomerOrdersByVerifiedId(adminDatabase(), user.id);
      return res.status(200).json({ data });
    } catch {
      return res.status(503).json({ code: 'customer_backend_unavailable' });
    }
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Admin authentication required' });
    if (req.method === 'GET') {
      const { data, error } = await auth.db.from('orders').select('*')
        .order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(503).json({ error: 'Orders unavailable' });
      return res.status(200).json({ data });
    }
    const id = String(req.query.id || '');
    if (!id || id.length > 128 || !req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid order request' });
    }
    // Payment status is NEVER editable from a client/admin request.
    // Only the verified Mercado Pago webhook can approve payments.
    const keys = Object.keys(req.body);
    if (!keys.length || keys.some(k => !['tracking_code', 'shipping_status'].includes(k))) {
      return res.status(400).json({ error: 'Only shipping fields may be modified' });
    }
    if (req.body.tracking_code !== undefined &&
        (typeof req.body.tracking_code !== 'string' || req.body.tracking_code.length > 128)) {
      return res.status(400).json({ error: 'Invalid tracking code' });
    }
    if (req.body.shipping_status !== undefined &&
        !['pending','processing','shipped','delivered','cancelled'].includes(req.body.shipping_status)) {
      return res.status(400).json({ error: 'Invalid shipping status' });
    }
    const { data, error } = await auth.db.from('orders').update(req.body)
      .eq('id',id).select('id,shipping_status,tracking_code').maybeSingle();
    if (error) return res.status(400).json({ error: 'Order update rejected' });
    if (!data) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ data });
  } catch {
    return res.status(503).json({ error: 'Admin backend unavailable' });
  }
}
