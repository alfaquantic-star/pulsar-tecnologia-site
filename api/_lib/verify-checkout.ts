import { adminDatabase } from './admin-auth.js';

/** A single server-side authority for preview quotes and future checkout. */
export class CheckoutError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type RequestedItem = { productId?: string; kitId?: string; quantity: number };
type Product = { id: string; name: string; is_active: boolean; stock: number;
  track_stock: boolean; sale_price: number; promo_price: number | null;
  height_cm: number; width_cm: number; length_cm: number; weight_grams: number };
type Kit = { id: string; name: string; is_active: boolean;
  kit_price: number; items: unknown };
const cents = (v: number) => Math.round(v * 100);
const validQuantity = (v: unknown) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 100;

export async function verifyCheckout(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    throw new CheckoutError(400, 'O carrinho deve conter de 1 a 20 itens.');
  }
  // No customer can submit a coupon or price reduction. The browser must
  // never authorize discounts, even with a modified request payload.
  const attemptedCoupon = typeof body.coupon === 'string' && body.coupon.trim().length > 0;
  const attemptedDiscount = body.discountAmount !== undefined &&
    body.discountAmount !== null && Number(body.discountAmount) !== 0;
  if (attemptedCoupon || attemptedDiscount) {
    throw new CheckoutError(403, 'Cupons e descontos são exclusivos do administrador e exigem autorização do servidor.');
  }
  const requested: RequestedItem[] = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        !validQuantity(item.quantity) ||
        (typeof item.productId === 'string') === (typeof item.kitId === 'string')) {
      throw new CheckoutError(400, 'Produto, kit ou quantidade inválidos.');
    }
    const id = item.productId || item.kitId;
    if (typeof id !== 'string' || id.length < 1 || id.length > 128) {
      throw new CheckoutError(400, 'Identificador de produto inválido.');
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
        throw new CheckoutError(422, 'Kit indisponível ou sem composição cadastrada.');
      }
      for (const piece of kit.items) {
        if (!piece || typeof piece.productId !== 'string' || !validQuantity(piece.quantity)) {
          throw new CheckoutError(422, 'Composição de kit inválida.');
        }
        add(piece.productId,piece.quantity*line.quantity);
      }
    }
    const units = [...counts.values()].reduce((sum,v) => sum+v,0);
    if (!counts.size || counts.size > 30 || units > 200) {
      throw new CheckoutError(422, 'Quantidade excede o limite da validação.');
    }
    const found = await db.from('products')
      .select('id,name,is_active,stock,track_stock,sale_price,promo_price,height_cm,width_cm,length_cm,weight_grams')
      .in('id',[...counts.keys()]);
    if (found.error) throw Error('products_query_failed');
    const productMap = new Map<string,Product>((found.data || []).map(p => [p.id,p as Product]));
    for (const [id,quantity] of counts) {
      const p = productMap.get(id);
      if (!p || !p.is_active) throw new CheckoutError(422, 'Produto indisponível.');
      if (p.track_stock && (!Number.isInteger(Number(p.stock)) || Number(p.stock) < quantity)) {
        throw new CheckoutError(422, 'Estoque insuficiente para os itens selecionados.');
      }
    }
    const lines: Array<{ id:string; kind:'product'|'kit'; name:string; quantity:number; unitPrice:number; total:number }> = [];
    let subtotalCents=0;
    for (const item of requested) {
      const record = item.productId ? productMap.get(item.productId) : kitMap.get(item.kitId!);
      if (!record) throw new CheckoutError(422, 'Item indisponível.');
      const unitPrice = item.productId
        ? Number((record as Product).promo_price ?? (record as Product).sale_price)
        : Number((record as Kit).kit_price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 100000) {
        throw new CheckoutError(422, 'Preço inválido no catálogo.');
      }
      const totalCents = cents(unitPrice)*item.quantity;
      subtotalCents += totalCents;
      lines.push({ id:record.id,kind:item.productId?'product':'kit',name:record.name,
        quantity:item.quantity,unitPrice:cents(unitPrice)/100,total:totalCents/100 });
    }
    // If requested, re-quote shipping using the exact validated cart.
    // No client-supplied shipping price, insurance value or dimensions are trusted.
    let shipping: { id:string; carrier:string; service:string; price:number; estimatedDays:number } | null = null;
    if (body.cep !== undefined || body.shippingId !== undefined) {
      const destination = typeof body.cep === 'string' ? body.cep.replace(/\D/g,'') : '';
      if (destination.length !== 8 || typeof body.shippingId !== 'string' ||
          body.shippingId.length > 80 || !body.shippingId.length) {
        throw new CheckoutError(400, 'Informe CEP e modalidade de frete válidos para calcular o total.');
      }
      const origin = (process.env.SHIPPING_ORIGIN_CEP || '').replace(/\D/g,'');
      const token = process.env.MELHOR_ENVIO_TOKEN;
      if (origin.length !== 8 || !token) {
        throw new CheckoutError(503, 'Melhor Envio ainda não configurado no servidor.');
      }
      const shipment = [];
      for (const [id,quantity] of counts) {
        const p = productMap.get(id)!;
        const width = Number(p.width_cm), height = Number(p.height_cm);
        const length = Number(p.length_cm), grams = Number(p.weight_grams);
        const price = Number(p.promo_price ?? p.sale_price);
        if (![width,height,length,grams,price].every(Number.isFinite) ||
            Math.min(width,height,length,grams,price) <= 0 || Math.max(width,height,length) > 200) {
          throw new CheckoutError(422, 'Um dos produtos não possui medidas ou peso válidos.');
        }
        shipment.push({ id, width, height, length,
          weight:Number((grams/1000).toFixed(4)), insurance_value:price, quantity });
      }
      const sandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
      const base = sandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
      const upstream = await fetch(base + '/api/v2/me/shipment/calculate', {
        method:'POST',
        headers:{ Authorization:'Bearer '+token, Accept:'application/json',
          'Content-Type':'application/json',
          'User-Agent':process.env.MELHOR_ENVIO_USER_AGENT || 'Pulsar Tecnologia (suporte@pulsartecnologia.com.br)' },
        body:JSON.stringify({ from:{postal_code:origin}, to:{postal_code:destination}, products:shipment }),
        signal:AbortSignal.timeout(10000),
        cache:'no-store'
      });
      if (!upstream.ok) throw new CheckoutError(502, 'Melhor Envio recusou a nova cotação.');
      const services:unknown = await upstream.json();
      if (!Array.isArray(services)) throw new CheckoutError(502, 'Resposta inválida na nova cotação.');
      const selected = services.find((option:any) =>
        !option.error && String(option.id) === body.shippingId &&
        Number(option.custom_price || option.price) > 0
      );
      if (!selected) throw new CheckoutError(422, 'Modalidade de frete indisponível. Calcule novamente.');
      const price = Number(selected.custom_price || selected.price);
      if (!Number.isFinite(price) || price <= 0 || price > 100000) {
        throw new CheckoutError(422, 'Preço de frete inválido.');
      }
      shipping = { id:String(selected.id), carrier:String(selected.company?.name || 'Transportadora'),
        service:String(selected.name || 'Entrega'), price:cents(price)/100,
        estimatedDays:Number(selected.custom_delivery_time || selected.delivery_time || 0) };
    }
    // Preview mode does NOT authorize coupon discounts. Hardcoded frontend
    // coupon names are not proof of a valid promotion or eligibility.
    const shippingCents = shipping ? cents(shipping.price) : 0;
    return {
      validated:true, estimateOnly:true, canPay:false,
      lines, subtotal:subtotalCents/100,
      shipping, discount:0, total:(subtotalCents + shippingCents)/100,
      couponStatus:'none',
      message:shipping
        ? 'Subtotal e frete recalculados no servidor. Cupons ainda não autorizados e pagamento bloqueado.'
        : 'Preços e estoque verificados no Supabase. Frete, cupons e pagamento ainda requerem validação final no servidor.'
    };
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    console.error('Checkout validation unavailable', err instanceof Error ? err.message : 'unknown');
    throw new CheckoutError(503, 'Não foi possível validar o catálogo agora.');
  }

}
