const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database connection...');
    
    // Check if admin role exists
    let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    
    if (!adminRole) {
      console.log('Creating ADMIN role...');
      adminRole = await prisma.role.create({
        data: {
          name: 'ADMIN',
          description: 'System Administrator',
          isSystem: true,
        }
      });
    }
    console.log('Admin role ID:', adminRole.id);
    
    // Check if company exists
    let company = await prisma.company.findFirst();
    if (!company) {
      console.log('Creating default company...');
      company = await prisma.company.create({
        data: {
          name: 'Test Restaurant',
          legalName: 'Test Restaurant LLC',
          timezone: 'America/New_York',
          currency: 'USD',
        }
      });
    }
    console.log('Company ID:', company.id);
    
    // Check for existing admin user
    let adminUser = await prisma.user.findFirst({
      where: { email: 'test@restaurant.com' }
    });
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    if (adminUser) {
      console.log('Updating existing user password...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { passwordHash: hashedPassword }
      });
    } else {
      console.log('Creating new admin user...');
      adminUser = await prisma.user.create({
        data: {
          email: 'test@restaurant.com',
          passwordHash: hashedPassword,
          firstName: 'Test',
          lastName: 'Admin',
          roleId: adminRole.id,
          companyId: company.id,
          isActive: true,
        }
      });
    }
    
    console.log('\n========================================');
    console.log('Test user created/updated:');
    console.log('Email: test@restaurant.com');
    console.log('Password: test123');
    console.log('========================================\n');
    
    // Also update any existing admin users
    const existingAdmins = await prisma.user.findMany({
      where: { email: { contains: 'admin' } }
    });
    
    for (const admin of existingAdmins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { passwordHash: hashedPassword }
      });
      console.log(`Updated password for: ${admin.email}`);
    }
    
    await prisma.$disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
