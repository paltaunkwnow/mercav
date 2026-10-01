export type FreshLeakSample = {
  title: string;
  isBolivia?: boolean;
};

export function formatLeakNotice(input: {
  count: number;
  samples?: FreshLeakSample[];
}): { title: string; body: string } | null {
  const count = Math.max(0, Math.floor(input.count));
  if (count < 1) return null;
  const samples = input.samples ?? [];
  const bolivia = samples.filter((item) => item.isBolivia).length;
  const first = samples[0]?.title?.trim();
  const title = count === 1 ? "Nueva filtración" : count > 20 ? "Filtraciones nuevas" : `${count} filtraciones nuevas`;
  let body: string;
  if (count === 1) {
    body = first || "Hay una filtración nueva en el archivo de Pwn.";
  } else if (count > 20) {
    body = first ? `${first} y otras más que no estaban en tu última visita.` : "El archivo de Pwn incorporó filtraciones que no estaban en tu última visita.";
  } else if (first) {
    body = `${first} y ${count - 1} más.`;
  } else {
    body = "El archivo de Pwn acaba de incorporar filtraciones que no estaban.";
  }
  if (bolivia === 1) body += " Una involucra a Bolivia.";
  else if (bolivia > 1) body += ` ${bolivia} involucran a Bolivia.`;
  return { title, body };
}

export function shouldNotifyNewLeaks(input: { priorCount: number; freshCount: number }): boolean {
  return input.priorCount > 0 && input.freshCount > 0;
}
// creado por pato dev y askforvini
