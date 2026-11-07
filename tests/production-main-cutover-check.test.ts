import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectArchitecture } from '../scripts/check-main-cutover.mjs';
const fromRepo = file => {
  try { return readFileSync(new URL('../' + file, import.meta.url), 'utf8'); } catch { return null; }
};
test('Preview code conforms to server-side architecture release gate', () => {
  assert.deepEqual(inspectArchitecture(fromRepo), []);
});
test('Production cutover checker refuses browser access to private orders and settings', () => {
  const spoof = file => {
    const source = fromRepo(file);
    if (file === 'src/lib/supabase.ts') return source + "\nclient.from('orders').select('*');\n";
    return source;
  };
  assert.ok(inspectArchitecture(spoof).some(x => x.includes('consulta pedidos')));
});
test('Production cutover checker refuses direct browser writes', () => {
  const spoof = file => file === 'src/lib/supabase.ts'
    ? fromRepo(file) + "\nclient.from('products').update({price:1});\n"
    : fromRepo(file);
  assert.ok(inspectArchitecture(spoof).some(x => x.includes('escreve diretamente')));
});
test('Production cutover checker requires server APIs and authenticated roles', () => {
  assert.ok(inspectArchitecture(file => file === 'api/admin/orders.ts' ? null : fromRepo(file)).some(x => x.includes('APIs server-side')));
});
