/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  // 'class' plutôt que 'media' (défaut) : évite un crash de react-native-css-interop
  // sur le web, qui tente de piloter le color-scheme par programmation.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
