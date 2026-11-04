import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        gold: {
          DEFAULT: "var(--color-gold)",
          light: "var(--color-gold-light)",
          dim: "var(--color-gold-dim)",
        },
        techelet: {
          DEFAULT: "var(--color-techelet)",
          dim: "var(--color-techelet-dim)",
        },
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-tertiary": "var(--color-bg-tertiary)",
        "white-soft": "var(--color-white-soft)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulse3d: {
          "0%, 100%": { transform: "scale(1) rotateX(0deg)" },
          "50%": { transform: "scale(1.05) rotateX(5deg)" },
        },
        // Pantalla de carga (components/splash): la barra avanza rápido al principio y se frena antes del final,
        // porque no sabemos cuánto falta; el brillo la recorre para que nunca parezca trabada.
        "splash-fill": {
          "0%": { width: "4%" },
          "35%": { width: "48%" },
          "70%": { width: "76%" },
          "100%": { width: "93%" },
        },
        "splash-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
      },
      animation: {
        scanline: "scanline 4s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-3d": "pulse3d 8s ease-in-out infinite",
        "splash-fill": "splash-fill 9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
        "splash-sweep": "splash-sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [
    // `light:` targets the cream theme (the html element gets .light).
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};
export default config;
// creado por pato dev y askforvini
