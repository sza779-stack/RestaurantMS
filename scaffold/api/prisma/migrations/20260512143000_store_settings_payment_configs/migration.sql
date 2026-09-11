-- Persist payment gateway UI config from General Settings (was sent but missing column → Prisma 500).
ALTER TABLE "store_settings" ADD COLUMN "paymentConfigs" JSONB;
