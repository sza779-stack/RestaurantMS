import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { getFoodImage } from './foodImages';

interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  sizes?: { id: string; name: string; price: number }[];
  imageUrl?: string;
  category?: any;
}

interface ProductGridProps {
  products: Product[];
  onSelect: (product: Product) => void;
  loading?: boolean;
  showBuildYourOwnCard?: boolean;
  onBuildYourOwn?: () => void;
}

// Emoji mapping for Desi categories
const categoryEmojis: Record<string, string> = {
  'Biryani': '🍚',
  'Karahi': '🥘',
  'BBQ & Grill': '🔥',
  'Handi': '🍲',
  'Tandoor': '🫓',
  'Curries': '🥣',
  'Street Food': '🌮',
  'Desi Desserts': '🍮',
  'Desi Drinks': '🧉',
  'Pizza': '🍕',
  'Pasta': '🍝',
  'Subs': '🥪',
  'Wings': '🍗',
  'Sides': '🍟',
  'Drinks': '🥤',
  'Dessert': '🍰',
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSelect,
  loading,
  showBuildYourOwnCard,
  onBuildYourOwn,
}) => {
  // Limit to 15 products max
  const limitedProducts = products.slice(0, 15);

  if (loading) {
    return (
      <div className="flex-1 p-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
            <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const getEmoji = (product: Product) => {
    const categoryName = product.category?.name || '';
    return categoryEmojis[categoryName] || '🍽️';
  };

  return (
    <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Section Header */}
      {showBuildYourOwnCard && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 transition-colors">
            <Sparkles className="text-yellow-500" size={20} />
            Menu Items
          </h2>
        </div>
      )}

      {/* Products Count */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
          Showing {limitedProducts.length} of {products.length} items
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {/* Build Your Own Card - Featured */}
        {showBuildYourOwnCard && onBuildYourOwn && (
          <div
            onClick={onBuildYourOwn}
            className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 min-h-[166px]"
          >
            <div className="absolute inset-0 bg-black/15"></div>
            <div className="relative p-4 h-full min-h-[130px] flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-2xl">🍕</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-0.5">Build Your Own</h3>
                <p className="text-white/90 text-xs">Create your perfect pizza</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">From $10.99</span>
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus size={14} className="text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Cards */}
        {limitedProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              console.log('Product clicked:', product);
              onSelect(product);
            }}
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/70 hover:scale-[1.01] transition-all cursor-pointer active:scale-95 text-left min-h-[166px] flex flex-col"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelect(product);
              }
            }}
          >
            <div className="w-full h-20 rounded-xl mb-3 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
              <img
                src={getFoodImage(product)}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
              />
            </div>
            
            <h3 className="font-black text-slate-950 dark:text-slate-50 text-base leading-tight mb-1 line-clamp-2 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-1 line-clamp-1 transition-colors">
                {product.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-lg font-black text-slate-950 dark:text-white transition-colors">
                ${Number(product.basePrice || 0).toFixed(2)}
              </span>
              <div className="w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Plus size={18} />
              </div>
            </div>

            {/* Sizes indicator */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {product.sizes.slice(0, 2).map((size) => (
                  <span key={size.id} className="text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-md transition-colors font-semibold">
                    {size.name}
                  </span>
                ))}
                {product.sizes.length > 2 && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 transition-colors font-semibold">+{product.sizes.length - 2}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {limitedProducts.length === 0 && !showBuildYourOwnCard && (
        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
          <div className="text-center">
            <div className="text-4xl mb-2">🍕</div>
            <p className="text-base">No products available</p>
            <p className="text-xs">Select a different category</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
