import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        treasure: { 50: '#ecfeff', 600: '#0f766e', 900: '#134e4a' }
      }
    }
  },
  plugins: []
} satisfies Config;
