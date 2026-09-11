import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

interface BuildYourOwnSubProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Visual styling tokens for the live sub preview.
//
// Unlike early pizza prototypes that used stacked PNGs, the pizza builder now
// defaults to the same inline-SVG approach as this sub preview (see
// `BuildYourOwnPizza.tsx` + `pizza/PizzaVisualizerSvg.tsx`). PNG restore:
// `USE_PIZZA_IMAGE_LAYERS` in BuildYourOwnPizza.
// resolves to a fill colour here; the SubVisualizer below renders one or more
// shapes per selected ingredient and stacks them between the two halves of the
// bread roll. The mapping is by-id so adding a new ingredient is a two-line
// change (entry in *_OPTIONS + entry here).
// ---------------------------------------------------------------------------
const BREAD_FILL: Record<string, string> = {
  white: '#e8c9a0',
  wheat: '#a37449',
  italian: '#c89968',
  parmesan: '#d4ae72',
};

const MEAT_FILL: Record<string, string> = {
  turkey: '#e9b88c',
  ham: '#d96a85',
  'roast-beef': '#8c3a2c',
  salami: '#b13a3a',
  pepperoni: '#c1322a',
  meatballs: '#6a3a23',
  chicken: '#d8b276',
};

const CHEESE_FILL: Record<string, string> = {
  american: '#f6c84c',
  provolone: '#f1deae',
  swiss: '#f3e4a8',
  cheddar: '#e88c2a',
};

const VEGGIE_FILL: Record<string, string> = {
  lettuce: '#52a447',
  tomatoes: '#d63b2e',
  onions: '#efe6f0',
  pickles: '#8fb04a',
  'banana-peppers': '#e9d24a',
  jalapenos: '#3f8a3a',
  olives: '#2d2d3a',
  spinach: '#2f6f33',
};

// Sauces tint the bread interior; transparent so multiple sauces can mix.
const SAUCE_FILL: Record<string, string> = {
  mayo: 'rgba(255, 250, 235, 0.55)',
  mustard: 'rgba(230, 184, 0, 0.5)',
  'honey-mustard': 'rgba(225, 160, 30, 0.5)',
  italian: 'rgba(160, 90, 50, 0.45)',
  ranch: 'rgba(245, 245, 230, 0.55)',
  chipotle: 'rgba(160, 60, 30, 0.5)',
};

interface SubVisualizerProps {
  breadId: string;
  meats: string[];
  cheeses: string[];
  veggies: string[];
  sauces: string[];
}

// Side-on cutaway of a 12" sub. Every layer renders only if its ingredient is
// selected; the order (sauce → meat → cheese → veggies → top bread) is what
// gives the stacked look. Coordinates assume a 400×220 viewBox so the parent
// can resize freely while ratios stay correct.
const SubVisualizer: React.FC<SubVisualizerProps> = ({ breadId, meats, cheeses, veggies, sauces }) => {
  const breadColor = BREAD_FILL[breadId] ?? BREAD_FILL.white;
  // Slightly darker shade for the crust/top half, derived rather than hard-coded
  // so changing the bread tint above keeps the two halves visually related.
  const breadCrust = shade(breadColor, -0.18);

  return (
    <div className="relative w-full max-w-[420px] mx-auto mb-6">
      <svg
        viewBox="0 0 400 220"
        className="w-full h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
        role="img"
        aria-label="Live preview of your sub"
      >
        <defs>
          <linearGradient id="sub-bread-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(breadColor, 0.1)} />
            <stop offset="1" stopColor={shade(breadColor, -0.15)} />
          </linearGradient>
          <linearGradient id="sub-bread-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(breadCrust, 0.1)} />
            <stop offset="1" stopColor={breadCrust} />
          </linearGradient>
        </defs>

        {/* Plate shadow so the sub feels grounded */}
        <ellipse cx="200" cy="200" rx="170" ry="10" fill="rgba(0,0,0,0.15)" />

        {/* Bottom half of the bread (the "boat") */}
        <path
          d="M 40 150 Q 40 110 90 105 L 310 105 Q 360 110 360 150 Q 360 175 320 178 L 80 178 Q 40 175 40 150 Z"
          fill="url(#sub-bread-bottom)"
        />

        {/* Sauce wash inside the boat */}
        {sauces.map((id, idx) => {
          const fill = SAUCE_FILL[id];
          if (!fill) return null;
          return (
            <path
              key={`sauce-${id}`}
              d="M 60 140 Q 60 122 100 120 L 300 120 Q 340 122 340 140 Q 340 152 305 154 L 95 154 Q 60 152 60 140 Z"
              fill={fill}
              opacity={1 - idx * 0.05}
            />
          );
        })}

        {/* Meats — ruffled strips, one per selected meat, stacked vertically */}
        {meats.map((id, idx) => {
          const fill = MEAT_FILL[id];
          if (!fill) return null;
          const y = 128 - idx * 4;
          return (
            <path
              key={`meat-${id}`}
              d={ruffle(60, y, 280, 12)}
              fill={fill}
              opacity="0.95"
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {/* Cheese — single trapezoid draped over the meat layer */}
        {cheeses.map((id, idx) => {
          const fill = CHEESE_FILL[id];
          if (!fill) return null;
          const offset = idx * 6;
          return (
            <path
              key={`cheese-${id}`}
              d={`M ${70 + offset} 122 L ${330 - offset} 122 L ${340 - offset} 138 L ${60 + offset} 138 Z`}
              fill={fill}
              opacity="0.92"
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {/* Lettuce gets its own frilled rendering since it's the iconic green ruffle */}
        {veggies.includes('lettuce') && (
          <path
            d={ruffle(55, 116, 290, 8, 6)}
            fill={VEGGIE_FILL.lettuce}
            opacity="0.95"
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Other veggies as scattered bits along the length of the sub */}
        {veggies
          .filter((v) => v !== 'lettuce')
          .map((id, idx) => {
            const fill = VEGGIE_FILL[id];
            if (!fill) return null;
            const seed = id.charCodeAt(0) + idx * 13;
            return (
              <g key={`veg-${id}`} className="transition-all duration-300 ease-out">
                {Array.from({ length: 9 }).map((_, i) => {
                  const x = 65 + ((seed * (i + 1)) % 270);
                  const y = 118 + ((seed * (i + 3)) % 8);
                  return <circle key={i} cx={x} cy={y} r="3.2" fill={fill} opacity="0.92" />;
                })}
              </g>
            );
          })}

        {/* Top half of the bread, painted last so it visually closes the sub */}
        <path
          d="M 40 95 Q 40 50 90 45 L 310 45 Q 360 50 360 95 Q 360 110 320 108 L 80 108 Q 40 110 40 95 Z"
          fill="url(#sub-bread-top)"
        />
        {/* Sesame highlights on the crust */}
        {Array.from({ length: 14 }).map((_, i) => (
          <ellipse
            key={`seed-${i}`}
            cx={70 + i * 19}
            cy={62 + (i % 3) * 4}
            rx="1.6"
            ry="0.9"
            fill="rgba(255,255,255,0.6)"
          />
        ))}
      </svg>

      <div className="mt-2 text-center text-xs font-medium text-gray-500">
        Live preview · updates as you build
      </div>
    </div>
  );
};

// Generates a ruffled horizontal strip path. Used for meat slices and lettuce —
// gives a hand-drawn "deli" feel without committing to a fixed bitmap.
function ruffle(x: number, y: number, width: number, height: number, waves = 10): string {
  const step = width / waves;
  const parts: string[] = [`M ${x} ${y + height / 2}`];
  for (let i = 0; i < waves; i++) {
    const cx = x + step * (i + 0.5);
    const dir = i % 2 === 0 ? -1 : 1;
    parts.push(`Q ${cx} ${y + (height / 2) * (1 + dir)} ${x + step * (i + 1)} ${y + height / 2}`);
  }
  parts.push(`L ${x + width} ${y + height}`);
  for (let i = waves; i > 0; i--) {
    parts.push(`L ${x + step * (i - 1)} ${y + height}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

// Lightens (positive amount) or darkens (negative amount) a hex / rgb colour.
// Used to derive the crust shade from the chosen bread fill so the two stay in
// the same family without us having to maintain a parallel colour map.
function shade(input: string, amount: number): string {
  // Quick path for #rrggbb. Other formats are returned unchanged because they
  // are already designed to look correct (e.g. rgba sauce overlays).
  const m = /^#([0-9a-f]{6})$/i.exec(input);
  if (!m) return input;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adjust = (c: number) => {
    const next = Math.round(c + (amount >= 0 ? (255 - c) * amount : c * amount));
    return Math.max(0, Math.min(255, next));
  };
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

const SIZE_OPTIONS = [
  { id: 'half', name: 'Half Sub (6")', price: 7.99 },
  { id: 'whole', name: 'Whole Sub (12")', price: 11.99 },
];

const BREAD_OPTIONS = [
  { id: 'white', name: 'White', price: 0 },
  { id: 'wheat', name: 'Whole Wheat', price: 0 },
  { id: 'italian', name: 'Italian Herb', price: 0.50 },
  { id: 'parmesan', name: 'Parmesan Oregano', price: 0.50 },
];

const MEAT_OPTIONS = [
  { id: 'turkey', name: 'Turkey Breast', price: 2.00 },
  { id: 'ham', name: 'Black Forest Ham', price: 2.00 },
  { id: 'roast-beef', name: 'Roast Beef', price: 2.50 },
  { id: 'salami', name: 'Genoa Salami', price: 2.00 },
  { id: 'pepperoni', name: 'Pepperoni', price: 2.00 },
  { id: 'meatballs', name: 'Italian Meatballs', price: 2.50 },
  { id: 'chicken', name: 'Grilled Chicken', price: 2.50 },
];

const CHEESE_OPTIONS = [
  { id: 'american', name: 'American', price: 0.50 },
  { id: 'provolone', name: 'Provolone', price: 0.50 },
  { id: 'swiss', name: 'Swiss', price: 0.50 },
  { id: 'cheddar', name: 'Cheddar', price: 0.50 },
];

const VEGGIE_OPTIONS = [
  { id: 'lettuce', name: 'Lettuce', price: 0 },
  { id: 'tomatoes', name: 'Tomatoes', price: 0 },
  { id: 'onions', name: 'Onions', price: 0 },
  { id: 'pickles', name: 'Pickles', price: 0 },
  { id: 'banana-peppers', name: 'Banana Peppers', price: 0 },
  { id: 'jalapenos', name: 'Jalapeños', price: 0 },
  { id: 'olives', name: 'Black Olives', price: 0 },
  { id: 'spinach', name: 'Spinach', price: 0 },
];

const SAUCE_OPTIONS = [
  { id: 'mayo', name: 'Mayonnaise', price: 0 },
  { id: 'mustard', name: 'Mustard', price: 0 },
  { id: 'honey-mustard', name: 'Honey Mustard', price: 0 },
  { id: 'italian', name: 'Italian', price: 0 },
  { id: 'ranch', name: 'Ranch', price: 0 },
  { id: 'chipotle', name: 'Chipotle', price: 0 },
];

type FixingAmount = 'LIGHT' | 'REGULAR' | 'EXTRA';

const FIXING_AMOUNT_OPTIONS: Array<{ id: FixingAmount; label: string }> = [
  { id: 'LIGHT', label: 'Light' },
  { id: 'REGULAR', label: 'Regular' },
  { id: 'EXTRA', label: 'Extra' },
];

const FIXING_AMOUNT_LABEL: Record<FixingAmount, string> = {
  LIGHT: 'Light',
  REGULAR: 'Regular',
  EXTRA: 'Extra',
};

const FIXING_AMOUNT_MULTIPLIER: Record<FixingAmount, number> = {
  LIGHT: 0.75,
  REGULAR: 1,
  EXTRA: 1.5,
};

const regularAmounts = (ids: string[]): Record<string, FixingAmount> =>
  ids.reduce<Record<string, FixingAmount>>((acc, id) => {
    acc[id] = 'REGULAR';
    return acc;
  }, {});

const formatFixingName = (name: string | undefined, amount: FixingAmount = 'REGULAR') => {
  if (!name) return undefined;
  return amount === 'REGULAR' ? name : `${FIXING_AMOUNT_LABEL[amount]} ${name}`;
};

const BuildYourOwnSub: React.FC<BuildYourOwnSubProps> = ({ onAdd, onCancel }) => {
  const [size, setSize] = useState(SIZE_OPTIONS[1]);
  const [bread, setBread] = useState(BREAD_OPTIONS[0]);
  const [selectedMeats, setSelectedMeats] = useState<string[]>([]);
  const [selectedCheeses, setSelectedCheeses] = useState<string[]>([]);
  const [cheeseAmounts, setCheeseAmounts] = useState<Record<string, FixingAmount>>({});
  const [selectedVeggies, setSelectedVeggies] = useState<string[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<string[]>(['mayo']);
  const [veggieAmounts, setVeggieAmounts] = useState<Record<string, FixingAmount>>({});
  const [sauceAmounts, setSauceAmounts] = useState<Record<string, FixingAmount>>({ mayo: 'REGULAR' });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleSelection = (id: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const toggleFixingSelection = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    setAmounts: React.Dispatch<React.SetStateAction<Record<string, FixingAmount>>>,
  ) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
      setAmounts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } else {
      setSelected([...selected, id]);
      setAmounts((current) => ({ ...current, [id]: 'REGULAR' }));
    }
  };

  const setFixingAmount = (
    id: string,
    amount: FixingAmount,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    setAmounts: React.Dispatch<React.SetStateAction<Record<string, FixingAmount>>>,
  ) => {
    if (!selected.includes(id)) {
      setSelected([...selected, id]);
    }
    setAmounts((current) => ({ ...current, [id]: amount }));
  };

  const calculatePrice = () => {
    let price = size.price + bread.price;
    
    selectedMeats.forEach(id => {
      const meat = MEAT_OPTIONS.find(m => m.id === id);
      if (meat) price += meat.price;
    });
    
    selectedCheeses.forEach(id => {
      const cheese = CHEESE_OPTIONS.find(c => c.id === id);
      if (cheese) price += cheese.price * FIXING_AMOUNT_MULTIPLIER[cheeseAmounts[id] ?? 'REGULAR'];
    });
    
    return price;
  };

  const handleAdd = () => {
    const meats = selectedMeats.map(id => MEAT_OPTIONS.find(m => m.id === id)?.name).filter(Boolean);
    const cheeses = selectedCheeses.map(id => formatFixingName(CHEESE_OPTIONS.find(c => c.id === id)?.name, cheeseAmounts[id])).filter(Boolean);
    const veggies = selectedVeggies.map(id => formatFixingName(VEGGIE_OPTIONS.find(v => v.id === id)?.name, veggieAmounts[id])).filter(Boolean);
    const sauces = selectedSauces.map(id => formatFixingName(SAUCE_OPTIONS.find(s => s.id === id)?.name, sauceAmounts[id])).filter(Boolean);

    const item = {
      id: `custom-sub-${Date.now()}`,
      name: `Build Your Own Sub - ${size.name}`,
      price: calculatePrice(),
      quantity,
      image: '🥪',
      modifiers: [
        `Bread: ${bread.name}`,
        ...(meats.length > 0 ? [`Meats: ${meats.join(', ')}`] : []),
        ...(cheeses.length > 0 ? [`Cheese: ${cheeses.join(', ')}`] : []),
        ...(veggies.length > 0 ? [`Veggies: ${veggies.join(', ')}`] : []),
        ...(sauces.length > 0 ? [`Sauces: ${sauces.join(', ')}`] : []),
      ],
      notes: notes || undefined,
      isCustom: true,
    };

    onAdd(item);
	  };
	
	  const totalPrice = calculatePrice() * quantity;
	  const selectedMeatNames = selectedMeats.map(id => MEAT_OPTIONS.find(m => m.id === id)?.name).filter(Boolean);
	  const selectedCheeseNames = selectedCheeses.map(id => formatFixingName(CHEESE_OPTIONS.find(c => c.id === id)?.name, cheeseAmounts[id])).filter(Boolean);
	  const selectedVeggieNames = selectedVeggies.map(id => formatFixingName(VEGGIE_OPTIONS.find(v => v.id === id)?.name, veggieAmounts[id])).filter(Boolean);
	  const selectedSauceNames = selectedSauces.map(id => formatFixingName(SAUCE_OPTIONS.find(s => s.id === id)?.name, sauceAmounts[id])).filter(Boolean);

	  const applyPreset = (preset: 'classic' | 'veggie' | 'spicy' | 'clear') => {
	    if (preset === 'classic') {
	      setBread(BREAD_OPTIONS[0]);
	      setSelectedMeats(['turkey', 'ham']);
	      setSelectedCheeses(['provolone']);
	      setCheeseAmounts(regularAmounts(['provolone']));
	      setSelectedVeggies(['lettuce', 'tomatoes', 'onions']);
	      setSelectedSauces(['mayo', 'mustard']);
	      setVeggieAmounts(regularAmounts(['lettuce', 'tomatoes', 'onions']));
	      setSauceAmounts(regularAmounts(['mayo', 'mustard']));
	    } else if (preset === 'veggie') {
	      setBread(BREAD_OPTIONS[1]);
	      setSelectedMeats([]);
	      setSelectedCheeses(['swiss']);
	      setCheeseAmounts(regularAmounts(['swiss']));
	      setSelectedVeggies(['lettuce', 'tomatoes', 'onions', 'pickles', 'spinach']);
	      setSelectedSauces(['italian']);
	      setVeggieAmounts(regularAmounts(['lettuce', 'tomatoes', 'onions', 'pickles', 'spinach']));
	      setSauceAmounts(regularAmounts(['italian']));
	    } else if (preset === 'spicy') {
	      setBread(BREAD_OPTIONS[2]);
	      setSelectedMeats(['salami', 'pepperoni']);
	      setSelectedCheeses(['cheddar']);
	      setCheeseAmounts(regularAmounts(['cheddar']));
	      setSelectedVeggies(['jalapenos', 'banana-peppers', 'onions']);
	      setSelectedSauces(['chipotle']);
	      setVeggieAmounts(regularAmounts(['jalapenos', 'banana-peppers', 'onions']));
	      setSauceAmounts(regularAmounts(['chipotle']));
	    } else {
	      setSelectedMeats([]);
	      setSelectedCheeses([]);
	      setCheeseAmounts({});
	      setSelectedVeggies([]);
	      setSelectedSauces([]);
	      setVeggieAmounts({});
	      setSauceAmounts({});
	      setNotes('');
	    }
	  };

	  const renderSummaryGroup = (label: string, values: (string | undefined)[], tone: string, empty: string) => (
	    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
	      <div className="mb-2 flex items-center justify-between gap-3">
	        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
	        <span className={`h-2 w-2 rounded-full ${tone}`} />
	      </div>
	      <div className="flex flex-wrap gap-1.5">
	        {values.length ? values.map((value) => (
	          <span key={value} className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
	            {value}
	          </span>
	        )) : (
	          <span className="text-xs font-semibold text-slate-400">{empty}</span>
	        )}
	      </div>
	    </div>
	  );

	  const renderOption = (
	    option: { id: string; name: string; price: number },
	    selected: boolean,
	    onClick: () => void,
	    accent: 'amber' | 'red' | 'yellow' | 'green' | 'blue',
	    showPrice = true,
	  ) => {
	    const activeClass = {
	      amber: 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm',
	      red: 'border-red-500 bg-red-50 text-red-800 shadow-sm',
	      yellow: 'border-yellow-500 bg-yellow-50 text-yellow-800 shadow-sm',
	      green: 'border-green-500 bg-green-50 text-green-800 shadow-sm',
	      blue: 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm',
	    }[accent];
	    const idleClass = {
	      amber: 'border-amber-100 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50',
	      red: 'border-red-100 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/50',
	      yellow: 'border-yellow-100 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50/50',
	      green: 'border-green-100 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50/50',
	      blue: 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50',
	    }[accent];
	    return (
	      <button
	        key={option.id}
	        type="button"
	        onClick={onClick}
	        className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-left transition-all ${selected ? activeClass : idleClass}`}
	      >
	        <span className="flex items-center justify-between gap-2">
	          <span className="text-sm font-black leading-tight">{option.name}</span>
	          {showPrice && option.price > 0 && (
	            <span className="shrink-0 text-xs font-bold opacity-70">+${option.price.toFixed(2)}</span>
	          )}
	        </span>
	      </button>
	    );
	  };

	  const renderFixingOption = (
	    option: { id: string; name: string; price: number },
	    selected: boolean,
	    onClick: () => void,
	    amount: FixingAmount,
	    onAmountChange: (amount: FixingAmount) => void,
	    accent: 'green' | 'blue' | 'yellow',
	  ) => {
	    const activeClass = {
	      green: 'border-green-500 bg-green-50 text-green-900 shadow-sm',
	      blue: 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm',
	      yellow: 'border-yellow-500 bg-yellow-50 text-yellow-900 shadow-sm',
	    }[accent];
	    const idleClass = {
	      green: 'border-green-100 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50/50',
	      blue: 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50',
	      yellow: 'border-yellow-100 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50/50',
	    }[accent];
	    const selectedAmountClass = {
	      green: 'bg-green-600 text-white shadow-sm',
	      blue: 'bg-blue-600 text-white shadow-sm',
	      yellow: 'bg-yellow-500 text-white shadow-sm',
	    }[accent];

	    return (
	      <div
	        key={option.id}
	        className={`rounded-xl border-2 p-2 transition-all ${selected ? activeClass : idleClass}`}
	      >
	        <button
	          type="button"
	          onClick={onClick}
	          className="flex min-h-[36px] w-full items-center justify-between gap-2 text-left"
	        >
	          <span className="text-sm font-black leading-tight">{option.name}</span>
	          {selected && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">On</span>}
	        </button>
	        {selected && (
	          <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-white/70 p-1">
	            {FIXING_AMOUNT_OPTIONS.map((choice) => (
	              <button
	                key={choice.id}
	                type="button"
	                onClick={(event) => {
	                  event.stopPropagation();
	                  onAmountChange(choice.id);
	                }}
	                className={`h-8 rounded-md text-[11px] font-black transition-all ${
	                  amount === choice.id ? selectedAmountClass : 'text-slate-500 hover:bg-slate-100'
	                }`}
	                aria-pressed={amount === choice.id}
	              >
	                {choice.label}
	              </button>
	            ))}
	          </div>
	        )}
	      </div>
	    );
	  };
	
	  return (
	    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 pt-20">
	      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl">
	        {/* Header */}
	        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-emerald-600 via-green-500 to-amber-500 px-6 py-4">
	          <div>
	            <h2 className="text-2xl font-black tracking-tight text-white">Build Your Own Sub</h2>
	            <p className="text-sm font-semibold text-white/80">Fast deli-style customization with live preview</p>
	          </div>
	          <button onClick={onCancel} className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
	            <X size={24} />
	          </button>
	        </div>
	
	        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
	          <aside className="hidden overflow-y-auto border-r border-slate-200 bg-slate-50 p-6 lg:block">
	            <SubVisualizer
	              breadId={bread.id}
	              meats={selectedMeats}
	              cheeses={selectedCheeses}
	              veggies={selectedVeggies}
	              sauces={selectedSauces}
	            />
	            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
	              <div className="mb-4 flex items-start justify-between gap-3">
	                <div>
	                  <h3 className="text-xl font-black text-slate-950">Your Creation</h3>
	                  <p className="text-xs font-semibold text-slate-400">Live deli summary</p>
	                </div>
	                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
	                  {selectedMeats.length + selectedCheeses.length + selectedVeggies.length + selectedSauces.length} items
	                </span>
	              </div>
	              <div className="space-y-2.5">
	                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
	                  <div className="flex justify-between gap-4 text-sm">
	                    <span className="font-semibold text-slate-500">Size</span>
	                    <strong className="text-right text-slate-950">{size.name}</strong>
	                  </div>
	                </div>
	                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
	                  <div className="flex justify-between gap-4 text-sm">
	                    <span className="font-semibold text-slate-500">Bread</span>
	                    <strong className="text-right text-slate-950">{bread.name}</strong>
	                  </div>
	                </div>
	                {renderSummaryGroup('Meats', selectedMeatNames, 'bg-red-500', 'No meat selected')}
	                {renderSummaryGroup('Cheese', selectedCheeseNames, 'bg-yellow-500', 'No cheese selected')}
	                {renderSummaryGroup('Veggies', selectedVeggieNames, 'bg-green-500', 'No veggies selected')}
	                {renderSummaryGroup('Sauces', selectedSauceNames, 'bg-blue-500', 'No sauce selected')}
	              </div>
	            </div>
	          </aside>

	          <main className="overflow-y-auto bg-slate-50 p-4 lg:p-6">
	            <div className="mx-auto max-w-4xl space-y-4">
	              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm sm:grid-cols-4">
	                <button type="button" onClick={() => applyPreset('classic')} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-100">Classic</button>
	                <button type="button" onClick={() => applyPreset('veggie')} className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-800 hover:bg-green-100">Veggie</button>
	                <button type="button" onClick={() => applyPreset('spicy')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-800 hover:bg-red-100">Spicy</button>
	                <button type="button" onClick={() => applyPreset('clear')} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">Clear</button>
	              </div>

	              <section className="rounded-2xl border border-amber-100 bg-amber-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-800">Base</h3>
	                  <span className="text-xs font-semibold text-slate-500">Required</span>
	                </div>
	                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
	                  <div className="grid grid-cols-2 gap-2">
	                    {SIZE_OPTIONS.map((s) => renderOption(s, size.id === s.id, () => setSize(s), 'amber'))}
	                  </div>
	                  <div className="grid grid-cols-2 gap-2">
	                    {BREAD_OPTIONS.map((b) => renderOption(b, bread.id === b.id, () => setBread(b), 'amber'))}
	                  </div>
	                </div>
	              </section>

	              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
	                <section className="rounded-2xl border border-red-100 bg-red-50/45 p-4 shadow-sm">
	                  <div className="mb-3 flex items-center justify-between gap-3">
	                    <h3 className="text-sm font-black uppercase tracking-wider text-red-800">Meats</h3>
	                    <span className="text-xs font-semibold text-slate-500">{selectedMeats.length} selected</span>
	                  </div>
	                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
	                    {MEAT_OPTIONS.map((meat) => renderOption(
	                      meat,
	                      selectedMeats.includes(meat.id),
	                      () => toggleSelection(meat.id, selectedMeats, setSelectedMeats),
	                      'red',
	                    ))}
	                  </div>
	                </section>

	                <section className="rounded-2xl border border-yellow-100 bg-yellow-50/45 p-4 shadow-sm">
	                  <div className="mb-3 flex items-center justify-between gap-3">
	                    <h3 className="text-sm font-black uppercase tracking-wider text-yellow-800">Cheese</h3>
	                    <span className="text-xs font-semibold text-slate-500">{selectedCheeses.length} selected</span>
	                  </div>
	                  <div className="grid grid-cols-2 gap-2">
	                    {CHEESE_OPTIONS.map((cheese) => renderFixingOption(
	                      cheese,
	                      selectedCheeses.includes(cheese.id),
	                      () => toggleFixingSelection(cheese.id, selectedCheeses, setSelectedCheeses, setCheeseAmounts),
	                      cheeseAmounts[cheese.id] ?? 'REGULAR',
	                      (amount) => setFixingAmount(cheese.id, amount, selectedCheeses, setSelectedCheeses, setCheeseAmounts),
	                      'yellow',
	                    ))}
	                  </div>
	                </section>
	              </div>

	              <section className="rounded-2xl border border-green-100 bg-green-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-green-800">Veggies</h3>
	                  <span className="text-xs font-semibold text-slate-500">{selectedVeggies.length} selected</span>
	                </div>
	                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
	                  {VEGGIE_OPTIONS.map((veggie) => renderFixingOption(
	                    veggie,
	                    selectedVeggies.includes(veggie.id),
	                    () => toggleFixingSelection(veggie.id, selectedVeggies, setSelectedVeggies, setVeggieAmounts),
	                    veggieAmounts[veggie.id] ?? 'REGULAR',
	                    (amount) => setFixingAmount(veggie.id, amount, selectedVeggies, setSelectedVeggies, setVeggieAmounts),
	                    'green',
	                  ))}
	                </div>
	              </section>

	              <section className="rounded-2xl border border-blue-100 bg-blue-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-blue-800">Sauces</h3>
	                  <span className="text-xs font-semibold text-slate-500">{selectedSauces.length} selected</span>
	                </div>
	                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
	                  {SAUCE_OPTIONS.map((sauce) => renderFixingOption(
	                    sauce,
	                    selectedSauces.includes(sauce.id),
	                    () => toggleFixingSelection(sauce.id, selectedSauces, setSelectedSauces, setSauceAmounts),
	                    sauceAmounts[sauce.id] ?? 'REGULAR',
	                    (amount) => setFixingAmount(sauce.id, amount, selectedSauces, setSelectedSauces, setSauceAmounts),
	                    'blue',
	                  ))}
	                </div>
	              </section>

	              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
	                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">Special Instructions</label>
	                <textarea
	                  value={notes}
	                  onChange={(e) => setNotes(e.target.value)}
	                  placeholder="Any special requests? Toasted, cut in half, sauce on side..."
	                  className="h-20 w-full resize-none rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
	                />
	              </section>
	            </div>
	          </main>
	        </div>
	
	        {/* Footer */}
	        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-10px_35px_-20px_rgba(15,23,42,0.35)]">
	          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
	            <div className="flex items-center gap-4">
	              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
	                <button 
	                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
	                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:text-emerald-700 disabled:opacity-50"
	                  disabled={quantity <= 1}
	                >
	                  <Minus size={18} />
	                </button>
	                <span className="w-8 text-center text-lg font-black text-slate-900">{quantity}</span>
	                <button 
	                  onClick={() => setQuantity(quantity + 1)}
	                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700"
	                >
	                  <Plus size={18} />
	                </button>
	              </div>
	              
	              <div>
	                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Price</p>
	                <p className="text-3xl font-black tracking-tight text-slate-950">${totalPrice.toFixed(2)}</p>
	              </div>
	            </div>
	            
	            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
	              <button
	                type="button"
	                onClick={onCancel}
	                className="rounded-lg bg-slate-100 px-7 py-4 font-black text-slate-700 transition-all hover:bg-slate-200"
	              >
	                Close
	              </button>
	              <button
	                onClick={handleAdd}
	                className="flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30"
	              >
	                <ShoppingCart size={22} />
	                Add to Cart
	              </button>
	            </div>
	          </div>
	        </div>
	      </div>
    </div>
  );
};

export default BuildYourOwnSub;
