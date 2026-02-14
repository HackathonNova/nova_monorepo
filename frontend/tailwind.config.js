/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#06080d',
        primary: '#00f0ff',
        secondary: '#7c3aed',
        accent: '#22d3ee',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        alert: '#ff2a6d',
        'bg-dark': '#0b0f16',
        'surface-dark': '#0f172a',
        'border-dim': 'rgba(255,255,255,0.12)',
        'glass-bg': 'rgba(17, 25, 40, 0.75)',
        'glass-border': 'rgba(255, 255, 255, 0.125)',
        'neon-blue': '#00f3ff',
        'neon-purple': '#bd00ff',
        'alert-red': '#ff2a6d',
        'alert-yellow': '#ffc107'
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 10s linear infinite',
        'scanline': 'scanline 6s linear infinite',
      }
    },
  },
  plugins: [],
}
