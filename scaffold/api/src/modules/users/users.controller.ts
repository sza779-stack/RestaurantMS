import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Auditable } from '../../common/audit/audit-log.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('storeId') storeId?: string) {
    return this.usersService.findAll({ companyId, storeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Auditable({ entityType: 'User', action: 'CREATE_USER', redact: ['password'] })
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Put(':id')
  @Auditable({
    entityType: 'User',
    action: 'UPDATE_USER',
    entityIdFrom: 'params.id',
    redact: ['password'],
  })
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }
}
