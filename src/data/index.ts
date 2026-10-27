import { createCloudStore } from './cloudStore';
import { createLocalStore } from './localStore';
import type { DataStore } from './store';
import { normId, supabase, toUuid } from './supabase';
import type { QuestionLogEntry } from './types';

// The app's one data store. With cloud accounts on (Supabase keys set), a
// signed-in teacher's work is saved in the cloud; with nobody signed in (a
// student's own device, or no keys) it stays on this device.
const local = createLocalStore();

function switching(cloud: DataStore): DataStore {
  const signedIn = async () => !!(await supabase!.auth.getSession()).data.session;
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(local) as (keyof DataStore)[]) {
    out[key] = async (...args: unknown[]) => {
      // A student on their own device, playing a teacher's cloud game code:
      // the answer goes to that teacher's reports (0008_game_codes.sql).
      const signed = await signedIn();
      const code = (() => { try { return sessionStorage.getItem('gamify:cloud-code') ?? ''; } catch { return ''; } })();
      if (key === 'logQuestion' && !signed && code) {
        const e = args[0] as QuestionLogEntry;
        await supabase!.rpc('log_by_code', { c: code, e: { id: toUuid(e.id), student_id: e.studentId ? normId(e.studentId) : null, team_name: e.teamName ?? null, mode: e.mode, prompt: e.prompt, answer: e.answer, tries: e.tries, ms: Math.round(e.ms), outcome: e.outcome } });
        return local.logQuestion(e);
      }
      // Tell Gamify reports always go to the cloud (anyone may send one).
      const store = key === 'sendFeedback' || signed ? cloud : local;
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

const base: DataStore = supabase ? switching(createCloudStore(supabase)) : local;

// Plan preview from the owner dashboard: this tab acts as if on another plan
// until the preview stops. Changes nothing saved.
const PREVIEW = 'gamify:preview-tier';
export const previewTier = (): string | null => { try { return sessionStorage.getItem(PREVIEW); } catch { return null; } };
export function setPreviewTier(tier: string | null) {
  try { if (tier) sessionStorage.setItem(PREVIEW, tier); else sessionStorage.removeItem(PREVIEW); } catch { /* this tab only */ }
  window.dispatchEvent(new Event('gamify-tier'));
}
export const data: DataStore = {
  ...base,
  getSetting: (async (key: string) => (key === 'tier' && previewTier() ? previewTier() : base.getSetting(key))) as DataStore['getSetting'],
};

export function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}
