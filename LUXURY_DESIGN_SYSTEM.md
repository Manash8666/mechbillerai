# MotoBan (`mechbillerai`) Design System & Color Architecture
**Version:** 3.0.0 (Global Production Specification)  
**Parent Ecosystem:** HybridStudioZ  
**Primary Field Laboratory:** MotoFit 2 Workshop, Ahmedabad  

---

## 🎨 1. Executive Color Philosophy

The MotoBan system is engineered for two distinct, demanding environments:
1. **The Greasy Garage Bay:** Harsh incandescent tubes, glare from metallic tool chests, oily phone screens, and bright Ahmedabad sunlight. Requires maximum WCAG 2.1 AAA contrast and high-wavelength reactive accents.
2. **The Executive Digital Showcase:** Ultra-slick dark-mode aesthetic (Geekfolio inspired) communicating high engineering precision, speed, and AI capability.

The palette balances **Deep Void Canvas Tones** (`#0B0F19`, `#151D2F`) with high-contrast, high-wavelength **Reactive Accents** (`#C9F31D` Geek Lime and `#FF5E14` Garage Orange). Every UI state guarantees WCAG 2.1 AA / AAA legibility.

---

## 🎯 2. Core Palette Swatches

### 2.1 Primary Brand Accents

| Swatch | Color Name | HEX | RGB | Contrast on `#0B0F19` | Context / Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🟩 | **Geek Lime** | `#C9F31D` | `201, 243, 29` | **14.2:1 (AAA)** | Primary energy driver, hero CTAs, active bill indicators, voice waves, positive revenue numbers |
| 🟧 | **Garage Flame Orange** | `#FF5E14` | `255, 94, 20` | **6.2:1 (AA)** | Speed & mechanical heat, live shortcuts, urgent garage notifications, low stock alerts, telemetry |

> ⚠️ **Strict Brand Constraint:** Never use white text inside a `#C9F31D` (Geek Lime) button. White on Lime has a 1.2:1 contrast ratio and fails readability tests. Always use `#0B0F19` Void Black text on Geek Lime (`.btn-geek-lime` or `bg-geek-lime text-void-black`).

---

### 2.2 Deep Canvas & Surface Tones

| Swatch | Name | HEX | RGB | Context / Usage |
| :--- | :--- | :--- | :--- | :--- |
| ⬛ | **Void Black** | `#0B0F19` | `11, 15, 25` | Primary background canvas, glare absorption in workshop pits |
| 🟦 | **Navy Steel** | `#151D2F` | `21, 29, 47` | POS cards, elevated surfaces, sidebar containers, dialogs |
| 🔷 | **Deep Glass Stroke** | `#1C263D` | `28, 38, 61` | Panel outlines, dividers (`rgba(28, 38, 61, 0.8)` or `border-white/10`) |

---

### 2.3 Semantic & Functional Signals

| Role | Color Name | HEX | Usage |
| :--- | :--- | :--- | :--- |
| **AI / Intelligence** | Cobalt AI | `#2563EB` | Voice Speech-to-GST parsing, AI suggestions, OCR |
| **Success / Paid** | Emerald Sync | `#10B981` | Paid invoices, printer online, WhatsApp delivery |
| **Warning / Pending** | Amber Alert | `#F59E0B` | Due payments, low spare inventory (<3 units) |
| **Critical / Voided** | Crimson Brake | `#EF4444` | Voided bill, printer paper jam, battery dead |
| **Lifetime Tier** | Royal Gold | `#E5C07B` | ₹6,999 Lifetime License badge, VIP Partner crest |

---

### 2.4 Neutral & Text Hierarchy

| Level | Color Name | HEX | Usage |
| :--- | :--- | :--- | :--- |
| **Heading / Primary Text** | Pure Frost White | `#FFFFFF` | Page titles, invoice totals, hero copy |
| **Body / Description** | Cool Slate | `#94A3B8` | Paragraphs, spare part descriptions, table headers |
| **Muted Metadata** | Steel Dim | `#64748B` | Timestamps, chassis numbers, thermal receipt captions |
| **Disabled / Trace** | Dark Slate | `#334155` | Inactive key bindings, offline devices |

---

## 🔮 3. Gradients & Lighting Effects

### 3.1 The "Hyper-Biller" Glow
```css
background: radial-gradient(circle at 50% 30%, rgba(201, 243, 29, 0.15) 0%, rgba(11, 15, 25, 0) 70%);
```

### 3.2 The "Exhaust Heat" Gradient
```css
background: linear-gradient(135deg, #C9F31D 0%, #FF5E14 100%);
```

### 3.3 The "Cobalt AI Engine" Gradient
```css
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

### 3.4 Frosted Glass Elevation Token (Dark POS Cards)
```css
background: rgba(21, 29, 47, 0.7);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

---

## 📦 4. Tailwind & CSS Tokens Mapping

```typescript
// tailwind.config.ts
colors: {
  'geek-lime': { DEFAULT: '#C9F31D', hover: '#b8e214', glow: 'rgba(201, 243, 29, 0.35)' },
  'garage-orange': { DEFAULT: '#FF5E14', hover: '#e6510d', glow: 'rgba(255, 94, 20, 0.35)' },
  'void-black': '#0B0F19',
  'navy-steel': '#151D2F',
  'deep-glass': '#1C263D',
  'cobalt-ai': '#2563EB',
  'emerald-sync': '#10B981',
  'amber-alert': '#F59E0B',
  'crimson-brake': '#EF4444',
  'royal-gold': '#E5C07B',
  'pure-white': '#FFFFFF',
  'cool-slate': '#94A3B8',
  'steel-dim': '#64748B',
  'dark-slate': '#334155',
  // Backward compatibility alias:
  luxury: { ... }
}
```

---

## 🖨️ 5. Physical Print (CMYK / Thermal Receipt) Translation
1. **Thermal Printers (Black & White 203 DPI):**
   - Pure Black: `#000000` (100% K)
   - Background: Pure White `#FFFFFF` (Thermal Heat Transfer)
   - Barcodes/QR: Never dither. Print 100% solid Black on White.
2. **Vinyl Workshop Signage / Flex Banners:**
   - Background: CMYK `80 / 70 / 60 / 90` (Rich Black)
   - Primary Accent: CMYK `22 / 0 / 95 / 0` (Fluro Lime)
   - Text: CMYK `0 / 0 / 0 / 0` (Pure White)
