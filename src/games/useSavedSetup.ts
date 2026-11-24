import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { data } from '../data';

// A game's setup choices (board, sets, options, theme...) remembered per
// game on this device, so a teacher sets a game up once. `start` wins over
// the saved choices for this visit (for example the way to play picked in
// Play or share), until the teacher changes it here.
export function useSavedSetup<T extends object>(gameId: string, defaults: T, start?: Partial<T>): [T, (patch: Partial<T>) => void] {
  const [value, setValue] = useState<T>(() => ({ ...defaults, ...start }));
  useEffect(() => {
    let live = true;
    data.getSetting<Partial<T>>(`setup:${gameId}`).then((v) => { if (live && v) setValue((cur) => ({ ...cur, ...v, ...start })); });
    return () => { live = false; };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  function update(patch: Partial<T>) {
    setValue((cur) => {
      const next = { ...cur, ...patch };
      void data.setSetting(`setup:${gameId}`, next);
      return next;
    });
  }
  return [value, update];
}

// Play or share's "On the big screen" opens a game with ?teams=..., so the
// way step opens on Share (teams) then, not on Solo (2026-11-24).
export function useHostTeams(): boolean {
  return new URLSearchParams(useLocation().search).has('teams');
}
