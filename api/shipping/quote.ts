import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase } from '../_lib/admin-auth.js';

// Read-only shipping estimates. Always derive physical characteristics
// from Supabase; the caller controls only product/kit IDs, quantities and CEP.
type CartLine = { productId?: string; kitId?: string; quantity: number };
type ProductRow = {
  id: string; is_active: boolean; height_cm: number; width_cm: number;
  length_cm: number; weight_grams: number; sale_price: number; promo_price: number | null;
};
type KitRow = { id: string; is_active: boolean; items: unknown };
const integer = (v: unknown) => Number.isInteger(v) && Number(v) > 0 && Number(v) <= 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const origin = (process.env.SHIPPING_ORIGIN_CEP || '').replace(/\D/g, '');
  if (!token || origin.length !== 8) {
    return res.status(503).json({ error: 'Frete indisponível: confira MELHOR_ENVIO_TOKEN e SHIPPING_ORIGIN_CEP na Vercel.' });
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      typeof body.cep !== 'string' || !/^\d{5}-?\d{3}$/.test(body.cep.trim())) {
    return res.status(400).json({ error: 'CEP inválido.' });
  }
  const cep = body.cep.replace(/\D/g, '');
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return res.status(400).json({ error: 'Informe de 1 a 20 produtos ou kits no carrinho.' });
  }
  const cart: CartLine[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
        !integer(raw.quantity) || typeof raw.productId !== 'string' && typeof raw.kitId !== 'string' ||
        Boolean(raw.productId) === Boolean(raw.kitId)) {
      return res.status(400).json({ error: 'Itens inválidos no carrinho.' });
    }
    const id = raw.productId || raw.kitId;
    if (typeof id !== 'string' || id.length < 1 || id.length > 128) {
      return res.status(400).json({ error: 'Identificador de produto ou kit inválido.' });
    }
    cart.push({ productId: raw.productId, kitId: raw.kitId, quantity: raw.quantity });
  }

  try {
    const db = adminDatabase();
    const directIds = [...new Set(cart.flatMap(x => x.productId ? [x.productId] : []))];
    const kitIds = [...new Set(cart.flatMap(x => x.kitId ? [x.kitId] : []))];
    const kits = new Map<string, KitRow>();
    if (kitIds.length) {
      const result = await db.from('kits').select('id,is_active,items').in('id',kitIds);
      if (result.error) throw new Error('kits_query_failed');
      for (const row of result.data || []) kits.set(row.id,row as KitRow);
    }

    const expanded = new Map<string, number>();
    const add = (id: string, count: number) => expanded.set(id, (expanded.get(id) || 0) + count);
    for (const line of cart) {
      if (line.productId) { add(line.productId,line.quantity); continue; }
      const kit = kits.get(line.kitId!);
      if (!kit || !kit.is_active || !Array.isArray(kit.items) || !kit.items.length) {
        return res.status(422).json({ error: 'Kit indisponível ou sem composição cadastrada.' });
      }
      for (const part of kit.items) {
        if (!part || typeof part.productId !== 'string' || !integer(part.quantity)) {
          return res.status(422).json({ error: 'Kit com composição inválida.' });
        }
        add(part.productId, part.quantity * line.quantity);
      }
    }
    const totalUnits = [...expanded.values()].reduce((sum,n) => sum + n,0);
    if (totalUnits > 200 || directIds.length + kitIds.length > 20 || expanded.size > 30) {
      return res.status(422).json({ error: 'Quantidade excede o limite da cotação preliminar.' });
    }
    const products = await db.from('products')
      .select('id,is_active,height_cm,width_cm,length_cm,weight_grams,sale_price,promo_price')
      .in('id',[...expanded.keys()]);
    if (products.error) throw new Error('products_query_failed');
    const productMap = new Map<string,ProductRow>((products.data || []).map(p => [p.id,p as ProductRow]));
    const shipment: Array<{ id:string; width:number; height:number; length:number; weight:number; insurance_value:number; quantity:number }> = [];
    for (const [id,quantity] of expanded) {
      const p = productMap.get(id);
      if (!p || !p.is_active) return res.status(422).json({ error: 'Produto indisponível para cotação.' });
      const width = Number(p.width_cm),height = Number(p.height_cm),length = Number(p.length_cm);
      const grams = Number(p.weight_grams);
      const price = Number(p.promo_price || p.sale_price);
      if (![width,height,length,grams,price].every(Number.isFinite) ||
          Math.min(width,height,length,grams,price) <= 0 || Math.max(width,height,length) > 200) {
        return res.status(422).json({ error: 'Produto sem dimensões, peso ou preço válidos.' });
      }
      shipment.push({ id, width, height, length, weight: Number((grams/1000).toFixed(4)),
        insurance_value: price, quantity });
    }
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
    const base = sandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
    const upstream = await fetch(base + '/api/v2/me/shipment/calculate', {
      method:'POST',
      headers:{
        Authorization:'Bearer ' + token, Accept:'application/json',
        'Content-Type':'application/json',
        'User-Agent':process.env.MELHOR_ENVIO_USER_AGENT || 'Pulsar Tecnologia (suporte@pulsartecnologia.com.br)'
      },
      body:JSON.stringify({ from:{postal_code:origin}, to:{postal_code:cep}, products:shipment }),
      signal:AbortSignal.timeout(10000),
      cache:'no-store'
    });
    if (!upstream.ok) return res.status(502).json({ error:'Melhor Envio recusou a cotação. Verifique o token, ambiente e dados logísticos.' });
    const data:unknown = await upstream.json();
    if (!Array.isArray(data)) return res.status(502).json({ error:'Resposta inesperada do Melhor Envio.' });
    const options = data.filter((x:any) => !x.error && Number(x.custom_price || x.price) > 0)
      .map((x:any) => ({
        id:String(x.id), carrier:x.company?.name || 'Transportadora', service:x.name || 'Entrega',
        price:Number(x.custom_price || x.price),
        estimatedDays:Number(x.custom_delivery_time || x.delivery_time || 0),
        companyLogo:x.company?.picture
      }));
    return res.status(200).json({
      options,
      estimateOnly:true,
      environment:sandbox?'sandbox':'production',
      message:'Cotação preliminar: peso da embalagem e dimensões finais devem ser confirmados antes do pagamento.'
    });
  } catch (err) {
    console.error('Shipping quote failed',err instanceof Error ? err.message:'unknown');
    return res.status(503).json({ error:'Cotação temporariamente indisponível.' });
  }
}
