/**
 * Turns HIBP breach blurbs (English HTML) into plain Spanish copy.
 * Applied at display time so older stored rows are covered too.
 */

export type BreachCopyLink = { href: string; label: string };

export type BreachCopy = {
  summary: string | null;
  detail: string | null;
  implication: string | null;
  links: BreachCopyLink[];
};

export type BreachCopyInput = {
  name?: string | null;
  recordCount?: number | null;
  dataTypes?: string[];
  publishedAt?: string | null;
};

const MONTHS: Record<string, string> = {
  january: "enero",
  february: "febrero",
  march: "marzo",
  april: "abril",
  may: "mayo",
  june: "junio",
  july: "julio",
  august: "agosto",
  september: "septiembre",
  october: "octubre",
  november: "noviembre",
  december: "diciembre",
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const DATA_CLASS_LABELS: Record<string, string> = {
  "account balances": "Saldos de cuenta",
  "academic records": "Expedientes académicos",
  "age groups": "Grupos de edad",
  ages: "Edades",
  appointments: "Citas",
  "apps installed on devices": "Aplicaciones instaladas",
  "audio recordings": "Grabaciones de audio",
  "auth tokens": "Tokens de autenticación",
  avatars: "Avatares",
  "bank account numbers": "Números de cuenta bancaria",
  "biometric data": "Datos biométricos",
  "browser user agent details": "User-agent del navegador",
  "buying preferences": "Preferencias de compra",
  "career levels": "Nivel profesional",
  "chat logs": "Registros de chat",
  "citizenship statuses": "Estado de ciudadanía",
  "credit card cvv": "CVV de tarjetas",
  "credit cards": "Tarjetas de crédito",
  "credit status information": "Información crediticia",
  "customer feedback": "Opiniones de clientes",
  "customer interactions": "Interacciones con clientes",
  "dates of birth": "Fechas de nacimiento",
  "device information": "Información del dispositivo",
  "device serial numbers": "Números de serie",
  "device usage tracking data": "Uso del dispositivo",
  "driver's licenses": "Licencias de conducir",
  "eating habits": "Hábitos alimentarios",
  "education levels": "Nivel educativo",
  "email addresses": "Correos electrónicos",
  "email messages": "Correos enviados",
  employers: "Empleadores",
  "employment statuses": "Situación laboral",
  "encrypted keys": "Claves cifradas",
  ethnicities: "Etnia",
  "family members' names": "Nombres de familiares",
  "financial investments": "Inversiones",
  "financial transactions": "Transacciones financieras",
  genders: "Género",
  "geographic locations": "Ubicaciones",
  "government issued ids": "Documentos de identidad",
  "health insurance information": "Seguro de salud",
  "historical passwords": "Contraseñas antiguas",
  "homepage urls": "URLs personales",
  "imei numbers": "IMEI",
  "income levels": "Nivel de ingresos",
  "instant messenger identities": "Identidades de mensajería",
  "ip addresses": "Direcciones IP",
  "job applications": "Candidaturas laborales",
  "job titles": "Cargos",
  "licence plates": "Matrículas",
  "login histories": "Historial de inicios de sesión",
  "mac addresses": "Direcciones MAC",
  "marital statuses": "Estado civil",
  names: "Nombres",
  nationalities: "Nacionalidad",
  nicknames: "Apodos",
  occupations: "Ocupaciones",
  "partial credit card data": "Datos parciales de tarjeta",
  "passport numbers": "Números de pasaporte",
  "password hints": "Pistas de contraseña",
  passwords: "Contraseñas",
  "payment histories": "Historial de pagos",
  "payment methods": "Métodos de pago",
  "personal descriptions": "Descripciones personales",
  "personal health data": "Datos de salud",
  "personal interests": "Intereses personales",
  "phone numbers": "Teléfonos",
  photos: "Fotos",
  "physical addresses": "Direcciones físicas",
  "physical attributes": "Rasgos físicos",
  pins: "PINs",
  "places of birth": "Lugares de nacimiento",
  "political views": "Opinión política",
  "private messages": "Mensajes privados",
  "professional skills": "Competencias profesionales",
  "profile photos": "Fotos de perfil",
  purchases: "Compras",
  "purchasing habits": "Hábitos de compra",
  "recovery email addresses": "Correos de recuperación",
  "relationship statuses": "Estado de relación",
  religions: "Religión",
  salutations: "Saludos",
  "security questions and answers": "Preguntas de seguridad",
  "sexual orientations": "Orientación sexual",
  "sms messages": "SMS",
  "social connections": "Contactos sociales",
  "social media profiles": "Perfiles de redes sociales",
  "social security numbers": "Números de seguridad social",
  "spoken languages": "Idiomas",
  "spouses names": "Nombres de cónyuges",
  "support tickets": "Tickets de soporte",
  "survey results": "Encuestas",
  "taxation records": "Datos fiscales",
  "time zones": "Zonas horarias",
  "travel habits": "Hábitos de viaje",
  "user statuses": "Estado de la cuenta",
  "user website urls": "Sitios web del usuario",
  usernames: "Nombres de usuario",
  "vehicle details": "Datos del vehículo",
  "website activity": "Actividad en el sitio",
  "years of professional experience": "Años de experiencia",
};

const DATA_CLASS_KEYS = Object.keys(DATA_CLASS_LABELS).sort((a, b) => b.length - a.length);

const ACTORS = [
  "ShinyHunters",
  "Scattered Spider",
  "LockBit",
  "ALPHV",
  "BlackCat",
  "Black Basta",
  "Cl0p",
  "Clop",
  "Play",
  "Akira",
  "RansomHub",
  "8Base",
  "BianLian",
  "Rhysida",
  "INC Ransom",
  "Medusa",
  "Qilin",
  "Fog",
  "Hunters International",
  "Lapsus$",
  "Vice Society",
  "Royal",
  "Conti",
  "REvil",
  "Hive",
  "DarkSide",
  "Karakurt",
  "Bianlian",
  "Knight",
  "Cactus",
  "BlackByte",
];

const EN_STOP = new Set([
  "the",
  "of",
  "and",
  "a",
  "an",
  "to",
  "in",
  "was",
  "were",
  "for",
  "with",
  "on",
  "by",
  "from",
  "that",
  "this",
  "as",
  "at",
  "or",
  "is",
  "are",
  "be",
  "been",
  "being",
  "it",
  "its",
  "their",
  "they",
  "which",
  "who",
  "later",
  "included",
  "allegedly",
  "published",
  "publicly",
  "obtained",
  "breach",
  "data",
  "unique",
  "email",
  "addresses",
  "target",
  "campaign",
  "company",
]);

type PhraseRule = [RegExp, string | ((...args: string[]) => string)];

const PHRASES: PhraseRule[] = [
  [/was the target of a ([A-Za-z0-9.$]+) ["“”']pay or leak["“”'] extortion campaign/gi, (_m, actor) => `fue objetivo de una campaña de extorsión «paga o filtramos» atribuida a ${actor}`],
  [/was the target of a ["“”']pay or leak["“”'] extortion campaign/gi, "fue objetivo de una campaña de extorsión «paga o filtramos»"],
  [/a ([A-Za-z0-9.$]+) ["“”']pay or leak["“”'] extortion campaign/gi, (_m, actor) => `una campaña de extorsión «paga o filtramos» atribuida a ${actor}`],
  [/["“”']pay or leak["“”'] extortion campaign/gi, "campaña de extorsión «paga o filtramos»"],
  [/["“”']pay or leak["“”']/gi, "«paga o filtramos»"],
  [/pay-or-leak/gi, "paga o filtramos"],
  [/Swiss medical device company/gi, "la empresa suiza de dispositivos médicos"],
  [/medical device company/gi, "empresa de dispositivos médicos"],
  [/Medela staff and leads/gi, "personal de Medela y posibles clientes"],
  [/US-based/gi, "con sede en Estados Unidos"],
  [/UK-based/gi, "con sede en el Reino Unido"],
  [/was the target of/gi, "fue objetivo de"],
  [/were the target of/gi, "fueron objetivo de"],
  [/suffered a data breach/gi, "sufrió una filtración de datos"],
  [/experienced a data breach/gi, "sufrió una filtración de datos"],
  [/announced a data breach/gi, "anunció una filtración de datos"],
  [/disclosed a data breach/gi, "comunicó una filtración de datos"],
  [/suffered a ransomware attack/gi, "sufrió un ataque de ransomware"],
  [/was the victim of/gi, "fue víctima de"],
  [/was involved in a data breach/gi, "apareció en una filtración de datos"],
  [/appeared in a data breach/gi, "apareció en una filtración de datos"],
  [/unauthorised access/gi, "acceso no autorizado"],
  [/unauthorized access/gi, "acceso no autorizado"],
  [/The data allegedly obtained in the breach was later published publicly and included/gi, "Los datos que se habrían obtenido en la brecha se publicaron después. Incluían"],
  [/The data allegedly obtained in the breach was later published publicly/gi, "Los datos que se habrían obtenido en la brecha se publicaron después"],
  [/was later published publicly and included/gi, "se publicaron después. Incluían"],
  [/was later published publicly/gi, "se publicaron después en abierto"],
  [/later appeared for sale/gi, "aparecieron después a la venta"],
  [/later leaked/gi, "se filtraron después"],
  [/appeared on a dark web forum/gi, "aparecieron en un foro de la dark web"],
  [/was offered for sale/gi, "se ofreció a la venta"],
  [/The exposed data consisted primarily of/gi, "Los datos expuestos eran, sobre todo,"],
  [/The exposed data included/gi, "Entre los datos expuestos hay"],
  [/The compromised data included/gi, "Entre los datos comprometidos hay"],
  [/corporate contact information/gi, "información de contacto empresarial"],
  [/with some records also containing associated/gi, "y algunos registros también incluían"],
  [/with some records also containing/gi, "y algunos registros también incluían"],
  [/Compromised data:/gi, "Datos comprometidos:"],
  [/unique email addresses/gi, "correos electrónicos únicos"],
  [/email addresses/gi, "correos electrónicos"],
  [/belonging predominantly to/gi, "sobre todo de"],
  [/belonging primarily to/gi, "sobre todo de"],
  [/belonging to/gi, "de"],
  [/healthcare professionals/gi, "profesionales de la salud"],
  [/staff and leads/gi, "personal y posibles clientes"],
  [/customers and employees/gi, "clientes y empleados"],
  [/users and employees/gi, "usuarios y empleados"],
  [/an estimated/gi, "unos"],
  [/approximately/gi, "aproximadamente"],
  [/was discovered/gi, "se descubrió"],
  [/was disclosed/gi, "se comunicó"],
  [/was reported/gi, "se informó"],
  [/was published by/gi, "lo publicó"],
  [/according to/gi, "según"],
  [/reportedly/gi, "según se informó"],
  [/allegedly/gi, "según se afirma"],
  [/subsequently/gi, "después"],
  [/ransomware group/gi, "grupo de ransomware"],
  [/threat actor/gi, "actor de amenazas"],
  [/cybercriminals/gi, "ciberdelincuentes"],
  [/the attackers/gi, "los atacantes"],
  [/parent company of/gi, "matriz de"],
  [/subsidiary of/gi, "filial de"],
  [/based in/gi, "con sede en"],
  [/along with/gi, "junto con"],
  [/as well as/gi, "además de"],
  [/consisting of/gi, "compuestos por"],
  [/\bincluding\b/gi, "incluidos"],
];

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-z]+);/gi, (_, name: string) => ENTITIES[name.toLowerCase()] ?? `&${name};`);
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (/\.onion$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function hostLabel(href: string): string {
  try {
    return `Cobertura · ${new URL(href).hostname.replace(/^www\./, "")}`;
  } catch {
    return "Cobertura";
  }
}

export function extractBreachLinks(html: string): BreachCopyLink[] {
  const links: BreachCopyLink[] = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const href = safeHref(match[1] ?? "");
    if (!href || seen.has(href)) continue;
    seen.add(href);
    links.push({ href, label: hostLabel(href) });
  }
  return links.slice(0, 4);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function monthName(value: string): string {
  return MONTHS[value.toLowerCase()] ?? value.toLowerCase();
}

function translateDates(text: string): string {
  return text
    .replace(
      /\bIn (early|mid|late)\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?: of)? (\d{4})\b/gi,
      (_m, when: string, month: string, year: string) => {
        const prefix =
          when.toLowerCase() === "early"
            ? "A principios de"
            : when.toLowerCase() === "late"
              ? "A finales de"
              : "A mediados de";
        return `${prefix} ${monthName(month)} de ${year}`;
      },
    )
    .replace(
      /\bIn (January|February|March|April|May|June|July|August|September|October|November|December)(?: of)? (\d{4})\b/gi,
      (_m, month: string, year: string) => `En ${monthName(month)} de ${year}`,
    )
    .replace(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})\b/gi,
      (_m, month: string, year: string) => `${monthName(month)} de ${year}`,
    );
}

function translateCounts(text: string): string {
  return text
    .replace(/\b(\d+(?:[.,]\d+)?)\s*billion\b/gi, "$1 mil millones")
    .replace(/\b(\d+(?:[.,]\d+)?)\s*million\b/gi, "$1 millones")
    .replace(/\b(\d+(?:[.,]\d+)?)\s*thousand\b/gi, "$1 mil")
    .replace(/\b(\d+(?:[.,]\d+)?)k\b/gi, "$1 mil");
}

function applyPhrases(text: string): string {
  let out = text;
  for (const [pattern, replacement] of PHRASES) {
    const re = new RegExp(pattern.source, pattern.flags);
    out = typeof replacement === "function" ? out.replace(re, replacement) : out.replace(re, replacement);
  }
  return out;
}

function replaceDataClassesInText(text: string): string {
  let out = text;
  for (const key of DATA_CLASS_KEYS) {
    const label = DATA_CLASS_LABELS[key];
    if (!label) continue;
    out = out.replace(new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi"), label.toLowerCase());
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function translateDataClass(label: string): string {
  const key = label.replace(/\s+/g, " ").trim().toLowerCase();
  if (!key) return label;
  return DATA_CLASS_LABELS[key] ?? label;
}

export function translateDataClasses(labels: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of labels ?? []) {
    const translated = translateDataClass(item);
    const key = translated.toLowerCase();
    if (!translated || seen.has(key) || /[:=]/.test(item)) continue;
    seen.add(key);
    out.push(translated);
  }
  return out;
}

function englishRatio(text: string): number {
  const words = text.toLowerCase().match(/[a-záéíóúüñ]+/gi) ?? [];
  if (words.length === 0) return 0;
  return words.filter((word) => EN_STOP.has(word)).length / words.length;
}

function stillEnglish(text: string): boolean {
  if (/<a\b|href=/i.test(text)) return true;
  if (/^\s*(The|In |This |It |With )\b/.test(text)) return true;
  if (/\b(consisted|containing associated|was the target|email addresses)\b/i.test(text)) return true;
  return englishRatio(text) >= 0.12;
}

function extractActor(text: string): string | null {
  for (const actor of ACTORS) {
    if (new RegExp(`\\b${escapeRegExp(actor)}\\b`, "i").test(text)) return actor;
  }
  return null;
}

function extractKind(text: string): "extortion" | "ransomware" | "stealer" | "breach" {
  if (/pay or leak|paga o filtramos|extortion/i.test(text)) return "extortion";
  if (/ransomware/i.test(text)) return "ransomware";
  if (/stealer|infostealer/i.test(text)) return "stealer";
  return "breach";
}

function monthYearFromText(text: string): string | null {
  const match = text.match(
    /\b(?:En |A principios de |A finales de |A mediados de )?([A-Za-záéíóúñ]+)\s+de\s+(\d{4})\b/i,
  );
  if (match?.[1] && match[2]) {
    const month = MONTHS[match[1].toLowerCase()] ?? match[1].toLowerCase();
    return `${month} de ${match[2]}`;
  }
  const en = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
  );
  if (en?.[1] && en[2]) return `${monthName(en[1])} de ${en[2]}`;
  return null;
}

function monthYearFromIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.toLocaleDateString("es", { month: "long" });
  return `${month} de ${date.getFullYear()}`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("es").format(value);
}

function tidy(text: string): string {
  return collapse(
    text
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/[“”]/g, '"')
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, "."),
  );
}

function isDataListSentence(sentence: string): boolean {
  return /^(Entre los datos (expuestos|comprometidos) hay|Datos comprometidos:)/i.test(sentence);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ«"0-9])/)
    .map((part) => tidy(part))
    .filter((part) => part && !isDataListSentence(part) && !stillEnglish(part));
}

function structuredLead(plain: string, input: BreachCopyInput): string {
  const name = (input.name ?? "").trim() || "esta organización";
  const when = monthYearFromText(plain) ?? monthYearFromIso(input.publishedAt);
  const actor = extractActor(plain);
  const kind = extractKind(plain);
  const time = when ? `En ${when}` : "Recientemente";

  if (kind === "extortion" && actor) {
    return `${time}, ${name} fue objetivo de una campaña de extorsión «paga o filtramos» atribuida a ${actor}.`;
  }
  if (kind === "extortion") {
    return `${time}, ${name} fue objetivo de una campaña de extorsión «paga o filtramos».`;
  }
  if (kind === "ransomware" && actor) {
    return `${time}, ${name} sufrió un ataque de ransomware atribuido a ${actor}.`;
  }
  if (kind === "ransomware") {
    return `${time}, ${name} sufrió un ataque de ransomware.`;
  }
  if (kind === "stealer") {
    return `${time} se publicaron registros de un infostealer relacionados con ${name}.`;
  }
  if (actor) {
    return `${time} se conoció una filtración de ${name}, atribuida a ${actor}.`;
  }
  return `${time} se conoció una filtración de datos asociada a ${name}.`;
}

function volumeSentence(input: BreachCopyInput, already: string): string | null {
  if (typeof input.recordCount !== "number" || !Number.isFinite(input.recordCount) || input.recordCount <= 0) {
    return null;
  }
  const formatted = formatCount(input.recordCount);
  if (already.includes(formatted)) return null;
  return `La fuente contabiliza ${formatted} registros afectados.`;
}

function whoSentence(plain: string): string | null {
  const match = plain.match(/sobre todo de ([^.]+)\./i) ?? plain.match(/belonging predominantly to ([^.]+)\./i);
  if (!match?.[1]) return null;
  const who = tidy(match[1]);
  if (!who || stillEnglish(who)) return null;
  return `Las personas citadas son, sobre todo, ${who.replace(/^de /, "")}.`;
}

function implicationFor(dataTypes: string[]): string | null {
  const keys = dataTypes.map((item) => item.toLowerCase());
  if (keys.length === 0) return null;
  const has = (part: string) => keys.some((item) => item.includes(part));
  const parts: string[] = [];
  if (has("password") || has("contraseña")) {
    parts.push("Si tu cuenta está en la lista, cambiá la contraseña de ese servicio, no la reutilices y activá un segundo factor.");
  }
  if (has("email") || has("correo")) {
    parts.push("Los correos filtrados se usan para phishing dirigido: desconfiá de mensajes que citen tu cargo, empresa o un ticket de soporte.");
  }
  if (has("phone") || has("teléfono")) {
    parts.push("Un teléfono expuesto abre la puerta a llamadas y SMS fraudulentos que parecen del soporte de la empresa.");
  }
  if (has("physical address") || has("dirección física") || has("direcciones físicas")) {
    parts.push("Las direcciones postales no deben usarse para verificar identidad por teléfono ni por correo.");
  }
  if (has("health") || has("salud")) {
    parts.push("Hay datos sanitarios: tratalos como información clínica sensible, no solo como una lista de contactos.");
  }
  if (has("passport") || has("social security") || has("government") || has("identidad") || has("seguridad social")) {
    parts.push("Hay identificadores oficiales: vigilá fraudes de identidad y no mandes copias de documentos si te las piden por ese canal.");
  }
  if (has("credit card") || has("tarjeta") || has("financial") || has("bancaria")) {
    parts.push("Hay datos financieros: revisá los movimientos y avisale al banco si ves cargos que no reconocés.");
  }
  if (parts.length === 0) {
    parts.push("Quien figure en esta lista puede recibir contactos muy creíbles. No confirmes contraseñas ni códigos por ese medio.");
  }
  return parts.slice(0, 2).join(" ");
}

function polishProse(text: string): string {
  return tidy(
    replaceDataClassesInText(applyPhrases(translateCounts(translateDates(text))))
      .replace(/\bla la\b/gi, "la")
      .replace(/\buna una\b/gi, "una")
      .replace(/\s+and\s+/gi, " y ")
      .replace(/\s+or\s+/gi, " o ")
      .replace(/únicos sobre todo/gi, "únicos, sobre todo"),
  );
}

export function explainHibpBreach(raw: string | null | undefined, input: BreachCopyInput = {}): BreachCopy {
  const html = typeof raw === "string" ? raw.slice(0, 8_000) : "";
  const links = html ? extractBreachLinks(html) : [];
  const plain = tidy(decodeEntities(stripTags(html)));
  const translated = plain ? polishProse(plain) : "";
  const usableProse = translated && !stillEnglish(translated) ? translated : "";
  const sentences = usableProse ? splitSentences(usableProse) : [];

  const summary = sentences[0] ?? (input.name ? structuredLead(plain || translated, input) : null);
  const extra = sentences.slice(1);
  const who = whoSentence(usableProse || plain);
  const volume = volumeSentence(input, [usableProse, extra.join(" ")].join(" "));
  const detailParts = [...extra];
  if (who && !detailParts.some((part) => part.toLowerCase().includes("sobre todo"))) detailParts.unshift(who);
  if (volume) detailParts.push(volume);

  const summaryText = summary ? tidy(summary) : null;
  const detailText = detailParts.length ? tidy(detailParts.join(" ")) : null;
  const implication = implicationFor(input.dataTypes ?? []);

  return {
    summary: summaryText || null,
    detail: detailText && detailText !== summaryText ? detailText : null,
    implication,
    links,
  };
}
// Sistema Mercav Pwn - creado por pato dev y askforvini
