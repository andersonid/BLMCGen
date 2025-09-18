# Teste Local com Podman

Este guia mostra como testar a aplicação localmente usando Podman.

## Pré-requisitos

1. **Podman instalado**:
```bash
# Fedora/RHEL/CentOS
sudo dnf install podman podman-compose

# Ubuntu/Debian
sudo apt install podman podman-compose

# macOS
brew install podman
```

2. **Verificar instalação**:
```bash
podman --version
podman-compose --version
```

## Configuração

1. **Clonar o repositório**:
```bash
git clone https://github.com/andersonid/BLMCGen.git
cd BMCMarkdown
git checkout feature/containerization-backend
```

2. **Instalar dependências do backend**:
```bash
npm run backend:install
```

## Teste Rápido

### Opção 1: Script Automatizado
```bash
# Executar teste completo
npm run test:local
```

### Opção 2: Manual
```bash
# Subir containers
npm run podman:up

# Verificar logs
npm run podman:logs

# Parar containers
npm run podman:down
```

## Verificação

Após executar o teste, verifique:

1. **Frontend**: http://localhost
2. **API**: http://localhost/api
3. **Health Check**: http://localhost:3001/health

## Testando Endpoints

### Registro de Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "teste@example.com",
    "name": "Usuario Teste",
    "password": "senha123",
    "emailMarketingConsent": true
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

### Health Check
```bash
curl http://localhost:3001/health
```

## Comandos Úteis

```bash
# Ver containers rodando
podman ps

# Ver logs específicos
npm run podman:logs

# Parar tudo
npm run podman:down

# Limpar volumes
npm run podman:clean

# Rebuild
npm run podman:build
```

## Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
podman-compose -f docker-compose.podman.yml logs backend
```

### Porta já em uso
```bash
# Verificar portas em uso
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :5432
```

### Problema de permissão
```bash
# Verificar se podman está rodando
podman system info

# Reiniciar serviço (se necessário)
sudo systemctl restart podman
```

## Próximos Passos

Após testar localmente:

1. **Configurar variáveis de produção** em `.env.production`
2. **Fazer deploy na VPS** usando `./deploy.sh`
3. **Configurar domínio** e SSL
4. **Monitorar** logs e performance

## Notas Importantes

- O arquivo `.env.local` contém as credenciais do AWS SES
- Este arquivo NÃO deve ser commitado no Git
- Para produção, use `.env.production` com suas próprias credenciais
- O banco de dados é persistente entre reinicializações
