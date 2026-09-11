import React from 'react';
import { Check, Plus } from 'lucide-react';
import type { PizzaTopping, ToppingAmount, ToppingPlacement } from './types';

interface ToppingCardProps {
  topping: PizzaTopping;
  onSelect: (toppingId: string) => void;
  onRemove: (toppingId: string) => void;
  onPlacementChange: (toppingId: string, placement: ToppingPlacement) => void;
  onAmountChange: (toppingId: string, amount: ToppingAmount) => void;
}

const PLACEMENTS: Array<{ id: ToppingPlacement; label: string }> = [
  { id: 'LEFT', label: 'Left' },
  { id: 'FULL', label: 'Full' },
  { id: 'RIGHT', label: 'Right' },
];

const AMOUNTS: Array<{ id: ToppingAmount; label: string }> = [
  { id: 'LIGHT', label: 'Light' },
  { id: 'REGULAR', label: 'Regular' },
  { id: 'EXTRA', label: 'Extra' },
];

export function ToppingCard({
  topping,
  onSelect,
  onRemove,
  onPlacementChange,
  onAmountChange,
}: ToppingCardProps) {
  const isMeat = topping.category === 'MEAT';
  const tone = isMeat
    ? {
        border: 'border-red-200',
        selectedBorder: 'border-red-500',
        selectedBg: 'bg-red-50',
        text: 'text-red-950',
        active: 'bg-red-600 text-white',
        soft: 'bg-red-100 text-red-800',
        hover: 'hover:border-red-300 hover:bg-red-50/60',
      }
    : {
        border: 'border-green-200',
        selectedBorder: 'border-green-500',
        selectedBg: 'bg-green-50',
        text: 'text-green-950',
        active: 'bg-green-600 text-white',
        soft: 'bg-green-100 text-green-800',
        hover: 'hover:border-green-300 hover:bg-green-50/60',
      };

  const allowedPlacements = topping.allowedPlacements || PLACEMENTS.map((item) => item.id);
  const allowedAmounts = topping.allowedAmounts || AMOUNTS.map((item) => item.id);

  const toggleSelected = () => {
    if (topping.isSelected) {
      onRemove(topping.id);
      return;
    }
    onSelect(topping.id);
  };

  return (
    <article
	      className={`relative flex h-[172px] min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-white transition-all ${
	        topping.isSelected ? `${tone.selectedBorder} ${tone.selectedBg} shadow-md` : `${tone.border} ${tone.hover}`
	      } ${!topping.isAvailable ? 'cursor-not-allowed opacity-45' : ''}`}
	    >
	      <div className={`relative flex h-[82px] w-full items-center justify-center px-4 text-center transition-colors ${topping.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'} ${topping.isSelected ? '' : isMeat ? 'hover:bg-red-50/80' : 'hover:bg-green-50/80'}`}>
	        <button
	          type="button"
	          disabled={!topping.isAvailable}
	          onClick={toggleSelected}
	          className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
	          aria-pressed={topping.isSelected}
	          aria-label={`${topping.isSelected ? 'Deselect' : 'Select'} ${topping.name}`}
	        />
	        <div
	          className={`pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full ${
	            topping.isSelected
	              ? `${tone.active} shadow-sm`
	              : 'border border-dashed border-slate-300 bg-white text-slate-500'
	          }`}
	        >
	          {topping.isSelected ? (
	            <Check size={14} strokeWidth={3} />
	          ) : (
	            <Plus size={16} strokeWidth={2.5} />
	          )}
	        </div>
	        {topping.imageUrl && (
	          <img
	            src={topping.imageUrl}
	            alt=""
	            className="pointer-events-none absolute top-2 h-8 w-14 object-contain"
	          />
	        )}
	        <span className={`pointer-events-none relative line-clamp-2 text-base font-black leading-tight ${topping.isSelected ? tone.text : 'text-slate-800'}`}>
	          {topping.name}
	        </span>
      </div>

      <div className="grid h-[45px] grid-cols-3 border-t border-slate-200">
        {PLACEMENTS.map((placement) => {
	          const active = topping.placement === placement.id;
          const disabled = !topping.isAvailable || !allowedPlacements.includes(placement.id);
          return (
            <button
              key={placement.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                if (!topping.isSelected) onSelect(topping.id);
                onPlacementChange(topping.id, placement.id);
              }}
              className={`border-r border-slate-200 text-[11px] font-black uppercase transition-colors last:border-r-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 ${
                active ? tone.active : 'bg-white/80 text-slate-500 hover:bg-slate-50'
              } ${disabled ? 'opacity-35' : ''}`}
            >
              {placement.label}
            </button>
          );
        })}
      </div>

      <div className="grid h-[45px] grid-cols-3 border-t border-slate-200">
        {AMOUNTS.map((amount) => {
	          const active = topping.amount === amount.id;
          const disabled = !topping.isAvailable || !allowedAmounts.includes(amount.id);
          return (
            <button
              key={amount.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                if (!topping.isSelected) onSelect(topping.id);
                onAmountChange(topping.id, amount.id);
              }}
              className={`border-r border-slate-200 text-[10px] font-black uppercase transition-colors last:border-r-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 ${
                active ? tone.soft : 'bg-white/80 text-slate-500 hover:bg-slate-50'
              } ${disabled ? 'opacity-35' : ''}`}
            >
              {amount.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}
