import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy primary colors (kept for compatibility)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Luxury Design System - Oatmeal & Ink
        luxury: {
          // Canvas backgrounds (60% distribution)
          canvas: {
            light: '#F3EDE2',
            dark: '#1E1B2E',
          },
          // Surface / Containers (secondary structural components)
          surface: {
            light: '#D8D1C7',
            dark: '#2B2B2B',
          },
          // Primary Text / Ink (30% distribution)
          ink: {
            light: '#2B2B2B',
            dark: '#F3EDE2',
          },
          // Brand Accent / Gold (10% distribution)
          gold: {
            DEFAULT: '#C9A84C',
            light: '#E8D6B3',
          },
          // Muted contrast layer
          muted: {
            light: '#D8D1C7',
            dark: '#D8D1C7',
          },
          // Premium Semantic Alert Systems
          semantic: {
            success: {
              light: '#8FA89B',
              dark: '#5B7065',
            },
            warning: {
              light: '#D4A373',
              dark: '#9C6F46',
            },
            error: {
              light: '#C97A7A',
              dark: '#8C4E4E',
            },
          },
        },
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #F3EDE2 0%, #E8D6B3 100%)',
        'gradient-luxury-dark': 'linear-gradient(135deg, #1E1B2E 0%, #2B2B2B 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
