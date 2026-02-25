// BMC Markdown App - Versão Simplificada (sem autenticação)
class BMCApp {
    constructor() {
        this.editor = null;
        this.parser = null;
        this.renderer = null;
        this.canvas = null;
        this.ctx = null;
        this.isRendering = false;
        this.splitter = null;
        this.zoomLevel = 1;
        this.currentTab = 'code';
        this.userCode = '';
        this.storageKey = 'blmcgen-user-code';
        this.projectsKey = 'blmcgen-projects';
        this.saveTimeout = null;
        
        // Sistema de múltiplas abas
        this.codeTabs = new Map(); // Map<tabId, {name, content, isActive, cloudId}>
        this.activeCodeTabId = null;
        this.nextTabId = 1;
        this.codeTabsKey = 'blmcgen-code-tabs';
        
        // Exemplos
        this.exampleBMC = '';
        this.exampleLMC = '';
        
        // Inicializar exemplos
        this.initializeExamples();
        
        // Modal de aba
        this.currentTabId = null;
        this.modalMode = null; // 'rename' ou 'create'
        this.modalEventsSetup = false;
        this.clickTimeout = null;
        
        // API configuration
        this.apiBaseUrl = '/api';
        this.isAuthenticated = false;
        this.authToken = null;
        this.user = null;
        
        this.init();
    }

    detectCanvasType(code) {
        if (!code || typeof code !== 'string') return 'bmc';
        if (code.includes('problem:') || code.includes('solution:') || code.includes('unique-value-proposition:')) {
            return 'lmc';
        }
        if (code.includes('value-propositions:') || code.includes('customer-relationships:')) {
            return 'bmc';
        }
        return 'bmc';
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    // Funções para gerenciamento de múltiplas abas de código
    saveCodeTabs() {
        try {
            const tabsData = {
                tabs: Array.from(this.codeTabs.entries()).map(([id, tab]) => ({
                    id,
                    name: tab.name,
                    content: tab.content,
                    isActive: tab.isActive,
                    cloudId: tab.cloudId || null
                })),
                activeTabId: this.activeCodeTabId,
                nextTabId: this.nextTabId
            };
            localStorage.setItem(this.codeTabsKey, JSON.stringify(tabsData));
        } catch (error) {
            console.warn('Failed to save code tabs to localStorage:', error);
        }
    }

    loadCodeTabs() {
        try {
            const saved = localStorage.getItem(this.codeTabsKey);
            if (saved) {
                const tabsData = JSON.parse(saved);
                this.codeTabs.clear();
                
                tabsData.tabs.forEach(tab => {
                    this.codeTabs.set(tab.id, {
                        name: tab.name,
                        content: tab.content,
                        isActive: tab.isActive,
                        cloudId: tab.cloudId || null
                    });
                });
                
                this.activeCodeTabId = tabsData.activeTabId;
                this.nextTabId = tabsData.nextTabId;
                
                return true;
            }
        } catch (error) {
            console.warn('Failed to load code tabs from localStorage:', error);
        }
        return false;
    }

    async saveCanvasToCloud(tabId) {
        if (!this.isAuthenticated || !this.authToken) return;
        const tab = this.codeTabs.get(tabId);
        if (!tab) return;
        const title = (tab.name || 'Sem título').substring(0, 255);
        const content = tab.content || '';
        const canvasType = this.detectCanvasType(content);
        const base = (this.apiBaseUrl || '/api').replace(/\/+$/, '');
        try {
            if (tab.cloudId) {
                const res = await fetch(`${base}/canvas/${tab.cloudId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ title, content })
                });
                if (res.ok) {
                    this.updateStatus('💾 Canvas salvo na nuvem');
                }
            } else {
                const res = await fetch(`${base}/canvas`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        title,
                        content,
                        canvasType,
                        isPublic: false
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.canvas && data.data.canvas.id) {
                        tab.cloudId = data.data.canvas.id;
                        this.saveCodeTabs();
                        this.updateStatus('💾 Canvas salvo na nuvem');
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to save canvas to cloud:', e);
        }
    }

    async loadCanvasFromCloud() {
        if (!this.isAuthenticated || !this.authToken) return;
        const base = (this.apiBaseUrl || '/api').replace(/\/+$/, '');
        try {
            const listRes = await fetch(`${base}/canvas?limit=30`, {
                headers: this.getAuthHeaders()
            });
            if (!listRes.ok) return;
            const listData = await listRes.json();
            const canvasList = listData.data && listData.data.canvas ? listData.data.canvas : [];
            const existingCloudIds = new Set(
                Array.from(this.codeTabs.values()).map(t => t.cloudId).filter(Boolean)
            );
            for (const row of canvasList) {
                if (existingCloudIds.has(row.id)) continue;
                const detailRes = await fetch(`${base}/canvas/${row.id}`, {
                    headers: this.getAuthHeaders()
                });
                if (!detailRes.ok) continue;
                const detailData = await detailRes.json();
                const canvas = detailData.data && detailData.data.canvas ? detailData.data.canvas : null;
                if (!canvas || !canvas.content) continue;
                const tabId = this.createCodeTab(
                    canvas.title || `Canvas ${row.canvas_type}`,
                    canvas.content,
                    this.codeTabs.size === 1
                );
                const tab = this.codeTabs.get(tabId);
                if (tab) tab.cloudId = canvas.id;
                this.saveCodeTabs();
            }
        } catch (e) {
            console.warn('Failed to load canvas from cloud:', e);
        }
    }

    createCodeTab(name = `Código ${this.nextTabId}`, content = '', makeActive = true) {
        const tabId = this.nextTabId++;
        
        // Desativar todas as outras abas se esta for ativa
        if (makeActive) {
            this.codeTabs.forEach(tab => tab.isActive = false);
            this.activeCodeTabId = tabId;
        }
        
        this.codeTabs.set(tabId, {
            name,
            content,
            isActive: makeActive,
            cloudId: null
        });
        
        this.saveCodeTabs();
        this.updateCodeTabsUI();
        
        return tabId;
    }

    switchTab(tabId) {
        if (!this.codeTabs.has(tabId)) return;
        
        // Desativar todas as abas
        this.codeTabs.forEach(tab => tab.isActive = false);
        
        // Ativar a aba selecionada
        const tab = this.codeTabs.get(tabId);
        tab.isActive = true;
        this.activeCodeTabId = tabId;
        
        // Atualizar o editor com o conteúdo da aba
        if (this.editor) {
            this.editor.setValue(tab.content);
        }
        
        this.saveCodeTabs();
        this.updateCodeTabsUI();
        this.render();
    }

    switchMainTab(tabName) {
        // Store current code content if we're leaving the code tab
        if (this.currentTab === 'code' && this.activeCodeTabId) {
            const currentCode = this.editor.getValue();
            const activeTab = this.codeTabs.get(this.activeCodeTabId);
            if (activeTab) {
                activeTab.content = currentCode;
                this.saveCodeTabs();
            }
            this.userCode = currentCode;
        }
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        const clickedTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (clickedTab) {
            clickedTab.classList.add('active');
        }
        
        // Update current tab
        this.currentTab = tabName;
        
        // Handle code tabs container visibility
        const codeTabsContainer = document.getElementById('codeTabsContainer');
        if (tabName === 'code') {
            // Show code tabs and make editor editable
            if (codeTabsContainer) {
                codeTabsContainer.classList.add('show');
            }
            this.editor.updateOptions({ readOnly: false });
            
            // Load active code tab content
            if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
                const activeTab = this.codeTabs.get(this.activeCodeTabId);
                if (activeTab) {
                    this.editor.setValue(activeTab.content);
                }
            }
            
            // Force update tabs UI
            this.updateCodeTabsUI();
        } else {
            // Hide code tabs and make editor read-only
            if (codeTabsContainer) {
                codeTabsContainer.classList.remove('show');
            }
            this.editor.updateOptions({ readOnly: true });
            
            // Load example content
            if (tabName === 'bmc-example') {
                this.editor.setValue(this.exampleBMC);
            } else if (tabName === 'lmc-example') {
                this.editor.setValue(this.exampleLMC);
            }
        }
        
        // Re-render canvas
        this.render();
    }

    deleteCodeTab(tabId) {
        if (!this.codeTabs.has(tabId)) return;
        
        const wasActive = this.codeTabs.get(tabId).isActive;
        this.codeTabs.delete(tabId);
        
        // Se era a aba ativa, ativar outra
        if (wasActive && this.codeTabs.size > 0) {
            const firstTab = this.codeTabs.keys().next().value;
            this.switchTab(firstTab);
        } else if (this.codeTabs.size === 0) {
            this.activeCodeTabId = null;
        }
        
        this.saveCodeTabs();
        this.updateCodeTabsUI();
    }

    updateCodeTabsUI() {
        const tabsContainer = document.querySelector('.code-tabs');
        if (!tabsContainer) return;
        
        tabsContainer.innerHTML = '';
        
        this.codeTabs.forEach((tab, tabId) => {
            const tabElement = document.createElement('div');
            tabElement.className = `tab ${tab.isActive ? 'active' : ''}`;
            tabElement.dataset.tabId = tabId;
            tabElement.innerHTML = `
                <span class="tab-title" title="${i18n.t('double-click-to-rename')}">${tab.name}</span>
                <button class="tab-close" title="${i18n.t('close-tab')}">&times;</button>
            `;
            
            // Event listeners
            tabElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    e.stopPropagation();
                    this.deleteCodeTab(tabId);
                } else {
                    this.switchTab(tabId);
                }
            });
            
            tabElement.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.openTabModal('rename', tabId);
            });
            
            tabsContainer.appendChild(tabElement);
        });
        
        // Botão de nova aba
        const addTabBtn = document.createElement('button');
        addTabBtn.className = 'add-tab-btn';
        addTabBtn.innerHTML = '+';
        addTabBtn.title = i18n.t('new-code-tab');
        addTabBtn.addEventListener('click', () => this.openTabModal('create'));
        tabsContainer.appendChild(addTabBtn);
    }

    // Modal de gerenciamento de abas
    openTabModal(mode, tabId = null) {
        this.modalMode = mode;
        this.currentTabId = tabId;
        
        const modal = document.getElementById('tabModal');
        const input = document.getElementById('tabNameInput');
        const title = document.getElementById('tabModalTitle');
        const confirmBtn = document.getElementById('confirmTab');
        
        if (mode === 'rename') {
            title.textContent = i18n.t('rename-tab');
            confirmBtn.textContent = i18n.t('rename');
            input.placeholder = i18n.t('enter-tab-name');
            input.value = this.codeTabs.get(tabId)?.name || '';
        } else {
            title.textContent = i18n.t('new-tab');
            confirmBtn.textContent = i18n.t('create');
            input.placeholder = i18n.t('enter-new-tab-name');
            input.value = '';
        }
        
        modal.style.display = 'flex';
        input.focus();
        input.select();
        
        if (!this.modalEventsSetup) {
            this.setupModalEvents();
        }
    }

    closeTabModal() {
        const modal = document.getElementById('tabModal');
        modal.style.display = 'none';
        this.modalMode = null;
        this.currentTabId = null;
    }

    setupModalEvents() {
        const modal = document.getElementById('tabModal');
        const input = document.getElementById('tabNameInput');
        const closeBtn = document.getElementById('closeTabModal');
        const cancelBtn = document.getElementById('cancelTab');
        const confirmBtn = document.getElementById('confirmTab');
        
        closeBtn.addEventListener('click', () => this.closeTabModal());
        cancelBtn.addEventListener('click', () => this.closeTabModal());
        
        confirmBtn.addEventListener('click', () => this.confirmTabAction());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmTabAction();
            } else if (e.key === 'Escape') {
                this.closeTabModal();
            }
        });
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTabModal();
            }
        });
        
        this.modalEventsSetup = true;
    }

    confirmTabAction() {
        const input = document.getElementById('tabNameInput');
        const name = input.value.trim();
        
        if (!name) return;
        
        if (this.modalMode === 'rename') {
            const tab = this.codeTabs.get(this.currentTabId);
            if (tab) {
                tab.name = name;
                this.saveCodeTabs();
                this.updateCodeTabsUI();
                if (this.isAuthenticated) {
                    this.saveCanvasToCloud(this.currentTabId).catch(() => {});
                }
            }
        } else {
            this.createCodeTab(name);
        }
        
        this.closeTabModal();
    }

    async init() {
        try {
            // Verificar autenticação primeiro
            await this.checkAuthentication();
            
            // Inicializar exemplos
            this.initializeExamples();
            
            // Carregar abas salvas
            this.loadCodeTabs();
            
            // Se autenticado e sem abas locais, carregar canvas da nuvem
            if (this.isAuthenticated && this.codeTabs.size === 0) {
                await this.loadCanvasFromCloud();
            }
            
            // Se ainda não há abas, criar uma padrão
            if (this.codeTabs.size === 0) {
                this.createCodeTab('Código 1', this.loadExample());
            }
            
            // Inicializar editor
            await this.initEditor();
            
            // Inicializar canvas
            this.initCanvas();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Atualizar UI
            this.updateCodeTabsUI();
            this.updateUserUI();
            
            console.log('BMC Markdown App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    async checkAuthentication() {
        try {
            console.log('🔐 Checking authentication...');
            const token = localStorage.getItem('bmcgen_auth_token');
            console.log('Token found:', !!token);
            
            if (!token) {
                console.log('❌ No token found, redirecting to login');
                window.location.href = '/login';
                return;
            }

            const apiBase = (this.apiBaseUrl || '/api').replace(/\/+$/, '');
            const meUrl = `${apiBase}/auth/me`;
            console.log('🌐 Checking token with API...', meUrl);
            const response = await fetch(meUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            const contentType = response.headers.get && response.headers.get('content-type');
            console.log('Response content-type:', contentType);
            
            if (response.ok) {
                // Prefer JSON directly; fallback to text -> JSON
                let payload;
                try {
                    if (contentType && contentType.includes('application/json')) {
                        payload = await response.json();
                    } else {
                        const responseText = await response.text();
                        console.log('Response text:', responseText.substring(0, 200));
                        payload = JSON.parse(responseText);
                    }
                } catch (e) {
                    console.error('Failed to parse /auth/me JSON:', e);
                    throw e;
                }
                this.isAuthenticated = true;
                this.user = (payload && (payload.data && payload.data.user)) || payload.user;
                this.authToken = token;
                console.log('✅ User authenticated:', this.user.name);
            } else {
                console.log('❌ Token invalid, redirecting to login');
                localStorage.removeItem('bmcgen_auth_token');
                localStorage.removeItem('bmcgen_user');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            localStorage.removeItem('bmcgen_auth_token');
            localStorage.removeItem('bmcgen_user');
            window.location.href = '/login';
        }
    }

    updateUserUI() {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isAuthenticated && this.user) {
            userName.textContent = `👤 ${this.user.name}`;
            userInfo.style.display = 'flex';
            
            logoutBtn.addEventListener('click', () => this.logout());
        } else {
            userInfo.style.display = 'none';
        }
    }

    logout() {
        localStorage.removeItem('bmcgen_auth_token');
        localStorage.removeItem('bmcgen_user');
        window.location.href = '/login';
    }

    initializeExamples() {
        // Carregar exemplo BMC
        this.exampleBMC = `# BUSINESS MODEL CANVAS (BMC) - EXEMPLO EXPLICATIVO
# 
# O Business Model Canvas é uma ferramenta estratégica que descreve de forma visual
# como uma empresa cria, entrega e captura valor. Ele é dividido em 9 blocos fundamentais.

bmc
title: Netflix - Plataforma de Streaming
description: Serviço de streaming de vídeo por assinatura

# 🤝 PARCERIAS-CHAVE
# Quem são nossos parceiros estratégicos?
# Que atividades eles realizam? Que recursos eles fornecem?
key-partnerships:
  - Estúdios de Hollywood (Disney, Warner Bros)
  - Produtoras independentes de conteúdo
  - Provedores de internet (ISPs)
  - Dispositivos inteligentes (Samsung, LG, Roku)
  - Plataformas de pagamento (PayPal, cartões)
  - Serviços de cloud computing (AWS)

# ⚡ ATIVIDADES-CHAVE  
# Que atividades mais importantes nossa proposta de valor exige?
# Nossos canais de distribuição? Relacionamento com clientes? Fontes de receita?
key-activities:
  - Licenciamento de conteúdo
  - Produção de conteúdo original
  - Desenvolvimento de tecnologia de streaming
  - Análise de dados e algoritmos de recomendação
  - Marketing e aquisição de usuários
  - Atendimento ao cliente

# 🔑 RECURSOS-CHAVE
# Que recursos mais importantes nossa proposta de valor exige?
# Nossos canais de distribuição? Relacionamento com clientes?
key-resources:
  - Plataforma tecnológica robusta
  - Biblioteca de conteúdo licenciado
  - Conteúdo original exclusivo
  - Algoritmos de recomendação
  - Marca global reconhecida
  - Equipe de desenvolvimento e criação

# 💰 PROPOSTA DE VALOR
# Que valor entregamos aos clientes?
# Qual problema estamos resolvendo?
# Que necessidades satisfazemos?
value-propositions:
  - Entretenimento sob demanda 24/7
  - Conteúdo original exclusivo de alta qualidade
  - Experiência personalizada com recomendações
  - Múltiplas telas e dispositivos
  - Sem comerciais durante a reprodução
  - Preço acessível comparado à TV a cabo

# 🤝 RELACIONAMENTO COM CLIENTES
# Que tipo de relacionamento estabelecemos?
# Como mantemos e desenvolvemos?
customer-relationships:
  - Autoatendimento via plataforma
  - Suporte técnico 24/7
  - Comunidade online de fãs
  - Programas de fidelidade
  - Comunicação personalizada
  - Feedback e avaliações de conteúdo

# 📢 CANAIS
# Através de quais canais alcançamos nossos clientes?
# Como nossos canais se integram?
channels:
  - Plataforma web (Netflix.com)
  - Aplicativos móveis (iOS, Android)
  - Smart TVs e dispositivos streaming
  - Parcerias com operadoras de TV
  - Marketing digital e redes sociais
  - Recomendações boca a boca

# 👥 SEGMENTOS DE CLIENTES
# Para quem criamos valor?
# Quem são nossos clientes mais importantes?
customer-segments:
  - Famílias com crianças
  - Jovens adultos (18-35 anos)
  - Entusiastas de séries e filmes
  - Consumidores de conteúdo internacional
  - Pessoas que cortaram TV a cabo
  - Usuários de múltiplos dispositivos

# 💸 ESTRUTURA DE CUSTOS
# Quais são os custos mais importantes?
# Quais recursos e atividades são mais caros?
cost-structure:
  - Licenciamento de conteúdo (maior custo)
  - Produção de conteúdo original
  - Infraestrutura tecnológica e cloud
  - Marketing e aquisição de usuários
  - Desenvolvimento de software
  - Custos operacionais e pessoal

# 💵 FONTES DE RECEITA
# Por que valor nossos clientes pagam?
# Como e quanto pagam atualmente?
revenue-streams:
  - Assinaturas mensais recorrentes
  - Planos diferenciados (Básico, Padrão, Premium)
  - Expansão geográfica internacional
  - Parcerias e licenciamento de conteúdo
  - Merchandising de conteúdo original`;

        // Carregar exemplo LMC
        this.exampleLMC = `# LEAN MODEL CANVAS (LMC) - EXEMPLO EXPLICATIVO
#
# O Lean Model Canvas é uma adaptação do Business Model Canvas focada em startups
# e validação rápida de hipóteses de negócio. É mais enxuto e orientado a problemas.

lmc
title: Uber - Aplicativo de Transporte
description: Plataforma que conecta passageiros e motoristas para viagens urbanas

# ❗ PROBLEMA
# Quais são os 3 principais problemas que você está resolvendo?
# Liste os problemas existentes e como eles são resolvidos hoje.
# Identifique qual é o problema #1 mais crítico.
problem:
  - Dificuldade de encontrar táxi em horários de pico
  - Preços altos e não transparentes do transporte
  - Falta de segurança e confiabilidade nos táxis
  - Tempo de espera longo e incerteza
  - Experiência inconsistente de atendimento
  - Métodos de pagamento limitados

# 💡 SOLUÇÃO
# Como você resolve cada problema?
# Qual é o Produto Mínimo Viável (MVP)?
# Liste as 3 principais funcionalidades.
solution:
  - App que conecta passageiros e motoristas em tempo real
  - Sistema de GPS para rastreamento e otimização de rotas
  - Preços dinâmicos transparentes calculados pelo app
  - Sistema de avaliação mútua (motorista/passageiro)
  - Pagamento integrado sem dinheiro físico
  - Histórico completo de viagens

# ⭐ PROPOSTA ÚNICA DE VALOR
# Por que você é diferente e vale a pena comprar?
# Que valor você entrega? Para qual cliente?
# Mensagem clara e convincente para o cliente.
unique-value-proposition:
  - "Transporte confiável ao toque de um botão"
  - Chegada em minutos, não horas
  - Preço justo e transparente
  - Segurança através de rastreamento e avaliações
  - Conveniência total: sem dinheiro, sem ligações

# 🏆 VANTAGEM COMPETITIVA
# Algo que não pode ser copiado ou comprado facilmente.
# Que recursos especiais você possui?
# Proteção contra competição (patentes, marca, etc.)
unfair-advantage:
  - Efeito de rede: mais motoristas atraem mais passageiros
  - Algoritmos patenteados de matching e preços dinâmicos
  - Primeira empresa no mercado (vantagem do pioneiro)
  - Dados massivos de mobilidade urbana
  - Marca global reconhecida e confiável
  - Capital e recursos para expansão rápida

# 👥 SEGMENTOS DE CLIENTES
# Quem são seus primeiros clientes? (early adopters)
# Como você define seu cliente ideal?
# Para qual nicho específico você está construindo?
customer-segments:
  - Profissionais urbanos (25-45 anos) com smartphone
  - Pessoas que não possuem carro próprio
  - Turistas e visitantes em cidades grandes
  - Usuários que valorizam conveniência sobre preço
  - Millennials tech-savvy em áreas metropolitanas
  - Executivos que precisam de transporte confiável

# 📊 MÉTRICAS-CHAVE
# Como você mede o sucesso?
# Quais números direcionam seu negócio?
# Como você rastreia suas atividades?
key-metrics:
  - Número de viagens completadas por mês
  - Taxa de crescimento de usuários ativos
  - Tempo médio de espera do passageiro
  - Taxa de retenção de motoristas e passageiros
  - Receita por viagem e por usuário
  - Net Promoter Score (NPS)
  - Cobertura geográfica (% da cidade atendida)
  - Tempo médio de chegada do motorista

# 📱 CANAIS
# Como você alcança seus clientes?
# Qual caminho você usa para entregá-los?
# Como seus canais se integram? Quais funcionam melhor?
channels:
  - Aplicativo móvel (iOS/Android) - principal
  - Marketing digital e redes sociais
  - Programa de indicação com desconto
  - Parcerias com empresas para funcionários
  - Eventos e ativações em pontos estratégicos
  - PR e imprensa especializada
  - Marketing de guerrilha em universidades

# 💰 ESTRUTURA DE CUSTOS
# Quais são seus maiores custos?
# Quais atividades/recursos são mais caros?
# Seu modelo é direcionado por custo ou valor?
cost-structure:
  - Incentivos e bonificações para motoristas
  - Marketing e aquisição de usuários
  - Desenvolvimento e manutenção da tecnologia
  - Operações locais e suporte ao cliente
  - Salários da equipe técnica e operacional
  - Seguros e questões regulamentares
  - Infraestrutura de servidores e dados

# 💵 FONTES DE RECEITA
# Como você ganha dinheiro?
# Por qual valor os clientes pagam?
# Como eles preferem pagar? Quanto cada fonte contribui?
revenue-streams:
  - Comissão de 20-25% sobre cada viagem
  - Taxa de cancelamento para passageiros
  - Taxa de conveniência em horários de pico
  - Surge pricing (preços dinâmicos) em alta demanda
  - Uber Premium/Black (viagens de luxo)
  - Parcerias corporativas (Uber for Business)
  - Receitas futuras: delivery, freight, etc.`;
    }

    loadExample() {
        const savedCode = localStorage.getItem(this.storageKey);
        if (savedCode) {
            return savedCode;
        }
        
        return `# Business Model Canvas (BMC) - Sintaxe Básica
# Substitua os valores de exemplo pelos seus próprios dados

bmc
title: Nome do seu negócio
description: Breve descrição do modelo de negócio

customer-segments:
  - Segmento de cliente 1
  - Segmento de cliente 2
  - Segmento de cliente 3

value-propositions:
  - Proposta de valor 1
  - Proposta de valor 2
  - Proposta de valor 3

channels:
  - Canal 1
  - Canal 2
  - Canal 3

customer-relationships:
  - Tipo de relacionamento 1
  - Tipo de relacionamento 2
  - Tipo de relacionamento 3

revenue-streams:
  - Fonte de receita 1
  - Fonte de receita 2
  - Fonte de receita 3

key-resources:
  - Recurso-chave 1
  - Recurso-chave 2
  - Recurso-chave 3

key-activities:
  - Atividade-chave 1
  - Atividade-chave 2
  - Atividade-chave 3

key-partnerships:
  - Parceria-chave 1
  - Parceria-chave 2
  - Parceria-chave 3

cost-structure:
  - Custo 1
  - Custo 2
  - Custo 3

# Para Lean Model Canvas (LMC), use:
# lmc
# title: Nome da sua startup
# description: Breve descrição da solução
#
# problem:
#   - Problema 1
#   - Problema 2
#
# solution:
#   - Solução 1
#   - Solução 2
#
# unique-value-proposition:
#   - Proposta única de valor
#
# unfair-advantage:
#   - Vantagem competitiva 1
#   - Vantagem competitiva 2
#
# customer-segments:
#   - Segmento de cliente 1
#   - Segmento de cliente 2
#
# key-metrics:
#   - Métrica-chave 1
#   - Métrica-chave 2
#
# channels:
#   - Canal 1
#   - Canal 2
#
# cost-structure:
#   - Custo 1
#   - Custo 2
#
# revenue-streams:
#   - Fonte de receita 1
#   - Fonte de receita 2`;
    }

    async initEditor() {
        return new Promise((resolve) => {
            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('editor'), {
                    value: this.getCurrentTabContent(),
                    language: 'markdown',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    renderWhitespace: 'selection',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    contextmenu: true,
                    mouseWheelZoom: true
                });

                this.editor.onDidChangeModelContent(() => {
                    this.debouncedRender();
                    this.autoSave();
                });

                resolve();
            });
        });
    }

    getCurrentTabContent() {
        if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
            return this.codeTabs.get(this.activeCodeTabId).content;
        }
        return this.loadExample();
    }

    initCanvas() {
        this.canvas = document.getElementById('bmcCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize Parser and Renderer
        this.parser = new BMCParser();
        this.renderer = new BMCRenderer(this.canvas, this.ctx);
        
        // Verificar integração PDF
        this.checkPDFIntegration();
        
        // Renderizar canvas inicial
        this.render();
    }

    checkPDFIntegration() {
        console.log('🔍 Verificando integração PDF...');
        
        if (window.CanvasPDFGenerator) {
            console.log('✅ CanvasPDFGenerator disponível');
            if (typeof window.CanvasPDFGenerator.generatePDF === 'function') {
                console.log('✅ Método generatePDF disponível');
            }
            if (typeof window.CanvasPDFGenerator.downloadCanvasAsPNG === 'function') {
                console.log('✅ Método downloadCanvasAsPNG disponível');
            }
        } else {
            console.log('❌ CanvasPDFGenerator não disponível');
        }
        
        if (this.canvas) {
            console.log(`✅ Canvas disponível: ${this.canvas.width} x ${this.canvas.height}`);
        }
    }

    setupEventListeners() {
        // Botões de zoom
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('fitBtn').addEventListener('click', () => this.fitToScreen());

        // Botões de ação
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareAsPNG());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromFile());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToFile());

        // Abas principais
        document.querySelectorAll('.tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchMainTab(tabName);
            });
        });

        // Seletor de idioma
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });

        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            this.debouncedRender();
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveToFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.loadFromFile();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportToPDF();
                        break;
                }
            }
        });
    }

    debouncedRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.renderTimeout = setTimeout(() => {
            this.render();
        }, 100);
    }

    render() {
        if (this.isRendering) return;
        
        this.isRendering = true;
        
        try {
            const content = this.getCurrentTabContent();
            const parsed = this.parser.parse(content);
            
            if (parsed) {
                this.renderer.render(parsed, this.ctx, this.zoomLevel);
                this.updateStatus('Canvas rendered successfully');
            } else {
                this.updateStatus('Invalid BMC/LMC syntax');
            }
        } catch (error) {
            console.error('Render error:', error);
            this.updateStatus('Render error: ' + error.message);
        } finally {
            this.isRendering = false;
        }
    }

    updateStatus(message) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
        this.updateZoomDisplay();
        this.render();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
        this.updateZoomDisplay();
        this.render();
    }

    fitToScreen() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scaleX = containerWidth / 1200;
        const scaleY = containerHeight / 800;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.zoomLevel = scale;
        this.updateZoomDisplay();
        this.render();
    }

    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }

    loadBMCExample() {
        if (this.editor) {
            this.editor.setValue(this.exampleBMC);
            this.render();
        }
    }

    loadLMCExample() {
        if (this.editor) {
            this.editor.setValue(this.exampleLMC);
            this.render();
        }
    }

    autoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            if (this.editor) {
                const content = this.editor.getValue();
                
                // Salvar na aba ativa
                if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
                    this.codeTabs.get(this.activeCodeTabId).content = content;
                    this.saveCodeTabs();
                    // Persistir no banco do usuário se autenticado
                    if (this.isAuthenticated) {
                        this.saveCanvasToCloud(this.activeCodeTabId).catch(() => {});
                    }
                }
                
                // Salvar no localStorage (compatibilidade)
                localStorage.setItem(this.storageKey, content);
                
                this.updateStatus('💾 Código salvo automaticamente');
            }
        }, 1000);
    }

    exportToPDF() {
        if (!this.canvas) {
            this.updateStatus('Canvas not available');
            return;
        }

        try {
            console.log('🔄 Iniciando exportação para PDF...');
            
            if (window.CanvasPDFGenerator && typeof window.CanvasPDFGenerator.generatePDF === 'function') {
                console.log('✅ Usando CanvasPDFGenerator.generatePDF');
                window.CanvasPDFGenerator.generatePDF(this.canvas, 'bmc-canvas.pdf');
                this.updateStatus('PDF exported successfully');
            } else {
                console.log('⚠️ CanvasPDFGenerator não disponível, usando fallback PNG');
                if (window.CanvasPDFGenerator && typeof window.CanvasPDFGenerator.downloadCanvasAsPNG === 'function') {
                    window.CanvasPDFGenerator.downloadCanvasAsPNG(this.canvas, 'bmc-canvas.png');
                    this.updateStatus('PNG exported (PDF not available)');
                } else {
                    this.updateStatus('Export not available');
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            this.updateStatus('Export failed: ' + error.message);
        }
    }

    shareAsPNG() {
        if (!this.canvas) {
            this.updateStatus('Canvas not available');
            return;
        }

        try {
            const dataURL = this.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'bmc-canvas.png';
            link.href = dataURL;
            link.click();
            this.updateStatus('PNG exported successfully');
        } catch (error) {
            console.error('PNG export error:', error);
            this.updateStatus('PNG export failed: ' + error.message);
        }
    }

    loadFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    if (this.editor) {
                        this.editor.setValue(content);
                        this.autoSave();
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    saveToFile() {
        if (this.editor) {
            const content = this.editor.getValue();
            const blob = new Blob([content], { type: 'text/markdown' });
            const link = document.createElement('a');
            link.download = 'bmc-canvas.md';
            link.href = URL.createObjectURL(blob);
            link.click();
            this.updateStatus('File saved successfully');
        }
    }

    changeLanguage(lang) {
        i18n.setLanguage(lang);
        this.updateUILanguage();
    }

    updateUILanguage() {
        // Atualizar textos da interface
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = i18n.t(key);
        });
        
        // Atualizar abas
        this.updateCodeTabsUI();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BMCApp();
});
