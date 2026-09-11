import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MovementType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Get all inventory items for a store
  async getItems(storeId: string, params?: { category?: string; lowStock?: boolean; search?: string }) {
    const where: any = { storeId };
    
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

    // Calculate stock status for each item
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

  // Get single inventory item
  async getItem(id: string, storeId: string) {
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
      throw new NotFoundException('Inventory item not found');
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

  // Get item by barcode
  async getItemByBarcode(barcode: string, storeId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { barcode, storeId },
    });

    if (!item) {
      throw new NotFoundException('Item not found with this barcode');
    }

    return {
      ...item,
      currentStock: Number(item.currentStock),
      minStockLevel: Number(item.minStockLevel),
      lastCost: Number(item.lastCost || 0),
      avgCost: Number(item.avgCost || 0),
    };
  }

  // Create new inventory item
  async createItem(data: {
    storeId: string;
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    unit: string;
    currentStock?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    lastCost?: number;
    trackInventory?: boolean;
  }) {
    // Check if SKU already exists
    const existingSku = await this.prisma.inventoryItem.findFirst({
      where: { sku: data.sku, storeId: data.storeId },
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    // Check if barcode already exists (if provided)
    if (data.barcode) {
      const existingBarcode = await this.prisma.inventoryItem.findFirst({
        where: { barcode: data.barcode, storeId: data.storeId },
      });

      if (existingBarcode) {
        throw new BadRequestException('Barcode already exists');
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

    // Create initial stock movement if stock > 0
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

  // Update inventory item
  async updateItem(id: string, storeId: string, data: {
    name?: string;
    barcode?: string;
    category?: string;
    unit?: string;
    minStockLevel?: number;
    maxStockLevel?: number;
    lastCost?: number;
    trackInventory?: boolean;
  }) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, storeId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check if barcode already exists (if being updated)
    if (data.barcode && data.barcode !== item.barcode) {
      const existingBarcode = await this.prisma.inventoryItem.findFirst({
        where: { barcode: data.barcode, storeId, NOT: { id } },
      });

      if (existingBarcode) {
        throw new BadRequestException('Barcode already exists');
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

  // Delete inventory item
  async deleteItem(id: string, storeId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, storeId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check if item has stock movements
    const movementsCount = await this.prisma.stockMovement.count({
      where: { inventoryItemId: id },
    });

    if (movementsCount > 0) {
      throw new BadRequestException('Cannot delete item with stock history');
    }

    return this.prisma.inventoryItem.delete({
      where: { id },
    });
  }

  // Create stock movement
  async createStockMovement(data: {
    inventoryItemId: string;
    type: MovementType;
    quantity: number;
    notes?: string;
    unitCost?: number;
    referenceId?: string;
    referenceType?: string;
  }) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const currentStock = Number(item.currentStock);
    let newStock = currentStock;

    // Calculate new stock based on movement type
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
          throw new BadRequestException('Insufficient stock for this operation');
        }
        break;
      case 'ADJUSTMENT':
        newStock = data.quantity; // Direct set for adjustment
        break;
      default:
        throw new BadRequestException('Invalid stock movement type');
    }

    // Calculate total cost
    const unitCost = data.unitCost || item.lastCost || 0;
    const quantity = data.type === 'SALE' || data.type === 'WASTE' || data.type === 'TRANSFER_OUT' 
      ? -data.quantity 
      : data.quantity;
    const totalCost = Math.abs(quantity) * Number(unitCost);

    // Create stock movement record
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

    // Update inventory item
    await this.prisma.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        currentStock: newStock,
        lastCost: unitCost,
      },
    });

    return movement;
  }

  // Receive items via barcode
  async receiveByBarcode(data: {
    storeId: string;
    barcode: string;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { barcode: data.barcode, storeId: data.storeId },
    });

    if (!item) {
      throw new NotFoundException('Item not found with barcode: ' + data.barcode);
    }

    return this.createStockMovement({
      inventoryItemId: item.id,
      type: 'PURCHASE',
      quantity: data.quantity,
      notes: data.notes || 'Barcode receive',
      unitCost: data.unitCost,
    });
  }

  // Get stock movements
  async getStockMovements(params: { 
    itemId?: string; 
    type?: string; 
    startDate?: Date; 
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

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

  // Get stock levels summary
  async getStockLevels(storeId: string) {
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

  // Get category breakdown
  private async getCategoryBreakdown(storeId: string) {
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

  // Deduct stock for order items (called when order is created)
  async deductStockForOrder(orderId: string, storeId: string, items: Array<{
    productId: string;
    quantity: number;
  }>) {
    const results = [];

    for (const item of items) {
      // Find recipe for this product
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
          // Check if inventoryItem exists and tracks inventory
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
            } catch (error: any) {
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

  // Get purchase orders
  async getPurchaseOrders(params: { storeId?: string; status?: string; vendorId?: string }) {
    const where: any = {};

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

  // Create purchase order
  async createPurchaseOrder(data: {
    storeId: string;
    vendorId: string;
    expectedDate?: Date;
    notes?: string;
    items: Array<{
      inventoryItemId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const poNumber = await this.generatePONumber();
    
    const subtotal = data.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxAmount = 0; // Calculate if needed
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

  // Receive purchase order
  async receivePurchaseOrder(orderId: string, data: {
    items: Array<{
      itemId: string;
      receivedQuantity: number;
    }>;
    notes?: string;
  }) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    // Update each item and create stock movements
    for (const receivedItem of data.items) {
      const orderItem = order.items.find(i => i.id === receivedItem.itemId);
      if (orderItem) {
        const newReceivedQty = Number(orderItem.receivedQty || 0) + receivedItem.receivedQuantity;
        
        // Update received quantity
        await this.prisma.purchaseOrderItem.update({
          where: { id: receivedItem.itemId },
          data: {
            receivedQty: newReceivedQty,
          },
        });

        // Create stock movement
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

    // Update order status
    const allItems = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: orderId },
    });

    const fullyReceived = allItems.every(item => 
      Number(item.receivedQty || 0) >= Number(item.quantity)
    );

    const partiallyReceived = allItems.some(item => 
      Number(item.receivedQty || 0) > 0
    );

    let status = order.status;
    if (fullyReceived) {
      status = 'RECEIVED';
    } else if (partiallyReceived) {
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

  // Get vendors by company
  async getVendors(companyId: string) {
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

  // Create vendor
  async createVendor(data: {
    companyId: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
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

  // Helper: Generate PO number
  private async generatePONumber(): Promise<string> {
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
}
