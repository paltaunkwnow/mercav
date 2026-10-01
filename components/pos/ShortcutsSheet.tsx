"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['/', 'F2'], label: 'Ir al buscador' },
  { keys: ['F9', 'Ctrl/⌘ + Enter'], label: 'Cobrar' },
  { keys: ['+', '−'], label: 'Sumar o restar una unidad al último producto' },
  { keys: ['Esc'], label: 'Cerrar la ventana abierta' },
  { keys: ['?'], label: 'Ver estos atajos' },
];

export default function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="mv-menu relative w-full max-w-md rounded-[1.75rem] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="shortcuts-title" className="mv-h3">Atajos de teclado</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">No se activan mientras escribís en un campo, salvo F2 y F9.</p>
          </div>
          <button type="button" autoFocus onClick={onClose} aria-label="Cerrar atajos" className="mv-focus -mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={20} aria-hidden />
          </button>
        </div>
        <dl className="mt-5 divide-y divide-[var(--mv-hairline)]">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-[var(--text-primary)]">{s.label}</dt>
              <dd className="flex shrink-0 gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="mv-data inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[var(--mv-hairline-strong)] px-1.5 text-xs text-[var(--text-secondary)]">{k}</kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
