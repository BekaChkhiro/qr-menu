import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // ── Legacy shadcn aliases (kept for backward compat during Phase 10 migration) ──
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          soft: 'hsl(var(--accent-soft))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // ── Section H new tokens (T9.1) ───────────────────────────────────
        bg: 'hsl(var(--bg))',
        chip: 'hsl(var(--chip))',
        'border-soft': 'hsl(var(--border-soft))',
        'text-default': 'hsl(var(--text))',
        'text-muted': 'hsl(var(--text-muted))',
        'text-subtle': 'hsl(var(--text-subtle))',
        success: {
          DEFAULT: 'hsl(var(--success))',
          soft: 'hsl(var(--success-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          soft: 'hsl(var(--warning-soft))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          soft: 'hsl(var(--danger-soft))',
        },
      },

      // ── Section H border radii (replaces old `lg: var(--radius)` block) ──
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        card: '12px',  // default card radius per spec (between lg and xl)
        pill: '9999px',
      },

      // ── Section H shadows ─────────────────────────────────────────────
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.06)',
        sm: '0 2px 6px rgba(0, 0, 0, 0.06)',
        md: '0 6px 18px rgba(0, 0, 0, 0.08)',
        lg: '0 10px 30px rgba(0, 0, 0, 0.10)',
        xl: '0 20px 50px rgba(0, 0, 0, 0.12)',
      },

      // ── Tailwind's default 4px-base spacing already matches Section H ─
      // No override needed: 1=4px, 2=8px, 3=12px, 4=16px, 5=20px,
      // 6=24px, 8=32px, 10=40px, 12=48px, 16=64px all exist by default.

      // ── Section H font family ─────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },

      // ── Section H type scale ─────────────────────────────────────────
      // ADDITIVE: defaults are preserved (text-sm, text-xs etc. in 66 files).
      // Weights 450/550 not available as discrete Google Fonts Inter weights;
      // using 400, 500, 600, 700 (the closest available). Variable-font
      // approach would be needed for in-between weights.
      fontSize: {
        ...defaultTheme.fontSize,
        display: ['32px', { lineHeight: '1.15', letterSpacing: '-0.6px', fontWeight: '600' }],
        h1: ['22px', { lineHeight: '1.2', letterSpacing: '-0.3px', fontWeight: '600' }],
        h2: ['16px', { lineHeight: '1.3', letterSpacing: '-0.1px', fontWeight: '600' }],
        body: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.45', fontWeight: '500' }],
        overline: ['10.5px', { lineHeight: '1', letterSpacing: '0.6px', fontWeight: '700' }],
        mono: ['12px', { lineHeight: '1.5', fontWeight: '500' }],
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
