/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./views/**/*.ejs",
    "./views/*.ejs",
    "./public/*.js",
    "./public/**/*.ttf",
  ],
  theme: {
    extend: {
      fontFamily: {
        lobster : ["lobster", 'cursive', 'serif'],
        opensans: ["opensans", 'sans-serif'],
        opensansbold: ["opensansbold", "sans-serif"],
        opensansitalic: ["opensansitalic", "sans-serif"]
      }
    },
  },
  plugins: [],
}

