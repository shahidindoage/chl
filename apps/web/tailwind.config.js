/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#0a6cc2",
          600: "#075aa4",
          700: "#084a85",
          900: "#0b3357",
        },
        // League palette from the homepage design reference.
        navy: "#0c233c",
        pitch: {
          orange: "#f97316",
          "orange-dark": "#ea580c",
          cream: "#faf9f6",
          "cream-warm": "#faf7f0",
          "cream-soft": "#fcfbf9",
          "cta-wash": "#fbf8f3",
          pitch: "#093121",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
