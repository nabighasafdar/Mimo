import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isAuthRetryableFetchError} from '@supabase/supabase-js';
import {sameMonth, spendable} from './budget';
import {CategoryKey} from './categories';
import PrimaryButton from './components/PrimaryButton';
import {
  clearOldLocalData,
  deleteOwnAccount,
  ExpenseRow,
  GoalRow,
  loadAll,
  ProfileRow,
  saveProfile,
} from './db';
import {createOutbox, newId} from './outbox';
import {supabase} from './supabase';
import {colors, fonts} from './theme';
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
// Onboarding answers wait here until the account exists. Confirming the sign-up email happens
// outside the app, so they have to survive the app being closed in between.
const ONBOARDING_KEY = 'mimo:onboarding';

// Who was last signed in. The sign-in token expires hourly and renewing it needs internet, so
// offline this is how the app still knows whose budget to show.
const LAST_USER_KEY = 'mimo:last-user';
// The last known budget, shown when the database can't be reached.
const cacheKey = (userId: string) => `mimo:cache:${userId}`;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type Cache = {
  profile: Profile;
  expenses: Expense[];
  goals: Goal[];
  savingsGoal: number;
  memberSince: string | null;
};

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
  setSavingsGoal: (amount: number) => void;
  /** What the user can spend each month: income minus the savings goal. */
  budget: number;
  /** Money logged this month. */
  spent: number;
  /** The current day. Changes at midnight, so month totals roll over on their own. */
  today: Date;
  /** Every saved expense, oldest first. `spent` only counts the current month's. */
  expenses: Expense[];
  addExpenses: (items: NewExpense[]) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id' | 'kind'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  /** Changes on this phone that the database doesn't have yet. */
  pending: number;
  /** True while showing the copy kept on the phone because the database can't be reached. */
  offline: boolean;
  /** True while Supabase has a signed-in user; decides the first screen. */
  signedIn: boolean;
  /**
   * Call right after a successful Supabase sign up or log in to load that user's data. Resolves
   * false if it could not be loaded; the provider then shows its retry screen.
   */
  enter: () => Promise<boolean>;
  /** Signs out of Supabase and clears everything held in memory. */
  reset: () => Promise<void>;
  /** Deletes the account and all its data for good. Resolves false if that failed. */
  deleteAccount: () => Promise<boolean>;
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [profile, setProfileState] = useState(DEFAULT_PROFILE);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savingsGoal, setSavingsGoalState] = useState(0);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState(DEFAULT_PREFS);
  const [userId, setUserId] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());
  const [pending, setPending] = useState(0);
  const [offline, setOffline] = useState(false);
  const [outbox] = useState(() => createOutbox(setPending));

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

  // True once the user has changed their profile and that change isn't saved yet.
  const profileEdited = useRef(false);

  // Pulls the signed-in user's data from Supabase, or from the phone when that isn't possible. A
  // brand new account has the answers from onboarding saved to it; an existing one keeps what it
  // has, even if someone went through onboarding first and then logged in. Throws if there is
  // nothing to show or the answers can't be saved.
  const load = useCallback(
    async (id: string, email: string) => {
      await outbox.open(id);
      await outbox.flush();
      // The database doesn't have what's still waiting, so its copy would undo those changes.
      const saved = outbox.size
        ? null
        : await loadAll(id).catch(e => {
            console.warn('Mimo: load failed:', e);
            return null;
          });
      const cached = saved ? null : await readJson<Cache>(cacheKey(id));
      if (saved) {
        const answers = saved.isNew ? await readJson<Profile>(ONBOARDING_KEY) : null;
        if (answers) {
          if (!(await saveProfile(id, toProfileRow({...answers, email})))) {
            throw new Error('save onboarding answers failed');
          }
          setProfileState({...answers, email});
        } else if (saved.profile) {
          setProfileState(toProfile(saved.profile, email));
        }
        setExpenses(saved.expenses.map(toExpense));
        setGoals(saved.goals.map(toGoal));
        setSavingsGoalState(saved.savingsGoal);
        setMemberSince(saved.memberSince);
        AsyncStorage.removeItem(ONBOARDING_KEY).catch(() => {});
      } else if (cached) {
        setProfileState(cached.profile);
        setExpenses(cached.expenses);
        setGoals(cached.goals);
        setSavingsGoalState(cached.savingsGoal);
        setMemberSince(cached.memberSince);
      } else {
        throw new Error('no internet and no copy on this phone');
      }
      profileEdited.current = false;
      setOffline(!saved);
      setLoadFailed(false);
      setUserId(id);
      AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify({id, email})).catch(() => {});
    },
    [outbox],
  );

  const enter = useCallback(async () => {
    try {
      const {data, error} = await supabase.auth.getSession();
      const noInternet = isAuthRetryableFetchError(error);
      const user =
        data.session?.user ??
        (noInternet ? await readJson<{id: string; email?: string}>(LAST_USER_KEY) : null);
      if (noInternet && !user) {
        throw error;
      }
      if (user) {
        await load(user.id, user.email ?? '');
      }
      return true;
    } catch (e) {
      console.warn('Mimo: load failed:', e);
      setLoadFailed(true);
      return false;
    }
  }, [load]);

  // On launch, resume the saved Supabase session (if any) and load that user's data. Old
  // phone-only data is wiped, since the database is the only source of truth now.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await clearOldLocalData();
      await enter();
      if (!cancelled) {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enter]);

  const retry = useCallback(async () => {
    setRetrying(true);
    await enter();
    setRetrying(false);
  }, [enter]);

  // While anything is out of step with the database, keep trying: every half minute, and whenever
  // the app comes back to the foreground. Once it's all sent, pull the latest back down.
  const behind = offline || pending > 0;
  useEffect(() => {
    if (!behind) {
      return;
    }
    const sync = async () => {
      await outbox.flush();
      if (!outbox.size) {
        await enter();
      }
    };
    const timer = setInterval(sync, 30000);
    const sub = AppState.addEventListener('change', s => s === 'active' && sync());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [behind, outbox, enter]);

  // Keep a copy on the phone for when there is no internet.
  useEffect(() => {
    if (userId) {
      const cache: Cache = {profile, expenses, goals, savingsGoal, memberSince};
      AsyncStorage.setItem(cacheKey(userId), JSON.stringify(cache)).catch(() => {});
    }
  }, [userId, profile, expenses, goals, savingsGoal, memberSince]);

  // Before there is an account to save to, keep the onboarding answers on the phone.
  useEffect(() => {
    if (ready && !userId && profile.name !== '') {
      AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile)).catch(() => {});
    }
  }, [ready, userId, profile]);

  // Save profile edits shortly after they happen (batched, so typing costs one write). Only real
  // edits are saved, so loading the app can never write over what is in the database.
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!ready || !userId || !profileEdited.current) {
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      profileEdited.current = false;
      outbox.add({table: 'profiles', kind: 'update', id: userId, data: toProfileRow(profile)});
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [ready, userId, profile, outbox]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    profileEdited.current = true;
    setProfileState(p => ({...p, ...patch}));
  }, []);
  const addExpenses = useCallback(
    (items: NewExpense[]) => {
      const now = new Date().toISOString();
      const rows = items.map(i => ({
        id: newId(),
        ...toExpenseRow({...i, date: i.date ?? now}),
      }));
      setExpenses(prev => [...prev, ...rows.map(toExpense)]);
      rows.forEach(({id, ...data}) => outbox.add({table: 'expenses', kind: 'insert', id, data}));
    },
    [outbox],
  );
  const updateExpense = useCallback(
    (id: string, patch: Partial<Omit<Expense, 'id'>>) => {
      setExpenses(prev => prev.map(e => (e.id === id ? {...e, ...patch} : e)));
      outbox.add({
        table: 'expenses',
        kind: 'update',
        id,
        data: {
          ...(patch.category !== undefined && {category: patch.category}),
          ...(patch.amount !== undefined && {amount: patch.amount}),
          ...(patch.note !== undefined && {note: patch.note}),
          ...(patch.date !== undefined && {spent_at: patch.date}),
        },
      });
    },
    [outbox],
  );
  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      outbox.add({table: 'expenses', kind: 'delete', id});
    },
    [outbox],
  );
  const addGoal = useCallback(
    (g: Omit<Goal, 'id' | 'kind'>) => {
      const goal: Goal = {...g, id: newId(), kind: 'target'};
      const {id, ...data} = goal;
      setGoals(prev => [...prev, goal]);
      outbox.add({table: 'goals', kind: 'insert', id, data});
    },
    [outbox],
  );
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
    (amount: number) => {
      if (userId) {
        setSavingsGoalState(amount);
        outbox.add({table: 'profiles', kind: 'update', id: userId, data: {savings_goal: amount}});
      }
    },
    [userId, outbox],
  );
  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, 'id'>>) => {
      setGoals(prev => prev.map(g => (g.id === id ? {...g, ...patch} : g)));
      outbox.add({table: 'goals', kind: 'update', id, data: patch});
    },
    [outbox],
  );
  const deleteGoal = useCallback(
    (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      outbox.add({table: 'goals', kind: 'delete', id});
    },
    [outbox],
  );
  // Leaves nothing of this user's budget on the phone, except changes still waiting to be sent.
  const forget = useCallback(() => {
    const keys = [ONBOARDING_KEY, LAST_USER_KEY, ...(userId ? [cacheKey(userId)] : [])];
    Promise.all(keys.map(k => AsyncStorage.removeItem(k))).catch(() => {});
    setProfileState(DEFAULT_PROFILE);
    setExpenses([]);
    setGoals([]);
    setSavingsGoalState(0);
    setMemberSince(null);
    setOffline(false);
    setUserId(null);
  }, [userId]);
  const reset = useCallback(async () => {
    // A normal sign out needs internet; the local one always works.
    const {error} = await supabase.auth.signOut();
    if (error) {
      await supabase.auth.signOut({scope: 'local'});
    }
    outbox.close();
    forget();
  }, [outbox, forget]);
  const deleteAccount = useCallback(async () => {
    if (!(await deleteOwnAccount())) {
      return false;
    }
    await supabase.auth.signOut({scope: 'local'});
    outbox.clear();
    forget();
    return true;
  }, [outbox, forget]);
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
      pending,
      offline,
      signedIn,
      enter,
      reset,
      deleteAccount,
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
    pending,
    offline,
    reset,
    deleteAccount,
  ]);

  // Hold the first frame until the session and data are in, so the app never flashes the Welcome
  // screen to someone who is already signed in.
  if (!ready) {
    return <View style={{flex: 1, backgroundColor: '#F5EDE0'}} />;
  }
  // Reached only with no copy on the phone either. Without their data the app would show an
  // empty account with made-up totals, so stop here.
  if (loadFailed) {
    return (
      <View style={styles.failed}>
        <Text style={styles.failedText}>
          I can't reach your budget right now. Check your internet and try again.
        </Text>
        <PrimaryButton
          label={retrying ? 'Trying…' : 'Try again'}
          onPress={retry}
          disabled={retrying}
        />
      </View>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const styles = StyleSheet.create({
  failed: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    padding: 32,
    backgroundColor: '#F5EDE0',
  },
  failedText: {fontFamily: fonts.bold, fontSize: 18, color: colors.text, textAlign: 'center'},
});

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
