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
                'save': 'Save',
                'code': 'Code',
                'zoom-out': 'Zoom Out',
                'zoom-in': 'Zoom In',
                'fit-screen': 'Fit to Screen'
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
                'save': 'Salvar',
                'code': 'Código',
                'zoom-out': 'Reduzir',
                'zoom-in': 'Ampliar',
                'fit-screen': 'Ajustar à Tela'
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
                'save': 'Guardar',
                'code': 'Código',
                'zoom-out': 'Reducir',
                'zoom-in': 'Ampliar',
                'fit-screen': 'Ajustar a Pantalla'
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