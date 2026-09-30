import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { listCityThreads } from "@/lib/kosher/threads";
import { cityThreadKey } from "@/lib/kosher/geo";
import { getKosherViewer } from "@/lib/kosher/server";
import { ChatRooms } from "@/components/kosher/ChatRooms";

export const metadata: Metadata = { title: "Chat de la comunidad" };

export default async function KosherChatPage({ searchParams }: { searchParams: { sala?: string } }) {
  const [threads, viewer] = await Promise.all([listCityThreads(), getKosherViewer()]);
  const activity = await prisma.kosherMessage.groupBy({
    by: ["threadKey"],
    where: { hidden: false, threadKey: { in: threads.map((t) => t.key) } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const byKey = new Map(activity.map((a) => [a.threadKey, a]));

  const rooms = threads
    .map((t) => ({
      ...t,
      count: byKey.get(t.key)?._count._all ?? 0,
      lastAt: byKey.get(t.key)?._max.createdAt?.toISOString() ?? null,
    }))
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? "") || a.title.localeCompare(b.title));

  const home = viewer?.profile?.city && viewer.profile.countryCode ? cityThreadKey(viewer.profile.city, viewer.profile.countryCode) : null;
  const requested = searchParams.sala && rooms.some((r) => r.key === searchParams.sala) ? searchParams.sala : null;
  const initial = requested ?? (home && rooms.some((r) => r.key === home) ? home : rooms[0]?.key ?? null);

  return <ChatRooms rooms={rooms} initialKey={initial} />;
}
