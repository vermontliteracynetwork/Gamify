import { useCallback, useEffect, useState } from 'react';
import type { Tier } from '../config';
import { data } from './index';
import type { QuestionSet } from './types';
import { withTimeout } from '../lib/withTimeout';

// Loads async data and reloads on demand.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[] = []): { value: T | undefined; reload: () => void } {
  const [value, setValue] = useState<T>();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    load().then((v) => { if (live) setValue(v); });
    return () => { live = false; };
  }, [tick, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { value, reload: useCallback(() => setTick((t) => t + 1), []) };
}

export function useMySets() {
  return useAsync<QuestionSet[]>(() => data.listQuestionSets());
}

// The teacher's plan. Local builds default to Free until accounts and
// billing exist (Stages 5 and 7).
export function useTier(): Tier {
  const { value, reload } = useAsync<Tier | undefined>(() => data.getSetting<Tier>('tier'));
  useEffect(() => { window.addEventListener('gamify-tier', reload); return () => window.removeEventListener('gamify-tier', reload); }, [reload]);
  return value ?? 'free';
}

// The plan, or null while it loads (so a gate never flashes a lock).
const TIER_CACHE = 'gamify:tier-cache';
export function useTierLoaded(): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    // The last plan this device saw stands in when the cloud does not answer,
    // so a game page never stays blank (owner, 2026-11-25).
    const cached = (): Tier => { try { return (localStorage.getItem(TIER_CACHE) as Tier | null) ?? 'free'; } catch { return 'free'; } };
    const load = () => void withTimeout(data.getSetting<Tier>('tier')).then(
      (v) => { const tier = v ?? 'free'; try { localStorage.setItem(TIER_CACHE, tier); } catch { /* private window */ } setTier(tier); },
      (e) => { console.warn('plan not loaded', e); setTier(cached()); });
    load();
    window.addEventListener('gamify-tier', load);
    return () => window.removeEventListener('gamify-tier', load);
  }, []);
  return tier;
}

export const LOCAL_TEACHER_ID = 'local-teacher';
