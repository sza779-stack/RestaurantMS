import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getCapabilities(storeId?: string): Promise<import("./payments.service").PaymentsCapabilitiesDto>;
    paypalClientId(storeId: string): Promise<{
        clientId: string;
        mode: "sandbox" | "live";
    }>;
    createCheckoutSession(orderId: string, customerEmail?: string, successUrl?: string, cancelUrl?: string): Promise<{
        provider: string;
        sessionId: any;
        checkoutUrl: any;
    }>;
    createPayPalOrder(orderId: string, storeId: string, returnUrl: string, cancelUrl: string): Promise<{
        provider: string;
        paypalOrderId: string;
        approvalUrl: string;
    }>;
    capturePayPal(paypalOrderId: string, storeId: string): Promise<{
        provider: string;
        orderId: string;
        captureId: string;
    }>;
    squareCharge(orderId: string, storeId: string, sourceId: string): Promise<{
        provider: string;
        orderId: string;
        squarePaymentId: string;
    }>;
    handleStripeWebhook(signature: string | undefined, req: any): Promise<{
        received: boolean;
    }>;
}
