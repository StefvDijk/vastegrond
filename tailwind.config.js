/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          elevated: 'var(--paper-elevated)',
          deep: 'var(--paper-deep)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faded: 'var(--ink-faded)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
          hover: 'var(--accent-hover)',
        },
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-l': ['40px', { lineHeight: '1.10', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-m': ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-l': ['24px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-m': ['18px', { lineHeight: '1.35', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-l': ['17px', { lineHeight: '1.5' }],
        'body-m': ['15px', { lineHeight: '1.5' }],
        'body-s': ['14px', { lineHeight: '1.45' }],
        caption: ['12px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
      },
      spacing: {
        's-1': 'var(--s-1)',
        's-2': 'var(--s-2)',
        's-3': 'var(--s-3)',
        's-4': 'var(--s-4)',
        's-5': 'var(--s-5)',
        's-6': 'var(--s-6)',
        's-7': 'var(--s-7)',
        's-8': 'var(--s-8)',
        's-9': 'var(--s-9)',
        's-10': 'var(--s-10)',
        's-11': 'var(--s-11)',
        's-12': 'var(--s-12)',
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        s: 'var(--r-s)',
        m: 'var(--r-m)',
        l: 'var(--r-l)',
        pill: 'var(--r-pill)',
      },
      maxWidth: {
        container: 'var(--container-max)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        sheet: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        page: '300ms',
        sheet: '350ms',
      },
    },
  },
  plugins: [],
}
