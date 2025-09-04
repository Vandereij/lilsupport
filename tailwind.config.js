/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#CBDCEB',
          DEFAULT: '#608BC1',
          dark: '#133E87',
          background: '#F3F3E0',
        },
      },
    },
  },
  plugins: [],
}