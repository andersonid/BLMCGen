# BMC Markdown Generator - Backend API

Este documento descreve a implementação do backend para o BMC Markdown Generator com funcionalidades de containerização, banco de dados e autenticação de usuários.

## Arquitetura

### Stack Tecnológica
- **Backend**: Node.js + Express.js
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis (opcional)
- **Containerização**: Docker + Docker Compose
- **Proxy Reverso**: Nginx
- **Autenticação**: JWT (JSON Web Tokens)

### Estrutura do Projeto
```
├── backend/                 # API Backend
│   ├── config/             # Configurações do banco
│   ├── middleware/         # Middlewares (auth, error handling)
│   ├── routes/            # Rotas da API
│   ├── models/            # Modelos de dados
│   ├── utils/             # Utilitários
│   ├── server.js          # Servidor principal
│   ├── package.json       # Dependências do backend
│   └── Dockerfile         # Container do backend
├── docker-compose.yml     # Orquestração dos containers
├── Dockerfile            # Container do frontend
├── nginx.conf            # Configuração do Nginx
└── package.json          # Scripts de desenvolvimento
```

## Funcionalidades Implementadas

### 1. Autenticação e Usuários
- **Registro de usuários** com validação de email
- **Login/Logout** com JWT
- **Gerenciamento de perfil** (atualizar dados, trocar senha)
- **Consentimento para email marketing**
- **Sessões seguras** com expiração

### 2. Gerenciamento de Canvas
- **CRUD completo** para canvas (BMC/LMC)
- **Canvas públicos** para compartilhamento
- **Paginação** e filtros
- **Controle de acesso** (privado/público)
- **Histórico de acesso**

### 3. Email Marketing
- **Coleta de leads** durante registro
- **Gerenciamento de consentimento**
- **Integração preparada** para Mailchimp/outros provedores

### 4. Containerização
- **Docker Compose** para orquestração
- **Nginx** como proxy reverso
- **PostgreSQL** containerizado
- **Redis** para cache/sessões
- **Health checks** para monitoramento

## Banco de Dados

### Tabelas Principais

#### `users`
- Armazena dados dos usuários
- Hash de senha com bcrypt
- Controle de verificação de email
- Consentimento para marketing

#### `canvas`
- Armazena os canvas criados
- Suporte a BMC e LMC
- Controle de visibilidade (público/privado)
- Timestamps de criação/atualização

#### `user_sessions`
- Gerenciamento de sessões JWT
- Controle de expiração
- Logs de acesso (IP, User-Agent)

#### `email_marketing`
- Lista de leads para marketing
- Controle de consentimento
- Metadados e tags

## Configuração e Deploy

### Desenvolvimento Local

1. **Instalar dependências do backend:**
```bash
npm run backend:install
```

2. **Configurar variáveis de ambiente:**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env com suas configurações
```

3. **Iniciar com Docker Compose:**
```bash
npm run docker:up
```

4. **Acessar a aplicação:**
- Frontend: http://localhost
- API: http://localhost/api
- Health Check: http://localhost:3001/health

### Deploy em Produção

1. **Configurar variáveis de ambiente de produção**
2. **Ajustar configurações do Nginx**
3. **Configurar SSL/TLS**
4. **Configurar backup do banco de dados**

## API Endpoints

### Autenticação (`/api/auth`)
- `POST /register` - Registrar usuário
- `POST /login` - Login
- `GET /me` - Dados do usuário atual
- `POST /logout` - Logout

### Canvas (`/api/canvas`)
- `GET /` - Listar canvas do usuário
- `GET /public` - Listar canvas públicos
- `GET /:id` - Obter canvas específico
- `POST /` - Criar novo canvas
- `PUT /:id` - Atualizar canvas
- `DELETE /:id` - Deletar canvas

### Usuário (`/api/user`)
- `GET /profile` - Perfil do usuário
- `PUT /profile` - Atualizar perfil
- `PUT /password` - Trocar senha
- `PUT /email-consent` - Consentimento marketing
- `GET /stats` - Estatísticas do usuário
- `DELETE /account` - Deletar conta

## Segurança

- **Rate limiting** para prevenir abuso
- **Validação de entrada** com express-validator
- **Hash de senhas** com bcrypt
- **JWT** para autenticação stateless
- **CORS** configurado
- **Helmet** para headers de segurança
- **Sanitização** de dados de entrada

## Monitoramento

- **Health checks** para todos os serviços
- **Logs estruturados** para debugging
- **Métricas de performance** de queries
- **Rate limiting** com logs

## Próximos Passos

1. **Implementar notificações por email**
2. **Adicionar analytics** de uso
3. **Implementar backup automático**
4. **Adicionar testes automatizados**
5. **Configurar CI/CD**
6. **Implementar cache Redis**
7. **Adicionar documentação Swagger**

## Comandos Úteis

```bash
# Desenvolvimento
npm run backend:dev          # Backend em modo dev
npm run docker:up            # Subir todos os containers
npm run docker:logs          # Ver logs
npm run docker:down          # Parar containers
npm run docker:clean         # Limpar volumes

# Produção
npm run docker:build         # Build das imagens
npm run backend:start        # Iniciar backend
```

## Notas de Desenvolvimento

- O frontend continua funcionando como antes
- A API é totalmente compatível com o frontend existente
- Implementação preparada para escalabilidade
- Código modular e bem documentado
- Pronto para deploy em qualquer provedor de nuvem
