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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getItems(storeId, params) {
        const where = { storeId };
        if (params?.category && params.category !== 'all') {
            where.category = params.category;
        }
        if (params?.lowStock) {
            where.currentStock = {
                lte: { equals: 0 },
            };
        }
        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { sku: { contains: params.search, mode: 'insensitive' } },
                { barcode: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const items = await this.prisma.inventoryItem.findMany({
            where,
            include: {
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                vendorItems: {
                    include: {
                        vendor: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return items.map(item => ({
            ...item,
            currentStock: Number(item.currentStock),
            minStockLevel: Number(item.minStockLevel),
            maxStockLevel: item.maxStockLevel ? Number(item.maxStockLevel) : null,
            lastCost: Number(item.lastCost || 0),
            avgCost: Number(item.avgCost || 0),
            stockValue: Number(item.currentStock) * Number(item.lastCost || 0),
            isLowStock: Number(item.currentStock) <= Number(item.minStockLevel),
            stockPercentage: Number(item.minStockLevel) > 0
                ? (Number(item.currentStock) / Number(item.minStockLevel)) * 100
                : 0,
        }));
    }
    async getItem(id, storeId) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, storeId },
            include: {
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                vendorItems: {
                    include: {
                        vendor: true,
                    },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return {
            ...item,
            currentStock: Number(item.currentStock),
            minStockLevel: Number(item.minStockLevel),
            maxStockLevel: item.maxStockLevel ? Number(item.maxStockLevel) : null,
            lastCost: Number(item.lastCost || 0),
            avgCost: Number(item.avgCost || 0),
        };
    }
    async getItemByBarcode(barcode, storeId) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { barcode, storeId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Item not found with this barcode');
        }
        return {
            ...item,
            currentStock: Number(item.currentStock),
            minStockLevel: Number(item.minStockLevel),
            lastCost: Number(item.lastCost || 0),
            avgCost: Number(item.avgCost || 0),
        };
    }
    async createItem(data) {
        const existingSku = await this.prisma.inventoryItem.findFirst({
            where: { sku: data.sku, storeId: data.storeId },
        });
        if (existingSku) {
            throw new common_1.BadRequestException('SKU already exists');
        }
        if (data.barcode) {
            const existingBarcode = await this.prisma.inventoryItem.findFirst({
                where: { barcode: data.barcode, storeId: data.storeId },
            });
            if (existingBarcode) {
                throw new common_1.BadRequestException('Barcode already exists');
            }
        }
        const item = await this.prisma.inventoryItem.create({
            data: {
                storeId: data.storeId,
                name: data.name,
                sku: data.sku,
                barcode: data.barcode,
                category: data.category,
                unit: data.unit,
                currentStock: data.currentStock || 0,
                minStockLevel: data.minStockLevel || 0,
                maxStockLevel: data.maxStockLevel,
                lastCost: data.lastCost || 0,
                trackInventory: data.trackInventory !== false,
            },
        });
        if (data.currentStock && data.currentStock > 0) {
            await this.createStockMovement({
                inventoryItemId: item.id,
                type: 'INITIAL',
                quantity: data.currentStock,
                notes: 'Initial stock',
                unitCost: data.lastCost || 0,
            });
        }
        return item;
    }
    async updateItem(id, storeId, data) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, storeId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        if (data.barcode && data.barcode !== item.barcode) {
            const existingBarcode = await this.prisma.inventoryItem.findFirst({
                where: { barcode: data.barcode, storeId, NOT: { id } },
            });
            if (existingBarcode) {
                throw new common_1.BadRequestException('Barcode already exists');
            }
        }
        return this.prisma.inventoryItem.update({
            where: { id },
            data: {
                name: data.name,
                barcode: data.barcode,
                category: data.category,
                unit: data.unit,
                minStockLevel: data.minStockLevel,
                maxStockLevel: data.maxStockLevel,
                lastCost: data.lastCost,
                trackInventory: data.trackInventory,
            },
        });
    }
    async deleteItem(id, storeId) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, storeId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const movementsCount = await this.prisma.stockMovement.count({
            where: { inventoryItemId: id },
        });
        if (movementsCount > 0) {
            throw new common_1.BadRequestException('Cannot delete item with stock history');
        }
        return this.prisma.inventoryItem.delete({
            where: { id },
        });
    }
    async createStockMovement(data) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id: data.inventoryItemId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const currentStock = Number(item.currentStock);
        let newStock = currentStock;
        switch (data.type) {
            case 'PURCHASE':
            case 'TRANSFER_IN':
            case 'INITIAL':
                newStock = currentStock + data.quantity;
                break;
            case 'SALE':
            case 'WASTE':
            case 'TRANSFER_OUT':
                newStock = currentStock - data.quantity;
                if (newStock < 0) {
                    throw new common_1.BadRequestException('Insufficient stock for this operation');
                }
                break;
            case 'ADJUSTMENT':
                newStock = data.quantity;
                break;
            default:
                throw new common_1.BadRequestException('Invalid stock movement type');
        }
        const unitCost = data.unitCost || item.lastCost || 0;
        const quantity = data.type === 'SALE' || data.type === 'WASTE' || data.type === 'TRANSFER_OUT'
            ? -data.quantity
            : data.quantity;
        const totalCost = Math.abs(quantity) * Number(unitCost);
        const movement = await this.prisma.stockMovement.create({
            data: {
                inventoryItemId: data.inventoryItemId,
                type: data.type,
                quantity: quantity,
                unitCost: unitCost,
                totalCost,
                referenceId: data.referenceId,
                referenceType: data.referenceType,
                notes: data.notes,
            },
        });
        await this.prisma.inventoryItem.update({
            where: { id: data.inventoryItemId },
            data: {
                currentStock: newStock,
                lastCost: unitCost,
            },
        });
        return movement;
    }
    async receiveByBarcode(data) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { barcode: data.barcode, storeId: data.storeId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Item not found with barcode: ' + data.barcode);
        }
        return this.createStockMovement({
            inventoryItemId: item.id,
            type: 'PURCHASE',
            quantity: data.quantity,
            notes: data.notes || 'Barcode receive',
            unitCost: data.unitCost,
        });
    }
    async getStockMovements(params) {
        const where = {};
        if (params?.itemId) {
            where.inventoryItemId = params.itemId;
        }
        if (params?.type && params.type !== 'all') {
            where.type = params.type;
        }
        if (params?.startDate || params?.endDate) {
            where.createdAt = {};
            if (params.startDate) {
                where.createdAt.gte = params.startDate;
            }
            if (params.endDate) {
                where.createdAt.lte = params.endDate;
            }
        }
        const [movements, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                where,
                include: {
                    inventoryItem: {
                        select: {
                            name: true,
                            sku: true,
                            unit: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: params?.limit || 50,
                skip: params?.offset || 0,
            }),
            this.prisma.stockMovement.count({ where }),
        ]);
        return {
            movements: movements.map(m => ({
                ...m,
                quantity: Number(m.quantity),
                unitCost: Number(m.unitCost || 0),
                totalCost: Number(m.totalCost || 0),
            })),
            total,
        };
    }
    async getStockLevels(storeId) {
        const items = await this.prisma.inventoryItem.findMany({
            where: { storeId },
        });
        const totalItems = items.length;
        const lowStockItems = items.filter(i => Number(i.currentStock) <= Number(i.minStockLevel));
        const outOfStockItems = items.filter(i => Number(i.currentStock) === 0);
        const totalStockValue = items.reduce((sum, item) => {
            return sum + (Number(item.currentStock) * Number(item.lastCost || 0));
        }, 0);
        return {
            totalItems,
            lowStockCount: lowStockItems.length,
            outOfStockCount: outOfStockItems.length,
            totalStockValue,
            categories: await this.getCategoryBreakdown(storeId),
        };
    }
    async getCategoryBreakdown(storeId) {
        const items = await this.prisma.inventoryItem.groupBy({
            by: ['category'],
            where: { storeId },
            _sum: {
                currentStock: true,
            },
            _count: {
                id: true,
            },
        });
        return items.map(item => ({
            category: item.category || 'Uncategorized',
            itemCount: item._count.id,
            totalStock: Number(item._sum.currentStock || 0),
        }));
    }
    async deductStockForOrder(orderId, storeId, items) {
        const results = [];
        for (const item of items) {
            const recipe = await this.prisma.recipe.findFirst({
                where: { productId: item.productId },
                include: {
                    ingredients: {
                        include: {
                            inventoryItem: true,
                        },
                    },
                },
            });
            if (recipe) {
                for (const ingredient of recipe.ingredients) {
                    if (ingredient.inventoryItem && ingredient.inventoryItem.trackInventory) {
                        try {
                            const quantity = Number(ingredient.quantity) * item.quantity;
                            const movement = await this.createStockMovement({
                                inventoryItemId: ingredient.inventoryItemId,
                                type: 'SALE',
                                quantity,
                                notes: `Order ${orderId}`,
                                referenceId: orderId,
                                referenceType: 'ORDER',
                            });
                            results.push({
                                item: ingredient.inventoryItem.name,
                                success: true,
                                quantity,
                                movement
                            });
                        }
                        catch (error) {
                            results.push({
                                item: ingredient.inventoryItem?.name || 'Unknown',
                                success: false,
                                error: error.message
                            });
                        }
                    }
                }
            }
        }
        return results;
    }
    async getPurchaseOrders(params) {
        const where = {};
        if (params?.storeId) {
            where.storeId = params.storeId;
        }
        if (params?.status && params.status !== 'all') {
            where.status = params.status;
        }
        if (params?.vendorId) {
            where.vendorId = params.vendorId;
        }
        return this.prisma.purchaseOrder.findMany({
            where,
            include: {
                vendor: true,
                items: true,
            },
            orderBy: { orderDate: 'desc' },
        });
    }
    async createPurchaseOrder(data) {
        const poNumber = await this.generatePONumber();
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = 0;
        const total = subtotal + taxAmount;
        return this.prisma.purchaseOrder.create({
            data: {
                storeId: data.storeId,
                vendorId: data.vendorId,
                poNumber,
                status: 'DRAFT',
                subtotal,
                taxAmount,
                total,
                expectedDate: data.expectedDate,
                items: {
                    create: data.items.map(item => ({
                        inventoryItemId: item.inventoryItemId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                vendor: true,
                items: true,
            },
        });
    }
    async receivePurchaseOrder(orderId, data) {
        const order = await this.prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Purchase order not found');
        }
        for (const receivedItem of data.items) {
            const orderItem = order.items.find(i => i.id === receivedItem.itemId);
            if (orderItem) {
                const newReceivedQty = Number(orderItem.receivedQty || 0) + receivedItem.receivedQuantity;
                await this.prisma.purchaseOrderItem.update({
                    where: { id: receivedItem.itemId },
                    data: {
                        receivedQty: newReceivedQty,
                    },
                });
                if (receivedItem.receivedQuantity > 0) {
                    await this.createStockMovement({
                        inventoryItemId: orderItem.inventoryItemId,
                        type: 'PURCHASE',
                        quantity: receivedItem.receivedQuantity,
                        unitCost: Number(orderItem.unitPrice),
                        notes: `PO Receive: ${order.poNumber}${data.notes ? ' - ' + data.notes : ''}`,
                        referenceId: orderId,
                        referenceType: 'PURCHASE_ORDER',
                    });
                }
            }
        }
        const allItems = await this.prisma.purchaseOrderItem.findMany({
            where: { purchaseOrderId: orderId },
        });
        const fullyReceived = allItems.every(item => Number(item.receivedQty || 0) >= Number(item.quantity));
        const partiallyReceived = allItems.some(item => Number(item.receivedQty || 0) > 0);
        let status = order.status;
        if (fullyReceived) {
            status = 'RECEIVED';
        }
        else if (partiallyReceived) {
            status = 'PARTIAL';
        }
        return this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: {
                status,
                receivedDate: new Date(),
            },
            include: {
                vendor: true,
                items: true,
            },
        });
    }
    async getVendors(companyId) {
        return this.prisma.vendor.findMany({
            where: { companyId },
            include: {
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
            },
        });
    }
    async createVendor(data) {
        return this.prisma.vendor.create({
            data: {
                companyId: data.companyId,
                name: data.name,
                contactName: data.contactName,
                email: data.email,
                phone: data.phone,
                address: data.address,
            },
        });
    }
    async generatePONumber() {
        const today = new Date();
        const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await this.prisma.purchaseOrder.count({
            where: {
                orderDate: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                },
            },
        });
        return `PO-${datePrefix}-${String(count + 1).padStart(4, '0')}`;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map