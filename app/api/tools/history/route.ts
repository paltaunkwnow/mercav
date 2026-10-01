import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkToolAccess } from "@/lib/toolAccess";
import { HISTORY_TOOLS } from "@/app/herramientas/toolRoutes";

const MAX_PAYLOAD_BYTES = 200 * 1024;
const MAX_TITLE = 120;
const LIST_LIMIT = 50;

async function currentUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  return user?.id ?? null;
}

function unauthorized() {
  return NextResponse.json({ success: false, error: "Iniciá sesión para usar el historial." }, { status: 401 });
}

function isValidTool(tool: unknown): tool is string {
  return typeof tool === "string" && HISTORY_TOOLS.includes(tool);
}

/** GET ?tool=<id> → last 50 runs (no payload). GET ?id=<runId> → one full run. */
export async function GET(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const run = await prisma.toolRun.findFirst({ where: { id, userId } });
      if (!run) return NextResponse.json({ success: false, error: "No encontramos ese resultado." }, { status: 404 });
      return NextResponse.json({ success: true, data: run });
    }

    const tool = searchParams.get("tool");
    if (tool && !isValidTool(tool)) return NextResponse.json({ success: false, error: "Herramienta inválida." }, { status: 400 });

    const runs = await prisma.toolRun.findMany({
      where: { userId, ...(tool ? { tool } : {}) },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: { id: true, tool: true, title: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    console.error("Tool history GET error", error);
    return NextResponse.json({ success: false, error: "No pudimos cargar el historial." }, { status: 500 });
  }
}

/** POST { tool, title, input, output } → saves a run for the signed-in user. */
export async function POST(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();

    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ success: false, error: "El resultado es demasiado grande para guardarlo." }, { status: 413 });
    }

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Datos inválidos." }, { status: 400 });
    }

    const { tool, input, output } = body ?? {};
    if (!isValidTool(tool)) return NextResponse.json({ success: false, error: "Herramienta inválida." }, { status: 400 });

    const title = typeof body.title === "string" ? body.title.trim().replace(/\s+/g, " ") : "";
    if (!title) return NextResponse.json({ success: false, error: "Falta el título." }, { status: 400 });
    if (title.length > MAX_TITLE) {
      return NextResponse.json({ success: false, error: `El título no puede superar ${MAX_TITLE} caracteres.` }, { status: 400 });
    }
    if (input === undefined || output === undefined || output === null) {
      return NextResponse.json({ success: false, error: "Falta el resultado a guardar." }, { status: 400 });
    }

    const access = await checkToolAccess(userId, tool);
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const run = await prisma.toolRun.create({
      data: { userId, tool, title, input, output },
      select: { id: true, tool: true, title: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    console.error("Tool history POST error", error);
    return NextResponse.json({ success: false, error: "No pudimos guardar el resultado." }, { status: 500 });
  }
}

/** DELETE ?id=<runId> → removes a run owned by the signed-in user. */
export async function DELETE(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Falta el id." }, { status: 400 });

    const { count } = await prisma.toolRun.deleteMany({ where: { id, userId } });
    if (count === 0) return NextResponse.json({ success: false, error: "No encontramos ese resultado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tool history DELETE error", error);
    return NextResponse.json({ success: false, error: "No pudimos borrar el resultado." }, { status: 500 });
  }
}
// creado por pato dev y askforvini
