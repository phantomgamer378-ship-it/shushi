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
      colors: {
        background: "#090d16",
        foreground: "#f8fafc",
        card: "rgba(17, 24, 39, 0.75)",
        border: "rgba(255, 255, 255, 0.1)",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          glow: "rgba(99, 102, 241, 0.35)",
        },
        success: {
          DEFAULT: "#10b981",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.35)",
        },
        danger: {
          DEFAULT: "#ef4444",
          glow: "rgba(239, 68, 68, 0.35)",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 20px -3px var(--tw-shadow-color)",
      },
    },
  },
  plugins: [],
};
export default config;
