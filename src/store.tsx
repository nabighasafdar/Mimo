import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {sameMonth, spendable} from './budget';
import {CategoryKey} from './categories';
import {
  clearOldLocalData,
  ExpenseRow,
  GoalRow,
  insertExpenses,
  insertGoal,
  patchGoal,
  removeGoal,
  loadAll,
  patchExpense,
  ProfileRow,
  removeExpense,
  saveSavingsGoal,
  saveProfile,
} from './db';
import {supabase} from './supabase';
import {formatAmount} from './voiceParse';

export type Currency = {sym: string; code: string; name: string};

export const CURRENCIES: Currency[] = [
  {sym: 'Rs', code: 'PKR', name: 'Pakistani Rupee'},
  {sym: '$', code: 'USD', name: 'US Dollar'},
  {sym: '€', code: 'EUR', name: 'Euro'},
  {sym: '£', code: 'GBP', name: 'British Pound'},
  {sym: 'DH', code: 'AED', name: 'UAE Dirham'},
  {sym: 'SR', code: 'SAR', name: 'Saudi Riyal'},
  {sym: '₹', code: 'INR', name: 'Indian Rupee'},
  {sym: '৳', code: 'BDT', name: 'Bangladeshi Taka'},
  {sym: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee'},
  {sym: 'Rs', code: 'NPR', name: 'Nepalese Rupee'},
  {sym: 'C$', code: 'CAD', name: 'Canadian Dollar'},
  {sym: 'A$', code: 'AUD', name: 'Australian Dollar'},
  {sym: 'NZ$', code: 'NZD', name: 'New Zealand Dollar'},
  {sym: 'CHF', code: 'CHF', name: 'Swiss Franc'},
  {sym: '¥', code: 'JPY', name: 'Japanese Yen'},
  {sym: '¥', code: 'CNY', name: 'Chinese Yuan'},
  {sym: '₩', code: 'KRW', name: 'South Korean Won'},
  {sym: 'S$', code: 'SGD', name: 'Singapore Dollar'},
  {sym: 'RM', code: 'MYR', name: 'Malaysian Ringgit'},
  {sym: 'Rp', code: 'IDR', name: 'Indonesian Rupiah'},
  {sym: '฿', code: 'THB', name: 'Thai Baht'},
  {sym: 'QR', code: 'QAR', name: 'Qatari Riyal'},
  {sym: 'KD', code: 'KWD', name: 'Kuwaiti Dinar'},
  {sym: 'BD', code: 'BHD', name: 'Bahraini Dinar'},
  {sym: 'OMR', code: 'OMR', name: 'Omani Rial'},
  {sym: '₺', code: 'TRY', name: 'Turkish Lira'},
  {sym: 'E£', code: 'EGP', name: 'Egyptian Pound'},
  {sym: 'R', code: 'ZAR', name: 'South African Rand'},
  {sym: '₦', code: 'NGN', name: 'Nigerian Naira'},
  {sym: 'KSh', code: 'KES', name: 'Kenyan Shilling'},
  {sym: 'R$', code: 'BRL', name: 'Brazilian Real'},
  {sym: 'Mex$', code: 'MXN', name: 'Mexican Peso'},
  {sym: '₽', code: 'RUB', name: 'Russian Ruble'},
  {sym: 'kr', code: 'SEK', name: 'Swedish Krona'},
];

export type Expense = {
  id: string;
  category: CategoryKey;
  amount: number;
  note: string;
  /** When the money was spent (ISO 8601). Defaults to now. */
  date: string;
  /** What the user said, kept for debugging the parser. */
  rawTranscript?: string;
};

/** What callers pass to addExpenses; `id` and `date` are filled in. */
export type NewExpense = Omit<Expense, 'id' | 'date'> & {date?: string};

export type GoalKind = 'phone' | 'gift' | 'shield' | 'target';
export type Goal = {
  id: string;
  title: string;
  saved: number;
  target: number;
  due: string;
  kind: GoalKind;
};

type Profile = {
  name: string;
  email: string;
  age: number;
  incomeType: string;
  amount: string;
  currency: Currency;
};

const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  age: 21,
  incomeType: 'salary',
  amount: '50,000',
  currency: CURRENCIES[0],
};

/** Per-phone settings from Me → Preferences. */
export type Prefs = {
  /** Warn when spending nears or passes what the user can spend. */
  savingsAlerts: boolean;
  /** Show Mimo's tip on Stats. */
  tips: boolean;
};

const DEFAULT_PREFS: Prefs = {savingsAlerts: true, tips: true};
const PREFS_KEY = 'mimo:prefs';

type Store = {
  profile: Profile;
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  /** When the account was created (ISO 8601); null until loaded. */
  memberSince: string | null;
  setProfile: (patch: Partial<Profile>) => void;
  /** Monthly income the user entered. */
  income: number;
  /** How much the user wants to save each month (0 = not set). */
  savingsGoal: number;
  /** Saves a new savings goal. Resolves false if it could not be saved. */
  setSavingsGoal: (amount: number) => Promise<boolean>;
  /** What the user can spend each month: income minus the savings goal. */
  budget: number;
  /** Money logged this month. */
  spent: number;
  /** The current day. Changes at midnight, so month totals roll over on their own. */
  today: Date;
  /** Every saved expense, oldest first. `spent` only counts the current month's. */
  expenses: Expense[];
  addExpenses: (items: NewExpense[]) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id' | 'kind'>) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  /** True while Supabase has a signed-in user; decides the first screen. */
  signedIn: boolean;
  /** Call right after a successful Supabase sign up or log in to load that user's data. */
  enter: () => Promise<void>;
  /** Signs out of Supabase and clears everything held in memory. */
  reset: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const toProfile = (r: ProfileRow, fallbackEmail: string): Profile => ({
  name: r.name,
  email: r.email || fallbackEmail,
  age: r.age,
  incomeType: r.income_type,
  amount: r.income > 0 ? r.income.toLocaleString('en-US') : '',
  currency: CURRENCIES.find(c => c.code === r.currency) ?? DEFAULT_PROFILE.currency,
});

const toProfileRow = (p: Profile): ProfileRow => ({
  name: p.name,
  email: p.email,
  age: p.age,
  income_type: p.incomeType,
  income: parseInt(p.amount.replace(/\D/g, ''), 10) || 0,
  currency: p.currency.code,
});

const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id,
  category: r.category as CategoryKey,
  amount: Number(r.amount),
  note: r.note,
  date: r.spent_at,
  rawTranscript: r.raw_transcript ?? undefined,
});

const toExpenseRow = (e: NewExpense & {date: string}): Omit<ExpenseRow, 'id'> => ({
  category: e.category,
  amount: e.amount,
  note: e.note,
  raw_transcript: e.rawTranscript ?? null,
  spent_at: e.date,
});

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  title: r.title,
  saved: Number(r.saved),
  target: Number(r.target),
  due: r.due,
  kind: (['phone', 'gift', 'shield', 'target'] as const).find(k => k === r.kind) ?? 'target',
});

export function StoreProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState(DEFAULT_PROFILE);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savingsGoal, setSavingsGoalState] = useState(0);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState(DEFAULT_PREFS);
  const [userId, setUserId] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());

  // Tick over at midnight, and re-check whenever the app comes back to the foreground, so the
  // month, dates and greeting follow the real clock even if the app stays open for days.
  useEffect(() => {
    const refresh = () =>
      setToday(prev => (prev.toDateString() === new Date().toDateString() ? prev : new Date()));
    const n = new Date();
    const msToMidnight = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
    const timer = setTimeout(refresh, msToMidnight + 1000);
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);

  // Pulls the signed-in user's data from Supabase. Someone who just finished onboarding
  // but has no saved profile yet (new account) has their answers saved instead.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const load = useCallback(async (id: string, email: string) => {
    const saved = await loadAll(id);
    const local = profileRef.current;
    if (saved.profile && saved.profile.name === '' && local.name !== '') {
      await saveProfile(id, toProfileRow({...local, email}));
      setProfileState({...local, email});
    } else if (saved.profile) {
      setProfileState(toProfile(saved.profile, email));
    }
    setExpenses(saved.expenses.map(toExpense));
    setGoals(saved.goals.map(toGoal));
    setSavingsGoalState(saved.savingsGoal ?? 0);
    setMemberSince(saved.memberSince);
    setUserId(id);
  }, []);

  // On launch, resume the saved Supabase session (if any) and load that user's data. Old
  // phone-only data is wiped, since the database is the only source of truth now.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await clearOldLocalData();
      const {data} = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        await load(user.id, user.email ?? '');
      }
      if (!cancelled) {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const enter = useCallback(async () => {
    const {data} = await supabase.auth.getUser();
    if (data.user) {
      await load(data.user.id, data.user.email ?? '');
    }
  }, [load]);

  // Save profile edits shortly after they happen (batched, so typing costs one write).
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!ready || !userId) {
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProfile(userId, toProfileRow(profile)), 500);
    return () => clearTimeout(saveTimer.current);
  }, [ready, userId, profile]);

  const setProfile = useCallback(
    (patch: Partial<Profile>) => setProfileState(p => ({...p, ...patch})),
    [],
  );
  const addExpenses = useCallback(async (items: NewExpense[]) => {
    const now = new Date().toISOString();
    const rows = await insertExpenses(items.map(i => toExpenseRow({...i, date: i.date ?? now})));
    if (rows) {
      setExpenses(prev => [...prev, ...rows.map(toExpense)]);
    }
  }, []);
  const updateExpense = useCallback((id: string, patch: Partial<Omit<Expense, 'id'>>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? {...e, ...patch} : e)));
    patchExpense(id, {
      ...(patch.category !== undefined && {category: patch.category}),
      ...(patch.amount !== undefined && {amount: patch.amount}),
      ...(patch.note !== undefined && {note: patch.note}),
      ...(patch.date !== undefined && {spent_at: patch.date}),
    });
  }, []);
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    removeExpense(id);
  }, []);
  const addGoal = useCallback(async (g: Omit<Goal, 'id' | 'kind'>) => {
    const row = await insertGoal({...g, kind: 'target'});
    if (row) {
      setGoals(prev => [...prev, toGoal(row)]);
    }
  }, []);
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then(raw => raw && setPrefsState({...DEFAULT_PREFS, ...JSON.parse(raw)}))
      .catch(() => {});
  }, []);
  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState(prev => {
      const next = {...prev, ...patch};
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  const setSavingsGoal = useCallback(
    async (amount: number) => {
      const ok = userId !== null && (await saveSavingsGoal(userId, amount));
      if (ok) {
        setSavingsGoalState(amount);
      }
      return ok;
    },
    [userId],
  );
  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, 'id'>>) => {
    setGoals(prev => prev.map(g => (g.id === id ? {...g, ...patch} : g)));
    patchGoal(id, patch);
  }, []);
  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    removeGoal(id);
  }, []);
  const reset = useCallback(async () => {
    await supabase.auth.signOut();
    setProfileState(DEFAULT_PROFILE);
    setExpenses([]);
    setGoals([]);
    setSavingsGoalState(0);
    setMemberSince(null);
    setUserId(null);
  }, []);
  const signedIn = userId !== null;

  const value = useMemo<Store>(() => {
    const spent = expenses
      .filter(e => sameMonth(e.date, today))
      .reduce((sum, e) => sum + e.amount, 0);
    const income = parseInt(profile.amount.replace(/\D/g, ''), 10) || 0;
    return {
      profile,
      setProfile,
      prefs,
      setPrefs,
      memberSince,
      income,
      savingsGoal,
      setSavingsGoal,
      budget: spendable(income, savingsGoal),
      spent,
      today,
      expenses,
      addExpenses,
      updateExpense,
      deleteExpense,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      signedIn,
      enter,
      reset,
    };
  }, [
    profile,
    prefs,
    setPrefs,
    memberSince,
    today,
    expenses,
    goals,
    savingsGoal,
    setSavingsGoal,
    signedIn,
    enter,
    setProfile,
    addExpenses,
    updateExpense,
    deleteExpense,
    addGoal,
    updateGoal,
    deleteGoal,
    reset,
  ]);

  // Hold the first frame until the session and data are in, so the app never flashes the Welcome
  // screen to someone who is already signed in.
  if (!ready) {
    return <View style={{flex: 1, backgroundColor: '#F5EDE0'}} />;
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return store;
}

/** "Rs 12,500" in the user's chosen currency. */
export function useMoney() {
  const {sym} = useStore().profile.currency;
  return useCallback((n: number) => `${sym} ${formatAmount(n)}`, [sym]);
}
