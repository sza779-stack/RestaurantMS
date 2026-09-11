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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let CustomersController = class CustomersController {
    constructor(customersService, prisma) {
        this.customersService = customersService;
        this.prisma = prisma;
    }
    async findAll(q, phone, limit) {
        const raw = (q || phone || '').trim();
        const normalized = raw.replace(/\D/g, '');
        const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
        const where = raw
            ? {
                OR: [
                    { phone: { contains: raw } },
                    ...(normalized ? [{ phone: { contains: normalized } }] : []),
                    { firstName: { contains: raw, mode: 'insensitive' } },
                    { lastName: { contains: raw, mode: 'insensitive' } },
                    { email: { contains: raw, mode: 'insensitive' } },
                ],
            }
            : undefined;
        return this.customersService.findAll({
            where,
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
    async lookupByPhone(phone) {
        if (!phone)
            return null;
        return this.customersService.findByPhone(phone);
    }
    async findById(id) {
        return this.customersService.findOne(id);
    }
    async getLoyaltyTransactions(id) {
        return this.customersService.getLoyaltyTransactions(id);
    }
    async create(data) {
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
    async update(id, data) {
        return this.customersService.update(id, {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
        });
    }
    async addAddress(customerId, data) {
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
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('phone')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('lookup'),
    __param(0, (0, common_1.Query)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "lookupByPhone", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/loyalty-transactions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getLoyaltyTransactions", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/addresses'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "addAddress", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService,
        prisma_service_1.PrismaService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map