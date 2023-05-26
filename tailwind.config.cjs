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
        primary: 'rgba(var(--color-primary), <alpha-value>)',
        secondary: 'rgba(var(--color-secondary), <alpha-value>)',
        alternative: 'rgba(var(--color-alternative), <alpha-value>)',
        alert: 'rgba(var(--color-alert), <alpha-value>)',
        interYellow: 'rgba(var(--inter-yellow), <alpha-value>)',
        interOrange: 'rgba(var(--inter-orange), <alpha-value>)',
        interPurple: 'rgba(var(--inter-purple), <alpha-value>)',
        interGreen: 'rgba(var(--inter-green), <alpha-value>)',
        disabled: 'rgba(var(--color-disabled), <alpha-value>)',
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
