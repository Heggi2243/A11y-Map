/** 這是Tailwind CSS的編譯時配置檔，在npm run build時使用
 */


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./**/*.js",
    "!./node_modules/**/*"
  ],
  theme: {
    extend: {
      colors: {
        'retro-blue': '#1e3a8a',
        'retro-blue-light': '#002fafff',
        'retro-yellow': '#fbbf24',
        'retro-paper': '#f8f8f5',
        'bodyBg': '#fdfbf7',
        'retro-lightBlue': '#3b82f6',
        'retro-dark': '#1e293b',
        // ✅ 正確:brand 要放在 colors 裡面
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },

      },
      fontFamily: {
        display: ['Chiron GoRound TC', 'Fredoka', 'cursive'],
        body: ['Chiron GoRound TC', 'Quicksand', 'sans-serif'],
        footer: ['Chiron GoRound TC', 'sans-serif'],
        sans: ['Chiron GoRound TC', 'Quicksand', 'sans-serif'],
      },
  
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        // ✅ 也把 fadeIn 移到 keyframes 裡面
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
        },
        wiggle: {
        '0%': { transform: 'rotate(-3deg) scaleX(-1)' },
        '50%' : { transform: 'rotate(3deg) scaleX(-1)' },
        '100%':{ transform: 'rotate(-3deg) scaleX(-1)' }
        },
        bounceSlow: {
        '0%': { transform: 'translateY(0) rotate(-12deg)' },
        '50%': { transform: 'translateY(-10px) rotate(-12deg)' },
        '100%':{ transform: 'translateY(0) rotate(-12deg)' }
      }

      },
      backgroundSize: {
        'checker': '20px 20px',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        pulseSlow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
        'spin':'spin 20s linear infinite',


      }
    },
  },
  plugins: [],
}



