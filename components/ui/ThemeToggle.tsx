"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`liquid-glass liquid-glass-clear relative group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 hover:scale-110
        ${theme === "dark"
          ? "text-gray-300 hover:text-gold"
          : "text-gray-600 hover:text-amber-700"
        } ${className}`}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Toggle theme"
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md ${
        theme === "dark" ? "bg-gold/20" : "bg-amber-300/30"
      }`} />
      
      <div className="relative z-10 transition-transform duration-500">
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px] group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="h-[18px] w-[18px] group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </div>
    </button>
  );
}
