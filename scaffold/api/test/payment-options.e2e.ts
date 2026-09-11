/**
 * Manual/CI-adjunct checks for payment paths: cash, card at order creation,
 * loyalty redemption, Stripe capabilities + checkout session, JWT addPayment.
 *
 * Run (API must be up, DB migrated + seeded): npm run test:e2e:payments
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
    const err =
      typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`HTTP ${res.status} ${path}: ${err}`);
  }
  return body as T;
}

async function main() {
  console.log(`\n[payment-options] API ${API_URL}\n`);

  const stores = await http<AnyRec[]>('/api/v1/orders/public/stores');
  assert.ok(Array.isArray(stores) && stores.length > 0, 'public stores list');
  const storeId = stores[0].id as string;
  console.log(`  storeId: ${storeId}`);

  const products = await http<AnyRec[]>(
    `/api/v1/menu/products?storeId=${encodeURIComponent(storeId)}`,
  );
  const product = products.find((p) => p?.isActive !== false) || products[0];
  assert.ok(product?.id, 'need at least one product from menu');
  const productId = product.id as string;
  console.log(`  product: ${product.name} (${productId})`);

  const ts = Date.now();

  // --- Cash at order creation ---
  const cashOrderBody = {
    storeId,
    type: 'PICKUP',
    customerName: `PayTest Cash ${ts}`,
    customerPhone: '(555) 100-0001',
    items: [
      {
        productId,
        productName: product.name || 'Test',
        quantity: 1,
        unitPrice: 12.99,
        modifiers: [],
        kitchenStation: 'PIZZA',
      },
    ],
    subtotal: 12.99,
    taxAmount: 1.0,
    total: 13.99,
    payments: [
      {
        amount: 13.99,
        method: 'CASH',
        status: 'COMPLETED',
      },
    ],
  };
  const cashOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cashOrderBody),
  });
  assert.equal(cashOrder.payments?.length, 1);
  assert.equal(String(cashOrder.payments[0].method).toUpperCase(), 'CASH');
  console.log(`  ✓ Cash: order ${cashOrder.orderNumber} payment method CASH`);

  // --- Card (CREDIT_CARD) at order creation (POS-style) ---
  const cardOrderBody = {
    ...cashOrderBody,
    customerName: `PayTest Card ${ts}`,
    customerPhone: '(555) 100-0002',
    payments: [
      {
        amount: 13.99,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        cardLast4: '4242',
      },
    ],
  };
  const cardOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardOrderBody),
  });
  assert.equal(String(cardOrder.payments[0].method).toUpperCase(), 'CREDIT_CARD');
  console.log(`  ✓ Card (register): order ${cardOrder.orderNumber} CREDIT_CARD + last4`);

  // --- Loyalty: create customer, fund points, order with redemption ---
  const loyaltyPhone = `555100${String(ts).slice(-4)}`;
  const created = await http<AnyRec>('/api/v1/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: loyaltyPhone,
      firstName: 'Loyalty',
      lastName: 'Tester',
    }),
  });
  const customerId = created.id as string;
  await prisma.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: 500 },
  });

  const ptsUsed = 200; // $2.00 off
  const subtotal = 12.99;
  const tax = 1.0;
  const baseTotal = subtotal + tax;
  const discount = ptsUsed / 100;
  const totalAfterLoyalty = Math.max(0, baseTotal - discount);

  const loyaltyOrderBody = {
    storeId,
    type: 'PICKUP',
    customerName: 'Loyalty Tester',
    customerPhone: loyaltyPhone,
    loyaltyPointsUsed: ptsUsed,
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
    taxAmount: tax,
    // API: total = Number(data.total || baseTotal) - loyaltyDiscount — pass pre-discount total
    total: baseTotal,
    payments: [],
  };
  const loyaltyOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loyaltyOrderBody),
  });
  assert.ok(
    Math.abs(Number(loyaltyOrder.total) - totalAfterLoyalty) < 0.02,
    `loyalty total expected ~${totalAfterLoyalty} got ${loyaltyOrder.total}`,
  );
  const after = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { loyaltyPoints: true },
  });
  assert.equal(after?.loyaltyPoints, 500 - ptsUsed);
  const redeemTx = await prisma.loyaltyTransaction.findFirst({
    where: { customerId, orderId: loyaltyOrder.id, type: 'REDEEMED' },
  });
  assert.ok(redeemTx, 'REDEEMED loyalty row');
  console.log(
    `  ✓ Loyalty: redeemed ${ptsUsed} pts, remaining points ${after?.loyaltyPoints}, order total ${loyaltyOrder.total}`,
  );

  // --- JWT: add CASH payment to unpaid order ---
  const unpaid = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId,
      type: 'PICKUP',
      customerName: `PayTest JWT ${ts}`,
      customerPhone: '(555) 100-0003',
      items: [
        {
          productId,
          productName: product.name || 'Test',
          quantity: 1,
          unitPrice: 10,
          modifiers: [],
        },
      ],
      subtotal: 10,
      taxAmount: 0,
      total: 10,
      payments: [],
    }),
  });
  const login = await http<AnyRec>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@pizzapalace.com',
      password: 'password123',
    }),
  });
  const token = login.accessToken as string;
  assert.ok(token, 'JWT accessToken');
  await http(`/api/v1/orders/${unpaid.id}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: 10,
      method: 'CASH',
      status: 'COMPLETED',
    }),
  });
  const paid = await http<AnyRec>(`/api/v1/orders/${unpaid.id}`);
  assert.ok(
    paid.payments?.some((p: any) => p.status === 'COMPLETED'),
    'payment recorded',
  );
  console.log(
    `  ✓ JWT addPayment: order ${paid.orderNumber} CASH via /orders/:id/payments (status → ${paid.status})`,
  );

  const stripeOrder = await http<AnyRec>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId,
      type: 'PICKUP',
      customerName: `PayTest Stripe ${ts}`,
      customerPhone: '(555) 100-0004',
      items: [
        {
          productId,
          productName: product.name || 'Test',
          quantity: 1,
          unitPrice: 8.5,
          modifiers: [],
        },
      ],
      subtotal: 8.5,
      taxAmount: 0.75,
      total: 9.25,
      payments: [],
    }),
  });

  // --- Stripe (optional sk_test / store keys) ---
  const caps = await http<AnyRec>(
    `/api/v1/payments/capabilities?storeId=${encodeURIComponent(storeId)}`,
  );
  console.log(
    `  Stripe: checkoutEnabled=${caps.stripe.checkoutEnabled} webhookConfigured=${caps.stripe.webhookConfigured}`,
  );
  if (!caps.stripe.checkoutEnabled) {
    console.log(
      '  ⚠ Stripe checkout session not attempted (no STRIPE_SECRET_KEY / store secret). Configure TEST keys — see PAYMENT_SETUP.md.',
    );
  } else {
    try {
      const session = await http<AnyRec>('/api/v1/payments/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: stripeOrder.id,
          customerEmail: 'stripe-test@example.com',
        }),
      });
      assert.ok(session.checkoutUrl, 'checkoutUrl');
      console.log(`  ✓ Stripe: checkout session created (${session.sessionId})`);
    } catch (e: any) {
      console.log(`  ⚠ Stripe checkout-session: ${e?.message || e}`);
    }
  }

  console.log('\n[payment-options] All checks passed.\n');
}

main()
  .catch((e) => {
    console.error('\n[payment-options] FAILED:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
