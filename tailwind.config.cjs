/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ED1E28",
        secondary: "#B6252A",
        neutral: {
          dark: "#55565B",
          light: "#959597",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}


