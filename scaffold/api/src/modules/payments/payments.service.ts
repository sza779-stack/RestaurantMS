import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

type StripeCheckoutSessionRequest = {
  orderId: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
};

type StripeKeysFromConfigs = {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
};

type PayPalKeysFromConfigs = {
  clientId?: string;
  secret?: string;
  /** 'sandbox' | 'live' from Admin */
  mode?: string;
};

type SquareKeysFromConfigs = {
  applicationId?: string;
  accessToken?: string;
  locationId?: string;
  /** Prefer explicit flag from Admin before inferring applicationId */
  useSandbox?: boolean;
};

export type PaymentsCapabilitiesDto = {
  storeId?: string | null;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptOnlinePayment: boolean;
  stripe: {
    enabled: boolean;
    checkoutEnabled: boolean;
    webhookConfigured: boolean;
    publishableKey: string | null;
  };
  paypal: {
    enabled: boolean;
    mode: 'sandbox' | 'live';
    /** Public OAuth client ID for PayPal JS SDK (SPA). Only present when configured. */
    clientId: string | null;
  };
  square: {
    enabled: boolean;
    sandbox: boolean;
    applicationId: string | null;
    locationId: string | null;
    /** Frontend loads Web Payments SDK using this Application ID only. */
  };
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async createStripeCheckoutSession(data: StripeCheckoutSessionRequest) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: true },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const secretKey = await this.getStripeSecretKey(order.storeId);
    if (!secretKey) {
      throw new ServiceUnavailableException('Stripe is not configured for this store');
    }

    const amountCents = Math.max(1, Math.round(Number(order.total) * 100));
    const successUrl =
      data.successUrl ||
      this.configService.get<string>('STRIPE_CHECKOUT_SUCCESS_URL') ||
      'http://localhost:3002/orders?checkout=success';
    const cancelUrl =
      data.cancelUrl ||
      this.configService.get<string>('STRIPE_CHECKOUT_CANCEL_URL') ||
      'http://localhost:3002/orders?checkout=cancel';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append(
      'success_url',
      `${successUrl}${successUrl.includes('?') ? '&' : '?'}orderId=${order.id}`,
    );
    params.append(
      'cancel_url',
      `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}orderId=${order.id}`,
    );
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(amountCents));
    params.append(
      'line_items[0][price_data][product_data][name]',
      `Order ${order.orderNumber || order.id}`,
    );
    params.append('metadata[orderId]', order.id);
    params.append('metadata[storeId]', order.storeId);
    params.append('payment_intent_data[metadata][orderId]', order.id);
    params.append('payment_intent_data[metadata][storeId]', order.storeId);
    if (data.customerEmail) {
      params.append('customer_email', data.customerEmail);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`Stripe checkout session failed: ${errorText}`);
    }

    const session = await response.json();
    return {
      provider: 'stripe',
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  /** PayPal Hosted checkout (redirect). `returnUrl` must point back to SPA (see web-online). */
  async createPayPalOrder(input: {
    orderId: string;
    storeId: string;
    returnUrl: string;
    cancelUrl: string;
  }) {
    const pp = await this.resolvePayPalForStore(input.storeId);
    if (!pp.clientId || !pp.secret) {
      throw new ServiceUnavailableException('PayPal is not configured for this store');
    }
    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, storeId: input.storeId },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const value = Number(order.total).toFixed(2);
    const access = await this.paypalAccessToken(pp);
    const response = await fetch(`${pp.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            custom_id: order.id,
            amount: {
              currency_code: 'USD',
              value,
            },
            description: `Order ${order.orderNumber}`,
          },
        ],
        application_context: {
          user_action: 'PAY_NOW',
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new InternalServerErrorException(
        `PayPal create order failed: ${typeof body === 'object' ? JSON.stringify(body) : response.status}`,
      );
    }

    const links = Array.isArray((body as any).links) ? (body as any).links : [];
    const approve = links.find((l: any) => l?.rel === 'approve' || l?.rel === 'payer-action');
    if (!approve?.href) {
      throw new InternalServerErrorException('PayPal response missing approve link');
    }

    return {
      provider: 'paypal',
      paypalOrderId: (body as any).id as string,
      approvalUrl: approve.href as string,
    };
  }

  /** Capture after customer approves in PayPal. Front-end redirects with query `token` = PayPal order id. */
  async capturePayPalOrder(storeId: string, paypalOrderId: string) {
    const pp = await this.resolvePayPalForStore(storeId);
    if (!pp.clientId || !pp.secret) {
      throw new ServiceUnavailableException('PayPal is not configured for this store');
    }
    const access = await this.paypalAccessToken(pp);

    const getRes = await fetch(`${pp.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    const orderSnap = await getRes.json().catch(() => ({}));
    if (!getRes.ok) {
      throw new BadRequestException(
        `Unable to fetch PayPal order: ${typeof orderSnap === 'object' ? JSON.stringify(orderSnap) : getRes.status}`,
      );
    }
    const internalOrderId = String((orderSnap as any)?.purchase_units?.[0]?.reference_id || '');
    if (!internalOrderId) {
      throw new BadRequestException('PayPal order missing reference to internal order');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: internalOrderId, storeId },
    });
    if (!order) {
      throw new BadRequestException('Order not found for this PayPal checkout');
    }

    const captureRes = await fetch(
      `${pp.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      },
    );

    const capBody = await captureRes.json().catch(() => ({}));
    if (!captureRes.ok) {
      throw new InternalServerErrorException(
        `PayPal capture failed: ${typeof capBody === 'object' ? JSON.stringify(capBody) : captureRes.status}`,
      );
    }

    const captures = (capBody as any)?.purchase_units?.[0]?.payments?.captures ?? [];
    const capture = captures[0];
    const captureId = String(capture?.id || '');
    const amt = capture?.amount;
    const amount =
      amt && amt.value !== undefined ? Number(amt.value) : Number(order.total);

    await this.ordersService.processPayment(
      internalOrderId,
      {
        amount,
        method: 'ONLINE',
        status: 'COMPLETED',
        transactionId: `paypal:${captureId || paypalOrderId}`,
      },
      storeId,
    );

    return { provider: 'paypal', orderId: internalOrderId, captureId };
  }

  /** Square Web Payments: token (`source_id`) created on the browser. Charges full order balance. */
  async paySquareOnline(input: { orderId: string; storeId: string; sourceId: string }) {
    const sq = await this.resolveSquareForStore(input.storeId);
    if (!sq.accessToken || !sq.locationId) {
      throw new ServiceUnavailableException('Square is not configured for this store');
    }
    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, storeId: input.storeId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const amountMoney = BigInt(Math.max(1, Math.round(Number(order.total) * 100)));
    const idempotencyKey = randomUUID();

    const res = await fetch(`${sq.apiBase}/v2/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sq.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-10-17',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        autocomplete: true,
        location_id: sq.locationId,
        source_id: input.sourceId,
        amount_money: {
          amount: amountMoney.toString(),
          currency: 'USD',
        },
        reference_id: order.orderNumber || order.id,
        note: `Web order ${order.orderNumber}`,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (body as any)?.errors?.[0]?.detail ||
        (body as any)?.errors?.[0]?.code ||
        JSON.stringify(body);
      throw new InternalServerErrorException(`Square payment failed: ${msg}`);
    }

    const payObj = (body as any).payment;
    if (!payObj?.id) {
      throw new InternalServerErrorException('Square payment response missing id');
    }
    const st = String(payObj?.status || '');
    if (['FAILED', 'CANCELED', 'DECLINED'].includes(st)) {
      throw new InternalServerErrorException(`Square declined: ${st}`);
    }

    const paymentId = String(payObj.id);
    const amountUsd = payObj?.amount_money?.amount
      ? Number(payObj.amount_money.amount) / 100
      : Number(order.total);

    await this.ordersService.processPayment(
      order.id,
      {
        amount: amountUsd || Number(order.total),
        method: 'ONLINE',
        status: 'COMPLETED',
        transactionId: `square:${paymentId}`,
      },
      input.storeId,
    );

    return { provider: 'square', orderId: order.id, squarePaymentId: paymentId };
  }

  async getCapabilities(storeId?: string): Promise<PaymentsCapabilitiesDto> {
    let acceptCash = true;
    let acceptCard = true;
    let acceptOnlinePayment = true;
    let stripeStore: StripeKeysFromConfigs | null = null;
    let paypalFromDb: PayPalKeysFromConfigs = {};
    let squareFromDb: SquareKeysFromConfigs = {};

    if (storeId) {
      const settings = await this.prisma.storeSettings.findUnique({
        where: { storeId },
        select: {
          acceptCash: true,
          acceptCard: true,
          acceptOnlinePayment: true,
          paymentConfigs: true,
        },
      });
      if (settings) {
        acceptCash = settings.acceptCash;
        acceptCard = settings.acceptCard;
        acceptOnlinePayment = settings.acceptOnlinePayment;
        stripeStore = this.stripeKeysFromConfigs(settings.paymentConfigs);
        paypalFromDb = this.paypalKeysFromConfigs(settings.paymentConfigs);
        squareFromDb = this.squareKeysFromConfigs(settings.paymentConfigs);
      }
    }

    const stripeKeyEnv = this.normalizeStripeSecret(this.configService.get<string>('STRIPE_SECRET_KEY'));
    const stripeWebhookEnv = this.normalizeStripeSecret(
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
    );
    const stripeKey = stripeStore?.secretKey || stripeKeyEnv;
    const stripeWebhookConfigured = Boolean(
      stripeWebhookEnv || (stripeStore?.webhookSecret && stripeStore.webhookSecret.length > 0),
    );

    const ppMerged = this.mergePayPalEnv(paypalFromDb);
    const paypalEnabled =
      Boolean(this.normalizeStripeSecret(ppMerged.clientId)) &&
      Boolean(this.normalizeStripeSecret(ppMerged.secret));

    const sqResolved = this.mergeSquareDefaults(squareFromDb);
    const squareEnabled =
      Boolean(this.normalizeStripeSecret(sqResolved.accessToken)) &&
      Boolean(this.normalizeStripeSecret(sqResolved.locationId)) &&
      Boolean(this.normalizeStripeSecret(sqResolved.applicationId));

    return {
      storeId: storeId || null,
      acceptCash,
      acceptCard,
      acceptOnlinePayment,
      stripe: {
        enabled: acceptOnlinePayment && Boolean(stripeKey),
        checkoutEnabled: Boolean(stripeKey),
        webhookConfigured: stripeWebhookConfigured,
        publishableKey: stripeStore?.publishableKey?.trim()
          ? stripeStore.publishableKey.trim()
          : this.configService.get<string>('STRIPE_PUBLISHABLE_KEY')?.trim() || null,
      },
      paypal: {
        enabled: acceptOnlinePayment && paypalEnabled,
        mode: ppMerged.mode === 'live' ? 'live' : 'sandbox',
        clientId: ppMerged.clientId?.trim() || null,
      },
      square: {
        enabled: acceptOnlinePayment && squareEnabled,
        sandbox: sqResolved.useSandbox ?? true,
        applicationId: sqResolved.applicationId?.trim() || null,
        locationId: sqResolved.locationId?.trim() || null,
      },
    };
  }

  /** Public client id used by browser PayPal SDK (no secret — safe when PayPal checkout is configured). */
  async getPayPalClientId(storeId: string): Promise<{ clientId: string; mode: 'sandbox' | 'live' }> {
    const pp = await this.resolvePayPalForStore(storeId);
    if (!pp.clientId) {
      throw new ServiceUnavailableException('PayPal client id is not configured for this store');
    }
    return { clientId: pp.clientId, mode: pp.mode === 'live' ? 'live' : 'sandbox' };
  }

  async handleStripeWebhook(rawBody: string, signatureHeader?: string) {
    const webhookSecrets = await this.collectWebhookSecretsForVerification(rawBody);
    if (!webhookSecrets.length) {
      throw new ServiceUnavailableException('Stripe webhook secret is not configured');
    }
    if (!signatureHeader) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const verified = webhookSecrets.some((secret) =>
      this.verifyStripeSignature(rawBody, signatureHeader, secret),
    );
    if (!verified) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const type = String(event?.type || '');
    const payloadObject = (event?.data as { object?: Record<string, unknown> } | undefined)?.object || {};

    const meta = this.extractStripeMetadata(payloadObject);

    if (type === 'checkout.session.completed') {
      const orderId = meta.orderId || '';
      const storeIdVal = meta.storeId || '';
      const paymentIntentId = String(payloadObject?.payment_intent || '');
      const amount = Number(payloadObject?.amount_total || 0) / 100;
      await this.finalizeStripeLikePayment(orderId, storeIdVal, paymentIntentId, amount);
      return;
    }

    if (type === 'payment_intent.succeeded') {
      const orderId = meta.orderId || '';
      const storeIdVal = meta.storeId || '';
      const paymentIntentId = String(payloadObject?.id || '');
      const amount = Number(payloadObject?.amount_received || payloadObject?.amount || 0) / 100;
      await this.finalizeStripeLikePayment(orderId, storeIdVal, paymentIntentId, amount);
      return;
    }
  }

  /** Env signing secret plus optional per-store secret (Stripe CLI / Dashboard env usually wins first). */
  private async collectWebhookSecretsForVerification(rawBody: string): Promise<string[]> {
    const ordered: string[] = [];
    const push = (s?: string) => {
      const n = this.normalizeStripeSecret(s);
      if (n && !ordered.includes(n)) ordered.push(n);
    };

    push(this.configService.get<string>('STRIPE_WEBHOOK_SECRET'));

    const hintStoreId = this.extractStoreIdHint(rawBody);
    if (hintStoreId) {
      const keys = await this.getStripeKeysFromStore(hintStoreId);
      push(keys?.webhookSecret);
    }

    return ordered;
  }

  private extractStoreIdHint(rawBody: string): string | undefined {
    try {
      const event = JSON.parse(rawBody) as Record<string, unknown>;
      const obj = (event?.data as { object?: Record<string, unknown> } | undefined)?.object;
      const id = obj?.metadata && (obj.metadata as Record<string, string>)?.storeId;
      const t = typeof id === 'string' ? id.trim() : '';
      return t.length > 0 ? t : undefined;
    } catch {
      return undefined;
    }
  }

  private extractStripeMetadata(payloadObject: Record<string, unknown>): Record<string, string> {
    const rawMeta = payloadObject.metadata;
    if (!rawMeta || typeof rawMeta !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawMeta as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  }

  private async finalizeStripeLikePayment(orderId: string, storeId: string, paymentRef: string, amount: number) {
    if (!orderId || !paymentRef || amount <= 0) {
      return;
    }

    const existing = await this.prisma.payment.findFirst({
      where: {
        orderId,
        transactionId: paymentRef,
        status: 'COMPLETED',
      },
      select: { id: true },
    });
    if (existing) {
      return;
    }

    await this.ordersService.processPayment(
      orderId,
      {
        amount,
        method: 'ONLINE',
        status: 'COMPLETED',
        transactionId: paymentRef,
      },
      storeId || undefined,
    );
  }

  private verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
    const parts = signatureHeader.split(',').map((p) => p.trim());
    const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
    const signatures = parts
      .filter((p) => p.startsWith('v1='))
      .map((p) => p.slice(3))
      .filter(Boolean);

    if (!timestamp || signatures.length === 0) {
      return false;
    }
    const eventTimestampMs = Number(timestamp) * 1000;
    if (!Number.isFinite(eventTimestampMs)) {
      return false;
    }
    const maxAgeMs = 5 * 60 * 1000;
    if (Math.abs(Date.now() - eventTimestampMs) > maxAgeMs) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    return signatures.some((sig) => {
      try {
        const sigBuffer = Buffer.from(sig, 'hex');
        return sigBuffer.length === expectedBuffer.length && timingSafeEqual(sigBuffer, expectedBuffer);
      } catch {
        return false;
      }
    });
  }

  private normalizeStripeSecret(value?: string | null): string | undefined {
    if (typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length > 0 ? t : undefined;
  }

  private parsePaymentConfigs(raw: unknown): Record<string, unknown> | null {
    if (!raw) return null;
    if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }

  private stripeKeysFromConfigs(paymentConfigs: unknown): StripeKeysFromConfigs {
    const root = this.parsePaymentConfigs(paymentConfigs);
    const stripe = root?.stripe;
    if (!stripe || typeof stripe !== 'object') return {};

    const s = stripe as Record<string, unknown>;
    const str = (k: keyof StripeKeysFromConfigs) =>
      this.normalizeStripeSecret(typeof s[k] === 'string' ? (s[k] as string) : undefined);
    return {
      publishableKey: str('publishableKey'),
      secretKey: str('secretKey'),
      webhookSecret: str('webhookSecret'),
    };
  }

  private paypalKeysFromConfigs(paymentConfigs: unknown): PayPalKeysFromConfigs {
    const root = this.parsePaymentConfigs(paymentConfigs);
    const p = root?.paypal;
    if (!p || typeof p !== 'object') return {};

    const o = p as Record<string, unknown>;
    return {
      clientId: this.normalizeStripeSecret(typeof o.clientId === 'string' ? o.clientId : undefined),
      secret: this.normalizeStripeSecret(typeof o.secret === 'string' ? o.secret : undefined),
      mode: typeof o.mode === 'string' ? o.mode : 'sandbox',
    };
  }

  private squareKeysFromConfigs(paymentConfigs: unknown): SquareKeysFromConfigs {
    const root = this.parsePaymentConfigs(paymentConfigs);
    const p = root?.square;
    if (!p || typeof p !== 'object') return {};

    const o = p as Record<string, unknown>;
    const sandbox =
      typeof o.useSandbox === 'boolean'
        ? o.useSandbox
        : typeof o.sandbox === 'boolean'
          ? o.sandbox
          : typeof o.environment === 'string'
            ? o.environment.toLowerCase() !== 'production'
            : undefined;

    return {
      applicationId: this.normalizeStripeSecret(
        typeof o.applicationId === 'string' ? o.applicationId : undefined,
      ),
      accessToken: this.normalizeStripeSecret(
        typeof o.accessToken === 'string' ? o.accessToken : undefined,
      ),
      locationId: this.normalizeStripeSecret(typeof o.locationId === 'string' ? o.locationId : undefined),
      useSandbox: sandbox ?? this.squareSandboxFromApplicationId(
        typeof o.applicationId === 'string' ? o.applicationId : undefined,
      ),
    };
  }

  private squareSandboxFromApplicationId(applicationId?: string): boolean {
    if (!applicationId) return true;
    return (
      applicationId.startsWith('sandbox-') ||
      applicationId.includes('sandbox') ||
      applicationId.includes('Sq0idb')
    );
  }

  private mergePayPalEnv(pp: PayPalKeysFromConfigs): PayPalKeysFromConfigs {
    const clientId =
      pp.clientId ||
      this.configService.get<string>('PAYPAL_CLIENT_ID')?.trim() ||
      undefined;
    const secret =
      pp.secret ||
      this.configService.get<string>('PAYPAL_SECRET')?.trim() ||
      undefined;
    const mode = (pp.mode || this.configService.get<string>('PAYPAL_MODE') || 'sandbox').toLowerCase();

    return { clientId, secret, mode };
  }

  private mergeSquareDefaults(sq: SquareKeysFromConfigs): SquareKeysFromConfigs & { apiBase: string } {
    const applicationId = sq.applicationId || this.configService.get<string>('SQUARE_APPLICATION_ID') || '';
    const accessToken =
      sq.accessToken || this.configService.get<string>('SQUARE_ACCESS_TOKEN') || '';
    const locationId = sq.locationId || this.configService.get<string>('SQUARE_LOCATION_ID') || '';
    const useSandbox =
      sq.useSandbox !== undefined
        ? sq.useSandbox
        : this.squareSandboxFromApplicationId(applicationId);
    const apiBase =
      useSandbox !== false ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
    return { applicationId, accessToken, locationId, useSandbox: useSandbox !== false, apiBase };
  }

  private async resolvePayPalForStore(storeId: string) {
    const row = await this.prisma.storeSettings.findUnique({
      where: { storeId },
      select: { paymentConfigs: true },
    });
    const fromDb = this.paypalKeysFromConfigs(row?.paymentConfigs);
    const merged = this.mergePayPalEnv(fromDb);
    const mode = merged.mode === 'live' ? 'live' : 'sandbox';
    const baseUrl =
      mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    return { ...merged, baseUrl, mode };
  }

  private async resolveSquareForStore(storeId: string): Promise<{
    accessToken?: string;
    locationId?: string;
    apiBase: string;
    applicationId?: string;
  }> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { storeId },
      select: { paymentConfigs: true },
    });
    const fromDb = this.squareKeysFromConfigs(row?.paymentConfigs);
    return this.mergeSquareDefaults(fromDb);
  }

  private async paypalAccessToken(pp: PayPalKeysFromConfigs & { baseUrl: string }): Promise<string> {
    if (!pp.clientId || !pp.secret) throw new BadRequestException('PayPal credentials missing');
    const basic = Buffer.from(`${pp.clientId}:${pp.secret}`).toString('base64');
    const res = await fetch(`${pp.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !(data as any)?.access_token) {
      throw new InternalServerErrorException(`PayPal auth failed (${res.status})`);
    }

    return (data as any).access_token as string;
  }

  private async getStripeKeysFromStore(storeId: string): Promise<StripeKeysFromConfigs | null> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { storeId },
      select: { paymentConfigs: true },
    });
    if (!row) return null;
    return this.stripeKeysFromConfigs(row.paymentConfigs);
  }

  /** Store keys from Admin » Settings » Payment » Stripe override env defaults. */
  private async getStripeSecretKey(storeId?: string): Promise<string | undefined> {
    if (storeId) {
      const fromStore = await this.getStripeKeysFromStore(storeId);
      const secret = fromStore?.secretKey;
      if (secret) return secret;
    }
    return this.normalizeStripeSecret(this.configService.get<string>('STRIPE_SECRET_KEY'));
  }
}
