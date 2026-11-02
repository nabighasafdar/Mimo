import {budgetStatus, monthStart, sameMonth, spendable, spendingAlert, toAmount} from '../src/budget';

const money = (n: number) => `Rs ${n}`;

describe('spendable', () => {
  it('is income minus the savings goal, never below zero', () => {
    expect(spendable(50000, 10000)).toBe(40000);
    expect(spendable(50000, 0)).toBe(50000);
    expect(spendable(1000, 5000)).toBe(0);
  });
});

describe('budgetStatus', () => {
  it('moves from ok to warn at 80%, and to over past the limit', () => {
    expect(budgetStatus(799, 1000).level).toBe('ok');
    expect(budgetStatus(800, 1000).level).toBe('warn');
    expect(budgetStatus(1000, 1000).level).toBe('warn');
    expect(budgetStatus(1001, 1000).level).toBe('over');
  });

  it('turns off with no limit', () => {
    expect(budgetStatus(500, 0)).toEqual({pct: 0, level: 'none'});
  });
});

describe('spendingAlert', () => {
  it('warns once when spending crosses 80%', () => {
    expect(spendingAlert(700, 150, 1000, 200, money)).toContain('85%');
    expect(spendingAlert(850, 10, 1000, 200, money)).toBeNull();
  });

  it('says how much came out of savings when the budget is passed', () => {
    expect(spendingAlert(900, 200, 1000, 500, money)).toContain("you'd save Rs 400");
  });

  it('never claims more savings were lost than the goal', () => {
    expect(spendingAlert(900, 5000, 1000, 500, money)).toContain("you'd save Rs 0");
  });

  it('stays quiet under 80% and when there is no budget', () => {
    expect(spendingAlert(100, 100, 1000, 0, money)).toBeNull();
    expect(spendingAlert(100, 100, 0, 0, money)).toBeNull();
  });
});

describe('months', () => {
  it('compares calendar months', () => {
    const november = new Date(2026, 10, 15);
    expect(sameMonth(new Date(2026, 10, 1, 0, 1).toISOString(), november)).toBe(true);
    expect(sameMonth(new Date(2026, 9, 31, 23, 59).toISOString(), november)).toBe(false);
    expect(sameMonth(new Date(2025, 10, 15).toISOString(), november)).toBe(false);
  });

  it('steps across a year boundary', () => {
    expect(monthStart(-1, new Date(2026, 0, 31))).toEqual(new Date(2025, 11, 1));
  });
});

describe('toAmount', () => {
  it('reads commas and cents', () => {
    expect(toAmount('1,250.50')).toBe(1250.5);
  });

  it('gives 0 for anything that is not a positive number', () => {
    expect(toAmount('')).toBe(0);
    expect(toAmount('abc')).toBe(0);
    expect(toAmount('-5')).toBe(0);
  });
});
