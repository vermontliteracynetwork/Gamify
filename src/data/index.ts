import { createCloudStore } from './cloudStore';
import { createLocalStore } from './localStore';
import type { DataStore } from './store';
import { supabase } from './supabase';

// The app's one data store. With cloud accounts on (Supabase keys set), a
// signed-in teacher's work is saved in the cloud; with nobody signed in (a
// student's own device, or no keys) it stays on this device.
const local = createLocalStore();

function switching(cloud: DataStore): DataStore {
  const signedIn = async () => !!(await supabase!.auth.getSession()).data.session;
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(local) as (keyof DataStore)[]) {
    out[key] = async (...args: unknown[]) => {
      // Tell Gamify reports always go to the cloud (anyone may send one).
      const store = key === 'sendFeedback' || (await signedIn()) ? cloud : local;
      try {
        return await (store[key] as (...a: unknown[]) => Promise<unknown>)(...args);
      } catch (e) {
        if (key === 'sendFeedback' && store === cloud) return local.sendFeedback(args[0] as never);
        throw e;
      }
    };
  }
  return out as unknown as DataStore;
}

export const data: DataStore = supabase ? switching(createCloudStore(supabase)) : local;

export function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}
