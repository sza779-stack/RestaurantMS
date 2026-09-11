import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

interface OvenTimer {
  orderId: string;
  storeId: string;
  timeoutId: NodeJS.Timeout;
  endTime: Date;
  durationMs: number;
}

interface OrderWithItems {
  id: string;
  storeId: string;
  status: string;
  items: Array<{
    id: string;
    productName: string;
    kitchenStation: string;
  }>;
}

/**
 * Oven Timer Service
 * Manages automatic completion of orders based on cook times
 * 
 * Cook times by category:
 * - Pizza: 7 minutes
 * - Wings: 13 minutes
 * - Sides: 3 minutes
 * - Other: 7 minutes
 */
@Injectable()
export class OvenTimerService {
  private readonly logger = new Logger(OvenTimerService.name);
  private readonly activeTimers = new Map<string, OvenTimer>();

  // Cook times in milliseconds
  private readonly COOK_TIMES = {
    PIZZA: 7 * 60 * 1000,      // 7 minutes
    TANDOOR: 8 * 60 * 1000,    // 8 minutes
    FRYER: 4 * 60 * 1000,      // 4 minutes
    GRILL: 10 * 60 * 1000,     // 10 minutes
    GENERAL: 7 * 60 * 1000,    // 7 minutes
    SANDWICH: 3 * 60 * 1000,   // 3 minutes
    DRINKS: 1 * 60 * 1000,     // 1 minute
    DESSERT: 3 * 60 * 1000,    // 3 minutes
    SALAD: 2 * 60 * 1000,      // 2 minutes
    DEFAULT: 7 * 60 * 1000,    // 7 minutes default
  };

  // Category keywords to detect item types
  private readonly CATEGORY_KEYWORDS = {
    WINGS: ['wing', 'wings', 'chicken wing', 'chicken wings', 'hot wing', 'buffalo wing'],
    PIZZA: ['pizza', 'pizzas', 'pie'],
    SIDES: ['fries', 'fry', 'side', 'sides', 'onion ring', 'rings', 'mozzarella stick', 'breadstick'],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Start the oven timer for an order
   * Called when order status changes to BAKING (IN_OVEN)
   */
  async startOvenTimer(orderId: string, storeId: string): Promise<void> {
    // Cancel any existing timer for this order
    this.cancelOvenTimer(orderId);

    // Calculate cook time based on order items
    const cookTimeMs = await this.calculateCookTime(orderId);
    const endTime = new Date(Date.now() + cookTimeMs);

    this.logger.log(`Starting oven timer for order ${orderId}. Cook time: ${cookTimeMs / 1000}s, Ends at: ${endTime.toISOString()}`);

    // Create timeout
    const timeoutId = setTimeout(async () => {
      await this.handleOvenTimerComplete(orderId, storeId);
    }, cookTimeMs);

    // Store timer reference
    const timer: OvenTimer = {
      orderId,
      storeId,
      timeoutId,
      endTime,
      durationMs: cookTimeMs,
    };

    this.activeTimers.set(orderId, timer);

    // Broadcast timer started event
    this.websocketGateway.server?.to(`kitchen:${storeId}`).emit('kitchen:oven:started', {
      orderId,
      storeId,
      endTime: endTime.toISOString(),
      durationMs: cookTimeMs,
    });
  }

  /**
   * Cancel an active oven timer
   */
  cancelOvenTimer(orderId: string): void {
    const existingTimer = this.activeTimers.get(orderId);
    if (existingTimer) {
      clearTimeout(existingTimer.timeoutId);
      this.activeTimers.delete(orderId);
      this.logger.log(`Cancelled oven timer for order ${orderId}`);
    }
  }

  /**
   * Check if an order has an active oven timer
   */
  hasActiveTimer(orderId: string): boolean {
    return this.activeTimers.has(orderId);
  }

  /**
   * Get remaining time for an order's oven timer
   */
  getRemainingTime(orderId: string): number | null {
    const timer = this.activeTimers.get(orderId);
    if (!timer) return null;
    return Math.max(0, timer.endTime.getTime() - Date.now());
  }

  /**
   * Calculate cook time based on order items
   * Uses the longest cook time from all items
   */
  private async calculateCookTime(orderId: string): Promise<number> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      }) as OrderWithItems | null;

      if (!order || !order.items || order.items.length === 0) {
        return this.COOK_TIMES.DEFAULT;
      }

      let maxCookTime = 0;

      for (const item of order.items) {
        const itemCookTime = this.getItemCookTime(item);
        maxCookTime = Math.max(maxCookTime, itemCookTime);
      }

      // Ensure minimum of 3 minutes
      return Math.max(maxCookTime, 3 * 60 * 1000);
    } catch (error) {
      this.logger.error(`Failed to calculate cook time for order ${orderId}:`, error);
      return this.COOK_TIMES.DEFAULT;
    }
  }

  /**
   * Get cook time for a single item
   */
  private getItemCookTime(item: { productName: string; kitchenStation: string }): number {
    const name = item.productName.toLowerCase();
    const station = item.kitchenStation?.toUpperCase() || 'GENERAL';

    // First check by product name keywords
    if (this.CATEGORY_KEYWORDS.WINGS.some(kw => name.includes(kw.toLowerCase()))) {
      return 13 * 60 * 1000; // Wings: 13 minutes
    }

    if (this.CATEGORY_KEYWORDS.PIZZA.some(kw => name.includes(kw.toLowerCase()))) {
      return this.COOK_TIMES.PIZZA;
    }

    if (this.CATEGORY_KEYWORDS.SIDES.some(kw => name.includes(kw.toLowerCase()))) {
      return this.COOK_TIMES.SANDWICH; // Sides use 3 min
    }

    // Fall back to kitchen station
    if (this.COOK_TIMES[station as keyof typeof this.COOK_TIMES]) {
      return this.COOK_TIMES[station as keyof typeof this.COOK_TIMES];
    }

    return this.COOK_TIMES.DEFAULT;
  }

  /**
   * Handle oven timer completion
   * Auto-advances order to PACKING status
   */
  private async handleOvenTimerComplete(orderId: string, storeId: string): Promise<void> {
    this.logger.log(`Oven timer complete for order ${orderId}`);
    
    // Remove from active timers
    this.activeTimers.delete(orderId);

    try {
      // Update order status to PACKING (prepared/ready for packing)
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PACKING',
          preparedAt: new Date(),
        },
        include: { items: true, payments: true },
      });

      this.logger.log(`Order ${orderId} auto-advanced from BAKING to PACKING`);

      // Broadcast status change
      this.websocketGateway.broadcastOrderStatusChange(storeId, {
        orderId,
        storeId,
        status: 'PACKING',
        previousStatus: 'BAKING',
        data: updatedOrder,
        timestamp: new Date().toISOString(),
      });

      // Emit oven complete event
      this.websocketGateway.server?.to(`kitchen:${storeId}`).emit('kitchen:oven:completed', {
        orderId,
        storeId,
        timestamp: new Date().toISOString(),
      });

      // Notify packing station
      this.websocketGateway.server?.to(`packing:${storeId}`).emit('packing:order-ready', {
        ...updatedOrder,
        status: 'READY',
        readyAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to auto-advance order ${orderId} to PACKING:`, error);
    }
  }

  /**
   * Clean up all timers (useful for graceful shutdown)
   */
  cleanup(): void {
    this.logger.log(`Cleaning up ${this.activeTimers.size} oven timers`);
    for (const [orderId, timer] of this.activeTimers) {
      clearTimeout(timer.timeoutId);
      this.logger.log(`Cancelled timer for order ${orderId}`);
    }
    this.activeTimers.clear();
  }
}
