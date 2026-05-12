import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Calm, trust-building palette: soft teal-blue + sage green accents
        brand: {
          50: '#f0f7f7',
          100: '#daecec',
          200: '#b6d9d9',
          300: '#88bfbf',
          400: '#5ba1a3',
          500: '#3f8688',
          600: '#316c6f',
          700: '#2a565a',
          800: '#26474a',
          900: '#1f3a3d',
          950: '#102224',
        },
        accent: {
          50: '#f3f8f3',
          100: '#e2efe2',
          200: '#c5dfc6',
          300: '#9bc69d',
          400: '#6da571',
          500: '#4d8851',
          600: '#3a6c3f',
          700: '#305634',
          800: '#29462c',
          900: '#233a26',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 34, 36, 0.04), 0 4px 16px rgba(16, 34, 36, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
