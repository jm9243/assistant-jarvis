/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jarvis: {
          primary: '#FFB800',
          gold: '#FFB800',
          'gold-dark': '#CC9300',
          space: '#0A0E27',
          'space-light': '#0E1533',
          panel: '#1A1F3A',
          'panel-light': '#252A4A',
          text: '#FFFFFF',
          'text-secondary': '#A8B2D1',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(255, 184, 0, 0.7)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 0 10px rgba(255, 184, 0, 0)',
          },
        },
      },
    },
  },
  plugins: [],
};
