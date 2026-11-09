# Pulsar — bloqueio comprovado no Supabase compartilhado (9 nov. 2026)

## Resultado live, somente leitura

No projeto Supabase `srvctqtmlbkmgiazgsrj` foi executada uma transação **READ ONLY** que assumiu `ROLE anon` e consultou **somente a contagem** de `public.orders`:

```sql
BEGIN READ ONLY;
SET LOCAL ROLE anon;
SELECT count(*)::int AS exposed_order_count FROM public.orders;
ROLLBACK;
```

Resultado: **4** registros visíveis ao visitante anônimo no instante do teste.
Nenhum campo ou dado de cliente foi consultado; nenhuma linha foi modificada.

A auditoria de grants/policies também encontrou `FOR ALL TO public USING (true) WITH CHECK (true)` nas tabelas `products`, `kits`, `orders` e `site_settings`. O RLS habilitado sozinho não protege essas tabelas.
**NO-GO para vendas reais**: não ligar pagamentos nem processador automático enquanto isso persistir.

## Próximo corte seguro (não executar automaticamente)

1. Identificar o proprietário e os clientes do outro aplicativo que usam o mesmo Supabase e exigir confirmação de compatibilidade. A alteração de grants/policies afeta todos.
2. Preparar um backup restaurável da base inteira e ensaiar a recuperação em banco isolado.
3. Testar no Preview login de duas contas reais diferentes, isolamento de pedidos, Admin, catálogo, CMS, preço/estoque/frete e Mercado Pago sandbox com webhook associado.
4. Fazer deploy da aplicação com APIs seguras em janela de manutenção coordenada; a `main` atual ainda escreve diretamente no banco.
5. Aplicar **somente então**, com verificação e rollback disponíveis, a migração candidata `20261103_prepare_pulsar_rls.sql`.
6. Executar `supabase/tests/live_anonymous_order_exposure_gate.sql` (apenas leitura). Exigir `READY_FOR_NEXT_REVIEW`, além de testar que a consulta `SELECT count(*) FROM public.orders` sob `ROLE anon` retorna `permission denied`, e que `anon` não lê `site_settings`.
7. Confirmar que o site público funciona, que pedidos só são lidos/alterados pelas APIs autorizadas, que não há acesso cruzado entre clientes e que o webhook não aprova pagamentos sem confirmação do provedor.

**Proibido:** revogar permissões do banco compartilhado enquanto `main` legado está ativo, restaurar grants amplos como solução de incidentes ou interpretar teste sintético como compra de sandbox concluída.

O cron `pulsar_test_queue_worker` permanece inativo e cobranças reais permanecem bloqueadas.
