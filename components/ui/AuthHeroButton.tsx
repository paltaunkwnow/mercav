"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlideConfirm } from '@/components/motion/SlideConfirm';

interface AuthHeroButtonProps {
  label?: string;
  className?: string;
}

export function AuthHeroButton({ label = "Empezar gratis", className }: AuthHeroButtonProps) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data?.user) {
          setSession(data.user);
        }
      } catch {
        // Not authenticated, that's fine
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <Button disabled size="lg" className={cn("bg-gold/50 text-black h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs w-full sm:w-auto", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (session) {
    return (
      <Button asChild size="lg" className={cn("bg-gradient-to-r from-gold to-yellow-300 text-black hover:scale-[1.05] h-18 md:h-20 px-12 rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-sm w-full transition-all duration-500 shadow-[0_0_50px_rgba(212,175,55,0.4)] hover:shadow-[0_0_80px_rgba(212,175,55,0.6)] border-none", className)}>
        <Link href="/dashboard" className="flex items-center justify-center gap-4">
          <LayoutDashboard className="h-6 w-6" />
          Ir al Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <SlideConfirm
      variant="gold"
      label={label}
      className={cn("rounded-[2rem]", className)}
      onConfirm={() => router.push("/register")}
    />
  );
}
// creado por pato dev y askforvini
