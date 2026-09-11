import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // 1 Point = $1 spend
  // 100 Points = $1 discount
  private readonly SIGNUP_BONUS = 200;
  private readonly REFERRAL_BONUS = 500;

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }) {
    return this.prisma.customer.findMany({
      ...params,
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
        _count: { select: { referrals: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        referredBy: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
  }

  async findByPhone(phone: string) {
    const normalizedPhone = phone.replace(/\D/g, '');
    return this.prisma.customer.findFirst({
      where: {
        OR: [
          { phone: { equals: phone, mode: 'insensitive' } },
          { phone: { contains: normalizedPhone } },
        ],
      },
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
      },
    });
  }

  // Generates a unique referral code e.g. JOHN-1234
  private async generateReferralCode(firstName: string, phone: string): Promise<string> {
    const namePart = (firstName || 'GUEST').substring(0, 4).toUpperCase();
    const phonePart = phone.replace(/\D/g, '').slice(-4).padEnd(4, '0');
    let baseCode = `${namePart}-${phonePart}`;
    
    // Ensure uniqueness
    let isUnique = false;
    let code = baseCode;
    let counter = 1;
    
    while (!isUnique) {
      const existing = await this.prisma.customer.findUnique({ where: { referralCode: code } });
      if (!existing) {
        isUnique = true;
      } else {
        code = `${baseCode}-${counter}`;
        counter++;
      }
    }
    
    return code;
  }

  async create(data: Prisma.CustomerCreateInput & { appliedReferralCode?: string }) {
    const { appliedReferralCode, ...customerData } = data;
    
    const referralCode = await this.generateReferralCode(
      customerData.firstName || '',
      customerData.phone || ''
    );

    let referrer = null;
    if (appliedReferralCode) {
      referrer = await this.prisma.customer.findUnique({
        where: { referralCode: appliedReferralCode.toUpperCase() }
      });
      if (!referrer) {
        throw new BadRequestException('Invalid referral code');
      }
    }

    const newCustomer = await this.prisma.$transaction(async (tx) => {
      let initialPoints = 0;

      // 1. Create the customer
      const customerInfo = {
        ...customerData,
        referralCode,
      };

      if (referrer) {
        initialPoints = this.SIGNUP_BONUS;
        customerInfo.referredBy = { connect: { id: referrer.id } };
        customerInfo.loyaltyPoints = initialPoints;
      }

      const createdCustomer = await tx.customer.create({
        data: customerInfo,
        include: { addresses: true }
      });

      // 2. If referred, log transactions for both
      if (referrer) {
        // Log SIGNUP bonus for new customer
        await tx.loyaltyTransaction.create({
          data: {
            customerId: createdCustomer.id,
            points: initialPoints,
            type: 'SIGNUP',
            description: `Signed up using referral code from ${referrer.firstName || 'Customer'}`
          }
        });

        // Award REFERRED bonus to the referrer
        await tx.customer.update({
          where: { id: referrer.id },
          data: { loyaltyPoints: { increment: this.REFERRAL_BONUS } }
        });

        await tx.loyaltyTransaction.create({
          data: {
            customerId: referrer.id,
            points: this.REFERRAL_BONUS,
            type: 'REFERRED',
            description: `Referral bonus for inviting ${createdCustomer.firstName || createdCustomer.phone}`
          }
        });
      }

      return createdCustomer;
    });

    return newCustomer;
  }

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async getLoyaltyTransactions(customerId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
