import type { Config } from 'tailwindcss'
// Design tokens from the shared design-system directory
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { colors, borderRadius } = require('../design-system/tokens')

const config: Config = {
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
        // ── Design-system token palettes ─────────────────────────────────
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          ...colors.primary,
        },
        secondary: colors.secondary,
        success:   colors.success,
        warning:   colors.warning,
        error:     colors.error,
        grey:      colors.grey,
        surface: {
          bg:       'rgb(var(--surface-bg) / <alpha-value>)',
          card:     'rgb(var(--surface-card) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          overlay:  'rgb(var(--surface-overlay) / <alpha-value>)',
        },
        // ── shadcn/ui semantic tokens (CSS-variable based) ────────────────
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:    'hsl(var(--border))',
        input:     'hsl(var(--input))',
        ring:      'hsl(var(--ring))',
        'chart-1': 'hsl(var(--chart-1))',
        'chart-2': 'hsl(var(--chart-2))',
        'chart-3': 'hsl(var(--chart-3))',
        'chart-4': 'hsl(var(--chart-4))',
        'chart-5': 'hsl(var(--chart-5))',
        sidebar: {
          DEFAULT:               'hsl(var(--sidebar-background))',
          foreground:            'hsl(var(--sidebar-foreground))',
          primary:               'hsl(var(--sidebar-primary))',
          'primary-foreground':  'hsl(var(--sidebar-primary-foreground))',
          accent:                'hsl(var(--sidebar-accent))',
          'accent-foreground':   'hsl(var(--sidebar-accent-foreground))',
          border:                'hsl(var(--sidebar-border))',
          ring:                  'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        // shadcn uses rounded-lg/md/sm → CSS variable
        lg:    'var(--radius)',
        md:    'calc(var(--radius) - 2px)',
        sm:    'calc(var(--radius) - 4px)',
        // Design token radii (backward compat)
        input:  '8px',
        badge:  '8px',
        card:   borderRadius?.card ?? '10px',
        modal:  '16px',
        panel:  '24px',
        page:   '28px',
      },
      boxShadow: {
        sm:   '0px 1px 2px rgba(16, 24, 40, 0.05)',
        md:   '0px 4px 8px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.06)',
        lg:   '0px 12px 16px rgba(16, 24, 40, 0.08), 0px 4px 6px rgba(16, 24, 40, 0.03)',
        card: '0px 1px 3px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/container-queries')],
}

export default config
