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
        sentinel: {
          bg: '#090d16',
          panel: 'rgba(15, 23, 42, 0.75)',
          panelLight: 'rgba(255, 255, 255, 0.82)',
          border: '#1e293b',
          accent: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          cyan: '#06b6d4',
          violet: '#8b5cf6'
        }
      },
      boxShadow: {
        'brutal': '3px 3px 0px 0px #000000',
        'brutal-lg': '5px 5px 0px 0px #000000',
        'brutal-emerald': '4px 4px 0px 0px #10b981',
        'brutal-amber': '4px 4px 0px 0px #f59e0b',
        'brutal-rose': '4px 4px 0px 0px #f43f5e',
        'brutal-cyan': '4px 4px 0px 0px #06b6d4',
        'brutal-violet': '4px 4px 0px 0px #8b5cf6',
        'brutal-white': '4px 4px 0px 0px rgba(255, 255, 255, 0.9)',
        'glass-glow': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
