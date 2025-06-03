/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        foreground: "#ededed",
        primary: "#8b5cf6",
        "primary-foreground": "#ffffff",
        secondary: "#1e1e1e",
        "secondary-foreground": "#a3a3a3",
        accent: "#6d28d9",
        "accent-foreground": "#ffffff",
        border: "#333333",
        input: "#1e1e1e",
        ring: "#8b5cf6",
      },
    },
  },
  plugins: [],
};
