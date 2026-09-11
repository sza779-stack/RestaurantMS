import React, { useMemo, useState } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

interface BuildYourOwnPastaProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Visual styling tokens for the live pasta preview.
//
// Like the sub builder, there are no curated art assets for pasta, so we paint
// the bowl from inline SVG primitives. Each PASTA_RENDERER produces the shapes
// for a particular pasta type (spaghetti strands, penne tubes, etc.). The sauce
// chosen tints the whole bowl, while proteins/veggies render as small coloured
// chips scattered on top.
// ---------------------------------------------------------------------------
const SAUCE_FILL: Record<string, string> = {
  marinara: '#c33326',
  alfredo: '#f5ecd7',
  'meat-sauce': '#8c3a25',
  vodka: '#e07a5f',
  pesto: '#4a7a3a',
  aglio: '#f4d28a',
};

const PROTEIN_FILL: Record<string, string> = {
  chicken: '#d8b276',
  shrimp: '#ef9aa3',
  meatballs: '#6a3a23',
  sausage: '#7a4626',
};

const VEGGIE_FILL: Record<string, string> = {
  mushrooms: '#8a6f55',
  spinach: '#3f7a3a',
  'sun-dried': '#b1382b',
  broccoli: '#3d6b2c',
  onions: '#f0e6e6',
  peppers: '#e2823a',
};

interface PastaVisualizerProps {
  pastaId: string;
  sauceId: string;
  proteins: string[];
  veggies: string[];
  extras: string[];
}

// Top-down bowl view. The layering order (bowl rim → pasta strands → sauce
// tint → proteins → veggies → garnish) is what gives the dish depth.
const PastaVisualizer: React.FC<PastaVisualizerProps> = ({
  pastaId,
  sauceId,
  proteins,
  veggies,
  extras,
}) => {
  const sauce = SAUCE_FILL[sauceId] ?? SAUCE_FILL.marinara;

  // The chip layout is deterministic per-id, otherwise the preview would
  // re-shuffle on every keystroke and feel jittery. useMemo keys on the
  // ingredient list so positions only change when the customer's choices do.
  const proteinChips = useMemo(() => buildChips(proteins, 'protein'), [proteins]);
  const veggieChips = useMemo(() => buildChips(veggies, 'veggie'), [veggies]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto mb-6">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
        role="img"
        aria-label="Live preview of your pasta bowl"
      >
        <defs>
          <radialGradient id="pasta-bowl-rim" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.85" stopColor="#f3f4f6" />
            <stop offset="1" stopColor="#9ca3af" />
          </radialGradient>
          <radialGradient id="pasta-bowl-inside" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d1d5db" />
          </radialGradient>
        </defs>

        {/* Plate shadow */}
        <ellipse cx="200" cy="370" rx="170" ry="14" fill="rgba(0,0,0,0.18)" />

        {/* Outer rim and inner well of the bowl */}
        <circle cx="200" cy="200" r="180" fill="url(#pasta-bowl-rim)" />
        <circle cx="200" cy="200" r="155" fill="url(#pasta-bowl-inside)" />

        {/* Pasta strands/shapes specific to the chosen type */}
        <PastaShapes pastaId={pastaId} />

        {/* Sauce tint over the pasta. Lower opacity keeps the pasta shapes
            partially visible so the customer can still see what type they
            picked under (e.g.) a heavy marinara. */}
        <circle cx="200" cy="200" r="148" fill={sauce} opacity="0.42" className="transition-all duration-300" />

        {/* Proteins — larger chips drawn first so veggies sit on top */}
        {proteinChips.map(({ id, x, y, angle }) => {
          const fill = PROTEIN_FILL[id];
          if (!fill) return null;
          return (
            <g key={`p-${id}-${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`} className="transition-all duration-300 ease-out">
              {id === 'meatballs' && <circle r="11" fill={fill} stroke={shade(fill, -0.25)} strokeWidth="1.2" />}
              {id === 'shrimp' && (
                <path d="M -10 0 Q 0 -10 10 0 Q 0 10 -10 0 Z" fill={fill} stroke={shade(fill, -0.25)} strokeWidth="0.8" />
              )}
              {id === 'chicken' && <rect x="-10" y="-6" width="20" height="12" rx="3" fill={fill} />}
              {id === 'sausage' && <rect x="-12" y="-5" width="24" height="10" rx="5" fill={fill} />}
            </g>
          );
        })}

        {/* Veggies — small chips/dots scattered last */}
        {veggieChips.map(({ id, x, y }) => {
          const fill = VEGGIE_FILL[id];
          if (!fill) return null;
          // A couple of veggies render as distinctive shapes; the rest fall
          // through to the generic dot so adding a new veggie costs one line.
          if (id === 'broccoli') {
            return (
              <g key={`v-${id}-${x}-${y}`} transform={`translate(${x} ${y})`}>
                <circle cx="-3" cy="-2" r="3.5" fill={fill} />
                <circle cx="3" cy="-2" r="3.5" fill={fill} />
                <circle cx="0" cy="3" r="3.5" fill={fill} />
              </g>
            );
          }
          if (id === 'mushrooms') {
            return (
              <g key={`v-${id}-${x}-${y}`} transform={`translate(${x} ${y})`}>
                <path d="M -6 1 Q -6 -5 0 -5 Q 6 -5 6 1 Z" fill={fill} />
                <rect x="-2" y="1" width="4" height="4" fill={shade(fill, 0.25)} />
              </g>
            );
          }
          return <circle key={`v-${id}-${x}-${y}`} cx={x} cy={y} r="4" fill={fill} opacity="0.95" />;
        })}

        {/* Garnish: extra-cheese gets a snow of parmesan flakes */}
        {extras.includes('extra-cheese') && (
          <g opacity="0.9">
            {Array.from({ length: 28 }).map((_, i) => {
              const seed = i * 47.3;
              const r = 80 + (seed % 60);
              const a = (seed * 0.31) % (Math.PI * 2);
              const cx = 200 + Math.cos(a) * r;
              const cy = 200 + Math.sin(a) * r;
              return <rect key={i} x={cx - 1.5} y={cy - 0.5} width="3" height="1.2" fill="#fff7d6" />;
            })}
          </g>
        )}
      </svg>

      <div className="mt-2 text-center text-xs font-medium text-gray-500">
        Live preview · updates as you build
      </div>
    </div>
  );
};

// Deterministic chip layout: same selection always yields the same positions.
// Variance per chip comes from the index so identical neighbours don't overlap.
function buildChips(
  ids: string[],
  kind: 'protein' | 'veggie',
): Array<{ id: string; x: number; y: number; angle: number }> {
  const out: Array<{ id: string; x: number; y: number; angle: number }> = [];
  const baseRadius = kind === 'protein' ? 60 : 95;
  const count = kind === 'protein' ? 5 : 7;
  ids.forEach((id, idx) => {
    const seed = hash(id);
    for (let i = 0; i < count; i++) {
      const a = (seed + i * 73 + idx * 29) * 0.0173;
      const r = baseRadius - ((seed + i * 11) % 30);
      out.push({
        id,
        x: 200 + Math.cos(a) * r,
        y: 200 + Math.sin(a) * r,
        angle: (seed + i * 37) % 360,
      });
    }
  });
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Per-pasta-type shape rendering. Each branch paints a recognisable pattern
// inside the bowl: spaghetti = many thin strands, penne = scattered tubes, etc.
const PastaShapes: React.FC<{ pastaId: string }> = ({ pastaId }) => {
  const noodleColor = '#f1d79c';
  const noodleEdge = '#c89a52';

  if (pastaId === 'spaghetti') {
    return (
      <g>
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 32;
          const r1 = 90 + (i % 7) * 6;
          const r2 = 30 + (i % 5) * 8;
          return (
            <path
              key={i}
              d={`M ${200 + Math.cos(a) * r1} ${200 + Math.sin(a) * r1}
                  Q 200 200 ${200 + Math.cos(a + 0.6) * r2} ${200 + Math.sin(a + 0.6) * r2}`}
              stroke={noodleColor}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          );
        })}
      </g>
    );
  }

  if (pastaId === 'penne') {
    return (
      <g>
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 18 + i * 0.13;
          const r = 50 + (i % 4) * 25;
          const cx = 200 + Math.cos(a) * r;
          const cy = 200 + Math.sin(a) * r;
          const rot = (i * 37) % 360;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
              <rect x="-14" y="-5" width="28" height="10" rx="3" fill={noodleColor} stroke={noodleEdge} strokeWidth="0.8" />
              <line x1="-9" y1="-5" x2="-12" y2="5" stroke={noodleEdge} strokeWidth="0.8" />
              <line x1="9" y1="-5" x2="12" y2="5" stroke={noodleEdge} strokeWidth="0.8" />
            </g>
          );
        })}
      </g>
    );
  }

  if (pastaId === 'fettuccine') {
    return (
      <g>
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 100 + i * 14;
          return (
            <path
              key={i}
              d={`M 70 ${y} Q 200 ${y - 12} 330 ${y}`}
              stroke={noodleColor}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          );
        })}
      </g>
    );
  }

  if (pastaId === 'bowtie') {
    return (
      <g>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 14;
          const r = 40 + (i % 4) * 28;
          const cx = 200 + Math.cos(a) * r;
          const cy = 200 + Math.sin(a) * r;
          const rot = (i * 53) % 360;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
              <path
                d="M -14 -8 L -4 0 L -14 8 Z M 14 -8 L 4 0 L 14 8 Z M -4 0 L 4 0"
                fill={noodleColor}
                stroke={noodleEdge}
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </g>
    );
  }

  if (pastaId === 'tortellini') {
    return (
      <g>
        {Array.from({ length: 22 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 22 + i * 0.07;
          const r = 50 + (i % 4) * 22;
          const cx = 200 + Math.cos(a) * r;
          const cy = 200 + Math.sin(a) * r;
          return (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <circle r="8" fill={noodleColor} stroke={noodleEdge} strokeWidth="0.8" />
              <circle r="3" fill="#d9a35a" />
            </g>
          );
        })}
      </g>
    );
  }

  return null;
};

function shade(input: string, amount: number): string {
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

const PASTA_TYPES = [
  { id: 'spaghetti', name: 'Spaghetti', price: 10.99 },
  { id: 'penne', name: 'Penne', price: 10.99 },
  { id: 'fettuccine', name: 'Fettuccine', price: 11.99 },
  { id: 'bowtie', name: 'Bowtie (Farfalle)', price: 11.99 },
  { id: 'tortellini', name: 'Cheese Tortellini', price: 12.99 },
];

const SAUCES = [
  { id: 'marinara', name: 'Marinara', price: 0 },
  { id: 'alfredo', name: 'Alfredo', price: 1.00 },
  { id: 'meat-sauce', name: 'Meat Sauce', price: 1.50 },
  { id: 'vodka', name: 'Vodka Sauce', price: 1.50 },
  { id: 'pesto', name: 'Pesto', price: 1.00 },
  { id: 'aglio', name: 'Aglio e Olio', price: 0 },
];

const PROTEINS = [
  { id: 'chicken', name: 'Grilled Chicken', price: 3.00 },
  { id: 'shrimp', name: 'Shrimp', price: 4.00 },
  { id: 'meatballs', name: 'Meatballs', price: 3.00 },
  { id: 'sausage', name: 'Italian Sausage', price: 3.00 },
];

const VEGGIES = [
  { id: 'mushrooms', name: 'Mushrooms', price: 1.00 },
  { id: 'spinach', name: 'Spinach', price: 1.00 },
  { id: 'sun-dried', name: 'Sun-Dried Tomatoes', price: 1.50 },
  { id: 'broccoli', name: 'Broccoli', price: 1.00 },
  { id: 'onions', name: 'Onions', price: 0.50 },
  { id: 'peppers', name: 'Bell Peppers', price: 0.75 },
];

const EXTRAS = [
  { id: 'extra-cheese', name: 'Extra Cheese', price: 1.50 },
  { id: 'garlic-bread', name: 'Side of Garlic Bread', price: 2.50 },
  { id: 'breadsticks', name: 'Breadsticks (2pc)', price: 3.00 },
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

const BuildYourOwnPasta: React.FC<BuildYourOwnPastaProps> = ({ onAdd, onCancel }) => {
  const [pastaType, setPastaType] = useState(PASTA_TYPES[0]);
  const [sauce, setSauce] = useState(SAUCES[0]);
  const [sauceAmount, setSauceAmount] = useState<FixingAmount>('REGULAR');
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedVeggies, setSelectedVeggies] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [veggieAmounts, setVeggieAmounts] = useState<Record<string, FixingAmount>>({});
  const [extraAmounts, setExtraAmounts] = useState<Record<string, FixingAmount>>({});
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
    let price = pastaType.price + sauce.price + (sauceAmount === 'EXTRA' ? 0.5 : 0);
    
    selectedProteins.forEach(id => {
      const protein = PROTEINS.find(p => p.id === id);
      if (protein) price += protein.price;
    });
    
    selectedVeggies.forEach(id => {
      const veggie = VEGGIES.find(v => v.id === id);
      if (veggie) price += veggie.price * FIXING_AMOUNT_MULTIPLIER[veggieAmounts[id] ?? 'REGULAR'];
    });
    
    selectedExtras.forEach(id => {
      const extra = EXTRAS.find(e => e.id === id);
      if (extra) price += extra.price * (id === 'extra-cheese' ? FIXING_AMOUNT_MULTIPLIER[extraAmounts[id] ?? 'REGULAR'] : 1);
    });
    
    return price;
  };

  const handleAdd = () => {
    const proteins = selectedProteins.map(id => PROTEINS.find(p => p.id === id)?.name).filter(Boolean);
    const veggies = selectedVeggies.map(id => formatFixingName(VEGGIES.find(v => v.id === id)?.name, veggieAmounts[id])).filter(Boolean);
    const extras = selectedExtras.map(id => {
      const extra = EXTRAS.find(e => e.id === id);
      return id === 'extra-cheese' ? formatFixingName(extra?.name, extraAmounts[id]) : extra?.name;
    }).filter(Boolean);

    const item = {
      id: `custom-pasta-${Date.now()}`,
      name: `Build Your Own Pasta - ${pastaType.name}`,
      price: calculatePrice(),
      quantity,
      image: '🍝',
      modifiers: [
        `Pasta: ${pastaType.name}`,
        `Sauce: ${formatFixingName(sauce.name, sauceAmount)}`,
        ...(proteins.length > 0 ? [`Proteins: ${proteins.join(', ')}`] : []),
        ...(veggies.length > 0 ? [`Add-ons: ${veggies.join(', ')}`] : []),
        ...(extras.length > 0 ? [`Extras: ${extras.join(', ')}`] : []),
      ],
      notes: notes || undefined,
      isCustom: true,
    };

    onAdd(item);
	  };
	
	  const totalPrice = calculatePrice() * quantity;
	  const selectedProteinNames = selectedProteins.map(id => PROTEINS.find(p => p.id === id)?.name).filter(Boolean);
	  const selectedVeggieNames = selectedVeggies.map(id => formatFixingName(VEGGIES.find(v => v.id === id)?.name, veggieAmounts[id])).filter(Boolean);
	  const selectedExtraNames = selectedExtras.map(id => {
	    const extra = EXTRAS.find(e => e.id === id);
	    return id === 'extra-cheese' ? formatFixingName(extra?.name, extraAmounts[id]) : extra?.name;
	  }).filter(Boolean);

	  const applyPreset = (preset: 'classic' | 'creamy' | 'garden' | 'clear') => {
	    if (preset === 'classic') {
	      setPastaType(PASTA_TYPES[0]);
	      setSauce(SAUCES[0]);
	      setSauceAmount('REGULAR');
	      setSelectedProteins(['meatballs']);
	      setSelectedVeggies(['mushrooms', 'onions']);
	      setSelectedExtras(['garlic-bread']);
	      setVeggieAmounts(regularAmounts(['mushrooms', 'onions']));
	      setExtraAmounts({});
	    } else if (preset === 'creamy') {
	      setPastaType(PASTA_TYPES[2]);
	      setSauce(SAUCES[1]);
	      setSauceAmount('REGULAR');
	      setSelectedProteins(['chicken']);
	      setSelectedVeggies(['spinach', 'broccoli']);
	      setSelectedExtras(['extra-cheese']);
	      setVeggieAmounts(regularAmounts(['spinach', 'broccoli']));
	      setExtraAmounts(regularAmounts(['extra-cheese']));
	    } else if (preset === 'garden') {
	      setPastaType(PASTA_TYPES[1]);
	      setSauce(SAUCES[4]);
	      setSauceAmount('REGULAR');
	      setSelectedProteins([]);
	      setSelectedVeggies(['mushrooms', 'spinach', 'sun-dried', 'broccoli', 'peppers']);
	      setSelectedExtras([]);
	      setVeggieAmounts(regularAmounts(['mushrooms', 'spinach', 'sun-dried', 'broccoli', 'peppers']));
	      setExtraAmounts({});
	    } else {
	      setSauceAmount('REGULAR');
	      setSelectedProteins([]);
	      setSelectedVeggies([]);
	      setSelectedExtras([]);
	      setVeggieAmounts({});
	      setExtraAmounts({});
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
	    accent: 'amber' | 'red' | 'green' | 'purple',
	    showPrice = true,
	  ) => {
	    const activeClass = {
	      amber: 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm',
	      red: 'border-red-500 bg-red-50 text-red-800 shadow-sm',
	      green: 'border-green-500 bg-green-50 text-green-800 shadow-sm',
	      purple: 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm',
	    }[accent];
	    const idleClass = {
	      amber: 'border-amber-100 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50',
	      red: 'border-red-100 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/50',
	      green: 'border-green-100 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50/50',
	      purple: 'border-purple-100 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50',
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

	  const renderAmountSegment = (
	    amount: FixingAmount,
	    onAmountChange: (next: FixingAmount) => void,
	    accent: 'red' | 'green' | 'purple',
	  ) => {
	    const activeClass = {
	      red: 'bg-red-500 text-white shadow-sm',
	      green: 'bg-green-600 text-white shadow-sm',
	      purple: 'bg-purple-600 text-white shadow-sm',
	    }[accent];
	    return (
	      <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/70 p-1">
	        {FIXING_AMOUNT_OPTIONS.map((choice) => (
	          <button
	            key={choice.id}
	            type="button"
	            onClick={(event) => {
	              event.stopPropagation();
	              onAmountChange(choice.id);
	            }}
	            className={`h-8 rounded-md text-[11px] font-black transition-all ${
	              amount === choice.id ? activeClass : 'text-slate-500 hover:bg-slate-100'
	            }`}
	            aria-pressed={amount === choice.id}
	          >
	            {choice.label}
	          </button>
	        ))}
	      </div>
	    );
	  };

	  const renderFixingOption = (
	    option: { id: string; name: string; price: number },
	    selected: boolean,
	    onClick: () => void,
	    amount: FixingAmount,
	    onAmountChange: (amount: FixingAmount) => void,
	    accent: 'green' | 'purple',
	  ) => {
	    const activeClass = accent === 'green'
	      ? 'border-green-500 bg-green-50 text-green-900 shadow-sm'
	      : 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm';
	    const idleClass = accent === 'green'
	      ? 'border-green-100 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50/50'
	      : 'border-purple-100 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50';

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
	          {option.price > 0 && <span className="shrink-0 text-xs font-bold opacity-70">+${option.price.toFixed(2)}</span>}
	        </button>
	        {selected && (
	          <div className="mt-2">
	            {renderAmountSegment(amount, onAmountChange, accent)}
	          </div>
	        )}
	      </div>
	    );
	  };
	
	  return (
	    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 pt-20">
	      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl">
	        {/* Header */}
	        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-4">
	          <div>
	            <h2 className="text-2xl font-black tracking-tight text-white">Build Your Own Pasta</h2>
	            <p className="text-sm font-semibold text-white/80">Compose a bowl with pasta, sauce, protein and extras</p>
	          </div>
	          <button onClick={onCancel} className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
	            <X size={24} />
	          </button>
	        </div>
	
	        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
	          <aside className="hidden overflow-y-auto border-r border-slate-200 bg-slate-50 p-6 lg:block">
	            <PastaVisualizer
	              pastaId={pastaType.id}
	              sauceId={sauce.id}
	              proteins={selectedProteins}
	              veggies={selectedVeggies}
	              extras={selectedExtras}
	            />
	            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
	              <div className="mb-4 flex items-start justify-between gap-3">
	                <div>
	                  <h3 className="text-xl font-black text-slate-950">Your Creation</h3>
	                  <p className="text-xs font-semibold text-slate-400">Live kitchen summary</p>
	                </div>
	                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
	                  {selectedProteins.length + selectedVeggies.length + selectedExtras.length} add-ons
	                </span>
	              </div>
	              <div className="space-y-2.5">
	                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
	                  <div className="flex justify-between gap-4 text-sm">
	                    <span className="font-semibold text-slate-500">Pasta</span>
	                    <strong className="text-right text-slate-950">{pastaType.name}</strong>
	                  </div>
	                </div>
		                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
		                  <div className="flex justify-between gap-4 text-sm">
		                    <span className="font-semibold text-slate-500">Sauce</span>
		                    <strong className="text-right text-red-950">{formatFixingName(sauce.name, sauceAmount)}</strong>
		                  </div>
		                </div>
	                {renderSummaryGroup('Proteins', selectedProteinNames, 'bg-red-500', 'No protein selected')}
	                {renderSummaryGroup('Vegetables', selectedVeggieNames, 'bg-green-500', 'No vegetables selected')}
	                {renderSummaryGroup('Extras', selectedExtraNames, 'bg-purple-500', 'No extras selected')}
	              </div>
	            </div>
	          </aside>

	          <main className="overflow-y-auto bg-slate-50 p-4 lg:p-6">
	            <div className="mx-auto max-w-4xl space-y-4">
	              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-amber-100 bg-white p-2 shadow-sm sm:grid-cols-4">
	                <button type="button" onClick={() => applyPreset('classic')} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 hover:bg-amber-100">Classic</button>
	                <button type="button" onClick={() => applyPreset('creamy')} className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-orange-800 hover:bg-orange-100">Creamy</button>
	                <button type="button" onClick={() => applyPreset('garden')} className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-800 hover:bg-green-100">Garden</button>
	                <button type="button" onClick={() => applyPreset('clear')} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">Clear</button>
	              </div>

	              <section className="rounded-2xl border border-amber-100 bg-amber-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-800">Pasta</h3>
	                  <span className="text-xs font-semibold text-slate-500">Required</span>
	                </div>
	                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
	                  {PASTA_TYPES.map((p) => renderOption(p, pastaType.id === p.id, () => setPastaType(p), 'amber'))}
	                </div>
	              </section>

	              <section className="rounded-2xl border border-red-100 bg-red-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-red-800">Sauce</h3>
	                  <span className="text-xs font-semibold text-slate-500">Choose one</span>
	                </div>
		                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
		                  {SAUCES.map((s) => renderOption(s, sauce.id === s.id, () => setSauce(s), 'red'))}
		                </div>
		                <div className="mt-3 max-w-sm">
		                  {renderAmountSegment(sauceAmount, setSauceAmount, 'red')}
		                </div>
		              </section>

	              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
	                <section className="rounded-2xl border border-red-100 bg-red-50/45 p-4 shadow-sm">
	                  <div className="mb-3 flex items-center justify-between gap-3">
	                    <h3 className="text-sm font-black uppercase tracking-wider text-red-800">Proteins</h3>
	                    <span className="text-xs font-semibold text-slate-500">{selectedProteins.length} selected</span>
	                  </div>
	                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
	                    {PROTEINS.map((protein) => renderOption(
	                      protein,
	                      selectedProteins.includes(protein.id),
	                      () => toggleSelection(protein.id, selectedProteins, setSelectedProteins),
	                      'red',
	                    ))}
	                  </div>
	                </section>

	                <section className="rounded-2xl border border-purple-100 bg-purple-50/45 p-4 shadow-sm">
	                  <div className="mb-3 flex items-center justify-between gap-3">
	                    <h3 className="text-sm font-black uppercase tracking-wider text-purple-800">Extras</h3>
	                    <span className="text-xs font-semibold text-slate-500">{selectedExtras.length} selected</span>
	                  </div>
	                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
		                    {EXTRAS.map((extra) => extra.id === 'extra-cheese' ? renderFixingOption(
		                      extra,
		                      selectedExtras.includes(extra.id),
		                      () => toggleFixingSelection(extra.id, selectedExtras, setSelectedExtras, setExtraAmounts),
		                      extraAmounts[extra.id] ?? 'REGULAR',
		                      (amount) => setFixingAmount(extra.id, amount, selectedExtras, setSelectedExtras, setExtraAmounts),
		                      'purple',
		                    ) : renderOption(
		                      extra,
		                      selectedExtras.includes(extra.id),
		                      () => toggleSelection(extra.id, selectedExtras, setSelectedExtras),
		                      'purple',
		                    ))}
		                  </div>
		                </section>
	              </div>

	              <section className="rounded-2xl border border-green-100 bg-green-50/45 p-4 shadow-sm">
	                <div className="mb-3 flex items-center justify-between gap-3">
	                  <h3 className="text-sm font-black uppercase tracking-wider text-green-800">Vegetables</h3>
	                  <span className="text-xs font-semibold text-slate-500">{selectedVeggies.length} selected</span>
	                </div>
	                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
		                  {VEGGIES.map((veggie) => renderFixingOption(
		                    veggie,
		                    selectedVeggies.includes(veggie.id),
		                    () => toggleFixingSelection(veggie.id, selectedVeggies, setSelectedVeggies, setVeggieAmounts),
		                    veggieAmounts[veggie.id] ?? 'REGULAR',
		                    (amount) => setFixingAmount(veggie.id, amount, selectedVeggies, setSelectedVeggies, setVeggieAmounts),
		                    'green',
		                  ))}
	                </div>
	              </section>

	              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
	                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-500">Special Instructions</label>
	                <textarea
	                  value={notes}
	                  onChange={(e) => setNotes(e.target.value)}
	                  placeholder="Any special requests? Al dente, extra sauce, parmesan on side..."
	                  className="h-20 w-full resize-none rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
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
	                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:text-amber-700 disabled:opacity-50"
	                  disabled={quantity <= 1}
	                >
	                  <Minus size={18} />
	                </button>
	                <span className="w-8 text-center text-lg font-black text-slate-900">{quantity}</span>
	                <button 
	                  onClick={() => setQuantity(quantity + 1)}
	                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm transition-all hover:bg-amber-600"
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
	                className="flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
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

export default BuildYourOwnPasta;
