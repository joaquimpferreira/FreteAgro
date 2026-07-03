// Color tokens sourced from design-system/tokens.ts
// Background: #0D0D0D | Surface: #161616 | Primary: #22C55E

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#161616',
        primary: {
          DEFAULT: '#22C55E',
          50: '#e8fff0',
          100: '#6cffa0',
          200: '#1ef76a',
          400: '#22C55E',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
        // Additional semantic tokens for the dark theme
        border: '#1f1f1f',
        muted: '#6b7280',
        destructive: '#ef4444',
        white: '#ffffff',
      },
    },
  },
  plugins: [],
};
