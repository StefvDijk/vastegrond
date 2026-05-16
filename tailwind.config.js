/** @type {import('tailwindcss').Config} */
// VASTE GROND — Tailwind config (drop-in replacement)
// All colors map to CSS vars in index.css so theme switching just works.
// `darkMode: ['selector', '[data-theme="dark"]']` flips the entire token set.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          elevated: 'var(--paper-elevated)',
          deep: 'var(--paper-deep)',
          pure: 'var(--paper-pure)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faded: 'var(--ink-faded)',
          ghost: 'var(--ink-ghost)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
          soft: 'var(--line-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
          hover: 'var(--accent-hover)',
          glow: 'var(--accent-glow)',
        },
        positive: {
          DEFAULT: 'var(--positive)',
          soft: 'var(--positive-soft)',
        },
        negative: {
          DEFAULT: 'var(--negative)',
          soft: 'var(--negative-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
        },
      },
      fontFamily: {
        sans:  ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        // 'serif' alias mapt naar dezelfde sans-stack — clean & strak.
        serif: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono:  ['ui-monospace', '"SF Mono"', '"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Display (sans, tight semibold)
        'display-xl': ['56px', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-l':  ['44px', { lineHeight: '1.04', letterSpacing: '-0.030em', fontWeight: '600' }],
        'display-m':  ['32px', { lineHeight: '1.08', letterSpacing: '-0.024em', fontWeight: '600' }],
        'display-s':  ['24px', { lineHeight: '1.15', letterSpacing: '-0.018em', fontWeight: '600' }],
        // Title (sans)
        'title-xl':   ['34px', { lineHeight: '1.10', letterSpacing: '-0.022em', fontWeight: '600' }],
        'title-l':    ['22px', { lineHeight: '1.20', letterSpacing: '-0.018em', fontWeight: '600' }],
        'title-m':    ['17px', { lineHeight: '1.30', letterSpacing: '-0.014em', fontWeight: '600' }],
        // Body (sans)
        'body-l':     ['17px', { lineHeight: '1.45', letterSpacing: '-0.008em' }],
        'body-m':     ['15px', { lineHeight: '1.45', letterSpacing: '-0.005em' }],
        'body-s':     ['13px', { lineHeight: '1.40' }],
        caption:      ['11px', { lineHeight: '1.30', letterSpacing: '0.06em' }],
        // Mono
        'mono-l':     ['15px', { letterSpacing: '-0.01em' }],
        'mono-m':     ['13px', { letterSpacing: '-0.005em' }],
        'mono-s':     ['11px', { letterSpacing: '0.02em' }],
        // Aliases for v1 codebase
        'heading-l':  ['22px', { lineHeight: '1.20', letterSpacing: '-0.018em', fontWeight: '600' }],
        'heading-m':  ['17px', { lineHeight: '1.30', letterSpacing: '-0.014em', fontWeight: '600' }],
      },
      spacing: {
        's-1': 'var(--s-1)',   's-2': 'var(--s-2)',
        's-3': 'var(--s-3)',   's-4': 'var(--s-4)',
        's-5': 'var(--s-5)',   's-6': 'var(--s-6)',
        's-7': 'var(--s-7)',   's-8': 'var(--s-8)',
        's-9': 'var(--s-9)',   's-10': 'var(--s-10)',
        's-11': 'var(--s-11)', 's-12': 'var(--s-12)',
      },
      borderRadius: {
        xs:   'var(--r-xs)',
        s:    'var(--r-s)',
        m:    'var(--r-m)',
        l:    'var(--r-l)',
        xl:   'var(--r-xl)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        sheet: 'var(--shadow-sheet)',
        pop:   'var(--shadow-pop)',
        focus: 'var(--shadow-focus)',
        hairline: 'inset 0 0 0 0.5px var(--line)',
        'hairline-strong': 'inset 0 0 0 0.5px var(--line-strong)',
        'hairline-b': 'inset 0 -0.5px 0 var(--line)',
        'hairline-t': 'inset 0 0.5px 0 var(--line)',
      },
      maxWidth: {
        container: 'var(--container-max)',
      },
      backdropBlur: {
        ios: '40px',
      },
      backdropSaturate: {
        ios: '180%',
      },
      transitionTimingFunction: {
        out:    'cubic-bezier(0.16, 1, 0.30, 1)',
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        sheet:  'cubic-bezier(0.32, 0.72, 0, 1)',
        emph:   'cubic-bezier(0.20, 0, 0, 1)',
      },
      transitionDuration: {
        instant: '100ms',
        fast:    '180ms',
        base:    '260ms',
        slow:    '420ms',
        page:    '420ms',
        sheet:   '500ms',
      },
    },
  },
  plugins: [],
}
