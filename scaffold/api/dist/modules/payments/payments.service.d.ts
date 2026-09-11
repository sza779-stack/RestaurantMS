import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
type StripeCheckoutSessionRequest = {
    orderId: string;
    customerEmail?: string;
    successUrl?: string;
    cancelUrl?: string;
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
        clientId: string | null;
    };
    square: {
        enabled: boolean;
        sandbox: boolean;
        applicationId: string | null;
        locationId: string | null;
    };
};
export declare class PaymentsService {
    private readonly configService;
    private readonly prisma;
    private readonly ordersService;
    constructor(configService: ConfigService, prisma: PrismaService, ordersService: OrdersService);
    createStripeCheckoutSession(data: StripeCheckoutSessionRequest): Promise<{
        provider: string;
        sessionId: any;
        checkoutUrl: any;
    }>;
    createPayPalOrder(input: {
        orderId: string;
        storeId: string;
        returnUrl: string;
        cancelUrl: string;
    }): Promise<{
        provider: string;
        paypalOrderId: string;
        approvalUrl: string;
    }>;
    capturePayPalOrder(storeId: string, paypalOrderId: string): Promise<{
        provider: string;
        orderId: string;
        captureId: string;
    }>;
    paySquareOnline(input: {
        orderId: string;
        storeId: string;
        sourceId: string;
    }): Promise<{
        provider: string;
        orderId: string;
        squarePaymentId: string;
    }>;
    getCapabilities(storeId?: string): Promise<PaymentsCapabilitiesDto>;
    getPayPalClientId(storeId: string): Promise<{
        clientId: string;
        mode: 'sandbox' | 'live';
    }>;
    handleStripeWebhook(rawBody: string, signatureHeader?: string): Promise<void>;
    private collectWebhookSecretsForVerification;
    private extractStoreIdHint;
    private extractStripeMetadata;
    private finalizeStripeLikePayment;
    private verifyStripeSignature;
    private normalizeStripeSecret;
    private parsePaymentConfigs;
    private stripeKeysFromConfigs;
    private paypalKeysFromConfigs;
    private squareKeysFromConfigs;
    private squareSandboxFromApplicationId;
    private mergePayPalEnv;
    private mergeSquareDefaults;
    private resolvePayPalForStore;
    private resolveSquareForStore;
    private paypalAccessToken;
    private getStripeKeysFromStore;
    private getStripeSecretKey;
}
export {};
