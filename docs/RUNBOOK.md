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
- Ver: `README-DEPLOY.md`, `cloud-deployment.md`.

## Variáveis de ambiente
- Ver `.env`, `.env.production.example` e `backend/.env.example`.

## Health
- Backend: `GET /health` (porta conforme deploy; ver README-DEPLOY).
