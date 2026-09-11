/**
 * Demo Driver Seed Script
 * Run: node prisma/seed-demo-driver.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🍕 Creating Demo Driver...\n');

  // Find the first active store
  const store = await prisma.store.findFirst({
    where: { isActive: true },
  });

  if (!store) {
    console.error('❌ No active store found. Please create a store first.');
    process.exit(1);
  }

  console.log(`📍 Found store: ${store.name} (${store.id})\n`);

  const driverId = 'demo-driver-001';
  const pin = '1234';
  const pinHash = await bcrypt.hash(pin, 10);

  // Check if driver already exists
  const existingDriver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  let driver;

  if (existingDriver) {
    console.log('📝 Demo driver already exists, updating...');
    
    driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        isActive: true,
        status: 'ONLINE',
        pin: pinHash,
        perDeliveryRate: 5.00,
        storeId: store.id,
      },
    });
  } else {
    console.log('✨ Creating new demo driver...');
    
    driver = await prisma.driver.create({
      data: {
        id: driverId,
        storeId: store.id,
        name: 'Demo Driver',
        phone: '(555) 0100',
        email: 'demo@freshpizza.com',
        vehicleType: 'Car',
        licensePlate: 'DEMO-01',
        pin: pinHash,
        status: 'ONLINE',
        isContractor: true,
        perDeliveryRate: 5.00,
        isActive: true,
        currentLocation: {
          lat: 39.2037,
          lng: -76.8610,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 DEMO DRIVER CREATED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('');
  console.log('📋 DRIVER INFORMATION:');
  console.log('  Name:  Demo Driver');
  console.log('  ID:    demo-driver-001');
  console.log('  PIN:   1234');
  console.log('  Phone: (555) 0100');
  console.log('  Vehicle: Car (DEMO-01)');
  console.log('  Rate:  $5.00 per delivery');
  console.log('  Status: ONLINE');
  console.log('');
  console.log('🔐 LOGIN CREDENTIALS:');
  console.log('  Driver ID: demo-driver-001');
  console.log('  PIN:       1234');
  console.log('');
  console.log('🌐 ACCESS URLs:');
  console.log('  Driver App: http://localhost:3006');
  console.log('  Admin/Pos:  http://localhost:3001');
  console.log('');
  console.log('📱 HOW TO USE:');
  console.log('  1. Open http://localhost:3006 in your browser');
  console.log('  2. Enter Driver ID: demo-driver-001');
  console.log('  3. Enter PIN: 1234');
  console.log('  4. Tap "Login"');
  console.log('  5. Go Online to receive delivery assignments');
  console.log('');
  console.log('🚚 ASSIGN DELIVERIES:');
  console.log('  1. Open http://localhost:3001 (POS/Admin)');
  console.log('  2. Go to Settings > Delivery Management');
  console.log('  3. Create a DELIVERY order');
  console.log('  4. Assign it to "Demo Driver"');
  console.log('  5. The order will appear in the driver app!');
  console.log('');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
