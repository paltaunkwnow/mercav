"use client";

import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Store } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function POSHeader() {
  const pathname = usePathname();

  const links = [
    { name: 'Terminal', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventario', href: '/dashboard/pos/inventory', icon: Package },
    { name: 'Reportes', href: '/dashboard/pos/reports', icon: LayoutDashboard },
    { name: 'Configuración', href: '/dashboard/pos/config', icon: Settings },
  ];

  return (
    <nav className="h-20 bg-black/40 border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4 lg:gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-primary-foreground shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
            <Store size={20} />
          </div>
          <span className="text-white font-black uppercase tracking-[0.3em] text-xs hidden sm:inline">Mercav POS</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-gold text-primary-foreground shadow-lg shadow-gold/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={14} />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
        </Link>
      </div>
    </nav>
  );
}
