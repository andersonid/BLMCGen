# RUNBOOK — BLMCGen / BMCMarkdown

## Quick start
### Frontend (sem servidor)
- Abrir `index.html` no navegador.

### Servidor simples (opcional)
```bash
npm run dev
# (python3 -m http.server 8000)
```

### Stack completa (Docker Compose)
```bash
docker-compose up -d
docker-compose logs -f
# parar:
docker-compose down
```

## Backend
```bash
npm run backend:install
npm run backend:dev
```

## Deploy
- Coolify: conectar repo, configurar env vars e deixar webhook disparar deploy.
- Ver: `README-DEPLOY.md`, `docker-compose.yml`.

## Variáveis de ambiente
- Raiz: `.env`, `.env.production.example`
- Backend: `backend/.env` (copiar de `backend/.env.example`)

## Health
- Backend: `GET /health` (porta conforme deploy; ver README-DEPLOY).

## RBAC e migrations

### Aplicar migration RBAC em banco existente
```bash
psql -U bmcmarkdown -d bmcmarkdown -f backend/migrations/001_rbac.sql
```
Ou via Docker (produção):
```bash
cat backend/migrations/001_rbac.sql | docker exec -i <container-db> psql -U bmcmarkdown -d bmcmarkdown
```

A migration:
- Adiciona coluna `is_active` em `users`.
- Cria tabelas `roles`, `permissions`, `role_permissions`, `user_roles`.
- Faz seed de roles (`admin`, `user`) e 13 permissions.
- Vincula todas as permissions ao role `admin`.
- Atribui role `user` a todos os usuários existentes.
- Atribui role `admin` ao `admin@bmcgen.com`.

### Usuário admin padrão
- Email: `admin@bmcgen.com`
- Senha: `admin123`
- Roles: `admin` + `user`

### Painel admin
- URL: `/admin` (requer login com role `admin`)
- Funcionalidades: dashboard, CRUD de usuários, gerenciamento de roles, listagem de canvas.

## URLs da aplicação
| Rota | Descrição |
|------|-----------|
| `/` | App principal (editor de canvas) |
| `/login` | Tela de login/registro |
| `/admin` | Painel admin (requer role admin) |
| `/api/health` | Health check do backend |
| `/api/admin/*` | Endpoints admin (requer permission) |

## Estrutura de arquivos relevantes
```
├── index.html                  # App principal
├── login.html                  # Tela de login/registro
├── admin.html                  # Painel admin
├── nginx.conf                  # Proxy reverso + URLs limpas
├── docker-compose.yml
├── backend/
│   ├── server.js               # Entry point
│   ├── init.sql                # Schema inicial do banco
│   ├── migrations/
│   │   └── 001_rbac.sql        # Migration RBAC
│   ├── middleware/
│   │   ├── auth.js             # JWT + carrega roles/permissions
│   │   └── authorize.js        # requireRole() / requirePermission()
│   └── routes/
│       ├── auth.js             # Login, registro, verificação
│       ├── canvas.js           # CRUD de canvas do usuário
│       ├── user.js             # Perfil, senha, stats
│       └── admin.js            # Endpoints admin (RBAC protegido)
```
