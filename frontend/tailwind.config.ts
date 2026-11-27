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
        // Editorial Brutalist Palette (derived from reference image)
        pitch: "#0A0A0C",
        carbon: "#121214",
        surface: "#18181B",
        cream: "#EDE8DF",
        sand: "#F4F0EA",
        crimson: {
          DEFAULT: "#D72638",
          hover: "#BF1E2F",
          dark: "#8F101D",
        },
        border: {
          dark: "#27272A",
          light: "#D8D2C5",
        },
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-crimson": "4px 4px 0px 0px #D72638",
      },
    },
  },
  plugins: [],
};
export default config;
