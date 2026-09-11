import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto, DriverLoginDto, UpdateLocationDto } from './dto/create-driver.dto';
import { DriverStatus } from '@prisma/client';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ==================== CRUD ====================

  @Post()
  create(@Body() data: CreateDriverDto) {
    return this.driversService.create(data);
  }

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.driversService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateDriverDto) {
    return this.driversService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  // ==================== AUTHENTICATION ====================

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() data: DriverLoginDto) {
    return this.driversService.login(data);
  }

  @Post('auth/validate')
  @HttpCode(HttpStatus.OK)
  validate(
    @Body('driverId') driverId: string,
    @Body('pin') pin: string,
  ) {
    return this.driversService.validateDriver(driverId, pin);
  }

  // ==================== LOCATION ====================

  @Post(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() location: UpdateLocationDto,
  ) {
    return this.driversService.updateLocation(id, location);
  }

  // ==================== STATUS ====================

  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: DriverStatus,
  ) {
    return this.driversService.updateStatus(id, status);
  }

  @Post(':id/online')
  goOnline(@Param('id') id: string) {
    return this.driversService.updateStatus(id, DriverStatus.ONLINE);
  }

  @Post(':id/offline')
  goOffline(@Param('id') id: string) {
    return this.driversService.updateStatus(id, DriverStatus.OFFLINE);
  }

  @Post(':id/break')
  goOnBreak(@Param('id') id: string) {
    return this.driversService.updateStatus(id, DriverStatus.ON_BREAK);
  }

  // ==================== ORDERS ====================

  @Get(':id/orders')
  getOrders(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.driversService.getDriverOrders(id, status);
  }

  @Get(':id/active-delivery')
  getActiveDelivery(@Param('id') id: string) {
    return this.driversService.getActiveDelivery(id);
  }

  @Get(':id/active-deliveries')
  getActiveDeliveries(@Param('id') id: string) {
    return this.driversService.getActiveDeliveries(id);
  }

  @Get(':id/active-count')
  getActiveDeliveryCount(@Param('id') id: string) {
    return this.driversService.getActiveDeliveryCount(id);
  }

  @Post(':id/assign-order')
  assignOrder(
    @Param('id') driverId: string,
    @Body('orderId') orderId: string,
    @Body('storeId') storeId?: string,
  ) {
    return this.driversService.assignOrderToDriver(orderId, driverId, storeId);
  }

  @Post(':id/assign-orders')
  assignMultipleOrders(
    @Param('id') driverId: string,
    @Body('orderIds') orderIds: string[],
    @Body('storeId') storeId?: string,
  ) {
    return this.driversService.assignMultipleOrdersToDriver(orderIds, driverId, storeId);
  }

  @Post('unassign-orders')
  unassignMultipleOrders(
    @Body('orderIds') orderIds: string[],
    @Body('storeId') storeId?: string,
  ) {
    return this.driversService.unassignMultipleOrders(orderIds, storeId);
  }

  @Post('reset-active')
  resetActiveDeliveries(@Body('storeId') storeId?: string) {
    return this.driversService.resetActiveDeliveries(storeId);
  }

  @Post('seed-test-data')
  seedTestData(@Body('storeId') storeId?: string) {
    return this.driversService.resetAndSeedDispatchTestData(storeId);
  }

  // ==================== STATS ====================

  @Get(':id/stats')
  getStats(
    @Param('id') id: string,
    @Query('period') period: 'today' | 'week' | 'month' = 'today',
  ) {
    return this.driversService.getDriverStats(id, period);
  }
}
