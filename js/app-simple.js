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
        
        // Modal de aba
        this.currentTabId = null;
        this.modalMode = null; // 'rename' ou 'create'
        this.modalEventsSetup = false;
        this.clickTimeout = null;
        
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
            
            // Se não há abas, criar uma padrão
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
                window.location.href = 'login.html';
                return;
            }

            console.log('🌐 Checking token with API...');
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.isAuthenticated = true;
                this.user = userData.user;
                this.authToken = token;
                console.log('✅ User authenticated:', this.user.name);
            } else {
                console.log('❌ Token invalid, redirecting to login');
                localStorage.removeItem('bmcgen_auth_token');
                localStorage.removeItem('bmcgen_user');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            localStorage.removeItem('bmcgen_auth_token');
            localStorage.removeItem('bmcgen_user');
            window.location.href = 'login.html';
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
        window.location.href = 'login.html';
    }

    initializeExamples() {
        this.exampleBMC = `bmc
title: Food Delivery Platform
description: A platform connecting restaurants with customers for food delivery
customer-segments:
  - Busy professionals
  - Families with children
  - Students
  - Elderly people
value-propositions:
  - Convenient food delivery
  - Wide restaurant selection
  - Real-time tracking
  - Multiple payment options
channels:
  - Mobile app
  - Website
  - Social media
  - Partner restaurants
customer-relationships:
  - Self-service platform
  - Customer support
  - Loyalty programs
  - Feedback system
revenue-streams:
  - Delivery fees
  - Commission from restaurants
  - Premium subscriptions
  - Advertising
key-resources:
  - Technology platform
  - Delivery network
  - Restaurant partnerships
  - Customer data
key-activities:
  - Platform development
  - Order processing
  - Delivery coordination
  - Customer support
key-partnerships:
  - Restaurants
  - Delivery drivers
  - Payment processors
  - Technology providers
cost-structure:
  - Technology development
  - Marketing
  - Operations
  - Customer support`;

        this.exampleLMC = `lmc
title: Uber
description: Ride-sharing platform connecting drivers with passengers
problem:
  - Expensive taxi services
  - Limited availability
  - Poor user experience
  - Lack of transparency
solution:
  - On-demand ride sharing
  - Real-time tracking
  - Transparent pricing
  - Rating system
unique-value-proposition:
  - Affordable transportation
  - Convenient booking
  - Reliable service
  - Safety features
unfair-advantage:
  - Network effects
  - Brand recognition
  - Technology platform
  - Driver network
customer-segments:
  - Urban commuters
  - Business travelers
  - Event attendees
  - Late-night users
key-metrics:
  - Rides per day
  - Driver utilization
  - Customer satisfaction
  - Revenue per ride
channels:
  - Mobile app
  - Website
  - Referral program
  - Partnerships
cost-structure:
  - Driver payments
  - Technology costs
  - Marketing
  - Operations
revenue-streams:
  - Commission from rides
  - Surge pricing
  - Premium services
  - Advertising`;
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
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
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

        // Botões de exemplo
        document.getElementById('bmcExampleBtn').addEventListener('click', () => this.loadBMCExample());
        document.getElementById('lmcExampleBtn').addEventListener('click', () => this.loadLMCExample());

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
            this.autoSave();
        }
    }

    loadLMCExample() {
        if (this.editor) {
            this.editor.setValue(this.exampleLMC);
            this.autoSave();
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
