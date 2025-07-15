// Internationalization (i18n) for BMC Markdown
class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {
            en: {
                // BMC Section Titles
                'key-partnerships': 'KEY PARTNERS',
                'key-activities': 'KEY ACTIVITIES',
                'key-resources': 'KEY RESOURCES',
                'value-propositions': 'VALUE PROPOSITIONS',
                'customer-relationships': 'CUSTOMER RELATIONSHIPS',
                'channels': 'CHANNELS',
                'customer-segments': 'CUSTOMER SEGMENTS',
                'cost-structure': 'COST STRUCTURE',
                'revenue-streams': 'REVENUE STREAMS',
                
                // LMC Section Titles
                'problem': 'PROBLEM',
                'solution': 'SOLUTION',
                'unique-value-proposition': 'UNIQUE VALUE PROPOSITION',
                'unfair-advantage': 'UNFAIR ADVANTAGE',
                'key-metrics': 'KEY METRICS',
                
                // UI Elements
                'write-here': 'Write here',
                'business-model-canvas': 'Business Model Canvas',
                'lean-model-canvas': 'Lean Model Canvas',
                'ready': 'Ready',
                'developed-by': 'Developed by',
                'export': 'Export',
                'share': 'Share',
                'load': 'Load',
                'save': 'Save',
                'code': 'Code',
                'bmc-example': 'BMC Example',
                'lmc-example': 'LMC Example',
                'zoom-out': 'Zoom Out',
                'zoom-in': 'Zoom In',
                'fit-screen': 'Fit to Screen',
                'new-code-tab': 'New code tab',
                'double-click-to-rename': 'Double click to rename',
                'close-tab': 'Close tab',
                'new-tab': 'New Tab',
                'rename-tab': 'Rename Tab',
                'create': 'Create',
                'rename': 'Rename',
                'cancel': 'Cancel',
                'enter-tab-name': 'Enter tab name',
                'enter-new-tab-name': 'Enter new tab name'
            },
            pt: {
                // BMC Section Titles
                'key-partnerships': 'PARCERIAS-CHAVE',
                'key-activities': 'ATIVIDADES-CHAVE',
                'key-resources': 'RECURSOS-CHAVE',
                'value-propositions': 'PROPOSIÇÕES DE VALOR',
                'customer-relationships': 'RELACIONAMENTO COM CLIENTES',
                'channels': 'CANAIS',
                'customer-segments': 'SEGMENTOS DE CLIENTES',
                'cost-structure': 'ESTRUTURA DE CUSTOS',
                'revenue-streams': 'FONTES DE RECEITA',
                
                // LMC Section Titles
                'problem': 'PROBLEMA',
                'solution': 'SOLUÇÃO',
                'unique-value-proposition': 'PROPOSTA ÚNICA DE VALOR',
                'unfair-advantage': 'VANTAGEM COMPETITIVA',
                'key-metrics': 'MÉTRICAS-CHAVE',
                
                // UI Elements
                'write-here': 'Escreva aqui',
                'business-model-canvas': 'Business Model Canvas',
                'lean-model-canvas': 'Lean Model Canvas',
                'ready': 'Pronto',
                'developed-by': 'Desenvolvido por',
                'export': 'Exportar',
                'share': 'Compartilhar',
                'load': 'Carregar',
                'save': 'Salvar',
                'code': 'Código',
                'bmc-example': 'Exemplo BMC',
                'lmc-example': 'Exemplo LMC',
                'zoom-out': 'Reduzir',
                'zoom-in': 'Ampliar',
                'fit-screen': 'Ajustar à Tela',
                'new-code-tab': 'Nova aba de código',
                'double-click-to-rename': 'Clique duplo para renomear',
                'close-tab': 'Fechar aba',
                'new-tab': 'Nova Aba',
                'rename-tab': 'Renomear Aba',
                'create': 'Criar',
                'rename': 'Renomear',
                'cancel': 'Cancelar',
                'enter-tab-name': 'Digite o nome da aba',
                'enter-new-tab-name': 'Digite o nome da nova aba'
            },
            es: {
                // BMC Section Titles
                'key-partnerships': 'SOCIOS CLAVE',
                'key-activities': 'ACTIVIDADES CLAVE',
                'key-resources': 'RECURSOS CLAVE',
                'value-propositions': 'PROPUESTAS DE VALOR',
                'customer-relationships': 'RELACIONES CON CLIENTES',
                'channels': 'CANALES',
                'customer-segments': 'SEGMENTOS DE CLIENTES',
                'cost-structure': 'ESTRUCTURA DE COSTOS',
                'revenue-streams': 'FUENTES DE INGRESOS',
                
                // LMC Section Titles
                'problem': 'PROBLEMA',
                'solution': 'SOLUCIÓN',
                'unique-value-proposition': 'PROPUESTA ÚNICA DE VALOR',
                'unfair-advantage': 'VENTAJA COMPETITIVA',
                'key-metrics': 'MÉTRICAS CLAVE',
                
                // UI Elements
                'write-here': 'Escriba aquí',
                'business-model-canvas': 'Business Model Canvas',
                'lean-model-canvas': 'Lean Model Canvas',
                'ready': 'Listo',
                'developed-by': 'Desarrollado por',
                'export': 'Exportar',
                'share': 'Compartir',
                'load': 'Cargar',
                'save': 'Guardar',
                'code': 'Código',
                'bmc-example': 'Ejemplo BMC',
                'lmc-example': 'Ejemplo LMC',
                'zoom-out': 'Reducir',
                'zoom-in': 'Ampliar',
                'fit-screen': 'Ajustar a Pantalla',
                'new-code-tab': 'Nueva pestaña de código',
                'double-click-to-rename': 'Doble clic para renombrar',
                'close-tab': 'Cerrar pestaña',
                'new-tab': 'Nueva Pestaña',
                'rename-tab': 'Renombrar Pestaña',
                'create': 'Crear',
                'rename': 'Renombrar',
                'cancel': 'Cancelar',
                'enter-tab-name': 'Ingrese el nombre de la pestaña',
                'enter-new-tab-name': 'Ingrese el nombre de la nueva pestaña'
            }
        };
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('bmcLanguage', lang);
        }
    }

    getLanguage() {
        return this.currentLanguage;
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || key;
    }

    t(key) {
        return this.translate(key);
    }

    // Initialize language from localStorage or browser
    init() {
        const savedLanguage = localStorage.getItem('bmcLanguage');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        } else {
            // Try to detect browser language
            const browserLang = navigator.language.slice(0, 2);
            if (this.translations[browserLang]) {
                this.currentLanguage = browserLang;
            }
        }
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Global instance
const i18n = new I18n(); 