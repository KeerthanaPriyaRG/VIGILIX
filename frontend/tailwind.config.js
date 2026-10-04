/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#0a0e17',
          surface: '#111827',
          card: '#141d2e',
          cardHover: '#1a253a',
          border: '#1f293d',
          borderLight: '#2a3752',
          muted: '#64748b',
          text: '#f1f5f9',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
        },
        cyber: {
          blue: '#0284c7',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#8b5cf6',
          violet: '#6366f1',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
