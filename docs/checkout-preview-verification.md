# Verificação da implantação de checkout em Preview

Este documento registra os critérios para testar a branch `security/server-api-phase1`. Apenas o deployment da **HEAD atual da branch** serve como teste. Redeploy de commits antigos não atualiza o código.

## Segurança
- Não ativar Production, não mesclar em `main`.
- `MERCADO_PAGO_TEST_ACCESS_TOKEN`, `PULSAR_MP_TEST_SELLER_ID`, `PULSAR_ENABLE_MP_TEST_CHECKOUT=true` somente no ambiente Preview.
- Verificar o funcionamento do webhook com HMAC e associação do pagamento, sem utilizar credenciais reais.
- Conferir que o pedido nasce `pending` e nunca é aprovado pela URL de retorno.
- Testar repetição do mesmo `checkout_idempotency_key` sem criar pedidos duplicados.
- Comparar frete e subtotal no servidor; não confiar em valores do navegador.
- Não realizar compras reais até os testes ponta a ponta serem concluídos e a segurança RLS da Production ser auditada.

## Para liberar os testes
1. Confirmar o último commit da branch e o deploy Vercel Ready desse mesmo commit.
2. Executar GitHub Actions (testes de pedidos, assinatura, correlação de preferência e build).
3. Verificar variáveis em execução; nunca exibir segredos.
4. Fazer teste administrativo com dados sintéticos e uma compra simulada do vendedor/comprador de teste.
5. Conferir o registro em Supabase e eventos no Mercado Pago antes de considerar pronto.
