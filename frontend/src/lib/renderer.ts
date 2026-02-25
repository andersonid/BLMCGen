import type { CanvasData } from "./parser";
import { t } from "./i18n";

interface Layout {
  margin: number;
  padding: number;
  headerHeight: number;
  fontSize: number;
  headerFontSize: number;
  titleFontSize: number;
  lineHeight: number;
  sectionTitleSize: number;
  iconSize: number;
}

interface SectionDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLORS: Record<string, string> = {
  "key-partnerships": "rgba(255, 159, 67, 0.6)",
  "key-activities": "rgba(116, 102, 204, 0.6)",
  "key-resources": "rgba(106, 176, 139, 0.6)",
  "value-propositions": "rgba(255, 206, 84, 0.6)",
  "customer-relationships": "rgba(129, 207, 224, 0.6)",
  channels: "rgba(255, 195, 160, 0.6)",
  "customer-segments": "rgba(161, 196, 253, 0.6)",
  "cost-structure": "rgba(129, 207, 224, 0.6)",
  "revenue-streams": "rgba(255, 154, 162, 0.6)",
  problem: "rgba(255, 107, 107, 0.6)",
  solution: "rgba(106, 176, 139, 0.6)",
  "unique-value-proposition": "rgba(255, 206, 84, 0.6)",
  "unfair-advantage": "rgba(116, 102, 204, 0.6)",
  "key-metrics": "rgba(129, 207, 224, 0.6)",
};

const ICONS: Record<string, string> = {
  "key-partnerships": "🤝",
  "key-activities": "⚡",
  "key-resources": "🔑",
  "value-propositions": "💡",
  "customer-relationships": "❤️",
  channels: "📱",
  "customer-segments": "👥",
  "cost-structure": "💰",
  "revenue-streams": "💰",
  problem: "❗",
  solution: "💡",
  "unique-value-proposition": "⭐",
  "unfair-advantage": "🏆",
  "key-metrics": "📊",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function getLayout(w: number, h: number): Layout {
  const s = Math.min(w / 1200, h / 800);
  return {
    margin: Math.max(20, 30 * s),
    padding: Math.max(15, 20 * s),
    headerHeight: 80,
    fontSize: Math.max(10, 12 * s),
    headerFontSize: Math.max(14, 18 * s),
    titleFontSize: Math.max(11, 14 * s),
    sectionTitleSize: Math.max(10, 12 * s),
    lineHeight: Math.max(16, 18 * s),
    iconSize: Math.max(12, 16 * s),
  };
}

function getSectionLayout(type: "bmc" | "lmc"): SectionDef[] {
  if (type === "lmc") {
    return [
      { id: "problem", x: 0, y: 0, width: 1, height: 2 },
      { id: "solution", x: 1, y: 0, width: 1, height: 1 },
      { id: "unique-value-proposition", x: 2, y: 0, width: 1, height: 2 },
      { id: "unfair-advantage", x: 3, y: 0, width: 1, height: 1 },
      { id: "customer-segments", x: 4, y: 0, width: 1, height: 2 },
      { id: "key-metrics", x: 1, y: 1, width: 1, height: 1 },
      { id: "channels", x: 3, y: 1, width: 1, height: 1 },
      { id: "cost-structure", x: 0, y: 2, width: 2.5, height: 1 },
      { id: "revenue-streams", x: 2.5, y: 2, width: 2.5, height: 1 },
    ];
  }
  return [
    { id: "key-partnerships", x: 0, y: 0, width: 1, height: 2 },
    { id: "key-activities", x: 1, y: 0, width: 1, height: 1 },
    { id: "value-propositions", x: 2, y: 0, width: 1, height: 2 },
    { id: "customer-relationships", x: 3, y: 0, width: 1, height: 1 },
    { id: "customer-segments", x: 4, y: 0, width: 1, height: 2 },
    { id: "key-resources", x: 1, y: 1, width: 1, height: 1 },
    { id: "channels", x: 3, y: 1, width: 1, height: 1 },
    { id: "cost-structure", x: 0, y: 2, width: 2.5, height: 1 },
    { id: "revenue-streams", x: 2.5, y: 2, width: 2.5, height: 1 },
  ];
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function render(
  canvas: HTMLCanvasElement,
  data: CanvasData,
): void {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const L = getLayout(W, H);

  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(L.margin, L.margin, W - L.margin * 2, L.headerHeight - 10);

  ctx.fillStyle = "#2c3e50";
  ctx.font = `600 ${L.headerFontSize}px ${FONT}`;
  ctx.textAlign = "center";
  const defaultTitle =
    data.canvasType === "lmc"
      ? t("lean-model-canvas")
      : t("business-model-canvas");
  ctx.fillText(data.title || defaultTitle, W / 2, L.margin + 35);

  if (data.description) {
    ctx.fillStyle = "#7f8c8d";
    ctx.font = `400 ${L.titleFontSize}px ${FONT}`;
    ctx.fillText(data.description, W / 2, L.margin + 58);
  }

  // grid
  const gridW = W - L.margin * 2;
  const gridH = H - L.headerHeight - L.margin * 2;
  const secW = gridW / 5;
  const secH = gridH / 3;
  const startX = L.margin;
  const startY = L.headerHeight + L.margin;

  const sections = getSectionLayout(data.canvasType);

  for (const sec of sections) {
    const x = startX + sec.x * secW;
    const y = startY + sec.y * secH;
    const w = secW * sec.width;
    const h = secH * sec.height;
    const items = data.sections[sec.id] ?? [];

    // bg
    ctx.fillStyle = COLORS[sec.id] ?? "rgba(248,249,250,0.6)";
    ctx.fillRect(x, y, w, h);

    // border
    ctx.strokeStyle = "rgba(52,73,94,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // icon
    const icon = ICONS[sec.id];
    if (icon) {
      ctx.fillStyle = "#34495e";
      ctx.font = `${L.iconSize}px Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, x + L.padding, y + L.padding + L.sectionTitleSize / 2);
    }

    // title
    const titleStartX = x + L.padding + (icon ? L.iconSize + 8 : 0);
    const titleMaxW = w - L.padding * 2 - (icon ? L.iconSize + 8 : 0);
    const titleFont = `700 ${L.sectionTitleSize}px ${FONT}`;
    ctx.fillStyle = "#34495e";
    ctx.font = titleFont;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const sectionTitle = t(sec.id);
    const titleLines = wrapText(ctx, sectionTitle, titleMaxW, titleFont);
    titleLines.forEach((line, i) => {
      ctx.fillText(
        line,
        titleStartX,
        y + L.padding + L.sectionTitleSize + i * (L.sectionTitleSize + 2),
      );
    });

    const titleH = titleLines.length * (L.sectionTitleSize + 2) - 2;

    if (items.length === 0) {
      ctx.fillStyle = "rgba(149,165,166,0.7)";
      ctx.font = `400 ${L.fontSize}px ${FONT}`;
      ctx.fillText(t("write-here"), x + L.padding, y + L.padding + titleH + 25);
    }

    // items
    const itemFont = `400 ${L.fontSize}px ${FONT}`;
    let itemY = y + L.padding + titleH + 25;
    const maxW = w - L.padding * 2;

    for (const item of items) {
      if (itemY + L.lineHeight > y + h - L.padding) break;

      ctx.fillStyle = "#34495e";
      ctx.beginPath();
      ctx.arc(x + L.padding + 6, itemY - 4, 1.5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#2c3e50";
      const lines = wrapText(ctx, item, maxW - 20, itemFont);
      for (const line of lines) {
        if (itemY + L.lineHeight > y + h - L.padding) break;
        ctx.font = itemFont;
        ctx.fillText(line, x + L.padding + 18, itemY);
        itemY += L.lineHeight;
      }
      itemY += 4;
    }
  }
}

export function exportPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export async function exportPDF(canvas: HTMLCanvasElement, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  const ratio = canvas.width / canvas.height;
  const pageRatio = maxW / maxH;
  let imgW: number, imgH: number;
  if (ratio > pageRatio) {
    imgW = maxW;
    imgH = maxW / ratio;
  } else {
    imgH = maxH;
    imgW = maxH * ratio;
  }

  const x = (pageW - imgW) / 2;
  const y = (pageH - imgH) / 2;
  pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
  pdf.save(filename);
}
