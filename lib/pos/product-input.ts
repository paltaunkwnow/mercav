import { z } from "zod";
import { Prisma } from "@prisma/client";

const optionalCode = z
  .string()
  .max(64)
  .nullish()
  .transform((v) => v?.trim() || null);

const money = z.coerce.number().min(0).max(1_000_000_000);

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullish().transform((v) => v?.trim() || null),
  price: money,
  costPrice: money.default(0),
  stock: z.coerce.number().min(0).max(10_000_000).default(0),
  sku: optionalCode,
  barcode: optionalCode,
  unit: z.enum(["UNIT", "KG", "G", "L", "M"]).default("UNIT"),
  trackStock: z.boolean().default(true),
  taxRate: z
    .union([z.literal(""), z.null(), z.coerce.number().min(0).max(100)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  imageUrl: z.string().max(2000).nullish().transform((v) => v || null),
  categoryId: z.string().nullish().transform((v) => v || null),
  isActive: z.boolean().default(true),
  isKosher: z.boolean().default(false),
  isHalal: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  // Low-stock alert threshold. Empty means "no alert".
  minStock: z
    .union([z.literal(""), z.null(), z.coerce.number().min(0).max(10_000_000)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  // Mercav Kosher stock category this product is published under. Empty means "don't publish".
  kosherCategory: z
    .union([z.literal(""), z.null(), z.enum(["meat", "wine", "matzah", "cheese", "frozen", "bakery"])])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function isUniqueCodeError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
