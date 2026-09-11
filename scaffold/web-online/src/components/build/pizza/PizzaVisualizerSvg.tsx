import React, { useId } from 'react';
import type { ToppingSelection } from './types';

// ---------------------------------------------------------------------------
// SVG pizza preview: toppings are placed only on the requested half (LEFT /
// RIGHT / FULL) via polar sampling — whole glyphs, no vertical “cookie cutter”.
// ---------------------------------------------------------------------------

const CRUST_FILL: Record<string, string> = {
  'hand-tossed': '#d4a574',
  'thin-crust': '#c99860',
  pan: '#deb887',
  stuffed: '#e8d4b8',
  'gluten-free': '#cfa882',
};

const SAUCE_FILL: Record<string, string> = {
  tomato: '#c43326',
  bbq: '#5c2d18',
  alfredo: '#f3ead8',
  pesto: '#3d6b3a',
  buffalo: '#d9683d',
};

const CHEESE_OVERLAY: Record<string, string> = {
  mozzarella: 'rgba(255, 236, 190, 0.55)',
  'extra-mozzarella': 'rgba(255, 236, 190, 0.78)',
  cheddar: 'rgba(255, 193, 94, 0.55)',
  'four-cheese': 'rgba(255, 214, 140, 0.62)',
};

const TOPPING_PALETTE: Record<string, { fill: string; stroke?: string }> = {
  pepperoni: { fill: '#b91c1c', stroke: '#7f1d1d' },
  sausage: { fill: '#8b4513', stroke: '#5c2e0d' },
  bacon: { fill: '#d97777', stroke: '#9f2d2d' },
  ham: { fill: '#e89aab', stroke: '#b84d62' },
  chicken: { fill: '#eab676', stroke: '#b8732f' },
  beef: { fill: '#6b3e26', stroke: '#3e2316' },
  mushrooms: { fill: '#a0826d', stroke: '#6d5340' },
  onions: { fill: '#f3e8ff', stroke: '#c4b5fd' },
  peppers: { fill: '#22c55e', stroke: '#15803d' },
  olives: { fill: '#1e293b', stroke: '#0f172a' },
  tomatoes: { fill: '#ef4444', stroke: '#b91c1c' },
  spinach: { fill: '#15803d', stroke: '#14532d' },
  pineapple: { fill: '#facc15', stroke: '#ca8a04' },
  jalapenos: { fill: '#4d7c0f', stroke: '#365314' },
};

export interface PizzaVisualizerSvgProps {
  toppings: ToppingSelection[];
  activeToppingId: string | null;
  onPizzaTap: (side: 'LEFT' | 'RIGHT') => void;
  crustId: string;
  sauceId: string;
  cheeseId: string;
}

export const PizzaVisualizerSvg: React.FC<PizzaVisualizerSvgProps> = ({
  toppings,
  activeToppingId,
  onPizzaTap,
  crustId,
  sauceId,
  cheeseId,
}) => {
  const uid = useId().replace(/:/g, '');
  const crust = CRUST_FILL[crustId] ?? CRUST_FILL['hand-tossed'];
  const sauce = SAUCE_FILL[sauceId] ?? SAUCE_FILL.tomato;
  const cheeseLayer = CHEESE_OVERLAY[cheeseId] ?? CHEESE_OVERLAY.mozzarella;

  const isThin = crustId === 'thin-crust';
  const isPan = crustId === 'pan';
  const isStuffed = crustId === 'stuffed';

  const innerR = isThin ? 158 : isPan ? 148 : 154;
  const sauceR = innerR - (isStuffed ? 8 : 4);

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto mb-8">
      <div className="rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-white/10 ring-4 ring-orange-500/20 bg-[#1e293b]">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-auto block"
          role="img"
          aria-label="Live preview of your pizza"
        >
          <defs>
            <radialGradient id={`pg-${uid}-crust`} cx="42%" cy="38%" r="72%">
              <stop offset="0%" stopColor={shade(crust, 0.22)} />
              <stop offset="38%" stopColor={shade(crust, 0.06)} />
              <stop offset="62%" stopColor={crust} />
              <stop offset="88%" stopColor={shade(crust, -0.14)} />
              <stop offset="100%" stopColor={shade(crust, -0.28)} />
            </radialGradient>
            <radialGradient id={`pg-${uid}-sauce`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor={shadeColor(sauce, 0.12)} />
              <stop offset="100%" stopColor={sauce} />
            </radialGradient>
            {/* Subtle fractal displacement — reads as uneven baked dough (visible in crust ring). */}
            <filter
              id={`pg-${uid}-crustRough`}
              x="-35%"
              y="-35%"
              width="170%"
              height="170%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={isThin ? '0.055' : isPan ? '0.038' : '0.048'}
                numOctaves={isPan ? 7 : 6}
                seed="23"
                result="crustNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="crustNoise"
                scale={isThin ? 3 : isPan ? 7 : 5}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <mask id={`pg-${uid}-crustSpeckleMask`}>
              <rect width="400" height="400" fill="black" />
              <circle cx="200" cy="200" r="182" fill="white" />
              <circle cx="200" cy="200" r={Math.max(innerR - 1, 125)} fill="black" />
            </mask>
            <clipPath id={`pg-${uid}-face`}>
              <circle cx="200" cy="200" r={sauceR} />
            </clipPath>
          </defs>

          <ellipse cx="200" cy="364" rx="150" ry="14" fill="rgba(0,0,0,0.2)" />

          <circle
            cx="200"
            cy="200"
            r="182"
            fill={`url(#pg-${uid}-crust)`}
            filter={`url(#pg-${uid}-crustRough)`}
          />

          <g mask={`url(#pg-${uid}-crustSpeckleMask)`}>
            {crustSpeckles(uid, crust, innerR, 182)}
          </g>

          {/* Outer rim: toasted edge + soft highlight */}
          <circle
            cx="200"
            cy="200"
            r="181.5"
            fill="none"
            stroke={shade(crust, -0.38)}
            strokeWidth="2.5"
            opacity="0.55"
          />
          <circle
            cx="200"
            cy="200"
            r="179"
            fill="none"
            stroke="rgba(255,248,235,0.45)"
            strokeWidth="1.25"
            opacity="0.7"
          />

          {isStuffed && (
            <circle cx="200" cy="200" r="176" fill="none" stroke="#fef3c7" strokeWidth="10" opacity="0.9" />
          )}
          {isPan && (
            <circle cx="200" cy="200" r="188" fill="none" stroke={shade(crust, -0.35)} strokeWidth="16" />
          )}

          <circle cx="200" cy="200" r={innerR} fill={`url(#pg-${uid}-sauce)`} />
          <circle cx="200" cy="200" r={sauceR - 2} fill={cheeseLayer} className="transition-all duration-300" />

          {Array.from({ length: 28 }).map((_, i) => {
            const bu = unit01(hash(`${uid}-bubble-a-${i}`));
            const bv = unit01(hash(`${uid}-bubble-r-${i}`));
            const angle = ((i + bu * 0.92) / 28) * Math.PI * 2;
            const bubbleMin = 14;
            const bubbleMax = Math.max(bubbleMin + 10, sauceR - 32);
            const rr = radiusAreaUniform(bv, bubbleMin, bubbleMax);
            const cx = 200 + Math.cos(angle) * rr;
            const cy = 200 + Math.sin(angle) * rr;
            return (
              <circle
                key={`bubble-${i}`}
                cx={cx}
                cy={cy}
                r={1.5 + (i % 3)}
                fill="rgba(255,255,255,0.35)"
              />
            );
          })}

          <g clipPath={`url(#pg-${uid}-face)`}>
            {toppings.map((t) => (
              <g key={t.id}>{renderToppingShapes(t.id, t.side, sauceR, t.amount)}</g>
            ))}
          </g>

          <circle
            cx="200"
            cy="200"
            r={innerR}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="4"
          />
        </svg>

        <div className="absolute inset-0 flex z-10 rounded-full">
          <button
            type="button"
            className="flex-1 hover:bg-orange-500/20 transition-colors cursor-pointer bg-transparent border-none"
            onClick={() => onPizzaTap('LEFT')}
            aria-label="Adjust topping on left half"
            title={
              activeToppingId
                ? 'Tap to toggle active topping on left half'
                : 'Select a topping first to add to pizza'
            }
          />
          <button
            type="button"
            className="flex-1 hover:bg-orange-500/20 transition-colors cursor-pointer bg-transparent border-none"
            onClick={() => onPizzaTap('RIGHT')}
            aria-label="Adjust topping on right half"
            title={
              activeToppingId
                ? 'Tap to toggle active topping on right half'
                : 'Select a topping first to add to pizza'
            }
          />
        </div>
      </div>

      <p className="mt-2 text-center text-xs font-medium text-gray-500">
        Live preview · tap pizza halves after selecting a topping
      </p>
    </div>
  );
};

/** Breadcrumbs, air bubbles, and darker bake spots — masked to crust ring only. */
function crustSpeckles(uid: string, crustColor: string, innerR: number, outerR: number): React.ReactNode {
  const ringPad = 5;
  const rMin = innerR + ringPad;
  const rMax = outerR - ringPad;
  if (rMax <= rMin) return null;

  const nodes: React.ReactNode[] = [];
  const count = 108;

  for (let i = 0; i < count; i++) {
    const seed = hash(`${uid}-cs-${i}`);
    const u = unit01(seed);
    const v = unit01(seed ^ 0x5eedface);
    const angle = u * Math.PI * 2;
    const rad = rMin + v * (rMax - rMin);
    const cx = 200 + Math.cos(angle) * rad;
    const cy = 200 + Math.sin(angle) * rad;

    const bigBlister = i % 13 === 0;
    const cornmeal = unit01(seed ^ 0xc001d00d) > 0.82;

    let rx: number;
    let ry: number;
    let fill: string;
    let opacity: number;

    if (bigBlister) {
      rx = 4 + unit01(seed >> 8) * 4;
      ry = 3 + unit01(seed >> 12) * 3.5;
      fill = shade(crustColor, -0.18 - unit01(seed >> 4) * 0.12);
      opacity = 0.35 + unit01(seed >> 16) * 0.25;
    } else if (cornmeal) {
      rx = 1.1 + unit01(seed >> 8) * 1.4;
      ry = rx * (0.75 + unit01(seed >> 10) * 0.35);
      fill = shade('#fff8ed', -unit01(seed >> 6) * 0.08);
      opacity = 0.35 + unit01(seed >> 14) * 0.4;
    } else {
      rx = 1.3 + unit01(seed >> 8) * 2.9;
      ry = 1.1 + unit01(seed >> 12) * 2.4;
      const lighten = unit01(seed ^ 0xabad1dea) > 0.5;
      fill = lighten
        ? shade(crustColor, 0.08 + unit01(seed >> 4) * 0.14)
        : shade(crustColor, -0.1 - unit01(seed >> 20) * 0.16);
      opacity = 0.22 + unit01(seed >> 24) * 0.48;
    }

    const rot = seed % 360;
    nodes.push(
      <ellipse
        key={`speck-${i}`}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        opacity={opacity}
        transform={`rotate(${rot} ${cx} ${cy})`}
      />,
    );
  }

  return <>{nodes}</>;
}

/** Keep glyph centers this far from x = 200 so wide pieces don’t straddle halves. */
const HALF_INSET = 22;

/** Smallest / largest distance from center (px) for topping centers — tuned so glyphs stay inside cheese. */
function radialBounds(sauceR: number): { minD: number; maxD: number } {
  const glyphClearance = 24;
  const minD = 18;
  const maxD = Math.max(minD + 12, sauceR - glyphClearance);
  return { minD, maxD };
}

/** Uniform random in [0, 1) from integer seed (deterministic per placement). */
function unit01(seed: number): number {
  const x = hash(String(seed ^ 0x51ceface));
  return (x % 1_000_000) / 1_000_000;
}

/**
 * Radius uniform over annulus by area: P(r < R) ∝ R² on [rMin, rMax].
 * Avoids linear‑in‑r sampling which piles mass toward the inner radii.
 */
function radiusAreaUniform(u: number, rMin: number, rMax: number): number {
  const lo = rMin * rMin;
  const hi = rMax * rMax;
  return Math.sqrt(u * (hi - lo) + lo);
}

function renderToppingShapes(
  id: string,
  side: 'LEFT' | 'RIGHT' | 'FULL',
  sauceR: number,
  amount: ToppingSelection['amount'] = 'REGULAR',
): React.ReactNode {
  const pal = TOPPING_PALETTE[id];
  if (!pal) return null;

  const baseTarget = side === 'FULL' ? 14 : 11;
  const target = amount === 'LIGHT' ? Math.max(6, Math.round(baseTarget * 0.65)) : amount === 'EXTRA' ? Math.round(baseTarget * 1.35) : baseTarget;
  const { minD, maxD } = radialBounds(sauceR);
  const nodes: React.ReactNode[] = [];
  let attempts = 0;

  while (nodes.length < target && attempts < 800) {
    attempts++;
    const k = nodes.length;
    const seed = hash(`${id}-${side}-${k}-${attempts}`);
    const uA = unit01(seed);
    const uR = unit01(seed ^ 0xbea57000);

    const angle =
      stratifiedAngle(side, k, target, uA) +
      (unit01(seed ^ 0xc0ffee) - 0.5) * sectorAngularWidth(side, target) * 0.65;
    const dist = radiusAreaUniform(uR, minD, maxD);
    const cx = 200 + Math.cos(angle) * dist;
    const cy = 200 + Math.sin(angle) * dist;

    if (!insideCheeseFace(cx, cy, sauceR)) continue;
    if (side === 'LEFT' && cx > 200 - HALF_INSET) continue;
    if (side === 'RIGHT' && cx < 200 + HALF_INSET) continue;

    const rot = (seed >> 4) % 360;
    nodes.push(
      <g
        key={`${id}-${nodes.length}`}
        transform={`translate(${cx} ${cy}) rotate(${rot})`}
        className="transition-all duration-300 ease-out"
      >
        {toppingGlyph(id, pal)}
      </g>,
    );
  }

  return <>{nodes}</>;
}

/** One slot per angular sector + jitter so toppings wrap the pie instead of clumping. */
function stratifiedAngle(
  side: 'LEFT' | 'RIGHT' | 'FULL',
  sectorIndex: number,
  sectors: number,
  uJitter: number,
): number {
  const edge = 0.12;
  const jitterWidth = 0.92;

  if (side === 'FULL') {
    const slot = (sectorIndex + uJitter * jitterWidth) / sectors;
    return slot * Math.PI * 2;
  }

  const width = Math.PI - 2 * edge;

  if (side === 'LEFT') {
    const slot = (sectorIndex + uJitter * jitterWidth) / sectors;
    return Math.PI / 2 + edge + slot * width;
  }

  const slot = (sectorIndex + uJitter * jitterWidth) / sectors;
  return -Math.PI / 2 + edge + slot * width;
}

/** Angular width of one stratification slot (used to jitter within the slice). */
function sectorAngularWidth(side: 'LEFT' | 'RIGHT' | 'FULL', sectors: number): number {
  const edge = 0.12;
  if (side === 'FULL') return (Math.PI * 2) / sectors;
  return (Math.PI - 2 * edge) / sectors;
}

function insideCheeseFace(cx: number, cy: number, sauceR: number): boolean {
  const dx = cx - 200;
  const dy = cy - 200;
  const margin = 10;
  return dx * dx + dy * dy <= (sauceR - margin) ** 2;
}

function toppingGlyph(id: string, pal: { fill: string; stroke?: string }): React.ReactNode {
  const s = pal.stroke ?? shade(pal.fill, -0.25);

  switch (id) {
    case 'pepperoni':
      return (
        <>
          <circle r="14" fill={pal.fill} stroke={s} strokeWidth="1.2" />
          <circle r="5" fill="rgba(0,0,0,0.12)" cx="-2" cy="-2" />
        </>
      );
    case 'sausage':
      return <ellipse rx="16" ry="10" fill={pal.fill} stroke={s} strokeWidth="1" />;
    case 'bacon':
      return (
        <rect
          x="-18"
          y="-6"
          width="36"
          height="12"
          rx="3"
          fill={pal.fill}
          stroke={s}
          strokeWidth="0.8"
          opacity="0.95"
        />
      );
    case 'ham':
      return <rect x="-14" y="-10" width="28" height="20" rx="6" fill={pal.fill} stroke={s} strokeWidth="1" />;
    case 'chicken':
      return <path d="M -14 -8 L 14 -8 L 10 10 L -10 10 Z" fill={pal.fill} stroke={s} strokeWidth="1" />;
    case 'beef':
      return (
        <>
          <circle cx="-4" cy="-2" r="4" fill={pal.fill} />
          <circle cx="6" cy="3" r="3.5" fill={pal.fill} />
          <circle cx="-2" cy="6" r="3" fill={pal.fill} />
        </>
      );
    case 'mushrooms':
      return (
        <>
          <ellipse cx="0" cy="-4" rx="12" ry="8" fill={pal.fill} stroke={s} strokeWidth="0.8" />
          <rect x="-4" y="-2" width="8" height="10" rx="1" fill={shade(pal.fill, 0.15)} />
        </>
      );
    case 'onions':
      return (
        <>
          <circle r="12" fill="none" stroke="#ddd6fe" strokeWidth="3" />
          <circle r="7" fill="none" stroke="#c4b5fd" strokeWidth="2" />
        </>
      );
    case 'peppers':
      return <ellipse rx="14" ry="9" fill={pal.fill} stroke={s} strokeWidth="1.2" />;
    case 'olives':
      return (
        <>
          <circle r="10" fill={pal.fill} stroke={s} strokeWidth="1" />
          <circle r="3.5" fill="#f8fafc" opacity="0.85" />
        </>
      );
    case 'tomatoes':
      return (
        <path
          d="M 0 -12 L 11 8 L -11 8 Z"
          fill={pal.fill}
          stroke={s}
          strokeWidth="1"
          opacity="0.92"
        />
      );
    case 'spinach':
      return <ellipse rx="16" ry="7" fill={pal.fill} stroke={s} strokeWidth="0.8" opacity="0.9" />;
    case 'pineapple':
      return (
        <path d="M -10 -10 L 12 0 L -10 10 Z" fill={pal.fill} stroke={s} strokeWidth="1" opacity="0.95" />
      );
    case 'jalapenos':
      return <ellipse rx="8" ry="14" fill={pal.fill} stroke={s} strokeWidth="1" />;
    default:
      return <circle r="8" fill={pal.fill} />;
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adj = (c: number) => {
    const n = Math.round(c + (amount >= 0 ? (255 - c) * amount : c * amount));
    return Math.max(0, Math.min(255, n));
  };
  const to = (c: number) => c.toString(16).padStart(2, '0');
  return `#${to(adj(r))}${to(adj(g))}${to(adj(b))}`;
}

function shadeColor(input: string, amount: number): string {
  if (/^#[0-9a-f]{6}$/i.test(input)) return shade(input, amount);
  return input;
}
