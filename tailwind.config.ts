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
        // Semantic theme tokens mapping to luxury CSS variables
        background: 'var(--canvas-bg)',
        foreground: 'var(--ink-text)',
        card: {
          DEFAULT: 'var(--surface-bg)',
          foreground: 'var(--ink-text)',
        },
        border: 'color-mix(in srgb, var(--ink-text) 15%, transparent)',
        input: 'var(--surface-bg)',
        muted: {
          DEFAULT: 'color-mix(in srgb, var(--canvas-bg) 80%, var(--ink-text) 20%)',
          foreground: 'color-mix(in srgb, var(--ink-text) 60%, transparent)',
        },
        // Midnight Titanium & Illuminated Gold (MotoBan Universal Theme)
        luxury: {
          canvas: {
            light: '#0B0F19',
            dark: '#0B0F19',
          },
          surface: {
            light: '#151D2F',
            dark: '#1C263D',
            card: '#1C263D',
            highlight: '#243252',
          },
          ink: {
            light: '#FFFFFF',
            dark: '#FFFFFF',
            secondary: '#E2E8F0',
            muted: '#94A3B8',
          },
          gold: {
            DEFAULT: '#E5C07B',
            light: '#F3E5AB',
            dark: '#C9A84C',
          },
          muted: {
            light: '#243252',
            dark: '#1C263D',
          },
          semantic: {
            success: {
              light: '#10B981',
              dark: '#10B981',
            },
            warning: {
              light: '#F59E0B',
              dark: '#F59E0B',
            },
            error: {
              light: '#EF4444',
              dark: '#EF4444',
            },
          },
        },
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #151D2F 0%, #1C263D 100%)',
        'gradient-luxury-dark': 'linear-gradient(135deg, #0B0F19 0%, #151D2F 100%)',
        'gradient-balance': 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
