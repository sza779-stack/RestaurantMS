const fs = require('fs');
const file = 'c:/Users/iamon/Downloads/Pizza POS/RestaurantMS/scaffold/api/prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// Insert LoyaltyTransaction after customer_addresses block
const targetStr = '  @@map("customer_addresses")\r\n}\r\n';
const targetStrLf = '  @@map("customer_addresses")\n}\n';

const modelStr = `
model LoyaltyTransaction {
  id          String   @id @default(uuid())
  customerId  String
  
  points      Int
  type        LoyaltyTransactionType
  
  orderId     String?
  description String?
  
  createdAt   DateTime @default(now())
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  order       Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  @@index([customerId])
  @@index([orderId])
  @@map("loyalty_transactions")
}
`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, targetStr + modelStr);
} else if (code.includes(targetStrLf)) {
  code = code.replace(targetStrLf, targetStrLf + modelStr);
} else {
  console.log("Could not find the target string!");
}

fs.writeFileSync(file, code);
console.log("Updated schema.prisma successfully for LoyaltyTransaction.");
