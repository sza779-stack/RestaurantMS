import { PrismaClient, KitchenStation } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Pizza Palace Inc.',
      legalName: 'Pizza Palace Restaurant Group LLC',
      taxId: '12-3456789',
      address: '123 Main Street, New York, NY 10001',
      phone: '(555) 123-4567',
      email: 'info@pizzapalace.com',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  });
  console.log(`✅ Created company: ${company.name}`);

  // 2. Create Roles (global, no companyId)
  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      description: 'Full system access',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Store Manager',
      description: 'Store management access',
    },
  });

  const cashierRole = await prisma.role.create({
    data: {
      name: 'Cashier',
      description: 'POS access',
    },
  });
  console.log('✅ Created roles');

  // 3. Create Stores
  const downtownStore = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Downtown Location',
      code: 'DT',
      address: '456 Downtown Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      phone: '(555) 234-5678',
      timezone: 'America/New_York',
      taxRate: 0.08,
      isActive: true,
    },
  });

  const uptownStore = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Uptown Location',
      code: 'UT',
      address: '789 Uptown Blvd',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      phone: '(555) 345-6789',
      timezone: 'America/New_York',
      taxRate: 0.08,
      isActive: true,
    },
  });
  console.log(`✅ Created stores: ${downtownStore.name}, ${uptownStore.name}`);

  // 4. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      roleId: ownerRole.id,
      email: 'owner@pizzapalace.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Owner',
      isActive: true,
      storeAccess: {
        create: [
          { storeId: downtownStore.id },
          { storeId: uptownStore.id },
        ],
      },
    },
  });

  const dtManager = await prisma.user.create({
    data: {
      companyId: company.id,
      roleId: managerRole.id,
      email: 'manager.dt@pizzapalace.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Manager',
      isActive: true,
      storeAccess: {
        create: [{ storeId: downtownStore.id }],
      },
    },
  });

  const dtCashier = await prisma.user.create({
    data: {
      companyId: company.id,
      roleId: cashierRole.id,
      email: 'cashier.dt@pizzapalace.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Cashier',
      isActive: true,
      storeAccess: {
        create: [{ storeId: downtownStore.id }],
      },
    },
  });
  console.log('✅ Created users');

  // 5. Create Categories with explicit IDs matching frontend MENU_STRUCTURE
  const pizzaCategory = await prisma.category.create({
    data: {
      id: 'PIZZA',
      storeId: downtownStore.id,
      name: 'Pizza',
      sortOrder: 1,
      isActive: true,
      icon: '🍕',
      color: '#ef4444',
    },
  });

  const pastaCategory = await prisma.category.create({
    data: {
      id: 'PASTA',
      storeId: downtownStore.id,
      name: 'Pasta',
      sortOrder: 2,
      isActive: true,
      icon: '🍝',
      color: '#eab308',
    },
  });

  const subsCategory = await prisma.category.create({
    data: {
      id: 'SUBS',
      storeId: downtownStore.id,
      name: 'Subs',
      sortOrder: 3,
      isActive: true,
      icon: '🥪',
      color: '#22c55e',
    },
  });

  const wingsCategory = await prisma.category.create({
    data: {
      id: 'WINGS',
      storeId: downtownStore.id,
      name: 'Wings',
      sortOrder: 4,
      isActive: true,
      icon: '🍗',
      color: '#f97316',
    },
  });

  const sidesCategory = await prisma.category.create({
    data: {
      id: 'SIDES',
      storeId: downtownStore.id,
      name: 'Sides',
      sortOrder: 5,
      isActive: true,
      icon: '🍟',
      color: '#eab308',
    },
  });

  const drinksCategory = await prisma.category.create({
    data: {
      id: 'DRINKS',
      storeId: downtownStore.id,
      name: 'Drinks',
      sortOrder: 6,
      isActive: true,
      icon: '🥤',
      color: '#3b82f6',
    },
  });

  const dessertCategory = await prisma.category.create({
    data: {
      id: 'DESSERT',
      storeId: downtownStore.id,
      name: 'Dessert',
      sortOrder: 7,
      isActive: true,
      icon: '🍰',
      color: '#ec4899',
    },
  });
  console.log('✅ Created categories');

  // 6. Create Products with Sizes (using priceAdjustment)
  const pepperoniPizza = await prisma.product.create({
    data: {
      categoryId: pizzaCategory.id,
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni pizza with mozzarella cheese',
      basePrice: 12.99,
      kitchenStation: KitchenStation.PIZZA,
      isActive: true,
      sizes: {
        create: [
          { name: 'Small', code: 'SM', priceAdjustment: 0 },
          { name: 'Medium', code: 'MD', priceAdjustment: 3.00 },
          { name: 'Large', code: 'LG', priceAdjustment: 6.00 },
        ],
      },
      storeConfigs: {
        create: [
          { storeId: downtownStore.id, price: 12.99, isAvailable: true },
        ],
      },
    },
  });

  const margheritaPizza = await prisma.product.create({
    data: {
      categoryId: pizzaCategory.id,
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, tomato sauce, and basil',
      basePrice: 11.99,
      kitchenStation: KitchenStation.PIZZA,
      isActive: true,
      sizes: {
        create: [
          { name: 'Small', code: 'SM', priceAdjustment: 0 },
          { name: 'Medium', code: 'MD', priceAdjustment: 3.00 },
          { name: 'Large', code: 'LG', priceAdjustment: 6.00 },
        ],
      },
      storeConfigs: {
        create: [
          { storeId: downtownStore.id, price: 11.99, isAvailable: true },
        ],
      },
    },
  });

  const spaghetti = await prisma.product.create({
    data: {
      categoryId: pastaCategory.id,
      name: 'Spaghetti Bolognese',
      description: 'Spaghetti with homemade meat sauce',
      basePrice: 13.99,
      kitchenStation: KitchenStation.GENERAL,
      isActive: true,
      storeConfigs: {
        create: [
          { storeId: downtownStore.id, price: 13.99, isAvailable: true },
        ],
      },
    },
  });

  const coke = await prisma.product.create({
    data: {
      categoryId: drinksCategory.id,
      name: 'Coca-Cola',
      description: 'Refreshing soft drink',
      basePrice: 2.99,
      kitchenStation: KitchenStation.DRINKS,
      isActive: true,
      sizes: {
        create: [
          { name: 'Can', code: 'CAN', priceAdjustment: 0 },
          { name: 'Bottle', code: 'BTL', priceAdjustment: 1.00 },
        ],
      },
      storeConfigs: {
        create: [
          { storeId: downtownStore.id, price: 2.99, isAvailable: true },
        ],
      },
    },
  });
  console.log('✅ Created products');

  // 6b. Create Desi Menu Categories and Products
  console.log('🌶️ Creating Desi menu items...');

  // Desi Categories - Using explicit IDs that match the frontend MENU_STRUCTURE
  const biryaniCategory = await prisma.category.create({
    data: { id: 'BIRYANI', storeId: downtownStore.id, name: 'Biryani', sortOrder: 10, isActive: true, icon: '🍚', color: '#d97706' },
  });
  const karahiCategory = await prisma.category.create({
    data: { id: 'KARAHI', storeId: downtownStore.id, name: 'Karahi', sortOrder: 11, isActive: true, icon: '🥘', color: '#dc2626' },
  });
  const bbqCategory = await prisma.category.create({
    data: { id: 'BBQ_GRILL', storeId: downtownStore.id, name: 'BBQ & Grill', sortOrder: 12, isActive: true, icon: '🔥', color: '#c2410c' },
  });
  const handiCategory = await prisma.category.create({
    data: { id: 'HANDI', storeId: downtownStore.id, name: 'Handi', sortOrder: 13, isActive: true, icon: '🍲', color: '#b45309' },
  });
  const tandoorCategory = await prisma.category.create({
    data: { id: 'TANDOOR', storeId: downtownStore.id, name: 'Tandoor', sortOrder: 14, isActive: true, icon: '🫓', color: '#b91c1c' },
  });
  const curryCategory = await prisma.category.create({
    data: { id: 'CURRIES', storeId: downtownStore.id, name: 'Curries', sortOrder: 15, isActive: true, icon: '🥣', color: '#a16207' },
  });
  const streetFoodCategory = await prisma.category.create({
    data: { id: 'STREET_FOOD', storeId: downtownStore.id, name: 'Street Food', sortOrder: 16, isActive: true, icon: '🌮', color: '#059669' },
  });
  const desiDessertCategory = await prisma.category.create({
    data: { id: 'DESI_DESSERT', storeId: downtownStore.id, name: 'Desi Desserts', sortOrder: 17, isActive: true, icon: '🍮', color: '#db2777' },
  });
  const desiDrinksCategory = await prisma.category.create({
    data: { id: 'DESI_DRINKS', storeId: downtownStore.id, name: 'Desi Drinks', sortOrder: 18, isActive: true, icon: '🧉', color: '#059669' },
  });

  // Desi Products
  const desiProducts = [
    // Biryani Items
    { name: 'Chicken Biryani (Half)', description: 'Fragrant basmati rice with tender chicken', price: 12.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Chicken Biryani (Full)', description: 'Full plate serves 2', price: 22.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Mutton Biryani (Half)', description: 'Aromatic lamb biryani', price: 15.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Hyderabadi Biryani', description: 'Authentic dum-cooked biryani', price: 15.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Veg Biryani', description: 'Mixed vegetables with fragrant rice', price: 10.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Egg Biryani', description: 'Rice with boiled eggs and spices', price: 11.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Special Shahi Biryani', description: 'Chef special with premium ingredients', price: 18.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },
    { name: 'Biryani Family Pack', description: 'Serves 4-5 people', price: 45.99, categoryId: biryaniCategory.id, station: KitchenStation.GENERAL },

    // Karahi Items
    { name: 'Chicken Karahi (Half)', description: 'Wok-cooked chicken with tomatoes and ginger', price: 14.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Chicken Karahi (Full)', description: 'Full karahi serves 3-4', price: 26.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Mutton Karahi (Half)', description: 'Classic lamb karahi', price: 18.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },
    { name: 'White Chicken Karahi', description: 'Creamy white karahi with yogurt', price: 16.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Green Karahi', description: 'With fresh green herbs', price: 15.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Paneer Karahi', description: 'Cottage cheese in tomato gravy', price: 13.99, categoryId: karahiCategory.id, station: KitchenStation.GENERAL },

    // BBQ Items
    { name: 'Chicken Tikka (4 pcs)', description: 'Marinated grilled chicken', price: 12.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },
    { name: 'Seekh Kebab (4 pcs)', description: 'Minced beef skewers', price: 11.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },
    { name: 'Malai Boti', description: 'Creamy marinated meat chunks', price: 13.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },
    { name: 'Reshmi Kebab', description: 'Silky smooth chicken kebabs', price: 12.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },
    { name: 'BBQ Platter', description: 'Assorted BBQ items', price: 24.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },
    { name: 'Grilled Fish', description: 'Whole fish with desi spices', price: 18.99, categoryId: bbqCategory.id, station: KitchenStation.GRILL },

    // Handi Items
    { name: 'Chicken Handi', description: 'Creamy clay pot chicken', price: 15.99, categoryId: handiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Mutton Handi', description: 'Slow-cooked lamb', price: 19.99, categoryId: handiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Butter Chicken Handi', description: 'Rich makhani gravy', price: 16.99, categoryId: handiCategory.id, station: KitchenStation.GENERAL },
    { name: 'Paneer Handi', description: 'Cottage cheese in creamy gravy', price: 14.99, categoryId: handiCategory.id, station: KitchenStation.GENERAL },

    // Tandoor Items
    { name: 'Plain Naan', description: 'Freshly baked tandoori naan', price: 1.99, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },
    { name: 'Garlic Naan', description: 'Naan topped with garlic and cilantro', price: 2.99, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },
    { name: 'Cheese Naan', description: 'Stuffed with melted cheese', price: 3.99, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },
    { name: 'Aloo Paratha', description: 'Stuffed with spiced potatoes', price: 3.99, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },
    { name: 'Paneer Paratha', description: 'Stuffed with cottage cheese', price: 4.99, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },
    { name: 'Kulcha', description: 'Leavened stuffed bread', price: 3.49, categoryId: tandoorCategory.id, station: KitchenStation.GENERAL },

    // Curry Items
    { name: 'Chicken Korma', description: 'Mild creamy curry with nuts', price: 14.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },
    { name: 'Chicken Tikka Masala', description: 'Grilled chicken in tomato gravy', price: 15.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },
    { name: 'Chicken Vindaloo', description: 'Hot and tangy curry', price: 15.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },
    { name: 'Palak Paneer', description: 'Cottage cheese in spinach', price: 13.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },
    { name: 'Daal Makhani', description: 'Creamy black lentils', price: 10.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },
    { name: 'Chana Masala', description: 'Chickpeas in spicy gravy', price: 10.99, categoryId: curryCategory.id, station: KitchenStation.GENERAL },

    // Street Food Items
    { name: 'Vegetable Samosa (2)', description: 'Crispy pastry with spiced potatoes', price: 4.99, categoryId: streetFoodCategory.id, station: KitchenStation.FRYER },
    { name: 'Chicken Samosa (2)', description: 'Crispy pastry with spiced chicken', price: 5.99, categoryId: streetFoodCategory.id, station: KitchenStation.FRYER },
    { name: 'Chicken Kathi Roll', description: 'Wrap with grilled chicken', price: 8.99, categoryId: streetFoodCategory.id, station: KitchenStation.GENERAL },
    { name: 'Aloo Chaat', description: 'Spiced potato chaat', price: 5.99, categoryId: streetFoodCategory.id, station: KitchenStation.GENERAL },
    { name: 'Vegetable Pakora (8)', description: 'Mixed vegetable fritters', price: 5.99, categoryId: streetFoodCategory.id, station: KitchenStation.FRYER },
    { name: 'Gol Gappa (8)', description: 'Crispy shells with spiced water', price: 6.99, categoryId: streetFoodCategory.id, station: KitchenStation.GENERAL },

    // Dessert Items
    { name: 'Gulab Jamun (2)', description: 'Sweet milk dumplings', price: 4.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },
    { name: 'Hot Jalebi', description: 'Crispy spirals in sugar syrup', price: 5.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },
    { name: 'Kheer', description: 'Creamy rice pudding', price: 5.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },
    { name: 'Gajar ka Halwa', description: 'Carrot pudding', price: 6.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },
    { name: 'Kulfi', description: 'Traditional Indian ice cream', price: 4.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },
    { name: 'Rasmalai (2)', description: 'Cheese patties in saffron milk', price: 5.99, categoryId: desiDessertCategory.id, station: KitchenStation.DESSERT },

    // Drink Items
    { name: 'Sweet Lassi', description: 'Refreshing yogurt drink', price: 3.99, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
    { name: 'Mango Lassi', description: 'Yogurt with mango pulp', price: 4.99, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
    { name: 'Masala Chai', description: 'Spiced tea with milk', price: 2.99, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
    { name: 'Rooh Afza', description: 'Rose syrup drink', price: 3.49, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
    { name: 'Nimboo Pani', description: 'Refreshing lemon water', price: 2.99, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
    { name: 'Thandai', description: 'Cooling milk drink', price: 4.99, categoryId: desiDrinksCategory.id, station: KitchenStation.DRINKS },
  ];

  for (const product of desiProducts) {
    await prisma.product.create({
      data: {
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        basePrice: product.price,
        kitchenStation: product.station,
        isActive: true,
        storeConfigs: {
          create: [{ storeId: downtownStore.id, price: product.price, isAvailable: true }],
        },
      },
    });
  }
  console.log(`✅ Created ${desiProducts.length} Desi menu items`);

  // 7. Create Modifiers
  const extraCheeseModifier = await prisma.modifier.create({
    data: {
      name: 'Extra Cheese',
      description: 'Add extra cheese to your pizza',
      type: 'SINGLE_SELECT',
      basePrice: 1.50,
      isActive: true,
    },
  });

  // Link modifier to product
  await prisma.productModifier.create({
    data: {
      productId: pepperoniPizza.id,
      modifierId: extraCheeseModifier.id,
      isRequired: false,
    },
  });
  console.log('✅ Created modifiers');

  // 8. Create Ledger Accounts for Finance
  const cashAccount = await prisma.ledgerAccount.create({
    data: {
      companyId: company.id,
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      subtype: 'CURRENT_ASSET',
      isActive: true,
    },
  });

  const salesAccount = await prisma.ledgerAccount.create({
    data: {
      companyId: company.id,
      code: '4000',
      name: 'Sales Revenue',
      type: 'REVENUE',
      subtype: 'OPERATING_REVENUE',
      isActive: true,
    },
  });

  const cogsAccount = await prisma.ledgerAccount.create({
    data: {
      companyId: company.id,
      code: '5000',
      name: 'Cost of Goods Sold',
      type: 'EXPENSE',
      subtype: 'COGS',
      isActive: true,
    },
  });
  console.log('✅ Created ledger accounts');

  // 9. Create Employees
  const employee = await prisma.employee.create({
    data: {
      storeId: downtownStore.id,
      userId: dtCashier.id,
      firstName: 'Mike',
      lastName: 'Cashier',
      email: 'cashier.dt@pizzapalace.com',
      jobTitle: 'Cashier',
      type: 'HOURLY',
      hourlyRate: 15.00,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created employees');

  // 10. Create Printers
  const kitchenPrinter = await prisma.printer.create({
    data: {
      storeId: downtownStore.id,
      name: 'Kitchen Printer',
      type: 'THERMAL',
      connectionType: 'NETWORK',
      ipAddress: '192.168.1.100',
      port: 9100,
      station: KitchenStation.PIZZA,
      isActive: true,
      printOnKitchen: true,
    },
  });
  console.log('✅ Created printers');

  console.log('\n🎉 Database seed completed!');
  console.log('\n📧 Default login credentials:');
  console.log('  Owner: owner@pizzapalace.com / password123');
  console.log('  Manager: manager.dt@pizzapalace.com / password123');
  console.log('  Cashier: cashier.dt@pizzapalace.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
