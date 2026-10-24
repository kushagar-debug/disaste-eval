/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          950: '#06090e',
          900: '#0a0f18',
          850: '#0e1624',
          800: '#141e30',
          700: '#1c2a42',
          600: '#2b3f61',
        },
        triage: {
          black: '#1e293b',
          red: '#ef4444',
          yellow: '#f59e0b',
          green: '#10b981',
        },
        hazard: {
          flood: '#0284c7',
          fire: '#ea580c',
          toxic: '#a855f7',
          seismic: '#f43f5e',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
