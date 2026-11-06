/**
 * A Mercado Pago notification is a server-to-server POST. The provider cannot
 * send Vercel's private Preview bypass header, so an ephemeral VERCEL_URL is
 * NOT a safe default for the Checkout Pro notification_url.
 */
export function parseTestWebhookUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.port || url.search || url.hash ||
        url.pathname !== '/api/mercadopago/webhook' ||
        url.hostname === 'localhost' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) ||
        url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function isPublicWebhookReachable(url: URL): Promise<boolean> {
  try {
    // The webhook rejects GET with JSON 405. That distinguishes a reachable
    // handler from Vercel Deployment Protection (typically 401/403 + HTML).
    const response = await fetch(url, {
      method: 'GET', redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.timeout(7000)
    });
    return response.status === 405 &&
      (response.headers.get('content-type') || '').includes('application/json') &&
      (await response.json().catch(() => null))?.error === 'Method not allowed';
  } catch {
    return false;
  }
}
