import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('Supabase email rate limit gets distinct user-friendly message', () => {
 const ctx=read('src/context/StoreContext.tsx');
 const modal=read('src/components/AuthModal.tsx');
 assert.match(ctx, /status === 429/);
 assert.match(ctx, /over_email_send_rate_limit/);
 assert.match(ctx, /reason: 'rate_limit'/);
 assert.match(modal, /result\.reason === 'rate_limit'/);
 assert.match(modal, /Limite gratuito de envio/);
 assert.doesNotMatch(modal, /Verifique se seu e-mail é autorizado na equipe Supabase e tente novamente/);
});
