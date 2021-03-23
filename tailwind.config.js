module.exports = {
  purge: {
    mode: 'all',
    content: [
      './src/index.html',
      './src/index.js',
      './src/index.css',
      './src/app.html',
      './src/app.js',
      './src/app.css'
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      body: ['Atkinson Hyperlegible'],
    },
    container: {
      center: true,
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
