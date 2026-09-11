const fs = require('fs');
const file = 'c:/Users/iamon/Downloads/Pizza POS/RestaurantMS/scaffold/api/prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// 1. Order model
code = code.replace(
  'createdBy       User?       @relation("CreatedBy", fields: [createdById], references: [id])',
  'createdBy       User?       @relation("CreatedBy", fields: [createdById], references: [id])\n  \n  loyaltyTransactions LoyaltyTransaction[]'
);

// 2. Customer model
code = code.replace(
  '  orderCount    Int    @default(0)\n  \n  createdAt   DateTime @default(now())\n  \n  addresses   CustomerAddress[]',
  '  orderCount    Int    @default(0)\n  \n  referralCode  String? @unique\n  referredById  String?\n  referredBy    Customer? @relation("Referrals", fields: [referredById], references: [id])\n  referrals     Customer[] @relation("Referrals")\n  \n  createdAt   DateTime @default(now())\n  \n  addresses   CustomerAddress[]\n  loyaltyTransactions LoyaltyTransaction[]'
);

// 3. LoyaltyTransaction
code = code.replace(
  '  @@map("customer_addresses")\n}',
  '  @@map("customer_addresses")\n}\n\nmodel LoyaltyTransaction {\n  id          String   @id @default(uuid())\n  customerId  String\n  \n  points      Int\n  type        LoyaltyTransactionType\n  \n  orderId     String?\n  description String?\n  \n  createdAt   DateTime @default(now())\n  \n  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)\n  order       Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)\n  \n  @@index([customerId])\n  @@index([orderId])\n  @@map("loyalty_transactions")\n}'
);

// 4. Enums
code = code.replace(
  'enum OrderSource {',
  'enum LoyaltyTransactionType {\n  EARNED\n  REDEEMED\n  SIGNUP\n  REFERRED\n  ADJUSTED\n}\n\nenum OrderSource {'
);

fs.writeFileSync(file, code);
console.log("Updated schema.prisma successfully.");
