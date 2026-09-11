import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@ApiBearerAuth()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  getCategories(@Query('storeId') storeId: string) {
    return this.menuService.getCategories(storeId);
  }

  @Get('products')
  getProducts(
    @Query('storeId') storeId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.menuService.getProducts({ storeId, categoryId });
  }

  @Get('addons')
  getAddOns(@Query('storeId') storeId?: string) {
    return this.menuService.getAddOns(storeId);
  }

  @Get('addon-sets')
  getAddOnSets(@Query('storeId') storeId?: string) {
    return this.menuService.getAddOnSets(storeId);
  }

  @Post('categories')
  createCategory(@Body() data: any) {
    return this.menuService.createCategory(data);
  }

  @Post('products')
  createProduct(@Body() data: any) {
    return this.menuService.createProduct(data);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: any) {
    return this.menuService.updateProduct(id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.menuService.deleteProduct(id);
  }
}
