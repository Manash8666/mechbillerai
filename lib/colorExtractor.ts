// Color extraction and palette generation utilities

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;
  geekLime?: string;
  garageOrange?: string;
  deepGlass?: string;
  canvas: {
    light: string;
    dark: string;
  };
  surface: {
    light: string;
    dark: string;
  };
  text: {
    light: string;
    dark: string;
  };
}

// Convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Adjust color lightness
export function adjustLightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// Adjust color saturation
export function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// Check if color is light or dark
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

// Generate complementary color
export function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + 180) % 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// Generate analogous colors
export function getAnalogousColors(hex: string): [string, string] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex, hex];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const color1Hsl = { ...hsl, h: (hsl.h + 30) % 360 };
  const color2Hsl = { ...hsl, h: (hsl.h - 30 + 360) % 360 };

  const color1Rgb = hslToRgb(color1Hsl.h, color1Hsl.s, color1Hsl.l);
  const color2Rgb = hslToRgb(color2Hsl.h, color2Hsl.s, color2Hsl.l);

  return [
    rgbToHex(color1Rgb.r, color1Rgb.g, color1Rgb.b),
    rgbToHex(color2Rgb.r, color2Rgb.g, color2Rgb.b),
  ];
}

// Generate luxury palette from primary color (MotoBan Midnight Titanium & Gold System)
export function generateLuxuryPalette(primaryColor: string): ColorPalette {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) {
    // Fallback to Mobile Illuminated Gold
    primaryColor = '#E5C07B';
  }

  const isLight = isLightColor(primaryColor);

  // Generate secondary color (desaturated version)
  const secondary = adjustSaturation(adjustLightness(primaryColor, isLight ? -10 : 10), -20);

  // Generate accent color (more vibrant)
  const accent = adjustSaturation(primaryColor, 15);

  // Generate light variant
  const light = adjustLightness(adjustSaturation(primaryColor, -30), 35);

  // Generate dark variant
  const dark = adjustLightness(adjustSaturation(primaryColor, -10), -40);

  return {
    primary: primaryColor,
    secondary,
    accent,
    light,
    dark,
    geekLime: '#C9F31D',
    garageOrange: '#FF5E14',
    deepGlass: '#1C263D',
    canvas: {
      light: '#0B0F19',
      dark: '#0B0F19',
    },
    surface: {
      light: '#151D2F',
      dark: '#1C263D',
    },
    text: {
      light: '#FFFFFF',
      dark: '#FFFFFF',
    },
  };
}

// Extract dominant color from image data
export async function extractDominantColor(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Scale down for faster processing
        const scale = 0.1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Color counting
        const colorCount: { [key: string]: number } = {};
        const pixelSkip = 5; // Skip pixels for faster processing

        for (let i = 0; i < data.length; i += 4 * pixelSkip) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels and very light/dark pixels
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness > 250 || brightness < 10) continue;

          const hex = rgbToHex(r, g, b);
          colorCount[hex] = (colorCount[hex] || 0) + 1;
        }

        // Find most common color
        let dominantColor = '#C9A84C'; // Default gold
        let maxCount = 0;

        for (const [color, count] of Object.entries(colorCount)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }

        resolve(dominantColor);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

// Generate color variations for UI elements
export function generateColorVariations(baseColor: string) {
  return {
    base: baseColor,
    hover: adjustLightness(baseColor, -10),
    active: adjustLightness(baseColor, -15),
    disabled: adjustSaturation(adjustLightness(baseColor, 20), -40),
    subtle: adjustLightness(adjustSaturation(baseColor, -20), 25),
  };
}
