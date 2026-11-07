import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/admin-auth.js';

/**
 * Read-only Mercado Pago credential diagnostic.
 * Never accepts or returns an access token. Requires actual admin identity.
 * This endpoint cannot create payments or alter order status.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ success: false, message: 'Acesso administrativo necessário.' });
    // Never trust a caller-supplied token, even from the admin panel.
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length !== 0) {
      return res.status(400).json({ success: false, message: 'Não envie tokens pelo navegador. Configure o Access Token nas variáveis da Vercel.' });
    }
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      return res.status(503).json({ success: false, message: 'MERCADO_PAGO_ACCESS_TOKEN não configurado na Vercel.' });
    }
    // Mercado Pago documents /users/me as an authenticated read-only check.
    const upstream = await fetch('https://api.mercadolibre.com/users/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store'
    });
    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        message: upstream.status === 401 || upstream.status === 403
          ? 'Mercado Pago recusou o Access Token configurado na Vercel.'
          : 'Não foi possível validar a conexão com Mercado Pago.'
      });
    }
    return res.status(200).json({ success: true, message: 'Access Token validado pelo Mercado Pago. Nenhuma cobrança foi criada.' });
  } catch (error) {
    console.error('Mercado Pago read-only diagnostic failed', { type: error instanceof Error ? error.name : 'unknown' });
    return res.status(503).json({ success: false, message: 'Não foi possível verificar a conexão. Confira as variáveis e logs da Vercel.' });
  }
}
