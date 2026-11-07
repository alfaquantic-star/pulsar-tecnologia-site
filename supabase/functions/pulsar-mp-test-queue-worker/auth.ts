/** Timing-safe bearer secret verification for worker-to-worker calls. */
export async function workerBearerAuthorized(
  authorization: string | null,
  expected: string | undefined
): Promise<boolean> {
  if (!expected || expected.trim().length < 32 ||
      !authorization?.startsWith('Bearer ')) return false;
  const provided = authorization.slice(7);
  if (provided.length > 512) return false;
  const digest = async (value: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(provided), digest(expected)]);
  let mismatch = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
