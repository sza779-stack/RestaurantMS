export interface CartModifier {
  addonId: string;
  name: string;
  price: number;
  quantity?: number;
  type?: string;
  category?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sizeId?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  addons: CartModifier[];
  notes?: string;
  kitchenStation: string;
  isCombo?: boolean;
  comboItems?: {
    productId: string;
    productName: string;
    sizeId?: string;
    sizeName?: string;
    addons: CartModifier[];
  }[];
}

export type OrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'DRIVE_THRU';

export interface PaymentData {
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'GIFT_CARD' | 'ONLINE';
  amount: number;
  tenderedAmount?: number;
  changeDue?: number;
  reference?: string;
  cardLast4?: string;
  transactionId?: string;
  tipAmount?: number;
  totalWithTip?: number;
  taxExempt?: boolean;
  taxExemptIdRef?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: {
    id: string;
    name: string;
    description: string;
  }[];
}
