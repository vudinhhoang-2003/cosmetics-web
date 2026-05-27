/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAF8',
        gold: '#C9A96E',
        navy: '#1A1A2E',
        beige: '#FDF8F2',
        'soft-gray': '#E8E8E0',
        'accent-brown': '#9B8860',
        'dark-text': '#2D2D2D',
        'muted-gray': '#8B8B8B',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Lato', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
