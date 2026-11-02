import AsyncStorage from '@react-native-async-storage/async-storage';
import {createOutbox, newId, Op} from '../src/outbox';
import {supabase} from '../src/supabase';

jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => data.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void data.set(k, v)),
    clear: jest.fn(async () => data.clear()),
  };
});
jest.mock('../src/supabase', () => {
  const upsert = jest.fn();
  return {supabase: {from: jest.fn(() => ({upsert}))}};
});

const upsert = (supabase.from('expenses') as unknown as {upsert: jest.Mock}).upsert;
const op = (id: string): Op => ({table: 'expenses', kind: 'insert', id, data: {amount: 1}});
const sent = () => upsert.mock.calls.map(c => c[0].id);

beforeEach(async () => {
  upsert.mockReset();
  upsert.mockResolvedValue({error: null});
  await AsyncStorage.clear();
});

it('sends changes in the order they were made', async () => {
  const box = createOutbox(() => {});
  await box.open('u1');
  box.add(op('a'));
  box.add(op('b'));
  await box.flush();

  expect(sent()).toEqual(['a', 'b']);
  expect(box.size).toBe(0);
});

it('stops at a network failure and keeps everything for later', async () => {
  upsert.mockResolvedValue({error: {message: 'Network request failed', code: ''}});
  const box = createOutbox(() => {});
  await box.open('u1');
  box.add(op('a'));
  box.add(op('b'));
  await box.flush();

  expect(sent()).toEqual(['a']);
  expect(box.size).toBe(2);

  upsert.mockResolvedValue({error: null});
  await box.flush();
  expect(sent()).toEqual(['a', 'a', 'b']);
  expect(box.size).toBe(0);
});

it('keeps trying if the request itself throws', async () => {
  upsert.mockRejectedValue(new Error('boom'));
  const box = createOutbox(() => {});
  await box.open('u1');
  box.add(op('a'));
  await box.flush();

  expect(box.size).toBe(1);
});

it('does not let a change the database refused block the rest', async () => {
  upsert.mockResolvedValueOnce({error: {message: 'bad amount', code: '23514'}});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const box = createOutbox(() => {});
  await box.open('u1');
  box.add(op('bad'));
  box.add(op('good'));
  await box.flush();
  warn.mockRestore();

  expect(sent()).toEqual(['bad', 'good']);
  expect(box.size).toBe(0);
});

it('survives the app closing', async () => {
  upsert.mockResolvedValue({error: {message: 'Network request failed'}});
  const before = createOutbox(() => {});
  await before.open('u1');
  before.add(op('a'));
  await before.flush();

  const after = createOutbox(() => {});
  await after.open('u1');
  expect(after.size).toBe(1);
});

it("keeps each user's changes apart", async () => {
  upsert.mockResolvedValue({error: {message: 'Network request failed'}});
  const box = createOutbox(() => {});
  await box.open('u1');
  box.add(op('a'));
  await box.flush();
  box.close();

  await box.open('u2');
  expect(box.size).toBe(0);
  box.close();

  await box.open('u1');
  expect(box.size).toBe(1);
});

it('makes valid, different UUIDs', () => {
  const ids = Array.from({length: 200}, newId);
  ids.forEach(id =>
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
  );
  expect(new Set(ids).size).toBe(200);
});
