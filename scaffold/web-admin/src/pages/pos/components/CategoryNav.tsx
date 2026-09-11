import React from 'react';
import { ChevronRight, Home, Sparkles, UtensilsCrossed } from 'lucide-react';
import type { MenuCategory } from '../types';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategoryNavProps {
  menuStructure: MenuCategory[];
  categories: Category[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
  loading?: boolean;
}

const renderNavIcon = (category: MenuCategory, isSelected: boolean) => {
  if (category.id !== 'RICE_PLATTER') {
    return <span className={isSelected ? 'text-white' : 'text-slate-400'}>{category.icon}</span>;
  }

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isSelected ? 'bg-white/25' : 'bg-slate-700/70'}`}>
      <span className={`relative w-3 h-2 rounded-b-full border ${isSelected ? 'border-white' : 'border-teal-300'}`}>
        <span className={`absolute -top-1 left-0.5 w-0.5 h-1 rounded-full ${isSelected ? 'bg-white/90' : 'bg-teal-300'}`} />
        <span className={`absolute -top-1 right-0.5 w-0.5 h-1 rounded-full ${isSelected ? 'bg-white/90' : 'bg-teal-300'}`} />
      </span>
    </span>
  );
};

const CategoryNav: React.FC<CategoryNavProps> = ({
  menuStructure,
  categories: _categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="w-[248px] bg-slate-950 border-r border-slate-800/80 flex flex-col h-full">
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[248px] bg-slate-950 border-r border-slate-800/80 flex flex-col h-full">
      <div className="px-4 py-4 border-b border-slate-800 bg-slate-950">
        <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm tracking-wide">
          <UtensilsCrossed size={16} className="text-amber-400" />
          Menu Navigation
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={`
              w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold
              transition-all duration-200 flex items-center gap-2
              ${
                !selectedCategory
                  ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70'
              }
            `}
          >
            <Home size={16} />
            <span>All Items</span>
          </button>
        </div>

        <div className="px-3 pb-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] mb-2 px-2">
            Categories
          </p>

          <div className="space-y-1.5">
            {menuStructure.map((category) => {
              const isSelected = selectedCategory === category.id;
              const hasSubcategories = category.subcategories.length > 0;
              const isExpanded = isSelected && hasSubcategories;

              return (
                <div key={category.id}>
                  <button
                    onClick={() => onCategorySelect(category.id)}
                    className={`
                      w-full text-left px-3 py-3 rounded-xl text-sm
                      transition-all duration-200 flex items-center gap-2
                      ${
                        isSelected
                          ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-md ring-1 ring-white/20'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70'
                      }
                    `}
                  >
                    {renderNavIcon(category, isSelected)}
                    <span className="flex-1 font-semibold truncate">{category.name}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                        isSelected ? 'text-white' : 'text-slate-500'
                      } ${hasSubcategories ? '' : 'opacity-0'}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 ml-3 space-y-1 border-l border-slate-700 pl-2">
                      {category.subcategories.map((sub) => {
                        const isSubSelected = selectedSubcategory === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => onSubcategorySelect(category.id, sub.id)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-xs
                              transition-colors
                              ${
                                isSubSelected
                                  ? 'bg-white/10 text-white font-semibold border border-white/15'
                                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span>{sub.name}</span>
                              {isSubSelected && <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sub.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <button
          onClick={() => onSubcategorySelect('PIZZA', 'PIZZA_BUILD')}
          className="w-full min-h-12 px-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-slate-950 text-center hover:brightness-105 transition-all font-bold shadow-lg shadow-orange-900/25 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Build Your Own
        </button>
      </div>
    </div>
  );
};

export default CategoryNav;
