# CONCEPT — BLMCGen / BMCMarkdown

## O que é
Ferramenta web para criar Business Model Canvas (BMC) e Lean Model Canvas (LMC) usando uma sintaxe inspirada em markdown, com preview em tempo real.

## Modos de uso
- **Simples**: abrir `index.html` no navegador (sem servidor); dados em localStorage.
- **Com backend**: Docker Compose sobe Nginx + API + PostgreSQL; API oferece auth (JWT), CRUD de canvas, perfil e sessões.

## Autenticação e autorização
- Registro com verificação por email (token enviado via SMTP).
- Login gera JWT (validade 7 dias) que inclui roles do usuário.
- Middleware `authenticateToken` carrega roles e permissions do banco a cada request autenticado.
- Contas podem ser desativadas (`is_active = false`) sem exclusão.

## RBAC (Role-Based Access Control)
- Modelo completo com 4 tabelas: `roles`, `permissions`, `role_permissions`, `user_roles`.
- Permissions granulares no formato `resource:action` (ex: `user:list`, `canvas:delete_any`, `admin:dashboard`).
- Roles padrão: `admin` (todas as permissions), `user` (sem permissions admin).
- Middlewares reutilizáveis: `requireRole()` e `requirePermission()`.

## Painel admin (`/admin`)
- Dashboard com estatísticas (usuários, canvas, registros recentes).
- CRUD de usuários: listar, buscar, editar, ativar/desativar, excluir.
- Gerenciamento de roles por usuário.
- Listagem e exclusão de canvas de qualquer usuário.
- Visualização de roles e suas permissions.

## URLs
- URLs limpas sem `.html` via Nginx `try_files` (`/login`, `/admin`).
- API sob `/api/` (proxy reverso Nginx → backend:3001).

## Objetivos
- Experiência rápida e leve no frontend.
- Possibilidade de persistência/autenticação via backend quando necessário.
- Gestão centralizada de usuários e conteúdo via painel admin.
