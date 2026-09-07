/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
        gov: {
          navy: '#0f172a',
          blue: '#1e3a8a',
          gold: '#d97706',
          emerald: '#059669',
          crimson: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}
