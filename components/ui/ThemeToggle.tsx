"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "@/components/icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`mv-focus liquid-glass liquid-glass-clear relative group flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 w-11 h-11 sm:w-9 sm:h-9 rounded-full transition-[transform,color] duration-200 active:scale-95
        ${theme === "dark"
          ? "text-gray-300 hover:text-gold"
          : "text-gray-600 hover:text-amber-700"
        } ${className}`}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Glow effect on hover */}
      <div aria-hidden className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md ${
        theme === "dark" ? "bg-gold/20" : "bg-amber-300/30"
      }`} />
      
      <div aria-hidden className="relative z-10">
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px] motion-safe:group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <Moon className="h-[18px] w-[18px] motion-safe:group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
}
// creado por pato dev y askforvini
