/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        text: {
          DEFAULT: 'hsl(var(--text) / <alpha-value>)',
          muted: 'hsl(var(--text-muted) / <alpha-value>)',
          subtle: 'hsl(var(--text-subtle) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          fg: 'hsl(var(--accent-fg) / <alpha-value>)',
        },
        danger: 'hsl(var(--danger) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        ios: '14px',
        'ios-lg': '20px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        sheet: '0 10px 30px -10px rgb(0 0 0 / 0.2)',
      },
    },
  },
  plugins: [],
}
