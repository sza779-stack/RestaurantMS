import React from 'react';
import { MenuCategory } from '../types';

interface PosCategoryGridProps {
  categories: MenuCategory[];
  onSelect: (id: string) => void;
  renderIcon: (category: MenuCategory, size?: 'sm' | 'lg') => React.ReactNode;
}

const PosCategoryGrid: React.FC<PosCategoryGridProps> = ({ categories, onSelect, renderIcon }) => {
  return (
    <div className="flex-1 p-5 overflow-y-auto">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Menu Categories</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Choose a menu area to start an order.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
          {categories.length} categories
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`relative overflow-hidden rounded-2xl text-left cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all group bg-gradient-to-br ${category.color} border border-white/15 min-h-[146px]`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.20),transparent_42%)] opacity-70"></div>
            <div className="relative p-5 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="text-4xl transform group-hover:scale-110 transition-transform origin-left">
                  {renderIcon(category, 'lg')}
                </div>
                <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide">
                  {category.subcategories.length}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight leading-tight">{category.name}</h3>
                <p className="text-white/75 text-xs font-bold uppercase tracking-widest mt-1">
                  Browse selections
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PosCategoryGrid;
