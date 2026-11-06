import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminIdentity, adminDatabase } from '../_lib/admin-auth.js';
import { createHmac, randomUUID } from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(req.method === 'GET' || (req.method === 'POST' && req.query.check === 'webhook_probe'))) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ code: 'method_not_allowed' });
  }
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'missing_session' });
  }
  try {
    const user = await verifyAdminIdentity(req);
    if (!user) return res.status(403).json({ code: 'not_authorized_admin' });

    if (req.query.check === 'webhook_probe' && req.method === 'POST') {
      if (process.env.VERCEL_ENV !== 'preview') {
        return res.status(403).json({ error: 'Somente Preview' });
      }
      const secret = process.env.MP_WEBHOOK_SECRET?.trim();
      const hostname = process.env.VERCEL_URL?.trim();
      if (!secret || !hostname || !/^[a-z0-9.-]+\\.vercel\\.app$/.test(hostname)) {
        return res.status(503).json({ error: 'Assinatura ou URL do Preview ausente' });
      }
      const requestId = 'internal-probe-' + randomUUID();
      const timestamp = String(Math.floor(Date.now() / 1000));
      const resourceId = 'diagnostic';
      const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
      const digest = createHmac('sha256', secret).update(manifest).digest('hex');
      const response = await fetch('https://' + hostname +
        '/api/mercadopago/webhook?data.id=diagnostic&type=diagnostic', {
        method: 'POST', cache: 'no-store',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type':'application/json',
          'x-request-id':requestId, 'x-signature':`ts=${timestamp},v1=${digest}` },
        body: JSON.stringify({type:'diagnostic',action:'internal.probe',data:{id:resourceId}})
      });
      let body: Record<string,unknown> = {};
      try { body = await response.json(); } catch {}
      const webhookSignatureAccepted =
        response.ok && body.received === true && body.ignored === true;
      const diag = await adminDatabase().from('pulsar_webhook_diagnostics')
        .select('last_attempt_at,signature_verified')
        .eq('id', 'mp_preview').maybeSingle();
      return res.status(200).json({
        success: webhookSignatureAccepted && !diag.error && diag.data?.signature_verified === true,
        routeHttpStatus: response.status,
        webhookSignatureAccepted,
        databaseDiagnosticRecorded: !diag.error && Boolean(diag.data),
        databaseDiagnosticSignatureVerified: diag.data?.signature_verified === true,
        diagnosticDbErrorCode: diag.error?.code || null,
        message: webhookSignatureAccepted
          ? 'Webhook interno autenticou uma notificação fictícia sem pagamento.'
          : 'Falha ao autenticar a notificação fictícia; consulte o HTTP.'
      });
    }

    // Protected, read-only access to the latest preview webhook signature
    // rejection. Exposes no identifiers, signatures, tokens or customer data.
    if (req.query.check === 'webhook') {
      if (process.env.VERCEL_ENV !== 'preview') {
        return res.status(403).json({ error: 'Somente Preview.' });
      }
      const { data, error } = await adminDatabase()
        .from('pulsar_webhook_diagnostics')
        .select('last_attempt_at,signature_header_present,request_id_header_present,query_data_id_present,body_data_id_present,signature_format_valid,signature_verified')
        .eq('id', 'mp_preview').maybeSingle();
      if (error) return res.status(503).json({
        error: 'Diagnóstico indisponível. Verifique a migração de diagnóstico.'
      });
      return res.status(200).json({
        recorded: Boolean(data),
        diagnostics: data || null,
        message: data
          ? 'Última tentativa POST recebida pelo webhook. Nenhuma credencial é exibida.'
          : 'Nenhuma tentativa POST registrada nesta versão; verifique a URL de destino e a entrega da notificação.'
      });
    }

    // Read-only checkout readiness diagnostics. Reuse the existing admin
    // endpoint instead of adding another Vercel function.
    if (req.query.check === 'checkout') {
      const db = adminDatabase();
      const schema = await db.from('orders')
        .select('checkout_idempotency_key,mercado_pago_preference_id,shipping_service_id').limit(0);
      const checks = {
        previewDeployment: process.env.VERCEL_ENV === 'preview',
        mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()),
        webhookSecretConfigured: Boolean(process.env.MP_WEBHOOK_SECRET?.trim()),
        melhorEnvioTokenConfigured: Boolean(process.env.MELHOR_ENVIO_TOKEN?.trim()),
        shippingOriginConfigured: /^\d{8}$/.test((process.env.SHIPPING_ORIGIN_CEP || '').replace(/\D/g,'')),
        shippingSandboxEnabled: process.env.MELHOR_ENVIO_SANDBOX === 'true',
        idempotencySchemaPrepared: !schema.error,
        paymentPreferenceFlowVerified: false,
        webhookOrderAssociationVerified: false,
        productionRlsCutoverVerified: false
      };
      return res.status(200).json({
        readyForPayments: false, checks,
        message: 'Diagnóstico somente leitura. Nenhum pedido, pagamento ou mudança de permissão foi realizado.'
      });
    }

    // A successful login is separate from privileged catalog/database access.
    // Verify server credentials without exposing the key or any table rows.
    let adminApiReady = false;
    let adminApiDiagnostic = 'not_configured';
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { error } = await adminDatabase().from('products').select('id').limit(1);
        adminApiReady = !error;
        adminApiDiagnostic = error ? 'database_access_rejected' : 'ok';
      } catch {
        adminApiDiagnostic = 'server_credentials_invalid';
      }
    }
    return res.status(200).json({
      authenticated: true,
      userId: user.id,
      adminApiReady,
      adminApiDiagnostic
    });
  } catch (err) {
    console.error('Pulsar admin auth: identity verification failed', {
      name: err instanceof Error ? err.name : 'Unknown'
    });
    return res.status(503).json({ code: 'server_auth_provider_error' });
  }
}
