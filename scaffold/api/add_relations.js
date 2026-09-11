const fs = require('fs');
const file = 'c:/Users/iamon/Downloads/Pizza POS/RestaurantMS/scaffold/api/prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// 1. Order relation
const orderTarget = '  createdBy       User?       @relation("CreatedBy", fields: [createdById], references: [id])';
if (code.includes(orderTarget) && !code.includes('loyaltyTransactions LoyaltyTransaction[]')) {
  code = code.replace(
    orderTarget,
    orderTarget + '\n  \n  loyaltyTransactions LoyaltyTransaction[]'
  );
}

// 2. Customer relations
const customerTarget = '  orderCount    Int    @default(0)\n  \n  createdAt   DateTime @default(now())';
const customerTargetCrLf = '  orderCount    Int    @default(0)\r\n  \r\n  createdAt   DateTime @default(now())';

const customerReplacement = `  orderCount    Int    @default(0)
  
  referralCode  String? @unique
  referredById  String?
  referredBy    Customer? @relation("Referrals", fields: [referredById], references: [id])
  referrals     Customer[] @relation("Referrals")
  
  createdAt   DateTime @default(now())`;

if (code.includes(customerTarget) && !code.includes('referralCode')) {
  code = code.replace(customerTarget, customerReplacement);
} else if (code.includes(customerTargetCrLf) && !code.includes('referralCode')) {
  code = code.replace(customerTargetCrLf, customerReplacement.replace(/\n/g, '\r\n'));
}

// 3. Customer loyaltyTransactions array
const customerAddr = '  addresses   CustomerAddress[]';
if (code.includes(customerAddr) && !code.split('model Customer {')[1].split('}')[0].includes('loyaltyTransactions')) {
  code = code.replace(
    customerAddr,
    customerAddr + '\n  loyaltyTransactions LoyaltyTransaction[]'
  );
}

fs.writeFileSync(file, code);
console.log("Relations added to Order and Customer.");
