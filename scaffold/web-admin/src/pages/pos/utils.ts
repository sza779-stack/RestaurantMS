import { MenuCategory } from './types';

// Generate search items from products
export const generateSearchItems = (products: any[], menuStructure: MenuCategory[]): any[] => {
  const items: any[] = [];

  // Add products
  products.forEach((product) => {
    items.push({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.basePrice || 0),
      category: product.category?.name || 'Other',
      subcategory: product.subcategory,
      type: 'product',
    });
  });

  // Add category shortcuts
  menuStructure.forEach((category) => {
    items.push({
      id: `cat-${category.id}`,
      name: `${category.icon} ${category.name}`,
      description: `Browse all ${category.name} items`,
      price: 0,
      category: category.name,
      type: 'category',
    });

    category.subcategories.forEach((sub) => {
      items.push({
        id: `sub-${sub.id}`,
        name: sub.name,
        description: sub.description,
        price: 0,
        category: category.name,
        subcategory: sub.name,
        type: 'category',
      });
    });
  });

  return items;
};

export const normalizeText = (value: string | null | undefined) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const buildFallbackProductsForSubcategory = (
  category: MenuCategory | null,
  subcategoryId: string | null,
  subcategoryName: string | null,
  fallbackItems: Record<string, { name: string; price: number; station?: string }[]>
) => {
  if (!category || !subcategoryId || !subcategoryName) {
    return [];
  }

  const templates = fallbackItems[subcategoryId] || [
    { name: `${subcategoryName} Special`, price: 11.99, station: 'GENERAL' },
    { name: `${subcategoryName} Classic`, price: 10.99, station: 'GENERAL' },
    { name: `${subcategoryName} Deluxe`, price: 12.99, station: 'GENERAL' },
    { name: `${subcategoryName} Combo`, price: 13.49, station: 'GENERAL' },
  ];

  return templates.map((template, idx) => ({
    id: `fallback-${category.id}-${subcategoryId}-${idx + 1}`,
    name: template.name,
    description: `Demo item for ${subcategoryName}. Replace with your live menu product.`,
    basePrice: template.price,
    kitchenStation: template.station || 'GENERAL',
    category: { name: category.name },
    subcategory: subcategoryName,
    isFallback: true,
  }));
};
