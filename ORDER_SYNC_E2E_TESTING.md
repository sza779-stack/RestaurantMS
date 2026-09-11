# Order Sync Across Modules - Implementation & E2E Testing Guide

## ✅ Implementation Summary

All modules now have real-time order synchronization via WebSocket. Here's what was implemented:

### Backend (API) Changes

#### 1. Enhanced WebSocket Gateway (`websocket.gateway.ts`)
- Supports multiple room subscriptions:
  - `store:{storeId}` - For POS/web-admin
  - `kitchen:{storeId}` - For Kitchen Display (KDS)
  - `packing:{storeId}` - For Packing Station
  - `osdu:{storeId}` - For Order Status Display
  - `drivers:{storeId}` - For Driver app
  - `company:{companyId}` - For company-wide broadcasts

#### 2. Orders Service WebSocket Integration (`orders.service.ts`)
- **Order Creation**: Broadcasts `order:created` to store and kitchen rooms
- **Status Updates**: Broadcasts `order:status-changed` with room routing:
  - `COOKING/IN_OVEN` → Kitchen room
  - `READY` → Kitchen + Packing rooms
  - `PACKED` → OSDU room
  - `OUT_FOR_DELIVERY` → Drivers room

### Frontend Modules WebSocket Status

| Module | Port | WebSocket Events | Status |
|--------|------|------------------|--------|
| web-admin (POS) | 3001 | `order:created`, `order:status-changed` | ✅ Connected |
| web-kds (Kitchen) | 3011 | `kitchen:new-order`, `order:status-changed` | ✅ Connected |
| web-packing | 3003 | `packing:order-ready`, `order:status-changed` | ✅ Connected |
| web-osdu (Status) | 3004 | `osdu:order-ready` | ✅ Connected |
| web-kiosk | 3005 | Emits `order:created` | ✅ Connected |

---

## 🔄 Order Flow (E2E Testing Scenarios)

### Scenario 1: POS Order → Kitchen → Packing → OSDU

```
┌─────────────┐    order:created    ┌─────────────┐
│  web-admin  │ ───────────────────>│   web-kds   │
│   (POS)     │                     │  (Kitchen)  │
└─────────────┘                     └─────────────┘
                                           │
                                           │ order:status-update (IN_PROGRESS)
                                           ▼
                                    ┌─────────────┐
                                    │   PENDING   │
                                    │   Column    │
                                    └─────────────┘
                                           │
                                           │ order:status-update (IN_OVEN)
                                           ▼
                                    ┌─────────────┐
                                    │   IN_OVEN   │
                                    │   Column    │
                                    └─────────────┘
                                           │
                                           │ order:status-update (READY)
                                           ▼
┌─────────────┐    packing:order-ready   ┌─────────────┐
│ web-packing │ <─────────────────────────│   web-kds   │
│  (Packer)   │                          │  (Kitchen)  │
└─────────────┘                          └─────────────┘
       │
       │ order:status-update (PACKED)
       ▼
┌─────────────┐
│   web-osdu  │
│ (Customer   │
│   Display)  │
└─────────────┘
```

### Scenario 2: Kiosk Order → Kitchen

```
┌─────────────┐    POST /api/v1/orders    ┌─────────────┐
│  web-kiosk  │ ────────────────────────> │     API     │
│  (Customer) │                           │   Server    │
└─────────────┘                           └─────────────┘
                                                   │
                                                   │ Broadcast
                                                   │ order:created
                                                   ▼
┌─────────────┐                     ┌─────────────┐
│  web-admin  │ <───────────────────│     API     │
│   (POS)     │   order:created     │   Server    │
└─────────────┘                     └─────────────┘
                                           │
                                           │ Broadcast
                                           │ kitchen:new-order
                                           ▼
                                    ┌─────────────┐
                                    │   web-kds   │
                                    │  (Kitchen)  │
                                    └─────────────┘
```

---

## 🧪 E2E Testing Steps

### Prerequisites
All services should be running:
```bash
# API Server (Port 3000)
cd api && npm run start:dev

# POS (Port 3001)
cd web-admin && npm run dev

# Kitchen Display (Port 3011)
cd web-kds && npm run dev

# Packing Station (Port 3003)
cd web-packing && npm run dev

# Order Status Display (Port 3004)
cd web-osdu && npm run dev

# Kiosk (Port 3005)
cd web-kiosk && npm run dev
```

### Test 1: Create Order from POS → Verify Kitchen Receives

1. **Open web-admin** (http://localhost:3001)
   - Login and select store
   - Add items to cart
   - Click "Pay" → "Send to Kitchen"

2. **Verify web-kds** (http://localhost:3011)
   - Order should appear in "PENDING" column
   - Check console: `🍳 KDS New order: {...}`

3. **Expected**: Order visible in Kitchen within 1-2 seconds

### Test 2: Kitchen Status Updates → Verify Packing Station

1. **In web-kds**, click "START COOKING" on the order
   - Order moves to "COOKING" column

2. **Click "IN OVEN"**
   - Order moves to "IN OVEN" column
   - Oven timer starts

3. **Click "MARK READY"**
   - Order disappears from Kitchen
   - **Check web-packing** (http://localhost:3003)
   - Order should appear in "Ready to Pack" list
   - Console: `📦 Packing order ready: {...}`

### Test 3: Packing Complete → Verify OSDU

1. **In web-packing**, click on the order
2. **Click "MARK PACKED"**
   - Order disappears from Packing
   - **Check web-osdu** (http://localhost:3004)
   - Order should appear as "Ready!"
   - Console: `📱 OSDU order ready: {...}`

### Test 4: Kiosk Order → Verify Kitchen

1. **Open web-kiosk** (http://localhost:3005)
   - Click "START ORDER"
   - Add items to cart
   - Click "Pay with Card"

2. **Verify web-kds**
   - Order should appear in Kitchen
   - Order number format: `K-{timestamp}`

### Test 5: Status Sync Across All Modules

Create an order and track it through all statuses:

| Action | web-admin | web-kds | web-packing | web-osdu |
|--------|-----------|---------|-------------|----------|
| Create Order | Shows in orders | Shows in PENDING | - | - |
| Start Cooking | Status: IN_PROGRESS | Moves to COOKING | - | - |
| Put in Oven | Status: IN_OVEN | Moves to IN_OVEN | Shows oven icon | - |
| Mark Ready | Status: READY | Disappears | Shows in Ready | - |
| Mark Packed | Status: PACKED | - | Disappears | Shows READY |
| Out for Delivery | Status: OUT_FOR_DELIVERY | - | - | Shows SERVED |

---

## 📊 WebSocket Event Reference

### Events Emitted by Backend

| Event | Payload | Description |
|-------|---------|-------------|
| `order:created` | Order object | New order created |
| `order:status-changed` | `{orderId, status, timestamp}` | Order status updated |
| `kitchen:new-order` | Order object | New order for kitchen |
| `packing:order-ready` | `{orderId, timestamp}` | Order ready to pack |
| `osdu:order-ready` | `{orderId, timestamp}` | Order ready for pickup |
| `kitchen:oven-started` | `{orderId, timestamp}` | Order put in oven |
| `kitchen:item-completed` | `{orderId, itemId}` | Item completed |

### Events Emitted by Frontend

| Event | Payload | Description |
|-------|---------|-------------|
| `store:subscribe` | `storeId` | Subscribe to store updates |
| `kds:subscribe` | `{storeId, station?}` | Subscribe to kitchen |
| `packing:subscribe` | `storeId` | Subscribe to packing |
| `osdu:subscribe` | `storeId` | Subscribe to OSDU |
| `order:created` | Order object | Create new order |
| `order:status-update` | `{orderId, storeId, status}` | Update status |

---

## 🔧 Troubleshooting

### Issue: Orders not appearing in Kitchen

1. Check browser console for WebSocket connection errors
2. Verify API server is running on port 3000
3. Check that web-kds subscribed to `kitchen:{storeId}`
4. Look for `🍳 KDS New order:` log in console

### Issue: Status updates not syncing

1. Verify the `storeId` is being passed in status updates
2. Check network tab for WebSocket messages
3. Ensure backend is broadcasting to correct rooms

### Issue: WebSocket connection refused

1. Check CORS configuration in `websocket.gateway.ts`
2. Verify `VITE_API_URL` environment variable
3. Ensure API server `/ws` namespace is accessible

---

## 📁 Files Modified

### Backend
- `api/src/modules/websocket/websocket.gateway.ts` - WebSocket event handlers
- `api/src/modules/orders/orders.service.ts` - WebSocket integration
- `api/src/modules/orders/orders.controller.ts` - StoreId in status update
- `api/src/modules/orders/orders.module.ts` - WebSocketModule import

### Frontend
- `web-admin/src/hooks/useWebSocket.ts` - Enhanced WebSocket hook
- `web-admin/src/components/WebSocketProvider.tsx` - NEW: WebSocket provider
- `web-admin/src/App.tsx` - Added WebSocketProvider

All other modules (web-kds, web-packing, web-osdu, web-kiosk) already had WebSocket implementations.

---

## ✅ Build Status

```
✅ API Server        - Built and Running (Port 3000)
✅ web-admin (POS)   - Built (Port 3001)
✅ web-kds (Kitchen) - Built (Port 3011)
✅ web-packing       - Built (Port 3003)
✅ web-osdu (Status) - Built (Port 3004)
✅ web-kiosk         - Built (Port 3005)
```

---

## 🚀 Next Steps

1. Start all services using the commands in Prerequisites
2. Open each module in a separate browser tab
3. Follow the E2E Testing Steps above
4. Monitor browser consoles for WebSocket events
5. Verify order flow through all modules

All orders now sync in real-time across the entire restaurant platform! 🎉
