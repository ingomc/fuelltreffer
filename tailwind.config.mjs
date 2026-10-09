import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: colors.indigo,
        win: colors.emerald,
        loss: colors.rose,
        draw: colors.amber,
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk Variable"', '"Inter Variable"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: '0 1px 2px rgb(9 9 11 / 0.04), 0 1px 3px rgb(9 9 11 / 0.04)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.25), 0 8px 32px -8px rgb(99 102 241 / 0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
