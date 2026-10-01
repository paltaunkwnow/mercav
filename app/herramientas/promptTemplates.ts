/**
 * Business prompt templates for the prompt generator. Shared by the UI (labels) and the API (fallback prompts),
 * so the instructions work in any AI assistant without depending on a specific product.
 */

export const PROMPT_TEMPLATES = [
  {
    id: "descripcion-producto",
    label: "Descripción de producto",
    hint: "Ej.: mate de calabaza forrado en cuero, hecho a mano, con bombilla de alpaca.",
    task: "Escribí la descripción de un producto para venderlo online (tienda, marketplace o catálogo de WhatsApp).",
    format: "Un título de hasta 60 caracteres, un párrafo de 3 o 4 oraciones centrado en beneficios y de 4 a 6 viñetas con características concretas.",
  },
  {
    id: "anuncio-redes",
    label: "Anuncio para redes",
    hint: "Ej.: promo de 2x1 en empanadas los martes, delivery en la zona.",
    task: "Escribí un anuncio para redes sociales (Instagram, Facebook o TikTok).",
    format: "Una primera línea que enganche, un texto de hasta 120 palabras, un llamado a la acción claro y hasta 5 hashtags relevantes.",
  },
  {
    id: "respuesta-cliente",
    label: "Respuesta a un cliente",
    hint: "Pegá el mensaje del cliente y contá qué querés responderle.",
    task: "Redactá una respuesta al mensaje de un cliente.",
    format: "Un mensaje breve, cordial y resolutivo, listo para enviar por WhatsApp o correo, de hasta 120 palabras.",
  },
  {
    id: "descripcion-vacante",
    label: "Descripción de vacante",
    hint: "Ej.: vendedor/a para local de ropa, medio tiempo, turno tarde.",
    task: "Escribí la descripción de una vacante de trabajo para publicarla.",
    format: "Título del puesto, resumen del negocio en 2 oraciones, responsabilidades (5 viñetas), requisitos (obligatorios y deseables), qué ofrecemos y cómo postularse.",
  },
  {
    id: "guion-video",
    label: "Guion de video corto",
    hint: "Ej.: mostrar cómo preparamos una torta personalizada, de principio a fin.",
    task: "Escribí el guion de un video corto vertical (Reels, TikTok o Shorts) de 30 a 45 segundos.",
    format: "Una lista por escenas con duración, lo que se ve, lo que se dice y el texto en pantalla; un gancho en los primeros 3 segundos y un cierre con llamado a la acción.",
  },
  {
    id: "correo-seguimiento",
    label: "Correo de seguimiento",
    hint: "Ej.: le mandé un presupuesto hace una semana y no respondió.",
    task: "Redactá un correo de seguimiento para un cliente o prospecto.",
    format: "Un asunto de hasta 50 caracteres y un cuerpo de hasta 150 palabras que termine con un próximo paso concreto.",
  },
] as const;

export type PromptTemplateId = (typeof PROMPT_TEMPLATES)[number]["id"];

export const PROMPT_TONES = ["cercano", "profesional", "entusiasta", "formal"] as const;
export const PROMPT_LOCALES = ["neutro", "Argentina", "Bolivia", "Chile", "Colombia", "México", "Paraguay", "Perú", "Uruguay"] as const;

export type PromptInput = {
  template: string;
  business?: string;
  audience?: string;
  tone?: string;
  locale?: string;
  description?: string;
};

export type PromptVariant = { label: string; prompt: string };

export function templateById(id: string | undefined) {
  return PROMPT_TEMPLATES.find((t) => t.id === id) ?? PROMPT_TEMPLATES[0];
}

const clip = (value: unknown, max = 1200) => String(value ?? "").trim().slice(0, max);

export function normalizePromptInput(body: any): Required<PromptInput> {
  const template = templateById(body?.template).id;
  const tone = (PROMPT_TONES as readonly string[]).includes(body?.tone) ? body.tone : "cercano";
  const locale = (PROMPT_LOCALES as readonly string[]).includes(body?.locale) ? body.locale : "neutro";
  return { template, tone, locale, business: clip(body?.business, 300), audience: clip(body?.audience, 300), description: clip(body?.description, 2000) };
}

/** Deterministic prompts built only from what the person wrote. Used when no model is configured. */
export function buildPromptVariants(raw: PromptInput): PromptVariant[] {
  const input = normalizePromptInput(raw);
  const template = templateById(input.template);
  const language = input.locale === "neutro" ? "español neutro latinoamericano" : `español como se habla en ${input.locale}`;
  const business = input.business || "[nombre y rubro del negocio]";
  const audience = input.audience || "[a quién le hablás]";
  const details = input.description || "[detalles: qué ofrecés, precio, condiciones, zona]";
  const rules = `No inventes datos (precios, plazos, cifras, testimonios ni características). Si falta información, dejá un marcador entre corchetes, por ejemplo [precio].`;

  const quick = `${template.task} Mi negocio: ${business}. Público: ${audience}. Detalles: ${details}. Usá ${language} y un tono ${input.tone}. Formato: ${template.format} ${rules}`;

  const full = [
    `Actuá como redactor/a comercial con experiencia en pequeños negocios de Latinoamérica.`,
    ``,
    `Contexto`,
    `- Negocio: ${business}`,
    `- Público: ${audience}`,
    `- Detalles: ${details}`,
    ``,
    `Tarea`,
    template.task,
    ``,
    `Formato`,
    template.format,
    ``,
    `Estilo y reglas`,
    `- Idioma: ${language}. Tono ${input.tone}.`,
    `- Frases cortas y claras, sin tecnicismos ni frases hechas.`,
    `- ${rules}`,
  ].join("\n");

  const guided = [
    `Vas a ayudarme con esta tarea: ${template.task.charAt(0).toLowerCase()}${template.task.slice(1)}`,
    ``,
    `Lo que sé hasta ahora: negocio ${business}; público ${audience}; detalles: ${details}.`,
    ``,
    `Antes de escribir, haceme hasta 3 preguntas sobre lo que te falte para que el texto sea preciso. Con mis respuestas, entregame 2 versiones distintas en ${language} con tono ${input.tone}, siguiendo este formato: ${template.format}`,
    ``,
    `Al final, decime en una línea qué versión recomendás y por qué. ${rules}`,
  ].join("\n");

  return [
    { label: "Directo", prompt: quick },
    { label: "Completo", prompt: full },
    { label: "Con preguntas previas", prompt: guided },
  ];
}
// creado por pato dev y askforvini
