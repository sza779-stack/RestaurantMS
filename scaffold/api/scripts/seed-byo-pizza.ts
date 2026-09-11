import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Build Your Own Pizza Data ---');

  // 0. Get the first store
  const store = await prisma.store.findFirst();
  if (!store) {
    console.error('No store found. Please create a store first.');
    return;
  }
  const storeId = store.id;

  // 1. Find or Create Pizza Category
  let pizzaCategory = await prisma.category.findFirst({
    where: { name: 'Pizza', storeId }
  });

  if (!pizzaCategory) {
    pizzaCategory = await prisma.category.create({
      data: {
        name: 'Pizza',
        storeId,
        isActive: true,
        sortOrder: 1
      }
    });
  }

  // 2. Create "Build Your Own Pizza" Product
  let byoProduct = await prisma.product.findFirst({
    where: { name: 'Build Your Own Pizza', categoryId: pizzaCategory.id }
  });

  if (!byoProduct) {
    byoProduct = await prisma.product.create({
      data: {
        name: 'Build Your Own Pizza',
        description: 'Create your perfect pizza with custom toppings',
        basePrice: 10.99,
        categoryId: pizzaCategory.id,
        type: 'CUSTOM' as any,
        isActive: true,
        kitchenStation: 'PIZZA' as any
      }
    });
  }

  // 3. Create Add-On Sets (Crust, Sauce, Cheese, Meats, Veggies)
  const sets = [
    { name: 'Pizza Crust', minSelect: 1, maxSelect: 1 },
    { name: 'Pizza Sauce', minSelect: 1, maxSelect: 1 },
    { name: 'Pizza Cheese', minSelect: 1, maxSelect: 1 },
    { name: 'Pizza Meats', minSelect: 0, maxSelect: 10 },
    { name: 'Pizza Veggies', minSelect: 0, maxSelect: 10 },
  ];

  const createdSets: any = {};
  for (const s of sets) {
    let set = await prisma.addOnSet.findFirst({ where: { name: s.name, storeId } });
    if (!set) {
      set = await prisma.addOnSet.create({
        data: {
          name: s.name,
          minSelect: s.minSelect,
          maxSelect: s.maxSelect,
          storeId,
          isActive: true
        }
      });
    }
    createdSets[s.name] = set;
  }

  // 4. Create Add-Ons with Size Prices
  const addons = [
    { name: 'Hand Tossed', set: 'Pizza Crust', price: 0 },
    { name: 'Thin Crust', set: 'Pizza Crust', price: 0 },
    { name: 'Classic Tomato', set: 'Pizza Sauce', price: 0 },
    { name: 'Mozzarella', set: 'Pizza Cheese', price: 0 },
    { name: 'Pepperoni', set: 'Pizza Meats', price: 1.5, sizePrices: { SMALL: 1.5, MEDIUM: 1.75, LARGE: 2.0, XL: 2.25 } },
    { name: 'Sausage', set: 'Pizza Meats', price: 1.5, sizePrices: { SMALL: 1.5, MEDIUM: 1.75, LARGE: 2.0, XL: 2.25 } },
    { name: 'Mushrooms', set: 'Pizza Veggies', price: 1.0, sizePrices: { SMALL: 1.0, MEDIUM: 1.25, LARGE: 1.5, XL: 1.75 } },
    { name: 'Onions', set: 'Pizza Veggies', price: 1.0, sizePrices: { SMALL: 1.0, MEDIUM: 1.25, LARGE: 1.5, XL: 1.75 } },
  ];

  for (const a of addons) {
    let addon = await prisma.addOn.findFirst({ where: { name: a.name, storeId } });
    if (!addon) {
      addon = await prisma.addOn.create({
        data: {
          name: a.name,
          price: a.price,
          sizePrices: (a as any).sizePrices || {},
          storeId,
          isActive: true,
          type: (a.set === 'Pizza Meats' || a.set === 'Pizza Veggies' ? 'TOPPING' : 'CRUST') as any, // CRUST is in AddOnType enum
          category: 'REGULAR' as any
        }
      });
    }

    // Link to set (SetAddOn is the join table)
    const existingLink = await prisma.setAddOn.findUnique({
      where: {
        setId_addonId: {
          addonId: addon.id,
          setId: createdSets[a.set].id
        }
      }
    });

    if (!existingLink) {
      await prisma.setAddOn.create({
        data: {
          addonId: addon.id,
          setId: createdSets[a.set].id,
          displayOrder: 0,
          priceOverride: null
        }
      });
    }
  }

  // 5. Link Sets to Product (ProductAddOnSet is the join table)
  for (const setName in createdSets) {
    const set = createdSets[setName];
    const existingLink = await prisma.productAddOnSet.findUnique({
      where: {
        productId_addonSetId: {
          productId: byoProduct.id,
          addonSetId: set.id
        }
      }
    });

    if (!existingLink) {
      await prisma.productAddOnSet.create({
        data: {
          productId: byoProduct.id,
          addonSetId: set.id,
          displayOrder: 0
        }
      });
    }
  }

  // 6. Add Sizes to Product
  const sizes = [
    { name: 'Small (10")', priceAdjustment: 0, code: 'SMALL' },
    { name: 'Medium (12")', priceAdjustment: 3.0, code: 'MEDIUM' },
    { name: 'Large (14")', priceAdjustment: 6.0, code: 'LARGE' },
    { name: 'X-Large (16")', priceAdjustment: 9.0, code: 'XL' },
  ];

  for (const s of sizes) {
    const existingSize = await prisma.productSize.findFirst({
      where: {
        productId: byoProduct.id,
        name: s.name
      }
    });

    if (!existingSize) {
      await prisma.productSize.create({
        data: {
          productId: byoProduct.id,
          name: s.name,
          priceAdjustment: s.priceAdjustment,
          code: s.code,
          sortOrder: 0
        }
      });
    }
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
