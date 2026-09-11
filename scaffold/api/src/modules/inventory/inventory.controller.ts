import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // Items
  @Get('items')
  async getItems(
    @Query('storeId') storeId: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getItems(storeId, {
      category,
      lowStock: lowStock === 'true',
      search,
    });
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string, @Query('storeId') storeId: string) {
    return this.inventoryService.getItem(id, storeId);
  }

  @Get('items/by-barcode/:barcode')
  async getItemByBarcode(
    @Param('barcode') barcode: string,
    @Query('storeId') storeId: string,
  ) {
    return this.inventoryService.getItemByBarcode(barcode, storeId);
  }

  @Post('items')
  async createItem(@Body() data: any) {
    return this.inventoryService.createItem(data);
  }

  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() data: any,
  ) {
    return this.inventoryService.updateItem(id, storeId, data);
  }

  @Delete('items/:id')
  async deleteItem(@Param('id') id: string, @Query('storeId') storeId: string) {
    return this.inventoryService.deleteItem(id, storeId);
  }

  // Stock Movements
  @Get('movements')
  async getStockMovements(
    @Query('itemId') itemId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getStockMovements({
      itemId,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Post('movements')
  async createStockMovement(@Body() data: any) {
    return this.inventoryService.createStockMovement(data);
  }

  // Barcode operations
  @Post('receive-barcode')
  async receiveByBarcode(@Body() data: any) {
    return this.inventoryService.receiveByBarcode(data);
  }

  // Stock levels
  @Get('stock-levels')
  async getStockLevels(@Query('storeId') storeId: string) {
    return this.inventoryService.getStockLevels(storeId);
  }

  // Purchase Orders
  @Get('purchase-orders')
  async getPurchaseOrders(
    @Query('storeId') storeId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.inventoryService.getPurchaseOrders({ storeId, status, vendorId });
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Body() data: any) {
    return this.inventoryService.createPurchaseOrder(data);
  }

  @Post('purchase-orders/:id/receive')
  async receivePurchaseOrder(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.inventoryService.receivePurchaseOrder(id, data);
  }

  // Vendors
  @Get('vendors')
  async getVendors(@Query('companyId') companyId: string) {
    return this.inventoryService.getVendors(companyId);
  }

  @Post('vendors')
  async createVendor(@Body() data: any) {
    return this.inventoryService.createVendor(data);
  }
}
