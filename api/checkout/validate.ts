import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDatabase } from '../_lib/admin-auth.js';

// Preview-only price and inventory validation. This route never creates
// orders/preferences, changes stock, or considers client-provided prices.
type RequestedItem = { productId?: string; kitId?: string; quantity: number };
type Product = { id: string; name: string; is_active: boolean; stock: number;
  track_stock: boolean; sale_price: number; promo_price: number | null };
type Kit = { id: string; name: string; is_active: boolean;
  kit_price: number; items: unknown };
const cents = (v: number) => Math.round(v * 100);
const validQuantity = (v: unknown) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return res.status(400).json({ error: 'O carrinho deve conter de 1 a 20 itens.' });
  }
  const requested: RequestedItem[] = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        !validQuantity(item.quantity) ||
        (typeof item.productId === 'string') === (typeof item.kitId === 'string')) {
      return res.status(400).json({ error: 'Produto, kit ou quantidade inválidos.' });
    }
    const id = item.productId || item.kitId;
    if (typeof id !== 'string' || id.length < 1 || id.length > 128) {
      return res.status(400).json({ error: 'Identificador de produto inválido.' });
    }
    requested.push({ productId: item.productId, kitId: item.kitId, quantity: item.quantity });
  }
  // Ignore any submitted unitPrice, discountAmount or stock fields.
  try {
    const db = adminDatabase();
    const kitIds = [...new Set(requested.flatMap(x => x.kitId ? [x.kitId] : []))];
    const kitMap = new Map<string, Kit>();
    if (kitIds.length) {
      const found = await db.from('kits').select('id,name,is_active,kit_price,items').in('id',kitIds);
      if (found.error) throw Error('kits_query_failed');
      for (const k of found.data || []) kitMap.set(k.id, k as Kit);
    }
    const counts = new Map<string, number>();
    const add = (id: string, qty: number) => counts.set(id,(counts.get(id) || 0) + qty);
    for (const line of requested) {
      if (line.productId) { add(line.productId,line.quantity); continue; }
      const kit = kitMap.get(line.kitId!);
      if (!kit || !kit.is_active || !Array.isArray(kit.items) || !kit.items.length) {
        return res.status(422).json({ error: 'Kit indisponível ou sem composição cadastrada.' });
      }
      for (const piece of kit.items) {
        if (!piece || typeof piece.productId !== 'string' || !validQuantity(piece.quantity)) {
          return res.status(422).json({ error: 'Composição de kit inválida.' });
        }
        add(piece.productId,piece.quantity*line.quantity);
      }
    }
    const units = [...counts.values()].reduce((sum,v) => sum+v,0);
    if (!counts.size || counts.size > 30 || units > 200) {
      return res.status(422).json({ error: 'Quantidade excede o limite da validação.' });
    }
    const found = await db.from('products')
      .select('id,name,is_active,stock,track_stock,sale_price,promo_price')
      .in('id',[...counts.keys()]);
    if (found.error) throw Error('products_query_failed');
    const productMap = new Map<string,Product>((found.data || []).map(p => [p.id,p as Product]));
    for (const [id,quantity] of counts) {
      const p = productMap.get(id);
      if (!p || !p.is_active) return res.status(422).json({ error: 'Produto indisponível.' });
      if (p.track_stock && (!Number.isInteger(Number(p.stock)) || Number(p.stock) < quantity)) {
        return res.status(422).json({ error: 'Estoque insuficiente para os itens selecionados.' });
      }
    }
    const lines: Array<{ id:string; kind:'product'|'kit'; name:string; quantity:number; unitPrice:number; total:number }> = [];
    let subtotalCents=0;
    for (const item of requested) {
      const record = item.productId ? productMap.get(item.productId) : kitMap.get(item.kitId!);
      if (!record) return res.status(422).json({ error: 'Item indisponível.' });
      const unitPrice = item.productId
        ? Number((record as Product).promo_price ?? (record as Product).sale_price)
        : Number((record as Kit).kit_price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 100000) {
        return res.status(422).json({ error: 'Preço inválido no catálogo.' });
      }
      const totalCents = cents(unitPrice)*item.quantity;
      subtotalCents += totalCents;
      lines.push({ id:record.id,kind:item.productId?'product':'kit',name:record.name,
        quantity:item.quantity,unitPrice:cents(unitPrice)/100,total:totalCents/100 });
    }
    // Coupons are intentionally not approved here: discounts must be
    // verified by server-owned rules during actual checkout.
    return res.status(200).json({
      validated:true, estimateOnly:true, canPay:false,
      lines, subtotal:subtotalCents/100,
      message:'Preços e estoque verificados no Supabase. Frete, cupons e pagamento ainda requerem validação final no servidor.'
    });
  } catch (err) {
    console.error('Read-only checkout validation failed',err instanceof Error ? err.message:'unknown');
    return res.status(503).json({ error:'Não foi possível validar o catálogo agora.' });
  }
}
