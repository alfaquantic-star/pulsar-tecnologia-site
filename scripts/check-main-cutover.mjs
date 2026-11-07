#!/usr/bin/env node
/**
 * Read-only release architecture gate. Does NOT deploy or touch Supabase.
 *
 * Usage:
 *   node scripts/check-main-cutover.mjs --ref HEAD
 *   node scripts/check-main-cutover.mjs --ref origin/main
 *
 * This checks *source architecture only*. A pass is not permission to deploy,
 * enable payment or run an RLS migration. Manual end-to-end, database backup,
 * rollout/rollback, identity, and payment validations are additional gates.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.argv.includes('--ref')
  ? process.argv[process.argv.indexOf('--ref') + 1] : 'HEAD';

function gitRead(ref, file) {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch { return null; }
}

export function inspectArchitecture(readFile) {
  const client = readFile('src/lib/supabase.ts');
  const adminOrders = readFile('api/admin/orders.ts');
  const auth = readFile('api/_lib/admin-auth.ts');
  const storefront = readFile('api/storefront/settings.ts');
  const checkout = readFile('api/mercadopago/create-preference.ts');
  const failures = [];
  if (!client) failures.push('Frontend de acesso ao Supabase indisponível');
  if (!adminOrders || !auth || !storefront || !checkout) {
    failures.push('APIs server-side protegidas ausentes');
  }
  if (client) {
    if (/\.from\(['"](?:orders|site_settings)['"]\)/.test(client)) {
      failures.push('Browser ainda consulta pedidos/configurações privados diretamente');
    }
    if (/\.from\(['"](?:orders|products|kits|site_settings)['"]\)\s*\.(?:insert|update|delete|upsert)\s*\(/.test(client)) {
      failures.push('Browser ainda escreve diretamente nas tabelas protegidas');
    }
    for (const endpoint of ['/api/admin/orders','/api/admin/catalog','/api/storefront/settings']) {
      if (!client.includes(endpoint)) failures.push('Frontend não usa endpoint protegido: ' + endpoint);
    }
    if (!/\.from\(['"]products['"]\)\s*\.select\(['"]id,name,slug,/.test(client) ||
        !/\.from\(['"]kits['"]\)\s*\.select\(['"]\*['"]\)\s*\.eq\(['"]is_active['"],\s*true\)/.test(client)) {
      failures.push('Catálogo público não usa selects restritos e produtos/kits ativos');
    }
  }
  if (auth && (!auth.includes('auth.getUser(token)') || !auth.includes('app_metadata?.role'))) {
    failures.push('Autorização administrativa não é baseada em usuário Supabase verificado');
  }
  if (adminOrders && !adminOrders.includes('requireAdmin(req)')) {
    failures.push('API administrativa sem controle de autorização');
  }
  if (storefront && (!storefront.includes('publicFields') || !storefront.includes('adminDatabase()'))) {
    failures.push('Configurações públicas sem seleção por allowlist no servidor');
  }
  if (checkout && (!checkout.includes("process.env.VERCEL_ENV !== 'preview'") ||
    !checkout.includes('requireAdmin(req)'))) {
    failures.push('Checkout protegido não está restrito ao Preview com autenticação');
  }
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!ref || ref.startsWith('-') || !/^[\w./-]+$/.test(ref)) {
    process.stderr.write('Informe --ref HEAD ou --ref origin/main\n');
    process.exitCode = 2;
  } else {
    const failures = inspectArchitecture(file => gitRead(ref, file));
    process.stdout.write(`Arquitetura do ref ${ref}: ${failures.length ? 'BLOQUEADA' : 'APROVADA para revisão manual'}\n`);
    for (const failure of failures) process.stdout.write(' - ' + failure + '\n');
    if (failures.length) process.exitCode = 1;
    if (!failures.length) process.stdout.write('A aprovação estática NÃO autoriza RLS, pagamentos ou deploy de produção.\n');
  }
}
