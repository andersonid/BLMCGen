# Deploy - BMC Markdown Generator

Deploy simplificado seguindo padrões Cloud Native.

## Deploy Local

```bash
# Subir aplicação
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar aplicação
docker-compose down
```

## Deploy em Produção

### Deploy em nuvem (resumo)
- **Coolify**: conectar repo GitHub, configurar env vars, deploy automático via webhook.
- **DigitalOcean / AWS EC2 / GCP / VPS**: Ubuntu 22.04, Docker + Docker Compose, Nginx + Certbot para SSL. Clonar repo, configurar `.env` (ou `.env.production`), subir com `docker-compose`. Detalhes de cada provedor (custos, RDS/Cloud SQL, backup) ficam em documentação externa ou histórico do repo.

### Coolify
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

### Podman Desktop
1. Abrir Podman Desktop
2. Importar docker-compose.yml
3. Configurar variáveis
4. Deploy

### OpenShift (Source2Image)
```bash
# Build e deploy
oc new-app --name bmcgen --source . --strategy source
oc expose service bmcgen
```

### Docker Swarm
```bash
# Deploy stack
docker stack deploy -c docker-compose.yml bmcgen
```

### Kubernetes
```bash
# Converter compose para k8s
kompose convert

# Deploy
kubectl apply -f .
```

## Variáveis de Ambiente

Criar arquivo `.env` com:

```bash
JWT_SECRET=sua-chave-jwt-super-secreta
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=sua-chave-aws
SMTP_PASS=sua-senha-aws
SMTP_FROM_NAME=BLMCGen App
SMTP_FROM_EMAIL=noreply@seudominio.com
```

## Acesso

- **Frontend**: http://localhost (ou `https://bmc.nobre.ninja` em produção)
- **Login**: http://localhost/login
- **Admin**: http://localhost/admin (requer role `admin`)
- **API**: http://localhost:3001
- **Health**: http://localhost:3001/health

## RBAC

Ao fazer deploy pela primeira vez ou ao atualizar um banco existente, aplicar a migration:

```bash
cat backend/migrations/001_rbac.sql | docker exec -i <container-db> psql -U bmcmarkdown -d bmcmarkdown
```

Usuário admin padrão: `admin@bmcgen.com` / `admin123`.

## Health Checks

Todos os serviços têm health checks configurados:
- Backend: `/health`
- Database: `pg_isready`

## Volumes

- `postgres_data`: Dados do PostgreSQL

## Portas

- `80`: Frontend (Nginx)
- `3001`: Backend API
- `5432`: PostgreSQL (apenas interno)
