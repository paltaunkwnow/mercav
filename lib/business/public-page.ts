import { z } from "zod";
import { slugify, isReservedSlug } from "@/lib/business/slug";

export const pageTemplateSchema = z.enum(["PROFILE", "MENU", "SHOWCASE"]);
export const publicPageDraftSchema = z.object({
  template: pageTemplateSchema.default("PROFILE"),
  title: z.string().trim().max(90).default(""),
  description: z.string().trim().max(500).default(""),
  phone: z.string().trim().max(40).default(""),
  whatsapp: z.string().trim().max(40).default(""),
  address: z.string().trim().max(160).default(""),
  hours: z.string().trim().max(300).default(""),
  website: z.string().trim().url().or(z.literal("")).default(""),
  instagram: z.string().trim().max(200).default(""),
  selectedProductIds: z.array(z.string().min(1)).max(500).default([]),
  featuredProductIds: z.array(z.string().min(1)).max(24).default([]),
});
export type PublicPageDraft = z.infer<typeof publicPageDraftSchema>;
export function defaultPublicDraft() { return publicPageDraftSchema.parse({}); }
export function cleanPublicSlug(raw: string) { const slug = slugify(raw); return !isReservedSlug(slug) && !["login", "register", "privacy", "kosher", "api", "inicio"].includes(slug) ? slug : ""; }
export function whatsappHref(raw: string, text: string) { const phone = raw.replace(/\D/g, ""); return phone.length >= 7 ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null; }
