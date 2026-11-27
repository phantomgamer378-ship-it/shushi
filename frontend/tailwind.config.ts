import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        midnight: "#10172A",
        navy: "#18233D",
        brand: {
          DEFAULT: "#635BFF",
          hover: "#5249F5",
          light: "#817BFF",
          cyan: "#36C8E8",
          glow: "rgba(99, 91, 255, 0.25)",
        },
        surface: {
          light: "#F4F6FB",
          cardLight: "#FFFFFF",
          dark: "#10172A",
          cardDark: "#111827",
        },
        success: {
          DEFAULT: "#16A34A",
          glow: "rgba(22, 163, 74, 0.25)",
        },
        warning: {
          DEFAULT: "#EAAA24",
          glow: "rgba(234, 170, 36, 0.25)",
        },
        danger: {
          DEFAULT: "#DC4545",
          glow: "rgba(220, 69, 69, 0.25)",
        },
        neutral: "#64748B",
      },
      borderRadius: {
        input: "10px",
        btn: "10px",
        card: "16px",
        dialog: "20px",
        panel: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(16, 23, 42, 0.28)",
        "card-light": "0 4px 20px -2px rgba(16, 23, 42, 0.06)",
        "card-dark": "0 8px 30px -4px rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px -4px var(--tw-shadow-color)",
      },
    },
  },
  plugins: [],
};
export default config;
