# SESSION NOTES — BLMCGen / BMCMarkdown

## Contexto
- O que estamos fazendo agora: Sprint AI Agent — plataforma API-first com MCP Server e chat AI
- Branch: main
- Ambiente (dev/prod): produção (bmc.nobre.ninja via Coolify)

## Decisões (Sprint AI Agent)
- **LLM**: Gemini 2.5 Flash-Lite como primário ($0.10/$0.40 per 1M tokens), GPT-4o-mini como fallback.
- **Services Layer**: lógica de negócio extraída das rotas para `backend/services/` (canvas, chat, llm).
- **Chat via SSE**: `POST /api/chat` retorna Server-Sent Events com eventos `delta`, `canvas_update`, `done`, `error`.
- **MCP Server**: SSE transport em `/mcp/sse` e `/mcp/messages`, com 11 tools e 3 resources.
- **UI redesenhada**: Chat panel à esquerda (modo padrão), editor code como alternativa, canvas sempre à direita.
- **View modes**: Chat+Canvas (padrão), Code+Canvas, Canvas Full.
- **System prompt**: em `backend/prompts/canvas-agent.md`, com metodologia BMC (Osterwalder) e LMC (Ash Maurya).
- **Nginx**: locations adicionais para `/mcp/` e `/api/chat` com `proxy_buffering off`.
- **Deps novas**: `@google/genai`, `openai`, `@modelcontextprotocol/sdk`.
- **Envs novas**: `LLM_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`.

## Decisões anteriores (RBAC)
- RBAC completo (roles + permissions) em vez de flag simples ou tabela N:N sem permissions.
- Permissions no formato `resource:action` (ex: `user:list`, `canvas:delete_any`).
- `authenticateToken` carrega roles/permissions do banco a cada request.
- JWT inclui `roles` para uso no frontend.
- Coluna `is_active` em users para soft-ban sem excluir conta.
- URLs limpas via Nginx `try_files $uri $uri.html $uri/ /index.html`.

## Próximos passos
- Configurar `GEMINI_API_KEY` no Coolify para ativar o chat AI em produção.
- Testar fluxo completo: chat -> canvas render -> save to cloud.
- Testar MCP tools com Claude Desktop / Cursor.
- Adicionar persistência de histórico de chat no banco (coluna `chat_history JSONB` na tabela `canvas`).
- Métricas de uso de tokens por usuário.
- Segurança MCP: auth por token, rate limit, scopes.
