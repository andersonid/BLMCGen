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
        
        this.init();
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
            
            // Load example content
            this.loadExample();
            
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
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
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
        
        this.editor.setValue(exampleCode);
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