import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase, verifyCustomerIdentity } from '../_lib/admin-auth.js';

/**
 * Only return orders explicitly associated with a verified Supabase Auth UUID.
 * Email, query parameters, client-provided IDs and guest order references are
 * NEVER used to determine ownership. Legacy orders remain unlinked.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: 'method_not_allowed' });
  }
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'missing_session' });
  }

  try {
    const user = await verifyCustomerIdentity(req);
    if (!user) return res.status(403).json({ code: 'customer_identity_required' });
    const { data, error } = await adminDatabase().from('orders')
      .select('id,order_number,customer_id,customer_name,customer_email,items,subtotal,discount_amount,shipping_price,shipping_carrier,shipping_service,total_amount,payment_method,payment_status,shipping_status,tracking_code,shipping_address,created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.status(503).json({ code: 'orders_unavailable' });
    return res.status(200).json({ data: data || [] });
  } catch {
    return res.status(503).json({ code: 'customer_backend_unavailable' });
  }
}
