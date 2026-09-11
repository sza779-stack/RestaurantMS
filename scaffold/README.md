# 🍕 Restaurant Platform - Complete System


## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
�  Admin/POS  � Online  �  KDS  � Packing � OSDU � Driver �
│   :3001     │  :3011  │   :3003   │  :3004  │   :3005  │     TBD      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (NestJS)                         │
│   Auth │ Orders │ Menu │ Kitchen │ Inventory │ Finance │ WebSocket     │
│                              Port: 3000                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE                               │
│   PostgreSQL :5432   Redis :6379   MinIO :9000/:9001                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📱 Applications

| Application | Port | Description |
|------------|------|-------------|
| **API** | 3000 | NestJS backend with all business logic |
| **Admin/POS** | 3001 | Point of Sale + Admin dashboard |
| **KDS** | 3003 | Kitchen Display System for kitchen staff |
| **Packing** | 3004 | Packing station for order fulfillment |
| **OSDU** | 3005 | Order Status Display for customer lobby |
| **Web-online** | 3005* | Customer-facing online ordering SPA (often run standalone; optional port change) |


## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### 1. Start All Services

```bash
cd docker
docker-compose up -d
```

This starts all services:
- PostgreSQL, Redis, MinIO (infrastructure)
- API server
- All **6** in-repo client shells (Admin, Online, KDS, Packing, OSDU, Driver)

### 2. Setup Database

```bash
cd api
npx prisma migrate dev
npx prisma db seed
```

### 3. Access Applications

| Application | URL | Purpose |
|------------|-----|---------|
| API Docs | http://localhost:3000/api/docs | API documentation (Swagger) |
| Admin/POS | http://localhost:3001 | Staff POS system |
| KDS | http://localhost:3003 | Kitchen display |
| Packing | http://localhost:3004 | Packing station |
| OSDU | http://localhost:3005 | Customer order status screen |
| Driver | http://localhost:3006 | Driver delivery UI |
| MinIO Console | http://localhost:9001 | Object storage admin |

**Customer web ordering (`web-online`)** is not part of default `docker-compose.yml`; run it from `web-online/` (see **[HOSTING.md](./HOSTING.md)** for ports and prod builds).

### 4. Login Credentials

| Email | Password | Role |
|-------|----------|------|
| owner@pizzapalace.com | password123 | Owner |
| manager.dt@pizzapalace.com | password123 | Store Manager |
| cashier.dt@pizzapalace.com | password123 | Cashier |

### 5. Testing (manual + automated)

Step-by-step procedures: database setup, API smoke tests, Admin/POS, **Stripe sandbox**, web apps, and CI-style commands — see **[TESTING.md](./TESTING.md)**. Payment provider keys: **[PAYMENT_SETUP.md](./PAYMENT_SETUP.md)**.

### Production hosting

What to provision (PostgreSQL, Redis, HTTPS, Docker vs static SPAs, CORS / WebSockets, payments webhooks): **[HOSTING.md](./HOSTING.md)**.

## 🍕 Features

### Admin/POS (Port 3001)
- ✅ Full POS interface
- ✅ Menu browsing with categories
- ✅ **Build Your Own Pizza** - Custom pizza builder
- ✅ Order cart with modifiers
- ✅ Multiple payment methods (Cash, Card)
- ✅ Order history
- ✅ Multi-store support

### KDS - Kitchen Display System (Port 3011)
- 🔔 Real-time order notifications
- 📊 Kanban board (Pending → Cooking → Ready)
- ⏱️ Elapsed time tracking
- 🏷️ Station filtering (Pizza, Fryer, etc.)
- 🔊 Sound alerts
- ⚠️ Urgency indicators

### Packing Station (Port 3003)
- 📦 Orders ready for packing
- ✅ Packing checklist
- 🏷️ Label printing
- 📱 Order details view
- ✅ Mark as packed

### OSDU - Order Status Display (Port 3004)
- 📺 Customer-facing display
- 🔄 Real-time status updates
- 🎨 Color-coded statuses
- 🔔 Ready order alerts
- 🎵 Sound notifications

- 🖥️ Touch-friendly interface
- 📋 Simplified menu
- 🛒 Shopping cart
- 💳 Payment options
- 🎫 Order number generation

## 🔧 Development

### Individual Services

Start services individually for development:

```bash
# Terminal 1 - API
cd api
npm install
npm run start:dev

# Terminal 2 - Admin/POS
cd web-admin
npm install
npm run dev

# Terminal 3 - KDS
cd web-kds
npm install
npm run dev

# Terminal 4 - Packing
cd web-packing
npm install
npm run dev

# Terminal 5 - OSDU
cd web-osdu
npm install
npm run dev

```

### Database Management

```bash
cd api

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

## 🧪 Testing

### API Tests
```bash
cd api
npm test
```

### Web Admin Tests
```bash
cd web-admin
npm test
```

## 📁 Project Structure

```
scaffold/
├── api/                    # NestJS API
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── prisma/        # Database service
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Test data
│   └── package.json
├── web-admin/             # Admin & POS (React)
│   ├── src/
│   │   ├── pages/pos/
│   │   │   ├── components/
│   │   │   │   ├── BuildYourOwnPizza.tsx
│   │   │   │   ├── OrderCart.tsx
│   │   │   │   └── ...
│   │   │   └── PosPage.tsx
│   │   └── App.tsx
│   └── package.json
├── web-kds/               # Kitchen Display System
├── web-packing/           # Packing Station
├── web-osdu/              # Order Status Display
├── web-online/           # Customer online ordering SPA
├── web-driver/           # Driver app
├── docker/
│   └── docker-compose.yml
└── README.md
```

## 🔄 Order Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Online/  │───▶│   POS    │───▶│   KDS    │───▶│ Packing  │───▶│   OSDU   │
│   POS    │    │  (Order) │    │ (Kitchen)│    │ (Pack)   │    │ (Ready)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                      │                                │
                                      ▼                                ▼
                              ┌──────────────┐              ┌──────────────┐
                              │  Order Saved │              │ Customer Sees│
                              │  to Database │              │  Order Ready │
                              └──────────────┘              └──────────────┘
```

## 🔌 WebSocket Events

### Client → Server
- `store:subscribe` - Subscribe to store updates
- `order:created` - New order notification
- `order:status-update` - Update order status

### Server → Client
- `order:created` - New order broadcast
- `order:status-changed` - Status update broadcast
- `order:ready` - Order ready notification (OSDU)

## 🛠️ Tech Stack

### Backend
- **NestJS** - API framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Redis** - Cache & pub/sub
- **Socket.io** - WebSockets
- **MinIO** - Object storage

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **Socket.io-client** - Real-time updates

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Support

For questions or issues, refer to the documentation or check the API docs at http://localhost:3000/api/docs
