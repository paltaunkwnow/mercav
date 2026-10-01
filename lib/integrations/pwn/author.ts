export function normalizeAuthor(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/@/g, "")
    .replace(/[_./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value.length < 2 || value.length > 80) return null;
  if (/^(?:admin|administrator|moderator|mod|staff|anonymous|anon|guest|unknown|n\/a|null|undefined)$/i.test(value)) {
    return null;
  }
  return value.slice(0, 80);
}

export function authorKey(author: string): string {
  return author
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 80);
}
