/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          gold: '#FFB800',
          goldLight: '#FFD966',
          goldDark: '#CC9300',
          blue: '#00D9FF',
          purple: '#9D4EDD',
          success: '#00F5A0',
          warning: '#FF6B35',
          error: '#FF006E',
          deep: '#050714',
          panel: '#0A0E27',
          overlay: '#10152A',
        },
      },
      fontFamily: {
        heading: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
        body: ['"HarmonyOS Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
      boxShadow: {
        'jarvis-glow': '0 10px 30px rgba(255, 184, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
