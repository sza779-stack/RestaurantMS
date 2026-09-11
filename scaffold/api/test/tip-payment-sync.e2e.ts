/**
 * Validates driver tips vs payment totals:
 * - POS-style order: embedded Payment.amount must include tip (matches order.total).
 * - Delivery + prepaid tip online + driver cash tip: separate CASH payment row + totals.
 *
 * Run (API must be up, DB migrated + seeded): npm run test:e2e:tip-sync
 */
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

type AnyRec = Record<string, any>;

async function http<T = AnyRec>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // leave string
  }
  if (!res.ok) {
    const err = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`HTTP ${res.status} ${path}: ${err}`);
  }
  return body as T;
}

function sumCompletedPayments(order: AnyRec): number {
  const list = Array.isArray(order?.payments) ? order.payments : [];
  return list
    .filter((p: AnyRec) => String(p.status).toUpperCase() === 'COMPLETED')
    .reduce((acc: number, p: AnyRec) => acc + Number(p.amount || 0), 0);
}

async function main() {
  console.log(`\n[tip-payment-sync] API ${API_URL}\n`);

  const stores = await http<AnyRec[]>('/api/v1/orders/public/stores');
  assert.ok(Array.isArray(stores) && stores.length > 0);
  const storeId = stores[0].id as string;

  const products = await http<AnyRec[]>(
    `/api/v1/menu/products?storeId=${encodeURIComponent(storeId)}`,
  );
  const product = products.find((p) => p?.isActive !== false) || products[0];
  assert.ok(product?.id);
  const productId = product.id as string;

  const ts = Date.now();

  // --- 1) POS-style: tip on order must match single payment capture amount ---
  const subtotal = 12.99;
  const taxAmount = 1.0;
  const tipAmt = 5;
  const posTotal = subtotal + taxAmount + tipAmt;
  const posOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId,
      type: 'PICKUP',
      customerName: `TipSync POS ${ts}`,
      customerPhone: '(555) 777-1001',
      items: [
        {
          productId,
          productName: product.name || 'Test',
          quantity: 1,
          unitPrice: subtotal,
          modifiers: [],
          kitchenStation: 'PIZZA',
        },
      ],
      subtotal,
      taxAmount,
      tipAmount: tipAmt,
      total: posTotal,
      payments: [
        {
          amount: posTotal,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          cardLast4: '4242',
        },
      ],
    }),
  });

  assert.ok(Math.abs(Number(posOrder.total) - posTotal) < 0.02);
  assert.ok(Math.abs(Number(posOrder.tipAmount ?? 0) - tipAmt) < 0.02);
  const posPaid = sumCompletedPayments(posOrder);
  assert.ok(
    Math.abs(posPaid - Number(posOrder.total)) < 0.02,
    `POS tipped order: payments sum (${posPaid}) must equal order.total (${posOrder.total})`,
  );
  console.log('  ✓ POS embedded payment includes tip; sums match order.total');

  // --- 2) Delivery: prepaid tip in ONLINE charge + cash tip row at door ---
  const deliveryFee = 2;
  const prepaidTip = 4;
  const delSubtotal = 10;
  const delTax = 1;
  const initialTotal = delSubtotal + delTax + deliveryFee + prepaidTip;

  let driver = await prisma.driver.findFirst({ where: { storeId } });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        storeId,
        name: 'Tip-sync test driver',
        phone: `555${String(ts).slice(-7)}`,
        isActive: true,
      },
    });
  }

  const delOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId,
      type: 'DELIVERY',
      customerName: `TipSync Del ${ts}`,
      customerPhone: '(555) 777-1002',
      deliveryAddress: {
        street: '707 Test Blvd',
        city: 'Columbia',
        state: 'MD',
        zipCode: '21046',
      },
      items: [
        {
          productId,
          productName: product.name || 'Test',
          quantity: 1,
          unitPrice: delSubtotal,
          modifiers: [],
          kitchenStation: 'PIZZA',
        },
      ],
      subtotal: delSubtotal,
      taxAmount: delTax,
      deliveryFee,
      tipAmount: prepaidTip,
      total: initialTotal,
      payments: [
        {
          amount: initialTotal,
          method: 'ONLINE',
          status: 'COMPLETED',
          transactionId: `e2e:online:${ts}`,
        },
      ],
    }),
  });

  assert.ok(Math.abs(Number(delOrder.total) - initialTotal) < 0.02);

  await http(`/api/v1/drivers/${driver.id}/assign-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: delOrder.id, storeId }),
  });

  await http(`/api/v1/orders/${delOrder.id}/driver/delivered`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId: driver.id, storeId }),
  });

  const doorTip = 6.5;
  await http(`/api/v1/orders/${delOrder.id}/driver/record-tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driverId: driver.id,
      tipAmount: doorTip,
      emailReceipt: false,
    }),
  });

  const after = await prisma.order.findUnique({
    where: { id: delOrder.id },
    include: { payments: true },
  });
  assert.ok(after);
  const combinedTip = prepaidTip + doorTip;
  assert.ok(Math.abs(Number(after!.tipAmount) - combinedTip) < 0.02);
  const expectedGrand = initialTotal + doorTip;
  assert.ok(Math.abs(Number(after!.total) - expectedGrand) < 0.02);

  let paidSum = (after!.payments || [])
    .filter((p: any) => String(p.status).toUpperCase() === 'COMPLETED')
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  assert.ok(
    Math.abs(paidSum - Number(after!.total)) < 0.02,
    `delivery + tip: sum payments (${paidSum}) vs order.total (${after!.total})`,
  );

  const cashTipRows = (after!.payments || []).filter(
    (p: any) => String(p.method).toUpperCase() === 'CASH',
  );
  assert.ok(
    cashTipRows.some((p: any) => Math.abs(Number(p.amount) - doorTip) < 0.02),
    'Expected a CASH payment matching door tip amount',
  );
  console.log('  ✓ Driver cash tip is its own Payment; order.tipAmount and totals align');

  await prisma.$disconnect();
  console.log('\n[tip-payment-sync] PASS\n');
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
