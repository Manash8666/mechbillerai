# Garage SaaS - Complete Garage Management System

A comprehensive billing, inventory, and job management system built specifically for Ahmedabad garage owners. One-time payment, lifetime access model.

![Garage SaaS](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-One%20Time%20Fee-green)

## 🚀 Features

### Core Features

1. **Customer & Vehicle Management**
   - Complete customer database
   - Multi-vehicle support per customer
   - Service history tracking
   - Contact management

2. **GST-Compliant Billing & Invoicing**
   - Generate GST-compliant invoices
   - Multiple payment modes (Cash, UPI, Card, Credit)
   - Partial payments & advance tracking
   - PDF/Print/WhatsApp delivery
   - Payment history

3. **Inventory Management**
   - Parts and spare parts tracking
   - Low stock alerts
   - Supplier management
   - Stock movement history
   - Purchase orders

4. **Digital Job Cards**
   - Paperless job card system
   - Service checklists
   - Before/after photos
   - Technician assignment
   - Real-time status tracking
   - Job completion workflow

5. **Appointment Booking**
   - Calendar view
   - Bay/slot management
   - Service scheduling
   - Automated reminders
   - Appointment history

6. **Reports & Analytics**
   - Daily/monthly sales reports
   - Revenue tracking
   - Customer insights
   - Technician performance
   - GST reports
   - Outstanding payments

7. **Multi-Language Support**
   - English interface
   - Gujarati (ગુજરાતી) support
   - Easy language switching

8. **🎨 Branding & Customization** ✨ NEW!
   - Upload your garage logo
   - AI-powered color extraction from logo
   - Automatic luxury theme generation
   - Match your brand identity
   - Real-time preview
   - Personalized UI for each garage

9. **License Management**
   - One-time fee model
   - Lifetime access
   - Device-locked licensing
   - 7-day free trial

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM)
- **Styling**: Tailwind CSS
- **Authentication**: Custom auth with bcrypt
- **PDF Generation**: jsPDF
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ or higher
- npm, yarn, or pnpm
- Git (for version control)

## 🚀 Installation & Setup

### 1. Clone or Extract the Project

```bash
# If using Git
git clone <repository-url>
cd garage-saas

# Or extract the ZIP file and navigate to the folder
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database (SQLite - default)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this"

# App Configuration
APP_NAME="Garage SaaS"
APP_VERSION="1.0.0"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database and tables
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 First Time Setup

### 1. Register Your Account

1. Go to `http://localhost:3000/register`
2. Fill in your details:
   - Full Name
   - Email
   - Phone Number
   - Password
3. Click "Create Account"
4. **IMPORTANT**: Save your license key (displayed after registration)
5. You get a 7-day free trial automatically

### 2. Login

1. Go to `http://localhost:3000/login`
2. Enter your email and password
3. Click "Login"

### 3. Activate License (After Purchase)

To activate lifetime license:

```bash
# Call the activation API
curl -X POST http://localhost:3000/api/auth/activate-license \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "licenseKey": "XXXX-XXXX-XXXX-XXXX",
    "deviceId": "your-device-identifier"
  }'
```

## 📚 Usage Guide

### Dashboard

The dashboard provides:
- Real-time statistics
- Revenue metrics
- Active jobs count
- Pending invoices
- Quick actions

### Customer Management

1. Click "Customers" in sidebar
2. Click "Add Customer" button
3. Fill in customer details
4. Add vehicles for the customer
5. View service history

### Creating Job Cards

1. Go to "Job Cards"
2. Click "New Job Card"
3. Select customer and vehicle
4. Add description and tasks
5. Assign to technician
6. Track progress through statuses:
   - Pending
   - In Progress
   - Completed
   - Delivered

### Generating Invoices

1. Go to "Invoices"
2. Click "New Invoice"
3. Select customer
4. Add items/services
5. System calculates GST automatically
6. Save and print/send via WhatsApp

### Inventory Management

1. Go to "Inventory"
2. Add parts and spares
3. Set minimum stock levels
4. Get automatic low stock alerts
5. Track stock movements

### Appointments

1. Go to "Appointments"
2. Click "Book Appointment"
3. Select date and time
4. Choose service type
5. Assign to bay
6. Send reminder to customer

## 🌐 Language Support

To change language:

1. Go to Settings
2. Select language: English / ગુજરાતી
3. Interface updates automatically

## 🔒 Security Features

- Password hashing with bcrypt
- License key validation
- Device-locked licensing
- Secure API endpoints
- Input validation

## 📊 Database Schema

The system includes:

- **Users**: Authentication & licensing
- **Customers**: Customer information
- **Vehicles**: Vehicle details
- **JobCards**: Service jobs
- **Invoices**: Billing records
- **InvoiceItems**: Line items
- **Payments**: Payment tracking
- **InventoryItems**: Parts & spares
- **Suppliers**: Supplier management
- **Appointments**: Booking system
- **ServiceHistory**: Vehicle service log

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Traditional Server

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🗄️ Database Options

### SQLite (Default - Development)
- No setup required
- File-based database
- Perfect for single-user

### PostgreSQL (Recommended for Production)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/garage_saas"
```

### MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## 🎨 Customization

### Branding

Edit `app/layout.tsx` and `app/page.tsx`:
- Change logo
- Update colors in `tailwind.config.ts`
- Modify company name

### Adding Features

1. Create API route in `app/api/`
2. Add page in `app/dashboard/`
3. Update navigation in `app/dashboard/layout.tsx`

## 📞 Support & Maintenance

### Backup Database

```bash
# SQLite
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# PostgreSQL
pg_dump garage_saas > backup.sql
```

### Update Application

```bash
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
```

## 🤝 Contributing

This is a commercial product. For feature requests or bug reports, contact support.

## 📄 License

**One-Time Purchase License**
- ₹9,999 one-time payment
- Lifetime access
- Free updates forever
- Single garage/business use

## 🎯 Roadmap

- [ ] WhatsApp integration
- [ ] SMS reminders
- [ ] Mobile app (React Native)
- [ ] Multi-branch support
- [ ] Staff attendance tracking
- [ ] Service packages
- [ ] Loyalty program
- [ ] Online booking widget
- [ ] Parts catalog integration
- [ ] Offline mode

## 🐛 Known Issues

None currently. Report issues to support.

## 📞 Contact

- Website: [Your Website]
- Email: [Your Email]
- Phone: [Your Phone]
- WhatsApp: [Your WhatsApp]

## 🙏 Acknowledgments

Built with ❤️ for Ahmedabad Garage Owners

---

**Made in India 🇮🇳 | આપેલ સાથ માટે આભાર**

# MechBillerAI
