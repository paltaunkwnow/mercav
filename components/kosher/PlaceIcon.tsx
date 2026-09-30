import type { KosherPlaceType } from "@prisma/client";
import { cn } from "@/lib/utils";

export const PLACE_ICON_PATHS: Record<KosherPlaceType, string> = {
  restaurant: '<path d="M8 3v10M12 3v6a2 2 0 0 1-4 0V3M16 3v18"/>',
  bakery: '<path d="M4 14c2-6 14-6 16 0v2H4v-2Zm2 2v3h12v-3"/>',
  butcher: '<path d="M7 4h10l-1 6H8L7 4Zm1 6 2 10h4l2-10"/>',
  grocery_branch: '<path d="M5 7h14l-1 11H6L5 7Zm2 0V5a3 3 0 0 1 6 0v2"/>',
  judaica: '<path d="M12 3v18M5 8h14M7 16h10M8 5l4 3 4-3M8 19l4-3 4 3"/>',
  synagogue: '<path d="M12 2.5 20 16H4L12 2.5ZM12 21.5 4 8h16l-8 13.5Z"/>',
  mikvah: '<path d="M4 14c2 2 4 3 8 3s6-1 8-3M6 10c1.5 1.2 3 1.8 6 1.8s4.5-.6 6-1.8M8 6c1 .7 2 1 4 1s3-.3 4-1"/>',
  school: '<path d="M3 10l9-5 9 5-9 5-9-5Zm3 3v5l6 3 6-3v-5"/>',
  hotel: '<path d="M4 19V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12M4 19h16M8 10h.01M12 10h.01M8 14h.01M12 14h.01"/>',
  community: '<path d="M4 19V9l8-5 8 5v10M9 19v-5h6v5"/>',
  museum: '<path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
};

export function placeIconSvg(type: KosherPlaceType, size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PLACE_ICON_PATHS[type]}</svg>`;
}

export function PlaceIcon({ type, className }: { type: KosherPlaceType; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-4 w-4 shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: PLACE_ICON_PATHS[type] }}
    />
  );
}
