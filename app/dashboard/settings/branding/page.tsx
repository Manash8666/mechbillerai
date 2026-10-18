'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Palette, Save, RotateCcw, Sparkles, QrCode, Trash2, CheckCircle2, IndianRupee, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import PearlButton from '@/components/PearlButton';
import {
  extractDominantColor,
  generateLuxuryPalette,
  type ColorPalette,
} from '@/lib/colorExtractor';

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    garageName: '',
    logoUrl: '',
    paymentQrUrl: '',
    upiId: '',
    primaryColor: '#E5C07B',
    subdomain: '',
  });
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      void fetchBranding(parsedUser.id);
    }
  }, []);

  const fetchBranding = async (userId: string) => {
    try {
      const response = await fetch(`/api/branding?userId=${userId}`);
      const data = await response.json();
      
      if (data) {
        setFormData({
          garageName: data.garageName || '',
          logoUrl: data.logoUrl || '',
          paymentQrUrl: data.paymentQrUrl || '',
          upiId: data.upiId || '',
          primaryColor: data.primaryColor || '#E5C07B',
          subdomain: data.subdomain || '',
        });
        
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }

        if (data.paymentQrUrl) {
          setPaymentQrPreview(data.paymentQrUrl);
        }

        if (data.primaryColor) {
          const palette = generateLuxuryPalette(data.primaryColor);
          setGeneratedPalette(palette);
        }
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPaymentQrPreview(result);
        setFormData((prev) => ({ ...prev, paymentQrUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePaymentQr = () => {
    setPaymentQrFile(null);
    setPaymentQrPreview('');
    setFormData((prev) => ({ ...prev, paymentQrUrl: '' }));
    toast.success('Payment QR removed');
  };

  const handleExtractColors = async () => {
    if (!logoFile) {
      toast.error('Please upload a logo first');
      return;
    }

    setExtracting(true);
    try {
      const dominantColor = await extractDominantColor(logoFile);
      setFormData({ ...formData, primaryColor: dominantColor });
      
      const palette = generateLuxuryPalette(dominantColor);
      setGeneratedPalette(palette);
      
      toast.success('Colors extracted successfully!');
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast.error('Failed to extract colors');
    } finally {
      setExtracting(false);
    }
  };

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, primaryColor: color });
    const palette = generateLuxuryPalette(color);
    setGeneratedPalette(palette);
  };

  const applyThemeImmediately = (palette: ColorPalette) => {
    // Create or update dynamic style element
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

      /* Primary foreground */
      .text-primary-foreground {
        color: ${palette.text.light} !important;
      }
    `;

    styleElement.textContent = css;
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let logoUrl = formData.logoUrl;

      // Upload logo if new file selected
      if (logoFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('logo', logoFile);
        uploadFormData.append('userId', user.id);

        const uploadResponse = await fetch('/api/upload/logo', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          logoUrl = uploadData.url;
        }
        setUploading(false);
      }

      let paymentQrUrl = formData.paymentQrUrl;

      // Upload payment QR if new file selected
      if (paymentQrFile) {
        setUploadingQr(true);
        const qrFormData = new FormData();
        qrFormData.append('qrImage', paymentQrFile);
        qrFormData.append('upiId', formData.upiId || '');

        const qrResponse = await fetch('/api/upload/payment-qr', {
          method: 'POST',
          body: qrFormData,
        });

        const qrData = await qrResponse.json();
        if (qrData.success && qrData.paymentQrUrl) {
          paymentQrUrl = qrData.paymentQrUrl;
        }
        setUploadingQr(false);
      }

      // Save branding settings
      const brandingData = {
        userId: user.id,
        garageName: formData.garageName,
        subdomain: formData.subdomain,
        logoUrl,
        paymentQrUrl,
        upiId: formData.upiId || null,
        primaryColor: formData.primaryColor,
        secondaryColor: generatedPalette?.secondary,
        accentColor: generatedPalette?.accent,
        canvasLightColor: generatedPalette?.canvas.light,
        canvasDarkColor: generatedPalette?.canvas.dark,
        surfaceLightColor: generatedPalette?.surface.light,
        surfaceDarkColor: generatedPalette?.surface.dark,
        textLightColor: generatedPalette?.text.light,
        textDarkColor: generatedPalette?.text.dark,
      };

      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingData),
      });

      if (response.ok) {
        toast.success('Branding saved successfully!');
        
        // Store in localStorage for immediate theme & payment update
        if (paymentQrUrl) {
          localStorage.setItem('paymentQrUrl', paymentQrUrl);
        } else {
          localStorage.removeItem('paymentQrUrl');
        }
        if (formData.upiId) {
          localStorage.setItem('upiId', formData.upiId);
        }

        if (generatedPalette) {
          localStorage.setItem('brandingColors', JSON.stringify(generatedPalette));
          localStorage.setItem('garageName', formData.garageName);
          localStorage.setItem('logoUrl', logoUrl);
          
          // Apply theme immediately
          applyThemeImmediately(generatedPalette);
          
          // Dispatch event to reload branding in other components
          window.dispatchEvent(new Event('brandingUpdated'));
        }
      } else {
        throw new Error('Failed to save branding');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultPalette = generateLuxuryPalette('#C9A84C');
    
    setFormData({
      garageName: '',
      logoUrl: '',
      primaryColor: '#C9A84C',
      subdomain: formData.subdomain,
    });
    setLogoFile(null);
    setLogoPreview('');
    setGeneratedPalette(defaultPalette);
    
    // Remove from localStorage
    localStorage.removeItem('brandingColors');
    localStorage.removeItem('garageName');
    localStorage.removeItem('logoUrl');
    
    // Remove custom styles to revert to default
    const styleElement = document.getElementById('custom-branding-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Dispatch event to reset branding
    window.dispatchEvent(new Event('brandingUpdated'));
    
    toast.success('Reset to default theme');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
          Branding & Customization
        </h1>
        <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
          Upload your logo and customize your garage&apos;s brand colors
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Upload & Settings */}
        <div className="space-y-6">
          {/* Garage Info */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
            <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
              Garage Information
            </h2>
            <div>
              <label
                htmlFor="garage-name-input"
                className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2"
              >
                Garage Name
              </label>
              <input
                id="garage-name-input"
                type="text"
                value={formData.garageName}
                onChange={(e) =>
                  setFormData({ ...formData, garageName: e.target.value })
                }
                className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark"
                placeholder="Enter your garage name"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-luxury-gold/10">
              <label
                htmlFor="subdomain-input"
                className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-1"
              >
                Custom Multi-Tenant Subdomain
              </label>
              <p className="text-xs text-luxury-muted-light dark:text-luxury-muted-dark mb-2">
                Your workshop’s dedicated portal for customer service booking and live vehicle inspection tracking.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    id="subdomain-input"
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark font-mono text-sm"
                    placeholder="e.g. motofit or speedy"
                  />
                  <span className="absolute right-3 text-xs font-mono text-luxury-gold font-semibold">
                    .motoban.in
                  </span>
                </div>
                {formData.subdomain && (
                  <a
                    href={`https://${formData.subdomain}.motoban.in`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1"
                  >
                    Visit Portal ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
            <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
              Logo Upload
            </h2>

            <div className="space-y-4">
              {logoPreview && (
                <div className="flex justify-center p-4 bg-luxury-canvas-light dark:bg-luxury-canvas-dark rounded-lg">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={180}
                    height={80}
                    unoptimized
                    className="max-h-32 object-contain"
                  />
                </div>
              )}

              <label className="flex flex-col items-center px-4 py-6 bg-luxury-canvas-light dark:bg-luxury-canvas-dark rounded-lg border-2 border-dashed border-luxury-gold/30 cursor-pointer hover:border-luxury-gold transition-colors">
                <Upload className="h-12 w-12 text-luxury-gold mb-2" />
                <span className="text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Click to upload logo
                </span>
                <span className="text-xs text-luxury-ink-light/50 dark:text-luxury-ink-dark/50">
                  PNG, JPG, SVG up to 5MB
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>

              <button
                onClick={handleExtractColors}
                disabled={!logoFile || extracting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-luxury-gold/10 text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-ink-light border border-luxury-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Sparkles className="h-5 w-5" />
                <span>{extracting ? 'Extracting...' : 'Extract Colors from Logo'}</span>
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
            <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-luxury-gold" />
              Primary Brand Color
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-20 h-20 rounded-lg cursor-pointer border-2 border-luxury-gold/30"
                />
                <div className="flex-1">
                  <label
                    htmlFor="hex-code-input"
                    className="block text-sm font-medium text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-2"
                  >
                    Hex Code
                  </label>
                  <input
                    id="hex-code-input"
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark font-mono"
                    placeholder="#C9A84C"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Workshop Payment QR Scanner (GPay / PhonePe / Paytm / Personal Standee) */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-luxury-gold" />
                  Payment QR Scanner (GPay / PhonePe / Paytm)
                </h2>
                <p className="text-xs text-luxury-muted-light dark:text-luxury-muted-dark mt-1">
                  Upload your counter standee photo or personal UPI QR. It will automatically be printed on all SoW Bills, Estimates, and Invoices.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                Auto-Printed on Bills
              </span>
            </div>

            <div className="space-y-4">
              {/* QR Image Preview or Upload Dropzone */}
              {paymentQrPreview ? (
                <div className="p-4 bg-luxury-canvas-light dark:bg-luxury-canvas-dark rounded-xl border border-luxury-gold/30 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative p-2 bg-white rounded-xl shadow-md border border-gray-200">
                    <img
                      src={paymentQrPreview}
                      alt="Workshop Payment QR"
                      className="w-32 h-32 object-contain rounded-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active on Invoices & SOW Bills
                    </div>
                    <p className="text-xs text-luxury-muted-light dark:text-luxury-muted-dark">
                      This QR image is active and will be rendered directly inside the Payment Acceptance card on all your customer PDFs.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                      <label className="cursor-pointer text-xs font-bold text-luxury-gold hover:underline">
                        Change Standee Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePaymentQrChange}
                        />
                      </label>
                      <span className="text-muted-foreground text-xs">·</span>
                      <button
                        type="button"
                        onClick={handleRemovePaymentQr}
                        className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove QR
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 bg-luxury-canvas-light dark:bg-luxury-canvas-dark rounded-xl border-2 border-dashed border-luxury-gold/30 cursor-pointer hover:border-luxury-gold transition-colors text-center group">
                  <div className="w-12 h-12 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold mb-3 group-hover:scale-105 transition-transform">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-1">
                    Upload GPay / PhonePe / Paytm Standee Photo
                  </span>
                  <span className="text-xs text-luxury-muted-light dark:text-luxury-muted-dark max-w-xs mb-2">
                    Take a photo of your counter standee or upload a screenshot of your personal QR
                  </span>
                  <span className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold rounded-lg text-xs font-medium border border-luxury-gold/20">
                    PNG, JPG, WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePaymentQrChange}
                  />
                </label>
              )}

              {/* UPI ID Field */}
              <div>
                <label
                  htmlFor="upi-id-input"
                  className="block text-xs font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-1"
                >
                  Workshop UPI ID / VPA (Optional)
                </label>
                <div className="relative">
                  <input
                    id="upi-id-input"
                    type="text"
                    value={formData.upiId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, upiId: e.target.value.trim() })
                    }
                    className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark font-mono text-sm"
                    placeholder="e.g. motofit@okhdfcbank or 9876543210@paytm"
                  />
                </div>
                <p className="text-[11px] text-luxury-muted-light dark:text-luxury-muted-dark mt-1">
                  Printed as text on the bill so customers can type your UPI address manually if needed.
                </p>
              </div>

              {/* Supported Apps Badges */}
              <div className="pt-2 border-t border-luxury-gold/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">Supported payment apps:</span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">Google Pay</span>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded border border-purple-500/20">PhonePe</span>
                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded border border-sky-500/20">Paytm</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">BHIM UPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {/* Generated Palette */}
          {generatedPalette && (
            <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
              <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
                Generated Luxury Palette
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <ColorSwatch label="Primary" color={generatedPalette.primary} />
                <ColorSwatch label="Secondary" color={generatedPalette.secondary} />
                <ColorSwatch label="Accent" color={generatedPalette.accent} />
                <ColorSwatch label="Light" color={generatedPalette.light} />
                <ColorSwatch label="Canvas (Light)" color={generatedPalette.canvas.light} />
                <ColorSwatch label="Canvas (Dark)" color={generatedPalette.canvas.dark} />
                <ColorSwatch label="Surface (Light)" color={generatedPalette.surface.light} />
                <ColorSwatch label="Surface (Dark)" color={generatedPalette.surface.dark} />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
            <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
              UI Preview
            </h2>

            <div
              className="rounded-lg p-6 space-y-4"
              style={{ backgroundColor: generatedPalette?.canvas.light || '#F3EDE2' }}
            >
              {logoPreview && (
                <div className="flex justify-center mb-4">
                  <Image src={logoPreview} alt="Logo" width={120} height={64} unoptimized className="h-16 object-contain" />
                </div>
              )}

              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: generatedPalette?.surface.light || '#D8D1C7' }}
              >
                <h3 className="font-semibold mb-2" style={{ color: generatedPalette?.text.light || '#2B2B2B' }}>
                  {formData.garageName || 'Your Garage Name'}
                </h3>
                <p className="text-sm opacity-70" style={{ color: generatedPalette?.text.light || '#2B2B2B' }}>
                  This is how your branding will look
                </p>
              </div>

              <button
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: formData.primaryColor,
                  color: generatedPalette?.text.light || '#2B2B2B',
                }}
              >
                Primary Button
              </button>

              <button
                className="w-full px-4 py-2 rounded-lg font-medium border-2 transition-colors"
                style={{
                  borderColor: formData.primaryColor,
                  color: formData.primaryColor,
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          {/* Live SOW Bill Payment Card Preview */}
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
                  <FileText className="h-5 w-5 text-luxury-gold" />
                  SoW Bill & Estimate Payment Preview
                </h2>
                <p className="text-xs text-luxury-muted-light dark:text-luxury-muted-dark mt-0.5">
                  Exact preview of the Payment Acceptance Card that appears opposite the ledger on customer bills.
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold border border-emerald-500/20">
                PDF Layout
              </span>
            </div>

            {/* Mocked Bill Payment Card */}
            <div className="bg-[#F9FAFB] text-[#1F2937] rounded-xl border border-gray-300 shadow-sm overflow-hidden p-4">
              <div className="bg-gray-100 -mx-4 -mt-4 px-4 py-2 border-b border-gray-200 mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  SCAN TO PAY VIA ANY UPI APP (GPAY / PHONEPE / PAYTM / BHIM)
                </span>
                <span className="text-[9px] font-mono text-gray-500">Live PDF Card</span>
              </div>

              <div className="flex items-center gap-4">
                {/* QR Square */}
                <div className="w-24 h-24 bg-white rounded-lg p-1.5 border border-gray-300 shadow-sm flex items-center justify-center shrink-0">
                  {paymentQrPreview ? (
                    <img
                      src={paymentQrPreview}
                      alt="Payment QR"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <span className="text-[9px] font-bold text-gray-500 block leading-tight">
                        COUNTER QR
                      </span>
                      <span className="text-[7px] text-gray-400 block">NOT UPLOADED</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {formData.garageName || 'MOTOFIT 2 WORKSHOP'}
                  </p>
                  <p className="text-xs font-mono text-gray-600 truncate">
                    UPI: {formData.upiId || 'Personal GPay / PhonePe / Counter QR'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Scan with Google Pay, PhonePe, Paytm, BHIM, or any banking UPI app.
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600">
                      Total Payable: ₹ 14,220.00
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                      Instant Verification
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-luxury-muted-light dark:text-luxury-muted-dark mt-3">
              💡 Garages with counter standees from Google Pay, PhonePe, or Paytm don&apos;t need complex merchant gateways — just upload the standee photo and your customers can pay directly into your account!
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-6 py-3 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark rounded-lg hover:bg-luxury-canvas-light dark:hover:bg-luxury-canvas-dark border border-luxury-gold/20 transition-all duration-300"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Reset to Default</span>
        </button>

        <button
          onClick={() => {
            if (generatedPalette) {
              applyThemeImmediately(generatedPalette);
              toast.success('Preview applied! Click Save to keep changes.');
            } else {
              toast.error('Please generate a palette first');
            }
          }}
          disabled={!generatedPalette}
          className="flex items-center space-x-2 px-6 py-3 bg-luxury-gold/20 text-luxury-gold rounded-lg hover:bg-luxury-gold/30 border border-luxury-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <Sparkles className="h-5 w-5" />
          <span>Preview Changes</span>
        </button>

        <PearlButton
          onClick={handleSave}
          disabled={loading || uploading}
          className="text-xs"
        >
          <Save className="h-4 w-4 mr-1 text-luxury-gold" />
          <span>
            {(() => {
              if (uploading) return 'Uploading...';
              if (loading) return 'Saving...';
              return 'Save Branding';
            })()}
          </span>
        </PearlButton>
      </div>
    </div>
  );
}

function ColorSwatch({ label, color }: Readonly<{ label: string; color: string }>) {
  return (
    <div className="space-y-2">
      <div
        className="w-full h-16 rounded-lg border-2 border-luxury-gold/20"
        style={{ backgroundColor: color }}
      />
      <div className="text-xs">
        <div className="font-medium text-luxury-ink-light dark:text-luxury-ink-dark">{label}</div>
        <div className="text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 font-mono">{color}</div>
      </div>
    </div>
  );
}
