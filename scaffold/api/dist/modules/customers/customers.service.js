"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.SIGNUP_BONUS = 200;
        this.REFERRAL_BONUS = 500;
    }
    async findAll(params) {
        return this.prisma.customer.findMany({
            ...params,
            include: {
                addresses: { orderBy: { isDefault: 'desc' } },
                _count: { select: { referrals: true } },
            },
        });
    }
    async findOne(id) {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                addresses: true,
                referredBy: { select: { firstName: true, lastName: true, phone: true } },
            },
        });
    }
    async findByPhone(phone) {
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
    async generateReferralCode(firstName, phone) {
        const namePart = (firstName || 'GUEST').substring(0, 4).toUpperCase();
        const phonePart = phone.replace(/\D/g, '').slice(-4).padEnd(4, '0');
        let baseCode = `${namePart}-${phonePart}`;
        let isUnique = false;
        let code = baseCode;
        let counter = 1;
        while (!isUnique) {
            const existing = await this.prisma.customer.findUnique({ where: { referralCode: code } });
            if (!existing) {
                isUnique = true;
            }
            else {
                code = `${baseCode}-${counter}`;
                counter++;
            }
        }
        return code;
    }
    async create(data) {
        const { appliedReferralCode, ...customerData } = data;
        const referralCode = await this.generateReferralCode(customerData.firstName || '', customerData.phone || '');
        let referrer = null;
        if (appliedReferralCode) {
            referrer = await this.prisma.customer.findUnique({
                where: { referralCode: appliedReferralCode.toUpperCase() }
            });
            if (!referrer) {
                throw new common_1.BadRequestException('Invalid referral code');
            }
        }
        const newCustomer = await this.prisma.$transaction(async (tx) => {
            let initialPoints = 0;
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
            if (referrer) {
                await tx.loyaltyTransaction.create({
                    data: {
                        customerId: createdCustomer.id,
                        points: initialPoints,
                        type: 'SIGNUP',
                        description: `Signed up using referral code from ${referrer.firstName || 'Customer'}`
                    }
                });
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
    async update(id, data) {
        return this.prisma.customer.update({
            where: { id },
            data,
        });
    }
    async getLoyaltyTransactions(customerId) {
        return this.prisma.loyaltyTransaction.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map