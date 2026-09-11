import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { UpdateComboStoresDto } from './dto/combo-store.dto';

@ApiTags('Combos')
@ApiBearerAuth()
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new combo' })
  create(@Body() createComboDto: CreateComboDto) {
    return this.combosService.create(createComboDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all combos' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Filter by store' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.combosService.findAll(
      storeId,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available combos for a store' })
  @ApiQuery({ name: 'storeId', required: true, description: 'Store ID' })
  getAvailableForStore(@Query('storeId') storeId: string) {
    return this.combosService.getAvailableForStore(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a combo by ID' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  findOne(@Param('id') id: string) {
    return this.combosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a combo' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  update(@Param('id') id: string, @Body() updateComboDto: UpdateComboDto) {
    return this.combosService.update(id, updateComboDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a combo' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.combosService.remove(id);
  }

  @Post(':id/stores')
  @ApiOperation({ summary: 'Update combo store availability' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  updateStores(
    @Param('id') id: string,
    @Body() dto: UpdateComboStoresDto,
  ) {
    return this.combosService.updateStores(id, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a combo' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  duplicate(
    @Param('id') id: string,
    @Query('name') name?: string,
  ) {
    return this.combosService.duplicate(id, name);
  }
}
