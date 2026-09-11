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
exports.AddonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AddonsService = class AddonsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAddOn(dto) {
        const { applicableItemTypes, ...data } = dto;
        return this.prisma.addOn.create({
            data: {
                ...data,
                price: dto.price !== undefined ? new client_1.Prisma.Decimal(dto.price) : 0,
                sizePrices: dto.sizePrices || {},
                applicableItemTypes: applicableItemTypes,
            },
        });
    }
    async findAllAddOns(storeId) {
        return this.prisma.addOn.findMany({
            where: {
                storeId,
                isActive: true
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOneAddOn(id) {
        const addon = await this.prisma.addOn.findUnique({
            where: { id },
            include: {
                addonSets: {
                    include: {
                        set: true
                    }
                }
            },
        });
        if (!addon)
            throw new common_1.NotFoundException(`AddOn with ID ${id} not found`);
        return addon;
    }
    async updateAddOn(id, dto) {
        const { applicableItemTypes, ...data } = dto;
        return this.prisma.addOn.update({
            where: { id },
            data: {
                ...data,
                price: dto.price !== undefined ? new client_1.Prisma.Decimal(dto.price) : undefined,
                sizePrices: dto.sizePrices !== undefined ? dto.sizePrices : undefined,
                applicableItemTypes: applicableItemTypes ? applicableItemTypes : undefined,
            },
        });
    }
    async removeAddOn(id) {
        return this.prisma.addOn.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async createAddOnSet(dto) {
        const { addons, applicableItemTypes, ...setData } = dto;
        return this.prisma.addOnSet.create({
            data: {
                ...setData,
                storeId: setData.storeId || '',
                applicableItemTypes: applicableItemTypes,
                addons: addons ? {
                    create: addons.map(a => ({
                        addonId: a.addonId,
                        displayOrder: a.displayOrder || 0,
                        priceOverride: a.priceOverride !== undefined ? new client_1.Prisma.Decimal(a.priceOverride) : null,
                    })),
                } : undefined,
            },
            include: {
                addons: {
                    include: {
                        addon: true
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            },
        });
    }
    async findAllAddOnSets(storeId) {
        return this.prisma.addOnSet.findMany({
            where: {
                storeId,
                isActive: true
            },
            include: {
                addons: {
                    include: {
                        addon: true
                    },
                    orderBy: { displayOrder: 'asc' }
                },
                products: {
                    include: {
                        product: {
                            select: { id: true, name: true, category: { select: { id: true, name: true } } }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOneAddOnSet(id) {
        const set = await this.prisma.addOnSet.findUnique({
            where: { id },
            include: {
                addons: {
                    include: {
                        addon: true
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            },
        });
        if (!set)
            throw new common_1.NotFoundException(`AddOnSet with ID ${id} not found`);
        return set;
    }
    async updateAddOnSet(id, dto) {
        const { addons, applicableItemTypes, ...setData } = dto;
        if (addons) {
            await this.prisma.setAddOn.deleteMany({ where: { setId: id } });
        }
        return this.prisma.addOnSet.update({
            where: { id },
            data: {
                ...setData,
                applicableItemTypes: applicableItemTypes ? applicableItemTypes : undefined,
                addons: addons ? {
                    create: addons.map(a => ({
                        addonId: a.addonId,
                        displayOrder: a.displayOrder || 0,
                        priceOverride: a.priceOverride !== undefined ? new client_1.Prisma.Decimal(a.priceOverride) : null,
                    })),
                } : undefined,
            },
            include: {
                addons: {
                    include: {
                        addon: true
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            },
        });
    }
    async removeAddOnSet(id) {
        return this.prisma.addOnSet.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async linkSetToProduct(productId, addonSetId, displayOrder = 0) {
        return this.prisma.productAddOnSet.upsert({
            where: {
                productId_addonSetId: { productId, addonSetId }
            },
            update: { displayOrder },
            create: { productId, addonSetId, displayOrder }
        });
    }
    async unlinkSetFromProduct(productId, addonSetId) {
        return this.prisma.productAddOnSet.delete({
            where: {
                productId_addonSetId: { productId, addonSetId }
            }
        });
    }
    async getProductAddOnSets(productId) {
        return this.prisma.productAddOnSet.findMany({
            where: { productId },
            include: {
                addonSet: {
                    include: {
                        addons: {
                            include: {
                                addon: true
                            },
                            orderBy: { displayOrder: 'asc' }
                        }
                    }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });
    }
};
exports.AddonsService = AddonsService;
exports.AddonsService = AddonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddonsService);
//# sourceMappingURL=addons.service.js.map