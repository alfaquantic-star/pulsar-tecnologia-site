import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/admin-auth.js';

/** Read-only shipping diagnostic. No labels, cart orders or payment actions. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }
  try {
    if (!await requireAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Acesso administrativo necessário.' });
    }
    if (req.body && (typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length)) {
      return res.status(400).json({ success: false, message: 'Não envie tokens ou dados de frete pelo navegador.' });
    }

    const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
    const origin = (process.env.SHIPPING_ORIGIN_CEP || '').replace(/\D/g, '');
    if (!token || origin.length !== 8) {
      return res.status(503).json({
        success: false,
        message: 'Configure MELHOR_ENVIO_TOKEN e SHIPPING_ORIGIN_CEP (8 dígitos) no ambiente Preview da Vercel.'
      });
    }

    // Production and Sandbox use different accounts/tokens and hosts.
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
    const base = sandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
    const response = await fetch(base + '/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': process.env.MELHOR_ENVIO_USER_AGENT || 'Pulsar Tecnologia (suporte@pulsartecnologia.com.br)'
      },
      body: JSON.stringify({
        from: { postal_code: origin },
        to: { postal_code: '01001000' },
        products: [{ id: 'diagnostic', width: 15, height: 5, length: 20, weight: 0.3, insurance_value: 30, quantity: 1 }]
      }),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    });
    if (response.status === 401 || response.status === 403) {
      return res.status(502).json({
        success: false, environment: sandbox ? 'sandbox' : 'production',
        message: 'Token recusado pelo Melhor Envio. Confirme se o token pertence ao ambiente selecionado.'
      });
    }
    if (!response.ok) {
      return res.status(502).json({
        success: false, environment: sandbox ? 'sandbox' : 'production',
        message: 'Melhor Envio rejeitou a cotação de teste. Confira origem, escopos do token e logs da função.'
      });
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return res.status(502).json({ success: false, message: 'Resposta inesperada do Melhor Envio.' });
    }
    return res.status(200).json({
      success: true, environment: sandbox ? 'sandbox' : 'production',
      message: 'Melhor Envio respondeu à cotação de teste. Nenhuma etiqueta ou cobrança foi criada.',
      availableOptions: data.filter((item: any) => !item.error && Number(item.custom_price || item.price) > 0).length
    });
  } catch (err) {
    console.error('Melhor Envio diagnostic error', err instanceof Error ? err.name : 'unknown');
    return res.status(503).json({ success: false, message: 'Falha ao consultar Melhor Envio. Confira logs e variáveis da Vercel.' });
  }
}
