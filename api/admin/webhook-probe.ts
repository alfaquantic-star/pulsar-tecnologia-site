import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomUUID } from 'node:crypto';
import { requireAdmin } from '../_lib/admin-auth.js';

/** Authenticated admin-only PREVIEW webhook end-to-end diagnostic.
 * Makes a signed synthetic (non-payment) POST to this exact deployment.
 * Does not create an order, query MP, or modify payment state.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  if (process.env.VERCEL_ENV !== 'preview') {
    return res.status(403).json({ error: 'Somente Preview' });
  }
  try {
    const auth = await requireAdmin(req);
    if (!auth) return res.status(403).json({ error: 'Administrador não autorizado' });
    const secret = process.env.MP_WEBHOOK_SECRET?.trim();
    const hostname = process.env.VERCEL_URL?.trim();
    if (!secret || !hostname || !/^[a-z0-9.-]+\.vercel\.app$/.test(hostname)) {
      return res.status(503).json({ error: 'Assinatura ou URL do Preview ausente' });
    }
    const requestId = 'internal-probe-' + randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const resourceId = 'diagnostic';
    const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
    const digest = createHmac('sha256', secret).update(manifest).digest('hex');

    const response = await fetch('https://' + hostname + '/api/mercadopago/webhook?data.id=' +
      resourceId + '&type=diagnostic', {
      method: 'POST', cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'x-signature': 'ts=' + timestamp + ',v1=' + digest
      },
      body: JSON.stringify({ type:'diagnostic', action:'internal.probe',
        data: { id: resourceId } })
    });
    let result: Record<string, unknown> = {};
    try { result = await response.json(); } catch {}
    const status = response.status;
    const webhookSignatureAccepted = response.ok &&
      result.received === true && result.ignored === true;
    const diagnostic = await auth.db.from('pulsar_webhook_diagnostics')
      .select('last_attempt_at,signature_header_present,request_id_header_present,query_data_id_present,body_data_id_present,signature_format_valid,signature_verified')
      .eq('id','mp_preview').maybeSingle();
    return res.status(200).json({
      success: webhookSignatureAccepted && !diagnostic.error &&
        diagnostic.data?.signature_verified === true,
      routeHttpStatus: status,
      webhookSignatureAccepted,
      databaseDiagnosticRecorded: !diagnostic.error && !!diagnostic.data,
      databaseDiagnosticSignatureVerified: diagnostic.data?.signature_verified === true,
      diagnosticDbErrorCode: diagnostic.error?.code || null,
      message: webhookSignatureAccepted
        ? 'O webhook interno aceitou uma notificação fictícia assinada.'
        : 'O webhook interno não aceitou a notificação fictícia; consulte os indicadores.'
    });
  } catch {
    return res.status(503).json({ error: 'Autoteste indisponível. Nenhum pagamento alterado.' });
  }
}
