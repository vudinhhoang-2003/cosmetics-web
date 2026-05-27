/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAF8',
        gold: '#C9A96E',
        'gold-light': '#E4C88A',
        'gold-dark': '#A07840',
        navy: '#1A1A2E',
        obsidian: '#0A0A12',
        beige: '#FDF8F2',
        pearl: '#F5F0EA',
        champagne: '#E8D5B0',
        'soft-gray': '#E8E8E0',
        'accent-brown': '#9B8860',
        'rose-gold': '#C4897A',
        'dark-text': '#2D2D2D',
        'muted-gray': '#8B8B8B',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Lato', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.35em',
        ultra: '0.5em',
      },
    },
  },
  plugins: [],
}
