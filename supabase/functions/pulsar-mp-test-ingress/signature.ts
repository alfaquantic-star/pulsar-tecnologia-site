// Payment provider signature verification. No runtime secrets are stored here.
export async function verifyPaymentSignature(
  secret: string, signature: string | null, requestId: string | null, dataId: string
): Promise<boolean> {
  if (!secret || !signature || signature.length > 512) return false;
  const segments = signature.split(',').map(v => v.trim());
  const ts = segments.find(v => v.startsWith('ts='))?.slice(3);
  const hash = segments.find(v => v.startsWith('v1='))?.slice(3);
  if (!ts || !/^\d{10,13}$/.test(ts) || !hash || !/^[a-f0-9]{64}$/i.test(hash)) return false;
  if (requestId && requestId.length > 200) return false;
  if (dataId && !/^[a-z0-9_-]{1,128}$/i.test(dataId)) return false;
  const manifest = (dataId ? 'id:' + dataId.toLowerCase() + ';' : '') +
    (requestId ? 'request-id:' + requestId + ';' : '') + 'ts:' + ts + ';';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode(manifest)));
  const received = Uint8Array.from(hash.match(/.{2}/g) || [], pair => parseInt(pair, 16));
  if (signed.length !== received.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signed.length; i++) mismatch |= signed[i] ^ received[i];
  return mismatch === 0;
}
