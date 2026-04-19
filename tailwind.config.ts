import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#dbaa3d",
          dark: "#b5831f",
        },
        slate: {
          950: "#121212",
          900: "#1a1a1a",
          800: "#2a2a2a",
        },
        marshall: {
          gold: "#dbaa3d",
          gold_dark: "#b5831f",
          gold_light: "#f4d189",
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      borderRadius: {
        '3xl': '32px',
      },
      boxShadow: {
        'gold': '0 10px 40px rgba(219, 170, 61, 0.25)',
      }
    },
  },
  plugins: [],
};
export default config;
