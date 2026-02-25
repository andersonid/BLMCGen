# BLMCGen v3.0.0

## 🇧🇷 Português

**Business & Lean Model Canvas Generator**

Uma ferramenta web para criar Business Model Canvas (BMC) e Lean Model Canvas (LMC) usando uma sintaxe inspirada em markdown.

### Funcionalidades

*   **AI Agent Integrado**: Chat com IA que guia a criação de BMC/LMC usando a metodologia correta (Osterwalder / Ash Maurya).
*   **MCP Server**: Endpoints MCP (Model Context Protocol) para integração com Claude Desktop, Cursor, ChatGPT e outros AI Agents externos.
*   **Interface AI-First**: Chat panel + canvas renderizado lado a lado; modo código opcional.
*   **Suporte Duplo**: Criação de Business Model Canvas (BMC) e Lean Model Canvas (LMC).
*   **Pré-visualização em Tempo Real**: Renderização do canvas enquanto a IA escreve ou você digita.
*   **Interface com Abas**: Gerencie múltiplos projetos; conteúdo salvo automaticamente.
*   **Exportação**: PDF, PNG e JPEG.
*   **Autenticação**: Registro com verificação por email, login JWT, persistência de canvas no banco.
*   **RBAC Completo**: Sistema de roles e permissions granulares (admin, user). Painel admin em `/admin`.
*   **Painel Admin** (`/admin`): Dashboard com estatísticas, gestão de usuários (editar, ativar/desativar, excluir), gerenciamento de roles e visualização de todos os canvas.
*   **API Pública**: REST API + endpoints de parse/validate/format para a DSL.
*   **URLs Limpas**: Rotas sem extensão `.html` (`/login`, `/admin`).
*   **Suporte a Múltiplos Idiomas**: Português, Inglês e Espanhol.
*   **Design Responsivo**: Mobile e desktop.
*   **Exemplos Integrados**: BMC (Netflix) e LMC (Uber).

### Como Usar

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/andersonid/BLMCGen.git
    cd BLMCGen
    ```
2.  **Modo simples** (sem backend): Abra `index.html` diretamente no navegador.
3.  **Stack completa** (com backend + banco):
    ```bash
    docker-compose up -d
    ```
    Acesse `http://localhost` (frontend), `http://localhost/admin` (painel admin).

---

## 🇬🇧 English

**Business & Lean Model Canvas Generator**

A web tool for creating Business Model Canvas (BMC) and Lean Model Canvas (LMC) using a markdown-inspired syntax.

### Features

*   **Integrated AI Agent**: Chat-based AI that guides BMC/LMC creation using proper methodology (Osterwalder / Ash Maurya).
*   **MCP Server**: Model Context Protocol endpoints for integration with Claude Desktop, Cursor, ChatGPT and other external AI Agents.
*   **AI-First Interface**: Chat panel + rendered canvas side by side; code mode optional.
*   **Dual Support**: Create both Business Model Canvas (BMC) and Lean Model Canvas (LMC).
*   **Real-time Preview**: Renders the canvas as the AI writes or you type.
*   **Tabbed Interface**: Manage multiple projects; content auto-saved.
*   **Export Options**: PDF, PNG and JPEG.
*   **Authentication**: Email-verified registration, JWT login, canvas persisted to database.
*   **Full RBAC**: Granular roles and permissions system (admin, user). Admin panel at `/admin`.
*   **Admin Panel** (`/admin`): Dashboard with stats, user management (edit, activate/deactivate, delete), role management, and all-canvas view.
*   **Public API**: REST API + parse/validate/format endpoints for the DSL.
*   **Clean URLs**: Extension-free routes (`/login`, `/admin`).
*   **Multi-language Support**: Portuguese, English, and Spanish.
*   **Responsive Design**: Mobile and desktop.
*   **Integrated Examples**: BMC (Netflix) and LMC (Uber).

### How to Use

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/andersonid/BLMCGen.git
    cd BLMCGen
    ```
2.  **Simple mode** (no backend): Open `index.html` directly in your browser.
3.  **Full stack** (with backend + database):
    ```bash
    docker-compose up -d
    ```
    Access `http://localhost` (frontend), `http://localhost/admin` (admin panel).

---

## 🇪🇸 Español

**Generador de Business & Lean Model Canvas**

Una herramienta web para crear Business Model Canvas (BMC) y Lean Model Canvas (LMC) utilizando una sintaxis inspirada en markdown.

### Funcionalidades

*   **Soporte Dual**: Creación de Business Model Canvas (BMC) y Lean Model Canvas (LMC).
*   **Vista Previa en Tiempo Real**: Renderización del lienzo mientras escribes.
*   **Interfaz con Pestañas**: Gestiona múltiples proyectos; guardado automático.
*   **Exportación**: PDF, PNG y JPEG.
*   **Autenticación**: Registro con verificación por email, login JWT, canvas persistidos en base de datos.
*   **RBAC Completo**: Sistema de roles y permisos granulares (admin, user). Panel admin en `/admin`.
*   **Panel Admin** (`/admin`): Dashboard con estadísticas, gestión de usuarios (editar, activar/desactivar, eliminar), gestión de roles y vista de todos los canvas.
*   **URLs Limpias**: Rutas sin extensión `.html` (`/login`, `/admin`).
*   **Soporte Multilingüe**: Portugués, inglés y español.
*   **Diseño Adaptable**: Dispositivos móviles y escritorio.
*   **Ejemplos Integrados**: BMC (Netflix) y LMC (Uber).

### Cómo Usar

1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/andersonid/BLMCGen.git
    cd BLMCGen
    ```
2.  **Modo simple** (sin backend): Abre `index.html` directamente en tu navegador.
3.  **Stack completa** (con backend + base de datos):
    ```bash
    docker-compose up -d
    ```
    Accede a `http://localhost` (frontend), `http://localhost/admin` (panel admin).

---
### Sintaxe / Syntax / Sintaxis

#### Business Model Canvas (BMC)
```
bmc
title: Your business name
description: Brief description of the business model

customer-segments:
  - Customer segment 1
value-propositions:
  - Value proposition 1
channels:
  - Channel 1
customer-relationships:
  - Relationship type 1
revenue-streams:
  - Revenue stream 1
key-resources:
  - Key resource 1
key-activities:
  - Key activity 1
key-partnerships:
  - Key partnership 1
cost-structure:
  - Cost 1
```

#### Lean Model Canvas (LMC)
```
lmc
title: Your startup name
description: Brief description of the solution

problem:
  - Problem 1
solution:
  - Solution 1
unique-value-proposition:
  - Unique value proposition
unfair-advantage:
  - Competitive advantage 1
customer-segments:
  - Customer segment 1
key-metrics:
  - Key metric 1
channels:
  - Channel 1
cost-structure:
  - Cost 1
revenue-streams:
  - Revenue stream 1
```

### Tecnologias / Technologies / Tecnologías

**Frontend**: HTML5, CSS3, JavaScript (ES6+), Monaco Editor, jsPDF
**Backend**: Node.js, Express, JWT, bcrypt, Nodemailer
**AI/LLM**: Gemini 2.5 Flash-Lite (primary), GPT-4o-mini (fallback), SSE streaming
**MCP**: @modelcontextprotocol/sdk (SSE transport, 11 tools, 3 resources)
**Banco**: PostgreSQL
**Infra**: Docker Compose, Nginx (proxy reverso + URLs limpas + SSE)
**Deploy**: Coolify (GitHub webhook → auto build/deploy)

---