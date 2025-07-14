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
        this.saveTimeout = null;
        
        this.init();
    }

    // LocalStorage functions for code persistence
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

    debounceSave() {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set new timeout to save after 1 second of inactivity
        this.saveTimeout = setTimeout(() => {
            if (this.currentTab === 'code') {
                const currentCode = this.editor.getValue();
                this.userCode = currentCode;
                this.saveUserCode(currentCode);
                console.log('Auto-saved user code to localStorage');
            }
        }, 1000);
    }

    loadInitialContent() {
        // Try to load saved user code first
        const savedCode = this.loadUserCode();
        
        if (savedCode && savedCode.trim() !== '') {
            // Load saved code
            this.userCode = savedCode;
            this.editor.setValue(savedCode);
            console.log('Loaded saved user code from localStorage');
        } else {
            // Load default example if no saved code
            this.loadExample();
            console.log('Loaded default example content');
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
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveProject();
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
        if (this.currentTab === 'code') {
            this.userCode = this.editor.getValue();
            // Save to localStorage
            this.saveUserCode(this.userCode);
        }
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update current tab
        this.currentTab = tabName;
        
        // Handle tab content switching
        switch(tabName) {
            case 'code':
                // Restore user code and make editor writable
                this.editor.setValue(this.userCode || '');
                this.editor.updateOptions({ readOnly: false });
                break;
            case 'bmc-example':
                // Load BMC example and make editor readonly
                this.loadBMCExample();
                this.editor.updateOptions({ readOnly: true });
                break;
            case 'lmc-example':
                // Load LMC example and make editor readonly
                this.loadLMCExample();
                this.editor.updateOptions({ readOnly: true });
                break;
        }
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

    saveProject() {
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
        
        this.updateStatus('Project saved');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BMCApp();
}); 