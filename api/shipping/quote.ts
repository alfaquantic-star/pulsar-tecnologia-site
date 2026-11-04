import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const origin = process.env.SHIPPING_ORIGIN_CEP?.replace(/\D/g, '');
  const cep = String(req.body?.cep || '').replace(/\D/g, '');
  if (!token || !origin) return res.status(503).json({ error: 'Configure MELHOR_ENVIO_TOKEN e SHIPPING_ORIGIN_CEP' });
  if (cep.length !== 8) return res.status(400).json({ error: 'CEP inválido' });
  const quantity = Math.max(1, Math.min(100, Number(req.body?.quantity) || 1));
  try {
    const upstream = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': process.env.MELHOR_ENVIO_USER_AGENT || 'Pulsar Tecnologia (contato pelo painel)' },
      body: JSON.stringify({ from: { postal_code: origin }, to: { postal_code: cep }, products: [{ id: 'placa', width: 15, height: 5, length: 20, weight: 0.3, insurance_value: 30, quantity }] })
    });
    const data = await upstream.json();
    if (!upstream.ok || !Array.isArray(data)) return res.status(502).json({ error: 'Erro na cotação Melhor Envio', details: data });
    const options = data.filter((item: any) => !item.error && Number(item.custom_price || item.price) > 0).map((item: any) => ({ id: String(item.id), carrier: item.company?.name || 'Transportadora', service: item.name || 'Entrega', price: Number(item.custom_price || item.price), estimatedDays: Number(item.custom_delivery_time || item.delivery_time || 0), companyLogo: item.company?.picture }));
    return res.status(200).json({ options });
  } catch { return res.status(502).json({ error: 'Serviço de frete indisponível' }); }
}
