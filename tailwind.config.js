/** 這是Tailwind CSS的編譯時配置檔，在npm run build時使用
 */


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./**/*.js",
    "!./node_modules/**/*"
  ],
  safelist: [
    // brand（綠色）
    'bg-brand-50',
    'bg-brand-100',
    'bg-brand-200',
    'border-brand-200',
    'border-brand-600',
    'text-brand-600',
    'text-brand-800',
    'text-brand-900',
    'fill-brand-600',
    
    // blue
    'bg-blue-50',
    'border-blue-200',
    'text-blue-600',
    'fill-blue-600',
    'text-blue-800',
    
    // org（橘色）
    'bg-org-50',
    'border-org-200',
    'text-org-600',
    'fill-org-600',
    'text-org-800',
    
    // red
    'bg-red-50',
    'border-red-200',
    'text-red-600',
    'fill-red-600',
    'text-red-800',

    // 漸層
    'from-retro-dark/90',
    'via-retro-dark/30',
    'to-transparent',
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
        
        
        brand: {
          50: '#f0fdf4',   
          100: '#dcfce7',  
          200: '#bbf7d0',  
          300: '#86efac',  
          400: '#4ade80',  
          500: '#22c55e',  
          600: '#16a34a',  
          700: '#15803d',  
          800: '#166534',  
          900: '#14532d',  
        },
        
        org: {
          50: '#FEF7F2',
          100: '#FDE8DC',  
          200: '#f6b283',
          300: '#F4956C',  
          400: '#F17844', 
          500: '#E85D1F',  
          600: '#dc6d26',
          700: '#B34A12', 
          800: '#f15c18',
          900: '#6B2C0A', 
        },
        
        red: {
          50: '#f5efef',
          100: '#fee2e2',  
          200: '#fecaca',  
          300: '#fca5a5',  
          400: '#f87171',  
          500: '#ef4444',  
          600: '#dc2626',  
          700: '#b91c1c',  
          800: '#b40707',
          900: '#7f1d1d',  
        },
        
        blue: {
          50: '#eff6ff',   
          100: '#dbeafe',  
          200: '#286deb',
          300: '#93c5fd',  
          400: '#60a5fa',  
          500: '#3b82f6',  
          600: '#2563eb',  
          700: '#1d4ed8',  
          800: '#1e40af',  
          900: '#1e3a8a',  
        }
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
          '50%': { transform: 'rotate(3deg) scaleX(-1)' },
          '100%': { transform: 'rotate(-3deg) scaleX(-1)' }
        },
        bounceSlow: {
          '0%': { transform: 'translateY(0) rotate(-12deg)' },
          '50%': { transform: 'translateY(-10px) rotate(-12deg)' },
          '100%': { transform: 'translateY(0) rotate(-12deg)' }
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
        'spin': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}