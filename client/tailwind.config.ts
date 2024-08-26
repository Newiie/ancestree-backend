import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundColor: {
        "primary": "#1b4a0aca",
        "hover": "#44de108f",
        "secondary-btn": "#a3e279",
        "paleGreen": "#hsl(96, 75%, 89%)",
        "white": "#FAFAFA",
        "black": "#010101"
      },
      colors: {
        "primary": "#1b4a0aca",
        "hover": "#44de108f",
        "paleGreen": "#hsl(96, 75%, 89%)",
        "white": "#FAFAFA",
        "black": "#010101",
        "nav": "#333333"
      },
      fontSize: {
        "header": "2.5rem",
        "h-15": "1.5rem",
      }
    },
  },
  plugins: [],
};
export default config;
