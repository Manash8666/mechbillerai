'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColorPalette } from '@/lib/colorExtractor';

export function BrandingLoader() {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadBranding = useCallback(async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return;

      const userData = JSON.parse(user);
      const response = await fetch(`/api/branding?userId=${userData.id}`);
      const branding = await response.json();

      if (branding.primaryColor && branding.primaryColor !== '#E5C07B') {
        // Generate full palette
        const palette = {
          primary: branding.primaryColor,
          secondary: branding.secondaryColor || '#ff6b4a',
          accent: branding.accentColor || branding.primaryColor,
          light: branding.light || branding.secondaryColor || branding.primaryColor,
          dark: branding.dark || branding.primaryColor,
          canvas: {
            light: branding.canvasLightColor || branding.canvasDarkColor || '#0b132b',
            dark: branding.canvasDarkColor || '#0b132b',
          },
          surface: {
            light: branding.surfaceLightColor || branding.surfaceDarkColor || '#16203d',
            dark: branding.surfaceDarkColor || '#16203d',
          },
          text: {
            light: branding.textLightColor || branding.textDarkColor || '#ededed',
            dark: branding.textDarkColor || '#ededed',
          },
        };

        // Apply theme
        applyTheme(palette);
        
        // Store for immediate use
        localStorage.setItem('brandingColors', JSON.stringify(palette));
        localStorage.setItem('garageName', branding.garageName || '');
        localStorage.setItem('logoUrl', branding.logoUrl || '');
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading branding:', error);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadBranding();

    // Listen for branding updates
    const handleBrandingUpdate = () => {
      void loadBranding();
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdate);

    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate);
    };
  }, [loadBranding]);

  const applyTheme = (palette: ColorPalette) => {
    // Create dynamic style element
    const styleId = 'custom-branding-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Generate CSS with custom colors
    const css = String.raw`
      :root {
        --custom-primary: ${palette.primary};
        --custom-secondary: ${palette.secondary};
        --custom-accent: ${palette.accent};
        --custom-canvas-light: ${palette.canvas.light};
        --custom-canvas-dark: ${palette.canvas.dark};
        --custom-surface-light: ${palette.surface.light};
        --custom-surface-dark: ${palette.surface.dark};
        --custom-text-light: ${palette.text.light};
        --custom-text-dark: ${palette.text.dark};
      }

      /* Override luxury colors with custom branding */
      .bg-luxury-gold {
        background-color: ${palette.primary} !important;
      }

      .text-luxury-gold {
        color: ${palette.primary} !important;
      }

      .border-luxury-gold {
        border-color: ${palette.primary} !important;
      }

      .hover\:bg-luxury-gold-light:hover {
        background-color: ${palette.light} !important;
      }

      .bg-luxury-canvas-light {
        background-color: ${palette.canvas.light} !important;
      }

      .dark .bg-luxury-canvas-dark {
        background-color: ${palette.canvas.dark} !important;
      }

      .bg-luxury-surface-light {
        background-color: ${palette.surface.light} !important;
      }

      .dark .bg-luxury-surface-dark {
        background-color: ${palette.surface.dark} !important;
      }

      .text-luxury-ink-light {
        color: ${palette.text.light} !important;
      }

      .dark .text-luxury-ink-dark {
        color: ${palette.text.dark} !important;
      }

      /* Focus rings */
      .focus\:ring-luxury-gold:focus {
        --tw-ring-color: ${palette.primary} !important;
      }

      /* Borders with opacity */
      .border-luxury-gold\/20 {
        border-color: ${palette.primary}33 !important;
      }

      .border-luxury-gold\/30 {
        border-color: ${palette.primary}4D !important;
      }

      .border-luxury-gold\/50 {
        border-color: ${palette.primary}80 !important;
      }

      /* Backgrounds with opacity */
      .bg-luxury-gold\/10 {
        background-color: ${palette.primary}1A !important;
      }

      .bg-luxury-gold\/20 {
        background-color: ${palette.primary}33 !important;
      }

      /* Hover states */
      .hover\:text-luxury-gold:hover {
        color: ${palette.primary} !important;
      }

      .hover\:border-luxury-gold:hover {
        border-color: ${palette.primary} !important;
      }

      .hover\:border-luxury-gold\/50:hover {
        border-color: ${palette.primary}80 !important;
      }

      /* Primary button styles */
      .bg-primary {
        background-color: ${palette.primary} !important;
      }

      .text-primary {
        color: ${palette.primary} !important;
      }

      .border-primary {
        border-color: ${palette.primary} !important;
      }

      .hover\:bg-primary\/90:hover {
        background-color: ${palette.primary}E6 !important;
      }

      .focus\:ring-primary:focus {
        --tw-ring-color: ${palette.primary} !important;
      }

      .border-primary\/50 {
        border-color: ${palette.primary}80 !important;
      }

      /* Primary foreground */
      .text-primary-foreground {
        color: ${palette.text.light} !important;
      }

      /* Card backgrounds */
      .bg-card {
        background-color: ${palette.surface.light} !important;
      }

      .dark .bg-card {
        background-color: ${palette.surface.dark} !important;
      }

      /* Muted backgrounds */
      .bg-muted\/50 {
        background-color: ${palette.canvas.light}80 !important;
      }

      .dark .bg-muted\/50 {
        background-color: ${palette.canvas.dark}80 !important;
      }

      .bg-muted\/30 {
        background-color: ${palette.canvas.light}4D !important;
      }

      .dark .bg-muted\/30 {
        background-color: ${palette.canvas.dark}4D !important;
      }
    `;

    styleElement.textContent = css;
  };

  return null; // This is a utility component, no visual output
}
