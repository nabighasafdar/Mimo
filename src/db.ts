import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';

// Reads from Supabase (see supabase/schema.sql). Row level security scopes every query to the
// signed-in user, and `user_id` fills itself in on insert. Changes go through src/outbox.ts.

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
  savingsGoal: number;
  /** When the account was created (ISO 8601). */
  memberSince: string | null;
  /** True until the profile is first saved: it still holds what the sign-up trigger put there. */
  isNew: boolean;
};

/** A failed read must never look like an empty account, so it throws. */
function must<T>(what: string, res: {data: T; error: {message: string} | null}): T {
  if (res.error) {
    throw new Error(`${what}: ${res.error.message}`);
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
    // Not part of ProfileRow, which is what saveProfile writes back.
    supabase
      .from('profiles')
      .select('savings_goal,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle(),
  ]);
  const account = must('load account', extras);
  return {
    profile: must('load profile', profile),
    expenses: must('load expenses', expenses) ?? [],
    goals: must('load goals', goals) ?? [],
    savingsGoal: Number(account?.savings_goal ?? 0),
    memberSince: account?.created_at ?? null,
    isNew: !account || account.created_at === account.updated_at,
  };
}

/** Returns false if the save failed. */
export async function saveProfile(userId: string, p: ProfileRow): Promise<boolean> {
  const {error} = await supabase.from('profiles').upsert({id: userId, ...p});
  if (error) {
    console.warn('Mimo: save profile failed:', error.message);
  }
  return !error;
}

/** Deletes the signed-in user and, through the foreign keys, everything they own. */
export async function deleteOwnAccount(): Promise<boolean> {
  const {error} = await supabase.rpc('delete_my_account');
  if (error) {
    console.warn('Mimo: delete account failed:', error.message);
  }
  return !error;
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
