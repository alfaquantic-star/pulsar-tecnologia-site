import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fixed-host public CEP lookup; never interpolate arbitrary upstream hosts.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const raw = req.query.cep;
  const cep = typeof raw === 'string' ? raw.replace(/\D/g, '') : '';
  if (cep.length !== 8 || (typeof raw === 'string' && raw.length > 9)) {
    return res.status(400).json({ error: 'Informe um CEP válido com 8 dígitos.' });
  }
  try {
    const upstream = await fetch('https://viacep.com.br/ws/' + cep + '/json/', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
      cache: 'no-store'
    });
    if (!upstream.ok) return res.status(502).json({ error: 'Não foi possível consultar o CEP.' });
    const data = await upstream.json();
    if (!data || data.erro || !data.localidade || !data.uf) {
      return res.status(404).json({ error: 'CEP não localizado. Confira os números.' });
    }
    return res.status(200).json({
      cep,
      street: String(data.logradouro || ''),
      neighborhood: String(data.bairro || ''),
      city: String(data.localidade),
      state: String(data.uf)
    });
  } catch {
    return res.status(503).json({ error: 'Consulta de CEP indisponível. Tente novamente.' });
  }
}
