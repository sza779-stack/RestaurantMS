import React from 'react';

interface SaladsMenuProps {
  onAdd: (item: any) => void;
  onCustomize: () => void;
}

const SIGNATURE_SALADS = [
  {
    id: 'chef-salad',
    name: 'Chef Salad',
    description: 'Romaine, cucumber, tomato, ham, salami, egg, cheese, house dressing',
    prices: { small: 7.99, regular: 10.99 },
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    description: 'Fresh greens, cucumber, tomato, onions, olives, croutons',
    prices: { small: 6.99, regular: 9.49 },
  },
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    description: 'Romaine, parmesan, croutons, Caesar dressing',
    prices: { small: 6.99, regular: 9.99 },
  },
];

const SaladsMenu: React.FC<SaladsMenuProps> = ({ onAdd, onCustomize }) => {
  const handleAdd = (salad: (typeof SIGNATURE_SALADS)[number], size: 'small' | 'regular') => {
    const price = salad.prices[size];
    onAdd({
      productId: `${salad.id}-${size}`,
      productName: `${salad.name} (${size === 'small' ? 'Small' : 'Regular'})`,
      sizeId: size,
      sizeName: size === 'small' ? 'Small' : 'Regular',
      quantity: 1,
      unitPrice: price,
      modifiers: [
        { modifierId: 'salad_type', optionId: salad.id, name: `Salad: ${salad.name}`, price: 0 },
        { modifierId: 'size', optionId: size, name: `Size: ${size === 'small' ? 'Small' : 'Regular'}`, price: 0 },
      ],
      notes: '',
      kitchenStation: 'SALAD',
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Signature Salads</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Quick add Chef, Garden, and Caesar or build your own</p>
        </div>
        <button
          onClick={onCustomize}
          className="px-4 py-2.5 bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-xl font-semibold hover:brightness-105 transition-all"
        >
          Build Your Own
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SIGNATURE_SALADS.map((salad) => (
          <div
            key={salad.id}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/70 rounded-xl p-4 hover:border-lime-400/80 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500/20 to-green-500/20 border border-lime-400/40 flex items-center justify-center mb-3 text-xl">
              🥗
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">{salad.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-[40px]">{salad.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => handleAdd(salad, 'small')}
                className="flex-1 px-3 py-2 bg-lime-600 text-white rounded-lg text-sm font-semibold hover:bg-lime-700 transition-colors"
              >
                Small ${salad.prices.small.toFixed(2)}
              </button>
              <button
                onClick={() => handleAdd(salad, 'regular')}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Regular ${salad.prices.regular.toFixed(2)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaladsMenu;
