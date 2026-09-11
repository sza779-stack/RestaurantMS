export type PizzaToppingSide = 'LEFT' | 'RIGHT';

export interface ToppingSideSelection {
  left: boolean;
  right: boolean;
}

export type PizzaToppingSelection = Record<string, ToppingSideSelection>;

export interface NormalizedPizzaToppings {
  left: string[];
  whole: string[];
  right: string[];
}

export interface ComboPricingLine {
  priceAdjustment?: number | string | null;
}

export interface ComboPricingInput {
  basePrice?: number | string | null;
  lines?: ComboPricingLine[];
}

export interface ComboPricingResult {
  basePrice: number;
  adjustmentsTotal: number;
  total: number;
}

const emptySelection = (): ToppingSideSelection => ({ left: false, right: false });

const pruneToppingSelection = (selection: PizzaToppingSelection): PizzaToppingSelection =>
  Object.fromEntries(
    Object.entries(selection).filter(([, sides]) => sides.left || sides.right),
  );

export const toggleToppingSide = (
  selection: PizzaToppingSelection,
  toppingId: string,
  side: PizzaToppingSide,
): PizzaToppingSelection => {
  const current = selection[toppingId] || emptySelection();
  const nextSides = {
    ...current,
    [side === 'LEFT' ? 'left' : 'right']: !current[side === 'LEFT' ? 'left' : 'right'],
  };
  return pruneToppingSelection({ ...selection, [toppingId]: nextSides });
};

export const toggleWholeTopping = (
  selection: PizzaToppingSelection,
  toppingId: string,
): PizzaToppingSelection => {
  const current = selection[toppingId] || emptySelection();
  const isWhole = current.left && current.right;
  return pruneToppingSelection({
    ...selection,
    [toppingId]: isWhole ? emptySelection() : { left: true, right: true },
  });
};

export const removeTopping = (
  selection: PizzaToppingSelection,
  toppingId: string,
): PizzaToppingSelection => {
  const next = { ...selection };
  delete next[toppingId];
  return next;
};

export const clearToppings = (): PizzaToppingSelection => ({});

export const normalizePizzaToppings = (
  selection: PizzaToppingSelection,
): NormalizedPizzaToppings => {
  const normalized: NormalizedPizzaToppings = { left: [], whole: [], right: [] };
  Object.entries(selection).forEach(([id, sides]) => {
    if (sides.left && sides.right) normalized.whole.push(id);
    else if (sides.left) normalized.left.push(id);
    else if (sides.right) normalized.right.push(id);
  });
  return normalized;
};

export const getSelectedToppingIds = (selection: PizzaToppingSelection): string[] =>
  Object.keys(selection).filter((id) => selection[id].left || selection[id].right);

export const selectionFromLegacySides = (
  sides: Record<string, 'LEFT' | 'RIGHT' | 'FULL' | ToppingSideSelection | undefined>,
): PizzaToppingSelection => {
  const next: PizzaToppingSelection = {};
  Object.entries(sides || {}).forEach(([id, value]) => {
    if (!value) return;
    if (typeof value === 'object') {
      next[id] = { left: !!value.left, right: !!value.right };
    } else if (value === 'FULL') {
      next[id] = { left: true, right: true };
    } else {
      next[id] = { left: value === 'LEFT', right: value === 'RIGHT' };
    }
  });
  return pruneToppingSelection(next);
};

export const calculateComboPrice = (input: ComboPricingInput): ComboPricingResult => {
  const basePrice = Number(input.basePrice || 0);
  const adjustmentsTotal = (input.lines || []).reduce(
    (sum, line) => sum + Number(line.priceAdjustment || 0),
    0,
  );
  return {
    basePrice,
    adjustmentsTotal,
    total: basePrice + adjustmentsTotal,
  };
};
