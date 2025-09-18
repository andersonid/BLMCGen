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

- **Frontend**: http://localhost
- **API**: http://localhost:3001
- **Health**: http://localhost:3001/health

## Health Checks

Todos os serviços têm health checks configurados:
- Backend: `/health`
- Database: `pg_isready`
- Redis: `redis-cli ping`

## Volumes

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis

## Portas

- `80`: Frontend (Nginx)
- `3001`: Backend API
- `5432`: PostgreSQL (apenas interno)
- `6379`: Redis (apenas interno)
