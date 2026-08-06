import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C4CF1",
          light: "#8B70FF",
          dark: "#4B32C3",
        },
        rank: {
          gold: "#F5B942",
          silver: "#B8C4D0",
          bronze: "#C97D48",
        },
      },
    },
  },
  plugins: [],
};

export default config;
