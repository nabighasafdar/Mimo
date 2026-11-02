import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';

// Everything the app stores lives in Supabase (see supabase/schema.sql). Row level security
// scopes every query to the signed-in user, and `user_id` fills itself in on insert.

export type ProfileRow = {
  name: string;
  email: string;
  age: number;
  income_type: string;
  income: number;
  currency: string;
};

export type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  note: string;
  raw_transcript: string | null;
  spent_at: string;
};

export type GoalRow = {
  id: string;
  title: string;
  saved: number;
  target: number;
  due: string;
  kind: string;
};

export type Snapshot = {
  profile: ProfileRow | null;
  expenses: ExpenseRow[];
  goals: GoalRow[];
  /** null until the savings_goal column exists (see supabase/schema.sql). */
  savingsGoal: number | null;
  /** When the account was created (ISO 8601). */
  memberSince: string | null;
};

/** Errors from Supabase are logged, not thrown, so the UI keeps working offline. */
function check<T>(what: string, res: {data: T; error: {message: string} | null}): T | null {
  if (res.error) {
    console.warn(`Mimo: ${what} failed:`, res.error.message);
    return null;
  }
  return res.data;
}

export async function loadAll(userId: string): Promise<Snapshot> {
  const [profile, expenses, goals, extras] = await Promise.all([
    supabase
      .from('profiles')
      .select('name,email,age,income_type,income,currency')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('expenses')
      .select('id,category,amount,note,raw_transcript,spent_at')
      .order('spent_at', {ascending: true}),
    supabase
      .from('goals')
      .select('id,title,saved,target,due,kind')
      .order('created_at', {ascending: true}),
    // Separate from the profile select, so a missing column can't stop the profile loading.
    supabase.from('profiles').select('savings_goal,created_at').eq('id', userId).maybeSingle(),
  ]);
  return {
    profile: check('load profile', profile),
    expenses: check('load expenses', expenses) ?? [],
    goals: check('load goals', goals) ?? [],
    savingsGoal: extras.error
      ? (check('load savings goal', extras), null)
      : Number(extras.data?.savings_goal ?? 0),
    memberSince: extras.data?.created_at ?? null,
  };
}

export async function saveProfile(userId: string, p: ProfileRow): Promise<void> {
  check('save profile', await supabase.from('profiles').upsert({id: userId, ...p}));
}

export async function insertExpenses(
  items: Omit<ExpenseRow, 'id'>[],
): Promise<ExpenseRow[] | null> {
  return check(
    'save expenses',
    await supabase
      .from('expenses')
      .insert(items)
      .select('id,category,amount,note,raw_transcript,spent_at'),
  );
}

export async function patchExpense(id: string, patch: Partial<Omit<ExpenseRow, 'id'>>) {
  check('update expense', await supabase.from('expenses').update(patch).eq('id', id));
}

export async function removeExpense(id: string) {
  check('delete expense', await supabase.from('expenses').delete().eq('id', id));
}

export async function insertGoal(g: Omit<GoalRow, 'id'>): Promise<GoalRow | null> {
  return check(
    'save goal',
    await supabase.from('goals').insert(g).select('id,title,saved,target,due,kind').single(),
  );
}

/** Saves how much the user wants to save each month. Returns false if the save failed. */
export async function saveSavingsGoal(userId: string, amount: number): Promise<boolean> {
  const res = await supabase.from('profiles').update({savings_goal: amount}).eq('id', userId);
  check('save savings goal', res);
  return !res.error;
}

export async function patchGoal(id: string, patch: Partial<Omit<GoalRow, 'id'>>) {
  check('update goal', await supabase.from('goals').update(patch).eq('id', id));
}

export async function removeGoal(id: string) {
  check('delete goal', await supabase.from('goals').delete().eq('id', id));
}

// Data the app used to keep on the phone before it moved to Supabase.
const OLD_LOCAL_KEYS = [
  'bonnie:meta',
  'bonnie:profile',
  'bonnie:expenses',
  'bonnie:goals',
  'bonnie:session',
];

export async function clearOldLocalData() {
  try {
    await AsyncStorage.removeMany(OLD_LOCAL_KEYS);
  } catch {
    // Nothing to clear.
  }
}
