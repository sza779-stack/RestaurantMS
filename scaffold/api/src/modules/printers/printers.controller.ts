import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrintersService } from './printers.service';

@ApiTags('Printers')
@ApiBearerAuth()
@Controller('printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.printersService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.printersService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.printersService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.printersService.update(id, data);
  }

  @Post(':id/test')
  testPrint(@Param('id') id: string) {
    return this.printersService.testPrint(id);
  }
}
