import type { Config } from 'tailwindcss'
// Design tokens from the shared design-system directory
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { colors, borderRadius, spacing } = require('../design-system/tokens')

const config: Config = {
  // Dark mode is toggled via a class on <html>
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary:   colors.primary,
        secondary: colors.secondary,
        success:   colors.success,
        warning:   colors.warning,
        error:     colors.error,
        grey:      colors.grey,
        // Surface tokens (dark backgrounds)
        surface: {
          bg:       '#0D0D0D',
          card:     '#161616',
          elevated: '#1E1E1E',
          overlay:  '#232323',
        },
      },
      borderRadius: {
        // Design token radii
        input:  '8px',
        badge:  '8px',
        card:   borderRadius?.card  ?? '10px',
        modal:  '16px',
        panel:  '24px',
        page:   '28px',
      },
      boxShadow: {
        sm:  '0px 1px 2px rgba(16, 24, 40, 0.05)',
        md:  '0px 4px 8px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.06)',
        lg:  '0px 12px 16px rgba(16, 24, 40, 0.08), 0px 4px 6px rgba(16, 24, 40, 0.03)',
        card: '0px 1px 3px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
