import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MenuCategory } from '../types';

interface PosSubcategoryGridProps {
  category: MenuCategory;
  onSelect: (subId: string) => void;
  onBack: () => void;
  renderIcon: (category: MenuCategory, size?: 'sm' | 'lg') => React.ReactNode;
}

const PosSubcategoryGrid: React.FC<PosSubcategoryGridProps> = ({ category, onSelect, onBack, renderIcon }) => {
  return (
    <div className="flex-1 p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-5 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-3">
            {renderIcon(category, 'sm')}
            <span>{category.name}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Select a subcategory to browse items.</p>
        </div>
        <button
          onClick={onBack}
          className="min-h-11 px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {category.subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.id)}
            className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer group relative overflow-hidden text-left min-h-[132px]"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              {renderIcon(category, 'lg')}
            </div>
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-950 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">{sub.description}</p>
              </div>
              <div className="w-11 h-11 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                <ArrowRight size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PosSubcategoryGrid;
