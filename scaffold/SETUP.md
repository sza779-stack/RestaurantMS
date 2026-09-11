# Restaurant Platform - Setup & Testing Guide

## Prerequisites

- Node.js 20+ 
- Docker & Docker Compose
- npm or yarn

## Quick Start

### 1. Start Infrastructure Services

```bash
cd docker
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000/9001

### 2. Setup API

```bash
cd api

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed
```

### 3. Start API Server

```bash
# Development mode with hot reload
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

API will be available at http://localhost:3000
API Docs at http://localhost:3000/api/docs

### 4. Setup Web Admin (POS)

```bash
cd web-admin

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

Web Admin will be available at http://localhost:3001

## Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| owner@pizzapalace.com | password123 | Owner |
| manager.dt@pizzapalace.com | password123 | Store Manager |
| cashier.dt@pizzapalace.com | password123 | Cashier |

## Testing

### API Tests

```bash
cd api

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Web Admin Tests

```bash
cd web-admin

# Run tests
npm test
```

## Project Structure

```
scaffold/
├── api/                    # NestJS API
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── users/     # User management
│   │   │   ├── stores/    # Store management
│   │   │   ├── menu/      # Menu (categories, products)
│   │   │   ├── orders/    # Orders & payments
│   │   │   ├── kitchen/   # Kitchen tickets
│   │   │   ├── inventory/ # Inventory management
│   │   │   ├── finance/   # Finance & accounting
│   │   │   ├── employees/ # Employee management
│   │   │   ├── reports/   # Reports & analytics
│   │   │   ├── printers/  # Printer configuration
│   │   │   └── websocket/ # WebSocket gateway
│   │   ├── prisma/        # Prisma service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── package.json
├── web-admin/             # React Admin & POS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── pos/       # POS page
│   │   │   └── auth/      # Login page
│   │   ├── components/    # Shared components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── web-kds/               # Kitchen Display System
├── web-packing/           # Packing Station
├── web-osdu/              # Order Status Display
└── docker/
    └── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user

### Stores
- `GET /api/v1/stores` - List stores
- `GET /api/v1/stores/:id` - Get store
- `POST /api/v1/stores` - Create store
- `PUT /api/v1/stores/:id` - Update store

### Menu
- `GET /api/v1/menu/categories` - List categories
- `GET /api/v1/menu/products` - List products
- `POST /api/v1/menu/categories` - Create category
- `POST /api/v1/menu/products` - Create product

### Orders
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order
- `POST /api/v1/orders` - Create order
- `PUT /api/v1/orders/:id/status` - Update order status

### Kitchen
- `GET /api/v1/kitchen/tickets` - List kitchen tickets
- `POST /api/v1/kitchen/tickets` - Create ticket
- `PUT /api/v1/kitchen/tickets/:id/status` - Update ticket status

### Inventory
- `GET /api/v1/inventory/items` - List inventory items
- `GET /api/v1/inventory/stock` - Get stock levels
- `POST /api/v1/inventory/movements` - Create stock movement

### Finance
- `GET /api/v1/finance/accounts` - List ledger accounts
- `GET /api/v1/finance/journal-entries` - List journal entries
- `POST /api/v1/finance/journal-entries` - Create journal entry

### Employees
- `GET /api/v1/employees` - List employees
- `GET /api/v1/employees/:id` - Get employee
- `POST /api/v1/employees` - Create employee
- `POST /api/v1/employees/clock-in` - Clock in
- `PUT /api/v1/employees/clock-out/:id` - Clock out

### Reports
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/pl` - P&L report

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://restaurant:restaurant123@localhost:5432/restaurant_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=restaurant-assets
```

### Web Admin (.env)
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Troubleshooting

### Database Connection Issues
1. Ensure Docker is running: `docker ps`
2. Check PostgreSQL container: `docker logs restaurant-postgres`
3. Verify DATABASE_URL in .env matches Docker settings

### Build Errors
1. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
2. Regenerate Prisma client: `npx prisma generate`
3. Clear TypeScript cache: `npx tsc --build --force`

### Port Already in Use
- API: Change PORT in .env
- Web Admin: Change port in vite.config.ts

## Next Steps

1. Implement additional frontend services (KDS, Packing, OSDU)
2. Add comprehensive test coverage
3. Configure CI/CD pipeline
4. Deploy to staging/production
