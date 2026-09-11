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
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const SEED_PERMISSIONS = [
    { code: 'pos.access', name: 'Access POS', module: 'POS', description: 'Can open the POS terminal' },
    { code: 'pos.void', name: 'Void Orders', module: 'POS', description: 'Can void an order from POS' },
    { code: 'pos.discount', name: 'Apply Discounts', module: 'POS', description: 'Can apply discounts on orders' },
    { code: 'pos.refund', name: 'Process Refunds', module: 'POS', description: 'Can process refunds on payments' },
    { code: 'orders.view', name: 'View Orders', module: 'Orders', description: 'Can view order history' },
    { code: 'orders.manage', name: 'Manage Orders', module: 'Orders', description: 'Can edit or cancel orders' },
    { code: 'menu.view', name: 'View Menu', module: 'Menu', description: 'Can view menu items' },
    { code: 'menu.manage', name: 'Manage Menu', module: 'Menu', description: 'Can add, edit, or delete menu items' },
    { code: 'stock.view', name: 'View Inventory', module: 'Inventory', description: 'Can view stock levels' },
    { code: 'stock.manage', name: 'Manage Inventory', module: 'Inventory', description: 'Can adjust stock and create POs' },
    { code: 'reports.store', name: 'View Store Reports', module: 'Reports', description: 'Can view store-level reports' },
    { code: 'reports.global', name: 'View Global Reports', module: 'Reports', description: 'Can view company-wide BI reports' },
    { code: 'reports.export', name: 'Export Reports', module: 'Reports', description: 'Can export CSV/PDF reports' },
    { code: 'hr.view', name: 'View Staff', module: 'HR', description: 'Can view employee list' },
    { code: 'hr.manage', name: 'Manage Staff', module: 'HR', description: 'Can add/edit employees and payroll' },
    { code: 'delivery.view', name: 'View Deliveries', module: 'Delivery', description: 'Can view delivery queue' },
    { code: 'delivery.manage', name: 'Manage Deliveries', module: 'Delivery', description: 'Can assign drivers and update status' },
    { code: 'customers.view', name: 'View Customers', module: 'Customers', description: 'Can view customer profiles' },
    { code: 'customers.manage', name: 'Manage Customers', module: 'Customers', description: 'Can edit or delete customers' },
    { code: 'settings.store', name: 'Store Settings', module: 'Settings', description: 'Can modify store-level settings' },
    { code: 'settings.global', name: 'Global Settings', module: 'Settings', description: 'Can modify company-wide settings' },
    { code: 'users.manage', name: 'Manage Users', module: 'Administration', description: 'Can add/edit users and assign roles' },
    { code: 'roles.manage', name: 'Manage Roles', module: 'Administration', description: 'Can create and modify RBAC roles' },
    { code: 'kds.access', name: 'Access KDS', module: 'Kitchen', description: 'Can view kitchen display' },
    { code: 'packing.access', name: 'Access Packing', module: 'Kitchen', description: 'Can view packing display' },
];
const PREDEFINED_ROLE_PERMISSIONS = {
    Owner: SEED_PERMISSIONS.map((p) => p.code),
    'Store Manager': [
        'pos.access', 'pos.void', 'pos.discount', 'pos.refund',
        'orders.view', 'orders.manage',
        'menu.view', 'menu.manage',
        'stock.view', 'stock.manage',
        'reports.store',
        'hr.view', 'hr.manage',
        'delivery.view', 'delivery.manage',
        'customers.view', 'customers.manage',
        'settings.store',
        'kds.access', 'packing.access',
    ],
    Cashier: [
        'pos.access', 'pos.discount',
        'orders.view',
        'menu.view',
        'customers.view',
        'kds.access', 'packing.access',
    ],
};
let RolesService = RolesService_1 = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RolesService_1.name);
    }
    async onModuleInit() {
        await this.seedPermissions();
        await this.seedRolePermissions();
    }
    async seedPermissions() {
        for (const p of SEED_PERMISSIONS) {
            await this.prisma.permission.upsert({
                where: { code: p.code },
                update: { name: p.name, module: p.module, description: p.description },
                create: p,
            });
        }
        this.logger.log(`Seeded ${SEED_PERMISSIONS.length} permissions`);
    }
    async seedRolePermissions() {
        for (const [roleName, codes] of Object.entries(PREDEFINED_ROLE_PERMISSIONS)) {
            const role = await this.prisma.role.findUnique({ where: { name: roleName } });
            if (!role)
                continue;
            const perms = await this.prisma.permission.findMany({
                where: { code: { in: codes } },
                select: { id: true },
            });
            for (const perm of perms) {
                await this.prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: { roleId: role.id, permissionId: perm.id },
                    },
                    update: {},
                    create: { roleId: role.id, permissionId: perm.id },
                });
            }
            this.logger.log(`Linked ${perms.length} permissions to role "${roleName}"`);
        }
    }
    async findAll() {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
            orderBy: { isSystem: 'desc' },
        });
    }
    async findPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        });
    }
    async create(data) {
        const { permissions, ...roleData } = data;
        return this.prisma.role.create({
            data: {
                ...roleData,
                permissions: {
                    create: permissions?.map((pId) => ({
                        permissionId: pId,
                    })),
                },
            },
            include: {
                permissions: { include: { permission: true } },
            },
        });
    }
    async update(id, data) {
        const { permissions, ...roleData } = data;
        await this.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });
        return this.prisma.role.update({
            where: { id },
            data: {
                ...roleData,
                permissions: {
                    create: permissions?.map((pId) => ({
                        permissionId: pId,
                    })),
                },
            },
            include: {
                permissions: { include: { permission: true } },
            },
        });
    }
    async delete(id) {
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (role?.isSystem) {
            throw new Error('Cannot delete a system role');
        }
        return this.prisma.role.delete({ where: { id } });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map