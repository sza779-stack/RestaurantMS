import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly prisma: PrismaService, // Keeping just in case for nested addresses
  ) {}

  @Get()
  async findAll(
    @Query('q') q?: string,
    @Query('phone') phone?: string,
    @Query('limit') limit?: string,
  ) {
    const raw = (q || phone || '').trim();
    const normalized = raw.replace(/\D/g, '');
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const where = raw
      ? {
          OR: [
            { phone: { contains: raw } },
            ...(normalized ? [{ phone: { contains: normalized } }] : []),
            { firstName: { contains: raw, mode: 'insensitive' as const } },
            { lastName: { contains: raw, mode: 'insensitive' as const } },
            { email: { contains: raw, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    return this.customersService.findAll({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  @Get('lookup')
  async lookupByPhone(@Query('phone') phone: string) {
    if (!phone) return null;
    return this.customersService.findByPhone(phone);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/loyalty-transactions')
  async getLoyaltyTransactions(@Param('id') id: string) {
    return this.customersService.getLoyaltyTransactions(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.customersService.create({
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      appliedReferralCode: data.referralCode,
      addresses: data.addresses ? {
        create: data.addresses,
      } : undefined,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.customersService.update(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    });
  }

  @Post(':id/addresses')
  async addAddress(@Param('id') customerId: string, @Body() data: any) {
    return this.prisma.customerAddress.create({
      data: {
        customerId,
        label: data.label || 'Home',
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: data.isDefault || false,
      },
    });
  }
}
