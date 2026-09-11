const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const driver = await prisma.driver.findUnique({
    where: { id: 'demo-driver-001' },
    include: { store: { select: { name: true } } }
  });
  
  if (driver) {
    console.log('✅ Driver verified in database:');
    console.log('   Name:', driver.name);
    console.log('   ID:', driver.id);
    console.log('   Status:', driver.status);
    console.log('   Store:', driver.store?.name);
    console.log('   Has PIN:', driver.pin ? 'Yes ✓' : 'No ✗');
    console.log('   Is Active:', driver.isActive ? 'Yes ✓' : 'No ✗');
  } else {
    console.log('❌ Driver not found');
  }
  
  await prisma.$disconnect();
}

verify();
