# 🍕 Multi-Store Pizza & QSR Management Platform - Blueprint

## Overview

This is a **production-ready blueprint** for a comprehensive multi-store restaurant management platform supporting pizza stores and general quick-service restaurants (QSR).

## 📁 Deliverables

### 1. Main Blueprint Document (`BLUEPRINT.md`)
Complete 600+ line blueprint containing:
- System architecture diagrams
- Monorepo folder structure
- Complete Prisma schema (50+ models)
- REST API routes documentation
- WebSocket event specifications
- POS workflow design
- Kitchen → Packing → Delivery workflow
- P&L formulas and SQL queries
- Seed data for 2 stores
- Printer configuration
- Implementation roadmap

### 2. Code Scaffold (`/scaffold/`)
Production-ready code files:
- `prisma/schema.prisma` - Complete database schema
- `docker/docker-compose.yml` - Full development stack
- `api/src/` - NestJS API foundation
  - `main.ts` - Application entry point
  - `app.module.ts` - Root module
  - `modules/auth/` - Authentication system
  - `modules/websocket/` - Real-time gateway
- `web-admin/src/` - React POS components
  - `PosPage.tsx` - Main POS interface
  - `CategoryNav.tsx` - Category navigation
  - `ProductGrid.tsx` - Product display grid
  - `OrderCart.tsx` - Shopping cart

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Admin/POS  │  Kiosk  │  KDS  │  Packing  │  OSDU  │ Apps  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (NestJS)                    │
│  Auth │ Orders │ Menu │ Kitchen │ Inventory │ Finance │ HR   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                            │
│  PostgreSQL  │  Redis  │  MinIO  │  Printer Service         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone & Setup
```bash
# Create project directory
mkdir restaurant-platform && cd restaurant-platform

# Copy scaffold files
cp -r /path/to/blueprint/scaffold/* .

# Install dependencies
cd api && npm install
cd ../web-admin && npm install
```

### 2. Start Infrastructure
```bash
cd docker
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000/9001

### 3. Setup Database
```bash
cd api
npx prisma migrate dev
npx prisma db seed
```

### 4. Start Services
```bash
# Terminal 1 - API
cd api && npm run start:dev

# Terminal 2 - Admin
cd web-admin && npm run dev
```

### 5. Access Applications
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Admin/POS: http://localhost:3001
- Kitchen Display (KDS): http://localhost:3011

### Optional environment variables

- **`web-admin`:** `VITE_GOOGLE_MAPS_API_KEY` — enables delivery zone polygons and dispatch map features (omit for dev without Maps).

### CI

On **`main`**, GitHub Actions runs `.github/workflows/ci.yml`: typecheck matrix for all `scaffold/` web apps, `web-admin` unit tests, API build + unit tests, and an API lifecycle e2e job with Postgres and Redis.

### Testing walkthrough

For full manual and automated testing steps (including Stripe sandbox and webhook forwarding), see **[scaffold/TESTING.md](scaffold/TESTING.md)**.

For **deployment and hosting** (PostgreSQL, Redis, MinIO/S3, TLS, CORS, Socket.IO origins, Stripe webhooks, build-time env for Vite apps), see **[scaffold/HOSTING.md](scaffold/HOSTING.md)**.

## 📊 Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| owner@pizzapalace.com | password123 | Owner |
| manager.dt@pizzapalace.com | password123 | Store Manager |
| cashier.dt@pizzapalace.com | password123 | Cashier |

## 🗄️ Database Schema Highlights

### Core Entities
- **Company** → **Store** → Users, Products, Orders
- **User** → **Role** → **Permission** (RBAC)
- **Product** → **Category** → Modifiers, Sizes, Recipes
- **Order** → OrderItems → Payments, Refunds

### Business Logic
- **Inventory** → Stock movements, Purchase orders
- **Finance** → Ledger accounts, Journal entries, Expenses
- **Employees** → Time tracking, Payroll, W2

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get profile

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/:id/payments` - Process payment

### Menu
- `GET /api/v1/menu/categories` - List categories
- `GET /api/v1/menu/products` - List products
- `POST /api/v1/menu/products` - Create product

## 📡 WebSocket Events

### Client → Server
- `store:subscribe` - Subscribe to store updates
- `order:created` - Broadcast new order
- `order:status-update` - Update order status

### Server → Client
- `order:created` - New order notification
- `order:status-changed` - Status update
- `kitchen:new-order` - Kitchen ticket

## 🖨️ Printer Configuration

Printers are configured per store with:
- IP address and port
- Kitchen station mapping
- Print triggers (on order, on paid, on kitchen)

Example printer config:
```json
{
  "name": "Kitchen Printer - Pizza",
  "ipAddress": "192.168.1.102",
  "station": "PIZZA",
  "printOnKitchen": true
}
```

## 📈 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- Project setup, Docker, DB schema
- User/Role/Permission system
- Store management
- Menu system
- Basic POS

### Phase 2: Operations (Weeks 5-8)
- KDS display
- Packing station
- OSDU / Lobby screen
- Payment processing
- Receipt printing

### Phase 3: Business (Weeks 9-12)
- Inventory system
- Finance module
- P&L reports
- Employee management
- Payroll system

### Phase 4: Polish (Weeks 13-16)
- Customer mobile app
- Driver app
- Loyalty program
- Advanced analytics

## 🛠️ Tech Stack

### Backend
- **NestJS** - API framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Cache & pub/sub
- **Socket.io** - WebSockets

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **shadcn/ui** - Component library

### Infrastructure
- **Docker** - Containerization
- **MinIO** - Object storage
- **Bull Queue** - Background jobs

## 📋 Key Features

### Multi-Store Support
- Company → Multiple stores
- Store-specific pricing
- Delivery zones per store
- User-store access control

### Menu System
- Categories with time-based availability
- Products with sizes and modifiers
- Half-and-half pizza logic
- Combos and meal deals

### Order Lifecycle
- Dine-in / Pickup / Delivery
- Real-time status updates
- Kitchen routing by station
- Driver assignment & tracking

### Financial Management
- Chart of accounts
- Auto journal entries
- P&L reporting
- Expense tracking

## 📄 License

This blueprint is provided as-is for educational and commercial use.

## 🤝 Support

For questions or issues, refer to the comprehensive documentation in `BLUEPRINT.md`.
