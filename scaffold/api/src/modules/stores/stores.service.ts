import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Fields allowed on nested StoreSettings upsert (must match Prisma schema — extras cause Prisma client errors / 500). */
const STORE_SETTINGS_UPSERT_FIELDS = new Set<string>([
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

function pickStoreSettingsFragment(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (STORE_SETTINGS_UPSERT_FIELDS.has(k)) out[k] = v;
  }
  return out;
}

function sanitizeStoreUpdateData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const body = data as Record<string, unknown>;
  const settings = body.settings as Record<string, unknown> | undefined;
  if (!settings?.upsert || typeof settings.upsert !== 'object') {
    return data;
  }
  const upsert = settings.upsert as { create?: unknown; update?: unknown };
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

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.store.findMany({
      where: { companyId },
      include: { company: true, settings: true },
    });
  }

  async findById(id: string) {
    return this.prisma.store.findUnique({
      where: { id },
      include: { company: true, printers: true, settings: true },
    });
  }

  async create(data: any) {
    return this.prisma.store.create({ data });
  }

  async update(id: string, data: any) {
    const payload = sanitizeStoreUpdateData(data) as any;
    try {
      return await this.prisma.store.update({
        where: { id },
        data: payload,
        include: { settings: true, company: true },
      });
    } catch (e: any) {
      this.logger.error(`store.update failed for ${id}: ${e?.message}`, e?.stack);
      const hint =
        typeof e?.message === 'string' &&
        (e.message.includes('paymentConfigs') ||
          e.message.includes('mapsProvider') ||
          e.message.includes('does not exist'))
          ? ' Apply pending migrations: cd scaffold/api && npx prisma migrate deploy'
          : '';
      throw new InternalServerErrorException(`Failed to update store.${hint}`);
    }
  }
}
