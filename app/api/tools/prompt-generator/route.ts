import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";

function fallbackPrompts(input: any) {
  const base = input.description || "";
  return [
    { label: "Básico", prompt: `${input.tool} prompt: ${base}` },
    { label: "Detallado", prompt: `${input.tool} prompt highly detailed, ${base}, professional composition, high quality, clean structure` },
    { label: "Avanzado", prompt: `${input.tool} prompt advanced, ${base}, cinematic, polished, attention to detail, premium quality, consistent style` },
  ];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const access = await checkToolAccess(user.id, "prompt-generator");
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const body = await req.json();
    const prompt = `Generá 3 variaciones de prompt para ${body.tool} para la categoría ${body.category}. Descripción: ${body.description}. Responde en JSON con etiqueta y prompt.`;
    let prompts = fallbackPrompts(body);

    if (process.env.ANTHROPIC_API_KEY) {
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
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await response.json();
        const text = data?.content?.[0]?.text || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) prompts = parsed;
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
