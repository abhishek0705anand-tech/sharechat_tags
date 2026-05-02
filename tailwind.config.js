/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sc-orange': '#FF6B35',
        'sc-orange-dark': '#E55A2B',
        'sc-orange-light': '#FFF0EB',
        'heat-low': '#22C55E',
        'heat-medium': '#EAB308',
        'heat-high': '#EF4444',
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F8F9FA',
        'bg-elevated': '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'cat-sports': '#3B82F6',
        'cat-news': '#EF4444',
        'cat-entertainment': '#A855F7',
        'cat-politics': '#1E293B',
        'cat-technology': '#06B6D4',
        'cat-lifestyle': '#EC4899',
        'cat-devotional': '#F97316',
        'cat-finance': '#10B981',
      },
      animation: {
        'card-enter': 'cardEnter 0.4s ease-out forwards',
        'pulse-heat': 'pulseHeat 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'sheet-enter': 'sheetEnter 0.3s ease-out forwards',
      },
      keyframes: {
        cardEnter: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseHeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sheetEnter: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
