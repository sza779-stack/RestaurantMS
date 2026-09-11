import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AddonsService } from './addons.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { CreateAddOnSetDto, UpdateAddOnSetDto } from './dto/addon-set.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AddOns')
@ApiBearerAuth()
@Controller('addons')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AddOn' })
  createAddOn(@Body() createAddOnDto: CreateAddOnDto) {
    return this.addonsService.createAddOn(createAddOnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active AddOns' })
  findAllAddOns(@Query('storeId') storeId?: string) {
    return this.addonsService.findAllAddOns(storeId);
  }

  @Get('sets')
  @ApiOperation({ summary: 'Get all active AddOnSets' })
  findAllAddOnSets(@Query('storeId') storeId?: string) {
    return this.addonsService.findAllAddOnSets(storeId);
  }

  @Get('sets/:id')
  @ApiOperation({ summary: 'Get a specific AddOnSet' })
  findOneAddOnSet(@Param('id') id: string) {
    return this.addonsService.findOneAddOnSet(id);
  }

  @Post('sets')
  @ApiOperation({ summary: 'Create a new AddOnSet' })
  createAddOnSet(@Body() createAddOnSetDto: CreateAddOnSetDto) {
    return this.addonsService.createAddOnSet(createAddOnSetDto);
  }

  @Patch('sets/:id')
  @ApiOperation({ summary: 'Update an AddOnSet' })
  updateAddOnSet(@Param('id') id: string, @Body() updateAddOnSetDto: UpdateAddOnSetDto) {
    return this.addonsService.updateAddOnSet(id, updateAddOnSetDto);
  }

  @Delete('sets/:id')
  @ApiOperation({ summary: 'Soft delete an AddOnSet' })
  removeAddOnSet(@Param('id') id: string) {
    return this.addonsService.removeAddOnSet(id);
  }

  @Post('product/:productId/link/:setId')
  @ApiOperation({ summary: 'Link an AddOnSet to a Product' })
  linkSetToProduct(
    @Param('productId') productId: string,
    @Param('setId') setId: string,
    @Body('displayOrder') displayOrder?: number
  ) {
    return this.addonsService.linkSetToProduct(productId, setId, displayOrder);
  }

  @Delete('product/:productId/unlink/:setId')
  @ApiOperation({ summary: 'Unlink an AddOnSet from a Product' })
  unlinkSetFromProduct(
    @Param('productId') productId: string,
    @Param('setId') setId: string
  ) {
    return this.addonsService.unlinkSetFromProduct(productId, setId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all AddOnSets for a Product' })
  getProductAddOnSets(@Param('productId') productId: string) {
    return this.addonsService.getProductAddOnSets(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific AddOn' })
  findOneAddOn(@Param('id') id: string) {
    return this.addonsService.findOneAddOn(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an AddOn' })
  updateAddOn(@Param('id') id: string, @Body() updateAddOnDto: UpdateAddOnDto) {
    return this.addonsService.updateAddOn(id, updateAddOnDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an AddOn' })
  removeAddOn(@Param('id') id: string) {
    return this.addonsService.removeAddOn(id);
  }
}
