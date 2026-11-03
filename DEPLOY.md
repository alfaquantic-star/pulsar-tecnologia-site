# Pulsar Tecnologia — Vercel / GitHub / Supabase

1. Suba os arquivos para um repositório GitHub privado. Não suba `.env.local`.
2. Importe o repositório na Vercel; framework Vite, build `npm run build`, saída `dist`.
3. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`, `MELHOR_ENVIO_TOKEN`, `SHIPPING_ORIGIN_CEP` e `MELHOR_ENVIO_USER_AGENT` no painel Environment Variables da Vercel.
4. Execute e revise `supabase/schema.sql` no SQL Editor de um projeto Supabase; configure autenticação e políticas RLS adequadas.
5. Cadastre webhook Mercado Pago em `https://SEU-DOMINIO/api/mercadopago/webhook`.

## Antes de aceitar pagamentos reais
- Implementar criação de pedidos no backend com preços/estoque/cupom/frete validados no Supabase. Atualmente o checkout ainda envia valores calculados no navegador.
- Implementar validação criptográfica da assinatura do webhook e confirmação de pagamento consultando a API do Mercado Pago; o webhook incluído apenas confirma recebimento e **não** altera pedidos.
- Proteger o painel administrativo com Supabase Auth + RLS; o ZIP original contém login de demonstração no frontend e deve ser removido antes de produção.
- Conferir medidas, peso e valor declarado reais dos produtos na cotação de frete.
- Remover modos de pagamento simulados e dados fictícios antes do lançamento.


## Status de segurança — não habilite vendas ainda
Consulte `SECURITY-NOTICE.md`. Checkout Mercado Pago retorna 503 de propósito até a validação confiável no servidor. Não utilize Pix/cartão demonstrativos.
