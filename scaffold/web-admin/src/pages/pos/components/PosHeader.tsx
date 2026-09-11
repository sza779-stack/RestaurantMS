import React from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Clock } from 'lucide-react';
import SearchBar from './SearchBar';

interface PosHeaderProps {
  topControlsHost: HTMLElement | null;
  searchItems: any[];
  onSearchSelect: (item: any) => void;
  onBuildYourOwn: () => void;
  onShowOrders: () => void;
  onShowRecall: () => void;
  suspendedOrdersCount: number;
}

const PosHeader: React.FC<PosHeaderProps> = ({
  topControlsHost,
  searchItems,
  onSearchSelect,
  onBuildYourOwn,
  onShowOrders,
  onShowRecall,
  suspendedOrdersCount,
}) => {
  if (!topControlsHost) return null;

  return createPortal(
    <div className="w-full flex items-center justify-center gap-3">
      <div className="w-full max-w-3xl">
        <SearchBar
          items={searchItems}
          onSelect={onSearchSelect}
          onBuildYourOwn={onBuildYourOwn}
          placeholder="Search items... (Ctrl+K)"
        />
      </div>
      <button
        onClick={onShowOrders}
        className="min-h-11 flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 hover:shadow-md transition-all whitespace-nowrap"
      >
        <ShoppingBag size={18} />
        <span>Find Orders</span>
      </button>
      <button
        onClick={onShowRecall}
        className="relative min-h-11 flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all border border-slate-200 dark:border-white/10 whitespace-nowrap"
      >
        <Clock size={18} />
        <span>Recall</span>
        {suspendedOrdersCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold">
            {suspendedOrdersCount}
          </span>
        )}
      </button>
    </div>,
    topControlsHost
  );
};

export default PosHeader;
