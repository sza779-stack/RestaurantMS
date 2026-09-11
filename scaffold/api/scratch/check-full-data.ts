
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check what categories and products we have for wings, soda
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, storeId: true }
  });
  console.log('=== Categories ===');
  for (const c of categories) {
    console.log(`  ${c.name} (${c.id})`);
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, type: true, categoryId: true, basePrice: true, imageUrl: true },
    orderBy: { name: 'asc' }
  });
  console.log('\n=== Products ===');
  for (const p of products) {
    console.log(`  ${p.name} [${p.type}] cat:${p.categoryId} $${p.basePrice} img:${p.imageUrl || 'NONE'}`);
  }
  
  // Check combo items
  const combos = await prisma.combo.findMany({
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, type: true } }
        }
      }
    }
  });
  console.log('\n=== Combos & Items ===');
  for (const c of combos) {
    console.log(`\n${c.name} ($${c.basePrice})`);
    for (const item of c.items) {
      console.log(`  Item: ${item.name} | fixed:${item.isProductFixed} | cat:${item.categoryId} | product:${item.product?.name || 'NONE'} | customize:${item.allowCustomization} | maxToppings:${item.maxIncludedToppings}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
