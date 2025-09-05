/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}", // keep while we migrate api routes later
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#F3F3E0",
          dark: "#133E87",
          primary: "#608BC1",
          muted: "#CBDCEB",
        },
      },
      fontFamily: {
        heading: ['var(--font-lora)', 'serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}