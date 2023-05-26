/** @type {import('tailwindcss').Config} */

const sans = [
  'Roboto',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'sans-serif',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol',
  'Noto Color Emoji',
];

module.exports = {
  mode: 'jit', // update this line
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        alternative: 'var(--color-alternative)',
        alternativeDark: 'var(--color-alternative-dark)',
        alternativeBright: 'var(--color-alternative-bright)',
        secondary: 'var(--color-secondary)',
        primaryDark: 'var(--color-primary-dark)',
        currentColor: 'var(--currentColor)',
        interYellow: 'var(--inter-yellow)',
        interOrange: 'var(--inter-orange)',
        mineShaft: 'var(--color-mineShaft)',
        interPurple: 'var(--inter-purple)',
      },
      boxShadow: {
        card: '0 22px 34px rgba(116,116,116,0.25)',
      },
      borderRadius: {
        10: '10px',
        20: '20px',
      },
      fontFamily: {
        sans,
        serif: [
          'Roboto Slab',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
        altSans: ['Mulish', ...sans],
      },
    },
  },
  plugins: [],
};
