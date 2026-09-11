const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check existing users
    const users = await prisma.user.findMany({
      include: { role: true },
      take: 5
    });
    
    console.log('Users found:', users.length);
    users.forEach((u: any) => {
      console.log(`- ${u.email} (${u.role?.name}) - Active: ${u.isActive}`);
    });
    
    // If no users or need to reset password
    if (users.length > 0) {
      const adminUser = users.find((u: any) => u.email.includes('admin'));
      if (adminUser) {
        // Reset password to "password123"
        const newHash = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { passwordHash: newHash }
        });
        console.log(`\nReset password for ${adminUser.email} to: password123`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
