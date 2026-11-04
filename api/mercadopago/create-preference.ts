import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  // Pagamentos bloqueados até integrar catálogo, frete e desconto verificados no servidor.
  // Nunca aceite unit_price, shipments.cost ou discount do navegador como valores confiáveis.
  return res.status(503).json({ message: 'Checkout em configuração: aguarde a validação segura dos preços e fretes.' });
}
