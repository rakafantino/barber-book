export default {
  content: ["./index.html", "./App.{js,ts,jsx,tsx}", "./index.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./services/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        gold: {
          400: "#D4AF37",
          500: "#C5A028",
          600: "#B08D1E",
        },
        dark: {
          900: "#121212",
          800: "#1E1E1E",
          700: "#2D2D2D",
        },
      },
    },
  },
};
