# Wellness Sanctuary PWA

A high-performance Progressive Web Application (PWA) for holistic wellness, fitness cohorts, and habit tracking, built with Next.js 14 (App Router), Tailwind CSS, Lenis Smooth Scroll, Prisma, and SQLite.

---

## ✨ Features

- **Progressive Web App (PWA)**: Installable on iOS & Android with custom app manifests and icons.
- **Drip Cohort Scheduling**: Daily video & task unlocking deterministically synced to Western Indonesia Time (WIB / UTC+7) at 00:00 WIB, with daily assessment cut-offs at 23:59 WIB.
- **Attendance Mode Selector**: Choose between *In-Person (Studio)* and *Virtual (Zoom)* for Onsite and Hybrid wellness programs.
- **QRIS Payment Flow**: Dynamic QRIS invoices, instant status verification, and fallback simulations.
- **Admin Dashboard**: Real-time cohort metrics, subscriber management, curriculum builder, role assignment, and QRIS transaction approval.
- **Desktop Requirement Guard**: Dedicated isolated static splash screen for administrative workflows requiring desktop screens.
- **Glassmorphic UI**: Ultra-refined frosted design system with smooth animations, custom aura gradients, and dark mode support.
- **Lenis Smooth Scroll**: Buttery smooth scrolling optimized with hardware acceleration and mobile touch fallback.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/stevenmulya/wellnessdemo.git
cd wellnessdemo
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default `.env` configuration:
```env
DATABASE_URL="file:./wellness.db"
JWT_SECRET="wellness_platform_secure_jwt_token_key_2026_super_safe"
APP_URL="http://localhost:3000"
```

### 3. Initialize & Seed Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
# Or custom port:
npm run dev -- -p 3003
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3003](http://localhost:3003) in your browser.

---

## 🔑 Demo Credentials

After running `npm run db:seed`:

- **Super Administrator**:
  - Email: `superadmin@wellness.test`
  - Password: `SuperAdmin123!`
  - URL: `/admin`
- **Member**:
  - Email: `budi@wellness.test`
  - Password: `UserBudi123!`
  - URL: `/dashboard`

---

## 🧪 Testing & Verification

Run the comprehensive authentication, authorization, and enrollment test suite:

```bash
npm test
```

Check code quality and type safety:

```bash
npm run lint
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions)
- **Database & ORM**: SQLite & Prisma ORM
- **Styling**: Tailwind CSS, CSS Custom Properties (Glassmorphism)
- **Scrolling**: Lenis Smooth Scroll
- **Icons**: Lucide React
- **Authentication**: JWT (`jose`) & Password Hashing (`bcryptjs`)
