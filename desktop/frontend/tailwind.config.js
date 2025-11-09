/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jarvis-gold': {
          primary: '#FFB800',
          light: '#FFD966',
          dark: '#CC9300',
        },
        'arc-blue': '#00D9FF',
        'cyber-purple': '#9D4EDD',
        'success-green': '#00F5A0',
        'warning-orange': '#FF6B35',
        'error-red': '#FF006E',
        'deep-space': '#0A0E27',
        'dark-panel': '#1A1F3A',
        'elevation-1': '#252A4A',
        'elevation-2': '#2E3558',
      },
      fontFamily: {
        sans: ['HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        en: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'level-1': '0 2px 8px rgba(255, 184, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'level-2': '0 4px 16px rgba(255, 184, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.4)',
        'level-3': '0 8px 32px rgba(255, 184, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(255, 184, 0, 0.6), 0 0 40px rgba(255, 184, 0, 0.3), 0 0 60px rgba(255, 184, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
