/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Kit, Order, SiteSettings, CustomerProfile, OrderPaymentStatus, OrderShippingStatus } from '../types';

// Storage keys for custom Supabase credentials configured via the Admin UI
const STORAGE_URL_KEY = 'pulsar_supabase_url';
const STORAGE_KEY_KEY = 'pulsar_supabase_anon_key';

/**
 * Retrieves the effective Supabase URL and Anon Key.
 * Checks localStorage overrides first (configured in Admin Panel),
 * then falls back to environment variables.
 */
export function getSupabaseCredentials(): { url: string; key: string } {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  const url = (localUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return { url, key };
}

/**
 * Saves custom Supabase credentials from the Admin Panel.
 */
export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);

    // Reset client instance
    cachedClient = null;
  }
}

/**
 * Checks if Supabase credentials have been configured.
 */
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20 &&
    !url.includes('your-project')
  );
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns an initialized Supabase Client or null if not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Erro ao instanciar cliente Supabase:', err);
    return null;
  }
}

/**
 * Test connectivity with the configured Supabase instance.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase não configurado. Forneça a URL do Projeto e a Chave Anon (pública).',
    };
  }

  try {
    // Attempt a lightweight select from products or site_settings
    const { data, error } = await client
      .from('site_settings')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist yet, user might still have connected successfully to project
      if (error.code === '42P01') {
        return {
          success: true,
          message:
            'Conexão estabelecida com sucesso! Porém as tabelas ainda não foram criadas. Execute o Script SQL fornecido no Editor SQL do seu painel Supabase.',
          details: error,
        };
      }
      return {
        success: false,
        message: `Falha na consulta ao Supabase: ${error.message} (Código: ${error.code})`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Conexão ativa e funcionando com o Supabase! Banco de dados e tabelas operacionais.',
      details: data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Erro de rede ao conectar com o Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// -----------------------------------------------------------------------------
// PRODUTOS (PRODUCTS)
// -----------------------------------------------------------------------------

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar produtos do Supabase:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      detailedDescription: row.detailed_description || row.short_description,
      salePrice: Number(row.sale_price),
      promoPrice: row.promo_price ? Number(row.promo_price) : undefined,
      cost: Number(row.cost || 0),
      stock: Number(row.stock || 0),
      trackStock: Boolean(row.track_stock),
      sku: row.sku,
      category: row.category,
      chipType: row.chip_type,
      dimensions: {
        heightCm: Number(row.height_cm || 15),
        widthCm: Number(row.width_cm || 10),
        lengthCm: Number(row.length_cm || 5),
      },
      weightGrams: Number(row.weight_grams || 180),
      isActive: Boolean(row.is_active),
      isFeatured: Boolean(row.is_featured),
      isBestSeller: Boolean(row.is_best_seller),
      rating: Number(row.rating || 5),
      reviewsCount: Number(row.reviews_count || 1),
      badge: row.badge,
      images: Array.isArray(row.images) ? row.images : [],
    }));
  } catch (err) {
    console.warn('Falha na chamada fetchProductsFromSupabase:', err);
    return null;
  }
}

export async function upsertProductInSupabase(prod: Product): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      short_description: prod.shortDescription,
      detailed_description: prod.detailedDescription,
      sale_price: prod.salePrice,
      promo_price: prod.promoPrice || null,
      cost: prod.cost,
      stock: prod.stock,
      track_stock: prod.trackStock,
      sku: prod.sku,
      category: prod.category,
      chip_type: prod.chipType,
      height_cm: prod.dimensions?.heightCm || 15,
      width_cm: prod.dimensions?.widthCm || 10,
      length_cm: prod.dimensions?.lengthCm || 5,
      weight_grams: prod.weightGrams,
      is_active: prod.isActive,
      is_featured: prod.isFeatured,
      is_best_seller: prod.isBestSeller,
      rating: prod.rating,
      reviews_count: prod.reviewsCount,
      badge: prod.badge || null,
      images: prod.images,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('products').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao sincronizar produto no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha no upsertProductInSupabase:', err);
    return false;
  }
}

export async function deleteProductInSupabase(productId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('products').delete().eq('id', productId);
    return !error;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// COMBOS / KITS
// -----------------------------------------------------------------------------

export async function fetchKitsFromSupabase(): Promise<Kit[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('kits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar combos do Supabase:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: row.image,
      kitPrice: Number(row.kit_price),
      referencePrice: Number(row.reference_price),
      savingsAmount: Number(row.savings_amount || 0),
      discountPercentage: Number(row.discount_percentage || 0),
      badge: row.badge,
      isActive: Boolean(row.is_active),
      isFeatured: Boolean(row.is_featured),
      items: Array.isArray(row.items) ? row.items : [],
    }));
  } catch (err) {
    console.warn('Falha no fetchKitsFromSupabase:', err);
    return null;
  }
}

export async function upsertKitInSupabase(kit: Kit): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: kit.id,
      name: kit.name,
      slug: kit.slug,
      description: kit.description,
      image: kit.image,
      kit_price: kit.kitPrice,
      reference_price: kit.referencePrice,
      savings_amount: kit.savingsAmount,
      discount_percentage: kit.discountPercentage,
      badge: kit.badge || null,
      is_active: kit.isActive,
      is_featured: kit.isFeatured,
      items: kit.items,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('kits').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteKitInSupabase(kitId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('kits').delete().eq('id', kitId);
    return !error;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// PEDIDOS (ORDERS)
// -----------------------------------------------------------------------------

export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar pedidos do Supabase:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number || row.id.replace('ord-', 'PLS-').toUpperCase(),
      customerId: row.customer_id || 'guest',
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerWhatsapp: row.customer_phone || row.customer_whatsapp || '',
      customerCpf: row.customer_cpf,
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal),
      discount: Number(row.discount_amount || 0),
      shipping: {
        id: 'melhor-envio',
        carrier: row.shipping_carrier || 'Melhor Envio / Correios',
        service: row.shipping_service || 'SEDEX Expresso',
        price: Number(row.shipping_price || 0),
        estimatedDays: 3,
      },
      total: Number(row.total_amount || row.subtotal),
      paymentMethod: row.payment_method || 'pix',
      paymentStatus: (row.payment_status as OrderPaymentStatus) || 'pending',
      shippingStatus: (row.shipping_status as OrderShippingStatus) || 'pending',
      trackingCode: row.tracking_code,
      shippingAddress: row.shipping_address,
      pixQrCodeUrl: row.pix_qr_code,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Falha no fetchOrdersFromSupabase:', err);
    return null;
  }
}

export async function createOrderInSupabase(order: Order): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId || null,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerWhatsapp,
      customer_cpf: order.customerCpf,
      items: order.items,
      subtotal: order.subtotal,
      discount_amount: order.discount,
      shipping_price: order.shipping.price,
      total_amount: order.total,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      shipping_carrier: order.shipping.carrier,
      shipping_service: order.shipping.service,
      tracking_code: order.trackingCode || null,
      shipping_address: order.shippingAddress,
      pix_qr_code: order.pixQrCodeUrl || null,
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('orders').insert(row);
    if (error) {
      console.warn('Erro ao inserir pedido no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha no createOrderInSupabase:', err);
    return false;
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  paymentStatus?: OrderPaymentStatus,
  trackingCode?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (paymentStatus) {
      payload.payment_status = paymentStatus;
    }
    if (trackingCode !== undefined) {
      payload.tracking_code = trackingCode;
    }

    const { error } = await client.from('orders').update(payload).eq('id', orderId);
    return !error;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// CONFIGURAÇÕES DO SITE (SITE SETTINGS)
// -----------------------------------------------------------------------------

export async function fetchSettingsFromSupabase(): Promise<Partial<SiteSettings> | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return null;

    return {
      logoUrl: data.logo_url,
      heroTitle: data.hero_title,
      heroTitleHighlight: data.hero_title_highlight,
      heroSubtitle: data.hero_subtitle,
      announcementBarText: data.announcement_bar_text,
      whatsappNumber: data.whatsapp_number,
      originCep: data.origin_cep,
      mercadoPagoPublicKey: data.mercado_pago_public_key,
      melhorEnvioToken: undefined, // Token nunca deve vir de tabela pública
    };
  } catch {
    return null;
  }
}

export async function updateSettingsInSupabase(settings: Partial<SiteSettings>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: 'default',
      logo_url: settings.logoUrl,
      hero_title: settings.heroTitle,
      hero_title_highlight: settings.heroTitleHighlight,
      hero_subtitle: settings.heroSubtitle,
      announcement_bar_text: settings.announcementBarText,
      whatsapp_number: settings.whatsappNumber,
      origin_cep: settings.originCep,
      mercado_pago_public_key: settings.mercadoPagoPublicKey,
      // Tokens ficam exclusivamente em variáveis protegidas na Vercel.
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('site_settings').upsert(row, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// SUPABASE STORAGE (UPLOADS DE FOTOS)
// -----------------------------------------------------------------------------

export async function uploadFileToSupabaseStorage(
  file: File | Blob,
  fileName: string,
  bucket = 'pulsar-assets'
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const filePath = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await client.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.warn('Erro ao fazer upload para o Supabase Storage:', error.message);
      return null;
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(filePath);
    return publicUrlData.publicUrl || null;
  } catch (err) {
    console.warn('Falha ao enviar arquivo para o Supabase Storage:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// AUTENTICAÇÃO (SUPABASE AUTH)
// -----------------------------------------------------------------------------

export async function signUpWithSupabase(
  email: string,
  pass: string,
  fullName: string
): Promise<{ user: CustomerProfile | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase não configurado' };

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Usuário não retornado pelo Supabase' };

    const u: CustomerProfile = {
      id: data.user.id,
      fullName,
      email: data.user.email || email,
      whatsapp: '',
      cpf: '',
      role: 'customer',
      createdAt: data.user.created_at || new Date().toISOString(),
      addresses: [],
    };

    // Also register in public.customers
    await client.from('customers').upsert(
      {
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
      },
      { onConflict: 'id' }
    );

    return { user: u };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function signInWithSupabase(
  email: string,
  pass: string
): Promise<{ user: CustomerProfile | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase não configurado' };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Credenciais inválidas' };

    const role = 'customer';

    const u: CustomerProfile = {
      id: data.user.id,
      fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      email: data.user.email || email,
      whatsapp: '',
      cpf: '',
      role,
      createdAt: data.user.created_at || new Date().toISOString(),
      addresses: [],
    };

    return { user: u };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function signOutFromSupabase(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
}
