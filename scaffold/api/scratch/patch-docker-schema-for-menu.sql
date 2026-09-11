DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AddOnType') THEN
    CREATE TYPE "AddOnType" AS ENUM ('TOPPING', 'SAUCE', 'CHEESE', 'PREMIUM_TOPPING', 'SIDE_OPTION', 'CRUST', 'BREAD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AddOnCategory') THEN
    CREATE TYPE "AddOnCategory" AS ENUM ('REGULAR', 'PREMIUM', 'DIETARY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MeasurementUnit') THEN
    CREATE TYPE "MeasurementUnit" AS ENUM ('GRAMS', 'OUNCES', 'SLICES', 'PIECES', 'NONE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PricingRule') THEN
    CREATE TYPE "PricingRule" AS ENUM ('FLAT_FEE', 'PER_ITEM_PRICE', 'FIRST_TWO_FREE', 'TIER_BASED');
  END IF;
END $$;

ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'PIZZA';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'STROMBOLI';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'SUB';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'WRAP';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'CUSTOM';

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "configuration" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "combos"
  ADD COLUMN IF NOT EXISTS "galleryUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "combo_items"
  ADD COLUMN IF NOT EXISTS "componentType" TEXT NOT NULL DEFAULT 'MENU_ITEM',
  ADD COLUMN IF NOT EXISTS "selectionRules" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "allowCustomization" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "maxIncludedToppings" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freeModifierGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "addons" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "type" "AddOnType" NOT NULL DEFAULT 'TOPPING',
  "category" "AddOnCategory" NOT NULL DEFAULT 'REGULAR',
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "sizePrices" JSONB DEFAULT '{}',
  "measurementUnit" "MeasurementUnit" NOT NULL DEFAULT 'PIECES',
  "defaultQuantity" DECIMAL(10,3) NOT NULL DEFAULT 1.00,
  "applicableItemTypes" "ProductType"[],
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "addon_sets" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "pricingRule" "PricingRule" NOT NULL DEFAULT 'PER_ITEM_PRICE',
  "applicableItemTypes" "ProductType"[],
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "addon_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "set_addons" (
  "setId" TEXT NOT NULL,
  "addonId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "priceOverride" DECIMAL(10,2),
  CONSTRAINT "set_addons_pkey" PRIMARY KEY ("setId", "addonId")
);

CREATE TABLE IF NOT EXISTS "product_addon_sets" (
  "productId" TEXT NOT NULL,
  "addonSetId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "product_addon_sets_pkey" PRIMARY KEY ("productId", "addonSetId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "addons_storeId_name_key" ON "addons"("storeId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "addon_sets_storeId_name_key" ON "addon_sets"("storeId", "name");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addons_storeId_fkey') THEN
    ALTER TABLE "addons" ADD CONSTRAINT "addons_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addon_sets_storeId_fkey') THEN
    ALTER TABLE "addon_sets" ADD CONSTRAINT "addon_sets_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'set_addons_addonId_fkey') THEN
    ALTER TABLE "set_addons" ADD CONSTRAINT "set_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'set_addons_setId_fkey') THEN
    ALTER TABLE "set_addons" ADD CONSTRAINT "set_addons_setId_fkey" FOREIGN KEY ("setId") REFERENCES "addon_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_addon_sets_productId_fkey') THEN
    ALTER TABLE "product_addon_sets" ADD CONSTRAINT "product_addon_sets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_addon_sets_addonSetId_fkey') THEN
    ALTER TABLE "product_addon_sets" ADD CONSTRAINT "product_addon_sets_addonSetId_fkey" FOREIGN KEY ("addonSetId") REFERENCES "addon_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
