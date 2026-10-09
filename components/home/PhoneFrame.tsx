import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Marco de celular para las demostraciones de la portada. La pantalla se arma con código, nunca con capturas. */
export function PhoneFrame({ children, screen, className }: { children: ReactNode; screen?: string; className?: string }) {
  return (
    <div className={cn("c-phone", className)}>
      <div className="c-phone-screen" style={{ "--screen": screen ?? "#111216" } as CSSProperties}>
        <div className="c-phone-island" aria-hidden />
        <div className="flex h-full flex-col px-4 pb-3 pt-3">
          <div className="flex items-center justify-between px-2 text-[0.7rem] font-semibold opacity-90" aria-hidden>
            <span>9:41</span>
            <span className="flex items-end gap-[2px]">
              {[3, 5, 7, 9].map((h) => (
                <span key={h} className="w-[3px] rounded-[1px] bg-current" style={{ height: h }} />
              ))}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
