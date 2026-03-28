/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#070B14',
          surface: '#0D1321',
          elevated: '#131929',
          border: '#1E2740',
          hover: '#1A2238',
        },
        accent: {
          900: '#2D1B69',
          700: '#4C2FAD',
          500: '#6C47D4',
          400: '#8B67E8',
          300: '#A98EF5',
          100: '#C4B5FD',
        },
        cyan: {
          500: '#06B6D4',
          400: '#22D3EE',
          300: '#67E8F9',
        },
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
          unknown: '#6B7280',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#475569',
          accent: '#A98EF5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
