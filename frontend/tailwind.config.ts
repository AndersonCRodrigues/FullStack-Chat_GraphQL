// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Inclui src
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Para compatibilidade se você mover algo para raiz do app
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Para compatibilidade
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Para compatibilidade
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;