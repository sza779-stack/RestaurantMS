import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.employeesService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.employeesService.create(data);
  }

  @Post('clock-in')
  clockIn(@Body() data: any) {
    return this.employeesService.clockIn(data);
  }

  @Put('clock-out/:id')
  clockOut(@Param('id') id: string) {
    return this.employeesService.clockOut(id);
  }
  @Get(':id/w2-profile')
  getW2Profile(@Param('id') id: string) {
    return this.employeesService.getW2Profile(id);
  }

  @Post(':id/w2-profile')
  upsertW2Profile(@Param('id') id: string, @Body() data: any) {
    return this.employeesService.upsertW2Profile(id, data);
  }
}

