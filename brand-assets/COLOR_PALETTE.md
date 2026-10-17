# MotoBan (`mechbillerai`) Color Palette Specification
**Version:** 3.0.0 (Global Production Specification)  
**Parent Ecosystem:** HybridStudioZ  
**Primary Field Laboratory:** MotoFit 2 Workshop, Ahmedabad  

---

## 1. Executive Color Philosophy
MotoBan's color system is engineered for two harsh environments:
1. **The Greasy Garage Bay:** Harsh incandescent tubes, high glare from metallic tool cabinets, oily phone screens, and bright outdoor sunlight.
2. **The Executive Digital Showcase:** Ultra-slick dark-mode aesthetic (Geekfolio inspired) that communicates high engineering precision, speed, and AI capability.

The palette balances **Void Canvas Tones** (`#0B0F19`, `#151D2F`) with high-contrast, high-wavelength **Reactive Accents** (`#C9F31D` Geek Lime and `#FF5E14` Garage Orange). Every UI state guarantees WCAG 2.1 AA / AAA legibility.

---

## 2. Core Palette Swatches

### 2.1 Primary Brand Accents

#### 🟩 Geek Lime (The Primary Energy Driver)
Used for primary CTAs, active bill indicators, voice-trigger waves, and positive revenue numbers.
- **HEX:** `#C9F31D`
- **RGB:** `201, 243, 29`
- **HSL:** `72°, 90%, 53%`
- **CMYK:** `22, 0, 95, 0`
- **Pantone:** `PMS 388 C`
- **Accessibility:** 
  - Contrast on Void Black (`#0B0F19`): **14.2:1** (Passes WCAG AAA)
  - Contrast on Navy Steel (`#151D2F`): **12.6:1** (Passes WCAG AAA)
  - Text Rule: Always use dark text (`#0B0F19`) when Geek Lime is the solid background.

#### 🟧 Garage Flame Orange (Speed & Mechanical Heat)
Used for live shortcuts, urgent garage notifications, low stock alerts, and high-octane telemetry.
- **HEX:** `#FF5E14`
- **RGB:** `255, 94, 20`
- **HSL:** `19°, 100%, 54%`
- **CMYK:** `0, 75, 100, 0`
- **Pantone:** `PMS 1655 C`
- **Accessibility:**
  - Contrast on Void Black (`#0B0F19`): **6.2:1** (Passes WCAG AA for Large Text/Icons)
  - Contrast on Pure White (`#FFFFFF`): **3.2:1** (Do not use on white backgrounds)

---

### 2.2 Deep Canvas & Surface Tones

#### ⬛ Void Black (Primary Background Canvas)
The foundation of all MotoBan applications, Web POS terminals, and marketing pages. Absorbs glare in oil-slicked garage pits.
- **HEX:** `#0B0F19`
- **RGB:** `11, 15, 25`
- **HSL:** `223°, 39%, 7%`
- **CMYK:** `85, 75, 55, 75`
- **Pantone:** `PMS Black 6 C`

#### 🟦 Navy Steel (Card & Elevated Surface)
Used for POS card backgrounds, sidebar containers, dropdowns, and modal dialogs.
- **HEX:** `#151D2F`
- **RGB:** `21, 29, 47`
- **HSL:** `222°, 38%, 13%`
- **CMYK:** `80, 65, 45, 55`
- **Pantone:** `PMS 533 C`

#### 🔷 Deep Glass Stroke (Panel Outlines & Dividers)
Subtle border token for glassmorphic elevation without solid harsh white borders.
- **HEX:** `#1C263D`
- **RGB:** `28, 38, 61`
- **HSL:** `222°, 37%, 17%`
- **CSS Token:** `rgba(28, 38, 61, 0.8)` or `border-white/10`

---

### 2.3 Semantic & Functional Signals

| Role | Color Name | HEX | RGB | HSL | Context / Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI / Intelligence** | Cobalt AI | `#2563EB` | `37, 99, 235` | `221°, 83%, 53%` | Voice Speech-to-GST parsing, AI suggestions, OCR |
| **Success / Paid** | Emerald Sync | `#10B981` | `16, 185, 129` | `160°, 84%, 39%` | Paid invoices, printer ready, WhatsApp delivered |
| **Warning / Pending**| Amber Alert | `#F59E0B` | `245, 158, 11` | `38°, 92%, 50%` | Due payments, low spare inventory (<3 units) |
| **Critical / Voided** | Crimson Brake | `#EF4444` | `239, 68, 68` | `0°, 84%, 60%` | Voided bill, printer paper jam, battery dead |
| **Lifetime Tier** | Royal Gold | `#E5C07B` | `229, 192, 123`| `39°, 67%, 69%` | ₹6,999 Lifetime License badge, VIP Partner crest |

---

### 2.4 Neutral & Text Hierarchy

| Level | Color Name | HEX | Opacity / Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Heading / Primary Text** | Pure Frost White | `#FFFFFF` | 100% | Page titles, invoice totals, hero copy |
| **Body / Description** | Cool Slate | `#94A3B8` | 100% | Paragraphs, spare part descriptions, table headers |
| **Muted Metadata** | Steel Dim | `#64748B` | 100% | Timestamps, chassis numbers, thermal receipt captions |
| **Disabled / Trace** | Dark Slate | `#334155` | 100% | Inactive key bindings, offline devices |

---

## 3. Gradients & Lighting Effects

### 3.1 The "Hyper-Biller" Glow (Hero & Accent Glow)
```css
/* Radial Ambient Glow Behind Hero Terminals */
background: radial-gradient(circle at 50% 30%, rgba(201, 243, 29, 0.15) 0%, rgba(11, 15, 25, 0) 70%);
```

### 3.2 The "Exhaust Heat" Gradient (Speed & Velocity Accents)
```css
/* Badge & High-Energy Callouts */
background: linear-gradient(135deg, #C9F31D 0%, #FF5E14 100%);
```

### 3.3 The "Cobalt AI Engine" Gradient (Voice & Sync States)
```css
/* Speech-to-Text Recording Rings */
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

### 3.4 Frosted Glass Elevation Token (Dark POS Cards)
```css
/* Card Container Surface */
background: rgba(21, 29, 47, 0.7);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

---

## 4. Digital Accessibility & Contrast Matrix (WCAG 2.1)

| Foreground Color | Background Color | Contrast Ratio | WCAG Compliance | Recommended Application |
| :--- | :--- | :--- | :--- | :--- |
| **Geek Lime (`#C9F31D`)** | Void Black (`#0B0F19`) | **14.2:1** | **AAA (Pass)** | Hero CTAs, large numbers, highlights |
| **Geek Lime (`#C9F31D`)** | Navy Steel (`#151D2F`) | **12.6:1** | **AAA (Pass)** | Card icons, active tab underlines |
| **Pure White (`#FFFFFF`)** | Void Black (`#0B0F19`) | **18.7:1** | **AAA (Pass)** | All primary text, H1-H6 headers |
| **Cool Slate (`#94A3B8`)** | Void Black (`#0B0F19`) | **7.8:1** | **AAA (Pass)** | Body text, table data |
| **Garage Orange (`#FF5E14`)** | Void Black (`#0B0F19`) | **6.2:1** | **AA (Pass)** | Warning badges, tags, hotkey indicators |
| **Emerald Sync (`#10B981`)** | Navy Steel (`#151D2F`) | **5.4:1** | **AA (Pass)** | "PAID" badge, printer online status |
| **Void Black (`#0B0F19`)** | Geek Lime (`#C9F31D`) | **14.2:1** | **AAA (Pass)** | Text INSIDE solid Lime primary buttons |

> ⚠️ **Strict Brand Constraint:** Never use white text inside a `#C9F31D` (Geek Lime) button. White on Lime has a 1.2:1 contrast ratio and fails all human readability tests. Always use `#0B0F19` Void Black text on Geek Lime.

---

## 5. Physical Print (CMYK / Thermal Receipt) Translation
When exporting graphics for thermal POS paper (58mm / 80mm) or physical signage at partner garages (e.g. MotoFit 2):

1. **Thermal Printers (Black & White 203 DPI):**
   - Pure Black: `#000000` (100% K)
   - Background: Pure White `#FFFFFF` (Thermal Heat Transfer)
   - Grayscale dither: Never dither QR codes or barcodes. All barcodes must print in 100% solid Black on White.
2. **Vinyl Workshop Signage / Flex Banners:**
   - Background: CMYK `80 / 70 / 60 / 90` (Rich Black)
   - Primary Accent: CMYK `22 / 0 / 95 / 0` (Fluro Lime)
   - Text: CMYK `0 / 0 / 0 / 0` (Pure White)
