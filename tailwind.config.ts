import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 50: '#EAF1F9', 100: '#D2E0F0', 200: '#A6C1E1', 300: '#79A2D2', 400: '#4D83C3', 500: '#1B4E8A', 600: '#164173', 700: '#12345C', 800: '#0E2845', 900: '#091B2E' },
        teal: { 50: '#EAF2FC', 100: '#C8DDF6', 200: '#A1C6EF', 300: '#79AFE8', 400: '#5493DC', 500: '#2E77D0', 600: '#2563B0', 700: '#1D4F8F', 800: '#163C6E', 900: '#0E284D' },
        cream: { 50: '#FFF4EC', 100: '#FFE8D8', 200: '#FED0AC', 300: '#FDB47C', 400: '#FB923C', 500: '#F97316', 600: '#EA6A0B', 700: '#C2410C' },
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
