/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Dynamic color classes for match statistics (blue = home, green = away)
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-900', 'bg-blue-950',
    'dark:bg-blue-800', 'dark:bg-blue-900', 'dark:bg-blue-950',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-900', 'bg-green-950',
    'dark:bg-green-800', 'dark:bg-green-900', 'dark:bg-green-950',
    'text-blue-700', 'text-blue-900', 'text-blue-100',
    'dark:text-blue-300', 'dark:text-blue-100',
    'text-green-700', 'text-green-900', 'text-green-100',
    'dark:text-green-300', 'dark:text-green-100',
    'border-blue-200', 'border-blue-800',
    'dark:border-blue-700', 'dark:border-blue-800',
    'border-green-200', 'border-green-800',
    'dark:border-green-700', 'dark:border-green-800',
    'hover:bg-blue-100', 'hover:bg-green-100',
    'dark:hover:bg-blue-900', 'dark:hover:bg-green-900',
    'border-b', 'border-gray-200', 'border-gray-700',
    'dark:border-gray-700',
  ],
}