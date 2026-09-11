import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('capabilities')
  getCapabilities(@Query('storeId') storeId?: string) {
    return this.paymentsService.getCapabilities(storeId);
  }

  /** Optional: SPA needs public PayPal Client ID only if you migrate to Smart Buttons SDK. */
  @Get('paypal/client-id')
  paypalClientId(@Query('storeId') storeId: string) {
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }
    return this.paymentsService.getPayPalClientId(storeId);
  }

  @Post('checkout-session')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Body('orderId') orderId: string,
    @Body('customerEmail') customerEmail?: string,
    @Body('successUrl') successUrl?: string,
    @Body('cancelUrl') cancelUrl?: string,
  ) {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    return this.paymentsService.createStripeCheckoutSession({
      orderId,
      customerEmail,
      successUrl,
      cancelUrl,
    });
  }

  @Post('paypal/create-order')
  @HttpCode(HttpStatus.OK)
  createPayPalOrder(
    @Body('orderId') orderId: string,
    @Body('storeId') storeId: string,
    @Body('returnUrl') returnUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    if (!orderId || !storeId || !returnUrl || !cancelUrl) {
      throw new BadRequestException('orderId, storeId, returnUrl, and cancelUrl are required');
    }
    return this.paymentsService.createPayPalOrder({ orderId, storeId, returnUrl, cancelUrl });
  }

  @Post('paypal/capture')
  @HttpCode(HttpStatus.OK)
  capturePayPal(
    @Body('paypalOrderId') paypalOrderId: string,
    @Body('storeId') storeId: string,
  ) {
    if (!paypalOrderId || !storeId) {
      throw new BadRequestException('paypalOrderId and storeId are required');
    }
    return this.paymentsService.capturePayPalOrder(storeId, paypalOrderId);
  }

  @Post('square/charge')
  @HttpCode(HttpStatus.OK)
  squareCharge(
    @Body('orderId') orderId: string,
    @Body('storeId') storeId: string,
    @Body('sourceId') sourceId: string,
  ) {
    if (!orderId || !storeId || !sourceId) {
      throw new BadRequestException('orderId, storeId, and sourceId are required');
    }
    return this.paymentsService.paySquareOnline({ orderId, storeId, sourceId });
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: any,
  ) {
    const rawBody = req?.rawBody?.toString?.('utf8');
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    await this.paymentsService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }
}
