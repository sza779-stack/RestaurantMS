# Prompt Guide: Recreating the Restaurant Management System

This document contains a modular, step-by-step series of prompts designed to be fed to an AI coding assistant (Claude, GPT, Gemini, etc.) to recreate this exact **Multi-Store Pizza & QSR Management Platform** from scratch.

The codebase under `/scaffold/` is the canonical reference implementation. These prompts are calibrated against it, so the resulting system should be functionally identical — same NestJS modules, same Prisma schema, same WebSocket rooms/events, same React apps, same workflows.

**Current scaffold highlights (keep prompts aligned):** GitHub Actions CI gates TypeScript on every web workspace plus API build/unit/e2e lifecycle tests; **web-kds** dev listens on **3011** (Compose maps host `3011` → container `3000`); **web-online** build-your-own pizza defaults to an **SVG** procedural preview with an optional **PNG layer** restore path; subs/pasta use **SVG** previews; **web-admin** maps screens load the Google Maps JS API lazily and guard usage until the loader resolves (`VITE_GOOGLE_MAPS_API_KEY`).

> **How to use this guide**
>
> 1. Start a new chat with the AI assistant.
> 2. Paste the **Global System Prompt** first and wait for acknowledgement.
> 3. Then paste **Phase 1**, let the AI complete it, verify the output, and only then move to **Phase 2**.
> 4. Each phase builds on the previous one. Do not skip phases.
> 5. After every phase, run the verification checklist included with the phase before continuing.

---

## Global System Prompt (Provide this first)

> **Role & Context**
> You are an expert Full-Stack Engineer and System Architect. We are building a production-ready **Multi-Store Pizza & Quick-Service Restaurant (QSR) Management Platform**. The system must support a single Company managing multiple Stores, complex pizza/QSR menus (half-and-half pizzas, dynamic toppings, combos, build-your-own items), real-time order synchronization across 7 client applications, full inventory + finance + HR workflows, and a driver dispatch system with live GPS tracking.
>
> **Mandatory Tech Stack:**
> * **Backend:** NestJS 10 (TypeScript), Prisma 5 ORM, PostgreSQL 15, Redis 7 (cache + pub/sub), Socket.io 4 via NestJS WebSocket Gateway, JWT (passport-jwt), bcrypt, class-validator, Swagger/OpenAPI, MinIO/S3 for object storage.
> * **Frontend:** React 18 + Vite + TypeScript, Tailwind CSS, Zustand (state), TanStack Query (data fetching), axios, react-router-dom, socket.io-client, lucide-react (icons), sonner (toasts), recharts (charts), react-toastify (customer-facing apps).
> * **Infrastructure:** Docker Compose, NGINX (production reverse proxy), single-tenant deployable.
>
> **Repository Layout (all apps live under `scaffold/`):**
> ```
> scaffold/
> ├── api/           # NestJS backend (port 3000)
> ├── web-admin/     # POS + management dashboard (port 3001)
> ├── web-kds/       # Kitchen Display System (port 3011)
> ├── web-packing/   # Packing/Dispatch screen (port 3003)
> ├── web-osdu/      # Order Status Display Unit / lobby TV (port 3004)
> ├── web-kiosk/     # Self-service in-store kiosk (port 3005)
> ├── web-online/    # Customer online ordering site (port 3006)
> ├── web-driver/    # Driver mobile-friendly PWA (port 3008)
> ├── prisma/        # (legacy mirror folder, source of truth is api/prisma)
> └── docker/        # docker-compose.yml + Dockerfiles
> ```
>
> **Non-Negotiable Architecture Rules:**
> 1. **HTTP for writes, WebSockets for reactive reads.** All state mutations (create order, update status, record payment) go through REST endpoints. After persisting, the API broadcasts the change via the WebSocket gateway. Clients never write through sockets.
> 2. **Tenant scoping.** Every query that touches `Order`, `Product`, `InventoryItem`, `Driver`, etc. must scope by `storeId`.
> 3. **All apps share one API.** No per-app backends. The single NestJS app exposes everything under `/api/v1/...`.
> 4. **Service-client tokens.** Headless screens (KDS, OSDU, Packing, Kiosk, Online, Driver) connect to the WebSocket using simple bearer tokens (`kds-token`, `osdu-token`, etc.) when no human user is logged in.
>
> Acknowledge this context, then await **Phase 1**.

---

## Phase 1: Repository, Docker Infrastructure & Tooling

> **Prompt: Phase 1 — Bootstrap the Workspace**
>
> Set up the project skeleton.
>
> 1. Create the directory tree shown above under `scaffold/`. Each web app gets its own folder with its own `package.json` (no monorepo workspace tool required — they are standalone but share conventions).
> 2. Create `scaffold/docker/docker-compose.yml` with these services:
>    - `postgres` — image `postgres:15-alpine`, db `restaurant_platform`, user `restaurant`, password `restaurant123`, port `5432`, with a healthcheck on `pg_isready`.
>    - `redis` — image `redis:7-alpine`, port `6379`, append-only mode, healthcheck on `redis-cli ping`.
>    - `minio` — image `minio/minio:latest`, ports `9000` + `9001`, root user `minioadmin`, password `minioadmin123`.
>    - `api` — built from `../api` Dockerfile, depends on postgres+redis (healthy) + minio. Env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=24h`, `PORT=3000`, plus the four `MINIO_*` variables.
>    - One service per web app: `web-admin` (3001), `web-kds` published as **host 3011 → container 3000** (Vite in dev uses 3011 natively via `vite.config.ts`; Compose aligns the host URL), `web-packing` (3003), `web-osdu` (3004), `web-kiosk` (3005), `web-driver` (3008). Each maps `VITE_API_URL=http://localhost:3000` and `VITE_WS_URL=ws://localhost:3000` and runs `npm run dev -- --host`.
>    - One bridge network `restaurant-network` shared by all services.
>    - Named volumes for `postgres_data`, `redis_data`, `minio_data`.
> 3. Add cross-platform helper scripts at the scaffold root:
>    - `start-all.ps1` (Windows) and `start-all.sh` (Linux/Mac) that bring up infrastructure, run `prisma migrate deploy`, run `prisma db push`, run `prisma db seed`, then bring up all the web containers.
>    - `reset-and-seed.ps1` / `reset-and-seed.sh` that drop+recreate the DB and re-seed it.
> 4. Create `scaffold/SETUP.md` documenting prerequisites (Node 20+, Docker), default ports, default credentials (`owner@pizzapalace.com` / `password123`), and the API endpoint catalogue.
>
> **Verify:** `cd scaffold/docker && docker-compose up -d postgres redis minio` succeeds and all three become healthy.

---

## Phase 2: Prisma Schema (the Whole Domain Model)

> **Prompt: Phase 2 — Prisma Schema**
>
> Inside `scaffold/api/prisma/schema.prisma`, create the full database model. The schema must include the `prisma-client-js` generator, a `prisma-erd-generator` configured to output `../../../documentation/FULL_ERD.svg`, and a PostgreSQL datasource. Use UUIDs (`@default(uuid())`) for all primary keys, snake_case `@@map` table names, and `@db.Decimal(p, s)` for money columns.
>
> Implement these **57 models**, grouped into 8 domains:
>
> ### Core / Tenancy
> - `Company` (timezone, currency, taxId, logoUrl, …)
> - `Store` (companyId, code, address, latitude/longitude, taxRate, taxName, serviceFeeRate, deliveryFee, operatingHours JSON; `@@unique([companyId, code])`)
> - `StoreSettings` (1:1 with Store; orderNumberPrefix, nextOrderNumber, tokenNumberPrefix, prep time per station, accept payment flags, KDS settings, loyalty settings)
> - `DeliveryZone` (radius or polygon; deliveryFee, minOrderAmount, estimatedMinutes)
>
> ### Users & RBAC
> - `User` (companyId nullable, email unique, passwordHash, firstName, lastName, phone, avatarUrl, isActive, lastLoginAt, roleId)
> - `Role` (name unique, description, isSystem)
> - `Permission` (code unique, name, module)
> - `RolePermission` (composite unique on `[roleId, permissionId]`)
> - `UserStoreAccess` (userId+storeId unique; optional `overrideRoleId`; `isDefault`)
> - `AuditLog` (userId, storeId, action, entityType, entityId, oldValues/newValues JSON, indexed by entity and createdAt)
>
> ### Menu
> - `Category` (storeId, parentId self-relation `CategoryHierarchy`, sortOrder, color, icon, time-of-day availability via `availableFrom/To` + `availableDays Int[]`)
> - `Product` (categoryId, type `ProductType`, configuration JSON, basePrice/costPrice, galleryUrls `String[]`, prepTimeMinutes, kitchenStation `KitchenStation`, isFeatured)
> - `ProductStore` (productId+storeId unique; per-store price + isAvailable + window)
> - `ProductSize` (name, code, sortOrder, priceAdjustment, optional slices)
> - `AddOn` (storeId, type `AddOnType`, category `AddOnCategory`, price, sizePrices JSON, measurementUnit `MeasurementUnit`, defaultQuantity, applicableItemTypes `ProductType[]`, isDefault; unique `[storeId, name]`)
> - `AddOnSet` (storeId, pricingRule `PricingRule`, applicableItemTypes, minSelect/maxSelect; unique `[storeId, name]`)
> - `SetAddOn` (composite PK `[setId, addonId]`, displayOrder, priceOverride)
> - `ProductAddOnSet` (composite PK `[productId, addonSetId]`, displayOrder)
> - `Combo` + `ComboStore` + `ComboItem` (combo can mix fixed products and category-based picks; per-item: `allowSizeSelection`, `defaultSizeId`, `allowedSizeIds`, `maxIncludedToppings`, `freeModifierGroups`)
> - `OrderItemCombo` (snapshot of combo selections at order time)
> - `Recipe` + `RecipeIngredient` (1:1 product->recipe; ingredient -> InventoryItem with quantity + unit)
>
> ### Orders
> - `Order` (storeId, orderNumber unique, tokenNumber, type `OrderType`, status `OrderStatus`, customer fields, deliveryAddress, deliveryZoneId, driverId, tableNumber, scheduledFor, full timestamp set: `confirmedAt/preparedAt/packedAt/deliveredAt/completedAt/cancelledAt`, financial fields: subtotal, taxAmount, taxExempt + `taxExemptIdRef`, discountAmount, deliveryFee, tipAmount, total, couponCode, loyaltyPointsUsed, source `OrderSource`, createdById, customerNotes, kitchenNotes; indexes on `[storeId,status]`, `[storeId,scheduledFor]`, `createdAt`, `orderNumber`)
> - `OrderItem` (productId+productName snapshot, sizeId/sizeName, quantity, unitPrice, totalPrice, **`addons Json?`** for structured modifier data, `isHalfAndHalf` + `leftHalfProductId` + `rightHalfProductId`, itemType `ItemType`, kitchenStation, status `ItemStatus`, startedAt/completedAt, notes)
> - `Payment` (amount, method `PaymentMethod`, status `PaymentStatus`, transactionId, cardLast4, isPartial, processedAt, processedById)
> - `Refund` (amount, reason, itemsRefunded JSON)
>
> ### Drivers & Delivery
> - `Driver` (storeId, optional userId, name, phone, vehicleType, licensePlate, **hashed PIN** for mobile login, status `DriverStatus`, currentLocation JSON, isContractor, perDeliveryRate)
> - `Delivery` (orderId unique, driverId, status `DeliveryStatus`, assignedAt/pickedUpAt/deliveredAt, **`trackingEvents Json[]`**, proofPhotoUrl, signatureUrl, cashCollected)
> - `DriverEarning` (deliveryFee, tipAmount, bonusAmount, totalEarning, earnedAt)
>
> ### Inventory
> - `InventoryItem` (storeId, name, sku, barcode, unit, currentStock, minStockLevel, maxStockLevel, avgCost, lastCost, category, preferredVendorId)
> - `StockMovement` (type `MovementType`, quantity, referenceType/referenceId, unitCost, totalCost, notes, createdById)
> - `Vendor` (companyId)
> - `VendorItem` (vendorId+inventoryItemId unique, vendorSku, unitPrice, minOrderQty, leadTimeDays, isPreferred)
> - `PurchaseOrder` (poNumber unique, status `PoStatus`, orderDate/expectedDate/receivedDate, subtotal/taxAmount/total)
> - `PurchaseOrderItem` (quantity, unitPrice, totalPrice, receivedQty)
>
> ### Finance & Accounting
> - `LedgerAccount` (companyId+code unique, type `AccountType`, isBankAccount, parentId hierarchy)
> - `JournalEntry` (entryNumber unique, isPosted)
> - `JournalLine` (debit + credit `@db.Decimal(12,2)`)
> - `Expense` (category `ExpenseCategory`, paymentMethod, paidFromAccountId, vendorId/vendorName, isRecurring)
>
> ### HR & Payroll
> - `Employee` (storeId, optional userId, hireDate/terminationDate, type `EmployeeType`, status `EmployeeStatus`, hourlyRate or salary, jobTitle, department)
> - `W2Profile` (employerEin, employerName, employerAddress, ssn, federalAllowances, additionalFederal/State, state, localTaxCode)
> - `TimeEntry` (clockIn/clockOut, breakMinutes, regularHours, overtimeHours)
> - `PayrollRun` (periodStart/End, payDate, status `PayrollStatus`, totalGross/Taxes/Net)
> - `PayrollRunEmployee` (regular/overtime hours+pay, tips, bonus, gross, federalTax, stateTax, localTax, socialSecurity, medicare, otherDeductions, netPay; unique `[payrollRunId, employeeId]`)
> - `WageHistory` (effectiveDate, endDate, hourlyRate or salary, reason, approvedById)
> - `WorkSchedule` + `Shift` + `ShiftTemplate`
> - `AttendanceRecord` (status `AttendanceStatus`, scheduled vs actual times, breakDuration, overtimeHours, unique `[employeeId, date]`)
> - `StaffSuggestion` (category `SuggestionCategory`, status `SuggestionStatus`, priority `SuggestionPriority`, upvotes)
>
> ### Operations & Customer
> - `Printer` (connectionType `NETWORK|USB|SERIAL`, ipAddress, port, paperWidth, printOnOrder/Paid/Kitchen/Packed flags, station, type `PrinterType`)
> - `ClosePeriod` (periodDate, openedAt/closedAt, openingCash, closingCash/expectedCash/cashDifference, totalSales, totalOrders, cashSales/cardSales/otherSales, status `CloseStatus`, openedById/closedById; unique `[storeId, periodDate]`)
> - `DailySalesSnapshot` (totalSales, totalOrders, averageOrderValue, dineIn/pickup/deliverySales, cash/card/otherSales, taxAmount, discountAmount, refundAmount, topProducts JSON, hourBreakdown JSON; unique `[storeId, date]`)
> - `Customer` (phone unique, loyaltyPoints, lifetimeSpend, orderCount, referralCode unique, referredById self-relation `Referrals`)
> - `CustomerAddress` (label, address, city, state, zipCode, lat/lng, deliveryZoneId, isDefault)
> - `LoyaltyTransaction` (points, type `LoyaltyTransactionType`, orderId, indexes on customer + order)
>
> ### Enums (must be exact strings used by services and clients)
> ```
> ProductType: STANDALONE COMBO MODIFIER_ONLY PIZZA STROMBOLI SUB WRAP CUSTOM
> AddOnType: TOPPING SAUCE CHEESE PREMIUM_TOPPING SIDE_OPTION CRUST BREAD
> AddOnCategory: REGULAR PREMIUM DIETARY
> MeasurementUnit: GRAMS OUNCES SLICES PIECES NONE
> PricingRule: FLAT_FEE PER_ITEM_PRICE FIRST_TWO_FREE TIER_BASED
> KitchenStation: GENERAL PIZZA FRYER SANDWICH DRINKS DESSERT SALAD GRILL
> OrderType: DINE_IN PICKUP DELIVERY DRIVE_THRU
> OrderStatus: PENDING CONFIRMED PREPARING BAKING PACKING READY OUT_FOR_DELIVERY DELIVERED COMPLETED CANCELLED REFUNDED
> ItemStatus: PENDING IN_PROGRESS COMPLETED
> ItemType: PRODUCT COMBO
> PaymentMethod: CASH CREDIT_CARD DEBIT_CARD GIFT_CARD ONLINE CHECK OTHER
> PaymentStatus: PENDING PROCESSING COMPLETED FAILED REFUNDED
> LoyaltyTransactionType: EARNED REDEEMED SIGNUP REFERRED ADJUSTED
> OrderSource: POS KIOSK WEB MOBILE_APP PHONE THIRD_PARTY
> DriverStatus: OFFLINE ONLINE BUSY ON_BREAK
> DeliveryStatus: ASSIGNED ACCEPTED AT_STORE PICKED_UP EN_ROUTE ARRIVED DELIVERED FAILED
> MovementType: SALE PURCHASE ADJUSTMENT WASTE TRANSFER_IN TRANSFER_OUT INITIAL
> PoStatus: DRAFT SENT PARTIAL RECEIVED CANCELLED
> AccountType: ASSET LIABILITY EQUITY REVENUE EXPENSE
> ExpenseCategory: RENT UTILITIES SUPPLIES MARKETING REPAIRS SOFTWARE INSURANCE LICENSES OTHER
> EmployeeType: HOURLY SALARY
> EmployeeStatus: ACTIVE INACTIVE TERMINATED ON_LEAVE
> PayrollStatus: DRAFT PENDING PROCESSED PAID
> PrinterType: THERMAL IMPACT LABEL
> PrinterConnection: NETWORK USB SERIAL
> CloseStatus: OPEN CLOSING CLOSED VERIFIED
> SuggestionCategory: GENERAL MENU OPERATIONS CUSTOMER_SERVICE CLEANLINESS SAFETY EFFICIENCY MORALE
> SuggestionStatus: PENDING UNDER_REVIEW ACCEPTED IMPLEMENTED REJECTED
> SuggestionPriority: LOW MEDIUM HIGH URGENT
> ScheduleStatus: DRAFT PUBLISHED ARCHIVED
> ShiftStatus: SCHEDULED CONFIRMED IN_PROGRESS COMPLETED NO_SHOW CANCELLED
> AttendanceStatus: PRESENT ABSENT LATE EARLY_DEPARTURE ON_BREAK SICK_LEAVE VACATION HOLIDAY
> ```
>
> Cascade rules: deleting a `Store` cascades to its categories/products/addons/orders/inventory/printers; deleting an `Order` cascades to items/payments/refunds; deleting a `Customer` cascades to addresses + loyalty transactions; auth-related cascades on Role/Permission junctions.
>
> **Verify:** `npx prisma format && npx prisma validate` pass; `npx prisma migrate dev --name init` creates ~57 tables.

---

## Phase 3: NestJS Foundation, Prisma Service & Auth

> **Prompt: Phase 3 — NestJS Bootstrapping**
>
> 1. In `scaffold/api/`, create `package.json` with NestJS 10 + Prisma 5 + Socket.io 4 + bcrypt + JWT + class-validator + Swagger. Add scripts: `start:dev`, `start:prod`, `build`, `prisma:generate`, `prisma:migrate`, `prisma:seed`, `prisma:studio`, plus jest unit + e2e configs. Reference the seed via the `prisma.seed` package.json field pointing at `prisma/seed.ts`.
> 2. Create `src/main.ts` that:
>    - Bootstraps the Nest app with `rawBody: true` (needed for Stripe webhooks).
>    - **Throws if `JWT_SECRET` is missing or equals `your-secret-key`** (defense against deploying with the example value).
>    - Enables CORS reading `CORS_ORIGINS` env (comma-separated) with sensible localhost defaults for ports 3001–3008+3011.
>    - Adds security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `CSP: default-src 'self'; frame-ancestors 'none'; base-uri 'self'`, `HSTS` in production).
>    - Adds an in-process IP+path rate limiter for `/api/v1/auth/*` and `/api/v1/drivers/auth/*` (toggleable via `ENABLE_RATE_LIMIT`, default on in production).
>    - Adds a global `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })`.
>    - Uses the `IoAdapter` for WebSockets.
>    - Sets prefix `api/v1` and mounts Swagger at `/api/docs` with bearer auth.
> 3. Create `src/prisma/prisma.module.ts` and `prisma.service.ts` (a `PrismaClient` extension that calls `$connect` on module init and exports itself as a global module).
> 4. Create `src/modules/auth/`:
>    - `LoginDto` (email + password, class-validator).
>    - `AuthService` with `login(email, password)`, `logout(userId, token)` (Redis blacklist for 24h), `getProfile(userId)`, `refreshToken(userId, rawToken)` validating the `type: refresh` claim, plus a private `generateTokens(user)` returning both `accessToken` (24h, `type: access`) and `refreshToken` (7d, `type: refresh`).
>    - `AuthController` exposing `POST /auth/login`, `POST /auth/logout` (guarded), `GET /auth/me` (guarded), `POST /auth/refresh` (guarded) with Swagger annotations.
>    - `JwtStrategy` extracting from the bearer header and **also verifying the token is not blacklisted in Redis** before allowing the request through.
>    - `JwtAuthGuard` and `OptionalJwtAuthGuard` (the optional one allows unauthenticated requests to pass through and just sets `req.user` when a valid token exists).
> 5. Create the `RedisModule` exposing a `RedisPubSubService` that wraps two `ioredis` clients (publisher + subscriber) and supports `set/get/del`, `publish`, and `subscribe(channel, callback)` / `unsubscribe`. It must read `REDIS_URL` from env.
> 6. Create the `RolesModule` and `UsersModule` to manage CRUD for roles + permissions + users with store access. Users CRUD must hash passwords with bcrypt cost 10.
>
> **Verify:** `npm run start:dev` boots, `POST /api/v1/auth/login` with seeded credentials returns `{ user, accessToken, refreshToken, expiresIn }`, blacklisted tokens are rejected.

---

## Phase 4: Stores, Menu & AddOn Composition

> **Prompt: Phase 4 — Stores + Menu Domain**
>
> Build the modules that drive everything else.
>
> 1. **`StoresModule`** — full CRUD on Store + StoreSettings + DeliveryZone. Endpoints under `/api/v1/stores`. List endpoint returns stores filtered by `companyId` (resolved from JWT). Include a `GET /stores/public` returning minimal public info (id, name, address, phone) usable by the online ordering site without auth.
> 2. **`MenuModule`** — `/api/v1/menu/categories`, `/api/v1/menu/products`. Implement:
>    - `GET /menu/categories?storeId=...` — active categories ordered by `sortOrder`.
>    - `GET /menu/products?storeId&categoryId` — products available in the store via `OR: [storeConfigs.some({storeId, isAvailable: true}), category.storeId == storeId]`, including `sizes`, `category`, and the full nested `addonSets -> addonSet -> addons -> addon` graph (ordered by `displayOrder`).
>    - `POST /menu/products` accepts a payload with `storeId`, `sizes[]`, and optional `recipe`. It must create a matching `ProductStore` row and create `ProductSize` rows in one transaction.
>    - `PATCH /menu/products/:id` recreates sizes when the `sizes` array is provided (delete-then-createMany).
>    - Soft-delete products (`isActive: false`) — never hard-delete.
> 3. **`AddonsModule`** — separate `/api/v1/addons` namespace exposing CRUD for `AddOn`, `AddOnSet`, and `SetAddOn` joins, plus:
>    - `POST /addons/product/:productId/link/:setId` — create `ProductAddOnSet` with `displayOrder`.
>    - `DELETE /addons/product/:productId/unlink/:setId`.
>    - `GET /addons/product/:productId` — nested view of all sets+addons available for that product.
> 4. **`CombosModule`** — CRUD for `Combo` + `ComboItem` + `ComboStore`. Add `GET /combos/available?storeId` (active combos available in that store right now) and `POST /combos/:id/duplicate`.
> 5. **`CustomersModule`** — phone-keyed customer registry with loyalty points. Endpoints: `GET /customers`, `GET /customers/lookup?phone`, `GET /customers/:id`, `POST /customers`, `PUT /customers/:id`, `POST /customers/:id/addresses`, `GET /customers/:id/loyalty-transactions`.
>
> All endpoints must be wrapped with `@ApiTags` + `@ApiBearerAuth`. Validate request bodies via DTOs.
>
> **Verify:** Use Swagger to create a category, a product with two sizes and a recipe, an addon, an addon set linking three addons, and link the set to the product. Then `GET /menu/products` returns the fully-nested tree.

---

## Phase 5: WebSocket Gateway (the Realtime Backbone)

> **Prompt: Phase 5 — WebSocket Gateway**
>
> Create `src/modules/websocket/`:
>
> 1. **`websocket-events.ts`** — Centralize three exports:
>    - `OrderEvents` enum/object with **all** of these string keys (event names use colons, e.g. `'order:placed'`, `'order:status:changed'`, `'kitchen:new:order'`, `'packing:order:packed'`, `'driver:order:assigned'`, `'driver:location:updated'`, `'customer:order:ready'`, `'customer:notification'`, `'osdu:order:ready'`, etc.). Include the full set listed in the existing `websocket-events.ts` of the reference scaffold (~40 events).
>    - `RoomPrefixes` = `{ STORE, KITCHEN, PACKING, OSDU, KIOSK, ONLINE, DRIVERS, ADMIN, COMPANY }`.
>    - `OrderStatusFlow` and `ItemStatusFlow` enum-like maps and the payload types `OrderEventPayload`, `ItemEventPayload`, `DriverEventPayload`.
>
> 2. **`WebsocketGateway`** with namespace `/ws` and CORS for ports 3001–3008.
>    - On `handleConnection`: read `client.handshake.auth.token`. If it equals one of the service tokens (`kds-token`, `packing-token`, `osdu-token`, `kiosk-token`, `online-token`, `driver-token`) **and** the env flag `WS_ALLOW_INSECURE_SERVICE_TOKENS` allows it (default true in dev, false in prod), set `client.user` to a synthetic service-client payload. Otherwise verify it as a real JWT. Reject and disconnect if invalid.
>    - Subscribe handlers (each takes a `storeId` and joins the matching room): `store:subscribe`, `kitchen:subscribe`, `kds:subscribe` (alias), `packing:subscribe`, `osdu:subscribe`, `kiosk:subscribe`, `online:subscribe`, `drivers:subscribe`, `admin:subscribe`. Each must call `ordersService.resolveStoreId(storeId)` (which falls back to the default store when the input is empty/`'default'`).
>    - Order broadcast handlers: `order:placed`, `order:created` (legacy alias), `order:status:update`, `order:status-update` (legacy alias), `order:item:update`, `order:item:prepared` (legacy alias), `order:payment`. **The status update handler MUST NOT write to the DB** — it broadcasts only. All writes happen through REST. The item update handler is allowed to call `ordersService.updateItemStatus` because it's the canonical entry point used by the KDS.
>    - Driver handlers: `driver:location` republishes the location through Redis pub/sub on channel `drivers:location:update` (so multiple API instances can fan out). The gateway subscribes to that channel on `onModuleInit` and re-broadcasts to `store:`, `admin:`, `online:`, `drivers:` rooms. `driver:status` calls `ordersService.assignDriver` on `ACCEPTED` and `ordersService.markDelivered` on `DELIVERED`, then broadcasts the proper driver event.
>
> 3. **Routing brain — `broadcastOrderStatusChange(storeId, payload)`** that selects the right rooms based on the new status. Implement helpers `syncKDS`, `syncOSDU`, and `syncModuleRouting` that do exactly the following:
>    - Always fan to `store:`, `admin:`, `osdu:` rooms with `ORDER_STATUS_CHANGED`.
>    - When status is one of `[PAID, IN_KITCHEN, IN_PROGRESS, PREPARING, BAKING, IN_OVEN, PREPARED, READY]`: emit `order:status-changed` to the kitchen room; if the status is one of `[PAID, IN_KITCHEN, IN_PROGRESS, PREPARING]` and the payload has data, also emit `kitchen:new-order`.
>    - When status is one of `[PACKING, PACKED, READY, READY_FOR_PICKUP, READY_TO_SERVE]`: emit `osdu:order-ready` (with a slim payload containing tokenNumber, orderNumber, type, customerName, item count and first 5 items) and `customer:order-ready` to the kiosk room.
>    - Per-status routing:
>      - `IN_KITCHEN | IN_PROGRESS | PREPARING | BAKING` -> `ORDER_IN_KITCHEN` to kitchen.
>      - `PACKING | READY` -> `ORDER_PREPARED` to kitchen and `PACKING_NEW_ORDER` to packing.
>      - `PACKED` -> if `type=DELIVERY`, alert drivers; if `type=PICKUP`, alert OSDU + online + kiosk; if `type=DINE_IN`, emit `ORDER_READY_TO_SERVE` to store.
>      - `OUT_FOR_DELIVERY` -> drivers + online; send a `customer:notification`.
>      - `DELIVERED` / `COMPLETED` -> notify online + store + customer notification.
>      - `CANCELLED` -> store + kitchen + online.
>
> 4. **Backwards-compatible event aliases** — `emitWithAliases(room, event, data)` must also emit each event under its legacy name (e.g. `order:placed` also emits `order:created` and `kitchen:new-order`; `osdu:order:ready` also emits `order:ready` and `osdu:order-ready`). The aliasMap from the reference is mandatory.
>
> 5. **Public broadcast helpers** that other modules call: `broadcastToStore`, `broadcastToKitchen`, `broadcastToOSDU`, `broadcastToDrivers`, `broadcastToKiosk`, `broadcastToOnline`, `broadcastOrderEvent(storeId, event, data)`.
>
> 6. **`WebSocketModule`** must use `forwardRef(() => OrdersModule)` to avoid circular imports, and import `JwtModule` + `RedisModule`.
>
> **Verify:** Connect a `socket.io-client` to `ws://localhost:3000/ws` with `{ auth: { token: 'kds-token' } }`, emit `kitchen:subscribe` with a real storeId, then call `POST /api/v1/orders/...` and watch the `order:placed` + `kitchen:new-order` events arrive.

---

## Phase 6: OrdersModule — the Heart of the System

> **Prompt: Phase 6 — Orders Service**
>
> Implement `src/modules/orders/`. This is the most complex module.
>
> 1. **`OrdersController`** under `/api/v1/orders`:
>    - `GET /orders/public/default-store` — public, returns `{ storeId }` for the seeded default store.
>    - `GET /orders/public/stores` — public list of stores (id, name, code, address) used by online apps.
>    - `GET /orders` — `OptionalJwtAuthGuard`. Query params: `storeId`, `status` (comma-separated supported), `includeFuture` (default true), `futureOnly` (default false). Filter logic for `scheduledFor` matches: future-only excludes everything not future-dated, `includeFuture=false` returns scheduledFor IS NULL OR scheduledFor <= now.
>    - `GET /orders/:id` — order with items+payments.
>    - `POST /orders` — create an order. Optional auth. Logs payload + result. Wraps any non-HttpException error into a 500 with the message.
>    - `PUT /orders/:id/status` — update status; same body for `PUT /orders/:id/lifecycle` (alias).
>    - `POST /orders/:id/items/:itemId/status` — guarded; updates item status.
>    - `POST /orders/:id/payments` — guarded; processes a payment.
>    - `POST /orders/:id/driver/accept`, `/driver/delivered`, `/driver/record-tip` (cash tip with optional emailed receipt).
>
> 2. **`OrdersService.create(data)`** must:
>    - Resolve `storeId` (`resolveStoreId` falls back to default when missing/`'default'`).
>    - Drop `createdById` if the user doesn't exist in the DB (so unauthenticated kiosk/online orders still work).
>    - For each item: look up the product; if not found, call `getOrCreateFallbackPosProduct(storeId, item)` to create a "POS Walk-in" product on demand. Compute `unitPrice`, `quantity`, `totalPrice`. Snapshot `addons` (or legacy `modifiers`) into the JSON column. Determine `kitchenStation` from item -> product -> `'GENERAL'`. Default `status: 'PENDING'`.
>    - Recompute `subtotal` from items, then totals: tax (zero if `taxExempt`), delivery fee, tip, **loyalty redemption at 100 points = $1.00** (subtract from total).
>    - Honour `taxExempt` only when `taxExemptIdRef` is provided and normalize that ID.
>    - Generate `orderNumber` from `StoreSettings.orderNumberPrefix + nextOrderNumber` and **retry up to 5 times** if a unique constraint conflict occurs.
>    - Persist the order with nested `items.create` and `payments.create`.
>    - If `loyaltyPointsUsed > 0` and a customer matches the phone, decrement the customer's points and record a `LoyaltyTransaction { type: REDEEMED }` in a single transaction.
>    - Call `inventoryService.deductStockForOrder(orderId, storeId, items)` (best-effort, log on failure).
>    - Broadcast `OrderEvents.ORDER_CREATED` (skip kitchen routing if scheduled in the future).
>    - Return the saved order.
>
> 3. **`updateStatus(id, status, storeId?)`** must:
>    - Normalize the requested status into a valid `OrderStatus` (rejecting unknowns) and call `ensureWorkflowTransitionAllowed(currentStatus, newStatus)` to enforce the legal forward graph (`PENDING -> CONFIRMED -> PREPARING -> BAKING -> PACKING -> READY -> { OUT_FOR_DELIVERY | DELIVERED | COMPLETED }`, plus `CANCELLED` from any non-terminal state).
>    - Set the matching timestamp column (`confirmedAt`, `preparedAt`, `packedAt`, `deliveredAt`, `completedAt`).
>    - Broadcast through `websocketGateway.broadcastOrderStatusChange`. Use the **requested** status string (preserving legacy `PACKED`, `READY_FOR_PICKUP`, `READY_TO_SERVE` aliases) when those don't map to enum values.
>    - When transitioning to `BAKING`, call `ovenTimerService.startOvenTimer(orderId, storeId)`. When leaving `BAKING`, cancel the timer.
>
> 4. **`updateItemStatus(orderId, itemId, status)`** must:
>    - Map status (`PENDING`, `IN_PROGRESS`, `PREPARED`, `ASSEMBLED`, `PACKED`) to the persisted enum, set `startedAt`/`completedAt`.
>    - Re-fetch the order **after** the update.
>    - Emit `ORDER_ITEM_PREPARED` to kitchen + store.
>    - If **all** items are completed (`PREPARED|ASSEMBLED|PACKED|COMPLETED`), auto-advance the order status to `PACKING` and broadcast `KITCHEN_ALL_ITEMS_COMPLETED`.
>
> 5. **`processPayment(orderId, paymentData, storeId?)`** must:
>    - Reject tax-exempt promotion to an order that already has completed payments unless it was already exempt.
>    - In a single Prisma transaction: zero out existing tax + adjust total when promoting to tax-exempt, increment `tipAmount` and `total` if `tipAmount > 0` is provided, **earn loyalty at 1 point per $1** for the matched phone (increment `loyaltyPoints` and `lifetimeSpend`, write a `LoyaltyTransaction { type: EARNED }`), and create the `Payment` row.
>    - When `closeOrderOnFullPayment` is set and the running total of completed payments meets `order.total`, auto-update the status (e.g. to `CONFIRMED` or `COMPLETED` for prepaid online orders).
>    - Broadcast `ORDER_PAID` and (if delivery) `DRIVER_ORDER_ASSIGNED`.
>
> 6. **`OvenTimerService`** — runs in-memory; on `startOvenTimer` schedules a setTimeout for the relevant prep time from `StoreSettings.pizzaPrepTimeMinutes` (default 15min) and emits an event when complete. Cancel cancels the timer. Resilient to duplicate starts.
>
> 7. **Public helpers** for the WebSocket gateway: `assignDriver(orderId, driverId, storeId?)`, `markDelivered`, `recordCashTip(orderId, driverId, tipAmount, emailReceipt, customerEmail)`, `resolveStoreId`, `getDefaultStoreId`, `getPublicStores`.
>
> **Verify:** Create an online order via REST without auth, watch it appear on the KDS via WebSocket, advance items through the KDS, and confirm the order auto-advances to `PACKING` then `READY`.

---

## Phase 7: Inventory, Finance, HR, Drivers, Printers & Reports

> **Prompt: Phase 7 — The Operational Modules**
>
> Implement the remaining backend modules with REST + WebSocket integration where appropriate.
>
> 1. **`InventoryModule`** — CRUD for `InventoryItem`, `Vendor`, `VendorItem`, `PurchaseOrder`. Endpoints:
>    - `/inventory/items` (list/create/update/delete) — barcode lookup `/items/by-barcode/:barcode?storeId=`.
>    - `/inventory/movements` — list + create. Creating a movement updates `currentStock` atomically and recomputes `avgCost` (weighted avg) when `type=PURCHASE`.
>    - `/inventory/stock-levels?storeId` — items below `minStockLevel`.
>    - `/inventory/purchase-orders` (list/create) + `POST /purchase-orders/:id/receive` (transitions DRAFT->RECEIVED, increments stock, writes a `PURCHASE` movement per line).
>    - `/inventory/receive-barcode` — convenience endpoint for handheld scanners.
>    - **`deductStockForOrder(orderId, storeId, items)`** — for each item with a recipe, write `SALE` movements that decrement stock by `recipeIngredient.quantity * orderItem.quantity`. No-op for products without recipes. Idempotent on `orderId`.
>
> 2. **`FinanceModule`** — endpoints for ledger accounts, journal entries (with the constraint that lines must balance: sum(debit)=sum(credit)), expenses, daily P&L. P&L: `GET /finance/pl?storeId&from&to` returns revenue (orders.total filtered to status COMPLETED in window) - cogs (sum of inventory `SALE` movements * unitCost) - operating expenses grouped by `ExpenseCategory`.
>
> 3. **`EmployeesModule`** — CRUD + `POST /employees/clock-in`, `PUT /employees/clock-out/:id`, payroll generation (`POST /employees/payroll/run` creates a `PayrollRun` and per-employee rows applying federal+state tax tables).
>
> 4. **`DriversModule`** — `/api/v1/drivers` and `/api/v1/drivers/auth`. Driver login uses **PIN** (bcrypt hashed) instead of password. Endpoints: `POST /drivers/auth/login`, `GET /drivers/me`, `GET /drivers?storeId`, `POST /drivers`, `PUT /drivers/:id`, `PUT /drivers/:id/status` (broadcasts `DRIVER_AVAILABLE` when status changes to ONLINE), `GET /drivers/:id/earnings?from&to&storeId`, `POST /drivers/:id/location` (writes to Redis + broadcasts).
>
> 5. **`KitchenModule`** — thin orchestration over OrdersModule. `GET /kitchen/tickets?storeId&station` returns active orders filtered to the station's items. Provides `POST /kitchen/tickets/:id/items/:itemId/start|prepared` shortcuts that delegate to `OrdersService.updateItemStatus`.
>
> 6. **`PrintersModule`** — `Printer` CRUD + `POST /printers/:id/test` (sends a test receipt). For now stub the actual ESC/POS networking; expose the contract.
>
> 7. **`ReportsModule`** — `GET /reports/sales`, `GET /reports/pl`, `GET /reports/top-products`, `GET /reports/hourly?storeId&date`. Build `DailySalesSnapshot` lazily — when a report is requested for a closed day, compute it once and persist.
>
> 8. **`PaymentsModule`** — Stripe-style payment intents (use a stub gateway behind an interface). Endpoints: `POST /payments/intent`, `POST /payments/webhook` (uses raw body), refund support.
>
> 9. **`DataManagementModule`** — admin-only export/import endpoints (CSV) for menu, customers, orders. Used by the `Data Management` settings tab.
>
> 10. **`HealthModule`** — `GET /health` returns `{ status: 'ok', db, redis, version }`.
>
> Wire all modules into `AppModule`. Order of imports matters: `ConfigModule.forRoot({ isGlobal: true })`, then `RedisModule`, `RolesModule`, `PrismaModule`, `AuthModule`, then the rest.
>
> **Verify:** Hit each endpoint via Swagger and confirm the data model behaves as expected. Create an order, then check that inventory was deducted and a journal entry was queued.

---

## Phase 8: Seed Data

> **Prompt: Phase 8 — Seed the Database**
>
> Create `scaffold/api/prisma/seed.ts` (registered as the seed script in `package.json`) that, when run, produces a fully usable demo environment. It must be **idempotent** — re-running should not duplicate data.
>
> 1. Create the company `Pizza Palace Inc.` (UTC→America/New_York) and three roles: `Owner` (system), `Store Manager`, `Cashier` (and optionally `Driver`, `KDS Operator`).
> 2. Create two stores: `Downtown Location` (code `DT`) and `Uptown Location` (code `UT`), both in NY with 8% tax. Add `StoreSettings` for each.
> 3. Create users (all with bcrypt-hashed `password123`):
>    - `owner@pizzapalace.com` -> Owner -> access to both stores.
>    - `manager.dt@pizzapalace.com` -> Store Manager -> Downtown only.
>    - `cashier.dt@pizzapalace.com` -> Cashier -> Downtown only.
>    - `manager.ut@pizzapalace.com` -> Store Manager -> Uptown only.
> 4. Seed a full menu for Downtown:
>    - Categories: `Pizza`, `Subs`, `Pasta`, `Sides`, `Drinks`, `Desserts`, `Build Your Own`.
>    - Pizza products (Cyber Pepperoni, Quantum BBQ Chicken, Nebula Veggie, Solar Meat Lovers) with three sizes (Small / Medium / Large) and `priceAdjustment` per size, `kitchenStation: PIZZA`.
>    - Subs (Italian, Meatball, Veggie Wrap), Pasta (Spaghetti, Lasagna), Sides (Wings, Garlic Knots, Fries), Drinks (Soda, Bottled Water), Desserts (Tiramisu, Brownie).
>    - AddOns: `Toppings` set (Pepperoni, Mushroom, Onion, Olive, Pepper, Sausage, Bacon, Extra Cheese, Pineapple) with sizePrices keyed by size; `Crust` set (Thin, Hand Tossed, Stuffed); `Sauce` set; `Cheese` set.
>    - Link the sets to the right products via `ProductAddOnSet`.
>    - Two combos (`Family Feast`, `Game Day Special`) with `ComboItem`s mixing fixed products and category picks.
> 5. Seed a few `InventoryItem`s (Mozzarella, Pepperoni, Tomato Sauce, Pizza Dough, …) and matching `Recipe` + `RecipeIngredient` rows for at least three menu items so inventory deduction is visible.
> 6. Seed a default `Driver` (`John Driver`, PIN `1234`) for Downtown.
> 7. Seed three sample orders in different states: one `PENDING` from the kiosk, one `BAKING` (so the KDS shows an oven timer), one `READY` (so the OSDU shows it).
> 8. Seed a default `LedgerAccount` chart of accounts (Assets/Liabilities/Equity/Revenue/COGS/Expense).
> 9. Add separate scripts referenced from `package.json`:
>    - `prisma/desi-menu-seed.ts` for the alternate Indian/desi menu.
>    - `scripts/seed-byo-pizza.ts` and `scripts/seed-pizza-modifiers.ts` for the build-your-own pizza configurator.
>    - `seed-test-user.js` quick utility to create a one-off test user.
>
> **Verify:** `npx prisma db seed` finishes cleanly; running it again produces "already seeded, skipping" output. Logging into web-admin shows real data.

---

## Phase 9: web-admin (POS + Settings Dashboard)

> **Prompt: Phase 9 — The Web Admin App**
>
> Create `scaffold/web-admin/`. Stack: React 18 + Vite + TS + Tailwind + Zustand + TanStack Query + axios + react-router-dom + socket.io-client + lucide-react + sonner + recharts.
>
> 1. **State (`src/hooks/useStore.ts`)** — Zustand store with `user`, `token`, `currentStoreId`, `isAuthenticated`, plus `login`, `logout`, `setStore`, `setToken`. Persist `token` and `currentStoreId` to `localStorage` and rehydrate on init.
> 2. **API service (`src/services/api.ts`)** — axios instance with base `${VITE_API_URL}/api/v1`, request interceptor injecting the bearer token, response interceptor that calls `useStore.getState().logout()` on 401 (excluding the login/refresh endpoints, and guarded by a `handlingUnauthorized` flag to avoid loops). Export a structured `api` object with namespaces: `auth`, `menu`, `orders`, `stores`, `customers`, `inventory`, `combos`, `addons`.
> 3. **WebSocket (`src/components/WebSocketProvider.tsx` + `src/hooks/useWebSocket.ts`)** — establishes a single connection on login, joins `admin:` and `store:` rooms, exposes `subscribe(event, handler)`. Reconnect on token change.
> 4. **Layout (`src/components/Layout.tsx`)** — top nav with store switcher (multi-store users only), POS / Settings tabs, theme toggle, current user menu with logout. Uses `lucide-react` icons.
> 5. **Theme** — `useTheme.ts` hook + `ThemeToggle.tsx` button, persisted to localStorage, applied via `<html class="dark">`. Tailwind config has `darkMode: 'class'` and a custom palette (cyan + magenta accents to match the in-store cyberpunk vibe used by the online site).
> 6. **`/login` (`pages/auth/LoginPage.tsx`)** — simple email/password form, posts to `api.auth.login`, handles errors with `sonner`.
> 7. **`/pos` (`pages/pos/PosPage.tsx`)** — the bulk of the work:
>    - Left rail: category list. Center: product grid filtered by category. Right rail: cart with totals and order-type selector (Dine-in / Pickup / Delivery), customer phone lookup, scheduled-for picker.
>    - Modifier modal that adapts per `ProductType`:
>      - **Pizza:** size, crust, toppings with three-state selection per topping (Whole / Left / Right) and live price calculation including `sizePrices`.
>      - **Sub / Wrap / Stromboli:** size, bread, meats, toppings, sauce options; striking-through removed default toppings.
>      - **Pasta:** noodle, sauce, protein, sides.
>      - **Combo:** dynamic UI generated from `ComboItem`s — fixed items show only addon pickers; category-pick items show a sub-grid filtered to the allowed category and sizes.
>    - The cart tracks the structured modifier payload (NOT free text). Submitting calls `api.orders.create(...)` with `source: 'POS'` and the items shaped to match the OrdersService contract.
>    - Tendering modal supports cash + card (last 4 digits + transaction id), gift card, split payment, tip presets, tax-exempt with ID input.
>    - Hot-key bar for: open drawer, void item, recall held order, hold current order.
>    - Live "Find Order" panel that subscribes to `order:status:changed` and shows recent activity.
> 8. **`/settings/*` (`pages/settings/`)** — sidebar layout (`SettingsLayout.tsx`) with sub-routes:
>    - `global-insights` — top-level KPIs (today's revenue, order count, AOV) with `recharts` line+bar charts.
>    - `users` — list + create + edit user, assign role & store access.
>    - `security` — password policy, MFA toggle, audit log viewer (paginated `AuditLog` query).
>    - `stock` — inventory items + stock movements + receive-by-barcode + low-stock alerts. Also edits Recipes via a nested modal.
>    - `menu` — Categories CRUD, Products CRUD with size manager, AddOn / AddOn Set manager, Combo builder with drag-to-reorder ComboItems.
>    - `delivery` — DeliveryZone manager with a Google Maps polygon editor (`@googlemaps/js-api-loader`), per-zone fee, min order, ETA. Set **`VITE_GOOGLE_MAPS_API_KEY`** in `web-admin`; centralize loading in a hook (e.g. `useGoogleMaps`) and wrap map components so **effects that touch `google` only run after the loader resolves** — avoids runtime `google is not defined` when the key is missing or still loading.
>    - `dispatch` — live driver tracking screen (`DriverDispatch.tsx`) showing the `DeliveryMap` with each driver as a pin, color-coded by status, plus a queue of unassigned `OUT_FOR_DELIVERY` orders. Subscribes to `driver:location:updated` for live updates and `useDriverTracker` hook. Geocoding / map init must follow the same **Maps-ready** guard as delivery zones.
>    - `analytics` — daily/weekly/monthly reports with recharts.
>    - `suggestions` — Staff Suggestions board (vote, status workflow, admin response).
>    - `hr` — Employees CRUD, time entries, payroll runs, schedule builder, attendance, wage history.
>    - `customers` — Customer Management with loyalty history viewer.
>    - `general` — Store Settings tab: business info, hours, tax, prep times, OSDU mode, loyalty enabled+rate, payment toggles.
>    - `data` — Data Management: export menu/customers/orders to CSV, import menu from CSV, danger zone (wipe demo data).
> 9. **Tests** — Vitest + Testing Library. At minimum `LoginPage.test.tsx`, a Cart calculation test (tax + tip + delivery + loyalty), and an Orders socket-handler test with a mocked socket.
>
> **Verify:** Login as `owner@pizzapalace.com`, place a half-and-half pizza with extra toppings on one half, watch the order land on the KDS, advance items, see it auto-route to the OSDU.

---

## Phase 10: web-kds, web-osdu, web-packing

> **Prompt: Phase 10 — Operational Screens**
>
> Build the headless screens. Each is a Vite + React + TS app that connects to the WebSocket using a service token (no login).
>
> 1. **`web-kds/` (Kitchen Display)**
>    - **Dev port:** `vite.config.ts` should use **`3011`** so KDS does not collide with other Vite apps on one machine. Docker Compose maps host **`3011:3000`** into the container. Ensure **`api` CORS and WebSocket allowed origins** include `http://localhost:3011` for local KDS.
>    - Single-page app (`src/App.tsx`) connecting to `/ws` with `auth: { token: 'kds-token' }`, emits `kitchen:subscribe { storeId, station }`.
>    - On connect: `GET /api/v1/orders?storeId=...&status=PENDING,CONFIRMED,PREPARING,BAKING` to seed the board.
>    - Subscribes to: `order:placed`, `order:created`, `kitchen:new-order`, `order:status:changed`, `order:item:prepared`.
>    - Layout: tabbed station filter (`PIZZA`, `FRYER`, `SANDWICH`, `DRINKS`, `GENERAL`, …). Each ticket is a card with order number, token number, type badge, customer name, elapsed timer (live), oven timer (red when expired), per-item rows that the cook can tap to advance `PENDING -> IN_PROGRESS -> PREPARED`.
>    - Visual rules: yellow border for PENDING, blue for IN_PROGRESS, **orange + flame icon for IN_OVEN/BAKING**.
>    - Audio alerts: a bell when a new order arrives; a different chime when an oven timer expires. Mutable via a button.
>    - Ticket disappears when the order leaves the kitchen (status PACKING/READY/COMPLETED) — see `isTerminalKdsLifecycle` for the list.
>    - Toast notifications (`sonner` or local component) for connection state.
>
> 2. **`web-osdu/` (Order Status Display Unit)**
>    - Designed for a wall-mounted TV. Two columns: **Preparing** (left) and **Ready for Pickup** (right).
>    - Connects with `osdu-token`, subscribes to `osdu:` room, listens for `order:status:changed` and `osdu:order-ready`.
>    - Big tile per order showing the **token number** (huge), customer name, item count. Animation when an order moves to "Ready" + alert sound.
>    - Auto-removes orders 5 minutes after they become `COMPLETED` / `DELIVERED`.
>    - Configurable display mode (`grid` vs `list`) read from `StoreSettings.osdDisplayMode`.
>
> 3. **`web-packing/` (Packing / Dispatch)**
>    - Connects with `packing-token`, subscribes to `packing:` room.
>    - Each order card shows the entire item list with checkboxes. Staff check off each item as they bag it; clicking "Mark Packed" updates the item status to `PACKED` for all items, then calls `PUT /orders/:id/lifecycle` with status `READY` (or the appropriate next status: `READY_FOR_PICKUP` for pickup, `OUT_FOR_DELIVERY` for delivery, `READY_TO_SERVE` for dine-in).
>    - For delivery orders, shows a "Assign Driver" button that fetches `/drivers?status=ONLINE` and lets the user pick one (`POST /orders/:id/driver/accept`).
>
> All three apps should:
> - Auto-reconnect on socket drops with exponential backoff.
> - Show a connection status pill in the corner.
> - Default the storeId from `GET /orders/public/default-store` if not configured via query string.
>
> **Verify:** Place an order in the POS. The KDS shows it within 1s. Advance all items. The OSDU shows it as Preparing then Ready. The Packing screen shows it. Mark Packed. The OSDU updates to "Ready for Pickup" with chime.

---

## Phase 11: web-online, web-kiosk, web-driver

> **Prompt: Phase 11 — Customer-Facing Apps**
>
> 1. **`web-online/` (Customer online ordering)**
>    - React 18 + Vite + TS + Tailwind + react-toastify + react-router-dom v7.
>    - Pages: `LandingPage`, `MenuPage`, `CartPage`, `CheckoutPage`, `ConfirmationPage`, `OrdersPage`, `RewardsPage`, `AccountPage`. Components: `GlobalHeader`, `Footer`, `ThemeToggle`, `ComboCustomizerModal`/`ComboCustomizerModalV2`.
>    - Lazy-loaded build screens: `BuildYourOwnPizza`, `BuildYourOwnSub`, `BuildYourOwnPasta` — interactive customizers with **real-time visual feedback** ("NO Onions", "+ Extra Cheese") and live-updated price.
>    - **Build-your-own visuals (match scaffold):**
>      - **Pizza:** Default preview is **SVG/procedural** (`pizza/PizzaVisualizerSvg.tsx` — crust via radial gradient + SVG turbulence/displacement + rim/speckles; cheese bubbles; toppings sampled with **area-uniform radius** and stratified angles; **half pizza** places toppings on west/east semicircle sectors). Keep a **PNG layer fallback** behind a single flag (e.g. `USE_PIZZA_IMAGE_LAYERS` in `BuildYourOwnPizza.tsx`) using `pizza/PizzaVisualizerImages.tsx` and assets under `public/pizzas/layers/*.png`.
>      - **Sub / pasta:** Use **SVG-based** preview components alongside the modifier UI (no separate raster asset tree required).
>    - Cart state in plain React state (no Zustand here). Persisted to `localStorage`.
>    - Customer auth is phone-based: enter phone → server returns the matching `Customer` record (or creates a new one on first checkout). Loyalty points displayed in the header and on the rewards page.
>    - Checkout supports Pickup or Delivery. Delivery flow validates the address against `/api/v1/stores/.../delivery-zones`; if outside any zone, block with a friendly message.
>    - Stripe-style card collection (use the stub `PaymentsModule`).
>    - Orders page polls `GET /orders?customerPhone=` (or subscribes via the online room) and shows live status.
>    - Branding: a "cyber pizza" cyberpunk theme — neon cyan/magenta on near-black; subtle scanline + glow effects; preserved in dark + light mode.
>    - Connects to `/ws` with `online-token` and joins `online:{storeId}` to receive `customer:order:ready` and `customer:notification` events.
>
> 2. **`web-kiosk/` (Self-service in-store kiosk)**
>    - Touch-optimized React + Vite app. Same modifier modal logic as web-admin POS but with much larger tap targets and full-screen modals.
>    - No login. Uses `kiosk-token`. Order source is `KIOSK`.
>    - Idle timer that resets the cart after 90s of inactivity.
>    - Payment is card-only (kiosk hardware) with optional "Pay at Counter" fallback.
>    - On submit, shows the assigned token number on a confirmation screen + tells the customer to watch the OSDU.
>
> 3. **`web-driver/` (Driver app)**
>    - Mobile-first PWA. Login screen takes phone + 4-digit PIN, posts to `/drivers/auth/login` and stores the JWT.
>    - Home: list of orders assigned to the driver (`OrderStatus = OUT_FOR_DELIVERY` and `driverId = me`).
>    - Detail screen per order: customer info, address, map link (deep link to native maps app), call button, "Picked Up" button (status -> `PICKED_UP`), "Arrived", "Delivered". The Delivered button asks for cash collected (if cash payment) and an optional tip amount.
>    - Reports the driver's GPS location every 10s while online via `socket.emit('driver:location', { driverId, lat, lng, storeId })`.
>    - Earnings tab: `GET /drivers/:id/earnings?from&to` with daily breakdown.
>
> **Verify:** Place a delivery order on web-online → it appears in web-admin Dispatch and on the assigned driver's web-driver home. The driver advances through PICKED_UP → DELIVERED, the customer's online "Orders" page reflects each step in real time, and a `customer:notification` toast confirms delivery on web-online.

---

## Phase 12: Tooling, Documentation & Operational Polish

> **Prompt: Phase 12 — Wrap Up**
>
> 1. **Documentation under `documentation/`**:
>    - `PROJECT_OVERVIEW.md` — executive summary + tech stack + ecosystem.
>    - `ERD_DIAGRAM.md` — Mermaid ER diagram of the high-value entities.
>    - `DATA_FLOW.md` — Mermaid sequence diagram of the order lifecycle.
>    - `FULL_ERD.svg` — generated automatically by `prisma-erd-generator` from `schema.prisma`.
>    - `RECREATION_PROMPTS.md` — this file (keep it in sync with the codebase).
> 2. **Top-level docs**:
>    - `BLUEPRINT.md` — the full architectural deep-dive with API routes, Prisma schema, P&L formulas, seed plan.
>    - `README.md` — quick start, default credentials, ports, scripts, license.
>    - `E2E_TESTING_DARK_MODE.md`, `FIND_ORDERS_SYNC_VERIFICATION.md`, `ORDER_SYNC_E2E_TESTING.md` — manual QA scripts that walk through the cross-screen synchronization tests.
> 3. **Scripts** under `scaffold/`:
>    - `start-all.ps1` / `start-all.sh` — boot infra, run migrations, seed, boot web apps.
>    - `reset-and-seed.ps1` / `reset-and-seed.sh` — drop DB, recreate, seed.
>    - `seed-test-user.js`, `verify-driver.js`, `test-order.js`, `check-users.ts`, `test-db.ts` — small operational helpers.
>    - `PAYMENT_SETUP.md` — Stripe key configuration walkthrough.
>    - `DRIVER_APP_ENHANCEMENTS.md` — backlog of driver-app improvements.
> 4. **Static assets** — under each web app's `public/` folder, drop sample product images (`pepperoni.png`, `bbq-chicken.png`, `veggie.png`, `meat-lovers.png`) so the seeded products render with imagery.
> 5. **CI** — Maintain `.github/workflows/ci.yml` on **`main`** (push + PR): **matrix job** runs `npm ci` + `npx tsc --noEmit` in each of `web-admin`, `web-kds`, `web-packing`, `web-osdu`, `web-online`, `web-kiosk`, `web-driver`; separate **web-admin** Vitest job (`npm test -- --run`); **API** job: `prisma generate`, `nest build`, Jest unit tests; **api-e2e-lifecycle** job (after API build): Postgres 15 + Redis 7 service containers, `prisma migrate deploy`, seed, start compiled API, run `npm run test:e2e:lifecycle`; **`ci-pass`** job aggregates success for branch protection.
> 6. **Production hardening checklist**:
>    - Set `JWT_SECRET` via secrets manager, **not** the example value.
>    - Set `WS_ALLOW_INSECURE_SERVICE_TOKENS=false` in prod and replace service tokens with a per-device signed JWT.
>    - Set `ENABLE_RATE_LIMIT=true`.
>    - Front the API with NGINX, terminate TLS, enable HSTS.
>    - Run `prisma migrate deploy` on every deploy. Never `db push` in prod.
>    - Add an off-site PostgreSQL backup cron.
>    - Configure MinIO with a real S3 bucket in prod.
>
> **Final Verify:** Stand up a fresh environment, run `./scaffold/start-all.sh`, log into web-admin, place an order through web-online, and watch it propagate through web-kds → web-packing → web-osdu → web-driver in real time. All seven UIs should show the same source-of-truth from a single API instance.

---

## Appendix A: Default Ports & Service Tokens

| App | Port | WS Token (dev) | Notes |
|-----|------|----------------|-------|
| api | 3000 | — | NestJS backend, Swagger at `/api/docs` |
| web-admin | 3001 | (real JWT) | POS + management dashboard |
| web-kds | 3011 | `kds-token` | Kitchen Display (`vite` dev port; Docker often maps host **3011→container 3000**) |
| web-packing | 3003 | `packing-token` | Packing/Dispatch |
| web-osdu | 3004 | `osdu-token` | Lobby TV |
| web-kiosk | 3005 | `kiosk-token` | Self-service kiosk |
| web-online | 3006 | `online-token` | Customer site |
| web-driver | 3008 | (real driver JWT) | Driver PWA |
| postgres | 5432 | — | DB |
| redis | 6379 | — | Cache + pub/sub |
| minio | 9000 / 9001 | — | Object storage + console |

## Appendix B: Default Demo Credentials

| Email | Password | Role | Stores |
|-------|----------|------|--------|
| owner@pizzapalace.com | password123 | Owner | Both |
| manager.dt@pizzapalace.com | password123 | Store Manager | Downtown |
| cashier.dt@pizzapalace.com | password123 | Cashier | Downtown |
| manager.ut@pizzapalace.com | password123 | Store Manager | Uptown |

Driver login: phone `(555) 999-0001`, PIN `1234`.

## Appendix C: Order Lifecycle Cheat Sheet

```
PENDING ──▶ CONFIRMED ──▶ PREPARING ──▶ BAKING ──▶ PACKING ──▶ READY ──┬─▶ OUT_FOR_DELIVERY ─▶ DELIVERED ─▶ COMPLETED
                                                                       ├─▶ READY_FOR_PICKUP ─▶ COMPLETED
                                                                       └─▶ READY_TO_SERVE   ─▶ COMPLETED

(any non-terminal state) ──▶ CANCELLED  /  REFUNDED
```

Item lifecycle (per `OrderItem`):

```
PENDING ─▶ IN_PROGRESS ─▶ PREPARED ─▶ ASSEMBLED ─▶ PACKED ─▶ COMPLETED
```

When **all** items are `PREPARED|ASSEMBLED|PACKED|COMPLETED`, the order auto-advances to `PACKING`.

## Appendix D: Scaffold integration notes (reference)

Use this when aligning a fresh implementation with the checked-in `scaffold/`:

| Area | Detail |
|------|--------|
| **Google Maps (web-admin)** | Env: `VITE_GOOGLE_MAPS_API_KEY`. Lazy-load via `@googlemaps/js-api-loader`; shared readiness hook; polygon editor (`DeliveryMap`) and dispatch/geocoder paths must not reference `google` until loaded. |
| **web-kds URL** | Browser: `http://localhost:3011`. API must allow this origin for HTTP + Socket.io in dev. |
| **Online builders** | Pizza: SVG default + optional PNG layers (`USE_PIZZA_IMAGE_LAYERS`). Sub/pasta: SVG previews in `web-online/src/components/build/`. |
| **CI** | `.github/workflows/ci.yml` — per-workspace typecheck matrix, web-admin tests, API build + unit + lifecycle e2e, `ci-pass`. |

---

**End of Recreation Prompts.** Keep this document in sync with `scaffold/` whenever the architecture changes.
