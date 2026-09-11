import { describe, expect, it } from 'vitest';
import {
  calculateComboPrice,
  clearToppings,
  getSelectedToppingIds,
  normalizePizzaToppings,
  removeTopping,
  toggleToppingSide,
  toggleWholeTopping,
} from './comboLogic';

describe('combo pizza topping logic', () => {
  it('selects a topping on the left half', () => {
    const selection = toggleToppingSide({}, 'green-peppers', 'LEFT');

    expect(selection['green-peppers']).toEqual({ left: true, right: false });
    expect(normalizePizzaToppings(selection)).toEqual({
      left: ['green-peppers'],
      whole: [],
      right: [],
    });
  });

  it('selects a topping on the right half', () => {
    const selection = toggleToppingSide({}, 'mushrooms', 'RIGHT');

    expect(selection['mushrooms']).toEqual({ left: false, right: true });
    expect(normalizePizzaToppings(selection).right).toEqual(['mushrooms']);
  });

  it('selects a topping for the whole pizza from the topping name', () => {
    const selection = toggleWholeTopping({}, 'onions');

    expect(selection['onions']).toEqual({ left: true, right: true });
    expect(normalizePizzaToppings(selection)).toEqual({
      left: [],
      whole: ['onions'],
      right: [],
    });
  });

  it('changes whole to right-only when left is clicked', () => {
    const whole = toggleWholeTopping({}, 'pepperoni');
    const selection = toggleToppingSide(whole, 'pepperoni', 'LEFT');

    expect(normalizePizzaToppings(selection)).toEqual({
      left: [],
      whole: [],
      right: ['pepperoni'],
    });
  });

  it('changes whole to left-only when right is clicked', () => {
    const whole = toggleWholeTopping({}, 'green-peppers');
    const selection = toggleToppingSide(whole, 'green-peppers', 'RIGHT');

    expect(normalizePizzaToppings(selection)).toEqual({
      left: ['green-peppers'],
      whole: [],
      right: [],
    });
  });

  it('removes the last selected side from the selection map', () => {
    const left = toggleToppingSide({}, 'banana-peppers', 'LEFT');
    const selection = toggleToppingSide(left, 'banana-peppers', 'LEFT');

    expect(selection).toEqual({});
    expect(getSelectedToppingIds(selection)).toEqual([]);
  });

  it('normalizes mixed left, whole, and right selections without duplicates', () => {
    const selection = {
      pepperoni: { left: true, right: false },
      onions: { left: true, right: true },
      mushrooms: { left: false, right: true },
    };

    expect(normalizePizzaToppings(selection)).toEqual({
      left: ['pepperoni'],
      whole: ['onions'],
      right: ['mushrooms'],
    });
  });

  it('removes toppings and clears all toppings', () => {
    const selection = toggleWholeTopping({}, 'black-olives');

    expect(removeTopping(selection, 'black-olives')).toEqual({});
    expect(clearToppings()).toEqual({});
  });
});

describe('combo price calculation', () => {
  it('updates for premium crusts or paid options', () => {
    expect(
      calculateComboPrice({
        basePrice: '24.99',
        lines: [{ priceAdjustment: 3 }, { priceAdjustment: '1.50' }],
      }),
    ).toEqual({
      basePrice: 24.99,
      adjustmentsTotal: 4.5,
      total: 29.49,
    });
  });
});
