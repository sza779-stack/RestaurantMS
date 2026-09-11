const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Check stores
    const stores = await prisma.store.findMany();
    console.log('Stores:', stores.length);
    if (stores.length > 0) {
      console.log('First store:', stores[0].name, stores[0].id);
    }
    
    // Check products
    const products = await prisma.product.findMany({ take: 5 });
    console.log('Products:', products.length);
    
    // Check orders
    const orders = await prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log('Recent orders:', orders.map((o: any) => ({ id: o.id.slice(0,8), number: o.orderNumber, status: o.status })));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
