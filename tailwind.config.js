/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f7f1',
          100: '#b3e8d3',
          200: '#80d9b5',
          300: '#4dca97',
          400: '#26be80',
          500: '#1D9E75',
          600: '#0F6E56',
          700: '#085041',
          800: '#04342C',
          900: '#021a16',
        },
        surface: {
          DEFAULT: '#FAFAF9',
          card:    '#FFFFFF',
          border:  '#E8E6E0',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-in':    'fadeIn 0.3s ease both',
        'bounce-dot': 'bounceDot 1.2s infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeUp:     { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:     { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        bounceDot:  { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-6px)' } },
        pulseSoft:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
}
