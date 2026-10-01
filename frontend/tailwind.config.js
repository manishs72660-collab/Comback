/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (see src/index.css) so one set of classes serves
// both themes. Channels are stored as "r g b" so opacity modifiers still work.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    // top nav becomes a bottom dock below "nav" (860px)
    screens: {
      sm: "640px",
      md: "768px",
      nav: "860px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        // home page headline
        script: ['"Dancing Script"', "cursive"],
      },
      colors: {
        bg: token("bg"),
        panel: token("panel"),
        panel2: token("panel2"),
        ink: token("ink"),
        muted: token("muted"),
        accent: token("accent"),
        danger: token("danger"),
        line: "var(--line)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};
