import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('hero displays the new Google NFC plaque instead of the old React mockup', () => {
  const hero = read('src/components/HeroSection.tsx');
  const svg = read('public/assets/placa-smart-google-nfc.svg');
  assert.match(hero, /src="\/assets\/placa-smart-google-nfc\.svg"/);
  assert.match(hero, /object-contain/);
  assert.match(hero, /loading="eager"/);
  assert.match(svg, /AVALIE NOSSA EMPRESA/);
  assert.match(svg, /QR CODE/);
  assert.match(svg, /NFC/);
  assert.doesNotMatch(hero, /Sua Empresa no Balcão/);
});
