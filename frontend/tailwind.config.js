/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          dark: "#09090b", // zinc-950 canvas
          card: "#18181b", // zinc-900 elements
        },
        accent: {
          indigo: "#6366f1",
          violet: "#8b5cf6",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
