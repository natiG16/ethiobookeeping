/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        amharic: ['"Noto Sans Ethiopic"', '"Abyssinica SIL"', 'Nyala', 'system-ui', 'sans-serif'],
        'amharic-display': ['"Noto Serif Ethiopic"', '"Noto Sans Ethiopic"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.03), 0 4px 20px rgb(15 23 42 / 0.06)',
        'card-hover': '0 12px 40px rgb(5 150 105 / 0.1), 0 4px 12px rgb(15 23 42 / 0.06)',
        glow: '0 0 32px rgb(16 185 129 / 0.2)',
        'inner-soft': 'inset 0 1px 0 rgb(255 255 255 / 0.8)',
        slick: '0 2px 8px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)',
      },
      backgroundImage: {
        'mesh-auth':
          'radial-gradient(at 40% 20%, rgb(16 185 129 / 0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(245 158 11 / 0.12) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(5 150 105 / 0.15) 0px, transparent 50%)',
        'mesh-app':
          'radial-gradient(at 0% 0%, rgb(16 185 129 / 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgb(245 158 11 / 0.05) 0px, transparent 40%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.45s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
