# Deploy na Nuvem - BMC Markdown Generator

Este guia fornece instruções para fazer deploy da aplicação em diferentes provedores de nuvem.

## Opções de Deploy

### 1. DigitalOcean Droplet (Recomendado)

**Custo estimado**: $20-40/mês

#### Passos:
1. **Criar Droplet**:
   - Ubuntu 22.04 LTS
   - 2GB RAM, 1 CPU (mínimo)
   - 4GB RAM, 2 CPU (recomendado)

2. **Configurar servidor**:
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx (para SSL)
sudo apt install nginx certbot python3-certbot-nginx -y
```

3. **Deploy da aplicação**:
```bash
# Clonar repositório
git clone https://github.com/andersonid/BLMCGen.git
cd BMCMarkdown

# Configurar variáveis
cp .env.production.example .env.production
nano .env.production

# Executar deploy
./deploy.sh
```

4. **Configurar SSL**:
```bash
# Configurar domínio no Nginx
sudo nano /etc/nginx/sites-available/bmcgen
# Adicionar configuração do domínio

# Obter certificado SSL
sudo certbot --nginx -d yourdomain.com
```

### 2. AWS EC2

**Costo estimado**: $30-60/mês

#### Passos:
1. **Criar instância EC2**:
   - Amazon Linux 2 ou Ubuntu 22.04
   - t3.small (2 vCPU, 2GB RAM)
   - Security Group: HTTP (80), HTTPS (443), SSH (22)

2. **Configurar RDS PostgreSQL**:
   - Criar instância RDS PostgreSQL
   - Configurar Security Group
   - Atualizar DATABASE_URL no .env.production

3. **Configurar ElastiCache Redis** (opcional):
   - Criar cluster Redis
   - Atualizar REDIS_URL no .env.production

4. **Deploy**:
```bash
# Mesmo processo do DigitalOcean
git clone https://github.com/andersonid/BLMCGen.git
cd BMCMarkdown
cp .env.production.example .env.production
# Configurar variáveis do RDS e ElastiCache
./deploy.sh
```

### 3. Google Cloud Platform

**Costo estimado**: $25-50/mês

#### Passos:
1. **Criar VM**:
   - Ubuntu 22.04 LTS
   - e2-small (2 vCPU, 2GB RAM)
   - Firewall: HTTP, HTTPS, SSH

2. **Configurar Cloud SQL**:
   - Criar instância PostgreSQL
   - Configurar autorização de rede
   - Atualizar DATABASE_URL

3. **Deploy**:
```bash
# Mesmo processo
git clone https://github.com/andersonid/BLMCGen.git
cd BMCMarkdown
cp .env.production.example .env.production
# Configurar Cloud SQL
./deploy.sh
```

### 4. VPS Genérico (Vultr, Linode, etc.)

**Custo estimado**: $20-40/mês

#### Passos:
1. **Criar VPS**:
   - Ubuntu 22.04 LTS
   - 2GB RAM, 1 CPU (mínimo)

2. **Seguir mesmo processo do DigitalOcean**

## Configurações Específicas

### Variáveis de Ambiente (.env.production)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/bmcdb
POSTGRES_DB=bmcdb
POSTGRES_USER=bmcuser
POSTGRES_PASSWORD=senha-super-segura

# JWT
JWT_SECRET=chave-jwt-super-secreta-min-32-chars

# URLs
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# Redis (opcional)
REDIS_URL=redis://host:6379
```

### Configuração do Nginx para SSL

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoramento

### Logs
```bash
# Ver logs da aplicação
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f db
```

### Backup
```bash
# Backup manual do banco
docker-compose -f docker-compose.prod.yml exec db pg_dump -U bmcuser bmcdb > backup.sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U bmcuser bmcdb < backup.sql
```

### Atualizações
```bash
# Atualizar aplicação
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Segurança

### Checklist de Segurança
- [ ] Senhas fortes em todas as variáveis
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backups automáticos
- [ ] Monitoramento de logs
- [ ] Atualizações regulares

### Comandos de Segurança
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Verificar portas abertas
sudo netstat -tlnp
```

## Escalabilidade

### Para Alto Tráfego
1. **Load Balancer**: Nginx ou CloudFlare
2. **Múltiplas instâncias**: Docker Swarm ou Kubernetes
3. **CDN**: CloudFlare ou AWS CloudFront
4. **Database**: RDS com read replicas
5. **Cache**: Redis cluster

### Monitoramento Avançado
- **Prometheus + Grafana**: Métricas
- **ELK Stack**: Logs centralizados
- **Sentry**: Error tracking
- **Uptime monitoring**: Pingdom ou UptimeRobot

## Estimativas de Custo

| Provedor | Configuração | Custo/mês | Notas |
|----------|--------------|-----------|-------|
| DigitalOcean | 2GB RAM, 1 CPU | $20 | Recomendado para começar |
| DigitalOcean | 4GB RAM, 2 CPU | $40 | Para produção |
| AWS EC2 | t3.small + RDS | $60 | Mais robusto |
| Google Cloud | e2-small + Cloud SQL | $50 | Boa integração |
| Vultr | 2GB RAM, 1 CPU | $12 | Mais barato |

## Troubleshooting

### Problemas Comuns

1. **Container não inicia**:
```bash
docker-compose -f docker-compose.prod.yml logs container-name
```

2. **Banco não conecta**:
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml exec db pg_isready
```

3. **SSL não funciona**:
```bash
# Verificar certificados
sudo certbot certificates
```

4. **Memória insuficiente**:
```bash
# Verificar uso de memória
docker stats
```

## Suporte

Para problemas específicos:
1. Verificar logs: `docker-compose logs -f`
2. Verificar status: `docker-compose ps`
3. Reiniciar serviços: `docker-compose restart`
4. Verificar recursos: `htop`, `df -h`
