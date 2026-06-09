/** @type {import('tailwindcss').Config} */
/*
  NOTE: INFRAlock now uses a custom CSS design system (src/infralock.css)
  instead of Tailwind utility classes for all new components.
  Tailwind is kept in the build pipeline in case any third-party components
  or legacy files still rely on it.
*/
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
