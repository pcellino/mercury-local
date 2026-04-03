import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
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
          dark: "#1a1210",
          surface: "#231c17",
          accent: "#c5303a",
          gold: "#d4a574",
          text: "#f5e6d3",
          muted: "#8a7e72",
          rule: "#3d3028",
          cream: "#f5e6d3",
        },
        sf: {
          cream: "#faf8f5",
          ink: "#2a2218",
          terra: "#a65b3c",
          surface: "#f3efe9",
          muted: "#7a7164",
          rule: "#e2ddd5",
          highlight: "#fef3c7",
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
