/**
 * Mercado Pago API Service for Pulsar Tecnologia
 * Handles Checkout Pro Preferences, Direct Payments and Connection Diagnostics
 */

export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  currency_id: 'BRL';
  unit_price: number;
}

export interface MercadoPagoPreferencePayload {
  items: MercadoPagoPreferenceItem[];
  payer: {
    name: string;
    surname?: string;
    email: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type: 'CPF' | 'CNPJ';
      number: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: number;
    };
  };
  shipments?: {
    cost: number;
    mode?: string;
  };
  back_urls?: {
    success: string;
    pending: string;
    failure: string;
  };
  auto_return?: 'approved' | 'all';
  statement_descriptor?: string;
  external_reference?: string;
}

export interface PreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  collector_id?: number;
}

/**
 * Creates a Mercado Pago Checkout Pro Preference.
 * Uses local proxy /api/mercadopago/create-preference to avoid browser CORS,
 * with graceful fallback to direct API call.
 */
export async function createMercadoPagoPreference(params: {
  accessToken: string;
  sandbox: boolean;
  orderNumber: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
  }[];
  customer: {
    fullName: string;
    email: string;
    cpf: string;
    whatsapp: string;
  };
  shippingAddress: {
    zipCode: string;
    street: string;
    number: string;
  };
  shippingPrice: number;
  discountAmount?: number;
}): Promise<PreferenceResult> {
  const {
    accessToken,
    sandbox,
    orderNumber,
    items,
    customer,
    shippingAddress,
    shippingPrice,
    discountAmount = 0
  } = params;

  // Split Name into First and Last name
  const nameParts = customer.fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Cliente';
  const lastName = nameParts.slice(1).join(' ') || 'Pulsar';

  // Format clean CPF (only digits)
  const cleanCpf = customer.cpf.replace(/\D/g, '') || '00000000000';

  // Format clean Phone
  const cleanPhone = customer.whatsapp.replace(/\D/g, '');
  const areaCode = cleanPhone.length >= 10 ? cleanPhone.substring(0, 2) : '11';
  const phoneNumber = cleanPhone.length >= 10 ? cleanPhone.substring(2) : cleanPhone;

  // Format clean Zip
  const cleanZip = shippingAddress.zipCode.replace(/\D/g, '') || '01310100';
  const streetNumber = parseInt(shippingAddress.number.replace(/\D/g, ''), 10) || 1;

  // Calculate proportional discount across items to maintain exact totals in Mercado Pago
  const rawSubtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountFactor = rawSubtotal > 0 && discountAmount > 0 ? Math.max(0, (rawSubtotal - discountAmount) / rawSubtotal) : 1;

  const mpItems: MercadoPagoPreferenceItem[] = items.map((it) => {
    const adjustedUnitPrice = Math.max(1, parseFloat((it.unitPrice * discountFactor).toFixed(2)));
    return {
      id: it.id || 'prod-' + Math.random().toString(36).substring(2, 7),
      title: it.name.substring(0, 255),
      description: `Produto Pulsar Tecnologia - ${it.name}`.substring(0, 255),
      picture_url: it.image?.startsWith('http') ? it.image : undefined,
      category_id: 'electronics',
      quantity: it.quantity,
      currency_id: 'BRL',
      unit_price: adjustedUnitPrice
    };
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pulsartecnologia.com.br';

  const preferencePayload: MercadoPagoPreferencePayload = {
    items: mpItems,
    payer: {
      name: firstName,
      surname: lastName,
      email: customer.email.trim(),
      phone: {
        area_code: areaCode,
        number: phoneNumber
      },
      identification: {
        type: 'CPF',
        number: cleanCpf
      },
      address: {
        zip_code: cleanZip,
        street_name: shippingAddress.street,
        street_number: streetNumber
      }
    },
    shipments: {
      cost: parseFloat((shippingPrice || 0).toFixed(2)),
      mode: 'not_specified'
    },
    back_urls: {
      success: `${baseUrl}/?status=approved&order=${orderNumber}`,
      pending: `${baseUrl}/?status=pending&order=${orderNumber}`,
      failure: `${baseUrl}/?status=failure&order=${orderNumber}`
    },
    auto_return: 'approved',
    statement_descriptor: 'PULSAR TEC',
    external_reference: orderNumber
  };

  const res = await fetch('/api/mercadopago/create-preference', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preference: preferencePayload })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao criar pagamento Mercado Pago');
  return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point || data.init_point };

}

/**
 * Tests connection to Mercado Pago with the provided Access Token
 */
export async function testMercadoPagoConnection(accessToken: string): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  if (!accessToken || !accessToken.trim()) {
    return {
      success: false,
      message: 'Access Token não informado. Preencha o campo com seu token Mercado Pago (começando com APP_USR- ou TEST-).'
    };
  }

  try {
    // Attempt via backend test route
    const res = await fetch('/api/mercadopago/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken: accessToken.trim() })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend test route error, falling back to direct check...', err);
  }

  // Nunca envie Access Token diretamente pelo navegador.
  return { success: false, message: 'Configure MERCADO_PAGO_ACCESS_TOKEN nas variáveis protegidas da Vercel. Testes devem ocorrer apenas no servidor.' };
}
