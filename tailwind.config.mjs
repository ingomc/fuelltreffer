import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Vereinsrot wie auf sc-oberfuellbach.de (red-700 als Hauptton)
        brand: colors.red,
        // Neutrale Töne der Mantine-Palette: gray für Hell, dark für Dunkel
        gray: {
          50: '#f8f9fa', 100: '#f1f3f5', 200: '#e9ecef', 300: '#dee2e6', 400: '#ced4da',
          500: '#adb5bd', 600: '#868e96', 700: '#495057', 800: '#343a40', 900: '#212529', 950: '#111315',
        },
        dark: {
          50: '#c9c9c9', 100: '#b8b8b8', 150: '#a6a6a6', 200: '#828282', 300: '#696969',
          400: '#424242', 500: '#3b3b3b', 600: '#2e2e2e', 700: '#242424', 800: '#1f1f1f', 900: '#141414',
        },
        win: { 400: '#69db7c', 700: '#237032' },
        loss: { 400: '#ff8787', 700: '#c92a2a' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        paper: '0 1px 3px rgb(0 0 0 / 0.05), 0 1px 2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
