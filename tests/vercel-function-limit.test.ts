import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

test('Vercel Hobby deployment stays within 12 serverless functions', () => {
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('_')) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() && /\.(?:ts|js)$/.test(entry.name) ? [path] : [];
  });
  const funcs = walk(new URL('../api/', import.meta.url).pathname);
  assert.ok(funcs.length <= 12, 'Hobby function limit exceeded: ' + funcs.join(', '));
  assert.ok(!funcs.some(x => x.endsWith('/customer/orders.ts')), 'Do not add a 13th customer orders function');
});
