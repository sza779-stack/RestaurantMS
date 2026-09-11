/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Pizza Modifier Groups for Active Store ---');

  // Get the store that has "Build Your Own Pizza" product
  const byoProduct = await prisma.product.findFirst({
    where: { name: 'Build Your Own Pizza', isActive: true },
    include: { category: true }
  });

  if (!byoProduct) {
    console.error('❌ "Build Your Own Pizza" product not found. Please create it first.');
    return;
  }

  // Find the store via the product's category
  const storeId = byoProduct.category?.storeId;
  if (!storeId) {
    // Fallback: get first store
    const store = await prisma.store.findFirst();
    if (!store) {
      console.error('❌ No store found.');
      return;
    }
    console.log(`Using store: ${store.name} (${store.id})`);
    await seedModifiers(store.id, byoProduct.id);
  } else {
    console.log(`Using store from product category: ${storeId}`);
    await seedModifiers(storeId, byoProduct.id);
  }

  console.log('\n✅ --- Seeding Completed Successfully ---');
}

async function seedModifiers(storeId: string, productId: string) {
  // ═══════════════════════════════════════════
  // 1. CRUST TYPE — Single Select
  // ═══════════════════════════════════════════
  const crustSet = await upsertSet('Crust Type', storeId, 1, 1);
  const crustAddons = [
    { name: 'Hand Tossed', price: 0, type: 'CRUST' },
    { name: 'Thin Crust', price: 0, type: 'CRUST' },
    { name: 'Stuffed Crust', price: 2.50, type: 'CRUST' },
    { name: 'NY Style', price: 0, type: 'CRUST' },
    { name: 'Deep Dish', price: 1.50, type: 'CRUST' },
    { name: 'Gluten Free', price: 3.00, type: 'CRUST' },
  ];
  for (let i = 0; i < crustAddons.length; i++) {
    await upsertAddon(crustAddons[i], storeId, crustSet.id, i);
  }

  // ═══════════════════════════════════════════
  // 2. SAUCE — Single Select
  // ═══════════════════════════════════════════
  const sauceSet = await upsertSet('Sauce', storeId, 1, 1);
  const sauceAddons = [
    { name: 'Classic Tomato', price: 0, type: 'SAUCE' },
    { name: 'Alfredo', price: 0.50, type: 'SAUCE' },
    { name: 'BBQ', price: 0.50, type: 'SAUCE' },
    { name: 'Garlic Parmesan', price: 0.50, type: 'SAUCE' },
    { name: 'Buffalo', price: 0.50, type: 'SAUCE' },
    { name: 'Pesto', price: 1.00, type: 'SAUCE' },
    { name: 'No Sauce', price: 0, type: 'SAUCE' },
  ];
  for (let i = 0; i < sauceAddons.length; i++) {
    await upsertAddon(sauceAddons[i], storeId, sauceSet.id, i);
  }

  // ═══════════════════════════════════════════
  // 3. CHEESE — Single Select
  // ═══════════════════════════════════════════
  const cheeseSet = await upsertSet('Cheese', storeId, 1, 1);
  const cheeseAddons = [
    { name: 'Mozzarella', price: 0, type: 'CHEESE' },
    { name: 'Extra Mozzarella', price: 1.50, type: 'CHEESE' },
    { name: 'Cheddar Blend', price: 0.50, type: 'CHEESE' },
    { name: 'Parmesan', price: 0.50, type: 'CHEESE' },
    { name: 'Four Cheese Blend', price: 1.00, type: 'CHEESE' },
    { name: 'No Cheese', price: 0, type: 'CHEESE' },
  ];
  for (let i = 0; i < cheeseAddons.length; i++) {
    await upsertAddon(cheeseAddons[i], storeId, cheeseSet.id, i);
  }

  // ═══════════════════════════════════════════
  // 4. MEAT TOPPINGS — Multi Select (0-10)
  // ═══════════════════════════════════════════
  const meatSet = await upsertSet('Meat Toppings', storeId, 0, 10);
  const meatAddons = [
    { name: 'Pepperoni', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
    { name: 'Italian Sausage', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
    { name: 'Bacon', price: 1.75, type: 'TOPPING', sizePrices: { SMALL: 1.75, MEDIUM: 2.00, LARGE: 2.25, XL: 2.50 } },
    { name: 'Ham', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
    { name: 'Grilled Chicken', price: 2.00, type: 'TOPPING', sizePrices: { SMALL: 2.00, MEDIUM: 2.25, LARGE: 2.50, XL: 2.75 } },
    { name: 'Steak', price: 2.50, type: 'TOPPING', sizePrices: { SMALL: 2.50, MEDIUM: 2.75, LARGE: 3.00, XL: 3.25 } },
    { name: 'Ground Beef', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
    { name: 'Anchovies', price: 1.75, type: 'TOPPING', sizePrices: { SMALL: 1.75, MEDIUM: 2.00, LARGE: 2.25, XL: 2.50 } },
  ];
  for (let i = 0; i < meatAddons.length; i++) {
    await upsertAddon(meatAddons[i], storeId, meatSet.id, i);
  }

  // ═══════════════════════════════════════════
  // 5. VEGGIE TOPPINGS — Multi Select (0-10)
  // ═══════════════════════════════════════════
  const veggieSet = await upsertSet('Veggie Toppings', storeId, 0, 10);
  const veggieAddons = [
    { name: 'Mushrooms', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Green Peppers', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Onions', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Black Olives', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Tomatoes', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Jalapeños', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Spinach', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Pineapple', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Banana Peppers', price: 1.00, type: 'TOPPING', sizePrices: { SMALL: 1.00, MEDIUM: 1.25, LARGE: 1.50, XL: 1.75 } },
    { name: 'Artichoke Hearts', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
    { name: 'Roasted Garlic', price: 0.75, type: 'TOPPING', sizePrices: { SMALL: 0.75, MEDIUM: 1.00, LARGE: 1.25, XL: 1.50 } },
    { name: 'Sun-Dried Tomatoes', price: 1.50, type: 'TOPPING', sizePrices: { SMALL: 1.50, MEDIUM: 1.75, LARGE: 2.00, XL: 2.25 } },
  ];
  for (let i = 0; i < veggieAddons.length; i++) {
    await upsertAddon(veggieAddons[i], storeId, veggieSet.id, i);
  }

  // ═══════════════════════════════════════════
  // 6. LINK ALL SETS TO PRODUCT
  // ═══════════════════════════════════════════
  const allSets = [crustSet, sauceSet, cheeseSet, meatSet, veggieSet];
  for (let i = 0; i < allSets.length; i++) {
    await linkSetToProduct(productId, allSets[i].id, i);
  }

  console.log(`\n  🔗 Linked ${allSets.length} modifier groups to "Build Your Own Pizza"`);
}

// ─── Helpers ────────────────────────────────

async function upsertSet(name: string, storeId: string, minSelect: number, maxSelect: number) {
  let set = await prisma.addOnSet.findFirst({ where: { name, storeId } });
  if (!set) {
    set = await prisma.addOnSet.create({
      data: { name, storeId, minSelect, maxSelect, isActive: true }
    });
    console.log(`  ✅ Created set: "${name}"`);
  } else {
    // Update to active in case it was inactive
    await prisma.addOnSet.update({ where: { id: set.id }, data: { isActive: true, minSelect, maxSelect } });
    console.log(`  ♻️  Set exists: "${name}" (updated to active)`);
  }
  return set;
}

async function upsertAddon(
  addon: { name: string; price: number; type: string; sizePrices?: any },
  storeId: string,
  setId: string,
  displayOrder: number
) {
  let existing = await prisma.addOn.findFirst({ where: { name: addon.name, storeId } });
  if (!existing) {
    existing = await prisma.addOn.create({
      data: {
        name: addon.name,
        price: addon.price,
        sizePrices: addon.sizePrices || {},
        storeId,
        isActive: true,
        type: addon.type as any,
        category: 'REGULAR' as any
      }
    });
    console.log(`    + ${addon.name} ($${addon.price.toFixed(2)})`);
  }

  // Link to set
  const link = await prisma.setAddOn.findUnique({
    where: { setId_addonId: { addonId: existing.id, setId } }
  });
  if (!link) {
    await prisma.setAddOn.create({
      data: { addonId: existing.id, setId, displayOrder, priceOverride: null }
    });
  }
}

async function linkSetToProduct(productId: string, setId: string, displayOrder: number) {
  const existing = await prisma.productAddOnSet.findUnique({
    where: { productId_addonSetId: { productId, addonSetId: setId } }
  });
  if (!existing) {
    await prisma.productAddOnSet.create({
      data: { productId, addonSetId: setId, displayOrder }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
