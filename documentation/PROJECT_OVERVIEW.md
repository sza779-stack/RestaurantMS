# Restaurant Management System - Project Overview

## 1. Executive Summary

The Restaurant Management System is a comprehensive, production-ready Multi-Store Pizza & Quick-Service Restaurant (QSR) Management Platform. It is designed to handle complex menu items (including half-and-half pizza logic, various crust types, sizes, and customizations) as well as general QSR items like drinks, sides, and desserts. 

The platform supports a full ecosystem of integrated applications that handle everything from Point of Sale (POS) operations and kitchen management to customer-facing digital storefronts and driver dispatch.

## 2. Technology Stack

The platform utilizes a modern, robust technology stack organized within a monorepo structure:

### Backend
* **Framework:** NestJS
* **Language:** TypeScript
* **ORM:** Prisma
* **Database:** PostgreSQL (Primary data store)
* **Caching & Queues:** Redis & Bull Queue (for background jobs, printing, reports)
* **Real-time:** WebSockets (Socket.io via NestJS Gateway) for live order updates

### Frontend Ecosystem
* **Core Libraries:** React 18, Vite, TypeScript
* **State Management:** Zustand (staff apps), localized React state where appropriate (customer flows)
* **Styling:** Tailwind CSS and component libraries tuned per app (e.g. cyberpunk-themed customer site)
* **Mobile:** Progressive Web Apps (PWA) for driver and customer surfaces
* **Customer build-your-own UX:** Online ordering uses live SVG previews for pizza (procedural crust and toppings; optional PNG layer mode), subs, and pasta so modifiers reflect instantly without maintaining parallel raster asset pipelines for every combination.

### Infrastructure & Operations
* **Containerization:** Docker (with detailed compose files for dev/prod)
* **Proxy/Routing:** NGINX
* **External Integrations:** Stripe (Payments), MinIO/S3 (Storage), Node-escpos (Thermal Printing)

## 3. Application Ecosystem

The system is composed of several specialized applications tailored to different user roles within the restaurant environment:

1. **Web Admin / POS (`web-admin`):** 
   The central hub for store staff and managers. It includes the Point of Sale interface, menu management, order tracking, inventory management, HR/employee tracking, and detailed financial reporting. Delivery zones and driver dispatch use Google Maps when **`VITE_GOOGLE_MAPS_API_KEY`** is set; map-related code loads the JS API lazily and waits for readiness so missing keys do not crash the app.
   
2. **Web Storefront / Kiosk (`web-kiosk` / `web-online`):**
   Customer-facing applications allowing self-service ordering via in-store kiosks or online ordering interfaces. Features a touch-optimized UI, cart management, and payment flow.

3. **Kitchen Display System (`web-kds`):**
   A specialized display for kitchen staff. It shows order tickets, station-specific views (e.g., pizza station vs. fryer), order timers, and audio alerts. Local development serves the app on **port 3011** so it does not clash with other Vite apps; the API allows `http://localhost:3011` for CORS and WebSockets in dev.

4. **Order Status Display Unit (`web-osdu`):**
   A lobby TV display (like those seen in major fast-food chains) that shows customers the status of their orders (e.g., "Preparing" vs. "Ready for Pickup").

5. **Packing / Dispatch (`web-packing`):**
   Used by the packing and dispatch team to verify that orders are complete before handing them off to customers or assigning them to delivery drivers.

6. **Driver App (`web-driver` / Mobile):**
   An application for delivery drivers to receive assignments, view delivery routes, update delivery status, and collect proof of delivery or signatures.

7. **Customer Mobile App:**
   A dedicated mobile experience (PWA or React Native) for customers to place orders, track loyalty points, and manage their accounts.

## 4. Key Architectural Modules

The NestJS backend is highly modularized, with key domains including:
* **Auth & Users:** RBAC (Role-Based Access Control) managing permissions for owners, managers, cashiers, and drivers.
* **Stores & Zones:** Multi-tenant configuration allowing a single company to manage multiple physical store locations, each with custom delivery zones and settings.
* **Menu:** Sophisticated product management supporting categories, base products, dynamic modifiers (toppings, crusts), and complex combo/meal deal logic.
* **Orders:** The core lifecycle engine for tracking an order from `PENDING` through `BAKING`, `READY`, and `DELIVERED`.
* **Inventory & Finance:** Real-time stock movement tracking, recipe/BOM (Bill of Materials) mapping, and a full double-entry ledger system for financial reporting.
* **Kitchen:** Routing logic that sends specific items to designated kitchen stations (e.g., pizzas to the oven screen, fries to the fryer screen).

## 5. Real-Time Capabilities

A defining feature of the architecture is its reliance on WebSockets to maintain real-time synchronization across all devices. When an order is placed on the web storefront, it immediately pops up on the POS, the KDS, and the OSDU without requiring page refreshes, ensuring a seamless flow of operations.

## 6. Continuous integration

Pull requests and pushes to **`main`** run GitHub Actions (`.github/workflows/ci.yml`): TypeScript `tsc --noEmit` for each web workspace under `scaffold/`, Vitest for `web-admin`, API `prisma generate` + Nest build + unit tests, and an API **lifecycle** end-to-end job against Postgres and Redis service containers. A final **`ci-pass`** job aggregates required checks for branch protection.
