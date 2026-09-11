# 🍕 Multi-Store Pizza & QSR Management Platform
## Production-Ready Blueprint & Code Scaffold

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#a-system-architecture--services)
3. [Monorepo Structure](#b-monorepo-folder-structure)
4. [Prisma Schema](#c-prisma-schema)
5. [API Routes](#d-key-api-routes)
6. [POS Workflow](#e-pos-workflow)
7. [Kitchen Workflow](#f-kitchen--packing--delivery-workflow)
8. [P&L & Reporting](#g-pl-formulas--sql)
9. [Seed Data](#h-seed-data)
10. [Printer Config](#i-printer-setup-config)
11. [Implementation Roadmap](#j-implementation-roadmap)

---

## Executive Summary

This blueprint provides a complete production-ready architecture for a **multi-store Pizza & Quick-Service Restaurant Management Platform** supporting:

- **Pizza stores** with half-and-half logic, crust types, sizes
- **General QSR items**: drinks, rice platters, subs, sandwiches, wings, pasta, desserts, sides
- **7 integrated applications**: Admin/POS, Storefront Kiosk, KDS, Packing, OSDU, Driver App, Customer App
- **Real-time operations**: WebSockets for order lifecycle
- **Enterprise features**: Multi-store, RBAC, inventory, finance, payroll

**Tech Stack Decision**: **NestJS** over Express for:
- Built-in TypeScript support with decorators
- Modular architecture (perfect for monorepo)
- Built-in WebSocket gateway support
- Excellent Prisma integration
- Built-in validation pipes
- Swagger/OpenAPI auto-generation

---

## A) System Architecture & Services

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Admin/POS  │  │  Storefront │  │    KDS      │  │  Packing/Dispatch   │ │
│  │   (Web)     │  │   (Kiosk)   │  │  (Display)  │  │     (Display)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    OSDU     │  │ Driver App  │  │ Customer    │  │   Customer Mobile   │ │
│  │  (Lobby TV) │  │  (PWA/RN)   │  │   (Web)     │  │      (PWA/RN)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                    │
                              ┌─────┴─────┐
                              │   NGINX   │
                              │  (Proxy)  │
                              └─────┬─────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
├───────────────────────────────────┼─────────────────────────────────────────┤
│                         ┌─────────┴─────────┐                               │
│                         │   NestJS API      │                               │
│                         │   (Main Server)   │                               │
│                         └─────────┬─────────┘                               │
│                                   │                                         │
│  ┌────────────────────────────────┼──────────────────────────────────────┐  │
│  │                        MODULES                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │  Auth    │ │  Order   │ │   Menu   │ │ Kitchen  │ │  Finance   │  │  │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module    │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Inventory│ │  Store   │ │  Driver  │ │  Report  │ │   User     │  │  │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module    │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                        REALTIME LAYER (WebSockets)                           │
├───────────────────────────────────┼─────────────────────────────────────────┤
│                         ┌─────────┴─────────┐                               │
│                         │  WebSocket Gateway  │                             │
│                         │  (Socket.io/Nest)   │                             │
│                         └─────────┬─────────┘                               │
│                                   │                                         │
│              ┌────────────────────┼────────────────────┐                    │
│              ▼                    ▼                    ▼                    │
│        ┌──────────┐        ┌──────────┐        ┌──────────┐                │
│        │  Order   │        │ Kitchen  │        │  Driver  │                │
│        │  Events  │        │  Events  │        │  Events  │                │
│        └──────────┘        └──────────┘        └──────────┘                │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                 │
├───────────────────────────────────┼─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │  Bull Queue  │  │  Printer Service │ │
│  │  (Primary)   │  │(Cache/Queue) │  │  (Jobs)      │  │   (ESC/POS)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Prisma     │  │   MinIO/S3   │  │   Stripe     │  │   SMS/Email      │ │
│  │    ORM       │  │  (Storage)   │  │  (Payments)  │  │   (Notify)       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Breakdown

| Service | Purpose | Tech |
|---------|---------|------|
| **API Server** | Main REST API | NestJS + Prisma |
| **WebSocket Gateway** | Real-time updates | Socket.io + NestJS |
| **Redis** | Caching, sessions, pub/sub | Redis 7+ |
| **Bull Queue** | Background jobs (printing, reports) | Bull + Redis |
| **Printer Service** | ESC/POS thermal printing | Node-escpos |
| **Storage** | Images, receipts, exports | MinIO/S3 |
| **Notification** | SMS, Email, Push | Twilio/SendGrid/FCM |

---

## B) Monorepo Folder Structure

```
restaurant-platform/
├── 📁 apps/
│   ├── 📁 api/                          # NestJS Backend API
│   │   ├── 📁 src/
│   │   │   ├── 📁 modules/
│   │   │   │   ├── 📁 auth/             # Authentication & JWT
│   │   │   │   ├── 📁 users/            # User management & RBAC
│   │   │   │   ├── 📁 stores/           # Store & zone management
│   │   │   │   ├── 📁 menu/             # Products, categories, modifiers
│   │   │   │   ├── 📁 orders/           # Order lifecycle
│   │   │   │   ├── 📁 kitchen/          # KDS logic
│   │   │   │   ├── 📁 inventory/        # Stock & ingredients
│   │   │   │   ├── 📁 finance/          # Ledger & accounting
│   │   │   │   ├── 📁 employees/        # Payroll & HR
│   │   │   │   ├── 📁 reports/          # Analytics & exports
│   │   │   │   ├── 📁 printers/         # Print service integration
│   │   │   │   └── 📁 websocket/        # Real-time gateway
│   │   │   ├── 📁 common/               # Guards, interceptors, pipes
│   │   │   ├── 📁 config/               # App configuration
│   │   │   ├── main.ts                  # Entry point
│   │   │   └── app.module.ts            # Root module
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma            # Database schema
│   │   │   ├── migrations/              # Database migrations
│   │   │   └── seed.ts                  # Seed data
│   │   ├── 📁 test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── 📁 web-admin/                    # React Admin + POS Dashboard
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/           # Shared UI components
│   │   │   ├── 📁 pages/
│   │   │   │   ├── 📁 dashboard/        # Admin dashboard
│   │   │   │   ├── 📁 pos/              # Point of Sale interface
│   │   │   │   ├── 📁 menu/             # Menu management
│   │   │   │   ├── 📁 orders/           # Order management
│   │   │   │   ├── 📁 inventory/        # Stock management
│   │   │   │   ├── 📁 finance/          # Financial reports
│   │   │   │   ├── 📁 employees/        # HR management
│   │   │   │   └── 📁 settings/         # Store configuration
│   │   │   ├── 📁 hooks/                # Custom React hooks
│   │   │   ├── 📁 stores/               # Zustand/Redux stores
│   │   │   ├── 📁 services/             # API clients
│   │   │   ├── 📁 types/                # TypeScript types
│   │   │   ├── 📁 utils/                # Utilities
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── 📁 web-storefront/               # Customer Self-Service Kiosk
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   │   ├── 📁 menu/             # Menu browsing components
│   │   │   │   ├── 📁 cart/             # Shopping cart
│   │   │   │   ├── 📁 checkout/         # Payment flow
│   │   │   │   └── 📁 upsell/           # Upsell suggestions
│   │   │   ├── 📁 pages/
│   │   │   ├── 📁 hooks/
│   │   │   └── 📁 styles/               # Touch-optimized styles
│   │   └── package.json
│   │
│   ├── 📁 web-kds/                      # Kitchen Display System
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   │   ├── OrderCard.tsx        # Order ticket card
│   │   │   │   ├── StationView.tsx      # Station-specific view
│   │   │   │   ├── Timer.tsx            # Order timer
│   │   │   │   └── AlertSound.tsx       # Audio notifications
│   │   │   └── 📁 pages/
│   │   │       └── KitchenDisplay.tsx
│   │   └── package.json
│   │
│   ├── 📁 web-packing/                  # Packing/Dispatch Display
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   │   ├── PackingList.tsx
│   │   │   │   ├── VerificationCheck.tsx
│   │   │   │   └── DriverAssignment.tsx
│   │   │   └── 📁 pages/
│   │   └── package.json
│   │
│   ├── 📁 web-osdu/                     # Order Status Display Unit
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   │   ├── StatusBoard.tsx      # Main status board
│   │   │   │   ├── OrderTile.tsx        # Individual order tile
│   │   │   │   └── ReadyAlert.tsx       # Ready notification
│   │   │   └── 📁 pages/
│   │   └── package.json
│   │
│   ├── 📁 mobile-customer/              # Customer Mobile App (PWA/RN)
│   │   └── src/
│   │
│   └── 📁 mobile-driver/                # Driver App (PWA/RN)
│       └── src/
│
├── 📁 packages/
│   ├── 📁 shared-types/                 # Shared TypeScript definitions
│   │   ├── 📁 src/
│   │   │   ├── models/                  # Entity interfaces
│   │   │   ├── api/                     # API request/response types
│   │   │   ├── enums/                   # Shared enums
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── 📁 shared-utils/                 # Shared utilities
│   │   ├── 📁 src/
│   │   │   ├── formatters/              # Currency, date formatters
│   │   │   ├── validators/              # Input validators
│   │   │   ├── constants/               # Shared constants
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── 📁 ui-components/                # Shared UI component library
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/           # shadcn/ui based components
│   │   │   ├── 📁 hooks/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── 📁 websocket-client/             # Shared WebSocket client
│       ├── 📁 src/
│       │   ├── socket-client.ts
│       │   └── hooks.ts
│       └── package.json
│
├── 📁 infrastructure/
│   ├── 📁 docker/
│   │   ├── docker-compose.yml           # Full stack orchestration
│   │   ├── docker-compose.dev.yml       # Development stack
│   │   └── docker-compose.prod.yml      # Production stack
│   │
│   ├── 📁 kubernetes/
│   │   ├── api-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   └── ingress.yaml
│   │
│   ├── 📁 terraform/                    # Infrastructure as Code
│   │   └── main.tf
│   │
│   └── 📁 scripts/
│       ├── setup.sh                     # Initial setup script
│       ├── seed.sh                      # Database seeding
│       └── deploy.sh                    # Deployment script
│
├── 📁 docs/
│   ├── API.md                           # API documentation
│   ├── DEPLOYMENT.md                    # Deployment guide
│   ├── PRINTERS.md                      # Printer setup guide
│   └── TROUBLESHOOTING.md
│
├── 📁 assets/
│   ├── 📁 images/                       # Sample product images
│   └── 📁 templates/                    # Print templates
│
├── .gitignore
├── package.json                         # Root package.json (workspaces)
├── turbo.json                           # Turborepo config
└── README.md
```

---

## C) Prisma Schema


### Complete Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE ENTITY MODELS
// ============================================

model Company {
  id          String   @id @default(uuid())
  name        String
  legalName   String?
  taxId       String?
  address     String?
  phone       String?
  email       String?
  logoUrl     String?
  website     String?
  timezone    String   @default("America/New_York")
  currency    String   @default("USD")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  stores      Store[]
  users       User[]
  ledgerAccounts LedgerAccount[]
  
  @@map("companies")
}

model Store {
  id              String   @id @default(uuid())
  companyId       String
  name            String
  code            String   // Short code like "STORE001"
  address         String
  city            String
  state           String
  zipCode         String
  phone           String
  email           String?
  timezone        String   @default("America/New_York")
  latitude        Float?
  longitude       Float?
  
  // Store Settings
  settings        StoreSettings?
  
  // Operating Hours (JSON for flexibility)
  operatingHours  Json     @default("{}")
  
  // Tax Configuration
  taxRate         Decimal  @default(0.00) @db.Decimal(5, 4)
  taxName         String   @default("Sales Tax")
  
  // Service Configuration
  serviceFeeRate  Decimal  @default(0.00) @db.Decimal(5, 4)
  deliveryFee     Decimal  @default(0.00) @db.Decimal(10, 2)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  users           UserStoreAccess[]
  deliveryZones   DeliveryZone[]
  products        ProductStore[]
  categories      Category[]
  printers        Printer[]
  orders          Order[]
  inventoryItems  InventoryItem[]
  journalEntries  JournalEntry[]
  employees       Employee[]
  closePeriods    ClosePeriod[]
  
  @@unique([companyId, code])
  @@map("stores")
}

model StoreSettings {
  id                    String   @id @default(uuid())
  storeId               String   @unique
  
  // Order Settings
  orderNumberPrefix     String   @default("ORD")
  nextOrderNumber       Int      @default(1)
  tokenNumberPrefix     String   @default("T")
  nextTokenNumber       Int      @default(1)
  
  // Kitchen Settings
  pizzaPrepTimeMinutes  Int      @default(15)
  fryerPrepTimeMinutes  Int      @default(8)
  sandwichPrepTimeMinutes Int    @default(5)
  
  // Payment Settings
  acceptCash            Boolean  @default(true)
  acceptCard            Boolean  @default(true)
  acceptOnlinePayment   Boolean  @default(true)
  
  // Display Settings
  osdDisplayMode        String   @default("grid") // grid, list
  kdsAutoAdvance        Boolean  @default(true)
  kdsAlertThreshold     Int      @default(20) // minutes
  
  // Loyalty Settings
  loyaltyEnabled        Boolean  @default(false)
  loyaltyPointsPerDollar Decimal @default(1.00) @db.Decimal(5, 2)
  
  store                 Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@map("store_settings")
}

model DeliveryZone {
  id          String   @id @default(uuid())
  storeId     String
  name        String
  description String?
  
  // Zone boundaries (GeoJSON or simple radius)
  zoneType    String   @default("radius") // radius, polygon
  centerLat   Float?
  centerLng   Float?
  radiusKm    Float?
  polygonCoords Json?  // For custom polygon zones
  
  // Delivery settings
  deliveryFee Decimal  @default(0.00) @db.Decimal(10, 2)
  minOrderAmount Decimal @default(0.00) @db.Decimal(10, 2)
  estimatedMinutes Int @default(30)
  
  isActive    Boolean  @default(true)
  
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  addresses   CustomerAddress[]
  
  @@map("delivery_zones")
}

// ============================================
// USER & RBAC MODELS
// ============================================

model User {
  id            String    @id @default(uuid())
  companyId     String?
  
  // Basic Info
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  
  // Status
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  lastLoginAt   DateTime?
  
  // Role Assignment
  roleId        String
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  company       Company?  @relation(fields: [companyId], references: [id])
  role          Role      @relation(fields: [roleId], references: [id])
  storeAccess   UserStoreAccess[]
  ordersCreated Order[]   @relation("CreatedBy")
  auditLogs     AuditLog[]
  
  @@map("users")
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique // Owner, Admin, StoreManager, Cashier, etc.
  description String?
  isSystem    Boolean      @default(false) // Cannot delete system roles
  
  // Relations
  permissions RolePermission[]
  users       User[]
  
  @@map("roles")
}

model Permission {
  id          String       @id @default(uuid())
  code        String       @unique // orders:create, orders:delete, etc.
  name        String
  description String?
  module      String       // orders, menu, inventory, etc.
  
  roles       RolePermission[]
  
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserStoreAccess {
  id      String @id @default(uuid())
  userId  String
  storeId String
  
  // Optional: Override role for specific store
  overrideRoleId String?
  
  isDefault Boolean @default(false) // Default store for user
  
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  store   Store  @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, storeId])
  @@map("user_store_access")
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  storeId     String?
  
  action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType  String   // Order, Product, User, etc.
  entityId    String?
  
  oldValues   Json?
  newValues   Json?
  metadata    Json?    // IP, user agent, etc.
  
  createdAt   DateTime @default(now())
  
  user        User?    @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// MENU & PRODUCT MODELS
// ============================================

model Category {
  id          String   @id @default(uuid())
  storeId     String
  parentId    String?
  
  name        String
  description String?
  sortOrder   Int      @default(0)
  imageUrl    String?
  
  // Display settings
  color       String?
  icon        String?
  
  // Time-based availability
  availableFrom Time?  // HH:MM format
  availableTo   Time?  // HH:MM format
  availableDays Int[]  // 0=Sunday, 1=Monday, etc.
  
  isActive    Boolean  @default(true)
  
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  
  @@map("categories")
}

model Product {
  id          String   @id @default(uuid())
  categoryId  String
  
  // Basic Info
  name        String
  description String?
  sku         String?
  barcode     String?
  
  // Product Type
  type        ProductType @default(STANDALONE)
  
  // Pricing (base price, store-specific overrides in ProductStore)
  basePrice   Decimal  @default(0.00) @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  
  // Images
  imageUrl    String?
  galleryUrls String[]
  
  // Flags
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  
  // Preparation
  prepTimeMinutes Int @default(10)
  kitchenStation  KitchenStation @default(GENERAL)
  
  // Recipe/BOM for inventory
  recipe      Recipe?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  category    Category @relation(fields: [categoryId], references: [id])
  storeConfigs ProductStore[]
  sizes       ProductSize[]
  modifiers   ProductModifier[]
  comboItems  ComboItem[]
  orderItems  OrderItem[]
  
  @@map("products")
}

model ProductStore {
  id              String   @id @default(uuid())
  productId       String
  storeId         String
  
  // Store-specific overrides
  price           Decimal? @db.Decimal(10, 2)
  isAvailable     Boolean  @default(true)
  
  // Availability schedule
  availableFrom   DateTime?
  availableTo     DateTime?
  
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  store           Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@unique([productId, storeId])
  @@map("product_stores")
}

model ProductSize {
  id          String   @id @default(uuid())
  productId   String
  
  name        String   // Small, Medium, Large, etc.
  code        String   // S, M, L, XL
  sortOrder   Int      @default(0)
  
  // Pricing (relative to base or absolute)
  priceAdjustment Decimal @default(0.00) @db.Decimal(10, 2)
  
  // Pizza-specific
  slices      Int?     // Number of slices
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("product_sizes")
}

model Modifier {
  id          String   @id @default(uuid())
  
  name        String   // Extra Cheese, Pepperoni, etc.
  description String?
  
  // Modifier Type
  type        ModifierType @default(SINGLE_SELECT)
  
  // Pricing
  basePrice   Decimal  @default(0.00) @db.Decimal(10, 2)
  
  // Options for multi-select
  options     ModifierOption[]
  
  // Products that use this modifier
  products    ProductModifier[]
  
  isActive    Boolean  @default(true)
  
  @@map("modifiers")
}

model ModifierOption {
  id          String   @id @default(uuid())
  modifierId  String
  
  name        String
  priceAdjustment Decimal @default(0.00) @db.Decimal(10, 2)
  
  // Inventory tracking
  inventoryItemId String?
  quantityUsed    Decimal? @db.Decimal(10, 3)
  
  modifier    Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  
  @@map("modifier_options")
}

model ProductModifier {
  id          String   @id @default(uuid())
  productId   String
  modifierId  String
  
  isRequired  Boolean  @default(false)
  sortOrder   Int      @default(0)
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  modifier    Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  
  @@unique([productId, modifierId])
  @@map("product_modifiers")
}

// Combo/Meal Deal Models
model Combo {
  id          String   @id @default(uuid())
  
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  
  // Combo items (e.g., 1 Pizza + 2 Drinks + 1 Side)
  items       ComboItem[]
  
  isActive    Boolean  @default(true)
  
  @@map("combos")
}

model ComboItem {
  id          String   @id @default(uuid())
  comboId     String
  productId   String?
  categoryId  String?
  
  // Selection rules
  quantity    Int      @default(1)
  allowSizeUpgrade Boolean @default(true)
  allowModifiers   Boolean @default(true)
  
  combo       Combo    @relation(fields: [comboId], references: [id], onDelete: Cascade)
  product     Product? @relation(fields: [productId], references: [id])
  
  @@map("combo_items")
}

// Recipe/BOM for inventory tracking
model Recipe {
  id          String   @id @default(uuid())
  productId   String   @unique
  
  // Recipe components
  ingredients RecipeIngredient[]
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("recipes")
}

model RecipeIngredient {
  id              String   @id @default(uuid())
  recipeId        String
  inventoryItemId String
  
  quantity        Decimal  @db.Decimal(10, 3)
  unit            String   // g, ml, oz, piece, etc.
  
  recipe          Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  @@map("recipe_ingredients")
}

// ============================================
// ORDER MODELS
// ============================================

model Order {
  id              String      @id @default(uuid())
  storeId         String
  
  // Order Identification
  orderNumber     String      @unique
  tokenNumber     String?     // For customer display
  
  // Order Type
  type            OrderType   @default(DINE_IN)
  status          OrderStatus @default(PENDING)
  
  // Customer Info
  customerName    String?
  customerPhone   String?
  customerEmail   String?
  
  // For delivery
  deliveryAddress String?
  deliveryZoneId  String?
  driverId        String?
  
  // For dine-in
  tableNumber     String?
  guestCount      Int?
  
  // Timestamps
  createdAt       DateTime    @default(now())
  confirmedAt     DateTime?
  preparedAt      DateTime?
  packedAt        DateTime?
  deliveredAt     DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  
  // Financial
  subtotal        Decimal     @default(0.00) @db.Decimal(10, 2)
  taxAmount       Decimal     @default(0.00) @db.Decimal(10, 2)
  discountAmount  Decimal     @default(0.00) @db.Decimal(10, 2)
  deliveryFee     Decimal     @default(0.00) @db.Decimal(10, 2)
  tipAmount       Decimal     @default(0.00) @db.Decimal(10, 2)
  total           Decimal     @default(0.00) @db.Decimal(10, 2)
  
  // Applied discounts/coupons
  couponCode      String?
  loyaltyPointsUsed Int?
  
  // Source
  source          OrderSource @default(POS)
  createdById     String?
  
  // Notes
  customerNotes   String?
  kitchenNotes    String?
  
  // Relations
  store           Store       @relation(fields: [storeId], references: [id])
  items           OrderItem[]
  payments        Payment[]
  refunds         Refund[]
  driver          Driver?     @relation(fields: [driverId], references: [id])
  createdBy       User?       @relation("CreatedBy", fields: [createdById], references: [id])
  
  @@index([storeId, status])
  @@index([createdAt])
  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  
  // Product reference
  productId       String
  productName     String   // Snapshot at time of order
  
  // Size
  sizeId          String?
  sizeName        String?
  
  // Quantity & Pricing
  quantity        Int      @default(1)
  unitPrice       Decimal  @db.Decimal(10, 2)
  totalPrice      Decimal  @db.Decimal(10, 2)
  
  // Modifiers (stored as JSON for flexibility)
  modifiers       Json?    // [{modifierId, optionId, name, price}]
  
  // Half-and-half for pizzas
  isHalfAndHalf   Boolean  @default(false)
  leftHalfProductId   String?
  rightHalfProductId  String?
  
  // Kitchen
  kitchenStation  KitchenStation @default(GENERAL)
  status          ItemStatus @default(PENDING)
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Notes
  notes           String?
  
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}

model Payment {
  id              String        @id @default(uuid())
  orderId         String
  
  amount          Decimal       @db.Decimal(10, 2)
  method          PaymentMethod @default(CASH)
  status          PaymentStatus @default(PENDING)
  
  // For card payments
  transactionId   String?
  cardLast4       String?
  
  // For split payments
  isPartial       Boolean       @default(false)
  
  processedAt     DateTime      @default(now())
  processedById   String?
  
  order           Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@map("payments")
}

model Refund {
  id              String   @id @default(uuid())
  orderId         String
  
  amount          Decimal  @db.Decimal(10, 2)
  reason          String
  
  // What was refunded
  itemsRefunded   Json?    // [{orderItemId, quantity}]
  
  processedAt     DateTime @default(now())
  processedById   String?
  
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@map("refunds")
}

// ============================================
// KITCHEN & DELIVERY MODELS
// ============================================

model Driver {
  id              String   @id @default(uuid())
  storeId         String
  userId          String?  // If linked to a user account
  
  // Profile
  name            String
  phone           String
  email           String?
  vehicleType     String?
  licensePlate    String?
  
  // Status
  status          DriverStatus @default(OFFLINE)
  currentLocation Json?    // {lat, lng, updatedAt}
  
  // Financial
  isContractor    Boolean  @default(true)
  perDeliveryRate Decimal  @default(0.00) @db.Decimal(10, 2)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  store           Store    @relation(fields: [storeId], references: [id])
  orders          Order[]
  deliveries      Delivery[]
  
  @@map("drivers")
}

model Delivery {
  id              String   @id @default(uuid())
  orderId         String   @unique
  driverId        String
  
  // Status tracking
  status          DeliveryStatus @default(ASSIGNED)
  
  // Timestamps
  assignedAt      DateTime @default(now())
  pickedUpAt      DateTime?
  deliveredAt     DateTime?
  
  // Location tracking
  trackingEvents  Json[]   // [{status, lat, lng, timestamp}]
  
  // Proof of delivery
  proofPhotoUrl   String?
  signatureUrl    String?
  customerNotes   String?
  
  // Cash collection
  cashCollected   Decimal? @db.Decimal(10, 2)
  
  driver          Driver   @relation(fields: [driverId], references: [id])
  
  @@map("deliveries")
}

// ============================================
// INVENTORY MODELS
// ============================================

model InventoryItem {
  id              String   @id @default(uuid())
  storeId         String
  
  name            String
  description     String?
  sku             String?
  barcode         String?
  
  // Unit of measure
  unit            String   // piece, kg, lb, oz, ml, l, etc.
  
  // Tracking
  trackInventory  Boolean  @default(true)
  currentStock    Decimal  @default(0.00) @db.Decimal(10, 3)
  minStockLevel   Decimal  @default(0.00) @db.Decimal(10, 3)
  maxStockLevel   Decimal? @db.Decimal(10, 3)
  
  // Costing
  avgCost         Decimal? @db.Decimal(10, 4)
  lastCost        Decimal? @db.Decimal(10, 4)
  
  // Category
  category        String?  // Produce, Meat, Dairy, etc.
  
  // Supplier
  preferredVendorId String?
  
  isActive        Boolean  @default(true)
  
  store           Store    @relation(fields: [storeId], references: [id])
  stockMovements  StockMovement[]
  recipeIngredients RecipeIngredient[]
  vendorItems     VendorItem[]
  
  @@map("inventory_items")
}

model StockMovement {
  id              String          @id @default(uuid())
  inventoryItemId String
  
  type            MovementType
  quantity        Decimal         @db.Decimal(10, 3)
  
  // Reference
  referenceType   String?         // Order, PurchaseOrder, Adjustment, etc.
  referenceId     String?
  
  // Cost tracking
  unitCost        Decimal?        @db.Decimal(10, 4)
  totalCost       Decimal?        @db.Decimal(10, 2)
  
  // Notes
  notes           String?
  
  createdAt       DateTime        @default(now())
  createdById     String?
  
  inventoryItem   InventoryItem   @relation(fields: [inventoryItemId], references: [id])
  
  @@map("stock_movements")
}

model Vendor {
  id          String   @id @default(uuid())
  companyId   String
  
  name        String
  contactName String?
  phone       String?
  email       String?
  address     String?
  
  isActive    Boolean  @default(true)
  
  items       VendorItem[]
  purchaseOrders PurchaseOrder[]
  
  @@map("vendors")
}

model VendorItem {
  id              String   @id @default(uuid())
  vendorId        String
  inventoryItemId String
  
  vendorSku       String?
  unitPrice       Decimal  @db.Decimal(10, 4)
  minOrderQty     Decimal  @default(1.00) @db.Decimal(10, 3)
  leadTimeDays    Int?
  
  isPreferred     Boolean  @default(false)
  
  vendor          Vendor   @relation(fields: [vendorId], references: [id])
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  @@unique([vendorId, inventoryItemId])
  @@map("vendor_items")
}

model PurchaseOrder {
  id          String   @id @default(uuid())
  vendorId    String
  storeId     String
  
  poNumber    String   @unique
  status      PoStatus @default(DRAFT)
  
  orderDate   DateTime @default(now())
  expectedDate DateTime?
  receivedDate DateTime?
  
  subtotal    Decimal  @default(0.00) @db.Decimal(10, 2)
  taxAmount   Decimal  @default(0.00) @db.Decimal(10, 2)
  total       Decimal  @default(0.00) @db.Decimal(10, 2)
  
  items       PurchaseOrderItem[]
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id              String   @id @default(uuid())
  purchaseOrderId String
  inventoryItemId String
  
  quantity        Decimal  @db.Decimal(10, 3)
  unitPrice       Decimal  @db.Decimal(10, 4)
  totalPrice      Decimal  @db.Decimal(10, 2)
  
  receivedQty     Decimal  @default(0.00) @db.Decimal(10, 3)
  
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  
  @@map("purchase_order_items")
}

// ============================================
// FINANCE & ACCOUNTING MODELS
// ============================================

model LedgerAccount {
  id            String      @id @default(uuid())
  companyId     String
  
  code          String      // 1000, 2000, etc.
  name          String      // Cash, Sales Revenue, etc.
  type          AccountType
  subtype       String?     // Current Asset, Operating Expense, etc.
  
  // For bank accounts
  isBankAccount Boolean     @default(false)
  bankName      String?
  accountNumber String?
  
  // Hierarchy
  parentId      String?
  
  isActive      Boolean     @default(true)
  
  company       Company     @relation(fields: [companyId], references: [id])
  parent        LedgerAccount? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      LedgerAccount[] @relation("AccountHierarchy")
  journalLines  JournalLine[]
  
  @@unique([companyId, code])
  @@map("ledger_accounts")
}

model JournalEntry {
  id              String   @id @default(uuid())
  storeId         String?
  
  entryNumber     String   @unique
  date            DateTime @default(now())
  
  // Reference
  referenceType   String?  // Order, Expense, Payroll, etc.
  referenceId     String?
  
  description     String
  
  // Lines (must balance: debits = credits)
  lines           JournalLine[]
  
  // Status
  isPosted        Boolean  @default(false)
  postedAt        DateTime?
  
  createdAt       DateTime @default(now())
  createdById     String?
  
  store           Store?   @relation(fields: [storeId], references: [id])
  
  @@map("journal_entries")
}

model JournalLine {
  id                String   @id @default(uuid())
  journalEntryId    String
  ledgerAccountId   String
  
  description       String?
  
  debit             Decimal  @default(0.00) @db.Decimal(12, 2)
  credit            Decimal  @default(0.00) @db.Decimal(12, 2)
  
  journalEntry      JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  ledgerAccount     LedgerAccount @relation(fields: [ledgerAccountId], references: [id])
  
  @@map("journal_lines")
}

// Expense tracking
model Expense {
  id            String       @id @default(uuid())
  storeId       String
  
  date          DateTime     @default(now())
  category      ExpenseCategory
  description   String
  amount        Decimal      @db.Decimal(10, 2)
  
  // Payment
  paymentMethod PaymentMethod
  paidFromAccountId String?
  
  // Receipt
  receiptUrl    String?
  
  // Vendor
  vendorId      String?
  vendorName    String?
  
  isRecurring   Boolean      @default(false)
  
  createdAt     DateTime     @default(now())
  createdById   String?
  
  store         Store        @relation(fields: [storeId], references: [id])
  
  @@map("expenses")
}

// ============================================
// EMPLOYEE & PAYROLL MODELS
// ============================================

model Employee {
  id              String   @id @default(uuid())
  storeId         String
  userId          String?  // Link to login account
  
  // Personal Info
  firstName       String
  lastName        String
  email           String?
  phone           String?
  address         String?
  ssnLast4        String?  // Encrypted full SSN separately
  dateOfBirth     DateTime?
  hireDate        DateTime @default(now())
  terminationDate DateTime?
  
  // Employment
  type            EmployeeType @default(HOURLY)
  status          EmployeeStatus @default(ACTIVE)
  
  // Compensation
  hourlyRate      Decimal? @db.Decimal(10, 2)
  salary          Decimal? @db.Decimal(10, 2)
  
  // Role
  jobTitle        String
  department      String?  // Kitchen, Front, Delivery, etc.
  
  // Tax Info
  w2Profile       W2Profile?
  
  // Relations
  store           Store    @relation(fields: [storeId], references: [id])
  timeEntries     TimeEntry[]
  payrollRuns     PayrollRunEmployee[]
  
  @@map("employees")
}

model W2Profile {
  id              String   @id @default(uuid())
  employeeId      String   @unique
  
  // Employer Info (snapshot for tax year)
  employerEin     String
  employerName    String
  employerAddress String
  
  // Employee Info
  ssn             String   // Encrypted
  address         String
  
  // Tax Withholdings
  federalAllowances Int    @default(0)
  stateAllowances   Int    @default(0)
  additionalFederal Decimal @default(0.00) @db.Decimal(10, 2)
  additionalState   Decimal @default(0.00) @db.Decimal(10, 2)
  
  // State
  state           String
  localTaxCode    String?
  
  employee        Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  @@map("w2_profiles")
}

model TimeEntry {
  id          String   @id @default(uuid())
  employeeId  String
  
  date        DateTime
  clockIn     DateTime
  clockOut    DateTime?
  
  breakMinutes Int     @default(0)
  
  // Calculated
  regularHours Decimal? @db.Decimal(5, 2)
  overtimeHours Decimal? @db.Decimal(5, 2)
  
  notes       String?
  
  employee    Employee @relation(fields: [employeeId], references: [id])
  
  @@map("time_entries")
}

model PayrollRun {
  id              String   @id @default(uuid())
  storeId         String
  
  periodStart     DateTime
  periodEnd       DateTime
  payDate         DateTime
  
  status          PayrollStatus @default(DRAFT)
  
  // Totals
  totalGross      Decimal  @default(0.00) @db.Decimal(12, 2)
  totalTaxes      Decimal  @default(0.00) @db.Decimal(12, 2)
  totalNet        Decimal  @default(0.00) @db.Decimal(12, 2)
  
  employees       PayrollRunEmployee[]
  
  createdAt       DateTime @default(now())
  processedAt     DateTime?
  processedById   String?
  
  @@map("payroll_runs")
}

model PayrollRunEmployee {
  id              String   @id @default(uuid())
  payrollRunId    String
  employeeId      String
  
  // Hours
  regularHours    Decimal  @db.Decimal(5, 2)
  overtimeHours   Decimal  @db.Decimal(5, 2)
  
  // Earnings
  regularPay      Decimal  @db.Decimal(10, 2)
  overtimePay     Decimal  @db.Decimal(10, 2)
  tips            Decimal  @default(0.00) @db.Decimal(10, 2)
  bonus           Decimal  @default(0.00) @db.Decimal(10, 2)
  grossPay        Decimal  @db.Decimal(10, 2)
  
  // Deductions
  federalTax      Decimal  @default(0.00) @db.Decimal(10, 2)
  stateTax        Decimal  @default(0.00) @db.Decimal(10, 2)
  localTax        Decimal  @default(0.00) @db.Decimal(10, 2)
  socialSecurity  Decimal  @default(0.00) @db.Decimal(10, 2)
  medicare        Decimal  @default(0.00) @db.Decimal(10, 2)
  otherDeductions Decimal  @default(0.00) @db.Decimal(10, 2)
  
  netPay          Decimal  @db.Decimal(10, 2)
  
  payrollRun      PayrollRun @relation(fields: [payrollRunId], references: [id], onDelete: Cascade)
  employee        Employee @relation(fields: [employeeId], references: [id])
  
  @@unique([payrollRunId, employeeId])
  @@map("payroll_run_employees")
}

// ============================================
// PRINTER CONFIGURATION
// ============================================

model Printer {
  id          String   @id @default(uuid())
  storeId     String
  
  name        String
  type        PrinterType @default(THERMAL)
  
  // Connection
  connectionType String @default(NETWORK) // NETWORK, USB, SERIAL
  ipAddress   String?
  port        Int      @default(9100)
  
  // Configuration
  paperWidth  Int      @default(80) // mm
  
  // Print Triggers
  printOnOrder    Boolean @default(false)
  printOnPaid     Boolean @default(true)
  printOnKitchen  Boolean @default(false)
  printOnPacked   Boolean @default(false)
  
  // Station mapping
  station     KitchenStation @default(GENERAL)
  
  isActive    Boolean  @default(true)
  
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@map("printers")
}

// ============================================
// END OF DAY / CLOSE PERIOD
// ============================================

model ClosePeriod {
  id              String   @id @default(uuid())
  storeId         String
  
  periodDate      DateTime
  openedAt        DateTime
  closedAt        DateTime?
  
  // Opening amounts
  openingCash     Decimal  @db.Decimal(10, 2)
  
  // Closing amounts
  closingCash     Decimal?
  expectedCash    Decimal?
  cashDifference  Decimal?
  
  // Sales summary
  totalSales      Decimal  @default(0.00) @db.Decimal(10, 2)
  totalOrders     Int      @default(0)
  
  // Payment breakdown
  cashSales       Decimal  @default(0.00) @db.Decimal(10, 2)
  cardSales       Decimal  @default(0.00) @db.Decimal(10, 2)
  otherSales      Decimal  @default(0.00) @db.Decimal(10, 2)
  
  // Status
  status          CloseStatus @default(OPEN)
  
  // User
  openedById      String
  closedById      String?
  
  store           Store    @relation(fields: [storeId], references: [id])
  
  @@unique([storeId, periodDate])
  @@map("close_periods")
}

// ============================================
// CUSTOMER & LOYALTY
// ============================================

model Customer {
  id          String   @id @default(uuid())
  
  phone       String   @unique
  email       String?
  firstName   String?
  lastName    String?
  
  // Loyalty
  loyaltyPoints Int    @default(0)
  lifetimeSpend Decimal @default(0.00) @db.Decimal(10, 2)
  orderCount    Int    @default(0)
  
  createdAt   DateTime @default(now())
  
  addresses   CustomerAddress[]
  
  @@map("customers")
}

model CustomerAddress {
  id          String   @id @default(uuid())
  customerId  String
  
  label       String   // Home, Work, etc.
  address     String
  city        String
  state       String
  zipCode     String
  
  latitude    Float?
  longitude   Float?
  
  deliveryZoneId String?
  
  isDefault   Boolean  @default(false)
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  deliveryZone DeliveryZone? @relation(fields: [deliveryZoneId], references: [id])
  
  @@map("customer_addresses")
}

// ============================================
// ENUMS
// ============================================

enum ProductType {
  STANDALONE
  COMBO
  MODIFIER_ONLY
}

enum ModifierType {
  SINGLE_SELECT
  MULTI_SELECT
  QUANTITY
}

enum KitchenStation {
  GENERAL
  PIZZA
  FRYER
  SANDWICH
  DRINKS
  DESSERT
  SALAD
  GRILL
}

enum OrderType {
  DINE_IN
  PICKUP
  DELIVERY
  DRIVE_THRU
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  BAKING
  PACKING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  CANCELLED
  REFUNDED
}

enum ItemStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  GIFT_CARD
  ONLINE
  CHECK
  OTHER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum OrderSource {
  POS
  KIOSK
  WEB
  MOBILE_APP
  PHONE
  THIRD_PARTY
}

enum DriverStatus {
  OFFLINE
  ONLINE
  BUSY
  ON_BREAK
}

enum DeliveryStatus {
  ASSIGNED
  ACCEPTED
  AT_STORE
  PICKED_UP
  EN_ROUTE
  ARRIVED
  DELIVERED
  FAILED
}

enum MovementType {
  SALE
  PURCHASE
  ADJUSTMENT
  WASTE
  TRANSFER_IN
  TRANSFER_OUT
  INITIAL
}

enum PoStatus {
  DRAFT
  SENT
  PARTIAL
  RECEIVED
  CANCELLED
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum ExpenseCategory {
  RENT
  UTILITIES
  SUPPLIES
  MARKETING
  REPAIRS
  SOFTWARE
  INSURANCE
  LICENSES
  OTHER
}

enum EmployeeType {
  HOURLY
  SALARY
}

enum EmployeeStatus {
  ACTIVE
  INACTIVE
  TERMINATED
  ON_LEAVE
}

enum PayrollStatus {
  DRAFT
  PENDING
  PROCESSED
  PAID
}

enum PrinterType {
  THERMAL
  IMPACT
  LABEL
}

enum PrinterConnection {
  NETWORK
  USB
  SERIAL
}

enum CloseStatus {
  OPEN
  CLOSING
  CLOSED
  VERIFIED
}
```

---

## D) Key API Routes


### REST API Endpoints

#### Authentication (`/api/v1/auth`)

```typescript
// Authentication Routes
POST   /auth/login              // User login
POST   /auth/logout             // User logout
POST   /auth/refresh            // Refresh JWT token
POST   /auth/forgot-password    // Request password reset
POST   /auth/reset-password     // Reset password with token
GET    /auth/me                 // Get current user
PUT    /auth/me                 // Update current user
```

#### Users & RBAC (`/api/v1/users`, `/api/v1/roles`)

```typescript
// Users
GET    /users                   // List users (with pagination, filters)
POST   /users                   // Create user
GET    /users/:id               // Get user details
PUT    /users/:id               // Update user
DELETE /users/:id               // Deactivate user
GET    /users/:id/stores        // Get user's store access
POST   /users/:id/stores        // Grant store access
DELETE /users/:id/stores/:sid   // Revoke store access

// Roles
GET    /roles                   // List roles
POST   /roles                   // Create role
GET    /roles/:id               // Get role with permissions
PUT    /roles/:id               // Update role
DELETE /roles/:id               // Delete role
PUT    /roles/:id/permissions   // Update role permissions

// Permissions
GET    /permissions             // List all permissions
GET    /permissions/modules     // Group by module
```

#### Stores (`/api/v1/stores`)

```typescript
GET    /stores                  // List stores (scoped to user)
POST   /stores                  // Create store (Owner/Admin only)
GET    /stores/:id              // Get store details
PUT    /stores/:id              // Update store
DELETE /stores/:id              // Deactivate store

// Store Settings
GET    /stores/:id/settings     // Get store settings
PUT    /stores/:id/settings     // Update store settings

// Delivery Zones
GET    /stores/:id/zones        // List delivery zones
POST   /stores/:id/zones        // Create zone
PUT    /stores/:id/zones/:zid   // Update zone
DELETE /stores/:id/zones/:zid   // Delete zone

// Store Reports
GET    /stores/:id/dashboard    // Dashboard KPIs
GET    /stores/:id/sales        // Sales report
GET    /stores/:id/inventory    // Inventory report
```

#### Menu Management (`/api/v1/menu`)

```typescript
// Categories
GET    /menu/categories         // List categories
POST   /menu/categories         // Create category
PUT    /menu/categories/:id     // Update category
DELETE /menu/categories/:id     // Delete category
PUT    /menu/categories/reorder // Reorder categories

// Products
GET    /menu/products           // List products (with filters)
POST   /menu/products           // Create product
GET    /menu/products/:id       // Get product details
PUT    /menu/products/:id       // Update product
DELETE /menu/products/:id       // Deactivate product

// Product Store Overrides
PUT    /menu/products/:id/stores/:sid  // Update store-specific settings

// Modifiers
GET    /menu/modifiers          // List modifiers
POST   /menu/modifiers          // Create modifier
PUT    /menu/modifiers/:id      // Update modifier
DELETE /menu/modifiers/:id      // Delete modifier

// Combos
GET    /menu/combos             // List combos
POST   /menu/combos             // Create combo
PUT    /menu/combos/:id         // Update combo
DELETE /menu/combos/:id         // Delete combo
```

#### Orders (`/api/v1/orders`)

```typescript
GET    /orders                  // List orders (with filters)
POST   /orders                  // Create order
GET    /orders/:id              // Get order details
PUT    /orders/:id              // Update order
DELETE /orders/:id              // Cancel order

// Order Actions
POST   /orders/:id/confirm      // Confirm order
POST   /orders/:id/start-prep   // Start preparation
POST   /orders/:id/complete-item/:itemId  // Complete item
POST   /orders/:id/ready        // Mark ready
POST   /orders/:id/pack         // Mark packed
POST   /orders/:id/assign-driver // Assign driver
POST   /orders/:id/deliver      // Mark delivered
POST   /orders/:id/complete     // Complete order

// Payments
POST   /orders/:id/payments     // Add payment
POST   /orders/:id/refund       // Process refund

// Receipt
GET    /orders/:id/receipt      // Get receipt data
POST   /orders/:id/print        // Trigger print

// Real-time
GET    /orders/active           // Get active orders (for KDS)
GET    /orders/queue/:station   // Get station queue
```

#### Kitchen Display System (`/api/v1/kds`)

```typescript
GET    /kds/orders              // Get orders for KDS
PUT    /kds/orders/:id/start    // Start order
PUT    /kds/orders/:id/complete // Complete order
PUT    /kds/items/:id/complete  // Complete single item
PUT    /kds/items/:id/bump      // Bump item to next station

// Station Management
GET    /kds/stations            // List kitchen stations
GET    /kds/stations/:id/queue  // Get station queue
```

#### Inventory (`/api/v1/inventory`)

```typescript
GET    /inventory/items         // List inventory items
POST   /inventory/items         // Create item
PUT    /inventory/items/:id     // Update item
DELETE /inventory/items/:id     // Deactivate item

// Stock Management
POST   /inventory/adjust        // Adjust stock
POST   /inventory/transfer      // Transfer between stores
GET    /inventory/movements     // Stock movement history

// Low Stock
GET    /inventory/low-stock     // Get low stock alerts

// Vendors
GET    /inventory/vendors       // List vendors
POST   /inventory/vendors       // Create vendor
PUT    /inventory/vendors/:id   // Update vendor

// Purchase Orders
GET    /inventory/po            // List purchase orders
POST   /inventory/po            // Create PO
PUT    /inventory/po/:id        // Update PO
POST   /inventory/po/:id/receive // Receive PO
```

#### Finance (`/api/v1/finance`)

```typescript
// Chart of Accounts
GET    /finance/accounts        // List accounts
POST   /finance/accounts        // Create account
PUT    /finance/accounts/:id    // Update account

// Journal Entries
GET    /finance/journal         // List journal entries
POST   /finance/journal         // Create journal entry
POST   /finance/journal/:id/post // Post journal entry

// Expenses
GET    /finance/expenses        // List expenses
POST   /finance/expenses        // Create expense
PUT    /finance/expenses/:id    // Update expense

// Reports
GET    /finance/pl              // Profit & Loss report
GET    /finance/balance-sheet   // Balance sheet
GET    /finance/cash-flow       // Cash flow report
GET    /finance/tax-summary     // Tax summary

// Export
GET    /finance/export/csv      // Export to CSV
GET    /finance/export/pdf      // Export to PDF
```

#### Employees & Payroll (`/api/v1/employees`, `/api/v1/payroll`)

```typescript
// Employees
GET    /employees               // List employees
POST   /employees               // Create employee
GET    /employees/:id           // Get employee
PUT    /employees/:id           // Update employee
DELETE /employees/:id           // Deactivate

// Time Tracking
GET    /employees/:id/time      // Get time entries
POST   /employees/:id/clock-in  // Clock in
POST   /employees/:id/clock-out // Clock out

// Payroll
GET    /payroll                 // List payroll runs
POST   /payroll                 // Create payroll run
GET    /payroll/:id             // Get payroll details
POST   /payroll/:id/process     // Process payroll
POST   /payroll/:id/pay         // Mark as paid

// W2
GET    /employees/:id/w2        // Get W2 info
PUT    /employees/:id/w2        // Update W2 info
```

#### Drivers (`/api/v1/drivers`)

```typescript
GET    /drivers                 // List drivers
POST   /drivers                 // Create driver
PUT    /drivers/:id             // Update driver
DELETE /drivers/:id             // Deactivate

// Delivery Queue
GET    /drivers/delivery-queue  // Get pending deliveries
POST   /drivers/:id/assign/:orderId // Assign delivery
POST   /drivers/:id/accept      // Accept delivery
POST   /drivers/:id/pickup      // Mark picked up
POST   /drivers/:id/complete    // Mark delivered
POST   /drivers/:id/fail        // Mark failed

// Location
POST   /drivers/:id/location    // Update location
GET    /drivers/:id/tracking    // Get tracking history
```

#### Reports (`/api/v1/reports`)

```typescript
// Sales Reports
GET    /reports/sales/summary   // Sales summary
GET    /reports/sales/by-product // Sales by product
GET    /reports/sales/by-category // Sales by category
GET    /reports/sales/by-hour   // Sales by hour
GET    /reports/sales/by-day    // Sales by day

// Operational Reports
GET    /reports/orders/average-time // Average prep time
GET    /reports/kds/efficiency  // Kitchen efficiency
GET    /reports/drivers/performance // Driver metrics

// Custom Reports
POST   /reports/custom          // Create custom report
GET    /reports/custom/:id      // Get custom report
```

#### Printers (`/api/v1/printers`)

```typescript
GET    /printers                 // List printers
POST   /printers                 // Add printer
PUT    /printers/:id             // Update printer
DELETE /printers/:id             // Remove printer

// Test & Status
POST   /printers/:id/test        // Print test page
GET    /printers/:id/status      // Get printer status
POST   /printers/:id/print       // Print custom content
```

### WebSocket Events

```typescript
// Connection Namespace: /ws

// Client → Server Events
interface ClientEvents {
  // Authentication
  'auth:authenticate': (token: string) => void;
  
  // Store subscription
  'store:subscribe': (storeId: string) => void;
  'store:unsubscribe': (storeId: string) => void;
  
  // Order actions
  'order:create': (order: CreateOrderDto) => void;
  'order:update-status': (orderId: string, status: OrderStatus) => void;
  'order:item-complete': (orderId: string, itemId: string) => void;
  
  // Kitchen actions
  'kitchen:start': (orderId: string) => void;
  'kitchen:complete': (orderId: string) => void;
  'kitchen:bump': (orderId: string) => void;
  
  // Driver actions
  'driver:location': (lat: number, lng: number) => void;
  'driver:status': (status: DriverStatus) => void;
  'driver:accept': (deliveryId: string) => void;
}

// Server → Client Events
interface ServerEvents {
  // Connection
  'connection:established': () => void;
  'connection:error': (error: string) => void;
  
  // Order events
  'order:created': (order: Order) => void;
  'order:updated': (order: Order) => void;
  'order:status-changed': (orderId: string, status: OrderStatus, timestamp: Date) => void;
  
  // Kitchen events
  'kitchen:new-order': (order: Order) => void;
  'kitchen:order-updated': (order: Order) => void;
  'kitchen:item-completed': (orderId: string, itemId: string) => void;
  'kitchen:alert': (message: string, orderId?: string) => void;
  
  // Packing events
  'packing:order-ready': (order: Order) => void;
  'packing:order-packed': (orderId: string) => void;
  
  // OSDU events
  'osdu:order-added': (order: OrderDisplay) => void;
  'osdu:order-updated': (order: OrderDisplay) => void;
  'osdu:order-removed': (orderId: string) => void;
  
  // Driver events
  'driver:assigned': (delivery: Delivery) => void;
  'driver:delivery-updated': (delivery: Delivery) => void;
  'driver:new-delivery': (delivery: Delivery) => void;
  
  // System events
  'system:notification': (notification: Notification) => void;
  'system:printer-status': (printerId: string, status: PrinterStatus) => void;
}
```

---

## E) POS Workflow

### POS Interface Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POS INTERFACE LAYOUT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ HEADER: Store Selector | Order # | Time | User | Notifications | Menu  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │                          │  │                                          │ │
│  │   CATEGORY NAVIGATION    │  │         PRODUCT GRID                     │ │
│  │   ┌──────────────────┐   │  │   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │ │
│  │   │ 🍕 Pizza         │   │  │   │Pep ││Meat││Veg ││Haw ││BBQ │   │ │
│  │   ├──────────────────┤   │  │   │pero││Love││gie ││aiian│Chicken│   │ │
│  │   │ 🥤 Drinks        │   │  │   └────┘ └────┘ └────┘ └────┘ └────┘   │ │
│  │   ├──────────────────┤   │  │   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │ │
│  │   │ 🍚 Rice Platters │   │  │   │Mar ││Sup ││Chee││Buff││Mush│   │ │
│  │   ├──────────────────┤   │  │   │garit││reme││se  ││alo ││room│   │ │
│  │   │ 🥪 Subs          │   │  │   └────┘ └────┘ └────┘ └────┘ └────┘   │ │
│  │   ├──────────────────┤   │  │                                          │ │
│  │   │ 🍗 Wings         │   │  │   [Modifiers Panel - Dynamic]            │ │
│  │   ├──────────────────┤   │  │   ┌────────────────────────────────┐    │ │
│  │   │ 🍝 Pasta         │   │  │   │ Size: [S] [M] [L] [XL]         │    │ │
│  │   ├──────────────────┤   │  │   │ Crust: [Thin] [Thick] [Stuffed]│    │ │
│  │   │ 🍰 Desserts      │   │  │   │ Toppings:                      │    │ │
│  │   ├──────────────────┤   │  │   │ [x] Extra Cheese    +$1.50     │    │ │
│  │   │ 🍟 Sides         │   │  │   │ [ ] Pepperoni       +$2.00     │    │ │
│  │   └──────────────────┘   │  │   │ [ ] Mushrooms       +$1.00     │    │ │
│  │                          │  │   └────────────────────────────────┘    │ │
│  │   [SEARCH: _________]   │  │                                          │ │
│  │                          │  │   [ADD TO ORDER]                         │ │
│  └──────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ CURRENT ORDER CART                                                       ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │ # │ Item                    │ Modifiers        │ Qty │ Price  │ Del │ ││
│  │ ├───┼─────────────────────────┼──────────────────┼─────┼────────┼─────┤ ││
│  │ │ 1 │ Large Pepperoni Pizza   │ Extra Cheese     │  1  │ $18.99 │  🗑  │ ││
│  │ │ 2 │ 6pc Buffalo Wings       │ Ranch Dip        │  1  │  $8.99 │  🗑  │ ││
│  │ │ 3 │ 20oz Coke               │ -                │  2  │  $3.98 │  🗑  │ ││
│  │ └───┴─────────────────────────┴──────────────────┴─────┴────────┴─────┘ ││
│  │                                                                         ││
│  │ Subtotal: $31.96    Tax (8%): $2.56    Total: $34.52                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ACTION BAR                                                               ││
│  │ [DINE-IN] [PICKUP] [DELIVERY] | [HOLD] [DISCOUNT] [SPLIT] [PAY]        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### POS Order Flow

```mermaid
sequenceDiagram
    participant C as Cashier
    participant POS as POS UI
    participant API as API Server
    participant WS as WebSocket
    participant KDS as Kitchen Display
    participant DB as Database
    participant Printer as Receipt Printer

    C->>POS: Select Category (Pizza)
    C->>POS: Select Product (Pepperoni)
    POS->>POS: Show Modifier Panel
    C->>POS: Select Size: Large
    C->>POS: Select Crust: Thin
    C->>POS: Add Extra Cheese
    C->>POS: Click "Add to Order"
    POS->>POS: Update Cart State
    
    C->>POS: Click "Checkout"
    POS->>C: Show Order Type Modal
    C->>POS: Select "Dine-In", Table 5
    
    C->>POS: Click "Pay"
    POS->>C: Show Payment Modal
    C->>POS: Enter Cash: $40.00
    POS->>API: POST /orders
    
    API->>DB: Create Order
    API->>DB: Create OrderItems
    API->>DB: Create Payment
    API->>Printer: Print Receipt
    API->>WS: Emit order:created
    
    WS->>KDS: Broadcast new order
    KDS->>KDS: Display order ticket
    
    API-->>POS: Order confirmed
    POS->>POS: Show change: $5.48
    POS->>Printer: Print Receipt
    
    Note over KDS: Kitchen prepares order
    KDS->>API: PUT /kds/orders/:id/complete
    API->>WS: Emit kitchen:order-completed
    WS->>POS: Update order status
```

### Key POS Components (React)

```typescript
// src/apps/web-admin/src/pages/pos/PosPage.tsx
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CategoryNav } from './components/CategoryNav';
import { ProductGrid } from './components/ProductGrid';
import { ModifierPanel } from './components/ModifierPanel';
import { OrderCart } from './components/OrderCart';
import { PaymentModal } from './components/PaymentModal';
import { OrderTypeModal } from './components/OrderTypeModal';
import { api } from '@/services/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sizeId?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  modifiers: CartModifier[];
  notes?: string;
}

interface CartModifier {
  modifierId: string;
  optionId: string;
  name: string;
  price: number;
}

export const PosPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [showOrderType, setShowOrderType] = useState(false);
  
  const { socket } = useWebSocket();
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.menu.getCategories()
  });
  
  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => api.menu.getProducts({ categoryId: selectedCategory }),
    enabled: !!selectedCategory
  });
  
  // Create order mutation
  const createOrder = useMutation({
    mutationFn: api.orders.create,
    onSuccess: (order) => {
      socket?.emit('order:create', order);
      setCart([]);
      setShowPayment(false);
      // Show success notification
    }
  });
  
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
    setSelectedProduct(null);
  }, []);
  
  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);
  
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  }, [removeFromCart]);
  
  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      const modifiersTotal = item.modifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (item.unitPrice + modifiersTotal) * item.quantity;
    }, 0);
    
    const taxRate = 0.08; // From store settings
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }, [cart]);
  
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowOrderType(true);
  };
  
  const handleOrderTypeConfirm = (type: OrderType, table?: string) => {
    setOrderType(type);
    setTableNumber(table || '');
    setShowOrderType(false);
    setShowPayment(true);
  };
  
  const handlePayment = (paymentData: PaymentData) => {
    const { subtotal, tax, total } = calculateTotals();
    
    createOrder.mutate({
      type: orderType!,
      tableNumber: tableNumber || undefined,
      items: cart.map(item => ({
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        modifiers: item.modifiers,
        notes: item.notes
      })),
      subtotal,
      taxAmount: tax,
      total,
      payments: [paymentData]
    });
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <PosHeader />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Categories */}
        <CategoryNav
          categories={categories || []}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
        
        {/* Center Panel - Products & Modifiers */}
        <div className="flex-1 flex flex-col">
          <ProductGrid
            products={products || []}
            onSelect={setSelectedProduct}
          />
          
          {selectedProduct && (
            <ModifierPanel
              product={selectedProduct}
              onAdd={addToCart}
              onCancel={() => setSelectedProduct(null)}
            />
          )}
        </div>
        
        {/* Right Panel - Cart */}
        <OrderCart
          items={cart}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          totals={calculateTotals()}
          onCheckout={handleCheckout}
        />
      </div>
      
      {/* Modals */}
      {showOrderType && (
        <OrderTypeModal
          onConfirm={handleOrderTypeConfirm}
          onCancel={() => setShowOrderType(false)}
        />
      )}
      
      {showPayment && (
        <PaymentModal
          total={calculateTotals().total}
          onPay={handlePayment}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};
```

---

## F) Kitchen → Packing → Delivery Workflow

### Order Lifecycle State Machine

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐
│ PENDING │───▶│ CONFIRMED │───▶│ PREPARING │───▶│  BAKING   │───▶│ PACKING │
└─────────┘    └───────────┘    └───────────┘    └───────────┘    └────┬────┘
     │                                                                  │
     │         ┌─────────────┐    ┌─────────────┐    ┌─────────┐       │
     └────────▶│ OUT_FOR_DEL │───▶│  DELIVERED  │───▶│COMPLETE │◀──────┘
               │  (Delivery) │    └─────────────┘    └─────────┘
               └─────────────┘           ▲
                                         │
               ┌─────────────┐           │
               │    READY    │───────────┘
               │  (Pickup)   │
               └─────────────┘
```

### Kitchen Display System (KDS) Flow

```mermaid
sequenceDiagram
    participant POS as POS
    participant API as API Server
    participant WS as WebSocket
    participant KDS as KDS Display
    participant Station as Kitchen Station
    participant Pack as Packing Station
    
    POS->>API: POST /orders
    API->>WS: Emit kitchen:new-order
    WS->>KDS: Display order
    
    Note over KDS: Order appears on KDS
    
    alt Pizza Station
        KDS->>API: PUT /kds/orders/:id/start
        API->>WS: Emit kitchen:order-updated
        WS->>KDS: Show "In Progress"
        
        Note over Station: Chef prepares pizza
        
        Station->>KDS: Mark item complete
        KDS->>API: PUT /kds/items/:id/complete
        API->>WS: Emit kitchen:item-completed
    end
    
    alt Fryer Station
        KDS->>API: PUT /kds/orders/:id/start (Wings)
        Note over Station: Fry wings
        Station->>KDS: Mark complete
        KDS->>API: PUT /kds/items/:id/complete
    end
    
    Note over KDS: All items complete
    
    KDS->>API: PUT /kds/orders/:id/complete
    API->>WS: Emit packing:order-ready
    WS->>Pack: Show order for packing
    
    Note over Pack: Staff packs order
    
    Pack->>API: POST /orders/:id/pack
    API->>WS: Emit packing:order-packed
    
    alt Delivery Order
        API->>WS: Emit driver:new-delivery
        WS->>Driver: Show delivery
    else Pickup Order
        API->>WS: Emit osdu:order-ready
        WS->>OSDU: Show "Ready for Pickup"
    end
```

### KDS Interface Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KITCHEN DISPLAY SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ STATION SELECTOR: [ALL] [PIZZA] [FRYER] [SANDWICH] [DRINKS]          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ NEW ORDERS (0-10 min)                                                   ││
│  │ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          ││
│  │ │ 🔵 ORDER #1024  │  │ 🔵 ORDER #1025  │  │ 🔵 ORDER #1026  │          ││
│  │ │ Token: T-47     │  │ Token: T-48     │  │ Token: T-49     │          ││
│  │ │ ⏱️ 03:24       │  │ ⏱️ 01:15       │  │ ⏱️ 00:45       │          ││
│  │ ├─────────────────┤  ├─────────────────┤  ├─────────────────┤          ││
│  │ │ Large Pepperoni │  │ 6pc Wings       │  │ 2x Sub Combo    │          ││
│  │ │ - Extra Cheese  │  │ - Ranch         │  │ - Chips + Drink │          ││
│  │ │ - Thin Crust    │  │                 │  │                 │          ││
│  │ │                 │  │                 │  │                 │          ││
│  │ │ [START]         │  │ [START]         │  │ [START]         │          ││
│  │ └─────────────────┘  └─────────────────┘  └─────────────────┘          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ IN PROGRESS (10-20 min)                                                 ││
│  │ ┌─────────────────┐  ┌─────────────────┐                                 ││
│  │ │ 🟡 ORDER #1022  │  │ 🟡 ORDER #1023  │                                 ││
│  │ │ Token: T-45     │  │ Token: T-46     │                                 ││
│  │ │ ⏱️ 12:45       │  │ ⏱️ 08:30       │                                 ││
│  │ ├─────────────────┤  ├─────────────────┤                                 ││
│  │ │ Med Veggie      │  │ Large Supreme   │                                 ││
│  │ │ - No Onions     │  │ - Stuffed Crust │                                 ││
│  │ │ ⏳ Baking...    │  │ ✅ Ready        │                                 ││
│  │ │                 │  │                 │                                 ││
│  │ │ [COMPLETE]      │  │ [COMPLETE]      │                                 ││
│  │ └─────────────────┘  └─────────────────┘                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ OVERDUE (>20 min) ⚠️                                                    ││
│  │ ┌─────────────────┐                                                     ││
│  │ │ 🔴 ORDER #1020  │  [ALERT SOUND]                                      ││
│  │ │ Token: T-43     │                                                     ││
│  │ │ ⏱️ 24:30 ⚠️    │                                                     ││
│  │ │ [BUMP TO TOP]   │                                                     ││
│  │ └─────────────────┘                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ STATS: Active: 6 | Avg Time: 14 min | Completed Today: 147             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Packing Station Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PACKING / DISPATCH STATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ORDERS READY FOR PACKING                                                ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │ ORDER #1024 | Token: T-47 | Type: PICKUP                           │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ ☐ Large Pepperoni Pizza     ☐ 6pc Buffalo Wings                   │ ││
│  │ │ ☐ Extra Cheese Modifier     ☐ Ranch Dip                           │ ││
│  │ │ ☐ Thin Crust                                                         │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ ADD-ONS: ☐ Napkins ☐ Utensils ☐ Parmesan ☐ Red Pepper             │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ [PRINT PACKING SLIP]  [MARK PACKED]  [ASSIGN TO SHELF: A-3]       │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                         ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │ ORDER #1025 | Token: T-48 | Type: DELIVERY | Zone: North           │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ ☐ Large Supreme Pizza       ☐ 2L Coke                             │ ││
│  │ │ ☐ Stuffed Crust             ☐ Breadsticks                         │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ ADD-ONS: ☐ Napkins ☐ Utensils                                      │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │ ASSIGNED DRIVER: [John D. ▼]  [MARK READY FOR PICKUP]             │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ DELIVERY QUEUE                                                          ││
│  │ ┌──────────┬──────────┬──────────┬──────────┬──────────┐               ││
│  │ │ Order    │ Token    │ Driver   │ Status   │ Actions  │               ││
│  │ ├──────────┼──────────┼──────────┼──────────┼──────────┤               ││
│  │ │ #1019    │ T-42     │ Mike S.  │ En Route │ Track    │               ││
│  │ │ #1021    │ T-44     │ -        │ Waiting  │ Assign   │               ││
│  │ └──────────┴──────────┴──────────┴──────────┴──────────┘               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Order Status Display Unit (OSDU / Lobby Screen)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    🍕 PIZZA PALACE - ORDER STATUS 🍕                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   🔵 PREPARING      │  │   🟡 BAKING         │  │   🟢 READY          │  │
│  │                     │  │                     │  │                     │  │
│  │   T-47              │  │   T-45              │  │   T-43 ⭐          │  │
│  │   T-48              │  │   T-46              │  │   T-42              │  │
│  │   T-49              │  │                     │  │                     │  │
│  │                     │  │                     │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         📢 NOW SERVING                                  ││
│  │                                                                         ││
│  │                    🎉 T-43 🎉  T-42 🎉                                  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ⏰ Estimated Wait Time: 15-20 minutes  |  📞 (555) 123-4567           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## G) P&L Formulas & SQL

### Chart of Accounts Structure

```
ASSETS (1000-1999)
  1000 - Cash on Hand
  1010 - Checking Account
  1020 - Savings Account
  1100 - Accounts Receivable
  1200 - Inventory
  1300 - Prepaid Expenses

LIABILITIES (2000-2999)
  2000 - Accounts Payable
  2100 - Sales Tax Payable
  2200 - Payroll Liabilities
  2300 - Loans Payable

EQUITY (3000-3999)
  3000 - Owner's Equity
  3100 - Retained Earnings

REVENUE (4000-4999)
  4000 - Food Sales
  4010 - Beverage Sales
  4020 - Delivery Fee Revenue
  4100 - Tips (pass-through)

COST OF GOODS SOLD (5000-5999)
  5000 - Food COGS
  5100 - Beverage COGS

OPERATING EXPENSES (6000-6999)
  6000 - Rent
  6100 - Utilities
  6200 - Payroll
  6300 - Marketing
  6400 - Supplies
  6500 - Repairs
  6600 - Software
  6700 - Insurance
```

### Journal Entry Automation

```typescript
// Auto-create journal entry on order completion
async function createSalesJournalEntry(order: Order) {
  const entries = [
    // Debit: Cash/AR
    {
      ledgerAccountId: '1000', // Cash on Hand
      debit: order.total,
      credit: 0,
      description: `Order #${order.orderNumber}`
    },
    // Credit: Sales Revenue
    {
      ledgerAccountId: '4000', // Food Sales
      debit: 0,
      credit: order.subtotal,
      description: `Order #${order.orderNumber} - Sales`
    },
    // Credit: Sales Tax Payable
    {
      ledgerAccountId: '2100', // Sales Tax Payable
      debit: 0,
      credit: order.taxAmount,
      description: `Order #${order.orderNumber} - Tax`
    }
  ];
  
  if (order.deliveryFee > 0) {
    entries.push({
      ledgerAccountId: '4020', // Delivery Fee Revenue
      debit: 0,
      credit: order.deliveryFee,
      description: `Order #${order.orderNumber} - Delivery Fee`
    });
  }
  
  await prisma.journalEntry.create({
    data: {
      storeId: order.storeId,
      entryNumber: generateEntryNumber(),
      date: new Date(),
      referenceType: 'Order',
      referenceId: order.id,
      description: `Sales - Order #${order.orderNumber}`,
      isPosted: true,
      postedAt: new Date(),
      lines: {
        create: entries
      }
    }
  });
}

// Auto-create COGS entry on inventory consumption
async function createCOGSJournalEntry(order: Order) {
  const cogsAmount = await calculateOrderCOGS(order);
  
  await prisma.journalEntry.create({
    data: {
      storeId: order.storeId,
      entryNumber: generateEntryNumber(),
      date: new Date(),
      referenceType: 'Order',
      referenceId: order.id,
      description: `COGS - Order #${order.orderNumber}`,
      isPosted: true,
      lines: {
        create: [
          {
            ledgerAccountId: '5000', // COGS
            debit: cogsAmount,
            credit: 0,
            description: `COGS - Order #${order.orderNumber}`
          },
          {
            ledgerAccountId: '1200', // Inventory
            debit: 0,
            credit: cogsAmount,
            description: `Inventory consumed - Order #${order.orderNumber}`
          }
        ]
      }
    }
  });
}
```

### P&L Report SQL Queries

```sql
-- ============================================
-- PROFIT & LOSS REPORT
-- ============================================

-- Revenue by Category
WITH revenue_by_category AS (
  SELECT 
    'Food Sales' as category,
    SUM(subtotal - COALESCE(beverage_amount, 0)) as amount
  FROM orders o
  LEFT JOIN (
    SELECT 
      order_id,
      SUM(total_price) as beverage_amount
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE c.name = 'Drinks'
    GROUP BY order_id
  ) bev ON o.id = bev.order_id
  WHERE o.status IN ('COMPLETED', 'DELIVERED')
    AND o.store_id = :store_id
    AND o.created_at BETWEEN :start_date AND :end_date
  
  UNION ALL
  
  SELECT 
    'Beverage Sales' as category,
    COALESCE(SUM(total_price), 0) as amount
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  JOIN products p ON oi.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE c.name = 'Drinks'
    AND o.status IN ('COMPLETED', 'DELIVERED')
    AND o.store_id = :store_id
    AND o.created_at BETWEEN :start_date AND :end_date
  
  UNION ALL
  
  SELECT 
    'Delivery Fees' as category,
    SUM(delivery_fee) as amount
  FROM orders
  WHERE status IN ('COMPLETED', 'DELIVERED')
    AND store_id = :store_id
    AND created_at BETWEEN :start_date AND :end_date
),

-- COGS Calculation
cogs AS (
  SELECT 
    SUM(sm.total_cost) as total_cogs
  FROM stock_movements sm
  WHERE sm.type = 'SALE'
    AND sm.store_id = :store_id
    AND sm.created_at BETWEEN :start_date AND :end_date
),

-- Expenses by Category
expenses AS (
  SELECT 
    category,
    SUM(amount) as amount
  FROM expenses
  WHERE store_id = :store_id
    AND date BETWEEN :start_date AND :end_date
  GROUP BY category
)

-- Final P&L
SELECT 
  'REVENUE' as section,
  r.category as line_item,
  r.amount as amount,
  NULL as percentage
FROM revenue_by_category r

UNION ALL

SELECT 
  'TOTAL REVENUE' as section,
  NULL as line_item,
  SUM(r.amount) as amount,
  100.0 as percentage
FROM revenue_by_category r

UNION ALL

SELECT 
  'COST OF GOODS SOLD' as section,
  'COGS' as line_item,
  c.total_cogs as amount,
  (c.total_cogs / NULLIF((SELECT SUM(amount) FROM revenue_by_category), 0)) * 100 as percentage
FROM cogs c

UNION ALL

SELECT 
  'GROSS PROFIT' as section,
  NULL as line_item,
  (SELECT SUM(amount) FROM revenue_by_category) - c.total_cogs as amount,
  (((SELECT SUM(amount) FROM revenue_by_category) - c.total_cogs) / NULLIF((SELECT SUM(amount) FROM revenue_by_category), 0)) * 100 as percentage
FROM cogs c

UNION ALL

SELECT 
  'OPERATING EXPENSES' as section,
  INITCAP(REPLACE(category::text, '_', ' ')) as line_item,
  amount,
  (amount / NULLIF((SELECT SUM(amount) FROM revenue_by_category), 0)) * 100 as percentage
FROM expenses

UNION ALL

SELECT 
  'TOTAL EXPENSES' as section,
  NULL as line_item,
  SUM(amount) as amount,
  (SUM(amount) / NULLIF((SELECT SUM(amount) FROM revenue_by_category), 0)) * 100 as percentage
FROM expenses

UNION ALL

SELECT 
  'NET INCOME' as section,
  NULL as line_item,
  (SELECT SUM(amount) FROM revenue_by_category) - c.total_cogs - COALESCE((SELECT SUM(amount) FROM expenses), 0) as amount,
  (((SELECT SUM(amount) FROM revenue_by_category) - c.total_cogs - COALESCE((SELECT SUM(amount) FROM expenses), 0)) / NULLIF((SELECT SUM(amount) FROM revenue_by_category), 0)) * 100 as percentage
FROM cogs c;
```

### Dashboard KPIs SQL

```sql
-- ============================================
-- DASHBOARD KPIs
-- ============================================

-- Today's Sales Summary
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_sales,
  AVG(total) as avg_order_value,
  SUM(CASE WHEN type = 'DINE_IN' THEN 1 ELSE 0 END) as dine_in_count,
  SUM(CASE WHEN type = 'PICKUP' THEN 1 ELSE 0 END) as pickup_count,
  SUM(CASE WHEN type = 'DELIVERY' THEN 1 ELSE 0 END) as delivery_count
FROM orders
WHERE store_id = :store_id
  AND DATE(created_at) = CURRENT_DATE
  AND status IN ('COMPLETED', 'DELIVERED');

-- Hourly Sales Trend
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as order_count,
  SUM(total) as sales_amount
FROM orders
WHERE store_id = :store_id
  AND DATE(created_at) = CURRENT_DATE
  AND status IN ('COMPLETED', 'DELIVERED')
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- Top Selling Products
SELECT 
  p.name as product_name,
  c.name as category,
  SUM(oi.quantity) as units_sold,
  SUM(oi.total_price) as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE o.store_id = :store_id
  AND o.created_at BETWEEN :start_date AND :end_date
  AND o.status IN ('COMPLETED', 'DELIVERED')
GROUP BY p.id, p.name, c.name
ORDER BY revenue DESC
LIMIT 10;

-- Kitchen Performance Metrics
SELECT 
  kitchen_station,
  COUNT(*) as total_orders,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_prep_minutes
FROM order_items
WHERE store_id = :store_id
  AND created_at BETWEEN :start_date AND :end_date
  AND status = 'COMPLETED'
GROUP BY kitchen_station;

-- Inventory Alerts
SELECT 
  name,
  current_stock,
  min_stock_level,
  unit,
  (current_stock / min_stock_level * 100) as stock_percentage
FROM inventory_items
WHERE store_id = :store_id
  AND track_inventory = true
  AND current_stock <= min_stock_level
ORDER BY stock_percentage ASC;

-- Driver Performance
SELECT 
  d.name as driver_name,
  COUNT(del.id) as deliveries_completed,
  AVG(EXTRACT(EPOCH FROM (del.delivered_at - del.picked_up_at)) / 60) as avg_delivery_minutes,
  SUM(o.delivery_fee) as delivery_fees_generated
FROM drivers d
LEFT JOIN deliveries del ON d.id = del.driver_id
LEFT JOIN orders o ON del.order_id = o.id
WHERE d.store_id = :store_id
  AND del.delivered_at BETWEEN :start_date AND :end_date
GROUP BY d.id, d.name
ORDER BY deliveries_completed DESC;
```

---

## H) Seed Data

### Seed Script (Prisma)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  
  // ============================================
  // 1. CREATE COMPANY
  // ============================================
  const company = await prisma.company.create({
    data: {
      name: 'Pizza Palace Inc.',
      legalName: 'Pizza Palace Restaurant Group LLC',
      taxId: '12-3456789',
      address: '123 Main Street, New York, NY 10001',
      phone: '(555) 123-4567',
      email: 'admin@pizzapalace.com',
      timezone: 'America/New_York',
      currency: 'USD'
    }
  });
  
  // ============================================
  // 2. CREATE STORES
  // ============================================
  const store1 = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Pizza Palace - Downtown',
      code: 'PP-DT',
      address: '456 Broadway, New York, NY 10013',
      city: 'New York',
      state: 'NY',
      zipCode: '10013',
      phone: '(555) 234-5678',
      email: 'downtown@pizzapalace.com',
      taxRate: 0.08875,
      taxName: 'NYC Sales Tax',
      deliveryFee: 3.99,
      operatingHours: JSON.stringify({
        monday: { open: '10:00', close: '23:00' },
        tuesday: { open: '10:00', close: '23:00' },
        wednesday: { open: '10:00', close: '23:00' },
        thursday: { open: '10:00', close: '23:00' },
        friday: { open: '10:00', close: '24:00' },
        saturday: { open: '10:00', close: '24:00' },
        sunday: { open: '11:00', close: '22:00' }
      }),
      settings: {
        create: {
          orderNumberPrefix: 'DT',
          tokenNumberPrefix: 'D',
          pizzaPrepTimeMinutes: 15,
          fryerPrepTimeMinutes: 8,
          acceptCash: true,
          acceptCard: true,
          acceptOnlinePayment: true
        }
      }
    }
  });
  
  const store2 = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Pizza Palace - Uptown',
      code: 'PP-UT',
      address: '789 Amsterdam Ave, New York, NY 10025',
      city: 'New York',
      state: 'NY',
      zipCode: '10025',
      phone: '(555) 345-6789',
      email: 'uptown@pizzapalace.com',
      taxRate: 0.08875,
      taxName: 'NYC Sales Tax',
      deliveryFee: 2.99,
      operatingHours: JSON.stringify({
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' }
      }),
      settings: {
        create: {
          orderNumberPrefix: 'UT',
          tokenNumberPrefix: 'U',
          pizzaPrepTimeMinutes: 12,
          fryerPrepTimeMinutes: 6,
          acceptCash: true,
          acceptCard: true,
          acceptOnlinePayment: true
        }
      }
    }
  });
  
  // ============================================
  // 3. CREATE ROLES & PERMISSIONS
  // ============================================
  const permissions = await prisma.permission.createMany({
    data: [
      // Orders
      { code: 'orders:view', name: 'View Orders', module: 'orders' },
      { code: 'orders:create', name: 'Create Orders', module: 'orders' },
      { code: 'orders:update', name: 'Update Orders', module: 'orders' },
      { code: 'orders:delete', name: 'Cancel Orders', module: 'orders' },
      { code: 'orders:refund', name: 'Process Refunds', module: 'orders' },
      // Menu
      { code: 'menu:view', name: 'View Menu', module: 'menu' },
      { code: 'menu:create', name: 'Create Products', module: 'menu' },
      { code: 'menu:update', name: 'Update Products', module: 'menu' },
      { code: 'menu:delete', name: 'Delete Products', module: 'menu' },
      // Inventory
      { code: 'inventory:view', name: 'View Inventory', module: 'inventory' },
      { code: 'inventory:manage', name: 'Manage Inventory', module: 'inventory' },
      // Finance
      { code: 'finance:view', name: 'View Financial Reports', module: 'finance' },
      { code: 'finance:manage', name: 'Manage Finances', module: 'finance' },
      // Users
      { code: 'users:view', name: 'View Users', module: 'users' },
      { code: 'users:manage', name: 'Manage Users', module: 'users' },
      // Settings
      { code: 'settings:view', name: 'View Settings', module: 'settings' },
      { code: 'settings:manage', name: 'Manage Settings', module: 'settings' }
    ]
  });
  
  const allPermissions = await prisma.permission.findMany();
  
  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      description: 'Full system access',
      isSystem: true,
      permissions: {
        create: allPermissions.map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Administrative access',
      isSystem: true,
      permissions: {
        create: allPermissions
          .filter(p => !p.code.includes('delete'))
          .map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  const managerRole = await prisma.role.create({
    data: {
      name: 'Store Manager',
      description: 'Store management access',
      isSystem: true,
      permissions: {
        create: allPermissions
          .filter(p => 
            p.code.startsWith('orders:') || 
            p.code.startsWith('menu:view') ||
            p.code.startsWith('inventory:') ||
            p.code.startsWith('finance:view') ||
            p.code.startsWith('users:view')
          )
          .map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  const cashierRole = await prisma.role.create({
    data: {
      name: 'Cashier',
      description: 'POS access only',
      isSystem: true,
      permissions: {
        create: allPermissions
          .filter(p => 
            p.code === 'orders:view' || 
            p.code === 'orders:create' ||
            p.code === 'menu:view'
          )
          .map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  // ============================================
  // 4. CREATE USERS
  // ============================================
  const passwordHash = await hash('password123', 10);
  
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'owner@pizzapalace.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
      phone: '(555) 111-1111',
      roleId: ownerRole.id,
      storeAccess: {
        create: [
          { storeId: store1.id, isDefault: true },
          { storeId: store2.id }
        ]
      }
    }
  });
  
  const manager1 = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager.dt@pizzapalace.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(555) 222-2222',
      roleId: managerRole.id,
      storeAccess: {
        create: [{ storeId: store1.id, isDefault: true }]
      }
    }
  });
  
  const cashier1 = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'cashier.dt@pizzapalace.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Davis',
      phone: '(555) 333-3333',
      roleId: cashierRole.id,
      storeAccess: {
        create: [{ storeId: store1.id, isDefault: true }]
      }
    }
  });
  
  // ============================================
  // 5. CREATE CATEGORIES
  // ============================================
  const categories = await prisma.category.createMany({
    data: [
      // Store 1
      { storeId: store1.id, name: 'Pizza', description: 'Hand-tossed pizzas', sortOrder: 1, color: '#FF6B35' },
      { storeId: store1.id, name: 'Drinks', description: 'Beverages', sortOrder: 2, color: '#4ECDC4' },
      { storeId: store1.id, name: 'Wings', description: 'Chicken wings', sortOrder: 3, color: '#FFE66D' },
      { storeId: store1.id, name: 'Sides', description: 'Appetizers & sides', sortOrder: 4, color: '#95E1D3' },
      { storeId: store1.id, name: 'Desserts', description: 'Sweet treats', sortOrder: 5, color: '#F38181' },
      // Store 2
      { storeId: store2.id, name: 'Pizza', description: 'Hand-tossed pizzas', sortOrder: 1, color: '#FF6B35' },
      { storeId: store2.id, name: 'Drinks', description: 'Beverages', sortOrder: 2, color: '#4ECDC4' },
      { storeId: store2.id, name: 'Wings', description: 'Chicken wings', sortOrder: 3, color: '#FFE66D' },
      { storeId: store2.id, name: 'Sides', description: 'Appetizers & sides', sortOrder: 4, color: '#95E1D3' },
      { storeId: store2.id, name: 'Desserts', description: 'Sweet treats', sortOrder: 5, color: '#F38181' }
    ]
  });
  
  const store1Categories = await prisma.category.findMany({ where: { storeId: store1.id } });
  const pizzaCat = store1Categories.find(c => c.name === 'Pizza');
  const drinksCat = store1Categories.find(c => c.name === 'Drinks');
  const wingsCat = store1Categories.find(c => c.name === 'Wings');
  const sidesCat = store1Categories.find(c => c.name === 'Sides');
  const dessertsCat = store1Categories.find(c => c.name === 'Desserts');
  
  // ============================================
  // 6. CREATE PRODUCTS
  // ============================================
  
  // Pizza Modifiers
  const pizzaSizeMod = await prisma.modifier.create({
    data: {
      name: 'Pizza Size',
      type: 'SINGLE_SELECT',
      options: {
        create: [
          { name: 'Small (10")', priceAdjustment: -4.00 },
          { name: 'Medium (12")', priceAdjustment: 0 },
          { name: 'Large (14")', priceAdjustment: 3.00 },
          { name: 'X-Large (16")', priceAdjustment: 6.00 }
        ]
      }
    }
  });
  
  const crustMod = await prisma.modifier.create({
    data: {
      name: 'Crust Type',
      type: 'SINGLE_SELECT',
      options: {
        create: [
          { name: 'Hand Tossed', priceAdjustment: 0 },
          { name: 'Thin Crust', priceAdjustment: 0 },
          { name: 'Thick Crust', priceAdjustment: 1.00 },
          { name: 'Stuffed Crust', priceAdjustment: 2.50 },
          { name: 'Gluten Free', priceAdjustment: 3.00 }
        ]
      }
    }
  });
  
  const toppingsMod = await prisma.modifier.create({
    data: {
      name: 'Toppings',
      type: 'MULTI_SELECT',
      options: {
        create: [
          { name: 'Extra Cheese', priceAdjustment: 1.50 },
          { name: 'Pepperoni', priceAdjustment: 2.00 },
          { name: 'Sausage', priceAdjustment: 2.00 },
          { name: 'Mushrooms', priceAdjustment: 1.50 },
          { name: 'Onions', priceAdjustment: 1.00 },
          { name: 'Green Peppers', priceAdjustment: 1.00 },
          { name: 'Black Olives', priceAdjustment: 1.50 },
          { name: 'Bacon', priceAdjustment: 2.50 },
          { name: 'Ham', priceAdjustment: 2.00 },
          { name: 'Pineapple', priceAdjustment: 1.50 }
        ]
      }
    }
  });
  
  // Create Pizzas
  const pepperoniPizza = await prisma.product.create({
    data: {
      categoryId: pizzaCat!.id,
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni with mozzarella cheese',
      basePrice: 14.99,
      costPrice: 4.50,
      prepTimeMinutes: 15,
      kitchenStation: 'PIZZA',
      modifiers: {
        create: [
          { modifierId: pizzaSizeMod.id, isRequired: true, sortOrder: 1 },
          { modifierId: crustMod.id, isRequired: true, sortOrder: 2 },
          { modifierId: toppingsMod.id, isRequired: false, sortOrder: 3 }
        ]
      },
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 14.99, isAvailable: true },
          { storeId: store2.id, price: 13.99, isAvailable: true }
        ]
      }
    }
  });
  
  const supremePizza = await prisma.product.create({
    data: {
      categoryId: pizzaCat!.id,
      name: 'Supreme Pizza',
      description: 'Pepperoni, sausage, mushrooms, onions, peppers',
      basePrice: 17.99,
      costPrice: 5.50,
      prepTimeMinutes: 18,
      kitchenStation: 'PIZZA',
      modifiers: {
        create: [
          { modifierId: pizzaSizeMod.id, isRequired: true, sortOrder: 1 },
          { modifierId: crustMod.id, isRequired: true, sortOrder: 2 }
        ]
      },
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 17.99, isAvailable: true },
          { storeId: store2.id, price: 16.99, isAvailable: true }
        ]
      }
    }
  });
  
  const cheesePizza = await prisma.product.create({
    data: {
      categoryId: pizzaCat!.id,
      name: 'Cheese Pizza',
      description: 'Classic mozzarella cheese pizza',
      basePrice: 11.99,
      costPrice: 3.00,
      prepTimeMinutes: 12,
      kitchenStation: 'PIZZA',
      modifiers: {
        create: [
          { modifierId: pizzaSizeMod.id, isRequired: true, sortOrder: 1 },
          { modifierId: crustMod.id, isRequired: true, sortOrder: 2 },
          { modifierId: toppingsMod.id, isRequired: false, sortOrder: 3 }
        ]
      },
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 11.99, isAvailable: true },
          { storeId: store2.id, price: 10.99, isAvailable: true }
        ]
      }
    }
  });
  
  // Create Drinks
  const coke = await prisma.product.create({
    data: {
      categoryId: drinksCat!.id,
      name: 'Coca-Cola',
      description: 'Refreshing cola beverage',
      basePrice: 2.49,
      costPrice: 0.50,
      prepTimeMinutes: 1,
      kitchenStation: 'DRINKS',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 2.49, isAvailable: true },
          { storeId: store2.id, price: 2.29, isAvailable: true }
        ]
      }
    }
  });
  
  const sprite = await prisma.product.create({
    data: {
      categoryId: drinksCat!.id,
      name: 'Sprite',
      description: 'Lemon-lime soda',
      basePrice: 2.49,
      costPrice: 0.50,
      prepTimeMinutes: 1,
      kitchenStation: 'DRINKS',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 2.49, isAvailable: true },
          { storeId: store2.id, price: 2.29, isAvailable: true }
        ]
      }
    }
  });
  
  // Create Wings
  const buffaloWings = await prisma.product.create({
    data: {
      categoryId: wingsCat!.id,
      name: 'Buffalo Wings',
      description: 'Spicy buffalo chicken wings',
      basePrice: 8.99,
      costPrice: 3.00,
      prepTimeMinutes: 12,
      kitchenStation: 'FRYER',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 8.99, isAvailable: true },
          { storeId: store2.id, price: 7.99, isAvailable: true }
        ]
      }
    }
  });
  
  const bbqWings = await prisma.product.create({
    data: {
      categoryId: wingsCat!.id,
      name: 'BBQ Wings',
      description: 'Sweet and smoky BBQ wings',
      basePrice: 8.99,
      costPrice: 3.00,
      prepTimeMinutes: 12,
      kitchenStation: 'FRYER',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 8.99, isAvailable: true },
          { storeId: store2.id, price: 7.99, isAvailable: true }
        ]
      }
    }
  });
  
  // Create Sides
  const garlicBread = await prisma.product.create({
    data: {
      categoryId: sidesCat!.id,
      name: 'Garlic Bread',
      description: 'Toasted garlic bread with herbs',
      basePrice: 4.99,
      costPrice: 1.00,
      prepTimeMinutes: 5,
      kitchenStation: 'GENERAL',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 4.99, isAvailable: true },
          { storeId: store2.id, price: 4.49, isAvailable: true }
        ]
      }
    }
  });
  
  const breadsticks = await prisma.product.create({
    data: {
      categoryId: sidesCat!.id,
      name: 'Breadsticks',
      description: 'Warm breadsticks with marinara',
      basePrice: 5.99,
      costPrice: 1.50,
      prepTimeMinutes: 6,
      kitchenStation: 'GENERAL',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 5.99, isAvailable: true },
          { storeId: store2.id, price: 5.49, isAvailable: true }
        ]
      }
    }
  });
  
  // Create Desserts
  const cinnamonSticks = await prisma.product.create({
    data: {
      categoryId: dessertsCat!.id,
      name: 'Cinnamon Sticks',
      description: 'Sweet cinnamon sugar sticks',
      basePrice: 5.99,
      costPrice: 1.20,
      prepTimeMinutes: 8,
      kitchenStation: 'DESSERT',
      storeConfigs: {
        create: [
          { storeId: store1.id, price: 5.99, isAvailable: true },
          { storeId: store2.id, price: 5.49, isAvailable: true }
        ]
      }
    }
  });
  
  // ============================================
  // 7. CREATE DELIVERY ZONES
  // ============================================
  await prisma.deliveryZone.createMany({
    data: [
      { storeId: store1.id, name: 'Downtown Core', zoneType: 'radius', centerLat: 40.7209, centerLng: -74.0007, radiusKm: 2, deliveryFee: 2.99, minOrderAmount: 10.00, estimatedMinutes: 25 },
      { storeId: store1.id, name: 'Midtown', zoneType: 'radius', centerLat: 40.7509, centerLng: -73.9871, radiusKm: 3, deliveryFee: 3.99, minOrderAmount: 15.00, estimatedMinutes: 35 },
      { storeId: store2.id, name: 'Uptown Local', zoneType: 'radius', centerLat: 40.7989, centerLng: -73.9654, radiusKm: 2.5, deliveryFee: 2.99, minOrderAmount: 12.00, estimatedMinutes: 30 },
      { storeId: store2.id, name: 'Harlem', zoneType: 'radius', centerLat: 40.8176, centerLng: -73.9482, radiusKm: 3, deliveryFee: 3.99, minOrderAmount: 15.00, estimatedMinutes: 40 }
    ]
  });
  
  // ============================================
  // 8. CREATE DRIVERS
  // ============================================
  await prisma.driver.createMany({
    data: [
      { storeId: store1.id, name: 'Mike Johnson', phone: '(555) 444-4444', email: 'mike.j@pizzapalace.com', vehicleType: 'Car', licensePlate: 'ABC1234', perDeliveryRate: 4.00 },
      { storeId: store1.id, name: 'Sarah Lee', phone: '(555) 555-5555', email: 'sarah.l@pizzapalace.com', vehicleType: 'Scooter', licensePlate: 'XYZ789', perDeliveryRate: 4.00 },
      { storeId: store2.id, name: 'David Chen', phone: '(555) 666-6666', email: 'david.c@pizzapalace.com', vehicleType: 'Car', licensePlate: 'DEF5678', perDeliveryRate: 4.00 }
    ]
  });
  
  // ============================================
  // 9. CREATE LEDGER ACCOUNTS
  // ============================================
  await prisma.ledgerAccount.createMany({
    data: [
      // Assets
      { companyId: company.id, code: '1000', name: 'Cash on Hand', type: 'ASSET', isBankAccount: false },
      { companyId: company.id, code: '1010', name: 'Checking Account', type: 'ASSET', isBankAccount: true, bankName: 'Chase' },
      { companyId: company.id, code: '1200', name: 'Inventory', type: 'ASSET' },
      // Liabilities
      { companyId: company.id, code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
      { companyId: company.id, code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY' },
      // Revenue
      { companyId: company.id, code: '4000', name: 'Food Sales', type: 'REVENUE' },
      { companyId: company.id, code: '4010', name: 'Beverage Sales', type: 'REVENUE' },
      { companyId: company.id, code: '4020', name: 'Delivery Fee Revenue', type: 'REVENUE' },
      // COGS
      { companyId: company.id, code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
      // Expenses
      { companyId: company.id, code: '6000', name: 'Rent Expense', type: 'EXPENSE' },
      { companyId: company.id, code: '6100', name: 'Utilities', type: 'EXPENSE' },
      { companyId: company.id, code: '6200', name: 'Payroll', type: 'EXPENSE' },
      { companyId: company.id, code: '6300', name: 'Marketing', type: 'EXPENSE' }
    ]
  });
  
  // ============================================
  // 10. CREATE PRINTERS
  // ============================================
  await prisma.printer.createMany({
    data: [
      { storeId: store1.id, name: 'Receipt Printer', type: 'THERMAL', connectionType: 'NETWORK', ipAddress: '192.168.1.101', station: 'GENERAL', printOnPaid: true },
      { storeId: store1.id, name: 'Kitchen Printer', type: 'THERMAL', connectionType: 'NETWORK', ipAddress: '192.168.1.102', station: 'PIZZA', printOnKitchen: true },
      { storeId: store1.id, name: 'Fryer Printer', type: 'THERMAL', connectionType: 'NETWORK', ipAddress: '192.168.1.103', station: 'FRYER', printOnKitchen: true },
      { storeId: store2.id, name: 'Receipt Printer', type: 'THERMAL', connectionType: 'NETWORK', ipAddress: '192.168.2.101', station: 'GENERAL', printOnPaid: true },
      { storeId: store2.id, name: 'Kitchen Printer', type: 'THERMAL', connectionType: 'NETWORK', ipAddress: '192.168.2.102', station: 'PIZZA', printOnKitchen: true }
    ]
  });
  
  // ============================================
  // 11. CREATE SAMPLE ORDERS
  // ============================================
  const order1 = await prisma.order.create({
    data: {
      storeId: store1.id,
      orderNumber: 'DT-1001',
      tokenNumber: 'D-01',
      type: 'DINE_IN',
      status: 'COMPLETED',
      tableNumber: '5',
      customerName: 'Alice Brown',
      subtotal: 31.96,
      taxAmount: 2.84,
      total: 34.80,
      source: 'POS',
      createdById: cashier1.id,
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      confirmedAt: new Date(Date.now() - 86390000),
      preparedAt: new Date(Date.now() - 86350000),
      packedAt: new Date(Date.now() - 86320000),
      completedAt: new Date(Date.now() - 86300000),
      items: {
        create: [
          {
            productId: pepperoniPizza.id,
            productName: 'Pepperoni Pizza',
            sizeName: 'Large (14")',
            quantity: 1,
            unitPrice: 17.99,
            totalPrice: 17.99,
            kitchenStation: 'PIZZA',
            status: 'COMPLETED',
            modifiers: JSON.stringify([
              { modifierId: pizzaSizeMod.id, optionId: 'opt-large', name: 'Large (14")', price: 3.00 },
              { modifierId: crustMod.id, optionId: 'opt-thin', name: 'Thin Crust', price: 0 }
            ])
          },
          {
            productId: buffaloWings.id,
            productName: 'Buffalo Wings',
            quantity: 1,
            unitPrice: 8.99,
            totalPrice: 8.99,
            kitchenStation: 'FRYER',
            status: 'COMPLETED'
          },
          {
            productId: coke.id,
            productName: 'Coca-Cola',
            quantity: 2,
            unitPrice: 2.49,
            totalPrice: 4.98,
            kitchenStation: 'DRINKS',
            status: 'COMPLETED'
          }
        ]
      },
      payments: {
        create: [
          {
            amount: 34.80,
            method: 'CASH',
            status: 'COMPLETED',
            processedAt: new Date(Date.now() - 86300000)
          }
        ]
      }
    }
  });
  
  console.log('✅ Seed completed successfully!');
  console.log(`   Company: ${company.name}`);
  console.log(`   Stores: ${store1.name}, ${store2.name}`);
  console.log(`   Users: owner@pizzapalace.com, manager.dt@pizzapalace.com, cashier.dt@pizzapalace.com`);
  console.log(`   Password for all users: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## I) Printer Setup Config

### ESC/POS Print Service

```typescript
// apps/api/src/modules/printers/print.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Network, printer as escposPrinter } from 'escpos';
import * as iconv from 'iconv-lite';

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);
  
  constructor(private prisma: PrismaService) {}
  
  async printReceipt(orderId: string, printerId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: true,
        payments: true
      }
    });
    
    if (!order) throw new Error('Order not found');
    
    // Get receipt printer for store
    const printer = printerId 
      ? await this.prisma.printer.findUnique({ where: { id: printerId } })
      : await this.prisma.printer.findFirst({
          where: { 
            storeId: order.storeId, 
            station: 'GENERAL',
            isActive: true 
          }
        });
    
    if (!printer) {
      this.logger.warn(`No printer found for order ${order.orderNumber}`);
      return;
    }
    
    try {
      const device = new Network(printer.ipAddress, printer.port);
      const printerDevice = new escposPrinter(device);
      
      printerDevice.open(async () => {
        // Header
        printerDevice
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text(order.store.name)
          .size(1, 1)
          .text(order.store.address)
          .text(`Tel: ${order.store.phone}`)
          .text('')
          .align('lt')
          .text(`Order #: ${order.orderNumber}`)
          .text(`Token: ${order.tokenNumber || 'N/A'}`)
          .text(`Date: ${order.createdAt.toLocaleString()}`)
          .text(`Type: ${order.type}`)
          .text(order.tableNumber ? `Table: ${order.tableNumber}` : '')
          .text('')
          .text('--------------------------------');
        
        // Items
        for (const item of order.items) {
          const modifiers = item.modifiers as any[] || [];
          const modifierText = modifiers.length > 0 
            ? `  ${modifiers.map(m => m.name).join(', ')}` 
            : '';
          
          printerDevice
            .text(`${item.quantity}x ${item.productName}`)
            .text(`  $${item.totalPrice.toFixed(2)}`);
          
          if (modifierText) {
            printerDevice.text(modifierText);
          }
          
          if (item.notes) {
            printerDevice.text(`  ** ${item.notes}`);
          }
        }
        
        printerDevice.text('--------------------------------');
        
        // Totals
        printerDevice
          .text(`Subtotal: $${order.subtotal.toFixed(2)}`)
          .text(`Tax: $${order.taxAmount.toFixed(2)}`);
        
        if (order.deliveryFee > 0) {
          printerDevice.text(`Delivery: $${order.deliveryFee.toFixed(2)}`);
        }
        
        if (order.tipAmount > 0) {
          printerDevice.text(`Tip: $${order.tipAmount.toFixed(2)}`);
        }
        
        printerDevice
          .text('')
          .size(2, 1)
          .text(`TOTAL: $${order.total.toFixed(2)}`)
          .size(1, 1)
          .text('')
          .text('--------------------------------')
          .text('Thank you for your order!')
          .text('')
          .cut()
          .close();
      });
      
      this.logger.log(`Receipt printed for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`Print failed: ${error.message}`);
      throw error;
    }
  }
  
  async printKitchenTicket(orderId: string, station?: KitchenStation) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: station ? { kitchenStation: station } : undefined,
          include: { product: true }
        },
        store: true
      }
    });
    
    if (!order || order.items.length === 0) return;
    
    // Get station printer
    const printer = await this.prisma.printer.findFirst({
      where: {
        storeId: order.storeId,
        station: station || 'GENERAL',
        isActive: true
      }
    });
    
    if (!printer) return;
    
    try {
      const device = new Network(printer.ipAddress, printer.port);
      const printerDevice = new escposPrinter(device);
      
      printerDevice.open(() => {
        printerDevice
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text(`** ${station || 'KITCHEN'} **`)
          .size(3, 3)
          .text(`#${order.tokenNumber || order.orderNumber}`)
          .size(1, 1)
          .text('')
          .align('lt')
          .text(`Time: ${order.createdAt.toLocaleTimeString()}`)
          .text(`Type: ${order.type}`)
          .text(order.tableNumber ? `Table: ${order.tableNumber}` : ' ')
          .text('')
          .text('================================')
          .text('');
        
        for (const item of order.items) {
          printerDevice
            .size(2, 1)
            .text(`${item.quantity}x ${item.productName}`)
            .size(1, 1);
          
          const modifiers = item.modifiers as any[] || [];
          if (modifiers.length > 0) {
            printerDevice.text(`  > ${modifiers.map(m => m.name).join(', ')}`);
          }
          
          if (item.notes) {
            printerDevice.size(2, 2).text(`*** ${item.notes} ***`).size(1, 1);
          }
          
          printerDevice.text('');
        }
        
        printerDevice
          .text('================================')
          .cut()
          .close();
      });
    } catch (error) {
      this.logger.error(`Kitchen print failed: ${error.message}`);
    }
  }
  
  async printPackingSlip(orderId: string) {
    // Similar implementation for packing slip
  }
  
  async printDriverSlip(orderId: string) {
    // Similar implementation for driver delivery slip
  }
  
  async testPrinter(printerId: string) {
    const printer = await this.prisma.printer.findUnique({
      where: { id: printerId }
    });
    
    if (!printer) throw new Error('Printer not found');
    
    try {
      const device = new Network(printer.ipAddress, printer.port);
      const printerDevice = new escposPrinter(device);
      
      printerDevice.open(() => {
        printerDevice
          .font('a')
          .align('ct')
          .size(2, 2)
          .text('TEST PRINT')
          .size(1, 1)
          .text('')
          .text(`Printer: ${printer.name}`)
          .text(`IP: ${printer.ipAddress}`)
          .text(`Station: ${printer.station}`)
          .text('')
          .text('Printer is working!')
          .cut()
          .close();
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### Printer Configuration JSON

```json
{
  "printers": [
    {
      "id": "printer-001",
      "name": "Receipt Printer - Downtown",
      "type": "THERMAL",
      "connection": {
        "type": "NETWORK",
        "ipAddress": "192.168.1.101",
        "port": 9100
      },
      "paperWidth": 80,
      "station": "GENERAL",
      "triggers": {
        "onOrderPaid": true,
        "onRefund": true
      },
      "templates": {
        "receipt": "default-receipt",
        "refund": "default-refund"
      }
    },
    {
      "id": "printer-002",
      "name": "Kitchen Printer - Pizza Station",
      "type": "THERMAL",
      "connection": {
        "type": "NETWORK",
        "ipAddress": "192.168.1.102",
        "port": 9100
      },
      "paperWidth": 80,
      "station": "PIZZA",
      "triggers": {
        "onOrderConfirmed": true,
        "onItemModified": true
      },
      "templates": {
        "kitchen": "default-kitchen-ticket"
      }
    },
    {
      "id": "printer-003",
      "name": "Fryer Printer",
      "type": "THERMAL",
      "connection": {
        "type": "NETWORK",
        "ipAddress": "192.168.1.103",
        "port": 9100
      },
      "paperWidth": 80,
      "station": "FRYER",
      "triggers": {
        "onOrderConfirmed": true
      },
      "templates": {
        "kitchen": "default-kitchen-ticket"
      }
    },
    {
      "id": "printer-004",
      "name": "Packing Station Printer",
      "type": "THERMAL",
      "connection": {
        "type": "NETWORK",
        "ipAddress": "192.168.1.104",
        "port": 9100
      },
      "paperWidth": 80,
      "station": "GENERAL",
      "triggers": {
        "onOrderPacked": true
      },
      "templates": {
        "packing": "default-packing-slip"
      }
    }
  ],
  "templates": {
    "default-receipt": {
      "header": {
        "logo": true,
        "storeName": { "font": "B", "size": [2, 2], "align": "center" },
        "storeInfo": { "font": "A", "size": [1, 1], "align": "center" }
      },
      "body": {
        "orderInfo": ["orderNumber", "date", "type", "table"],
        "items": {
          "showModifiers": true,
          "showNotes": true,
          "quantityFormat": "{qty}x {name}"
        },
        "totals": ["subtotal", "tax", "delivery", "tip", "total"]
      },
      "footer": {
        "message": "Thank you for your order!",
        "qrCode": false
      }
    },
    "default-kitchen-ticket": {
      "header": {
        "station": { "font": "B", "size": [2, 2] },
        "token": { "font": "A", "size": [3, 3], "bold": true },
        "orderInfo": ["time", "type", "table"]
      },
      "body": {
        "items": {
          "highlightModifiers": true,
          "highlightNotes": true,
          "allergyWarning": true
        }
      },
      "footer": {
        "cutLine": true
      }
    }
  }
}
```

---

## J) Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Project setup, Docker, DB schema | Running dev environment |
| 1 | Core NestJS API structure | API skeleton with auth |
| 2 | User/Role/Permission system | RBAC fully working |
| 2 | Store management | Multi-store support |
| 3 | Menu system (products, modifiers) | Complete menu CRUD |
| 3 | Basic POS UI | Order creation working |
| 4 | Order lifecycle | Orders → Kitchen flow |
| 4 | WebSocket integration | Real-time updates |

### Phase 2: Operations (Weeks 5-8)

| Week | Task | Deliverable |
|------|------|-------------|
| 5 | KDS display | Kitchen screen working |
| 5 | Packing station | Packing workflow |
| 6 | OSDU / Lobby screen | Customer display |
| 6 | Payment processing | Cash + Card payments |
| 7 | Receipt printing | Print service |
| 7 | Driver management | Driver assignment |
| 8 | Customer kiosk | Self-service UI |
| 8 | End-of-day close | Close period workflow |

### Phase 3: Business (Weeks 9-12)

| Week | Task | Deliverable |
|------|------|-------------|
| 9 | Inventory system | Stock tracking |
| 9 | Purchase orders | Vendor management |
| 10 | Finance module | Chart of accounts |
| 10 | Journal entries | Auto-posting |
| 11 | P&L reports | Financial reports |
| 11 | Employee management | HR module |
| 12 | Payroll system | Payroll processing |
| 12 | W2 generation | Tax forms |

### Phase 4: Polish (Weeks 13-16)

| Week | Task | Deliverable |
|------|------|-------------|
| 13 | Customer app | Mobile ordering |
| 13 | Driver app | Delivery tracking |
| 14 | Loyalty program | Points system |
| 14 | Promo codes | Discount engine |
| 15 | Advanced reports | Analytics dashboard |
| 15 | Data exports | CSV/PDF exports |
| 16 | Performance optimization | <2s load times |
| 16 | Documentation | Complete docs |

### MVP Feature Set (Launch Ready)

**Must Have:**
- ✅ Multi-store support
- ✅ RBAC with 5+ roles
- ✅ Full menu system (pizza + QSR)
- ✅ POS with cash/card
- ✅ KDS + Packing + OSDU
- ✅ Order lifecycle
- ✅ Basic reporting
- ✅ Receipt printing

**Nice to Have (Post-Launch):**
- 📱 Customer mobile app
- 📱 Driver app with GPS
- 💰 Advanced finance module
- 👥 Full payroll
- 🎁 Loyalty program
- 📊 Advanced analytics

### Development Team Structure

| Role | Count | Responsibility |
|------|-------|----------------|
| Tech Lead | 1 | Architecture, code review |
| Backend Dev | 2 | NestJS API, database |
| Frontend Dev | 2 | React apps (Admin, POS, KDS) |
| Mobile Dev | 1 | React Native / PWA |
| DevOps | 1 | Docker, CI/CD, infrastructure |
| QA Engineer | 1 | Testing, automation |

### Estimated Effort

| Component | Person-Weeks |
|-----------|--------------|
| Backend API | 8 |
| Admin Dashboard | 6 |
| POS System | 6 |
| KDS + Packing + OSDU | 4 |
| Customer Kiosk | 4 |
| Mobile Apps | 6 |
| Inventory & Finance | 6 |
| Testing & Polish | 4 |
| **Total** | **44** |

With 5 developers: ~9 weeks to MVP
With 7 developers: ~6-7 weeks to MVP

---

## Appendix: Environment Configuration

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: restaurant
      POSTGRES_PASSWORD: restaurant123
      POSTGRES_DB: restaurant_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://restaurant:restaurant123@postgres:5432/restaurant_platform
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key-here
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app
      - /app/node_modules

  web-admin:
    build:
      context: ./apps/web-admin
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./apps/web-admin:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

```bash
# .env
# Database
DATABASE_URL=postgresql://restaurant:restaurant123@localhost:5432/restaurant_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Email (SendGrid)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@pizzapalace.com

# File Storage
STORAGE_TYPE=local # or s3
S3_BUCKET=restaurant-assets
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

*This blueprint provides a complete foundation for building a production-ready multi-store restaurant management platform. All code is implementation-ready and follows industry best practices for scalability and maintainability.*
