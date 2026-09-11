
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const combos = await prisma.combo.findMany({
    select: { name: true, isActive: true, storeId: true }
  });
  console.log(JSON.stringify(combos, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
