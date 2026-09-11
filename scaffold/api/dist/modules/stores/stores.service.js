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
var StoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const STORE_SETTINGS_UPSERT_FIELDS = new Set([
    'orderNumberPrefix',
    'nextOrderNumber',
    'tokenNumberPrefix',
    'nextTokenNumber',
    'pizzaPrepTimeMinutes',
    'fryerPrepTimeMinutes',
    'sandwichPrepTimeMinutes',
    'acceptCash',
    'acceptCard',
    'acceptOnlinePayment',
    'osdDisplayMode',
    'kdsAutoAdvance',
    'kdsAlertThreshold',
    'loyaltyEnabled',
    'loyaltyPointsPerDollar',
    'paymentConfigs',
    'mapsProvider',
]);
function pickStoreSettingsFragment(raw) {
    if (!raw || typeof raw !== 'object')
        return {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (STORE_SETTINGS_UPSERT_FIELDS.has(k))
            out[k] = v;
    }
    return out;
}
function sanitizeStoreUpdateData(data) {
    if (!data || typeof data !== 'object')
        return data;
    const body = data;
    const settings = body.settings;
    if (!settings?.upsert || typeof settings.upsert !== 'object') {
        return data;
    }
    const upsert = settings.upsert;
    return {
        ...body,
        settings: {
            upsert: {
                create: pickStoreSettingsFragment(upsert.create),
                update: pickStoreSettingsFragment(upsert.update),
            },
        },
    };
}
let StoresService = StoresService_1 = class StoresService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StoresService_1.name);
    }
    async findAll(companyId) {
        return this.prisma.store.findMany({
            where: { companyId },
            include: { company: true, settings: true },
        });
    }
    async findById(id) {
        return this.prisma.store.findUnique({
            where: { id },
            include: { company: true, printers: true, settings: true },
        });
    }
    async create(data) {
        return this.prisma.store.create({ data });
    }
    async update(id, data) {
        const payload = sanitizeStoreUpdateData(data);
        try {
            return await this.prisma.store.update({
                where: { id },
                data: payload,
                include: { settings: true, company: true },
            });
        }
        catch (e) {
            this.logger.error(`store.update failed for ${id}: ${e?.message}`, e?.stack);
            const hint = typeof e?.message === 'string' &&
                (e.message.includes('paymentConfigs') ||
                    e.message.includes('mapsProvider') ||
                    e.message.includes('does not exist'))
                ? ' Apply pending migrations: cd scaffold/api && npx prisma migrate deploy'
                : '';
            throw new common_1.InternalServerErrorException(`Failed to update store.${hint}`);
        }
    }
};
exports.StoresService = StoresService;
exports.StoresService = StoresService = StoresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoresService);
//# sourceMappingURL=stores.service.js.map