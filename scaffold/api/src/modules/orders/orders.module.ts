import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OvenTimerService } from './oven-timer.service';
import { InventoryModule } from '../inventory/inventory.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [InventoryModule, forwardRef(() => WebSocketModule)],
  controllers: [OrdersController],
  providers: [OrdersService, OvenTimerService],
  exports: [OrdersService, OvenTimerService],
})
export class OrdersModule {}
