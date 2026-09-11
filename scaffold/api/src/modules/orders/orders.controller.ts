import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { OrdersService } from './orders.service';
import { Auditable } from '../../common/audit/audit-log.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('public/default-store')
  async getPublicDefaultStore() {
    const storeId = await this.ordersService.getDefaultStoreId();
    return { storeId };
  }

  @Get('public/stores')
  async getPublicStores() {
    return this.ordersService.getPublicStores();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('includeFuture') includeFuture?: string,
    @Query('futureOnly') futureOnly?: string,
  ) {
    return this.ordersService.findAll({
      storeId,
      status,
      includeFuture: includeFuture !== 'false',
      futureOnly: futureOnly === 'true',
    });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(@Body() data: any, @Request() req?: any) {
    try {
      console.log('[OrdersController] Creating order with data:', JSON.stringify(data, null, 2));
      
      const result = await this.ordersService.create({
        ...data,
        createdById: req?.user?.userId,
      });
      
      console.log('[OrdersController] Order created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[OrdersController] Order creation failed:', error);
      
      // Return a more detailed error message
      if (error instanceof HttpException) {
        throw error;
      }
      
      const errorMessage = error?.message || 'Unknown error occurred';
      throw new HttpException(
        `Failed to create order: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Put(':id/status')
  @Auditable({ entityType: 'Order', action: 'UPDATE_STATUS', entityIdFrom: 'params.id' })
  updateStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('storeId') storeId?: string,
  ) {
    return this.ordersService.updateStatus(id, status, storeId);
  }

  @Put(':id/lifecycle')
  updateLifecycle(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('storeId') storeId?: string,
  ) {
    return this.ordersService.updateStatus(id, status, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/items/:itemId/status')
  updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
    @Body('storeId') storeId?: string,
  ) {
    return this.ordersService.updateItemStatus(orderId, itemId, status, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/payments')
  @Auditable({
    entityType: 'Payment',
    action: 'PROCESS_PAYMENT',
    entityIdFrom: 'params.id',
    redact: ['cardNumber', 'cardCvv', 'cvv', 'pin'],
  })
  addPayment(
    @Param('id') orderId: string,
    @Body() paymentData: any,
    @Query('storeId') storeId?: string,
  ) {
    return this.ordersService.processPayment(orderId, paymentData, storeId);
  }

  @Post(':id/driver/accept')
  async acceptDriverOrder(
    @Param('id') orderId: string,
    @Body('driverId') driverId: string,
    @Body('storeId') storeId?: string,
  ) {
    try {
      return await this.ordersService.assignDriver(orderId, driverId, storeId);
    } catch (error) {
      console.error('[OrdersController] Driver accept failed:', error);
      throw new HttpException(
        error?.message || 'Failed to assign driver',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/driver/delivered')
  async markDelivered(
    @Param('id') orderId: string,
    @Body('driverId') driverId: string,
    @Body('storeId') storeId?: string,
  ) {
    try {
      return await this.ordersService.markDelivered(orderId, driverId, storeId);
    } catch (error) {
      console.error('[OrdersController] Mark delivered failed:', error);
      throw new HttpException(
        error?.message || 'Failed to mark order as delivered',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/driver/record-tip')
  async recordCashTip(
    @Param('id') orderId: string,
    @Body('driverId') driverId: string,
    @Body('tipAmount') tipAmount: number,
    @Body('emailReceipt') emailReceipt: boolean,
    @Body('customerEmail') customerEmail?: string,
  ) {
    try {
      return await this.ordersService.recordCashTip(orderId, driverId, tipAmount, emailReceipt, customerEmail);
    } catch (error) {
      console.error('[OrdersController] Record tip failed:', error);
      throw new HttpException(
        error?.message || 'Failed to record tip',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
