/** SHA-1 stays in the browser. Callers must pass only the 5-char prefix to the API. */
export async function sha1Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SECURE_CONTEXT");
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
// creado por pato dev y askforvini
