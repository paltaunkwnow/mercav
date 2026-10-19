import { z } from "zod";

export const mailId = z.string().min(1).max(255).regex(/^[A-Za-z0-9_-]+$/);
export const emailAddress = z.string().trim().toLowerCase().email().max(254);
export const corporateEmail = emailAddress.refine((value) => value.endsWith("@mercav.lat"), "Solo correos Mercav.");
export const attachmentSchema = z.object({ blobId: mailId, name: z.string().min(1).max(255), type: z.string().max(100), size: z.number().int().min(0).max(10 * 1024 * 1024) });
export const composeSchema = z.object({
  to: z.array(emailAddress).max(50).default([]), cc: z.array(emailAddress).max(50).default([]), bcc: z.array(emailAddress).max(50).default([]),
  subject: z.string().max(998).refine((value) => !/[\r\n]/.test(value)), text: z.string().max(200_000),
  draft: z.boolean().default(false), draftId: mailId.optional(), attachments: z.array(attachmentSchema).max(10).default([]), confirmExternal: z.boolean().default(false),
}).refine((value) => value.draft || value.to.length + value.cc.length + value.bcc.length > 0, "Agregá un destinatario.")
  .refine((value) => value.to.length + value.cc.length + value.bcc.length <= 50, "Demasiados destinatarios.")
  .refine((value) => value.attachments.reduce((sum, item) => sum + item.size, 0) <= 20 * 1024 * 1024, "Demasiados adjuntos.");
