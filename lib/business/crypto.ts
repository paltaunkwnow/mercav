import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Cifrado de campos sensibles de Business (CI y cuenta bancaria) con AES-256-GCM.
 * Clave: BUSINESS_DATA_KEY (base64, 32 bytes). En producción es obligatoria. En desarrollo, si falta,
 * se deriva de NEXTAUTH_SECRET para no frenar el trabajo local (cambiar NEXTAUTH_SECRET deja ilegibles
 * esos datos locales).
 * Formato guardado: v1:<iv>:<tag>:<cifrado>, todo en base64.
 */

let cachedKey: Buffer | null = null;
let warned = false;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.BUSINESS_DATA_KEY?.trim();
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) throw new Error("BUSINESS_DATA_KEY tiene que ser 32 bytes en base64.");
    cachedKey = buf;
    return buf;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta BUSINESS_DATA_KEY: no se pueden cifrar datos de trabajadores.");
  }
  const secret = process.env.NEXTAUTH_SECRET || "mercav-dev-only";
  if (!warned) {
    console.warn("[business] BUSINESS_DATA_KEY no está definida: usando una clave derivada solo para desarrollo.");
    warned = true;
  }
  cachedKey = createHash("sha256").update(`mercav-business:${secret}`).digest();
  return cachedKey;
}

export function encryptField(plain: string | null | undefined): string | null {
  const value = plain?.trim();
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`;
}

export function decryptField(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"), { authTagLength: 16 });
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Para mostrar sin revelar: ••••5678. */
export function maskTail(value: string | null, visible = 4) {
  if (!value) return null;
  return value.length <= visible ? value : `${"•".repeat(4)}${value.slice(-visible)}`;
}
// creado por pato dev y askforvini
