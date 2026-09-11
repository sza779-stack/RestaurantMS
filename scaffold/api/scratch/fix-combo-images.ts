
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const combos = await prisma.combo.findMany();
  
  for (const combo of combos) {
    let imageUrl = combo.imageUrl;
    
    if (combo.name.toLowerCase().includes('pizza') && combo.name.toLowerCase().includes('wings')) {
      imageUrl = 'images/pizza-wings-combo.png';
    } else if (combo.name.toLowerCase().includes('sub') && combo.name.toLowerCase().includes('fries')) {
      imageUrl = 'images/sub-fries-combo.png';
    } else if (combo.name.toLowerCase().includes('family') || combo.name.toLowerCase().includes('feast')) {
      imageUrl = 'images/family-feast.png';
    } else if (combo.name.toLowerCase().includes('pizza')) {
      imageUrl = 'images/pepperoni.png';
    } else if (combo.name.toLowerCase().includes('pasta')) {
      imageUrl = 'images/pasta.png';
    } else if (combo.name.toLowerCase().includes('sub')) {
      imageUrl = 'images/sub.png';
    }
    
    if (imageUrl !== combo.imageUrl) {
      console.log(`Updating combo ${combo.name} with image ${imageUrl}`);
      await prisma.combo.update({
        where: { id: combo.id },
        data: { imageUrl }
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
