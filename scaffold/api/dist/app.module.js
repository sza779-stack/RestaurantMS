"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const audit_module_1 = require("./common/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const stores_module_1 = require("./modules/stores/stores.module");
const menu_module_1 = require("./modules/menu/menu.module");
const orders_module_1 = require("./modules/orders/orders.module");
const kitchen_module_1 = require("./modules/kitchen/kitchen.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const finance_module_1 = require("./modules/finance/finance.module");
const employees_module_1 = require("./modules/employees/employees.module");
const reports_module_1 = require("./modules/reports/reports.module");
const printers_module_1 = require("./modules/printers/printers.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const drivers_module_1 = require("./modules/drivers/drivers.module");
const customers_module_1 = require("./modules/customers/customers.module");
const combos_module_1 = require("./modules/combos/combos.module");
const health_module_1 = require("./modules/health/health.module");
const payments_module_1 = require("./modules/payments/payments.module");
const data_management_module_1 = require("./modules/data-management/data-management.module");
const redis_module_1 = require("./modules/redis/redis.module");
const roles_module_1 = require("./modules/roles/roles.module");
const addons_module_1 = require("./modules/addons/addons.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            redis_module_1.RedisModule,
            roles_module_1.RolesModule,
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            stores_module_1.StoresModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            kitchen_module_1.KitchenModule,
            inventory_module_1.InventoryModule,
            finance_module_1.FinanceModule,
            employees_module_1.EmployeesModule,
            reports_module_1.ReportsModule,
            printers_module_1.PrintersModule,
            websocket_module_1.WebSocketModule,
            drivers_module_1.DriversModule,
            customers_module_1.CustomersModule,
            combos_module_1.CombosModule,
            health_module_1.HealthModule,
            payments_module_1.PaymentsModule,
            data_management_module_1.DataManagementModule,
            addons_module_1.AddonsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map