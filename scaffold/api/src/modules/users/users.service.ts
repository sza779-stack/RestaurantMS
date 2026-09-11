import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async create(data: any) {
    const { storeAccess, ...userData } = data;
    return this.prisma.user.create({
      data: {
        ...userData,
        storeAccess: {
          create: storeAccess?.map((sId: string) => ({
            storeId: sId,
          })),
        },
      },
    });
  }

  async update(id: string, data: any) {
    const { storeAccess, ...userData } = data;

    if (storeAccess) {
      // Refresh store access
      await this.prisma.userStoreAccess.deleteMany({
        where: { userId: id },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        storeAccess: storeAccess ? {
          create: storeAccess.map((sId: string) => ({
            storeId: sId,
          })),
        } : undefined,
      },
    });
  }

  async findAll(params: { companyId?: string; storeId?: string }) {
    return this.prisma.user.findMany({
      where: {
        companyId: params.companyId,
        storeAccess: params.storeId ? {
          some: { storeId: params.storeId }
        } : undefined,
      },
      include: { 
        role: true,
        storeAccess: {
          include: { store: true }
        }
      },
    });
  }

  async getStoreAccess(userId: string) {
    return this.prisma.userStoreAccess.findMany({
      where: { userId },
      include: { store: true },
    });
  }
}
