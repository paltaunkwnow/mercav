import { formatQuantity, getUnit, orderTypeLabel, paymentMethodLabel } from "@/lib/pos/business";
import { formatMoney } from "@/lib/pos/money";

/** Plain-text ticket for WhatsApp, email and the share sheet. Built from the sale on screen; nothing is stored. */
export function ticketText(sale: any, config: any) {
  const money = (v: unknown) => formatMoney(Number(v ?? 0), config?.currency);
  const date = new Date(sale.createdAt);
  const lines: string[] = [];

  lines.push(config?.shopName || "Mercav POS");
  if (config?.address) lines.push(config.address);
  lines.push("");
  lines.push(`Ticket #${sale.transactionId}`);
  lines.push(`${date.toLocaleDateString("es-419")} ${date.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" })}`);
  if (sale.status === "VOIDED") lines.push("VENTA ANULADA");
  if (sale.pending) lines.push("Pendiente de sincronizar");
  lines.push("");

  for (const item of sale.items ?? []) {
    const unit = item.unit && item.unit !== "UNIT" ? ` / ${getUnit(item.unit).short}` : "";
    lines.push(`${item.productName || item.product?.name || "Producto"}`);
    lines.push(`  ${formatQuantity(item.quantity, item.unit)} x ${money(item.unitPrice)}${unit} = ${money(item.subtotal)}`);
  }

  lines.push("");
  if (Number(sale.discountAmount) > 0) lines.push(`Descuento: -${money(sale.discountAmount)}`);
  if (Number(sale.taxAmount) > 0) lines.push(`${config?.taxName || "IVA"}: ${money(sale.taxAmount)}`);
  lines.push(`TOTAL: ${money(sale.totalAmount)}`);
  for (const p of sale.payments ?? []) lines.push(`${paymentMethodLabel(p.method)}: ${money(p.amount)}`);
  if (Number(sale.changeAmount) > 0) lines.push(`Cambio: ${money(sale.changeAmount)}`);
  if (sale.orderType) lines.push(orderTypeLabel(sale.orderType));
  lines.push("");
  lines.push("Gracias por tu compra.");
  return lines.join("\n");
}

/** wa.me link. The phone is optional and only goes into the URL the customer's device opens. */
export function whatsappUrl(text: string, phone?: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(text: string, subject: string, email?: string) {
  return `mailto:${encodeURIComponent((email ?? "").trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}
// creado por pato dev y askforvini
