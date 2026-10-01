import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";
import { buildPromptVariants, normalizePromptInput, templateById, type PromptVariant } from "@/app/herramientas/promptTemplates";

/** Keeps only well-formed { label, prompt } items coming back from the model. */
function parseModelPrompts(text: string): PromptVariant[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    const clean = parsed
      .filter((item) => item && typeof item.label === "string" && typeof item.prompt === "string" && item.prompt.trim())
      .slice(0, 3)
      .map((item) => ({ label: item.label.slice(0, 40), prompt: item.prompt.slice(0, 4000) }));
    return clean.length ? clean : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const access = await checkToolAccess(user.id, "prompt-generator");
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const body = normalizePromptInput(await req.json());
    const template = templateById(body.template);
    let prompts: PromptVariant[] = buildPromptVariants(body);

    if (process.env.ANTHROPIC_API_KEY) {
      const instruction = [
        `Generá 3 variantes de un prompt en español que una persona va a pegar en cualquier asistente de IA para resolver esta tarea de negocio: ${template.task}`,
        `Formato esperado del texto final: ${template.format}`,
        `Datos que dio la persona (usá solo estos, no agregues datos nuevos): negocio: ${body.business || "sin especificar"}; público: ${body.audience || "sin especificar"}; tono: ${body.tone}; variante del español: ${body.locale}; detalles: ${body.description || "sin especificar"}.`,
        `Cada prompt debe pedirle al asistente que no invente precios, cifras, testimonios ni características y que use marcadores entre corchetes cuando falte información.`,
        `Variantes: "Directo" (un párrafo), "Completo" (con secciones Contexto, Tarea, Formato y Reglas) y "Con preguntas previas" (el asistente pregunta antes de escribir).`,
        `Respondé solo con un arreglo JSON de objetos { "label": string, "prompt": string }, sin texto adicional.`,
      ].join("\n");
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
            max_tokens: 1400,
            messages: [{ role: "user", content: instruction }],
          }),
        });
        const data = await response.json();
        prompts = parseModelPrompts(data?.content?.[0]?.text || "") ?? prompts;
      } catch (error) {
        console.warn("Prompt generator fallback", error);
      }
    }

    await prisma.toolUsage.create({ data: { userId: user.id, toolName: "prompt-generator", inputData: body, outputData: prompts } }).catch(() => {});

    return NextResponse.json({ success: true, data: prompts });
  } catch (error) {
    console.error("Prompt generator error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
