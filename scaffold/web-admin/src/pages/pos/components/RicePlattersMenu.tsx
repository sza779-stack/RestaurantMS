import React from 'react';

interface RicePlattersMenuProps {
  onAdd: (item: any) => void;
  onCustomize: () => void;
}

const SIGNATURE_PLATTERS = [
  {
    id: 'sig-chicken-rice',
    name: 'Chicken Over Rice',
    description: 'Grilled chicken, basmati rice, salad, white + red sauce',
    price: 12.99,
  },
  {
    id: 'sig-gyro-rice',
    name: 'Gyro Over Rice',
    description: 'Seasoned gyro, basmati rice, salad, white + red sauce',
    price: 13.49,
  },
  {
    id: 'sig-mixed-rice',
    name: 'Mixed Chicken & Gyro',
    description: 'Chicken and gyro combo with rice, salad, and sauces',
    price: 14.99,
  },
  {
    id: 'sig-spicy-green',
    name: 'Spicy Green Platter',
    description: 'Chicken over rice with house green sauce on side',
    price: 13.99,
  },
];

const RicePlattersMenu: React.FC<RicePlattersMenuProps> = ({ onAdd, onCustomize }) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Signature Rice Platters</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Quick add best sellers or customize your own platter</p>
        </div>
        <button
          onClick={onCustomize}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:brightness-105 transition-all"
        >
          Build Your Own
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SIGNATURE_PLATTERS.map((platter) => (
          <div
            key={platter.id}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/70 rounded-xl p-4 hover:border-emerald-400/80 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center mb-3">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 relative">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full bg-emerald-500/80" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">{platter.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-[40px]">{platter.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xl font-bold text-emerald-600">${platter.price.toFixed(2)}</span>
              <button
                onClick={() =>
                onAdd({
                    productId: platter.id,
                    productName: platter.name,
                    quantity: 1,
                    unitPrice: platter.price,
                    modifiers: [
                      { modifierId: 'platter_type', optionId: platter.id, name: 'Signature Platter', price: 0 },
                      { modifierId: 'top_sauce', optionId: 'white-sauce', name: 'Top Sauce: White Sauce', price: 0 },
                      { modifierId: 'top_sauce', optionId: 'red-sauce', name: 'Top Sauce: Red Sauce', price: 0 },
                      ...(platter.id === 'sig-spicy-green'
                        ? [{ modifierId: 'side_sauce', optionId: 'side-green-sauce', name: 'Green Sauce On Side', price: 0.5 }]
                        : []),
                    ],
                    notes: '',
                    kitchenStation: 'GRILL',
                  })
                }
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RicePlattersMenu;
