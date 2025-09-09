/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#f6e9fe',
        surface: '#fffaff',
        surfaceAlt: '#dcd3e8',
        ink: '#0e0c1d',
        muted: '#a298ad',
        primary: { 900: '#1b0947' },
        accent: { 100: '#fcc8c1', 200: '#fec6b2' },
        card: { tint: '#e7d9f9', tint2: '#f7ebfd' },
        border: '#e0d9e8',
      },
      borderRadius: {
        xl: '24px',
        lg: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(27, 9, 71, 0.06)',
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui'],
        sans: ['Inter', 'system-ui'],
      },
    }
  },
  plugins: []
}
