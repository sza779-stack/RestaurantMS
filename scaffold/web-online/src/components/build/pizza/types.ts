export type ToppingPlacement = 'LEFT' | 'FULL' | 'RIGHT';
export type ToppingAmount = 'LIGHT' | 'REGULAR' | 'EXTRA';
export type ToppingCategory = 'MEAT' | 'VEGETABLE' | 'CHEESE' | 'OTHER';

export interface PizzaTopping {
  id: string;
  name: string;
  category: ToppingCategory;
  isAvailable: boolean;
  isSelected: boolean;
  placement: ToppingPlacement;
  amount: ToppingAmount;
  price?: number;
  extraPrice?: number;
  sortOrder: number;
  imageUrl?: string;
  description?: string;
  priceAdjustment?: number;
  extraPriceAdjustment?: number;
  isPremium?: boolean;
  isDefault?: boolean;
  maxAmount?: 'REGULAR' | 'EXTRA';
  allowedPlacements?: ToppingPlacement[];
  allowedAmounts?: ToppingAmount[];
  inventoryStatus?: string;
}

export interface ToppingSelection {
  id: string;
  name: string;
  price: number;
  side: ToppingPlacement;
  amount?: ToppingAmount;
}
