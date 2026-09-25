import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell } from "lucide-react";

export async function AnnouncementBar() {
  const config = await prisma.globalConfig.findUnique({
    where: { id: "singleton" }
  });

  if (!config?.announcementText) return null;

  const content = (
    <div className="bg-gradient-to-r from-gold via-yellow-400 to-gold text-black py-2.5 px-4 text-center text-[10px] md:text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 group transition-all hover:from-gold-light hover:via-yellow-300 hover:to-gold-light relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <Bell className="h-3 w-3 animate-pulse relative z-10" />
      <span className="relative z-10">{config.announcementText}</span>
      {config.announcementLink && (
        <span className="hidden md:inline-block bg-black/10 px-2 py-0.5 rounded-full text-[8px] ml-2 group-hover:bg-black/20 transition-colors font-black relative z-10">
          Ver más
        </span>
      )}
    </div>
  );

  if (config.announcementLink) {
    return (
      <Link href={config.announcementLink} target="_blank" className="block sticky top-0 z-[110]">
        {content}
      </Link>
    );
  }

  return <div className="sticky top-0 z-[110]">{content}</div>;
}
// creado por pato dev y askforvini
