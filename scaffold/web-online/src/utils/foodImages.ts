type FoodImageInput = {
  imageUrl?: string | null;
  image?: string | null;
  name?: string | null;
  category?: any;
  description?: string | null;
  isCombo?: boolean;
};

export const CATEGORY_IMAGE_GALLERY: Array<{ category: string; image: string }> = [
  { category: 'All Items', image: '/images/pizza-wings-combo.png' },
  { category: 'Pizza', image: '/images/pepperoni.png' },
  { category: 'Pasta', image: '/images/pasta.png' },
  { category: 'Subs', image: '/images/sub.png' },
  { category: 'Rice Platters', image: '/images/pasta.png' },
  { category: 'Salads', image: '/images/veggie.png' },
  { category: 'Wings', image: '/images/wings.png' },
  { category: 'Sides', image: '/images/sub-fries-combo.png' },
  { category: 'Drinks', image: '/images/soda.png' },
  { category: 'Dessert', image: '/images/family-feast.png' },
  { category: 'Combos', image: '/images/pizza-wings-combo.png' },
  { category: 'Biryani', image: '/images/pasta.png' },
  { category: 'Karahi', image: '/images/pasta.png' },
  { category: 'BBQ & Grill', image: '/images/wings.png' },
  { category: 'Handi', image: '/images/pasta.png' },
  { category: 'Tandoor', image: '/images/sub.png' },
  { category: 'Curries', image: '/images/pasta.png' },
  { category: 'Street Food', image: '/images/samosa.png' },
  { category: 'Desi Desserts', image: '/images/family-feast.png' },
  { category: 'Desi Drinks', image: '/images/soda.png' },
];

const FOOD_IMAGE_RULES: Array<{ tokens: string[]; image: string }> = [
  { tokens: ['samosa', 'street_samosa'], image: '/images/samosa.png' },
  { tokens: ['street food', 'chaat', 'pakora', 'gol gappa', 'pani puri'], image: '/images/samosa.png' },
  { tokens: ['sub', 'sandwich', 'hoagie'], image: '/images/sub.png' },
  { tokens: ['fries', 'french fry', 'small ff'], image: '/images/sub-fries-combo.png' },
  { tokens: ['wing', 'buffalo'], image: '/images/wings.png' },
  { tokens: ['soda', 'drink', 'pepsi', 'cola', 'beverage'], image: '/images/soda.png' },
  { tokens: ['pasta', 'spaghetti', 'alfredo'], image: '/images/pasta.png' },
  { tokens: ['veggie', 'vegetable'], image: '/images/veggie.png' },
  { tokens: ['bbq chicken'], image: '/images/bbq-chicken.png' },
  { tokens: ['meat lover'], image: '/images/meat-lovers.png' },
  { tokens: ['pepperoni'], image: '/images/pepperoni.png' },
  { tokens: ['pizza'], image: '/images/pepperoni.png' },
  { tokens: ['family', 'feast'], image: '/images/family-feast.png' },
  { tokens: ['combo', 'deal', 'special'], image: '/images/pizza-wings-combo.png' },
  ...CATEGORY_IMAGE_GALLERY.map((entry) => ({ tokens: [entry.category.toLowerCase()], image: entry.image })),
];

const normalizeImageUrl = (value?: string | null) => {
  if (!value || value.length <= 3) return '';
  if (value.startsWith('http') || value.startsWith('/')) return value;
  return `/${value}`;
};

export const getFoodImage = (item: FoodImageInput, fallback = '/images/pepperoni.png') => {
  const directImage = normalizeImageUrl(item.imageUrl || item.image);
  if (directImage) return directImage;

  const categoryName = typeof item.category === 'string'
    ? item.category
    : item.category?.name || '';
  const searchText = `${item.name || ''} ${item.description || ''} ${categoryName}`.toLowerCase();
  if (item.isCombo) {
    const comboRule = FOOD_IMAGE_RULES.find((rule) => rule.tokens.includes('combo'));
    if (comboRule) return comboRule.image;
  }

  const matched = FOOD_IMAGE_RULES.find((rule) =>
    rule.tokens.some((token) => searchText.includes(token)),
  );

  return matched?.image || fallback;
};
