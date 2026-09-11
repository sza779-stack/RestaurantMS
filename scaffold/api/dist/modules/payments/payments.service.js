"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const orders_service_1 = require("../orders/orders.service");
let PaymentsService = class PaymentsService {
    constructor(configService, prisma, ordersService) {
        this.configService = configService;
        this.prisma = prisma;
        this.ordersService = ordersService;
    }
    async createStripeCheckoutSession(data) {
        const order = await this.prisma.order.findUnique({
            where: { id: data.orderId },
            include: { payments: true },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        const secretKey = await this.getStripeSecretKey(order.storeId);
        if (!secretKey) {
            throw new common_1.ServiceUnavailableException('Stripe is not configured for this store');
        }
        const amountCents = Math.max(1, Math.round(Number(order.total) * 100));
        const successUrl = data.successUrl ||
            this.configService.get('STRIPE_CHECKOUT_SUCCESS_URL') ||
            'http://localhost:3002/orders?checkout=success';
        const cancelUrl = data.cancelUrl ||
            this.configService.get('STRIPE_CHECKOUT_CANCEL_URL') ||
            'http://localhost:3002/orders?checkout=cancel';
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', `${successUrl}${successUrl.includes('?') ? '&' : '?'}orderId=${order.id}`);
        params.append('cancel_url', `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}orderId=${order.id}`);
        params.append('line_items[0][quantity]', '1');
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][unit_amount]', String(amountCents));
        params.append('line_items[0][price_data][product_data][name]', `Order ${order.orderNumber || order.id}`);
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
            throw new common_1.InternalServerErrorException(`Stripe checkout session failed: ${errorText}`);
        }
        const session = await response.json();
        return {
            provider: 'stripe',
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }
    async createPayPalOrder(input) {
        const pp = await this.resolvePayPalForStore(input.storeId);
        if (!pp.clientId || !pp.secret) {
            throw new common_1.ServiceUnavailableException('PayPal is not configured for this store');
        }
        const order = await this.prisma.order.findFirst({
            where: { id: input.orderId, storeId: input.storeId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
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
            throw new common_1.InternalServerErrorException(`PayPal create order failed: ${typeof body === 'object' ? JSON.stringify(body) : response.status}`);
        }
        const links = Array.isArray(body.links) ? body.links : [];
        const approve = links.find((l) => l?.rel === 'approve' || l?.rel === 'payer-action');
        if (!approve?.href) {
            throw new common_1.InternalServerErrorException('PayPal response missing approve link');
        }
        return {
            provider: 'paypal',
            paypalOrderId: body.id,
            approvalUrl: approve.href,
        };
    }
    async capturePayPalOrder(storeId, paypalOrderId) {
        const pp = await this.resolvePayPalForStore(storeId);
        if (!pp.clientId || !pp.secret) {
            throw new common_1.ServiceUnavailableException('PayPal is not configured for this store');
        }
        const access = await this.paypalAccessToken(pp);
        const getRes = await fetch(`${pp.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
            headers: { Authorization: `Bearer ${access}` },
        });
        const orderSnap = await getRes.json().catch(() => ({}));
        if (!getRes.ok) {
            throw new common_1.BadRequestException(`Unable to fetch PayPal order: ${typeof orderSnap === 'object' ? JSON.stringify(orderSnap) : getRes.status}`);
        }
        const internalOrderId = String(orderSnap?.purchase_units?.[0]?.reference_id || '');
        if (!internalOrderId) {
            throw new common_1.BadRequestException('PayPal order missing reference to internal order');
        }
        const order = await this.prisma.order.findFirst({
            where: { id: internalOrderId, storeId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found for this PayPal checkout');
        }
        const captureRes = await fetch(`${pp.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
            },
        });
        const capBody = await captureRes.json().catch(() => ({}));
        if (!captureRes.ok) {
            throw new common_1.InternalServerErrorException(`PayPal capture failed: ${typeof capBody === 'object' ? JSON.stringify(capBody) : captureRes.status}`);
        }
        const captures = capBody?.purchase_units?.[0]?.payments?.captures ?? [];
        const capture = captures[0];
        const captureId = String(capture?.id || '');
        const amt = capture?.amount;
        const amount = amt && amt.value !== undefined ? Number(amt.value) : Number(order.total);
        await this.ordersService.processPayment(internalOrderId, {
            amount,
            method: 'ONLINE',
            status: 'COMPLETED',
            transactionId: `paypal:${captureId || paypalOrderId}`,
        }, storeId);
        return { provider: 'paypal', orderId: internalOrderId, captureId };
    }
    async paySquareOnline(input) {
        const sq = await this.resolveSquareForStore(input.storeId);
        if (!sq.accessToken || !sq.locationId) {
            throw new common_1.ServiceUnavailableException('Square is not configured for this store');
        }
        const order = await this.prisma.order.findFirst({
            where: { id: input.orderId, storeId: input.storeId },
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        const amountMoney = BigInt(Math.max(1, Math.round(Number(order.total) * 100)));
        const idempotencyKey = (0, crypto_1.randomUUID)();
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
            const msg = body?.errors?.[0]?.detail ||
                body?.errors?.[0]?.code ||
                JSON.stringify(body);
            throw new common_1.InternalServerErrorException(`Square payment failed: ${msg}`);
        }
        const payObj = body.payment;
        if (!payObj?.id) {
            throw new common_1.InternalServerErrorException('Square payment response missing id');
        }
        const st = String(payObj?.status || '');
        if (['FAILED', 'CANCELED', 'DECLINED'].includes(st)) {
            throw new common_1.InternalServerErrorException(`Square declined: ${st}`);
        }
        const paymentId = String(payObj.id);
        const amountUsd = payObj?.amount_money?.amount
            ? Number(payObj.amount_money.amount) / 100
            : Number(order.total);
        await this.ordersService.processPayment(order.id, {
            amount: amountUsd || Number(order.total),
            method: 'ONLINE',
            status: 'COMPLETED',
            transactionId: `square:${paymentId}`,
        }, input.storeId);
        return { provider: 'square', orderId: order.id, squarePaymentId: paymentId };
    }
    async getCapabilities(storeId) {
        let acceptCash = true;
        let acceptCard = true;
        let acceptOnlinePayment = true;
        let stripeStore = null;
        let paypalFromDb = {};
        let squareFromDb = {};
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
        const stripeKeyEnv = this.normalizeStripeSecret(this.configService.get('STRIPE_SECRET_KEY'));
        const stripeWebhookEnv = this.normalizeStripeSecret(this.configService.get('STRIPE_WEBHOOK_SECRET'));
        const stripeKey = stripeStore?.secretKey || stripeKeyEnv;
        const stripeWebhookConfigured = Boolean(stripeWebhookEnv || (stripeStore?.webhookSecret && stripeStore.webhookSecret.length > 0));
        const ppMerged = this.mergePayPalEnv(paypalFromDb);
        const paypalEnabled = Boolean(this.normalizeStripeSecret(ppMerged.clientId)) &&
            Boolean(this.normalizeStripeSecret(ppMerged.secret));
        const sqResolved = this.mergeSquareDefaults(squareFromDb);
        const squareEnabled = Boolean(this.normalizeStripeSecret(sqResolved.accessToken)) &&
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
                    : this.configService.get('STRIPE_PUBLISHABLE_KEY')?.trim() || null,
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
    async getPayPalClientId(storeId) {
        const pp = await this.resolvePayPalForStore(storeId);
        if (!pp.clientId) {
            throw new common_1.ServiceUnavailableException('PayPal client id is not configured for this store');
        }
        return { clientId: pp.clientId, mode: pp.mode === 'live' ? 'live' : 'sandbox' };
    }
    async handleStripeWebhook(rawBody, signatureHeader) {
        const webhookSecrets = await this.collectWebhookSecretsForVerification(rawBody);
        if (!webhookSecrets.length) {
            throw new common_1.ServiceUnavailableException('Stripe webhook secret is not configured');
        }
        if (!signatureHeader) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        const verified = webhookSecrets.some((secret) => this.verifyStripeSignature(rawBody, signatureHeader, secret));
        if (!verified) {
            throw new common_1.BadRequestException('Invalid Stripe webhook signature');
        }
        const event = JSON.parse(rawBody);
        const type = String(event?.type || '');
        const payloadObject = event?.data?.object || {};
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
    async collectWebhookSecretsForVerification(rawBody) {
        const ordered = [];
        const push = (s) => {
            const n = this.normalizeStripeSecret(s);
            if (n && !ordered.includes(n))
                ordered.push(n);
        };
        push(this.configService.get('STRIPE_WEBHOOK_SECRET'));
        const hintStoreId = this.extractStoreIdHint(rawBody);
        if (hintStoreId) {
            const keys = await this.getStripeKeysFromStore(hintStoreId);
            push(keys?.webhookSecret);
        }
        return ordered;
    }
    extractStoreIdHint(rawBody) {
        try {
            const event = JSON.parse(rawBody);
            const obj = event?.data?.object;
            const id = obj?.metadata && obj.metadata?.storeId;
            const t = typeof id === 'string' ? id.trim() : '';
            return t.length > 0 ? t : undefined;
        }
        catch {
            return undefined;
        }
    }
    extractStripeMetadata(payloadObject) {
        const rawMeta = payloadObject.metadata;
        if (!rawMeta || typeof rawMeta !== 'object')
            return {};
        const out = {};
        for (const [k, v] of Object.entries(rawMeta)) {
            if (typeof v === 'string')
                out[k] = v;
        }
        return out;
    }
    async finalizeStripeLikePayment(orderId, storeId, paymentRef, amount) {
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
        await this.ordersService.processPayment(orderId, {
            amount,
            method: 'ONLINE',
            status: 'COMPLETED',
            transactionId: paymentRef,
        }, storeId || undefined);
    }
    verifyStripeSignature(payload, signatureHeader, secret) {
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
        const expected = (0, crypto_1.createHmac)('sha256', secret).update(signedPayload, 'utf8').digest('hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        return signatures.some((sig) => {
            try {
                const sigBuffer = Buffer.from(sig, 'hex');
                return sigBuffer.length === expectedBuffer.length && (0, crypto_1.timingSafeEqual)(sigBuffer, expectedBuffer);
            }
            catch {
                return false;
            }
        });
    }
    normalizeStripeSecret(value) {
        if (typeof value !== 'string')
            return undefined;
        const t = value.trim();
        return t.length > 0 ? t : undefined;
    }
    parsePaymentConfigs(raw) {
        if (!raw)
            return null;
        if (typeof raw === 'object' && raw !== null)
            return raw;
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        }
        return null;
    }
    stripeKeysFromConfigs(paymentConfigs) {
        const root = this.parsePaymentConfigs(paymentConfigs);
        const stripe = root?.stripe;
        if (!stripe || typeof stripe !== 'object')
            return {};
        const s = stripe;
        const str = (k) => this.normalizeStripeSecret(typeof s[k] === 'string' ? s[k] : undefined);
        return {
            publishableKey: str('publishableKey'),
            secretKey: str('secretKey'),
            webhookSecret: str('webhookSecret'),
        };
    }
    paypalKeysFromConfigs(paymentConfigs) {
        const root = this.parsePaymentConfigs(paymentConfigs);
        const p = root?.paypal;
        if (!p || typeof p !== 'object')
            return {};
        const o = p;
        return {
            clientId: this.normalizeStripeSecret(typeof o.clientId === 'string' ? o.clientId : undefined),
            secret: this.normalizeStripeSecret(typeof o.secret === 'string' ? o.secret : undefined),
            mode: typeof o.mode === 'string' ? o.mode : 'sandbox',
        };
    }
    squareKeysFromConfigs(paymentConfigs) {
        const root = this.parsePaymentConfigs(paymentConfigs);
        const p = root?.square;
        if (!p || typeof p !== 'object')
            return {};
        const o = p;
        const sandbox = typeof o.useSandbox === 'boolean'
            ? o.useSandbox
            : typeof o.sandbox === 'boolean'
                ? o.sandbox
                : typeof o.environment === 'string'
                    ? o.environment.toLowerCase() !== 'production'
                    : undefined;
        return {
            applicationId: this.normalizeStripeSecret(typeof o.applicationId === 'string' ? o.applicationId : undefined),
            accessToken: this.normalizeStripeSecret(typeof o.accessToken === 'string' ? o.accessToken : undefined),
            locationId: this.normalizeStripeSecret(typeof o.locationId === 'string' ? o.locationId : undefined),
            useSandbox: sandbox ?? this.squareSandboxFromApplicationId(typeof o.applicationId === 'string' ? o.applicationId : undefined),
        };
    }
    squareSandboxFromApplicationId(applicationId) {
        if (!applicationId)
            return true;
        return (applicationId.startsWith('sandbox-') ||
            applicationId.includes('sandbox') ||
            applicationId.includes('Sq0idb'));
    }
    mergePayPalEnv(pp) {
        const clientId = pp.clientId ||
            this.configService.get('PAYPAL_CLIENT_ID')?.trim() ||
            undefined;
        const secret = pp.secret ||
            this.configService.get('PAYPAL_SECRET')?.trim() ||
            undefined;
        const mode = (pp.mode || this.configService.get('PAYPAL_MODE') || 'sandbox').toLowerCase();
        return { clientId, secret, mode };
    }
    mergeSquareDefaults(sq) {
        const applicationId = sq.applicationId || this.configService.get('SQUARE_APPLICATION_ID') || '';
        const accessToken = sq.accessToken || this.configService.get('SQUARE_ACCESS_TOKEN') || '';
        const locationId = sq.locationId || this.configService.get('SQUARE_LOCATION_ID') || '';
        const useSandbox = sq.useSandbox !== undefined
            ? sq.useSandbox
            : this.squareSandboxFromApplicationId(applicationId);
        const apiBase = useSandbox !== false ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
        return { applicationId, accessToken, locationId, useSandbox: useSandbox !== false, apiBase };
    }
    async resolvePayPalForStore(storeId) {
        const row = await this.prisma.storeSettings.findUnique({
            where: { storeId },
            select: { paymentConfigs: true },
        });
        const fromDb = this.paypalKeysFromConfigs(row?.paymentConfigs);
        const merged = this.mergePayPalEnv(fromDb);
        const mode = merged.mode === 'live' ? 'live' : 'sandbox';
        const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        return { ...merged, baseUrl, mode };
    }
    async resolveSquareForStore(storeId) {
        const row = await this.prisma.storeSettings.findUnique({
            where: { storeId },
            select: { paymentConfigs: true },
        });
        const fromDb = this.squareKeysFromConfigs(row?.paymentConfigs);
        return this.mergeSquareDefaults(fromDb);
    }
    async paypalAccessToken(pp) {
        if (!pp.clientId || !pp.secret)
            throw new common_1.BadRequestException('PayPal credentials missing');
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
        if (!res.ok || !data?.access_token) {
            throw new common_1.InternalServerErrorException(`PayPal auth failed (${res.status})`);
        }
        return data.access_token;
    }
    async getStripeKeysFromStore(storeId) {
        const row = await this.prisma.storeSettings.findUnique({
            where: { storeId },
            select: { paymentConfigs: true },
        });
        if (!row)
            return null;
        return this.stripeKeysFromConfigs(row.paymentConfigs);
    }
    async getStripeSecretKey(storeId) {
        if (storeId) {
            const fromStore = await this.getStripeKeysFromStore(storeId);
            const secret = fromStore?.secretKey;
            if (secret)
                return secret;
        }
        return this.normalizeStripeSecret(this.configService.get('STRIPE_SECRET_KEY'));
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        orders_service_1.OrdersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map