type TranslationKey = string;

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    "key-partnerships": "KEY PARTNERS",
    "key-activities": "KEY ACTIVITIES",
    "key-resources": "KEY RESOURCES",
    "value-propositions": "VALUE PROPOSITIONS",
    "customer-relationships": "CUSTOMER RELATIONSHIPS",
    channels: "CHANNELS",
    "customer-segments": "CUSTOMER SEGMENTS",
    "cost-structure": "COST STRUCTURE",
    "revenue-streams": "REVENUE STREAMS",
    problem: "PROBLEM",
    solution: "SOLUTION",
    "unique-value-proposition": "UNIQUE VALUE PROPOSITION",
    "unfair-advantage": "UNFAIR ADVANTAGE",
    "key-metrics": "KEY METRICS",
    "write-here": "Write here",
    "business-model-canvas": "Business Model Canvas",
    "lean-model-canvas": "Lean Model Canvas",
  },
  pt: {
    "key-partnerships": "PARCERIAS-CHAVE",
    "key-activities": "ATIVIDADES-CHAVE",
    "key-resources": "RECURSOS-CHAVE",
    "value-propositions": "PROPOSIÇÕES DE VALOR",
    "customer-relationships": "RELACIONAMENTO COM CLIENTES",
    channels: "CANAIS",
    "customer-segments": "SEGMENTOS DE CLIENTES",
    "cost-structure": "ESTRUTURA DE CUSTOS",
    "revenue-streams": "FONTES DE RECEITA",
    problem: "PROBLEMA",
    solution: "SOLUÇÃO",
    "unique-value-proposition": "PROPOSTA ÚNICA DE VALOR",
    "unfair-advantage": "VANTAGEM COMPETITIVA",
    "key-metrics": "MÉTRICAS-CHAVE",
    "write-here": "Escreva aqui",
    "business-model-canvas": "Business Model Canvas",
    "lean-model-canvas": "Lean Model Canvas",
  },
  es: {
    "key-partnerships": "SOCIOS CLAVE",
    "key-activities": "ACTIVIDADES CLAVE",
    "key-resources": "RECURSOS CLAVE",
    "value-propositions": "PROPUESTAS DE VALOR",
    "customer-relationships": "RELACIONES CON CLIENTES",
    channels: "CANALES",
    "customer-segments": "SEGMENTOS DE CLIENTES",
    "cost-structure": "ESTRUCTURA DE COSTOS",
    "revenue-streams": "FUENTES DE INGRESOS",
    problem: "PROBLEMA",
    solution: "SOLUCIÓN",
    "unique-value-proposition": "PROPUESTA ÚNICA DE VALOR",
    "unfair-advantage": "VENTAJA COMPETITIVA",
    "key-metrics": "MÉTRICAS CLAVE",
    "write-here": "Escriba aquí",
    "business-model-canvas": "Business Model Canvas",
    "lean-model-canvas": "Lean Model Canvas",
  },
};

let currentLanguage = "en";

export function initLanguage() {
  const saved = localStorage.getItem("bmcLanguage");
  if (saved && translations[saved]) {
    currentLanguage = saved;
  } else {
    const browser = navigator.language.slice(0, 2);
    if (translations[browser]) currentLanguage = browser;
  }
}

export function setLanguage(lang: string) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem("bmcLanguage", lang);
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key: string): string {
  return translations[currentLanguage]?.[key] ?? translations.en?.[key] ?? key;
}

export function getAvailableLanguages() {
  return Object.keys(translations);
}

initLanguage();
