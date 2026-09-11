/**
 * Test script to debug order creation
 * Run: node test-order.js
 */

const API_URL = 'http://localhost:3000';

async function testCreateOrder() {
  const orderData = {
    storeId: 'default-store',
    type: 'DELIVERY',
    customerName: 'Test Customer',
    customerPhone: '(555) 123-4567',
    items: [
      {
        productId: 'test-product-001',
        productName: 'Test Pizza',
        quantity: 1,
        unitPrice: 15.99,
        modifiers: ['Extra Cheese'],
      }
    ],
    subtotal: 15.99,
    taxAmount: 1.28,
    total: 17.27,
    sendToKitchen: true,
    payments: [],
  };

  console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

  try {
    const response = await fetch(`${API_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Order creation failed:');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Order created successfully!');
    console.log('Order ID:', data.id);
    console.log('Order Number:', data.orderNumber);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testCreateOrder();
