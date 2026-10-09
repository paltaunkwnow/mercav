import { contrastRatio, resolvePalette } from "@/lib/business/loyalty/templates";
import type { LoyaltyDesign } from "@/lib/business/loyalty/types";
import { toPng } from "./images";
import { qrDataUrl } from "./qr";

/** Cartel A5 para el mostrador, en el navegador (jsPDF y qrcode se cargan recién al usarlo). */

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export type PosterInput = {
  businessName: string;
  programName: string;
  rewardLine: string;
  welcomeLine?: string | null;
  url: string;
  design: LoyaltyDesign;
  fileName: string;
};

export async function downloadPoster(input: PosterInput) {
  const [{ jsPDF }, qr, logo] = await Promise.all([
    import("jspdf"),
    qrDataUrl(input.url, 1024),
    input.design.logoDataUrl ? toPng(input.design.logoDataUrl, 512) : Promise.resolve(null),
  ]);
  const palette = resolvePalette(input.design);
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
  const W = 148;
  const H = 210;
  const cx = W / 2;
  const ink: [number, number, number] = [26, 23, 20];
  const soft: [number, number, number] = [96, 88, 78];
  // Para el marco del QR sobre blanco: el color de la paleta que más se distinga del blanco.
  const frame = contrastRatio(palette.accent, "#ffffff") >= contrastRatio(palette.base, "#ffffff") ? palette.accent : palette.base;

  doc.setProperties({ title: `${input.businessName} · ${input.programName}`, creator: "Mercav" });

  // Banda superior con la paleta del programa.
  const band = 64;
  doc.setFillColor(...rgb(palette.base));
  doc.rect(0, 0, W, band, "F");
  doc.setFillColor(...rgb(palette.accent));
  doc.rect(0, band - 1.2, W, 1.2, "F");

  let y = 16;
  if (logo) {
    const box = 22;
    const scale = Math.min(box / logo.width, box / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    doc.addImage(logo.png, "PNG", cx - w / 2, y + (box - h) / 2, w, h);
    y += box + 9;
  } else {
    y = 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...rgb(palette.text));
  let size = 24;
  doc.setFontSize(size);
  while (size > 13 && doc.getTextWidth(input.businessName) > W - 24) {
    size -= 1;
    doc.setFontSize(size);
  }
  const nameLines = (doc.splitTextToSize(input.businessName, W - 24) as string[]).slice(0, 2);
  doc.text(nameLines, cx, y, { align: "center" });
  y += (nameLines.length - 1) * size * 0.42 + 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...rgb(palette.accent));
  doc.text(input.programName, cx, Math.min(y, band - 6), { align: "center" });

  // Llamado y premio.
  y = band + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(...ink);
  doc.text("Sumate a nuestro club", cx, y, { align: "center" });
  y += 8.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...soft);
  const copy = [input.rewardLine, input.welcomeLine].filter(Boolean).join(" ");
  const lines = (doc.splitTextToSize(copy, W - 30) as string[]).slice(0, 3);
  doc.text(lines, cx, y, { align: "center" });
  y += (lines.length - 1) * 5.2 + 6;

  // QR grande con marco.
  const qrSize = lines.length > 2 ? 68 : 74;
  doc.setDrawColor(...rgb(frame));
  doc.setLineWidth(0.7);
  doc.roundedRect(cx - qrSize / 2 - 4, y - 4, qrSize + 8, qrSize + 8, 4, 4, "S");
  doc.addImage(qr, "PNG", cx - qrSize / 2, y, qrSize, qrSize);
  y += qrSize + 13;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text("Escaneá con la cámara de tu celular", cx, y, { align: "center" });
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...soft);
  doc.text("Sin descargar ninguna app. Es gratis.", cx, y, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(150, 142, 130);
  doc.text("Powered by mercav.lat", cx, H - 5, { align: "center" });

  doc.save(input.fileName);
}
// creado por pato dev y askforvini
