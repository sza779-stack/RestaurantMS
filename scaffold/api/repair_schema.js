const fs = require('fs');
const file = 'c:/Users/iamon/Downloads/Pizza POS/RestaurantMS/scaffold/api/prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix DeliveryZone error
code = code.replace(/addresses\s+CustomerAddress\[\]yTransactions\`\s+in\s+model\s+\`DeliveryZone\`:\s+The/g, 'addresses   CustomerAddress[]');
code = code.replace(/addresses\s+CustomerAddress\[\]\r?\n\s*loyaltyTransactions\s+LoyaltyTransaction\[\]/g, 'addresses   CustomerAddress[]');

// 2. Add properties to Customer correctly
const r = /model Customer \{[\s\S]*?@@map\(\"customers\"\)\r?\n\}/g;
code = code.replace(r, match => {
  if (!match.includes('referralCode')) {
    match = match.replace(/orderCount\s+Int\s+@default\(0\)/, 'orderCount    Int    @default(0)\n  \n  referralCode  String? @unique\n  referredById  String?\n  referredBy    Customer? @relation(\"Referrals\", fields: [referredById], references: [id])\n  referrals     Customer[] @relation(\"Referrals\")');
  }
  if (!match.includes('loyaltyTransactions')) {
    match = match.replace(/addresses\s+CustomerAddress\[\]/, 'addresses   CustomerAddress[]\n  loyaltyTransactions LoyaltyTransaction[]');
  }
  return match;
});

// 3. Add property to Order correctly
const ord = /model Order \{[\s\S]*?@@map\(\"orders\"\)\r?\n\}/g;
code = code.replace(ord, match => {
  if (!match.includes('loyaltyTransactions LoyaltyTransaction[]')) {
    match = match.replace(/createdBy\s+User\?\s+@relation\(\"CreatedBy\", fields: \[createdById\], references: \[id\]\)/, 'createdBy       User?       @relation(\"CreatedBy\", fields: [createdById], references: [id])\n  \n  loyaltyTransactions LoyaltyTransaction[]');
  }
  return match;
});

// Write to disk
fs.writeFileSync(file, code);
console.log("Schema fix successfully applied.");
