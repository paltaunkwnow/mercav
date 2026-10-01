"use client";

import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Store, RefreshCw, CloudOff } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { usePosSync } from '@/lib/pos/offline';

/** Online / offline / queued sales. Polite live region so screen readers hear the change once. */
function SyncStatus() {
  const { online, pending, rejected, syncing, sync } = usePosSync();
  const label = !online
    ? pending > 0 ? `Sin conexión · ${pending} ${pending === 1 ? 'venta pendiente' : 'ventas pendientes'}` : 'Sin conexión'
    : pending > 0 ? `${pending} ${pending === 1 ? 'venta pendiente' : 'ventas pendientes'}` : 'En línea';
  const tone = !online ? 'text-amber-500' : pending > 0 ? 'text-gold' : 'text-[var(--text-secondary)]';

  return (
    <div className="flex items-center gap-1.5">
      <p aria-live="polite" className={`inline-flex items-center gap-2 text-sm font-medium ${tone}`} title={rejected.length ? rejected.map((r) => r.error).join(' · ') : undefined}>
        {online ? <span className={`h-2 w-2 rounded-full ${pending > 0 ? 'bg-gold' : 'bg-green-500'}`} aria-hidden /> : <CloudOff size={16} aria-hidden />}
        {(pending > 0 || !online) && <span className="sm:hidden" aria-hidden>{!online ? 'Sin conexión' : `${pending} sin enviar`}</span>}
        <span className={pending > 0 || !online ? 'sr-only sm:not-sr-only' : 'sr-only lg:not-sr-only'}>{label}</span>
        {rejected.length > 0 && <span className="sr-only">. {rejected.length} con error: {rejected.map((r) => r.error).join('. ')}</span>}
      </p>
      {pending > 0 && online && (
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="mv-focus inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--mv-panel-hover)] disabled:opacity-60"
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} aria-hidden />
          <span className="sr-only sm:not-sr-only">{syncing ? 'Sincronizando…' : 'Sincronizar'}</span>
        </button>
      )}
    </div>
  );
}

export default function POSHeader() {
  const pathname = usePathname();

  const links = [
    { name: 'Caja', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventario', href: '/dashboard/pos/inventory', icon: Package },
    { name: 'Reportes', href: '/dashboard/pos/reports', icon: LayoutDashboard },
    { name: 'Configuración', href: '/dashboard/pos/config', icon: Settings },
  ];

  const linkClass = (active: boolean) =>
    `mv-focus inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${
      active
        ? 'bg-[var(--mv-gold-wash)] text-gold ring-1 ring-inset ring-[color:var(--color-border-gold)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <nav
      aria-label="Secciones del POS"
      className="liquid-glass pt-safe sticky top-0 z-50 rounded-none border-x-0 border-t-0"
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="mv-focus flex shrink-0 items-center gap-2.5 rounded-xl" aria-label="Mercav POS, volver al panel">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-[var(--mv-on-gold)]">
              <Store size={18} aria-hidden />
            </span>
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-[var(--text-primary)] min-[420px]:inline">
              Mercav <span className="font-medium text-[var(--text-secondary)]">POS</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link href={link.href} aria-current={isActive ? 'page' : undefined} className={linkClass(isActive)}>
                    <Icon size={16} aria-hidden />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex shrink-0 items-center gap-2">
        <SyncStatus />
        <Link
          href="/dashboard"
          aria-label="Salir del POS al panel"
          className="mv-focus inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--mv-hairline-strong)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
        >
          <LogOut size={17} aria-hidden />
          <span className="hidden lg:inline">Salir</span>
        </Link>
        </div>
      </div>

      {/* Phone and small tablet: same sections, one swipeable row */}
      <ul className="scrollbar-hide flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={isActive ? 'page' : undefined} className={linkClass(isActive)}>
                <Icon size={16} aria-hidden />
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
// creado por pato dev y askforvini
