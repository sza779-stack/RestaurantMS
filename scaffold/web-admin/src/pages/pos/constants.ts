import { MenuCategory } from './types';

export const MENU_GROUP_SETTINGS_KEY = 'pos-menu-group-config:v1';
export type MenuGroupId = 'fastFood' | 'desi' | 'gyro';
export type MenuGroupState = Record<MenuGroupId, boolean>;
export const DEFAULT_MENU_GROUP_STATE: MenuGroupState = { fastFood: true, desi: true, gyro: true };

export const MENU_GROUP_CATEGORY_IDS: Record<MenuGroupId, string[]> = {
  fastFood: ['SPECIALS', 'PIZZA', 'PASTA', 'SUBS', 'SALADS', 'WINGS', 'SIDES', 'DRINKS', 'DESSERT', 'COMBO'],
  desi: ['BIRYANI', 'KARAHI', 'BBQ_GRILL', 'HANDI', 'TANDOOR', 'CURRIES', 'STREET_FOOD', 'DESI_DESSERT', 'DESI_DRINKS'],
  gyro: ['RICE_PLATTER', 'STREET_FOOD'],
};

export const MENU_STRUCTURE: MenuCategory[] = [
  {
    id: 'SPECIALS',
    name: 'Specials',
    icon: '★',
    color: 'from-rose-500 to-orange-500',
    subcategories: [],
  },
  {
    id: 'PIZZA',
    name: 'Pizza',
    icon: '🍕',
    color: 'from-red-500 to-orange-500',
    subcategories: [
      { id: 'PIZZA_BUILD', name: 'Build Your Own', description: 'Create your perfect pizza' },
      { id: 'PIZZA_SPECIALTY', name: 'Specialty Pizzas', description: "Chef's curated specialties" },
      { id: 'PIZZA_MEATS', name: 'Meat Lovers', description: 'Loaded with meats' },
      { id: 'PIZZA_VEGGIES', name: 'Veggie Delight', description: 'Fresh vegetables' },
      { id: 'PIZZA_MIX', name: 'Mixed Combos', description: 'Best of both worlds' },
    ],
  },
  {
    id: 'PASTA',
    name: 'Pasta',
    icon: '🍝',
    color: 'from-yellow-500 to-amber-500',
    subcategories: [
      { id: 'PASTA_BUILD', name: 'Build Your Own', description: 'Create your perfect pasta' },
      { id: 'PASTA_CLASSIC', name: 'Classic Pasta', description: 'Traditional favorites' },
      { id: 'PASTA_BAKED', name: 'Baked Pasta', description: 'Oven-baked goodness' },
      { id: 'PASTA_SEAFOOD', name: 'Seafood Pasta', description: 'Fresh from the sea' },
      { id: 'PASTA_SPECIALTY', name: 'Specialty', description: 'House specialties' },
    ],
  },
  {
    id: 'SUBS',
    name: 'Subs',
    icon: '🥪',
    color: 'from-green-500 to-emerald-500',
    subcategories: [
      { id: 'SUBS_BUILD', name: 'Build Your Own', description: 'Create your perfect sub' },
      { id: 'SUBS_HOT', name: 'Hot Subs', description: 'Toasted and warm' },
      { id: 'SUBS_COLD', name: 'Cold Subs', description: 'Fresh and crispy' },
      { id: 'SUBS_WRAP', name: 'Wraps', description: 'Wrapped to go' },
      { id: 'SUBS_SPECIAL', name: 'Specialty Subs', description: 'House favorites' },
    ],
  },
  {
    id: 'RICE_PLATTER',
    name: 'Rice Platters',
    icon: '🍛',
    color: 'from-teal-500 to-emerald-600',
    subcategories: [
      { id: 'RICE_PLATTER_BUILD', name: 'Build Your Own', description: 'Chicken, gyro, salad & sauces' },
      { id: 'RICE_PLATTER_SIGNATURE', name: 'Signature Platters', description: 'Chef picks and fan favorites' },
    ],
  },
  {
    id: 'SALADS',
    name: 'Salads',
    icon: '🥗',
    color: 'from-green-500 to-lime-600',
    subcategories: [
      { id: 'SALADS_BUILD', name: 'Build Your Own', description: 'Choose greens, proteins, dressing and extras' },
      { id: 'SALADS_SIGNATURE', name: 'Signature Salads', description: 'Chef, Garden and Caesar favorites' },
    ],
  },
  {
    id: 'WINGS',
    name: 'Wings',
    icon: '🍗',
    color: 'from-orange-600 to-red-600',
    subcategories: [
      { id: 'WINGS_BUILD', name: 'Wings Menu', description: 'Chicken wings with flavors' },
      { id: 'WINGS_COMBO', name: 'Wing Combos', description: 'Meal deals with sides' },
      { id: 'WINGS_BONELESS', name: 'Boneless', description: 'Boneless chicken bites' },
    ],
  },
  {
    id: 'SIDES',
    name: 'Sides',
    icon: '🍟',
    color: 'from-orange-500 to-yellow-500',
    subcategories: [
      { id: 'SIDES_BUILD', name: 'Sides Menu', description: 'Fries, rings & more' },
      { id: 'SIDES_APPETIZERS', name: 'Appetizers', description: 'Start your meal' },
      { id: 'SIDES_SALADS', name: 'Salads', description: 'Fresh & healthy' },
      { id: 'SIDES_BREAD', name: 'Bread & Dips', description: 'Fresh baked' },
    ],
  },
  {
    id: 'DRINKS',
    name: 'Drinks',
    icon: '🥤',
    color: 'from-blue-500 to-cyan-500',
    subcategories: [
      { id: 'DRINKS_SODA', name: 'Soft Drinks', description: 'Fountain beverages' },
      { id: 'DRINKS_BOTTLED', name: 'Bottled', description: 'Bottled drinks' },
      { id: 'DRINKS_SHAKES', name: 'Shakes', description: 'Creamy milkshakes' },
      { id: 'DRINKS_COFFEE', name: 'Coffee & Tea', description: 'Hot beverages' },
    ],
  },
  {
    id: 'DESSERT',
    name: 'Dessert',
    icon: '🍰',
    color: 'from-pink-500 to-rose-500',
    subcategories: [
      { id: 'DESSERT_CAKES', name: 'Cakes', description: 'Sweet treats' },
      { id: 'DESSERT_ICECREAM', name: 'Ice Cream', description: 'Frozen delights' },
      { id: 'DESSERT_SPECIAL', name: 'Specialty', description: 'House desserts' },
    ],
  },
  {
    id: 'COMBO',
    name: 'Combos',
    icon: '🎁',
    color: 'from-purple-500 to-violet-500',
    subcategories: [
      { id: 'COMBO_FAMILY', name: 'Family Meals', description: 'Great for sharing' },
      { id: 'COMBO_LUNCH', name: 'Lunch Specials', description: 'Quick & affordable' },
      { id: 'COMBO_DINNER', name: 'Dinner Combos', description: 'Complete meals' },
      { id: 'COMBO_PARTY', name: 'Party Packs', description: 'Feed a crowd' },
      { id: 'COMBO_VALUE', name: 'Value Deals', description: 'Best bang for buck' },
    ],
  },
  // DESI MENU CATEGORIES
  {
    id: 'BIRYANI',
    name: 'Biryani',
    icon: '🍚',
    color: 'from-amber-600 to-yellow-600',
    subcategories: [
      { id: 'BIRYANI_CHICKEN', name: 'Chicken Biryani', description: 'Fragrant rice with chicken' },
      { id: 'BIRYANI_MUTTON', name: 'Mutton Biryani', description: 'Aromatic lamb biryani' },
      { id: 'BIRYANI_BEEF', name: 'Beef Biryani', description: 'Spiced beef with basmati' },
      { id: 'BIRYANI_VEG', name: 'Veg Biryani', description: 'Vegetarian delight' },
      { id: 'BIRYANI_SPECIAL', name: 'Special Biryani', description: "Chef's special recipe" },
    ],
  },
  {
    id: 'KARAHI',
    name: 'Karahi',
    icon: '🥘',
    color: 'from-red-600 to-orange-600',
    subcategories: [
      { id: 'KARAHI_CHICKEN', name: 'Chicken Karahi', description: 'Traditional wok-cooked chicken' },
      { id: 'KARAHI_MUTTON', name: 'Mutton Karahi', description: 'Classic lamb karahi' },
      { id: 'KARAHI_BEEF', name: 'Beef Karahi', description: 'Spicy beef karahi' },
      { id: 'KARAHI_PRAWN', name: 'Prawn Karahi', description: 'Seafood karahi' },
      { id: 'KARAHI_PANEER', name: 'Paneer Karahi', description: 'Cottage cheese karahi' },
    ],
  },
  {
    id: 'BBQ_GRILL',
    name: 'BBQ & Grill',
    icon: '🔥',
    color: 'from-orange-700 to-red-700',
    subcategories: [
      { id: 'BBQ_TIKKA', name: 'Tikka', description: 'Marinated grilled meat' },
      { id: 'BBQ_SEEKH', name: 'Seekh Kebab', description: 'Minced meat skewers' },
      { id: 'BBQ_BOTI', name: 'Boti Kebab', description: 'Tender meat chunks' },
      { id: 'BBQ_MALAI', name: 'Malai Boti', description: 'Creamy grilled boti' },
      { id: 'BBQ_WINGS', name: 'BBQ Wings', description: 'Desi-style wings' },
    ],
  },
  {
    id: 'HANDI',
    name: 'Handi',
    icon: '🍲',
    color: 'from-amber-700 to-orange-700',
    subcategories: [
      { id: 'HANDI_CHICKEN', name: 'Chicken Handi', description: 'Creamy clay pot chicken' },
      { id: 'HANDI_MUTTON', name: 'Mutton Handi', description: 'Slow-cooked lamb handi' },
      { id: 'HANDI_MAKHNI', name: 'Butter Chicken Handi', description: 'Rich makhani handi' },
      { id: 'HANDI_PANEER', name: 'Paneer Handi', description: 'Vegetarian handi' },
    ],
  },
  {
    id: 'TANDOOR',
    name: 'Tandoor',
    icon: '🫓',
    color: 'from-red-700 to-amber-700',
    subcategories: [
      { id: 'TANDOOR_NAAN', name: 'Naan Bread', description: 'Fresh tandoori naan' },
      { id: 'TANDOOR_ROT', name: 'Tandoori Roti', description: 'Whole wheat roti' },
      { id: 'TANDOOR_PARATHA', name: 'Paratha', description: 'Layered flatbread' },
      { id: 'TANDOOR_KULCHA', name: 'Kulcha', description: 'Stuffed bread' },
      { id: 'TANDOOR_LACCHA', name: 'Laccha Paratha', description: 'Flaky layered paratha' },
    ],
  },
  {
    id: 'CURRIES',
    name: 'Curries',
    icon: '🥣',
    color: 'from-yellow-700 to-amber-600',
    subcategories: [
      { id: 'CURRY_KORMA', name: 'Korma', description: 'Mild creamy curry' },
      { id: 'CURRY_MASALA', name: 'Masala', description: 'Spiced tomato curry' },
      { id: 'CURRY_VINDALOO', name: 'Vindaloo', description: 'Hot & tangy curry' },
      { id: 'CURRY_SAAG', name: 'Saag', description: 'Spinach-based curry' },
      { id: 'CURRY_DAAL', name: 'Daal', description: 'Lentil curry' },
    ],
  },
  {
    id: 'STREET_FOOD',
    name: 'Street Food',
    icon: '🌮',
    color: 'from-green-600 to-teal-600',
    subcategories: [
      { id: 'STREET_SAMOSA', name: 'Samosa', description: 'Crispy filled pastry' },
      { id: 'STREET_ROLL', name: 'Kathi Roll', description: 'Wrap with fillings' },
      { id: 'STREET_CHAAT', name: 'Chaat', description: 'Savory street snack' },
      { id: 'STREET_PAKORA', name: 'Pakora', description: 'Fried fritters' },
      { id: 'STREET_GOLGAPPA', name: 'Gol Gappa', description: 'Pani puri' },
    ],
  },
  {
    id: 'DESI_DESSERT',
    name: 'Desi Desserts',
    icon: '🍮',
    color: 'from-pink-600 to-rose-600',
    subcategories: [
      { id: 'DESERT_GULAB', name: 'Gulab Jamun', description: 'Sweet milk dumplings' },
      { id: 'DESERT_JALEBI', name: 'Jalebi', description: 'Crispy sugar syrup' },
      { id: 'DESERT_KHEER', name: 'Kheer', description: 'Rice pudding' },
      { id: 'DESERT_HALWA', name: 'Halwa', description: 'Semolina dessert' },
      { id: 'DESERT_KULFI', name: 'Kulfi', description: 'Indian ice cream' },
      { id: 'DESERT_RASMALAI', name: 'Rasmalai', description: 'Creamy cheese patties' },
    ],
  },
  {
    id: 'DESI_DRINKS',
    name: 'Desi Drinks',
    icon: '🧉',
    color: 'from-emerald-600 to-green-600',
    subcategories: [
      { id: 'DRINK_LASSI', name: 'Lassi', description: 'Yogurt drink' },
      { id: 'DRINK_CHAI', name: 'Masala Chai', description: 'Spiced tea' },
      { id: 'DRINK_ROOH', name: 'Rooh Afza', description: 'Rose syrup drink' },
      { id: 'DRINK_NIMBOO', name: 'Nimboo Pani', description: 'Lemon water' },
      { id: 'DRINK_THANDAI', name: 'Thandai', description: 'Cooling milk drink' },
      { id: 'DRINK_SHARBAT', name: 'Sharbats', description: 'Fruit syrups' },
    ],
  },
];

export const CATEGORY_NAME_ALIASES: Record<string, string[]> = {
  PIZZA: ['pizza', 'pizzas'],
  PASTA: ['pasta', 'pastas'],
  SUBS: ['subs', 'sub', 'sandwiches'],
  RICE_PLATTER: ['riceplatters', 'riceplatter', 'platters'],
  SALADS: ['salad', 'salads'],
  WINGS: ['wings', 'wing'],
  SIDES: ['sides', 'side', 'appetizers'],
  DRINKS: ['drinks', 'drink', 'beverages'],
  DESSERT: ['dessert', 'desserts'],
  COMBO: ['combo', 'combos'],
  SPECIALS: ['special', 'specials', 'deal', 'deals'],
  BIRYANI: ['biryani'],
  KARAHI: ['karahi'],
  BBQ_GRILL: ['bbqgrill', 'bbq', 'grill'],
  HANDI: ['handi'],
  TANDOOR: ['tandoor'],
  CURRIES: ['curries', 'curry'],
  STREET_FOOD: ['streetfood'],
  DESI_DESSERT: ['desidesserts', 'desidessert'],
  DESI_DRINKS: ['desidrinks', 'desidrink'],
};

export const NON_PRODUCT_SUBCATEGORIES = new Set([
  'PIZZA_BUILD',
  'SUBS_BUILD',
  'PASTA_BUILD',
  'RICE_PLATTER_BUILD',
  'SALADS_BUILD',
  'SALADS_SIGNATURE',
  'WINGS_BUILD',
  'SIDES_BUILD',
]);

export const FALLBACK_SUBCATEGORY_ITEMS: Record<string, { name: string; price: number; station?: string }[]> = {
  SUBS_HOT: [
    { name: 'Chicken Parmesan Sub', price: 10.99, station: 'GRILL' },
    { name: 'Meatball Marinara Sub', price: 9.99, station: 'GRILL' },
    { name: 'Steak & Cheese Sub', price: 11.99, station: 'GRILL' },
    { name: 'Buffalo Chicken Sub', price: 10.49, station: 'GRILL' },
  ],
  SUBS_COLD: [
    { name: 'Turkey Club Sub', price: 9.99, station: 'GENERAL' },
    { name: 'Italian Cold Cut Sub', price: 10.99, station: 'GENERAL' },
    { name: 'Ham & Cheese Sub', price: 8.99, station: 'GENERAL' },
    { name: 'Tuna Salad Sub', price: 9.49, station: 'GENERAL' },
  ],
  SUBS_WRAP: [
    { name: 'Chicken Caesar Wrap', price: 9.49, station: 'GENERAL' },
    { name: 'Buffalo Ranch Wrap', price: 9.99, station: 'GENERAL' },
    { name: 'Veggie Hummus Wrap', price: 8.99, station: 'GENERAL' },
    { name: 'Gyro Wrap', price: 10.49, station: 'GRILL' },
  ],
  SUBS_SPECIAL: [
    { name: 'House Special Sub', price: 11.99, station: 'GRILL' },
    { name: 'Philly Deluxe Sub', price: 12.49, station: 'GRILL' },
    { name: 'Triple Meat Sub', price: 12.99, station: 'GRILL' },
    { name: 'Signature Supreme Sub', price: 11.99, station: 'GRILL' },
  ],
};
