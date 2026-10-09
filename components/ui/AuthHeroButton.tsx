"use client";

import { useSession } from 'next-auth/react';
import { LayoutGrid } from '@/components/icons';
import { cn } from '@/lib/utils';
import { SlideConfirm } from '@/components/motion/SlideConfirm';
import { HostLink, useHostNavigate } from '@/components/layout/HostContext';
import { APP_HOME } from '@/lib/seo/site';

interface AuthHeroButtonProps {
  label?: string;
  className?: string;
}

// Same footprint in every state so the hero never shifts while the session resolves.
const FOOTPRINT = "h-16 w-full min-w-[18rem] rounded-full sm:min-w-[24rem] md:h-20";

export function AuthHeroButton({ label = "Empezar gratis", className }: AuthHeroButtonProps) {
  // Also rendered on mercav.lat (the landing), where /inicio and /register live on app.mercav.lat.
  const navigate = useHostNavigate();
  const { data: session, status } = useSession();

  if (status === "loading") {
    // Looks like the slider track so nothing jumps when the real control mounts.
    return (
      <div
        aria-hidden
        className={cn(FOOTPRINT, "flex items-center justify-center bg-gradient-to-r from-gold/45 to-yellow-300/35 pl-10 text-xs font-black uppercase tracking-widest text-black/40 md:text-sm", className)}
      >
        {label}
      </div>
    );
  }

  if (session?.user) {
    return (
      <HostLink
        href={APP_HOME}
        className={cn(
          FOOTPRINT,
          "mv-btn mv-btn-primary gap-3 text-sm font-semibold uppercase tracking-widest md:text-base",
          "shadow-[0_0_40px_rgba(212,175,55,0.28)]",
          className,
        )}
      >
        <LayoutGrid className="h-5 w-5" aria-hidden />
        Abrir la app
      </HostLink>
    );
  }

  return (
    <SlideConfirm
      variant="gold"
      label={label}
      className={cn("rounded-full", className)}
      onConfirm={() => navigate("/register")}
    />
  );
}
// creado por pato dev y askforvini
