import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Teal inspired by Mediterranean sea + Tunisian red accent
        primary: {
          50: "#eefbfa",
          100: "#d6f5f3",
          200: "#b1eae8",
          300: "#7cd9d7",
          400: "#40c0bf",
          500: "#24a5a5",
          600: "#0a8f8c",
          700: "#0b6f6e",
          800: "#0d5958",
          900: "#0f4a4a",
        },
        accent: {
          500: "#e70013",
          600: "#c40010",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
