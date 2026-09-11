import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { OvenTimerService } from './oven-timer.service';
import { OrderEvents, OrderEventPayload, ItemEventPayload } from '../websocket/websocket-events';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => WebsocketGateway))
    private websocketGateway: WebsocketGateway,
    private ovenTimerService: OvenTimerService,
  ) {}

  async findAll(params: { storeId?: string; status?: string; includeFuture?: boolean; futureOnly?: boolean }) {
    const where: any = {};
    
    if (params.storeId) {
      where.storeId = await this.resolveStoreId(params.storeId);
    }
    
    if (params.status) {
      // Handle comma-separated status list
      const statusList = params.status.split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length > 0) {
        const normalizedStatuses = statusList
          .map(status => this.normalizeOrderStatus(status))
          .filter(Boolean);
        
        if (normalizedStatuses.length === 1) {
          where.status = normalizedStatuses[0];
        } else if (normalizedStatuses.length > 1) {
          where.status = { in: normalizedStatuses };
        }
      }
    }

    if (params.futureOnly) {
      where.scheduledFor = { gt: new Date() };
    } else if (params.includeFuture === false) {
      where.OR = [
        { scheduledFor: null },
        { scheduledFor: { lte: new Date() } },
      ];
    }
    
    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });
  }

  async create(data: any) {
    console.log('Creating order with data:', JSON.stringify(data, null, 2));
    
    try {
      const storeId = await this.resolveStoreId(data.storeId);

      if (data.createdById) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: data.createdById },
          select: { id: true },
        });
        if (!userExists) {
          console.warn(`OrdersService.create: createdById ${data.createdById} not found, omitting relation`);
          data.createdById = undefined;
        }
      }

      // Calculate item totals and prepare order items
      const orderItems = await Promise.all(
        data.items.map(async (item: any) => {
          let product = await this.prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            product = await this.getOrCreateFallbackPosProduct(storeId, item);
          }
          
          const unitPrice = Number(item.unitPrice || product?.basePrice || 0);
          const quantity = item.quantity || 1;
          const totalPrice = unitPrice * quantity;
          
          return {
            productId: product.id,
            productName: item.productName || product.name || 'Unknown Product',
            sizeId: item.sizeId,
            sizeName: item.sizeName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            addons: item.addons || item.modifiers || [],
            notes: item.notes,
            kitchenStation: (this.normalizeKitchenStation(item.kitchenStation) || product.kitchenStation || 'GENERAL') as any,
            status: 'PENDING',
          };
        })
      );
      
      // Recalculate totals based on items
      const calculatedSubtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const isTaxExempt = Boolean(data.taxExempt);
      const taxExemptIdRef = isTaxExempt
        ? this.normalizeTaxExemptReference(data.taxExemptIdRef || data.taxIdReference || data.taxId)
        : null;
      const taxAmount = isTaxExempt ? 0 : Number(data.taxAmount || 0);
      const deliveryFee = Number(data.deliveryFee || 0);
      const tipAmount = Number(data.tipAmount || 0);
      
      const loyaltyPointsUsed = Number(data.loyaltyPointsUsed || 0);
      const loyaltyDiscount = loyaltyPointsUsed > 0 ? loyaltyPointsUsed / 100 : 0;
      
      const baseTotal = calculatedSubtotal + taxAmount + deliveryFee + tipAmount;
      const total = Math.max(0, Number(data.total || baseTotal) - loyaltyDiscount);
      
      const scheduledFor =
        data.scheduledFor && !Number.isNaN(new Date(data.scheduledFor).getTime())
          ? new Date(data.scheduledFor)
          : undefined;
      const isFutureOrder = !!(scheduledFor && scheduledFor.getTime() > Date.now());
      const shouldSendToKitchen = Boolean(data.sendToKitchen) && !isFutureOrder;

      const normalizedCustomerName = data.customerName || data.customer?.name || data.customer?.fullName;
      const normalizedCustomerPhone = data.customerPhone || data.customer?.phone;
      const normalizedCustomerEmail = data.customerEmail || data.customer?.email;
      const normalizedDeliveryAddress = this.normalizeDeliveryAddressValue(
        data.deliveryAddress || data.address,
      );

      let order: any = null;
      const maxOrderNumberRetries = 5;
      for (let attempt = 1; attempt <= maxOrderNumberRetries; attempt++) {
        const orderNumber = await this.generateOrderNumber(storeId);
        console.log('Creating order with number:', orderNumber, 'Items:', orderItems.length, 'Attempt:', attempt);

        try {
          order = await this.prisma.order.create({
            data: {
              storeId,
              orderNumber,
              type: data.type || 'DINE_IN',
              status: 'PENDING',
              scheduledFor,
              tableNumber: data.tableNumber,
              customerName: normalizedCustomerName,
              customerPhone: normalizedCustomerPhone,
              customerEmail: normalizedCustomerEmail,
              deliveryAddress: normalizedDeliveryAddress,
              subtotal: calculatedSubtotal,
              taxAmount: taxAmount,
              taxExempt: isTaxExempt,
              taxExemptIdRef,
              deliveryFee: deliveryFee,
              tipAmount: tipAmount,
              loyaltyPointsUsed: loyaltyPointsUsed > 0 ? loyaltyPointsUsed : null,
              discountAmount: loyaltyPointsUsed > 0 ? new Prisma.Decimal(loyaltyDiscount) : new Prisma.Decimal(data.discountAmount || 0),
              total: total,
              source: this.normalizeOrderSource(data.source, data.createdById) as any,
              createdById: data.createdById,
              items: {
                create: orderItems,
              },
              payments: {
                create: data.payments?.map((p: any) => ({
                  amount: Number(p.amount),
                  method: p.method,
                  status: this.normalizePaymentStatus(p.status),
                  transactionId: p.transactionId || p.reference,
                  cardLast4: p.cardLast4,
                  processedAt: p.processedAt && !Number.isNaN(new Date(p.processedAt).getTime())
                    ? new Date(p.processedAt)
                    : new Date(),
                  processedById: p.processedById || data.createdById,
                })) || [],
              },
            },
            include: {
              items: true,
              payments: true,
            },
          });
          break;
        } catch (createError) {
          if (this.isOrderNumberConflict(createError) && attempt < maxOrderNumberRetries) {
            continue;
          }
          throw createError;
        }
      }

      if (!order) {
        throw new Error('Failed to create order after retrying order number generation');
      }

      console.log('Order created successfully:', order.id);

      // Handle loyalty points redemption
      const normalizedPhone = normalizedCustomerPhone?.replace(/\D/g, '');
      if (loyaltyPointsUsed > 0 && normalizedPhone) {
        try {
          const customer = await this.prisma.customer.findFirst({ 
            where: { phone: normalizedPhone } 
          });
          
          if (customer && customer.loyaltyPoints >= loyaltyPointsUsed) {
            await this.prisma.$transaction(async (tx) => {
              await tx.customer.update({
                where: { id: customer.id },
                data: { loyaltyPoints: { decrement: loyaltyPointsUsed } }
              });
              await tx.loyaltyTransaction.create({
                data: {
                  customerId: customer.id,
                  points: loyaltyPointsUsed,
                  type: 'REDEEMED',
                  orderId: order.id,
                  description: `Redeemed ${loyaltyPointsUsed} points for $${loyaltyDiscount.toFixed(2)} off`,
                }
              });
            });
            console.log(`Redeemed ${loyaltyPointsUsed} points for customer ${customer.id}`);
          }
        } catch (e) {
          console.error('Failed to redeem loyalty points:', e);
        }
      }

      // Deduct stock for inventory-tracked items
      try {
        await this.inventoryService.deductStockForOrder(
          order.id,
          storeId,
          data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
          }))
        );
      } catch (error) {
        console.error('Failed to deduct stock:', error);
      }

      // Broadcast new order event
      this.broadcastOrderEvent(
        storeId,
        OrderEvents.ORDER_CREATED,
        {
        orderId: order.id,
        order,
        timestamp: new Date().toISOString(),
        },
        { skipKitchen: isFutureOrder },
      );

      // Orders now start at PENDING and require manual advancement through KDS
      // The shouldSendToKitchen flag no longer auto-advances orders
      // This ensures orders go through: PENDING -> PREPARING -> BAKING -> PACKING

      return order;
    } catch (error) {
      console.error('Order creation failed:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: string, storeId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }

    const requestedStatus = String(status || '').toUpperCase();
    const workflowStatus = this.normalizeOrderStatus(status);
    if (!workflowStatus) {
      throw new NotFoundException(`Unsupported order status: ${status}`);
    }
    this.ensureWorkflowTransitionAllowed(order.status, workflowStatus);

    const resolvedStoreId = storeId ? await this.resolveStoreId(storeId) : order.storeId;

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: workflowStatus as any,
        confirmedAt: workflowStatus === 'CONFIRMED' ? new Date() : undefined,
        preparedAt: workflowStatus === 'PREPARING' && !order.preparedAt ? new Date() : undefined,
        packedAt: workflowStatus === 'READY' ? new Date() : undefined,
        deliveredAt: workflowStatus === 'DELIVERED' ? new Date() : undefined,
        completedAt: workflowStatus === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // Broadcast status change
    const eventStatus = ['PACKED', 'READY_FOR_PICKUP', 'READY_TO_SERVE'].includes(requestedStatus)
      ? requestedStatus
      : workflowStatus;

    this.websocketGateway.broadcastOrderStatusChange(resolvedStoreId, {
      orderId: id,
      storeId: resolvedStoreId,
      status: eventStatus,
      previousStatus: order.status,
      data: updatedOrder,
      timestamp: new Date().toISOString(),
    });

    // Start oven timer when order enters BAKING status (IN_OVEN)
    if (workflowStatus === 'BAKING') {
      await this.ovenTimerService.startOvenTimer(id, resolvedStoreId);
    }

    // Cancel oven timer if order moves out of BAKING to a non-baking status
    if (order.status === 'BAKING' && workflowStatus !== 'BAKING') {
      this.ovenTimerService.cancelOvenTimer(id);
    }

    return updatedOrder;
  }

  async updateItemStatus(orderId: string, itemId: string, status: string, storeId?: string) {
    const normalizedStatus = this.normalizeItemStatus(status);
    if (!normalizedStatus) {
      throw new NotFoundException(`Invalid item status: ${status}`);
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: normalizedStatus as any,
        startedAt: normalizedStatus === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: normalizedStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // Re-fetch order AFTER the item update to get fresh item statuses
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (order) {
      const broadcastStoreId = storeId || order.storeId;
      
      // Broadcast item status change
      const payload: ItemEventPayload = {
        orderId,
        itemId,
        storeId: broadcastStoreId,
        status: normalizedStatus,
        timestamp: new Date().toISOString(),
      };
      
      this.websocketGateway.server?.to(`kitchen:${broadcastStoreId}`).emit(
        OrderEvents.ORDER_ITEM_PREPARED,
        payload
      );
      this.websocketGateway.server?.to(`store:${broadcastStoreId}`).emit(
        OrderEvents.ORDER_ITEM_PREPARED,
        payload
      );

      // Check if all items are prepared (using freshly fetched data).
      // Items are persisted using the Prisma `ItemStatus` enum (PENDING|IN_PROGRESS|COMPLETED),
      // so `COMPLETED` is the only success terminal we need to check.
      const allItemsPrepared = order.items.every(
        (item: any) => item.status === 'COMPLETED'
      );

      if (allItemsPrepared && order.items.length > 0) {
        // Auto-advance order to PACKING status
        await this.updateStatus(orderId, 'PACKING', broadcastStoreId);
        
        this.websocketGateway.server?.to(`kitchen:${broadcastStoreId}`).emit(
          OrderEvents.KITCHEN_ALL_ITEMS_COMPLETED,
          { orderId, timestamp: new Date().toISOString() }
        );
      }
    }

    return updatedItem;
  }

  /**
   * Process payment for an order
   */
  async processPayment(orderId: string, paymentData: any, storeId?: string) {
    const resolvedStoreId = storeId ? await this.resolveStoreId(storeId) : undefined;

    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!existingOrder) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    const paymentAmount = Number(paymentData.amount || 0);
    const tipAmount = Number(paymentData.tipAmount || 0);
    const closeOrderOnFullPayment = Boolean(paymentData.closeOrderOnFullPayment);
    const requestedTaxExempt = Boolean(paymentData.taxExempt);
    const requestedTaxExemptIdRef = this.normalizeTaxExemptReference(
      paymentData.taxExemptIdRef || paymentData.taxIdReference || paymentData.taxId,
    );
    const completedPaymentCount = existingOrder.payments.filter(
      (p: any) => p.status === 'COMPLETED',
    ).length;

    if (requestedTaxExempt && !requestedTaxExemptIdRef) {
      throw new BadRequestException('Tax ID reference is required for tax exempt payment');
    }

    if (requestedTaxExempt && !existingOrder.taxExempt && completedPaymentCount > 0) {
      throw new BadRequestException('Tax exempt cannot be applied after payment has started');
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      if (requestedTaxExempt && !existingOrder.taxExempt) {
        const currentTax = Number(existingOrder.taxAmount || 0);
        if (currentTax > 0) {
          await tx.order.update({
            where: { id: orderId },
            data: {
              taxExempt: true,
              taxExemptIdRef: requestedTaxExemptIdRef,
              taxAmount: 0,
              total: { decrement: currentTax },
            },
          });
        } else {
          await tx.order.update({
            where: { id: orderId },
            data: {
              taxExempt: true,
              taxExemptIdRef: requestedTaxExemptIdRef,
            },
          });
        }
      } else if (requestedTaxExempt && existingOrder.taxExempt && requestedTaxExemptIdRef) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            taxExemptIdRef: requestedTaxExemptIdRef,
          },
        });
      }

      if (tipAmount > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            tipAmount: { increment: tipAmount },
            total: { increment: tipAmount },
          },
        });
      }

      // Award loyalty points for payment amount (1 pt per $1)
      const earnedPoints = Math.floor(paymentAmount);
      const custPhoneMatch = existingOrder.customerPhone?.replace(/\D/g, '');
      if (earnedPoints > 0 && custPhoneMatch) {
         const customer = await tx.customer.findFirst({ where: { phone: custPhoneMatch } });
         if (customer) {
            await tx.customer.update({
                where: { id: customer.id },
                data: { 
                    loyaltyPoints: { increment: earnedPoints },
                    lifetimeSpend: { increment: paymentAmount },
                    // orderCount is tracked at order creation, not per payment
                }
            });
            await tx.loyaltyTransaction.create({
                data: {
                    customerId: customer.id,
                    points: earnedPoints,
                    type: 'EARNED',
                    orderId: orderId,
                    description: `Earned points from payment of $${paymentAmount.toFixed(2)}`
                }
            });
         }
      }

      return tx.payment.create({
        data: {
          orderId,
          amount: paymentAmount,
          method: paymentData.method,
          status: paymentData.status || 'COMPLETED',
          transactionId: paymentData.transactionId,
          cardLast4: paymentData.cardLast4,
        },
      });
    });

    // Get updated order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    if (order) {
      const broadcastStoreId = resolvedStoreId || order.storeId;
      
      // Broadcast payment received
      this.broadcastOrderEvent(broadcastStoreId, OrderEvents.PAYMENT_RECEIVED, {
        orderId,
        payment,
        order,
        timestamp: new Date().toISOString(),
      });

      // Check if fully paid
      const totalPaid = order.payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      if (totalPaid >= Number(order.total)) {
        const shouldMarkCompleted =
          closeOrderOnFullPayment ||
          ['DELIVERED', 'COMPLETED'].includes(order.status as string);

        if (shouldMarkCompleted) {
          const closedOrder = await this.updateStatus(orderId, 'COMPLETED', broadcastStoreId);
          this.broadcastOrderEvent(broadcastStoreId, OrderEvents.ORDER_PAID, {
            orderId,
            order: closedOrder,
            timestamp: new Date().toISOString(),
          });
          return payment;
        }

        const updatedOrder = await this.updateStatus(orderId, 'CONFIRMED', broadcastStoreId);
        this.broadcastOrderEvent(broadcastStoreId, OrderEvents.ORDER_PAID, {
          orderId,
          order: updatedOrder,
          timestamp: new Date().toISOString(),
        });

        // Orders now stay at PENDING/CONFIRMED until manually moved to PREPARING via KDS
        // This ensures proper workflow: PENDING -> COOKING -> IN_OVEN -> PACKING

        // For delivery orders, notify drivers
        if (order.type === 'DELIVERY') {
          this.websocketGateway.server?.to(`drivers:${broadcastStoreId}`).emit(
            OrderEvents.DRIVER_ORDER_ASSIGNED,
            { orderId, order, timestamp: new Date().toISOString() }
          );
        }
      }
    }

    return payment;
  }

  async assignDriver(orderId: string, driverId: string, storeId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);

    const deliveryStoreId = storeId ? await this.resolveStoreId(storeId) : order.storeId;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          driverId,
          status: 'OUT_FOR_DELIVERY' as any,
        },
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'BUSY' },
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    // Broadcast driver assignment
    this.websocketGateway.server?.to(`drivers:${deliveryStoreId}`).emit(
      OrderEvents.DRIVER_ORDER_ASSIGNED,
      { orderId, driverId, order: updatedOrder, timestamp: new Date().toISOString() }
    );
    this.websocketGateway.broadcastOrderStatusChange(deliveryStoreId, {
      orderId,
      storeId: deliveryStoreId,
      status: 'OUT_FOR_DELIVERY',
      previousStatus: order.status as any,
      data: updatedOrder,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }

  async markDelivered(orderId: string, driverId: string, storeId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);

    const deliveryStoreId = storeId ? await this.resolveStoreId(storeId) : order.storeId;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED' as any,
          deliveredAt: new Date(),
        },
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'ONLINE' },
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    // Broadcast delivery completion
    this.websocketGateway.server?.to(`drivers:${deliveryStoreId}`).emit(
      OrderEvents.DRIVER_ORDER_DELIVERED,
      { orderId, driverId, order: updatedOrder, timestamp: new Date().toISOString() }
    );
    this.websocketGateway.broadcastOrderStatusChange(deliveryStoreId, {
      orderId,
      storeId: deliveryStoreId,
      status: 'DELIVERED',
      previousStatus: order.status as any,
      data: updatedOrder,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }

  async getDefaultStoreId(): Promise<string> {
    const store = await this.prisma.store.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return store?.id || 'default-store';
  }

  async getPublicStores() {
	    // Public storefronts (web-online and web-osdu) need enough info to display the
    // right tax rate, delivery fee, and contact info without a second round-trip.
    return this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        taxRate: true,
        deliveryFee: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async resolveStoreId(storeId?: string): Promise<string> {
    if (!storeId || storeId === 'default-store') {
      return this.getDefaultStoreId();
    }
    return storeId;
  }

  private async generateOrderNumber(storeId: string): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Order number is globally unique, so sequence must be computed globally (not per store).
    const latestOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: { startsWith: datePrefix },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (latestOrder) {
      const parts = latestOrder.orderNumber.split('-');
      if (parts.length === 2) {
        const lastSeq = parseInt(parts[1], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${datePrefix}-${String(sequence).padStart(4, '0')}`;
  }

  private isOrderNumberConflict(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2002') {
      return false;
    }

    const target = (error.meta as any)?.target;
    if (Array.isArray(target)) {
      return target.includes('orderNumber');
    }
    if (typeof target === 'string') {
      return target.includes('orderNumber');
    }
    return false;
  }

  private async getOrCreateFallbackPosProduct(storeId: string, item: any) {
    const sku = `POS-${item.productId.slice(0, 8)}`;
    
    let product = await this.prisma.product.findFirst({
      where: { sku },
    });

    if (!product) {
      product = await this.prisma.product.create({
        data: {
          name: item.productName || 'POS Item',
          sku,
          basePrice: Number(item.unitPrice) || 0,
          categoryId: (await this.getOrCreatePosCategory(storeId)).id,
          kitchenStation: (this.normalizeKitchenStation(item.kitchenStation) || 'GENERAL') as any,
          isActive: true,
        },
      });
    }

    return product;
  }

  private async getOrCreatePosCategory(storeId: string) {
    const categoryName = 'POS Items';
    
    let category = await this.prisma.category.findFirst({
      where: { name: categoryName },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          name: categoryName,
          description: 'Auto-created for POS orders',
          storeId,
        },
      });
    }

    return category;
  }

  private normalizeOrderSource(source: string, createdById?: string): string {
    if (source) return source;
	    return createdById ? 'POS' : 'WEB';
  }

  private broadcastOrderEvent(
    storeId: string,
    event: string,
    payload: any,
    options?: { skipKitchen?: boolean },
  ) {
    this.websocketGateway.server?.to(`store:${storeId}`).emit(event, payload);
    if (!options?.skipKitchen) {
      this.websocketGateway.server?.to(`kitchen:${storeId}`).emit(event, payload);
    }
  }

  private normalizeOrderStatus(status?: string): string | null {
    if (!status) return null;

    const input = String(status).toUpperCase();
    
    // Map various status names to valid Prisma OrderStatus enum values
    const mapped: Record<string, string> = {
      // Initial states
      CREATED: 'PENDING',
      ORDER_PLACED: 'PENDING',
      PENDING: 'PENDING',
      
      // Confirmed/Paid
      CONFIRMED: 'CONFIRMED',
      PAID: 'CONFIRMED',
      
      // In kitchen/preparing
      IN_PROGRESS: 'PREPARING',
      COOKING: 'PREPARING',
      IN_KITCHEN: 'PREPARING',
      PREPARING: 'PREPARING',
      
      // Baking/in oven
      IN_OVEN: 'BAKING',
      BAKING: 'BAKING',
      
      // Prepared/ready for packing
      PREPARED: 'PACKING',
      ASSEMBLED: 'PACKING',
      PACKING: 'PACKING',
      
      // Packed/ready
      PACKED: 'READY',
      READY: 'READY',
      READY_FOR_PICKUP: 'READY',
      READY_TO_SERVE: 'READY',
      
      // Delivery
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      
      // Final states
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
    };

    const normalized = mapped[input] || input;
    
    // Valid Prisma OrderStatus enum values
    const valid = new Set([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'BAKING',
      'PACKING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'REFUNDED',
    ]);

    return valid.has(normalized) ? normalized : null;
  }

  /**
   * Normalize an item status to the Prisma `ItemStatus` enum (PENDING|IN_PROGRESS|COMPLETED).
   *
   * The KDS, Packing, and Online apps speak a richer vocabulary
   * (`PREPARED`, `ASSEMBLED`, `PACKED`, `READY`, `DONE`) that conceptually all mean
   * "the cook/packer is finished with this item". Map all of those to `COMPLETED`
   * so the DB write succeeds and the order-level auto-advance check below can see it.
   */
  private normalizeItemStatus(status?: string): string | null {
    if (!status) return null;

    const input = String(status).toUpperCase();
    const map: Record<string, string> = {
      PENDING: 'PENDING',
      CREATED: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      PREPARING: 'IN_PROGRESS',
      COOKING: 'IN_PROGRESS',
      STARTED: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      DONE: 'COMPLETED',
      READY: 'COMPLETED',
      PREPARED: 'COMPLETED',
      ASSEMBLED: 'COMPLETED',
      PACKED: 'COMPLETED',
    };

    const normalized = map[input];
    return normalized || null;
  }

  private toWorkflowStatus(dbStatus: string): string {
    const mapped: Record<string, string> = {
      PENDING: 'CREATED',
      CONFIRMED: 'PAID',
      PREPARING: 'IN_KITCHEN',
      BAKING: 'BAKING',
      PACKING: 'PACKING',
      READY: 'READY',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'CANCELLED',
    };

    return mapped[dbStatus] || dbStatus;
  }

  private toKdsStatus(workflowStatus: string): string {
    const mapped: Record<string, string> = {
      CREATED: 'PENDING',
      PAID: 'PENDING',
      IN_KITCHEN: 'IN_PROGRESS',
      BAKING: 'IN_OVEN',
      PACKING: 'READY',
      READY: 'READY',
      OUT_FOR_DELIVERY: 'COMPLETED',
      DELIVERED: 'COMPLETED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    };
    return mapped[workflowStatus] || 'PENDING';
  }

	  private ensureWorkflowTransitionAllowed(currentDbStatus: string, nextDbStatus: string) {
    if (currentDbStatus === nextDbStatus) {
      return;
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'PREPARING', 'BAKING', 'PACKING', 'READY', 'CANCELLED', 'REFUNDED'],
      CONFIRMED: ['PREPARING', 'BAKING', 'PACKING', 'READY', 'CANCELLED', 'REFUNDED'],
      PREPARING: ['PENDING', 'BAKING', 'PACKING', 'READY', 'CANCELLED', 'REFUNDED'],
      BAKING: ['PREPARING', 'PACKING', 'READY', 'CANCELLED', 'REFUNDED'],
      PACKING: ['READY', 'CANCELLED', 'REFUNDED'],
      READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
      DELIVERED: ['COMPLETED', 'REFUNDED'],
      COMPLETED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowed = validTransitions[currentDbStatus] || [];
    if (!allowed.includes(nextDbStatus)) {
      throw new BadRequestException(
        `Invalid order lifecycle transition: ${currentDbStatus} -> ${nextDbStatus}`,
      );
    }
  }

  private normalizeKitchenStation(station?: string): string | undefined {
    if (!station) return undefined;
    
    const candidate = String(station).toUpperCase();
    const validStations = new Set([
      'PIZZA',
      'FRYER',
      'SANDWICH',
      'DRINKS',
      'DESSERT',
      'SALAD',
      'GRILL',
      'TANDOOR',
      'GENERAL',
    ]);

    return validStations.has(candidate) ? candidate : 'GENERAL';
  }

  private normalizeDeliveryAddressValue(address: unknown): string | null {
    if (address == null) return null;
    if (typeof address === 'string') {
      const trimmed = address.trim();
      if (!trimmed) return null;
      try {
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed);
      } catch {
        return JSON.stringify({ street: trimmed });
      }
    }
    if (typeof address === 'object') {
      try {
        return JSON.stringify(address);
      } catch {
        return null;
      }
    }
    return JSON.stringify({ street: String(address) });
  }

  private normalizePaymentStatus(status?: string): any {
    const candidate = String(status || 'PENDING').toUpperCase();
    const valid = new Set(['PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED']);
    return valid.has(candidate) ? candidate : 'PENDING';
  }

  private normalizeTaxExemptReference(value?: string): string | null {
    const normalized = String(value || '').trim();
    return normalized.length > 0 ? normalized.slice(0, 120) : null;
  }

  async recordCashTip(
    orderId: string, 
    driverId: string, 
    tipAmount: number,
    emailReceipt: boolean,
    customerEmail?: string,
  ) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { payments: true },
    });
    
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);
    if (order.driverId !== driverId) {
      throw new NotFoundException('Order not assigned to this driver');
    }

    const newTipAmount = Number(order.tipAmount || 0) + tipAmount;
    const newTotal = Number(order.total || 0) + tipAmount;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          tipAmount: newTipAmount,
          total: newTotal,
        },
      });

      // Separate payment row for door cash tips keeps POS/online tallies intact and
      // sum(payments.amount) aligned with order.total after this update.
      if (tipAmount > 0) {
        await tx.payment.create({
          data: {
            orderId,
            amount: tipAmount,
            method: 'CASH',
            status: 'COMPLETED',
            processedAt: new Date(),
            processedById: driverId,
          },
        });
      }

      // Note: Driver earnings tracking can be added here
      // This would typically create a DriverEarning record
    });

    // TODO: Send email receipt if requested
    // This would integrate with an email service
    if (emailReceipt && (customerEmail || order.customerEmail)) {
      console.log(`[OrdersService] Email receipt requested for order ${orderId} to ${customerEmail || order.customerEmail}`);
      // await this.emailService.sendReceipt(orderId, customerEmail || order.customerEmail);
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    // Broadcast tip/payment update to all store interfaces (POS/Admin/Displays) and drivers
    this.broadcastOrderEvent(order.storeId, OrderEvents.PAYMENT_RECEIVED, {
      orderId,
      payment: {
        method: 'CASH',
        amount: tipAmount,
        status: 'COMPLETED',
        isTip: true,
      },
      order: updatedOrder,
      timestamp: new Date().toISOString(),
    });
    this.broadcastOrderEvent(order.storeId, OrderEvents.ORDER_UPDATED, {
      orderId,
      order: updatedOrder,
      status: updatedOrder?.status,
      timestamp: new Date().toISOString(),
    });

    // Keep driver channel payload for driver UI earnings updates
    this.websocketGateway.server?.to(`drivers:${order.storeId}`).emit(
      OrderEvents.ORDER_UPDATED,
      { orderId, driverId, tipAmount: newTipAmount, order: updatedOrder, timestamp: new Date().toISOString() }
    );

    return updatedOrder;
  }
}
