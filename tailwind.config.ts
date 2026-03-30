import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "Cambria", "Times New Roman", "serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      colors: {
        mercury: {
          ink: "#1a1a1a",
          paper: "#ffffff",
          accent: "#c41e3a",
          muted: "#6b7280",
          rule: "#d1d5db",
          border: "#e5e7eb",
          highlight: "#fef3c7",
          dark: "#111827",
        },
        gnt: {
          dark: "#0a0a0a",
          surface: "#141414",
          accent: "#e63946",
          gold: "#d4a574",
          text: "#f5f5f5",
          muted: "#8a8a8a",
          rule: "#2a2a2a",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "72ch",
            color: "#1a1a1a",
            a: { color: "#c41e3a", textDecoration: "underline" },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
