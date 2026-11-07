import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/components/HeroSection.tsx', import.meta.url), 'utf8');
test('hero uses owner-provided full photo, not previously drawn SVG mockup', () => {
  assert.match(src, /0a10751f-8275-4c01-81e6-7668ee439787\.png/);
  assert.doesNotMatch(src, /src="\/assets\/placa-smart-google-nfc\.svg"/);
  assert.match(src, /object-contain/);
  assert.match(src, /lg:col-span-7 relative min-w-0/);
  assert.match(src, /settings\.heroTitle/);
});
