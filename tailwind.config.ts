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
        // MotoBan v3.0.0 Brand Accents (Reactive High-Wavelength Energy)
        'geek-lime': {
          DEFAULT: '#C9F31D',
          hover: '#b8e214',
          glow: 'rgba(201, 243, 29, 0.35)',
        },
        'garage-orange': {
          DEFAULT: '#FF5E14',
          hover: '#e6510d',
          glow: 'rgba(255, 94, 20, 0.35)',
        },

        // MotoBan Deep Canvas & Surfaces
        'void-black': '#0B0F19',
        'navy-steel': '#151D2F',
        'deep-glass': '#1C263D',

        // Semantic & Functional Signals
        'cobalt-ai': '#2563EB',
        'emerald-sync': '#10B981',
        'amber-alert': '#F59E0B',
        'crimson-brake': '#EF4444',
        'royal-gold': '#E5C07B',

        // Neutral & Text Hierarchy
        'pure-white': '#FFFFFF',
        'cool-slate': '#94A3B8',
        'steel-dim': '#64748B',
        'dark-slate': '#334155',

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
        // Midnight Titanium & Illuminated Gold (MotoBan Universal Theme - backward-compatible)
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
          lime: {
            DEFAULT: '#C9F31D',
            hover: '#b8e214',
            dark: '#a8d110',
          },
          orange: {
            DEFAULT: '#FF5E14',
            hover: '#e6510d',
            dark: '#cc450a',
          },
          gold: {
            DEFAULT: '#E5C07B',
            light: '#F3E5AB',
            dark: '#C9A84C',
          },
          cobalt: {
            DEFAULT: '#2563EB',
            light: '#3b82f6',
            dark: '#1d4ed8',
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
        'gradient-hyper-biller': 'radial-gradient(circle at 50% 30%, rgba(201, 243, 29, 0.15) 0%, rgba(11, 15, 25, 0) 70%)',
        'gradient-exhaust-heat': 'linear-gradient(135deg, #C9F31D 0%, #FF5E14 100%)',
        'gradient-cobalt-ai': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #151D2F 0%, #1C263D 100%)',
        'gradient-luxury-dark': 'linear-gradient(135deg, #0B0F19 0%, #151D2F 100%)',
        'gradient-balance': 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      },
      boxShadow: {
        'lime-glow': '0 0 35px -5px rgba(201, 243, 29, 0.35)',
        'orange-glow': '0 0 35px -5px rgba(255, 94, 20, 0.35)',
        'cobalt-glow': '0 0 35px -5px rgba(37, 99, 235, 0.35)',
        'gold-glow': '0 0 35px -5px rgba(229, 192, 123, 0.25)',
        'frosted-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
};
export default config;

