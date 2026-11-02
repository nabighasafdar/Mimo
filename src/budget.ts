/** Spending counts as "nearly used up" from this share of what's left after saving. */
export const WARN_AT = 0.8;

/** Savings goals offered as one-tap choices, as shares of monthly income. */
export const SAVE_SHARES = [0.1, 0.2, 0.3];

/**
 * What the user can spend each month: income minus the savings goal. With no goal it is the
 * whole income; with no income it is 0, which turns the budget checks off.
 */
export const spendable = (income: number, savingsGoal: number) => Math.max(0, income - savingsGoal);

export type Level = 'none' | 'ok' | 'warn' | 'over';

/** How far through its limit a category is. `pct` is uncapped (120 = 20% over). */
export function budgetStatus(spent: number, limit: number): {pct: number; level: Level} {
  if (limit <= 0) {
    return {pct: 0, level: 'none'};
  }
  const pct = Math.round((spent / limit) * 100);
  return {pct, level: spent > limit ? 'over' : spent >= limit * WARN_AT ? 'warn' : 'ok'};
}

/** Text colours per level (readable on cream). */
export const LEVEL_COLOR: Record<Level, string> = {
  none: '#735A49',
  ok: '#4F5A3A',
  warn: '#7A4F12',
  over: '#9A3524',
};

/** Progress-bar fills per level. */
export const LEVEL_BAR: Record<Level, string> = {
  none: '#9E5539',
  ok: '#9E5539',
  warn: '#C48A2E',
  over: '#B0412E',
};

/** Pill backgrounds per level. */
export const LEVEL_BG: Record<Level, string> = {
  none: 'rgba(122,78,40,0.1)',
  ok: 'rgba(111,122,85,0.18)',
  warn: 'rgba(196,138,46,0.2)',
  over: 'rgba(176,65,46,0.16)',
};

/**
 * A warning when new spending pushes the month past 80% of what the user can spend, or past
 * it (which eats into their savings). Quiet if the month was already past that point.
 */
export function spendingAlert(
  spentBefore: number,
  added: number,
  allowance: number,
  savingsGoal: number,
  money: (n: number) => string,
): string | null {
  const before = budgetStatus(spentBefore, allowance).level;
  const after = spentBefore + added;
  const now = budgetStatus(after, allowance);
  if (now.level === 'over' && before !== 'over') {
    const eaten = Math.min(after - allowance, savingsGoal);
    return savingsGoal > 0
      ? `You've spent ${money(after - allowance)} more than planned this month. That comes out of your ${money(savingsGoal)} savings, so you'd save ${money(savingsGoal - eaten)}.`
      : `You've spent ${money(after - allowance)} more than your income this month.`;
  }
  if (now.level === 'warn' && before === 'ok') {
    return `You've used ${now.pct}% of this month's spending money. ${money(allowance - after)} left before it eats into your savings.`;
  }
  return null;
}

// ---- months -----------------------------------------------------------------

export const sameMonth = (iso: string, month: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
};

/** The first day of the month `offset` months from now (0 = this month, -1 = last). */
export function monthStart(offset = 0, from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + offset, 1);
}

export const monthName = (d: Date) => d.toLocaleDateString('en-GB', {month: 'long'});
export const monthShort = (d: Date) => d.toLocaleDateString('en-GB', {month: 'short'});
export const monthYear = (d: Date) =>
  d.toLocaleDateString('en-GB', {month: 'short', year: 'numeric'});
