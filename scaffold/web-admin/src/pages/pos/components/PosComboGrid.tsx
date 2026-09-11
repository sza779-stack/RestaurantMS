import React from 'react';
import { getFoodImage } from './foodImages';

interface PosComboGridProps {
  combos: any[];
  onSelect: (combo: any) => void;
  loading: boolean;
  title?: string;
  subtitle?: string;
  icon?: string;
  emptyMessage?: string;
  accent?: 'purple' | 'rose';
}

const PosComboGrid: React.FC<PosComboGridProps> = ({
  combos,
  onSelect,
  loading,
  title = 'Combo Meals & Deals',
  subtitle = 'Select a bundle to save',
  icon = 'Gift',
  emptyMessage = 'No combos available for this store',
  accent = 'purple',
}) => {
  const tone = accent === 'rose'
    ? {
        badge: 'bg-rose-500/10 text-rose-600',
        image: 'from-rose-100 to-orange-100 dark:from-rose-900/30 dark:to-orange-900/30',
        hover: 'hover:border-rose-500',
        text: 'text-rose-600',
        groupText: 'group-hover:text-rose-500',
        button: 'bg-rose-600 shadow-rose-500/20',
      }
    : {
        badge: 'bg-purple-500/10 text-purple-600',
        image: 'from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30',
        hover: 'hover:border-purple-500',
        text: 'text-purple-600',
        groupText: 'group-hover:text-purple-500',
        button: 'bg-purple-600 shadow-purple-500/20',
      };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500" />
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="m-4 rounded-2xl border border-white/5 bg-white/5 py-12 text-center text-gray-500">
        <span className="mb-3 block text-3xl font-black">{icon}</span>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-lg p-2 ${tone.badge}`}>
          <span className="text-sm font-black uppercase tracking-wide">{icon}</span>
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {combos.map((combo: any) => {
          const basePrice = Number(combo.basePrice || 0);
          const retailValue = Number(combo.retailValue || basePrice);
          const savings = Math.max(0, retailValue - basePrice);

          return (
            <button
              key={combo.id}
              type="button"
              onClick={() => onSelect(combo)}
              className={`group flex h-full cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-4 text-left backdrop-blur-sm transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/80 ${tone.hover}`}
            >
              <div className={`mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${tone.image}`}>
                <img
                  src={getFoodImage({ ...combo, isCombo: true })}
                  alt={combo.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pizza-wings-combo.png'; }}
                />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className={`line-clamp-1 font-bold text-gray-800 transition-colors dark:text-white ${tone.groupText}`}>
                  {combo.name}
                </h3>
                {combo.isFeatured && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                    Featured
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-gray-500 dark:text-gray-400">
                {combo.description || `${combo.items?.length || 0} items included in this deal`}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                <div>
                  <span className={`text-xl font-black ${tone.text}`}>
                    ${basePrice.toFixed(2)}
                  </span>
                  {savings > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 line-through">
                        ${retailValue.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                        SAVE ${savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 ${tone.button}`}>
                  +
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PosComboGrid;
