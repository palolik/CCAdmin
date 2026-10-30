/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

// Admin palette: three colours only.
//   brand  (blue)  — primary actions, links, active / done states
//   ink    (slate) — text, borders, backgrounds, neutral buttons, waiting states
//   danger (red)   — delete, reject, errors
// Every other Tailwind colour is folded into one of them, so existing classes
// like bg-green-100 or text-indigo-600 follow the palette. Change a colour
// here and the whole admin follows.
const brand = colors.blue;
const ink = colors.slate;
const danger = colors.red;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand, ink, danger,
        blue: brand, indigo: brand, violet: brand, purple: brand, fuchsia: brand,
        sky: brand, cyan: brand, teal: brand, emerald: brand, green: brand, lime: brand,
        slate: ink, gray: ink, zinc: ink, neutral: ink, stone: ink,
        amber: ink, yellow: ink, orange: ink,
        red: danger, rose: danger, pink: danger,
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], 
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        marquee: "marquee 8s linear infinite",
      },
      keyframes: {                              // ← moved inside extend
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  // daisyUI components (btn, badge, …) use the same palette and button shape.
  daisyui: {
    themes: [{
      light: {
        ...require('daisyui/src/theming/themes')['[data-theme=light]'],
        primary: ink[900],
        'primary-content': '#ffffff',
        secondary: ink[800],
        'secondary-content': '#ffffff',
        accent: brand[500],
        neutral: ink[800],
        'neutral-content': '#ffffff',
        info: brand[500],
        success: brand[600],
        warning: ink[500],
        error: danger[600],
        '--rounded-btn': '0.5rem',
        '--btn-text-case': 'none',
      },
    }],
  },
}