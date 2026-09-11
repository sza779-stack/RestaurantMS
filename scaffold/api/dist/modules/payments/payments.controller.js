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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getCapabilities(storeId) {
        return this.paymentsService.getCapabilities(storeId);
    }
    paypalClientId(storeId) {
        if (!storeId) {
            throw new common_1.BadRequestException('storeId is required');
        }
        return this.paymentsService.getPayPalClientId(storeId);
    }
    async createCheckoutSession(orderId, customerEmail, successUrl, cancelUrl) {
        if (!orderId) {
            throw new common_1.BadRequestException('orderId is required');
        }
        return this.paymentsService.createStripeCheckoutSession({
            orderId,
            customerEmail,
            successUrl,
            cancelUrl,
        });
    }
    createPayPalOrder(orderId, storeId, returnUrl, cancelUrl) {
        if (!orderId || !storeId || !returnUrl || !cancelUrl) {
            throw new common_1.BadRequestException('orderId, storeId, returnUrl, and cancelUrl are required');
        }
        return this.paymentsService.createPayPalOrder({ orderId, storeId, returnUrl, cancelUrl });
    }
    capturePayPal(paypalOrderId, storeId) {
        if (!paypalOrderId || !storeId) {
            throw new common_1.BadRequestException('paypalOrderId and storeId are required');
        }
        return this.paymentsService.capturePayPalOrder(storeId, paypalOrderId);
    }
    squareCharge(orderId, storeId, sourceId) {
        if (!orderId || !storeId || !sourceId) {
            throw new common_1.BadRequestException('orderId, storeId, and sourceId are required');
        }
        return this.paymentsService.paySquareOnline({ orderId, storeId, sourceId });
    }
    async handleStripeWebhook(signature, req) {
        const rawBody = req?.rawBody?.toString?.('utf8');
        if (!rawBody) {
            throw new common_1.BadRequestException('Missing raw request body');
        }
        await this.paymentsService.handleStripeWebhook(rawBody, signature);
        return { received: true };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('capabilities'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getCapabilities", null);
__decorate([
    (0, common_1.Get)('paypal/client-id'),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "paypalClientId", null);
__decorate([
    (0, common_1.Post)('checkout-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('orderId')),
    __param(1, (0, common_1.Body)('customerEmail')),
    __param(2, (0, common_1.Body)('successUrl')),
    __param(3, (0, common_1.Body)('cancelUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCheckoutSession", null);
__decorate([
    (0, common_1.Post)('paypal/create-order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('orderId')),
    __param(1, (0, common_1.Body)('storeId')),
    __param(2, (0, common_1.Body)('returnUrl')),
    __param(3, (0, common_1.Body)('cancelUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createPayPalOrder", null);
__decorate([
    (0, common_1.Post)('paypal/capture'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('paypalOrderId')),
    __param(1, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "capturePayPal", null);
__decorate([
    (0, common_1.Post)('square/charge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('orderId')),
    __param(1, (0, common_1.Body)('storeId')),
    __param(2, (0, common_1.Body)('sourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "squareCharge", null);
__decorate([
    (0, common_1.Post)('webhook/stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleStripeWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map