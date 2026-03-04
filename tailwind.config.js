/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kraken': {
          cyan: '#00ffff',
          'cyan-dark': '#0088aa',
          'deep': '#001a1a',
          'dark': '#0a0a0a',
          'card': '#1a1a1a',
          'pink': '#ff00ff',
        },
      },
      fontFamily: {
        'display': ['Bebas Neue', 'Impact', 'sans-serif'],
        'body': ['Rajdhani', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { 
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.5)',
          },
          '50%': { 
            textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
}
