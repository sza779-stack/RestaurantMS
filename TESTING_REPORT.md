# E2E Audit & UX Improvement Report

> **Date:** May 2026  
> **Scope:** Code-level end-to-end audit of all 8 apps (`api`, `web-admin`, `web-kds`, `web-packing`, `web-osdu`, `web-online`, `web-kiosk`, `web-driver`) plus the existing E2E harness, followed by surgical fixes for high-impact defects and UX issues.
>
> A **runtime** browser-driven E2E pass was not performed — that requires Docker + Postgres + Redis + MinIO + 7 dev servers running concurrently, which is environment-specific. Instead, every user-facing flow was traced through its source files and the existing `scaffold/api/test/order-lifecycle.e2e.ts` harness was repaired so it can be run by anyone with a live stack via `node --import tsx test/order-lifecycle.e2e.ts`.

---

## 1. How we tested

| Layer | Method | Result |
|------|--------|--------|
| API type safety | `npx tsc --noEmit` in `scaffold/api` | ✅ clean |
| Backend business logic | Read-through audit of `OrdersService`, `WebSocketGateway`, `AuthService`, `MenuService`, `FinanceService` | Issues found, see §3 |
| Existing E2E harness | Read `test/order-lifecycle.e2e.ts` | Stale; **fixed** |
| `web-admin` (POS) type safety | `npx tsc --noEmit` | Was failing 13 errors — **fixed**, now clean |
| All other web apps type safety | `npx tsc --noEmit` for each | All clean |
| User flows | Code walkthrough of each App/page in each frontend | 26 issues catalogued, top 10 fixed |

---

## 2. Defects & UX issues that were fixed

### 2.1 Backend (`scaffold/api`)

#### 🐛 `OrdersService.normalizeItemStatus` rejected the vocabulary every client used  
- **Symptom:** When KDS / Packing / Online posted an item to `PUT /orders/:id/items/:itemId/status` with `PREPARED`, `ASSEMBLED`, or `PACKED`, the service would either bail out with `Invalid item status` or — worse — write a value that violates the Prisma `ItemStatus` enum (`PENDING|IN_PROGRESS|COMPLETED`), causing a runtime Prisma error.
- **Knock-on:** Auto-advance to `PACKING` (when every item is finished) was checking for `PREPARED|ASSEMBLED|PACKED|COMPLETED` against item statuses that could only ever be `PENDING|IN_PROGRESS|COMPLETED`, so the fan-out from KDS to the Packing screen was silently broken.
- **Fix:** `normalizeItemStatus` now maps every alias (`PREPARED`, `PACKED`, `READY`, `DONE`, `ASSEMBLED`, `COOKING`, …) to a canonical Prisma enum value, and the auto-advance check looks for `COMPLETED` only.
- **Files:** `scaffold/api/src/modules/orders/orders.service.ts`

#### 🐛 `order-lifecycle.e2e.ts` was asserting against the *old* lifecycle  
- **Symptom:** The harness asserted `created.status === 'PREPARING'` after a create-with-`sendToKitchen=true`, but the service was changed months ago to always start at `PENDING` (so the kitchen isn't double-fired for orders that get edited at the POS). The test was guaranteed to fail on every run.
- **Fix:** Updated the assertion to `PENDING`, and added a new step that exercises the auto-advance path (mark every item COMPLETED → expect order at `PACKING`) so we lock the bug fix above into a regression test.
- **Files:** `scaffold/api/test/order-lifecycle.e2e.ts`

### 2.2 `web-admin` (POS / Settings)

#### 🐛 13 TypeScript errors — the build was broken  
- `WebSocketProvider`, `GeneralSettings`, `GlobalInsights`, `UserManagement`, `SettingsLayout`, `StockManagement` all referenced `UserStore.settings`, `UserStore.operatingHours`, `UserStore.companyId`, and `AuthenticatedUser.companyId` — fields that the central `useStore` type didn't declare. Code referenced `user?.role?.name || user?.role` even though `UserRole` was always an object.
- **Fix:** Expanded the `UserStore` and `AuthenticatedUser` type contracts to match what the API actually returns (and to match what the rest of the dashboard already assumes). Tightened the role lookup in `SettingsLayout`.
- **Files:** `scaffold/web-admin/src/hooks/useStore.ts`, `scaffold/web-admin/src/pages/settings/SettingsLayout.tsx`

#### 🐛 Auth state could rehydrate as "logged-in but no token"  
- The Zustand store persisted `isAuthenticated: true` even when the underlying `token` was `null`/expired, leaving a brief window where the app would render protected routes only to bounce on the first 401. Logout removed `restaurant-store` from `localStorage` *while* the persist middleware was about to rewrite it on the next state change, making the wipe non-deterministic.
- **Fix:** `isAuthenticated` is now derived from `(user && token)` on rehydrate, never persisted directly. `setStore` accepts a partial update and merges with the existing store so the WebSocket bootstrap can refine `id` without trampling other fields. `logout` lets the persist middleware do its job.
- **Files:** `scaffold/web-admin/src/hooks/useStore.ts`

### 2.3 `web-packing`

#### 🐛 The "PUSH TO PACK" button had no `onClick`  
- When the oven progress hit 100%, the green "PUSH TO PACK" button rendered, but the JSX had no handler at all — clicking it did nothing.
- **Fix:** Wired it to the existing `handlePackComplete(selectedOrder.id)` flow, with a `disabled` state + tooltip when the packing checklist isn't complete (the existing `isChecklistComplete` rule).
- **Files:** `scaffold/web-packing/src/App.tsx`

#### 🐛 Server errors collapsed to "Failed to update order status"  
- Both the initial fetch and `PUT /orders/:id/status` swallowed the server's actual error message, so 400/403/500s looked identical to a generic network blip.
- **Fix:** Added an `extractServerErrorMessage(response)` helper that handles the NestJS `{ message: string | string[] }` shape, plain text, and unparseable bodies. All toasts now show `"Could not update order: <real reason>"`. The initial fetch path now renders an error toast when the response is non-OK (it used to silently keep showing the loading state).
- **Files:** `scaffold/web-packing/src/App.tsx`

### 2.4 `web-driver`

#### 🐛 `markPickedUp` only emitted a WebSocket event  
- If the socket dropped between accept and pickup (common on phones in basements / parking lots), the POS never saw the order leave the store and the driver UI silently stayed in the wrong state. There was no error toast either.
- **Fix:** `markPickedUp` now does an authoritative `PUT /orders/:id/status → OUT_FOR_DELIVERY` first, then keeps the socket emit as a low-latency hint. Failures surface in a toast and abort the local state change.
- **Files:** `scaffold/web-driver/src/App.tsx`

#### 🐛 Online/Offline toggle silently failed  
- Both `handleGoOnline` and `handleGoOffline` only `console.error`'d on failure. The driver thought the toggle worked while dispatch still saw them as offline (or vice versa).
- **Fix:** Both handlers check `response.ok`, surface server failures via the existing toast bus, and only flip the local `isOnline` state after the API confirms.
- **Files:** `scaffold/web-driver/src/App.tsx`

### 2.5 `web-online` (customer site)

#### 🐛 `showToast` only logged to the console  
- `react-toastify` was already imported and mounted at the bottom of `App`, but the internal `showToast` helper wired into checkout / order tracking just `console.log`'d — customers never saw confirmation, errors, or the live "Menu updated in real-time!" notice.
- **Fix:** Bridged the helper to `react-toastify`'s `toast.success/error/info` with a 5s autoclose for errors and 3s for everything else. Console fallback is preserved for SSR/test contexts.
- **Files:** `scaffold/web-online/src/App.tsx`

#### 🐛 Order history showed "⏳ Pending" for every paid card order  
- `OrdersPage` was checking `order.payments?.[0]?.status === 'PAID'`, but the backend `PaymentStatus` enum is `PENDING|PROCESSING|COMPLETED|FAILED|REFUNDED` — `'PAID'` is never written. Every successful card/tap order looked unpaid in the customer's order history.
- **Fix:** Switched to a small status mapper that recognises `COMPLETED → ✅ Paid`, `FAILED → ❌ Payment failed`, `REFUNDED → ↩️ Refunded`, otherwise pending.
- **Files:** `scaffold/web-online/src/pages/OrdersPage.tsx`

### 2.6 `web-osdu` (customer-facing TV)

#### 🐛 Fetch failures were invisible from across the lobby  
- If the API was down, OSDU just stopped updating — no banner, no badge, no log on screen.
- **Fix:** Added a `lastFetchError` state and a high-contrast red `AlertTriangle` banner directly under the header with a "Retry now" button. Banner clears as soon as the next sync succeeds.
- **Files:** `scaffold/web-osdu/src/App.tsx`

#### 🐛 Unknown statuses were collapsed to "Received"  
- Any order status that wasn't explicitly listed (e.g. `BAKING`, `CONFIRMED`, `OUT_FOR_DELIVERY`) was rendered as the yellow "Order Received" tile, which is actively wrong messaging for customers.
- **Fix:** `mapOrderStatus` now returns `null` for genuinely unknown statuses; the order is dropped from the customer display rather than being mis-classified. Added explicit handling for `BAKING`, `CONFIRMED`, `PAID`, `OUT_FOR_DELIVERY`, `PACKING`. All call sites filter the nulls out.
- **Files:** `scaffold/web-osdu/src/App.tsx`

#### 🐛 Sound toggle didn't change icon when muted  
- Always rendered `Volume2` regardless of state, just changing the colour. From across a lobby that read as "still on, just dimmer".
- **Fix:** Imports `VolumeX` and renders it (in red) when muted, with proper `aria-pressed` and a clearer tooltip.
- **Files:** `scaffold/web-osdu/src/App.tsx`

---

## 3. Issues identified but **not yet fixed** (recommended next-up)

| # | App | Issue | Why it matters |
|---|-----|-------|----------------|
| 1 | `web-online` | Tax (8%) and delivery fee ($3.99) are hardcoded in `App.tsx` lines 172-173 | Customer total disagrees with the POS for any store with a different tax rate. Should pull from `currentStore.taxRate` / `deliveryFee` |
| 2 | `web-online` | Checkout's "Send to Kitchen" CTA navigates to the menu | The button label promises one thing and does another — confusing for both staff testing and customers |
| 3 | `web-online` | Delivery address validation only checks `street`, ignores city/state/zip | Drivers can be dispatched to half-addresses |
| 4 | `web-driver` | "Done" tab is permanently empty — completed orders are removed from `orders` and never accumulated into a separate `completedOrders` array | Drivers can't audit their day's work |
| 5 | `web-driver` | Driver session is a raw JSON blob in localStorage with no expiry | Shared tablet leaks the previous shift's identity until manual logout |
| 6 | `web-driver` | Hardcoded 30s polling + a fake 500ms `setTimeout` for "route optimization" | Looks unprofessional; should be honest UI ("Driver-side routing not configured") |
| 7 | `web-packing` | Packing checklist is React state only — refresh wipes mid-shift progress | A page reload during a busy lunch service costs progress on every open order |
| 8 | `web-packing` | Hardcoded "FRESH PIZZA" / "(555) 123-4567" on printed receipts | Wrong business info on customer-facing slips when re-branded |
| 9 | `web-osdu` | Delivery-visibility toggle hits the API on every click with no confirmation | Single mis-click silently changes a store-wide setting |
| 10 | `web-osdu` | Boot-time `localStorage` read can override the server-side setting | Source-of-truth confusion when the same key is touched from POS settings |
| 11 | `api/finance` | `FinanceService.getJournalEntries` takes `companyId` but never filters on it; `createJournalEntry` doesn't validate that debits == credits | Multi-tenant data leak risk and unbalanced books |
| 12 | `api/orders` | `getPublicStores` returns only `{id, name, code}` — missing address/phone/hours that public landing pages need | Online store-locator pages have to fetch each store individually |
| 13 | `web-admin` POS | Suspended orders are stored in `localStorage` per-browser only | Cashier shift change loses suspended tickets |
| 14 | All web apps | No central `apiFetch` wrapper — each app re-implements `if (!response.ok) { ... }` differently | Inconsistent error UX across the platform; refactor candidate |

---

## 4. How to actually run the E2E lifecycle test

The repaired harness assumes the API is up:

```powershell
# 1. Start infra + API
cd scaffold
.\start-all.ps1   # or just: cd scaffold/api && npm run start:dev

# 2. (Optional) ensure socket.io-client is resolvable so the test exercises sockets too
#     The harness already falls back to HTTP-only when the package is missing.

# 3. Run the harness
cd scaffold/api
$env:API_URL="http://localhost:3000"
$env:STORE_ID="<your-default-store-id>"
node --import tsx test/order-lifecycle.e2e.ts
```

Expected output ends with:

```
[Lifecycle E2E] PASS: Order lifecycle sync validated for KDS and Packing.
```

---

## 5. Files changed in this audit

```
scaffold/api/src/modules/orders/orders.service.ts
scaffold/api/test/order-lifecycle.e2e.ts
scaffold/web-admin/src/hooks/useStore.ts
scaffold/web-admin/src/pages/settings/SettingsLayout.tsx
scaffold/web-online/src/App.tsx
scaffold/web-online/src/pages/OrdersPage.tsx
scaffold/web-osdu/src/App.tsx
scaffold/web-packing/src/App.tsx
scaffold/web-driver/src/App.tsx
documentation/RECREATION_PROMPTS.md     (already updated in the previous task)
TESTING_REPORT.md                        (this file, new)
```

Every changed app type-checks cleanly with `npx tsc --noEmit`.
