import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = readFileSync(new URL('../src/components/CustomerArea.tsx', import.meta.url), 'utf8');

test('private order history can be refreshed without a page reload', () => {
  assert.match(file, /setRefreshVersion\(version => version \+ 1\)/);
  assert.match(file, /refreshVersion\]\)/);
  assert.match(file, /Atualizar pedidos/);
  assert.match(file, /disabled=\{historyState === 'loading'\}/);
});

test('UI refuses stale requests after account switch or unmount', () => {
  assert.match(file, /if \(!active\) return;/);
  assert.match(file, /return \(\) => \{ active = false; \}/);
  assert.match(file, /setPrivateOrders\(\[\]\)/);
  assert.match(file, /setLastUpdated\(null\)/);
  assert.match(file, /result\.filter\(order => order\.customerId === currentUser\.id\)/);
  assert.doesNotMatch(file, /customerEmail\.toLowerCase\(\) === currentUser\.email/);
});

test('network failure offers retry instead of displaying empty success', () => {
  assert.match(file, /if \(!result\) \{\s*setHistoryState\('error'\)/);
  assert.match(file, /\.catch\(\(\) => \{\s*if \(active\) setHistoryState\('error'\)/);
  assert.match(file, /Clique em “Atualizar pedidos”/);
});
