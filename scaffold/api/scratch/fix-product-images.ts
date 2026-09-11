
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    let imageUrl = product.imageUrl;
    const name = product.name.toLowerCase();
    
    if (name.includes('pepperoni')) {
      imageUrl = '/images/pepperoni.png';
    } else if (name.includes('bbq chicken')) {
      imageUrl = '/images/bbq-chicken.png';
    } else if (name.includes('veggie')) {
      imageUrl = '/images/veggie.png';
    } else if (name.includes('meat lover')) {
      imageUrl = '/images/meat-lovers.png';
    } else if (name.includes('margherita')) {
      imageUrl = '/images/pepperoni.png'; // Placeholder if margherita is missing
    } else if (name.includes('build your own pizza') || (name.includes('build') && name.includes('pizza'))) {
      imageUrl = '/images/pepperoni.png'; // Using pepperoni as placeholder for BYO
    } else if (name.includes('pasta')) {
      imageUrl = '/images/pasta.png';
    } else if (name.includes('sub')) {
      imageUrl = '/images/sub.png';
    }
    
    if (imageUrl !== product.imageUrl && imageUrl?.startsWith('/')) {
      console.log(`Updating product ${product.name} with image ${imageUrl}`);
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl }
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
