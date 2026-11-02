import React from 'react';
import renderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthRetryableFetchError} from '@supabase/supabase-js';
import {receiptDate} from '../src/budget';
import {deleteOwnAccount, loadAll, saveProfile} from '../src/db';
import {CURRENCIES, StoreProvider, useStore} from '../src/store';
import {supabase} from '../src/supabase';

jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => data.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void data.set(k, v)),
    removeItem: jest.fn(async (k: string) => void data.delete(k)),
    clear: jest.fn(async () => data.clear()),
  };
});
jest.mock('../src/supabase', () => {
  const eq = jest.fn(async () => ({error: null}));
  const table = {
    upsert: jest.fn(async () => ({error: null})),
    update: jest.fn(() => ({eq})),
    delete: jest.fn(() => ({eq})),
  };
  return {supabase: {from: jest.fn(() => table), auth: {getSession: jest.fn(), signOut: jest.fn()}}};
});
jest.mock('../src/db', () => ({
  clearOldLocalData: jest.fn(async () => {}),
  loadAll: jest.fn(),
  saveProfile: jest.fn(async () => true),
  deleteOwnAccount: jest.fn(async () => true),
}));

const SAVED_PROFILE = {
  name: 'Ayesha',
  email: 'a@test.com',
  age: 40,
  income_type: 'salary',
  income: 90000,
  currency: 'USD',
};
const snapshot = (over = {}) => ({
  profile: SAVED_PROFILE,
  expenses: [],
  goals: [],
  savingsGoal: 0,
  memberSince: null,
  isNew: false,
  ...over,
});
const ANSWERS = {
  name: 'Sara',
  email: '',
  age: 30,
  incomeType: 'salary',
  amount: '80,000',
  currency: CURRENCIES[1],
};
const session = {data: {session: {user: {id: 'u1', email: 'a@test.com'}}}, error: null};
const table = () => (supabase.from as jest.Mock)();

let store: ReturnType<typeof useStore>;
function Spy() {
  store = useStore();
  return null;
}

async function launch() {
  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <StoreProvider>
        <Spy />
      </StoreProvider>,
    );
  });
  return tree!;
}

const wait = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  await AsyncStorage.clear();
  (supabase.auth.signOut as jest.Mock).mockResolvedValue({error: null});
  (supabase.auth.getSession as jest.Mock).mockResolvedValue(session);
  (loadAll as jest.Mock).mockResolvedValue(snapshot());
});

afterEach(() => jest.useRealTimers());

describe('onboarding answers', () => {
  it('are saved to a brand new account, which already has a name from the sign-up trigger', async () => {
    await AsyncStorage.setItem('mimo:onboarding', JSON.stringify(ANSWERS));
    (loadAll as jest.Mock).mockResolvedValue(
      snapshot({isNew: true, profile: {...SAVED_PROFILE, name: 'Sara', age: 21, income: 0}}),
    );
    await launch();

    expect(saveProfile).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({name: 'Sara', age: 30, income: 80000, currency: 'USD'}),
    );
    expect(store.profile.age).toBe(30);
    expect(await AsyncStorage.getItem('mimo:onboarding')).toBeNull();
  });

  it('never replace an existing account', async () => {
    await AsyncStorage.setItem('mimo:onboarding', JSON.stringify(ANSWERS));
    await launch();
    await wait(1000);

    expect(saveProfile).not.toHaveBeenCalled();
    expect(store.profile.age).toBe(40);
  });

  it('are kept for a retry if they could not be saved', async () => {
    await AsyncStorage.setItem('mimo:onboarding', JSON.stringify(ANSWERS));
    (loadAll as jest.Mock).mockResolvedValue(snapshot({isNew: true}));
    (saveProfile as jest.Mock).mockResolvedValueOnce(false);
    const tree = await launch();

    expect(JSON.stringify(tree.toJSON())).toContain('Try again');
    expect(await AsyncStorage.getItem('mimo:onboarding')).not.toBeNull();
  });
});

describe('loading', () => {
  it('does not write the profile back', async () => {
    await launch();
    await wait(1000);
    expect(saveProfile).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('saves real edits', async () => {
    await launch();
    act(() => store.setProfile({age: 41}));
    await wait(1000);
    expect(table().update).toHaveBeenCalledTimes(1);
    expect(table().update).toHaveBeenCalledWith(expect.objectContaining({age: 41}));
  });

  it('shows a retry screen when there is no copy on the phone, and saves nothing', async () => {
    (loadAll as jest.Mock).mockRejectedValue(new Error('offline'));
    const tree = await launch();
    await wait(1000);

    expect(JSON.stringify(tree.toJSON())).toContain('Try again');
    expect(saveProfile).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('offline', () => {
  const item = {category: 'Food' as const, amount: 100, note: 'Lunch'};
  const noInternet = () => table().upsert.mockResolvedValue({error: {message: 'Network request failed'}});

  afterEach(() => table().upsert.mockResolvedValue({error: null}));

  it('shows the copy on the phone when the database is unreachable', async () => {
    const first = await launch();
    act(() => store.setSavingsGoal(5000));
    await wait(0);
    await act(async () => first.unmount());

    (loadAll as jest.Mock).mockRejectedValue(new Error('offline'));
    await launch();

    expect(store.offline).toBe(true);
    expect(store.profile.age).toBe(40);
    expect(store.savingsGoal).toBe(5000);
  });

  it('opens with the last user when the expired session cannot be renewed', async () => {
    const first = await launch();
    await wait(0);
    await act(async () => first.unmount());

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {session: null},
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });
    (loadAll as jest.Mock).mockRejectedValue(new Error('offline'));
    await launch();

    expect(store.signedIn).toBe(true);
    expect(store.offline).toBe(true);
  });

  it('keeps an expense added with no internet, and sends it on the next launch', async () => {
    noInternet();
    const first = await launch();
    await act(async () => store.addExpenses([item]));

    expect(store.expenses).toHaveLength(1);
    expect(store.pending).toBe(1);
    await act(async () => first.unmount());

    (loadAll as jest.Mock).mockRejectedValue(new Error('offline'));
    await launch();
    expect(store.expenses).toHaveLength(1);
    expect(store.pending).toBe(1);

    table().upsert.mockClear();
    table().upsert.mockResolvedValue({error: null});
    (loadAll as jest.Mock).mockResolvedValue(snapshot());
    await launch();

    expect(table().upsert).toHaveBeenCalledTimes(1);
    expect(table().upsert.mock.calls[0][0]).toMatchObject({amount: 100, note: 'Lunch'});
    expect(store.pending).toBe(0);
  });

  it('does not let the older database copy hide what is still waiting', async () => {
    noInternet();
    await launch();
    await act(async () => store.addExpenses([item]));
    await launch();

    expect(store.expenses).toHaveLength(1);
  });
});

describe('expenses', () => {
  const item = {category: 'Food' as const, amount: 100, note: 'Lunch'};

  it('adds, edits and deletes', async () => {
    await launch();
    await act(async () => store.addExpenses([item]));
    const id = store.expenses[0].id;

    await act(async () => store.updateExpense(id, {amount: 150, date: '2026-09-01T10:00:00.000Z'}));
    expect(store.expenses[0].amount).toBe(150);
    expect(table().update).toHaveBeenCalledWith({amount: 150, spent_at: '2026-09-01T10:00:00.000Z'});

    await act(async () => store.deleteExpense(id));
    expect(store.expenses).toEqual([]);
    expect(table().delete).toHaveBeenCalled();
    expect(store.pending).toBe(0);
  });
});

describe('deleting the account', () => {
  it('leaves the budget off the phone', async () => {
    await launch();
    await wait(0);
    let deleted;
    await act(async () => {
      deleted = await store.deleteAccount();
    });

    expect(deleted).toBe(true);
    expect(store.signedIn).toBe(false);
    expect(await AsyncStorage.getItem('mimo:cache:u1')).toBeNull();
    expect(await AsyncStorage.getItem('mimo:last-user')).toBeNull();
  });

  it('stays signed in if it fails', async () => {
    (deleteOwnAccount as jest.Mock).mockResolvedValueOnce(false);
    await launch();
    let deleted;
    await act(async () => {
      deleted = await store.deleteAccount();
    });

    expect(deleted).toBe(false);
    expect(store.signedIn).toBe(true);
  });
});

describe('receiptDate', () => {
  const now = new Date('2026-11-02T15:00:00');

  it('keeps the date printed on the receipt', () => {
    expect(new Date(receiptDate('2026-09-15', now)!).getMonth()).toBe(8);
  });

  it('falls back to today for unreadable or future dates', () => {
    expect(receiptDate('', now)).toBeUndefined();
    expect(receiptDate('15/09/2026', now)).toBeUndefined();
    expect(receiptDate('2027-01-01', now)).toBeUndefined();
  });
});
