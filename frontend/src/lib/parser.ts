export interface CanvasData {
  title: string;
  description: string;
  sections: Record<string, string[]>;
  canvasType: "bmc" | "lmc";
}

const BMC_SECTIONS = [
  "customer-segments",
  "value-propositions",
  "channels",
  "customer-relationships",
  "revenue-streams",
  "key-resources",
  "key-activities",
  "key-partnerships",
  "cost-structure",
] as const;

const LMC_SECTIONS = [
  "problem",
  "solution",
  "unique-value-proposition",
  "unfair-advantage",
  "customer-segments",
  "key-metrics",
  "channels",
  "cost-structure",
  "revenue-streams",
] as const;

const ALL_SECTIONS = [...new Set([...BMC_SECTIONS, ...LMC_SECTIONS])];

function detectCanvasType(
  sections: Record<string, string[]>,
): "bmc" | "lmc" {
  const used = Object.keys(sections).filter(
    (s) => sections[s] && sections[s].length > 0,
  );

  const lmcOnly = [
    "problem",
    "solution",
    "unique-value-proposition",
    "unfair-advantage",
    "key-metrics",
  ];
  const bmcOnly = [
    "value-propositions",
    "customer-relationships",
    "key-resources",
    "key-activities",
    "key-partnerships",
  ];

  const hasLmc = used.some((s) => lmcOnly.includes(s));
  const hasBmc = used.some((s) => bmcOnly.includes(s));
  const lmcScore = used.filter((s) =>
    (LMC_SECTIONS as readonly string[]).includes(s),
  ).length;
  const bmcScore = used.filter((s) =>
    (BMC_SECTIONS as readonly string[]).includes(s),
  ).length;

  if (hasLmc || (lmcScore > bmcScore && !hasBmc)) return "lmc";
  return "bmc";
}

export function parse(code: string): CanvasData {
  const lines = code.split("\n");
  const result: CanvasData = {
    title: "",
    description: "",
    sections: {},
    canvasType: "bmc",
  };

  ALL_SECTIONS.forEach((s) => (result.sections[s] = []));

  let currentSection: string | null = null;
  let isInCanvas = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line === "bmc" || line === "lmc") {
      isInCanvas = true;
      continue;
    }
    if (!isInCanvas) continue;

    if (line.startsWith("title:")) {
      result.title = line.substring(6).trim();
      continue;
    }
    if (line.startsWith("description:")) {
      result.description = line.substring(12).trim();
      continue;
    }

    if (line.endsWith(":") && (ALL_SECTIONS as readonly string[]).includes(line.slice(0, -1))) {
      currentSection = line.slice(0, -1);
      continue;
    }

    if (currentSection && (line.startsWith("- ") || line.startsWith("* "))) {
      const item = line.substring(2).trim();
      if (item) result.sections[currentSection].push(item);
    }
  }

  result.canvasType = detectCanvasType(result.sections);
  return result;
}

export function format(code: string): string {
  try {
    const data = parse(code);
    let out = `${data.canvasType}\n`;
    if (data.title) out += `title: ${data.title}\n`;
    if (data.description) out += `description: ${data.description}\n`;
    out += "\n";

    const order =
      data.canvasType === "lmc" ? LMC_SECTIONS : BMC_SECTIONS;
    for (const s of order) {
      if (data.sections[s]?.length) {
        out += `${s}:\n`;
        for (const item of data.sections[s]) out += `  - ${item}\n`;
        out += "\n";
      }
    }
    return out;
  } catch {
    return code;
  }
}

export function validate(code: string) {
  try {
    const data = parse(code);
    const errors: string[] = [];
    const hasContent = ALL_SECTIONS.some(
      (s) => data.sections[s]?.length > 0,
    );
    if (!hasContent) errors.push("At least one section must have content");
    return { valid: errors.length === 0, errors, data };
  } catch (e) {
    return {
      valid: false,
      errors: [(e as Error).message],
      data: null,
    };
  }
}

export function getTemplate(type: "bmc" | "lmc" = "bmc"): string {
  if (type === "lmc") {
    return `lmc
title: Meu Modelo Lean
description: Descrição do modelo lean

problem:
  - Problema 1
  - Problema 2

solution:
  - Solução 1
  - Solução 2

unique-value-proposition:
  - Proposta única de valor

unfair-advantage:
  - Vantagem competitiva 1

customer-segments:
  - Segmento de cliente 1

key-metrics:
  - Métrica-chave 1

channels:
  - Canal 1

cost-structure:
  - Custo 1

revenue-streams:
  - Fonte de receita 1`;
  }

  return `bmc
title: Meu Modelo de Negócio
description: Descrição do modelo de negócio

customer-segments:
  - Segmento de cliente 1

value-propositions:
  - Proposta de valor 1

channels:
  - Canal 1

customer-relationships:
  - Tipo de relacionamento 1

revenue-streams:
  - Fonte de receita 1

key-resources:
  - Recurso-chave 1

key-activities:
  - Atividade-chave 1

key-partnerships:
  - Parceria-chave 1

cost-structure:
  - Custo 1`;
}

export function extractCanvasFromText(text: string): string | null {
  const re = /```(?:canvas|bmc|lmc)?\s*\n([\s\S]*?)```/g;
  let last: string | null = null;
  let match;
  while ((match = re.exec(text)) !== null) {
    const md = match[1].trim();
    if (/^(bmc|lmc)\b/.test(md)) last = md;
  }
  return last;
}
