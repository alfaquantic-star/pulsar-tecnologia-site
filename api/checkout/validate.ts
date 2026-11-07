import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCheckout, CheckoutError } from '../_lib/verify-checkout.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    const quote = await verifyCheckout(req.body);
    return res.status(200).json(quote);
  } catch (error) {
    return res.status(error instanceof CheckoutError ? error.status : 503)
      .json({ error: error instanceof CheckoutError ? error.message : 'Falha ao validar carrinho.' });
  }
}
