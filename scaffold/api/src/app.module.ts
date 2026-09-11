import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrintersModule } from './modules/printers/printers.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CombosModule } from './modules/combos/combos.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DataManagementModule } from './modules/data-management/data-management.module';
import { RedisModule } from './modules/redis/redis.module';
import { RolesModule } from './modules/roles/roles.module';
import { AddonsModule } from './modules/addons/addons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    RolesModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    StoresModule,
    MenuModule,
    OrdersModule,
    KitchenModule,
    InventoryModule,
    FinanceModule,
    EmployeesModule,
    ReportsModule,
    PrintersModule,
    WebSocketModule,
    DriversModule,
    CustomersModule,
    CombosModule,
    HealthModule,
    PaymentsModule,
    DataManagementModule,
    AddonsModule,
  ],
})
export class AppModule {}
