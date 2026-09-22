# 💎 CatalogueStudio — Production-Ready Digital Catalogue Platform

A commercial-grade, multi-tenant digital catalogue management platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB with Mongoose**.

The platform enables product-based businesses (Jewellery, Fashion, Electronics, Watches, Luxury Furniture, Cosmetics, etc.) to curate, customize, preview, and publish a bespoke digital catalogue with instant **WhatsApp customer enquiries** and **dynamic QR code sharing**.

Demonstration Business: **Royal Jewellers** (`slug: royal-jewellers`).

---

## 🌟 Key Features

### 👑 Admin Management Studio
- **Multi-Tenant Architecture**: Every business, category, and product is partitioned by `businessId`.
- **JWT & Password Security**: Session-based auth with `bcryptjs` and `jose` (Edge-compatible).
- **Dashboard Overview**: Live inventory metrics (Total Products, Published, Drafts, Categories) and one-click Publish/Unpublish toggle.
- **Product Management**:
  - Full CRUD with Grid and List views.
  - **Dynamic Key-Value Specifications**: Adaptable to any product line (e.g. *Metal, Gross Weight, Diamond Clarity* for Jewellery; *RAM, Storage, GPU* for Electronics; *Material, Dimensions* for Furniture).
  - Multiple image uploader with primary cover photo selection and preview.
  - Instant product duplication with auto-generated SKUs.
  - Multi-tag classification and pricing controls (with discount calculation and price visibility toggle).
- **Category Management**: Create, edit, reorder, toggle active status, and upload cover images with safe deletion protection.
- **Business Profile**: Configure company branding, address, Google Maps URL, social media channels, and WhatsApp concierge phone numbers.
- **Appearance Studio**: Four luxury theme modes (*Luxury, Modern, Classic, Minimal*), curated design presets, custom color token pickers, and storefront hero banner customization.
- **QR & Share Engine**: Real-time vector QR code generator pointing to the public store URL with PNG download and native Web Share integration.

### 🛍️ Luxury Customer Storefront (`/store/[businessSlug]`)
- **Brand-Tailored Experience**: Luxury off-white & gold design aesthetic, high-resolution imagery, and refined typography.
- **Hero & Curated Collections**: Custom storefront banners and visual category cards.
- **Instant Client-Side Filtering**: Search across titles, descriptions, SKUs, and tags; filter by collection, price range, and stock availability; sort by price, name, or newest.
- **Detailed Product Showcase**: Multi-angle image gallery, dynamic specifications table, availability badges, and related recommendations.
- **Instant WhatsApp Enquiries**: Generates pre-filled WhatsApp enquiry links containing the product name, SKU, and direct catalogue URL.
- **Catalogue Publishing Guard**: Gracefully displays a "Catalogue Coming Soon" splash screen when unpublished (with seamless admin preview mode).
- **Dynamic SEO Metadata**: Next.js `generateMetadata` dynamically populates Open Graph tags, canonical URLs, and meta descriptions from MongoDB.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Database** | MongoDB & Mongoose ODM (Atlas & Local compatible) |
| **Authentication** | Secure JWT Session Cookie (`jose`) & `bcryptjs` |
| **Storage Abstraction** | `lib/storage` (Local `/public/uploads` fallback & Cloudinary ready) |
| **QR Code** | `qrcode.react` (Canvas & SVG) |

---

## 📁 Project Structure

```text
├── app/
│   ├── (public)/
│   │   ├── page.tsx                                  # Platform showcase landing page
│   │   └── store/
│   │       └── [businessSlug]/
│   │           ├── layout.tsx                        # Public store layout with dynamic theme tokens
│   │           ├── page.tsx                          # Store homepage with hero & product grid
│   │           └── product/[productSlug]/page.tsx    # Product details & WhatsApp enquiry
│   ├── admin/
│   │   ├── login/page.tsx                            # Secure admin login
│   │   ├── dashboard/page.tsx                        # Overview metrics & quick publish toggle
│   │   ├── products/                                 # Product CRUD & Form
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── categories/page.tsx                       # Category management
│   │   ├── business/page.tsx                         # Business profile & WhatsApp settings
│   │   ├── appearance/page.tsx                       # Themes, colors, & hero banner
│   │   ├── qr-share/page.tsx                         # Dynamic QR code generator
│   │   └── settings/page.tsx                         # Account settings & credentials
│   ├── api/
│   │   ├── auth/ (login, logout, me)                 # Session auth routes
│   │   ├── business/                                 # Business profile endpoints
│   │   ├── categories/ & categories/[id]/            # Category CRUD endpoints
│   │   ├── products/ & products/[id]/                # Product CRUD & duplicate
│   │   ├── catalogue/[businessSlug]/                 # Public catalogue data API
│   │   ├── upload/                                   # File upload endpoint
│   │   └── dashboard/stats/                          # Analytics API
│   ├── globals.css                                   # Theme tokens & luxury styling
│   └── layout.tsx                                    # Root layout & Google Fonts
├── components/
│   ├── admin/                                        # Admin layout, sidebar, header, product form
│   └── store/                                        # Store hero, categories, card, filters, footer
├── lib/
│   ├── auth.ts                                       # Password hashing & JWT session logic
│   ├── mongodb.ts                                    # Cached Mongoose connection
│   └── storage/                                      # Modular local / Cloudinary storage
├── models/                                           # Mongoose models: Admin, Business, Category, Product
├── scripts/
│   └── seed.ts                                       # Comprehensive demo seed script
├── types/                                            # Reusable TypeScript interfaces
└── middleware.ts                                     # Edge route protection for /admin/*
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository and navigate to root
cd Royal

# Install all dependencies
npm install
```

### 3. Environment Variables
Create a `.env.local` file based on `.env.example`:
```env
# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/royal_catalogue

# Secret key for JWT session encryption
AUTH_SECRET=royal_jewellers_super_secret_jwt_key_2026_catalogue_platform

# Base Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Cloudinary Credentials (falls back to local public/uploads if omitted)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Database Seeding
Populate the database with the pre-configured **Royal Jewellers** demo catalogue (7 categories and 12+ luxury jewellery products with dynamic specifications):
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Store URL |
|---|---|---|---|
| **Admin** | `admin@royaljewellers.com` | `RoyalAdmin@2026` | `/store/royal-jewellers` |

---

## 📡 API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate admin & issue HTTP-only cookie | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Public |
| `GET` | `/api/auth/me` | Fetch authenticated session | Protected |
| `GET/PUT` | `/api/business` | Retrieve or update business profile & settings | Protected |
| `GET/POST` | `/api/categories` | List or create categories | Protected |
| `GET/PUT/DELETE` | `/api/categories/[id]` | Manage individual category (safe delete) | Protected |
| `GET/POST` | `/api/products` | Filtered product search & creation | Protected |
| `GET/PUT/DELETE` | `/api/products/[id]` | Manage individual product | Protected |
| `POST` | `/api/products/[id]/duplicate` | Duplicate product with new SKU | Protected |
| `POST` | `/api/upload` | Multipart file upload (local / Cloudinary) | Protected |
| `GET` | `/api/catalogue/[businessSlug]` | Public catalogue metadata & categories | Public |
| `GET` | `/api/catalogue/[businessSlug]/products` | Public catalogue product search & filter | Public |
| `GET` | `/api/catalogue/[businessSlug]/products/[slug]` | Public single product detail & related items | Public |

---

## 🌐 Deployment to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into [Vercel](https://vercel.com).
3. Set the following Environment Variables in the Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `AUTH_SECRET`: A secure 32+ character random string.
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://your-domain.vercel.app`).
   - *(Optional)* `CLOUDINARY_*` keys for cloud image hosting.
4. Click **Deploy**.
5. Run the seed script remotely against your MongoDB Atlas instance once if needed:
   `npx tsx scripts/seed.ts` (with `MONGODB_URI` set to Atlas).

---

## 🛡️ License & Commercial Readiness
Architected for high-performance multi-tenant SaaS deployments. All business data, categories, and products are completely isolated by `businessId`.
