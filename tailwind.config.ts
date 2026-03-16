import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        mercury: {
          ink: "#1a1a1a",
          paper: "#fafaf8",
          accent: "#c41e3a",
          muted: "#6b7280",
          border: "#e5e5e5",
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
