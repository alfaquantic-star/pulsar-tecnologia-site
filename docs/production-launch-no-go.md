# Pulsar Tecnologia — produção: bloqueio de segurança e lançamento controlado

## Estado auditado em 6/7 nov. de 2026

**NO-GO.** A verificação live no Supabase compartilhado `srvctqtmlbkmgiazgsrj`
mostrou que os papéis `anon` e `authenticated` ainda podem selecionar e alterar
`public.orders`, `public.products`, `public.kits`, `public.site_settings`.
Embora o RLS esteja ligado nas quatro tabelas, políticas `FOR ALL ... true`
continuam permissivas. RLS habilitado **não** significa dados seguros.

O projeto da Vercel `pulsar-tecnologia-site` tem o Preview `security/server-api-phase1`
com as APIs protegidas. O GitHub `main` antigo ainda consulta/escreve diretamente
em tabelas. A PR de migração para `main` continua **draft**, não pronta para merge.

## Diagnóstico reproduzível — apenas leitura

No SQL Editor do Supabase, usar
`supabase/tests/live_release_rls_readonly_audit.sql`.
O último resultado deve ser `BLOCKED` antes do cutover.
Ele mostra privilégios e políticas mas **não corrige nada**. Este arquivo
também precisa resultar em `READY` no Postgres isolado do CI, após a migração candidata.
**READY isolado não aprova produção**.

## Checklist obrigatório antes de uma mudança em produção

1. Confirmar explicitamente que só o **Projeto 2** será alterado. O Supabase é
   compartilhado com o Projeto 1; identificar todas as aplicações que usam as
   mesmas tabelas, permissões e URL de autenticação.
2. Validar duas contas reais distintas no Preview (links Supabase, restauração
   de sessão, logout, sem acesso cruzado aos pedidos). O limite de e-mails grátis
   não pode ser contornado com identidades fictícias.
3. Testar carrinho, estoque, preços, endereço, frete, APIs de administração,
   configurações públicas, upload e pedido de teste. Histórico legado permanece
   sem vinculação por e-mail. NÃO ligar pagamentos reais.
4. Garantir que a nova aplicação tolera políticas restritivas; obter aprovação
   de todos os sistemas que dependam do Supabase compartilhado.
5. Definir janela de manutenção, responsável pelo deploy e pelo banco,
   observação de erros e mecanismo de reversão.
6. Criar backup real e RESTAURÁVEL da base completa e testar restauração em
   ambiente separado. Salvar o estado das políticas, grants e os IDs/commits
   atuais. Um SELECT ou script SQL neste repositório **não é backup**.
7. Preparar e testar a aplicação nova e a migração
   `supabase/migrations/20261103_prepare_pulsar_rls.sql` em cópia isolada.
   Rever dependências do Projeto 1 antes de retirar qualquer grant compartilhado.
8. Aplicar a migração **somente** com autorização expressa, durante a janela
   coordenada, sem que a versão antiga continue com acessos diretos.
9. Rodar a auditoria read-only acima no Supabase compartilhado, testes HTTP
   anônimos, autenticados e administrativos, e verificar funções do checkout.
   Sem `READY` e E2E limpo, não retirar a manutenção nem habilitar pagamentos.

## Se houver erro durante o cutover

- Manter o checkout indisponível, verificar logs e não dar acesso público aos
  pedidos só para “consertar rápido”.
- Reverter o código para a versão compatível com as permissões restauradas.
- Restaurar políticas e grants SOMENTE como parte da reversão coordenada
  e aprovada para todos os aplicativos do banco compartilhado.
- Nunca restaurar as permissões antigas amplas enquanto existir uma loja pública
  não revisada usando o mesmo banco.
- Comparar contagem dos pedidos e estado dos pagamentos antes/depois; não
  repetir webhooks nem marcar pagamento como aprovado pelo navegador.

## Critérios de saída

O lançamento permanece **NO-GO** enquanto:
- qualquer app depender de permissões RLS antigas;
- não houver backup restaurável e teste de rollback;
- login real, isolamento entre dois clientes e checkout de teste não tiverem
  comprovação ponta-a-ponta;
- o último campo `rls_security_verdict` for diferente de `READY`;
- a produção não tiver deploy confirmado e monitoramento;
- pagamentos automáticos ou cron estiverem ativos antes da revisão.

Nenhuma etapa deste documento, por si só, autoriza o merge de `main`,
alteração do banco compartilhado ou ativação de pagamentos.
