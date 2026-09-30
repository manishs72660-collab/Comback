/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#12162b",
        // cobalt: main brand colour
        brand: {
          50: "#eef0ff",
          100: "#e0e4ff",
          200: "#c4cbff",
          300: "#9ba6ff",
          400: "#6f7dfb",
          500: "#4557f5",
          600: "#3446f0",
          700: "#2a37d0",
          800: "#242fa6",
          900: "#1f2882",
        },
        // highlighter yellow: streaks and progress
        hi: {
          300: "#ffe27a",
          400: "#ffd84a",
          500: "#f5c400",
          700: "#8a6d00",
        },
        // dark mode surfaces
        night: {
          900: "#0d1226",
          800: "#151b36",
          700: "#1d2545",
          600: "#283056",
        },
        // light mode surfaces
        paper: {
          50: "#fafbfd",
          100: "#f3f5f9",
          200: "#e6eaf3",
        },
      },
      boxShadow: {
        lift: "0 1px 2px rgba(18,22,43,.05), 0 10px 28px -14px rgba(18,22,43,.22)",
      },
    },
  },
  plugins: [],
};
