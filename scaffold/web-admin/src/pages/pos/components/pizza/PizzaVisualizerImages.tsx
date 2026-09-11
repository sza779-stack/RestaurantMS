/**
 * RESTORE POINT — Pizza preview using PNG layers from `/public/pizzas/layers/`.
 *
 * To switch the builder back to this visual:
 *   In `BuildYourOwnPizza.tsx`, set `USE_PIZZA_IMAGE_LAYERS` to `true`.
 *
 * Assets expected:
 *   - `/pizzas/layers/base.png`
 *   - `/pizzas/layers/<toppingId>.png` for each id in AVAILABLE_LAYERS
 */
import React from 'react';
import type { ToppingSelection } from './types';

export const AVAILABLE_LAYERS = [
  'pepperoni',
  'sausage',
  'bacon',
  'ham',
  'chicken',
  'beef',
  'mushrooms',
  'onions',
  'peppers',
  'olives',
  'tomatoes',
  'spinach',
  'pineapple',
  'jalapenos',
];

export interface PizzaVisualizerImagesProps {
  toppings: ToppingSelection[];
  activeToppingId: string | null;
  onPizzaTap: (side: 'LEFT' | 'RIGHT') => void;
}

export const PizzaVisualizerImages: React.FC<PizzaVisualizerImagesProps> = ({
  toppings,
  activeToppingId,
  onPizzaTap,
}) => (
  <div className="relative w-full aspect-square max-w-[360px] mx-auto mb-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-white/10 ring-4 ring-orange-500/20 bg-white">
    <img
      src="/pizzas/layers/base.png"
      alt="Base Pizza"
      className="absolute inset-0 w-full h-full object-cover"
    />

    <div className="absolute inset-[12%] rounded-full overflow-hidden">
      {toppings.map((t) => {
        if (!AVAILABLE_LAYERS.includes(t.id)) return null;

	        let clipPath = 'none';
	        if (t.side === 'LEFT') clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
	        if (t.side === 'RIGHT') clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
	        const opacity = t.amount === 'LIGHT' ? 0.65 : t.amount === 'EXTRA' ? 1 : 0.88;

	        return (
	          <img
            key={t.id}
            src={`/pizzas/layers/${t.id}.png`}
	            alt={t.name}
	            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-300 ease-in-out mix-blend-multiply"
	            style={{ clipPath, opacity }}
	          />
        );
      })}
    </div>

    <div className="absolute inset-0 flex z-10">
      <div
        className="flex-1 hover:bg-orange-500/20 transition-colors cursor-pointer"
        onClick={() => onPizzaTap('LEFT')}
        title={
          activeToppingId
            ? 'Tap to toggle active topping on left half'
            : 'Select a topping first to add to pizza'
        }
      />
      <div
        className="flex-1 hover:bg-orange-500/20 transition-colors cursor-pointer"
        onClick={() => onPizzaTap('RIGHT')}
        title={
          activeToppingId
            ? 'Tap to toggle active topping on right half'
            : 'Select a topping first to add to pizza'
        }
      />
    </div>
  </div>
);
