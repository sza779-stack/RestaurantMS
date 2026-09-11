import assert from 'node:assert/strict';

type AnyRecord = Record<string, any>;

type SocketLike = {
  connected: boolean;
  on: (event: string, cb: (...args: any[]) => void) => void;
  emit: (event: string, payload?: any, cb?: (...args: any[]) => void) => void;
  disconnect: () => void;
};

const API_URL = process.env.API_URL || 'http://localhost:3000';
const STORE_ID = process.env.STORE_ID || 'default-store';

const KDS_STATUS_QUERY =
  'PENDING,IN_KITCHEN,PREPARING,IN_PROGRESS,IN_OVEN,READY,PREPARED';
const PACKING_STATUS_QUERY =
  'IN_PROGRESS,IN_KITCHEN,PREPARING,BAKING,IN_OVEN,READY,PREPARED,PACKING';

const terminalUiStatuses = new Set([
  'PACKED',
  'READY_FOR_PICKUP',
  'READY_TO_SERVE',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body as T;
}

async function resolveSocketIoClient(): Promise<((url: string, opts: any) => SocketLike) | null> {
  const candidates = [
    'socket.io-client',
    '../web-kds/node_modules/socket.io-client',
    '../web-packing/node_modules/socket.io-client',
    '../../web-kds/node_modules/socket.io-client',
    '../../web-packing/node_modules/socket.io-client',
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(candidate);
      if (mod?.io) return mod.io;
    } catch {
      // try next
    }
  }
  return null;
}

async function waitFor(
  check: () => boolean,
  timeoutMs: number,
  label: string,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (check()) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${label}`);
}

async function updateStatus(orderId: string, status: string) {
  await http(`/api/v1/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, storeId: STORE_ID }),
  });
}

async function getOrder(orderId: string): Promise<AnyRecord> {
  return http<AnyRecord>(`/api/v1/orders/${orderId}`);
}

async function getOrdersByStatus(statusList: string): Promise<AnyRecord[]> {
  return http<AnyRecord[]>(
    `/api/v1/orders?storeId=${encodeURIComponent(STORE_ID)}&status=${encodeURIComponent(statusList)}&includeFuture=false`,
  );
}

function isActiveInKds(order: AnyRecord): boolean {
  if (!order) return false;
  if (order.packedAt || order.completedAt || order.cancelledAt || order.deliveredAt) return false;
  return !terminalUiStatuses.has(String(order.status || '').toUpperCase());
}

function isActiveInPacking(order: AnyRecord): boolean {
  if (!order) return false;
  if (order.packedAt || order.completedAt || order.cancelledAt || order.deliveredAt) return false;
  return !terminalUiStatuses.has(String(order.status || '').toUpperCase());
}

async function main() {
  console.log(`[Lifecycle E2E] API: ${API_URL} | Store: ${STORE_ID}`);

  const socketIo = await resolveSocketIoClient();
  const useSockets = Boolean(socketIo);
  if (!useSockets) {
    console.log('[Lifecycle E2E] socket.io-client not found locally, running HTTP lifecycle checks only.');
  }

  const kdsEvents: Array<{ event: string; payload: any }> = [];
  const packingEvents: Array<{ event: string; payload: any }> = [];
  let kdsSocket: SocketLike | null = null;
  let packingSocket: SocketLike | null = null;

  if (useSockets && socketIo) {
    kdsSocket = socketIo(`${API_URL}/ws`, {
      transports: ['websocket'],
      auth: { token: 'kds-token' },
    });
    packingSocket = socketIo(`${API_URL}/ws`, {
      transports: ['websocket'],
      auth: { token: 'packing-token' },
    });

    kdsSocket.on('kitchen:new-order', (payload: any) => {
      kdsEvents.push({ event: 'kitchen:new-order', payload });
    });
    kdsSocket.on('order:status-changed', (payload: any) => {
      kdsEvents.push({ event: 'order:status-changed', payload });
    });
    kdsSocket.on('order:status:changed', (payload: any) => {
      kdsEvents.push({ event: 'order:status:changed', payload });
    });
    packingSocket.on('packing:order-ready', (payload: any) => {
      packingEvents.push({ event: 'packing:order-ready', payload });
    });
    packingSocket.on('order:status-changed', (payload: any) => {
      packingEvents.push({ event: 'order:status-changed', payload });
    });
    packingSocket.on('order:status:changed', (payload: any) => {
      packingEvents.push({ event: 'order:status:changed', payload });
    });

    await waitFor(() => Boolean(kdsSocket?.connected && packingSocket?.connected), 8000, 'socket connections');
    kdsSocket.emit('kds:subscribe', { storeId: STORE_ID });
    packingSocket.emit('packing:subscribe', STORE_ID);
    await sleep(200);
  }

  const ts = Date.now();
  const createPayload = {
    storeId: STORE_ID,
    type: 'PICKUP',
    customerName: `Lifecycle E2E ${ts}`,
    customerPhone: '(555) 123-0000',
    items: [
      {
        productId: `lifecycle-test-product-${ts}`,
        productName: 'Lifecycle Test Pizza',
        quantity: 1,
        unitPrice: 12.5,
        modifiers: [],
        kitchenStation: 'PIZZA',
      },
    ],
    subtotal: 12.5,
    taxAmount: 1,
    total: 13.5,
    sendToKitchen: true,
    payments: [],
  };

  const created = await http<AnyRecord>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload),
  });
  assert.ok(created.id, 'order id should exist');
  // New orders always start at PENDING and require explicit advancement through the KDS,
  // even when sendToKitchen=true. This avoids accidentally double-firing the kitchen
  // for orders that are immediately voided/edited at the POS.
  assert.equal(created.status, 'PENDING', 'new orders must start at PENDING');
  const orderId = created.id as string;
  console.log(`[Lifecycle E2E] Created order ${created.orderNumber} (${orderId}) status=${created.status}`);

  const kdsOrdersAfterCreate = await getOrdersByStatus(KDS_STATUS_QUERY);
  assert.ok(
    kdsOrdersAfterCreate.some((o) => o.id === orderId),
    'order must be visible in KDS status query after create',
  );

  if (useSockets) {
    await waitFor(
      () => kdsEvents.some((e) => String(e?.payload?.id || e?.payload?.orderId) === orderId),
      8000,
      'KDS new-order/status event after create',
    );
  }

  await updateStatus(orderId, 'PREPARING');
  assert.equal((await getOrder(orderId)).status, 'PREPARING');

  await updateStatus(orderId, 'BAKING');
  assert.equal((await getOrder(orderId)).status, 'BAKING');

  // Item-level: verify that marking every item COMPLETED auto-advances the order to PACKING.
  const orderAfterBake = await getOrder(orderId);
  for (const item of orderAfterBake.items as Array<{ id: string }>) {
    await http(`/api/v1/orders/${orderId}/items/${item.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PREPARED', storeId: STORE_ID }),
    });
  }
  const afterAllItemsCompleted = await getOrder(orderId);
  assert.equal(
    afterAllItemsCompleted.status,
    'PACKING',
    'order must auto-advance to PACKING once every item is completed',
  );

  // Also verify the order-level status alias (PREPARED -> PACKING) still works for clients
  // that prefer to advance the entire order in one shot.
  await updateStatus(orderId, 'PREPARED');
  const afterPrepared = await getOrder(orderId);
  assert.equal(afterPrepared.status, 'PACKING', 'PREPARED should map to backend PACKING');

  const packingOrders = await getOrdersByStatus(PACKING_STATUS_QUERY);
  assert.ok(
    packingOrders.some((o) => o.id === orderId),
    'order must be visible in packing status query after kitchen prepared',
  );

  if (useSockets) {
    await waitFor(
      () => packingEvents.some((e) => String(e?.payload?.id || e?.payload?.orderId) === orderId),
      8000,
      'Packing ready/status event after PREPARED',
    );
  }

  await updateStatus(orderId, 'READY_FOR_PICKUP');
  const finalOrder = await getOrder(orderId);
  assert.equal(finalOrder.status, 'READY', 'READY_FOR_PICKUP currently maps to backend READY');
  assert.ok(finalOrder.packedAt, 'packedAt should be set after READY_FOR_PICKUP');

  const kdsAfterHandoff = (await getOrdersByStatus(KDS_STATUS_QUERY)).find((o) => o.id === orderId);
  const packingAfterHandoff = (await getOrdersByStatus(PACKING_STATUS_QUERY)).find((o) => o.id === orderId);
  assert.equal(isActiveInKds(kdsAfterHandoff), false, 'handoff order must be hidden from active KDS queue');
  assert.equal(isActiveInPacking(packingAfterHandoff), false, 'handoff order must be hidden from active Packing queue');

  console.log('[Lifecycle E2E] PASS: Order lifecycle sync validated for KDS and Packing.');

  if (kdsSocket) kdsSocket.disconnect();
  if (packingSocket) packingSocket.disconnect();
}

main().catch((error) => {
  console.error('[Lifecycle E2E] FAIL:', error?.message || error);
  process.exit(1);
});
