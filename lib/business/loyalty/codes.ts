import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Identificadores y códigos de Fidelización. Solo servidor. */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const FRIENDLY = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function encode(bytes: Buffer, alphabet: string, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Serial de la tarjeta: 24 caracteres, ~120 bits. Va en el QR y en el link de la tarjeta web. */
export function newSerial() {
  return encode(randomBytes(24), BASE32, 24);
}

/** Carácter de control del código MercavClub (detecta un carácter mal tipeado o dos cambiados de lugar). */
function clubCheck(body: string) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += FRIENDLY.indexOf(body[i]) * (i + 1);
  return FRIENDLY[sum % FRIENDLY.length];
}

/** MercavClub: un código por cuenta, "MC-XXXX-XXXX" + control. 40 bits al azar: no se puede adivinar. */
export function newClubCode() {
  const body = encode(randomBytes(8), FRIENDLY, 8);
  return `MC-${body.slice(0, 4)}-${body.slice(4)}${clubCheck(body)}`;
}

/** Normaliza lo que dicta o tipea el cliente ("mc abcd efgh j") y valida el control. Null si no es un código. */
export function parseClubCode(raw: string) {
  const text = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^MC/, "").replace(/0/g, "O").replace(/1/g, "I");
  if (!/^[A-HJ-NP-Z2-9]{9}$/.test(text)) return null;
  const body = text.slice(0, 8);
  if (clubCheck(body) !== text[8]) return null;
  return `MC-${body.slice(0, 4)}-${body.slice(4)}${text[8]}`;
}

/** Código corto para invitar amigos (sin letras ambiguas). */
export function newReferralCode() {
  return encode(randomBytes(6), FRIENDLY, 6);
}

export function newKioskSecret() {
  return randomBytes(20).toString("base64");
}

export const KIOSK_STEP_SECONDS = 30;

/** Código de 6 dígitos que cambia cada 30 s (HMAC del período), para el QR del mostrador. */
export function kioskCode(secret: string, at: Date, step = KIOSK_STEP_SECONDS) {
  const counter = Math.floor(at.getTime() / 1000 / step);
  const digest = createHmac("sha256", Buffer.from(secret, "base64")).update(String(counter)).digest();
  const value = digest.readUInt32BE(digest[digest.length - 1] & 0x0f) & 0x7fffffff;
  return String(value % 1_000_000).padStart(6, "0");
}

/** Acepta el código actual y el anterior (por si el cliente tardó en escanear). */
export function verifyKioskCode(secret: string, code: string, now: Date, step = KIOSK_STEP_SECONDS) {
  if (!/^\d{6}$/.test(code)) return false;
  for (const offset of [0, -1]) {
    const expected = kioskCode(secret, new Date(now.getTime() + offset * step * 1000), step);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return true;
  }
  return false;
}

/** Saca el serial de lo que leyó el escáner: el link de la tarjeta o el serial solo. */
export function serialFromScan(raw: string) {
  const text = raw.trim();
  const fromUrl = /\/c\/[^/]+\/t\/([A-Z2-7]{24})(?:[/?#]|$)/.exec(text);
  if (fromUrl) return fromUrl[1];
  const bare = text.toUpperCase().replace(/[^A-Z2-7]/g, "");
  return /^[A-Z2-7]{24}$/.test(bare) ? bare : null;
}
// creado por pato dev y askforvini
