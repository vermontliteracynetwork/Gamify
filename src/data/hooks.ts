import { useCallback, useEffect, useState } from 'react';
import type { Tier } from '../config';
import { data } from './index';
import type { QuestionSet } from './types';

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
export function useTierLoaded(): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    const load = () => void data.getSetting<Tier>('tier').then((v) => setTier(v ?? 'free'));
    load();
    window.addEventListener('gamify-tier', load);
    return () => window.removeEventListener('gamify-tier', load);
  }, []);
  return tier;
}

export const LOCAL_TEACHER_ID = 'local-teacher';
