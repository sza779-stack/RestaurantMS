import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the store ID
  const store = await prisma.store.findFirst();
  if (!store) throw new Error('No store found');
  const storeId = store.id;

  console.log(`Using store: ${store.name} (${storeId})`);

  // ========== WING PRODUCTS ==========
  const wingsCat = await prisma.category.findFirst({ where: { name: 'Wings' } });
  if (!wingsCat) throw new Error('Wings category not found');

  // Create wing products
  const wingProducts = [
    { name: 'Buffalo Wings - 6 Pieces', basePrice: 8.99, imageUrl: '/images/wings.png' },
    { name: 'Buffalo Wings - 10 Pieces', basePrice: 13.99, imageUrl: '/images/wings.png' },
    { name: 'Buffalo Wings - 20 Pieces', basePrice: 24.99, imageUrl: '/images/wings.png' },
    { name: 'Buffalo Wings - 50 Pieces', basePrice: 54.99, imageUrl: '/images/wings.png' },
  ];

  for (const wp of wingProducts) {
    const existing = await prisma.product.findFirst({ where: { name: wp.name, categoryId: wingsCat.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          categoryId: wingsCat.id,
          name: wp.name,
          basePrice: wp.basePrice,
          imageUrl: wp.imageUrl,
          type: 'STANDALONE',
          isActive: true,
        }
      });
      console.log(`  Created wing product: ${wp.name}`);
    } else {
      await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: wp.imageUrl } });
      console.log(`  Updated wing product: ${wp.name}`);
    }
  }

  // Create Wing addon sets
  const wingStyleAddons = [
    { name: 'Traditional', price: 0 },
    { name: 'Boneless', price: 0 },
    { name: 'Mixed (Drumettes & Flats)', price: 0 },
    { name: 'All Drumettes', price: 0 },
    { name: 'All Flats', price: 0 },
  ];

  const wingFlavorAddons = [
    { name: 'Buffalo', price: 0 },
    { name: 'BBQ', price: 0 },
    { name: 'Garlic Parmesan', price: 0 },
    { name: 'Honey Mustard', price: 0 },
    { name: 'Lemon Pepper', price: 0 },
    { name: 'Teriyaki', price: 0 },
    { name: 'Mango Habanero', price: 0 },
    { name: 'Nashville Hot', price: 0 },
  ];

  const wingSideAddons = [
    { name: 'Celery Sticks', price: 0 },
    { name: 'Carrot Sticks', price: 0 },
    { name: 'Extra Ranch Cup', price: 0.79 },
    { name: 'Extra Blue Cheese', price: 0.79 },
    { name: 'Extra Celery', price: 0.99 },
  ];

  const wingDippingAddons = [
    { name: 'Ranch Dip', price: 0.79 },
    { name: 'Blue Cheese Dip', price: 0.79 },
    { name: 'Honey Mustard Dip', price: 0.79 },
    { name: 'Buffalo Ranch Dip', price: 0.79 },
    { name: 'BBQ Dip', price: 0.79 },
    { name: 'Garlic Sauce Dip', price: 0.79 },
  ];

  async function createAddonSet(setName: string, addons: { name: string; price: number }[], minSelect: number, maxSelect: number | null, addonType: string) {
    // Check if set already exists
    let set = await prisma.addOnSet.findFirst({ where: { storeId, name: setName } });
    if (set) {
      console.log(`  Addon set "${setName}" already exists, skipping`);
      return set;
    }

    // Create addons first
    const addonIds: string[] = [];
    for (const a of addons) {
      let addon = await prisma.addOn.findFirst({ where: { storeId, name: a.name } });
      if (!addon) {
        addon = await prisma.addOn.create({
          data: {
            storeId,
            name: a.name,
            price: a.price,
            type: addonType as any,
            isActive: true,
          }
        });
      }
      addonIds.push(addon.id);
    }

    // Create the set
    set = await prisma.addOnSet.create({
      data: {
        storeId,
        name: setName,
        minSelect,
        maxSelect,
        isActive: true,
        pricingRule: 'PER_ITEM_PRICE',
        addons: {
          create: addonIds.map((id, idx) => ({
            addonId: id,
            displayOrder: idx,
          })),
        },
      },
    });
    console.log(`  Created addon set: ${setName} with ${addonIds.length} addons`);
    return set;
  }

  const wingStyleSet = await createAddonSet('Wing Style', wingStyleAddons, 1, 1, 'SIDE_OPTION');
  const wingFlavorSet = await createAddonSet('Wing Flavors', wingFlavorAddons, 1, 2, 'SAUCE');
  const wingSideSet = await createAddonSet('Wing Sides', wingSideAddons, 0, 3, 'SIDE_OPTION');
  const wingDippingSet = await createAddonSet('Wing Dipping Sauces', wingDippingAddons, 0, 3, 'SAUCE');

  // Link addon sets to wing products
  const allWings = await prisma.product.findMany({ where: { categoryId: wingsCat.id, isActive: true } });
  for (const wing of allWings) {
    for (const setId of [wingStyleSet.id, wingFlavorSet.id, wingSideSet.id, wingDippingSet.id]) {
      const existing = await prisma.productAddOnSet.findUnique({
        where: { productId_addonSetId: { productId: wing.id, addonSetId: setId } }
      });
      if (!existing) {
        await prisma.productAddOnSet.create({
          data: { productId: wing.id, addonSetId: setId, displayOrder: 0 }
        });
      }
    }
    console.log(`  Linked addon sets to: ${wing.name}`);
  }

  // ========== DRINK PRODUCTS ==========
  const drinksCat = await prisma.category.findFirst({ where: { name: 'Drinks' } });
  if (!drinksCat) throw new Error('Drinks category not found');

  const drinkProducts = [
    { name: 'Pepsi', basePrice: 2.49, imageUrl: '/images/soda.png' },
    { name: 'Sprite', basePrice: 2.49, imageUrl: '/images/soda.png' },
    { name: 'Dr Pepper', basePrice: 2.49, imageUrl: '/images/soda.png' },
    { name: 'Orange Crush', basePrice: 2.49, imageUrl: '/images/soda.png' },
    { name: 'Ginger Ale', basePrice: 2.49, imageUrl: '/images/soda.png' },
    { name: 'Lemonade', basePrice: 2.99, imageUrl: '/images/soda.png' },
    { name: 'Iced Tea', basePrice: 2.99, imageUrl: '/images/soda.png' },
    { name: 'Water Bottle', basePrice: 1.99, imageUrl: '/images/soda.png' },
  ];

  // Also update existing Coca-Cola
  const existingCoke = await prisma.product.findFirst({ where: { name: 'Coca-Cola' } });
  if (existingCoke) {
    await prisma.product.update({
      where: { id: existingCoke.id },
      data: { imageUrl: '/images/soda.png', basePrice: 2.49 }
    });
    console.log(`  Updated Coca-Cola with image`);
  }

  for (const dp of drinkProducts) {
    const existing = await prisma.product.findFirst({ where: { name: dp.name, categoryId: drinksCat.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          categoryId: drinksCat.id,
          name: dp.name,
          basePrice: dp.basePrice,
          imageUrl: dp.imageUrl,
          type: 'STANDALONE',
          isActive: true,
        }
      });
      console.log(`  Created drink product: ${dp.name}`);
    } else {
      await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: dp.imageUrl } });
      console.log(`  Updated drink product: ${dp.name}`);
    }
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
