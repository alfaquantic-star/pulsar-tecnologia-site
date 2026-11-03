# Pulsar — pendências antes de ativar vendas

- O projeto original tinha senha administrativa explícita no bundle JavaScript e uma forma de login administrativo sem senha. Removidos na versão preparada; troque qualquer senha reutilizada.
- O schema original permitia leitura e alteração públicas de pedidos, clientes e configurações. As políticas amplas foram retiradas do arquivo `supabase/schema.sql` — **não aplique o schema modificado sobre uma base existente sem revisar políticas atuais**.
- A rota de pagamento foi desativada (HTTP 503) até haver validação server-side de produtos, quantidades, desconto, frete e total.
- Checkout alternativo PIX e cartão do código original ainda é demonstrativo: não use em produção. Não recolha dados de cartão no seu próprio frontend sem integração certificada.
- Webhook Mercado Pago apenas acusa recebimento. Ainda precisa validar `x-signature`, consultar o pagamento na API e atualizar o pedido no banco de forma idempotente.
- Autenticação de administradores, permissões de usuários e criação de pedido no backend continuam pendentes.
- Tokens Mercado Pago e Melhor Envio somente em variáveis secretas da Vercel; nunca em `VITE_*`, localStorage ou `site_settings`.
- Utilize um banco Supabase novo, não execute este SQL diretamente sobre o banco anterior sem migração cuidadosamente revisada.
