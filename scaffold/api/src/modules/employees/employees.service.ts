import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId?: string) {
    return this.prisma.employee.findMany({
      where: { storeId },
    });
  }

  async findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.employee.create({ data });
  }

  async clockIn(data: any) {
    return this.prisma.timeEntry.create({
      data: {
        ...data,
        clockIn: new Date(),
      },
    });
  }

  async clockOut(id: string) {
    return this.prisma.timeEntry.update({
      where: { id },
      data: { clockOut: new Date() },
    });
  }

  async getW2Profile(employeeId: string) {
    const profile = await this.prisma.w2Profile.findUnique({
      where: { employeeId },
    });
    if (profile && profile.ssn) {
      const { decrypt } = await import('../../common/utils/encryption.util');
      profile.ssn = decrypt(profile.ssn);
    }
    return profile;
  }

  async upsertW2Profile(employeeId: string, data: any) {
    const { encrypt } = await import('../../common/utils/encryption.util');
    const ssn = data.ssn ? encrypt(data.ssn) : undefined;
    
    return this.prisma.w2Profile.upsert({
      where: { employeeId },
      update: {
        ...data,
        ssn,
      },
      create: {
        ...data,
        employeeId,
        ssn: ssn || '',
      },
    });
  }
}
