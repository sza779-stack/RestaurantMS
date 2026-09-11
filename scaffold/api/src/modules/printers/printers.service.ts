import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId?: string) {
    return this.prisma.printer.findMany({
      where: { storeId },
    });
  }

  async findById(id: string) {
    return this.prisma.printer.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.printer.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.printer.update({ where: { id }, data });
  }

  async testPrint(id: string) {
    // Implementation would connect to printer and send test
    return { success: true, message: 'Test print sent' };
  }
}
