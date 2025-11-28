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
        'retro-blue': '#1e40af',
        'retro-blue-light': '#3b82f6',
        'retro-yellow': '#fbbf24',
        'paper': '#f8f8f5',
      },
      fontFamily: {
        display: ['Chiron GoRound TC', 'Fredoka', 'cursive'],
        body: ['Chiron GoRound TC', 'Quicksand', 'sans-serif'],
        footer: ['Chiron GoRound TC', 'sans-serif']
      },
      backgroundImage: {
        'noise': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjhmOGY1Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')",
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      }
    },
  },
  plugins: [],
}
