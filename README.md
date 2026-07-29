# LIC Enterprise Management System

A secure, role-aware internal operations portal built for the Life Insurance Corporation of India (LIC). This application provides a unified workspace for managing agents, customer profiles, dynamic policy creation, premium collection logs, automated commission sharing, claims processing, and task management.

## 🚀 Key Modules & Features

1. **Role-Based Access Control (RBAC)**: Supports roles (`SUPER_ADMIN`, `REGIONAL_ADMIN`, `BRANCH_MANAGER`, `DEVELOPMENT_OFFICER`, and `AGENT`) with strict ownership query filtering.
2. **Organization Hierarchy Tree**: Visualizes structural nesting (Zones → Regional Admins → Branch Manager → DOs → Field Agents) with a built-in agent transfer workflow.
3. **Policy Lifecycle & Pre-fills**: Issue policies using pre-configured `PolicyTemplates` to speed up agent provisioning.
4. **Collection Schedules**: Auto-generated premium dues with receipt recording, grace period evaluation, and late fee tracking.
5. **Dynamic Commissions**: Auto-calculated splits based on configurable commission rules, logged into the dashboard upon premium payment.
6. **Claims processing**: Submission and review gates for maturity, death, surrender, and rider claims.
7. **CRM & Lead Pipeline**: Pipeline stages, notes logs, follow-up calendar alerts, and customer conversions.
8. **Settings Dashboard**: Tabbed console managing Profile updates, Appearance (theme toggle), Notification preferences, Commission Rules CRUD, and Policy Templates CRUD.
9. **PWA Shell**: Installed PWA assets (`manifest.json`, scalable vector icons), service worker network/cache caching strategy (`sw.js`), custom "Install App" banners, and offline fallback screens.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 15+](https://nextjs.org) (App Router + Turbopack)
- **Styling**: Tailwind CSS & CSS variables (theme-aware colors)
- **Database**: MongoDB with Mongoose ODM (fully indexed)
- **State & Queries**: TanStack React Query (client caching)
- **UI Components**: Base UI primitives & Lucide React

---

## ⚙️ Getting Started

### 1. Configure Environment
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/lic-management-system
JWT_SECRET=your-jwt-secret-string-here
CRON_SECRET=your-cron-secret-string-here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database
Seeding populates all collections (admins, DOs, agents, customers, policies, premium schedules, commission entries, leads, tasks, and settings templates) with realistic data:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🏗️ Production Build & Verification
To verify code formatting, type safety, and bundle optimization:
```bash
npm run build
```
