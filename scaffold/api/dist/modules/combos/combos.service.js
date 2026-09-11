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
exports.CombosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let CombosService = class CombosService {
    constructor(prisma, websocketGateway) {
        this.prisma = prisma;
        this.websocketGateway = websocketGateway;
    }
    async validateComboItems(items, storeId) {
        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            if (!item.productId && !item.categoryId) {
                throw new common_1.BadRequestException(`Combo item ${index + 1} must have either productId or categoryId`);
            }
            if (item.productId && item.categoryId) {
                throw new common_1.BadRequestException(`Combo item ${index + 1} cannot have both productId and categoryId`);
            }
            if (item.productId) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                    include: {
                        category: { select: { id: true, storeId: true } },
                    },
                });
                if (!product || !product.category || product.category.storeId !== storeId) {
                    throw new common_1.BadRequestException(`Combo item ${index + 1} has invalid productId for this store`);
                }
            }
            if (item.categoryId) {
                const category = await this.prisma.category.findFirst({
                    where: { id: item.categoryId, storeId },
                    select: { id: true },
                });
                if (!category) {
                    throw new common_1.BadRequestException(`Combo item ${index + 1} has invalid categoryId for this store`);
                }
            }
        }
    }
    async create(createComboDto) {
        const { items, ...comboData } = createComboDto;
        await this.validateComboItems(items, comboData.storeId);
        const combo = await this.prisma.combo.create({
            data: {
                ...comboData,
                basePrice: new library_1.Decimal(comboData.basePrice),
                retailValue: new library_1.Decimal(comboData.retailValue),
                availableFrom: comboData.availableFrom ? new Date(comboData.availableFrom) : null,
                availableTo: comboData.availableTo ? new Date(comboData.availableTo) : null,
                items: {
                    create: items.map(item => ({
                        ...item,
                        productId: item.productId || null,
                        categoryId: item.categoryId || null,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, basePrice: true },
                        },
                    },
                },
                stores: true,
            },
        });
        const rooms = [`online:${comboData.storeId}`, `admin:${comboData.storeId}`, `store:${comboData.storeId}`];
        rooms.forEach(room => this.websocketGateway.server?.to(room).emit('menu:updated', { type: 'combo', id: combo.id, action: 'create' }));
        return combo;
    }
    async findAll(storeId, isActive) {
        const where = {};
        if (storeId) {
            where.storeId = storeId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        return this.prisma.combo.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, basePrice: true },
                        },
                    },
                },
                _count: {
                    select: { stores: true },
                },
            },
        });
    }
    async findOne(id) {
        const combo = await this.prisma.combo.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                basePrice: true,
                                sizes: true,
                            },
                        },
                    },
                },
                stores: {
                    include: {
                        store: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });
        if (!combo) {
            throw new common_1.NotFoundException(`Combo with ID ${id} not found`);
        }
        return combo;
    }
    async update(id, updateComboDto) {
        const existing = await this.findOne(id);
        const { items, ...comboData } = updateComboDto;
        const updateData = { ...comboData };
        if (comboData.basePrice !== undefined) {
            updateData.basePrice = new library_1.Decimal(comboData.basePrice);
        }
        if (comboData.retailValue !== undefined) {
            updateData.retailValue = new library_1.Decimal(comboData.retailValue);
        }
        if (comboData.availableFrom !== undefined) {
            updateData.availableFrom = comboData.availableFrom ? new Date(comboData.availableFrom) : null;
        }
        if (comboData.availableTo !== undefined) {
            updateData.availableTo = comboData.availableTo ? new Date(comboData.availableTo) : null;
        }
        if (items && items.length > 0) {
            await this.validateComboItems(items, existing.storeId);
            await this.prisma.comboItem.deleteMany({ where: { comboId: id } });
            updateData.items = {
                create: items.map(item => ({
                    ...item,
                    productId: item.productId || null,
                    categoryId: item.categoryId || null,
                })),
            };
        }
        const combo = await this.prisma.combo.update({
            where: { id },
            data: updateData,
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, basePrice: true },
                        },
                    },
                },
                stores: true,
            },
        });
        const rooms = [`online:${combo.storeId}`, `admin:${combo.storeId}`, `store:${combo.storeId}`];
        rooms.forEach(room => this.websocketGateway.server?.to(room).emit('menu:updated', { type: 'combo', id: combo.id, action: 'update' }));
        return combo;
    }
    async remove(id) {
        const combo = await this.findOne(id);
        await this.prisma.combo.delete({ where: { id } });
        const rooms = [`online:${combo.storeId}`, `admin:${combo.storeId}`, `store:${combo.storeId}`];
        rooms.forEach(room => this.websocketGateway.server?.to(room).emit('menu:updated', { type: 'combo', id, action: 'delete' }));
        return { success: true, message: 'Combo deleted successfully' };
    }
    async updateStores(id, dto) {
        await this.findOne(id);
        await this.prisma.comboStore.deleteMany({ where: { comboId: id } });
        if (dto.stores && dto.stores.length > 0) {
            await this.prisma.comboStore.createMany({
                data: dto.stores.map(store => ({
                    comboId: id,
                    storeId: store.storeId,
                    price: store.price ? new library_1.Decimal(store.price) : null,
                    isAvailable: store.isAvailable ?? true,
                    availableFrom: store.availableFrom ? new Date(store.availableFrom) : null,
                    availableTo: store.availableTo ? new Date(store.availableTo) : null,
                })),
            });
        }
        return this.findOne(id);
    }
    async getAvailableForStore(storeId) {
        const now = new Date();
        const currentDay = now.getDay();
        const combos = await this.prisma.combo.findMany({
            where: {
                isActive: true,
                OR: [
                    { storeId },
                    { stores: { some: { storeId, isAvailable: true } } },
                ],
                AND: [
                    {
                        OR: [
                            { availableFrom: null },
                            { availableFrom: { lte: now } },
                        ],
                    },
                    {
                        OR: [
                            { availableTo: null },
                            { availableTo: { gte: now } },
                        ],
                    },
                    {
                        OR: [
                            { availableDays: { isEmpty: true } },
                            { availableDays: { has: currentDay } },
                        ],
                    },
                ],
            },
            orderBy: { sortOrder: 'asc' },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                basePrice: true,
                                sizes: true,
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
                        },
                    },
                },
                stores: true,
            },
        });
        const categoryIds = [...new Set(combos.flatMap(c => c.items.map(i => i.categoryId).filter(Boolean)))];
        const categories = categoryIds.length > 0
            ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
            : [];
        const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
        return combos.map(combo => {
            const storeConfig = combo.stores?.find(s => s.storeId === storeId);
            const effectivePrice = storeConfig?.price || combo.basePrice;
            return {
                ...combo,
                items: combo.items.map(item => ({
                    ...item,
                    category: item.categoryId ? catMap[item.categoryId] || null : null,
                })),
                effectivePrice,
                savings: new library_1.Decimal(combo.retailValue).minus(effectivePrice).toNumber(),
            };
        });
    }
    async duplicate(id, newName) {
        const existing = await this.findOne(id);
        const duplicated = await this.prisma.combo.create({
            data: {
                storeId: existing.storeId,
                name: newName || `${existing.name} (Copy)`,
                description: existing.description,
                sku: existing.sku ? `${existing.sku}-COPY` : null,
                basePrice: existing.basePrice,
                retailValue: existing.retailValue,
                imageUrl: existing.imageUrl,
                galleryUrls: existing.galleryUrls,
                isActive: false,
                isFeatured: existing.isFeatured,
                sortOrder: existing.sortOrder,
                prepTimeMinutes: existing.prepTimeMinutes,
                kitchenStation: existing.kitchenStation,
                availableFrom: existing.availableFrom,
                availableTo: existing.availableTo,
                availableDays: existing.availableDays,
                items: {
                    create: existing.items.map((item) => ({
                        productId: item.productId,
                        categoryId: item.categoryId,
                        name: item.name,
                        quantity: item.quantity,
                        componentType: item.componentType,
                        selectionRules: item.selectionRules,
                        allowSizeSelection: item.allowSizeSelection,
                        defaultSizeId: item.defaultSizeId,
                        allowedSizeIds: item.allowedSizeIds,
                        allowCustomization: item.allowCustomization,
                        maxIncludedToppings: item.maxIncludedToppings,
                        freeModifierGroups: item.freeModifierGroups,
                        allowModifiers: item.allowModifiers,
                        includedModifierIds: item.includedModifierIds,
                        isProductFixed: item.isProductFixed,
                        productGroupLabel: item.productGroupLabel,
                        sortOrder: item.sortOrder,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, basePrice: true },
                        },
                    },
                },
            },
        });
        return duplicated;
    }
};
exports.CombosService = CombosService;
exports.CombosService = CombosService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => websocket_gateway_1.WebsocketGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.WebsocketGateway])
], CombosService);
//# sourceMappingURL=combos.service.js.map