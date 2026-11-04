import { createHmac, timingSafeEqual } from 'node:crypto';

type SignatureRequest = {
  signature: unknown;
  requestId: unknown;
  dataId: unknown;
};

export function validateMercadoPagoSignature(request: SignatureRequest, secret: string): boolean {
  if (!secret || secret.length > 4096 ||
      typeof request.signature !== 'string' ||
      typeof request.requestId !== 'string' ||
      typeof request.dataId !== 'string') return false;

  const signature = request.signature;
  const requestId = request.requestId;
  const dataId = request.dataId.trim().toLowerCase();
  if (signature.length > 1024 || !requestId || requestId.length > 200 ||
      !/^[a-z0-9_-]{1,128}$/.test(dataId)) return false;

  const parts = Object.fromEntries(signature.split(',').map(part => {
    const [key, ...value] = part.split('=');
    return [key?.trim() || '', value.join('=').trim()];
  }));
  const ts = parts.ts;
  const receivedHash = parts.v1;
  if (typeof ts !== 'string' || !/^\d{10,13}$/.test(ts) ||
      typeof receivedHash !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(receivedHash)) return false;

  // Mercado Pago can retry signed notifications after the original delivery.
  // Do not expire otherwise valid HMAC signatures based on clock skew. Replay
  // safety is enforced via order idempotency and conditional DB transitions.
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const received = Buffer.from(receivedHash, 'hex');
  return received.length === expected.length && timingSafeEqual(expected, received);
}
