import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { resolveThread } from "@/lib/kosher/threads";
import { getKosherViewer, kosherError, publicAuthorName, unauthorized, writeGuard } from "@/lib/kosher/server";

const threadKey = z.string().min(6).max(140).regex(/^(city|place):[a-z0-9-]+$/);

export async function GET(request: NextRequest) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();

  const key = threadKey.safeParse(request.nextUrl.searchParams.get("thread"));
  if (!key.success) return kosherError(400, "Conversación no válida");
  const thread = await resolveThread(key.data);
  if (!thread) return kosherError(404, "Conversación no encontrada");

  const afterRaw = request.nextUrl.searchParams.get("after");
  const after = afterRaw && !Number.isNaN(Date.parse(afterRaw)) ? new Date(afterRaw) : null;

  const rows = await prisma.kosherMessage.findMany({
    where: { threadKey: thread.key, hidden: false, ...(after ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: 80,
    include: {
      user: { select: { name: true, username: true, avatar: true } },
      flags: { where: { userId: viewer.id }, select: { id: true } },
    },
  });
  const ordered = after ? rows : rows.reverse();

  return NextResponse.json(
    {
      success: true,
      thread,
      messages: ordered.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        author: publicAuthorName(m.user.name),
        username: m.user.username,
        avatar: m.user.avatar,
        mine: m.userId === viewer.id,
        flagged: m.flags.length > 0,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const postSchema = z.object({ thread: threadKey, body: z.string().trim().min(1).max(500) });

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-chat", capacity: 5, refillPerMinute: 20, userId: viewer.id });
  if (limited) return limited;

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "El mensaje tiene que tener entre 1 y 500 caracteres.");
  const thread = await resolveThread(parsed.data.thread);
  if (!thread) return kosherError(404, "Conversación no encontrada");

  const message = await prisma.kosherMessage.create({
    data: { threadKey: thread.key, userId: viewer.id, body: parsed.data.body },
  });
  return NextResponse.json({ success: true, id: message.id, createdAt: message.createdAt.toISOString() }, { status: 201 });
}
