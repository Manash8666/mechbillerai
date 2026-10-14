# MotoBan 🚗⚡
> **Next-Gen Garage Management & Smart Billing SaaS Platform**  
> *Powered by Hybrid StudioZ*

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Android-20232A?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Luxury_Theme-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Lifetime_Access-C9A84C?style=for-the-badge)](#-business-model)

---

## 📖 Overview

**MotoBan** is an AI-ready, dual-platform garage management and billing system engineered specifically for auto garages, service centers, and mechanics (two-wheeler & four-wheeler). Designed from the ground up for independent garage owners, it replaces paper registers with high-speed digital workflows: paperless job cards, GST invoicing, live inventory tracking, customer vehicle histories, and appointment bay management.

Available seamlessly as a **Next.js 15 Web Application** and a **React Native Android Mobile App**.

**Developed and Powered by Hybrid StudioZ.**

---

## 🌟 Key Features

### 1. 📋 Digital Job Cards & Workshop Tracker
- Paperless job card creation with automatic numbering (`JC-100X`).
- Live job stages: `Pending` ➔ `In-Progress` ➔ `Completed` ➔ `Delivered`.
- Step-by-step service task checklists with progress percentage.
- Cost estimates vs. actual labor & parts expenditure.
- Technician assignment and before/after photo documentation.
- One-click instant conversion from Job Card to GST Invoice.

### 2. 🧾 GST-Compliant Billing & Invoicing
- Professional tax invoices generated in seconds.
- Auto tax (CGST/SGST/IGST) calculations & itemized discounts.
- Multi-channel payment recording: Cash, UPI, Card, Bank Transfer, and Credit.
- Partial payment tracking with automatic outstanding balance calculation.
- Instant PDF generation & thermal printing ready.

### 3. 👥 Customer & Vehicle Profiles
- Centralized customer directory with multi-vehicle registration per owner.
- Complete vehicle service histories and mileage logs.
- Customer ledger with balance and credit limit monitoring.
- GSTIN verification for B2B fleet clients.

### 4. 📦 Inventory & Spares Management
- Spare parts catalog with barcode/part code tracking.
- Automated low-stock and out-of-stock threshold alerts.
- Cost price vs. selling price margin analysis with GST rates.
- Supplier management and comprehensive inventory audit logs (Stock In / Out).

### 5. 📅 Service Appointment & Bay Scheduling
- Calendar-based slot booking and bay allocation.
- Avoid bay collisions during peak rush hours.
- Status tracking: Scheduled, Confirmed, Completed, Cancelled.

### 6. 🎨 Custom Branding & Luxury UI
- Dynamic dark/light luxury theme (Gold & Slate design system).
- Garage logo upload with automated color palette extractor.
- Personalized garage headers on printed customer bills.

### 7. 📱 Dual Platform (Web + Android App)
- **Web App**: Built with Next.js 15, Turbopack, and Tailwind CSS.
- **Android App**: Native Expo / React Native application in `/mobile` for on-the-floor mechanics and managers.

---

## 💰 Business Model

- **Pricing**: ₹9,999 One-time fee
- **Access**: Lifetime access
- **Trial**: 7-day free trial
- **Security**: Device-locked hardware license activation

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Web Framework** | Next.js 15 (App Router, Turbopack, React 19) |
| **Mobile App** | React Native, Expo 57, TypeScript (Android) |
| **Styling** | Tailwind CSS v3 (Custom Luxury Design System) |
| **Database & ORM** | SQLite / PostgreSQL with Prisma ORM |
| **State & Fetching** | Client hooks, React Native AsyncStorage, Next.js Route Handlers |
| **PDF Generation** | jsPDF & jsPDF-AutoTable |
| **Icons** | Lucide React & Expo Vector Icons |
| **Branding Engine** | Canvas-based Color Palette Extractor |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- (For Android) Android Studio / Expo Go app

### 1. Clone & Install Web Dependencies
```bash
git clone https://github.com/Manash8666/MechBillerAI.git
cd MechBillerAI
npm install
```

### 2. Setup Database
```bash
# Push Prisma schema to SQLite
npm run db:push

# (Optional) Seed initial demo data
npm run db:seed
```

### 3. Run Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Android App
```bash
# Start Expo bundler
npm run mobile:start

# Or directly target Android emulator/device
npm run mobile:android
```

---

## 📁 Repository Architecture

```text
MechBillerAI/
├── app/                        # Next.js 15 Web Application
│   ├── (auth)/                 # Login & Registration pages
│   ├── api/                    # REST API Route Handlers (Auth, Jobs, Invoices, etc.)
│   ├── dashboard/              # Dashboard pages (Customers, Jobs, Invoices, Spares)
│   ├── globals.css             # Theme tokens & variables
│   └── layout.tsx              # Root HTML & Toaster layout
├── mobile/                     # React Native / Expo Android App
│   ├── src/
│   │   ├── constants/theme.ts  # Matching Mobile Luxury Palette
│   │   ├── screens/            # Dashboard, JobCards, Customers, Settings
│   │   └── services/api.ts     # Mobile API Client with AsyncStorage
│   ├── App.tsx                 # Root Bottom Tab Navigator
│   └── app.json                # Android package configuration (com.garagesaas.app)
├── components/                 # Shared UI components & Theme Provider
├── lib/                        # Prisma singleton, API helpers, & color extractor
├── prisma/                     # Database schema & seeders
├── public/                     # Static assets & uploaded garage logos
└── README.md                   # Documentation
```

---

## 👥 Powered by

**MotoBan** is proudly developed and maintained by **Hybrid StudioZ**.

*Made with ❤️ for Auto Workshops & Garages.*

---

## 📜 End User License Agreement (EULA) & Dual-Licensing Policy

Use of the **MechBillerAI** engine, codebase, algorithms, and associated applications is strictly governed by our formal End User License Agreement.

### ⚖️ Mandatory Notice for Repository & Code Usage
If any individual, developer, agency, company, or third-party entity accesses, clones, forks, copies, incorporates, modifies, redistributes, or builds upon either:
1. **The `mechbillerai` Git Repository** ([https://github.com/Manash8666/mechbillerai.git](https://github.com/Manash8666/mechbillerai.git)), and/or
2. **The MotoBan Website** ([https://motoban.in](https://motoban.in)),

According to EULA policies, you are strictly legally subjected to **either of the following two mandatory options** prior to deployment, distribution, or commercial operation:

- **Option A (100% Reciprocal Open-Source Obligation):** Release **100% of your resulting project, platform, codebase, and derivative software as completely free and public open-source software** under an identical reciprocal copyleft license with all source code publicly accessible on GitHub/GitLab.
- **Option B (3x Lifetime License Commercial Royalty Payment):** If your project is proprietary, closed-source, commercially distributed, hosted as a paid service, or monetized for commercial gain, you are legally subjected to **pay a mandatory Royalty equivalent to exactly three times (3x) the Lifetime License fee of the MotoBan App and Website** directly to **HybridStudioZ** prior to commercial launch:
  - **Standard Workshop Commercial Royalty:** `3 × ₹14,999 = ₹44,997 INR`
  - **Enterprise Multi-Bay Commercial Royalty:** `3 × ₹39,999 = ₹119,997 INR`

- 📄 **View Full Markdown EULA:** [`EULA.md`](./EULA.md)
- 🌐 **View Web EULA:** [https://motoban.in/eula](https://motoban.in/eula)
