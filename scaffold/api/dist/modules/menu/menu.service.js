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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MenuService = class MenuService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCategories(storeId) {
        return this.prisma.category.findMany({
            where: { storeId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getProducts(params) {
        return this.prisma.product.findMany({
            where: {
                categoryId: params.categoryId || undefined,
                isActive: true,
                ...(params.storeId ? {
                    OR: [
                        { storeConfigs: { some: { storeId: params.storeId, isAvailable: true } } },
                        { category: { storeId: params.storeId } },
                    ],
                } : {}),
            },
            include: {
                sizes: true,
                category: true,
                addonSets: {
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
                }
            },
        });
    }
    async getAddOns(storeId) {
        return this.prisma.addOn.findMany({
            where: {
                isActive: true,
                ...(storeId ? { storeId } : {})
            },
            orderBy: { name: 'asc' },
        });
    }
    async getAddOnSets(storeId) {
        return this.prisma.addOnSet.findMany({
            where: {
                isActive: true,
                ...(storeId ? { storeId } : {})
            },
            include: {
                addons: {
                    include: {
                        addon: true
                    },
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async createCategory(data) {
        return this.prisma.category.create({ data });
    }
    async createProduct(data) {
        const { storeId, sizes, ...productData } = data;
        return this.prisma.product.create({
            data: {
                ...productData,
                basePrice: productData.basePrice !== undefined ? productData.basePrice : 0,
                storeConfigs: storeId ? {
                    create: [{ storeId, price: productData.basePrice || null }]
                } : undefined,
                sizes: sizes?.length ? {
                    create: sizes.map((s, idx) => ({
                        name: s.name,
                        code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
                        priceAdjustment: s.priceAdjustment || 0,
                        sortOrder: idx,
                    }))
                } : undefined,
            },
            include: { sizes: { orderBy: { sortOrder: 'asc' } }, category: true },
        });
    }
    async updateProduct(id, data) {
        const { storeId, sizes, ...productData } = data;
        if (sizes !== undefined) {
            await this.prisma.productSize.deleteMany({ where: { productId: id } });
            if (sizes.length > 0) {
                await this.prisma.productSize.createMany({
                    data: sizes.map((s, idx) => ({
                        productId: id,
                        name: s.name,
                        code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
                        priceAdjustment: s.priceAdjustment || 0,
                        sortOrder: idx,
                    })),
                });
            }
        }
        return this.prisma.product.update({
            where: { id },
            data: productData,
            include: { sizes: { orderBy: { sortOrder: 'asc' } }, category: true },
        });
    }
    async deleteProduct(id) {
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
//# sourceMappingURL=menu.service.js.map