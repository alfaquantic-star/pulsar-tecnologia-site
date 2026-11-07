import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const modal = readFileSync(new URL('../src/components/AuthModal.tsx', import.meta.url), 'utf8');
test('live site offers the protected administrator portal instead of a disabled password login', () => {
  assert.match(modal, /Acesso Lojista Seguro/);
  assert.match(modal, /pulsar-tecnologia-site-git-security-server-api-phase1-qr-flow\.vercel\.app/);
  assert.match(modal, /target="_blank"/);
  assert.match(modal, /rel="noopener noreferrer"/);
  assert.doesNotMatch(modal, /handleAdminSubmit/);
  assert.doesNotMatch(modal, /loginAsAdmin\(/);
});
