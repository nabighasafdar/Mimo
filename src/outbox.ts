import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';

// Every change to the user's data waits here, on the phone, until the database has it. That is
// what makes the app work offline: changes show up straight away and are sent in order, right
// now if there is internet and otherwise once it comes back. Each user has their own list.

export type Op = {
  table: 'profiles' | 'expenses' | 'goals';
  kind: 'insert' | 'update' | 'delete';
  id: string;
  data?: Record<string, unknown>;
};

const storageKey = (userId: string) => `mimo:outbox:${userId}`;

/** A random UUID, so a new row has its id before it reaches the database. */
export const newId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });

function send(op: Op) {
  const table = supabase.from(op.table);
  switch (op.kind) {
    case 'insert':
      // A retry after a lost response must not add the row twice.
      return table.upsert({id: op.id, ...op.data}, {onConflict: 'id', ignoreDuplicates: true});
    case 'update':
      return table.update(op.data ?? {}).eq('id', op.id);
    case 'delete':
      return table.delete().eq('id', op.id);
  }
}

// Postgres refused the change (bad value, not allowed). Trying again can't help, and leaving it
// at the front of the list would block everything behind it.
const refused = (code?: string) => /^(22|23|42)/.test(code ?? '');

export type Outbox = ReturnType<typeof createOutbox>;

export function createOutbox(onChange: (size: number) => void) {
  let owner: string | null = null;
  let ops: Op[] = [];
  let running: Promise<void> | null = null;

  const update = (next: Op[]) => {
    ops = next;
    onChange(ops.length);
    if (owner) {
      AsyncStorage.setItem(storageKey(owner), JSON.stringify(ops)).catch(() => {});
    }
  };

  const run = async () => {
    const me = owner;
    while (ops.length && owner === me) {
      const op = ops[0];
      let result;
      try {
        result = await send(op);
      } catch {
        return;
      }
      if (owner !== me) {
        return;
      }
      if (result.error && !refused(result.error.code)) {
        return;
      }
      if (result.error) {
        console.warn(`Mimo: ${op.kind} on ${op.table} refused:`, result.error.message);
      }
      update(ops.slice(1));
    }
  };

  const flush = () => {
    running ??= run().finally(() => {
      running = null;
    });
    return running;
  };

  return {
    get size() {
      return ops.length;
    },
    /** Picks up whatever this user left waiting, even from before the app was closed. */
    async open(userId: string) {
      if (owner === userId) {
        return;
      }
      owner = userId;
      let saved: Op[] = [];
      try {
        saved = JSON.parse((await AsyncStorage.getItem(storageKey(userId))) ?? '[]');
      } catch {
        // Nothing readable was waiting.
      }
      ops = saved;
      onChange(ops.length);
    },
    add(op: Op) {
      update([...ops, op]);
      flush();
    },
    flush,
    /** Stops sending but keeps the list, so it goes out when this user next logs in. */
    close() {
      owner = null;
      ops = [];
      onChange(0);
    },
    /** Throws the list away. For when the account is gone. */
    clear() {
      update([]);
      owner = null;
    },
  };
}
