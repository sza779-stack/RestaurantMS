import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ComboLine = {
  name: string;
  quantity?: number;
  componentType?: string;
  categoryWords?: string[];
  productWords?: string[];
  productGroupLabel?: string;
  maxIncludedToppings?: number;
  allowModifiers?: boolean;
  allowCustomization?: boolean;
  selectionRules?: Prisma.InputJsonObject;
};

type SampleCombo = {
  name: string;
  description: string;
  sku: string;
  basePrice: string;
  retailValue: string;
  imageUrl: string;
  isFeatured?: boolean;
  prepTimeMinutes?: number;
  items: ComboLine[];
};

const samples: SampleCombo[] = [
  {
    name: 'Pizza, Wings & Soda Combo',
    description: '1 large cheese pizza, 12 jumbo wings, and one 2 liter soda. Great starter combo for online ordering.',
    sku: 'SAMPLE-PIZZA-WINGS-SODA',
    basePrice: '24.99',
    retailValue: '31.99',
    imageUrl: '/images/pizza-wings-combo.png',
    isFeatured: true,
    prepTimeMinutes: 22,
    items: [
      {
        name: '14" Large Cheese Pizza',
        componentType: 'PIZZA',
        productWords: ['large cheese pizza', 'cheese pizza', 'pizza'],
        categoryWords: ['pizza'],
        productGroupLabel: 'Customize your large pizza',
        maxIncludedToppings: 3,
        selectionRules: {
          requiredSize: '14" Large',
          allowHalfAndHalf: true,
          allowExtraSelections: true,
          allowPremiumOptions: true,
          countingMethod: 'TWO_HALVES_COUNT_ONE',
        },
      },
      {
        name: '12 Jumbo Wings',
        quantity: 12,
        componentType: 'WINGS',
        productWords: ['12 jumbo wings', '12 wings', 'wings'],
        categoryWords: ['wing'],
        productGroupLabel: 'Choose wing flavor',
        selectionRules: {
          pieceCount: 12,
          allowSplitFlavors: false,
          sauceOnSideAllowed: true,
        },
      },
      {
        name: '2 Liter Soda',
        componentType: 'SODA',
        productWords: ['2 liter', '2l', 'pepsi', 'coca-cola', 'soda'],
        categoryWords: ['soda', 'drink', 'beverage'],
        productGroupLabel: 'Choose your 2 liter',
        allowModifiers: false,
        allowCustomization: false,
        selectionRules: {
          requiredSize: '2 Liter',
          hideOutOfStock: true,
        },
      },
    ],
  },
  {
    name: 'Family Feast',
    description: 'Two pizzas, wings, and a drink selection for families and game nights.',
    sku: 'SAMPLE-FAMILY-FEAST',
    basePrice: '39.99',
    retailValue: '49.99',
    imageUrl: '/images/family-feast.png',
    isFeatured: true,
    prepTimeMinutes: 28,
    items: [
      {
        name: 'Choose First Pizza',
        componentType: 'PIZZA',
        categoryWords: ['pizza'],
        productGroupLabel: 'Choose first pizza',
        maxIncludedToppings: 3,
        selectionRules: { allowHalfAndHalf: true, allowExtraSelections: true },
      },
      {
        name: 'Choose Second Pizza',
        componentType: 'PIZZA',
        categoryWords: ['pizza'],
        productGroupLabel: 'Choose second pizza',
        maxIncludedToppings: 3,
        selectionRules: { allowHalfAndHalf: true, allowExtraSelections: true },
      },
      {
        name: 'Choose Wings',
        componentType: 'WINGS',
        categoryWords: ['wing'],
        productGroupLabel: 'Choose wings',
        selectionRules: { pieceCount: 20, allowSplitFlavors: true, sauceOnSideAllowed: true },
      },
      {
        name: 'Choose Drink',
        componentType: 'SODA',
        categoryWords: ['soda', 'drink', 'beverage'],
        productGroupLabel: 'Choose drink',
        allowModifiers: false,
        allowCustomization: false,
        selectionRules: { hideOutOfStock: true },
      },
    ],
  },
  {
    name: 'Lunch Pair Deal',
    description: 'A simple two-step lunch combo: choose a main item and choose a drink.',
    sku: 'SAMPLE-LUNCH-PAIR',
    basePrice: '12.99',
    retailValue: '16.49',
    imageUrl: '/images/sub-fries-combo.png',
    prepTimeMinutes: 14,
    items: [
      {
        name: 'Choose Lunch Item',
        componentType: 'MENU_CATEGORY',
        categoryWords: ['sub', 'sandwich', 'pizza', 'pasta'],
        productGroupLabel: 'Choose lunch item',
        maxIncludedToppings: 1,
      },
      {
        name: 'Choose Drink',
        componentType: 'SODA',
        categoryWords: ['soda', 'drink', 'beverage'],
        productGroupLabel: 'Choose drink',
        allowModifiers: false,
        allowCustomization: false,
        selectionRules: { hideOutOfStock: true },
      },
    ],
  },
];

function matchWords(value: string | null | undefined, words: string[]) {
  const normalized = String(value || '').toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

async function findCategory(storeId: string, words: string[]) {
  const categories = await prisma.category.findMany({
    where: { storeId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return categories.find((category) => matchWords(category.name, words)) || categories[0] || null;
}

async function findProduct(storeId: string, words: string[]) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { storeId },
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  return products.find((product) =>
    matchWords(product.name, words) || matchWords(product.category?.name, words),
  ) || null;
}

async function ensureDemoMenu(storeId: string) {
  const categoryCount = await prisma.category.count({ where: { storeId, isActive: true } });
  if (categoryCount > 0) return;

  console.log('  No active categories found; creating minimal demo menu categories/products.');

  const demoCategories = [
    {
      name: 'Pizza',
      sortOrder: 10,
      products: [
        { name: 'Large Cheese Pizza', basePrice: '14.99', imageUrl: '/images/pepperoni.png' },
        { name: 'Large Pepperoni Pizza', basePrice: '16.99', imageUrl: '/images/pepperoni.png' },
      ],
    },
    {
      name: 'Wings',
      sortOrder: 20,
      products: [
        { name: '12 Jumbo Wings', basePrice: '13.99', imageUrl: '/images/wings.png' },
        { name: '20 Jumbo Wings', basePrice: '22.99', imageUrl: '/images/wings.png' },
      ],
    },
    {
      name: 'Drinks',
      sortOrder: 30,
      products: [
        { name: '2 Liter Pepsi', basePrice: '3.49', imageUrl: '/images/soda.png' },
        { name: '2 Liter Coca-Cola', basePrice: '3.49', imageUrl: '/images/soda.png' },
      ],
    },
  ];

  for (const category of demoCategories) {
    const createdCategory = await prisma.category.create({
      data: {
        storeId,
        name: category.name,
        description: `Demo ${category.name.toLowerCase()} category`,
        sortOrder: category.sortOrder,
        availableDays: [],
        isActive: true,
      },
    });

    for (const product of category.products) {
      await prisma.product.create({
        data: {
          categoryId: createdCategory.id,
          name: product.name,
          description: `Editable demo product for ${category.name}`,
          basePrice: product.basePrice,
          imageUrl: product.imageUrl,
          galleryUrls: [],
          type: category.name === 'Pizza' ? 'PIZZA' : 'STANDALONE',
          configuration: {},
          isActive: true,
          isFeatured: false,
        },
      });
    }
  }
}

async function resolveLine(storeId: string, line: ComboLine, sortOrder: number) {
  const product = line.productWords ? await findProduct(storeId, line.productWords) : null;
  const category = product ? null : await findCategory(storeId, line.categoryWords || []);

  if (!product && !category) {
    throw new Error(`Could not resolve product/category for combo line "${line.name}"`);
  }

  return {
    ...(product ? { product: { connect: { id: product.id } } } : {}),
    ...(!product && category ? { category: { connect: { id: category.id } } } : {}),
    name: line.name,
    quantity: line.quantity || 1,
    componentType: line.componentType || 'MENU_ITEM',
    selectionRules: line.selectionRules || {},
    allowSizeSelection: true,
    defaultSizeId: null,
    allowedSizeIds: [],
    allowCustomization: line.allowCustomization ?? true,
    maxIncludedToppings: line.maxIncludedToppings || 0,
    freeModifierGroups: [],
    allowModifiers: line.allowModifiers ?? true,
    includedModifierIds: [],
    isProductFixed: !!product,
    productGroupLabel: line.productGroupLabel || line.name,
    sortOrder,
  };
}

async function upsertCombo(storeId: string, sample: SampleCombo) {
  const items = await Promise.all(sample.items.map((line, index) => resolveLine(storeId, line, index)));
  const existing = await prisma.combo.findFirst({
    where: { storeId, sku: sample.sku },
    select: { id: true },
  });

  const data = {
    storeId,
    name: sample.name,
    description: sample.description,
    sku: sample.sku,
    basePrice: sample.basePrice,
    retailValue: sample.retailValue,
    imageUrl: sample.imageUrl,
    galleryUrls: [],
    isActive: true,
    isFeatured: sample.isFeatured || false,
    prepTimeMinutes: sample.prepTimeMinutes || 15,
    availableFrom: null,
    availableTo: null,
    availableDays: [],
  };

  if (existing) {
    await prisma.comboItem.deleteMany({ where: { comboId: existing.id } });
    await prisma.combo.update({
      where: { id: existing.id },
      data: {
        ...data,
        items: { create: items },
      },
    });
    console.log(`Updated combo: ${sample.name}`);
    return;
  }

  await prisma.combo.create({
    data: {
      ...data,
      items: { create: items },
    },
  });
  console.log(`Created combo: ${sample.name}`);
}

async function main() {
  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
  if (stores.length === 0) throw new Error('No stores found. Create a store before seeding combos.');

  for (const store of stores) {
    console.log(`\nSeeding sample combos for ${store.name}`);
    await ensureDemoMenu(store.id);
    for (const sample of samples) {
      await upsertCombo(store.id, sample);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
