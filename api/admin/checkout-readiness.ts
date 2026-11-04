import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/admin-auth.js';

/**
 * Read-only, authenticated go-live checklist. Never disclose tokens,
 * customer data, or database contents. This route does not write orders,
 * create Mercado Pago preferences, or modify database permissions.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Acesso administrativo necessário.' });

    const isPreview = process.env.VERCEL_ENV === 'preview';
    const paymentTokenPresent = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim());
    const webhookSecretPresent = Boolean(process.env.MP_WEBHOOK_SECRET?.trim());
    const shippingTokenPresent = Boolean(process.env.MELHOR_ENVIO_TOKEN?.trim());
    const validOrigin = /^\d{8}$/.test((process.env.SHIPPING_ORIGIN_CEP || '').replace(/\D/g,''));
    const shippingSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';

    // Select a column that only exists after the staged idempotency migration.
    // Failure is expected on the shared production DB, and must never
    // trigger automatic schema changes from a preview deployment.
    const schema = await auth.db.from('orders')
      .select('checkout_idempotency_key,mercado_pago_preference_id,shipping_service_id')
      .limit(0);
    const stagedColumnsReady = !schema.error;

    const checks = {
      previewDeployment: isPreview,
      mercadoPagoTokenConfigured: paymentTokenPresent,
      webhookSecretConfigured: webhookSecretPresent,
      melhorEnvioTokenConfigured: shippingTokenPresent,
      shippingOriginConfigured: validOrigin,
      shippingSandboxEnabled: shippingSandbox,
      idempotencySchemaPrepared: stagedColumnsReady,
      paymentPreferenceFlowVerified: false,
      webhookOrderAssociationVerified: false,
      productionRlsCutoverVerified: false
    };
    return res.status(200).json({
      readyForPayments: false,
      checks,
      message: 'Diagnóstico somente leitura. Não habilita checkout, cria pedido ou altera o banco.'
    });
  } catch {
    return res.status(503).json({ error: 'Diagnóstico temporariamente indisponível.' });
  }
}
