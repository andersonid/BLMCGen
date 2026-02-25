# SESSION NOTES — BLMCGen / BMCMarkdown

## Contexto
- O que estamos fazendo agora: RBAC completo implementado e deployado
- Branch: main
- Ambiente (dev/prod): produção (bmc.nobre.ninja via Coolify)

## Decisões
- RBAC completo (roles + permissions) em vez de flag simples ou tabela N:N sem permissions.
- Permissions no formato `resource:action` (ex: `user:list`, `canvas:delete_any`).
- `authenticateToken` carrega roles/permissions do banco a cada request (não confia apenas no JWT para autorização server-side).
- JWT inclui `roles` para uso no frontend (ex: mostrar/ocultar link do admin).
- Coluna `is_active` em users para soft-ban sem excluir conta.
- URLs limpas via Nginx `try_files $uri $uri.html $uri/ /index.html`.
- Migration RBAC aplicada diretamente no banco de produção antes do deploy do código.

## Próximos passos
- (próximas tarefas ou follow-ups)
