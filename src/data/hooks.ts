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
  const { value } = useAsync<Tier | undefined>(() => data.getSetting<Tier>('tier'));
  return value ?? 'free';
}

export const LOCAL_TEACHER_ID = 'local-teacher';
