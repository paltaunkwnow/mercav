/**
 * Branded PDF export for Mercav Tools. jsPDF is loaded on demand so it never weighs on the catalog bundle.
 * Every page gets the same header ("Mercav" + tool name) and footer (page number + "Generado con Mercav Tools").
 */

export type PdfBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string; serif?: boolean; bold?: boolean; muted?: boolean }
  /** Two-column label/value list. */
  | { type: "rows"; rows: Array<[string, string]> }
  /** Highlighted figure, e.g. the ROI or the suggested hourly rate. */
  | { type: "highlight"; label: string; value: string; note?: string }
  /** Bulleted item with an optional tag (e.g. "Corregir", "Mejorar"). */
  | { type: "item"; title: string; text?: string; tag?: string }
  /** Boxed caution text, e.g. "no es asesoramiento legal". */
  | { type: "notice"; text: string }
  | { type: "spacer"; size?: number };

export type BrandedPdf = {
  toolName: string;
  title: string;
  subtitle?: string;
  blocks: PdfBlock[];
  fileName: string;
  /** Pie de página. Por defecto "Generado con Mercav Tools · mercav.lat". */
  footer?: string;
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 30;
const BOTTOM = PAGE_H - 22;

const INK: [number, number, number] = [28, 28, 28];
const MUTED: [number, number, number] = [96, 96, 96];
const FAINT: [number, number, number] = [150, 150, 150];
const GOLD: [number, number, number] = [160, 122, 20]; // --gold light (#A07A14): legible on white
const HAIRLINE: [number, number, number] = [222, 222, 222];

const PT_TO_MM = 0.3528;
const lineHeight = (size: number, leading = 1.45) => size * PT_TO_MM * leading;

export function formatLongDate(date: Date | string | number = new Date()) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(date));
}

export function safeFileName(value: string, fallback = "mercav") {
  const base = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || fallback;
}

/** jsPDF's built-in fonts are WinAnsi: replace the few characters they cannot draw. */
function clean(text: string) {
  return String(text ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, "");
}

export async function downloadBrandedPdf({ toolName, title, subtitle, blocks, fileName, footer = "Generado con Mercav Tools · mercav.lat" }: BrandedPdf) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = formatLongDate();

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text("Mercav", MARGIN, 16);
    doc.setFillColor(...GOLD);
    doc.circle(MARGIN + doc.getTextWidth("Mercav") + 1.6, 15.1, 0.7, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(clean(toolName), PAGE_W - MARGIN, 16, { align: "right" });
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, 20, PAGE_W - MARGIN, 20);
  };

  let y = TOP;
  const newPage = () => {
    doc.addPage();
    drawHeader();
    y = TOP;
  };
  const ensure = (space: number) => {
    if (y + space > BOTTOM) newPage();
  };

  /** Writes wrapped text line by line, breaking pages as needed. */
  const writeLines = (text: string, opts: { size: number; style?: "normal" | "bold" | "italic"; font?: "helvetica" | "times"; color?: [number, number, number]; x?: number; width?: number; leading?: number }) => {
    const { size, style = "normal", font = "helvetica", color = INK, x = MARGIN, width = CONTENT_W, leading = 1.45 } = opts;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lh = lineHeight(size, leading);
    const lines: string[] = doc.splitTextToSize(clean(text), width);
    for (const line of lines) {
      ensure(lh);
      doc.setFont(font, style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(line, x, y + lh * 0.75);
      y += lh;
    }
  };

  // Cover block on page 1
  drawHeader();
  writeLines(title, { size: 20, style: "bold", leading: 1.25 });
  y += 1.5;
  if (subtitle) {
    writeLines(subtitle, { size: 10.5, color: MUTED });
    y += 0.5;
  }
  writeLines(`Generado el ${generatedAt}`, { size: 9, color: FAINT });
  y += 7;

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        ensure(16);
        y += 3;
        writeLines(block.text, { size: 12.5, style: "bold" });
        doc.setDrawColor(...HAIRLINE);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, y + 1, PAGE_W - MARGIN, y + 1);
        y += 5;
        break;
      }
      case "paragraph": {
        writeLines(block.text, {
          size: block.serif ? 11.5 : 10.5,
          font: block.serif ? "times" : "helvetica",
          style: block.bold ? "bold" : "normal",
          color: block.muted ? MUTED : INK,
          leading: block.serif ? 1.5 : 1.45,
        });
        y += 2.5;
        break;
      }
      case "rows": {
        const labelW = 62;
        for (const [label, value] of block.rows) {
          doc.setFontSize(10);
          const labelLines: string[] = doc.splitTextToSize(clean(label), labelW - 4);
          const valueLines: string[] = doc.splitTextToSize(clean(value), CONTENT_W - labelW);
          const lh = lineHeight(10);
          const rowH = Math.max(labelLines.length, valueLines.length) * lh + 3;
          ensure(rowH);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...MUTED);
          doc.text(labelLines, MARGIN, y + lh * 0.75 + 1, { lineHeightFactor: 1.45 });
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...INK);
          doc.text(valueLines, MARGIN + labelW, y + lh * 0.75 + 1, { lineHeightFactor: 1.45 });
          y += rowH;
          doc.setDrawColor(...HAIRLINE);
          doc.setLineWidth(0.15);
          doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        }
        y += 4;
        break;
      }
      case "highlight": {
        const noteLines: string[] = block.note ? (doc.setFontSize(9.5), doc.splitTextToSize(clean(block.note), CONTENT_W - 12)) : [];
        const boxH = 22 + noteLines.length * lineHeight(9.5);
        ensure(boxH + 4);
        doc.setFillColor(250, 246, 234);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.3);
        doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 3, 3, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...MUTED);
        doc.text(clean(block.label), MARGIN + 6, y + 7);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...INK);
        doc.text(clean(block.value), MARGIN + 6, y + 16);
        if (noteLines.length) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...MUTED);
          doc.text(noteLines, MARGIN + 6, y + 22, { lineHeightFactor: 1.45 });
        }
        y += boxH + 6;
        break;
      }
      case "item": {
        ensure(lineHeight(10.5) * 2);
        const startY = y;
        doc.setFillColor(...GOLD);
        doc.circle(MARGIN + 1.2, y + lineHeight(10.5) * 0.5, 0.9, "F");
        const heading = block.tag ? `${block.title}  (${block.tag})` : block.title;
        writeLines(heading, { size: 10.5, style: "bold", x: MARGIN + 5, width: CONTENT_W - 5 });
        if (block.text) writeLines(block.text, { size: 10, color: MUTED, x: MARGIN + 5, width: CONTENT_W - 5 });
        y = Math.max(y, startY) + 3;
        break;
      }
      case "notice": {
        doc.setFontSize(9.5);
        const lines: string[] = doc.splitTextToSize(clean(block.text), CONTENT_W - 10);
        const boxH = lines.length * lineHeight(9.5) + 7;
        ensure(boxH + 3);
        doc.setFillColor(246, 246, 246);
        doc.setDrawColor(...HAIRLINE);
        doc.setLineWidth(0.2);
        doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...MUTED);
        doc.text(lines, MARGIN + 5, y + 5.5, { lineHeightFactor: 1.45 });
        y += boxH + 5;
        break;
      }
      case "spacer":
        y += block.size ?? 4;
        break;
    }
  }

  // Footer on every page, once the page count is known.
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 15, PAGE_W - MARGIN, PAGE_H - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...FAINT);
    doc.text(clean(footer), MARGIN, PAGE_H - 10);
    doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
// creado por pato dev y askforvini
