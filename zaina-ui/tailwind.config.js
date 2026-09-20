/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#E8F0F9', 100: '#D5E8F5', 500: '#2E75B6', 600: '#1B4F8A', 700: '#163d6b' },
        success: { 50: '#E6F9F1', 500: '#1D9E75', 600: '#178a63' },
        warning: { 50: '#FEF9E7', 500: '#F39C12' },
        danger:  { 50: '#FDEDEC', 500: '#E74C3C' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    },
  },
  plugins: [],
}
