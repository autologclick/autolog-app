import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2f7', 100: '#d5dfe9', 200: '#aabdd3', 300: '#7f9bbd', 400: '#5479a7', 500: '#1e3a5f', 600: '#1a3354', 700: '#152b48', 800: '#11223c', 900: '#0c1a30' },
        teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#0d9488', 600: '#0b7c72', 700: '#09655c', 800: '#074e46', 900: '#053730' },
        cream: { 50: '#fef7ed', 100: '#fdefd5', 200: '#fce0ab', 300: '#fbd081', 400: '#f9c157', 500: '#f8b12d' },
      },
      fontFamily: {
        sans: ['Heebo', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  safelist: [
    // Dynamic color classes used in components (StatCard, Sidebar, gradients)
    { pattern: /bg-(navy|teal|cream|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /text-(navy|teal|cream|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /border-(navy|teal|cream|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /from-(navy|teal|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /to-(navy|teal|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /via-(navy|teal|blue|green|red|orange|pink|yellow|indigo)-(50|100|200|300|400|500|600|700)/ },
    { pattern: /hover:bg-(navy|teal|blue|green|red|orange|pink|yellow|indigo)-(400|500|600|700)/ },
  ],
  plugins: [],
};

export default config;
