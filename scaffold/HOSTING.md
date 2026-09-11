# Hosting & deployment guide

This document describes **what to run in production**, how the pieces relate, and what **cloud or self-hosted setups** typically look like for the RestaurantMS scaffold (`scaffold/`).

---

## Components you are hosting

| Piece | Role | Typical hosting |
|--------|------|----------------|
| **API** (`scaffold/api`) | NestJS: REST `/api/v1`, Swagger `/api/docs`, Stripe **webhook**, PayPal capture, Socket.IO **`/ws`** | Long-running Node process or container (**Node.js 20 LTS** matches `Dockerfile` and CI) |
| **PostgreSQL** | Primary datastore (Prisma) | Managed DB (RDS, Azure Database, Neon, Cloud SQL, etc.) or self-hosted Postgres **14+** (compose uses **15**) |
| **Redis** | Cache, rate-limit backing (auth), optional cross-process pub/sub | Managed Redis or container; API can fall back partially when Redis is absent (not ideal at scale) |
| **MinIO or S3-compatible** | Uploaded assets (`MINIO_*` env) | Managed object storage **or** MinIO beside the API |


The repo **`docker/docker-compose.yml`** is aimed at **local development**: hot reload, seeded passwords, Postgres/Redis/MinIO on one machine—not a hardened production blueprint.

---

## Minimum production requirements

1. **Always-on HTTPS** for browser apps and webhook endpoints (Stripe, etc.).
2. **Strong secrets**: `JWT_SECRET` must **not** be left as placeholder values—the API rejects `JWT_SECRET === 'your-secret-key'`. Rotate DB and provider keys independently.
3. **Database migrations** before or alongside new API deploys:
   ```bash
   cd scaffold/api && npx prisma migrate deploy
   ```
   The production Docker image does **not** run migrations automatically.
4. **CORS**: Set **`CORS_ORIGINS`** to a comma-separated list of exact front-end origins (scheme + host + port), e.g. `https://pos.example.com,https://orders.example.com`. If unset locally, Nest falls back to `http://localhost:…` dev ports—**not usable** for remote clients.
5. **WebSocket CORS**: Socket.IO allowed origins mirror **`WS_CORS_ORIGINS`** if set; otherwise **`CORS_ORIGINS`**; otherwise localhost defaults. Use the same HTTPS origins your SPAs actually use (`scaffold/api/src/modules/websocket/websocket.gateway.ts`).

Apps that join **`/ws`** (POS, KDS, etc.) must use **`VITE_WS_URL`** consistent with where clients reach the API (usually `wss://api.example.com`, same host as HTTPS if you terminate TLS on one domain).

---

## Reference architecture (recommended)

Two common patterns:

### A — Single VPS / Docker host (“all on one box”)

- Reverse proxy (**Caddy**, **nginx**, **Traefik**): TLS, gzip, upstream to API `:3000`.
- Postgres + Redis + MinIO (or point `MINIO_*` at hosted S3) on the same host or LAN.
- Build each Vite app with production `VITE_API_URL=https://your-api-host/api` (no `/api/v1` in the URL base—the clients append paths as implemented).
- **Suitable for** demos, single location, modest traffic.

### B — Split services (closest to cloud best practice)

- **API**: Container service or PaaS (Fly.io, Railway, ECS, Cloud Run*, App Service…) with **`PORT`** wired to the listener.
- **PostgreSQL**: Managed (`DATABASE_URL`).
- **Redis**: Managed (`REDIS_URL`).
- **Object storage**: S3-compatible bucket; set env vars accordingly (MinIO vars map to SDK-style endpoints in app config—align with provider docs).
- **Front ends**: Static hosting (**S3 + CloudFront**, Azure Static Web Apps, Netlify, Vercel…) **or** nginx serving `dist/` next to API.

\* **Serverless note:** Platforms that freeze the process between requests **break WebSockets** unless you use a separate always-on websocket tier or refactor to a websocket-friendly host. Prefer a **persistent** Node workload for this API if you rely on **`/ws`**.

---

## Networking & security checklist

| Concern | What to configure |
|---------|-------------------|
| **TLS** | Valid certificates on API and every SPA domain; production enables `Strict-Transport-Security` headers in `main.ts`. |
| **CORS / Socket.IO origins** | `CORS_ORIGINS` (+ optional `WS_CORS_ORIGINS`) lists every SPA origin (`https://…`). |
| **Rate limiting** | Defaults tighten in production; Redis improves accuracy across instances (`ENABLE_RATE_LIMIT`, `RATE_LIMIT_*` in env if you customize). |
| **Stripe** | Dashboard webhook URL **`https://<api-host>/api/v1/payments/webhook/stripe`** (path as implemented in the API); see **[PAYMENT_SETUP.md](./PAYMENT_SETUP.md)**. |
| **PayPal / hosted returns** | `returnUrl` / `cancelUrl` must point at your live **web-online** (or SPA) HTTPS URLs—not localhost. |
| **Square Web Payments SDK** | Application must allow your **web-online** HTTPS origin in the Square Developer dashboard. |

---

## Build-time vs runtime configuration (front ends)

Each Vite app reads **`import.meta.env.VITE_*` at **build** time**. For production:

```text
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

Rebuild and redeploy the static assets when URLs change.

**Staff maps (optional):** `VITE_GOOGLE_MAPS_API_KEY` where delivery maps are used.

---

## Local port reference (development only)

| App | Default dev port (typical) |
|-----|-----------------------------|
| API | 3000 |
| web-admin | 3001 |
| web-online | **3002** (`web-online/vite.config.ts`) |
| web-kds | **3003** |
| web-packing | **3004** |
| web-osdu | **3005** |
| web-driver | **3006** |

Compose includes `web-online`; walk-in customer screens reuse `web-online` station URLs such as `/menu?channel=walkin&station=front-1`.

---

## Capacity & sizing (orientation only)

For a **single store** POS + KDS + online ordering prototype, **1 vCPU / 2 GB RAM** for the API and a small Postgres instance are often enough, with HTTPS and Postgres on persistent volumes or managed disks.

Growth levers:

- Larger Postgres tier, connection pooling (**PgBouncer**).
- Dedicated Redis cluster for rate limiting and pub/sub.
- Multiple API replicas only after verifying **sticky sessions or Socket.IO Redis adapter** for real-time scaling (advanced; current stack favors a single websocket-capable Node process unless you extend it).

---

## Related docs

- **[README.md](./README.md)** — Quick start and app list  
- **[TESTING.md](./TESTING.md)** — Local verification  
- **[PAYMENT_SETUP.md](./PAYMENT_SETUP.md)** — Stripe / PayPal / Square URLs and secrets  
- **API env template:** [`api/.env.example`](./api/.env.example)  
