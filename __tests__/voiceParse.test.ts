import {formatAmount, parseAmount, parseExpenses} from '../src/voiceParse';

describe('parseAmount', () => {
  it.each([
    ['500', 500],
    ['1,250', 1250],
    ['5k', 5000],
    ['five hundred', 500],
    ['two thousand five hundred', 2500],
    ['one lakh', 100000],
  ])('reads %s', (text, value) => {
    expect(parseAmount(text)).toBe(value);
  });

  it('refuses text with no amount, and zero', () => {
    expect(parseAmount('lunch')).toBeNull();
    expect(parseAmount('0')).toBeNull();
  });
});

describe('formatAmount', () => {
  it('adds thousands separators', () => {
    expect(formatAmount(1250000)).toBe('1,250,000');
    expect(formatAmount(999)).toBe('999');
  });
});

describe('parseExpenses', () => {
  it('splits two expenses and sorts them by keyword', () => {
    const items = parseExpenses('450 on lunch and 200 for rickshaw');
    expect(items.map(i => i.amount)).toEqual([450, 200]);
    expect(items.map(i => i.category)).toEqual(['Food', 'Transport']);
  });

  it('finds nothing when no amount was said', () => {
    expect(parseExpenses('I bought some lunch')).toEqual([]);
  });
});
