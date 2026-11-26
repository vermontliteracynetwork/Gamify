import { useCallback, useEffect, useState } from 'react';
import { data } from '../data';
import { easternToday } from './tags';

// The Theme Building Challenge's ongoing public vote (owner, 2026-11-26):
// anyone with the link picks a top 3 (each pick counts the same) once per
// device per day for each special day, and each class can cast one group vote
// a day from the teacher's account. Kept on this device until cloud accounts
// share themes and votes with every visitor (Stage 5).
const KEY = 'challenge-votes';
export const MAX_PICKS = 3;

interface Ballot { date: string; day: string; picks: string[]; classId?: string }
export interface VoteStore { ballots: Ballot[] }

export async function loadVotes(): Promise<VoteStore> {
  return (await data.getSetting<VoteStore>(KEY)) ?? { ballots: [] };
}

export function tally(store: VoteStore, day: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of store.ballots) if (b.day === day) for (const id of b.picks) out[id] = (out[id] ?? 0) + 1;
  return out;
}

// Has this device (or this class) already voted today for this special day?
export function votedToday(store: VoteStore, day: string, classId?: string, today = easternToday()): boolean {
  return store.ballots.some((b) => b.day === day && b.date === today && (b.classId ?? '') === (classId ?? ''));
}

export async function castVote(day: string, picks: string[], classId?: string, today = easternToday()): Promise<VoteStore> {
  const store = await loadVotes();
  const clean = [...new Set(picks)].slice(0, MAX_PICKS);
  if (!clean.length || votedToday(store, day, classId, today)) return store;
  const next = { ballots: [...store.ballots, { date: today, day, picks: clean, ...(classId ? { classId } : {}) }] };
  await data.setSetting(KEY, next);
  return next;
}

export function useVotes() {
  const [store, setStore] = useState<VoteStore>({ ballots: [] });
  const reload = useCallback(() => { void loadVotes().then(setStore); }, []);
  useEffect(reload, [reload]);
  return { store, setStore };
}
