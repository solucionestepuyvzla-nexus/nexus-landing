/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#070B14",
          surface: "#11192C",
          border: "#1E293B",
          accent: "#00E5FF",
          gold: "#FFB300",
          success: "#00E676",
          danger: "#FF3B30",
        }
      }
    },
  },
  plugins: [],
}

