import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Acknowledge quickly. Never mark an order as paid without verifying x-signature
  // and fetching payment status from Mercado Pago using server credentials.
  console.info('Mercado Pago notification received', { type: req.body?.type || req.query.type });
  return res.status(200).json({ received: true });
}
