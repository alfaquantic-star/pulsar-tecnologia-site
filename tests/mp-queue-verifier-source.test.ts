import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Preview queue verification uses numeric ID regexes (not escaped literal backslash)', () => {
  const source = readFileSync(new URL('../api/admin/me.ts', import.meta.url), 'utf8');
  const begin = source.indexOf("if (req.query.check === 'webhook_queue_verify'");
  const end = source.indexOf('// Preview-only and admin-only inbox health:', begin);
  assert.ok(begin > 0 && end > begin, 'queue verifier exists');
  const queueVerifier = source.slice(begin, end);
  assert.ok(queueVerifier.includes('/^\\d{6,24}$/'), 'buyer/seller ID validation');
  assert.ok(queueVerifier.includes('/^\\d{1,24}$/'), 'resource ID validation');
  assert.equal(queueVerifier.includes(String.raw`/^\\d`), false, 'must not match literal \\d');
});
