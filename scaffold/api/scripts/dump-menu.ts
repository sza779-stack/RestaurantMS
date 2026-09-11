import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      addonSets: {
        include: {
          addonSet: true
        }
      }
    }
  });

  console.log('--- Active Products ---');
  products.forEach(p => {
    console.log(`[${p.id}] ${p.name} (${p.category?.name}) - Type: ${p.type}`);
    if (p.addonSets.length > 0) {
      console.log('   Linked Sets: ' + p.addonSets.map(pas => pas.addonSet.name).join(', '));
    }
  });

  const addonSets = await prisma.addOnSet.findMany({
    include: {
      addons: {
        include: {
          addon: true
        }
      }
    }
  });

  console.log('\n--- Add-On Sets ---');
  addonSets.forEach(s => {
    console.log(`[${s.id}] ${s.name} - Add-ons: ${s.addons.map(sa => sa.addon.name).join(', ')}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
