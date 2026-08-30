/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#080a0e',
          900: '#0f131a',
          850: '#151a23',
          800: '#1b222d',
          700: '#273141',
          600: '#39465c',
          500: '#52627d',
          400: '#7c8ba1',
          300: '#a6b3c5',
          200: '#cbd5e1',
          100: '#e2e8f0',
          50: '#f8fafc',
        },
        accent: {
          DEFAULT: '#ff6a1a',
          50: '#fff5ed',
          100: '#ffe6d5',
          200: '#ffc8a8',
          300: '#ffa370',
          400: '#ff8533',
          500: '#ff6a1a',
          600: '#ea4e00',
          700: '#c23b00',
          800: '#9b3007',
          900: '#7e2a0b',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          light: '#dcf8c6',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 20px -2px rgba(15,19,26,0.06), 0 2px 6px -1px rgba(15,19,26,0.04)',
        'card-hover': '0 20px 35px -8px rgba(15,19,26,0.14), 0 10px 15px -3px rgba(15,19,26,0.08)',
        'accent-glow': '0 0 25px -4px rgba(255,106,26,0.35)',
        'accent-glow-lg': '0 10px 40px -10px rgba(255,106,26,0.45)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'dark-card': '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out 2s infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
        'road-dash': 'roadDash 1.2s linear infinite',
        'light-streak': 'lightStreak 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'shine-sweep': 'shineSweep 5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.03)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        roadDash: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        lightStreak: {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '30%': { opacity: 0.8 },
          '70%': { opacity: 0.8 },
          '100%': { transform: 'translateX(200%)', opacity: 0 },
        },
        shineSweep: {
          '0%, 20%': { transform: 'translateX(-120%) rotate(25deg)', opacity: 0 },
          '35%': { opacity: 0.4 },
          '50%': { transform: 'translateX(220%) rotate(25deg)', opacity: 0 },
          '100%': { transform: 'translateX(220%) rotate(25deg)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
