import { describe, expect, it } from 'vitest';
import { makeTranslator } from './translate';
import { TRANSLATIONS } from './translations';

const keysOf = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

describe('translations', () => {
  it('have the same keys in every language', () => {
    const english = keysOf(TRANSLATIONS.en).sort();
    expect(keysOf(TRANSLATIONS.de).sort()).toEqual(english);
    expect(keysOf(TRANSLATIONS.ro).sort()).toEqual(english);
  });

  it('fill in placeholders', () => {
    expect(makeTranslator('de')('common.from', { price: '72.400 €' })).toBe('ab 72.400 €');
  });

  it('fall back to English, then to the key', () => {
    expect(makeTranslator('xx')('nav.garage')).toBe('Garage');
    expect(makeTranslator('ro')('does.not.exist')).toBe('does.not.exist');
  });
});
