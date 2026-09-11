# Testing guide — step by step

Complete manual and automated testing notes for the scaffold (API, POS/Admin, Stripe sandbox, and CI). Default URLs assume **local development** on `localhost`.

---

## 1. Prerequisites

1. **Node.js** 18+ (repo CI uses Node 20 — see `.github/workflows/ci.yml`).
2. **PostgreSQL** running and reachable (Docker or local install). Default connection in `api/.env.example` matches Docker: `postgresql://restaurant:restaurant123@localhost:5432/restaurant_platform`.
3. **Redis** is optional for basic flows; the API falls back to in-memory pub/sub when Redis is down (see startup logs).
4. **Stripe test account** (optional) for payment sections: [Stripe Dashboard](https://dashboard.stripe.com) in **Test mode**, and optionally [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhooks to `localhost`.

---

## 2. One-time database setup

From `scaffold/api`:

1. Copy environment: `copy .env.example .env` (Windows) or `cp .env.example .env` (macOS/Linux). Ensure `DATABASE_URL` and `JWT_SECRET` are valid (the API refuses to start if `JWT_SECRET` is missing or equals `your-secret-key`).
2. Install dependencies: `npm ci` (or `npm install`).
3. Generate Prisma client: `npx prisma generate`.
4. Apply migrations: `npx prisma migrate deploy` (or `npm run prisma:migrate` for interactive `migrate dev` when authoring migrations).
5. Seed data: `npm run prisma:seed`.

**Verify:** `npx prisma studio` — you should see stores, users, products; note a **store UUID** from the `stores` table (needed for some API calls).

---

## 3. Run the API locally

From `scaffold/api`:

1. `npm run start:dev`
2. Wait for the console banner showing **REST base** `http://localhost:3000/api/v1`.

**Smoke test (browser or curl):**

- **Health:** `GET http://localhost:3000/api/v1/health` — expect JSON like `{ "status": "ok" }`.
- **Swagger:** open `http://localhost:3000/api/docs` — confirm the **Payments**, **Orders**, and **Authentication** tags load.

If health returns 404, you are likely missing the `api/v1` prefix (use `/api/v1/health`, not `/health`).

---

## 4. Staff login and Admin/POS (manual)

1. From `scaffold/web-admin`, run `npm install` then `npm run dev` (default **http://localhost:3001**).
2. Log in with seeded credentials (same as `README` in this folder), for example:
   - **Owner:** `owner@pizzapalace.com` / `password123`
3. Confirm you can open the **POS** and **Settings** areas without console errors.
4. **Payment settings (Stripe sandbox):** Settings → General → Payments → **Stripe**. Enter test keys and **Save** (stored in `store_settings.paymentConfigs`). See `PAYMENT_SETUP.md` for key sources and webhook setup.

---

## 5. Stripe sandbox — end-to-end (API-level)

Use this when you want to prove **Checkout Session** + **webhook** without depending on a specific front-end build.

### 5.1 Configure keys

1. In Stripe Dashboard (**Test mode**), copy **Secret key** `sk_test_...`.
2. Either:
   - Paste into **Admin** → Settings → Payments → Stripe → **Secret key** and **Save**, **or**
   - Set `STRIPE_SECRET_KEY=sk_test_...` in `scaffold/api/.env` and restart the API.

**Check capabilities:**

- `GET http://localhost:3000/api/v1/payments/capabilities?storeId=<YOUR_STORE_UUID>`
- Expect `checkoutEnabled: true` when a secret key resolves for that store (or from env).

### 5.2 Create an order

1. **`GET http://localhost:3000/api/v1/orders/public/stores`** (or **`.../public/default-store`**) — copy `storeId`.
2. **`POST http://localhost:3000/api/v1/orders`** with a JSON body matching your menu (product IDs from Swagger **Menu** endpoints or Prisma Studio). Minimum conceptually: `storeId`, line `items` (`productId`, `quantity`, `unitPrice`, …), and money fields (`subtotal`, `taxAmount`, `total`, etc.) as required by the API.

Alternatively, create a small order from **web-admin POS** and copy the order `id` from the UI or network tab.

### 5.3 Create a Checkout Session

**`POST http://localhost:3000/api/v1/payments/checkout-session`**  
Body (JSON):

```json
{
  "orderId": "<order-uuid>",
  "customerEmail": "test@example.com",
  "successUrl": "http://localhost:3002/orders?checkout=success",
  "cancelUrl": "http://localhost:3002/orders?checkout=cancel"
}
```

**Expect:** `checkoutUrl` and `sessionId`. Open `checkoutUrl` in a browser; pay with a [Stripe test card](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`).

### 5.4 Webhooks on localhost

Stripe cannot call `localhost` directly:

1. Install Stripe CLI, run `stripe login`.
2. Run: `stripe listen --forward-to localhost:3000/api/v1/payments/webhook/stripe`
3. Put the printed **`whsec_...`** secret into `STRIPE_WEBHOOK_SECRET` in `api/.env` (or store it in Admin → Stripe → Webhook Secret and ensure the event’s object includes `metadata.storeId` so the server can match the store — **env secret is tried first**). Restart the API if you changed `.env`.
4. Complete payment in Checkout. In the CLI window you should see forwarded events (e.g. `checkout.session.completed`). The API should record a **completed** payment linked to the order (see order/payment in Prisma Studio or Admin).

**Events the API handles:** `checkout.session.completed`, `payment_intent.succeeded` (see `payments.service.ts`).

---

## 6. Customer web app (`web-online`) — manual sanity

From `scaffold/web-online`:

1. `npm install` then `npm run dev`.
2. Default dev server port is **3002** (see `web-online/vite.config.ts`). Walk-in restaurant screens use the same app with station URLs such as `/menu?channel=walkin&station=front-1`.
3. Ensure `VITE_API_URL` points at your API (often `http://localhost:3000`).

**Smoke flow:** open the app → pick a store → add items → checkout. The current implementation posts orders to **`POST /api/v1/orders`**; it **does not** automatically open Stripe Checkout in the browser unless the client is extended to call **`POST /api/v1/payments/checkout-session`** and redirect to `checkoutUrl`. Use **Section 5** to validate Stripe independently.

---

## 7. Kitchen / packing / other UIs (quick check)

| App        | Typical dev command     | Default URL (Vite) |
|-----------|-------------------------|---------------------|
| web-admin | `npm run dev`           | http://localhost:3001 |
| web-online | `npm run dev`          | http://localhost:3002 |
| walk-in screens | `web-online`          | http://localhost:3002/menu?channel=walkin&station=front-1 |
| web-kds   | `npm run dev`           | http://localhost:3003 |
| web-packing | `npm run dev`         | http://localhost:3004 |
| web-osdu  | `npm run dev`           | http://localhost:3005 |
| web-driver | `npm run dev`          | http://localhost:3006 |

Confirm each loads, can select the correct **store**, and reaches the API (check browser Network tab / API logs).

---

## 8. Automated tests (CI parity)

Commands are run **per package**.

### API (`scaffold/api`)

| Step | Command |
|------|--------|
| Typecheck | `npx tsc --noEmit` |
| Unit tests | `npm test` |
| Build | `npm run build` |
| Lifecycle e2e | With Postgres + Redis + migrations + seed + **`npm run start:prod`** on port 3000: `npm run test:e2e:lifecycle` |
| **Payment options e2e** | API running on port 3000, DB migrated + seeded: **`npm run test:e2e:payments`** — CASH and card-at-register on `POST /orders`, loyalty redemption (`loyaltyPointsUsed` + customer phone), **JWT** `POST /orders/:id/payments`, and Stripe `capabilities` + `checkout-session` when `STRIPE_SECRET_KEY` / store Stripe secret is set |
| **Tip vs payment totals e2e** | API on port 3000, DB migrated + seeded: **`npm run test:e2e:tip-sync`** — tipped POS-style `Payment.amount`, driver `record-tip`, and **`sum(COMPLETED payments) === order.total`** |

The GitHub Actions job **`api-e2e-lifecycle`** runs migrate → seed → build → start API → lifecycle harness (see `.github/workflows/ci.yml`).

> **Note:** `test:e2e:payments` and **`test:e2e:tip-sync`** are **local harnesses** (not in CI by default). They mutate the database (create orders/customers/drivers).

### web-admin (`scaffold/web-admin`)

| Command | Purpose |
|---------|--------|
| `npm test -- --run` | Vitest (non-watch) |

### All web packages typecheck

CI runs `npm ci` + `npx tsc --noEmit` in each app folder under `scaffold/` (see workflow matrix). Repeat locally before pushing if you touched shared types or configs.

---

## 9. Full stack via Docker (optional)

From `scaffold/` with Docker Desktop running:

- **Windows:** `.\start-all.ps1`
- **Linux/macOS:** `./start-all.sh`

This brings up Postgres, Redis, MinIO, the API container, and web containers. URLs are printed by the script (they may differ from **local Vite** ports in the table above). After changes to **API env vars** for Stripe, rebuild or override compose env as needed.

---

## 10. Troubleshooting

| Symptom | Things to check |
|--------|-------------------|
| API exits on boot | `JWT_SECRET` in `api/.env`; database reachable; `npx prisma migrate deploy` |
| `checkoutEnabled: false` | Store Stripe secret in Admin or `STRIPE_SECRET_KEY` in `.env`; correct `storeId` on capabilities query |
| Webhook always 400 / invalid signature | `STRIPE_WEBHOOK_SECRET` matches the **same** endpoint as Stripe CLI `listen`; restart API after editing `.env` |
| CORS errors from a new dev port | Add origin in `CORS_ORIGINS` (comma-separated) or extend the default list in `api/src/main.ts` |
| Redis warnings | Normal for single-instance local dev; start Redis if you need real pub/sub |

---

## Related docs

- **Payment provider keys and Dashboard webhooks:** `PAYMENT_SETUP.md`
- **Platform overview and default logins:** `README.md` (this `scaffold` folder)
- **Web-online UI checklist (historical QA notes):** `web-online/TESTING_SUMMARY.md`
- **Payment options API script (`test:e2e:payments`):** `api/test/payment-options.e2e.ts`
- **Driver tips vs payment rows (`test:e2e:tip-sync`):** `api/test/tip-payment-sync.e2e.ts`
