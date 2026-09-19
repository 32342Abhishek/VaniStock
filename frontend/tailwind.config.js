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
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfd',
          400: '#8197fb',
          500: '#6171f6',
          600: '#4f52eb',
          700: '#4240d0',
          800: '#3737a8',
          900: '#323384',
          950: '#1e1d50',
        },
        surface: {
          900: '#0f0f1a',
          800: '#16162a',
          700: '#1e1e35',
          600: '#252542',
          500: '#2e2e52',
          400: '#3a3a65',
        },
        accent: {
          green: '#10d9a0',
          orange: '#ff9e3d',
          red: '#ff5757',
          blue: '#4da6ff',
          purple: '#b57bff',
          yellow: '#ffd166',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'wave': 'wave 1.2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(97, 113, 246, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(97, 113, 246, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
