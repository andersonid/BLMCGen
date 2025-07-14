// BMC Markdown App
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
        this.codeTabs = new Map(); // Map<tabId, {name, content, isActive}>
        this.activeCodeTabId = null;
        this.nextTabId = 1;
        this.codeTabsKey = 'blmcgen-code-tabs';
        
        // Exemplos
        this.exampleBMC = '';
        this.exampleLMC = '';
        
        this.init();
    }

    // Funções para gerenciamento de múltiplas abas de código
    saveCodeTabs() {
        try {
            const tabsData = {
                tabs: Array.from(this.codeTabs.entries()).map(([id, tab]) => ({
                    id,
                    name: tab.name,
                    content: tab.content,
                    isActive: tab.isActive
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
                        isActive: tab.isActive
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
            isActive: makeActive
        });
        
        this.updateCodeTabsUI();
        this.saveCodeTabs();
        
        if (makeActive) {
            this.switchToCodeTab(tabId);
        }
        
        return tabId;
    }

    deleteCodeTab(tabId) {
        if (this.codeTabs.size <= 1) {
            return; // Não permitir deletar a última aba
        }
        
        const wasActive = this.codeTabs.get(tabId)?.isActive;
        this.codeTabs.delete(tabId);
        
        // Se a aba deletada era ativa, ativar a primeira disponível
        if (wasActive) {
            const firstTabId = this.codeTabs.keys().next().value;
            this.switchToCodeTab(firstTabId);
        }
        
        this.updateCodeTabsUI();
        this.saveCodeTabs();
    }

    renameCodeTab(tabId, newName) {
        const tab = this.codeTabs.get(tabId);
        if (tab) {
            tab.name = newName.trim() || `Código ${tabId}`;
            this.updateCodeTabsUI();
            this.saveCodeTabs();
        }
    }

    switchToCodeTab(tabId) {
        // Salvar conteúdo da aba atual antes de trocar
        if (this.activeCodeTabId && this.editor) {
            const currentTab = this.codeTabs.get(this.activeCodeTabId);
            if (currentTab) {
                currentTab.content = this.editor.getValue();
            }
        }
        
        // Desativar todas as abas
        this.codeTabs.forEach(tab => tab.isActive = false);
        
        // Ativar a nova aba
        const newTab = this.codeTabs.get(tabId);
        if (newTab) {
            newTab.isActive = true;
            this.activeCodeTabId = tabId;
            
            // Carregar conteúdo no editor
            if (this.editor) {
                this.editor.setValue(newTab.content);
            }
            
            this.updateCodeTabsUI();
            this.saveCodeTabs();
            this.debounceRender();
        }
    }

    updateCodeTabsUI() {
        const codeTabsContainer = document.querySelector('.code-tabs');
        if (!codeTabsContainer) {
            console.error('Code tabs container not found!');
            return;
        }
        
        // Garantir que o container pai tenha a classe show se estivermos na aba code
        if (this.currentTab === 'code') {
            const parentContainer = document.getElementById('codeTabsContainer');
            if (parentContainer) {
                parentContainer.classList.add('show');
            }
        }
        
        codeTabsContainer.innerHTML = '';
        
        // Criar abas de código
        this.codeTabs.forEach((tab, tabId) => {
            const tabElement = document.createElement('div');
            tabElement.className = `code-tab ${tab.isActive ? 'active' : ''}`;
            tabElement.innerHTML = `
                <span class="tab-name" data-tab-id="${tabId}" title="Duplo clique para renomear">${tab.name}</span>
                ${this.codeTabs.size > 1 ? `<button class="tab-close" data-tab-id="${tabId}" title="Fechar aba">×</button>` : ''}
            `;
            codeTabsContainer.appendChild(tabElement);
        });
        
        // Botão para adicionar nova aba
        const addTabButton = document.createElement('button');
        addTabButton.className = 'add-tab-btn';
        addTabButton.innerHTML = '+';
        addTabButton.title = 'Nova aba de código';
        codeTabsContainer.appendChild(addTabButton);
        
        // Event listeners para as abas
        this.setupCodeTabsEventListeners();
    }

    setupCodeTabsEventListeners() {
        const codeTabsContainer = document.querySelector('.code-tabs');
        if (!codeTabsContainer) return;
        
        // Remover listeners antigos se existirem
        if (this.codeTabsClickHandler) {
            codeTabsContainer.removeEventListener('click', this.codeTabsClickHandler);
        }
        if (this.codeTabsDblClickHandler) {
            codeTabsContainer.removeEventListener('dblclick', this.codeTabsDblClickHandler);
        }
        
        // Criar novos handlers
        this.codeTabsClickHandler = (e) => {
            console.log('Code tab clicked:', e.target.className);
            if (e.target.classList.contains('tab-name')) {
                const tabId = parseInt(e.target.dataset.tabId);
                console.log('Switching to tab:', tabId);
                this.switchToCodeTab(tabId);
            } else if (e.target.classList.contains('tab-close')) {
                const tabId = parseInt(e.target.dataset.tabId);
                console.log('Closing tab:', tabId);
                this.deleteCodeTab(tabId);
            } else if (e.target.classList.contains('add-tab-btn')) {
                console.log('Adding new tab');
                this.createCodeTab();
            }
        };
        
        this.codeTabsDblClickHandler = (e) => {
            if (e.target.classList.contains('tab-name')) {
                const tabId = parseInt(e.target.dataset.tabId);
                this.startRenameTab(tabId, e.target);
            }
        };
        
        // Adicionar novos listeners
        codeTabsContainer.addEventListener('click', this.codeTabsClickHandler);
        codeTabsContainer.addEventListener('dblclick', this.codeTabsDblClickHandler);
    }

    startRenameTab(tabId, element) {
        const currentName = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'tab-rename-input';
        
        element.style.display = 'none';
        element.parentNode.insertBefore(input, element);
        
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            this.renameCodeTab(tabId, newName);
            input.remove();
            element.style.display = '';
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                input.remove();
                element.style.display = '';
            }
        });
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
title: TamborEco
description: Ecossistema educacional que une música, tecnologia, cultura maker e inclusão social por meio de um curso prático e um kit DIY de bateria eletrônica.

# 🎯 PROBLEMA
# Quais são os 3 principais problemas que você resolve?
# Lista os problemas existentes que você identificou
problem:
  - Jovens e adultos iniciantes em música
  - Escolas públicas, técnicas e IFs
  - Educadores e arte-educadores
  - ONGs e projetos sociais
  - Espaços culturais (SESCs, CEUs, Casas de Cultura)
  - Secretarias de Educação, Cultura e Desenvolvimento Social
  - Empresas com programas de responsabilidade social
  - Público maker e entusiastas da cultura digital

# 💡 SOLUÇÃO
# Como você resolve cada problema?
# Principais características do seu produto/serviço
solution:
  - Curso completo e acessível: construa e toque sua própria bateria eletrônica
  - Integração de música, eletrônica e software livre
  - Kit DIY de baixo custo com materiais simples e educativos
  - Oficinas práticas com impacto social e cultural
  - Plataforma de formação de multiplicadores comunitários

# 🔑 PROPOSTA DE VALOR ÚNICA
# Por que você é diferente e vale a pena comprar?
# Promessa única que você faz aos clientes
unique-value-proposition:
  - Curso completo e acessível: construa e toque sua própria bateria eletrônica
  - Integração de música, eletrônica e software livre
  - Kit DIY de baixo custo com materiais simples e educativos
  - Oficinas práticas com impacto social e cultural
  - Plataforma de formação de multiplicadores comunitários

# 🎯 VANTAGEM COMPETITIVA
# Algo que não pode ser facilmente copiado ou comprado
# Seu diferencial único e defensável
unfair-advantage:
  - Produção e logística dos kits
  - Plataformas de ensino (presencial e híbrido)
  - Equipe de criação, suporte e coordenação
  - Material audiovisual e gráfico
  - Bolsas para oficinas gratuitas e ações sociais
  - Rede de oficinas e multiplicadores

# 👥 SEGMENTOS DE CLIENTES
# Para quem você está construindo?
# Seus clientes e usuários mais importantes
customer-segments:
  - Jovens e adultos iniciantes em música
  - Escolas públicas, técnicas e IFs
  - Educadores e arte-educadores
  - ONGs e projetos sociais
  - Espaços culturais (SESCs, CEUs, Casas de Cultura)
  - Secretarias de Educação, Cultura e Desenvolvimento Social
  - Empresas com programas de responsabilidade social
  - Público maker e entusiastas da cultura digital

# 📊 MÉTRICAS-CHAVE
# Principais números que você acompanha
# Como você mede o sucesso?
key-metrics:
  - Cursos vendidos e acessados
  - Oficinas e programas presenciais
  - Licenciamentos da metodologia para instituições
  - Captação de recursos via leis de incentivo e patrocínio

# 📢 CANAIS
# Como você alcança seus clientes?
# Caminhos para chegar até eles
channels:
  - Plataforma online (cursos e conteúdo)
  - Workshops presenciais em escolas, SESCs e ONGs
  - Redes sociais (Instagram, YouTube, TikTok)
  - Venda direta via e-commerce
  - Parcerias com secretarias e projetos sociais

# 💰 ESTRUTURA DE CUSTOS
# Principais custos para operar o negócio
# Custos mais importantes e operacionais
cost-structure:
  - Produção e logística dos kits
  - Plataformas de ensino (presencial e híbrido)
  - Equipe de criação, suporte e coordenação
  - Material audiovisual e gráfico
  - Bolsas para oficinas gratuitas e ações sociais
  - Rede de oficinas e multiplicadores

# 💵 FONTES DE RECEITA
# Como você ganha dinheiro?
# Principais formas de monetização
revenue-streams:
  - Venda do TamborEco Kit (varejo e institucional)
  - Venda de cursos online (individuais e combo)
  - Oficinas e programas presenciais
  - Licenciamentos da metodologia para instituições
  - Captação de recursos via leis de incentivo e patrocínio`;
    }

    initializeCodeTabs() {
        // Tentar carregar abas salvas
        if (!this.loadCodeTabs() || this.codeTabs.size === 0) {
            // Se não há abas salvas, criar a primeira aba
            this.createCodeTab('Código 1', '', true);
        }
        
        // Carregar conteúdo da aba ativa no editor
        const activeTab = Array.from(this.codeTabs.values()).find(tab => tab.isActive);
        if (activeTab && this.editor) {
            this.editor.setValue(activeTab.content);
        }
        
        // Atualizar UI das abas
        this.updateCodeTabsUI();
    }

    // LocalStorage functions for code persistence (mantidas para compatibilidade)
    saveUserCode(code) {
        try {
            localStorage.setItem(this.storageKey, code);
        } catch (error) {
            console.warn('Failed to save user code to localStorage:', error);
        }
    }

    loadUserCode() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.warn('Failed to load user code from localStorage:', error);
            return null;
        }
    }

    clearUserCode() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Failed to clear user code from localStorage:', error);
        }
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.projectsKey);
            localStorage.removeItem(this.codeTabsKey);
            console.log('All BLMCGen data cleared from localStorage');
        } catch (error) {
            console.warn('Failed to clear all data from localStorage:', error);
        }
    }

    // Project management functions
    getProjects() {
        try {
            const projects = localStorage.getItem(this.projectsKey);
            return projects ? JSON.parse(projects) : {};
        } catch (error) {
            console.warn('Failed to load projects from localStorage:', error);
            return {};
        }
    }

    saveProject(name, code, metadata = {}) {
        try {
            const projects = this.getProjects();
            const projectData = {
                name: name,
                code: code,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                canvasType: this.detectCanvasType(code),
                ...metadata
            };
            
            // If project exists, preserve creation date
            if (projects[name]) {
                projectData.createdAt = projects[name].createdAt;
            }
            
            projects[name] = projectData;
            localStorage.setItem(this.projectsKey, JSON.stringify(projects));
            
            console.log(`Project "${name}" saved successfully`);
            return true;
        } catch (error) {
            console.error('Failed to save project:', error);
            return false;
        }
    }

    loadProject(name) {
        try {
            const projects = this.getProjects();
            return projects[name] || null;
        } catch (error) {
            console.warn('Failed to load project:', error);
            return null;
        }
    }

    deleteProject(name) {
        try {
            const projects = this.getProjects();
            if (projects[name]) {
                delete projects[name];
                localStorage.setItem(this.projectsKey, JSON.stringify(projects));
                console.log(`Project "${name}" deleted successfully`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete project:', error);
            return false;
        }
    }

    getProjectsList() {
        const projects = this.getProjects();
        return Object.keys(projects).map(name => ({
            name: name,
            ...projects[name]
        })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    detectCanvasType(code) {
        // Simple detection based on content
        if (code.includes('problem:') || code.includes('solution:') || code.includes('unique-value-proposition:')) {
            return 'lmc';
        } else if (code.includes('value-propositions:') || code.includes('customer-relationships:')) {
            return 'bmc';
        }
        return 'unknown';
    }

    debounceSave() {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Show save indicator
        this.showSaveIndicator();
        
        // Set new timeout to save after 1 second of inactivity
        this.saveTimeout = setTimeout(() => {
            if (this.currentTab === 'code' && this.editor && this.activeCodeTabId) {
                const currentCode = this.editor.getValue();
                
                // Salvar na aba ativa do novo sistema
                const activeTab = this.codeTabs.get(this.activeCodeTabId);
                if (activeTab) {
                    activeTab.content = currentCode;
                    this.saveCodeTabs();
                }
                
                // Manter compatibilidade com sistema antigo
                this.userCode = currentCode;
                this.saveUserCode(currentCode);
                console.log('Auto-saved user code to localStorage');
                
                // Update status and hide save indicator after save
                this.updateStatus('💾 Código salvo automaticamente');
                this.hideSaveIndicator();
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    this.updateStatus('Pronto');
                }, 3000);
            }
        }, 1000);
    }

    showSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }

    hideSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 1500); // Show for 1.5 seconds after save
        }
    }

    loadInitialContent() {
        // Se não há conteúdo na aba ativa, carregar exemplo padrão
        const activeTab = Array.from(this.codeTabs.values()).find(tab => tab.isActive);
        if (!activeTab || !activeTab.content.trim()) {
            // Tentar carregar código salvo do sistema antigo para migração
            const savedCode = this.loadUserCode();
            if (savedCode && savedCode.trim() !== '') {
                if (activeTab) {
                    activeTab.content = savedCode;
                    this.editor.setValue(savedCode);
                    this.saveCodeTabs();
                }
                this.userCode = savedCode;
                console.log('Migrated saved user code to new tab system');
            } else {
                // Carregar exemplo padrão
                this.loadExample();
                console.log('Loaded default example content');
            }
        }
        
        // Render the loaded content
        this.render();
    }

    initLanguage() {
        // Set language selector to current language
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.value = i18n.getLanguage();
        
        // Update UI elements with translations
        this.updateUILanguage();
    }

    changeLanguage(lang) {
        i18n.setLanguage(lang);
        this.updateUILanguage();
        this.render(); // Re-render canvas with new language
    }

    updateCanvasTab(canvasType) {
        const canvasTab = document.getElementById('canvasTab');
        if (canvasTab) {
            if (canvasType === 'lmc') {
                canvasTab.innerHTML = `📊 ${i18n.t('lean-model-canvas')}`;
            } else {
                canvasTab.innerHTML = `📊 ${i18n.t('business-model-canvas')}`;
            }
        }
    }

    updateUILanguage() {
        // Update button texts and titles
        const elements = {
            'exportBtn': i18n.t('export'),
            'shareBtn': i18n.t('share'),
            'loadBtn': i18n.t('load'),
            'saveBtn': i18n.t('save'),
            'zoomOutBtn': i18n.t('zoom-out'),
            'zoomInBtn': i18n.t('zoom-in'),
            'fitBtn': i18n.t('fit-screen')
        };
        
        // Update button texts
        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'BUTTON' && !element.classList.contains('btn-icon')) {
                    element.textContent = text;
                } else {
                    element.title = text;
                }
            }
        });
        
        // Update tab texts
        const codeTab = document.querySelector('[data-tab="code"]');
        if (codeTab) {
            codeTab.innerHTML = `📝 ${i18n.t('code')}`;
        }
        
        const bmcExampleTab = document.querySelector('[data-tab="bmc-example"]');
        if (bmcExampleTab) {
            bmcExampleTab.innerHTML = `💼 ${i18n.t('bmc-example')}`;
        }
        
        const lmcExampleTab = document.querySelector('[data-tab="lmc-example"]');
        if (lmcExampleTab) {
            lmcExampleTab.innerHTML = `🚀 ${i18n.t('lmc-example')}`;
        }
        
        // Update status text
        const statusText = document.getElementById('statusText');
        if (statusText && statusText.textContent !== i18n.t('ready')) {
            // Only update if it's still showing 'Ready'
            statusText.textContent = i18n.t('ready');
        }
        
        // Update developer info
        const developerInfo = document.querySelector('.developer-info');
        if (developerInfo) {
            developerInfo.textContent = `${i18n.t('developed-by')} andersonid`;
        }
    }

    async init() {
        try {
            // Initialize i18n
            i18n.init();
            this.initLanguage();
            
            // Initialize Canvas
            this.initCanvas();
            
            // Initialize Parser and Renderer
            this.parser = new BMCParser();
            this.renderer = new BMCRenderer(this.canvas, this.ctx);
            
            // Initialize Monaco Editor
            await this.initEditor();
            
            // Initialize examples
            this.initializeExamples();
            
            // Initialize Code Tabs System
            this.initializeCodeTabs();
            
            // Garantir que as abas sejam mostradas se estivermos na aba Code
            if (this.currentTab === 'code') {
                const codeTabsContainer = document.getElementById('codeTabsContainer');
                if (codeTabsContainer) {
                    codeTabsContainer.classList.add('show');
                }
                this.updateCodeTabsUI();
            }
            
            // Initialize Splitter
            this.initSplitter();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load saved code or example content
            this.loadInitialContent();
            
            // Update status
            this.updateStatus(i18n.t('ready'));
            
            console.log('BMC Markdown App initialized successfully');
        } catch (error) {
            console.error('Error initializing BMC App:', error);
            this.showError('Failed to initialize application');
        }
    }

    async initEditor() {
        return new Promise((resolve) => {
            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
            
            require(['vs/editor/editor.main'], () => {
                // Define BMC language
                monaco.languages.register({ id: 'bmc' });
                
                // Set up syntax highlighting
                monaco.languages.setMonarchTokensProvider('bmc', {
                    tokenizer: {
                        root: [
                            [/^(bmc|title|description)/, 'keyword'],
                            [/^(customer-segments|value-propositions|channels|customer-relationships|revenue-streams|key-resources|key-activities|key-partnerships|cost-structure):/, 'type'],
                            [/^\s*-/, 'operator'],
                            [/^#.*$/, 'comment'],
                            [/"[^"]*"/, 'string'],
                            [/\d+/, 'number']
                        ]
                    }
                });
                
                // Set up theme
                monaco.editor.defineTheme('bmc-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'keyword', foreground: '#569cd6' },
                        { token: 'type', foreground: '#4ec9b0' },
                        { token: 'operator', foreground: '#d4d4d4' },
                        { token: 'comment', foreground: '#6a9955' },
                        { token: 'string', foreground: '#ce9178' },
                        { token: 'number', foreground: '#b5cea8' }
                    ],
                    colors: {
                        'editor.background': '#1e1e1e',
                        'editor.foreground': '#d4d4d4'
                    }
                });
                
                // Create editor
                this.editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '',
                    language: 'bmc',
                    theme: 'bmc-dark',
                    fontSize: 14,
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    glyphMargin: false,
                    folding: true,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    cursorBlinking: 'blink',
                    cursorSmoothCaretAnimation: 'on'
                });
                
                // Listen for content changes
                this.editor.onDidChangeModelContent(() => {
                    this.debounceRender();
                    // Auto-save user code when in code tab
                    if (this.currentTab === 'code') {
                        this.debounceSave();
                    }
                });
                
                // Listen for cursor position changes
                this.editor.onDidChangeCursorPosition((e) => {
                    this.updateCursorPosition(e.position);
                });
                
                resolve();
            });
        });
    }

    initCanvas() {
        this.canvas = document.getElementById('bmcCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial canvas size based on paper format
        this.updateCanvasSize();
    }

    initSplitter() {
        const splitter = document.getElementById('splitter');
        const editorSection = document.querySelector('.editor-section');
        const canvasSection = document.querySelector('.canvas-section');
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = editorSection.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });
        
        function handleMouseMove(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            const minWidth = 300;
            const maxWidth = window.innerWidth - 400;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                editorSection.style.flex = `0 0 ${newWidth}px`;
                canvasSection.style.flex = '1';
            }
        }
        
        function handleMouseUp() {
            isResizing = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    setupEventListeners() {
        // Language selector
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoomOut();
        });
        
        document.getElementById('fitBtn').addEventListener('click', () => {
            this.fitToScreen();
        });
        

        
        // Header actions
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCanvas();
        });
        
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareCanvas();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.loadMarkdownFile();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.downloadMarkdownFile();
        });
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    updateCanvasSize() {
        // Fixed canvas size optimized for screen viewing
        const canvasWidth = 1200;
        const canvasHeight = 800;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Update canvas container
        const container = document.getElementById('canvasContainer');
        container.style.width = '100%';
        container.style.height = '100%';
        
        // Re-render if renderer exists
        if (this.renderer) {
            this.renderer.updateCanvasSize(canvasWidth, canvasHeight);
            this.render();
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
        this.updateZoom();
    }

    fitToScreen() {
        const container = document.getElementById('canvasContainer');
        const containerRect = container.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const scaleX = (containerRect.width - 40) / this.canvas.width;
        const scaleY = (containerRect.height - 40) / this.canvas.height;
        
        this.zoomLevel = Math.min(scaleX, scaleY);
        this.updateZoom();
    }

    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    switchTab(tabName) {
        // Store current code content if we're leaving the code tab
        if (this.currentTab === 'code' && this.activeCodeTabId) {
            const currentCode = this.editor.getValue();
            const activeTab = this.codeTabs.get(this.activeCodeTabId);
            if (activeTab) {
                activeTab.content = currentCode;
                this.saveCodeTabs();
            }
            this.userCode = currentCode;
            this.saveUserCode(currentCode);
            
            // Show save indicator when switching tabs
            this.showSaveIndicator();
            setTimeout(() => this.hideSaveIndicator(), 500);
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
            const activeTab = Array.from(this.codeTabs.values()).find(tab => tab.isActive);
            if (activeTab) {
                this.editor.setValue(activeTab.content);
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
        this.renderCanvas();
    }

    loadExample() {
        const exampleCode = `bmc
title: Plataforma de Entrega de Comida
description: Marketplace digital conectando restaurantes e consumidores

customer-segments:
  - Consumidores urbanos (25-45 anos)
  - Famílias ocupadas
  - Profissionais que trabalham em casa
  - Estudantes universitários

value-propositions:
  - Entrega rápida (30 min)
  - Variedade de restaurantes
  - Preços competitivos
  - Programa de fidelidade
  - Avaliações e reviews
  - Suporte via chat

channels:
  - Aplicativo móvel
  - Website
  - Redes sociais
  - Marketing digital
  - Parcerias com restaurantes

customer-relationships:
  - Programa de fidelidade
  - Avaliações e reviews
  - Suporte via chat
  - Promoções personalizadas

revenue-streams:
  - Taxa de entrega
  - Comissão dos restaurantes
  - Publicidade na plataforma
  - Assinatura premium
  - Taxa de conveniência

key-resources:
  - Plataforma tecnológica
  - Rede de entregadores
  - Parcerias com restaurantes
  - Dados dos usuários
  - Marca e reputação

key-activities:
  - Desenvolvimento de software
  - Gestão de logística
  - Marketing e aquisição
  - Atendimento ao cliente
  - Análise de dados

key-partnerships:
  - Restaurantes
  - Entregadores independentes
  - Processadores de pagamento
  - Fornecedores de tecnologia
  - Influenciadores digitais

cost-structure:
  - Desenvolvimento tecnológico
  - Marketing e publicidade
  - Operações e logística
  - Atendimento ao cliente
  - Processamento de pagamentos`;
        
        this.userCode = exampleCode;
        this.editor.setValue(exampleCode);
        
        // Atualizar aba ativa se o sistema de abas estiver inicializado
        if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
            const activeTab = this.codeTabs.get(this.activeCodeTabId);
            activeTab.content = exampleCode;
            this.saveCodeTabs();
        }
        
        this.render();
    }

    loadBMCExample() {
        const bmcExampleCode = `# BUSINESS MODEL CANVAS (BMC) - EXEMPLO EXPLICATIVO
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
# Que recursos principais nossa proposta de valor exige?
# Nossos canais de distribuição? Relacionamento com clientes? Fontes de receita?
key-resources:
  - Biblioteca massiva de conteúdo
  - Tecnologia de streaming e CDN
  - Algoritmos de machine learning
  - Marca global reconhecida
  - Dados dos usuários
  - Equipe criativa e técnica

# 💎 PROPOSIÇÕES DE VALOR
# Que valor entregamos ao cliente?
# Que problema estamos resolvendo? Que necessidades satisfazemos?
# Que produtos/serviços oferecemos para cada segmento?
value-propositions:
  - Entretenimento sob demanda 24/7
  - Conteúdo original exclusivo e premiado
  - Algoritmo de recomendação personalizada
  - Qualidade 4K/HDR sem anúncios
  - Acesso em múltiplos dispositivos
  - Download para assistir offline
  - Interface intuitiva e fácil de usar

# ❤️ RELACIONAMENTO COM CLIENTES
# Que tipo de relacionamento cada segmento espera? Qual o custo?
# Como integramos isso ao resto do modelo de negócio?
customer-relationships:
  - Experiência personalizada via IA
  - Atendimento ao cliente 24/7
  - Comunidade online e redes sociais
  - Programa de fidelidade por tempo de uso
  - Feedback contínuo via avaliações
  - Email marketing com novidades

# 📱 CANAIS
# Através de que canais nossos segmentos querem ser alcançados?
# Como chegamos até eles? Como integramos nossos canais?
# Quais funcionam melhor? Quais são mais econômicos?
channels:
  - Website oficial (netflix.com)
  - Aplicativos móveis (iOS/Android)
  - Smart TVs e dispositivos de streaming
  - Consoles de videogame
  - Marketing digital e redes sociais
  - Campanhas publicitárias tradicionais
  - Recomendações boca a boca

# 👥 SEGMENTOS DE CLIENTES
# Para quem criamos valor? Quem são nossos clientes mais importantes?
# Que características, comportamentos e necessidades têm em comum?
customer-segments:
  - Famílias com crianças (conteúdo infantil)
  - Jovens adultos (18-35 anos) urbanos
  - Profissionais ocupados que valorizam conveniência
  - Entusiastas de entretenimento premium
  - Consumidores conscientes de preço (planos básicos)
  - Usuários internacionais (mercados emergentes)

# 💰 ESTRUTURA DE CUSTOS
# Quais são os custos mais importantes do modelo?
# Quais recursos-chave são mais caros? Quais atividades-chave são mais caras?
cost-structure:
  - Licenciamento de conteúdo (maior custo)
  - Produção de conteúdo original
  - Infraestrutura tecnológica e servidores
  - Marketing e aquisição de usuários
  - Salários da equipe global
  - Desenvolvimento de produto e tecnologia
  - Custos operacionais e administrativos

# 💵 FONTES DE RECEITA
# Por que valor nossos clientes estão dispostos a pagar?
# Por que eles pagam atualmente? Como preferem pagar?
# Quanto cada fonte de receita contribui para o total?
revenue-streams:
  - Assinaturas mensais recorrentes (principal)
  - Plano Básico ($8.99/mês - 1 tela, sem HD)
  - Plano Padrão ($13.99/mês - 2 telas, HD)
  - Plano Premium ($17.99/mês - 4 telas, 4K)
  - Expansão internacional com preços localizados
  - Possíveis receitas futuras: jogos, merchandise`;
        
        this.editor.setValue(bmcExampleCode);
        
        // Atualizar aba ativa se o sistema de abas estiver inicializado
        if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
            const activeTab = this.codeTabs.get(this.activeCodeTabId);
            activeTab.content = bmcExampleCode;
            this.saveCodeTabs();
        }
        
        this.render();
    }

    loadBMCExampleReadOnly() {
        const bmcExampleCode = `# BUSINESS MODEL CANVAS (BMC) - EXEMPLO EXPLICATIVO
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
# Que recursos principais nossa proposta de valor exige?
# Nossos canais de distribuição? Relacionamento com clientes? Fontes de receita?
key-resources:
  - Biblioteca massiva de conteúdo
  - Tecnologia de streaming e CDN
  - Dados dos usuários e algoritmos
  - Marca global reconhecida
  - Equipe técnica especializada
  - Capital para investimento em conteúdo

# 💰 PROPOSTA DE VALOR
# Que valor entregamos ao cliente?
# Qual problema estamos resolvendo? Que necessidades satisfazemos?
value-propositions:
  - Entretenimento sob demanda
  - Conteúdo original exclusivo e premiado
  - Algoritmo de recomendação personalizada
  - Acesso multiplataforma (TV, mobile, web)
  - Interface intuitiva e fácil de usar
  - Download para assistir offline
  - Sem anúncios (plano premium)

# 🤝 RELACIONAMENTO COM CLIENTES
# Que tipo de relacionamento cada segmento espera?
# Qual estabelecemos? Como se integram ao nosso modelo?
customer-relationships:
  - Autoatendimento via plataforma
  - Recomendações personalizadas via IA
  - Suporte ao cliente 24/7
  - Comunidades online e redes sociais
  - Programa de fidelidade implícito
  - Feedback contínuo via avaliações

# 📢 CANAIS
# Através de quais canais nossos segmentos querem ser alcançados?
# Como os alcançamos agora? Como nossos canais se integram?
channels:
  - Website oficial (netflix.com)
  - Aplicativos móveis (iOS/Android)
  - Smart TVs e dispositivos de streaming
  - Marketing digital e redes sociais
  - Parcerias com operadoras de internet
  - Boca a boca e indicações

# 👥 SEGMENTOS DE CLIENTES
# Quem são seus primeiros clientes? (early adopters)
# Como você define seu cliente ideal?
# Para qual nicho específico você está construindo?
customer-segments:
  - Profissionais urbanos (25-45 anos)
  - Viajantes e turistas
  - Pessoas sem carro próprio
  - Usuários que evitam dirigir (álcool, cansaço)
  - Empresas que precisam de transporte para funcionários

# 💸 ESTRUTURA DE CUSTOS
# Quais são seus maiores custos?
# O que é mais caro no seu modelo de negócio?
cost-structure:
  - Incentivos e bonificações para motoristas
  - Desenvolvimento e manutenção da plataforma
  - Marketing e aquisição de usuários
  - Operações locais e suporte
  - Seguros e questões legais/regulatórias
  - Processamento de pagamentos

# 💵 FONTES DE RECEITA
# Como você ganha dinheiro?
# Por qual valor os clientes realmente pagam?
# Por qual pagam atualmente? Como preferem pagar?
# Quanto cada fonte de receita contribui para o total?
revenue-streams:
  - Comissão de 20-25% sobre cada viagem
  - Taxa de cancelamento para passageiros
  - Taxa de conveniência em horários de pico
  - Surge pricing (preços dinâmicos) em alta demanda
  - Uber Premium/Black (viagens de luxo)
  - Parcerias corporativas (Uber for Business)
  - Receitas futuras: delivery, freight, etc.`;
        
        // Apenas carregar no editor, sem afetar as abas do usuário
        this.editor.setValue(bmcExampleCode);
        this.render();
    }

    loadLMCExample() {
        const lmcExampleCode = `# LEAN MODEL CANVAS (LMC) - EXEMPLO EXPLICATIVO
#
# O Lean Model Canvas é uma adaptação do Business Model Canvas focada em startups
# e projetos em estágio inicial. Enfatiza validação rápida de hipóteses e iteração.

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
        
        this.editor.setValue(lmcExampleCode);
        
        // Atualizar aba ativa se o sistema de abas estiver inicializado
        if (this.activeCodeTabId && this.codeTabs.has(this.activeCodeTabId)) {
            const activeTab = this.codeTabs.get(this.activeCodeTabId);
            activeTab.content = lmcExampleCode;
            this.saveCodeTabs();
        }
        
        this.render();
    }

    loadLMCExampleReadOnly() {
        const lmcExampleCode = `# LEAN MODEL CANVAS (LMC) - EXEMPLO EXPLICATIVO
#
# O Lean Model Canvas é uma adaptação do Business Model Canvas focada em startups
# e empresas em estágio inicial. É mais ágil e voltado para validação de hipóteses.

lmc
title: Uber - Plataforma de Transporte
description: Aplicativo que conecta passageiros e motoristas para viagens urbanas

# ❗ PROBLEMAS
# Quais são os 3 principais problemas que você resolve?
# Liste os problemas existentes que você pretende resolver.
problem:
  - Dificuldade para encontrar táxi em horários de pico
  - Falta de transparência no preço da corrida
  - Experiência inconsistente com táxis tradicionais
  - Tempo de espera longo para transporte
  - Falta de rastreamento da viagem em tempo real

# ✅ SOLUÇÕES
# Como você resolve cada problema?
# Descreva as principais funcionalidades do seu produto.
solution:
  - App que conecta motoristas e passageiros instantaneamente
  - Preço calculado automaticamente antes da viagem
  - Sistema de avaliação mútua (motorista/passageiro)
  - Localização GPS em tempo real
  - Pagamento digital integrado no app

# 📊 MÉTRICAS-CHAVE
# Quais números mostram que seu negócio está funcionando?
# Como você mede o sucesso?
key-metrics:
  - Número de viagens completadas por dia
  - Tempo médio de espera do passageiro
  - Taxa de retenção de motoristas
  - Avaliação média dos usuários (4.5+ estrelas)
  - Receita por viagem (take rate)
  - Crescimento mensal de usuários ativos

# 🎯 PROPOSTA DE VALOR ÚNICA
# Por que você é diferente e vale a pena comprar?
# O que torna você especial?
unique-value-proposition:
  - "Transporte confiável ao toque de um botão"
  - Conveniência: solicitar carro pelo app
  - Transparência: preço conhecido antecipadamente
  - Segurança: rastreamento e identificação do motorista
  - Qualidade: sistema de avaliações garante bom serviço

# 🚀 VANTAGEM INJUSTA
# O que você tem que não pode ser facilmente copiado?
# Qual sua proteção contra a concorrência?
unfair-advantage:
  - Efeito de rede: mais motoristas atraem mais passageiros
  - Algoritmos de otimização de rotas e preços
  - Marca global reconhecida
  - Capital massivo para expansão agressiva
  - Dados históricos de milhões de viagens
  - Parcerias estratégicas estabelecidas

# 📢 CANAIS
# Como você alcança seus clientes?
# Quais canais funcionam melhor?
channels:
  - App stores (iOS e Android)
  - Marketing digital (Google, Facebook)
  - Boca a boca e indicações
  - Parcerias com empresas
  - Presença em aeroportos e eventos
  - Campanhas de marketing local

# 👥 SEGMENTOS DE CLIENTES
# Quem são seus clientes?
# Para quem você cria valor?
customer-segments:
  - Profissionais urbanos (25-45 anos)
  - Viajantes e turistas
  - Pessoas sem carro próprio
  - Usuários que evitam dirigir (álcool, cansaço)
  - Empresas que precisam de transporte para funcionários

# 💸 ESTRUTURA DE CUSTOS
# Quais são seus maiores custos?
# O que é mais caro no seu modelo de negócio?
cost-structure:
  - Incentivos e bonificações para motoristas
  - Desenvolvimento e manutenção da plataforma
  - Marketing e aquisição de usuários
  - Operações locais e suporte
  - Seguros e questões legais/regulatórias
  - Processamento de pagamentos

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
        
        // Apenas carregar no editor, sem afetar as abas do usuário
        this.editor.setValue(lmcExampleCode);
        this.render();
    }

    debounceRender() {
        clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => {
            this.render();
        }, 300);
    }

    render() {
        if (this.isRendering) return;
        
        this.isRendering = true;
        this.updateStatus('Rendering...');
        
        try {
            const code = this.editor.getValue();
            const data = this.parser.parse(code);
            this.renderer.render(data);
            this.updateCanvasTab(data.canvasType || 'bmc');
            this.updateStatus(i18n.t('ready'));
        } catch (error) {
            console.error('Rendering error:', error);
            this.showError('Error rendering canvas: ' + error.message);
        } finally {
            this.isRendering = false;
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('statusText');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateCursorPosition(position) {
        const cursorElement = document.getElementById('cursorPosition');
        if (cursorElement) {
            cursorElement.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
        }
    }

    showError(message) {
        this.updateStatus(`Error: ${message}`);
        console.error(message);
    }

    downloadPNG() {
        const link = document.createElement('a');
        link.download = 'business-model-canvas.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    exportCanvas() {
        this.downloadPNG();
    }

    shareCanvas() {
        if (navigator.share) {
            this.canvas.toBlob((blob) => {
                const file = new File([blob], 'business-model-canvas.png', { type: 'image/png' });
                navigator.share({
                    title: 'Business Model Canvas',
                    text: 'Check out my Business Model Canvas',
                    files: [file]
                });
            });
        } else {
            // Fallback: copy to clipboard
            this.canvas.toBlob((blob) => {
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                this.updateStatus('Canvas copied to clipboard');
            });
        }
    }

    // Project UI functions
    downloadMarkdownFile() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.updateStatus('Nenhum conteúdo para salvar');
            return;
        }

        // Determinar nome do arquivo baseado no tipo de canvas e nome da aba
        const canvasType = this.detectCanvasType(code);
        const activeTab = this.codeTabs.get(this.activeCodeTabId);
        const tabName = activeTab ? activeTab.name : 'canvas';
        
        // Limpar nome do arquivo (remover caracteres especiais)
        const cleanName = tabName.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
        const fileName = `${cleanName}_${canvasType}.md`;

        // Criar blob e download
        const blob = new Blob([code], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.updateStatus(`📄 Arquivo ${fileName} baixado com sucesso!`);
    }

    loadMarkdownFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                
                // Extrair nome do arquivo sem extensão para nome da aba
                const fileName = file.name.replace(/\.[^/.]+$/, "");
                const cleanName = fileName.replace(/_/g, ' ');
                
                // Criar nova aba com o conteúdo carregado
                this.createCodeTab(cleanName, content, true);
                
                // Atualizar editor
                this.editor.setValue(content);
                this.render();
                
                this.updateStatus(`📂 Arquivo ${file.name} carregado com sucesso!`);
            };
            
            reader.onerror = () => {
                this.updateStatus('❌ Erro ao carregar arquivo');
            };
            
            reader.readAsText(file);
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    loadProjectByName(name) {
        const project = this.loadProject(name);
        if (project) {
            // Switch to code tab
            this.switchTab('code');
            
            // Load project code
            this.userCode = project.code;
            this.editor.setValue(project.code);
            
            // Save as current code
            this.saveUserCode(project.code);
            
            // Render
            this.render();
            
            this.updateStatus(`Projeto "${name}" carregado com sucesso!`);
            console.log(`Loaded project: ${name}`);
        } else {
            this.updateStatus('Erro ao carregar projeto');
        }
    }

    exportProject() {
        const projectData = {
            code: this.editor.getValue(),
            zoom: this.zoomLevel,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'bmc-project.json';
        link.href = URL.createObjectURL(blob);
        link.click();
        
        this.updateStatus('Project exported');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BMCApp();
}); 