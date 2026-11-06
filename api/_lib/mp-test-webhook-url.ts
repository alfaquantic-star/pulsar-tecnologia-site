/**
 * The public Supabase test ingress is a narrow receiver for signed Mercado
 * Pago notifications. It queues payment IDs but does NOT approve orders.
 *
 * Do not configure a deployment-specific Vercel Preview URL: the provider
 * cannot supply Vercel's private protection bypass header.
 */
const TEST_INGRESS_ORIGIN = 'https://srvctqtmlbkmgiazgsrj.supabase.co';
const TEST_INGRESS_PATH = '/functions/v1/pulsar-mp-test-ingress';

export function parseTestWebhookUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.origin !== TEST_INGRESS_ORIGIN ||
        url.pathname !== TEST_INGRESS_PATH ||
        url.search !== '' || url.hash !== '' ||
        url.username !== '' || url.password !== '') return null;
    return url;
  } catch {
    return null;
  }
}

export async function isPublicWebhookReachable(url: URL): Promise<boolean> {
  if (!parseTestWebhookUrl(url.toString())) return false;
  try {
    const response = await fetch(url, {
      method: 'GET', redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
      return false;
    }
    const health = await response.json().catch(() => null);
    return health?.service === 'pulsar-mp-test-ingress' &&
      health?.environment === 'test' &&
      health?.signingReady === true &&
      health?.paymentUpdatesEnabled === false;
  } catch {
    return false;
  }
}
