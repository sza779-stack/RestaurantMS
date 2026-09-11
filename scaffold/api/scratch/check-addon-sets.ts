
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sets = await prisma.addOnSet.findMany({
    where: { isActive: true },
    include: {
      addons: {
        include: { addon: true },
        orderBy: { displayOrder: 'asc' }
      },
      products: {
        include: {
          product: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  for (const set of sets) {
    console.log(`\n=== ${set.name} (min:${set.minSelect}, max:${set.maxSelect}, rule:${set.pricingRule}) ===`);
    console.log(`  Products: ${set.products.map(p => p.product.name).join(', ') || 'NONE'}`);
    for (const sa of set.addons) {
      console.log(`  - ${sa.addon.name} [${sa.addon.type}] $${sa.addon.price} ${sa.priceOverride ? `(override: $${sa.priceOverride})` : ''}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
